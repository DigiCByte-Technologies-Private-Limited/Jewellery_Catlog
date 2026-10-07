import React, { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  Copy,
  Check,
  Search,
  ArrowRight,
  ShieldCheck,
  Award,
  Gem,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  AlertCircle,
  Crown,
  ChevronDown,
} from 'lucide-react';
import {
  customDesignsApi,
  type AttachmentFileItem,
  type TrackCustomDesignResult,
} from '../api/custom-designs.api';
import { useCustomerAuthStore } from '../store/authStore';

export interface CustomDesignSectionProps {
  onOpenConsultation?: () => void;
  onOpenTrackModal?: () => void;
  onOpenCustomDesign?: () => void;
  // Legacy props accepted for backward-compatibility
  currentModel?: any;
  onModelChange?: any;
  metal?: any;
  setMetal?: any;
  gem?: any;
  setGem?: any;
  carat?: any;
  setCarat?: any;
  engravingText?: any;
  setEngravingText?: any;
  engravingFont?: any;
  setEngravingFont?: any;
  prongStyle?: any;
  setProngStyle?: any;
  displayMode?: any;
  setDisplayMode?: any;
  dynamicPrice?: any;
  onOpenHandScale?: any;
  onOpenDiamondLab?: any;
  onAddToCart?: any;
}

