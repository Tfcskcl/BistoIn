
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, CCTV_SYSTEM_PROMPT, UNIFIED_SYSTEM_PROMPT, MENU_ENGINEERING_PROMPT, STRATEGY_PROMPT } from "../constants";
import { RecipeCard, SOP, StrategyReport, UnifiedSchema, CCTVAnalysisResult, User, MenuGenerationRequest, MenuItem, InventoryItem, KitchenDesign, MenuStructure } from "../types";

/**
 * TECHNICAL PROVISION: Triggers the AI Studio Key Selection Dialog.
 */
export const openNeuralGateway = async (): Promise<boolean> => {
    if ((window as any).aistudio) {
        try {
            // Trigger the secure platform dialog
            await (window as any).aistudio.openSelectKey();
            
            // MANDATORY: Assume success after triggering to mitigate race conditions.
            // Proceed as if the key is already injected into process.env.API_KEY.
            return true;
        } catch (e) {
            console.error("Nexus Gateway: Handshake initiation failed:", e);
            return false;
        }
    }
    // Fallback check for standard environments
    return hasValidApiKey();
};

/**
 * Global check for neural link health.
 * Validates either the platform selection or the env variable.
 */
export const hasValidApiKey = (): boolean => {
    const key = process.env.API_KEY;
    const isPlaceholder = !key || 
                         String(key).toLowerCase() === "undefined" || 
                         String(key).toLowerCase() === "null" || 
                         String(key).trim() === "";
                         
    return !isPlaceholder && String(key).trim().length >= 8;
};

/**
 * Internal helper to safely initialize the AI client.
 * Strictly initializes a NEW instance right before the call to use the latest key.
 */
const getAI = () => {
    const key = process.env.API_KEY;
    // We check validity here. If the user hasn't selected a key yet, we throw
    // a specific error that the UI can catch to prompt them.
    if (!key || String(key).trim().length < 8) {
        throw new Error("NEURAL_GATEWAY_STANDBY: System requires a valid API Key. Please establish a link via Nexus Control.");
    }
    return new GoogleGenAI({ apiKey: String(key).trim() });
};

/**
 * Handles the special case where a session is expired or key is revoked.
 * If "Requested entity was not found" is detected, it re-opens the selection dialog.
 */
const handleNeuralError = async (err: any) => {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes("Requested entity was not found")) {
        console.warn("Nexus Gateway: Authentication Expired or Entity Missing. Resetting Link.");
        // Re-prompt user immediately via standard dialog
        await openNeuralGateway();
        throw new Error("NEURAL_SESSION_RESET: Gateway link reset required. Please select your key in the platform dialog.");
    }
    throw err;
};

