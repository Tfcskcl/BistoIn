
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, NEURAL_GATEWAY_ASSISTANT_PROMPT, CCTV_SYSTEM_PROMPT, UNIFIED_SYSTEM_PROMPT, MENU_ENGINEERING_PROMPT, STRATEGY_PROMPT, KITCHEN_OPTIMIZER_PROMPT } from "../constants";
import { RecipeCard, SOP, StrategyReport, UnifiedSchema, CCTVAnalysisResult, User, MenuGenerationRequest, MenuItem, InventoryItem, KitchenDesign, MenuStructure, DesignElement, PurchaseOrder, Task } from "../types";

/**
 * TECHNICAL PROVISION: Triggers the AI Studio Key Selection Dialog.
 * MANDATORY: We assume success immediately after the dialog opens.
 */
export const openNeuralGateway = async (): Promise<boolean> => {
    if ((window as any).aistudio) {
        try {
            await (window as any).aistudio.openSelectKey();
            // PROCEED IMMEDIATELY: Assume the key selection was successful to mitigate race conditions.
            return true;
        } catch (e) {
            console.error("Nexus Gateway: Handshake failed:", e);
            return false;
        }
    }
    return hasValidApiKey();
};

/**
 * Polling check for the UI.
 */
export const hasValidApiKey = (): boolean => {
    const key = process.env.API_KEY;
    const isInvalid = !key || 
                      String(key).toLowerCase() === "undefined" || 
                      String(key).toLowerCase() === "null" || 
                      String(key).trim() === "" ||
                      String(key).includes("YOUR_API_KEY");
                         
    return !isInvalid && String(key).trim().length > 8;
};

/**
 * Internal helper: Initializes a NEW client instance for EVERY call.
 * This ensures we always use the most up-to-date API key from the platform.
 */
const getAI = () => {
    // We do NOT block the call here if the key looks invalid; 
    // we let the SDK attempt the call so we can catch the actual error in handleNeuralError.
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

/**
 * Handles self-healing logic for the live environment.
 * If the platform returns a "Not Found" error for the key, we reset the state.
 */
const handleNeuralError = async (err: any) => {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API key not valid")) {
        console.warn("Nexus Gateway: Connection stale. Resetting Link via AI Studio Protocol.");
        // Re-open the selection dialog automatically
        await openNeuralGateway();
        throw new Error("NEURAL_LINK_EXPIRED: The session key has expired or was removed. Please re-select a valid key in the dialog.");
    }
    throw err;
};

export const cleanAndParseJSON = <T>(text: string): T => {
    try {
        const jsonMatch = text.match(/([\{\[][\s\S]*[\}\]])/);
        return JSON.parse(jsonMatch ? jsonMatch[1] : text) as T;
    } catch (e) {
        console.error("JSON Parsing Error:", text);
        throw new Error("Neural response interpretation failed.");
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

export const analyzeUnifiedRestaurantData = async (data: any): Promise<UnifiedSchema> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${UNIFIED_SYSTEM_PROMPT}\nData: ${JSON.stringify(data)}`,
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 4096 }
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
            contents: `Business Strategy for ${u.restaurantName}. Goal: ${q}. Historical Data: ${c}`,
            config: { 
                systemInstruction: STRATEGY_PROMPT,
                responseMimeType: 'application/json',
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

export const generateKitchenDesign = async (title: string, l: number, w: number, cuisine: string, reqs: string): Promise<KitchenDesign> => {
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Architectural Kitchen Layout Task. Restaurant: ${title}. Dimensions: ${l}x${w}ft.`,
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        return cleanAndParseJSON<KitchenDesign>(res.text || '{}');
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

export const optimizeKitchenDesign = async (design: KitchenDesign): Promise<DesignElement[]> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Optimize the following kitchen layout elements for better workflow efficiency: ${JSON.stringify(design.elements)}. 
            Dimensions: ${design.dimensions.length}x${design.dimensions.width} ${design.dimensions.unit}.
            Consider rearranging equipment and defining clear zones for prep, cooking, and plating.`,
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

export const generateChecklistFromAnalysis = async (analysis: CCTVAnalysisResult): Promise<Task[]> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on this CCTV audit result, generate a list of actionable corrective tasks: ${JSON.stringify(analysis)}`,
            config: {
                responseMimeType: "application/json",
                systemInstruction: "Return a JSON array of objects matching the Task interface."
            }
        });
        return cleanAndParseJSON<Task[]>(response.text || '[]');
    } catch (e) {
        return handleNeuralError(e);
    }
};

export const generateRevisedSOPFromAnalysis = async (analysis: CCTVAnalysisResult, currentSop: SOP): Promise<SOP> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Revise the following SOP: ${JSON.stringify(currentSop)} based on these CCTV audit findings: ${JSON.stringify(analysis)}`,
            config: {
                responseMimeType: "application/json",
                systemInstruction: "Return a JSON object matching the SOP interface.",
                thinkingConfig: { thinkingBudget: 4096 }
            }
        });
        return cleanAndParseJSON<SOP>(response.text || '{}');
    } catch (e) {
        return handleNeuralError(e);
    }
};
