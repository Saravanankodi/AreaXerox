// import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
// import { useState } from "react";
// import { toast } from "sonner";
// import { ArrowRight, CheckCircle2, Clock3, FileCheck2, MapPin, PackageCheck, Printer, ShieldCheck, Truck, Upload, Zap } from "lucide-react";
// import { CustomerShell } from "@/components/layout/CustomerShell";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { useStore } from "@/lib/store";
// import { useAuth } from "@/lib/auth";
// import { useAppPlatform } from "@/lib/platform";
// import { DocumentUploadCard } from "@/components/home/DocumentUploadCard";
// import { signInWithGoogle } from "@/lib/auth-google";

// export const Route = createFileRoute("/")({ component: Index });

// const journey = [
//   { icon: Upload, title: "Upload", copy: "Add PDFs, Word files or images." },
//   { icon: Printer, title: "Set each file", copy: "Choose paper, colour, quantity and finishing." },
//   { icon: MapPin, title: "Choose a shop", copy: "See transparent prices before you continue." },
//   { icon: PackageCheck, title: "Track it live", copy: "Know exactly when it is ready." },
// ];

// function Index() {
//   const { setPendingUploadFiles } = useStore();
//   const { session, signIn, getAllAccounts, createAccount, updateAccount } = useAuth();
//   const navigate = useNavigate();
//   const platform = useAppPlatform();
//   const [authDialogOpen, setAuthDialogOpen] = useState(false);

//   return <CustomerShell hideFooter={platform !== "web"}>
//     <section className="home-hero relative overflow-hidden">
//       <div className="home-orb home-orb-one" /> <div className="home-orb home-orb-two" />
//       <div className="container-page relative grid items-center gap-10 py-2 md:py-18 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
//         <div className="home-enter">
//           <h1 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">Your Printing  <span className="text-primary">Partner.</span></h1>
//           <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">Upload your documents, customize your printing, and get your order ready before you arrive.</p>
//           <div className="mt-8 w-full hidden md:flex flex-wrap gap-3">
//             <Link to="/order" ><Button size="lg" className="shadow-lg shadow-primary/20 ">XEROXMATE <ArrowRight className="h-4 w-4" /></Button></Link>
//             <Link to="/orders"><Button size="lg" variant="outline" className="bg-card/70 ">Track my order</Button></Link>
//           </div>
//           <div className="mt-8 hidden md:flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Privacy-first file handling</span><span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /> Quotes update instantly</span></div>
//         </div>
//         <div className="home-enter-delayed mx-auto w-full max-w-xs md:max-w-lg">
//           <DocumentUploadCard
//             multiple
//             onFilesSelected={(files) => {
//               if (session?.role !== "customer") {
//                 setAuthDialogOpen(true);
//                 return;
//               }
//               setPendingUploadFiles(files);
//               navigate({ to: "/order" });
//             }}
//           />
//         </div>
//       </div>
//     </section>

//     {platform === "web" && <div className="hidden sm:block">
//       <section className="relative z-10 -mt-5 px-5 md:-mt-7">
//         <div className="container-page"><div className="home-proof-grid grid overflow-hidden rounded-2xl border border-border bg-card shadow-raised sm:grid-cols-3"><Proof value="File-by-file" label="print controls" /><Proof value="Live" label="quote updates" /><Proof value="Pickup + delivery" label="on your terms" /></div></div>
//       </section>

//       <section className="container-page py-12 md:py-20"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold text-primary">HOW IT WORKS</p><h2 className="mt-2 text-section-title font-bold">From document to doorstep, without the queue.</h2></div><Link to="/order" className="text-sm font-semibold text-primary hover:underline">Build your order <ArrowRight className="inline h-4 w-4" /></Link></div><div className="mt-9 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{journey.map((item, index) => <div key={item.title} className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary"><item.icon className="h-5 w-5" /></span><span className="absolute top-5 right-5 text-xs font-bold text-subtle">0{index + 1}</span><h3 className="mt-5 font-semibold">{item.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.copy}</p></div>)}</div></section>

