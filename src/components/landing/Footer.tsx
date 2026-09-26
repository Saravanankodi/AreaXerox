// // React types are unavailable in the current project configuration.
// // @ts-ignore — keep the component buildable until @types/react is installed.
// import { useState, useEffect } from 'react';
// import {
//   ArrowUp,
//   Shield,
//   FileSpreadsheet,
//   ExternalLink,
//   RefreshCw,
//   X,
//   CheckCircle,
//   LogOut,
// } from 'lucide-react';
// import Logo from './Logo';
// import {
//   initAuth,
//   googleSignIn,
//   logout,
//   type User,
// } from '../lib/firebase';
// import {
//   getSavedSpreadsheetId,
//   createGoogleSheet,
//   appendLeadToGoogleSheet,
//   saveSpreadsheetId,
// } from '../lib/sheetsService';
// import type { Lead } from '../types';

// interface FooterProps {
//   onScrollToConduct: () => void;
// }

// export default function Footer({ onScrollToConduct }: FooterProps) {
//   const [showAdminModal, setShowAdminModal] = useState(false);
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [isSyncing, setIsSyncing] = useState(false);
//   const [statusNote, setStatusNote] = useState<string | null>(null);

//   useEffect(() => {
//     const savedId = getSavedSpreadsheetId();
//     if (savedId) setSpreadsheetId(savedId);

//     const unsubscribe = initAuth(
//       (user, token) => {
//         setCurrentUser(user);
//         if (token) setAccessToken(token);
//       },
//       () => {
//         setCurrentUser(null);
//         setAccessToken(null);
//       }
//     );

//     return () => unsubscribe();
//   }, []);

//   const scrollToTop = () => {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleConnectGoogle = async () => {
//     try {
//       setIsConnecting(true);
//       setStatusNote(null);
//       const result = await googleSignIn();
//       if (result) {
//         setCurrentUser(result.user);
//         setAccessToken(result.accessToken);
//         setStatusNote('Connected to Google Account.');

//         // If no sheet ID yet, create one
//         let sId = spreadsheetId || getSavedSpreadsheetId();
//         if (!sId) {
//           sId = await createGoogleSheet(result.accessToken);
//           setSpreadsheetId(sId);
//           saveSpreadsheetId(sId);
//         }
//       }
//     } catch (err: any) {
//       setStatusNote(`Connection failed: ${err.message || 'Error'}`);
//     } finally {
//       setIsConnecting(false);
//     }
//   };

//   const handleSyncAll = async () => {
//     if (!accessToken) {
//       await handleConnectGoogle();
//       return;
//     }

//     try {
//       setIsSyncing(true);
//       setStatusNote('Syncing leads to Google Sheet...');

//       let sId = spreadsheetId || getSavedSpreadsheetId();
//       if (!sId) {
//         sId = await createGoogleSheet(accessToken);
//         setSpreadsheetId(sId);
//         saveSpreadsheetId(sId);
//       }

//       const stored = localStorage.getItem('xeroxmate_leads_data');
//       const leads: Lead[] = stored ? JSON.parse(stored) : [];

//       for (const lead of leads) {
//         if (!lead.syncedToSheets) {
//           await appendLeadToGoogleSheet(accessToken, sId, lead);
//           lead.syncedToSheets = true;
//         }
//       }

//       localStorage.setItem('xeroxmate_leads_data', JSON.stringify(leads));
//       setStatusNote(`All ${leads.length} lead(s) are up to date in Google Sheet!`);
//     } catch (err: any) {
//       setStatusNote(`Sync failed: ${err.message || 'Error'}`);
//     } finally {
//       setIsSyncing(false);
//     }
//   };

//   const handleSignOut = async () => {
//     await logout();
//     setCurrentUser(null);
//     setAccessToken(null);
//     setStatusNote('Signed out.');
//   };

//   return (

//     <footer className="bg-[#05070a] border-t border-slate-900 text-slate-400 py-16">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
//           {/* Brand Col */}
//           <div className="md:col-span-5 space-y-4">
//             <div>
//               <Logo className="h-8 sm:h-9 w-auto" showTagline={true} />
//             </div>
//             <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
//               Your comprehensive digital printing partner. Upload effortlessly, compare verified
//               local hubs, skip queue bottlenecks, and receive pristine printed work on demand.
//             </p>
//             <div className="flex items-center gap-2 text-xs text-slate-500">
//               <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
//               <span>Priority Early Access · Global synchronized release</span>
//             </div>
//           </div>

