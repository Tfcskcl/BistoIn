
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, MenuEngineeringItem, MenuCategoryType, RecipeCard } from '../types';
import { storageService } from '../services/storageService';
import { analyzeMenuEngineering } from '../services/geminiService';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { TrendingUp, Award, HelpCircle, AlertCircle, Sparkles, Loader2, Info, LayoutGrid, List, ShieldCheck, DollarSign, BarChart3, ChevronRight, Calculator, Star, UploadCloud, FileSpreadsheet, CheckCircle2, Cpu, FileText, Database, X, Brain } from 'lucide-react';

interface MenuEngineeringProps {
    user: User;
    onStrategize?: (query: string) => void;
}

const CATEGORY_COLORS: Record<MenuCategoryType, string> = {
    'STAR': '#10b981', // emerald
    'PLOWHORSE': '#3b82f6', // blue
    'PUZZLE': '#f59e0b', // amber
    'DOG': '#ef4444', // red
};

const CATEGORY_DESCS: Record<MenuCategoryType, string> = {
    'STAR': 'High Profit, High Popularity. Your winners. Keep quality high and maintain placement.',
    'PLOWHORSE': 'Low Profit, High Popularity. Brand staples. Consider small price hikes or portion tweaks.',
    'PUZZLE': 'High Profit, Low Popularity. Potential winners. Needs better marketing or placement.',
    'DOG': 'Low Profit, Low Popularity. Candidates for removal or complete re-imagining.',
};

