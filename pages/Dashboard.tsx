
import React, { useState, useEffect, useMemo } from 'react';
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
    Eye, History, ChevronRight, CheckCircle2, Shield
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
    const [isAiActive, setIsAiActive] = useState(hasValidApiKey());
    const [assumeSuccess, setAssumeSuccess] = useState(false);

    const load = async (bypassAi: boolean = false) => {
        const savedTasks = storageService.getTasks(user.id) || [];
        const history = storageService.getCCTVHistory(user.id) || [];
        
        const aiValid = assumeSuccess || hasValidApiKey();
        setTasks(savedTasks);
        setCctvHistory(history);
        setIsAiActive(aiValid);
        
        if (aiValid && !bypassAi) {
            setLoadingPulse(true);
            try {
                const data = await analyzeUnifiedRestaurantData({
                    outlet: user.restaurantName,
                    loc: user.location,
                    recent_audits: history.slice(0, 3).map(h => ({
                        efficiency: h.performance_scores.kitchen_efficiency,
                        hygiene: h.performance_scores.hygiene_safety_score,
                        violations: h.hygiene_audit?.violations.length || 0
                    }))
                });
                setUnifiedData(data);
            } catch (e: any) { 
                console.error("Dashboard AI Fetch failed:", e);
                // If it fails with a specific auth error, we know assumeSuccess was wrong or key is bad
                if (e.message?.includes("NEURAL_LINK_EXPIRED") || e.message?.includes("entity was not found")) {
                    setIsAiActive(false);
                    setAssumeSuccess(false);
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
        }
    };

    const handleHandshake = async () => {
        // MANDATORY: Assume success immediately after triggering
        setAssumeSuccess(true);
        setIsAiActive(true);
        
        const success = await openNeuralGateway();
        if (success) {
            // Wait a beat for the environment to catch up, then load
            setTimeout(() => load(), 1000);
        }
    };

    useEffect(() => {
        load();
        const handleDataUpdate = () => {
            setTasks(storageService.getTasks(user.id) || []);
            setCctvHistory(storageService.getCCTVHistory(user.id) || []);
        };
        window.addEventListener(storageEvents.DATA_UPDATED, handleDataUpdate);
        
        const interval = setInterval(() => {
            const aiValid = hasValidApiKey();
            if (aiValid && !isAiActive) {
                setIsAiActive(true);
                load();
            }
        }, 5000);

        return () => {
            window.removeEventListener(storageEvents.DATA_UPDATED, handleDataUpdate);
            clearInterval(interval);
        };
    }, [user.id, isAiActive, assumeSuccess]);

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

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h1>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">// LIVE_NEURAL_OPERATIONS // NODE_04</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-slate-800">
                        <div className="relative flex h-2 w-2">
                          <span className={`neural-pulse absolute inline-flex h-full w-full rounded-full ${isAiActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isAiActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vision {isAiActive ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-6 rounded-3xl border-slate-800 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><IndianRupee size={60}/></div>
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Financial Pulse</h4>
                             <div>
                                <p className="text-3xl font-black text-white">₹{latestAudit?.cash_movement?.total_received?.toLocaleString() || '14,250'}</p>
                                <p className="text-[10px] font-mono text-emerald-500 uppercase mt-1">ESTIMATED_INFLOW</p>
                             </div>
                        </div>
                        <div className="glass p-6 rounded-3xl border-slate-800 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Eye size={60}/></div>
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Efficiency Score</h4>
                             <div>
                                <p className="text-3xl font-black text-white">{latestAudit?.performance_scores.kitchen_efficiency || '96.4'}%</p>
                                <p className="text-[10px] font-mono text-indigo-400 uppercase mt-1">AUDIT_STRENGTH</p>
                             </div>
                        </div>
                        <div className="glass p-6 rounded-3xl border-slate-800 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Biohazard size={60}/></div>
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Hygiene Status</h4>
                             <p className={`text-3xl font-black uppercase tracking-tighter ${(latestAudit?.hygiene_audit?.violations.length || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {(latestAudit?.hygiene_audit?.violations.length || 0) > 0 ? 'At Risk' : 'Secure'}
                             </p>
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
                                        <div className={`p-4 bg-slate-950/50 border border-slate-800 rounded-xl leading-relaxed text-slate-400 border-l-4 ${isAiActive ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                                            <span className={`${isAiActive ? 'text-emerald-500' : 'text-red-500'} font-bold tracking-widest text-[9px] block mb-2 uppercase`}>AI_CONSULTANT_CORE</span>
                                            "{unifiedData?.summary || 'Initializing real-time operational analysis module. Awaiting next telemetry sync from CCTV nodes.'}"
                                            
                                            {!isAiActive && (
                                                <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                                                    <p className="text-[10px] text-slate-500 italic">Neural Link Offline. Features limited to local storage.</p>
                                                    <button 
                                                        onClick={handleHandshake}
                                                        className="w-full py-3 bg-white text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl flex items-center justify-center gap-2"
                                                    >
                                                        <Shield size={14} /> Establish Handshake
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                    <div className="glass p-8 rounded-[2.5rem] border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Brain size={100}/></div>
                        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tighter flex items-center gap-2"><Sparkles className="text-emerald-400"/> Strategy Engine</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">Synthesize market conditions with local sales to find tactical growth opportunities.</p>
                        <button onClick={() => onChangeView(AppView.STRATEGY)} className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl">Open Strategic Nexus</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
