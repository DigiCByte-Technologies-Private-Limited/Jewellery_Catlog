import { useState } from 'react';
import { X, Sparkles, Hand, Ruler, Check } from 'lucide-react';
import type { MetalType, GemType } from './jewelry-3d/JewelryModel';

interface HandScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  carat: number;
  metal: MetalType;
  gem: GemType;
}

export const HandScaleModal = ({
  isOpen,
  onClose,
  carat,
  metal,
  gem,
}: HandScaleModalProps) => {
  const [activeTab, setActiveTab] = useState<'on-hand' | 'sizer'>('on-hand');
  const [skinTone, setSkinTone] = useState<'fair' | 'warm' | 'deep'>('warm');
  const [ringSize, setRingSize] = useState<number>(6.5);
  const [sizerMm, setSizerMm] = useState<number>(16.9); // US 6.5 inner diameter

  if (!isOpen) return null;

  const skinColors = {
    fair: { bg: '#F2D3BC', shadow: '#D0A88D' },
    warm: { bg: '#C98A60', shadow: '#9F623B' },
    deep: { bg: '#6A412A', shadow: '#422415' },
  }[skinTone];

  const metalColors = {
    'yellow-gold': '#E2C37A',
    'rose-gold': '#E59F89',
    'platinum': '#EFF1F5',
  }[metal];

  const gemColors = {
    diamond: '#FFFFFF',
    sapphire: '#1D4ED8',
    emerald: '#059669',
    ruby: '#BE123C',
  }[gem];

  const diamondMm = (6.5 * Math.pow(carat, 0.333)).toFixed(1);
  const stonePixelSize = Math.round(18 * Math.pow(carat, 0.333));

  // US Ring sizes map to diameter mm
  const ringSizes = [
    { us: 4.5, mm: 15.3, circ: 48.0 },
    { us: 5.5, mm: 16.1, circ: 50.6 },
    { us: 6.5, mm: 16.9, circ: 53.1 },
    { us: 7.5, mm: 17.7, circ: 55.7 },
    { us: 8.5, mm: 18.5, circ: 58.2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#FCFBF9] border border-stone-200 p-6 sm:p-8 shadow-2xl text-[#1C1917] overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-[#8C6A28] mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
            <span>ATELIER PROPORTION LAB</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            On-Hand Scale & Ring Sizer
          </h3>
          <p className="text-xs text-stone-600 font-light mt-1">
            Examine how your configured {carat.toFixed(2)} ct diamond proportions sit on a real hand, or calibrate your ring size.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-stone-200 mb-6">
          <button
            onClick={() => setActiveTab('on-hand')}
            className={`pb-3 px-4 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'on-hand'
                ? 'border-[#8C6A28] text-[#8C6A28] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Hand className="w-4 h-4 text-[#B89047]" />
            <span>Virtual Hand Proportion</span>
          </button>

          <button
            onClick={() => setActiveTab('sizer')}
            className={`pb-3 px-4 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'sizer'
                ? 'border-[#8C6A28] text-[#8C6A28] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Ruler className="w-4 h-4 text-[#B89047]" />
            <span>Screen Ring Sizer</span>
          </button>
        </div>

        {/* Tab 1: Virtual Hand Preview */}
        {activeTab === 'on-hand' && (
          <div className="space-y-6">
            {/* Hand Silhouette Graphic with Ring Positioned */}
            <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-stone-100/80 border border-stone-200 flex items-center justify-center overflow-hidden">
              {/* Stylized Finger */}
              <div
                className="relative rounded-t-full transition-colors duration-500 flex items-center justify-center shadow-xl"
                style={{
                  width: '68px',
                  height: '240px',
                  backgroundColor: skinColors.bg,
                  boxShadow: `inset 0 -20px 40px ${skinColors.shadow}, 0 10px 25px rgba(0,0,0,0.2)`,
                }}
              >
                {/* Knuckle crease accent */}
                <div
                  className="absolute top-28 w-12 h-[2px] opacity-40 rounded-full"
                  style={{ backgroundColor: skinColors.shadow }}
                />

                {/* The Ring Band */}
                <div
                  className="absolute top-14 w-[76px] h-6 rounded-md shadow-lg transition-all duration-300 flex items-center justify-center"
                  style={{
                    backgroundColor: metalColors,
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  {/* Center Diamond / Gemstone */}
                  <div
                    className="absolute -top-3 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center"
                    style={{
                      width: `${stonePixelSize * 2}px`,
                      height: `${stonePixelSize * 2}px`,
                      backgroundColor: gemColors,
                      border: '2px solid rgba(255,255,255,0.9)',
                      boxShadow: `0 0 20px ${metalColors}, 0 4px 12px rgba(0,0,0,0.3)`,
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-[#B89047] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Proportions Indicator Pill */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-white/95 border border-stone-200 text-xs backdrop-blur-md shadow-sm">
                <span className="text-stone-500">Scale on Finger: </span>
                <span className="text-[#8C6A28] font-bold">{carat.toFixed(2)} ct ({diamondMm} mm)</span>
              </div>
            </div>

            {/* Controls: Skin Tone & Ring Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-2 font-semibold">
                  Skin Complexion
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSkinTone('fair')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      skinTone === 'fair'
                        ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#F2D3BC] inline-block shadow-sm" />
                    Fair Ivory
                  </button>

                  <button
                    onClick={() => setSkinTone('warm')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      skinTone === 'warm'
                        ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#C98A60] inline-block shadow-sm" />
                    Warm Ochre
                  </button>

                  <button
                    onClick={() => setSkinTone('deep')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      skinTone === 'deep'
                        ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#6A412A] inline-block shadow-sm" />
                    Rich Umber
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-2 font-semibold">
                  Ring Size: US {ringSize}
                </label>
                <div className="flex items-center gap-2">
                  {ringSizes.map((size) => (
                    <button
                      key={size.us}
                      onClick={() => setRingSize(size.us)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        ringSize === size.us
                          ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {size.us}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Screen Calibration Ring Sizer */}
        {activeTab === 'sizer' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-stone-600 max-w-sm mb-4">
                Place an existing well-fitting ring directly over the circle below. Adjust the slider until the golden circle perfectly touches the inner circumference of your ring.
              </p>

              {/* Sizing Circle */}
              <div
                className="rounded-full border-2 border-[#B89047] transition-all duration-150 flex items-center justify-center shadow-md bg-amber-500/10 my-4"
                style={{
                  width: `${sizerMm * 5.2}px`,
                  height: `${sizerMm * 5.2}px`,
                }}
              >
                <span className="text-[11px] font-serif text-[#8C6A28] font-bold">
                  {sizerMm.toFixed(1)} mm
                </span>
              </div>

              {/* Diameter Slider */}
              <div className="w-full max-w-xs mt-4">
                <input
                  type="range"
                  min="14.0"
                  max="21.0"
                  step="0.1"
                  value={sizerMm}
                  onChange={(e) => setSizerMm(parseFloat(e.target.value))}
                  className="w-full accent-[#B89047] bg-stone-200 rounded-lg h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                  <span>14.0 mm (US 3)</span>
                  <span className="text-[#8C6A28] font-bold">US Size: {(sizerMm / 2.5 - 0.2).toFixed(1)}</span>
                  <span>21.0 mm (US 11)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#B89047]" />
                <span>Complimentary Ring Resizing Included Within 90 Days</span>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                Confirm Size
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
