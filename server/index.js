// TrustSfer REST API. Mirrors the action surface of the client store
// and serves the built front-end in production.

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  COLLECTIONS,
  insertRow,
  updateRow,
  deleteRow,
  listCollection,
  snapshot,
  resetAll,
  seedFromModule,
  tx,
} from "./db.js";
import * as seed from "./seed.js";
import * as auth from "./auth.js";
import { requireAuth, authenticate, issueToken, findUser, listUsers } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── seed on boot ───────────────────────────────────────────────────────────

const seeded = await seedFromModule(seed, auth);
const totalSeeded = Object.values(seeded).reduce((s, n) => s + n, 0);
if (totalSeeded > 0) {
  console.log("[seed]", seeded);
}

// ── helpers ────────────────────────────────────────────────────────────────

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const requireFields = (body, fields) => {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null) {
      const err = new Error(`Missing field: ${f}`);
      err.status = 400;
      throw err;
    }
  }
};

function appendAudit(actor, ev) {
  const row = {
    id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: ev.ts || "just now",
    pid: ev.pid || "ALL",
    flag: ev.flag || "🏳️",
    country: ev.country || "—",
    actor: actor ? `${actor.name} · ${ev.actor || actor.role}` : ev.actor,
    label: ev.label,
    tone: ev.tone,
    text: ev.text,
    hash: ev.hash,
  };
  insertRow("auditEvents", row);
  return row;
}

function projectFor(pid) {
  if (!pid || pid === "ALL") return null;
  return listCollection("projects").find((p) => p.id === pid) || null;
}

function pidCtx(pid) {
  const p = projectFor(pid);
  return { pid, flag: p?.flag || "🏳️", country: p?.country || "—" };
}

// ── public routes ─────────────────────────────────────────────────────────

app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: Date.now(), seeded: totalSeeded > 0 })
);

app.post(
  "/api/auth/login",
  wrap((req, res) => {
    const { username, password } = req.body || {};
    requireFields(req.body || {}, ["username", "password"]);
    const user = authenticate(username, password);
    if (!user) return res.status(401).json({ error: "Invalid username or password" });
    const token = issueToken(user);
    appendAudit(user, {
      label: "APPROVAL",
      tone: "info",
      text: `${user.name} signed in.`,
      hash: `0x${user.username}-login-${Date.now().toString(16)}`,
      actor: `${user.role} · identity layer`,
    });
    res.json({ token, user });
  })
);

app.post(
  "/api/auth/logout",
  requireAuth,
  wrap((req, res) => {
    appendAudit(req.user, {
      label: "APPROVAL",
      tone: "info",
      text: `${req.user.name} signed out.`,
      hash: `0x${req.user.username}-logout-${Date.now().toString(16)}`,
      actor: `${req.user.role} · identity layer`,
    });
    res.json({ ok: true });
  })
);

app.get(
  "/api/auth/me",
  requireAuth,
  wrap((req, res) => res.json(req.user))
);

app.get(
  "/api/auth/users",
  requireAuth,
  wrap((req, res) => res.json(listUsers()))
);

// ── protected: state read ──────────────────────────────────────────────────

app.get(
  "/api/state",
  requireAuth,
  wrap((req, res) => {
    res.json({ ...snapshot(), me: req.user, users: listUsers() });
  })
);

app.get(
  "/api/collections/:name",
  requireAuth,
  wrap((req, res) => {
    if (!COLLECTIONS.includes(req.params.name)) {
      return res.status(404).json({ error: "Unknown collection" });
    }
    res.json(listCollection(req.params.name));
  })
);

// ── protected: mutations ──────────────────────────────────────────────────

app.post(
  "/api/projects",
  requireAuth,
  wrap((req, res) => {
    const project = req.body;
    requireFields(project, ["id", "name", "country"]);
    tx(() => {
      insertRow("projects", project);
      appendAudit(req.user, {
        ...pidCtx(project.id),
        flag: project.flag,
        country: project.country,
        actor: "Portfolio Admin · console",
        label: "MILESTONE",
        tone: "info",
        text: `Registered project "${project.name}" — envelope ${project.budget}, donor ${project.donor}.`,
        hash: `0x${project.id}-reg`,
      });
    });
    res.status(201).json(project);
  })
);

