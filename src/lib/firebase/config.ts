import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/*
 * A demo project silently swallows every sign-in behind an opaque
 * auth/operation-not-allowed, so a missing variable must fail loudly here.
 */
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Firebase is not configured: ${missingKeys.join(", ")} missing. Add the NEXT_PUBLIC_FIREBASE_* variables to .env.local and to your hosting environment.`,
  );
}

// Prevent re-initialising the app on hot-reload in Next.js dev mode
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
