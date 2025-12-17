
import React, { useState, useEffect } from 'react';
import { PlanType, User, PlanConfig } from '../types';
import { Check, Loader2, Wallet, Plus, Package, ShoppingBag } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { storageService } from '../services/storageService';
import { PACKAGES } from '../constants';

interface BillingProps {
    user: User;
    onUpgrade: (plan: PlanType) => void;
}

export const Billing: React.FC<BillingProps> = ({ user, onUpgrade }) => {
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);
  const [currentPlans, setCurrentPlans] = useState<Record<PlanType, PlanConfig> | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    setCurrentPlans(storageService.getPlans());
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
              
              if (targetPlan !== PlanType.ENTERPRISE) {
                  onUpgrade(targetPlan);
                  // Ops Manager usually implies unlimited or high quota
                  if (targetPlan === PlanType.OPS_MANAGER) {
                      storageService.updateQuotas(user.id, 9999, 9999);
                  }
              } else {
                  alert("Enterprise request received. Our sales team will contact you shortly.");
              }
              setProcessingPlan(null);
          },
          (error) => {
              if (error !== "Payment process cancelled") alert(error);
              setProcessingPlan(null);
          }
      );
  };

  const handleBuyPackage = async (pkgId: string, pkgName: string, price: number, recipeQty: number, sopQty: number) => {
      setProcessingPackage(pkgId);
      await paymentService.initiatePayment(
          user,
          PlanType.FREE, // Using FREE type for one-time purchases
          price,
          (paymentId) => {
              // Add Quota
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
              if (error !== "Payment process cancelled") alert(error);
              setProcessingPackage(null);
          }
      );
  };

  if (!currentPlans) return <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline" /> Loading...</div>;

  return (
    <div className="space-y-12 animate-fade-in relative pb-16">
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Plans & Quotas</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Pay as you go or subscribe for unlimited access.</p>
            
            {/* Quota Wallet */}
            <div className="mt-6 flex justify-center gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 min-w-[150px]">
                    <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold uppercase mb-1">Recipe Quota</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{user.recipeQuota}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 min-w-[150px]">
                    <p className="text-xs text-blue-800 dark:text-blue-400 font-bold uppercase mb-1">SOP Quota</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{user.sopQuota}</p>
                </div>
            </div>
        </div>

        {/* Top-Up Packages */}
        <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <ShoppingBag className="text-purple-500"/> Instant Top-Ups
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Starter Pack */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{PACKAGES.STARTER.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">+ {PACKAGES.STARTER.recipeQuota} Recipes</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">{PACKAGES.STARTER.desc}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">₹{PACKAGES.STARTER.price}</p>
                        <button 
                            onClick={() => handleBuyPackage(PACKAGES.STARTER.id, PACKAGES.STARTER.name, PACKAGES.STARTER.price, PACKAGES.STARTER.recipeQuota, PACKAGES.STARTER.sopQuota)}
                            disabled={processingPackage === PACKAGES.STARTER.id}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                        >
                            {processingPackage === PACKAGES.STARTER.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Buy
                        </button>
                    </div>
                </div>

                {/* PAYG Pack */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{PACKAGES.PAY_AS_YOU_GO.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">+ {PACKAGES.PAY_AS_YOU_GO.recipeQuota} Recipes</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">+ {PACKAGES.PAY_AS_YOU_GO.sopQuota} SOP</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">{PACKAGES.PAY_AS_YOU_GO.desc}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">₹{PACKAGES.PAY_AS_YOU_GO.price}</p>
                        <button 
                            onClick={() => handleBuyPackage(PACKAGES.PAY_AS_YOU_GO.id, PACKAGES.PAY_AS_YOU_GO.name, PACKAGES.PAY_AS_YOU_GO.price, PACKAGES.PAY_AS_YOU_GO.recipeQuota, PACKAGES.PAY_AS_YOU_GO.sopQuota)}
                            disabled={processingPackage === PACKAGES.PAY_AS_YOU_GO.id}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                        >
                            {processingPackage === PACKAGES.PAY_AS_YOU_GO.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Buy
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 my-8"></div>

        {/* Subscription Plans */}
        <div className="max-w-7xl mx-auto">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">Monthly Subscriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Ops Manager */}
                <div className="relative flex flex-col p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold">Ops Manager</h3>
                        <p className="text-sm text-slate-400 mt-1">{currentPlans[PlanType.OPS_MANAGER].description}</p>
                        <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-black">₹{currentPlans[PlanType.OPS_MANAGER].price.toLocaleString()}</span>
                            <span className="ml-1 text-sm text-slate-400">/ mo</span>
                        </div>
                    </div>
                    <ul className="flex-1 space-y-4 mb-8">
                        {currentPlans[PlanType.OPS_MANAGER].features.map((feature, i) => (
                            <li key={i} className="flex items-start text-sm">
                                <Check className="h-5 w-5 text-emerald-400 shrink-0 mr-3" />
                                <span className="text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handlePlanAction(PlanType.OPS_MANAGER, currentPlans[PlanType.OPS_MANAGER].price)}
                        disabled={user.plan === PlanType.OPS_MANAGER || processingPlan === PlanType.OPS_MANAGER}
                        className="w-full py-4 rounded-xl font-bold text-slate-900 bg-white hover:bg-emerald-50 transition-colors"
                    >
                        {processingPlan === PlanType.OPS_MANAGER ? <Loader2 className="animate-spin mx-auto" /> : user.plan === PlanType.OPS_MANAGER ? 'Current Plan' : 'Subscribe Now'}
                    </button>
                </div>

                {/* Enterprise */}
                <div className="relative flex flex-col p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Enterprise Cluster</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentPlans[PlanType.ENTERPRISE].description}</p>
                        <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">₹{currentPlans[PlanType.ENTERPRISE].price.toLocaleString()}</span>
                            <span className="ml-1 text-sm text-slate-500">/ setup</span>
                        </div>
                    </div>
                    <ul className="flex-1 space-y-4 mb-8">
                        {currentPlans[PlanType.ENTERPRISE].features.map((feature, i) => (
                            <li key={i} className="flex items-start text-sm">
                                <Check className="h-5 w-5 text-yellow-500 shrink-0 mr-3" />
                                <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handlePlanAction(PlanType.ENTERPRISE, currentPlans[PlanType.ENTERPRISE].price)}
                        className="w-full py-4 rounded-xl font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
