import { Suspense, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sparkles, Float } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import {
  JewelryModel,
  type MetalType,
  type GemType,
  type DisplayMode,
  type ProngStyle,
} from './JewelryModel';
import {
  Rotate3d,
  Sparkles as SparklesIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  Sliders,
  Type,
  Crown,
  Sun,
  Camera,
} from 'lucide-react';
import { luxuryAudio } from '../../utils/luxuryAudio';

export type CameraAngle = 'showcase' | 'top' | 'profile' | 'macro';
export type LightingMode = 'salon' | 'daylight' | 'vault';

interface JewelrySceneProps {
  currentModel: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  onModelChange?: (model: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet') => void;
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
}

// Cinematic Camera Controller interpolating smoothly between viewpoints
const CameraRig = ({
  angle,
  controlsRef,
}: {
  angle: CameraAngle;
  controlsRef: React.RefObject<OrbitControlsType | null>;
}) => {
  useFrame((state, delta) => {
    let target = new THREE.Vector3(0, 1.2, 4.4);
    let lookTarget = new THREE.Vector3(0, 0, 0);

    if (angle === 'top') {
      target = new THREE.Vector3(0, 4.3, 0.05);
    } else if (angle === 'profile') {
      target = new THREE.Vector3(4.1, 0.3, 0);
    } else if (angle === 'macro') {
      target = new THREE.Vector3(0, 0.8, 2.3);
      lookTarget = new THREE.Vector3(0, 0.3, 0);
    }

    state.camera.position.lerp(target, delta * 3.5);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookTarget, delta * 3.5);
      controlsRef.current.update();
    }
  });
  return null;
};

