// // import { useState } from 'react';
// // import { motion } from 'motion/react';
// // import {
// //   FileText,
// //   Sparkles,
// //   Layers,
// //   Clock,
// //   MapPin,
// //   Star,
// //   CheckCircle2,
// //   TrendingDown,
// //   ArrowRight,
// // } from 'lucide-react';
// // import type { PrintSimulationOption } from '../../types';



// // export default function InteractiveSimulator() {
// //   const [config, setConfig] = useState<PrintSimulationOption>({
// //     docType: 'thesis',
// //     pages: 65,
// //     copies: 2,
// //     colorMode: 'bw',
// //     paperGsm: '100gsm',
// //     binding: 'hardbound',
// //     deliveryType: 'pickup',
// //   });

// //   // Calculate pricing based on options
// //   const calculateCost = () => {
// //     const pageRate = config.colorMode === 'color' ? 7 : 1.5;
// //     const paperMultiplier =
// //       config.paperGsm === '300gsm' ? 3.5 : config.paperGsm === '100gsm' ? 1.4 : 1.0;
// //     const bindingCost =
// //       config.binding === 'hardbound'
// //         ? 280
// //         : config.binding === 'spiral'
// //         ? 60
// //         : config.binding === 'stapled'
// //         ? 10
// //         : 0;
// //     const deliveryCost = config.deliveryType === 'express' ? 50 : 0;

// //     const printCostPerCopy = Math.round(config.pages * pageRate * paperMultiplier);
// //     const subtotal = (printCostPerCopy + bindingCost) * config.copies + deliveryCost;
// //     const estimatedMinutes = Math.max(12, Math.round(config.pages * config.copies * 0.25) + (config.binding === 'hardbound' ? 45 : 10));

// //     return {
// //       subtotal,
// //       printCostPerCopy,
// //       bindingCost,
// //       deliveryCost,
// //       estimatedMinutes,
// //     };
// //   };

// //   const cost = calculateCost();

// //   const printShops = [
// //     {
// //       name: 'Campus Central Digital Hub',
// //       distance: '350m · College Road',
// //       rating: '4.9',
// //       reviewCount: 318,
// //       quote: cost.subtotal,
// //       eta: `${cost.estimatedMinutes} mins`,
// //       badge: 'Fastest Turnaround',
// //     },
// //     {
// //       name: 'Premier Xerox & Laser Lab',
// //       distance: '1.1 km · Tech Park Gate 2',
// //       rating: '4.8',
// //       reviewCount: 540,
// //       quote: Math.max(20, Math.round(cost.subtotal * 0.94)),
// //       eta: `${cost.estimatedMinutes + 15} mins`,
// //       badge: 'Best Value',
// //     },
// //     {
// //       name: '24/7 Metro Express Print & Bind',
// //       distance: '2.3 km · Main Avenue',
// //       rating: '4.7',
// //       reviewCount: 280,
// //       quote: Math.round(cost.subtotal * 1.08),
// //       eta: `${Math.max(15, cost.estimatedMinutes - 5)} mins`,
// //       badge: '24/7 Open',
// //     },
// //   ];

// //   return (
// //     <section id="print-simulator" className="hidden md:block py-24 bg-[#080c14] relative overflow-hidden">
// //       {/* Background radial accent */}
// //       <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         {/* Section Heading */}
// //         {/* <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
// //           <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-xs font-bold uppercase tracking-wider">
// //             <Sparkles className="w-3.5 h-3.5" />
// //             <span>Interactive Simulator</span>
// //           </div>
// //           <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
// //             See How XEROXMATE Works in Real Time
// //           </h2>
// //           <p className="text-base text-slate-400 leading-relaxed">
// //             Customize any document scenario below to preview our intelligent file configuration,
// //             instant transparent quotes, and live local print hub comparisons.
// //           </p>
// //         </div> */}
// //         <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-10 sm:mb-16">
// //           <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
// //             <span>Seamless 4-Step Flow</span>
// //           </div>
// //           <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit']">
// //             How XEROXMATE Modernizes Printing
// //           </h2>
// //           <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
// //             From file upload to pickup in hand, we have eliminated the hassles, USB virus risks, and
// //             standing in crowded print shop queues forever.
// //           </p>
// //         </div>

// //         {/* Simulator Grid */}
// //         <div className="grid lg:grid-cols-12 gap-8 items-start">
// //           {/* Left: Interactive Configurator */}
// //           <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
// //             <div className="flex items-center justify-between pb-4 border-b border-slate-800">
// //               <div className="flex items-center gap-2.5 text-white font-bold text-lg font-['Outfit']">
// //                 <Layers className="w-5 h-5 text-blue-400" />
// //                 <span>Job Customizer</span>
// //               </div>
// //               <span className="text-xs text-blue-400 font-semibold px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-900/50">
// //                 Live Pricing Matrix
// //               </span>
// //             </div>

// //             {/* Document Type Selector */}
// //             <div>
// //               <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
// //                 1. Select Document Profile
// //               </label>
// //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
// //                 {[
// //                   { id: 'thesis', label: 'Thesis / Project Report' },
// //                   { id: 'notes', label: 'Study & Lecture Notes' },
// //                   { id: 'flyer', label: 'Color Flyers / Posters' },
// //                   { id: 'cards', label: 'Visiting / ID Cards' },
// //                   { id: 'cad', label: 'CAD Drawings & Blueprints' },
// //                 ].map((item) => (
// //                   <button
// //                     key={item.id}
// //                     onClick={() =>
// //                       setConfig((prev) => ({
// //                         ...prev,
// //                         docType: item.id as any,
// //                         paperGsm: item.id === 'cards' ? '300gsm' : item.id === 'thesis' ? '100gsm' : '75gsm',
// //                         binding: item.id === 'thesis' ? 'hardbound' : item.id === 'notes' ? 'spiral' : 'none',
// //                       }))
// //                     }
// //                     className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all duration-200 ${
// //                       config.docType === item.id
// //                         ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
// //                         : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
// //                     }`}
// //                   >
// //                     {item.label}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             {/* Pages & Copies Slider */}
// //             <div className="grid sm:grid-cols-2 gap-5 pt-2">
// //               <div className="space-y-2">
// //                 <div className="flex justify-between text-xs font-bold text-slate-300">
// //                   <span className="text-slate-400 uppercase tracking-wider">Page Count:</span>
// //                   <span className="text-blue-400 font-mono text-sm">{config.pages} pages</span>
// //                 </div>
// //                 <input
// //                   type="range"
// //                   min="5"
// //                   max="300"
// //                   step="5"
// //                   value={config.pages}
// //                   onChange={(e) => setConfig({ ...config, pages: Number(e.target.value) })}
// //                   className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
// //                 />
// //                 <div className="flex justify-between text-[10px] text-slate-500 font-mono">
// //                   <span>5 pp</span>
// //                   <span>150 pp</span>
// //                   <span>300 pp</span>
// //                 </div>
// //               </div>

// //               <div className="space-y-2">
// //                 <div className="flex justify-between text-xs font-bold text-slate-300">
// //                   <span className="text-slate-400 uppercase tracking-wider">Copies:</span>
// //                   <span className="text-blue-400 font-mono text-sm">{config.copies} sets</span>
// //                 </div>
// //                 <input
// //                   type="range"
// //                   min="1"
// //                   max="15"
// //                   step="1"
// //                   value={config.copies}
// //                   onChange={(e) => setConfig({ ...config, copies: Number(e.target.value) })}
// //                   className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
// //                 />
// //                 <div className="flex justify-between text-[10px] text-slate-500 font-mono">
// //                   <span>1 copy</span>
// //                   <span>8 copies</span>
// //                   <span>15 copies</span>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Color & Paper Options */}
// //             <div className="grid sm:grid-cols-2 gap-4 pt-2">
// //               {/* Color Mode */}
// //               <div>
// //                 <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
// //                   Print Ink Mode
// //                 </label>
// //                 <div className="grid grid-cols-2 gap-2">
// //                   <button
// //                     onClick={() => setConfig({ ...config, colorMode: 'bw' })}
// //                     className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
// //                       config.colorMode === 'bw'
// //                         ? 'bg-blue-600/25 border-blue-500 text-white'
// //                         : 'bg-slate-950/60 border-slate-800 text-slate-400'
// //                     }`}
// //                   >
// //                     B&W (High Contrast)
// //                   </button>
// //                   <button
// //                     onClick={() => setConfig({ ...config, colorMode: 'color' })}
// //                     className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
// //                       config.colorMode === 'color'
// //                         ? 'bg-blue-600/25 border-blue-500 text-white'
// //                         : 'bg-slate-950/60 border-slate-800 text-slate-400'
// //                     }`}
// //                   >
// //                     Vivid Laser Color
// //                   </button>
// //                 </div>
// //               </div>

