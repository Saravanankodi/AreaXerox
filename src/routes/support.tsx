// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import { LifeBuoy, Mail, Phone, MessageSquare } from "lucide-react";
// import { toast } from "sonner";
// import { CustomerShell, PageHeader } from "@/components/layout/CustomerShell";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { useStore } from "@/lib/store";

// export const Route = createFileRoute("/support")({
//   head: () => ({
//     meta: [
//       { title: "Help & Support — XEROXIFY" },
//       {
//         name: "description",
//         content: "Raise a support ticket about an order, payment or delivery, or read common answers.",
//       },
//       { property: "og:title", content: "Help & Support — XEROXIFY" },
//       { property: "og:description", content: "Get help with your print orders." },
//     ],
//   }),
//   component: SupportPage,
// });

// const FAQ = [
//   {
//     q: "How long does printing take?",
//     a: "Most shops finish standard orders in 20–40 minutes. The exact prep time is shown on each shop card before you order.",
//   },
//   {
//     q: "Are my documents safe?",
//     a: "Files are only shared with the shop you choose, and are automatically removed after your order is completed.",
//   },
//   {
//     q: "Can I pay after collecting?",
//     a: "Yes — if the shop enables it, you can pay in full at pickup, on delivery, or pay a small advance now and the balance later.",
//   },
//   {
//     q: "What if the print quality is wrong?",
//     a: "Raise a ticket below within 24 hours with your order ID. The shop will reprint or refund based on what went wrong.",
//   },
// ];

// const CATEGORIES = ["Order issue", "Payment", "Delivery", "Print quality", "Something else"];

// function SupportPage() {
//   const { orders, tickets, addTicket } = useStore();
//   const [subject, setSubject] = useState("");
//   const [orderId, setOrderId] = useState<string>("none");
//   const [category, setCategory] = useState(CATEGORIES[0]!);
//   const [description, setDescription] = useState("");

//   return (
//     <CustomerShell>
//       <PageHeader title="Help & Support" subtitle="We usually reply within a few hours." />

//       <div className="container-page grid gap-6 pb-16 lg:grid-cols-[1fr_320px]">
//         <div className="space-y-6">
//           <div className="card-surface p-5 md:p-6">
//             <h2 className="inline-flex items-center gap-2 text-base font-semibold">
//               <MessageSquare className="h-4 w-4 text-primary" /> Raise a ticket
//             </h2>
//             <div className="mt-5 space-y-4">
//               <div>
//                 <Label className="text-xs font-semibold text-subtle">SUBJECT</Label>
//                 <Input
//                   className="mt-2"
//                   placeholder="Short summary of the issue"
//                   value={subject}
//                   onChange={(e) => setSubject(e.target.value)}
//                 />
//               </div>
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <div>
//                   <Label className="text-xs font-semibold text-subtle">RELATED ORDER</Label>
//                   <Select value={orderId} onValueChange={setOrderId}>
//                     <SelectTrigger className="mt-2">
//                       <SelectValue placeholder="Select an order" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="none">Not order specific</SelectItem>
//                       {orders.map((o) => (
//                         <SelectItem key={o.id} value={o.id}>
//                           {o.id} — {o.shopName}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label className="text-xs font-semibold text-subtle">CATEGORY</Label>
//                   <Select value={category} onValueChange={setCategory}>
//                     <SelectTrigger className="mt-2">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {CATEGORIES.map((c) => (
//                         <SelectItem key={c} value={c}>
//                           {c}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <div>
//                 <Label className="text-xs font-semibold text-subtle">DESCRIPTION</Label>
//                 <Textarea
//                   className="mt-2"
//                   rows={4}
//                   placeholder="Tell us what happened"
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                 />
//               </div>
//               <Button
//                 onClick={() => {
//                   if (!subject || !description) {
//                     toast.error("Add a subject and description");
//                     return;
//                   }
//                   addTicket({
//                     id: `TCK-${Date.now().toString().slice(-5)}`,
//                     subject,
//                     ...(orderId !== "none" ? { orderId } : {}),
//                     category,
//                     description,
//                     createdAt: new Date().toISOString(),
//                     status: "open",
//                   });
//                   setSubject("");
//                   setDescription("");
//                   toast.success("Ticket submitted", { description: "We'll get back to you shortly." });
//                 }}
//               >
//                 Submit ticket
//               </Button>
//             </div>
//           </div>

//           <div className="card-surface p-5 md:p-6">
//             <h2 className="inline-flex items-center gap-2 text-base font-semibold">
//               <LifeBuoy className="h-4 w-4 text-primary" /> Frequently asked
//             </h2>
//             <Accordion type="single" collapsible className="mt-3">
//               {FAQ.map((f) => (
//                 <AccordionItem key={f.q} value={f.q}>
//                   <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
//                   <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
//                 </AccordionItem>
//               ))}
//             </Accordion>
//           </div>

