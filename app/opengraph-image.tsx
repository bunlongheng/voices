import { ImageResponse } from "next/og";

export const alt = "Voices - a text-to-speech voice library";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Home share card: pure black, a white "voices" wordmark + tagline beside an
// Apple-Watch-style cluster of vibrant voice circles.
export default function Image() {
  const circles = [
    { c: "#0a84ff", d: 150, x: 690, y: 150, ink: "#fff", label: "Alice" },
    { c: "#ff2d55", d: 150, x: 858, y: 150, ink: "#fff", label: "Daniel" },
    { c: "#32d74b", d: 150, x: 774, y: 300, ink: "#0a0a0a", label: "Rachel" },
    { c: "#ff9f0a", d: 96, x: 636, y: 322, ink: "#0a0a0a", label: "" },
    { c: "#bf5af2", d: 96, x: 950, y: 322, ink: "#0a0a0a", label: "" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#000000",
          color: "#f4f4f5",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* text column */}
        <div style={{ display: "flex", flexDirection: "column", padding: "0 72px", maxWidth: 560 }}>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2, color: "#fff" }}>voices</div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#fff", marginTop: 20, lineHeight: 1.12 }}>
            Every voice is a tap away.
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#8a8a90", marginTop: 16, lineHeight: 1.45 }}>
            A library of takes as colourful circles - tap one to hear the voice.
          </div>
        </div>

        {/* voice-circle cluster */}
        {circles.map((o, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              width: o.d,
              height: o.d,
              borderRadius: "50%",
              background: o.c,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: o.ink,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {o.label}
          </div>
        ))}
      </div>
    ),
    { ...size },
  );
}
