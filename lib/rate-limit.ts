import type { NextRequest } from "next/server";

// Tiny in-memory fixed-window limiter. Synthesis is expensive (an ElevenLabs
// call per request), so cap how often one caller can trigger it. In-memory is
// per-instance, which is fine here: local dev is one process, and the deploy is
// read-only so writes never reach this path in production.
const WINDOW_MS = 60_000;
const MAX_HITS = 12; // syntheses per minute per caller
const hits = new Map<string, { count: number; resetAt: number }>();

export function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : "") || req.headers.get("x-real-ip") || "local";
}

// Returns true when the caller is still within budget (and records the hit).
export function allow(key: string, now = Date.now()): boolean {
  const e = hits.get(key);
  if (!e || now >= e.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (e.count >= MAX_HITS) return false;
  e.count++;
  return true;
}

// Exposed for tests so the window doesn't leak between cases.
export function _reset(): void {
  hits.clear();
}
