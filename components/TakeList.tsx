"use client";

import type { Take } from "@/lib/types";
import { mmss } from "@/lib/types";
import Player from "./Player";

// The library: every saved take with its voice, a text preview, and a player.
export default function TakeList({
  takes,
  loading,
  onDelete,
}: {
  takes: Take[];
  loading: boolean;
  onDelete?: (id: number) => void;
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
        <div
          key={t.id}
          style={{ background: "var(--card)", borderRadius: 14, padding: "16px 18px", animation: "rise 0.25s ease" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span className="accent" style={{ fontWeight: 700, fontSize: 14 }}>
              {t.voice_name || "Custom"}
            </span>
            <span className="dim" style={{ fontSize: 12 }}>
              {t.char_count ?? t.text.length} chars · {mmss(t.duration_sec ?? 0)}
            </span>
            {onDelete && (
              <button
                onClick={() => onDelete(t.id)}
                aria-label="Delete take"
                title="Delete take"
                className="focus-ring"
                style={{ marginLeft: "auto", color: "var(--sub)", fontSize: 16, lineHeight: 1, width: 22, height: 22 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
              >
                ×
              </button>
            )}
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
      ))}
    </div>
  );
}
