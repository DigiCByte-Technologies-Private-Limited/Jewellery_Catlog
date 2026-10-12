import { useState, useEffect, type FormEvent } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { requestsApi } from '../api/requests.api';
import { useCustomerAuthStore } from '../store/authStore';
import {
  isValidEmail,
  isValidPhone,
  isValidName,
  sanitizePhoneNumber,
  getTodayDateString,
  isTodayOrFutureDate,
} from '../utils/validation';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMetal: string;
  selectedGem: string;
}

export const ConsultationModal = ({
  isOpen,
  onClose,
  selectedMetal,
  selectedGem,
}: ConsultationModalProps) => {
  const { user, customer, isAuthenticated } = useCustomerAuthStore();

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmedRequestId, setConfirmedRequestId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '14:00 - 15:00 IST',
    notes: '',
  });

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || customer?.fullName || user?.fullName || '',
        email: prev.email || customer?.email || user?.email || '',
        phone: prev.phone || customer?.phone || user?.phone || '',
      }));
    }
  }, [isOpen, isAuthenticated, customer, user]);

  // Freeze background page scroll and pause Lenis smooth scroll when consultation modal is open
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    // 1. Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Please enter your full name.';
    } else if (!isValidName(formData.fullName)) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    // 2. Email validation
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 3. Phone validation
    const cleanPhone = sanitizePhoneNumber(formData.phone);
    if (!formData.phone.trim()) {
      errors.phone = 'Please provide your mobile number.';
    } else if (!isValidPhone(cleanPhone)) {
      errors.phone = 'Please provide a valid 10-digit mobile number.';
    }

    // 4. Date validation
    if (!formData.date) {
      errors.date = 'Please select a preferred consultation date.';
    } else if (!isTodayOrFutureDate(formData.date)) {
      errors.date = 'Consultation date cannot be in the past.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please correct the highlighted fields before booking.');
      return;
    }

    setIsSubmitting(true);

    try {
      const configSummary = `${selectedMetal.replace('-', ' ')} • ${selectedGem}`;
      const res = await requestsApi.createInquiry({
        customerName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        productName: `Private Gemologist Consultation (${configSummary})`,
        message: `Preferred Date: ${formData.date}\nTime Slot: ${formData.timeSlot}\nPreferences / Notes: ${formData.notes || 'None'}\nConfiguration: ${configSummary}`,
        preferredContactMethod: 'WHATSAPP',
      });

      const reqId = res.data?.data?.requestId || 'CON-CONFIRMED';
      setConfirmedRequestId(reqId);
      setSubmitted(true);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      setErrorMsg(
        typeof apiMsg === 'string'
          ? apiMsg
          : 'Failed to reserve appointment. Please verify details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const configSummary = `${selectedMetal.replace('-', ' ')} • ${selectedGem}`;
    const text = encodeURIComponent(
      `Hello Aurum Jewels Atelier Concierge,\n\nI have requested a Private Gemologist Consultation.\nRef ID: ${confirmedRequestId || 'N/A'}\nName: ${formData.fullName}\nDate: ${formData.date} (${formData.timeSlot})\nJewelry Configuration: ${configSummary}\nNotes: ${formData.notes || 'N/A'}\n\nPlease confirm availability.`
    );
    window.open(`https://wa.me/916303955998?text=${text}`, '_blank');
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setErrorMsg(null);
    setFieldErrors({});
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      date: '',
      timeSlot: '14:00 - 15:00 IST',
      notes: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300"
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[92dvh] overflow-y-auto overscroll-contain rounded-3xl bg-[#FCFBF9] border border-stone-200 p-6 sm:p-8 shadow-2xl text-[#1C1917]"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-[#8C6A28] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
              <span>PRIVATE CONCIERGE</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold mb-2 text-[#1C1917]">
              Bespoke Private Consultation
            </h3>
            <p className="text-xs text-stone-600 mb-6 font-light">
              Connect 1-on-1 with a master gemologist to customize your ring, inspect GIA-certified stones, or commission custom fine jewelry.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between text-stone-600">
                <span>Selected Configuration:</span>
                <span className="text-[#8C6A28] font-semibold capitalize">
                  {selectedMetal.replace('-', ' ')} • {selectedGem}
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    clearFieldError('fullName');
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-xs ${
                    fieldErrors.fullName
                      ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                      : 'border-stone-200 focus:border-amber-500'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="patron@aurumjewels.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      clearFieldError('email');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-xs ${
                      fieldErrors.email
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-amber-500'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      clearFieldError('phone');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-xs ${
                      fieldErrors.phone
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-amber-500'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#B89047]" />
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayDateString()}
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      clearFieldError('date');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 focus:outline-none transition-colors shadow-xs ${
                      fieldErrors.date
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-amber-500'
                    }`}
                  />
                  {fieldErrors.date && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#B89047]" />
                    Time Slot
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-900 focus:outline-none transition-colors shadow-xs"
                  >
                    <option value="11:00 - 12:00 IST">11:00 - 12:00 IST (Morning)</option>
                    <option value="14:00 - 15:00 IST">14:00 - 15:00 IST (Afternoon)</option>
                    <option value="17:00 - 18:00 IST">17:00 - 18:00 IST (Evening)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                  Custom Inquiries & Diamond Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mention target carat weight, budget, or custom engraving..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors resize-none shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white font-semibold text-xs tracking-widest uppercase shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>RESERVING APPOINTMENT...</span>
                  </>
                ) : (
                  <span>CONFIRM PRIVATE APPOINTMENT</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
              Consultation Reserved
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto font-light leading-relaxed">
              Thank you, <strong className="text-stone-900">{formData.fullName}</strong>. Your private gemologist session has been officially registered with the atelier under reference{' '}
              <strong className="font-mono text-[#8C6A28]">{confirmedRequestId}</strong>.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp (+91 63039 55998)</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-full bg-stone-200 hover:bg-stone-300 text-xs uppercase tracking-widest text-stone-800 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
