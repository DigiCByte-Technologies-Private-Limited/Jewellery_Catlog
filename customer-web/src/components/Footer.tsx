import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Gem,
  RefreshCw,
  Truck,
  ArrowRight,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface FooterProps {
  onOpenConsultation?: () => void;
  onOpenTrack?: () => void;
  onOpenCustomDesign?: () => void;
}

type PolicyTab = 'privacy' | 'terms' | 'kimberley' | 'hallmark' | 'exchange' | 'delivery' | null;

export const Footer: React.FC<FooterProps> = ({
  onOpenConsultation,
  onOpenTrack,
  onOpenCustomDesign,
}) => {
  // Newsletter VIP Circle subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');

  // Legal & Compliance Modal state
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyTab>(null);

  // Check if patron was previously subscribed
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aurum_vip_subscriber');
      if (saved) {
        setIsSubscribed(true);
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  // Handle Lenis freeze when policy modal is open
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (activePolicyTab) {
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
  }, [activePolicyTab]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriptionError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail.trim() || !emailRegex.test(newsletterEmail.trim())) {
      setSubscriptionError('Please enter a valid patron email address.');
      return;
    }

    try {
      localStorage.setItem('aurum_vip_subscriber', newsletterEmail.trim());
    } catch {
      // ignore
    }

    setIsSubscribed(true);
    setNewsletterEmail('');
  };

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.scrollTo(el, { offset: -60 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer id="contact" className="bg-[#FAF8F5] border-t border-stone-200/90 text-stone-600 text-xs relative z-20">
      {/* ── TIER 1: SOVEREIGN ASSURANCE BAR ── */}
      <div className="border-b border-stone-200/80 bg-gradient-to-r from-[#F7F4EE] via-[#FAF8F5] to-[#F7F4EE] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Pillar 1: BIS 916 & 750 HUID */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/70 border border-stone-200/70 shadow-2xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6A28] shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-[#B89047]" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-[#1C1917]">
                  BIS 916 &amp; 750 Hallmarked
                </h5>
                <p className="text-stone-500 text-[11px] mt-1 leading-relaxed">
                  Every gram verified with mandatory 6-digit laser HUID traceable on the BIS Care portal.
                </p>
              </div>
            </div>

            {/* Pillar 2: GIA & IGI Solitaires */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/70 border border-stone-200/70 shadow-2xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6A28] shrink-0 mt-0.5">
                <Gem className="w-5 h-5 text-[#B89047]" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-[#1C1917]">
                  GIA &amp; IGI Certified Stones
                </h5>
                <p className="text-stone-500 text-[11px] mt-1 leading-relaxed">
                  Natural solitaires above 0.30 ct come with microscopic girdle laser serial inscriptions.
                </p>
              </div>
            </div>

            {/* Pillar 3: 100% Lifetime Buyback */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/70 border border-stone-200/70 shadow-2xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6A28] shrink-0 mt-0.5">
                <RefreshCw className="w-5 h-5 text-[#B89047]" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-[#1C1917]">
                  100% Lifetime Bullion Value
                </h5>
                <p className="text-stone-500 text-[11px] mt-1 leading-relaxed">
                  Full exchange at live day bullion rates with zero deduction on intrinsic gold purity weight.
                </p>
              </div>
            </div>

            {/* Pillar 4: Insured Armored Transit */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/70 border border-stone-200/70 shadow-2xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6A28] shrink-0 mt-0.5">
                <Truck className="w-5 h-5 text-[#B89047]" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-[#1C1917]">
                  Insured Armored Logistics
                </h5>
                <p className="text-stone-500 text-[11px] mt-1 leading-relaxed">
                  Complimentary door-to-door transit via specialized secure couriers with tamper-evident seals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 2: 5-COLUMN HIGH-JEWELLERY DIRECTORY ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Col 1 & 2: Brand Heritage & Showroom Overview (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-[0.25em] text-[#1C1917] uppercase">
                AURUM
              </span>
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#8C6A28] font-bold pt-1">
                JEWELS
              </span>
            </div>

            <p className="text-stone-600 font-light text-xs leading-relaxed">
              Haute joaillerie and authoritative bullion craftsmanship. Certified BIS hallmarked 18K and 22K gold, platinum 950, and ethically sourced natural solitaires.
            </p>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-[#8C6A28] font-semibold text-[11px] tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
                <span>Transparent Valuation</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                Every purchase is calculated live using real-time bullion benchmark pricing + flat making charges + 3% GST.
              </p>
            </div>
          </div>

          {/* Col 2: Fine Collections (Span 2) */}
          <div className="lg:col-span-2">
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-4">
              Collections
            </h6>
            <ul className="space-y-2.5 text-stone-600">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('collections')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Solitaire Engagement Rings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('collections')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  22K &amp; 18K Gold Necklaces
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('collections')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Handcrafted Bangles &amp; Kadas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('collections')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Sovereign Bridal Sets
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('collections')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Certified Tennis Bracelets
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('home')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer flex items-center gap-1"
                >
                  <span>Live Bullion Sovereigns</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-[#8C6A28] font-bold">24K</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Bespoke Services & Tracking (Span 2) */}
          <div className="lg:col-span-2">
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-4">
              Bespoke &amp; Services
            </h6>
            <ul className="space-y-2.5 text-stone-600">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCustomDesign) {
                      onOpenCustomDesign();
                    } else {
                      scrollToAnchor('custom-design');
                    }
                  }}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Bespoke Design Commission
                </button>
              </li>
              {onOpenTrack && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTrack}
                    className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer flex items-center gap-1.5 font-medium text-stone-800"
                  >
                    <span>Track Custom Commission</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </button>
                </li>
              )}
              {onOpenConsultation && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                  >
                    Book Showroom Appointment
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('about')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Old Gold Exchange Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('about')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  In-House Karatmeter Assay
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicyTab('exchange')}
                  className="hover:text-[#8C6A28] transition-colors text-left cursor-pointer"
                >
                  Lifetime Care &amp; Replating
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Concierge & Flagship Desks (Span 2) */}
          <div className="lg:col-span-2">
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-4">
              Concierge Desks
            </h6>
            <ul className="space-y-3 text-stone-600">
              <li>
                <a
                  href="tel:+918041127700"
                  className="hover:text-[#8C6A28] transition-colors flex items-center gap-2 group"
                >
                  <Phone className="w-3.5 h-3.5 text-[#8C6A28] shrink-0" />
                  <span className="font-medium text-stone-800 group-hover:text-[#8C6A28]">+91 80 4112 7700</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/916303955998?text=Hello%2C%20I%20would%20like%20to%20consult%20with%20an%20AURUM%20jewellery%20specialist."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 transition-colors flex items-center gap-2 group"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-800 font-medium">WhatsApp Concierge (+91 63039 55998)</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:concierge@aurumjewels.com"
                  className="hover:text-[#8C6A28] transition-colors flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#8C6A28] shrink-0" />
                  <span className="truncate">concierge@aurumjewels.com</span>
                </a>
              </li>
              <li className="pt-1">
                <div className="flex items-start gap-2 text-[11px] text-stone-500">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-stone-700 block">Showroom Hours</span>
                    <span>10:30 AM – 8:30 PM IST</span>
                    <span className="block text-[10px] text-stone-400">Open All 7 Days</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 5: The AURUM Circle Newsletter (Span 3) */}
          <div className="lg:col-span-3">
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-2">
              The AURUM Circle
            </h6>
            <p className="text-[11px] text-stone-600 font-light mb-4 leading-relaxed">
              Receive private advisories on rare gemstone arrivals, festive bullion benchmark insights, and private showroom viewings.
            </p>

            {isSubscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Welcome to The AURUM Circle</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-light leading-snug">
                  Your private welcome dossier has been recorded. We honor your privacy with strict confidentiality.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (subscriptionError) setSubscriptionError('');
                    }}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 rounded-full bg-white border border-stone-200 focus:border-[#B89047] text-xs text-stone-800 focus:outline-none placeholder-stone-400 shadow-2xs pr-12 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    aria-label="Subscribe to AURUM Circle"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {subscriptionError && (
                  <p className="text-[11px] text-red-600 pl-2">{subscriptionError}</p>
                )}
                <span className="text-[10px] text-stone-400 block pl-2 font-light">
                  Protected under the Digital Personal Data Protection Act. Unsubscribe anytime.
                </span>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── COMPLIANCE, COPYRIGHT & INTERACTIVE LEGAL MODAL ── */}
      <div className="border-t border-stone-200 bg-[#1C1917] text-stone-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-[11px] gap-4">
          <p className="text-center md:text-left text-stone-400">
            © 2026 AURUM JEWELS. All rights reserved. Authoritative Real-Time Bullion Valuation &amp; Certified Fine Jewelry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-stone-400">
            <button
              type="button"
              onClick={() => setActivePolicyTab('privacy')}
              className="hover:text-amber-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePolicyTab('terms')}
              className="hover:text-amber-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActivePolicyTab('kimberley')}
              className="hover:text-amber-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Kimberley Process Certification
            </button>
            <button
              type="button"
              onClick={() => setActivePolicyTab('hallmark')}
              className="hover:text-amber-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              BIS Hallmarking Charter
            </button>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE POLICY & COMPLIANCE MODAL ── */}
      {activePolicyTab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-md animate-in fade-in duration-200"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={() => setActivePolicyTab(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl bg-[#FCFBF9] border border-stone-200 p-6 sm:p-8 shadow-2xl text-[#1C1917]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActivePolicyTab(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 pr-8 border-b border-stone-200 pb-4">
              <button
                type="button"
                onClick={() => setActivePolicyTab('privacy')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  activePolicyTab === 'privacy'
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActivePolicyTab('terms')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  activePolicyTab === 'terms'
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setActivePolicyTab('kimberley')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  activePolicyTab === 'kimberley'
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kimberley Process
              </button>
              <button
                type="button"
                onClick={() => setActivePolicyTab('hallmark')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  activePolicyTab === 'hallmark'
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                BIS Hallmarking
              </button>
            </div>

            {/* Content Display based on Tab */}
            {activePolicyTab === 'privacy' && (
              <div className="space-y-4 text-xs text-stone-700 leading-relaxed font-light">
                <div className="flex items-center gap-2 text-stone-900 font-serif text-lg font-semibold">
                  <FileText className="w-5 h-5 text-[#8C6A28]" />
                  <h4>Patron Privacy &amp; Data Governance</h4>
                </div>
                <p>
                  AURUM JEWELS adheres strictly to the Digital Personal Data Protection (DPDP) Act. All customer records, bespoke gouache sketches, diamond certificates, and communication histories are maintained under enterprise-grade 256-bit encryption.
                </p>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <h5 className="font-semibold text-stone-900">Information We Collect</h5>
                  <p>
                    We collect identification and contact details (name, email, verified mobile number) solely to process jewellery purchases, insurance dossiers, and showroom viewing appointments. We never sell, lease, or monetize customer identity data to third parties.
                  </p>
                </div>
                <p>
                  High-value commissions and vault delivery logs are accessible only by authorized compliance and concierge officers for statutory tax compliance and insured transit validation.
                </p>
              </div>
            )}

            {activePolicyTab === 'terms' && (
              <div className="space-y-4 text-xs text-stone-700 leading-relaxed font-light">
                <div className="flex items-center gap-2 text-stone-900 font-serif text-lg font-semibold">
                  <FileText className="w-5 h-5 text-[#8C6A28]" />
                  <h4>Terms of Purchase &amp; Bullion Sourcing</h4>
                </div>
                <p>
                  All retail jewellery transactions are governed by live market bullion rates published at the time of order confirmation. The selling price comprises net precious metal value, certified gemstone valuation, flat making charges, and statutory 3% GST.
                </p>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <h5 className="font-semibold text-stone-900">Bespoke Commission Terms</h5>
                  <p>
                    Custom design commissions require an initial design advance prior to lost-wax casting. Once master karigars commence precious metallurgy, custom structural specifications cannot be altered. Delivery milestones are estimated in working days subject to government assay hallmarking.
                  </p>
                </div>
              </div>
            )}

            {activePolicyTab === 'kimberley' && (
              <div className="space-y-4 text-xs text-stone-700 leading-relaxed font-light">
                <div className="flex items-center gap-2 text-stone-900 font-serif text-lg font-semibold">
                  <Gem className="w-5 h-5 text-[#8C6A28]" />
                  <h4>The Kimberley Process Certification Scheme (KPCS)</h4>
                </div>
                <p>
                  AURUM JEWELS enforces an uncompromising zero-tolerance policy against conflict diamonds. Every rough and polished diamond entering our ateliers is certified conflict-free in complete compliance with the United Nations Kimberley Process Certification Scheme and World Diamond Council System of Warranties.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-stone-800 space-y-2">
                  <h5 className="font-semibold text-[#8C6A28]">Our Ethical Diamond Guarantee</h5>
                  <p>
                    All natural diamonds above 0.30 carats originate exclusively from legitimate ethical mining cooperatives adhering to fair wage and environmental safety protocols. Every stone carries its original GIA or IGI laboratory dossier with verifiable girdle laser inscriptions.
                  </p>
                </div>
              </div>
            )}

            {activePolicyTab === 'hallmark' && (
              <div className="space-y-4 text-xs text-stone-700 leading-relaxed font-light">
                <div className="flex items-center gap-2 text-stone-900 font-serif text-lg font-semibold">
                  <ShieldCheck className="w-5 h-5 text-[#8C6A28]" />
                  <h4>Bureau of Indian Standards (BIS) Hallmarking Charter</h4>
                </div>
                <p>
                  In accordance with the Ministry of Consumer Affairs, Government of India, all gold and bullion items crafted by AURUM JEWELS bear mandatory tripartite BIS hallmarking:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-stone-800 font-normal">
                  <li><strong>BIS Triangular Stamp:</strong> Signifies sovereign national assay authenticity.</li>
                  <li><strong>Purity Fineness:</strong> 916 for 22 Karat gold, 750 for 18 Karat gold, 585 for 14 Karat gold.</li>
                  <li><strong>6-Digit Laser HUID:</strong> Unique alphanumeric identifier engraved on every item.</li>
                </ul>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4 mt-3">
                  <div>
                    <p className="font-semibold text-stone-900 text-xs">Verify your HUID on the official portal</p>
                    <p className="text-[11px] text-stone-500">Download the BIS Care Mobile App or visit bis.gov.in</p>
                  </div>
                  <a
                    href="https://www.manakonline.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-[#1C1917] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#8C6A28] transition-colors shrink-0"
                  >
                    <span>BIS Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {activePolicyTab === 'exchange' && (
              <div className="space-y-4 text-xs text-stone-700 leading-relaxed font-light">
                <div className="flex items-center gap-2 text-stone-900 font-serif text-lg font-semibold">
                  <RefreshCw className="w-5 h-5 text-[#8C6A28]" />
                  <h4>100% Lifetime Bullion Exchange &amp; Care Terms</h4>
                </div>
                <p>
                  We offer an open lifetime exchange guarantee on all AURUM creations. When upgrading or trading in family gold, our showrooms utilize precision laser Karatmeter testing to evaluate exact elemental purity.
                </p>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <h5 className="font-semibold text-stone-900">Exchange Formula</h5>
                  <p>
                    Net Pure Gold Weight × Prevailing Live Bullion Benchmark Rate of the day. Zero deduction on intrinsic metal purity. Making charges and taxes are non-refundable.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Bottom Close */}
            <div className="mt-8 pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicyTab(null)}
                className="px-6 py-2.5 rounded-full bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#8C6A28] transition-colors cursor-pointer"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
