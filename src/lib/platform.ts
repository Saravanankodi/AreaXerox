import { useEffect, useState } from "react";

export type AppPlatform = "web" | "desktop-app" | "mobile-app";

function detectPlatform(): AppPlatform {
  if (typeof window === "undefined") return "web";
  const nativeWindow = window as Window & {
    electronAPI?: unknown;
    __TAURI_INTERNALS__?: unknown;
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  };
  if (nativeWindow.electronAPI || nativeWindow.__TAURI_INTERNALS__ || /Electron/i.test(navigator.userAgent)) return "desktop-app";
  // A phone browser is still the web experience. Only a native container changes product content.
  if (nativeWindow.Capacitor?.isNativePlatform?.()) return "mobile-app";
  return "web";
}

/** The single environment signal for app-vs-web content; viewport remains a separate concern. */
export function useAppPlatform() {
  const [platform, setPlatform] = useState<AppPlatform>("web");
  useEffect(() => setPlatform(detectPlatform()), []);
  return platform;
}
