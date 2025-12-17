
import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { User, AppView, UserRole } from '../types';
import { storageService, storageEvents } from '../services/storageService';
import { analyzeUnifiedRestaurantData } from '../services/geminiService';
import { Activity, AlertTriangle, DollarSign, ShoppingBag, TrendingUp, Sparkles, Brain, MapPin, Building2, Server, Users, ArrowUpRight, Globe, Lock, ShieldCheck, Zap } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

// --- ENTERPRISE WIDGETS ---
const OutletStatusRow = ({ name, location, status, revenue, staff }: any) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow group">
        <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${status === 'Online' ? 'bg-emerald-500 animate-pulse' : status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-blue-600 transition-colors">{name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> {location}</p>
            </div>
        </div>
        <div className="text-right flex items-center gap-6">
            <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">₹{revenue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Revenue</p>
            </div>
            <div className="hidden sm:block">
                <p className="font-bold text-slate-800 dark:text-white text-sm">{staff}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Staff</p>
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                <ArrowUpRight size={16} />
            </button>
        </div>
    </div>
);

const EnterpriseView = () => (
    <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/30">System Online</span>
                    <span className="text-[10px] text-slate-400 font-mono">v2.4.0-ENT</span>
                </div>
                <h1 className="text-3xl font-black flex items-center gap-3">
                    <Building2 className="text-emerald-400"/> Command Center
                </h1>
                <p className="text-slate-400 text-sm mt-1">Global oversight of 5 connected outlets.</p>
            </div>
            <div className="flex gap-3 relative z-10">
                <button className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-sm font-bold flex items-center gap-2 backdrop-blur-sm transition-colors">
                    <Globe size={16}/> Global Config
                </button>
                <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-colors">
                    <Zap size={16}/> Broadcast SOP
                </button>
            </div>
            
            {/* Background Decor */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Network Revenue</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">₹42.5L</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 w-fit px-2 py-1 rounded">
                        <ArrowUpRight size={12}/> +12.5% vs last month
                    </div>
                </div>
                <div className="absolute right-4 top-4 text-slate-100 dark:text-slate-800">
                    <DollarSign size={64} />
                </div>
            </div>
            <StatCard label="Active Outlets" value="5/5" icon={Building2} colorClass="bg-blue-100 text-blue-600" />
            <StatCard label="Total Staff" value="142" icon={Users} colorClass="bg-purple-100 text-purple-600" />
            <StatCard label="Avg Food Cost" value="28.4%" icon={Activity} colorClass="bg-orange-100 text-orange-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Activity size={18} className="text-blue-500"/> Outlet Performance
                        </h3>
                        <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        <OutletStatusRow name="Downtown Flagship" location="Mumbai, Bandra" status="Online" revenue={1250000} staff={45} />
                        <OutletStatusRow name="Tech Park Hub" location="Bangalore, HSR" status="Online" revenue={980000} staff={32} />
                        <OutletStatusRow name="Cloud Kitchen A" location="Delhi, GK2" status="Warning" revenue={650000} staff={18} />
                        <OutletStatusRow name="Mall Kiosk" location="Pune, Phoenix" status="Online" revenue={820000} staff={12} />
                        <OutletStatusRow name="Express Counter" location="Hyderabad, HiTec" status="Offline" revenue={550000} staff={35} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Globe size={18} className="text-purple-500"/> Regional Sales
                </h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            {name: 'Mum', val: 40}, {name: 'Blr', val: 30}, {name: 'Del', val: 20}, {name: 'Pun', val: 25}, {name: 'Hyd', val: 15}
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                            <Bar dataKey="val" fill="#4f46e5" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Top Performing Region: <strong className="text-slate-800 dark:text-white">Mumbai</strong></p>
                </div>
            </div>
        </div>
    </div>
);

// --- SUPER ADMIN WIDGETS ---
const SuperAdminView = () => (
    <div className="space-y-6 animate-fade-in bg-slate-50 dark:bg-slate-950 pb-12">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Admin Panel</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Server className="text-purple-600"/> Platform Overview
                </h1>
                <p className="text-slate-500 text-sm">System Health & Growth Metrics</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                    <ShieldCheck size={14} /> Systems Operational
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Active Restaurants</p>
                    <h3 className="text-3xl font-black group-hover:scale-105 transition-transform origin-left">1,248</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                        <ArrowUpRight size={12}/> +48 this week
                    </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-slate-800 rotate-12">
                    <Building2 size={80} />
                </div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Est. ARR</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">₹1.2Cr</h3>
                <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full animate-pulse" style={{width: '75%'}}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-right">75% to annual goal</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">AI Jobs Processed</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">85.4k</h3>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Sparkles size={12} className="text-yellow-500"/> Recipes, SOPs, & Video Gens</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Server Load</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">32%</h3>
                <p className="text-xs text-emerald-500 mt-2 font-bold">Healthy</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Globe size={18} className="text-blue-500"/> Live Activity Feed
                </h3>
                <div className="space-y-0">
                    {[1,2,3,4,5].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {['BK', 'PJ', 'TL', 'MC', 'KFC'][i]}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">
                                        {['Burger King', 'Pizza Joint', 'The Lunchbox', 'Mom\'s Cafe', 'KFC'][i]}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {['Generated 5 Recipes', 'Updated Inventory', 'Added Staff', 'Downloaded SOP', 'Connected POS'][i]}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{i * 2 + 1}m ago</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-orange-500"/> System Alerts
                    </h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-lg flex gap-3 items-start">
                            <div className="mt-0.5"><AlertTriangle className="text-red-500 shrink-0" size={16} /></div>
                            <div>
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">Payment Gateway Latency</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Razorpay API response time > 2s. DevOps notified.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg flex gap-3 items-start">
                            <div className="mt-0.5"><Activity className="text-amber-500 shrink-0" size={16} /></div>
                            <div>
                                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">High Token Usage</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Gemini 3 Pro quota at 85%. Auto-scaling enabled.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors text-left">
                            Force Sync POS
                        </button>
                        <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors text-left">
                            Clear Cache
                        </button>
                        <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors text-left">
                            Export User List
                        </button>
                        <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors text-left">
                            System Health Check
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- STANDARD OWNER DASHBOARD ---
const OperationalPulse = ({ unifiedData }: { unifiedData: any }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3"><Activity className="text-blue-500"/> Operational Pulse</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase">Efficiency</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500">{unifiedData?.workflow_analysis?.efficiency || 85}%</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Compliance</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-500">{((unifiedData?.sop_compliance?.rate || 0)*100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                <span className="text-xs font-bold text-red-800 dark:text-red-400 uppercase">Alerts</span>
                <p className="text-2xl font-black text-red-600 dark:text-red-500">{unifiedData?.sop_compliance?.violations?.length || 0}</p>
            </div>
        </div>
    </div>
);

const SystemIntelligence = ({ unifiedData }: { unifiedData: any }) => (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-4"><Brain className="text-purple-400"/> AI System Intelligence</h3>
        <p className="text-sm text-slate-300 mb-4">{unifiedData?.summary || "System analyzing..."}</p>
        <div className="space-y-2">
            {unifiedData?.wastage_root_causes?.map((cause: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded">
                    <AlertTriangle size={12} className="text-yellow-400"/> {cause}
                </div>
            ))}
        </div>
    </div>
);

export const Dashboard: React.FC<{ user: User, onChangeView: (v: AppView) => void }> = ({ user, onChangeView }) => {
    const [unifiedData, setUnifiedData] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setSales(storageService.getSalesData(user.id));
            const data = await analyzeUnifiedRestaurantData({});
            setUnifiedData(data);
        };
        load();
        
        // Event Listener for live updates
        const handler = () => load();
        window.addEventListener(storageEvents.DATA_UPDATED, handler);
        return () => window.removeEventListener(storageEvents.DATA_UPDATED, handler);
    }, [user.id]);

    // Role-Based Rendering
    if (user.role === UserRole.ENTERPRISE) {
        return <EnterpriseView />;
    }

    if (user.role === UserRole.SUPER_ADMIN) {
        return <SuperAdminView />;
    }

    // Default Owner/Admin View
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <OperationalPulse unifiedData={unifiedData} />
                    
                    {/* Sales Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[300px]">
                        <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sales.length ? sales : [{date:'1', revenue:0}]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip cursor={{stroke: '#10b981', strokeWidth: 1}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}/>
                                <Area type="monotone" dataKey="revenue" fill="#10b981" stroke="#10b981" fillOpacity={0.2}/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <SystemIntelligence unifiedData={unifiedData} />
                    <StatCard label="Total Orders" value="1,240" icon={ShoppingBag} colorClass="bg-blue-100 text-blue-600" />
                    <StatCard label="Food Cost" value="32%" icon={DollarSign} colorClass="bg-orange-100 text-orange-600" />
                </div>
            </div>
        </div>
    );
};
