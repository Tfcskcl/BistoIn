
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Server, ShieldCheck, Activity, Globe, Lock, Database, Loader2, CheckCircle2, Wifi } from 'lucide-react';
import { Logo } from '../components/Logo';
import { User, UserRole, PlanType } from '../types';

interface EnterprisePortalProps {
    onBack: () => void;
    onLogin: (user: User) => void;
}

export const EnterprisePortal: React.FC<EnterprisePortalProps> = ({ onBack, onLogin }) => {
    const [step, setStep] = useState<'config' | 'auth'>('config');
    const [loading, setLoading] = useState(false);
    const [statusLogs, setStatusLogs] = useState<string[]>([]);
    
    // Form States
    const [gatewayUrl, setGatewayUrl] = useState('https://api.bistro.internal');
    const [orgId, setOrgId] = useState('CORP-8823-X');
    const [accessKey, setAccessKey] = useState('');
    
    // Status Simulation
    const [metrics, setMetrics] = useState({ latency: 45, uptime: 99.99, load: 32 });

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => ({
                latency: Math.max(20, Math.min(80, prev.latency + (Math.random() * 10 - 5))),
                uptime: 99.99,
                load: Math.max(10, Math.min(60, prev.load + (Math.random() * 5 - 2.5)))
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (msg: string) => setStatusLogs(prev => [...prev, msg]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatusLogs(['Initializing handshake...']);

        // Simulation Sequence
        setTimeout(() => addLog(`Resolving host: ${gatewayUrl}...`), 500);
        setTimeout(() => addLog('Host reachable (10.0.4.21). Verifying SSL...'), 1200);
        setTimeout(() => addLog('Certificate Valid: SHA-256 RSA.'), 2000);
        setTimeout(() => addLog('Authenticating Gateway Access Key...'), 2800);
        
        setTimeout(() => {
            setLoading(false);
            setStep('auth');
            setStatusLogs([]);
        }, 3500);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate SSO Login
        setTimeout(() => {
            const enterpriseUser: User = {
                id: 'ent_admin_01',
                name: 'Enterprise Admin',
                email: 'admin@corp-bistro.com',
                role: UserRole.ENTERPRISE,
                plan: PlanType.ENTERPRISE,
                restaurantName: 'Global Foods Corp',
                location: 'Central Command',
                cuisineType: 'Multi-Cuisine',
                joinedDate: new Date().toISOString(),
                setupComplete: true,
                recipeQuota: 9999,
                sopQuota: 9999,
                credits: 9999
            };
            onLogin(enterpriseUser);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-mono relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <Logo light={true} iconSize={24} />
                    <span className="h-6 w-px bg-slate-700 mx-2"></span>
                    <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase flex items-center gap-2">
                        <ShieldCheck size={14} /> Secure Gateway v2.4.0
                    </span>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${metrics.latency < 60 ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                        LATENCY: {metrics.latency.toFixed(0)}ms
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity size={14} />
                        LOAD: {metrics.load.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Lock size={14} />
                        AES-256 ENCRYPTED
                    </div>
                </div>
            </header>

            <main className="flex-1 relative z-10 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    {/* Console / Terminal Output */}
                    {loading && (
                        <div className="mb-6 bg-black/80 rounded-lg p-4 border border-slate-800 font-mono text-xs h-32 overflow-hidden shadow-2xl">
                            {statusLogs.map((log, i) => (
                                <div key={i} className="text-emerald-500/80 mb-1 flex gap-2">
                                    <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                    <span>{log}</span>
                                </div>
                            ))}
                            <div className="flex gap-2 text-emerald-500 animate-pulse">
                                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                <span>_</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 h-1"></div>
                        
                        <div className="p-8">
                            <div className="mb-8 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-inner">
                                    <Server size={32} className="text-emerald-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Enterprise Portal</h1>
                                <p className="text-sm text-slate-400">Connect to your Organization's Local Server</p>
                            </div>

                            {step === 'config' ? (
                                <form onSubmit={handleConnect} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Gateway URL</label>
                                        <div className="relative group">
                                            <Globe size={16} className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                            <input 
                                                type="text" 
                                                value={gatewayUrl}
                                                onChange={(e) => setGatewayUrl(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                                            />
                                            <div className="absolute right-3 top-2.5">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Organization ID</label>
                                        <div className="relative group">
                                            <Database size={16} className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                            <input 
                                                type="text" 
                                                value={orgId}
                                                onChange={(e) => setOrgId(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Access Key</label>
                                        <div className="relative group">
                                            <Lock size={16} className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                            <input 
                                                type="password" 
                                                value={accessKey}
                                                onChange={(e) => setAccessKey(e.target.value)}
                                                placeholder="••••••••••••••••"
                                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-900/20"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Wifi size={18} />}
                                        {loading ? 'Establishing Link...' : 'Establish Secure Connection'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                                    <div className="p-4 bg-emerald-900/20 border border-emerald-900/50 rounded-lg flex items-center gap-3">
                                        <CheckCircle2 size={20} className="text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-400">Connection Established</p>
                                            <p className="text-xs text-emerald-600/80">Tunnel ID: 8823-X-SECURE</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Corporate SSO ID</label>
                                        <input 
                                            type="text" 
                                            defaultValue="admin@corp-bistro.com"
                                            readOnly
                                            className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-lg px-4 py-2.5 outline-none font-mono text-sm cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
                                        <input 
                                            type="password" 
                                            autoFocus
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Login to Dashboard'}
                                    </button>
                                </form>
                            )}
                        </div>
                        
                        <div className="bg-slate-950 px-8 py-4 border-t border-slate-800 text-center">
                            <p className="text-[10px] text-slate-600">
                                RESTRICTED ACCESS. UNAUTHORIZED ATTEMPTS ARE LOGGED AND REPORTED.
                                <br />SYSTEM ID: BISTRO-ENT-NODE-01
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
