import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useCustomerAuthStore } from '../../store/authStore';
import { customerAuthApi } from '../../api/customer-auth.api';

import {
  isValidEmail,
  isValidPhone,
  isValidPincode,
  isValidName,
  sanitizePhoneNumber,
} from '../../utils/validation';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regAltPhone, setRegAltPhone] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useCustomerAuthStore();

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessMsg(null);
    setForgotSuccess(false);
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleTabChange = (newTab: 'login' | 'register' | 'forgot') => {
    resetMessages();
    setTab(newTab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const errors: Record<string, string> = {};
    if (!loginEmail.trim()) {
      errors.loginEmail = 'Email address is required.';
    } else if (!isValidEmail(loginEmail)) {
      errors.loginEmail = 'Please enter a valid email address.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please correct the highlighted errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      setSuccessMsg('Welcome back! You have successfully signed in.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Unable to sign in. Please verify your credentials.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const errors: Record<string, string> = {};

    // 1. Full name validation
    if (!isValidName(regFullName)) {
      errors.regFullName = 'Full name must be at least 2 characters.';
    }

    // 2. Email validation
    if (!isValidEmail(regEmail)) {
      errors.regEmail = 'Please provide a valid email address.';
    }

    // 3. Primary phone validation
    const cleanPhone = sanitizePhoneNumber(regPhone);
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      errors.regPhone = 'Please provide a valid 10-digit mobile number.';
    }

    // 4. Delivery address validation
    if (!regAddress.trim() || regAddress.trim().length < 5) {
      errors.regAddress = 'Please provide a complete street address (minimum 5 characters).';
    }

    // 5. PIN code validation
    const cleanPincode = regPincode.replace(/\D/g, '');
    if (!isValidPincode(cleanPincode)) {
      errors.regPincode = 'Please enter a valid 6-digit postal PIN code.';
    }

    // 6. Optional Alt phone validation
    let cleanAltPhone: string | undefined = undefined;
    if (regAltPhone.trim()) {
      cleanAltPhone = sanitizePhoneNumber(regAltPhone);
      if (!isValidPhone(cleanAltPhone)) {
        errors.regAltPhone = 'Alternative phone must be a valid 10-digit number.';
      }
    }

    // 7. Optional WhatsApp number validation
    let cleanWhatsapp: string | undefined = undefined;
    if (sameAsPhone) {
      cleanWhatsapp = cleanPhone;
    } else if (regWhatsapp.trim()) {
      cleanWhatsapp = sanitizePhoneNumber(regWhatsapp);
      if (!isValidPhone(cleanWhatsapp)) {
        errors.regWhatsapp = 'WhatsApp number must be a valid 10-digit number.';
      }
    }

    // 8. Password validation
    if (!regPassword || regPassword.length < 6) {
      errors.regPassword = 'Password must be at least 6 characters.';
    }

    // 9. Confirm password matching
    if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please review the form and correct the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: cleanPhone,
        address: regAddress.trim(),
        pincode: cleanPincode,
        altPhone: cleanAltPhone,
        whatsappNumber: cleanWhatsapp,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });

      setSuccessMsg('Account created successfully! Welcome to Aurum Jewels.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Registration failed. Please try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotEmail.trim() || !isValidEmail(forgotEmail)) {
      setFieldErrors({ forgotEmail: 'Please enter a valid email address.' });
      setErrorMsg('Please provide a valid registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await customerAuthApi.forgotPassword(forgotEmail.trim().toLowerCase());
      setForgotSuccess(true);
      setSuccessMsg(
        'If an account exists with this email, password reset instructions have been dispatched.',
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to process request at this time.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-300"
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[92dvh] flex flex-col rounded-3xl bg-[#FAF8F5] border border-amber-900/20 shadow-2xl text-[#1C1917] overflow-hidden"
        data-lenis-prevent="true"
      >
        {/* Luxury subtle ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-stone-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 sm:px-8 border-b border-stone-200/80 bg-gradient-to-b from-[#FFFDF9] to-[#FAF8F5] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase text-[#8C6A28] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>AURUM CONCIERGE &amp; CLIENTELE</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-[#1C1917]">
            {tab === 'login' && 'Patron Sign In'}
            {tab === 'register' && 'Create Patron Account'}
            {tab === 'forgot' && 'Reset Password'}
          </h2>

          <p className="text-xs text-stone-500 mt-1 font-light">
            {tab === 'login' && 'Access your bespoke inquiries, private appointments, and orders.'}
            {tab === 'register' && 'Join Aurum Jewels for privileged access, live gold rates, and bespoke requests.'}
            {tab === 'forgot' && 'Enter your verified account email to recover access.'}
          </p>

          {/* Tabs switch */}
          {tab !== 'forgot' && (
            <div className="flex mt-4 p-1 rounded-xl bg-stone-200/70 border border-stone-300/60 max-w-xs">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div
          className="relative flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8 space-y-4"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Status Banners */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* ══════════════ TAB: SIGN IN ══════════════ */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#8C6A28]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="patron@aurumjewels.com"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    clearFieldError('loginEmail');
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                    fieldErrors.loginEmail
                      ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                      : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                  }`}
                />
                {fieldErrors.loginEmail && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.loginEmail}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-600 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot')}
                    className="text-[11px] text-[#8C6A28] hover:text-[#5C4516] underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      clearFieldError('loginPassword');
                    }}
                    className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                      fieldErrors.loginPassword
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.loginPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.loginPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] hover:from-[#8C6A28] hover:to-[#A37B30] text-amber-100 hover:text-white font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Don't have a patron account? </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className="text-xs font-semibold text-[#8C6A28] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* ══════════════ TAB: REGISTER ══════════════ */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-1">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8C6A28]" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={regFullName}
                  onChange={(e) => {
                    setRegFullName(e.target.value);
                    clearFieldError('regFullName');
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                    fieldErrors.regFullName
                      ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                      : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                  }`}
                />
                {fieldErrors.regFullName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regFullName}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      clearFieldError('regEmail');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                      fieldErrors.regEmail
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                    }`}
                  />
                  {fieldErrors.regEmail && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Mobile Phone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    maxLength={14}
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      clearFieldError('regPhone');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                      fieldErrors.regPhone
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                    }`}
                  />
                  {fieldErrors.regPhone && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regPhone}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8C6A28]" />
                  <span>Street Address &amp; Residence *</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Flat/House No., Building, Street / Area"
                  value={regAddress}
                  onChange={(e) => {
                    setRegAddress(e.target.value);
                    clearFieldError('regAddress');
                  }}
                  className={`w-full px-4 py-2 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition resize-none shadow-xs ${
                    fieldErrors.regAddress
                      ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                      : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                  }`}
                />
                {fieldErrors.regAddress && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regAddress}</p>
                )}
              </div>

              {/* PIN Code & Alt Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 400001"
                    value={regPincode}
                    onChange={(e) => {
                      setRegPincode(e.target.value.replace(/\D/g, ''));
                      clearFieldError('regPincode');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                      fieldErrors.regPincode
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                    }`}
                  />
                  {fieldErrors.regPincode && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regPincode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                    Alt Phone Number <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional alternate"
                    maxLength={14}
                    value={regAltPhone}
                    onChange={(e) => {
                      setRegAltPhone(e.target.value);
                      clearFieldError('regAltPhone');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                      fieldErrors.regAltPhone
                        ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                    }`}
                  />
                  {fieldErrors.regAltPhone && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regAltPhone}</p>
                  )}
                </div>
              </div>

              {/* WhatsApp Number & Checkbox */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-600">
                    WhatsApp Number <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => {
                        setSameAsPhone(e.target.checked);
                        if (e.target.checked) {
                          setRegWhatsapp(regPhone);
                          clearFieldError('regWhatsapp');
                        }
                      }}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Same as primary phone</span>
                  </label>
                </div>
                {!sameAsPhone && (
                  <>
                    <input
                      type="tel"
                      placeholder="WhatsApp number for updates"
                      maxLength={14}
                      value={regWhatsapp}
                      onChange={(e) => {
                        setRegWhatsapp(e.target.value);
                        clearFieldError('regWhatsapp');
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                        fieldErrors.regWhatsapp
                          ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                          : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                      }`}
                    />
                    {fieldErrors.regWhatsapp && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regWhatsapp}</p>
                    )}
                  </>
                )}
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        clearFieldError('regPassword');
                      }}
                      className={`w-full px-4 py-2.5 pr-9 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                        fieldErrors.regPassword
                          ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                          : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.regPassword && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Confirm Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        clearFieldError('regConfirmPassword');
                      }}
                      className={`w-full px-4 py-2.5 pr-9 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                        fieldErrors.regConfirmPassword
                          ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                          : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.regConfirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regConfirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] hover:from-[#8C6A28] hover:to-[#A37B30] text-amber-100 hover:text-white font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Already a registered patron? </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="text-xs font-semibold text-[#8C6A28] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* ══════════════ TAB: FORGOT PASSWORD ══════════════ */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 pt-1">
              {!forgotSuccess ? (
                <>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#8C6A28]" />
                      <span>Account Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="patron@aurumjewels.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        clearFieldError('forgotEmail');
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-white border text-xs text-stone-900 placeholder-stone-400 outline-none transition shadow-xs ${
                        fieldErrors.forgotEmail
                          ? 'border-rose-400 ring-1 ring-rose-400 focus:border-rose-500'
                          : 'border-stone-200 focus:border-[#8C6A28] focus:ring-1 focus:ring-[#8C6A28]'
                      }`}
                    />
                    {fieldErrors.forgotEmail && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.forgotEmail}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-[#1C1917] hover:bg-[#8C6A28] text-amber-100 hover:text-white font-semibold text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending reset link...</span>
                      </>
                    ) : (
                      <span>Dispatch Reset Instructions</span>
                    )}
                  </button>
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-stone-900">
                    Dispatch Initiated
                  </h4>
                  <p className="text-xs text-stone-600 font-light max-w-sm mx-auto">
                    If an account is associated with <strong className="text-stone-900">{forgotEmail}</strong>, instructions to regain entry have been issued.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="w-full py-2.5 text-xs font-semibold text-stone-600 hover:text-[#8C6A28] transition-colors cursor-pointer text-center block"
              >
                &larr; Back to Patron Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
