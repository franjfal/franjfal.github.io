// Mathematical engine: closed forms against term-by-term sums, convergence criteria, bounds and
// the creative-challenge checks. Run with: node --test tests/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers");
const { M } = load();

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test("arithmetic: closed sum equals term-by-term sum", () => {
  for (const [a, d, n] of [[6, 4, 10], [12, 0.25, 240], [-3, 2.5, 17], [5, 0, 9]]) close(M.arithmetic.sum(a, d, n), M.arithmetic.sumTermwise(a, d, n));
  assert.equal(M.arithmetic.sum(6, 4, 10), 240);
  assert.equal(M.arithmetic.term(6, 4, 10), 42);
});

test("arithmetic: the 14 camera networks of 240", () => {
  const s = M.arithmetic.solutions(240);
  assert.equal(s.length, 14);
  for (const { a, d, n } of s) assert.equal(M.arithmetic.sum(a, d, n), 240);
  assert.ok(s.some((x) => x.a === 6 && x.d === 4 && x.n === 10));
  assert.ok(M.arithmetic.check({ a: 6, d: 4, n: 10 }).ok);
  assert.ok(!M.arithmetic.check({ a: 6, d: 4, n: 9 }).ok, "216 cameras must fail");
  assert.ok(!M.arithmetic.check({ a: 2.5, d: 4, n: 10 }).ok, "fractional cameras must fail");
});

test("countdown: monotone, bounded, beeps before tau", () => {
  const p = { form: "R", T: 60, c: 1 };
  for (let n = 1; n < 500; n++) { assert.ok(M.countdown.t(p, n + 1) > M.countdown.t(p, n)); assert.ok(M.countdown.t(p, n) < 60); }
  assert.equal(M.countdown.countBefore(p, 59), 58);
  assert.equal(M.countdown.countBefore(p, 59.9), 598);
  assert.equal(M.countdown.countBefore(p, 60), Infinity);
  close(M.countdown.gap(p, 1), 10);
  close(M.countdown.gap(p, 4), 2);
  // brute-force count agrees with the closed form for both families
  for (const q of [{ form: "R", T: 10, c: 6.5 }, { form: "G", T: 10, q: 0.85 }, { form: "G", T: 10, q: 0.9 }]) {
    const brute = Array.from({ length: 1000 }, (_, k) => M.countdown.t(q, k + 1)).filter((v) => v < 5).length;
    assert.equal(M.countdown.countBefore(q, 5), brute);
  }
  assert.ok(M.countdown.check({ form: "R", T: 10, c: 6 }).ok);
  assert.ok(!M.countdown.check({ form: "R", T: 10, c: 3 }).ok, "3 beeps is too few");
  assert.ok(!M.countdown.check({ form: "R", T: 12, c: 6 }).ok, "limit must be 10");
  assert.ok(!M.countdown.check({ form: "G", T: 10, q: 1.2 }).ok, "q must be in (0, 1)");
});

test("geometric: partial sums, sum only when |r| < 1", () => {
  close(M.geometric.partial(8, 0.6, 5), 18.4448);
  assert.equal(M.geometric.sum(8, 0.6), 20);
  assert.equal(M.geometric.sum(8, 1), null);
  assert.equal(M.geometric.sum(8, 1.3), null);
  assert.equal(M.geometric.sum(8, -1), null);
  close(M.geometric.sum(8, -0.5), 16 / 3);
  assert.equal(M.geometric.partial(8, 1, 7), 56);
  assert.equal(M.geometric.firstWithin(8, 0.6, 0.1), 11);
  const est = M.geometric.ratioFromPositions([7.2, 11.81, 14.76, 16.64, 17.85]);
  assert.ok(Math.abs(est.mean - 0.64) < 0.006);
  assert.ok(M.geometric.check({ a: 8, r: 0.6 }).ok);
  assert.ok(M.geometric.check({ a: 4, r: 0.8 }).ok);
  assert.ok(!M.geometric.check({ a: 8, r: 0.5 }).ok, "sum 16 != 20");
  const bad = M.geometric.check({ a: 0, r: 1 });
  assert.ok(!bad.ok);
  assert.ok(/no converge|does not converge/.test(bad.items[0].detail.es + bad.items[0].detail.en));
});

test("harmonic: Oresme bounds and the known arrival table", () => {
  for (let k = 0; k <= 17; k++) assert.ok(M.harmonic.H(2 ** k) >= 1 + k / 2 - 1e-12);
  for (let k = 1; k <= 17; k++) assert.ok(M.harmonic.H(2 ** k - 1) <= k + 1e-12);
  const table = [1, 2, 4, 11, 31, 83, 227, 616, 1674, 4550, 12367]; // OEIS A002387
  for (let m = 2; m <= 10; m++) assert.equal(M.harmonic.arrival(m), table[m], `m = ${m}`);  // H_n is never an integer for n > 1
  assert.equal(M.harmonic.arrival(10), 12367);
  assert.equal(M.harmonic.earliestProved(10), 1024);
  assert.equal(M.harmonic.latestProved(10), 262144);
  assert.ok(M.harmonic.arrival(10) >= M.harmonic.earliestProved(10) && M.harmonic.arrival(10) <= M.harmonic.latestProved(10));
  assert.ok(M.harmonic.check({ c: 10, L: 60 }).ok);
  assert.ok(M.harmonic.check({ c: 10, L: 75 }).ok);
  assert.ok(!M.harmonic.check({ c: 10, L: 80 }).ok, "m = 8: the Oresme bound gives 2^14 > 12960");
  assert.ok(!M.harmonic.check({ c: 10, L: 50 }).ok, "m = 5: arrival in the first hour cannot be excluded");
  for (const m of [6, 7, 7.5]) { const N = M.harmonic.arrival(m); assert.ok(N >= M.harmonic.earliestProved(m) && N <= M.harmonic.latestProved(m)); }
});

