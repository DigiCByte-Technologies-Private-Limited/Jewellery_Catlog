import { useState } from 'react';
import { X, Sparkles, ZoomIn, Eye, ShieldCheck, Sun, Layers } from 'lucide-react';

interface DiamondLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  carat: number;
}

export const DiamondLabModal = ({
  isOpen,
  onClose,
  carat,
}: DiamondLabModalProps) => {
  const [activeTab, setActiveTab] = useState<'4cs' | 'cut' | 'color' | 'clarity'>('4cs');
  const [colorGrade, setColorGrade] = useState<'D' | 'F' | 'H' | 'J'>('D');
  const [clarityGrade, setClarityGrade] = useState<'FL' | 'VVS1' | 'VS1' | 'SI1'>('VVS1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#FCFBF9] border border-stone-200 p-6 sm:p-8 shadow-2xl text-[#1C1917] overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

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
            <span>GIA CERTIFIED GEMOLOGICAL LAB</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            The 4Cs Diamond Optical Guide
          </h3>
          <p className="text-xs text-stone-600 font-light mt-1">
            Understand how Carat, Cut, Color, and Clarity define the rare optical brilliance of your fine diamond.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-stone-200 mb-6 gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('4cs')}
            className={`pb-3 px-3 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === '4cs'
                ? 'border-[#8C6A28] text-[#8C6A28] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4 text-[#B89047]" />
            <span>1. Carat Scale</span>
          </button>

          <button
            onClick={() => setActiveTab('cut')}
            className={`pb-3 px-3 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'cut'
                ? 'border-[#8C6A28] text-[#8C6A28] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sun className="w-4 h-4 text-[#B89047]" />
            <span>2. Cut & Fire</span>
          </button>

          <button
            onClick={() => setActiveTab('color')}
            className={`pb-3 px-3 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'color'
                ? 'border-[#8C6A28] text-[#8C6A28] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Eye className="w-4 h-4 text-[#B89047]" />
            <span>3. Color Spectrum</span>
          </button>

          <button
            onClick={() => setActiveTab('clarity')}
            className={`pb-3 px-3 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'clarity'
                ? 'border-[#8C6A28] text-[#8C6A28] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <ZoomIn className="w-4 h-4 text-[#B89047]" />
            <span>4. 10x Loupe Clarity</span>
          </button>
        </div>

        {/* Tab 1: Carat Scale */}
        {activeTab === '4cs' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center">
              <div className="flex items-end justify-center gap-8 py-6 w-full">
                {[
                  { ct: 1.0, mm: 6.5, label: '1.00 ct' },
                  { ct: 1.5, mm: 7.4, label: '1.50 ct' },
                  { ct: 2.0, mm: 8.2, label: '2.00 ct' },
                  { ct: carat, mm: parseFloat((6.5 * Math.pow(carat, 0.333)).toFixed(1)), label: `${carat.toFixed(2)} ct (Configured)`, active: true },
                  { ct: 3.5, mm: 9.8, label: '3.50 ct' },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3">
                    <div
                      className={`rounded-full border-2 transition-all flex items-center justify-center shadow-md ${
                        item.active
                          ? 'border-[#B89047] bg-amber-500/20 shadow-amber-500/20'
                          : 'border-stone-300 bg-white'
                      }`}
                      style={{
                        width: `${item.mm * 6}px`,
                        height: `${item.mm * 6}px`,
                      }}
                    >
                      <Sparkles className="w-3 h-3 text-[#B89047] opacity-90" />
                    </div>
                    <div className="text-center">
                      <span className={`text-xs font-semibold block ${item.active ? 'text-[#8C6A28]' : 'text-stone-700'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-stone-400">{item.mm} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-stone-600 font-light leading-relaxed">
              Carat refers to the physical weight of the diamond (1 carat = 200 milligrams). Because diamonds are cut in three dimensions, a 2.00 ct diamond delivers significantly more surface brilliance than two 1.00 ct stones combined.
            </p>
          </div>
        )}

        {/* Tab 2: Cut & Light Performance */}
        {activeTab === 'cut' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                <div className="h-28 flex items-center justify-center">
                  <div className="w-16 h-8 border-t-2 border-l-2 border-r-2 border-rose-400/80 rounded-t-full relative">
                    <span className="text-[10px] text-rose-600 absolute -bottom-5 inset-x-0 font-medium">Light Leaks</span>
                  </div>
                </div>
                <h5 className="font-serif text-sm font-semibold text-stone-800 mt-2">Shallow Cut</h5>
                <p className="text-[11px] text-stone-500 mt-1">Light escapes through bottom; creates dull center.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-400 text-center shadow-md">
                <div className="h-28 flex items-center justify-center">
                  <div className="w-16 h-14 border-t-2 border-l-2 border-r-2 border-amber-500 rounded-t-full relative shadow-xs">
                    <Sparkles className="w-4 h-4 text-[#8C6A28] absolute -top-2 left-1/2 -translate-x-1/2 animate-bounce" />
                    <span className="text-[10px] text-[#8C6A28] absolute -bottom-5 inset-x-0 font-bold">100% Light Return</span>
                  </div>
                </div>
                <h5 className="font-serif text-sm font-bold text-[#8C6A28] mt-2">Ideal Brilliant (AURUM)</h5>
                <p className="text-[11px] text-stone-600 mt-1 font-medium">Total internal reflection; maximum fiery scintillation.</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                <div className="h-28 flex items-center justify-center">
                  <div className="w-12 h-20 border-t-2 border-l-2 border-r-2 border-rose-400/80 rounded-t-full relative">
                    <span className="text-[10px] text-rose-600 absolute -bottom-5 inset-x-0 font-medium">Dark Center</span>
                  </div>
                </div>
                <h5 className="font-serif text-sm font-semibold text-stone-800 mt-2">Deep Cut</h5>
                <p className="text-[11px] text-stone-500 mt-1">Light escapes through sides; looks smaller than weight.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 font-light leading-relaxed">
              Every AURUM solitaire is exclusively graded **"Super Ideal Triple Excellent"** by GIA for Cut, Polish, and Symmetry, ensuring every ray of light entering the crown is directed back to the viewer's eyes.
            </p>
          </div>
        )}

        {/* Tab 3: Color Spectrum */}
        {activeTab === 'color' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-6 py-4">
                {[
                  { grade: 'D', name: 'Colorless (Flawless)', hex: '#FFFFFF', tint: 'bg-white' },
                  { grade: 'F', name: 'Colorless (Rare)', hex: '#FCFBF8', tint: 'bg-stone-100' },
                  { grade: 'H', name: 'Near Colorless', hex: '#F9F6EA', tint: 'bg-amber-100/70' },
                  { grade: 'J', name: 'Faint Tint', hex: '#F5EECB', tint: 'bg-amber-200/80' },
                ].map((col) => (
                  <button
                    key={col.grade}
                    onClick={() => setColorGrade(col.grade as 'D' | 'F' | 'H' | 'J')}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      colorGrade === col.grade
                        ? 'border-amber-400 bg-amber-100/70 shadow-md scale-105'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-full border border-stone-300 mb-2 shadow-inner"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="font-serif text-base font-semibold text-[#1C1917]">{col.grade}</span>
                    <span className="text-[10px] text-stone-500">{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-stone-600 font-light leading-relaxed">
              GIA grades diamond color from D (absolutely colorless) to Z. Grade **D** is the highest possible grade in existence, completely free of any structural nitrogen atoms or body color.
            </p>
          </div>
        )}

        {/* Tab 4: 10x Gemologist Loupe & GIA Laser Inscription */}
        {activeTab === 'clarity' && (
          <div className="space-y-6">
            <div className="relative p-8 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center overflow-hidden">
              {/* Circular Loupe Reticle */}
              <div className="relative w-56 h-56 rounded-full border-4 border-[#B89047] shadow-xl flex items-center justify-center bg-stone-950">
                {/* Crosshairs */}
                <div className="absolute w-full h-[1px] bg-amber-400/30" />
                <div className="absolute h-full w-[1px] bg-amber-400/30" />

                {/* Simulated Diamond Facets */}
                <div className="w-24 h-24 border-2 border-white/60 rotate-45 flex items-center justify-center">
                  <div className="w-12 h-12 border border-sky-300/80 rotate-45 flex items-center justify-center">
                    <span className="text-[9px] text-amber-300 font-mono">10x LOUPE</span>
                  </div>
                </div>

                {/* GIA Girdle Laser Inscription Simulation */}
                <div className="absolute bottom-6 px-2 py-0.5 rounded bg-black/90 border border-amber-400/50 text-[9px] font-mono text-amber-300 tracking-wider">
                  GIA-7482910482
                </div>
              </div>

              {/* Clarity Selectors */}
              <div className="flex items-center gap-3 mt-6">
                {(['FL', 'VVS1', 'VS1', 'SI1'] as const).map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setClarityGrade(grade)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      clarityGrade === grade
                        ? 'bg-amber-100 border border-amber-300 text-[#8C6A28] font-semibold shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B89047]" />
                <span>Every stone is microscopically verified with an authentic GIA grading dossier.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
