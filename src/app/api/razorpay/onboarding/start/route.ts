import type { NextRequest } from "next/server";

import type { RazorpayRequirement } from "@/types";
import type { Accounts } from "razorpay/dist/types/accounts";
import type { Stakeholders } from "razorpay/dist/types/stakeholders";
import type { Products } from "razorpay/dist/types/products";

import {
  getRazorpay,
  mapActivationStatus,
  toRequirements,
} from "@/lib/razorpay/server";
import { describeRazorpayError, razorpayErrorStatus } from "@/lib/razorpay/errors";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/* =========================================================
 * LOCAL SDK RESPONSE SHAPES
 * ======================================================= */

type RzpAccount = Pick<Accounts.RazorpayAccount, "id">;
type RzpStakeholder = Pick<Stakeholders.RazorpayStakeholder, "id">;
interface RzpProduct {
  id: string;
  activation_status?: string;
  requirements?: { field_reference?: string; reason_code?: string; status?: string }[];
}

/* =========================================================
 * PAYLOAD TYPES
 * ======================================================= */

interface OnboardingAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

interface OnboardingOwner {
  name: string;
  email: string;
  pan: string;
  phone?: string;
}

interface OnboardingSettlement {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
}

interface StartOnboardingBody {
  shopId: string;
  email: string;
  phone: string;
  contactName: string;
  legalBusinessName: string;
  customerFacingBusinessName?: string;
  businessType: string;
  category: string;
  subcategory: string;
  address: OnboardingAddress;
  pan?: string;
  gst?: string;
  owner: OnboardingOwner;
  settlement?: OnboardingSettlement;
}

interface ShopSnap {
  id: string;
  ownerAccountId?: string;
  ownerId?: string;
  razorpayAccountId?: string;
  razorpayStakeholderId?: string;
  razorpayProductId?: string;
  razorpayOnboardingStatus?: string;
  payoutEnabled?: boolean;
}

async function readShop(shopId: string): Promise<ShopSnap | null> {
  const snapshot = await getAdminFirestore().collection("shops").doc(shopId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...(snapshot.data() as Record<string, unknown>) } as unknown as ShopSnap;
}

