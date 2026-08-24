export type Take = {
  id: number;
  text: string;
  voice_id: string | null;
  voice_name: string | null;
  has_audio: number;
  duration_sec: number | null;
  char_count: number | null;
  stability?: number;
  style?: number;
  speed?: number;
  created_at: string;
};

export type Voice = {
  id: string;
  name: string;
  descr: string | null;
  custom: number;
};

// Voice synthesis settings the playground exposes.
export type Settings = {
  stability: number; // 0..1 - lower is livelier/more variable
  style: number; // 0..1 - style exaggeration
  speed: number; // 0.7..1.2 - delivery speed
};

export const DEFAULT_SETTINGS: Settings = { stability: 0.35, style: 0.3, speed: 1 };

export const mmss = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};
