
import React, { useState, useEffect } from 'react';
import { User, InventoryItem, PurchaseOrder } from '../types';
import { storageService } from '../services/storageService';
import { generatePurchaseOrder, generateMarketingImage } from '../services/geminiService';
import { CREDIT_COSTS } from '../constants';
import { Package, Search, Plus, Trash2, AlertTriangle, ArrowDown, ArrowUp, ShoppingCart, Loader2, Mail, CheckCircle2, RefreshCw, BarChart3, Edit2, Camera, Sparkles, X } from 'lucide-react';

interface InventoryManagerProps {
    user: User;
    onUserUpdate?: (user: User) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ user, onUserUpdate }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'low_stock'>('all');
    
    // Add Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
        name: '', category: 'General', currentStock: 0, unit: 'kg', costPerUnit: 0, parLevel: 0, supplier: ''
    });

    // PO State
    const [isGeneratingPO, setIsGeneratingPO] = useState(false);
    const [generatedPO, setGeneratedPO] = useState<PurchaseOrder | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');

    // AI Image Generation State
    const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    useEffect(() => {
        const data = storageService.getInventory(user.id);
        setInventory(data);
    }, [user.id]);

    const handleAddItem = () => {
        if (!newItem.name || !newItem.unit) return;
        const item: InventoryItem = {
            id: `inv_${Date.now()}`,
            name: newItem.name,
            category: newItem.category || 'General',
            currentStock: Number(newItem.currentStock),
            unit: newItem.unit,
            costPerUnit: Number(newItem.costPerUnit),
            parLevel: Number(newItem.parLevel),
            supplier: newItem.supplier || 'General Supplier',
            lastUpdated: new Date().toISOString()
        };
        const updated = [...inventory, item];
        setInventory(updated);
        storageService.saveInventory(user.id, updated);
        setShowAddModal(false);
        setNewItem({ name: '', category: 'General', currentStock: 0, unit: 'kg', costPerUnit: 0, parLevel: 0, supplier: '' });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Delete item?")) return;
        const updated = inventory.filter(i => i.id !== id);
        setInventory(updated);
        storageService.saveInventory(user.id, updated);
    };

    const handleUpdateStock = (id: string, delta: number) => {
        const updated = inventory.map(i => {
            if (i.id === id) {
                return { ...i, currentStock: Math.max(0, i.currentStock + delta), lastUpdated: new Date().toISOString() };
            }
            return i;
        });
        setInventory(updated);
        storageService.saveInventory(user.id, updated);
    };

    const handleGeneratePO = async () => {
        if (!selectedSupplier) {
            alert("Please select a supplier first.");
            return;
        }
        
        const supplierItems = inventory.filter(i => i.supplier === selectedSupplier);
        const lowStock = supplierItems.filter(i => i.currentStock < i.parLevel);

        if (lowStock.length === 0) {
            alert("No low stock items for this supplier.");
            return;
        }

        setIsGeneratingPO(true);
        try {
            const po = await generatePurchaseOrder(selectedSupplier, supplierItems);
            setGeneratedPO(po);
        } catch (e) {
            alert("Failed to generate PO");
        } finally {
            setIsGeneratingPO(false);
        }
    };

    const handleGenerateProductImage = async (item: InventoryItem) => {
        setIsGeneratingImage(item.id);
        try {
            const prompt = `Professional product photography of ${item.name}, ${item.category} ingredient, high-end restaurant kitchen setting, hyper-realistic, 4k, cinematic lighting, shallow depth of field.`;
            const imageUrl = await generateMarketingImage(prompt, '1:1');
            
            const updated = inventory.map(i => i.id === item.id ? { ...i, imageUrl } : i);
            setInventory(updated);
            storageService.saveInventory(user.id, updated);
        } catch (e) {
            alert("Image generation failed. Please check your AI API key.");
        } finally {
            setIsGeneratingImage(null);
        }
    };

    // Derived State
    const lowStockCount = inventory.filter(i => i.currentStock < i.parLevel).length;
    const totalValue = inventory.reduce((acc, i) => acc + (i.currentStock * i.costPerUnit), 0);
    const uniqueSuppliers = Array.from(new Set(inventory.map(i => i.supplier).filter(Boolean)));

    const filteredInventory = inventory.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || (filter === 'low_stock' && i.currentStock < i.parLevel);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase">Total Inventory Value</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">₹{totalValue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <BarChart3 size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase">Low Stock Items</p>
                        <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lowStockCount}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase">Actions</p>
                    <div className="flex gap-2">
                        <select 
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            className="flex-1 text-xs border rounded px-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        >
                            <option value="">Select Supplier to Order</option>
                            {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                            onClick={handleGeneratePO}
                            disabled={!selectedSupplier || isGeneratingPO}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isGeneratingPO ? <Loader2 size={12} className="animate-spin" /> : <ShoppingCart size={12} />}
                            Auto-Order
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex gap-4 items-center">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Package className="text-emerald-600" size={20} /> Inventory List
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search items..."
                                className="pl-8 pr-4 py-1.5 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs font-bold rounded transition-all ${filter === 'all' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'}`}>All</button>
                            <button onClick={() => setFilter('low_stock')} className={`px-3 py-1 text-xs font-bold rounded transition-all ${filter === 'low_stock' ? 'bg-red-100 text-red-700' : 'text-slate-500'}`}>Low Stock</button>
                        </div>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 transition-all">
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Visual</th>
                                <th className="px-6 py-3">Item Name</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Stock Level</th>
                                <th className="px-6 py-3">Par Level</th>
                                <th className="px-6 py-3">Unit Cost</th>
                                <th className="px-6 py-3">Supplier</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInventory.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                    <td className="px-6 py-4">
                                        {item.imageUrl ? (
                                            <div 
                                                className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                                                onClick={() => setViewingImage(item.imageUrl!)}
                                            >
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleGenerateProductImage(item)}
                                                disabled={!!isGeneratingImage}
                                                className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all"
                                                title="Generate AI Product Image"
                                            >
                                                {isGeneratingImage === item.id ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : <Camera size={16} />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">{item.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${item.currentStock < item.parLevel ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {item.currentStock} {item.unit}
                                            </span>
                                            {item.currentStock < item.parLevel && <AlertTriangle size={14} className="text-red-500" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.parLevel} {item.unit}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">₹{item.costPerUnit}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.supplier}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleUpdateStock(item.id, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"><ArrowDown size={14}/></button>
                                            <button onClick={() => handleUpdateStock(item.id, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"><ArrowUp size={14}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Preview Modal */}
            {viewingImage && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 overflow-hidden" onClick={() => setViewingImage(null)}>
                    <div className="relative max-w-4xl max-h-full animate-scale-in" onClick={e => e.stopPropagation()}>
                        <img src={viewingImage} alt="Product Preview" className="rounded-2xl shadow-2xl border border-white/10" />
                        <button 
                            onClick={() => setViewingImage(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-red-400 transition-colors bg-white/10 rounded-full"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Generated PO Modal */}
            {generatedPO && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Mail className="text-blue-500" /> Draft Purchase Order
                                </h3>
                                <p className="text-sm text-slate-500">To: {generatedPO.supplier}</p>
                            </div>
                            <button onClick={() => setGeneratedPO(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Order Summary</h4>
                            <div className="space-y-2">
                                {generatedPO.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{item.qty} {item.unit}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 flex justify-between font-bold">
                                    <span>Est. Total</span>
                                    <span className="text-emerald-600">₹{generatedPO.totalEstimatedCost}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase">Email Body Preview</label>
                            <textarea 
                                readOnly 
                                value={generatedPO.emailBody} 
                                className="w-full h-40 p-3 text-sm border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-slate-300 resize-none outline-none font-mono"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setGeneratedPO(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">Discard</button>
                            <button onClick={() => { alert("Email sent to supplier!"); setGeneratedPO(null); }} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20">
                                <Mail size={16} /> Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-white">Add Inventory Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="space-y-3">
                            <input placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="Category" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                <input placeholder="Supplier" value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" placeholder="Current Stock" value={newItem.currentStock} onChange={e => setNewItem({...newItem, currentStock: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                <input placeholder="Unit (kg/l)" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" placeholder="Cost per Unit" value={newItem.costPerUnit} onChange={e => setNewItem({...newItem, costPerUnit: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                <input type="number" placeholder="Par Level (Min Stock)" value={newItem.parLevel} onChange={e => setNewItem({...newItem, parLevel: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                <button onClick={handleAddItem} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">Add Item</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
