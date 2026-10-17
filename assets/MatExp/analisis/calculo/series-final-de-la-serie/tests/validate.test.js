// Validation engine: every exercise accepts its reference value, rejects known mistakes with
// specific feedback, and never accepts a written proof by itself.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers");
const { SF, V, E, M } = load();
const C = E.context(SF);

function sample(spec) {
  const exp = V.expected(SF, spec, C);
  const { R } = V.refs(SF, C);
  const ref = R[spec.ref] ? R[spec.ref](spec.arg) : null;
  switch (spec.type) {
    case "expression": return null;
    case "interval": return `${ref[0]}, ${ref[1]}`;
    case "clock": return exp;
    case "duration": return exp;
    case "choice": return ref;
    case "justification": return { criteria: spec.criteria, text: "Argumento escrito con suficiente detalle para revisar." };
    default: return String(typeof ref === "number" ? M.round(ref, 6) : ref);
  }
}

test("every answer has a reference and accepts it", () => {
  let n = 0;
  for (const d of SF.dossiers) for (const ex of d.exercises) for (const a of ex.answers) {
    const { R } = V.refs(SF, C);
    if (a.type !== "justification") assert.ok(R[a.ref], `missing reference ${a.ref} (${ex.id})`);
    const input = sample(a);
    if (input === null) continue;
    const r = V.check(SF, a, input, C);
    assert.ok(r.status === "correct" || r.status === "review", `${ex.id}/${a.key}: ${JSON.stringify(r)}`);
    n++;
  }
  assert.ok(n > 60);
});

test("expressions are checked as identities, not as strings", () => {
  const xn = { type: "expression", ref: "e2.xExpr" };
  for (const s of ["20(1-0.6^n)", "20 - 20*0.6^n", "8*(1-0.6^n)/(1-0.6)", "8(1-0,6^n)/0,4"]) assert.equal(V.check(SF, xn, s, C).status, "correct", s);
  assert.equal(V.check(SF, xn, "20*0.6^n", C).status, "incorrect");
  assert.equal(V.check(SF, xn, "20(1-0.6^", C).status, "invalid");
  const sn = { type: "expression", variable: "N", ref: "e4.SExpr" };
  assert.equal(V.check(SF, sn, "N/(N+1)", C).status, "correct");
  assert.equal(V.check(SF, { type: "expression", ref: "e1.gapExpr" }, "60/(n^2+3n+2)", C).status, "correct");
});

test("known mistakes get specific feedback", () => {
  const start = { type: "clock", ref: "render.start" };
  const naive = V.check(SF, start, "00:24:30", C);
  assert.equal(naive.status, "incorrect");
  assert.match(naive.message.es, /cuestan lo mismo/);
  const r = V.check(SF, { type: "number", ref: "leak.r", tol: 0.006 }, "1.64", C);
  assert.match(r.message.en, /divided positions/);
  assert.equal(V.check(SF, { type: "number", ref: "leak.r", tol: 0.006 }, "0,64", C).status, "correct");
  const claim = V.check(SF, { type: "choice", ref: "e3.claimTrue" }, "true", C);
  assert.match(claim.message.es, /H_n\/10/);
  assert.equal(V.check(SF, { type: "duration", ref: "render.duration" }, "2 h 47 min 30 s", C).status, "correct");
  assert.equal(V.check(SF, { type: "duration", ref: "render.duration" }, "2:47:30", C).status, "correct");
  assert.equal(V.check(SF, { type: "number", ref: "e4.S", arg: 6, decimals: 4 }, "6/7", C).status, "correct");
});

test("justifications: fallacies rejected, structure checked, text left to the teacher", () => {
  const spec = { type: "justification", criteria: ["necessary-not-sufficient"] };
  assert.equal(V.check(SF, spec, { criteria: ["necessary-not-sufficient", "terms-imply"], text: "x".repeat(40) }, C).status, "incorrect");
  assert.equal(V.check(SF, spec, { criteria: [], text: "La serie armónica diverge aunque los términos tiendan a cero." }, C).status, "incorrect");
  assert.equal(V.check(SF, spec, { criteria: ["necessary-not-sufficient"], text: "ok" }, C).status, "incorrect");
  assert.equal(V.check(SF, spec, { criteria: ["necessary-not-sufficient"], text: "Los términos tienden a cero pero la armónica diverge." }, C).status, "review");
  // keyword stuffing is not accepted as a proof: without the structured argument it fails
  assert.notEqual(V.check(SF, spec, { criteria: [], text: "diverge diverge Oresme armónica necesario suficiente" }, C).status, "correct");
  const opts = V.optionsFor({ criteria: ["leibniz"] });
  assert.ok(opts.some((o) => o.id === "leibniz") && opts.length === 3);
});

test("number parsing", () => {
  assert.equal(V.parseNumber("0,64"), 0.64);
  assert.equal(V.parseNumber("6/7"), 6 / 7);
  assert.equal(V.parseNumber(" 12 367 "), 12367);
  assert.equal(V.parseClock("22.25"), 22 * 3600 + 25 * 60);
  assert.deepEqual(V.parseInterval("(7,75 ; 8,84)"), [7.75, 8.84]);
  assert.equal(V.parseDuration("10050"), 10050);
});
