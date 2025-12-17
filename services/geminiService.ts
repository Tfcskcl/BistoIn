
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, CCTV_SYSTEM_PROMPT, CCTV_INTEGRATION_PROMPT, UNIFIED_SYSTEM_PROMPT } from "../constants";
import { RecipeCard, SOP, StrategyReport, UnifiedSchema, CCTVAnalysisResult, User, MenuGenerationRequest, MenuItem, Ingredient, PurchaseOrder, InventoryItem } from "../types";

const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
};

export const hasValidApiKey = () => !!getApiKey();

const createAIClient = () => {
    const key = getApiKey();
    return key ? new GoogleGenAI({ apiKey: key }) : null;
};

// --- HELPER ---
export const cleanAndParseJSON = <T>(text: string): T => {
    try {
        // Remove markdown code blocks if present
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as T;
    } catch (e) {
        throw new Error("Failed to parse JSON response");
    }
};

// --- MOCK ENGINES ---
const generateMockRecipe = (name: string): RecipeCard => ({
    sku_id: 'MOCK-001', name: name, category: 'main', prep_time_min: 20, current_price: 0,
    ingredients: [{ ingredient_id: '1', name: 'Mock Ingredient', qty: '100g', cost_per_unit: 10, cost_per_serving: 5 }],
    yield: 1, preparation_steps: ['Mix ingredients.', 'Cook well.'], equipment_needed: ['Pan'],
    portioning_guideline: '1 bowl', allergens: [], shelf_life_hours: 24, food_cost_per_serving: 50,
    suggested_selling_price: 150, tags: ['Mock'], human_summary: 'A generated recipe.', confidence: 'High',
    cuisine: 'Fusion'
});

const generateMockCCTVAnalysis = (): CCTVAnalysisResult => ({
    events: [
        { event_id: 'e1', type: 'dwell', person_id: 'anon_1', zone_id: 'prep', start_time: new Date().toISOString(), confidence: 0.9, clip_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', mapped_step_id: null }
    ],
    workflow_correlations: [],
    inventory_impact: [{ item_id: 'Eggs', observed_shortage: true, shortage_qty: 12, related_events: [], root_cause: 'Missed delivery', recommendation: 'Order now', confidence: 0.8 }],
    bottlenecks: [{ zone_id: 'prep', severity: 'high', evidence: [], root_cause: 'Staff shortage', recommendation: 'Add staff', confidence: 0.85 }],
    sop_deviations: [{ step_id: 'Handwash', person_id: 'anon_1', deviation_type: 'skipped', confidence: 0.9, explanation: 'Did not wash hands on entry.' }],
    performance_scores: { kitchen_efficiency: 72, inventory_health: 65, congestion_score: 0.4 },
    recommendations: [{ type: 'staffing', priority: 'high', text: 'Increase prep staff.', expected_impact: 'Reduce delays', confidence: 0.9 }],
    summary_report: 'Prep zone is congested due to low staff.',
    processing_time_ms: 500, model_version: 'mock', warnings: []
});

const generateMockUnifiedAnalysis = (): UnifiedSchema => ({
    workflow_analysis: { efficiency: 75, bottlenecks: ['Prep'] },
    sop_compliance: { rate: 0.82, violations: ['Handwash'] },
    inventory_verification: { discrepancies: [{ item: 'Oil', variance: '-2L' }] },
    wastage_root_causes: ['Over-portioning in assembly'],
    recipe_costing_impact: { cost_increase: '5%' },
    profitability_insights: { top_performer: 'Burger', low_margin: 'Salad' },
    strategy_plan_7_days: { focus: 'Reduce Waste' },
    marketing_assets: { campaign_ideas: ['Zero Waste Week'] },
    summary: 'Overall efficiency is good, but inventory variance in oil suggests SOP drift.'
});

// --- SERVICES ---

export const generateRecipeCard = async (userId: string, item: any, reqs: string, loc?: string, persona?: string): Promise<RecipeCard> => {
    const ai = createAIClient();
    if (!ai) return generateMockRecipe(item.name);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate recipe for ${item.name}. Context: ${reqs}. Location: ${loc}. Persona: ${persona}. JSON ONLY matching RecipeCard schema.`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch { return generateMockRecipe(item.name); }
};

export const analyzeStaffMovement = async (desc: string, zones: string[]): Promise<CCTVAnalysisResult> => {
    const ai = createAIClient();
    if (!ai) return generateMockCCTVAnalysis();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${CCTV_SYSTEM_PROMPT}\nAnalyze: ${desc}`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch { return generateMockCCTVAnalysis(); }
};

export const analyzeUnifiedRestaurantData = async (data: any): Promise<UnifiedSchema> => {
    const ai = createAIClient();
    if (!ai) return generateMockUnifiedAnalysis();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${UNIFIED_SYSTEM_PROMPT}\nData: ${JSON.stringify(data)}`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch { return generateMockUnifiedAnalysis(); }
};

export const addCCTVCamera = async (details: any): Promise<any> => {
    // Return mock registration
    return {
        camera_registration: { rtsp_valid: true, calibration_score: 85 },
        sensor_configuration: { movement_sensor: true, linked_sops: ['SOP-001'] },
        summary_report: "Camera registered successfully."
    };
};

export const generateMarketingImage = async (prompt: string, aspectRatio: string): Promise<string> => `https://pollinations.ai/p/${encodeURIComponent(prompt)}`;

export const generateMarketingVideo = async (images: string[], prompt: string, aspectRatio: string): Promise<string> => "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const generateStrategy = async (user: User, query: string, context: string): Promise<StrategyReport> => {
    const ai = createAIClient();
    if (!ai) {
        return {
            summary: ["Mock strategy summary."],
            action_plan: [{ initiative: "Mock Action", impact_estimate: "High", cost_estimate: "Low", priority: "High" }],
            seasonal_menu_suggestions: [],
            roadmap: [],
            causes: []
        };
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Role: F&B Strategist. User Context: ${JSON.stringify(user)}. Data Context: ${context}. Query: ${query}. Output JSON StrategyReport.`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch (e) {
        throw new Error("Strategy generation failed");
    }
};

export const generateImplementationPlan = async (strategy: any): Promise<any> => {
    return { steps: ["Step 1", "Step 2"] };
};

export const generateMenu = async (request: MenuGenerationRequest): Promise<string> => {
    const ai = createAIClient();
    if (!ai) {
        return JSON.stringify({ 
            title: request.restaurantName, 
            tagline: "Generated Offline Mode",
            currency: "₹",
            sections: [
                { title: "Starters", items: [{ name: "Mock Item 1", price: "200", description: "Delicious mock starter", tags: ["Veg"] }] }
            ] 
        });
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a menu structure JSON for ${request.restaurantName}. Type: ${request.cuisineType}. Theme: ${request.themeStyle}. Items: ${request.mustIncludeItems}. Pricing: ${request.pricingStrategy}.`,
            config: { responseMimeType: 'application/json' }
        });
        return response.text || '';
    } catch {
        throw new Error("Menu generation failed");
    }
};

