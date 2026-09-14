import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, MapPin, Phone, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/applications/$applicationId")({
  component: AdminApplicationDetail,
});

function AdminApplicationDetail() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const { session, updateAccount } = useAuth();
  const { shopkeeperApplications, updateShopkeeperApplication } = useStore();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!session || session.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Admin access required</h1>
          <Link
            to="/admin/login"
            className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign in as admin
          </Link>
        </div>
      </main>
    );
  }

  const application = shopkeeperApplications.find((a) => a.id === applicationId);

  if (!application) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Application not found</h1>
          <Link
            to="/admin"
            className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const approve = () => {
    if (processing) return;
    setProcessing(true);
    updateShopkeeperApplication(application.id, { accountStatus: "active" });
    updateAccount(application.accountId, { accountStatus: "active" });
    toast.success("Application approved", {
      description: `${application.shopName} is now active.`,
    });
    navigate({ to: "/admin" });
    setProcessing(false);
  };

  const reject = (event: FormEvent) => {
    event.preventDefault();
    if (processing) return;
    if (!rejectReason.trim()) {
      toast.error("Provide a reason for rejection.");
      return;
    }
    setProcessing(true);
    updateShopkeeperApplication(application.id, {
      accountStatus: "rejected",
      rejectionReason: rejectReason.trim(),
    });
    updateAccount(application.accountId, { accountStatus: "rejected" });
    toast.success("Application rejected");
    navigate({ to: "/admin" });
    setProcessing(false);
  };

  const hours = `${application.services.businessHoursFrom} – ${application.services.businessHoursTo}`;

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container-page flex items-center gap-4 py-5">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Review Application</h1>
            <p className="text-sm text-muted-foreground">{application.shopName}</p>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Status banner */}
          <div
            className={cn(
              "rounded-lg p-4 text-center text-sm font-semibold",
              application.accountStatus === "pending" && "bg-warning-light text-warning",
              application.accountStatus === "active" && "bg-success-light text-success",
              application.accountStatus === "rejected" && "bg-destructive/10 text-destructive",
            )}
          >
            Status:{" "}
            {application.accountStatus.charAt(0).toUpperCase() + application.accountStatus.slice(1)}
          </div>

          {/* Owner details */}
          <Section title="Owner Details" icon={Phone}>
            <Row label="Owner name" value={application.shopkeeperProfile.ownerName} />
            <Row label="Phone" value={application.shopkeeperProfile.phone} />
            {application.shopkeeperProfile.alternatePhone && (
              <Row label="Alternate phone" value={application.shopkeeperProfile.alternatePhone} />
            )}
            <Row label="Username" value={application.shopkeeperProfile.username} />
          </Section>

          {/* Shop details */}
          <Section title="Shop Details" icon={Store}>
            <Row label="Shop name" value={application.shopName} />
            <Row label="Address" value={application.shopAddress} />
            <Row label="Area" value={application.area || "—"} />
            <Row label="City" value={application.city} />
            <Row label="State" value={application.state || "—"} />
            <Row label="Pincode" value={application.pincode} />
            {application.whatsappNumber && (
              <Row label="WhatsApp" value={application.whatsappNumber} />
            )}
            {application.shopDescription && (
              <Row label="Description" value={application.shopDescription} />
            )}
          </Section>

          {/* Images */}
          {application.shopImages.length > 0 && (
            <Section title="Shop Images" icon={MapPin}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {application.shopImages.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={img.imageUrl}
                      alt={img.imageType}
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-2 text-center text-xs text-muted-foreground capitalize">
                      {img.imageType === "front" ? "Shop Front" : img.imageType}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Services */}
          <Section title="Services & Hours" icon={Clock}>
            <Row
              label="Paper types"
              value={[
                application.services.a4 && "A4",
                application.services.a3 && "A3",
                application.services.bondSheet && "Bond",
                application.services.photoSheet && "Photo",
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <Row
              label="Printing"
              value={[application.services.bw && "B&W", application.services.colour && "Colour"]
                .filter(Boolean)
                .join(", ")}
            />
            <Row
              label="Fulfillment"
              value={[
                application.services.pickup && "Pickup",
                application.services.delivery && `Delivery (₹${application.services.deliveryFee})`,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <Row label="Hours" value={hours} />
            <Row label="Working days" value={application.services.workingDays.join(", ")} />
          </Section>

          {/* Rejection reason (if rejected) */}
          {application.accountStatus === "rejected" && application.rejectionReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-xs font-semibold uppercase text-destructive">Rejection reason</p>
              <p className="mt-1 text-sm">{application.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          {application.accountStatus === "pending" && (
            <div className="flex flex-wrap gap-3 border-t border-border pt-6">
              <Button
                onClick={approve}
                disabled={processing}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={processing}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          )}

          {showRejectForm && (
            <form onSubmit={reject} className="card-surface space-y-4 p-5">
              <div>
                <Label className="text-xs font-semibold text-subtle">Rejection reason *</Label>
                <Textarea
                  required
                  className="mt-2"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Shop address information is incomplete."
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="destructive" disabled={processing}>
                  Confirm rejection
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowRejectForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="border-t border-border pt-6">
            <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <h2 className="inline-flex items-center gap-2 text-base font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
