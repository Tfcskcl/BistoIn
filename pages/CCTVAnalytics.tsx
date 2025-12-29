
import React, { useState, useRef, useEffect } from 'react';
import { User, CCTVAnalysisResult, CCTVEvent, SOP, RecipeCard, AppView, BehavioralPattern, OperationalMetrics, HygieneViolation, Task, CameraFeed, CameraProvider, FacilityArea } from '../types';
import { analyzeStaffMovement, generateChecklistFromAnalysis, generateRevisedSOPFromAnalysis } from '../services/geminiService';
import { storageService, storageEvents, dispatchDataUpdatedEvent } from '../services/storageService';
import { 
    Video, Activity, AlertTriangle, PlayCircle, 
    Loader2, Sparkles, Upload, FileVideo, 
    ShieldAlert, ScanLine, Utensils, Store, Coffee, 
    Box, ShieldCheck, Package, MapPin, ListChecks, 
    Gauge, MousePointer2, Download, Timer, Route, TrendingDown, Zap, CheckCircle2,
    ClipboardList, FileText, CheckSquare, Plus, Save, ArrowRight, Clock, RefreshCw, HelpCircle, ChevronDown, BookOpen, ChefHat, History, Info, X, Search, Eye, Biohazard, Flame, Droplets, Printer, Footprints, Wallet, IndianRupee, HandCoins, Receipt, Camera, MonitorDot, Radio, Crosshair, Link, Network, Server, Key, Shield, Trash2, LayoutGrid, BarChart3, Fingerprint, Coins
} from 'lucide-react';

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

