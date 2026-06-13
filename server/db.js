// SQLite persistence layer. Each app collection is stored row-per-record
// in a generic `kv` table; `singletons` exists for genuinely scalar app
// state (currently just the JWT signing secret).

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pick a writable location for the SQLite file. On serverless hosts
// (Vercel, AWS Lambda) the deployment filesystem is read-only and only
// /tmp is writable — and that storage is ephemeral, so data resets on a
// cold start. Set TRUSTSFER_DB to a mounted volume or hosted database
// path for durable persistence.
const ON_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DEFAULT_DB = ON_SERVERLESS
  ? path.join("/tmp", "trustsfer-data.db")
  : path.join(__dirname, "..", "data.db");
const DB_PATH = process.env.TRUSTSFER_DB || DEFAULT_DB;
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
  countCollection: db.prepare("SELECT COUNT(*) AS n FROM kv WHERE collection = ?"),
  deleteRow: db.prepare("DELETE FROM kv WHERE collection = ? AND id = ?"),
  truncateCollection: db.prepare("DELETE FROM kv WHERE collection = ?"),
  getSingleton: db.prepare("SELECT data FROM singletons WHERE key = ?"),
  putSingleton: db.prepare(
    "INSERT INTO singletons (key, data) VALUES (?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET data = excluded.data"
  ),
  delAllKv: db.prepare("DELETE FROM kv"),
};

// Collections in priority/insertion order. Row order in /api/state
// reflects this list so the client receives stable ordering.
export const COLLECTIONS = [
  "projects",
  "contracts",
  "evidence",
  "auditEvents",
  "conflicts",
  "approvals",
  "signatures",
  "changeOrders",
  "workflows",
  "ledger",
  "invites",
  "reports",
];

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

export function deleteRow(collection, id) {
  return stmts.deleteRow.run(collection, id).changes > 0;
}

export function listCollection(collection) {
  return stmts.selectCollection.all(collection).map((r) => JSON.parse(r.data));
}

export function countCollection(collection) {
  return stmts.countCollection.get(collection).n;
}

export function getSingleton(key) {
  const row = stmts.getSingleton.get(key);
  return row ? JSON.parse(row.data) : null;
}

export function putSingleton(key, value) {
  stmts.putSingleton.run(key, JSON.stringify(value));
  return value;
}

export function snapshot() {
  const out = {};
  for (const c of COLLECTIONS) out[c] = listCollection(c);
  return out;
}

// Re-seedable reset. Clears the kv data but preserves auth state in
// singletons (notably the JWT secret) so existing tokens stay valid.
export const resetAll = db.transaction(() => {
  stmts.delAllKv.run();
});

export function tx(fn) {
  return db.transaction(fn)();
}

// ── seeding ───────────────────────────────────────────────────────────────

// Seed rows are inserted with a synthetic created_at so the ORDER BY
// preserves the source array order in the seed module.
function seedRows(collection, rows) {
  if (countCollection(collection) > 0) return 0;
  const insert = db.prepare(
    "INSERT INTO kv (collection, id, data, created_at) VALUES (?, ?, ?, ?)"
  );
  const tx = db.transaction((items) => {
    const base = Date.now();
    items.forEach((row, i) => {
      // Reverse index so the first item ends up most recent.
      insert.run(collection, row.id, JSON.stringify(row), base + (items.length - i));
    });
  });
  tx(rows);
  return rows.length;
}

export async function seedFromModule(seedModule, authModule) {
  const tally = {};
  tally.projects = seedRows("projects", seedModule.SEED_PROJECTS);
  tally.contracts = seedRows("contracts", seedModule.SEED_CONTRACTS);
  tally.conflicts = seedRows(
    "conflicts",
    seedModule.SEED_CONFLICTS.map((c) => ({ ...c, dismissed: false }))
  );
  tally.approvals = seedRows(
    "approvals",
    seedModule.SEED_APPROVALS.map((a) => ({ ...a, decision: null }))
  );
  tally.signatures = seedRows("signatures", seedModule.SEED_SIGNATURES);
  tally.changeOrders = seedRows("changeOrders", seedModule.SEED_CHANGE_ORDERS);
  tally.workflows = seedRows("workflows", seedModule.SEED_WORKFLOWS);
  tally.ledger = seedRows("ledger", seedModule.SEED_LEDGER);
  tally.reports = seedRows("reports", seedModule.SEED_REPORTS);

  for (const u of seedModule.SEED_USERS) authModule.ensureUserSeeded(u);
  tally.users = seedModule.SEED_USERS.length;

  return tally;
}
