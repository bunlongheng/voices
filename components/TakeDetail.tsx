"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AlignFile, Take } from "@/lib/types";
import { mmss } from "@/lib/types";
import { inkOn } from "@/lib/colors";
import { buildWords, charIndexAt, wordState } from "@/lib/karaoke";

const RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];

// Full-screen detail for one take: the voice, the text with a karaoke read-along
// (when alignment exists), and a Briefly-style transport. Colour-matched to the
// take's voice. Reached by tapping a circle in the honeycomb.
export default function TakeDetail({ take, color, onBack }: { take: Take; color: string; onBack: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(take.duration_sec ?? 0);
  const [rate, setRate] = useState(1);
  const [align, setAlign] = useState<AlignFile | null>(null);

  const ink = inkOn(color);

  // load the per-character alignment (if this take has one) for karaoke
  useEffect(() => {
    let live = true;
    fetch(`/audio/${take.id}.json`, { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && Array.isArray(d.starts) && setAlign(d as AlignFile))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [take.id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCur(a.currentTime);
    const onMeta = () => setDur(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
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
  const seekTo = (s: number) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    a.currentTime = Math.max(0, Math.min(dur, s));
    setCur(a.currentTime);
  };
  const applyRate = (r: number) => {
    setRate(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  };

  const words = useMemo(() => (align ? buildWords(align.text) : buildWords(take.text)), [align, take.text]);
  const activeChar = align ? charIndexAt(align.starts, cur) : -1;
  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", animation: "rise 0.25s ease" }}>
      {/* back bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding:
            "calc(16px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) 8px max(22px, env(safe-area-inset-left))",
          maxWidth: 760,
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
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          voices
        </button>
        <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 16, color }}>{take.voice_name || "Custom"}</span>
      </div>

      {/* karaoke / text */}
      <main
        style={{
          flex: 1,
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          padding: "22px 26px 240px",
          overflowY: "auto",
        }}
      >
        <p style={{ margin: 0, fontSize: 22, lineHeight: 1.85 }}>
          {words.map((tok) => {
            const st = align ? wordState(tok, activeChar) : "done";
            const c = st === "future" ? "var(--sub)" : "var(--text)";
            return (
              <span
                key={tok.ci}
                onClick={() => align && seekTo(align.starts[tok.ci] ?? 0)}
                style={{
                  cursor: align ? "pointer" : "default",
                  background: st === "active" ? color : "transparent",
                  color: st === "active" ? ink : c,
                  borderRadius: 5,
                  padding: st === "active" ? "1px 4px" : undefined,
                  transition: "background 0.1s linear",
                }}
              >
                {tok.w}{" "}
              </span>
            );
          })}
        </p>
      </main>

      {/* Briefly-style transport */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "linear-gradient(to top, #000 68%, transparent)",
          padding: "16px 22px calc(22px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <audio ref={audioRef} src={`/audio/${take.id}.mp3`} preload="metadata" />

          {/* scrubber */}
          <div
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - r.left) / r.width) * dur);
            }}
            style={{ height: 18, display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ position: "relative", width: "100%", height: 4, background: "#1c1c1e", borderRadius: 999 }}>
              <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: color, borderRadius: 999 }} />
              <div
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: "50%",
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: color,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span className="dim" style={{ fontSize: 12 }}>{mmss(cur)}</span>
            <span className="dim" style={{ fontSize: 12 }}>{mmss(dur)}</span>
          </div>

          {/* controls: rate | back 10 | play | fwd 10 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(18px, 6vw, 44px)", marginTop: 6 }}>
            <button
              onClick={() => applyRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
              className="focus-ring"
              aria-label="Playback speed"
              title="Playback speed"
              style={{ color: "var(--sub)", fontSize: 14, fontWeight: 700, width: 44, textAlign: "center" }}
            >
              {rate}x
            </button>
            <button onClick={() => seekTo(cur - 10)} className="focus-ring" aria-label="Back 10 seconds" title="Back 10s" style={{ color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                <path d="M11 7L5 12l6 5V7zM19 7l-6 5 6 5V7z" />
              </svg>
            </button>
            <button
              onClick={toggle}
              className="focus-ring"
              aria-label={playing ? "Pause" : "Play"}
              style={{
                width: 68,
                height: 68,
                borderRadius: 999,
                background: color,
                color: ink,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                boxShadow: `0 4px 20px ${color}55`,
              }}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4.5" height="16" rx="1" />
                  <rect x="13.5" y="4" width="4.5" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
                  <path d="M8 5l11 7-11 7z" />
                </svg>
              )}
            </button>
            <button onClick={() => seekTo(cur + 10)} className="focus-ring" aria-label="Forward 10 seconds" title="Forward 10s" style={{ color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                <path d="M13 7l6 5-6 5V7zM5 7l6 5-6 5V7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