// //               {/* Paper Weight */}
// //               <div>
// //                 <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
// //                   Paper GSM
// //                 </label>
// //                 <div className="grid grid-cols-3 gap-2">
// //                   {[
// //                     { id: '75gsm', label: '75 GSM' },
// //                     { id: '100gsm', label: '100 GSM Bond' },
// //                     { id: '300gsm', label: '300 GSM Card' },
// //                   ].map((p) => (
// //                     <button
// //                       key={p.id}
// //                       onClick={() => setConfig({ ...config, paperGsm: p.id as any })}
// //                       className={`py-2 px-2 text-center rounded-lg text-[11px] font-semibold border transition-all ${
// //                         config.paperGsm === p.id
// //                           ? 'bg-blue-600/25 border-blue-500 text-white'
// //                           : 'bg-slate-950/60 border-slate-800 text-slate-400'
// //                       }`}
// //                     >
// //                       {p.label}
// //                     </button>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Finishing & Binding */}
// //             <div>
// //               <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
// //                 Finishing & Binding
// //               </label>
// //               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
// //                 {[
// //                   { id: 'none', label: 'Corner Staple' },
// //                   { id: 'stapled', label: 'Soft Edge Tape' },
// //                   { id: 'spiral', label: 'Spiral Ring' },
// //                   { id: 'hardbound', label: 'Golden Foil Hardbound' },
// //                 ].map((b) => (
// //                   <button
// //                     key={b.id}
// //                     onClick={() => setConfig({ ...config, binding: b.id as any })}
// //                     className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-all ${
// //                       config.binding === b.id
// //                         ? 'bg-blue-600/25 border-blue-500 text-white'
// //                         : 'bg-slate-950/60 border-slate-800 text-slate-400'
// //                     }`}
// //                   >
// //                     {b.label}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             {/* Delivery Toggle */}
// //             <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
// //               <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
// //                 Fulfillment Mode:
// //               </span>
// //               <div className="flex items-center gap-2">
// //                 <button
// //                   onClick={() => setConfig({ ...config, deliveryType: 'pickup' })}
// //                   className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
// //                     config.deliveryType === 'pickup'
// //                       ? 'bg-blue-600 text-white'
// //                       : 'bg-slate-950 text-slate-400'
// //                   }`}
// //                 >
// //                   Self Pickup (QR Locker)
// //                 </button>
// //                 <button
// //                   onClick={() => setConfig({ ...config, deliveryType: 'express' })}
// //                   className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
// //                     config.deliveryType === 'express'
// //                       ? 'bg-blue-600 text-white'
// //                       : 'bg-slate-950 text-slate-400'
// //                   }`}
// //                 >
// //                   Campus/Doorstep Delivery
// //                 </button>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Right: Live Quote & Hub Comparison */}
// //           <div className="lg:col-span-5 space-y-5">
// //             {/* Price Estimate Summary Card */}
// //             <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-950/90 border border-blue-900/50 shadow-2xl backdrop-blur-xl space-y-4">
// //               <div className="flex items-center justify-between">
// //                 <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
// //                   INSTANT ESTIMATE BREAKDOWN
// //                 </span>
// //                 <span className="text-xs text-slate-400 flex items-center gap-1">
// //                   <Clock className="w-3.5 h-3.5 text-emerald-400" />
// //                   Ready in ~{cost.estimatedMinutes} mins
// //                 </span>
// //               </div>

// //               <div className="flex items-baseline justify-between pt-2 pb-3 border-b border-slate-800">
// //                 <div>
// //                   <div className="text-3xl sm:text-4xl font-black text-white font-mono">
// //                     ₹{cost.subtotal}
// //                   </div>
// //                   <div className="text-xs text-slate-400 mt-0.5">
// //                     For {config.copies} {config.copies > 1 ? 'copies' : 'copy'} ({config.pages * config.copies} total pages)
// //                   </div>
// //                 </div>
// //                 <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
// //                   Guaranteed Rate
// //                 </span>
// //               </div>

// //               {/* Price Line Items */}
// //               <div className="space-y-1.5 text-xs text-slate-300">
// //                 <div className="flex justify-between">
// //                   <span className="text-slate-400">Printing ({config.colorMode.toUpperCase()}, {config.paperGsm}):</span>
// //                   <span className="font-mono">₹{cost.printCostPerCopy * config.copies}</span>
// //                 </div>
// //                 <div className="flex justify-between">
// //                   <span className="text-slate-400">Finishing ({config.binding}):</span>
// //                   <span className="font-mono">₹{cost.bindingCost * config.copies}</span>
// //                 </div>
// //                 {cost.deliveryCost > 0 && (
// //                   <div className="flex justify-between">
// //                     <span className="text-slate-400">Express Delivery:</span>
// //                     <span className="font-mono">₹{cost.deliveryCost}</span>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>

// //             {/* Print Hub Bidding & Comparison */}
// //             <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
// //               <div className="flex items-center justify-between pb-2 border-b border-slate-800">
// //                 <h4 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
// //                   <MapPin className="w-4 h-4 text-blue-400" />
// //                   <span>Nearby Partner Hubs</span>
// //                 </h4>
// //                 <span className="text-[11px] text-slate-400">Automated price match</span>
// //               </div>

// //               <div className="space-y-2.5">
// //                 {printShops.map((shop, i) => (
// //                   <div
// //                     key={i}
// //                     className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group"
// //                   >
// //                     <div>
// //                       <div className="flex items-center gap-2">
// //                         <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
// //                           {shop.name}
// //                         </span>
// //                         <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
// //                           {shop.badge}
// //                         </span>
// //                       </div>
// //                       <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
// //                         <span>{shop.distance}</span>
// //                         <span className="flex items-center gap-1 text-amber-400">
// //                           <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
// //                           <span>{shop.rating}</span>
// //                         </span>
// //                         <span>ETA: {shop.eta}</span>
// //                       </div>
// //                     </div>
// //                     <div className="text-right shrink-0">
// //                       <div className="text-sm font-bold font-mono text-white">₹{shop.quote}</div>
// //                       <div className="text-[10px] text-emerald-400 font-semibold">Available now</div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>

             
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </section>
// //   );
// // }






































// "use client";

// import { ChangeEvent, useMemo, useState } from "react";
// import { motion, AnimatePresence } from "motion/react";
// import {
//   Upload,
//   FileText,
//   Eye,
//   Trash2,
//   Plus,
//   Minus,
//   Search,
//   SlidersHorizontal,
//   Store,
//   MapPin,
//   Phone,
//   Clock3,
//   Truck,
//   WalletCards,
//   ChevronRight,
//   ChevronLeft,
//   X,
//   Check,
//   CreditCard,
//   Banknote,
//   MessageSquare,
//   PackageCheck,
//   CircleCheck,
// } from "lucide-react";

// /* =========================================================
//    TYPES
// ========================================================= */

// type ColorMode = "bw" | "color";
// type PrintFormat = "front" | "both";
// type PaperType = "a4" | "a3" | "bond" | "matte";
// type Binding = "none" | "spiral" | "soft" | "hard";
// type Extra = "none" | "lamination" | "stapling";
// type PageLayout = "1" | "2" | "4";
// type Orientation = "portrait" | "landscape";
// type DeliveryType = "pickup" | "delivery";
// type PaymentMethod =
//   | "paid-full"
//   | "advance"
//   | "pickup-pay"
//   | "delivery-pay";

// type PrintDocument = {
//   id: number;
//   name: string;
//   pages: number;
//   size: string;
//   paperType: PaperType;
//   quantity: number;
//   colorMode: ColorMode;
//   format: PrintFormat;
//   binding: Binding;
//   pageLayout: PageLayout;
//   extra: Extra;
//   orientation: Orientation;
//   range: string;
//   instructions: string;
// };

// type Shop = {
//   id: number;
//   name: string;
//   address: string;
//   phone: string;
//   hours: string;
//   open: boolean;
//   delivery: boolean;
// };

// /* =========================================================
//    DEMO DATA
// ========================================================= */

// const initialDocument: PrintDocument = {
//   id: 1,
//   name: "logo-light.png",
//   pages: 1,
//   size: "0.8 MB",
//   paperType: "a4",
//   quantity: 1,
//   colorMode: "bw",
//   format: "front",
//   binding: "none",
//   pageLayout: "1",
//   extra: "none",
//   orientation: "portrait",
//   range: "",
//   instructions: "",
// };

// const shops: Shop[] = [
//   {
//     id: 1,
//     name: "aaa",
//     address: "61D, main street, Ariyalur, tamilnadu, 76386",
//     phone: "1234567890",
//     hours: "12:01 AM–11:59 PM",
//     open: true,
//     delivery: false,
//   },
//   {
//     id: 2,
//     name: "Tamil Printers",
//     address: "No.4 Bismi Nagar, Baburajapuram, Kumbakonam, Tamil Nadu, 612302",
//     phone: "9876543210",
//     hours: "9:00 AM–11:00 PM",
//     open: false,
//     delivery: true,
//   },
//   {
//     id: 3,
//     name: "Tamil Printer",
//     address: "No.4 Bismi Nagar, Baburajapuram, Kumbakonam, Tamil Nadu, 612302",
//     phone: "9876543210",
//     hours: "9:00 AM–11:00 PM",
//     open: false,
//     delivery: true,
//   },
// ];

// /* =========================================================
//    LABEL HELPERS
// ========================================================= */

// const paperLabels: Record<PaperType, string> = {
//   a4: "A4 Paper",
//   a3: "A3 Paper",
//   bond: "Bond Paper",
//   matte: "Matte Paper",
// };

// const colorLabels: Record<ColorMode, string> = {
//   bw: "Black & White",
//   color: "Colour",
// };

// const formatLabels: Record<PrintFormat, string> = {
//   front: "Front only",
//   both: "Front & back",
// };

// const bindingLabels: Record<Binding, string> = {
//   none: "No binding",
//   spiral: "Spiral",
//   soft: "Soft binding",
//   hard: "Hard binding",
// };

// const layoutLabels: Record<PageLayout, string> = {
//   "1": "1 Page / Sheet",
//   "2": "2 Pages / Sheet",
//   "4": "4 Pages / Sheet",
// };

// const extraLabels: Record<Extra, string> = {
//   none: "No extra service",
//   lamination: "Lamination",
//   stapling: "Stapling",
// };

// const orientationLabels: Record<Orientation, string> = {
//   portrait: "Portrait",
//   landscape: "Landscape",
// };

// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function InteractiveSimulator() {
//   /* -------------------------------------------------------
//      MAIN STATE
//   ------------------------------------------------------- */

//   const [documents, setDocuments] =
//     useState<PrintDocument[]>([initialDocument]);

//   const [selectedDocumentId, setSelectedDocumentId] =
//     useState(1);

//   const [selectedShopId, setSelectedShopId] =
//     useState<number | null>(1);

//   const [search, setSearch] = useState("");

//   const [deliveryType, setDeliveryType] =
//     useState<DeliveryType>("pickup");

//   const [paymentMethod, setPaymentMethod] =
//     useState<PaymentMethod>("paid-full");

//   const [shopNotes, setShopNotes] =
//     useState("");

