"use client";

import { useEffect, useRef, useState } from "react";
import { mmss } from "@/lib/types";

// A compact audio transport: play/pause, seekable progress bar, live time.
// `autoPlay` starts it as soon as the src is set (used right after synthesis).
export default function Player({ src, autoPlay = false }: { src: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setT(a.currentTime);
    const onMeta = () => setDur(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  // (re)load and optionally autoplay when the source changes
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    setT(0);
    a.load();
    if (autoPlay) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [src, autoPlay]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  // keyboard control on the seek bar: arrows nudge +/-5s, Home/End jump to ends
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !dur) return;
    let next = a.currentTime;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next += 5;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= 5;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = dur;
    else return;
    e.preventDefault();
    a.currentTime = Math.max(0, Math.min(dur, next));
  };

  const pct = dur ? Math.min(100, (t / dur) * 100) : 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <audio ref={ref} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className="focus-ring"
        aria-label={playing ? "Pause" : "Play"}
        style={{
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "var(--main)",
          color: "var(--bg)",
        }}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div
        onClick={seek}
        onKeyDown={onKey}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        className="focus-ring"
        style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--sub-alt)", cursor: "pointer" }}
      >
        <div style={{ width: `${pct}%`, height: 6, borderRadius: 999, background: "var(--main)" }} />
      </div>

      <span className="dim" style={{ fontSize: 12, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        {mmss(t)} / {mmss(dur)}
      </span>
    </div>
  );
}
