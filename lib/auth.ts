import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

// Constant-time string compare so a bearer-token check can't be timed.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Writing routes (POST/DELETE) are allowed from localhost/LAN without a token
// (the owner runs the playground locally). From anywhere else a bearer token is
// required. If VOICES_TOKEN is unset, only local/private-network callers pass.
//
// In production we NEVER trust the Host header (it is attacker-controlled and a
// serverless deploy is read-only), so a write there requires a configured token
// and a matching bearer - the LAN allowance applies to local dev only.
export function authorized(req: NextRequest): boolean {
  const token = process.env.VOICES_TOKEN;
  const auth = req.headers.get("authorization") || "";
  if (token && auth.startsWith("Bearer ") && safeEqual(auth.slice(7), token)) return true;

  // Production: no Host-based trust. Only a valid token (handled above) passes.
  if (process.env.NODE_ENV === "production") return false;

  const host = (req.headers.get("host") || "").split(":")[0];
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  // Dev with no token configured: allow local/LAN. With a token configured,
  // remote callers must present it (handled above).
  return token ? false : isLocal;
}
