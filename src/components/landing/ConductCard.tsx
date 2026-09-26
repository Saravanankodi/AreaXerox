// import { useRef, useState, type FormEvent } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import {
//   User as UserIcon,
//   Mail,
//   Send,
//   CheckCircle,
//   AlertCircle,
//   Shield,
//   RefreshCw,
// } from 'lucide-react';
// import {
//   CONTACT_LIMITS,
//   describeConfigError,
//   submitContact,
//   validateContact,
// } from '../lib/contact';

// type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// export default function ConductCard() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [website, setWebsite] = useState('');
//   const [status, setStatus] = useState<FormStatus>('idle');
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [devNote, setDevNote] = useState<string | null>(null);
//   const submittingRef = useRef(false);

//   const submitting = status === 'submitting';
//   const succeeded = status === 'success';

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     // Prevent accidental double submission (double-click / Enter spam).
//     if (submittingRef.current) return;

//     setErrorMessage(null);
//     setDevNote(null);

//     const validation = validateContact({ name, email, website });
//     if (!validation.ok) {
//       setStatus('error');
//       setErrorMessage(validation.error);
//       return;
//     }

//     submittingRef.current = true;
//     setStatus('submitting');

//     try {
//       await submitContact({ name, email, website });
//       // Reset form; success state never echoes submitted data.
//       setName('');
//       setEmail('');
//       setWebsite('');
//       setStatus('success');
//     } catch (err) {
//       const message = err instanceof Error ? err.message : 'Unable to save contact';
//       const described = describeConfigError(message);
//       setStatus('error');
//       setErrorMessage(described.title);
//       setDevNote(described.detail);
//     } finally {
//       submittingRef.current = false;
//     }
//   };

//   const handleRetry = () => {
//     setStatus('idle');
//     setErrorMessage(null);
//     setDevNote(null);
//   };

//   return (
//     <section
//       id="conduct-card"
//       className="py-14 sm:py-20 md:py-24 bg-[#07090e] relative overflow-hidden border-t border-slate-800/80"
//     >
//       {/* Background Glow */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[400px] bg-gradient-to-tr from-blue-600/10 via-indigo-600/15 to-purple-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
//         {/* Section Header */}
//         <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3 mb-8 sm:mb-12">
//           <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
//             <span>XEROXMATE</span>
//           </div>
//           <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-['Outfit'] tracking-tight">
//             Be the first to know when we launch.
//           </h2>
//           <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
//             Join the launch list and we&apos;ll notify you when XEROXMATE goes live. Don&apos;t miss
//             the launch on Wednesday, September 16, 2026 at 7:00 PM IST.
//           </p>
//         </div>

//         {/* Launch-notification card */}
//         <div className="max-w-2xl mx-auto relative">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.5 }}
//             className="relative p-5 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0c1220]/95 to-slate-950/95 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
//           >
//             {/* Gradient Top Border Accent */}
//             <div className="absolute inset-x-6 sm:inset-x-8 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-full" />

//             <div className="space-y-1 pb-4 sm:pb-6 border-b border-slate-800 text-center">
//               <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
//                 Get launch updates
//               </h3>
//               <p className="text-xs text-slate-400">
//                 Leave your details and we&apos;ll let you know when the full application goes live.
//               </p>
//             </div>

//             {succeeded ? (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.97 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 role="status"
//                 aria-live="polite"
//                 className="mt-5 sm:mt-6 p-6 sm:p-8 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-center space-y-2"
//               >
//                 <div className="flex items-center justify-center gap-2 font-bold text-emerald-300 text-base sm:text-lg">
//                   <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" aria-hidden="true" />
//                   <span>&#10003; You&apos;re on the list!</span>
//                 </div>
//                 <p className="text-slate-300 text-xs sm:text-sm">
//                   We&apos;ll let you know when XEROXMATE launches.
//                 </p>
//               </motion.div>
//             ) : (
//               <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
//                 {/* Input 1: Name */}
//                 <div>
//                   <label
//                     htmlFor="conduct-name"
//                     className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2"
//                   >
//                     Name <span className="text-blue-400" aria-hidden="true">*</span>
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
//                       <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
//                     </div>
//                     <input
//                       id="conduct-name"
//                       name="name"
//                       type="text"
//                       autoComplete="name"
//                       required
//                       maxLength={CONTACT_LIMITS.nameMax}
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       onInput={handleRetry}
//                       placeholder="Enter your name"
//                       disabled={submitting}
//                       aria-required="true"
//                       aria-invalid={status === 'error' ? true : undefined}
//                       className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 transition-all disabled:opacity-60"
//                     />
//                   </div>
//                 </div>

