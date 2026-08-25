"use client";

import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";
import { inkOn } from "@/lib/colors";

// The library as an Apple-Watch honeycomb on pure black. Each take is a solid
// vibrant circle - its colour derived from the voice. Circles gently float,
// waiting to be tapped; tapping one opens its detail page (full text + player).
const D = 104;
const GAP = 10;
const CELL = D + GAP;
const ROW = CELL * 0.86; // hex packing: rows nest into the gaps below

export default function TakeBubbles({
  takes,
  colors,
  loading,
  onOpen,
}: {
  takes: Take[];
  colors: Record<number, string>;
  loading: boolean;
  onOpen: (take: Take) => void;
}) {
  if (loading) return <div className="dim" style={{ margin: "auto", padding: "48px 0" }}>loading takes...</div>;
  if (!takes.length)
    return <div className="dim" style={{ margin: "auto", padding: "56px 0", textAlign: "center" }}>No takes yet.</div>;

  const n = takes.length;
  const perRow = Math.max(2, Math.round(Math.sqrt(n)));
  const rows = Math.ceil(n / perRow);
  const width = perRow * CELL + (rows > 1 ? CELL / 2 : 0);
  const height = (rows - 1) * ROW + D;

  const pos = (i: number) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return { x: col * CELL + (row % 2) * (CELL / 2), y: row * ROW };
  };

  return (
    <div style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "12px 0 24px" }}>
      <div style={{ position: "relative", width, height, maxWidth: "100%" }}>
        {takes.map((t, i) => {
          const { x, y } = pos(i);
          const color = colors[t.id] || "#8e8e93";
          const ink = inkOn(color);
          return (
            <div
              key={t.id}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: D,
                height: D,
                animation: `float ${3 + (i % 4) * 0.4}s ease-in-out ${(i % 5) * 0.35}s infinite`,
              }}
            >
              <button
                onClick={() => onOpen(t)}
                className="focus-ring bubble"
                aria-label={`Open ${t.voice_name || "take"}`}
                style={{
                  position: "absolute",
                  inset: 5,
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  background: color,
                  color: ink,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={ink} aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{t.voice_name || "Custom"}</span>
                <span style={{ fontSize: 9.5, opacity: 0.75, letterSpacing: 0.2 }}>
                  {t.engine || mmss(t.duration_sec ?? 0)}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <p className="dim" style={{ margin: 0, fontSize: 13 }}>tap a voice to open</p>
    </div>
  );
}
