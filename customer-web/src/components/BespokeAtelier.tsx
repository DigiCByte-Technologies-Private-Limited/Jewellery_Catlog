import { useState } from 'react';
import type { FC } from 'react';
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  Award,
  Gem,
  ArrowRight,
  Hand,
  ZoomIn,
  Clock,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { MetalType, GemType } from './jewelry-3d/JewelryModel';

interface BespokeAtelierProps {
  onOpenConsultation: () => void;
  onOpenHandScale: () => void;
  onOpenDiamondLab: () => void;
}

export const BespokeAtelier: FC<BespokeAtelierProps> = ({
  onOpenConsultation,
  onOpenHandScale,
  onOpenDiamondLab,
}) => {
  // Interactive commission inquiry builder
  const [selectedPiece, setSelectedPiece] = useState<'ring' | 'bangle' | 'pendant' | 'necklace'>('ring');
  const [selectedMetal, setSelectedMetal] = useState<MetalType>('yellow-gold');
  const [selectedGem, setSelectedGem] = useState<GemType>('diamond');
  const [caratRange, setCaratRange] = useState<'1.5ct' | '2.0ct' | '2.5ct' | '3.0ct+'>('2.5ct');

  const journeySteps = [
    {
      num: '01',
      title: 'Private Discovery Session',
      timeline: 'Days 1 – 3',
      description:
        'Meet one-on-one with a dedicated GIA Graduate Gemologist in our Paris Place Vendôme salon or via secure private video. We establish your design aesthetic, proportions, and personal story.',
      icon: Calendar,
    },
    {
      num: '02',
      title: 'Conflict-Free Gem Sourcing',
      timeline: 'Days 4 – 10',
      description:
        'Our gem buyers scour ethical mines worldwide to present a curated parcel of GIA-certified Type IIa diamonds, royal sapphires, or emeralds matched specifically to your exact parameters.',
      icon: Gem,
    },
    {
      num: '03',
      title: 'Gouache Art & Wax Try-On',
      timeline: 'Days 11 – 18',
      description:
        'Master artists paint a 1:1 scale gouache rendering on archival cardstock. A 3D tactile resin prototype is delivered to your residence for ergonomic fit confirmation before noble metal casting.',
      icon: Award,
    },
    {
      num: '04',
      title: 'Noble Forging & Armored Delivery',
      timeline: 'Days 19 – 28',
      description:
        'Cast in recycled 18K gold or platinum 950, micro-pavé set under 40x stereoscopic optics, and stamped with official Swiss hallmarks. Hand-delivered via armored courier in bespoke leather casing.',
      icon: ShieldCheck,
    },
  ];

  const pieceOptions = [
    { id: 'ring', label: 'Solitaire Ring', baseEst: '$11,500 – $28,000' },
    { id: 'bangle', label: 'Eternity Bangle', baseEst: '$9,200 – $18,500' },
    { id: 'pendant', label: 'High Pendant', baseEst: '$8,400 – $22,000' },
    { id: 'necklace', label: 'Royal Necklace', baseEst: '$16,000 – $45,000+' },
  ];

  const metalOptions = [
    { id: 'yellow-gold' as MetalType, label: '18K Satin Yellow Gold', color: '#E2C37A' },
    { id: 'platinum' as MetalType, label: 'Noble Platinum 950', color: '#E5E7EB' },
    { id: 'rose-gold' as MetalType, label: '18K Rose Vermeil', color: '#E59F89' },
  ];

  const gemOptions = [
    { id: 'diamond' as GemType, label: 'D-F Colorless Diamond (GIA)', color: '#F8FAFC' },
    { id: 'sapphire' as GemType, label: 'Royal Velvet Sapphire', color: '#2563EB' },
    { id: 'emerald' as GemType, label: 'Colombian Vivid Emerald', color: '#059669' },
    { id: 'ruby' as GemType, label: 'Burmese Pigeon Blood Ruby', color: '#DC2626' },
  ];

  return (
    <section id="bespoke" className="py-20 sm:py-28 relative overflow-hidden bg-[#F7F4EE] border-t border-stone-200/80">
      {/* Ambient background radiance */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(212,175,55,0.09)_0%,transparent_70%)] pointer-events-none ambient-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] text-xs font-semibold tracking-[0.25em] uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>HAUTE JOAILLERIE CONCIERGE</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
            The Bespoke Commission Journey
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-600 font-light leading-relaxed">
            True luxury is singular. Collaborate directly with master gemologists from our Paris Place Vendôme and Geneva workshops to forge an irreplaceable family heirloom.
          </p>
        </div>

        {/* 4 Foundation Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {journeySteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-7 rounded-3xl bg-white border border-stone-200/90 hover:border-amber-400/60 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-3xl font-bold text-[#8C6A28]/80 group-hover:text-[#8C6A28] transition-colors">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#8C6A28] group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50/80 px-2.5 py-0.5 rounded-full mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{step.timeline}</span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-[#1C1917] mb-2.5">
                    {step.title}
                  </h3>

                  <p className="text-xs text-stone-600 font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center text-[11px] font-semibold text-[#8C6A28] tracking-wider uppercase">
                  <span>Certified Atelier Stage</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Custom Commission Configurator Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-stone-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left Column: Interactive Preferences Builder */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6A28] font-bold block mb-1">
                  STAGE 1 — DEFINE YOUR MASTERPIECE
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                  Configure Your Commission Inquiry
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 font-light mt-1">
                  Select your desired silhouette, precious metal, and stone specification to prepare your private consultation docket.
                </p>
              </div>

              {/* 1. Category */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-stone-700 block mb-2">
                  1. Creation Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {pieceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPiece(opt.id as any)}
                      className={`p-3 rounded-2xl text-xs font-medium border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1 ${
                        selectedPiece === opt.id
                          ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-md'
                          : 'bg-stone-50 hover:bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Metal Alloy */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-stone-700 block mb-2">
                  2. Precious Metal Casting
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {metalOptions.map((metal) => (
                    <button
                      key={metal.id}
                      onClick={() => setSelectedMetal(metal.id)}
                      className={`p-3 rounded-2xl text-xs border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedMetal === metal.id
                          ? 'bg-amber-50/70 border-amber-400 text-stone-900 font-semibold shadow-xs'
                          : 'bg-stone-50 hover:bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 shadow-xs shrink-0"
                        style={{ backgroundColor: metal.color }}
                      />
                      <span className="truncate">{metal.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Gemstone & Carat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-stone-700 block mb-2">
                    3. Primary Gemstone
                  </label>
                  <select
                    value={selectedGem}
                    onChange={(e) => setSelectedGem(e.target.value as GemType)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {gemOptions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-stone-700 block mb-2">
                    4. Approximate Carat
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['1.5ct', '2.0ct', '2.5ct', '3.0ct+'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCaratRange(c)}
                        className={`py-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                          caratRange === c
                            ? 'bg-[#1C1917] text-white border-[#1C1917]'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Docket Summary & Direct Booking */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#FAF8F5] to-[#F3EFE6] rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-md flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6A28] font-bold">
                    COMMISSION DOCKET
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Private &amp; Confidential</span>
                  </div>
                </div>

                <div className="space-y-3.5 pt-5 text-xs text-stone-700">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 font-light">Commission Category:</span>
                    <span className="font-serif font-semibold text-stone-900 capitalize">
                      {pieceOptions.find((p) => p.id === selectedPiece)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 font-light">Noble Metal:</span>
                    <span className="font-semibold text-stone-900">
                      {metalOptions.find((m) => m.id === selectedMetal)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 font-light">Gemstone Spec:</span>
                    <span className="font-semibold text-stone-900">
                      {gemOptions.find((g) => g.id === selectedGem)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 font-light">Target Weight:</span>
                    <span className="font-semibold text-stone-900">{caratRange}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <span className="text-stone-500 font-light">Typical Valuation:</span>
                    <span className="font-serif font-bold text-sm text-[#8C6A28]">
                      {pieceOptions.find((p) => p.id === selectedPiece)?.baseEst}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Booking CTAs */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={onOpenConsultation}
                  className="w-full py-4 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold tracking-[0.2em] uppercase shadow-lg shadow-stone-900/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>SCHEDULE PRIVATE CONSULTATION</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={onOpenHandScale}
                    className="py-2.5 px-3 rounded-full border border-stone-300 hover:border-amber-400 bg-white text-stone-700 hover:text-[#8C6A28] text-[11px] font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Hand className="w-3.5 h-3.5 text-[#B89047]" />
                    <span>Virtual Sizer</span>
                  </button>

                  <button
                    onClick={onOpenDiamondLab}
                    className="py-2.5 px-3 rounded-full border border-stone-300 hover:border-amber-400 bg-white text-stone-700 hover:text-[#8C6A28] text-[11px] font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-[#B89047]" />
                    <span>4Cs Optical Lab</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* VIP Client Privileges Trust Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Armored Global Transit',
              desc: 'Discreet door-to-door courier via Brinks & Malca-Amit with 100% insured transit.',
            },
            {
              title: 'GIA Archival Dossier',
              desc: 'Dual micro-laser inscription on girdle and accompanying physical gemological passport.',
            },
            {
              title: 'Lifetime Atelier Care',
              desc: 'Annual ultrasonic cleaning, claw security check, and complimentary replating in perpetuity.',
            },
            {
              title: 'Independent Valuation',
              desc: 'Official recognized insurance appraisal documentation provided with every bespoke creation.',
            },
          ].map((privilege, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/70 border border-stone-200 flex items-start gap-3.5 shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-[#8C6A28] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif text-xs font-semibold text-[#1C1917] tracking-wider uppercase">
                  {privilege.title}
                </h4>
                <p className="text-[11px] text-stone-500 font-light mt-1 leading-relaxed">
                  {privilege.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
