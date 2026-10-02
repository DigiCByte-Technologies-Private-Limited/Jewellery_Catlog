import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud, X, Image, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { uploadImages, createSubmission, type CreateSubmissionDto, type UploadedFileResult } from '../api/wholesale.api';
import { useAuthStore } from '../store/authStore';

interface UploadedFile {
  file: File;
  preview: string;
  uploadResult?: UploadedFileResult;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
}

const CATEGORIES = [
  'Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Bangles',
  'Pendants', 'Chains', 'Anklets', 'Brooches', 'Sets', 'Other',
];

export const SubmitProposalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const navState = (location.state as any) || {};

  const [form, setForm] = useState({
    customerName: user?.fullName || '',
    companyName: user?.partner?.companyName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    productName: navState.prefillName || '',
    productCategory: navState.prefillCategory || '',
    productSubcategory: '',
    brandOrManufacturer: user?.partner?.companyName || '',
    productDescription: '',
    wholesaleQuantity: '',
    colorOrVariant: '',
    additionalNotes: navState.prefillSku ? `Catalog Reference SKU: ${navState.prefillSku}` : '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || '',
        companyName: prev.companyName || user.partner?.companyName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        brandOrManufacturer: prev.brandOrManufacturer || user.partner?.companyName || '',
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState<Partial<typeof form & { images: string }>>({});

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  /* ──────── Dropzone ──────── */
  const onDrop = useCallback(async (accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      uploaded: false,
      uploading: true,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    try {
      const res = await uploadImages(accepted);
      setUploadedFiles((prev) => {
        let dataIdx = 0;
        return prev.map((uf) => {
          if (!uf.uploading || uf.uploaded) return uf;
          const match = res.data[dataIdx];
          if (match) { dataIdx++; return { ...uf, uploadResult: match, uploaded: true, uploading: false }; }
          return { ...uf, uploading: false, error: 'No result' };
        });
      });
      toast.success(`${accepted.length} image(s) uploaded`);
    } catch {
      setUploadedFiles((prev) =>
        prev.map((uf) =>
          !uf.uploaded ? { ...uf, uploading: false, error: 'Upload failed' } : uf
        )
      );
      toast.error('Image upload failed. Please try again.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  /* ──────── Validation ──────── */
  const validate = () => {
    const e: typeof errors = {};
    if (!form.customerName.trim()) e.customerName = 'Contact person name is required';
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.productName.trim()) e.productName = 'Product name is required';
    if (!form.productCategory) e.productCategory = 'Category is required';
    const validUploads = uploadedFiles.filter((f) => f.uploaded && f.uploadResult);
    if (validUploads.length === 0) e.images = 'At least 1 product image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ──────── Submit ──────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const images = uploadedFiles
      .filter((f) => f.uploaded && f.uploadResult)
      .map((f) => f.uploadResult!);

    const dto: CreateSubmissionDto = {
      customerName: form.customerName,
      companyName: form.companyName,
      email: form.email,
      phone: form.phone,
      productName: form.productName,
      productCategory: form.productCategory || undefined,
      productSubcategory: form.productSubcategory || undefined,
      brandOrManufacturer: form.brandOrManufacturer || undefined,
      productDescription: form.productDescription || undefined,
      wholesaleQuantity: form.wholesaleQuantity || undefined,
      colorOrVariant: form.colorOrVariant || undefined,
      additionalNotes: form.additionalNotes || undefined,
      images,
    };

    setSubmitting(true);
    try {
      const result = await createSubmission(dto);
      toast.success(`Proposal submitted! ID: ${result.submissionId}`);
      navigate('/my-submissions', { state: { email: form.email, newId: result.submissionId } });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const ErrorMsg = ({ field }: { field: keyof typeof errors }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {errors[field]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen py-12 px-4 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold text-[#1C1917] mb-2">Submit a Product Proposal</h1>
          <p className="text-stone-500">Fill in your company details and product information. Upload images to be reviewed by our team.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Partner Profile ── */}
          <div className="card p-6 sm:p-8">
            <h2 className="font-semibold text-[#1C1917] text-lg mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] text-xs font-bold flex items-center justify-center">1</span>
              Partner Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Contact Person *</label>
                <input className="input-field" placeholder="Your full name" value={form.customerName} onChange={set('customerName')} />
                <ErrorMsg field="customerName" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Company Name *</label>
                <input className="input-field" placeholder="e.g. Apex Diamonds Wholesale Ltd" value={form.companyName} onChange={set('companyName')} />
                <ErrorMsg field="companyName" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input className="input-field" type="email" placeholder="partner@company.com" value={form.email} onChange={set('email')} />
                <ErrorMsg field="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                <ErrorMsg field="phone" />
              </div>
            </div>
          </div>

          {/* ── Product Details ── */}
          <div className="card p-6 sm:p-8">
            <h2 className="font-semibold text-[#1C1917] text-lg mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] text-xs font-bold flex items-center justify-center">2</span>
              Product Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input className="input-field" placeholder="e.g. 22K Gold Peacock Necklace" value={form.productName} onChange={set('productName')} />
                <ErrorMsg field="productName" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Category *</label>
                <select className="input-field" value={form.productCategory} onChange={set('productCategory')}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ErrorMsg field="productCategory" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Subcategory</label>
                <input className="input-field" placeholder="e.g. Bridal, Casual, Temple" value={form.productSubcategory} onChange={set('productSubcategory')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Brand / Manufacturer</label>
                <input className="input-field" placeholder="e.g. Apex Diamonds" value={form.brandOrManufacturer} onChange={set('brandOrManufacturer')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Color / Variant</label>
                <input className="input-field" placeholder="e.g. Yellow Gold, Rose Gold" value={form.colorOrVariant} onChange={set('colorOrVariant')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Wholesale Quantity Available</label>
                <input className="input-field" type="number" min="1" placeholder="e.g. 500" value={form.wholesaleQuantity} onChange={set('wholesaleQuantity')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Product Description</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Materials, purity, weight, dimensions, special features..." value={form.productDescription} onChange={set('productDescription')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Additional Notes</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Any other info for our merchandising team..." value={form.additionalNotes} onChange={set('additionalNotes')} />
              </div>
            </div>
          </div>

          {/* ── Image Upload ── */}
          <div className="card p-6 sm:p-8">
            <h2 className="font-semibold text-[#1C1917] text-lg mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] text-xs font-bold flex items-center justify-center">3</span>
              Product Images *
            </h2>
            <p className="text-xs text-stone-400 mb-5">Upload up to 10 images (JPG, PNG, WebP · max 10 MB each). High-resolution images improve approval chances.</p>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-[#B89047] bg-amber-50' : 'border-stone-200 hover:border-[#B89047] hover:bg-amber-50/50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-[#B89047]' : 'text-stone-300'}`} />
              <p className="font-semibold text-stone-600 mb-1">{isDragActive ? 'Drop images here' : 'Drag & drop images here'}</p>
              <p className="text-xs text-stone-400">or <span className="text-[#8C6A28] font-medium">click to browse</span> from your device</p>
            </div>

            {errors.images && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.images}</p>
            )}

            {/* Preview Grid */}
            {uploadedFiles.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {uploadedFiles.map((uf, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square bg-stone-50">
                    <img src={uf.preview} alt="" className="w-full h-full object-cover" />
                    {/* Overlay states */}
                    {uf.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {uf.uploaded && (
                      <div className="absolute top-1.5 left-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow" />
                      </div>
                    )}
                    {uf.error && (
                      <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-300" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add more placeholder */}
                <div
                  {...getRootProps()}
                  className="rounded-xl border-2 border-dashed border-stone-200 aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#B89047] hover:bg-amber-50/50 transition"
                >
                  <input {...getInputProps()} />
                  <Image className="w-5 h-5 text-stone-300 mb-1" />
                  <span className="text-[10px] text-stone-400">Add more</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={submitting || uploadedFiles.some((f) => f.uploading)}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Proposal...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Submit Proposal</>
            )}
          </button>
          <p className="text-center text-xs text-stone-400">By submitting, you agree that Aurum Jewels may review and use your images for catalog evaluation purposes.</p>
        </form>
      </div>
    </div>
  );
};
