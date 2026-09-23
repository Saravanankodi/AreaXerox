/* =========================================================
 * PRINTING
 * ======================================================= */

export type PrintType = "bw" | "color";

export type PrintSide =
  | "single"
  | "double";

export type Orientation =
  | "portrait"
  | "landscape";

export type Fulfillment =
  | "pickup"
  | "delivery";


/* =========================================================
 * PAYMENTS
 * ======================================================= */

export type PaymentMethod =
  | "full"
  | "advance"
  | "cash_pickup"
  | "cash_delivery";

export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentCollectedVia =
  | "cash"
  | "upi"
  | "card";

export type ShopPaymentMethod =
  | "upi"
  | "bank_transfer";

export type CustomerPayoutMethod =
  | "upi"
  | "bank_transfer";

/* =========================================================
 * RAZORPAY ROUTE / LINKED ACCOUNTS
 * ======================================================= */

/**
 * Lifecycle of a shopkeeper's linked (Route) account on Razorpay.
 *
 * Drive exclusively by server-side onboarding + Razorpay webhooks —
 * the client must never write these fields directly to Firestore.
 */
export type RazorpayOnboardingStatus =
  | "not_started"
  | "processing"
  | "under_review"
  | "needs_clarification"
  | "activated"
  | "failed";

export type RazorpayRequirementStatus =
  | "required"
  | "pending"
  | "satisfied"
  | "additional_docs_required";

export interface RazorpayRequirement {
  field_reference: string;
  reason_code?: string;
  status?: RazorpayRequirementStatus;
}

export interface RazorpayOnboardingStatusData {
  accountId?: string;
  productId?: string;
  /** Server-only details; this object gets no raw PAN/bank numbers from the store. */
  requirements?: RazorpayRequirement[];
}

export type RazorpaySettlementStatus =
  | "pending"
  | "settled";

export type RazorpayPayoutStatus =
  | "pending"
  | "transferred";


/* =========================================================
 * ORDER STATUS
 * ======================================================= */

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


/* =========================================================
 * ACCOUNT
 * ======================================================= */

export interface Account {
  id: string;

  email: string;

  role: AccountRole;

  registrationStatus: RegistrationStatus;

  accountStatus: AccountStatus;

  /**
   * Only present for demo/bootstrap accounts.
   */
  passwordHash?: string;

  createdAt: string;

  updatedAt: string;
}

export type AccountRole =
  | "customer"
  | "shopkeeper"
  | "admin";

export type RegistrationStatus =
  | "incomplete"
  | "complete";

export type AccountStatus =
  | "pending"
  | "active"
  | "rejected"
  | "suspended"
  | "disabled";


/* =========================================================
 * SHOP
 * ======================================================= */

export type ShopStatus =
  | "pending"
  | "active"
  | "suspended"
  | "disabled";


/* =========================================================
 * USER ACCOUNT
 *
 * Firestore:
 * users/{uid}
 *
 * Firebase Auth UID = id
 * ======================================================= */

export interface UserAccount {
  id: string;

  email: string;

  role: AccountRole;

  name: string;

  phone: string;

  alternatePhone?: string;

  /**
   * Only normally present for shopkeepers.
   */
  shopId?: string;

  registrationStatus: RegistrationStatus;

  accountStatus: AccountStatus;

  createdAt: string;

  updatedAt: string;
}


/* =========================================================
 * SHOP IMAGES
 * ======================================================= */

export type ShopImageType =
  | "front"
  | "interior"
  | "counter"
  | "additional";

export interface ShopImage {
  id: string;

  imageUrl: string;

  imageType: ShopImageType;

  sortOrder: number;
}


/* =========================================================
 * SHOP APPLICATION SERVICES
 * ======================================================= */

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


/* =========================================================
 * SHOP APPLICATION
 * ======================================================= */

export interface ShopApplication {
  id: string;

  accountId?: string;

  shopName: string;

