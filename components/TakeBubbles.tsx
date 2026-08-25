"use client";

import { useEffect, useRef, useState } from "react";
import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";

// The library as an Apple-Watch-style cluster of circles: one bubble per take,
// labelled by its voice. Tap a circle to play it - a turquoise ring fills with
// progress and the bubble lifts; tap again (or tap another) to switch. One
// shared <audio> element plays at a time.
const SIZE = 132;
const R = 61; // ring radius
const CIRC = 2 * Math.PI * R;

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
  const [progress, setProgress] = useState(0); // 0..1 for the active ring
  const [armed, setArmed] = useState<number | null>(null); // delete confirm

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
    return (
      <div className="dim" style={{ padding: "56px 0", textAlign: "center", lineHeight: 1.6 }}>
        No takes yet.
      </div>
    );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 22, justifyContent: "center", padding: "16px 0" }}>
      <audio ref={audioRef} preload="none" />
      {takes.map((t) => {
        const active = playingId === t.id;
        return (
          <div key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: SIZE }}>
            <div style={{ position: "relative", width: SIZE, height: SIZE }}>
              {/* progress ring (only meaningful while active) */}
              <svg
                width={SIZE}
                height={SIZE}
                style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}
                aria-hidden="true"
              >
                <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--sub-alt)" strokeWidth={3} />
                {active && (
                  <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
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
                aria-label={active ? `Pause ${t.voice_name || "take"}` : `Play ${t.voice_name || "take"}`}
                aria-pressed={active}
                style={{
                  position: "absolute",
                  inset: 8,
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: active
                    ? "color-mix(in srgb, var(--main) 16%, var(--card))"
                    : "var(--card)",
                  border: `1px solid ${active ? "var(--main)" : "transparent"}`,
                  color: "var(--text)",
                  transition: "transform 0.18s ease, background 0.2s ease, border-color 0.2s ease",
                }}
              >
                {active ? (
                  <Equalizer />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--main)" aria-hidden="true" style={{ marginBottom: 2 }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                <span style={{ fontWeight: 700, fontSize: 15, color: active ? "var(--main)" : "var(--text)" }}>
                  {t.voice_name || "Custom"}
                </span>
                <span className="dim" style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
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
                    top: 2,
                    right: 2,
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
                  }}
                >
                  {armed === t.id ? "ok" : "×"}
                </button>
              )}
            </div>

            {/* the take's text, clamped, under the circle */}
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.45,
                textAlign: "center",
                color: "var(--sub)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxWidth: SIZE + 20,
              }}
            >
              {t.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Equalizer() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, height: 18, marginBottom: 2 }} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 18,
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
