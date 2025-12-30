
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, CCTVAnalysisResult, CCTVEvent, SOP, RecipeCard, AppView, BehavioralPattern, OperationalMetrics, HygieneViolation, Task, CameraFeed, CameraProvider, FacilityArea } from '../types';
import { analyzeStaffMovement, openNeuralGateway } from '../services/geminiService';
import { storageService, storageEvents, dispatchDataUpdatedEvent } from '../services/storageService';
import { 
    Video, Activity, AlertTriangle, PlayCircle, 
    Loader2, Sparkles, Upload, FileVideo, 
    ShieldAlert, ScanLine, Utensils, Store, Coffee, 
    Box, ShieldCheck, Package, MapPin, ListChecks, 
    Gauge, MousePointer2, Download, Timer, Route, TrendingDown, Zap, CheckCircle2,
    ClipboardList, FileText, CheckSquare, Plus, Save, ArrowRight, Clock, RefreshCw, HelpCircle, ChevronDown, BookOpen, ChefHat, History, Info, X, Search, Eye, Biohazard, Flame, Droplets, Printer, Footprints, Wallet, IndianRupee, HandCoins, Receipt, Camera, MonitorDot, Radio, Crosshair, Link, Network, Server, Key, Shield, Trash2, LayoutGrid, BarChart3, Fingerprint, Coins, FileJson
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VideoFile {
    id: string;
    name: string;
    url: string;
    size: string;
    status: 'pending' | 'classifying' | 'scanning' | 'completed' | 'failed';
    analysis?: CCTVAnalysisResult;
    errorMsg?: string;
    recipeId?: string;
    sopId?: string;
    isExternalFeed?: boolean;
    provider?: CameraProvider;
}

interface DetectionBox {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    confidence: number;
}

const AreaIcon = ({ area }: { area?: string }) => {
    const areaStr = String(area || '').toLowerCase();
    if (areaStr.includes('kitchen')) return <Utensils size={24} className="text-emerald-500" />;
    if (areaStr.includes('service')) return <Coffee size={24} className="text-blue-500" />;
    if (areaStr.includes('dine') || areaStr.includes('dining')) return <Store size={24} className="text-amber-500" />;
    if (areaStr.includes('store') || areaStr.includes('storage')) return <Box size={24} className="text-purple-500" />;
    return <ScanLine size={24} className="text-slate-400" />;
};

const ScoreCircle = ({ score, label, color }: { score: number, label: string, color: string }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * score) / 100} className={color} />
            </svg>
            <span className="absolute text-xs font-black dark:text-white">{score}%</span>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 text-center">{label}</span>
    </div>
);

