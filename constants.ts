
import { MenuItem, Ingredient, PlanType } from './types';

export const SYSTEM_INSTRUCTION = `
You are BistroAssist — an expert F&B operations and menu-engineering assistant built for BistroIntelligence.
You read and write JSON, CSV and plain text. You produce: standardized recipe cards, costed ingredient sheets, SOPs, training modules, purchase lists, and strategy/analytics from restaurant data.
Always:
• Return STRICT machine-readable JSON. 
• If a human summary is required, include it as a field ('human_summary' or 'summary') WITHIN the JSON object. Do not add text outside the JSON block.
• Show assumptions and calculations step-by-step when doing costing or forecasting.
• Provide actionable next steps (3 priorities).
• Tag confidence for each recommendation (High/Medium/Low).
• Tone: professional, concise, operations-first. Units: INR, grams/ml/serving, dates ISO (YYYY-MM-DD).
`;

export const UNIFIED_SYSTEM_PROMPT = `
SYSTEM:
You are the unified AI engine for BistroConnect Insight — an AI-operated Restaurant OS.

Your responsibilities:
1. Analyze CCTV staff movement and track actions inside kitchen zones.
2. Identify workflow steps, SOP compliance, and bottlenecks.
3. Use recipe definitions to map expected steps vs. actual behavior.
4. Validate inventory consumption using:
   - CCTV-detected ingredient usage,
   - POS sales consumption,
   - Vendor stock data (BistroSupply).
5. Detect mismatches, wastage, misuse, shortfalls, or excess consumption.
6. Generate operational SOPs for each zone and role.
7. Calculate recipe costing, portion economics, food cost %, profitability.
8. Generate business strategy recommendations (menu, staff, layout, prep).
9. Produce marketing images/video scripts/ad copy based on business needs.
10. Always output machine-readable JSON exactly matching the described schema.

Follow these rules:
- Never identify staff personally. Use anonymized IDs (anon_01).
- Be analytical, factual, and structured.
- If data is missing/uncertain, explain assumptions and provide confidence scores.
- Always include root causes, impacts, and recommended corrective actions.
- Always include marketing ideas based on insights.
`;

export const CCTV_SYSTEM_PROMPT = `
You are the BistroConnect Insight Operational Brain for F&B. 
Your role: receive short video clips/frames (staff movement) and kitchen workflow context (SOP, recipe steps, order stream, raw material inventory events), then produce a unified, structured analysis that correlates movement patterns with workflow steps and inventory interactions.

Goals:
1. Map each staff movement event to an expected workflow step (if any). 
2. Detect SOP deviations, missing steps, incorrect sequencing, and inventory-driven friction (e.g., repeated trips to store due to missing ingredient).
3. Detect bottlenecks caused by staff allocation, layout, or raw-material shortages.
4. Produce prioritized, actionable recommendations (staffing, layout, reorder, recipe tweak).
5. Output machine-readable JSON (see schema) followed by a short human summary.
`;

export const CCTV_INTEGRATION_PROMPT = `
You are the Camera Integration Assistant for BistroConnect Insight.
Your job is to help users add and configure CCTV cameras inside restaurant kitchens and connect them to our AI-based operational analytics engine.
`;

export const MARKDOWN_INSTRUCTION = `
You are BistroAssist — an expert F&B operations consultant.
You produce high-quality, readable documents in Markdown format.
Use headers (#, ##), bullet points, bold text, and clear sections.
Tone: professional, actionable, and inspiring.
Do NOT return JSON. Return formatted text.
`;

export const APP_CONTEXT = `
You are BistroAssist, the AI assistant for BistroIntelligence.
You serve as a knowledgeable guide for restaurant owners, chefs, and managers.
Your capabilities include:
- Explaining app features (Recipe Hub, SOP Studio, Strategy AI, etc.)
- Providing operational advice for F&B businesses.
- Assisting with cost control, menu engineering, and marketing ideas.
Tone: Professional, helpful, concise, and industry-focused.
`;

// Dynamic Costing - Replaced with Direct Package Pricing
export const PACKAGES = {
    STARTER: {
        id: 'starter_pack',
        name: 'Starter Pack',
        price: 99,
        recipeQuota: 2,
        sopQuota: 0,
        desc: 'Generate 2 AI Recipes'
    },
    PAY_AS_YOU_GO: {
        id: 'payg_pack',
        name: 'Pay As You Go',
        price: 199,
        recipeQuota: 2,
        sopQuota: 1,
        desc: '2 Recipes + 1 SOP'
    }
};

