import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, ArrowLeft, Mail, Loader2, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { User, UserRole, PlanType } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { getFirebaseStatus } from '../services/firebase';
import { Logo } from '../components/Logo';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbStatus, setFbStatus] = useState(getFirebaseStatus());

  useEffect(() => {
    setFbStatus(getFirebaseStatus());
  }, []);

  const handleQuickLogin = async () => {
      setEmail('demo@bistroconnect.in');
      setPassword('12345678');
      setError(null);
      setLoading(true);
      try {
          const user = await authService.login('demo@bistroconnect.in', '12345678');
          storageService.seedDemoData(user.id);
          onLogin(user);
      } catch (err: any) {
          setError(err.message || 'Quick login failed');
          setLoading(false);
      }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
        const user = await authService.loginWithGoogle();
        // Seeding logic for specific demo accounts if needed
        const demoEmails = ['demo@bistroconnect.in', 'info@bistroconnect.in', 'amit@chef-hire.in'];
        if (demoEmails.includes(user.email.toLowerCase())) {
            storageService.seedDemoData(user.id);
        }
        onLogin(user);
    } catch (err: any) {
        setError(err.message || "Google Authentication failed");
    } finally {
        setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await authService.resetPassword(email);
        setSuccessMsg(`If an account exists for ${email}, you will receive a password reset link shortly.`);
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        const user = await authService.login(email, password);
        const demoEmails = ['demo@bistroconnect.in', 'info@bistroconnect.in', 'amit@chef-hire.in'];
        if (demoEmails.includes(user.email.toLowerCase())) {
            storageService.seedDemoData(user.id);
        }
        onLogin(user);
      } else if (mode === 'signup') {
        const newUser: User = {
          id: '', 
          name: name.trim(),
          email: email.trim(),
          role: UserRole.OWNER,
          plan: PlanType.FREE, 
          joinedDate: new Date().toISOString().split('T')[0],
          restaurantName: '', 
          location: '',
          cuisineType: '',
          isTrial: true,
          setupComplete: false, 
          queriesUsed: 0,
          queryLimit: 10,
          credits: 50,
          recipeQuota: 10,
          sopQuota: 5
        };
        const user = await authService.signup(newUser, password);
        onLogin(user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      if (mode !== 'forgot') setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans relative transition-colors duration-200">
      
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Back to Home
      </button>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in-up my-8">
        <div className="p-8 text-center bg-slate-900 dark:bg-slate-950 border-b border-slate-800 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-white/10">
                {fbStatus.configured ? (
                    <>
                        <ShieldCheck size={10} className="text-emerald-500" />
                        <span className="text-emerald-500">Auth Active</span>
                    </>
                ) : (
                    <>
                        <ShieldAlert size={10} className="text-amber-500" />
                        <span className="text-amber-500">Demo Mode</span>
                    </>
                )}
            </div>
            <div className="flex justify-center mb-6">
                <Logo light={true} iconSize={32} className="scale-125" />
            </div>
          <p className="text-slate-400 mt-2 text-sm">
            {mode === 'login' ? 'Sign in to access your dashboard' : 
             mode === 'signup' ? 'Create your account to get started' : 
             'Reset your password'}
          </p>
        </div>
        
        {mode === 'forgot' && successMsg ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Mail size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Check your inbox</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm leading-relaxed">{successMsg}</p>
            </div>
            <button 
              onClick={() => switchMode('login')}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
            >
                {googleLoading ? (
                    <Loader2 className="animate-spin text-emerald-500" size={20} />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z" fill="#EA4335"/>
                    </svg>
                )}
                {mode === 'signup' ? 'Signup with Google' : 'Login with Google'}
            </button>

            <div className="relative flex items-center justify-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">or continue with email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                      placeholder="John Doe"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                    placeholder="demo@bistroconnect.in"
                  />
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                      {mode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="space-y-3 pt-2">
                    <button 
                        type="submit" 
                        disabled={loading || googleLoading}
                        className="w-full py-3.5 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-700 active:transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                            <Loader2 className="animate-spin" size={18} /> Processing...
                            </>
                        ) : (
                            mode === 'login' ? 'Login' : 
                            mode === 'signup' ? 'Continue to Registration' : 
                            'Send Reset Link'
                        )} 
                        {!loading && (mode === 'forgot' ? <Mail size={18} /> : <ArrowRight size={18} />)}
                    </button>

                    {mode === 'login' && (
                        <button 
                            type="button"
                            onClick={handleQuickLogin}
                            disabled={loading || googleLoading}
                            className="w-full py-3 border-2 border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} /> Login with Demo Account
                        </button>
                    )}
                </div>
            </form>
          </div>
        )}

        <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            {mode === 'forgot' ? (
               <button 
                  onClick={() => switchMode('login')}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center justify-center gap-2 mx-auto"
               >
                  <ArrowLeft size={16} /> Back to Login
               </button>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"} 
                <button 
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} 
                    className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 transition-colors"
                >
                    {mode === 'login' ? 'Signup' : 'Login'}
                </button>
              </p>
            )}
        </div>
      </div>
    </div>
  );
};