// Authentication & authorization.
//
// Two token flavours are accepted:
//  1. Local HS256 JWTs issued by POST /api/auth/login (bcrypt-verified
//     against the users table).
//  2. Auth0 RS256 JWTs (access or ID tokens) when AUTH0_DOMAIN is
//     configured — verified against the tenant's JWKS, with the user
//     auto-provisioned into the users table on first request.
//
// Authorization is tier-based: L0 < L2 < L3 < L4. Endpoints declare a
// minimum tier via requireTier().

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db, getSingleton, putSingleton } from "./db.js";

function loadOrCreateSecret() {
  if (process.env.TRUSTSFER_JWT_SECRET) return process.env.TRUSTSFER_JWT_SECRET;
  const existing = getSingleton("jwtSecret");
  if (existing && typeof existing === "string") return existing;
  const generated = crypto.randomBytes(48).toString("hex");
  putSingleton("jwtSecret", generated);
  return generated;
}

const SECRET = loadOrCreateSecret();
const TOKEN_TTL = "7d";

export const TIERS = ["L0", "L2", "L3", "L4"];
export const tierRank = (t) => TIERS.indexOf(t);
export const ROLE_TIERS = {
  "Ministry Director": "L4",
  "Donor Representative": "L4",
  Auditor: "L4",
  "Project Engineer": "L3",
  "Procurement Lead": "L3",
  "Field Inspector": "L2",
  "Public Viewer": "L0",
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username      TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    initials      TEXT NOT NULL,
    email         TEXT NOT NULL,
    role          TEXT NOT NULL,
    tier          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    provider      TEXT NOT NULL DEFAULT 'local',
    created_at    INTEGER NOT NULL,
    last_login_at INTEGER
  );
`);
// Older databases predate the provider column.
try {
  db.exec("ALTER TABLE users ADD COLUMN provider TEXT NOT NULL DEFAULT 'local'");
} catch (e) {
  /* column already exists */
}

const stmts = {
  insertUser: db.prepare(
    "INSERT OR IGNORE INTO users (username, name, initials, email, role, tier, password_hash, provider, created_at) " +
      "VALUES (@username, @name, @initials, @email, @role, @tier, @password_hash, @provider, @created_at)"
  ),
  getUser: db.prepare("SELECT * FROM users WHERE username = ?"),
  touchLogin: db.prepare("UPDATE users SET last_login_at = ? WHERE username = ?"),
  setPassword: db.prepare("UPDATE users SET password_hash = ? WHERE username = ?"),
  setProfile: db.prepare("UPDATE users SET name = ?, email = ? WHERE username = ?"),
  deleteUser: db.prepare("DELETE FROM users WHERE username = ?"),
  listUsers: db.prepare(
    "SELECT username, name, initials, email, role, tier, provider, last_login_at FROM users ORDER BY username"
  ),
  countTier: db.prepare("SELECT COUNT(*) AS n FROM users WHERE tier = 'L4'"),
};

const initialsOf = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";

function publicUser(row) {
  return {
    username: row.username,
    name: row.name,
    initials: row.initials,
    email: row.email,
    role: row.role,
    tier: row.tier,
    provider: row.provider || "local",
    lastLoginAt: row.last_login_at || null,
  };
}

// ── local accounts ─────────────────────────────────────────────────────────

export function ensureUserSeeded({ username, name, initials, email, role, tier, password }) {
  stmts.insertUser.run({
    username,
    name,
    initials,
    email,
    role,
    tier,
    password_hash: bcrypt.hashSync(password, 10),
    provider: "local",
    created_at: Date.now(),
  });
}

export function createUser({ username, name, email, role, tier, password }) {
  if (!/^[a-z0-9_.-]{2,40}$/i.test(username || "")) {
    const err = new Error("Username must be 2-40 chars (letters, digits, _ . -)");
    err.status = 400;
    throw err;
  }
  if (!password || password.length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  if (stmts.getUser.get(username)) {
    const err = new Error("Username already exists");
    err.status = 409;
    throw err;
  }
  const resolvedTier = TIERS.includes(tier) ? tier : ROLE_TIERS[role] || "L2";
  stmts.insertUser.run({
    username,
    name: name || username,
    initials: initialsOf(name || username),
    email: email || "",
    role: role || "Field Inspector",
    tier: resolvedTier,
    password_hash: bcrypt.hashSync(password, 10),
    provider: "local",
    created_at: Date.now(),
  });
  return findUser(username);
}

export function deleteUser(username, actingUsername) {
  const target = stmts.getUser.get(username);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (username === actingUsername) {
    const err = new Error("You cannot delete your own account");
    err.status = 400;
    throw err;
  }
  if (target.tier === "L4" && stmts.countTier.get().n <= 1) {
    const err = new Error("Cannot delete the last L4 administrator");
    err.status = 400;
    throw err;
  }
  stmts.deleteUser.run(username);
  return true;
}

export function changePassword(username, currentPassword, nextPassword) {
  const row = stmts.getUser.get(username);
  if (!row) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if ((row.provider || "local") !== "local") {
    const err = new Error("This account is managed by Auth0 — change the password there.");
    err.status = 400;
    throw err;
  }
  if (!bcrypt.compareSync(currentPassword || "", row.password_hash)) {
    const err = new Error("Current password is incorrect");
    err.status = 401;
    throw err;
  }
  if (!nextPassword || nextPassword.length < 8) {
    const err = new Error("New password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  stmts.setPassword.run(bcrypt.hashSync(nextPassword, 10), username);
  return true;
}

export function authenticate(username, password) {
  const row = stmts.getUser.get(username);
  if (!row) return null;
  if ((row.provider || "local") !== "local") return null;
  if (!bcrypt.compareSync(password, row.password_hash)) return null;
  stmts.touchLogin.run(Date.now(), username);
  return publicUser({ ...row, last_login_at: Date.now() });
}

export function issueToken(user) {
  return jwt.sign({ sub: user.username, role: user.role, tier: user.tier }, SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function findUser(username) {
  const row = stmts.getUser.get(username);
  return row ? publicUser(row) : null;
}

export function listUsers() {
  return stmts.listUsers.all().map(publicUser);
}

// ── Auth0 (RS256) ──────────────────────────────────────────────────────────

// Configuration. AUTH0_DOMAIN like "your-tenant.us.auth0.com" (no scheme).
// Falls back to the VITE_-prefixed variants so a single .env works for
// both the client and the server.
const AUTH0_DOMAIN = (process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const AUTH0_AUDIENCES = [
  process.env.AUTH0_AUDIENCE,
  process.env.VITE_AUTH0_AUDIENCE,
  process.env.AUTH0_CLIENT_ID,
  process.env.VITE_AUTH0_CLIENT_ID,
].filter(Boolean);
// Emails granted L4 on first sign-in; everyone else lands at the default.
const AUTH0_ADMIN_EMAILS = (process.env.AUTH0_ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const AUTH0_DEFAULT_TIER = TIERS.includes(process.env.AUTH0_DEFAULT_TIER)
  ? process.env.AUTH0_DEFAULT_TIER
  : "L4";
const AUTH0_DEFAULT_ROLE = process.env.AUTH0_DEFAULT_ROLE || "Auditor";

export const auth0Enabled = () => Boolean(AUTH0_DOMAIN);

// JWKS cache: kid → PEM public key. Re-fetched when an unknown kid shows
// up (key rotation) but at most once every 30s to avoid hammering.
let jwksKeys = new Map();
let jwksFetchedAt = 0;

async function getAuth0Key(kid) {
  if (jwksKeys.has(kid)) return jwksKeys.get(kid);
  if (Date.now() - jwksFetchedAt < 30_000) return null;
  jwksFetchedAt = Date.now();
  const res = await fetch(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const { keys } = await res.json();
  jwksKeys = new Map(
    (keys || []).map((k) => [
      k.kid,
      crypto.createPublicKey({ key: k, format: "jwk" }).export({ type: "spki", format: "pem" }),
    ])
  );
  return jwksKeys.get(kid) || null;
}

async function verifyAuth0Token(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || decoded.header.alg !== "RS256") return null;
    const pem = await getAuth0Key(decoded.header.kid);
    if (!pem) return null;
    const opts = { algorithms: ["RS256"], issuer: `https://${AUTH0_DOMAIN}/` };
    if (AUTH0_AUDIENCES.length) opts.audience = AUTH0_AUDIENCES;
    return jwt.verify(token, pem, opts);
  } catch (e) {
    // Unknown kid, JWKS unreachable, bad signature, expired — all mean
    // "not a valid Auth0 token for us", which the caller treats as 401.
    return null;
  }
}

