import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BellRing, CheckCircle2, CircleCheck, Clock3, FileCheck2, MapPin, PackageCheck, Printer, ShieldCheck, Sparkles, Star, Truck, Upload, Zap } from "lucide-react";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import { useAppPlatform } from "@/lib/platform";
import { DocumentUploadCard } from "@/components/home/DocumentUploadCard";

export const Route = createFileRoute("/")({ component: Index });

const journey = [
  { icon: Upload, title: "Upload", copy: "Add PDFs, Word files or images." },
  { icon: Printer, title: "Set each file", copy: "Choose paper, colour, quantity and finishing." },
  { icon: MapPin, title: "Choose a shop", copy: "See transparent prices before you continue." },
  { icon: PackageCheck, title: "Track it live", copy: "Know exactly when it is ready." },
];

function Index() {
  const { shops, setPendingUploadFiles } = useStore();
  const navigate = useNavigate();
  const platform = useAppPlatform();
  return <CustomerShell hideFooter={platform !== "web"}>
    <section className="home-hero relative overflow-hidden">
      <div className="home-orb home-orb-one" /> <div className="home-orb home-orb-two" />
      <div className="container-page relative grid items-center gap-10 py-2 md:py-18 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div className="home-enter">
          <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/75 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur"><Sparkles className="h-3.5 w-3.5" /> XEROXIFY</span>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">Print Smarter.<br /><span className="text-primary">Skip the Queue.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">Upload your documents, customize your printing, and get your order ready before you arrive.</p>
          <div className="mt-8 w-full hidden md:flex flex-wrap gap-3">
            <Link to="/order" ><Button size="lg" className="shadow-lg shadow-primary/20 ">XEROXIFY <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/orders"><Button size="lg" variant="outline" className="bg-card/70 ">Track my order</Button></Link>
          </div>
          <div className="mt-8 hidden md:flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Privacy-first file handling</span><span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /> Quotes update instantly</span></div>
        </div>
        <div className="home-enter-delayed mx-auto w-full max-w-xs md:max-w-lg"><DocumentUploadCard multiple onFilesSelected={(files) => { setPendingUploadFiles(files); navigate({ to: "/order" }); }} /></div>
        {/* <div className="mt-8 w-full md:hidden flex items-center justify-center flex-wrap gap-3">
          <Link to="/order" ><Button size="lg" className="shadow-lg shadow-primary/20 ">XEROXIFY <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/orders"><Button size="lg" variant="outline" className="bg-card/70 ">Track my order</Button></Link>
        </div> */}
      </div>
    </section>

    {platform === "web" && <div className="hidden sm:block">
      <section className="relative z-10 -mt-5 px-5 md:-mt-7">
        <div className="container-page"><div className="home-proof-grid grid overflow-hidden rounded-2xl border border-border bg-card shadow-raised sm:grid-cols-3"><Proof value="File-by-file" label="print controls" /><Proof value="Live" label="quote updates" /><Proof value="Pickup + delivery" label="on your terms" /></div></div>
      </section>

      <section className="container-page py-12 md:py-20"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold text-primary">HOW IT WORKS</p><h2 className="mt-2 text-section-title font-bold">From document to doorstep, without the queue.</h2></div><Link to="/order" className="text-sm font-semibold text-primary hover:underline">Build your order <ArrowRight className="inline h-4 w-4" /></Link></div><div className="mt-9 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{journey.map((item, index) => <div key={item.title} className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary"><item.icon className="h-5 w-5" /></span><span className="absolute top-5 right-5 text-xs font-bold text-subtle">0{index + 1}</span><h3 className="mt-5 font-semibold">{item.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.copy}</p></div>)}</div></section>

      <section className="border-y border-border bg-card"><div className="container-page grid gap-7 py-12 md:grid-cols-[.8fr_1.2fr] md:py-16"><div><p className="text-sm font-bold text-primary">TRANSPARENT FROM THE START</p><h2 className="mt-2 text-section-title font-bold">One total you can trust.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Each file receives its own print settings and subtotal. You see delivery and the final payable amount before confirming.</p><Link to="/order" className="mt-6 inline-block"><Button variant="outline">See the order flow <ArrowRight className="h-4 w-4" /></Button></Link></div><div className="grid gap-3 sm:grid-cols-2"><Benefit icon={FileCheck2} title="File-by-file choices" copy="Different documents can use different paper, colour and finishing." /><Benefit icon={ShieldCheck} title="No price surprises" copy="The total updates as your print choices change." /><Benefit icon={Clock3} title="Live order milestones" copy="Accepted, printing, ready, and delivered—at a glance." /><Benefit icon={Truck} title="Pickup or delivery" copy="Choose what fits your day and see availability up front." /></div></div></section>

      {/* <section className="container-page py-12 md:py-20"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-primary">AVAILABLE NEAR YOU</p><h2 className="mt-2 text-section-title font-bold">Trusted shops, clear turnaround.</h2></div><Link to="/order"><Button variant="outline">Compare shops</Button></Link></div><div className="mt-8 grid gap-4 md:grid-cols-3">{shops.map((shop) => <div key={shop.id} className="card-surface hover-lift p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-base font-bold">{shop.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {shop.distanceKm} km away</p></div><span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-1 text-xs font-bold"><Star className="h-3.5 w-3.5 text-warning" /> {shop.rating}</span></div><div className="mt-5 flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5 text-xs"><span className="text-muted-foreground">Turnaround</span><span className="font-semibold">~{shop.prepMinutes} minutes</span></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">B/W from</span><span className="font-bold">{inr(Math.min(...shop.paperTypes.filter((paper) => paper.enabled).map((paper) => paper.bwPrice)))} / page</span></div></div>)}</div></section> */}

      {/* <section className="container-page pb-12 md:pb-20"><div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:px-12 md:py-16"><div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10" /><div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 text-sm font-bold"><BellRing className="h-4 w-4" /> Ready when you are</span><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Let the print shop work around your schedule.</h2><p className="mt-4 max-w-xl text-sm leading-6 opacity-90">Upload now, set each file exactly as you need it, and choose pickup or delivery when you are ready.</p><Link to="/order" className="mt-7 inline-block"><Button size="lg" variant="secondary">Start printing <ArrowRight className="h-4 w-4" /></Button></Link></div></div></section> */}
    </div>}
  </CustomerShell>;
}

// function WorkspacePreview() { return <div className="home-dashboard card-surface p-3 sm:p-5"><div className="flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Printer className="h-5 w-5" /></span><div><p className="text-sm font-bold">Your print workspace</p><p className="text-xs text-muted-foreground">Clear settings. Accurate totals.</p></div></div><span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-light text-success"><CheckCircle2 className="h-4 w-4" /></span></div><div className="mt-4 rounded-xl border border-border bg-secondary/55 p-4"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary"><FileCheck2 className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">Project-report.pdf</p><p className="text-xs text-muted-foreground">24 pages · A4 · B/W · 2 copies</p></div></div><span className="text-sm font-bold">{inr(96)}</span></div><div className="mt-3 flex items-center gap-2 text-xs text-success"><CircleCheck className="h-3.5 w-3.5" /> Print requirements saved</div></div><div className="mt-3 rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Final estimation</p><span className="text-xs font-medium text-success">Ready to review</span></div><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between text-muted-foreground"><span>Document subtotal</span><span>{inr(96)}</span></div><div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{inr(30)}</span></div><div className="flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total payable</span><span>{inr(126)}</span></div></div></div><div className="mt-4 grid grid-cols-3 gap-2"><Metric value="3" label="nearby shops" /><Metric value="20 min" label="fastest prep" /><Metric value="4.8" label="avg. rating" /></div></div>; }
// function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-lg bg-secondary px-2 py-2 text-center"><p className="text-sm font-bold">{value}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p></div>; }
function Benefit({ icon: Icon, title, copy }: { icon: typeof FileCheck2; title: string; copy: string }) { return <div className="rounded-xl border border-border p-4"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div>; }
function Proof({ value, label }: { value: string; label: string }) { return <div className="flex items-center justify-center gap-3 border-border px-5 py-4 text-center sm:border-r last:border-r-0"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" /><div className="text-left"><p className="text-sm font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>; }
