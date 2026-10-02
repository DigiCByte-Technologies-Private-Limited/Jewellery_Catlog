import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  wholesalePartnersApi,
  type WholesaleApplicationItem,
  type WholesaleApplicationStatus,
  type WholesaleDocumentStatus,
} from '../../api/wholesale-partners.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  X,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Download,
  Eye,
  Clock,
  Loader2,
  FileText,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';

interface WholesalePartnerDetailModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WholesalePartnerDetailModal({
  applicationId,
  isOpen,
  onClose,
}: WholesalePartnerDetailModalProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [adminNote, setAdminNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ id: string; name: string; mime: string } | null>(null);

  // Fetch full application detail
  const { data: response, isLoading } = useQuery({
    queryKey: ['wholesale-application-detail', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      return await wholesalePartnersApi.getById(applicationId);
    },
    enabled: isOpen && !!applicationId,
  });

  const app: WholesaleApplicationItem | undefined = response?.data;

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async (payload: {
      status: WholesaleApplicationStatus;
      rejectionReason?: string;
      adminNotes?: string;
    }) => {
      if (!app) return;
      return await wholesalePartnersApi.updateStatus(app.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wholesale-applications-list'] });
      queryClient.invalidateQueries({ queryKey: ['wholesale-application-detail', applicationId] });
      setIsApproving(false);
      setIsRejecting(false);
      setRejectionReason('');
    },
  });

  // Document status mutation
  const docStatusMutation = useMutation({
    mutationFn: async (payload: { docId: string; status: WholesaleDocumentStatus; rejectionReason?: string }) => {
      return await wholesalePartnersApi.updateDocumentStatus(payload.docId, {
        status: payload.status,
        rejectionReason: payload.rejectionReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wholesale-application-detail', applicationId] });
    },
  });

  // Note mutation
  const noteMutation = useMutation({
    mutationFn: async (note: string) => {
      if (!app) return;
      return await wholesalePartnersApi.addNote(app.id, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wholesale-application-detail', applicationId] });
      setAdminNote('');
    },
  });

  if (!isOpen || !applicationId) return null;

  const handleDownloadDoc = (docId: string, name: string) => {
    wholesalePartnersApi.downloadDocument(docId, name);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">
                  {app?.applicationId || 'Loading...'}
                </span>
                {app && getStatusBadge(app.status)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {app?.companyName || 'Wholesale Application Review'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading || !app ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm text-slate-500 font-medium">Loading wholesale application details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'details'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Application & KYC Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Audit Trail ({app.history?.length || 0})
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Information Cards */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Card 1: Business Details */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-amber-600" /> Business & Shop Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Firm Name:</span>
                        <span className="font-bold text-slate-800 text-sm">{app.companyName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Business Type:</span>
                        <span className="font-semibold text-slate-800">{app.businessType || 'Wholesaler'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block font-medium">Registered Address:</span>
                        <span className="font-medium text-slate-800">
                          {app.addressLine || app.address}, {app.city}, {app.state} - {app.pincode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Owner & Contact Details */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                      <Phone className="w-4 h-4 text-amber-600" /> Proprietor Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Owner Full Name:</span>
                        <span className="font-bold text-slate-800 text-sm">{app.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Email (Login ID):</span>
                        <a
                          href={`mailto:${app.email}`}
                          className="font-semibold text-sky-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="w-3.5 h-3.5" /> {app.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Phone Number:</span>
                        <span className="font-semibold text-slate-800">{app.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">WhatsApp Number:</span>
                        {app.whatsappNumber ? (
                          <a
                            href={`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> {app.whatsappNumber}
                          </a>
                        ) : (
                          <span className="text-slate-400">Same as primary phone</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Identification & KYC Numbers */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Legal Identification Numbers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">PAN Number</span>
                        <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                          {app.panNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">Aadhaar Number</span>
                        <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                          {app.aadhaarNumber ? `XXXX XXXX ${app.aadhaarNumber.slice(-4)}` : 'Not provided'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">GSTIN</span>
                        <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                          {app.gstNumber || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Internal Admin Notes */}
                  <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2 mb-2">
                      🔒 Internal Compliance Notes (Hidden from wholesale partner)
                    </h3>
                    {app.adminNotes && (
                      <pre className="text-xs font-sans text-slate-700 bg-white p-3 rounded-xl border border-amber-200 whitespace-pre-wrap mb-3 max-h-36 overflow-y-auto">
                        {app.adminNotes}
                      </pre>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add private compliance note..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!adminNote.trim() || noteMutation.isPending}
                        onClick={() => noteMutation.mutate(adminNote)}
                        className="text-xs"
                      >
                        {noteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Note
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Submitted Documents */}
                <div className="space-y-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600" /> Submitted Proofs ({app.documents?.length || 0})
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold">Private Storage</span>
                    </div>

                    {app.documents && app.documents.length > 0 ? (
                      <div className="space-y-3">
                        {app.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mb-1">
                                  {doc.documentType} Proof
                                </span>
                                <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]" title={doc.originalFilename}>
                                  {doc.originalFilename}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB &bull; {doc.mimeType}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  doc.status === 'VERIFIED'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : doc.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </div>

                            {/* View & Download Buttons */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    id: doc.id,
                                    name: doc.originalFilename,
                                    mime: doc.mimeType,
                                  })
                                }
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(doc.id, doc.originalFilename)}
                                className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-amber-200"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </button>
                            </div>

                            {/* Per-Document Verification Toggle */}
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="text-slate-400 font-medium">Verify Document:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    docStatusMutation.mutate({ docId: doc.id, status: 'VERIFIED' })
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    doc.status === 'VERIFIED'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-green-50'
                                  }`}
                                >
                                  ✓ Valid
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    docStatusMutation.mutate({ docId: doc.id, status: 'REJECTED', rejectionReason: 'Illegible or invalid file' })
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    doc.status === 'REJECTED'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-red-50'
                                  }`}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No KYC documents attached to this application.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Audit Trail Tab */
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-amber-600" /> Immutable Action Timeline
                </h3>
                {app.history && app.history.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {app.history.map((h) => (
                      <div key={h.id} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{h.action}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                            {h.actorRole}: {h.actorName}
                          </span>
                        </div>
                        {h.note && <p className="text-slate-600 mt-1">{h.note}</p>}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(h.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No audit events recorded yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Bar Footer */}
        {app && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl shrink-0">
            <div className="text-xs text-slate-500">
              Submitted: {new Date(app.createdAt).toLocaleString('en-IN')}
            </div>

            <div className="flex items-center gap-2.5">
              {app.status !== 'UNDER_REVIEW' && app.status !== 'APPROVED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => statusMutation.mutate({ status: 'UNDER_REVIEW' })}
                  disabled={statusMutation.isPending}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Mark Under Review
                </Button>
              )}

              {app.status !== 'REJECTED' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsRejecting(true)}
                  disabled={statusMutation.isPending}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Reject Application
                </Button>
              )}

              {app.status !== 'APPROVED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsApproving(true)}
                  disabled={statusMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Approve Wholesale Account
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Approve Confirmation Dialog */}
        {isApproving && app && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Approve Wholesale Account?</h3>
                  <p className="text-xs text-slate-500">This will immediately activate the wholesale partner account.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
                <p><strong>Business:</strong> {app.companyName}</p>
                <p><strong>Owner:</strong> {app.ownerName}</p>
                <p><strong>Email:</strong> {app.email}</p>
                <p><strong>Verification Documents:</strong> {app.documents?.length || 0} attached</p>
              </div>

              <p className="text-xs text-slate-500">
                The partner will receive an automated approval notification with their portal login URL.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setIsApproving(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ status: 'APPROVED' })}
                >
                  {statusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Approve'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Dialog with Mandatory Reason */}
        {isRejecting && app && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reject Wholesale Application</h3>
                  <p className="text-xs text-slate-500">Please provide a clear reason for the applicant.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Rejection (Visible to Applicant) *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Uploaded PAN card image was blurred. Please provide a clear scanned copy of your firm PAN."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setIsRejecting(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!rejectionReason.trim() || statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ status: 'REJECTED', rejectionReason })}
                >
                  {statusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reject Application'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Preview Document Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-4 max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 truncate">{previewDoc.name}</h4>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto py-4 flex items-center justify-center bg-slate-900 rounded-xl my-2 min-h-[400px]">
                {previewDoc.mime.includes('image') ? (
                  <img
                    src={wholesalePartnersApi.getPreviewUrl(previewDoc.id)}
                    alt={previewDoc.name}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <iframe
                    src={wholesalePartnersApi.getPreviewUrl(previewDoc.id)}
                    title={previewDoc.name}
                    className="w-full h-[60vh] rounded-lg bg-white"
                  />
                )}
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadDoc(previewDoc.id, previewDoc.name)}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Original Document
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
