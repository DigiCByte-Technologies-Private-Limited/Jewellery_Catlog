import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '../../api/storage.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import {
  HardDrive,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Search,
} from 'lucide-react';

export function StoragePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    fileName: '',
    originalName: '',
    mimeType: 'image/webp',
    sizeBytes: '2500000',
    driver: 'S3',
    category: 'PRODUCT_IMAGE',
    publicUrl: '',
    storagePath: '',
    width: '1920',
    height: '1080',
  });

  // Queries
  const { data: metricsResponse } = useQuery({
    queryKey: ['storage', 'metrics'],
    queryFn: async () => (await storageApi.getMetrics(50)).data?.data || null,
  });

  const { data: filesResponse, isLoading: filesLoading } = useQuery({
    queryKey: ['storage', 'files', categoryFilter, searchQuery],
    queryFn: async () =>
      (
        await storageApi.getFiles({
          category: categoryFilter || undefined,
          search: searchQuery || undefined,
          limit: 100,
        })
      ).data || { data: [], total: 0 },
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (data: any) => storageApi.uploadFile(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      toast({
        type: 'success',
        title: 'Media Uploaded',
        message: `${res.data?.data?.originalName || 'Asset'} indexed to media CDN`,
      });
      setIsUploadOpen(false);
      setUploadForm({
        fileName: '',
        originalName: '',
        mimeType: 'image/webp',
        sizeBytes: '2500000',
        driver: 'S3',
        category: 'PRODUCT_IMAGE',
        publicUrl: '',
        storagePath: '',
        width: '1920',
        height: '1080',
      });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Upload Failed', message: err.response?.data?.message || 'Storage write error' });
    },
  });

  const deleteMutation = useMutation({
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
    breakdown: [],
  };

  const files = filesResponse?.data || [];

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ type: 'success', title: 'Copied', message: 'Public CDN URL copied to clipboard' });
  };

  const categoryBadgeVariant: Record<string, 'gold' | 'info' | 'warning' | 'success'> = {
    PRODUCT_IMAGE: 'gold',
    CERTIFICATE_PDF: 'info',
    SHOWROOM_BANNER: 'warning',
    SYSTEM_BACKUP: 'success',
  };

  const columns = [
    {
      header: 'Asset / File',
      cell: (r: any) => {
        const isPdf = r.mimeType?.includes('pdf');
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : r.publicUrl ? (
                <img src={r.publicUrl} alt={r.originalName} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-xs truncate max-w-xs">{r.originalName}</div>
              <div className="text-[11px] text-slate-400 font-mono">{r.mimeType} {r.width ? `· ${r.width}x${r.height}` : ''}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Category',
      cell: (r: any) => (
        <Badge variant={categoryBadgeVariant[r.category] || 'info'}>
          {r.category?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Storage Driver',
      cell: (r: any) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {r.driver}
        </span>
      ),
    },
    {
      header: 'Size',
      cell: (r: any) => {
        const kb = Number(r.sizeBytes) / 1024;
        const mb = kb / 1024;
        return (
          <span className="font-mono text-xs font-medium text-slate-800">
            {mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`}
          </span>
        );
      },
    },
    {
      header: 'Uploaded Date',
      cell: (r: any) => (
        <span className="text-xs text-slate-500">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (r: any) => (
        <div className="flex items-center gap-1.5">
          {r.publicUrl && (
            <button
              onClick={() => handleCopyLink(r.publicUrl)}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="Copy Public URL"
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
              title="Open Asset"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => {
              if (confirm(`Evict file ${r.originalName} from media storage?`)) {
                deleteMutation.mutate(r.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete File"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Media & Storage Service</h1>
          <p className="text-slate-500 text-sm">High-resolution jewellery photography, 360-degree turntables, diamond certificates & backup registry</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <UploadCloud className="w-4 h-4 mr-1.5" /> Upload / Register Asset
        </Button>
      </div>

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
                style={{ width: `${Math.min(100, Math.max(5, metrics.usagePercent))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between font-mono">
              <span>Quota: {metrics.quotaLimitFormatted}</span>
              <span>Available: {(50 - (metrics.totalSizeBytes / (1024 * 1024 * 1024))).toFixed(2)} GB</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indexed Assets</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1 flex items-center gap-1.5">
              <HardDrive className="w-5 h-5 text-slate-500" />
              <span>{metrics.totalFiles || files.length}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Images, 360 videos & PDFs</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Storage Health</div>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Optimal</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">S3 bucket sync active & verified</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Edge CDN Delivery</div>
            <div className="text-2xl font-black text-blue-950 font-mono mt-1 flex items-center gap-1.5">
              <Server className="w-5 h-5 text-blue-600" />
              <span>Cloudflare R2 / S3</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Ultra-low latency catalog media</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Chips */}
      {metrics.breakdown && metrics.breakdown.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
          {metrics.breakdown.map((b: any) => (
            <div key={b.category} className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs">
              <div className="text-slate-500 font-medium">{b.category?.replace('_', ' ')}</div>
              <div className="font-mono font-bold text-slate-800 mt-0.5">{b.sizeFormatted} ({b.count} files)</div>
              <div className="text-[10px] text-amber-600 font-mono">{b.percentageOfTotal}% of used space</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2 flex-wrap">
          {(['', 'PRODUCT_IMAGE', 'CERTIFICATE_PDF', 'SHOWROOM_BANNER', 'SYSTEM_BACKUP'] as const).map((cat) => (
            <button
              key={cat || 'ALL'}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat ? cat.replace('_', ' ') : 'All Files'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets by file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Media Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={files} isLoading={filesLoading} />
      </div>

      {/* Upload Asset Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload / Register Media Asset to Storage"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!uploadForm.fileName || !uploadForm.publicUrl) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'File name and public URL are required' });
                  return;
                }
                uploadMutation.mutate({
                  ...uploadForm,
                  originalName: uploadForm.originalName || uploadForm.fileName,
                  sizeBytes: Number(uploadForm.sizeBytes || 2500000),
                  storagePath: uploadForm.storagePath || `uploads/media/${uploadForm.fileName}`,
                  width: uploadForm.width ? Number(uploadForm.width) : undefined,
                  height: uploadForm.height ? Number(uploadForm.height) : undefined,
                });
              }}
              isLoading={uploadMutation.isPending}
            >
              <UploadCloud className="w-4 h-4 mr-1.5" /> Save to Registry
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="File Name *"
              placeholder="e.g. bridal-necklace-front-angle.webp"
              value={uploadForm.fileName}
              onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value, originalName: e.target.value })}
            />
            <Select
              label="Asset Category"
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              options={[
                { label: 'Product Photography / 360 Set', value: 'PRODUCT_IMAGE' },
                { label: 'Gemstone / BIS Certificate (PDF)', value: 'CERTIFICATE_PDF' },
                { label: 'Showroom Marketing Banner', value: 'SHOWROOM_BANNER' },
                { label: 'Encrypted Database Backup', value: 'SYSTEM_BACKUP' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Storage Driver"
              value={uploadForm.driver}
              onChange={(e) => setUploadForm({ ...uploadForm, driver: e.target.value })}
              options={[
                { label: 'AWS S3 (JewelAdmin Primary Bucket)', value: 'S3' },
                { label: 'Cloudflare R2 Edge Storage', value: 'CLOUDFLARE_R2' },
                { label: 'Local Encrypted SSD Storage', value: 'LOCAL' },
              ]}
            />
            <Select
              label="MIME Type"
              value={uploadForm.mimeType}
              onChange={(e) => setUploadForm({ ...uploadForm, mimeType: e.target.value })}
              options={[
                { label: 'image/webp (Optimized)', value: 'image/webp' },
                { label: 'image/jpeg', value: 'image/jpeg' },
                { label: 'image/png', value: 'image/png' },
                { label: 'application/pdf', value: 'application/pdf' },
                { label: 'video/mp4 (360 Video)', value: 'video/mp4' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Size (Bytes)"
              type="number"
              placeholder="e.g. 2450000"
              value={uploadForm.sizeBytes}
              onChange={(e) => setUploadForm({ ...uploadForm, sizeBytes: e.target.value })}
            />
            <Input
              label="Width (px)"
              type="number"
              value={uploadForm.width}
              onChange={(e) => setUploadForm({ ...uploadForm, width: e.target.value })}
            />
            <Input
              label="Height (px)"
              type="number"
              value={uploadForm.height}
              onChange={(e) => setUploadForm({ ...uploadForm, height: e.target.value })}
            />
          </div>

          <Input
            label="Public Access URL *"
            placeholder="e.g. https://cdn.jeweladmin.com/catalog/necklace-front.webp"
            value={uploadForm.publicUrl}
            onChange={(e) => setUploadForm({ ...uploadForm, publicUrl: e.target.value })}
          />

          <Input
            label="Storage Path (Optional)"
            placeholder="e.g. catalog/2026/09/necklace-front.webp"
            value={uploadForm.storagePath}
            onChange={(e) => setUploadForm({ ...uploadForm, storagePath: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
