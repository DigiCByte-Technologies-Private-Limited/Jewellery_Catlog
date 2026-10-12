import { useSearchParams } from 'react-router-dom';

export const FeatureHighlights = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categories = [
    {
      title: 'EARRINGS',
      count: '45 Products',
      image: '/images-1.jpg',
      filterId: 'earring',
    },
    {
      title: 'BRACELET',
      count: '30 Products',
      image: '/images-4.jpg',
      filterId: 'bangle',
    },
    {
      title: 'NECKLACE',
      count: '56 Products',
      image: '/images-3.jpg',
      filterId: 'necklace',
    },
    {
      title: 'RINGS',
      count: '50 Products',
      image: '/images-2.jpg',
      filterId: 'ring',
    },
    {
      title: 'BANGLES',
      count: '24 Products',
      image: '/images-5.jpg',
      filterId: 'bangle',
    },
  ];

  const handleCategoryClick = (filterId: string) => {
    // Update URL search params
    const params = new URLSearchParams(searchParams);
    if (filterId) {
      params.set('category', filterId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);

    // Smooth scroll to the collections section
    const el = document.getElementById('collections');
    if (el) {
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.scrollTo(el, { offset: -80, duration: 1.2 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="bg-[#F9F5EC] pt-4 pb-20 lg:pt-6 lg:pb-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Header */}
        <div className="flex items-center justify-center mb-12">
          <h2 className="font-serif text-4xl lg:text-5xl font-semibold text-[#1C1A17] tracking-tight">
            Shop by Category
          </h2>
        </div>

        {/* Categories Marquee (Infinite Loop) */}
        <div className="w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden py-4">
          <div className="animate-marquee flex gap-6 lg:gap-12 px-3 lg:px-6">
            {[...categories, ...categories, ...categories, ...categories].map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCategoryClick(cat.filterId)}
                className="flex-none w-[45vw] md:w-[22vw] lg:w-[16vw] flex flex-col items-center group cursor-pointer"
              >
                <div className="w-full aspect-square rounded-full overflow-hidden mb-6 bg-stone-200">
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <h3 className="font-sans text-sm font-bold tracking-widest uppercase text-[#1C1A17] mb-2">
                  {cat.title}
                </h3>
                <p className="font-sans text-xs text-stone-500">
                  {cat.count}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-6">
            <button 
              onClick={() => handleCategoryClick('')}
              className="px-6 py-2 border border-[#D1C6B4] text-[#1C1A17] text-xs font-semibold uppercase tracking-widest hover:bg-[#1C1A17] hover:text-white transition-all"
            >
              View All Categories
            </button>
        </div>

      </div>
    </section>
  );
};
