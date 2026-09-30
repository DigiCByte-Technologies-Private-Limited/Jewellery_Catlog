import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api/inventory.api';
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
  Plus,
  ArrowRightLeft,
  FileText,
  RotateCcw,
  Search,
  Building2,
} from 'lucide-react';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Modals state
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    productId: '',
    locationId: '',
    grossWeight: '',
    stoneWeight: '0',
    lacWeight: '0',
    huid: '',
    trayNumber: '',
  });

  const [transferToLocation, setTransferToLocation] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [memoHolderName, setMemoHolderName] = useState('');

  const [locationForm, setLocationForm] = useState({
    name: '',
    code: '',
    type: 'SHOWROOM',
    city: '',
  });

  // Queries
  const { data: summary } = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => (await inventoryApi.getSummary()).data?.data,
  });

  const { data: locations } = useQuery({
    queryKey: ['inventory', 'locations'],
    queryFn: async () => (await inventoryApi.getLocations()).data?.data || [],
  });

  const { data: tagsResponse, isLoading: tagsLoading } = useQuery({
    queryKey: ['inventory', 'tags', selectedLocation, search],
    queryFn: async () => {
      const res = await inventoryApi.getItemTags({
        locationId: selectedLocation || undefined,
        search: search || undefined,
        limit: 100,
      });
      return res.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => (await productsApi.getAll({ limit: 100 })).data?.data || [],
  });

  // Mutations
  const stockInMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createItemTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ type: 'success', title: 'Stock In Complete', message: 'Physical piece registered with HUID' });
      setIsStockInOpen(false);
      setStockInForm({ productId: '', locationId: '', grossWeight: '', stoneWeight: '0', lacWeight: '0', huid: '', trayNumber: '' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Stock in failed' });
    },
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.transferStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ type: 'success', title: 'Transferred', message: 'Stock moved to new location' });
      setIsTransferOpen(false);
      setSelectedTag(null);
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Transfer failed' });
    },
  });

  const memoMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.issueMemo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ type: 'success', title: 'Memo Issued', message: 'Item checked out on memo' });
      setIsMemoOpen(false);
      setSelectedTag(null);
      setMemoHolderName('');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Memo issue failed' });
    },
  });

  const returnMemoMutation = useMutation({
    mutationFn: (itemTagId: string) => inventoryApi.returnMemo({ itemTagId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ type: 'success', title: 'Memo Returned', message: 'Item returned to active showroom stock' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Memo return failed' });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'locations'] });
      toast({ type: 'success', title: 'Location Added', message: 'Storage location created' });
      setIsLocationModalOpen(false);
      setLocationForm({ name: '', code: '', type: 'SHOWROOM', city: '' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create location' });
    },
  });

  const tags = tagsResponse?.data || [];

  const columns = [
    {
      header: 'Item Tag / Barcode',
      cell: (r: any) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-sm">{r.tagNumber}</span>
          {r.trayNumber && <div className="text-[11px] text-slate-400">Tray: {r.trayNumber}</div>}
        </div>
      ),
    },
    {
      header: 'BIS HUID',
      cell: (r: any) => (
        r.huid ? (
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs">
            {r.huid}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Unmarked</span>
        )
      ),
    },
    {
      header: 'Design / Product',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.product?.name || 'Unassigned'}</div>
          <div className="text-xs text-slate-500 font-mono">{r.product?.sku}</div>
        </div>
      ),
    },
    {
      header: 'Weights (g)',
      cell: (r: any) => (
        <div className="text-xs font-mono space-y-0.5">
          <div>Gross: <span className="font-bold text-slate-900">{Number(r.grossWeight).toFixed(3)}g</span></div>
          <div className="text-amber-800 font-medium">Net: {Number(r.netMetalWeight).toFixed(3)}g</div>
        </div>
      ),
    },
    {
      header: 'Current Location',
      cell: (r: any) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          {r.location?.name || 'Main Vault'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
          IN_STOCK: 'success',
          ON_MEMO: 'warning',
          BOOKED: 'info',
          SOLD: 'danger',
          WITH_KARIGAR: 'warning',
        };
        return (
          <div>
            <Badge variant={variants[r.status] || 'info'}>{r.status}</Badge>
            {r.status === 'ON_MEMO' && r.memoHolderName && (
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">With: {r.memoHolderName}</div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: (r: any) => (
        <div className="flex items-center gap-1">
          {r.status === 'IN_STOCK' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                title="Transfer Location"
                onClick={() => {
                  setSelectedTag(r);
                  setIsTransferOpen(true);
                }}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Issue on Memo"
                onClick={() => {
                  setSelectedTag(r);
                  setIsMemoOpen(true);
                }}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
              </Button>
            </>
          )}

          {r.status === 'ON_MEMO' && (
            <Button
              size="sm"
              variant="outline"
              title="Return from Memo"
              onClick={() => returnMemoMutation.mutate(r.id)}
              isLoading={returnMemoMutation.isPending}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Return
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Physical Stock & Item Tags</h1>
          <p className="text-slate-500 text-sm">Individual piece tracking with BIS Hallmark HUID and multi-location balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsLocationModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-1.5" /> + Location
          </Button>
          <Button onClick={() => setIsStockInOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Stock In Physical Piece
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pieces in Vault</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {summary?.totalPieces || tags.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Gross Gold Weight</div>
            <div className="text-2xl font-extrabold text-amber-950 mt-1 font-mono">
              {Number(summary?.totalGrossWeight || 0).toFixed(3)} <span className="text-xs font-sans font-normal">g</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Net Fine Gold Weight</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1 font-mono">
              {Number(summary?.totalNetWeight || 0).toFixed(3)} <span className="text-xs font-sans font-normal">g</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Locations</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1 font-mono">
              {locations?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Search by HUID, barcode tag, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-56">
          <Select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            options={[
              { label: 'All Storage Locations', value: '' },
              ...(locations?.map((loc: any) => ({ label: `${loc.name} (${loc.code})`, value: loc.id })) || []),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={tags} isLoading={tagsLoading} />
      </div>

      {/* Stock In Modal */}
      <Modal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        title="Stock In Physical Jewellery Piece"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsStockInOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!stockInForm.productId || !stockInForm.locationId || !stockInForm.grossWeight) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Product, location, and gross weight are required' });
                  return;
                }
                stockInMutation.mutate({
                  ...stockInForm,
                  grossWeight: Number(stockInForm.grossWeight),
                  stoneWeight: Number(stockInForm.stoneWeight || 0),
                  lacWeight: Number(stockInForm.lacWeight || 0),
                });
              }}
              isLoading={stockInMutation.isPending}
            >
              Confirm Stock In
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Design SKU / Product *"
            value={stockInForm.productId}
            onChange={(e) => setStockInForm({ ...stockInForm, productId: e.target.value })}
            options={[
              { label: '-- Select Product --', value: '' },
              ...(products?.map((p: any) => ({ label: `${p.name} (${p.sku})`, value: p.id })) || []),
            ]}
          />

          <Select
            label="Initial Storage Location *"
            value={stockInForm.locationId}
            onChange={(e) => setStockInForm({ ...stockInForm, locationId: e.target.value })}
            options={[
              { label: '-- Select Location --', value: '' },
              ...(locations?.map((l: any) => ({ label: l.name, value: l.id })) || []),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="BIS Hallmark HUID (6 Characters)"
              placeholder="e.g. AB1234"
              maxLength={6}
              value={stockInForm.huid}
              onChange={(e) => setStockInForm({ ...stockInForm, huid: e.target.value.toUpperCase() })}
            />
            <Input
              label="Tray / Counter Slot Number"
              placeholder="e.g. TRAY-GOLD-04"
              value={stockInForm.trayNumber}
              onChange={(e) => setStockInForm({ ...stockInForm, trayNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Scale Gross Wt (g) *"
              type="number"
              step="0.001"
              placeholder="0.000"
              value={stockInForm.grossWeight}
              onChange={(e) => setStockInForm({ ...stockInForm, grossWeight: e.target.value })}
            />
            <Input
              label="Stone Weight (g)"
              type="number"
              step="0.001"
              value={stockInForm.stoneWeight}
              onChange={(e) => setStockInForm({ ...stockInForm, stoneWeight: e.target.value })}
            />
            <Input
              label="Lac / Wax (g)"
              type="number"
              step="0.001"
              value={stockInForm.lacWeight}
              onChange={(e) => setStockInForm({ ...stockInForm, lacWeight: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title={`Transfer Stock: ${selectedTag?.tagNumber || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!transferToLocation) {
                  toast({ type: 'warning', title: 'Required', message: 'Select destination location' });
                  return;
                }
                transferMutation.mutate({
                  itemTagId: selectedTag.id,
                  toLocationId: transferToLocation,
                  reason: transferReason,
                });
              }}
              isLoading={transferMutation.isPending}
            >
              Transfer Piece
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Moving <span className="font-semibold text-slate-900">{selectedTag?.product?.name}</span> ({selectedTag?.grossWeight}g)
            from <span className="font-semibold">{selectedTag?.location?.name}</span> to:
          </p>

          <Select
            label="Destination Location *"
            value={transferToLocation}
            onChange={(e) => setTransferToLocation(e.target.value)}
            options={[
              { label: '-- Select Destination --', value: '' },
              ...(locations
                ?.filter((l: any) => l.id !== selectedTag?.locationId)
                .map((l: any) => ({ label: `${l.name} (${l.type})`, value: l.id })) || []),
            ]}
          />

          <Input
            label="Transfer Reason"
            placeholder="e.g. Display replenishment for Counter 2"
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Memo Issue Modal */}
      <Modal
        isOpen={isMemoOpen}
        onClose={() => setIsMemoOpen(false)}
        title={`Issue on Memo: ${selectedTag?.tagNumber || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMemoOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!memoHolderName.trim()) {
                  toast({ type: 'warning', title: 'Required', message: 'Enter name of memo recipient' });
                  return;
                }
                memoMutation.mutate({
                  itemTagId: selectedTag.id,
                  memoHolderName,
                });
              }}
              isLoading={memoMutation.isPending}
            >
              Issue Memo Slip
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Issuing <span className="font-semibold text-slate-900">{selectedTag?.product?.name}</span> ({selectedTag?.grossWeight}g) on temporary memo approval:
          </p>
          <Input
            label="Memo Recipient / Client / Staff Name *"
            placeholder="e.g. VIP Customer Rajesh V. / Showroom Manager"
            value={memoHolderName}
            onChange={(e) => setMemoHolderName(e.target.value)}
          />
        </div>
      </Modal>

      {/* Add Location Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Add Storage Location"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!locationForm.name || !locationForm.code) {
                  toast({ type: 'warning', title: 'Required', message: 'Name and code are required' });
                  return;
                }
                createLocationMutation.mutate(locationForm);
              }}
              isLoading={createLocationMutation.isPending}
            >
              Save Location
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Location Name *"
            placeholder="e.g. Counter 3 - Bridal Necklaces"
            value={locationForm.name}
            onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
          />
          <Input
            label="Location Code (Unique) *"
            placeholder="e.g. CNTR-03"
            value={locationForm.code}
            onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
          />
          <Select
            label="Location Type"
            value={locationForm.type}
            onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
            options={[
              { label: 'Showroom Counter / Display', value: 'SHOWROOM' },
              { label: 'Central Safe / Vault', value: 'VAULT' },
              { label: 'Warehouse / Central Depot', value: 'WAREHOUSE' },
              { label: 'Karigar Workshop', value: 'KARIGAR' },
            ]}
          />
          <Input
            label="City / Branch"
            placeholder="e.g. Hyderabad Main Branch"
            value={locationForm.city}
            onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
