import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
  useReducer,
} from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Hash,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Landmark,
  Map as MapIcon,
  FileSearch,
  Settings,
  ShieldCheck,
  Activity,
  Search,
  Bell,
  Filter,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  Calendar,
  Clock,
  CheckCircle2,
  CircleDot,
  Inbox,
  FileWarning,
  RefreshCw,
  Download,
  MapPin,
  Globe2,
  HardHat,
  Users,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Building2,
  Layers,
  GitMerge,
  Cpu,
  Lock,
  Zap,
  BadgeCheck,
  Eye,
  Pin,
  HelpCircle,
  PlusCircle,
  CornerDownLeft,
  Sparkles,
  FileText,
  Workflow,
  Network,
  Scale,
  GitBranch,
  Gauge,
  ShieldAlert,
  FileSignature,
  Stamp,
  Banknote,
  Brain,
  KeyRound,
  UserCog,
  ScrollText,
  Fingerprint,
  Send,
  Boxes,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

/* ════════════════════════════════════════════════════════════════════════════
   TrustSfer — Operations Workspace
   Mission-control surface for ministries, donors, EPC contractors, auditors.
   Single-file React app, fully accessible, responsive, with loading + edge
   states wired into every data surface.
   ════════════════════════════════════════════════════════════════════════════ */

// ── Design tokens (light theme) ────────────────────────────────────────────
const T = {
  ink0: "#f4f2ec",
  ink1: "#ffffff",
  ink2: "#efece3",
  ink3: "#e3dfd4",
  ink4: "#ccc7b8",
  ink5: "#a8a394",
  bone0: "#1b1a14",
  bone1: "#56524a",
  bone2: "#8a8678",
  bone3: "#b4b0a2",
  signal: "#4f7a1f",
  alert: "#cf3a1c",
  amber: "#a9760a",
  azure: "#2f63d6",
  plum: "#7a45c4",
};

const tint = (hex, a) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// ════════════════════════════════════════════════════════════════════════════
// HOOKS
// ════════════════════════════════════════════════════════════════════════════

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = () => setR(mq.matches);
    h();
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);
  return r;
}

function useCountUp(target, duration = 1200, startOn = true) {
  const reduced = usePrefersReducedMotion();
  const [v, setV] = useState(reduced ? target : 0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startOn) return;
    if (reduced) {
      setV(target);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, startOn, reduced]);
  return v;
}

function useKey(target, handler, deps = []) {
  useEffect(() => {
    const onKey = (e) => {
      const isCombo = typeof target === "object" && target.combo;
      if (isCombo) {
        const meta = target.combo;
        if (
          e.key.toLowerCase() === meta.key.toLowerCase() &&
          (!meta.meta || e.metaKey || e.ctrlKey) &&
          (!meta.shift || e.shiftKey)
        ) {
          e.preventDefault();
          handler(e);
        }
      } else if (e.key === target) {
        handler(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const focusables = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [ref, active]);
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function fauxHash(seed) {
  let h = 2166136261 >>> 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  let x = h;
  for (let i = 0; i < 16; i++) {
    x = Math.imul(x ^ (x >>> 13), 2654435761);
    out += (x >>> 0).toString(16).padStart(8, "0").slice(0, 4);
  }
  return "0x" + out.slice(0, 56);
}

const fmtUSD = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};
const fmtPct = (n) => `${n.toFixed(1)}%`;
const fmtInt = (n) => Math.round(n).toLocaleString();

const i3Color = (s) =>
  s >= 80 ? T.signal : s >= 65 ? T.amber : s >= 50 ? T.alert : T.alert;
const i3Tone = (s) =>
  s >= 80 ? "verified" : s >= 65 ? "warn" : "risk";

// ════════════════════════════════════════════════════════════════════════════
// FILE EXPORT HELPERS
// ════════════════════════════════════════════════════════════════════════════

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

// Minimal single-page PDF writer — enough for text reports without a library.
function makePdf(title, lines) {
  const esc = (s) =>
    String(s)
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  const text = [
    `BT /F1 14 Tf 50 760 Td (${esc(title)}) Tj ET`,
    "BT /F1 9 Tf 50 736 Td 13 TL",
    ...lines.slice(0, 50).map((l) => `(${esc(l)}) Tj T*`),
    "ET",
  ].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    out += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// APP STORE — global state, persisted to localStorage
// ════════════════════════════════════════════════════════════════════════════

import { api, getToken, setToken, onAuthChange } from "./api";

const EMPTY_STATE = {
  me: null,
  users: [],
  projects: [],
  contracts: [],
  evidence: [],
  auditEvents: [],
  conflicts: [],
  approvals: [],
  signatures: [],
  changeOrders: [],
  workflows: [],
  ledger: [],
  invites: [],
  reports: [],
  _online: null,
  _error: null,
  _hydrated: false,
};

function storeReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, _hydrated: true };
    case "SET_ONLINE":
      return { ...state, _online: action.online };
    case "SET_ERROR":
      return { ...state, _error: action.error };
    case "SET_ME":
      return { ...state, me: action.me };
    case "ADD_PROJECT":
      return { ...state, projects: [action.payload, ...state.projects] };
    case "ADD_EVIDENCE":
      return { ...state, evidence: [action.payload, ...state.evidence].slice(0, 200) };
    case "ADD_AUDIT":
      return { ...state, auditEvents: [action.payload, ...state.auditEvents].slice(0, 200) };
    case "ADD_CONTRACT":
      return { ...state, contracts: [action.payload, ...state.contracts] };
    case "ADD_INVITE":
      return { ...state, invites: [action.payload, ...state.invites] };
    case "ADD_REPORT":
      return { ...state, reports: [action.payload, ...state.reports] };
    case "PATCH_ROW": {
      const list = state[action.collection];
      return {
        ...state,
        [action.collection]: list.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };
    }
    case "RESET":
      return { ...EMPTY_STATE, me: state.me, _online: state._online, _hydrated: false };
    default:
      return state;
  }
}

const StoreContext = React.createContext(null);
const useStore = () => React.useContext(StoreContext);

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, EMPTY_STATE);
  const [authToken, setAuthToken] = useState(() => getToken());
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Track token changes (login, logout, 401 auto-clear).
  useEffect(() => onAuthChange(() => setAuthToken(getToken())), []);

  // Hydrate whenever the token changes.
  useEffect(() => {
    if (!authToken) {
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_ONLINE", online: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await api.getState();
        if (cancelled) return;
        dispatch({ type: "HYDRATE", payload: { ...snap, _online: true } });
      } catch (e) {
        if (cancelled) return;
        if (e.status === 401) {
          setToken(null);
          return;
        }
        dispatch({ type: "SET_ONLINE", online: false });
        dispatch({ type: "SET_ERROR", error: `Hydration failed: ${e.message}` });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Poll for report completion while any report is generating.
  useEffect(() => {
    if (state._online !== true || !state._hydrated) return;
    if (!state.reports.some((r) => r.status === "generating")) return;
    const t = setTimeout(async () => {
      try {
        const snap = await api.getState();
        dispatch({ type: "HYDRATE", payload: snap });
      } catch (e) {
        /* leave optimistic state alone */
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [state.reports, state._online, state._hydrated]);

  const actions = useMemo(() => {
    const run = async (local, remote) => {
      dispatch(local);
      try {
        await remote();
        // Pull the freshly-written audit row(s) without blocking the
        // optimistic update the user already sees.
        api.getState().then(
          (snap) => dispatch({ type: "HYDRATE", payload: snap }),
          () => {}
        );
      } catch (e) {
        if (e.status === 401) return;
        dispatch({ type: "SET_ERROR", error: e.message });
        setTimeout(() => dispatch({ type: "SET_ERROR", error: null }), 4500);
      }
    };

    return {
      async login(username, password) {
        const { token, user } = await api.login(username, password);
        setToken(token);
        dispatch({ type: "SET_ME", me: user });
        return user;
      },
      async logout() {
        try {
          await api.logout();
        } catch (e) {
          /* ignore */
        }
        setToken(null);
      },
      addProject(p) {
        run({ type: "ADD_PROJECT", payload: p }, () => api.addProject(p));
      },
      addEvidence(d) {
        const optimistic = {
          id: `u${Date.now()}`, kind: d.kind, actor: d.actor, pid: d.pid,
          country: d.country, flag: d.flag, hash: d.cle, block: d.block,
          t: "just now", isNew: true,
        };
        run({ type: "ADD_EVIDENCE", payload: optimistic }, () => api.addEvidence(d));
      },
      addContract(c) {
        run({ type: "ADD_CONTRACT", payload: c }, () => api.addContract(c));
      },
      addInvite(inv) {
        run({ type: "ADD_INVITE", payload: inv }, () => api.addInvite(inv));
      },
      setSignature(id, status) {
        run(
          { type: "PATCH_ROW", collection: "signatures", id, patch: { status, when: "just now" } },
          () => api.setSignature(id, status)
        );
      },
      decideApproval(id, decision) {
        run(
          { type: "PATCH_ROW", collection: "approvals", id, patch: { decision } },
          () => api.decideApproval(id, decision)
        );
      },
      dismissConflict(id) {
        run(
          { type: "PATCH_ROW", collection: "conflicts", id, patch: { dismissed: true } },
          () => api.dismissConflict(id)
        );
      },
      decideChangeOrder(id, status) {
        run(
          { type: "PATCH_ROW", collection: "changeOrders", id, patch: { status } },
          () => api.decideChangeOrder(id, status)
        );
      },
      advanceWorkflow(id, patch) {
        run(
          { type: "PATCH_ROW", collection: "workflows", id, patch },
          () => api.advanceWorkflow(id, patch)
        );
      },
      generateReport(tpl, pid = "ALL") {
        const id = `RPT-tmp-${Math.floor(Math.random() * 90000)}`;
        const row = {
          id, template: tpl.name, pid, generated: "—",
          fmt: tpl.fmt, status: "generating", size: "—",
        };
        run(
          { type: "ADD_REPORT", payload: row },
          async () => {
            const server = await api.generateReport(tpl);
            dispatch({
              type: "PATCH_ROW",
              collection: "reports",
              id,
              patch: { id: server.id },
            });
          }
        );
        return id;
      },
      async reset() {
        dispatch({ type: "RESET" });
        try {
          await api.reset();
          const snap = await api.getState();
          dispatch({ type: "HYDRATE", payload: snap });
        } catch (e) {
          dispatch({ type: "SET_ERROR", error: e.message });
        }
      },
    };
  }, []);

  const value = useMemo(
    () => ({ ...actions, state, authToken }),
    [actions, state, authToken]
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Builds the export payload for a generated report in its native format.
function buildReportFile(report, allProjects) {
  const rows = allProjects.map((p) => [
    p.id, p.name, p.country, p.sector, p.donor, p.budget, p.spent, p.i3, p.risk, p.progress,
  ]);
  const headers = ["id", "name", "country", "sector", "donor", "budget", "spent", "i3", "risk", "progress"];
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${report.id}_${stamp}`;
  if (report.fmt === "JSON") {
    return {
      name: `${base}.json`, mime: "application/json",
      content: JSON.stringify({ report: report.template, generated: stamp, projects: allProjects }, null, 2),
    };
  }
  if (report.fmt === "PDF") {
    return {
      name: `${base}.pdf`, mime: "application/pdf",
      content: makePdf(`${report.template} — ${stamp}`, [
        `Scope: ${report.pid === "ALL" ? "Full portfolio" : report.pid}`,
        `Projects: ${allProjects.length}`,
        `Approved budget: ${fmtUSD(allProjects.reduce((s, p) => s + p.budget, 0))}`,
        `Disbursed: ${fmtUSD(allProjects.reduce((s, p) => s + p.spent, 0))}`,
        "",
        ...allProjects.map(
          (p) => `${p.id}  ${p.name} — ${p.country} · ${fmtUSD(p.budget)} · i3 ${p.i3} · ${p.risk}`
        ),
      ]),
    };
  }
  // CSV and XLSX both export as CSV (Excel-compatible, no binary writer needed).
  return { name: `${base}.csv`, mime: "text/csv", content: toCSV(headers, rows) };
}

// ════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════════════════════════════════════════

// All bulk seed data lives on the server now (server/seed.js) and the
// client hydrates it via /api/state. These remain as empty fallbacks so
// any code path that briefly runs before hydration is safe to render.
const PROJECTS = [];
const CONFLICTS = [];
const APPROVALS = [];
const RISKS = ["low", "med", "high"];

// Approximate geo coords (lon, lat) — pure UI config, lives in the
// client because it drives the SVG map projection.
const GEO = {
  RD: [-70.16, 18.74], KE: [37.91, -0.02], PH: [121.77, 12.88],
  CO: [-74.30, 4.57],  NG: [8.68, 9.08],   JO: [36.24, 30.59],
  ID: [113.92, -0.79], GH: [-1.02, 7.95],  BD: [90.36, 23.69],
  MX: [-102.55, 23.63], TZ: [34.89, -6.37], PE: [-75.02, -9.19],
  EG: [30.80, 26.82],  VN: [108.28, 14.06],
};
const PROJECT_GEO = (id) => GEO[id.split("-")[0]] || [0, 0];
const project = (lon, lat, w, h) => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
// ════════════════════════════════════════════════════════════════════════════

function Chip({ children, tone = "neutral", className = "", size = "sm" }) {
  const tones = {
    neutral: { bg: T.ink2, fg: T.bone1, border: T.ink3 },
    verified: {
      bg: tint(T.signal, 0.1),
      fg: T.signal,
      border: tint(T.signal, 0.3),
    },
    risk: {
      bg: tint(T.alert, 0.1),
      fg: T.alert,
      border: tint(T.alert, 0.3),
    },
    warn: {
      bg: tint(T.amber, 0.12),
      fg: T.amber,
      border: tint(T.amber, 0.3),
    },
    info: {
      bg: tint(T.azure, 0.1),
      fg: T.azure,
      border: tint(T.azure, 0.3),
    },
    plum: {
      bg: tint(T.plum, 0.1),
      fg: T.plum,
      border: tint(T.plum, 0.3),
    },
  };
  const c = tones[tone] || tones.neutral;
  const sz =
    size === "xs"
      ? "text-[9px] px-1.5 py-0.5"
      : "text-[10px] px-2 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tracking-widest uppercase rounded-sm border ${sz} ${className}`}
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      {children}
    </span>
  );
}

function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: T.ink2, ...style }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 ts-shimmer" />
    </div>
  );
}

function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-14 px-6"
      role="status"
    >
      <Icon size={26} style={{ color: T.bone2 }} aria-hidden="true" />
      <p className="mt-3 text-sm" style={{ color: T.bone0 }}>
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-xs max-w-[40ch]" style={{ color: T.bone2 }}>
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ErrorState({ title, hint, onRetry }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6 border"
      style={{
        borderColor: tint(T.alert, 0.3),
        background: tint(T.alert, 0.05),
      }}
      role="alert"
    >
      <FileWarning size={28} style={{ color: T.alert }} aria-hidden="true" />
      <p className="mt-3 text-sm" style={{ color: T.bone0 }}>
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-xs max-w-[40ch]" style={{ color: T.bone2 }}>
          {hint}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase px-3 py-2 border focus:outline-none focus-visible:ts-focus"
          style={{ borderColor: T.alert, color: T.alert }}
        >
          <RefreshCw size={12} aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}

function Button({
  children,
  variant = "ghost",
  size = "sm",
  iconLeft: IL,
  iconRight: IR,
  ...rest
}) {
  const variants = {
    primary: { bg: T.signal, fg: T.ink0, bd: T.signal },
    ghost: { bg: "transparent", fg: T.bone0, bd: T.ink4 },
    danger: { bg: "transparent", fg: T.alert, bd: tint(T.alert, 0.4) },
    quiet: { bg: "transparent", fg: T.bone1, bd: "transparent" },
  };
  const v = variants[variant] || variants.ghost;
  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-2.5 py-1.5 text-[11px]",
    md: "px-3.5 py-2.5 text-[11px]",
    lg: "px-5 py-3 text-xs",
  };
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center gap-1.5 font-mono tracking-widest uppercase border transition-colors focus:outline-none focus-visible:ts-focus ${
        sizes[size] || sizes.sm
      } ${rest.className || ""}`}
      style={{
        background: v.bg,
        color: v.fg,
        borderColor: v.bd,
      }}
    >
      {IL && <IL size={12} aria-hidden="true" />}
      {children}
      {IR && <IR size={12} aria-hidden="true" />}
    </button>
  );
}

function RiskDot({ risk, label = false }) {
  const map = {
    low: { c: T.signal, label: "Low" },
    med: { c: T.amber, label: "Medium" },
    high: { c: T.alert, label: "High" },
  };
  const r = map[risk] || map.low;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase"
      style={{ color: r.c }}
      aria-label={`${r.label} risk`}
      role="img"
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: r.c }}
        aria-hidden="true"
      />
      {label && r.label}
    </span>
  );
}

function I3Score({ score, size = "md" }) {
  const sizes = {
    sm: { f: "text-base", sub: "text-[9px]" },
    md: { f: "text-2xl", sub: "text-[10px]" },
    lg: { f: "text-4xl", sub: "text-[10px]" },
  };
  const s = sizes[size];
  return (
    <span
      className="inline-flex flex-col items-baseline tabular-nums"
      title={`I³ ${score.toFixed(1)} / 100`}
    >
      <span
        className={`font-serif tabular-nums leading-none ${s.f}`}
        style={{
          fontFamily: "Fraunces, serif",
          fontWeight: 380,
          color: i3Color(score),
        }}
      >
        {score.toFixed(1)}
      </span>
    </span>
  );
}

function KPI({ label, value, delta, sublabel, loading, tone = "neutral" }) {
  const deltaColor =
    delta == null
      ? T.bone2
      : delta > 0
      ? T.signal
      : delta < 0
      ? T.alert
      : T.bone2;
  return (
    <div
      className="p-5 md:p-6 border-r border-b"
      style={{ borderColor: T.ink3, background: T.ink1 }}
    >
      <div
        className="font-mono text-[10px] tracking-widest uppercase"
        style={{ color: T.bone2 }}
      >
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24 mt-2" />
      ) : (
        <div
          className="mt-2 font-serif text-3xl md:text-4xl tabular-nums leading-none"
          style={{
            fontFamily: "Fraunces, serif",
            fontWeight: 380,
            color: T.bone0,
          }}
        >
          {value}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span
          className="font-mono text-[10px]"
          style={{ color: T.bone2 }}
        >
          {sublabel}
        </span>
        {delta != null && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] tabular-nums"
            style={{ color: deltaColor }}
          >
            {delta > 0 ? (
              <ArrowUp size={10} aria-hidden="true" />
            ) : delta < 0 ? (
              <ArrowDown size={10} aria-hidden="true" />
            ) : null}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }) {
  const c = color || T.signal;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative w-full h-1"
      style={{ background: T.ink3 }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${value}%`,
          background: c,
          transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 border-b" style={{ borderColor: T.ink3 }}>
      <div className="min-w-0">
        <h3
          className="font-serif text-lg leading-tight truncate"
          style={{
            fontFamily: "Fraunces, serif",
            fontWeight: 400,
            color: T.bone0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="mt-1 font-mono text-[10px] tracking-widest uppercase"
            style={{ color: T.bone2 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`border ${className}`}
      style={{ borderColor: T.ink3, background: T.ink1 }}
    >
      {children}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHELL — Sidebar + TopBar
// ════════════════════════════════════════════════════════════════════════════

const MODULES = [
  { id: "overview", label: "Portfolio", icon: LayoutDashboard, group: "Workspace" },
  { id: "projects", label: "Projects", icon: FolderKanban, group: "Workspace" },
  { id: "contracts", label: "Contracts", icon: FileText, group: "Workspace" },
  { id: "evidence", label: "Evidence Ledger", icon: Hash, group: "Verification" },
  { id: "i3", label: "I³ Analytics", icon: TrendingUp, group: "Verification" },
  { id: "conflicts", label: "Conflict Detection", icon: AlertTriangle, group: "Verification" },
  { id: "ledger", label: "Ledger Sync", icon: Network, group: "Verification" },
  { id: "audit", label: "Audit Trail", icon: FileSearch, group: "Verification" },
  { id: "workflows", label: "Workflows", icon: Workflow, group: "Operations" },
  { id: "approvals", label: "Approvals", icon: CheckSquare, group: "Operations" },
  { id: "signatures", label: "E-Signatures", icon: FileSignature, group: "Operations" },
  { id: "disbursements", label: "Disbursements", icon: Landmark, group: "Operations" },
  { id: "geo", label: "Geospatial", icon: MapIcon, group: "Operations" },
  { id: "risk", label: "AI Risk Prediction", icon: Brain, group: "Intelligence" },
  { id: "portal", label: "Public Portal", icon: Globe2, group: "Transparency" },
  { id: "reports", label: "Reports", icon: ScrollText, group: "Transparency" },
  { id: "access", label: "Access & Identity", icon: UserCog, group: "Administration" },
];

function Sidebar({ active, onNavigate, collapsed, mobileOpen, onCloseMobile }) {
  const __ds = useStore().state;
  const CONFLICTS = __ds.conflicts.filter((c) => !c.dismissed);
  const APPROVALS = __ds.approvals.filter((a) => !a.decision);
  const grouped = useMemo(() => {
    const g = {};
    MODULES.forEach((m) => {
      if (!g[m.group]) g[m.group] = [];
      g[m.group].push(m);
    });
    return g;
  }, []);

  const pendingCounts = {
    conflicts: CONFLICTS.length,
    approvals: APPROVALS.length,
  };

  const content = (
    <>
      <div
        className="px-4 py-5 border-b flex items-center justify-between"
        style={{ borderColor: T.ink3 }}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("overview");
          }}
          className="flex items-center gap-2.5 min-w-0 focus:outline-none focus-visible:ts-focus"
        >
          <span
            className="inline-flex items-center justify-center w-7 h-7 border shrink-0"
            style={{ borderColor: T.signal }}
            aria-hidden="true"
          >
            <ShieldCheck size={14} style={{ color: T.signal }} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <div
                className="font-serif text-base leading-none tracking-tight truncate"
                style={{
                  color: T.bone0,
                  fontFamily: "Fraunces, serif",
                  fontWeight: 400,
                }}
              >
                TrustSfer
              </div>
              <div
                className="font-mono text-[9px] tracking-widest uppercase mt-1 truncate"
                style={{ color: T.bone2 }}
              >
                Operations · v3.2
              </div>
            </div>
          )}
        </a>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 focus:outline-none focus-visible:ts-focus"
            style={{ color: T.bone1 }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!collapsed && (
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: T.ink3 }}
        >
          <div
            className="font-mono text-[9px] tracking-widest uppercase mb-1.5"
            style={{ color: T.bone3 }}
          >
            Workspace
          </div>
          <button
            type="button"
            className="w-full text-left flex items-center justify-between gap-2 px-2.5 py-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, background: T.ink2 }}
            aria-label="Switch workspace"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: T.signal }}
              />
              <span
                className="text-xs truncate"
                style={{ color: T.bone0 }}
              >
                Ministry of Finance · DOM
              </span>
            </span>
            <ChevronDown size={12} style={{ color: T.bone2 }} aria-hidden="true" />
          </button>
        </div>
      )}

      <nav
        aria-label="Modules"
        className="flex-1 overflow-y-auto py-3"
      >
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <div
                className="px-4 mb-1.5 font-mono text-[9px] tracking-widest uppercase"
                style={{ color: T.bone3 }}
              >
                {group}
              </div>
            )}
            <ul>
              {items.map((m) => {
                const isActive = active === m.id;
                const badge = pendingCounts[m.id];
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(m.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-2 transition-colors focus:outline-none focus-visible:ts-focus relative ${
                        collapsed ? "justify-center" : ""
                      }`}
                      style={{
                        color: isActive ? T.bone0 : T.bone1,
                        background: isActive
                          ? tint(T.signal, 0.09)
                          : "transparent",
                      }}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? m.label : undefined}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-0 bottom-0 w-px"
                          style={{ background: T.signal }}
                        />
                      )}
                      <m.icon
                        size={15}
                        style={{ color: isActive ? T.signal : T.bone2 }}
                        aria-hidden="true"
                      />
                      {!collapsed && (
                        <>
                          <span className="text-xs flex-1 truncate">
                            {m.label}
                          </span>
                          {badge != null && (
                            <span
                              className="font-mono text-[9px] tabular-nums px-1.5 py-0.5"
                              style={{
                                background:
                                  m.id === "conflicts"
                                    ? tint(T.alert, 0.14)
                                    : tint(T.amber, 0.16),
                                color:
                                  m.id === "conflicts" ? T.alert : T.amber,
                              }}
                            >
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className="border-t px-2 py-3"
        style={{ borderColor: T.ink3 }}
      >
        {!collapsed && (
          <>
            <div
              className="mx-2 mb-2 p-3 border"
              style={{
                borderColor: T.ink3,
                background: tint(T.signal, 0.07),
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} style={{ color: T.signal }} aria-hidden="true" />
                <span
                  className="font-mono text-[10px] tracking-widest uppercase"
                  style={{ color: T.bone0 }}
                >
                  Anchor Health
                </span>
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: T.bone1 }}
              >
                Chain block 1,284,019 · 3.2s avg
              </div>
            </div>
          </>
        )}
        <button
          type="button"
          className={`w-full flex items-center gap-3 px-3 py-2 focus:outline-none focus-visible:ts-focus ${
            collapsed ? "justify-center" : ""
          }`}
          style={{ color: T.bone1 }}
          aria-label="Settings"
          title={collapsed ? "Settings" : undefined}
        >
          <Settings size={14} aria-hidden="true" />
          {!collapsed && (
            <span className="font-mono text-[11px] tracking-widest uppercase">
              Settings
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r shrink-0 ${
          collapsed ? "w-[68px]" : "w-[248px]"
        } transition-[width] duration-200`}
        style={{ borderColor: T.ink3, background: T.ink1 }}
        aria-label="Primary"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r w-[280px]"
            style={{ borderColor: T.ink3, background: T.ink1 }}
            aria-label="Primary (mobile)"
          >
            {content}
          </aside>
        </>
      )}
    </>
  );
}

