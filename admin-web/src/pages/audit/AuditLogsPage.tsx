import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api/audit.api';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';

export function AuditLogsPage() {
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter],
    queryFn: async () => {
      const res = await auditApi.getAll({
        entityName: entityFilter || undefined,
        limit: 100,
      });
      return res.data;
    },
  });

  const logs = response?.data || [];

  const columns = [
    {
      header: 'Action',
      cell: (r: any) => {
        const actionColors: Record<string, string> = {
          CREATE: 'bg-emerald-100 text-emerald-800',
          UPDATE: 'bg-blue-100 text-blue-800',
          DELETE: 'bg-rose-100 text-rose-800',
          STATUS_CHANGE: 'bg-amber-100 text-amber-800',
        };
        return (
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${actionColors[r.action] || 'bg-slate-100 text-slate-800'}`}>
            {r.action}
          </span>
        );
      },
    },
    {
      header: 'Entity',
      cell: (r: any) => (
        <span className="font-semibold text-slate-800 text-sm">
          {r.entityName}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      cell: (r: any) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'User / Actor',
      cell: (r: any) => (
        <span className="text-xs text-slate-600 font-mono">
          {r.userEmail || r.userId?.slice(0, 8) || 'System'}
        </span>
      ),
    },
    {
      header: 'IP Address',
      cell: (r: any) => (
        <span className="text-xs text-slate-400 font-mono">
          {r.ipAddress || '—'}
        </span>
      ),
    },
    {
      header: 'Details',
      cell: (r: any) => (
        <button
          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
          className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-medium"
        >
          {expandedId === r.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {expandedId === r.id ? 'Hide Diff' : 'View Diff'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Immutable Audit Trail</h1>
            <p className="text-slate-500 text-sm">Tamper-evident system activity log for regulatory and compliance audits</p>
          </div>
        </div>

        <div className="w-64">
          <Input
            placeholder="Filter by entity (Product, Rate...)"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={logs} isLoading={isLoading} />
      </div>

      {/* Expanded Diff Viewer */}
      {expandedId && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-lg shadow-inner font-mono text-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400">Payload State Diff (Record #{expandedId.slice(0, 8)})</span>
            <button
              onClick={() => setExpandedId(null)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {(() => {
            const activeRecord = logs.find((l: any) => l.id === expandedId);
            return (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-400 font-sans mb-1 font-semibold">BEFORE:</div>
                  <pre className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto">
                    {activeRecord?.before ? JSON.stringify(activeRecord.before, null, 2) : 'null (Created)'}
                  </pre>
                </div>
                <div>
                  <div className="text-slate-400 font-sans mb-1 font-semibold">AFTER:</div>
                  <pre className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto">
                    {activeRecord?.after ? JSON.stringify(activeRecord.after, null, 2) : 'null (Deleted)'}
                  </pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
