import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../../api/approvals.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { StandardPageLayout, type StatWidget } from '../../components/layout/StandardPageLayout';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  // Fetch approvals with server SQL pagination
  const { data: response, isLoading } = useQuery({
    queryKey: ['approvals', page, itemsPerPage, statusFilter],
    queryFn: async () => {
      const res = await approvalsApi.getAll({
        page,
        limit: itemsPerPage,
        status: statusFilter || undefined,
      });
      return res.data;
    },
  });

  const approvals = response?.data || [];
  const totalCount = response?.meta?.total ?? approvals.length;
  const totalPages = response?.meta?.totalPages ?? 1;

  // Lightweight query for status KPI counts
  const { data: statsResponse } = useQuery({
    queryKey: ['approvals', 'stats-kpi'],
    queryFn: async () => {
      const res = await approvalsApi.getAll({ limit: 1000 });
      return res.data?.data || [];
    },
  });

  const allApprovals = statsResponse || [];

  const pendingCount = useMemo(
    () => allApprovals.filter((a: any) => a.status === 'PENDING').length,
    [allApprovals]
  );
  const approvedCount = useMemo(
    () => allApprovals.filter((a: any) => a.status === 'APPROVED').length,
    [allApprovals]
  );
  const rejectedCount = useMemo(
    () => allApprovals.filter((a: any) => a.status === 'REJECTED').length,
    [allApprovals]
  );

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => approvalsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ type: 'success', title: 'Approved', message: 'Action request approved' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Approval failed' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      approvalsApi.reject(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ type: 'info', title: 'Rejected', message: 'Action request rejected' });
      setRejectId(null);
      setRejectComment('');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Rejection failed' });
    },
  });

  const statWidgets: StatWidget[] = [
    {
      label: 'Pending Approvals',
      value: pendingCount,
      subValue: 'Awaiting supervisor sign-off',
      color: 'amber',
      onClick: () => {
        setStatusFilter('PENDING');
        setPage(1);
      },
    },
    {
      label: 'Approved Requests',
      value: approvedCount,
      subValue: 'Dual-control checks passed',
      color: 'emerald',
      onClick: () => {
        setStatusFilter('APPROVED');
        setPage(1);
      },
    },
    {
      label: 'Rejected Requests',
      value: rejectedCount,
      subValue: 'Declined by showroom management',
      color: 'rose',
      onClick: () => {
        setStatusFilter('REJECTED');
        setPage(1);
      },
    },
    {
      label: 'Total Queue Records',
      value: allApprovals.length,
      subValue: 'Complete dual-control audit ledger',
      color: 'slate',
      onClick: () => {
        setStatusFilter('');
        setPage(1);
      },
    },
  ];

  const columns = [
    {
      header: 'Approval Type',
      cell: (r: any) => (
        <span className="font-semibold text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          {r.type}
        </span>
      ),
    },
    {
      header: 'Entity / Details',
      cell: (r: any) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{r.entityName || 'General'}</div>
          {r.comments && <div className="text-slate-500 italic mt-0.5">"{r.comments}"</div>}
        </div>
      ),
    },
    {
      header: 'Requested At',
      cell: (r: any) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(r.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
          APPROVED: 'success',
          PENDING: 'warning',
          REJECTED: 'danger',
        };
        return <Badge variant={variants[r.status] || 'warning'}>{r.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (r: any) =>
        r.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => approveMutation.mutate(r.id)}
              isLoading={approveMutation.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setRejectId(r.id)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">
            {r.reviewedAt ? `Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}` : 'Completed'}
          </span>
        ),
    },
  ];

  const customFilterToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-56">
        <CustomDropdown
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          placeholder="All Statuses"
          options={[
            { value: '', label: 'All Approval Statuses' },
            { value: 'PENDING', label: 'Pending Approvals', badge: `${pendingCount}` },
            { value: 'APPROVED', label: 'Approved Requests', badge: `${approvedCount}` },
            { value: 'REJECTED', label: 'Rejected Requests', badge: `${rejectedCount}` },
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
        title="Manager Approval Queue"
        description="Review pending rate modifications, custom design sign-offs, wholesale limits, and stock adjustments"
        badge="Governance & Dual Control"
        stats={statWidgets}
        searchPlaceholder="Search approvals by type, entity or comments..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        customFilters={customFilterToolbar}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        viewMode="table"
        tableContent={
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <Table columns={columns} data={approvals} isLoading={isLoading} />
          </div>
        }
      />

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject Approval Request"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectComment.trim()) {
                  toast({ type: 'warning', title: 'Required', message: 'Rejection reason is required' });
                  return;
                }
                if (rejectId) {
                  rejectMutation.mutate({ id: rejectId, comments: rejectComment });
                }
              }}
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Please describe why this change cannot be approved:</p>
          <Input
            label="Rejection Reason *"
            placeholder="e.g. Price margin is too low / Incomplete certificate"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
