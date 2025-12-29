
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { RecipeHub } from './pages/RecipeHub';
import { SOPStudio, PublicSOPViewer } from './pages/SOPStudio';
import { Strategy } from './pages/Strategy';
import { VideoStudio } from './pages/VideoStudio';
import { Login } from './pages/Login';
import { Integrations } from './pages/Integrations';
import { Billing } from './pages/Billing';
import { Landing } from './pages/Landing';
import { KitchenDesigning } from './pages/KitchenDesigning';
import { MenuGenerator } from './pages/MenuGenerator';
import { MenuEngineering } from './pages/MenuEngineering';
import { InventoryManager } from './pages/InventoryManager'; 
import { CCTVAnalytics } from './pages/CCTVAnalytics';
import { Legal } from './pages/Legal';
import { EnterprisePortal } from './pages/EnterprisePortal';
import OnboardingWizard from './components/OnboardingWizard';
import { AppView, User, SOP } from './types';
import { authService } from './services/authService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [showLogin, setShowLogin] = useState(false);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | 'refund' | 'shipping' | null>(null);
  const [publicSopId, setPublicSopId] = useState<string | null>(null);
  
  // State for navigating to specific items from other modules
  const [pendingSop, setPendingSop] = useState<SOP | null>(null);
  const [pendingStrategyQuery, setPendingStrategyQuery] = useState<string | null>(null);
  
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
    // Check for public share links
    const params = new URLSearchParams(window.location.search);
    const sopId = params.get('viewSop');
    if (sopId) {
        setPublicSopId(sopId);
    }

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

  const handleViewChange = (view: AppView, query?: string) => {
      setCurrentView(view);
      
      // Handle query passing for Strategy
      if (view === AppView.STRATEGY && query) {
          setPendingStrategyQuery(query);
      } else if (view !== AppView.STRATEGY) {
          setPendingStrategyQuery(null);
      }

      // Clear pending state when leaving the target view for SOP
      if (view !== AppView.SOP) setPendingSop(null);
  };

  // Priority Render: Public SOP Viewer (No Login Required)
  if (publicSopId) {
      return <PublicSOPViewer sopId={publicSopId} onExit={() => {
          setPublicSopId(null);
          // Clear URL param without reload
          window.history.pushState({}, '', window.location.pathname);
      }} />;
  }

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
      <Sidebar currentView={currentView} onChangeView={handleViewChange} user={user!} onLogout={authService.logout} />
      <div className="flex-1 ml-64 flex flex-col">
        <Header 
            theme={theme} 
            toggleTheme={() => setTheme(t => t==='light'?'dark':'light')} 
            currentView={currentView} 
            onChangeView={handleViewChange}
            user={user!} 
        />
        <main className="p-8 flex-1 overflow-y-auto">
            {currentView === AppView.DASHBOARD && <Dashboard user={user!} onChangeView={handleViewChange} />}
            {currentView === AppView.CCTV_ANALYTICS && (
                <CCTVAnalytics 
                    user={user!} 
                    onChangeView={handleViewChange} 
                    onActionSOP={(sop) => setPendingSop(sop)} 
                />
            )}
            {currentView === AppView.RECIPES && <RecipeHub user={user!} />}
            {currentView === AppView.INVENTORY && <InventoryManager user={user!} />}
            {currentView === AppView.MENU_GENERATOR && <MenuGenerator user={user!} />}
            {currentView === AppView.MENU_ENGINEERING && (
                <MenuEngineering 
                    user={user!} 
                    onStrategize={(q) => handleViewChange(AppView.STRATEGY, q)}
                />
            )}
            {currentView === AppView.SOP && <SOPStudio user={user!} initialSop={pendingSop} />}
            {currentView === AppView.STRATEGY && (
                <Strategy 
                    user={user!} 
                    initialQuery={pendingStrategyQuery} 
                    onQueryConsumed={() => setPendingStrategyQuery(null)}
                />
            )}
            {currentView === AppView.KITCHEN_DESIGNING && <KitchenDesigning user={user!} />}
            {currentView === AppView.VIDEO && <VideoStudio user={user!} />}
            {currentView === AppView.INTEGRATIONS && <Integrations />}
            {currentView === AppView.BILLING && <Billing user={user!} onUpgrade={()=>{}} />}
        </main>
      </div>
    </div>
  );
}

export default App;
