
import React, { useState, useEffect, useRef } from 'react';
import { User, MarketingRequest } from '../types';
import { generateMarketingVideo, generateMarketingImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Clapperboard, Image as ImageIcon, Loader2, PlayCircle, Download, Upload, History, X, Sparkles, AlertCircle, Timer } from 'lucide-react';

interface VideoStudioProps { user: User; }

export const VideoStudio: React.FC<VideoStudioProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<'create' | 'gallery'>('create');
  const [prompt, setPrompt] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<MarketingRequest | null>(null);
  const [history, setHistory] = useState<MarketingRequest[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { setHistory(storageService.getAllMarketingRequests().filter(r => r.userId === user.id).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())); }, [user.id]);

  const handleGenerate = async () => {
      if (!prompt && !referenceImage) return;
      
      // Mandatory API key check for Veo as per Gemini Guidelines
      if (mediaType === 'video') {
          const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
          if (!hasKey) {
              await (window as any).aistudio?.openSelectKey();
              // Guideline: Assume success and proceed
          }
      }

      setIsGenerating(true);
      setError(null);
      const messages = ["Connecting to BistroVision...", "Synthesizing frames...", "Applying neural lighting...", "Finalizing render..."];
      let i = 0; setLoadingMessage(messages[0]);
      const timer = setInterval(() => { i = (i + 1) % messages.length; setLoadingMessage(messages[i]); }, 10000);

      try {
          const url = mediaType === 'video' ? await generateMarketingVideo(referenceImage ? [referenceImage] : [], prompt, aspectRatio) : await generateMarketingImage(prompt, aspectRatio);
          const newReq: MarketingRequest = { id: `mkt_${Date.now()}`, userId: user.id, userName: user.name, type: mediaType, prompt, aspectRatio, status: 'completed', requestDate: new Date().toISOString(), outputUrl: url };
          storageService.saveMarketingRequest(newReq);
          setCurrentResult(newReq);
          setHistory(prev => [newReq, ...prev]);
      } catch (err: any) {
          setError(err.message || "Model Busy. Please try a simpler prompt.");
          if (err.message?.includes("entity was not found")) (window as any).aistudio?.openSelectKey();
      } finally { clearInterval(timer); setIsGenerating(false); }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
      <div className="flex gap-2">
        <button onClick={() => setViewMode('create')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'create' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}><Sparkles size={16} className="inline mr-2"/>Studio</button>
        <button onClick={() => setViewMode('gallery')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'gallery' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}><History size={16} className="inline mr-2"/>Vault</button>
      </div>

      {viewMode === 'create' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
              <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8">
                      <button onClick={() => setMediaType('video')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${mediaType === 'video' ? 'bg-white dark:bg-slate-700 shadow-md' : 'text-slate-500'}`}>Video</button>
                      <button onClick={() => setMediaType('image')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${mediaType === 'image' ? 'bg-white dark:bg-slate-700 shadow-md' : 'text-slate-500'}`}>Image</button>
                  </div>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your cinematic vision..." className="w-full p-4 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white text-sm h-32 mb-6" />
                  {mediaType === 'video' && (
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors mb-6">
                          {referenceImage ? <img src={referenceImage} className="h-24 mx-auto rounded-lg" /> : <Upload className="mx-auto text-slate-400" />}
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Start Frame (Optional)</p>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload=ev=>setReferenceImage(ev.target?.result as string); r.readAsDataURL(f); } }} />
                      </div>
                  )}
                  {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4 flex gap-2"><AlertCircle size={14}/>{error}</div>}
                  <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full py-4 bg-slate-950 dark:bg-emerald-600 text-white font-black rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-xl disabled:opacity-50">
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Initiate Render
                  </button>
              </div>
              <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                  {isGenerating ? (
                      <div className="text-center">
                          <div className="relative mb-6"><Loader2 size={80} className="animate-spin mx-auto text-emerald-500/20"/><Timer size={32} className="absolute inset-0 m-auto text-emerald-500 animate-pulse"/></div>
                          <p className="text-xl font-bold text-white uppercase tracking-tighter italic">Rendering Mastery...</p>
                          <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em]">{loadingMessage}</p>
                      </div>
                  ) : currentResult ? (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                          {currentResult.type === 'video' ? <video src={currentResult.outputUrl} controls autoPlay loop className="max-h-full" /> : <img src={currentResult.outputUrl} className="max-h-full" />}
                          <button onClick={() => { const a = document.createElement('a'); a.href=currentResult.outputUrl!; a.download='bistro-asset'; a.click(); }} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><Download size={24}/></button>
                      </div>
                  ) : (
                      <div className="text-center opacity-40"><PlayCircle size={64} className="text-white mx-auto mb-4"/><p className="text-sm text-white font-bold uppercase tracking-widest">Canvas Standby</p></div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
