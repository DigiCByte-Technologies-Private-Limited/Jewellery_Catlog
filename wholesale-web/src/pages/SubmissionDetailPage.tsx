import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, Loader2, AlertCircle, Calendar, Building2,
  Phone, Mail, Package, CheckCircle2, XCircle, Clock, Eye,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  getSubmissionById, STATUS_LABELS, STATUS_COLORS,
  type WholesaleSubmission, type SubmissionHistory,
} from '../api/wholesale.api';

const ACTION_LABELS: Record<string, string> = {
  SUBMISSION_CREATED: 'Proposal Submitted',
  STATUS_UPDATED: 'Status Updated',
  IMAGE_ACCEPTED: 'Image Accepted',
  IMAGE_REJECTED: 'Image Rejected',
  IMAGE_DOWNLOADED: 'Image Downloaded by Admin',
  PUBLISHED_TO_CATALOG: 'Published to Catalog',
  NOTIFICATION_SENT: 'Notification Sent',
  NOTE_ADDED: 'Note Added',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  SUBMISSION_CREATED: FileText,
  STATUS_UPDATED: Clock,
  IMAGE_ACCEPTED: CheckCircle2,
  IMAGE_REJECTED: XCircle,
  IMAGE_DOWNLOADED: Eye,
  PUBLISHED_TO_CATALOG: Package,
  NOTIFICATION_SENT: Mail,
  NOTE_ADDED: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  SUBMISSION_CREATED: 'bg-blue-100 text-blue-600',
  STATUS_UPDATED: 'bg-amber-100 text-amber-600',
  IMAGE_ACCEPTED: 'bg-green-100 text-green-600',
  IMAGE_REJECTED: 'bg-red-100 text-red-600',
  IMAGE_DOWNLOADED: 'bg-purple-100 text-purple-600',
  PUBLISHED_TO_CATALOG: 'bg-emerald-100 text-emerald-600',
  NOTIFICATION_SENT: 'bg-stone-100 text-stone-600',
  NOTE_ADDED: 'bg-stone-100 text-stone-600',
};