app.post(
  "/api/evidence",
  requireAuth,
  wrap((req, res) => {
    const d = req.body;
    requireFields(d, ["pid", "kind", "cle"]);
    const row = {
      id: `u${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      kind: d.kind,
      actor: d.actor || req.user.role,
      pid: d.pid,
      country: d.country,
      flag: d.flag,
      hash: d.cle,
      block: d.block,
      t: "just now",
      isNew: true,
    };
    tx(() => {
      insertRow("evidence", row);
      appendAudit(req.user, {
        ...pidCtx(d.pid),
        flag: d.flag,
        country: d.country,
        actor: `${d.actor || req.user.role} · field upload`,
        label: d.kind,
        tone: d.kind === "EVIDENCE" ? "verified" : d.kind === "PAYMENT" ? "plum" : "info",
        text: `Anchored ${d.files?.length || 0} evidence file(s) for ${d.milestone} — CLE created and Merkle-batched.`,
        hash: d.cle,
      });
    });
    res.status(201).json(row);
  })
);

app.post(
  "/api/contracts",
  requireAuth,
  wrap((req, res) => {
    const c = req.body;
    requireFields(c, ["id", "pid", "title"]);
    tx(() => {
      insertRow("contracts", c);
      appendAudit(req.user, {
        ...pidCtx(c.pid),
        actor: "Procurement Lead · console",
        label: "MILESTONE",
        tone: "plum",
        text: `Awarded contract "${c.title}" to ${c.contractor} — value ${c.value} via ${c.method}.`,
        hash: `0x${c.id}-award`,
      });
    });
    res.status(201).json(c);
  })
);

app.post(
  "/api/invites",
  requireAuth,
  wrap((req, res) => {
    const inv = req.body;
    requireFields(inv, ["id", "type", "org", "project"]);
    tx(() => {
      insertRow("invites", inv);
      appendAudit(req.user, {
        ...pidCtx(inv.project),
        actor: "Identity Admin · console",
        label: "APPROVAL",
        tone: "info",
        text: `Invited ${inv.org} (${inv.type}) as ${inv.role} · ${inv.tier} on ${inv.project}.`,
        hash: `0x${inv.id}-inv`,
      });
    });
    res.status(201).json(inv);
  })
);

app.post(
  "/api/reports/generate",
  requireAuth,
  wrap((req, res) => {
    const { template, fmt, pid = "ALL" } = req.body;
    requireFields(req.body, ["template", "fmt"]);
    const row = {
      id: `RPT-${Math.floor(3000 + Math.random() * 6000)}`,
      template,
      pid,
      generated: "—",
      fmt,
      status: "generating",
      size: "—",
    };
    tx(() => {
      insertRow("reports", row);
      appendAudit(req.user, {
        pid: "ALL",
        flag: "🌐",
        country: "Portfolio",
        actor: "You · reporting engine",
        label: "MILESTONE",
        tone: "info",
        text: `Generated "${template}" (${fmt}).`,
        hash: `0x${row.id}-rpt`,
      });
    });
    setTimeout(() => {
      try {
        updateRow("reports", row.id, {
          status: "ready",
          generated: "just now",
          size: `${(0.4 + Math.random() * 3).toFixed(1)} MB`,
        });
      } catch (e) {
        /* server may have been reset mid-generation */
      }
    }, 1400);
    res.status(202).json(row);
  })
);

app.patch(
  "/api/reports/:id",
  requireAuth,
  wrap((req, res) => {
    const updated = updateRow("reports", req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  })
);

app.patch(
  "/api/signatures/:id",
  requireAuth,
  wrap((req, res) => {
    const { status } = req.body;
    requireFields(req.body, ["status"]);
    const updated = updateRow("signatures", req.params.id, {
      status,
      when: "just now",
      actor: req.user.name,
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    tx(() => {
      appendAudit(req.user, {
        ...pidCtx(updated.pid),
        actor: "You · e-signature engine",
        label: "APPROVAL",
        tone: status === "signed" ? "verified" : "risk",
        text: `${status === "signed" ? "Signed" : "Declined"} "${updated.doc}" — provenance hash anchored.`,
        hash: `0x${req.params.id}-${status}`,
      });
    });
    res.json(updated);
  })
);

app.patch(
  "/api/approvals/:id",
  requireAuth,
  wrap((req, res) => {
    const { decision } = req.body;
    requireFields(req.body, ["decision"]);
    const updated = updateRow("approvals", req.params.id, { decision });
    if (!updated) return res.status(404).json({ error: "Not found" });
    tx(() => {
      appendAudit(req.user, {
        ...pidCtx(updated.pid),
        actor: "You · approvals queue",
        label: "APPROVAL",
        tone: decision === "approved" ? "verified" : "risk",
        text: `${decision === "approved" ? "Approved" : "Returned"} "${updated.title}" (${req.params.id}).`,
        hash: `0x${req.params.id}-${decision}`,
      });
    });
    res.json(updated);
  })
);

app.patch(
  "/api/change-orders/:id",
  requireAuth,
  wrap((req, res) => {
    const { status } = req.body;
    requireFields(req.body, ["status"]);
    const updated = updateRow("changeOrders", req.params.id, { status });
    if (!updated) return res.status(404).json({ error: "Not found" });
    tx(() => {
      appendAudit(req.user, {
        ...pidCtx(updated.pid),
        actor: "You · contract administration",
        label: "AMENDMENT",
        tone: status === "approved" ? "verified" : "risk",
        text: `Change order ${req.params.id} ${status} — "${updated.title}".`,
        hash: `0x${req.params.id}-${status}`,
      });
    });
    res.json(updated);
  })
);

app.patch(
  "/api/conflicts/:id",
  requireAuth,
  wrap((req, res) => {
    const { dismissed } = req.body;
    const updated = updateRow("conflicts", req.params.id, {
      dismissed: !!dismissed,
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    if (dismissed) {
      tx(() => {
        appendAudit(req.user, {
          ...pidCtx(updated.pid),
          actor: "You · conflict triage",
          label: "AMENDMENT",
          tone: "warn",
          text: `Dismissed conflict ${req.params.id} — "${updated.title}" marked reviewed, no action.`,
          hash: `0x${req.params.id}-dismiss`,
        });
      });
    }
    res.json(updated);
  })
);

app.patch(
  "/api/workflows/:id",
  requireAuth,
  wrap((req, res) => {
    const updated = updateRow("workflows", req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    if (req.body.stage !== undefined) {
      tx(() => {
        appendAudit(req.user, {
          ...pidCtx(updated.pid),
          actor: "You · workflow engine",
          label: "MILESTONE",
          tone: updated.blocked ? "risk" : "info",
          text: `Advanced workflow "${updated.title}" to stage ${updated.stage}.`,
          hash: `0x${req.params.id}-step`,
        });
      });
    }
    res.json(updated);
  })
);

app.post(
  "/api/audit",
  requireAuth,
  wrap((req, res) => {
    const row = appendAudit(req.user, req.body);
    res.status(201).json(row);
  })
);

app.post(
  "/api/reset",
  requireAuth,
  wrap(async (req, res) => {
    resetAll();
    // Re-seed immediately so the workspace returns to a usable baseline.
    await seedFromModule(seed, auth);
    res.json({ ok: true });
  })
);

// ── static (production) ───────────────────────────────────────────────────

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST, "index.html"));
  });
}

// ── error handler ──────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("[api]", err.message);
  }
  res.status(status).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`TrustSfer API listening on http://localhost:${PORT}`);
});
