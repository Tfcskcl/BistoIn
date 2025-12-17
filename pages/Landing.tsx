
import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { 
    ArrowRight, CheckCircle2, TrendingUp, ChefHat, Zap, Star, 
    ShieldCheck, Building2, Play, Activity, 
    BarChart3, Lock, Search, MousePointer2, Smartphone, 
    ScanFace, Eye, Server, Layers, Video, Cpu, Globe, Menu, X, MapPin, Phone, Mail
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onOpenLegal: (page: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onOpenLegal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Tech Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[500px] w-[500px] rounded-full bg-emerald-500 opacity-[0.03] blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${scrolled || mobileMenuOpen ? 'bg-white/95 backdrop-blur-md border-slate-200 py-3' : 'bg-transparent border-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo iconSize={28} light={false} />
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 md:gap-8">
            <div className="flex gap-6 text-sm font-semibold text-slate-600">
                <a href="#features" className="hover:text-black transition-colors">Platform</a>
                <a href="#solutions" className="hover:text-black transition-colors">Solutions</a>
                <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onGetStarted}
                    className="text-sm font-bold text-slate-700 hover:text-black transition-colors px-3 py-2"
                >
                    Login
                </button>
                <button 
                    onClick={onGetStarted}
                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 group"
                >
                    Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-xl animate-fade-in-up">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-600 py-2 border-b border-slate-100">Platform</a>
                <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-600 py-2 border-b border-slate-100">Solutions</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-600 py-2 border-b border-slate-100">Pricing</a>
                <div className="flex flex-col gap-3 mt-2">
                    <button onClick={onGetStarted} className="w-full py-3 text-center font-bold text-slate-700 bg-slate-100 rounded-lg">Login</button>
                    <button onClick={onGetStarted} className="w-full py-3 text-center font-bold text-white bg-slate-900 rounded-lg">Get Started</button>
                </div>
            </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Hero Copy */}
            <div className="animate-fade-in-up relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    BistroOS v2.0 Live
                </div>

                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900 mb-6">
                  The OS that runs your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Restaurant</span>.
                </h1>

                <p className="text-lg text-slate-500 max-w-lg mb-8 leading-relaxed">
                    Connect your CCTV, POS, and Inventory into one <strong>AI Brain</strong>. We track SOP compliance, automate costing, and optimize workflows in real-time.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onGetStarted}
                        className="group relative px-8 py-4 bg-slate-900 text-white text-base font-bold rounded-xl hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col items-start min-w-[200px]"
                    >
                        <div className="flex items-center gap-2 w-full justify-between">
                            <span>Restaurant Owner</span>
                            <ArrowRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform"/>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal mt-1">Single or Multi-Outlet SaaS</span>
                    </button>
                    
                    <button 
                        onClick={() => alert("Please contact sales@bistroconnect.in for Enterprise On-Premise setup.")}
                        className="group relative px-8 py-4 bg-white text-slate-800 text-base font-bold rounded-xl border border-slate-200 hover:border-slate-400 transition-all flex flex-col items-start min-w-[200px]"
                    >
                        <div className="flex items-center gap-2 w-full justify-between">
                            <span>Enterprise Portal</span>
                            <Building2 size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors"/>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal mt-1">Offline Server & Custom API</span>
                    </button>
                </div>

                <div className="mt-8 flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><Cpu size={14} className="text-emerald-500"/> AI Powered</span>
                    <span className="flex items-center gap-1"><Lock size={14} className="text-emerald-500"/> Encrypted</span>
                    <span className="flex items-center gap-1"><Globe size={14} className="text-emerald-500"/> Cloud + Edge</span>
                </div>
            </div>

            {/* Hero Visual - Tech Dashboard */}
            <div className="relative hidden lg:block perspective-1000 group">
                {/* Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full"></div>
                
                {/* Main Dashboard Interface */}
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 transform rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-y-[0deg] group-hover:rotate-x-[0deg] transition-transform duration-700 ease-out p-2">
                    
                    {/* Fake Browser Bar */}
                    <div className="bg-slate-50 border-b border-slate-100 rounded-t-xl px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="bg-white border border-slate-200 rounded-md px-3 py-0.5 text-[10px] text-slate-400 font-mono inline-flex items-center gap-1">
                                <Lock size={8}/> app.bistroconnect.in/live-monitor
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="bg-slate-50 p-4 grid grid-cols-12 gap-3 h-[400px]">
                        {/* Sidebar */}
                        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-2 flex flex-col gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white mb-2"><Activity size={16}/></div>
                            {[1,2,3,4].map(i => <div key={i} className="w-full h-8 rounded-md bg-slate-100"></div>)}
                        </div>

                        {/* Main Feed */}
                        <div className="col-span-7 flex flex-col gap-3">
                            <div className="flex-1 bg-black rounded-xl border border-slate-800 relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover opacity-60" alt="Kitchen" />
                                {/* AI Overlay */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
                                    <span className="bg-black/50 text-white text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/20">CAM-01</span>
                                </div>
                                <div className="absolute bottom-4 right-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 text-white text-[10px] px-2 py-1 rounded">
                                    Productivity: 94%
                                </div>
                                {/* Bounding Box */}
                                <div className="absolute top-1/4 left-1/3 w-16 h-24 border border-emerald-400 rounded-sm flex items-start justify-center">
                                    <span className="bg-emerald-500 text-black text-[6px] font-bold px-1 uppercase">Chef</span>
                                </div>
                            </div>
                            <div className="h-24 bg-white rounded-xl border border-slate-200 p-3 flex gap-3">
                                <div className="flex-1 bg-emerald-50 rounded border border-emerald-100 p-2">
                                    <div className="text-[8px] uppercase text-emerald-600 font-bold">Food Cost</div>
                                    <div className="text-lg font-bold text-slate-800">28%</div>
                                </div>
                                <div className="flex-1 bg-blue-50 rounded border border-blue-100 p-2">
                                    <div className="text-[8px] uppercase text-blue-600 font-bold">Orders</div>
                                    <div className="text-lg font-bold text-slate-800">142</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="col-span-3 flex flex-col gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 flex-1">
                                <div className="text-[8px] uppercase text-slate-400 font-bold mb-2">Alerts</div>
                                <div className="flex flex-col gap-2">
                                    <div className="p-2 bg-red-50 border border-red-100 rounded text-[8px] text-red-700">
                                        <strong>SOP Breach</strong><br/>Handwash missed
                                    </div>
                                    <div className="p-2 bg-yellow-50 border border-yellow-100 rounded text-[8px] text-yellow-700">
                                        <strong>Stock Low</strong><br/>Truffle Oil
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -left-10 bottom-20 bg-white p-3 rounded-lg shadow-xl border border-slate-100 animate-float flex items-center gap-3" style={{animationDelay: '1s'}}>
                    <div className="bg-green-100 p-1.5 rounded-md text-green-600"><CheckCircle2 size={16}/></div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-900">Recipe Optimized</div>
                        <div className="text-[8px] text-slate-500">Saved ₹12/plate</div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Integration Marquee */}
      <section className="py-8 bg-slate-50 border-y border-slate-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Powering Modern Kitchens With</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex items-center gap-2 font-bold text-slate-600 text-lg"><Server size={20}/> Petpooja</div>
                  <div className="flex items-center gap-2 font-bold text-slate-600 text-lg"><Activity size={20}/> Posist</div>
                  <div className="flex items-center gap-2 font-bold text-slate-600 text-lg"><Layers size={20}/> UrbanPiper</div>
                  <div className="flex items-center gap-2 font-bold text-slate-600 text-lg"><Eye size={20}/> EZVIZ</div>
                  <div className="flex items-center gap-2 font-bold text-slate-600 text-lg"><Video size={20}/> Hikvision</div>
              </div>
          </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">One OS. Infinite Intelligence.</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">Replace 5 fragmented tools with one integrated system.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
                  
                  {/* Feature 1: CCTV (Large) */}
                  <div className="md:col-span-2 md:row-span-2 bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden group border border-slate-800">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 border border-slate-700">
                                  <Eye className="text-emerald-400" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2">StorePulse CCTV AI</h3>
                              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                                  Connect existing cameras (EZVIZ, Hikvision). Our AI watches 24/7 to track SOP compliance, measure prep times, and detect hygiene violations automatically.
                              </p>
                          </div>
                          
                          {/* Visual */}
                          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-4 transform translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                              <div className="flex gap-2 mb-3">
                                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-mono">VIOLATION_DETECTED</span>
                                  <span className="text-[10px] text-slate-500 font-mono">10:42 AM • Station 3</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 w-2/3"></div>
                              </div>
                              <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                                  <span>Efficiency Score</span>
                                  <span className="text-white font-bold">88/100</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Feature 2: Recipe Costing */}
                  <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 relative group overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-200 rounded-full blur-2xl opacity-50"></div>
                      <div className="relative z-10">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                              <ChefHat className="text-emerald-600" size={20} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Recipe Engineer</h3>
                          <p className="text-sm text-slate-600">Dynamic costing cards that update with market prices. Standardize flavor & margin.</p>
                      </div>
                  </div>

                  {/* Feature 3: SOP */}
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative group overflow-hidden hover:border-slate-300 transition-colors">
                      <div className="relative z-10">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                              <ShieldCheck className="text-slate-600" size={20} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Auto-SOPs</h3>
                          <p className="text-sm text-slate-600">Upload a video of a task. AI generates the step-by-step checklist instantly.</p>
                      </div>
                  </div>

              </div>
          </div>
      </section>

      {/* Solutions / Pricing */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-black text-slate-900">Choose your Intelligence Level</h2>
                  <p className="text-slate-500 mt-2">Dynamic pricing based on your growth stage.</p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                  {/* Setup */}
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow flex flex-col">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4"><Zap size={20} className="text-slate-600"/></div>
                      <h3 className="font-bold text-lg mb-1">Starter Setup</h3>
                      <div className="text-3xl font-black mb-4">₹99 <span className="text-xs font-medium text-slate-400">/ one-time</span></div>
                      <p className="text-xs text-slate-500 mb-6 flex-1">Database initialization and first 3 recipes.</p>
                      <button onClick={onGetStarted} className="w-full py-2 border border-slate-200 rounded-lg font-bold text-sm hover:bg-slate-50 text-slate-700">Get Started</button>
                  </div>

                  {/* Credits */}
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow flex flex-col">
                      <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4"><Star size={20} className="text-blue-600"/></div>
                      <h3 className="font-bold text-lg mb-1">Pay-As-You-Go</h3>
                      <div className="text-3xl font-black mb-4">₹99 <span className="text-xs font-medium text-slate-400">/ credit</span></div>
                      <ul className="text-xs text-slate-500 mb-6 space-y-2 flex-1">
                          <li className="flex gap-2"><CheckCircle2 size={12} className="text-blue-500"/> 1 Credit = 1 Smart Recipe</li>
                          <li className="flex gap-2"><CheckCircle2 size={12} className="text-blue-500"/> 5 Credits = 1 AI SOP</li>
                      </ul>
                      <button onClick={onGetStarted} className="w-full py-2 border border-slate-200 rounded-lg font-bold text-sm hover:bg-slate-50 text-slate-700">Buy Credits</button>
                  </div>

                  {/* Ops Manager (Hero) */}
                  <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden transform md:-translate-y-4 flex flex-col">
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">Best Value</div>
                      <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center mb-4"><Eye size={20} className="text-emerald-400"/></div>
                      <h3 className="font-bold text-lg mb-1">Ops Manager</h3>
                      <div className="text-3xl font-black mb-4">₹24,999 <span className="text-xs font-medium text-slate-400">/ mo</span></div>
                      <p className="text-xs text-slate-400 mb-6 border-b border-slate-800 pb-4">Full CCTV Intelligence & Workflow Automation.</p>
                      <ul className="text-xs text-slate-300 mb-8 space-y-2 flex-1">
                          <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400"/> 24/7 CCTV AI Monitoring</li>
                          <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400"/> Real-time Wastage Alerts</li>
                          <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400"/> Staff Productivity Scoring</li>
                      </ul>
                      <button onClick={onGetStarted} className="w-full py-3 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">Start Trial</button>
                  </div>

                  {/* Enterprise */}
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow flex flex-col">
                      <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4"><Building2 size={20} className="text-purple-600"/></div>
                      <h3 className="font-bold text-lg mb-1">Enterprise</h3>
                      <div className="text-3xl font-black mb-4">₹1.5L <span className="text-xs font-medium text-slate-400">/ 5 outlets</span></div>
                      <p className="text-xs text-slate-500 mb-6 flex-1">For multi-chain brands requiring local server setup & offline mode.</p>
                      <button onClick={() => alert("Redirecting to Enterprise Portal setup...")} className="w-full py-2 border border-slate-200 rounded-lg font-bold text-sm hover:bg-slate-50 text-slate-700">Contact Sales</button>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 text-sm">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
                  
                  {/* Brand & Address */}
                  <div className="md:col-span-5 space-y-6">
                      <Logo iconSize={32} light={false} />
                      <div className="space-y-4 text-slate-500">
                          <p className="flex items-start gap-3">
                              <MapPin className="shrink-0 mt-1 text-emerald-600" size={18} />
                              <span>
                                  <strong>Bistro Connect</strong><br/>
                                  410 Divya Plaza, Opp. Kamalanagar Lake<br/>
                                  Ajwa Road, Vadodara, Gujarat 390019
                              </span>
                          </p>
                          <p className="flex items-center gap-3">
                              <Phone className="shrink-0 text-emerald-600" size={18} />
                              <span>+91 63525 53515</span>
                          </p>
                          <p className="flex items-center gap-3">
                              <Mail className="shrink-0 text-emerald-600" size={18} />
                              <span>info@bistroconnect.in</span>
                          </p>
                      </div>
                      <div className="pt-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                              A part of TFCS KITCHEN SOLUTIONS LTD.
                          </p>
                      </div>
                  </div>

                  {/* Links */}
                  <div className="md:col-span-3">
                      <h4 className="font-bold text-slate-900 mb-6">Legal & Policy</h4>
                      <ul className="space-y-4 text-slate-500">
                          <li><button onClick={() => onOpenLegal('terms')} className="hover:text-emerald-600 transition-colors text-left">Terms & Conditions</button></li>
                          <li><button onClick={() => onOpenLegal('privacy')} className="hover:text-emerald-600 transition-colors text-left">Privacy Policy</button></li>
                          <li><button onClick={() => onOpenLegal('refund')} className="hover:text-emerald-600 transition-colors text-left">Refund & Cancellation</button></li>
                          <li><button onClick={() => onOpenLegal('shipping')} className="hover:text-emerald-600 transition-colors text-left">Shipping Policy</button></li>
                      </ul>
                  </div>

                  <div className="md:col-span-4">
                      <h4 className="font-bold text-slate-900 mb-6">Stay Updated</h4>
                      <p className="text-slate-500 mb-4">Subscribe to our newsletter for F&B insights.</p>
                      <div className="flex gap-2">
                          <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500"/>
                          <button className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors">Join</button>
                      </div>
                  </div>
              </div>

              <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
                  <p>© 2024 BistroIntelligence. All rights reserved.</p>
                  <div className="flex gap-6">
                      {/* Social Icons Placeholders */}
                      <a href="#" className="hover:text-slate-900 transition-colors"><div className="w-5 h-5 bg-current rounded-full"></div></a>
                      <a href="#" className="hover:text-slate-900 transition-colors"><div className="w-5 h-5 bg-current rounded-full"></div></a>
                      <a href="#" className="hover:text-slate-900 transition-colors"><div className="w-5 h-5 bg-current rounded-full"></div></a>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};
