import type { MetadataRoute } from "next";

/**
 * PWA manifest.
 *
 * Required for iOS: Safari only delivers Web Push to a site that has been
 * added to the home screen, and that install is only offered for a real
 * manifest. Without this, push simply never works on iPhone.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XEROXMATE — Order My Xerox",
    short_name: "XEROXMATE",
    description:
      "Upload documents, get them printed, and track your order from pickup to delivery.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0b1220",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Inset on an opaque background so Android's circular/shape mask
        // cannot clip the mark.
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
