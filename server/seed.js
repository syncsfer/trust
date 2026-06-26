// Server-authoritative seed data. Inserted on first boot when the
// projects table is empty; once inserted, edits live in the DB and
// survive restarts. Kept here (rather than in JSON files) so the API
// has zero filesystem dependencies beyond the SQLite database itself.

export const SEED_PROJECTS = [
  { id: "RD-N4-EXP", name: "Northern Corridor Expressway", country: "Dominican Republic", flag: "🇩🇴", sector: "Roads", donor: "IDB", ministry: "Ministry of Public Works", budget: 412_000_000, spent: 268_400_000, i3: 84.2, risk: "low", progress: 64, started: "2024-03-12", eta: "2026-11-30", lastEvent: "2m ago", alerts: 0 },
  { id: "KE-PRT-MS3", name: "Mombasa Port Terminal 3", country: "Kenya", flag: "🇰🇪", sector: "Ports", donor: "World Bank", ministry: "Kenya Ports Authority", budget: 890_000_000, spent: 522_300_000, i3: 71.6, risk: "med", progress: 58, started: "2023-09-04", eta: "2027-02-28", lastEvent: "12m ago", alerts: 2 },
  { id: "PH-HSP-GMA", name: "Greater Manila Regional Hospital", country: "Philippines", flag: "🇵🇭", sector: "Health", donor: "ADB", ministry: "Department of Health", budget: 215_000_000, spent: 198_700_000, i3: 58.9, risk: "high", progress: 81, started: "2023-01-15", eta: "2025-09-30", lastEvent: "27s ago", alerts: 4 },
  { id: "CO-EN-LLR", name: "Llanos Solar Generation Cluster", country: "Colombia", flag: "🇨🇴", sector: "Energy", donor: "Treasury", ministry: "Ministry of Energy", budget: 340_000_000, spent: 91_500_000, i3: 92.4, risk: "low", progress: 22, started: "2025-02-01", eta: "2027-12-15", lastEvent: "1h ago", alerts: 0 },
  { id: "NG-WT-LGS", name: "Lagos Metropolitan Water Reuse", country: "Nigeria", flag: "🇳🇬", sector: "Water", donor: "AfDB", ministry: "Ministry of Water Resources", budget: 540_000_000, spent: 312_600_000, i3: 67.3, risk: "med", progress: 49, started: "2024-05-20", eta: "2027-06-30", lastEvent: "4m ago", alerts: 1 },
  { id: "JO-RD-DSR", name: "Desert Highway Resurfacing Programme", country: "Jordan", flag: "🇯🇴", sector: "Roads", donor: "EU", ministry: "Ministry of Public Works & Housing", budget: 124_000_000, spent: 119_300_000, i3: 88.1, risk: "low", progress: 96, started: "2023-06-01", eta: "2025-08-30", lastEvent: "18m ago", alerts: 0 },
  { id: "ID-EN-JKT", name: "West Java Transmission Upgrade", country: "Indonesia", flag: "🇮🇩", sector: "Energy", donor: "World Bank", ministry: "Ministry of Energy & Mineral Resources", budget: 760_000_000, spent: 408_500_000, i3: 75.8, risk: "med", progress: 54, started: "2024-02-10", eta: "2026-12-20", lastEvent: "9m ago", alerts: 1 },
  { id: "GH-MN-ACR", name: "Accra Municipal Drainage Phase II", country: "Ghana", flag: "🇬🇭", sector: "Municipal", donor: "Treasury", ministry: "Ministry of Local Government", budget: 78_000_000, spent: 51_200_000, i3: 63.2, risk: "med", progress: 65, started: "2024-08-12", eta: "2026-04-30", lastEvent: "33m ago", alerts: 2 },
  { id: "BD-DR-CYC", name: "Cyclone Reconstruction Phase III", country: "Bangladesh", flag: "🇧🇩", sector: "Disaster", donor: "USAID", ministry: "Disaster Management Bureau", budget: 95_000_000, spent: 71_400_000, i3: 49.1, risk: "high", progress: 74, started: "2024-01-08", eta: "2025-12-30", lastEvent: "1m ago", alerts: 5 },
  { id: "MX-RD-OAX", name: "Oaxaca Rural Connector Roads", country: "Mexico", flag: "🇲🇽", sector: "Roads", donor: "Treasury", ministry: "SCT", budget: 198_000_000, spent: 86_300_000, i3: 79.6, risk: "low", progress: 41, started: "2024-11-04", eta: "2027-03-30", lastEvent: "22m ago", alerts: 0 },
  { id: "TZ-ED-DSM", name: "Dar es Salaam Schools Modernization", country: "Tanzania", flag: "🇹🇿", sector: "Education", donor: "AfDB", ministry: "Ministry of Education", budget: 110_000_000, spent: 28_900_000, i3: 86.5, risk: "low", progress: 24, started: "2025-04-18", eta: "2027-08-20", lastEvent: "2h ago", alerts: 0 },
  { id: "PE-PRT-CLO", name: "Callao Port Container Yard Expansion", country: "Peru", flag: "🇵🇪", sector: "Ports", donor: "IDB", ministry: "Ministry of Transport", budget: 280_000_000, spent: 169_400_000, i3: 73.2, risk: "med", progress: 60, started: "2024-04-15", eta: "2026-10-30", lastEvent: "47m ago", alerts: 1 },
  { id: "EG-HSP-CRO", name: "Cairo Specialty Hospital Network", country: "Egypt", flag: "🇪🇬", sector: "Health", donor: "World Bank", ministry: "Ministry of Health & Population", budget: 420_000_000, spent: 192_700_000, i3: 81.0, risk: "low", progress: 46, started: "2024-07-22", eta: "2027-05-15", lastEvent: "14m ago", alerts: 0 },
  { id: "VN-EN-MEK", name: "Mekong Delta Power Network", country: "Vietnam", flag: "🇻🇳", sector: "Energy", donor: "ADB", ministry: "MOIT", budget: 510_000_000, spent: 244_000_000, i3: 77.4, risk: "med", progress: 48, started: "2024-06-09", eta: "2026-11-30", lastEvent: "5m ago", alerts: 1 },
];