export const generateSOP = async (topic: string): Promise<SOP> => {
    const ai = createAIClient();
    if (!ai) return { sop_id: '1', title: topic, scope: 'Mock Scope', prerequisites: '', materials_equipment: [], stepwise_procedure: [], critical_control_points: [], monitoring_checklist: [], kpis: [], quick_troubleshooting: '' };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate SOP for ${topic} in F&B context. JSON ONLY matching SOP schema.`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch {
        throw new Error("SOP generation failed");
    }
};

export const generateKitchenWorkflow = async (description: string): Promise<string> => {
    const ai = createAIClient();
    if (!ai) return "# Workflow Draft\n\n1. Receive Order\n2. Prep\n3. Cook\n4. Serve";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a kitchen workflow optimization plan based on this description: ${description}. Output in Markdown.`
        });
        return response.text || '';
    } catch {
        return "Failed to generate workflow.";
    }
};

export const generatePurchaseOrder = async (supplier: string, items: InventoryItem[]): Promise<PurchaseOrder> => {
    // Logic to calculate quantities based on par levels
    const orderItems = items
        .filter(i => i.currentStock < i.parLevel)
        .map(i => ({
            name: i.name,
            qty: i.parLevel - i.currentStock,
            unit: i.unit,
            estimatedCost: (i.parLevel - i.currentStock) * i.costPerUnit
        }));
    
    const total = orderItems.reduce((acc, i) => acc + i.estimatedCost, 0);

    return {
        id: `PO-${Date.now()}`,
        supplier,
        items: orderItems,
        totalEstimatedCost: total,
        status: 'draft',
        generatedDate: new Date().toISOString(),
        emailBody: `Dear ${supplier},\n\nPlease find attached purchase order for the following items:\n${orderItems.map(i => `- ${i.name}: ${i.qty} ${i.unit}`).join('\n')}\n\nExpected delivery: Tomorrow.\n\nThanks.`
    };
};

export const getChatResponse = async (history: {role: string, text: string}[], input: string): Promise<string> => {
    const ai = createAIClient();
    if (!ai) return "I am in offline mode. Please connect API key to chat.";
    
    // Convert history to Gemini format if needed, or just append to prompt for simple stateless call
    // Using simple generateContent for now since history is managed by client
    const prompt = `History:\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}\nUser: ${input}\nAssistant:`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || '';
    } catch {
        return "I encountered an error processing your request.";
    }
};

export const verifyLocationWithMaps = async (location: string): Promise<string> => {
    const ai = createAIClient();
    if (!ai) return "Mock Location Verification: " + location;
    // In real app, this would use googleMaps tool
    return `Verified coordinates for ${location} (Simulated)`;
};

export const substituteIngredient = async (recipe: RecipeCard, ingredientName: string, location?: string): Promise<RecipeCard> => {
    const ai = createAIClient();
    if (!ai) return recipe;
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest a substitute for ${ingredientName} in the recipe ${recipe.name}. Location: ${location}. Return full updated RecipeCard JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch { return recipe; }
};

export const generateRecipeVariation = async (userId: string, recipe: RecipeCard, type: string, location?: string): Promise<RecipeCard> => {
    const ai = createAIClient();
    if (!ai) return recipe;
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a ${type} variation of this recipe: ${JSON.stringify(recipe)}. Location: ${location}. Return full RecipeCard JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch { return recipe; }
};

export const estimateMarketRates = async (ingredients: string[], location: string): Promise<Record<string, number>> => {
     const ai = createAIClient();
    if (!ai) return {};
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Estimate market prices for these ingredients in ${location}: ${ingredients.join(', ')}. Return JSON { "ingredient_name": price_number }. Currency INR.`,
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || '{}');
    } catch { return {}; }
};
