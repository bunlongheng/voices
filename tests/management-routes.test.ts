import { describe, it, expect, vi, beforeEach } from "vitest";

// Shared DB + fs mocks so the management routes never touch sqlite or disk.
const m = vi.hoisted(() => {
  const run = vi.fn();
  const get = vi.fn();
  const prepare = vi.fn(() => ({ run, get, all: () => [] }));
  return { run, get, prepare, existsSync: vi.fn(() => true), rmSync: vi.fn() };
});
vi.mock("@/lib/db", () => ({ default: { prepare: m.prepare }, __esModule: true }));
vi.mock("@/lib/audio", () => ({ audioPath: (id: number) => `/tmp/${id}.mp3` }));
vi.mock("@/lib/manifest", () => ({ writeManifest: vi.fn() }));
vi.mock("fs", () => ({ existsSync: m.existsSync, rmSync: m.rmSync }));

import { DELETE as deleteTake } from "@/app/api/takes/[id]/route";
import { POST as addVoice, GET as listVoices } from "@/app/api/voices/route";
import { DELETE as deleteVoice } from "@/app/api/voices/[id]/route";

function req(headers: Record<string, string> = {}, body?: unknown) {
  return {
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  } as never;
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  delete process.env.VOICES_TOKEN;
});

describe("DELETE /api/takes/[id]", () => {
  it("401 in production without a token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await deleteTake(req({ host: "voices.example.com" }), ctx("3"));
    expect(res.status).toBe(401);
  });

  it("404 when the take does not exist", async () => {
    m.get.mockReturnValueOnce(undefined);
    const res = await deleteTake(req({ host: "localhost" }), ctx("999"));
    expect(res.status).toBe(404);
  });

  it("200 deletes the row and its audio file", async () => {
    m.get.mockReturnValueOnce({ id: 3 });
    const res = await deleteTake(req({ host: "localhost" }), ctx("3"));
    expect(res.status).toBe(200);
    expect(m.run).toHaveBeenCalled();
    expect(m.rmSync).toHaveBeenCalledWith("/tmp/3.mp3");
  });
});

describe("/api/voices", () => {
  it("GET returns custom voices ahead of the premade set", async () => {
    m.prepare.mockReturnValueOnce({ all: () => [{ id: "c1", name: "Mine", descr: null, custom: 1 }], run: m.run, get: m.get } as never);
    const res = await listVoices();
    const body = (await res.json()) as Array<{ id: string; custom: number }>;
    expect(body[0]).toMatchObject({ id: "c1", custom: 1 });
    expect(body.length).toBeGreaterThan(1); // premade appended
  });

  it("POST 401 in production without a token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await addVoice(req({ host: "x.com" }, { id: "v", name: "n" }));
    expect(res.status).toBe(401);
  });

  it("POST 400 when id or name is missing", async () => {
    const res = await addVoice(req({ host: "localhost" }, { id: "", name: "" }));
    expect(res.status).toBe(400);
  });

  it("POST 201 upserts a custom voice", async () => {
    const res = await addVoice(req({ host: "localhost" }, { id: "abc", name: "My Voice", descr: "warm" }));
    expect(res.status).toBe(201);
    expect(m.run).toHaveBeenCalled();
    const body = await res.json();
    expect(body).toMatchObject({ id: "abc", name: "My Voice", custom: 1 });
  });

  it("DELETE 404 when the custom voice is absent", async () => {
    m.get.mockReturnValueOnce(undefined);
    const res = await deleteVoice(req({ host: "localhost" }), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("DELETE 200 removes a custom voice", async () => {
    m.get.mockReturnValueOnce({ id: "abc" });
    const res = await deleteVoice(req({ host: "localhost" }), ctx("abc"));
    expect(res.status).toBe(200);
    expect(m.run).toHaveBeenCalled();
  });
});
