import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestsApi, type ProductRequestItem } from '../../api/requests.api';
import { storesApi, type StoreItem } from '../../api/stores.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RequestDetailModal } from './RequestDetailModal';
import {
  MessageSquareQuote,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  Package,
  Calendar,
  Building2,
  RefreshCw,
  MapPin,
  Store,
  Compass,
  AlertCircle,
} from 'lucide-react';

export function RequestsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 1. Fetch Store List for Filter
  const { data: storesResponse } = useQuery({
    queryKey: ['stores-list'],
    queryFn: async () => {
      const res = await storesApi.getAll(true);
      return res.data?.data || [];
    },
    staleTime: 60000,
  });
  const stores: StoreItem[] = storesResponse || [];

  // 2. Fetch Pipeline Stats
  const { data: statsResponse, refetch: refetchStats } = useQuery({
    queryKey: ['requests-pipeline-stats', storeFilter],
    queryFn: async () => {
      const res = await requestsApi.getPipelineStats(storeFilter || undefined);
      return res.data?.data;
    },
    refetchInterval: 20000,
  });

  // 3. Fetch Requests List
  const {
    data: listResponse,
    isLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: [
      'product-requests',
      {
        search,
        status: statusFilter,
        purchaseStatus: purchaseStatusFilter,
        storeId: storeFilter,
        priority: priorityFilter,
        page,
        limit,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: async () => {
      const res = await requestsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        purchaseStatus: purchaseStatusFilter || undefined,
        storeId: storeFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      return res.data;
    },
    refetchInterval: 25000,
  });

  const stats = statsResponse || {
    total: 0,
    new: 0,
    assigned: 0,
    followUp: 0,
    completed: 0,
    pendingPurchases: 0,
    approvedPurchases: 0,
    rejectedPurchases: 0,
    conversionRate: 0,
  };

  const requests: ProductRequestItem[] = listResponse?.data || [];
  const meta = listResponse?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleOpenDetail = (req: ProductRequestItem) => {
    setSelectedRequestId(req.id || req.requestId);
    setIsDetailOpen(true);
  };

  // Stat Widgets
  const statWidgets: StatWidget[] = [
    {
      label: 'Total Requests',
      value: stats.total,
      subtext: 'Inbound customer product leads',
      watermarkIcon: <Inbox className="w-16 h-16" />,
      variant: 'default',
    },
    {
      label: 'Unassigned (New)',
      value: stats.new,
      subtext: stats.new > 0 ? 'Awaiting showroom assignment' : 'All assigned to stores',
      watermarkIcon: <AlertCircle className="w-16 h-16" />,
      variant: stats.new > 0 ? 'gold' : 'default',
    },
    {
      label: 'Assigned & In Follow-up',
      value: stats.assigned + stats.followUp,
      subtext: `${stats.assigned} assigned, ${stats.followUp} in outreach`,
      watermarkIcon: <Store className="w-16 h-16" />,
      variant: 'blue',
    },
    {
      label: 'Purchases Confirmed',
      value: stats.approvedPurchases,
      subtext: `Customer bought (${stats.conversionRate}% conversion)`,
      watermarkIcon: <CheckCircle2 className="w-16 h-16" />,
      variant: 'emerald',
    },
    {
      label: 'Pending Customer Decisions',
      value: stats.pendingPurchases,
      subtext: `${stats.rejectedPurchases} customer declined`,
      watermarkIcon: <Clock className="w-16 h-16" />,
      variant: 'gold',
    },
  ];

  const statusBadgeVariant: Record<string, 'gold' | 'info' | 'warning' | 'success' | 'danger'> = {
    NEW: 'gold',
    ASSIGNED: 'info',
    FOLLOW_UP: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
  };

  const priorityBadgeVariant: Record<string, 'info' | 'warning' | 'danger' | 'gold'> = {
    LOW: 'info',
    NORMAL: 'info',
    HIGH: 'warning',
    URGENT: 'danger',
  };

  // Desktop Table Columns
  const columns = [
    {
      header: 'Request ID',
      cell: (r: ProductRequestItem) => (
        <button
          type="button"
          onClick={() => handleOpenDetail(r)}
          className="font-mono font-bold text-amber-950 text-xs hover:text-amber-700 hover:underline flex items-center gap-1.5"
        >
          <span>{r.requestId}</span>
        </button>
      ),
    },
    {
      header: 'Customer',
      cell: (r: ProductRequestItem) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{r.customerName}</div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
            <a href={`tel:${r.phone}`} className="hover:underline">
              {r.phone}
            </a>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (r: ProductRequestItem) => (
        <div className="text-xs text-slate-700">
          {r.city || r.state ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="font-medium text-slate-900">
                {r.city ? r.city : ''}
                {r.city && r.state ? ', ' : ''}
                {r.state ? r.state : ''}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Location unstated</span>
          )}
          {r.latitude && r.longitude && (
            <div className="text-[10px] text-slate-400 font-mono">GPS logged</div>
          )}
        </div>
      ),
    },
    {
      header: 'Product',
      cell: (r: ProductRequestItem) => {
        const thumb =
          r.product?.media?.find((m) => m.isPrimary)?.thumbnailUrl ||
          r.product?.media?.find((m) => m.isPrimary)?.originalUrl ||
          r.product?.media?.find((m) => m.isPrimary)?.url ||
          r.product?.media?.[0]?.thumbnailUrl ||
          r.product?.media?.[0]?.originalUrl ||
          r.product?.media?.[0]?.url;

        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            {thumb ? (
              <img
                src={thumb}
                alt={r.productName}
                className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                <Package className="w-4 h-4 opacity-60" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium text-slate-900 text-xs truncate" title={r.productName}>
                {r.productName}
              </div>
              {r.quantity && (
                <div className="text-[10px] text-amber-800 font-mono">Qty: {r.quantity}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Assigned Showroom',
      cell: (r: ProductRequestItem) => {
        if (r.assignedStore) {
          return (
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                  {r.assignedStore.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {r.assignedStore.city}
                </div>
              </div>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
            Not Assigned
          </span>
        );
      },
    },
    {
      header: 'Request Status',
      cell: (r: ProductRequestItem) => (
        <Badge variant={statusBadgeVariant[r.status] || 'info'}>
          {r.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Purchase Outcome',
      cell: (r: ProductRequestItem) => {
        if (r.purchaseStatus === 'APPROVED') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              PURCHASED
            </span>
          );
        }
        if (r.purchaseStatus === 'REJECTED') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
              NOT PURCHASED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            PENDING
          </span>
        );
      },
    },
    {
      header: 'Date',
      cell: (r: ProductRequestItem) => (
        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            {new Date(r.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (r: ProductRequestItem) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs py-1 px-2.5 h-7"
          onClick={() => handleOpenDetail(r)}
        >
          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
          {r.assignedStoreId ? 'View / Follow-up' : 'Assign Store'}
        </Button>
      ),
    },
  ];

  // Mobile / Grid Cards
  const renderCardGrid = () => {
    if (requests.length === 0 && !isLoading) {
      return (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
          No customer inquiries match the current search or filters.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {requests.map((r) => {
          const thumb =
            r.product?.media?.find((m) => m.isPrimary)?.thumbnailUrl ||
            r.product?.media?.find((m) => m.isPrimary)?.originalUrl ||
            r.product?.media?.find((m) => m.isPrimary)?.url ||
            r.product?.media?.[0]?.thumbnailUrl ||
            r.product?.media?.[0]?.originalUrl ||
            r.product?.media?.[0]?.url;

          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header: ID & Badges */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <span className="font-mono font-bold text-amber-950 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {r.requestId}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={priorityBadgeVariant[r.priority] || 'info'}>
                      {r.priority}
                    </Badge>
                    <Badge variant={statusBadgeVariant[r.status] || 'info'}>
                      {r.status.replace('_', ' ')}
                    </Badge>
                    {r.purchaseStatus === 'APPROVED' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        PURCHASED
                      </span>
                    )}
                    {r.purchaseStatus === 'REJECTED' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        DECLINED
                      </span>
                    )}
                    {r.purchaseStatus === 'PENDING' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Section */}
                <div className="flex items-center gap-3 my-3 p-2 bg-slate-50 rounded-lg">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={r.productName}
                      className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-amber-100/60 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                      <Package className="w-5 h-5 opacity-60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {r.productName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {r.quantity ? `Req: ${r.quantity} units` : 'Standard inquiry'}
                    </div>
                  </div>
                </div>

                {/* Customer Info & Location */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{r.customerName}</span>
                    {r.city && (
                      <span className="font-normal text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        {r.city}
                      </span>
                    )}
                  </div>
                  {r.companyName && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{r.companyName}</span>
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{r.phone}</span>
                  </div>
                </div>

                {/* Assigned Store Banner */}
                <div className="mb-3 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Showroom:</span>
                  {r.assignedStore ? (
                    <span className="font-semibold text-blue-700 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      {r.assignedStore.name} ({r.assignedStore.city})
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Not Assigned
                    </span>
                  )}
                </div>

                {/* Customer Message Excerpt */}
                <div className="p-2 bg-amber-50/40 border border-amber-100 rounded text-[11px] text-slate-700 line-clamp-2 italic mb-3">
                  "{r.message}"
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs py-1 px-2.5 h-7"
                  onClick={() => handleOpenDetail(r)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {r.assignedStoreId ? 'View & Follow-up' : 'Assign Store'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <StandardPageLayout
      title="Customer Product Requests & Store Assignments"
      description="Track customer inquiries from initial web request through proximity-based showroom assignment and final purchase outcome."
      badge="STORE LEAD DISPATCH"
      headerWatermark={<MessageSquareQuote className="w-56 h-56 text-amber-300" />}
      primaryAction={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            refetchStats();
            refetchList();
          }}
          className="border-amber-400/40 text-amber-300 hover:bg-amber-500/10 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      }
      stats={statWidgets}
      searchPlaceholder="Search by ID, customer, city, phone, product..."
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      filterSlot={
        <div className="flex flex-wrap items-center gap-2">
          {/* Store Filter */}
          <select
            value={storeFilter}
            onChange={(e) => {
              setStoreFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
          >
            <option value="">All Showrooms / Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>

          {/* Workflow Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white focus:outline-none focus:border-amber-500 text-slate-700"
          >
            <option value="">All Workflow States</option>
            <option value="NEW">New (Unassigned)</option>
            <option value="ASSIGNED">Assigned to Store</option>
            <option value="FOLLOW_UP">In Follow-Up</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Customer Purchase Outcome Filter */}
          <select
            value={purchaseStatusFilter}
            onChange={(e) => {
              setPurchaseStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white focus:outline-none focus:border-amber-500 text-slate-700 font-semibold"
          >
            <option value="">All Purchase Outcomes</option>
            <option value="PENDING">Pending Customer Decision</option>
            <option value="APPROVED">Customer Purchased (Approved)</option>
            <option value="REJECTED">Customer Declined (Rejected)</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white focus:outline-none focus:border-amber-500 text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so as 'ASC' | 'DESC');
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white focus:outline-none focus:border-amber-500 text-slate-700"
          >
            <option value="createdAt:DESC">Newest First</option>
            <option value="createdAt:ASC">Oldest First</option>
            <option value="priority:DESC">Priority High-Low</option>
            <option value="status:ASC">Workflow Status</option>
          </select>
        </div>
      }
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showViewToggle={true}
      isLoading={isLoading}
      totalCount={meta.total}
      tableContent={<Table columns={columns} data={requests} isLoading={isLoading} />}
      cardGridContent={renderCardGrid()}
      pagination={{
        currentPage: page,
        totalPages: meta.totalPages,
        totalItems: meta.total,
        itemsPerPage: limit,
        onPageChange: (newPage) => setPage(newPage),
        onItemsPerPageChange: (newLimit) => {
          setLimit(newLimit);
          setPage(1);
        },
      }}
      footerInfo={
        <>
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            Geospatial Proximity Match Engine Active · Real-time Showroom Lead Dispatch
          </span>
          <span className="font-mono text-slate-400">
            Conversion Rate: {stats.conversionRate}% · 25s auto-sync
          </span>
        </>
      }
    >
      {/* Request Details & Store Workflow Modal */}
      <RequestDetailModal
        requestId={selectedRequestId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequestId(null);
        }}
        onUpdated={() => {
          refetchStats();
          refetchList();
        }}
        onDeleted={() => {
          setSelectedRequestId(null);
          refetchStats();
          refetchList();
        }}
      />
    </StandardPageLayout>
  );
}
