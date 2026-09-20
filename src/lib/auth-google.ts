/**
 * Google authentication service boundary.
 *
 * This module provides a typed interface for Google OAuth / Sign-In.
 * In production, swap the stub implementations below with the real
 * Google Identity Services SDK (https://developers.google.com/identity/gsi/web).
 *
 * The rest of the app imports from here — never from a third-party
 * Google SDK directly — so the implementation can be swapped without
 * touching auth consumer code.
 */

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthResult {
  ok: boolean;
  user?: GoogleUser;
  error?: string;
}

let googleReady = false;

/**
 * Load the Google Identity Services script and initialise the client.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initGoogleAuth(clientId?: string): Promise<void> {
  if (googleReady) return Promise.resolve();

  return new Promise((resolve) => {
    // If the script already exists on the page, just mark ready
    if (document.getElementById("google-identity-services")) {
      googleReady = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleReady = true;
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

/**
 * Trigger the Google One Tap / popup sign-in flow.
 *
 * In demo / development mode (no real `clientId` configured) this returns
 * a simulated user so the rest of the auth flow can be exercised end-to-end.
 */
export async function signInWithGoogle(role: "customer" | "shopkeeper"): Promise<GoogleAuthResult> {
  const clientId = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_GOOGLE_CLIENT_ID;

  // ── Demo stub ──────────────────────────────────────────────
  if (!clientId) {
    const demoUser: GoogleUser = {
      sub: `google-demo-${Date.now()}`,
      email: `demo+${role}@gmail.com`,
      name: "Google User",
      picture: undefined,
    };
    return { ok: true, user: demoUser };
  }

  // ── Real implementation ────────────────────────────────────
  try {
    await initGoogleAuth(clientId);

    return await new Promise<GoogleAuthResult>((resolve) => {
      // google.accounts.id.initialize expects a callback with a JWT credential
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (!response.credential) {
            resolve({ ok: false, error: "No credential returned from Google" });
            return;
          }
          // Decode the JWT payload (header.payload.signature)
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            resolve({
              ok: true,
              user: {
                sub: payload.sub,
                email: payload.email,
                name: payload.name ?? payload.email.split("@")[0],
                picture: payload.picture,
              },
            });
          } catch {
            resolve({ ok: false, error: "Failed to decode Google credential" });
          }
        },
      });

      window.google?.accounts.id.prompt();
    });
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Declare the global `google` namespace added by the GIS script.
 * Only the subset we use is typed here.
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}
