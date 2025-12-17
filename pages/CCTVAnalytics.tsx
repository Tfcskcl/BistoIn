
import React, { useState } from 'react';
import { User } from '../types';
import { analyzeStaffMovement, addCCTVCamera } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Video, Activity, AlertTriangle, Users, Clock, CheckCircle2, PlayCircle, Loader2, Box, Sparkles, Plus, X, Layers, Settings } from 'lucide-react';

interface CCTVAnalyticsProps { user: User; onUserUpdate?: (user: User) => void; }

const MOCK_ZONES = [
    { id: 'prep', label: 'Prep', top: '10%', left: '5%', width: '30%', height: '30%' },
    { id: 'cook', label: 'Cook', top: '10%', left: '40%', width: '50%', height: '30%' },
    { id: 'pass', label: 'Pass', top: '50%', left: '20%', width: '60%', height: '30%' }
];

export const CCTVAnalytics: React.FC<CCTVAnalyticsProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'insights'>('feed');
    const [result, setResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAddCamera, setShowAddCamera] = useState(false);
    const [showCalibration, setShowCalibration] = useState(false);
    const [viewingClip, setViewingClip] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const data = await analyzeStaffMovement("Simulated busy kitchen", ["Prep", "Cook"]);
            setResult(data);
        } finally { setIsAnalyzing(false); }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <h1 className="font-bold text-lg flex items-center gap-2"><Video className="text-emerald-600"/> Staff Movement</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowCalibration(true)} className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold flex gap-1"><Layers size={14}/> Calibrate</button>
                    <button onClick={() => setShowAddCamera(true)} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex gap-1"><Plus size={14}/> Add Camera</button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Visualizer */}
                <div className="flex-1 bg-black/90 rounded-xl relative flex items-center justify-center overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1200" className="opacity-50 w-full h-full object-cover" />
                    <div className="absolute inset-0">
                        {MOCK_ZONES.map(z => (
                            <div key={z.id} className="absolute border-2 border-emerald-500/50 flex items-center justify-center" style={{top:z.top, left:z.left, width:z.width, height:z.height}}>
                                <span className="bg-black/70 text-white text-xs px-1 rounded">{z.label}</span>
                            </div>
                        ))}
                    </div>
                    {!result && (
                        <button onClick={handleAnalysis} disabled={isAnalyzing} className="absolute z-20 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2">
                            {isAnalyzing ? <Loader2 className="animate-spin"/> : <PlayCircle/>} Run AI Simulation
                        </button>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-96 bg-white rounded-xl border border-slate-200 flex flex-col">
                    <div className="flex border-b">
                        <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'feed' ? 'bg-slate-50 border-b-2 border-slate-900' : ''}`}>Event Feed</button>
                        <button onClick={() => setActiveTab('insights')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'insights' ? 'bg-slate-50 border-b-2 border-slate-900' : ''}`}>Insights</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {result ? (
                            activeTab === 'feed' ? (
                                <div className="space-y-3">
                                    {result.events?.map((e: any, i: number) => (
                                        <div key={i} className="p-3 border rounded-lg bg-slate-50">
                                            <div className="flex justify-between mb-1"><span className="font-bold text-sm capitalize">{e.type}</span><span className="text-xs text-slate-400">Now</span></div>
                                            <p className="text-xs text-slate-600 mb-2">{e.person_id} in {e.zone_id}</p>
                                            {e.clip_url && (
                                                <button onClick={() => setViewingClip(e.clip_url)} className="text-xs text-blue-600 font-bold flex items-center gap-1"><PlayCircle size={12}/> View Clip</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                        <h4 className="font-bold text-red-800 text-sm flex gap-2"><AlertTriangle size={16}/> Critical Alerts</h4>
                                        <ul className="mt-2 text-xs text-red-700 space-y-1">
                                            {result.bottlenecks?.map((b: any, i: number) => <li key={i}>{b.zone_id}: {b.root_cause}</li>)}
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <h4 className="font-bold text-emerald-800 text-sm flex gap-2"><Sparkles size={16}/> Recommendations</h4>
                                        <ul className="mt-2 text-xs text-emerald-700 space-y-1">
                                            {result.recommendations?.map((r: any, i: number) => <li key={i}>{r.text}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )
                        ) : <p className="text-center text-slate-400 text-sm mt-10">Run simulation to see data.</p>}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {viewingClip && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-10">
                    <div className="relative w-full max-w-3xl aspect-video bg-black">
                        <button onClick={() => setViewingClip(null)} className="absolute -top-10 right-0 text-white"><X/></button>
                        <video src={viewingClip} controls autoPlay className="w-full h-full" />
                    </div>
                </div>
            )}
            
            {(showAddCamera || showCalibration) && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-8 rounded-xl max-w-md w-full text-center">
                        <h3 className="font-bold text-lg mb-2">{showAddCamera ? "Add Camera" : "Calibrate Zones"}</h3>
                        <p className="text-sm text-slate-500 mb-6">This would open the full configuration wizard.</p>
                        <button onClick={() => {setShowAddCamera(false); setShowCalibration(false)}} className="px-6 py-2 bg-slate-900 text-white rounded-lg">Close Demo</button>
                    </div>
                </div>
            )}
        </div>
    );
};
