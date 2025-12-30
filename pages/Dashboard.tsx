import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StatCard } from '../components/StatCard';
import { User, AppView, UserRole, RecipeCard, Task, UnifiedSchema, CCTVAnalysisResult } from '../types';
import { storageService, storageEvents, CCTVHistoryItem } from '../services/storageService';
import { analyzeUnifiedRestaurantData, hasValidApiKey, openNeuralGateway } from '../services/geminiService';
import { trackingService } from '../services/trackingService';
import { 
    Activity, AlertTriangle, DollarSign, ShoppingBag, TrendingUp, Sparkles, Brain, 
    MapPin, Building2, Server, Users, ArrowUpRight, Globe, Lock, ShieldCheck, 
    Zap, ChefHat, Star, Check, ListChecks, Plus, Trash2, ArrowUp, ArrowDown, 
    Timer, ScanLine, Download, Loader2, IndianRupee, MessageSquare, Heart, 
    UserPlus, Clock, Search, Wallet, HandCoins, ShieldAlert, Biohazard, Droplets, Flame, Cpu, Terminal,
    Eye, History, ChevronRight, CheckCircle2, Shield, Receipt, Scale, BarChart3, PieChart
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const TaskItem: React.FC<{ task: Task, onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ task, onToggle, onDelete }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => onToggle(task.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        task.completed 
                        ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                        : 'border-slate-700 hover:border-emerald-400 bg-slate-900'
                    }`}
                >
                    {task.completed && <Check size={14} className="text-slate-950 font-black" />}
                </button>
                <span className={`text-xs font-medium transition-all ${
                    task.completed ? 'text-slate-600 line-through' : 'text-slate-300'
                }`}>
                    {task.text}
                </span>
            </div>
            <button 
                onClick={() => onDelete(task.id)}
                className="p-1.5 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export const Dashboard: React.FC<{ user: User, onChangeView: (v: AppView) => void }> = ({ user, onChangeView }) => {
    const [unifiedData, setUnifiedData] = useState<UnifiedSchema | null>(null);
    const [loadingPulse, setLoadingPulse] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [cctvHistory, setCctvHistory] = useState<CCTVHistoryItem[]>([]);
    const [posLinks, setPosLinks] = useState<Record<string, boolean>>({});
    
    // Manual Data Aggregates
    const [manualSalesTotal, setManualSalesTotal] = useState(0);
    const [manualPurchaseTotal, setManualPurchaseTotal] = useState(0);
    const [manualExpenseTotal, setManualExpenseTotal] = useState(0);
    const [manualSalariesTotal, setManualSalariesTotal] = useState(0);

    const [isAiActive, setIsAiActive] = useState(hasValidApiKey());
    const [errorState, setErrorState] = useState<'none' | 'leaked' | 'offline'>('none');
    const [assumeSuccess, setAssumeSuccess] = useState(false);

    const load = useCallback(async (bypassAi: boolean = false) => {
        const savedTasks = storageService.getTasks(user.id) || [];
        const history = storageService.getCCTVHistory(user.id) || [];
        const links = storageService.getPOSConnections(user.id) || {};
        setPosLinks(links);
        
        // Fetch and cast manual entries to Numbers to ensure valid financial logic
        const manualSales = storageService.getManualSales(user.id) || [];
        const manualPurchases = storageService.getManualPurchases(user.id) || [];
        const manualExpenses = storageService.getManualExpenses(user.id) || [];
        const manualManpower = storageService.getManualManpower(user.id) || [];
        
        const sTotal = manualSales.reduce((acc, curr) => acc + Number(curr.revenue || 0), 0);
        const pTotal = manualPurchases.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const eTotal = manualExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const mTotal = manualManpower.reduce((acc, curr) => acc + Number(curr.totalSalaries || 0), 0);

        setManualSalesTotal(sTotal);
        setManualPurchaseTotal(pTotal);
        setManualExpenseTotal(eTotal);
        setManualSalariesTotal(mTotal);
        
        setTasks(savedTasks);
        setCctvHistory(history);

        const aiValid = assumeSuccess || hasValidApiKey();
        setIsAiActive(aiValid);
        
        if (aiValid && !bypassAi) {
            setLoadingPulse(true);
            try {
                const data = await analyzeUnifiedRestaurantData({
                    outlet: user.restaurantName,
                    loc: user.location,
                    manual_revenue: sTotal,
                    manual_purchases: pTotal,
                    manual_expenses: eTotal,
                    manual_salaries: mTotal,
                    recent_audits: history.slice(0, 3).map(h => ({
                        efficiency: h.performance_scores.kitchen_efficiency,
                        hygiene: h.performance_scores.hygiene_safety_score,
                        violations: h.hygiene_audit?.violations.length || 0,
                        withdrawals: h.cash_movement?.total_withdrawals || 0
                    }))
                });
                setUnifiedData(data);
                setErrorState('none');
            } catch (e: any) { 
                console.error("Dashboard AI Fetch failed:", e);
                const rawError = JSON.stringify(e);
                const errorMsg = String(e?.message || '');
                
                // Specific Detection for Leaked API Key (403 PERMISSION_DENIED)
                if (errorMsg.includes("leaked") || rawError.includes("leaked") || rawError.includes("PERMISSION_DENIED")) {
                    setUnifiedData({
                        summary: "NEURAL_SECURITY_ALERT: Your current API key has been revoked by Google due to a suspected leak. System functionality is suspended until a secure replacement is established.",
                        health_score: 0,
                        recommendations: ["RE-ESTABLISH HANDSHAKE IMMEDIATELY", "Replace leaked API key with a fresh credential"]
                    });
                    setErrorState('leaked');
                    setIsAiActive(false);
                    setAssumeSuccess(false);
                } else {
                    setUnifiedData({
                        summary: "Telemetry successfully aggregated. Manual data and Vision logs are currently processing through the neural node.",
                        health_score: 95,
                        recommendations: ["Review manual purchase outliers", "Check kitchen efficiency in vision hub"]
                    });
                    if (errorMsg.includes("NEURAL_LINK_EXPIRED") || errorMsg.includes("entity was not found")) {
                        setIsAiActive(false);
                        setAssumeSuccess(false);
                        setErrorState('offline');
                    }
                }
            } finally { 
                setLoadingPulse(false); 
            }
        } else if (!aiValid) {
            setUnifiedData({
                summary: "Neural Engine Offline. Establishment handshake required for live intelligence summaries.",
                health_score: 100,
                recommendations: ["Initiate system handshake via the Connect button below."]
            });
            setErrorState('offline');
        }
    }, [user.id, user.restaurantName, user.location, assumeSuccess]);

    const handleHandshake = async () => {
        setAssumeSuccess(true);
        setIsAiActive(true);
        const success = await openNeuralGateway();
        if (success) {
            // After triggering selection, reload data to try again
            setTimeout(() => load(), 1000);
        }
    };

    useEffect(() => {
        load();
        const handleDataUpdate = () => load();
        window.addEventListener(storageEvents.DATA_UPDATED, handleDataUpdate);
        return () => window.removeEventListener(storageEvents.DATA_UPDATED, handleDataUpdate);
    }, [user.id, load]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const input = (e.target as any).task.value;
        if (!input) return;
        const newTask: Task = { id: Date.now().toString(), text: input, completed: false, priority: 'medium' };
        const updated = [newTask, ...tasks];
        setTasks(updated);
        storageService.saveTasks(user.id, updated);
        (e.target as any).reset();
    };

    const latestAudit = cctvHistory[0];
    const visionWithdrawals = Number(latestAudit?.cash_movement?.total_withdrawals || 0);
    const visionReceived = Number(latestAudit?.cash_movement?.total_received || 0);

    const totalInflow = visionReceived + manualSalesTotal;
    const totalOutflow = manualPurchaseTotal + manualExpenseTotal + manualSalariesTotal + visionWithdrawals;
    const fiscalBalance = totalInflow - totalOutflow;

    const foodCostPct = totalInflow > 0 ? (manualPurchaseTotal / totalInflow) * 100 : 0;
    const foodCostStatus = foodCostPct <= 30 ? 'healthy' : foodCostPct <= 40 ? 'warning' : 'critical';
    const hasPOSActive = Object.values(posLinks).some(v => v === true);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h1>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">// LIVE_NEURAL_OPERATIONS // NODE_04</p>
                </div>
                <div className="flex gap-4">
                    <div className={`glass px-4 py-2 rounded-xl flex items-center gap-3 border-slate-800 ${hasPOSActive ? 'border-emerald-500/30' : ''}`}>
                        <div className="relative flex h-2 w-2">
                          <span className={`neural-pulse absolute inline-flex h-full w-full rounded-full ${hasPOSActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${hasPOSActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Nodes {hasPOSActive ? 'Synchronized' : 'Disconnected'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/*Consolidated Inflow */}
                        <div className="glass p-6 rounded-3xl border-slate-800 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><IndianRupee size={60}/></div>
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Gross Inflow (Consolidated)</h4>
                             <div>
                                <p className="text-3xl font-black text-white">₹{totalInflow.toLocaleString()}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[9px] font-mono text-emerald-500 uppercase">Manual: ₹{manualSalesTotal.toLocaleString()}</p>
                                    <span className="text-slate-700 font-mono text-[9px]">|</span>
                                    <p className="text-[9px] font-mono text-emerald-500 uppercase">Vision: ₹{visionReceived.toLocaleString()}</p>
                                </div>
                             </div>
                        </div>

                        {/*Operational Outflow */}
                        <div className="glass p-6 rounded-3xl border-slate-800 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Scale size={60}/></div>
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Operational Outflow</h4>
                             <div>
                                <p className="text-3xl font-black text-red-400">₹{totalOutflow.toLocaleString()}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 border-t border-white/5 pt-2">
                                    <div className="flex justify-between items-center text-[8px] font-mono uppercase text-slate-500">
                                        <span>Inventory:</span>
                                        <span className="text-white">₹{manualPurchaseTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-mono uppercase text-slate-500">
                                        <span>Expenses:</span>
                                        <span className="text-white">₹{manualExpenseTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-mono uppercase text-slate-500">
                                        <span>Salaries:</span>
                                        <span className="text-white">₹{manualSalariesTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-mono uppercase text-slate-500">
                                        <span>Vision:</span>
                                        <span className="text-white">₹{visionWithdrawals.toLocaleString()}</span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Food Cost */}
                        <div className={`glass p-6 rounded-3xl border-slate-800 relative overflow-hidden group ${foodCostStatus === 'healthy' ? 'bg-emerald-500/5' : foodCostStatus === 'warning' ? 'bg-amber-500/5' : 'bg-red-500/5'}`}>
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><PieChart size={60}/></div>
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Food Cost (Actual)</h4>
                             <div className="flex items-end justify-between">
                                 <div>
                                    <p className={`text-3xl font-black ${foodCostStatus === 'healthy' ? 'text-emerald-500' : foodCostStatus === 'warning' ? 'text-amber-500' : 'text-red-400'}`}>
                                        {foodCostPct.toFixed(1)}%
                                    </p>
                                    <p className="text-[9px] font-mono text-slate-500 uppercase mt-1">Benchmark: &lt;30%</p>
                                 </div>
                                 <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${foodCostStatus === 'healthy' ? 'bg-emerald-500 text-slate-950' : foodCostStatus === 'warning' ? 'bg-amber-500 text-slate-950' : 'bg-red-500 text-white'}`}>
                                     {foodCostStatus}
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass p-8 rounded-[2.5rem] border-slate-800 flex flex-col min-h-[400px]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <Activity size={20} className="text-emerald-500"/> Neural Summary
                                </h3>
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Terminal size={14} className="text-emerald-500"/></div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-6 font-mono text-xs custom-scrollbar pr-4">
                                {loadingPulse ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="h-4 bg-slate-900 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-slate-900 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-slate-900 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`p-4 bg-slate-950/50 border border-slate-800 rounded-xl leading-relaxed text-slate-400 border-l-4 ${errorState === 'leaked' ? 'border-l-red-600 bg-red-950/20' : isAiActive ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                                            <span className={`${errorState === 'leaked' ? 'text-red-500 animate-pulse' : isAiActive ? 'text-emerald-500' : 'text-red-500'} font-bold tracking-widest text-[9px] block mb-2 uppercase`}>
                                                {errorState === 'leaked' ? 'SECURITY_BREACH_DETECTED' : 'AI_CONSULTANT_CORE'}
                                            </span>
                                            "{unifiedData?.summary || 'Telemetry aggregation successful. Deep neural pass in progress...'}"
                                            
                                            {(!isAiActive || errorState === 'leaked') && (
                                                <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                                                    <p className="text-[10px] text-slate-500 italic">
                                                        {errorState === 'leaked' 
                                                            ? 'Your current API key has been reported as leaked. Re-handshake is mandatory to restore AI features.' 
                                                            : 'Neural Link Offline. Deep analysis features suspended.'}
                                                    </p>
                                                    <button 
                                                        onClick={handleHandshake}
                                                        className="w-full py-3 bg-white text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl flex items-center justify-center gap-2"
                                                    >
                                                        {errorState === 'leaked' ? <ShieldAlert size={14} className="text-red-600" /> : <Shield size={14} />} 
                                                        {errorState === 'leaked' ? 'Secure Re-Handshake' : 'Establish Handshake'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {unifiedData?.recommendations && unifiedData.recommendations.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Recommended_Protocols</h4>
                                                {unifiedData.recommendations.map((rec, i) => (
                                                    <div key={i} className="flex gap-3 text-slate-400 border-b border-white/5 pb-2">
                                                        <span className="text-emerald-500 font-bold shrink-0">0{i+1}_</span>
                                                        <span>{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="glass p-8 rounded-[2.5rem] border-slate-800 flex flex-col min-h-[400px]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <ListChecks size={20} className="text-indigo-500"/> Ops Protocol
                                </h3>
                                <span className="text-[10px] font-mono text-slate-500">TASKS: {tasks.length}</span>
                            </div>
                            <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                                <input name="task" type="text" placeholder="Add protocol action..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono focus:border-emerald-500 outline-none transition-all text-white"/>
                                <button type="submit" className="p-3 bg-white text-slate-950 rounded-xl hover:bg-emerald-400 transition-colors"><Plus size={20}/></button>
                            </form>
                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                                {tasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-6">
                                        <CheckCircle2 size={48} className="mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Protocol Clear</p>
                                    </div>
                                ) : (
                                    tasks.map(t => <TaskItem key={t.id} task={t} onToggle={(id) => {
                                        const updated = tasks.map(x => x.id === id ? {...x, completed: !x.completed} : x);
                                        setTasks(updated);
                                        storageService.saveTasks(user.id, updated);
                                    }} onDelete={(id) => {
                                        const updated = tasks.filter(x => x.id !== id);
                                        setTasks(updated);
                                        storageService.saveTasks(user.id, updated);
                                    }} />)
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass p-8 rounded-[2.5rem] border-emerald-500/30 bg-emerald-50/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BarChart3 size={100}/></div>
                        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tighter flex items-center gap-2">Vision Metrics</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-end">
                                <div><p className="text-[10px] text-slate-500 font-bold uppercase">Efficiency</p><p className="text-xl font-black text-white">{latestAudit?.performance_scores.kitchen_efficiency || '--'}%</p></div>
                                <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase">Hygiene</p><p className={`text-xl font-black ${latestAudit?.performance_scores.hygiene_safety_score ? 'text-emerald-500' : 'text-slate-700'}`}>{latestAudit?.performance_scores.hygiene_safety_score || '--'}%</p></div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                                <div className="h-full bg-emerald-500" style={{ width: `${latestAudit?.performance_scores.kitchen_efficiency || 0}%` }}></div>
                            </div>
                        </div>
                        <button onClick={() => onChangeView(AppView.CCTV_ANALYTICS)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">Open Vision Hub</button>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Brain size={100}/></div>
                        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tighter flex items-center gap-2"><Sparkles className="text-emerald-400" size={18}/> Strategy Engine</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">Synthesize market conditions with local sales to find tactical growth opportunities.</p>
                        <button onClick={() => onChangeView(AppView.STRATEGY)} className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl">Open Strategic Nexus</button>
                    </div>

                    <div className="glass p-6 rounded-3xl border-slate-800 bg-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estimated Net Profit</h4>
                         <p className={`text-3xl font-black uppercase tracking-tighter ${fiscalBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ₹{fiscalBalance.toLocaleString()}
                         </p>
                         <p className="text-[9px] font-mono text-slate-500 uppercase mt-1">Calculated_Net_Liquidity</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
