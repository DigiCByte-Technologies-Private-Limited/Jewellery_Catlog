import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  wholesaleApi,
  type WholesaleProductSubmissionItem,
  type WholesaleSubmissionsStats,
  type WholesaleSubmissionStatus,
} from '../../api/wholesale.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { WholesaleSubmissionDetailModal } from './WholesaleSubmissionDetailModal';
import {
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  Eye,
  FileImage,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function WholesaleSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSubmissionId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WholesaleSubmissionStatus | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Auto-open modal if directed from Email/WhatsApp notification URL (?id=WPS-2026-0001)
  useEffect(() => {
    if (urlSubmissionId) {
      setSelectedSubmissionId(urlSubmissionId);
      setIsDetailOpen(true);
    }
  }, [urlSubmissionId]);

  // 1. Fetch Stats
  const { data: statsResponse, refetch: refetchStats } = useQuery({
    queryKey: ['wholesale-submissions-stats'],
    queryFn: async () => {
      const res = await wholesaleApi.getStats();
      return res.data?.data;
    },
    refetchInterval: 15000,
  });

  const stats: WholesaleSubmissionsStats = statsResponse || {
    total: 0,
    pendingReview: 0,
    underReview: 0,
    imageAccepted: 0,
    imageRejected: 0,
    completed: 0,
  };

  // 2. Fetch Submissions List
  const {
    data: listResponse,
    isLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['wholesale-submissions-list', { search, status: statusFilter, page, limit }],
    queryFn: async () => {
      const res = await wholesaleApi.getAll({
        search: search || undefined,
        status: statusFilter ? statusFilter : undefined,
        page,
        limit,
      });
      return res.data;
    },
    refetchInterval: 20000,
  });

  const submissions: WholesaleProductSubmissionItem[] = listResponse?.data || [];
  const totalItems = listResponse?.total || 0;
  const totalPages = listResponse?.totalPages || 1;

  const handleOpenDetail = (sub: WholesaleProductSubmissionItem) => {
    setSelectedSubmissionId(sub.id || sub.submissionId);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedSubmissionId(null);
    if (urlSubmissionId) {
      searchParams.delete('id');
      setSearchParams(searchParams);
    }
  };

  // Stat Widgets
  const statWidgets: StatWidget[] = [
    {
      label: 'Total Proposals',
      value: stats.total,
      subtext: 'B2B image submissions',
      watermarkIcon: <Inbox className="w-16 h-16" />,
      variant: 'default',
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview,
      subtext: stats.pendingReview > 0 ? 'Requires admin action' : 'All caught up',
      watermarkIcon: <Sparkles className="w-16 h-16" />,
      variant: stats.pendingReview > 0 ? 'gold' : 'default',
    },
    {
      label: 'Under Review',
      value: stats.underReview,
      subtext: 'In active evaluation',
      watermarkIcon: <Clock className="w-16 h-16" />,
      variant: 'blue',
    },
    {
      label: 'Accepted Proposals',
      value: stats.imageAccepted,
      subtext: 'Approved for catalog',
      watermarkIcon: <CheckCircle2 className="w-16 h-16" />,
      variant: 'emerald',
    },
    {
      label: 'Rejected',
      value: stats.imageRejected,
      subtext: 'Feedback provided',
      watermarkIcon: <ShieldAlert className="w-16 h-16" />,
      variant: 'default',
    },
    {
      label: 'Completed / Handled',
      value: stats.completed,
      subtext: 'Catalog updated or finalized',
      watermarkIcon: <Check className="w-16 h-16" />,
      variant: 'default',
    },
  ];

  const getStatusBadge = (s: WholesaleSubmissionStatus) => {
    switch (s) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'IMAGE_ACCEPTED':
        return <Badge variant="success">Accepted</Badge>;
      case 'IMAGE_REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'COMPLETED':
        return <Badge variant="gold">Completed</Badge>;
      default:
        return <Badge variant="info">{s}</Badge>;
    }
  };

  // Table Columns
  const columns = [
    {
      header: 'Submission ID',
      cell: (sub: WholesaleProductSubmissionItem) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
            {sub.submissionId}
          </span>
          {sub.status === 'PENDING_REVIEW' && (
            <span
              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
              title="Pending Review"
            />
          )}
        </div>
      ),
    },
    {
      header: 'Wholesale Partner',
      cell: (sub: WholesaleProductSubmissionItem) => (
        <div>
          <div className="text-xs font-semibold text-slate-900">
            {sub.user?.companyName || 'Wholesale Partner'}
          </div>
          <div className="text-[11px] text-slate-600">{sub.user?.fullName}</div>
          <div className="text-[10px] text-slate-400">{sub.user?.phone}</div>
        </div>
      ),
    },
    {
      header: 'Product Details',
      cell: (sub: WholesaleProductSubmissionItem) => (
        <div className="max-w-xs">
          <div className="text-xs font-semibold text-slate-900">{sub.productName}</div>
          <div className="text-[11px] text-slate-500">
            Category: {sub.productCategory || 'General'}
          </div>
          {sub.productSku && (
            <div className="text-[10px] text-amber-800 font-mono mt-0.5">
              SKU: {sub.productSku}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Proposed Image',
      cell: (sub: WholesaleProductSubmissionItem) => {
        const img = sub.images?.[0];
        return (
          <div className="flex items-center gap-2">
            {img ? (
              <img
                src={img.url}
                alt={img.originalName}
                className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <FileImage className="w-5 h-5" />
              </div>
            )}
            <div className="text-left">
              <span className="text-xs font-medium text-slate-700 block truncate max-w-[120px]">
                {img?.originalName || 'No image'}
              </span>
              {img && (
                <span className="text-[10px] text-slate-400">
                  {(img.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (sub: WholesaleProductSubmissionItem) => (
        <div className="space-y-1">
          {getStatusBadge(sub.status)}
          {sub.isPublishedToCatalog && (
            <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Published
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Submitted At',
      cell: (sub: WholesaleProductSubmissionItem) => (
        <div className="text-xs text-slate-600">
          <div>{new Date(sub.submittedAt).toLocaleDateString('en-IN')}</div>
          <div className="text-[10px] text-slate-400">
            {new Date(sub.submittedAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (sub: WholesaleProductSubmissionItem) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenDetail(sub)}
          className="border-slate-300 text-xs hover:border-amber-500 hover:text-amber-700"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Review Proposal
        </Button>
      ),
    },
  ];

  return (
    <div>
      <StandardPageLayout
        title="Wholesale Product Proposals"
        description="Review high-resolution product imagery and specs proposed by wholesale accounts. Inspect, verify quality, and publish directly to official catalog."
        badge="B2B Hub"
        headerWatermark={<Inbox className="w-48 h-48 opacity-10" />}
        stats={statWidgets}
        searchPlaceholder="Search proposals by ID, product, or wholesale partner..."
        searchValue={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        filterSlot={
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { label: 'All', value: '' },
                { label: 'Pending Review', value: 'PENDING_REVIEW' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Accepted', value: 'IMAGE_ACCEPTED' },
                { label: 'Rejected', value: 'IMAGE_REJECTED' },
                { label: 'Completed', value: 'COMPLETED' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value as any);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === filter.value
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchList();
              refetchStats();
            }}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        }
        isLoading={isLoading}
        totalCount={totalItems}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
        tableContent={<Table columns={columns} data={submissions} />}
        cardGridContent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((sub) => {
              const img = sub.images?.[0];
              return (
                <div
                  key={sub.id}
                  onClick={() => handleOpenDetail(sub)}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {sub.submissionId}
                      </span>
                      {getStatusBadge(sub.status)}
                    </div>

                    <div className="flex items-center gap-3">
                      {img ? (
                        <img
                          src={img.url}
                          alt={img.originalName}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <FileImage className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{sub.productName}</h4>
                        <p className="text-xs text-slate-500">
                          {sub.user?.companyName || 'Wholesale Client'}
                        </p>
                        <p className="text-[11px] text-slate-400">{sub.productCategory || 'General'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-3">
                    <span>{new Date(sub.submittedAt).toLocaleDateString('en-IN')}</span>
                    <span className="text-amber-600 font-medium">Review &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        }
      />

      {/* Detail and Decision Modal */}
      <WholesaleSubmissionDetailModal
        submissionId={selectedSubmissionId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
