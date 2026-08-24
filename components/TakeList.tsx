"use client";

import { useState } from "react";
import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";
import Player from "./Player";

// The library: every saved take with its voice, the settings it used, a text
// preview, and a player. A take can be reused (its text + settings reload into
// the playground) and deleted (with a 2-step confirm so it isn't accidental).
export default function TakeList({
  takes,
  loading,
  onDelete,
  onReuse,
}: {
  takes: Take[];
  loading: boolean;
  onDelete?: (id: number) => void;
  onReuse?: (take: Take) => void;
}) {
  if (loading) return <div className="dim" style={{ padding: "40px 0", textAlign: "center" }}>loading takes...</div>;

  if (!takes.length)
    return (
      <div className="dim" style={{ padding: "48px 0", textAlign: "center", lineHeight: 1.6 }}>
        No takes yet.
        <br />
        Head to the playground, pick a voice, and press speak.
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {takes.map((t) => (
        <TakeCard key={t.id} t={t} onDelete={onDelete} onReuse={onReuse} />
      ))}
    </div>
  );
}

function TakeCard({
  t,
  onDelete,
  onReuse,
}: {
  t: Take;
  onDelete?: (id: number) => void;
  onReuse?: (take: Take) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 18px", animation: "rise 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <span className="accent" style={{ fontWeight: 700, fontSize: 14 }}>
          {t.voice_name || "Custom"}
        </span>
        <span className="dim" style={{ fontSize: 12 }}>
          {t.char_count ?? t.text.length} chars · {mmss(t.duration_sec ?? 0)}
        </span>
        <Chips t={t} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {onReuse && (
            <button
              onClick={() => onReuse(t)}
              className="focus-ring"
              title="Load this text + settings into the playground"
              style={{ color: "var(--sub)", fontSize: 12, padding: "2px 8px", borderRadius: 8, border: "1px solid var(--sub-alt)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--main)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
            >
              reuse
            </button>
          )}
          {onDelete &&
            (confirming ? (
              <>
                <button
                  onClick={() => onDelete(t.id)}
                  className="focus-ring"
                  style={{ color: "var(--error)", fontSize: 12, fontWeight: 700, padding: "2px 8px" }}
                >
                  delete?
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="focus-ring"
                  style={{ color: "var(--sub)", fontSize: 12, padding: "2px 6px" }}
                >
                  cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                aria-label="Delete take"
                title="Delete take"
                className="focus-ring"
                style={{ color: "var(--sub)", fontSize: 16, lineHeight: 1, width: 22, height: 22 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
              >
                ×
              </button>
            ))}
        </div>
      </div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--text)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {t.text}
      </p>
      <Player src={`/audio/${t.id}.mp3`} />
    </div>
  );
}

// Small monospace chips showing the delivery settings the take was made with.
function Chips({ t }: { t: Take }) {
  const items: [string, number | undefined][] = [
    ["sta", t.stability],
    ["sty", t.style],
    ["spd", t.speed],
  ];
  const shown = items.filter(([, v]) => typeof v === "number");
  if (!shown.length) return null;
  return (
    <span style={{ display: "flex", gap: 5 }}>
      {shown.map(([k, v]) => (
        <span
          key={k}
          className="dim"
          style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "var(--sub-alt)", fontVariantNumeric: "tabular-nums" }}
        >
          {k} {(v as number).toFixed(2)}
        </span>
      ))}
    </span>
  );
}
