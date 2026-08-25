import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://voices-bheng.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Voices",
  description:
    "A voice library. Every text-to-speech take is a tappable circle, labelled by its voice - tap to play and compare voices at a glance.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Voices - a text-to-speech voice library",
    description:
      "Every voice take is a tappable circle - tap to play, watch the ring fill, and compare voices at a glance.",
    siteName: "Voices",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voices - a text-to-speech voice library",
    description:
      "Every voice take is a tappable circle - tap to play, watch the ring fill, and compare voices at a glance.",
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* set the theme before paint so there's no light/dark flash */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('voices-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
