"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AlignFile, Take } from "@/lib/types";
import { mmss } from "@/lib/types";
import { inkOn } from "@/lib/colors";
import { buildWords, charIndexAt, wordState } from "@/lib/karaoke";

const RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];

// Full-screen detail for one take: the voice, the text with a per-character
// karaoke read-along (when alignment exists), and a Briefly-style transport.
// The highlight is driven by requestAnimationFrame reading the audio clock every
// frame, so it tracks the spoken word to the millisecond - not the ~4Hz
// `timeupdate` event.
export default function TakeDetail({
  take,
  color,
  onBack,
  onDelete,
}: {
  take: Take;
  color: string;
  onBack: () => void;
  onDelete?: (id: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(take.duration_sec ?? 0);
  const [rate, setRate] = useState(1);
  const [align, setAlign] = useState<AlignFile | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

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

  // per-frame clock: smooth, millisecond-accurate karaoke + scrubber
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      if (a) setCur(a.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDur(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    return () => {
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

  // keep the active word centred on screen as it reads (Briefly-style)
  const activeRef = useRef<HTMLSpanElement | null>(null);
  const activeWordCi =
    align && activeChar >= 0 ? words.find((t) => wordState(t, activeChar) === "active")?.ci ?? -1 : -1;
  useEffect(() => {
    if (activeWordCi >= 0) activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeWordCi]);

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

        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color }}>{take.voice_name || "Custom"}</span>
          {take.engine && <span className="dim" style={{ fontSize: 12 }}>{take.engine}</span>}
          {onDelete && (
            <button
              onClick={() => (confirmDel ? onDelete(take.id) : setConfirmDel(true))}
              onBlur={() => setConfirmDel(false)}
              className="focus-ring"
              aria-label={confirmDel ? "Confirm delete" : "Delete take"}
              title={confirmDel ? "Tap again to delete" : "Delete take"}
              style={{ color: confirmDel ? "var(--error)" : "var(--sub)", fontSize: confirmDel ? 12 : 16, fontWeight: 700, padding: "4px 6px" }}
            >
              {confirmDel ? "delete?" : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              )}
            </button>
          )}
        </span>
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
        <p style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 27px)", lineHeight: 1.85, fontWeight: 500 }}>
          {words.map((tok) => {
            const st = align ? wordState(tok, activeChar) : "done";
            if (st !== "active") {
              return (
                <span
                  key={tok.ci}
                  onClick={() => align && seekTo(align.starts[tok.ci] ?? 0)}
                  className="kw"
                  style={{ color: st === "future" ? "var(--sub)" : "var(--text)" }}
                >
                  {tok.w}{" "}
                </span>
              );
            }
            // active word: per-character read-along with a blinking caret (Briefly)
            const typed = activeChar - tok.ci; // index of the character being spoken
            return (
              <span key={tok.ci} ref={activeRef} onClick={() => align && seekTo(align.starts[tok.ci] ?? 0)} className="kw">
                {[...tok.w].map((ch, j) => (
                  <span
                    key={j}
                    style={{
                      position: "relative",
                      color: j === typed ? color : j < typed ? "var(--text)" : "var(--sub)",
                    }}
                  >
                    {j === typed && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: "-0.09em",
                          top: "0.08em",
                          width: "0.09em",
                          height: "1.15em",
                          background: color,
                          borderRadius: 2,
                          animation: "blink 1s step-end infinite",
                        }}
                      />
                    )}
                    {ch}
                  </span>
                ))}{" "}
              </span>
            );
          })}
        </p>
      </main>

      {/* Briefly-style transport - fixed to the viewport bottom, always visible */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          background: "linear-gradient(to top, #000 72%, rgba(0,0,0,0.85) 90%, transparent)",
          padding: "18px 22px calc(22px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <audio ref={audioRef} src={`/audio/${take.id}.mp3`} preload="metadata" />

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