  shopkeeperProfile: {
    accountId?: string;
    ownerName: string;
    phone: string;
    alternatePhone?: string;
    username: string;
  };

  whatsappNumber?: string;

  shopAddress?: string;

  area?: string;

  city?: string;

  state?: string;

  pincode?: string;

  shopDescription?: string;

  shopImages?: ShopImage[];

  services: ShopApplicationServices;

  accountStatus?: AccountStatus;

  rejectionReason?: string;

  createdAt: string;

  updatedAt: string;
}


/* =========================================================
 * PAPER TYPES
 * ======================================================= */

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


/* =========================================================
 * SHOP SERVICES
 * ======================================================= */

export interface ServiceOption {
  id: string;

  name: string;

  enabled: boolean;

  price: number;

  /**
   * If true, price is charged per document page.
   * Otherwise it can be treated as a fixed service price.
   */
  perPage?: boolean;
}


/* =========================================================
 * DELIVERY SETTINGS
 * ======================================================= */

export interface DeliverySettings {
  enabled: boolean;

  fee: number;

  /**
   * Free delivery when order total reaches this amount.
   * null = no free-delivery threshold.
   */
  freeAbove: number | null;

  /**
   * Example: "30-60 min"
   */
  etaMinutes: string;

  /**
   * Delivery areas supported by this shop.
   */
  areas: string[];
}


/* =========================================================
 * PAYMENT SETTINGS
 * ======================================================= */

export interface PaymentSettings {
  full: boolean;

  advance: boolean;

  cashPickup: boolean;

  cashDelivery: boolean;

  /**
   * Example: 50 means 50% advance.
   */
  advancePercent: number;
}


/* =========================================================
 * SHOP
 *
 * Firestore:
 * shops/{shopId}
 *
 * Single collection for both pending applications and
 * active shops. Display is controlled by accountStatus.
 * ======================================================= */

export interface Shop {
  id: string;

  /**
   * Firebase Auth UID of shop owner.
   */
  ownerId?: string;

  name: string;

  /** Alias for name used during application phase */
  shopName?: string;

  ownerName: string;

  /**
   * Shopkeeper profile data captured during registration.
   */
  shopkeeperProfile?: {
    ownerName: string;
    phone: string;
    alternatePhone?: string;
    username: string;
  };

  /**
   * Approval / lifecycle state.
   * pending → active → suspended/disabled/rejected
   */
  accountStatus?: AccountStatus;

  status?: ShopStatus;

  phone: string;

  whatsappNumber?: string;

  email: string;

  /** Full street address (application phase) */
  shopAddress?: string;

  address: string;

  area?: string;

  city?: string;

  state?: string;

  pincode?: string;

  description?: string;

  /** Short description from the application form */
  shopDescription?: string;

  /** Images uploaded during shop registration */
  shopImages?: ShopImage[];

  /** Services offered, captured during registration */
  services?: ShopApplicationServices;

  rejectionReason?: string;

  rating: number;

  reviewCount?: number;

  prepMinutes: number;

  hours?: string;

  distanceKm?: number;

  pickup: boolean;

  paperTypes: PaperType[];

  printTypes: {
    bw: boolean;
    color: boolean;
  };

  printSides: {
    single: boolean;
    double: boolean;
  };

  orientation: {
    portrait: boolean;
    landscape: boolean;
  };

  binding: ServiceOption[];

  additional: ServiceOption[];

  delivery: DeliverySettings;

  payments: PaymentSettings;

  openingTime?: string;

  closingTime?: string;

  workingDays?: string[];

  /** Whether the shop is currently accepting new orders (toggled from Shop Settings). */
  acceptingOrders?: boolean;

  /** Firebase Auth UID of the owning account (used to look up the owner's application). */
  ownerAccountId?: string;

  ownerPhone?: string;

  workingDaysFrom?: string;

  workingDaysTo?: string;

  addressLine1?: string;

  addressLine2?: string;

  zip?: string;

  country?: string;

  /** How the shop receives payouts. */
  shopPaymentMethod?: ShopPaymentMethod;