//   const [showDeliveryModal, setShowDeliveryModal] =
//     useState(false);

//   const [orderPlaced, setOrderPlaced] =
//     useState(false);

//   /* -------------------------------------------------------
//      SELECTED DOCUMENT
//   ------------------------------------------------------- */

//   const selectedDocument =
//     documents.find((doc) => doc.id === selectedDocumentId) ??
//     documents[0];

//   /* -------------------------------------------------------
//      UPDATE DOCUMENT
//   ------------------------------------------------------- */

//   const updateDocument = (
//     id: number,
//     updates: Partial<PrintDocument>
//   ) => {
//     setDocuments((current) =>
//       current.map((doc) =>
//         doc.id === id
//           ? {
//             ...doc,
//             ...updates,
//           }
//           : doc
//       )
//     );
//   };

//   /* -------------------------------------------------------
//      FILE UPLOAD
//   ------------------------------------------------------- */

//   const handleFiles = (
//     event: ChangeEvent<HTMLInputElement>
//   ) => {
//     const files = Array.from(event.target.files ?? []);

//     if (!files.length) return;

//     const newDocuments: PrintDocument[] = files.map(
//       (file, index) => ({
//         ...initialDocument,
//         id:
//           Date.now() +
//           index,
//         name: file.name,
//         size:
//           file.size > 1024 * 1024
//             ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
//             : `${Math.max(
//               1,
//               Math.round(file.size / 1024)
//             )} KB`,
//       })
//     );

//     setDocuments((current) => [
//       ...current,
//       ...newDocuments,
//     ]);

//     if (newDocuments.length) {
//       setSelectedDocumentId(newDocuments[0].id);
//     }

//     event.target.value = "";
//   };

//   /* -------------------------------------------------------
//      REMOVE DOCUMENT
//   ------------------------------------------------------- */

//   const removeDocument = (id: number) => {
//     setDocuments((current) => {
//       if (current.length === 1) {
//         return current;
//       }

//       const next = current.filter(
//         (doc) => doc.id !== id
//       );

//       if (id === selectedDocumentId && next.length) {
//         setSelectedDocumentId(next[0].id);
//       }

//       return next;
//     });
//   };

//   /* -------------------------------------------------------
//      PRICE CALCULATION
//   ------------------------------------------------------- */

//   const documentPrices = useMemo(() => {
//     return documents.map((doc) => {
//       let pageRate =
//         doc.colorMode === "color"
//           ? 7
//           : 1.5;

//       let paperRate = 0;

//       switch (doc.paperType) {
//         case "a4":
//           paperRate = 0;
//           break;

//         case "a3":
//           paperRate = 1.5;
//           break;

//         case "bond":
//           paperRate = 1;
//           break;

//         case "matte":
//           paperRate = 2;
//           break;
//       }

//       let bindingRate = 0;

//       switch (doc.binding) {
//         case "spiral":
//           bindingRate = 40;
//           break;

//         case "soft":
//           bindingRate = 70;
//           break;

//         case "hard":
//           bindingRate = 180;
//           break;

//         default:
//           bindingRate = 0;
//       }

//       let extraRate = 0;

//       switch (doc.extra) {
//         case "lamination":
//           extraRate =
//             doc.pages * 10;
//           break;

//         case "stapling":
//           extraRate = 5;
//           break;

//         default:
//           extraRate = 0;
//       }

//       const layoutMultiplier =
//         doc.pageLayout === "2"
//           ? 0.65
//           : doc.pageLayout === "4"
//             ? 0.45
//             : 1;

//       const formatMultiplier =
//         doc.format === "both"
//           ? 1.35
//           : 1;

//       const printCost =
//         Math.max(
//           0.75,
//           Math.round(
//             doc.pages *
//             pageRate *
//             layoutMultiplier *
//             formatMultiplier
//           )
//         );

//       const paperCost =
//         doc.pages * paperRate;

//       const subtotal =
//         (printCost + paperCost + bindingRate + extraRate) *
//         doc.quantity;

//       return {
//         documentId: doc.id,
//         printCost,
//         paperCost,
//         bindingRate,
//         extraRate,
//         subtotal,
//       };
//     });
//   }, [documents]);

//   const documentsTotal = documentPrices.reduce(
//     (total, item) =>
//       total + item.subtotal,
//     0
//   );

//   const deliveryCost =
//     deliveryType === "delivery"
//       ? 30
//       : 0;

//   const finalTotal =
//     documentsTotal + deliveryCost;

//   /* -------------------------------------------------------
//      SELECTED SHOP
//   ------------------------------------------------------- */

//   const selectedShop =
//     shops.find(
//       (shop) => shop.id === selectedShopId
//     ) ?? shops[0];

//   /* -------------------------------------------------------
//      SEARCH
//   ------------------------------------------------------- */

//   const filteredShops =
//     shops.filter((shop) =>
//       `${shop.name} ${shop.address}`
//         .toLowerCase()
//         .includes(search.toLowerCase())
//     );

//   /* -------------------------------------------------------
//      PAYMENT LABEL
//   ------------------------------------------------------- */

//   const paymentLabel = {
//     "paid-full": "Paid Full",
//     advance: "Pay Advance",
//     "pickup-pay": "Pickup Pay",
//     "delivery-pay": "Delivery Pay",
//   }[paymentMethod];

//   /* -------------------------------------------------------
//      PLACE ORDER
//   ------------------------------------------------------- */

//   const placeOrder = () => {
//     setOrderPlaced(true);
//   };

//   return (
//     <section
//       id="print-simulator"
//       className="relative overflow-hidden bg-[#080c14] py-16 sm:py-20 lg:py-24"
//     >
//       <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">

//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <div className="mx-auto mb-10 max-w-4xl text-center">
//           <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#26344a] bg-[#101722] px-4 py-1.5">
//             <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

//             <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-400">
//               PRODUCT DEMO
//             </span>
//           </div>

//           <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
//             Experience the XEROXMATE Workflow
//           </h2>

//           <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
//             Explore how XEROXMATE makes online printing simple — upload, customize, choose a shop, select fulfillment, and place your order.
//           </p>
//         </div>

//         {/* =================================================
//             MAIN APPLICATION
//         ================================================= */}

//         <div className="space-y-5">

//           {/* =================================================
//               ROW 1
//           ================================================= */}

//           <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">

//             {/* =============================================
//                 UPLOAD CARD
//             ============================================= */}

//             <div className="rounded-[22px] border border-[#263247] bg-[#101722] p-5 sm:p-6">

//               <div className="mb-5">
//                 <h3 className="text-lg font-semibold text-white">
//                   Upload documents
//                 </h3>

//                 <p className="mt-1 text-sm leading-6 text-slate-400">
//                   Add one or more files. You can update each
//                   file&apos;s print settings alongside it.
//                 </p>
//               </div>

//               <div className="rounded-[20px] border border-[#263247] bg-[#0c131e] p-4">

//                 <div className="flex min-h-[310px] flex-col items-center justify-center rounded-[18px] border border-dashed border-blue-500/70 bg-[#062c25] px-5 text-center">

//                   <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
//                     <CircleCheck
//                       className="text-emerald-400"
//                       size={30}
//                     />
//                   </div>

//                   <h4 className="text-xl font-semibold text-white">
//                     Upload complete
//                   </h4>

//                   <p className="mt-2 text-sm text-slate-400">
//                     {selectedDocument?.name}
//                   </p>

//                   <p className="mt-2 text-sm font-medium text-emerald-400">
//                     Ready to customize
//                   </p>

//                   <div className="mt-7 flex flex-wrap justify-center gap-2">

//                     <button
//                       type="button"
//                       onClick={() =>
//                         documents.length > 1 &&
//                         removeDocument(
//                           selectedDocument.id
//                         )
//                       }
//                       disabled={documents.length === 1}
//                       className="inline-flex items-center gap-2 rounded-xl border border-[#344257] bg-[#101722] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
//                     >
//                       <Trash2 size={16} />
//                       Remove
//                     </button>

//                     <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#344257] bg-[#101722] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-400/50 hover:text-blue-300">
//                       <Upload size={16} />
//                       Add Files

//                       <input
//                         type="file"
//                         multiple
//                         accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx"
//                         className="hidden"
//                         onChange={handleFiles}
//                       />
//                     </label>

//                   </div>
//                 </div>

//                 <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
//                   <FileText
//                     size={15}
//                     className="text-blue-400"
//                   />

//                   After uploading, choose a shop and
//                   customize every file.
//                 </div>

//               </div>

//               {/* Document tabs */}

//               {documents.length > 0 && (
//                 <div className="mt-5 space-y-2">
//                   {documents.map((doc, index) => (
//                     <button
//                       key={doc.id}
//                       type="button"
//                       onClick={() =>
//                         setSelectedDocumentId(doc.id)
//                       }
//                       className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedDocumentId === doc.id
//                           ? "border-blue-500/70 bg-blue-500/10"
//                           : "border-[#263247] bg-[#0c131e] hover:border-[#3a4c66]"
//                         }`}
//                     >
//                       <FileText
//                         size={18}
//                         className={
//                           selectedDocumentId === doc.id
//                             ? "text-blue-400"
//                             : "text-slate-500"
//                         }
//                       />

//                       <div className="min-w-0 flex-1">
//                         <p className="truncate text-sm font-medium text-white">
//                           Document {index + 1} · {doc.name}
//                         </p>

//                         <p className="mt-0.5 text-xs text-slate-500">
//                           {doc.pages} page
//                           {doc.pages !== 1 ? "s" : ""} ·{" "}
//                           {doc.size}
//                         </p>
//                       </div>

//                       {selectedDocumentId === doc.id && (
//                         <Check
//                           size={16}
//                           className="text-blue-400"
//                         />
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* =============================================
//                 DOCUMENT SPECIFICATIONS
//             ============================================= */}

//             <div className="rounded-[22px] border border-[#263247] bg-[#101722] p-5 sm:p-6">

//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-white">
//                   Documents + specifications
//                 </h3>

