
import React from 'react';
import { LayoutDashboard, ChefHat, FileText, TrendingUp, Database, CreditCard, LogOut, Clapperboard, RefreshCw, GitMerge, BookOpen, Package, Camera } from 'lucide-react';
import { AppView, User, PlanType, UserRole } from '../types';
import { Logo } from './Logo';
import { storageService } from '../services/storageService';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user: User;
  onLogout: () => void;
}

interface MenuItem {
    id: AppView;
    label: string;
    icon: React.ElementType;
    requiredPlan?: PlanType;
    allowedRoles?: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user, onLogout }) => {
  const menuItems: MenuItem[] = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.INVENTORY, label: 'Inventory Manager', icon: Package, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.RECIPES, label: 'Recipe & Costing', icon: ChefHat, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.MENU_GENERATOR, label: 'Menu Generator', icon: BookOpen, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.SOP, label: 'SOP Studio', icon: FileText, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.CCTV_ANALYTICS, label: 'Staff Movement', icon: Camera, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.KITCHEN_WORKFLOW, label: 'Kitchen Workflow', icon: GitMerge, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.VIDEO, label: 'Marketing Studio', icon: Clapperboard, allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: AppView.STRATEGY, label: 'Strategy AI', icon: TrendingUp, allowedRoles: [UserRole.OWNER, UserRole.SUPER_ADMIN] },
    { id: AppView.INTEGRATIONS, label: 'Data & Integrations', icon: Database, allowedRoles: [UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { id: AppView.BILLING, label: 'Plans & Billing', icon: CreditCard, allowedRoles: [UserRole.OWNER] },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="dark:hidden">
            <Logo light={false} iconSize={24} />
        </div>
        <div className="hidden dark:block">
            <Logo light={true} iconSize={24} />
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          if (item.allowedRoles && !item.allowedRoles.includes(user.role)) {
              return null;
          }

          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/50' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="px-4 py-3 rounded-lg mb-2 border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                <span className="text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 px-1.5 rounded text-slate-600 dark:text-slate-300">{user.role.replace('_', ' ')}</span>
            </div>
            <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Recipes Left:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{user.recipeQuota}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">SOPs Left:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{user.sopQuota}</span>
                </div>
            </div>
        </div>
        
        <button 
            onClick={() => {
                if (window.confirm("Start Fresh? This will clear all data and reset the application state.")) {
                    storageService.clearAllData();
                }
            }}
            className="flex items-center gap-3 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-4 py-2 w-full transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw size={18} />
          <span className="text-sm">Start Fresh</span>
        </button>

        <button onClick={onLogout} className="flex items-center gap-3 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-4 py-2 w-full transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
