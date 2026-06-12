// SQLite persistence layer. Each app collection (projects, evidence, …)
// is stored row-per-record in a generic `kv` table; the small per-id maps
// (signature overrides, approval decisions, etc.) live as JSON blobs in
// `singletons`. This keeps the schema trivial while preserving atomic
// row-level inserts where they matter.

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.TRUSTSFER_DB || path.join(__dirname, "..", "data.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    collection TEXT NOT NULL,
    id         TEXT NOT NULL,
    data       TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (collection, id)
  );
  CREATE INDEX IF NOT EXISTS idx_kv_collection_created
    ON kv (collection, created_at DESC);

  CREATE TABLE IF NOT EXISTS singletons (
    key  TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

const stmts = {
  insertRow: db.prepare(
    "INSERT OR REPLACE INTO kv (collection, id, data, created_at) VALUES (?, ?, ?, ?)"
  ),
  updateRow: db.prepare("UPDATE kv SET data = ? WHERE collection = ? AND id = ?"),
  selectRow: db.prepare("SELECT data FROM kv WHERE collection = ? AND id = ?"),
  selectCollection: db.prepare(
    "SELECT id, data, created_at FROM kv WHERE collection = ? ORDER BY created_at DESC"
  ),
  truncateCollection: db.prepare("DELETE FROM kv WHERE collection = ?"),
  getSingleton: db.prepare("SELECT data FROM singletons WHERE key = ?"),
  putSingleton: db.prepare(
    "INSERT INTO singletons (key, data) VALUES (?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET data = excluded.data"
  ),
  delAllKv: db.prepare("DELETE FROM kv"),
  delAllSingletons: db.prepare("DELETE FROM singletons"),
};

export const COLLECTIONS = [
  "projects",
  "evidence",
  "auditEvents",
  "contracts",
  "invites",
  "reports",
];

export const SINGLETONS = [
  "sigOverrides",
  "approvals",
  "dismissedConflicts",
  "changeOrders",
];

const SINGLETON_DEFAULTS = {
  sigOverrides: {},
  approvals: {},
  dismissedConflicts: [],
  changeOrders: {},
};

export function insertRow(collection, row) {
  if (!row.id) throw new Error("row.id required");
  stmts.insertRow.run(collection, row.id, JSON.stringify(row), Date.now());
  return row;
}

export function updateRow(collection, id, patch) {
  const existing = stmts.selectRow.get(collection, id);
  if (!existing) return null;
  const merged = { ...JSON.parse(existing.data), ...patch };
  stmts.updateRow.run(JSON.stringify(merged), collection, id);
  return merged;
}

export function listCollection(collection) {
  return stmts.selectCollection.all(collection).map((r) => JSON.parse(r.data));
}

export function getSingleton(key) {
  const row = stmts.getSingleton.get(key);
  return row ? JSON.parse(row.data) : SINGLETON_DEFAULTS[key];
}

export function putSingleton(key, value) {
  stmts.putSingleton.run(key, JSON.stringify(value));
  return value;
}

// Read the whole workspace in one round-trip. Cheap at this scale and
// keeps the client provider's hydration logic identical to the prior
// localStorage path.
export function snapshot() {
  const out = {};
  for (const c of COLLECTIONS) out[c] = listCollection(c);
  for (const s of SINGLETONS) out[s] = getSingleton(s);
  return out;
}

export const resetAll = db.transaction(() => {
  stmts.delAllKv.run();
  stmts.delAllSingletons.run();
});

// Many actions both insert a row in one collection and append an audit
// event. Caller passes a function that runs synchronously inside a tx.
export function tx(fn) {
  return db.transaction(fn)();
}
