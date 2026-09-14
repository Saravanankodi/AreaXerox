import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Printer,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Store,
  User,
  Image as ImageIcon,
  Settings,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  ShopApplication,
  ShopImage,
  ShopApplicationServices,
  ShopkeeperProfile,
} from "@/types";

export const Route = createFileRoute("/auth/shop/register")({
  component: ShopRegisterPage,
});

const STEPS = [
  { label: "Account", icon: User },
  { label: "Details", icon: User },
  { label: "Shop", icon: Store },
  { label: "Images", icon: ImageIcon },
  { label: "Services", icon: Settings },
  { label: "Submit", icon: CheckCircle2 },
] as const;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;

function ShopRegisterPage() {
  const navigate = useNavigate();
  const { session, signIn, updateAccount } = useAuth();
  const {
    submitShopkeeperApplication,
    getShopkeeperApplication,
    saveShopkeeperProfile,
    getShopkeeperProfile,
  } = useStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Account (read-only, from signup)
  const [username, setUsername] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");

  // Step 3: Shop details
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [shopDescription, setShopDescription] = useState("");

  // Step 4: Images
  const [images, setImages] = useState<ShopImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 5: Services
  const [services, setServices] = useState<ShopApplicationServices>({
    a4: true,
    a3: false,
    bondSheet: false,
    photoSheet: false,
    bw: true,
    colour: true,
    pickup: true,
    delivery: false,
    deliveryFee: 30,
    businessHoursFrom: "09:00",
    businessHoursTo: "21:00",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  });

  // Load existing application data on mount
  useEffect(() => {
    if (!session) return;
    const existing = getShopkeeperApplication(session.accountId);
    if (existing) {
      setOwnerName(existing.shopkeeperProfile.ownerName);
      setPhone(existing.shopkeeperProfile.phone);
      setAlternatePhone(existing.shopkeeperProfile.alternatePhone);
      setUsername(existing.shopkeeperProfile.username);
      setShopName(existing.shopName);
      setShopAddress(existing.shopAddress);
      setArea(existing.area);
      setCity(existing.city);
      setState(existing.state);
      setPincode(existing.pincode);
      setWhatsappNumber(existing.whatsappNumber);
      setShopDescription(existing.shopDescription);
      setImages(existing.shopImages);
      setServices(existing.services);
    }
    const profile = getShopkeeperProfile(session.accountId);
    if (profile) {
      setUsername(profile.username);
      setOwnerName(profile.ownerName);
      setPhone(profile.phone);
      setAlternatePhone(profile.alternatePhone);
    }
  }, [session, getShopkeeperApplication, getShopkeeperProfile]);

  if (!session || session.role !== "shopkeeper") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="card-surface max-w-md p-7 text-center">
          <h1 className="text-xl font-bold">Shopkeeper account required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a shopkeeper account first.</p>
          <Link
            to="/auth/shop/create-account"
            className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create account
          </Link>
        </div>
      </main>
    );
  }

  if (session.registrationStatus === "complete" && session.accountStatus === "active") {
    navigate({ to: "/shop" });
    return null;
  }

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 0:
        return true;
      case 1:
        if (!ownerName.trim()) {
          toast.error("Enter your owner name.");
          return false;
        }
        if (!phone.trim()) {
          toast.error("Enter your phone number.");
          return false;
        }
        return true;
      case 2:
        if (!shopName.trim()) {
          toast.error("Enter your shop name.");
          return false;
        }
        if (!shopAddress.trim()) {
          toast.error("Enter your shop address.");
          return false;
        }
        if (!city.trim()) {
          toast.error("Enter your city.");
          return false;
        }
        if (!pincode.trim()) {
          toast.error("Enter your pincode.");
          return false;
        }
        return true;
      case 3:
        if (images.length === 0) {
          toast.error("Upload at least one shop front image.");
          return false;
        }
        if (!images.some((img) => img.imageType === "front")) {
          toast.error("A shop front image is required.");
          return false;
        }
        return true;
      case 4:
        if (!services.bw && !services.colour) {
          toast.error("Enable at least one printing type (B&W or Colour).");
          return false;
        }
        if (!services.pickup && !services.delivery) {
          toast.error("Enable at least one fulfillment option.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported image type.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${MAX_IMAGE_SIZE_MB}MB limit.`);
        return;
      }
    }
    const newImages: ShopImage[] = files.map((file, i) => ({
      id: `img-${Date.now()}-${i}`,
      imageUrl: URL.createObjectURL(file),
      imageType: images.length === 0 && i === 0 ? "front" : "additional",
      sortOrder: images.length + i,
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const setImageType = (id: string, type: ShopImage["imageType"]) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, imageType: type } : img)));
  };

  const toggleWorkingDay = (day: string) => {
    setServices((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const application: ShopApplication = {
      id: `app-${Date.now()}`,
      accountId: session.accountId,
      shopkeeperProfile: {
        accountId: session.accountId,
        username: username.trim() || session.email.split("@")[0] || "shopkeeper",
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
      },
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      whatsappNumber: whatsappNumber.trim(),
      shopDescription: shopDescription.trim(),
      shopImages: images.map((img, i) => ({ ...img, sortOrder: i })),
      services,
      accountStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    submitShopkeeperApplication(application);
    saveShopkeeperProfile(session.accountId, application.shopkeeperProfile);
    updateAccount(session.accountId, {
      registrationStatus: "complete",
      accountStatus: "pending",
    });
    signIn({
      ...session,
      registrationStatus: "complete",
      accountStatus: "pending",
    });

    toast.success("Registration submitted", {
      description: "Your application is waiting for admin approval.",
    });
    navigate({ to: "/shop/pending" });
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Printer className="h-5 w-5" />
          </span>
          XEROXMATE
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold text-primary">SHOPKEEPER REGISTRATION</p>
          <h1 className="mt-2 text-2xl font-bold">Set up your shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the steps below to apply for shopkeeper access.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                i === step && "bg-primary text-primary-foreground",
                i < step && "bg-success-light text-success cursor-pointer",
                i > step && "bg-muted text-muted-foreground",
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          {step === 0 && (
            <StepCard title="Account details" description="Your login credentials.">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-subtle">Email</Label>
                  <Input className="mt-2" value={session.email} disabled />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">Username</Label>
                  <Input
                    className="mt-2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={session.email.split("@")[0]}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave blank to use your email prefix.
                  </p>
                </div>
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard title="Your details" description="About you as the shop owner.">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-subtle">Owner name *</Label>
                  <Input
                    required
                    className="mt-2"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">Phone number *</Label>
                  <Input
                    required
                    className="mt-2"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">Alternate phone</Label>
                  <Input
                    className="mt-2"
                    type="tel"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                  />
                </div>
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="Shop details" description="Your shop's information.">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-subtle">Shop name *</Label>
                  <Input
                    required
                    className="mt-2"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">Shop address *</Label>
                  <Input
                    required
                    className="mt-2"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-subtle">Area</Label>
                    <Input
                      className="mt-2"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-subtle">City *</Label>
                    <Input
                      required
                      className="mt-2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-subtle">State</Label>
                    <Input
                      className="mt-2"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-subtle">Pincode *</Label>
                    <Input
                      required
                      className="mt-2"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">WhatsApp number</Label>
                  <Input
                    className="mt-2"
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">Shop description</Label>
                  <Textarea
                    className="mt-2"
                    rows={3}
                    value={shopDescription}
                    onChange={(e) => setShopDescription(e.target.value)}
                    placeholder="Tell customers about your shop..."
                  />
                </div>
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard title="Shop images" description="Show customers your shop.">
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-2 text-sm font-medium">
                    Upload shop images ({images.length}/{MAX_IMAGES})
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, WEBP up to {MAX_IMAGE_SIZE_MB}MB each
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    multiple
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= MAX_IMAGES}
                  >
                    <Upload className="h-4 w-4" /> Choose images
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative overflow-hidden rounded-lg border border-border"
                      >
                        <img src={img.imageUrl} alt="Shop" className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute right-1 top-1 rounded-full bg-background/80 p-1 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="p-2">
                          <select
                            value={img.imageType}
                            onChange={(e) =>
                              setImageType(img.id, e.target.value as ShopImage["imageType"])
                            }
                            className="w-full rounded border border-border bg-card px-2 py-1 text-xs"
                          >
                            <option value="front">Shop Front</option>
                            <option value="interior">Interior</option>
                            <option value="counter">Counter</option>
                            <option value="additional">Additional</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  A shop front image is required. You can add up to {MAX_IMAGES} images.
                </p>
              </div>
            </StepCard>
          )}

          {step === 4 && (
            <StepCard title="Services & hours" description="What your shop offers.">
              <div className="space-y-6">
                <div>
                  <Label className="text-xs font-semibold text-subtle">PAPER TYPES</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        { key: "a4", label: "A4" },
                        { key: "a3", label: "A3" },
                        { key: "bondSheet", label: "Bond Sheet" },
                        { key: "photoSheet", label: "Photo Sheet" },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={services[opt.key]}
                          onChange={(e) =>
                            setServices((s) => ({ ...s, [opt.key]: e.target.checked }))
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-subtle">PRINTING</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={services.bw}
                        onChange={(e) => setServices((s) => ({ ...s, bw: e.target.checked }))}
                        className="h-4 w-4 accent-primary"
                      />
                      Black & White
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={services.colour}
                        onChange={(e) => setServices((s) => ({ ...s, colour: e.target.checked }))}
                        className="h-4 w-4 accent-primary"
                      />
                      Colour
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-subtle">FULFILLMENT</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={services.pickup}
                        onChange={(e) => setServices((s) => ({ ...s, pickup: e.target.checked }))}
                        className="h-4 w-4 accent-primary"
                      />
                      Pickup
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={services.delivery}
                        onChange={(e) => setServices((s) => ({ ...s, delivery: e.target.checked }))}
                        className="h-4 w-4 accent-primary"
                      />
                      Delivery
                    </label>
                  </div>
                  {services.delivery && (
                    <div className="mt-2">
                      <Label className="text-xs font-semibold text-subtle">Delivery fee (₹)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        value={services.deliveryFee}
                        onChange={(e) =>
                          setServices((s) => ({ ...s, deliveryFee: Number(e.target.value) }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-subtle">BUSINESS HOURS</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Opens at</Label>
                      <Input
                        className="mt-1"
                        type="time"
                        value={services.businessHoursFrom}
                        onChange={(e) =>
                          setServices((s) => ({ ...s, businessHoursFrom: e.target.value }))
                        }
                      />
                    </div>
                    <span className="mt-4 text-muted-foreground">to</span>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Closes at</Label>
                      <Input
                        className="mt-1"
                        type="time"
                        value={services.businessHoursTo}
                        onChange={(e) =>
                          setServices((s) => ({ ...s, businessHoursTo: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-subtle">WORKING DAYS</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                          services.workingDays.includes(day)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === 5 && (
            <StepCard title="Review & submit" description="Check everything before submitting.">
              <div className="space-y-4">
                <ReviewSection title="Account">
                  <ReviewRow label="Email" value={session.email} />
                  <ReviewRow
                    label="Username"
                    value={username.trim() || session.email.split("@")[0] || "shopkeeper"}
                  />
                </ReviewSection>
                <ReviewSection title="Your details">
                  <ReviewRow label="Owner name" value={ownerName} />
                  <ReviewRow label="Phone" value={phone} />
                  {alternatePhone && <ReviewRow label="Alternate phone" value={alternatePhone} />}
                </ReviewSection>
                <ReviewSection title="Shop details">
                  <ReviewRow label="Shop name" value={shopName} />
                  <ReviewRow label="Address" value={shopAddress} />
                  <ReviewRow label="Area" value={area || "—"} />
                  <ReviewRow label="City" value={city} />
                  <ReviewRow label="State" value={state || "—"} />
                  <ReviewRow label="Pincode" value={pincode} />
                  {whatsappNumber && <ReviewRow label="WhatsApp" value={whatsappNumber} />}
                  {shopDescription && <ReviewRow label="Description" value={shopDescription} />}
                </ReviewSection>
                <ReviewSection title="Images">
                  <ReviewRow label="Total images" value={String(images.length)} />
                  {images.some((img) => img.imageType === "front") && (
                    <ReviewRow label="Shop front" value="Uploaded" />
                  )}
                </ReviewSection>
                <ReviewSection title="Services">
                  <ReviewRow
                    label="Paper"
                    value={[
                      services.a4 && "A4",
                      services.a3 && "A3",
                      services.bondSheet && "Bond",
                      services.photoSheet && "Photo",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <ReviewRow
                    label="Printing"
                    value={[services.bw && "B&W", services.colour && "Colour"]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <ReviewRow
                    label="Fulfillment"
                    value={[services.pickup && "Pickup", services.delivery && "Delivery"]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <ReviewRow
                    label="Hours"
                    value={`${services.businessHoursFrom} – ${services.businessHoursTo}`}
                  />
                  <ReviewRow label="Working days" value={services.workingDays.join(", ")} />
                </ReviewSection>
              </div>
            </StepCard>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Registration"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
