import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import db, { type VoiceRow } from "@/lib/db";
import { authorized } from "@/lib/auth";
import { PREMADE } from "@/lib/voices";
import { writeManifest } from "@/lib/manifest";

export const runtime = "nodejs";

const premadeList = () => PREMADE.map((v) => ({ id: v.id, name: v.name, descr: v.descr, custom: 0 }));

// List every voice available in the playground: curated premade + the owner's
// own loaded voices. Custom voices come first so they're easy to reach.
export async function GET() {
  // On Vercel (read-only FS, no DB) read the committed custom-voices manifest.
  if (process.env.VERCEL) {
    let custom: VoiceRow[] = [];
    try {
      custom = JSON.parse(readFileSync(join(process.cwd(), "public", "voices.json"), "utf8"));
    } catch {
      /* no custom voices bundled */
    }
    return NextResponse.json([...custom, ...premadeList()]);
  }
  const custom = db
    .prepare("SELECT id,name,descr,custom FROM voices WHERE custom=1 ORDER BY created_at DESC")
    .all() as VoiceRow[];
  return NextResponse.json([...custom, ...premadeList()]);
}

// Load your own voice: { id, name, descr? }. `id` is the ElevenLabs voice id.
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const id = String(b.id || "").trim();
  const name = String(b.name || "").trim().slice(0, 60);
  const descr = String(b.descr || "").trim().slice(0, 120) || null;
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 });

  db.prepare(
    "INSERT INTO voices (id,name,descr,custom) VALUES (?,?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, descr=excluded.descr",
  ).run(id, name, descr);
  writeManifest();
  return NextResponse.json({ id, name, descr, custom: 1 }, { status: 201 });
}
