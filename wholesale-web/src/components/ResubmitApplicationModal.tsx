import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ResubmitApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail: string;
  applicationId?: string;
  rejectionReason?: string | null;
}

export const ResubmitApplicationModal = ({
  isOpen,
  onClose,
  defaultEmail,
  applicationId,
  rejectionReason,
}: ResubmitApplicationModalProps) => {
  const { resubmitApplication, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    email: defaultEmail,
    password: '',
    companyName: '',
    ownerName: '',
    phone: '',
    whatsappNumber: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
  });

  const [files, setFiles] = useState<{
    aadhaarProof?: File;
    panProof?: File;
    gstProof?: File;
  }>({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (field: 'aadhaarProof' | 'panProof' | 'gstProof') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.password) {
      setError('Please enter your account password to confirm resubmission.');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });

    if (files.aadhaarProof) formData.append('aadhaarProof', files.aadhaarProof);
    if (files.panProof) formData.append('panProof', files.panProof);
    if (files.gstProof) formData.append('gstProof', files.gstProof);

    try {
      await resubmitApplication(formData);
      setSuccess(true);
      toast.success('Application resubmitted successfully!');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Failed to resubmit application. Please check password and fields.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-stone-300 relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-200"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1C1917]">Application Resubmitted</h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              Your updated information and documents have been sent to our compliance team. You will be notified via email once approved.
            </p>
            <button type="button" onClick={onClose} className="btn-primary py-3 px-8 text-xs font-bold mt-4">
              Return to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A28]">
                Application Correction
              </span>
              <h3 className="text-xl font-bold text-[#1C1917] mt-0.5">
                Resubmit Application {applicationId ? `(${applicationId})` : ''}
              </h3>
            </div>

            {rejectionReason && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-800">Compliance Reviewer Feedback:</p>
                  <p className="text-xs text-red-700 mt-0.5">{rejectionReason}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Your Registered Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="input-field text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Confirm Account Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="input-field text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Firm / Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="Updated firm name"
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="Updated owner name"
                    value={form.ownerName}
                    onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={form.panNumber}
                    onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                    className="input-field text-xs uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27ABCDE1234F1Z5"
                    value={form.gstNumber}
                    onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
                    className="input-field text-xs uppercase font-mono"
                  />
                </div>
              </div>

              {/* Document Re-upload Dropzones */}
              <div className="pt-2 border-t border-stone-200 space-y-2.5">
                <p className="text-[11px] font-bold text-stone-700 uppercase">
                  Re-upload Corrected KYC Proofs:
                </p>

                {/* PAN Proof */}
                <div>
                  {files.panProof ? (
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-300 text-xs">
                      <span className="truncate flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#B89047]" /> {files.panProof.name}</span>
                      <button type="button" onClick={() => removeFile('panProof')} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-between p-2.5 bg-white border border-dashed border-stone-300 rounded-xl cursor-pointer text-xs text-stone-600 hover:border-amber-400">
                      <span className="flex items-center gap-2"><Upload className="w-4 h-4 text-[#B89047]" /> Upload Updated PAN Proof</span>
                      <span className="text-[10px] text-stone-400">PDF/JPG/PNG</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('panProof')} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Aadhaar Proof */}
                <div>
                  {files.aadhaarProof ? (
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-300 text-xs">
                      <span className="truncate flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#B89047]" /> {files.aadhaarProof.name}</span>
                      <button type="button" onClick={() => removeFile('aadhaarProof')} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-between p-2.5 bg-white border border-dashed border-stone-300 rounded-xl cursor-pointer text-xs text-stone-600 hover:border-amber-400">
                      <span className="flex items-center gap-2"><Upload className="w-4 h-4 text-[#B89047]" /> Upload Updated Aadhaar Proof</span>
                      <span className="text-[10px] text-stone-400">PDF/JPG/PNG</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('aadhaarProof')} className="hidden" />
                    </label>
                  )}
                </div>

                {/* GST Proof */}
                <div>
                  {files.gstProof ? (
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-300 text-xs">
                      <span className="truncate flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#B89047]" /> {files.gstProof.name}</span>
                      <button type="button" onClick={() => removeFile('gstProof')} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-between p-2.5 bg-white border border-dashed border-stone-300 rounded-xl cursor-pointer text-xs text-stone-600 hover:border-amber-400">
                      <span className="flex items-center gap-2"><Upload className="w-4 h-4 text-[#B89047]" /> Upload Updated GST Certificate</span>
                      <span className="text-[10px] text-stone-400">PDF/JPG/PNG</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('gstProof')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"
                >
                  {isLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : 'Resubmit for Review'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
