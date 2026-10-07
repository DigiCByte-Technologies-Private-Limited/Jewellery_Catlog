import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { metalRatesApi } from '../../api/metal-rates.api';
import { requestsApi } from '../../api/requests.api';
import { customDesignsApi } from '../../api/custom-designs.api';
import { wholesaleApi } from '../../api/wholesale.api';
import { wholesalePartnersApi } from '../../api/wholesale-partners.api';
import {
  LayoutDashboard,
  Gem,
  FolderTree,
  TrendingUp,
  CheckSquare,
  Users,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Sparkles,
  Boxes,
  Hammer,
  Coins,
  CalendarClock,
  PhoneCall,
  UserCog,
  HardDrive,
  CreditCard,
  MessageSquareQuote,
  Bell,
  FileImage,
  MessageCircle,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  Clock,
  ChevronRight,
} from 'lucide-react';

function getRelativeTime(dateString: string) {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${Math.floor(diffHour / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Notification center & alert states
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<{
    id: string;
    requestId: string;
    title: string;
    customerName: string;
    productName: string;
    phone: string;
    isWhatsApp: boolean;
    url: string;
  } | null>(null);

  const prevNewCountRef = useRef<number | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Live metal rate ticker in topbar
  const { data: latestRates } = useQuery({
    queryKey: ['metal-rates', 'ticker'],
    queryFn: async () => {
      const res = await metalRatesApi.getLatest();
      return res.data?.data || [];
    },
    refetchInterval: 60000, // refresh every minute
  });

  // Product inquiry stats for notification badge
  const { data: requestStats } = useQuery({
    queryKey: ['requests-stats', 'badge'],
    queryFn: async () => {
      const res = await requestsApi.getStats();
      return res.data?.data;
    },
    refetchInterval: 10000, // refresh every 10 seconds
  });

  // Fast query for recent inquiries & notifications (every 10s)
  const { data: recentRequests = [] } = useQuery({
    queryKey: ['recent-requests-notifications'],
    queryFn: async () => {
      const res = await requestsApi.getAll({ limit: 6, sortBy: 'createdAt', sortOrder: 'DESC' });
      return res.data?.data || [];
    },
    refetchInterval: 10000,
  });

  // Custom design requests stats for notification badge
  const { data: customDesignStats } = useQuery({
    queryKey: ['custom-designs-stats', 'badge'],
    queryFn: async () => {
      const res = await customDesignsApi.getStats();
      return res.data?.data;
    },
    refetchInterval: 15000, // refresh every 15 seconds
  });

  // Wholesale product proposals stats for notification badge
  const { data: wholesaleStats } = useQuery({
    queryKey: ['wholesale-submissions-stats', 'badge'],
    queryFn: async () => {
      const res = await wholesaleApi.getStats();
      return res.data?.data;
    },
    refetchInterval: 15000, // refresh every 15 seconds
  });

  // Wholesale partner applications stats for notification badge
  const { data: partnerAppStats } = useQuery({
    queryKey: ['wholesale-partner-apps-stats', 'badge'],
    queryFn: async () => {
      const res = await wholesalePartnersApi.getAll({ limit: 1 });
      return res.stats;
    },
    refetchInterval: 15000,
  });

  // Play subtle luxury alert chime
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Raise real-time notification alert when new inquiries arrive
  useEffect(() => {
    const currentNew = requestStats?.new ?? 0;
    if (prevNewCountRef.current !== null && currentNew > prevNewCountRef.current) {
      const newest = recentRequests[0];
      if (newest) {
        const isWa = newest.preferredContactMethod === 'WHATSAPP';
        setActiveToast({
          id: newest.id,
          requestId: newest.requestId,
          title: isWa ? 'New WhatsApp Evaluation Inquiry' : 'New Customer Product Inquiry',
          customerName: newest.customerName,
          productName: newest.productName,
          phone: newest.phone,
          isWhatsApp: isWa,
          url: `/requests?id=${newest.requestId}`,
        });
        playChime();
      }
    }
    prevNewCountRef.current = currentNew;
  }, [requestStats?.new, recentRequests, playChime]);

  // Auto-dismiss toast after 9 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Gem },
    {
      label: 'Product Inquiries',
      path: '/requests',
      icon: MessageSquareQuote,
      badge: requestStats?.new,
    },
    {
      label: 'Custom Designs',
      path: '/custom-designs',
      icon: Sparkles,
      badge: customDesignStats?.new,
    },
    {
      label: 'Wholesale Proposals',
      path: '/wholesale-submissions',
      icon: FileImage,
      badge: wholesaleStats?.pendingReview,
    },
    {
      label: 'Wholesale Accounts',
      path: '/wholesale-partners',
      icon: ShieldCheck,
      badge: partnerAppStats?.pendingReview,
    },
    { label: 'Physical Stock', path: '/inventory', icon: Boxes },
    { label: 'Karigar / Job-Work', path: '/karigar', icon: Hammer },
    { label: 'Old Gold Exchange', path: '/old-gold', icon: Coins },
    { label: 'Rate-Lock Bookings', path: '/bookings', icon: CalendarClock },
    { label: 'Walk-ins & Leads', path: '/enquiries', icon: PhoneCall },
    { label: 'CRM & Clients', path: '/customers', icon: Users },
    { label: 'Media & Storage', path: '/storage', icon: HardDrive },
    { label: 'ERP Subscription', path: '/subscriptions', icon: CreditCard },
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Metal Rates', path: '/metal-rates', icon: TrendingUp },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare },
    { label: 'Staff & Roles', path: '/users', icon: UserCog },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert },
  ];

  // Find 22K Gold and 999 Silver for ticker
  const gold22K = latestRates?.find((r: any) => r.metalType === 'GOLD' && r.purity === 'K22');
  const silver999 = latestRates?.find((r: any) => r.metalType === 'SILVER' && r.purity === 'SILVER_999');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-50 flex-shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              👑
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">JewelAdmin</h1>
              <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase">Super Admin ERP</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.fullName || user?.email?.split('@')[0] || 'Administrator'}
              </div>
              <div className="text-[10px] font-mono text-amber-400 truncate">
                {user?.role || 'SUPER_ADMIN'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
          {/* Live Metal Rates Ticker */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="font-sans font-medium text-[11px]">Live Rates:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Gold 22K:</span>
              <span className="font-bold text-amber-700">
                {gold22K ? `₹${Number(gold22K.ratePerGram).toLocaleString('en-IN')}/g` : '₹5,683/g'}
              </span>
            </div>

            <div className="w-px h-3.5 bg-slate-300" />

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Silver 999:</span>
              <span className="font-bold text-slate-700">
                {silver999 ? `₹${Number(silver999.ratePerGram).toLocaleString('en-IN')}/g` : '₹78/g'}
              </span>
            </div>
          </div>

          {/* Quick Actions / Status */}
          <div className="flex items-center gap-3">
            {/* Notification Center Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  notificationOpen
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                }`}
                title="Notification Center & Real-Time Inquiries"
              >
                <div className="relative">
                  <Bell className={`w-4 h-4 ${((requestStats?.new || 0) + (customDesignStats?.new || 0)) > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`} />
                  {((requestStats?.new || 0) + (customDesignStats?.new || 0)) > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  )}
                </div>
                <span>Inquiries &amp; Alerts</span>
                {requestStats?.new !== undefined && requestStats.new > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                    {requestStats.new} new
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown Panel */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-xs tracking-wider uppercase">
                        Notification Center
                      </span>
                      {requestStats?.new !== undefined && requestStats.new > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                          {requestStats.new} New
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={soundEnabled ? 'Mute audio chime' : 'Enable audio chime'}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Body: Recent Inquiries List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {recentRequests.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No recent inquiries or evaluation alerts.
                      </div>
                    ) : (
                      recentRequests.map((item: any) => {
                        const isWa = item.preferredContactMethod === 'WHATSAPP';
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(`/requests?id=${item.requestId}`);
                              setNotificationOpen(false);
                            }}
                            className="p-3 hover:bg-amber-50/50 transition-colors cursor-pointer flex items-start gap-3 group"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isWa
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-700 border border-amber-300'
                              }`}
                            >
                              {isWa ? (
                                <MessageCircle className="w-4 h-4" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[11px] font-bold text-amber-800">
                                  {item.requestId}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {getRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {item.customerName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.productName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                {isWa && (
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    WhatsApp Evaluation
                                  </span>
                                )}
                                {item.city && (
                                  <span className="text-slate-500 font-medium truncate">
                                    {item.city}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0 mt-2" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/requests');
                        setNotificationOpen(false);
                      }}
                      className="font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Inquiries ({requestStats?.total || 0})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/custom-designs');
                        setNotificationOpen(false);
                      }}
                      className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                    >
                      Bespoke Requests ({customDesignStats?.total || 0})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono">
              INR (₹) · GST 3%
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Real-Time Floating Toast Notification Raise */}
      {activeToast && (
        <div className="fixed top-4 right-6 z-50 max-w-sm w-full bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-4 text-white animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                {activeToast.isWhatsApp ? (
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Bell className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    {activeToast.requestId}
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                    WHATSAPP
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-0.5 truncate">
                  {activeToast.title}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  <strong>{activeToast.customerName}</strong> ({activeToast.phone}) submitted inquiry for: <em>"{activeToast.productName}"</em>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer shrink-0"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">Just arrived</span>
            <button
              type="button"
              onClick={() => {
                navigate(activeToast.url);
                setActiveToast(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>View &amp; Assign Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
