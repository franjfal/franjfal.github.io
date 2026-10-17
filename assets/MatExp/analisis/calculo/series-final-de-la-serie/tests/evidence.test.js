// Evidence engine: the numbers printed in the exhibits, the consistency of the timeline, the
// teacher's configuration checks and the uniqueness of the culprit.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers");
const { SF, E } = load();

test("default exhibits match the values used in the book", () => {
  const C = E.context(SF);
  assert.equal(C.render.seconds, 10050);
  assert.equal(C.tokens.renderStart, "22:25:00");
  assert.equal(C.tokens.renderNaiveStart, "00:24:30");
  assert.equal(C.tokens.renderLastStart, "20:25:30");
  assert.equal(C.tokens.renderLast, "71.75");
  assert.equal(C.tokens.journalListed, "36:00:35");
  assert.equal(C.tokens.journalMissing, "2:50:00");
  assert.equal(C.tokens.journalTotal, "38:50:35");
  assert.equal(C.tokens.journalTotal, SF.investigation.journal.total, "stored journal total agrees with the derived one");
  assert.equal(C.tokens.journalOpen, "22:24:00");
  assert.equal(C.tokens.journalClose, "01:14:00");
  assert.deepEqual(C.leak.printed, [7.2, 11.81, 14.76, 16.64, 17.85]);
  assert.ok(Math.abs(C.leak.rEstimate - 0.64) < 0.006);
  assert.deepEqual(C.altS5.readings.map((x) => x.value), [1, 1.354, 1.671, 1.927, 2.023]);
  assert.ok(Math.abs(C.altS5.pEstimate - 1.5) < 0.01);
  assert.deepEqual(C.altS6.positions.map((x) => x.x), [11.75, 9.25, 11.18, 9.68]);
  assert.deepEqual(C.altS6.bracket, [9.68, 11.18]);
  assert.ok(C.altS6.bracket[0] > 8.32, "the alternative beacon cannot settle in the 8.3 m alcove");
});

test("timeline: the deleted session contains the render and follows the last listed save", () => {
  const C = E.context(SF);
  assert.ok(C.journal.open < C.render.start && C.render.finish <= C.journal.close);
  assert.ok(C.journal.lastListed < C.journal.open);
  const elias = E.nightSeconds("21:58"), hugo = E.nightSeconds("00:15");
  assert.ok(C.journal.open > elias && C.render.start < hugo);
  assert.ok(C.render.naiveStart >= hugo && C.render.naiveStart <= E.nightSeconds("00:32"), "the naive estimate lands in Hugo's visit");
});

test("the solution is unique and the naive estimate points to an innocent", () => {
  const U = E.uniqueCulprit(SF);
  assert.deepEqual(U.opportunity, ["elias"]);
  assert.deepEqual(U.version.sort(), ["elias", "nadia", "vera"]);
  assert.ok(U.unique);
  assert.ok(U.naive.includes("hugo"));
  assert.ok(!SF.solution.v2.includes("hugo"), "the version evidence clears Hugo even after a wrong time");
});

test("teacher configuration: default valid, coherent changes accepted, breaking ones refused", () => {
  const ok = E.checkConfig(SF);
  assert.ok(ok.ok, JSON.stringify(ok.errors));
  assert.equal(ok.warnings.length, 0);
  // a shorter profile moves the start later: still consistent (journal follows), trap may weaken
  const later = E.checkConfig(SF, { render: { first: 10, step: 0.2 } });
  assert.ok(later.ok, JSON.stringify(later.errors));
  // starting before Elías arrives breaks the case
  const early = E.checkConfig(SF, { render: { first: 30, step: 0.5 } });
  assert.ok(!early.ok);
  // starting after Hugo's arrival breaks uniqueness
  const tooLate = E.checkConfig(SF, { render: { first: 2, step: 0.01 } });
  assert.ok(!tooLate.ok);
  // finishing after the last save is impossible
  const afterSave = E.checkConfig(SF, { render: { finish: "01:20:00" } });
  assert.ok(!afterSave.ok);
  // watermark ratios too close to tell apart
  const copies = SF.envelope.canary.copies.map((c) => Object.assign({}, c));
  copies[1].r = 0.62;
  assert.ok(!E.checkConfig(SF, { canary: copies, leakR: 0.64 }).ok);
  // a permuted but well-separated table is fine
  const perm = SF.envelope.canary.copies.map((c, k) => Object.assign({}, c, { r: [0.7, 0.67, 0.64, "leak", 0.58, 0.55][k] }));
  assert.ok(E.checkConfig(SF, { canary: perm, leakR: 0.61 }).ok);
});

test("tokens are filled in both languages", () => {
  const C = E.context(SF);
  assert.equal(E.fill("{renderDuration} · {renderStart}", C.tokens, "es"), "2 h 47 min 30 s · 22:25:00");
  assert.equal(E.fill("{unknown}", C.tokens, "en"), "{unknown}");
});
