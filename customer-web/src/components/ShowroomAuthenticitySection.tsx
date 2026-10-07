import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Gem,
  Coins,
  RefreshCw,
  MapPin,
  Phone,
  Clock,
  Calendar,
  ArrowRight,
  MessageCircle,
  Building2,
  CheckCircle2,
  Car,
  Wine,
  Microscope,
} from 'lucide-react';
import { storesApi, type StoreItem } from '../api/stores.api';

// Verified fallback stores matching database records in case network is delayed
const DEFAULT_STORES: StoreItem[] = [
  {
    id: 'str-mum',
    name: 'Mumbai Diamond Hub',
    code: 'STR-MUM-01',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Bandra West, Waterfield Road, Near Linking Road',
    phone: '+91 22 2640 1234',
    email: 'mumbai@aurumjewels.com',
  },
  {
    id: 'str-del',
    name: 'Delhi Sovereign Emporium',
    code: 'STR-DEL-01',
    city: 'Delhi',
    state: 'Delhi NCR',
    address: 'South Extension Part II, Ring Road Luxury Enclave',
    phone: '+91 11 4164 5566',
    email: 'delhi@aurumjewels.com',
  },
  {
    id: 'str-blr',
    name: 'Bangalore Luxury Gallery',
    code: 'STR-BLR-01',
    city: 'Bangalore',
    state: 'Karnataka',
    address: 'Vittal Mallya Road, Near UB City Mall',
    phone: '+91 80 4112 7700',
    email: 'bangalore@aurumjewels.com',
  },
  {
    id: 'str-hyd',
    name: 'Hyderabad Royal Heritage Boutique',
    code: 'STR-HYD-01',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Road No. 36, Jubilee Hills, Near Metro Station',
    phone: '+91 40 2355 8899',
    email: 'hyderabad@aurumjewels.com',
  },
  {
    id: 'str-chn',
    name: 'Chennai Heritage Hall',
    code: 'STR-CHN-01',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'Khader Nawaz Khan Road, Nungambakkam High Street',
    phone: '+91 44 2833 4455',
    email: 'chennai@aurumjewels.com',
  },
  {
    id: 'str-vjw',
    name: 'Vijayawada Flagship Boutique',
    code: 'STR-VJW-01',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    address: 'MG Road, Governorpet, Opposite City Square',
    phone: '+91 866 247 1100',
    email: 'vijayawada@aurumjewels.com',
  },
  {
    id: 'str-gnt',
    name: 'Guntur Regional Showroom',
    code: 'STR-GNT-01',
    city: 'Guntur',
    state: 'Andhra Pradesh',
    address: 'Arundelpet 4th Line, Main Commercial Arcade',
    phone: '+91 863 222 3456',
    email: 'guntur@aurumjewels.com',
  },
];

const STORE_IMAGES: Record<string, string> = {
  Mumbai: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80',
  Delhi: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  Bangalore: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
  Hyderabad: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80',
  Chennai: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
  Vijayawada: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80',
  Guntur: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1000&q=80',
};

interface ShowroomAuthenticitySectionProps {
  onOpenConsultation?: () => void;
}

