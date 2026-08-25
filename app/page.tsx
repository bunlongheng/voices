"use client";

import { useCallback, useEffect, useState } from "react";
import type { Take } from "@/lib/types";
import TakeBubbles from "@/components/TakeBubbles";
import TakeDetail from "@/components/TakeDetail";
import { assignColors } from "@/lib/colors";

export default function App() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  // true only when the writable local API served the data - the static Vercel
  // deploy reads takes.json, where delete just 401s. Gates the delete control.
  const [canManage, setCanManage] = useState(false);

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

  // shareable deep-link: /?take=<id> opens that take's detail
  useEffect(() => {
    const q = Number(new URLSearchParams(window.location.search).get("take"));
    if (q) setOpenId(q);
  }, []);

  const colors = assignColors(takes);
  const open = openId != null ? takes.find((t) => t.id === openId) ?? null : null;
  if (open)
    return (
      <TakeDetail
        take={open}
        color={colors[open.id]}
        onBack={() => setOpenId(null)}
        onDelete={
          canManage
            ? async (id) => {
                await deleteTake(id);
                setOpenId(null);
              }
            : undefined
        }
      />
    );

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding:
            "calc(18px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) 8px max(22px, env(safe-area-inset-left))",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: 0.5 }}>voices</span>
        {takes.length > 0 && (
          <span className="dim" style={{ fontSize: 13 }}>
            {takes.length}
          </span>
        )}
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          padding: "8px 22px calc(48px + env(safe-area-inset-bottom))",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <TakeBubbles takes={takes} colors={colors} loading={loading} onOpen={(t) => setOpenId(t.id)} />
      </main>
    </div>
  );
}