// Provision (or refresh) a local user row for an Auth0 identity so the
// rest of the platform — audit attribution, sessions table, tiers —
// treats it like any other account.
function upsertAuth0User(claims) {
  const username = `auth0|${(claims.sub || "").split("|").pop()}`.slice(0, 64);
  const email = (claims.email || "").toLowerCase();
  const name = claims.name || claims.nickname || email || username;
  const existing = stmts.getUser.get(username);
  if (existing) {
    stmts.touchLogin.run(Date.now(), username);
    if (name !== existing.name || (email && email !== existing.email)) {
      stmts.setProfile.run(name, email || existing.email, username);
    }
    return publicUser({ ...existing, name, email: email || existing.email, last_login_at: Date.now() });
  }
  const tier = AUTH0_ADMIN_EMAILS.includes(email) ? "L4" : AUTH0_DEFAULT_TIER;
  const role = tier === "L4" ? AUTH0_DEFAULT_ROLE : "Field Inspector";
  stmts.insertUser.run({
    username,
    name,
    initials: initialsOf(name),
    email,
    role,
    tier,
    password_hash: "(auth0)",
    provider: "auth0",
    created_at: Date.now(),
  });
  stmts.touchLogin.run(Date.now(), username);
  return findUser(username);
}

// ── middleware ─────────────────────────────────────────────────────────────

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

export async function resolveUser(token) {
  // Local token first (cheap, no network).
  const local = verifyToken(token);
  if (local) return findUser(local.sub);
  // Auth0 token second.
  if (auth0Enabled()) {
    const claims = await verifyAuth0Token(token);
    if (claims) return upsertAuth0User(claims);
  }
  return null;
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match) return res.status(401).json({ error: "Missing authentication" });
  resolveUser(match[1])
    .then((user) => {
      if (!user) return res.status(401).json({ error: "Invalid or expired token" });
      req.user = user;
      next();
    })
    .catch(next);
}

export function requireTier(minTier) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Missing authentication" });
    if (tierRank(req.user.tier) < tierRank(minTier)) {
      return res.status(403).json({
        error: `Requires access tier ${minTier} — your role (${req.user.role} · ${req.user.tier}) cannot perform this action.`,
      });
    }
    next();
  };
}
