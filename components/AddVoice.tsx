"use client";

import { useState } from "react";

// Load your own ElevenLabs voice by id. Kept intentionally small: id + name +
// an optional one-line description. On success the parent refreshes the picker.
export default function AddVoice({ onAdded }: { onAdded: () => void }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [descr, setDescr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/voices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id.trim(), name: name.trim(), descr: descr.trim() }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || `Failed (${r.status})`);
        return;
      }
      setId("");
      setName("");
      setDescr("");
      onAdded();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  const field: React.CSSProperties = {
    background: "var(--bg-deep)",
    color: "var(--text)",
    border: "1px solid var(--sub-alt)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Voice name"
          aria-label="Voice name"
          className="focus-ring"
          style={{ ...field, flex: "1 1 140px" }}
        />
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="ElevenLabs voice id"
          aria-label="ElevenLabs voice id"
          className="focus-ring"
          style={{ ...field, flex: "2 1 220px" }}
        />
      </div>
      <input
        value={descr}
        onChange={(e) => setDescr(e.target.value)}
        placeholder="Short description (optional)"
        aria-label="Voice description"
        className="focus-ring"
        style={field}
      />
      {err && (
        <div style={{ color: "var(--error)", fontSize: 13 }}>{err}</div>
      )}
      <button
        type="submit"
        disabled={busy || !id.trim() || !name.trim()}
        className="focus-ring"
        style={{
          alignSelf: "flex-start",
          background: "var(--main)",
          color: "var(--bg)",
          fontWeight: 700,
          padding: "9px 18px",
          borderRadius: 10,
          fontSize: 14,
          opacity: busy || !id.trim() || !name.trim() ? 0.55 : 1,
        }}
      >
        {busy ? "Loading..." : "Load voice"}
      </button>
    </form>
  );
}
