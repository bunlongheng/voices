// Vibrant Apple-Watch-style colours (no turquoise). A voice maps to one stably,
// so the same voice is always the same colour across the app.
export const PALETTE = [
  "#ff453a", // red
  "#ff9f0a", // orange
  "#ffd60a", // yellow
  "#32d74b", // green
  "#0a84ff", // blue
  "#5e5ce6", // indigo
  "#bf5af2", // purple
  "#ff2d55", // pink
  "#ff375f", // rose
  "#ac8e68", // tan
  "#64d2ff", // sky
  "#30d158", // mint-green
];

export function colorFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Give every take a DISTINCT colour (up to the palette size): start from each
// take's stable hash colour, but if it's already used, take the next free one.
// Deterministic (iterate by id) so the honeycomb and detail page always agree.
export function assignColors(
  takes: { id: number; voice_name: string | null; voice_id: string | null }[],
): Record<number, string> {
  const used = new Set<string>();
  const out: Record<number, string> = {};
  for (const t of [...takes].sort((a, b) => a.id - b.id)) {
    let c = colorFor(t.voice_name || String(t.voice_id) || String(t.id));
    if (used.has(c)) {
      const start = PALETTE.indexOf(c);
      for (let k = 1; k <= PALETTE.length; k++) {
        const cand = PALETTE[(start + k) % PALETTE.length];
        if (!used.has(cand)) {
          c = cand;
          break;
        }
      }
    }
    used.add(c);
    out[t.id] = c;
  }
  return out;
}

// black or white ink, whichever reads on the given circle colour
export function inkOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#0a0a0a" : "#ffffff";
}
