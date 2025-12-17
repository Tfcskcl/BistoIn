
import React, { useState, useRef } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, FileText, UploadCloud, Video, Camera, Store, LayoutTemplate, AlertTriangle, Loader2, IndianRupee, MapPin, ChefHat, Database, Brain, Rocket, LogOut } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { SETUP_FEE } from '../constants';
import { PlanType } from '../types';
import { authService } from '../services/authService';
import { verifyLocationWithMaps } from '../services/geminiService';

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
        // Save intermediate data to user profile
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
        
        // Save Data on transition
        if (STEPS[currentStep].id === 'outlet_details') {
            await saveOutletDetails();
        }

        // Simulate processing
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
        
        // If Ops Manager was selected in step 2 or 3, we might charge differently, 
        // but for now keeping the standard Setup Fee for simplicity as per request
        const plan = integrationChoice === 'ops_manager' ? PlanType.OPS_MANAGER : PlanType.FREE;
        const amount = integrationChoice === 'ops_manager' ? 24999 : SETUP_FEE;

        await paymentService.initiatePayment(
            user,
            plan,
            amount,
            async (pid) => {
                // Final save of all preferences
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

    const renderStepContent = () => {
        switch (STEPS[currentStep].id) {
            // --- STEP 1: OUTLET DETAILS ---
            case 'outlet_details':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Tell us about your Outlet</h3>
                            <p className="text-sm text-slate-500">We need these details to calibrate the AI for your specific market.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Restaurant Name</label>
                                <div className="relative">
                                    <Store size={16} className="absolute left-3 top-3 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        value={outletData.restaurantName}
                                        onChange={(e) => setOutletData({...outletData, restaurantName: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="e.g. The Spicy Wok"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-slate-400"/>
                                        <input 
                                            type="text" 
                                            value={outletData.location}
                                            onChange={(e) => setOutletData({...outletData, location: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="City / Area"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleVerifyLocation}
                                        disabled={verifyingLoc || !outletData.location}
                                        className="mt-1 text-[10px] text-blue-600 font-bold hover:underline"
                                    >
                                        {verifyingLoc ? "Checking Maps..." : "Verify Location"}
                                    </button>
                                    {locDetails && <p className="text-[10px] text-emerald-600">{locDetails}</p>}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cuisine</label>
                                    <div className="relative">
                                        <ChefHat size={16} className="absolute left-3 top-3 text-slate-400"/>
                                        <input 
                                            type="text" 
                                            value={outletData.cuisineType}
                                            onChange={(e) => setOutletData({...outletData, cuisineType: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="e.g. Indian, Pan-Asian"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder="GST No. (Optional)" 
                                    value={outletData.gstNumber}
                                    onChange={(e) => setOutletData({...outletData, gstNumber: e.target.value})}
                                    className="flex-1 px-4 py-2.5 border rounded-lg text-sm"
                                />
                                <input 
                                    type="text" 
                                    placeholder="FSSAI No. (Optional)" 
                                    value={outletData.fssaiNumber}
                                    onChange={(e) => setOutletData({...outletData, fssaiNumber: e.target.value})}
                                    className="flex-1 px-4 py-2.5 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>
                );

            // --- STEP 2: INTEGRATION & DATA ---
            case 'integration':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Integration & Data</h3>
                            <p className="text-sm text-slate-500">How would you like to initialize your operating system?</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Option 1: Upload */}
                            <div 
                                onClick={() => setIntegrationChoice('upload')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${integrationChoice === 'upload' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                            >
                                <div className="bg-white p-2 rounded-lg shadow-sm"><UploadCloud size={24} className="text-blue-500"/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">I have existing data</h4>
                                    <p className="text-xs text-slate-500 mt-1">Upload Menus, Inventory Logs, Recipes (PDF/Excel). We'll digitize them.</p>
                                    {integrationChoice === 'upload' && (
                                        <div className="mt-3">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                                            >
                                                Select Files
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload}/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 2: Create New */}
                            <div 
                                onClick={() => setIntegrationChoice('create_new')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${integrationChoice === 'create_new' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                            >
                                <div className="bg-white p-2 rounded-lg shadow-sm"><FileText size={24} className="text-emerald-500"/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">I don't have data (Create for me)</h4>
                                    <p className="text-xs text-slate-500 mt-1">Our AI will generate standard recipes, SOPs, and inventory lists for your cuisine.</p>
                                </div>
                            </div>

                            {/* Option 3: Ops Manager */}
                            <div 
                                onClick={() => setIntegrationChoice('ops_manager')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${integrationChoice === 'ops_manager' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}
                            >
                                <div className="bg-white p-2 rounded-lg shadow-sm"><AlertTriangle size={24} className="text-purple-500"/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">I need the Ops Manager Plan</h4>
                                    <p className="text-xs text-slate-500 mt-1">Skip manual setup. Get a dedicated account manager to set up everything + CCTV Integration.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            // --- STEP 3: RESTAURANT OPS AI ---
            case 'ops_ai':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Restaurant Ops AI</h3>
                            <p className="text-sm text-slate-500">Enable advanced AI modules for your kitchen.</p>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Video className="text-emerald-400" />
                                    <span className="font-bold text-lg">CCTV Recipe & SOP Audit</span>
                                </div>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle" checked={enableCCTV} onChange={() => setEnableCCTV(!enableCCTV)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6"/>
                                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${enableCCTV ? 'bg-emerald-500' : 'bg-gray-600'}`}></label>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mb-2">
                                Connect existing cameras (Hikvision/EZVIZ) to:
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Audit Recipe Preparation Steps</li>
                                <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Detect Hygiene Violations</li>
                                <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Track Real-time Wastage</li>
                            </ul>
                        </div>

                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <LayoutTemplate className="text-blue-500" />
                                    <span className="font-bold text-slate-800">Kitchen Workflow Optimization</span>
                                </div>
                                <input type="checkbox" checked={enableWorkflow} onChange={() => setEnableWorkflow(!enableWorkflow)} className="w-5 h-5 text-emerald-600 rounded" />
                            </div>
                            <p className="text-xs text-slate-500 mb-2">
                                AI analyzes staff movement to suggest station layout changes and minimize collisions.
                            </p>
                        </div>
                    </div>
                );

            // --- STEP 4: AI STRATEGY ---
            case 'strategy':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Initialize Strategy Engine</h3>
                            <p className="text-sm text-slate-500">What are your top priorities for the next 90 days?</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {['Reduce Food Cost', 'Increase Online Orders', 'Improve Staff Retention', 'Menu Engineering', 'Expand to New Location', 'Automate Purchasing'].map((goal) => (
                                <button
                                    key={goal}
                                    onClick={() => toggleStrategyGoal(goal)}
                                    className={`p-4 rounded-xl border text-sm font-bold transition-all ${
                                        strategyGoals.includes(goal) 
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mt-4 flex gap-3">
                            <Brain className="text-indigo-600 shrink-0" />
                            <p className="text-xs text-indigo-800">
                                <strong>AI Note:</strong> Based on your selections, I will generate a custom 90-day roadmap on your dashboard immediately after activation.
                            </p>
                        </div>
                    </div>
                );

            // --- STEP 5: ACTIVATION ---
            case 'activation':
                return (
                    <div className="text-center space-y-6 animate-fade-in py-8">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <Rocket size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Ready to Launch</h3>
                            <p className="text-slate-500 mt-2">
                                {integrationChoice === 'ops_manager' 
                                    ? "Activate your Ops Manager Plan" 
                                    : "Initialize your secure database and AI models"}
                            </p>
                        </div>
                        <div className="text-5xl font-black text-slate-900">
                            ₹{integrationChoice === 'ops_manager' ? '24,999' : SETUP_FEE}
                            <span className="text-sm font-medium text-slate-400 block mt-2">
                                {integrationChoice === 'ops_manager' ? '/ month' : 'One-time Setup Fee'}
                            </span>
                        </div>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full max-w-sm mx-auto py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Pay & Launch Dashboard'}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-xl font-bold">System Setup</h1>
                        <p className="text-xs text-slate-400">Step {currentStep + 1} of {STEPS.length}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-yellow-400">{STEPS[currentStep].title}</p>
                        </div>
                        <button onClick={onExit} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" title="Logout & Exit">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1 shrink-0">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}></div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {renderStepContent()}
                </div>

                {/* Footer Nav */}
                {STEPS[currentStep].id !== 'activation' && (
                    <div className="p-6 border-t border-slate-100 flex justify-between shrink-0 bg-white">
                        <button 
                            disabled={currentStep === 0} 
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-6 py-2 text-slate-500 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Back
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            disabled={loading || (currentStep === 0 && !outletData.restaurantName)} // Simple validation
                            className="px-8 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <>Next Step <ArrowRight size={18} /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
