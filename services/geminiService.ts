
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, CCTV_SYSTEM_PROMPT, UNIFIED_SYSTEM_PROMPT, MENU_ENGINEERING_PROMPT, STRATEGY_PROMPT } from "../constants";
import { RecipeCard, SOP, StrategyReport, UnifiedSchema, CCTVAnalysisResult, User, MenuGenerationRequest, MenuItem, InventoryItem, KitchenDesign, MenuStructure } from "../types";

/**
 * Internal helper to safely initialize the AI client.
 * Strictly validates the process.env.API_KEY to prevent library-level crashes.
 */
const getAI = () => {
    const key = process.env.API_KEY;
    const isInvalid = !key || 
                      String(key).trim() === "" || 
                      String(key).toLowerCase() === "undefined" || 
                      String(key).toLowerCase() === "null" ||
                      String(key).length < 8;

    if (isInvalid) {
        throw new Error("NEURAL_GATEWAY_STANDBY: System requires a valid API Key. Please establish a link via Nexus Control.");
    }
    
    return new GoogleGenAI({ apiKey: String(key).trim() });
};

export const hasValidApiKey = (): boolean => {
    const key = process.env.API_KEY;
    return !!key && 
           String(key).toLowerCase() !== "undefined" && 
           String(key).toLowerCase() !== "null" && 
           String(key).trim().length >= 8;
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
    const ai = getAI();

    const contentParts: any[] = [{ text: `${CCTV_SYSTEM_PROMPT}\nFootage: ${desc}\nZones: ${zones.join(', ')}` }];
    frames.forEach((f) => contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: f.split(',')[1] || f } }));

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: contentParts },
        config: { 
            responseMimeType: "application/json", 
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    return cleanAndParseJSON<CCTVAnalysisResult>(response.text || '{}');
};

export const generateChecklistFromAnalysis = async (analysis: CCTVAnalysisResult): Promise<string[]> => {
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
};

export const generateRevisedSOPFromAnalysis = async (analysis: CCTVAnalysisResult, currentSop?: SOP): Promise<SOP> => {
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
};

export const generateRecipeCard = async (
    userId: string, 
    item: MenuItem, 
    reqs: string,
    location?: string,
    persona?: string
): Promise<RecipeCard> => {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Task: Technical culinary spec sheet for ${item.name} at ${location || 'India'}. 
        Persona: ${persona || 'Executive Chef'}. 
        Requirements: ${reqs}.
        
        CRITICAL INSTRUCTIONS:
        1. Use Google Search to find real-time market rates for all ingredients in ${location || 'India'}.
        2. Identify and explicitly list "Signature House-Made Components" (sauces, gravies, spice blends) used in this dish. 
        3. Break down the "Preparation Steps" into granular, single-action instructions suitable for visual documentation.
        4. Calculate suggested selling price based on current market volatility and professional food cost targets (25-30%).`,
        config: { 
            responseMimeType: "application/json",
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
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
                                is_signature: { type: Type.BOOLEAN, description: 'True if this is a house-made component' }
                            },
                            required: ['name', 'qty_per_serving', 'unit', 'cost_per_unit', 'cost_per_serving']
                        }
                    },
                    preparation_steps_data: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                instruction: { type: Type.STRING }
                            },
                            required: ['instruction']
                        }, 
                        description: 'Step-by-step instructions for visual layout' 
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
};

export const generateSOP = async (topic: string): Promise<SOP> => {
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
};

export const analyzeUnifiedRestaurantData = async (data: any): Promise<UnifiedSchema> => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${UNIFIED_SYSTEM_PROMPT}\nData: ${JSON.stringify(data)}`,
        config: { responseMimeType: 'application/json' }
    });
    return cleanAndParseJSON(res.text || '{}');
};

