import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes Hafeez Communication installable ("Add to home
 * screen" / Chrome install). Next serves this at /manifest.webmanifest and
 * auto-links it. Standalone display + navy theme give it a native app feel;
 * Android builds the splash screen from name + icon + background_color.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hafeez Communication",
    short_name: "Hafeez",
    description:
      "Mobile accessories, used phones & JazzCash / EasyPaisa — the Hafeez Communication shop panel.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e2a3d",
    theme_color: "#0e2a3d",
    categories: ["business", "shopping", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
