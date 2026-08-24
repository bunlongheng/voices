import { NextResponse, type NextRequest } from "next/server";

// Per-request nonce CSP. A fresh nonce is minted for every request and put on
// both the request headers (so Next tags its own scripts with it) and the
// response CSP. With 'strict-dynamic' the browser ignores 'unsafe-inline', so
// only nonce'd scripts run - the inline theme snippet in layout.tsx reads the
// same nonce via headers(). style-src keeps 'unsafe-inline' because the UI is
// styled with inline styles (no external stylesheet to nonce).
export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "media-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "connect-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("content-security-policy", csp);
  return res;
}

// Run on documents only; skip static assets and API/audio (their own routes).
export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|audio|icon.png|apple-icon.png|favicon.ico|.*\\.(?:png|json|mp3|webmanifest)).*)",
    },
  ],
};
