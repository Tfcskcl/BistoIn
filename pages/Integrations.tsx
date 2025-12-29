
import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Server, Loader2, X, FileSpreadsheet, Download, Settings, Key, AlertTriangle, ArrowRight, ShieldCheck, BookOpen, ExternalLink, Save, Receipt, Instagram, Facebook, MapPin, Megaphone, ImageIcon, Link2, LogOut, Globe, UserIcon, BarChart3, FileJson, Archive, Database, ShieldAlert, Cpu, IndianRupee, History, Trash2, Calendar, Plus, Users, ShoppingBag, Wallet, Network, Settings2 } from 'lucide-react';
import { storageService, storageEvents } from '../services/storageService';
import { ManualSalesEntry, ManualPurchaseEntry, ManualExpenseEntry, ManualManpowerEntry, User, IntegrationConfig } from '../types';
import { authService } from '../services/authService';

interface IntegrationItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: string;
  lastSync?: string;
  loading?: boolean;
}

export const Integrations: React.FC = () => {
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'network' | 'manual' | 'archive'>('network');
  const [manualCategory, setManualCategory] = useState<'sales' | 'purchase' | 'expense' | 'manpower'>('sales');
  
  const [posLinks, setPosLinks] = useState<Record<string, boolean>>({});
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    { id: 'petpooja', name: 'Petpooja', icon: 'P', status: 'disconnected' },
    { id: 'swiggy', name: 'Swiggy', icon: 'S', status: 'disconnected' },
    { id: 'zomato', name: 'Zomato', icon: 'Z', status: 'disconnected' },
  ]);

  // Integration Config State
  const [configModal, setConfigModal] = useState<IntegrationItem | null>(null);
  const [currentConfig, setCurrentConfig] = useState<IntegrationConfig>({ storeId: '', apiKey: '', apiSecret: '' });

  // Manual Data States
  const [salesEntries, setSalesEntries] = useState<ManualSalesEntry[]>([]);
  const [purchaseEntries, setPurchaseEntries] = useState<ManualPurchaseEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ManualExpenseEntry[]>([]);
  const [manpowerEntries, setManualManpower] = useState<ManualManpowerEntry[]>([]);

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
      if (user) {
          const links = storageService.getPOSConnections(user.id);
          setPosLinks(links);
          setIntegrations(prev => prev.map(int => ({
              ...int,
              status: links[int.id] ? 'connected' : 'disconnected',
              lastSync: links[int.id] ? 'Recently synced' : undefined
          })));

          setSalesEntries(storageService.getManualSales(user.id));
          setPurchaseEntries(storageService.getManualPurchases(user.id));
          setExpenseEntries(storageService.getManualExpenses(user.id));
          setManualManpower(storageService.getManualManpower(user.id));
      }
  }, []);

  const handleOpenConfig = (item: IntegrationItem) => {
      if (!user) return;
      const saved = storageService.getIntegrationConfig(user.id, item.id);
      setCurrentConfig(saved || { storeId: '', apiKey: '', apiSecret: '' });
      setConfigModal(item);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !configModal) return;
      storageService.saveIntegrationConfig(user.id, configModal.id, currentConfig);
      storageService.setPOSConnection(user.id, configModal.id, true);
      
      setPosLinks(prev => ({ ...prev, [configModal.id]: true }));
      setIntegrations(prev => prev.map(int => {
          if (int.id === configModal.id) {
              return { ...int, status: 'connected', lastSync: 'Authorized just now' };
          }
          return int;
      }));
      setConfigModal(null);
  };

  const handleExportBundle = () => {
      setIsExporting(true);
      const projectBundle = {
          metadata: {
              projectName: "BistroConnect_Project_Active",
              exportDate: new Date().toISOString(),
              version: "2.5.0",
              engine: "Gemini-3-Pro-Unified"
          },
          data: {
              localStorage: {} as Record<string, string>,
              schemas: ["Recipe", "SOP", "Inventory", "CCTV", "Strategy", "ManualIngress"]
          }
      };

      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('bistro_') || key === 'theme')) {
              projectBundle.data.localStorage[key] = localStorage.getItem(key) || "";
          }
      }
      
      const blob = new Blob([JSON.stringify(projectBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BistroIntelligence_Master_Bundle_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setTimeout(() => setIsExporting(false), 2000);
  };

  const togglePOSConnection = (id: string) => {
      if (!user) return;
      setIntegrations(prev => prev.map(int => int.id === id ? { ...int, loading: true } : int));
      
      setTimeout(() => {
          const currentStatus = posLinks[id] || false;
          const newStatus = !currentStatus;
          storageService.setPOSConnection(user.id, id, newStatus);
          setPosLinks(prev => ({ ...prev, [id]: newStatus }));
          
          setIntegrations(prev => prev.map(int => {
              if (int.id === id) {
                  return { ...int, status: newStatus ? 'connected' : 'disconnected', lastSync: newStatus ? 'Just now' : undefined, loading: false };
              }
              return int;
          }));
      }, 800);
  };

  const handleAddManualEntry = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      
      if (manualCategory === 'sales') {
          const entry: ManualSalesEntry = {
              id: `sale_${Date.now()}`,
              date: formData.get('date') as string,
              revenue: Number(formData.get('revenue')),
              orderCount: Number(formData.get('orders')),
              channel: formData.get('channel') as any
          };
          const updated = [entry, ...salesEntries];
          setSalesEntries(updated);
          storageService.saveManualSales(user.id, updated);
      } else if (manualCategory === 'purchase') {
          const entry: ManualPurchaseEntry = {
              id: `pur_${Date.now()}`,
              date: formData.get('date') as string,
              supplier: formData.get('supplier') as string,
              amount: Number(formData.get('amount')),
              category: formData.get('category') as string
          };
          const updated = [entry, ...purchaseEntries];
          setPurchaseEntries(updated);
          storageService.saveManualPurchases(user.id, updated);
      } else if (manualCategory === 'expense') {
          const entry: ManualExpenseEntry = {
              id: `exp_${Date.now()}`,
              date: formData.get('date') as string,
              type: formData.get('type') as any,
              amount: Number(formData.get('amount')),
              note: formData.get('note') as string
          };
          const updated = [entry, ...expenseEntries];
          setExpenseEntries(updated);
          storageService.saveManualExpenses(user.id, updated);
      } else if (manualCategory === 'manpower') {
          const entry: ManualManpowerEntry = {
              id: `man_${Date.now()}`,
              date: formData.get('date') as string,
              staffCount: Number(formData.get('staff')),
              totalSalaries: Number(formData.get('salaries')),
              overtimeHours: Number(formData.get('overtime'))
          };
          const updated = [entry, ...manpowerEntries];
          setManualManpower(updated);
          storageService.saveManualManpower(user.id, updated);
      }
      (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Nexus Control</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-xs">// MANAGE_NODES // DATA_STREAMS // ARCHIVE</p>
        </div>
        <div className="flex gap-4">
             <button 
                onClick={handleExportBundle}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl border border-slate-200 dark:border-slate-700"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : <Archive size={16} className="text-indigo-500" />}
                Package Master Project
            </button>
        </div>
      </div>

      <div className="flex gap-2">
          <button onClick={() => setActiveTab('network')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'network' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><Cpu size={14}/> Network Nodes</button>
          <button onClick={() => setActiveTab('manual')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'manual' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><Plus size={14}/> Manual Ingress</button>
          <button onClick={() => setActiveTab('archive')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><History size={14}/> Global Archive</button>
      </div>

      {activeTab === 'network' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="glass p-8 rounded-[2.5rem] border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Server className="text-indigo-500" size={24}/> Connected POS Nodes
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">ACTIVE_LINKS: {integrations.filter(i=>i.status==='connected').length}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {integrations.map((pos) => (
                            <div key={pos.id} className={`p-6 rounded-3xl border transition-all ${pos.status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-xl shadow-inner ${pos.status === 'connected' ? 'neural-pulse' : ''}`}>
                                        {pos.icon}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenConfig(pos)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"><Settings2 size={12}/></button>
                                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${pos.status === 'connected' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {pos.status}
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{pos.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase">
                                    {pos.status === 'connected' ? `LINK_STATUS: OK` : 'NO_ACTIVE_LINK'}
                                </p>
                                <button 
                                    onClick={() => pos.status === 'connected' ? togglePOSConnection(pos.id) : handleOpenConfig(pos)} 
                                    disabled={pos.loading}
                                    className="w-full mt-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {pos.loading ? <Loader2 size={14} className="animate-spin mx-auto"/> : (pos.status === 'connected' ? 'Break Link' : 'Establish API Link')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass p-8 rounded-[2.5rem] border-slate-200 dark:border-slate-800 flex items-center gap-6 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Key className="text-indigo-500" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">API Gateway</h4>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest">Global Secret Config</p>
                        </div>
                    </div>
                    <div className="glass p-8 rounded-[2.5rem] border-slate-200 dark:border-slate-800 flex items-center gap-6 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Globe className="text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Cloud Sync</h4>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest">Multi-Node Replication</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="glass p-10 rounded-[2.5rem] border-indigo-500/20 relative overflow-hidden group bg-indigo-500/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Network size={100}/></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Automated Extraction</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-8">
                        Using official API technical protocols to fetch your sales, menu, and inventory reports every 24 hours without dashboard login details.
                    </p>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400">NEXT_SCAN:</span>
                            <span className="text-indigo-500 font-bold">IN_4_HOURS</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full w-[75%]"></div>
                        </div>
                        <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Force Re-extraction</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'manual' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
              {/* Category Selector */}
              <div className="lg:col-span-3 space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Ingress Streams</p>
                  <button onClick={() => setManualCategory('sales')} className={`w-full p-6 rounded-3xl border-2 flex items-center gap-4 transition-all ${manualCategory === 'sales' ? 'border-emerald-500 bg-emerald-500/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}`}>
                      <BarChart3 className={manualCategory === 'sales' ? 'text-emerald-500' : 'text-slate-400'} />
                      <div className="text-left"><p className={`font-black uppercase tracking-tight ${manualCategory === 'sales' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>Sales Inflow</p><p className="text-[9px] font-mono text-slate-500">REVENUE_DATA</p></div>
                  </button>
                  <button onClick={() => setManualCategory('purchase')} className={`w-full p-6 rounded-3xl border-2 flex items-center gap-4 transition-all ${manualCategory === 'purchase' ? 'border-blue-500 bg-blue-500/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}`}>
                      <ShoppingBag className={manualCategory === 'purchase' ? 'text-blue-500' : 'text-slate-400'} />
                      <div className="text-left"><p className={`font-black uppercase tracking-tight ${manualCategory === 'purchase' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>Purchases</p><p className="text-[9px] font-mono text-slate-500">INVENTORY_BILLING</p></div>
                  </button>
                  <button onClick={() => setManualCategory('expense')} className={`w-full p-6 rounded-3xl border-2 flex items-center gap-4 transition-all ${manualCategory === 'expense' ? 'border-amber-500 bg-amber-500/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}`}>
                      <Wallet className={manualCategory === 'expense' ? 'text-amber-500' : 'text-slate-400'} />
                      <div className="text-left"><p className={`font-black uppercase tracking-tight ${manualCategory === 'expense' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>Expenses</p><p className="text-[9px] font-mono text-slate-500">OVERHEAD_COSTS</p></div>
                  </button>
                  <button onClick={() => setManualCategory('manpower')} className={`w-full p-6 rounded-3xl border-2 flex items-center gap-4 transition-all ${manualCategory === 'manpower' ? 'border-purple-500 bg-purple-500/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}`}>
                      <Users className={manualCategory === 'manpower' ? 'text-purple-500' : 'text-slate-400'} />
                      <div className="text-left"><p className={`font-black uppercase tracking-tight ${manualCategory === 'manpower' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300'}`}>Manpower</p><p className="text-[9px] font-mono text-slate-500">LABOR_ANALYTICS</p></div>
                  </button>
              </div>

              {/* Data Input Area */}
              <div className="lg:col-span-9 flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                          Manual {manualCategory.charAt(0).toUpperCase() + manualCategory.slice(1)} Ingress
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded">LOCAL_WRITE_MODE</span>
                      </h3>
                      
                      <form onSubmit={handleAddManualEntry} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Entry Date</label>
                              <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>

                          {manualCategory === 'sales' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Revenue (₹)</label>
                                      <input name="revenue" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Order Count</label>
                                      <input name="orders" type="number" required placeholder="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Channel</label>
                                      <select name="channel" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none">
                                          <option>Walk-in</option>
                                          <option>Online</option>
                                          <option>Takeaway</option>
                                      </select>
                                  </div>
                              </>
                          )}

                          {manualCategory === 'purchase' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Supplier Name</label>
                                      <input name="supplier" type="text" required placeholder="Vendor ID" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount (₹)</label>
                                      <input name="amount" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Category</label>
                                      <input name="category" type="text" required placeholder="Dry Goods / Dairy" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                              </>
                          )}

                          {manualCategory === 'expense' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Expense Type</label>
                                      <select name="type" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none">
                                          <option>Rent</option>
                                          <option>Utility</option>
                                          <option>Marketing</option>
                                          <option>Maintenance</option>
                                          <option>Other</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount (₹)</label>
                                      <input name="amount" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Note</label>
                                      <input name="note" type="text" placeholder="Details..." className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div className="hidden md:block"></div>
                              </>
                          )}

                          {manualCategory === 'manpower' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Staff Count</label>
                                      <input name="staff" type="number" required placeholder="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total Salaries (₹)</label>
                                      <input name="salaries" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Overtime Hours</label>
                                      <input name="overtime" type="number" placeholder="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                              </>
                          )}

                          <button type="submit" className="md:col-start-4 w-full py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 shadow-xl transition-all">
                              <Save size={16}/> Commit Entry
                          </button>
                      </form>
                  </div>

                  {/* History of manual entries */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingress Log: {manualCategory}</h4>
                          <span className="text-[10px] font-mono text-slate-400">Total Records: {manualCategory === 'sales' ? salesEntries.length : manualCategory === 'purchase' ? purchaseEntries.length : manualCategory === 'expense' ? expenseEntries.length : manpowerEntries.length}</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left text-xs">
                              <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                                  <tr>
                                      <th className="px-6 py-4">Date</th>
                                      {manualCategory === 'sales' && <><th className="px-6 py-4">Channel</th><th className="px-6 py-4">Revenue</th><th className="px-6 py-4">Orders</th></>}
                                      {manualCategory === 'purchase' && <><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Amount</th></>}
                                      {manualCategory === 'expense' && <><th className="px-6 py-4">Type</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Note</th></>}
                                      {manualCategory === 'manpower' && <><th className="px-6 py-4">Staff</th><th className="px-6 py-4">Cost</th><th className="px-6 py-4">OT Hours</th></>}
                                      <th className="px-6 py-4 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                                  {manualCategory === 'sales' && salesEntries.map(e => (
                                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 text-slate-400">{e.date}</td>
                                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{e.channel}</td>
                                          <td className="px-6 py-4 text-emerald-600 font-black">₹{e.revenue.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-slate-500">{e.orderCount}</td>
                                          <td className="px-6 py-4 text-right"><button onClick={() => { if(user){ const updated = salesEntries.filter(i=>i.id!==e.id); setSalesEntries(updated); storageService.saveManualSales(user.id, updated); } }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                      </tr>
                                  ))}
                                  {manualCategory === 'purchase' && purchaseEntries.map(e => (
                                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 text-slate-400">{e.date}</td>
                                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{e.supplier}</td>
                                          <td className="px-6 py-4 text-slate-500">{e.category}</td>
                                          <td className="px-6 py-4 text-blue-600 font-black">₹{e.amount.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-right"><button onClick={() => { if(user){ const updated = purchaseEntries.filter(i=>i.id!==e.id); setPurchaseEntries(updated); storageService.saveManualPurchases(user.id, updated); } }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                      </tr>
                                  ))}
                                  {manualCategory === 'expense' && expenseEntries.map(e => (
                                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 text-slate-400">{e.date}</td>
                                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{e.type}</td>
                                          <td className="px-6 py-4 text-amber-600 font-black">₹{e.amount.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-slate-500 max-w-[150px] truncate">{e.note}</td>
                                          <td className="px-6 py-4 text-right"><button onClick={() => { if(user){ const updated = expenseEntries.filter(i=>i.id!==e.id); setExpenseEntries(updated); storageService.saveManualExpenses(user.id, updated); } }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                      </tr>
                                  ))}
                                  {manualCategory === 'manpower' && manpowerEntries.map(e => (
                                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 text-slate-400">{e.date}</td>
                                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{e.staffCount} HEADS</td>
                                          <td className="px-6 py-4 text-purple-600 font-black">₹{e.totalSalaries.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-slate-500">{e.overtimeHours}h</td>
                                          <td className="px-6 py-4 text-right"><button onClick={() => { if(user){ const updated = manpowerEntries.filter(i=>i.id!==e.id); setManualManpower(updated); storageService.saveManualManpower(user.id, updated); } }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                      </tr>
                                  ))}
                                  {((manualCategory === 'sales' && salesEntries.length === 0) || (manualCategory === 'purchase' && purchaseEntries.length === 0) || (manualCategory === 'expense' && expenseEntries.length === 0) || (manualCategory === 'manpower' && manpowerEntries.length === 0)) && (
                                      <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 uppercase font-black opacity-30 italic">No historical records in stream</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'archive' && (
          <div className="space-y-6 animate-fade-in-up">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl"><Archive size={32}/></div>
                      <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Serialized Operational Snapshot</h3>
                          <p className="text-slate-500 text-sm mt-1">Generate a comprehensive JSON/Excel package containing all neural assets and operational history.</p>
                      </div>
                  </div>
                  <button 
                    onClick={handleExportBundle}
                    disabled={isExporting}
                    className="px-10 py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50"
                  >
                      {isExporting ? <Loader2 className="animate-spin" size={20}/> : <Download size={20}/>}
                      {isExporting ? 'Packaging...' : 'Begin Serialization'}
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass p-6 rounded-3xl border-slate-800 flex flex-col justify-between group hover:bg-white/5 transition-all cursor-pointer">
                      <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recipe Models</p><h4 className="text-white font-bold text-lg uppercase tracking-tight">Technical Library</h4></div>
                      <p className="text-xs text-slate-500 mt-4 font-mono uppercase">ENTRIES: {storageService.getSavedRecipes(user?.id || '').length}</p>
                  </div>
                  <div className="glass p-6 rounded-3xl border-slate-800 flex flex-col justify-between group hover:bg-white/5 transition-all cursor-pointer">
                      <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Logic Flow</p><h4 className="text-white font-bold text-lg uppercase tracking-tight">SOP Protocol Base</h4></div>
                      <p className="text-xs text-slate-500 mt-4 font-mono uppercase">ENTRIES: {storageService.getSavedSOPs(user?.id || '').length}</p>
                  </div>
                  <div className="glass p-6 rounded-3xl border-slate-800 flex flex-col justify-between group hover:bg-white/5 transition-all cursor-pointer">
                      <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Vision</p><h4 className="text-white font-bold text-lg uppercase tracking-tight">CCTV Audit History</h4></div>
                      <p className="text-xs text-slate-500 mt-4 font-mono uppercase">ENTRIES: {storageService.getCCTVHistory(user?.id || '').length}</p>
                  </div>
              </div>
          </div>
      )}

      {/* API Configuration Modal */}
      {configModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-scale-in">
                  <div className="p-10">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-500 shadow-inner text-xl font-black">
                              {configModal.icon}
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{configModal.name} Config</h3>
                              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">TECHNICAL_HANDSHAKE_NODE</p>
                          </div>
                      </div>

                      <form onSubmit={handleSaveConfig} className="space-y-5">
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Store / Merchant ID</label>
                              <input 
                                value={currentConfig.storeId} 
                                onChange={e => setCurrentConfig({...currentConfig, storeId: e.target.value})}
                                required
                                className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
                                placeholder="ST_XXXX_YY"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">API Key (Bearer Token)</label>
                              <input 
                                value={currentConfig.apiKey} 
                                onChange={e => setCurrentConfig({...currentConfig, apiKey: e.target.value})}
                                required
                                type="password"
                                className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
                                placeholder="••••••••••••••••"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Secret Key</label>
                              <input 
                                value={currentConfig.apiSecret} 
                                onChange={e => setCurrentConfig({...currentConfig, apiSecret: e.target.value})}
                                required
                                type="password"
                                className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
                                placeholder="••••••••••••••••"
                              />
                          </div>

                          <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 flex gap-3 items-start">
                              <ShieldCheck size={16} className="text-indigo-500 shrink-0 mt-0.5"/>
                              <p className="text-[10px] text-slate-400 italic leading-relaxed">System will use these keys to scrape reports directly from {configModal.name}'s secure cloud. No login details required.</p>
                          </div>

                          <div className="flex gap-3 pt-4">
                              <button type="button" onClick={() => setConfigModal(null)} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">Cancel</button>
                              <button type="submit" className="flex-[2] py-3 bg-white text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl">Authorize Node</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