export const SEED_CONFLICTS = [
  { id: "CDE-7421", pid: "PH-HSP-GMA", severity: "high", kind: "Spatial", title: "GPS metadata inconsistent with site geofence", desc: "Three uploaded inspection photos place evidence 1.4km outside declared site polygon.", detected: "27s ago" },
  { id: "CDE-7419", pid: "BD-DR-CYC", severity: "high", kind: "Financial", title: "Disbursement velocity exceeds milestone certification rate", desc: "$3.2M disbursed against partially certified milestone M-14 in last 72h.", detected: "8m ago" },
  { id: "CDE-7415", pid: "BD-DR-CYC", severity: "med", kind: "Temporal", title: "Back-dated approval pattern", desc: "Two workflow approvals dated prior to corresponding evidence upload timestamps.", detected: "1h ago" },
  { id: "CDE-7414", pid: "GH-MN-ACR", severity: "med", kind: "Evidence Integrity", title: "Duplicate image hash across milestone evidence", desc: "Same image hash submitted under two different milestone IDs (M-04, M-06).", detected: "2h ago" },
  { id: "CDE-7411", pid: "PH-HSP-GMA", severity: "high", kind: "Workflow", title: "Missing dual-control on contract amendment", desc: "Amendment #3 approved by a single role; policy requires Engineer + Ministry sign-off.", detected: "3h ago" },
  { id: "CDE-7408", pid: "KE-PRT-MS3", severity: "low", kind: "Semantic", title: "Inspection narrative diverges from sensor readings", desc: "Reported strain-gauge baseline 4.2% higher than uploaded sensor log on M-09.", detected: "yesterday" },
  { id: "CDE-7402", pid: "ID-EN-JKT", severity: "med", kind: "Financial", title: "Currency rounding anomaly across line items", desc: "Sub-line totals deviate from declared FX rate by ~$140K cumulatively.", detected: "yesterday" },
  { id: "CDE-7399", pid: "NG-WT-LGS", severity: "low", kind: "Spatial", title: "Evidence cluster outside expected sector polygon", desc: "12 of 84 photos from Sector C tagged outside its standard boundary by <300m.", detected: "2d ago" },
];

