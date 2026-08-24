import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { authorized } from "@/lib/auth";

// Minimal NextRequest stand-in: authorized() only reads headers.
function req(headers: Record<string, string>) {
  return { headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } } as never;
}

describe("authorized", () => {
  const saved = { token: process.env.VOICES_TOKEN };
  beforeEach(() => {
    delete process.env.VOICES_TOKEN;
  });
  afterEach(() => {
    if (saved.token === undefined) delete process.env.VOICES_TOKEN;
    else process.env.VOICES_TOKEN = saved.token;
    vi.unstubAllEnvs();
  });

  it("allows localhost when no token is set", () => {
    expect(authorized(req({ host: "localhost:3037" }))).toBe(true);
    expect(authorized(req({ host: "127.0.0.1" }))).toBe(true);
  });

  it("allows private LAN ranges when no token is set", () => {
    expect(authorized(req({ host: "192.168.1.10" }))).toBe(true);
    expect(authorized(req({ host: "10.0.0.5" }))).toBe(true);
    expect(authorized(req({ host: "172.16.0.9" }))).toBe(true);
    expect(authorized(req({ host: "mac.local" }))).toBe(true);
  });

  it("denies public hosts when no token is set", () => {
    expect(authorized(req({ host: "voices-bheng.vercel.app" }))).toBe(false);
    expect(authorized(req({ host: "8.8.8.8" }))).toBe(false);
  });

  it("requires the bearer token when one is configured", () => {
    process.env.VOICES_TOKEN = "secret";
    expect(authorized(req({ host: "localhost" }))).toBe(false); // local no longer free-passes
    expect(authorized(req({ host: "example.com", authorization: "Bearer secret" }))).toBe(true);
    expect(authorized(req({ host: "example.com", authorization: "Bearer wrong" }))).toBe(false);
    expect(authorized(req({ host: "example.com", authorization: "Bearer secre" }))).toBe(false); // length mismatch
  });

  it("never trusts the Host header in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    // no token: even localhost is denied in prod (deploy is read-only)
    expect(authorized(req({ host: "localhost" }))).toBe(false);
    expect(authorized(req({ host: "192.168.1.10" }))).toBe(false);
    // only a configured + matching token passes
    process.env.VOICES_TOKEN = "secret";
    expect(authorized(req({ host: "localhost" }))).toBe(false);
    expect(authorized(req({ host: "voices.example.com", authorization: "Bearer secret" }))).toBe(true);
  });
});
