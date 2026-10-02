import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Search,
  Filter,
  Calculator,
  Flame,
  X,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import type { CartItem } from './LuxuryCartDrawer';
import type { InquiryProductContext } from './ProductInquiryModal';
import { productsApi, type CatalogProduct } from '../api/products.api';

interface CuratedSpotlightProps {
  onSelectModel: (model: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet') => void;
  onOpenConsultation: () => void;
  onAddToCart?: (item: CartItem) => void;
  onOpenInquiry?: (product: InquiryProductContext) => void;
}

export const CuratedSpotlight: FC<CuratedSpotlightProps> = ({
  onSelectModel: _onSelectModel,
  onOpenConsultation: _onOpenConsultation,
  onAddToCart,
  onOpenInquiry,
}) => {
  // Filters state
  const [search, setSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState<string>('');
  const [purityFilter, setPurityFilter] = useState<string>('');
  const [weightFilter, setWeightFilter] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');

  // Products from API
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  // Price Breakdown Modal State
  const [selectedProductBreakdown, setSelectedProductBreakdown] = useState<{
    product: CatalogProduct;
    breakdown: any;
  } | null>(null);

  // Fetch products with backend dynamic pricing & filtering
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productsApi.getAll({
        search: search || undefined,
        metalType: metalFilter || undefined,
        purity: purityFilter || undefined,
        weightRange: weightFilter || undefined,
        priceRange: priceFilter || undefined,
        limit: 30,
      });

      if (res.data?.data) {
        setProducts(res.data.data);
        setTotalProducts(res.data.meta?.total ?? res.data.total ?? res.data.data.length);
      }
    } catch (err) {
      console.warn('Could not load live catalog products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, metalFilter, purityFilter, weightFilter, priceFilter]);

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setMetalFilter('');
    setPurityFilter('');
    setWeightFilter('');
    setPriceFilter('');
  };

  const hasActiveFilters = Boolean(
    search || metalFilter || purityFilter || weightFilter || priceFilter
  );

  return (
    <section id="collections" className="py-20 sm:py-28 relative overflow-hidden bg-[#FAF8F5]">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none ambient-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-[#8C6A28] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#B89047]" />
              <span>DYNAMIC BENCHMARK JEWELLERY SHOWCASE</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] tracking-tight">
              MASTER REGISTERED COLLECTION
            </h2>
          </div>
          <div className="mt-4 md:mt-0 max-w-md">
            <p className="text-xs text-stone-600 font-light leading-relaxed">
              Every creation is dynamically valued in real time against live Gold and Silver bullion market rates, certified by BIS hallmark authorities.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#8C6A28] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Centralized Real-Time Metal Rate Engine Active</span>
            </div>
          </div>
        </div>

        {/* ── Multi-Criteria Search & Filter Suite ── */}
        <div className="bg-white/80 backdrop-blur-md border border-stone-200/90 rounded-2xl p-4 sm:p-5 mb-10 shadow-sm space-y-4">
          {/* Row 1: Search & Metal Selector */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by jewellery piece, SKU, or purity (e.g. Necklace, 22K, GC-24K)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/30 focus:border-[#8C6A28] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metal Quick Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mr-1 hidden sm:inline">
                Metal:
              </span>
              {[
                { label: 'All Metals', value: '' },
                { label: 'Gold', value: 'GOLD' },
                { label: 'Silver', value: 'SILVER' },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setMetalFilter(m.value);
                    setPurityFilter('');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                    metalFilter === m.value
                      ? 'bg-[#1C1917] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Secondary Dropdowns (Purity, Weight Range, Price Range) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
            {/* Dynamic Purity Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                Purity Specification
              </label>
              <select
                value={purityFilter}
                onChange={(e) => setPurityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 font-medium focus:ring-2 focus:ring-[#8C6A28]/20 focus:border-[#8C6A28] cursor-pointer"
              >
                {metalFilter === 'GOLD' ? (
                  <>
                    <option value="">All Gold Purities</option>
                    <option value="K24">24K (99.9% Pure)</option>
                    <option value="K22">22K (91.6% Hallmark 916)</option>
                    <option value="K18">18K (75.0% Fine)</option>
                    <option value="K14">14K (58.5% Everyday)</option>
                  </>
                ) : metalFilter === 'SILVER' ? (
                  <>
                    <option value="">All Silver Purities</option>
                    <option value="SILVER_999">999 Fine Bullion</option>
                    <option value="SILVER_925">925 Sterling Silver</option>
                  </>
                ) : (
                  <>
                    <option value="">All Purities (Gold &amp; Silver)</option>
                    <option value="K24">Gold 24K (999)</option>
                    <option value="K22">Gold 22K (916)</option>
                    <option value="K18">Gold 18K (750)</option>
                    <option value="SILVER_999">Silver 999 Fine</option>
                    <option value="SILVER_925">Silver 925 Sterling</option>
                  </>
                )}
              </select>
            </div>

            {/* Weight Range Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                Metal Weight (Grams)
              </label>
              <select
                value={weightFilter}
                onChange={(e) => setWeightFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 font-medium focus:ring-2 focus:ring-[#8C6A28]/20 focus:border-[#8C6A28] cursor-pointer"
              >
                <option value="">All Weight Tiers</option>
                <option value="0-5">0 – 5 grams</option>
                <option value="5-10">5 – 10 grams</option>
                <option value="10-20">10 – 20 grams</option>
                <option value="20-50">20 – 50 grams</option>
                <option value="50+">50+ grams (Heavy Sets)</option>
              </select>
            </div>

            {/* Dynamic Calculated Price Range Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                Live Selling Price
              </label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 font-medium focus:ring-2 focus:ring-[#8C6A28]/20 focus:border-[#8C6A28] cursor-pointer"
              >
                <option value="">All Price Ranges</option>
                <option value="under-25k">Under ₹25,000</option>
                <option value="25k-50k">₹25,000 – ₹50,000</option>
                <option value="50k-100k">₹50,000 – ₹1,00,000</option>
                <option value="100k+">₹1,00,000 &amp; Above</option>
              </select>
            </div>

            {/* Reset Actions / Status */}
            <div className="flex items-end">
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All ({[search, metalFilter, purityFilter, weightFilter, priceFilter].filter(Boolean).length})</span>
                </button>
              ) : (
                <div className="text-[11px] text-stone-400 py-2 text-center w-full">
                  Showing {products.length} of {totalProducts} live items
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Product Cards Grid ── */}
        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8C6A28] mx-auto mb-3" />
            <p className="text-stone-600 text-sm font-medium">Recalculating live catalogue prices...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
            <Filter className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-semibold text-stone-800">No matching jewellery items</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              We couldn't find items matching your filter criteria. Try adjusting the purity, weight, or price ranges.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-semibold uppercase tracking-wider"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((item) => {
              const livePrice = item.currentPrice || (item.pricingMode === 'FIXED' ? Number(item.fixedPrice) : 0);
              const grossWt = Number(item.grossWeight || 0);
              const netWt = Number(item.netMetalWeight || item.grossWeight || 0);
              const thumbImg =
                item.media?.[0]?.url ||
                (item.metalType === 'SILVER'
                  ? 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
                  : 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80');

              return (
                <div
                  key={item.id}
                  className="group rounded-3xl bg-white border border-stone-200 hover:border-amber-400/80 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/5 hover:-translate-y-1"
                >
                  <div>
                    {/* Media / Thumbnail */}
                    <div className="relative rounded-2xl overflow-hidden mb-4 bg-stone-100 aspect-[4/3]">
                      <img
                        src={thumbImg}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Metal & Purity Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1C1917]/90 backdrop-blur-xs text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>{item.metalType} {item.purity}</span>
                      </div>

                      {/* Weight Badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 border border-stone-200 text-stone-700 text-[10px] font-mono font-semibold shadow-xs">
                        Net: {netWt.toFixed(2)}g
                      </div>

                      {/* 12-Step Price Breakdown Overlay Button */}
                      <button
                        onClick={() =>
                          setSelectedProductBreakdown({
                            product: item,
                            breakdown: item.priceBreakdown,
                          })
                        }
                        className="absolute bottom-3 inset-x-3 py-2.5 rounded-xl bg-white/95 hover:bg-[#1C1917] text-stone-900 hover:text-white border border-stone-200 text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5 text-[#8C6A28] group-hover:text-amber-400" />
                        <span>View Transparent Price Receipt</span>
                      </button>
                    </div>

                    {/* Product Metadata */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 font-semibold">
                        <span>SKU: {item.sku}</span>
                        {item.hallmarkNumber && <span>HUID: {item.hallmarkNumber}</span>}
                      </div>

                      <h4 className="font-serif text-lg font-semibold text-[#1C1917] group-hover:text-[#8C6A28] transition-colors line-clamp-1">
                        {item.name}
                      </h4>

                      {/* Weights & Purity Specs */}
                      <div className="flex items-center gap-3 text-xs text-stone-500 font-mono pt-1">
                        <span>Gross: <strong className="text-stone-700">{grossWt.toFixed(2)}g</strong></span>
                        <span>•</span>
                        <span>Net Metal: <strong className="text-[#8C6A28]">{netWt.toFixed(2)}g</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Dynamic Price & Actions */}
                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live Metal Valuation</span>
                      </div>
                      <div className="font-serif text-xl sm:text-2xl font-bold text-[#8C6A28]">
                        ₹{livePrice.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Price Receipt Button */}
                      <button
                        onClick={() =>
                          setSelectedProductBreakdown({
                            product: item,
                            breakdown: item.priceBreakdown,
                          })
                        }
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8C6A28] border border-amber-200 transition-all cursor-pointer shadow-xs"
                        title="View Price Breakdown Receipt"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>

                      {/* Add to Bag */}
                      <button
                        onClick={() => {
                          if (onAddToCart) {
                            onAddToCart({
                              modelType: 'solitaire-ring',
                              title: item.name,
                              metal: item.metalType === 'SILVER' ? 'yellow-gold' : 'yellow-gold',
                              gem: 'diamond',
                              carat: 1.0,
                              prongStyle: '4-claw',
                              engravingText: '',
                              price: `₹${livePrice.toLocaleString('en-IN')}`,
                              productId: item.id,
                              rawPrice: livePrice,
                              weightGrams: netWt,
                              purity: item.purity,
                              breakdown: item.priceBreakdown,
                            });
                          }
                        }}
                        className="p-2 rounded-xl bg-stone-900 hover:bg-[#8C6A28] text-white transition-all cursor-pointer shadow-xs"
                        title="Add to Bespoke Bag"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>

                      {/* Send Inquiry */}
                      <button
                        onClick={() => {
                          if (onOpenInquiry) {
                            onOpenInquiry({
                              productId: item.id,
                              productName: item.name,
                              productImage: thumbImg,
                              category: item.category?.name || item.metalType,
                              specifications: `${item.metalType} ${item.purity} • ${netWt.toFixed(2)}g Net • ₹${livePrice.toLocaleString('en-IN')}`,
                            });
                          }
                        }}
                        className="px-3 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        title="Direct Artisan Inquiry"
                      >
                        Inquire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Transparent Price Breakdown Receipt Modal ── */}
      {selectedProductBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#8C6A28]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Central Pricing Engine • BIS Verified</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] mt-1">
                  {selectedProductBreakdown.product.name}
                </h3>
                <div className="text-xs text-stone-500 font-mono mt-0.5">
                  SKU: {selectedProductBreakdown.product.sku} · {selectedProductBreakdown.product.metalType}{' '}
                  {selectedProductBreakdown.product.purity}
                </div>
              </div>
              <button
                onClick={() => setSelectedProductBreakdown(null)}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Component Breakdown */}
            <div className="py-4 space-y-3 font-mono text-xs">
              {/* Benchmark Rate Line */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-sans font-semibold text-amber-900 block text-[11px]">
                    Today's Benchmark Bullion Rate
                  </span>
                  <span className="text-[10px] text-amber-700">
                    {selectedProductBreakdown.product.metalType} {selectedProductBreakdown.product.purity}
                  </span>
                </div>
                <span className="text-base font-bold text-amber-950">
                  ₹{Number(selectedProductBreakdown.breakdown?.metalRatePerGram || 0).toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal">/ g</span>
                </span>
              </div>

              {/* Weights & Calculation */}
              <div className="space-y-2 pt-1 text-stone-600">
                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <span className="font-sans text-stone-600">Net Metal Weight</span>
                  <span className="font-semibold text-stone-900">
                    {Number(selectedProductBreakdown.breakdown?.netMetalWeight || selectedProductBreakdown.product.netMetalWeight).toFixed(3)} grams
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <span className="font-sans text-stone-600">
                    Base Metal Value ({selectedProductBreakdown.breakdown?.netMetalWeight}g × ₹{selectedProductBreakdown.breakdown?.metalRatePerGram})
                  </span>
                  <span className="font-semibold text-stone-900">
                    ₹{Number(selectedProductBreakdown.breakdown?.metalValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {Number(selectedProductBreakdown.breakdown?.wastageValue || 0) > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="font-sans text-stone-600">
                      Wastage Charge ({selectedProductBreakdown.breakdown?.wastagePercent}%)
                    </span>
                    <span className="font-semibold text-stone-900">
                      ₹{Number(selectedProductBreakdown.breakdown?.wastageValue).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <span className="font-sans text-stone-600">
                    Making Charges ({selectedProductBreakdown.breakdown?.makingChargeType === 'PER_GRAM' ? 'Per Gram Rate' : 'Flat Crafting'})
                  </span>
                  <span className="font-semibold text-stone-900">
                    ₹{Number(selectedProductBreakdown.breakdown?.makingChargesAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {Number(selectedProductBreakdown.breakdown?.serviceCharges || 0) > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="font-sans text-stone-600">Hallmarking &amp; Assaying Surcharge</span>
                    <span className="font-semibold text-stone-900">
                      ₹{Number(selectedProductBreakdown.breakdown?.serviceCharges).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1.5 bg-stone-50 px-2 rounded-lg font-sans">
                  <span className="font-semibold text-stone-800">Taxable Subtotal</span>
                  <span className="font-mono font-bold text-stone-900">
                    ₹{Number(selectedProductBreakdown.breakdown?.taxableAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <span className="font-sans text-stone-600">GST ({selectedProductBreakdown.breakdown?.gstRatePercent || 3}%)</span>
                  <span className="font-semibold text-stone-900">
                    ₹{Number(selectedProductBreakdown.breakdown?.gstAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Total Selling Price */}
              <div className="mt-4 p-4 rounded-2xl bg-[#1C1917] text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-widest uppercase text-amber-300 font-sans block">
                    Authoritative Dynamic Selling Price
                  </span>
                  <span className="text-[11px] text-stone-400 font-sans">
                    Includes all making charges, hallmarking &amp; 3% GST
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  ₹{Number(selectedProductBreakdown.breakdown?.finalPriceRounded || selectedProductBreakdown.product.currentPrice).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 flex gap-2">
              <button
                onClick={() => {
                  const p = selectedProductBreakdown.product;
                  const price = p.currentPrice || 0;
                  if (onAddToCart) {
                    onAddToCart({
                      modelType: 'solitaire-ring',
                      title: p.name,
                      metal: p.metalType === 'SILVER' ? 'yellow-gold' : 'yellow-gold',
                      gem: 'diamond',
                      carat: 1.0,
                      prongStyle: '4-claw',
                      engravingText: '',
                      price: `₹${price.toLocaleString('en-IN')}`,
                      productId: p.id,
                      rawPrice: price,
                      weightGrams: Number(p.netMetalWeight || p.grossWeight),
                      purity: p.purity,
                      breakdown: p.priceBreakdown,
                    });
                  }
                  setSelectedProductBreakdown(null);
                }}
                className="flex-1 py-3 rounded-full bg-[#8C6A28] hover:bg-[#6D531F] text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag at Current Rate</span>
              </button>
              <button
                onClick={() => setSelectedProductBreakdown(null)}
                className="px-5 py-3 rounded-full border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