export const cleanAndParseJSON = <T>(text: string): T => {
    try {
        const jsonMatch = text.match(/([\{\[][\s\S]*[\}\]])/);
        return JSON.parse(jsonMatch ? jsonMatch[1] : text) as T;
    } catch (e) {
        console.error("JSON Parsing Error:", text);
        throw new Error("Failed to parse AI response.");
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

export const generateChecklistFromAnalysis = async (analysis: CCTVAnalysisResult): Promise<string[]> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a prioritized operational task checklist based on these CCTV analysis findings: ${JSON.stringify(analysis)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return cleanAndParseJSON<string[]>(response.text || '[]');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateRevisedSOPFromAnalysis = async (analysis: CCTVAnalysisResult, currentSop?: SOP): Promise<SOP> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Revise the standard operating procedure based on observed behavioral deviations and hygiene violations. 
            Analysis Data: ${JSON.stringify(analysis)}
            ${currentSop ? `Current SOP: ${JSON.stringify(currentSop)}` : ''}`,
            config: {
                responseMimeType: "application/json",
                systemInstruction: SYSTEM_INSTRUCTION,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sop_id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        scope: { type: Type.STRING },
                        prerequisites: { type: Type.STRING },
                        materials_equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
                        stepwise_procedure: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    step_no: { type: Type.NUMBER },
                                    action: { type: Type.STRING },
                                    responsible_role: { type: Type.STRING },
                                    time_limit: { type: Type.STRING }
                                },
                                required: ['step_no', 'action', 'responsible_role']
                            }
                        },
                        critical_control_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                        monitoring_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
                        kpis: { type: Type.ARRAY, items: { type: Type.STRING } },
                        quick_troubleshooting: { type: Type.STRING }
                    },
                    required: ['title', 'scope', 'stepwise_procedure']
                }
            }
        });
        return cleanAndParseJSON<SOP>(response.text || '{}');
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
            contents: `Task: Technical culinary spec sheet for ${item.name} at ${location || 'India'}. 
            Persona: ${persona || 'Executive Chef'}. 
            Requirements: ${reqs}.
            
            CRITICAL INSTRUCTIONS:
            1. Use Google Search to find real-time market rates for all ingredients in ${location || 'India'}.
            2. Identify and explicitly list "Signature House-Made Components" (sauces, gravies, spice blends) used in this dish. 
            3. Calculate suggested selling price based on current market volatility and professional food cost targets (25-30%).`,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 4096 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sku_id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        cuisine: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['main', 'snack', 'beverage', 'dessert'] },
                        prep_time_min: { type: Type.NUMBER },
                        yield: { type: Type.NUMBER },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    ingredient_id: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                    qty_per_serving: { type: Type.NUMBER },
                                    unit: { type: Type.STRING },
                                    cost_per_unit: { type: Type.NUMBER },
                                    cost_per_serving: { type: Type.NUMBER },
                                    is_signature: { type: Type.BOOLEAN }
                                },
                                required: ['name', 'qty_per_serving', 'unit', 'cost_per_unit', 'cost_per_serving']
                            }
                        },
                        preparation_steps_data: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: { instruction: { type: Type.STRING } },
                                required: ['instruction']
                            }
                        },
                        signature_components: { type: Type.ARRAY, items: { type: Type.STRING } },
                        equipment_needed: { type: Type.ARRAY, items: { type: Type.STRING } },
                        portioning_guideline: { type: Type.STRING },
                        allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                        shelf_life_hours: { type: Type.NUMBER },
                        food_cost_per_serving: { type: Type.NUMBER },
                        suggested_selling_price: { type: Type.NUMBER },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        human_summary: { type: Type.STRING }
                    },
                    required: [
                        'name', 'ingredients', 'preparation_steps_data', 'food_cost_per_serving', 
                        'suggested_selling_price', 'human_summary'
                    ]
                }
            }
        });
        
        const result = cleanAndParseJSON<RecipeCard>(response.text || '{}');
        
        const sources: { title: string; uri: string }[] = [];
        response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
            if (chunk.web) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
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
                systemInstruction: SYSTEM_INSTRUCTION,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sop_id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        scope: { type: Type.STRING },
                        prerequisites: { type: Type.STRING },
                        materials_equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
                        stepwise_procedure: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    step_no: { type: Type.NUMBER },
                                    action: { type: Type.STRING },
                                    responsible_role: { type: Type.STRING },
                                    time_limit: { type: Type.STRING }
                                },
                                required: ['step_no', 'action', 'responsible_role']
                            }
                        },
                        critical_control_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                        monitoring_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
                        kpis: { type: Type.ARRAY, items: { type: Type.STRING } },
                        quick_troubleshooting: { type: Type.STRING }
                    },
                    required: ['title', 'scope', 'stepwise_procedure']
                }
            }
        });
        return cleanAndParseJSON(res.text || '{}');
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
                thinkingConfig: { thinkingBudget: 4096 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        health_score: { type: Type.NUMBER },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['summary', 'health_score', 'recommendations']
                }
            }
        });
        return cleanAndParseJSON<UnifiedSchema>(res.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateStrategy = async (u: User, q: string, c: string): Promise<StrategyReport> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Business Strategy for ${u.restaurantName} (Cuisine: ${u.cuisineType}, Location: ${u.location}). Goal: ${q}. Historical Data: ${c}`,
            config: { 
                systemInstruction: STRATEGY_PROMPT,
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 8192 },
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
                                },
                                required: ['initiative', 'impact_estimate', 'cost_estimate', 'priority']
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
                                },
                                required: ['type', 'item', 'reason']
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
                                },
                                required: ['phase_name', 'duration', 'steps', 'milestone']
                            }
                        }
                    },
                    required: ['summary', 'causes', 'action_plan', 'seasonal_menu_suggestions', 'roadmap']
                }
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

