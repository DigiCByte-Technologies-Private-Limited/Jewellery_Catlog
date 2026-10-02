import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2,
  Save,
  Building2,
  Mail,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Clock,
  AlertTriangle,
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

export const ProfilePage = () => {
  const { user, updateProfile, changePassword, fetchProfile } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'kyc' | 'security'>('profile');
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [profile, setProfile] = useState({
    companyName: '',
    ownerName: '',
    phone: '',
    whatsappNumber: '',
    gstNumber: '',
    businessType: '',
    city: '',
    state: '',
    address: '',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.partner) {
      setProfile({
        companyName: user.partner.companyName || '',
        ownerName: user.partner.ownerName || user.fullName || '',
        phone: user.partner.phone || user.phone || '',
        whatsappNumber: user.partner.whatsappNumber || '',
        gstNumber: user.partner.gstNumber || '',
        businessType: user.partner.businessType || 'Wholesaler',
        city: user.partner.city || '',
        state: user.partner.state || '',
        address: user.partner.addressLine || user.partner.address || '',
      });
    }
  }, [user]);

  const setP = (f: keyof typeof profile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setProfile((p) => ({ ...p, [f]: e.target.value }));

  const setS = (f: keyof typeof security) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSecurity((s) => ({ ...s, [f]: e.target.value }));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      await fetchProfile();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (security.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await changePassword(security.currentPassword, security.newPassword);
      toast.success('Password changed successfully! Please log in again.');
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-[#8C6A28] font-bold">Wholesale Account</span>
          <h1 className="font-serif text-3xl font-bold text-[#1C1917] mt-0.5 mb-1">Partner Profile & KYC</h1>
          <p className="text-stone-500 text-xs">
            Manage your firm details, verification documents, and security settings.
          </p>
        </div>

        {/* Profile Summary Card */}
        <div className="card p-6 mb-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B89047] to-[#8C6A28] flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
            {user?.partner?.companyName?.charAt(0)?.toUpperCase() || user?.fullName?.charAt(0)?.toUpperCase() || 'W'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-[#1C1917]">{user?.partner?.companyName || user?.fullName}</h2>
              {user?.partner?.status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved Partner
                </span>
              )}
              {user?.partner?.status === 'PENDING_REVIEW' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Pending Review
                </span>
              )}
              {user?.partner?.status === 'UNDER_REVIEW' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <Clock className="w-3.5 h-3.5" /> Under Verification
                </span>
              )}
              {user?.partner?.status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5" /> Requires Revision
                </span>
              )}
            </div>
            <p className="text-stone-500 text-xs flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-[#B89047]" />
              Proprietor: <strong>{user?.partner?.ownerName || user?.fullName}</strong>
              {user?.partner?.applicationId && (
                <span className="ml-2 px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md font-mono text-[10px]">
                  {user.partner.applicationId}
                </span>
              )}
            </p>
            <p className="text-stone-400 text-xs flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> {user?.email}
              &nbsp;·&nbsp;
              <Phone className="w-3 h-3" /> {user?.partner?.phone || user?.phone || 'Not set'}
              {user?.partner?.whatsappNumber && ` (WA: ${user.partner.whatsappNumber})`}
            </p>
          </div>
          <div className="text-[11px] text-stone-400">
            Registered: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl mb-6">
          {(['profile', 'kyc', 'security'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                tab === t ? 'bg-white text-[#1C1917] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t === 'profile' && '🏢 Firm Profile'}
              {t === 'kyc' && '🛡️ Business KYC & Proofs'}
              {t === 'security' && '🔒 Security'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="card p-6 sm:p-8 space-y-5">
            <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#B89047]" /> Firm & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Firm / Business Name *
                </label>
                <input
                  className="input-field"
                  value={profile.companyName}
                  onChange={setP('companyName')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Owner Full Name *
                </label>
                <input
                  className="input-field"
                  value={profile.ownerName}
                  onChange={setP('ownerName')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Business Type
                </label>
                <select className="input-field" value={profile.businessType} onChange={setP('businessType')}>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Primary Mobile Phone *
                </label>
                <input className="input-field" value={profile.phone} onChange={setP('phone')} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  WhatsApp Number
                </label>
                <input className="input-field" value={profile.whatsappNumber} onChange={setP('whatsappNumber')} />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">City</label>
                <input className="input-field" value={profile.city} onChange={setP('city')} />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">State</label>
                <select className="input-field" value={profile.state} onChange={setP('state')}>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Business Address
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  value={profile.address}
                  onChange={setP('address')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <span className="text-xs text-stone-400">Account login email: {user?.email}</span>
              <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* KYC Tab */}
        {tab === 'kyc' && (
          <div className="card p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B89047]" /> Verified Identification Details
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Sensitive KYC numbers are masked for security. Documents are stored in an encrypted vault.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* PAN */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  PAN Number
                </span>
                <span className="font-mono text-sm font-bold text-stone-800">
                  {user?.partner?.panNumberMasked || user?.partner?.panNumber || 'Not provided'}
                </span>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified on File
                </div>
              </div>

              {/* Aadhaar */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Aadhaar Number
                </span>
                <span className="font-mono text-sm font-bold text-stone-800">
                  {user?.partner?.aadhaarNumberMasked || 'XXXX XXXX ****'}
                </span>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                  <FileCheck className="w-3.5 h-3.5" /> Identity Proof
                </div>
              </div>

              {/* GSTIN */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  GSTIN
                </span>
                <span className="font-mono text-sm font-bold text-stone-800">
                  {user?.partner?.gstNumber || 'Not provided'}
                </span>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tax Registered
                </div>
              </div>
            </div>

            {/* Submitted Documents List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Submitted Verification Documents
              </h4>
              {user?.partner?.documents && user.partner.documents.length > 0 ? (
                <div className="space-y-2.5">
                  {user.partner.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-4 h-4 text-[#B89047]" />
                        <div>
                          <p className="text-xs font-bold text-stone-800">{doc.documentType} Document</p>
                          <p className="text-[11px] text-stone-400">{doc.originalFilename}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          doc.status === 'VERIFIED'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : doc.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Document records verified by compliance desk.</p>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <form onSubmit={handleChangePassword} className="card p-6 sm:p-8 space-y-5">
            <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#B89047]" /> Change Account Password
            </h3>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter current password"
                  value={security.currentPassword}
                  onChange={setS('currentPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Min 8 characters"
                value={security.newPassword}
                onChange={setS('newPassword')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Repeat new password"
                value={security.confirmPassword}
                onChange={setS('confirmPassword')}
                required
              />
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-400">All sessions will require re-login.</span>
              <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Change Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
