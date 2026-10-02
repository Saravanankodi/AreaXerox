import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { registerPushToken } from "@/lib/firebase/push-tokens";

export const runtime = "nodejs";

/**
 * Registers this device's FCM token against the verified user.
 *
 * The token is taken from the request body but the *identity* is not: the
 * recipient is always the verified caller, so a client cannot attach a token to
 * another account.
 */

function bad(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

    let body: { token?: string; platform?: string; userAgent?: string };
    try {
      body = (await request.json()) as { token?: string; platform?: string; userAgent?: string };
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const token = body.token?.trim();
    if (!token) return bad("Missing token.", 400);

    // FCM registration tokens are long opaque strings; anything wildly outside
    // that range is a bug or an attempt to fill the collection.
    if (token.length < 20 || token.length > 4096) {
      return bad("Malformed token.", 400);
    }

    await registerPushToken({
      uid: user.uid,
      token,
      platform: body.platform?.slice(0, 64),
      // Truncated: the header can be long and is stored for diagnostics only.
      userAgent: body.userAgent?.slice(0, 256),
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    if (/token|unauthenticated|credential|permission/i.test(message)) {
      return bad(message, 401);
    }
    console.error("Push subscribe failed:", error);
    return bad("Could not register this device for notifications.", 500);
  }
}
