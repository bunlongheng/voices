import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://voices-bheng.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Voices",
  description:
    "A voice playground. Load your own voices, type any text, and hear them speak - compare tone, pacing, and delivery side by side.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Voices - your text-to-speech playground",
    description:
      "Load your own voices, type any text, and hear them read it aloud. Compare tone, pacing, and delivery, then save the takes you like.",
    siteName: "Voices",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voices - your text-to-speech playground",
    description:
      "Load your own voices, type any text, and hear them read it aloud. Compare tone, pacing, and delivery, then save the takes you like.",
  },
  appleWebApp: { capable: true, title: "Voices", statusBarStyle: "black-translucent" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#323437",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* set the theme before paint so there's no light/dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('voices-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
