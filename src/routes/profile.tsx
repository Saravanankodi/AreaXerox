import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, PageHeader } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import type { Address } from "@/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile & Addresses — Order My Xerox" },
      {
        name: "description",
        content: "Manage your name, phone, email and saved delivery addresses for faster printing.",
      },
      { property: "og:title", content: "My Profile & Addresses — Order My Xerox" },
      { property: "og:description", content: "Your printing account details and addresses." },
    ],
  }),
  component: ProfilePage,
});

const emptyAddress: Omit<Address, "id"> = {
  label: "Home",
  name: "",
  phone: "",
  house: "",
  street: "",
  area: "",
  city: "Coimbatore",
  pincode: "",
};

function ProfilePage() {
  const { profile, addresses, updateProfile, saveAddress, deleteAddress, orders } = useStore();
  const [form, setForm] = useState(profile);
  const [draft, setDraft] = useState(emptyAddress);
  const [adding, setAdding] = useState(false);

  return (
    <CustomerShell>
      <PageHeader title="Profile" subtitle="Your details and saved addresses." />

      <div className="container-page grid gap-6 pb-16 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="card-surface p-5 md:p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-primary" /> Personal details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Full name"],
                  ["phone", "Phone number"],
                  ["email", "Email address"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className={key === "email" ? "sm:col-span-2" : ""}>
                  <Label className="text-xs font-semibold text-subtle">{label}</Label>
                  <Input
                    className="mt-2"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <Button
              className="mt-5"
              onClick={() => {
                updateProfile(form);
                toast.success("Profile updated");
              }}
            >
              Save changes
            </Button>
          </div>

          <div className="card-surface p-5 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Saved addresses
              </h2>
              <Button variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {a.label} · {a.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.house}, {a.street}, {a.area}, {a.city} - {a.pincode}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.phone}</p>
                  </div>
                  <button
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      deleteAddress(a.id);
                      toast.success("Address removed");
                    }}
                    aria-label={`Delete ${a.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {addresses.length === 0 && (
                <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
              )}
            </div>

            {adding && (
              <div className="mt-5 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
                {(
                  [
                    ["label", "Label"],
                    ["name", "Full name"],
                    ["phone", "Phone"],
                    ["house", "House / Flat"],
                    ["street", "Street"],
                    ["area", "Area"],
                    ["city", "City"],
                    ["pincode", "Pincode"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs font-semibold text-subtle">{label}</Label>
                    <Input
                      className="mt-2"
                      value={draft[key]}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Button
                    onClick={() => {
                      if (!draft.name || !draft.pincode) {
                        toast.error("Add at least a name and pincode");
                        return;
                      }
                      saveAddress({ id: `addr-${Date.now()}`, ...draft });
                      setDraft(emptyAddress);
                      setAdding(false);
                      toast.success("Address saved");
                    }}
                  >
                    Save address
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="card-surface h-fit p-5">
          <h2 className="text-base font-semibold">Printing summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total orders</dt>
              <dd className="font-semibold">{orders.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Active orders</dt>
              <dd className="font-semibold">
                {orders.filter((o) => !["COMPLETED", "DELIVERED", "REJECTED"].includes(o.status)).length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pages printed</dt>
              <dd className="font-semibold">
                {orders.reduce((s, o) => s + o.price.billablePages, 0)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </CustomerShell>
  );
}
