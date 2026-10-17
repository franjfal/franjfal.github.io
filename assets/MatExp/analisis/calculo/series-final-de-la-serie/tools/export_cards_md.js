#!/usr/bin/env node
/*
 * Calculus Cases · Case 7 · The Series Finale — export the private role cards as Markdown.
 *
 * The cards live in data/sf-private.js; this tool prints them with the tokens of a configuration
 * filled in, so the design documents of the book never drift from what the generator prints.
 *
 *   node tools/export_cards_md.js [--lang es|en] [--out FILE]
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { load } = require("../tests/helpers.js");

const args = process.argv.slice(2);
const opt = (name, def) => { const k = args.indexOf(name); return k >= 0 ? args[k + 1] : def; };
const lang = opt("--lang", "es");
const out = opt("--out", null);

const { SF } = load();
require(path.join(__dirname, "..", "sf-build.js"));
const B = globalThis.SFBuild;
const cfg = B.normalize(Object.assign({}, B.DEFAULT, { lang }));
const ctx = B.context(cfg, null);
const E = globalThis.SFEvidence;
const tr = (v) => (v && typeof v === "object" && "es" in v ? v[lang] : v);
const fill = (s) => E.fill(String(tr(s)), ctx.tokens, lang);

const L = lang === "es" ? {
  title: "Caso 7 · El final de la serie — Fichas de personajes",
  intro: "Exportadas de `data/sf-private.js` con la configuración por defecto del generador (`tools/export_cards_md.js`). Son las fichas privadas que reciben los cinco sospechosos; el docente no las reparte nunca al resto del grupo.",
  common: "Reglas comunes", who: "Quién eres", goal: "Tu objetivo", knows: "Lo que sabes", night: "Tu noche", secret: "Tu secreto",
  lies: "Tus mentiras", reveal: "Cuándo lo cuentas", docs: "Documentos que llevas", math: "Las matemáticas que defiendes", eps: "Episodios",
  qa: "Preguntas probables", conf: "Declaración final (solo si te acorralan)", guilty: "CULPABLE", profile: "Perfil público",
} : {
  title: "Case 7 · The Series Finale — Character cards",
  intro: "Exported from `data/sf-private.js` with the generator's default configuration (`tools/export_cards_md.js`). These are the private cards the five suspects receive; the teacher never hands them to the rest of the class.",
  common: "Common rules", who: "Who you are", goal: "Your goal", knows: "What you know", night: "Your night", secret: "Your secret",
  lies: "Your lies", reveal: "When you tell", docs: "Documents you carry", math: "The mathematics you defend", eps: "Episodes",
  qa: "Likely questions", conf: "Final statement (only if cornered)", guilty: "GUILTY", profile: "Public profile",
};

const lines = [`# ${L.title}`, "", L.intro, "", `## ${L.common}`, ""];
tr(SF.cards.common.rules).forEach((r) => lines.push(`- ${fill(r)}`));
const suspects = SF.people.suspects;
const ids = Array.isArray(suspects) ? suspects.map((s) => s.id) : Object.keys(suspects);
const pub = (id) => (Array.isArray(suspects) ? suspects.find((s) => s.id === id) : suspects[id]) || {};
ids.forEach((id) => {
  const c = SF.cards[id], p = pub(id);
  if (!c) return;
  lines.push("", `## ${tr(p.name) || id}${c.guilty ? ` · **${L.guilty}**` : ""}`, "");
  if (p.role) lines.push(`*${tr(p.role)}*`, "");
  if (p.profile) lines.push(`**${L.profile}.** ${fill(p.profile)}`, "");
  lines.push(`**${L.who}.** ${fill(c.whoYouAre)}`, "", `**${L.goal}.** ${fill(c.goal)}`, "");
  const list = (head, v) => { const a = tr(v); if (!a || !a.length) return; lines.push(`### ${head}`, ""); a.forEach((x) => lines.push(`- ${fill(x)}`)); lines.push(""); };
  list(L.knows, c.knows);
  if (c.night && c.night.length) { lines.push(`### ${L.night}`, "", "| | |", "|---|---|"); c.night.forEach(([t, x]) => lines.push(`| ${fill(t)} | ${fill(x)} |`)); lines.push(""); }
  lines.push(`### ${L.secret}`, "", fill(c.secret), "");
  list(L.lies, c.lies);
  list(L.reveal, c.reveal);
  if (c.documents && c.documents.length) { lines.push(`### ${L.docs}`, ""); c.documents.forEach((d) => lines.push(`- **${fill(d.title)}.** ${fill(d.text)}`)); lines.push(""); }
  if (c.math) { lines.push(`### ${L.math} (${L.eps} ${c.math.episodes.join(", ")})`, ""); tr(c.math.explain).forEach((x) => lines.push(`- ${fill(x)}`)); lines.push(""); }
  const qa = tr(c.qa);
  if (qa && qa.length) { lines.push(`### ${L.qa}`, "", "| | |", "|---|---|"); qa.forEach(([q, a]) => lines.push(`| ${fill(q)} | ${fill(a).replace(/\|/g, "\\|")} |`)); lines.push(""); }
  if (c.confession) lines.push(`### ${L.conf}`, "", `> ${fill(c.confession)}`, "");
});
const md = lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
if (out) fs.writeFileSync(out, md); else process.stdout.write(md);