export const generateMarketingVideo = async (imgs: string[], prompt: string, ar: string): Promise<string> => {
    try {
        const ai = getAI();
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: ar as any }
        });
        while (!operation.done) {
            await new Promise(r => setTimeout(r, 10000));
            operation = await ai.operations.getVideosOperation({ operation });
        }
        const link = operation.response?.generatedVideos?.[0]?.video?.uri;
        const res = await fetch(`${link}&key=${process.env.API_KEY}`);
        return URL.createObjectURL(await res.blob());
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateMenu = async (req: MenuGenerationRequest): Promise<string> => {
    try {
        const ai = getAI();
        const prompt = `Task: Restaurant Menu Engineering. Restaurant: ${req.restaurantName}. Cuisine: ${req.cuisineType}. Audience: ${req.targetAudience}. Pricing: ${req.budgetRange}.`;

        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 4096 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        tagline: { type: Type.STRING },
                        sections: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    items: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                description: { type: Type.STRING },
                                                price: { type: Type.NUMBER }
                                            },
                                            required: ['name', 'description', 'price']
                                        }
                                    }
                                },
                                required: ['title', 'items']
                            }
                        }
                    },
                    required: ['title', 'tagline', 'sections']
                }
            }
        });
        return res.text || '{}';
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateKitchenDesign = async (title: string, l: number, w: number, cuisine: string, reqs: string): Promise<KitchenDesign> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Architectural Kitchen Layout Task. Restaurant: ${title}. Dimensions: ${l}x${w}ft. Cuisine: ${cuisine}. Requirements: ${reqs}.`,
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 4096 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        dimensions: {
                            type: Type.OBJECT,
                            properties: {
                                length: { type: Type.NUMBER },
                                width: { type: Type.NUMBER },
                                unit: { type: Type.STRING }
                            },
                            required: ['length', 'width', 'unit']
                        },
                        elements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    label: { type: Type.STRING },
                                    x: { type: Type.NUMBER },
                                    y: { type: Type.NUMBER },
                                    w: { type: Type.NUMBER },
                                    h: { type: Type.NUMBER },
                                    length_ft: { type: Type.NUMBER },
                                    width_ft: { type: Type.NUMBER }
                                },
                                required: ['type', 'label', 'x', 'y', 'w', 'h', 'length_ft', 'width_ft']
                            }
                        },
                        summary: { type: Type.STRING }
                    },
                    required: ['title', 'dimensions', 'elements', 'summary']
                }
            }
        });
        return cleanAndParseJSON<KitchenDesign>(res.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateKitchenWorkflow = async (desc: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Architectural Kitchen Workflow Optimization. Pain Points: ${desc}. Return Markdown report.`,
        });
        return response.text || 'Workflow generation failed.';
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generatePurchaseOrder = async (s: string, i: any[]): Promise<any> => {
    return { id: 'PO-'+Date.now(), supplier: s, items: i, totalEstimatedCost: 0, status: 'draft', generatedDate: new Date().toISOString() };
};

export const getChatResponse = async (h: any[], i: string): Promise<string> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: i });
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
            contents: `Verify if "${location}" is a valid restaurant location. Provide a short description.`,
            config: { tools: [{ googleMaps: {} }] }
        });
        return response.text || "Verified via Neural Maps Pass.";
    } catch (e) {
        return handleNeuralError(e);
    }
};
