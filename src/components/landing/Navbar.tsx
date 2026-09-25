import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onScrollToConduct: () => void;
}

export default function Navbar({ onScrollToConduct }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07090e]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] py-2.5 sm:py-3'
          : 'bg-transparent py-3.5 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo with User Given Logo */}
        <a
          href="#"
          className="flex items-center group focus:outline-none"
          aria-label="XEROXMATE Home"
        >
          <Logo className="h-7 sm:h-9 w-auto" showTagline={true} />
        </a>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a
            href="#launch-timer"
            className="hover:text-blue-400 transition-colors duration-200 focus:text-blue-400 focus:outline-none"
          >
            Launch Countdown
          </a>
          <a
            href="#how-it-works"
            className="hover:text-blue-400 transition-colors duration-200 focus:text-blue-400 focus:outline-none"
          >
            How It Works
          </a>
          <a
            href="#print-simulator"
            className="hover:text-blue-400 transition-colors duration-200 focus:text-blue-400 focus:outline-none"
          >
            Cost Estimator
          </a>
          <a
            href="#features"
            className="hover:text-blue-400 transition-colors duration-200 focus:text-blue-400 focus:outline-none"
          >
            Key Capabilities
          </a>
          <a
            href="#conduct-card"
            className="hover:text-blue-400 transition-colors duration-200 focus:text-blue-400 focus:outline-none"
          >
            Early Access
          </a>
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>LAUNCHING SOON</span>
          </div>

          <button
            id="nav-early-access-btn"
            onClick={onScrollToConduct}
            className="relative group overflow-hidden px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 border border-blue-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Join Early Access</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          id="mobile-menu-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-slate-950/98 border-b border-slate-800/90 px-5 py-5 space-y-4 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>SMART PRINTING NETWORK · LAUNCHING SOON</span>
            </div>

            <div className="flex flex-col space-y-2.5 pt-1 text-sm font-medium text-slate-300">
              <a
                href="#launch-timer"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-blue-400 border-b border-slate-900"
              >
                Launch Countdown
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-blue-400 border-b border-slate-900"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-blue-400 border-b border-slate-900"
              >
                Key Capabilities
              </a>
              <a
                href="#conduct-card"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-blue-400"
              >
                Early Access Form
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onScrollToConduct();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Join VIP Early Access</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
