import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Sparkles,
  Menu,
  X,
  Volume2,
  VolumeX,
  TrendingUp,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { luxuryAudio } from '../utils/luxuryAudio';
import { productsApi, type MetalRateItem } from '../api/products.api';
import { useCustomerAuthStore } from '../store/authStore';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenCart?: () => void;
  onOpenTrack?: () => void;
  onOpenCustomDesign?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
  cartCount?: number;
}

export const Navbar = ({
  onOpenConsultation,
  onOpenCart,
  onOpenTrack,
  onOpenCustomDesign,
  onOpenAuth,
  cartCount = 1,
}: NavbarProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rates, setRates] = useState<MetalRateItem[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, customer, isAuthenticated, logout, fetchProfile } = useCustomerAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    productsApi
      .getMetalRates()
      .then((res) => {
        if (res.data?.data) {
          setRates(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch metal rates ticker:', err);
      });
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gold24K = rates.find((r) => r.metalType === 'GOLD' && r.purity === 'K24');
  const gold22K = rates.find((r) => r.metalType === 'GOLD' && r.purity === 'K22');
  const silver999 = rates.find((r) => r.metalType === 'SILVER' && r.purity === 'SILVER_999');
  const silver925 = rates.find((r) => r.metalType === 'SILVER' && r.purity === 'SILVER_925');

  const navLinks = [
    { label: 'HOME', href: '#home' },
    { label: 'COLLECTIONS', href: '#collections' },
    { label: 'CUSTOM DESIGN', href: '#custom-design', badge: '3D' },
    { label: 'ABOUT US', href: '#about' },
    { label: 'CONTACT US', href: '#contact' },
  ];

  const closeMobile = () => setMobileMenuOpen(false);

  const customerDisplayName =
    customer?.fullName || user?.fullName || 'Patron';
  const customerFirstName = customerDisplayName.split(' ')[0];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 gpu-layer">
        {/* Announcement & Live Metal Benchmark Bar */}
        <div className="w-full bg-[#1C1917] text-white py-1.5 px-4 border-b border-amber-900/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0"></span>
              <span className="text-[10px] tracking-wider uppercase text-amber-200/90 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                Live Rates:
              </span>
              <div className="flex items-center gap-3 text-stone-200 font-mono text-[11px] overflow-x-auto py-0.5">
                <span>
                  Gold 24K:{' '}
                  <strong className="text-amber-400">
                    ₹{gold24K ? Number(gold24K.ratePerGram).toLocaleString('en-IN') : '6,200'}/g
                  </strong>
                </span>
                <span className="text-stone-600">|</span>
                <span>
                  Gold 22K:{' '}
                  <strong className="text-amber-400">
                    ₹{gold22K ? Number(gold22K.ratePerGram).toLocaleString('en-IN') : '5,695.50'}/g
                  </strong>
                </span>
                <span className="text-stone-600">|</span>
                <span>
                  Silver 999:{' '}
                  <strong className="text-stone-100">
                    ₹{silver999 ? Number(silver999.ratePerGram).toLocaleString('en-IN') : '78'}/g
                  </strong>
                </span>
                <span className="text-stone-600">|</span>
                <span>
                  Silver 925:{' '}
                  <strong className="text-stone-100">
                    ₹{silver925 ? Number(silver925.ratePerGram).toLocaleString('en-IN') : '72.15'}/g
                  </strong>
                </span>
              </div>
            </div>

            <p className="hidden lg:flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-stone-300 font-medium">
              <Sparkles className="w-3 h-3 text-[#B89047] shrink-0" />
              <span>Complimentary Insured Delivery &amp; GIA Certification</span>
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
            {/* ── Logo ── */}
            <a href="#" className="group flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#B89346] via-[#E2C37A] to-[#FFF5D6] p-[1px] shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="font-serif text-[#8C6A28] text-sm sm:text-base font-bold">A</span>
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg sm:text-xl font-semibold tracking-[0.22em] text-[#1C1917] group-hover:text-[#8C6A28] transition-colors uppercase">
                  AURUM
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.42em] uppercase text-[#8C6A28] font-medium pl-0.5">
                  JEWELS
                </span>
              </div>
            </a>

            {/* ── Desktop Nav Links ── */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-medium text-stone-600 hover:text-[#8C6A28] transition-colors whitespace-nowrap"
                >
                  {link.label}
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-[#8C6A28] border border-amber-300 font-semibold">
                      {link.badge}
                    </span>
                  )}
                </a>
              ))}
            </nav>

            {/* ── Right Icons ── */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                className="p-2 text-stone-500 hover:text-[#8C6A28] transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Wishlist — hidden on xs */}
              <button
                className="hidden sm:flex p-2 text-stone-500 hover:text-[#8C6A28] transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Cart */}
              <button
                onClick={onOpenCart}
                className="relative p-2 text-stone-500 hover:text-[#8C6A28] transition-colors cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-gradient-to-r from-[#B89047] to-[#8C6A28] text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Sound toggle — hidden on xs */}
              <button
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  luxuryAudio.isMuted = next;
                  if (!next) luxuryAudio.playMetallicChime(880);
                }}
                className="hidden sm:flex p-2 text-stone-500 hover:text-[#8C6A28] transition-colors cursor-pointer"
                aria-label="Toggle Sound"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-stone-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#8C6A28]" />
                )}
              </button>

              {/* Request Custom Design Link / CTA */}
              {onOpenCustomDesign && (
                <button
                  type="button"
                  onClick={onOpenCustomDesign}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#1C1917] to-[#292524] text-amber-200 hover:text-white hover:bg-stone-800 text-[10px] tracking-widest uppercase font-bold transition-all shadow-xs border border-amber-500/40 cursor-pointer whitespace-nowrap"
                  title="Request Custom Bespoke Design with CAD or Sketches"
                >
                  <Sparkles className="w-3 h-3 text-[#E2C37A]" />
                  <span>REQUEST CUSTOM DESIGN</span>
                </button>
              )}

              {/* Track Request Link */}
              {onOpenTrack && (
                <button
                  type="button"
                  onClick={onOpenTrack}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-600/40 hover:border-amber-600 text-[#8C6A28] text-[10px] tracking-widest uppercase font-bold transition-all hover:bg-amber-50 cursor-pointer"
                  title="Track product request and nearby showroom status"
                >
                  <Sparkles className="w-3 h-3 text-[#B89047]" />
                  <span>TRACK REQUEST</span>
                </button>
              )}

              {/* ── Customer Account / Sign In — Desktop ── */}
              {isAuthenticated ? (
                <div className="relative hidden lg:block ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-50/70 hover:bg-amber-100/70 text-[#1C1917] transition-all cursor-pointer shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#B89047] to-[#8C6A28] text-white flex items-center justify-center text-xs font-serif font-bold">
                      {customerDisplayName[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-stone-800">
                      Hi, {customerFirstName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-stone-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in duration-150">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {customerDisplayName}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {customer?.email || user?.email}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/account?tab=profile');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50 hover:text-[#8C6A28] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-[#8C6A28]" />
                        <span>Patron Profile &amp; Address</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/account?tab=inquiries');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50 hover:text-[#8C6A28] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#8C6A28]" />
                        <span>My Inquiries &amp; Holds</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/account?tab=designs');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50 hover:text-[#8C6A28] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#8C6A28]" />
                        <span>My Bespoke Designs</span>
                      </button>

                      <div className="my-1 border-t border-stone-100" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onOpenAuth ? onOpenAuth('login') : onOpenConsultation()}
                  className="hidden lg:inline-flex items-center gap-1.5 ml-2 px-4 py-2 rounded-full border border-amber-600/30 hover:border-amber-600 text-[#8C6A28] hover:text-[#FAF8F5] bg-amber-50 hover:bg-[#1C1917] text-xs font-semibold tracking-widest uppercase transition-all duration-300 cursor-pointer whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>SIGN IN</span>
                </button>
              )}

              {/* Hamburger — mobile/tablet */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 ml-1 text-stone-600 hover:text-stone-900 transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile/Tablet Slide-in Drawer ── */}
      {/* Backdrop */}
      <div
        onClick={closeMobile}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 sm:w-80 bg-[#FAF8F5] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl font-semibold tracking-[0.22em] text-[#1C1917] uppercase">
              AURUM
            </span>
            <span className="text-[9px] tracking-[0.42em] uppercase text-[#8C6A28] font-medium pl-0.5">
              JEWELS
            </span>
          </div>
          <button
            onClick={closeMobile}
            className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authenticated Patron Header inside Mobile Drawer */}
        {isAuthenticated && (
          <div className="px-6 py-4 bg-amber-50/70 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B89047] to-[#8C6A28] text-white flex items-center justify-center text-sm font-serif font-bold">
                {customerDisplayName[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-stone-900 truncate">
                  {customerDisplayName}
                </div>
                <div className="text-[10px] text-stone-500 truncate">
                  {customer?.email || user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => {
                  closeMobile();
                  navigate('/account?tab=inquiries');
                }}
                className="py-1.5 px-2 rounded-lg bg-white border border-stone-200 font-medium text-stone-700 text-center"
              >
                My Inquiries
              </button>
              <button
                onClick={() => {
                  closeMobile();
                  navigate('/account?tab=designs');
                }}
                className="py-1.5 px-2 rounded-lg bg-white border border-stone-200 font-medium text-stone-700 text-center"
              >
                My Designs
              </button>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="flex items-center justify-between py-3 border-b border-stone-100 text-sm uppercase tracking-[0.18em] font-medium text-stone-700 hover:text-[#8C6A28] transition-colors"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-2 py-0.5 rounded text-[9px] bg-amber-100 text-[#8C6A28] border border-amber-300 font-semibold">
                  {link.badge}
                </span>
              )}
            </a>
          ))}

          {isAuthenticated && (
            <button
              onClick={() => {
                closeMobile();
                navigate('/account?tab=profile');
              }}
              className="w-full flex items-center justify-between py-3 border-b border-stone-100 text-sm uppercase tracking-[0.18em] font-medium text-stone-700 hover:text-[#8C6A28] transition-colors text-left"
            >
              <span>My Profile &amp; Address</span>
              <ChevronDown className="w-4 h-4 -rotate-90 text-stone-400" />
            </button>
          )}
        </nav>

        {/* Drawer Footer */}
        <div className="px-6 py-5 border-t border-stone-200 space-y-2.5">
          {/* Sound toggle in drawer */}
          <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
            <span className="uppercase tracking-widest">Atelier Audio</span>
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                luxuryAudio.isMuted = next;
                if (!next) luxuryAudio.playMetallicChime(880);
              }}
              className="p-1.5 hover:text-[#8C6A28] transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#8C6A28]" />
              )}
            </button>
          </div>

          {onOpenCustomDesign && (
            <button
              onClick={() => {
                onOpenCustomDesign();
                closeMobile();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] text-amber-200 text-xs font-bold tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-amber-500/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E2C37A]" />
              REQUEST CUSTOM DESIGN
            </button>
          )}

          {onOpenTrack && (
            <button
              onClick={() => {
                onOpenTrack();
                closeMobile();
              }}
              className="w-full py-2.5 rounded-xl border border-amber-600/40 bg-amber-50 text-[#8C6A28] text-xs font-bold tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
              TRACK PRODUCT REQUEST
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                closeMobile();
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                closeMobile();
                if (onOpenAuth) onOpenAuth('login');
                else onOpenConsultation();
              }}
              className="w-full py-3 rounded-xl bg-[#1C1917] hover:bg-[#8C6A28] text-[#FAF8F5] text-xs font-semibold tracking-[0.2em] uppercase shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              SIGN IN / REGISTER
            </button>
          )}
        </div>
      </div>
    </>
  );
};
