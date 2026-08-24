import { ImageResponse } from "next/og";
import { PREMADE } from "@/lib/voices";

export const alt = "Voices - your text-to-speech playground";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Home share card: the wordmark + tagline beside a mock "playground" panel -
// a voice chip row and a waveform - in the monkeytype serika palette.
export default function Image() {
  const YELLOW = "#2dd4bf"; // brand accent (turquoise)
  const BG = "#2b2d30";
  const PANEL = "#323437";
  const TEXT = "#d1d0c5";
  const SUB = "#646669";
  const CARD = "#2c2e31";

  // a pseudo-waveform (fixed heights so the image is deterministic)
  const bars = [14, 30, 52, 40, 66, 82, 58, 74, 44, 90, 62, 78, 36, 54, 68, 42, 60, 84, 50, 28, 46, 72, 38, 56];
  const chips = PREMADE.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 60,
          padding: "0 76px",
          background: `radial-gradient(900px 900px at 90% 6%, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0) 55%), radial-gradient(1000px 700px at 8% 120%, #34363a 0%, ${BG} 60%)`,
          color: TEXT,
          fontFamily: "monospace",
        }}
      >
        {/* text column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ color: YELLOW, fontSize: 82, fontWeight: 800 }}>{">"}</span>
            <span style={{ fontSize: 82, fontWeight: 800, letterSpacing: -2, color: "#fff" }}>voices</span>
            <span style={{ color: YELLOW, fontSize: 82, fontWeight: 800 }}>_</span>
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#fff", marginTop: 22, lineHeight: 1.1, letterSpacing: -1 }}>
            Load your own voices. Hear any text spoken.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 25, color: TEXT, marginTop: 16, lineHeight: 1.45, maxWidth: 520 }}>
            <span>Compare tone, pacing, and delivery, then </span>
            <span style={{ color: YELLOW }}>&nbsp;save the takes&nbsp;</span>
            <span> you like.</span>
          </div>
        </div>

        {/* playground panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 430,
            flexShrink: 0,
            padding: 24,
            borderRadius: 28,
            background: PANEL,
            border: "1px solid #3a3c40",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            gap: 18,
          }}
        >
          {/* voice chips */}
          <div style={{ display: "flex", gap: 10 }}>
            {chips.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: CARD,
                  border: `1px solid ${i === 0 ? YELLOW : "transparent"}`,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: i === 0 ? YELLOW : "#fff" }}>{c.name}</span>
                <span style={{ fontSize: 11, color: SUB }}>voice</span>
              </div>
            ))}
          </div>

          {/* waveform */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 100, padding: "0 4px" }}>
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flex: 1,
                  height: h,
                  borderRadius: 999,
                  background: i < 10 ? YELLOW : "#3a3c40",
                }}
              />
            ))}
          </div>

          {/* transport */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 999, background: YELLOW }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={BG}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div style={{ display: "flex", flex: 1, height: 6, borderRadius: 999, background: "#26282b" }}>
              <div style={{ display: "flex", width: "42%", height: 6, borderRadius: 999, background: YELLOW }} />
            </div>
            <span style={{ fontSize: 15, color: SUB }}>0:07</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
