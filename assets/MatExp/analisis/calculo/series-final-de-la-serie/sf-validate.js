/*
 * Calculus Cases · Case 7 · The Series Finale — answer validation.
 *
 * Reference values are computed from the case parameters (sf-math.js, sf-evidence.js), never
 * stored as an answer key. Validation distinguishes:
 *   number / integer   exact or within a declared tolerance (measurement or rounding),
 *   clock / duration   converted to seconds,
 *   interval           both ends within tolerance,
 *   expression         safe parser, compared at n = 1…12 (an identity check, not string matching),
 *   choice             closed classification (converges / diverges, absolute / conditional…),
 *   justification      structured: the student picks the arguments used; the app checks that the
 *                      right ones are there and no fallacy is, and leaves the text to the teacher.
 * Known mistakes ("traps") produce specific feedback.
 */
(function (root) {
  "use strict";
  const M = root.SFMath || require("./sf-math.js");
  const E = root.SFEvidence || require("./sf-evidence.js");
  const { L } = M;

  // ------------------------------------------------------------------------ parsing input
  function parseNumber(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim().replace(/−/g, "-").replace(/\s+/g, "");
    if (!s) return NaN;
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");      // accept a decimal comma
    if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(s)) { const [a, b] = s.split("/").map(Number); return a / b; }
    const v = Number(s);
    if (isFinite(v)) return v;
    try { const f = compile(s, "n"); const x = f(1); return isFinite(x) ? x : NaN; } catch (e) { return NaN; }
  }
  function parseClock(raw) {
    const m = String(raw || "").trim().match(/^(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?$/);
    if (!m) return NaN;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0);
  }
  function parseDuration(raw) {
    const s = String(raw || "").trim().toLowerCase();
    let m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0);
    m = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?\s*(?:(\d+)\s*s)?$/);
    if (m && (m[1] || m[2] || m[3])) return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
    const v = parseNumber(s);
    return isFinite(v) ? v : NaN;   // plain number of seconds
  }
  function parseInterval(raw) {
    const nums = String(raw || "").replace(/−/g, "-").match(/-?\d+(?:[.,]\d+)?/g);
    if (!nums || nums.length !== 2) return null;
    const [a, b] = nums.map((x) => Number(x.replace(",", ".")));
    return [Math.min(a, b), Math.max(a, b)];
  }

  /**
   * Safe expression compiler: numbers, one variable, + − * / ^, parentheses, implicit
   * multiplication (2n, 20(1-0.6^n)), sqrt, ln, log. No eval.
   */
  function compile(src, variable = "n") {
    const s = String(src).replace(/−/g, "-").replace(/[·×]/g, "*").replace(/÷/g, "/").replace(/,(?=\d)/g, ".").replace(/\s+/g, "");
    let i = 0;
    const peek = () => s[i];
    const fail = () => { throw new Error(`syntax at ${i}`); };
    function primary() {
      const c = peek();
      if (c === "(") { i++; const e = expr(); if (peek() !== ")") fail(); i++; return e; }
      if (/[0-9.]/.test(c)) { const m = s.slice(i).match(/^\d*\.?\d+(e[+-]?\d+)?/i); if (!m) fail(); i += m[0].length; const v = Number(m[0]); return () => v; }
      const fn = s.slice(i).match(/^(sqrt|ln|log)/);
      if (fn) { i += fn[0].length; const a = primary(); const f = fn[0] === "sqrt" ? Math.sqrt : Math.log; return (x) => f(a(x)); }
      if (c && c.toLowerCase() === variable.toLowerCase()) { i++; return (x) => x; }
      if (c === "π") { i++; return () => Math.PI; }
      fail();
    }
    function power() {
      const base = primary();
      if (peek() === "^") { i++; const ex = unary(); return (x) => Math.pow(base(x), ex(x)); }
      return base;
    }
    function unary() {
      if (peek() === "-") { i++; const a = unary(); return (x) => -a(x); }
      if (peek() === "+") { i++; return unary(); }
      return power();
    }
    function term() {
      let left = unary();
      for (;;) {
        const c = peek();
        if (c === "*" || c === "/") { i++; const r = unary(); const l = left; left = c === "*" ? (x) => l(x) * r(x) : (x) => l(x) / r(x); }
        else if (c && (/[0-9.(]/.test(c) || c.toLowerCase() === variable.toLowerCase() || /^(sqrt|ln|log)/.test(s.slice(i)))) { const r = unary(); const l = left; left = (x) => l(x) * r(x); }
        else return left;
      }
    }
    function expr() {
      let left = term();
      while (peek() === "+" || peek() === "-") { const op = s[i++]; const r = term(); const l = left; left = op === "+" ? (x) => l(x) + r(x) : (x) => l(x) - r(x); }
      return left;
    }
    const f = expr();
    if (i !== s.length) fail();
    return f;
  }

  // -------------------------------------------------------------------- argument catalogue
  const CRITERIA = {
    "sign-of-difference": { ok: true, label: L("La diferencia $t_{n+1} - t_n = 60/((n+1)(n+2))$ es positiva", "The difference $t_{n+1} - t_n = 60/((n+1)(n+2))$ is positive") },
    "upper-bound": { ok: true, label: L("$t_n = 60 - 60/(n+1) < 60$ para todo $n$", "$t_n = 60 - 60/(n+1) < 60$ for every $n$") },
    "infinitely-many-events": { ok: true, label: L("Hay infinitos pitidos", "There are infinitely many beeps") },
    "finite-time": { ok: true, label: L("Todos suenan antes de 60 s, porque $\\lim t_n = 60$", "All of them sound before 60 s, because $\\lim t_n = 60$") },
    "abs-r-less-1": { ok: true, label: L("$|r| < 1$, así que $r^n \\to 0$", "$|r| < 1$, so $r^n \\to 0$") },
    "genuine-v3": { ok: true, label: L("La razón medida y $a/(1-r) = 20$ m encajan con el pasillo de 20 m de la v3", "The measured ratio and $a/(1-r) = 20$ m fit the 20 m corridor of v3") },
    "necessary-not-sufficient": { ok: true, label: L("Que los términos tiendan a 0 es necesario, pero no suficiente, para que la serie converja", "Terms tending to 0 is necessary, but not sufficient, for the series to converge") },
    "harmonic-diverges": { ok: true, label: L("La serie armónica diverge (agrupación de Oresme)", "The harmonic series diverges (Oresme's grouping)") },
    "consistent-with-bible": { ok: true, label: L("La biblia sitúa la llegada en el minuto 12 367", "The bible places the arrival in minute 12 367") },
    "bk-must-converge": { ok: true, label: L("La serie telescópica converge si y solo si $b_k$ tiene límite; con $b_k = k$ diverge", "The telescoping series converges if and only if $b_k$ has a limit; with $b_k = k$ it diverges") },
    "telescoping-counter": { ok: true, label: L("La suma de las diferencias del contador es $W_N - W_0$", "The sum of the counter's differences is $W_N - W_0$") },
    "telescoping-comparison": { ok: true, label: L("$1/n^2 < 1/(n-1) - 1/n$ y la suma telescópica es menor que 1", "$1/n^2 < 1/(n-1) - 1/n$ and the telescoping sum is less than 1") },
    "condensation": { ok: true, label: L("Agrupación en bloques de $2^j$ términos: la serie queda acotada por una geométrica", "Grouping in blocks of $2^j$ terms: the series is bounded by a geometric one") },
    "other-version": { ok: true, label: L("El exponente 1.5 no está ni en la v1 ni en la v3", "The exponent 1.5 is in neither v1 nor v3") },
    "leibniz": { ok: true, label: L("Las posiciones pares crecen, las impares decrecen y su diferencia tiende a 0 (Leibniz)", "Even positions increase, odd ones decrease and their difference tends to 0 (Leibniz)") },
    "old-corridor": { ok: true, label: L("$L = 15$ corresponde al pasillo de 25 m de la v1 y la v2, no a la hornacina de 8.3 m", "$L = 15$ belongs to the 25 m corridor of v1 and v2, not to the 8.3 m alcove") },
    // fallacies offered as distractors
    "terms-imply": { ok: false, label: L("Como los términos tienden a 0, la serie converge", "Since the terms tend to 0, the series converges"), why: L("Falso: la armónica es el contraejemplo.", "False: the harmonic series is the counterexample.") },
    "simulation": { ok: false, label: L("Lo hemos comprobado sumando muchos términos con el ordenador", "We checked it by adding many terms on the computer"), why: L("Una suma finita no demuestra nada sobre la serie infinita.", "A finite sum proves nothing about the infinite series.") },
    "big-values": { ok: false, label: L("Las sumas parciales se hacen grandes, luego la serie diverge", "The partial sums get large, so the series diverges"), why: L("Grandes no es lo mismo que no acotadas.", "Large is not the same as unbounded.") },
    "formula-anyway": { ok: false, label: L("Se aplica $a/(1-r)$ sin comprobar nada más", "Apply $a/(1-r)$ without checking anything else"), why: L("La fórmula solo vale si $|r| < 1$.", "The formula only holds when $|r| < 1$.") },
    "known-value": { ok: false, label: L("La suma vale $\\pi^2/6$, un valor conocido", "The sum equals $\\pi^2/6$, a known value"), why: L("Citar un valor no lo demuestra con las herramientas del caso.", "Quoting a value does not prove it with the case's tools.") },
    "last-position": { ok: false, label: L("La posición final es la última calculada", "The final position is the last one computed"), why: L("La última suma parcial es solo una aproximación; la cota la da el criterio de Leibniz.", "The last partial sum is only an approximation; the bound comes from the alternating series test.") },
  };
  const DISTRACTORS = ["terms-imply", "simulation", "big-values", "formula-anyway", "known-value", "last-position"];

  // ------------------------------------------------------------------------ references
  function refs(SF, ctx) {
    const cd = { form: "R", T: 60, c: 1 };
    const harm10 = M.harmonic;
    const traps = {};
    const R = {
      "e1.t": (n) => M.countdown.t(cd, n),
      "e1.gapExpr": () => (n) => 60 / ((n + 1) * (n + 2)),
      "e1.beepsBefore": (tau) => M.countdown.countBefore(cd, tau),
      "e1.beepAt60": () => "no",
      "e1.limit": () => 60,
      "e1.infinitelyMany": () => "infinite",
      "e1.gap": (n) => M.countdown.gap(cd, n),
      "e1.gapSumExpr": () => (N) => 30 - 60 / (N + 2),
      "e1.gapTotal": () => 30,
      "e1.ringTerm": (k) => M.arithmetic.term(6, 4, k),
      "e1.ringSum": (n) => M.arithmetic.sum(6, 4, n),
      "e1.ringsFor240": () => 10,
      "e1.cLow": () => 4,
      "e1.cHigh": () => 9,
      "render.last": () => ctx.render.last,
      "render.duration": () => ctx.render.seconds,
      "render.start": () => ctx.render.start,
      "render.naiveStart": () => ctx.render.naiveStart,
      "render.lastStart": () => ctx.render.lastStart,
      "e2.x": (n) => M.geometric.partial(8, 0.6, n),
      "e2.xExpr": () => (n) => 20 * (1 - Math.pow(0.6, n)),
      "e2.sum": () => 20,
      "e2.chaseDistance": () => 20,
      "e2.chaseTime": () => 10,
      "e2.r1Expr": () => (n) => 8 * n,
      "e2.r1Class": () => "diverges",
      "e2.within10cm": () => M.geometric.firstWithin(8, 0.6, 0.1),
      "leak.gap": (k) => ctx.leak.gaps[k - 1],
      "leak.r": () => ctx.leak.r,
      "leak.sum": () => ctx.leak.sum,
      "e3.F": (n) => M.harmonic.fraction(10, 100, n),
      "e3.termsToZero": () => "tend-to-0",
      "e3.harmonicClass": () => "diverges",
      "e3.blockMin": () => 0.5,
      "e3.kFor10": () => 18,
      "e3.earliest": () => harm10.earliestProved(10),
      "e3.latest": () => harm10.latestProved(10),
      "e3.days": () => harm10.arrival(10) / 1440,
      "e3.claimTrue": () => "false",
      "e4.S": (N) => M.telescoping.partial({ form: "H", A: 1, m: 0 }, N),
      "e4.SExpr": () => (N) => 1 - 1 / (N + 1),
      "e4.total": () => 1,
      "e4.N": () => M.telescoping.observationsFromFinal(SF.investigation.episodeModels.log.finalCoherence),
      "e4.extra": () => M.telescoping.observationsFromFinal(SF.investigation.episodeModels.log.finalCoherence) - 240,
      "journal.listed": () => ctx.journal.listed,
      "journal.missing": () => ctx.journal.missing,
      "journal.opened": () => ctx.journal.open,
      "e5.S": ([p, n]) => M.pseries.partial(1, p, n),
      "e5.cross": (p) => M.pseries.crossing(1, p, 2),
      "e5.boundExpr": () => (n) => 2 - 1 / n,
      "e5.pCrit": () => 1,
      "alt.p": () => ctx.altS5.p,
      "alt.pMatches": () => "no",
      "e6.S": (n) => M.alternating.position({ form: "P", L: 12, s: 1 }, n),
      "e6.path": (n) => M.alternating.path({ form: "P", L: 12, s: 1 }, n),
      "e6.pathClass": () => "diverges",
      "e6.bracket": (n) => M.alternating.bracket({ form: "P", L: 12, s: 1 }, n),
      "e6.swingsFor": (err) => M.alternating.swingsForError({ form: "P", L: 12, s: 1 }, err),
      "e6.class1": () => "conditional",
      "e6.class2": () => "absolute",
      "alt.L": () => ctx.altS6.L,
      "alt.bracket": () => ctx.altS6.bracket,
    };
    // specific feedback for known mistakes
    traps["render.start"] = [
      { value: ctx.render.naiveStart, tol: 61, msg: L("Esa hora sale si todos los fotogramas cuestan lo mismo que el primero. El perfil dice que cada uno cuesta más que el anterior: sumad la progresión.", "That time comes out if every frame costs the same as the first. The profile says each one costs more than the previous: add up the progression.") },
      { value: ctx.render.lastStart, tol: 61, msg: L("Esa hora sale si todos cuestan lo mismo que el último. Usad la media del primero y el último.", "That time comes out if every frame costs the same as the last one. Use the mean of the first and the last.") },
    ];
    traps["render.duration"] = [{ value: ctx.render.frames * ctx.render.first, tol: 1, msg: L("Es la duración con todos los fotogramas a 12 s. ¿Cuesta lo mismo cada fotograma?", "That is the duration with every frame at 12 s. Does every frame cost the same?") }];
    traps["leak.r"] = [{ value: ctx.leak.printed[1] / ctx.leak.printed[0], tol: 0.02, msg: L("Habéis dividido posiciones. La razón está entre huecos consecutivos: primero restad las posiciones.", "You divided positions. The ratio is between consecutive gaps: subtract the positions first.") }];
    traps["e2.sum"] = [{ value: 8 / 0.6, tol: 0.05, msg: L("La suma es $a/(1-r)$, no $a/r$.", "The sum is $a/(1-r)$, not $a/r$.") }];
    traps["e3.claimTrue"] = [{ value: "true", msg: L("Que el pasillo crezca más deprisa no impide la llegada: la fracción recorrida es $H_n/10$, y la armónica no está acotada.", "The corridor growing faster does not prevent arrival: the fraction covered is $H_n/10$, and the harmonic series is unbounded.") }];
    traps["e5.cross"] = [];
    traps["alt.p"] = [{ value: 2, tol: 0.01, msg: L("Con $p = 2$ el minuto 2 marcaría 1.25, no 1.354.", "With $p = 2$ minute 2 would read 1.25, not 1.354.") }];
    traps["e6.bracket"] = [];
    return { R, traps };
  }

  // ------------------------------------------------------------------------ validation
  const fmtClock = (s) => E.clockOf(s);
  function within(x, ref, tol) { return Math.abs(x - ref) <= tol + 1e-12 * Math.max(1, Math.abs(ref)); }

  /**
   * Validate one answer. Returns {status: "correct" | "incorrect" | "review" | "invalid",
   * kind: "exact" | "approx", message, expected?}.
   */
  function check(SF, spec, input, ctx) {
    ctx = ctx || E.context(SF);
    const { R, traps } = refs(SF, ctx);
    const f = R[spec.ref];
    const ref = f ? f(spec.arg) : null;
    const trap = (value) => (traps[spec.ref] || []).find((t) => (typeof t.value === "string" ? t.value === value : isFinite(value) && within(value, t.value, t.tol || 1e-6)));
    const ok = (kind, message) => ({ status: "correct", kind, message: message || null });
    const bad = (message, kind) => ({ status: "incorrect", kind: kind || "exact", message: message || L("No coincide. Revisad el cálculo.", "It does not match. Check the calculation.") });
    switch (spec.type) {
      case "integer": case "number": {
        const x = parseNumber(input);
        if (!isFinite(x)) return { status: "invalid", message: L("Escribid un número (punto o coma decimal; también vale una fracción como 6/7).", "Write a number (decimal point or comma; a fraction such as 6/7 also works).") };
        const integer = spec.type === "integer" || Number.isInteger(ref);
        const tol = spec.tol != null ? spec.tol : spec.decimals != null ? 0.5 * Math.pow(10, -spec.decimals) + 1e-9 : integer ? 1e-9 : 0.006;
        if (within(x, ref, tol)) return ok(spec.tol != null || spec.decimals != null || !integer ? "approx" : "exact",
          !integer && Math.abs(x - ref) > 1e-9 ? L(`Correcto con la precisión pedida (valor exacto ≈ ${M.fmt(ref, 6)}).`, `Correct to the required precision (exact value ≈ ${M.fmt(ref, 6)}).`) : null);
        const tr = trap(x);
        return bad(tr ? tr.msg : null);
      }
      case "clock": {
        const x = parseClock(input);
        if (!isFinite(x)) return { status: "invalid", message: L("Escribid la hora como hh:mm o hh:mm:ss.", "Write the time as hh:mm or hh:mm:ss.") };
        const day = (v) => ((v % 86400) + 86400) % 86400;
        const tol = spec.tol != null ? spec.tol : 30;
        if (Math.abs(day(x) - day(ref)) <= tol) return ok("exact");
        const tr = (traps[spec.ref] || []).find((t) => Math.abs(day(x) - day(t.value)) <= (t.tol || 30));
        return bad(tr ? tr.msg : null);
      }
      case "duration": {
        const x = parseDuration(input);
        if (!isFinite(x)) return { status: "invalid", message: L("Escribid la duración como h:mm:ss o como «2 h 47 min 30 s».", "Write the duration as h:mm:ss or as “2 h 47 min 30 s”.") };
        if (Math.abs(x - ref) <= (spec.tol != null ? spec.tol : 1)) return ok("exact");
        const tr = trap(x);
        return bad(tr ? tr.msg : null);
      }
      case "interval": {
        const iv = parseInterval(input);
        if (!iv) return { status: "invalid", message: L("Escribid dos números: el extremo inferior y el superior.", "Write two numbers: the lower and the upper end.") };
        const tol = spec.tol != null ? spec.tol : 0.01;
        if (within(iv[0], ref[0], tol) && within(iv[1], ref[1], tol)) return ok("approx");
        return bad(L("Los extremos deben ser dos sumas parciales consecutivas.", "The ends must be two consecutive partial sums."));
      }
      case "choice": {
        if (!input) return { status: "invalid", message: L("Elegid una opción.", "Choose an option.") };
        if (input === ref) return ok("exact");
        const tr = trap(input);
        return bad(tr ? tr.msg : L("Esa clasificación no es correcta.", "That classification is not correct."));
      }
      case "expression": {
        let g;
        try { g = compile(input, spec.variable || "n"); } catch (e) { return { status: "invalid", message: L(`No se entiende la expresión. Usad ${spec.variable || "n"}, números, + − * / ^ y paréntesis.`, `The expression cannot be read. Use ${spec.variable || "n"}, numbers, + − * / ^ and brackets.`) }; }
        const h = ref;
        for (let n = 1; n <= 12; n++) {
          const a = g(n), b = h(n);
          if (!isFinite(a) || Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(b))) {
            return bad(L(`No es equivalente: para ${spec.variable || "n"} = ${n} vuestra expresión da ${M.fmt(a, 5)} y debería dar ${M.fmt(b, 5)}.`, `Not equivalent: for ${spec.variable || "n"} = ${n} your expression gives ${M.fmt(a, 5)} and it should give ${M.fmt(b, 5)}.`));
          }
        }
        return ok("exact", L("Equivalente (comprobado en 12 valores; el profesorado puede revisar la forma).", "Equivalent (checked at 12 values; your teacher may review the form)."));
      }
      case "justification": {
        const chosen = (input && input.criteria) || [];
        const text = (input && input.text) || "";
        const fallacies = chosen.filter((c) => CRITERIA[c] && !CRITERIA[c].ok);
        const missing = (spec.criteria || []).filter((c) => !chosen.includes(c));
        if (fallacies.length) return bad(CRITERIA[fallacies[0]].why);
        if (missing.length) return { status: "incorrect", kind: "structure", message: L("Falta un argumento clave en vuestra justificación.", "A key argument is missing from your justification.") };
        return { status: text.trim().length >= 20 ? "review" : "incorrect", kind: "structure",
          message: text.trim().length >= 20 ? L("La estructura del argumento es correcta. El profesorado revisará la redacción: la aplicación no da por buena una demostración por las palabras que contiene.", "The structure of the argument is correct. Your teacher will review the wording: the app never accepts a proof because of the words it contains.")
            : L("Escribid el argumento con vuestras palabras (al menos una frase completa).", "Write the argument in your own words (at least one full sentence).") };
      }
      default: return { status: "invalid", message: L("Tipo de respuesta desconocido.", "Unknown answer type.") };
    }
  }

  /** Arguments offered for a justification: the required ones plus two fallacies, shuffled deterministically. */
  function optionsFor(spec) {
    const req = spec.criteria || [];
    const pick = DISTRACTORS.filter((d, k) => (k + req.join("").length) % 3 !== 0).slice(0, 2);
    const all = req.concat(pick);
    return all.map((id, k) => ({ id, k: (k * 7 + req.length) % all.length })).sort((a, b) => a.k - b.k).map((x) => ({ id: x.id, label: CRITERIA[x.id].label }));
  }

  /** The reference value in printable form (teacher solutions). */
  function expected(SF, spec, ctx) {
    ctx = ctx || E.context(SF);
    const { R } = refs(SF, ctx);
    const v = R[spec.ref] ? R[spec.ref](spec.arg) : null;
    if (spec.type === "clock") return fmtClock(v);
    if (spec.type === "duration") return M.hms(v);
    if (spec.type === "interval") return `[${M.fmt(v[0], 2)}, ${M.fmt(v[1], 2)}]`;
    if (spec.type === "expression") return null;
    if (typeof v === "number") return M.fmt(v, spec.decimals != null ? spec.decimals : 4);
    return v;
  }

  root.SFValidate = { parseNumber, parseClock, parseDuration, parseInterval, compile, check, expected, optionsFor, CRITERIA, refs };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFValidate;
})(typeof window !== "undefined" ? window : globalThis);
