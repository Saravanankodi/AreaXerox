import type { NextRequest } from "next/server";
import { fetchCashfreeVendor } from "@/lib/cashfree/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") ?? "";
        const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

        const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
        if (!shopId) {
            return Response.json({ error: "Missing shopId parameter." }, { status: 400 });
        }

        const db = getAdminFirestore();
        const shopRef = db.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();

        if (!shopSnap.exists) {
            return Response.json({ error: "Shop not found." }, { status: 404 });
        }

        const shopData = shopSnap.data() as {
            ownerId?: string;
            ownerAccountId?: string;
            cashfreeVendorId?: string;
            payoutEnabled?: boolean;
            cashfreeOnboardingStatus?: string;
        };

        const isOwner =
            shopData.ownerId === user.uid ||
            shopData.ownerAccountId === user.uid ||
            user.role === "admin";

        if (!isOwner) {
            return Response.json(
                { error: "You do not have permission to view payout status for this shop." },
                { status: 403 }
            );
        }

        if (!shopData.cashfreeVendorId) {
            return Response.json({
                shopId,
                onboardingStatus: "not_started",
                payoutEnabled: false,
            });
        }

        let isActivated = shopData.payoutEnabled ?? true;
        let onboardingStatus = shopData.cashfreeOnboardingStatus ?? "activated";
        let vendorStatus = isActivated ? "ACTIVE" : "PROCESSING";

        try {
            const vendor = await fetchCashfreeVendor(shopData.cashfreeVendorId);
            isActivated = vendor.status === "ACTIVE";
            onboardingStatus = isActivated ? "activated" : "processing";
            vendorStatus = vendor.status;

            if (
                shopData.payoutEnabled !== isActivated ||
                shopData.cashfreeOnboardingStatus !== onboardingStatus
            ) {
                await shopRef.set(
                    {
                        payoutEnabled: isActivated,
                        cashfreeOnboardingStatus: onboardingStatus,
                        updatedAt: new Date().toISOString(),
                    },
                    { merge: true }
                );
            }
        } catch (apiError) {
            console.warn("Cashfree vendor status fetch failed, using stored Firestore status:", apiError);
        }

        return Response.json({
            shopId,
            vendorId: shopData.cashfreeVendorId,
            status: vendorStatus,
            onboardingStatus,
            payoutEnabled: isActivated,
        });
    } catch (error: unknown) {
        console.error("Cashfree onboarding status error:", error);
        const msg = error instanceof Error ? error.message : "Could not fetch onboarding status.";
        return Response.json({ error: msg }, { status: 400 });
    }
}