  upiId?: string;

  upiVerified?: boolean;

  bankName?: string;

  bankAccountNumber?: string;

  bankIfsc?: string;

  bankBranch?: string;

  /**
   * Razorpay Route (linked account) id. Written only by the server.
   */
  razorpayAccountId?: string;

  /**
   * Razorpay stakeholder id for the shop owner. Written only by the server.
   */
  razorpayStakeholderId?: string;

  /**
   * Razorpay product-configuration id for the `route` product.
   * Written only by the server.
   */
  razorpayProductId?: string;

  /**
   * Current linked-account activation state. Mirrors Razorpay product
   * `activation_status` plus `not_started` until onboarding begins.
   */
  razorpayOnboardingStatus?: RazorpayOnboardingStatus;

  /**
   * True once the shopkeeper's linked account fully passes KYC (`activated`)
   * so automated Route transfers can be attached to new orders.
   */
  payoutEnabled?: boolean;

  /**
   * Server-side requirement list describing what is still missing for the
   * linked account to activate. Mirrored for the dashboard UI.
   */
  razorpayRequirements?: RazorpayRequirement[];

  frontImage?: string;

  interiorImage?: string;

  /** Whether the shop owner has checked in / opened the shop for the day. */
  isOpen?: boolean;

  lastCheckInAt?: string;

  lastCheckOutAt?: string;

  /** Shopkeeper preferences, persisted with the shop document in Firestore. */
  settings?: {
    notifications: {
      sound: boolean;
      email: boolean;
    };
  };

  createdAt?: string;

  updatedAt?: string;
}


/* =========================================================
 * DOCUMENT FILE
 *
 * Firestore stores metadata.
 * Actual file lives in Firebase Storage.
 * ======================================================= */

export interface DocumentFile {
  id: string;

  name: string;

  /**
   * Firebase Storage path.
   */
  storagePath?: string;

  contentType?: string;

  sizeBytes?: number;

  sizeMb?: number;

  pages: number;

  pageCountDetected?: boolean;

  detectingPages?: boolean;

  /**
   * Pages selected for printing ("all" = "1-pages").
   */
  pageRange?: string;

  printConfig?: PrintConfig;

  instructions?: string;

  /**
   * Cloudinary file storage metadata reference
   */
  cloudinary?: {
    url: string;
    publicId: string;
    originalName: string;
    format: string;
    size: number;
  };
}


/* =========================================================
 * ADDRESS
 *
 * Can be stored under:
 *
 * users/{uid}/addresses/{addressId}
 * ======================================================= */

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

  createdAt?: string;

  updatedAt?: string;
}


/* =========================================================
 * PRINT CONFIGURATION
 * ======================================================= */

export interface PrintConfig {
  paperTypeId: string;

  printType: PrintType;

  side: PrintSide;

  copies: number;

  pageRangeMode:
  | "all"
  | "custom";

  pageRange: string;

  /**
   * Number of document pages per physical sheet.
   *
   * 1 = normal
   * 2 = two pages per sheet
   * 4 = four pages per sheet
   */
  pageLayout?: 1 | 2 | 4;

  orientation: Orientation;

  bindingId: string | null;

  additionalIds: string[];
}


/* =========================================================
 * PRICE BREAKDOWN
 * ======================================================= */

export interface PriceBreakdown {
  printing: number;

  binding: number;

  services: number;

  delivery: number;

  discount: number;

  total: number;

  /**
   * Number of pages used to calculate printing cost.
   */
  billablePages: number;
}


/* =========================================================
 * ORDER TIMELINE
 * ======================================================= */

export interface TimelineEntry {
  status: OrderStatus;

  at: string;
}


/* =========================================================
 * ORDER PAYMENT
 * ======================================================= */

export interface OrderPayment {
  method: PaymentMethod;

  status: PaymentStatus;

  amountPaid: number;

  balance: number;

  balanceCollectedVia?: PaymentCollectedVia;