//       <section className="border-y border-border bg-card"><div className="container-page grid gap-7 py-12 md:grid-cols-[.8fr_1.2fr] md:py-16"><div><p className="text-sm font-bold text-primary">TRANSPARENT FROM THE START</p><h2 className="mt-2 text-section-title font-bold">One total you can trust.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Each file receives its own print settings and subtotal. You see delivery and the final payable amount before confirming.</p><Link to="/order" className="mt-6 inline-block"><Button variant="outline">See the order flow <ArrowRight className="h-4 w-4" /></Button></Link></div><div className="grid gap-3 sm:grid-cols-2"><Benefit icon={FileCheck2} title="File-by-file choices" copy="Different documents can use different paper, colour and finishing." /><Benefit icon={ShieldCheck} title="No price surprises" copy="The total updates as your print choices change." /><Benefit icon={Clock3} title="Live order milestones" copy="Accepted, printing, ready, and delivered—at a glance." /><Benefit icon={Truck} title="Pickup or delivery" copy="Choose what fits your day and see availability up front." /></div></div></section>
//     </div>}

//     <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
//       <DialogContent className="max-w-sm">
//         <DialogHeader>
//           <DialogTitle className="text-xl">Sign in to continue</DialogTitle>
//           <DialogDescription>
//             Create an account or sign in to upload documents and place orders.
//           </DialogDescription>
//         </DialogHeader>
//         <div className="mt-5 flex flex-col gap-3">
//           <Button
//             className="w-full"
//             size="lg"
//             onClick={() => {
//               setAuthDialogOpen(false);
//               navigate({ to: "/auth/customer/create-account" });
//             }}
//           >
//             Create an account
//           </Button>
//           <Button
//             variant="outline"
//             className="w-full"
//             size="lg"
//             onClick={() => {
//               setAuthDialogOpen(false);
//               navigate({ to: "/auth/customer/login" });
//             }}
//           >
//             Sign in
//           </Button>
//         </div>
//         <div className="relative my-4">
//           <div className="absolute inset-0 flex items-center">
//             <span className="w-full border-t border-border" />
//           </div>
//           <div className="relative flex justify-center text-xs uppercase">
//             <span className="bg-background px-2 text-muted-foreground">or</span>
//           </div>
//         </div>
//         <Button
//           variant="outline"
//           className="w-full"
//           size="lg"
//           onClick={async () => {
//             const result = await signInWithGoogle("customer");
//             if (!result.ok || !result.user) {
//               toast.error(result.error ?? "Google sign-in failed.");
//               return;
//             }
//             setAuthDialogOpen(false);
//             const { user } = result;
//             const accounts = await getAllAccounts();
//             let account = accounts.find(
//               (a) => a.email.toLowerCase() === user.email.toLowerCase() && a.role === "customer",
//             );
//             if (!account) {
//               const created = await createAccount(user.email, `google-${user.sub}`, "customer", user.name);
//               if (typeof created === "string") {
//                 toast.error(created);
//                 return;
//               }
//               account = created;
//             }
//             signIn({
//               accountId: account.id,
//               role: "customer",
//               email: account.email,
//               name: user.name,
//               phone: account.phone,
//               registrationStatus: account.registrationStatus,
//               accountStatus: account.accountStatus,
//             });
//             if (account.registrationStatus === "incomplete") {
//               updateAccount(account.id, { registrationStatus: "complete" });
//               signIn({
//                 accountId: account.id,
//                 role: "customer",
//                 email: account.email,
//                 name: user.name,
//                 phone: account.phone,
//                 registrationStatus: "complete",
//                 accountStatus: account.accountStatus,
//               });
//             }
//             toast.success("Signed in with Google");
//             navigate({ to: "/order" });
//           }}
//         >
//           <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
//             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
//             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
//             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
//             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
//           </svg>
//           Continue with Google
//         </Button>
//       </DialogContent>
//     </Dialog>
//   </CustomerShell>;
// }

