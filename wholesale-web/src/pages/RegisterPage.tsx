import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const BUSINESS_TYPES = [
  'Jewellery Retailer / Showroom',
  'Wholesaler / Trader',
  'Manufacturer / Karigar Atelier',
  'Bullion Dealer',
  'Exporter / Importer',
  'Diamond Merchant',
  'Other',
];

const STATES = [
  'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi',
  'Tamil Nadu', 'Karnataka', 'West Bengal', 'Uttar Pradesh', 'Punjab', 'Haryana',
  'Kerala', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Assam', 'Other',
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerApplication, isLoading } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Form Fields
  const [form, setForm] = useState({
    // Step 1: Business
    companyName: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    businessType: 'Jewellery Retailer / Showroom',

    // Step 2: Owner & Auth
    ownerName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    password: '',
    confirmPassword: '',

    // Step 3: Verification
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
  });

  // Uploaded Files
  const [files, setFiles] = useState<{
    aadhaarProof?: File;
    panProof?: File;
    gstProof?: File;
  }>({});

  // Success State Modal
  const [submittedApp, setSubmittedApp] = useState<{
    applicationId: string;
    companyName: string;
  } | null>(null);

  const setField = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const val = e.target.value;
    setForm((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === 'phone' && sameAsPhone) {
        updated.whatsappNumber = val;
      }
      return updated;
    });
  };

  const handleFileChange = (field: 'aadhaarProof' | 'panProof' | 'gstProof') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
        toast.error('Allowed document formats: PDF, JPG, JPEG, PNG');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File size must not exceed 10 MB');
        return;
      }
      setFiles((prev) => ({ ...prev, [field]: selected }));
    }
  };

  const removeFile = (field: 'aadhaarProof' | 'panProof' | 'gstProof') => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Step Validations
  const validateStep1 = () => {
    if (!form.companyName.trim()) return 'Business / Firm Name is required';
    if (!form.addressLine.trim()) return 'Shop address is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!form.pincode.trim()) return 'Pincode is required';
    return null;
  };

  const validateStep2 = () => {
    if (!form.ownerName.trim()) return 'Shop owner name is required';
    if (!form.phone.trim()) return 'Primary mobile phone is required';
    if (!form.email.trim() || !form.email.includes('@')) return 'A valid business email is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters long';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateStep3 = () => {
    if (!form.panNumber.trim()) return 'PAN Number is required for wholesale registration';
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(form.panNumber.trim().toUpperCase())) {
      return 'PAN number format is invalid. Example: ABCDE1234F';
    }
    if (form.aadhaarNumber && form.aadhaarNumber.trim().length !== 12) {
      return 'Aadhaar number must be 12 digits';
    }
    if (!files.panProof) return 'Please upload your PAN Card Proof (PDF or Image)';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    } else if (step === 3) {
      const err = validateStep3();
      if (err) { setError(err); return; }
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      formData.append(key, val);
    });

    if (files.aadhaarProof) formData.append('aadhaarProof', files.aadhaarProof);
    if (files.panProof) formData.append('panProof', files.panProof);
    if (files.gstProof) formData.append('gstProof', files.gstProof);

    try {
      const res = await registerApplication(formData);
      setSubmittedApp({
        applicationId: res.data?.applicationId || 'Submitted',
        companyName: form.companyName,
      });
      toast.success('Registration submitted for admin review!');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Unable to submit registration. Please check all fields.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const passwordRequirements = [
    { met: form.password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(form.password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(form.password), text: 'One number' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1917] via-[#241F1C] to-[#1C1917] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#B89346] via-[#E2C37A] to-[#FFF5D6] p-[1.5px] shadow-xl">
              <div className="w-full h-full bg-[#1C1917] rounded-full flex items-center justify-center">
                <span className="font-serif text-[#E2C37A] text-lg font-bold">A</span>
              </div>
            </div>
            <div className="text-left">
              <p className="font-serif text-xl font-bold tracking-[0.2em] text-white uppercase">AURUM</p>
              <p className="text-[10px] tracking-[0.35em] text-[#B89047] uppercase font-semibold">WHOLESALE ATELIER</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Wholesale Partner Registration</h1>
          <p className="text-stone-400 text-sm mt-1">
            Submit your business credentials & KYC documents for verification
          </p>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-[#292524] rounded-2xl p-4 mb-6 border border-[#3D3530] shadow-lg">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { num: 1, label: 'Firm Details', icon: Building2 },
              { num: 2, label: 'Owner Info', icon: User },
              { num: 3, label: 'KYC & Proofs', icon: ShieldCheck },
              { num: 4, label: 'Review', icon: CheckCircle2 },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  disabled={!isPast && step !== s.num}
                  onClick={() => isPast && setStep(s.num as any)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B89047] to-[#D4AF37] text-white font-bold shadow-md'
                      : isPast
                      ? 'text-[#E2C37A] hover:bg-[#3D3530]'
                      : 'text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isActive
                        ? 'bg-white text-[#1C1917] font-bold'
                        : isPast
                        ? 'bg-amber-400/20 text-[#E2C37A]'
                        : 'bg-stone-700 text-stone-400'
                    }`}
                  >
                    {isPast ? '✓' : s.num}
                  </div>
                  <span className="text-xs hidden sm:inline flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-10 shadow-2xl border border-stone-200">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-800 text-sm font-semibold">Please check the following:</p>
                <p className="text-red-700 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* STEP 1: Business Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-[#B89047]" /> Business & Firm Details
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Official registered name and commercial showroom or atelier address
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Firm / Business Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. ABC Jewellers Pvt Ltd"
                      value={form.companyName}
                      onChange={setField('companyName')}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Primary Business Type
                    </label>
                    <select
                      className="input-field"
                      value={form.businessType}
                      onChange={setField('businessType')}
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Shop / Business Address Line *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Shop #12, Jewel Arcade, Main Market"
                      value={form.addressLine}
                      onChange={setField('addressLine')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Surat, Mumbai, Jaipur"
                      value={form.city}
                      onChange={setField('city')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <select
                      className="input-field"
                      value={form.state}
                      onChange={setField('state')}
                      required
                    >
                      <option value="">Select State</option>
                      {STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input-field"
                      placeholder="e.g. 395003"
                      value={form.pincode}
                      onChange={setField('pincode')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      className="input-field bg-stone-100 text-stone-600 cursor-not-allowed"
                      value={form.country}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Shop Owner Information & Credentials */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2.5">
                    <User className="w-5 h-5 text-[#B89047]" /> Shop Owner & Login Credentials
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Authorized proprietor details and login authentication
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Shop Owner Full Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Rajesh Kumar"
                      value={form.ownerName}
                      onChange={setField('ownerName')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Primary Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={setField('phone')}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        WhatsApp Number
                      </label>
                      <label className="text-[11px] text-[#8C6A28] font-semibold flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsPhone}
                          onChange={(e) => {
                            setSameAsPhone(e.target.checked);
                            if (e.target.checked) setForm((p) => ({ ...p, whatsappNumber: p.phone }));
                          }}
                          className="rounded text-[#B89047] focus:ring-0"
                        />
                        Same as Phone
                      </label>
                    </div>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={form.whatsappNumber}
                      disabled={sameAsPhone}
                      onChange={setField('whatsappNumber')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Business Email Address (Login ID) *
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="owner@abcjewellers.com"
                      value={form.email}
                      onChange={setField('email')}
                      required
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      This email will be your permanent login identity.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Create Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="Min 8 characters"
                        value={form.password}
                        onChange={setField('password')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((r) => (
                          <div key={r.text} className="flex items-center gap-1.5">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${r.met ? 'text-green-600' : 'text-stone-300'}`}
                            />
                            <span className={`text-[11px] ${r.met ? 'text-green-700 font-medium' : 'text-stone-400'}`}>
                              {r.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`input-field ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : ''
                      }`}
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={setField('confirmPassword')}
                      required
                    />
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Business Verification & Document Uploads */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#B89047]" /> Business Verification & KYC Uploads
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Upload official verification documents (PDF, JPG, PNG up to 10MB). Stored in private encrypted vault.
                  </p>
                </div>

                {/* PAN Verification */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A28]">
                      1. PAN Card Verification *
                    </span>
                    <span className="text-[11px] bg-amber-100 text-[#8C6A28] px-2 py-0.5 rounded-full font-bold">
                      Mandatory
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">PAN Number *</label>
                      <input
                        type="text"
                        maxLength={10}
                        className="input-field uppercase font-mono tracking-wider"
                        placeholder="ABCDE1234F"
                        value={form.panNumber}
                        onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Upload PAN Proof *</label>
                      {files.panProof ? (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-300">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-[#B89047] shrink-0" />
                            <span className="text-xs font-medium text-stone-700 truncate">{files.panProof.name}</span>
                          </div>
                          <button type="button" onClick={() => removeFile('panProof')} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-2.5 bg-white border border-dashed border-amber-300 hover:border-amber-500 rounded-xl cursor-pointer text-xs font-medium text-stone-600 transition-colors">
                          <Upload className="w-4 h-4 text-[#B89047]" />
                          <span>Choose PAN Card (PDF/Image)</span>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('panProof')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aadhaar Verification */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      2. Aadhaar Card Verification
                    </span>
                    <span className="text-[11px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Aadhaar Number (12 digits)</label>
                      <input
                        type="text"
                        maxLength={12}
                        className="input-field font-mono"
                        placeholder="123456789012"
                        value={form.aadhaarNumber}
                        onChange={setField('aadhaarNumber')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Upload Aadhaar Proof</label>
                      {files.aadhaarProof ? (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-300">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-stone-600 shrink-0" />
                            <span className="text-xs font-medium text-stone-700 truncate">{files.aadhaarProof.name}</span>
                          </div>
                          <button type="button" onClick={() => removeFile('aadhaarProof')} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-2.5 bg-white border border-dashed border-stone-300 hover:border-stone-500 rounded-xl cursor-pointer text-xs font-medium text-stone-600 transition-colors">
                          <Upload className="w-4 h-4 text-stone-500" />
                          <span>Choose Aadhaar Card</span>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('aadhaarProof')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* GST Verification */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      3. GST Registration Certificate
                    </span>
                    <span className="text-[11px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                      If Applicable
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        maxLength={15}
                        className="input-field uppercase font-mono"
                        placeholder="27ABCDE1234F1Z5"
                        value={form.gstNumber}
                        onChange={(e) => setForm((f) => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Upload GST Certificate</label>
                      {files.gstProof ? (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-300">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-stone-600 shrink-0" />
                            <span className="text-xs font-medium text-stone-700 truncate">{files.gstProof.name}</span>
                          </div>
                          <button type="button" onClick={() => removeFile('gstProof')} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-2.5 bg-white border border-dashed border-stone-300 hover:border-stone-500 rounded-xl cursor-pointer text-xs font-medium text-stone-600 transition-colors">
                          <Upload className="w-4 h-4 text-stone-500" />
                          <span>Choose GST Certificate</span>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('gstProof')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review Summary & Submission */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-green-600" /> Review Application Details
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Verify all business and KYC information before sending for Admin compliance review
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Business */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A28]">Business Details</span>
                      <button type="button" onClick={() => setStep(1)} className="text-xs text-[#8C6A28] font-bold hover:underline">Edit</button>
                    </div>
                    <p className="text-sm font-bold text-stone-800">{form.companyName}</p>
                    <p className="text-xs text-stone-600">{form.addressLine}</p>
                    <p className="text-xs text-stone-600">{form.city}, {form.state} - {form.pincode}</p>
                    <p className="text-xs text-stone-500 mt-1">Type: {form.businessType}</p>
                  </div>

                  {/* Card 2: Owner */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A28]">Owner & Login</span>
                      <button type="button" onClick={() => setStep(2)} className="text-xs text-[#8C6A28] font-bold hover:underline">Edit</button>
                    </div>
                    <p className="text-sm font-bold text-stone-800">{form.ownerName}</p>
                    <p className="text-xs text-stone-600">Email: {form.email}</p>
                    <p className="text-xs text-stone-600">Phone: {form.phone}</p>
                    {form.whatsappNumber && <p className="text-xs text-stone-600">WhatsApp: {form.whatsappNumber}</p>}
                  </div>

                  {/* Card 3: Verification */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A28]">KYC & Identification</span>
                      <button type="button" onClick={() => setStep(3)} className="text-xs text-[#8C6A28] font-bold hover:underline">Edit</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-stone-500 block">PAN Number:</span>
                        <span className="font-mono font-bold text-stone-800">{form.panNumber}</span>
                        <span className="text-[11px] block text-green-600 mt-0.5">✓ {files.panProof?.name || 'Proof attached'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Aadhaar Number:</span>
                        <span className="font-mono font-bold text-stone-800">{form.aadhaarNumber ? `XXXX XXXX ${form.aadhaarNumber.slice(-4)}` : 'Not provided'}</span>
                        {files.aadhaarProof && <span className="text-[11px] block text-green-600 mt-0.5">✓ {files.aadhaarProof.name}</span>}
                      </div>
                      <div>
                        <span className="text-stone-500 block">GSTIN Number:</span>
                        <span className="font-mono font-bold text-stone-800">{form.gstNumber || 'Not provided'}</span>
                        {files.gstProof && <span className="text-[11px] block text-green-600 mt-0.5">✓ {files.gstProof.name}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                  🛡️ <strong>Declaration:</strong> I certify that all business information and uploaded KYC documents are genuine and valid. I understand that submitting this registration creates a pending application, and wholesale portal access will be granted only after official verification by Aurum Jewels.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="px-5 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-stone-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="submit"
                  className="btn-primary py-3.5 px-7 flex items-center gap-2 text-xs font-bold"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary py-4 px-9 flex items-center gap-2 text-sm font-bold shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Submit Application for Review
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-stone-500 text-xs">
              Already have an approved account?{' '}
              <Link to="/login" className="text-[#8C6A28] font-bold hover:underline">
                Sign in to Wholesale Portal
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {submittedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#FAF8F5] rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 border border-[#3D3530]">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8C6A28] font-bold">Application Received</span>
              <h3 className="text-2xl font-bold text-[#1C1917] mt-1">{submittedApp.applicationId}</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Thank you, <strong>{submittedApp.companyName}</strong>. Your registration and KYC documents have been securely submitted to our compliance desk.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#B89047]" /> Next Steps:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-stone-600">
                <li>Compliance team will verify PAN, GST, and business details.</li>
                <li>You will receive an email and WhatsApp alert upon approval.</li>
                <li>Wholesale catalog and order features will activate after approval.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-primary w-full py-3.5 text-xs font-bold"
            >
              Go to Wholesale Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
