"use client";

import { useEffect, useRef, useState } from "react";

// A soft ambient pad that "settles in the back" - a warm, slowly-evolving drone
// generated live with the Web Audio API (no audio file, so nothing to ship and
// nothing for the CSP to allow). Low volume, gentle 2s fade in / 1.2s fade out.
// It needs a user gesture to start (browser autoplay policy), so the toggle is
// that gesture; it never plays on its own.
export default function Ambient() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const start = () => {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.5;
    filter.connect(master);

    // a warm A-minor-ish pad: root, fifth, octave, twelfth - each a detuned pair
    // so the tone shimmers instead of sitting dead still
    const base = 110; // A2
    const partials = [base, base * 1.5, base * 2, base * 3];
    const oscs: OscillatorNode[] = [];
    partials.forEach((f, i) => {
      for (const detune of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = i % 2 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = 0.1 / partials.length;
        o.connect(g).connect(filter);
        o.start();
        oscs.push(o);
      }
    });

    // a very slow LFO breathes the filter cutoff so the pad keeps evolving
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    master.gain.linearRampToValueAtTime(0.06, now + 2); // fade in

    stopRef.current = () => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 1.2); // fade out
      window.setTimeout(() => {
        for (const o of oscs) {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        }
        try {
          lfo.stop();
        } catch {
          /* already stopped */
        }
      }, 1300);
    };
  };

  const toggle = () => {
    const next = !on;
    if (next) start();
    else {
      stopRef.current?.();
      stopRef.current = null;
    }
    setOn(next);
    document.documentElement.dataset.ambient = next ? "on" : "off";
  };

  useEffect(
    () => () => {
      stopRef.current?.();
      try {
        ctxRef.current?.close();
      } catch {
        /* already closed */
      }
    },
    [],
  );

  return (
    <button
      onClick={toggle}
      className="focus-ring"
      aria-pressed={on}
      aria-label={on ? "Turn off ambient sound" : "Turn on ambient sound"}
      title="Ambient sound"
      style={{ color: on ? "var(--main)" : "var(--sub)", display: "grid", placeItems: "center", width: 34, height: 34 }}
      onMouseEnter={(e) => !on && (e.currentTarget.style.color = "var(--main)")}
      onMouseLeave={(e) => !on && (e.currentTarget.style.color = "var(--sub)")}
    >
      {on ? (
        // animated equalizer bars while playing
        <span style={{ display: "flex", alignItems: "center", gap: 2, height: 16 }} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: 2.5,
                height: 16,
                background: "currentColor",
                borderRadius: 2,
                transformOrigin: "center",
                animation: `eq 0.9s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
        </span>
      ) : (
        // muted speaker when off
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
