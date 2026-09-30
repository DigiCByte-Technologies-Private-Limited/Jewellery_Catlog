import { X, ShieldCheck, Truck, Check, ArrowRight } from 'lucide-react';
import type { MetalType, GemType, ProngStyle } from './jewelry-3d/JewelryModel';

export interface CartItem {
  modelType: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  title: string;
  metal: MetalType;
  gem: GemType;
  carat: number;
  prongStyle: ProngStyle;
  engravingText: string;
  price: string;
}

interface LuxuryCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: CartItem;
  onOpenConsultation: () => void;
}

export const LuxuryCartDrawer = ({
  isOpen,
  onClose,
  cartItem,
  onOpenConsultation,
}: LuxuryCartDrawerProps) => {
  if (!isOpen) return null;

  const metalNames: Record<MetalType, string> = {
    'yellow-gold': '18K Satin Champagne Gold',
    'rose-gold': '18K Imperial Rose Vermeil',
    'platinum': 'Noble Platinum 950',
  };

  const gemNames: Record<GemType, string> = {
    'diamond': 'GIA Certified D-Flawless Diamond',
    'sapphire': 'Royal Ceylon Sapphire',
    'emerald': 'Colombian Emerald',
    'ruby': 'Burmese Pigeon Blood Ruby',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-md h-full bg-[#FAF8F5] border-l border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto text-[#1C1917]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-stone-200">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6A28] font-bold block">
                Atelier Clienteling
              </span>
              <h3 className="font-serif text-2xl font-semibold text-[#1C1917] mt-0.5">
                Bespoke Bag
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors shadow-xs cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configured Item Summary */}
          <div className="py-6 border-b border-stone-200 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-[#8C6A28] font-bold uppercase tracking-wider">
                    Custom Commission
                  </span>
                  <h4 className="font-serif text-lg font-semibold text-[#1C1917]">
                    {cartItem.title}
                  </h4>
                </div>
                <span className="font-serif text-lg font-bold text-[#8C6A28]">
                  {cartItem.price}
                </span>
              </div>

              {/* Specs Breakdown */}
              <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span className="text-stone-500">Precious Metal:</span>
                  <span className="font-semibold text-[#1C1917]">{metalNames[cartItem.metal]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Stone & Carat:</span>
                  <span className="font-semibold text-[#1C1917]">
                    {cartItem.carat.toFixed(2)} ct • {gemNames[cartItem.gem]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Prong Basket:</span>
                  <span className="font-semibold text-[#1C1917] capitalize">{cartItem.prongStyle} Setting</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Inner Engraving:</span>
                  <span className="font-serif text-[#8C6A28] font-semibold tracking-wider">
                    {cartItem.engravingText ? `"${cartItem.engravingText.toUpperCase()}"` : 'None Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* GIA Authenticity Passport */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#8C6A28] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-serif text-xs font-semibold text-[#1C1917]">
                  GIA Digital Dossier Included
                </h5>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Laser inscribed on diamond girdle: GIA-7482910482
                </p>
              </div>
            </div>

            {/* White-Glove Inclusions */}
            <div className="space-y-2 pt-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B89047]" />
                <span>Complimentary Imperial Bordeaux Velvet Presentation Box</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B89047]" />
                <span>Brink's Insured Armored Global Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B89047]" />
                <span>Lifetime Ultrasonic Cleaning & Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-stone-200 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Estimated Total</span>
            <span className="font-serif text-2xl font-bold text-[#8C6A28]">{cartItem.price}</span>
          </div>

          <button
            onClick={() => {
              alert('Redirecting to white-glove encrypted checkout with Brink\'s Armored Courier...');
            }}
            className="w-full py-4 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white font-semibold text-xs tracking-[0.2em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>PROCEED TO SECURE CHECKOUT</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenConsultation();
            }}
            className="w-full py-3 rounded-full border border-stone-300 hover:border-[#8C6A28] text-stone-800 hover:text-[#8C6A28] text-xs font-semibold tracking-widest uppercase transition-all backdrop-blur-md bg-white hover:bg-stone-50 shadow-xs cursor-pointer"
          >
            Consult With Gemologist First
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 pt-1">
            <Truck className="w-3 h-3 text-[#8C6A28]" />
            <span>Dispatched from Geneva Atelier within 3-5 business days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
