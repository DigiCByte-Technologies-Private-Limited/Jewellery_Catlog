import { useState } from 'react';
import { Sparkles, Award, ShieldCheck, ArrowRight } from 'lucide-react';

export const SavoirFaire = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'The Gouache Blueprint',
      subtitle: 'Parisian Master Design',
      description:
        'Every AURUM commission begins with a 1:1 scale gouache watercolor painted on dark archival cardstock. Master artists calculate light refraction and facet angles before any metal is touched.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
      duration: '40 Hours of Design',
    },
    {
      number: '02',
      title: 'Lost-Wax Metallurgy',
      subtitle: 'Noble 18K Gold & Platinum',
      description:
        'Using centuries-old lost-wax casting combined with aerospace-grade vacuum casting, our recycled 18k gold and 950 platinum alloys are poured at 1,064°C for flawless structural density.',
      image: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=900&q=80',
      duration: 'Precision Smelting',
    },
    {
      number: '03',
      title: 'Micro-Pavé Setting',
      subtitle: '40x Stereoscopic Precision',
      description:
        'Master gemsetters hand-seat every single pavé diamond using microscopic bead prongs. Each stone is individually aligned to create an unbroken sea of scintillation without visible metal gaps.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80',
      duration: '100% Hand-Set Stones',
    },
    {
      number: '04',
      title: 'The High Mirror Polish',
      subtitle: 'Liquid Specular Luster',
      description:
        'The final creation undergoes multi-stage polishing with fine cotton threads, cedarwood buffs, and diamond compound paste, achieving our signature liquid-metal mirror reflection.',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80',
      duration: 'Flawless Finish',
    },
  ];

  const pressReviews = [
    {
      quote: 'Where Place Vendôme heritage seamlessly fuses with real-time 3D craftsmanship.',
      outlet: 'FINANCIAL TIMES',
      city: 'LONDON',
    },
    {
      quote: 'The new definition of Haute Joaillerie precision for the digital collector.',
      outlet: 'VOGUE INTERNATIONAL',
      city: 'PARIS',
    },
    {
      quote: 'An astonishing leap forward in bespoke diamond visualization and authenticity.',
      outlet: 'ROBB REPORT',
      city: 'NEW YORK',
    },
  ];

  return (
    <section id="about" className="py-24 bg-[#FAF8F5] border-t border-stone-200/80 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none ambient-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] text-xs font-semibold tracking-[0.25em] uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>HERITAGE & CRAFTSMANSHIP</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
            The Savoir-Faire
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-600 font-light leading-relaxed">
            Every creation is forged by master artisans in our Geneva and Paris ateliers. Discover the four foundational stages of bespoke fine jewelry.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {steps.map((step, idx) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(idx)}
              className={`px-4 sm:px-6 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeStep === idx
                  ? 'bg-[#1C1917] text-[#FAF8F5] font-semibold shadow-md'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              <span className="font-serif text-[11px] opacity-75">{step.number}</span>
              <span>{step.title}</span>
            </button>
          ))}
        </div>

        {/* Step Showcase Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-stone-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative overflow-hidden mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-serif text-4xl sm:text-5xl font-bold text-[#8C6A28]">
                  {steps[activeStep].number}
                </span>
                <div className="h-8 w-[1px] bg-stone-200" />
                <span className="text-xs uppercase tracking-[0.25em] text-stone-500 font-medium">
                  {steps[activeStep].subtitle}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1C1917]">
                {steps[activeStep].title}
              </h3>

              <p className="text-sm sm:text-base text-stone-600 font-light leading-relaxed">
                {steps[activeStep].description}
              </p>

              <div className="flex items-center gap-6 pt-2 text-xs text-[#8C6A28] font-medium">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>{steps[activeStep].duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certified Ethical Atelier</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const next = (activeStep + 1) % steps.length;
                    setActiveStep(next);
                  }}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#8C6A28] hover:text-[#1C1917] font-semibold transition-colors cursor-pointer"
                >
                  <span>Discover Next Stage ({steps[(activeStep + 1) % steps.length].title})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xl w-full max-w-lg aspect-[4/3]">
                <img
                  src={steps[activeStep].image}
                  alt={steps[activeStep].title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                  <span className="font-serif text-amber-200">GENEVA HIGH ATELIER</span>
                  <span className="text-[10px] uppercase tracking-wider text-stone-300">STAGE {steps[activeStep].number} OF 04</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Press Accolades Bar */}
        <div className="border-t border-stone-200 pt-16">
          <div className="text-center mb-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-semibold">
              CRITICAL ACCLAIM & INTERNATIONAL PRESS
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pressReviews.map((rev, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <p className="font-serif italic text-stone-700 text-sm leading-relaxed mb-6">
                  "{rev.quote}"
                </p>
                <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                  <span className="font-serif text-xs font-bold tracking-widest uppercase text-[#8C6A28]">
                    {rev.outlet}
                  </span>
                  <span className="text-[10px] text-stone-400 tracking-wider">
                    {rev.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