// Topbar pill showing whether the API is reachable. Three states:
// connected (green), offline cache (amber), connecting (neutral).
function ConnectionPill() {
  const store = useStore();
  const online = store.state._online;
  const label = online === true ? "Connected" : online === false ? "Offline" : "Connecting";
  const tone = online === true ? T.signal : online === false ? T.amber : T.bone2;
  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-2 border"
      style={{ borderColor: T.ink3, color: tone }}
      title={online === false ? "API unreachable — changes saved locally." : "REST API · SQLite"}
    >
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: tone }}
      />
      <span className="font-mono text-[10px] tracking-widest uppercase">{label}</span>
    </span>
  );
}

// Transient toast for the most recent action error (e.g. API rejected).
function ErrorToast() {
  const store = useStore();
  if (!store.state._error) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[60] max-w-sm px-4 py-3 border shadow-lg ts-fade-in"
      style={{
        background: T.ink1,
        borderColor: tint(T.alert, 0.45),
        color: T.bone0,
      }}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={14} style={{ color: T.alert, marginTop: 2 }} aria-hidden="true" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
            API error · change kept locally
          </div>
          <div className="mt-0.5 text-[13px] truncate">{store.state._error}</div>
        </div>
      </div>
    </div>
  );
}

// Topbar identity chip — shows the signed-in user's initials, name, and
// role, with a click-to-logout menu.
function AccountChip() {
  const store = useStore();
  const me = store.state.me;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!me) return null;
  return (
    <div ref={ref} className="hidden md:block relative pl-3 ml-1 border-l" style={{ borderColor: T.ink3 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 focus:outline-none focus-visible:ts-focus"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div
          className="w-7 h-7 flex items-center justify-center font-mono text-[10px] tracking-widest uppercase border"
          style={{ borderColor: T.signal, color: T.signal }}
          aria-hidden="true"
        >
          {me.initials}
        </div>
        <div className="hidden xl:flex flex-col leading-tight text-left">
          <span className="text-[11px]" style={{ color: T.bone0 }}>{me.name}</span>
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: T.bone2 }}>
            {me.role} · {me.tier}
          </span>
        </div>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-56 border shadow-lg"
          style={{ borderColor: T.ink3, background: T.ink1, zIndex: 40 }}
        >
          <div className="px-3 py-2.5 border-b" style={{ borderColor: T.ink3 }}>
            <div className="text-sm" style={{ color: T.bone0 }}>{me.name}</div>
            <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
              {me.email}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              store.logout();
            }}
            className="w-full text-left px-3 py-2.5 text-[13px] focus:outline-none focus-visible:ts-focus"
            style={{ color: T.bone0 }}
          >
            <span className="inline-flex items-center gap-2">
              <KeyRound size={12} aria-hidden="true" style={{ color: T.bone2 }} />
              Sign out
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function TopBar({
  active,
  onOpenPalette,
  onToggleMobile,
  onToggleCollapse,
  onOpenAlerts,
  alertCount,
}) {
  const moduleLabel = MODULES.find((m) => m.id === active)?.label || "Workspace";
  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: "rgba(255,255,255,0.85)",
        borderColor: T.ink3,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone0 }}
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone1 }}
            aria-label="Toggle sidebar"
          >
            <Layers size={14} />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase truncate">
              <li style={{ color: T.bone2 }}>Workspace</li>
              <li style={{ color: T.bone3 }} aria-hidden="true">/</li>
              <li style={{ color: T.bone0 }} className="truncate">
                {moduleLabel}
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 border focus:outline-none focus-visible:ts-focus min-w-[260px]"
            style={{ borderColor: T.ink3, background: T.ink2, color: T.bone1 }}
            aria-label="Open command palette"
          >
            <Search size={12} aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-widest uppercase flex-1 text-left">
              Search projects, hashes…
            </span>
            <kbd
              className="font-mono text-[10px] px-1.5 py-0.5 border"
              style={{
                borderColor: T.ink4,
                color: T.bone2,
                background: T.ink1,
              }}
            >
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onOpenPalette}
            className="md:hidden p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone0 }}
            aria-label="Search"
          >
            <Search size={14} />
          </button>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 border focus:outline-none focus-visible:ts-focus"
              style={{ borderColor: T.ink3, color: T.bone1 }}
              aria-label="Date range"
            >
              <Calendar size={12} aria-hidden="true" />
              <span className="font-mono text-[10px] tracking-widest uppercase">
                Last 30 days
              </span>
              <ChevronDown size={12} style={{ color: T.bone2 }} aria-hidden="true" />
            </button>
          </div>

          <ConnectionPill />

          <button
            type="button"
            onClick={onOpenAlerts}
            className="relative p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone0 }}
            aria-label={`Alerts, ${alertCount} unread`}
          >
            <Bell size={14} />
            {alertCount > 0 && (
              <span
                className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 font-mono text-[9px] tabular-nums"
                style={{ background: T.alert, color: T.ink0 }}
                aria-hidden="true"
              >
                {alertCount}
              </span>
            )}
          </button>

          <AccountChip />
        </div>
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE
// ════════════════════════════════════════════════════════════════════════════

