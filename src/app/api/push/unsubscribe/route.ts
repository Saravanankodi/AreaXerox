import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { deletePushToken } from "@/lib/firebase/push-tokens";

export const runtime = "nodejs";

/**
 * Removes this device's FCM token.
 *
 * Scoped to the verified user, so a caller can only ever delete their own token.
 * Deleting an absent token succeeds — opting out should be idempotent.
 */

function bad(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

    let body: { token?: string };
    try {
      body = (await request.json()) as { token?: string };
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const token = body.token?.trim();
    if (!token) return bad("Missing token.", 400);

    await deletePushToken(user.uid, token);

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    if (/token|unauthenticated|credential|permission/i.test(message)) {
      return bad(message, 401);
    }
    console.error("Push unsubscribe failed:", error);
    return bad("Could not disable notifications for this device.", 500);
  }
}
