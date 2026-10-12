import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Search,
  Filter,
  Calculator,
  X,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import type { CartItem } from './LuxuryCartDrawer';
import type { InquiryProductContext } from './ProductInquiryModal';
import { productsApi, type CatalogProduct } from '../api/products.api';
import { LuxuryDropdown, type LuxuryDropdownOption } from './LuxuryDropdown';

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state (Synced with URL)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const categoryFilter = searchParams.get('category') || '';
  const metalFilter = searchParams.get('metal') || '';
  const purityFilter = searchParams.get('purity') || '';
  const weightFilter = searchParams.get('weight') || '';
  const priceFilter = searchParams.get('price') || '';
  const sortFilter = searchParams.get('sort') || 'featured';

  // We need to provide setters that ALSO update the URL so the local components still work
  const setCategoryFilter = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('category', val); else params.delete('category');
    setSearchParams(params);
  };
  const setMetalFilter = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('metal', val); else params.delete('metal');
    setSearchParams(params);
  };
  const setPurityFilter = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('purity', val); else params.delete('purity');
    setSearchParams(params);
  };
  const setWeightFilter = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('weight', val); else params.delete('weight');
    setSearchParams(params);
  };
  const setPriceFilter = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('price', val); else params.delete('price');
    setSearchParams(params);
  };
  const setSortFilter = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('sort', val); else params.delete('sort');
    setSearchParams(params);
  };

  // Products from API
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  // Price Breakdown & Media Modal State
  const [selectedProductBreakdown, setSelectedProductBreakdown] = useState<{
    product: CatalogProduct;
    breakdown: any;
  } | null>(null);

  // Freeze background page scroll and pause Lenis when price breakdown modal is open
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (selectedProductBreakdown) {
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    } else {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }
    return () => {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    };
  }, [selectedProductBreakdown]);

  // Fetch products with backend dynamic pricing & filtering
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const searchQuery = [search, categoryFilter].filter(Boolean).join(' ');
      let sortBy = 'createdAt';
      let sortOrder: 'ASC' | 'DESC' = 'DESC';
      if (sortFilter === 'price-asc') {
        sortBy = 'fixedPrice';
        sortOrder = 'ASC';
      } else if (sortFilter === 'price-desc') {
        sortBy = 'fixedPrice';
        sortOrder = 'DESC';
      } else if (sortFilter === 'weight-desc') {
        sortBy = 'grossWeight';
        sortOrder = 'DESC';
      } else if (sortFilter === 'weight-asc') {
        sortBy = 'grossWeight';
        sortOrder = 'ASC';
      } else if (sortFilter === 'name-asc') {
        sortBy = 'name';
        sortOrder = 'ASC';
      }

      const res = await productsApi.getAll({
        search: searchQuery || undefined,
        metalType: metalFilter || undefined,
        purity: purityFilter || undefined,
        weightRange: weightFilter || undefined,
        priceRange: priceFilter || undefined,
        sortBy,
        sortOrder,
        limit: 30,
      });

      if (res.data?.data) {
        let list = [...res.data.data];
        if (sortFilter === 'price-asc') {
          list.sort(
            (a, b) =>
              (a.currentPrice || a.priceBreakdown?.finalSellingPrice || a.fixedPrice || 0) -
              (b.currentPrice || b.priceBreakdown?.finalSellingPrice || b.fixedPrice || 0)
          );
        } else if (sortFilter === 'price-desc') {
          list.sort(
            (a, b) =>
              (b.currentPrice || b.priceBreakdown?.finalSellingPrice || b.fixedPrice || 0) -
              (a.currentPrice || a.priceBreakdown?.finalSellingPrice || a.fixedPrice || 0)
          );
        } else if (sortFilter === 'weight-desc') {
          list.sort((a, b) => Number(b.grossWeight || 0) - Number(a.grossWeight || 0));
        } else if (sortFilter === 'weight-asc') {
          list.sort((a, b) => Number(a.grossWeight || 0) - Number(b.grossWeight || 0));
        } else if (sortFilter === 'name-asc') {
          list.sort((a, b) => a.name.localeCompare(b.name));
        }
        setProducts(list);
        setTotalProducts(res.data.meta?.total ?? res.data.total ?? list.length);
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
  }, [search, categoryFilter, metalFilter, purityFilter, weightFilter, priceFilter, sortFilter]);

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setMetalFilter('');
    setPurityFilter('');
    setWeightFilter('');
    setPriceFilter('');
    setSortFilter('featured');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search || categoryFilter || metalFilter || purityFilter || weightFilter || priceFilter || (sortFilter && sortFilter !== 'featured')
  );

  const getProductImage = (item: CatalogProduct) => {
    return (
      item.media?.[0]?.url ||
      (item.metalType === 'SILVER'
        ? 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80')
    );
  };

  const categoryOptions: LuxuryDropdownOption[] = [
    { value: '', label: 'View All Categories', sublabel: 'Explore Complete Catalog', icon: '✨' },
    { value: 'earring', label: 'EARRINGS', icon: '✨' },
    { value: 'bracelet', label: 'BRACELET', icon: '💫' },
    { value: 'necklace', label: 'NECKLACE', icon: '📿' },
    { value: 'ring', label: 'RINGS', icon: '💍' },
    { value: 'bangle', label: 'BANGLES', icon: '💫' },
  ];

  const metalOptions: LuxuryDropdownOption[] = [
    { value: '', label: 'All Metals', sublabel: 'Gold & Silver' },
    { value: 'GOLD', label: 'Fine Gold', sublabel: '24K, 22K, 18K, 14K' },
    { value: 'SILVER', label: 'Sterling Silver', sublabel: '999 & 925' },
  ];

  const purityOptions: LuxuryDropdownOption[] =
    metalFilter === 'GOLD'
      ? [
          { value: '', label: 'All Gold Purities', sublabel: '24K, 22K, 18K & 14K Purities' },
          { value: 'K24', label: '24K Fine Gold', sublabel: '99.9% Pure Investment Bullion', badge: '999 Pure' },
          { value: 'K22', label: '22K Traditional', sublabel: '91.6% BIS Hallmark 916 Bridal', badge: 'BIS 916' },
          { value: 'K18', label: '18K Fine Joaillerie', sublabel: '75.0% Diamond Setting Gold', badge: '18K 750' },
          { value: 'K14', label: '14K Everyday Fine', sublabel: '58.5% Contemporary Fine Wear', badge: '14K 585' },
        ]
      : metalFilter === 'SILVER'
      ? [
          { value: '', label: 'All Silver Purities', sublabel: '999 Bullion & 925 Sterling' },
          { value: 'SILVER_999', label: '999 Fine Bullion Silver', sublabel: '99.9% Pure Solid Bullion', badge: '999 Fine' },
          { value: 'SILVER_925', label: '925 Sterling Silver', sublabel: '92.5% Solid Hallmarked Silver', badge: 'Sterling' },
        ]
      : [
          { value: '', label: 'All Purities (Gold & Silver)', sublabel: 'Complete Hallmark Catalog' },
          { value: 'K24', label: 'Gold 24K (999 Pure)', sublabel: '99.9% Pure Investment Gold', badge: '24K' },
          { value: 'K22', label: 'Gold 22K (916 Hallmark)', sublabel: '91.6% BIS Certified Hallmark', badge: '22K' },
          { value: 'K18', label: 'Gold 18K (750 Fine)', sublabel: '75.0% Fine Joaillerie Gold', badge: '18K' },
          { value: 'SILVER_999', label: 'Silver 999 Bullion', sublabel: '99.9% Pure Fine Silver', badge: '999' },
          { value: 'SILVER_925', label: 'Silver 925 Sterling', sublabel: '92.5% Solid Sterling Silver', badge: '925' },
        ];

  const weightOptions: LuxuryDropdownOption[] = [
    { value: '', label: 'All Weight Tiers', sublabel: 'All Gram Weights Included' },
    { value: '0-5', label: '0 – 5 grams', sublabel: 'Delicate & Minimalist Pieces', badge: '0-5g' },
    { value: '5-10', label: '5 – 10 grams', sublabel: 'Classic Daily Wear Elegance', badge: '5-10g' },
    { value: '10-20', label: '10 – 20 grams', sublabel: 'Substantial Artisan Statements', badge: '10-20g' },
    { value: '20-50', label: '20 – 50 grams', sublabel: 'Heirloom & Festive Sets', badge: '20-50g' },
    { value: '50+', label: '50+ grams', sublabel: 'Grand Masterpiece Creations', badge: '50g+' },
  ];

  const priceOptions: LuxuryDropdownOption[] = [
    { value: '', label: 'All Price Ranges', sublabel: 'Every Valuation Category' },
    { value: 'under-25k', label: 'Under ₹25,000', sublabel: 'Accessible Fine Jewellery', badge: '< 25K' },
    { value: '25k-50k', label: '₹25,000 – ₹50,000', sublabel: 'Mid-Tier Classic Collections', badge: '25K–50K' },
    { value: '50k-100k', label: '₹50,000 – ₹1,00,000', sublabel: 'Premium Fine Jewellery', badge: '50K–100K' },
    { value: '100k+', label: '₹1,00,000 & Above', sublabel: 'High Jewellery Masterpieces', badge: '100K+' },
  ];

  const sortOptions: LuxuryDropdownOption[] = [
    { value: 'featured', label: 'Curated & Featured', sublabel: "Atelier Editor's Selection", badge: 'Default' },
    { value: 'price-asc', label: 'Price: Low to High', sublabel: 'Ascending Live MRP Valuation', badge: '₹ ↑' },
    { value: 'price-desc', label: 'Price: High to Low', sublabel: 'High-Value Masterpieces First', badge: '₹ ↓' },
    { value: 'weight-desc', label: 'Weight: Heavy to Light', sublabel: 'Substantial Metal Weight First', badge: 'g ↓' },
    { value: 'weight-asc', label: 'Weight: Light to Heavy', sublabel: 'Delicate Gram Weights First', badge: 'g ↑' },
    { value: 'name-asc', label: 'Alphabetical: A to Z', sublabel: 'Design Code & Title', badge: 'A-Z' },
  ];

  return (
    <section id="collections" className="py-16 sm:py-24 lg:py-28 relative overflow-hidden bg-[#F9F5EC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Section Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1A17] tracking-tight">
              Bestseller Products
            </h2>
          </div>

          <div className="max-w-lg lg:text-right">
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              Every creation is dynamically valued in real time against live Gold and Silver bullion market rates, certified by BIS hallmark authorities.
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Bullion Market Valuation Active</span>
            </div>
          </div>
        </div>

        {/* ── Multi-Criteria Search & Filter Suite (Fully Responsive Luxury Design) ── */}
        <div className="relative z-30 bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm space-y-4 sm:space-y-5">
          {/* Search Input Row */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search piece, SKU, or purity (e.g. Necklace, 22K, Solitaire)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-stone-200/90 bg-stone-50/70 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6A28]/20 focus:border-[#8C6A28] focus:bg-white transition-all shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Luxury Custom Dropdowns Suite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 pt-3.5 sm:pt-4 border-t border-stone-100">
            <LuxuryDropdown
              label="Piece Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              placeholder="View All Categories"
            />

            <LuxuryDropdown
              label="Metal Selection"
              value={metalFilter}
              onChange={(val) => {
                setMetalFilter(val);
                setPurityFilter(''); // Reset purity when metal changes
              }}
              options={metalOptions}
              placeholder="All Metals"
            />

            <LuxuryDropdown
              label="Purity Specification"
              value={purityFilter}
              onChange={setPurityFilter}
              options={purityOptions}
              placeholder="All Purities"
            />

            <LuxuryDropdown
              label="Metal Weight"
              value={weightFilter}
              onChange={setWeightFilter}
              options={weightOptions}
              placeholder="All Weights"
            />

            <LuxuryDropdown
              label="Live Price Range"
              value={priceFilter}
              onChange={setPriceFilter}
              options={priceOptions}
              placeholder="All Prices"
            />

            <LuxuryDropdown
              label="Curated Sorting"
              value={sortFilter}
              onChange={setSortFilter}
              options={sortOptions}
              placeholder="Featured"
              icon={<ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />}
            />
          </div>

          {/* Row 3: Active Filter Chips & Item Count Bar */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Items Count with Live Marker */}
            <div className="flex items-center gap-2 text-stone-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>
                Showing <strong className="text-stone-900">{products.length}</strong> of{' '}
                <strong className="text-stone-900">{totalProducts}</strong> live items
              </span>
            </div>

            {/* Active Chips & Reset Button */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5">
                {search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Search: "{search}"
                    <button type="button" onClick={() => setSearch('')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Category: {categoryFilter}
                    <button type="button" onClick={() => setCategoryFilter('')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {metalFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Metal: {metalFilter}
                    <button type="button" onClick={() => setMetalFilter('')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {purityFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Purity: {purityFilter}
                    <button type="button" onClick={() => setPurityFilter('')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {weightFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Weight: {weightFilter}g
                    <button type="button" onClick={() => setWeightFilter('')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {priceFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Price: {priceFilter}
                    <button type="button" onClick={() => setPriceFilter('')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sortFilter && sortFilter !== 'featured' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 text-[11px] font-medium">
                    Sort: {sortOptions.find((s) => s.value === sortFilter)?.label || sortFilter}
                    <button type="button" onClick={() => setSortFilter('featured')} className="hover:text-stone-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Product Cards Grid (Fully Responsive) ── */}
        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8C6A28] mx-auto mb-3" />
            <p className="text-stone-600 text-sm font-medium">Recalculating live catalogue prices...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
            <Filter className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-semibold text-stone-800">No matching jewellery items</h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              We couldn't find items matching your filter criteria. Try adjusting the purity, weight, or price ranges.
            </p>
            <button
              onClick={resetFilters}
              className="mt-5 px-5 py-2.5 rounded-full bg-[#1C1917] hover:bg-[#8C6A28] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((item) => {
              const livePrice = item.currentPrice || (item.pricingMode === 'FIXED' ? Number(item.fixedPrice) : 0);
              const grossWt = Number(item.grossWeight || 0);
              const netWt = Number(item.netMetalWeight || item.grossWeight || 0);
              const thumbImg = getProductImage(item);

              return (
                <div
                  key={item.id}
                  className="group rounded-3xl bg-white border border-stone-200 hover:border-amber-400/80 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/5 hover:-translate-y-1"
                >
                  <div>
                    {/* ── 100% CLEAN IMAGE (ZERO TEXT DATA OVERLAY) ── */}
                    {/* Clicking anywhere on the product image triggers the responsive breakdown modal */}
                    <div
                      onClick={() =>
                        setSelectedProductBreakdown({
                          product: item,
                          breakdown: item.priceBreakdown,
                        })
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedProductBreakdown({
                            product: item,
                            breakdown: item.priceBreakdown,
                          });
                        }
                      }}
                      className="relative rounded-2xl overflow-hidden mb-4 bg-stone-100 aspect-[4/3] cursor-pointer group/img block shadow-inner"
                      title="Click to view detailed price breakdown receipt and specifications"
                    >
                      <img
                        src={thumbImg}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>

                    {/* Product Metadata Cleanly Arranged Below Image */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 font-semibold">
                        <span>SKU: {item.sku}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#8C6A28] border border-amber-200 font-mono text-[10px] font-bold">
                          {item.metalType} {item.purity}
                        </span>
                      </div>

                      <h4
                        onClick={() =>
                          setSelectedProductBreakdown({
                            product: item,
                            breakdown: item.priceBreakdown,
                          })
                        }
                        className="font-serif text-base sm:text-lg font-semibold text-[#1C1917] hover:text-[#8C6A28] transition-colors line-clamp-1 cursor-pointer"
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      {/* Weights & Purity Specs */}
                      <div className="flex items-center gap-2.5 text-xs text-stone-500 font-mono pt-0.5">
                        <span>Gross: <strong className="text-stone-700">{grossWt.toFixed(2)}g</strong></span>
                        <span>•</span>
                        <span>Net Metal: <strong className="text-[#8C6A28]">{netWt.toFixed(2)}g</strong></span>
                        {item.hallmarkNumber && (
                          <>
                            <span>•</span>
                            <span className="text-stone-400 truncate max-w-[90px]" title={`HUID: ${item.hallmarkNumber}`}>
                              HUID: {item.hallmarkNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Dynamic Price & Actions (Clean, Non-wrapping on All Screen Sizes) */}
                  <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live Valuation</span>
                      </div>
                      <div className="font-serif text-xl sm:text-2xl font-bold text-[#8C6A28]">
                        ₹{livePrice.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Price Receipt Button */}
                      <button
                        onClick={() =>
                          setSelectedProductBreakdown({
                            product: item,
                            breakdown: item.priceBreakdown,
                          })
                        }
                        className="p-2 sm:p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8C6A28] border border-amber-200 transition-all cursor-pointer shadow-xs"
                        title="View Transparent Price Breakdown Receipt"
                        aria-label="View Price Receipt"
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
                        className="p-2 sm:p-2.5 rounded-xl bg-stone-900 hover:bg-[#8C6A28] text-white transition-all cursor-pointer shadow-xs"
                        title="Add to Bespoke Bag"
                        aria-label="Add to Bag"
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
                        className="px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
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

      {/* ── Responsive Product Media & Dynamic Price Receipt Modal ── */}
      {selectedProductBreakdown && (() => {
        const p = selectedProductBreakdown.product;
        const b = selectedProductBreakdown.breakdown || {};
        const thumbImg = getProductImage(p);

        // Authoritative Dynamic Calculations for THIS specific product
        const rawP = p as any;
        const metalRate = Number(b.metalRatePerGram || rawP.metalRate?.ratePerGram || 0);
        const netMetalWeight = Number(b.netMetalWeight || p.netMetalWeight || p.grossWeight || 0);
        const metalValue = Number(b.metalValue || (netMetalWeight * metalRate));
        const wastageVal = Number(b.wastageValue || 0);
        const wastagePct = Number(b.wastagePercent || rawP.wastagePercent || 0);
        const makingVal = Number(b.makingChargesAmount || b.makingChargeValue || rawP.makingChargeValue || 0);
        const makingType = b.makingChargeType || rawP.makingChargeType || 'FLAT';
        const serviceVal = Number(b.serviceCharges || rawP.serviceCharges || 0);
        const taxableVal = Number(b.taxableAmount || (metalValue + wastageVal + makingVal + serviceVal));
        const gstPct = Number(b.gstRatePercent || 3);
        const gstVal = Number(b.gstAmount || (taxableVal * (gstPct / 100)));
        const finalVal = Number(b.finalPriceRounded || b.finalPrice || p.currentPrice || rawP.calculatedPrice || Math.round(taxableVal + gstVal));

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-3 sm:p-5 lg:p-8 animate-in fade-in duration-200"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] sm:max-h-[92dvh] flex flex-col border border-stone-200/90 shadow-2xl relative overflow-hidden"
              data-lenis-prevent="true"
            >
              {/* Modal Top Navigation Bar */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-200 bg-stone-50/80 shrink-0">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#8C6A28]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Central Pricing Engine • BIS Verified</span>
                </div>
                <button
                  onClick={() => setSelectedProductBreakdown(null)}
                  className="p-1.5 rounded-full bg-white hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors shadow-xs cursor-pointer"
                  aria-label="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Split 2-Column on Desktop / Smoothly Scrollable on All Devices */}
              <div
                className="overflow-y-auto p-5 sm:p-6 lg:p-8 flex-1 overscroll-contain"
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Responsive Pristine Media Showcase */}
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-square border border-stone-200/80 shadow-inner">
                      <img
                        src={thumbImg}
                        alt={p.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    {p.description && (
                      <p className="text-xs text-stone-600 font-light leading-relaxed px-1">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Dynamic Authoritative Price Receipt Breakdown */}
                  <div className="flex flex-col space-y-4">
                    {/* Product Title & Identifiers */}
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] leading-snug">
                        {p.name}
                      </h3>
                      <div className="text-xs text-stone-500 font-mono mt-1 flex flex-wrap items-center gap-2">
                        <span>SKU: {p.sku}</span>
                        <span>·</span>
                        <span className="text-[#8C6A28] font-bold">
                          {p.metalType} {p.purity}
                        </span>
                        {p.hallmarkNumber && (
                          <>
                            <span>·</span>
                            <span>HUID: {p.hallmarkNumber}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Today's Benchmark Bullion Rate Card */}
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-sans font-semibold text-amber-900 block text-[11px] uppercase tracking-wider">
                          Today's Benchmark Bullion Rate
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono font-semibold">
                          {p.metalType} {p.purity}
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold font-mono text-amber-950">
                        ₹{metalRate.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-amber-800">/ g</span>
                      </span>
                    </div>

                    {/* Itemized Calculation Line Items */}
                    <div className="space-y-2.5 font-mono text-xs text-stone-600">
                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="font-sans text-stone-600">Net Metal Weight</span>
                        <span className="font-semibold text-stone-900">
                          {netMetalWeight.toFixed(3)} grams
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="font-sans text-stone-600">
                          Base Metal Value ({netMetalWeight}g × ₹{metalRate})
                        </span>
                        <span className="font-semibold text-stone-900">
                          ₹{metalValue.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {wastageVal > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-stone-100">
                          <span className="font-sans text-stone-600">
                            Wastage Charge ({wastagePct}%)
                          </span>
                          <span className="font-semibold text-stone-900">
                            ₹{wastageVal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="font-sans text-stone-600">
                          Making Charges ({makingType === 'PER_GRAM' ? 'Per Gram' : 'Flat Crafting'})
                        </span>
                        <span className="font-semibold text-stone-900">
                          ₹{makingVal.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {serviceVal > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-stone-100">
                          <span className="font-sans text-stone-600">
                            Hallmarking &amp; Assaying Surcharge
                          </span>
                          <span className="font-semibold text-stone-900">
                            ₹{serviceVal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 bg-stone-50 px-3 rounded-xl font-sans">
                        <span className="font-semibold text-stone-800">Taxable Subtotal</span>
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          ₹{taxableVal.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="font-sans text-stone-600">GST ({gstPct}%)</span>
                        <span className="font-semibold text-stone-900">
                          ₹{gstVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Authoritative Selling Price Total Card */}
                    <div className="p-4 rounded-2xl bg-[#1C1917] text-white flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[10px] tracking-widest uppercase text-amber-300 font-sans block font-semibold">
                          Authoritative Dynamic Selling Price
                        </span>
                        <span className="text-[11px] text-stone-400 font-sans">
                          Includes crafting, hallmark assay &amp; 3% GST
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                        ₹{finalVal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 flex flex-wrap gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    if (onAddToCart) {
                      onAddToCart({
                        modelType: 'solitaire-ring',
                        title: p.name,
                        metal: p.metalType === 'SILVER' ? 'yellow-gold' : 'yellow-gold',
                        gem: 'diamond',
                        carat: 1.0,
                        prongStyle: '4-claw',
                        engravingText: '',
                        price: `₹${finalVal.toLocaleString('en-IN')}`,
                        productId: p.id,
                        rawPrice: finalVal,
                        weightGrams: netMetalWeight,
                        purity: p.purity,
                        breakdown: b,
                      });
                    }
                    setSelectedProductBreakdown(null);
                  }}
                  className="flex-1 min-w-[200px] py-3 px-5 rounded-full bg-[#8C6A28] hover:bg-[#6D531F] text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag at Current Rate</span>
                </button>
                <button
                  onClick={() => setSelectedProductBreakdown(null)}
                  className="px-6 py-3 rounded-full border border-stone-300 hover:bg-stone-200 text-stone-700 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
