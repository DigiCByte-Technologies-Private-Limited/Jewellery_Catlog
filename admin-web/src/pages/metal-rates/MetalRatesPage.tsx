import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metalRatesApi } from '../../api/metal-rates.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Calculator } from 'lucide-react';

export function MetalRatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Form state for updating rate
  const [metalType, setMetalType] = useState('GOLD');
  const [purity, setPurity] = useState('K22');
  const [ratePerGram, setRatePerGram] = useState('');
  const [notes, setNotes] = useState('');

  // Derived rates calculator state
  const [base24K, setBase24K] = useState('');
  const [derivedRates, setDerivedRates] = useState<any[]>([]);

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch current rates
  const { data: latestRates, isLoading } = useQuery({
    queryKey: ['metal-rates', 'latest'],
    queryFn: async () => {
      const res = await metalRatesApi.getLatest();
      return res.data?.data || [];
    },
  });

  // Fetch rate history
  const { data: historyData } = useQuery({
    queryKey: ['metal-rates', 'history'],
    queryFn: async () => {
      const res = await metalRatesApi.getHistory({ limit: 50 });
      return res.data?.data || [];
    },
    enabled: activeTab === 'history',
  });

  // Mutation to create/update rate
  const createRateMutation = useMutation({
    mutationFn: (data: any) => metalRatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      toast({ type: 'success', title: 'Rate Submitted', message: 'Metal rate successfully saved' });
      setIsUpdateModalOpen(false);
      setRatePerGram('');
      setNotes('');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to submit rate' });
    },
  });

  // Mutation to approve
  const approveMutation = useMutation({
    mutationFn: (id: string) => metalRatesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      toast({ type: 'success', title: 'Approved', message: 'Metal rate has been approved and activated' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Approval failed' });
    },
  });

  // Mutation to reject
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => metalRatesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      toast({ type: 'info', title: 'Rejected', message: 'Rate change rejected' });
      setRejectId(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Rejection failed' });
    },
  });

  // Handle derived rates calculation
  const handleCalculateDerived = async () => {
    if (!base24K || Number(base24K) <= 0) {
      toast({ type: 'warning', title: 'Validation', message: 'Please enter a valid 24K rate' });
      return;
    }
    try {
      const res = await metalRatesApi.calculateDerived(Number(base24K));
      setDerivedRates(res.data?.data?.derived || []);
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', message: 'Failed to calculate derived rates' });
    }
  };

  // Apply all derived rates
  const handleApplyAllDerived = async () => {
    if (!derivedRates.length) return;
    try {
      for (const item of derivedRates) {
        await metalRatesApi.create({
          metalType: 'GOLD',
          purity: item.purity,
          ratePerGram: item.ratePerGram,
          notes: `Auto-derived from 24K base rate ₹${base24K}/g`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      toast({ type: 'success', title: 'Applied', message: 'All derived gold rates have been saved' });
      setDerivedRates([]);
      setBase24K('');
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', message: 'Failed to apply derived rates' });
    }
  };

  const currentColumns = [
    {
      header: 'Metal & Purity',
      cell: (r: any) => (
        <div>
          <span className="font-semibold text-slate-900">{r.metalType}</span>
          <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
            {r.purity}
          </span>
        </div>
      ),
    },
    {
      header: 'Rate per Gram',
      cell: (r: any) => (
        <span className="text-base font-bold text-amber-700 font-mono">
          ₹{Number(r.ratePerGram).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Previous Rate',
      cell: (r: any) => (
        <span className="text-sm text-slate-500 font-mono">
          {r.previousRatePerGram ? `₹${Number(r.previousRatePerGram).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      ),
    },
    {
      header: 'Change',
      cell: (r: any) => {
        if (!r.previousRatePerGram) return <span className="text-slate-400">—</span>;
        const diff = Number(r.ratePerGram) - Number(r.previousRatePerGram);
        const pct = ((diff / Number(r.previousRatePerGram)) * 100).toFixed(2);
        const isUp = diff >= 0;
        return (
          <div className={`flex items-center gap-1 font-medium text-xs ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{isUp ? '+' : ''}{diff.toFixed(2)} ({pct}%)</span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (r: any) => (
        <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: 'Effective Date',
      cell: (r: any) => new Date(r.effectiveFrom || r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      header: 'Actions',
      cell: (r: any) =>
        r.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => approveMutation.mutate(r.id)}>
              Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => setRejectId(r.id)}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Metal Rates</h1>
          <p className="text-slate-500 text-sm">Manage benchmark rates for Gold, Silver, and Platinum</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['metal-rates'] })}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setIsUpdateModalOpen(true)}>+ Update Rate</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'current'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Active Rates
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Rate History
        </button>
      </div>

      {/* Current Rates View */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <Table columns={currentColumns} data={latestRates || []} isLoading={isLoading} />
          </div>

          {/* Derived Rates Auto-Calculator */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-bold text-amber-950">Derived Gold Rates Calculator (24K Formula)</h2>
            </div>
            <p className="text-xs text-amber-800 mb-4">
              Enter the benchmark 24K Gold rate to compute mathematically exact standard rates: 22K (91.67%), 18K (75%), and 14K (58.33%).
            </p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-64">
                <Input
                  label="24K Base Gold Rate (₹/g)"
                  type="number"
                  placeholder="e.g. 7450"
                  value={base24K}
                  onChange={(e) => setBase24K(e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={handleCalculateDerived}>
                Calculate Derived
              </Button>
              {derivedRates.length > 0 && (
                <Button variant="primary" onClick={handleApplyAllDerived}>
                  Apply All to System
                </Button>
              )}
            </div>

            {derivedRates.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {derivedRates.map((d) => (
                  <div key={d.purity} className="bg-white p-3 rounded border border-amber-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">{d.label}</div>
                    <div className="text-lg font-bold text-amber-800 font-mono">₹{d.ratePerGram} / g</div>
                    <div className="text-xs text-slate-400">Factor: {(d.factor * 100).toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <Table columns={currentColumns} data={historyData || []} />
        </div>
      )}

      {/* Update Rate Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Metal Benchmark Rate"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!ratePerGram || Number(ratePerGram) <= 0) {
                  toast({ type: 'warning', title: 'Validation', message: 'Enter a valid positive rate' });
                  return;
                }
                createRateMutation.mutate({
                  metalType,
                  purity,
                  ratePerGram: Number(ratePerGram),
                  notes,
                });
              }}
              isLoading={createRateMutation.isPending}
            >
              Submit Rate
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Metal Type"
            value={metalType}
            onChange={(e) => {
              setMetalType(e.target.value);
              setPurity(e.target.value === 'GOLD' ? 'K22' : e.target.value === 'SILVER' ? 'SILVER_999' : 'PLATINUM_950');
            }}
            options={[
              { label: 'Gold', value: 'GOLD' },
              { label: 'Silver', value: 'SILVER' },
              { label: 'Platinum', value: 'PLATINUM' },
            ]}
          />

          <Select
            label="Purity"
            value={purity}
            onChange={(e) => setPurity(e.target.value)}
            options={
              metalType === 'GOLD'
                ? [
                    { label: '24K (99.9% Pure)', value: 'K24' },
                    { label: '22K (91.6% Hallmark)', value: 'K22' },
                    { label: '18K (75.0% Fine)', value: 'K18' },
                    { label: '14K (58.3% Fine)', value: 'K14' },
                  ]
                : metalType === 'SILVER'
                ? [
                    { label: '999 Fine Silver', value: 'SILVER_999' },
                    { label: '925 Sterling Silver', value: 'SILVER_925' },
                  ]
                : [{ label: '950 Platinum', value: 'PLATINUM_950' }]
            }
          />

          <Input
            label="Rate per Gram (₹)"
            type="number"
            step="0.01"
            placeholder="e.g. 6850.00"
            value={ratePerGram}
            onChange={(e) => setRatePerGram(e.target.value)}
          />

          <Input
            label="Notes / Reason for update (optional)"
            placeholder="e.g. Morning market opening rate"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject Metal Rate Change"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast({ type: 'warning', title: 'Required', message: 'Please enter a rejection reason' });
                  return;
                }
                if (rejectId) rejectMutation.mutate({ id: rejectId, reason: rejectReason });
              }}
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Please provide a reason for rejecting this proposed rate change:</p>
          <Input
            label="Rejection Reason"
            placeholder="e.g. Rate deviates more than 5% from market spot"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
