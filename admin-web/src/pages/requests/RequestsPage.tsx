import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { requestsApi, type ProductRequestItem } from '../../api/requests.api';
import { storesApi, type StoreItem } from '../../api/stores.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { RequestDetailModal } from './RequestDetailModal';
import {
  MessageSquareQuote,
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
  RotateCcw,
} from 'lucide-react';

export function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRequestId = searchParams.get('id');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState(searchParams.get('purchaseStatus') || '');
  const [storeFilter, setStoreFilter] = useState(searchParams.get('storeId') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const sortBy = 'createdAt';
  const sortOrder = 'DESC';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const updateFilterParam = (key: string, val: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const resetAllFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPurchaseStatusFilter('');
    setStoreFilter('');
    setPriorityFilter('');
    setPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search || statusFilter || purchaseStatusFilter || storeFilter || priorityFilter
  );

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Auto-open modal if navigated from notification alert (?id=REQ-000010)
  useEffect(() => {
    if (urlRequestId) {
      setSelectedRequestId(urlRequestId);
      setIsDetailOpen(true);
    }
  }, [urlRequestId]);

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

  // 1b. Fetch Wholesale Partners List
  const { data: partnersResponse } = useQuery({
    queryKey: ['wholesale-partners-list'],
    queryFn: async () => {
      const res = await requestsApi.getWholesalePartners();
      return res.data?.data || [];
    },
    staleTime: 60000,
  });
  const partners = partnersResponse || [];

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

  const [detailInitialTab, setDetailInitialTab] = useState<'workflow' | 'assignment' | 'history'>('workflow');
  const [detailInitialChannel, setDetailInitialChannel] = useState<'STORE' | 'PARTNER'>('STORE');

  const handleOpenDetail = (
    req: ProductRequestItem,
    tab?: 'workflow' | 'assignment' | 'history',
    channel?: 'STORE' | 'PARTNER'
  ) => {
    setSelectedRequestId(req.id || req.requestId);
    setDetailInitialTab(tab || (!req.assignedStoreId && !req.assignedToUserId ? 'assignment' : 'workflow'));
    setDetailInitialChannel(channel || (req.assignedToUserId ? 'PARTNER' : 'STORE'));
    setIsDetailOpen(true);
  };

  // Stat Widgets (Interactive Quick Filters)
  const statWidgets: StatWidget[] = [
    {
      label: 'Total Requests',
      value: stats.total,
      subtext: 'Inbound customer product leads',
      variant: 'default',
      clickable: true,
      isActive: !hasActiveFilters,
      actionHint: !hasActiveFilters ? 'Showing All' : 'Reset & Show All',
      onClick: resetAllFilters,
    },
    {
      label: 'Unassigned (New)',
      value: stats.new,
      subtext: stats.new > 0 ? 'Awaiting showroom assignment' : 'All assigned to stores',
      variant: 'gold',
      clickable: true,
      isActive: statusFilter === 'NEW',
      actionHint: statusFilter === 'NEW' ? 'Active Filter (Click to Reset)' : 'Click to Filter New',
      onClick: () => {
        const next = statusFilter === 'NEW' ? '' : 'NEW';
        setStatusFilter(next);
        updateFilterParam('status', next);
      },
    },
    {
      label: 'Assigned & In Follow-up',
      value: stats.assigned + stats.followUp,
      subtext: `${stats.assigned} assigned, ${stats.followUp} in outreach`,
      variant: 'blue',
      clickable: true,
      isActive: statusFilter === 'ASSIGNED' || statusFilter === 'FOLLOW_UP',
      actionHint:
        statusFilter === 'ASSIGNED' || statusFilter === 'FOLLOW_UP'
          ? 'Active Filter (Click to Reset)'
          : 'Click to Filter Assigned',
      onClick: () => {
        const next =
          statusFilter === 'ASSIGNED' || statusFilter === 'FOLLOW_UP'
            ? ''
            : 'ASSIGNED';
        setStatusFilter(next);
        updateFilterParam('status', next);
      },
    },
    {
      label: 'Purchases Confirmed',
      value: stats.approvedPurchases,
      subtext: `Customer bought (${stats.conversionRate}% conversion)`,
      variant: 'emerald',
      clickable: true,
      isActive: purchaseStatusFilter === 'APPROVED',
      actionHint:
        purchaseStatusFilter === 'APPROVED'
          ? 'Active Filter (Click to Reset)'
          : 'Click to Filter Purchased',
      onClick: () => {
        const next = purchaseStatusFilter === 'APPROVED' ? '' : 'APPROVED';
        setPurchaseStatusFilter(next);
        updateFilterParam('purchaseStatus', next);
      },
    },
    {
      label: 'Pending Customer Decisions',
      value: stats.pendingPurchases,
      subtext: `${stats.rejectedPurchases} customer declined`,
      variant: 'gold',
      clickable: true,
      isActive: purchaseStatusFilter === 'PENDING',
      actionHint:
        purchaseStatusFilter === 'PENDING'
          ? 'Active Filter (Click to Reset)'
          : 'Click to Filter Pending',
      onClick: () => {
        const next = purchaseStatusFilter === 'PENDING' ? '' : 'PENDING';
        setPurchaseStatusFilter(next);
        updateFilterParam('purchaseStatus', next);
      },
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
      header: 'Assigned Destination',
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
        if (r.assignedPartner) {
          return (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-950 truncate max-w-[140px]">
                  {r.assignedPartner.companyName}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono">
                  {r.assignedPartner.city ? `${r.assignedPartner.city} · ` : ''}Partner
                </div>
              </div>
            </div>
          );
        }
        if (r.assignedToUserId) {
          const partner = partners.find((p) => p.userId === r.assignedToUserId);
          return (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-950 truncate max-w-[140px]">
                  {partner?.companyName || 'Wholesale Partner'}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono">
                  {partner?.city ? `${partner.city} · ` : ''}Partner
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
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
          onClick={() =>
            handleOpenDetail(
              r,
              r.assignedStoreId || r.assignedToUserId ? 'workflow' : 'assignment',
              r.assignedToUserId ? 'PARTNER' : 'STORE'
            )
          }
        >
          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
          {r.assignedStoreId || r.assignedToUserId ? 'View / Follow-up' : 'Assign'}
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

                {/* Assigned Destination Banner */}
                <div className="mb-3 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Assigned:</span>
                  {r.assignedStore ? (
                    <span className="font-semibold text-blue-700 flex items-center gap-1 truncate max-w-[200px]">
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      {r.assignedStore.name} ({r.assignedStore.city})
                    </span>
                  ) : r.assignedPartner || r.assignedToUserId ? (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1 truncate max-w-[200px]">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      {r.assignedPartner?.companyName ||
                        partners.find((p) => p.userId === r.assignedToUserId)?.companyName ||
                        'Wholesale Partner'}
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
                  onClick={() =>
                    handleOpenDetail(
                      r,
                      r.assignedStoreId || r.assignedToUserId ? 'workflow' : 'assignment',
                      r.assignedToUserId ? 'PARTNER' : 'STORE'
                    )
                  }
                >
                  <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {r.assignedStoreId || r.assignedToUserId ? 'View & Follow-up' : 'Assign'}
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
        updateFilterParam('search', val);
      }}
      filterSlot={
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-between w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
            <CustomDropdown
              value={storeFilter}
              onChange={(val) => {
                setStoreFilter(val);
                updateFilterParam('storeId', val);
              }}
              placeholder="All Showrooms"
              options={[
                { label: 'All Showrooms', value: '' },
                ...stores.map((s) => ({
                  label: `${s.name} (${s.city})`,
                  value: s.id,
                  badge: s.city,
                })),
              ]}
            />

            <CustomDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                updateFilterParam('status', val);
              }}
              placeholder="All Workflow States"
              options={[
                { label: 'All Workflow States', value: '' },
                { label: 'New (Unassigned)', value: 'NEW', badge: 'Action' },
                { label: 'Assigned to Store', value: 'ASSIGNED', badge: 'Dispatched' },
                { label: 'In Follow-Up', value: 'FOLLOW_UP', badge: 'Contacted' },
                { label: 'Completed', value: 'COMPLETED', badge: 'Done' },
                { label: 'Cancelled', value: 'CANCELLED', badge: 'Closed' },
              ]}
            />

            <CustomDropdown
              value={purchaseStatusFilter}
              onChange={(val) => {
                setPurchaseStatusFilter(val);
                updateFilterParam('purchaseStatus', val);
              }}
              placeholder="All Outcomes"
              options={[
                { label: 'All Outcomes', value: '' },
                { label: 'Pending Decision', value: 'PENDING', badge: 'Pending' },
                { label: 'Customer Purchased', value: 'APPROVED', badge: 'Purchased' },
                { label: 'Customer Declined', value: 'REJECTED', badge: 'Declined' },
              ]}
            />

            <CustomDropdown
              value={priorityFilter}
              onChange={(val) => {
                setPriorityFilter(val);
                updateFilterParam('priority', val);
              }}
              placeholder="All Priorities"
              options={[
                { label: 'All Priorities', value: '' },
                { label: 'Low', value: 'LOW', badge: 'Low' },
                { label: 'Normal', value: 'NORMAL', badge: 'Normal' },
                { label: 'High', value: 'HIGH', badge: 'High' },
                { label: 'Urgent', value: 'URGENT', badge: 'Urgent' },
              ]}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="self-end sm:self-center text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
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
        totalPages: meta.totalPages || 1,
        totalItems: meta.total || 0,
        itemsPerPage: limit,
        onPageChange: (newPage) => setPage(newPage),
        onItemsPerPageChange: (newLimit) => {
          setLimit(newLimit);
          setPage(1);
          updateFilterParam('limit', newLimit === 10 ? '' : String(newLimit));
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
        initialTab={detailInitialTab}
        initialChannel={detailInitialChannel}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequestId(null);
          if (searchParams.get('id')) {
            const next = new URLSearchParams(searchParams);
            next.delete('id');
            setSearchParams(next, { replace: true });
          }
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
