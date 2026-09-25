import type { NextRequest } from "next/server";
import { createOrUpdateCashfreeVendor } from "@/lib/cashfree/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface CashfreeOnboardingInput {
    shopId: string;
    email: string;
    phone: string;
    contactName?: string;
    legalBusinessName?: string;
    pan?: string;
    bankAccountNumber: string;
    bankIfsc: string;
    accountHolder?: string;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") ?? "";
        const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

        let body: CashfreeOnboardingInput;
        try {
            body = (await request.json()) as CashfreeOnboardingInput;
        } catch {
            return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const {
            shopId,
            email,
            phone,
            contactName,
            legalBusinessName,
            pan,
            bankAccountNumber,
            bankIfsc,
            accountHolder,
        } = body;

        if (!shopId || !email || !phone || !bankAccountNumber || !bankIfsc) {
            return Response.json(
                { error: "Missing required fields: shopId, email, phone, bankAccountNumber, bankIfsc." },
                { status: 400 }
            );
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
            name?: string;
        };

        const isOwner =
            shopData.ownerId === user.uid ||
            shopData.ownerAccountId === user.uid ||
            user.role === "admin";

        if (!isOwner) {
            return Response.json(
                { error: "You do not have permission to manage payouts for this shop." },
                { status: 403 }
            );
        }

        // Cashfree Vendor ID for shop
        const vendorId = `VND_${shopId.replace(/[^a-zA-Z0-9_-]/g, "_")}`.slice(0, 45);

        const vendor = await createOrUpdateCashfreeVendor({
            vendorId,
            name: legalBusinessName?.trim() || shopData.name || "Xerox Shop",
            email: email.trim(),
            phone: phone.trim(),
            bankDetails: {
                accountNumber: bankAccountNumber.trim(),
                ifsc: bankIfsc.trim().toUpperCase(),
                accountHolder: accountHolder?.trim() || contactName?.trim() || shopData.name || "Shop Owner",
            },
            kycDetails: {
                pan: pan?.trim(),
            },
        });

        const isActivated = vendor.status === "ACTIVE";
        const onboardingStatus = isActivated ? "activated" : "processing";

        const patch: Record<string, unknown> = {
            cashfreeVendorId: vendor.vendor_id,
            cashfreeOnboardingStatus: onboardingStatus,
            payoutEnabled: isActivated,
            bankName: bankIfsc.slice(0, 4).toUpperCase(),
            bankAccountNumber: bankAccountNumber.trim(),
            bankIfsc: bankIfsc.trim().toUpperCase(),
            updatedAt: new Date().toISOString(),
        };

        await shopRef.set(patch, { merge: true });

        return Response.json({
            shopId,
            vendorId: vendor.vendor_id,
            status: vendor.status,
            onboardingStatus,
            payoutEnabled: isActivated,
        });
    } catch (error: unknown) {
        console.error("Cashfree onboarding start error:", error);
        const msg = error instanceof Error ? error.message : "Vendor onboarding failed.";
        return Response.json({ error: msg }, { status: 500 });
    }
}