async function patchShop(shopId: string, patch: Record<string, unknown>) {
  await getAdminFirestore()
    .collection("shops")
    .doc(shopId)
    .set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const user = await verifyFirebaseIdToken(token);

    let body: StartOnboardingBody;
    try {
      body = (await request.json()) as StartOnboardingBody;
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body.shopId || !body.email || !body.phone || !body.contactName) {
      return Response.json(
        { error: "shopId, email, phone and contactName are required." },
        { status: 400 }
      );
    }

    const required: [string, unknown][] = [
      ["legalBusinessName", body.legalBusinessName],
      ["businessType", body.businessType],
      ["category", body.category],
      ["subcategory", body.subcategory],
      ["address.street1", body.address?.street1],
      ["address.city", body.address?.city],
      ["address.state", body.address?.state],
      ["address.postalCode", body.address?.postalCode],
      ["owner.name", body.owner?.name],
    ];
    const missing = required
      .filter(([, v]) => typeof v !== "string" || !v.trim())
      .map(([k]) => k);
    if (missing.length) {
      return Response.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const shop = await readShop(body.shopId);
    if (!shop) {
      return Response.json({ error: "Shop not found." }, { status: 404 });
    }
    const isOwner =
      shop.ownerAccountId === user.uid || shop.ownerId === user.uid || user.role === "admin";
    if (!isOwner) {
      return Response.json({ error: "You do not own this shop." }, { status: 403 });
    }

    // Already fully onboarded — nothing more to do.
    if (shop.razorpayOnboardingStatus === "activated" && shop.payoutEnabled) {
      return Response.json({
        shopId: shop.id,
        accountId: shop.razorpayAccountId,
        productId: shop.razorpayProductId,
        onboardingStatus: "activated",
        payoutEnabled: true,
        requirements: [],
      });
    }

    const razorpay = getRazorpay();

    /* -----------------------------------------------------
     * 1. LINKED ACCOUNT
     * --------------------------------------------------- */
    let accountId = shop.razorpayAccountId;
    if (!accountId) {
      const country = (body.address.country ?? "IN").trim() || "IN";
      const account = (await razorpay.accounts.create({
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        type: "route",
        reference_id: body.shopId.slice(0, 30),
        legal_business_name: body.legalBusinessName.trim(),
        customer_facing_business_name:
          body.customerFacingBusinessName?.trim() || body.legalBusinessName.trim(),
        business_type: body.businessType.trim(),
        contact_name: body.contactName.trim(),
        profile: {
          category: body.category.trim(),
          subcategory: body.subcategory.trim(),
          business_model: `Print & copy shop on ${process.env.NEXT_PUBLIC_APP_NAME ?? "XEROXMATE"}`,
          addresses: {
            registered: {
              street1: body.address.street1.trim(),
              street2: body.address.street2?.trim() ?? "",
              city: body.address.city.trim(),
              state: body.address.state.trim(),
              postal_code: body.address.postalCode.trim(),
              country,
            },
          },
        },
        legal_info: {
          ...(body.pan?.trim() ? { pan: body.pan.trim().toUpperCase() } : {}),
          ...(body.gst?.trim() ? { gst: body.gst.trim().toUpperCase() } : {}),
        },
        notes: { platform: "xeroxmate", shop: body.shopId },
      } as unknown as Accounts.RazorpayAccountCreateRequestBody)) as RzpAccount;

      accountId = account.id;
      await patchShop(shop.id, {
        razorpayAccountId: accountId,
        razorpayOnboardingStatus: "processing",
        updatedAt: new Date().toISOString(),
      });
    }

    /* -----------------------------------------------------
     * 2. STAKEHOLDER (OWNER KYC / PAN)
     * --------------------------------------------------- */
    let stakeholderId = shop.razorpayStakeholderId;
    if (!stakeholderId && body.owner?.pan?.trim()) {
      const stakeholder = (await razorpay.stakeholders.create(accountId, {
        name: body.owner.name.trim(),
        email: (body.owner.email ?? body.email).trim().toLowerCase(),
        percentage_ownership: 100,
        relationship: { director: true, executive: true },
        phone: {
          primary: (body.owner.phone ?? body.phone).trim().slice(0, 10),
        },
        kyc: { pan: body.owner.pan.trim().toUpperCase() },
        addresses: {
          residential: {
            street: [body.address.street1, body.address.street2].filter(Boolean).join(", "),
            city: body.address.city.trim(),
            state: body.address.state.trim(),
            postal_code: body.address.postalCode.trim(),
            country: (body.address.country ?? "IN").trim() || "IN",
          },
        },
        notes: { platform: "xeroxmate", shop: body.shopId },
      } as unknown as Stakeholders.RazorpayStakeholderCreateRequestBody)) as RzpStakeholder;

      stakeholderId = stakeholder.id;
      await patchShop(shop.id, { razorpayStakeholderId: stakeholderId });
    }

    /* -----------------------------------------------------
     * 3. PRODUCT CONFIGURATION (route)
     * --------------------------------------------------- */
    let productId = shop.razorpayProductId;
    if (!productId) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

      const product = (await razorpay.products.requestProductConfiguration(accountId as string, {
        product_name: "route",
        tnc_accepted: true,
        ...(ip ? { ip } : {}),
      } as unknown as Products.RazorpayProductCreateRequestBody)) as RzpProduct;

      productId = product.id;
      await patchShop(shop.id, { razorpayProductId: productId });
    }

    /* -----------------------------------------------------
     * 4. BANK KYC → ACTIVATE (patch settlements)
     * --------------------------------------------------- */
    let product = (await razorpay.products
      .fetch(accountId as string, productId as string)
      .then((p) => p as unknown as RzpProduct)
      .catch(() => null)) as RzpProduct | null;
    if (product?.activation_status !== "activated" && body.settlement) {
      const settlements = {
        beneficiary_name: body.settlement.beneficiaryName.trim(),
        account_number: body.settlement.accountNumber.trim(),
        ifsc_code: body.settlement.ifscCode.trim().toUpperCase(),
      };
      product = (await razorpay.products.edit(accountId as string, productId as string, {
        ...settlements,
        tnc_accepted: true,
      } as unknown as Products.RazorpayProductUpdateRequestBody)) as RzpProduct;
    }

    const status = mapActivationStatus(product?.activation_status);
    const requirements: RazorpayRequirement[] = toRequirements(product?.requirements);
    const payoutEnabled = status === "activated";

    await patchShop(shop.id, {
      razorpayOnboardingStatus: status,
      payoutEnabled,
      razorpayRequirements: requirements,
      updatedAt: new Date().toISOString(),
    });

    return Response.json({
      shopId: shop.id,
      accountId,
      stakeholderId: stakeholderId ?? null,
      productId,
      onboardingStatus: status,
      payoutEnabled,
      requirements,
    });
  } catch (error: unknown) {
    console.error("Razorpay onboarding/start error:", error);

    return Response.json(
      {
        error: describeRazorpayError("Onboarding failed. Check your details and try again.", error),
      },
      { status: razorpayErrorStatus(error) }
    );
  }
}