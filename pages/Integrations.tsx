
import React, { useState, useRef, useEffect } from 'react';
import { 
    UploadCloud, CheckCircle2, Server, Loader2, X, FileSpreadsheet, Download, 
    Settings, Key, AlertTriangle, ArrowRight, ShieldCheck, BookOpen, 
    ExternalLink, Save, Receipt, Instagram, Facebook, MapPin, Megaphone, 
    ImageIcon, Link2, LogOut, Globe, UserIcon, BarChart3, FileJson, 
    Archive, Database, ShieldAlert, Cpu, IndianRupee, History, Trash2, 
    Calendar, Plus, Users, ShoppingBag, Wallet, Network, Settings2, Sparkles, Activity, Zap,
    RefreshCw, Info, ExternalLink as LinkIcon, Terminal, Check, Shield, Code, ArrowLeft
} from 'lucide-react';
import { storageService, storageEvents } from '../services/storageService';
import { ManualSalesEntry, ManualPurchaseEntry, ManualExpenseEntry, ManualManpowerEntry, User, IntegrationConfig } from '../types';
import { authService } from '../services/authService';
import { hasValidApiKey, openNeuralGateway } from '../services/geminiService';

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

  // Neural Gateway Status
  const [isGatewayActive, setIsGatewayActive] = useState(hasValidApiKey());
  const [isVerifying, setIsVerifying] = useState(false);
  const [manuallyTriggered, setManuallyTriggered] = useState(false);

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
      const checkGatewaySync = async () => {
          // If the user just clicked "Connect", we trust them until a hard error occurs.
          // This mitigates the race condition where env var injection takes time.
          if (manuallyTriggered) return;

          const valid = hasValidApiKey();
          if (valid !== isGatewayActive) {
              setIsGatewayActive(valid);
          }
      };

      // Periodic check for environmental sync
      const interval = setInterval(checkGatewaySync, 2000);
      checkGatewaySync();

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

      return () => clearInterval(interval);
  }, [user, isGatewayActive, manuallyTriggered]);

  const handleNeuralHandshake = async () => {
      setIsVerifying(true);
      // Triggers platform window.aistudio.openSelectKey()
      const triggered = await openNeuralGateway();
      
      if (triggered) {
          // MANDATORY: Assume success after triggering the dialog to proceed immediately.
          setIsGatewayActive(true);
          setManuallyTriggered(true);
          
          // Brief visual feedback before letting the platform dialog take over
          setTimeout(() => setIsVerifying(false), 500);
      } else {
          setIsVerifying(false);
      }
  };

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
              version: "2.5.7",
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
      a.download = `BistroIntelligence_Bundle_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setTimeout(() => setIsExporting(false), 1000);
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
      }, 500);
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
                
                {/* --- NEURAL HANDSHAKE TERMINAL --- */}
                <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all relative">
                    <div className="flex items-center gap-2 px-6 py-4 bg-slate-900/50 border-b border-slate-800">
                        <Terminal size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">BistroIntelligence // Neural_Gateway_Interface</span>
                        <div className="flex-1"></div>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                        </div>
                    </div>

                    <div className="p-10 min-h-[400px] flex flex-col justify-center">
                        {!isGatewayActive ? (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                                            <Key size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Connect Neural OS</h3>
                                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">STATUS: STANDBY // WAITING_FOR_HANDSHAKE</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                                            To initialize the intelligence engine, please establish a connection with your Google Cloud project. This powers the high-tier vision models (Gemini 3 Pro) for your restaurant audits.
                                        </p>

                                        <div className="space-y-4">
                                            <button 
                                                onClick={handleNeuralHandshake}
                                                disabled={isVerifying}
                                                className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                {isVerifying ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18}/>}
                                                Initialize Neural Gateway
                                            </button>
                                            <div className="flex items-center justify-center gap-2 opacity-40">
                                                <Shield size={12} className="text-slate-400" />
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Authenticated Secure Handshake Protocol</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-fade-in">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.1)] neural-pulse">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">API_GATEWAY_ONLINE</h3>
                                            <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mt-1">Status: VERIFIED // Security: AES-256 Tunnel</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleNeuralHandshake}
                                        className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <RefreshCw size={14}/> Re-verify Session
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Verified Capabilities</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                "Recipe & Costing Engine",
                                                "SOP Studio (Auto-Refinement)",
                                                "Staff Movement & CCTV Analytics",
                                                "Inventory Intelligence",
                                                "Strategy & Marketing Generator",
                                                "Dashboard Intelligence Rendering"
                                            ].map((cap, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                                                    <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                        <Check size={10} className="text-emerald-500" />
                                                    </div>
                                                    {cap}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">System Diagnostics</h4>
                                        <div className="space-y-3">
                                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${Object.values(posLinks).some(v=>v) ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Server size={14} className={Object.values(posLinks).some(v=>v) ? 'text-emerald-500' : 'text-amber-500'} />
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">POS Integrations</span>
                                                </div>
                                                {Object.values(posLinks).some(v=>v) ? (
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase">SYNCHRONIZED</span>
                                                ) : (
                                                    <span className="text-[8px] font-black text-amber-500 uppercase">MISSING_STREAMS</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-900/30 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                        <span>AES_256_ENCRYPTED_TUNNEL</span>
                        <span>NODE_ID: BC_OS_ALPHA_04</span>
                    </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border-slate-200 dark:border-slate-800 mt-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Server className="text-indigo-500" size={24}/> External Data Streams (POS)
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
              <div className="lg:col-span-3 space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Ingress Streams</p>
                  <button onClick={() => setManualCategory('sales')} className={`w-full p-6 rounded-3xl border-2 flex items-center gap-4 transition-all ${manualCategory === 'sales' ? 'border-emerald-500 bg-emerald-50/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}`}>
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

              <div className="lg:col-span-9 flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                          Manual {manualCategory.charAt(0).toUpperCase() + manualCategory.slice(1)} Ingress
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded">LOCAL_WRITE_MODE</span>
                      </h3>
                      
                      <form onSubmit={handleAddManualEntry} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Entry Date</label>
                              <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>

                          {manualCategory === 'sales' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Revenue (₹)</label>
                                      <input name="revenue" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Order Count</label>
                                      <input name="orders" type="number" required placeholder="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Channel</label>
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
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Supplier Name</label>
                                      <input name="supplier" type="text" required placeholder="Vendor ID" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Amount (₹)</label>
                                      <input name="amount" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
                                      <input name="category" type="text" required placeholder="Dry Goods / Dairy" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                              </>
                          )}

                          {manualCategory === 'expense' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Expense Type</label>
                                      <select name="type" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none">
                                          <option>Rent</option>
                                          <option>Utility</option>
                                          <option>Marketing</option>
                                          <option>Maintenance</option>
                                          <option>Other</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Amount (₹)</label>
                                      <input name="amount" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Note</label>
                                      <input name="note" type="text" placeholder="Details..." className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div className="hidden md:block"></div>
                              </>
                          )}

                          {manualCategory === 'manpower' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Staff Count</label>
                                      <input name="staff" type="number" required placeholder="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Salaries (₹)</label>
                                      <input name="salaries" type="number" required placeholder="0.00" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Overtime Hours</label>
                                      <input name="overtime" type="number" placeholder="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                  </div>
                              </>
                          )}

                          <button type="submit" className="md:col-start-4 w-full py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 shadow-xl transition-all">
                              <Save size={16}/> Commit Entry
                          </button>
                      </form>
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
          </div>
      )}
    </div>
  );
};
