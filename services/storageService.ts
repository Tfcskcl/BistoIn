
import { RecipeCard, SOP, AppNotification, UserRole, POSChangeRequest, MenuItem, PlanConfig, PlanType, RecipeRequest, SOPRequest, MarketingRequest, CreditTransaction, SocialStats, KitchenDesignRequest, MenuGenerationRequest, InventoryItem, OnboardingState, Task, CCTVAnalysisResult, MenuStructure, KitchenWorkflowRequest, CameraFeed, ManualSalesEntry, ManualPurchaseEntry, ManualExpenseEntry, ManualManpowerEntry, IntegrationConfig } from '../types';
import { MOCK_MENU, MOCK_SALES_DATA, PLANS as DEFAULT_PLANS } from '../constants';
import { ingredientService } from './ingredientService';

const getKey = (userId: string, key: string) => `bistro_${userId}_${key}`;
const PLANS_KEY = 'bistro_system_plans';
const GLOBAL_NOTIFICATIONS_KEY = 'bistro_global_notifications';

export const storageEvents = {
  DATA_UPDATED: "bistroconnect-data-updated",
};

export function dispatchDataUpdatedEvent() {
  window.dispatchEvent(new CustomEvent(storageEvents.DATA_UPDATED));
}

const WELCOME_NOTIFICATION: AppNotification = {
    id: 'n_welcome',
    title: 'Welcome to BistroConnect',
    message: 'Your neural operating system is online. Audit hygiene and financials from CCTV now.',
    type: 'success',
    read: false,
    date: new Date().toISOString()
};

const MOCK_INV: InventoryItem[] = [
    { id: 'inv_1', name: 'Arborio Rice', category: 'Dry Goods', currentStock: 12, unit: 'kg', costPerUnit: 300, parLevel: 10, supplier: 'Metro', lastUpdated: new Date().toISOString() },
    { id: 'inv_2', name: 'Truffle Oil', category: 'Pantry', currentStock: 0.5, unit: 'l', costPerUnit: 1800, parLevel: 1, supplier: 'Gourmet Imports', lastUpdated: new Date().toISOString() },
];

const DEFAULT_TASKS: Task[] = [
    { id: 't1', text: 'Conduct hygiene sweep (Station 2)', completed: false, priority: 'high' },
    { id: 't2', text: 'Verify drawer discrepancy report', completed: false, priority: 'high' },
];

export interface CCTVHistoryItem extends CCTVAnalysisResult {
    timestamp: string;
    videoName: string;
}