//                 {/* Input 2: Email */}
//                 <div>
//                   <label
//                     htmlFor="conduct-email"
//                     className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2"
//                   >
//                     Email <span className="text-blue-400" aria-hidden="true">*</span>
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
//                       <Mail className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
//                     </div>
//                     <input
//                       id="conduct-email"
//                       name="email"
//                       type="email"
//                       autoComplete="email"
//                       required
//                       maxLength={CONTACT_LIMITS.emailMax}
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       onInput={handleRetry}
//                       placeholder="Enter your email"
//                       disabled={submitting}
//                       aria-required="true"
//                       aria-invalid={status === 'error' ? true : undefined}
//                       className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 transition-all disabled:opacity-60"
//                     />
//                   </div>
//                 </div>

//                 {/* Honeypot: hidden from sighted + assistive-tech users */}
//                 <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
//                   <label htmlFor="conduct-website">Website</label>
//                   <input
//                     id="conduct-website"
//                     name="website"
//                     type="text"
//                     autoComplete="off"
//                     tabIndex={-1}
//                     value={website}
//                     onChange={(e) => setWebsite(e.target.value)}
//                   />
//                 </div>

//                 {/* Error Message */}
//                 <AnimatePresence>
//                   {status === 'error' && errorMessage && (
//                     <motion.div
//                       initial={{ opacity: 0, y: -8 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -8 }}
//                       role="alert"
//                       aria-live="assertive"
//                       className="p-3 sm:p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5"
//                     >
//                       <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
//                       <span>
//                         {errorMessage}
//                         {devNote && (
//                           <span className="block mt-1 text-[11px] text-rose-400/80">{devNote}</span>
//                         )}
//                       </span>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* Submit Button */}
//                 <button
//                   id="conduct-submit-btn"
//                   type="submit"
//                   disabled={submitting}
//                   aria-busy={submitting}
//                   className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 border border-blue-400/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
//                 >
//                   {submitting ? (
//                     <>
//                       <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
//                       <span>Joining...</span>
//                     </>
//                   ) : (
//                     <>
//                       <Send className="w-4 h-4" aria-hidden="true" />
//                       <span>Notify Me</span>
//                     </>
//                   )}
//                 </button>

//                 {/* Privacy text */}
//                 <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 pt-1 text-center">
//                   <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
//                   <span>Zero spam. We&apos;ll only email you about the launch.</span>
//                 </div>
//               </form>
//             )}
//           </motion.div>
//         </div>
//       </div>
//     </section>
//   );
// }











































import { useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Shield,
  RefreshCw,
  MessageSquare,
  LifeBuoy,
  Headphones,
  MapPin,
  Clock,
} from "lucide-react";

