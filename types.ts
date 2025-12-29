export interface HygieneViolation {
    type: 'uncovered_food' | 'floor_hygiene' | 'gas_safety' | 'improper_storage' | 'spill';
    severity: 'low' | 'medium' | 'high';
    description: string;
    location: string;
    action_required: string;
}

export interface HygieneAudit {
    overall_hygiene_score: number;
    violations: HygieneViolation[];
    gas_hygiene_status: 'clean' | 'greasy' | 'unsafe';
    floor_status: 'clear' | 'debris' | 'slippery';
    storage_compliance: number;
}

export interface CashMovementSummary {
    total_received: number;
    total_withdrawals: number;
    drawer_discrepancies: number;
    transaction_count: number;
    drawer_open_frequency_score: number;
    withdrawal_logs: { timestamp: string; amount: number; purpose: string; authorized: boolean }[];
    receipt_logs: { timestamp: string; detected_amount: number; items_count: number; drawer_synced: boolean }[];
    expense_ratio: number;
    integrity_notes?: string;
}

export interface OperationalMetrics {
    order_volume: number;
    avg_prep_time_seconds: number;
    labor_cost_pct: number;
    wastage_rate: number;
}

export interface CCTVAnalysisResult {
    detected_area: FacilityArea;
    events: CCTVEvent[];
    workflow_correlations: WorkflowCorrelation[];
    inventory_impact: InventoryImpact[];
    bottlenecks: Bottleneck[];
    sop_deviations: SOPDeviation[];
    customer_interactions?: CustomerInteraction[];
    cash_movement?: CashMovementSummary;
    hygiene_audit?: HygieneAudit;
    positive_highlights?: string[];
    audit_context?: {
        recipe_name?: string;
        sop_title?: string;
    };
    staff_movement_summary?: StaffMovementSummary;
    performance_scores: {
        kitchen_efficiency: number;
        inventory_health: number;
        congestion_score: number;
        customer_sentiment_score?: number;
        financial_integrity_score?: number;
        hygiene_safety_score?: number;
    };
    operational_metrics?: OperationalMetrics;
    recommendations: Recommendation[];
    summary_report: string;
    processing_time_ms: number;
    model_version: string;
    warnings: string[];
    heatmap?: Record<string, number>; 
    dwell_times?: Record<string, number>;
}

export interface BehavioralPattern {
    pattern_id: 'PATTERN_1' | 'PATTERN_3' | 'PATTERN_5' | 'PATTERN_7' | 'PATTERN_8';
    name: string;
    detected: boolean;
    explanation: string;
    severity: 'low' | 'medium' | 'high';
}

export type FacilityArea = 'Kitchen' | 'Service Area' | 'Dining Area' | 'Storage';

export interface StaffMovementSummary {
    total_trips: number;
    high_traffic_zones: string[];
    avg_dwell_time_seconds: number;
    zone_dwell_times?: Record<string, number>; 
    unproductive_movement_pct: number;
    patterns?: BehavioralPattern[];
}

export interface Ingredient {
  ingredient_id: string;
  name: string;
  qty?: string;
  qty_per_serving?: number;
  cost_per_unit?: number;
  unit?: string;
  cost_per_serving?: number;
  waste_pct?: number;
  is_signature?: boolean; // Indicates a house-made component
}

export interface PreparationStep {
    instruction: string;
    imageUrl?: string;
    isGenerating?: boolean;
}

export interface MenuItem {
  sku_id: string;
  name: string;
  ingredients: Ingredient[];
  prep_time_min: number;
  category: 'main' | 'snack' | 'beverage' | 'dessert';
  current_price: number;
  food_cost_pct?: number; 
  food_cost_per_serving?: number; 
  margin_pct?: number; 
  is_essential?: boolean; 
}

export type MenuCategoryType = 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';

export interface MenuEngineeringItem extends MenuItem {
  popularity_score: number; 
  profitability_score: number; 
  contribution_margin: number;
  sales_volume: number;
  category_label: MenuCategoryType;
  ai_recommendation?: string;
}

