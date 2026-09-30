import { ArrowRight, Shield, Award, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#F7F4EE] border-t border-stone-200 text-stone-600 text-xs">
      {/* Atelier Guarantee Bar */}
      <div className="border-b border-stone-200/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 rounded-2xl bg-white border border-stone-200 text-[#8C6A28] shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-serif text-sm font-semibold text-[#1C1917]">100% Certified Stones</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">Every diamond above 0.5ct comes with GIA laser inscription.</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 rounded-2xl bg-white border border-stone-200 text-[#8C6A28] shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-serif text-sm font-semibold text-[#1C1917]">Bespoke Atelier Craft</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">Hand-forged by master jewellers in our Geneva & Paris workshops.</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 rounded-2xl bg-white border border-stone-200 text-[#8C6A28] shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-serif text-sm font-semibold text-[#1C1917]">Lifetime Complimentary Care</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">Annual ultrasonic cleaning, prong tightening, and replating.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-[0.25em] text-[#1C1917] uppercase">
                AURUM
              </span>
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#8C6A28] font-bold pt-1">
                JEWELS
              </span>
            </div>
            <p className="text-stone-600 font-light text-xs leading-relaxed max-w-sm">
              Pioneering the intersection of haute joaillerie and real-time 3D innovation. Celebrating timeless moments with ethical gems and bespoke creations.
            </p>

            <div className="pt-2">
              <span className="text-[10px] tracking-widest uppercase text-[#8C6A28] font-semibold block mb-2">
                Ateliers & Salons
              </span>
              <p className="text-[11px] text-stone-500">
                Paris Place Vendôme • New York Madison Ave • London Bond St • Tokyo Ginza
              </p>
            </div>
          </div>

          {/* Quick Links 1 */}
          <div>
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-4">
              Collections
            </h6>
            <ul className="space-y-2.5 text-stone-600">
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Royal Solitaire</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Emerald Cut Sovereign</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Eternity Bangles</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Bespoke Bridal Sets</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Rare Colored Gems</a></li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div>
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-4">
              Services
            </h6>
            <ul className="space-y-2.5 text-stone-600">
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">3D Interactive Design</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Virtual Gemologist Session</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Diamond Sourcing</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Laser Inscription</a></li>
              <li><a href="#" className="hover:text-[#8C6A28] transition-colors">Valuation & Insurance</a></li>
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div id="contact" className="space-y-3">
            <h6 className="font-serif text-xs font-semibold tracking-[0.2em] text-[#1C1917] uppercase mb-2">
              Private Newsletter
            </h6>
            <p className="text-[11px] text-stone-600 font-light">
              Receive private invitations to new high jewelry releases and confidential auctions.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-amber-500 text-xs text-stone-800 focus:outline-none placeholder-stone-400 shadow-xs"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#1C1917] hover:bg-[#8C6A28] text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
          <p>© 2026 AURUM JEWELS. All rights reserved. Crafted with 3D WebGL Technology.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-[#8C6A28] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#8C6A28] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#8C6A28] transition-colors">Ethics & Kimberly Process</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
