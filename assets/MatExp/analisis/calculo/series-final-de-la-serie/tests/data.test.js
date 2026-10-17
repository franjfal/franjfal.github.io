// Case data: bilingual completeness, tokens, consistency of the narrative with the engine and
// separation of public and confidential information.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { load, pairs, ROOT } = require("./helpers");

test("every text exists in both languages", () => {
  const { SF } = load();
  const bad = pairs(SF).filter(({ v }) => {
    const ok = (x) => (Array.isArray(x) ? x.length > 0 : typeof x === "string" && x.trim().length > 0);
    return !ok(v.es) || !ok(v.en) || (Array.isArray(v.es) && v.es.length !== v.en.length);
  });
  assert.deepEqual(bad.map((b) => b.at), []);
});

test("every token used in the texts can be filled", () => {
  const { SF, E } = load();
  const C = E.context(SF);
  const known = new Set(Object.keys(C.tokens).concat(["D0weekday", "D1weekday", "D0date", "D1date", "forum", "leakTime"]));
  const used = new Set();
  JSON.stringify(SF).replace(/\{([A-Za-z][A-Za-z0-9]{3,})\}/g, (m, k) => { used.add(k); return m; });
  assert.deepEqual([...used].filter((k) => !known.has(k)), []);
});

test("narrative numbers agree with the engine", () => {
  const { SF, M } = load();
  const txt = JSON.stringify(SF);
  assert.equal(M.harmonic.arrival(10), 12367);
  assert.ok(txt.includes("12 367"));
  assert.equal(M.telescoping.observationsFromFinal(0.004), 249);
  assert.equal(M.arithmetic.sum(6, 4, 10), 240);
  assert.equal(M.pseries.crossing(1, 1, 2), 4);
  assert.equal(M.pseries.crossing(1, 1.5, 2), 11);
  assert.ok(Math.abs(12 * Math.LN2 - 8.3) < 0.02, "alcove at 8.3 m");
  assert.equal(SF.investigation.corridor.built, M.geometric.sum(8, 0.6));
  assert.equal(SF.show.episodes.length, 6);
  assert.equal(SF.dossiers.length, 6);
  assert.deepEqual(SF.trailer.segments.map((s) => s.id), ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
  assert.equal(SF.trailer.segments[SF.trailer.segments.length - 1].end, SF.trailer.duration);
  assert.ok(SF.trailer.duration >= 90 && SF.trailer.duration <= 150);
});

test("public data reveals neither the culprit nor the finale nor the envelope", () => {
  const { SF } = load({ privateData: false });
  const txt = JSON.stringify(SF);
  assert.equal(SF.finale, undefined);
  assert.equal(SF.cards, undefined);
  assert.equal(SF.envelope, undefined);
  assert.equal(SF.solution, undefined);
  for (const secret of ["LEO ES EL OBSERVADOR", "LEO IS THE OBSERVER", "Casa Lumbre", "Aquiles_77 publicó", "culprit", "culpable"]) assert.ok(!txt.includes(secret), secret);
  const pub = fs.readFileSync(path.join(ROOT, "data/sf-public.js"), "utf8") + fs.readFileSync(path.join(ROOT, "data/sf-episodes.js"), "utf8");
  assert.ok(!/holder:\s*"suite"/.test(pub), "the watermark table must stay in the envelope");
});

test("the cards follow the case: who received v2, who knew the watermarks", () => {
  const { SF } = load();
  const v2 = SF.envelope.distribution.find((d) => d.id === "v2").recipients;
  assert.deepEqual(v2.sort(), SF.solution.v2.slice().sort());
  assert.ok(SF.cards.elias.guilty && !SF.cards.vera.guilty && !SF.cards.alex.guilty);
  assert.equal(Object.values(SF.cards).filter((c) => c.guilty).length, 1);
  for (const id of ["vera", "hugo", "nadia", "elias", "alex"]) {
    const c = SF.cards[id];
    for (const k of ["whoYouAre", "knows", "night", "secret", "reveal", "math", "qa", "goal"]) assert.ok(c[k], `${id}.${k}`);
  }
});
