import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voices",
    short_name: "Voices",
    description: "A voice library - tap a circle to hear each voice.",
    start_url: "/",
    display: "standalone",
    background_color: "#323437",
    theme_color: "#323437",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
