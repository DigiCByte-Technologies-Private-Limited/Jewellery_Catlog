import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  customDesignsApi,
  type CustomDesignRequestItem,
  type CustomDesignAttachmentItem,
} from '../../api/custom-designs.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  X,
  Sparkles,
  User,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface CustomDesignDetailModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomDesignDetailModal({
  requestId,
  isOpen,
  onClose,
}: CustomDesignDetailModalProps) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string>('NEW');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // 1. Fetch Request Details with Audit History
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['custom-design-detail', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await customDesignsApi.getById(requestId);
      return res.data?.data;
    },
    enabled: !!requestId && isOpen,
  });

  const request: CustomDesignRequestItem | undefined = response ?? undefined;

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setAdminNotes(request.adminNotes || '');
    }
  }, [request]);

  // 2. Mutation: Update Status & Admin Notes
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!requestId) return;
      return customDesignsApi.updateStatus(requestId, {
        status,
        adminNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-design-detail', requestId] });
      queryClient.invalidateQueries({ queryKey: ['custom-designs-list'] });
      queryClient.invalidateQueries({ queryKey: ['custom-designs-stats'] });
      setNotificationMsg('Status and notes updated successfully.');
      setTimeout(() => setNotificationMsg(null), 3000);
    },
    onError: (err: any) => {
      setNotificationMsg(err.response?.data?.message || 'Failed to update request.');
      setTimeout(() => setNotificationMsg(null), 4000);
    },
  });

  // 3. Mutation: Resend Admin Notifications
  const retryNotifMutation = useMutation({
    mutationFn: async () => {
      if (!requestId) return;
      return customDesignsApi.retryNotification(requestId);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['custom-design-detail', requestId] });
      queryClient.invalidateQueries({ queryKey: ['custom-designs-list'] });
      const statusText = res?.data?.data?.notificationStatus || 'Completed';
      setNotificationMsg(`Notifications re-dispatched: ${statusText}`);
      setTimeout(() => setNotificationMsg(null), 4000);
    },
    onError: (err: any) => {
      setNotificationMsg(err.response?.data?.message || 'Failed to dispatch notifications.');
      setTimeout(() => setNotificationMsg(null), 4000);
    },
  });

  if (!isOpen || !requestId) return null;

  const handleCopyId = () => {
    if (!request) return;
    navigator.clipboard.writeText(request.requestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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

  const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-wider text-amber-300">
                  {request?.requestId || 'Loading...'}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Request ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {request && (
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted on {request ? new Date(request.createdAt).toLocaleString('en-IN') : '...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => retryNotifMutation.mutate()}
              disabled={retryNotifMutation.isPending}
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-300"
              title="Resend Email & WhatsApp Alerts to Admin"
            >
              {retryNotifMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Retry Alerts
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {notificationMsg && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>{notificationMsg}</span>
            <button onClick={() => setNotificationMsg(null)} className="text-amber-700 hover:text-amber-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
              <span className="text-xs">Loading request details &amp; audit history...</span>
            </div>
          ) : isError || !request ? (
            <div className="p-8 text-center text-rose-600 text-sm">
              Failed to load request details. Please try again.
            </div>
          ) : (
            <>
              {/* SECTION 1: Customer Profile & Quick Outreach */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Customer Contact Information</span>
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Prefers: {request.preferredContactMethod || 'EMAIL'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Customer Name:</span>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">{request.customerName}</div>
                    {request.companyName && (
                      <div className="text-slate-500 flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{request.companyName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium">Notification Delivery Status:</span>
                    <div className="mt-0.5 font-mono text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2.5 py-1 inline-block">
                      {request.notificationStatus || 'PENDING'}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium">Email:</span>
                    <div className="mt-0.5">
                      <a
                        href={`mailto:${request.email}?subject=Regarding Your Custom Design Request ${request.requestId}`}
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{request.email}</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium">Phone / WhatsApp:</span>
                    <div className="mt-0.5 flex items-center gap-3">
                      <a
                        href={`tel:${request.phone}`}
                        className="text-slate-900 hover:text-amber-700 font-medium flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{request.phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhone(request.phone)}?text=${encodeURIComponent(
                          `Hello ${request.customerName}, this is regarding your Custom Design Request (${request.requestId}) at Aurum Jewels Atelier.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-[11px] shadow-2xs"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp Chat</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Design Specifications & Technical Requirements */}
              <div className="border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Design &amp; Material Specifications</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">Product / Category</span>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">{request.productName}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">Quantity Needed</span>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">{request.quantity || '1 unit'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">Dimensions / Ring Size</span>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">{request.dimensions || 'Standard / Unspecified'}</div>
                  </div>
                </div>

                {request.materialRequirements && (
                  <div className="mb-4 text-xs">
                    <span className="text-slate-500 font-medium">Precious Metal &amp; Gemstones:</span>
                    <div className="font-medium text-slate-800 bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 mt-1">
                      {request.materialRequirements}
                    </div>
                  </div>
                )}

                <div className="text-xs mb-4">
                  <span className="text-slate-500 font-medium">Custom Design Description:</span>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg mt-1 text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {request.designDescription}
                  </div>
                </div>

                {request.designRequirements && (
                  <div className="text-xs mb-4">
                    <span className="text-slate-500 font-medium">Technical Requirements:</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-1 text-slate-800 whitespace-pre-wrap">
                      {request.designRequirements}
                    </div>
                  </div>
                )}

                {request.additionalNotes && (
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Additional Notes / Budget / Occasion:</span>
                    <div className="p-2.5 bg-stone-50 rounded-lg mt-1 text-stone-700">
                      {request.additionalNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Attachments Gallery (Images, PDFs, CAD files) */}
              {(() => {
                const validAttachments = Array.isArray(request.attachments)
                  ? request.attachments.filter(
                      (f): f is CustomDesignAttachmentItem =>
                        !!f && typeof f === 'object' && !Array.isArray(f) && !!(f.url || f.originalName)
                    )
                  : [];

                return (
                  <div className="border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>Uploaded Reference Images &amp; CAD Files</span>
                      </h4>
                      <span className="text-xs text-slate-500">
                        {validAttachments.length} attachment(s)
                      </span>
                    </div>

                    {validAttachments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No reference attachments uploaded with this request.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {validAttachments.map((file, idx) => {
                          const isImage =
                            (typeof file.mimeType === 'string' && file.mimeType.startsWith('image/')) ||
                            (typeof file.url === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.url));
                          const fileName = file.originalName || file.filename || `Attachment-${idx + 1}`;
                          const fileSizeText =
                            typeof file.sizeBytes === 'number' && file.sizeBytes > 0
                              ? `${(file.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                              : null;
                          const fileExt =
                            file.mimeType && typeof file.mimeType === 'string'
                              ? file.mimeType.split('/').pop()?.toUpperCase()
                              : fileName.split('.').pop()?.toUpperCase() || 'FILE';

                          return (
                            <div
                              key={file.id || idx}
                              className="border border-slate-200 rounded-lg p-3 bg-white hover:border-amber-400 transition-colors flex flex-col justify-between"
                            >
                              <div>
                                {isImage && file.url && (
                                  <div className="w-full h-28 bg-slate-100 rounded-md overflow-hidden mb-2 relative group">
                                    <img
                                      src={file.url}
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                    />
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Image</span>
                                    </a>
                                  </div>
                                )}

                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
                                      {fileName}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {fileSizeText ? `${fileSizeText} • ${fileExt}` : fileExt}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {file.url && (
                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                                  <a
                                    href={file.url}
                                    download={fileName}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Attachments are stored securely and only accessible through authorized admin sessions.</span>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 4: Admin Management (Status Change & Internal Notes) */}
              <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Update Request Status &amp; Admin Notes</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Request Pipeline Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="NEW">NEW (Unreviewed)</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW (CAD / Feasibility)</option>
                      <option value="CONTACTED">CONTACTED (Customer Contacted)</option>
                      <option value="QUOTATION">QUOTATION (Cost &amp; Quote Sent)</option>
                      <option value="APPROVED">APPROVED (Customer Approved / Job Issued)</option>
                      <option value="REJECTED">REJECTED (Declined)</option>
                      <option value="COMPLETED">COMPLETED (Jewelry Crafted &amp; Delivered)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Internal Admin Notes &amp; Pricing Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add internal notes, quotes from karigar, customer budget discussions..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-amber-200"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>Save Status &amp; Notes</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* SECTION 5: Audit Trail & Timeline History */}
              <div className="border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-4">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Request History &amp; Audit Trail</span>
                </h4>

                {(!request.history || request.history.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No history records logged yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {request.history.map((event, idx) => (
                      <div key={event.id || idx} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {event.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(event.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          By <strong className="text-slate-700">{event.actorName}</strong> ({event.actorRole})
                        </div>
                        <p className="text-slate-600 mt-1 bg-slate-50 rounded p-2 text-xs">
                          {event.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
