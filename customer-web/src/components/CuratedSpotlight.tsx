import { useState } from 'react';
import type { FC } from 'react';
import { Sparkles, Eye, Heart, ShoppingBag, MessageSquare } from 'lucide-react';
import type { CartItem } from './LuxuryCartDrawer';
import type { InquiryProductContext } from './ProductInquiryModal';

interface CuratedSpotlightProps {
  onSelectModel: (model: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet') => void;
  onOpenConsultation: () => void;
  onAddToCart?: (item: CartItem) => void;
  onOpenInquiry?: (product: InquiryProductContext) => void;
}

export const CuratedSpotlight: FC<CuratedSpotlightProps> = ({
  onSelectModel,
  onOpenConsultation,
  onAddToCart,
  onOpenInquiry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rings' | 'bangles' | 'pendants'>('all');

  const products = [
    {
      id: 'solitaire-ring',
      modelType: 'solitaire-ring' as const,
      category: 'rings',
      name: 'The Imperial Solitaire Ring',
      collection: 'Royal Solitaire 2026',
      price: '$12,450',
      carat: 2.50,
      cut: 'Ideal Round Brilliant',
      metal: 'yellow-gold' as const,
      metalLabel: '18K Satin Champagne Gold',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      badge: 'Iconic Masterpiece',
    },
    {
      id: 'emerald-ring',
      modelType: 'emerald-ring' as const,
      category: 'rings',
      name: 'The Emerald Cut Sovereign',
      collection: 'Architectural Haute',
      price: '$18,900',
      carat: 3.20,
      cut: 'Emerald Step Cut',
      metal: 'platinum' as const,
      metalLabel: 'Noble Platinum 950',
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
      badge: 'Limited Atelier Edition',
    },
    {
      id: 'solitaire-bracelet',
      modelType: 'solitaire-bracelet' as const,
      category: 'bangles',
      name: 'The Solitaire Eternity Bangle',
      collection: 'Lumière Privée',
      price: '$9,800',
      carat: 1.80,
      cut: 'Round Brilliant & Pavé',
      metal: 'rose-gold' as const,
      metalLabel: '18K Rose Vermeil',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      badge: 'Signature Selection',
    },
    {
      id: 'halo-ring',
      modelType: 'solitaire-ring' as const,
      category: 'rings',
      name: 'The Place Vendôme Halo Pavé',
      collection: 'Parisian Heritage',
      price: '$14,200',
      carat: 2.10,
      cut: 'Cushion Brilliant',
      metal: 'yellow-gold' as const,
      metalLabel: '18K Satin Champagne Gold',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
      badge: 'Place Vendôme',
    },
    {
      id: 'drop-pendant',
      modelType: 'emerald-ring' as const,
      category: 'pendants',
      name: 'The Royal Duchess Drop Pendant',
      collection: 'L’Amour Éternel',
      price: '$11,600',
      carat: 2.00,
      cut: 'Pear Shape Brilliant',
      metal: 'platinum' as const,
      metalLabel: 'Noble Platinum 950',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80',
      badge: 'High Jewelry',
    },
    {
      id: 'tennis-bracelet',
      modelType: 'solitaire-bracelet' as const,
      category: 'bangles',
      name: 'The Imperial Diamond Tennis Bangle',
      collection: 'Eternity Pavé',
      price: '$15,800',
      carat: 3.50,
      cut: 'Channel-Set Round',
      metal: 'platinum' as const,
      metalLabel: 'Noble Platinum 950',
      image: 'https://images.unsplash.com/photo-1611591475152-4775d1544919?auto=format&fit=crop&w=800&q=80',
      badge: 'Atelier Exclusive',
    },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <section id="collections" className="py-20 sm:py-28 relative overflow-hidden bg-[#FAF8F5]">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none ambient-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-[#8C6A28] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
              <span>EXCLUSIVE SELECTION</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
              SHOP BY COLLECTION
            </h2>
          </div>
          <p className="mt-4 md:mt-0 text-sm text-stone-600 max-w-md font-light">
            Every piece is certified by GIA gemologists, forged in ethical precious metals, and fully interactive in 3D.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-12 border-b border-stone-200 pb-4">
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold mr-2">
            Category:
          </span>
          {[
            { key: 'all', label: 'All Ateliers' },
            { key: 'rings', label: 'Solitaire Rings' },
            { key: 'bangles', label: 'Eternity Bangles' },
            { key: 'pendants', label: 'High Pendants' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-[#1C1917] text-[#FAF8F5] font-semibold shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>


        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-white border border-stone-200/80 hover:border-amber-400/60 p-5 flex flex-col justify-between transition-all duration-500 hover:shadow-xl hover:shadow-stone-900/5 hover:-translate-y-1"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden mb-5 bg-stone-100 aspect-[4/3]">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 border border-stone-200 text-[10px] uppercase tracking-wider text-[#8C6A28] font-semibold shadow-xs">
                    {item.badge}
                  </div>
                  <button
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/95 border border-stone-200 text-stone-500 hover:text-rose-500 transition-colors shadow-xs"
                    aria-label="Wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onSelectModel(item.modelType);
                      const el = document.getElementById('custom-design');
                      if (el) {
                        const lenis = (window as any).__lenis;
                        if (lenis) {
                          lenis.scrollTo(el, { offset: -80, duration: 1.2 });
                        } else {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="absolute bottom-3 inset-x-3 py-2.5 rounded-xl bg-[#1C1917]/95 hover:bg-[#8C6A28] text-white border border-stone-800 text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in 3D Atelier</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6A28] font-bold">
                    {item.collection}
                  </span>
                  <h4 className="font-serif text-lg font-semibold text-[#1C1917] group-hover:text-[#8C6A28] transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-stone-500 font-normal">
                    {item.cut} • {item.carat.toFixed(2)} ct • {item.metalLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">Price</span>
                  <span className="font-serif text-base font-bold text-[#8C6A28]">{item.price}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart({
                          modelType: item.modelType,
                          title: item.name,
                          metal: item.metal,
                          gem: 'diamond',
                          carat: item.carat,
                          prongStyle: '4-claw',
                          engravingText: '',
                          price: item.price,
                        });
                      }
                    }}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-[#1C1917] text-stone-700 hover:text-white border border-stone-200 transition-all cursor-pointer shadow-xs"
                    title="Add to Bespoke Bag"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenInquiry) {
                        onOpenInquiry({
                          productId: item.id,
                          productName: item.name,
                          productImage: item.image,
                          category: item.category,
                          specifications: `${item.cut} • ${item.carat.toFixed(2)} ct • ${item.metalLabel}`,
                        });
                      }
                    }}
                    className="px-3 py-2 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs tracking-wider uppercase font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Send Product Inquiry"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </button>

                  <button
                    onClick={onOpenConsultation}
                    className="px-3 py-2 rounded-full bg-amber-50 hover:bg-[#1C1917] text-[#8C6A28] hover:text-white border border-amber-300/80 hover:border-[#1C1917] text-xs tracking-wider uppercase font-semibold transition-all shadow-xs"
                  >
                    Consult
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