export interface RecipeCard extends MenuItem {
  yield: number;
  preparation_steps_data: PreparationStep[];
  equipment_needed: string[];
  portioning_guideline: string;
  allergens: string[];
  shelf_life_hours: number;
  food_cost_per_serving: number;
  suggested_selling_price: number;
  tags: string[];
  human_summary?: string;
  imageUrl?: string;
  cuisine?: string;
  signature_components?: string[]; // List of house-made components
  sources?: { title: string; uri: string }[];
}

// --- Manual Data Entry Types ---

export interface ManualSalesEntry {
    id: string;
    date: string;
    revenue: number;
    orderCount: number;
    channel: 'Walk-in' | 'Online' | 'Takeaway';
}

export interface ManualPurchaseEntry {
    id: string;
    date: string;
    supplier: string;
    amount: number;
    category: string;
}

export interface ManualExpenseEntry {
    id: string;
    date: string;
    type: 'Rent' | 'Utility' | 'Marketing' | 'Maintenance' | 'Other';
    amount: number;
    note: string;
}

export interface ManualManpowerEntry {
    id: string;
    date: string;
    staffCount: number;
    totalSalaries: number;
    overtimeHours: number;
}

export interface IntegrationConfig {
    storeId: string;
    apiKey: string;
    apiSecret: string;
    webhookUrl?: string;
}

export enum AppView {
    DASHBOARD = 'DASHBOARD',
    RECIPES = 'RECIPES',
    SOP = 'SOP',
    STRATEGY = 'STRATEGY',
    VIDEO = 'VIDEO',
    INTEGRATIONS = 'INTEGRATIONS',
    BILLING = 'BILLING',
    MENU_GENERATOR = 'MENU_GENERATOR',
    KITCHEN_DESIGNING = 'KITCHEN_DESIGNING',
    MENU_ENGINEERING = 'MENU_ENGINEERING',
    INVENTORY = 'INVENTORY',
    CCTV_ANALYTICS = 'CCTV_ANALYTICS',
    KITCHEN_WORKFLOW = 'KITCHEN_WORKFLOW',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  CHEF = 'CHEF',
  ENTERPRISE = 'ENTERPRISE_ADMIN'
}

export enum PlanType {
  FREE = 'FREE',
  OPS_MANAGER = 'OPS_MANAGER',
  FULL_SYSTEM = 'FULL_SYSTEM',
  ENTERPRISE = 'ENTERPRISE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: PlanType;
  joinedDate: string;
  restaurantName: string;
  location: string;
  cuisineType: string;
  gstNumber?: string;
  fssaiNumber?: string;
  isTrial?: boolean;
  setupComplete: boolean;
  queriesUsed?: number;
  queryLimit?: number;
  credits: number;
  recipeQuota: number;
  sopQuota: number;
}

export interface DesignElement {
    type: 'equipment' | 'wall' | 'zone' | 'door' | 'window';
    equipment_type?: 'range' | 'oven' | 'sink' | 'table' | 'fridge' | 'dishwasher' | 'storage' | 'fryer';
    label: string;
    x: number; // percentage
    y: number; // percentage
    w: number; // percentage width relative to canvas
    h: number; // percentage height relative to canvas
    length_ft: number; // real-world dimension
    width_ft: number; // real-world dimension
    height_ft?: number; // real-world dimension
    description?: string;
    specifications?: string;
    utility_req?: {
        power?: string;
        water?: boolean;
        drain?: boolean;
        gas?: boolean;
    };
}

export interface KitchenDesign {
    id: string;
    title: string;
    dimensions: { length: number; width: number; unit: 'ft' | 'm' };
    elements: DesignElement[];
    workflow_notes: string;
    summary: string;
}

export interface KitchenDesignRequest {
    id: string;
    userId: string;
    userName: string;
    title: string;
    length: number;
    width: number;
    cuisineType: string;
    specialRequirements: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    completedDate?: string;
    designData?: KitchenDesign;
}

