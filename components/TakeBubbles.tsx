"use client";

import { useEffect, useRef, useState } from "react";
import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";

// The library as an Apple-Watch honeycomb: hex-packed circles, one per take,
// labelled by its voice. Alternate rows nest into the gaps below. Tap a circle
// to play it - a turquoise ring fills with progress; the active take's text
// shows as a caption under the cluster. One shared <audio> plays at a time.
const D = 104; // circle diameter
const GAP = 10;
const CELL = D + GAP; // horizontal step
const ROW = CELL * 0.86; // vertical step so rows nest (hex packing)
const RR = D / 2 - 3; // ring radius
const CIRC = 2 * Math.PI * RR;

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

  if (loading) return <div className="dim" style={{ padding: "48px 0", textAlign: "center" }}>loading takes...</div>;
  if (!takes.length)
    return <div className="dim" style={{ padding: "56px 0", textAlign: "center", lineHeight: 1.6 }}>No takes yet.</div>;

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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "18px 0" }}>
      <audio ref={audioRef} preload="none" />

      <div style={{ position: "relative", width, height, maxWidth: "100%" }}>
        {takes.map((t, i) => {
          const { x, y } = pos(i);
          const isOn = playingId === t.id;
          return (
            <div key={t.id} style={{ position: "absolute", left: x, top: y, width: D, height: D }}>
              <svg
                width={D}
                height={D}
                style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}
                aria-hidden="true"
              >
                <circle cx={D / 2} cy={D / 2} r={RR} fill="none" stroke="var(--sub-alt)" strokeWidth={3} />
                {isOn && (
                  <circle
                    cx={D / 2}
                    cy={D / 2}
                    r={RR}
                    fill="none"
                    stroke="var(--main)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - progress)}
                    style={{ transition: "stroke-dashoffset 0.2s linear" }}
                  />
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
                  background: isOn ? "color-mix(in srgb, var(--main) 18%, var(--card))" : "var(--card)",
                  border: `1px solid ${isOn ? "var(--main)" : "transparent"}`,
                  color: "var(--text)",
                  transition: "transform 0.18s ease, background 0.2s ease, border-color 0.2s ease",
                }}
              >
                {isOn ? (
                  <Equalizer />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--main)" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                <span style={{ fontWeight: 700, fontSize: 13, color: isOn ? "var(--main)" : "var(--text)" }}>
                  {t.voice_name || "Custom"}
                </span>
                <span className="dim" style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
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
                    background: armed === t.id ? "var(--error)" : "var(--bg-deep)",
                    color: armed === t.id ? "#fff" : "var(--sub)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                  }}
                >
                  {armed === t.id ? "ok" : "×"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* the playing take's text (or a gentle hint) as a caption under the cluster */}
      <p
        className="dim"
        style={{ margin: 0, maxWidth: 460, textAlign: "center", fontSize: 13, lineHeight: 1.5, minHeight: 20, padding: "0 12px" }}
      >
        {active ? active.text : "tap a voice to play"}
      </p>
    </div>
  );
}

function Equalizer() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, height: 16 }} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 16,
            background: "var(--main)",
            borderRadius: 2,
            transformOrigin: "center",
            animation: `eq 0.8s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
