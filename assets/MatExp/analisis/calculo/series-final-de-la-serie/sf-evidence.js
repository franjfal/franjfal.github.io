/*
 * Calculus Cases · Case 7 · The Series Finale — evidence engine.
 *
 * Derives every number printed in the forensic exhibits from the investigation parameters
 * (SFData.investigation, possibly overridden by the teacher), fills the text tokens, checks that
 * a teacher configuration keeps the case consistent and verifies that the evidence points to a
 * single culprit. No DOM: runs in the browser (window.SFEvidence) and in Node.
 */
(function (root) {
  "use strict";
  const M = root.SFMath || (typeof require === "function" ? require("./sf-math.js") : null);
  const { L, hms, parseHMS, round, fmt } = M;
  const DAY = 86400;

  /** Seconds after midnight of the night D0 (times before noon belong to the next day). */
  function nightSeconds(clock, dayOffset) {
    const s = parseHMS(clock);
    if (dayOffset != null) return dayOffset * DAY + s;
    return s < 12 * 3600 ? DAY + s : s;
  }
  const clockOf = (sec) => hms(sec, { clock: true });
  function duration(sec) {
    const s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return { es: `${h} h ${m} min ${r} s`, en: `${h} h ${m} min ${r} s`, short: hms(s) };
  }

  /** Investigation parameters with teacher overrides (only the configurable ones). */
  function params(SF, overrides = {}) {
    const inv = SF.investigation;
    const render = Object.assign({}, inv.render, overrides.render || {});
    const leakR = overrides.leakR != null ? overrides.leakR : inv.leak.r;
    return { inv, render, leakR, canary: overrides.canary || null };
  }

  // ------------------------------------------------------------------------- the exhibits
  function leak(SF, P) {
    const len = SF.investigation.corridor.built, r = P.leakR, a = len * (1 - r);
    const n = SF.investigation.leak.ringsShown;
    const exact = M.geometric.positions(a, r, n);
    const printed = exact.map((x) => round(x, 2));
    const est = M.geometric.ratioFromPositions(printed);
    return { r, a, exact, printed, gaps: est.gaps.map((g) => round(g, 2)), ratios: est.ratios, rEstimate: est.mean, sum: a / (1 - r) };
  }

  function render(SF, P) {
    const R = P.render, n = R.frames;
    const seconds = M.arithmetic.sum(R.first, R.step, n);
    const finish = nightSeconds(R.finish);
    const start = finish - seconds;
    const last = R.first + (n - 1) * R.step;
    return {
      frames: n, first: R.first, step: R.step, last, seconds, finish, start,
      naiveStart: finish - n * R.first, lastStart: finish - n * last,
      duration: duration(seconds),
    };
  }

  function journal(SF, Rn) {
    const J = SF.investigation.journal;
    const listed = J.sessions.reduce((s, x) => s + parseHMS(x.open), 0);
    const close = nightSeconds(J.lastSave.time, J.lastSave.day);
    const open = Rn.start - 60;              // the session opened one minute before the render
    const missing = close - open;
    const total = listed + missing;
    const lastListed = nightSeconds(J.sessions[J.sessions.length - 1].save, J.sessions[J.sessions.length - 1].day);
    return { listed, missing, total, open, close, lastListed, sessions: J.sessions };
  }

  function altS5(SF) {
    const { p, minutes } = SF.investigation.altCut.s5;
    const readings = minutes.map((m) => ({ minute: m, value: round(M.pseries.partial(1, p, m), 3) }));
    const pEst = Math.log2(1 / (readings.find((x) => x.minute === 2).value - 1));
    const asV3 = minutes.map((m) => ({ minute: m, value: round(M.pseries.partial(1, 2, m), 3) }));
    return { p, readings, pEstimate: pEst, asV3, crossing: M.pseries.crossing(1, p, 2) };
  }

  function altS6(SF) {
    const { L: Lv, swings } = SF.investigation.altCut.s6;
    const pp = { form: "P", L: Lv, s: 1 };
    const positions = swings.map((n) => ({ n, x: round(M.alternating.position(pp, n), 2) }));
    const est = M.alternating.amplitudeFromPositions(positions);
    const lastTwo = swings.slice(-2);
    const bracket = [Math.min(...lastTwo.map((n) => M.alternating.position(pp, n))), Math.max(...lastTwo.map((n) => M.alternating.position(pp, n)))];
    return { L: Lv, positions, LEstimate: est.mean, bracket: bracket.map((v) => round(v, 2)), known: Lv * Math.LN2, alcove: SF.investigation.episodeModels.beacon.L * Math.LN2 };
  }

  // --------------------------------------------------------------------------- the context
  function context(SF, overrides = {}) {
    const P = params(SF, overrides);
    const R = render(SF, P), J = journal(SF, R), LK = leak(SF, P), S5 = altS5(SF), S6 = altS6(SF);
    const num = (x, d = 2) => M.fmt(x, d);
    const tokens = {
      renderFrames: String(R.frames), renderFirst: num(R.first, 3), renderStep: num(R.step, 3), renderLast: num(R.last, 3),
      renderFinish: clockOf(R.finish), renderSeconds: num(R.seconds, 1).replace(/^(\d+)(\d{3})$/, "$1 $2"),
      renderDuration: R.duration, renderStart: clockOf(R.start), renderNaiveStart: clockOf(R.naiveStart), renderLastStart: clockOf(R.lastStart),
      journalListed: hms(J.listed), journalMissing: hms(J.missing), journalTotal: hms(J.total), journalOpen: clockOf(J.open), journalClose: clockOf(J.close),
      leakR: num(LK.r, 2),
    };
    return { P, render: R, journal: J, leak: LK, altS5: S5, altS6: S6, tokens };
  }

  /** Replace {token} placeholders; values may be strings or {es, en}. */
  function fill(str, tokens, lang) {
    return String(str).replace(/\{([A-Za-z][A-Za-z0-9]{3,})\}/g, (m, k) => {
      if (!(k in tokens)) return m;
      const v = tokens[k];
      return v && typeof v === "object" ? (v[lang] != null ? v[lang] : v.short || m) : String(v);
    });
  }

  // ---------------------------------------------------------------- configuration checks
  /**
   * A teacher may change the render profile, its finish time and the watermark ratios. The rest
   * of the case adapts (the journal follows the render), but some changes would break the logic:
   * those are refused with an explanation; others only weaken the didactic trap and are warned.
   */
  function checkConfig(SF, overrides = {}) {
    const errors = [], warnings = [];
    const C = context(SF, overrides);
    const R = C.render, J = C.journal;
    const elias = nightSeconds("21:58"), alexGone = nightSeconds("21:52"), hugoIn = nightSeconds("00:15"), hugoOut = nightSeconds("00:32");
    if (!(R.frames >= 24 && R.frames <= 2400 && Number.isInteger(R.frames))) errors.push(L("El número de fotogramas debe ser un entero entre 24 y 2400.", "The number of frames must be a whole number between 24 and 2400."));
    if (!(R.first > 0 && R.step > 0)) errors.push(L("El coste del primer fotograma y su incremento deben ser positivos: el perfil ZENO-VOL-3 es una progresión creciente.", "The first-frame cost and its increment must be positive: the ZENO-VOL-3 profile is an increasing progression."));
    if (R.finish > J.close) errors.push(L(`El render no puede terminar después del último guardado del proyecto (${clockOf(J.close)}).`, `The render cannot finish after the project's last save (${clockOf(J.close)}).`));
    if (J.open <= elias + 5 * 60) errors.push(L(`Con estos valores la sesión empezaría a las ${clockOf(J.open)}, antes de que Elías Brandt pudiera llegar a la sala de montaje (entra en la planta 3 a las 21:58). El caso dejaría de tener solución: cambia la duración o la hora de fin.`, `With these values the session would start at ${clockOf(J.open)}, before Elías Brandt could reach the editing suite (he enters floor 3 at 21:58). The case would have no solution: change the duration or the finish time.`));
    if (J.open <= alexGone) errors.push(L("La sesión empezaría cuando Álex Soler aún podía estar en la planta 3: habría dos sospechosos posibles.", "The session would start while Álex Soler could still be on floor 3: there would be two possible suspects."));
    if (R.start >= hugoIn) errors.push(L("El render empezaría cuando Hugo Mercer ya estaba en la planta 3: la solución dejaría de ser única.", "The render would start after Hugo Mercer had reached floor 3: the solution would no longer be unique."));
    if (!(R.naiveStart >= hugoIn && R.naiveStart <= hugoOut)) warnings.push(L(`La estimación ingenua (todos los fotogramas a ${fmt(R.first)} s) da ${clockOf(R.naiveStart)}, fuera de la visita de Hugo a la planta 3 (00:15–00:32). El caso sigue siendo correcto, pero pierde la trampa didáctica que acusa a Hugo.`, `The naive estimate (every frame at ${fmt(R.first)} s) gives ${clockOf(R.naiveStart)}, outside Hugo's visit to floor 3 (00:15–00:32). The case is still correct, but it loses the didactic trap that accuses Hugo.`));
    // watermark ratios: distinct enough to be read from a frame measured to ±0.01 m
    const ratios = (overrides.canary || (SF.envelope && SF.envelope.canary.copies) || []).map((c) => (c.r === "leak" ? C.leak.r : c.r));
    if (ratios.length) {
      const sorted = ratios.slice().sort((a, b) => a - b);
      if (sorted.some((r) => r < 0.55 - 1e-9 || r > 0.7 + 1e-9)) errors.push(L("Todas las razones de las copias deben estar entre 0.55 y 0.70, como dice la biblia v3.", "Every copy ratio must lie between 0.55 and 0.70, as bible v3 says."));
      if (sorted.some((r, k) => k && r - sorted[k - 1] < 0.03 - 1e-9)) errors.push(L("Dos copias tienen razones a menos de 0.03: con medidas de ±0.01 m no se podrían distinguir.", "Two copies have ratios less than 0.03 apart: with measurements of ±0.01 m they could not be told apart."));
    }
    if (Math.abs(C.leak.rEstimate - C.leak.r) > 0.006) errors.push(L("Con los anillos redondeados a centímetros, la razón medida no recupera la de la copia.", "With the rings rounded to centimetres, the measured ratio does not recover the copy's ratio."));
    const sol = SF.solution ? uniqueCulprit(SF, overrides) : null;
    if (sol && !sol.unique) errors.push(L("Con esta configuración la evidencia no señala a un único culpable.", "With this configuration the evidence does not point to a single culprit."));
    return { ok: errors.length === 0, errors, warnings, context: C, solution: sol };
  }

  // ------------------------------------------------------------------------ uniqueness
  /** Who satisfies every constraint of the deduction? Needs the private data (SFData.solution). */
  function uniqueCulprit(SF, overrides = {}) {
    const C = context(SF, overrides);
    const minutes = (sec) => sec / 60;
    const openM = minutes(C.journal.open), closeM = minutes(C.journal.close), naiveM = minutes(C.render.naiveStart);
    const at = (id, m) => (SF.solution.presence[id] || []).some((iv) => m >= iv.in && (iv.out == null || m <= iv.out));
    const ids = Object.keys(SF.solution.presence);
    const opportunity = ids.filter((id) => at(id, openM) && at(id, closeM));
    const version = ids.filter((id) => SF.solution.v2.includes(id));
    const both = opportunity.filter((id) => version.includes(id));
    const naive = ids.filter((id) => at(id, naiveM));
    return { opportunity, version, culprits: both, unique: both.length === 1 && both[0] === SF.solution.culprit, naive };
  }

  root.SFEvidence = { nightSeconds, clockOf, duration, context, fill, checkConfig, uniqueCulprit, leak, render, journal, altS5, altS6 };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFEvidence;
})(typeof window !== "undefined" ? window : globalThis);
