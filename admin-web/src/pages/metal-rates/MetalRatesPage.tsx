import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  metalRatesApi,
  type MetalRateItem,
  type ImpactPreviewData,
} from '../../api/metal-rates.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calculator,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Layers,
  Edit3,
  Sparkles,
} from 'lucide-react';

export function MetalRatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Form state for updating rate
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [metalType, setMetalType] = useState('GOLD');
  const [purity, setPurity] = useState('K22');
  const [ratePerGram, setRatePerGram] = useState('');
  const [notes, setNotes] = useState('');

  // Impact Preview State
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactData, setImpactData] = useState<ImpactPreviewData | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  // Derived rates calculator state
  const [base24K, setBase24K] = useState('');
  const [derivedRates, setDerivedRates] = useState<any[]>([]);

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Fetch current rates
  const { data: latestRates, isLoading } = useQuery({
    queryKey: ['metal-rates', 'latest'],
    queryFn: async () => {
      const res = await metalRatesApi.getLatest();
      return res.data?.data || [];
    },
  });

  // 2. Fetch rate history
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['metal-rates', 'history'],
    queryFn: async () => {
      const res = await metalRatesApi.getHistory({ limit: 50 });
      return res.data?.data || [];
    },
    enabled: activeTab === 'history',
  });

  // Mutation to create/update rate
  const submitRateMutation = useMutation({
    mutationFn: async (data: {
      id?: string | null;
      metalType: string;
      purity: string;
      ratePerGram: number;
      notes?: string;
    }) => {
      if (data.id) {
        return metalRatesApi.update(data.id, {
          ratePerGram: data.ratePerGram,
          notes: data.notes,
        });
      }
      return metalRatesApi.create({
        metalType: data.metalType,
        purity: data.purity,
        ratePerGram: data.ratePerGram,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        type: 'success',
        title: 'Benchmark Rate Activated',
        message: 'Metal benchmark rate saved. All catalog products recalculated automatically.',
      });
      setIsImpactModalOpen(false);
      setIsUpdateModalOpen(false);
      setSelectedRateId(null);
      setRatePerGram('');
      setNotes('');
      setImpactData(null);
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to submit metal rate',
      });
    },
  });

  // Mutation to approve
  const approveMutation = useMutation({
    mutationFn: (id: string) => metalRatesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ type: 'success', title: 'Approved', message: 'Metal rate approved and activated' });
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

  // Open update modal for a specific existing rate row
  const handleOpenRowUpdate = (row: MetalRateItem) => {
    setSelectedRateId(row.id);
    setMetalType(row.metalType);
    setPurity(row.purity);
    setRatePerGram(String(row.ratePerGram));
    setNotes('');
    setIsUpdateModalOpen(true);
  };

  // Preview Impact before confirming update
  const handlePreviewImpact = async () => {
    const numRate = parseFloat(ratePerGram);
    if (!ratePerGram || isNaN(numRate) || numRate <= 0) {
      toast({ type: 'warning', title: 'Validation', message: 'Enter a valid positive rate per gram' });
      return;
    }

    try {
      setIsLoadingImpact(true);
      const res = await metalRatesApi.getImpactPreview(metalType, purity, numRate);
      setImpactData(res.data?.data || null);
      setIsImpactModalOpen(true);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Preview Failed',
        message: err.response?.data?.message || 'Could not calculate impact preview',
      });
    } finally {
      setIsLoadingImpact(false);
    }
  };

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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ type: 'success', title: 'Applied', message: 'All derived gold rates have been saved' });
      setDerivedRates([]);
      setBase24K('');
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', message: 'Failed to apply derived rates' });
    }
  };

  const currentColumns = [
    {
      header: 'Precious Metal & Purity',
      cell: (r: MetalRateItem) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
              r.metalType === 'GOLD'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : r.metalType === 'SILVER'
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
            }`}
          >
            {r.metalType[0]}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">
              {r.metalType === 'GOLD' ? 'Gold' : r.metalType === 'SILVER' ? 'Silver' : 'Platinum'}
            </div>
            <div className="font-mono text-[11px] text-slate-500 font-semibold">
              {r.purity.replace('SILVER_', '').replace('PLATINUM_', '')}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Active Benchmark Rate',
      cell: (r: MetalRateItem) => (
        <div>
          <span className="text-sm font-bold text-amber-800 font-mono">
            ₹{Number(r.ratePerGram).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 font-mono ml-1">/ gram</span>
        </div>
      ),
    },
    {
      header: 'Affected Catalog Products',
      cell: (r: MetalRateItem) => (
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono font-semibold text-xs text-slate-700">
            {r.productsCount !== undefined ? `${r.productsCount} items` : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Previous Rate',
      cell: (r: MetalRateItem) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.previousRatePerGram
            ? `₹${Number(r.previousRatePerGram).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g`
            : '—'}
        </span>
      ),
    },
    {
      header: 'Rate Change',
      cell: (r: MetalRateItem) => {
        if (!r.previousRatePerGram) return <span className="text-slate-400 text-xs font-mono">—</span>;
        const diff = Number(r.ratePerGram) - Number(r.previousRatePerGram);
        const pct = ((diff / Number(r.previousRatePerGram)) * 100).toFixed(2);
        const isUp = diff >= 0;
        return (
          <div
            className={`flex items-center gap-1 font-semibold font-mono text-xs ${
              isUp ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
            <span>
              {isUp ? '+' : ''}₹{Math.abs(diff).toFixed(2)} ({isUp ? '+' : ''}{pct}%)
            </span>
          </div>
        );
      },
    },
    {
      header: 'Effective Since',
      cell: (r: MetalRateItem) => (
        <div className="text-xs text-slate-600 font-mono">
          {new Date(r.effectiveFrom || r.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (r: MetalRateItem) => (
        <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (r: MetalRateItem) =>
        r.status === 'PENDING' ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="primary" onClick={() => approveMutation.mutate(r.id)}>
              Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => setRejectId(r.id)}>
              Reject
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 py-1 px-2 text-amber-800 border-amber-300 hover:bg-amber-50"
            onClick={() => handleOpenRowUpdate(r)}
          >
            <Edit3 className="w-3 h-3 mr-1" /> Update
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>Live Metal Benchmark Rates</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
              <Sparkles className="w-3 h-3 text-amber-700" />
              Dynamic Central Engine
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Admin controls benchmark rates for Gold & Silver. Product prices across catalog, cart, and checkout update dynamically.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['metal-rates'] })}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedRateId(null);
              setMetalType('GOLD');
              setPurity('K22');
              setRatePerGram('');
              setNotes('');
              setIsUpdateModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            + Set New Rate
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'current'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Active Benchmark Rates ({latestRates?.length || 0})
        </button>
        <button
          className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Rate Audit Log & History
        </button>
      </div>

      {/* Current Rates View */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <Table columns={currentColumns} data={latestRates || []} isLoading={isLoading} />
          </div>

          {/* Derived Rates Auto-Calculator */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-amber-700" />
              <h2 className="text-sm font-bold text-amber-950">Derived Gold Rates Formula Engine (from 24K Base)</h2>
            </div>
            <p className="text-xs text-amber-800 mb-4">
              Enter the benchmark 24K pure gold rate to compute mathematically exact standard rates for 22K (91.67%), 18K (75.00%), and 14K (58.33%).
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-60">
                <Input
                  label="24K Base Gold Rate (₹/g)"
                  type="number"
                  placeholder="e.g. 6200"
                  value={base24K}
                  onChange={(e) => setBase24K(e.target.value)}
                />
              </div>
              <Button size="sm" variant="secondary" onClick={handleCalculateDerived}>
                Compute Derived Rates
              </Button>
              {derivedRates.length > 0 && (
                <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleApplyAllDerived}>
                  Apply All Purity Rates
                </Button>
              )}
            </div>

            {derivedRates.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {derivedRates.map((d) => (
                  <div key={d.purity} className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                    <div className="text-[11px] font-semibold text-slate-500">{d.label}</div>
                    <div className="text-base font-bold text-amber-900 font-mono mt-0.5">₹{d.ratePerGram} / g</div>
                    <div className="text-[10px] text-slate-400 font-mono">Factor: {(d.factor * 100).toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <Table columns={currentColumns} data={historyData || []} isLoading={isHistoryLoading} />
        </div>
      )}

      {/* STEP 1: Update Rate Input Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={selectedRateId ? `Update ${metalType} ${purity} Benchmark Rate` : 'Set Metal Benchmark Rate'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePreviewImpact}
              isLoading={isLoadingImpact}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Preview Rate Impact
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Live Dynamic Recalculation:</strong> Updating this rate automatically recalculates all products using this metal and purity across customer catalog, cart, and showroom quotes without manual editing.
            </div>
          </div>

          <Select
            label="Precious Metal"
            value={metalType}
            disabled={Boolean(selectedRateId)}
            onChange={(e) => {
              const val = e.target.value;
              setMetalType(val);
              setPurity(val === 'GOLD' ? 'K22' : val === 'SILVER' ? 'SILVER_999' : 'PLATINUM_950');
            }}
            options={[
              { label: 'Gold (Au)', value: 'GOLD' },
              { label: 'Silver (Ag)', value: 'SILVER' },
              { label: 'Platinum (Pt)', value: 'PLATINUM' },
            ]}
          />

          <Select
            label="Purity Level"
            value={purity}
            disabled={Boolean(selectedRateId)}
            onChange={(e) => setPurity(e.target.value)}
            options={
              metalType === 'GOLD'
                ? [
                    { label: '24K (99.9% Pure Investment Gold)', value: 'K24' },
                    { label: '22K (91.6% BIS Hallmark Standard)', value: 'K22' },
                    { label: '18K (75.0% Fine Diamond Jewelry)', value: 'K18' },
                    { label: '14K (58.3% Fine Modern Jewelry)', value: 'K14' },
                  ]
                : metalType === 'SILVER'
                ? [
                    { label: '999 Fine Silver (Puja / Bullion)', value: 'SILVER_999' },
                    { label: '925 Sterling Silver (Hallmarked)', value: 'SILVER_925' },
                  ]
                : [{ label: '950 Platinum Standard', value: 'PLATINUM_950' }]
            }
          />

          <Input
            label="New Benchmark Rate per Gram (₹) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 5850.00"
            value={ratePerGram}
            onChange={(e) => setRatePerGram(e.target.value)}
          />

          <Input
            label="Update Rationale / Notes (optional)"
            placeholder="e.g. Morning bullion market spot price update"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* STEP 2: Rate Change Impact Preview Confirmation Dialog */}
      <Modal
        isOpen={isImpactModalOpen && Boolean(impactData)}
        onClose={() => setIsImpactModalOpen(false)}
        title="Confirm Benchmark Rate Update & Impact Preview"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImpactModalOpen(false)}
            >
              Back to Edit
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!ratePerGram || Number(ratePerGram) <= 0) return;
                submitRateMutation.mutate({
                  id: selectedRateId,
                  metalType,
                  purity,
                  ratePerGram: Number(ratePerGram),
                  notes,
                });
              }}
              isLoading={submitRateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Confirm & Apply Rate Update
            </Button>
          </div>
        }
      >
        {impactData && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Rate Modification Impact Warning:</strong> Confirming this action will update the central benchmark rate and immediately recalculate selling prices for all <strong>{impactData.affectedProductsCount} active products</strong> using {impactData.metalType} {impactData.purity}.
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-slate-500 font-medium text-[11px]">Current Rate</div>
                <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                  ₹{impactData.currentRatePerGram.toLocaleString('en-IN')}/g
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50/50">
                <div className="text-amber-800 font-medium text-[11px]">New Proposed Rate</div>
                <div className="text-sm font-bold font-mono text-amber-950 mt-0.5">
                  ₹{impactData.newRatePerGram.toLocaleString('en-IN')}/g
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${impactData.rateDifference >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}`}>
                  {impactData.rateDifference >= 0 ? '+' : ''}₹{impactData.rateDifference}/g ({impactData.ratePercentageChange}%)
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-slate-500 font-medium text-[11px]">Catalog Items Affected</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {impactData.affectedProductsCount} products
                </div>
                <div className="text-[10px] text-slate-400">100% dynamic linked</div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-slate-500 font-medium text-[11px]">Net Catalog Shift</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {impactData.totalValueChange >= 0 ? '+' : ''}₹{impactData.totalValueChange.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400">Cumulative inventory value</div>
              </div>
            </div>

            {/* Sample Affected Products */}
            {impactData.sampleProducts && impactData.sampleProducts.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Sample Products Affected ({impactData.sampleProducts.length} shown)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Calculated with making charges & tax</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-12 bg-slate-50 px-3 py-1.5 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2 text-right">Weight</div>
                    <div className="col-span-2 text-right">Old Price</div>
                    <div className="col-span-3 text-right">New Price (Delta)</div>
                  </div>

                  {impactData.sampleProducts.map((p) => (
                    <div key={p.id} className="grid grid-cols-12 px-3 py-2 items-center hover:bg-slate-50/50">
                      <div className="col-span-5 min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </div>
                      <div className="col-span-2 text-right font-mono text-slate-600">
                        {p.netMetalWeight}g
                      </div>
                      <div className="col-span-2 text-right font-mono text-slate-500 line-through">
                        ₹{p.oldPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="col-span-3 text-right font-mono">
                        <span className="font-bold text-amber-950">₹{p.newPrice.toLocaleString('en-IN')}</span>
                        <span className={`text-[10px] block ${p.difference >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          ({p.difference >= 0 ? '+' : ''}₹{p.difference.toLocaleString('en-IN')})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject Metal Rate Change"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
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
          <p className="text-xs text-slate-600">Please provide a reason for rejecting this proposed rate change:</p>
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
