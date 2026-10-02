import { Link } from 'react-router-dom';
import { ArrowRight, Package, UploadCloud, BarChart3, Shield, Clock, Star } from 'lucide-react';

const features = [
  {
    icon: UploadCloud,
    title: 'Submit Product Images',
    desc: 'Upload high-quality product images with full specifications. Our team reviews each submission.',
  },
  {
    icon: BarChart3,
    title: 'Track Proposals',
    desc: 'Monitor your submissions in real-time — from pending review to accepted or published in our catalog.',
  },
  {
    icon: Package,
    title: 'Catalog Publication',
    desc: "Accepted products get featured in Aurum Jewels' curated catalog and reach thousands of customers.",
  },
  {
    icon: Shield,
    title: 'Secure & Confidential',
    desc: 'Your product images and business data are encrypted and never shared without your consent.',
  },
  {
    icon: Clock,
    title: 'Fast Review',
    desc: 'Our expert merchandising team reviews proposals within 3-5 business days.',
  },
  {
    icon: Star,
    title: 'Premium Partnership',
    desc: 'Join our curated network of elite jewellery manufacturers and wholesalers globally.',
  },
];

export const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917] py-24 px-4">
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#B89047_0px,#B89047_1px,transparent_1px,transparent_50px)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/30 border border-amber-600/30 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Wholesale B2B Partner Portal
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Partner With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B89047] via-[#E2C37A] to-[#B89047]">Aurum Jewels</span>
          </h1>
          <p className="text-stone-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Submit your jewellery product images, track proposals, and get your products featured in our premium catalog. Built exclusively for verified wholesale partners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#B89047] to-[#8C6A28] text-white font-bold text-sm tracking-wider uppercase hover:opacity-90 transition shadow-lg"
            >
              Submit a Proposal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/my-submissions"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-stone-600 text-stone-300 font-semibold text-sm tracking-wider uppercase hover:border-amber-600 hover:text-amber-400 transition"
            >
              Track My Submissions
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl font-bold text-[#1C1917] mb-3">How It Works</h2>
            <p className="text-stone-500 text-base max-w-xl mx-auto">Three simple steps to get your jewellery featured in the Aurum catalog.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Submit Your Images', desc: 'Fill in your company details and product specifications, then drag-and-drop your high-quality product images.' },
              { step: '02', title: 'We Review', desc: 'Our expert merchandising team carefully evaluates every submission within 3–5 business days.' },
              { step: '03', title: 'Get Featured', desc: 'Approved products are published to our catalog and promoted to thousands of retail customers.' },
            ].map((item) => (
              <div key={item.step} className="relative card p-8 text-center">
                <div className="text-5xl font-black text-amber-100 absolute -top-4 left-6 select-none">{item.step}</div>
                <h3 className="font-semibold text-[#1C1917] text-lg mb-2 mt-4">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl font-bold text-[#1C1917] mb-3">Why Partner With Us?</h2>
            <p className="text-stone-500 text-base max-w-xl mx-auto">Everything you need to showcase your wholesale jewellery collection.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#B89047]" />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#1C1917] to-[#292524]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-stone-400 mb-8">Submit your first product proposal today and join our exclusive wholesale partner network.</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#B89047] to-[#8C6A28] text-white font-bold text-sm tracking-wider uppercase hover:opacity-90 transition shadow-lg"
          >
            Submit Proposal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#1C1917] border-t border-stone-800 text-center">
        <p className="text-stone-500 text-xs tracking-widest uppercase">© 2026 Aurum Jewels — Wholesale Partner Portal · All Rights Reserved</p>
        <p className="text-stone-600 text-xs mt-1">For customer retail shopping, visit <a href="http://localhost:5174" className="text-amber-600 hover:text-amber-400">aurumjewels.com</a></p>
      </footer>
    </div>
  );
};
