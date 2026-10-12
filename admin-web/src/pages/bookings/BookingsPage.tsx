import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.api';
import { customersApi } from '../../api/customers.api';
import { productsApi } from '../../api/products.api';
import { metalRatesApi } from '../../api/metal-rates.api';
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
  Lock,
  Plus,
  CheckCircle,
  Calendar,
  RotateCcw,
} from 'lucide-react';

export function BookingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBookingToSettle, setSelectedBookingToSettle] = useState<any>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    customerId: '',
    productId: '',
    metalType: 'GOLD',
    purity: 'K22',
    estimatedGrossWeight: '',
    lockedMetalRatePerGram: '',
    advanceAmountPaid: '',
    advancePaymentMode: 'UPI',
    targetDeliveryDate: '',
    notes: '',
  });

  // Settle Form State
  const [settleForm, setSettleForm] = useState({
    actualNetWeight: '',
    makingCharges: '',
    stoneValue: '0',
    discount: '0',
  });

  // Queries
  const { data: bookingsResponse, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: async () => (await bookingsApi.getAll({ status: statusFilter || undefined, limit: 100 })).data?.data || [],
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: async () => (await customersApi.getAll({ limit: 100 })).data?.data || [],
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => (await productsApi.getAll({ limit: 100 })).data?.data || [],
  });

  const { data: latestRates } = useQuery({
    queryKey: ['metal-rates', 'latest'],
    queryFn: async () => (await metalRatesApi.getLatest()).data?.data || [],
  });

  // Set default locked rate when metal or purity changes
  const activeRateForPurity = latestRates?.find(
    (r: any) => r.metalType === createForm.metalType && r.purity === createForm.purity,
  );

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        type: 'success',
        title: 'Booking Confirmed',
        message: `${res.data?.message || 'Rate locked and advance recorded'}`,
      });
      setIsCreateOpen(false);
      setCreateForm({
        customerId: '',
        productId: '',
        metalType: 'GOLD',
        purity: 'K22',
        estimatedGrossWeight: '',
        lockedMetalRatePerGram: '',
        advanceAmountPaid: '',
        advancePaymentMode: 'UPI',
        targetDeliveryDate: '',
        notes: '',
      });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create booking' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ type: 'success', title: 'Status Updated', message: 'Booking progressed' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Update failed' });
    },
  });

  const settleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => bookingsApi.settle(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      const s = res.data?.data?.settlement;
      toast({
        type: 'success',
        title: 'Settled & Delivered',
        message: `Delivery completed against locked rate. Balance collected: ₹${s?.balancePayable?.toLocaleString('en-IN')}`,
      });
      setSelectedBookingToSettle(null);
      setSettleForm({ actualNetWeight: '', makingCharges: '', stoneValue: '0', discount: '0' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Settlement failed' });
    },
  });

  const bookings = bookingsResponse || [];

  const totalLockedWeight = bookings
    .filter((b: any) => b.status !== 'SETTLED' && b.status !== 'CANCELLED')
    .reduce((s: number, b: any) => s + Number(b.estimatedGrossWeight || 0), 0);

  const totalAdvanceCollected = bookings
    .filter((b: any) => b.status !== 'CANCELLED')
    .reduce((s: number, b: any) => s + Number(b.advanceAmountPaid || 0), 0);

  const columns = [
    {
      header: 'Booking #',
      cell: (r: any) => (
        <span className="font-mono font-bold text-amber-950 text-xs">{r.bookingNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm">{r.customer?.fullName || '—'}</div>
          <div className="text-xs text-slate-500 font-mono">{r.customer?.phone}</div>
        </div>
      ),
    },
    {
      header: 'Design / Metal',
      cell: (r: any) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{r.product?.name || 'Custom Wedding Order'}</div>
          <div className="text-slate-500">{r.metalType} {r.purity} · {r.estimatedGrossWeight}g est.</div>
        </div>
      ),
    },
    {
      header: 'Locked Gold Rate',
      cell: (r: any) => (
        <div className="flex items-center gap-1.5 font-mono">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-amber-900 text-sm">
            ₹{Number(r.lockedMetalRatePerGram).toLocaleString('en-IN')}/g
          </span>
        </div>
      ),
    },
    {
      header: 'Advance Paid',
      cell: (r: any) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-emerald-700">₹{Number(r.advanceAmountPaid).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400">{r.advancePaymentMode}</div>
        </div>
      ),
    },
    {
      header: 'Target Delivery',
      cell: (r: any) => (
        r.targetDeliveryDate ? (
          <div className="text-xs text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(r.targetDeliveryDate).toLocaleDateString()}</span>
          </div>
        ) : '—'
      ),
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
          CONFIRMED: 'info',
          IN_MAKING: 'warning',
          READY: 'warning',
          SETTLED: 'success',
          CANCELLED: 'danger',
        };
        return <Badge variant={variants[r.status] || 'info'}>{r.status?.replace('_', ' ')}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (r: any) => (
        <div className="flex items-center gap-1">
          {r.status === 'CONFIRMED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'IN_MAKING' })}
            >
              Start Making
            </Button>
          )}

          {r.status === 'IN_MAKING' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'READY' })}
            >
              Mark Ready
            </Button>
          )}

          {r.status === 'READY' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedBookingToSettle(r);
                setSettleForm({
                  actualNetWeight: String(r.estimatedGrossWeight),
                  makingCharges: '4500',
                  stoneValue: '0',
                  discount: '0',
                });
              }}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Settle & Deliver
            </Button>
          )}

          {r.status === 'SETTLED' && (
            <span className="text-xs text-slate-400 font-mono">
              Total: ₹{Number(r.finalSettlementAmount).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      ),
    },
  ];

  // Filtered dataset
  const filteredBookings = bookings.filter((b: any) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesBooking = b.bookingNumber?.toLowerCase().includes(q);
      const matchesCustomer = b.customer?.fullName?.toLowerCase().includes(q) || b.customer?.phone?.toLowerCase().includes(q);
      const matchesProduct = b.product?.name?.toLowerCase().includes(q) || b.product?.sku?.toLowerCase().includes(q);
      if (!matchesBooking && !matchesCustomer && !matchesProduct) return false;
    }
    return true;
  });

  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedBookings = filteredBookings.slice((page - 1) * limit, page * limit);

  const statWidgets: StatWidget[] = [
    {
      label: 'Locked Gold Committed',
      value: `${totalLockedWeight.toFixed(2)}g`,
      subtext: 'Promised under rate-lock contract',
      variant: 'gold',
      onClick: () => {
        setStatusFilter('');
        setPage(1);
      },
    },
    {
      label: 'Advance Money Collected',
      value: `₹${totalAdvanceCollected.toLocaleString('en-IN')}`,
      subtext: 'Customer deposits on contracts',
      variant: 'emerald',
    },
    {
      label: 'Active Bookings Pipeline',
      value: bookings.filter((b: any) => b.status !== 'SETTLED' && b.status !== 'CANCELLED').length,
      subtext: 'In making or ready for delivery',
      variant: 'blue',
      onClick: () => {
        setStatusFilter('IN_MAKING');
        setPage(1);
      },
    },
    {
      label: 'Settled & Delivered',
      value: bookings.filter((b: any) => b.status === 'SETTLED').length,
      subtext: 'Final delivery completed',
      variant: 'default',
      onClick: () => {
        setStatusFilter('SETTLED');
        setPage(1);
      },
    },
  ];

  const filterSlot = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-64">
        <CustomDropdown
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          placeholder="All Booking Statuses"
          options={[
            { value: '', label: 'All Bookings' },
            { value: 'CONFIRMED', label: 'Confirmed Booking', badge: 'New' },
            { value: 'IN_MAKING', label: 'In Workshop / Making', badge: 'Active' },
            { value: 'READY', label: 'Ready for Delivery', badge: 'Ready' },
            { value: 'SETTLED', label: 'Settled & Delivered', badge: 'Done' },
            { value: 'CANCELLED', label: 'Cancelled Contract', badge: 'Void' },
          ]}
        />
      </div>

      {(statusFilter || search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
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
  );

  return (
    <>
      <StandardPageLayout
        title="Showroom Advance Bookings & Rate Lock"
        description="Wedding & festival pre-bookings with guaranteed benchmark rate-lock contracts"
        badge="Rate-Lock & Advance"
        stats={statWidgets}
        searchPlaceholder="Search bookings by booking #, customer, phone, or design SKU..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterSlot={filterSlot}
        primaryAction={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Advance Booking
          </Button>
        }
        isLoading={bookingsLoading}
        totalCount={totalItems}
        tableContent={<Table columns={columns} data={paginatedBookings} />}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
      />

      {/* Create Booking Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Advance Booking & Lock Rate Contract"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!createForm.customerId || !createForm.estimatedGrossWeight || !createForm.advanceAmountPaid) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Customer, estimated weight, and advance amount required' });
                  return;
                }
                createBookingMutation.mutate({
                  ...createForm,
                  estimatedGrossWeight: Number(createForm.estimatedGrossWeight),
                  lockedMetalRatePerGram: createForm.lockedMetalRatePerGram ? Number(createForm.lockedMetalRatePerGram) : undefined,
                  advanceAmountPaid: Number(createForm.advanceAmountPaid),
                });
              }}
              isLoading={createBookingMutation.isPending}
            >
              Sign Contract & Lock Rate
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Customer *"
            value={createForm.customerId}
            onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
            options={[
              { label: '-- Select Customer --', value: '' },
              ...(customers?.map((c: any) => ({ label: `${c.fullName} (${c.phone})`, value: c.id })) || []),
            ]}
          />

          <Select
            label="Product Design (Optional)"
            value={createForm.productId}
            onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })}
            options={[
              { label: 'Custom Specification / Order', value: '' },
              ...(products?.map((p: any) => ({ label: `${p.name} (${p.sku})`, value: p.id })) || []),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Metal Type"
              value={createForm.metalType}
              onChange={(e) => setCreateForm({ ...createForm, metalType: e.target.value })}
              options={[
                { label: 'Gold', value: 'GOLD' },
                { label: 'Silver', value: 'SILVER' },
              ]}
            />
            <Select
              label="Purity"
              value={createForm.purity}
              onChange={(e) => setCreateForm({ ...createForm, purity: e.target.value })}
              options={[
                { label: '22K (91.6% Hallmark)', value: 'K22' },
                { label: '18K (75.0% Fine)', value: 'K18' },
                { label: '24K (99.9% Pure)', value: 'K24' },
                { label: '999 Fine Silver', value: 'SILVER_999' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Gross Weight (g) *"
              type="number"
              step="0.001"
              placeholder="e.g. 25.000"
              value={createForm.estimatedGrossWeight}
              onChange={(e) => setCreateForm({ ...createForm, estimatedGrossWeight: e.target.value })}
            />

            <div>
              <Input
                label="Locked Rate per Gram (₹) *"
                type="number"
                placeholder={activeRateForPurity ? String(activeRateForPurity.ratePerGram) : 'e.g. 5683'}
                value={createForm.lockedMetalRatePerGram || (activeRateForPurity ? String(activeRateForPurity.ratePerGram) : '')}
                onChange={(e) => setCreateForm({ ...createForm, lockedMetalRatePerGram: e.target.value })}
              />
              <span className="text-[11px] text-slate-400">Defaults to today's active rate</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Advance Amount Paid (₹) *"
              type="number"
              placeholder="e.g. 20000"
              value={createForm.advanceAmountPaid}
              onChange={(e) => setCreateForm({ ...createForm, advanceAmountPaid: e.target.value })}
            />
            <Select
              label="Advance Payment Mode"
              value={createForm.advancePaymentMode}
              onChange={(e) => setCreateForm({ ...createForm, advancePaymentMode: e.target.value })}
              options={[
                { label: 'UPI / QR Code', value: 'UPI' },
                { label: 'Credit / Debit Card', value: 'CARD' },
                { label: 'Cash Settlement', value: 'CASH' },
                { label: 'Old Gold Exchange Credit', value: 'OLD_GOLD_CREDIT' },
                { label: 'Bank Transfer / NEFT', value: 'BANK_TRANSFER' },
              ]}
            />
          </div>

          <Input
            label="Target Delivery Date"
            type="date"
            value={createForm.targetDeliveryDate}
            onChange={(e) => setCreateForm({ ...createForm, targetDeliveryDate: e.target.value })}
          />
        </div>
      </Modal>

      {/* Settle & Deliver Modal */}
      <Modal
        isOpen={Boolean(selectedBookingToSettle)}
        onClose={() => setSelectedBookingToSettle(null)}
        title={`Final Delivery Settlement: ${selectedBookingToSettle?.bookingNumber || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedBookingToSettle(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!settleForm.actualNetWeight || Number(settleForm.actualNetWeight) <= 0) {
                  toast({ type: 'warning', title: 'Required', message: 'Actual scale weight is required' });
                  return;
                }
                settleMutation.mutate({
                  id: selectedBookingToSettle.id,
                  data: {
                    actualNetWeight: Number(settleForm.actualNetWeight),
                    makingCharges: Number(settleForm.makingCharges || 0),
                    stoneValue: Number(settleForm.stoneValue || 0),
                    discount: Number(settleForm.discount || 0),
                  },
                });
              }}
              isLoading={settleMutation.isPending}
            >
              Complete Settlement & Handover
            </Button>
          </div>
        }
      >
        {selectedBookingToSettle && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs space-y-1 font-sans">
              <div className="flex justify-between">
                <span>Customer: <strong>{selectedBookingToSettle.customer?.fullName}</strong></span>
                <span>Locked Rate: <strong className="font-mono text-amber-900">₹{selectedBookingToSettle.lockedMetalRatePerGram}/g</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Advance Paid: <strong className="font-mono text-emerald-800">₹{Number(selectedBookingToSettle.advanceAmountPaid).toLocaleString('en-IN')}</strong></span>
                <span>Target: <strong>{selectedBookingToSettle.estimatedGrossWeight}g</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Actual Net Metal Weight (g) *"
                type="number"
                step="0.001"
                placeholder="Scale net weight"
                value={settleForm.actualNetWeight}
                onChange={(e) => setSettleForm({ ...settleForm, actualNetWeight: e.target.value })}
              />
              <Input
                label="Making Charges (₹)"
                type="number"
                value={settleForm.makingCharges}
                onChange={(e) => setSettleForm({ ...settleForm, makingCharges: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stone Value (₹)"
                type="number"
                value={settleForm.stoneValue}
                onChange={(e) => setSettleForm({ ...settleForm, stoneValue: e.target.value })}
              />
              <Input
                label="Special Discount (₹)"
                type="number"
                value={settleForm.discount}
                onChange={(e) => setSettleForm({ ...settleForm, discount: e.target.value })}
              />
            </div>

            {settleForm.actualNetWeight && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono space-y-1">
                {(() => {
                  const locked = Number(selectedBookingToSettle.lockedMetalRatePerGram);
                  const net = Number(settleForm.actualNetWeight);
                  const metal = net * locked;
                  const mc = Number(settleForm.makingCharges || 0);
                  const st = Number(settleForm.stoneValue || 0);
                  const disc = Number(settleForm.discount || 0);
                  const taxable = metal + mc + st;
                  const gst = taxable * 0.03;
                  const total = Math.round(taxable + gst - disc);
                  const advance = Number(selectedBookingToSettle.advanceAmountPaid);
                  const balance = Math.max(0, total - advance);

                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Metal Value ({net}g × ₹{locked}):</span>
                        <span>₹{metal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Making + Stones:</span>
                        <span>₹{(mc + st).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST 3%:</span>
                        <span>₹{gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t text-slate-800">
                        <span>Total Customer Bill:</span>
                        <span>₹{total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Less Advance Paid:</span>
                        <span>-₹{advance.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t text-sm font-extrabold text-amber-950 bg-amber-100 p-2 rounded">
                        <span>Balance Payable on Delivery:</span>
                        <span>₹{balance.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
