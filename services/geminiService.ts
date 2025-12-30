import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, NEURAL_GATEWAY_ASSISTANT_PROMPT, CCTV_SYSTEM_PROMPT, UNIFIED_SYSTEM_PROMPT, MENU_ENGINEERING_PROMPT, STRATEGY_PROMPT, KITCHEN_OPTIMIZER_PROMPT } from "../constants";
import { RecipeCard, SOP, StrategyReport, UnifiedSchema, CCTVAnalysisResult, User, MenuGenerationRequest, MenuItem, InventoryItem, KitchenDesign, MenuStructure, DesignElement, PurchaseOrder, Task, ManualSalesEntry, ManualPurchaseEntry, ManualExpenseEntry, ManualManpowerEntry } from "../types";

/**
 * TECHNICAL PROVISION: Triggers the AI Studio Key Selection Dialog.
 */
export const openNeuralGateway = async (): Promise<boolean> => {
    if ((window as any).aistudio) {
        try {
            await (window as any).aistudio.openSelectKey();
            return true;
        } catch (e) {
            console.error("Nexus Gateway: Handshake failed:", e);
            return false;
        }
    }
    return hasValidApiKey();
};

export const hasValidApiKey = (): boolean => {
    const key = process.env.API_KEY;
    const isInvalid = !key || 
                      String(key).toLowerCase() === "undefined" || 
                      String(key).toLowerCase() === "null" || 
                      String(key).trim() === "" ||
                      String(key).includes("YOUR_API_KEY");
                         
    return !isInvalid && String(key).trim().length > 8;
};

