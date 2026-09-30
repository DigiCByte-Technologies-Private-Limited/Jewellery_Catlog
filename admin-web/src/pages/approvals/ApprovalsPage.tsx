import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../../api/approvals.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { CheckCircle, XCircle } from 'lucide-react';

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  // Fetch approvals
  const { data: response, isLoading } = useQuery({
    queryKey: ['approvals', statusFilter],
    queryFn: async () => {
      const res = await approvalsApi.getAll({
        status: statusFilter || undefined,
        limit: 50,
      });
      return res.data;
    },
  });

  const approvals = response?.data || [];

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
      cell: (r: any) => new Date(r.createdAt).toLocaleString(),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approval Queue</h1>
          <p className="text-slate-500 text-sm">Review pending rate modifications, product publishes, and stock adjustments</p>
        </div>

        <div className="flex gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((s) => (
            <Button
              key={s || 'ALL'}
              size="sm"
              variant={statusFilter === s ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s || 'ALL'}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={approvals} isLoading={isLoading} />
      </div>

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
    </div>
  );
}
