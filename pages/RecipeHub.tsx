
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { generateRecipeCard, generateRecipeVariation, substituteIngredient, estimateMarketRates } from '../services/geminiService';
import { ingredientService } from '../services/ingredientService';
import { RecipeCard, MenuItem, User, UserRole, RecipeRequest } from '../types';
import { Loader2, ChefHat, Scale, Clock, Save, RefreshCw, Search, Plus, Trash2, ArrowRight, Eye, TrendingDown, Coins, Leaf, TestTube, Flame, ArrowLeftRight, Calculator, DollarSign, Edit2, Globe, Droplets, Wheat } from 'lucide-react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

interface RecipeHubProps {
  user: User;
  onUserUpdate?: (user: User) => void;
}

const SAMPLE_DISHES = [
    { name: "Truffle Mushroom Risotto", desc: "Creamy arborio rice, wild mushrooms, parmesan crisp, truffle oil drizzle.", cuisine: "Italian", ingredients: "Arborio Rice, Wild Mushrooms, Truffle Oil, Parmesan", dietary: ["Vegetarian", "Gluten-Free"] },
    { name: "Spicy Tuna Tartare", desc: "Fresh tuna cubes, avocado mousse, sesame soy dressing, crispy wonton chips.", cuisine: "Asian Fusion", ingredients: "Tuna, Avocado, Sesame Oil, Wonton Wrappers", dietary: ["Pescatarian", "Dairy-Free"] },
    { name: "Vegan Jackfruit Tacos", desc: "Pulled bbq jackfruit, pineapple salsa, cilantro lime slaw, corn tortillas.", cuisine: "Mexican", ingredients: "Young Jackfruit, Corn Tortillas, Pineapple, Cilantro", dietary: ["Vegan", "Gluten-Free"] },
    { name: "Classic Beef Wellington", desc: "Filet mignon, mushroom duxelles, prosciutto, puff pastry, red wine jus.", cuisine: "French / British", ingredients: "Beef Tenderloin, Puff Pastry, Mushrooms, Prosciutto", dietary: [] },
    { name: "Matcha Lava Cake", desc: "Warm green tea chocolate fondant with vanilla bean ice cream.", cuisine: "Japanese Fusion", ingredients: "White Chocolate, Matcha Powder, Eggs, Flour", dietary: ["Vegetarian"] }
];

const POPULAR_IDEAS = [
    { name: "Avocado Toast", desc: "Sourdough toast, smashed avocado, poached egg, chili flakes.", cuisine: "Modern Cafe", ingredients: "Sourdough, Avocado, Egg, Chili Flakes", dietary: ["Vegetarian"] },
    { name: "Pad Thai", desc: "Rice noodles, tamarind sauce, peanuts, bean sprouts, lime, shrimp/tofu.", cuisine: "Thai", ingredients: "Rice Noodles, Tamarind Paste, Peanuts, Bean Sprouts", dietary: ["Gluten-Free", "Dairy-Free"] },
    { name: "Caesar Salad", desc: "Romaine lettuce, croutons, parmesan, creamy caesar dressing.", cuisine: "American", ingredients: "Romaine Lettuce, Parmesan, Croutons, Anchovies", dietary: [] },
    { name: "Butter Chicken", desc: "Tandoori chicken in a rich tomato and butter gravy.", cuisine: "Indian", ingredients: "Chicken, Tomato, Butter, Cream, Garam Masala", dietary: ["Gluten-Free"] },
    { name: "Acai Bowl", desc: "Frozen acai blend topped with granola, banana, and berries.", cuisine: "Health Food", ingredients: "Acai Pulp, Banana, Granola, Berries", dietary: ["Vegan", "Dairy-Free"] }
];