//           {/* Quick Nav Links */}
//           <div className="md:col-span-3 space-y-3">
//             <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
//               Application Navigation
//             </h5>
//             <ul className="space-y-2 text-sm">
//               <li>
//                 <a href="#hero" className="hover:text-blue-400 transition-colors">
//                   Launch Countdown
//                 </a>
//               </li>
//               <li>
//                 <a href="#how-it-works" className="hover:text-blue-400 transition-colors">
//                   How It Works
//                 </a>
//               </li>
//               <li className="hidden md:block">
//                 <a href="#print-simulator" className="hover:text-blue-400 transition-colors">
//                   Live Cost Estimator
//                 </a>
//               </li>
//               <li>
//                 <a href="#features" className="hover:text-blue-400 transition-colors">
//                   Zero-Trace Security
//                 </a>
//               </li>
//               <li>
//                 <button
//                   onClick={onScrollToConduct}
//                   className="hover:text-blue-400 transition-colors text-left"
//                 >
//                   Conduct Card (Register Interest)
//                 </button>
//               </li>
//             </ul>
//           </div>

//           {/* Security & Desflyer Badge */}
//           <div className="md:col-span-4 space-y-4">
//             <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
//               <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
//                 <Shield className="w-4 h-4 text-emerald-400" />
//                 <span>Security & Confidentiality</span>
//               </div>
//               <p className="text-xs text-slate-400 leading-relaxed">
//                 All document uploads are processed in memory with cryptographic shredding. No
//                 unauthorized vendor archiving or reproduction.
//               </p>
//             </div>

//             <div className="flex items-center justify-between pt-1">
//               <span className="text-xs text-slate-500">
//                 Powered by <strong className="text-slate-200">DesFlyer</strong>
//               </span>
//               <button
//                 onClick={scrollToTop}
//                 className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
//                 aria-label="Scroll back to top"
//               >
//                 <ArrowUp className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Bottom copyright line with discreet Owner Google Sheet access */}
//         <div className="pt-8 border-t border-slate-900/90 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
//           <div>© 2026 XEROXMATE. All rights reserved.</div>
//           <div className="flex items-center gap-6">
//             <span>Encrypted Spooling</span>
//             <span>Campus Network Verified</span>
//             {/* Discreet Owner Google Sheet link */}
//             <button
//               onClick={() => setShowAdminModal(true)}
//               className="transition-colors flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-400"
//               title="Google Sheet Configuration"
//             >
//               <FileSpreadsheet className="w-3.5 h-3.5" />
//               <span>Google Sheet</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Discreet Owner Google Sheet Modal */}
//       {showAdminModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
//           <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 space-y-4">
//             <div className="flex items-center justify-between pb-3 border-b border-slate-800">
//               <div className="flex items-center gap-2">
//                 <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
//                 <h4 className="font-bold text-white font-['Outfit'] text-base">
//                   Google Sheet Integration
//                 </h4>
//               </div>
//               <button
//                 onClick={() => setShowAdminModal(false)}
//                 className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <p className="text-xs text-slate-400">
//               Interest submissions collected from the Conduct Card (Name & Email) are stored in your
//               official Google Sheet.
//             </p>

//             {currentUser ? (
//               <div className="space-y-3">
//                 <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
//                   <div>
//                     <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
//                       Connected Account
//                     </div>
//                     <div className="font-semibold text-white mt-0.5">{currentUser.email}</div>
//                   </div>
//                   <button
//                     onClick={handleSignOut}
//                     className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900"
//                     title="Sign Out"
//                   >
//                     <LogOut className="w-4 h-4" />
//                   </button>
//                 </div>

//                 {spreadsheetId ? (
//                   <a
//                     href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
//                   >
//                     <ExternalLink className="w-4 h-4" />
//                     <span>Open Live Google Sheet (Leads) ↗</span>
//                   </a>
//                 ) : (
//                   <button
//                     onClick={handleSyncAll}
//                     disabled={isSyncing}
//                     className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
//                   >
//                     <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
//                     <span>Initialize Google Sheet</span>
//                   </button>
//                 )}

