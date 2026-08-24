"use client";

import { useCallback, useEffect, useState } from "react";
import type { Take, Voice } from "@/lib/types";
import { PREMADE, FALLBACK_VOICE } from "@/lib/voices";
import Playground from "@/components/Playground";
import TakeList from "@/components/TakeList";
import AddVoice from "@/components/AddVoice";
import VoicePicker from "@/components/VoicePicker";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

type Tab = "play" | "library" | "voices";

const PREMADE_VOICES: Voice[] = PREMADE.map((v) => ({ id: v.id, name: v.name, descr: v.descr, custom: 0 }));

export default function App() {
  const [tab, setTab] = useState<Tab>("play");
  const [voices, setVoices] = useState<Voice[]>(PREMADE_VOICES);
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(FALLBACK_VOICE);
  // reuse: a saved take's text + settings seeded back into the playground.
  // seedKey forces Playground to remount so it re-reads the seed as initial state.
  const [seed, setSeed] = useState<{ text: string; stability: number; style: number; speed: number } | null>(null);
  const [seedKey, setSeedKey] = useState(0);
  // true only when the writable local API served the data - the static Vercel
  // deploy reads *.json, where writes just 401. Gates synthesis + management.
  const [canManage, setCanManage] = useState(false);
  const [theme, toggleTheme] = useTheme();

  // Load takes: prefer the live API (local); fall back to the committed manifest.
  const loadTakes = useCallback(async () => {
    for (const url of ["/api/takes", "/takes.json"]) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const d = (await r.json()) as Take[];
        if (Array.isArray(d)) {
          setTakes(d);
          setCanManage(url === "/api/takes");
          setLoading(false);
          return;
        }
      } catch {
        /* try next source */
      }
    }
    setLoading(false);
  }, []);

  // Load voices: live API returns premade + custom; static reads voices.json
  // (custom only) and merges the premade set in code.
  const loadVoices = useCallback(async () => {
    try {
      const r = await fetch("/api/voices", { cache: "no-store" });
      if (r.ok) {
        const d = (await r.json()) as Voice[];
        if (Array.isArray(d) && d.length) return setVoices(d);
      }
    } catch {
      /* fall through to static */
    }
    try {
      const r = await fetch("/voices.json", { cache: "no-store" });
      if (r.ok) {
        const custom = (await r.json()) as Voice[];
        if (Array.isArray(custom)) setVoices([...custom.map((v) => ({ ...v, custom: 1 })), ...PREMADE_VOICES]);
      }
    } catch {
      /* premade defaults already set */
    }
  }, []);

  useEffect(() => {
    loadTakes();
    loadVoices();
  }, [loadTakes, loadVoices]);

  // shareable tab deep-link: /?tab=library or /?tab=voices opens that view
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "library" || t === "voices" || t === "play") setTab(t as Tab);
  }, []);

  const deleteTake = useCallback(
    async (id: number) => {
      try {
        const r = await fetch(`/api/takes/${id}`, { method: "DELETE" });
        if (r.ok) await loadTakes();
      } catch {
        /* stays in the list */
      }
    },
    [loadTakes],
  );

  const reuseTake = useCallback((t: Take) => {
    if (t.voice_id) setSelected(t.voice_id);
    setSeed({
      text: t.text,
      stability: t.stability ?? 0.35,
      style: t.style ?? 0.3,
      speed: t.speed ?? 1,
    });
    setSeedKey((k) => k + 1);
    setTab("play");
  }, []);

  const deleteVoice = useCallback(
    async (id: string) => {
      try {
        const r = await fetch(`/api/voices/${id}`, { method: "DELETE" });
        if (r.ok) {
          if (selected === id) setSelected(FALLBACK_VOICE);
          await loadVoices();
        }
      } catch {
        /* stays in the list */
      }
    },
    [loadVoices, selected],
  );

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding:
            "calc(16px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) 12px max(22px, env(safe-area-inset-left))",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontWeight: 800, fontSize: 20 }}>
          <span className="accent">{">"}</span>
          <span>voices</span>
          <span className="accent" style={{ animation: "blink 1.1s step-end infinite" }}>
            _
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <nav
        style={{
          display: "flex",
          gap: 6,
          padding: "0 22px",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {(
          [
            ["play", "playground"],
            ["library", `library${takes.length ? ` (${takes.length})` : ""}`],
            ["voices", "voices"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="focus-ring"
            aria-current={tab === id}
            style={{
              padding: "8px 4px",
              fontSize: 14,
              fontWeight: tab === id ? 700 : 500,
              color: tab === id ? "var(--main)" : "var(--sub)",
              borderBottom: `2px solid ${tab === id ? "var(--main)" : "transparent"}`,
              marginRight: 12,
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main
        style={{
          flex: 1,
          padding: "22px 22px calc(48px + env(safe-area-inset-bottom))",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {tab === "play" && (
          <Playground
            key={seedKey}
            voices={voices}
            selected={selected}
            onSelect={setSelected}
            canManage={canManage}
            onSaved={loadTakes}
            seed={seed ?? undefined}
          />
        )}

        {tab === "library" && (
          <TakeList
            takes={takes}
            loading={loading}
            onDelete={canManage ? deleteTake : undefined}
            onReuse={reuseTake}
          />
        )}

        {tab === "voices" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {canManage ? (
              <section>
                <div className="dim" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  load your own voice
                </div>
                <AddVoice onAdded={loadVoices} />
              </section>
            ) : (
              <div className="dim" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Loading voices runs locally with an ElevenLabs key. Below are the voices bundled with this deploy.
              </div>
            )}
            <section>
              <div className="dim" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                all voices
              </div>
              <VoicePicker
                voices={voices}
                selected={selected}
                onSelect={setSelected}
                onDelete={canManage ? deleteVoice : undefined}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
