import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  ChevronLeft,
  Menu,
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

const ALLOWED_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'STORE_MANAGER',
  'SALES_STAFF',
  'CATALOG_MANAGER',
  'INVENTORY_MANAGER',
  'AUDITOR',
  'MARKETING',
];

export function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const isAuthorizedAdmin = isAuthenticated && !!user && ALLOWED_ADMIN_ROLES.includes(user.role);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Mobile off-canvas drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop / Laptop collapsible sidebar state (persisted)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jewel_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('jewel_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Auto-close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

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
    enabled: isAuthorizedAdmin,
    refetchInterval: 60000, // refresh every minute
  });

  // Product inquiry stats for notification badge
  const { data: requestStats } = useQuery({
    queryKey: ['requests-stats', 'badge'],
    queryFn: async () => {
      const res = await requestsApi.getStats();
      return res.data?.data;
    },
    enabled: isAuthorizedAdmin,
    refetchInterval: 10000, // refresh every 10 seconds
  });

  // Fast query for recent inquiries & notifications (every 10s)
  const { data: recentRequests = [] } = useQuery({
    queryKey: ['recent-requests-notifications'],
    queryFn: async () => {
      const res = await requestsApi.getAll({ limit: 6, sortBy: 'createdAt', sortOrder: 'DESC' });
      return res.data?.data || [];
    },
    enabled: isAuthorizedAdmin,
    refetchInterval: 10000,
  });

  // Custom design requests stats for notification badge
  const { data: customDesignStats } = useQuery({
    queryKey: ['custom-designs-stats', 'badge'],
    queryFn: async () => {
      const res = await customDesignsApi.getStats();
      return res.data?.data;
    },
    enabled: isAuthorizedAdmin,
    refetchInterval: 15000, // refresh every 15 seconds
  });

  // Wholesale product proposals stats for notification badge
  const { data: wholesaleStats } = useQuery({
    queryKey: ['wholesale-submissions-stats', 'badge'],
    queryFn: async () => {
      const res = await wholesaleApi.getStats();
      return res.data?.data;
    },
    enabled: isAuthorizedAdmin,
    refetchInterval: 15000, // refresh every 15 seconds
  });

  // Wholesale partner applications stats for notification badge
  const { data: partnerAppStats } = useQuery({
    queryKey: ['wholesale-partner-apps-stats', 'badge'],
    queryFn: async () => {
      const res = await wholesalePartnersApi.getAll({ limit: 1 });
      return res.stats;
    },
    enabled: isAuthorizedAdmin,
    refetchInterval: 15000,
  });

  // Play subtle luxury alert chime
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.close();
        return;
      }
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

  if (!isAuthorizedAdmin) {
    if (isAuthenticated) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    queryClient.clear();
    logout();
    navigate('/login');
  };

  interface NavCategory {
    title: string;
    items: {
      label: string;
      path: string;
      icon: any;
      badge?: number;
      allowedRoles?: string[];
    }[];
  }

  const navCategories: NavCategory[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Catalog & Merchandise',
      items: [
        { label: 'Products', path: '/products', icon: Gem },
        { label: 'Categories', path: '/categories', icon: FolderTree },
        { label: 'Physical Stock', path: '/inventory', icon: Boxes },
        {
          label: 'Live Metal Rates',
          path: '/metal-rates',
          icon: TrendingUp,
          allowedRoles: ['SUPER_ADMIN', 'STORE_MANAGER', 'PRICING_MANAGER', 'ACCOUNTANT'],
        },
      ],
    },
    {
      title: 'Workshop & Operations',
      items: [
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
        { label: 'Karigar / Job-Work', path: '/karigar', icon: Hammer },
        { label: 'Old Gold Exchange', path: '/old-gold', icon: Coins },
        { label: 'Rate-Lock Bookings', path: '/bookings', icon: CalendarClock },
      ],
    },
    {
      title: 'B2B & Clients',
      items: [
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
        { label: 'Walk-ins & Leads', path: '/enquiries', icon: PhoneCall },
        { label: 'CRM & Clients', path: '/customers', icon: Users },
      ],
    },
    {
      title: 'Admin & Governance',
      items: [
        {
          label: 'Approvals',
          path: '/approvals',
          icon: CheckSquare,
          allowedRoles: ['SUPER_ADMIN', 'STORE_MANAGER', 'AUDITOR'],
        },
        {
          label: 'Media & Storage',
          path: '/storage',
          icon: HardDrive,
          allowedRoles: ['SUPER_ADMIN', 'STORE_MANAGER', 'CATALOG_MANAGER', 'MARKETING'],
        },
        {
          label: 'ERP Subscription',
          path: '/subscriptions',
          icon: CreditCard,
          allowedRoles: ['SUPER_ADMIN'],
        },
        {
          label: 'Staff & Roles',
          path: '/users',
          icon: UserCog,
          allowedRoles: ['SUPER_ADMIN', 'STORE_MANAGER'],
        },
        {
          label: 'Audit Logs',
          path: '/audit-logs',
          icon: ShieldAlert,
          allowedRoles: ['SUPER_ADMIN', 'STORE_MANAGER', 'AUDITOR'],
        },
      ],
    },
  ];

  const filteredCategories: NavCategory[] = useMemo(() => {
    const role = user?.role;
    return navCategories
      .map((cat: NavCategory) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (!item.allowedRoles || role === 'SUPER_ADMIN') return true;
          return role ? item.allowedRoles.includes(role) : false;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [navCategories, user?.role]);

  // Find 22K Gold and 999 Silver for ticker
  const gold22K = latestRates?.find((r: any) => r.metalType === 'GOLD' && r.purity === 'K22');
  const silver999 = latestRates?.find((r: any) => r.metalType === 'SILVER' && r.purity === 'SILVER_999');

  return (
    <div className="h-screen overflow-hidden flex bg-slate-50">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Pinned Luxury Sidebar */}
      <aside
        className={`relative fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-50 flex flex-col justify-between border-r border-slate-800 transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'w-72 md:w-64'}`}
      >
        {/* Desktop Collapse Toggle Button at Vertical Center of Sidebar Edge */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-amber-400 items-center justify-center shadow-md hover:shadow-amber-500/20 transition-all duration-200 z-30 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Pinned Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
              👑
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white tracking-wide truncate">JewelAdmin</h1>
                <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase block">Super Admin ERP</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Independent Scrollable Navigation with 5 Categorized Sections */}
        <nav className="p-3 space-y-4 flex-1 overflow-y-auto dark-scrollbar">
          {filteredCategories.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  {group.title}
                </div>
              ) : (
                gIdx > 0 && <div className="border-t border-slate-800/80 my-2" />
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`${
                          isCollapsed
                            ? 'w-2 h-2 rounded-full bg-amber-400 shrink-0'
                            : 'ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono shadow-xs'
                        }`}
                      >
                        {!isCollapsed && item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Pinned User Profile Card at Bottom */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <div className={`min-w-0 ${isCollapsed ? 'text-center' : 'pr-2'}`}>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {isCollapsed ? user?.fullName?.[0] || 'A' : user?.fullName || user?.email?.split('@')[0] || 'Administrator'}
              </div>
              {!isCollapsed && (
                <div className="text-[10px] font-mono text-amber-400 truncate">
                  {user?.role || 'SUPER_ADMIN'}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Luxury TopBar */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-2xs z-20">
          {/* Left Controls: Hamburger + Collapse Toggle + Bullion Ticker */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Live Metal Rates Ticker (Responsive for Mobile, Tablet & Desktop) */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                <span className="font-sans font-medium text-[11px] hidden sm:inline">Live Bullion:</span>
                <span className="font-bold text-amber-900 text-[11px]">
                  22K: {gold22K ? `₹${Number(gold22K.ratePerGram).toLocaleString('en-IN')}` : '₹5,683'}/g
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Silver 999:</span>
                <span className="font-bold text-slate-700">
                  {silver999 ? `₹${Number(silver999.ratePerGram).toLocaleString('en-IN')}/g` : '₹78/g'}
                </span>
              </div>
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

        {/* Main Workspace Scroll Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7">
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
