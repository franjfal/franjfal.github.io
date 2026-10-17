/*
 * Calculus Cases · Case 5 · The Dam — data, documents and slides, on the shared kit.
 *
 * A committee of three specialists (topography, hydrology, the town downstream) chooses a
 * constant release before a storm. The stored volume comes from integrating the areas of the
 * submerged sections along the reservoir (space); the water still to come, from integrating the
 * forecast inflow (time); and the decision needs the operating limit checked during the whole
 * storm, not only at its end, and the town's limit on the release.
 *
 * Everything that appears in more than one document comes from compute(scenario). The default
 * scenario ("book") is the one in the book (chapter 08_the_dam_committee.tex). The kit
 * (kit/cc-generator.js) adds the printing and distribution guide, the presentation (00), the
 * packets, the complete file and the ZIPs.
 */
(function (root) {
  "use strict";
  const PDF = () => root.CCPdf;

  // ------------------------------------------------------------------------------ data
  /**
   * k: area law A(x) = k x^2 (x in m, A in m^2) over 0 <= x <= L, surveyed every `step` m;
   * a, b: forecast inflow q(t) = a + b t (millions of m^3 per hour) for 0 <= t <= 3;
   * limit: operating limit (millions of m^3); options: the constant releases on the table;
   * town: the largest release the town accepts; gate: the gate's capacity; update: the
   * last-minute underestimate of the forecast (closing class). Both scenarios keep every
   * integral exact and leave exactly one admissible option, the town's limit itself.
   */
  const SCENARIOS = {
    book: { k: 0.0168, L: 2000, step: 500, a: 0.8, b: 0.4, limit: 48, options: [0, 0.25, 0.4, 0.5], town: 0.4, gate: 0.5, update: 0.05 },
    second: { k: 0.015, L: 2000, step: 500, a: 1.1, b: 0.6, limit: 45, options: [0, 0.3, 0.45, 0.6], town: 0.45, gate: 0.6, update: 0.05 },
  };
  /** The precedent of the town's sheet: a weakening storm whose maximum falls inside [0, 3]. */
  const PRECEDENT = { below: 0.7, a: 1.2, b: -0.4, r: 0.4 };

  function compute(id) {
    const S = Object.assign({ id }, SCENARIOS[id] || SCENARIOS.book);
    const xs = []; for (let x = 0; x <= S.L + 1e-9; x += S.step) xs.push(x);
    S.xs = xs;
    S.areas = xs.map((x) => Math.round(S.k * x * x));
    const dx = S.step;
    S.left = S.areas.slice(0, -1).reduce((s, A) => s + A * dx, 0) / 1e6;
    S.right = S.areas.slice(1).reduce((s, A) => s + A * dx, 0) / 1e6;
    S.trap = (S.left + S.right) / 2;
    S.V0 = (S.k * Math.pow(S.L, 3)) / 3 / 1e6;                 // millions of m^3
    S.q = (t) => S.a + S.b * t;
    S.q3 = S.q(3);
    S.half = S.a * 0.5 + (S.b * 0.25) / 2;                     // inflow in the first half hour
    S.inflow = 3 * S.a + 4.5 * S.b;
    S.V = (t, r) => S.V0 + S.a * t + (S.b / 2) * t * t - r * t;
    S.rows = S.options.map((r) => {
      let max = -Infinity, at = 0;
      for (let k = 0; k <= 300; k += 1) { const v = S.V(k / 100, r); if (v > max + 1e-12) { max = v; at = k / 100; } }
      const end = S.V(3, r);
      return { r, out: 3 * r, end, max, at, storage: max <= S.limit + 1e-9, town: r <= S.town + 1e-9, ok: max <= S.limit + 1e-9 && r <= S.town + 1e-9 };
    });
    S.rmin = (S.V0 + S.inflow - S.limit) / 3;
    S.choice = S.rows.find((o) => o.ok);
    S.margin = S.limit - S.choice.end;
    S.epsMax = S.margin / 3;
    S.updated = S.choice.end + 3 * S.update;
    const P = Object.assign({}, PRECEDENT);
    P.V0 = S.limit - P.below;
    P.net = P.a - P.r;                                          // V = V0 + net t + (b/2) t^2
    P.V = (t) => P.V0 + P.net * t + (P.b / 2) * t * t;
    P.tmax = -P.net / P.b;
    P.max = P.V(P.tmax);
    P.end = P.V(3);
    P.inflow = 3 * P.a + 4.5 * P.b;
    // V(t) = limit  <=>  (b/2) t^2 + net t + (V0 - limit) = 0
    const A2 = P.b / 2, disc = P.net * P.net - 4 * A2 * (P.V0 - S.limit);
    P.t1 = (-P.net + Math.sqrt(disc)) / (2 * A2);
    P.t2 = (-P.net - Math.sqrt(disc)) / (2 * A2);
    if (P.t1 > P.t2) [P.t1, P.t2] = [P.t2, P.t1];
    S.P = P;
    return S;
  }

  // ------------------------------------------------------------------------------ formatting
  const fx = (v, d = 2) => (Math.abs(v) < 5e-13 ? 0 : v).toFixed(d);
  const nm = (v, d = 4) => String(Number((Math.abs(v) < 5e-13 ? 0 : v).toFixed(d)));
  const rate = (r) => (r === 0 ? "0" : r.toFixed(2));
  const and = (X, arr) => (arr.length < 2 ? arr.join("") : `${arr.slice(0, -1).join(", ")}${X.t(" y ", " and ")}${arr[arr.length - 1]}`);
  const or = (X, arr) => (arr.length < 2 ? arr.join("") : `${arr.slice(0, -1).join(", ")}${X.t(" o ", " or ")}${arr[arr.length - 1]}`);
  /** "+ 0.4t", "− 0.4t" for a polynomial term written after another one. */
  const term = (c, s) => `${c < 0 ? "-" : "+"} ${nm(Math.abs(c))}${s}`;
  const hm = (h, X) => { const tot = Math.round(h * 60), H = Math.floor(tot / 60), M = tot % 60; return H ? `${H} h ${M} min` : `${M} min`; };

  // ------------------------------------------------------------------------------ drawing
  function poly(doc, pts, style, closed = true) {
    const segs = [];
    for (let i = 1; i < pts.length; i += 1) segs.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
    doc.lines(segs, pts[0][0], pts[0][1], [1, 1], style, closed);
  }
  function label(doc, text, x, y, opts = {}) {
    doc.setFont("SFSans", opts.bold ? "bold" : opts.italic ? "italic" : "normal").setFontSize(opts.size || 8.5).setTextColor(...(opts.color || PDF().CC.ink));
    doc.text(String(text), x, y, { align: opts.align || "left" });
  }
  const WATER = [214, 230, 240], GROUND = [120, 112, 100];

  /** Plan of the reservoir with the five surveyed sections and a cross-section (Sheet B). */
  function drawSurvey(w, X) {
    const { doc, CC } = w, S = X.S, t = X.t, H = 50;
    w.ensure(H + 12);
    const y0 = w.y + 2, x0 = w.margin, pw = w.W() * 0.6, gx = x0 + 6, gw = pw - 14;
    const cy = y0 + H * 0.45, px = (x) => gx + (x / S.L) * gw;
    const hw = (x) => 1.5 + 15 * (x / S.L);
    const upper = [], lower = [];
    for (let k = 0; k <= 60; k += 1) {
      const x = (k / 60) * S.L;
      upper.push([px(x), cy - hw(x) * (1 + 0.1 * Math.sin(x / 150))]);
      lower.push([px(x), cy + hw(x) * (1 + 0.1 * Math.cos(x / 210))]);
    }
    // river in and out
    doc.setDrawColor(...CC.blue).setLineWidth(0.6);
    poly(doc, [[x0, cy + 1.5], [gx - 2, cy + 0.6], [px(0), cy]], "S", false);
    poly(doc, [[px(S.L) + 2.2, cy], [x0 + pw + 4, cy + 2.5], [x0 + pw + 10, cy + 2]], "S", false);
    doc.setFillColor(...WATER).setDrawColor(...CC.blue).setLineWidth(0.35);
    poly(doc, upper.concat(lower.slice().reverse()), "FD");
    // dam wall
    const top = upper[upper.length - 1][1] - 3, bot = lower[lower.length - 1][1] + 3;
    doc.setFillColor(...CC.ink).rect(px(S.L), top, 2.2, bot - top, "F");
    label(doc, t("presa", "dam"), px(S.L) + 1.1, top - 1.5, { align: "center", bold: true });
    label(doc, t("río", "river"), x0, cy - 2, {});
    // sections
    doc.setDrawColor(...CC.orange).setLineWidth(0.3).setLineDashPattern([1.2, 0.9], 0);
    S.xs.forEach((x, i) => {
      const k = Math.round((x / S.L) * 60), u = upper[k][1], l = lower[k][1];
      doc.line(px(x), u - 2, px(x), l + 2);
    });
    doc.setLineDashPattern([], 0);
    const ay = y0 + H - 4;
    doc.setDrawColor(...CC.ink).setLineWidth(0.25).line(px(0), ay, px(S.L) + 6, ay);
    doc.setFillColor(...CC.ink).triangle(px(S.L) + 6, ay, px(S.L) + 4, ay - 1, px(S.L) + 4, ay + 1, "F");
    S.xs.forEach((x) => { doc.line(px(x), ay - 1, px(x), ay + 1); label(doc, String(x), px(x), ay + 4, { align: "center" }); });
    w.rich("$x$ (m)", { x: px(S.L) + 7, y: ay + 1, width: 20, size: 9.5 });
    // cross-section inset
    const ix = x0 + pw + 14, iw = w.W() - pw - 14, iy = y0 + 4, ih = H - 16;
    const bx = ix + iw / 2, by = iy + ih, lvl = iy + ih * 0.22;
    const wl = (yy) => bx - ((by - yy) / ih) * iw * 0.48, wr = (yy) => bx + ((by - yy) / ih) * iw * 0.48;
    doc.setFillColor(...WATER).setDrawColor(...CC.blue).setLineWidth(0.3);
    poly(doc, [[wl(lvl), lvl], [wr(lvl), lvl], [bx, by]], "FD");
    doc.setDrawColor(...GROUND).setLineWidth(0.6);
    poly(doc, [[wl(iy), iy], [bx, by], [wr(iy), iy]], "S", false);
    for (let k = 1; k < 9; k += 1) {   // ground hatching
      const yy = iy + (k / 9) * ih;
      doc.setLineWidth(0.15).line(wl(yy), yy, wl(yy) - 2.2, yy + 2.2);
      doc.line(wr(yy), yy, wr(yy) + 2.2, yy + 2.2);
    }
    w.rich("$A(x)$", { x: bx - 5, y: lvl + (by - lvl) * 0.42, width: 12, size: 10.5 });
    label(doc, t("nivel del agua", "water level"), bx, lvl - 1.3, { size: 8.5, color: CC.blue, align: "center" });
    label(doc, t("sección transversal en x", "cross-section at x"), bx, by + 4.5, { align: "center", size: 8.5, color: CC.muted });
    w.y = y0 + H + 5;
    w.caption(t(`Esquema del embalse, no a escala: las secciones del levantamiento, desde el extremo aguas arriba ($x = 0$) hasta la presa ($x = ${S.L}$ m). A la derecha, una sección: el área sumergida $A(x)$ es la zona azul.`,
      `Sketch of the reservoir, not to scale: the surveyed sections, from the upstream end ($x = 0$) to the dam ($x = ${S.L}$ m). On the right, one section: the submerged area $A(x)$ is the blue region.`));
  }

  /** The forecast inflow and the gate's capacity (Sheet C). */
  function drawHydrograph(w, X, h) {
    const S = X.S, t = X.t, { doc, CC } = w, ymax = Math.ceil((S.q3 + 0.3) * 2) / 2;
    const G = w.grid({ w: w.W() - 34, h, xmin: 0, xmax: 3, ymin: 0, ymax, xstep: 0.5, ystep: 0.5, xMinor: 2, yMinor: 5, xLabel: "t", yLabel: t("$q(t)$, caudal entrante (millones de m³/h)", "$q(t)$, inflow (millions of m³/h)"), x: w.margin + 10 });
    doc.setDrawColor(...CC.blue).setLineWidth(0.9).line(G.X(0), G.Y(S.q(0)), G.X(3), G.Y(S.q3));
    for (let k = 0; k <= 6; k += 1) { doc.setFillColor(...CC.blue); doc.circle(G.X(k / 2), G.Y(S.q(k / 2)), 0.8, "F"); }
    doc.setDrawColor(...CC.orange).setLineWidth(0.5).setLineDashPattern([1.6, 1.1], 0).line(G.X(0), G.Y(S.gate), G.X(3), G.Y(S.gate));
    doc.setLineDashPattern([], 0);
    label(doc, t(`capacidad de la compuerta, ${rate(S.gate)}`, `gate capacity, ${rate(S.gate)}`), G.X(0.08), G.Y(S.gate) - 1.4, { color: CC.orange, size: 8.5 });
    label(doc, t("previsión", "forecast"), G.X(2.55), G.Y(S.q(2.55)) - 2.2, { color: CC.blue, size: 8.5, bold: true, align: "right" });
  }

  /** Storage over time for every option, with the limit (solutions). */
  function drawStorage(w, X, h) {
    const S = X.S, t = X.t, { doc, CC } = w;
    const ymin = Math.floor(S.V0), ymax = Math.ceil(S.rows[0].end) + 1;
    const gw = w.W() - 68;
    const G = w.grid({ w: gw, h, xmin: 0, xmax: 3, ymin, ymax, xstep: 0.5, ystep: 1, xMinor: 2, yMinor: 2, xLabel: "t", yLabel: t("$V(t)$ (millones de m³)", "$V(t)$ (millions of m³)"), hlines: [S.limit], x: w.margin + 8 });
    const styles = [[CC.muted, [0.6, 0.8], 0.45], [CC.orange, [2, 1], 0.5], [CC.blue, [], 0.9], [CC.stamp, [3, 1, 0.6, 1], 0.5]];
    const lx = G.gx + gw + 7, key = (i, col, dash, lw, text) => {
      const ly = G.gy + 4 + i * 6.5;
      doc.setDrawColor(...col).setLineWidth(lw).setLineDashPattern(dash, 0).line(lx, ly - 1, lx + 8, ly - 1); doc.setLineDashPattern([], 0);
      w.rich(text, { x: lx + 10, y: ly, width: 42, size: 9.5, family: "SFSans" });
    };
    S.rows.forEach((o, i) => {
      const [col, dash, lw] = styles[i % styles.length];
      doc.setDrawColor(...col).setLineWidth(lw).setLineDashPattern(dash, 0);
      const pts = []; for (let k = 0; k <= 30; k += 1) pts.push([G.X(k / 10), G.Y(S.V(k / 10, o.r))]);
      poly(doc, pts, "S", false);
      doc.setLineDashPattern([], 0);
      key(i, col, dash, lw, `$r = ${rate(o.r)}$${o.ok ? t(" (admisible)", " (admissible)") : ""}`);
    });
    key(S.rows.length, CC.stamp, [1.2, 1], 0.3, t(`límite, ${S.limit}`, `limit, ${S.limit}`));
  }

  /** Questions whose answer spaces share the rest of the page (ESTANDAR 4.2). */
  function questions(w, items, tail) {
    const G = 7.5, head = (it) => w.measure(`**${it.label}** ${it.text}`, { gap: 1.5 });
    const need = (it) => head(it) + (it.drawH || 0) + (it.min || 2) * G + 4;
    items.forEach((it, i) => {
      const rest = items.slice(i);
      const plan = () => {
        const room = w.room();
        let used = 0, m = 0;
        for (let j = 0; j < rest.length; j += 1) {
          const n = need(rest[j]) + (j === rest.length - 1 && tail ? tail.h : 0);
          if (used + n > room) break;
          used += n; m += 1;
        }
        return { room, used, m };
      };
      let p = plan();
      if (p.m === 0) { w.page(); p = plan(); }
      const wt = rest.slice(0, Math.max(1, p.m)).reduce((s, r) => s + (r.weight || 1), 0);
      const extra = Math.max(0, Math.floor(((p.room - p.used) * (it.weight || 1)) / wt / G));
      w.paragraph(`**${it.label}** ${it.text}`, { gap: 1.5 });
      if (it.draw) it.draw(w);
      w.lines((it.min || 2) + extra, G);
    });
    if (tail) { if (w.room() < tail.h) w.page(); tail.draw(w); }
  }
  /** The box with what a specialist brings to the committee meeting. */
  function bring(w, X, items) {
    return {
      h: 13 + Math.ceil(items.length / 2) * 17,
      draw: (ww) => { ww.heading(X.t("Para la reunión del comité", "For the committee meeting"), { compact: true, keep: 18 }); ww.answers(items, { cols: 2, h: 14 }); },
    };
  }

  // ------------------------------------------------------------------------------ documents
  const kick = (X, sheet) => `${X.t("Expediente", "Case file")} · ${X.names.reservoir} · ${sheet}`;
  const REST = (X) => X.t("RESERVADO", "RESTRICTED");

  function sheetA(w, X) {
    const { t, S, names } = X, opts = or(X, S.options.map(rate));
    w.title(t("Hoja A · La pregunta del comité", "Sheet A · The committee's question"), kick(X, t("Hoja A", "Sheet A")), REST(X));
    w.meta([[t("Para", "To"), t(`Comité de operación del embalse de ${names.reservoir}`, `Operating committee of the ${names.reservoir} reservoir`)],
      [t("De", "From"), t("El inspector jefe", "The Chief Inspector")],
      [t("Reunión", "Meeting"), t("La próxima clase, tres horas antes de la tormenta", "Next class, three hours before the storm")]]);
    w.paragraph(t(`El embalse de ${names.reservoir} está cerca de su límite de operación y una tormenta avanza hacia el valle. Durante las tres horas que dure, el río traerá al embalse mucha más agua de la habitual. Seis kilómetros aguas abajo está ${names.town}: si la presa suelta demasiada agua, se inundan sus calles bajas. El consultor dejó este expediente sin recomendación, solo con una nota a lápiz en la carpeta: *«Primero, cuánto hay. Después, cuánto llega y cuánto sale. Y en cada paso, las unidades.»* La unidad necesita una recomendación que pueda comprobarse línea a línea.`,
      `The ${names.reservoir} reservoir is close to its operating limit and a storm is moving toward the valley. For the three hours it lasts, the river will bring far more water than usual. Six kilometers downstream lies ${names.town}: if the dam releases too much water, its lower streets flood. The consultant left this file without a recommendation, only with a pencilled note on the folder: *"First, how much there is. Then, how much comes in and how much goes out. And at every step, the units."* The unit needs a recommendation that can be checked line by line.`));
    w.callout(t(`**La pregunta del comité.** Según la regla de operación, el embalse no puede almacenar más de **${S.limit} millones de m³ en ningún momento** de la tormenta. La compuerta suelta un caudal constante. ¿Qué desembalse, de entre ${opts} millones de m³ por hora, lo garantiza sin dañar a ${names.town}? Nadie del comité tiene toda la información: hace falta lo que sabe cada especialista.`,
      `**The committee's question.** Under the operating rule, the reservoir may not hold more than **${S.limit} million m³ at any moment** of the storm. The gate releases a constant flow. Which release, among ${opts} million m³ per hour, guarantees this without harming ${names.town}? Nobody on the committee holds all the information: you need what each specialist knows.`), "blue");
    w.heading(t("El comité", "The committee"), { keep: 40 });
    w.table([t("Especialidad", "Specialty"), t("Hoja", "Sheet"), t("Qué tiene", "What they have"), t("Qué trae a la reunión", "What they bring to the meeting")], [
      [t("Topografía", "Topography"), "B", t("El levantamiento de las secciones sumergidas del embalse", "The survey of the reservoir's submerged sections"), t("El volumen almacenado ahora, con unidades, y el modelo usado", "The volume stored now, with units, and the model used")],
      [t("Hidrología", "Hydrology"), "C", t("La previsión del caudal que entrará durante la tormenta", "The forecast of the inflow during the storm"), t("El agua que entrará en tres horas y la fórmula del volumen en cada instante", "The water that will flow in over three hours and the formula for the volume at each moment")],
      [t("Municipio", "Town"), "D", t(`El límite de ${names.town} y el informe de una tormenta anterior`, `${names.town}'s limit and the report of an earlier storm`), t("Qué caudales admite el pueblo y cómo se comprueba un límite durante toda la tormenta", "Which releases the town accepts and how a limit is checked during the whole storm")],
    ], [26, 12, 72, 70], { boldFirst: true, tight: true });
    w.heading(t("Normas del comité", "Committee rules"), { keep: 30 });
    w.bullets(t([
      "Cada especialista resuelve su propia hoja antes de la reunión. En la reunión no enseñéis vuestra hoja: explicad lo que sabéis y cómo lo habéis calculado.",
      "Unidades en cada paso: volúmenes en millones de m³, caudales en millones de m³ por hora y tiempos en horas desde el comienzo de la tormenta.",
      "Traed a la reunión esta hoja y la de vuestra especialidad, resuelta. El reverso de esta hoja se completa entre los tres.",
      "El comité firma una sola recomendación, y tiene que poder comprobarse línea a línea.",
    ], [
      "Each specialist solves their own sheet before the meeting. At the meeting, do not show your sheet: explain what you know and how you calculated it.",
      "Units at every step: volumes in millions of m³, flows in millions of m³ per hour and times in hours from the start of the storm.",
      "Bring this sheet and your completed specialty sheet to the meeting. The back of this sheet is filled in by the three of you.",
      "The committee signs a single recommendation, and it must be possible to check it line by line.",
    ]), false, { gap: 1.2 });
    if (w.room() > 40) { w.sub(t("Notas para la reunión", "Notes for the meeting"), 14); w.lines("fill"); }
    // the decision page, completed in the meeting
    w.page();
    w.heading(t("La decisión del comité", "The committee's decision"));
    w.paragraph(t("Completadla en la reunión, con los resultados de los tres especialistas.", "Fill it in at the meeting, with the three specialists' results."), { gap: 2 });
    w.answers([t("Volumen inicial, $V_0$ (millones de m³)", "Initial volume, $V_0$ (millions of m³)"), t("Entrada en 3 h (millones de m³)", "Inflow over 3 h (millions of m³)"), t("Volumen tras $t$ horas con desembalse $r$, $V(t)$", "Volume after $t$ hours with release $r$, $V(t)$")], { cols: 3, h: 15 });
    w.table([t("Desembalse $r$ (millones de m³/h)", "Release $r$ (millions of m³/h)"), t("Agua soltada en 3 h", "Water released in 3 h"), "$V(3)$", t("Máximo de $V$ en [0, 3]", "Maximum of $V$ on [0, 3]"), t("¿Lo admite el pueblo?", "Does the town accept it?"), t("¿Admisible?", "Admissible?")],
      S.options.map((r) => [rate(r), "", "", "", "", ""]), [30, 26, 22, 30, 28, 22], { minRow: 10, boldFirst: true });
    const rec = 26 + 28 + 22 + 20;
    const gh = Math.max(36, Math.min(80, w.room() - rec - 22));
    const ymin = Math.floor(S.V0), ymax = Math.ceil(S.rows[0].end) + 1;
    w.grid({ w: w.W() - 14, h: gh, xmin: 0, xmax: 3, ymin, ymax, xstep: 0.5, ystep: 1, xMinor: 2, yMinor: 2, xLabel: "t", yLabel: t("$V(t)$ (millones de m³): dibujad el volumen con el caudal que recomendáis", "$V(t)$ (millions of m³): draw the volume with the release you recommend"), hlines: [S.limit], x: w.margin + 9 });
    w.heading(t("Recomendación del comité", "The committee's recommendation"), { compact: true, keep: 60 });
    w.answers([t("Desembalse recomendado (millones de m³/h)", "Recommended release (millions of m³/h)"), t("Margen al final de la tormenta (millones de m³)", "Margin at the end of the storm (millions of m³)")], { cols: 2, h: 14 });
    const just = Math.max(18, w.room() - 22 - 18);
    w.answers([t("Por qué el embalse no supera el límite en ningún instante y por qué se descartan las otras opciones", "Why the reservoir does not exceed the limit at any moment and why the other options are ruled out")], { cols: 1, h: just * 0.62 });
    w.answers([t("Qué dato nuevo nos obligaría a revisar la recomendación", "What new piece of information would force us to revise the recommendation")], { cols: 1, h: Math.max(14, just * 0.38 - 3) });
    w.answers([t("Firma · topografía", "Signed · topography"), t("Firma · hidrología", "Signed · hydrology"), t("Firma · municipio", "Signed · town")], { cols: 3, h: 14 });
  }

  function sheetB(w, X) {
    const { t, S, names } = X;
    w.title(t("Hoja B · Levantamiento del embalse", "Sheet B · Reservoir survey"), kick(X, t("Hoja B · Topografía", "Sheet B · Topography")), REST(X));
    w.meta([[t("Especialidad", "Specialty"), t("Topografía", "Topography")], [t("De", "From"), t(`Marta Ibarra, oficina técnica de la presa de ${names.reservoir}`, `Marta Ibarra, technical office of the ${names.reservoir} dam`)], [t("Levantamiento", "Survey"), t("Esta mañana, al nivel actual del agua", "This morning, at the present water level")]]);
    w.paragraph(t(`Al nivel actual del agua, hemos medido las áreas transversales sumergidas $A(x)$ a lo largo del embalse, donde $x$ es la distancia en metros desde su extremo aguas arriba. La presa está en $x = ${S.L}$ m. Para esta estimación, la oficina técnica propone una ley cuadrática para el área que se ajuste a los datos. Encontradla e integradla desde $x = 0$ hasta $x = ${S.L}$ m: el comité necesita saber cuánta agua hay ya en el embalse antes de que llegue la tormenta.`,
      `At the present water level, we measured the submerged transverse areas $A(x)$ along the reservoir, where $x$ is the distance in meters from its upstream end. The dam is at $x = ${S.L}$ m. For this estimate, the technical office proposes a quadratic law for the area that fits the data. Find it and integrate it from $x = 0$ to $x = ${S.L}$ m: the committee needs to know how much water the reservoir already holds before the storm arrives.`));
    w.table([`$x$ (m)`, ...S.xs.map(String)], [[t("$A(x)$ (m²)", "$A(x)$ (m²)"), ...S.areas.map(String)]], [34, ...S.xs.map(() => 22)], { boldFirst: true });
    drawSurvey(w, X);
    questions(w, [
      { label: t("1. El modelo.", "1. The model."), text: t(`Escribe una ley $A(x) = kx^2$ que reproduzca la tabla: calcula $k$ con un dato y comprueba los demás. ¿Qué unidades tiene $k$?`, `Write a law $A(x) = kx^2$ that reproduces the table: find $k$ from one value and check the others. What are the units of $k$?`), min: 3 },
      { label: t("2. Láminas.", "2. Slices."), text: t(`Imagina el embalse cortado en láminas de ${S.step} m de espesor. ¿Qué representa el producto $A(x)\\Delta x$, y en qué unidades? Dibuja en la cuadrícula los rectángulos de la suma por la izquierda y calcula las sumas por la izquierda y por la derecha.`, `Imagine the reservoir cut into slices ${S.step} m thick. What does the product $A(x)\\Delta x$ represent, and in what units? Draw the rectangles of the left sum on the grid and compute the left and right sums.`), min: 3,
        drawH: 54, draw: (ww) => ww.grid({ w: ww.W() - 30, h: 40, xmin: 0, xmax: S.L, ymin: 0, ymax: Math.ceil(S.areas[S.areas.length - 1] / 10000) * 10, xstep: S.step, ystep: 10, xMinor: 2, yMinor: 2, xLabel: "x", yLabel: t("$A(x)$ (miles de m²)", "$A(x)$ (thousands of m²)"), marks: S.xs.map((x, i) => [x, S.areas[i] / 1000]), x: ww.margin + 10 }) },
      { label: t("3. La integral.", "3. The integral."), text: t(`Calcula $V_0 = \\int_0^{${S.L}} A(x) dx$ y exprésalo en millones de m³. ¿Por qué no coincide con ninguna de las dos sumas? ¿Entre cuáles queda, y por qué?`, `Compute $V_0 = \\int_0^{${S.L}} A(x) dx$ and express it in millions of m³. Why does it not match either sum? Between which values does it lie, and why?`), min: 3, weight: 1.3 },
      { label: t("4. Lo que el modelo no sabe.", "4. What the model does not know."), text: t("Cinco secciones no determinan el valle. ¿Qué tendría que ocurrir entre dos secciones para que el volumen real fuera distinto del de tu modelo? ¿Lo dirías en la reunión?", "Five sections do not determine the valley. What would have to happen between two sections for the real volume to differ from your model's? Would you say so at the meeting?"), min: 2, weight: 0.8 },
    ], bring(w, X, [t("Volumen inicial $V_0$ (millones de m³)", "Initial volume $V_0$ (millions of m³)"), t("Modelo y supuesto principal", "Model and main assumption")]));
  }

  function sheetC(w, X) {
    const { t, S } = X;
    const qf = `${nm(S.a)} ${term(S.b, "t")}`;
    w.title(t("Hoja C · Previsión de la tormenta", "Sheet C · Storm forecast"), kick(X, t("Hoja C · Hidrología", "Sheet C · Hydrology")), REST(X));
    w.meta([[t("Especialidad", "Specialty"), t("Hidrología", "Hydrology")], [t("De", "From"), t("Andrés Pozo, servicio de hidrología, turno de guardia", "Andrés Pozo, hydrology service, duty shift")], [t("Validez", "Valid for"), t("Las tres horas de la tormenta, $0 \\le t \\le 3$", "The three hours of the storm, $0 \\le t \\le 3$")]]);
    w.paragraph(t(`Para $0 \\le t \\le 3$, con $t$ en horas desde el comienzo de la tormenta, el caudal que entrará en el embalse según la previsión es $q(t) = ${qf}$ millones de m³ por hora. La compuerta de desembalse permite cualquier caudal constante de hasta ${rate(S.gate)} millones de m³ por hora. Integrad la previsión y escribid después una fórmula para el volumen almacenado tras $t$ horas si el desembalse elegido es $r$.`,
      `For $0 \\le t \\le 3$, with $t$ in hours from the start of the storm, the forecast inflow into the reservoir is $q(t) = ${qf}$ million m³ per hour. The release gate allows any constant flow up to ${rate(S.gate)} million m³ per hour. Integrate the forecast and then write a formula for the volume stored after $t$ hours if the chosen release is $r$.`));
    const ts = [0, 0.5, 1, 1.5, 2, 2.5, 3];
    w.table([t("$t$ (h)", "$t$ (h)"), ...ts.map(nm)], [[t("$q(t)$ (millones de m³/h)", "$q(t)$ (millions of m³/h)"), ...ts.map((x) => fx(S.q(x), 1))]], [44, ...ts.map(() => 19)], { boldFirst: true });
    drawHydrograph(w, X, Math.max(42, Math.min(62, w.room() - 120)));
    w.caption(t("Hidrograma previsto por el servicio de hidrología, con la capacidad de la compuerta.", "Hydrograph forecast by the hydrology service, with the capacity of the gate."));
    questions(w, [
      { label: t("1. Media hora.", "1. Half an hour."), text: t("¿Cuánta agua entra en la primera media hora según la previsión? Calcúlalo como área bajo la gráfica y como integral, y di qué unidades se simplifican.", "How much water flows in during the first half hour according to the forecast? Compute it as an area under the graph and as an integral, and say which units cancel."), min: 3 },
      { label: t("2. Toda la tormenta.", "2. The whole storm."), text: t("Calcula la entrada total en tres horas, $\\int_0^3 q(t) dt$, con sus unidades. Compruébala como el área de un trapecio en el hidrograma.", "Compute the total inflow over three hours, $\\int_0^3 q(t) dt$, with its units. Check it as the area of a trapezoid on the hydrograph."), min: 3 },
      { label: t("3. El balance.", "3. The balance."), text: t("El embalse tiene $V_0$ millones de m³ al empezar y se desembalsa un caudal constante $r$. Escribe el volumen $V(t)$ tras $t$ horas, dejando $V_0$ y $r$ como letras. ¿El desembalse se suma o se resta?", "The reservoir holds $V_0$ million m³ at the start and a constant release $r$ flows out. Write the volume $V(t)$ after $t$ hours, keeping $V_0$ and $r$ as letters. Is the release added or subtracted?"), min: 3, weight: 1.2 },
      { label: t("4. La derivada.", "4. The derivative."), text: t(`¿Qué representa $V'(t)$? ¿Para qué valores de $r$ crece el volumen durante toda la tormenta? Con cualquier caudal que permita la compuerta, ¿dónde alcanza $V$ su máximo?`, `What does $V'(t)$ represent? For which values of $r$ does the volume increase during the whole storm? With any release the gate allows, where does $V$ reach its maximum?`), min: 3, weight: 1.2 },
    ], bring(w, X, [t("Entrada en 3 h (millones de m³)", "Inflow over 3 h (millions of m³)"), t("$V(t)$, con $V_0$ y $r$ como letras", "$V(t)$, with $V_0$ and $r$ as letters")]));
  }

  function sheetD(w, X) {
    const { t, S, names } = X, P = S.P;
    const qp = `${nm(P.a)} ${term(P.b, "t")}`;
    w.title(t(`Hoja D · ${names.town}, aguas abajo`, `Sheet D · ${names.town}, downstream`), kick(X, t("Hoja D · Municipio", "Sheet D · Town")), REST(X));
    w.meta([[t("Especialidad", "Specialty"), t("Representación municipal", "Town representative")], [t("De", "From"), t(`Lucía Ferrer, alcaldesa de ${names.town}`, `Lucía Ferrer, mayor of ${names.town}`)], [t("Para", "To"), t("Quien represente al municipio en el comité", "Whoever represents the town on the committee")]]);
    w.paragraph(t(`${names.town} está seis kilómetros aguas abajo de la presa. Con el río crecido por la tormenta, el cauce que atraviesa el pueblo admite como máximo un desembalse de **${rate(S.town)} millones de m³ por hora**: por encima, el agua sale a las calles bajas. Os pedimos que el comité no apruebe ningún caudal mayor, aunque la compuerta pueda soltarlo.`,
      `${names.town} lies six kilometers downstream of the dam. With the river swollen by the storm, the channel through the town can take a release of at most **${rate(S.town)} million m³ per hour**: above that, the water reaches the lower streets. We ask the committee not to approve any larger flow, even if the gate can release it.`));
    w.paragraph(t(`Os recuerdo también lo que pasó la primavera pasada. El informe de operación de aquella tormenta, que adjunto, concluyó que el embalse no había superado su límite. Sin embargo, aquel día el aliviadero de emergencia se abrió solo durante casi hora y media, y el agua llegó a nuestras huertas. Nadie supo explicarnos por qué.`,
      `Let me also remind you of what happened last spring. The operating report of that storm, attached, concluded that the reservoir had not exceeded its limit. Yet that day the emergency spillway opened by itself for almost an hour and a half, and the water reached our orchards. Nobody could explain to us why.`));
    w.callout(t(`**Límite municipal.** Durante la tormenta, el desembalse no puede superar ${rate(S.town)} millones de m³/h en ningún momento.`, `**The town's limit.** During the storm, the release may not exceed ${rate(S.town)} million m³/h at any moment.`), "warn");
    w.heading(t("Informe de operación · tormenta de la primavera pasada", "Operating report · last spring's storm"), { compact: true, keep: 40 });
    w.table([t("Dato", "Item"), t("Valor del informe", "Value in the report")], [
      [t("Volumen al comenzar la tormenta", "Volume at the start of the storm"), t(`${nm(P.V0)} millones de m³`, `${nm(P.V0)} million m³`)],
      [t("Caudal entrante, $0 \\le t \\le 3$ ($t$ en horas)", "Inflow, $0 \\le t \\le 3$ ($t$ in hours)"), t(`$q(t) = ${qp}$ millones de m³/h`, `$q(t) = ${qp}$ million m³/h`)],
      [t("Desembalse constante", "Constant release"), t(`${rate(P.r)} millones de m³/h`, `${rate(P.r)} million m³/h`)],
      [t("Límite de operación", "Operating limit"), t(`${S.limit} millones de m³`, `${S.limit} million m³`)],
      [t("Conclusión del informe", "Conclusion of the report"), t(`«Volumen final: ${nm(P.end)} < ${S.limit}. Límite respetado.»`, `"Final volume: ${nm(P.end)} < ${S.limit}. Limit respected."`)],
    ], [70, 110], { boldFirst: true, zebra: true, keep: true });
    questions(w, [
      { label: t("1. Las opciones.", "1. The options."), text: t(`El comité elegirá entre ${or(X, S.options.map(rate))} millones de m³/h. ¿Cuáles admite el pueblo? ¿Cuánta agua sale de la presa en las tres horas con cada una?`, `The committee will choose among ${or(X, S.options.map(rate))} million m³/h. Which ones does the town accept? How much water leaves the dam over the three hours with each one?`), min: 3 },
      { label: t("2. El precedente.", "2. The precedent."), text: t(`Escribe el volumen del embalse durante aquella tormenta, $V(t) = ${nm(P.V0)} + \\int_0^t (q(u) - ${rate(P.r)})du$, y comprueba el valor final del informe.`, `Write the volume of the reservoir during that storm, $V(t) = ${nm(P.V0)} + \\int_0^t (q(u) - ${rate(P.r)})du$, and check the final value in the report.`), min: 3 },
      { label: t("3. ¿Se respetó el límite?", "3. Was the limit respected?"), text: t(`Busca el máximo de $V(t)$ en $[0, 3]$ y dibuja $V$ en la cuadrícula. ¿Superó el embalse los ${S.limit} millones de m³? ¿Durante cuánto tiempo, aproximadamente? Explica lo del aliviadero.`, `Find the maximum of $V(t)$ on $[0, 3]$ and draw $V$ on the grid. Did the reservoir exceed ${S.limit} million m³? For roughly how long? Explain the spillway.`), min: 3, weight: 1.2,
        drawH: 52, draw: (ww) => ww.grid({ w: ww.W() - 24, h: 38, xmin: 0, xmax: 3, ymin: S.limit - 1, ymax: S.limit + 0.5, xstep: 0.5, ystep: 0.5, xMinor: 2, yMinor: 5, xLabel: "t", yLabel: t("$V(t)$ en la tormenta de la primavera pasada (millones de m³)", "$V(t)$ in last spring's storm (millions of m³)"), hlines: [S.limit], x: ww.margin + 10 }) },
      { label: t("4. La regla.", "4. The rule."), text: t("Escribe en una frase lo que el comité tiene que comprobar antes de aprobar un desembalse, y qué cálculo lo garantiza.", "Write in one sentence what the committee must check before approving a release, and which calculation guarantees it."), min: 2 },
    ], bring(w, X, [t("Desembalses que admite el pueblo", "Releases the town accepts"), t("La regla que defenderás en el comité", "The rule you will defend at the committee")]));
  }

  function check(w, X) {
    const { t } = X;
    w.title(t("Comprobación individual", "Individual check"), `Calculus Cases · ${t("Caso 5 · La presa", "Case 5 · The Dam")}`, null);
    w.answers([t("Nombre", "Name"), t("Comité", "Committee")], { cols: 2, h: 11 });
    w.paragraph(t("Responde solo, sin la hoja de tu especialidad.", "Answer on your own, without your specialty's sheet."), { italic: true, gap: 2 });
    w.paragraph(t("**1. Unidades.** Escribe las unidades de cada cantidad.", "**1. Units.** Write the units of each quantity."), { gap: 1.5 });
    w.table(["$A(x)$", "$\\int_0^{2000} A(x) dx$", "$q(t)$", "$\\int_0^3 q(t) dt$", "$V'(t)$"], [["", "", "", "", ""]], [1, 1, 1, 1, 1], { minRow: 12 });
    questions(w, [
      { label: t("2. Un intervalo de caudales.", "2. A range of releases."), text: t("Si el comité pudiera elegir cualquier desembalse constante $r$, y no solo los de la lista, ¿qué valores cumplirían a la vez el límite del embalse y el del pueblo? Justifícalo.", "If the committee could choose any constant release $r$, not only those on the list, which values would meet both the reservoir's limit and the town's? Justify your answer."), min: 3 },
      { label: t("3. El final no siempre basta.", "3. The end is not always enough."), text: t("En este caso bastaba con comprobar el volumen al final de la tormenta. ¿Por qué? ¿Bastaría siempre?", "In this case it was enough to check the volume at the end of the storm. Why? Would it always be enough?"), min: 3 },
      { label: t("4. Un depósito.", "4. A tank."), text: t("Un depósito empieza con 10 L, recibe $q(t) = 4 - 2t$ L/min durante $0 \\le t \\le 2$ y libera 1 L/min. ¿Respeta un límite de 12.1 L en todo momento? Justifícalo.", "A tank starts with 10 L, receives $q(t) = 4 - 2t$ L/min for $0 \\le t \\le 2$ and releases 1 L/min. Does it respect a limit of 12.1 L at every moment? Justify your answer."), min: 4, weight: 1.3 },
    ]);
  }

  // ------------------------------------------------------------------------------ teacher
  function committeeRows(X) {
    return X.room.groups.map((g) => [g.label, String(g.B), String(g.C), String(g.D), String(g.size)]);
  }

  function guide(w, X) {
    const { t, S, names, room } = X;
    w.title(t("Guía docente", "Teacher guide"), X.kicker, t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.paragraph(t(`La presa de ${names.reservoir} es un caso de integrales definidas como acumulación. Un comité de tres especialistas decide un desembalse constante antes de una tormenta. El volumen almacenado se obtiene integrando en el espacio las áreas de las secciones sumergidas; el agua que llegará, integrando en el tiempo un caudal, y la decisión exige comprobar el límite del embalse durante toda la tormenta, no solo al final, y respetar el límite del pueblo. Tú haces de inspector jefe: repartes las hojas, marcas el ritmo, presides la audiencia y pides cuentas, sin dar la respuesta.`,
      `The ${names.reservoir} dam is a case on definite integrals as accumulation. A committee of three specialists chooses a constant release before a storm. The stored volume comes from integrating the areas of the submerged sections across space; the water still to come, from integrating a flow across time; and the decision requires checking the reservoir's limit during the whole storm, not only at its end, and respecting the town's limit. You play the Chief Inspector: you hand out the sheets, set the pace, chair the hearing and ask for accounts, without giving the answer.`));
    w.heading(t("Esta generación", "This generation"), { keep: 40 });
    w.meta([[t("Clase", "Class"), t(`${room.students} estudiantes en ${room.groups.length} comités`, `${room.students} students in ${room.groups.length} committees`)],
      [t("Datos", "Data"), S.id === "book" ? t("Los del libro", "Those in the book") : t("Segunda tormenta (otros datos, misma estructura)", "Second storm (other data, same structure)")],
      [t("Nombres", "Names"), t(`Embalse de ${names.reservoir}; pueblo de ${names.town}`, `${names.reservoir} reservoir; the town of ${names.town}`)]]);
    w.table([t("Comité", "Committee"), t("Topografía (B)", "Topography (B)"), t("Hidrología (C)", "Hydrology (C)"), t("Municipio (D)", "Town (D)"), t("Estudiantes", "Students")], committeeRows(X), [36, 34, 34, 34, 30], { tight: true, zebra: true });
    if (room.note) w.paragraph(room.note, { size: 9.5, italic: true });
    w.heading(t("El formato", "The format"), { keep: 30 });
    w.bullets(t([
      "**Lanzamiento, los últimos 18 minutos de una clase.** Proyectas la presentación (00), formas los comités y repartes a cada estudiante la hoja A y la de su especialidad.",
      "**En casa, 45–60 minutos.** Cada especialista resuelve su hoja y lee la hoja A. Nadie tiene toda la información: la reunión del comité es la próxima clase.",
      "**Clase de cierre, 55 minutos.** Reunión del comité, decisión firmada, audiencia pública con un aviso de última hora, formalización y comprobación individual.",
    ], [
      "**Launch, the last 18 minutes of a class.** You project the presentation (00), form the committees and give every student Sheet A and the sheet of their specialty.",
      "**At home, 45–60 minutes.** Each specialist solves their sheet and reads Sheet A. Nobody holds all the information: the committee meets in the next class.",
      "**Closing class, 55 minutes.** Committee meeting, signed decision, public hearing with a last-minute warning, formalization and individual check.",
    ]));
    w.heading(t("El lanzamiento, minuto a minuto", "The launch, minute by minute"), { keep: 40 });
    w.table([t("Min.", "Min."), t("Qué haces", "What you do"), t("Diapositivas", "Slides")], t([
      ["3", "Dos preguntas en voz alta: el volumen que entra en media hora a 0.8 millones de m³/h (0.4 millones de m³) y si el volumen puede bajar cuando entra más agua de la que sale (no, con este balance). Si alguien suma un caudal a un volumen, escribe las unidades de $q\\Delta t$.", "4"],
      ["6", `La tormenta, el embalse de ${names.reservoir}, ${names.town} y lo que pide la unidad. Las tres cantidades del caso y sus unidades, sin resolver nada.`, "1–3, 5"],
      ["6", "Los tres especialistas y los comités de esta clase. Forma los comités y reparte: a cada estudiante, la hoja A y la de su especialidad.", "6–7"],
      ["3", "Lo que cada uno trae a la clase de cierre. Recuerda la norma: en la reunión se explica, no se enseña la hoja.", "8"],
    ], [
      ["3", "Two questions aloud: the volume that flows in over half an hour at 0.8 million m³/h (0.4 million m³) and whether the volume can fall when more water flows in than out (no, under this balance). If someone adds a flow to a volume, write out the units of $q\\Delta t$.", "4"],
      ["6", `The storm, the ${names.reservoir} reservoir, ${names.town} and what the unit asks for. The three quantities of the case and their units, without solving anything.`, "1–3, 5"],
      ["6", "The three specialists and this class's committees. Form the committees and hand out: to every student, Sheet A and the sheet of their specialty.", "6–7"],
      ["3", "What each of them brings to the closing class. Recall the rule: at the meeting you explain, you do not show your sheet.", "8"],
    ]), [12, 140, 28], { zebra: true });
    w.heading(t("En casa: lo que hace cada especialista", "At home: what each specialist does"), { keep: 30 });
    w.bullets(t([
      `**Topografía (B).** Ajusta $A(x) = ${S.k}x^2$ a la tabla, acota el volumen con las sumas de láminas de ${S.step} m (${nm(S.left)} y ${nm(S.right)} millones de m³) e integra: $V_0 = ${nm(S.V0)}$ millones de m³.`,
      `**Hidrología (C).** Integra la previsión: ${nm(S.inflow)} millones de m³ en tres horas. Escribe $V(t) = V_0 + ${nm(S.a)}t + ${nm(S.b / 2)}t^2 - rt$ y ve que $V'(t) = q(t) - r > 0$ con cualquier caudal de la compuerta.`,
      `**Municipio (D).** Aprende que el pueblo admite como mucho ${rate(S.town)} y descubre, con el precedente, que un valor final por debajo del límite (${nm(S.P.end)}) puede esconder un máximo por encima (${nm(S.P.max)}, en $t = ${nm(S.P.tmax)}$). Es quien defenderá en el comité que el límite se comprueba en cada instante.`,
    ], [
      `**Topography (B).** Fits $A(x) = ${S.k}x^2$ to the table, brackets the volume with the sums of ${S.step} m slices (${nm(S.left)} and ${nm(S.right)} million m³) and integrates: $V_0 = ${nm(S.V0)}$ million m³.`,
      `**Hydrology (C).** Integrates the forecast: ${nm(S.inflow)} million m³ in three hours. Writes $V(t) = V_0 + ${nm(S.a)}t + ${nm(S.b / 2)}t^2 - rt$ and sees that $V'(t) = q(t) - r > 0$ with any release the gate allows.`,
      `**Town (D).** Learns that the town accepts at most ${rate(S.town)} and discovers, with the precedent, that a final value below the limit (${nm(S.P.end)}) can hide a maximum above it (${nm(S.P.max)}, at $t = ${nm(S.P.tmax)}$). This is the person who will defend at the committee that the limit is checked at every moment.`,
    ]));
    w.heading(t("La clase de cierre, minuto a minuto", "The closing class, minute by minute"), { keep: 40 });
    w.table([t("Min.", "Min."), t("Qué pasa", "What happens"), t("Tu pregunta", "Your question")], closingPlan(X).map((r) => [r[0], r[1], r[2]]), [12, 104, 64], { zebra: true });
    w.heading(t("Lo que puedes oír", "What you may hear"), { keep: 30 });
    w.table([t("Se oye", "You hear"), t("Qué revela", "What it reveals"), t("Pregunta que hace avanzar", "Question that moves things on")], t([
      [`«Sumamos ${nm(S.V0)} y ${nm(S.q(0))}.»`, "Un caudal sumado a un volumen.", "¿Qué unidades tiene cada número? ¿Qué hay que hacer con un caudal para obtener un volumen?"],
      [`«El volumen es ${nm(S.left)}.»`, "Una suma finita tomada por el volumen.", "¿La suma por la derecha da lo mismo? ¿Qué pasa si las láminas son más finas?"],
      [`«Con ${rate(S.options[S.options.length - 1])} es con la que menos sube: esa.»`, "Se olvida la restricción del pueblo.", "¿Qué dice la representante del municipio?"],
      [`«$V(3)$ queda por debajo de ${S.limit}: es seguro.»`, "Se comprueba solo el final.", "¿Qué pasó en la tormenta de la primavera pasada? ¿Dónde es máximo $V$?"],
      ["«La presa es segura.»", "Se olvida que todo descansa en un modelo y una previsión.", "¿Y si entra más agua de la prevista? ¿Cuánta más aguanta vuestra decisión?"],
    ], [
      [`"We add ${nm(S.V0)} and ${nm(S.q(0))}."`, "A flow added to a volume.", "What are the units of each number? What must you do to a flow to get a volume?"],
      [`"The volume is ${nm(S.left)}."`, "A finite sum taken for the volume.", "Does the right sum give the same? What happens with thinner slices?"],
      [`"${rate(S.options[S.options.length - 1])} is the one where it rises least: that one."`, "The town's restriction is forgotten.", "What does the town's representative say?"],
      [`"$V(3)$ stays below ${S.limit}: it is safe."`, "Only the end is checked.", "What happened in last spring's storm? Where is $V$ largest?"],
      ["\"The dam is safe.\"", "It is forgotten that everything rests on a model and a forecast.", "And if more water comes in than forecast? How much more can your decision take?"],
    ]), [52, 52, 76], { zebra: true });
    w.heading(t("Si falta alguien", "If someone is missing"), { keep: 24 });
    w.paragraph(t("Un comité al que le falta un especialista en la clase de cierre puede seguir: dale el resultado de esa hoja como «dato del expediente» (está en el solucionario) y pide al comité que lo compruebe con un cálculo rápido. Si faltan dos, reparte a los presentes entre otros comités.",
      "A committee missing a specialist in the closing class can carry on: give it that sheet's result as \"a figure from the file\" (it is in the solutions) and ask the committee to check it with a quick calculation. If two are missing, spread those present over other committees."));
    w.heading(t("Evaluación", "Assessment"), { keep: 24 });
    w.bullets(t([
      "Las dos integrales, con su significado y sus unidades: área por espesor, caudal por tiempo.",
      "El balance $V(t) = V_0 + \\int_0^t (q - r)$, con el desembalse restando.",
      "El límite comprobado en todo el intervalo, con un argumento ($V' > 0$), no solo en $t = 3$.",
      "La decisión con las dos restricciones y los límites del modelo declarados.",
    ], [
      "The two integrals, with their meaning and units: area times thickness, flow times time.",
      "The balance $V(t) = V_0 + \\int_0^t (q - r)$, with the release subtracted.",
      "The limit checked over the whole interval, with an argument ($V' > 0$), not only at $t = 3$.",
      "The decision with both constraints, and the model's limits stated.",
    ]));
  }

  /** The closing class: [minutes, what happens, your question]; shared by the guide and the slides. */
  function closingPlan(X) {
    const { t, S, names } = X;
    return t([
      ["3", "Reabres la sesión: la tormenta llega en tres horas. Cada comité se sienta junto.", "¿Quién trae el agua que ya está y quién la que va a llegar?", "Se reabre la sesión; cada comité se sienta junto."],
      ["15", "Reunión del comité: cada especialista explica su resultado en tres minutos, sin enseñar su hoja. El comité completa la tabla de la hoja A.", "¿El desembalse se suma o se resta? ¿En qué unidades está cada número?", "Reunión del comité: cada especialista explica su resultado; tabla de la hoja A."],
      ["10", "Gráfica de $V(t)$ y recomendación firmada en la segunda página de la hoja A.", "¿Dónde es máximo el volumen? ¿Cómo lo sabéis?", "Gráfica de $V(t)$ y recomendación firmada."],
      ["12", `Audiencia pública: cada comité anuncia su caudal y una razón; el municipio defiende su límite. Aviso de última hora: la previsión puede quedarse corta en ${nm(S.update)} millones de m³/h.`, "¿Sigue en pie vuestra recomendación? ¿Cuánto error aguanta?", "Audiencia pública y aviso de última hora."],
      ["8", "Formalización: las dos integrales, $V'(t) > 0$, el intervalo de caudales admisibles y el margen.", "¿Qué integral midió el agua que ya estaba y cuál la que iba a llegar?", "Las dos integrales, el máximo y el margen."],
      ["7", "Comprobación individual.", "—", "Comprobación individual."],
    ], [
      ["3", "You reopen the session: the storm arrives in three hours. Each committee sits together.", "Who brings the water that is already there, and who the water still to come?", "The session reopens; each committee sits together."],
      ["15", "Committee meeting: each specialist explains their result in three minutes, without showing their sheet. The committee fills in the table on Sheet A.", "Is the release added or subtracted? In what units is each number?", "Committee meeting: each specialist explains their result; the table on Sheet A."],
      ["10", "Graph of $V(t)$ and the signed recommendation on the second page of Sheet A.", "Where is the volume largest? How do you know?", "Graph of $V(t)$ and the signed recommendation."],
      ["12", `Public hearing: each committee announces its release and one reason; the town defends its limit. Last-minute warning: the forecast may fall short by ${nm(S.update)} million m³/h.`, "Does your recommendation still stand? How much error can it take?", "Public hearing and a last-minute warning."],
      ["8", "Formalization: the two integrals, $V'(t) > 0$, the range of admissible releases and the margin.", "Which integral measured the water already there, and which the water still to come?", "The two integrals, the maximum and the margin."],
      ["7", "Individual check.", "—", "Individual check."],
    ]);
  }

  function solution(w, X) {
    const { t, S, names } = X, P = S.P;
    w.title(t("Solucionario", "Solutions"), X.kicker, t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.heading(t("Hoja B · Topografía", "Sheet B · Topography"));
    w.bullets(t([
      `**El modelo.** $k = ${S.areas[1]}/${S.xs[1]}^2 = ${S.k}$, y $A(x) = ${S.k}x^2$ reproduce los demás valores (por ejemplo, $${S.k}\\cdot ${S.L}^2 = ${S.areas[S.areas.length - 1]}$). $k$ no tiene unidades: m² entre m².`,
      `**Láminas.** $A(x)\\Delta x$ es el volumen aproximado de una lámina, en m³. Con láminas de ${S.step} m, la suma por la izquierda da ${nm(S.left)} millones de m³ y la suma por la derecha, ${nm(S.right)}. Como el área crece a lo largo del embalse, la primera se queda corta y la segunda se pasa.`,
      `**La integral.** $V_0 = \\int_0^{${S.L}} ${S.k}x^2 dx = ${S.k}\\cdot ${S.L}^3/3 = ${nm(S.V0 * 1e6, 0)}$ m³, es decir, **${nm(S.V0)} millones de m³**, entre las dos sumas. (La regla de los trapecios da ${nm(S.trap)}; la de Simpson, exacta para un polinomio de grado 2, da ${nm(S.V0)}.)`,
      "**Lo que el modelo no sabe.** Entre dos secciones el valle podría ensancharse o estrecharse sin que la tabla lo vea: la ley cuadrática es un modelo aceptado para esta decisión, no una medida del valle.",
    ], [
      `**The model.** $k = ${S.areas[1]}/${S.xs[1]}^2 = ${S.k}$, and $A(x) = ${S.k}x^2$ reproduces the other values (for instance, $${S.k}\\cdot ${S.L}^2 = ${S.areas[S.areas.length - 1]}$). $k$ has no units: m² over m².`,
      `**Slices.** $A(x)\\Delta x$ is the approximate volume of one slice, in m³. With ${S.step} m slices, the left sum gives ${nm(S.left)} million m³ and the right sum ${nm(S.right)}. Because the area grows along the reservoir, the first falls short and the second overshoots.`,
      `**The integral.** $V_0 = \\int_0^{${S.L}} ${S.k}x^2 dx = ${S.k}\\cdot ${S.L}^3/3 = ${nm(S.V0 * 1e6, 0)}$ m³, that is, **${nm(S.V0)} million m³**, between the two sums. (The trapezoidal rule gives ${nm(S.trap)}; Simpson's rule, exact for a polynomial of degree 2, gives ${nm(S.V0)}.)`,
      "**What the model does not know.** Between two sections the valley could widen or narrow without the table noticing: the quadratic law is a model accepted for this decision, not a measurement of the valley.",
    ]));
    w.heading(t("Hoja C · Hidrología", "Sheet C · Hydrology"));
    w.bullets(t([
      `**Media hora.** $\\int_0^{0.5} q(t) dt = ${nm(S.half)}$ millones de m³: las horas se simplifican.`,
      `**Toda la tormenta.** $\\int_0^3 (${nm(S.a)} ${term(S.b, "t")}) dt = ${nm(S.inflow)}$ millones de m³, el área del trapecio $(${nm(S.a)} + ${nm(S.q3)})/2\\cdot 3$.`,
      `**El balance.** $V(t) = V_0 + \\int_0^t (q(u) - r)du = V_0 + ${nm(S.a)}t + ${nm(S.b / 2)}t^2 - rt$. El desembalse resta.`,
      `**La derivada.** $V'(t) = q(t) - r$ es el ritmo neto de llenado. Como $q(t) \\ge ${nm(S.a)}$, el volumen crece en todo $[0, 3]$ si $r < ${nm(S.a)}$, y por tanto con cualquier caudal de la compuerta (hasta ${rate(S.gate)}): el máximo está en $t = 3$.`,
    ], [
      `**Half an hour.** $\\int_0^{0.5} q(t) dt = ${nm(S.half)}$ million m³: the hours cancel.`,
      `**The whole storm.** $\\int_0^3 (${nm(S.a)} ${term(S.b, "t")}) dt = ${nm(S.inflow)}$ million m³, the area of the trapezoid $(${nm(S.a)} + ${nm(S.q3)})/2\\cdot 3$.`,
      `**The balance.** $V(t) = V_0 + \\int_0^t (q(u) - r)du = V_0 + ${nm(S.a)}t + ${nm(S.b / 2)}t^2 - rt$. The release is subtracted.`,
      `**The derivative.** $V'(t) = q(t) - r$ is the net filling rate. Since $q(t) \\ge ${nm(S.a)}$, the volume increases on all of $[0, 3]$ if $r < ${nm(S.a)}$, and hence with any release the gate allows (up to ${rate(S.gate)}): the maximum is at $t = 3$.`,
    ]));
    w.heading(t("Hoja D · Municipio", "Sheet D · Town"));
    const adm = S.options.filter((r) => r <= S.town + 1e-9).map(rate);
    w.bullets(t([
      `**Las opciones.** El pueblo admite ${and(X, adm)}. En tres horas salen ${and(X, S.options.map((r) => nm(3 * r)))} millones de m³.`,
      `**El precedente.** $V(t) = ${nm(P.V0)} + ${nm(P.net)}t ${term(P.b / 2, "t^2")}$, y $V(3) = ${nm(P.end)}$, como dice el informe.`,
      `**¿Se respetó el límite?** No. $V'(t) = ${nm(P.net)} ${term(P.b, "t")}$ se anula en $t = ${nm(P.tmax)}$, donde $V = ${nm(P.max)} > ${S.limit}$. El embalse estuvo por encima del límite entre $t \\approx ${fx(P.t1)}$ y $t \\approx ${fx(P.t2)}$, unas ${hm(P.t2 - P.t1, X)}: por eso se abrió el aliviadero.`,
      `**La regla.** $V(t) \\le ${S.limit}$ para todo $t$ de $[0, 3]$, y no solo para $t = 3$; se garantiza buscando el máximo de $V$ (por ejemplo, con el signo de $V'$).`,
    ], [
      `**The options.** The town accepts ${and(X, adm)}. Over three hours, ${and(X, S.options.map((r) => nm(3 * r)))} million m³ flow out.`,
      `**The precedent.** $V(t) = ${nm(P.V0)} + ${nm(P.net)}t ${term(P.b / 2, "t^2")}$, and $V(3) = ${nm(P.end)}$, as the report says.`,
      `**Was the limit respected?** No. $V'(t) = ${nm(P.net)} ${term(P.b, "t")}$ vanishes at $t = ${nm(P.tmax)}$, where $V = ${nm(P.max)} > ${S.limit}$. The reservoir was above the limit between $t \\approx ${fx(P.t1)}$ and $t \\approx ${fx(P.t2)}$, about ${hm(P.t2 - P.t1, X)}: that is why the spillway opened.`,
      `**The rule.** $V(t) \\le ${S.limit}$ for every $t$ in $[0, 3]$, not only for $t = 3$; it is guaranteed by finding the maximum of $V$ (for instance, from the sign of $V'$).`,
    ]));
    w.heading(t("Hoja A · La decisión del comité", "Sheet A · The committee's decision"), { keep: 60 });
    w.paragraph(t(`$V_0 = ${nm(S.V0)}$, entrada de ${nm(S.inflow)} y $V(t) = ${nm(S.V0)} + ${nm(S.a)}t + ${nm(S.b / 2)}t^2 - rt$. Como $V$ crece con todas las opciones, su máximo es $V(3) = ${nm(S.V0 + S.inflow)} - 3r$.`, `$V_0 = ${nm(S.V0)}$, an inflow of ${nm(S.inflow)} and $V(t) = ${nm(S.V0)} + ${nm(S.a)}t + ${nm(S.b / 2)}t^2 - rt$. Since $V$ increases with every option, its maximum is $V(3) = ${nm(S.V0 + S.inflow)} - 3r$.`));
    const yes = t("sí", "yes"), no = t("no", "no");
    w.table([t("Desembalse $r$", "Release $r$"), t("Soltada en 3 h", "Released in 3 h"), "$V(3)$", t("Máximo de $V$", "Maximum of $V$"), t("¿Lo admite el pueblo?", "Does the town accept it?"), t("¿Admisible?", "Admissible?")],
      S.rows.map((o) => [rate(o.r), nm(o.out), fx(o.end), `${fx(o.max)} ${t("en", "at")} $t = 3$`, o.town ? yes : no, o.ok ? `**${yes}**` : no]), [24, 24, 20, 34, 30, 22], { boldFirst: true, keep: true });
    drawStorage(w, X, Math.max(38, Math.min(58, w.room() - 82)));
    w.paragraph(t(`**Recomendación: ${rate(S.choice.r)} millones de m³/h.** Es la única opción que respeta a la vez el límite del embalse ($V(3) = ${fx(S.choice.end)} \\le ${S.limit}$) y el del pueblo. La opción que más baja el embalse, ${rate(S.options[S.options.length - 1])}, es justo la que ${names.town} no puede aceptar. Si el comité pudiera elegir cualquier caudal, valdría $${nm(S.V0 + S.inflow - S.limit)}/3 \\le r \\le ${rate(S.town)}$ ($${nm(S.V0 + S.inflow - S.limit)}/3 \\approx ${fx(S.rmin, 3)}$): la unicidad viene de la lista de opciones, no de las matemáticas.`,
      `**Recommendation: ${rate(S.choice.r)} million m³/h.** It is the only option that respects both the reservoir's limit ($V(3) = ${fx(S.choice.end)} \\le ${S.limit}$) and the town's. The option that lowers the reservoir most, ${rate(S.options[S.options.length - 1])}, is exactly the one ${names.town} cannot accept. If the committee could choose any release, $${nm(S.V0 + S.inflow - S.limit)}/3 \\le r \\le ${rate(S.town)}$ ($${nm(S.V0 + S.inflow - S.limit)}/3 \\approx ${fx(S.rmin, 3)}$) would do: the uniqueness comes from the list of options, not from the mathematics.`));
    w.paragraph(t(`**Margen y última hora.** La opción elegida deja ${nm(S.margin)} millones de m³ al final. Un caudal adicional constante $\\varepsilon$ durante tres horas añade $3\\varepsilon$, así que la decisión aguanta mientras $\\varepsilon \\le ${nm(S.margin)}/3 \\approx ${fx(S.epsMax, 3)}$. Con el aviso de ${nm(S.update)}, $V(3) = ${fx(S.updated)} \\le ${S.limit}$: la recomendación sigue en pie. Con un error mayor que ${fx(S.epsMax, 3)} ninguna opción sería admisible, y la decisión dejaría de ser técnica: habría que avisar a ${names.town}.`,
      `**Margin and last minute.** The chosen option leaves ${nm(S.margin)} million m³ at the end. An extra constant inflow $\\varepsilon$ for three hours adds $3\\varepsilon$, so the decision holds as long as $\\varepsilon \\le ${nm(S.margin)}/3 \\approx ${fx(S.epsMax, 3)}$. With the warning of ${nm(S.update)}, $V(3) = ${fx(S.updated)} \\le ${S.limit}$: the recommendation stands. With an error larger than ${fx(S.epsMax, 3)} no option would be admissible, and the decision would stop being technical: ${names.town} would have to be warned.`));
    w.heading(t("Comprobación individual", "Individual check"), { keep: 40 });
    w.bullets(t([
      "**Unidades.** m²; m³; millones de m³/h; millones de m³; millones de m³/h.",
      `**Intervalo.** $${nm(S.V0 + S.inflow - S.limit)}/3 \\le r \\le ${rate(S.town)}$: el límite del embalse da la cota inferior; el del pueblo, la superior.`,
      "**El final no siempre basta.** Aquí basta porque $V' > 0$ en todo el intervalo; si la entrada bajara por debajo del desembalse, el máximo podría estar antes del final, como en la tormenta de la primavera pasada.",
      "**Un depósito.** $V(t) = 10 + 3t - t^2$; $V(2) = 12$, pero el máximo es $V(1.5) = 12.25 > 12.1$: el límite se incumple. Quien mire solo el final concluirá lo contrario.",
    ], [
      "**Units.** m²; m³; millions of m³/h; millions of m³; millions of m³/h.",
      `**Range.** $${nm(S.V0 + S.inflow - S.limit)}/3 \\le r \\le ${rate(S.town)}$: the reservoir's limit gives the lower bound; the town's, the upper one.`,
      "**The end is not always enough.** Here it is enough because $V' > 0$ on the whole interval; if the inflow dropped below the release, the maximum could come before the end, as in last spring's storm.",
      "**A tank.** $V(t) = 10 + 3t - t^2$; $V(2) = 12$, but the maximum is $V(1.5) = 12.25 > 12.1$: the limit is broken. Whoever looks only at the end will conclude the opposite.",
    ]));
  }

  // ------------------------------------------------------------------------------ slides
  function slides(X) {
    const { t, S, names, room } = X;
    const opts = or(X, S.options.map(rate));
    const out = [
      { banner: true, title: t(`La presa de ${names.reservoir}`, `The ${names.reservoir} dam`), subtitle: t("Una decisión antes de la tormenta", "A decision before the storm") },
      { title: t("La tormenta", "The storm"), image: X.A.feature,
        text: [t(`El embalse de ${names.reservoir} está casi en su límite: ${S.limit} millones de m³. Una tormenta avanza hacia el valle y, durante tres horas, el río traerá mucha más agua de la habitual.`, `The ${names.reservoir} reservoir is almost at its limit: ${S.limit} million m³. A storm is moving toward the valley and, for three hours, the river will bring far more water than usual.`),
          t(`Seis kilómetros aguas abajo está ${names.town}. Si la presa suelta demasiada agua, se inundan sus calles bajas.`, `Six kilometers downstream lies ${names.town}. If the dam releases too much water, its lower streets flood.`)] },
      { title: t("Lo que pide la unidad", "What the unit needs"),
        quote: t("«Primero, cuánto hay. Después, cuánto llega y cuánto sale. Y en cada paso, las unidades.» — Nota del consultor", "\"First, how much there is. Then, how much comes in and how much goes out. And at every step, the units.\" — The consultant's note"),
        bullets: t([`Un desembalse constante: ${opts} millones de m³ por hora.`, `El embalse no puede superar ${S.limit} millones de m³ **en ningún momento** de la tormenta.`, `${names.town} no admite cualquier caudal.`, "Una recomendación firmada que se pueda comprobar línea a línea."],
          [`A constant release: ${opts} million m³ per hour.`, `The reservoir may not exceed ${S.limit} million m³ **at any moment** of the storm.`, `${names.town} does not accept just any release.`, "A signed recommendation that can be checked line by line."]) },
      { title: t("Antes de empezar: dos preguntas", "Before we start: two questions"),
        bullets: t(["Con un caudal constante de 0.8 millones de m³ por hora, ¿qué volumen entra en media hora?", "Si entra más agua de la que sale, ¿puede estar bajando el volumen almacenado?"],
          ["With a constant inflow of 0.8 million m³ per hour, what volume flows in over half an hour?", "If more water flows in than out, can the stored volume be falling?"]),
        note: t("En voz alta y con unidades.", "Aloud, and with units.") },
      { title: t("Tres cantidades y sus unidades", "Three quantities and their units"),
        table: { head: [t("Cantidad", "Quantity"), t("Unidades", "Units"), t("Pregunta", "Question")], rows: t([
          ["Área de una sección, $A(x)$", "m²", "¿Qué se obtiene al multiplicarla por un espesor $\\Delta x$?"],
          ["Caudal, $q(t)$", "millones de m³/h", "¿Qué se obtiene al multiplicarlo por un tiempo $\\Delta t$?"],
          ["Volumen almacenado, $V(t)$", "millones de m³", "¿Cuándo es máximo durante la tormenta?"],
        ], [
          ["Area of a section, $A(x)$", "m²", "What do you get when you multiply it by a thickness $\\Delta x$?"],
          ["Inflow, $q(t)$", "millions of m³/h", "What do you get when you multiply it by a time $\\Delta t$?"],
          ["Stored volume, $V(t)$", "millions of m³", "When is it largest during the storm?"],
        ]), widths: [62, 40, 98] },
        note: t("Un caudal no se suma a un volumen.", "A flow is not added to a volume.") },
      { title: t("El comité: tres especialistas", "The committee: three specialists"),
        table: { head: [t("Especialidad", "Specialty"), t("Hoja", "Sheet"), t("Tiene", "Has"), t("Trae a la reunión", "Brings to the meeting")], rows: t([
          ["Topografía", "A y B", "Las secciones sumergidas del embalse", "El volumen almacenado ahora"],
          ["Hidrología", "A y C", "La previsión de la tormenta", "El agua que llegará y $V(t)$"],
          ["Municipio", "A y D", `El límite de ${names.town} y un precedente`, "Qué caudales se admiten y cómo se comprueba un límite"],
        ], [
          ["Topography", "A and B", "The reservoir's submerged sections", "The volume stored now"],
          ["Hydrology", "A and C", "The storm forecast", "The water to come and $V(t)$"],
          ["Town", "A and D", `${names.town}'s limit and a precedent`, "Which releases are accepted and how a limit is checked"],
        ]), widths: [36, 24, 66, 74] } },
    ];
    // the committees of this class, at most seven per slide
    const rows = room.groups.map((g) => [g.label, String(g.B), String(g.C), String(g.D), String(g.size)]);
    const pages = Math.ceil(rows.length / 7), per = Math.ceil(rows.length / pages);
    for (let p = 0; p < pages; p += 1) {
      out.push({ title: t("Los comités de esta clase", "This class's committees") + (pages > 1 ? ` (${p + 1}/${pages})` : ""),
        table: { head: [t("Comité", "Committee"), t("Topografía", "Topography"), t("Hidrología", "Hydrology"), t("Municipio", "Town"), t("Estudiantes", "Students")], rows: rows.slice(p * per, p * per + per), widths: [40, 40, 40, 40, 40] },
        note: p === pages - 1 ? t("Todos reciben la hoja A; cada especialista, además, la hoja de su especialidad.", "Everyone receives Sheet A; each specialist also receives the sheet of their specialty.") + (room.note ? ` ${room.note}` : "") : null });
    }
    out.push(
      { title: t("Para la clase de cierre", "For the closing class"),
        bullets: t(["**Vuestra hoja resuelta**, con unidades en cada paso.", "**La hoja A**: en su segunda página, el comité escribirá su decisión.", "En la reunión, **explicad** lo que sabéis: no enseñéis vuestra hoja.", "Cada especialista es imprescindible: sin uno de vosotros, el comité no puede decidir."],
          ["**Your completed sheet**, with units at every step.", "**Sheet A**: on its second page, the committee will write its decision.", "At the meeting, **explain** what you know: do not show your sheet.", "Every specialist is essential: without one of you, the committee cannot decide."]) },
      { title: t("La clase de cierre", "The closing class"), table: { head: [t("Minutos", "Minutes"), t("Qué hacemos", "What we do")], rows: closingPlan(X).map((r) => [r[0], r[3]]), widths: [22, 178] } },
      { title: t("La recomendación del comité", "The committee's recommendation"),
        bullets: t(["El agua que hay ahora y cómo se ha calculado.", "El agua que llegará y el volumen $V(t)$ en cada instante.", "El caudal elegido y por qué se descarta cada uno de los demás.", "Por qué el límite se respeta **durante toda** la tormenta.", "Qué dato nuevo obligaría a revisarla."],
          ["The water there is now and how it was calculated.", "The water to come and the volume $V(t)$ at each moment.", "The chosen release and why each of the others is ruled out.", "Why the limit is respected **during the whole** storm.", "What new piece of information would force a revision."]) },
      { title: t("Última hora", "Last minute"),
        text: [t(`El servicio de hidrología avisa: la previsión podría quedarse corta hasta en ${nm(S.update)} millones de m³ por hora durante toda la tormenta.`, `The hydrology service warns: the forecast could fall short by up to ${nm(S.update)} million m³ per hour throughout the storm.`)],
        bullets: t(["¿Sigue en pie vuestra recomendación?", "¿Cuánto podría equivocarse la previsión antes de que ninguna opción fuera admisible?"], ["Does your recommendation still stand?", "How wrong could the forecast be before no option is admissible?"]) },
    );
    return out;
  }

  // ------------------------------------------------------------------------------ preview
  function preview(X, el) {
    const { t, S, names } = X;
    const W = 300, H = 120, px = (x) => 34 + (x / 3) * (W - 50), ymax = Math.ceil((S.q3 + 0.3) * 2) / 2, py = (v) => H - 22 - (v / ymax) * (H - 34);
    const ticks = [0, 1, 2, 3].map((x) => `<text x="${px(x)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#5d6570">${x}</text>`).join("");
    const yt = [0, ymax / 2, ymax].map((v) => `<text x="28" y="${py(v) + 3}" font-size="10" text-anchor="end" fill="#5d6570">${nm(v)}</text>`).join("");
    el.innerHTML = `<p class="cc-help"><strong>${t("Datos del caso", "Case data")}</strong> · ${t(`embalse de ${names.reservoir}, pueblo de ${names.town}`, `${names.reservoir} reservoir, the town of ${names.town}`)}</p>
      <table class="cc-groups"><thead><tr><th>x (m)</th>${S.xs.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody><tr><td>A (m²)</td>${S.areas.map((a) => `<td>${a}</td>`).join("")}</tr></tbody></table>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t("Hidrograma previsto", "Forecast hydrograph")}" style="width:100%;height:auto;margin-top:.5em">
        <line x1="34" y1="${py(0)}" x2="${px(3)}" y2="${py(0)}" stroke="#5d6570"/><line x1="34" y1="${py(0)}" x2="34" y2="${py(ymax)}" stroke="#5d6570"/>
        <line x1="${px(0)}" y1="${py(S.gate)}" x2="${px(3)}" y2="${py(S.gate)}" stroke="#e77924" stroke-dasharray="5 4"/>
        <line x1="${px(0)}" y1="${py(S.q(0))}" x2="${px(3)}" y2="${py(S.q3)}" stroke="#0b607f" stroke-width="2.5"/>
        ${ticks}${yt}<text x="${px(3)}" y="${py(S.q3) - 6}" font-size="10" text-anchor="end" fill="#0b607f">q(t) = ${nm(S.a)} ${S.b < 0 ? "−" : "+"} ${nm(Math.abs(S.b))}t</text>
        <text x="${px(0.05)}" y="${py(S.gate) - 4}" font-size="10" fill="#e77924">${t("compuerta", "gate")} ${rate(S.gate)}</text></svg>
      <p class="cc-help">${t(`Límite del embalse: ${S.limit} millones de m³. Opciones: ${S.options.map(rate).join(", ")} millones de m³/h. Límite del pueblo: ${rate(S.town)}.`, `Reservoir limit: ${S.limit} million m³. Options: ${S.options.map(rate).join(", ")} million m³/h. Town limit: ${rate(S.town)}.`)}</p>`;
  }

  // ------------------------------------------------------------------------------ the case
  const DEF = {
    id: "dam", script: "dam.js", banner: "header-brand.jpg", minStudents: 3, maxStudents: 45, studentsDefault: 24,
    defaults: { scenario: "book", reservoir: "Valdemora", town: "Sotobarca" },
    /** Committees of three specialists; one or two extra students join committees as a second topographer or hydrologist. */
    classroom(cfg, t) {
      const n = cfg.students, g = Math.max(1, Math.floor(n / 3)), extra = n - 3 * g;
      const groups = Array.from({ length: g }, (_, k) => ({ B: 1, C: 1, D: 1, index: k }));
      if (extra >= 1) groups[g - 1].B += 1;
      if (extra >= 2) (g >= 2 ? groups[g - 2] : groups[0]).C += 1;
      const role = (x) => [x.B > 1 ? t("2 topografía", "2 topography") : t("topografía", "topography"), x.C > 1 ? t("2 hidrología", "2 hydrology") : t("hidrología", "hydrology"), t("municipio", "town")].join(", ");
      const out = groups.map((x) => ({ label: `${t("Comité", "Committee")} ${x.index + 1}`, role: role(x), size: x.B + x.C + x.D, B: x.B, C: x.C, D: x.D }));
      const extras = out.filter((x) => x.size > 3).map((x) => {
        const who = [x.B > 1 ? t("topografía", "topography") : null, x.C > 1 ? t("hidrología", "hydrology") : null].filter(Boolean).join(t(" y ", " and "));
        return t(`el ${x.label.toLowerCase()} tiene ${x.size} miembros (un segundo especialista de ${who.replace(" y ", " y otro de ")})`, `${x.label} has ${x.size} members (a second ${who.replace(" and ", " and a second ")} specialist)`);
      });
      const note = extras.length ? t(`Con ${n} estudiantes, ${extras.join("; ")}. Los dos especialistas de la misma especialidad resuelven la hoja por separado y comparan.`, `With ${n} students, ${extras.join("; ")}. The two specialists of the same specialty solve the sheet separately and compare.`) : "";
      return { students: n, groups: out, note };
    },
    context(cfg, t) {
      const S = compute(cfg.scenario);
      const clean = (v, d) => (String(v || "").trim().replace(/\s+/g, " ").slice(0, 40) || d);
      return { S, names: { reservoir: clean(cfg.reservoir, "Valdemora"), town: clean(cfg.town, "Sotobarca") } };
    },
    kicker: (X) => `Calculus Cases · ${X.t("Caso 5 · La presa", "Case 5 · The Dam")}`,
    docs(X) {
      const { t, room } = X, n = room.students;
      const nB = room.groups.reduce((s, g) => s + g.B, 0), nC = room.groups.reduce((s, g) => s + g.C, 0), nD = room.groups.reduce((s, g) => s + g.D, 0);
      X.counts = { nB, nC, nD };
      const BW = t("Doble cara; blanco y negro", "Double-sided; black and white");
      const pr = (who, copies, how, when) => ({ who, copies, how, when });
      const per = (k, who) => t(`${k} (1 por ${who})`, `${k} (1 per ${who})`);
      return [
        { id: "sheetA", n: "01", count: n, title: t("Hoja A · La pregunta del comité", "Sheet A · The committee's question"), render: sheetA,
          print: pr(t("Todos", "Everyone"), per(n, t("estudiante", "student")), t("Doble cara (la segunda página es la de la decisión)", "Double-sided (the second page is the decision page)"), t("Lanzamiento; vuelve en la clase de cierre", "Launch; back in the closing class")) },
        { id: "sheetB", n: "02", count: nB, title: t("Hoja B · Levantamiento del embalse", "Sheet B · Reservoir survey"), render: sheetB,
          print: pr(t("Especialistas de topografía", "Topography specialists"), per(nB, t("especialista", "specialist")), BW, t("Lanzamiento", "Launch")) },
        { id: "sheetC", n: "03", count: nC, title: t("Hoja C · Previsión de la tormenta", "Sheet C · Storm forecast"), render: sheetC,
          print: pr(t("Especialistas de hidrología", "Hydrology specialists"), per(nC, t("especialista", "specialist")), BW, t("Lanzamiento", "Launch")) },
        { id: "sheetD", n: "04", count: nD, title: t("Hoja D · El municipio aguas abajo", "Sheet D · The town downstream"), render: sheetD,
          print: pr(t("Representantes del municipio", "Town representatives"), per(nD, t("comité", "committee")), BW, t("Lanzamiento", "Launch")) },
        { id: "check", n: "05", count: n, title: t("Comprobación individual", "Individual check"), render: check,
          print: pr(t("Todos", "Everyone"), per(n, t("estudiante", "student")), t("Una cara; blanco y negro", "One side; black and white"), t("Final de la clase de cierre", "End of the closing class")) },
        { id: "guide", n: "90", teacher: true, title: t("Guía docente", "Teacher guide"), render: guide, print: pr(t("Solo para ti", "For you only"), "1", BW, t("Antes del lanzamiento", "Before the launch")) },
        { id: "solution", n: "91", teacher: true, title: t("Solucionario", "Solutions"), render: solution, print: pr(t("Solo para ti", "For you only"), "1", BW, t("Antes del lanzamiento; no circula", "Before the launch; it does not circulate")) },
      ];
    },
    bundles(X) {
      const { t, room } = X, { nB, nC, nD } = X.counts;
      return [
        { id: "topography", label: t("Topografía · hojas A y B", "Topography · sheets A and B"), docs: ["sheetA", "sheetB"], use: t(`${nB} copias, 1 por especialista de topografía, en el lanzamiento`, `${nB} copies, 1 per topography specialist, at the launch`) },
        { id: "hydrology", label: t("Hidrología · hojas A y C", "Hydrology · sheets A and C"), docs: ["sheetA", "sheetC"], use: t(`${nC} copias, 1 por especialista de hidrología, en el lanzamiento`, `${nC} copies, 1 per hydrology specialist, at the launch`) },
        { id: "town", label: t("Municipio · hojas A y D", "Town · sheets A and D"), docs: ["sheetA", "sheetD"], use: t(`${nD} copias, 1 por comité, en el lanzamiento`, `${nD} copies, 1 per committee, at the launch`) },
        { id: "closing", label: t("Clase de cierre · comprobación individual", "Closing class · individual check"), docs: ["check"], use: t(`${room.students} copias, 1 por estudiante, al final de la clase de cierre`, `${room.students} copies, 1 per student, at the end of the closing class`) },
        { id: "teacher", label: t("Paquete docente", "Teacher packet"), docs: ["guide", "solution"], use: t("1, para ti", "1, for you") },
      ];
    },
    slides,
    presentationPrint: (X) => ({ who: X.t("Para proyectar en el lanzamiento y en la clase de cierre", "To project at the launch and in the closing class"), when: X.t("Lanzamiento y cierre", "Launch and closing class") }),
    guide(X) {
      const { t, room } = X, { nB, nC, nD } = X.counts, g = room.groups.length;
      return {
        before: [t("Todo en blanco y negro. La hoja A va a doble cara: su segunda página es la de la decisión del comité.", "Everything in black and white. Sheet A is double-sided: its second page is the committee's decision page.")],
        steps: t([
          `Antes del lanzamiento. Imprime ${room.students} hojas A, ${nB} hojas B, ${nC} hojas C y ${nD} hojas D (o los tres paquetes por especialidad), ${room.students} comprobaciones individuales y el paquete docente. Cada hoja del alumnado cabe en un folio a doble cara: no hace falta grapar.`,
          `Lanzamiento, al final de una clase. Proyecta la presentación (00). En la diapositiva «Los comités de esta clase», forma los ${g} comités y reparte: a cada estudiante, la hoja A y la de su especialidad.`,
          "En casa. Cada especialista resuelve su hoja; la segunda página de la hoja A se deja en blanco.",
          "Clase de cierre. Los comités se reúnen con sus hojas y completan la segunda página de la hoja A; al final de la audiencia, recoge una hoja A firmada por comité. Reparte la comprobación individual (05) en los últimos minutos.",
          "La guía docente y el solucionario no salen de tus manos.",
        ], [
          `Before the launch. Print ${room.students} copies of Sheet A, ${nB} of Sheet B, ${nC} of Sheet C and ${nD} of Sheet D (or the three specialty packets), ${room.students} individual checks and the teacher packet. Each student sheet fits on one double-sided page: no stapling needed.`,
          `Launch, at the end of a class. Project the presentation (00). On the slide "This class's committees", form the ${g} committees and hand out: to every student, Sheet A and the sheet of their specialty.`,
          "At home. Each specialist solves their sheet; the second page of Sheet A is left blank.",
          "Closing class. The committees meet with their sheets and fill in the second page of Sheet A; at the end of the hearing, collect one signed Sheet A per committee. Hand out the individual check (05) in the last minutes.",
          "The teacher guide and the solutions stay with you.",
        ]),
        material: [t("Un proyector para la presentación en el lanzamiento y en la clase de cierre (sin proyector, una copia de la presentación por comité). Calculadora.", "A projector for the presentation at the launch and in the closing class (without one, one copy of the presentation per committee). A calculator.")],
      };
    },
    summary(X) {
      const { t, room } = X;
      if (!X.counts) DEF.docs(X);
      const k = X.counts;
      return [[t("Estudiantes", "Students"), String(room.students)], [t("Comités", "Committees"), `${room.groups.length} (${room.groups.map((g) => g.size).join(", ")})`],
        [t("Hojas A · B · C · D", "Sheets A · B · C · D"), `${room.students} · ${k.nB} · ${k.nC} · ${k.nD}`], [t("Datos", "Data"), X.S.id === "book" ? t("los del libro", "those in the book") : t("segunda tormenta", "second storm")],
        [t("Formato", "Format"), t("lanzamiento 18 min · casa 45–60 · cierre 55", "launch 18 min · home 45–60 · closing 55")]];
    },
    preview,
  };
  DEF.assets = async () => {
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = DEF.base + "feature.jpg"; });
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      return { feature: { data: c.toDataURL("image/jpeg", 0.86), ratio: c.height / c.width } };
    } catch (e) { return {}; }
  };
  root.DamCase = { compute, SCENARIOS };
  root.CCGenerator.define(DEF);
})(typeof window !== "undefined" ? window : globalThis);
