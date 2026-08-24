import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import db, { type TakeRow } from "@/lib/db";
import { audioPath } from "@/lib/audio";
import { synthesize, estimateSeconds } from "@/lib/elevenlabs";
import { authorized } from "@/lib/auth";
import { FALLBACK_VOICE, premadeName } from "@/lib/voices";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import { writeManifest } from "@/lib/manifest";
import { allow, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_CHARS = 5000;

export async function GET() {
  const rows = db
    .prepare(
      "SELECT id,text,voice_id,voice_name,has_audio,duration_sec,char_count,stability,style,speed,created_at FROM takes ORDER BY id DESC",
    )
    .all() as TakeRow[];
  return NextResponse.json(rows);
}

// Create a take: synthesize ElevenLabs audio for { text, voice_id?, settings? }
// and save it. Returns the new take with a playable audio URL.
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!allow(clientKey(req)))
    return NextResponse.json({ error: "rate limited - try again shortly" }, { status: 429 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const text = String(b.text || "").trim().slice(0, MAX_CHARS);
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const voiceId = String(b.voice_id || process.env.VOICES_DEFAULT_ID || FALLBACK_VOICE);
  const voiceName = String(b.voice_name || premadeName(voiceId));
  const settings: Settings = {
    stability: num(b.stability, DEFAULT_SETTINGS.stability),
    style: num(b.style, DEFAULT_SETTINGS.style),
    speed: num(b.speed, DEFAULT_SETTINGS.speed),
  };

  const info = db
    .prepare(
      "INSERT INTO takes (text,voice_id,voice_name,char_count,duration_sec,stability,style,speed) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      text,
      voiceId,
      voiceName,
      text.length,
      estimateSeconds(text, settings.speed),
      settings.stability,
      settings.style,
      settings.speed,
    );
  const id = Number(info.lastInsertRowid);

  try {
    const { audio, duration } = await synthesize(text, voiceId, settings);
    writeFileSync(audioPath(id), audio);
    db.prepare("UPDATE takes SET has_audio=1, duration_sec=? WHERE id=?").run(Math.round(duration), id);
    writeManifest();
    return NextResponse.json(
      { id, voice_id: voiceId, voice_name: voiceName, has_audio: 1, duration_sec: Math.round(duration) },
      { status: 201 },
    );
  } catch (e) {
    // keep the row (has_audio=0); log the detail server-side, return a generic
    // message so upstream provider errors never leak to the client
    console.error("synthesis failed", e);
    return NextResponse.json({ id, has_audio: 0, error: "synthesis failed" }, { status: 502 });
  }
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}
