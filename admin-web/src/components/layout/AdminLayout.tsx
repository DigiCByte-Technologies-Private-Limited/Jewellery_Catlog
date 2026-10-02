import { Outlet, Navigate, NavLink, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';

export function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

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
    refetchInterval: 15000, // refresh every 15 seconds
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
            <Link
              to="/requests"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              title="Customer Product Inquiries"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span>Inquiries</span>
              {requestStats?.new !== undefined && requestStats.new > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                  {requestStats.new} new
                </span>
              )}
            </Link>

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
    </div>
  );
}