function CommandPalette({ open, onClose, onNavigate, onOpenProject }) {
  const PROJECTS = useStore().state.projects;
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useFocusTrap(ref, open);
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  useKey("Escape", () => open && onClose(), [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const mod = MODULES.filter(
      (m) => !term || m.label.toLowerCase().includes(term)
    ).map((m) => ({ type: "module", id: m.id, label: m.label, icon: m.icon }));
    const proj = PROJECTS.filter(
      (p) =>
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        p.country.toLowerCase().includes(term)
    )
      .slice(0, 6)
      .map((p) => ({
        type: "project",
        id: p.id,
        label: p.name,
        sub: `${p.id} · ${p.country}`,
      }));
    return { mod, proj };
  }, [q]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
    >
      <div
        ref={ref}
        className="w-full max-w-[640px] border"
        style={{ borderColor: T.ink3, background: T.ink1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: T.ink3 }}
        >
          <Search size={14} style={{ color: T.bone2 }} aria-hidden="true" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, hashes, modules…"
            className="flex-1 bg-transparent outline-none font-mono text-sm tracking-wide placeholder:opacity-60"
            style={{ color: T.bone0 }}
            aria-label="Search"
            autoFocus
          />
          <kbd
            className="font-mono text-[10px] px-1.5 py-0.5 border"
            style={{ borderColor: T.ink4, color: T.bone2 }}
          >
            ESC
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.mod.length > 0 && (
            <div className="py-2">
              <div
                className="px-4 py-1.5 font-mono text-[9px] tracking-widest uppercase"
                style={{ color: T.bone3 }}
              >
                Modules
              </div>
              {results.mod.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onNavigate(r.id);
                    onClose();
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 focus:outline-none focus-visible:ts-focus hover:bg-black/[0.03]"
                  style={{ color: T.bone1 }}
                >
                  <r.icon size={14} style={{ color: T.bone2 }} aria-hidden="true" />
                  <span className="text-sm flex-1">{r.label}</span>
                  <CornerDownLeft size={12} style={{ color: T.bone3 }} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          {results.proj.length > 0 && (
            <div
              className="py-2 border-t"
              style={{ borderColor: T.ink3 }}
            >
              <div
                className="px-4 py-1.5 font-mono text-[9px] tracking-widest uppercase"
                style={{ color: T.bone3 }}
              >
                Projects
              </div>
              {results.proj.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onOpenProject(r.id);
                    onClose();
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 focus:outline-none focus-visible:ts-focus hover:bg-black/[0.03]"
                >
                  <FolderKanban size={14} style={{ color: T.bone2 }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: T.bone0 }}>
                      {r.label}
                    </div>
                    <div
                      className="font-mono text-[10px] tracking-widest uppercase truncate"
                      style={{ color: T.bone2 }}
                    >
                      {r.sub}
                    </div>
                  </div>
                  <CornerDownLeft size={12} style={{ color: T.bone3 }} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          {results.mod.length === 0 && results.proj.length === 0 && (
            <EmptyState
              icon={Search}
              title="No matches"
              hint={`Nothing matches "${q}". Try a project ID, country, or module name.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ALERTS PANEL
// ════════════════════════════════════════════════════════════════════════════

function AlertsPanel({ open, onClose, onOpenProject }) {
  const ref = useRef(null);
  const store = useStore();
  useFocusTrap(ref, open);
  useKey("Escape", () => open && onClose(), [open, onClose]);
  if (!open) return null;
  const sorted = store.state.conflicts.filter(
    (c) => !c.dismissed
  ).sort((a, b) => {
    const order = { high: 0, med: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Alerts"
    >
      <div
        ref={ref}
        className="w-full max-w-[420px] h-full overflow-y-auto border-l"
        style={{ borderColor: T.ink3, background: T.ink1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{ borderColor: T.ink3, background: T.ink1 }}
        >
          <div>
            <h2
              className="font-serif text-lg leading-none"
              style={{
                fontFamily: "Fraunces, serif",
                fontWeight: 400,
                color: T.bone0,
              }}
            >
              Alerts
            </h2>
            <p
              className="mt-1 font-mono text-[10px] tracking-widest uppercase"
              style={{ color: T.bone2 }}
            >
              {sorted.length} active · Conflict Detection Engine
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone0 }}
            aria-label="Close alerts"
          >
            <X size={14} />
          </button>
        </div>
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {sorted.map((c) => (
            <li
              key={c.id}
              className="px-5 py-4"
              style={{ borderColor: T.ink3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Chip
                  tone={
                    c.severity === "high"
                      ? "risk"
                      : c.severity === "med"
                      ? "warn"
                      : "info"
                  }
                  size="xs"
                >
                  {c.severity}
                </Chip>
                <Chip tone="plum" size="xs">{c.kind}</Chip>
                <span
                  className="ml-auto font-mono text-[10px]"
                  style={{ color: T.bone2 }}
                >
                  {c.detected}
                </span>
              </div>
              <p className="text-sm" style={{ color: T.bone0 }}>
                {c.title}
              </p>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: T.bone1 }}
              >
                {c.desc}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="font-mono text-[10px] tracking-widest uppercase"
                  style={{ color: T.bone2 }}
                >
                  {c.id} · {c.pid}
                </span>
                <Button
                  size="xs"
                  iconRight={ArrowRight}
                  onClick={() => {
                    onOpenProject(c.pid);
                    onClose();
                  }}
                >
                  Investigate
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROJECT DETAIL DRAWER
// ════════════════════════════════════════════════════════════════════════════

function ProjectDrawer({ projectId, extraProjects = [], onClose, onNavigate }) {
  const PROJECTS = useStore().state.projects;
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const open = !!projectId;
  useFocusTrap(ref, open);
  useKey("Escape", () => open && onClose(), [open, onClose]);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [projectId, open]);

  const project = useMemo(
    () => PROJECTS.find((p) => p.id === projectId),
    [projectId, extraProjects]
  );

  // Live mini-ledger for the drawer
  const [ledger, setLedger] = useState([]);
  useEffect(() => {
    if (!project) return;
    setLedger(
      Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        kind: ["EVIDENCE", "APPROVAL", "PAYMENT", "MILESTONE"][i % 4],
        actor: ["Inspector", "Ministry", "Treasury", "Contractor"][i % 4],
        hash: fauxHash(`${project.id}-${i}`),
        t: ["12s", "1m", "4m", "9m", "21m"][i],
      }))
    );
  }, [project]);
  useEffect(() => {
    if (!project || reduced) return;
    let n = 100;
    const t = setInterval(() => {
      n += 1;
      setLedger((prev) =>
        [
          {
            id: n,
            kind: ["EVIDENCE", "APPROVAL", "PAYMENT", "MILESTONE"][n % 4],
            actor: ["Inspector", "Ministry", "Treasury", "Contractor"][n % 4],
            hash: fauxHash(`${project.id}-${n}-${Math.random()}`),
            t: "now",
          },
          ...prev,
        ].slice(0, 6)
      );
    }, 6000);
    return () => clearInterval(t);
  }, [project, reduced]);

  const spendSeries = useMemo(() => {
    if (!project) return [];
    const months = 18;
    const out = [];
    const planSlope = project.budget / months;
    const variance =
      project.risk === "high" ? 1.18 : project.risk === "med" ? 1.07 : 0.98;
    let cumPlan = 0;
    let cumActual = 0;
    const cap = Math.floor((project.progress / 100) * months);
    for (let i = 0; i < months; i++) {
      cumPlan += planSlope;
      if (i <= cap)
        cumActual += planSlope * variance * (0.9 + ((i * 13) % 7) / 30);
      out.push({
        m: `M${i + 1}`,
        planned: Math.round(cumPlan / 1e6),
        actual: i <= cap ? Math.round(cumActual / 1e6) : null,
      });
    }
    return out;
  }, [project]);

  if (!open || !project) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Project ${project?.name || projectId} details`}
    >
      <div
        ref={ref}
        className="w-full max-w-[920px] h-full overflow-y-auto border-l"
        style={{ borderColor: T.ink3, background: T.ink0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b"
          style={{
            background: "rgba(255,255,255,0.92)",
            borderColor: T.ink3,
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Chip tone="verified" size="xs">
                {project?.id}
              </Chip>
              <Chip size="xs">{project?.sector}</Chip>
              <Chip size="xs" tone="info">{project?.donor}</Chip>
            </div>
            <h2
              className="font-serif text-2xl md:text-3xl tracking-tight leading-tight truncate"
              style={{
                fontFamily: "Fraunces, serif",
                fontWeight: 380,
                color: T.bone0,
              }}
            >
              {project?.flag} {project?.name}
            </h2>
            <p
              className="font-mono text-[10px] tracking-widest uppercase mt-1"
              style={{ color: T.bone2 }}
            >
              {project?.ministry} · {project?.country}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone0 }}
            aria-label="Close detail"
          >
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
            {/* KPIs */}
            <div className="col-span-12 md:col-span-4 p-5" style={{ background: T.ink0 }}>
              <div
                className="font-mono text-[10px] tracking-widest uppercase mb-3"
                style={{ color: T.bone2 }}
              >
                Integrity Score
              </div>
              <div className="flex items-baseline gap-2">
                <I3Score score={project.i3} size="lg" />
                <span
                  className="font-mono text-[10px] tracking-widest uppercase"
                  style={{ color: T.bone2 }}
                >
                  / 100
                </span>
              </div>
              <ProgressBar value={project.i3} color={i3Color(project.i3)} />
              <p
                className="mt-3 text-xs leading-relaxed"
                style={{ color: T.bone1 }}
              >
                Composite across financial, schedule, evidence, governance, and conflict dimensions.
              </p>
            </div>
            <div className="col-span-6 md:col-span-4 p-5" style={{ background: T.ink0 }}>
              <div
                className="font-mono text-[10px] tracking-widest uppercase mb-2"
                style={{ color: T.bone2 }}
              >
                Budget · Disbursed
              </div>
              <div
                className="font-serif text-2xl tabular-nums"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontWeight: 380,
                  color: T.bone0,
                }}
              >
                {fmtUSD(project.spent)}
              </div>
              <div
                className="mt-1 font-mono text-[10px]"
                style={{ color: T.bone2 }}
              >
                of {fmtUSD(project.budget)} authorized
              </div>
              <ProgressBar
                value={(project.spent / project.budget) * 100}
                color={T.azure}
              />
            </div>
            <div className="col-span-6 md:col-span-4 p-5" style={{ background: T.ink0 }}>
              <div
                className="font-mono text-[10px] tracking-widest uppercase mb-2"
                style={{ color: T.bone2 }}
              >
                Progress · ETA
              </div>
              <div
                className="font-serif text-2xl tabular-nums"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontWeight: 380,
                  color: T.bone0,
                }}
              >
                {project.progress}%
              </div>
              <div
                className="mt-1 font-mono text-[10px]"
                style={{ color: T.bone2 }}
              >
                ETA {project.eta} · started {project.started}
              </div>
              <ProgressBar value={project.progress} color={T.signal} />
            </div>

            {/* Spend chart */}
            <div className="col-span-12 lg:col-span-8 p-5 md:p-6" style={{ background: T.ink0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-serif text-lg"
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontWeight: 400,
                    color: T.bone0,
                  }}
                >
                  Disbursement curve · planned vs. actual
                </h3>
                <Chip tone="info">USD · millions</Chip>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={spendSeries} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="d_plan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.azure} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={T.azure} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="d_actual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.signal} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={T.signal} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={T.ink3} strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="m"
                      stroke={T.bone3}
                      tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                      axisLine={{ stroke: T.ink3 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={T.bone3}
                      tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RTooltip
                      contentStyle={{
                        background: T.ink0,
                        border: `1px solid ${T.ink3}`,
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                        color: T.bone0,
                      }}
                      labelStyle={{ color: T.bone2 }}
                      cursor={{ stroke: T.ink4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="planned"
                      stroke={T.azure}
                      strokeWidth={1.4}
                      fill="url(#d_plan)"
                      name="Planned"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke={T.signal}
                      strokeWidth={2}
                      fill="url(#d_actual)"
                      name="Actual"
                      dot={false}
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mini-ledger */}
            <div className="col-span-12 lg:col-span-4 p-5 md:p-6" style={{ background: T.ink0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-serif text-lg"
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontWeight: 400,
                    color: T.bone0,
                  }}
                >
                  Recent CLE entries
                </h3>
                <Chip tone="verified">
                  <span className="ts-blink-soft" aria-hidden="true">●</span> Live
                </Chip>
              </div>
              <ul
                className="space-y-2"
                aria-live="polite"
                aria-relevant="additions"
              >
                {ledger.map((row) => (
                  <li
                    key={row.id}
                    className="border p-2.5 ts-fade-in"
                    style={{ borderColor: T.ink3, background: T.ink1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-mono text-[10px] tracking-widest uppercase"
                        style={{ color: T.signal }}
                      >
                        {row.kind}
                      </span>
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: T.bone2 }}
                      >
                        {row.t}
                      </span>
                    </div>
                    <code
                      className="block font-mono text-[10px] truncate"
                      style={{ color: T.bone1, fontFamily: "JetBrains Mono" }}
                      title={row.hash}
                    >
                      {row.hash}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Milestones */}
            <div className="col-span-12 p-5 md:p-6" style={{ background: T.ink0 }}>
              <h3
                className="font-serif text-lg mb-4"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontWeight: 400,
                  color: T.bone0,
                }}
              >
                Milestones
              </h3>
              <ol className="grid grid-cols-1 md:grid-cols-5 gap-px border" style={{ background: T.ink3, borderColor: T.ink3 }}>
                {["Mobilization", "Earthworks", "Structural", "Finishes", "Handover"].map((label, i) => {
                  const done = project.progress >= (i + 1) * 18;
                  return (
                    <li key={label} className="p-4" style={{ background: T.ink0 }}>
                      <div className="flex items-center gap-2 mb-2">
                        {done ? (
                          <CheckCircle2 size={14} style={{ color: T.signal }} aria-hidden="true" />
                        ) : (
                          <CircleDot size={14} style={{ color: T.bone3 }} aria-hidden="true" />
                        )}
                        <span
                          className="font-mono text-[10px] tracking-widest uppercase"
                          style={{ color: T.bone2 }}
                        >
                          M-{String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div
                        className="font-serif text-base"
                        style={{
                          fontFamily: "Fraunces, serif",
                          fontWeight: 400,
                          color: done ? T.bone0 : T.bone2,
                        }}
                      >
                        {label}
                      </div>
                      <Chip tone={done ? "verified" : "neutral"} size="xs" className="mt-3">
                        {done ? "Anchored" : "Pending"}
                      </Chip>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="col-span-12 p-5 md:p-6 flex flex-wrap items-center gap-3" style={{ background: T.ink0 }}>
              <Button
                variant="primary"
                size="md"
                iconRight={ArrowUpRight}
              >
                Open full record
              </Button>
              <Button
                size="md"
                iconLeft={Hash}
                onClick={() => onNavigate("evidence")}
              >
                Evidence ledger
              </Button>
              <Button
                size="md"
                iconLeft={AlertTriangle}
                onClick={() => onNavigate("conflicts")}
              >
                Project conflicts
              </Button>
              <Button
                size="md"
                iconLeft={Download}
                onClick={() =>
                  downloadFile(
                    `audit_pack_${project.id}.pdf`,
                    makePdf(`Audit Pack — ${project.id}`, [
                      `Project: ${project.name}`,
                      `Country: ${project.country} · Sector: ${project.sector}`,
                      `Donor: ${project.donor} · Ministry: ${project.ministry}`,
                      `Budget: ${fmtUSD(project.budget)} · Spent: ${fmtUSD(project.spent)}`,
                      `i3 Integrity Index: ${project.i3} · Risk: ${project.risk}`,
                      `Progress: ${project.progress}% · ${project.started} -> ${project.eta}`,
                      `Open alerts: ${project.alerts}`,
                      "",
                      `Ledger anchor: ${fauxHash(`pack-${project.id}`)}`,
                    ]),
                    "application/pdf"
                  )
                }
              >
                Export audit pack
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: OVERVIEW (Portfolio)
// ════════════════════════════════════════════════════════════════════════════

function OverviewView({ onOpenProject, onNavigate }) {
  const PROJECTS = useStore().state.projects;
  const store = useStore();
  const all = useMemo(
    () => PROJECTS,
    [PROJECTS]
  );
  const totals = useMemo(() => {
    const budget = all.reduce((s, p) => s + p.budget, 0);
    const spent = all.reduce((s, p) => s + p.spent, 0);
    const avgI3 = all.reduce((s, p) => s + p.i3, 0) / all.length;
    const highRisk = all.filter((p) => p.risk === "high").length;
    return { budget, spent, avgI3, highRisk, count: all.length };
  }, [all]);

  const sectorMix = useMemo(() => {
    const m = {};
    all.forEach((p) => {
      m[p.sector] = (m[p.sector] || 0) + p.budget;
    });
    return Object.entries(m).map(([k, v]) => ({ name: k, value: v }));
  }, [all]);

  const trend = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      m: `W${i + 1}`,
      i3: 72 + Math.sin(i * 0.6) * 4 + (i / 12) * 6,
      conflicts: 8 - Math.floor(Math.sin(i * 0.8) * 2 + i / 5),
    }));
  }, []);

  const topRisk = useMemo(
    () => [...all].sort((a, b) => a.i3 - b.i3).slice(0, 5),
    [all]
  );

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      {/* KPI strip */}
      <div className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-px" style={{ background: T.ink3 }}>
        <KPI
          label="Portfolio I³ average"
          value={totals.avgI3.toFixed(1)}
          delta={2.4}
          sublabel="last 30 days"
        />
        <KPI
          label="Total authorized"
          value={fmtUSD(totals.budget)}
          delta={null}
          sublabel={`${totals.count} projects`}
        />
        <KPI
          label="Disbursed"
          value={fmtUSD(totals.spent)}
          delta={5.1}
          sublabel={`${((totals.spent / totals.budget) * 100).toFixed(0)}% of authorized`}
        />
        <KPI
          label="High-risk projects"
          value={totals.highRisk}
          delta={-1.0}
          sublabel="vs. last cycle"
        />
        <KPI
          label="Open conflicts"
          value={CONFLICTS.length}
          delta={null}
          sublabel="Conflict Detection Engine"
        />
      </div>

      {/* Trend + Sector mix */}
      <div className="col-span-12 lg:col-span-8" style={{ background: T.ink1 }}>
        <CardHeader
          title="Portfolio integrity trend"
          subtitle="Weekly · I³ rolling average · CDE detections"
          right={
            <>
              <Chip tone="verified" size="xs">I³ avg</Chip>
              <Chip tone="risk" size="xs">Detections</Chip>
            </>
          }
        />
        <div className="px-5 md:px-6 py-5" style={{ height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={T.ink3} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="m"
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={{ stroke: T.ink3 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="l"
                domain={[60, 90]}
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="r"
                orientation="right"
                domain={[0, 12]}
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={false}
                tickLine={false}
              />
              <RTooltip
                contentStyle={{
                  background: T.ink0,
                  border: `1px solid ${T.ink3}`,
                  fontFamily: "JetBrains Mono",
                  fontSize: 11,
                  color: T.bone0,
                }}
                labelStyle={{ color: T.bone2 }}
                cursor={{ stroke: T.ink4 }}
              />
              <Line
                yAxisId="l"
                type="monotone"
                dataKey="i3"
                stroke={T.signal}
                strokeWidth={2}
                dot={false}
                name="I³ avg"
              />
              <Line
                yAxisId="r"
                type="monotone"
                dataKey="conflicts"
                stroke={T.alert}
                strokeWidth={1.4}
                strokeDasharray="4 3"
                dot={false}
                name="Detections"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4" style={{ background: T.ink1 }}>
        <CardHeader
          title="Authorized by sector"
          subtitle="USD authorized · portfolio mix"
        />
        <div className="px-5 md:px-6 py-5">
          <ul className="space-y-3">
            {sectorMix
              .sort((a, b) => b.value - a.value)
              .map((s) => {
                const max = Math.max(...sectorMix.map((x) => x.value));
                return (
                  <li key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="font-mono text-[11px] tracking-widest uppercase"
                        style={{ color: T.bone1 }}
                      >
                        {s.name}
                      </span>
                      <span
                        className="font-mono text-[11px] tabular-nums"
                        style={{ color: T.bone0 }}
                      >
                        {fmtUSD(s.value)}
                      </span>
                    </div>
                    <div className="relative h-1" style={{ background: T.ink3 }}>
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${(s.value / max) * 100}%`,
                          background: T.signal,
                          transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* Top risk + Recent activity */}
      <div className="col-span-12 lg:col-span-7" style={{ background: T.ink1 }}>
        <CardHeader
          title="Lowest integrity scores"
          subtitle="Investigate projects with elevated risk"
          right={
            <Button
              size="xs"
              iconRight={ArrowRight}
              onClick={() => onNavigate("projects")}
            >
              All projects
            </Button>
          }
        />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {topRisk.map((p) => (
            <li
              key={p.id}
              className="px-5 md:px-6 py-3"
              style={{ borderColor: T.ink3 }}
            >
              <button
                type="button"
                onClick={() => onOpenProject(p.id)}
                className="w-full flex items-center gap-4 text-left focus:outline-none focus-visible:ts-focus group"
              >
                <div className="shrink-0 w-12 text-right">
                  <I3Score score={p.i3} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">{p.flag}</span>
                    <span
                      className="text-sm truncate group-hover:underline"
                      style={{ color: T.bone0 }}
                    >
                      {p.name}
                    </span>
                  </div>
                  <div
                    className="mt-0.5 font-mono text-[10px] tracking-widest uppercase truncate"
                    style={{ color: T.bone2 }}
                  >
                    {p.id} · {p.country} · {p.sector} · {p.donor}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <RiskDot risk={p.risk} label />
                  {p.alerts > 0 && (
                    <Chip tone="risk" size="xs">
                      <AlertTriangle size={10} aria-hidden="true" /> {p.alerts}
                    </Chip>
                  )}
                  <ChevronRight size={14} style={{ color: T.bone2 }} aria-hidden="true" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-12 lg:col-span-5" style={{ background: T.ink1 }}>
        <CardHeader
          title="Pending approvals"
          subtitle="Sorted by SLA · oldest first"
          right={
            <Button
              size="xs"
              iconRight={ArrowRight}
              onClick={() => onNavigate("approvals")}
            >
              Queue
            </Button>
          }
        />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {APPROVALS.slice(0, 5).map((a) => (
            <li
              key={a.id}
              className="px-5 md:px-6 py-3 flex items-center gap-3"
              style={{ borderColor: T.ink3 }}
            >
              <Chip
                size="xs"
                tone={
                  a.priority === "high"
                    ? "risk"
                    : a.priority === "med"
                    ? "warn"
                    : "info"
                }
              >
                {a.priority}
              </Chip>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm truncate"
                  style={{ color: T.bone0 }}
                >
                  {a.title}
                </div>
                <div
                  className="mt-0.5 font-mono text-[10px] tracking-widest uppercase truncate"
                  style={{ color: T.bone2 }}
                >
                  {a.pid} · {a.role} · {a.sla}
                </div>
              </div>
              <Button size="xs" iconRight={ArrowRight}>
                Review
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: PROJECTS (Data table)
// ════════════════════════════════════════════════════════════════════════════

function ProjectsView({ onOpenProject, extra = [] }) {
  const PROJECTS = useStore().state.projects;
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState({ key: "i3", dir: "asc" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      if (sectorFilter !== "ALL" && p.sector !== sectorFilter) return false;
      if (riskFilter !== "ALL" && p.risk !== riskFilter) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.id.toLowerCase().includes(q) &&
        !p.country.toLowerCase().includes(q)
      )
        return false;
      return true;
    }).sort((a, b) => {
      const ka = a[sortBy.key];
      const kb = b[sortBy.key];
      if (typeof ka === "number") {
        return sortBy.dir === "asc" ? ka - kb : kb - ka;
      }
      return sortBy.dir === "asc"
        ? String(ka).localeCompare(String(kb))
        : String(kb).localeCompare(String(ka));
    });
  }, [query, sectorFilter, riskFilter, sortBy, PROJECTS]);

  const sortFor = (key) =>
    setSortBy((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const SortHeader = ({ k, children, align = "left" }) => {
    const isActive = sortBy.key === k;
    return (
      <th
        scope="col"
        className={`text-${align} px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap`}
        style={{ color: T.bone2 }}
        aria-sort={
          isActive ? (sortBy.dir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <button
          type="button"
          onClick={() => sortFor(k)}
          className={`inline-flex items-center gap-1 focus:outline-none focus-visible:ts-focus ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
          style={{ color: isActive ? T.bone0 : T.bone2 }}
        >
          {children}
          {isActive ? (
            sortBy.dir === "asc" ? (
              <ArrowUp size={10} aria-hidden="true" />
            ) : (
              <ArrowDown size={10} aria-hidden="true" />
            )
          ) : (
            <span
              className="opacity-40"
              aria-hidden="true"
              style={{ width: 10 }}
            />
          )}
        </button>
      </th>
    );
  };

  return (
    <Card>
      <div
        className="flex flex-col md:flex-row md:items-center gap-3 px-5 md:px-6 py-4 border-b"
        style={{ borderColor: T.ink3 }}
      >
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border" style={{ borderColor: T.ink3, background: T.ink2 }}>
          <Search size={12} style={{ color: T.bone2 }} aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter projects, IDs, countries…"
            className="flex-1 bg-transparent outline-none font-mono text-xs tracking-wide placeholder:opacity-50"
            style={{ color: T.bone0 }}
            aria-label="Filter projects"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="focus:outline-none focus-visible:ts-focus"
              style={{ color: T.bone2 }}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            label="Sector"
            value={sectorFilter}
            onChange={setSectorFilter}
            options={["ALL", ...SECTORS]}
          />
          <Select
            label="Risk"
            value={riskFilter}
            onChange={setRiskFilter}
            options={["ALL", ...RISKS]}
          />
          <Button
            iconLeft={Download}
            onClick={() =>
              downloadFile(
                `projects_${new Date().toISOString().slice(0, 10)}.csv`,
                toCSV(
                  ["id", "name", "country", "sector", "donor", "budget", "spent", "i3", "risk", "progress", "started", "eta"],
                  filtered.map((p) => [p.id, p.name, p.country, p.sector, p.donor, p.budget, p.spent, p.i3, p.risk, p.progress, p.started, p.eta])
                ),
                "text/csv"
              )
            }
          >
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No projects match these filters"
            hint="Try widening the sector or risk filter, or clear the search."
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setSectorFilter("ALL");
                  setRiskFilter("ALL");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                <SortHeader k="name">Project</SortHeader>
                <SortHeader k="sector">Sector</SortHeader>
                <SortHeader k="donor">Donor</SortHeader>
                <SortHeader k="i3" align="right">I³</SortHeader>
                <SortHeader k="budget" align="right">Budget</SortHeader>
                <SortHeader k="progress" align="right">Progress</SortHeader>
                <SortHeader k="risk">Risk</SortHeader>
                <SortHeader k="lastEvent">Activity</SortHeader>
                <th
                  scope="col"
                  className="px-4 py-3 font-mono text-[10px] tracking-widest uppercase"
                  style={{ color: T.bone2 }}
                  aria-label="Actions"
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="ts-row border-b cursor-pointer focus-within:bg-black/[0.03]"
                  style={{ borderColor: T.ink3 }}
                  onClick={() => onOpenProject(p.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenProject(p.id);
                    }
                  }}
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true">{p.flag}</span>
                      <div className="min-w-0">
                        <div
                          className="truncate"
                          style={{ color: T.bone0 }}
                        >
                          {p.name}
                        </div>
                        <div
                          className="font-mono text-[10px] tracking-widest uppercase truncate"
                          style={{ color: T.bone2 }}
                        >
                          {p.id} · {p.country}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Chip size="xs">{p.sector}</Chip>
                  </td>
                  <td className="px-4 py-3 align-middle font-mono text-[11px]" style={{ color: T.bone1 }}>
                    {p.donor}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <I3Score score={p.i3} size="md" />
                  </td>
                  <td className="px-4 py-3 align-middle text-right font-mono tabular-nums" style={{ color: T.bone0 }}>
                    {fmtUSD(p.budget)}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex items-center gap-3 justify-end">
                      <span className="font-mono text-[11px] tabular-nums" style={{ color: T.bone1 }}>
                        {p.progress}%
                      </span>
                      <div style={{ width: 72 }}>
                        <ProgressBar value={p.progress} color={T.signal} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <RiskDot risk={p.risk} label />
                  </td>
                  <td className="px-4 py-3 align-middle font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} aria-hidden="true" />
                      {p.lastEvent}
                      {p.alerts > 0 && (
                        <Chip size="xs" tone="risk" className="ml-1">
                          {p.alerts}
                        </Chip>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <ChevronRight size={14} style={{ color: T.bone2 }} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div
        className="px-5 md:px-6 py-3 border-t flex items-center justify-between"
        style={{ borderColor: T.ink3 }}
      >
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: T.bone2 }}
        >
          {filtered.length} of {PROJECTS.length} projects
        </span>
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: T.bone3 }}
        >
          Live · last sync 2s ago
        </span>
      </div>
    </Card>
  );
}

function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 px-2.5 py-2 border"
      style={{ borderColor: T.ink3, background: T.ink2 }}
    >
      <span
        className="font-mono text-[10px] tracking-widest uppercase"
        style={{ color: T.bone2 }}
      >
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none font-mono text-[11px] tracking-widest uppercase focus:outline-none focus-visible:ts-focus"
        style={{ color: T.bone0 }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: T.ink0, color: T.bone0 }}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: EVIDENCE LEDGER
// ════════════════════════════════════════════════════════════════════════════

function EvidenceView({ onOpenProject }) {
  const PROJECTS = useStore().state.projects;
  const reduced = usePrefersReducedMotion();
  const store = useStore();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Seed
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const kinds = ["EVIDENCE", "APPROVAL", "PAYMENT", "MILESTONE"];
      const actors = ["Inspector", "Ministry", "Treasury", "Contractor", "Engineer", "Auditor"];
      const seeded = Array.from({ length: 28 }).map((_, i) => {
        const p = PROJECTS[i % PROJECTS.length];
        return {
          id: 2000 - i,
          kind: kinds[i % kinds.length],
          actor: actors[i % actors.length],
          pid: p.id,
          country: p.country,
          flag: p.flag,
          hash: fauxHash(`seed-${i}`),
          block: 1284019 - i * 3,
          t: `${i + 1}m ago`,
        };
      });
      setEntries(seeded);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Live append
  useEffect(() => {
    if (reduced || loading) return;
    let n = 3000;
    const kinds = ["EVIDENCE", "APPROVAL", "PAYMENT", "MILESTONE"];
    const actors = ["Inspector", "Ministry", "Treasury", "Contractor", "Engineer"];
    const t = setInterval(() => {
      n += 1;
      const p = PROJECTS[n % PROJECTS.length];
      setEntries((prev) =>
        [
          {
            id: n,
            kind: kinds[n % kinds.length],
            actor: actors[n % actors.length],
            pid: p.id,
            country: p.country,
            flag: p.flag,
            hash: fauxHash(`live-${n}-${Math.random()}`),
            block: 1284019 + (n % 50),
            t: "now",
            isNew: true,
          },
          ...prev,
        ].slice(0, 60)
      );
    }, 4500);
    return () => clearInterval(t);
  }, [reduced, loading]);

  const filtered = [...store.state.evidence, ...entries].filter((e) => {
    if (filter !== "ALL" && e.kind !== filter) return false;
    const q = search.trim().toLowerCase();
    if (
      q &&
      !e.pid.toLowerCase().includes(q) &&
      !e.hash.toLowerCase().includes(q) &&
      !e.country.toLowerCase().includes(q) &&
      !e.actor.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  return (
    <Card>
      <div
        className="flex flex-col md:flex-row md:items-center gap-3 px-5 md:px-6 py-4 border-b"
        style={{ borderColor: T.ink3 }}
      >
        <div className="flex-1 min-w-0">
          <h2
            className="font-serif text-xl tracking-tight"
            style={{
              fontFamily: "Fraunces, serif",
              fontWeight: 400,
              color: T.bone0,
            }}
          >
            Evidence Ledger
          </h2>
          <p
            className="font-mono text-[10px] tracking-widest uppercase mt-1"
            style={{ color: T.bone2 }}
          >
            Composite Ledger Entries · Merkle-batched · Hybrid chain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 border" style={{ borderColor: T.ink3, background: T.ink2 }}>
            <Search size={12} style={{ color: T.bone2 }} aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by project, hash, actor…"
              className="bg-transparent outline-none font-mono text-xs"
              style={{ color: T.bone0, width: 220 }}
              aria-label="Filter ledger"
            />
          </div>
          <Button
            iconLeft={Download}
            onClick={() =>
              downloadFile(
                `evidence_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
                toCSV(
                  ["id", "kind", "actor", "project", "country", "hash", "block", "time"],
                  filtered.map((e) => [e.id, e.kind, e.actor, e.pid, e.country, e.hash, e.block, e.t])
                ),
                "text/csv"
              )
            }
          >
            Export CSV
          </Button>
          <Button variant="primary" iconLeft={PlusCircle} onClick={() => setUploadOpen(true)}>
            Submit evidence
          </Button>
        </div>
      </div>
      {uploadOpen && (
        <UploadEvidenceModal
          onClose={() => setUploadOpen(false)}
          onComplete={(d) => {
            store.addEvidence(d);
            setUploadOpen(false);
          }}
        />
      )}

      <div
        className="px-5 md:px-6 py-3 border-b flex items-center gap-1 overflow-x-auto"
        style={{ borderColor: T.ink3 }}
        role="tablist"
        aria-label="Filter by entry kind"
      >
        {["ALL", "EVIDENCE", "APPROVAL", "PAYMENT", "MILESTONE"].map((k) => {
          const isActive = filter === k;
          const count =
            k === "ALL"
              ? entries.length
              : entries.filter((e) => e.kind === k).length;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(k)}
              className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1.5 border focus:outline-none focus-visible:ts-focus flex items-center gap-2"
              style={{
                borderColor: isActive ? T.signal : T.ink3,
                color: isActive ? T.signal : T.bone2,
                background: isActive ? tint(T.signal, 0.12) : "transparent",
              }}
            >
              {k}
              <span
                className="font-mono text-[9px] tabular-nums opacity-70"
                style={{ color: isActive ? T.signal : T.bone3 }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto" aria-live="polite" aria-relevant="additions">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Hash}
            title="No entries match"
            hint="Wait for the next CLE batch or broaden your filter."
          />
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                <th
                  scope="col"
                  className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
                  style={{ color: T.bone2 }}
                >
                  Kind
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
                  style={{ color: T.bone2 }}
                >
                  Hash · CLE
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
                  style={{ color: T.bone2 }}
                >
                  Project
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
                  style={{ color: T.bone2 }}
                >
                  Actor
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
                  style={{ color: T.bone2 }}
                >
                  Block
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
                  style={{ color: T.bone2 }}
                >
                  Anchored
                </th>
                <th
                  scope="col"
                  className="px-4 py-3"
                  aria-label="Actions"
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className={`ts-row border-b ${e.isNew ? "ts-fade-in" : ""}`}
                  style={{ borderColor: T.ink3 }}
                >
                  <td className="px-4 py-3 align-middle">
                    <Chip
                      tone={
                        e.kind === "EVIDENCE"
                          ? "verified"
                          : e.kind === "APPROVAL"
                          ? "info"
                          : e.kind === "PAYMENT"
                          ? "plum"
                          : "warn"
                      }
                      size="xs"
                    >
                      {e.kind}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <code
                      className="font-mono text-[11px] tabular-nums"
                      style={{ color: T.bone0, fontFamily: "JetBrains Mono" }}
                      title={e.hash}
                    >
                      {e.hash.slice(0, 14)}…{e.hash.slice(-6)}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => onOpenProject(e.pid)}
                      className="inline-flex items-center gap-2 focus:outline-none focus-visible:ts-focus"
                    >
                      <span aria-hidden="true">{e.flag}</span>
                      <span
                        className="font-mono text-[11px] tracking-widest uppercase"
                        style={{ color: T.bone1 }}
                      >
                        {e.pid}
                      </span>
                      <ExternalLink size={11} style={{ color: T.bone2 }} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-4 py-3 align-middle font-mono text-[11px]" style={{ color: T.bone1 }}>
                    {e.actor}
                  </td>
                  <td className="px-4 py-3 align-middle text-right font-mono text-[11px] tabular-nums" style={{ color: T.bone1 }}>
                    #{e.block.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 align-middle font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                    <Clock size={10} className="inline mr-1" aria-hidden="true" />
                    {e.t}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <BadgeCheck size={14} style={{ color: T.signal }} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
        className="px-5 md:px-6 py-3 border-t flex items-center justify-between"
        style={{ borderColor: T.ink3 }}
      >
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: T.bone2 }}
        >
          {filtered.length} entries
        </span>
        <span
          className="font-mono text-[10px] tracking-widest uppercase flex items-center gap-2"
          style={{ color: T.bone2 }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full ts-blink-soft"
            style={{ background: T.signal }}
            aria-hidden="true"
          />
          Streaming
        </span>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: I³ ANALYTICS
// ════════════════════════════════════════════════════════════════════════════

function I3AnalyticsView({ onOpenProject }) {
  const PROJECTS = useStore().state.projects;
  const dims = [
    { k: "Financial", v: 81 },
    { k: "Schedule", v: 68 },
    { k: "Evidence", v: 91 },
    { k: "Governance", v: 74 },
    { k: "Conflicts", v: 63 },
  ];
  const histogram = useMemo(() => {
    const buckets = [
      { range: "0-40", count: 0 },
      { range: "40-55", count: 0 },
      { range: "55-70", count: 0 },
      { range: "70-85", count: 0 },
      { range: "85-100", count: 0 },
    ];
    PROJECTS.forEach((p) => {
      if (p.i3 < 40) buckets[0].count++;
      else if (p.i3 < 55) buckets[1].count++;
      else if (p.i3 < 70) buckets[2].count++;
      else if (p.i3 < 85) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, []);

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 lg:col-span-4" style={{ background: T.ink1 }}>
        <CardHeader
          title="Portfolio I³"
          subtitle="Composite — last 24h"
        />
        <div className="p-6 flex flex-col items-center">
          <I3RadialGauge value={76.4} />
          <div className="mt-4 grid grid-cols-3 gap-4 w-full">
            <Stat label="Δ 24h" value="+1.2" tone={T.signal} />
            <Stat label="Median" value="74.0" />
            <Stat label="P10" value="49.1" tone={T.alert} />
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8" style={{ background: T.ink1 }}>
        <CardHeader
          title="Dimension breakdown"
          subtitle="Portfolio-weighted score per dimension"
          right={<Chip size="xs" tone="info">Patent #2</Chip>}
        />
        <div className="p-6 space-y-5">
          {dims.map((d) => (
            <div key={d.k}>
              <div className="flex items-end justify-between mb-2">
                <span
                  className="font-mono text-[11px] tracking-widest uppercase"
                  style={{ color: T.bone1 }}
                >
                  {d.k}
                </span>
                <span
                  className="font-serif text-2xl tabular-nums leading-none"
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontWeight: 380,
                    color: i3Color(d.v),
                  }}
                >
                  {d.v}
                </span>
              </div>
              <div className="relative h-1.5" style={{ background: T.ink3 }}>
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${d.v}%`,
                    background: i3Color(d.v),
                    transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6" style={{ background: T.ink1 }}>
        <CardHeader
          title="Score distribution"
          subtitle="Projects per I³ bucket"
        />
        <div className="p-5" style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={histogram} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={T.ink3} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="range"
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={{ stroke: T.ink3 }}
                tickLine={false}
              />
              <YAxis
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <RTooltip
                contentStyle={{
                  background: T.ink0,
                  border: `1px solid ${T.ink3}`,
                  fontFamily: "JetBrains Mono",
                  fontSize: 11,
                  color: T.bone0,
                }}
                labelStyle={{ color: T.bone2 }}
                cursor={{ fill: T.ink2 }}
              />
              <Bar dataKey="count" radius={[1, 1, 0, 0]}>
                {histogram.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      i <= 1 ? T.alert : i === 2 ? T.amber : T.signal
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6" style={{ background: T.ink1 }}>
        <CardHeader
          title="Top movers — last 7 days"
          subtitle="Largest I³ deltas across the portfolio"
        />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {[
            { p: PROJECTS[3], delta: +4.2 },
            { p: PROJECTS[2], delta: -3.8 },
            { p: PROJECTS[8], delta: -3.1 },
            { p: PROJECTS[5], delta: +2.4 },
            { p: PROJECTS[10], delta: +1.9 },
          ].map(({ p, delta }) => (
            <li
              key={p.id}
              className="px-5 py-3"
              style={{ borderColor: T.ink3 }}
            >
              <button
                type="button"
                onClick={() => onOpenProject(p.id)}
                className="w-full flex items-center gap-3 focus:outline-none focus-visible:ts-focus group"
              >
                <span aria-hidden="true">{p.flag}</span>
                <span
                  className="flex-1 min-w-0 text-sm truncate text-left group-hover:underline"
                  style={{ color: T.bone0 }}
                >
                  {p.name}
                </span>
                <I3Score score={p.i3} size="sm" />
                <span
                  className="font-mono text-[11px] tabular-nums w-14 text-right"
                  style={{ color: delta > 0 ? T.signal : T.alert }}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="text-center">
      <div
        className="font-mono text-[10px] tracking-widest uppercase"
        style={{ color: T.bone2 }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-serif text-xl tabular-nums"
        style={{
          fontFamily: "Fraunces, serif",
          fontWeight: 380,
          color: tone || T.bone0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function I3RadialGauge({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 78;
  const c = 2 * Math.PI * r;
  const arc = (270 / 360) * c;
  const dashOffset = arc * (1 - pct / 100);
  const titleId = useId();
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxWidth: 220 }} role="img">
      <title id={titleId}>{`Portfolio integrity score ${pct.toFixed(1)} out of 100`}</title>
      <g transform="rotate(135 100 100)">
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={T.ink3}
          strokeWidth="6"
          strokeDasharray={`${arc} ${c}`}
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={i3Color(pct)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </g>
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "Fraunces, serif", fontWeight: 380 }}
        fontSize="52"
        fill={T.bone0}
      >
        {pct.toFixed(1)}
      </text>
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fontSize="10"
        letterSpacing="2"
        fill={T.bone2}
        style={{ fontFamily: "JetBrains Mono" }}
      >
        I³ · /100
      </text>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: CONFLICT DETECTION
// ════════════════════════════════════════════════════════════════════════════

function ConflictsView({ onOpenProject }) {
  const store = useStore();
  const PROJECTS = store.state.projects;
  const CONFLICTS = store.state.conflicts;
  const [sev, setSev] = useState("ALL");
  const [kind, setKind] = useState("ALL");
  const live = CONFLICTS.filter((c) => !c.dismissed);
  const filtered = live.filter(
    (c) =>
      (sev === "ALL" || c.severity === sev) &&
      (kind === "ALL" || c.kind === kind)
  );
  const kinds = [...new Set(CONFLICTS.map((c) => c.kind))];

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b" style={{ borderColor: T.ink3 }}>
        <div>
          <h2
            className="font-serif text-xl tracking-tight"
            style={{
              fontFamily: "Fraunces, serif",
              fontWeight: 400,
              color: T.bone0,
            }}
          >
            Conflict Detection Engine
          </h2>
          <p
            className="font-mono text-[10px] tracking-widest uppercase mt-1"
            style={{ color: T.bone2 }}
          >
            Patent #3 · ML-driven anomaly surfacing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select label="Severity" value={sev} onChange={setSev} options={["ALL", ...RISKS]} />
          <Select label="Kind" value={kind} onChange={setKind} options={["ALL", ...kinds]} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No matching conflicts"
          hint="Widen the filters or open the full queue."
          action={
            <Button onClick={() => { setSev("ALL"); setKind("ALL"); }}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {filtered.map((c) => {
            const project = PROJECTS.find((p) => p.id === c.pid);
            return (
              <li
                key={c.id}
                className="px-5 md:px-6 py-4 flex flex-col md:flex-row md:items-center gap-4"
                style={{ borderColor: T.ink3 }}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <Chip
                    tone={
                      c.severity === "high"
                        ? "risk"
                        : c.severity === "med"
                        ? "warn"
                        : "info"
                    }
                  >
                    {c.severity}
                  </Chip>
                  <Chip tone="plum" size="xs">{c.kind}</Chip>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: T.bone0 }}>{c.title}</p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: T.bone1 }}
                  >
                    {c.desc}
                  </p>
                  <p
                    className="mt-1.5 font-mono text-[10px] tracking-widest uppercase"
                    style={{ color: T.bone2 }}
                  >
                    {c.id} · {c.pid} {project ? `· ${project.country}` : ""} · {c.detected}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Button size="sm" onClick={() => onOpenProject(c.pid)} iconRight={ArrowRight}>
                    Investigate
                  </Button>
                  <Button size="sm" variant="quiet" onClick={() => store.dismissConflict(c.id, c.title, c.pid)}>
                    Dismiss
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div
        className="px-5 md:px-6 py-3 border-t flex items-center justify-between"
        style={{ borderColor: T.ink3 }}
      >
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: T.bone2 }}
        >
          {filtered.length} of {live.length} active · {CONFLICTS.filter((c) => c.dismissed).length} dismissed
        </span>
        <Button
          size="xs"
          iconLeft={Download}
          onClick={() =>
            downloadFile(
              `conflict_queue_${new Date().toISOString().slice(0, 10)}.csv`,
              toCSV(
                ["id", "project", "severity", "kind", "title", "description", "detected"],
                filtered.map((c) => [c.id, c.pid, c.severity, c.kind, c.title, c.desc, c.detected])
              ),
              "text/csv"
            )
          }
        >
          Export queue
        </Button>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: APPROVALS
// ════════════════════════════════════════════════════════════════════════════

function ApprovalsView({ onOpenProject }) {
  const store = useStore();
  const PROJECTS = store.state.projects;
  const APPROVALS = store.state.approvals;
  const decided = Object.fromEntries(APPROVALS.filter((a) => a.decision).map((a) => [a.id, a.decision]));
  const decide = (id, choice) => store.decideApproval(id, choice);
  const queue = APPROVALS;
  const pending = queue.filter((a) => !decided[a.id]);

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="In queue" value={pending.length} sublabel="awaiting decision" />
        <KPI label="High priority" value={pending.filter((a) => a.priority === "high").length} sublabel="SLA <24h" />
        <KPI label="Approved today" value={Object.values(decided).filter((d) => d === "approved").length} sublabel="this session" />
        <KPI label="Returned" value={Object.values(decided).filter((d) => d === "returned").length} sublabel="this session" />
      </div>

      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader
          title="Approvals queue"
          subtitle="Ranked by SLA · oldest deadline first"
        />
        {pending.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="All caught up"
            hint="No outstanding approvals in your queue right now."
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: T.ink3 }}>
            {pending.map((a) => {
              const p = PROJECTS.find((x) => x.id === a.pid);
              return (
                <li key={a.id} className="px-5 md:px-6 py-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <Chip
                        tone={
                          a.priority === "high"
                            ? "risk"
                            : a.priority === "med"
                            ? "warn"
                            : "info"
                        }
                      >
                        {a.priority}
                      </Chip>
                      <span
                        className="font-mono text-[10px] tracking-widest uppercase"
                        style={{ color: T.bone2 }}
                      >
                        {a.id}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: T.bone0 }}>{a.title}</p>
                      <p
                        className="mt-1 font-mono text-[10px] tracking-widest uppercase"
                        style={{ color: T.bone2 }}
                      >
                        {p?.flag} {a.pid} · {p?.name || ""}
                      </p>
                      <p
                        className="mt-0.5 font-mono text-[10px] tracking-widest uppercase"
                        style={{ color: T.bone2 }}
                      >
                        Requested by {a.requested} · {a.submitted} · Role required: {a.role} · {a.sla}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 flex-wrap">
                      <Button size="sm" onClick={() => onOpenProject(a.pid)} iconLeft={Eye}>
                        Inspect
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => decide(a.id, "returned")}
                      >
                        Return
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => decide(a.id, "approved")}
                        iconLeft={BadgeCheck}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {Object.keys(decided).length > 0 && (
        <div className="col-span-12" style={{ background: T.ink1 }}>
          <CardHeader
            title="Session activity"
            subtitle="Your decisions this session — anchored to the ledger"
          />
          <ul className="divide-y" style={{ borderColor: T.ink3 }}>
            {Object.entries(decided).map(([id, choice]) => {
              const a = APPROVALS.find((x) => x.id === id);
              if (!a) return null;
              return (
                <li key={id} className="px-5 md:px-6 py-3 flex items-center gap-3">
                  <Chip tone={choice === "approved" ? "verified" : "risk"} size="xs">
                    {choice}
                  </Chip>
                  <span className="text-sm flex-1" style={{ color: T.bone0 }}>
                    {a.title}
                  </span>
                  <code
                    className="font-mono text-[10px]"
                    style={{ color: T.bone2, fontFamily: "JetBrains Mono" }}
                  >
                    {fauxHash(`decision-${id}-${choice}`).slice(0, 18)}…
                  </code>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: DISBURSEMENTS
// ════════════════════════════════════════════════════════════════════════════

function DisbursementsView() {
  const PROJECTS = useStore().state.projects;
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0);
  const trend = Array.from({ length: 12 }).map((_, i) => ({
    m: `M${i + 1}`,
    planned: (totalBudget / 12) * (i + 1) / 1e6,
    actual:
      i < 9 ? (totalSpent / 9) * (i + 1) / 1e6 * (0.9 + (i % 4) * 0.03) : null,
  }));
  const donorMix = useMemo(() => {
    const m = {};
    PROJECTS.forEach((p) => {
      m[p.donor] = (m[p.donor] || 0) + p.spent;
    });
    return Object.entries(m).map(([k, v]) => ({ donor: k, value: v }));
  }, []);

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Authorized" value={fmtUSD(totalBudget)} sublabel="active portfolio" />
        <KPI label="Disbursed" value={fmtUSD(totalSpent)} delta={5.1} sublabel={`${((totalSpent / totalBudget) * 100).toFixed(0)}%`} />
        <KPI label="Pending tranches" value={7} sublabel="Treasury review" />
        <KPI label="Velocity" value={fmtUSD(48_300_000)} sublabel="last 7 days" />
      </div>

      <div className="col-span-12 lg:col-span-8" style={{ background: T.ink1 }}>
        <CardHeader title="Cumulative disbursement" subtitle="Portfolio — USD millions" />
        <div className="p-5" style={{ height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="disb_plan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.azure} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={T.azure} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="disb_actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.signal} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.signal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.ink3} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="m"
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={{ stroke: T.ink3 }}
                tickLine={false}
              />
              <YAxis
                stroke={T.bone3}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }}
                axisLine={false}
                tickLine={false}
              />
              <RTooltip
                contentStyle={{
                  background: T.ink0,
                  border: `1px solid ${T.ink3}`,
                  fontFamily: "JetBrains Mono",
                  fontSize: 11,
                  color: T.bone0,
                }}
                labelStyle={{ color: T.bone2 }}
                cursor={{ stroke: T.ink4 }}
              />
              <Area type="monotone" dataKey="planned" stroke={T.azure} strokeWidth={1.4} fill="url(#disb_plan)" name="Planned" dot={false} />
              <Area type="monotone" dataKey="actual" stroke={T.signal} strokeWidth={2} fill="url(#disb_actual)" name="Actual" dot={false} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4" style={{ background: T.ink1 }}>
        <CardHeader title="By donor" subtitle="Disbursed · USD" />
        <ul className="p-5 space-y-3">
          {donorMix
            .sort((a, b) => b.value - a.value)
            .map((d) => {
              const max = Math.max(...donorMix.map((x) => x.value));
              return (
                <li key={d.donor}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="font-mono text-[11px] tracking-widest uppercase"
                      style={{ color: T.bone1 }}
                    >
                      {d.donor}
                    </span>
                    <span
                      className="font-mono text-[11px] tabular-nums"
                      style={{ color: T.bone0 }}
                    >
                      {fmtUSD(d.value)}
                    </span>
                  </div>
                  <div className="relative h-1" style={{ background: T.ink3 }}>
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${(d.value / max) * 100}%`,
                        background: T.azure,
                      }}
                    />
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: GEOSPATIAL
// ════════════════════════════════════════════════════════════════════════════

function GeoView({ onOpenProject }) {
  const PROJECTS = useStore().state.projects;
  const W = 880;
  const H = 440;
  const [hover, setHover] = useState(null);

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 lg:col-span-9" style={{ background: T.ink1 }}>
        <CardHeader
          title="Portfolio geography"
          subtitle="Project locations · color by I³ score"
          right={
            <>
              <Chip tone="verified" size="xs">≥80</Chip>
              <Chip tone="warn" size="xs">65–79</Chip>
              <Chip tone="risk" size="xs">&lt;65</Chip>
            </>
          }
        />
        <div className="p-4">
          <div
            className="relative w-full"
            style={{
              aspectRatio: `${W}/${H}`,
              background: T.ink0,
              border: `1px solid ${T.ink3}`,
            }}
          >
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="World map with project markers">
              <defs>
                <pattern id="dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill={T.ink3} />
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#dots)" />
              {/* Equator + tropic guides */}
              <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke={T.ink3} strokeWidth="0.5" />
              <line x1="0" y1={H / 2 - (23.5 / 180) * H} x2={W} y2={H / 2 - (23.5 / 180) * H} stroke={T.ink3} strokeDasharray="2 4" strokeWidth="0.5" />
              <line x1="0" y1={H / 2 + (23.5 / 180) * H} x2={W} y2={H / 2 + (23.5 / 180) * H} stroke={T.ink3} strokeDasharray="2 4" strokeWidth="0.5" />

              {/* Project dots */}
              {PROJECTS.map((p) => {
                const [lon, lat] = PROJECT_GEO(p.id);
                const [x, y] = project(lon, lat, W, H);
                const color = i3Color(p.i3);
                const isHover = hover === p.id;
                return (
                  <g key={p.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHover ? 12 : 7}
                      fill={color}
                      opacity={0.18}
                      style={{ transition: "r 200ms ease" }}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={3.5}
                      fill={color}
                      stroke={T.ink0}
                      strokeWidth="1.2"
                      onMouseEnter={() => setHover(p.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onOpenProject(p.id)}
                      style={{ cursor: "pointer" }}
                      aria-label={`${p.name}, I³ ${p.i3.toFixed(1)}`}
                    />
                    {isHover && (
                      <g>
                        <rect
                          x={x + 8}
                          y={y - 32}
                          width="180"
                          height="42"
                          fill={T.ink0}
                          stroke={T.ink3}
                        />
                        <text
                          x={x + 16}
                          y={y - 17}
                          fill={T.bone0}
                          fontSize="11"
                          fontFamily="Fraunces, serif"
                        >
                          {p.name.slice(0, 26)}
                        </text>
                        <text
                          x={x + 16}
                          y={y - 4}
                          fill={T.bone2}
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          letterSpacing="2"
                        >
                          I³ {p.i3.toFixed(1)} · {p.country.toUpperCase()}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-3" style={{ background: T.ink1 }}>
        <CardHeader title="By country" subtitle={`${PROJECTS.length} active sites`} />
        <ul
          className="divide-y overflow-y-auto"
          style={{ borderColor: T.ink3, maxHeight: 460 }}
        >
          {PROJECTS.map((p) => (
            <li
              key={p.id}
              className="px-5 py-3"
              style={{ borderColor: T.ink3 }}
            >
              <button
                type="button"
                onClick={() => onOpenProject(p.id)}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                className="w-full flex items-center gap-3 focus:outline-none focus-visible:ts-focus group"
              >
                <span aria-hidden="true">{p.flag}</span>
                <span
                  className="flex-1 min-w-0 text-left text-sm truncate group-hover:underline"
                  style={{ color: T.bone0 }}
                >
                  {p.country}
                </span>
                <I3Score score={p.i3} size="sm" />
                <RiskDot risk={p.risk} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: AUDIT TRAIL
// ════════════════════════════════════════════════════════════════════════════

function AuditView({ onOpenProject }) {
  const store = useStore();
  const PROJECTS = store.state.projects;
  const [uploadOpen, setUploadOpen] = useState(false);
  const extra = store.state.auditEvents;
  const events = useMemo(() => {
    const types = [
      { label: "EVIDENCE", tone: "verified" },
      { label: "APPROVAL", tone: "info" },
      { label: "PAYMENT", tone: "plum" },
      { label: "MILESTONE", tone: "warn" },
      { label: "AMENDMENT", tone: "risk" },
    ];
    const out = [];
    for (let i = 0; i < 14; i++) {
      const p = PROJECTS[i % PROJECTS.length];
      const t = types[i % types.length];
      out.push({
        id: i,
        ts: `${(i + 1) * 7} min ago`,
        pid: p.id,
        flag: p.flag,
        country: p.country,
        actor: ["S. Ramírez · Auditor", "M. Otieno · Engineer", "P. dela Cruz · Inspector", "K. Bello · Treasury", "F. Haddad · Ministry"][i % 5],
        label: t.label,
        tone: t.tone,
        text: [
          "Anchored evidence batch for milestone certification",
          "Approved disbursement tranche under dual-control policy",
          "Reviewed and returned amendment package for revision",
          "Recorded geotagged inspection set (n=24 photos)",
          "Released milestone certificate to donor portal",
        ][i % 5],
        hash: fauxHash(`audit-${i}`),
      });
    }
    return out;
  }, []);

  const allEvents = [...extra, ...events];

  return (
    <Card>
      <CardHeader
        title="Audit trail"
        subtitle="Chronological · cryptographically chained · export-ready"
        right={
          <>
            <Button
              size="xs"
              iconLeft={Download}
              onClick={() =>
                downloadFile(
                  `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`,
                  toCSV(
                    ["id", "time", "project", "country", "actor", "type", "event", "hash"],
                    allEvents.map((e) => [e.id, e.ts, e.pid, e.country, e.actor, e.label, e.text, e.hash])
                  ),
                  "text/csv"
                )
              }
            >
              Export
            </Button>
            <Button size="xs" variant="primary" iconLeft={PlusCircle} onClick={() => setUploadOpen(true)}>
              Log evidence
            </Button>
          </>
        }
      />
      {uploadOpen && (
        <UploadEvidenceModal
          onClose={() => setUploadOpen(false)}
          onComplete={(d) => {
            store.addEvidence(d);
            setUploadOpen(false);
          }}
        />
      )}
      <ol className="relative" aria-label="Audit events">
        <span
          aria-hidden="true"
          className="absolute left-[28px] top-0 bottom-0 w-px"
          style={{ background: T.ink3 }}
        />
        {allEvents.map((e) => (
          <li
            key={e.id}
            className="relative pl-16 pr-5 md:pr-6 py-5 border-b"
            style={{ borderColor: T.ink3 }}
          >
            <span
              aria-hidden="true"
              className="absolute left-[22px] top-7 w-3 h-3 rounded-full border-2"
              style={{
                background: T.ink0,
                borderColor: T.signal,
              }}
            />
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Chip tone={e.tone} size="xs">{e.label}</Chip>
              <span
                className="font-mono text-[10px] tracking-widest uppercase"
                style={{ color: T.bone2 }}
              >
                {e.ts} · {e.actor}
              </span>
            </div>
            <p style={{ color: T.bone0 }}>{e.text}</p>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenProject(e.pid)}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase focus:outline-none focus-visible:ts-focus"
                style={{ color: T.bone1 }}
              >
                <span aria-hidden="true">{e.flag}</span>
                {e.pid} · {e.country}
                <ExternalLink size={10} aria-hidden="true" />
              </button>
              <code
                className="font-mono text-[10px]"
                style={{ color: T.bone2, fontFamily: "JetBrains Mono" }}
                title={e.hash}
              >
                {e.hash.slice(0, 18)}…
              </code>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXTENDED DATA — Contracts, Workflows, Signatures, Ledger Sync, Risk, Access
// ════════════════════════════════════════════════════════════════════════════

const CONTRACTORS = [
  "Andrade Construções SA",
  "Sinohydro Group Ltd",
  "Strabag SE",
  "China Harbour Engineering",
  "VINCI Construction Grands Projets",
  "Webuild S.p.A.",
  "Larsen & Toubro Ltd",
  "Hyundai Engineering & Construction",
  "Bouygues Travaux Publics",
  "Ferrovial Construcción",
  "Orascom Construction",
  "Acciona Infraestructuras",
  "Samsung C&T",
  "Power Construction Corp",
];
const PROC_METHODS = ["ICB", "NCB", "QCBS", "Direct"];

// Server-backed collections — populated via the store. Empty stubs at
// module scope keep render paths safe before /api/state hydrates.
const CONTRACTS = [];
const CHANGE_ORDERS = [];
const WF_STAGES = ["Engineer", "Project Manager", "Auditor", "Ministry", "Donor", "Finance"];
const WORKFLOWS = [];
const WF_RULES = [
  "Inspection evidence required before financial approval",
  "Donor signature mandatory for contracts above $5M",
  "Two independent inspectors required for milestone M-3",
  "Milestone cannot advance before its dependency is Verified",
];
const WF_FAILSAFES = [
  "No backdating — workflow hash anchors order of events",
  "No skipping — condition-based routing enforces sequence",
  "No reversal without a blockchain-logged justification",
  "Real-time escalation alerts to supervisors on SLA breach",
];
const SIGNATURES = [];
const LEDGER_STATES = ["Draft", "Pending Sync", "Pending Consensus", "Verified", "Locked", "Disputed", "Auditor Review", "Reconciled"];
const LEDGER_RECORDS = [];
const CONSENSUS_TRIGGERS = [
  { name: "Disbursement Trigger", rule: "Contractor submits → Inspector verifies → ledger marks Verified → payment execution allowed.", icon: Banknote },
  { name: "Change Order Trigger", rule: "Engineer + Ministry + Donor approval required before a variation is accepted.", icon: GitBranch },
  { name: "Procurement Integrity Trigger", rule: "On anomaly the ledger halts milestone reporting and alerts the auditor automatically.", icon: ShieldAlert },
];
const RISK_MODELS = ["Gradient Boosting", "Random Forest", "Logistic Regression", "Temporal Anomaly"];
const RISK_DRIVERS = {
  critical: ["Disbursement velocity anomaly", "Repeated evidence hash collisions", "Approval sequence compression"],
  high: ["Schedule slippage acceleration", "Invoice-to-progress divergence", "Inspector narrative variance"],
  elevated: ["Minor GPS metadata drift", "Single-role amendment pattern"],
  low: ["No material anomalies detected"],
};
// Risk view computes its rows from current store.state.projects.
function deriveRisk(projects) {
  return projects.map((p, i) => {
    const fraud = Math.min(98, Math.max(3, Math.round(100 - p.i3 + p.alerts * 5)));
    const tamper = Math.min(95, Math.max(2, Math.round(fraud * 0.7 + p.alerts * 3)));
    const cls = fraud >= 70 ? "critical" : fraud >= 50 ? "high" : fraud >= 30 ? "elevated" : "low";
    return { pid: p.id, fraud, tamper, cls, model: RISK_MODELS[i % RISK_MODELS.length], drivers: RISK_DRIVERS[cls] };
  });
}
const REPORT_TEMPLATES = [
  { id: "tpl-wb-isr", name: "World Bank — Implementation Status Report", fmt: "PDF", cadence: "Quarterly" },
  { id: "tpl-donor-q", name: "Donor Quarterly Disbursement Report", fmt: "XLSX", cadence: "Quarterly" },
  { id: "tpl-audit", name: "Audit-Ready Evidence Pack", fmt: "PDF", cadence: "On demand" },
  { id: "tpl-ocds", name: "Open Contracting (OCDS) Export", fmt: "JSON", cadence: "Monthly" },
  { id: "tpl-pfm", name: "Public Financial Management Reconciliation", fmt: "CSV", cadence: "Monthly" },
];
const REPORTS = [];

const IDENTITY_TYPES = [
  { type: "Government", icon: Landmark, count: 142, ex: "Public Works, Finance, Planning, municipal authorities" },
  { type: "Donors", icon: Globe2, count: 38, ex: "World Bank, IDB, ADB, USAID, UN agencies" },
  { type: "EPC Contractors", icon: HardHat, count: 96, ex: "Engineers, operators, PMs, compliance officers" },
  { type: "Auditors", icon: FileSearch, count: 27, ex: "National Audit Office, donor auditors, inspectors" },
  { type: "Public / Civil Society", icon: Users, count: "Open", ex: "Read-only, redacted transparency view" },
];
const RBAC_ROLES = [
  { role: "Ministry Director", users: 14, scope: "Full internal · approve · sign", tier: "L4" },
  { role: "Donor Representative", users: 9, scope: "Oversight · disbursement sign-off", tier: "L4" },
  { role: "Auditor", users: 21, scope: "Read-all · evidence verification · export", tier: "L4" },
  { role: "Project Engineer", users: 33, scope: "Evidence · milestone certification", tier: "L3" },
  { role: "Field Inspector", users: 48, scope: "Mobile capture · inspection sign-off", tier: "L2" },
  { role: "Public Viewer", users: "—", scope: "Redacted transparency portal only", tier: "L0" },
];
const VERIFY_PARTIES = [
  { n: 1, party: "Contractor Evidence", desc: "Initial submission — photos, drone, invoices.", icon: HardHat },
  { n: 2, party: "Inspector Evidence", desc: "Independent field verification.", icon: Eye },
  { n: 3, party: "Government Validation", desc: "Approval workflows and certification.", icon: Landmark },
  { n: 4, party: "Donor Oversight", desc: "Disbursement authorization.", icon: Globe2 },
];
const SESSIONS = [
  { user: "S. Ramírez", role: "Auditor · L4", device: "macOS · Chrome", ip: "196.20.x.x", geo: "Santo Domingo", when: "active now" },
  { user: "F. Haddad", role: "Ministry · L4", device: "Windows · Edge", ip: "41.67.x.x", geo: "Cairo", when: "4m ago" },
  { user: "M. Otieno", role: "Inspector · L2", device: "Android · Field App", ip: "105.16.x.x", geo: "Mombasa", when: "12m ago" },
  { user: "USAID Monitor", role: "Donor · L4", device: "iOS · Safari", ip: "8.45.x.x", geo: "Washington DC", when: "1h ago" },
];

const fmtSigned = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtUSD(Math.abs(n))}`;

// ── shared atoms for extended views ────────────────────────────────────────

function MetaRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
        {label}
      </span>
      <span className="font-mono text-[11px]" style={{ color: T.bone0 }}>
        {value}
      </span>
    </div>
  );
}

function WorkflowStepper({ stage, blocked }) {
  return (
    <ol className="flex items-center gap-1 flex-wrap">
      {WF_STAGES.map((s, i) => {
        const done = i < stage;
        const current = i === stage;
        const accent = blocked ? T.alert : T.signal;
        return (
          <li key={s} className="flex items-center gap-1">
            <span
              className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 border"
              style={{
                borderColor: current ? accent : done ? T.ink4 : T.ink3,
                color: current ? accent : done ? T.bone1 : T.bone3,
                background: current
                  ? blocked
                    ? tint(T.alert, 0.1)
                    : tint(T.signal, 0.12)
                  : "transparent",
              }}
            >
              {done && <CheckCircle2 size={9} className="inline mr-1" aria-hidden="true" />}
              {s}
            </span>
            {i < WF_STAGES.length - 1 && (
              <ChevronRight size={10} style={{ color: T.ink4 }} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: CONTRACTS & PROCUREMENT
// ════════════════════════════════════════════════════════════════════════════

function ContractsView({ onOpenProject }) {
  const store = useStore();
  const PROJECTS = store.state.projects;
  const CONTRACTS = store.state.contracts;
  const CHANGE_ORDERS = store.state.changeOrders;
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [newOpen, setNewOpen] = useState(false);
  const all = CONTRACTS;
  const totalValue = all.reduce((s, c) => s + c.value, 0);
  const active = all.filter((c) => c.status === "active").length;
  const amendTotal = all.reduce((s, c) => s + c.amendments, 0);
  const filtered = all.filter(
    (c) => statusFilter === "ALL" || c.status === statusFilter
  );
  const statusTone = {
    procurement: "info",
    awarded: "plum",
    active: "verified",
    amended: "warn",
    closed: "neutral",
  };

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      {newOpen && (
        <NewContractModal
          onClose={() => setNewOpen(false)}
          onComplete={(c) => {
            store.addContract(c);
            setNewOpen(false);
          }}
        />
      )}
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Contract value" value={fmtUSD(totalValue)} sublabel={`${all.length} contracts`} />
        <KPI label="Active contracts" value={active} sublabel="under execution" />
        <KPI label="Amendments" value={amendTotal} delta={3.0} sublabel="cumulative variations" />
        <KPI
          label="Change orders"
          value={CHANGE_ORDERS.filter((c) => c.status === "pending").length}
          sublabel="pending decision"
        />
      </div>

      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader
          title="Contract registry"
          subtitle="Procurement → award → execution → close-out"
          right={
            <>
              <Select
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={["ALL", "procurement", "awarded", "active", "amended", "closed"]}
              />
              <Button variant="primary" iconLeft={PlusCircle} onClick={() => setNewOpen(true)}>
                New contract
              </Button>
            </>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                {["Contract", "Contractor", "Method", "Value", "Amend.", "Status", ""].map((h, i) => (
                  <th
                    key={h || i}
                    scope="col"
                    className={`px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap ${
                      h === "Value" || h === "Amend." ? "text-right" : "text-left"
                    }`}
                    style={{ color: T.bone2 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const p = PROJECTS.find((x) => x.id === c.pid);
                return (
                  <tr
                    key={c.id}
                    className="ts-row border-b cursor-pointer"
                    style={{ borderColor: T.ink3 }}
                    onClick={() => onOpenProject(c.pid)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onOpenProject(c.pid);
                    }}
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden="true">{p?.flag}</span>
                        <div className="min-w-0">
                          <div className="truncate" style={{ color: T.bone0 }}>{c.title}</div>
                          <div className="font-mono text-[10px] tracking-widest uppercase truncate" style={{ color: T.bone2 }}>
                            {c.id} · {c.pid}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-[13px]" style={{ color: T.bone1 }}>
                      {c.contractor}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Chip size="xs">{c.method}</Chip>
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-mono tabular-nums" style={{ color: T.bone0 }}>
                      {fmtUSD(c.value)}
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-mono tabular-nums" style={{ color: c.amendments ? T.amber : T.bone2 }}>
                      {c.amendments}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Chip tone={statusTone[c.status]} size="xs">{c.status}</Chip>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <ChevronRight size={14} style={{ color: T.bone2 }} aria-hidden="true" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader title="Change orders" subtitle="Scope variations · cost adjustments · §9.4" />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {CHANGE_ORDERS.map((c) => {
            const p = PROJECTS.find((x) => x.id === c.pid);
            const status = c.status;
            return (
              <li key={c.id} className="px-5 md:px-6 py-4 flex flex-col md:flex-row md:items-center gap-4" style={{ borderColor: T.ink3 }}>
                <Chip
                  tone={status === "approved" ? "verified" : status === "disputed" || status === "rejected" ? "risk" : "warn"}
                  size="xs"
                >
                  {status}
                </Chip>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: T.bone0 }}>{c.title}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                    {c.id} · {p?.flag} {c.pid} · {c.reason} · raised {c.raised} · {c.approvals}
                  </p>
                </div>
                <span
                  className="font-mono text-sm tabular-nums shrink-0"
                  style={{ color: c.delta > 0 ? T.alert : T.signal }}
                >
                  {fmtSigned(c.delta)}
                </span>
                {status === "pending" && (
                  <span className="shrink-0 flex items-center gap-2">
                    <Button size="xs" variant="danger" onClick={() => store.decideChangeOrder(c.id, "rejected")}>
                      Reject
                    </Button>
                    <Button size="xs" variant="primary" iconLeft={BadgeCheck} onClick={() => store.decideChangeOrder(c.id, "approved")}>
                      Approve
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: WORKFLOW ORCHESTRATION
// ════════════════════════════════════════════════════════════════════════════

function WorkflowsView({ onOpenProject }) {
  const __ds = useStore().state;
  const WORKFLOWS = __ds.workflows;
  const PROJECTS = __ds.projects;
  const blocked = WORKFLOWS.filter((w) => w.blocked).length;
  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Active workflows" value={WORKFLOWS.length} sublabel="in orchestration" />
        <KPI label="Blocked / overdue" value={blocked} delta={blocked ? 2.0 : 0} sublabel="SLA breached" />
        <KPI label="Avg. chain" value={`${WF_STAGES.length} steps`} sublabel="Engineer → Finance" />
        <KPI label="Fail-safes" value={WF_FAILSAFES.length} sublabel="enforced controls" />
      </div>

      <div className="col-span-12 lg:col-span-8" style={{ background: T.ink1 }}>
        <CardHeader title="Workflow instances" subtitle="State-machine routing · condition-based · §6.4" />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {WORKFLOWS.map((w) => {
            const p = PROJECTS.find((x) => x.id === w.pid);
            return (
              <li key={w.id} className="px-5 md:px-6 py-4" style={{ borderColor: T.ink3 }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Chip size="xs" tone="plum">{w.kind}</Chip>
                      <span className="text-sm truncate" style={{ color: T.bone0 }}>{w.title}</span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                      {w.id} · {p?.flag} {w.pid}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Chip size="xs" tone={w.blocked ? "risk" : "info"}>{w.sla}</Chip>
                    <Button size="xs" iconRight={ArrowRight} onClick={() => onOpenProject(w.pid)}>
                      Open
                    </Button>
                  </div>
                </div>
                <WorkflowStepper stage={w.stage} blocked={w.blocked} />
                {w.blocked && (
                  <p className="mt-2 font-mono text-[10px] tracking-widest uppercase" style={{ color: T.alert }}>
                    <AlertTriangle size={10} className="inline mr-1" aria-hidden="true" />
                    Blocked — missing evidence at {WF_STAGES[w.stage]} step
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-px" style={{ background: T.ink3 }}>
        <div style={{ background: T.ink1 }}>
          <CardHeader title="Workflow rules" subtitle="Condition-based routing" />
          <ul className="px-5 md:px-6 py-4 space-y-3">
            {WF_RULES.map((r) => (
              <li key={r} className="flex gap-2.5 text-xs" style={{ color: T.bone1 }}>
                <GitBranch size={13} style={{ color: T.azure }} className="shrink-0 mt-0.5" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: T.ink1 }}>
          <CardHeader title="Fail-safes" subtitle="Tamper-evident controls" />
          <ul className="px-5 md:px-6 py-4 space-y-3">
            {WF_FAILSAFES.map((r) => (
              <li key={r} className="flex gap-2.5 text-xs" style={{ color: T.bone1 }}>
                <Lock size={13} style={{ color: T.signal }} className="shrink-0 mt-0.5" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: E-SIGNATURES
// ════════════════════════════════════════════════════════════════════════════

function SignaturesView({ onOpenProject }) {
  const store = useStore();
  const PROJECTS = store.state.projects;
  const [target, setTarget] = useState(null);
  const sigs = store.state.signatures;
  const pending = sigs.filter((s) => s.status === "pending").length;
  const signed = sigs.filter((s) => s.status === "signed").length;
  const statusTone = { pending: "warn", signed: "verified", declined: "risk" };
  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      {target && (
        <SignModal
          signature={target}
          onClose={() => setTarget(null)}
          onComplete={(id, choice) => store.setSignature(id, choice)}
        />
      )}
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Awaiting signature" value={pending} sublabel="in your sequences" />
        <KPI label="Signed today" value={signed} sublabel="provenance anchored" />
        <KPI label="Hash-locked docs" value={sigs.length} sublabel="integrity sealed" />
        <KPI label="Declined" value={sigs.filter((s) => s.status === "declined").length} sublabel="returned to origin" />
      </div>

      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader
          title="Signature ledger"
          subtitle="Government-grade e-signature engine · DAG-sequenced · geo-tagged"
          right={<Chip size="xs" tone="info">Module 2</Chip>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                {["Document", "Signer · Role", "Sequence", "Provenance", "Status", ""].map((h, i) => (
                  <th key={h || i} scope="col" className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap" style={{ color: T.bone2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sigs.map((s) => {
                const p = PROJECTS.find((x) => x.id === s.pid);
                return (
                  <tr key={s.id} className="ts-row border-b" style={{ borderColor: T.ink3 }}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <FileSignature size={14} style={{ color: T.bone2 }} aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="truncate" style={{ color: T.bone0 }}>{s.doc}</div>
                          <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                            {s.id} · {p?.flag} {s.pid}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div style={{ color: T.bone0 }}>{s.actor}</div>
                      <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>{s.role}</div>
                    </td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] tabular-nums" style={{ color: T.bone1 }}>
                      {s.seq}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                        <MapPin size={9} className="inline mr-1" aria-hidden="true" />{s.geo}
                      </div>
                      <div className="font-mono text-[10px]" style={{ color: T.bone2 }}>
                        <Fingerprint size={9} className="inline mr-1" aria-hidden="true" />{s.method}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Chip tone={statusTone[s.status]} size="xs">{s.status}</Chip>
                      <div className="mt-1 font-mono text-[10px]" style={{ color: T.bone2 }}>{s.when}</div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      {s.status === "pending" ? (
                        <Button size="xs" variant="primary" iconLeft={Stamp} onClick={() => setTarget(s)}>
                          Sign
                        </Button>
                      ) : (
                        <BadgeCheck size={14} style={{ color: s.status === "signed" ? T.signal : T.alert }} aria-hidden="true" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: LEDGER SYNC (Patent #3)
// ════════════════════════════════════════════════════════════════════════════

function LedgerSyncView({ onOpenProject }) {
  const __ds = useStore().state;
  const LEDGER_RECORDS = __ds.ledger;
  const PROJECTS = __ds.projects;
  const fmtVal = (v, unit) =>
    unit === "usd" ? fmtUSD(v) : unit === "pct" ? `${v}%` : String(v);
  const disputed = LEDGER_RECORDS.filter((r) => LEDGER_STATES[r.state] === "Disputed").length;
  const reconciled = LEDGER_RECORDS.filter((r) => LEDGER_STATES[r.state] === "Reconciled").length;

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Synced records" value={LEDGER_RECORDS.length} sublabel="3-party ledger" />
        <KPI label="Disputed" value={disputed} delta={disputed ? 1.0 : 0} sublabel="awaiting consensus" />
        <KPI label="Reconciled" value={reconciled} delta={2.0} sublabel="single source of truth" />
        <KPI label="Connectors" value={4} sublabel="ERP · donor · contractor" />
      </div>

      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader title="Ledger state machine" subtitle="Every record traverses eight consensus states · §9.3" />
        <div className="px-5 md:px-6 py-5 flex items-center gap-1.5 overflow-x-auto">
          {LEDGER_STATES.map((st, i) => {
            const count = LEDGER_RECORDS.filter((r) => r.state === i).length;
            const tone = st === "Disputed" ? T.alert : st === "Reconciled" ? T.signal : T.bone1;
            return (
              <div key={st} className="flex items-center gap-1.5 shrink-0">
                <div
                  className="px-3 py-2 border text-center"
                  style={{ borderColor: count ? tone : T.ink3, background: count ? T.ink2 : "transparent" }}
                >
                  <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color: count ? tone : T.bone3 }}>
                    {st}
                  </div>
                  <div className="font-serif text-lg tabular-nums" style={{ fontFamily: "Fraunces, serif", fontWeight: 380, color: count ? T.bone0 : T.bone3 }}>
                    {count}
                  </div>
                </div>
                {i < LEDGER_STATES.length - 1 && <ArrowRight size={12} style={{ color: T.ink4 }} aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8" style={{ background: T.ink1 }}>
        <CardHeader title="Reconciliation engine" subtitle="Government · Donor · Contractor record comparison" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                {["Record", "Type", "Government", "Donor", "Contractor", "State"].map((h) => (
                  <th key={h} scope="col" className={`px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap ${h === "Record" || h === "Type" || h === "State" ? "text-left" : "text-right"}`} style={{ color: T.bone2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEDGER_RECORDS.map((r) => {
                const p = PROJECTS.find((x) => x.id === r.pid);
                const vals = [r.gov, r.donor, r.contractor];
                const aligned = vals.every((v) => v === vals[0]);
                const st = LEDGER_STATES[r.state];
                return (
                  <tr key={r.id} className="ts-row border-b cursor-pointer" style={{ borderColor: T.ink3 }} onClick={() => onOpenProject(r.pid)}>
                    <td className="px-4 py-3 align-middle">
                      <div className="font-mono text-[11px]" style={{ color: T.bone0 }}>{r.id}</div>
                      <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>{p?.flag} {r.pid}</div>
                    </td>
                    <td className="px-4 py-3 align-middle"><Chip size="xs">{r.type}</Chip></td>
                    {vals.map((v, idx) => (
                      <td key={idx} className="px-4 py-3 align-middle text-right font-mono text-[11px] tabular-nums" style={{ color: aligned ? T.bone1 : v === Math.max(...vals) || v === Math.min(...vals) ? T.amber : T.bone1 }}>
                        {fmtVal(v, r.unit)}
                      </td>
                    ))}
                    <td className="px-4 py-3 align-middle">
                      <Chip size="xs" tone={st === "Disputed" ? "risk" : st === "Reconciled" || st === "Verified" ? "verified" : "info"}>
                        {st}
                      </Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4" style={{ background: T.ink1 }}>
        <CardHeader title="Consensus triggers" subtitle="Automated enforcement · §9.6" />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {CONSENSUS_TRIGGERS.map((t) => (
            <li key={t.name} className="px-5 md:px-6 py-4" style={{ borderColor: T.ink3 }}>
              <div className="flex items-center gap-2 mb-1.5">
                <t.icon size={14} style={{ color: T.signal }} aria-hidden="true" />
                <span className="text-sm" style={{ color: T.bone0 }}>{t.name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: T.bone1 }}>{t.rule}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: AI RISK PREDICTION
// ════════════════════════════════════════════════════════════════════════════

function RiskView({ onOpenProject }) {
  const PROJECTS = useStore().state.projects;
  const RISK = deriveRisk(PROJECTS);
  const clsTone = { critical: "risk", high: "risk", elevated: "warn", low: "verified" };
  const clsColor = { critical: T.alert, high: T.alert, elevated: T.amber, low: T.signal };
  const sorted = [...RISK].sort((a, b) => b.fraud - a.fraud);
  const chart = sorted.map((r) => {
    const p = PROJECTS.find((x) => x.id === r.pid);
    return { name: r.pid, fraud: r.fraud, cls: r.cls };
  });
  const critical = RISK.filter((r) => r.cls === "critical").length;
  const avgFraud = Math.round(RISK.reduce((s, r) => s + r.fraud, 0) / RISK.length);

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Portfolio fraud index" value={avgFraud} delta={-1.4} sublabel="weighted mean · /100" />
        <KPI label="Critical-risk projects" value={critical} delta={critical ? 1.0 : 0} sublabel="immediate review" />
        <KPI label="Models in ensemble" value={RISK_MODELS.length} sublabel="ML + rule hybrid" />
        <KPI label="Predictive alerts" value={9} sublabel="last 24h" />
      </div>

      <div className="col-span-12 lg:col-span-7" style={{ background: T.ink1 }}>
        <CardHeader title="Fraud likelihood index" subtitle="Per-project · ranked descending" right={<Chip size="xs" tone="plum">Module 8</Chip>} />
        <div className="p-5" style={{ height: 340 }}>
          <ResponsiveContainer>
            <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 30 }}>
              <CartesianGrid stroke={T.ink3} strokeDasharray="2 4" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke={T.bone3} tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: T.bone2 }} axisLine={{ stroke: T.ink3 }} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} stroke={T.bone3} tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: T.bone2 }} axisLine={false} tickLine={false} />
              <RTooltip
                contentStyle={{ background: T.ink0, border: `1px solid ${T.ink3}`, fontFamily: "JetBrains Mono", fontSize: 11, color: T.bone0 }}
                labelStyle={{ color: T.bone2 }}
                cursor={{ fill: T.ink2 }}
              />
              <Bar dataKey="fraud" radius={[0, 1, 1, 0]}>
                {chart.map((e, i) => (
                  <Cell key={i} fill={clsColor[e.cls]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5" style={{ background: T.ink1 }}>
        <CardHeader title="Risk classification" subtitle="Model drivers & tamper probability" />
        <ul className="divide-y overflow-y-auto" style={{ borderColor: T.ink3, maxHeight: 340 }}>
          {sorted.map((r) => {
            const p = PROJECTS.find((x) => x.id === r.pid);
            return (
              <li key={r.pid} className="px-5 md:px-6 py-3" style={{ borderColor: T.ink3 }}>
                <button type="button" onClick={() => onOpenProject(r.pid)} className="w-full text-left focus:outline-none focus-visible:ts-focus group">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{p?.flag}</span>
                    <span className="text-sm flex-1 truncate group-hover:underline" style={{ color: T.bone0 }}>{p?.name}</span>
                    <Chip size="xs" tone={clsTone[r.cls]}>{r.cls}</Chip>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                    <span>Fraud {r.fraud}</span>
                    <span>Tamper {r.tamper}</span>
                    <span>{r.model}</span>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: T.bone1 }}>
                    {r.drivers.join(" · ")}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: PUBLIC TRANSPARENCY PORTAL
// ════════════════════════════════════════════════════════════════════════════

function PortalView() {
  const __ds = useStore().state;
  const PROJECTS = __ds.projects;
  const CONTRACTS = __ds.contracts;
  const DONORS = [...new Set(PROJECTS.map((p) => p.donor))].sort();
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div
        className="col-span-12 px-5 md:px-6 py-4 flex flex-wrap items-center gap-3"
        style={{ background: tint(T.azure, 0.07), border: `1px solid ${tint(T.azure, 0.25)}` }}
      >
        <Eye size={16} style={{ color: T.azure }} aria-hidden="true" />
        <span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: T.azure }}>
          Public transparency layer
        </span>
        <span className="text-xs" style={{ color: T.bone1 }}>
          Redacted citizen view — sensitive coordinates, PII, and confidential donor terms removed by the automatic redaction engine.
        </span>
      </div>

      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Public projects" value={PROJECTS.length} sublabel="open for inspection" />
        <KPI label="Verified milestones" value={148} sublabel="evidence-backed" />
        <KPI label="Public I³ average" value={(PROJECTS.reduce((s, p) => s + p.i3, 0) / PROJECTS.length).toFixed(1)} sublabel="redacted composite" />
        <KPI label="Citizen reports" value={36} sublabel="community feedback" />
      </div>

      <div className="col-span-12 lg:col-span-8" style={{ background: T.ink1 }}>
        <CardHeader title="Project explorer" subtitle="Verified, citizen-readable project profiles · §11.3" />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: T.ink3 }}>
          {PROJECTS.slice(0, 8).map((p) => {
            const ct = CONTRACTS.find((c) => c.pid === p.id);
            return (
              <li key={p.id} className="p-5" style={{ background: T.ink1 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span aria-hidden="true">{p.flag}</span>
                  <span className="text-sm flex-1 truncate" style={{ color: T.bone0 }}>{p.name}</span>
                  <I3Score score={p.i3} size="sm" />
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: T.bone2 }}>
                  {p.country} · {p.sector} · {ct?.contractor || "—"}
                </div>
                <div className="flex items-center justify-between mb-1 font-mono text-[10px]" style={{ color: T.bone2 }}>
                  <span>Verified spending</span>
                  <span style={{ color: T.bone0 }}>{fmtUSD(p.spent)} / {fmtUSD(p.budget)}</span>
                </div>
                <ProgressBar value={(p.spent / p.budget) * 100} color={T.azure} />
                <div className="mt-2 flex items-center justify-between">
                  <Chip size="xs" tone={i3Tone(p.i3)}>I³ {p.i3.toFixed(0)}</Chip>
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                    {p.progress}% complete
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-px" style={{ background: T.ink3 }}>
        <div style={{ background: T.ink1 }}>
          <CardHeader title="Donor contributions" subtitle="Verified disbursements" />
          <ul className="px-5 md:px-6 py-4 space-y-3">
            {DONORS.map((d) => {
              const total = PROJECTS.filter((p) => p.donor === d).reduce((s, p) => s + p.spent, 0);
              const max = Math.max(...DONORS.map((x) => PROJECTS.filter((p) => p.donor === x).reduce((s, p) => s + p.spent, 0)));
              return (
                <li key={d}>
                  <div className="flex items-center justify-between mb-1 font-mono text-[10px] tracking-widest uppercase">
                    <span style={{ color: T.bone1 }}>{d}</span>
                    <span style={{ color: T.bone0 }}>{fmtUSD(total)}</span>
                  </div>
                  <div className="relative h-1" style={{ background: T.ink3 }}>
                    <div className="absolute inset-y-0 left-0" style={{ width: `${(total / max) * 100}%`, background: T.plum }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div style={{ background: T.ink1 }}>
          <CardHeader title="Community feedback" subtitle="Report a concern" />
          <div className="px-5 md:px-6 py-4">
            {sent ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: T.signal }}>
                <CheckCircle2 size={15} aria-hidden="true" />
                Submitted — anchored as a public record.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (feedback.trim()) {
                    setSent(true);
                    if (!reduced) setTimeout(() => { setSent(false); setFeedback(""); }, 3200);
                  }
                }}
              >
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Delayed works, environmental concern, abandoned site…"
                  className="w-full bg-transparent border outline-none p-2.5 text-xs resize-none focus:outline-none focus-visible:ts-focus"
                  style={{ borderColor: T.ink3, color: T.bone0 }}
                  aria-label="Community feedback"
                />
                <div className="mt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm" iconRight={Send}>
                    Submit
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: REPORTS
// ════════════════════════════════════════════════════════════════════════════

function ReportsView() {
  const store = useStore();
  const statusTone = { ready: "verified", generating: "warn", scheduled: "info" };
  const reports = store.state.reports;
  const allProjects = store.state.projects;
  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: T.ink3 }}>
        <KPI label="Templates" value={REPORT_TEMPLATES.length} sublabel="donor & audit formats" />
        <KPI label="Reports ready" value={reports.filter((r) => r.status === "ready").length} sublabel="export-ready" />
        <KPI label="Generating" value={reports.filter((r) => r.status === "generating").length} sublabel="in progress" />
        <KPI label="Scheduled" value={reports.filter((r) => r.status === "scheduled").length} sublabel="recurring" />
      </div>

      <div className="col-span-12 lg:col-span-5" style={{ background: T.ink1 }}>
        <CardHeader title="Report templates" subtitle="Donor-compliant · audit-ready · §6.3.6" />
        <ul className="divide-y" style={{ borderColor: T.ink3 }}>
          {REPORT_TEMPLATES.map((t) => (
            <li key={t.id} className="px-5 md:px-6 py-4 flex items-center gap-3" style={{ borderColor: T.ink3 }}>
              <ScrollText size={15} style={{ color: T.bone2 }} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: T.bone0 }}>{t.name}</div>
                <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                  {t.fmt} · {t.cadence}
                </div>
              </div>
              <Button size="xs" iconLeft={RefreshCw} onClick={() => store.generateReport(t)}>
                Generate
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-12 lg:col-span-7" style={{ background: T.ink1 }}>
        <CardHeader title="Generated reports" subtitle="Cryptographically chained · export-ready" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                {["Report", "Scope", "Format", "Generated", "Status", ""].map((h, i) => (
                  <th key={h || i} scope="col" className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap" style={{ color: T.bone2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const p = allProjects.find((x) => x.id === r.pid);
                return (
                  <tr key={r.id} className="ts-row border-b" style={{ borderColor: T.ink3 }}>
                    <td className="px-4 py-3 align-middle">
                      <div style={{ color: T.bone0 }}>{r.template}</div>
                      <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>{r.id}</div>
                    </td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] tracking-widest uppercase" style={{ color: T.bone1 }}>
                      {r.pid === "ALL" ? "Portfolio" : `${p?.flag || ""} ${r.pid}`}
                    </td>
                    <td className="px-4 py-3 align-middle"><Chip size="xs">{r.fmt}</Chip></td>
                    <td className="px-4 py-3 align-middle font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                      {r.generated}{r.size !== "—" ? ` · ${r.size}` : ""}
                    </td>
                    <td className="px-4 py-3 align-middle"><Chip size="xs" tone={statusTone[r.status]}>{r.status}</Chip></td>
                    <td className="px-4 py-3 align-middle text-right">
                      <Button
                        size="xs"
                        iconLeft={Download}
                        disabled={r.status !== "ready"}
                        onClick={() => {
                          const f = buildReportFile(r, allProjects);
                          downloadFile(f.name, f.content, f.mime);
                        }}
                      >
                        Export
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: ACCESS & IDENTITY
// ════════════════════════════════════════════════════════════════════════════

function AccessView() {
  const store = useStore();
  const SESSIONS = store.state.users.map((u) => ({
    user: u.name,
    role: `${u.role} · ${u.tier}`,
    device: u.lastLoginAt ? "recent session" : "never",
    ip: "—",
    geo: u.email,
    when: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "never signed in",
    isMe: u.username === store.state.me?.username,
  }));
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const invites = store.state.invites;
  return (
    <div className="grid grid-cols-12 gap-px" style={{ background: T.ink3 }}>
      {onboardOpen && (
        <OnboardModal
          onClose={() => setOnboardOpen(false)}
          onComplete={(inv) => {
            store.addInvite(inv);
            setOnboardOpen(false);
          }}
        />
      )}
      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader
          title="Identity types"
          subtitle="User & identity layer · §6.2"
          right={
            <>
              <Button
                variant={confirmReset ? "danger" : "ghost"}
                iconLeft={RefreshCw}
                onClick={() => {
                  if (confirmReset) {
                    store.reset();
                    setConfirmReset(false);
                  } else {
                    setConfirmReset(true);
                    setTimeout(() => setConfirmReset(false), 4000);
                  }
                }}
              >
                {confirmReset ? "Confirm reset" : "Reset workspace"}
              </Button>
              <Button variant="primary" iconLeft={PlusCircle} onClick={() => setOnboardOpen(true)}>
                Onboard third party
              </Button>
            </>
          }
        />
        <ul className="grid grid-cols-1 md:grid-cols-5 gap-px" style={{ background: T.ink3 }}>
          {IDENTITY_TYPES.map((it) => (
            <li key={it.type} className="p-5" style={{ background: T.ink1 }}>
              <it.icon size={18} style={{ color: T.signal }} aria-hidden="true" />
              <div className="mt-3 font-serif text-xl tabular-nums" style={{ fontFamily: "Fraunces, serif", fontWeight: 380, color: T.bone0 }}>
                {it.count}
              </div>
              <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone1 }}>{it.type}</div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.bone2 }}>{it.ex}</p>
            </li>
          ))}
        </ul>
      </div>

      {invites.length > 0 && (
        <div className="col-span-12" style={{ background: T.ink1 }}>
          <CardHeader title="Pending invitations" subtitle="Third parties awaiting activation" />
          <ul className="divide-y" style={{ borderColor: T.ink3 }}>
            {invites.map((inv) => (
              <li key={inv.id} className="px-5 md:px-6 py-3.5 flex flex-col md:flex-row md:items-center gap-3" style={{ borderColor: T.ink3 }}>
                <Chip size="xs" tone="warn">invited</Chip>
                <div className="flex-1 min-w-0">
                  <span className="text-sm" style={{ color: T.bone0 }}>{inv.org}</span>
                  <span className="ml-2 font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                    {inv.id} · {inv.type} · {inv.role} · {inv.tier} · {inv.project}
                  </span>
                </div>
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                  {inv.email} · sent {inv.sent}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="col-span-12 lg:col-span-7" style={{ background: T.ink1 }}>
        <CardHeader title="Role-based access control" subtitle="RBAC + ABAC · document & milestone level" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                {["Role", "Tier", "Users", "Scope"].map((h) => (
                  <th key={h} scope="col" className={`px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap ${h === "Users" ? "text-right" : "text-left"}`} style={{ color: T.bone2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC_ROLES.map((r) => (
                <tr key={r.role} className="ts-row border-b" style={{ borderColor: T.ink3 }}>
                  <td className="px-4 py-3 align-middle" style={{ color: T.bone0 }}>{r.role}</td>
                  <td className="px-4 py-3 align-middle">
                    <Chip size="xs" tone={r.tier === "L4" ? "verified" : r.tier === "L0" ? "neutral" : "info"}>{r.tier}</Chip>
                  </td>
                  <td className="px-4 py-3 align-middle text-right font-mono tabular-nums" style={{ color: T.bone1 }}>{r.users}</td>
                  <td className="px-4 py-3 align-middle text-[13px]" style={{ color: T.bone2 }}>{r.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5" style={{ background: T.ink1 }}>
        <CardHeader title="4-party verification model" subtitle="No record advances without all four · §7.8" />
        <ol className="divide-y" style={{ borderColor: T.ink3 }}>
          {VERIFY_PARTIES.map((v) => (
            <li key={v.n} className="px-5 md:px-6 py-3.5 flex items-center gap-3" style={{ borderColor: T.ink3 }}>
              <span className="w-7 h-7 shrink-0 flex items-center justify-center border font-mono text-[11px]" style={{ borderColor: T.signal, color: T.signal }}>
                {v.n}
              </span>
              <v.icon size={15} style={{ color: T.bone2 }} aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-sm" style={{ color: T.bone0 }}>{v.party}</div>
                <div className="text-[11px]" style={{ color: T.bone2 }}>{v.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="col-span-12" style={{ background: T.ink1 }}>
        <CardHeader title="Active sessions" subtitle="Session governance · device fingerprinting · TLS 1.3" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: T.ink2 }}>
              <tr className="border-b" style={{ borderColor: T.ink3 }}>
                {["User", "Role", "Device", "IP", "Location", "Last seen"].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap" style={{ color: T.bone2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSIONS.map((s) => {
                const live = s.isMe;
                return (
                  <tr key={s.user + s.geo} className="ts-row border-b" style={{ borderColor: T.ink3 }}>
                    <td className="px-4 py-3 align-middle" style={{ color: T.bone0 }}>
                      {s.user}
                      {live && (
                        <span className="ml-2 font-mono text-[9px] tracking-widest uppercase" style={{ color: T.signal }}>
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] tracking-widest uppercase" style={{ color: T.bone1 }}>{s.role}</td>
                    <td className="px-4 py-3 align-middle text-[13px]" style={{ color: T.bone2 }}>{s.device}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px]" style={{ color: T.bone2 }}>{s.ip}</td>
                    <td className="px-4 py-3 align-middle text-[13px]" style={{ color: T.bone2 }}>{s.geo}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[10px] tracking-widest uppercase" style={{ color: live ? T.signal : T.bone2 }}>
                      {live ? "active now" : s.when}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW PRIMITIVES — Modal, wizard, form fields
// ════════════════════════════════════════════════════════════════════════════

function Modal({ title, subtitle, icon: Icon, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useKey("Escape", onClose, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 md:pt-16 px-4 pb-10 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        ref={ref}
        className={`w-full border ${wide ? "max-w-[780px]" : "max-w-[580px]"}`}
        style={{ borderColor: T.ink3, background: T.ink1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 border-b" style={{ borderColor: T.ink3 }}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <span className="inline-flex items-center justify-center w-9 h-9 border shrink-0" style={{ borderColor: T.signal }}>
                <Icon size={16} style={{ color: T.signal }} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-serif text-xl leading-tight" style={{ fontFamily: "Fraunces, serif", fontWeight: 400, color: T.bone0 }}>
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 border focus:outline-none focus-visible:ts-focus"
            style={{ borderColor: T.ink3, color: T.bone0 }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 md:px-6 py-5">{children}</div>
        {footer && (
          <div className="px-5 md:px-6 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: T.ink3 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function StepDots({ steps, current }) {
  return (
    <ol className="flex items-center gap-1.5 mb-5">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
          <span
            className="w-5 h-5 shrink-0 flex items-center justify-center font-mono text-[10px] border"
            style={{
              borderColor: i <= current ? T.signal : T.ink3,
              background: i < current ? T.signal : "transparent",
              color: i < current ? T.ink1 : i === current ? T.signal : T.bone3,
            }}
          >
            {i < current ? "✓" : i + 1}
          </span>
          <span
            className="font-mono text-[9px] tracking-widest uppercase truncate hidden sm:block"
            style={{ color: i === current ? T.bone0 : T.bone2 }}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span className="flex-1 h-px" style={{ background: T.ink3 }} aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: T.bone2 }}>
        {label}
      </span>
      {children}
      {hint && <span className="block mt-1 text-[11px]" style={{ color: T.bone3 }}>{hint}</span>}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full bg-transparent border outline-none px-3 py-2 text-sm focus:outline-none focus-visible:ts-focus"
      style={{ borderColor: T.ink3, color: T.bone0 }}
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border outline-none px-3 py-2 text-sm focus:outline-none focus-visible:ts-focus"
      style={{ borderColor: T.ink3, color: T.bone0, background: T.ink1 }}
    >
      {options.map((o) => {
        const val = typeof o === "object" ? o.value : o;
        const lab = typeof o === "object" ? o.label : o;
        return (
          <option key={val} value={val} style={{ background: T.ink1, color: T.bone0 }}>
            {lab}
          </option>
        );
      })}
    </select>
  );
}

function RadioCards({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="text-left p-3 border focus:outline-none focus-visible:ts-focus"
            style={{
              borderColor: on ? T.signal : T.ink3,
              background: on ? tint(T.signal, 0.08) : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              {o.icon && <o.icon size={14} style={{ color: on ? T.signal : T.bone2 }} aria-hidden="true" />}
              <span className="text-sm" style={{ color: T.bone0 }}>{o.label}</span>
            </div>
            {o.desc && <p className="mt-1 text-[11px] leading-snug" style={{ color: T.bone2 }}>{o.desc}</p>}
          </button>
        );
      })}
    </div>
  );
}

function Dropzone({ files, onFiles, sample }) {
  const inputRef = useRef(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border border-dashed py-7 flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ts-focus"
        style={{ borderColor: T.ink4, background: T.ink2 }}
      >
        <ArrowUp size={20} style={{ color: T.bone2 }} aria-hidden="true" />
        <span className="text-sm" style={{ color: T.bone1 }}>Click to select files for upload</span>
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone3 }}>
          JPG · PNG · MP4 · PDF — hashed locally before upload
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const names = Array.from(e.target.files || []).map((f) => f.name);
          if (names.length) onFiles(names);
        }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
          {files.length} file{files.length === 1 ? "" : "s"} staged
        </span>
        {sample && (
          <Button size="xs" onClick={() => onFiles(sample)}>
            Use sample set
          </Button>
        )}
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={f + i} className="flex items-center gap-2 px-2.5 py-1.5 border" style={{ borderColor: T.ink3 }}>
              <FileText size={12} style={{ color: T.bone2 }} aria-hidden="true" />
              <span className="text-[12px] flex-1 truncate" style={{ color: T.bone1 }}>{f}</span>
              <button
                type="button"
                onClick={() => onFiles(files.filter((_, idx) => idx !== i))}
                style={{ color: T.bone2 }}
                aria-label={`Remove ${f}`}
                className="focus:outline-none focus-visible:ts-focus"
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW: EVIDENCE UPLOAD & ANCHORING
// ════════════════════════════════════════════════════════════════════════════

function UploadEvidenceModal({ onClose, onComplete, fixedProject }) {
  const PROJECTS = useStore().state.projects;
  const steps = ["Project", "Files", "Verify", "Anchor"];
  const [step, setStep] = useState(0);
  const [pid, setPid] = useState(fixedProject || PROJECTS[0].id);
  const [milestone, setMilestone] = useState("M-01");
  const [kind, setKind] = useState("EVIDENCE");
  const [actor, setActor] = useState("Field Inspector");
  const [files, setFiles] = useState([]);
  const [anchored, setAnchored] = useState(false);
  const reduced = usePrefersReducedMotion();

  const project = PROJECTS.find((p) => p.id === pid);
  const [lon, lat] = PROJECT_GEO(pid);
  const eHash = useMemo(() => fauxHash(`evi-${pid}-${files.join(",")}`), [pid, files]);
  const mHash = useMemo(() => fauxHash(`meta-${pid}-${milestone}-${actor}`), [pid, milestone, actor]);
  const cle = useMemo(() => fauxHash(`cle-${eHash}-${mHash}`), [eHash, mHash]);
  const block = useMemo(() => 1284019 + Math.floor(Math.random() * 80), [cle]);

  useEffect(() => {
    if (step !== 3) {
      setAnchored(false);
      return;
    }
    if (reduced) {
      setAnchored(true);
      return;
    }
    const t = setTimeout(() => setAnchored(true), 1500);
    return () => clearTimeout(t);
  }, [step, reduced]);

  const canNext = step === 1 ? files.length > 0 : true;
  const finish = () => {
    onComplete({
      pid,
      kind,
      actor,
      milestone,
      files,
      cle,
      country: project.country,
      flag: project.flag,
      block,
    });
  };

  return (
    <Modal
      title="Submit evidence"
      subtitle="Capture → hash → blockchain anchor"
      icon={Hash}
      onClose={onClose}
      footer={
        <>
          <Button onClick={step === 0 ? onClose : () => setStep((s) => s - 1)} iconLeft={ChevronLeft}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" iconRight={BadgeCheck} onClick={finish} disabled={!anchored}>
              {anchored ? "Finish & record" : "Anchoring…"}
            </Button>
          )}
        </>
      }
    >
      <StepDots steps={steps} current={step} />

      {step === 0 && (
        <div>
          <Field label="Project">
            <SelectInput
              value={pid}
              onChange={setPid}
              options={PROJECTS.map((p) => ({ value: p.id, label: `${p.flag} ${p.name}` }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Milestone">
              <SelectInput value={milestone} onChange={setMilestone} options={["M-01", "M-02", "M-03", "M-04", "M-05"]} />
            </Field>
            <Field label="Evidence kind">
              <SelectInput value={kind} onChange={setKind} options={["EVIDENCE", "MILESTONE", "PAYMENT", "APPROVAL"]} />
            </Field>
          </div>
          <Field label="Submitting role">
            <SelectInput value={actor} onChange={setActor} options={["Field Inspector", "Project Engineer", "Contractor", "Auditor"]} />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-xs mb-3" style={{ color: T.bone2 }}>
            Files are SHA-256 hashed in the browser before upload — raw evidence never leaves your device unencrypted.
          </p>
          <Dropzone
            files={files}
            onFiles={setFiles}
            sample={["site_photo_01.jpg", "site_photo_02.jpg", "drone_pass_A.mp4", "inspection_report.pdf"]}
          />
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: T.bone2 }}>
            Auto-captured metadata
          </p>
          <div className="border divide-y" style={{ borderColor: T.ink3 }}>
            {[
              ["Project", `${project.flag} ${pid}`],
              ["Milestone", milestone],
              ["GPS coordinates", `${lat.toFixed(2)}, ${lon.toFixed(2)}`],
              ["Timestamp", "captured just now · device clock"],
              ["Device ID", fauxHash(`dev-${actor}`).slice(0, 18)],
              ["EXIF integrity", "consistent · 0 anomalies"],
              ["E_HASH", eHash.slice(0, 30) + "…"],
              ["M_HASH", mHash.slice(0, 30) + "…"],
            ].map(([k, v]) => (
              <div key={k} className="px-3 py-2">
                <MetaRow label={k} value={v} />
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-center gap-2 px-3 py-2.5 border"
            style={{ borderColor: tint(T.signal, 0.3), background: tint(T.signal, 0.08) }}
          >
            <CheckCircle2 size={14} style={{ color: T.signal }} aria-hidden="true" />
            <span className="text-xs" style={{ color: T.bone1 }}>
              Conflict Detection Engine — no spatial, temporal, or evidence-integrity conflict found.
            </span>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          {!anchored ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <RefreshCw size={26} className={reduced ? "" : "ts-spin"} style={{ color: T.signal }} aria-hidden="true" />
              <p className="text-sm" style={{ color: T.bone1 }}>Anchoring Composite Ledger Entry to hybrid chain…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center justify-center w-12 h-12 border" style={{ borderColor: T.signal }}>
                <BadgeCheck size={24} style={{ color: T.signal }} aria-hidden="true" />
              </span>
              <p className="text-sm" style={{ color: T.bone0 }}>Evidence anchored & verified.</p>
              <div className="w-full border divide-y text-left" style={{ borderColor: T.ink3 }}>
                {[
                  ["CLE hash", cle.slice(0, 34) + "…"],
                  ["Block height", `#${block.toLocaleString()}`],
                  ["Transaction", fauxHash(`tx-${cle}`).slice(0, 22) + "…"],
                  ["Files anchored", String(files.length)],
                ].map(([k, v]) => (
                  <div key={k} className="px-3 py-2">
                    <MetaRow label={k} value={v} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW: THIRD-PARTY ONBOARDING
// ════════════════════════════════════════════════════════════════════════════

const ONBOARD_ROLES = {
  Contractor: ["Project Engineer", "Compliance Officer"],
  Inspector: ["Field Inspector", "Third-party Inspector"],
  Donor: ["Donor Representative"],
  Auditor: ["Auditor"],
};

function OnboardModal({ onClose, onComplete }) {
  const PROJECTS = useStore().state.projects;
  const steps = ["Type", "Organization", "Compliance", "Access", "Review"];
  const [step, setStep] = useState(0);
  const [type, setType] = useState("Contractor");
  const [org, setOrg] = useState("");
  const [country, setCountry] = useState(PROJECTS[0].country);
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState([]);
  const [attest, setAttest] = useState(false);
  const [tax, setTax] = useState(false);
  const [role, setRole] = useState(ONBOARD_ROLES.Contractor[0]);
  const [pid, setPid] = useState(PROJECTS[0].id);

  useEffect(() => {
    setRole(ONBOARD_ROLES[type][0]);
  }, [type]);

  const tierFor = (r) =>
    r === "Donor Representative" || r === "Auditor" ? "L4" : r === "Field Inspector" ? "L2" : "L3";
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canNext =
    step === 1 ? org.trim() && contact.trim() && emailOk : step === 2 ? docs.length > 0 && attest : true;

  const finish = () => {
    onComplete({
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      org,
      country,
      contact,
      email,
      role,
      tier: tierFor(role),
      project: pid,
      docs: docs.length,
      status: "invited",
      sent: "just now",
    });
  };

  return (
    <Modal
      title="Onboard a third party"
      subtitle="Invite · KYC · role assignment"
      icon={UserCog}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={step === 0 ? onClose : () => setStep((s) => s - 1)} iconLeft={ChevronLeft}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 4 ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" iconRight={Send} onClick={finish}>
              Send invitation
            </Button>
          )}
        </>
      }
    >
      <StepDots steps={steps} current={step} />

      {step === 0 && (
        <div>
          <p className="text-xs mb-3" style={{ color: T.bone2 }}>
            Select the class of stakeholder. This sets the verification path and the access tiers available.
          </p>
          <RadioCards
            value={type}
            onChange={setType}
            options={[
              { value: "Contractor", label: "EPC Contractor", icon: HardHat, desc: "Builders, engineers, operators submitting evidence." },
              { value: "Inspector", label: "Inspector", icon: Eye, desc: "Independent field verification of milestones." },
              { value: "Donor", label: "Donor", icon: Globe2, desc: "Funding partner with disbursement oversight." },
              { value: "Auditor", label: "Auditor", icon: FileSearch, desc: "National audit office or third-party assurance." },
            ]}
          />
        </div>
      )}

      {step === 1 && (
        <div>
          <Field label="Organization name">
            <TextInput value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Sinohydro Group Ltd" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country of registration">
              <SelectInput value={country} onChange={setCountry} options={[...new Set(PROJECTS.map((p) => p.country))]} />
            </Field>
            <Field label="Primary contact">
              <TextInput value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Full name" />
            </Field>
          </div>
          <Field label="Contact email" hint={email && !emailOk ? "Enter a valid email address." : "An invitation link is sent here."}>
            <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.org" type="email" />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-xs mb-3" style={{ color: T.bone2 }}>
            Upload KYC & compliance documents — company registration, beneficial-ownership, prior-performance records.
          </p>
          <Dropzone files={docs} onFiles={setDocs} sample={["company_registration.pdf", "beneficial_ownership.pdf"]} />
          <div className="mt-4 space-y-2">
            {[
              ["Anti-corruption attestation signed", attest, setAttest],
              ["Tax clearance certificate provided", tax, setTax],
            ].map(([lab, val, set]) => (
              <button
                key={lab}
                type="button"
                onClick={() => set(!val)}
                className="w-full flex items-center gap-2.5 px-3 py-2 border text-left focus:outline-none focus-visible:ts-focus"
                style={{ borderColor: val ? tint(T.signal, 0.4) : T.ink3 }}
              >
                <span
                  className="w-4 h-4 shrink-0 flex items-center justify-center border"
                  style={{ borderColor: val ? T.signal : T.ink4, background: val ? T.signal : "transparent" }}
                >
                  {val && <CheckCircle2 size={11} style={{ color: T.ink1 }} aria-hidden="true" />}
                </span>
                <span className="text-[13px]" style={{ color: T.bone1 }}>{lab}</span>
              </button>
            ))}
          </div>
          {!attest && (
            <p className="mt-2 text-[11px]" style={{ color: T.bone3 }}>
              The anti-corruption attestation is mandatory to proceed.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assigned role">
              <SelectInput value={role} onChange={setRole} options={ONBOARD_ROLES[type]} />
            </Field>
            <Field label="Access tier">
              <div className="px-3 py-2 border" style={{ borderColor: T.ink3 }}>
                <Chip size="xs" tone="info">{tierFor(role)}</Chip>
              </div>
            </Field>
          </div>
          <Field label="Linked project" hint="The party gains scoped access to this project only.">
            <SelectInput
              value={pid}
              onChange={setPid}
              options={PROJECTS.map((p) => ({ value: p.id, label: `${p.flag} ${p.name}` }))}
            />
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="border divide-y" style={{ borderColor: T.ink3 }}>
          {[
            ["Party type", type],
            ["Organization", org],
            ["Country", country],
            ["Contact", `${contact} · ${email}`],
            ["Role · tier", `${role} · ${tierFor(role)}`],
            ["Linked project", pid],
            ["Compliance docs", `${docs.length} uploaded`],
            ["Attestations", `${[attest, tax].filter(Boolean).length} of 2`],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-2.5">
              <MetaRow label={k} value={v} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW: NEW CONTRACT
// ════════════════════════════════════════════════════════════════════════════

const CONTRACT_MILESTONES = ["Mobilization", "Earthworks", "Structural", "Finishes", "Handover"];

function NewContractModal({ onClose, onComplete }) {
  const PROJECTS = useStore().state.projects;
  const steps = ["Project", "Award", "Schedule", "Review"];
  const [step, setStep] = useState(0);
  const [pid, setPid] = useState(PROJECTS[0].id);
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState("ICB");
  const [contractor, setContractor] = useState(CONTRACTORS[0]);
  const [value, setValue] = useState("");
  const [signed, setSigned] = useState("2026-01-15");
  const [retention, setRetention] = useState("5");

  const numValue = Number(value) || 0;
  const project = PROJECTS.find((p) => p.id === pid);
  const canNext = step === 0 ? title.trim() : step === 1 ? numValue > 0 : true;
  const split = [25, 30, 25, 15, 5];

  const finish = () => {
    onComplete({
      id: `CT-NEW-${Math.floor(100 + Math.random() * 900)}`,
      pid,
      title: title.trim(),
      contractor,
      value: numValue,
      signed,
      status: "awarded",
      method,
      amendments: 0,
    });
  };

  return (
    <Modal
      title="New contract"
      subtitle="Procurement → award → schedule"
      icon={FileText}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={step === 0 ? onClose : () => setStep((s) => s - 1)} iconLeft={ChevronLeft}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" iconRight={BadgeCheck} onClick={finish}>
              Create contract
            </Button>
          )}
        </>
      }
    >
      <StepDots steps={steps} current={step} />

      {step === 0 && (
        <div>
          <Field label="Project">
            <SelectInput
              value={pid}
              onChange={setPid}
              options={PROJECTS.map((p) => ({ value: p.id, label: `${p.flag} ${p.name}` }))}
            />
          </Field>
          <Field label="Contract title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Principal Works — Lot 1" />
          </Field>
          <Field label="Procurement method" hint="ICB / NCB competitive, QCBS quality-cost, Direct single-source.">
            <RadioCards
              value={method}
              onChange={setMethod}
              options={PROC_METHODS.map((m) => ({ value: m, label: m }))}
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div>
          <Field label="Awarded contractor">
            <SelectInput value={contractor} onChange={setContractor} options={CONTRACTORS} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contract value (USD)" hint={numValue ? fmtUSD(numValue) : "Enter the awarded amount."}>
              <TextInput value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" />
            </Field>
            <Field label="Retention %">
              <SelectInput value={retention} onChange={setRetention} options={["0", "5", "10"]} />
            </Field>
          </div>
          <Field label="Signature date">
            <TextInput value={signed} onChange={(e) => setSigned(e.target.value)} type="date" />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: T.bone2 }}>
            Payment schedule · milestone-linked disbursement
          </p>
          <ul className="border divide-y" style={{ borderColor: T.ink3 }}>
            {CONTRACT_MILESTONES.map((m, i) => (
              <li key={m} className="px-3 py-2.5 flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-widest uppercase w-12" style={{ color: T.bone2 }}>
                  M-{String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm" style={{ color: T.bone0 }}>{m}</span>
                <span className="font-mono text-[11px] tabular-nums" style={{ color: T.bone2 }}>{split[i]}%</span>
                <span className="font-mono text-[11px] tabular-nums w-24 text-right" style={{ color: T.bone0 }}>
                  {fmtUSD((numValue * split[i]) / 100)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px]" style={{ color: T.bone3 }}>
            Each tranche releases only after the linked milestone reaches the Verified ledger state.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="border divide-y" style={{ borderColor: T.ink3 }}>
          {[
            ["Project", `${project.flag} ${pid}`],
            ["Title", title],
            ["Method", method],
            ["Contractor", contractor],
            ["Value", fmtUSD(numValue)],
            ["Retention", `${retention}%`],
            ["Signed", signed],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-2.5">
              <MetaRow label={k} value={v} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW: E-SIGNATURE
// ════════════════════════════════════════════════════════════════════════════

function SignModal({ signature, onClose, onComplete }) {
  const PROJECTS = useStore().state.projects;
  const [code, setCode] = useState("");
  const [done, setDone] = useState(null);
  const p = PROJECTS.find((x) => x.id === signature.pid);
  const valid = /^[0-9]{6}$/.test(code);
  const sigHash = useMemo(() => fauxHash(`sig-${signature.id}-${code}`), [signature.id, code]);

  return (
    <Modal
      title="Apply e-signature"
      subtitle="Government-grade · hash-locked"
      icon={FileSignature}
      onClose={onClose}
      footer={
        done ? (
          <Button variant="primary" className="ml-auto" iconRight={ArrowRight} onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="danger" onClick={() => { setDone("declined"); onComplete(signature.id, "declined"); }}>
              Decline
            </Button>
            <Button
              variant="primary"
              iconLeft={Stamp}
              disabled={!valid}
              onClick={() => { setDone("signed"); onComplete(signature.id, "signed"); }}
            >
              Sign document
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span
            className="inline-flex items-center justify-center w-12 h-12 border"
            style={{ borderColor: done === "signed" ? T.signal : T.alert }}
          >
            {done === "signed" ? (
              <BadgeCheck size={24} style={{ color: T.signal }} aria-hidden="true" />
            ) : (
              <X size={24} style={{ color: T.alert }} aria-hidden="true" />
            )}
          </span>
          <p className="text-sm" style={{ color: T.bone0 }}>
            {done === "signed" ? "Signature applied & anchored." : "Document declined — returned to originator."}
          </p>
          {done === "signed" && (
            <code className="font-mono text-[11px]" style={{ color: T.bone2 }} title={sigHash}>
              {sigHash.slice(0, 30)}…
            </code>
          )}
        </div>
      ) : (
        <div>
          <div className="border divide-y mb-4" style={{ borderColor: T.ink3 }}>
            {[
              ["Document", signature.doc],
              ["Project", `${p?.flag} ${signature.pid}`],
              ["Your role", signature.role],
              ["Sequence position", signature.seq],
              ["Auth method", signature.method],
            ].map(([k, v]) => (
              <div key={k} className="px-3 py-2.5">
                <MetaRow label={k} value={v} />
              </div>
            ))}
          </div>
          <Field
            label="Multi-factor code"
            hint={code && !valid ? "Enter the 6-digit code from your authenticator." : "Sent to your registered authenticator app."}
          >
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
            />
          </Field>
          <p className="text-[11px] flex items-center gap-1.5" style={{ color: T.bone3 }}>
            <Lock size={11} aria-hidden="true" />
            Signing hash-locks the document — any later change breaks the workflow hash.
          </p>
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW: NEW PROJECT
// ════════════════════════════════════════════════════════════════════════════

const COUNTRY_FLAG = Object.fromEntries(PROJECTS.map((p) => [p.country, p.flag]));
const RISK_BASE_I3 = { low: 78.5, elevated: 64.0, high: 49.5, critical: 36.0 };

function NewProjectModal({ onClose, onComplete }) {
  const PROJECTS = useStore().state.projects;
  const steps = ["Identity", "Funding", "Schedule", "Review"];
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [country, setCountry] = useState(PROJECTS[0].country);
  const [sector, setSector] = useState(SECTORS[0]);
  const [donor, setDonor] = useState(DONORS[0]);
  const [ministry, setMinistry] = useState("");
  const [budget, setBudget] = useState("");
  const [started, setStarted] = useState("2026-02-01");
  const [eta, setEta] = useState("2028-12-31");
  const [risk, setRisk] = useState("low");

  const numBudget = Number(budget) || 0;
  const canNext =
    step === 0 ? name.trim() : step === 1 ? ministry.trim() && numBudget > 0 : true;

  const finish = () => {
    const slug = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "NEW";
    onComplete({
      id: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      country,
      flag: COUNTRY_FLAG[country] || "🏳️",
      sector,
      donor,
      ministry: ministry.trim(),
      budget: numBudget,
      spent: 0,
      i3: RISK_BASE_I3[risk],
      risk,
      progress: 0,
      started,
      eta,
      lastEvent: "just now",
      alerts: 0,
      isNew: true,
    });
  };

  return (
    <Modal
      title="New project"
      subtitle="Register a project into the portfolio"
      icon={PlusCircle}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={step === 0 ? onClose : () => setStep((s) => s - 1)} iconLeft={ChevronLeft}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" iconRight={BadgeCheck} onClick={finish}>
              Create project
            </Button>
          )}
        </>
      }
    >
      <StepDots steps={steps} current={step} />

      {step === 0 && (
        <div>
          <Field label="Project name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eastern Rail Link Phase 2" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country">
              <SelectInput value={country} onChange={setCountry} options={[...new Set(PROJECTS.map((p) => p.country))]} />
            </Field>
            <Field label="Sector">
              <SelectInput value={sector} onChange={setSector} options={SECTORS} />
            </Field>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Funding donor">
              <SelectInput value={donor} onChange={setDonor} options={DONORS} />
            </Field>
            <Field label="Budget (USD)" hint={numBudget ? fmtUSD(numBudget) : "Total approved envelope."}>
              <TextInput value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" />
            </Field>
          </div>
          <Field label="Implementing ministry / agency">
            <TextInput value={ministry} onChange={(e) => setMinistry(e.target.value)} placeholder="e.g. Ministry of Transport" />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <TextInput value={started} onChange={(e) => setStarted(e.target.value)} type="date" />
            </Field>
            <Field label="Target completion">
              <TextInput value={eta} onChange={(e) => setEta(e.target.value)} type="date" />
            </Field>
          </div>
          <Field label="Initial risk rating" hint="Sets the baseline i³ Integrity Index until evidence accrues.">
            <RadioCards
              value={risk}
              onChange={setRisk}
              options={[
                { value: "low", label: "Low" },
                { value: "elevated", label: "Elevated" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="border divide-y" style={{ borderColor: T.ink3 }}>
          {[
            ["Name", name],
            ["Country", `${COUNTRY_FLAG[country] || ""} ${country}`],
            ["Sector", sector],
            ["Donor", donor],
            ["Ministry", ministry],
            ["Budget", fmtUSD(numBudget)],
            ["Schedule", `${started} → ${eta}`],
            ["Risk · baseline i³", `${risk} · ${RISK_BASE_I3[risk]}`],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-2.5">
              <MetaRow label={k} value={v} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLOW: GENERATE PORTFOLIO BRIEF
// ════════════════════════════════════════════════════════════════════════════

function GenerateBriefModal({ projects, onClose }) {
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setReady(true), 1300);
    return () => clearTimeout(t);
  }, [reduced]);

  const brief = useMemo(() => {
    const count = projects.length;
    const budget = projects.reduce((s, p) => s + p.budget, 0);
    const spent = projects.reduce((s, p) => s + p.spent, 0);
    const avgI3 = projects.reduce((s, p) => s + p.i3, 0) / count;
    const atRisk = projects.filter((p) => p.risk === "high" || p.risk === "critical");
    const countries = new Set(projects.map((p) => p.country)).size;
    const exec = atRisk.length / count;
    return {
      count,
      budget,
      spent,
      avgI3,
      atRisk,
      countries,
      disbursed: spent / budget,
      narrative: `The portfolio spans ${count} projects across ${countries} countries with a combined approved envelope of ${fmtUSD(
        budget
      )}, of which ${fmtUSD(spent)} (${Math.round(
        (spent / budget) * 100
      )}%) has been disbursed against verified milestones. The aggregate i³ Integrity Index stands at ${avgI3.toFixed(
        1
      )}, indicating ${avgI3 >= 70 ? "broadly healthy" : avgI3 >= 55 ? "mixed" : "strained"} assurance. ${
        atRisk.length
          ? `${atRisk.length} project${atRisk.length === 1 ? "" : "s"} carry a high or critical risk rating and warrant escalation: ${atRisk
              .map((p) => p.id)
              .join(", ")}.`
          : "No project currently carries a high or critical risk rating."
      }`,
    };
  }, [projects]);

  const briefText = useMemo(
    () =>
      [
        "TRUSTSFER — PORTFOLIO BRIEF",
        `Generated ${new Date().toISOString().slice(0, 10)}`,
        "",
        brief.narrative,
        "",
        `Projects: ${brief.count}`,
        `Approved budget: ${fmtUSD(brief.budget)}`,
        `Disbursed: ${fmtUSD(brief.spent)} (${Math.round(brief.disbursed * 100)}%)`,
        `Average i³: ${brief.avgI3.toFixed(1)}`,
        `At-risk projects: ${brief.atRisk.length}`,
      ].join("\n"),
    [brief]
  );

  return (
    <Modal
      title="Portfolio brief"
      subtitle="Auto-generated executive summary"
      icon={FileText}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            iconLeft={copied ? BadgeCheck : Download}
            disabled={!ready}
            onClick={() => {
              try {
                navigator.clipboard?.writeText(briefText);
              } catch (e) {
                /* clipboard unavailable */
              }
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy brief"}
          </Button>
        </>
      }
    >
      {!ready ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <RefreshCw size={26} className={reduced ? "" : "ts-spin"} style={{ color: T.signal }} aria-hidden="true" />
          <p className="text-sm" style={{ color: T.bone1 }}>Aggregating ledger state across the portfolio…</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-4" style={{ background: T.ink3 }}>
            {[
              ["Projects", String(brief.count)],
              ["Budget", fmtUSD(brief.budget)],
              ["Disbursed", `${Math.round(brief.disbursed * 100)}%`],
              ["Avg i³", brief.avgI3.toFixed(1)],
            ].map(([k, v]) => (
              <div key={k} className="p-3" style={{ background: T.ink1 }}>
                <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color: T.bone2 }}>{k}</div>
                <div
                  className="mt-1 font-serif text-lg tabular-nums"
                  style={{ fontFamily: "Fraunces, serif", fontWeight: 380, color: T.bone0 }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: T.bone1 }}>
            {brief.narrative}
          </p>
          {brief.atRisk.length > 0 && (
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: T.bone2 }}>
                Escalation watchlist
              </p>
              <ul className="border divide-y" style={{ borderColor: T.ink3 }}>
                {brief.atRisk.map((p) => (
                  <li key={p.id} className="px-3 py-2 flex items-center gap-3">
                    <span className="text-sm flex-1" style={{ color: T.bone0 }}>{p.flag} {p.name}</span>
                    <Chip size="xs" tone="risk">{p.risk}</Chip>
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: T.bone2 }}>i³ {p.i3}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW SWITCHER
// ════════════════════════════════════════════════════════════════════════════

function ActiveView({ active, onOpenProject, onNavigate, extraProjects, addProject }) {
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const allProjects = PROJECTS;
  const PageHeader = ({ title, subtitle, action }) => (
    <div className="mb-5 md:mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1
          className="font-serif text-2xl md:text-3xl tracking-tight leading-tight"
          style={{
            fontFamily: "Fraunces, serif",
            fontWeight: 380,
            color: T.bone0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1 font-mono text-[10px] tracking-widest uppercase"
            style={{ color: T.bone2 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );

  switch (active) {
    case "overview":
      return (
        <>
          {newProjOpen && (
            <NewProjectModal
              onClose={() => setNewProjOpen(false)}
              onComplete={(p) => {
                addProject(p);
                setNewProjOpen(false);
                onNavigate("projects");
              }}
            />
          )}
          {briefOpen && (
            <GenerateBriefModal projects={allProjects} onClose={() => setBriefOpen(false)} />
          )}
          <PageHeader
            title="Portfolio overview"
            subtitle={`${allProjects.length} active projects · ${
              new Set(allProjects.map((p) => p.country)).size
            } countries · 5 donors`}
            action={
              <div className="flex items-center gap-2">
                <Button iconLeft={PlusCircle} onClick={() => setNewProjOpen(true)}>
                  New project
                </Button>
                <Button variant="primary" iconRight={ArrowUpRight} onClick={() => setBriefOpen(true)}>
                  Generate brief
                </Button>
              </div>
            }
          />
          <OverviewView onOpenProject={onOpenProject} onNavigate={onNavigate} />
        </>
      );
    case "projects":
      return (
        <>
          <PageHeader
            title="Projects"
            subtitle="Sortable register · click a row for full record"
          />
          <ProjectsView onOpenProject={onOpenProject} extra={extraProjects} />
        </>
      );
    case "evidence":
      return (
        <>
          <PageHeader
            title="Evidence Ledger"
            subtitle="Patent #1 · Hybrid blockchain · live anchoring"
          />
          <EvidenceView onOpenProject={onOpenProject} />
        </>
      );
    case "i3":
      return (
        <>
          <PageHeader
            title="I³ Analytics"
            subtitle="Patent #2 · multidimensional integrity scoring"
          />
          <I3AnalyticsView onOpenProject={onOpenProject} />
        </>
      );
    case "conflicts":
      return (
        <>
          <PageHeader
            title="Conflict Detection"
            subtitle="Patent #3 · 6-vector anomaly engine"
          />
          <ConflictsView onOpenProject={onOpenProject} />
        </>
      );
    case "approvals":
      return (
        <>
          <PageHeader
            title="Approvals queue"
            subtitle="Multi-signature workflow · SLA-driven"
          />
          <ApprovalsView onOpenProject={onOpenProject} />
        </>
      );
    case "disbursements":
      return (
        <>
          <PageHeader
            title="Disbursements"
            subtitle="Treasury · donor · contractor cash trail"
          />
          <DisbursementsView />
        </>
      );
    case "geo":
      return (
        <>
          <PageHeader
            title="Geospatial"
            subtitle="Project geography · I³ overlay"
          />
          <GeoView onOpenProject={onOpenProject} />
        </>
      );
    case "audit":
      return (
        <>
          <PageHeader
            title="Audit trail"
            subtitle="Chronological · cryptographically chained"
          />
          <AuditView onOpenProject={onOpenProject} />
        </>
      );
    case "contracts":
      return (
        <>
          <PageHeader
            title="Contracts & procurement"
            subtitle="Registry · amendments · change orders"
          />
          <ContractsView onOpenProject={onOpenProject} />
        </>
      );
    case "ledger":
      return (
        <>
          <PageHeader
            title="Ledger Sync"
            subtitle="Patent #3 · donor–government–contractor consensus"
          />
          <LedgerSyncView onOpenProject={onOpenProject} />
        </>
      );
    case "workflows":
      return (
        <>
          <PageHeader
            title="Workflow orchestration"
            subtitle="State-machine routing · escalation · fail-safes"
          />
          <WorkflowsView onOpenProject={onOpenProject} />
        </>
      );
    case "signatures":
      return (
        <>
          <PageHeader
            title="E-Signatures"
            subtitle="Government-grade · DAG-sequenced · geo-tagged"
          />
          <SignaturesView onOpenProject={onOpenProject} />
        </>
      );
    case "risk":
      return (
        <>
          <PageHeader
            title="AI Risk Prediction"
            subtitle="Smart alerts · fraud likelihood · ML ensemble"
          />
          <RiskView onOpenProject={onOpenProject} />
        </>
      );
    case "portal":
      return (
        <>
          <PageHeader
            title="Public transparency portal"
            subtitle="Redacted citizen view · verifiable progress"
          />
          <PortalView />
        </>
      );
    case "reports":
      return (
        <>
          <PageHeader
            title="Reports"
            subtitle="Donor-compliant · audit-ready · OCDS export"
          />
          <ReportsView />
        </>
      );
    case "access":
      return (
        <>
          <PageHeader
            title="Access & identity"
            subtitle="RBAC · identity layer · 4-party verification"
          />
          <AccessView />
        </>
      );
    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════

// Demo credentials surfaced in the login screen so an operator can sign
// in without prior context. Mirrors SEED_USERS in server/seed.js.
const DEMO_CREDENTIALS = [
  { username: "admin", password: "trustsfer-2026", role: "Auditor · L4" },
  { username: "ministry", password: "ministry-2026", role: "Ministry · L4" },
  { username: "inspector", password: "inspector-2026", role: "Inspector · L2" },
  { username: "donor", password: "donor-2026", role: "Donor · L4" },
];

function LoginScreen() {
  const store = useStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("trustsfer-2026");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  // "checking" | "ok" | "stale" | "down"
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      try {
        const h = await api.health();
        if (cancelled) return;
        // Pre-auth server builds return health without the auth flag.
        setApiStatus(h && h.auth ? "ok" : "stale");
      } catch (e) {
        if (!cancelled) setApiStatus("down");
      }
    };
    probe();
    const t = setInterval(probe, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await store.login(username.trim(), password);
    } catch (e) {
      if (e.status === 404) {
        setErr(
          "The API server is running an outdated build without auth routes. Restart it: stop all node processes, then run `npm run dev` (or `npm start` for production)."
        );
      } else if (e.status === undefined || /fetch|network/i.test(e.message || "")) {
        setErr("Cannot reach the API server. Start it with `npm run dev` (runs API + web together).");
      } else {
        setErr(e.message || "Sign in failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const apiBanner =
    apiStatus === "down"
      ? {
          tone: T.alert,
          text: "API server unreachable. Start the full stack with `npm run dev` — it boots the API (port 3001) and the web app together.",
        }
      : apiStatus === "stale"
      ? {
          tone: T.amber,
          text: "An outdated API server build is responding — it predates authentication. Stop it and restart with `npm run dev` or `npm start`.",
        }
      : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: T.ink0,
        color: T.bone0,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..700,30..100&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        :root { color-scheme: light; }
        body { background: ${T.ink0}; margin: 0; }
        .ts-focus { outline: 2px solid ${T.signal}; outline-offset: 2px; }
      `}</style>

      <div className="w-full max-w-[920px] grid md:grid-cols-2 gap-px border" style={{ borderColor: T.ink3, background: T.ink3 }}>
        <div className="p-8 md:p-10" style={{ background: T.ink1 }}>
          <div className="flex items-center gap-2.5 mb-8">
            <span
              className="inline-flex items-center justify-center w-9 h-9 border"
              style={{ borderColor: T.signal }}
            >
              <ShieldCheck size={18} style={{ color: T.signal }} aria-hidden="true" />
            </span>
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                TrustSfer
              </div>
              <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone3 }}>
                Verifiable Public Works
              </div>
            </div>
          </div>

          <h1
            className="font-serif text-3xl leading-tight"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 400, color: T.bone0 }}
          >
            Sign in to the workspace.
          </h1>
          <p className="mt-2 text-sm" style={{ color: T.bone1 }}>
            Government-grade access to the integrity ledger. All actions are anchored, attributable, and reviewable.
          </p>

          {apiBanner && (
            <div
              className="mt-5 px-3 py-2.5 border text-[12px] leading-relaxed"
              style={{
                borderColor: tint(apiBanner.tone, 0.45),
                background: tint(apiBanner.tone, 0.07),
                color: apiBanner.tone,
              }}
              role="alert"
            >
              {apiBanner.text}
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="block font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: T.bone2 }}>
                Username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full bg-transparent border outline-none px-3 py-2 text-sm focus:outline-none focus-visible:ts-focus"
                style={{ borderColor: T.ink3, color: T.bone0 }}
              />
            </label>
            <label className="block">
              <span className="block font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: T.bone2 }}>
                Password
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full bg-transparent border outline-none px-3 py-2 text-sm focus:outline-none focus-visible:ts-focus"
                style={{ borderColor: T.ink3, color: T.bone0 }}
              />
            </label>
            {err && (
              <div
                className="px-3 py-2 border text-[12px]"
                style={{ borderColor: tint(T.alert, 0.4), background: tint(T.alert, 0.06), color: T.alert }}
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={busy || apiStatus === "down"}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border font-mono text-[11px] tracking-widest uppercase focus:outline-none focus-visible:ts-focus disabled:opacity-60"
              style={{ background: T.signal, color: T.ink0, borderColor: T.signal }}
            >
              {busy ? "Signing in…" : apiStatus === "down" ? "API offline" : "Sign in"}
              {!busy && apiStatus !== "down" && <ArrowRight size={12} aria-hidden="true" />}
            </button>
          </form>
        </div>

        <div className="p-8 md:p-10 hidden md:block" style={{ background: T.ink2 }}>
          <div className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: T.bone2 }}>
            Demo credentials
          </div>
          <p className="text-[12px] leading-relaxed mb-5" style={{ color: T.bone1 }}>
            Click a role below to autofill the form. Every account writes to the same ledger; the differences are role, access tier, and which actions you can attest to.
          </p>
          <ul className="space-y-2">
            {DEMO_CREDENTIALS.map((c) => (
              <li key={c.username}>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(c.username);
                    setPassword(c.password);
                  }}
                  className="w-full text-left px-3 py-2.5 border focus:outline-none focus-visible:ts-focus"
                  style={{
                    borderColor: username === c.username ? T.signal : T.ink3,
                    background: username === c.username ? tint(T.signal, 0.08) : T.ink1,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm" style={{ color: T.bone0 }}>{c.username}</span>
                    <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.bone2 }}>
                      {c.role}
                    </span>
                  </div>
                  <code className="block mt-0.5 font-mono text-[10px]" style={{ color: T.bone3 }}>
                    {c.password}
                  </code>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AuthGate() {
  const store = useStore();
  const { state, authToken } = store;
  if (!authToken) return <LoginScreen />;
  if (!state.me) {
    // Token present but state still hydrating — render a quiet splash.
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: T.ink0,
          color: T.bone1,
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        }}
      >
        <RefreshCw size={24} className="ts-spin" style={{ color: T.signal }} aria-hidden="true" />
      </div>
    );
  }
  return <DashboardShell />;
}

export default function TrustSferDashboard() {
  return (
    <StoreProvider>
      <AuthGate />
    </StoreProvider>
  );
}

const viewFromHash = () => {
  const h = window.location.hash.replace(/^#\/?/, "");
  return MODULES.some((m) => m.id === h) ? h : "overview";
};

function DashboardShell() {
  const store = useStore();
  const [active, setActive] = useState(viewFromHash);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [openProjectId, setOpenProjectId] = useState(null);
  const extraProjects = store.state.projects;

  // Hash routing: views are linkable and the back button works.
  useEffect(() => {
    const onHash = () => setActive(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const onNavigate = useCallback((id) => {
    setActive(id);
    if (window.location.hash !== `#/${id}`) window.location.hash = `#/${id}`;
    setMobileOpen(false);
  }, []);

  const onOpenProject = useCallback((id) => {
    setOpenProjectId(id);
  }, []);

  useKey(
    { combo: { key: "k", meta: true } },
    () => setPaletteOpen((v) => !v),
    []
  );

  return (
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{
        background: T.ink0,
        color: T.bone0,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontFeatureSettings: '"ss01", "tnum"',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..700,30..100&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        :root { color-scheme: light; }
        body { background: ${T.ink0}; }

        .ts-skip-link {
          position: absolute;
          left: -9999px;
          top: 0;
          padding: 0.75rem 1rem;
          background: ${T.signal};
          color: ${T.ink0};
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          z-index: 100;
        }
        .ts-skip-link:focus { left: 1rem; top: 0.5rem; }

        .ts-focus {
          outline: 2px solid ${T.signal};
          outline-offset: 2px;
        }

        @keyframes ts-shimmer-kf {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .ts-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0,0,0,0.05) 50%,
            transparent 100%
          );
          animation: ts-shimmer-kf 1.6s infinite linear;
        }

        @keyframes ts-fade-in-kf {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ts-fade-in {
          animation: ts-fade-in-kf 420ms cubic-bezier(0.22,1,0.36,1);
        }

        @keyframes ts-spin-kf {
          to { transform: rotate(360deg); }
        }
        .ts-spin { animation: ts-spin-kf 1s linear infinite; }

        @keyframes ts-blink-soft-kf {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .ts-blink-soft {
          animation: ts-blink-soft-kf 1.4s ease-in-out infinite;
        }

        .ts-row:hover {
          background: rgba(0,0,0,0.022);
        }

        @media (prefers-reduced-motion: reduce) {
          .ts-shimmer, .ts-fade-in, .ts-blink-soft, .ts-spin {
            animation: none !important;
          }
          * { scroll-behavior: auto !important; }
        }

        ::selection {
          background: ${T.signal};
          color: ${T.ink0};
        }

        .tabular-nums { font-variant-numeric: tabular-nums; }

        /* Custom scrollbar */
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: ${T.ink0}; }
        *::-webkit-scrollbar-thumb {
          background: ${T.ink3};
          border: 2px solid ${T.ink0};
        }
        *::-webkit-scrollbar-thumb:hover { background: ${T.ink4}; }
      `}</style>

      <a href="#main" className="ts-skip-link">Skip to main content</a>

      <div className="flex flex-1 min-h-0">
        <Sidebar
          active={active}
          onNavigate={onNavigate}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            active={active}
            onOpenPalette={() => setPaletteOpen(true)}
            onToggleMobile={() => setMobileOpen(true)}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            onOpenAlerts={() => setAlertsOpen(true)}
            alertCount={
              store.state.conflicts.filter(
                (c) => c.severity !== "low" && !c.dismissed
              ).length
            }
          />

          <main
            id="main"
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
            style={{ background: T.ink0 }}
          >
            <ActiveView
              active={active}
              onOpenProject={onOpenProject}
              onNavigate={onNavigate}
              extraProjects={extraProjects}
              addProject={store.addProject}
            />
          </main>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={onNavigate}
        onOpenProject={onOpenProject}
      />

      <AlertsPanel
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        onOpenProject={(id) => {
          setAlertsOpen(false);
          onOpenProject(id);
        }}
      />

      <ProjectDrawer
        projectId={openProjectId}
        extraProjects={extraProjects}
        onClose={() => setOpenProjectId(null)}
        onNavigate={onNavigate}
      />

      <ErrorToast />
    </div>
  );
}
