import { useState, useEffect, type FormEvent } from 'react';
import { X, Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

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
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '14:00 - 15:00 IST',
    notes: '',
  });

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // simulate success
    }, 1000);
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
          onClick={onClose}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between text-stone-600">
                <span>Selected Configuration:</span>
                <span className="text-[#8C6A28] font-semibold capitalize">
                  {selectedMetal.replace('-', ' ')} • {selectedGem}
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="patron@aurumjewels.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#B89047]" />
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-900 focus:outline-none transition-colors shadow-xs"
                  />
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
                  Custom Inquiries & Diamond Preferences
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
                className="w-full py-3.5 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white font-semibold text-xs tracking-widest uppercase shadow-md transition-all cursor-pointer"
              >
                CONFIRM PRIVATE APPOINTMENT
              </button>
            </form>
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-[#8C6A28] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
              Consultation Reserved
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto font-light leading-relaxed">
              Thank you, {formData.fullName || 'esteemed patron'}. A private gemologist invitation with your appointment dossier has been dispatched to your email.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 rounded-full bg-stone-200 hover:bg-stone-300 text-xs uppercase tracking-widest text-stone-800 font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
