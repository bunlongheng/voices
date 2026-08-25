// Karaoke model: reused from the sibling Briefly app (proven + unit-tested there).
//
// The take text is tokenized into words, where each word carries `ci`, the global
// character index of its first character. ElevenLabs gives per-character start
// times (`starts[i]`), so at playback time `t` we binary-search for the active
// character and map it back to the active word - a read-along highlight.

export type Tok = { w: string; ci: number };

// Build word tokens with global char offsets against the raw text (offsets must
// be true indices into `text`/`starts`, so whitespace is preserved implicitly).
export function buildWords(text: string): Tok[] {
  const clean = (text || "").replace(/\r\n/g, "\n");
  const toks: Tok[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) toks.push({ w: m[0], ci: m.index });
  return toks;
}

// Last character index whose spoken start time is <= t (binary search). -1 before
// the first character begins. `starts` must be non-decreasing.
export function charIndexAt(starts: number[], t: number): number {
  if (!starts.length || t < starts[0]) return -1;
  let lo = 0;
  let hi = starts.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

// Classify a word relative to the active character index.
export type WordState = "done" | "active" | "future";
export function wordState(tok: Tok, activeChar: number): WordState {
  const end = tok.ci + tok.w.length - 1;
  if (activeChar < tok.ci) return "future";
  if (activeChar >= end) return "done";
  return "active";
}
