import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, RefreshCw, ChevronLeft, ChevronRight, FileText, Loader2, AlertCircle, Plus } from 'lucide-react';
import { getMySubmissions, STATUS_LABELS, STATUS_COLORS, type WholesaleSubmission } from '../api/wholesale.api';
import { useAuthStore } from '../store/authStore';

export const MySubmissionsPage = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const stateEmail = (location.state as any)?.email || user?.email || '';
  const newId = (location.state as any)?.newId || '';

  const [email, setEmail] = useState(stateEmail);
  const [searchEmail, setSearchEmail] = useState(stateEmail);
  const [submissions, setSubmissions] = useState<WholesaleSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const LIMIT = 10;

  const fetchSubmissions = async (e?: string, p?: number) => {
    const targetEmail = e ?? searchEmail;
    const targetPage = p ?? page;
    if (!targetEmail.trim()) { toast.error('Please enter your email address'); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await getMySubmissions(targetEmail.trim(), targetPage, LIMIT);
      setSubmissions(res.data);
      setTotal(res.total);
      setSearchEmail(targetEmail.trim());
    } catch {
      toast.error('Failed to load submissions. Check your email and try again.');
      setSubmissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if email is available from login or navigation
  useEffect(() => {
    if (stateEmail) {
      setEmail(stateEmail);
      setSearchEmail(stateEmail);
      fetchSubmissions(stateEmail, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totalPages = Math.ceil(total / LIMIT);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchSubmissions(searchEmail, p);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen py-12 px-4 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1C1917] mb-1">My Submissions</h1>
            <p className="text-stone-500 text-sm">Track all your product proposals submitted to Aurum Jewels.</p>
          </div>
          <Link to="/submit" className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> New Proposal
          </Link>
        </div>

        {/* Email Lookup */}
        <div className="card p-5 mb-6">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Look up by Email</p>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              type="email"
              placeholder="Enter the email you used to submit proposals"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchSubmissions(email, 1))}
            />
            <button
              onClick={() => { setPage(1); fetchSubmissions(email, 1); }}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {/* New submission banner */}
        {newId && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800 text-sm">Proposal Submitted Successfully!</p>
              <p className="text-green-700 text-xs mt-0.5">Your submission ID is <strong>{newId}</strong>. Our team will review it within 3–5 business days.</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#B89047]" />
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && submissions.length === 0 && (
          <div className="card p-12 text-center">
            <AlertCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-semibold text-stone-600 mb-1">No submissions found</p>
            <p className="text-stone-400 text-sm">No proposals were found for <strong>{searchEmail}</strong>. Check the email or submit a new proposal.</p>
            <Link to="/submit" className="inline-flex mt-4 btn-secondary items-center gap-2">
              <Plus className="w-4 h-4" /> Submit a Proposal
            </Link>
          </div>
        )}

        {/* Submissions List */}
        {!loading && submissions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">{total} submission{total !== 1 ? 's' : ''} found for <strong className="text-stone-700">{searchEmail}</strong></p>
              <button onClick={() => fetchSubmissions()} className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#8C6A28] transition">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="space-y-4">
              {submissions.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/submission/${sub.id}`}
                  state={{ emailOrPhone: searchEmail }}
                  className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer block"
                >
                  {/* Image thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {sub.images?.[0] ? (
                      <img
                        src={`http://localhost:3001/api/v1/wholesale/submissions/${sub.id}/images/0`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <span className="font-mono text-xs text-stone-400">{sub.submissionId}</span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[sub.status]}`}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </div>
                    <p className="font-semibold text-[#1C1917] truncate">{sub.productName}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{sub.companyName} · {sub.productCategory} · {formatDate(sub.createdAt)}</p>
                  </div>

                  <div className="text-[#8C6A28] shrink-0 self-center">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-stone-200 hover:border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                      p === page ? 'bg-[#1C1917] text-white' : 'border border-stone-200 hover:border-amber-400 text-stone-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-stone-200 hover:border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