//           {tickets.length > 0 && (
//             <div className="card-surface p-5 md:p-6">
//               <h2 className="text-base font-semibold">Your tickets</h2>
//               <div className="mt-4 space-y-3">
//                 {tickets.map((t) => (
//                   <div key={t.id} className="rounded-lg border border-border p-4">
//                     <div className="flex flex-wrap items-center justify-between gap-2">
//                       <p className="text-sm font-semibold">{t.subject}</p>
//                       <span className="rounded-md border border-warning/40 bg-warning-light px-2 py-1 text-xs font-semibold text-warning-foreground">
//                         {t.status === "open" ? "Open" : "Resolved"}
//                       </span>
//                     </div>
//                     <p className="mt-1 text-xs text-muted-foreground">
//                       {t.id} · {t.category}
//                       {t.orderId ? ` · ${t.orderId}` : ""} ·{" "}
//                       {new Date(t.createdAt).toLocaleString("en-IN")}
//                     </p>
//                     <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <aside className="card-surface h-fit p-5">
//           <h2 className="text-base font-semibold">Contact us directly</h2>
//           <p className="mt-3 inline-flex items-center gap-2 text-sm">
//             <Phone className="h-4 w-4 text-primary" /> +91 80000 12345
//           </p>
//           <p className="mt-2 inline-flex items-center gap-2 text-sm">
//             <Mail className="h-4 w-4 text-primary" /> help@ordermyxerox.in
//           </p>
//           <p className="mt-4 text-xs text-muted-foreground">
//             Support hours: 9:00 AM – 9:00 PM, every day.
//           </p>
//         </aside>
//       </div>
//     </CustomerShell>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, Mail, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, PageHeader } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Help & Support — XEROXIFY" },
      {
        name: "description",
        content: "Raise a support ticket about an order, payment or delivery, or read common answers.",
      },
      { property: "og:title", content: "Help & Support — XEROXIFY" },
      { property: "og:description", content: "Get help with your print orders." },
    ],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    q: "How long does printing take?",
    a: "Most shops finish standard orders in 20–40 minutes. The exact prep time is shown on each shop card before you order.",
  },
  {
    q: "Are my documents safe?",
    a: "Files are only shared with the shop you choose, and are automatically removed after your order is completed.",
  },
  {
    q: "Can I pay after collecting?",
    a: "Yes — if the shop enables it, you can pay in full at pickup, on delivery, or pay a small advance now and the balance later.",
  },
  {
    q: "What if the print quality is wrong?",
    a: "Raise a ticket below within 24 hours with your order ID. The shop will reprint or refund based on what went wrong.",
  },
];

const CATEGORIES = ["Order issue", "Payment", "Delivery", "Print quality", "Something else"];

function SupportPage() {
  const { orders, tickets, addTicket } = useStore();
  const [subject, setSubject] = useState("");
  const [orderId, setOrderId] = useState<string>("none");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [description, setDescription] = useState("");

  return (
    <CustomerShell>
      <PageHeader
        title="Help & Support"
        subtitle="We usually reply within a few hours."
      />

      <div className="container-page pb-16">
        {/* Main Support Area */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">

          {/* Raise a Ticket */}
          <div className="card-surface p-5 md:p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="h-4 w-4 text-primary" /> Raise a ticket
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-subtle">
                  SUBJECT
                </Label>
                <Input
                  className="mt-2"
                  placeholder="Short summary of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-subtle">
                    RELATED ORDER
                  </Label>
                  <Select value={orderId} onValueChange={setOrderId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Not order specific
                      </SelectItem>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.id} — {o.shopName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-subtle">
                    CATEGORY
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-subtle">
                  DESCRIPTION
                </Label>
                <Textarea
                  className="mt-2"
                  rows={4}
                  placeholder="Tell us what happened"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button
                onClick={() => {
                  if (!subject || !description) {
                    toast.error("Add a subject and description");
                    return;
                  }

                  addTicket({
                    id: `TCK-${Date.now().toString().slice(-5)}`,
                    subject,
                    ...(orderId !== "none" ? { orderId } : {}),
                    category,
                    description,
                    createdAt: new Date().toISOString(),
                    status: "open",
                  });

                  setSubject("");
                  setDescription("");

                  toast.success("Ticket submitted", {
                    description: "We'll get back to you shortly.",
                  });
                }}
              >
                Submit ticket
              </Button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Frequently Asked */}
            <div className="card-surface p-5 md:p-6">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold">
                <LifeBuoy className="h-4 w-4 text-primary" /> Frequently asked
              </h2>

              <Accordion type="single" collapsible className="mt-3">
                {FAQ.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-sm">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Contact Us */}
            <aside className="card-surface h-fit p-5">
              <h2 className="text-base font-semibold">
                Contact us directly
              </h2>

              <p className="mt-3 inline-flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                +91 80000 12345
              </p>

              <p className="mt-2 inline-flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                help@ordermyxerox.in
              </p>

              <p className="mt-4 text-xs text-muted-foreground">
                Support hours: 9:00 AM – 9:00 PM, every day.
              </p>
            </aside>
          </div>
        </div>

        {/* Your Tickets */}
        {tickets.length > 0 && (
          <div className="card-surface mt-6 p-5 md:p-6">
            <h2 className="text-base font-semibold">Your tickets</h2>

            <div className="mt-4 space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{t.subject}</p>

                    <span className="rounded-md border border-warning/40 bg-warning-light px-2 py-1 text-xs font-semibold text-warning-foreground">
                      {t.status === "open" ? "Open" : "Resolved"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.id} · {t.category}
                    {t.orderId ? ` · ${t.orderId}` : ""} ·{" "}
                    {new Date(t.createdAt).toLocaleString("en-IN")}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
