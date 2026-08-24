import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the native DB so the route never opens sqlite, and the synth so no
// network call is made. We assert the route's control flow: auth, validation,
// the happy path (201 + has_audio), and provider failure (502, generic error).
// hoisted so the (hoisted) vi.mock factories can reference these fns safely
const m = vi.hoisted(() => {
  const run = vi.fn(() => ({ lastInsertRowid: 7 }));
  const prepare = vi.fn(() => ({ run, all: () => [], get: () => undefined }));
  const synthesize = vi.fn();
  return { run, prepare, synthesize };
});
vi.mock("@/lib/db", () => ({ default: { prepare: m.prepare }, __esModule: true }));
vi.mock("@/lib/audio", () => ({ audioPath: (id: number) => `/tmp/${id}.mp3` }));
vi.mock("@/lib/manifest", () => ({ writeManifest: vi.fn() }));
vi.mock("fs", () => ({ writeFileSync: vi.fn() }));
vi.mock("@/lib/elevenlabs", async () => {
  const real = await vi.importActual<typeof import("@/lib/elevenlabs")>("@/lib/elevenlabs");
  return { ...real, synthesize: m.synthesize };
});
const { run, synthesize } = m;

import { POST } from "@/app/api/takes/route";
import { _reset } from "@/lib/rate-limit";

function post(body: unknown, headers: Record<string, string> = {}) {
  return {
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  } as never;
}

describe("POST /api/takes", () => {
  beforeEach(() => {
    _reset();
    run.mockClear();
    synthesize.mockReset();
    delete process.env.VOICES_TOKEN;
    vi.unstubAllEnvs(); // not production -> localhost is allowed
  });

  it("401 when unauthorized (production, no token)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await POST(post({ text: "hi" }, { host: "voices.example.com" }));
    expect(res.status).toBe(401);
  });

  it("400 when text is missing", async () => {
    const res = await POST(post({ text: "  " }, { host: "localhost" }));
    expect(res.status).toBe(400);
  });

  it("201 with has_audio on success", async () => {
    synthesize.mockResolvedValue({ audio: Buffer.from("x"), duration: 3 });
    const res = await POST(post({ text: "hello there" }, { host: "localhost" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ id: 7, has_audio: 1, duration_sec: 3 });
  });

  it("502 with a generic error (no provider detail leaked) on synth failure", async () => {
    synthesize.mockRejectedValue(new Error("ElevenLabs 401: secret-detail"));
    const res = await POST(post({ text: "hello" }, { host: "localhost" }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.has_audio).toBe(0);
    expect(body.error).toBe("synthesis failed");
    expect(JSON.stringify(body)).not.toContain("secret-detail");
  });

  it("429 once the per-caller rate limit is exceeded", async () => {
    synthesize.mockResolvedValue({ audio: Buffer.from("x"), duration: 1 });
    let last = 0;
    for (let i = 0; i < 14; i++) {
      const res = await POST(post({ text: "hi" }, { host: "localhost", "x-forwarded-for": "9.9.9.9" }));
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
