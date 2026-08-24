import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
// Synthesized audio lives under public/ so Next serves it as STATIC files with
// native Range/206 support - the only thing iOS Safari <audio> reliably plays.
const PUB_AUDIO = join(process.cwd(), "public", "audio");

// Lazy singleton. We must NOT open the database at module load: the Vercel
// production build imports these route modules but never runs a query, and
// better-sqlite3's native destructor can abort the build worker on teardown.
// Opening only on first real use keeps the build from touching the native addon.
let _db: Database.Database | null = null;
function init(): Database.Database {
  if (_db) return _db;
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(PUB_AUDIO, { recursive: true });
  const d = new Database(join(DATA_DIR, "voices.db"));
  d.pragma("journal_mode = WAL");
  d.exec(`
CREATE TABLE IF NOT EXISTS takes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  text         TEXT NOT NULL,
  voice_id     TEXT,
  voice_name   TEXT,
  has_audio    INTEGER DEFAULT 0,
  duration_sec REAL,
  char_count   INTEGER,
  stability    REAL DEFAULT 0.35,
  style        REAL DEFAULT 0.3,
  speed        REAL DEFAULT 1,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS voices (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  descr      TEXT,
  custom     INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
`);
  _db = d;
  return d;
}

// Proxy so callers keep using `db.prepare(...)` unchanged, but the real
// connection is created on first property access (request time), never at build.
const db = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const real = init() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

// on-disk paths (written by the API) + public URLs (read by the browser)
export const audioPath = (id: number | string) => join(PUB_AUDIO, `${id}.mp3`);
export const audioUrl = (id: number | string) => `/audio/${id}.mp3`;

export type TakeRow = {
  id: number;
  text: string;
  voice_id: string | null;
  voice_name: string | null;
  has_audio: number;
  duration_sec: number | null;
  char_count: number | null;
  stability: number;
  style: number;
  speed: number;
  created_at: string;
};

export type VoiceRow = {
  id: string;
  name: string;
  descr: string | null;
  custom: number;
  created_at: string;
};

export default db;