  /**
   * Payment gateway / UPI transaction reference.
   */
  transactionId?: string;

  paidAt?: string;

  /**
   * Razorpay Order id created for this order's online payment.
   * Set server-side only.
   */
  razorpayOrderId?: string;

  /**
   * Razorpay Payment id returned after the customer completes checkout.
   * Set server-side only.
   */
  razorpayPaymentId?: string;

  /**
   * Razorpay signature verified during server-side payment confirmation.
   * Set server-side only.
   */
  razorpaySignature?: string;

  /**
   * Journey of funds from the platform account to the shop's linked account
   * once the order is captured.
   */
  settlementStatus?: RazorpaySettlementStatus;

  /**
   * Razorpay transfer ids emitted for this order (1:1 with shops when
   * automated payout applies).
   */
  razorpayTransferIds?: string[];

  /**
   * Whether the shopkeeper share has been transferred to the linked account.
   */
  razorpayPayoutStatus?: RazorpayPayoutStatus;
}


/* =========================================================
 * ORDER
 *
 * Firestore:
 * orders/{orderId}
 * ======================================================= */

export interface Order {
  id: string;

  /**
   * Firebase Auth UID of customer.
   */
  customerId?: string;

  customerName: string;

  customerPhone: string;

  /**
   * Shop receiving the order.
   */
  shopId: string;

  /**
   * Snapshot of shop name at order time.
   *
   * Useful so old orders don't change if shop name changes.
   */
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

  /**
   * Delivery address.
   *
   * null for pickup orders.
   */
  address: Address | null;

  price: PriceBreakdown;

  payment?: OrderPayment;

  paymentMethod: PaymentMethod;

  amountPaid: number;

  balance: number;

  paymentStatus: PaymentStatus;

  /**
   * Razorpay Order id created for this order's online payment.
   * Set server-side only.
   */
  razorpayOrderId?: string;

  /**
   * Razorpay Payment id returned after the customer completes checkout.
   * Set server-side only.
   */
  razorpayPaymentId?: string;

  /**
   * Razorpay signature verified during server-side payment confirmation.
   * Set server-side only.
   */
  razorpaySignature?: string;

  /**
   * Journey of funds from the platform account to the shop's linked account
   * once the order is captured.
   */
  settlementStatus?: RazorpaySettlementStatus;

  /**
   * Razorpay transfer ids emitted for this order (1:1 with shops when
   * automated payout applies).
   */
  razorpayTransferIds?: string[];

  /**
   * Whether the shopkeeper share has been transferred to the linked account.
   */
  razorpayPayoutStatus?: RazorpayPayoutStatus;

  status: OrderStatus;

  createdAt: string;

  updatedAt: string;

  timeline: TimelineEntry[];
}


/* =========================================================
 * SUPPORT TICKET
 *
 * Firestore:
 * supportTickets/{ticketId}
 * ======================================================= */

export type SupportTicketStatus =
  | "open"
  | "resolved";

export interface SupportTicket {
  id: string;

  customerId?: string;

  subject: string;

  orderId?: string;

  category: string;

  description: string;

  createdAt: string;

  updatedAt?: string;

  status: SupportTicketStatus;
}


/* =========================================================
 * CUSTOMER PROFILE
 *
 * Kept for UI compatibility.
 *
 * Long-term, UserAccount can be the main customer source.
 * ======================================================= */

export interface CustomerProfile {
  name: string;

  email: string;

  phone: string;

  alternatePhone?: string;

  addressLine1?: string;

  addressLine2?: string;

  city?: string;

  state?: string;

  zip?: string;

  country?: string;

  /** How the customer prefers to be paid out (refunds etc.). */
  payoutMethod?: CustomerPayoutMethod;

  upiId?: string;

  upiVerified?: boolean;

  bankName?: string;

  bankAccountNumber?: string;

  bankIfsc?: string;

  bankBranch?: string;
}


