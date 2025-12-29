
import React, { useState, useRef } from 'react';
// Added TrendingDown, BarChart3, Star to lucide-react imports
import { CheckCircle2, ArrowRight, ShieldCheck, FileText, UploadCloud, Video, Camera, Store, LayoutTemplate, AlertTriangle, Loader2, IndianRupee, MapPin, ChefHat, Database, Brain, Rocket, LogOut, Info, Fingerprint, TrendingDown, BarChart3, Star } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { SETUP_FEE } from '../constants';
import { PlanType } from '../types';
import { authService } from '../services/authService';
import { verifyLocationWithMaps } from '../services/geminiService';
// Added Logo import
import { Logo } from './Logo';

const STEPS = [
    { id: 'outlet_details', title: 'Outlet Profile', icon: Store },
    { id: 'integration', title: 'Data & Integration', icon: Database },
    { id: 'ops_ai', title: 'Restaurant Ops AI', icon: Camera },
    { id: 'strategy', title: 'AI Strategy', icon: Brain },
    { id: 'activation', title: 'Activation', icon: Rocket },
];

interface OnboardingWizardProps {
    onComplete: () => void;
    onExit: () => void;
}

export default function OnboardingWizard({ onComplete, onExit }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const user = authService.getCurrentUser();
    
    // --- Step 1: Outlet Details State ---
    const [outletData, setOutletData] = useState({
        restaurantName: '',
        location: '',
        cuisineType: '',
        gstNumber: '',
        fssaiNumber: ''
    });
    const [verifyingLoc, setVerifyingLoc] = useState(false);
    const [locDetails, setLocDetails] = useState<string | null>(null);

    // --- Step 2: Integration State ---
    const [integrationChoice, setIntegrationChoice] = useState<'upload' | 'ops_manager' | 'create_new' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Step 3: Ops AI State ---
    const [enableCCTV, setEnableCCTV] = useState(false);
    const [enableWorkflow, setEnableWorkflow] = useState(false);

    // --- Step 4: Strategy State ---
    const [strategyGoals, setStrategyGoals] = useState<string[]>([]);

    const saveOutletDetails = async () => {
        if (!user) return;
        const updatedUser = { 
            ...user, 
            restaurantName: outletData.restaurantName,
            location: outletData.location,
            cuisineType: outletData.cuisineType,
            gstNumber: outletData.gstNumber,
            fssaiNumber: outletData.fssaiNumber
        };
        await authService.updateUser(updatedUser);
    };

    const handleVerifyLocation = async () => {
        if (!outletData.location.trim()) return;
        setVerifyingLoc(true);
        try {
            const result = await verifyLocationWithMaps(outletData.location);
            setLocDetails(result);
        } catch (e) {
            setLocDetails("Verification unavailable.");
        } finally {
            setVerifyingLoc(false);
        }
    };

    const handleNext = async () => {
        setLoading(true);
        if (STEPS[currentStep].id === 'outlet_details') {
            await saveOutletDetails();
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoading(false);
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        alert(`Ingesting ${e.target.files?.length} files into AI Knowledge Base... Success.`);
    };

    const toggleStrategyGoal = (goal: string) => {
        if (strategyGoals.includes(goal)) {
            setStrategyGoals(prev => prev.filter(g => g !== goal));
        } else {
            setStrategyGoals(prev => [...prev, goal]);
        }
    };

    const handlePayment = async () => {
        if (!user) return;
        setLoading(true);
        const plan = integrationChoice === 'ops_manager' ? PlanType.OPS_MANAGER : PlanType.FREE;
        const amount = integrationChoice === 'ops_manager' ? 24999 : SETUP_FEE;

        await paymentService.initiatePayment(
            user,
            plan,
            amount,
            async (pid) => {
                const finalUser = {
                    ...user,
                    plan: plan,
                    setupComplete: true
                };
                await authService.updateUser(finalUser);
                alert("Account Activated! Launching Dashboard...");
                onComplete();
            },
            (err) => {
                if(err !== "Payment process cancelled") alert("Payment Failed");
                setLoading(false);
            }
        );
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm font-medium";
    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    const renderStepContent = () => {
        switch (STEPS[currentStep].id) {
            case 'outlet_details':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tell us about your Outlet</h3>
                            <p className="text-sm text-slate-500 mt-1">We need these technical parameters to calibrate the Neural OS for your market.</p>
                        </div>

                        <div className="space-y-5">
                            <div className="group">
                                <label className={labelClasses}>Restaurant Identity</label>
                                <div className="relative">
                                    <Store size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                                    <input 
                                        type="text" 
                                        value={outletData.restaurantName}
                                        onChange={(e) => setOutletData({...outletData, restaurantName: e.target.value})}
                                        className={inputClasses}
                                        placeholder="e.g. The Spicy Wok"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="group">
                                    <label className={labelClasses}>Market Location</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                                        <input 
                                            type="text" 
                                            value={outletData.location}
                                            onChange={(e) => setOutletData({...outletData, location: e.target.value})}
                                            className={inputClasses}
                                            placeholder="City / Area"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <button 
                                            onClick={handleVerifyLocation}
                                            disabled={verifyingLoc || !outletData.location}
                                            className="text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline disabled:opacity-50"
                                        >
                                            {verifyingLoc ? "Verifying Geospatial Nodes..." : "Verify via Neural Maps"}
                                        </button>
                                        {locDetails && <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Verified</span>}
                                    </div>
                                    {locDetails && (
                                        <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 leading-relaxed italic">
                                            "{locDetails}"
                                        </div>
                                    )}
                                </div>
                                <div className="group">
                                    <label className={labelClasses}>Cuisine Logic</label>
                                    <div className="relative">
                                        <ChefHat size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                                        <input 
                                            type="text" 
                                            value={outletData.cuisineType}
                                            onChange={(e) => setOutletData({...outletData, cuisineType: e.target.value})}
                                            className={inputClasses}
                                            placeholder="e.g. Modern Indian Fusion"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                <div>
                                    <label className={labelClasses}>GST Identification (Optional)</label>
                                    <div className="relative">
                                        <Fingerprint size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                        <input 
                                            type="text" 
                                            placeholder="24AAAAA0000A1Z5" 
                                            value={outletData.gstNumber}
                                            onChange={(e) => setOutletData({...outletData, gstNumber: e.target.value})}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>FSSAI License (Optional)</label>
                                    <div className="relative">
                                        <ShieldCheck size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                        <input 
                                            type="text" 
                                            placeholder="12345678901234" 
                                            value={outletData.fssaiNumber}
                                            onChange={(e) => setOutletData({...outletData, fssaiNumber: e.target.value})}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-start">
                            <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                                These details initialize your <strong>private instance</strong>. AI models use this for market-grounded ingredient pricing and local strategic insights.
                            </p>
                        </div>
                    </div>
                );

            case 'integration':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Data Ingress Mode</h3>
                            <p className="text-sm text-slate-500">Choose how to initialize your neural knowledge base.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div 
                                onClick={() => setIntegrationChoice('upload')}
                                className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-start gap-6 ${integrationChoice === 'upload' ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : 'border-slate-100 hover:border-emerald-200 bg-slate-50/30'}`}
                            >
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100"><UploadCloud size={24} className="text-blue-500"/></div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900">Legacy Data Ingestion</h4>
                                    <p className="text-xs text-slate-500 mt-1">OCR-scan existing Menus, Inventory Logs, and Recipes. We'll digitize and cost them automatically.</p>
                                    {integrationChoice === 'upload' && (
                                        <div className="mt-4 animate-fade-in">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                className="px-5 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                                            >
                                                Select Documentation
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload}/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div 
                                onClick={() => setIntegrationChoice('create_new')}
                                className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-start gap-6 ${integrationChoice === 'create_new' ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : 'border-slate-100 hover:border-emerald-200 bg-slate-50/30'}`}
                            >
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100"><FileText size={24} className="text-emerald-500"/></div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900">Synthesize New Standards</h4>
                                    <p className="text-xs text-slate-500 mt-1">Our AI will generate technical recipe cards, SOPs, and par-level inventory for your cuisine from scratch.</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => setIntegrationChoice('ops_manager')}
                                className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-start gap-6 ${integrationChoice === 'ops_manager' ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-slate-100 hover:border-purple-200 bg-slate-50/30'}`}
                            >
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100"><ShieldCheck size={24} className="text-purple-500"/></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-900">Concierge Deployment</h4>
                                        <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase">PRO</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Get a dedicated account manager for 24/7 technical setup, menu engineering audits, and CCTV hardware integration.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'ops_ai':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Vision & Workflow AI</h3>
                            <p className="text-sm text-slate-500">Enable neural surveillance and movement optimization.</p>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Video size={100}/></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400">
                                            <Camera size={24} />
                                        </div>
                                        <div>
                                            <span className="font-black text-xl uppercase tracking-tighter">BistroVision Audit</span>
                                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">LIVE_SURVEILLANCE_OS</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="toggle" checked={enableCCTV} onChange={() => setEnableCCTV(!enableCCTV)} className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 transition-all duration-300"/>
                                        <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-8 rounded-full cursor-pointer transition-colors ${enableCCTV ? 'bg-emerald-500' : 'bg-slate-700'}`}></label>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        "Automated Recipe Step Validation",
                                        "Real-time Hygiene Breach Detection",
                                        "Cash Drawer Integrity Monitoring"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex gap-3 text-sm text-slate-300 font-medium">
                                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0"/> {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-[1.5rem] border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${enableWorkflow ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-slate-50/50'}`} onClick={() => setEnableWorkflow(!enableWorkflow)}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-sm border ${enableWorkflow ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-100'}`}><LayoutTemplate size={24} /></div>
                                <div>
                                    <h4 className={`font-bold ${enableWorkflow ? 'text-blue-900' : 'text-slate-900'}`}>Kinetic Workflow Optimization</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">AI analyzes kinetic staff movement to minimize kitchen station collisions.</p>
                                </div>
                            </div>
                            <input type="checkbox" checked={enableWorkflow} onChange={() => {}} className="w-6 h-6 text-blue-600 rounded-lg pointer-events-none" />
                        </div>
                    </div>
                );

            case 'strategy':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Strategic Initialization</h3>
                            <p className="text-sm text-slate-500">Select your operational benchmarks for the first 90 days.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { goal: 'Reduce Food Cost', icon: TrendingDown },
                                { goal: 'Increase Volume', icon: BarChart3 },
                                { goal: 'Staff Productivity', icon: Users },
                                { goal: 'Menu Psychology', icon: Star },
                                { goal: 'Waste Reduction', icon: AlertTriangle },
                                { goal: 'Brand Expansion', icon: Rocket }
                            ].map(({ goal, icon: Icon }) => (
                                <button
                                    key={goal}
                                    onClick={() => toggleStrategyGoal(goal)}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 relative overflow-hidden group ${
                                        strategyGoals.includes(goal) 
                                        ? 'bg-indigo-600 border-indigo-600 shadow-xl' 
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                                    }`}
                                >
                                    <Icon size={20} className={strategyGoals.includes(goal) ? 'text-indigo-200' : 'text-slate-400'} />
                                    <span className={`text-sm font-black uppercase tracking-tight ${strategyGoals.includes(goal) ? 'text-white' : 'text-slate-800'}`}>{goal}</span>
                                    {strategyGoals.includes(goal) && <CheckCircle2 size={16} className="absolute top-4 right-4 text-indigo-300"/>}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 mt-6 flex gap-4">
                            <Brain className="text-indigo-600 shrink-0 mt-0.5" size={24} />
                            <p className="text-xs text-indigo-800 leading-relaxed">
                                <strong>Strategy Node Active:</strong> Based on your selections, I will synthesize a localized 90-day implementation roadmap incorporating weather trends and local competition data.
                            </p>
                        </div>
                    </div>
                );

            case 'activation':
                return (
                    <div className="text-center space-y-8 animate-fade-in py-8">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 relative z-10 shadow-2xl">
                                <Rocket size={48} />
                            </div>
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"></div>
                        </div>
                        
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Deployment Ready</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                                Finalizing your technical instance on the secure edge node. Choose activation package to launch.
                            </p>
                        </div>

                        <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldCheck size={120}/></div>
                            <div className="relative z-10">
                                <div className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Technical Provisioning</div>
                                <div className="text-6xl font-black text-white flex items-center justify-center gap-1">
                                    <span className="text-3xl opacity-50">₹</span>
                                    {integrationChoice === 'ops_manager' ? '24,999' : SETUP_FEE}
                                </div>
                                <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest">
                                    {integrationChoice === 'ops_manager' ? 'SUBSCRIPTION_MODEL // MONTHLY' : 'ONE_TIME_SYNTHESIS_FEE'}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full max-w-md mx-auto py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20}/> Activate Neural Nexus</>}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-3xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <Logo iconSize={24} light={true} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase">Neural Setup</h1>
                            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">NODE_04 // CONFIGURATION_MODE</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">CURRENT_MODULE</p>
                            <p className="text-sm font-black text-yellow-400 uppercase tracking-tight">{STEPS[currentStep].title}</p>
                        </div>
                        <button onClick={onExit} className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl hover:bg-white/10 transition-all border border-white/5" title="Abort Session">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <div className="w-full bg-slate-100 h-1.5 shrink-0">
                    <div className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#10b981]" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}></div>
                </div>

                <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                    {renderStepContent()}
                </div>

                {STEPS[currentStep].id !== 'activation' && (
                    <div className="p-8 border-t border-slate-50 flex justify-between items-center shrink-0 bg-white">
                        <button 
                            disabled={currentStep === 0} 
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-6 py-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 disabled:opacity-0 transition-all"
                        >
                            Back
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            disabled={loading || (currentStep === 0 && !outletData.restaurantName)}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-30"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <>Next Protocol <ArrowRight size={16} /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Minimal placeholder for missing icon if needed
const Users = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
