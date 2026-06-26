// REST client. Tracks the bearer token in localStorage and attaches it
// to every protected request. Throws on non-2xx; the caller is
// responsible for handling errors (the store provider surfaces them
// as toasts).

const API_BASE = "/api";
const TOKEN_KEY = "trustsfer-token-v1";

let memToken = null;
try {
  memToken = localStorage.getItem(TOKEN_KEY);
} catch (e) {
  /* localStorage unavailable */
}

const listeners = new Set();
function notifyAuthChange() {
  for (const l of listeners) l();
}

export function getToken() {
  return memToken;
}

export function setToken(token) {
  memToken = token || null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    /* ignore */
  }
  notifyAuthChange();
}

export function onAuthChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function request(method, path, body, { auth = true } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth && memToken) headers["Authorization"] = `Bearer ${memToken}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth && memToken) {
    setToken(null);
  }
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    try {
      const j = await res.json();
      if (j.error) msg = j.error;
    } catch (e) {
      /* ignore parse errors */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("GET", "/health", null, { auth: false }),
  login: (username, password) =>
    request("POST", "/auth/login", { username, password }, { auth: false }),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/auth/me"),
  listUsers: () => request("GET", "/auth/users"),
  listRoles: () => request("GET", "/auth/roles"),
  createUser: (u) => request("POST", "/auth/users", u),
  updateUser: (username, patch) =>
    request("PATCH", `/auth/users/${encodeURIComponent(username)}`, patch),
  deleteUser: (username) => request("DELETE", `/auth/users/${encodeURIComponent(username)}`),
  changePassword: (currentPassword, newPassword) =>
    request("POST", "/auth/password", { currentPassword, newPassword }),
  getState: () => request("GET", "/state"),
  addProject: (p) => request("POST", "/projects", p),
  addEvidence: (d) => request("POST", "/evidence", d),
  addContract: (c) => request("POST", "/contracts", c),
  addInvite: (i) => request("POST", "/invites", i),
  generateReport: (tpl) =>
    request("POST", "/reports/generate", { template: tpl.name, fmt: tpl.fmt }),
  patchReport: (id, patch) => request("PATCH", `/reports/${id}`, patch),
  setSignature: (id, status) => request("PATCH", `/signatures/${id}`, { status }),
  decideApproval: (id, decision) =>
    request("PATCH", `/approvals/${id}`, { decision }),
  decideChangeOrder: (id, status) =>
    request("PATCH", `/change-orders/${id}`, { status }),
  dismissConflict: (id) =>
    request("PATCH", `/conflicts/${id}`, { dismissed: true }),
  advanceWorkflow: (id, patch) =>
    request("PATCH", `/workflows/${id}`, patch),
  logAudit: (ev) => request("POST", "/audit", ev),
  reset: () => request("POST", "/reset"),
};