//                 <p className="mt-1 text-sm text-blue-300/80">
//                   Every file has its own print settings and quote.
//                 </p>
//               </div>

//               <div className="overflow-hidden rounded-[20px] border border-[#29364a] bg-[#141c28]">

//                 {/* Document header */}

//                 <div className="flex items-start justify-between gap-4 border-b border-[#29364a] p-5">

//                   <div className="flex min-w-0 gap-3">

//                     <div className="mt-0.5">
//                       <FileText
//                         size={20}
//                         className="text-blue-400"
//                       />
//                     </div>

//                     <div className="min-w-0">
//                       <span className="inline-flex rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
//                         Document{" "}
//                         {documents.findIndex(
//                           (doc) =>
//                             doc.id ===
//                             selectedDocumentId
//                         ) + 1}
//                       </span>

//                       <h4 className="mt-2 truncate text-base font-semibold text-white">
//                         {selectedDocument.name}
//                       </h4>

//                       <p className="mt-1 text-sm text-slate-400">
//                         {selectedDocument.pages} page ·{" "}
//                         {selectedDocument.size} · Detected
//                         automatically
//                       </p>

//                       <p className="mt-1 text-sm font-medium text-white">
//                         {selectedDocument.quantity}{" "}
//                         {selectedDocument.quantity === 1
//                           ? "paper"
//                           : "papers"}
//                       </p>
//                     </div>

//                   </div>

//                   <div className="flex shrink-0 items-center gap-3">
//                     <button
//                       type="button"
//                       className="text-slate-400 transition hover:text-white"
//                     >
//                       <Eye size={18} />
//                     </button>

//                     <button
//                       type="button"
//                       disabled={documents.length === 1}
//                       onClick={() =>
//                         removeDocument(
//                           selectedDocument.id
//                         )
//                       }
//                       className="text-slate-400 transition hover:text-red-400 disabled:opacity-30"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </div>

//                 </div>

//                 {/* Specifications */}

//                 <div className="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2">

//                   {/* Paper */}

//                   <SelectField
//                     label="Paper type"
//                     value={selectedDocument.paperType}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           paperType:
//                             value as PaperType,
//                         }
//                       )
//                     }
//                     options={[
//                       ["a4", "A4 Paper"],
//                       ["a3", "A3 Paper"],
//                       ["bond", "Bond Paper"],
//                       ["matte", "Matte Paper"],
//                     ]}
//                   />

//                   {/* Quantity */}

//                   <div>
//                     <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Quantity
//                     </label>

//                     <div className="flex h-11 overflow-hidden rounded-xl border border-[#344257] bg-[#101722]">

//                       <button
//                         type="button"
//                         onClick={() =>
//                           updateDocument(
//                             selectedDocument.id,
//                             {
//                               quantity:
//                                 Math.max(
//                                   1,
//                                   selectedDocument.quantity -
//                                   1
//                                 ),
//                             }
//                           )
//                         }
//                         className="flex w-12 items-center justify-center border-r border-[#344257] text-slate-300 transition hover:bg-[#182232]"
//                       >
//                         <Minus size={16} />
//                       </button>

//                       <div className="flex flex-1 items-center justify-center text-sm font-semibold text-white">
//                         {selectedDocument.quantity}
//                       </div>

//                       <button
//                         type="button"
//                         onClick={() =>
//                           updateDocument(
//                             selectedDocument.id,
//                             {
//                               quantity:
//                                 selectedDocument.quantity +
//                                 1,
//                             }
//                           )
//                         }
//                         className="flex w-12 items-center justify-center border-l border-[#344257] text-slate-300 transition hover:bg-[#182232]"
//                       >
//                         <Plus size={16} />
//                       </button>

//                     </div>
//                   </div>

//                   {/* Colour */}

//                   <SelectField
//                     label="Colour"
//                     value={selectedDocument.colorMode}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           colorMode:
//                             value as ColorMode,
//                         }
//                       )
//                     }
//                     options={[
//                       ["bw", "Black & White"],
//                       ["color", "Colour"],
//                     ]}
//                   />

//                   {/* Format */}

//                   <SelectField
//                     label="Format"
//                     value={selectedDocument.format}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           format:
//                             value as PrintFormat,
//                         }
//                       )
//                     }
//                     options={[
//                       ["front", "Front only"],
//                       ["both", "Front & back"],
//                     ]}
//                   />

//                   {/* Binding */}

//                   <SelectField
//                     label="Binding"
//                     value={selectedDocument.binding}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           binding:
//                             value as Binding,
//                         }
//                       )
//                     }
//                     options={[
//                       ["none", "No binding"],
//                       ["spiral", "Spiral"],
//                       ["soft", "Soft binding"],
//                       ["hard", "Hard binding"],
//                     ]}
//                   />

//                   {/* Layout */}

//                   <SelectField
//                     label="Page layout"
//                     value={selectedDocument.pageLayout}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           pageLayout:
//                             value as PageLayout,
//                         }
//                       )
//                     }
//                     options={[
//                       ["1", "1 Page / Sheet"],
//                       ["2", "2 Pages / Sheet"],
//                       ["4", "4 Pages / Sheet"],
//                     ]}
//                   />

//                   {/* Extras */}

//                   <SelectField
//                     label="Lamination / extras"
//                     value={selectedDocument.extra}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           extra:
//                             value as Extra,
//                         }
//                       )
//                     }
//                     options={[
//                       ["none", "No extra service"],
//                       ["lamination", "Lamination"],
//                       ["stapling", "Stapling"],
//                     ]}
//                   />

//                   {/* Orientation */}

//                   <SelectField
//                     label="Orientation"
//                     value={selectedDocument.orientation}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           orientation:
//                             value as Orientation,
//                         }
//                       )
//                     }
//                     options={[
//                       ["portrait", "Portrait"],
//                       ["landscape", "Landscape"],
//                     ]}
//                   />

//                   {/* Range */}

//                   <InputField
//                     label="Range"
//                     placeholder="e.g. 1-5, 8, 10-12"
//                     value={selectedDocument.range}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           range: value,
//                         }
//                       )
//                     }
//                   />

//                   {/* Instructions */}

//                   <InputField
//                     label="Special instructions (optional)"
//                     placeholder="e.g. staple at top-left"
//                     value={selectedDocument.instructions}
//                     onChange={(value) =>
//                       updateDocument(
//                         selectedDocument.id,
//                         {
//                           instructions: value,
//                         }
//                       )
//                     }
//                   />

//                 </div>

//               </div>
//             </div>
//           </div>

//           {/* =================================================
//               SHOP SELECTION
//           ================================================= */}

//           <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

//             {/* SHOP LIST */}

//             <div className="rounded-[22px] border border-[#263247] bg-[#101722] p-5 sm:p-6">

//               <div className="mb-5">
//                 <h3 className="text-lg font-semibold text-white">
//                   Select Nearby print shops to Continue
//                 </h3>

//                 <p className="mt-1 text-sm text-slate-400">
//                   Prices update instantly based on the shop you pick.
//                 </p>
//               </div>

//               {/* Search */}

//               <div className="mb-5 flex gap-2">

//                 <div className="relative flex-1">
//                   <Search
//                     size={17}
//                     className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
//                   />

//                   <input
//                     value={search}
//                     onChange={(e) =>
//                       setSearch(e.target.value)
//                     }
//                     placeholder="Search shops..."
//                     className="h-11 w-full rounded-xl border border-[#2d3a4e] bg-[#0e1621] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/70"
//                   />
//                 </div>

//                 <button
//                   type="button"
//                   className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2d3a4e] bg-[#0e1621] text-slate-400 transition hover:border-blue-500/60 hover:text-blue-400"
//                 >
//                   <SlidersHorizontal size={17} />
//                 </button>

//               </div>

//               {/* Shops */}

//               <div className="space-y-3">

//                 {filteredShops.map((shop) => {
//                   const selected =
//                     selectedShopId === shop.id;

//                   return (
//                     <button
//                       key={shop.id}
//                       type="button"
//                       onClick={() =>
//                         setSelectedShopId(shop.id)
//                       }
//                       className={`w-full rounded-[18px] border p-4 text-left transition ${selected
//                           ? "border-blue-500 bg-[#122541]"
//                           : "border-[#29364a] bg-[#0f1722] hover:border-[#3a4b65]"
//                         }`}
//                     >

//                       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

//                         <div className="min-w-0">

//                           <div className="flex items-center gap-3">
//                             <span className="text-base font-semibold text-white">
//                               {shop.name}
//                             </span>

//                             <span
//                               className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.open
//                                   ? "bg-emerald-500/10 text-emerald-400"
//                                   : "bg-red-500/10 text-red-400"
//                                 }`}
//                             >
//                               {shop.open
//                                 ? "Open"
//                                 : "Closed"}
//                             </span>
//                           </div>

//                           <div className="mt-3 flex items-start gap-2 text-sm text-blue-200/70">
//                             <MapPin
//                               size={15}
//                               className="mt-0.5 shrink-0"
//                             />
//                             <span>
//                               {shop.address}
//                             </span>
//                           </div>

//                           <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">

//                             <span className="flex items-center gap-1">
//                               <span className="text-white">
//                                 ★
//                               </span>
//                               0
//                             </span>

//                             <span>
//                               {shop.delivery
//                                 ? "Pickup + Delivery"
//                                 : "Pickup only"}
//                             </span>

//                           </div>

//                         </div>

//                         <div className="shrink-0 text-left sm:text-right">

//                           <div className="text-xs text-blue-200/70">
//                             {shop.hours}
//                           </div>

//                           <div className="mt-3 text-sm font-bold text-white">
//                             Total Amount : ₹
//                             {finalTotal.toFixed(2)}
//                           </div>

//                         </div>

//                       </div>

//                     </button>
//                   );
//                 })}

//               </div>

//             </div>

//             {/* SELECTED SHOP */}

//             <div className="h-fit rounded-[22px] border border-[#263247] bg-[#101722] p-5 sm:p-6 lg:sticky lg:top-6">

