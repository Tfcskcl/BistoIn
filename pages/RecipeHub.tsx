
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { generateRecipeCard, generateMarketingImage } from '../services/geminiService';
import { ingredientService } from '../services/ingredientService';
import { RecipeCard, MenuItem, User, UserRole, PreparationStep } from '../types';
import { Loader2, ChefHat, Save, Search, Plus, Trash2, ShieldCheck, Calculator, Camera, Sparkles, X, TrendingUp, DollarSign, UtensilsCrossed, AlertCircle, CheckCircle2, Download, Printer, Globe, FlaskConical, Image as ImageIcon } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Logo } from '../components/Logo';

interface RecipeHubProps {
  user: User;
  onUserUpdate?: (user: User) => void;
}

const CHEF_PERSONAS = [
    { id: 'Executive Chef', name: 'Executive Chef' },
    { id: 'The Alchemist', name: 'The Alchemist' },
    { id: 'The Accountant', name: 'The Accountant' }
];

export const RecipeHub: React.FC<RecipeHubProps> = ({ user, onUserUpdate }) => {
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRenderingSteps, setIsRenderingSteps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEssential, setIsEssential] = useState(false);
  const [dishName, setDishName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('Executive Chef');
  const [viewMode, setViewMode] = useState<'generator' | 'saved'>('generator');
  const [savedRecipes, setSavedRecipes] = useState<RecipeCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSavedRecipes(storageService.getSavedRecipes(user.id));
  }, [user.id]);

  const filteredRecipes = useMemo(() => {
      return savedRecipes.filter(recipe => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [savedRecipes, searchQuery]);

  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!dishName) { setError("Please enter a dish name."); return; }
      setError(null);
      setLoading(true);
      setGeneratedRecipe(null);

      const requirements = `DISH: ${dishName}. Cuisine: ${cuisine}. Ingredients: ${ingredients}. SPECIAL TARGETS: Identify house signature components. Fetch real-time market rates for ${user.location || 'India'}.`;
      
      const tempItem: MenuItem = { 
        sku_id: `NEW-${Date.now()}`, 
        name: dishName, 
        category: 'main', 
        prep_time_min: 0, 
        current_price: 0, 
        ingredients: [], 
        is_essential: isEssential 
      };

      try {
          const res = await generateRecipeCard(user.id, tempItem, requirements, user.location, selectedPersona);
          res.is_essential = isEssential;
          setGeneratedRecipe(res);
          
          if (Array.isArray(res.ingredients)) {
              ingredientService.learnPrices(res.ingredients);
          }

          // Initial Render for main dish photo
          handleGenerateMainImage(res);

      } catch (err: any) {
          console.error("Hub error:", err);
          setError(err.message || "Generation failed. Try refining your parameters.");
      } finally {
          setLoading(false);
      }
  };

  const handleGenerateMainImage = async (recipeContext: RecipeCard) => {
      setIsGeneratingImage(true);
      try {
          const prompt = `Gourmet professional food photography of "${recipeContext.name}". Style: Fine dining plating, dark studio background, macro detail, fresh garnish. 4k.`;
          const imageUrl = await generateMarketingImage(prompt, '1:1');
          setGeneratedRecipe(prev => prev ? { ...prev, imageUrl } : null);
      } catch (e) {
          console.error("Main image failed", e);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleRenderAllSteps = async () => {
      if (!generatedRecipe || isRenderingSteps) return;
      
      setIsRenderingSteps(true);
      const steps = [...generatedRecipe.preparation_steps_data];
      
      for (let i = 0; i < steps.length; i++) {
          try {
              // Set generating state for UI
              steps[i] = { ...steps[i], isGenerating: true };
              setGeneratedRecipe(prev => prev ? { ...prev, preparation_steps_data: [...steps] } : null);
              
              const prompt = `Close-up technical kitchen photo of step ${i+1}: "${steps[i].instruction}". Professional culinary documentation style, stainless steel background, focus on action. 2k resolution.`;
              const url = await generateMarketingImage(prompt, '16:9');
              
              steps[i] = { ...steps[i], imageUrl: url, isGenerating: false };
              setGeneratedRecipe(prev => prev ? { ...prev, preparation_steps_data: [...steps] } : null);
          } catch (e) {
              console.error(`Step ${i} image failed`, e);
              steps[i] = { ...steps[i], isGenerating: false };
          }
      }
      setIsRenderingSteps(false);
  };

  const handleSaveRecipe = () => {
      if (generatedRecipe) {
          storageService.saveRecipe(user.id, generatedRecipe);
          setViewMode('saved');
          setSavedRecipes(storageService.getSavedRecipes(user.id));
      }
  };

  const handleDownloadPDF = () => {
      if (!generatedRecipe) return;
      const win = window.open('', '_blank');
      if (!win) return;

      win.document.write(`
        <html>
            <head>
                <title>Master Technical Sheet - ${generatedRecipe.name}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4; margin: 10mm; }
                </style>
            </head>
            <body class="p-10 text-slate-900 bg-white">
                <div class="max-w-4xl mx-auto">
                    <div class="flex justify-between items-center border-b-8 border-slate-900 pb-6 mb-8">
                        <div>
                            <h1 class="text-5xl font-black uppercase tracking-tighter">${generatedRecipe.name}</h1>
                            <p class="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">${generatedRecipe.cuisine} // MARKET-GROUNDED COSTING</p>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-bold uppercase tracking-tight">${user.restaurantName}</p>
                             <p class="text-[10px] text-slate-400 font-mono">BISTRO_NODE_REPORT_${Date.now()}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-8 mb-12">
                        <div class="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                            ${generatedRecipe.imageUrl ? `<img src="${generatedRecipe.imageUrl}" class="w-full h-full object-cover" />` : ''}
                        </div>
                        <div class="space-y-6">
                            <div class="p-6 bg-slate-900 text-white rounded-3xl">
                                <p class="text-[9px] font-black uppercase tracking-[0.3em] mb-2 text-emerald-400">Financial Spec</p>
                                <div class="flex justify-between items-end">
                                    <div><p class="text-3xl font-black">₹${generatedRecipe.suggested_selling_price?.toFixed(0)}</p><p class="text-[10px] opacity-60 font-bold">Suggested MSRP</p></div>
                                    <div class="text-right"><p class="text-xl font-bold text-emerald-400">₹${generatedRecipe.food_cost_per_serving?.toFixed(2)}</p><p class="text-[10px] opacity-60 font-bold">Plate Cost</p></div>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Signature Components</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${generatedRecipe.signature_components?.map(c => `<span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-100">${c}</span>`).join('') || '<span class="text-xs italic">None identified</span>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mb-12">
                        <h3 class="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b pb-1">Cost Matrix (Market Rates)</h3>
                        <table class="w-full text-xs">
                            <thead class="bg-slate-50 border-b"><tr><th class="p-3 text-left">Ingredient</th><th class="p-3 text-center">Portion</th><th class="p-3 text-right">Market Rate</th><th class="p-3 text-right">Cost</th></tr></thead>
                            <tbody class="divide-y">
                                ${generatedRecipe.ingredients.map(ing => `
                                    <tr class="${ing.is_signature ? 'bg-indigo-50/30' : ''}">
                                        <td class="p-3 font-bold">${ing.name} ${ing.is_signature ? ' <span class="text-[8px] bg-indigo-500 text-white px-1 rounded">SIGNATURE</span>' : ''}</td>
                                        <td class="p-3 text-center">${ing.qty_per_serving} ${ing.unit}</td>
                                        <td class="p-3 text-right">₹${ing.cost_per_unit?.toFixed(1)}</td>
                                        <td class="p-3 text-right font-mono">₹${ing.cost_per_serving?.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h3 class="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 border-b pb-1">Step-Wise Visual SOP</h3>
                        <div class="space-y-12">
                            ${generatedRecipe.preparation_steps_data.map((step, i) => `
                                <div class="flex gap-8">
                                    <div class="w-1/3 aspect-video bg-slate-100 rounded-xl overflow-hidden border">
                                        ${step.imageUrl ? `<img src="${step.imageUrl}" class="w-full h-full object-cover" />` : ''}
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">${i+1}</span>
                                            <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Step Documentation</span>
                                        </div>
                                        <p class="text-sm font-medium leading-relaxed">${step.instruction}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="mt-20 pt-10 border-t text-[10px] text-slate-400 font-bold uppercase tracking-widest flex justify-between">
                        <div>Authenticated by BistroIntelligence Node v2.5</div>
                        <div>© TFCS KITCHEN SOLUTIONS</div>
                    </div>
                </div>
            </body>
        </html>
      `);
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); win.close(); }, 1500);
  };

  const foodCostPct = generatedRecipe ? (
      ((generatedRecipe.food_cost_per_serving || 0) / (generatedRecipe.suggested_selling_price || 1)) * 100
  ) : 0;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex gap-2">
            <button onClick={() => setViewMode('generator')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'generator' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>Technical Generator</button>
            <button onClick={() => setViewMode('saved')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'saved' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>Recipe Vault</button>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 rounded-full text-[10px] font-black border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
                <Globe size={12}/> Market-Grounded Costing Node Active
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800"><ChefHat size={12}/> Quota: {user.recipeQuota}</div>
        </div>
      </div>

      {viewMode === 'generator' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
              <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-[2rem] p-8 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 shadow-xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl shadow-inner"><Plus size={24}/></div>
                    <div>
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Initialize Artifact</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">// NEW_TECH_SPEC // NODE_04</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={isEssential} onChange={e => setIsEssential(e.target.checked)} className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                              <div className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Core Product Entry</div>
                          </label>
                          <ShieldCheck size={20} className="text-emerald-500/50" />
                      </div>

                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Descriptor</label>
                          <input required value={dishName} onChange={e => setDishName(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner" placeholder="e.g. Signature Truffle Mac & Cheese" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuisine Logic</label>
                            <input value={cuisine} onChange={e => setCuisine(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner" placeholder="e.g. Continental" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chef Persona</label>
                            <select value={selectedPersona} onChange={e => setSelectedPersona(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-sm dark:text-white appearance-none outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner">
                                {CHEF_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ingredient Directives</label>
                          <textarea rows={3} value={ingredients} onChange={e => setIngredients(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner resize-none" placeholder="e.g. Must use house gravy 'Red Mother', local buffalo mozzarella..." />
                      </div>

                      {error && <p className="text-red-500 text-[10px] font-black bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2 animate-shake uppercase tracking-widest"><AlertCircle size={14} className="shrink-0"/> {error}</p>}
                      
                      <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 dark:bg-emerald-600 text-white font-black rounded-2xl flex justify-center gap-3 hover:opacity-90 shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
                          {loading ? <Loader2 className="animate-spin" /> : <Calculator size={18} />} Synthesize & Ground Costing
                      </button>
                  </form>
              </div>

              <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar p-10 flex flex-col items-center">
                  {generatedRecipe ? (
                      <div className="w-full max-w-5xl space-y-10 animate-fade-in pb-20">
                          {/* Header Artifact */}
                          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row">
                              <div className="flex-1 p-10">
                                  <div className="flex items-center gap-3 mb-4">
                                      <span className="px-3 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase rounded-full tracking-[0.2em]">Neural Spec Complete</span>
                                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.3em]">{generatedRecipe.cuisine}</span>
                                  </div>
                                  <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 uppercase">{generatedRecipe.name}</h1>
                                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-emerald-500 pl-6 text-sm mb-8">
                                      "{generatedRecipe.human_summary}"
                                  </p>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Margin</p>
                                          <p className="text-3xl font-black text-emerald-500">₹{(generatedRecipe.suggested_selling_price - generatedRecipe.food_cost_per_serving).toFixed(0)}</p>
                                      </div>
                                      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate Cost</p>
                                          <p className="text-3xl font-black dark:text-white">₹{generatedRecipe.food_cost_per_serving?.toFixed(2)}</p>
                                      </div>
                                      <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Selling Price</p>
                                          <p className="text-3xl font-black text-white">₹{generatedRecipe.suggested_selling_price?.toFixed(0)}</p>
                                      </div>
                                  </div>
                              </div>
                              <div className="w-full md:w-[400px] bg-slate-950 relative overflow-hidden group">
                                  {isGeneratingImage ? (
                                      <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                                          <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
                                          <p className="text-white text-[10px] font-black uppercase tracking-widest">Master Shot Rendering...</p>
                                      </div>
                                  ) : null}
                                  {generatedRecipe.imageUrl ? (
                                      <img src={generatedRecipe.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[10s]" />
                                  ) : (
                                      <div className="h-full flex flex-col items-center justify-center text-slate-700 p-10 text-center">
                                          <ImageIcon size={64} className="mb-4 opacity-20" />
                                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Main Visual Awaiting Data</p>
                                      </div>
                                  )}
                                  <div className="absolute bottom-6 left-6 right-6">
                                      <button onClick={() => handleGenerateMainImage(generatedRecipe)} disabled={isGeneratingImage} className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase rounded-xl tracking-widest hover:bg-white/20 transition-all">Regenerate Master Visual</button>
                                  </div>
                              </div>
                          </div>

                          {/* Detail Matrix */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Cost Matrix */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                                <UtensilsCrossed size={14} className="text-emerald-500" /> Grounded Cost Matrix
                                            </h3>
                                            <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded tracking-widest">LIVE_MARKET_RATES</span>
                                        </div>
                                        <div className="overflow-hidden border border-slate-50 dark:border-slate-800 rounded-3xl">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase tracking-widest font-black text-[9px]">
                                                    <tr><th className="p-4">Ingredient Node</th><th className="p-4 text-center">Portion</th><th className="p-4 text-right">Ext. Cost</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-sans">
                                                    {generatedRecipe.ingredients.map((ing, i) => (
                                                        <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors ${ing.is_signature ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                                                            <td className="p-4 flex items-center gap-2">
                                                                <span className="font-bold dark:text-slate-200">{ing.name}</span>
                                                                {ing.is_signature && <span className="text-[7px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">SIGNATURE</span>}
                                                            </td>
                                                            <td className="p-4 text-center text-slate-500">{ing.qty_per_serving} {ing.unit}</td>
                                                            <td className="p-4 text-right font-mono font-black text-slate-900 dark:text-white">₹{ing.cost_per_serving?.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Visual SOP Steps */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                        <div className="flex justify-between items-center mb-10">
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                                <ImageIcon size={14} className="text-blue-500" /> Step-Wise Visual Process
                                            </h3>
                                            <button 
                                                onClick={handleRenderAllSteps} 
                                                disabled={isRenderingSteps}
                                                className="px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isRenderingSteps ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                                                Synthesize Step Photos
                                            </button>
                                        </div>
                                        <div className="space-y-12">
                                            {generatedRecipe.preparation_steps_data.map((step, i) => (
                                                <div key={i} className="flex flex-col md:flex-row gap-8 group">
                                                    <div className="w-full md:w-56 aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 relative flex items-center justify-center">
                                                        {step.isGenerating ? (
                                                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                                                <Loader2 className="animate-spin text-blue-400" size={32} />
                                                            </div>
                                                        ) : null}
                                                        {step.imageUrl ? (
                                                            <img src={step.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="text-center opacity-20"><Camera size={32} /></div>
                                                        )}
                                                        <div className="absolute top-4 left-4 w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-white/20 shadow-xl">{i+1}</div>
                                                    </div>
                                                    <div className="flex-1 py-2 flex flex-col justify-center">
                                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Technical Instruction</p>
                                                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight">{step.instruction}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-2">
                                            <FlaskConical size={14}/> House Component Audit
                                        </h3>
                                        <div className="space-y-4">
                                            {generatedRecipe.signature_components?.map((c, i) => (
                                                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                                    <p className="text-xs font-bold uppercase text-white">{c}</p>
                                                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono tracking-tighter">Signature Sub-Recipe Required</p>
                                                </div>
                                            ))}
                                            {(!generatedRecipe.signature_components || generatedRecipe.signature_components.length === 0) && (
                                                <p className="text-xs italic text-slate-500">No house-made components detected.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
                                        <button onClick={handleDownloadPDF} className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-700 shadow-sm"><Printer size={18}/> Export Tech Spec</button>
                                        <button onClick={handleSaveRecipe} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20"><Save size={18}/> Commit to Nexus</button>
                                    </div>
                                </div>
                          </div>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-20 text-center">
                          <ChefHat size={120} className="mb-8" />
                          <h2 className="text-3xl font-black uppercase tracking-[0.5em]">Studio Standby</h2>
                          <p className="text-xs font-bold uppercase tracking-widest mt-4">Awaiting architectural synthesis parameters</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {viewMode === 'saved' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 flex-1 overflow-y-auto custom-scrollbar shadow-sm transition-colors">
              <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Technical Vault</h2>
                    <p className="text-slate-500 font-medium tracking-wide">Archived neural artifacts for standard operations.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search size={20} className="absolute left-4 top-4 text-slate-400"/>
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search library SKUs..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[1.5rem] text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRecipes.map(r => (
                    <div key={r.sku_id} className="group bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => { setGeneratedRecipe(r); setViewMode('generator'); }}>
                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                            {r.imageUrl ? <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="h-full flex items-center justify-center opacity-10"><ChefHat size={64}/></div>}
                            <div className="absolute top-6 left-6 flex gap-2">
                                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[8px] font-black text-white uppercase tracking-widest border border-white/10">FC: {(((r.food_cost_per_serving||0)/(r.suggested_selling_price||1))*100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <h4 className="font-black text-2xl text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight line-clamp-1">{r.name}</h4>
                            <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.cuisine}</p>
                                <p className="text-xl font-black dark:text-white">₹{r.suggested_selling_price?.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                ))}
              </div>
          </div>
      )}
    </div>
  );
};
