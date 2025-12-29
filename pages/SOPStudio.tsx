
import React, { useState, useEffect } from 'react';
import { User, SOP, SOPRequest, UserRole } from '../types';
import { generateSOP } from '../services/geminiService';
import { storageService } from '../services/storageService';
// Added AlertTriangle, Package, ListChecks, User as UserIcon for PublicSOPViewer
import { FileText, Loader2, Sparkles, Save, Wallet, BookOpen, Share2, CheckCircle2, Clock, Link, Globe, Lock, Copy, X, Mail, Printer, AlertTriangle, Package, ListChecks, User as UserIcon } from 'lucide-react';
import { Logo } from '../components/Logo';

interface SOPStudioProps {
  user: User;
  onUserUpdate?: (user: User) => void;
  initialSop?: SOP | null;
}

export const SOPStudio: React.FC<SOPStudioProps> = ({ user, onUserUpdate, initialSop }) => {
  const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
  const [viewMode, setViewMode] = useState<'create' | 'saved' | 'requests'>('create');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSOP, setGeneratedSOP] = useState<SOP | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSOPs, setSavedSOPs] = useState<SOP[]>([]);
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareSOP, setShareSOP] = useState<SOP | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadSavedSOPs();
    if (initialSop) {
        setGeneratedSOP(initialSop);
        setViewMode('create');
    }
  }, [user.id, initialSop]);

  const loadSavedSOPs = () => setSavedSOPs(storageService.getSavedSOPs(user.id));

  const checkQuota = (): boolean => {
      if (isAdmin) return true;
      if (user.sopQuota <= 0) {
          setError(`No SOPs left in quota. Please top up.`);
          return false;
      }
      return true;
  };

  const deductQuota = (): boolean => {
      if (!isAdmin && onUserUpdate) {
          if (user.sopQuota <= 0) {
              setError("No SOPs left in quota.");
              return false;
          }
          storageService.updateQuotas(user.id, 0, -1);
          onUserUpdate({ ...user, sopQuota: user.sopQuota - 1 });
          return true;
      }
      return true;
  };

  const handleGenerate = async () => {
    if (!topic) return;
    if (!checkQuota()) return;

    setIsGenerating(true);
    setError(null);
    try {
      if (!deductQuota()) {
          setIsGenerating(false);
          return;
      }
      const sop = await generateSOP(topic);
      setGeneratedSOP(sop);
    } catch (err: any) {
      setError(err.message || "Failed to generate SOP");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedSOP) {
      storageService.saveSOP(user.id, generatedSOP);
      loadSavedSOPs();
      setViewMode('saved');
      setGeneratedSOP(null);
      setTopic('');
    }
  };

  const openShareModal = (sop: SOP) => {
      setShareSOP(sop);
      setShareLink(`${window.location.origin}?viewSop=${sop.sop_id}`);
      setShareModalOpen(true);
      setCopySuccess(false);
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setViewMode('create')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'create' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Create SOP</button>
          <button onClick={() => setViewMode('saved')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'saved' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Saved Library</button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-full text-xs font-bold"><Wallet size={12}/> SOPs Left: {user.sopQuota}</div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        {viewMode === 'create' && (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><FileText className="text-blue-600" /> Standard Operating Procedure</h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SOP Topic</label>
                   <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Closing Checklist" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                 </div>
                 {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
                 <button onClick={handleGenerate} disabled={isGenerating || !topic} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90">
                   {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} Generate (1 Quota)
                 </button>
               </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
               {generatedSOP ? (
                 <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-8 border-b pb-4 dark:border-slate-800">
                       <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{generatedSOP.title}</h1>
                       <div className="flex gap-2">
                           <button onClick={() => openShareModal(generatedSOP)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                               <Link size={18} /> Share
                           </button>
                           <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                               <Save size={18} /> Save
                           </button>
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Scope & Prerequisites</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2"><strong>Scope:</strong> {generatedSOP.scope}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Prerequisites:</strong> {generatedSOP.prerequisites}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Procedure</h3>
                            <div className="space-y-2">
                                {Array.isArray(generatedSOP.stepwise_procedure) ? generatedSOP.stepwise_procedure.map((s,i)=>(
                                    <div key={i} className="flex gap-3 text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <span className="font-bold text-slate-400">{s.step_no}.</span>
                                        <div className="flex-1">
                                            <p className="text-slate-800 dark:text-slate-200 font-medium">{s.action}</p>
                                            <div className="flex gap-2 mt-1 text-xs text-slate-500">
                                                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{s.responsible_role}</span>
                                                {s.time_limit && <span className="flex items-center gap-1"><Clock size={10}/> {s.time_limit}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )) : <p className="text-slate-400 italic text-sm">No steps defined.</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm uppercase">Equipment</h3>
                                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
                                    {Array.isArray(generatedSOP.materials_equipment) ? generatedSOP.materials_equipment.map((m,i)=><li key={i}>{m}</li>) : <li>Standard equipment</li>}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm uppercase">KPIs</h3>
                                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
                                    {Array.isArray(generatedSOP.kpis) ? generatedSOP.kpis.map((k,i)=><li key={i}>{k}</li>) : <li>Operational metrics</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <BookOpen size={48} className="mb-4" />
                    <p>Standardize your operations</p>
                 </div>
               )}
            </div>
          </div>
        )}
        {viewMode === 'saved' && (
           <div className="p-6 h-full flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
                 {savedSOPs.map((sop, idx) => (
                     <div key={idx} className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer group transition-all shadow-sm hover:shadow-md">
                        <div onClick={() => {setGeneratedSOP(sop); setViewMode('create');}}>
                            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{sop.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{sop.scope}</p>
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                                    {Array.isArray(sop.stepwise_procedure) ? sop.stepwise_procedure.length : 0} Steps
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); openShareModal(sop); }}
                            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Share Link"
                        >
                            <Share2 size={16} />
                        </button>
                     </div>
                 ))}
                 {savedSOPs.length === 0 && (
                     <div className="col-span-full text-center py-12 text-slate-400 opacity-60 flex flex-col items-center">
                         <FileText size={48} className="mb-4" />
                         <p>No SOPs saved yet.</p>
                     </div>
                 )}
              </div>
           </div>
        )}
      </div>

      {shareModalOpen && shareSOP && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                  <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                              <Globe size={24} />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share SOP</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Make this document accessible to staff</p>
                          </div>
                      </div>
                      <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Public Link</p>
                          <div className="flex gap-2">
                              <input 
                                readOnly 
                                value={shareLink} 
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-600 dark:text-slate-300 truncate"
                              />
                              <button 
                                onClick={handleCopyLink}
                                className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 transition-colors"
                                title="Copy Link"
                              >
                                  {copySuccess ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Copy size={16} />}
                              </button>
                          </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
                          <div className="flex items-center gap-2">
                              <Lock size={16} className="text-slate-400" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password Protection</span>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                              <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                              <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
                          </div>
                      </div>

                      <div className="pt-2">
                          <button onClick={() => { alert('Sent to staff email list!'); setShareModalOpen(false); }} className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90">
                              <Mail size={16} /> Send to Kitchen Team
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Added PublicSOPViewer for public SOP access links
export const PublicSOPViewer: React.FC<{ sopId: string; onExit: () => void }> = ({ sopId, onExit }) => {
    const [sop, setSop] = useState<SOP | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const findSop = () => {
            // Scan through all localStorage keys for any saved SOPs to support public access links
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('bistro_') && key.endsWith('_saved_sops')) {
                    try {
                        const sops: SOP[] = JSON.parse(localStorage.getItem(key) || '[]');
                        const found = sops.find(s => s.sop_id === sopId);
                        if (found) return found;
                    } catch (e) {
                        console.error("Error searching public SOP:", e);
                    }
                }
            }
            return null;
        };

        setSop(findSop());
        setLoading(false);
    }, [sopId]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
    );

    if (!sop) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="text-amber-500 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">SOP Not Found</h1>
            <p className="text-slate-500 mb-6">This document may have been removed or the link is invalid.</p>
            <button onClick={onExit} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg">Return to App</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <nav className="border-b border-slate-200 py-4 px-6 bg-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Logo iconSize={24} />
                    <button onClick={onExit} className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2">
                         Exit Viewer
                    </button>
                </div>
            </nav>
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-black mb-2">{sop.title}</h1>
                    <p className="text-sm text-slate-500 mb-8 border-b pb-4">Standard Operating Procedure • Public Access</p>
                    
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Scope & Context</h3>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm"><strong>Scope:</strong> {sop.scope}</p>
                                <p className="text-sm mt-1"><strong>Prerequisites:</strong> {sop.prerequisites}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Step-wise Procedure</h3>
                            <div className="space-y-3">
                                {Array.isArray(sop.stepwise_procedure) && sop.stepwise_procedure.map((step, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">{step.step_no}</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800">{step.action}</p>
                                            <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                                                <span className="flex items-center gap-1"><UserIcon size={12}/> {step.responsible_role}</span>
                                                {step.time_limit && <span className="flex items-center gap-1"><Clock size={12}/> {step.time_limit}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Package size={14}/> Materials & Equipment
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                                    {Array.isArray(sop.materials_equipment) && sop.materials_equipment.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <h3 className="text-xs font-black text-emerald-600/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ListChecks size={14}/> Critical Control Points
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-800">
                                    {Array.isArray(sop.critical_control_points) && sop.critical_control_points.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="py-12 text-center text-slate-400 text-xs">
                 <p>© BistroIntelligence • Secured Operational Document</p>
            </footer>
        </div>
    );
};
