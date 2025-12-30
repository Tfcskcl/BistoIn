
import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { 
    ArrowRight, CheckCircle2, TrendingUp, ChefHat, Zap, Star, 
    ShieldCheck, Building2, Play, Activity, 
    BarChart3, Lock, Search, Smartphone, 
    ScanFace, Eye, Server, Layers, Video, Cpu, Globe, Menu, X, MapPin, Phone, Mail, Brain, Shield, Rocket, Target, Zap as ZapIcon,
    ChevronDown, Info, MousePointer2, Footprints, Wallet, Receipt, LayoutGrid, MonitorDot, Calculator, ListChecks, PieChart, FlaskConical,
    UploadCloud, Network, Terminal
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onOpenLegal: (page: string) => void;
  onOpenEnterprise?: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onOpenLegal, onOpenEnterprise }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [uptime, setUptime] = useState(99.98);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const uptimeInterval = setInterval(() => {
        setUptime(99.98 + (Math.random() * 0.01));
    }, 5000);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        clearInterval(uptimeInterval);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden">
      
      {/* Neural Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]"></div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
          <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      </div>

      {/* Live System Status Bar */}
      <div className="relative z-[60] bg-emerald-500/10 border-b border-emerald-500/20 py-2 px-8 flex justify-center items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Live: {uptime.toFixed(3)}% Uptime
          </div>
          <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-emerald-600 uppercase">
              <span>Nodes Deployed: 124</span>
              <span>Active Audits: 8,421</span>
              <span>Latency: 42ms</span>
          </div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 border-b ${scrolled || mobileMenuOpen ? 'bg-slate-950/80 backdrop-blur-xl border-slate-800 py-3' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <Logo iconSize={30} light={true} />
          
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection('vision')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Vision AI</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Pricing & ROI</button>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex items-center gap-4">
                <button onClick={onGetStarted} className="text-sm font-bold text-slate-100 hover:text-emerald-400 transition-colors">Login</button>
                <button onClick={onGetStarted} className="px-6 py-2.5 bg-emerald-600 text-slate-950 text-sm font-black rounded-full hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                    Deploy OS
                </button>
            </div>
          </div>

          <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 px-8 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
                <Terminal size={12} className="mr-1" /> Autonomous Intelligence Node v2.5.0_LIVE
            </div>

            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-8 animate-fade-in-up">
              ELIMINATE WASTAGE.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 uppercase">Maximize Profit.</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up font-medium" style={{animationDelay: '100ms'}}>
                Stop manual monitoring. Our Neural OS audits your kitchen 24/7 via Vision AI, identifies leakage in seconds, and provides growth strategies that save high-volume brands ₹1 Lakh+/month.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <button onClick={onGetStarted} className="group relative px-10 py-5 bg-white text-slate-950 text-lg font-black rounded-full hover:bg-emerald-400 transition-all shadow-2xl hover:scale-105 flex items-center gap-3">
                    Activate Production Node
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </button>
                <button onClick={onOpenEnterprise} className="group px-10 py-5 bg-slate-900/50 backdrop-blur-xl text-white text-lg font-bold rounded-full border border-slate-800 hover:border-slate-600 transition-all flex items-center gap-3">
                    View Enterprise Case Study
                </button>
            </div>
        </div>
      </header>

      {/* The Vision Section */}
      <section id="vision" className="py-32 px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-8">
                      <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                          <Eye size={32} />
                      </div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase">Vision AI That <br/><span className="text-emerald-500">Never Sleeps.</span></h2>
                      <p className="text-slate-400 text-lg leading-relaxed font-medium">
                          Link your existing cameras directly to our neural pipeline. BistroVision audits every plate prepared, detects hygiene breaches, and monitors cash flow integrity with zero manual intervention.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] group hover:border-emerald-500/50 transition-all">
                              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Footprints size={18} className="text-emerald-500"/> Kinetic Pulse</h4>
                              <p className="text-sm text-slate-500">Analyze staff patterns to optimize kitchen throughput. Reduce collision by 35%.</p>
                          </div>
                          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] group hover:border-indigo-500/50 transition-all">
                              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Lock size={18} className="text-indigo-500"/> Integrity Shield</h4>
                              <p className="text-sm text-slate-500">Stop pilferage with visual proof. Monitor high-risk zones and cash handling instantly.</p>
                          </div>
                      </div>
                  </div>
                  <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                      <div className="relative glass rounded-[2.5rem] p-4 border border-slate-800 shadow-2xl overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80" className="w-full aspect-square object-cover rounded-3xl opacity-50 grayscale hover:grayscale-0 transition-all duration-700" />
                          <div className="absolute top-10 left-10 p-4 glass rounded-2xl border-emerald-500/30 backdrop-blur-md">
                              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase mb-1">
                                  <Activity size={12} className="animate-pulse"/> Processing
                              </div>
                              <p className="text-white font-bold text-xs uppercase">Hygiene Compliance OK</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* How it Works / The Process */}
      <section id="how-it-works" className="py-32 px-8 bg-slate-900/30">
          <div className="max-w-7xl mx-auto text-center mb-20">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">DEPLOYMENT TO REVENUE IN <span className="text-emerald-500">3 PHASES</span></h2>
              <p className="text-slate-500 text-lg">High-fidelity automation with a non-technical onboarding experience.</p>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="relative p-10 bg-slate-950 border border-slate-800 rounded-[2.5rem] group hover:border-emerald-500/50 transition-all shadow-2xl">
                  <div className="absolute -top-6 left-10 w-12 h-12 bg-emerald-600 text-slate-950 flex items-center justify-center font-black text-xl rounded-2xl shadow-xl">1</div>
                  <div className="mb-6 mt-4"><UploadCloud size={40} className="text-emerald-500" /></div>
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight">INGRESS DATA</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">Upload your current menu and supply invoices. Our AI Accountant digitizes every SKU and learns your cost patterns.</p>
              </div>
              <div className="relative p-10 bg-slate-950 border border-slate-800 rounded-[2.5rem] group hover:border-indigo-500/50 transition-all shadow-2xl">
                  <div className="absolute -top-6 left-10 w-12 h-12 bg-indigo-600 text-white flex items-center justify-center font-black text-xl rounded-2xl shadow-xl">2</div>
                  <div className="mb-6 mt-4"><Network size={40} className="text-indigo-500" /></div>
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight">CONNECT NODES</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">Sync your CCTV feeds via secure RTSP tunnels. AI begins auditing kitchen movement and hygiene breaches in real-time.</p>
              </div>
              <div className="relative p-10 bg-slate-950 border border-slate-800 rounded-[2.5rem] group hover:border-purple-500/50 transition-all shadow-2xl">
                  <div className="absolute -top-6 left-10 w-12 h-12 bg-purple-600 text-white flex items-center justify-center font-black text-xl rounded-2xl shadow-xl">3</div>
                  <div className="mb-6 mt-4"><TrendingUp size={40} className="text-purple-500" /></div>
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight">HARVEST ROI</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">Receive weekly strategy reports. Identify exactly where you are losing money and gain 10-15% more net margin instantly.</p>
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-8 relative">
          <div className="max-w-7xl mx-auto text-center mb-16">
              <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">PRODUCTION SCALE PLANS</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">Choose the operational scale that matches your current monthly revenue bracket.</p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="relative p-12 rounded-[3.5rem] bg-white text-slate-900 shadow-2xl border-4 border-transparent hover:border-emerald-500 transition-all active:scale-[0.98]">
                  <div className="absolute top-0 right-12 bg-emerald-500 text-white text-[10px] font-black px-6 py-2 rounded-b-2xl uppercase tracking-widest">Growth Tier</div>
                  <div className="mb-10">
                      <h3 className="text-4xl font-black uppercase tracking-tighter">Growth Hub</h3>
                      <p className="text-sm text-slate-500 font-bold mt-2">Revenue: ₹2L - ₹15L / Month</p>
                      <div className="mt-8 flex items-baseline gap-2">
                          <span className="text-6xl font-black tracking-tighter">₹9,999</span>
                          <span className="text-slate-400 font-bold uppercase text-[10px]">/ outlet / mo</span>
                      </div>
                  </div>
                  <div className="mb-8 p-6 bg-emerald-50 rounded-2xl flex items-center justify-between shadow-inner">
                      <div><p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Expected Savings</p><p className="text-2xl font-black text-emerald-600">₹30k - ₹50k</p></div>
                      <TrendingUp className="text-emerald-500" size={28} />
                  </div>
                  <ul className="space-y-4 mb-10">
                      {['SOP Monitoring', 'Inventory Leakage Analysis', 'Recipe Costing Intelligence', 'Marketing & Menu Performance'].map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle2 size={18} className="text-emerald-600 shrink-0"/> {f}</li>
                      ))}
                  </ul>
                  <button onClick={onGetStarted} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl">Initialize Growth Node</button>
              </div>

              <div className="relative p-12 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl border-4 border-indigo-500/30 active:scale-[0.98]">
                  <div className="absolute top-0 right-12 bg-indigo-500 text-white text-[10px] font-black px-6 py-2 rounded-b-2xl uppercase tracking-widest">Recommended</div>
                  <div className="mb-10">
                      <h3 className="text-4xl font-black uppercase tracking-tighter">Pro Intelligence</h3>
                      <p className="text-sm text-slate-400 font-bold mt-2">Revenue: Above ₹15L / Month</p>
                      <div className="mt-8 flex items-baseline gap-2">
                          <span className="text-6xl font-black tracking-tighter">₹24,999</span>
                          <span className="text-slate-500 font-bold uppercase text-[10px]">/ outlet / mo</span>
                      </div>
                  </div>
                  <div className="mb-8 p-6 bg-indigo-500/10 rounded-2xl flex items-center justify-between shadow-inner">
                      <div><p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Expected Savings</p><p className="text-2xl font-black text-indigo-400">₹30k - ₹1 Lakh</p></div>
                      <ZapIcon className="text-indigo-500" size={28} />
                  </div>
                  <ul className="space-y-4 mb-10">
                      {['Everything in Growth', 'CCTV Movement Analytics', 'Visual SOP Compliance', 'Weekly AI Strategy Reports', 'Profit Leakage Optimization'].map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle2 size={18} className="text-indigo-400 shrink-0"/> {f}</li>
                      ))}
                  </ul>
                  <button onClick={onGetStarted} className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all shadow-xl">Establish Pro Tunnel</button>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-32 px-8 z-10 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
              <div className="max-w-sm space-y-8">
                  <Logo iconSize={40} light={true} />
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      Building the future of autonomous F&B operations. Deploying production-scale intelligence to the physical edge.
                  </p>
                  <div className="flex gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl hover:bg-emerald-500/20 transition-colors cursor-pointer border border-slate-800"><Mail size={18} className="text-slate-400"/></div>
                      <div className="p-3 bg-slate-900 rounded-xl hover:bg-indigo-500/20 transition-colors cursor-pointer border border-slate-800"><Phone size={18} className="text-slate-400"/></div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-20 text-sm">
                  <div className="space-y-6">
                      <h4 className="font-black text-white uppercase tracking-[0.3em] text-[10px]">Neural Protocol</h4>
                      <ul className="space-y-4 text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                          <li><button onClick={() => onOpenLegal('terms')} className="hover:text-emerald-400 transition-colors">Terms of Service</button></li>
                          <li><button onClick={() => onOpenLegal('privacy')} className="hover:text-emerald-400 transition-colors">Privacy Policy</button></li>
                          <li><button onClick={() => onOpenLegal('refund')} className="hover:text-emerald-400 transition-colors">Billing Policy</button></li>
                      </ul>
                  </div>
                  <div className="space-y-6">
                      <h4 className="font-black text-white uppercase tracking-[0.3em] text-[10px]">Contact Command</h4>
                      <div className="space-y-6 text-slate-500 font-mono text-[11px] tracking-tight">
                          <p className="flex items-center gap-3"><Mail size={14} className="text-emerald-500"/> info@bistroconnect.in</p>
                          <p className="flex items-center gap-3"><Phone size={14} className="text-indigo-500"/> +91 63525 53515</p>
                          <p className="flex items-start gap-3"><MapPin size={14} className="mt-1 text-purple-500"/> Vadodara, IN</p>
                      </div>
                  </div>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">
              <p>© 2024 BISTROCONNECT_INTELLIGENCE // NODE_04_DEPLOYED</p>
              <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2"><Shield size={10}/> SECURED_BY_AES_256</span>
                  <span className="flex items-center gap-2"><Globe size={10}/> GLOBAL_NEURAL_CDN</span>
              </div>
          </div>
      </footer>
    </div>
  );
};
