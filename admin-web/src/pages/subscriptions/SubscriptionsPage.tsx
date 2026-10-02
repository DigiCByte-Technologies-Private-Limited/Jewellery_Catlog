import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions.api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
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
  Crown,
  FileText,
  Printer,
  Search,
  Receipt,
  Percent,
} from 'lucide-react';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'erp' | 'b2b' | 'invoices'>('erp');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<any>(null);

  // B2B Modal & Filter States
  const [selectedB2BPartner, setSelectedB2BPartner] = useState<any>(null);
  const [b2bTierForm, setB2bTierForm] = useState({
    tier: 'GOLD_B2B_PREMIUM',
    paymentReference: '',
    paymentMethod: 'RTGS_TRANSFER',
  });
  const [b2bSearch, setB2bSearch] = useState('');
  const [b2bTierFilter, setB2bTierFilter] = useState('');

  // Invoice Inspection Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // ─── QUERIES ──────────────────────────────────────────────────────────────
  const { data: currentResponse } = useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: async () => (await subscriptionsApi.getCurrent()).data?.data || null,
  });

  const { data: plansResponse } = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: async () => (await subscriptionsApi.getPlans()).data?.data || [],
  });

  const { data: b2bPlansResponse } = useQuery({
    queryKey: ['subscription', 'b2b-plans'],
    queryFn: async () => (await subscriptionsApi.getB2BPlans()).data?.data || [],
  });

  const { data: b2bSubscribersResponse, isLoading: isLoadingB2B } = useQuery({
    queryKey: ['subscription', 'b2b-subscribers'],
    queryFn: async () => (await subscriptionsApi.getB2BSubscribers()).data?.data || [],
  });

  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['subscription', 'invoices'],
    queryFn: async () => (await subscriptionsApi.getInvoices()).data?.data || [],
  });

  // ─── MUTATIONS ────────────────────────────────────────────────────────────
  const upgradeMutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.upgrade(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        type: 'success',
        title: 'ERP Plan Upgraded',
        message: `${res.data?.message || 'Showroom ERP subscription upgraded successfully'}`,
      });
      setSelectedPlanToUpgrade(null);
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Upgrade Failed',
        message: err.response?.data?.message || 'Plan migration failed',
      });
    },
  });

  const b2bSubscribeMutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.subscribeB2BPartner(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        type: 'success',
        title: 'B2B Partner Tier Updated',
        message: res.data?.message || 'Wholesale partner subscription and credit privileges updated',
      });
      setSelectedB2BPartner(null);
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Failed to update B2B tier',
      });
    },
  });

  // Fallback defaults
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
  const b2bPlans = b2bPlansResponse || [];
  const b2bSubscribers = (b2bSubscribersResponse || []).filter((s: any) => {
    const matchesSearch =
      !b2bSearch ||
      s.companyName?.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      s.applicationId?.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      s.phone?.includes(b2bSearch);
    const matchesTier = !b2bTierFilter || s.tierId === b2bTierFilter;
    return matchesSearch && matchesTier;
  });

  const invoices = (invoicesResponse || []).filter((inv: any) => {
    if (!invoiceSearch) return true;
    const q = invoiceSearch.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerCompanyName?.toLowerCase().includes(q) ||
      inv.paymentReference?.toLowerCase().includes(q) ||
      inv.tier?.toLowerCase().includes(q)
    );
  });

  // Calculate invoice statistics
  const totalBilled = (invoicesResponse || []).reduce((acc: number, inv: any) => acc + Number(inv.totalAmount || 0), 0);
  const totalGst = (invoicesResponse || []).reduce((acc: number, inv: any) => acc + Number(inv.gstAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ─── HEADER & TAB SELECTOR ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-600" />
            Subscription & Enterprise License Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your flagship ERP software tier, configure external B2B Wholesale Partner tiers, and access GST Tax Invoices.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab('erp')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'erp'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Showroom ERP License</span>
          </button>

          <button
            onClick={() => setActiveTab('b2b')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'b2b'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>B2B Wholesale Memberships</span>
            {b2bSubscribersResponse?.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {b2bSubscribersResponse.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'invoices'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>GST Tax Invoices</span>
            {invoicesResponse?.length > 0 && (
              <span className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {invoicesResponse.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SHOWROOM ERP LICENSE                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'erp' && (
        <div className="space-y-6">
          {/* Current Plan Overview Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
              <Sparkles className="w-80 h-80 text-amber-300" />
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
                  <span className="text-xs text-amber-300/80 font-mono">SAC 997331 (GST 18%)</span>
                </div>

                <h2 className="text-2xl font-black text-white mt-2">{sub.tenantName}</h2>
                <p className="text-slate-300 text-xs mt-1">
                  Active Subscription: <span className="font-bold text-amber-400">₹{Number(sub.pricePerCycle).toLocaleString('en-IN')}</span> / {sub.billingCycle?.toLowerCase()}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-4 font-mono">
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Valid Until: {new Date(sub.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Last Payment Ref: {sub.lastPaymentReference}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cloud Storage: {sub.storageQuotaGb} GB allocated</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-lg px-6 py-2.5"
                  onClick={() => {
                    const ent = plans.find((p: any) => p.tier === 'ENTERPRISE') || plans[2] || plans[0];
                    setSelectedPlanToUpgrade(ent);
                  }}
                >
                  <Zap className="w-4 h-4 mr-1.5" /> Upgrade Showroom License
                </Button>
              </div>
            </div>
          </div>

          {/* Quota Progress Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Branches */}
            <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-all">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Building2 className="w-4 h-4 text-blue-600" /> Showroom Outlets
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {sub.currentBranches} / {sub.maxBranches}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((sub.currentBranches / sub.maxBranches) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>Physical showroom locations</span>
                  <span className="font-semibold text-blue-600">{Math.round((sub.currentBranches / sub.maxBranches) * 100)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Users */}
            <Card className="bg-white border-slate-200 shadow-sm hover:border-purple-300 transition-all">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Users className="w-4 h-4 text-purple-600" /> Staff & Manager Seats
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {sub.currentUsers} / {sub.maxUsers}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((sub.currentUsers / sub.maxUsers) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>Cashiers, sales, inventory & admins</span>
                  <span className="font-semibold text-purple-600">{Math.round((sub.currentUsers / sub.maxUsers) * 100)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Catalog SKUs */}
            <Card className="bg-white border-slate-200 shadow-sm hover:border-amber-300 transition-all">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Gem className="w-4 h-4 text-amber-600" /> Catalog SKUs
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {sub.currentProducts} / {sub.maxProducts.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.max(2, Math.min(100, Math.round((sub.currentProducts / sub.maxProducts) * 100)))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>Gold, diamond & silver articles</span>
                  <span className="font-semibold text-amber-600">
                    {((sub.currentProducts / sub.maxProducts) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card className="bg-white border-slate-200 shadow-sm hover:border-emerald-300 transition-all">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <HardDrive className="w-4 h-4 text-emerald-600" /> Media Storage Quota
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    14.8 / {sub.storageQuotaGb} GB
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((14.8 / sub.storageQuotaGb) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>4K photos, 360 videos & lab PDFs</span>
                  <span className="font-semibold text-emerald-600">
                    {((14.8 / sub.storageQuotaGb) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Comparison Cards with Monthly/Annual Switch */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Available Jewellery Enterprise Plans</h3>
                <p className="text-xs text-slate-500">Pick a plan tailored to your boutique showroom, multi-store chain, or bullion hub.</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    billingCycle === 'MONTHLY' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    billingCycle === 'ANNUAL' ? 'bg-amber-600 text-white shadow font-bold' : 'text-slate-600'
                  }`}
                >
                  <span>Annual</span>
                  <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">Save 20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p: any) => {
                const isCurrent = sub.tier === p.tier;
                const price = billingCycle === 'ANNUAL' ? p.annualPrice : p.monthlyPrice;

                return (
                  <div
                    key={p.tier}
                    className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-amber-500 shadow-xl ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-900">{p.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
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
                        <div className="text-[11px] text-slate-400 mt-0.5">+ 18% GST (SAC 997331)</div>
                      </div>

                      <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                        <li className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Up to <strong>{p.maxBranches}</strong> physical showroom outlet{p.maxBranches > 1 ? 's' : ''}</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>{p.maxUsers}</strong> staff, cashier & manager accounts</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>{Number(p.maxProducts).toLocaleString('en-IN')}</strong> catalog products & designs</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>{p.storageQuotaGb} GB</strong> high-speed CDN media storage</span>
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
                        <Button variant="outline" className="w-full bg-slate-50 text-slate-400 cursor-not-allowed" disabled>
                          Currently Active
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: B2B WHOLESALE MEMBERSHIPS                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'b2b' && (
        <div className="space-y-6">
          {/* Explanatory Banner */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-amber-900/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="text-xs uppercase font-bold">
                    B2B Trade Network
                  </Badge>
                  <span className="text-xs text-amber-300">Tiered Wholesale Partner Privileges</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Wholesale Partner Club & Credit Lines</h2>
                <p className="text-slate-300 text-xs mt-1 max-w-3xl">
                  Configure special membership tiers for your approved B2B jewellers and wholesalers. Privileges include bullion making charge discounts, rolling 15-to-30 day credit lines, and priority rate-lock contracts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400">Total B2B Partners</div>
                  <div className="text-2xl font-black text-amber-400">{b2bSubscribersResponse?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* B2B Tier Cards */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Wholesale Membership Tiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {b2bPlans.map((tier: any) => {
                const isPlatinum = tier.id === 'PLATINUM_BULLION_CLUB';
                const isGold = tier.id === 'GOLD_B2B_PREMIUM';

                return (
                  <div
                    key={tier.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-sm relative overflow-hidden ${
                      isPlatinum
                        ? 'border-purple-300 ring-2 ring-purple-500/20'
                        : isGold
                        ? 'border-amber-300 ring-2 ring-amber-500/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown
                            className={`w-5 h-5 ${
                              isPlatinum ? 'text-purple-600' : isGold ? 'text-amber-500' : 'text-slate-400'
                            }`}
                          />
                          <h4 className="font-bold text-slate-900">{tier.name}</h4>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isPlatinum
                              ? 'bg-purple-100 text-purple-800'
                              : isGold
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tier.id.split('_')[0]}
                        </span>
                      </div>

                      <div className="mt-3 pb-3 border-b border-slate-100">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {tier.annualFee === 0 ? 'Free Entry' : `₹${Number(tier.annualFee).toLocaleString('en-IN')}`}
                        </span>
                        {tier.annualFee > 0 && <span className="text-xs text-slate-500"> / year</span>}
                      </div>

                      {/* Key Metric Highlights */}
                      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Making Discount</div>
                          <div className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
                            <Percent className="w-3.5 h-3.5" />
                            <span>{tier.makingChargeDiscountPercent}% OFF</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Credit Limit</div>
                          <div className="text-sm font-bold text-slate-800">
                            {tier.creditLimitInr === 0 ? 'Nil (Advance)' : `₹${(tier.creditLimitInr / 100000).toFixed(1)} Lakh`}
                          </div>
                        </div>
                      </div>

                      {/* Privileges */}
                      <ul className="space-y-2 text-xs text-slate-600">
                        {tier.perks?.map((perk: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscribers Table with Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Wholesale Partner Directory & Tier Allocations</h3>
                <p className="text-xs text-slate-500">Assign higher tiers to reward high-volume partners with credit and discounts.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search partner, owner, phone..."
                    value={b2bSearch}
                    onChange={(e) => setB2bSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <select
                  value={b2bTierFilter}
                  onChange={(e) => setB2bTierFilter(e.target.value)}
                  className="flex h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700"
                >
                  <option value="">All Tiers</option>
                  <option value="STANDARD_WHOLESALE">Standard Wholesale</option>
                  <option value="GOLD_B2B_PREMIUM">Gold Trade Partner</option>
                  <option value="PLATINUM_BULLION_CLUB">Platinum Bullion Club</option>
                </select>
              </div>
            </div>

            {isLoadingB2B ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading wholesale subscribers...</div>
            ) : b2bSubscribers.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 text-slate-500 text-xs">
                No wholesale partners found matching current filters.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold">Partner / Shop</th>
                      <th className="py-3 px-4 text-left font-semibold">Owner & Contact</th>
                      <th className="py-3 px-4 text-left font-semibold">Current Tier</th>
                      <th className="py-3 px-4 text-left font-semibold">Credit Line</th>
                      <th className="py-3 px-4 text-left font-semibold">Discount</th>
                      <th className="py-3 px-4 text-left font-semibold">Joined Date</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {b2bSubscribers.map((partner: any) => {
                      const isPlatinum = partner.tierId === 'PLATINUM_BULLION_CLUB';
                      const isGold = partner.tierId === 'GOLD_B2B_PREMIUM';

                      return (
                        <tr key={partner.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{partner.companyName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{partner.applicationId}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-800 font-medium">{partner.ownerName}</div>
                            <div className="text-[11px] text-slate-400">{partner.phone}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                isPlatinum
                                  ? 'bg-purple-100 text-purple-800'
                                  : isGold
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {partner.tierName}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-medium text-slate-800">
                            {partner.creditLimitInr > 0 ? (
                              <span className="text-emerald-700">₹{Number(partner.creditLimitInr).toLocaleString('en-IN')} ({partner.creditDays}d)</span>
                            ) : (
                              <span className="text-slate-400">Advance Only</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {partner.makingChargeDiscountPercent > 0 ? (
                              <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {partner.makingChargeDiscountPercent}% OFF
                              </span>
                            ) : (
                              <span className="text-slate-400">Standard</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(partner.joinedAt).toLocaleDateString()}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs font-semibold"
                              onClick={() => {
                                setSelectedB2BPartner(partner);
                                setB2bTierForm({
                                  tier: partner.tierId,
                                  paymentReference: `RTGS-${Date.now().toString().slice(-6)}`,
                                  paymentMethod: 'RTGS_TRANSFER',
                                });
                              }}
                            >
                              Change Tier
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: GST TAX INVOICES & BILLING LEDGER                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Invoices Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Subscriptions Billed</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Across ERP licenses and B2B clubs</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">GST Collected (18% SAC 997331)</div>
                <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                  ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Eligible for B2B Input Tax Credit (ITC)</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Paid Invoices Count</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {invoicesResponse?.length || 0} Invoices
                </div>
                <div className="text-[11px] text-slate-400 mt-1">100% compliant electronic tax records</div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">GST Tax Invoices & Billing Ledger</h3>
                <p className="text-xs text-slate-500">Official tax invoices generated for software licensing and wholesale subscriptions.</p>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search invoice number, entity..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {isLoadingInvoices ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading tax invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 text-slate-500 text-xs">
                No invoices found matching query.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold">Invoice No</th>
                      <th className="py-3 px-4 text-left font-semibold">Billed Customer / Entity</th>
                      <th className="py-3 px-4 text-left font-semibold">SAC Code & Period</th>
                      <th className="py-3 px-4 text-right font-semibold">Base Taxable</th>
                      <th className="py-3 px-4 text-right font-semibold">GST (18%)</th>
                      <th className="py-3 px-4 text-right font-semibold">Total Amount</th>
                      <th className="py-3 px-4 text-center font-semibold">Status</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-amber-900">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{inv.customerCompanyName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">GSTIN: {inv.customerGstin || 'Unregistered'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-700">SAC {inv.sacCode || '997331'}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-800">
                          ₹{Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-emerald-700">
                          ₹{Number(inv.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-950">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge variant="success" className="font-bold text-[10px]">
                            {inv.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold gap-1 text-slate-700"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>View Invoice</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: UPGRADE ERP PLAN                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedPlanToUpgrade)}
        onClose={() => setSelectedPlanToUpgrade(null)}
        title={`Upgrade Showroom ERP to ${selectedPlanToUpgrade?.name || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedPlanToUpgrade(null)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
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
              Confirm & Issue GST Invoice
            </Button>
          </div>
        }
      >
        {selectedPlanToUpgrade && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-amber-950 text-sm">Order Summary & Tax Calculation:</div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-600">Target Edition:</span>
                <span className="font-bold text-slate-900">{selectedPlanToUpgrade.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-600">Billing Cycle:</span>
                <span className="font-bold text-slate-900">{billingCycle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-600">Base Taxable Value (SAC 997331):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(billingCycle === 'ANNUAL' ? selectedPlanToUpgrade.annualPrice : selectedPlanToUpgrade.monthlyPrice).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-600">Integrated GST (18%):</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{(
                    (billingCycle === 'ANNUAL' ? selectedPlanToUpgrade.annualPrice : selectedPlanToUpgrade.monthlyPrice) * 0.18
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-sm">
                <span className="font-black text-amber-950">Total Payable:</span>
                <span className="font-mono font-black text-amber-900">
                  ₹{(
                    (billingCycle === 'ANNUAL' ? selectedPlanToUpgrade.annualPrice : selectedPlanToUpgrade.monthlyPrice) * 1.18
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
              <div className="font-semibold text-slate-900">Upon Activation:</div>
              <p>• Multi-branch license immediately expands to <strong>{selectedPlanToUpgrade.maxBranches} branches</strong>.</p>
              <p>• Staff seats increase to <strong>{selectedPlanToUpgrade.maxUsers} logins</strong>.</p>
              <p>• Media storage quota elevates to <strong>{selectedPlanToUpgrade.storageQuotaGb} GB</strong>.</p>
              <p>• Official GST invoice will be automatically saved to your Billing Ledger.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: B2B TIER ASSIGNMENT                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedB2BPartner)}
        onClose={() => setSelectedB2BPartner(null)}
        title={`Configure Wholesale Tier - ${selectedB2BPartner?.companyName || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedB2BPartner(null)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={() => {
                b2bSubscribeMutation.mutate({
                  partnerId: selectedB2BPartner.id,
                  tierId: b2bTierForm.tier,
                  paymentReference: b2bTierForm.paymentReference,
                  paymentMethod: b2bTierForm.paymentMethod,
                });
              }}
              isLoading={b2bSubscribeMutation.isPending}
            >
              Update Tier & Privileges
            </Button>
          </div>
        }
      >
        {selectedB2BPartner && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="text-slate-500">Partner Details:</div>
              <div className="font-bold text-slate-900 text-sm">{selectedB2BPartner.companyName}</div>
              <div className="text-slate-600">Owner: {selectedB2BPartner.ownerName} ({selectedB2BPartner.phone})</div>
              <div className="font-mono text-slate-400">Application: {selectedB2BPartner.applicationId}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Membership Tier</label>
              <select
                value={b2bTierForm.tier}
                onChange={(e) => setB2bTierForm({ ...b2bTierForm, tier: e.target.value })}
                className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {b2bPlans.map((tp: any) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.name} (Fee: ₹{Number(tp.annualFee).toLocaleString('en-IN')}/yr | {tp.makingChargeDiscountPercent}% Discount | Credit: ₹{(tp.creditLimitInr/100000).toFixed(1)}L)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Reference / UTR Number</label>
              <Input
                value={b2bTierForm.paymentReference}
                onChange={(e) => setB2bTierForm({ ...b2bTierForm, paymentReference: e.target.value })}
                placeholder="e.g. RTGS-HDFC-991204"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={b2bTierForm.paymentMethod}
                onChange={(e) => setB2bTierForm({ ...b2bTierForm, paymentMethod: e.target.value })}
                className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="RTGS_TRANSFER">RTGS / NEFT Bank Transfer</option>
                <option value="CHEQUE_CLEARANCE">Cheque Clearance</option>
                <option value="RAZORPAY_UPI">UPI / Digital Gateway</option>
                <option value="CASH_DEPOSIT">Cash Deposit at Vault</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: GST TAX INVOICE INSPECTOR & PRINT                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title="Electronic Tax Invoice"
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-slate-400 font-mono">SAC: {selectedInvoice?.sacCode} | GST 18%</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </Button>
            </div>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-6 text-slate-800 p-2">
            {/* Invoice Top Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="text-xl font-black text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  JewelERP Cloud Technologies Pvt Ltd
                </div>
                <p className="text-xs text-slate-500 mt-1">Enterprise Jewellery Management Systems & Bullion Portal</p>
                <div className="text-xs text-slate-600 mt-2 font-mono">
                  <div>GSTIN: <strong>27AABCT9988H1Z8</strong></div>
                  <div>CIN: U72900MH2024PTC345678</div>
                  <div>Registered Office: 402, Trade World, BKC, Bandra East, Mumbai 400051</div>
                </div>
              </div>

              <div className="text-right">
                <Badge variant="gold" className="text-xs uppercase font-black px-3 py-1">
                  TAX INVOICE
                </Badge>
                <div className="text-base font-black text-slate-900 font-mono mt-2">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-emerald-600 font-bold font-mono mt-1">
                  Status: {selectedInvoice.status}
                </div>
              </div>
            </div>

            {/* Billed To Section */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
              <div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Billed To (Customer):</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customerCompanyName}</div>
                <div className="text-slate-600 mt-1">{selectedInvoice.customerAddress || 'Address on file'}</div>
                <div className="mt-2 font-mono">
                  <span>Customer GSTIN: </span>
                  <span className="font-bold text-slate-900">{selectedInvoice.customerGstin || 'Unregistered'}</span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Payment & Service Period:</div>
                <div className="mt-1 space-y-1">
                  <div>Plan Tier: <strong className="text-amber-900">{selectedInvoice.tier}</strong> ({selectedInvoice.billingCycle})</div>
                  <div>Payment Mode: <strong className="font-mono">{selectedInvoice.paymentMethod}</strong></div>
                  <div>Payment Ref: <strong className="font-mono">{selectedInvoice.paymentReference}</strong></div>
                  <div>Coverage: <span className="font-mono">{new Date(selectedInvoice.periodStart).toLocaleDateString()} to {new Date(selectedInvoice.periodEnd).toLocaleDateString()}</span></div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left">Description of Services</th>
                    <th className="py-2.5 px-3 text-center">SAC Code</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-center">GST Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        Jewellery ERP Platform Subscription - {selectedInvoice.tier} Edition
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Multi-branch license, real-time metal ledger, BIS HUID vault integration, and private cloud storage quota.
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{selectedInvoice.sacCode}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{Number(selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">18%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      ₹{Number(selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 font-medium border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-500">Taxable Subtotal:</td>
                    <td colSpan={2} className="py-2 px-3 text-right font-mono">
                      ₹{Number(selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-500">CGST (9%):</td>
                    <td colSpan={2} className="py-2 px-3 text-right font-mono">
                      ₹{(Number(selectedInvoice.gstAmount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-500">SGST (9%):</td>
                    <td colSpan={2} className="py-2 px-3 text-right font-mono">
                      ₹{(Number(selectedInvoice.gstAmount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300 font-bold text-slate-900 text-sm">
                    <td colSpan={3} className="py-3 px-3 text-right font-black">Total Invoice Value (INR):</td>
                    <td colSpan={2} className="py-3 px-3 text-right font-mono font-black text-amber-900">
                      ₹{Number(selectedInvoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note & Authorized Signatory */}
            <div className="flex justify-between items-end pt-2 text-xs text-slate-500">
              <div className="max-w-md text-[11px]">
                <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                <p>1. This is a computer-generated tax invoice and requires no physical signature under the IT Act, 2000.</p>
                <p>2. Subject to Mumbai Jurisdiction. SAC Code 997331 represents Intellectual Property Licensing and software services.</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">For JewelERP Technologies Pvt Ltd</div>
                <div className="h-10"></div>
                <div className="text-[11px] text-slate-400">Authorized Signatory</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
