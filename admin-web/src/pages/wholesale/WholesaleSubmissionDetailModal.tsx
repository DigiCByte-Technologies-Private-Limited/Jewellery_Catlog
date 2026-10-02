import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  wholesaleApi,
  type WholesaleProductSubmissionItem,
  type WholesaleSubmissionStatus,
  type MediaConflictCheckResult,
} from '../../api/wholesale.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  X,
  Sparkles,
  Building2,
  Mail,
  Phone,
  Download,
  Eye,
  Clock,
  Loader2,
  ShieldCheck,
  Check,
  Copy,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Package,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface WholesaleSubmissionDetailModalProps {
  submissionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WholesaleSubmissionDetailModal({
  submissionId,
  isOpen,
  onClose,
}: WholesaleSubmissionDetailModalProps) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<WholesaleSubmissionStatus>('PENDING_REVIEW');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Publish to Catalog Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [replacePrimary, setReplacePrimary] = useState(true);
  const [altText, setAltText] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  // 1. Fetch Submission Details
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['wholesale-submission-detail', submissionId],
    queryFn: async () => {
      if (!submissionId) return null;
      const res = await wholesaleApi.getById(submissionId);
      return res.data?.data;
    },
    enabled: !!submissionId && isOpen,
  });

  const submission: WholesaleProductSubmissionItem | undefined = response ?? undefined;

  // 2. Fetch Conflict Check when Publish Modal is opened
  const {
    data: conflictResponse,
    isLoading: isLoadingConflict,
  } = useQuery({
    queryKey: ['wholesale-submission-conflict', submissionId],
    queryFn: async () => {
      if (!submissionId) return null;
      const res = await wholesaleApi.checkMediaConflict(submissionId);
      return res.data?.data;
    },
    enabled: isPublishModalOpen && !!submissionId,
  });

  const conflictData: MediaConflictCheckResult | undefined = conflictResponse ?? undefined;

  useEffect(() => {
    if (submission) {
      setStatus(submission.status);
      setAdminNotes(submission.adminNotes || '');
      setRejectionReason(submission.rejectionReason || '');
      setAltText(submission.productName || '');
    }
  }, [submission]);

  // 3. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (payload: {
      status: WholesaleSubmissionStatus;
      rejectionReason?: string;
      adminNotes?: string;
    }) => {
      if (!submissionId) return;
      return await wholesaleApi.updateStatus(submissionId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wholesale-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['wholesale-submissions-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wholesale-submission-detail', submissionId] });
      alert('Submission status updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update submission status');
    },
  });

  // 4. Publish to Catalog Mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!submissionId) return;
      return await wholesaleApi.publishToCatalog(submissionId, {
        imageIndex: 0,
        replacePrimary,
        isPrimary: replacePrimary,
        displayOrder,
        altText,
      });
    },
    onSuccess: (res) => {
      setIsPublishModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['wholesale-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['wholesale-submissions-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wholesale-submission-detail', submissionId] });
      alert(res?.data?.message || 'Image published to official product catalog successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to publish image to catalog');
    },
  });

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (submission?.submissionId) {
      navigator.clipboard.writeText(submission.submissionId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDownloadOriginal = async () => {
    if (!submissionId) return;
    try {
      setIsDownloading(true);
      const safeName = submission?.submissionId || 'proposal-image';
      await wholesaleApi.downloadImage(submissionId, 0, safeName);
    } catch (err: any) {
      alert('Failed to download original image: ' + (err.message || 'Network error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveStatus = (overrideStatus?: WholesaleSubmissionStatus) => {
    const targetStatus = overrideStatus || status;
    if (targetStatus === 'IMAGE_REJECTED' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this image proposal.');
      return;
    }
    updateStatusMutation.mutate({
      status: targetStatus,
      rejectionReason: targetStatus === 'IMAGE_REJECTED' ? rejectionReason : undefined,
      adminNotes,
    });
  };

  const getStatusBadge = (s: WholesaleSubmissionStatus) => {
    switch (s) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'IMAGE_ACCEPTED':
        return <Badge variant="success">Image Accepted</Badge>;
      case 'IMAGE_REJECTED':
        return <Badge variant="danger">Image Rejected</Badge>;
      case 'COMPLETED':
        return <Badge variant="gold">Completed</Badge>;
      default:
        return <Badge variant="info">{s}</Badge>;
    }
  };

  const mainImage = submission?.images?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Wholesale Proposal: {submission?.submissionId || 'Loading...'}
                </h2>
                {submission && (
                  <button
                    onClick={handleCopyId}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy Submission ID"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {submission && getStatusBadge(submission.status)}
                {submission?.isPublishedToCatalog && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Published to Catalog
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted on{' '}
                {submission?.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString()
                  : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-sm text-slate-400">Loading proposal details...</span>
          </div>
        ) : isError || !submission ? (
          <div className="p-12 text-center text-rose-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load proposal details. Please try again.</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* Top Grid: Submitter Details & Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Wholesale Submitter Profile */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase border-b border-slate-800/80 pb-2">
                  <Building2 className="w-4 h-4" /> Wholesale Client Information
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Company Name</span>
                    <span className="font-medium text-slate-200">
                      {submission.user?.companyName || 'Wholesale Partner'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Contact Person</span>
                    <span className="font-medium text-slate-200">
                      {submission.user?.fullName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      {submission.user?.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone / WhatsApp</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      {submission.user?.phone || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Product Reference & Details */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                    <Package className="w-4 h-4" /> Proposed Product Information
                  </div>
                  {submission.productId && (
                    <span className="text-[11px] px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-mono">
                      Linked Catalog Item
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Product Name</span>
                    <span className="font-semibold text-white">
                      {submission.productName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Product SKU / ID</span>
                    <span className="font-mono text-slate-200">
                      {submission.productSku || submission.productId || 'New Proposal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Category</span>
                    <span className="text-slate-200">
                      {submission.productCategory || 'General'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Subcategory / Variant</span>
                    <span className="text-slate-200">
                      {submission.productSubcategory ||
                        submission.productSpecifications?.colorVariant ||
                        '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications & Notes */}
            {(submission.productSpecifications || submission.productDescription || submission.additionalNotes) && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase border-b border-slate-800/80 pb-2">
                  <Layers className="w-4 h-4" /> Specifications & Descriptions
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Material</span>
                    <span className="text-slate-200">{submission.productSpecifications?.material || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Dimensions</span>
                    <span className="text-slate-200">{submission.productSpecifications?.dimensions || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Color / Variant</span>
                    <span className="text-slate-200">{submission.productSpecifications?.colorVariant || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Quantity / Order Vol</span>
                    <span className="text-slate-200">{submission.productSpecifications?.quantity || '—'}</span>
                  </div>
                </div>
                {submission.productDescription && (
                  <div className="pt-2 text-xs border-t border-slate-800/50">
                    <span className="text-slate-400 block mb-1">Product Description:</span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                      {submission.productDescription}
                    </p>
                  </div>
                )}
                {submission.additionalNotes && (
                  <div className="pt-2 text-xs border-t border-slate-800/50">
                    <span className="text-slate-400 block mb-1">Additional Submitter Notes:</span>
                    <p className="text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                      "{submission.additionalNotes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submitted Image Preview & Technical Specs */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" /> Submitted Proposal Image
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-resolution asset proposal submitted by wholesale partner.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadOriginal}
                    disabled={isDownloading || !mainImage}
                    className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    )}
                    Download Original Quality Image
                  </Button>

                  {/* Use Image for Product button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!submission.productId) {
                        alert('This submission is not linked to an official catalog product ID yet. Please link or approve first.');
                      }
                      setIsPublishModalOpen(true);
                    }}
                    disabled={submission.isPublishedToCatalog}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {submission.isPublishedToCatalog ? 'Published to Catalog' : 'Use Image for Product'}
                  </Button>
                </div>
              </div>

              {mainImage ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Large Image Preview with Zoom */}
                  <div className="md:col-span-5 relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2 min-h-[260px]">
                    <img
                      src={mainImage.url}
                      alt={mainImage.originalName}
                      className="max-h-64 w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      onClick={() => setZoomedImageUrl(mainImage.url)}
                      className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Inspect High-Res"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Metadata & Technical Specs */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block mb-0.5">Original File Name</span>
                        <span className="font-mono text-slate-200 truncate block">
                          {mainImage.originalName}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block mb-0.5">File Size</span>
                        <span className="font-mono text-slate-200">
                          {(mainImage.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block mb-0.5">Dimensions</span>
                        <span className="font-mono text-slate-200">
                          {mainImage.width && mainImage.height
                            ? `${mainImage.width} × ${mainImage.height} px`
                            : 'High Resolution (Preserved)'}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block mb-0.5">MIME Format</span>
                        <span className="font-mono text-slate-200 uppercase">
                          {mainImage.mimeType}
                        </span>
                      </div>
                    </div>

                    {submission.imageMetadata && (
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 text-xs space-y-1.5">
                        {submission.imageMetadata.title && (
                          <p>
                            <strong className="text-slate-300">Title:</strong>{' '}
                            <span className="text-slate-400">{submission.imageMetadata.title}</span>
                          </p>
                        )}
                        {submission.imageMetadata.description && (
                          <p>
                            <strong className="text-slate-300">Description:</strong>{' '}
                            <span className="text-slate-400">{submission.imageMetadata.description}</span>
                          </p>
                        )}
                        {submission.imageMetadata.sourceReference && (
                          <p>
                            <strong className="text-slate-300">Source / Reference:</strong>{' '}
                            <span className="text-slate-400">{submission.imageMetadata.sourceReference}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No images attached to this submission.
                </div>
              )}
            </div>

            {/* Admin Decision & Workflow Form */}
            <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Decision & Review Workflow
                </h3>
                <span className="text-xs text-slate-400">
                  {submission.reviewedAt ? `Last reviewed: ${new Date(submission.reviewedAt).toLocaleDateString()}` : 'Pending initial review'}
                </span>
              </div>

              {/* Status Picker Tabs / Quick Actions */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Review Status Decision</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'PENDING_REVIEW', label: 'Pending Review', color: 'border-amber-500/30 text-amber-300' },
                      { id: 'UNDER_REVIEW', label: 'Under Review', color: 'border-blue-500/30 text-blue-300' },
                      { id: 'IMAGE_ACCEPTED', label: 'Accept Image', color: 'border-emerald-500/30 text-emerald-300' },
                      { id: 'IMAGE_REJECTED', label: 'Reject Image', color: 'border-rose-500/30 text-rose-300' },
                      { id: 'COMPLETED', label: 'Mark Completed', color: 'border-slate-500/30 text-slate-300' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        status === st.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                          : `bg-slate-900/60 ${st.color} hover:bg-slate-800`
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* If Rejected, Rejection Reason Input */}
              {status === 'IMAGE_REJECTED' && (
                <div className="space-y-1.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs">
                  <label className="text-rose-300 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Reason for Rejection (Visible to Wholesale Submitter) *
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Image resolution is too low, contains watermarks, or does not match catalog styling guidelines..."
                    className="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}

              {/* Internal Admin Notes */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">
                  Internal Admin Notes (For internal staff & audit log)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private notes, karigar cross-checks, studio retoucher comments..."
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Save Decision Button */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => handleSaveStatus()}
                  disabled={updateStatusMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save Review Decision
                </Button>
              </div>
            </div>

            {/* Audit & Workflow History */}
            {submission.history && submission.history.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs tracking-wider uppercase border-b border-slate-800/60 pb-2">
                  <Clock className="w-3.5 h-3.5" /> Audit & Activity Trail ({submission.history.length})
                </div>
                <div className="space-y-2 text-xs">
                  {submission.history.map((hist) => (
                    <div
                      key={hist.id}
                      className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-slate-200">
                            {hist.actorName} ({hist.actorRole})
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(hist.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-0.5">
                          Action: <span className="font-mono text-amber-300">{hist.action}</span>
                          {hist.fromStatus && hist.toStatus && (
                            <span className="text-slate-400">
                              {' '}
                              ({hist.fromStatus} <ArrowRight className="w-3 h-3 inline mx-0.5" /> {hist.toStatus})
                            </span>
                          )}
                        </p>
                        {hist.notes && (
                          <p className="text-slate-400 mt-1 text-[11px] italic bg-slate-950/40 p-1.5 rounded">
                            "{hist.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Wholesale Proposal Flow • Strict Separation of Proposed vs. Official Catalog Assets
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-xs">
            Close
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FULL RESOLUTION ZOOM MODAL */}
      {/* ============================================================== */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={zoomedImageUrl}
              alt="High-Res Zoom"
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-700"
            />
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PUBLISH TO OFFICIAL CATALOG MODAL (CONFLICT CHECK & RESOLUTION) */}
      {/* ============================================================== */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Publish Image to Official Product Catalog
                </h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Catalog Media Review & Conflict Check:</strong>
                  <br />
                  Publishing copies the proposed file from isolated storage into the official product media catalog (`product_media` table). Wholesale users never have direct write access.
                </div>
              </div>

              {isLoadingConflict ? (
                <div className="p-8 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400" /> Checking catalog media conflicts...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left: Current Primary Image */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Current Primary Catalog Image
                      </div>
                      {conflictData?.currentPrimaryMedia ? (
                        <div className="space-y-2">
                          <img
                            src={conflictData.currentPrimaryMedia.url}
                            alt="Current Primary"
                            className="h-36 w-full object-contain bg-slate-900 rounded-lg p-1"
                          />
                          <p className="text-[10px] text-slate-500 truncate">
                            {conflictData.currentPrimaryMedia.altText || 'Official primary image'}
                          </p>
                        </div>
                      ) : (
                        <div className="h-36 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg border border-dashed border-slate-800 text-slate-500">
                          <Package className="w-6 h-6 mb-1 opacity-50" />
                          <span>No official primary image yet</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Submitted Proposed Image */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 text-center">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                        Proposed Wholesale Image
                      </div>
                      {mainImage && (
                        <div className="space-y-2">
                          <img
                            src={mainImage.url}
                            alt="Proposed Image"
                            className="h-36 w-full object-contain bg-slate-900 rounded-lg p-1 border border-amber-500/20"
                          />
                          <p className="text-[10px] text-amber-300 font-mono truncate">
                            {mainImage.originalName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conflict Resolution Options */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <label className="font-semibold text-slate-200 block text-xs">
                      Choose Publishing Action:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer">
                        <input
                          type="radio"
                          name="conflictChoice"
                          checked={replacePrimary}
                          onChange={() => setReplacePrimary(true)}
                          className="mt-0.5 text-amber-500 focus:ring-amber-400"
                        />
                        <div>
                          <span className="font-bold text-white block">
                            Replace Current Primary Image
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Sets this submitted image as the main hero photo for product catalog and storefront. Any existing primary image will be demoted to secondary gallery photo.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer">
                        <input
                          type="radio"
                          name="conflictChoice"
                          checked={!replacePrimary}
                          onChange={() => setReplacePrimary(false)}
                          className="mt-0.5 text-amber-500 focus:ring-amber-400"
                        />
                        <div>
                          <span className="font-bold text-white block">
                            Add to Gallery as Secondary Image
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Keeps existing primary photo intact, and appends this submitted image to the product's image gallery.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Metadata fields */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Catalog Image Alt Text
                        </label>
                        <input
                          type="text"
                          value={altText}
                          onChange={(e) => setAltText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs"
                          placeholder="Alt description for SEO"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Display Sort Order
                        </label>
                        <input
                          type="number"
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPublishModalOpen(false)}
                className="border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                )}
                Confirm & Publish to Catalog
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
