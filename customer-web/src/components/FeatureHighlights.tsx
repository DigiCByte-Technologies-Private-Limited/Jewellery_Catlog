import { Gem, ShieldCheck, Award, CreditCard } from 'lucide-react';

export const FeatureHighlights = () => {
  const features = [
    {
      icon: Gem,
      title: 'EXTENSIVE RANGE',
      description: 'Meticulously handcrafted bespoke designs',
    },
    {
      icon: Award,
      title: 'PRESTIGE SERVICE',
      description: '1-on-1 private gemologist consultation',
    },
    {
      icon: ShieldCheck,
      title: 'OPTIMAL WARRANTY',
      description: 'Lifetime authenticity & GIA certified',
    },
    {
      icon: CreditCard,
      title: 'ESTEEM FINANCING',
      description: 'Flexible bespoke payment solutions',
    },
  ];

  return (
    <section className="border-y border-stone-200/80 bg-gradient-to-r from-[#F7F4EE] via-[#FAF8F5] to-[#F7F4EE] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400/60 transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100/80 via-amber-50 to-transparent border border-amber-300/60 flex items-center justify-center text-[#8C6A28] group-hover:scale-110 group-hover:text-[#B89047] transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-serif text-xs font-semibold tracking-[0.18em] uppercase text-[#1C1917] group-hover:text-[#8C6A28] transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-stone-500 font-normal mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
