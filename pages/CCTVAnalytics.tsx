
import React, { useState } from 'react';
import { User } from '../types';
import { analyzeStaffMovement } from '../services/geminiService';
import { Video, Activity, AlertTriangle, Users, Clock, PlayCircle, Loader2, Sparkles, Plus, X, Layers, Settings, Eye, CheckCircle2 } from 'lucide-react';

interface CCTVAnalyticsProps { user: User; onUserUpdate?: (user: User) => void; }

const MOCK_ZONES = [
    { id: 'prep', label: 'Prep Station', top: '10%', left: '5%', width: '30%', height: '30%' },
    { id: 'cook', label: 'Cook Line', top: '10%', left: '40%', width: '50%', height: '30%' },
    { id: 'pass', label: 'Pass / Dispatch', top: '50%', left: '20%', width: '60%', height: '30%' }
];

export const CCTVAnalytics: React.FC<CCTVAnalyticsProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'insights' | 'config'>('feed');
    const [result, setResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [viewingClip, setViewingClip] = useState<string | null>(null);
    
    // Integrations State
    const [ezvizConnected, setEzvizConnected] = useState(false);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // Context updated to reflect new "SOP Compliance" logic
            const context = "Monitoring kitchen workflow against 'Standard Burger Assembly' SOP. Checking for handwashing, correct station order, and dwell times.";
            const data = await analyzeStaffMovement(context, ["Prep", "Cook", "Pass"]);
            setResult(data);
        } finally { setIsAnalyzing(false); }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Video className="text-emerald-600"/> StorePulse Monitor</h1>
                    <p className="text-xs text-slate-500">Real-time SOP Compliance & Productivity Tracking</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('config')} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold flex gap-1 items-center">
                        <Settings size={14}/> Camera Config
                    </button>
                    <button className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold flex gap-1 items-center animate-pulse">
                        <Activity size={14}/> Live: 3 Alerts
                    </button>
                </div>
            </div>

            {activeTab === 'config' ? (
                <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-6 dark:text-white">Camera Integration Hub</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                        <div className={`p-6 border-2 rounded-xl flex flex-col items-center gap-4 transition-all ${ezvizConnected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Ezviz_logo.svg/2560px-Ezviz_logo.svg.png" className="h-8 object-contain" alt="EZVIZ" />
                            <p className="text-sm text-center text-slate-500">Connect your EZVIZ cloud account to stream feeds directly to our AI.</p>
                            <button 
                                onClick={() => setEzvizConnected(!ezvizConnected)}
                                className={`px-6 py-2 rounded-lg font-bold text-white ${ezvizConnected ? 'bg-emerald-600' : 'bg-slate-900'}`}
                            >
                                {ezvizConnected ? 'Connected' : 'Connect Account'}
                            </button>
                        </div>
                        
                        <div className="p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center gap-4 opacity-70">
                            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">RTSP / Local NVR</span>
                            <p className="text-sm text-center text-slate-500">For Enterprise setups with local servers. Connects via IP:Port.</p>
                            <button className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold rounded-lg cursor-not-allowed">Enterprise Only</button>
                        </div>
                    </div>
                    <button onClick={() => setActiveTab('feed')} className="mt-8 text-sm font-bold text-slate-500 hover:text-slate-900">Back to Monitor</button>
                </div>
            ) : (
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Visualizer */}
                    <div className="flex-1 bg-black/90 rounded-xl relative flex items-center justify-center overflow-hidden group">
                        {/* Simulation Overlay */}
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center gap-1"><Video size={12}/> CAM-01</span>
                            <span className="px-2 py-1 bg-black/50 text-white text-xs font-bold rounded border border-white/20">Processing: 24fps</span>
                        </div>

                        <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1200" className="opacity-50 w-full h-full object-cover" alt="CCTV Feed" />
                        
                        {/* Zone Overlays */}
                        <div className="absolute inset-0">
                            {MOCK_ZONES.map(z => (
                                <div key={z.id} className="absolute border-2 border-emerald-500/50 flex items-center justify-center hover:bg-emerald-500/10 transition-colors cursor-pointer group/zone" style={{top:z.top, left:z.left, width:z.width, height:z.height}}>
                                    <span className="absolute -top-3 left-0 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">{z.label}</span>
                                    {/* Mock Tracking Dot */}
                                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 animate-ping"></div>
                                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                                </div>
                            ))}
                        </div>

                        {!result && (
                            <button onClick={handleAnalysis} disabled={isAnalyzing} className="absolute z-20 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform">
                                {isAnalyzing ? <Loader2 className="animate-spin"/> : <PlayCircle/>} Start AI Compliance Check
                            </button>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                        <div className="flex border-b border-slate-200 dark:border-slate-800">
                            <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'feed' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>Live Violations</button>
                            <button onClick={() => setActiveTab('insights')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'insights' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>Productivity</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {result ? (
                                activeTab === 'feed' ? (
                                    <div className="space-y-4">
                                        {/* SOP Deviations Section */}
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">SOP Deviations</h4>
                                            {result.sop_deviations?.map((dev: any, i: number) => (
                                                <div key={i} className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg flex gap-3">
                                                    <div className="mt-1"><AlertTriangle size={16} className="text-red-600"/></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-red-700 dark:text-red-400">{dev.deviation_type}</p>
                                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{dev.explanation}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">Staff ID: {dev.person_id}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Events Stream */}
                                        <div className="space-y-2 mt-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Event Stream</h4>
                                            {result.events?.map((e: any, i: number) => (
                                                <div key={i} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300 capitalize">{e.type.replace('_', ' ')}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(e.start_time).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{e.person_id} • {e.zone_id}</p>
                                                    {e.clip_url && (
                                                        <button onClick={() => setViewingClip(e.clip_url)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><Eye size={10}/> Evidence Clip</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                                            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm flex gap-2 mb-2"><Sparkles size={16}/> Efficiency Score</h4>
                                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{result.performance_scores?.kitchen_efficiency}%</div>
                                            <p className="text-xs text-slate-500 mt-1">Based on motion vs idle time.</p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Bottlenecks</h4>
                                            {result.bottlenecks?.map((b: any, i: number) => (
                                                <div key={i} className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg text-xs">
                                                    <p className="font-bold text-orange-800 dark:text-orange-400 mb-1">{b.zone_id}</p>
                                                    <p className="text-slate-600 dark:text-slate-400">{b.root_cause}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 text-center px-4">
                                    <Activity size={32} className="mb-2"/>
                                    <p className="text-sm">Waiting for AI Analysis...</p>
                                    <p className="text-xs mt-1">Click "Start" on the video feed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {viewingClip && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg border border-slate-800 shadow-2xl">
                        <button onClick={() => setViewingClip(null)} className="absolute -top-12 right-0 text-white hover:text-red-500"><X/></button>
                        <video src={viewingClip} controls autoPlay className="w-full h-full rounded-lg" />
                    </div>
                </div>
            )}
        </div>
    );
};
