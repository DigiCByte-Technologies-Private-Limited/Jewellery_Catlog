import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  wholesalePartnersApi,
  type WholesaleApplicationItem,
  type WholesaleApplicationsStats,
  type WholesaleApplicationStatus,
} from '../../api/wholesale-partners.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { WholesalePartnerDetailModal } from './WholesalePartnerDetailModal';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  Eye,
  RefreshCw,
  Phone,
  Mail,
} from 'lucide-react';

export function WholesalePartnersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAppId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WholesaleApplicationStatus | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Auto-open modal if navigated from Email/WhatsApp notification URL (?id=WH-2026-0001)
  useEffect(() => {
    if (urlAppId) {
      setSelectedAppId(urlAppId);
      setIsDetailOpen(true);
    }
  }, [urlAppId]);

  // Query wholesale applications list
  const { data: listResponse, isLoading, refetch } = useQuery({
    queryKey: ['wholesale-applications-list', { search, status: statusFilter, page, limit }],
    queryFn: async () => {
      return await wholesalePartnersApi.getAll({
        search,
        status: statusFilter,
        page,
        limit,
      });
    },
    refetchInterval: 15000, // Poll every 15s for new registrations
  });

  const applications: WholesaleApplicationItem[] = listResponse?.data || [];
  const total = listResponse?.total || 0;
  const stats: WholesaleApplicationsStats = listResponse?.stats || {
    totalAll: 0,
    pendingReview: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  };

  const handleOpenDetail = (app: WholesaleApplicationItem) => {
    setSelectedAppId(app.id);
    setIsDetailOpen(true);
    setSearchParams({ id: app.applicationId });
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedAppId(null);
    setSearchParams({});
  };

  const statWidgets: StatWidget[] = [
    {
      label: 'Total Applications',
      value: stats.totalAll,
      subtext: 'Registered wholesale accounts',
      watermarkIcon: <Building2 className="w-16 h-16 text-slate-400" />,
      variant: 'default',
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview,
      subtext: 'Awaiting KYC compliance check',
      watermarkIcon: <Clock className="w-16 h-16 text-amber-500" />,
      variant: 'gold',
    },
    {
      label: 'Under Verification',
      value: stats.underReview,
      subtext: 'Actively in inspection',
      watermarkIcon: <RefreshCw className="w-16 h-16 text-blue-500" />,
      variant: 'blue',
    },
    {
      label: 'Approved Partners',
      value: stats.approved,
      subtext: 'Active wholesale accounts',
      watermarkIcon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
      variant: 'emerald',
    },
    {
      label: 'Requires Revision',
      value: stats.rejected,
      subtext: 'Returned for correction',
      watermarkIcon: <AlertTriangle className="w-16 h-16 text-red-500" />,
      variant: 'purple',
    },
  ];

  const getStatusBadge = (status: WholesaleApplicationStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved & Active</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Application',
      cell: (item: WholesaleApplicationItem) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900 block">
            {item.applicationId}
          </span>
          <span className="text-[11px] text-slate-400">
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Firm & Owner',
      cell: (item: WholesaleApplicationItem) => (
        <div>
          <span className="font-bold text-xs text-slate-900 block">
            {item.companyName}
          </span>
          <span className="text-xs text-slate-600 block">
            {item.ownerName} &bull; <span className="text-slate-400">{item.city || 'N/A'}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (item: WholesaleApplicationItem) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-700 font-medium flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" /> {item.email}
          </span>
          <span className="text-slate-500 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" /> {item.phone}
          </span>
        </div>
      ),
    },
    {
      header: 'Verification Numbers',
      cell: (item: WholesaleApplicationItem) => (
        <div className="text-xs space-y-0.5">
          <span className="font-mono text-[11px] text-slate-700 block">
            PAN: <strong className="text-slate-900">{item.panNumber || 'N/A'}</strong>
          </span>
          {item.gstNumber && (
            <span className="font-mono text-[11px] text-slate-500 block">
              GST: {item.gstNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'KYC Proofs',
      cell: (item: WholesaleApplicationItem) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
          <FileCheck className="w-4 h-4 text-amber-600" />
          <span>{item.documents?.length || 0} file(s)</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item: WholesaleApplicationItem) => getStatusBadge(item.status),
    },
    {
      header: 'Actions',
      cell: (item: WholesaleApplicationItem) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenDetail(item)}
          className="text-xs font-semibold"
        >
          <Eye className="w-3.5 h-3.5 mr-1" /> Review Application
        </Button>
      ),
    },
  ];

  const filterSlot = (
    <div className="flex items-center gap-2">
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value as any);
          setPage(1);
        }}
        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">All Statuses ({stats.totalAll})</option>
        <option value="PENDING_REVIEW">Pending Review ({stats.pendingReview})</option>
        <option value="UNDER_REVIEW">Under Review ({stats.underReview})</option>
        <option value="APPROVED">Approved ({stats.approved})</option>
        <option value="REJECTED">Requires Revision ({stats.rejected})</option>
      </select>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => refetch()}
        className="p-2"
        title="Refresh table"
      >
        <RefreshCw className="w-4 h-4 text-slate-600" />
      </Button>
    </div>
  );

  const cardGridContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-slate-500">{app.applicationId}</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">{app.companyName}</h4>
              <p className="text-xs text-slate-600">{app.ownerName} &bull; {app.city || 'N/A'}</p>
            </div>
            {getStatusBadge(app.status)}
          </div>

          <div className="text-xs space-y-1 pt-2 border-t border-slate-100 text-slate-600">
            <p><strong>Email:</strong> {app.email}</p>
            <p><strong>Phone:</strong> {app.phone}</p>
            <p><strong>PAN:</strong> {app.panNumber || 'N/A'}</p>
            <p><strong>KYC Proofs:</strong> {app.documents?.length || 0} attached</p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDetail(app)}
            className="w-full text-xs font-bold"
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Review Application
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <StandardPageLayout
        title="Wholesale Partner Verifications"
        description="Review wholesale registration applications, inspect private KYC documents, and approve or reject wholesale partner accounts."
        badge="Compliance & Onboarding"
        headerWatermark={<ShieldCheck className="w-48 h-48 text-amber-500/10" />}
        stats={statWidgets}
        searchPlaceholder="Search applications by ID, firm name, owner, phone, email, PAN, GST..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterSlot={filterSlot}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle
        isLoading={isLoading}
        totalCount={total}
        tableContent={<Table data={applications} columns={columns} emptyMessage="No wholesale applications found matching filters." />}
        cardGridContent={cardGridContent}
        pagination={{
          currentPage: page,
          totalPages: Math.ceil(total / limit) || 1,
          totalItems: total,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
      />

      <WholesalePartnerDetailModal
        applicationId={selectedAppId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
}
