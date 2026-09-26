import { motion } from 'motion/react';
import { Check, X, Sparkles } from 'lucide-react';

export default function ComparisonSection() {
  const comparison = [
    {
      feature: 'Document Hand-off',
      oldWay: 'Physical USB pendrives (virus risk) or WhatsApp compression',
      xeroxmate: 'Lossless direct encrypted digital upload from any browser',
    },
    {
      feature: 'Pricing Transparency',
      oldWay: 'Arbitrary prices calculated on the spot; surprise binding fees',
      xeroxmate: 'Guaranteed itemized pricing upfront before you hit confirm',
    },
    {
      feature: 'Waiting Time',
      oldWay: 'Standing in 20-person queues during exam or project submission weeks',
      xeroxmate: 'Zero wait time: track real-time machine queue and pick up ready batch',
    },
    {
      feature: 'Data Privacy & Shredding',
      oldWay: 'Files remain saved on public print shop desktops indefinitely',
      xeroxmate: 'Automatic cryptographic purge upon verified collection',
    },
    {
      feature: 'Shop Selection',
      oldWay: 'Limited to the single shop right in front of you regardless of crowd',
      xeroxmate: 'Compare nearby partner shops by distance, cost, and machine speed',
    },
  ];

  return (
    <section id='comparision' className="py-14 sm:py-20 md:py-24 bg-[#07090e] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <span>Why Switch</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit']">
            The Traditional Way vs. XEROXMATE
          </h2>
          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto">
            Printing hasn't evolved in thirty years. We are fixing every broken step.
          </p>
        </div>

        {/* Desktop Table View (md and up) */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-12 bg-slate-950/80 border-b border-slate-800 p-5 lg:p-6 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <div className="col-span-4 text-slate-400">Workflow Dimension</div>
            <div className="col-span-4 text-rose-400">Traditional Print Shops</div>
            <div className="col-span-4 text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>XEROXMATE Platform</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {comparison.map((row, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="grid grid-cols-12 p-5 lg:p-6 items-center text-sm hover:bg-slate-800/20 transition-colors"
              >
                <div className="col-span-4 font-bold text-white font-['Outfit']">
                  {row.feature}
                </div>
                <div className="col-span-4 text-slate-400 flex items-start gap-2 pr-3">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{row.oldWay}</span>
                </div>
                <div className="col-span-4 text-slate-200 font-medium flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{row.xeroxmate}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Card View (phones & small tablets) */}
        <div className="md:hidden space-y-3.5">
          {comparison.map((row, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="p-4 rounded-2xl bg-linear-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 shadow-lg space-y-3"
            >
              <div className="text-sm font-bold text-white font-['Outfit'] pb-2 border-b border-slate-800/70">
                {row.feature}
              </div>
              <div className="space-y-2 text-xs">
                {/* Traditional */}
                <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-start gap-2 text-slate-400">
                  <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-0.5">Traditional</span>
                    <span>{row.oldWay}</span>
                  </div>
                </div>
                {/* XEROXMATE */}
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 flex items-start gap-2 text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">XEROXMATE</span>
                    <span className="font-medium">{row.xeroxmate}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
