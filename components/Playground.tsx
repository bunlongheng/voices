"use client";

import { useState } from "react";
import type { Settings, Voice } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { SAMPLE_TEXT } from "@/lib/voices";
import VoicePicker from "./VoicePicker";
import Player from "./Player";

const MAX = 5000;

// The main stage: choose a voice, type/paste text, tune delivery, and hear it.
// Every synthesis is saved as a take (parent refreshes the library via onSaved).
export default function Playground({
  voices,
  selected,
  onSelect,
  canManage,
  onSaved,
  seed,
}: {
  voices: Voice[];
  selected: string | null;
  onSelect: (id: string) => void;
  canManage: boolean;
  onSaved: () => void;
  // when a saved take is "reused", its text + settings seed the initial state
  seed?: { text: string; stability: number; style: number; speed: number };
}) {
  const [text, setText] = useState(seed?.text ?? SAMPLE_TEXT);
  const [s, setS] = useState<Settings>(
    seed ? { stability: seed.stability, style: seed.style, speed: seed.speed } : DEFAULT_SETTINGS,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);

  const speak = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/takes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), voice_id: selected, ...s }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.has_audio) {
        setErr(d.error || `Synthesis failed (${r.status})`);
        return;
      }
      // cache-bust so re-speaking the same id refreshes the element
      setAudio(`/audio/${d.id}.mp3?v=${d.id}`);
      onSaved();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section>
        <Label>voice</Label>
        <VoicePicker voices={voices} selected={selected} onSelect={onSelect} />
      </section>

      <section>
        <Label>text</Label>
        <div style={{ position: "relative" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            rows={6}
            placeholder="Type or paste anything you'd like to hear..."
            aria-label="Text to speak"
            className="focus-ring"
            style={{
              width: "100%",
              resize: "vertical",
              background: "var(--bg-deep)",
              color: "var(--text)",
              border: "1px solid var(--sub-alt)",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 16, // 16px keeps iOS Safari from zooming the field on focus
              lineHeight: 1.6,
              outline: "none",
            }}
          />
          <span
            className="dim"
            style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, fontVariantNumeric: "tabular-nums" }}
          >
            {text.length}/{MAX}
          </span>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Slider label="stability" min={0} max={1} step={0.05} value={s.stability} hint="lower = livelier"
          onChange={(v) => setS({ ...s, stability: v })} />
        <Slider label="style" min={0} max={1} step={0.05} value={s.style} hint="expression"
          onChange={(v) => setS({ ...s, style: v })} />
        <Slider label="speed" min={0.7} max={1.2} step={0.05} value={s.speed} hint="delivery pace"
          onChange={(v) => setS({ ...s, speed: v })} />
      </section>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          onClick={speak}
          disabled={busy || !text.trim() || !canManage}
          className="focus-ring"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "var(--main)",
            color: "var(--bg)",
            fontWeight: 800,
            fontSize: 15,
            padding: "12px 24px",
            borderRadius: 12,
            opacity: busy || !text.trim() || !canManage ? 0.55 : 1,
          }}
        >
          {busy ? (
            <>
              <Equalizer /> speaking...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              speak
            </>
          )}
        </button>
        {!canManage && (
          <span className="dim" style={{ fontSize: 13 }}>
            Synthesis runs locally with an ElevenLabs key. This deploy is read-only - browse saved takes in the library.
          </span>
        )}
      </div>

      {err && (
        <div style={{ color: "var(--error)", fontSize: 14, background: "var(--card)", padding: "12px 14px", borderRadius: 10 }}>
          {err}
        </div>
      )}

      {audio && (
        <div style={{ background: "var(--card)", padding: "16px 18px", borderRadius: 14, animation: "rise 0.3s ease" }}>
          <Player src={audio} autoPlay />
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="dim" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Slider({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span>{label}</span>
        <span className="accent" style={{ fontVariantNumeric: "tabular-nums" }}>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ accentColor: "var(--main)", width: "100%" }}
      />
      <span className="dim" style={{ fontSize: 11 }}>{hint}</span>
    </label>
  );
}

function Equalizer() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, height: 14 }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 14,
            background: "var(--bg)",
            borderRadius: 2,
            transformOrigin: "center",
            animation: `eq 0.7s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
