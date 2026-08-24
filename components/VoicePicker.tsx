"use client";

import type { Voice } from "@/lib/types";

// A grid of selectable voice chips. Custom (loaded) voices carry a "yours" badge
// and, when management is allowed, a delete affordance.
export default function VoicePicker({
  voices,
  selected,
  onSelect,
  onDelete,
}: {
  voices: Voice[];
  selected: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 10,
      }}
    >
      {voices.map((v) => {
        const active = v.id === selected;
        return (
          <div
            key={v.id}
            onClick={() => onSelect(v.id)}
            className="focus-ring"
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(v.id))}
            style={{
              position: "relative",
              padding: "12px 14px",
              borderRadius: 12,
              background: active ? "var(--card-hi)" : "var(--card)",
              border: `1px solid ${active ? "var(--main)" : "transparent"}`,
              cursor: "pointer",
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: active ? "var(--main)" : "var(--text)" }}>
                {v.name}
              </span>
              {v.custom === 1 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: "var(--main)",
                    color: "var(--bg)",
                    fontWeight: 700,
                  }}
                >
                  yours
                </span>
              )}
            </div>
            <div className="dim" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.3 }}>
              {v.descr || v.id}
            </div>

            {onDelete && v.custom === 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(v.id);
                }}
                aria-label={`Remove ${v.name}`}
                title="Remove voice"
                className="focus-ring"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  color: "var(--sub)",
                  fontSize: 14,
                  lineHeight: 1,
                  width: 20,
                  height: 20,
                  display: "grid",
                  placeItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
