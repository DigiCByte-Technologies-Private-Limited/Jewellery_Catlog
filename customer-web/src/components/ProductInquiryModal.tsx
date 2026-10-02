import React, { useState, type FormEvent } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  User,
  Globe,
  MessageSquare,
  Layers,
  MapPin,
  Navigation,
} from 'lucide-react';
import { requestsApi, type CreateInquiryPayload } from '../api/requests.api';
import { useCustomerAuthStore } from '../store/authStore';

export interface InquiryProductContext {
  productId?: string;
  productName: string;
  productImage?: string;
  category?: string;
  specifications?: string;
}

interface ProductInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InquiryProductContext | null;
}

export const ProductInquiryModal: React.FC<ProductInquiryModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { user, customer, isAuthenticated } = useCustomerAuthStore();

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    companyName: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    quantity: '',
    country: 'India',
    preferredContactMethod: 'EMAIL' as 'EMAIL' | 'PHONE' | 'WHATSAPP',
    technicalRequirement: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    requestId: string;
    productName: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen && isAuthenticated) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || customer?.fullName || user?.fullName || '',
        email: prev.email || customer?.email || user?.email || '',
        phone: prev.phone || customer?.phone || user?.phone || '',
        city: prev.city || customer?.city || '',
        state: prev.state || customer?.state || '',
      }));
    }
  }, [isOpen, isAuthenticated, customer, user]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setLocationDetected(true);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setErrorMsg('Could not retrieve GPS coordinates. Please enter your City and State manually.');
      },
      { timeout: 8000 }
    );
  };

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    if (!formData.customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMsg('Please enter your city to identify your nearby showroom.');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMsg('Please enter your requirement message.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateInquiryPayload = {
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        productId: product.productId,
        productName: product.productName,
        message: formData.message.trim(),
        quantity: formData.quantity.trim() || undefined,
        preferredContactMethod: formData.preferredContactMethod,
        technicalRequirement: formData.technicalRequirement.trim() || undefined,
      };

      const res = await requestsApi.createInquiry(payload);
      const created = res.data?.data;

      setSubmittedData({
        requestId: created?.requestId || 'REQ-CONFIRMED',
        productName: product.productName,
      });
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setErrorMsg('Unable to connect to the server. Please check your connection and try again.');
      } else {
        setErrorMsg(typeof apiMsg === 'string' ? apiMsg : 'Something went wrong while submitting your inquiry. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedData(null);
    setErrorMsg(null);
    setLocationDetected(false);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      companyName: '',
      city: '',
      state: '',
      latitude: null,
      longitude: null,
      quantity: '',
      country: 'India',
      preferredContactMethod: 'EMAIL',
      technicalRequirement: '',
      message: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[#FCFBF9] border border-stone-200 shadow-2xl text-[#1C1917] overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Sparkles className="w-4 h-4 text-[#8C6A28]" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-stone-900 leading-tight">
                {submittedData ? 'Inquiry Confirmed' : 'Request Product Information'}
              </h3>
              <p className="text-[11px] text-stone-500 uppercase tracking-wider font-medium">
                Official Commercial & Bespoke Inquiry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 rounded-full bg-stone-100 text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-5">
          {submittedData ? (
            /* ── SUCCESS CONFIRMATION SCREEN ── */
            <div className="text-center py-6 px-2 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="font-serif text-2xl font-bold text-stone-900">
                  Inquiry Submitted Successfully
                </h4>
                <p className="text-xs text-stone-600 mt-2 max-w-md mx-auto">
                  Thank you for your interest in{' '}
                  <strong className="text-stone-900">{submittedData.productName}</strong>. Your inquiry has been registered directly with our executive sales and client desk.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 max-w-sm mx-auto shadow-xs">
                <div className="text-[10px] uppercase tracking-widest text-amber-800 font-semibold mb-1">
                  Official Reference
                </div>
                <div className="font-mono text-2xl font-extrabold text-[#8C6A28] tracking-wider">
                  {submittedData.requestId}
                </div>
                <div className="text-[11px] text-amber-900/70 mt-1">
                  Please quote this Request ID in all future correspondence
                </div>
              </div>

              <p className="text-xs text-stone-500 font-light max-w-md mx-auto">
                Our customer relationship team will review your specifications and contact you shortly with availability, quotation, and technical documentation.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-3 rounded-full bg-stone-900 text-white font-medium text-xs tracking-wider uppercase hover:bg-stone-800 transition-colors shadow-md cursor-pointer"
                >
                  Continue Browsing Products
                </button>
              </div>
            </div>
          ) : (
            /* ── INQUIRY FORM ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Info Prepopulated Banner */}
              <div className="p-3.5 rounded-2xl bg-stone-100/90 border border-stone-200 flex items-center gap-3">
                {product.productImage && (
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
                    <Layers className="w-3 h-3" />
                    <span>Inquiry Product</span>
                  </div>
                  <div className="font-serif text-sm font-bold text-stone-900 truncate">
                    {product.productName}
                  </div>
                  {(product.category || product.specifications) && (
                    <div className="text-[11px] text-stone-500 truncate">
                      {[product.category, product.specifications].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Contact Information (Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold flex items-center gap-1">
                    <User className="w-3 h-3 text-stone-400" />
                    <span>Customer Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@biotech.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-stone-400" />
                    <span>Company / Business (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Individual or Enterprise Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* Customer Location for Nearby Store Fulfillment */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-amber-900 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>Customer Location (For Nearby Store Assignment)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-[10px] font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Navigation className="w-3 h-3 text-amber-700" />
                    <span>{isLocating ? 'Detecting...' : locationDetected ? '📍 GPS Locked' : 'Auto Detect GPS'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-600 mb-1 font-medium">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vijayawada, Hyderabad"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-600 mb-1 font-medium">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Andhra Pradesh, Telangana"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Commercial Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-medium">
                    Quantity Required
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50 units"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3 text-stone-400" />
                    <span>Country</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-medium">
                    Preferred Contact
                  </label>
                  <select
                    value={formData.preferredContactMethod}
                    onChange={(e: any) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 focus:outline-none transition-colors shadow-2xs"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Technical Requirement (Optional) */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-medium">
                  Technical Specifications / Customization (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Specific grade, certification, or packaging requirements"
                  value={formData.technicalRequirement}
                  onChange={(e) => setFormData({ ...formData, technicalRequirement: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                />
              </div>

              {/* Message / Requirement (Required) */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-stone-400" />
                  <span>Customer Message / Requirement *</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Please describe your requirements, timeline, and questions..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
