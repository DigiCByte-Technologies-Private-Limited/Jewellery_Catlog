import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { karigarApi } from '../../api/karigar.api';
import { productsApi } from '../../api/products.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import {
  Hammer,
  Plus,
  CheckCircle,
} from 'lucide-react';

export function KarigarPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'artisans'>('orders');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Karigar & Job-Work Ledger</h1>
          <p className="text-slate-500 text-sm">Craftsman metal issuance, scrap returns, wastage reconciliation, and labor tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddArtisanOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Register Karigar
          </Button>
          <Button onClick={() => setIsIssueOrderOpen(true)}>
            <Hammer className="w-4 h-4 mr-1.5" /> Issue Job-Work Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-amber-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Gold With Karigars</div>
            <div className="text-2xl font-black text-amber-950 font-mono mt-1">
              {totalGoldOutstanding.toFixed(3)} <span className="text-xs font-sans font-normal">grams</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Raw gold issued in production pipeline</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Artisans</div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              {artisans?.length || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Goldsmiths & setting craftsmen</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Job Orders</div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              {orders.filter((o: any) => o.status === 'ISSUED').length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Orders awaiting finished piece return</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'orders'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          Job-Work Orders ({orders.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'artisans'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('artisans')}
        >
          Karigar Directory ({artisans?.length || 0})
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <Table columns={orderColumns} data={orders} isLoading={ordersLoading} />
        </div>
      )}

      {activeTab === 'artisans' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <Table columns={artisanColumns} data={artisans} isLoading={artisansLoading} />
        </div>
      )}

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
    </div>
  );
}
