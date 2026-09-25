import { motion } from 'motion/react';
import { UploadCloud, SlidersHorizontal, Store, QrCode, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: UploadCloud,
      title: 'Digital Upload',
      desc: 'Send PDFs, notes, slides, or CAD blueprints directly from your device. No pendrives or WhatsApp lossy compression.',
      tag: 'Instant Preflight Check',
    },
    {
      step: '02',
      icon: SlidersHorizontal,
      title: 'Granular Customization',
      desc: 'Pick paper GSM (75 to 300 GSM), color mode, page orientation, double-sided duplexing, and hardbound golden embossing.',
      tag: 'Exact Page-Level Controls',
    },
    {
      step: '03',
      icon: Store,
      title: 'Shop Comparison',
      desc: 'Compare nearby verified partner shops on price, machine queue, and user ratings. You pick the best value or turnaround.',
      tag: 'Zero Hidden Charges',
    },
    {
      step: '04',
      icon: QrCode,
      title: 'Skip-the-Queue Pickup',
      desc: 'Get a notification when ready. Flash your order QR code at the express counter or smart locker, or choose doorstep delivery.',
      tag: 'Zero Wait Time',
    },
  ];

  return (
    <section id="how-it-works" className="py-14 sm:py-20 md:py-24 bg-[#07090e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <span>Seamless 4-Step Flow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit']">
            How XEROXMATE Modernizes Printing
          </h2>
          <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            From file upload to pickup in hand, we have eliminated the hassles, USB virus risks, and
            standing in crowded print shop queues forever.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="relative group p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                {/* Step badge */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-slate-700 font-mono group-hover:text-blue-500/50 transition-colors">
                    {item.step}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Tag */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-blue-400">
                  <span>{item.tag}</span>
                  <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
