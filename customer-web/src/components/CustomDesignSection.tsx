import type { FC } from 'react';
import { Sparkles, ShoppingBag, ArrowRight, Hand, ZoomIn } from 'lucide-react';
import { JewelryScene } from './jewelry-3d/JewelryScene';
import type {
  MetalType,
  GemType,
  DisplayMode,
  ProngStyle,
} from './jewelry-3d/JewelryModel';

interface CustomDesignSectionProps {
  currentModel: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  onModelChange: (model: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet') => void;
  metal: MetalType;
  setMetal: (m: MetalType) => void;
  gem: GemType;
  setGem: (g: GemType) => void;
  carat: number;
  setCarat: (c: number) => void;
  engravingText: string;
  setEngravingText: (t: string) => void;
  engravingFont: 'roman' | 'script';
  setEngravingFont: (f: 'roman' | 'script') => void;
  prongStyle: ProngStyle;
  setProngStyle: (p: ProngStyle) => void;
  displayMode: DisplayMode;
  setDisplayMode: (d: DisplayMode) => void;
  dynamicPrice: string;
  onOpenConsultation: () => void;
  onOpenHandScale: () => void;
  onOpenDiamondLab: () => void;
  onAddToCart: () => void;
  onOpenCustomDesign?: () => void;
}

export const CustomDesignSection: FC<CustomDesignSectionProps> = ({
  currentModel,
  onModelChange,
  metal,
  setMetal,
  gem,
  setGem,
  carat,
  setCarat,
  engravingText,
  setEngravingText,
  engravingFont,
  setEngravingFont,
  prongStyle,
  setProngStyle,
  displayMode,
  setDisplayMode,
  dynamicPrice,
  onOpenConsultation,
  onOpenHandScale,
  onOpenDiamondLab,
  onAddToCart,
  onOpenCustomDesign,
}) => {
  const modelTitles = {
    'solitaire-ring': 'The Imperial Solitaire Royal',
    'emerald-ring': 'The Emerald Cut Sovereign',
    'solitaire-bracelet': 'The Solitaire Eternity Bangle',
  };

  const diamondMm = (6.5 * Math.pow(carat, 0.333)).toFixed(1);

  return (
    <section id="custom-design" className="py-20 sm:py-28 relative overflow-hidden bg-[#F7F4EE] border-t border-stone-200/80">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,transparent_70%)] pointer-events-none ambient-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-[#8C6A28] text-xs font-semibold tracking-[0.25em] uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>INTERACTIVE BESPOKE ATELIER</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
            Custom 3D Design Studio
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-600 font-light leading-relaxed">
            Manipulate every facet in real-time 360° fidelity. Select your precious metal alloy, carat weight,
            optical cut, and personalized laser inscription before placing your order.
          </p>
        </div>

        {/* 3D Configurator Canvas & Controls */}
        <div className="mb-10">
          <JewelryScene
            currentModel={currentModel}
            onModelChange={onModelChange}
            metal={metal}
            setMetal={setMetal}
            gem={gem}
            setGem={setGem}
            carat={carat}
            setCarat={setCarat}
            engravingText={engravingText}
            setEngravingText={setEngravingText}
            engravingFont={engravingFont}
            setEngravingFont={setEngravingFont}
            prongStyle={prongStyle}
            setProngStyle={setProngStyle}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
          />
        </div>

        {/* Action Panel / Spec Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Active Configuration Specs */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-center lg:text-left">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold block">
                Selected Creation
              </span>
              <span className="font-serif text-lg sm:text-xl font-bold text-[#1C1917]">
                {modelTitles[currentModel]}
              </span>
            </div>

            <div className="h-8 w-px bg-stone-200 hidden sm:block" />

            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold block">
                Carat &amp; Diameter
              </span>
              <span className="font-serif text-sm sm:text-base font-semibold text-stone-700">
                {carat.toFixed(2)} ct ({diamondMm} mm)
              </span>
            </div>

            <div className="h-8 w-px bg-stone-200 hidden sm:block" />

            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold block">
                Estimated Atelier Value
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold gold-gradient-text">
                {dynamicPrice}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
            <button
              onClick={onOpenHandScale}
              className="px-4 py-3 rounded-full border border-stone-200 hover:border-amber-400 text-stone-700 hover:text-[#8C6A28] text-xs font-semibold tracking-wider uppercase transition-all bg-stone-50 hover:bg-white flex items-center gap-2 cursor-pointer shadow-xs"
              title="Virtual On-Hand Scale & Sizer"
            >
              <Hand className="w-3.5 h-3.5 text-[#B89047]" />
              <span>On-Hand Scale</span>
            </button>

            <button
              onClick={onOpenDiamondLab}
              className="px-4 py-3 rounded-full border border-stone-200 hover:border-amber-400 text-stone-700 hover:text-[#8C6A28] text-xs font-semibold tracking-wider uppercase transition-all bg-stone-50 hover:bg-white flex items-center gap-2 cursor-pointer shadow-xs"
              title="GIA 4Cs Optical Laboratory"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#B89047]" />
              <span>4Cs Optical Lab</span>
            </button>

            <button
              onClick={onOpenConsultation}
              className="px-5 py-3 rounded-full border border-stone-300 hover:border-[#8C6A28] text-stone-800 hover:text-[#8C6A28] text-xs font-semibold tracking-wider uppercase transition-all bg-white hover:bg-stone-50 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Consult Atelier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onOpenCustomDesign && (
              <button
                onClick={onOpenCustomDesign}
                className="px-5 py-3 rounded-full bg-gradient-to-r from-[#1C1917] to-[#292524] hover:from-[#292524] hover:to-[#1C1917] text-amber-200 hover:text-white border border-amber-500/40 text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer"
                title="Upload CAD model or sketch for custom piece"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E2C37A]" />
                <span>Upload Own Design / CAD</span>
              </button>
            )}

            <button
              onClick={onAddToCart}
              className="px-7 py-3 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-[#FAF8F5] text-xs font-semibold tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Custom Piece</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
