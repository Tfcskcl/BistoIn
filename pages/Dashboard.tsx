
import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { User, AppView } from '../types';
import { storageService, storageEvents } from '../services/storageService';
import { analyzeUnifiedRestaurantData } from '../services/geminiService';
import { Activity, AlertTriangle, DollarSign, ShoppingBag, TrendingUp, Sparkles, Brain } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- WIDGETS ---
const OperationalPulse = ({ unifiedData }: { unifiedData: any }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Activity className="text-blue-500"/> Operational Pulse</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <span className="text-xs font-bold text-emerald-800 uppercase">Efficiency</span>
                <p className="text-2xl font-black text-emerald-600">{unifiedData?.workflow_analysis?.efficiency || 85}%</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-xs font-bold text-amber-800 uppercase">Compliance</span>
                <p className="text-2xl font-black text-amber-600">{((unifiedData?.sop_compliance?.rate || 0)*100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <span className="text-xs font-bold text-red-800 uppercase">Alerts</span>
                <p className="text-2xl font-black text-red-600">{unifiedData?.sop_compliance?.violations?.length || 0}</p>
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

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <OperationalPulse unifiedData={unifiedData} />
                    
                    {/* Sales Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
                        <h3 className="font-bold mb-4">Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sales.length ? sales : [{date:'1', revenue:0}]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="date" hide/>
                                <YAxis hide/>
                                <Tooltip/>
                                <Area type="monotone" dataKey="revenue" fill="#10b981" stroke="#10b981" fillOpacity={0.2}/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <SystemIntelligence unifiedData={unifiedData} />
                    <StatCard label="Total Orders" value="1,240" icon={ShoppingBag} colorClass="bg-blue-100 text-blue-600"/>
                    <StatCard label="Food Cost" value="32%" icon={DollarSign} colorClass="bg-orange-100 text-orange-600"/>
                </div>
            </div>
        </div>
    );
};
