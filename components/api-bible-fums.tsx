import { useEffect } from "react";
import { Platform } from "react-native";

declare global {
  interface Window {
    fumsData?: unknown[][];
    fums?: (...args: unknown[]) => void;
  }
}

let trackerRequested = false;

export function ApiBibleFumsReporter({ token, viewKey }: { token: string | null | undefined; viewKey: string }) {
  useEffect(() => {
    if (Platform.OS !== "web" || !token || typeof document === "undefined") return;

    window.fumsData = window.fumsData ?? [];
    window.fums = window.fums ?? ((...args: unknown[]) => window.fumsData?.push(args));
    if (!trackerRequested && !document.querySelector('script[data-api-bible-fums="v3"]')) {
      const script = document.createElement("script");
      script.src = "https://pkg.api.bible/fumsV3.min.js";
      script.async = true;
      script.dataset.apiBibleFums = "v3";
      document.head.appendChild(script);
      trackerRequested = true;
    }
    window.fums("trackView", token);
  }, [token, viewKey]);

  return null;
}