test("telescoping: identity, sum, counterexample", () => {
  const p = { form: "H", A: 1, m: 0 };
  for (let N = 1; N < 300; N++) close(M.telescoping.partial(p, N), M.telescoping.partialTermwise(p, N));
  assert.equal(M.telescoping.total(p), 1);
  assert.equal(M.telescoping.observationsFromFinal(0.004), 249);
  const bk = { form: "H", A: 1, m: 0 };
  close(M.telescoping.entry(bk, 3), 1 / 12);
  assert.ok(M.telescoping.check({ form: "H", A: 1, m: 0 }).ok);
  assert.ok(M.telescoping.check({ form: "H", A: 2, m: 1 }).ok);
  assert.ok(!M.telescoping.check({ form: "H", A: 1, m: 2 }).ok, "m = 2 reveals less than 80% in 9 entries");
  assert.ok(M.telescoping.check({ form: "G", A: 1, q: 0.8 }).ok);
  assert.ok(!M.telescoping.check({ form: "G", A: 1, q: 0.9 }).ok);
});

test("p-series: crossings, bounds and the three classifications", () => {
  assert.equal(M.pseries.crossing(1, 1, 2), 4);
  assert.equal(M.pseries.crossing(1, 1.5, 2), 11);
  assert.equal(M.pseries.crossing(1, 2, 2, 20000), null);
  for (let n = 2; n < 3000; n++) assert.ok(M.pseries.partial(1, 2, n) < 2 - 1 / n + 1e-12);
  close(M.pseries.condensationBound(1, 2), 2);
  close(M.pseries.condensationBound(1, 1.5), 1 / (1 - Math.SQRT1_2));
  assert.equal(M.pseries.proveBelow(1, 2, 2).method, "telescoping");
  assert.equal(M.pseries.proveBelow(0.8, 2.5, 2).method, "telescoping");
  assert.equal(M.pseries.proveBelow(1, 1.5, 2).reason, "false");
  assert.equal(M.pseries.proveBelow(1, 1, 2).reason, "diverges");
  const r18 = M.pseries.proveBelow(1, 1.8, 2);
  assert.ok(r18.proved && r18.method === "refined", "p = 1.8 needs the refined bound");
  const r175 = M.pseries.proveBelow(1, 1.75, 2);
  assert.ok(r175.proved || r175.reason === "true-unproved");
  // proved bounds are real upper bounds
  for (const p of [1.6, 1.8, 2, 2.5, 3]) for (const N of [5, 20, 100]) assert.ok(M.pseries.refinedBound(1, p, N) >= M.pseries.partial(1, p, 50000));
  assert.ok(M.pseries.check({ D: 1, pS: 1, pI: 2 }).ok);
  assert.ok(M.pseries.check({ D: 0.8, pS: 0.9, pI: 2.5 }).ok);
  const v2 = M.pseries.check({ D: 1, pS: 1, pI: 1.5 });
  assert.ok(!v2.ok && v2.ireneCross === 11);
});

test("alternating: Leibniz brackets, certificates, classification", () => {
  const p = { form: "P", L: 12, s: 1 };
  const S = M.alternating.positions(p, 12);
  assert.deepEqual(S.slice(0, 6).map((x) => Math.round(x * 10) / 10), [12, 6, 10, 7, 9.4, 7.4]);
  for (let n = 1; n < 200; n++) { const [a, b] = M.alternating.bracket(p, n); assert.ok(a < 12 * Math.LN2 && 12 * Math.LN2 < b); }
  assert.equal(M.alternating.swingsForError(p, 0.5), 23);
  assert.ok(M.alternating.pathDiverges(p));
  assert.ok(!M.alternating.pathDiverges({ form: "P", L: 12, s: 2 }));
  close(M.alternating.exactSum({ form: "G", L: 10, r: 0.25 }), 8);
  const cert = M.alternating.certify(p, 6, 10);
  assert.ok(cert && cert.bracket[0] >= 6 && cert.bracket[1] <= 10);
  assert.ok(M.alternating.check(p).ok);
  assert.ok(M.alternating.check({ form: "P", L: 13, s: 0.8 }).ok);
  assert.ok(!M.alternating.check({ form: "P", L: 12, s: 2 }).ok, "finite path breaks the scene");
  assert.ok(!M.alternating.check({ form: "P", L: 16, s: 1 }).ok, "first swing over 14 m");
  const amp = M.alternating.amplitudeFromPositions([{ n: 5, x: 11.75 }, { n: 6, x: 9.25 }, { n: 9, x: 11.18 }, { n: 10, x: 9.68 }]);
  assert.ok(Math.abs(amp.mean - 15) < 0.02);
});

test("time helpers", () => {
  assert.equal(M.parseHMS("38:50:35"), 38 * 3600 + 50 * 60 + 35);
  assert.equal(M.hms(10050), "2:47:30");
  assert.equal(M.hms(-5700, { clock: true }), "22:25:00");
});
