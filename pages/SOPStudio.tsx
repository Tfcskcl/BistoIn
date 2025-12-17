
import React, { useState, useEffect } from 'react';
import { User, SOP, SOPRequest, UserRole } from '../types';
import { generateSOP } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { FileText, Loader2, Sparkles, Save, Wallet, BookOpen, Share2, CheckCircle2, Clock, Link, Globe, Lock, Copy, X, Mail, Printer } from 'lucide-react';
import { Logo } from '../components/Logo';

interface SOPStudioProps {
  user: User;
  onUserUpdate?: (user: User) => void;
}

export const SOPStudio: React.FC<SOPStudioProps> = ({ user, onUserUpdate }) => {
  const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
  const [viewMode, setViewMode] = useState<'create' | 'saved' | 'requests'>('create');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSOP, setGeneratedSOP] = useState<SOP | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSOPs, setSavedSOPs] = useState<SOP[]>([]);
  
  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareSOP, setShareSOP] = useState<SOP | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadSavedSOPs();
  }, [user.id]);

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
      // Generate a demo link using current origin
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
          <button onClick={() => setViewMode('create')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'create' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Create SOP</button>
          <button onClick={() => setViewMode('saved')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'saved' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Saved Library</button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold"><Wallet size={12}/> SOPs Left: {user.sopQuota}</div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        {viewMode === 'create' && (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><FileText className="text-blue-600" /> Standard Operating Procedure</h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SOP Topic</label>
                   <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Closing Checklist" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:bg-slate-800 dark:text-white" />
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
                    <div className="flex justify-between items-start mb-8 border-b pb-4">
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
                    {/* Render SOP Details */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Scope & Prerequisites</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2"><strong>Scope:</strong> {generatedSOP.scope}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Prerequisites:</strong> {generatedSOP.prerequisites}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Procedure</h3>
                            <div className="space-y-2">
                                {generatedSOP.stepwise_procedure.map((s,i)=>(
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
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm uppercase">Equipment</h3>
                                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{generatedSOP.materials_equipment.map((m,i)=><li key={i}>{m}</li>)}</ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm uppercase">KPIs</h3>
                                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{generatedSOP.kpis.map((k,i)=><li key={i}>{k}</li>)}</ul>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                 {savedSOPs.map((sop, idx) => (
                     <div key={idx} className="relative bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer group transition-all shadow-sm hover:shadow-md">
                        <div onClick={() => {setGeneratedSOP(sop); setViewMode('create');}}>
                            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{sop.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{sop.scope}</p>
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">{sop.stepwise_procedure.length} Steps</span>
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
                     <div className="col-span-full text-center py-12 text-slate-400">
                         <p>No SOPs saved yet.</p>
                     </div>
                 )}
              </div>
           </div>
        )}
      </div>

      {/* Share Modal */}
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

// --- PUBLIC SOP VIEWER COMPONENT ---
export const PublicSOPViewer: React.FC<{ sopId: string, onExit: () => void }> = ({ sopId, onExit }) => {
    const [sop, setSop] = useState<SOP | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulation: Try to find in any accessible storage or use a mock
        // In a real app, this would fetch from an API endpoint by ID
        const mockFetch = () => {
            // Attempt to find in local storage (demo mode)
            let foundSop: SOP | undefined;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('saved_sops')) {
                    const sops = JSON.parse(localStorage.getItem(key) || '[]');
                    foundSop = sops.find((s: SOP) => s.sop_id === sopId);
                    if (foundSop) break;
                }
            }
            
            // If not found, return a dummy for demo purposes so the link works
            if (!foundSop) {
                foundSop = {
                    sop_id: sopId,
                    title: "Demo SOP: Opening Checklist",
                    scope: "Front of House",
                    prerequisites: "Uniform, Keys",
                    materials_equipment: ["POS", "Lights"],
                    stepwise_procedure: [
                        { step_no: 1, action: "Unlock main doors", responsible_role: "Manager" },
                        { step_no: 2, action: "Turn on lights and music", responsible_role: "Staff" }
                    ],
                    critical_control_points: [],
                    monitoring_checklist: [],
                    kpis: [],
                    quick_troubleshooting: ""
                };
            }
            setSop(foundSop);
            setLoading(false);
        };
        
        setTimeout(mockFetch, 800);
    }, [sopId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

    if (!sop) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">SOP Not Found</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="max-w-3xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <Logo iconSize={24} />
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-full shadow-sm">
                            <Printer size={20} />
                        </button>
                        <button onClick={onExit} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg">
                            Login
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0">
                    <div className="border-b border-slate-100 pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{sop.title}</h1>
                        <p className="text-slate-500 text-sm">Scope: {sop.scope}</p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="font-bold text-slate-900 mb-3 uppercase text-xs tracking-wider">Procedure</h3>
                            <div className="space-y-0">
                                {sop.stepwise_procedure.map((step, i) => (
                                    <div key={i} className="flex gap-4 p-3 border-b border-slate-50 last:border-0">
                                        <span className="font-bold text-slate-400 w-6">{step.step_no}.</span>
                                        <div className="flex-1">
                                            <p className="text-slate-800 font-medium">{step.action}</p>
                                            <span className="text-xs text-slate-400 mt-1 block">{step.responsible_role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {sop.materials_equipment.length > 0 && (
                            <div className="bg-slate-50 p-6 rounded-lg">
                                <h3 className="font-bold text-slate-900 mb-3 uppercase text-xs tracking-wider">Equipment Required</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                                    {sop.materials_equipment.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="text-center mt-8 text-slate-400 text-xs">
                    Powered by BistroIntelligence
                </div>
            </div>
        </div>
    );
};
