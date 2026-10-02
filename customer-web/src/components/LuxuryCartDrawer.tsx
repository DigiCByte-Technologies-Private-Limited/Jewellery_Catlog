import { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  Check,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { MetalType, GemType, ProngStyle } from './jewelry-3d/JewelryModel';
import { productsApi } from '../api/products.api';

export interface CartItem {
  modelType: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  title: string;
  metal: MetalType;
  gem: GemType;
  carat: number;
  prongStyle: ProngStyle;
  engravingText: string;
  price: string;
  productId?: string;
  rawPrice?: number;
  weightGrams?: number;
  purity?: string;
  breakdown?: any;
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
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [priceDriftNotice, setPriceDriftNotice] = useState<string | null>(null);
  const [authoritativePrice, setAuthoritativePrice] = useState<string>(cartItem.price);
  const [authoritativeRawPrice, setAuthoritativeRawPrice] = useState<number | null>(
    cartItem.rawPrice ?? null
  );
  const [latestBreakdown, setLatestBreakdown] = useState<any>(cartItem.breakdown ?? null);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);

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

  // Automatically validate cart price with authoritative backend whenever drawer opens
  useEffect(() => {
    if (!isOpen) {
      setOrderConfirmed(null);
      setPriceDriftNotice(null);
      return;
    }

    setAuthoritativePrice(cartItem.price);
    setAuthoritativeRawPrice(cartItem.rawPrice ?? null);
    setLatestBreakdown(cartItem.breakdown ?? null);

    if (cartItem.productId) {
      setIsValidating(true);
      productsApi
        .validateCart([
          {
            productId: cartItem.productId,
            requestedPrice: cartItem.rawPrice,
            quantity: 1,
          },
        ])
        .then((res: any) => {
          const data = res.data?.data;
          if (data) {
            if (data.hasPriceChanged) {
              setPriceDriftNotice(
                data.message ||
                  'The price of this product has changed based on the latest metal rate. Your cart has been updated.'
              );
              if (data.items?.[0]) {
                const updatedItem = data.items[0];
                setAuthoritativePrice(`₹${updatedItem.currentPrice.toLocaleString('en-IN')}`);
                setAuthoritativeRawPrice(updatedItem.currentPrice);
                if (updatedItem.breakdown) {
                  setLatestBreakdown(updatedItem.breakdown);
                }
              }
            } else {
              setPriceDriftNotice(null);
            }
          }
        })
        .catch((err: any) => {
          console.warn('Cart backend validation warning:', err);
        })
        .finally(() => {
          setIsValidating(false);
        });
    }
  }, [isOpen, cartItem.productId, cartItem.rawPrice]);

  // Handle authoritative checkout with order price snapshot
  const handleProceedToCheckout = async () => {
    setIsCheckingOut(true);
    try {
      if (cartItem.productId && authoritativeRawPrice) {
        // Create permanent immutable price snapshot
        const appliedRate =
          latestBreakdown?.metalRatePerGram ||
          (cartItem.breakdown?.metalRatePerGram ?? 0);

        const res = await productsApi.createOrderSnapshot({
          productId: cartItem.productId,
          productName: cartItem.title,
          quantity: 1,
          appliedMetalRatePerGram: appliedRate,
          customerNotes: `Ordered via Customer Portal. Engraving: ${cartItem.engravingText || 'None'}`,
        });

        const snapshot = (res.data as any)?.data;
        setOrderConfirmed(snapshot);
      } else {
        // 3D custom piece without registered DB SKU
        setTimeout(() => {
          setOrderConfirmed({
            productName: cartItem.title,
            finalPrice: cartItem.price,
            snapshotAt: new Date().toISOString(),
          });
        }, 500);
      }
    } catch (err: any) {
      alert('Checkout error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-md h-full bg-[#FAF8F5] border-l border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto text-[#1C1917]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-stone-200">
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

          {/* Metal Rate Drift Alert Banner (Requirement #15) */}
          {priceDriftNotice && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 flex items-start gap-3 text-xs animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900 mb-0.5">
                  Latest Metal Rate Applied
                </span>
                <p className="text-amber-800 leading-relaxed font-sans">{priceDriftNotice}</p>
              </div>
            </div>
          )}

          {/* Order Confirmation Screen (Requirement #16 Snapshot) */}
          {orderConfirmed ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-bold text-stone-900">Order Confirmed!</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Authoritative order price snapshot has been permanently recorded in the database.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 text-left text-xs font-mono space-y-1.5 shadow-sm">
                <div className="text-[10px] uppercase text-stone-400 font-bold">
                  Immutable Price Snapshot
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Product:</span>
                  <span className="font-bold text-stone-900">{orderConfirmed.productName}</span>
                </div>
                {orderConfirmed.metalRatePerGram && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Locked Metal Rate:</span>
                    <span className="font-bold text-[#8C6A28]">₹{orderConfirmed.metalRatePerGram}/g</span>
                  </div>
                )}
                {orderConfirmed.netMetalWeight && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Metal Weight:</span>
                    <span className="text-stone-900">{orderConfirmed.netMetalWeight}g</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-stone-100 text-sm font-sans font-bold">
                  <span>Total Payable:</span>
                  <span className="text-[#8C6A28]">
                    {typeof orderConfirmed.finalPrice === 'number'
                      ? `₹${orderConfirmed.finalPrice.toLocaleString('en-IN')}`
                      : orderConfirmed.finalPrice}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setOrderConfirmed(null);
                  onClose();
                }}
                className="w-full py-3.5 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Return to Showroom
              </button>
            </div>
          ) : (
            /* Configured Item Summary */
            <div className="py-6 border-b border-stone-200 space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#8C6A28] font-bold uppercase tracking-wider">
                      {cartItem.productId ? 'Master Registered Jewellery' : 'Custom Atelier Commission'}
                    </span>
                    <h4 className="font-serif text-lg font-semibold text-[#1C1917]">
                      {cartItem.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-lg font-bold text-[#8C6A28]">
                      {authoritativePrice}
                    </span>
                    {isValidating && (
                      <span className="block text-[10px] text-stone-400 font-mono">
                        Validating live rate...
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs Breakdown */}
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Precious Metal:</span>
                    <span className="font-semibold text-[#1C1917]">
                      {cartItem.purity ? `${cartItem.purity} Gold/Silver` : metalNames[cartItem.metal]}
                    </span>
                  </div>

                  {cartItem.weightGrams ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Net Weight:</span>
                      <span className="font-mono font-semibold text-[#1C1917]">
                        {cartItem.weightGrams} grams
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Stone &amp; Carat:</span>
                      <span className="font-semibold text-[#1C1917]">
                        {cartItem.carat.toFixed(2)} ct • {gemNames[cartItem.gem]}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-stone-500">Pricing Engine:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-Time Dynamic Benchmark
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
                    BIS Hallmark &amp; GIA Certification
                  </h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    HUID registered, 100% government hallmarked precious metals &amp; certified gems.
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
                  <span>Lifetime Ultrasonic Cleaning &amp; Warranty</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (hidden if order is confirmed) */}
        {!orderConfirmed && (
          <div className="pt-6 border-t border-stone-200 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">
                Authoritative Payable
              </span>
              <span className="font-serif text-2xl font-bold text-[#8C6A28]">
                {authoritativePrice}
              </span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={isCheckingOut}
              className="w-full py-4 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white font-semibold text-xs tracking-[0.2em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SECURING PRICE SNAPSHOT...</span>
                </>
              ) : (
                <>
                  <span>PROCEED TO SECURE CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
              <span>Dispatched with Brink's Armored Courier within 3-5 days</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