/* =========================================================
 * ORDER DRAFT
 *
 * Local UI state.
 *
 * Do NOT need to store permanently in Firestore
 * unless you want cross-device draft recovery.
 * ======================================================= */

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


/* =========================================================
 * OPTIONAL: SHOPKEEPER PROFILE
 *
 * If you want additional shopkeeper-only information,
 * keep it separate from UserAccount.
 *
 * Firestore:
 * users/{uid}/profile/shopkeeper
 * ======================================================= */

export interface ShopkeeperProfile {
  accountId: string;

  username: string;

  ownerName: string;

  phone: string;

  alternatePhone?: string;
}


/* =========================================================
 * OPTIONAL: ADMIN PROFILE
 * ======================================================= */

export interface AdminProfile {
  accountId: string;

  name: string;

  email: string;
}


/* =========================================================
 * FIRESTORE DOCUMENT HELPERS
 *
 * Useful when creating/updating documents.
 * ======================================================= */

export interface FirestoreTimestamps {
  createdAt: string;

  updatedAt: string;
}


/* =========================================================
 * ORDER CREATION INPUT
 *
 * Useful for separating "what user submits"
 * from the final Order stored in Firestore.
 * ======================================================= */

export interface CreateOrderInput {
  customerId: string;

  customerName: string;

  customerPhone: string;

  shopId: string;

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

  payment: OrderPayment;
}


/* =========================================================
 * SHOP CREATION INPUT
 * ======================================================= */

export interface CreateShopInput {
  ownerId: string;

  name: string;

  ownerName: string;

  phone: string;

  whatsappNumber?: string;

  email: string;

  address: string;

  area: string;

  city: string;

  state: string;

  pincode: string;

  description?: string;

  prepMinutes: number;

  pickup: boolean;

  paperTypes: PaperType[];

  printTypes: {
    bw: boolean;
    color: boolean;
  };

  printSides: {
    single: boolean;
    double: boolean;
  };

  orientation: {
    portrait: boolean;
    landscape: boolean;
  };

  binding: ServiceOption[];

  additional: ServiceOption[];

  delivery: DeliverySettings;

  payments: PaymentSettings;

  openingTime?: string;

  closingTime?: string;

  workingDays?: string[];
}


/* =========================================================
 * REVIEW
 * ======================================================= */

export interface Review {
  id: string;

  orderId: string;

  shopId: string;

  shopName?: string;

  customerId: string;

  customerName: string;

  rating: number;

  description?: string;

  reply?: string;

  createdAt: string;

  updatedAt?: string;
}


/* =========================================================
 * NOTIFICATION
 * ======================================================= */

export type NotificationType =
  | "order_placed"
  | "order_accepted"
  | "order_rejected"
  | "order_status_changed"
  | "printing_started"
  | "printing_completed"
  | "ready_pickup"
  | "out_for_delivery"
  | "delivered"
  | "payment_update"
  | "review_received"
  | "application_approved"
  | "application_rejected"
  | "account"
  | "info";

export type NotificationRecipientRole =
  | "customer"
  | "shopkeeper"
  | "admin";

export interface Notification {
  id: string;

  recipientId: string;

  recipientRole: NotificationRecipientRole;

  type: NotificationType;

  title: string;

  message: string;

  relatedEntityId?: string;

  entityType?: "order" | "review" | "support";

  read: boolean;

  createdAt: string;
}


/* =========================================================
 * PLATFORM SETTINGS
 *
 * Firestore:
 * platform/settings
 *
 * Read by server-side checkout to decide the platform commission
 * applied to Razorpay Route transfers.
 * ======================================================= */

export interface PlatformSettings {
  /**
   * Percentage kept by the platform on every online payment.
   * e.g. 15 = 15%. The remainder is transferred to the shop.
   */
  commissionPercent?: number;

  /**
   * When false the platform always keeps a minimum ₹0.01 so Route
   * transfer amounts can never equal the captured amount.
   */
  enforceMinimumCut?: boolean;

  updatedAt?: string;
}
