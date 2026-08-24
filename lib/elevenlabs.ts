// ElevenLabs text-to-speech for the voice playground.
//
// A "take" is one synthesis of some text with a chosen voice + settings. Long
// text is chunked on sentence boundaries, synthesized per chunk, then the audio
// is concatenated so a whole paragraph plays as one file. We don't need
// character timestamps here (this is a playground, not a karaoke reader), so we
// use the plain streaming endpoint - simpler and faster.

import type { Settings } from "./types";

export type Synth = { audio: Buffer; duration: number };

const MODEL_ID = "eleven_multilingual_v2"; // warm, expressive, multi-lingual
const CHUNK_CHARS = 2200; // stay well under model input limits per request

// Split text into chunks <= max, preferring sentence then word breaks so no
// chunk cuts a word in half.
export function chunkText(text: string, max = CHUNK_CHARS): string[] {
  const clean = text.replace(/\r\n/g, "\n");
  if (clean.length <= max) return [clean];
  const chunks: string[] = [];
  let rest = clean;
  while (rest.length > max) {
    let cut = -1;
    const window = rest.slice(0, max);
    const m = [...window.matchAll(/[.!?]["'”’)\]]?\s/g)];
    const lastSentence = m.length ? m[m.length - 1].index! + m[m.length - 1][0].length : -1;
    if (lastSentence > max * 0.4) cut = lastSentence;
    if (cut < 0) {
      const ws = window.lastIndexOf(" ");
      cut = ws > max * 0.4 ? ws + 1 : max;
    }
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.length) chunks.push(rest);
  return chunks;
}

async function synthChunk(text: string, voiceId: string, key: string, s: Settings): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: clamp(s.stability, 0, 1),
          similarity_boost: 0.8,
          style: clamp(s.style, 0, 1),
          use_speaker_boost: true,
          speed: clamp(s.speed, 0.7, 1.2),
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Full-take synthesis: chunk -> synth each -> stitch the audio together.
export async function synthesize(text: string, voiceId: string, s: Settings): Promise<Synth> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY not set");

  const parts = chunkText(text);
  const bufs: Buffer[] = [];
  for (const part of parts) bufs.push(await synthChunk(part, voiceId, key, s));

  const audio = Buffer.concat(bufs);
  return { audio, duration: estimateSeconds(text, s.speed) };
}

// Rough spoken-length estimate: ~150 words per minute, scaled by speed.
export function estimateSeconds(text: string, speed = 1): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60 / (speed || 1));
}

function clamp(n: number, lo: number, hi: number): number {
  if (!isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