// function Benefit({ icon: Icon, title, copy }: { icon: typeof FileCheck2; title: string; copy: string }) { return <div className="rounded-xl border border-border p-4"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div>; }
// function Proof({ value, label }: { value: string; label: string }) { return <div className="flex items-center justify-center gap-3 border-border px-5 py-4 text-center sm:border-r last:border-r-0"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" /><div className="text-left"><p className="text-sm font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>; }















// /**
//  * @license
//  * SPDX-License-Identifier: Apache-2.0
//  */

// // import { createFileRoute } from "@/lib/navigation";
// import { useCallback } from "react";

// import Navbar from "../components/landing/Navbar";
// import Hero from "../components/landing/Hero";
// import ProofStrip from "../components/landing/ProofStrip";
// import HowItWorks from "../components/landing/HowItWorks";
// import InteractiveSimulator from "../components/landing/InteractiveSimulator";
// import FeatureBento from "../components/landing/FeatureBento";
// import ComparisonSection from "../components/landing/ComparisonSection";
// // import ConductCard from "../components/landing/ConductCard";
// // import Footer from "../components/landing/Footer";

// // export const Route = createFileRoute("/")({
// //   component: App,
// // });

// function App() {
//   // const scrollToConduct = useCallback(() => {
//   //   const el = document.getElementById("conduct-card");

//   //   if (el) {
//   //     el.scrollIntoView({
//   //       behavior: "smooth",
//   //     });
//   //   }
//   // }, []);

//   // const scrollToCalculator = useCallback(() => {
//   //   const el = document.getElementById("print-simulator");

//   //   if (el) {
//   //     el.scrollIntoView({
//   //       behavior: "smooth",
//   //     });
//   //   }
//   // }, []);

//   return (
//     <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
//       <main className="grow">

//         <Hero/>
//         {/* <Hero
//           onScrollToConduct={scrollToConduct}
//           onScrollToCalculator={scrollToCalculator}
//         /> */}

//         {/* Proof Strip */}
//         <ProofStrip />

//         {/* How It Works */}
//         {/* <HowItWorks /> */}

//         {/* Interactive Print Estimator & Shop Comparison */}
//         <InteractiveSimulator
//           onScrollToConduct={scrollToConduct}
//         />

//         {/* Key Features Bento */}
//         {/* <FeatureBento /> */}

//         {/* Old Way vs XEROXMATE Standard */}
//         <ComparisonSection />

//         {/* Conduct Card */}
//         {/*
//         <ConductCard />
//         */}
//       </main>
// {/*
//       <Footer onScrollToConduct={scrollToConduct} />
//       */}
//     </div>
//   );
// }

// export default App;





import ProofStrip from "../components/landing/ProofStrip";
import InteractiveSimulator from "../components/landing/InteractiveSimulator";
import ComparisonSection from "../components/landing/ComparisonSection";
import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useAppPlatform } from "@/lib/platform";
import { DocumentUploadCard } from "@/components/home/DocumentUploadCard";
import { signInWithGoogle } from "@/lib/auth-google";
import { motion } from 'motion/react';
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureBento from "@/components/landing/FeatureBento";
import ConductCard from "@/components/landing/ConductCard";
export const Route = createFileRoute("/")({ component: Index });



