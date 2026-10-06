import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  WalletError,
  completeOrderAndCreditWallet,
} from "@/lib/wallet/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const header =
      request.headers.get("authorization") ?? "";

    const token = header.replace(
      /^Bearer\s+/i,
      "",
    );

    const user =
      await verifyFirebaseIdToken(token);

    const payload = await request.json();

    const orderId =
      typeof payload.orderId === "string"
        ? payload.orderId.trim()
        : "";

    if (!orderId) {
      return Response.json(
        { error: "An order is required." },
        { status: 400 },
      );
    }

    const result =
      await completeOrderAndCreditWallet({
        orderId,
        uid: user.uid,
      });

    return Response.json(result);
  } catch (error) {
    if (error instanceof WalletError) {
      return Response.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error.";

    if (
      /token|unauthenticated|credential|permission/i.test(
        message,
      )
    ) {
      return Response.json(
        { error: message },
        { status: 401 },
      );
    }

    console.error(
      "Order completion failed:",
      error,
    );

    return Response.json(
      { error: "Could not complete order." },
      { status: 500 },
    );
  }
}
