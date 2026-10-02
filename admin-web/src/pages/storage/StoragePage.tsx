import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '../../api/storage.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import {
  HardDrive,
  Image as ImageIcon,
  FileText,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Search,
  Settings,
  Layers,
  Sparkles,
  RefreshCw,
  Lock,
  Eye,
  Download,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

export function StoragePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'settings' | 'diagnostics'>('overview');

  // Explorer filters
  const [domainFilter, setDomainFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<any>({
    activeDriver: 'LOCAL',
    bucketName: '',
    region: 'ap-south-1',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    publicCdnUrl: 'http://localhost:3001/uploads',
    quotaLimitGb: 50,
    enableAutoCompression: true,
  });

  const [testResult, setTestResult] = useState<any>(null);

  // ── Queries ──
  const { data: metricsResponse } = useQuery({
    queryKey: ['storage', 'metrics'],
    queryFn: async () => (await storageApi.getMetrics(50)).data?.data || null,
  });

  const { data: unifiedFilesResponse, isLoading: filesLoading } = useQuery({
    queryKey: ['storage', 'unified-files', domainFilter, typeFilter, searchQuery],
    queryFn: async () =>
      (
        await storageApi.getUnifiedFiles({
          domain: domainFilter || undefined,
          type: typeFilter || undefined,
          search: searchQuery || undefined,
          limit: 100,
        })
      ).data || { data: [], total: 0 },
  });

  useQuery({
    queryKey: ['storage', 'settings'],
    queryFn: async () => {
      const res = await storageApi.getSettings();
      const cfg = res.data?.data;
      if (cfg) {
        setSettingsForm({
          activeDriver: cfg.activeDriver || 'LOCAL',
          bucketName: cfg.bucketName || '',
          region: cfg.region || 'ap-south-1',
          endpoint: cfg.endpoint || '',
          accessKeyId: cfg.accessKeyId || '',
          secretAccessKey: '',
          publicCdnUrl: cfg.publicCdnUrl || 'http://localhost:3001/uploads',
          quotaLimitGb: cfg.quotaLimitGb || 50,
          enableAutoCompression: cfg.enableAutoCompression ?? true,
        });
      }
      return cfg;
    },
  });

  const { data: orphanDiagResponse, isLoading: diagLoading, refetch: refetchDiag } = useQuery({
    queryKey: ['storage', 'diagnostics'],
    queryFn: async () => (await storageApi.getOrphanDiagnostics()).data || null,
    enabled: activeTab === 'diagnostics',
  });

  // ── Mutations ──
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => storageApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['storage', 'metrics'] });
      toast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Storage server configuration updated successfully',
      });
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to update storage settings',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: any) => storageApi.testConnection(data),
    onSuccess: (res: any) => {
      const d = res.data;
      setTestResult(d);
      if (d.success) {
        toast({
          type: 'success',
          title: 'Handshake Verified',
          message: d.message || 'Storage connection test passed',
        });
      } else {
        toast({
          type: 'error',
          title: 'Connection Failed',
          message: d.error || 'Could not connect to storage provider',
        });
      }
    },
  });

  const cleanupOrphansMutation = useMutation({
    mutationFn: () => storageApi.cleanupOrphans(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['storage', 'diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['storage', 'metrics'] });
      toast({
        type: 'success',
        title: 'Orphans Cleaned',
        message: res.data?.message || 'Storage space reclaimed successfully',
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => storageApi.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      toast({ type: 'success', title: 'Asset Removed', message: 'File deleted and quota released' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Delete failed' });
    },
  });

  const metrics = metricsResponse || {
    totalFiles: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 Bytes',
    quotaLimitGb: 50,
    quotaLimitFormatted: '50 GB',
    usagePercent: 0,
    activeDriver: 'LOCAL',
    connectionStatus: 'CONNECTED',
    domainBreakdown: [],
    breakdown: [],
  };

  const files = unifiedFilesResponse?.data || [];

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ type: 'success', title: 'Copied', message: 'Public CDN URL copied to clipboard' });
  };

  const domainBadgeVariant: Record<string, 'gold' | 'info' | 'warning' | 'success'> = {
    PRODUCT_CATALOG: 'gold',
    WHOLESALE_KYC: 'warning',
    MEDIA_LIBRARY: 'info',
    SYSTEM_ATTACHMENT: 'success',
  };

  const columns = [
    {
      header: 'Asset / Document',
      cell: (r: any) => {
        const isPdf = r.mimeType?.includes('pdf');
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : r.publicUrl ? (
                <img src={r.publicUrl} alt={r.originalName} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-400" />
              )}
              {r.isPrivate && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white p-0.5 rounded-bl">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-xs truncate max-w-xs flex items-center gap-1.5">
                <span>{r.originalName || r.name}</span>
                {r.isPrivate && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-semibold">
                    Private Vault
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {r.mimeType} · {r.category}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Domain',
      cell: (r: any) => (
        <Badge variant={domainBadgeVariant[r.domain] || 'info'}>
          {r.domain?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Storage Provider',
      cell: (r: any) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {r.driver}
        </span>
      ),
    },
    {
      header: 'File Size',
      cell: (r: any) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {r.sizeFormatted}
        </span>
      ),
    },
    {
      header: 'Uploaded Date',
      cell: (r: any) => (
        <span className="text-xs text-slate-500">
          {new Date(r.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (r: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewFile(r)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Inspect / Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {r.publicUrl && (
            <button
              onClick={() => handleCopyLink(r.publicUrl)}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="Copy CDN URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {r.publicUrl && (
            <a
              href={r.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Open Asset in Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {!r.isPrivate && (
            <button
              onClick={() => {
                if (confirm(`Remove asset "${r.originalName}" from media storage?`)) {
                  deleteFileMutation.mutate(r.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Delete File"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Storage & Server Engine</h1>
          <p className="text-slate-500 text-sm">
            Unified multi-domain storage console: Public Edge CDN, Private KYC Vault, and S3/R2 Cloud Server
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'overview' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'explorer' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>File Explorer</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'settings' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Server Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'diagnostics' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Housekeeping</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW & ANALYTICS ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Storage Quota Card & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-amber-200">
              <CardContent className="pt-5">
                <div className="flex justify-between items-center text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  <span>Storage Used</span>
                  <span>{metrics.usagePercent}%</span>
                </div>
                <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                  {metrics.totalSizeFormatted}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, metrics.usagePercent))}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between font-mono">
                  <span>Quota: {metrics.quotaLimitFormatted}</span>
                  <span>
                    Available: {(metrics.quotaLimitGb - metrics.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Indexed Files</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1 flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-slate-500" />
                  <span>{metrics.totalFiles}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Across Catalog, KYC & Media</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-emerald-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Storage Health</div>
                <div className="text-2xl font-black text-emerald-950 font-mono mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>{metrics.connectionStatus || 'Connected'}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Read/write handshake operational</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Active Storage Server</div>
                <div className="text-2xl font-black text-blue-950 font-mono mt-1 flex items-center gap-1.5">
                  <Server className="w-5 h-5 text-blue-600" />
                  <span>{metrics.activeDriver}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Managed storage server provider</div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Breakdown Cards */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Storage by Domain</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.domainBreakdown?.map((d: any) => (
                <div key={d.domain} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {d.label}
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                      {d.sizeFormatted}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      {d.count} file(s) recorded
                    </span>
                  </div>
                  <Badge variant={domainBadgeVariant[d.domain] || 'info'}>
                    {d.domain === 'WHOLESALE_KYC' ? 'Private Vault' : 'Public Edge'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          {metrics.breakdown && metrics.breakdown.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Media Types Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                {metrics.breakdown.map((b: any) => (
                  <div key={b.category} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="text-slate-500 font-medium">{b.category?.replace('_', ' ')}</div>
                    <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                      {b.sizeFormatted} ({b.count} files)
                    </div>
                    <div className="text-[10px] text-amber-600 font-mono mt-0.5">
                      {b.percentageOfTotal}% of media volume
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: UNIFIED MULTI-DOMAIN FILE EXPLORER ── */}
      {activeTab === 'explorer' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Domain:</span>
              {[
                { id: '', label: 'All Files' },
                { id: 'PRODUCT_CATALOG', label: 'Catalog Media' },
                { id: 'WHOLESALE_KYC', label: 'Wholesale KYC Vault' },
                { id: 'MEDIA_LIBRARY', label: 'Media Library' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDomainFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    domainFilter === tab.id
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

              <span className="text-xs font-semibold text-slate-400 uppercase">Type:</span>
              {[
                { id: '', label: 'All' },
                { id: 'image', label: 'Images' },
                { id: 'pdf', label: 'PDFs' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    typeFilter === t.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Unified Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table columns={columns} data={files} isLoading={filesLoading} />
          </div>
        </div>
      )}

      {/* ── TAB 3: STORAGE SERVER SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="max-w-4xl space-y-6">
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Storage Server Configuration</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Configure primary storage infrastructure, cloud bucket credentials, and edge CDN endpoints
                </p>
              </div>

              {/* Provider Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Active Storage Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'LOCAL', name: 'Local Disk / Server', desc: 'On-premise / Server filesystem' },
                    { id: 'S3', name: 'Amazon S3', desc: 'AWS S3 Cloud Object Storage' },
                    { id: 'CLOUDFLARE_R2', name: 'Cloudflare R2', desc: 'Zero egress CDN storage' },
                    { id: 'MINIO', name: 'MinIO Private Server', desc: 'Self-hosted S3-compatible server' },
                  ].map((p) => {
                    const isSelected = settingsForm.activeDriver === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, activeDriver: p.id })}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-snug">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Credentials Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bucket Name / Namespace
                  </label>
                  <Input
                    placeholder="e.g. aurum-jewellery-vault"
                    value={settingsForm.bucketName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bucketName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Region
                  </label>
                  <Input
                    placeholder="e.g. ap-south-1 (Mumbai) or auto"
                    value={settingsForm.region}
                    onChange={(e) => setSettingsForm({ ...settingsForm, region: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Server Endpoint (Required for Cloudflare R2 / MinIO)
                  </label>
                  <Input
                    placeholder="https://<account_id>.r2.cloudflarestorage.com or http://192.168.1.50:9000"
                    value={settingsForm.endpoint}
                    onChange={(e) => setSettingsForm({ ...settingsForm, endpoint: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Access Key ID
                  </label>
                  <Input
                    placeholder="AKIA..."
                    value={settingsForm.accessKeyId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accessKeyId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secret Access Key
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter secret access key"
                    value={settingsForm.secretAccessKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, secretAccessKey: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Public Edge CDN Base URL
                  </label>
                  <Input
                    placeholder="e.g. https://cdn.luxuryjewels.com or http://localhost:3001/uploads"
                    value={settingsForm.publicCdnUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, publicCdnUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Quota Limit (GB)
                  </label>
                  <Input
                    type="number"
                    value={settingsForm.quotaLimitGb}
                    onChange={(e) => setSettingsForm({ ...settingsForm, quotaLimitGb: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="autoCompress"
                    checked={settingsForm.enableAutoCompression}
                    onChange={(e) => setSettingsForm({ ...settingsForm, enableAutoCompression: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <label htmlFor="autoCompress" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Enable automatic WebP image compression upon upload
                  </label>
                </div>
              </div>

              {/* Test Result Banner */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message || testResult.error}</span>
                  </div>
                  {testResult.latencyMs && (
                    <span className="font-mono font-bold bg-white/70 px-2 py-0.5 rounded border">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    testConnectionMutation.mutate({
                      driver: settingsForm.activeDriver,
                      bucketName: settingsForm.bucketName,
                      region: settingsForm.region,
                      endpoint: settingsForm.endpoint,
                      accessKeyId: settingsForm.accessKeyId,
                      secretAccessKey: settingsForm.secretAccessKey,
                    })
                  }
                  isLoading={testConnectionMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Test Handshake
                </Button>

                <Button
                  type="button"
                  onClick={() => updateSettingsMutation.mutate(settingsForm)}
                  isLoading={updateSettingsMutation.isPending}
                >
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 4: HOUSEKEEPING & DIAGNOSTICS ── */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Physical Files Scanned</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {orphanDiagResponse?.totalPhysicalFilesScanned ?? '—'}
                </div>
                <div className="text-xs text-slate-400 mt-1">Scanned on server disk</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-amber-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Orphaned Files Detected</div>
                <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                  {orphanDiagResponse?.orphanCount ?? '—'}
                </div>
                <div className="text-xs text-slate-400 mt-1">Files on disk without DB record</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-emerald-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Reclaimable Disk Space</div>
                <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
                  {orphanDiagResponse?.totalOrphanFormatted || '0 Bytes'}
                </div>
                <div className="text-xs text-slate-400 mt-1">Ready for safe deletion</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Disk Housekeeping Actions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Identify and purge unreferenced temporary uploads or evicted assets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => refetchDiag()} isLoading={diagLoading}>
                <RefreshCw className="w-4 h-4 mr-1.5" /> Re-Scan Disk
              </Button>
              <Button
                variant="danger"
                disabled={!orphanDiagResponse?.orphanCount}
                onClick={() => {
                  if (confirm(`Purge ${orphanDiagResponse?.orphanCount} orphaned files and reclaim ${orphanDiagResponse?.totalOrphanFormatted}?`)) {
                    cleanupOrphansMutation.mutate();
                  }
                }}
                isLoading={cleanupOrphansMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Clean Up Orphans
              </Button>
            </div>
          </div>

          {orphanDiagResponse?.orphans && orphanDiagResponse.orphans.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
                Detected Orphan Files ({orphanDiagResponse.orphans.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto font-mono text-xs">
                {orphanDiagResponse.orphans.map((o: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="truncate max-w-xl text-slate-700">{o.name}</div>
                    <div className="text-slate-500 shrink-0 font-bold">{o.sizeFormatted}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewFile && (
        <Modal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          title={`Asset Inspection: ${previewFile.originalName || previewFile.name}`}
        >
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center p-2">
              {previewFile.mimeType?.includes('pdf') ? (
                <iframe src={previewFile.previewUrl} className="w-full h-96 rounded border-0" title="PDF preview" />
              ) : previewFile.publicUrl ? (
                <img src={previewFile.publicUrl} alt={previewFile.name} className="max-h-96 object-contain rounded" />
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <Lock className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-white">Private KYC Proof</p>
                  <p className="text-xs text-slate-400 mt-1">
                    This file is encrypted in the private vault. Use the download action to inspect.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Domain:</span>
                <span className="font-semibold text-slate-800">{previewFile.domain}</span>
              </div>
              <div>
                <span className="text-slate-400 block">MIME Type:</span>
                <span className="font-semibold text-slate-800 font-mono">{previewFile.mimeType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Size:</span>
                <span className="font-semibold text-slate-800 font-mono">{previewFile.sizeFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Provider:</span>
                <span className="font-semibold text-slate-800 font-mono">{previewFile.driver}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {previewFile.downloadUrl && (
                <a
                  href={previewFile.downloadUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download File
                </a>
              )}
              <Button variant="outline" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
