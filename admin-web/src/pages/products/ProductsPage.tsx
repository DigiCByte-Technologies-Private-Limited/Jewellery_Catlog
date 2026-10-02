import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products.api';
import { metalRatesApi } from '../../api/metal-rates.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import {
  Plus,
  Eye,
  Copy,
  Trash2,
  Sparkles,
  Crown,
  Gem,
  CheckCircle2,
  Scale,
  Clock,
  Download,
  Flame,
} from 'lucide-react';

export function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [metalType, setMetalType] = useState('');
  const [purity, setPurity] = useState('');
  const [weightRange, setWeightRange] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [priceBreakdownData, setPriceBreakdownData] = useState<any>(null);

  // Queries
  const { data: response, isLoading } = useQuery({
    queryKey: ['products', search, metalType, purity, weightRange, status, currentPage, itemsPerPage],
    queryFn: async () => {
      const res = await productsApi.getAll({
        search: search || undefined,
        metalType: metalType || undefined,
        purity: purity || undefined,
        weightRange: weightRange || undefined,
        status: status || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      return res.data;
    },
  });

  const { data: latestRates } = useQuery({
    queryKey: ['metal-rates', 'ticker'],
    queryFn: async () => {
      const res = await metalRatesApi.getLatest();
      return res.data?.data || [];
    },
  });

  const products = response?.data || [];
  const totalItems = response?.meta?.total ?? response?.total ?? products.length;
  const totalPages = response?.meta?.totalPages ?? Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Rate for quick preview calculations (e.g. 22K gold rate)
  const gold22K = latestRates?.find(
    (r: any) => r.metalType === 'GOLD' && r.purity === 'K22'
  );
  const gold22Rate = gold22K ? Number(gold22K.ratePerGram) : 5683;

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        type: 'success',
        title: 'Duplicated',
        message: 'Product duplicated as draft specification',
      });
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to duplicate product',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        type: 'success',
        title: 'Deleted',
        message: 'Product permanently removed from catalog',
      });
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to delete product',
      });
    },
  });

  // Fetch live price breakdown
  const handleViewPrice = async (id: string) => {
    try {
      const res = await productsApi.getPriceBreakdown(id);
      setPriceBreakdownData(res.data?.data);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to fetch price',
      });
    }
  };

  // KPI Calculations
  const totalGrossWeight = products.reduce(
    (s: number, p: any) => s + Number(p.grossWeight || 0),
    0
  );
  const publishedCount = products.filter(
    (p: any) => p.status === 'PUBLISHED'
  ).length;
  const pendingCount = products.filter(
    (p: any) => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL'
  ).length;

  const stats: StatWidget[] = [
    {
      label: 'Catalog SKUs',
      value: totalItems.toLocaleString('en-IN'),
      subtext: 'Master registered designs',
      variant: 'gold',
      watermarkIcon: <Gem className="w-16 h-16" />,
    },
    {
      label: 'Showroom Published',
      value: publishedCount.toLocaleString('en-IN'),
      subtext: 'Live on customer catalog & POS',
      variant: 'emerald',
      watermarkIcon: <CheckCircle2 className="w-16 h-16" />,
    },
    {
      label: 'Total Gold Weight',
      value: `${totalGrossWeight.toFixed(2)} g`,
      subtext: `~${(totalGrossWeight / 1000).toFixed(3)} kg in catalog pieces`,
      variant: 'blue',
      watermarkIcon: <Scale className="w-16 h-16" />,
    },
    {
      label: 'Drafts & In-Review',
      value: pendingCount.toLocaleString('en-IN'),
      subtext: 'Awaiting pricing / photo approval',
      variant: 'purple',
      watermarkIcon: <Clock className="w-16 h-16" />,
    },
  ];

  // Table Columns (Laptop)
  const columns = [
    {
      header: 'Product Details',
      cell: (r: any) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-50/50 border border-amber-200/60 flex items-center justify-center text-slate-700 text-xs font-mono shrink-0 overflow-hidden shadow-2xs">
            {r.media?.[0]?.thumbnailUrl ? (
              <img
                src={r.media[0].thumbnailUrl}
                alt={r.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-base">💍</span>
            )}
          </div>
          <div>
            <div
              className="font-bold text-slate-900 hover:text-amber-700 cursor-pointer text-sm tracking-tight"
              onClick={() => navigate(`/products/${r.id}`)}
            >
              {r.name}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-slate-600">{r.sku}</span>
              {r.hallmarkNumber && <span>· HUID: {r.hallmarkNumber}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Metal & Purity',
      cell: (r: any) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>
              {r.metalType} {r.purity}
            </span>
          </div>
          <div className="text-slate-400 mt-0.5">
            {r.metalColor || 'YELLOW'} · {r.metalFinish || 'POLISHED'}
          </div>
        </div>
      ),
    },
    {
      header: 'Weights (Grams)',
      cell: (r: any) => (
        <div className="text-xs font-mono space-y-0.5">
          <div className="text-slate-900 font-semibold">
            Gross: {Number(r.grossWeight || 0).toFixed(3)}g
          </div>
          <div className="text-slate-500">
            Net: {Number(r.netMetalWeight || r.grossWeight).toFixed(3)}g
          </div>
        </div>
      ),
    },
    {
      header: 'Pricing Benchmark',
      cell: (r: any) => {
        const livePrice = r.currentPrice ? Number(r.currentPrice) : null;
        const estNet = Number(r.netMetalWeight || r.grossWeight || 0);
        const approxPrice = livePrice || Math.round(estNet * gold22Rate * 1.15 * 1.03);
        return (
          <div className="text-xs">
            {r.pricingMode === 'FIXED' ? (
              <div>
                <span className="font-mono font-bold text-slate-800">
                  ₹{Number(r.fixedPrice || 0).toLocaleString('en-IN')}
                </span>
                <div className="text-[10px] text-slate-400 font-sans">Fixed Price</div>
              </div>
            ) : (
              <div className="font-mono">
                <span className="font-bold text-amber-950 text-sm">
                  ₹{approxPrice.toLocaleString('en-IN')}
                </span>
                <div className="text-[10px] text-emerald-600 font-sans font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Dynamic ({r.metalType} {r.purity})
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
          PUBLISHED: 'success',
          PENDING_APPROVAL: 'warning',
          DRAFT: 'info',
          ARCHIVED: 'danger',
          OUT_OF_STOCK: 'danger',
        };
        return <Badge variant={variants[r.status] || 'info'}>{r.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (r: any) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="12-Step Live Price Breakdown"
            onClick={() => handleViewPrice(r.id)}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="View Details"
            onClick={() => navigate(`/products/${r.id}`)}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Duplicate Design"
            onClick={() => duplicateMutation.mutate(r.id)}
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Delete"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${r.name}?`)) {
                deleteMutation.mutate(r.id);
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </Button>
        </div>
      ),
    },
  ];

  // Mobile / Cards Grid View
  const renderCardGrid = () => {
    if (products.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
          No jewellery products found matching your search.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p: any) => {
          const estNet = Number(p.netMetalWeight || p.grossWeight || 0);
          const livePrice = p.currentPrice ? Number(p.currentPrice) : null;
          const approxPrice =
            p.pricingMode === 'FIXED'
              ? Number(p.fixedPrice || 0)
              : (livePrice || Math.round(estNet * gold22Rate * 1.15 * 1.03));

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Card Image Header */}
              <div className="relative aspect-4/3 bg-slate-100 flex items-center justify-center overflow-hidden">
                {p.media?.[0]?.url ? (
                  <img
                    src={p.media[0].url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl select-none">💍</div>
                )}

                <div className="absolute top-2.5 left-2.5 flex gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-900/80 text-white backdrop-blur-xs">
                    {p.metalType} {p.purity}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant={p.status === 'PUBLISHED' ? 'success' : 'info'}
                    className="text-[10px] shadow-xs"
                  >
                    {p.status}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-slate-400 font-semibold">
                    {p.sku}
                  </div>
                  <h3
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="font-bold text-slate-900 text-sm hover:text-amber-700 cursor-pointer mt-0.5 line-clamp-1"
                  >
                    {p.name}
                  </h3>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Gross Wt</span>
                      <span className="font-semibold text-slate-800">
                        {Number(p.grossWeight).toFixed(3)}g
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Net Wt</span>
                      <span className="font-semibold text-slate-800">
                        {Number(p.netMetalWeight || p.grossWeight).toFixed(3)}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Quick Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.pricingMode === 'FIXED' ? 'Fixed Price' : 'Live Estimate'}
                    </div>
                    <div className="font-mono font-black text-amber-950 text-base">
                      ₹{approxPrice.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleViewPrice(p.id)}
                      className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                      title="12-Step Price Breakdown"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateMutation.mutate(p.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <StandardPageLayout
      title="Product Catalog & Master Showcase"
      description="Manage live jewellery designs, hallmark specifications, multi-metal weights, and dynamic showroom pricing rules."
      badge="Catalog ERP Engine"
      headerWatermark={<Crown className="w-64 h-64 text-amber-300" />}
      primaryAction={
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      }
      secondaryActions={
        <Button
          variant="outline"
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          onClick={() => toast({ type: 'info', title: 'Export', message: 'Generating CSV...' })}
        >
          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
        </Button>
      }
      stats={stats}
      searchPlaceholder="Search by name, SKU, HUID, or design code..."
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val);
        setCurrentPage(1);
      }}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showViewToggle={true}
      filterSlot={
        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="w-36">
            <Select
              value={metalType}
              onChange={(e) => {
                setMetalType(e.target.value);
                setPurity('');
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Metals', value: '' },
                { label: 'Gold', value: 'GOLD' },
                { label: 'Silver', value: 'SILVER' },
                { label: 'Platinum', value: 'PLATINUM' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={purity}
              onChange={(e) => {
                setPurity(e.target.value);
                setCurrentPage(1);
              }}
              options={
                metalType === 'GOLD'
                  ? [
                      { label: 'All Gold Purities', value: '' },
                      { label: '24K (999)', value: 'K24' },
                      { label: '22K (916)', value: 'K22' },
                      { label: '18K (750)', value: 'K18' },
                      { label: '14K (585)', value: 'K14' },
                    ]
                  : metalType === 'SILVER'
                  ? [
                      { label: 'All Silver Purities', value: '' },
                      { label: '999 Fine', value: 'SILVER_999' },
                      { label: '925 Sterling', value: 'SILVER_925' },
                    ]
                  : metalType === 'PLATINUM'
                  ? [
                      { label: 'All Platinum Purities', value: '' },
                      { label: '950 Platinum', value: 'PLATINUM_950' },
                    ]
                  : [
                      { label: 'All Purities', value: '' },
                      { label: 'Gold 24K', value: 'K24' },
                      { label: 'Gold 22K', value: 'K22' },
                      { label: 'Gold 18K', value: 'K18' },
                      { label: 'Silver 999', value: 'SILVER_999' },
                      { label: 'Silver 925', value: 'SILVER_925' },
                    ]
              }
            />
          </div>

          <div className="w-36">
            <Select
              value={weightRange}
              onChange={(e) => {
                setWeightRange(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Weights', value: '' },
                { label: '0 – 5g', value: '0-5' },
                { label: '5 – 10g', value: '5-10' },
                { label: '10 – 20g', value: '10-20' },
                { label: '20 – 50g', value: '20-50' },
                { label: '50g+', value: '50+' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Published', value: 'PUBLISHED' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
                { label: 'Archived', value: 'ARCHIVED' },
              ]}
            />
          </div>

          {(search || metalType || purity || weightRange || status) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setMetalType('');
                setPurity('');
                setWeightRange('');
                setStatus('');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      }
      tableContent={
        <Table columns={columns} data={products} isLoading={isLoading} />
      }
      cardGridContent={renderCardGrid()}
      isLoading={isLoading}
      totalCount={totalItems}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: (size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        },
      }}
      footerInfo={
        <>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Active Pricing Benchmark: <strong>22K Gold @ ₹{gold22Rate.toLocaleString('en-IN')}/g</strong> · GST 3% (HSN 7113)
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Catalog synchronized with PostgreSQL 16
          </div>
        </>
      }
    >
      {/* Live Price Breakdown Modal */}
      <Modal
        isOpen={Boolean(priceBreakdownData)}
        onClose={() => setPriceBreakdownData(null)}
        title={`Live Price Breakdown: ${priceBreakdownData?.product?.name || ''}`}
        footer={
          <Button onClick={() => setPriceBreakdownData(null)}>Close Breakdown</Button>
        }
      >
        {priceBreakdownData && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs flex justify-between">
              <div>
                <span className="font-semibold text-amber-900">Benchmark Rate: </span>
                <span className="font-mono">
                  ₹{priceBreakdownData.metalRate?.ratePerGram}/g ({priceBreakdownData.metalRate?.purity})
                </span>
              </div>
              <div className="text-slate-500 font-mono">
                {new Date(priceBreakdownData.calculatedAt).toLocaleTimeString()}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs font-mono">
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">Net Metal Weight</span>
                <span className="font-bold">{priceBreakdownData.breakdown?.netMetalWeight}g</span>
              </div>
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">Base Metal Value</span>
                <span>₹{priceBreakdownData.breakdown?.metalValue?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">
                  Wastage Allowance ({priceBreakdownData.breakdown?.wastagePercent}%)
                </span>
                <span>₹{priceBreakdownData.breakdown?.wastageValue?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">Making Charges</span>
                <span>₹{priceBreakdownData.breakdown?.makingChargesAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">Majuri (Artisan Cost)</span>
                <span>₹{priceBreakdownData.breakdown?.majuriAmount?.toLocaleString('en-IN')}</span>
              </div>
              {priceBreakdownData.breakdown?.totalStoneValue > 0 && (
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-600">Certified Stone Value</span>
                  <span>₹{priceBreakdownData.breakdown?.totalStoneValue?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">BIS Hallmark / Service Charges</span>
                <span>₹{priceBreakdownData.breakdown?.serviceCharges?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 font-bold text-slate-800">
                <span>Taxable Amount</span>
                <span>₹{priceBreakdownData.breakdown?.taxableAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5">
                <span className="text-slate-600">GST (3%)</span>
                <span>₹{priceBreakdownData.breakdown?.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-3.5 bg-amber-100 text-amber-950 font-black text-sm rounded-b-lg">
                <span>Final Consumer Price</span>
                <span>₹{priceBreakdownData.breakdown?.finalPriceRounded?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </StandardPageLayout>
  );
}
