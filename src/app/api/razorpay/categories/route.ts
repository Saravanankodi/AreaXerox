import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { RAZORPAY_CATEGORIES } from "@/lib/razorpay/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

    // Razorpay's categories-config endpoint (used previously) returns 404, so the
    // curated static list is the single source of truth for valid category/subcategory pairs.
    return Response.json({ categories: RAZORPAY_CATEGORIES });
  } catch (error: unknown) {
    console.error("Razorpay categories error:", error);
    return Response.json(
      { error: "Could not load business categories." },
      { status: 500 }
    );
  }
}