import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowDown,
  Layers,
  Zap,
} from 'lucide-react';
import { DocumentUploadCard } from '../home/DocumentUploadCard';
// import type { CountdownTime } from '../types';

interface HeroProps {
  onScrollToConduct: () => void;
  onScrollToCalculator: () => void;
}

// Global synchronized release countdown target
const LAUNCH_AT_UTC_MS = Date.UTC(2026, 8, 20, 10, 30, 0);

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export default function Hero({ onScrollToConduct, onScrollToCalculator }: HeroProps) {
  // const [countdown, setCountdown] = useState<CountdownTime>({
  //   total: 0,
  //   days: 0,
  //   hours: 0,
  //   minutes: 0,
  //   seconds: 0,
  //   isLive: false,
  // });

  // useEffect(() => {
  //   const calculateTime = () => {
  //     const diff = LAUNCH_AT_UTC_MS - Date.now();
  //     if (diff <= 0) {
  //       setCountdown({
  //         total: 0,
  //         days: 0,
  //         hours: 0,
  //         minutes: 0,
  //         seconds: 0,
  //         isLive: true,
  //       });
  //       return;
  //     }
  //     const days = Math.floor(diff / MS_PER_DAY);
  //     const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
  //     const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  //     const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);
  //     setCountdown({
  //       total: diff,
  //       days,
  //       hours,
  //       minutes,
  //       seconds,
  //       isLive: false,
  //     });
  //   };

  //   calculateTime();
  //   const interval = setInterval(calculateTime, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      id="hero"
      className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#07090e]"
    >
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] sm:h-[600px] pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-600/15 rounded-full blur-[120px] sm:blur-[140px] animate-pulse-slow" />
        <div className="absolute top-20 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-indigo-600/15 rounded-full blur-[120px] sm:blur-[160px] animate-pulse-slow" />
      </div>

      {/* Radial Grid Overlay */}
      <div className="absolute inset-0 radial-grid-dark opacity-35 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-4 sm:space-y-6 text-left"
          >
            {/* Launch Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-950/70 border border-blue-800/60 shadow-inner backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-blue-300 uppercase">
                COMPLETE APPLICATION · LAUNCHING SOON
              </span>
            </div>

            {/* Main Display Headline with responsive mobile text */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-['Outfit'] leading-[1.12]">
              Your Smart Printing <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
                Partner & Network.
              </span>
            </h1>

            {/* Subheading with responsive text sizing */}
            <p className="text-sm sm:text-base md:text-lg font-normal text-slate-300 max-w-2xl leading-relaxed">
              Say goodbye to print shop queues and USB pendrives. Upload digitally, customize paper
              weights & bindings, compare nearby print hubs, and pickup with zero wait time or get
              doorstep delivery.
            </p>

            {/* Call to Actions (full width on mobile for easy tapping) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 sm:pt-2">
              <button
                id="hero-join-waitlist-btn"
                onClick={onScrollToConduct}
                className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 border border-blue-400/40"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Join VIP Early Access</span>
              </button>

              <button
                id="hero-try-estimator-btn"
                onClick={onScrollToCalculator}
                className="hidden sm:flex px-6 py-3.5 sm:py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-semibold text-sm sm:text-base border border-slate-700/80 hover:border-blue-500/50 transition-all duration-200 items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Simulate Print Cost</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60 max-w-xl text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-purge file privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Skip all shop queues</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Instant price compare</span>
              </div>
            </div>
          </motion.div>


          <div className="home-enter-delayed mx-auto w-full max-w-xs md:max-w-lg">
            <DocumentUploadCard
              multiple
              onFilesSelected={(files) => {
                if (session?.role !== "customer") {
                  setAuthDialogOpen(true);
                  return;
                }
                setPendingUploadFiles(files);
                navigate({ to: "/order" });
              }}
            />
          </div>



          {/* Right Column: Premium Dark Countdown Glass Card */}
           {/* <motion.div
            id="launch-timer"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 relative mt-4 lg:mt-0"
          >
            <div className="relative p-5 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0c1220]/95 to-slate-950/95 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              {/* Card Header 
              <div className="text-center space-y-1 pb-4 sm:pb-6 border-b border-slate-800/80">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-blue-400">
                  COUNTDOWN TO RELEASE
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-['Outfit']">
                  LAUNCHING SOON
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Global synchronized countdown to live operations
                </p>
              </div>

              {/* Countdown Ticker with responsive numbers 
              {!countdown.isLive ? (
                <div className="py-4 sm:py-6">
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {/* Days 
                    <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center shadow-inner">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-mono tabular-nums tracking-tight">
                        {pad(countdown.days)}
                      </div>
                      <div className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                        Days
                      </div>
                    </div>

                    {/* Hours 
                    <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center shadow-inner">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-mono tabular-nums tracking-tight">
                        {pad(countdown.hours)}
                      </div>
                      <div className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                        Hours
                      </div>
                    </div>

                    {/* Minutes 
                    <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center shadow-inner">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-mono tabular-nums tracking-tight">
                        {pad(countdown.minutes)}
                      </div>
                      <div className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                        Mins
                      </div>
                    </div>

                    {/* Seconds 
                    <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-blue-900/60 text-center shadow-inner relative overflow-hidden">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-400 font-mono tabular-nums tracking-tight">
                        {pad(countdown.seconds)}
                      </div>
                      <div className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-300 mt-1">
                        Secs
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Priority info box without removed date 
                  <div className="mt-4 sm:mt-5 p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-center text-xs text-slate-300">
                    <span className="text-blue-300 font-semibold">Priority Token:</span> Registered early-access users receive exclusive queue-bypass privileges.
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-white">XEROXMATE is Live!</h4>
                  <p className="text-xs text-slate-300">
                    The complete printing experience is now operational.
                  </p>
                </div>
              )}

              {/* Card Footer Quick Form Hook 
              <div className="pt-3 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-slate-400 text-[11px] sm:text-xs">
                  <span className="text-blue-400 font-bold">1,400+</span> users waiting
                </div>
                <button
                  onClick={onScrollToConduct}
                  className="text-[11px] sm:text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group"
                >
                  <span>Leave contact below</span>
                  <ArrowDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>  */}
        </div>
      </div>
    </section>
  );
}