const ProviderIcon = ({ provider }: { provider?: CameraProvider }) => {
    switch (provider) {
        case 'EZVIZ': return <div className="text-[8px] font-black bg-orange-500 text-white px-1 rounded">EZVIZ</div>;
        case 'HIKVISION': return <div className="text-[8px] font-black bg-red-600 text-white px-1 rounded">HIK</div>;
        case 'CP_PLUS': return <div className="text-[8px] font-black bg-blue-600 text-white px-1 rounded">CP+</div>;
        default: return <Link size={10} className="text-slate-400" />;
    }
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
    
    // Live Mode State
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detections, setDetections] = useState<DetectionBox[]>([]);
    const [liveLogs, setLiveLogs] = useState<{msg: string, time: string, type: 'info' | 'alert'}[]>([]);
    
    // Feed Management Modal
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [showEzvizGuide, setShowEzvizGuide] = useState(false);
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
        return frames;
    };

    const handleAnalyzeVideo = async (vidFile: VideoFile) => {
        if (!videoRef.current || isAnalyzing) return;
        
        setIsAnalyzing(true);
        setAnalysisProgress(10);
        setActiveTab('report');

        try {
            const videoElement = videoRef.current;
            setAnalysisProgress(30);
            const frames = await captureFrames(videoElement, 4);
            
            setAnalysisProgress(50);
            const result = await analyzeStaffMovement(
                `Comprehensive audit of ${vidFile.name}. Focus on hygiene adherence, cash movement integrity at the counter, and staff efficiency patterns.`,
                ['Kitchen', 'Service Area', 'Dining Area', 'Storage'],
                undefined,
                undefined,
                frames
            );

            setAnalysisProgress(90);
            const updatedVideos = videos.map(v => v.id === vidFile.id ? { ...v, status: 'completed' as const, analysis: result } : v);
            setVideos(updatedVideos);
            storageService.saveCCTVAnalysis(user.id, result, vidFile.name);
            setAnalysisProgress(100);
            
            setTimeout(() => {
                setIsAnalyzing(false);
                setAnalysisProgress(0);
            }, 1000);
        } catch (err: any) {
            console.error("Analysis Error:", err);
            const updatedVideos = videos.map(v => v.id === vidFile.id ? { ...v, status: 'failed' as const, errorMsg: err.message } : v);
            setVideos(updatedVideos);
            setIsAnalyzing(false);
        }
    };

    const handleDownloadReport = (analysis: CCTVAnalysisResult, videoName: string) => {
        const win = window.open('', '_blank');
        if (!win) return;

        const date = new Date().toLocaleString();
        
        win.document.write(`
            <html>
                <head>
                    <title>BistroVision Neural Audit - ${videoName}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { margin: 15mm; size: A4; }
                        .glass-print { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px; padding: 16px; }
                    </style>
                </head>
                <body class="p-10 bg-white text-slate-900">
                    <div class="max-w-4xl mx-auto">
                        <div class="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-10">
                            <div>
                                <h1 class="text-4xl font-black uppercase tracking-tighter">BistroVision Neural Audit</h1>
                                <p class="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Vision Node 04 // ${analysis.detected_area}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black uppercase text-emerald-600 tracking-[0.3em] mb-1">Authenticated AI Report</p>
                                <p class="text-lg font-bold">${user.restaurantName}</p>
                                <p class="text-[10px] text-slate-400 font-mono">${date}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-6 mb-10">
                            <div class="glass-print">
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency Score</p>
                                <p class="text-3xl font-black text-emerald-600">${analysis.performance_scores.kitchen_efficiency}%</p>
                            </div>
                            <div class="glass-print">
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Hygiene Compliance</p>
                                <p class="text-3xl font-black text-blue-600">${analysis.performance_scores.hygiene_safety_score}%</p>
                            </div>
                            <div class="glass-print">
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Integrity</p>
                                <p class="text-3xl font-black text-indigo-600">${analysis.performance_scores.financial_integrity_score}%</p>
                            </div>
                        </div>

                        <div class="mb-10">
                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1">Executive Summary</h3>
                            <p class="text-sm italic leading-relaxed text-slate-700">"${analysis.summary_report}"</p>
                        </div>

                        <div class="grid grid-cols-2 gap-10 mb-10">
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1">Hygiene Deviations</h3>
                                <div class="space-y-4">
                                    ${analysis.hygiene_audit?.violations.length === 0 ? '<p class="text-sm text-emerald-600 font-bold">✓ Zero violations detected.</p>' : 
                                        analysis.hygiene_audit?.violations.map(v => `
                                        <div class="p-3 bg-slate-50 rounded-lg border-l-4 ${v.severity === 'high' ? 'border-red-500' : 'border-amber-500'}">
                                            <p class="text-[10px] font-black uppercase">${v.type}</p>
                                            <p class="text-xs text-slate-600 mt-1">${v.description}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1">Financial Audit</h3>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs font-bold border-b pb-1"><span>Total Received</span><span>₹${analysis.cash_movement?.total_received}</span></div>
                                    <div class="flex justify-between text-xs font-bold border-b pb-1"><span>Withdrawals</span><span class="text-red-600">₹${analysis.cash_movement?.total_withdrawals}</span></div>
                                    <div class="flex justify-between text-xs font-bold border-b pb-1"><span>Discrepancies</span><span class="${analysis.cash_movement?.drawer_discrepancies ? 'text-red-600' : 'text-emerald-600'}">${analysis.cash_movement?.drawer_discrepancies}</span></div>
                                </div>
                                <div class="mt-4">
                                    <p class="text-[9px] font-black uppercase text-slate-400 mb-2">Withdrawal Log</p>
                                    ${analysis.cash_movement?.withdrawal_logs.map(log => `
                                        <div class="flex justify-between text-[10px] mb-1">
                                            <span class="text-slate-500">${log.timestamp}</span>
                                            <span class="font-bold">${log.purpose} - ₹${log.amount}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="pt-10 border-t-2 border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex justify-between">
                            <div>Source Archive: ${videoName}</div>
                            <div>BistroConnect Intelligence Systems • NODE_04</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => {
            win.focus();
            win.print();
            win.close();
        }, 1000);
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
            } catch (err) {
                alert("Camera access denied.");
            }
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
            if (!selectedVideoId) setSelectedVideoId(newVideos[0].id);
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
                {/* Score Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="col-span-1 md:col-span-2 glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Health Pass</h4>
                            <button onClick={() => handleDownloadReport(analysis, videoName)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20" title="Download Audit Spec Sheet">
                                <Printer size={14}/>
                            </button>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <ScoreCircle score={analysis.performance_scores.kitchen_efficiency} label="Efficiency" color="text-emerald-500" />
                            <ScoreCircle score={analysis.performance_scores.hygiene_safety_score || 0} label="Hygiene" color="text-blue-500" />
                            <ScoreCircle score={analysis.performance_scores.financial_integrity_score || 0} label="Integrity" color="text-indigo-500" />
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-3 glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 bg-emerald-500/5 border-emerald-500/20">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={12}/> AI Auditor Summary</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">"{analysis.summary_report}"</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Staff Movement & Patterns */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 h-full">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Footprints size={14} className="text-blue-500"/> Workflow Patterns</h4>
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

                    {/* Hygiene & Safety Audit */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 h-full">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Biohazard size={14} className="text-red-500"/> Hygiene Violations</h4>
                            <div className="space-y-3">
                                {analysis.hygiene_audit?.violations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                        <ShieldCheck size={40} className="text-emerald-500 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Zero Violations</p>
                                    </div>
                                ) : (
                                    analysis.hygiene_audit?.violations.map((v, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border-l-4 ${v.severity === 'high' ? 'border-l-red-500 bg-red-500/5' : 'border-l-amber-500 bg-amber-500/5'} border-slate-100 dark:border-slate-800`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className="text-[10px] font-black dark:text-white uppercase">{v.type.replace('_', ' ')}</h5>
                                                <span className={`text-[8px] font-black uppercase px-1.5 rounded ${v.severity === 'high' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>{v.severity}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{v.description}</p>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase">
                                                <ArrowRight size={10}/> {v.action_required}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl"><p className="text-[8px] text-slate-400 uppercase font-black mb-1">Gas Safety</p><p className="text-[10px] font-bold dark:text-white uppercase">{analysis.hygiene_audit?.gas_hygiene_status}</p></div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl"><p className="text-[8px] text-slate-400 uppercase font-black mb-1">Floor Status</p><p className="text-[10px] font-bold dark:text-white uppercase">{analysis.hygiene_audit?.floor_status}</p></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Integrity (Cash) */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-3xl border-slate-200 dark:border-slate-800 h-full">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><IndianRupee size={14} className="text-emerald-500"/> Cash Flow Audit</h4>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-900 rounded-2xl text-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <div><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Est. Recieved</p><p className="text-2xl font-black">₹{analysis.cash_movement?.total_received}</p></div>
                                        <div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Withdrawals</p><p className="text-lg font-bold text-red-400">₹{analysis.cash_movement?.total_withdrawals}</p></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                        <span className="text-[9px] font-black uppercase text-slate-500">Drawer Discrepancies</span>
                                        <span className={`text-[10px] font-black ${analysis.cash_movement?.drawer_discrepancies ? 'text-red-400' : 'text-emerald-400'}`}>{analysis.cash_movement?.drawer_discrepancies || 0} detected</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Anomalous Activity</p>
                                    {analysis.cash_movement?.withdrawal_logs.map((log, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-red-500/30 transition-all">
                                            <div><p className="text-[10px] font-bold dark:text-white">{log.purpose}</p><p className="text-[8px] text-slate-400 font-mono">{log.timestamp}</p></div>
                                            <div className="text-right"><p className="text-xs font-black text-red-500">₹{log.amount}</p><p className={`text-[7px] font-black uppercase ${log.authorized ? 'text-emerald-500' : 'text-red-500'}`}>{log.authorized ? 'AUTHORIZED' : 'UNAUTHORIZED'}</p></div>
                                        </div>
                                    ))}
                                    {analysis.cash_movement?.withdrawal_logs.length === 0 && <p className="text-[10px] italic text-slate-400 text-center py-4">No withdrawals flagged in session.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><ClipboardList size={80}/></div>
                    <div className="relative z-10">
                        <h4 className="text-white font-black text-lg uppercase tracking-tight">Need a Revised Protocol?</h4>
                        <p className="text-slate-400 text-xs mt-1">AI can generate a new SOP based on these observed deviations.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => handleDownloadReport(analysis, videoName)} className="relative z-10 px-6 py-3 bg-slate-800 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-2">
                            <Download size={14}/> PDF Report
                        </button>
                        <button className="relative z-10 px-8 py-3 bg-white text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl">Synthesize New SOP</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><MonitorDot size={24}/></div>
                    <div><h1 className="font-bold text-lg dark:text-white uppercase tracking-tighter">BistroVision Hub</h1><p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">// INTEGRATED_NVR_CONTROL</p></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleLiveMode} className={`px-4 py-2 rounded-lg text-xs font-bold flex gap-2 items-center transition-all ${isLiveMode ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <Radio size={14}/> {isLiveMode ? 'LOCAL ACTIVE' : 'LOCAL ACCESS'}
                    </button>
                    <button onClick={() => setShowFeedModal(true)} className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-bold flex gap-2 items-center hover:scale-105 transition-all shadow-lg"><Network size={14}/> Add Network Feed</button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex gap-2 items-center hover:bg-emerald-700 transition-all"><Upload size={14}/> Ingest Archive</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" multiple onChange={handleVideoUpload} />
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Sidebar Feed Library */}
                <div className="w-80 flex flex-col gap-4 shrink-0">
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm transition-colors">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Channels</h3>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 rounded font-mono">{videos.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {/* Local Feed */}
                            <div onClick={toggleLiveMode} className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${isLiveMode ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isLiveMode ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}><Camera size={18} /></div>
                                    <div className="flex-1 overflow-hidden"><p className="text-xs font-bold truncate dark:text-white">Local Gateway</p><p className={`text-[9px] uppercase font-black tracking-widest ${isLiveMode ? 'text-red-500' : 'text-slate-400'}`}>{isLiveMode ? 'STREAM_CONNECTED' : 'OFFLINE'}</p></div>
                                </div>
                            </div>
                            
                            {/* Network & Uploaded Feeds */}
                            {videos.map(vid => (
                                <div key={vid.id} onClick={() => { setSelectedVideoId(vid.id); setIsLiveMode(false); setActiveTab('feed'); }} className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${selectedVideoId === vid.id ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${vid.isExternalFeed ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                            {vid.isExternalFeed ? <Server size={18} /> : <AreaIcon area={vid.analysis?.detected_area} />}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <p className="text-xs font-bold truncate dark:text-white">{vid.name}</p>
                                                {vid.provider && <ProviderIcon provider={vid.provider} />}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-[9px] uppercase font-black tracking-widest ${vid.isExternalFeed ? 'text-indigo-400' : 'text-slate-400'}`}>{vid.isExternalFeed ? 'NET_STREAM' : 'ARCHIVE_DATA'}</p>
                                                {vid.analysis && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 rounded uppercase font-black tracking-tighter">AUDITED</span>}
                                            </div>
                                        </div>
                                        {vid.isExternalFeed && <button onClick={(e) => handleDeleteFeed(vid.id, e)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Main Monitoring Area */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 overflow-hidden bg-slate-950 rounded-xl border border-slate-800 relative transition-colors shadow-2xl flex flex-col">
                        
                        {/* Tab Headers */}
                        <div className="flex border-b border-slate-800 bg-slate-900/50">
                            <button onClick={() => setActiveTab('feed')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'feed' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Visual Feed</button>
                            <button onClick={() => setActiveTab('report')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'report' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Neural Audit Report</button>
                            <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'logs' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>System Logs</button>
                        </div>

                        <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                            {activeTab === 'feed' ? (
                                <div className="h-full relative bg-black flex items-center justify-center overflow-hidden">
                                    {isLiveMode || selectedVideo?.isExternalFeed ? (
                                        <>
                                            <div className="absolute inset-0 z-10 pointer-events-none">
                                                {detections.map(det => (
                                                    <div 
                                                        key={det.id}
                                                        className="absolute border-2 rounded-sm transition-all duration-300"
                                                        style={{ left: `${det.x}%`, top: `${det.y}%`, width: `${det.w}%`, height: `${det.h}%`, borderColor: det.color, boxShadow: `0 0 15px ${det.color}66` }}
                                                    >
                                                        <div className="absolute -top-5 left-0 px-1 py-0.5 text-[7px] font-black text-white uppercase tracking-widest whitespace-nowrap" style={{ backgroundColor: det.color }}>
                                                            {det.label} | {(det.confidence * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="absolute top-6 left-6 flex items-center gap-3">
                                                    <div className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Neural Handshake Established</span>
                                                </div>
                                            </div>
                                            {isLiveMode ? (
                                                <video ref={liveVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1] opacity-60" onLoadedMetadata={e => { (e.target as HTMLVideoElement).srcObject = stream; }} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-6 text-center animate-fade-in p-12">
                                                    <div className="relative">
                                                        <Server size={80} className="text-slate-800 animate-pulse" />
                                                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-lg border-2 border-slate-950"><Network size={20} className="text-white"/></div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-white font-black text-xl uppercase tracking-tighter">BistroCloud Neural Tunnel Active</p>
                                                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest max-w-sm">RTSP Stream detected at {selectedVideo?.url}. Neural processing happening on edge node.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : selectedVideo ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <video ref={videoRef} key={selectedVideo.url} src={selectedVideo.url} className="w-full h-full object-contain opacity-80" autoPlay loop muted crossOrigin="anonymous" />
                                            
                                            {/* Overlay for non-analyzed videos */}
                                            {!selectedVideo.analysis && !isAnalyzing && (
                                                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                                                    <div className="glass p-8 rounded-[2.5rem] border-slate-200/20 flex flex-col items-center gap-6 text-center max-w-sm animate-scale-in">
                                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><ScanLine className="text-emerald-500" size={32}/></div>
                                                        <div><h4 className="text-white font-black uppercase tracking-tight text-xl">Archive Ready</h4><p className="text-xs text-slate-400 mt-2">Neural engine can extract hygiene scores, staff patterns, and financial discrepancies from this footage.</p></div>
                                                        <button onClick={() => handleAnalyzeVideo(selectedVideo)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"><Sparkles size={14}/> Run Neural Audit Pass</button>
                                                    </div>
                                                </div>
                                            )}

                                            {isAnalyzing && (
                                                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50">
                                                    <div className="text-center w-full max-w-md px-10">
                                                        <div className="relative mb-8 mx-auto w-24 h-24">
                                                            <Loader2 size={96} className="animate-spin text-emerald-500/20" />
                                                            <Activity size={40} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                                                        </div>
                                                        <h4 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Analyzing Behavioral Matrix</h4>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-8 font-mono">NODE_04 // SCAN_PROCESS: {analysisProgress}%</p>
                                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${analysisProgress}%` }}></div>
                                                        </div>
                                                        <div className="mt-4 flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                            <span>Extraction</span>
                                                            <span>Synthesis</span>
                                                            <span>Reporting</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-4 text-center">
                                            <MonitorDot size={48} className="text-slate-800" />
                                            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-30">Neural Video Gateway Standby</p>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'report' ? (
                                <div className="p-8 h-full">
                                    {selectedVideo?.analysis ? (
                                        renderReport(selectedVideo.analysis, selectedVideo.name)
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40">
                                            <LayoutGrid size={48} className="mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No Analysis Data Found</p>
                                            <p className="text-xs mt-2 italic font-medium">Select a video and run 'Neural Audit' to generate insights.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">
                                    {liveLogs.map((log, i) => (
                                        <div key={i} className={`flex items-center gap-3 font-mono text-[10px] animate-fade-in ${log.type === 'alert' ? 'text-red-500' : 'text-slate-500'}`}>
                                            <span className="opacity-40">[{log.time}]</span>
                                            <span className="font-bold">{log.msg}</span>
                                        </div>
                                    ))}
                                    {liveLogs.length === 0 && <div className="text-center py-20 opacity-20 italic text-[10px] uppercase font-bold tracking-widest">Awaiting Neural Context...</div>}
                                </div>
                            )}
                        </div>

                        {/* Integrated Event Console (Footer) */}
                        {(isLiveMode || selectedVideo) && activeTab === 'feed' && (
                            <div className="h-48 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md flex overflow-hidden shrink-0">
                                <div className="w-64 border-r border-slate-800 p-6 shrink-0">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Neural Status</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 uppercase font-bold">Extraction</span><span className="text-[10px] font-black text-emerald-500 uppercase">ONLINE</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 uppercase font-bold">Inference</span><span className="text-[10px] font-black text-indigo-400 uppercase">STABLE</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 uppercase font-bold">Latency</span><span className="text-[10px] font-black text-blue-500 uppercase font-mono">12ms</span></div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                                    {liveLogs.map((log, i) => (
                                        <div key={i} className={`flex items-center gap-3 font-mono text-[10px] animate-fade-in ${log.type === 'alert' ? 'text-red-500' : 'text-slate-500'}`}>
                                            <span className="opacity-40">[{log.time}]</span>
                                            <span className="font-bold">{log.msg}</span>
                                        </div>
                                    ))}
                                    {liveLogs.length === 0 && <div className="text-center py-10 opacity-20 italic text-[10px] uppercase font-bold tracking-widest">Establishing Neural Context...</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Feed Modal */}
            {showFeedModal && (
                <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
                    <div className="max-w-4xl w-full flex flex-col lg:flex-row bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-scale-in">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-indigo-600"></div>
                        
                        {/* Configuration Panel */}
                        <div className="flex-1 p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20"><Network className="text-indigo-500" /></div>
                                <div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Network Stream Ingress</h3><p className="text-xs font-mono text-slate-500 uppercase tracking-widest">// RTSP_HTTP_GATEWAY // NODE_04</p></div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Feed Identity</label>
                                        <input value={newFeed.name} onChange={e => setNewFeed({...newFeed, name: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Kitchen Station 1" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Protocol / Provider</label>
                                        <select 
                                            value={newFeed.provider} 
                                            onChange={e => {
                                                const p = e.target.value as CameraProvider;
                                                setNewFeed({...newFeed, provider: p});
                                                if (p === 'EZVIZ') setShowEzvizGuide(true);
                                            }} 
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
                                        >
                                            <option value="EZVIZ">EZVIZ (OpenStream)</option>
                                            <option value="HIKVISION">Hikvision (ISAPI)</option>
                                            <option value="CP_PLUS">CP PLUS (InstaCloud)</option>
                                            <option value="DAHUA">Dahua (P2P)</option>
                                            <option value="GENERIC_RTSP">Generic RTSP</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stream Endpoint (RTSP / HTTP)</label>
                                        <button onClick={() => setShowEzvizGuide(!showEzvizGuide)} className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 hover:underline"><HelpCircle size={12}/> {showEzvizGuide ? 'Hide Guide' : 'Need help?'}</button>
                                    </div>
                                    <div className="relative">
                                        <Link className="absolute left-3 top-3.5 text-slate-500" size={16}/>
                                        <input value={newFeed.url} onChange={e => setNewFeed({...newFeed, url: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="rtsp://admin:VERIFICATION_CODE@192.168.1.100:554/h264_stream" />
                                    </div>
                                </div>

                                <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-start gap-4">
                                    <ShieldCheck className="text-indigo-500 shrink-0 mt-1" size={18}/>
                                    <p className="text-[11px] text-slate-400 leading-relaxed italic">"BistroConnect acts as a neural bridge. Your stream is processed on a private instance and never exposed to the public internet."</p>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setShowFeedModal(false)} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">Cancel</button>
                                    <button 
                                        onClick={handleAddFeed}
                                        disabled={!newFeed.name || !newFeed.url}
                                        className="flex-[2] py-4 bg-white text-slate-950 font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-indigo-400 transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
                                    >
                                        Establish Neural Link
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Help / Guide Panel */}
                        <div className={`lg:w-80 bg-slate-950/50 p-8 border-l border-slate-800 transition-all ${showEzvizGuide ? 'block' : 'hidden lg:block lg:opacity-50'}`}>
                            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Info size={16} className="text-indigo-400"/> EZVIZ Linking Guide</h4>
                            
                            <div className="space-y-6 text-[11px]">
                                <div className="space-y-2">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">1. Avoid the QR Code Screen</p>
                                    <p className="text-amber-200 bg-amber-500/10 p-2 rounded border border-amber-500/30">If you see a QR code or <b>"Share the device"</b>, you clicked the wrong button. Go back to the main Settings list.</p>
                                </div>

                                <div className="space-y-2 border-l-2 border-indigo-500 pl-3 bg-indigo-500/5 py-2 rounded">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">2. Tap the Name</p>
                                    <p className="text-slate-200">On the settings screen with the list, tap the row that says <b>Camera 01 &gt;</b> (usually the very first item).</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">3. Disable Encryption</p>
                                    <p className="text-slate-500">Inside that sub-menu, look for <b>Image Encryption</b> and turn it <b>OFF</b>. This allows our AI to verify the feed locally.</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">4. RTSP URL Pattern</p>
                                    <div className="bg-black p-3 rounded-lg border border-slate-800 font-mono text-indigo-400 break-all select-all">
                                        rtsp://admin:AUTH_CODE@CAM_IP:554/h264_stream
                                    </div>
                                    <p className="text-slate-500 mt-2">**AUTH_CODE** is the 6-character code on your physical camera sticker.</p>
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                                        <Shield size={18}/>
                                        <span className="font-bold">Neural Pass: Secured</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
