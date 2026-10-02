import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  customDesignsApi,
  type CustomDesignRequestItem,
  type CustomDesignStats,
} from '../../api/custom-designs.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CustomDesignDetailModal } from './CustomDesignDetailModal';
import {
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  RefreshCw,
  Building2,
} from 'lucide-react';

export function CustomDesignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRequestId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Auto-open modal if directed from Email/WhatsApp notification URL (?id=CDR-2026-0001)
  useEffect(() => {
    if (urlRequestId) {
      setSelectedRequestId(urlRequestId);
      setIsDetailOpen(true);
    }
  }, [urlRequestId]);

  // 1. Fetch Stats
  const { data: statsResponse, refetch: refetchStats } = useQuery({
    queryKey: ['custom-designs-stats'],
    queryFn: async () => {
      const res = await customDesignsApi.getStats();
      return res.data?.data;
    },
    refetchInterval: 15000,
  });

  const stats: CustomDesignStats = statsResponse || {
    total: 0,
    new: 0,
    underReview: 0,
    contacted: 0,
    quotation: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    activePipeline: 0,
  };

  // 2. Fetch Custom Design Requests List
  const {
    data: listResponse,
    isLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['custom-designs-list', { search, status: statusFilter, page, limit }],
    queryFn: async () => {
      const res = await customDesignsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      return res.data;
    },
    refetchInterval: 20000,
  });

  const requests: CustomDesignRequestItem[] = listResponse?.data || [];
  const totalItems = listResponse?.total || 0;
  const totalPages = listResponse?.totalPages || 1;

  const handleOpenDetail = (req: CustomDesignRequestItem) => {
    setSelectedRequestId(req.id || req.requestId);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedRequestId(null);
    if (urlRequestId) {
      searchParams.delete('id');
      setSearchParams(searchParams);
    }
  };

  // Stat Widgets
  const statWidgets: StatWidget[] = [
    {
      label: 'Total Custom Requests',
      value: stats.total,
      subtext: 'Bespoke design inquiries',
      watermarkIcon: <Inbox className="w-16 h-16" />,
      variant: 'default',
    },
    {
      label: 'New & Unreviewed',
      value: stats.new,
      subtext: stats.new > 0 ? 'Requires atelier review' : 'All caught up',
      watermarkIcon: <Sparkles className="w-16 h-16" />,
      variant: stats.new > 0 ? 'gold' : 'default',
    },
    {
      label: 'Under Review / CAD',
      value: stats.underReview,
      subtext: 'In 3D modeling & assessment',
      watermarkIcon: <Clock className="w-16 h-16" />,
      variant: 'blue',
    },
    {
      label: 'In Quotation',
      value: stats.quotation,
      subtext: 'Quotes provided to customer',
      watermarkIcon: <FileText className="w-16 h-16" />,
      variant: 'gold',
    },
    {
      label: 'Approved & In Making',
      value: stats.approved,
      subtext: 'Ready for Karigar production',
      watermarkIcon: <CheckCircle2 className="w-16 h-16" />,
      variant: 'emerald',
    },
    {
      label: 'Completed & Delivered',
      value: stats.completed,
      subtext: 'Delivered to clients',
      watermarkIcon: <CheckCircle2 className="w-16 h-16" />,
      variant: 'default',
    },
  ];

  const getStatusBadgeVariant = (
    st: string
  ): 'gold' | 'info' | 'warning' | 'success' | 'danger' => {
    switch (st) {
      case 'NEW':
        return 'gold';
      case 'UNDER_REVIEW':
        return 'info';
      case 'CONTACTED':
        return 'info';
      case 'QUOTATION':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'COMPLETED':
        return 'success';
      default:
        return 'info';
    }
  };

  // Columns for standard Table component
  const columns = [
    {
      header: 'Request ID',
      cell: (req: CustomDesignRequestItem) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
            {req.requestId}
          </span>
          {req.status === 'NEW' && (
            <span
              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
              title="New Unread Request"
            />
          )}
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (req: CustomDesignRequestItem) => (
        <div>
          <div className="text-xs font-semibold text-slate-900">{req.customerName}</div>
          <div className="text-[11px] text-slate-500">{req.phone}</div>
          <div className="text-[11px] text-slate-400">{req.email}</div>
          {req.companyName && (
            <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{req.companyName}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Product / Design Concept',
      cell: (req: CustomDesignRequestItem) => (
        <div className="max-w-xs">
          <div className="text-xs font-semibold text-slate-900">{req.productName}</div>
          <div className="text-[11px] text-slate-500 truncate" title={req.designDescription}>
            {req.designDescription}
          </div>
          {req.materialRequirements && (
            <div className="text-[10px] text-amber-800 font-medium mt-0.5">
              {req.materialRequirements}
            </div>
          )}
          <div className="text-[10px] text-slate-400 mt-0.5">Qty: {req.quantity || '1'}</div>
        </div>
      ),
    },
    {
      header: 'Attachments',
      cell: (req: CustomDesignRequestItem) => {
        const count = Array.isArray(req.attachments)
          ? req.attachments.filter(
              (f) => f && typeof f === 'object' && !Array.isArray(f) && (f.url || f.originalName)
            ).length
          : 0;
        return (
          <div className="flex items-center gap-1.5">
            <FileText
              className={`w-4 h-4 ${count > 0 ? 'text-amber-600' : 'text-slate-300'}`}
            />
            <span className="text-xs font-medium text-slate-700">
              {count} {count === 1 ? 'file' : 'files'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Submitted',
      cell: (req: CustomDesignRequestItem) => (
        <div className="text-xs text-slate-600">
          <div>{new Date(req.createdAt).toLocaleDateString('en-IN')}</div>
          <div className="text-[10px] text-slate-400">
            {new Date(req.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (req: CustomDesignRequestItem) => (
        <Badge variant={getStatusBadgeVariant(req.status)}>
          {req.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Notifications',
      cell: (req: CustomDesignRequestItem) => {
        const statusStr = req.notificationStatus || 'PENDING';
        const hasEmail = statusStr.includes('EMAIL_SENT');
        const hasWhatsApp = statusStr.includes('WHATSAPP_SENT');

        return (
          <div className="flex flex-col gap-1">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold inline-block ${
                hasEmail
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              ✉️ {hasEmail ? 'Email Sent' : 'Email Alert'}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold inline-block ${
                hasWhatsApp
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              💬 {hasWhatsApp ? 'WhatsApp Sent' : 'WhatsApp Alert'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: (req: CustomDesignRequestItem) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenDetail(req)}
          className="text-xs text-slate-700 hover:text-slate-900 border-slate-300"
        >
          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span>View</span>
        </Button>
      ),
    },
  ];

  // Grid Card View (alternative layout)
  const cardGridContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                {r.requestId}
              </span>
              <Badge variant={getStatusBadgeVariant(r.status)}>
                {r.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="my-3">
              <div className="font-semibold text-slate-900 text-sm">{r.productName}</div>
              <div className="text-xs text-slate-600 line-clamp-2 mt-1 italic">
                "{r.designDescription}"
              </div>
              {r.materialRequirements && (
                <div className="text-[11px] text-amber-800 font-medium mt-1.5">
                  🛠️ {r.materialRequirements}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="font-medium text-slate-900">{r.customerName}</div>
              <div className="text-slate-500">{r.phone}</div>
              <div className="text-[10px] text-slate-400">
                Submitted {new Date(r.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {Array.isArray(r.attachments)
                ? r.attachments.filter(
                    (f) => f && typeof f === 'object' && !Array.isArray(f) && (f.url || f.originalName)
                  ).length
                : 0}{' '}
              attachment(s)
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenDetail(r)}
              className="text-xs"
            >
              <Eye className="w-3.5 h-3.5 mr-1" /> View Details
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <StandardPageLayout
      title="Custom Design Requests"
      description="Manage bespoke haute joaillerie customer submissions, CAD models, and atelier quotation workflow"
      stats={statWidgets}
      searchPlaceholder="Search by ID, customer, email, phone, concept..."
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showViewToggle={true}
      primaryAction={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchStats();
            refetchList();
          }}
          className="border-amber-400/40 text-amber-300 hover:bg-amber-500/10 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      }
      filterSlot={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
          >
            <option value="">All Statuses ({stats.total})</option>
            <option value="NEW">NEW ({stats.new})</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW ({stats.underReview})</option>
            <option value="CONTACTED">CONTACTED ({stats.contacted})</option>
            <option value="QUOTATION">QUOTATION ({stats.quotation})</option>
            <option value="APPROVED">APPROVED ({stats.approved})</option>
            <option value="REJECTED">REJECTED ({stats.rejected})</option>
            <option value="COMPLETED">COMPLETED ({stats.completed})</option>
          </select>
        </div>
      }
      tableContent={
        <Table
          columns={columns}
          data={requests}
          isLoading={isLoading}
          emptyMessage="No custom design requests found."
        />
      }
      cardGridContent={cardGridContent}
      isLoading={isLoading}
      totalCount={totalItems}
      pagination={{
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        onPageChange: setPage,
      }}
    >
      {/* Details & Management Modal */}
      <CustomDesignDetailModal
        requestId={selectedRequestId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </StandardPageLayout>
  );
}
