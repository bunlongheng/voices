"use client";

import { useEffect, useRef, useState } from "react";
import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";

// The library as an Apple-Watch honeycomb on pure black. Each take is a solid
// vibrant circle - its colour derived from the voice, so a voice is always the
// same colour. Circles gently float, waiting to be tapped. Tap one to play (a
// white ring fills with progress); tap again to pause. One <audio> at a time.
const D = 104; // circle diameter
const GAP = 10;
const CELL = D + GAP;
const ROW = CELL * 0.86; // hex packing: rows nest into the gaps below
const RR = D / 2 - 3;
const CIRC = 2 * Math.PI * RR;

// vibrant Apple-Watch-style colours (no turquoise). A voice maps to one stably.
const PALETTE = [
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

function colorFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// black or white glyph, whichever reads on the circle's colour
function inkOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#0a0a0a" : "#ffffff";
}

export default function TakeBubbles({
  takes,
  loading,
  onDelete,
}: {
  takes: Take[];
  loading: boolean;
  onDelete?: (id: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [armed, setArmed] = useState<number | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
    const onEnd = () => {
      setPlayingId(null);
      setProgress(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = (t: Take) => {
    const a = audioRef.current;
    if (!a) return;
    if (playingId === t.id) {
      a.pause();
      setPlayingId(null);
      return;
    }
    a.src = `/audio/${t.id}.mp3`;
    setProgress(0);
    a.play()
      .then(() => setPlayingId(t.id))
      .catch(() => setPlayingId(null));
  };

  if (loading)
    return <div className="dim" style={{ margin: "auto", padding: "48px 0" }}>loading takes...</div>;
  if (!takes.length)
    return <div className="dim" style={{ margin: "auto", padding: "56px 0", textAlign: "center" }}>No takes yet.</div>;

  const n = takes.length;
  const perRow = Math.max(2, Math.round(Math.sqrt(n)));
  const rows = Math.ceil(n / perRow);
  const width = perRow * CELL + (rows > 1 ? CELL / 2 : 0);
  const height = (rows - 1) * ROW + D;
  const active = takes.find((t) => t.id === playingId) || null;

  const pos = (i: number) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return { x: col * CELL + (row % 2) * (CELL / 2), y: row * ROW };
  };

  return (
    <div style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "12px 0 24px" }}>
      <audio ref={audioRef} preload="none" />

      <div style={{ position: "relative", width, height, maxWidth: "100%" }}>
        {takes.map((t, i) => {
          const { x, y } = pos(i);
          const isOn = playingId === t.id;
          const color = colorFor(t.voice_name || String(t.voice_id) || String(t.id));
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
                animation: isOn ? "none" : `float ${3 + (i % 4) * 0.4}s ease-in-out ${(i % 5) * 0.35}s infinite`,
              }}
            >
              {/* progress ring - white, only meaningful while playing */}
              <svg
                width={D}
                height={D}
                style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}
                aria-hidden="true"
              >
                {isOn && (
                  <>
                    <circle cx={D / 2} cy={D / 2} r={RR} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
                    <circle
                      cx={D / 2}
                      cy={D / 2}
                      r={RR}
                      fill="none"
                      stroke="#fff"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      strokeDashoffset={CIRC * (1 - progress)}
                      style={{ transition: "stroke-dashoffset 0.2s linear" }}
                    />
                  </>
                )}
              </svg>

              <button
                onClick={() => toggle(t)}
                className="focus-ring bubble"
                aria-label={isOn ? `Pause ${t.voice_name || "take"}` : `Play ${t.voice_name || "take"}`}
                aria-pressed={isOn}
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
                  boxShadow: isOn ? `0 0 22px ${color}88` : "none",
                }}
              >
                {isOn ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={ink} aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={ink} aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                <span style={{ fontWeight: 700, fontSize: 13 }}>{t.voice_name || "Custom"}</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
                  {mmss(t.duration_sec ?? 0)}
                </span>
              </button>

              {onDelete && (
                <button
                  onClick={() => (armed === t.id ? onDelete(t.id) : setArmed(t.id))}
                  onBlur={() => setArmed((a) => (a === t.id ? null : a))}
                  className="focus-ring"
                  aria-label={armed === t.id ? "Confirm delete" : "Delete take"}
                  title={armed === t.id ? "Tap again to delete" : "Delete take"}
                  style={{
                    position: "absolute",
                    top: -2,
                    left: -2,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: armed === t.id ? 11 : 15,
                    fontWeight: 700,
                    lineHeight: 1,
                    background: armed === t.id ? "var(--error)" : "#1c1c1e",
                    color: "#fff",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.6)",
                  }}
                >
                  {armed === t.id ? "ok" : "×"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* the playing take's text (or a gentle hint) under the cluster */}
      <p
        className="dim"
        style={{ margin: 0, maxWidth: 460, textAlign: "center", fontSize: 13, lineHeight: 1.5, minHeight: 20, padding: "0 12px" }}
      >
        {active ? active.text : "tap a voice to play"}
      </p>
    </div>
  );
}
