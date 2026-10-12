import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { karigarApi } from '../../api/karigar.api';
import { productsApi } from '../../api/products.api';
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
import { useToast } from '../../components/ui/Toast';
import {
  Hammer,
  Plus,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

export function KarigarPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'artisans'>('orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedArtisanId, setSelectedArtisanId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isAddArtisanOpen, setIsAddArtisanOpen] = useState(false);
  const [isIssueOrderOpen, setIsIssueOrderOpen] = useState(false);
  const [selectedOrderToReceive, setSelectedOrderToReceive] = useState<any>(null);

  // Forms
  const [artisanForm, setArtisanForm] = useState({
    name: '',
    code: '',
    phone: '',
    skills: '',
    defaultMakingChargeRate: '350',
  });

  const [issueForm, setIssueForm] = useState({
    karigarId: '',
    productId: '',
    metalType: 'GOLD',
    purity: 'K22',
    issuedWeight: '',
    allowedWastagePercent: '1.5',
    laborCharges: '0',
    notes: '',
  });

  const [receiveForm, setReceiveForm] = useState({
    finishedWeight: '',
    scrapWeight: '0',
    laborCharges: '',
    notes: '',
  });

  // Queries
  const { data: artisans, isLoading: artisansLoading } = useQuery({
    queryKey: ['karigar', 'artisans'],
    queryFn: async () => (await karigarApi.getArtisans()).data?.data || [],
  });

  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['karigar', 'orders'],
    queryFn: async () => (await karigarApi.getOrders()).data?.data || [],
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => (await productsApi.getAll({ limit: 100 })).data?.data || [],
  });

  // Mutations
  const createArtisanMutation = useMutation({
    mutationFn: (data: any) => karigarApi.createArtisan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karigar'] });
      toast({ type: 'success', title: 'Artisan Registered', message: 'Karigar profile added' });
      setIsAddArtisanOpen(false);
      setArtisanForm({ name: '', code: '', phone: '', skills: '', defaultMakingChargeRate: '350' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to add artisan' });
    },
  });

  const issueOrderMutation = useMutation({
    mutationFn: (data: any) => karigarApi.issueOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karigar'] });
      toast({ type: 'success', title: 'Order Issued', message: 'Gold issued to karigar ledger' });
      setIsIssueOrderOpen(false);
      setIssueForm({ karigarId: '', productId: '', metalType: 'GOLD', purity: 'K22', issuedWeight: '', allowedWastagePercent: '1.5', laborCharges: '0', notes: '' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to issue order' });
    },
  });

  const receiveOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => karigarApi.receiveOrder(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['karigar'] });
      const rec = res.data?.data?.reconciliation;
      toast({
        type: 'success',
        title: 'Reconciled',
        message: `Finished piece received. Variance: ${rec?.netDifferenceGrams}g`,
      });
      setSelectedOrderToReceive(null);
      setReceiveForm({ finishedWeight: '', scrapWeight: '0', laborCharges: '', notes: '' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to receive order' });
    },
  });

  const orders = ordersResponse || [];

  // Total metal currently held by all artisans
  const totalGoldOutstanding = artisans?.reduce((sum: number, a: any) => sum + Number(a.goldBalanceGrams || 0), 0) || 0;

  const orderColumns = [
    {
      header: 'Order #',
      cell: (r: any) => (
        <span className="font-mono font-bold text-slate-900 text-xs">{r.orderNumber}</span>
      ),
    },
    {
      header: 'Artisan / Karigar',
      cell: (r: any) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{r.karigar?.name || '—'}</span>
          <div className="text-xs text-slate-500 font-mono">{r.karigar?.code}</div>
        </div>
      ),
    },
    {
      header: 'Design SKU',
      cell: (r: any) => r.product?.name || 'Custom Order',
    },
    {
      header: 'Metal Issued',
      cell: (r: any) => (
        <span className="font-mono font-bold text-amber-800 text-xs">
          {Number(r.issuedWeight).toFixed(3)}g ({r.metalType} {r.purity})
        </span>
      ),
    },
    {
      header: 'Finished Piece',
      cell: (r: any) => (
        r.finishedWeight ? (
          <span className="font-mono text-slate-800 text-xs">{Number(r.finishedWeight).toFixed(3)}g</span>
        ) : (
          <span className="text-slate-400 text-xs italic">In making</span>
        )
      ),
    },
    {
      header: 'Variance',
      cell: (r: any) => {
        if (r.netDifferenceGrams === null || r.netDifferenceGrams === undefined) return <span className="text-slate-400">—</span>;
        const diff = Number(r.netDifferenceGrams);
        return (
          <span className={`font-mono text-xs font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
            {diff > 0 ? `+${diff.toFixed(3)}g loss` : `${diff.toFixed(3)}g`}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
          ISSUED: 'info',
          IN_PROGRESS: 'warning',
          RECONCILED: 'success',
          CANCELLED: 'danger',
        };
        return <Badge variant={variants[r.status] || 'info'}>{r.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (r: any) =>
        r.status === 'ISSUED' || r.status === 'IN_PROGRESS' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedOrderToReceive(r);
              setReceiveForm({
                finishedWeight: '',
                scrapWeight: '0',
                laborCharges: r.laborCharges ? String(r.laborCharges) : '',
                notes: '',
              });
            }}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Receive & Reconcile
          </Button>
        ) : (
          <span className="text-xs text-slate-400 font-mono">
            Labor: ₹{Number(r.laborCharges).toLocaleString('en-IN')}
          </span>
        ),
    },
  ];

  const artisanColumns = [
    {
      header: 'Craftsman Name',
      cell: (r: any) => (
        <div>
          <span className="font-semibold text-slate-900 text-sm">{r.name}</span>
          <div className="text-xs text-slate-500 font-mono">{r.code} · {r.phone}</div>
        </div>
      ),
    },
    { header: 'Specialized Skills', accessorKey: 'skills' },
    {
      header: 'Gold Balance Held',
      cell: (r: any) => (
        <span className="font-mono font-bold text-amber-900 text-sm">
          {Number(r.goldBalanceGrams || 0).toFixed(3)} g
        </span>
      ),
    },
    {
      header: 'Silver Balance Held',
      cell: (r: any) => (
        <span className="font-mono text-slate-700 text-xs">
          {Number(r.silverBalanceGrams || 0).toFixed(3)} g
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (r: any) => (
        <Badge variant={r.isActive ? 'success' : 'danger'}>
          {r.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
  ];

  // Filtered datasets
  const filteredOrders = orders.filter((o: any) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (selectedArtisanId && o.karigarId !== selectedArtisanId) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesOrder = o.orderNumber?.toLowerCase().includes(q);
      const matchesArtisan = o.karigar?.name?.toLowerCase().includes(q) || o.karigar?.code?.toLowerCase().includes(q);
      const matchesProduct = o.product?.name?.toLowerCase().includes(q) || o.product?.sku?.toLowerCase().includes(q);
      if (!matchesOrder && !matchesArtisan && !matchesProduct) return false;
    }
    return true;
  });

  const filteredArtisans = (artisans || []).filter((a: any) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesName = a.name?.toLowerCase().includes(q);
      const matchesCode = a.code?.toLowerCase().includes(q);
      const matchesPhone = a.phone?.toLowerCase().includes(q);
      const matchesSkills = a.skills?.toLowerCase().includes(q);
      if (!matchesName && !matchesCode && !matchesPhone && !matchesSkills) return false;
    }
    return true;
  });

  const currentData = activeTab === 'orders' ? filteredOrders : filteredArtisans;
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedData = currentData.slice((page - 1) * limit, page * limit);

  const statWidgets: StatWidget[] = [
    {
      label: 'Gold With Karigars',
      value: `${totalGoldOutstanding.toFixed(2)}g`,
      subtext: 'Raw metal in production',
      variant: 'gold',
    },
    {
      label: 'Active Artisans',
      value: artisans?.length || 0,
      subtext: 'Goldsmiths & setting craftsmen',
      variant: 'default',
      onClick: () => {
        setActiveTab('artisans');
        setPage(1);
      },
    },
    {
      label: 'Open Job Orders',
      value: orders.filter((o: any) => o.status === 'ISSUED').length,
      subtext: 'Awaiting finished returns',
      variant: 'blue',
      onClick: () => {
        setActiveTab('orders');
        setStatusFilter('ISSUED');
        setPage(1);
      },
    },
    {
      label: 'Completed Orders',
      value: orders.filter((o: any) => o.status === 'RECEIVED').length,
      subtext: 'Reconciled & vaulted pieces',
      variant: 'emerald',
      onClick: () => {
        setActiveTab('orders');
        setStatusFilter('RECEIVED');
        setPage(1);
      },
    },
  ];

  const filterSlot = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => {
            setActiveTab('orders');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'orders'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Job-Work Orders ({orders.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('artisans');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'artisans'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Karigar Directory ({artisans?.length || 0})
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56">
            <CustomDropdown
              value={selectedArtisanId}
              onChange={(val) => {
                setSelectedArtisanId(val);
                setPage(1);
              }}
              placeholder="All Artisans"
              options={[
                { value: '', label: 'All Karigars / Artisans' },
                ...(artisans?.map((a: any) => ({
                  value: a.id,
                  label: a.name,
                  badge: a.code,
                })) || []),
              ]}
            />
          </div>

          <div className="w-48">
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Order Statuses' },
                { value: 'ISSUED', label: 'Issued / In Progress', badge: 'Active' },
                { value: 'RECEIVED', label: 'Received & Reconciled', badge: 'Done' },
                { value: 'CANCELLED', label: 'Cancelled', badge: 'Void' },
              ]}
            />
          </div>

          {(selectedArtisanId || statusFilter || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedArtisanId('');
                setStatusFilter('');
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
        title="Karigar & Job-Work Ledger"
        description="Craftsman metal issuance, scrap returns, wastage reconciliation, and labor tracking"
        badge="Manufacturing & Workshop"
        stats={statWidgets}
        searchPlaceholder={activeTab === 'orders' ? 'Search orders by #, craftsman, product...' : 'Search artisans by name, code, phone, skills...'}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterSlot={filterSlot}
        primaryAction={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddArtisanOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Register Karigar
            </Button>
            <Button size="sm" onClick={() => setIsIssueOrderOpen(true)}>
              <Hammer className="w-4 h-4 mr-1.5" /> Issue Job Order
            </Button>
          </div>
        }
        isLoading={activeTab === 'orders' ? ordersLoading : artisansLoading}
        totalCount={totalItems}
        tableContent={
          <Table
            columns={activeTab === 'orders' ? orderColumns : artisanColumns}
            data={paginatedData}
            isLoading={activeTab === 'orders' ? ordersLoading : artisansLoading}
          />
        }
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
      />

      {/* Register Karigar Modal */}
      <Modal
        isOpen={isAddArtisanOpen}
        onClose={() => setIsAddArtisanOpen(false)}
        title="Register Karigar / Goldsmith"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddArtisanOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!artisanForm.name || !artisanForm.code || !artisanForm.phone) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Name, code, and phone are required' });
                  return;
                }
                createArtisanMutation.mutate(artisanForm);
              }}
              isLoading={createArtisanMutation.isPending}
            >
              Save Profile
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Karigar Full Name *"
            placeholder="e.g. Ramesh Soni"
            value={artisanForm.name}
            onChange={(e) => setArtisanForm({ ...artisanForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Karigar Code (Unique) *"
              placeholder="e.g. KRG-001"
              value={artisanForm.code}
              onChange={(e) => setArtisanForm({ ...artisanForm, code: e.target.value.toUpperCase() })}
            />
            <Input
              label="Contact Phone *"
              placeholder="+91 9876543210"
              value={artisanForm.phone}
              onChange={(e) => setArtisanForm({ ...artisanForm, phone: e.target.value })}
            />
          </div>
          <Input
            label="Specialized Skills"
            placeholder="e.g. Filigree, Kundan Setting, Casting, Hand Chains"
            value={artisanForm.skills}
            onChange={(e) => setArtisanForm({ ...artisanForm, skills: e.target.value })}
          />
          <Input
            label="Default Making Charge Rate (₹/g)"
            type="number"
            value={artisanForm.defaultMakingChargeRate}
            onChange={(e) => setArtisanForm({ ...artisanForm, defaultMakingChargeRate: e.target.value })}
          />
        </div>
      </Modal>

      {/* Issue Job Order Modal */}
      <Modal
        isOpen={isIssueOrderOpen}
        onClose={() => setIsIssueOrderOpen(false)}
        title="Issue Gold / Silver to Karigar"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsIssueOrderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!issueForm.karigarId || !issueForm.issuedWeight || Number(issueForm.issuedWeight) <= 0) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Karigar and issued weight are required' });
                  return;
                }
                issueOrderMutation.mutate({
                  ...issueForm,
                  issuedWeight: Number(issueForm.issuedWeight),
                  allowedWastagePercent: Number(issueForm.allowedWastagePercent || 1.5),
                  laborCharges: Number(issueForm.laborCharges || 0),
                });
              }}
              isLoading={issueOrderMutation.isPending}
            >
              Issue Metal Order
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Select Karigar *"
            value={issueForm.karigarId}
            onChange={(e) => setIssueForm({ ...issueForm, karigarId: e.target.value })}
            options={[
              { label: '-- Select Karigar --', value: '' },
              ...(artisans?.map((a: any) => ({ label: `${a.name} (${a.code}) - Balance: ${a.goldBalanceGrams}g`, value: a.id })) || []),
            ]}
          />

          <Select
            label="Target Product / Design (Optional)"
            value={issueForm.productId}
            onChange={(e) => setIssueForm({ ...issueForm, productId: e.target.value })}
            options={[
              { label: '-- Select Product SKU --', value: '' },
              ...(products?.map((p: any) => ({ label: `${p.name} (${p.sku})`, value: p.id })) || []),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Metal Type"
              value={issueForm.metalType}
              onChange={(e) => setIssueForm({ ...issueForm, metalType: e.target.value })}
              options={[
                { label: 'Gold', value: 'GOLD' },
                { label: 'Silver', value: 'SILVER' },
              ]}
            />
            <Select
              label="Purity"
              value={issueForm.purity}
              onChange={(e) => setIssueForm({ ...issueForm, purity: e.target.value })}
              options={[
                { label: '24K (Fine Grains/Bars)', value: 'K24' },
                { label: '22K (Standard Alloy)', value: 'K22' },
                { label: '18K (Fine Alloy)', value: 'K18' },
                { label: '999 Fine Silver', value: 'SILVER_999' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issued Metal Weight (g) *"
              type="number"
              step="0.001"
              placeholder="e.g. 50.000"
              value={issueForm.issuedWeight}
              onChange={(e) => setIssueForm({ ...issueForm, issuedWeight: e.target.value })}
            />
            <Input
              label="Allowed Wastage %"
              type="number"
              step="0.1"
              placeholder="1.5"
              value={issueForm.allowedWastagePercent}
              onChange={(e) => setIssueForm({ ...issueForm, allowedWastagePercent: e.target.value })}
            />
          </div>

          <Input
            label="Agreed Labor Charges / Majuri (₹)"
            type="number"
            placeholder="e.g. 5000"
            value={issueForm.laborCharges}
            onChange={(e) => setIssueForm({ ...issueForm, laborCharges: e.target.value })}
          />
        </div>
      </Modal>

      {/* Receive Finished Piece & Reconcile Modal */}
      <Modal
        isOpen={Boolean(selectedOrderToReceive)}
        onClose={() => setSelectedOrderToReceive(null)}
        title={`Receive & Reconcile: ${selectedOrderToReceive?.orderNumber || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedOrderToReceive(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!receiveForm.finishedWeight || Number(receiveForm.finishedWeight) <= 0) {
                  toast({ type: 'warning', title: 'Required', message: 'Scale weight of finished piece is required' });
                  return;
                }
                receiveOrderMutation.mutate({
                  id: selectedOrderToReceive.id,
                  data: {
                    finishedWeight: Number(receiveForm.finishedWeight),
                    scrapWeight: Number(receiveForm.scrapWeight || 0),
                    laborCharges: receiveForm.laborCharges ? Number(receiveForm.laborCharges) : undefined,
                    notes: receiveForm.notes,
                  },
                });
              }}
              isLoading={receiveOrderMutation.isPending}
            >
              Complete Reconciliation
            </Button>
          </div>
        }
      >
        {selectedOrderToReceive && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs space-y-1">
              <div>
                <span className="font-semibold text-slate-700">Artisan: </span>
                <span>{selectedOrderToReceive.karigar?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Metal Issued: <strong className="font-mono">{selectedOrderToReceive.issuedWeight}g</strong></span>
                <span>Allowed Wastage ({selectedOrderToReceive.allowedWastagePercent}%): <strong className="font-mono">{selectedOrderToReceive.allowedWastageGrams}g</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Finished Piece Weight (g) *"
                type="number"
                step="0.001"
                placeholder="Scale reading (e.g. 42.150)"
                value={receiveForm.finishedWeight}
                onChange={(e) => setReceiveForm({ ...receiveForm, finishedWeight: e.target.value })}
              />
              <Input
                label="Returned Scrap / Dust (g)"
                type="number"
                step="0.001"
                placeholder="0.000"
                value={receiveForm.scrapWeight}
                onChange={(e) => setReceiveForm({ ...receiveForm, scrapWeight: e.target.value })}
              />
            </div>

            <Input
              label="Final Labor / Majuri Amount (₹)"
              type="number"
              value={receiveForm.laborCharges}
              onChange={(e) => setReceiveForm({ ...receiveForm, laborCharges: e.target.value })}
            />

            {receiveForm.finishedWeight && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono">
                <div className="flex justify-between">
                  <span>Issued:</span>
                  <span>{selectedOrderToReceive.issuedWeight}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Returned (Piece + Scrap):</span>
                  <span>{(Number(receiveForm.finishedWeight) + Number(receiveForm.scrapWeight || 0)).toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowed Loss:</span>
                  <span>{selectedOrderToReceive.allowedWastageGrams}g</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-bold">
                  <span>Reconciliation Variance:</span>
                  <span className={
                    Number(selectedOrderToReceive.issuedWeight) - (Number(receiveForm.finishedWeight) + Number(receiveForm.scrapWeight || 0) + Number(selectedOrderToReceive.allowedWastageGrams)) > 0
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }>
                    {(Number(selectedOrderToReceive.issuedWeight) - (Number(receiveForm.finishedWeight) + Number(receiveForm.scrapWeight || 0) + Number(selectedOrderToReceive.allowedWastageGrams))).toFixed(3)}g
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