export const CREDIT_COSTS = {
    RECIPE: 0, // Deprecated, using Quota
    SOP: 0,    // Deprecated, using Quota
    // Other features are currently free or bundled
    STRATEGY: 0,
    VIDEO: 0,
    IMAGE: 0,
    EXPERT_CONNECT: 0,
    WORKFLOW: 0,
    MENU_GEN: 0
};

export const SETUP_FEE = 99;

export const PLANS = {
  [PlanType.FREE]: {
    name: 'Pay As You Go',
    description: 'No monthly fee. Buy Recipe & SOP packs as needed.',
    price: 0,
    quarterlyPrice: 0, 
    features: ['Access to Recipe Generator', 'SOP Creation Tool', 'Standard Dashboard', 'Community Support'],
    color: 'slate'
  },
  [PlanType.OPS_MANAGER]: {
    name: 'Ops Manager',
    description: 'Full CCTV Intelligence & Workflow Automation.',
    price: 24999,
    quarterlyPrice: 71247, // 5% discount
    features: ['Unlimited AI Recipes & SOPs', 'Live CCTV AI Monitoring', 'Real-time Wastage Alerts', 'Productivity Tracking'],
    color: 'emerald'
  },
  [PlanType.FULL_SYSTEM]: {
    name: 'Full System',
    description: 'Complete OS for High-Volume Outlets.',
    price: 49999,
    quarterlyPrice: 134997, // 10% discount
    features: ['Everything in Ops Manager', 'Advanced Strategy AI', 'Marketing Studio Pro', 'Inventory Auto-Sync', 'Dedicated Account Manager'],
    color: 'purple'
  },
  [PlanType.ENTERPRISE]: {
    name: 'Enterprise Cluster',
    description: 'For Multi-Brand/Chain Operations (Up to 5 Outlets).',
    price: 149999,
    quarterlyPrice: 404997,
    features: ['Centralized Command Center', 'Brand-Specific SOPs', 'Offline/Local Server Option', 'Custom API Integrations', '24/7 Priority Support'],
    color: 'yellow'
  }
};

// Mock Data
export const MOCK_MENU: MenuItem[] = [
  {
    sku_id: "AC01",
    name: "Classic Acai Energy Bowl",
    category: "beverage",
    prep_time_min: 5,
    current_price: 499,
    ingredients: [
      { ingredient_id: "ING01", name: "Acai Puree", qty: "100 g" },
      { ingredient_id: "ING02", name: "Banana", qty: "50 g" },
      { ingredient_id: "ING03", name: "Granola", qty: "30 g" }
    ]
  },
  {
    sku_id: "AV02",
    name: "Smashed Avo Toast",
    category: "main",
    prep_time_min: 8,
    current_price: 350,
    ingredients: [
      { ingredient_id: "ING04", name: "Sourdough", qty: "2 slices" },
      { ingredient_id: "ING05", name: "Avocado", qty: "1 pc" },
      { ingredient_id: "ING06", name: "Feta", qty: "20 g" }
    ]
  },
  {
    sku_id: "SM03",
    name: "Mango Tango Smoothie",
    category: "beverage",
    prep_time_min: 3,
    current_price: 250,
    ingredients: [
      { ingredient_id: "ING07", name: "Frozen Mango", qty: "150 g" },
      { ingredient_id: "ING08", name: "Yogurt", qty: "100 ml" }
    ]
  }
];

export const MOCK_SALES_DATA = [
  { date: "2023-10-01", revenue: 12000, items_sold: 45 },
  { date: "2023-10-02", revenue: 15400, items_sold: 58 },
  { date: "2023-10-03", revenue: 11200, items_sold: 40 },
  { date: "2023-10-04", revenue: 18900, items_sold: 72 },
  { date: "2023-10-05", revenue: 22000, items_sold: 85 },
  { date: "2023-10-06", revenue: 25000, items_sold: 95 },
  { date: "2023-10-07", revenue: 24500, items_sold: 92 },
];

export const MOCK_INGREDIENT_PRICES = [
  { ingredient_id: "ING01", name: "Acai Puree", cost_per_unit: 1450, unit: "kg" },
  { ingredient_id: "ING02", name: "Banana", cost_per_unit: 60, unit: "kg" },
  { ingredient_id: "ING03", name: "Granola", cost_per_unit: 400, unit: "kg" },
  { ingredient_id: "ING04", name: "Sourdough", cost_per_unit: 20, unit: "slice" },
  { ingredient_id: "ING05", name: "Avocado", cost_per_unit: 80, unit: "pc" },
  { ingredient_id: "ING06", name: "Feta", cost_per_unit: 1200, unit: "kg" },
  { ingredient_id: "ING07", name: "Frozen Mango", cost_per_unit: 300, unit: "kg" },
  { ingredient_id: "ING08", name: "Yogurt", cost_per_unit: 100, unit: "l" },
];