//               <div className="flex items-start justify-between border-b border-[#29364a] pb-5">

//                 <div>
//                   <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/70">
//                     Selected shop
//                   </p>

//                   <h3 className="mt-2 text-xl font-bold text-white">
//                     {selectedShop.name}
//                   </h3>

//                   <p className="mt-1 text-sm text-blue-200/70">
//                     {selectedShop.hours}
//                   </p>
//                 </div>

//                 <span
//                   className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedShop.open
//                       ? "bg-emerald-500/10 text-emerald-400"
//                       : "bg-red-500/10 text-red-400"
//                     }`}
//                 >
//                   {selectedShop.open
//                     ? "Open"
//                     : "Closed"}
//                 </span>

//               </div>

//               <div className="py-5">

//                 <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
//                   File costs
//                 </p>

//                 {documents.map((doc, index) => {
//                   const price =
//                     documentPrices.find(
//                       (item) =>
//                         item.documentId === doc.id
//                     );

//                   return (
//                     <div
//                       key={doc.id}
//                       className="border-b border-[#29364a] py-3 last:border-0"
//                     >
//                       <div className="flex items-center justify-between">
//                         <span className="text-sm font-semibold text-white">
//                           Document {index + 1}
//                         </span>

//                         <span className="text-sm font-bold text-white">
//                           ₹
//                           {(
//                             price?.subtotal ?? 0
//                           ).toFixed(2)}
//                         </span>
//                       </div>

//                       <p className="mt-1 text-xs text-slate-500">
//                         {doc.pages} page ·{" "}
//                         {doc.quantity} copy ·{" "}
//                         {colorLabels[doc.colorMode]} ·{" "}
//                         {paperLabels[doc.paperType]}
//                       </p>
//                     </div>
//                   );
//                 })}

//               </div>

//               <div className="border-t border-[#29364a] pt-4">

//                 <div className="flex justify-between text-sm text-blue-200/70">
//                   <span>Priority Amount</span>
//                   <span>
//                     ₹{documentsTotal.toFixed(2)}
//                   </span>
//                 </div>

//                 <div className="mt-3 flex justify-between">
//                   <span className="font-semibold text-white">
//                     Final total
//                   </span>

//                   <span className="font-bold text-white">
//                     ₹{finalTotal.toFixed(2)}
//                   </span>
//                 </div>

//               </div>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setShowDeliveryModal(true)
//                 }
//                 className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5f96f5] text-sm font-semibold text-[#07101e] transition hover:bg-[#72a4fa]"
//               >
//                 Continue
//                 <ChevronRight size={17} />
//               </button>

//             </div>
//           </div>

//           {/* =================================================
//               PAYMENT + ORDER SUMMARY
//           ================================================= */}

//           <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">

//             {/* PAYMENT */}

//             <div className="rounded-[22px] border border-[#263247] bg-[#101722] p-5 sm:p-6">

//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-white">
//                   Payment method
//                 </h3>

//                 <p className="mt-1 text-sm text-slate-400">
//                   Accepted by {selectedShop.name}
//                 </p>
//               </div>

//               <div className="grid gap-3 sm:grid-cols-2">

//                 <PaymentButton
//                   active={
//                     paymentMethod ===
//                     "paid-full"
//                   }
//                   icon={<WalletCards size={19} />}
//                   label="Paid Full"
//                   onClick={() =>
//                     setPaymentMethod(
//                       "paid-full"
//                     )
//                   }
//                 />

//                 <PaymentButton
//                   active={
//                     paymentMethod ===
//                     "advance"
//                   }
//                   icon={<WalletCards size={19} />}
//                   label="Pay Advance"
//                   onClick={() =>
//                     setPaymentMethod(
//                       "advance"
//                     )
//                   }
//                 />

//                 <PaymentButton
//                   active={
//                     paymentMethod ===
//                     "pickup-pay"
//                   }
//                   disabled={
//                     deliveryType !== "pickup"
//                   }
//                   icon={<Banknote size={19} />}
//                   label="Pickup Pay"
//                   onClick={() =>
//                     setPaymentMethod(
//                       "pickup-pay"
//                     )
//                   }
//                 />

//                 <PaymentButton
//                   active={
//                     paymentMethod ===
//                     "delivery-pay"
//                   }
//                   disabled={
//                     deliveryType !==
//                     "delivery"
//                   }
//                   icon={<Banknote size={19} />}
//                   label="Delivery Pay"
//                   onClick={() =>
//                     setPaymentMethod(
//                       "delivery-pay"
//                     )
//                   }
//                 />

//               </div>

//               <div className="mt-7">

//                 <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Notes for the shop (optional)
//                 </label>

//                 <textarea
//                   value={shopNotes}
//                   onChange={(e) =>
//                     setShopNotes(
//                       e.target.value
//                     )
//                   }
//                   rows={4}
//                   placeholder="e.g. Print the cover page in colour"
//                   className="w-full resize-none rounded-xl border border-[#344257] bg-[#0d1520] p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/70"
//                 />

//               </div>

//               {/* Print shop */}

//               <div className="mt-5 rounded-xl border border-[#29364a] bg-[#0d1520] p-4">

//                 <h4 className="mb-4 text-sm font-semibold text-white">
//                   Print shop
//                 </h4>

//                 <div className="space-y-3 text-sm">

//                   <div className="flex items-start gap-3 text-slate-300">
//                     <Store
//                       size={17}
//                       className="mt-0.5 text-blue-400"
//                     />
//                     {selectedShop.name}
//                   </div>

//                   <div className="flex items-start gap-3 text-slate-400">
//                     <MapPin
//                       size={17}
//                       className="mt-0.5 shrink-0"
//                     />
//                     {selectedShop.address}
//                   </div>

//                   <div className="flex items-center gap-3 text-slate-400">
//                     <Phone
//                       size={17}
//                       className="text-slate-500"
//                     />
//                     {selectedShop.phone}
//                   </div>

//                   <div className="flex items-center gap-3 text-slate-400">
//                     <Clock3
//                       size={17}
//                       className="text-slate-500"
//                     />
//                     {selectedShop.hours}
//                   </div>

//                 </div>

//               </div>

//             </div>

//             {/* ORDER SUMMARY */}

//             <div className="rounded-[22px] border border-[#263247] bg-[#101722] p-5 sm:p-6">

//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-white">
//                   Order summary
//                 </h3>

//                 <p className="mt-1 text-sm text-slate-400">
//                   Review your order before placing it.
//                 </p>
//               </div>

//               <div className="space-y-0">

//                 <SummaryRow
//                   label="Shop"
//                   value={selectedShop.name}
//                 />

//                 <SummaryRow
//                   label="Documents"
//                   value={`${documents.length} File${documents.length !== 1
//                       ? "s"
//                       : ""
//                     } · ${documents.reduce(
//                       (sum, doc) =>
//                         sum +
//                         doc.pages *
//                         doc.quantity,
//                       0
//                     )} Pages`}
//                 />

//                 <SummaryRow
//                   label="Delivery Option"
//                   value={
//                     deliveryType ===
//                       "pickup"
//                       ? "Pickup At Shop"
//                       : "Home Delivery"
//                   }
//                 />

//                 <SummaryRow
//                   label="Address"
//                   value={
//                     deliveryType ===
//                       "delivery"
//                       ? "Delivery address selected"
//                       : "—"
//                   }
//                 />

//                 <SummaryRow
//                   label="Payment"
//                   value={paymentLabel}
//                 />

//                 <SummaryRow
//                   label="Notes"
//                   value={
//                     shopNotes.trim()
//                       ? shopNotes
//                       : "—"
//                   }
//                 />

//               </div>

//               {/* Total */}

//               <div className="mt-5 rounded-[18px] border border-[#29364a] bg-[#151e2b] p-5">

//                 <div className="flex justify-between text-sm">
//                   <span className="text-blue-200/70">
//                     Documents
//                   </span>

//                   <span className="font-semibold text-white">
//                     ₹
//                     {documentsTotal.toFixed(
//                       2
//                     )}
//                   </span>
//                 </div>

//                 <div className="mt-3 flex justify-between text-sm">
//                   <span className="text-blue-200/70">
//                     Delivery
//                   </span>

//                   <span className="font-semibold text-white">
//                     ₹
//                     {deliveryCost.toFixed(
//                       2
//                     )}
//                   </span>
//                 </div>

//                 <div className="my-4 h-px bg-[#29364a]" />

//                 <div className="flex items-center justify-between">

//                   <span className="text-lg font-bold text-white">
//                     Total
//                   </span>

//                   <span className="text-lg font-bold text-white">
//                     ₹
//                     {finalTotal.toFixed(
//                       2
//                     )}
//                   </span>

//                 </div>

//                 <p className="mt-2 text-xs text-blue-200/60">
//                   {paymentLabel}
//                   {paymentMethod ===
//                     "paid-full" &&
//                     ` · ₹${finalTotal.toFixed(
//                       2
//                     )}`}
//                 </p>

//               </div>

//               {/* Bottom actions */}

//               <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#29364a] pt-5">

//                 <button
//                   type="button"
//                   className="inline-flex items-center gap-2 rounded-xl border border-[#344257] bg-transparent px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-[#172131]"
//                 >
//                   <ChevronLeft size={17} />
//                   Back
//                 </button>

//                 <button
//                   type="button"
//                   onClick={placeOrder}
//                   className="inline-flex items-center gap-2 rounded-xl bg-[#5f96f5] px-5 py-3 text-sm font-semibold text-[#07101e] transition hover:bg-[#72a4fa]"
//                 >
//                   Confirm & place order
//                   <ChevronRight size={17} />
//                 </button>

//               </div>

//             </div>

//           </div>

//         </div>
//       </div>

//       {/* =================================================
//           DELIVERY MODAL
//       ================================================= */}

