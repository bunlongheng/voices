"use client";

import { useCallback, useEffect, useState } from "react";
import type { Take } from "@/lib/types";
import TakeBubbles from "@/components/TakeBubbles";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import Ambient from "@/components/Ambient";

export default function App() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  // true only when the writable local API served the data - the static Vercel
  // deploy reads takes.json, where delete just 401s. Gates the delete control.
  const [canManage, setCanManage] = useState(false);
  const [theme, toggleTheme] = useTheme();

  // Load takes from the API (live DB locally, committed manifest on Vercel); the
  // x-voices-writable header says whether this deploy can manage them.
  // /takes.json is a last-ditch fallback if the API is unreachable.
  const loadTakes = useCallback(async () => {
    try {
      const r = await fetch("/api/takes", { cache: "no-store" });
      if (r.ok) {
        const d = (await r.json()) as Take[];
        if (Array.isArray(d)) {
          setTakes(d);
          setCanManage(r.headers.get("x-voices-writable") === "1");
          setLoading(false);
          return;
        }
      }
    } catch {
      /* fall through to the static manifest */
    }
    try {
      const r = await fetch("/takes.json", { cache: "no-store" });
      if (r.ok) {
        const d = (await r.json()) as Take[];
        if (Array.isArray(d)) {
          setTakes(d);
          setCanManage(false);
        }
      }
    } catch {
      /* nothing to show */
    }
    setLoading(false);
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

  useEffect(() => {
    loadTakes();
  }, [loadTakes]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding:
            "calc(16px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) 16px max(22px, env(safe-area-inset-left))",
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
        {takes.length > 0 && (
          <span className="dim" style={{ fontSize: 13 }}>
            {takes.length} {takes.length === 1 ? "take" : "takes"}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <Ambient />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: "16px 22px calc(48px + env(safe-area-inset-bottom))",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <TakeBubbles takes={takes} loading={loading} onDelete={canManage ? deleteTake : undefined} />
      </main>
    </div>
  );
}
