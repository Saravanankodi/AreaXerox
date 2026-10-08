import ProofStrip from "../components/landing/ProofStrip";
import InteractiveSimulator from "../components/landing/InteractiveSimulator";
import ComparisonSection from "../components/landing/ComparisonSection";
import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useState } from "react";
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
import { useGoogleCustomerSignIn } from "@/lib/useGoogleCustomerSignIn";
import { motion } from 'motion/react';
// import HowItWorks from "@/components/landing/HowItWorks";
import FeatureBento from "@/components/landing/FeatureBento";
import ConductCard from "@/components/landing/ConductCard";
import Footer from "@/components/landing/Footer";
export const Route = createFileRoute("/")({ component: Index });



function Index() {
  const { setPendingUploadFiles } = useStore();
  const { session } = useAuth();
  const navigate = useNavigate();
  const platform = useAppPlatform();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);


  const { loading: googleLoading, signInAsCustomer } = useGoogleCustomerSignIn();

  return <CustomerShell hideFooter={platform !== "web"}>


    <div className="flex-1 pt-20 bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white flex max-sm:items-center max-sm:justify-center flex-col font-sans">
      <main className="grow max-h-full">

        {/* <Hero /> */}
        {/* <div className="home-orb home-orb-one" /> <div className="home-orb home-orb-two" /> */}

        <section id="upload" className="relative  md:pt-20 md:pb-28 overflow-hidden bg-[#07090e]">
          {/* Dynamic Background Glow Effects */}
          <div className=" hidden md:absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-125 sm:h-150 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-87.5 sm:w-125 h-87.5 sm:h-125 bg-blue-600/15 rounded-full blur-[120px] sm:blur-[140px] animate-pulse-slow" />
            <div className="absolute top-20 right-1/4 w-87.5 sm:w-125 h-87.5 sm:h-125 bg-indigo-600/15 rounded-full blur-[120px] sm:blur-[160px] animate-pulse-slow" />
          </div>

          {/* Radial Grid Overlay */}
          <div className="absolute inset-0 radial-grid-dark opacity-35 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  overflow-hidden">
            {/* <div className="home-orb home-orb-one" /> <div className="home-orb home-orb-two" /> */}
            <div className="grid h-fit max-sm:overflow-hidden items-center gap-10 lg:grid-cols-2 sm:py-10">
              {/* Left Column: Headline, Description & CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="hidden md:block space-y-4 sm:space-y-6 text-left"
              >
                {/* Launch Status Pill */}
                <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-950/70 border border-blue-800/60 shadow-inner backdrop-blur-md">
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
                {/* Trust Highlights */}
                <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60 max-w-xl text-xs font-medium text-slate-400">
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
                    // Queue files so they survive a pending sign-in and are picked up
              // by the New Order page (which consumes them on mount).
              setPendingUploadFiles(files);
              if (session?.role !== "customer") {
                      setAuthDialogOpen(true);
                      return false;
                    }
                          navigate({ to: "/order" });
                    return true;
            }}
                />
              </div>

            </div>
          </div>
        </section>

        <main className="hidden md:block">
          {/* Proof Strip */}
          <ProofStrip />

          {/* How It Works */}
          {/* <HowItWorks /> */}

          {/* Interactive Print Estimator & Shop Comparison */}
          {/* <InteractiveSimulator /> */}

          {/* Key Features Bento */}
          {/* <FeatureBento /> */}

          {/* Old Way vs XEROXMATE Standard */}
          <ComparisonSection />

          {/* Conduct Card */}
          
          <ConductCard />
        </main>
       
      </main>
      
      <Footer />
     
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
          disabled={googleLoading}
          onClick={async () => {
            // Google's account chooser opens in a popup, so this page stays
            // mounted. AuthProvider provisions the profile and sets the
            // session, which lifts the auth gate above.
            if (await signInAsCustomer()) {
              setAuthDialogOpen(false);
            }
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