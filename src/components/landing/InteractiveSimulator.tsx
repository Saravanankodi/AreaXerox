import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Sparkles,
  Layers,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import type { PrintSimulationOption } from '../../types';



export default function InteractiveSimulator() {
  const [config, setConfig] = useState<PrintSimulationOption>({
    docType: 'thesis',
    pages: 65,
    copies: 2,
    colorMode: 'bw',
    paperGsm: '100gsm',
    binding: 'hardbound',
    deliveryType: 'pickup',
  });

  // Calculate pricing based on options
  const calculateCost = () => {
    const pageRate = config.colorMode === 'color' ? 7 : 1.5;
    const paperMultiplier =
      config.paperGsm === '300gsm' ? 3.5 : config.paperGsm === '100gsm' ? 1.4 : 1.0;
    const bindingCost =
      config.binding === 'hardbound'
        ? 280
        : config.binding === 'spiral'
        ? 60
        : config.binding === 'stapled'
        ? 10
        : 0;
    const deliveryCost = config.deliveryType === 'express' ? 50 : 0;

    const printCostPerCopy = Math.round(config.pages * pageRate * paperMultiplier);
    const subtotal = (printCostPerCopy + bindingCost) * config.copies + deliveryCost;
    const estimatedMinutes = Math.max(12, Math.round(config.pages * config.copies * 0.25) + (config.binding === 'hardbound' ? 45 : 10));

    return {
      subtotal,
      printCostPerCopy,
      bindingCost,
      deliveryCost,
      estimatedMinutes,
    };
  };

  const cost = calculateCost();

  const printShops = [
    {
      name: 'Campus Central Digital Hub',
      distance: '350m · College Road',
      rating: '4.9',
      reviewCount: 318,
      quote: cost.subtotal,
      eta: `${cost.estimatedMinutes} mins`,
      badge: 'Fastest Turnaround',
    },
    {
      name: 'Premier Xerox & Laser Lab',
      distance: '1.1 km · Tech Park Gate 2',
      rating: '4.8',
      reviewCount: 540,
      quote: Math.max(20, Math.round(cost.subtotal * 0.94)),
      eta: `${cost.estimatedMinutes + 15} mins`,
      badge: 'Best Value',
    },
    {
      name: '24/7 Metro Express Print & Bind',
      distance: '2.3 km · Main Avenue',
      rating: '4.7',
      reviewCount: 280,
      quote: Math.round(cost.subtotal * 1.08),
      eta: `${Math.max(15, cost.estimatedMinutes - 5)} mins`,
      badge: '24/7 Open',
    },
  ];

  return (
    <section id="print-simulator" className="hidden md:block py-24 bg-[#080c14] relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        {/* <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
            See How XEROXMATE Works in Real Time
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Customize any document scenario below to preview our intelligent file configuration,
            instant transparent quotes, and live local print hub comparisons.
          </p>
        </div> */}
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

        {/* Simulator Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Configurator */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg font-['Outfit']">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>Job Customizer</span>
              </div>
              <span className="text-xs text-blue-400 font-semibold px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-900/50">
                Live Pricing Matrix
              </span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
                1. Select Document Profile
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'thesis', label: 'Thesis / Project Report' },
                  { id: 'notes', label: 'Study & Lecture Notes' },
                  { id: 'flyer', label: 'Color Flyers / Posters' },
                  { id: 'cards', label: 'Visiting / ID Cards' },
                  { id: 'cad', label: 'CAD Drawings & Blueprints' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        docType: item.id as any,
                        paperGsm: item.id === 'cards' ? '300gsm' : item.id === 'thesis' ? '100gsm' : '75gsm',
                        binding: item.id === 'thesis' ? 'hardbound' : item.id === 'notes' ? 'spiral' : 'none',
                      }))
                    }
                    className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all duration-200 ${
                      config.docType === item.id
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages & Copies Slider */}
            <div className="grid sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span className="text-slate-400 uppercase tracking-wider">Page Count:</span>
                  <span className="text-blue-400 font-mono text-sm">{config.pages} pages</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={config.pages}
                  onChange={(e) => setConfig({ ...config, pages: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>5 pp</span>
                  <span>150 pp</span>
                  <span>300 pp</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span className="text-slate-400 uppercase tracking-wider">Copies:</span>
                  <span className="text-blue-400 font-mono text-sm">{config.copies} sets</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={config.copies}
                  onChange={(e) => setConfig({ ...config, copies: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 copy</span>
                  <span>8 copies</span>
                  <span>15 copies</span>
                </div>
              </div>
            </div>

            {/* Color & Paper Options */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {/* Color Mode */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Print Ink Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfig({ ...config, colorMode: 'bw' })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      config.colorMode === 'bw'
                        ? 'bg-blue-600/25 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    B&W (High Contrast)
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, colorMode: 'color' })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      config.colorMode === 'color'
                        ? 'bg-blue-600/25 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    Vivid Laser Color
                  </button>
                </div>
              </div>

              {/* Paper Weight */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Paper GSM
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '75gsm', label: '75 GSM' },
                    { id: '100gsm', label: '100 GSM Bond' },
                    { id: '300gsm', label: '300 GSM Card' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setConfig({ ...config, paperGsm: p.id as any })}
                      className={`py-2 px-2 text-center rounded-lg text-[11px] font-semibold border transition-all ${
                        config.paperGsm === p.id
                          ? 'bg-blue-600/25 border-blue-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Finishing & Binding */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Finishing & Binding
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'Corner Staple' },
                  { id: 'stapled', label: 'Soft Edge Tape' },
                  { id: 'spiral', label: 'Spiral Ring' },
                  { id: 'hardbound', label: 'Golden Foil Hardbound' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setConfig({ ...config, binding: b.id as any })}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-all ${
                      config.binding === b.id
                        ? 'bg-blue-600/25 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fulfillment Mode:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfig({ ...config, deliveryType: 'pickup' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    config.deliveryType === 'pickup'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  Self Pickup (QR Locker)
                </button>
                <button
                  onClick={() => setConfig({ ...config, deliveryType: 'express' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    config.deliveryType === 'express'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  Campus/Doorstep Delivery
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Quote & Hub Comparison */}
          <div className="lg:col-span-5 space-y-5">
            {/* Price Estimate Summary Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-950/90 border border-blue-900/50 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                  INSTANT ESTIMATE BREAKDOWN
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Ready in ~{cost.estimatedMinutes} mins
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    ₹{cost.subtotal}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    For {config.copies} {config.copies > 1 ? 'copies' : 'copy'} ({config.pages * config.copies} total pages)
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  Guaranteed Rate
                </span>
              </div>

              {/* Price Line Items */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Printing ({config.colorMode.toUpperCase()}, {config.paperGsm}):</span>
                  <span className="font-mono">₹{cost.printCostPerCopy * config.copies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Finishing ({config.binding}):</span>
                  <span className="font-mono">₹{cost.bindingCost * config.copies}</span>
                </div>
                {cost.deliveryCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Express Delivery:</span>
                    <span className="font-mono">₹{cost.deliveryCost}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Print Hub Bidding & Comparison */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>Nearby Partner Hubs</span>
                </h4>
                <span className="text-[11px] text-slate-400">Automated price match</span>
              </div>

              <div className="space-y-2.5">
                {printShops.map((shop, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                          {shop.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
                          {shop.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>{shop.distance}</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{shop.rating}</span>
                        </span>
                        <span>ETA: {shop.eta}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono text-white">₹{shop.quote}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Available now</div>
                    </div>
                  </div>
                ))}
              </div>

             
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
