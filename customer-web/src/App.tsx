import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeatureHighlights } from './components/FeatureHighlights';
import { CuratedSpotlight } from './components/CuratedSpotlight';
import { CustomDesignSection } from './components/CustomDesignSection';
import { SavoirFaire } from './components/SavoirFaire';
import { Footer } from './components/Footer';
import { ConsultationModal } from './components/ConsultationModal';
import { ProductInquiryModal, type InquiryProductContext } from './components/ProductInquiryModal';
import { TrackRequestModal } from './components/TrackRequestModal';
import { LuxuryCartDrawer, type CartItem } from './components/LuxuryCartDrawer';
import { HandScaleModal } from './components/HandScaleModal';
import { DiamondLabModal } from './components/DiamondLabModal';
import type {
  MetalType,
  GemType,
  DisplayMode,
  ProngStyle,
} from './components/jewelry-3d/JewelryModel';

export function App() {
  const [currentModel, setCurrentModel] = useState<'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet'>('solitaire-ring');
  const [metal, setMetal] = useState<MetalType>('yellow-gold');
  const [gem, setGem] = useState<GemType>('diamond');
  const [carat, setCarat] = useState(2.5);
  const [engravingText, setEngravingText] = useState('');
  const [engravingFont, setEngravingFont] = useState<'roman' | 'script'>('roman');
  const [prongStyle, setProngStyle] = useState<ProngStyle>('4-claw');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pedestal');

  // Modals & Drawers
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHandScaleOpen, setIsHandScaleOpen] = useState(false);
  const [isDiamondLabOpen, setIsDiamondLabOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<InquiryProductContext | null>(null);

  // Initialize luxury smooth inertial scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    (window as any).__lenis = lenis;

    // Smooth navigation for all internal anchor links (#home, #collections, #about, etc.)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.hash && target.hash.startsWith('#')) {
        const id = target.hash.slice(1);
        if (id) {
          const el = document.getElementById(id);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el, { offset: -80, duration: 1.2 });
          }
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  // Lock background smooth scroll when any modal or drawer is active
  const isAnyModalOpen = isConsultationOpen || isCartOpen || isHandScaleOpen || isDiamondLabOpen || (inquiryProduct !== null);
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (!lenis) return;
    if (isAnyModalOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [isAnyModalOpen]);

  // Dynamic price calculation
  const dynamicPrice = (() => {
    let base = 4200;
    if (currentModel === 'emerald-ring') base = 5800;
    if (currentModel === 'solitaire-bracelet') base = 4800;

    const caratCost = carat * (currentModel === 'emerald-ring' ? 3900 : 3300);
    let metalCost = 0;
    if (metal === 'platinum') metalCost = 1200;
    if (metal === 'rose-gold') metalCost = 350;

    let gemMultiplier = 1.0;
    if (gem === 'sapphire') gemMultiplier = 0.85;
    if (gem === 'emerald') gemMultiplier = 0.95;
    if (gem === 'ruby') gemMultiplier = 0.90;

    const total = Math.round((base + caratCost + metalCost) * gemMultiplier);
    return '$' + total.toLocaleString();
  })();

  const modelTitle = {
    'solitaire-ring': 'The Imperial Solitaire Royal Ring',
    'emerald-ring': 'The Emerald Cut Sovereign Ring',
    'solitaire-bracelet': 'The Solitaire Eternity Bangle',
  }[currentModel];

  // Active Cart Item
  const [activeCartItem, setActiveCartItem] = useState<CartItem>({
    modelType: 'solitaire-ring',
    title: 'The Imperial Solitaire Royal Ring',
    metal: 'yellow-gold',
    gem: 'diamond',
    carat: 2.5,
    prongStyle: '4-claw',
    engravingText: '',
    price: '$12,450',
  });

  const handleAddCurrentToCart = () => {
    setActiveCartItem({
      modelType: currentModel,
      title: modelTitle,
      metal,
      gem,
      carat,
      prongStyle,
      engravingText,
      price: dynamicPrice,
    });
    setIsCartOpen(true);
  };

  const handleAddCollectionItemToCart = (item: CartItem) => {
    setActiveCartItem(item);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col selection:bg-amber-200 selection:text-[#8C6A28]">
      {/* Top Luxury Navigation */}
      <Navbar
        onOpenConsultation={() => setIsConsultationOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrack={() => setIsTrackModalOpen(true)}
        cartCount={1}
      />

      {/* Main Experience */}
      <main className="flex-grow">
        {/* Hero Section with Interactive 3D Canvas & Personalization Suite */}
        <HeroSection
          currentModel={currentModel}
          onModelChange={setCurrentModel}
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
          onOpenConsultation={() => setIsConsultationOpen(true)}
          onOpenHandScale={() => setIsHandScaleOpen(true)}
          onOpenDiamondLab={() => setIsDiamondLabOpen(true)}
          onAddToCart={handleAddCurrentToCart}
        />

        {/* 4 Trust & Service Highlights from the video */}
        <FeatureHighlights />

        {/* Curated Spotlight & Filterable Collections Showcase */}
        <CuratedSpotlight
          onSelectModel={(model) => {
            setCurrentModel(model);
            setDisplayMode('pedestal');
          }}
          onOpenConsultation={() => setIsConsultationOpen(true)}
          onAddToCart={handleAddCollectionItemToCart}
          onOpenInquiry={setInquiryProduct}
        />

        {/* Dedicated Bespoke 3D Custom Design Studio Section */}
        <CustomDesignSection
          currentModel={currentModel}
          onModelChange={setCurrentModel}
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
          dynamicPrice={dynamicPrice}
          onOpenConsultation={() => setIsConsultationOpen(true)}
          onOpenHandScale={() => setIsHandScaleOpen(true)}
          onOpenDiamondLab={() => setIsDiamondLabOpen(true)}
          onAddToCart={handleAddCurrentToCart}
        />

        {/* The Savoir-Faire Artisanal Craftsmanship & Press Story */}
        <SavoirFaire />
      </main>

      {/* Atelier Footer */}
      <Footer />

      {/* Product Commercial & Bespoke Inquiry Modal */}
      <ProductInquiryModal
        isOpen={inquiryProduct !== null}
        onClose={() => setInquiryProduct(null)}
        product={inquiryProduct}
      />

      {/* Customer Request & Showroom Tracking Portal */}
      <TrackRequestModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />

      {/* 3D Private Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        selectedMetal={metal}
        selectedGem={gem}
      />

      {/* White-Glove Slide-Over Bespoke Bag */}
      <LuxuryCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItem={activeCartItem}
        onOpenConsultation={() => {
          setIsCartOpen(false);
          setIsConsultationOpen(true);
        }}
      />

      {/* On-Hand Virtual Scale & Sizer Modal */}
      <HandScaleModal
        isOpen={isHandScaleOpen}
        onClose={() => setIsHandScaleOpen(false)}
        carat={carat}
        metal={metal}
        gem={gem}
      />

      {/* GIA 4Cs Optical Diamond Lab Modal */}
      <DiamondLabModal
        isOpen={isDiamondLabOpen}
        onClose={() => setIsDiamondLabOpen(false)}
        carat={carat}
      />
    </div>
  );
}

export default App;