export interface KitchenWorkflowRequest {
    id: string;
    userId: string;
    userName: string;
    title: string;
    description: string;
    mediaFiles: {name: string, type: 'image' | 'video', size: string}[];
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    adminResponse?: string;
    completedDate?: string;
}

export type CameraProvider = 'EZVIZ' | 'HIKVISION' | 'DAHUA' | 'CP_PLUS' | 'GENERIC_RTSP';

export interface CameraFeed {
    id: string;
    name: string;
    url: string;
    provider: CameraProvider;
    area: FacilityArea;
    isActive: boolean;
    lastSynced?: string;
}

export interface SOP {
    sop_id: string;
    title: string;
    scope: string;
    prerequisites: string;
    materials_equipment: string[];
    stepwise_procedure: { step_no: number; action: string; responsible_role: string; time_limit?: string }[];
    critical_control_points: string[];
    monitoring_checklist: string[];
    kpis: string[];
    quick_troubleshooting: string;
}

export interface StrategyReport {
    summary: string[];
    causes: string[];
    action_plan: { initiative: string; impact_estimate: string; cost_estimate: string; priority: 'High' | 'Medium' | 'Low' }[];
    seasonal_menu_suggestions: { type: 'add' | 'remove'; item: string; reason: string }[];
    roadmap: { phase_name: string; duration: string; steps: string[]; milestone: string }[];
}

export interface UnifiedSchema {
    summary: string;
    health_score: number;
    recommendations: string[];
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    currentStock: number;
    unit: string;
    costPerUnit: number;
    parLevel: number;
    supplier: string;
    lastUpdated: string;
    imageUrl?: string;
}

export interface PurchaseOrder {
    id: string;
    supplier: string;
    items: { name: string; qty: number; unit: string }[];
    totalEstimatedCost: number;
    status: 'draft' | 'sent';
    generatedDate: string;
    emailBody?: string;
}

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    read: boolean;
    date: string;
}

export interface PlanConfig {
    name: string;
    price: number;
    description?: string;
    features: string[];
    color: string;
}

export interface OnboardingState {
    phaseIdx: number;
    data: any;
    completed: boolean;
}

export interface MarketingRequest {
    id: string;
    userId: string;
    userName: string;
    type: 'video' | 'image';
    prompt: string;
    aspectRatio: string;
    status: 'pending' | 'completed';
    requestDate: string;
    outputUrl?: string;
}

export interface MenuGenerationRequest {
    id: string;
    userId: string;
    userName: string;
    restaurantName: string;
    cuisineType: string;
    requestDate: string;
    generatedMenu?: any;
    themeStyle?: string;
    targetAudience?: string;
    budgetRange?: string;
    mustIncludeItems?: string;
    dietaryRestrictions?: string[];
    season?: string;
    pricingStrategy?: string;
}

export interface MenuStructure {
    title: string;
    tagline: string;
    sections: { title: string; items: { name: string; description: string; price: number; tags?: string[]; pairing?: string }[] }[];
    currency?: string;
    footer_note?: string;
}

export interface POSChangeRequest {
    id: string;
    itemId: string;
    itemName: string;
    newPrice: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface SocialStats {
    platform: string;
    followers: number;
    engagement: string;
}

export interface VisitorSession {
    id: string;
    location: string;
}

export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image: string;
    handler: (response: RazorpayResponse) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    notes: any;
    theme: {
        color: string;
    };
}

export interface WorkflowCorrelation { event_id: string; }
export interface InventoryImpact { ingredient: string; }
export interface Bottleneck { area: string; }
export interface SOPDeviation { deviation: string; }
export interface CustomerInteraction { sentiment: string; }
export interface Recommendation { action: string; }
export interface CCTVEvent { id: string; }

export interface SOPRequest {
    id: string;
    userId: string;
    userName: string;
    topic: string;
    status: 'pending' | 'completed';
    requestDate: string;
}

export interface RecipeRequest {
    id: string;
    userId: string;
    userName: string;
    dishName: string;
    cuisine?: string;
    status: 'pending' | 'completed';
    requestDate: string;
}

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    type: 'purchase' | 'usage';
    description: string;
    date: string;
}