import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText, Clock, CheckCircle2, Package, Plus, ArrowRight,
  TrendingUp, Building2, Loader2, RefreshCw, Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  completedSubmissions: number;
  underReviewSubmissions: number;
  assignedCustomersCount?: number;
}

interface RecentSubmission {
  id: string;
  submissionId: string;
  productName: string;
  productCategory: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  IMAGE_ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  IMAGE_REJECTED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-amber-100 text-amber-800 border-amber-200',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Pending Review',
  UNDER_REVIEW: 'Under Review',
  IMAGE_ACCEPTED: 'Accepted',
  IMAGE_REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

export const DashboardPage = () => {
  const { user, accessToken, fetchProfile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      await fetchProfile();
      // Fetch dashboard stats
      const statsRes = await axios.get('http://localhost:3001/api/v1/wholesale/auth/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setStats(statsRes.data.data);

      // Fetch recent submissions by email
      if (user?.email) {
        const subRes = await axios.get(
          `http://localhost:3001/api/v1/wholesale/submissions/my?email=${encodeURIComponent(user.email)}&page=1&limit=5`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setRecent(subRes.data.data || []);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const statCards = [
    { label: 'Assigned Leads', value: stats?.assignedCustomersCount ?? 0, icon: Users, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300' },
    { label: 'Total Proposals', value: stats?.totalSubmissions ?? 0, icon: FileText, color: 'bg-stone-100 text-stone-600', border: 'border-stone-200' },
    { label: 'Pending Review', value: stats?.pendingSubmissions ?? 0, icon: Clock, color: 'bg-yellow-100 text-yellow-600', border: 'border-yellow-200' },
    { label: 'Under Review', value: stats?.underReviewSubmissions ?? 0, icon: TrendingUp, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
    { label: 'Accepted', value: stats?.acceptedSubmissions ?? 0, icon: CheckCircle2, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
    { label: 'Completed', value: stats?.completedSubmissions ?? 0, icon: Package, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  ];

  const partnerName = user?.partner?.companyName || user?.fullName || 'Partner';
  const isVerified = user?.partner?.isVerified;

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
                Welcome, {user?.fullName?.split(' ')[0] || 'Partner'} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-stone-500 text-sm flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B89047]" />
                {partnerName}
              </p>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${isVerified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                {isVerified ? '✓ Verified Partner' : '⏳ Pending Verification'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-stone-200 hover:border-amber-400 transition text-stone-400 hover:text-[#8C6A28]">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link to="/submit" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Proposal
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#B89047]" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {statCards.map((card) => (
                <div key={card.label} className={`card p-4 border ${card.border}`}>
                  <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-[#1C1917]">{card.value}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link to="/assigned-customers" className="card p-5 hover:shadow-md transition-shadow group border-emerald-200/80 bg-emerald-50/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-1">Assigned Customers</h3>
                <p className="text-stone-400 text-xs">Direct local leads from HQ Admin</p>
                <div className="mt-3 flex items-center gap-1 text-emerald-700 text-xs font-semibold">View leads ({stats?.assignedCustomersCount ?? 0}) <ArrowRight className="w-3 h-3" /></div>
              </Link>

              <Link to="/submit" className="card p-5 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-xl bg-[#1C1917] flex items-center justify-center mb-3 group-hover:bg-[#8C6A28] transition-colors">
                  <Plus className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-1">Submit Proposal</h3>
                <p className="text-stone-400 text-xs">Upload product images for review</p>
                <div className="mt-3 flex items-center gap-1 text-[#8C6A28] text-xs font-medium">Submit now <ArrowRight className="w-3 h-3" /></div>
              </Link>

              <Link to="/my-submissions" className="card p-5 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-[#B89047]" />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-1">My Proposals</h3>
                <p className="text-stone-400 text-xs">Track all your submitted proposals</p>
                <div className="mt-3 flex items-center gap-1 text-[#8C6A28] text-xs font-medium">View all <ArrowRight className="w-3 h-3" /></div>
              </Link>

              <Link to="/profile" className="card p-5 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-stone-500" />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-1">Company Profile</h3>
                <p className="text-stone-400 text-xs">Update your business information</p>
                <div className="mt-3 flex items-center gap-1 text-[#8C6A28] text-xs font-medium">Edit profile <ArrowRight className="w-3 h-3" /></div>
              </Link>
            </div>

            {/* Recent Submissions */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[#1C1917]">Recent Proposals</h2>
                <Link to="/my-submissions" className="text-xs text-[#8C6A28] hover:underline font-medium">View all →</Link>
              </div>

              {recent.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                  <p className="text-stone-400 text-sm">No proposals yet.</p>
                  <Link to="/submit" className="inline-flex mt-3 btn-secondary items-center gap-1.5 text-xs">
                    <Plus className="w-3 h-3" /> Submit your first proposal
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/submission/${sub.id}`}
                      state={{ emailOrPhone: user?.email }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#B89047]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 text-sm truncate">{sub.productName}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{sub.submissionId} · {sub.productCategory}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[sub.status] || ''}`}>
                          {STATUS_LABELS[sub.status] || sub.status}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#8C6A28] transition" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Banner */}
            {!isVerified && (
              <div className="mt-5 card p-5 border-l-4 border-l-amber-400 bg-amber-50">
                <h3 className="font-semibold text-amber-800 mb-1">Account Pending Verification</h3>
                <p className="text-amber-700 text-sm">Our team will verify your company details within 1-2 business days. You can still submit proposals in the meantime.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
