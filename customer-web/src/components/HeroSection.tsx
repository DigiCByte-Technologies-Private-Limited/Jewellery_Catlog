import { useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import type {
  MetalType,
  GemType,
  DisplayMode,
  ProngStyle,
} from '../types/bespoke';

interface HeroSectionProps {
  currentModel?: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  onModelChange?: (model: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet') => void;
  metal?: MetalType;
  setMetal?: (m: MetalType) => void;
  gem?: GemType;
  setGem?: (g: GemType) => void;
  carat?: number;
  setCarat?: (c: number) => void;
  engravingText?: string;
  setEngravingText?: (t: string) => void;
  engravingFont?: 'roman' | 'script';
  setEngravingFont?: (f: 'roman' | 'script') => void;
  prongStyle?: ProngStyle;
  setProngStyle?: (p: ProngStyle) => void;
  displayMode?: DisplayMode;
  setDisplayMode?: (d: DisplayMode) => void;
  onOpenConsultation: () => void;
  onOpenHandScale?: () => void;
  onOpenDiamondLab?: () => void;
  onAddToCart?: () => void;
}

const HeroVisual = () => (
  <div className="relative w-full max-w-md mx-auto lg:max-w-lg lg:ml-auto">
    {/* Top Center Star */}
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[#1C1A17] z-20">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
      </svg>
    </div>

    {/* The Outer Frame with thin line */}
    <div className="relative border border-[#D1C6B4] rounded-t-full pt-6 px-6 pb-0" style={{ paddingBottom: '0' }}>
      {/* The Inner Arched Mask */}
      <div className="relative w-full aspect-[4/5] rounded-t-full overflow-hidden bg-stone-200 z-10">
        <img 
          src="/hero-arch-new.jpg" 
          alt="Exquisite Jewelry Model" 
          className="absolute inset-0 w-full h-full object-cover object-center" 
        />
      </div>
    </div>

    {/* Floating Play Button overlapping the arch (Static Visual Element) */}
    <div className="absolute top-24 -left-4 sm:-left-6 z-30 w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-[#1C1A17]">
      <Play className="w-5 h-5 ml-1 fill-[#1C1A17]" />
      
      {/* Connecting visual line simulating the design */}
      <div className="absolute top-1/2 right-full w-12 h-[1px] bg-[#1C1A17] -z-10 hidden sm:block"></div>
      <div className="absolute top-1/2 right-full w-[1px] h-24 bg-[#1C1A17] -translate-y-24 -translate-x-12 hidden sm:block"></div>
      <div className="absolute top-1/2 right-full -translate-y-24 -translate-x-12 -mt-3 ml-1 text-xs font-sans font-medium whitespace-nowrap hidden sm:block">
        Play Video
      </div>
    </div>
  </div>
);

export const HeroSection = ({
  onOpenConsultation,
  onAddToCart,
}: HeroSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative w-full bg-[#F9F5EC] pt-28 pb-10 lg:pt-36 lg:pb-12 overflow-hidden"
    >
      {/* Decorative Star (Top Left) */}
      <div className="absolute top-32 left-[10%] text-[#D1C6B4]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* ── Left Column: Typography & Content ── */}
        <div className="flex flex-col items-start pt-8">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-[5.5rem] font-semibold text-[#1C1A17] leading-[1.1] tracking-tight mb-8">
            Find <span className="inline-block align-middle mx-3 w-[1.2em] h-[1.2em] rounded-full overflow-hidden bg-stone-300 shadow-sm border border-stone-200">
              <img src="/demi-fine-jewelry.jpg" alt="Jewelry Detail" className="w-full h-full object-cover object-center" />
            </span> Your <br className="hidden sm:block" />
            Perfect Piece
          </h1>

          <div className="block lg:hidden w-full max-w-[90%] sm:max-w-md mx-auto mb-10 mt-2">
            <HeroVisual />
          </div>

          <p className="text-stone-600 text-base sm:text-lg max-w-md mb-10 leading-relaxed font-sans">
            Discover Timeless Elegance Elevate Your Style with Our Exquisite Jewelry Collection.
          </p>

          {/* Overlapping Circles */}
          <div className="flex items-center mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#F9F5EC] bg-stone-200 z-30">
              <img src="/images-1.jpg" alt="Jewelry Detail" className="w-full h-full object-cover" />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#F9F5EC] bg-stone-200 -ml-4 z-20">
              <img src="/images-2.jpg" alt="Jewelry Detail" className="w-full h-full object-cover" />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#F9F5EC] bg-stone-200 -ml-4 z-10">
              <img src="/images-3.jpg" alt="Jewelry Detail" className="w-full h-full object-cover" />
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('collections');
              if (el) {
                const lenis = (window as any).__lenis;
                if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.2 });
                else el.scrollIntoView({ behavior: 'smooth' });
              } else if (onAddToCart) {
                onAddToCart();
              }
            }}
            className="group font-sans font-bold text-[#1C1A17] text-sm tracking-widest uppercase flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            SHOP NOW <span className="text-xl leading-none group-hover:translate-x-1 transition-transform">›</span>
          </button>
        </div>

        {/* ── Right Column: Arched Visual (Visible only on desktop) ── */}
        <div className="hidden lg:block w-full">
          <HeroVisual />
        </div>

      </div>
    </section>
  );
};
