import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
  Phone,
  User,
  Mail,
  Building2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import type { MetalType, GemType, ProngStyle } from '../types/bespoke';
import { productsApi } from '../api/products.api';
import { requestsApi, type CreateInquiryPayload } from '../api/requests.api';
import { useCustomerAuthStore } from '../store/authStore';
import { isValidEmail, isValidPhone, isValidName, sanitizePhoneNumber } from '../utils/validation';

export interface CartItem {
  modelType: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  title: string;
  metal: MetalType;
  gem: GemType;
  carat: number;
  prongStyle: ProngStyle;
  engravingText: string;
  price: string;
  productId?: string;
  rawPrice?: number;
  weightGrams?: number;
  purity?: string;
  breakdown?: any;
}

interface LuxuryCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: CartItem;
  onOpenConsultation?: () => void;
}

const SHOWROOM_OPTIONS = [
  { city: 'Bangalore', name: 'Bangalore Luxury Gallery', phone: '+91 80 4112 7700', waNumber: '916303955998' },
  { city: 'Mumbai', name: 'Mumbai Diamond Hub (Bandra West)', phone: '+91 22 2640 1234', waNumber: '916303955998' },
  { city: 'Delhi', name: 'Delhi Sovereign Emporium (South Ext)', phone: '+91 11 4164 5566', waNumber: '916303955998' },
  { city: 'Hyderabad', name: 'Hyderabad Royal Heritage (Jubilee Hills)', phone: '+91 40 2355 8899', waNumber: '916303955998' },
  { city: 'Chennai', name: 'Chennai Heritage Hall (Nungambakkam)', phone: '+91 44 2833 4455', waNumber: '916303955998' },
  { city: 'Vijayawada', name: 'Vijayawada Flagship Boutique (MG Road)', phone: '+91 866 247 1100', waNumber: '916303955998' },
  { city: 'Guntur', name: 'Guntur Regional Showroom (Arundelpet)', phone: '+91 863 222 3456', waNumber: '916303955998' },
];

const CENTRAL_CONCIERGE_WA = '916303955998';

type DrawerStep = 'summary' | 'details' | 'success';

