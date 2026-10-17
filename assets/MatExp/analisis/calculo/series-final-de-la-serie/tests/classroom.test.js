// The class from its number of students: groups of two to five, one episode each (1 and 5 always),
// five suspects (pairs from 31 students on); and the exercises of each level.
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

test("every class size gives valid groups, with episodes 1 and 5", () => {
  const { B } = build();
  for (let n = 9; n <= 40; n++) {
    const c = B.classroom(n);
    const eps = c.groups.map((g) => g.episode);
    assert.ok(eps.includes(1) && eps.includes(5), `${n}: ${eps}`);
    assert.equal(c.groups.reduce((s, g) => s + g.size, 0) + c.suspects, n);
    c.groups.forEach((g) => assert.ok(g.size >= 2 && g.size <= 5, `${n}: group of ${g.size}`));
    assert.equal(c.suspects, n >= 31 ? 10 : 5);
    assert.equal(new Set(eps).size, eps.length);
  }
  assert.deepEqual(B.classroom(25).groups.map((g) => g.episode), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(B.classroom(9).groups.map((g) => g.episode), [1, 5]);
});

test("the configuration follows the number of students", () => {
  const { B } = build();
  const cfg = B.normalize({ students: 15 });
  assert.deepEqual(cfg.episodes, [1, 4, 5]);
  assert.equal(cfg.teams, 3);
  assert.equal(B.normalize({ students: 3 }).students, 9);
  assert.equal(B.normalize({}).level, "B");
});

test("the levels nest and always carry the forensic exercise", () => {
  const { B, SF } = build();
  SF.dossiers.forEach((D) => {
    const [b, e, a] = ["B", "E", "A"].map((l) => B.exercisesFor(D, l).map((x) => x.id));
    assert.ok(b.every((x) => e.includes(x)) && e.every((x) => a.includes(x)), `episode ${D.episode}`);
    assert.equal(a.length, D.exercises.length);
    const star = D.exercises.find((x) => x.evidence).id;
    assert.ok(b.includes(star));
    (D.core || []).concat(D.ext || []).forEach((id) => assert.ok(D.exercises.some((x) => x.id === id), `${id} exists`));
  });
});

test("the culprit does not depend on how many groups there are", () => {
  const { B, E, SF } = build();
  for (const n of [9, 15, 25, 40]) {
    const u = E.uniqueCulprit(SF, { render: B.normalize({ students: n }).investigation.render });
    assert.deepEqual(u.culprits, ["elias"]);
  }
});