export const JewelryScene = ({
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
}: JewelrySceneProps) => {
  const [isRotating, setIsRotating] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isBoxOpen, setIsBoxOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'metals' | 'carat' | 'engraving' | 'setting' | 'lighting' | 'camera'>('metals');
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('showcase');
  const [lightingMode, setLightingMode] = useState<LightingMode>('vault');

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  // Viewport visibility culling: Halt WebGL rendering when scrolled offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Active scroll throttling: Throttle canvas rendering during user scroll
  useEffect(() => {
    let timer: number;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIsScrolling(false);
      }, 120);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const controlsRef = useRef<OrbitControlsType>(null);

  const resetCamera = () => {
    setCameraAngle('showcase');
    luxuryAudio.playMetallicChime(1100);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const models: Array<'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet'> = [
    'solitaire-ring',
    'emerald-ring',
    'solitaire-bracelet',
  ];

  const handlePrev = () => {
    if (!onModelChange) return;
    luxuryAudio.playSubtleTick();
    const currentIndex = models.indexOf(currentModel);
    const prevIndex = (currentIndex - 1 + models.length) % models.length;
    onModelChange(models[prevIndex]);
  };

  const handleNext = () => {
    if (!onModelChange) return;
    luxuryAudio.playSubtleTick();
    const currentIndex = models.indexOf(currentModel);
    const nextIndex = (currentIndex + 1) % models.length;
    onModelChange(models[nextIndex]);
  };

  const diamondMm = (6.5 * Math.pow(carat, 0.333)).toFixed(1);

  // Lighting configurations based on real-world environment simulator
  const lightConfig = {
    salon: {
      ambient: 0.65,
      keyColor: '#FFE7CC',
      keyIntensity: 2.1,
      spotColor: '#FFF0DB',
      spotIntensity: 2.5,
      rimColor: '#FED7AA',
      envPreset: 'sunset' as const,
    },
    daylight: {
      ambient: 0.8,
      keyColor: '#F8FAFC',
      keyIntensity: 2.4,
      spotColor: '#FFFFFF',
      spotIntensity: 2.8,
      rimColor: '#E2E8F0',
      envPreset: 'park' as const,
    },
    vault: {
      ambient: 0.55,
      keyColor: '#FFF5DE',
      keyIntensity: 2.6,
      spotColor: '#FFFFFF',
      spotIntensity: 3.4,
      rimColor: '#BAE6FD',
      envPreset: 'city' as const,
    },
  }[lightingMode];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] md:h-[650px] lg:h-[720px] rounded-3xl overflow-hidden border border-stone-200/90 hover:border-amber-600/40 bg-gradient-to-b from-[#F7F4EE] via-[#FAF8F5] to-[#EFECE4] shadow-xl group transition-colors duration-500 gpu-layer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Parisian Silk Ambient Lighting Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.14)_0%,rgba(184,144,71,0.06)_45%,rgba(250,248,245,0)_75%)] ambient-glow" />

      {/* Top Bar Controls */}
      <div className="absolute top-5 inset-x-5 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Badges */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-amber-600/30 text-[#8C6A28] text-xs tracking-widest uppercase font-semibold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
            </span>
            SPECIAL 3D VIEW
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-stone-200 text-stone-700 text-xs tracking-wider shadow-xs">
            <Rotate3d className="w-3.5 h-3.5 text-[#B89047]" />
            <span>360° Drag</span>
          </div>
        </div>

        {/* Right: Environment & Presentation Mode Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Packaging Unboxing Toggle */}
          <button
            onClick={() => {
              if (displayMode === 'pedestal') {
                setDisplayMode('box');
                setIsBoxOpen(true);
                luxuryAudio.playVelvetLatch(true);
              } else {
                setDisplayMode('pedestal');
                luxuryAudio.playMetallicChime(750);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs ${
              displayMode === 'box'
                ? 'bg-[#380810] border-[#5E121F] text-amber-100 shadow-sm'
                : 'bg-white/95 border-stone-200 text-stone-700 hover:text-[#8C6A28] hover:border-stone-300'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#B89047]" />
            <span>{displayMode === 'box' ? 'Velvet Box' : 'Atelier Box'}</span>
          </button>

          {displayMode === 'box' && (
            <button
              onClick={() => {
                const next = !isBoxOpen;
                setIsBoxOpen(next);
                luxuryAudio.playVelvetLatch(next);
              }}
              className="px-2.5 py-1.5 rounded-full bg-[#380810]/95 border border-amber-600/40 text-xs text-amber-200 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              {isBoxOpen ? 'Close Lid' : 'Open Lid'}
            </button>
          )}

          {/* Auto-spin */}
          <button
            onClick={() => {
              setIsRotating(!isRotating);
              luxuryAudio.playSubtleTick();
            }}
            className={`p-2 rounded-full border transition-all text-xs flex items-center justify-center cursor-pointer shadow-xs ${
              isRotating
                ? 'bg-amber-100/90 border-amber-300 text-[#8C6A28]'
                : 'bg-white/95 border-stone-200 text-stone-500 hover:text-stone-800'
            }`}
            title={isRotating ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="p-2 rounded-full bg-white/95 hover:bg-stone-50 border border-stone-200 text-stone-600 hover:text-[#8C6A28] transition-all cursor-pointer shadow-xs"
            title="Reset Camera View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prev / Next Model Navigation Arrows */}
      {onModelChange && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/95 hover:bg-white border border-stone-200 hover:border-amber-500/50 text-stone-700 hover:text-[#8C6A28] transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Previous piece"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/95 hover:bg-white border border-stone-200 hover:border-amber-500/50 text-stone-700 hover:text-[#8C6A28] transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Next piece"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Three.js 3D WebGL Canvas with Viewport Culling & Scroll Throttling */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [0, 1.2, 4.4], fov: 42 }}
          dpr={[1, 1.5]}
          frameloop={isInView ? (isScrolling ? 'demand' : 'always') : 'never'}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
        >
          <Suspense fallback={null}>
            {/* Cinematic Camera Interpolator */}
            <CameraRig angle={cameraAngle} controlsRef={controlsRef} />

            {/* Real-World Lighting Simulator Rig */}
            <ambientLight intensity={lightConfig.ambient} />
            <directionalLight
              position={[5, 8, 5]}
              intensity={lightConfig.keyIntensity}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0001}
              color={lightConfig.keyColor}
            />
            <directionalLight position={[-5, 5, -4]} intensity={1.3} color={lightConfig.rimColor} />
            <spotLight
              position={[0, 7, 2]}
              intensity={lightConfig.spotIntensity}
              angle={0.6}
              penumbra={0.8}
              color={lightConfig.spotColor}
            />
            <pointLight position={[0, -0.9, 1.8]} intensity={0.9} color="#E2C37A" />

            {/* HDR Environment Reflections */}
            <Environment preset={lightConfig.envPreset} />

            {/* Prismatic Dual-Color Sparkles */}
            {displayMode === 'pedestal' && (
              <>
                <Sparkles
                  count={16}
                  scale={5.5}
                  size={2.2}
                  speed={0.25}
                  opacity={0.8}
                  color="#D4AF37"
                />
                <Sparkles
                  count={14}
                  scale={5.2}
                  size={1.8}
                  speed={0.35}
                  opacity={0.7}
                  color="#93C5FD"
                />
              </>
            )}

            {/* The 3D Jewelry piece */}
            <Float
              speed={displayMode === 'box' ? 0 : 1.5}
              rotationIntensity={displayMode === 'box' ? 0 : 0.2}
              floatIntensity={displayMode === 'box' ? 0 : 0.3}
            >
              <JewelryModel
                metal={metal}
                gem={gem}
                modelType={currentModel}
                isRotating={isRotating && !isHovered && displayMode === 'pedestal' && cameraAngle === 'showcase'}
                carat={carat}
                engravingText={engravingText}
                engravingFont={engravingFont}
                prongStyle={prongStyle}
                displayMode={displayMode}
                isBoxOpen={isBoxOpen}
              />
            </Float>

            {/* Soft ground shadow on marble - Cached with frames={1} to prevent per-frame blur pass */}
            <ContactShadows
              key={displayMode}
              position={[0, displayMode === 'box' ? -1.65 : -1.34, 0]}
              opacity={0.55}
              scale={displayMode === 'box' ? 6 : 5}
              blur={2.4}
              far={3}
              resolution={512}
              frames={1}
              color="#3A352D"
            />

            {/* Interactive Orbit Controls - enableZoom disabled so mouse wheel scrolls the page smoothly */}
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={false}
              minDistance={2.0}
              maxDistance={6.0}
              maxPolarAngle={Math.PI / 2 + 0.1}
              minPolarAngle={Math.PI / 6}
              dampingFactor={0.05}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Atelier Personalization Studio Drawer */}
      <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-20 flex flex-col gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 border border-stone-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setActiveTab('metals');
                luxuryAudio.playSubtleTick();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'metals'
                  ? 'bg-amber-50 text-[#8C6A28] border border-amber-300 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <SparklesIcon className="w-3 h-3 text-[#B89047]" />
              <span>Metal & Gem</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('carat');
                luxuryAudio.playSubtleTick();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'carat'
                  ? 'bg-amber-50 text-[#8C6A28] border border-amber-300 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sliders className="w-3 h-3 text-[#B89047]" />
              <span>Carat ({carat.toFixed(2)} ct)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('engraving');
                luxuryAudio.playSubtleTick();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'engraving'
                  ? 'bg-amber-50 text-[#8C6A28] border border-amber-300 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Type className="w-3 h-3 text-[#B89047]" />
              <span>Engraving {engravingText ? '✦' : ''}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('setting');
                luxuryAudio.playSubtleTick();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'setting'
                  ? 'bg-amber-50 text-[#8C6A28] border border-amber-300 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Crown className="w-3 h-3 text-[#B89047]" />
              <span>Claws</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('camera');
                luxuryAudio.playSubtleTick();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'camera'
                  ? 'bg-amber-50 text-[#8C6A28] border border-amber-300 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Camera className="w-3 h-3 text-[#B89047]" />
              <span>Angles</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('lighting');
                luxuryAudio.playSubtleTick();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'lighting'
                  ? 'bg-amber-50 text-[#8C6A28] border border-amber-300 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sun className="w-3 h-3 text-[#B89047]" />
              <span>Light Sim</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Metals & Gemstones */}
        {activeTab === 'metals' && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setMetal('yellow-gold');
                  luxuryAudio.playMetallicChime(880);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  metal === 'yellow-gold'
                    ? 'bg-amber-100/70 border border-amber-400 text-[#8C6A28] font-semibold shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#B89346] via-[#E2C37A] to-[#FFF5D6] inline-block shadow-sm" />
                18K Champagne Gold
              </button>

              <button
                onClick={() => {
                  setMetal('rose-gold');
                  luxuryAudio.playMetallicChime(780);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  metal === 'rose-gold'
                    ? 'bg-rose-100/70 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#C97A63] via-[#E59F89] to-[#FFD5C8] inline-block shadow-sm" />
                Rose Vermeil
              </button>

              <button
                onClick={() => {
                  setMetal('platinum');
                  luxuryAudio.playMetallicChime(1100);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  metal === 'platinum'
                    ? 'bg-slate-200/80 border border-slate-400 text-slate-900 font-semibold shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#94A3B8] via-[#CBD5E1] to-[#FFFFFF] inline-block shadow-sm" />
                Noble Platinum 950
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setGem('diamond');
                  luxuryAudio.playMetallicChime(1200);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  gem === 'diamond'
                    ? 'bg-sky-50 border border-sky-300 text-sky-900 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <SparklesIcon className="w-3 h-3 text-sky-500" />
                D-Flawless
              </button>

              <button
                onClick={() => {
                  setGem('sapphire');
                  luxuryAudio.playMetallicChime(650);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  gem === 'sapphire'
                    ? 'bg-blue-50 border border-blue-400 text-blue-900 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Sapphire
              </button>

              <button
                onClick={() => {
                  setGem('emerald');
                  luxuryAudio.playMetallicChime(720);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  gem === 'emerald'
                    ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Emerald
              </button>

              <button
                onClick={() => {
                  setGem('ruby');
                  luxuryAudio.playMetallicChime(600);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  gem === 'ruby'
                    ? 'bg-rose-50 border border-rose-400 text-rose-900 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                Ruby
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Carat Weight Slider */}
        {activeTab === 'carat' && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full flex items-center gap-3">
              <span className="text-xs text-stone-500 font-medium">1.00ct</span>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.25"
                value={carat}
                onChange={(e) => {
                  setCarat(parseFloat(e.target.value));
                  luxuryAudio.playSubtleTick();
                }}
                className="w-full accent-[#B89047] bg-stone-200 rounded-lg h-1.5 cursor-pointer"
              />
              <span className="text-xs text-stone-500 font-medium">3.50ct</span>
            </div>

            <div className="flex items-center gap-2">
              {[1.0, 1.5, 2.0, 2.5, 3.5].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setCarat(preset);
                    luxuryAudio.playSubtleTick();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    carat === preset
                      ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                      : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset.toFixed(1)}ct
                </button>
              ))}

              <div className="pl-3 border-l border-stone-200 text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Scale</span>
                <span className="text-xs font-serif text-[#8C6A28] font-semibold">{diamondMm} mm</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Laser Engraving */}
        {activeTab === 'engraving' && (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                maxLength={24}
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value)}
                placeholder="Enter secret message or initials (e.g., FOREVER & ALWAYS)..."
                className="w-full px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 text-xs text-stone-900 placeholder-stone-400 focus:outline-none tracking-widest uppercase font-serif"
              />
              {engravingText && (
                <button
                  onClick={() => setEngravingText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEngravingFont('roman')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif transition-all cursor-pointer ${
                  engravingFont === 'roman'
                    ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                Roman Serif
              </button>

              <button
                onClick={() => setEngravingFont('script')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display italic transition-all cursor-pointer ${
                  engravingFont === 'script'
                    ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                Romantic Script
              </button>

              <span className="text-[11px] text-[#8C6A28] font-medium pl-1 hidden lg:inline">
                ✦ Live in 3D Inner Band
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Claws Setting */}
        {activeTab === 'setting' && (
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setProngStyle('4-claw');
                  luxuryAudio.playMetallicChime(850);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  prongStyle === '4-claw'
                    ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                ✦ 4-Claw Classic Solitaire
              </button>

              <button
                onClick={() => {
                  setProngStyle('6-claw');
                  luxuryAudio.playMetallicChime(950);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  prongStyle === '6-claw'
                    ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                👑 6-Claw French Imperial Crown
              </button>
            </div>

            <p className="hidden md:block text-xs text-stone-500 font-light">
              6-claw setting offers maximum security and a rounded silhouette for stones above 2.0ct.
            </p>
          </div>
        )}

        {/* Tab 5: Camera Angle Presets */}
        {activeTab === 'camera' && (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {[
              { key: 'showcase', label: 'Showcase 45°', desc: 'Atelier pedestal perspective' },
              { key: 'top', label: 'Top Table Facet', desc: 'Table symmetry & light refraction' },
              { key: 'profile', label: 'Side Basket Setting', desc: 'Prong architecture & under-gallery' },
              { key: 'macro', label: 'Macro Zoom', desc: 'Microscopic diamond clarity' },
            ].map((cam) => (
              <button
                key={cam.key}
                onClick={() => {
                  setCameraAngle(cam.key as CameraAngle);
                  luxuryAudio.playMetallicChime(900);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  cameraAngle === cam.key
                    ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[#B89047]" />
                <span>{cam.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab 6: Real-World Lighting Simulator */}
        {activeTab === 'lighting' && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {[
                { key: 'vault', label: 'Vault Spotlight', icon: SparklesIcon, desc: 'High-contrast scintillation' },
                { key: 'daylight', label: 'Natural Daylight (5500K)', icon: Sun, desc: 'Authentic neutral sun rays' },
                { key: 'salon', label: 'Evening Salon (3000K)', icon: Eye, desc: 'Warm candlelit ambiance' },
              ].map((light) => {
                const Icon = light.icon;
                return (
                  <button
                    key={light.key}
                    onClick={() => {
                      setLightingMode(light.key as LightingMode);
                      luxuryAudio.playMetallicChime(1050);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                      lightingMode === light.key
                        ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#B89047]" />
                    <span>{light.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-stone-500 font-light hidden lg:inline">
              ✦ Simulates diamond fire under real-world light environments
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