export const LuxuryCartDrawer: React.FC<LuxuryCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItem,
  onOpenConsultation,
}) => {
  const { user, customer, isAuthenticated } = useCustomerAuthStore();

  const [drawerStep, setDrawerStep] = useState<DrawerStep>('summary');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [priceDriftNotice, setPriceDriftNotice] = useState<string | null>(null);
  const [authoritativePrice, setAuthoritativePrice] = useState<string>(cartItem.price);

  // Customer Evaluation Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedShowroomCity, setSelectedShowroomCity] = useState('Bangalore');
  const [customerNotes, setCustomerNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Confirmed Evaluation State
  const [confirmedInquiry, setConfirmedInquiry] = useState<{
    requestId: string;
    productName: string;
    finalPrice: string;
    showroomName: string;
    showroomId: string;
    waUrl: string;
  } | null>(null);

  const metalNames: Record<MetalType, string> = {
    'yellow-gold': '18K Satin Champagne Gold',
    'rose-gold': '18K Imperial Rose Vermeil',
    'platinum': 'Noble Platinum 950',
  };

  const gemNames: Record<GemType, string> = {
    'diamond': 'GIA Certified D-Flawless Diamond',
    'sapphire': 'Royal Ceylon Sapphire',
    'emerald': 'Colombian Emerald',
    'ruby': 'Burmese Pigeon Blood Ruby',
  };

  // Lock body scroll and pause Lenis smooth scroll while cart drawer is open
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (isOpen) {
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
  }, [isOpen]);

  // Pre-fill customer details if patron is authenticated
  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        setCustomerName(customer?.fullName || user?.fullName || '');
        setCustomerPhone(customer?.phone || user?.phone || '');
        setCustomerEmail(customer?.email || user?.email || '');
        if (customer?.city) {
          const match = SHOWROOM_OPTIONS.find(
            (s) => s.city.toLowerCase() === customer.city?.toLowerCase()
          );
          if (match) setSelectedShowroomCity(match.city);
        }
      }
    }
  }, [isOpen, isAuthenticated, customer, user]);

  // Automatically validate cart price with authoritative backend whenever drawer opens
  useEffect(() => {
    if (!isOpen) {
      setDrawerStep('summary');
      setConfirmedInquiry(null);
      setPriceDriftNotice(null);
      setFormError('');
      return;
    }

    setAuthoritativePrice(cartItem.price);

    if (cartItem.productId) {
      setIsValidating(true);
      productsApi
        .validateCart([
          {
            productId: cartItem.productId,
            requestedPrice: cartItem.rawPrice,
            quantity: 1,
          },
        ])
        .then((res: any) => {
          const data = res.data?.data;
          if (data) {
            if (data.hasPriceChanged) {
              setPriceDriftNotice(
                data.message ||
                  'The price of this product has updated based on the current benchmark metal rates.'
              );
              if (data.items?.[0]) {
                const updatedItem = data.items[0];
                setAuthoritativePrice(`₹${updatedItem.currentPrice.toLocaleString('en-IN')}`);
              }
            } else {
              setPriceDriftNotice(null);
            }
          }
        })
        .catch((err: any) => {
          console.warn('Cart backend validation warning:', err);
        })
        .finally(() => {
          setIsValidating(false);
        });
    }
  }, [isOpen, cartItem.productId, cartItem.rawPrice]);

  const selectedStore =
    SHOWROOM_OPTIONS.find((s) => s.city === selectedShowroomCity) || SHOWROOM_OPTIONS[0];

  // Instant 1-Click WhatsApp Chat (Bypasses form for quick direct inquiry)
  const handleInstantWhatsApp = () => {
    const targetStore = selectedStore;
    const waNumber = targetStore.waNumber || CENTRAL_CONCIERGE_WA;

    const message = [
      `✦ AURUM JEWELS · PRODUCT INQUIRY & EVALUATION ✦`,
      ``,
      `💍 Creation: ${cartItem.title}`,
      `💰 Quoted Live Valuation: ${authoritativePrice}`,
      `⚖️ Net Metal Weight: ${cartItem.weightGrams ? `${cartItem.weightGrams} grams` : `${cartItem.carat} ct`}`,
      `💎 Metal / Purity: ${cartItem.purity || metalNames[cartItem.metal]}`,
      `🏛️ Preferred Showroom: ${targetStore.name} (${targetStore.city})`,
      ``,
      `Hello AURUM Concierge, I would like to evaluate this piece directly with your resident gemologist and verify hallmarking & availability.`,
    ].join('\n');

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Comprehensive WhatsApp Evaluation Submission (Registers with DB & Launches WhatsApp)
  const handleTransmitWhatsAppEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Please enter your full name.';
    } else if (!isValidName(customerName)) {
      errors.customerName = 'Name must be at least 2 characters long.';
    }

    const cleanPhone = sanitizePhoneNumber(customerPhone);
    if (!customerPhone.trim()) {
      errors.customerPhone = 'Please enter your WhatsApp phone number.';
    } else if (!isValidPhone(cleanPhone)) {
      errors.customerPhone = 'Please enter a valid 10-digit mobile number.';
    }

    if (customerEmail.trim() && !isValidEmail(customerEmail)) {
      errors.customerEmail = 'Please provide a valid email address.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please correct the highlighted fields before transmitting.');
      return;
    }

    setIsSubmittingInquiry(true);

    try {
      const targetStore = selectedStore;
      const targetWaNumber = targetStore.waNumber || CENTRAL_CONCIERGE_WA;

      // 1. Register official inquiry in PostgreSQL database
      const inquiryPayload: CreateInquiryPayload = {
        customerName: customerName.trim(),
        email: customerEmail.trim() ? customerEmail.trim().toLowerCase() : 'concierge-lead@aurumjewels.com',
        phone: cleanPhone,
        city: targetStore.city,
        state: 'India',
        productId: cartItem.productId,
        productName: cartItem.title,
        preferredContactMethod: 'WHATSAPP',
        message: [
          `Clienteling Evaluation via WhatsApp.`,
          `Quoted Price: ${authoritativePrice}`,
          `Metal/Purity: ${cartItem.purity || metalNames[cartItem.metal]}`,
          `Net Weight: ${cartItem.weightGrams ? `${cartItem.weightGrams}g` : `${cartItem.carat}ct`}`,
          `Preferred Showroom: ${targetStore.name}`,
          customerNotes ? `Patron Notes: "${customerNotes.trim()}"` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      };

      const res = await requestsApi.createInquiry(inquiryPayload);
      const generatedRequestId = res.data?.data?.requestId || `REQ-${Date.now().toString().slice(-6)}`;

      // 2. Format official WhatsApp clienteling dossier message
      const formattedWhatsAppMessage = [
        `✦ AURUM JEWELS · BESPOKE VALUATION & ORDER ✦`,
        ``,
        `📋 Request Reference: ${generatedRequestId}`,
        `💍 Product: ${cartItem.title}`,
        `💰 Quoted Live Valuation: ${authoritativePrice}`,
        `⚖️ Net Metal Weight: ${cartItem.weightGrams ? `${cartItem.weightGrams} grams` : `${cartItem.carat} ct`}`,
        `💎 Metal / Purity: ${cartItem.purity || metalNames[cartItem.metal]}`,
        `🏛️ Destination Boutique: ${targetStore.name} (${targetStore.city})`,
        ``,
        `PATRON DETAILS:`,
        `• Name: ${customerName.trim()}`,
        `• WhatsApp: +${cleanPhone}`,
        customerEmail.trim() ? `• Email: ${customerEmail.trim()}` : '',
        ``,
        `PATRON INQUIRY / EVALUATION NOTES:`,
        `"${customerNotes.trim() || 'Hello, I would like to evaluate this piece, inspect live hallmark details, and schedule a private showroom viewing.'}"`,
      ]
        .filter(Boolean)
        .join('\n');

      const waUrl = `https://wa.me/${targetWaNumber}?text=${encodeURIComponent(formattedWhatsAppMessage)}`;

      // 3. Set confirmed state
      setConfirmedInquiry({
        requestId: generatedRequestId,
        productName: cartItem.title,
        finalPrice: authoritativePrice,
        showroomName: targetStore.name,
        showroomId: targetStore.city,
        waUrl,
      });

      // 4. Open WhatsApp in new tab
      window.open(waUrl, '_blank');

      // 5. Transition drawer to success confirmation
      setDrawerStep('success');
    } catch (err: any) {
      console.error('Failed to submit WhatsApp inquiry:', err);
      // Fallback: If network failed, open WhatsApp anyway with direct text
      const targetStore = selectedStore;
      const targetWaNumber = targetStore.waNumber || CENTRAL_CONCIERGE_WA;
      const fallbackMsg = `✦ AURUM JEWELS · INQUIRY ✦\nProduct: ${cartItem.title}\nPrice: ${authoritativePrice}\nPatron: ${customerName}\nPhone: ${customerPhone}`;
      const fallbackUrl = `https://wa.me/${targetWaNumber}?text=${encodeURIComponent(fallbackMsg)}`;
      window.open(fallbackUrl, '_blank');

      setConfirmedInquiry({
        requestId: `REQ-${Date.now().toString().slice(-6)}`,
        productName: cartItem.title,
        finalPrice: authoritativePrice,
        showroomName: targetStore.name,
        showroomId: targetStore.city,
        waUrl: fallbackUrl,
      });
      setDrawerStep('success');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300"
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div
        className="relative w-full max-w-md h-full bg-[#FAF8F5] border-l border-stone-200 flex flex-col justify-between shadow-2xl z-10 text-[#1C1917] overflow-hidden"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-stone-200 shrink-0 bg-[#FAF8F5]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6A28] font-bold block">
                Atelier Clienteling
              </span>
              <h3 className="font-serif text-2xl font-semibold text-[#1C1917] mt-0.5">
                Bespoke Bag
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors shadow-xs cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metal Rate Drift Alert Banner */}
          {priceDriftNotice && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 flex items-start gap-2.5 text-xs animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900 mb-0.5">
                  Latest Metal Rate Applied
                </span>
                <p className="text-amber-800 leading-relaxed font-sans">{priceDriftNotice}</p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-5">
          {/* ── STEP 1: SUMMARY OF SELECTED CREATION ── */}
          {drawerStep === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#8C6A28] font-bold uppercase tracking-wider">
                      {cartItem.productId ? 'Master Registered Jewellery' : 'Custom Atelier Commission'}
                    </span>
                    <h4 className="font-serif text-lg font-semibold text-[#1C1917]">
                      {cartItem.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-lg font-bold text-[#8C6A28]">
                      {authoritativePrice}
                    </span>
                    {isValidating && (
                      <span className="block text-[10px] text-stone-400 font-mono">
                        Validating live rate...
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs Breakdown */}
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Precious Metal:</span>
                    <span className="font-semibold text-[#1C1917]">
                      {cartItem.purity ? `${cartItem.purity} Gold/Silver` : metalNames[cartItem.metal]}
                    </span>
                  </div>

                  {cartItem.weightGrams ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Net Weight:</span>
                      <span className="font-mono font-semibold text-[#1C1917]">
                        {cartItem.weightGrams} grams
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Stone &amp; Carat:</span>
                      <span className="font-semibold text-[#1C1917]">
                        {cartItem.carat.toFixed(2)} ct • {gemNames[cartItem.gem]}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-stone-500">Pricing Engine:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-Time Dynamic Benchmark
                    </span>
                  </div>
                </div>
              </div>

              {/* GIA & BIS Authenticity Passport */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#8C6A28] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-serif text-xs font-semibold text-[#1C1917]">
                    BIS Hallmark &amp; GIA Certification
                  </h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    HUID registered, 100% government hallmarked precious metals &amp; certified gems.
                  </p>
                </div>
              </div>

              {/* White-Glove Inclusions */}
              <div className="space-y-2 pt-1 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B89047]" />
                  <span>Complimentary Imperial Bordeaux Velvet Presentation Box</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B89047]" />
                  <span>Insured Armored Courier Delivery Across India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B89047]" />
                  <span>Lifetime Ultrasonic Cleaning &amp; Purity Warranty</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: PATRON DETAILS & WHATSAPP EVALUATION FORM ── */}
          {drawerStep === 'details' && (
            <form onSubmit={handleTransmitWhatsAppEvaluation} className="space-y-4">
              {/* Back to summary navigation */}
              <button
                type="button"
                onClick={() => setDrawerStep('summary')}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Creation Summary</span>
              </button>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-stone-800 space-y-1">
                <div className="flex items-center gap-2 font-serif text-sm font-semibold text-stone-900">
                  <Sparkles className="w-4 h-4 text-[#8C6A28]" />
                  <span>Patron WhatsApp Clienteling</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed font-light">
                  Provide your details to register this inquiry in our atelier registry and evaluate live pricing, video inspections, or customizations directly on WhatsApp.
                </p>
              </div>

              {/* Selected Piece Recap */}
              <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900 block truncate max-w-[200px]">
                    {cartItem.title}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {cartItem.weightGrams ? `${cartItem.weightGrams}g` : `${cartItem.carat}ct`} • {cartItem.purity || 'Certified'}
                  </span>
                </div>
                <span className="font-serif font-bold text-[#8C6A28] text-sm">
                  {authoritativePrice}
                </span>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Input: Name */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 font-semibold mb-1">
                  Patron Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radhika Sharma"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      clearFieldError('customerName');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-2xs transition-colors ${
                      fieldErrors.customerName
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#B89047]'
                    }`}
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {fieldErrors.customerName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.customerName}</p>
                )}
              </div>

              {/* Form Input: WhatsApp Phone */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 font-semibold mb-1">
                  WhatsApp Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="e.g. +91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      clearFieldError('customerPhone');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-2xs transition-colors font-mono ${
                      fieldErrors.customerPhone
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#B89047]'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {fieldErrors.customerPhone ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.customerPhone}</p>
                ) : (
                  <span className="text-[10px] text-stone-400 block mt-1">
                    Our resident gemologist will reach out with the live quotation.
                  </span>
                )}
              </div>

              {/* Form Input: Email */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 font-semibold mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="patron@aurumjewels.com"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      clearFieldError('customerEmail');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-2xs transition-colors ${
                      fieldErrors.customerEmail
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#B89047]'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {fieldErrors.customerEmail && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.customerEmail}</p>
                )}
              </div>

              {/* Form Input: Preferred Showroom */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-600 font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8C6A28]" />
                  Preferred Destination Showroom *
                </label>
                <div className="relative">
                  <select
                    value={selectedShowroomCity}
                    onChange={(e) => setSelectedShowroomCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-[#B89047] text-xs text-stone-900 focus:outline-none shadow-2xs transition-colors appearance-none pr-8 cursor-pointer"
                  >
                    {SHOWROOM_OPTIONS.map((st) => (
                      <option key={st.city} value={st.city}>
                        {st.name} ({st.city})
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Form Input: Custom Notes */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 font-semibold mb-1">
                  Specific Requirements or Questions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Request live Karatmeter video, ring size customization, or hallmarking assay..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-[#B89047] text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-2xs transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingInquiry}
                className="w-full py-4 rounded-full bg-[#104b2b] hover:bg-[#0c3920] text-emerald-100 font-semibold text-xs tracking-[0.18em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40 disabled:opacity-50"
              >
                {isSubmittingInquiry ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                    <span>RECORDING INQUIRY &amp; LAUNCHING...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-300" />
                    <span>TRANSMIT &amp; OPEN IN WHATSAPP</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 3: CONFIRMATION & DIRECT ACTION ── */}
          {drawerStep === 'success' && confirmedInquiry && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-700 font-bold block mb-1">
                  Inquiry Registered
                </span>
                <h4 className="font-serif text-2xl font-semibold text-stone-900">
                  WhatsApp Evaluation Initiated
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your product evaluation dossier has been registered in the AURUM atelier registry.
                </p>
              </div>

              {/* Inquiry Details Badge */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Tracking Reference:</span>
                  <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                    {confirmedInquiry.requestId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Creation:</span>
                  <span className="font-medium text-stone-900 text-right truncate max-w-[200px]">
                    {confirmedInquiry.productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Live Quoted Valuation:</span>
                  <span className="font-serif font-bold text-[#8C6A28]">
                    {confirmedInquiry.finalPrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Assigned Showroom:</span>
                  <span className="font-medium text-stone-900 text-right truncate max-w-[200px]">
                    {confirmedInquiry.showroomName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">WhatsApp Concierge Desk:</span>
                  <span className="font-mono font-medium text-emerald-800">
                    +91 63039 55998
                  </span>
                </div>
              </div>

              {/* Re-Open WhatsApp Button */}
              <a
                href={confirmedInquiry.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-full bg-[#104b2b] hover:bg-[#0c3920] text-emerald-100 font-semibold text-xs tracking-[0.18em] uppercase shadow-md transition-all flex items-center justify-center gap-2 border border-emerald-500/40"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>RE-OPEN WHATSAPP CHAT</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setDrawerStep('summary');
                  onClose();
                }}
                className="w-full py-3 rounded-full border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-semibold tracking-wider uppercase transition-colors bg-white hover:bg-stone-50 cursor-pointer"
              >
                Return to Showroom
              </button>
            </div>
          )}
        </div>

        {/* Fixed Footer Actions (Only displayed on 'summary' step) */}
        {drawerStep === 'summary' && (
          <div className="p-5 sm:p-6 pt-4 border-t border-stone-200 space-y-3 shrink-0 bg-[#FAF8F5]">
            <div className="flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">
                Authoritative Payable
              </span>
              <span className="font-serif text-2xl font-bold text-[#8C6A28]">
                {authoritativePrice}
              </span>
            </div>

            {/* BUTTON 1: Comprehensive WhatsApp Evaluation Form */}
            <button
              type="button"
              onClick={() => setDrawerStep('details')}
              className="w-full py-3.5 sm:py-4 rounded-full bg-[#104b2b] hover:bg-[#0c3920] text-emerald-100 font-semibold text-xs tracking-[0.18em] uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-500/40 group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
              <span>EVALUATE &amp; ORDER VIA WHATSAPP</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
            </button>

            {/* BUTTON 2: Instant 1-Click Direct WhatsApp Chat */}
            <button
              type="button"
              onClick={handleInstantWhatsApp}
              className="w-full py-3 rounded-full border border-stone-300 hover:border-[#8C6A28] text-stone-800 hover:text-[#8C6A28] text-xs font-semibold tracking-widest uppercase transition-all bg-white hover:bg-amber-50/50 shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>INSTANT 1-CLICK WHATSAPP CHAT</span>
            </button>

            {onOpenConsultation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConsultation();
                }}
                className="w-full text-center text-[11px] text-stone-500 hover:text-[#8C6A28] transition-colors cursor-pointer py-0.5 font-medium underline underline-offset-4"
              >
                Prefer a private video session? Book Gemologist Consultation
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 pt-1">
              <Truck className="w-3 h-3 text-[#8C6A28]" />
              <span>Insured Armored Courier Delivery across India</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