export const CCTVAnalytics: React.FC<{ user: User; onChangeView: (view: AppView) => void; onActionSOP?: (sop: SOP) => void; }> = ({ user, onChangeView, onActionSOP }) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'report' | 'logs'>('feed');
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [networkFeeds, setNetworkFeeds] = useState<CameraFeed[]>([]);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [timeFrame, setTimeFrame] = useState<'shift' | 'hour' | 'realtime'>('hour');
    
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detections, setDetections] = useState<DetectionBox[]>([]);
    const [liveLogs, setLiveLogs] = useState<{msg: string, time: string, type: 'info' | 'alert'}[]>([]);
    
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [newFeed, setNewFeed] = useState<Partial<CameraFeed>>({
        name: '', url: '', provider: 'EZVIZ', area: 'Kitchen'
    });

    const [libraryRecipes, setLibraryRecipes] = useState<RecipeCard[]>([]);
    const [librarySops, setLibrarySops] = useState<SOP[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const selectedVideo = videos.find(v => v.id === selectedVideoId);

    const dwellChartData = useMemo(() => {
        if (!selectedVideo?.analysis?.dwell_times) return [];
        return Object.entries(selectedVideo.analysis.dwell_times).map(([name, value]) => ({
            name,
            seconds: value
        }));
    }, [selectedVideo]);

    useEffect(() => {
        const loadContext = () => {
            setLibraryRecipes(storageService.getSavedRecipes(user.id));
            setLibrarySops(storageService.getSavedSOPs(user.id));
            const savedFeeds = storageService.getCameraFeeds(user.id);
            setNetworkFeeds(savedFeeds);
            
            const feedWrappers: VideoFile[] = savedFeeds.map(f => ({
                id: f.id,
                name: f.name,
                url: f.url,
                size: 'LIVE',
                status: 'pending',
                isExternalFeed: true,
                provider: f.provider
            }));
            setVideos(prev => {
                const uploads = prev.filter(v => !v.isExternalFeed);
                return [...feedWrappers, ...uploads];
            });
        };
        loadContext();
        window.addEventListener(storageEvents.DATA_UPDATED, loadContext);
        return () => {
            window.removeEventListener(storageEvents.DATA_UPDATED, loadContext);
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [user.id]);

    useEffect(() => {
        let interval: any;
        if ((isLiveMode && stream) || (selectedVideo?.isExternalFeed)) {
            interval = setInterval(() => {
                const mockLabels = ["Chef (Station 1)", "Staff (Service)", "Cash Drawer", "Hygiene Breach", "Customer (Entry)"];
                const newDetections: DetectionBox[] = Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, i) => {
                    const label = mockLabels[Math.floor(Math.random() * mockLabels.length)];
                    return {
                        id: `det_${i}`,
                        label,
                        x: Math.random() * 70,
                        y: Math.random() * 70,
                        w: 15 + Math.random() * 20,
                        h: 20 + Math.random() * 30,
                        color: label.includes('Breach') ? '#ef4444' : label.includes('Chef') ? '#10b981' : '#6366f1',
                        confidence: 0.85 + Math.random() * 0.14
                    };
                });
                setDetections(newDetections);
                
                if (Math.random() > 0.8) {
                    const isAlert = Math.random() > 0.8;
                    const msg = isAlert ? "⚠️ UNCOVERED FOOD DETECTED" : "✓ Hand hygiene verified";
                    setLiveLogs(prev => [{ msg, time: new Date().toLocaleTimeString(), type: isAlert ? 'alert' : 'info' }, ...prev].slice(0, 10));
                }
            }, 1000);
        } else {
            setDetections([]);
        }
        return () => clearInterval(interval);
    }, [isLiveMode, stream, selectedVideo]);

    const captureFrames = async (v: HTMLVideoElement, count: number): Promise<string[]> => {
        const frames: string[] = [];
        const canvas = canvasRef.current;
        if (!canvas) return [];
        const context = canvas.getContext('2d');
        if (!context) return [];

        if (v.duration && !isNaN(v.duration)) {
            const duration = v.duration;
            for (let i = 0; i < count; i++) {
                v.currentTime = (duration / (count + 1)) * (i + 1);
                await new Promise(r => {
                    const onSeeked = () => {
                        v.removeEventListener('seeked', onSeeked);
                        r(null);
                    };
                    v.addEventListener('seeked', onSeeked);
                });
                canvas.width = v.videoWidth;
                canvas.height = v.videoHeight;
                context.drawImage(v, 0, 0, canvas.width, canvas.height);
                frames.push(canvas.toDataURL('image/jpeg', 0.6));
            }
        } else {
            for (let i = 0; i < count; i++) {
                canvas.width = v.videoWidth || 1280;
                canvas.height = v.videoHeight || 720;
                context.drawImage(v, 0, 0, canvas.width, canvas.height);
                frames.push(canvas.toDataURL('image/jpeg', 0.6));
                await new Promise(r => setTimeout(r, 500));
            }
        }
        return frames;
    };

    const handleAnalyzeCurrent = async () => {
        const activeVid = isLiveMode ? liveVideoRef.current : videoRef.current;
        const targetName = isLiveMode ? 'Local Feed' : (selectedVideo?.name || 'Network Stream');

        if (!activeVid || isAnalyzing) return;
        
        setIsAnalyzing(true);
        setAnalysisProgress(10);
        setActiveTab('report');

        try {
            setAnalysisProgress(30);
            const frames = await captureFrames(activeVid, 4);
            
            setAnalysisProgress(50);
            const result = await analyzeStaffMovement(
                `Staff movement analysis mission: Focus on patterns in the kitchen over the ${timeFrame === 'hour' ? 'last hour' : 'current shift'}. Identify high-traffic zones and calculate dwell times.`,
                ['Prep Station', 'Cook Line', 'Wash Area', 'Plating Station', 'Pass'],
                undefined,
                undefined,
                frames
            );

            setAnalysisProgress(90);
            if (!isLiveMode && selectedVideoId) {
                const updatedVideos = videos.map(v => v.id === selectedVideoId ? { ...v, status: 'completed' as const, analysis: result } : v);
                setVideos(updatedVideos);
            }
            storageService.saveCCTVAnalysis(user.id, result, targetName);
            setAnalysisProgress(100);
            
            setTimeout(() => {
                setIsAnalyzing(false);
                setAnalysisProgress(0);
                if (isLiveMode) {
                    setVideos(prev => prev.map(v => v.id === selectedVideoId ? {...v, analysis: result} : v));
                }
            }, 1000);
        } catch (err: any) {
            console.error("Analysis Error:", err);
            setIsAnalyzing(false);
            if (err.message?.includes("NEURAL_LINK_EXPIRED") || err.message?.includes("entity was not found")) {
                alert("Auth Session Expired. Resetting Gateway Link...");
                await openNeuralGateway();
            } else {
                alert("Audit failed: " + err.message);
            }
        }
    };

    const handleDownloadReport = (analysis: CCTVAnalysisResult, videoName: string) => {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>BistroVision Neural Audit - ${videoName}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { margin: 15mm; size: A4; }
                    </style>
                </head>
                <body class="p-10 bg-white text-slate-900">
                    <div class="max-w-4xl mx-auto">
                        <div class="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-10">
                            <div>
                                <h1 class="text-4xl font-black uppercase tracking-tighter">Movement & Efficiency Audit</h1>
                                <p class="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Vision Node 04 // ${videoName}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black uppercase text-emerald-600 tracking-[0.3em] mb-1">Authenticated AI Synthesis</p>
                                <p class="text-lg font-bold">${user.restaurantName}</p>
                            </div>
                        </div>
                        <div class="p-6 bg-slate-50 rounded-2xl border-l-4 border-emerald-500 mb-10">
                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Executive Summary</h3>
                            <p class="text-sm italic font-medium">"${analysis.summary_report}"</p>
                        </div>
                        <div class="grid grid-cols-2 gap-10">
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1">Hotspot Distribution</h3>
                                ${analysis.staff_movement_summary?.high_traffic_zones.map(z => `<div class="mb-2 p-2 bg-slate-50 rounded text-xs font-bold uppercase">${z}</div>`).join('')}
                            </div>
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1">Dwell Time Matrix</h3>
                                ${Object.entries(analysis.dwell_times || {}).map(([z, t]) => `<div class="flex justify-between text-xs mb-2"><span>${z}</span><span class="font-bold">${t}s</span></div>`).join('')}
                            </div>
                        </div>
                        <div class="mt-20 pt-10 border-t border-slate-100 text-[9px] font-bold text-slate-400 uppercase text-center">
                            Authorized Operational Artifact // Generated by BistroConnect Intelligence
                        </div>
                    </div>
                </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BistroVision_Audit_${videoName.replace(/\s+/g, '_')}_${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadRawData = (analysis: CCTVAnalysisResult, videoName: string) => {
        const dataStr = JSON.stringify(analysis, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Telemetry_${videoName.replace(/\s+/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const toggleLiveMode = async () => {
        if (isLiveMode) {
            if (stream) stream.getTracks().forEach(t => t.stop());
            setStream(null);
            setIsLiveMode(false);
        } else {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(s);
                setIsLiveMode(true);
                setSelectedVideoId(null);
                setLiveLogs([{ msg: "Local Neural Gateway Active.", time: new Date().toLocaleTimeString(), type: 'info' }]);
            } catch (err) { alert("Camera access denied."); }
        }
    };

    const handleAddFeed = () => {
        if (!newFeed.name || !newFeed.url) return;
        const feed: CameraFeed = {
            id: `feed_${Date.now()}`,
            name: newFeed.name!,
            url: newFeed.url!,
            provider: newFeed.provider as CameraProvider,
            area: newFeed.area as FacilityArea,
            isActive: true
        };
        storageService.saveCameraFeed(user.id, feed);
        setShowFeedModal(false);
        setNewFeed({ name: '', url: '', provider: 'EZVIZ', area: 'Kitchen' });
        setSelectedVideoId(feed.id);
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newVideos: VideoFile[] = Array.from(files).map((file: File) => ({
                id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: file.name,
                url: URL.createObjectURL(file),
                size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                status: 'pending'
            }));
            setVideos(prev => [...prev, ...newVideos]);
            setIsLiveMode(false);
            setSelectedVideoId(newVideos[0].id);
        }
    };

    const handleDeleteFeed = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this camera feed?")) {
            storageService.deleteCameraFeed(user.id, id);
            if (selectedVideoId === id) setSelectedVideoId(null);
        }
    };

    const renderReport = (analysis: CCTVAnalysisResult, videoName: string) => {
        return (
            <div className="space-y-6 animate-fade-in p-2">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="col-span-1 md:col-span-2 glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Health Pass</h4>
                            <div className="flex gap-2">
                                <button onClick={() => handleDownloadRawData(analysis, videoName)} className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-all border border-indigo-500/20" title="Download Raw Telemetry">
                                    <FileJson size={14}/>
                                </button>
                                <button onClick={() => handleDownloadReport(analysis, videoName)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20" title="Download Audit Report">
                                    <Download size={14}/>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <ScoreCircle score={analysis.performance_scores.kitchen_efficiency} label="Efficiency" color="text-emerald-500" />
                            <ScoreCircle score={analysis.performance_scores.hygiene_safety_score || 0} label="Hygiene" color="text-blue-500" />
                            <ScoreCircle score={analysis.performance_scores.financial_integrity_score || 0} label="Integrity" color="text-indigo-500" />
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-3 glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 bg-emerald-500/5 border-emerald-500/20 relative">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={12}/> AI Auditor Summary</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">"{analysis.summary_report}"</p>
                        <div className="absolute bottom-6 right-6 flex items-center gap-2">
                            <Clock size={12} className="text-slate-400"/>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Analysis Period: {timeFrame === 'hour' ? 'Last 60 mins' : 'Real-time Pulse'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 h-full">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 size={14} className="text-indigo-500"/> Zone Hotspot Matrix (Mean Dwell Time)</h4>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dwellChartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        fontSize={10} 
                                        fontWeight="bold" 
                                        stroke="#94a3b8" 
                                        width={80}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                        labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                                        {dwellChartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.seconds > 300 ? '#ef4444' : '#6366f1'} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 h-full">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Footprints size={14} className="text-blue-500"/> Movement Patterns</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div><p className="text-2xl font-black dark:text-white">{analysis.staff_movement_summary?.total_trips}</p><p className="text-[9px] text-slate-400 uppercase font-bold">Total Trips</p></div>
                                <div className="text-right"><p className="text-xs font-bold text-red-500">{analysis.staff_movement_summary?.unproductive_movement_pct}%</p><p className="text-[9px] text-slate-400 uppercase font-bold">Unproductive</p></div>
                            </div>
                            <div className="space-y-2">
                                {analysis.staff_movement_summary?.patterns?.map((p, i) => (
                                    <div key={i} className={`p-3 rounded-2xl border ${p.detected ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-50'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tight">{p.name}</span>
                                            {p.detected && <Zap size={10} className="text-amber-500 animate-pulse" />}
                                        </div>
                                        <p className="text-[9px] text-slate-500 leading-snug">{p.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><MonitorDot size={24}/></div>
                    <div><h1 className="font-bold text-lg dark:text-white uppercase tracking-tighter">BistroVision Hub</h1><p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">// INTEGRATED_NVR_CONTROL</p></div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex border border-slate-200 dark:border-slate-700 mr-2">
                        <button onClick={() => setTimeFrame('realtime')} className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${timeFrame === 'realtime' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'}`}>Live Pulse</button>
                        <button onClick={() => setTimeFrame('hour')} className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${timeFrame === 'hour' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'}`}>Last 1 Hour</button>
                    </div>
                    <button onClick={toggleLiveMode} className={`px-4 py-2 rounded-lg text-xs font-bold flex gap-2 items-center transition-all ${isLiveMode ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><Radio size={14}/> {isLiveMode ? 'LOCAL ACTIVE' : 'LOCAL ACCESS'}</button>
                    <button onClick={() => setShowFeedModal(true)} className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-bold flex gap-2 items-center hover:scale-105 transition-all shadow-lg"><Network size={14}/> Add Feed</button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex gap-2 items-center hover:bg-emerald-700 transition-all"><Upload size={14}/> Ingest Archive</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" multiple onChange={handleVideoUpload} />
                </div>
            </div>
            <div className="flex-1 flex gap-4 overflow-hidden">
                <div className="w-80 flex flex-col gap-4 shrink-0">
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm transition-colors">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Channels</h3>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 rounded font-mono">{videos.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            <div onClick={toggleLiveMode} className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${isLiveMode ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isLiveMode ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}><Camera size={18} /></div>
                                    <div className="flex-1 overflow-hidden"><p className="text-xs font-bold truncate dark:text-white">Local Gateway</p><p className={`text-[9px] uppercase font-black tracking-widest ${isLiveMode ? 'text-red-500' : 'text-slate-400'}`}>{isLiveMode ? 'STREAM_CONNECTED' : 'OFFLINE'}</p></div>
                                </div>
                            </div>
                            {videos.map(vid => (
                                <div key={vid.id} onClick={() => { setSelectedVideoId(vid.id); setIsLiveMode(false); setActiveTab('feed'); }} className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${selectedVideoId === vid.id ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${vid.isExternalFeed ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{vid.isExternalFeed ? <Server size={18} /> : <AreaIcon area={vid.analysis?.detected_area} />}</div>
                                        <div className="flex-1 overflow-hidden"><p className="text-xs font-bold truncate dark:text-white">{vid.name}</p><p className={`text-[9px] uppercase font-black tracking-widest ${vid.isExternalFeed ? 'text-indigo-400' : 'text-slate-400'}`}>{vid.isExternalFeed ? 'NET_STREAM' : 'ARCHIVE_DATA'}</p></div>
                                        {vid.isExternalFeed && <button onClick={(e) => handleDeleteFeed(vid.id, e)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 overflow-hidden bg-slate-950 rounded-xl border border-slate-800 relative shadow-2xl flex flex-col">
                        <div className="flex border-b border-slate-800 bg-slate-900/50">
                            <button onClick={() => setActiveTab('feed')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'feed' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Visual Feed</button>
                            <button onClick={() => setActiveTab('report')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'report' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Movement Audit</button>
                            <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'logs' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Live Logs</button>
                        </div>
                        <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                            {activeTab === 'feed' ? (
                                <div className="h-full relative bg-black flex items-center justify-center overflow-hidden">
                                    {isLiveMode ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <video ref={liveVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1] opacity-60" onLoadedMetadata={e => { (e.target as HTMLVideoElement).srcObject = stream; }} />
                                            {!isAnalyzing && (
                                                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                                                    <div className="glass p-8 rounded-[2.5rem] border-slate-200/20 flex flex-col items-center gap-6 text-center max-w-sm animate-scale-in">
                                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><ScanLine className="text-emerald-500" size={32}/></div>
                                                        <div><h4 className="text-white font-black uppercase tracking-tight text-xl">Ready for Movement Pass</h4><p className="text-xs text-slate-400 mt-2">Initialize analysis mission for the {timeFrame === 'hour' ? 'last hour' : 'current shift'}.</p></div>
                                                        <button onClick={handleAnalyzeCurrent} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"><Sparkles size={14}/> Start Neural Pass</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedVideo ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {selectedVideo.isExternalFeed ? (
                                                <div className="flex flex-col items-center justify-center gap-6 text-center animate-fade-in p-12">
                                                    <div className="relative"><Server size={80} className="text-slate-800 animate-pulse" /><div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-lg border-2 border-slate-950"><Network size={20} className="text-white"/></div></div>
                                                    <p className="text-white font-black text-xl uppercase tracking-tighter">Neural Stream Tunnel Active</p>
                                                    {!selectedVideo.analysis && !isAnalyzing && (
                                                         <button onClick={handleAnalyzeCurrent} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">Audit Last 60 Mins</button>
                                                    )}
                                                </div>
                                            ) : (
                                                <video ref={videoRef} key={selectedVideo.url} src={selectedVideo.url} className="w-full h-full object-contain opacity-80" autoPlay loop muted crossOrigin="anonymous" />
                                            )}
                                            {!selectedVideo.analysis && !isAnalyzing && !selectedVideo.isExternalFeed && (
                                                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                                                    <div className="glass p-8 rounded-[2.5rem] border-slate-200/20 flex flex-col items-center gap-6 text-center max-w-sm animate-scale-in">
                                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><ScanLine className="text-emerald-500" size={32}/></div>
                                                        <div><h4 className="text-white font-black uppercase tracking-tight text-xl">Archive Ready</h4><p className="text-xs text-slate-400 mt-2">Extract movement patterns and traffic zones from archive footage.</p></div>
                                                        <button onClick={handleAnalyzeCurrent} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"><Sparkles size={14}/> Run Neural Audit Pass</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-4 text-center"><MonitorDot size={48} className="text-slate-800" /><p className="text-xs font-black uppercase tracking-[0.4em] opacity-30">Vision Gateway Standby</p></div>
                                    )}
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
                                            <div className="text-center w-full max-w-md px-10">
                                                <div className="relative mb-8 mx-auto w-24 h-24"><Loader2 size={96} className="animate-spin text-emerald-500/20" /><Activity size={40} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" /></div>
                                                <h4 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Analyzing Movement Mission</h4>
                                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-8"><div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${analysisProgress}%` }}></div></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'report' ? (
                                <div className="p-8 h-full">{(selectedVideo?.analysis) ? renderReport(selectedVideo.analysis, selectedVideo.name) : <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40"><LayoutGrid size={48} className="mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">No Analysis Data Found</p></div>}</div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">{liveLogs.map((log, i) => <div key={i} className={`flex items-center gap-3 font-mono text-[10px] animate-fade-in ${log.type === 'alert' ? 'text-red-500' : 'text-slate-500'}`}><span className="opacity-40">[{log.time}]</span><span className="font-bold">{log.msg}</span></div>)}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showFeedModal && (
                <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
                    <div className="max-w-4xl w-full flex flex-col lg:flex-row bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-scale-in">
                        <div className="flex-1 p-10">
                            <div className="flex items-center gap-4 mb-8"><div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20"><Network className="text-indigo-500" /></div><div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Network Stream Ingress</h3></div></div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Feed Identity</label><input value={newFeed.name} onChange={e => setNewFeed({...newFeed, name: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none" placeholder="e.g. Kitchen Station 1" /></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Protocol / Provider</label><select value={newFeed.provider} onChange={e => setNewFeed({...newFeed, provider: e.target.value as any})} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"><option value="EZVIZ">EZVIZ</option><option value="HIKVISION">Hikvision</option><option value="CP_PLUS">CP PLUS</option><option value="GENERIC_RTSP">Generic RTSP</option></select></div>
                                </div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stream Endpoint (RTSP / HTTP)</label><input value={newFeed.url} onChange={e => setNewFeed({...newFeed, url: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none font-mono" placeholder="rtsp://admin:VERCODE@IP:554/stream" /></div>
                                <div className="flex gap-3"><button onClick={() => setShowFeedModal(false)} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">Cancel</button><button onClick={handleAddFeed} disabled={!newFeed.name || !newFeed.url} className="flex-[2] py-4 bg-white text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl">Establish Neural Link</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
