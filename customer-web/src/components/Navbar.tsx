import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Sparkles,
  ArrowUpRight,
  Search,
  Heart
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Clean, editorial nav links from the image
  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Collection', href: '#collections' },
    { label: 'Products', href: '#custom-design' },
    { label: 'Contact', href: '#contact' },
  ];

  const closeMobile = () => setMobileMenuOpen(false);

  const customerDisplayName = customer?.fullName || user?.fullName || 'Patron';
  const customerFirstName = customerDisplayName.split(' ')[0];

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ease-in-out gpu-layer ${
          scrolled
            ? 'bg-[#F9F5EC]/90 backdrop-blur-xl shadow-xs py-2'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between h-14 gap-3">
            
            {/* ── ZONE 1: Brand Logo ── */}
            <a href="#home" className="flex items-center gap-2 shrink-0 py-1 transition-transform active:scale-[0.99]">
              <span className="font-serif text-2xl lg:text-3xl font-semibold text-[#1C1A17] tracking-tight">
                Aurum
              </span>
            </a>

            {/* ── ZONE 2: Desktop Navigation Links ── */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-stone-600 hover:text-[#1C1A17] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* ── ZONE 3: Right Utility Suite & Actions ── */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              
              {/* Icons */}
              <div className="hidden sm:flex items-center gap-5">
                <button className="text-stone-800 hover:text-stone-500 transition-colors">
                  <Search className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
                <button className="text-stone-800 hover:text-stone-500 transition-colors">
                  <Heart className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="relative text-stone-800 hover:text-stone-500 transition-colors"
                  aria-label="Shopping Cart"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 bg-[#1C1A17] text-white font-medium text-[9px] rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Login/Profile Button */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#2B4C46] hover:bg-[#1E3632] text-white transition-colors cursor-pointer"
                  >
                    <span className="text-[13px] font-medium hidden sm:inline">
                      {customerFirstName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded bg-white shadow-xl py-2 z-50 animate-in fade-in duration-150 border border-stone-100">
                      <div className="px-4 py-2.5 border-b border-stone-100">
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {customerDisplayName}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {customer?.email || user?.email}
                        </div>
                      </div>

                      <button onClick={() => { setUserDropdownOpen(false); navigate('/account?tab=profile'); }} className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors">
                        <User className="w-3.5 h-3.5" /> Profile
                      </button>
                      <button onClick={() => { setUserDropdownOpen(false); navigate('/account?tab=inquiries'); }} className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors">
                        <ShoppingBag className="w-3.5 h-3.5" /> Inquiries
                      </button>
                      
                      <div className="my-1 border-t border-stone-100" />

                      <button onClick={() => { setUserDropdownOpen(false); logout(); }} className="w-full px-4 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onOpenConsultation())}
                  className="px-6 py-2 rounded bg-[#2B4C46] hover:bg-[#1E3632] text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Login
                </button>
              )}

              {/* Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-stone-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <div onClick={closeMobile} className={`fixed inset-0 z-40 bg-black/40 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-[80%] max-w-sm bg-[#F9F5EC] shadow-2xl flex flex-col transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <span className="font-serif text-xl font-semibold text-[#1C1A17]">Aurum</span>
          <button onClick={closeMobile}><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMobile} className="block text-lg text-stone-800 font-medium">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
};
