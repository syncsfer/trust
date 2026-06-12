// Authentication primitives: bcrypt password hashing, JWT issuance and
// verification, and an Express middleware that gates the protected
// surface. The signing secret comes from TRUSTSFER_JWT_SECRET in the
// environment; if absent we generate one once and persist it as a
// singleton row so reissued tokens stay valid across restarts.

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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username      TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    initials      TEXT NOT NULL,
    email         TEXT NOT NULL,
    role          TEXT NOT NULL,
    tier          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    last_login_at INTEGER
  );
`);

const stmts = {
  insertUser: db.prepare(
    "INSERT OR IGNORE INTO users (username, name, initials, email, role, tier, password_hash, created_at) " +
      "VALUES (@username, @name, @initials, @email, @role, @tier, @password_hash, @created_at)"
  ),
  getUser: db.prepare("SELECT * FROM users WHERE username = ?"),
  touchLogin: db.prepare("UPDATE users SET last_login_at = ? WHERE username = ?"),
  listUsers: db.prepare("SELECT username, name, initials, email, role, tier, last_login_at FROM users ORDER BY username"),
};

export function ensureUserSeeded({ username, name, initials, email, role, tier, password }) {
  const hash = bcrypt.hashSync(password, 10);
  stmts.insertUser.run({
    username,
    name,
    initials,
    email,
    role,
    tier,
    password_hash: hash,
    created_at: Date.now(),
  });
}

function publicUser(row) {
  return {
    username: row.username,
    name: row.name,
    initials: row.initials,
    email: row.email,
    role: row.role,
    tier: row.tier,
    lastLoginAt: row.last_login_at || null,
  };
}

export function authenticate(username, password) {
  const row = stmts.getUser.get(username);
  if (!row) return null;
  if (!bcrypt.compareSync(password, row.password_hash)) return null;
  stmts.touchLogin.run(Date.now(), username);
  return publicUser({ ...row, last_login_at: Date.now() });
}

export function issueToken(user) {
  return jwt.sign({ sub: user.username, role: user.role, tier: user.tier }, SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

export function findUser(username) {
  const row = stmts.getUser.get(username);
  return row ? publicUser(row) : null;
}

export function listUsers() {
  return stmts.listUsers.all().map((r) => ({
    username: r.username,
    name: r.name,
    initials: r.initials,
    email: r.email,
    role: r.role,
    tier: r.tier,
    lastLoginAt: r.last_login_at || null,
  }));
}

// Middleware: extracts the bearer token, attaches req.user. Pass a
// truthy `optional` flag to allow anonymous fall-through (e.g. on the
// health endpoint).
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match) return res.status(401).json({ error: "Missing authentication" });
  const claims = verifyToken(match[1]);
  if (!claims) return res.status(401).json({ error: "Invalid or expired token" });
  const user = findUser(claims.sub);
  if (!user) return res.status(401).json({ error: "User no longer exists" });
  req.user = user;
  next();
}