export const ShowroomAuthenticitySection: React.FC<ShowroomAuthenticitySectionProps> = ({
  onOpenConsultation,
}) => {
  const [stores, setStores] = useState<StoreItem[]>(DEFAULT_STORES);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);

  useEffect(() => {
    storesApi
      .getAll()
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setStores(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic stores, using verified default directory:', err);
      });
  }, []);

  const activeStore = stores[selectedStoreIndex] || stores[0] || DEFAULT_STORES[0];
  const activeImage =
    STORE_IMAGES[activeStore.city] ||
    'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80';

  const authenticityPillars = [
    {
      icon: ShieldCheck,
      badge: 'BIS 916 & 750 HUID',
      title: 'Government Hallmark Laser Assay',
      description:
        'Every single creation bears the mandatory Bureau of Indian Standards triangular hallmark, karat purity stamp (916 for 22K, 750 for 18K), and an individual 6-digit laser alphanumeric HUID verifiable on the government BIS Care portal.',
    },
    {
      icon: Coins,
      badge: 'ZERO HIDDEN SPREADS',
      title: 'Transparent Mathematical Pricing',
      description:
        'We operate with complete price integrity. Selling Price = (Net Metal Weight × Daily Bullion Rate) + Flat Transparent Making Charges + Hallmarking Assaying Fee + 3% GST. You verify each gram before purchase.',
    },
    {
      icon: RefreshCw,
      badge: '100% BULLION VALUE',
      title: 'Lifetime Old Gold Exchange',
      description:
        'Trade in any family gold or ancestral jewellery at 100% of the day’s live bullion rate. Zero deduction on intrinsic gold purity weight. Settle against any bespoke creation or physical bullion coins.',
    },
    {
      icon: Gem,
      badge: 'GIA & IGI VERIFIED',
      title: 'Laser-Inscribed Certified Solitaires',
      description:
        'Every natural solitaire diamond above 0.30 carats is accompanied by an authoritative GIA or IGI grading dossier, with microscopic laser serial inscription on the girdle matching the international gemological registry.',
    },
  ];

  const showroomAmenities = [
    { icon: Wine, label: 'VIP Private Viewing Suite' },
    { icon: Microscope, label: 'Laser Karatmeter Purity Lab' },
    { icon: Gem, label: 'GIA Resident Gemologist On-Site' },
    { icon: Car, label: 'Complimentary Valet Parking' },
  ];

  return (
    <section id="about" className="py-24 sm:py-32 bg-[#FAF8F5] border-t border-stone-200/90 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(140,106,40,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] text-xs font-semibold tracking-[0.25em] uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>PURITY ASSURANCE · FLAGSHIP SHOWROOMS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
            Purity Standards &amp; Flagship Showrooms
          </h2>

          <p className="mt-4 text-sm sm:text-base text-stone-600 font-light leading-relaxed">
            Every creation is backed by certified BIS hallmarking, transparent bullion pricing, and 100% lifetime buyback assurance. Experience our creations in person at our dedicated flagship showrooms across India.
          </p>
        </div>

        {/* ── PART 1: THE 4 AUTHENTICITY & PURITY PILLARS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 sm:mb-24">
          {authenticityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-stone-200/90 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-stone-200 group-hover:border-amber-300 flex items-center justify-center text-[#8C6A28] transition-colors shadow-2xs">
                      <Icon className="w-6 h-6 text-[#B89047]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-amber-700 uppercase bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-900 leading-snug mb-2.5">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-stone-600 font-normal leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#8C6A28]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guaranteed by AURUM Charter</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PART 2: INTERACTIVE FLAGSHIP SHOWROOMS HUB ── */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
          {/* Inner Header Bar */}
          <div className="p-6 sm:p-8 border-b border-stone-200/80 bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C6A28] font-semibold block mb-1">
                PHYSICAL BOUTIQUE DIRECTORY
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
                Visit Our Flagship Showrooms
              </h3>
            </div>

            {/* City Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {stores.map((store, idx) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => setSelectedStoreIndex(idx)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                    selectedStoreIndex === idx
                      ? 'bg-[#1C1917] text-[#FAF8F5] shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 border border-stone-200/60'
                  }`}
                >
                  {store.city}
                </button>
              ))}
            </div>
          </div>

          {/* Active Store Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left 6 Cols: Store Image & Experience Badge */}
            <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto min-h-[320px] bg-stone-100 overflow-hidden">
              <img
                src={activeImage}
                alt={activeStore.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-amber-200 text-xs font-semibold uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{activeStore.code}</span>
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                  {activeStore.name}
                </h4>
                <p className="text-xs text-white/80 font-light flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{activeStore.city}, {activeStore.state}</span>
                </p>
              </div>
            </div>

            {/* Right 6 Cols: Store Coordinates & Actions */}
            <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                {/* Street Address */}
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Store Location &amp; Landmark
                  </span>
                  <p className="text-sm sm:text-base font-serif font-medium text-stone-900 leading-snug">
                    {activeStore.address}
                  </p>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
                  <Clock className="w-5 h-5 text-[#8C6A28] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-stone-900">Showroom Operating Hours</p>
                    <p className="text-stone-600 mt-0.5">10:30 AM – 8:30 PM IST · Open All 7 Days</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Walk-ins welcome · Private showroom appointments recommended</p>
                  </div>
                </div>

                {/* Showroom Amenities Grid */}
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-2.5">
                    Showroom Facilities &amp; White-Glove Services
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                    {showroomAmenities.map((amenity, idx) => {
                      const AmenityIcon = amenity.icon;
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                          <AmenityIcon className="w-4 h-4 text-[#8C6A28] shrink-0" />
                          <span className="font-medium text-[11px]">{amenity.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Direct Call */}
                  <a
                    href={`tel:${activeStore.phone.replace(/\s+/g, '')}`}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-full border border-stone-300 hover:border-[#B89047] text-stone-800 hover:text-[#8C6A28] text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 bg-white"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Showroom</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/916303955998?text=${encodeURIComponent(
                      `Hello AURUM Concierge, I would like to inquire about fine jewellery at your ${activeStore.name} (${activeStore.city}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-1/2 py-3 px-4 rounded-full border border-emerald-300 hover:border-emerald-500 text-emerald-800 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 bg-emerald-50/50 hover:bg-emerald-50"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Showroom</span>
                  </a>
                </div>

                {/* Book VIP Visit */}
                {onOpenConsultation && (
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="w-full py-4 rounded-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1C1917] font-semibold text-xs tracking-[0.2em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>BOOK PRIVATE SHOWROOM VIEWING</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
