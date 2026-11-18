#!/usr/bin/env node
// Checks a system design page built from assets/system-design.html against references/design-schema.md.
// Usage: node scripts/check-design.mjs <page.html> [more.html ...]
// Exits 1 if any page has errors. Warnings never fail the run.
// Note: the DESIGN script is evaluated in a bare vm context with a timeout. vm is not a security
// boundary, so only check pages you or your agent produced.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ICONS = new Set(["browser", "mobile", "user", "globe", "shield", "balancer", "lambda", "server", "worker", "database", "layers", "funnel", "zap", "queue", "broadcast", "gateway", "search", "clock", "key", "storage", "mail", "cloud", "chart", "breaker", "lock"]);
const ZONES = new Set(["client", "edge", "app", "data", "services"]);
const STATUSES = new Set(["new", "changed", "same", "removed"]);
const SOURCES = /^(repo|brief|user|inferred|unknown)\b/i;
const LIMITS = { label: 26, tech: 44, edgeLabel: 10, rows: 4, longEdges: 4 };

function loadDesign(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const src = scripts.find((s) => /const DESIGN\s*=/.test(s));
  if (!src) throw new Error("no <script> with `const DESIGN =` found");
  if (!scripts.some((s) => /function draw\(/.test(s))) throw new Error("template renderer script is missing, copy assets/system-design.html and replace only DESIGN");
  return vm.runInNewContext(src + "\n;DESIGN", {}, { timeout: 1000 });
}

// Mirrors the layout maths in assets/system-design.html (pos, wirePath, label placement).
// Keep these constants in sync with the template.
const G = { NW: 216, NH: 112, CW: 300, RH: 136, TOP: 58, PADX: 20, CH: 20 };
G.GAP = G.CW - G.NW;
function labelCollisions(t, zoneIdx) {
  const { NW, NH, CW, RH, TOP, PADX, CH, GAP } = G;
  const byId = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
  const pos = (n) => ({ x: PADX + zoneIdx[n.zone] * CW + (CW - NW) / 2, y: TOP + n.row * RH });
  const edges = t.edges.filter((e) => byId[e.from] && byId[e.to]);
  const long = edges.filter((e) => Math.abs(zoneIdx[byId[e.from].zone] - zoneIdx[byId[e.to].zone]) > 1);
  const channelTop = TOP + Math.max(...t.nodes.map((n) => n.row)) * RH + NH + 28;
  const boxes = [];
  for (const e of edges) {
    if (!e.label) continue;
    const a = byId[e.from], b = byId[e.to], pa = pos(a), pb = pos(b), ca = zoneIdx[a.zone], cb = zoneIdx[b.zone];
    const txt = e.label.length > LIMITS.edgeLabel ? e.label.slice(0, LIMITS.edgeLabel - 1) + "…" : e.label;
    const tw = txt.length * 6.4 + 14;
    let lx, ly;
    if (ca === cb && Math.abs(a.row - b.row) > 1) { lx = pa.x + NW + 18 + 4 + tw / 2; ly = (pa.y + pb.y + NH) / 2; }
    else if (ca === cb) { const down = pb.y > pa.y; ly = ((down ? pa.y + NH : pa.y) + (down ? pb.y : pb.y + NH)) / 2; lx = pa.x + NW / 2 + 8 + tw / 2; }
    else {
      const right = cb > ca, x1 = right ? pa.x + NW : pa.x, x2 = right ? pb.x : pb.x + NW;
      if (Math.abs(cb - ca) === 1) { lx = (x1 + x2) / 2; ly = (pa.y + pb.y + NH) / 2; }
      else {
        const k = long.indexOf(e), off = (k % 4) * 6 - 9;
        lx = (x1 + (right ? GAP / 2 : -GAP / 2) + off + x2 + (right ? -GAP / 2 : GAP / 2) - off) / 2; ly = channelTop + k * CH;
      }
    }
    boxes.push({ name: `${e.from} -> ${e.to} "${e.label}"`, x: lx - tw / 2, y: ly - 10, w: tw, h: 20 });
  }
  const hit = (p, q) => p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;
  const out = [];
  for (const bx of boxes) for (const n of t.nodes) { const p = pos(n); if (hit(bx, { x: p.x, y: p.y, w: NW, h: NH })) out.push(`edge label ${bx.name} covers node ${n.id}, shorten it or move a node`); }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i], boxes[j])) out.push(`edge labels ${boxes[i].name} and ${boxes[j].name} overlap, drop or shorten one, or move a node`);
  return out;
}