export const SEED_APPROVALS = [
  { id: "APR-9281", pid: "RD-N4-EXP", title: "Milestone M-14 certification", requested: "Engineer · ANI", submitted: "12m ago", role: "Ministry", sla: "due in 4h", priority: "high" },
  { id: "APR-9279", pid: "CO-EN-LLR", title: "Subcontractor onboarding (Llanos Solar EPC)", requested: "Project Director", submitted: "1h ago", role: "Donor", sla: "due in 22h", priority: "med" },
  { id: "APR-9276", pid: "EG-HSP-CRO", title: "Contract amendment #2 — scope variation", requested: "Procurement", submitted: "2h ago", role: "Ministry · Donor", sla: "due in 47h", priority: "med" },
  { id: "APR-9273", pid: "TZ-ED-DSM", title: "Mobilization disbursement tranche A", requested: "Treasury", submitted: "3h ago", role: "Treasury", sla: "due in 21h", priority: "low" },
  { id: "APR-9270", pid: "MX-RD-OAX", title: "Quarterly performance assurance package", requested: "Project Director", submitted: "6h ago", role: "Auditor", sla: "due tomorrow", priority: "low" },
  { id: "APR-9267", pid: "VN-EN-MEK", title: "Substation handover acceptance — A4", requested: "Engineer", submitted: "9h ago", role: "Ministry", sla: "due in 36h", priority: "high" },
];

const CONTRACTORS = [
  "Andrade Construções SA", "Sinohydro Group Ltd", "Strabag SE", "China Harbour Engineering",
  "VINCI Construction Grands Projets", "Webuild S.p.A.", "Larsen & Toubro Ltd",
  "Hyundai Engineering & Construction", "Bouygues Travaux Publics", "Ferrovial Construcción",
  "Orascom Construction", "Acciona Infraestructuras", "Samsung C&T", "Power Construction Corp",
];
const PROC_METHODS = ["ICB", "NCB", "QCBS", "Direct"];

export const SEED_CONTRACTS = SEED_PROJECTS.map((p, i) => {
  const value = Math.round(p.budget * 0.82);
  const status = p.progress >= 96 ? "closed" : p.alerts >= 3 ? "amended" : p.progress < 25 ? "awarded" : "active";
  return {
    id: `CT-${p.id}`, pid: p.id, title: `${p.name} — Principal Works`,
    contractor: CONTRACTORS[i % CONTRACTORS.length], value, signed: p.started, status,
    method: PROC_METHODS[i % PROC_METHODS.length],
    amendments: p.alerts > 2 ? 3 : p.alerts,
  };
});

export const SEED_CHANGE_ORDERS = [
  { id: "CO-3104", pid: "PH-HSP-GMA", title: "Structural reinforcement — seismic Annex B", delta: 8_400_000, reason: "Scope variation", status: "pending", raised: "2d ago", approvals: "Engineer · Ministry" },
  { id: "CO-3101", pid: "BD-DR-CYC", title: "Additional drainage culverts — Sector 4", delta: 2_100_000, reason: "Site condition", status: "approved", raised: "6d ago", approvals: "Engineer · Ministry · Donor" },
  { id: "CO-3098", pid: "KE-PRT-MS3", title: "Quay crane rail re-grade", delta: 3_650_000, reason: "Design correction", status: "pending", raised: "9d ago", approvals: "Engineer" },
  { id: "CO-3094", pid: "GH-MN-ACR", title: "Deduct — reduced pump station count", delta: -1_250_000, reason: "Value engineering", status: "approved", raised: "12d ago", approvals: "Engineer · Ministry" },
  { id: "CO-3090", pid: "ID-EN-JKT", title: "Transmission tower route deviation", delta: 5_900_000, reason: "Land access", status: "disputed", raised: "15d ago", approvals: "Engineer · Ministry" },
];

