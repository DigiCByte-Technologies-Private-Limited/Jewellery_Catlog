import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oldGoldApi } from '../../api/old-gold.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import {
  Coins,
  Scale,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export function OldGoldPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'calculator' | 'transactions'>('calculator');
  const [search, setSearch] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Calculator Form State
  const [calcForm, setCalcForm] = useState({
    metalType: 'GOLD',
    grossWeight: '',
    stoneWeight: '0',
    enamelLacWeight: '0',
    testedPurityPercent: '91.60', // 22K standard
    testingMethod: 'XRF_KARATMETER',
    meltingLossPercent: '1.0',
  });

  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  // Voucher Creation State
  const [customerForm, setCustomerForm] = useState({
    customerName: '',
    customerPhone: '',
    customerPan: '',
    paymentMode: 'EXCHANGE_CREDIT',
    notes: '',
  });

  // Fetch Transactions
  const { data: transactionsResponse, isLoading: txLoading } = useQuery({
    queryKey: ['old-gold', 'transactions'],
    queryFn: async () => (await oldGoldApi.getTransactions({ limit: 100 })).data?.data || [],
  });



  // Calculate Valuation Live
  useEffect(() => {
    if (!calcForm.grossWeight || Number(calcForm.grossWeight) <= 0) {
      setAssessmentResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAssessing(true);
      try {
        const res = await oldGoldApi.assess({
          metalType: calcForm.metalType,
          grossWeight: Number(calcForm.grossWeight),
          stoneWeight: Number(calcForm.stoneWeight || 0),
          enamelLacWeight: Number(calcForm.enamelLacWeight || 0),
          testedPurityPercent: Number(calcForm.testedPurityPercent),
          meltingLossPercent: Number(calcForm.meltingLossPercent || 1.0),
        });
        setAssessmentResult(res.data?.data);
      } catch {
        // quiet error
      } finally {
        setIsAssessing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [calcForm]);

  // Create Transaction Mutation
  const createTxMutation = useMutation({
    mutationFn: (data: any) => oldGoldApi.createTransaction(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['old-gold'] });
      toast({
        type: 'success',
        title: 'Voucher Created',
        message: `${res.data?.message || 'Old gold transaction recorded'}`,
      });
      setIsVoucherModalOpen(false);
      setCustomerForm({ customerName: '', customerPhone: '', customerPan: '', paymentMode: 'EXCHANGE_CREDIT', notes: '' });
      setCalcForm({ metalType: 'GOLD', grossWeight: '', stoneWeight: '0', enamelLacWeight: '0', testedPurityPercent: '91.60', testingMethod: 'XRF_KARATMETER', meltingLossPercent: '1.0' });
      setActiveTab('transactions');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create voucher' });
    },
  });

  const transactions = transactionsResponse || [];

  const columns = [
    {
      header: 'Voucher #',
      cell: (r: any) => (
        <span className="font-mono font-bold text-amber-900 text-xs">{r.voucherNumber}</span>
      ),
    },
    {
      header: 'Customer Details',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.customerName}</div>
          <div className="text-xs text-slate-500 font-mono">{r.customerPhone} {r.customerPan ? `· PAN: ${r.customerPan}` : ''}</div>
        </div>
      ),
    },
    {
      header: 'Gross / Net Wt',
      cell: (r: any) => (
        <div className="text-xs font-mono">
          <div>Gross: {Number(r.grossWeight).toFixed(3)}g</div>
          <div className="text-slate-500">Net: {Number(r.netWeight).toFixed(3)}g</div>
        </div>
      ),
    },
    {
      header: 'Tested Purity',
      cell: (r: any) => (
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          {r.testedPurityPercent}% ({r.testingMethod?.split('_')[0]})
        </span>
      ),
    },
    {
      header: 'Net Fine Gold',
      cell: (r: any) => (
        <span className="font-mono font-bold text-amber-800 text-xs">
          {Number(r.netFineGoldGrams).toFixed(3)} g
        </span>
      ),
    },
    {
      header: 'Credit / Payout',
      cell: (r: any) => (
        <span className="font-mono font-bold text-slate-900 text-sm">
          ₹{Number(r.totalValuation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Settlement Mode',
      cell: (r: any) => (
        <Badge variant={r.paymentMode === 'EXCHANGE_CREDIT' ? 'success' : 'info'}>
          {r.paymentMode?.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  const filteredTransactions = transactions.filter((t: any) => {
    if (paymentModeFilter && t.paymentMode !== paymentModeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesVoucher = t.voucherNumber?.toLowerCase().includes(q);
      const matchesName = t.customerName?.toLowerCase().includes(q);
      const matchesPhone = t.customerPhone?.toLowerCase().includes(q);
      const matchesPan = t.customerPan?.toLowerCase().includes(q);
      if (!matchesVoucher && !matchesName && !matchesPhone && !matchesPan) return false;
    }
    return true;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedTransactions = filteredTransactions.slice((page - 1) * limit, page * limit);
  const totalAcquiredGold = transactions.reduce((s: number, t: any) => s + Number(t.netFineGoldGrams || 0), 0);
  const totalValuation = transactions.reduce((s: number, t: any) => s + Number(t.totalValuation || 0), 0);

  const statWidgets: StatWidget[] = [
    {
      label: 'Total Vouchers',
      value: transactions.length,
      subtext: 'Completed exchange buybacks',
      variant: 'default',
      onClick: () => {
        setActiveTab('transactions');
        setPaymentModeFilter('');
        setPage(1);
      },
    },
    {
      label: 'Fine Gold Acquired',
      value: `${totalAcquiredGold.toFixed(2)}g`,
      subtext: 'Pure 24K equivalent net gold',
      variant: 'gold',
    },
    {
      label: 'Total Valuation Payout',
      value: `₹${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      subtext: 'Exchange credit issued',
      variant: 'emerald',
    },
    {
      label: 'Testing Standard',
      value: 'XRF Karatmeter',
      subtext: 'Non-destructive spectrometry',
      variant: 'blue',
      onClick: () => {
        setActiveTab('calculator');
      },
    },
  ];

  const filterSlot = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'calculator'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Valuation Calculator
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'transactions'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Vouchers Registry ({transactions.length})
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56">
            <CustomDropdown
              value={paymentModeFilter}
              onChange={(val) => {
                setPaymentModeFilter(val);
                setPage(1);
              }}
              placeholder="All Settlement Modes"
              options={[
                { value: '', label: 'All Settlement Modes' },
                { value: 'EXCHANGE_CREDIT', label: 'Exchange Credit', badge: 'Credit' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer (RTGS)', badge: 'Bank' },
                { value: 'CASH', label: 'Cash Settlement', badge: 'Cash' },
              ]}
            />
          </div>

          {(paymentModeFilter || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPaymentModeFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <StandardPageLayout
        title="Old Gold Exchange & Valuation"
        description="Customer jewellery buyback, XRF Karatmeter purity appraisal, and exchange credit vouchers"
        badge="Exchange & Refine"
        stats={statWidgets}
        searchPlaceholder={activeTab === 'transactions' ? 'Search vouchers by number, customer name, phone, PAN...' : 'Appraisal valuation tool'}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterSlot={filterSlot}
        primaryAction={
          <Button size="sm" onClick={() => setActiveTab('calculator')}>
            <Scale className="w-4 h-4 mr-1.5" /> New Appraisal
          </Button>
        }
        isLoading={activeTab === 'transactions' && txLoading}
        totalCount={activeTab === 'transactions' ? totalItems : undefined}
        tableContent={
          activeTab === 'calculator' ? (
            <div className="p-4 bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Controls (2 columns) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <span>Physical Scale & Purity Testing</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Precious Metal"
                    value={calcForm.metalType}
                    onChange={(e) => setCalcForm({ ...calcForm, metalType: e.target.value })}
                    options={[
                      { label: 'Gold (Au)', value: 'GOLD' },
                      { label: 'Silver (Ag)', value: 'SILVER' },
                    ]}
                  />

                  <Select
                    label="Testing Method"
                    value={calcForm.testingMethod}
                    onChange={(e) => setCalcForm({ ...calcForm, testingMethod: e.target.value })}
                    options={[
                      { label: 'XRF Karatmeter (Non-Destructive Spectrometry)', value: 'XRF_KARATMETER' },
                      { label: 'Touchstone & Acid Assay', value: 'TOUCHSTONE' },
                      { label: 'Fire Assay / Melt Cupellation', value: 'FIRE_ASSAY' },
                    ]}
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Scale Weights (Grams)
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Gross Weight (g) *"
                      type="number"
                      step="0.001"
                      placeholder="Scale reading (e.g. 24.500)"
                      value={calcForm.grossWeight}
                      onChange={(e) => setCalcForm({ ...calcForm, grossWeight: e.target.value })}
                    />
                    <Input
                      label="Stone Deduction (g)"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={calcForm.stoneWeight}
                      onChange={(e) => setCalcForm({ ...calcForm, stoneWeight: e.target.value })}
                    />
                    <Input
                      label="Enamel / Wax / Dirt (g)"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={calcForm.enamelLacWeight}
                      onChange={(e) => setCalcForm({ ...calcForm, enamelLacWeight: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Tested Purity (% Fine Gold) *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="91.60"
                        value={calcForm.testedPurityPercent}
                        onChange={(e) => setCalcForm({ ...calcForm, testedPurityPercent: e.target.value })}
                      />
                      <div className="flex gap-1">
                        {['91.60', '75.00', '88.00'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCalcForm({ ...calcForm, testedPurityPercent: p })}
                            className="px-2 py-1 text-xs border rounded bg-white hover:bg-slate-50 font-mono"
                          >
                            {p === '91.60' ? '22K' : p === '75.00' ? '18K' : '88%'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Input
                    label="Melting Loss Allowance (%)"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={calcForm.meltingLossPercent}
                    onChange={(e) => setCalcForm({ ...calcForm, meltingLossPercent: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Valuation Preview & Voucher Button (1 column) */}
          <div>
            <Card className="border-amber-300 shadow-md">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-t-lg py-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <CardTitle className="text-base text-white">Appraisal Valuation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 font-mono text-xs">
                {isAssessing ? (
                  <div className="text-center py-10 text-slate-400">Computing appraisal...</div>
                ) : assessmentResult ? (
                  <>
                    <div className="space-y-2 divide-y divide-slate-100">
                      <div className="flex justify-between py-1 font-sans">
                        <span className="text-slate-500">Gross Scale Wt:</span>
                        <span className="font-mono">{assessmentResult.grossWeight}g</span>
                      </div>
                      <div className="flex justify-between py-1 font-sans">
                        <span className="text-slate-500">Deductions (Stones+Lac):</span>
                        <span className="font-mono">
                          {(assessmentResult.stoneWeight + assessmentResult.enamelLacWeight).toFixed(3)}g
                        </span>
                      </div>
                      <div className="flex justify-between py-1 font-sans font-bold">
                        <span className="text-slate-700">Net Metal Weight:</span>
                        <span className="font-mono">{assessmentResult.netWeight}g</span>
                      </div>
                      <div className="flex justify-between py-1 font-sans">
                        <span className="text-slate-500">Tested Purity:</span>
                        <span className="font-mono">{assessmentResult.testedPurityPercent}%</span>
                      </div>
                      <div className="flex justify-between py-1 font-sans">
                        <span className="text-slate-500">Melting Loss:</span>
                        <span className="font-mono">{assessmentResult.meltingLossPercent}%</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-sans bg-amber-50 px-2 rounded font-bold text-amber-950">
                        <span>Net Fine Gold (24K):</span>
                        <span className="font-mono text-sm">{assessmentResult.netFineGoldGrams} grams</span>
                      </div>
                      <div className="flex justify-between py-1 font-sans">
                        <span className="text-slate-500">Benchmark Rate:</span>
                        <span className="font-mono">₹{assessmentResult.buyRatePerGram?.toLocaleString('en-IN')}/g</span>
                      </div>
                    </div>

                    <div className="bg-amber-100 p-3 rounded-lg border border-amber-300 text-amber-950 font-sans">
                      <div className="text-xs text-amber-800">Total Exchange Credit Valuation</div>
                      <div className="text-2xl font-black font-mono mt-0.5">
                        ₹{assessmentResult.totalValuation?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-2"
                      onClick={() => setIsVoucherModalOpen(true)}
                    >
                      <Receipt className="w-4 h-4 mr-1.5" /> Accept & Generate Voucher
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-10 text-slate-400 font-sans text-xs">
                    Enter scale gross weight to generate instant valuation and exchange credit.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    ) : (
      <Table columns={columns} data={paginatedTransactions} isLoading={txLoading} />
    )
  }
  pagination={
    activeTab === 'transactions'
      ? {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: setPage,
        }
      : undefined
  }
/>

      {/* Accept & Generate Voucher Modal */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Generate Official Old Gold Voucher"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsVoucherModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!customerForm.customerName || !customerForm.customerPhone) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Customer name and phone number required' });
                  return;
                }
                createTxMutation.mutate({
                  ...customerForm,
                  ...calcForm,
                  grossWeight: Number(calcForm.grossWeight),
                  stoneWeight: Number(calcForm.stoneWeight || 0),
                  enamelLacWeight: Number(calcForm.enamelLacWeight || 0),
                  testedPurityPercent: Number(calcForm.testedPurityPercent),
                  meltingLossPercent: Number(calcForm.meltingLossPercent || 1.0),
                });
              }}
              isLoading={createTxMutation.isPending}
            >
              Generate Official Voucher
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-3 rounded text-xs border border-amber-200 font-sans">
            <div>
              <span className="text-slate-600">Fine Gold Credit: </span>
              <strong className="font-mono">{assessmentResult?.netFineGoldGrams}g</strong>
            </div>
            <div>
              <span className="text-slate-600">Total Credit Amount: </span>
              <strong className="text-amber-900 font-mono text-sm">₹{assessmentResult?.totalValuation?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <Input
            label="Customer Full Name *"
            placeholder="e.g. Ananya Sharma"
            value={customerForm.customerName}
            onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone *"
              placeholder="+91 9876543210"
              value={customerForm.customerPhone}
              onChange={(e) => setCustomerForm({ ...customerForm, customerPhone: e.target.value })}
            />
            <Input
              label="PAN Card Number (Mandatory for ≥ ₹2 Lakh)"
              placeholder="e.g. ABCDE1234F"
              value={customerForm.customerPan}
              onChange={(e) => setCustomerForm({ ...customerForm, customerPan: e.target.value.toUpperCase() })}
            />
          </div>

          <Select
            label="Settlement / Payout Mode"
            value={customerForm.paymentMode}
            onChange={(e) => setCustomerForm({ ...customerForm, paymentMode: e.target.value })}
            options={[
              { label: 'Exchange Credit against New Jewellery Purchase', value: 'EXCHANGE_CREDIT' },
              { label: 'Bank Transfer / RTGS / NEFT', value: 'BANK_TRANSFER' },
              { label: 'Cash Settlement (< ₹10,000 limit)', value: 'CASH' },
            ]}
          />

          <Input
            label="Remarks / Old Ornament Description"
            placeholder="e.g. 2 Antique Bangles with red enamel work"
            value={customerForm.notes}
            onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
          />
        </div>
      </Modal>
    </>
  );
}
