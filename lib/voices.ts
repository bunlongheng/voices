// Curated ElevenLabs premade voices to seed the playground. Pure data only (no
// env) so it is safe to import in client components. Users load their OWN voices
// on top of these via the voice manager (stored in the DB / voices.json).
export type PremadeVoice = { id: string; name: string; descr: string };

export const PREMADE: PremadeVoice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", descr: "Clear, natural, realistic" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", descr: "Soft, warm, gentle" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", descr: "Warm friendly narrator" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", descr: "Clear British female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", descr: "Soft, cozy female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", descr: "Deep, calm male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", descr: "Deep, firm, a leader" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", descr: "Deep, resonant, authoritative" },
];

// Pure default (no env read here - this module is imported client-side too).
// The server resolves VOICES_DEFAULT_ID over this in the API route.
export const FALLBACK_VOICE = PREMADE[0].id;
export const premadeName = (id: string) => PREMADE.find((v) => v.id === id)?.name || "Custom";

// A short line of text to warm up a voice with a single click.
export const SAMPLE_TEXT =
  "Hey, this is a quick test of how this voice sounds. Notice the warmth, the pacing, and how natural it feels read aloud.";
