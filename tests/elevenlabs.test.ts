import { describe, it, expect } from "vitest";
import { chunkText, estimateSeconds } from "@/lib/elevenlabs";

describe("chunkText", () => {
  it("returns a single chunk when the text fits", () => {
    expect(chunkText("hello world", 100)).toEqual(["hello world"]);
  });

  it("never emits a chunk longer than max", () => {
    const text = "word ".repeat(1000);
    for (const c of chunkText(text, 200)) expect(c.length).toBeLessThanOrEqual(200);
  });

  it("prefers sentence boundaries", () => {
    const text = "First sentence here. Second sentence here. Third sentence here.";
    const chunks = chunkText(text, 30);
    // no chunk should end mid-word (every non-final chunk ends with space/punct)
    for (const c of chunks.slice(0, -1)) expect(/[\s.!?]$/.test(c)).toBe(true);
  });

  it("reconstructs the original text exactly", () => {
    const text = "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu.";
    expect(chunkText(text, 20).join("")).toBe(text);
  });
});

describe("estimateSeconds", () => {
  it("scales with word count", () => {
    const short = estimateSeconds("one two three");
    const long = estimateSeconds("one two three four five six seven eight nine ten");
    expect(long).toBeGreaterThan(short);
  });

  it("gets faster as speed rises", () => {
    const text = "a ".repeat(300);
    expect(estimateSeconds(text, 1.2)).toBeLessThan(estimateSeconds(text, 1));
  });

  it("handles empty text", () => {
    expect(estimateSeconds("")).toBe(0);
  });
});