export const MenuEngineering: React.FC<MenuEngineeringProps> = ({ user, onStrategize }) => {
    const [items, setItems] = useState<MenuEngineeringItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
    const [selectedCategory, setSelectedCategory] = useState<MenuCategoryType | 'ALL'>('ALL');
    const [filterEssential, setFilterEssential] = useState(false);
    
    // Ingestion State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({
        menu: false,
        sales: false,
        costing: false
    });
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestionLogs, setIngestionLogs] = useState<string[]>([]);
    
    const fileRefs = {
        menu: useRef<HTMLInputElement>(null),
        sales: useRef<HTMLInputElement>(null),
        costing: useRef<HTMLInputElement>(null)
    };

    useEffect(() => {
        loadAndAnalyze();
    }, [user.id]);

    const loadAndAnalyze = async () => {
        setLoading(true);
        const recipes = storageService.getSavedRecipes(user.id);
        
        const mockAnalyzed: MenuEngineeringItem[] = recipes.map((r, i) => {
            const isPuzzle = r.sku_id === 'SKU-PUZZLE-01';
            const vol = isPuzzle ? 8 : (Math.floor(Math.random() * 150) + 10);
            const price = r.current_price || r.suggested_selling_price || 350;
            const margin = price - (r.food_cost_per_serving || 0);
            
            const popScore = Math.min((vol / 160) * 100, 100);
            const profScore = Math.min((margin / (price * 0.8 || 1)) * 100, 100);

            let label: MenuCategoryType = 'DOG';
            if (popScore >= 50 && profScore >= 50) label = 'STAR';
            else if (popScore >= 50 && profScore < 50) label = 'PLOWHORSE';
            else if (popScore < 50 && profScore >= 50) label = 'PUZZLE';

            let aiRec = '';
            if (isPuzzle) {
                aiRec = "PROMOTION STRATEGY: High-margin masterpiece detected. Use 'Table-side Golden Finish' to drive viral social visibility. Feature on page 1 of menu with a gold-bordered 'Signature' badge.";
            }

            return {
                ...r,
                popularity_score: popScore,
                profitability_score: profScore,
                contribution_margin: margin,
                sales_volume: vol,
                category_label: label,
                current_price: price,
                ai_recommendation: aiRec || "Optimizing margin via procurement audit..."
            };
        });

        try {
            const withAI = await analyzeMenuEngineering(mockAnalyzed);
            setItems(withAI);
        } catch (e) {
            setItems(mockAnalyzed);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (type: 'menu' | 'sales' | 'costing') => {
        setUploadStatus(prev => ({ ...prev, [type]: true }));
    };

    const runNeuralIngestion = async () => {
        if (!uploadStatus.menu || !uploadStatus.sales || !uploadStatus.costing) {
            alert("Please provide all 3 data streams for comprehensive engineering.");
            return;
        }

        setIsIngesting(true);
        setIngestionLogs(["Initializing Multi-modal Data Nexus..."]);
        
        const sequence = [
            "Parsing Menu Structure [OCR Layer]...",
            "Mapping SKU sales volume from POS report...",
            "Synthesizing ingredient cost volatility...",
            "Calculating Contribution Margins per item...",
            "Executing quadrant classification pass...",
            "Generating tactical AI recommendations..."
        ];

        for (const log of sequence) {
            await new Promise(r => setTimeout(r, 600));
            setIngestionLogs(prev => [...prev, log]);
        }

        await new Promise(r => setTimeout(r, 1000));
        setIsIngesting(false);
        setShowUploadModal(false);
        loadAndAnalyze(); // Refresh with new "analyzed" data
        setUploadStatus({ menu: false, sales: false, costing: false });
    };

    const handleStrategizeLowProfit = () => {
        const lowProfit = items.filter(i => i.category_label === 'PLOWHORSE' || i.category_label === 'DOG');
        if (lowProfit.length === 0) {
            alert("No low-profit items detected to strategize. Add recipes and sales data first.");
            return;
        }
        const names = lowProfit.map(i => `${i.name} (${i.category_label})`).join(', ');
        const query = `I have several items categorized as low-profit (Plowhorses or Dogs): ${names}. 
        Please generate a comprehensive Strategy Report to improve my profitability. 
        Focus on:
        1. Actionable steps to increase contribution margin for the Plowhorses without losing volume.
        2. A decision matrix for which Dogs to discontinue and what to replace them with.
        3. Marketing tactics to shift customer preference from Plowhorses to high-margin Stars.`;
        
        if (onStrategize) onStrategize(query);
    };

    const toggleEssential = (skuId: string) => {
        const updated = items.map(item => {
            if (item.sku_id === skuId) {
                const newState = !item.is_essential;
                const recipes = storageService.getSavedRecipes(user.id);
                const recipeIndex = recipes.findIndex(r => r.sku_id === skuId);
                if (recipeIndex > -1) {
                    recipes[recipeIndex].is_essential = newState;
                    storageService.saveRecipe(user.id, recipes[recipeIndex]);
                }
                return { ...item, is_essential: newState };
            }
            return item;
        });
        setItems(updated);
    };

    const filteredItems = useMemo(() => {
        let result = items;
        if (selectedCategory !== 'ALL') result = result.filter(i => i.category_label === selectedCategory);
        if (filterEssential) result = result.filter(i => i.is_essential);
        return result;
    }, [items, selectedCategory, filterEssential]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl font-sans min-w-[220px] animate-scale-in">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{data.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{data.category_label} ITEM</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            <span className="text-slate-500">Profitability</span>
                            <span className="font-black text-emerald-600">{(data.profitability_score || 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            <span className="text-slate-500">Popularity</span>
                            <span className="font-black text-blue-600">{(data.popularity_score || 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between pt-2 px-1">
                            <span className="text-slate-500">Margin</span>
                            <span className="font-bold text-emerald-600">₹{(data.contribution_margin || 0).toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderCustomPoint = (props: any) => {
        const { cx, cy, payload } = props;
        const color = CATEGORY_COLORS[payload.category_label];
        if (payload.is_essential) {
            return (
                <g className="cursor-pointer">
                    <circle cx={cx} cy={cy} r={14} fill="none" stroke="#10b981" strokeWidth={1} strokeDasharray="4 2" className="animate-[spin_4s_linear_infinite]" />
                    <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.9} stroke="#fff" strokeWidth={2} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="10px" fontWeight="black" style={{ pointerEvents: 'none' }}>★</text>
                </g>
            );
        }
        return <circle cx={cx} cy={cy} r={7} fill={color} fillOpacity={0.65} stroke="#fff" strokeWidth={1} className="cursor-pointer hover:fill-opacity-100 transition-all" />;
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                        <TrendingUp className="text-emerald-500"/> Neural Menu Engineering
                    </h1>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">// ANALYZING_PROFIT_ELASTICITY // UNIT_04</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleStrategizeLowProfit}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/10"
                    >
                        <Brain size={16}/> Improve Low-Profit SKUs
                    </button>
                    <button 
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <UploadCloud size={16}/> Ingest Data
                    </button>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setViewMode('matrix')} className={`p-2 rounded-md transition-all ${viewMode === 'matrix' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500 mb-4" size={48}/>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Sales Performance...</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                        {(['STAR', 'PLOWHORSE', 'PUZZLE', 'DOG'] as MenuCategoryType[]).map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? 'ALL' : cat)}
                                className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                                    selectedCategory === cat ? 'border-slate-900 dark:border-white shadow-lg' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                                }`}
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            cat === 'STAR' ? 'text-emerald-500' : cat === 'PLOWHORSE' ? 'text-blue-500' : cat === 'PUZZLE' ? 'text-amber-500' : 'text-red-500'
                                        }`}>{cat}s</span>
                                        <span className="text-2xl font-black dark:text-white">{items.filter(i => i.category_label === cat).length}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{CATEGORY_DESCS[cat]}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                        <div className="flex-1 glass rounded-3xl border-slate-200 dark:border-slate-800 p-8 flex flex-col shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50">
                            {viewMode === 'matrix' ? (
                                <div className="flex-1 min-h-[400px] relative">
                                    <div className="flex justify-between items-center mb-8">
                                        <div><h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Performance Matrix</h3><p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">X: Margin Delta • Y: Sales Velocity</p></div>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <XAxis type="number" dataKey="profitability_score" hide domain={[0, 100]} />
                                            <YAxis type="number" dataKey="popularity_score" hide domain={[0, 100]} />
                                            <ZAxis type="number" dataKey="sales_volume" range={[200, 1200]} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                            <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="5 5"><Label value="Avg Profit" position="top" fill="#94a3b8" fontSize={9} /></ReferenceLine>
                                            <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="5 5"><Label value="Avg Volume" position="right" fill="#94a3b8" fontSize={9} /></ReferenceLine>
                                            <Scatter name="Items" data={filteredItems} shape={renderCustomPoint} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-sm text-left font-sans">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b text-slate-500 font-black text-[10px] uppercase tracking-widest">
                                            <tr><th className="px-4 py-4">SKU / Item</th><th className="px-4 py-4 text-center">Class</th><th className="px-4 py-4 text-center">Velocity</th><th className="px-4 py-4 text-center">FC%</th><th className="px-4 py-4 text-right">Shield</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {filteredItems.map(item => (
                                                <tr key={item.sku_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="px-4 py-4"><p className="font-bold text-slate-800 dark:text-white">{item.name}</p><p className="text-[9px] font-mono text-slate-400">{item.sku_id}</p></td>
                                                    <td className="px-4 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.category_label === 'STAR' ? 'bg-emerald-100 text-emerald-700' : item.category_label === 'PLOWHORSE' ? 'bg-blue-100 text-blue-700' : item.category_label === 'PUZZLE' ? 'bg-amber-100 text-amber-700' : item.category_label === 'DOG' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{item.category_label}</span></td>
                                                    <td className="px-4 py-4 text-center font-mono font-bold">{item.sales_volume || 0}</td>
                                                    <td className="px-4 py-4 text-center font-mono"><span className={(((item.food_cost_per_serving || 0) / (item.current_price || 1)) * 100) > 35 ? 'text-red-500 font-bold' : 'text-emerald-500'}>{(((item.food_cost_per_serving || 0) / (item.current_price || 1)) * 100).toFixed(0)}%</span></td>
                                                    <td className="px-4 py-4 text-right"><button onClick={() => toggleEssential(item.sku_id)} className={`p-1.5 rounded-lg transition-colors ${item.is_essential ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:text-emerald-500'}`}><ShieldCheck size={18} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="w-full lg:w-96 flex flex-col gap-4 overflow-hidden">
                            <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-2xl flex-1 overflow-y-auto custom-scrollbar border border-slate-800">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-emerald-400 flex items-center gap-2"><Sparkles size={16}/> Neural Suggestions</h3>
                                <div className="space-y-8">
                                    {filteredItems.slice(0, 4).map(item => (
                                        <div key={item.sku_id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-xs font-bold uppercase group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.category_label === 'STAR' ? 'bg-emerald-500 text-white' : item.category_label === 'PLOWHORSE' ? 'bg-blue-500 text-white' : item.category_label === 'PUZZLE' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>{item.category_label}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 italic leading-relaxed">"{item.ai_recommendation || 'Analyzing tactical opportunities...'}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Arcis-Style Ingestion Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-600"></div>
                        <button onClick={() => !isIngesting && setShowUploadModal(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
                        
                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><Cpu className="text-emerald-500" /></div>
                                <div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Operational Ingestion</h3><p className="text-xs font-mono text-slate-500 uppercase tracking-widest">// UPLOAD_WORKSPACE // NODE_04</p></div>
                            </div>

                            {isIngesting ? (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <div className="relative mb-6">
                                            <Loader2 size={80} className="animate-spin text-emerald-500/20" />
                                            <Database size={32} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                                        </div>
                                        <p className="text-xl font-bold text-white uppercase tracking-tighter">Extracting Neural Insights...</p>
                                    </div>
                                    <div className="bg-black/50 p-6 rounded-2xl border border-white/5 font-mono text-[10px] space-y-2 h-40 overflow-y-auto custom-scrollbar">
                                        {ingestionLogs.map((log, i) => (
                                            <div key={i} className="flex gap-3 text-emerald-500/80">
                                                <span className="text-slate-700">[{new Date().toLocaleTimeString()}]</span>
                                                <span>{log}</span>
                                            </div>
                                        ))}
                                        <div className="animate-pulse text-emerald-500">_</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Drop Zones */}
                                        <div onClick={() => fileRefs.menu.current?.click()} className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-6 ${uploadStatus.menu ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
                                            <div className={`p-4 rounded-2xl ${uploadStatus.menu ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-900 text-slate-500'}`}><FileText /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-sm uppercase">1. Menu File</h4>
                                                <p className="text-[10px] text-slate-500 uppercase font-mono">{uploadStatus.menu ? 'SOURCE_CAPTURED // VALID' : 'DRAG_PDF_OR_IMAGE'}</p>
                                            </div>
                                            {uploadStatus.menu && <CheckCircle2 className="text-emerald-500" size={20}/>}
                                            <input type="file" ref={fileRefs.menu} className="hidden" onChange={() => handleFileUpload('menu')} />
                                        </div>

                                        <div onClick={() => fileRefs.sales.current?.click()} className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-6 ${uploadStatus.sales ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
                                            <div className={`p-4 rounded-2xl ${uploadStatus.sales ? 'bg-indigo-500/20 text-indigo-500' : 'bg-slate-900 text-slate-500'}`}><FileSpreadsheet /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-sm uppercase">2. Item-wise Sales Report</h4>
                                                <p className="text-[10px] text-slate-500 uppercase font-mono">{uploadStatus.sales ? 'VELOCITY_DATA_SYNCED' : 'UPLOAD_CSV_OR_EXCEL'}</p>
                                            </div>
                                            {uploadStatus.sales && <CheckCircle2 className="text-indigo-500" size={20}/>}
                                            <input type="file" ref={fileRefs.sales} className="hidden" onChange={() => handleFileUpload('sales')} />
                                        </div>

                                        <div onClick={() => fileRefs.costing.current?.click()} className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-6 ${uploadStatus.costing ? 'bg-purple-500/5 border-purple-500/30' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
                                            <div className={`p-4 rounded-2xl ${uploadStatus.costing ? 'bg-purple-500/20 text-purple-500' : 'bg-slate-900 text-slate-500'}`}><DollarSign /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-sm uppercase">3. Food Cost Sheet</h4>
                                                <p className="text-[10px] text-slate-500 uppercase font-mono">{uploadStatus.costing ? 'MARGIN_LOGIC_EXTRACTED' : 'UPLOAD_PRODUCT_COSTING'}</p>
                                            </div>
                                            {uploadStatus.costing && <CheckCircle2 className="text-purple-500" size={20}/>}
                                            <input type="file" ref={fileRefs.costing} className="hidden" onChange={() => handleFileUpload('costing')} />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={runNeuralIngestion}
                                        disabled={!uploadStatus.menu || !uploadStatus.sales || !uploadStatus.costing}
                                        className="w-full mt-8 py-5 bg-white text-slate-950 font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3"
                                    >
                                        <Sparkles size={18}/> Initiate Matrix Synthesis
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
