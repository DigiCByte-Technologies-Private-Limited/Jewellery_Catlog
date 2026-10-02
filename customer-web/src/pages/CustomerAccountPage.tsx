import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Sparkles,
  Calendar,
  Save,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Loader2,
  Store,
} from 'lucide-react';
import { useCustomerAuthStore } from '../store/authStore';
import {
  customerAuthApi,
  type CustomerProfileUpdatePayload,
  type MyRequestItem,
  type MyCustomDesignItem,
} from '../api/customer-auth.api';

export const CustomerAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'profile' | 'inquiries' | 'designs') || 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'inquiries' | 'designs'>(initialTab);
  const { user, customer, isAuthenticated, fetchProfile, setCustomer, logout } =
    useCustomerAuthStore();

  // Tab 1: Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Tab 2 & 3: Inquiries & Custom Designs
  const [inquiries, setInquiries] = useState<MyRequestItem[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  const [customDesigns, setCustomDesigns] = useState<MyCustomDesignItem[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);

  // Sync tab with query param
  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && ['profile', 'inquiries', 'designs'].includes(qTab)) {
      setActiveTab(qTab as any);
    }
  }, [searchParams]);

  const handleTabSwitch = (tab: 'profile' | 'inquiries' | 'designs') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Rehydrate profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Populate profile form whenever customer updates
  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || user?.fullName || '');
      setPhone(customer.phone || user?.phone || '');
      setAltPhone(customer.altPhone || '');
      setWhatsappNumber(customer.whatsappNumber || '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setState(customer.state || '');
      setPincode(customer.pincode || '');
      setDob(customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : '');
      setAnniversary(customer.anniversaryDate ? customer.anniversaryDate.slice(0, 10) : '');
    } else if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [customer, user]);

  // Load Inquiries
  useEffect(() => {
    if (activeTab === 'inquiries' && isAuthenticated) {
      setIsLoadingInquiries(true);
      customerAuthApi
        .getMyRequests()
        .then((res) => {
          setInquiries(res.data?.data || []);
        })
        .catch((err) => {
          console.error('Failed to load inquiries:', err);
        })
        .finally(() => setIsLoadingInquiries(false));
    }
  }, [activeTab, isAuthenticated]);

  // Load Custom Designs
  useEffect(() => {
    if (activeTab === 'designs' && isAuthenticated) {
      setIsLoadingDesigns(true);
      customerAuthApi
        .getMyCustomDesigns()
        .then((res) => {
          setCustomDesigns(res.data?.data || []);
        })
        .catch((err) => {
          console.error('Failed to load bespoke custom designs:', err);
        })
        .finally(() => setIsLoadingDesigns(false));
    }
  }, [activeTab, isAuthenticated]);

  // If not logged in, redirect home
  if (!isAuthenticated && !localStorage.getItem('access_token')) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[#8C6A28] mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-2">
          Patron Sign In Required
        </h2>
        <p className="text-stone-500 text-sm max-w-sm mb-6">
          Please sign in to access your Aurum Jewels patron profile, bespoke commissions, and showroom inquiries.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Return to Atelier
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsSavingProfile(true);

    try {
      const payload: CustomerProfileUpdatePayload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        altPhone: altPhone.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        dateOfBirth: dob || undefined,
        anniversaryDate: anniversary || undefined,
      };

      const res = await customerAuthApi.updateProfile(payload);
      if (res.data?.data?.customer) {
        setCustomer(res.data.data.customer);
      }
      setProfileMsg({
        type: 'success',
        text: 'Your patron profile has been updated successfully.',
      });
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col selection:bg-amber-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-600 hover:text-[#8C6A28] font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Atelier</span>
          </button>
          <div className="h-4 w-px bg-stone-300 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-serif text-lg font-bold tracking-[0.2em] text-[#1C1917] uppercase">
              AURUM
            </span>
            <span className="text-[9px] tracking-[0.3em] uppercase text-[#8C6A28] font-bold">
              PATRON PORTAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 hover:border-stone-400 text-stone-600 hover:text-rose-700 text-xs tracking-wider transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] p-6 sm:p-8 text-white shadow-xl overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#B89346] via-[#E2C37A] to-[#FFF5D6] p-0.5 shadow-md shrink-0">
                <div className="w-full h-full bg-[#1C1917] rounded-2xl flex items-center justify-center">
                  <span className="font-serif text-2xl sm:text-3xl text-amber-300 font-bold">
                    {(customer?.fullName || user?.fullName || 'P')[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Verified Patron
                  </span>
                  {customer?.tags?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-stone-800 text-stone-300 border border-stone-700 hidden sm:inline-block"
                    >
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-wide">
                  {customer?.fullName || user?.fullName || 'Aurum Patron'}
                </h1>
                <p className="text-xs text-stone-300 font-light mt-0.5 flex flex-wrap items-center gap-3">
                  <span>{customer?.email || user?.email}</span>
                  <span>•</span>
                  <span>+91 {customer?.phone || user?.phone}</span>
                  {customer?.city && (
                    <>
                      <span>•</span>
                      <span>{customer.city}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 border-t md:border-t-0 md:border-l border-stone-700/80 pt-4 md:pt-0 md:pl-8">
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-amber-300/80 font-medium">
                  Total Spend
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-amber-100">
                  ₹{Number(customer?.totalSpend || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-8 space-x-2 sm:space-x-8 overflow-x-auto pb-px">
          <button
            onClick={() => handleTabSwitch('profile')}
            className={`pb-3 text-xs sm:text-sm uppercase tracking-wider font-semibold flex items-center gap-2 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#8C6A28] text-[#8C6A28]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patron Profile &amp; Address</span>
          </button>

          <button
            onClick={() => handleTabSwitch('inquiries')}
            className={`pb-3 text-xs sm:text-sm uppercase tracking-wider font-semibold flex items-center gap-2 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'inquiries'
                ? 'border-[#8C6A28] text-[#8C6A28]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Inquiries &amp; Showroom Holds</span>
          </button>

          <button
            onClick={() => handleTabSwitch('designs')}
            className={`pb-3 text-xs sm:text-sm uppercase tracking-wider font-semibold flex items-center gap-2 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'designs'
                ? 'border-[#8C6A28] text-[#8C6A28]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>My Bespoke Custom Designs</span>
          </button>
        </div>

        {/* ══════════════ TAB 1: PROFILE DETAILS ══════════════ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Personal Information &amp; Delivery Address
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-light">
                Keep your contact details up to date for bespoke notifications, insured shipping, and VIP concierge appointments.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs flex items-start gap-2.5 shadow-xs ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={customer?.email || user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-500 cursor-not-allowed"
                    title="Account email cannot be modified directly"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    Primary Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    Alternative Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="For instant quotes"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                  Shipping &amp; Residence Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat/House, Building Name, Street / Road, Area"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Birthday (Optional for Patron Privileges)</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8C6A28]" />
                    <span>Anniversary (Optional for Atelier Surprises)</span>
                  </label>
                  <input
                    type="date"
                    value={anniversary}
                    onChange={(e) => setAnniversary(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#8C6A28] focus:bg-white text-xs text-stone-900 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-3 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-amber-100 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════ TAB 2: MY INQUIRIES ══════════════ */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">
                  Your Showroom Inquiries &amp; In-Store Holds
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Real-time status updates from our regional ateliers and dedicated sales managers.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-200 text-stone-700">
                {inquiries.length} {inquiries.length === 1 ? 'Inquiry' : 'Inquiries'}
              </span>
            </div>

            {isLoadingInquiries ? (
              <div className="py-16 text-center text-stone-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C6A28]" />
                <p className="text-xs uppercase tracking-wider">Loading inquiries...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
                <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h4 className="font-serif text-lg font-semibold text-stone-800 mb-1">
                  No Inquiries Recorded
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5">
                  Browse our curated fine jewellery collection and submit an inquiry to reserve a viewing at your nearest showroom.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Explore Collections
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-[#8C6A28]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {inq.product?.imageUrl ? (
                        <img
                          src={inq.product.imageUrl}
                          alt={inq.productName}
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 bg-stone-50 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#8C6A28] shrink-0">
                          <ShoppingBag className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-semibold text-[#8C6A28] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {inq.requestId}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-stone-900">
                          {inq.productName}
                        </h4>
                        {inq.message && (
                          <p className="text-xs text-stone-500 font-light mt-1 line-clamp-1 italic">
                            "{inq.message}"
                          </p>
                        )}
                        {inq.assignedStore && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-600">
                            <Store className="w-3.5 h-3.5 text-[#8C6A28]" />
                            <span>
                              Assigned Showroom:{' '}
                              <strong>{inq.assignedStore.storeName}</strong>
                              {inq.assignedStore.city ? ` (${inq.assignedStore.city})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                      <div className="text-left md:text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            inq.operationalStatus === 'COMPLETED' || inq.operationalStatus === 'READY'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : inq.operationalStatus === 'CONTACTED' || inq.operationalStatus === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-800 border border-stone-300'
                          }`}
                        >
                          {inq.operationalStatus.replace(/_/g, ' ')}
                        </span>
                        {inq.statusMessage && (
                          <div className="text-[11px] text-stone-500 mt-1 max-w-xs md:text-right font-light">
                            {inq.statusMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB 3: MY CUSTOM DESIGNS ══════════════ */}
        {activeTab === 'designs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">
                  Your Bespoke Commissions &amp; CAD Submissions
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Track 3D modeling, metal casting, gemstone selection, and hallmarking progress.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-200 text-stone-700">
                {customDesigns.length} {customDesigns.length === 1 ? 'Design' : 'Designs'}
              </span>
            </div>

            {isLoadingDesigns ? (
              <div className="py-16 text-center text-stone-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C6A28]" />
                <p className="text-xs uppercase tracking-wider">Loading bespoke designs...</p>
              </div>
            ) : customDesigns.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
                <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h4 className="font-serif text-lg font-semibold text-stone-800 mb-1">
                  No Bespoke Requests Yet
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5">
                  Have an heirloom idea, 3D sketch, or CAD model? Commission a master artisan to bring your vision to life.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Commission Bespoke Piece
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {customDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-[#8C6A28]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#8C6A28] shrink-0">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-semibold text-[#8C6A28] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {design.requestId}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(design.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-stone-900">
                          {design.productName}
                        </h4>
                        <p className="text-xs text-stone-600 font-light mt-1 max-w-xl">
                          {design.designDescription}
                        </p>
                        {design.attachments && design.attachments.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                              Attached Files ({design.attachments.length}):
                            </span>
                            {design.attachments.map((file) => (
                              <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#8C6A28] hover:underline bg-stone-50 px-2 py-0.5 rounded border border-stone-200"
                              >
                                <FileText className="w-3 h-3 text-[#8C6A28]" />
                                <span className="max-w-[120px] truncate">{file.originalName}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                      <div className="text-left md:text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            design.status === 'APPROVED' || design.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : design.status === 'UNDER_REVIEW' || design.status === 'ESTIMATED'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-800 border border-stone-300'
                          }`}
                        >
                          {design.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