//       <AnimatePresence>
//         {showDeliveryModal && (
//           <motion.div
//             initial={{
//               opacity: 0,
//             }}
//             animate={{
//               opacity: 1,
//             }}
//             exit={{
//               opacity: 0,
//             }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
//             onClick={() =>
//               setShowDeliveryModal(false)
//             }
//           >

//             <motion.div
//               initial={{
//                 opacity: 0,
//                 scale: 0.96,
//                 y: 15,
//               }}
//               animate={{
//                 opacity: 1,
//                 scale: 1,
//                 y: 0,
//               }}
//               exit={{
//                 opacity: 0,
//                 scale: 0.96,
//                 y: 15,
//               }}
//               transition={{
//                 duration: 0.2,
//               }}
//               onClick={(event) =>
//                 event.stopPropagation()
//               }
//               className="w-full max-w-4xl rounded-[22px] border border-[#29364a] bg-[#080e17] p-6 shadow-2xl sm:p-8"
//             >

//               {/* Modal header */}

//               <div className="flex items-start justify-between">

//                 <div>
//                   <h3 className="text-2xl font-bold text-white">
//                     How would you like to receive your order?
//                   </h3>

//                   <p className="mt-2 text-base text-slate-400">
//                     {selectedShop.name}
//                   </p>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setShowDeliveryModal(false)
//                   }
//                   className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
//                 >
//                   <X size={20} />
//                 </button>

//               </div>

//               {/* Options */}

//               <div className="mt-10 grid gap-5 sm:grid-cols-2">

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setDeliveryType("pickup");
//                     setShowDeliveryModal(
//                       false
//                     );
//                   }}
//                   className={`min-h-[140px] rounded-[20px] border p-6 text-center transition ${deliveryType ===
//                       "pickup"
//                       ? "border-blue-500 bg-[#122541]"
//                       : "border-[#29364a] bg-[#0d141f] hover:border-[#3a4c66]"
//                     }`}
//                 >

//                   <Store
//                     size={27}
//                     className="mx-auto text-blue-400"
//                   />

//                   <p className="mt-4 text-lg font-semibold text-white">
//                     Pickup at shop
//                   </p>

//                 </button>

//                 <button
//                   type="button"
//                   disabled={
//                     !selectedShop.delivery
//                   }
//                   onClick={() => {
//                     setDeliveryType(
//                       "delivery"
//                     );
//                     setShowDeliveryModal(
//                       false
//                     );
//                   }}
//                   className={`min-h-[140px] rounded-[20px] border p-6 text-center transition ${!selectedShop.delivery
//                       ? "cursor-not-allowed border-[#202a39] bg-[#090f17] opacity-45"
//                       : deliveryType ===
//                         "delivery"
//                         ? "border-blue-500 bg-[#122541]"
//                         : "border-[#29364a] bg-[#0d141f] hover:border-[#3a4c66]"
//                     }`}
//                 >

//                   <Truck
//                     size={27}
//                     className="mx-auto text-blue-400"
//                   />

//                   <p className="mt-4 text-lg font-semibold text-white">
//                     Home delivery
//                   </p>

//                   {!selectedShop.delivery && (
//                     <p className="mt-2 text-sm text-slate-500">
//                       This shop does not deliver
//                     </p>
//                   )}

//                 </button>

//               </div>

//               {/* Continue */}