const getAI = () => {
    // Guidelines: Create new instance right before call to ensure up-to-date key
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

const handleNeuralError = async (err: any) => {
    const errorMsg = String(err?.message || JSON.stringify(err) || err);
    
    // Explicitly check for leaked key (403), invalid entity, or missing key
    if (
        errorMsg.includes("leaked") || 
        errorMsg.includes("PERMISSION_DENIED") || 
        errorMsg.includes("Requested entity was not found") || 
        errorMsg.includes("API key not valid")
    ) {
        console.warn("Nexus Gateway: Neural link compromised or invalid. Initiating secure re-selection...");
        if ((window as any).aistudio) {
            // Assume the user will select a valid key and proceed
            await (window as any).aistudio.openSelectKey();
        }
        throw new Error("NEURAL_LINK_COMPROMISED: Your API key was reported as leaked or invalid. Please select a fresh key in the dialog.");
    }
    throw err;
};

export const cleanAndParseJSON = <T>(text: string): T => {
    try {
        let cleaned = text.trim();
        
        // Remove markdown code blocks if the model stutters with formatting
        if (cleaned.includes("```")) {
            cleaned = cleaned.replace(/```(?:json)?/g, "").trim();
        }

        // Locate the outermost matching braces to isolate the JSON object
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            // Fallback: Check for array if object isn't found
            const firstBracket = cleaned.indexOf('[');
            const lastBracket = cleaned.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
                return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1)) as T;
            }
            throw new Error("Missing JSON structure in neural response.");
        }
        
        const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Neural Extraction Failure. Raw output snippet:", text.substring(0, 150));
        throw new Error("Neural response interpretation failed: Invalid formatting.");
    }
};

/**
 * Extract structured restaurant financial data from an image or PDF.
 */
export const extractDataFromDocument = async (
    base64Data: string, 
    mimeType: string,
    contextCategory: string
): Promise<{
    sales?: ManualSalesEntry[];
    purchases?: ManualPurchaseEntry[];
    expenses?: ManualExpenseEntry[];
    manpower?: ManualManpowerEntry[];
}> => {
    try {
        const ai = getAI();
        const prompt = `
            Act as a Senior Restaurant Accountant. Analyze this document and extract financial data.
            Categorize line items into: 
            1. purchases (Raw materials like Ghee, Butter, Groceries, Veg, Meat)
            2. expenses (Overheads like Rent, Utility/Gas/Elec, Marketing, Packaging)
            3. manpower (Staff salaries/wages)
            4. sales (Total revenue and order count if this is a sales report)
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: base64Data.split(',')[1] || base64Data } }
                ]
            },
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sales: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, revenue: { type: Type.NUMBER }, orderCount: { type: Type.NUMBER }, channel: { type: Type.STRING } } } },
                        purchases: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, supplier: { type: Type.STRING }, amount: { type: Type.NUMBER }, category: { type: Type.STRING } } } },
                        expenses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, type: { type: Type.STRING }, amount: { type: Type.NUMBER }, note: { type: Type.STRING } } } },
                        manpower: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, staffCount: { type: Type.NUMBER }, totalSalaries: { type: Type.NUMBER }, overtimeHours: { type: Type.NUMBER } } } }
                    }
                },
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });

        return cleanAndParseJSON(response.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const analyzeUnifiedRestaurantData = async (data: any): Promise<UnifiedSchema> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${UNIFIED_SYSTEM_PROMPT}\nData: ${JSON.stringify(data)}`,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        health_score: { type: Type.NUMBER },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['summary', 'health_score', 'recommendations']
                },
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        return cleanAndParseJSON<UnifiedSchema>(res.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const analyzeStaffMovement = async (
    desc: string, 
    zones: string[], 
    recipeContext?: RecipeCard, 
    sopContext?: SOP,
    frames: string[] = [] 
): Promise<CCTVAnalysisResult> => {
    try {
        const ai = getAI();
        const contentParts: any[] = [{ text: `${CCTV_SYSTEM_PROMPT}\nFootage: ${desc}\nZones: ${zones.join(', ')}` }];
        frames.forEach((f) => contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: f.split(',')[1] || f } }));

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: contentParts },
            config: { 
                responseMimeType: "application/json", 
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        
        return cleanAndParseJSON<CCTVAnalysisResult>(response.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateRecipeCard = async (
    userId: string, 
    item: MenuItem, 
    reqs: string,
    location?: string,
    persona?: string
): Promise<RecipeCard> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Task: Technical culinary spec sheet for ${item.name} at ${location || 'India'}. Persona: ${persona || 'Executive Chef'}. Requirements: ${reqs}.`,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        
        const result = cleanAndParseJSON<RecipeCard>(response.text || '{}');
        const sources: { title: string; uri: string }[] = [];
        response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
            if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        });
        result.sources = sources;
        return result;
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateSOP = async (topic: string): Promise<SOP> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate Standard Operating Procedure for: ${topic}`,
            config: { 
                responseMimeType: 'application/json', 
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return cleanAndParseJSON(res.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateStrategy = async (u: User, q: string, c: string): Promise<StrategyReport> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Target Goal: ${q}\nRestaurant Context: ${u.restaurantName} (${u.cuisineType}) located in ${u.location}.\nHistorical Operational Data: ${c}`,
            config: { 
                systemInstruction: STRATEGY_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.ARRAY, items: { type: Type.STRING } },
                        causes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        action_plan: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    initiative: { type: Type.STRING }, 
                                    impact_estimate: { type: Type.STRING }, 
                                    cost_estimate: { type: Type.STRING }, 
                                    priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] } 
                                } 
                            } 
                        },
                        seasonal_menu_suggestions: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    type: { type: Type.STRING, enum: ['add', 'remove'] }, 
                                    item: { type: Type.STRING }, 
                                    reason: { type: Type.STRING } 
                                } 
                            } 
                        },
                        roadmap: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    phase_name: { type: Type.STRING }, 
                                    duration: { type: Type.STRING }, 
                                    steps: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                                    milestone: { type: Type.STRING } 
                                } 
                            } 
                        }
                    },
                    required: ['summary', 'causes', 'action_plan', 'seasonal_menu_suggestions', 'roadmap']
                },
                thinkingConfig: { thinkingBudget: 8192 }
            }
        });
        return cleanAndParseJSON<StrategyReport>(response.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateMarketingImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio as any } }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        throw new Error("Visual generation failed.");
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateMarketingVideo = async (refImages: string[], prompt: string, aspectRatio: '16:9' | '9:16' | '1:1'): Promise<string> => {
    try {
        const ai = getAI();
        const validAspectRatio = (aspectRatio === '1:1') ? '16:9' : aspectRatio;
        
        const config: any = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: validAspectRatio
        };

        const params: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config
        };

        if (refImages && refImages.length > 0) {
            params.image = {
                imageBytes: refImages[0].split(',')[1] || refImages[0],
                mimeType: 'image/png',
            };
        }

        let operation = await ai.models.generateVideos(params);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed: No output URI.");
        
        return `${downloadLink}&key=${process.env.API_KEY}`;
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateMenu = async (req: MenuGenerationRequest): Promise<string> => {
    try {
        const ai = getAI();
        const prompt = `Task: Restaurant Menu Engineering. Restaurant: ${req.restaurantName}.`;
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        return res.text || '{}';
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const getChatResponse = async (h: any[], i: string): Promise<string> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: i,
            config: { systemInstruction: NEURAL_GATEWAY_ASSISTANT_PROMPT }
        });
        return res.text || '';
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const analyzeMenuEngineering = async (i: any[]): Promise<any[]> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${MENU_ENGINEERING_PROMPT}\nData: ${JSON.stringify(i)}`,
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON<any[]>(res.text || '[]');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const verifyLocationWithMaps = async (location: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Verify if "${location}" is a valid restaurant location.`,
            config: { tools: [{ googleMaps: {} }] }
        });
        return response.text || "Verified via Neural Maps Pass.";
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateKitchenDesign = async (title: string, length: number, width: number, cuisine: string, reqs: string): Promise<any> => {
    try {
        const ai = getAI();
        const prompt = `Act as a Professional Kitchen Architect. Create a detailed layout for "${title}".
        Space Dimensions: ${length}ft x ${width}ft.
        Cuisine Focus: ${cuisine}.
        Special Directives: ${reqs}.
        
        Return JSON matching this structure:
        {
          "title": "string",
          "elements": [
            {
              "type": "equipment|wall|door|window",
              "equipment_type": "range|oven|sink|table|fridge|fryer|storage",
              "label": "string",
              "x": number (0-100),
              "y": number (0-100),
              "w": number (0-100),
              "h": number (0-100),
              "length_ft": number,
              "width_ft": number,
              "utility_req": { "power": "string", "water": boolean, "gas": boolean }
            }
          ],
          "workflow_notes": "string",
          "summary": "string"
        }
        
        Ensure a logical flow for the specified cuisine.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        
        return cleanAndParseJSON(response.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const optimizeKitchenDesign = async (design: KitchenDesign): Promise<DesignElement[]> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Optimize the following kitchen layout elements for better workflow efficiency: ${JSON.stringify(design.elements)}. 
            Dimensions: ${design.dimensions.length}x${design.dimensions.width} ${design.dimensions.unit}.`,
            config: {
                systemInstruction: KITCHEN_OPTIMIZER_PROMPT,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        return cleanAndParseJSON<DesignElement[]>(response.text || '[]');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generatePurchaseOrder = async (supplier: string, items: InventoryItem[]): Promise<PurchaseOrder> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a Purchase Order for supplier ${supplier} based on these low stock items: ${JSON.stringify(items)}.`,
            config: {
                responseMimeType: "application/json",
                systemInstruction: "You are a procurement assistant. Return a JSON object matching the PurchaseOrder interface."
            }
        });
        return cleanAndParseJSON<PurchaseOrder>(response.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateKitchenWorkflow = async (description: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Design an optimized kitchen workflow based on this description and pain points: ${description}`,
            config: {
                systemInstruction: "You are a kitchen operations consultant. Provide a detailed, professional workflow design in markdown format.",
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        return response.text || '';
    } catch (e) {
        return handleNeuralError(e);
    }
};