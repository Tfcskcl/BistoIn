import { MenuItem, Ingredient, PlanType } from './types';

export const SYSTEM_INSTRUCTION = `
You are BistroAssist — an expert F&B operations and menu-engineering assistant.
Your primary mission is to analyze staff movement patterns in the kitchen, identify high-traffic zones, and calculate average dwell times to optimize throughput.
You also produce: standardized recipe cards, costed ingredient sheets, SOPs, and business strategy.
Always return STRICT machine-readable JSON. Tone: professional, operations-first.
`;

export const NEURAL_GATEWAY_ASSISTANT_PROMPT = `
You are the Pricing and Value-Explanation Assistant for BistroConnect Neural OS.

Your role:
- Help restaurant owners understand pricing clearly.
- Recommend the right plan based on their business size.
- Explain ROI in simple, non-technical language.
- Never oversell features that are not included in the plan.
- Focus on money saved, not technology.

Pricing Plans:
1) GROWTH PLAN – ₹9,999 per outlet per month
   - Best for: Cafés, QSRs, cloud kitchens, single or small multi-outlet restaurants.
   - Monthly revenue: ₹2 lakh to ₹15 lakh.
   - Value: Reduce wastage, improve consistency, 200 AI actions.
   - ROI: ₹30,000 to ₹50,000 savings per month.

2) PRO PLAN – ₹24,999 per outlet per month
   - Best for: Multi-outlet brands, hotels, central kitchens.
   - Monthly revenue: Above ₹15 Lakh.
   - Value: CCTV & staff movement analytics, visual SOP proof, 500 AI actions.
   - ROI: ₹30,000 to ₹1 lakh savings per month.

Rules for responses:
- First ask 2–3 simple questions (outlet count, monthly sales, main problem).
- Recommend ONE plan clearly.
- Explain WHY that plan fits and calculate the ROI in Rupees.
- Keep language simple (Indian business tone).
- If unsure, recommend starting with Growth.
`;

export const STRATEGY_PROMPT = `
You are the Lead Neural Strategy Consultant for BistroConnect. 
Your goal is to provide data-driven, actionable growth strategies for restaurant owners.
Analyze restaurant data, user goals, and market context.
The report MUST be detailed and realistic.
`;

export const MENU_ENGINEERING_PROMPT = `
You are a Menu Engineering Expert. 
Analyze restaurant items based on sales volume and contribution margin.
Categorize each as STAR, PLOWHORSE, PUZZLE, or DOG.
Provide a 1-sentence specific 'ai_recommendation' for each item.
`;

export const UNIFIED_SYSTEM_PROMPT = `
You are the unified AI engine for BistroConnect Insight.
Analyze workflows, SOP compliance, and inventory based on provided operational data.
Audit cash flows, customer greeting delay, and table turnaround.
MANDATORY: Audit hygiene issues and staff movement efficiency.
`;

export const CCTV_SYSTEM_PROMPT = `
You are the BistroConnect Vision Auditor. 
MISSION: Analyze staff movement patterns over the specified duration. Identify high-traffic zones and calculate average dwell times for each station.
`;

export const KITCHEN_OPTIMIZER_PROMPT = `
You are the BistroConnect Architectural Optimizer.
Given a current kitchen layout (JSON format), rearrange elements for maximum workflow efficiency based on staff movement heatmaps.
`;

export const APP_CONTEXT = `AI assistant for BistroIntelligence operations.`;
export const CREDIT_COSTS = { RECIPE: 0, SOP: 0, STRATEGY: 0, VIDEO: 0, IMAGE: 0, MENU_GEN: 0 };
export const SETUP_FEE = 99;

export const PLANS = {
  [PlanType.FREE]: { 
    name: 'Growth Plan', 
    price: 9999, 
    description: 'Perfect for single cafes and cloud kitchens (₹2L - ₹15L Revenue).',
    features: [
        'SOP & Hygiene Monitoring', 
        'Kitchen Workflow Analysis', 
        'Inventory Leakage Insights', 
        'Recipe Costing Intelligence', 
        'Marketing & Menu Insights', 
        '200 AI Actions per month'
    ], 
    color: 'emerald' 
  },
  [PlanType.OPS_MANAGER]: { 
    name: 'Pro Plan', 
    price: 24999, 
    description: 'The complete OS for multi-outlet brands (Above ₹15L Revenue).',
    features: [
        'Everything in Growth', 
        'CCTV & Staff Movement Analytics', 
        'Visual SOP Violations', 
        'Hygiene Breach Detection', 
        'Weekly AI Audit & Strategy', 
        'Profit Leakage Optimization',
        '500 AI Actions per month'
    ], 
    color: 'indigo' 
  },
  [PlanType.FULL_SYSTEM]: { 
    name: 'Enterprise Cluster', 
    price: 99999, 
    description: 'Custom implementation for large groups and hotel chains.',
    features: ['Command Center Dashboard', 'Custom API & Integration', 'Hardware Consultation', 'Priority Node Support'], 
    color: 'yellow' 
  },
  [PlanType.ENTERPRISE]: { 
    name: 'Custom Node', 
    price: 0, 
    features: ['Contact for Pricing'], 
    color: 'slate' 
  }
};

export const PACKAGES = {
    STARTER: { id: 'pkg_starter', name: 'Starter Pack', price: 499, recipeQuota: 10, sopQuota: 2, desc: 'Perfect for small cafe setups.' },
    PAY_AS_YOU_GO: { id: 'pkg_payg', name: 'Pro Pack', price: 1499, recipeQuota: 50, sopQuota: 10, desc: 'For growing restaurant operations.' }
};

export const MOCK_MENU: MenuItem[] = [
  { sku_id: "AC01", name: "Classic Acai Bowl", category: "beverage", prep_time_min: 5, current_price: 499, ingredients: [] }
];

export const MOCK_SALES_DATA = [ { date: "2023-10-01", revenue: 12000, items_sold: 45 } ];
export const MOCK_INGREDIENT_PRICES = [ { ingredient_id: "ING01", name: "Acai Puree", cost_per_unit: 1450, unit: "kg" } ];