export const storageService = {
    getItem: <T>(userId: string, key: string, defaultValue: T): T => {
        try {
            const stored = localStorage.getItem(getKey(userId, key));
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (e) { return defaultValue; }
    },
    setItem: (userId: string, key: string, data: any) => {
        localStorage.setItem(getKey(userId, key), JSON.stringify(data));
        dispatchDataUpdatedEvent();
    },
    clearAllData: () => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('bistro_') || key === 'theme')) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        window.location.reload();
    },
    seedDemoData: (userId: string) => {
        storageService.saveInventory(userId, MOCK_INV);
        storageService.saveTasks(userId, DEFAULT_TASKS);
        storageService.saveSalesData(userId, MOCK_SALES_DATA);
        ingredientService.seedDefaults(userId);
    },
    getOnboardingState: (userId: string): OnboardingState => storageService.getItem<OnboardingState>(userId, 'onboarding', { phaseIdx: 0, data: {}, completed: false }),
    saveOnboardingState: (userId: string, state: OnboardingState) => storageService.setItem(userId, 'onboarding', state),
    getPlans: (): Record<PlanType, PlanConfig> => {
        const stored = localStorage.getItem(PLANS_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_PLANS;
    },
    getUserQuotas: (userId: string): { recipe: number; sop: number } => ({
        recipe: storageService.getItem<number>(userId, 'quota_recipe', 10),
        sop: storageService.getItem<number>(userId, 'quota_sop', 5)
    }),
    updateQuotas: (userId: string, recipeDelta: number, sopDelta: number) => {
        const current = storageService.getUserQuotas(userId);
        storageService.setItem(userId, 'quota_recipe', Math.max(0, (current.recipe || 0) + recipeDelta));
        storageService.setItem(userId, 'quota_sop', Math.max(0, (current.sop || 0) + sopDelta));
    },
    addInvoice: (userId: string, invoice: any) => {
        const invoices = storageService.getInvoices(userId);
        invoices.push(invoice);
        storageService.setItem(userId, 'invoices', invoices);
    },
    getInvoices: (userId: string): any[] => storageService.getItem<any[]>(userId, 'invoices', []),
    getTasks: (userId: string): Task[] => storageService.getItem<Task[]>(userId, 'tasks', DEFAULT_TASKS),
    saveTasks: (userId: string, tasks: Task[]) => storageService.setItem(userId, 'tasks', tasks),
    getInventory: (userId: string): InventoryItem[] => storageService.getItem<InventoryItem[]>(userId, 'inventory', []),
    saveInventory: (userId: string, items: InventoryItem[]) => storageService.setItem(userId, 'inventory', items),
    getCCTVHistory: (userId: string): CCTVHistoryItem[] => storageService.getItem<CCTVHistoryItem[]>(userId, 'cctv_history', []),
    saveCCTVAnalysis: (userId: string, analysis: CCTVAnalysisResult, videoName: string) => {
        const history = storageService.getCCTVHistory(userId);
        const newItem = { ...analysis, timestamp: new Date().toISOString(), videoName };
        storageService.setItem(userId, 'cctv_history', [newItem, ...history].slice(0, 20));
    },
    getSavedRecipes: (userId: string): RecipeCard[] => storageService.getItem<RecipeCard[]>(userId, 'saved_recipes', []),
    saveRecipe: (userId: string, recipe: RecipeCard) => {
        const recipes = storageService.getSavedRecipes(userId);
        const idx = recipes.findIndex(r => r.sku_id === recipe.sku_id);
        if (idx >= 0) recipes[idx] = recipe; else recipes.push(recipe);
        storageService.setItem(userId, 'saved_recipes', recipes);
    },
    getSavedSOPs: (userId: string): SOP[] => storageService.getItem<SOP[]>(userId, 'saved_sops', []),
    saveSOP: (userId: string, sop: SOP) => {
        const sops = storageService.getSavedSOPs(userId);
        const idx = sops.findIndex(s => s.sop_id === sop.sop_id);
        if (idx >= 0) sops[idx] = sop; else sops.push(sop);
        storageService.setItem(userId, 'saved_sops', sops);
    },
    getSalesData: (userId: string): any[] => storageService.getItem<any[]>(userId, 'sales', []),
    saveSalesData: (userId: string, data: any[]) => storageService.setItem(userId, 'sales', data),
    getSocialStats: (userId: string): SocialStats[] => storageService.getItem<SocialStats[]>(userId, 'social_stats', []),
    saveSocialStats: (userId: string, stats: SocialStats[]) => storageService.setItem(userId, 'social_stats', stats),
    getPOSChangeRequests: (userId: string): POSChangeRequest[] => storageService.getItem<POSChangeRequest[]>(userId, 'pos_requests', []),
    updatePOSChangeRequest: (userId: string, requestId: string, status: 'approved' | 'rejected') => {
        const requests = storageService.getPOSChangeRequests(userId);
        const idx = requests.findIndex(r => r.id === requestId);
        if (idx >= 0) {
            requests[idx].status = status;
            storageService.setItem(userId, 'pos_requests', requests);
        }
    },
    getAllMarketingRequests: (): MarketingRequest[] => JSON.parse(localStorage.getItem('bistro_marketing') || '[]'),
    saveMarketingRequest: (r: MarketingRequest) => {
        const all = storageService.getAllMarketingRequests();
        all.push(r);
        localStorage.setItem('bistro_marketing', JSON.stringify(all));
        dispatchDataUpdatedEvent();
    },
    getKitchenDesigns: (userId: string): KitchenDesignRequest[] => storageService.getItem<KitchenDesignRequest[]>(userId, 'kitchen_designs', []),
    saveKitchenDesign: (userId: string, design: KitchenDesignRequest) => {
        const all = storageService.getKitchenDesigns(userId);
        all.push(design);
        storageService.setItem(userId, 'kitchen_designs', all);
    },
    deleteKitchenDesign: (userId: string, id: string) => {
        const all = storageService.getKitchenDesigns(userId);
        storageService.setItem(userId, 'kitchen_designs', all.filter(d => d.id !== id));
    },
    getAllMenuGenerationRequests: (): MenuGenerationRequest[] => JSON.parse(localStorage.getItem('bistro_menu_gen') || '[]'),
    saveMenuGenerationRequest: (r: MenuGenerationRequest) => {
        const all = storageService.getAllMenuGenerationRequests();
        all.push(r);
        localStorage.setItem('bistro_menu_gen', JSON.stringify(all));
        dispatchDataUpdatedEvent();
    },
    getNotifications: (userId: string): AppNotification[] => {
        const stored = JSON.parse(localStorage.getItem(GLOBAL_NOTIFICATIONS_KEY) || '[]');
        return stored.length ? stored : [WELCOME_NOTIFICATION];
    },
    markAsRead: (userId: string, id: string) => {
        const all = JSON.parse(localStorage.getItem(GLOBAL_NOTIFICATIONS_KEY) || '[]');
        localStorage.setItem(GLOBAL_NOTIFICATIONS_KEY, JSON.stringify(all.map((n:any) => n.id === id ? {...n, read:true} : n)));
        dispatchDataUpdatedEvent();
    },
    markAllRead: (userId: string) => {
        const all = JSON.parse(localStorage.getItem(GLOBAL_NOTIFICATIONS_KEY) || '[]');
        localStorage.setItem(GLOBAL_NOTIFICATIONS_KEY, JSON.stringify(all.map((n:any) => ({...n, read:true}))));
        dispatchDataUpdatedEvent();
    },
    getAllKitchenWorkflowRequests: (): KitchenWorkflowRequest[] => {
        try {
            return JSON.parse(localStorage.getItem('bistro_kitchen_workflows') || '[]');
        } catch (e) { return []; }
    },
    saveKitchenWorkflowRequest: (req: KitchenWorkflowRequest) => {
        const all = storageService.getAllKitchenWorkflowRequests();
        all.push(req);
        localStorage.setItem('bistro_kitchen_workflows', JSON.stringify(all));
        dispatchDataUpdatedEvent();
    },
    updateKitchenWorkflowRequest: (req: KitchenWorkflowRequest) => {
        const all = storageService.getAllKitchenWorkflowRequests();
        const idx = all.findIndex(r => r.id === req.id);
        if (idx >= 0) {
            all[idx] = req;
            localStorage.setItem('bistro_kitchen_workflows', JSON.stringify(all));
            dispatchDataUpdatedEvent();
        }
    },
    getCameraFeeds: (userId: string): CameraFeed[] => storageService.getItem<CameraFeed[]>(userId, 'camera_feeds', []),
    saveCameraFeed: (userId: string, feed: CameraFeed) => {
        const all = storageService.getCameraFeeds(userId);
        all.push(feed);
        storageService.setItem(userId, 'camera_feeds', all);
    },
    deleteCameraFeed: (userId: string, id: string) => {
        const all = storageService.getCameraFeeds(userId);
        storageService.setItem(userId, 'camera_feeds', all.filter(f => f.id !== id));
    },

    // --- POS Connection Persistence ---
    getPOSConnections: (userId: string): Record<string, boolean> => storageService.getItem<Record<string, boolean>>(userId, 'pos_links', {}),
    setPOSConnection: (userId: string, id: string, status: boolean) => {
        const links = storageService.getPOSConnections(userId);
        links[id] = status;
        storageService.setItem(userId, 'pos_links', links);
    },
    getIntegrationConfig: (userId: string, id: string): IntegrationConfig | null => storageService.getItem<IntegrationConfig | null>(userId, `int_config_${id}`, null),
    saveIntegrationConfig: (userId: string, id: string, config: IntegrationConfig) => storageService.setItem(userId, `int_config_${id}`, config),

    // --- Manual Data Entry Persistence ---
    getManualSales: (userId: string): ManualSalesEntry[] => storageService.getItem<ManualSalesEntry[]>(userId, 'manual_sales', []),
    saveManualSales: (userId: string, entries: ManualSalesEntry[]) => storageService.setItem(userId, 'manual_sales', entries),
    
    getManualPurchases: (userId: string): ManualPurchaseEntry[] => storageService.getItem<ManualPurchaseEntry[]>(userId, 'manual_purchases', []),
    saveManualPurchases: (userId: string, entries: ManualPurchaseEntry[]) => storageService.setItem(userId, 'manual_purchases', entries),
    
    getManualExpenses: (userId: string): ManualExpenseEntry[] => storageService.getItem<ManualExpenseEntry[]>(userId, 'manual_expenses', []),
    saveManualExpenses: (userId: string, entries: ManualExpenseEntry[]) => storageService.setItem(userId, 'manual_expenses', entries),
    
    getManualManpower: (userId: string): ManualManpowerEntry[] => storageService.getItem<ManualManpowerEntry[]>(userId, 'manual_manpower', []),
    saveManualManpower: (userId: string, entries: ManualManpowerEntry[]) => storageService.setItem(userId, 'manual_manpower', entries),
};
