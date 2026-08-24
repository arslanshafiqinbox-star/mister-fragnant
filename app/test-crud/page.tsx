"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  ok: boolean;
  connected?: boolean;
  count?: number;
  rows?: Row[];
  message?: string;
  details?: unknown;
};

export default function TestCrudPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string>("Checking connection…");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/test-crud");
    const json = (await res.json()) as ListResponse;
    if (!res.ok || !json.ok) {
      setStatus("Not connected");
      setError(json.message ?? `HTTP ${res.status}`);
      setRows([]);
      return;
    }
    setStatus(`Connected — ${json.count ?? 0} row(s)`);
    setRows(json.rows ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createRow(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/test-crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: body || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message ?? "Create failed");
        return;
      }
      setTitle("");
      setBody("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function updateRow(row: Row) {
    const nextTitle = window.prompt("New title", row.title);
    if (nextTitle == null || !nextTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/test-crud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, title: nextTitle.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message ?? "Update failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteRow(id: string) {
    if (!window.confirm("Delete this row?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/test-crud?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message ?? "Delete failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "2rem 1.25rem 4rem",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>
        MongoDB connection test
      </h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        CRUD against <code>fragnance.connection_tests</code> to verify the DB is
        wired up.
      </p>

      <p
        style={{
          padding: "0.75rem 1rem",
          background: error ? "#fde8e8" : "#e8f5e9",
          borderRadius: 6,
          marginBottom: "1.25rem",
        }}
      >
        <strong>{status}</strong>
        {error ? (
          <>
            <br />
            <span style={{ color: "#b00020", fontSize: "0.9rem" }}>{error}</span>
          </>
        ) : null}
      </p>

      <form
        onSubmit={createRow}
        style={{
          display: "grid",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          style={{ padding: "0.6rem 0.75rem", fontSize: "1rem" }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (optional)"
          rows={3}
          style={{ padding: "0.6rem 0.75rem", fontSize: "1rem" }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            justifySelf: "start",
            padding: "0.55rem 1.1rem",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          Create
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rows.map((row) => (
          <li
            key={row.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.85rem 0",
              borderTop: "1px solid #ddd",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{row.title}</div>
              {row.body ? (
                <div style={{ color: "#555", fontSize: "0.9rem" }}>{row.body}</div>
              ) : null}
              <div style={{ color: "#888", fontSize: "0.75rem", marginTop: 4 }}>
                {row.id}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "start" }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateRow(row)}
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void deleteRow(row.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !error ? (
          <li style={{ color: "#888", paddingTop: "0.5rem" }}>No rows yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
