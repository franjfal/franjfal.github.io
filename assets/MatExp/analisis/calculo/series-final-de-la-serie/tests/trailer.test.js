// Trailer and score: the pictures and the sounds come from the series of each shot, so changing a
// parameter must move them, and the official values must keep the 112 s cut.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { load, ROOT } = require("./helpers");

function engines() {
  const { SF, M } = load();
  for (const f of ["sf-trailer.js", "sf-audio.js"]) {
    const p = path.join(ROOT, f);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return { SF, M, TR: globalThis.SFTrailer, A: globalThis.SFAudio };
}
const clone = (x) => JSON.parse(JSON.stringify(x));

test("the official cut lasts 112 s and every shot but the rope meets its rules", () => {
  const { SF, TR } = engines();
  const cfg = TR.defaultConfig(SF);
  assert.equal(TR.totalDuration(SF, cfg), 112);
  for (const id of ["S0", "S1", "S2", "S4", "S5", "S6"]) assert.ok(TR.checkShot(id, cfg.math[id]).ok, id);
  // m = 10 is the canon of the show; Oresme only guarantees arrival by minute 2^18, so team 3 must choose
  const s3 = TR.checkShot("S3", cfg.math.S3);
  assert.equal(s3.ok, false);
  assert.equal(s3.items.filter((i) => !i.ok).length, 1);
  assert.ok(TR.checkShot("S3", { c: 10, L: 70 }).ok);
});

test("the rhythm rescales every shot except the cold open, which the countdown fixes", () => {
  const { SF, TR } = engines();
  const cfg = TR.defaultConfig(SF);
  cfg.art.rhythm = 1.25;
  const tl = TR.timeline(SF, cfg);
  assert.equal(tl[0].dur, cfg.math.S0.T + 2);
  assert.ok(Math.abs(tl[2].dur - 14 / 1.25) < 1e-9);
  cfg.math.S0.T = 8;
  assert.equal(TR.timeline(SF, cfg)[0].dur, 10);
});

test("the echo rings sit at the partial sums of the geometric series and move with r", () => {
  const { TR, M } = engines();
  const a = TR.LISTS.S2({ a: 8, r: 0.6 }, 14, 14);
  assert.equal(a.limit, 20);
  a.rings.slice(0, 6).forEach((ring, k) => assert.ok(Math.abs(ring.x - M.geometric.partial(8, 0.6, k + 1)) < 1e-9));
  const b = TR.LISTS.S2({ a: 5, r: 0.75 }, 14, 14);
  assert.equal(b.limit, 20);
  assert.notDeepEqual(a.rings.slice(0, 3).map((r) => r.x), b.rings.slice(0, 3).map((r) => r.x));
  assert.ok(a.rings.every((r) => r.x < 20));
});

test("the countdown beeps are the terms t_n and stop at the frame resolution", () => {
  const { TR } = engines();
  const s0 = TR.LISTS.S0({ form: "R", T: 10, c: 6 }, 3, 12);
  assert.ok(Math.abs(s0.beeps[0] - 10 / 7) < 1e-9);
  assert.equal(s0.shown.length, 2);                 // 1.43 s and 2.5 s; 3.33 s is still to come
  for (let k = 1; k < s0.beeps.length; k++) assert.ok(s0.beeps[k] > s0.beeps[k - 1]);
  assert.ok(s0.beeps.every((b) => b < 10));
});

test("the score follows the same series as the pictures", () => {
  const { SF, TR, A, M } = engines();
  const cfg = TR.defaultConfig(SF);
  const ev = A.events(SF, cfg);
  for (let k = 1; k < ev.length; k++) assert.ok(ev[k].t >= ev[k - 1].t);
  const tl = TR.timeline(SF, cfg), seg = (id) => tl.find((s) => s.id === id);
  // S0: the first beeps sound at t_n = 10n/(n + 6)
  const beeps = ev.filter((e) => e.type === "beep" && e.t < seg("S0").t1).map((e) => e.t);
  [1, 2, 3].forEach((n) => assert.ok(beeps.some((t) => Math.abs(t - 10 * n / (n + 6)) < 1e-9), `beep ${n}`));
  // S5: one alarm, at the minute in which Sara's dose passes 2 (H_4 > 2)
  const alarms = ev.filter((e) => e.type === "alarm");
  assert.equal(alarms.length, 1);
  assert.equal(M.pseries.crossing(1, 1, 2, 100), 4);
  // S6: the tones alternate sides with the sign of the term and fade
  const tones = ev.filter((e) => e.type === "tone");
  assert.equal(tones.length, 14);
  tones.forEach((e, k) => assert.equal(Math.sign(e.pan), k % 2 ? -1 : 1));
  assert.ok(tones[13].gain < tones[0].gain);
  // a convergent dose for Sara silences the alarm
  const calm = clone(cfg);
  calm.math.S5.pS = 2;
  assert.equal(A.events(SF, calm).filter((e) => e.type === "alarm").length, 0);
});