const CHEF_PERSONAS = [
    { id: 'Executive Chef', name: 'Executive Chef', icon: ChefHat, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', desc: 'Balanced & Professional' },
    { id: 'The Alchemist', name: 'The Alchemist', icon: TestTube, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', desc: 'Modern & Innovative' },
    { id: 'The Accountant', name: 'The Accountant', icon: Coins, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', desc: 'Cost-Optimized' },
    { id: 'The Purist', name: 'The Purist', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', desc: 'Authentic & Traditional' },
    { id: 'The Wellness Guru', name: 'The Wellness Guru', icon: Leaf, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', desc: 'Healthy & Dietary' }
];

const formatError = (err: any) => {
    if (!err) return "Unknown error occurred";
    let msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
    if (msg.includes("leaked") || (msg.includes("PERMISSION_DENIED") && msg.includes("403"))) {
        return "Access Denied: The system API key has been flagged. Please click 'Connect API Key' to use your own key.";
    }
    return msg.length > 100 ? "Generation failed. Please try again." : msg;
};

const getBgImage = (cuisine: string = '', dishName: string = '') => {
    return 'https://images.unsplash.com/photo-1546549010-b277db638708?auto=format&fit=crop&w=1200&q=60';
};

export const RecipeHub: React.FC<RecipeHubProps> = ({ user, onUserUpdate }) => {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Generating with AI...');
  const [error, setError] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [manualForm, setManualForm] = useState({ name: '', cuisine: '', yield: '1', prepTime: '20', description: '', steps: '' });
  const [manualIngredients, setManualIngredients] = useState([{ id: 1, name: '', qty: '', unit: 'g', costPerUnit: '', wastePct: '0' }]);
  const [altPrices, setAltPrices] = useState<Record<number, string>>({});
  const [wasteValues, setWasteValues] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<'generator' | 'saved' | 'requests'>('generator');
  const [savedRecipes, setSavedRecipes] = useState<RecipeCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dishName, setDishName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('Executive Chef');
  const isStaff = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  useEffect(() => {
    setSavedRecipes(storageService.getSavedRecipes(user.id));
  }, [user.id, user.role]);

  useEffect(() => {
      setAltPrices({});
      setWasteValues({});
  }, [generatedRecipe?.sku_id]); 

  const filteredRecipes = useMemo(() => {
      return savedRecipes.filter(recipe => {
          const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                recipe.sku_id.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => recipe.tags?.includes(tag));
          return matchesSearch && matchesTags;
      });
  }, [savedRecipes, searchQuery, selectedTags]);

  const savingsAnalysis = useMemo(() => {
      if (!generatedRecipe) return null;
      let totalOriginalCost = generatedRecipe.food_cost_per_serving;
      let totalNewCost = 0;
      let hasChanges = false;
      generatedRecipe.ingredients.forEach((ing, idx) => {
          const originalCostServing = ing.cost_per_serving || 0;
          const originalRate = ing.cost_per_unit || 0;
          let userRate = originalRate;
          if (altPrices[idx] && !isNaN(parseFloat(altPrices[idx]))) { userRate = parseFloat(altPrices[idx]); hasChanges = true; }
          const userWasteStr = wasteValues[idx];
          const userWaste = userWasteStr ? parseFloat(userWasteStr) : (ing.waste_pct || 0);
          if (userWaste > 0) hasChanges = true;
          const wasteFactor = 100 / (100 - Math.min(userWaste, 99.9));
          let costWithWaste = 0;
          if (originalRate > 0) { costWithWaste = (originalCostServing / originalRate) * userRate * wasteFactor; } else { costWithWaste = originalCostServing * wasteFactor; }
          totalNewCost += costWithWaste;
      });
      const savings = totalOriginalCost - totalNewCost;
      const savingsPct = totalOriginalCost > 0 ? (savings / totalOriginalCost) * 100 : 0;
      return { originalCost: totalOriginalCost, projectedCost: totalNewCost, savings, savingsPct, hasChanges };
  }, [generatedRecipe, altPrices, wasteValues]);

  // Updated: Check Quota
  const checkQuota = (): boolean => {
      if (isStaff) return true;
      if (user.recipeQuota <= 0) {
          setError(`No recipes left in quota. Please buy a pack.`);
          return false;
      }
      return true;
  };

  const deductQuota = (): boolean => {
      if (!isStaff && onUserUpdate) {
          if (user.recipeQuota <= 0) {
              setError("No recipes left in quota.");
              return false;
          }
          storageService.updateQuotas(user.id, -1, 0);
          onUserUpdate({ ...user, recipeQuota: user.recipeQuota - 1 });
          return true;
      }
      return true;
  };

  const handleTabChange = (mode: 'generator' | 'saved' | 'requests', keepState = false) => {
      setViewMode(mode);
      setError(null);
      if (mode === 'generator' && !keepState) resetForm();
  };

  const resetForm = () => {
      setGeneratedRecipe(null);
      setSelectedSku(null);
      setDishName('');
      setCuisine('');
      setIngredients('');
      setDietary([]);
      setNotes('');
      setError(null);
      setAltPrices({});
      setWasteValues({});
      setSelectedPersona('Executive Chef');
      setManualForm({ name: '', cuisine: '', yield: '1', prepTime: '20', description: '', steps: '' });
      setManualIngredients([{ id: 1, name: '', qty: '', unit: 'g', costPerUnit: '', wastePct: '0' }]);
  };

  const handleSurpriseMe = () => { const random = SAMPLE_DISHES[Math.floor(Math.random() * SAMPLE_DISHES.length)]; setDishName(random.name); setNotes(random.desc); setCuisine(random.cuisine); setIngredients(random.ingredients); setDietary(random.dietary); setError(null); setSelectedSku(null); };
  const handlePopularIdea = (idea: typeof POPULAR_IDEAS[0]) => { setDishName(idea.name); setNotes(idea.desc); setCuisine(idea.cuisine); setIngredients(idea.ingredients); setDietary(idea.dietary); setError(null); setSelectedSku(null); };

  const handleFormSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!dishName) { setError("Please enter a dish name."); return; }
      if (!checkQuota()) return;
      setError(null);

      const requirements = `
          Cuisine Style: ${cuisine || 'Standard'}
          Key Ingredients to Include: ${ingredients || 'AI Suggested'}
          Dietary Restrictions: ${dietary.length > 0 ? dietary.join(', ') : 'None'}
          Preparation Notes: ${notes || 'Standard preparation'}
      `.trim();

      const tempItem: MenuItem = {
          sku_id: selectedSku || `NEW-${Date.now().toString().slice(-4)}`,
          name: dishName,
          category: 'main',
          prep_time_min: 0,
          current_price: 0,
          ingredients: []
      };

      await handleGeneration(tempItem, requirements);
  };

  const addManualIngredient = () => setManualIngredients([...manualIngredients, { id: Date.now(), name: '', qty: '', unit: 'g', costPerUnit: '', wastePct: '0' }]);
  const removeManualIngredient = (id: number) => manualIngredients.length > 1 && setManualIngredients(manualIngredients.filter(i => i.id !== id));
  const updateManualIngredient = (id: number, field: string, value: string) => setManualIngredients(manualIngredients.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleManualSubmit = () => {
      const yieldVal = parseFloat(manualForm.yield) || 1;
      const totalCost = manualIngredients.reduce((acc, ing) => {
          const qty = parseFloat(ing.qty) || 0;
          const price = parseFloat(ing.costPerUnit) || 0;
          return acc + (qty * price); // Simplified manual cost
      }, 0) / yieldVal;

      const newRecipe: RecipeCard = {
          sku_id: `MAN-${Date.now()}`,
          name: manualForm.name,
          category: 'main',
          prep_time_min: parseFloat(manualForm.prepTime) || 20,
          current_price: 0,
          ingredients: manualIngredients.map(i => ({
              ingredient_id: `ing_${i.id}`,
              name: i.name,
              qty: `${i.qty} ${i.unit}`,
              cost_per_unit: parseFloat(i.costPerUnit) || 0,
              cost_per_serving: (parseFloat(i.qty) * (parseFloat(i.costPerUnit) || 0)) / yieldVal
          })),
          yield: yieldVal,
          preparation_steps: manualForm.steps.split('\n').filter(s => s.trim()),
          equipment_needed: [],
          portioning_guideline: 'Standard',
          allergens: [],
          shelf_life_hours: 24,
          food_cost_per_serving: totalCost,
          suggested_selling_price: totalCost / 0.3,
          tags: ['Manual', manualForm.cuisine],
          human_summary: manualForm.description,
          cuisine: manualForm.cuisine
      };
      
      setGeneratedRecipe(newRecipe);
      setCreationMode('ai'); // Switch back to view
  };

  const handleGeneration = async (item: MenuItem, requirements: string) => {
      setLoading(true);
      setLoadingText("Analyzing culinary patterns...");
      try {
          // Deduct Quota
          if (!deductQuota()) {
              setLoading(false);
              return;
          }

          const res = await generateRecipeCard(user.id, item, requirements, user.location, selectedPersona);
          setGeneratedRecipe(res);
          ingredientService.learnPrices(res.ingredients);
      } catch (err: any) {
          setError(formatError(err));
      } finally {
          setLoading(false);
      }
  };

  const handleSaveRecipe = () => {
      if (generatedRecipe) {
          storageService.saveRecipe(user.id, generatedRecipe);
          setViewMode('saved');
          setSavedRecipes(storageService.getSavedRecipes(user.id));
      }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
            <button onClick={() => handleTabChange('generator')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'generator' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>AI Generator</button>
            <button onClick={() => handleTabChange('saved')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'saved' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>Saved Recipes</button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-full text-xs font-bold">
            <ChefHat size={12} fill="currentColor" /> Recipes Left: {user.recipeQuota}
        </div>
      </div>

      {viewMode === 'generator' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
              {/* Left Form */}
              <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-xl p-6 overflow-y-auto border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold dark:text-white">Create Recipe</h2>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-1">
                          <button onClick={() => setCreationMode('ai')} className={`px-3 py-1 text-xs font-bold rounded ${creationMode === 'ai' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>AI</button>
                          <button onClick={() => setCreationMode('manual')} className={`px-3 py-1 text-xs font-bold rounded ${creationMode === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>Manual</button>
                      </div>
                  </div>

                  {creationMode === 'ai' ? (
                      <form onSubmit={handleFormSubmit} className="space-y-5">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Dish Name</label>
                              <input value={dishName} onChange={e => setDishName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm dark:text-white" placeholder="e.g. Truffle Risotto" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Cuisine</label>
                                  <input value={cuisine} onChange={e => setCuisine(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm dark:text-white" placeholder="e.g. Italian" />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Persona</label>
                                  <select value={selectedPersona} onChange={e => setSelectedPersona(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm dark:text-white">
                                      {CHEF_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Key Ingredients</label>
                              <input value={ingredients} onChange={e => setIngredients(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm dark:text-white" placeholder="e.g. Mushrooms, Arborio Rice" />
                          </div>

                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm dark:text-white h-20" placeholder="Special instructions..." />
                          </div>

                          {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded">{error}</div>}

                          <div className="pt-2">
                              <button type="button" onClick={handleSurpriseMe} className="text-xs text-emerald-600 font-bold hover:underline mb-4 block">🎲 Surprise Me</button>
                              <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex justify-center gap-2">
                                  {loading ? <Loader2 className="animate-spin" /> : <Calculator size={18} />} Calculate Cost (1 Quota)
                              </button>
                          </div>
                      </form>
                  ) : (
                      <div className="space-y-4">
                          <input placeholder="Dish Name" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white" />
                          {manualIngredients.map((ing, i) => (
                              <div key={ing.id} className="flex gap-2">
                                  <input placeholder="Item" value={ing.name} onChange={e => updateManualIngredient(ing.id, 'name', e.target.value)} className="flex-1 p-2 border rounded text-xs dark:bg-slate-800 dark:text-white" />
                                  <input placeholder="Qty" value={ing.qty} onChange={e => updateManualIngredient(ing.id, 'qty', e.target.value)} className="w-16 p-2 border rounded text-xs dark:bg-slate-800 dark:text-white" />
                                  <input placeholder="Cost" value={ing.costPerUnit} onChange={e => updateManualIngredient(ing.id, 'costPerUnit', e.target.value)} className="w-16 p-2 border rounded text-xs dark:bg-slate-800 dark:text-white" />
                                  <button onClick={() => removeManualIngredient(ing.id)} className="text-red-500"><Trash2 size={14} /></button>
                              </div>
                          ))}
                          <button onClick={addManualIngredient} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus size={12}/> Add Ingredient</button>
                          <button onClick={handleManualSubmit} className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg mt-4">Save Manual Recipe</button>
                      </div>
                  )}
              </div>

              {/* Right Output */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-y-auto p-8 flex flex-col items-center">
                  {generatedRecipe ? (
                      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
                          <div className="h-48 w-full bg-slate-200 relative">
                              <img src={getBgImage(generatedRecipe.cuisine, generatedRecipe.name)} className="w-full h-full object-cover" alt={generatedRecipe.name} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                  <div>
                                      <h1 className="text-3xl font-bold text-white">{generatedRecipe.name}</h1>
                                      <div className="flex gap-2 mt-2">
                                          {generatedRecipe.tags.map(t => <span key={t} className="text-xs bg-white/20 text-white px-2 py-1 rounded backdrop-blur-sm">{t}</span>)}
                                      </div>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="p-8 grid grid-cols-2 gap-8">
                              <div>
                                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">Cost Analysis</h3>
                                  <div className="space-y-3">
                                      <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Food Cost (1 serving)</span>
                                          <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{generatedRecipe.food_cost_per_serving.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Suggested Price</span>
                                          <span className="font-bold text-blue-700 dark:text-blue-400">₹{generatedRecipe.suggested_selling_price.toFixed(2)}</span>
                                      </div>
                                  </div>
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">Details</h3>
                                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                      <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>Prep Time</span> <span>{generatedRecipe.prep_time_minutes} mins</span></li>
                                      <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>Yield</span> <span>{generatedRecipe.yield} servings</span></li>
                                      <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>Shelf Life</span> <span>{generatedRecipe.shelf_life_hours} hours</span></li>
                                  </ul>
                              </div>
                          </div>

                          <div className="p-8 border-t border-slate-100 dark:border-slate-800">
                              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Ingredients</h3>
                              <table className="w-full text-sm text-left">
                                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800">
                                      <tr>
                                          <th className="px-4 py-2">Item</th>
                                          <th className="px-4 py-2">Qty</th>
                                          <th className="px-4 py-2 text-right">Cost</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {generatedRecipe.ingredients.map((ing, i) => (
                                          <tr key={i}>
                                              <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{ing.name}</td>
                                              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{ing.qty_per_serving?.toFixed(1) || ing.qty} {ing.unit}</td>
                                              <td className="px-4 py-2 text-right font-bold text-slate-700 dark:text-slate-300">₹{ing.cost_per_serving?.toFixed(2)}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>

                          <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                              <button onClick={handleSaveRecipe} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-2">
                                  <Save size={18} /> Save to Database
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-slate-400 mt-20">
                          <ChefHat size={64} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Ready to Cook</p>
                          <p className="text-sm">Use the AI generator to create cost-optimized recipes.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {viewMode === 'saved' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex-1 overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Saved Recipes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map(recipe => (
                      <div key={recipe.sku_id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {setGeneratedRecipe(recipe); setViewMode('generator');}}>
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-slate-800 dark:text-white">{recipe.name}</h3>
                              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">₹{recipe.food_cost_per_serving.toFixed(0)}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{recipe.human_summary}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
