import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, User, LogOut, LayoutDashboard,
  Package, UploadCloud, FileText, Menu, X, ShieldCheck, Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/assigned-customers', label: 'Assigned Leads', icon: Users },
        { to: '/catalog', label: 'Catalog', icon: Package },
        { to: '/submit', label: 'Submit Proposal', icon: UploadCloud },
        { to: '/my-submissions', label: 'My Submissions', icon: FileText },
      ]
    : [
        { to: '/', label: 'Home', icon: null },
        { to: '/catalog', label: 'Catalog', icon: Package },
        { to: '/submit', label: 'Submit Proposal', icon: UploadCloud },
        { to: '/my-submissions', label: 'Track Proposal', icon: FileText },
      ];

  const companyDisplay =
    user?.partner?.companyName || user?.fullName || 'Wholesale Partner';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
      {/* Announcement banner */}
      <div className="w-full bg-gradient-to-r from-[#F7F4EE] via-[#EDE7DC] to-[#F7F4EE] py-1.5 px-4 text-center border-b border-stone-200/60">
        <p className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#8C6A28] font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-[#B89047]" />
          <span>Aurum Jewels — Verified Wholesale & B2B Partner Portal</span>
          <Sparkles className="w-3 h-3 text-[#B89047] hidden sm:inline" />
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="group flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#B89346] via-[#E2C37A] to-[#FFF5D6] p-[1px] shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#1C1917] rounded-full flex items-center justify-center">
                <span className="font-serif text-[#E2C37A] text-sm font-bold">A</span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold tracking-[0.22em] text-[#1C1917] group-hover:text-[#8C6A28] transition-colors uppercase">
                AURUM
              </span>
              <span className="text-[8px] tracking-[0.42em] uppercase text-[#8C6A28] font-medium pl-0.5">
                WHOLESALE
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-xs uppercase tracking-[0.16em] font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === link.to
                    ? 'text-[#8C6A28] font-semibold border-b-2 border-[#B89047] pb-1'
                    : 'text-stone-600 hover:text-[#8C6A28]'
                }`}
              >
                {link.icon && <link.icon className="w-3.5 h-3.5 opacity-70" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 transition text-stone-700 text-xs"
                  title="View Company Profile & Verification"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1C1917] text-amber-300 font-bold text-[10px] flex items-center justify-center">
                    {companyDisplay.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium max-w-[140px] truncate">{companyDisplay}</span>
                  {user?.partner?.isVerified ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded font-semibold">
                      PENDING
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-stone-400 hover:text-red-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:text-[#8C6A28] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-[#1C1917] text-amber-200 hover:bg-[#8C6A28] text-xs font-semibold uppercase tracking-wider transition shadow-sm"
                >
                  Register Partner
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-xs uppercase tracking-wider font-medium ${
                  pathname === link.to ? 'text-[#8C6A28] font-bold' : 'text-stone-600'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs font-medium text-stone-700"
                  >
                    <User className="w-4 h-4 text-[#B89047]" />
                    <span>{companyDisplay} (Profile)</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 py-2 text-xs font-medium text-red-600 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary flex-1 text-center py-2 text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary flex-1 text-center py-2 text-xs"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