//               <div className="mt-8 flex justify-end">

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setShowDeliveryModal(
//                       false
//                     )
//                   }
//                   className="inline-flex items-center gap-2 rounded-xl bg-[#5f96f5] px-6 py-3 text-sm font-semibold text-[#07101e] transition hover:bg-[#72a4fa]"
//                 >
//                   Continue
//                   <ChevronRight size={17} />
//                 </button>

//               </div>

//             </motion.div>

//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* =================================================
//           ORDER SUCCESS
//       ================================================= */}

//       <AnimatePresence>
//         {orderPlaced && (
//           <motion.div
//             initial={{
//               opacity: 0,
//               y: 20,
//             }}
//             animate={{
//               opacity: 1,
//               y: 0,
//             }}
//             className="fixed bottom-6 right-6 z-[60] w-[min(380px,calc(100vw-32px))] rounded-2xl border border-emerald-500/30 bg-[#101b18] p-5 shadow-2xl"
//           >

//             <div className="flex items-start gap-4">

//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
//                 <PackageCheck
//                   size={21}
//                   className="text-emerald-400"
//                 />
//               </div>

//               <div className="flex-1">
//                 <p className="font-semibold text-white">
//                   Order ready to place
//                 </p>

//                 <p className="mt-1 text-sm leading-5 text-slate-400">
//                   Your XEROXMATE order has been
//                   configured successfully.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setOrderPlaced(false)
//                 }
//                 className="text-slate-500 hover:text-white"
//               >
//                 <X size={17} />
//               </button>

//             </div>

//           </motion.div>
//         )}
//       </AnimatePresence>
//     </section>
//   );
// }

// /* =========================================================
//    SELECT FIELD
// ========================================================= */

// function SelectField({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: [string, string][];
// }) {
//   return (
//     <div>
//       <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
//         {label}
//       </label>

//       <select
//         value={value}
//         onChange={(event) =>
//           onChange(event.target.value)
//         }
//         className="h-11 w-full appearance-none rounded-xl border border-[#344257] bg-[#101722] px-4 text-sm font-medium text-slate-200 outline-none transition focus:border-blue-500/70"
//       >
//         {options.map(([id, text]) => (
//           <option
//             key={id}
//             value={id}
//             className="bg-[#101722]"
//           >
//             {text}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// }

// /* =========================================================
//    INPUT FIELD
// ========================================================= */

// function InputField({
//   label,
//   placeholder,
//   value,
//   onChange,
// }: {
//   label: string;
//   placeholder: string;
//   value: string;
//   onChange: (value: string) => void;
// }) {
//   return (
//     <div>
//       <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
//         {label}
//       </label>

//       <input
//         value={value}
//         onChange={(event) =>
//           onChange(event.target.value)
//         }
//         placeholder={placeholder}
//         className="h-11 w-full rounded-xl border border-[#344257] bg-[#101722] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/70"
//       />
//     </div>
//   );
// }

// /* =========================================================
//    PAYMENT BUTTON
// ========================================================= */

// function PaymentButton({
//   active,
//   disabled,
//   icon,
//   label,
//   onClick,
// }: {
//   active: boolean;
//   disabled?: boolean;
//   icon: React.ReactNode;
//   label: string;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       disabled={disabled}
//       onClick={onClick}
//       className={`flex h-16 items-center gap-3 rounded-[18px] border px-5 text-left transition ${disabled
//           ? "cursor-not-allowed border-[#202a39] bg-[#0b1119] text-slate-600"
//           : active
//             ? "border-blue-500 bg-[#122541] text-white"
//             : "border-[#29364a] bg-[#0d1520] text-slate-300 hover:border-[#3a4c66]"
//         }`}
//     >
//       <span
//         className={
//           active
//             ? "text-blue-400"
//             : "text-slate-500"
//         }
//       >
//         {icon}
//       </span>

//       <span className="text-sm font-semibold">
//         {label}
//       </span>
//     </button>
//   );
// }

// /* =========================================================
//    SUMMARY ROW
// ========================================================= */

// function SummaryRow({
//   label,
//   value,
// }: {
//   label: string;
//   value: string;
// }) {
//   return (
//     <div className="flex items-start justify-between gap-6 border-b border-[#29364a] py-3.5 last:border-0">
//       <span className="text-sm text-blue-200/70">
//         {label}
//       </span>

//       <span className="max-w-[60%] text-right text-sm font-medium text-white">
//         {value}
//       </span>
//     </div>
//   );
// }























































"use client";

import {
  ChangeEvent,
  useMemo,
  useState,
} from "react";
import {
  Upload,
  FileText,
  FileImage,
  File,
  X,
  Plus,
  Check,
  MapPin,
  Star,
  Clock3,
  Truck,
  Store,
  CreditCard,
  Wallet,
  Banknote,
  ChevronRight,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

type ColorMode = "bw" | "color";
type PrintFormat = "front" | "both";
type PaperType = "a4" | "a3" | "bond" | "matte";
type Binding = "none" | "spiral" | "soft" | "hard";
type Extra = "none" | "lamination" | "stapling";
type PageLayout = "1" | "2" | "4";
type Orientation = "portrait" | "landscape";
type DeliveryType = "pickup" | "delivery";
type PaymentMethod =
  | "paid-full"
  | "advance"
  | "pickup-pay"
  | "delivery-pay";

type PrintDocument = {
  id: number;
  name: string;
  pages: number;
  size: string;
  paperType: PaperType;
  quantity: number;
  colorMode: ColorMode;
  format: PrintFormat;
  binding: Binding;
  pageLayout: PageLayout;
  extra: Extra;
  orientation: Orientation;
  range: string;
  instructions: string;
};

type Shop = {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  open: boolean;
  delivery: boolean;
  rating: number;
  distance: string;
};

const initialDocument: PrintDocument = {
  id: 1,
  name: "logo-light.png",
  pages: 1,
  size: "0.8 MB",
  paperType: "a4",
  quantity: 1,
  colorMode: "bw",
  format: "front",
  binding: "none",
  pageLayout: "1",
  extra: "none",
  orientation: "portrait",
  range: "",
  instructions: "",
};

const shops: Shop[] = [
  {
    id: 1,
    name: "AAA Xerox",
    address: "61D, Main Street, Ariyalur, Tamil Nadu",
    phone: "7638641234",
    hours: "12:01 AM – 11:59 PM",
    open: true,
    delivery: false,
    rating: 4.9,
    distance: "350 m",
  },
  {
    id: 2,
    name: "Tamil Printers",
    address: "No.4 Bismi Nagar, Kumbakonam, Tamil Nadu",
    phone: "9876543210",
    hours: "9:00 AM – 11:00 PM",
    open: false,
    delivery: true,
    rating: 4.8,
    distance: "1.1 km",
  },
  {
    id: 3,
    name: "Tamil Printer",
    address: "No.4 Bismi Nagar, Kumbakonam, Tamil Nadu",
    phone: "9876543210",
    hours: "9:00 AM – 11:00 PM",
    open: false,
    delivery: true,
    rating: 4.7,
    distance: "2.3 km",
  },
];

const paperLabels: Record<PaperType, string> = {
  a4: "A4",
  a3: "A3",
  bond: "Bond",
  matte: "Matte",
};

const bindingLabels: Record<Binding, string> = {
  none: "None",
  spiral: "Spiral ₹40",
  soft: "Soft ₹70",
  hard: "Hard ₹180",
};

const extraLabels: Record<Extra, string> = {
  none: "None",
  lamination: "Lamination ₹10/page",
  stapling: "Stapling ₹5/set",
};

export default function InteractiveSimulator() {
  const [documents, setDocuments] = useState<PrintDocument[]>([
    initialDocument,
  ]);

  const [selectedDocumentId, setSelectedDocumentId] = useState(1);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(1);

  const [search, setSearch] = useState("");
  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("pickup");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("paid-full");

  const [shopNotes, setShopNotes] = useState("");

  const [showDeliveryModal, setShowDeliveryModal] =
    useState(false);

  const [orderPlaced, setOrderPlaced] = useState(false);

  const selectedDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ??
    documents[0];

  const selectedShop =
    shops.find((shop) => shop.id === selectedShopId) ?? null;

  const filteredShops = shops.filter((shop) =>
    `${shop.name} ${shop.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ---------------------------------------------
     PRICE CALCULATION
  --------------------------------------------- */

  const getDocumentPrice = (doc: PrintDocument) => {
    const baseRate = doc.colorMode === "color" ? 7 : 1.5;

    const paperRate: Record<PaperType, number> = {
      a4: 0,
      a3: 1.5,
      bond: 1,
      matte: 2,
    };

    const bindingRate: Record<Binding, number> = {
      none: 0,
      spiral: 40,
      soft: 70,
      hard: 180,
    };

    const layoutMultiplier: Record<PageLayout, number> = {
      "1": 1,
      "2": 0.65,
      "4": 0.45,
    };

    const formatMultiplier =
      doc.format === "both" ? 1.35 : 1;

    const printing =
      doc.pages *
      (baseRate + paperRate[doc.paperType]) *
      layoutMultiplier[doc.pageLayout] *
      formatMultiplier;

    const binding = bindingRate[doc.binding];

    const extra =
      doc.extra === "lamination"
        ? doc.pages * 10
        : doc.extra === "stapling"
          ? 5
          : 0;

    return Math.max(
      1,
      Math.round((printing + binding + extra) * doc.quantity)
    );
  };

  const subtotal = useMemo(() => {
    return documents.reduce(
      (total, doc) => total + getDocumentPrice(doc),
      0
    );
  }, [documents]);

  const deliveryFee =
    deliveryType === "delivery" ? 30 : 0;

  const total = subtotal + deliveryFee;

  const advanceAmount = Math.ceil(total * 0.5);

  /* ---------------------------------------------
     DOCUMENT ACTIONS
  --------------------------------------------- */

  const updateDocument = (
    id: number,
    updates: Partial<PrintDocument>
  ) => {
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      )
    );
  };

  const removeDocument = (id: number) => {
    setDocuments((current) => {
      const next = current.filter((doc) => doc.id !== id);

      if (next.length === 0) {
        return [initialDocument];
      }

      return next;
    });

    if (selectedDocumentId === id) {
      const next = documents.find((doc) => doc.id !== id);
      if (next) {
        setSelectedDocumentId(next.id);
      }
    }
  };

  const handleUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    const newDocuments: PrintDocument[] = files.map(
      (file, index) => ({
        ...initialDocument,
        id: Date.now() + index,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      })
    );

    setDocuments((current) => [
      ...current,
      ...newDocuments,
    ]);

    setSelectedDocumentId(newDocuments[0].id);

    event.target.value = "";
  };

  /* ---------------------------------------------
     UI HELPERS
  --------------------------------------------- */

  const getFileIcon = (name: string) => {
    const extension =
      name.split(".").pop()?.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "webp"].includes(
        extension ?? ""
      )
    ) {
      return FileImage;
    }

    if (extension === "pdf") {
      return FileText;
    }

    return File;
  };

  const SectionHeader = ({
    number,
    icon: Icon,
    title,
    description,
  }: {
    number: string;
    icon: typeof Upload;
    title: string;
    description: string;
  }) => (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-bold text-white">
          {number}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Icon className="h-4 w-4 text-blue-400" />
            {title}
          </div>

          <p className="mt-0.5 text-[10px] text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  const OptionButton = ({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${active
          ? "border-blue-500 bg-blue-600/20 text-white"
          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white"
        }`}
    >
      {children}
    </button>
  );

  return (
    <section
      id="print-simulator"
      className="hidden bg-[#080c14] py-14 md:block"
    >
      <div className="mx-auto max-w-362.5 px-5 lg:px-8">

        {/* -----------------------------------------
            HEADING
        ----------------------------------------- */}

        <div className="mx-auto mb-6 max-w-3xl text-center">
          <div className="mb-2 inline-flex items-center rounded-full border border-blue-800/60 bg-blue-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
            Interactive Demo
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
            From Upload to Print, Made Simple
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-slate-400">
            Upload your documents, customize your print settings,
            choose a nearby print shop, select pickup or delivery,
            and place your order — all in one simple flow.
          </p>
        </div>

        {/* -----------------------------------------
            4 CARD GRID
        ----------------------------------------- */}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">

          {/* =========================================
              CARD 1 — UPLOAD + SPECIFICATIONS
          ========================================= */}

          <div className="min-h-75 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">

            <SectionHeader
              number="1"
              icon={Upload}
              title="Upload & Specifications"
              description="Add documents and customize each file"
            />

            <div className="grid grid-cols-[180px_1fr] gap-3">

              {/* Documents */}

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">

                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-700/60 bg-blue-600/10 px-3 py-2 text-[11px] font-bold text-blue-300 transition hover:bg-blue-600/20">
                  <Plus className="h-3.5 w-3.5" />
                  Add Files

                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>

                <div className="mt-2 max-h-51.25 space-y-1.5 overflow-auto pr-1">
                  {documents.map((doc) => {
                    const Icon = getFileIcon(doc.name);

                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() =>
                          setSelectedDocumentId(doc.id)
                        }
                        className={`group flex w-full items-center gap-2 rounded-lg border p-2 text-left transition ${selectedDocumentId === doc.id
                            ? "border-blue-500 bg-blue-600/10"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                          }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-blue-400" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold text-white">
                            {doc.name}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {doc.size}
                          </p>
                        </div>

                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            removeDocument(doc.id);
                          }}
                          className="opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specifications */}

              <div className="grid grid-cols-3 gap-2">

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Pages
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={selectedDocument.pages}
                    onChange={(e) =>
                      updateDocument(
                        selectedDocument.id,
                        {
                          pages: Math.max(
                            1,
                            Number(e.target.value)
                          ),
                        }
                      )
                    }
                    className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={selectedDocument.quantity}
                    onChange={(e) =>
                      updateDocument(
                        selectedDocument.id,
                        {
                          quantity: Math.max(
                            1,
                            Number(e.target.value)
                          ),
                        }
                      )
                    }
                    className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Paper
                  </label>

                  <select
                    value={selectedDocument.paperType}
                    onChange={(e) =>
                      updateDocument(
                        selectedDocument.id,
                        {
                          paperType:
                            e.target.value as PaperType,
                        }
                      )
                    }
                    className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-[10px] text-white outline-none"
                  >
                    {Object.entries(paperLabels).map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Color */}

                <div className="col-span-3">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Color
                  </label>

                  <div className="grid grid-cols-2 gap-1.5">
                    <OptionButton
                      active={
                        selectedDocument.colorMode ===
                        "bw"
                      }
                      onClick={() =>
                        updateDocument(
                          selectedDocument.id,
                          { colorMode: "bw" }
                        )
                      }
                    >
                      B&W
                    </OptionButton>

                    <OptionButton
                      active={
                        selectedDocument.colorMode ===
                        "color"
                      }
                      onClick={() =>
                        updateDocument(
                          selectedDocument.id,
                          { colorMode: "color" }
                        )
                      }
                    >
                      Colour
                    </OptionButton>
                  </div>
                </div>

                {/* Format */}

                <div className="col-span-3">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Print Format
                  </label>

                  <div className="grid grid-cols-2 gap-1.5">
                    <OptionButton
                      active={
                        selectedDocument.format ===
                        "front"
                      }
                      onClick={() =>
                        updateDocument(
                          selectedDocument.id,
                          { format: "front" }
                        )
                      }
                    >
                      Front Only
                    </OptionButton>

                    <OptionButton
                      active={
                        selectedDocument.format ===
                        "both"
                      }
                      onClick={() =>
                        updateDocument(
                          selectedDocument.id,
                          { format: "both" }
                        )
                      }
                    >
                      Front & Back
                    </OptionButton>
                  </div>
                </div>

                {/* Binding */}

                <div className="col-span-3">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Binding
                  </label>

                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      Object.entries(
                        bindingLabels
                      ) as [Binding, string][]
                    ).map(([value, label]) => (
                      <OptionButton
                        key={value}
                        active={
                          selectedDocument.binding ===
                          value
                        }
                        onClick={() =>
                          updateDocument(
                            selectedDocument.id,
                            { binding: value }
                          )
                        }
                      >
                        {label}
                      </OptionButton>
                    ))}
                  </div>
                </div>

                {/* Layout + Extra */}

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Layout
                  </label>

                  <select
                    value={selectedDocument.pageLayout}
                    onChange={(e) =>
                      updateDocument(
                        selectedDocument.id,
                        {
                          pageLayout:
                            e.target.value as PageLayout,
                        }
                      )
                    }
                    className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-[10px] text-white"
                  >
                    <option value="1">
                      1 Page / Sheet
                    </option>
                    <option value="2">
                      2 Pages / Sheet
                    </option>
                    <option value="4">
                      4 Pages / Sheet
                    </option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Extra
                  </label>

                  <select
                    value={selectedDocument.extra}
                    onChange={(e) =>
                      updateDocument(
                        selectedDocument.id,
                        {
                          extra:
                            e.target.value as Extra,
                        }
                      )
                    }
                    className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-[10px] text-white"
                  >
                    {Object.entries(extraLabels).map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================
              CARD 2 — SELECT PRINT SHOP
          ========================================= */}

          <div className="min-h-75 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">

            <SectionHeader
              number="2"
              icon={MapPin}
              title="Select Print Shop"
              description="Compare nearby shops and choose where to print"
            />

            <div className="mb-2 flex gap-2">

              <div className="relative flex-1">
                <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search print shops..."
                  className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-[11px] text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center rounded-lg border border-emerald-800/50 bg-emerald-500/5 px-2.5 text-[10px] font-semibold text-emerald-400">
                {filteredShops.length} shops
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {filteredShops.map((shop) => {
                const selected =
                  selectedShopId === shop.id;

                const shopPrice = Math.max(
                  20,
                  Math.round(
                    subtotal *
                    (shop.id === 1
                      ? 1
                      : shop.id === 2
                        ? 0.94
                        : 1.08)
                  )
                );

                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() =>
                      setSelectedShopId(shop.id)
                    }
                    className={`relative rounded-xl border p-3 text-left transition ${selected
                        ? "border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/5"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                  >
                    {selected && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
                      <Store className="h-4 w-4 text-blue-400" />
                    </div>

                    <p className="pr-5 text-[11px] font-bold text-white">
                      {shop.name}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-500">
                      {shop.address}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[9px]">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        {shop.rating}
                      </span>

                      <span className="text-slate-600">
                        •
                      </span>

                      <span className="text-slate-500">
                        {shop.distance}
                      </span>
                    </div>

                    <div className="mt-2 flex items-end justify-between border-t border-slate-800 pt-2">
                      <div>
                        <p className="text-[9px] text-slate-500">
                          Estimated
                        </p>

                        <p className="text-sm font-black text-white">
                          ₹{shopPrice}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-semibold ${shop.open
                            ? "text-emerald-400"
                            : "text-slate-500"
                          }`}
                      >
                        {shop.open
                          ? "Open"
                          : "Closed"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedShop && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-blue-900/50 bg-blue-950/20 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-white">
                      {selectedShop.name}
                    </p>

                    <p className="text-[9px] text-slate-500">
                      {selectedShop.hours}
                    </p>
                  </div>
                </div>

                <span className="ml-2 shrink-0 text-[9px] font-semibold text-blue-400">
                  Selected
                </span>
              </div>
            )}
          </div>

          {/* =========================================
              CARD 3 — PICKUP / DELIVERY
          ========================================= */}

          <div className="min-h-75 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">

            <SectionHeader
              number="3"
              icon={Truck}
              title="Pickup or Delivery"
              description="Choose how you want to receive your order"
            />

            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() =>
                  setDeliveryType("pickup")
                }
                className={`rounded-xl border p-4 text-left transition ${deliveryType === "pickup"
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10">
                  <Store className="h-4 w-4 text-blue-400" />
                </div>

                <p className="text-xs font-bold text-white">
                  Pickup
                </p>

                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Collect your completed order directly from the selected print shop.
                </p>

                <div className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                  <Check className="h-3 w-3" />
                  No delivery fee
                </div>
              </button>

              <button
                type="button"
                disabled={
                  selectedShop
                    ? !selectedShop.delivery
                    : false
                }
                onClick={() => {
                  if (
                    selectedShop?.delivery
                  ) {
                    setDeliveryType("delivery");
                    setShowDeliveryModal(true);
                  }
                }}
                className={`rounded-xl border p-4 text-left transition ${deliveryType === "delivery"
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  } ${selectedShop &&
                    !selectedShop.delivery
                    ? "cursor-not-allowed opacity-40"
                    : ""
                  }`}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10">
                  <Truck className="h-4 w-4 text-blue-400" />
                </div>

                <p className="text-xs font-bold text-white">
                  Home Delivery
                </p>

                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Get your printed documents delivered to your address.
                </p>

                <div className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-blue-400">
                  <Truck className="h-3 w-3" />
                  +₹30 delivery
                </div>
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">
                  Selected shop
                </span>

                <span className="text-[10px] font-bold text-white">
                  {selectedShop?.name ??
                    "Choose a shop"}
                </span>
              </div>

              <div className="my-2 border-t border-slate-800" />

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">
                  Fulfillment
                </span>

                <span className="text-[10px] font-bold text-blue-400">
                  {deliveryType ===
                    "pickup"
                    ? "Self Pickup"
                    : "Home Delivery"}
                </span>
              </div>

              {deliveryType ===
                "delivery" && (
                  <div className="mt-2 rounded-lg border border-blue-900/40 bg-blue-950/20 px-2.5 py-2">
                    <p className="text-[9px] text-slate-500">
                      Delivery address
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setShowDeliveryModal(
                          true
                        )
                      }
                      className="mt-0.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Add / Change Address
                    </button>
                  </div>
                )}
            </div>
          </div>

          {/* =========================================
              CARD 4 — PAYMENT + ORDER
          ========================================= */}

          <div className="min-h-75 rounded-2xl border border-blue-900/50 bg-linear-to-br from-blue-950/30 via-slate-900/90 to-slate-950 p-4 shadow-xl">

            <SectionHeader
              number="4"
              icon={CreditCard}
              title="Payment & Confirm"
              description="Choose payment and review your order"
            />

            <div className="grid grid-cols-[1fr_180px] gap-3">

              {/* Payment */}

              <div>
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-1.5">

                  <OptionButton
                    active={
                      paymentMethod ===
                      "paid-full"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "paid-full"
                      )
                    }
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <CreditCard className="h-3 w-3" />
                      Pay Full
                    </span>
                  </OptionButton>

                  <OptionButton
                    active={
                      paymentMethod ===
                      "advance"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "advance"
                      )
                    }
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Wallet className="h-3 w-3" />
                      Pay Advance
                    </span>
                  </OptionButton>

                  <OptionButton
                    active={
                      paymentMethod ===
                      "pickup-pay"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "pickup-pay"
                      )
                    }
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Banknote className="h-3 w-3" />
                      Cash Pickup
                    </span>
                  </OptionButton>

                  <OptionButton
                    active={
                      paymentMethod ===
                      "delivery-pay"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "delivery-pay"
                      )
                    }
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Truck className="h-3 w-3" />
                      Cash Delivery
                    </span>
                  </OptionButton>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Special Instructions
                  </label>

                  <textarea
                    value={shopNotes}
                    onChange={(e) =>
                      setShopNotes(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Any instructions for the print shop..."
                    className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Summary */}

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">

                <div className="mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-blue-400" />

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order Summary
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px]">

                  <div className="flex justify-between text-slate-500">
                    <span>
                      Documents
                    </span>

                    <span className="text-white">
                      {documents.length}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>
                      Printing
                    </span>

                    <span className="text-white">
                      ₹{subtotal}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>
                      Delivery
                    </span>

                    <span className="text-white">
                      ₹{deliveryFee}
                    </span>
                  </div>

                  <div className="my-2 border-t border-slate-800" />

                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      Total
                    </span>

                    <span className="text-xl font-black text-white">
                      ₹{total}
                    </span>
                  </div>

                  {paymentMethod ===
                    "advance" && (
                      <div className="mt-1 rounded-md bg-blue-600/10 px-2 py-1 text-[9px] text-blue-300">
                        Pay ₹{advanceAmount} now
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  disabled={
                    !selectedShop ||
                    orderPlaced
                  }
                  onClick={() =>
                    setOrderPlaced(true)
                  }
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-[10px] font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {orderPlaced ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Order Placed
                    </>
                  ) : (
                    <>
                      Confirm Order
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -----------------------------------------
            SMALL STATUS BAR
        ----------------------------------------- */}

        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5">

          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-emerald-400" />

            <span className="text-[10px] text-slate-400">
              XEROXMATE interactive printing workflow
            </span>
          </div>

          <div className="hidden items-center gap-4 text-[9px] text-slate-500 sm:flex">
            <span>Upload</span>
            <ChevronRight className="h-3 w-3" />
            <span>Customize</span>
            <ChevronRight className="h-3 w-3" />
            <span>Select Shop</span>
            <ChevronRight className="h-3 w-3" />
            <span>Order</span>
          </div>
        </div>
      </div>

      {/* =========================================
          DELIVERY MODAL
      ========================================= */}

      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Delivery Address
                </h3>

                <p className="mt-1 text-[10px] text-slate-500">
                  Add the address where you want your order delivered.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeliveryModal(
                    false
                  )
                }
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">

              <input
                placeholder="House / Flat / Building"
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-[11px] text-white outline-none focus:border-blue-500"
              />

              <input
                placeholder="Street / Area"
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-[11px] text-white outline-none focus:border-blue-500"
              />

              <div className="grid grid-cols-2 gap-2">

                <input
                  placeholder="City"
                  className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-[11px] text-white outline-none focus:border-blue-500"
                />

                <input
                  placeholder="Pincode"
                  className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-[11px] text-white outline-none focus:border-blue-500"
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeliveryModal(
                    false
                  )
                }
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-[11px] font-bold text-white hover:bg-blue-500"
              >
                Save Address
                <Check className="h-3.5 w-3.5" />
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =========================================
          ORDER SUCCESS
      ========================================= */}

      {orderPlaced && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-slate-950 px-4 py-3 shadow-2xl">

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-4 w-4 text-emerald-400" />
          </div>

          <div>
            <p className="text-xs font-bold text-white">
              Demo Order Confirmed
            </p>

            <p className="text-[9px] text-slate-500">
              Your XEROXMATE order flow is complete.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setOrderPlaced(false)
            }
            className="ml-2 text-slate-600 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}