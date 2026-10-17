// Packages: what the teacher exports and the students import. A student package must never carry
// the envelope, the cards or the solution; a round trip must keep the configuration and the evidence.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { load, ROOT } = require("./helpers");

function build() {
  const all = load();
  const p = path.join(ROOT, "sf-build.js");
  delete require.cache[require.resolve(p)];
  require(p);
  return Object.assign(all, { B: globalThis.SFBuild });
}

test("a student package carries no confidential data", () => {
  const { B, SF } = build();
  const pkg = B.exportPackage(B.DEFAULT, "student");
  assert.equal(pkg.audience.student, true);
  assert.equal(pkg.envelope, undefined);
  assert.equal(pkg.teacher, undefined);
  const text = JSON.stringify(pkg);
  for (const secret of ["elias", "Aquiles_77", "Casa Lumbre", SF.cards.elias.confession.es.slice(0, 30)]) assert.ok(!text.includes(secret), secret);
});

test("the envelope and teacher packages are marked confidential and nest correctly", () => {
  const { B } = build();
  const env = B.exportPackage(B.DEFAULT, "envelope");
  assert.ok(env.envelope && !env.teacher && env.audience.confidential);
  const tch = B.exportPackage(B.DEFAULT, "teacher");
  assert.ok(tch.envelope && tch.teacher && tch.audience.confidential);
  assert.equal(tch.teacher.solution.culprit, "elias");
});

test("a package survives the round trip with its evidence", () => {
  const { B } = build();
  const cfg = B.normalize({ students: 14, night: "2027-03-02", investigation: { render: { finish: "01:20:00" }, suiteRatio: 0.66 } });
  const back = B.importPackage(JSON.stringify(B.exportPackage(cfg, "student")));
  assert.equal(back.ok, true);
  assert.deepEqual(back.warnings, []);
  assert.equal(back.cfg.students, 14);
  assert.deepEqual(back.cfg.episodes, [1, 4, 5]);
  assert.equal(back.cfg.night, "2027-03-02");
  assert.equal(back.cfg.investigation.render.finish, "01:20:00");
  assert.equal(back.context.tokens.renderFinish, "01:20:00");
  assert.equal(back.context.tokens.leakR, "0.66");
});

test("foreign, broken or future files are refused with a reason", () => {
  const { B } = build();
  assert.equal(B.importPackage("{not json").ok, false);
  assert.equal(B.importPackage(JSON.stringify({ format: "calculus-cases/delta-city" })).ok, false);
  const future = B.exportPackage(B.DEFAULT, "student");
  future.version = 2;
  assert.equal(B.importPackage(future).ok, false);
  const older = B.exportPackage(B.DEFAULT, "student");
  older.dataVersion = "0.9.0";
  const r = B.importPackage(older);
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 1);
});