function check(file) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
  const html = readFileSync(file, "utf8");
  let D;
  try { D = loadDesign(html); } catch (e) { return { errors: ["cannot read DESIGN: " + e.message], warnings }; }

  for (const k of ["title", "stack", "problem", "requirements", "profile", "zones", "load", "tiers"]) if (D[k] == null) err(`missing top-level field: ${k}`);
  if (errors.length) return { errors, warnings };

  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title) err("missing <title>");
  else if (title[1].trim() !== D.title) warn(`<title> "${title[1].trim()}" differs from DESIGN.title "${D.title}"`);

  const reqIds = new Set();
  for (const r of D.requirements) {
    if (!/^R\d+$/.test(r.id ?? "")) err(`requirement id "${r.id}" must look like R1`);
    if (reqIds.has(r.id)) err(`duplicate requirement id ${r.id}`);
    if (!r.text) err(`requirement ${r.id} has no text`);
    reqIds.add(r.id);
  }

  D.profile.forEach((p, i) => {
    for (const k of ["label", "value", "source", "drives"]) if (!p[k]) err(`profile[${i}] missing ${k}`);
    if (p.source && !SOURCES.test(p.source)) err(`profile "${p.label}" source "${p.source}" must start with repo, brief, user, inferred or unknown`);
  });

  const zoneIds = new Set();
  for (const z of D.zones) {
    if (!ZONES.has(z.id)) err(`zone id "${z.id}" must be one of ${[...ZONES].join(", ")} (labels are free text)`);
    if (zoneIds.has(z.id)) err(`duplicate zone ${z.id}`);
    if (!z.label) err(`zone ${z.id} has no label`);
    zoneIds.add(z.id);
  }
  const zoneIdx = Object.fromEntries(D.zones.map((z, i) => [z.id, i]));

  if (!Array.isArray(D.load.rows) || !D.load.rows.length) err("load.rows must be a non-empty array");
  if (!D.load.note) warn("load.note is empty, show the formula inputs");

  const tierIds = new Set(), seen = new Set();
  D.tiers.forEach((t, ti) => {
    const where = `tier ${t.id ?? ti}`;
    for (const k of ["id", "label", "short", "title", "summary", "nodes", "edges", "moves", "rejected"]) if (t[k] == null) err(`${where} missing ${k}`);
    if (tierIds.has(t.id)) err(`duplicate tier id ${t.id}`);
    tierIds.add(t.id);
    const vals = D.load.values?.[t.id];
    if (!Array.isArray(vals) || vals.length !== D.load.rows.length) err(`${where}: load.values.${t.id} needs ${D.load.rows.length} values`);
    if (!t.nodes || !t.edges) return;

    const ids = new Set(), cells = new Map();
    for (const n of t.nodes) {
      const at = `${where} node ${n.id}`;
      if (!n.id) err(`${where}: node without id`);
      if (ids.has(n.id)) err(`${at}: duplicate id`);
      ids.add(n.id);
      if (!n.label) err(`${at}: missing label`);
      else if (n.label.length > LIMITS.label) err(`${at}: label is ${n.label.length} chars, max ${LIMITS.label}`);
      if ((n.tech ?? "").length > LIMITS.tech) err(`${at}: tech is ${n.tech.length} chars, max ${LIMITS.tech}`);
      if (!ICONS.has(n.icon)) err(`${at}: unknown icon "${n.icon}"`);
      if (!zoneIds.has(n.zone)) err(`${at}: zone "${n.zone}" is not in DESIGN.zones`);
      if (!Number.isInteger(n.row) || n.row < 0 || n.row >= LIMITS.rows) err(`${at}: row must be an integer 0 to ${LIMITS.rows - 1}`);
      const cell = `${n.zone}:${n.row}`;
      if (cells.has(cell)) err(`${at}: overlaps ${cells.get(cell)} at ${cell}`);
      cells.set(cell, n.id);
      if (!STATUSES.has(n.status)) err(`${at}: status must be new, changed, same or removed`);
      if (ti === 0 && n.status !== "same") err(`${at}: every node in the first tier is "same"`);
      if (!Array.isArray(n.serves) || !n.serves.length) err(`${at}: serves must list at least one requirement`);
      else for (const r of n.serves) if (!reqIds.has(r)) err(`${at}: serves unknown requirement ${r}`);
      if (!n.role) err(`${at}: missing role`);
      const alt = n.alternatives;
      if (alt != null) {
        if (typeof alt === "string") { if (!alt.trim()) err(`${at}: alternatives string is empty, explain why there are none`); }
        else if (!Array.isArray(alt) || alt.some((a) => !a.what || !a.why)) err(`${at}: alternatives must be [{ what, why }] or a string explaining why there are none`);
      } else if (!seen.has(n.id)) err(`${at}: first appearance needs alternatives ([{ what, why }] or a string saying none were considered and why)`);
      seen.add(n.id);
      for (const k of ["specifics", "tradeoffs", "failures"]) if (n[k] != null && !Array.isArray(n[k])) err(`${at}: ${k} must be an array`);
      for (const f of n.failures ?? []) if (!f.mode || !f.mitigation) err(`${at}: each failure needs mode and mitigation`);
      if (n.cost && /\$/.test(n.cost) && !/est/i.test(n.cost)) warn(`${at}: cost "${n.cost}" should be labelled as an estimate`);
    }

    let long = 0;
    for (const e of t.edges) {
      if (!ids.has(e.from) || !ids.has(e.to)) { err(`${where}: edge ${e.from} -> ${e.to} references a missing node`); continue; }
      if (e.label && e.label.length > LIMITS.edgeLabel) err(`${where}: edge label "${e.label}" is over ${LIMITS.edgeLabel} chars`);
      const a = t.nodes.find((n) => n.id === e.from), b = t.nodes.find((n) => n.id === e.to);
      if (Math.abs(zoneIdx[a.zone] - zoneIdx[b.zone]) > 1) long++;
    }
    if (long > LIMITS.longEdges) warn(`${where}: ${long} edges skip a zone, reorder zones or rows to keep it to ${LIMITS.longEdges} or fewer`);
    if (!errors.length) for (const m of labelCollisions(t, zoneIdx)) err(`${where}: ${m}`);

    for (const m of t.moves ?? []) for (const k of ["what", "why", "driver", "trigger"]) if (!m[k]) err(`${where}: move "${m.what ?? "?"}" missing ${k}`);
    for (const r of t.rejected ?? []) if (!r.what || !r.why) err(`${where}: each rejected item needs what and why`);
    if (ti > 0 && !(t.rejected ?? []).length) warn(`${where}: no "considered and left out" items`);
  });

  return { errors, warnings };
}

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node scripts/check-design.mjs <page.html> [more.html ...]"); process.exit(2); }
let failed = false;
for (const f of files) {
  const { errors, warnings } = check(f);
  console.log(`${errors.length ? "FAIL" : "ok  "} ${f}  (${errors.length} errors, ${warnings.length} warnings)`);
  for (const e of errors) console.log("  error   " + e);
  for (const w of warnings) console.log("  warning " + w);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