export const SEED_SIGNATURES = [
  { id: "SIG-8841", pid: "RD-N4-EXP", doc: "Milestone M-14 Certificate", role: "Ministry Director", seq: "3 of 5", status: "pending", actor: "F. Haddad", when: "due 4h", geo: "Santo Domingo · DO", method: "MFA + Biometric" },
  { id: "SIG-8838", pid: "PH-HSP-GMA", doc: "Contract Amendment #3", role: "Project Engineer", seq: "1 of 4", status: "pending", actor: "P. dela Cruz", when: "overdue 6h", geo: "Manila · PH", method: "MFA" },
  { id: "SIG-8835", pid: "EG-HSP-CRO", doc: "Disbursement Authorization", role: "Finance Controller", seq: "4 of 4", status: "signed", actor: "N. Saleh", when: "2h ago", geo: "Cairo · EG", method: "MFA + Hardware Key" },
  { id: "SIG-8830", pid: "KE-PRT-MS3", doc: "Inspection Report M-09", role: "Third-party Inspector", seq: "2 of 3", status: "signed", actor: "M. Otieno", when: "5h ago", geo: "Mombasa · KE", method: "MFA + Biometric" },
  { id: "SIG-8826", pid: "BD-DR-CYC", doc: "Change Order CO-3101", role: "Donor Representative", seq: "3 of 3", status: "declined", actor: "USAID Monitor", when: "yesterday", geo: "Dhaka · BD", method: "MFA" },
  { id: "SIG-8821", pid: "CO-EN-LLR", doc: "Subcontractor Agreement", role: "Procurement Lead", seq: "1 of 3", status: "pending", actor: "L. Moreno", when: "due 20h", geo: "Bogotá · CO", method: "MFA" },
];

export const SEED_REPORTS = [
  { id: "RPT-2291", template: "World Bank — ISR", pid: "KE-PRT-MS3", generated: "2h ago", fmt: "PDF", status: "ready", size: "4.2 MB" },
  { id: "RPT-2288", template: "Donor Quarterly", pid: "EG-HSP-CRO", generated: "6h ago", fmt: "XLSX", status: "ready", size: "1.1 MB" },
  { id: "RPT-2285", template: "Audit Evidence Pack", pid: "PH-HSP-GMA", generated: "—", fmt: "PDF", status: "generating", size: "—" },
  { id: "RPT-2280", template: "OCDS Export", pid: "ALL", generated: "1d ago", fmt: "JSON", status: "ready", size: "812 KB" },
  { id: "RPT-2277", template: "PFM Reconciliation", pid: "ALL", generated: "—", fmt: "CSV", status: "scheduled", size: "—" },
];

export const SEED_WORKFLOWS = [
  { id: "WF-5521", pid: "RD-N4-EXP", title: "Milestone M-14 certification", stage: 3, sla: "due 4h", blocked: false, kind: "Milestone" },
  { id: "WF-5519", pid: "PH-HSP-GMA", title: "Contract amendment #3 sign-off", stage: 1, sla: "overdue 6h", blocked: true, kind: "Amendment" },
  { id: "WF-5516", pid: "BD-DR-CYC", title: "Disbursement tranche M-12", stage: 4, sla: "due 18h", blocked: false, kind: "Payment" },
  { id: "WF-5512", pid: "CO-EN-LLR", title: "Subcontractor onboarding", stage: 2, sla: "due 22h", blocked: false, kind: "Onboarding" },
  { id: "WF-5508", pid: "KE-PRT-MS3", title: "Change order CO-3098 routing", stage: 0, sla: "due 2d", blocked: false, kind: "Change Order" },
  { id: "WF-5503", pid: "EG-HSP-CRO", title: "Quarterly assurance package", stage: 5, sla: "due 36h", blocked: false, kind: "Reporting" },
  { id: "WF-5499", pid: "VN-EN-MEK", title: "Substation A4 handover acceptance", stage: 2, sla: "overdue 2h", blocked: true, kind: "Handover" },
];

