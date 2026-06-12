// Thin fetch wrapper for the TrustSfer REST API. Returns parsed JSON or
// throws an Error with the server message. The store provider handles
// success / failure and falls back to local-only mode if the API can't
// be reached.

const API_BASE = "/api";

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    try {
      const j = await res.json();
      if (j.error) msg = j.error;
    } catch (e) {
      /* ignore parse errors */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("GET", "/health"),
  getState: () => request("GET", "/state"),
  addProject: (p) => request("POST", "/projects", p),
  addEvidence: (d) => request("POST", "/evidence", d),
  addContract: (c) => request("POST", "/contracts", c),
  addInvite: (i) => request("POST", "/invites", i),
  generateReport: (tpl) =>
    request("POST", "/reports/generate", { template: tpl.name, fmt: tpl.fmt }),
  setSignature: (id, payload) => request("PUT", `/signatures/${id}`, payload),
  decideApproval: (id, payload) => request("PUT", `/approvals/${id}`, payload),
  decideChangeOrder: (id, payload) =>
    request("PUT", `/change-orders/${id}`, payload),
  dismissConflict: (id, payload) =>
    request("POST", `/conflicts/${id}/dismiss`, payload),
  logAudit: (ev) => request("POST", "/audit", ev),
  reset: () => request("POST", "/reset"),
};
