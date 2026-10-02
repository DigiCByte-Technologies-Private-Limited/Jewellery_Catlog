import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ResubmitApplicationModal } from '../components/ResubmitApplicationModal';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, gatedStatus, clearGatedStatus } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);

  useEffect(() => {
    // If arriving from an email link with resubmit query
    const resubmitAppId = searchParams.get('resubmit');
    if (resubmitAppId) {
      setIsResubmitOpen(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearGatedStatus();

    try {
      await login(form.email, form.password);
      toast.success('Welcome back to Aurum Wholesale Portal!');
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'WHOLESALE_APPLICATION_NOT_APPROVED') {
        // Gated access state handled by reactive store banner
        return;
      }
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Invalid email or password';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1917] via-[#241F1C] to-[#1C1917] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#B89346] via-[#E2C37A] to-[#FFF5D6] p-[1.5px] shadow-xl">
              <div className="w-full h-full bg-[#1C1917] rounded-full flex items-center justify-center">
                <span className="font-serif text-[#E2C37A] text-lg font-bold">A</span>
              </div>
            </div>
            <div className="text-left">
              <p className="font-serif text-xl font-bold tracking-[0.2em] text-white uppercase">AURUM</p>
              <p className="text-[10px] tracking-[0.35em] text-[#B89047] uppercase font-semibold">WHOLESALE PORTAL</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Wholesale Partner Sign In</h1>
          <p className="text-stone-400 text-sm mt-1">Access verified wholesale catalog & inquiries</p>
        </div>

        {/* Card */}
        <div className="bg-[#FAF8F5] rounded-3xl p-7 sm:p-9 shadow-2xl border border-stone-200">
          {/* ── GATED STATUS NOTIFICATION BANNERS ── */}
          {gatedStatus && (
            <div className="mb-6">
              {gatedStatus.status === 'PENDING_REVIEW' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-800">
                      Application Pending Review
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-900">
                    Your wholesale registration{' '}
                    {gatedStatus.applicationId && (
                      <strong>({gatedStatus.applicationId})</strong>
                    )}{' '}
                    is currently under review by our compliance team. You will receive an email notification once your documents are verified.
                  </p>
                </div>
              )}

              {gatedStatus.status === 'UNDER_REVIEW' && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-blue-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-800">
                      Verification In Progress
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-blue-900">
                    Our compliance desk is actively reviewing your submitted KYC documents. You will be granted access immediately upon approval.
                  </p>
                </div>
              )}

              {gatedStatus.status === 'REJECTED' && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-950 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider text-red-800">
                      Application Requires Revision
                    </span>
                  </div>
                  <div className="text-xs bg-white p-3 rounded-xl border border-red-200 text-red-900">
                    <span className="font-bold block text-[11px] uppercase tracking-wider text-red-700 mb-0.5">
                      Reason for Rejection:
                    </span>
                    {gatedStatus.rejectionReason || 'Uploaded documents or details could not be verified.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResubmitOpen(true)}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Correct Information & Resubmit
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-xs font-medium">{error}</p>
            </div>
          )}

          {forgotPasswordMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              🔑 If your account is approved, a password reset link has been dispatched to your email address.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Business Email (Login ID)
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="partner@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordMsg(true)}
                  className="text-xs text-[#8C6A28] font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 mt-2 flex items-center justify-center gap-2 text-xs font-bold tracking-wider"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Access...
                </>
              ) : (
                'Sign In to Wholesale Portal'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-stone-600 text-xs">
              New wholesale partner?{' '}
              <Link to="/register" className="text-[#8C6A28] font-bold hover:underline">
                Create Wholesale Account &rarr;
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
            <p className="text-[11px] text-amber-800 flex items-start gap-1.5 leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#B89047]" />
              <span>
                <strong>Wholesale Access Notice:</strong> Accounts require manual admin verification of GST/PAN documents before portal features unlock.
              </span>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-stone-500 text-xs">
          Looking for customer retail?{' '}
          <a href="http://localhost:5174" className="text-amber-500 hover:text-amber-400 font-medium">
            Visit Aurum Retail Storefront &rarr;
          </a>
        </p>
      </div>

      {/* Resubmission Modal */}
      <ResubmitApplicationModal
        isOpen={isResubmitOpen}
        onClose={() => setIsResubmitOpen(false)}
        defaultEmail={form.email}
        applicationId={gatedStatus?.applicationId}
        rejectionReason={gatedStatus?.rejectionReason}
      />
    </div>
  );
};