export const SEED_LEDGER = [
  { id: "LR-44120", pid: "KE-PRT-MS3", type: "Financial", unit: "usd", state: 2, gov: 522_300_000, donor: 519_800_000, contractor: 524_100_000, updated: "3m ago" },
  { id: "LR-44117", pid: "PH-HSP-GMA", type: "Milestone", unit: "pct", state: 5, gov: 81, donor: 62, contractor: 88, updated: "11m ago" },
  { id: "LR-44113", pid: "BD-DR-CYC", type: "Change Order", unit: "usd", state: 5, gov: 2_100_000, donor: 0, contractor: 2_100_000, updated: "26m ago" },
  { id: "LR-44109", pid: "RD-N4-EXP", type: "Milestone", unit: "pct", state: 7, gov: 64, donor: 64, contractor: 64, updated: "1h ago" },
  { id: "LR-44104", pid: "ID-EN-JKT", type: "Financial", unit: "usd", state: 6, gov: 408_500_000, donor: 408_500_000, contractor: 414_400_000, updated: "2h ago" },
  { id: "LR-44098", pid: "EG-HSP-CRO", type: "Procurement", unit: "n", state: 7, gov: 1, donor: 1, contractor: 1, updated: "3h ago" },
  { id: "LR-44091", pid: "CO-EN-LLR", type: "Contract", unit: "usd", state: 3, gov: 278_800_000, donor: 278_800_000, contractor: 278_800_000, updated: "5h ago" },
];

// Demo user accounts. Passwords are hashed at seed time, not stored
// in plaintext. Roles map to RBAC tiers in the front-end.
// Helpers for the seed scopes so each demo account demonstrates a
// different access slice. Filters are by donor, ministry, or sector.
const PIDS_FOR_DONOR = (donor) =>
  SEED_PROJECTS.filter((p) => p.donor === donor).map((p) => p.id);
const PIDS_FOR_COUNTRIES = (countries) =>
  SEED_PROJECTS.filter((p) => countries.includes(p.country)).map((p) => p.id);

export const SEED_USERS = [
  // Admin sees everything.
  {
    username: "admin",
    name: "Sarah Ramírez",
    initials: "SR",
    email: "admin@trustsfer.gov",
    role: "Workspace Administrator",
    tier: "L4",
    password: "trustsfer-2026",
    allowedProjects: "ALL",
  },
  // Ministry Director sees the projects of her country group.
  {
    username: "ministry",
    name: "Farah Haddad",
    initials: "FH",
    email: "ministry@trustsfer.gov",
    role: "Ministry Director",
    tier: "L4",
    password: "ministry-2026",
    allowedProjects: "ALL",
  },
  // Inspector is scoped to East Africa field assignments.
  {
    username: "inspector",
    name: "Mary Otieno",
    initials: "MO",
    email: "inspector@trustsfer.gov",
    role: "Field Inspector",
    tier: "L2",
    password: "inspector-2026",
    allowedProjects: PIDS_FOR_COUNTRIES(["Kenya", "Tanzania", "Ghana", "Nigeria"]),
  },
  // Donor representative sees only the donor's portfolio.
  {
    username: "donor",
    name: "USAID Monitor",
    initials: "UM",
    email: "donor@trustsfer.gov",
    role: "Donor Representative",
    tier: "L4",
    password: "donor-2026",
    allowedProjects: PIDS_FOR_DONOR("USAID"),
  },
  // Project engineer for the LATAM Roads & Energy projects.
  {
    username: "engineer",
    name: "Luis Moreno",
    initials: "LM",
    email: "engineer@trustsfer.gov",
    role: "Project Engineer",
    tier: "L3",
    password: "engineer-2026",
    allowedProjects: PIDS_FOR_COUNTRIES(["Colombia", "Mexico", "Peru", "Dominican Republic"]),
  },
  // Treasury officer with portfolio-wide visibility.
  {
    username: "treasury",
    name: "Kofi Bello",
    initials: "KB",
    email: "treasury@trustsfer.gov",
    role: "Treasury Officer",
    tier: "L3",
    password: "treasury-2026",
    allowedProjects: "ALL",
  },
  // Public observer with read-only baseline access.
  {
    username: "observer",
    name: "Civil Society Observer",
    initials: "CS",
    email: "observer@civicobservatory.org",
    role: "Civil Society Observer",
    tier: "L1",
    password: "observer-2026",
    allowedProjects: "ALL",
  },
];
