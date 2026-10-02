import React, { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
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
  UploadCloud,
  FileText,
  Trash2,
  Copy,
  Check,
  Compass,
  Layers,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import {
  customDesignsApi,
  type AttachmentFileItem,
  type CreateCustomDesignPayload,
} from '../api/custom-designs.api';
import { useCustomerAuthStore } from '../store/authStore';

interface CustomDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialModelName?: string;
  onOpenTrack?: () => void;
}

export const CustomDesignModal: React.FC<CustomDesignModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  initialModelName,
  onOpenTrack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, customer, isAuthenticated } = useCustomerAuthStore();

  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    email: '',
    phone: '',
    productName: initialModelName || initialCategory || 'Bespoke Custom Jewelry',
    preferredContactMethod: 'EMAIL' as 'EMAIL' | 'PHONE' | 'WHATSAPP',
    quantity: '1',
    metalChoice: '18K Yellow Gold',
    gemChoice: 'Natural Diamond',
    dimensions: '',
    designDescription: '',
    designRequirements: '',
    additionalNotes: '',
  });

  React.useEffect(() => {
    if (isOpen && isAuthenticated) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || customer?.fullName || user?.fullName || '',
        email: prev.email || customer?.email || user?.email || '',
        phone: prev.phone || customer?.phone || user?.phone || '',
      }));
    }
  }, [isOpen, isAuthenticated, customer, user]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<AttachmentFileItem[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [submittedData, setSubmittedData] = useState<{
    requestId: string;
    customerName: string;
    productName: string;
  } | null>(null);

  if (!isOpen) return null;

  // File selection validation
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg(null);

    // Validate total count
    if (selectedFiles.length + files.length > 5) {
      setErrorMsg('You can upload a maximum of 5 reference or CAD files.');
      return;
    }

    // Validate size & extension
    const allowedExts = [
      'jpg', 'jpeg', 'png', 'webp', 'pdf', 'obj', 'stl', 'step', 'stp', 'cad', 'dwg', 'dxf', 'zip',
    ];

    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(ext)) {
        setErrorMsg(`Unsupported file type ".${ext}". Allowed: JPG, PNG, WEBP, PDF, CAD/3D (OBJ, STL, STEP, DWG, DXF, ZIP).`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setErrorMsg(`File "${f.name}" exceeds the 25MB maximum size limit.`);
        return;
      }
    }

    // Immediately upload to backend storage
    setIsUploadingFiles(true);
    try {
      const uploadFormData = new FormData();
      files.forEach((f) => uploadFormData.append('files', f));

      const res = await customDesignsApi.uploadFiles(uploadFormData);
      if (res.data?.data) {
        setUploadedAttachments((prev) => [...prev, ...res.data.data]);
        setSelectedFiles((prev) => [...prev, ...files]);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload attachments. Please check connection and try again.');
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!formData.customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setErrorMsg('Please provide a valid phone or WhatsApp number.');
      return;
    }
    if (!formData.designDescription.trim()) {
      setErrorMsg('Please describe your custom design requirements.');
      return;
    }

    setIsSubmitting(true);

    try {
      const materialSummary = [formData.metalChoice, formData.gemChoice ? `Gems: ${formData.gemChoice}` : null]
        .filter(Boolean)
        .join(', ');

      const payload: CreateCustomDesignPayload = {
        customerName: formData.customerName.trim(),
        companyName: formData.companyName.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        productName: formData.productName.trim() || 'Bespoke Custom Jewelry',
        designDescription: formData.designDescription.trim(),
        designRequirements: formData.designRequirements.trim() || undefined,
        quantity: formData.quantity.trim() || '1 unit',
        materialRequirements: materialSummary || undefined,
        dimensions: formData.dimensions.trim() || undefined,
        additionalNotes: formData.additionalNotes.trim() || undefined,
        preferredContactMethod: formData.preferredContactMethod,
        attachments: uploadedAttachments,
      };

      const res = await customDesignsApi.create(payload);

      setSubmittedData({
        requestId: res.data.data.requestId,
        customerName: res.data.data.customerName,
        productName: res.data.data.productName,
      });
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
        "We couldn't submit your request right now. Please try again or contact our concierge directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRequestId = () => {
    if (!submittedData) return;
    navigator.clipboard.writeText(submittedData.requestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#FCFAF7] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Gold Ambient Banner */}
        <div className="w-full h-1.5 bg-gradient-to-r from-[#8C6A28] via-[#E2C37A] to-[#8C6A28]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-stone-200/70 bg-gradient-to-b from-[#F7F4EE] to-[#FCFAF7]">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/80 text-[#8C6A28] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">
                <Sparkles className="w-3 h-3 text-[#B89047]" />
                <span>HAUTE JOAILLERIE &bull; ATELIER</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917] tracking-tight">
                Request Custom Design
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg">
                Submit your unique concept, CAD model, or reference sketch. Our master karigars and design atelier will evaluate feasibility and reach out with a 3D blueprint &amp; quotation.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body or Success Confirmation */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {submittedData ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="py-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 p-[2px] mx-auto mb-4 shadow-lg">
                <div className="w-full h-full bg-[#FAF8F5] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#8C6A28]" />
                </div>
              </div>

              <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                Request Submitted Successfully
              </h3>

              <p className="text-sm text-stone-600 max-w-md mx-auto mb-6 leading-relaxed">
                Your custom design request has been saved in our atelier database and an alert has been dispatched to our chief designer and Admin team.
              </p>

              {/* Reference ID Card */}
              <div className="bg-gradient-to-br from-amber-50 to-stone-100 border border-amber-300/80 rounded-xl p-5 max-w-md mx-auto mb-6 text-left shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A28]">
                  YOUR UNIQUE REQUEST ID
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-2xl font-bold text-stone-900 tracking-wide">
                    {submittedData.requestId}
                  </span>
                  <button
                    onClick={handleCopyRequestId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
                    title="Copy Request ID"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs text-stone-600 flex flex-col gap-1">
                  <div><strong>Customer:</strong> {submittedData.customerName}</div>
                  <div><strong>Design:</strong> {submittedData.productName}</div>
                  <div className="text-[#8C6A28] font-medium mt-1">
                    ✓ Admin notification email and WhatsApp dispatched
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {onOpenTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTrack();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-amber-600/40 text-[#8C6A28] hover:bg-amber-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#B89047]" />
                    <span>Track Request Status</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#1C1917] hover:bg-stone-800 text-amber-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* SECTION 1: Customer Contact Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C6A28] mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#B89047]" />
                  <span>1. Customer &amp; Contact Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Company / Organization (Optional)
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="e.g. ABC Luxury Ltd"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        required
                        placeholder="customer@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Phone / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                    Preferred Contact Channel
                  </label>
                  <div className="flex gap-2">
                    {(['EMAIL', 'PHONE', 'WHATSAPP'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredContactMethod: method })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          formData.preferredContactMethod === method
                            ? 'bg-[#1C1917] text-amber-200 border-[#1C1917]'
                            : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {method === 'EMAIL' && '✉️ Email'}
                        {method === 'PHONE' && '📞 Phone Call'}
                        {method === 'WHATSAPP' && '💬 WhatsApp'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Design Specifications & Materials */}
              <div className="pt-2 border-t border-stone-200/70">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C6A28] mb-3 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-[#B89047]" />
                  <span>2. Jewelry Piece &amp; Material Specifications</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Product Category / Concept <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Solitaire Engagement Ring / Kundan Choker"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Quantity Required
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 unit, 500 pcs (for wholesale)"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Precious Metal &amp; Purity
                    </label>
                    <select
                      value={formData.metalChoice}
                      onChange={(e) => setFormData({ ...formData, metalChoice: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    >
                      <option value="18K Yellow Gold">18K Yellow Gold</option>
                      <option value="22K Yellow Gold">22K Yellow Gold</option>
                      <option value="18K Rose Gold">18K Rose Gold</option>
                      <option value="18K White Gold">18K White Gold</option>
                      <option value="950 Platinum">950 Platinum</option>
                      <option value="925 Sterling Silver">925 Sterling Silver</option>
                      <option value="Two-Tone Alloy">Two-Tone (Yellow &amp; White Gold)</option>
                      <option value="Other / Undecided">Other / To Discuss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Diamond or Gemstone Choice
                    </label>
                    <select
                      value={formData.gemChoice}
                      onChange={(e) => setFormData({ ...formData, gemChoice: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    >
                      <option value="Natural Diamond (GIA/IGI)">Natural Diamond (GIA / IGI)</option>
                      <option value="Lab-Grown Diamond">Lab-Grown Diamond</option>
                      <option value="Polki / Uncut Kundan">Polki / Uncut Kundan</option>
                      <option value="Colombian Emerald">Emerald</option>
                      <option value="Burmese Ruby">Ruby</option>
                      <option value="Ceylon Blue Sapphire">Blue Sapphire</option>
                      <option value="South Sea Pearl">South Sea Pearl</option>
                      <option value="No Gems (Solid Metal)">No Gems (Solid Metal)</option>
                      <option value="Customer-Provided Gems">I have my own gems</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Dimensions / Ring Size / Specifications
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ring Size 7 US (17.3 mm), 18-inch necklace, 2.4 bangles size"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Detailed Description & Technical Requirements */}
              <div className="pt-2 border-t border-stone-200/70">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C6A28] mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#B89047]" />
                  <span>3. Design Vision &amp; Requirements</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Custom Design Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the aesthetic, motifs, styling, engraving, or specific design elements you envision..."
                      value={formData.designDescription}
                      onChange={(e) => setFormData({ ...formData, designDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Specific Technical Requirements (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hollow back for lightweight wear, 6-prong lotus basket, micro-pave shank..."
                      value={formData.designRequirements}
                      onChange={(e) => setFormData({ ...formData, designRequirements: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Additional Notes / Target Budget / Occasion Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wedding on 15th December, preferred target budget INR 2.5 Lakhs"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/40 focus:border-[#8C6A28]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Reference Images & CAD File Upload */}
              <div className="pt-2 border-t border-stone-200/70">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C6A28] flex items-center gap-2">
                    <UploadCloud className="w-3.5 h-3.5 text-[#B89047]" />
                    <span>4. Upload Reference Sketches &amp; CAD Files</span>
                  </h3>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Up to 5 files (Max 25MB each)
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-300/80 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/70 rounded-xl p-5 text-center transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.obj,.stl,.step,.stp,.cad,.dwg,.dxf,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    {isUploadingFiles ? (
                      <Loader2 className="w-7 h-7 text-[#8C6A28] animate-spin mb-2" />
                    ) : (
                      <UploadCloud className="w-7 h-7 text-[#B89047] mb-2" />
                    )}
                    <span className="text-xs font-semibold text-stone-800">
                      {isUploadingFiles ? 'Uploading & Encrypting Attachments...' : 'Click or Drag & Drop reference files here'}
                    </span>
                    <span className="text-[11px] text-stone-500 mt-1">
                      Supports JPG, PNG, PDF, CAD &amp; 3D files (OBJ, STL, DWG, DXF, STEP, ZIP)
                    </span>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedAttachments.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-stone-100/80 border border-stone-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-[#8C6A28] shrink-0" />
                          <span className="font-medium text-stone-800 truncate">
                            {att.originalName}
                          </span>
                          <span className="text-stone-400 text-[10px]">
                            ({(att.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Your files are encrypted and only accessible to authorized atelier managers.</span>
                </div>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="pt-4 border-t border-stone-200/80 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isUploadingFiles}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingFiles}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] hover:from-[#292524] hover:to-[#1C1917] text-amber-100 font-semibold text-xs tracking-wider uppercase shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                      <span>Saving Request &amp; Alerting Admin...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#E2C37A]" />
                      <span>Submit Custom Design Request</span>
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
