import { useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, Check, ShoppingBag } from 'lucide-react';
import type {
  MetalType,
  GemType,
  DisplayMode,
  ProngStyle,
} from './jewelry-3d/JewelryModel';

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

export const HeroSection = ({
  onOpenConsultation,
  onAddToCart,
}: HeroSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause video when scrolled out of view to preserve 100% GPU/CPU for buttery smooth scrolling
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative w-full overflow-hidden gpu-layer"
      style={{ height: '100dvh' }}
    >
      {/* ── Web-optimized 60fps lag-free video — full width, full height, edge to edge ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover gpu-layer pointer-events-none"
        style={{
          objectPosition: 'center center',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
        }}
      >
        <source src="/hero-video-optimized.mp4" type="video/mp4" />
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* ── Top vignette for navbar readability ── */}
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }}
      />

      {/* ── Left-side gradient for text readability, right stays clear for product ── */}
      <div
        className="absolute inset-y-0 left-0 pointer-events-none z-10"
        style={{
          width: '60%',
          background: 'linear-gradient(to right, rgba(6,4,2,0.80) 0%, rgba(6,4,2,0.50) 55%, transparent 100%)',
        }}
      />
      {/* ── Bottom gradient ── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{
          height: '35%',
          background: 'linear-gradient(to top, rgba(6,4,2,0.70) 0%, transparent 100%)',
        }}
      />

      {/* ── Text content pinned to left-bottom ── */}
      <div className="absolute inset-y-0 left-0 z-20 flex items-end pb-10 sm:pb-14 px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col items-start space-y-5 max-w-xl">

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-amber-300/50 text-amber-200 text-xs font-semibold tracking-[0.25em] uppercase backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>GENEVA · PARIS HIGH ATELIER</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.15] text-white drop-shadow-lg text-left">
            <span className="block">Where Light Becomes</span>
            <span className="block gold-gradient-text font-bold">A Diamond.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/75 text-sm sm:text-base font-light leading-relaxed drop-shadow text-left">
            Bespoke fine jewelry from our Geneva & Paris ateliers — handcrafted in 18K gold & platinum 950. Visualize your piece live in 360° before a single stone is set.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-4 pt-1 w-full">
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
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1C1917] font-semibold text-xs tracking-[0.2em] uppercase shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>EXPLORE THE COLLECTION</span>
            </button>

            <button
              onClick={onOpenConsultation}
              className="w-full sm:w-auto px-7 py-4 rounded-full border border-white/40 hover:border-amber-300 text-white hover:text-amber-200 text-xs font-semibold tracking-[0.18em] uppercase transition-all backdrop-blur-md bg-white/10 hover:bg-white/15 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>PRIVATE CONSULTATION</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Guarantees */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-white/60 font-normal pt-1">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-amber-300" />
              <span>GIA Certified Diamonds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-amber-300" />
              <span>Lost-Wax 18K Casting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-amber-300" />
              <span>Armored Courier Delivery</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