export const SubmissionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const emailOrPhone = (location.state as any)?.emailOrPhone || '';

  const [data, setData] = useState<(WholesaleSubmission & { history: SubmissionHistory[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [authInput, setAuthInput] = useState(emailOrPhone);
  const [needsAuth, setNeedsAuth] = useState(!emailOrPhone);

  const load = async (auth: string) => {
    if (!id || !auth.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await getSubmissionById(id, auth.trim());
      setData(res);
      setNeedsAuth(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to load submission. Check your email/phone.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailOrPhone && id) load(emailOrPhone);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  /* ── Auth wall ── */
  if (needsAuth && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF8F5]">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-[#B89047]" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1C1917] mb-2">Verify Your Identity</h2>
          <p className="text-stone-500 text-sm mb-6">Enter the email or phone number you used when submitting this proposal.</p>
          <input
            className="input-field mb-4"
            placeholder="Email or phone number"
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(authInput)}
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button onClick={() => load(authInput)} className="btn-primary w-full">View Submission</button>
          <Link to="/my-submissions" className="block mt-3 text-xs text-stone-400 hover:text-[#8C6A28]">← Back to My Submissions</Link>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#B89047]" />
      </div>
    );
  }

  /* ── Error ── */
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF8F5]">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-stone-700 mb-2">Submission Not Found</p>
          <p className="text-stone-400 text-sm mb-4">{error || 'This submission could not be loaded.'}</p>
          <Link to="/my-submissions" className="btn-secondary inline-flex">← Back to My Submissions</Link>
        </div>
      </div>
    );
  }

  const imgUrl = (idx: number) =>
    `http://localhost:3001/api/v1/wholesale/submissions/${data.id}/images/${idx}`;

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link to="/my-submissions" state={{ email: authInput }} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#8C6A28] transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to My Submissions
        </Link>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-sm text-stone-400">{data.submissionId}</span>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[data.status]}`}>
                {STATUS_LABELS[data.status]}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">{data.productName}</h1>
            <p className="text-stone-400 text-sm mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Submitted {formatDate(data.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {data.images?.length > 0 && (
              <div className="card overflow-hidden">
                <div className="relative aspect-video bg-stone-100">
                  <img
                    src={imgUrl(activeImg)}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f5f5f5" width="100" height="100"/></svg>'; }}
                  />
                  {data.images.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg((i) => Math.max(0, i - 1))} disabled={activeImg === 0} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center disabled:opacity-30">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActiveImg((i) => Math.min(data.images.length - 1, i + 1))} disabled={activeImg === data.images.length - 1} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center disabled:opacity-30">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {data.images.map((_, i) => (
                          <button key={i} onClick={() => setActiveImg(i)} className={`w-2 h-2 rounded-full transition ${i === activeImg ? 'bg-[#B89047]' : 'bg-white/60'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {data.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {data.images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-[#B89047]' : 'border-stone-200'}`}>
                        <img src={imgUrl(i)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Product Details */}
            <div className="card p-6">
              <h3 className="font-semibold text-[#1C1917] mb-4">Product Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: 'Category', value: data.productCategory },
                  { label: 'Wholesale Quantity', value: data.wholesaleQuantity ?? '—' },
                  { label: 'Color / Variant', value: (data as any).colorOrVariant ?? '—' },
                  { label: 'Brand', value: (data as any).brandOrManufacturer ?? '—' },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{row.label}</dt>
                    <dd className="text-stone-700 mt-0.5">{row.value?.toString() || '—'}</dd>
                  </div>
                ))}
                {data.productDescription && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Description</dt>
                    <dd className="text-stone-700 mt-0.5 leading-relaxed">{data.productDescription}</dd>
                  </div>
                )}
                {data.additionalNotes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Additional Notes</dt>
                    <dd className="text-stone-700 mt-0.5 leading-relaxed">{data.additionalNotes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Admin Response */}
            {(data.rejectionReason || data.adminNotes) && (
              <div className={`card p-6 border-l-4 ${data.status === 'IMAGE_REJECTED' ? 'border-l-red-400 bg-red-50' : 'border-l-amber-400 bg-amber-50'}`}>
                <h3 className="font-semibold text-[#1C1917] mb-3 flex items-center gap-2">
                  {data.status === 'IMAGE_REJECTED' ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  Admin Response
                </h3>
                {data.rejectionReason && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{data.rejectionReason}</p>
                  </div>
                )}
                {data.adminNotes && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-stone-700">{data.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Partner Info */}
            <div className="card p-5">
              <h3 className="font-semibold text-[#1C1917] text-sm mb-4">Partner Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-[#B89047] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-400">Company</p>
                    <p className="text-sm font-medium text-stone-700">{data.companyName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#B89047] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-400">Email</p>
                    <p className="text-sm font-medium text-stone-700 break-all">{data.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#B89047] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-400">Phone</p>
                    <p className="text-sm font-medium text-stone-700">{data.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            {data.history?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[#1C1917] text-sm mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  {data.history.map((h, i) => {
                    const Icon = ACTION_ICONS[h.action] || FileText;
                    const colorCls = ACTION_COLORS[h.action] || 'bg-stone-100 text-stone-600';
                    return (
                      <div key={h.id} className="flex gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorCls}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-stone-700">{ACTION_LABELS[h.action] || h.action}</p>
                          {h.note && <p className="text-xs text-stone-500 mt-0.5">{h.note}</p>}
                          <p className="text-[10px] text-stone-400 mt-0.5">{formatDate(h.createdAt)} · {h.actorName}</p>
                        </div>
                        {i < data.history.length - 1 && (
                          <div className="absolute ml-3.5 mt-7 w-px h-4 bg-stone-100" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status info */}
            <div className="card p-5 bg-amber-50 border-amber-100">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">What happens next?</p>
              {data.status === 'PENDING_REVIEW' && <p className="text-xs text-amber-700">Your proposal is in the queue. Our team reviews submissions within 3–5 business days.</p>}
              {data.status === 'UNDER_REVIEW' && <p className="text-xs text-amber-700">Our merchandising team is actively reviewing your images and product details.</p>}
              {data.status === 'IMAGE_ACCEPTED' && <p className="text-xs text-green-700">Your images have been approved! They may be published to the catalog soon.</p>}
              {data.status === 'IMAGE_REJECTED' && <p className="text-xs text-red-700">Your images were not accepted. Please review the rejection reason above and submit improved images.</p>}
              {data.status === 'COMPLETED' && <p className="text-xs text-emerald-700">This submission has been completed and your products may now be featured in our catalog.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
