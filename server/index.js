// TrustSfer REST API. Mirrors the action surface of the client store so
// the React provider can swap localStorage for HTTP without the views
// (or modal flows) needing to change.

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  COLLECTIONS,
  insertRow,
  updateRow,
  listCollection,
  getSingleton,
  putSingleton,
  snapshot,
  resetAll,
  tx,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

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

// Every state-changing endpoint also writes an audit row, so we
// centralise the shape and id generation.
function appendAudit(ev) {
  const row = {
    id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: ev.ts || "just now",
    pid: ev.pid,
    flag: ev.flag || "🏳️",
    country: ev.country || "—",
    actor: ev.actor,
    label: ev.label,
    tone: ev.tone,
    text: ev.text,
    hash: ev.hash,
  };
  insertRow("auditEvents", row);
  return row;
}

// ── routes ─────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));

app.get(
  "/api/state",
  wrap((req, res) => {
    res.json(snapshot());
  })
);

app.get(
  "/api/collections/:name",
  wrap((req, res) => {
    if (!COLLECTIONS.includes(req.params.name)) {
      return res.status(404).json({ error: "Unknown collection" });
    }
    res.json(listCollection(req.params.name));
  })
);

app.post(
  "/api/projects",
  wrap((req, res) => {
    const project = req.body;
    requireFields(project, ["id", "name", "country"]);
    tx(() => {
      insertRow("projects", project);
      appendAudit({
        pid: project.id,
        flag: project.flag,
        country: project.country,
        actor: "Portfolio Admin · console",
        label: "MILESTONE",
        tone: "info",
        text: `Registered project "${project.name}" — envelope ${project.budget}, donor ${project.donor}.`,
        hash: req.body._hash || `0x${project.id}-reg`,
      });
    });
    res.status(201).json(project);
  })
);

app.post(
  "/api/evidence",
  wrap((req, res) => {
    const d = req.body;
    requireFields(d, ["pid", "kind", "cle"]);
    const row = {
      id: `u${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      kind: d.kind,
      actor: d.actor,
      pid: d.pid,
      country: d.country,
      flag: d.flag,
      hash: d.cle,
      block: d.block,
      t: "now",
      isNew: true,
    };
    tx(() => {
      insertRow("evidence", row);
      appendAudit({
        pid: d.pid,
        flag: d.flag,
        country: d.country,
        actor: `${d.actor} · field upload`,
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
  wrap((req, res) => {
    const c = req.body;
    requireFields(c, ["id", "pid", "title"]);
    tx(() => {
      insertRow("contracts", c);
      appendAudit({
        pid: c.pid,
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
  wrap((req, res) => {
    const inv = req.body;
    requireFields(inv, ["id", "type", "org", "project"]);
    tx(() => {
      insertRow("invites", inv);
      appendAudit({
        pid: inv.project,
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

// Generating a report kicks off a server-side simulated build; the
// client gets the row back immediately with status=generating and can
// poll /api/state (or just the reports collection) for completion.
app.post(
  "/api/reports/generate",
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
      appendAudit({
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
  wrap((req, res) => {
    const updated = updateRow("reports", req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  })
);

app.put(
  "/api/signatures/:id",
  wrap((req, res) => {
    const { status, doc, pid } = req.body;
    requireFields(req.body, ["status"]);
    const next = { ...getSingleton("sigOverrides"), [req.params.id]: status };
    tx(() => {
      putSingleton("sigOverrides", next);
      appendAudit({
        pid,
        actor: "You · e-signature engine",
        label: "APPROVAL",
        tone: status === "signed" ? "verified" : "risk",
        text: `${status === "signed" ? "Signed" : "Declined"} "${doc}" — provenance hash anchored.`,
        hash: `0x${req.params.id}-${status}`,
      });
    });
    res.json({ id: req.params.id, status });
  })
);

app.put(
  "/api/approvals/:id",
  wrap((req, res) => {
    const { choice, title, pid } = req.body;
    requireFields(req.body, ["choice"]);
    const next = { ...getSingleton("approvals"), [req.params.id]: choice };
    tx(() => {
      putSingleton("approvals", next);
      appendAudit({
        pid,
        actor: "You · approvals queue",
        label: "APPROVAL",
        tone: choice === "approved" ? "verified" : "risk",
        text: `${choice === "approved" ? "Approved" : "Returned"} "${title}" (${req.params.id}).`,
        hash: `0x${req.params.id}-${choice}`,
      });
    });
    res.json({ id: req.params.id, choice });
  })
);

app.put(
  "/api/change-orders/:id",
  wrap((req, res) => {
    const { status, title, pid } = req.body;
    requireFields(req.body, ["status"]);
    const next = { ...getSingleton("changeOrders"), [req.params.id]: status };
    tx(() => {
      putSingleton("changeOrders", next);
      appendAudit({
        pid,
        actor: "You · contract administration",
        label: "AMENDMENT",
        tone: status === "approved" ? "verified" : "risk",
        text: `Change order ${req.params.id} ${status} — "${title}".`,
        hash: `0x${req.params.id}-${status}`,
      });
    });
    res.json({ id: req.params.id, status });
  })
);

app.post(
  "/api/conflicts/:id/dismiss",
  wrap((req, res) => {
    const { title, pid } = req.body;
    const current = getSingleton("dismissedConflicts");
    const next = current.includes(req.params.id) ? current : [...current, req.params.id];
    tx(() => {
      putSingleton("dismissedConflicts", next);
      appendAudit({
        pid,
        actor: "You · conflict triage",
        label: "AMENDMENT",
        tone: "warn",
        text: `Dismissed conflict ${req.params.id} — "${title}" marked reviewed, no action.`,
        hash: `0x${req.params.id}-dismiss`,
      });
    });
    res.json({ id: req.params.id, dismissed: true });
  })
);

app.post(
  "/api/audit",
  wrap((req, res) => {
    const row = appendAudit(req.body);
    res.status(201).json(row);
  })
);

app.post(
  "/api/reset",
  wrap((req, res) => {
    resetAll();
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
