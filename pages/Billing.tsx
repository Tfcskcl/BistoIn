
import React, { useState, useEffect } from 'react';
import { PlanType, User, PlanConfig } from '../types';
import { Check, Loader2, Wallet, Plus, Package, ShoppingBag, TrendingUp, IndianRupee, Zap, ShieldCheck, Sparkles, Building2, CreditCard, Lock, Shield, Globe } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { storageService } from '../services/storageService';
import { PACKAGES, PLANS as SYSTEM_PLANS } from '../constants';

interface BillingProps {
    user: User;
    onUpgrade: (plan: PlanType) => void;
}

export const Billing: React.FC<BillingProps> = ({ user, onUpgrade }) => {
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    setInvoices(storageService.getInvoices(user.id));
  }, [user.id]);

  const handlePlanAction = async (targetPlan: PlanType, price: number) => {
      setProcessingPlan(targetPlan);
      await paymentService.initiatePayment(
          user,
          targetPlan,
          price,
          (paymentId) => {
              storageService.addInvoice(user.id, {
                  id: paymentId,
                  date: new Date().toISOString(),
                  amount: price,
                  plan: targetPlan,
                  status: 'Paid',
                  period: 'Monthly'
              });
              
              onUpgrade(targetPlan);
              setProcessingPlan(null);
          },
          (error) => {
              if (!error.includes("cancelled")) alert(error);
              setProcessingPlan(null);
          }
      );
  };

  const handleBuyPackage = async (pkgId: string, pkgName: string, price: number, recipeQty: number, sopQty: number) => {
      setProcessingPackage(pkgId);
      await paymentService.initiatePayment(
          user,
          PlanType.FREE, 
          price,
          (paymentId) => {
              storageService.updateQuotas(user.id, recipeQty, sopQty);
              storageService.addInvoice(user.id, {
                  id: paymentId,
                  date: new Date().toISOString(),
                  amount: price,
                  plan: pkgName,
                  status: 'Paid',
                  period: 'One-time'
              });
              window.location.reload(); 
          },
          (error) => {
              if (!error.includes("cancelled")) alert(error);
              setProcessingPackage(null);
          }
      );
  };

  return (
    <div className="space-y-12 animate-fade-in relative pb-24 max-w-7xl mx-auto">
        <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <ShieldCheck size={12}/> Secure Production Node // Node_04
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">ROI & DEPLOYMENT SCALE</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg font-medium">Provision the intelligence capacity required for your operations. All plans include 24/7 Vision Monitoring.</p>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 min-w-[240px] shadow-sm group hover:border-emerald-500/50 transition-all">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-2"><Sparkles size={12}/> Recipe Quota</p>
                    <p className="text-5xl font-black text-slate-900 dark:text-white">{user.recipeQuota}</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 mt-2 uppercase font-bold tracking-widest">Active Artifacts</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 min-w-[240px] shadow-sm group hover:border-indigo-500/50 transition-all">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-2"><Check size={12}/> SOP Quota</p>
                    <p className="text-5xl font-black text-slate-900 dark:text-white">{user.sopQuota}</p>
                    <p className="text-[9px] text-indigo-600 dark:text-indigo-500 mt-2 uppercase font-bold tracking-widest">Protocol Envelopes</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-16 px-4">
            {/* GROWTH PLAN */}
            <div className="relative flex flex-col p-10 rounded-[3rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-8 py-2 rounded-bl-3xl uppercase tracking-widest">Growth Node</div>
                
                <div className="mb-10">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Growth Plan</h3>
                    <p className="text-sm text-slate-500 mt-2 font-bold">Revenue: ₹2L - ₹15L / Month</p>
                    <div className="mt-8 flex items-baseline gap-2">
                        <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">₹9,999</span>
                        <span className="text-slate-400 font-black uppercase text-xs">/ outlet / month</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold italic">* Exclusive of 18% GST</p>
                </div>

                <div className="mb-10 p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={24}/>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Monthly Value Estimate</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹30,000 - ₹50,000 <span className="text-xs opacity-60">Savings</span></p>
                </div>

                <ul className="flex-1 space-y-5 mb-12">
                    {SYSTEM_PLANS[PlanType.FREE].features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm font-bold text-slate-700 dark:text-slate-300">
                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mr-4 mt-0.5"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                            {feature}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={() => handlePlanAction(PlanType.FREE, 9999)}
                    disabled={user.plan === PlanType.FREE || processingPlan === PlanType.FREE}
                    className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-2xl disabled:opacity-50 active:scale-[0.98]"
                >
                    {processingPlan === PlanType.FREE ? <Loader2 className="animate-spin mx-auto" /> : user.plan === PlanType.FREE ? 'Current Active Node' : 'Deploy Growth Hub'}
                </button>
            </div>

            {/* PRO PLAN */}
            <div className="relative flex flex-col p-10 rounded-[3rem] bg-slate-900 text-white border-2 border-indigo-500/40 shadow-2xl overflow-hidden group hover:border-indigo-500 transition-all">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-8 py-2 rounded-bl-3xl uppercase tracking-widest">Recommended</div>
                
                <div className="mb-10">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Pro Intelligence</h3>
                    <p className="text-sm text-slate-400 mt-2 font-bold">Revenue: Above ₹15L / Month</p>
                    <div className="mt-8 flex items-baseline gap-2">
                        <span className="text-6xl font-black text-white tracking-tighter">₹24,999</span>
                        <span className="text-slate-500 font-black uppercase text-xs">/ outlet / month</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold italic">* Exclusive of 18% GST</p>
                </div>

                <div className="mb-10 p-8 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Zap className="text-indigo-400" size={24}/>
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Monthly Value Estimate</p>
                    </div>
                    <p className="text-3xl font-black text-indigo-400">₹30,000 - ₹1,00,000 <span className="text-xs opacity-60">Savings</span></p>
                </div>

                <ul className="flex-1 space-y-5 mb-12">
                    {SYSTEM_PLANS[PlanType.OPS_MANAGER].features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm font-bold text-slate-200">
                            <div className="p-1 bg-indigo-500/20 rounded-full mr-4 mt-0.5"><Check className="h-4 w-4 text-indigo-400" /></div>
                            {feature}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={() => handlePlanAction(PlanType.OPS_MANAGER, 24999)}
                    disabled={user.plan === PlanType.OPS_MANAGER || processingPlan === PlanType.OPS_MANAGER}
                    className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl shadow-indigo-900/50 disabled:opacity-50 active:scale-[0.98]"
                >
                    {processingPlan === PlanType.OPS_MANAGER ? <Loader2 className="animate-spin mx-auto" /> : user.plan === PlanType.OPS_MANAGER ? 'Current Active Node' : 'Establish Pro Tunnel'}
                </button>
            </div>
        </div>

        {/* Security & Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-12 py-12 border-y border-slate-200 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-3"><Lock size={20}/><p className="text-xs font-black uppercase tracking-widest">AES-256 SSL Secure</p></div>
            <div className="flex items-center gap-3"><Shield size={20}/><p className="text-xs font-black uppercase tracking-widest">Razorpay Verified</p></div>
            <div className="flex items-center gap-3"><Globe size={20}/><p className="text-xs font-black uppercase tracking-widest">Node Uptime 99.9%</p></div>
            <div className="flex items-center gap-3"><IndianRupee size={20}/><p className="text-xs font-black uppercase tracking-widest">GST Registered</p></div>
        </div>

        {/* Top-Up Section */}
        <div className="mt-24 pt-16 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <ShoppingBag className="text-purple-500"/> One-Time Power Packs
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Scale your artifact limits instantly for specific scaling events.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-center gap-10 group">
                    <div className="space-y-5 text-center md:text-left">
                        <div className="inline-flex px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Scale Up</div>
                        <h4 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tight">{PACKAGES.STARTER.name}</h4>
                        <div className="flex gap-2 justify-center md:justify-start">
                            <span className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-slate-100 dark:border-slate-700 text-slate-500 tracking-widest">+ {PACKAGES.STARTER.recipeQuota} Recipes</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium max-w-xs">{PACKAGES.STARTER.desc}</p>
                    </div>
                    <div className="text-center md:text-right shrink-0">
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">₹{PACKAGES.STARTER.price}</p>
                        <button 
                            onClick={() => handleBuyPackage(PACKAGES.STARTER.id, PACKAGES.STARTER.name, PACKAGES.STARTER.price, PACKAGES.STARTER.recipeQuota, PACKAGES.STARTER.sopQuota)} 
                            disabled={processingPackage === PACKAGES.STARTER.id} 
                            className="px-12 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl disabled:opacity-50"
                        >
                            {processingPackage === PACKAGES.STARTER.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-current" />} Purchase Pack
                        </button>
                    </div>
                </div>

                <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-center gap-10 group">
                    <div className="space-y-5 text-center md:text-left">
                        <div className="inline-flex px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Production Pack</div>
                        <h4 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tight">{PACKAGES.PAY_AS_YOU_GO.name}</h4>
                        <div className="flex gap-2 justify-center md:justify-start">
                            <span className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-slate-100 dark:border-slate-700 text-slate-500 tracking-widest">+ {PACKAGES.PAY_AS_YOU_GO.recipeQuota} Recipes</span>
                            <span className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-slate-100 dark:border-slate-700 text-slate-500 tracking-widest">+ {PACKAGES.PAY_AS_YOU_GO.sopQuota} SOPs</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium max-w-xs">{PACKAGES.PAY_AS_YOU_GO.desc}</p>
                    </div>
                    <div className="text-center md:text-right shrink-0">
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">₹{PACKAGES.PAY_AS_YOU_GO.price}</p>
                        <button 
                            onClick={() => handleBuyPackage(PACKAGES.PAY_AS_YOU_GO.id, PACKAGES.PAY_AS_YOU_GO.name, PACKAGES.PAY_AS_YOU_GO.price, PACKAGES.PAY_AS_YOU_GO.recipeQuota, PACKAGES.PAY_AS_YOU_GO.sopQuota)} 
                            disabled={processingPackage === PACKAGES.PAY_AS_YOU_GO.id} 
                            className="px-12 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl disabled:opacity-50"
                        >
                            {processingPackage === PACKAGES.PAY_AS_YOU_GO.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-current" />} Purchase Pack
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
