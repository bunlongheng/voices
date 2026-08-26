import type { Metadata, Viewport } from "next";
import "./globals.css";
import SwRegister from "./sw-register";

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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // opt into dynamic rendering so the per-request CSP nonce (middleware.ts)
  // is applied to Next's scripts; no theme script to nonce ourselves anymore.
  await headersForNonce();
  return (
    <html lang="en">
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}

async function headersForNonce() {
  const { headers } = await import("next/headers");
  await headers();
}
