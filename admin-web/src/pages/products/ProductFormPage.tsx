import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Plus,
  Star,
} from 'lucide-react';

interface MediaItem {
  id: string;
  originalUrl: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  altText?: string;
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic
    name: '',
    sku: '',
    shortDescription: '',
    longDescription: '',
    categoryId: '',
    status: 'DRAFT',
    audience: 'WOMEN',
    occasion: 'DAILY_WEAR',

    // Step 2: Metal & Weights
    metalType: 'GOLD',
    purity: 'K22',
    metalColor: 'YELLOW',
    metalFinish: 'POLISHED',
    grossWeight: '',
    hasStones: false,
    stoneWeight: '0',
    lacWeight: '0',

    // Step 3: Pricing
    pricingMode: 'DYNAMIC',
    fixedPrice: '',
    wastagePercent: '8',
    makingChargeType: 'PER_GRAM',
    makingChargeValue: '450',
    majuriType: 'FLAT',
    majuriValue: '0',
    serviceCharges: '45',

    // Step 4: SEO
    metaTitle: '',
    metaDescription: '',
    slug: '',
  });

  // Live Price Preview State
  const [previewPrice, setPreviewPrice] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: async () => {
      const res = await categoriesApi.getFlat({ limit: 100 });
      return res.data?.data || [];
    },
  });

  // Fetch product for edit mode
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await productsApi.getOne(id!);
      return res.data?.data;
    },
    enabled: isEdit,
  });

  // Prepopulate form when existingProduct loads
  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name || '',
        sku: existingProduct.sku || '',
        shortDescription: existingProduct.shortDescription || '',
        longDescription: existingProduct.longDescription || '',
        categoryId: existingProduct.categoryId || '',
        status: existingProduct.status || 'DRAFT',
        audience: existingProduct.audience || 'WOMEN',
        occasion: existingProduct.occasion || 'DAILY_WEAR',

        metalType: existingProduct.metalType || 'GOLD',
        purity: existingProduct.purity || 'K22',
        metalColor: existingProduct.metalColor || 'YELLOW',
        metalFinish: existingProduct.metalFinish || 'POLISHED',
        grossWeight: existingProduct.grossWeight !== undefined && existingProduct.grossWeight !== null ? String(existingProduct.grossWeight) : '',
        hasStones: Boolean(existingProduct.hasStones),
        stoneWeight: existingProduct.stoneWeight !== undefined && existingProduct.stoneWeight !== null ? String(existingProduct.stoneWeight) : '0',
        lacWeight: existingProduct.lacWeight !== undefined && existingProduct.lacWeight !== null ? String(existingProduct.lacWeight) : '0',

        pricingMode: existingProduct.pricingMode || 'DYNAMIC',
        fixedPrice: existingProduct.fixedPrice !== undefined && existingProduct.fixedPrice !== null ? String(existingProduct.fixedPrice) : '',
        wastagePercent: existingProduct.wastagePercent !== undefined && existingProduct.wastagePercent !== null ? String(existingProduct.wastagePercent) : '8',
        makingChargeType: existingProduct.makingChargeType || 'PER_GRAM',
        makingChargeValue: existingProduct.makingChargeValue !== undefined && existingProduct.makingChargeValue !== null ? String(existingProduct.makingChargeValue) : '450',
        majuriType: existingProduct.majuriType || 'FLAT',
        majuriValue: existingProduct.majuriValue !== undefined && existingProduct.majuriValue !== null ? String(existingProduct.majuriValue) : '0',
        serviceCharges: existingProduct.serviceCharges !== undefined && existingProduct.serviceCharges !== null ? String(existingProduct.serviceCharges) : '45',

        metaTitle: existingProduct.metaTitle || '',
        metaDescription: existingProduct.metaDescription || '',
        slug: existingProduct.slug || '',
      });

      if (existingProduct.media && Array.isArray(existingProduct.media)) {
        setMediaList(
          existingProduct.media.map((m: any, idx: number) => ({
            id: m.id || `media-${idx}`,
            originalUrl: m.originalUrl || m.url,
            thumbnailUrl: m.thumbnailUrl || m.originalUrl || m.url,
            isPrimary: Boolean(m.isPrimary ?? idx === 0),
            altText: m.altText || '',
          }))
        );
      }
    }
  }, [existingProduct]);

  // Calculate net metal weight locally
  const gross = parseFloat(formData.grossWeight) || 0;
  const stone = formData.hasStones ? parseFloat(formData.stoneWeight) || 0 : 0;
  const lac = parseFloat(formData.lacWeight) || 0;
  const netMetalWeight = Math.max(0, gross - stone - lac).toFixed(3);

  // Recalculate price preview whenever pricing or weights change
  useEffect(() => {
    if (!formData.grossWeight || Number(formData.grossWeight) <= 0) {
      setPreviewPrice(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const payload = {
          pricingMode: formData.pricingMode,
          fixedPrice: formData.fixedPrice ? Number(formData.fixedPrice) : undefined,
          grossWeight: Number(formData.grossWeight),
          stoneWeight: formData.hasStones ? Number(formData.stoneWeight || 0) : 0,
          lacWeight: Number(formData.lacWeight || 0),
          metalType: formData.metalType,
          purity: formData.purity,
          wastagePercent: Number(formData.wastagePercent || 0),
          makingChargeType: formData.makingChargeType,
          makingChargeValue: Number(formData.makingChargeValue || 0),
          majuriType: formData.majuriType,
          majuriValue: Number(formData.majuriValue || 0),
          serviceCharges: Number(formData.serviceCharges || 0),
          gstRatePercent: 3,
        };
        const res = await productsApi.calculatePrice(payload);
        setPreviewPrice(res.data?.data);
      } catch (err) {
        // quiet error on preview
      } finally {
        setIsCalculating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    formData.grossWeight,
    formData.stoneWeight,
    formData.lacWeight,
    formData.hasStones,
    formData.pricingMode,
    formData.fixedPrice,
    formData.wastagePercent,
    formData.makingChargeType,
    formData.makingChargeValue,
    formData.majuriType,
    formData.majuriValue,
    formData.serviceCharges,
    formData.metalType,
    formData.purity,
  ]);

  // Media Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setMediaList((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            originalUrl: url,
            thumbnailUrl: url,
            isPrimary: prev.length === 0,
            altText: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    toast({ type: 'success', title: 'Image Added', message: `${files.length} file(s) staged for catalog` });
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    setMediaList((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        originalUrl: urlInput.trim(),
        thumbnailUrl: urlInput.trim(),
        isPrimary: prev.length === 0,
        altText: formData.name || 'Jewellery image',
      },
    ]);
    setUrlInput('');
    toast({ type: 'success', title: 'Image Staged', message: 'Asset URL added to product gallery' });
  };

  const handleSetPrimary = (index: number) => {
    setMediaList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        isPrimary: idx === index,
      }))
    );
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length > 0 && !updated.some((item) => item.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  // Submit Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ type: 'success', title: 'Product Created', message: 'Product successfully added to catalog' });
      navigate(`/products/${res.data?.data?.id || ''}`);
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || 'Failed to save product' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => productsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({ type: 'success', title: 'Product Updated', message: 'Product specifications updated successfully' });
      navigate(`/products/${id}`);
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Update Failed', message: err.response?.data?.message || 'Failed to update product' });
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ type: 'warning', title: 'Validation', message: 'Product name is required' });
      setStep(1);
      return;
    }
    if (!formData.grossWeight || Number(formData.grossWeight) <= 0) {
      toast({ type: 'warning', title: 'Validation', message: 'Valid gross weight is required' });
      setStep(2);
      return;
    }

    const payload = {
      ...formData,
      grossWeight: Number(formData.grossWeight),
      stoneWeight: formData.hasStones ? Number(formData.stoneWeight || 0) : 0,
      lacWeight: Number(formData.lacWeight || 0),
      wastagePercent: formData.wastagePercent ? Number(formData.wastagePercent) : undefined,
      makingChargeValue: formData.makingChargeValue ? Number(formData.makingChargeValue) : undefined,
      majuriValue: formData.majuriValue ? Number(formData.majuriValue) : undefined,
      serviceCharges: formData.serviceCharges ? Number(formData.serviceCharges) : 0,
      fixedPrice: formData.fixedPrice ? Number(formData.fixedPrice) : undefined,
      categoryId: formData.categoryId || undefined,
      media: mediaList.map((m, idx) => ({
        originalUrl: m.originalUrl,
        thumbnailUrl: m.thumbnailUrl || m.originalUrl,
        isPrimary: Boolean(m.isPrimary),
        sortOrder: idx,
        altText: m.altText || formData.name,
      })),
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const steps = [
    'Basic Information',
    'Metal & Weights',
    'Pricing Rules',
    'Media Gallery',
    'SEO & Metadata',
    'Review & Publish',
  ];

  if (isEdit && isLoadingProduct) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium">Loading product specifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? `Edit Jewellery Product: ${existingProduct?.name || ''}` : 'Add New Jewellery Product'}
            </h1>
            <p className="text-xs text-slate-500">Step {step} of 6: {steps[step - 1]}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>
          Cancel
        </Button>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-6 gap-2">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`p-2 rounded text-center cursor-pointer transition-colors ${
              step === i + 1
                ? 'bg-amber-600 text-white font-semibold'
                : step > i + 1
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-400'
            }`}
            onClick={() => setStep(i + 1)}
          >
            <div className="text-xs font-mono">{i + 1}. {label.split(' ')[0]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step {step}: {steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Step 1: Basic */}
              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Product Title *"
                    placeholder="e.g. 22K Traditional Antique Gold Choker"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      }));
                    }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="SKU / Design Code (Auto-generated if blank)"
                      placeholder="e.g. GN-ANT-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                    <Select
                      label="Category"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      options={[
                        { label: '-- Select Category --', value: '' },
                        ...(categories?.map((c: any) => ({ label: c.name, value: c.id })) || []),
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Select
                      label="Audience"
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                      options={[
                        { label: 'Women', value: 'WOMEN' },
                        { label: 'Men', value: 'MEN' },
                        { label: 'Kids', value: 'KIDS' },
                        { label: 'Unisex', value: 'UNISEX' },
                      ]}
                    />
                    <Select
                      label="Occasion"
                      value={formData.occasion}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      options={[
                        { label: 'Daily Wear', value: 'DAILY_WEAR' },
                        { label: 'Bridal', value: 'BRIDAL' },
                        { label: 'Festive', value: 'FESTIVE' },
                        { label: 'Office', value: 'OFFICE' },
                        { label: 'Temple', value: 'TEMPLE' },
                        { label: 'Gift', value: 'GIFT' },
                      ]}
                    />
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      options={[
                        { label: 'Draft', value: 'DRAFT' },
                        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
                        { label: 'Published', value: 'PUBLISHED' },
                      ]}
                    />
                  </div>
                  <Input
                    label="Short Description"
                    placeholder="Brief description for catalog listing cards..."
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  />
                </div>
              )}

              {/* Step 2: Metal & Weights */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Metal Type"
                      value={formData.metalType}
                      onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                      options={[
                        { label: 'Gold', value: 'GOLD' },
                        { label: 'Silver', value: 'SILVER' },
                        { label: 'Platinum', value: 'PLATINUM' },
                      ]}
                    />
                    <Select
                      label="Purity"
                      value={formData.purity}
                      onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                      options={
                        formData.metalType === 'GOLD'
                          ? [
                              { label: '24K (99.9%)', value: 'K24' },
                              { label: '22K (91.6% Hallmark)', value: 'K22' },
                              { label: '18K (75.0%)', value: 'K18' },
                              { label: '14K (58.3%)', value: 'K14' },
                            ]
                          : formData.metalType === 'SILVER'
                          ? [
                              { label: '999 Fine Silver', value: 'SILVER_999' },
                              { label: '925 Sterling', value: 'SILVER_925' },
                            ]
                          : [{ label: '950 Platinum', value: 'PLATINUM_950' }]
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Metal Color"
                      value={formData.metalColor}
                      onChange={(e) => setFormData({ ...formData, metalColor: e.target.value })}
                      options={[
                        { label: 'Yellow Gold', value: 'YELLOW' },
                        { label: 'Rose Gold', value: 'ROSE' },
                        { label: 'White Gold', value: 'WHITE' },
                        { label: 'Two Tone', value: 'TWO_TONE' },
                      ]}
                    />
                    <Select
                      label="Metal Finish"
                      value={formData.metalFinish}
                      onChange={(e) => setFormData({ ...formData, metalFinish: e.target.value })}
                      options={[
                        { label: 'High Polished', value: 'POLISHED' },
                        { label: 'Matte Finish', value: 'MATTE' },
                        { label: 'Antique / Heritage', value: 'ANTIQUE' },
                        { label: 'Satin Finish', value: 'SATIN' },
                      ]}
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                    <div className="font-semibold text-sm text-slate-800">Weights Breakdown (Grams)</div>
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Gross Weight (g) *"
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={formData.grossWeight}
                        onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                      />

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium text-slate-700">Has Stones?</label>
                          <input
                            type="checkbox"
                            checked={formData.hasStones}
                            onChange={(e) => setFormData({ ...formData, hasStones: e.target.checked })}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                        </div>
                        <Input
                          type="number"
                          step="0.001"
                          disabled={!formData.hasStones}
                          placeholder={formData.hasStones ? '0.000' : 'Disabled'}
                          value={formData.stoneWeight}
                          onChange={(e) => setFormData({ ...formData, stoneWeight: e.target.value })}
                        />
                      </div>

                      <Input
                        label="Lac / Wax Weight (g)"
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={formData.lacWeight}
                        onChange={(e) => setFormData({ ...formData, lacWeight: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded text-sm">
                      <span className="font-medium text-slate-700">Computed Net Metal Weight:</span>
                      <span className="font-bold font-mono text-base text-amber-900">{netMetalWeight} grams</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {step === 3 && (
                <div className="space-y-4">
                  <Select
                    label="Pricing Mode"
                    value={formData.pricingMode}
                    onChange={(e) => setFormData({ ...formData, pricingMode: e.target.value })}
                    options={[
                      { label: 'Dynamic (Live Daily Metal Rates)', value: 'DYNAMIC' },
                      { label: 'Fixed Price (Manual MRP)', value: 'FIXED' },
                    ]}
                  />

                  {formData.pricingMode === 'FIXED' ? (
                    <Input
                      label="Fixed MRP (₹)"
                      type="number"
                      placeholder="e.g. 45000"
                      value={formData.fixedPrice}
                      onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Wastage Percentage (%)"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 8.0"
                          value={formData.wastagePercent}
                          onChange={(e) => setFormData({ ...formData, wastagePercent: e.target.value })}
                        />
                        <Input
                          label="Service Charges (BIS / Cert) (₹)"
                          type="number"
                          placeholder="e.g. 45"
                          value={formData.serviceCharges}
                          onChange={(e) => setFormData({ ...formData, serviceCharges: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Making Charges Type"
                          value={formData.makingChargeType}
                          onChange={(e) => setFormData({ ...formData, makingChargeType: e.target.value })}
                          options={[
                            { label: 'Per Gram (₹/g)', value: 'PER_GRAM' },
                            { label: 'Percentage (%) of Metal', value: 'PERCENTAGE' },
                            { label: 'Flat Amount (₹)', value: 'FLAT' },
                          ]}
                        />
                        <Input
                          label="Making Charge Value"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 450"
                          value={formData.makingChargeValue}
                          onChange={(e) => setFormData({ ...formData, makingChargeValue: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Majuri Type"
                          value={formData.majuriType}
                          onChange={(e) => setFormData({ ...formData, majuriType: e.target.value })}
                          options={[
                            { label: 'Flat Amount (₹)', value: 'FLAT' },
                            { label: 'Per Gram (₹/g)', value: 'PER_GRAM' },
                            { label: 'Percentage (%)', value: 'PERCENTAGE' },
                          ]}
                        />
                        <Input
                          label="Majuri Value"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 0"
                          value={formData.majuriValue}
                          onChange={(e) => setFormData({ ...formData, majuriValue: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Media Gallery */}
              {step === 4 && (
                <div className="space-y-5">
                  {/* File Upload Dropzone */}
                  <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 transition-colors rounded-xl p-8 text-center bg-amber-50/40 relative">
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Upload product images"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-3 shadow-sm">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">
                        Click or drag images here to upload
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        High-resolution PNG, JPG, or WebP (Up to 10MB per file)
                      </p>
                    </div>
                  </div>

                  {/* Add by Public / CDN URL */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                      Or Add Image by Public / CDN URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/images/choker-angle-1.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrlImage();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddUrlImage}
                        disabled={!urlInput.trim()}
                        className="whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add URL
                      </Button>
                    </div>
                  </div>

                  {/* Staged Images Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Attached Images ({mediaList.length})
                      </h3>
                      {mediaList.length > 0 && (
                        <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Ready for catalog
                        </span>
                      )}
                    </div>

                    {mediaList.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No images attached yet. Upload or paste a URL above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {mediaList.map((media, idx) => (
                          <div
                            key={media.id || idx}
                            className={`group relative bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${
                              media.isPrimary
                                ? 'border-amber-500 ring-2 ring-amber-400/40'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="aspect-square bg-slate-100 overflow-hidden relative">
                              <img
                                src={media.thumbnailUrl || media.originalUrl}
                                alt={media.altText || `Product image ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100%" height="100%"/><text fill="%2394a3b8" x="50%" y="50%" font-size="12" text-anchor="middle" dominant-baseline="middle">Broken Image</text></svg>';
                                }}
                              />
                              {media.isPrimary && (
                                <div className="absolute top-2 left-2">
                                  <Badge variant="success" className="bg-amber-600 text-white font-bold text-[10px] shadow">
                                    <Star className="w-3 h-3 mr-1 fill-white inline" />
                                    PRIMARY
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="p-2.5 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                              {!media.isPrimary ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(idx)}
                                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                                >
                                  Set as Primary
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-800">
                                  Cover Image
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: SEO */}
              {step === 5 && (
                <div className="space-y-4">
                  <Input
                    label="URL Slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                  <Input
                    label="Meta Title (SEO)"
                    placeholder="e.g. 22K Gold Antique Choker | Hallmark Certified"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  />
                  <Input
                    label="Meta Description (SEO)"
                    placeholder="Short summary for Google search result snippet..."
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  />
                </div>
              )}

              {/* Step 6: Review */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Product Name:</span>
                      <span className="font-bold text-slate-900 text-base">{formData.name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Metal & Purity:</span>
                      <span className="font-semibold text-slate-800">{formData.metalType} ({formData.purity})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Weight:</span>
                      <span className="font-mono font-medium">{formData.grossWeight || 0} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Net Metal Weight:</span>
                      <span className="font-mono font-bold text-amber-900">{netMetalWeight} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pricing Mode:</span>
                      <span className="font-semibold">{formData.pricingMode}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Attached Images:</span>
                      <span className="font-bold text-slate-800">
                        {mediaList.length} image{mediaList.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {mediaList.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        <img
                          src={mediaList.find((m) => m.isPrimary)?.thumbnailUrl || mediaList[0].thumbnailUrl || mediaList[0].originalUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Display Asset</div>
                        <div className="text-sm font-medium text-slate-800">
                          {mediaList.find((m) => m.isPrimary)?.altText || formData.name || 'Cover Image'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step Navigation Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                >
                  Previous
                </Button>
                {step < 6 ? (
                  <Button onClick={() => setStep((s) => Math.min(6, s + 1))}>
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    {isEdit ? 'Save Changes' : 'Save & Submit Product'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Live Price Preview Card (1 column) */}
        <div>
          <Card className="sticky top-6 border-amber-300 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <CardTitle className="text-base text-white">Live Price Calculator</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isCalculating ? (
                <div className="text-center py-8 text-xs text-slate-400">Recalculating live rates...</div>
              ) : previewPrice ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Benchmark Rate:</span>
                    <span>₹{previewPrice.metalRatePerGram}/g</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Net Weight:</span>
                    <span>{previewPrice.netMetalWeight}g</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span>Metal Value:</span>
                    <span>₹{previewPrice.metalValue?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wastage ({previewPrice.wastagePercent}%):</span>
                    <span>₹{previewPrice.wastageValue?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Making Charges:</span>
                    <span>₹{previewPrice.makingChargesAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  {previewPrice.majuriAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Majuri:</span>
                      <span>₹{previewPrice.majuriAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>BIS / Service:</span>
                    <span>₹{previewPrice.serviceCharges?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t text-slate-800">
                    <span>Taxable Amount:</span>
                    <span>₹{previewPrice.taxableAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (3%):</span>
                    <span>₹{previewPrice.gstAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-amber-100 p-2.5 rounded text-amber-950 font-bold text-sm flex justify-between items-center mt-2">
                    <span>Final Price:</span>
                    <span className="text-base font-extrabold">₹{previewPrice.finalPriceRounded?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Enter gross weight & pricing rules to preview live customer price.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