//                 <button
//                   onClick={handleSyncAll}
//                   disabled={isSyncing}
//                   className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
//                 >
//                   <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
//                   <span>Sync All Pending Submissions</span>
//                 </button>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 <p className="text-xs text-slate-300">
//                   Connect your Google account with Google Sheets permission to view and sync your
//                   contact list.
//                 </p>
//                 <button
//                   onClick={handleConnectGoogle}
//                   disabled={isConnecting}
//                   className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/25"
//                 >
//                   {isConnecting ? (
//                     <RefreshCw className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <CheckCircle className="w-4 h-4" />
//                   )}
//                   <span>Connect Google Account</span>
//                 </button>
//               </div>
//             )}

//             {statusNote && (
//               <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-900/60 text-[11px] text-blue-300">
//                 {statusNote}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </footer>

//   );
// }

























"use client";

import {ShieldCheck} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  
  return (
    <footer className="relative border-t border-slate-800/80 bg-[#05070b] text-slate-400">
      <div className="mx-auto max-w-375 px-6 sm:px-10 lg:px-14">

        {/* =========================================================
            MAIN FOOTER
        ========================================================= */}
        <div className="grid gap-12 py-12 md:grid-cols-[1fr_1fr_1fr] lg:gap-20 lg:py-16">

          {/* =======================================================
              BRAND / DESCRIPTION
          ======================================================= */}
          <div>
            {/* XEROXMATE LOGO */}
            <a
              href="#"
              className="inline-block"
              aria-label="XEROXMATE Home"
            >
              <div className="flex items-center leading-none">
                <span className="text-[27px] font-black tracking-[-1.5px] text-white">
                  XEROX
                </span>

                <span className="text-[27px] font-black tracking-[-1.5px] text-[#1687ff]">
                  MATE
                </span>
              </div>

              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="h-px w-7 bg-[#1687ff]" />

                <span className="text-[6px] font-bold tracking-[0.3em] text-white">
                  YOUR PRINTING PARTNER
                </span>

                <span className="h-px w-7 bg-[#1687ff]" />
              </div>
            </a>

            {/* DESCRIPTION */}
            <p className="mt-7 max-w-132.5 text-sm leading-7 text-[#79a2ca]">
              Your comprehensive digital printing partner. Upload
              effortlessly, compare verified local hubs, skip queue
              bottlenecks, and receive pristine printed work on demand.
            </p>

            {/* EARLY ACCESS */}
            <div className="mt-5 flex items-center gap-2 text-xs text-[#55799f]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

              <span>
                Priority Early Access · Global synchronized release
              </span>
            </div>
          </div>

          {/* =======================================================
              APPLICATION NAVIGATION
          ======================================================= */}
          <div >
            <h3 className="text-sm font-bold uppercase tracking-wide text-center text-white">
              Application Navigation
            </h3>
            <div className="grid grid-cols-2 gap-6  ">
              <nav className="mt-5 space-y-3 border-r border-slate-800/80 ">
                <a
                  href="#upload"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  Upload your document 
                </a>

                <a
                  href="#print-simulator"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  How It Works
                </a>

                <a
                  href="#comparision"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  Traditional Way vs XEROXMATE
                </a>


                <a
                  href="#conduct-card"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  Conduct Card 
                </a>
              </nav>
              
              <nav className="mt-5 space-y-3 text-center">
                <Link
                  href="/"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/new-order"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  New Order
                </Link>

                <Link
                  href="/my-orders"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  My Orders
                </Link>

                <Link
                  href="/support"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  Support
                </Link>

                <Link
                  href="/profile"
                  className="block text-sm text-[#82a8cd] transition-colors duration-200 hover:text-white"
                >
                  Profile
                </Link>
              </nav>
            </div>
          </div>

          {/* =======================================================
              SECURITY
          ======================================================= */}
          <div>
            <div
              id="security"
              className="rounded-2xl border border-slate-800 bg-[#0b101c] px-5 py-5"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />

                <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                  Security & Confidentiality
                </h3>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#78a0c9]">
                All document uploads are processed in memory with
                cryptographic shredding. No unauthorized vendor archiving
                or reproduction.
              </p>
            </div>

            {/* POWERED BY */}
            <div className="mt-10 text-sm text-[#55799f]">
              Powered by{" "}
              <span className="font-bold text-white">
                DesFlyer
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}