export type PrintType = "bw" | "color";
export type PrintSide = "single" | "double";
export type Orientation = "portrait" | "landscape";
export type Fulfillment = "pickup" | "delivery";

export type PaymentMethod = "full" | "advance" | "cash_pickup" | "cash_delivery";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "failed" | "refunded";

export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "PRINTING"
  | "FINISHING"
  | "READY_PICKUP"
  | "READY_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED";

export type AccountRole = "customer" | "shopkeeper" | "admin";
export type RegistrationStatus = "incomplete" | "complete";
export type AccountStatus = "pending" | "active" | "rejected" | "suspended" | "disabled";

export interface Account {
  id: string;
  email: string;
  passwordHash: string;
  role: AccountRole;
  registrationStatus: RegistrationStatus;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShopkeeperProfile {
  accountId: string;
  username: string;
  ownerName: string;
  phone: string;
  alternatePhone: string;
}

export interface ShopApplication {
  id: string;
  accountId: string;
  shopkeeperProfile: ShopkeeperProfile;
  shopName: string;
  shopAddress: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  whatsappNumber: string;
  shopDescription: string;
  shopImages: ShopImage[];
  services: ShopApplicationServices;
  accountStatus: AccountStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopImage {
  id: string;
  imageUrl: string;
  imageType: "front" | "interior" | "counter" | "additional";
  sortOrder: number;
}

export interface ShopApplicationServices {
  a4: boolean;
  a3: boolean;
  bondSheet: boolean;
  photoSheet: boolean;
  bw: boolean;
  colour: boolean;
  pickup: boolean;
  delivery: boolean;
  deliveryFee: number;
  businessHoursFrom: string;
  businessHoursTo: string;
  workingDays: string[];
}

export interface PaperType {
  id: string;
  name: string;
  enabled: boolean;
  bwEnabled: boolean;
  bwPrice: number;
  colorEnabled: boolean;
  colorPrice: number;
  single: boolean;
  double: boolean;
}

export interface ServiceOption {
  id: string;
  name: string;
  enabled: boolean;
  price: number;
  /** price charged per page instead of per copy */
  perPage?: boolean;
}

export interface DeliverySettings {
  enabled: boolean;
  fee: number;
  freeAbove: number | null;
  etaMinutes: string;
  areas: string[];
}

export interface PaymentSettings {
  full: boolean;
  advance: boolean;
  cashPickup: boolean;
  cashDelivery: boolean;
  advancePercent: number;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  whatsappNumber?: string;
  email: string;
  address: string;
  hours: string;
  workingDaysFrom?: string;
  workingDaysTo?: string;
  openingTime?: string;
  closingTime?: string;
  rating: number;
  distanceKm: number;
  prepMinutes: number;
  pickup: boolean;
  paperTypes: PaperType[];
  printTypes: { bw: boolean; color: boolean };
  printSides: { single: boolean; double: boolean };
  orientation: { portrait: boolean; landscape: boolean };
  binding: ServiceOption[];
  additional: ServiceOption[];
  delivery: DeliverySettings;
  payments: PaymentSettings;
}

export interface DocumentFile {
  id: string;
  name: string;
  pages: number;
  sizeMb: number;
  pageCountDetected?: boolean;
  /** True while the page count is being detected asynchronously. */
  detectingPages?: boolean;
  printConfig?: PrintConfig;
  instructions?: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  house: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
}

export interface PrintConfig {
  paperTypeId: string;
  printType: PrintType;
  side: PrintSide;
  copies: number;
  pageRangeMode: "all" | "custom";
  pageRange: string;
  /** Number of document pages placed on each physical sheet. */
  pageLayout?: 1 | 2 | 4;
  orientation: Orientation;
  bindingId: string | null;
  additionalIds: string[];
}

export interface PriceBreakdown {
  printing: number;
  binding: number;
  services: number;
  delivery: number;
  discount: number;
  total: number;
  billablePages: number;
}

export interface TimelineEntry {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  shopId: string;
  shopName: string;
  documents: DocumentFile[];
  config: PrintConfig;
  configLabels: {
    paper: string;
    printType: string;
    side: string;
    orientation: string;
    binding: string;
    additional: string[];
  };
  fulfillment: Fulfillment;
  address: Address | null;
  price: PriceBreakdown;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  balanceCollectedVia?: "cash" | "upi" | "card";
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  orderId?: string;
  category: string;
  description: string;
  createdAt: string;
  status: "open" | "resolved";
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  alternatephone?: string;
}

export interface OrderDraft {
  step: number;
  docs: DocumentFile[];
  config: PrintConfig;
  shopId: string;
  fulfillment: Fulfillment;
  addressId: string | null;
  method: PaymentMethod;
  notes: string;
}
