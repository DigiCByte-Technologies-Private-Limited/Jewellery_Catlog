import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  TrendingUp,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
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

export const Navbar: React.FC<NavbarProps> = ({
  onOpenConsultation,
  onOpenCart,
  onOpenAuth,
  cartCount = 1,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rates, setRates] = useState<MetalRateItem[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, customer, isAuthenticated, logout, fetchProfile } = useCustomerAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const [inHero, setInHero] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const hero = document.getElementById('home');
      if (hero) {
        const rect = hero.getBoundingClientRect();
        // Visible while the hero section is in view, hides once scrolled down past it
        setInHero(rect.bottom > 80);
      } else {
        setInHero(window.scrollY < window.innerHeight - 80);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
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
        console.warn('Could not fetch metal rates:', err);
      });
  }, []);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    } else {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }
    return () => {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    };
  }, [mobileMenuOpen]);

  const gold24K = rates.find((r) => r.metalType === 'GOLD' && r.purity === 'K24');
  const gold22K = rates.find((r) => r.metalType === 'GOLD' && r.purity === 'K22');
  const silver999 = rates.find((r) => r.metalType === 'SILVER' && r.purity === 'SILVER_999');

  // Clean, professional editorial nav links without awkward badge repetitions
  const navLinks = [
    { label: 'HOME', href: '#home', roman: '01' },
    { label: 'COLLECTIONS', href: '#collections', roman: '02' },
    { label: 'BESPOKE ATELIER', href: '#custom-design', roman: '03' },
    { label: 'ABOUT US', href: '#about', roman: '04' },
    { label: 'CONTACT US', href: '#contact', roman: '05' },
  ];

  const closeMobile = () => setMobileMenuOpen(false);

  const customerDisplayName = customer?.fullName || user?.fullName || 'Patron';
  const customerFirstName = customerDisplayName.split(' ')[0];

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-in-out gpu-layer ${
          inHero
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        } ${
          scrolled
            ? 'bg-[#FAF8F5]/98 backdrop-blur-xl shadow-xs border-b border-stone-200/90'
            : 'bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80'
        }`}
      >
        {/* ── 1. Top Luxury Benchmark & Delivery Ticker ── */}
        <div className="w-full bg-[#181615] text-stone-200 py-1.5 px-3 sm:px-6 border-b border-amber-950/40 text-[10px] sm:text-[11px] overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Live Bullion Benchmark */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-amber-300 font-semibold text-[9px] sm:text-[10px] shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <TrendingUp className="w-3 h-3 text-amber-400" />
                Live Rates
              </span>

              <span className="text-stone-700 hidden sm:inline">•</span>

              <div className="flex items-center gap-2.5 sm:gap-4 font-mono text-stone-300 text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-stone-400">Gold 24K:</span>
                  <span className="text-amber-300 font-semibold">
                    ₹{gold24K ? Number(gold24K.ratePerGram).toLocaleString('en-IN') : '6,200'}/g
                  </span>
                </div>
                <span className="text-stone-700">/</span>
                <div className="flex items-center gap-1">
                  <span className="text-stone-400">Gold 22K:</span>
                  <span className="text-amber-300 font-semibold">
                    ₹{gold22K ? Number(gold22K.ratePerGram).toLocaleString('en-IN') : '5,695.50'}/g
                  </span>
                </div>
                <span className="text-stone-700 hidden md:inline">/</span>
                <div className="hidden md:flex items-center gap-1">
                  <span className="text-stone-400">Silver 999:</span>
                  <span className="text-stone-100 font-semibold">
                    ₹{silver999 ? Number(silver999.ratePerGram).toLocaleString('en-IN') : '78'}/g
                  </span>
                </div>
              </div>
            </div>

            {/* Atelier Hallmark Value Props */}
            <div className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-stone-300 font-medium shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B89047]" />
              <span>BIS 916/750 Hallmarking &amp; GIA Solitaire Dossiers</span>
            </div>
          </div>
        </div>

        {/* ── 2. Primary Navigation Container (3-Zone Balanced Architecture) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* ── ZONE 1: Brand Logo & Hallmark Crest ── */}
            <a
              href="#home"
              className="group flex items-center gap-2.5 sm:gap-3 shrink-0 select-none py-1 transition-transform active:scale-[0.99]"
            >
              {/* Luxury Geometric Hallmark Seal */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1C1917] via-[#2A241F] to-[#1C1917] p-[1px] shadow-sm ring-1 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all flex items-center justify-center">
                <div className="w-full h-full rounded-[11px] bg-gradient-to-b from-[#25201B] to-[#151311] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-300/15 opacity-60"></div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M6 3h12l4 7-10 11L2 10l4-7z"
                      stroke="url(#aurum-gold-grad)"
                      fill="none"
                    />
                    <path d="M2 10h20" stroke="url(#aurum-gold-grad)" opacity="0.6" />
                    <path d="M12 21L7 10l2-7h6l2 7-5 11z" stroke="url(#aurum-gold-grad)" opacity="0.8" />
                    <defs>
                      <linearGradient id="aurum-gold-grad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F5E4B5" />
                        <stop offset="0.5" stopColor="#D4AF37" />
                        <stop offset="1" stopColor="#8C6A28" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Brand Typography */}
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.24em] text-[#1C1917] group-hover:text-[#8C6A28] transition-colors uppercase">
                  AURUM
                </span>
                <span className="text-[7.5px] sm:text-[9px] tracking-[0.45em] uppercase text-[#8C6A28] font-semibold mt-1">
                  JEWELS
                </span>
              </div>
            </a>

            {/* ── ZONE 2: Desktop Editorial Navigation Links ── */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 2xl:gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative py-2 text-[11px] xl:text-xs uppercase tracking-[0.2em] font-medium text-stone-600 hover:text-[#1C1917] transition-colors whitespace-nowrap"
                >
                  <span className="group-hover:text-[#8C6A28] transition-colors">{link.label}</span>
                  {/* Subtle Gold Hairline Hover Indicator */}
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#8C6A28] to-transparent group-hover:w-full transition-all duration-300 ease-out" />
                </a>
              ))}
            </nav>

            {/* ── ZONE 3: Right Utility Suite & Actions ── */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

              {/* Shopping Bag Button with Counter */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 sm:p-2.5 text-stone-700 hover:text-[#8C6A28] hover:bg-amber-50/60 rounded-full transition-all cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-gradient-to-r from-[#B89047] to-[#8C6A28] text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs border border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Patron Sign In / Profile Dropdown (Clean, Single Button) */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-amber-500/30 bg-white hover:bg-amber-50/60 text-[#1C1917] transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#B89047] to-[#8C6A28] text-white flex items-center justify-center text-xs font-serif font-bold">
                      {customerDisplayName[0]?.toUpperCase()}
                    </div>
                    <span className="text-[11px] font-medium tracking-wide text-stone-800 max-w-[80px] truncate hidden sm:inline">
                      {customerFirstName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {/* Patron Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-stone-200/90 shadow-xl py-2 z-50 animate-in fade-in duration-150">
                      <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/60">
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {customerDisplayName}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {customer?.email || user?.email}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/account?tab=profile');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50/70 hover:text-[#8C6A28] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-[#8C6A28]" />
                        <span>Patron Profile &amp; Address</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/account?tab=inquiries');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50/70 hover:text-[#8C6A28] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#8C6A28]" />
                        <span>My Inquiries &amp; Holds</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/account?tab=designs');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-amber-50/70 hover:text-[#8C6A28] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#8C6A28]" />
                        <span>My Bespoke Designs</span>
                      </button>

                      <div className="my-1 border-t border-stone-100" />

                      <button
                        type="button"
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
                  type="button"
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onOpenConsultation())}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-stone-300 hover:border-amber-600/80 text-stone-800 hover:text-[#8C6A28] hover:bg-amber-50/60 text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-[#8C6A28]" />
                  <span>SIGN IN</span>
                </button>
              )}

              {/* ── Hamburger Toggle for Mobile & Tablet (< 1024px) ── */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-stone-700 hover:text-[#8C6A28] hover:bg-amber-50/60 rounded-full transition-colors ml-0.5 cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
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

      {/* ── 3. Luxury Mobile & Tablet Slide-Over Drawer ── */}
      {/* Backdrop */}
      <div
        onClick={closeMobile}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-[#FAF8F5] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-lenis-prevent="true"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1C1917] p-1 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg font-bold tracking-[0.24em] text-[#1C1917] uppercase">
                AURUM
              </span>
              <span className="text-[8px] tracking-[0.45em] uppercase text-[#8C6A28] font-semibold mt-0.5">
                JEWELS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="p-2 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authenticated Patron VIP Header Card */}
        {isAuthenticated && (
          <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B89047] to-[#8C6A28] text-white flex items-center justify-center text-sm font-serif font-bold shadow-xs">
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
                type="button"
                onClick={() => {
                  closeMobile();
                  navigate('/account?tab=inquiries');
                }}
                className="py-1.5 px-2 rounded-lg bg-white border border-stone-200 font-medium text-stone-700 text-center hover:bg-stone-50 transition-colors"
              >
                My Inquiries
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  navigate('/account?tab=designs');
                }}
                className="py-1.5 px-2 rounded-lg bg-white border border-stone-200 font-medium text-stone-700 text-center hover:bg-stone-50 transition-colors"
              >
                My Bespoke Designs
              </button>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-6 py-4 overflow-y-auto space-y-1">
          <div className="text-[9px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-3 pl-1">
            Directory
          </div>

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="flex items-center justify-between py-3 px-2 rounded-xl text-xs uppercase tracking-[0.2em] font-medium text-stone-700 hover:text-[#8C6A28] hover:bg-amber-50/50 transition-all border-b border-stone-100/60"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#8C6A28]/60 font-normal">
                  {link.roman}
                </span>
                <span>{link.label}</span>
              </div>
            </a>
          ))}

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                closeMobile();
                navigate('/account?tab=profile');
              }}
              className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-xs uppercase tracking-[0.2em] font-medium text-stone-700 hover:text-[#8C6A28] hover:bg-amber-50/50 transition-all border-b border-stone-100/60 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#8C6A28]/60 font-normal">06</span>
                <span>Profile &amp; Vault</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          )}

          {/* Embedded Metal Rates Card for Mobile */}
          <div className="mt-6 p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
              <span className="flex items-center gap-1.5 text-amber-700">
                <TrendingUp className="w-3 h-3 text-amber-600" />
                Live Bullion Benchmark
              </span>
              <span className="text-[9px] text-stone-400">Per Gram</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-stone-50">
                <div className="text-[9px] text-stone-500 font-sans uppercase">Gold 24K</div>
                <div className="text-amber-700 font-bold">
                  ₹{gold24K ? Number(gold24K.ratePerGram).toLocaleString('en-IN') : '6,200'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-stone-50">
                <div className="text-[9px] text-stone-500 font-sans uppercase">Gold 22K</div>
                <div className="text-amber-700 font-bold">
                  ₹{gold22K ? Number(gold22K.ratePerGram).toLocaleString('en-IN') : '5,695.50'}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-stone-200 bg-white/80 backdrop-blur-md space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onOpenConsultation();
              closeMobile();
            }}
            className="w-full py-3.5 rounded-full bg-[#1C1917] hover:bg-[#2C2724] text-amber-200 text-[11px] font-semibold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-amber-600/30"
          >
            <Calendar className="w-3.5 h-3.5 text-[#E2C37A]" />
            BOOK SHOWROOM APPOINTMENT
          </button>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                closeMobile();
                if (onOpenAuth) onOpenAuth('login');
              }}
              className="w-full py-2.5 rounded-full border border-stone-300 hover:border-amber-600 text-stone-700 hover:text-[#8C6A28] text-[10px] font-semibold tracking-[0.18em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-50/50"
            >
              <User className="w-3.5 h-3.5 text-[#8C6A28]" />
              SIGN IN / REGISTER
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                closeMobile();
                logout();
              }}
              className="w-full py-2.5 rounded-full border border-stone-200 text-stone-500 hover:text-rose-600 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              SIGN OUT
            </button>
          )}
        </div>
      </div>
    </>
  );
};
