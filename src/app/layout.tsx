import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XEROXMATE",
  description: "Your digital printing partner. Upload, configure, and track print orders.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    // iOS only delivers Web Push to a site that has been added to the home
    // screen, and it only offers that install for an app with this metadata.
    capable: true,
    title: "XEROXMATE",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
      <GoogleAnalytics gaId="G-2F260LW5XG" />
    </html>
  );
}
