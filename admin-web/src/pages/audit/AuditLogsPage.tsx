import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api/audit.api';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { StandardPageLayout, type StatWidget } from '../../components/layout/StandardPageLayout';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

export function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: response, isLoading } = useQuery({
    queryKey: ['audit-logs', page, itemsPerPage, actionFilter, entityFilter],
    queryFn: async () => {
      const res = await auditApi.getAll({
        page,
        limit: itemsPerPage,
        action: actionFilter || undefined,
        entityName: entityFilter || undefined,
      });
      return res.data;
    },
  });

  const logs = response?.data || [];
  const totalCount = response?.meta?.total ?? logs.length;
  const totalPages = response?.meta?.totalPages ?? 1;

  // Lightweight query for KPI metric counts
  const { data: statsResponse } = useQuery({
    queryKey: ['audit-logs', 'stats-kpi'],
    queryFn: async () => {
      const res = await auditApi.getAll({ limit: 1000 });
      return res.data?.data || [];
    },
  });

  const sampleLogs = statsResponse || [];

  const createCount = useMemo(
    () => sampleLogs.filter((l: any) => l.action === 'CREATE').length,
    [sampleLogs]
  );
  const updateCount = useMemo(
    () => sampleLogs.filter((l: any) => l.action === 'UPDATE').length,
    [sampleLogs]
  );
  const statusOrDeleteCount = useMemo(
    () => sampleLogs.filter((l: any) => l.action === 'STATUS_CHANGE' || l.action === 'DELETE').length,
    [sampleLogs]
  );

  // Distinct entities in dataset
  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(sampleLogs.map((l: any) => l.entityName).filter(Boolean))) as string[];
  }, [sampleLogs]);

  const statWidgets: StatWidget[] = [
    {
      label: 'Total Audit Events',
      value: totalCount,
      subValue: 'Immutable record ledger',
      color: 'gold',
      onClick: () => {
        setActionFilter('');
        setEntityFilter('');
        setPage(1);
      },
    },
    {
      label: 'Creation Actions',
      value: createCount,
      subValue: 'New entities & records inserted',
      color: 'emerald',
      onClick: () => {
        setActionFilter('CREATE');
        setPage(1);
      },
    },
    {
      label: 'Mutation Updates',
      value: updateCount,
      subValue: 'Field & benchmark rate modifications',
      color: 'blue',
      onClick: () => {
        setActionFilter('UPDATE');
        setPage(1);
      },
    },
    {
      label: 'Status / Security Events',
      value: statusOrDeleteCount,
      subValue: 'Workflow progressions & revocations',
      color: 'purple',
      onClick: () => {
        setActionFilter('STATUS_CHANGE');
        setPage(1);
      },
    },
  ];

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
        <span className="font-semibold text-slate-800 text-xs font-mono">
          {r.entityName}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      cell: (r: any) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(r.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
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

  const customFilterToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-48">
        <CustomDropdown
          value={actionFilter}
          onChange={(val) => {
            setActionFilter(val);
            setPage(1);
          }}
          placeholder="All Actions"
          options={[
            { value: '', label: 'All Actions' },
            { value: 'CREATE', label: 'CREATE' },
            { value: 'UPDATE', label: 'UPDATE' },
            { value: 'STATUS_CHANGE', label: 'STATUS_CHANGE' },
            { value: 'DELETE', label: 'DELETE' },
          ]}
        />
      </div>

      <div className="w-52">
        <CustomDropdown
          value={entityFilter}
          onChange={(val) => {
            setEntityFilter(val);
            setPage(1);
          }}
          placeholder="All Entities"
          options={[
            { value: '', label: 'All Entities' },
            ...uniqueEntities.map((ent) => ({
              value: ent,
              label: ent,
            })),
          ]}
        />
      </div>

      {(actionFilter || entityFilter || search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActionFilter('');
            setEntityFilter('');
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
        title="Immutable Audit Trail"
        description="Tamper-evident system activity log for regulatory, dual-control, and tax compliance audits"
        badge="Compliance & Security"
        stats={statWidgets}
        searchPlaceholder="Search audit events by entity, actor, IP or action..."
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
          <div className="space-y-4">
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
                    Close Diff
                  </button>
                </div>

                {(() => {
                  const activeRecord = logs.find((l: any) => l.id === expandedId);
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-slate-400 font-sans mb-1 font-semibold">BEFORE:</div>
                        <pre className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
                          {activeRecord?.before ? JSON.stringify(activeRecord.before, null, 2) : 'null (Created)'}
                        </pre>
                      </div>
                      <div>
                        <div className="text-slate-400 font-sans mb-1 font-semibold">AFTER:</div>
                        <pre className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
                          {activeRecord?.after ? JSON.stringify(activeRecord.after, null, 2) : 'null (Deleted)'}
                        </pre>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
