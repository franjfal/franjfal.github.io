/*
 * Calculus Cases · Case 7 · The Series Finale — mathematical engine.
 *
 * Parametrised families of sequences and series, with exactly what this chapter can prove:
 * closed forms, convergence criteria, bounds obtained by grouping (Oresme, condensation),
 * telescoping comparisons and the alternating series test. Every result carries a status:
 *   "exact"   closed formula or rational value,
 *   "proved"  inequality that follows from an argument available at this level,
 *   "computed" finite sum evaluated numerically (for example, the arrival minute 12 367),
 *   "known"   a value quoted from outside the chapter (π²/6, ln 2), never used to conclude.
 * A finite simulation is never reported as a proof of convergence or divergence.
 *
 * No DOM: the same file runs in the browser (window.SFMath) and in Node (module.exports).
 */
(function (root) {
  "use strict";

  const L = (es, en) => ({ es, en });
  const EPS = 1e-12;

  // ------------------------------------------------------------------------------ utilities
  function round(x, d) {
    const f = Math.pow(10, d);
    return Math.round((x + Math.sign(x) * 1e-12) * f) / f;
  }
  function fmt(x, d = 3) {
    if (!isFinite(x)) return x > 0 ? "∞" : "−∞";
    const r = round(x, d);
    return (r < 0 ? "−" : "") + String(Math.abs(r));
  }
  /** "1:12:30", "22:25", "38:50:35" -> seconds (hours may exceed 24). */
  function parseHMS(s) {
    const parts = String(s).trim().split(":").map(Number);
    if (parts.some((v) => !isFinite(v))) return NaN;
    while (parts.length < 3) parts.push(0);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  function hms(sec, { clock = false } = {}) {
    let s = Math.round(sec);
    if (clock) s = ((s % 86400) + 86400) % 86400;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return `${clock ? String(h).padStart(2, "0") : h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  function item(id, ok, label, detail, kind = "exact") {
    return { id, ok: !!ok, label, detail: detail || null, kind };
  }
  function verdict(items, extra = {}) {
    return Object.assign({ ok: items.every((i) => i.ok), items }, extra);
  }

  // ------------------------------------------------------------------- 1. arithmetic progression
  const arithmetic = {
    term: (a, d, k) => a + (k - 1) * d,
    sum: (a, d, n) => (n * (2 * a + (n - 1) * d)) / 2,
    sumTermwise(a, d, n) { let s = 0; for (let k = 1; k <= n; k++) s += a + (k - 1) * d; return s; },
    /** All (a, d, n) with integer a >= aMin, integer d >= dMin, n >= nMin and sum = total. */
    solutions(total, { aMin = 4, dMin = 1, nMin = 6, nMax = 60 } = {}) {
      const out = [];
      for (let n = nMin; n <= nMax; n++) {
        if ((2 * total) % n) continue;
        const twoA = (2 * total) / n;                // 2a + (n-1)d = 2·total/n
        for (let d = dMin; (n - 1) * d <= twoA - 2 * aMin; d++) {
          const rest = twoA - (n - 1) * d;
          if (rest % 2 === 0 && rest / 2 >= aMin) out.push({ a: rest / 2, d, n });
        }
      }
      return out;
    },
    /** S1 of the trailer: the camera rings. */
    check({ a, d, n }, c = {}) {
      const total = c.total ?? 240, nMin = c.nMin ?? 6, aMin = c.aMin ?? 4;
      const isInt = (v) => Number.isInteger(v);
      const s = this.sum(a, d, n);
      const items = [
        item("int", isInt(a) && isInt(d) && isInt(n), L("Números enteros de cámaras y de anillos", "Whole numbers of cameras and rings"),
          L("Cada anillo tiene un número entero de cámaras.", "Each ring holds a whole number of cameras.")),
        item("total", Math.abs(s - total) < EPS, L(`Total de ${total} cámaras`, `${total} cameras in total`),
          L(`Con a = ${a}, d = ${d}, n = ${n}: S = n(2a + (n − 1)d)/2 = ${fmt(s)}.`, `With a = ${a}, d = ${d}, n = ${n}: S = n(2a + (n − 1)d)/2 = ${fmt(s)}.`)),
        item("rings", n >= nMin, L(`Al menos ${nMin} anillos`, `At least ${nMin} rings`)),
        item("first", a >= aMin, L(`Al menos ${aMin} cámaras en el primer anillo`, `At least ${aMin} cameras in the first ring`)),
        item("grow", d >= 1, L("Cada anillo tiene más cámaras que el anterior (d ≥ 1)", "Each ring holds more cameras than the one before (d ≥ 1)")),
      ];
      return verdict(items, { sum: s, rings: Array.from({ length: Math.max(0, Math.min(n, 60)) }, (_, k) => this.term(a, d, k + 1)) });
    },
  };

  // ----------------------------------------------------------------------- 2. countdown sequence
  const countdown = {
    /** form R: t_n = T n/(n+c);  form G: t_n = T (1 − q^n). */
    t(p, n) { return p.form === "G" ? p.T * (1 - Math.pow(p.q, n)) : (p.T * n) / (n + p.c); },
    gap(p, n) { return this.t(p, n + 1) - this.t(p, n); },
    /** Number of beeps strictly before tau (< T), counted from the closed form. */
    countBefore(p, tau) {
      if (tau >= p.T) return Infinity;
      if (p.form === "G") { // q^n > 1 − tau/T
        const bound = 1 - tau / p.T; let n = 0;
        while (Math.pow(p.q, n + 1) > bound + EPS) n++;
        return n;
      }
      const x = (p.c * tau) / (p.T - tau); // n < x
      return Math.max(0, Math.ceil(x - EPS) - 1);
    },
    times(p, { until = Infinity, minGap = 0, max = 400 } = {}) {
      const out = [];
      for (let n = 1; n <= max; n++) {
        const v = this.t(p, n);
        if (v >= until) break;
        if (minGap && out.length && v - out[out.length - 1] < minGap) break;
        out.push(v);
      }
      return out;
    },
    limit: (p) => p.T,
    check(p, c = {}) {
      const T = c.T ?? 10, minB = c.minBeeps ?? 4, maxB = c.maxBeeps ?? 8, first = c.firstAt ?? 1;
      const valid = p.form === "G" ? p.q > 0 && p.q < 1 : p.c > 0;
      const k = valid ? this.countBefore(p, T / 2) : NaN;
      const items = [
        item("domain", valid, L(p.form === "G" ? "0 < q < 1" : "c > 0", p.form === "G" ? "0 < q < 1" : "c > 0"),
          L("Fuera de este dominio los instantes no forman una cuenta atrás creciente.", "Outside this domain the instants do not form an increasing countdown.")),
        item("limit", Math.abs(p.T - T) < EPS, L(`El límite es ${T} s, la duración del plano`, `The limit is ${T} s, the length of the shot`),
          L(`lím t_n = T = ${fmt(p.T)}: el corte al título cae justo en el límite.`, `lim t_n = T = ${fmt(p.T)}: the cut to the title falls exactly at the limit.`)),
        item("count", valid && k >= minB && k <= maxB, L(`Entre ${minB} y ${maxB} pitidos antes de ${fmt(T / 2)} s`, `Between ${minB} and ${maxB} beeps before ${fmt(T / 2)} s`),
          L(`Con estos parámetros suenan ${k} pitidos antes de ${fmt(T / 2)} s.`, `With these parameters ${k} beeps sound before ${fmt(T / 2)} s.`)),
        item("first", valid && this.t(p, 1) >= first - EPS, L(`Primer pitido a partir de ${first} s`, `First beep at ${first} s or later`),
          L(`t_1 = ${fmt(valid ? this.t(p, 1) : NaN)} s.`, `t_1 = ${fmt(valid ? this.t(p, 1) : NaN)} s.`)),
      ];
      return verdict(items, { beepsBeforeHalf: k });
    },
  };

  // --------------------------------------------------------------------------- 3. geometric
  const geometric = {
    term: (a, r, k) => a * Math.pow(r, k - 1),
    partial(a, r, n) { return Math.abs(r - 1) < EPS ? n * a : (a * (1 - Math.pow(r, n))) / (1 - r); },
    converges: (r) => Math.abs(r) < 1,
    /** Sum of the series, or null outside |r| < 1 (the formula a/(1−r) does not apply there). */
    sum(a, r) { return this.converges(r) ? a / (1 - r) : null; },
    positions(a, r, n) { return Array.from({ length: n }, (_, k) => this.partial(a, r, k + 1)); },
    /** Ratio estimated from measured positions: gaps first, then consecutive quotients. */
    ratioFromPositions(pos) {
      const gaps = pos.map((x, k) => (k ? x - pos[k - 1] : x));
      const q = gaps.slice(1).map((g, k) => g / gaps[k]);
      return { gaps, ratios: q, mean: q.reduce((s, v) => s + v, 0) / q.length };
    },
    /** First index n with distance to the limit below eps (for |r| < 1, r > 0). */
    firstWithin(a, r, eps) {
      const S = this.sum(a, r);
      if (S === null) return null;
      for (let n = 1; n < 10000; n++) if (Math.abs(S - this.partial(a, r, n)) < eps) return n;
      return null;
    },
    check({ a, r }, c = {}) {
      const len = c.length ?? 20, before = c.before ?? 19, nBefore = c.ringsBefore ?? 5, aMin = c.firstMin ?? 4;
      const conv = this.converges(r) && r > 0;
      const S = this.sum(a, r);
      const items = [
        item("conv", conv, L("0 < r < 1: la persecución termina", "0 < r < 1: the chase ends"),
          conv ? L(`La serie converge: |r| = ${fmt(r)} < 1.`, `The series converges: |r| = ${fmt(r)} < 1.`)
            : L(`Con r = ${fmt(r)} la serie no converge (|r| ≥ 1) o el eco cambia de sentido (r ≤ 0): la fórmula a/(1 − r) no se puede aplicar y la persecución no termina en la puerta.`,
              `With r = ${fmt(r)} the series does not converge (|r| ≥ 1) or the echo changes direction (r ≤ 0): the formula a/(1 − r) does not apply and the chase does not end at the door.`)),
        item("length", conv && Math.abs(S - len) < 0.005, L(`La suma es la longitud del pasillo, ${len} m`, `The sum is the length of the corridor, ${len} m`),
          conv ? L(`a/(1 − r) = ${fmt(a)}/${fmt(1 - r)} = ${fmt(S)} m. Para ${len} m hace falta a = ${fmt(len * (1 - r))}.`, `a/(1 − r) = ${fmt(a)}/${fmt(1 - r)} = ${fmt(S)} m. For ${len} m you need a = ${fmt(len * (1 - r))}.`) : null),
        item("visible", conv && this.partial(a, r, nBefore) <= before + EPS, L(`Al menos ${nBefore} anillos antes de ${before} m`, `At least ${nBefore} rings before ${before} m`),
          conv ? L(`El anillo ${nBefore} está en ${fmt(this.partial(a, r, nBefore))} m.`, `Ring ${nBefore} is at ${fmt(this.partial(a, r, nBefore))} m.`) : null),
        item("first", a >= aMin - EPS, L(`Primer anillo a ${aMin} m o más`, `First ring at ${aMin} m or more`)),
      ];
      return verdict(items, { sum: S });
    },
  };

  // ------------------------------------------------------------------ 4. harmonic and the rope
  const Hcache = [0];
  function H(n) {
    for (let k = Hcache.length; k <= n; k++) Hcache[k] = Hcache[k - 1] + 1 / k;
    return Hcache[n];
  }
  const harmonic = {
    H,
    fraction: (c, Lg, n) => (c / Lg) * H(n),
    /** Computed arrival minute: least N with H_N >= m (null if beyond the search cap). */
    arrival(m, cap = 3e6) {
      if (m <= 1) return 1;
      if (Hcache.length < 2) H(1);
      let lo = 1;
      while (lo < cap && H(Math.min(cap, lo * 2)) < m) lo *= 2;
      if (H(Math.min(cap, lo * 2)) < m) return null;
      let hi = Math.min(cap, lo * 2);
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (H(mid) >= m) hi = mid; else lo = mid; }
      return H(lo) >= m ? lo : hi;
    },
    /** Proved: H_{2^k} >= 1 + k/2, so the probe has surely arrived by minute 2^k, k = ceil(2(m−1)). */
    latestProved(m) { return m <= 1 ? 1 : Math.pow(2, Math.ceil(2 * (m - 1) - EPS)); },
    /** Proved: H_{2^k − 1} <= k, so it has not arrived by minute 2^k − 1 when k <= m. */
    earliestProved(m) { const k = Math.floor(m + EPS); return k >= 2 ? Math.pow(2, k) : 1; },
    check({ c, L: Lg }, cons = {}) {
      const m = Lg / c, deadline = cons.deadline ?? 12960, notBefore = cons.notBefore ?? 60;
      const latest = this.latestProved(m), earliest = this.earliestProved(m);
      const items = [
        item("pos", c > 0 && Lg > 0, L("Velocidad y crecimiento positivos", "Positive speed and growth")),
        item("faster", m > 1, L("El pasillo crece más deprisa de lo que avanza la sonda (L > c)", "The corridor grows faster than the probe moves (L > c)"),
          L(`m = L/c = ${fmt(m)}.`, `m = L/c = ${fmt(m)}.`)),
        item("arrives", true, L("La sonda llega: la serie armónica diverge (Oresme)", "The probe arrives: the harmonic series diverges (Oresme)"),
          L("Agrupando 1/2, (1/3 + 1/4), (1/5 + … + 1/8)…, cada bloque suma al menos 1/2: H_{2^k} ≥ 1 + k/2.", "Grouping 1/2, (1/3 + 1/4), (1/5 + … + 1/8)…, each block adds at least 1/2: H_{2^k} ≥ 1 + k/2."), "proved"),
        item("deadline", latest <= deadline, L(`Llegada demostrada antes del minuto ${deadline}`, `Arrival proved before minute ${deadline}`),
          L(`La cota de Oresme garantiza la llegada como muy tarde en el minuto ${latest}.`, `The Oresme bound guarantees arrival by minute ${latest} at the latest.`), "proved"),
        item("notBefore", earliest > notBefore, L(`No llega en los primeros ${notBefore} minutos (demostrado)`, `It does not arrive within the first ${notBefore} minutes (proved)`),
          L(`H_{2^k − 1} ≤ k: no puede llegar antes del minuto ${earliest}.`, `H_{2^k − 1} ≤ k: it cannot arrive before minute ${earliest}.`), "proved"),
      ];
      const N = m <= 40 ? this.arrival(m) : null;
      return verdict(items, { m, arrival: N, latest, earliest, arrivalKind: "computed" });
    },
  };

  // ------------------------------------------------------------------------- 5. telescoping
  const telescoping = {
    /** form H: b_k = A/(k + m);  form G: b_k = A q^(k−1). */
    b(p, k) { return p.form === "G" ? p.A * Math.pow(p.q, k - 1) : p.A / (k + p.m); },
    entry(p, k) { return this.b(p, k) - this.b(p, k + 1); },
    partial(p, N) { return this.b(p, 1) - this.b(p, N + 1); },
    partialTermwise(p, N) { let s = 0; for (let k = 1; k <= N; k++) s += this.entry(p, k); return s; },
    total(p) { return this.b(p, 1); },
    /** For entries 1/(k(k+1)): the final coherence 1/(N+1) gives N. */
    observationsFromFinal(final) { return Math.round(1 / final) - 1; },
    check(p, c = {}) {
      const cMin = c.totalMin ?? 0.5, cMax = c.totalMax ?? 2, N = c.revealAfter ?? 9, share = c.revealShare ?? 0.8;
      const valid = p.form === "G" ? p.A > 0 && p.q > 0 && p.q < 1 : p.A > 0 && p.m >= 0;
      const C = valid ? this.total(p) : NaN, shown = valid ? this.partial(p, N) / C : NaN;
      const items = [
        item("domain", valid, L(p.form === "G" ? "A > 0 y 0 < q < 1" : "A > 0 y m ≥ 0", p.form === "G" ? "A > 0 and 0 < q < 1" : "A > 0 and m ≥ 0"),
          L("Así b_k decrece hacia 0 y la serie telescópica converge a b_1.", "Then b_k decreases to 0 and the telescoping series converges to b_1.")),
        item("total", valid && C >= cMin - EPS && C <= cMax + EPS, L(`Coherencia total entre ${cMin} y ${cMax}`, `Total coherence between ${cMin} and ${cMax}`),
          valid ? L(`Suma = b_1 − lím b_k = ${fmt(C, 4)}.`, `Sum = b_1 − lim b_k = ${fmt(C, 4)}.`) : null),
        item("reveal", valid && shown >= share - EPS, L(`Tras ${N} entradas se ha revelado al menos el ${Math.round(share * 100)} %`, `After ${N} entries at least ${Math.round(share * 100)}% has been revealed`),
          valid ? L(`S_${N} = b_1 − b_${N + 1} = ${fmt(this.partial(p, N), 4)}, el ${fmt(100 * shown, 1)} % del total.`, `S_${N} = b_1 − b_${N + 1} = ${fmt(this.partial(p, N), 4)}, ${fmt(100 * shown, 1)}% of the total.`) : null),
      ];
      return verdict(items, { total: C });
    },
  };

  // ------------------------------------------------------------------------------ 6. p-series
  const pseries = {
    term: (D, p, n) => D / Math.pow(n, p),
    partial(D, p, n) { let s = 0; for (let k = 1; k <= n; k++) s += D / Math.pow(k, p); return s; },
    converges: (p) => p > 1,
    crossing(D, p, thr, max = 2e6) {
      let s = 0;
      for (let k = 1; k <= max; k++) { s += D / Math.pow(k, p); if (s > thr) return k; }
      return null;
    },
    condensationBound(D, p) { return p > 1 ? D / (1 - Math.pow(2, 1 - p)) : Infinity; },
    /** Proved bound S <= D(S_N + tail(N)); for p >= 2 tail < 1/N, otherwise condensation from N+1. */
    refinedBound(D, p, N) {
      if (p <= 1) return Infinity;
      const SN = this.partial(1, p, N);
      const tailCond = Math.pow(N + 1, 1 - p) / (1 - Math.pow(2, 1 - p));
      const tail = p >= 2 ? Math.min(1 / N, tailCond) : tailCond;
      return D * (SN + tail);
    },
    /** Numerical estimate of the sum (status "computed"), for classification only. */
    numericSum(D, p) {
      if (p <= 1) return Infinity;
      const N = 200000; const SN = this.partial(1, p, N);
      const tail = Math.pow(N, 1 - p) / (p - 1) - 0.5 * Math.pow(N, -p);
      return D * (SN + tail);
    },
    /** Can the chapter's tools prove that every partial sum stays below thr? */
    proveBelow(D, p, thr) {
      if (p <= 1) return { proved: false, reason: "diverges" };
      if (p >= 2 && 2 * D <= thr + EPS) return { proved: true, method: "telescoping", bound: 2 * D };
      const cond = this.condensationBound(D, p);
      if (cond <= thr + EPS) return { proved: true, method: "condensation", bound: cond };
      for (const N of [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 30, 50, 100, 200, 500, 1000]) {
        const b = this.refinedBound(D, p, N);
        if (b <= thr + EPS) return { proved: true, method: "refined", N, bound: b };
      }
      const est = this.numericSum(D, p);
      return { proved: false, reason: est < thr ? "true-unproved" : "false", estimate: est };
    },
    check({ D, pS, pI }, c = {}) {
      const thr = c.threshold ?? 2, by = c.saraBy ?? 10, dMin = c.Dmin ?? 0.5, dMax = c.Dmax ?? 1.5;
      const cross = this.crossing(D, pS, thr, 100000);
      const proof = this.proveBelow(D, pI, thr);
      const crossI = pI > 1 && proof.reason === "false" ? this.crossing(D, pI, thr, 100000) : null;
      const methodText = {
        telescoping: L("comparación con 1/(n(n − 1)), telescópica: S_n < 2D", "comparison with 1/(n(n − 1)), telescoping: S_n < 2D"),
        condensation: L("agrupación en bloques de 2^j términos: S ≤ D/(1 − 2^{1−p})", "grouping in blocks of 2^j terms: S ≤ D/(1 − 2^{1−p})"),
        refined: L(`suma parcial S_N con N = ${proof.N} más una cota de la cola`, `partial sum S_N with N = ${proof.N} plus a bound for the tail`),
      };
      let irene;
      if (proof.proved) irene = L(`Demostrado por ${methodText[proof.method].es}: la dosis queda por debajo de ${fmt(proof.bound, 3)} ≤ ${thr}.`, `Proved by ${methodText[proof.method].en}: the dose stays below ${fmt(proof.bound, 3)} ≤ ${thr}.`);
      else if (proof.reason === "diverges") irene = L(`Con p = ${fmt(pI)} ≤ 1 la serie diverge: la dosis de Irene acabaría superando cualquier umbral.`, `With p = ${fmt(pI)} ≤ 1 the series diverges: Irene's dose would eventually exceed any threshold.`);
      else if (proof.reason === "false") irene = L(`La serie converge (p > 1), pero su suma pasa de ${thr}: cruza el umbral en el minuto ${crossI}. Convergente no significa pequeña.`, `The series converges (p > 1), but its sum exceeds ${thr}: it crosses the threshold in minute ${crossI}. Convergent does not mean small.`);
      else irene = L(`Numéricamente la suma (≈ ${fmt(proof.estimate, 3)}) queda por debajo de ${thr}, pero ninguna de las cotas del capítulo lo demuestra con estos valores. Una simulación no es una demostración: elegid otros parámetros o presentad una cota más fina para que la revise el profesorado.`,
        `Numerically the sum (≈ ${fmt(proof.estimate, 3)}) stays below ${thr}, but none of the chapter's bounds proves it with these values. A simulation is not a proof: choose other parameters or present a sharper bound for your teacher to review.`);
      const items = [
        item("D", D >= dMin - EPS && D <= dMax + EPS, L(`Dosis del primer minuto entre ${dMin} y ${dMax}`, `First-minute dose between ${dMin} and ${dMax}`)),
        item("sara", cross !== null && cross <= by, L(`Sara supera ${thr} antes del minuto ${by}`, `Sara exceeds ${thr} by minute ${by}`),
          cross !== null ? L(`Su dosis acumulada pasa de ${thr} en el minuto ${cross}.`, `Her accumulated dose passes ${thr} in minute ${cross}.`) : L("Su dosis no llega al umbral en el plazo.", "Her dose does not reach the threshold in time."), "computed"),
        item("irene", proof.proved, L(`Irene no llega nunca a ${thr}, y se puede demostrar`, `Irene never reaches ${thr}, and it can be proved`), irene, proof.proved ? "proved" : proof.reason === "true-unproved" ? "computed" : "exact"),
      ];
      return verdict(items, { saraCross: cross, ireneProof: proof, ireneCross: crossI, needsReview: proof.reason === "true-unproved" });
    },
  };

  // --------------------------------------------------------------------------- 7. alternating
  const alternating = {
    /** form P: b_k = L/k^s;  form G: b_k = L r^(k−1). */
    b(p, k) { return p.form === "G" ? p.L * Math.pow(p.r, k - 1) : p.L / Math.pow(k, p.s); },
    position(p, n) { let s = 0; for (let k = 1; k <= n; k++) s += (k % 2 ? 1 : -1) * this.b(p, k); return s; },
    positions(p, n) { const out = []; let s = 0; for (let k = 1; k <= n; k++) { s += (k % 2 ? 1 : -1) * this.b(p, k); out.push(s); } return out; },
    path(p, n) { let s = 0; for (let k = 1; k <= n; k++) s += this.b(p, k); return s; },
    pathDiverges: (p) => (p.form === "G" ? false : p.s <= 1),
    leibniz: (p) => (p.form === "G" ? p.r > 0 && p.r < 1 && p.L > 0 : p.s > 0 && p.L > 0),
    /** Proved bracket: the sum lies between S_n and S_{n+1}. */
    bracket(p, n) { const a = this.position(p, n), b = this.position(p, n + 1); return [Math.min(a, b), Math.max(a, b)]; },
    exactSum(p) { return p.form === "G" ? p.L / (1 + p.r) : null; },
    knownSum(p) { return p.form !== "G" && Math.abs(p.s - 1) < EPS ? p.L * Math.LN2 : null; },
    /** Least n whose bracket [S_n, S_{n+1}] fits inside [lo, hi] (certificate), or null. */
    certify(p, lo, hi, max = 200000) {
      let s = 0;
      for (let k = 1; k <= max; k++) {
        s += (k % 2 ? 1 : -1) * this.b(p, k);
        const next = s + (k % 2 ? -1 : 1) * this.b(p, k + 1);
        const a = Math.min(s, next), b = Math.max(s, next);
        if (a >= lo - EPS && b <= hi + EPS) return { n: k, bracket: [a, b] };
        if (this.b(p, k + 1) < 1e-9) break;
      }
      return null;
    },
    swingsForError(p, err) { for (let n = 1; n < 1e7; n++) if (this.b(p, n + 1) <= err + EPS) return n; return null; },
    /** Recover L from measured positions S_n = L·A_n (form P with s = 1). */
    amplitudeFromPositions(samples) {
      const A = (n) => this.position({ form: "P", L: 1, s: 1 }, n);
      const Ls = samples.map(({ n, x }) => x / A(n));
      return { values: Ls, mean: Ls.reduce((a, b) => a + b, 0) / Ls.length };
    },
    check(p, c = {}) {
      const Lmax = c.firstMax ?? 14, lo = c.alcoveMin ?? 6, hi = c.alcoveMax ?? 10, infinite = c.infinitePath ?? true;
      const ok = this.leibniz(p);
      const cert = ok ? this.certify(p, lo, hi) : null;
      const items = [
        item("leibniz", ok, L("Amplitudes decrecientes con límite 0 (criterio de Leibniz)", "Decreasing amplitudes with limit 0 (alternating series test)"),
          ok ? L("Las posiciones pares crecen, las impares decrecen y la diferencia tiende a 0: la posición converge.", "Even positions increase, odd ones decrease and the difference tends to 0: the position converges.")
            : L("Si las amplitudes no decrecen hacia 0, el criterio de Leibniz no se aplica.", "If the amplitudes do not decrease to 0, the alternating series test does not apply."), "proved"),
        item("first", p.L <= Lmax + EPS, L(`Primer avance de ${Lmax} m como mucho`, `First swing of at most ${Lmax} m`)),
        item("alcove", !!cert, L(`Posición final certificada entre ${lo} y ${hi} m`, `Final position certified between ${lo} and ${hi} m`),
          cert ? L(`Tras ${cert.n} oscilaciones la posición final queda entre ${fmt(cert.bracket[0], 3)} y ${fmt(cert.bracket[1], 3)} m.`, `After ${cert.n} swings the final position lies between ${fmt(cert.bracket[0], 3)} and ${fmt(cert.bracket[1], 3)} m.`)
            : L("Ningún par de posiciones consecutivas encierra el límite dentro de la hornacina.", "No pair of consecutive positions traps the limit inside the alcove."), "proved"),
        item("path", !infinite || this.pathDiverges(p), L("El camino recorrido es infinito («andará siempre»)", "The path walked is infinite (“he will walk forever”)"),
          this.pathDiverges(p) ? L("Σ b_k diverge: convergencia condicional.", "Σ b_k diverges: conditional convergence.")
            : L("Σ b_k converge: el camino total es finito (convergencia absoluta) y la escena pierde su sentido.", "Σ b_k converges: the total path is finite (absolute convergence) and the scene loses its point."), "proved"),
      ];
      return verdict(items, { certificate: cert, exact: this.exactSum(p), known: this.knownSum(p), absolute: !this.pathDiverges(p) });
    },
  };

  root.SFMath = { L, EPS, round, fmt, parseHMS, hms, arithmetic, countdown, geometric, harmonic, telescoping, pseries, alternating };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFMath;
})(typeof window !== "undefined" ? window : globalThis);