function Index() {
  const { setPendingUploadFiles } = useStore();
  const { session, signIn, getAllAccounts, createAccount, updateAccount } = useAuth();
  const navigate = useNavigate();
  const platform = useAppPlatform();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);



  return <CustomerShell hideFooter={platform !== "web"}>


    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      <main className="grow">

        {/* <Hero /> */}
        {/* <div className="home-orb home-orb-one" /> <div className="home-orb home-orb-two" /> */}

        <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-20 md:pb-28 overflow-hidden bg-[#07090e]">
          {/* Dynamic Background Glow Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-125 sm:h-150 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-87.5 sm:w-125 h-87.5 sm:h-125 bg-blue-600/15 rounded-full blur-[120px] sm:blur-[140px] animate-pulse-slow" />
            <div className="absolute top-20 right-1/4 w-87.5 sm:w-125 h-87.5 sm:h-125 bg-indigo-600/15 rounded-full blur-[120px] sm:blur-[160px] animate-pulse-slow" />
          </div>

          {/* Radial Grid Overlay */}
          <div className="absolute inset-0 radial-grid-dark opacity-35 pointer-events-none" />

          <div className=" relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  overflow-hidden">
            {/* <div className="home-orb home-orb-one" /> <div className="home-orb home-orb-two" /> */}
            <div className=" grid items-center gap-10 lg:grid-cols-2 py-10">
              {/* Left Column: Headline, Description & CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className=" space-y-4 sm:space-y-6 text-left"
              >
                {/* Launch Status Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-950/70 border border-blue-800/60 shadow-inner backdrop-blur-md">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest text-blue-300 uppercase">
                    XEROXMATE YOUR PRINTING PARTNER
                  </span>
                </div>

                {/* Main Display Headline with responsive mobile text */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-['Outfit'] leading-[1.12]">
                  Your Smart Printing <br />
                  <span className="bg-linear-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
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
                {/* <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 sm:pt-2">
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
            </div> */}

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


              <div className="home-enter-delayed mx-auto w-full  max-w-xs md:max-w-lg  ">
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

            </div>
          </div>
        </section>


        {/* Proof Strip */}
        <ProofStrip />

        {/* How It Works */}
        {/* <HowItWorks /> */}

        {/* Interactive Print Estimator & Shop Comparison */}
        <InteractiveSimulator />

        {/* Key Features Bento */}
        {/* <FeatureBento /> */}

        {/* Old Way vs XEROXMATE Standard */}
        <ComparisonSection />

        {/* Conduct Card */}
        
        <ConductCard />
       
      </main>
      {/*
      <Footer onScrollToConduct={scrollToConduct} />
      */}
    </div>

    {platform === "web" && <div className="hidden sm:block">

    </div>}

    <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Sign in to continue</DialogTitle>
          <DialogDescription>
            Create an account or sign in to upload documents and place orders.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 flex flex-col gap-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              setAuthDialogOpen(false);
              navigate({ to: "/auth/customer/create-account" });
            }}
          >
            Create an account
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => {
              setAuthDialogOpen(false);
              navigate({ to: "/auth/customer/login" });
            }}
          >
            Sign in
          </Button>
        </div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={async () => {
            const result = await signInWithGoogle("customer");
            if (!result.ok || !result.user) {
              toast.error(result.error ?? "Google sign-in failed.");
              return;
            }
            setAuthDialogOpen(false);
            const { user } = result;
            const accounts = await getAllAccounts();
            let account = accounts.find(
              (a) => a.email.toLowerCase() === user.email.toLowerCase() && a.role === "customer",
            );
            if (!account) {
              const created = await createAccount(user.email, `google-${user.sub}`, "customer", user.name);
              if (typeof created === "string") {
                toast.error(created);
                return;
              }
              account = created;
            }
            signIn({
              accountId: account.id,
              role: "customer",
              email: account.email,
              name: user.name,
              phone: account.phone,
              registrationStatus: account.registrationStatus,
              accountStatus: account.accountStatus,
            });
            if (account.registrationStatus === "incomplete") {
              updateAccount(account.id, { registrationStatus: "complete" });
              signIn({
                accountId: account.id,
                role: "customer",
                email: account.email,
                name: user.name,
                phone: account.phone,
                registrationStatus: "complete",
                accountStatus: account.accountStatus,
              });
            }
            toast.success("Signed in with Google");
            navigate({ to: "/order" });
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  </CustomerShell>;
}