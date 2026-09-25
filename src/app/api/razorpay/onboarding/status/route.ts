import type { NextRequest } from "next/server";

import { getRazorpay, mapActivationStatus, toRequirements } from "@/lib/razorpay/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface ShopSnap {
  id: string;
  ownerAccountId?: string;
  ownerId?: string;
  razorpayAccountId?: string;
  razorpayProductId?: string;
  razorpayOnboardingStatus?: string;
  payoutEnabled?: boolean;
}

async function readShop(shopId: string): Promise<ShopSnap | null> {
  const snapshot = await getAdminFirestore().collection("shops").doc(shopId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...(snapshot.data() as Record<string, unknown>) } as unknown as ShopSnap;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

    const shopId = request.nextUrl.searchParams.get("shopId");
    if (!shopId) {
      return Response.json({ error: "Missing shopId query parameter." }, { status: 400 });
    }

    const shop = await readShop(shopId);
    if (!shop) {
      return Response.json({ error: "Shop not found." }, { status: 404 });
    }
    const isOwner =
      shop.ownerAccountId === user.uid || shop.ownerId === user.uid || user.role === "admin";
    if (!isOwner) {
      return Response.json({ error: "You do not own this shop." }, { status: 403 });
    }

    // Nothing onboarded yet.
    if (!shop.razorpayAccountId) {
      return Response.json({
        shopId: shop.id,
        accountId: null,
        productId: null,
        onboardingStatus: "not_started",
        payoutEnabled: false,
        requirements: [],
      });
    }

    // Pull fresh state from Razorpay (account + product activation).
    let accountId = shop.razorpayAccountId;
    let productId = shop.razorpayProductId;
    let activationStatus: string | undefined;
    let rawRequirements: { field_reference?: string; reason_code?: string; status?: string }[] = [];

    try {
      const razorpay = getRazorpay();
      const account = await razorpay.accounts.fetch(shop.razorpayAccountId).catch(() => null);
      if (account) accountId = account.id;

      if (productId) {
        const product = await razorpay.products
          .fetch(shop.razorpayAccountId, productId)
          .catch(() => null);
        if (product) {
          productId = product.id;
          activationStatus = product.activation_status;
          rawRequirements = product.requirements ?? [];
        }
      }
    } catch {
      // If the live fetch fails we still mirror whatever the shop doc holds.
    }

    const onboardingStatus = activationStatus
      ? mapActivationStatus(activationStatus)
      : (shop.razorpayOnboardingStatus as
          | "not_started"
          | "processing"
          | "under_review"
          | "needs_clarification"
          | "activated"
          | "failed");
    const requirements = toRequirements(rawRequirements);

    const payoutEnabled = onboardingStatus === "activated";

    await getAdminFirestore()
      .collection("shops")
      .doc(shop.id)
      .set(
        {
          razorpayOnboardingStatus: onboardingStatus,
          payoutEnabled,
          razorpayRequirements: requirements,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return Response.json({
      shopId: shop.id,
      accountId,
      productId: productId ?? null,
      onboardingStatus,
      payoutEnabled,
      requirements,
    });
  } catch (error: unknown) {
    console.error("Razorpay onboarding/status error:", error);
    return Response.json(
      { error: "Could not fetch Razorpay onboarding status." },
      { status: 500 }
    );
  }
}