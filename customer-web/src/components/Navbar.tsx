import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, User, Sparkles, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { luxuryAudio } from '../utils/luxuryAudio';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenCart?: () => void;
  onOpenTrack?: () => void;
  cartCount?: number;
}

export const Navbar = ({ onOpenConsultation, onOpenCart, onOpenTrack, cartCount = 1 }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'HOME',          href: '#home' },
    { label: 'COLLECTIONS',   href: '#collections' },
    { label: 'CUSTOM DESIGN', href: '#custom-design', badge: '3D' },
    { label: 'ABOUT US',      href: '#about' },
    { label: 'CONTACT US',    href: '#contact' },
  ];

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 gpu-layer">
        {/* Announcement banner */}
        <div className="w-full bg-gradient-to-r from-[#F7F4EE] via-[#EDE7DC] to-[#F7F4EE] py-1.5 px-4 text-center border-b border-stone-200/60">
          <p className="text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#8C6A28] font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-[#B89047] shrink-0" />
            <span className="truncate">Complimentary Insured Global Delivery &amp; GIA Diamond Certification</span>
            <Sparkles className="w-3 h-3 text-[#B89047] shrink-0 hidden sm:inline" />
          </p>
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
              {navLinks.map(link => (
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
              <button className="p-2 text-stone-500 hover:text-[#8C6A28] transition-colors" aria-label="Search">
                <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Wishlist — hidden on xs */}
              <button className="hidden sm:flex p-2 text-stone-500 hover:text-[#8C6A28] transition-colors" aria-label="Wishlist">
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
                {isMuted
                  ? <VolumeX className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-stone-400" />
                  : <Volume2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#8C6A28]" />
                }
              </button>

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

              {/* Sign In — desktop only */}
              <button
                onClick={onOpenConsultation}
                className="hidden lg:inline-flex items-center gap-1.5 ml-2 px-4 py-2 rounded-full border border-amber-600/30 hover:border-amber-600 text-[#8C6A28] hover:text-[#FAF8F5] bg-amber-50 hover:bg-[#1C1917] text-xs font-semibold tracking-widest uppercase transition-all duration-300 cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>

              {/* Hamburger — mobile/tablet */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 ml-1 text-stone-600 hover:text-stone-900 transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
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
            <span className="font-serif text-xl font-semibold tracking-[0.22em] text-[#1C1917] uppercase">AURUM</span>
            <span className="text-[9px] tracking-[0.42em] uppercase text-[#8C6A28] font-medium pl-0.5">JEWELS</span>
          </div>
          <button
            onClick={closeMobile}
            className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-6 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="flex items-center justify-between py-3.5 border-b border-stone-100 text-sm uppercase tracking-[0.18em] font-medium text-stone-700 hover:text-[#8C6A28] transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-2 py-0.5 rounded text-[9px] bg-amber-100 text-[#8C6A28] border border-amber-300 font-semibold">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="px-6 py-6 border-t border-stone-200 space-y-3">
          {/* Sound toggle in drawer */}
          <div className="flex items-center justify-between text-xs text-stone-500 pb-2">
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
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#8C6A28]" />}
            </button>
          </div>
          {onOpenTrack && (
            <button
              onClick={() => { onOpenTrack(); closeMobile(); }}
              className="w-full py-2.5 rounded-xl border border-amber-600/40 bg-amber-50 text-[#8C6A28] text-xs font-bold tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
              TRACK PRODUCT REQUEST
            </button>
          )}

          <button
            onClick={() => { onOpenConsultation(); closeMobile(); }}
            className="w-full py-3 rounded-xl bg-[#1C1917] hover:bg-[#8C6A28] text-[#FAF8F5] text-xs font-semibold tracking-[0.2em] uppercase shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            SIGN IN / CONSULTATION
          </button>
        </div>
      </div>
    </>
  );
};