export const generateStrategy = async (u: User, q: string, c: string): Promise<StrategyReport> => {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Business Strategy for ${u.restaurantName} (Cuisine: ${u.cuisineType}, Location: ${u.location}). Goal: ${q}. Historical Data: ${c}`,
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
};

export const generateMarketingImage = async (prompt: string, ar: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: ar as any } }
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Visual generation failed.");
};

export const generateMarketingVideo = async (imgs: string[], prompt: string, ar: string): Promise<string> => {
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
};

export const generateMenu = async (req: MenuGenerationRequest): Promise<string> => {
    const ai = getAI();
    
    const prompt = `Task: Professional Restaurant Menu Engineering & Design.
    Restaurant: ${req.restaurantName}
    Cuisine: ${req.cuisineType}
    Target Audience: ${req.targetAudience || 'General public'}
    Price Segment: ${req.budgetRange || 'Moderate'}
    Season: ${req.season || 'All Season'}
    Must Include: ${req.mustIncludeItems || 'Chef specialties'}
    
    Requirements:
    1. Create a logical menu structure.
    2. Provide realistic pricing in INR.
    3. Include appetizing descriptions and pairing suggestions.`;

    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
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
                                            price: { type: Type.NUMBER },
                                            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            pairing: { type: Type.STRING }
                                        },
                                        required: ['name', 'description', 'price']
                                    }
                                }
                            },
                            required: ['title', 'items']
                        }
                    },
                    currency: { type: Type.STRING },
                    footer_note: { type: Type.STRING }
                },
                required: ['title', 'tagline', 'sections']
            }
        }
    });
    return res.text || '{}';
};

export const generateKitchenDesign = async (title: string, l: number, w: number, cuisine: string, reqs: string): Promise<KitchenDesign> => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Architectural Kitchen Layout Task. Restaurant: ${title}. Dimensions: ${l}x${w}ft. Cuisine: ${cuisine}. Requirements: ${reqs}. Use percentages for x, y, w, h.`,
        config: { 
            responseMimeType: 'application/json',
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
                                type: { type: Type.STRING, enum: ['equipment', 'wall', 'zone', 'door', 'window'] },
                                equipment_type: { type: Type.STRING, enum: ['range', 'oven', 'sink', 'table', 'fridge', 'dishwasher', 'storage', 'fryer'] },
                                label: { type: Type.STRING },
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER },
                                w: { type: Type.NUMBER },
                                h: { type: Type.NUMBER },
                                length_ft: { type: Type.NUMBER },
                                width_ft: { type: Type.NUMBER },
                                specifications: { type: Type.STRING },
                                utility_req: {
                                    type: Type.OBJECT,
                                    properties: {
                                        power: { type: Type.STRING },
                                        water: { type: Type.BOOLEAN },
                                        gas: { type: Type.BOOLEAN }
                                    }
                                }
                            },
                            required: ['type', 'label', 'x', 'y', 'w', 'h', 'length_ft', 'width_ft']
                        }
                    },
                    workflow_notes: { type: Type.STRING },
                    summary: { type: Type.STRING }
                },
                required: ['title', 'dimensions', 'elements', 'summary']
            }
        }
    });
    return cleanAndParseJSON<KitchenDesign>(res.text || '{}');
};

export const generateKitchenWorkflow = async (desc: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architectural Kitchen Workflow Optimization. Pain Points: ${desc}. Return Markdown report.`,
    });
    return response.text || 'Workflow generation failed.';
};

export const generatePurchaseOrder = async (s: string, i: any[]): Promise<any> => {
    return { id: 'PO-'+Date.now(), supplier: s, items: i, totalEstimatedCost: 0, status: 'draft', generatedDate: new Date().toISOString() };
};

export const getChatResponse = async (h: any[], i: string): Promise<string> => {
    const ai = getAI();
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: i });
    return res.text || '';
};

export const analyzeMenuEngineering = async (i: any[]): Promise<any[]> => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${MENU_ENGINEERING_PROMPT}\nData: ${JSON.stringify(i)}`,
        config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON<any[]>(res.text || '[]');
};

export const verifyLocationWithMaps = async (location: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Verify if "${location}" is a valid restaurant location. Provide a short description.`,
        config: { tools: [{ googleMaps: {} }] }
    });
    return response.text || "Verified via Neural Maps Pass.";
};
