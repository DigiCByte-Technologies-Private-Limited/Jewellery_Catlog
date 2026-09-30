import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions.api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Building2,
  Users,
  Gem,
  HardDrive,
  Calendar,
  Zap,
} from 'lucide-react';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<any>(null);

  // Queries
  const { data: currentResponse } = useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: async () => (await subscriptionsApi.getCurrent()).data?.data || null,
  });

  const { data: plansResponse } = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: async () => (await subscriptionsApi.getPlans()).data?.data || [],
  });

  // Upgrade Mutation
  const upgradeMutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.upgrade(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        type: 'success',
        title: 'Plan Upgraded',
        message: `${res.data?.message || 'Subscription successfully upgraded'}`,
      });
      setSelectedPlanToUpgrade(null);
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Upgrade Failed', message: err.response?.data?.message || 'Payment processing error' });
    },
  });

  const sub = currentResponse || {
    tenantName: 'Kalyan Heritage Jewellers (Flagship)',
    tier: 'PROFESSIONAL',
    status: 'ACTIVE',
    billingCycle: 'ANNUAL',
    pricePerCycle: 49999,
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    maxBranches: 5,
    currentBranches: 1,
    maxUsers: 25,
    currentUsers: 4,
    maxProducts: 10000,
    currentProducts: 24,
    storageQuotaGb: 50,
    enabledFeatures: [
      'Live Metal Rate Ticker',
      '12-Step Jewellery Calculator',
      'BIS Hallmark HUID Vault Tracking',
      'Karigar Metal Reconciliation Ledger',
      'Old Gold XRF Karatmeter Appraisal',
      'Advance Rate-Lock Contracts',
      'Bridal CRM & Occasion Alerts',
      'Automated Daily Backups',
    ],
    lastPaymentReference: 'INV-SUB-2026-9081',
    paymentMethod: 'NET_BANKING_HDFC',
  };

  const plans = plansResponse || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Showroom ERP Subscription & Licenses</h1>
          <p className="text-slate-500 text-sm">Multi-branch enterprise tier management, storage quotas, and feature activations</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              billingCycle === 'MONTHLY' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
              billingCycle === 'ANNUAL' ? 'bg-amber-600 text-white shadow' : 'text-slate-600'
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="w-72 h-72 text-amber-300" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="gold" className="text-xs uppercase tracking-wider font-bold">
                {sub.tier} EDITION
              </Badge>
              <Badge variant="success" className="text-xs font-semibold">
                {sub.status}
              </Badge>
            </div>

            <h2 className="text-2xl font-black text-white mt-2">{sub.tenantName}</h2>
            <p className="text-slate-300 text-xs mt-1">
              Active plan: ₹{Number(sub.pricePerCycle).toLocaleString('en-IN')} / {sub.billingCycle?.toLowerCase()}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 font-mono">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Expires: {new Date(sub.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ref: {sub.lastPaymentReference}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
              onClick={() => {
                const ent = plans.find((p: any) => p.tier === 'ENTERPRISE') || plans[2];
                setSelectedPlanToUpgrade(ent);
              }}
            >
              <Zap className="w-4 h-4 mr-1.5" /> Upgrade Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Quota Progress Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Branches */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-600" /> Showroom Outlets
              </span>
              <span className="font-mono text-slate-800">{sub.currentBranches} / {sub.maxBranches}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.round((sub.currentBranches / sub.maxBranches) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Multi-branch inventory locations</div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" /> Staff & Manager Seats
              </span>
              <span className="font-mono text-slate-800">{sub.currentUsers} / {sub.maxUsers}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.round((sub.currentUsers / sub.maxUsers) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Active logins with granular RBAC</div>
          </CardContent>
        </Card>

        {/* Catalog SKUs */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-amber-600" /> Catalog SKUs
              </span>
              <span className="font-mono text-slate-800">{sub.currentProducts} / {sub.maxProducts.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-amber-600 h-2 rounded-full"
                style={{ width: `${Math.max(2, Math.round((sub.currentProducts / sub.maxProducts) * 100))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Live designs & products indexed</div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-600" /> Media Storage Quota
              </span>
              <span className="font-mono text-slate-800">14.8 / {sub.storageQuotaGb} GB</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{ width: `${Math.round((14.8 / sub.storageQuotaGb) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">4K photos, 360 videos & lab PDFs</div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison Cards */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Available Jewellery Enterprise Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p: any) => {
            const isCurrent = sub.tier === p.tier;
            const price = billingCycle === 'ANNUAL' ? p.annualPrice : p.monthlyPrice;

            return (
              <div
                key={p.tier}
                className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                  <div className="mt-4 pb-4 border-b border-slate-100">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      ₹{Number(price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500"> / {billingCycle === 'ANNUAL' ? 'year' : 'month'}</span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Up to <strong>{p.maxBranches}</strong> physical showroom branch{p.maxBranches > 1 ? 'es' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>{p.maxUsers}</strong> staff and manager accounts</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>{Number(p.maxProducts).toLocaleString('en-IN')}</strong> catalog products & designs</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>{p.storageQuotaGb} GB</strong> high-speed CDN storage</span>
                    </li>

                    {p.features?.map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Currently Active
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setSelectedPlanToUpgrade(p)}
                    >
                      Switch to {p.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedPlanToUpgrade)}
        onClose={() => setSelectedPlanToUpgrade(null)}
        title={`Upgrade to ${selectedPlanToUpgrade?.name || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedPlanToUpgrade(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                upgradeMutation.mutate({
                  tier: selectedPlanToUpgrade.tier,
                  billingCycle,
                  paymentReference: `PAY-${Date.now().toString().slice(-6)}`,
                  paymentMethod: 'NET_BANKING_HDFC',
                });
              }}
              isLoading={upgradeMutation.isPending}
            >
              Confirm & Activate Upgrade
            </Button>
          </div>
        }
      >
        {selectedPlanToUpgrade && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-amber-950">Confirming Plan Migration:</div>
              <div className="flex justify-between">
                <span>Target Edition:</span>
                <span className="font-bold text-slate-900">{selectedPlanToUpgrade.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Period:</span>
                <span className="font-bold text-slate-900">{billingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Payable:</span>
                <span className="font-mono font-bold text-amber-900">
                  ₹{(billingCycle === 'ANNUAL' ? selectedPlanToUpgrade.annualPrice : selectedPlanToUpgrade.monthlyPrice).toLocaleString('en-IN')} + GST 18%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Your storage quota will be immediately updated to <strong>{selectedPlanToUpgrade.storageQuotaGb} GB</strong> and user seats will expand to <strong>{selectedPlanToUpgrade.maxUsers}</strong>.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