import {
  CONTACT_LIMITS,
  describeConfigError,
  submitContact,
  validateContact,
} from "@/lib/contact";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ConductCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devNote, setDevNote] = useState<string | null>(null);

  const submittingRef = useRef(false);

  const submitting = status === "submitting";
  const succeeded = status === "success";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Prevent accidental double submission.
    if (submittingRef.current) return;

    setErrorMessage(null);
    setDevNote(null);

    const validation = validateContact({
      name,
      email,
      phone,
      description,
      website,
    });

    if (!validation.ok) {
      setStatus("error");
      setErrorMessage(validation.error);
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");

    try {
      await submitContact({
        name,
        email,
        phone,
        description,
        website,
      });

      // Reset form after successful submission.
      setName("");
      setEmail("");
      setPhone("");
      setDescription("");
      setWebsite("");

      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save contact";

      const described = describeConfigError(message);

      setStatus("error");
      setErrorMessage(described.title);
      setDevNote(described.detail);
    } finally {
      submittingRef.current = false;
    }
  };

  const handleRetry = () => {
    if (status !== "error") return;

    setStatus("idle");
    setErrorMessage(null);
    setDevNote(null);
  };

  return (
    <section
      id="conduct-card"
      className="relative overflow-hidden border-t border-slate-800/80 bg-[#07090e] py-14 sm:py-20 md:py-24"
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-87.5 w-87.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-tr from-blue-600/10 via-indigo-600/15 to-purple-600/10 blur-[100px] sm:h-100 sm:w-150 sm:blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-8 max-w-3xl space-y-2.5 text-center sm:mb-12 sm:space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-800/60 bg-blue-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 sm:px-3.5 sm:py-1.5 sm:text-xs">
            <span>XEROXMATE</span>
          </div>

          <h2 className="font-['Outfit'] text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Have a question? We're here to help.
          </h2>

          <p className="mx-auto max-w-xl text-xs leading-relaxed text-slate-300 sm:text-base">
            Need help with XEROXMATE or have a question about our printing service? Send us your details and message.
          </p>
        </div>
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Conduct us Card */}

          <div className="relative  max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl border border-slate-800 bg-linear-to-b from-slate-900/95 via-[#0c1220]/95 to-slate-950/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:rounded-3xl sm:p-10 md:p-12"
            >
              {/* Gradient Top Border */}
              <div className="absolute inset-x-6 top-0 h-1 rounded-t-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 sm:inset-x-8" />

              <div className="space-y-1 border-b border-slate-800 pb-4 text-center sm:pb-6">
                <h3 className="font-['Outfit'] text-xl font-extrabold text-white sm:text-2xl">
                  Get in touch
                </h3>
                <p>Have a question about XEROXMATE?</p>
                  <p>Our team is here to help with orders, printing services, and general enquiries.</p>
              </div>
              <div className="mt-5 space-y-5 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 sm:mt-6 sm:p-7">
                {/* Phone */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <Phone className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Phone
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      +91 9092579460
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <Mail className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 text-sm text-slate-200">

                      desflyer.tech@gmail.com
                    </p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <Clock className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Business Hours
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      Monday – Saturday · 9:00 AM – 7:00 PM
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      Tamil Nadu, India
                    </p>
                  </div>
                </div>

                {/* Customer Support */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <Headphones className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Customer Support
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      We usually respond within 24 hours
                    </p>
                  </div>
                </div>

                {/* Service Assistance */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <LifeBuoy className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Service Assistance
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      Get help with our printing services and online ordering
                    </p>
                  </div>
                </div>

                {/* General Enquiries */}
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-blue-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      General Enquiries
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      Questions, feedback, or other assistance
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>



          <div className="relative  max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl border border-slate-800 bg-linear-to-b from-slate-900/95 via-[#0c1220]/95 to-slate-950/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:rounded-3xl sm:p-10 md:p-12"
            >
              {/* Gradient Top Border */}
              <div className="absolute inset-x-6 top-0 h-1 rounded-t-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 sm:inset-x-8" />

              <div className="space-y-1 border-b border-slate-800 pb-4 text-center sm:pb-6">
                <h3 className="font-['Outfit'] text-xl font-extrabold text-white sm:text-2xl">
                  Send us a message
                </h3>
              </div>

              {succeeded ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  role="status"
                  aria-live="polite"
                  className="mt-5 space-y-2 rounded-2xl border border-emerald-800/80 bg-emerald-950/60 p-6 text-center sm:mt-6 sm:p-8"
                >
                  <div className="flex items-center justify-center gap-2 text-base font-bold text-emerald-300 sm:text-lg">
                    <CheckCircle
                      className="h-5 w-5 text-emerald-400 sm:h-6 sm:w-6"
                      aria-hidden="true"
                    />

                    <span>✓ You&apos;re on the list!</span>
                  </div>

                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4 pt-4 sm:space-y-6 sm:pt-6"
                >
                  {/* =================================================
                    NAME
                ================================================== */}
                  <div>
                    <label
                      htmlFor="conduct-name"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300 sm:mb-2"
                    >
                      Name{" "}
                      <span
                        className="text-blue-400"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 sm:pl-4">
                        <UserIcon
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <input
                        id="conduct-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={CONTACT_LIMITS.nameMax}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onInput={handleRetry}
                        placeholder="Enter your name"
                        disabled={submitting}
                        aria-required="true"
                        aria-invalid={
                          status === "error" ? true : undefined
                        }
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60 sm:py-3.5 sm:pl-12"
                      />
                    </div>
                  </div>

                  {/* =================================================
                    EMAIL
                ================================================== */}
                  <div>
                    <label
                      htmlFor="conduct-email"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300 sm:mb-2"
                    >
                      Email{" "}
                      <span
                        className="text-blue-400"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 sm:pl-4">
                        <Mail
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <input
                        id="conduct-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={CONTACT_LIMITS.emailMax}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onInput={handleRetry}
                        placeholder="Enter your email"
                        disabled={submitting}
                        aria-required="true"
                        aria-invalid={
                          status === "error" ? true : undefined
                        }
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60 sm:py-3.5 sm:pl-12"
                      />
                    </div>
                  </div>

                  {/* =================================================
                    PHONE
                ================================================== */}
                  <div>
                    <label
                      htmlFor="conduct-phone"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300 sm:mb-2"
                    >
                      Phone{" "}
                      <span
                        className="text-blue-400"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 sm:pl-4">
                        <Phone
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <input
                        id="conduct-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        maxLength={CONTACT_LIMITS.phoneMax}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onInput={handleRetry}
                        placeholder="Enter your phone number"
                        disabled={submitting}
                        aria-required="true"
                        aria-invalid={
                          status === "error" ? true : undefined
                        }
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60 sm:py-3.5 sm:pl-12"
                      />
                    </div>
                  </div>

                  {/* =================================================
                    DESCRIPTION
                ================================================== */}
                  <div>
                    <label
                      htmlFor="conduct-description"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300 sm:mb-2"
                    >
                      Description{" "}
                      <span
                        className="text-blue-400"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute left-0 top-3.5 flex items-start pl-3.5 text-slate-500 sm:pl-4">
                        <FileText
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <textarea
                        id="conduct-description"
                        name="description"
                        required
                        maxLength={CONTACT_LIMITS.descriptionMax}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onInput={handleRetry}
                        placeholder="Tell us what you are interested in..."
                        disabled={submitting}
                        aria-required="true"
                        aria-invalid={
                          status === "error" ? true : undefined
                        }
                        rows={4}
                        className="w-full resize-none rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60 sm:pl-12"
                      />
                    </div>
                  </div>

                  {/* =================================================
                    HONEYPOT
                ================================================== */}
                  <div
                    className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="conduct-website">
                      Website
                    </label>

                    <input
                      id="conduct-website"
                      name="website"
                      type="text"
                      autoComplete="off"
                      tabIndex={-1}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  {/* =================================================
                    ERROR
                ================================================== */}
                  <AnimatePresence>
                    {status === "error" && errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        role="alert"
                        aria-live="assertive"
                        className="flex items-start gap-2.5 rounded-xl border border-rose-800/60 bg-rose-950/50 p-3 text-xs text-rose-300 sm:p-3.5"
                      >
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                          aria-hidden="true"
                        />

                        <span>
                          {errorMessage}

                          {devNote && (
                            <span className="mt-1 block text-[11px] text-rose-400/80">
                              {devNote}
                            </span>
                          )}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* =================================================
                    SUBMIT
                ================================================== */}
                  <button
                    id="conduct-submit-btn"
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all duration-200 hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 sm:py-4 sm:text-base"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />

                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Send
                          className="h-4 w-4"
                          aria-hidden="true"
                        />

                        <span>Submit</span>
                      </>
                    )}
                  </button>

                  {/* Privacy */}

                </form>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
