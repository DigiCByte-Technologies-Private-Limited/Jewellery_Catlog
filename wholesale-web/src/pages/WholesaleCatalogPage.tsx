import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, Search, Sparkles, Filter, ArrowUpRight,
  ShieldCheck, Loader2, Tag
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  metalType: string;
  purity: string;
  grossWeight: string;
  netMetalWeight: string;
  shortDescription?: string;
  category?: { name: string };
  media?: Array<{ url: string; originalName: string }>;
}

export const WholesaleCatalogPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('ALL');
  const [selectedPurity, setSelectedPurity] = useState('ALL');

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:3001/api/v1/products?limit=50');
        setProducts(res.data.data || []);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()));
    const matchesMetal = selectedMetal === 'ALL' || p.metalType === selectedMetal;
    const matchesPurity = selectedPurity === 'ALL' || p.purity === selectedPurity;
    return matchesSearch && matchesMetal && matchesPurity;
  });

  const handleProposeAlternative = (p: ProductItem) => {
    navigate('/submit', {
      state: {
        prefillProductId: p.id,
        prefillSku: p.sku,
        prefillName: p.name,
        prefillCategory: p.category?.name,
      },
    });
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto">
        {/* Banner */}
        <div className="card p-8 bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] text-white mb-8 border-none shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Wholesale Catalog & Reference Standards</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3">
            Wholesale Jewelry Catalog
          </h1>
          <p className="text-stone-300 text-sm max-w-2xl leading-relaxed">
            Browse our core manufactured product designs, weight grades, and pure gold benchmarks.
            Submit new high-res imagery, propose variations, or provide custom factory batch samples for existing catalog pieces.
          </p>
        </div>

        {/* Filters */}
        <div className="card p-5 mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search by product name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold uppercase">
              <Filter className="w-3.5 h-3.5" />
              <span>Metal:</span>
            </div>
            <select
              className="input-field py-2 text-xs"
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
            >
              <option value="ALL">All Metals</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="PLATINUM">Platinum</option>
            </select>

            <select
              className="input-field py-2 text-xs"
              value={selectedPurity}
              onChange={(e) => setSelectedPurity(e.target.value)}
            >
              <option value="ALL">All Purities</option>
              <option value="K24">24K (999)</option>
              <option value="K22">22K (916)</option>
              <option value="K18">18K (750)</option>
              <option value="K14">14K (585)</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#B89047]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-700">No Catalog Products Found</h3>
            <p className="text-stone-400 text-sm mt-1">Try refining your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => {
              const imageSrc =
                product.media && product.media.length > 0
                  ? product.media[0].url
                  : null;

              return (
                <div
                  key={product.id}
                  className="card overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Media / Thumbnail */}
                    <div className="relative aspect-[4/3] bg-stone-100 flex items-center justify-center border-b border-stone-100 overflow-hidden">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-stone-300">
                          <Package className="w-10 h-10" />
                          <span className="text-[10px] tracking-widest uppercase">Catalog Standard</span>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded">
                        {product.sku}
                      </div>
                      <div className="absolute top-2.5 right-2.5 bg-[#FAF8F5]/90 backdrop-blur-sm text-[#8C6A28] text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                        {product.purity} {product.metalType}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="text-[11px] font-semibold tracking-wider uppercase text-amber-700 mb-1 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        <span>{product.category?.name || 'Fine Jewelry'}</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#1C1917] mb-2 leading-snug">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-stone-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                          {product.shortDescription}
                        </p>
                      )}

                      {/* Specs pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl mb-4">
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-semibold">Gross Wt</span>
                          <span className="font-medium text-stone-800">{product.grossWeight} g</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-semibold">Net Metal Wt</span>
                          <span className="font-medium text-stone-800">{product.netMetalWeight} g</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex gap-2">
                    <button
                      onClick={() => handleProposeAlternative(product)}
                      className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Propose Media</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info box */}
        <div className="mt-12 card p-6 bg-amber-50/70 border-amber-200/60 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#8C6A28] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-semibold text-stone-900 text-sm">Wholesale Quality Assurance & Hallmarking</h4>
            <p className="text-stone-600 text-xs mt-0.5">
              All wholesale catalog products conform to BIS Hallmark guidelines.
              Wholesale partners proposing variant CADs or photography will receive direct catalog attribution upon admin approval.
            </p>
          </div>
          <Link to="/submit" className="btn-secondary text-xs py-2 px-4 whitespace-nowrap">
            Submit Custom Proposal
          </Link>
        </div>
      </div>
    </div>
  );
};
