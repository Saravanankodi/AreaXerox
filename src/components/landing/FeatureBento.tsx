import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Building, TrendingDown, Clock, CheckCircle } from 'lucide-react';

export default function FeatureBento() {
  return (
    <section id="features" className="py-14 sm:py-20 md:py-24 bg-[#080c14] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <span>Enterprise & Student Grade</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit']">
            Engineered for Precision & Confidentiality
          </h2>
          <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Every feature in XEROXMATE was crafted around solving the everyday pain points of
            university students, legal professionals, corporate teams, and print vendors.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Card 1: Large Privacy Engine (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-7 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c1322] to-slate-950 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <div className="max-w-md space-y-3 sm:space-y-4 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
                Zero-Trace Auto-Purge Protocol
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Traditional print shops often leave confidential documents, ID cards, exam papers,
                and legal contracts on public desktop PCs and unmanaged recycle bins.
                With XEROXMATE, files are sent encrypted directly to the printer spool and
                permanently purged immediately upon print completion.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] sm:text-xs font-semibold text-emerald-300">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> 256-Bit In-Flight Encryption
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Ephemeral Storage Expiry
                </span>
              </div>
            </div>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>

          {/* Card 2: AI Preflight Inspector (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
                Intelligent Preflight Checks
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Our preflight engine inspects your upload before dispatching: warns you about
                low-DPI images, clipping margins, missing fonts, or wrong aspect ratios before
                wasting single sheets of paper.
              </p>
            </div>
            <div className="pt-4 sm:pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-blue-400 font-semibold">
              <span>Automatic Margin Auto-Fix</span>
              <span>Zero wasted prints</span>
            </div>
          </motion.div>

          {/* Card 3: Transparent Shop Bidding (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="md:col-span-4 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              Live Price Match Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Print vendors submit standardized rate cards. Compare rates per page and binding
              costs transparently with no spontaneous student surge fees.
            </p>
          </motion.div>

          {/* Card 4: Campus Smart Lockers (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-4 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              24/7 Smart Locker Retrieval
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Order your assignments or blueprints at midnight and pick them up directly from
              temperature-controlled smart campus lockers before 8:00 AM class.
            </p>
          </motion.div>

          {/* Card 5: Corporate & Institutional Teams (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="md:col-span-4 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              Department & Bulk Accounts
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              University departments, legal chambers, and engineering firms can set centralized
              allowances, tax invoices, and bulk batch priority queues.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
