"use client";

import { useEffect, useRef, useState } from "react";
import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";
import { inkOn } from "@/lib/colors";

// Full-screen detail for one take: the voice, the full text ("lyric"), and a
// colour-matched player. Reached by tapping a circle in the honeycomb.
export default function TakeDetail({ take, color, onBack }: { take: Take; color: string; onBack: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(take.duration_sec ?? 0);

  const ink = inkOn(color);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setT(a.currentTime);
    const onMeta = () => setDur(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    // autoplay on open (best-effort; ignored if the browser blocks it)
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * dur;
  };

  const pct = dur ? Math.min(100, (t / dur) * 100) : 0;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", animation: "rise 0.25s ease" }}>
      {/* top bar: back */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding:
            "calc(16px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) 8px max(22px, env(safe-area-inset-left))",
          maxWidth: 720,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <button
          onClick={onBack}
          className="focus-ring"
          aria-label="Back to voices"
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--sub)", fontSize: 14, padding: "6px 4px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          voices
        </button>
        <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 16, color }}>
          {take.voice_name || "Custom"}
        </span>
      </div>

      {/* the lyric / full text */}
      <main
        style={{
          flex: 1,
          maxWidth: 720,
          margin: "0 auto",
          width: "100%",
          padding: "24px 26px 200px",
          overflowY: "auto",
        }}
      >
        <p style={{ margin: 0, fontSize: 21, lineHeight: 1.75, color: "var(--text)", whiteSpace: "pre-wrap" }}>
          {take.text}
        </p>
      </main>

      {/* sticky colour-matched player */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "linear-gradient(to top, #000 62%, transparent)",
          padding: "18px 22px calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <audio ref={audioRef} src={`/audio/${take.id}.mp3`} preload="metadata" />
          <button
            onClick={toggle}
            className="focus-ring"
            aria-label={playing ? "Pause" : "Play"}
            style={{
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: color,
              color: ink,
              boxShadow: `0 0 22px ${color}66`,
            }}
          >
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div
            onClick={seek}
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="focus-ring"
            style={{ flex: 1, height: 6, borderRadius: 999, background: "#1c1c1e", cursor: "pointer" }}
          >
            <div style={{ width: `${pct}%`, height: 6, borderRadius: 999, background: color }} />
          </div>
          <span className="dim" style={{ fontSize: 12, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
            {mmss(t)} / {mmss(dur)}
          </span>
        </div>
      </div>
    </div>
  );
}
