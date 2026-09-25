import { motion } from 'motion/react';
import { Sliders, GitCompare, Lock, Truck } from 'lucide-react';

export default function ProofStrip() {
  const highlights = [
    {
      icon: Sliders,
      title: 'File-by-File Controls',
      desc: 'Set custom GSM, color & binding per doc',
    },
    {
      icon: GitCompare,
      title: 'Live Shop Quotes',
      desc: 'Instant transparent rates across print hubs',
    },
    {
      icon: Lock,
      title: 'Encrypted & Auto-Purged',
      desc: 'Zero traces left on public shop computers',
    },
    {
      icon: Truck,
      title: 'Pickup or Doorstep',
      desc: 'Scan QR at locker/counter or get fast delivery',
    },
  ];

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 p-3.5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex items-start gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-slate-800/40 transition-colors"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit']">{item.title}</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
