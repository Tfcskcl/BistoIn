
import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { 
    ArrowRight, CheckCircle2, TrendingUp, ChefHat, Zap, Star, 
    ShieldCheck, Building2, Play, Activity, 
    BarChart3, Lock, Search, Smartphone, 
    ScanFace, Eye, Server, Layers, Video, Cpu, Globe, Menu, X, MapPin, Phone, Mail, Brain, Shield, Rocket, Target, Zap as ZapIcon
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onOpenLegal: (page: string) => void;
  onOpenEnterprise?: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onOpenLegal, onOpenEnterprise }) => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden">
      
      {/* Neural Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
          <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 border-b ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-slate-800 py-3' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <Logo iconSize={30} light={true} />
          
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => {}} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Vision AI</button>
            <button onClick={() => {}} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Neural OS</button>
            <button onClick={() => {}} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Enterprise</button>
            <div className="flex items-center gap-4">
                <button onClick={onGetStarted} className="text-sm font-bold text-slate-100 hover:text-emerald-400 transition-colors">Login</button>
                <button onClick={onGetStarted} className="px-6 py-2.5 bg-emerald-600 text-slate-950 text-sm font-black rounded-full hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                    Deploy OS
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 px-8 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="neural-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Autonomous Intelligence Node 04.1
            </div>

            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-8 animate-fade-in-up">
              THE NEURAL CORE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">OF RESTAURANTS.</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up" style={{animationDelay: '100ms'}}>
                Unified Multi-modal Vision AI that automates SOP auditing, dynamic costing, and strategic growth. The operating system for the next generation of F&B.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <button 
                    onClick={onGetStarted}
                    className="group relative px-10 py-5 bg-white text-slate-950 text-lg font-black rounded-full hover:bg-emerald-400 transition-all shadow-2xl hover:scale-105 flex items-center gap-3"
                >
                    Initialize System
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </button>
                
                <button 
                    onClick={onOpenEnterprise}
                    className="group px-10 py-5 bg-slate-900/50 backdrop-blur-xl text-white text-lg font-bold rounded-full border border-slate-800 hover:border-slate-600 transition-all flex items-center gap-3"
                >
                    Enterprise Gateway
                </button>
            </div>

            {/* Featured Interface Mockup */}
            <div className="mt-24 w-full max-w-6xl relative animate-fade-in-up" style={{animationDelay: '400ms'}}>
                <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                <div className="relative glass rounded-3xl p-4 border border-slate-800 shadow-2xl overflow-hidden group">
                    <div className="flex items-center gap-2 mb-4 px-4 py-2 border-b border-slate-800/50">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
                        </div>
                        <div className="flex-1 text-center font-mono text-[10px] text-slate-600 tracking-widest uppercase">
                            BISTRO_CONNECT // LIVE_NEURAL_MONITOR // DC-04
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 aspect-video">
                        <div className="col-span-8 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
                             <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000" />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                             
                             {/* AI Scanning Lines */}
                             <div className="absolute top-0 left-0 w-full h-px bg-emerald-500/40 shadow-[0_0_10px_#10b981] animate-[scan_4s_linear_infinite]"></div>
                             
                             <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">REC // LIVE</span>
                                <span className="glass px-2 py-0.5 text-white text-[9px] font-mono border border-white/10">STATION_03_CAM</span>
                             </div>
                             
                             <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                <div className="glass p-3 rounded-xl border-emerald-500/30">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Activity Detection</p>
                                    <div className="flex items-center gap-4">
                                        <div><p className="text-white font-bold text-xs">Chef // Prep</p><p className="text-[9px] text-slate-500">Confidence: 99.2%</p></div>
                                        <div className="h-8 w-px bg-slate-800"></div>
                                        <div><p className="text-white font-bold text-xs">SOP Compliance</p><p className="text-[9px] text-emerald-500">Authenticated</p></div>
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="col-span-4 flex flex-col gap-4">
                            <div className="flex-1 glass p-6 rounded-xl border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Logs</p>
                                <div className="space-y-4 font-mono text-[9px]">
                                    <div className="text-emerald-500/70">[10:42:01] // HANDWASH_DETECTED // STATION_1</div>
                                    <div className="text-slate-500">[10:42:15] // INVENTORY_SCAN // AVOCADO_STOCK_LOW</div>
                                    <div className="text-indigo-400">[10:43:02] // STRATEGY_ENGINE // OPTIMIZING_TAT</div>
                                    <div className="text-slate-500">[10:43:10] // VISION_PASS // HYGIENE_SCORE_100</div>
                                </div>
                            </div>
                            <div className="h-32 glass p-4 rounded-xl border-emerald-500/20">
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Efficiency Rating</p>
                                <div className="text-3xl font-black text-white">94.8%</div>
                                <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[94%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Arcis-Style Bento Solutions */}
      <section className="py-32 relative z-10 px-8">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                  <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">ENGINEERING <br/>OPERATIONAL EXCELLENCE.</h2>
                    <p className="text-slate-500 max-w-lg">We didn't build a management tool. We built an autonomous brain for your F&B empire.</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="p-4 glass rounded-2xl text-center min-w-[120px]">
                          <p className="text-2xl font-black text-white">24/7</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">Monitoring</p>
                      </div>
                      <div className="p-4 glass rounded-2xl text-center min-w-[120px]">
                          <p className="text-2xl font-black text-emerald-500">10ms</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">Latency</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Vision Card */}
                  <div className="md:col-span-2 glass p-10 rounded-[2.5rem] border border-slate-800 hover:border-emerald-500/50 transition-all group overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <Eye className="text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-black mb-4">STORE_PULSE VISION</h3>
                      <p className="text-slate-400 leading-relaxed mb-8">
                          Advanced computer vision that audits every dish prepared. It maps prep steps to your SOPs in real-time, ensuring flavor consistency and zero leakage.
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                          <Activity size={14}/> Live Feed Integration Available
                      </div>
                  </div>

                  {/* Costing Card */}
                  <div className="glass p-10 rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/50 transition-all group">
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:rotate-12 transition-transform">
                          <TrendingUp className="text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-black mb-4">DYNAMIC_COSTING</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                          AI-driven ingredient costing that reacts to market volatility. Automated technical sheets for every menu item.
                      </p>
                  </div>

                  {/* Strategy Card */}
                  <div className="glass p-10 rounded-[2.5rem] border border-slate-800 hover:border-purple-500/50 transition-all group">
                      <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 group-hover:-translate-y-2 transition-transform">
                          <Brain className="text-purple-500" />
                      </div>
                      <h3 className="text-xl font-black mb-4">STRATEGY_GEN</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                          Autonomous consultancy using market data, weather, and competition analysis to drive footfall.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-20 px-8 z-10 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
              <div className="max-w-xs space-y-6">
                  <Logo iconSize={32} light={true} />
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Deploying neural intelligence to the world's most complex physical industry. Building the future of autonomous F&B.
                  </p>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-full border border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer"></div>
                    <div className="w-10 h-10 bg-slate-900 rounded-full border border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer"></div>
                    <div className="w-10 h-10 bg-slate-900 rounded-full border border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer"></div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-16 text-sm">
                  <div className="space-y-4">
                      <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Protocol</h4>
                      <ul className="space-y-3 text-slate-500">
                          <li><button onClick={() => onOpenLegal('terms')} className="hover:text-emerald-400 transition-colors">Terms of Service</button></li>
                          <li><button onClick={() => onOpenLegal('privacy')} className="hover:text-emerald-400 transition-colors">Privacy Neural</button></li>
                          <li><button onClick={() => onOpenLegal('refund')} className="hover:text-emerald-400 transition-colors">Billing Policy</button></li>
                      </ul>
                  </div>
                  <div className="space-y-4">
                      <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Nexus</h4>
                      <ul className="space-y-3 text-slate-500">
                          <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                          <li><a href="#" className="hover:text-emerald-400 transition-colors">System Status</a></li>
                          <li><a href="#" className="hover:text-emerald-400 transition-colors">Open API</a></li>
                      </ul>
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-6">
                      <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Contact Hub</h4>
                      <div className="space-y-4 text-slate-500 font-mono text-[11px]">
                          <p className="flex items-center gap-3"><Mail size={14}/> info@bistroconnect.in</p>
                          <p className="flex items-center gap-3"><Phone size={14}/> +91 63525 53515</p>
                          <p className="flex items-start gap-3"><MapPin size={14} className="mt-1"/> VADODARA // IN</p>
                      </div>
                  </div>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-900 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <p>© 2024 BISTROCONNECT_INTELLIGENCE // NODE_SYSTEMS</p>
              <p>SECURED_BY_AES_256</p>
          </div>
      </footer>
    </div>
  );
};
