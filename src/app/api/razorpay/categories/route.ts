import type { NextRequest } from "next/server";

import { razorpayApiFetch } from "@/lib/razorpay/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CategoryConfig {
  category: string;
  subcategories?: string[];
}

/** Fetches valid category/subcategory values from Razorpay's categories-config. */
async function fetchCategories(accountType = "route"): Promise<CategoryConfig[]> {
  try {
    const data = await razorpayApiFetch<{
      entity: { configurations?: { category: string; subcategories?: string[] }[] };
    }>(`/v2/categories-config?account_type=${encodeURIComponent(accountType)}`);

    const configurations = data?.entity?.configurations ?? [];
    return configurations
      .filter((c) => c && typeof c.category === "string")
      .map((c) => ({
        category: c.category,
        subcategories: Array.isArray(c.subcategories)
          ? c.subcategories.filter((s): s is string => typeof s === "string")
          : [],
      }));
  } catch {
    return [];
  }
}

const FALLBACK_CATEGORIES: CategoryConfig[] = [
  { category: "retail", subcategories: ["printing and stationery", "retail stores"] },
  { category: "professional_services", subcategories: ["printing and stationery"] },
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

    // Warm the categories into the platform doc for offline caching.
    const categories = await fetchCategories("route");
    try {
      await getAdminFirestore()
        .collection("platform")
        .doc("settings")
        .set(
          { razorpayCategories: categories, updatedAt: new Date().toISOString() },
          { merge: true }
        );
    } catch {
      // Non-fatal: caching is best-effort.
    }

    return Response.json({ categories: categories.length ? categories : FALLBACK_CATEGORIES });
  } catch (error: unknown) {
    console.error("Razorpay categories error:", error);
    return Response.json(
      { error: "Could not load business categories." },
      { status: 500 }
    );
  }
}