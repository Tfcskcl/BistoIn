
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { RecipeHub } from './pages/RecipeHub';
import { SOPStudio } from './pages/SOPStudio';
import { Strategy } from './pages/Strategy';
import { VideoStudio } from './pages/VideoStudio';
import { Login } from './pages/Login';
import { Integrations } from './pages/Integrations';
import { Billing } from './pages/Billing';
import { Landing } from './pages/Landing';
import { KitchenWorkflow } from './pages/KitchenWorkflow';
import { MenuGenerator } from './pages/MenuGenerator';
import { InventoryManager } from './pages/InventoryManager'; 
import { CCTVAnalytics } from './pages/CCTVAnalytics';
import { Legal } from './pages/Legal';
import { EnterprisePortal } from './pages/EnterprisePortal';
import OnboardingWizard from './components/OnboardingWizard';
import { AppView, User } from './types';
import { authService } from './services/authService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [showLogin, setShowLogin] = useState(false);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | 'refund' | 'shipping' | null>(null);
  
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
      try {
          const stored = localStorage.getItem('theme');
          if (stored === 'dark' || stored === 'light') return stored;
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch { return 'light'; }
  });

  // Sync theme to DOM
  useEffect(() => {
      const root = window.document.documentElement;
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    return authService.subscribe((u) => setUser(u));
  }, []);

  const handleOnboardingComplete = async () => {
      if (user) {
          const updated = { ...user, setupComplete: true };
          await authService.updateUser(updated);
          setUser(updated);
      }
  };

  const handleLogin = (u: User) => {
      setUser(u);
      setShowLogin(false);
      setShowEnterprise(false);
  };

  // Priority Render: Legal Pages
  if (legalPage) {
      return <Legal docType={legalPage} onBack={() => setLegalPage(null)} />;
  }

  // Priority Render: Enterprise Portal
  if (showEnterprise) {
      return <EnterprisePortal onBack={() => setShowEnterprise(false)} onLogin={handleLogin} />;
  }

  if (!user && !showLogin) return <Landing onGetStarted={() => setShowLogin(true)} onOpenLegal={(page) => setLegalPage(page as any)} onOpenEnterprise={() => setShowEnterprise(true)} />;
  if (!user && showLogin) return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;

  if (user && !user.setupComplete) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} onExit={authService.logout} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex transition-colors ${theme}`}>
      <Sidebar currentView={currentView} onChangeView={setCurrentView} user={user!} onLogout={authService.logout} />
      <div className="flex-1 ml-64 flex flex-col">
        <Header 
            theme={theme} 
            toggleTheme={() => setTheme(t => t==='light'?'dark':'light')} 
            currentView={currentView} 
            onChangeView={setCurrentView}
            user={user!} 
        />
        <main className="p-8 flex-1 overflow-y-auto">
            {currentView === AppView.DASHBOARD && <Dashboard user={user!} onChangeView={setCurrentView} />}
            {currentView === AppView.CCTV_ANALYTICS && <CCTVAnalytics user={user!} />}
            {currentView === AppView.RECIPES && <RecipeHub user={user!} />}
            {currentView === AppView.INVENTORY && <InventoryManager user={user!} />}
            {currentView === AppView.MENU_GENERATOR && <MenuGenerator user={user!} />}
            {currentView === AppView.SOP && <SOPStudio user={user!} />}
            {currentView === AppView.STRATEGY && <Strategy user={user!} />}
            {currentView === AppView.KITCHEN_WORKFLOW && <KitchenWorkflow user={user!} />}
            {currentView === AppView.VIDEO && <VideoStudio user={user!} />}
            {currentView === AppView.INTEGRATIONS && <Integrations />}
            {currentView === AppView.BILLING && <Billing user={user!} onUpgrade={()=>{}} />}
        </main>
      </div>
    </div>
  );
}

export default App;