export const CustomDesignSection: React.FC<CustomDesignSectionProps> = ({
  onOpenConsultation,
  onOpenTrackModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, customer, isAuthenticated } = useCustomerAuthStore();

  const [activeTab, setActiveTab] = useState<'create' | 'track'>('create');

  // Silhouette / Category options
  const silhouettes = [
    {
      id: 'solitaire-ring',
      name: 'Solitaire Ring',
      tagline: 'GIA Royal Solitaire & Bridal Rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'royal-necklace',
      name: 'Royal Necklace & Choker',
      tagline: 'Bridal Collar, Haar & Multi-Strand',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'polki-heritage',
      name: 'Polki & Jadau Heritage',
      tagline: 'Archival Kundan, Meenakari & Uncut Gems',
      image: 'https://images.unsplash.com/photo-1611591475871-33230a103c20?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'gemstone-sovereign',
      name: 'Emerald / Gem Sovereign',
      tagline: 'Colombian Emerald, Ceylon Sapphire, Ruby',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'eternity-bangle',
      name: 'Eternity Bangle / Kada',
      tagline: 'Solid Bullion & Channel-Set Diamonds',
      image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'earring-pair',
      name: 'Earring & Jhumka Pair',
      tagline: 'Chandbalis, Studs & Chandelier Drops',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'custom-cad',
      name: 'Bespoke CAD / Heirloom Remodel',
      tagline: 'Upload Your Sketch, Blueprint, or Family Gold',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Metal choices
  const metalOptions = [
    { id: '22k-gold', label: '22K Traditional Gold', hallmark: 'BIS 916 Hallmarked', color: '#E8B931' },
    { id: '18k-gold', label: '18K Satin Champagne Gold', hallmark: 'BIS 750 Hallmarked', color: '#D4AF37' },
    { id: 'platinum-950', label: 'Noble Platinum 950', hallmark: 'Pt950 Assay Certified', color: '#E5E7EB' },
    { id: 'rose-gold', label: '18K Imperial Rose Vermeil', hallmark: 'BIS 750 Rose Alloy', color: '#E8A598' },
    { id: '24k-gold', label: '24K Pure Bullion Casting', hallmark: '999 Fine Bullion', color: '#F59E0B' },
    { id: 'silver-999', label: '999 Fine Silver', hallmark: 'BIS 999 Silver Assayed', color: '#CBD5E1' },
  ];

  // Gemstone preferences
  const gemOptions = [
    { id: 'natural-diamond', label: 'GIA Natural Diamond', desc: 'D-F Color, VVS1-VS1, Triple Ex' },
    { id: 'lab-diamond', label: 'Lab-Grown Solitaire', desc: 'Type IIa Certified D-Flawless' },
    { id: 'colombian-emerald', label: 'Colombian Vivid Emerald', desc: 'Muzo Origin Certified Natural' },
    { id: 'royal-sapphire', label: 'Royal Ceylon Sapphire', desc: 'Unheated Vivid Cornflower Blue' },
    { id: 'burmese-ruby', label: 'Burmese Pigeon Blood Ruby', desc: 'Mogok Origin Natural Precious Ruby' },
    { id: 'polki-uncut', label: 'Heritage Uncut Polki', desc: 'Syndicate Polki with Closed Jadau Setting' },
    { id: 'no-gems', label: 'Pure Bullion Casting Only', desc: 'Solid Gold or Silver Work Without Stones' },
  ];

  // Budget tiers
  const budgetTiers = [
    { id: 'tier-1', label: '₹75,000 – ₹2,00,000', sub: 'Fine Gold & Delicate Diamond Settings' },
    { id: 'tier-2', label: '₹2,00,000 – ₹5,00,000', sub: 'Solitaires (1.0ct–1.5ct) & Heavier Gold Sets' },
    { id: 'tier-3', label: '₹5,00,000 – ₹15,00,000', sub: 'Bridal Suites, 2ct+ Solitaires & High Polki' },
    { id: 'tier-4', label: '₹15,00,000+ Heirloom', sub: 'Royal Archival Haute Joaillerie Commissions' },
    { id: 'tier-open', label: 'Open / Quotation Based', sub: 'Discuss exact metal weight & diamond rates' },
  ];

  // Form State
  const [selectedSilhouette, setSelectedSilhouette] = useState(silhouettes[0]);
  const [selectedMetal, setSelectedMetal] = useState(metalOptions[1]);
  const [selectedGem, setSelectedGem] = useState(gemOptions[0]);
  const [selectedBudget, setSelectedBudget] = useState(budgetTiers[1]);

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    companyName: '',
    preferredContactMethod: 'WHATSAPP' as 'WHATSAPP' | 'PHONE' | 'EMAIL',
    targetGoldWeight: '',
    dimensions: '',
    designDescription: '',
    designRequirements: '',
    engravingText: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<AttachmentFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    requestId: string;
    customerName: string;
    productName: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Active Dropdown state for steps 1-4
  const [activeDropdown, setActiveDropdown] = useState<'silhouette' | 'metal' | 'gem' | 'budget' | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or page scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleWindowScroll = () => {
      setActiveDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

  // Tracking tab state
  const [trackQueryId, setTrackQueryId] = useState('');
  const [trackPhoneOrEmail, setTrackPhoneOrEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackCustomDesignResult | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Pre-fill user information if customer is logged in
  useEffect(() => {
    if (isAuthenticated) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || customer?.fullName || user?.fullName || '',
        email: prev.email || customer?.email || user?.email || '',
        phone: prev.phone || customer?.phone || user?.phone || '',
      }));
    }
  }, [isAuthenticated, customer, user]);

  // Handle Multi-file Upload directly to Backend
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError(null);

    if (uploadedFiles.length + files.length > 5) {
      setUploadError('A maximum of 5 reference files or CAD models can be attached per commission.');
      return;
    }

    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'obj', 'stl', 'step', 'stp', 'cad', 'dwg', 'dxf', 'zip'];
    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(ext)) {
        setUploadError(`Unsupported format ".${ext}". Supported: JPG, PNG, WEBP, PDF, CAD (OBJ, STL, DWG, DXF, STEP, ZIP).`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setUploadError(`File "${f.name}" exceeds the 25MB maximum upload limit.`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));

      const res = await customDesignsApi.uploadFiles(fd);
      if (res.data?.data && Array.isArray(res.data.data)) {
        setUploadedFiles((prev) => [...prev, ...res.data.data]);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload attachments. Please verify file format and size.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.customerName.trim()) {
      setSubmitError('Please provide your full name so our master karigar can address your commission.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setSubmitError('Please enter a valid email address to receive your formal valuation and design blueprint.');
      return;
    }
    if (!formData.phone.trim()) {
      setSubmitError('Please enter your contact phone or WhatsApp number for private consultation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const designDescriptionCompiled = [
        `Silhouette: ${selectedSilhouette.name}`,
        formData.designDescription ? `Vision & Notes: ${formData.designDescription}` : null,
        formData.dimensions ? `Size / Dimensions: ${formData.dimensions}` : null,
        formData.engravingText ? `Custom Inscription: "${formData.engravingText}"` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const materialRequirementsCompiled = [
        `Metal Alloy: ${selectedMetal.label} (${selectedMetal.hallmark})`,
        `Gemstone Choice: ${selectedGem.label} (${selectedGem.desc})`,
        `Target Budget Tier: ${selectedBudget.label}`,
        formData.targetGoldWeight ? `Target Metal Weight: ${formData.targetGoldWeight}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const payload = {
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim() || undefined,
        productName: `Bespoke ${selectedSilhouette.name} — ${selectedMetal.label}`,
        designDescription: designDescriptionCompiled,
        materialRequirements: materialRequirementsCompiled,
        dimensions: formData.dimensions.trim() || undefined,
        quantity: '1',
        preferredContactMethod: formData.preferredContactMethod,
        attachments: uploadedFiles,
      };

      const res = await customDesignsApi.create(payload);

      if (res.data?.data) {
        setSubmittedData({
          requestId: res.data.data.requestId,
          customerName: res.data.data.customerName,
          productName: res.data.data.productName,
        });
      }
    } catch (err: any) {
      console.error('Failed to submit bespoke design request:', err);
      setSubmitError(
        err.response?.data?.message ||
          'An error occurred while transmitting your bespoke commission to the atelier. Please try again or contact our showroom directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submittedData?.requestId) {
      navigator.clipboard.writeText(submittedData.requestId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setUploadedFiles([]);
    setFormData((prev) => ({
      ...prev,
      targetGoldWeight: '',
      dimensions: '',
      designDescription: '',
      designRequirements: '',
      engravingText: '',
    }));
  };

  // Tracking query
  const handleTrackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!trackQueryId.trim()) return;

    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await customDesignsApi.track(trackQueryId.trim(), trackPhoneOrEmail.trim() || undefined);
      if (res.data?.data) {
        setTrackResult(res.data.data);
      } else {
        setTrackError('No commission dossier found matching the provided Request ID.');
      }
    } catch (err: any) {
      setTrackError(err.response?.data?.message || 'Unable to locate Request ID. Please verify your reference format (e.g. CDR-2026-0001).');
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CONTACTED':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'QUOTATION_SENT':
      case 'ESTIMATED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'IN_PRODUCTION':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <section id="custom-design" className="py-20 sm:py-28 relative overflow-hidden bg-[#FAF8F5] border-t border-stone-200/90">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[850px] bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] text-xs font-semibold tracking-[0.25em] uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>HAUTE JOAILLERIE · ATELIER BESPOKE COMMISSION</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
            Craft Your Custom Heirloom
          </h2>

          <p className="mt-4 text-sm sm:text-base text-stone-600 font-light leading-relaxed">
            Collaborate directly with our master karigars in Geneva, Paris Place Vendôme, and Mumbai. Submit your bespoke design vision, reference sketches, noble alloy specifications, and gemstone preferences. Your request is registered directly with our master atelier for private appraisal.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex items-center p-1.5 mt-8 bg-stone-100/90 rounded-full border border-stone-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-[#1C1917] shadow-sm border border-stone-200/60'
                  : 'text-stone-600 hover:text-[#1C1917]'
              }`}
            >
              COMMISSION A NEW PIECE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'bg-white text-[#1C1917] shadow-sm border border-stone-200/60'
                  : 'text-stone-600 hover:text-[#1C1917]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#8C6A28]" />
              <span>TRACK EXISTING REQUEST</span>
            </button>
          </div>
        </div>

        {/* Tab 1: New Bespoke Commission Request Form */}
        {activeTab === 'create' && (
          <>
            {submittedData ? (
              /* Success Confirmation Card */
              <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-amber-200/80 shadow-xl p-8 sm:p-12 text-center relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-300 via-[#d4af37] to-amber-400" />

                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-[#B89047]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Dossier Registered with Master Karigar</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                  Thank You, {submittedData.customerName}
                </h3>
                <p className="mt-2 text-stone-600 text-sm max-w-lg mx-auto">
                  Your bespoke commission request for <span className="font-semibold text-stone-800">{submittedData.productName}</span> has been successfully logged into our atelier management system.
                </p>

                {/* Request ID Display */}
                <div className="my-8 p-6 rounded-2xl bg-[#FAF8F5] border border-amber-200 max-w-md mx-auto">
                  <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold block mb-1">
                    Official Commission Reference ID
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#8C6A28] tracking-wider">
                      {submittedData.requestId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-300 text-stone-600 hover:text-[#8C6A28] transition-all shadow-xs cursor-pointer"
                      title="Copy Request ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Save this reference to track your gouache rendering, wax model, and valuation progress.
                  </p>
                </div>

                {/* Next Steps Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left my-8 border-t border-b border-stone-200/80 py-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6A28]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Step 1 · 2 Hours</span>
                    </div>
                    <p className="text-xs text-stone-700 font-medium">GIA Gemologist Review</p>
                    <p className="text-[11px] text-stone-500">Our chief gemologist reviews your specifications and stone cuts.</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6A28]">
                      <Award className="w-3.5 h-3.5" />
                      <span>Step 2 · 24-48 Hours</span>
                    </div>
                    <p className="text-xs text-stone-700 font-medium">1:1 Gouache & Estimate</p>
                    <p className="text-[11px] text-stone-500">Receive formal appraisal and preliminary hand-painted gouache preview.</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6A28]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Step 3 · Forging</span>
                    </div>
                    <p className="text-xs text-stone-700 font-medium">Hallmark Forging</p>
                    <p className="text-[11px] text-stone-500">Hand-casted in BIS hallmarked precious gold and delivered in velvet case.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <a
                    href={`https://wa.me/916303955998?text=${encodeURIComponent(
                      `✦ AURUM JEWELS · BESPOKE COMMISSION ✦\nCommission ID: ${submittedData.requestId}\nPatron: ${submittedData.customerName}\nCreation: ${submittedData.productName}\n\nHello AURUM Concierge, I have submitted a bespoke custom commission request. I would like to discuss the CAD / gouache rendering directly.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#104b2b] hover:bg-[#0c3920] text-emerald-100 font-semibold text-xs tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 border border-emerald-500/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Discuss on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setTrackQueryId(submittedData.requestId);
                      setActiveTab('track');
                    }}
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1C1917] font-semibold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Track Status Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto px-7 py-3 rounded-full border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-semibold tracking-wider uppercase transition-all bg-white hover:bg-stone-50 cursor-pointer"
                  >
                    Submit Another Commission
                  </button>
                </div>
              </div>
            ) : (
              /* Two-Column Studio: Left Configurator / Right Live Dossier Card */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Interactive Bespoke Request Form */}
                <form
                  onSubmit={handleSubmit}
                  className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-10"
                >
                  <div ref={dropdownContainerRef} className="space-y-8">
                    {/* Step 1: Silhouette / Category Selection Dropdown */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] font-bold text-xs flex items-center justify-center font-mono">
                            1
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                            Select Creation Silhouette
                          </h3>
                        </div>
                        <span className="text-xs text-stone-500 font-normal">Step 1 of 6</span>
                      </div>

                      {/* Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'silhouette' ? null : 'silhouette')}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer focus:outline-none ${
                          activeDropdown === 'silhouette'
                            ? 'border-[#B89047] ring-2 ring-[#B89047]/20 bg-white'
                            : 'border-stone-200 hover:border-amber-300 bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={selectedSilhouette.image}
                            alt={selectedSilhouette.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-[#8C6A28] font-semibold block">
                              Selected Silhouette
                            </span>
                            <p className="font-serif text-sm sm:text-base font-semibold text-stone-900 truncate">
                              {selectedSilhouette.name}
                            </p>
                            <p className="text-xs text-stone-500 truncate">
                              {selectedSilhouette.tagline}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ${
                            activeDropdown === 'silhouette' ? 'rotate-180 text-[#8C6A28]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === 'silhouette' && (
                        <div
                          data-lenis-prevent="true"
                          onWheel={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          style={{ overscrollBehavior: 'contain' }}
                          className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl border border-stone-200 shadow-xl max-h-72 overflow-y-auto overscroll-contain p-2 space-y-1 animate-fade-in"
                        >
                          {silhouettes.map((item) => {
                            const isSelected = selectedSilhouette.id === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSilhouette(item);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-50 text-[#8C6A28]'
                                    : 'hover:bg-stone-50 text-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-serif text-xs sm:text-sm font-semibold leading-tight text-stone-900">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                      {item.tagline}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#B89047] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step 2: Noble Metal & Hallmarking Dropdown */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] font-bold text-xs flex items-center justify-center font-mono">
                            2
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                            Noble Metal & Hallmarking
                          </h3>
                        </div>
                        <span className="text-xs text-stone-500 font-normal">Step 2 of 6</span>
                      </div>

                      {/* Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'metal' ? null : 'metal')}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer focus:outline-none ${
                          activeDropdown === 'metal'
                            ? 'border-[#B89047] ring-2 ring-[#B89047]/20 bg-white'
                            : 'border-stone-200 hover:border-amber-300 bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className="w-7 h-7 rounded-full shrink-0 border border-stone-300 shadow-xs"
                            style={{ backgroundColor: selectedMetal.color }}
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-[#8C6A28] font-semibold block">
                              Assay & Alloy Specification
                            </span>
                            <p className="font-serif text-sm sm:text-base font-semibold text-stone-900 truncate">
                              {selectedMetal.label}
                            </p>
                            <p className="text-xs text-[#8C6A28] font-medium truncate">
                              {selectedMetal.hallmark}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ${
                            activeDropdown === 'metal' ? 'rotate-180 text-[#8C6A28]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === 'metal' && (
                        <div
                          data-lenis-prevent="true"
                          onWheel={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          style={{ overscrollBehavior: 'contain' }}
                          className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl border border-stone-200 shadow-xl max-h-72 overflow-y-auto overscroll-contain p-2 space-y-1 animate-fade-in"
                        >
                          {metalOptions.map((metal) => {
                            const isSelected = selectedMetal.id === metal.id;
                            return (
                              <button
                                key={metal.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMetal(metal);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full p-3 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-50 text-[#8C6A28]'
                                    : 'hover:bg-stone-50 text-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className="w-5 h-5 rounded-full shrink-0 border border-stone-300 shadow-xs"
                                    style={{ backgroundColor: metal.color }}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-semibold leading-tight text-stone-900">
                                      {metal.label}
                                    </p>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                      {metal.hallmark}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#B89047] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step 3: Gemstone & Solitaire Specifications Dropdown */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] font-bold text-xs flex items-center justify-center font-mono">
                            3
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                            Gemstone & Solitaire Specifications
                          </h3>
                        </div>
                        <span className="text-xs text-stone-500 font-normal">Step 3 of 6</span>
                      </div>

                      {/* Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'gem' ? null : 'gem')}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer focus:outline-none ${
                          activeDropdown === 'gem'
                            ? 'border-[#B89047] ring-2 ring-[#B89047]/20 bg-white'
                            : 'border-stone-200 hover:border-amber-300 bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#8C6A28] shrink-0 shadow-2xs">
                            <Gem className="w-5 h-5 text-[#B89047]" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-[#8C6A28] font-semibold block">
                              Primary Stone Grade
                            </span>
                            <p className="font-serif text-sm sm:text-base font-semibold text-stone-900 truncate">
                              {selectedGem.label}
                            </p>
                            <p className="text-xs text-stone-500 truncate">
                              {selectedGem.desc}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ${
                            activeDropdown === 'gem' ? 'rotate-180 text-[#8C6A28]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === 'gem' && (
                        <div
                          data-lenis-prevent="true"
                          onWheel={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          style={{ overscrollBehavior: 'contain' }}
                          className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl border border-stone-200 shadow-xl max-h-72 overflow-y-auto overscroll-contain p-2 space-y-1 animate-fade-in"
                        >
                          {gemOptions.map((gem) => {
                            const isSelected = selectedGem.id === gem.id;
                            return (
                              <button
                                key={gem.id}
                                type="button"
                                onClick={() => {
                                  setSelectedGem(gem);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full p-3 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-50 text-[#8C6A28]'
                                    : 'hover:bg-stone-50 text-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Gem className="w-4 h-4 text-[#8C6A28] shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-semibold leading-tight text-stone-900">
                                      {gem.label}
                                    </p>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                      {gem.desc}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#B89047] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step 4: Investment Bracket & Metal Weight Dropdown */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] font-bold text-xs flex items-center justify-center font-mono">
                            4
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                            Investment Bracket & Metal Weight
                          </h3>
                        </div>
                        <span className="text-xs text-stone-500 font-normal">Step 4 of 6</span>
                      </div>

                      {/* Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer focus:outline-none mb-3 ${
                          activeDropdown === 'budget'
                            ? 'border-[#B89047] ring-2 ring-[#B89047]/20 bg-white'
                            : 'border-stone-200 hover:border-amber-300 bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-[#8C6A28] font-semibold block">
                            Target Budget Tier
                          </span>
                          <p className="font-serif text-sm sm:text-base font-semibold text-stone-900 truncate">
                            {selectedBudget.label}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {selectedBudget.sub}
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ${
                            activeDropdown === 'budget' ? 'rotate-180 text-[#8C6A28]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === 'budget' && (
                        <div
                          data-lenis-prevent="true"
                          onWheel={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          style={{ overscrollBehavior: 'contain' }}
                          className="absolute top-[82px] left-0 right-0 mt-2 z-40 bg-white rounded-2xl border border-stone-200 shadow-xl max-h-72 overflow-y-auto overscroll-contain p-2 space-y-1 animate-fade-in"
                        >
                          {budgetTiers.map((tier) => {
                            const isSelected = selectedBudget.id === tier.id;
                            return (
                              <button
                                key={tier.id}
                                type="button"
                                onClick={() => {
                                  setSelectedBudget(tier);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full p-3 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-50 text-[#8C6A28]'
                                    : 'hover:bg-stone-50 text-stone-800'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold leading-tight text-stone-900">
                                    {tier.label}
                                  </p>
                                  <p className="text-[11px] text-stone-500 mt-0.5">
                                    {tier.sub}
                                  </p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#B89047] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Target Weight & Dimension Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">
                            Target Metal Weight (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.targetGoldWeight}
                            onChange={(e) => setFormData({ ...formData, targetGoldWeight: e.target.value })}
                            placeholder="e.g. 15 – 25 grams pure bullion"
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">
                            Ring Size / Bangle Diameter / Length
                          </label>
                          <input
                            type="text"
                            value={formData.dimensions}
                            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                            placeholder="e.g. Indian Size 14 / US 6.5 / 2.4 Bangle"
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Upload Reference Sketches, Photos, or CAD Files */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] font-bold text-xs flex items-center justify-center font-mono">
                          5
                        </span>
                        <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                          Reference Sketches & CAD Files
                        </h3>
                      </div>
                      <span className="text-xs text-stone-500 font-normal">Step 5 of 6</span>
                    </div>

                    {/* Drag and Drop Upload Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-[#B89047] bg-[#FAF8F5] hover:bg-amber-50/20 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.obj,.stl,.step,.stp,.cad,.dwg,.dxf,.zip"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-white border border-stone-200 group-hover:border-amber-300 flex items-center justify-center mx-auto mb-3 text-stone-500 group-hover:text-[#8C6A28] shadow-xs transition-colors">
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#B89047]" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-stone-800">
                        {isUploading ? 'Encrypting & Storing Reference Files...' : 'Click or Drag Reference Sketches, Photographs, or 3D CAD Files'}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 max-w-md mx-auto">
                        Supports high-resolution JPG, PNG, WEBP, PDF drawings, and 3D CAD models (OBJ, STL, STEP, DWG, DXF, ZIP) up to 25MB each.
                      </p>
                    </div>

                    {uploadError && (
                      <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Uploaded File List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                          Attached Reference Dossier ({uploadedFiles.length}/5)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {uploadedFiles.map((file, idx) => {
                            const isImage = file.mimeType?.startsWith('image/');
                            return (
                              <div
                                key={file.id || idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isImage ? (
                                    <img
                                      src={file.url}
                                      alt={file.originalName}
                                      className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4 text-stone-600" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-stone-800 truncate text-[11px]">
                                      {file.originalName}
                                    </p>
                                    <p className="text-[10px] text-stone-400">
                                      {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(idx)}
                                  className="p-1 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-rose-600 transition-colors"
                                  title="Remove attachment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 6: Design Vision & Patron Coordinates */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-[#8C6A28] font-bold text-xs flex items-center justify-center font-mono">
                          6
                        </span>
                        <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                          Design Vision & Patron Coordinates
                        </h3>
                      </div>
                      <span className="text-xs text-stone-500 font-normal">Step 6 of 6</span>
                    </div>

                    <div className="space-y-4">
                      {/* Vision Textarea */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Detailed Design Description & Crafting Notes
                        </label>
                        <textarea
                          rows={3}
                          value={formData.designDescription}
                          onChange={(e) => setFormData({ ...formData, designDescription: e.target.value })}
                          placeholder="Describe specific design nuances (e.g., hidden halo, high cathedral shank, antique milgrain borders, 6-claw setting, or family diamond resetting preference)..."
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Engraving Inscription */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Personal Laser Inscription (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.engravingText}
                          onChange={(e) => setFormData({ ...formData, engravingText: e.target.value })}
                          placeholder="e.g. Always & Forever · MMXXVI"
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Customer Contact Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            placeholder="Lady Evelyn Montgomery"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="patron@royalheirloom.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">
                            Phone / WhatsApp <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] text-xs text-stone-900 focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* Preferred Contact Method */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-2">
                          Preferred Communication Channel
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'WHATSAPP', label: 'WhatsApp Concierge', icon: MessageCircle },
                            { id: 'PHONE', label: 'VIP Showroom Phone', icon: Phone },
                            { id: 'EMAIL', label: 'Encrypted Email Dossier', icon: Mail },
                          ].map((method) => {
                            const isSelected = formData.preferredContactMethod === method.id;
                            const IconComponent = method.icon;
                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    preferredContactMethod: method.id as any,
                                  })
                                }
                                className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#B89047] text-white border-[#B89047] shadow-xs'
                                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                                }`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                                <span>{method.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <div className="pt-4 border-t border-stone-200/80">
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="w-full py-4 rounded-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1C1917] font-semibold text-xs tracking-[0.2em] uppercase shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>TRANSMITTING COMMISSION DOSSIER...</span>
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4" />
                          <span>SUBMIT BESPOKE COMMISSION REQUEST</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-stone-500 mt-2">
                      Zero obligation. Your specifications are registered directly with our Place Vendôme master karigars.
                    </p>
                  </div>
                </form>

                {/* Right 4 Cols: Live Reactive Atelier Commission Dossier Card */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                  {/* Summary Dossier Card */}
                  <div className="bg-white rounded-3xl border border-stone-200/90 shadow-lg p-6 sm:p-7 overflow-hidden relative">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6A28]">
                          Live Atelier Dossier
                        </span>
                        <h4 className="font-serif text-base font-semibold text-[#1C1917]">
                          Commission Blueprint
                        </h4>
                      </div>
                      <Crown className="w-5 h-5 text-[#B89047]" />
                    </div>

                    {/* Selected Silhouette Hero Image */}
                    <div className="mt-4 rounded-2xl overflow-hidden aspect-[16/10] bg-stone-100 relative border border-stone-200/60 shadow-xs">
                      <img
                        src={selectedSilhouette.image}
                        alt={selectedSilhouette.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                        <span className="text-white text-xs font-serif font-semibold">
                          {selectedSilhouette.name}
                        </span>
                      </div>
                    </div>

                    {/* Specifications List */}
                    <div className="mt-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                        <span className="text-stone-500">Noble Metal</span>
                        <span className="font-medium text-stone-800 text-right flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-stone-300"
                            style={{ backgroundColor: selectedMetal.color }}
                          />
                          {selectedMetal.label}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                        <span className="text-stone-500">Hallmarking</span>
                        <span className="font-medium text-[#8C6A28] text-right">
                          {selectedMetal.hallmark}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                        <span className="text-stone-500">Primary Stone</span>
                        <span className="font-medium text-stone-800 text-right">
                          {selectedGem.label}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                        <span className="text-stone-500">Budget Bracket</span>
                        <span className="font-medium text-stone-800 text-right">
                          {selectedBudget.label}
                        </span>
                      </div>

                      {formData.dimensions && (
                        <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                          <span className="text-stone-500">Finger / Bangle Size</span>
                          <span className="font-medium text-stone-800 text-right">
                            {formData.dimensions}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-stone-500">Sketches & CAD</span>
                        <span className="font-medium text-stone-800 text-right">
                          {uploadedFiles.length > 0 ? (
                            <span className="text-emerald-700 font-semibold">
                              {uploadedFiles.length} File(s) Attached
                            </span>
                          ) : (
                            'None yet'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Atelier Guarantees */}
                    <div className="mt-6 pt-5 border-t border-stone-200/80 space-y-2.5">
                      <div className="flex items-center gap-2.5 text-[11px] text-stone-600">
                        <ShieldCheck className="w-4 h-4 text-[#8C6A28] shrink-0" />
                        <span>Assigned to Chief Gemologist within 2 hrs</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-stone-600">
                        <Award className="w-4 h-4 text-[#8C6A28] shrink-0" />
                        <span>1:1 Gouache Rendering prior to bullion casting</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-stone-600">
                        <Crown className="w-4 h-4 text-[#8C6A28] shrink-0" />
                        <span>Archival Velvet Casing with Hallmark Assay</span>
                      </div>
                    </div>

                    {/* Book VIP Showroom Consultation Button */}
                    {onOpenConsultation && (
                      <div className="mt-6 pt-4 border-t border-stone-200/80">
                        <button
                          type="button"
                          onClick={onOpenConsultation}
                          className="w-full py-2.5 rounded-full border border-stone-300 hover:border-amber-300 text-stone-700 hover:text-[#8C6A28] text-xs font-semibold tracking-wider uppercase transition-colors bg-white hover:bg-amber-50/30 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>VIP Showroom Consultation</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Track Existing Request */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-stone-200/90 shadow-lg p-6 sm:p-10 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-[#B89047]" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
                Track Your Bespoke Commission
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Enter your official Request Reference ID (e.g. <span className="font-mono text-stone-800 font-semibold">CDR-2026-0005</span>) to check master karigar crafting status.
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Commission Request ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={trackQueryId}
                    onChange={(e) => setTrackQueryId(e.target.value)}
                    placeholder="CDR-2026-0005"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 font-mono text-sm uppercase bg-[#FAF8F5] focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Registered Email or Phone (Optional Verification)
                </label>
                <input
                  type="text"
                  value={trackPhoneOrEmail}
                  onChange={(e) => setTrackPhoneOrEmail(e.target.value)}
                  placeholder="patron@royalheirloom.com or phone"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#B89047] focus:bg-white transition-colors"
                />
              </div>

              {trackError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{trackError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isTracking}
                className="w-full py-3.5 rounded-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1C1917] font-semibold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTracking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>LOCATING ATELIER DOSSIER...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>LOOKUP COMMISSION STATUS</span>
                  </>
                )}
              </button>
            </form>

            {/* Track Result Display */}
            {trackResult && (
              <div className="mt-8 p-6 rounded-2xl bg-[#FAF8F5] border border-amber-200 animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#8C6A28]">
                      {trackResult.requestId}
                    </span>
                    <h4 className="font-serif text-base font-semibold text-[#1C1917]">
                      {trackResult.productName}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      trackResult.status
                    )}`}
                  >
                    {trackResult.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-stone-200/80 pt-3">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Patron Name</span>
                    <span className="font-medium text-stone-800">{trackResult.customerName}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Contact Channel</span>
                    <span className="font-medium text-stone-800">{trackResult.preferredContactMethod}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Submitted On</span>
                    <span className="font-medium text-stone-800">
                      {new Date(trackResult.submittedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Reference Files</span>
                    <span className="font-medium text-stone-800">
                      {trackResult.attachmentCount} Attachment(s)
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#B89047] h-full transition-all duration-500"
                      style={{
                        width:
                          trackResult.status === 'NEW'
                            ? '20%'
                            : trackResult.status === 'UNDER_REVIEW'
                            ? '40%'
                            : trackResult.status === 'QUOTATION_SENT'
                            ? '60%'
                            : trackResult.status === 'IN_PRODUCTION'
                            ? '80%'
                            : trackResult.status === 'COMPLETED'
                            ? '100%'
                            : '30%',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500 mt-1 font-mono">
                    <span>Logged</span>
                    <span>Gemologist Review</span>
                    <span>Quotation</span>
                    <span>Production</span>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>
            )}

            {onOpenTrackModal && (
              <div className="mt-6 pt-4 border-t border-stone-200/80 text-center">
                <button
                  type="button"
                  onClick={onOpenTrackModal}
                  className="inline-flex items-center gap-1.5 text-xs text-[#8C6A28] hover:text-[#6E511C] font-semibold underline underline-offset-4 cursor-pointer transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Open Full Screen Showroom Tracking Portal</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
