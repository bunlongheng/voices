import { describe, it, expect } from "vitest";
import { PREMADE, FALLBACK_VOICE, premadeName } from "@/lib/voices";
import { mmss, DEFAULT_SETTINGS } from "@/lib/types";

describe("premade voices", () => {
  it("has a stable, non-empty curated list", () => {
    expect(PREMADE.length).toBeGreaterThan(0);
    for (const v of PREMADE) {
      expect(v.id).toBeTruthy();
      expect(v.name).toBeTruthy();
    }
  });

  it("unique voice ids", () => {
    const ids = PREMADE.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("FALLBACK_VOICE points at a real premade voice", () => {
    expect(PREMADE.some((v) => v.id === FALLBACK_VOICE)).toBe(true);
  });

  it("premadeName resolves known ids and falls back", () => {
    expect(premadeName(PREMADE[0].id)).toBe(PREMADE[0].name);
    expect(premadeName("nope")).toBe("Custom");
  });
});

describe("helpers", () => {
  it("mmss formats seconds", () => {
    expect(mmss(0)).toBe("0:00");
    expect(mmss(9)).toBe("0:09");
    expect(mmss(75)).toBe("1:15");
    expect(mmss(-4)).toBe("0:00");
    expect(mmss(NaN)).toBe("0:00");
  });

  it("default settings are in range", () => {
    expect(DEFAULT_SETTINGS.stability).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.stability).toBeLessThanOrEqual(1);
    expect(DEFAULT_SETTINGS.speed).toBeGreaterThan(0);
  });
});
