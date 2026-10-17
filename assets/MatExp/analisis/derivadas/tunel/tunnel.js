/*
 * Calculus Cases · Case 2 · The Tunnel — data, renderers and generator definition.
 *
 * Built on the shared kit (calculus-cases/kit: cc-fonts, cc-tex, cc-pdf, cc-slides,
 * cc-generator). One source of data (VARIANTS below) feeds every document: the four role sheets
 * A–D of the book, the local-model sheet and the individual check of the closing class, the
 * teacher guide, the solution and the projected presentation. The default variant ("book")
 * reproduces the book's record exactly.
 *
 * Time format (common to every case): launch in the last 15–20 minutes of a class, 45–60 minutes
 * of work at home per team, closing class of 55 minutes.
 */
(function (root) {
  "use strict";
  const G = root.CCGenerator, PDF = root.CCPdf, TEX = root.CCTex;

  // ------------------------------------------------------------------------------- data
  /**
   * Record variants. On each side of the exit the position is s(t) = v t + p t² (t ≤ 0) and
   * s(t) = v t + q t² (t ≥ 0): the two pieces share their tangent at t = 0 by construction, the
   * speed decreases on both sides (p, q < 0) and stays positive on [−2, 2] (v + 4q > 0), and the
   * five recorded positions are exact to a tenth of a metre. `marks` and `rail` are the scene's
   * rounded distances (road marks from about s(1), guardrail at about s(2)).
   */
  const VARIANTS = {
    book: { v: 22, p: -0.5, q: -1.5, marks: 20, rail: 38 },
    b: { v: 20, p: -0.4, q: -1.2, marks: 19, rail: 35 },
    c: { v: 25, p: -0.5, q: -2, marks: 23, rail: 42 },
  };
  const LIMIT = 60;   // km/h
  const TIMES = [-2, -1, 0, 1, 2];
  const INTERVALS = [[-2, 0], [-1, 0], [0, 1], [0, 2], [-1, 1]];

  function record(key) {
    const V = VARIANTS[key] || VARIANTS.book;
    const s = (t) => V.v * t + (t <= 0 ? V.p : V.q) * t * t;
    const pos = TIMES.map((t) => Math.round(s(t) * 10) / 10);
    const at = (t) => pos[TIMES.indexOf(t)];
    const avg = INTERVALS.map(([a, b]) => (at(b) - at(a)) / (b - a));
    const aL = (at(-2) - 2 * at(-1)) / 2, bL = aL - at(-1);
    const aR = (at(2) - 2 * at(1)) / 2, bR = at(1) - aR;
    return { key, ...V, s, pos, at, avg, aL, bL, aR, bR, kmh: V.v * 3.6, limitMs: LIMIT / 3.6 };
  }

  /** Numbers with a decimal point in both languages; trailing zeros dropped. */
  const fmt = (x, d = 2) => { const r = Math.round(x * 10 ** d) / 10 ** d; return (Object.is(r, -0) ? 0 : r).toString(); };
  const fix1 = (x) => (Math.abs(x) < 1e-9 ? "0.0" : x.toFixed(1));
  const neg = (x) => String(x).replace(/^-/, "−");
  const m = (x) => `$${neg(x)}$`;                 // as maths (minus sign)
  const iv = ([a, b]) => `$[${neg(a)},${neg(b)}]$`;

  // ------------------------------------------------------------------------------- the scene
  /** Plan of the scene (Sheet B and the presentation): canvas image, drawn from the data. */
  function scene(X) {
    const { t, D } = X;
    const c = document.createElement("canvas"), W = 1600, H = 560;
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const sx = (s) => 330 + s * 25;   // metres -> px; exit at x = 330
    const roadTop = 250, roadBot = 370;
    const font = (px, bold) => `${bold ? "bold " : ""}${px}px Helvetica, Arial, sans-serif`;
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    // verge and road
    g.fillStyle = "#eef1ee"; g.fillRect(0, roadTop - 70, W, roadBot - roadTop + 140);
    g.fillStyle = "#d9dcdf"; g.fillRect(0, roadTop, W, roadBot - roadTop);
    g.strokeStyle = "#5d6570"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, roadTop); g.lineTo(W, roadTop); g.moveTo(0, roadBot); g.lineTo(W, roadBot); g.stroke();
    g.setLineDash([34, 26]); g.lineWidth = 3; g.strokeStyle = "#ffffff";
    g.beginPath(); g.moveTo(sx(0), (roadTop + roadBot) / 2); g.lineTo(W, (roadTop + roadBot) / 2); g.stroke(); g.setLineDash([]);
    // the mountain and the tunnel (left of the exit)
    g.fillStyle = "#b9c2bb"; g.strokeStyle = "#202a3d"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 120); g.lineTo(sx(0) - 10, 120); g.lineTo(sx(0) + 30, roadTop - 40); g.lineTo(sx(0) + 30, roadBot + 40); g.lineTo(sx(0) - 10, H - 70); g.lineTo(0, H - 70); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#8d968f"; g.fillRect(0, roadTop, sx(0), roadBot - roadTop);
    g.setLineDash([14, 10]); g.strokeStyle = "#202a3d"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, roadTop); g.lineTo(sx(0), roadTop); g.moveTo(0, roadBot); g.lineTo(sx(0), roadBot); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#202a3d"; g.font = font(30, true); g.textAlign = "left";
    g.fillText(t("TÚNEL", "TUNNEL"), 28, roadTop - 92);
    // exit line s = 0
    g.strokeStyle = "#20506e"; g.lineWidth = 4; g.setLineDash([12, 8]);
    g.beginPath(); g.moveTo(sx(0), roadTop - 60); g.lineTo(sx(0), roadBot + 70); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#20506e"; g.font = font(30, true); g.textAlign = "left";
    g.fillText(t("Salida del túnel", "Tunnel exit"), sx(0) + 14, roadTop - 66);
    // speed-limit sign at the portal
    const sgx = sx(0) + 70, sgy = roadBot + 112;
    g.fillStyle = "#fff"; g.strokeStyle = "#a43d35"; g.lineWidth = 12;
    g.beginPath(); g.arc(sgx, sgy, 40, 0, 2 * Math.PI); g.fill(); g.stroke();
    g.fillStyle = "#202a3d"; g.font = font(34, true); g.textAlign = "center"; g.fillText(String(LIMIT), sgx, sgy + 12);
    g.textAlign = "left"; g.font = font(30); g.fillText(t(`Límite: ${LIMIT} km/h`, `Limit: ${LIMIT} km/h`), sgx + 60, sgy + 11);
    // guardrail along the far edge after the bend, with the impact
    g.strokeStyle = "#202a3d"; g.lineWidth = 9;
    g.beginPath(); g.moveTo(sx(D.rail - 9), roadTop - 6); g.lineTo(W - 20, roadTop - 6); g.stroke();
    g.lineWidth = 3;
    for (let s = D.rail - 9; sx(s) < W - 20; s += 2.5) { g.beginPath(); g.moveTo(sx(s), roadTop - 6); g.lineTo(sx(s), roadTop - 26); g.stroke(); }
    // road marks from about `marks` m to the guardrail
    g.strokeStyle = "#202a3d"; g.lineWidth = 6; g.globalAlpha = 0.75;
    [[0, 0], [0, 52]].forEach(([, dy]) => {
      g.beginPath();
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, s = D.marks + (D.rail - 1.5 - D.marks) * u;
        const y = roadBot - 38 - dy - (roadBot - roadTop - 70) * u * u;
        if (k === 0) g.moveTo(sx(s), y); else g.lineTo(sx(s), y);
      }
      g.stroke();
    });
    g.globalAlpha = 1;
    // the car, resting against the guardrail
    g.save(); g.translate(sx(D.rail) + 6, roadTop + 26); g.rotate(-0.32);
    g.fillStyle = "#a43d35"; g.strokeStyle = "#202a3d"; g.lineWidth = 3;
    g.beginPath(); g.rect(-62, -22, 124, 44); g.fill(); g.stroke();
    g.fillStyle = "#cfe0e8"; g.fillRect(14, -17, 22, 34); g.strokeRect(14, -17, 22, 34);
    g.restore();
    // impact star
    g.strokeStyle = "#e77924"; g.lineWidth = 4;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(sx(D.rail) + 66 + 10 * Math.cos(a), roadTop - 6 + 10 * Math.sin(a)); g.lineTo(sx(D.rail) + 66 + 26 * Math.cos(a), roadTop - 6 + 26 * Math.sin(a)); g.stroke(); }
    // labels with leaders
    g.fillStyle = "#202a3d"; g.font = font(30); g.strokeStyle = "#202a3d"; g.lineWidth = 2;
    const label = (x0, y0, x1, y1, text, align = "left") => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.textAlign = align; g.fillText(text, x1 + (align === "left" ? 8 : -8), y1 + 10); };
    label(sx(D.marks) + 10, roadBot - 40, sx(D.marks) - 60, roadBot + 80, t(`Marcas en la calzada: desde unos ${D.marks} m`, `Road marks: from about ${D.marks} m`), "left");
    label(sx(D.rail) + 66, roadTop - 30, sx(D.rail) - 30, 120, t(`Barrera: golpe hacia los ${D.rail} m`, `Guardrail: struck at about ${D.rail} m`), "right");
    // distance scale
    const ay = H - 52;
    g.strokeStyle = "#202a3d"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(sx(0), ay); g.lineTo(sx(45), ay); g.stroke();
    g.font = font(28); g.textAlign = "center";
    for (let s = 0; s <= 45; s += 5) {
      g.beginPath(); g.moveTo(sx(s), ay - (s % 10 ? 8 : 14)); g.lineTo(sx(s), ay + (s % 10 ? 8 : 14)); g.stroke();
      if (s % 10 === 0) g.fillText(String(s), sx(s), ay + 44);
    }
    g.textAlign = "left"; g.font = "italic 30px Times, serif"; g.fillText("s", sx(45) + 22, ay + 10);
    g.font = font(28); g.fillText("(m)", sx(45) + 38, ay + 10);
    return { data: c.toDataURL("image/png"), ratio: H / W, png: true };
  }

  // ------------------------------------------------------------------------------- helpers
  /**
   * Questions with writing lines that fill the page (ESTANDAR 4.2): as many questions as fit with
   * their minimum lines go on the current page and share all of it; the rest continue on the next.
   * opts.reserve keeps room at the foot of the last page (for a closing note).
   */
  function questions(w, qs, opts = {}) {
    const gap = 7.5, minL = opts.min || 4;
    const subH = (q) => 1.5 + w.rich(q.q, { x: 0, y: 0, width: w.W(), size: 11.5, family: "SFSans", style: "bold", lineH: 5.2, measureOnly: true }).height + 1.8;
    const headH = (q) => subH(q) + (q.hint ? w.measure(q.hint, { size: 9.5, italic: true, gap: 1.5 }) : 0) + 4.5;
    const rest = qs.slice();
    while (rest.length) {
      const room = w.room() - 3;
      let k = 0, used = 0;
      while (k < rest.length) {
        const need = headH(rest[k]) + (rest[k].min || minL) * gap + (k === rest.length - 1 ? opts.reserve || 0 : 0);
        if (used + need > room) break;
        used += headH(rest[k]) + (rest[k].min || minL) * gap; k += 1;
      }
      if (k === 0) { w.page(); continue; }
      const chunk = rest.splice(0, k), reserve = rest.length ? 0 : opts.reserve || 0;
      const L = Math.floor((room - reserve - chunk.reduce((s, q) => s + headH(q), 0)) / gap);
      const weight = chunk.reduce((s, q) => s + (q.weight || 1), 0);
      let left = L;
      chunk.forEach((q, i) => {
        const n = i === chunk.length - 1 ? left : Math.max(q.min || minL, Math.floor(L * (q.weight || 1) / weight));
        left -= n;
        w.sub(q.q, 4);
        if (q.hint) w.paragraph(q.hint, { size: 9.5, italic: true, gap: 1.5, color: PDF.CC.muted });
        w.lines(Math.max(1, n), gap);
      });
      if (rest.length) w.page();
    }
  }
  /** Height a callout will take (to reserve room for it). */
  const calloutH = (w, text) => w.measure(text, { size: 10.5, gap: 0 }) - w.lead(10.5) + 13;
  /** Squared paper (5 mm) of the given height, full width. */
  function paper(w, h) {
    const doc = w.doc, x0 = w.margin, W = w.W(), y0 = w.y;
    doc.setDrawColor(...PDF.CC.grid).setLineWidth(0.12);
    for (let x = 0; x <= W + 0.01; x += 5) doc.line(x0 + x, y0, x0 + x, y0 + h);
    for (let y = 0; y <= h + 0.01; y += 5) doc.line(x0, y0 + y, x0 + W, y0 + y);
    doc.setDrawColor(...PDF.CC.rule).setLineWidth(0.3).rect(x0, y0, W, h);
    w.y = y0 + h + 5;
  }
  /** Two side-by-side boxes for the first reading at the launch. */
  function firstReading(w, X) {
    const { t } = X;
    w.answers([t("Una observación sobre tu hoja", "One observation about your sheet"), t("Una pregunta que tu hoja no puede responder sola", "One question your sheet cannot answer alone")], { cols: 2, h: 20 });
    w.y += 4;
  }
  /** The model and its tangent, secants and recorded points: vector plot (solution). */
  function modelPlot(w, X, h) {
    const { D, t } = X, doc = w.doc, CC = PDF.CC;
    w.ensure(h + 12);
    const x0 = w.margin + 12, W = w.W() - 16, y0 = w.y + 2;
    const tmin = -2.3, tmax = 2.3, smin = Math.floor((D.at(-2) - 6) / 10) * 10, smax = Math.ceil((D.at(2) + 8) / 10) * 10;
    const X_ = (u) => x0 + (u - tmin) / (tmax - tmin) * W, Y_ = (s) => y0 + h - (s - smin) / (smax - smin) * h;
    doc.setDrawColor(...CC.grid).setLineWidth(0.12);
    for (let u = -2; u <= 2; u += 0.5) doc.line(X_(u), y0, X_(u), y0 + h);
    for (let s = smin; s <= smax; s += 10) doc.line(x0, Y_(s), x0 + W, Y_(s));
    doc.setDrawColor(...CC.ink).setLineWidth(0.3).rect(x0, y0, W, h);
    doc.line(X_(0), y0, X_(0), y0 + h); doc.line(x0, Y_(0), x0 + W, Y_(0));
    doc.setFont("SFSans", "normal").setFontSize(8.5).setTextColor(...CC.ink);
    for (let u = -2; u <= 2; u += 1) doc.text(String(u).replace("-", "−"), X_(u), y0 + h + 4, { align: "center" });
    for (let s = smin; s <= smax; s += 10) doc.text(String(s).replace("-", "−"), x0 - 1.5, Y_(s) + 1.2, { align: "right" });
    w.rich("$t$ (s)", { x: X_(1.4), y: y0 + h + 4, width: 20, size: 9.5 });
    w.rich("$s$ (m)", { x: x0 + 1.5, y: y0 + 4.5, width: 20, size: 9.5 });
    const poly = (f, a, b, color, width, dash) => {
      doc.setDrawColor(...color).setLineWidth(width); if (dash) doc.setLineDashPattern(dash, 0);
      let prev = null;
      for (let k = 0; k <= 80; k++) { const u = a + (b - a) * k / 80, p = [X_(u), Y_(f(u))]; if (prev) doc.line(prev[0], prev[1], p[0], p[1]); prev = p; }
      doc.setLineDashPattern([], 0);
    };
    poly((u) => D.v * u, -2.2, 2.2, CC.ink, 0.35, [1.6, 1.2]);
    poly((u) => D.at(-1) * -u, -1.6, 0.4, CC.orange, 0.45, [0.6, 0.8]);
    poly((u) => D.at(1) * u, -0.4, 1.6, CC.orange, 0.45, [2.4, 0.8, 0.6, 0.8]);
    poly(D.s, -2.2, 0, CC.blue, 0.7); poly(D.s, 0, 2.2, CC.blue, 0.7);
    doc.setFillColor(...CC.ink);
    TIMES.forEach((u, k) => doc.circle(X_(u), Y_(D.pos[k]), 0.8, "F"));
    // legend
    const items = [[CC.blue, null, t("Modelo cuadrático a cada lado", "Quadratic model on each side")], [CC.ink, [1.6, 1.2], t(`Tangente en $t=0$: pendiente ${D.v}`, `Tangent at $t=0$: slope ${D.v}`)],
      [CC.orange, [0.6, 0.8], t(`Secante en ${iv([-1, 0])}: ${fmt(D.avg[1])}`, `Secant on ${iv([-1, 0])}: ${fmt(D.avg[1])}`)], [CC.orange, [2.4, 0.8, 0.6, 0.8], t(`Secante en ${iv([0, 1])}: ${fmt(D.avg[2])}`, `Secant on ${iv([0, 1])}: ${fmt(D.avg[2])}`)]];
    items.forEach(([col, dash, label], k) => {
      const lx = x0 + 4, ly = y0 + 6 + k * 5;
      doc.setFillColor(255, 255, 255).rect(lx - 1, ly - 3.4, 74, 4.8, "F");
      doc.setDrawColor(...col).setLineWidth(0.6); if (dash) doc.setLineDashPattern(dash, 0); doc.line(lx, ly - 1, lx + 8, ly - 1); doc.setLineDashPattern([], 0);
      w.rich(label, { x: lx + 10, y: ly, width: 64, size: 9, family: "SFSans" });
    });
    w.y = y0 + h + 12;
  }

  // ------------------------------------------------------------------------------- documents
  const R = {};
  const head = (X, letter) => `${X.t("EXPEDIENTE", "FILE")} T-17 · ${X.t("EL TÚNEL", "THE TUNNEL")}${letter ? ` · ${X.t("HOJA", "SHEET")} ${letter}` : ""}`;
  const meta = (w, X, office, role) => {
    const { t } = X;
    w.meta([[t("Origen", "Source"), office], [t("Rol", "Role"), role], [t("Nombre y equipo", "Name and team"), "_______________________________________________"]]);
  };
  const recordTable = (w, X, opts = {}) => {
    const { t, D } = X;
    w.table([`$t$ (s)`, ...TIMES.map((u) => m(u))], [[`$s$ (m)`, ...D.pos.map((s) => m(fix1(s)))]], [22, 16, 16, 16, 16, 16], Object.assign({ keep: true, boldFirst: true }, opts));
  };

  R.sheetA = (w, X) => {
    const { t, D } = X;
    w.title(t("Hoja A · Registro del movimiento", "Sheet A · Motion record"), head(X, "A"), t("RESERVADO", "RESTRICTED"));
    meta(w, X, t("Oficina de Investigación · Unidad de Tráfico", "Investigation Office · Traffic Unit"), t("Análisis del movimiento", "Motion analysis"));
    w.paragraph(t("La cámara de salida define $s=0$ y $t=0$. Las posiciones negativas quedan dentro del túnel; las positivas, fuera de él. Las posiciones se reconstruyeron a partir de imágenes sincronizadas y se redondearon a la décima de metro.",
      "The exit camera defines $s=0$ and $t=0$. Negative positions lie inside the tunnel and positive positions beyond it. Positions were reconstructed from synchronized images and rounded to the nearest tenth of a meter."));
    recordTable(w, X);
    firstReading(w, X);
    w.callout(t("**Encargo.** Calcula las velocidades medias en $[-2,0]$, $[-1,0]$, $[0,1]$, $[0,2]$ y $[-1,1]$. Después explica qué supuesto adicional necesitas antes de poder dar una velocidad instantánea.",
      "**Your task.** Calculate the average velocities on $[-2,0]$, $[-1,0]$, $[0,1]$, $[0,2]$ and $[-1,1]$. Then explain what further assumption you need before you can name an instantaneous velocity."), "blue");
    w.table([t("Intervalo", "Interval"), ...INTERVALS.map(iv)], [[t("Cálculo", "Calculation"), "", "", "", "", ""], [t("Media (m/s)", "Average (m/s)"), "", "", "", "", ""]], [26, 15, 15, 15, 15, 15],
      { boldFirst: true, keep: true, fill: (row, i) => (i === 0 ? PDF.CC.zebra : null), minRow: 11 });
    w.sub(t("Representa las posiciones, rotula los ejes y dibuja una secante a tu elección.", "Plot the positions, label the axes and draw a secant of your choice."), 30);
    paper(w, Math.max(60, Math.min(120, Math.floor((w.room() - 4) / 5) * 5)));
    const noteA = t("**Antes de la clase de cierre.** Pasa al resto del equipo las cinco medias, con sus unidades, y di de qué intervalo sale cada una. Trae esta hoja completa.",
      "**Before the closing class.** Give the rest of your team the five averages, with their units, and say which interval each one comes from. Bring this sheet completed.");
    questions(w, [
      { q: t("¿Qué mide la pendiente de tu secante? ¿Qué sigue sin saberse?", "What does the slope of your secant measure? What is still unknown?"), weight: 1 },
      { q: t("¿Qué supuesto adicional necesitas antes de poder dar una velocidad instantánea?", "What further assumption do you need before you can name an instantaneous velocity?"), weight: 1 },
    ], { reserve: calloutH(w, noteA) });
    w.callout(noteA, "note");
  };

  R.sheetB = (w, X) => {
    const { t, D } = X;
    w.title(t("Hoja B · Registro de la escena", "Sheet B · Scene record"), head(X, "B"), t("RESERVADO", "RESTRICTED"));
    meta(w, X, t("Oficina de Investigación · Atestado del accidente", "Investigation Office · Accident report"), t("Análisis de la escena", "Scene analysis"));
    w.paragraph(t(`El límite indicado dentro del túnel e inmediatamente después es de ${LIMIT} km/h. Las marcas de la calzada empiezan aproximadamente ${D.marks} m después de la salida, y el coche golpeó la barrera alrededor de los ${D.rail} m. No se dispone de una inspección mecánica concluyente del vehículo.`,
      `The posted limit through the tunnel and just beyond it is ${LIMIT} km/h. Road marks begin roughly ${D.marks} m beyond the exit, and the guardrail was struck at roughly ${D.rail} m. No conclusive mechanical examination of the car is available.`));
    const S = X.scene, iw = w.W();
    w.image(S.data, iw, iw * S.ratio, { png: true, frame: true, gap: 2 });
    w.caption(t("Croquis del atestado (sin escala vertical).", "Sketch from the accident report (no vertical scale)."));
    firstReading(w, X);
    w.callout(t("**Encargo.** Tú conoces la escena. Tu trabajo es que el equipo compare sus cifras en las mismas unidades y no atribuya al expediente más de lo que dice.",
      "**Your task.** You know the scene. Your job is to make sure the team compares its numbers in the same units and does not read into the file more than it says."), "blue");
    const noteB = t("**Antes de la clase de cierre.** Pasa al equipo el límite en m/s. Trae esta hoja completa.", "**Before the closing class.** Give your team the limit in m/s. Bring this sheet completed.");
    questions(w, [
      { q: t("Convierte el límite a metros por segundo y muestra la conversión.", "Convert the limit to meters per second, showing the conversion."), weight: 1 },
      { q: t("Cuando llegue la estimación del movimiento, compara las dos magnitudes en las mismas unidades.", "When the motion estimate arrives, compare the two quantities in the same units."), weight: 1 },
      { q: t("¿Qué afirmación sobre la causa exigiría una inspección mecánica?", "Which claim about the cause would require a mechanical inspection?"), weight: 1 },
    ], { reserve: calloutH(w, noteB) });
    w.callout(noteB, "note");
  };

  R.sheetC = (w, X) => {
    const { t } = X;
    w.title(t("Hoja C · Declaraciones recogidas", "Sheet C · Statements taken"), head(X, "C"), t("RESERVADO", "RESTRICTED"));
    meta(w, X, t("Oficina de Investigación · Entrevistas", "Investigation Office · Interviews"), t("Análisis de las entrevistas", "Interview analysis"));
    w.paragraph(t(`**${X.insurer}**, perito de la aseguradora del vehículo:`, `**${X.insurer}**, investigator for the car's insurer:`), { gap: 1.5 });
    w.callout(t("«El conductor tuvo que superar el límite a la salida. Eso explica el accidente».", "“The driver must have exceeded the limit at the exit. That explains the crash.”"), "note", { italic: true, size: 11 });
    w.paragraph(t(`**${X.brother}**, hermano del conductor:`, `**${X.brother}**, the driver's brother:`), { gap: 1.5 });
    w.callout(t("«Conocía esta carretera de memoria. Jamás habría ido tan rápido. Tuvo que fallar algo en el coche».", "“He knew this road by heart. He would never have driven that fast. Something must have failed in the car.”"), "note", { italic: true, size: 11 });
    w.paragraph(t("*Nota de la oficina:* ninguno de los dos ha visto el registro de la cámara de salida.", "*Office note:* neither of them has seen the exit camera record."));
    firstReading(w, X);
    w.callout(t("**Encargo.** ¿Qué parte de cada declaración pueden contrastar los documentos? Averígualo antes de que nadie en tu equipo tome partido.",
      "**Your task.** Which part of each statement can the documents test? Find out before anyone on your team takes a side."), "blue");
    const noteC = t("**Antes de la clase de cierre.** Di al equipo qué afirmaciones se pueden contrastar con el expediente y cuáles no. Trae esta hoja completa.",
      "**Before the closing class.** Tell your team which claims the file can test and which it cannot. Bring this sheet completed.");
    questions(w, [
      { q: t("Separa en las declaraciones una afirmación sobre la velocidad, otra sobre la causa y otra sobre el conocimiento personal.", "In the statements, separate a claim about speed, a claim about the cause and a claim about personal knowledge."), weight: 1 },
      { q: t("Para cada afirmación que se pueda contrastar, pide un cálculo o un documento a otro miembro de tu equipo.", "For each claim that can be tested, ask another member of your team for a calculation or a document."), weight: 1 },
      { q: t("Después del intercambio, reformula una de las declaraciones para que no diga más de lo que permiten las pruebas.", "After the exchange, rewrite one statement so that it says no more than the evidence allows."), weight: 1 },
    ], { reserve: calloutH(w, noteC) });
    w.callout(noteC, "note");
  };

  R.sheetD = (w, X) => {
    const { t } = X;
    w.title(t("Hoja D · Informe pericial", "Sheet D · Expert report"), head(X, "D"), null);
    w.meta([[t("Origen", "Source"), t("Oficina de Investigación", "Investigation Office")], [t("Rol", "Role"), t("Coordinación del informe (en equipos de tres, todo el equipo)", "Report coordination (in teams of three, the whole team)")],
      [t("Equipo", "Team"), "_______________________________________________"]]);
    w.callout(t("**Encargo para el equipo.** Entregad una página que contenga (1) las velocidades medias, con sus unidades; (2) un modelo o una aproximación explícita para la velocidad instantánea de salida; (3) la comparación con el límite indicado, y (4) una afirmación respaldada directamente por un registro, otra que dependa de vuestro modelo y una pregunta que el expediente no permita responder. Redactad la conclusión de modo que pueda seguirla alguien que nunca haya estudiado cálculo.",
      "**Task for the team.** Submit one page containing (1) the average velocities, with units; (2) a model or an explicit approximation for the instantaneous exit speed; (3) the comparison with the posted limit; and (4) one statement supported directly by a record, one that depends on your model, and one question the file cannot answer. Write the conclusion so that someone who has never studied calculus can follow it."), "blue");
    w.callout(t("**En casa**, quien coordina reúne lo que aporta cada hoja y redacta los apartados 1 y 3. **En la clase de cierre**, el equipo completa el resto.",
      "**At home**, the coordinator gathers what each sheet contributes and drafts parts 1 and 3. **In the closing class**, the team completes the rest."), "note");
    questions(w, [
      { q: t("1. Tasas medias: intervalos, valores y unidades.", "1. Average rates: intervals, values and units."), weight: 1 },
      { q: t("2. Modelo local y derivada en la salida.", "2. Local model and derivative at the exit."), weight: 2 },
    ]);
    w.page();
    questions(w, [
      { q: t("3. Comparación con el límite.", "3. Comparison with the limit."), weight: 1 },
      { q: t("4. Observación, inferencia condicionada y causa sin resolver.", "4. Observation, conditional inference and unresolved cause."), hint: t("Una afirmación respaldada por un registro, otra que dependa del modelo y una pregunta que el expediente no permita responder.", "One statement supported by a record, one that depends on the model and one question the file cannot answer."), weight: 2 },
      { q: t("5. Una objeción que recibisteis y la corrección que motivó.", "5. An objection you received and the revision it prompted."), weight: 1 },
    ]);
  };

  R.model = (w, X) => {
    const { t } = X;
    w.title(t("El modelo local", "The local model"), head(X, ""), null);
    w.meta([[t("Para", "For"), t("Cada pareja del equipo, en la clase de cierre", "Each pair in the team, in the closing class")], [t("Equipo", "Team"), "_______________________________________________"]]);
    w.paragraph(t("El registro da cinco posiciones. Entre ellas, el movimiento hay que modelarlo. En el margen del expediente, el consultor dejó escrita una indicación:", "The record gives five positions. Between them, the motion has to be modeled. In the margin of the file, the consultant left a note:"), { gap: 1 });
    w.paragraph(t("*Una parábola a cada lado de la salida. No las obliguéis a coincidir.*", "*A parabola on each side of the exit. Do not force them to agree.*"), { color: PDF.CC.hand, size: 12 });
    recordTable(w, X, { tight: true });
    w.y += 3;
    w.callout(t("**Encargo.** Una pareja ajusta el lado izquierdo y la otra, el derecho. En cada lado, escribid $s(t)=at^2+bt+c$, usad los tres puntos de ese lado y calculad la derivada en $t=0$. Después comparad los dos resultados.",
      "**Your task.** One pair fits the left side and the other the right side. On each side, write $s(t)=at^2+bt+c$, use the three points on that side and compute the derivative at $t=0$. Then compare the two results."), "blue");
    const side = (title, pts, fill) => {
      w.heading(title, { keep: 60 });
      w.sub(t(`Las tres ecuaciones (puntos ${pts})`, `The three equations (points ${pts})`), 24);
      w.lines(fill ? Math.max(3, Math.floor((w.room() - 2 * 15 - 8) / 7.5)) : 4);
      w.answers(["$c=$", "$a=$", "$b=$"], { cols: 3, h: 12 });
      w.answers([t("El modelo: $s(t)=$", "The model: $s(t)=$"), "$s'(t)=$", "$s'(0)=$"], { cols: 3, h: 12 });
    };
    side(t("Lado izquierdo: $-2\\le t\\le 0$", "Left side: $-2\\le t\\le 0$"), "$t=-2,-1,0$", true);
    w.page();
    side(t("Lado derecho: $0\\le t\\le 2$", "Right side: $0\\le t\\le 2$"), "$t=0,1,2$", false);
    w.heading(t("La comparación", "The comparison"), { keep: 50 });
    questions(w, [
      { q: t("¿Coinciden las dos derivadas en $t=0$? ¿Coinciden las dos parábolas?", "Do the two derivatives at $t=0$ agree? Do the two parabolas agree?"), weight: 1 },
      { q: t("La velocidad de salida en km/h, comparada con el límite.", "The exit speed in km/h, compared with the limit."), weight: 1 },
      { q: t("¿Qué tiene que ser cierto para que podáis fiaros de esa cifra?", "What has to be true for you to trust that number?"), weight: 1 },
    ]);
  };

  R.check = (w, X) => {
    const { t, D } = X;
    w.title(t("Comprobación individual", "Individual check"), head(X, ""), null);
    w.meta([[t("Nombre", "Name"), "_______________________________________________"]]);
    w.heading(t("1. Al final de la clase de cierre", "1. At the end of the closing class"));
    questions(w, [
      { q: t(`La media medida en $[-1,1]$ es $${fmt(D.avg[4])}$ m/s y el modelo da $${D.v}$ m/s en la salida. Explica por qué las dos pueden ser respuestas defendibles a preguntas distintas.`,
        `The measured average on $[-1,1]$ is $${fmt(D.avg[4])}$ m/s and the model gives $${D.v}$ m/s at the exit. Explain why both can be defensible answers, to different questions.`), weight: 3 },
      { q: t("Completa la frase: «La derivada nos dice…, siempre que…».", "Complete the sentence: “The derivative tells us …, provided that …”."), weight: 2 },
    ]);
    w.page();
    w.heading(t("2. Para la próxima clase: del coche al agua", "2. For the next class: from cars to water"));
    w.paragraph(t("Un depósito contiene $Q(t)=100+6t+t^2$ litros, con $t$ en minutos.", "A tank holds $Q(t)=100+6t+t^2$ liters, with $t$ in minutes."));
    questions(w, [
      { q: t("Calcula el caudal medio en $[0,2]$ y el caudal instantáneo en $t=1$, con sus unidades. ¿Qué significa cada uno?", "Compute the average inflow on $[0,2]$ and the instantaneous inflow at $t=1$, with units. What does each one mean?"), weight: 2 },
      { q: t("Repite las dos preguntas con $Q(t)=100+t^3$. ¿Es una regla general que coincidan?", "Repeat both questions with $Q(t)=100+t^3$. Is it a general rule that they agree?"), weight: 2 },
    ]);
  };

  // ------------------------------------------------------------------------------- teacher
  function heardRows(X) {
    const { t, D } = X;
    return [
      [t(`«La velocidad de salida es ${fmt(D.avg[1])} m/s: es la medida más cercana».`, `“The exit speed is ${fmt(D.avg[1])} m/s; it's the closest measurement.”`), t("Confunde una media con una velocidad instantánea.", "An average has been taken for an instantaneous speed."), t("«Señala las dos posiciones que usa ese cociente. ¿En qué intervalo es una media?»", "“Point to the two positions that quotient uses. Over which interval is it an average?”")],
      [t("Un equipo no sabe cómo empezar el modelo.", "A team does not know how to start the model."), t("Falta el vínculo entre los datos y el polinomio.", "The link between the data and the polynomial is missing."), t("«¿Dónde aparece $s(0)$ en vuestro polinomio?»", "“Where does $s(0)$ appear in your polynomial?”")],
      [t(`«${D.v} es menos que ${LIMIT}, así que no iba rápido».`, `“${D.v} is less than ${LIMIT}, so he wasn't speeding.”`), t("Compara magnitudes en unidades distintas.", "Quantities are being compared in different units."), t("«¿En qué unidades está cada número? Convertid uno y volved a comparar».", "“What are the units of each number? Convert one and compare again.”")],
      [t("«La velocidad era constante».", "“The speed was constant.”"), t("Lee varias secantes como si fueran una sola pendiente.", "Several secants have been read as a single slope."), t("«Comparad las pendientes lejos de la salida. ¿Coinciden?»", "“Compare the slopes away from the exit. Do they agree?”")],
      [t("«El modelo demuestra que frenó».", "“The model proves he braked.”"), t("Atribuye una causa a la forma de una curva.", "A cause is being read into the shape of a curve."), t("«¿Qué registro distingue una frenada de cualquier otro motivo para perder velocidad?»", "“Which record distinguishes braking from any other reason for slowing down?”")],
      [t("«Iba por encima del límite, así que la culpa es suya».", "“He was over the limit, so the crash was his fault.”"), t("Salta de la estimación a la causa.", "The argument jumps from an estimate to a cause."), t("«¿Qué documento demuestra una causa mecánica, o la descarta?»", "“Which document establishes a mechanical cause, or rules one out?”")],
      [t(`«El modelo da ${D.v}, así que iba a ${D.v}».`, `“The model gives ${D.v}, so he was doing ${D.v}.”`), t("Trata la estimación como si fuera una medida.", "The estimate is being treated as a measurement."), t("«¿Podrían dos curvas que pasan por los mismos cinco puntos tener tangentes distintas en la salida?»", "“Could two curves through the same five points have different tangents at the exit?”")],
    ];
  }
  function closePlan(X) {
    const { t } = X;
    return t([
      ["8", "**Puesta en común.** Cada equipo dice su primera estimación de la velocidad de salida y de qué intervalo sale. En la pizarra, intervalos y valores."],
      ["20", "**El modelo.** Una ficha del modelo local por pareja: una pareja ajusta el lado izquierdo y la otra el derecho. Comparan $s'(0)$ y lo pasan a km/h."],
      ["12", "**Informe y revisión.** Cada equipo completa la hoja D y la intercambia con otro, que señala un hecho medido, un supuesto del modelo y una inferencia que va más allá de los datos."],
      ["10", "**Cierre.** De las secantes a la tangente; la afirmación que queda; el inspector jefe archiva el caso."],
      ["5", "**Comprobación individual.**"],
    ], [
      ["8", "**Pooling.** Each team gives its first estimate of the exit speed and the interval it comes from. On the board, intervals and values."],
      ["20", "**The model.** One local-model sheet per pair: one pair fits the left side and the other the right. They compare $s'(0)$ and convert it to km/h."],
      ["12", "**Report and review.** Each team completes Sheet D and exchanges it with another, which marks one measured fact, one modeling assumption and one inference that goes beyond the data."],
      ["10", "**Debrief.** From secants to the tangent; the statement to keep; the Chief Inspector files the case."],
      ["5", "**Individual check.**"],
    ]);
  }

  R.guide = (w, X) => {
    const { t, D, room } = X;
    w.title(t("Guía docente", "Teacher guide"), head(X, ""), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.meta([[t("Clase", "Class"), t(`${room.students} estudiantes, ${room.groups.length} equipos (${room.groups.map((g) => g.size).join(", ")})`, `${room.students} students, ${room.groups.length} teams (${room.groups.map((g) => g.size).join(", ")})`)],
      [t("Formato", "Format"), t("Lanzamiento de 15–20 min, 45–60 min en casa por equipo y clase de cierre de 55 min", "Launch of 15–20 min, 45–60 min at home per team and a closing class of 55 min")],
      [t("Datos", "Data"), X.variantLabel]]);
    w.heading(t("El caso en una página", "The case on one page"));
    w.paragraph(t(`Un coche sale ${X.tunnel.replace(/^el /, "del ")} y, pocos metros después, queda detenido contra la barrera. La aseguradora habla de *velocidad*; la familia, de *avería*. El consultor solo dejó una pregunta: ¿qué podemos afirmar sobre el coche en el instante preciso en que salió? Cada integrante del equipo recibe una parte del expediente: el registro del movimiento (A), la escena (B), las declaraciones (C) y el informe que hay que firmar (D).`,
      `A car comes out of ${X.tunnel} and, a few meters later, comes to rest against the guardrail. The insurer speaks of *speed*; the family, of *failure*. The consultant left only a question: what can we say about the car at the very moment it came out? Each team member receives one part of the file: the motion record (A), the scene (B), the statements (C) and the report to be signed (D).`));
    w.paragraph(t(`La trampa es deliberada: la medida más cercana a la salida, $${fmt(D.avg[1])}$ m/s en $[-1,0]$, es una media. El giro llega en la clase de cierre, cuando cada equipo ajusta una parábola a cada lado de la salida: las dos curvas pierden velocidad a ritmos distintos, pero sus tangentes en $t=0$ coinciden, $${D.v}$ m/s, unos $${fmt(D.kmh, 1)}$ km/h en una carretera limitada a ${LIMIT}. Esa velocidad solo existe dentro de un modelo, así que tiene que viajar con sus supuestos.`,
      `The trap is deliberate: the measurement closest to the exit, $${fmt(D.avg[1])}$ m/s on $[-1,0]$, is an average. The turn comes in the closing class, when each team fits a parabola on each side of the exit: the two curves slow down at different rates, but their tangents at $t=0$ agree, $${D.v}$ m/s, about $${fmt(D.kmh, 1)}$ km/h on a road limited to ${LIMIT}. That speed exists only inside a model, so it has to travel with its assumptions.`));
    w.heading(t("Lanzamiento, al final de una clase (15–20 min)", "Launch, at the end of a class (15–20 min)"));
    w.bullets(t([
      "**3 min.** Proyecta la presentación: las dos fotografías, la pregunta del consultor y lo que pide el inspector jefe.",
      "**3 min.** Las dos preguntas de diagnóstico, por escrito y por separado. Si el obstáculo son las unidades, muestra que 1 m/s = 3.6 km/h.",
      "**4 min.** Los roles y los equipos de esta clase (diapositiva de los equipos); reparte las hojas A, B, C y D de cada equipo.",
      "**5 min.** Lectura en silencio: nadie enseña su hoja. Cada estudiante escribe una observación y una pregunta que su hoja no puede responder sola.",
      "**2 min.** Lo que hay que traer a la clase de cierre.",
    ], [
      "**3 min.** Project the presentation: the two photographs, the consultant's question and what the Chief Inspector wants.",
      "**3 min.** The two diagnostic questions, in writing and individually. If units turn out to be the obstacle, show that 1 m/s = 3.6 km/h.",
      "**4 min.** The roles and this class's teams (the teams slide); hand out Sheets A, B, C and D to each team.",
      "**5 min.** Silent reading: nobody shows their sheet. Each student writes one observation and one question their sheet cannot answer alone.",
      "**2 min.** What to bring to the closing class.",
    ]), true);
    w.heading(t("En casa (45–60 min por equipo)", "At home (45–60 min per team)"));
    w.paragraph(t("Cada integrante completa su hoja (unos 20–25 minutos) y el equipo intercambia lo que necesita: A pasa las cinco medias, B el límite en m/s y C qué afirmaciones se pueden contrastar. Quien coordina reúne todo en la hoja D y redacta los apartados 1 y 3. Lo esperable es que el equipo llegue con una estimación basada en una media, casi siempre la de $[-1,0]$; no hace falta corregirla antes de la clase de cierre, porque es el punto de partida de la puesta en común.",
      "Each member completes their sheet (about 20–25 minutes) and the team exchanges what it needs: A passes on the five averages, B the limit in m/s and C which claims can be tested. The coordinator gathers everything on Sheet D and drafts parts 1 and 3. Expect the team to arrive with an estimate based on an average, usually the one on $[-1,0]$; there is no need to correct it before the closing class, because it is the starting point of the pooling."));
    w.heading(t("Desde el papel de inspector jefe", "From the Chief Inspector's chair"));
    w.paragraph(t("Estás dentro de la historia, y eso te permite reconducirla sin detenerla. Cuando un equipo presenta una media como velocidad de salida: «Esta oficina no firma una media como si fuera un instante. ¿De qué intervalo sale ese número?». Cuando la conversación se desliza hacia la culpa: «Eso lo decidirá un juez. Yo necesito saber a qué velocidad salió el coche». Cuando un equipo se apoya en una sola persona: «Que me lo cuente quien tiene la hoja C». Ninguna de estas frases regala la respuesta, pero todas enseñan qué exige un buen informe: un intervalo, unas unidades y una afirmación que no vaya más allá de las pruebas.",
      "You are inside the story, and that lets you steer it without stopping it. When a team presents an average as the exit speed: “This office does not sign an average as if it were an instant. Which interval does that number come from?” When the conversation turns to blame: “A judge will settle that. I need to know how fast the car came out.” When a team leans on a single person: “Let me hear it from whoever has Sheet C.” None of these lines gives the answer away, but all of them show what a good report requires: an interval, some units, and a claim that goes no further than the evidence."));
    w.heading(t("Clase de cierre (55 min)", "Closing class (55 min)"), { keep: 50 });
    w.table([t("Min.", "Min."), t("Qué ocurre", "What happens")], closePlan(X), [12, 168], { zebra: true });
    w.heading(t("Lo que puedes oír", "What you may hear"), { keep: 40 });
    w.table([t("Lo que se oye", "What you hear"), t("Qué revela", "What it reveals"), t("Qué preguntar", "What to ask")], heardRows(X), [62, 50, 68], { zebra: true });
    w.heading(t("Para cerrar el caso (lectura en voz alta)", "To close the case (read aloud)"), { keep: 40 });
    w.callout(t(`El inspector jefe leyó el informe dos veces antes de decir nada.\n—${D.v} metros por segundo —dijo por fin—. Unos ${Math.round(D.kmh)} kilómetros por hora en una carretera limitada a ${LIMIT}. Esto va a la aseguradora, con el modelo adjunto, para que cualquiera pueda comprobarlo. —Se volvió hacia la segunda fotografía—. Por qué se salió el coche de la carretera sigue siendo una pregunta abierta, y ahora les toca a los mecánicos. Esta oficina responde a lo que puede demostrar.\nCerró la carpeta.\n—Archivadlo.`,
      `The Chief Inspector read the report twice before saying anything.\n“${D.v} meters per second,” he said at last. “${Math.round(D.kmh)} kilometers an hour, give or take, on a road marked ${LIMIT}. That goes to the insurer, with the model attached, so anyone can check it.” He turned to the second photograph. “Why the car left the road is still an open question, and it belongs to the mechanics now. This office answers what it can prove.”\nHe closed the folder. “File it.”`), "blue", { size: 11 });
    w.paragraph(t("El material que hay que imprimir, las copias y el momento de cada entrega están en la guía de impresión y reparto.", "What to print, how many copies and when each document is handed out are in the printing and distribution guide."), { size: 9.5, italic: true });
  };

  R.solution = (w, X) => {
    const { t, D } = X;
    const H = (row, i) => i > 0;
    w.title(t("Solución", "Solution"), head(X, ""), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.meta([[t("Datos", "Data"), X.variantLabel]]);
    w.heading(t("1. Las medias (hoja A)", "1. The averages (Sheet A)"));
    w.table([t("Intervalo", "Interval"), ...INTERVALS.map(iv)], [[t("Media (m/s)", "Average (m/s)"), ...D.avg.map((a) => m(fmt(a)))]], [26, 15, 15, 15, 15, 15], { boldFirst: true, keep: true, hand: H });
    w.paragraph(t(`Por ejemplo, en $[-1,0]$: $\\frac{0-(${fix1(D.at(-1))})}{0-(-1)}=${fmt(D.avg[1])}$ m/s. Los dos intervalos más próximos a la salida dan valores distintos a cada lado, $${fmt(D.avg[1])}$ y $${fmt(D.avg[2])}$ m/s, y el simétrico $[-1,1]$ da $${fmt(D.avg[4])}$ m/s. Por muy cerca de la salida que estén, todas son medias, porque cada intervalo sigue teniendo una anchura positiva. El supuesto que falta para hablar de un instante es un modelo del movimiento entre los puntos registrados.`,
      `For instance, on $[-1,0]$: $\\frac{0-(${fix1(D.at(-1))})}{0-(-1)}=${fmt(D.avg[1])}$ m/s. The two intervals closest to the exit give different values on either side, $${fmt(D.avg[1])}$ and $${fmt(D.avg[2])}$ m/s, and the symmetric interval $[-1,1]$ gives $${fmt(D.avg[4])}$ m/s. However close to the exit they are, all of them are averages, because every interval still has positive width. The assumption needed before naming an instant is a model of the motion between the recorded points.`));
    w.heading(t("2. La escena y las declaraciones (hojas B y C)", "2. The scene and the statements (Sheets B and C)"));
    w.bullets(t([
      `${LIMIT} km/h = ${LIMIT}\u202f000 m / 3600 s ≈ ${fmt(D.limitMs)} m/s; o bien 1 m/s = 3.6 km/h, así que ${LIMIT} km/h = ${LIMIT}/3.6 m/s.`,
      `Sobre la velocidad: «tuvo que superar el límite a la salida» (${X.insurer}) y «jamás habría ido tan rápido» (${X.brother}); el registro y un modelo pueden contrastarlas.`,
      `Sobre la causa: «eso explica el accidente» y «tuvo que fallar algo en el coche». Ningún documento las contrasta: haría falta una inspección mecánica.`,
      `Sobre el conocimiento personal: «conocía esta carretera de memoria». No se puede contrastar con el expediente.`,
      `Una reformulación aceptable: «según el modelo, el coche salió por encima del límite; el expediente no dice por qué se salió de la carretera».`,
    ], [
      `${LIMIT} km/h = ${LIMIT},000 m / 3600 s ≈ ${fmt(D.limitMs)} m/s; or 1 m/s = 3.6 km/h, so ${LIMIT} km/h = ${LIMIT}/3.6 m/s.`,
      `About speed: “must have exceeded the limit at the exit” (${X.insurer}) and “would never have driven that fast” (${X.brother}); the record and a model can test them.`,
      `About the cause: “that explains the crash” and “something must have failed in the car”. No document tests them: that would require a mechanical inspection.`,
      `About personal knowledge: “he knew this road by heart”. The file cannot test it.`,
      `An acceptable rewrite: “according to the model, the car left the tunnel above the limit; the file does not say why it left the road”.`,
    ]));
    w.heading(t("3. El modelo local (clase de cierre)", "3. The local model (closing class)"));
    w.paragraph(t(`En cada lado, $s(t)=at^2+bt+c$. Como $s(0)=0$, $c=0$. **Izquierda:** $s(-1)=a-b=${fix1(D.at(-1))}$ y $s(-2)=4a-2b=${fix1(D.at(-2))}$; restando el doble de la primera, $2a=${fix1(D.at(-2))}-2(${fix1(D.at(-1))})$, así que $a=${fmt(D.aL)}$ y $b=${fmt(D.bL)}$. **Derecha:** $s(1)=a+b=${fix1(D.at(1))}$ y $s(2)=4a+2b=${fix1(D.at(2))}$; $2a=${fix1(D.at(2))}-2(${fix1(D.at(1))})$, así que $a=${fmt(D.aR)}$ y $b=${fmt(D.bR)}$.`,
      `On each side, $s(t)=at^2+bt+c$. Since $s(0)=0$, $c=0$. **Left:** $s(-1)=a-b=${fix1(D.at(-1))}$ and $s(-2)=4a-2b=${fix1(D.at(-2))}$; subtracting twice the first, $2a=${fix1(D.at(-2))}-2(${fix1(D.at(-1))})$, so $a=${fmt(D.aL)}$ and $b=${fmt(D.bL)}$. **Right:** $s(1)=a+b=${fix1(D.at(1))}$ and $s(2)=4a+2b=${fix1(D.at(2))}$; $2a=${fix1(D.at(2))}-2(${fix1(D.at(1))})$, so $a=${fmt(D.aR)}$ and $b=${fmt(D.bR)}$.`));
    const coef = (a) => (Math.abs(Math.abs(a) - 1) < 1e-9 ? "" : fmt(Math.abs(a)));
    const sq = (a) => (a < 0 ? `-${coef(a)}t^2` : `+${coef(a)}t^2`);
    w.table([t("Lado", "Side"), t("Modelo", "Model"), t("Derivada", "Derivative"), "$s'(0)$"], [
      [t("Izquierdo, $-2\\le t\\le0$", "Left, $-2\\le t\\le0$"), `$s(t)=${fmt(D.bL)}t${sq(D.aL)}$`, `$s'(t)=${fmt(D.bL)}${D.aL < 0 ? "-" : "+"}${coef(2 * D.aL)}t$`, `$${fmt(D.bL)}$ m/s`],
      [t("Derecho, $0\\le t\\le2$", "Right, $0\\le t\\le2$"), `$s(t)=${fmt(D.bR)}t${sq(D.aR)}$`, `$s'(t)=${fmt(D.bR)}${D.aR < 0 ? "-" : "+"}${coef(2 * D.aR)}t$`, `$${fmt(D.bR)}$ m/s`],
    ], [38, 50, 50, 26], { keep: true, hand: (row, i) => i > 0 });
    w.paragraph(t(`Las derivadas laterales coinciden en cero, y esa coincidencia es la recompensa del caso: dos modelos construidos con puntos distintos dan la misma velocidad de salida, $${D.v}$ m/s, es decir, $${fmt(D.kmh, 1)}$ km/h, $${fmt(D.kmh - LIMIT, 1)}$ km/h por encima del límite. Los dos tramos muestran que la velocidad disminuye (las parábolas no coinciden: $a=${fmt(D.aL)}$ frente a $a=${fmt(D.aR)}$), aunque nada en el modelo explica por qué.`,
      `The one-sided derivatives agree at zero, and that agreement is the payoff of the case: two models built from different points give the same exit speed, $${D.v}$ m/s, or $${fmt(D.kmh, 1)}$ km/h, $${fmt(D.kmh - LIMIT, 1)}$ km/h above the posted limit. Both pieces show the speed decreasing (the parabolas differ: $a=${fmt(D.aL)}$ against $a=${fmt(D.aR)}$), although nothing in the model says why.`));
    w.heading(t("4. De las secantes a la tangente", "4. From secants to the tangent"), { keep: 90 });
    modelPlot(w, X, 78);
    w.paragraph(t(`Calculados con el modelo, y no con la tabla, los cocientes incrementales son $\\frac{s(h)-s(0)}{h}=${D.v}${D.p < 0 ? "-" : "+"}${fmt(Math.abs(D.p))}h$ para $h<0$ y $${D.v}${D.q < 0 ? "-" : "+"}${fmt(Math.abs(D.q))}h$ para $h>0$; los dos tienden a $${D.v}$ cuando $h\\to0$. Dicho de otro modo, $s(h)\\approx${D.v}h$ cerca de la salida: en $h=0.1$ el modelo de la derecha da $${fmt(D.s(0.1), 3)}$ m y la aproximación lineal, $${fmt(D.v * 0.1, 3)}$ m.`,
      `Computed from the model rather than from the table, the difference quotients are $\\frac{s(h)-s(0)}{h}=${D.v}${D.p < 0 ? "-" : "+"}${fmt(Math.abs(D.p))}h$ for $h<0$ and $${D.v}${D.q < 0 ? "-" : "+"}${fmt(Math.abs(D.q))}h$ for $h>0$; both tend to $${D.v}$ as $h\\to0$. Put differently, $s(h)\\approx${D.v}h$ near the exit: at $h=0.1$ the right-hand model gives $${fmt(D.s(0.1), 3)}$ m and the linear prediction $${fmt(D.v * 0.1, 3)}$ m.`));
    w.heading(t("5. Lo que el modelo permite afirmar", "5. What the model allows us to claim"));
    w.paragraph(t("Otra curva regular podría pasar por las cinco posiciones y tener una derivada distinta en cero. La afirmación sobre la velocidad descansa, por tanto, en el modelo cuadrático local y en la precisión del registro. Dentro de esas condiciones, el expediente respalda una afirmación clara: según el modelo, el coche salió del túnel por encima del límite. Deja abiertas otras preguntas: por qué abandonó su carril, si falló algún componente y quién es responsable. Acepta cualquier otra aproximación local bien justificada, con unidades correctas y la misma distinción entre estimación y hecho.",
      "Another smooth curve could pass through all five positions and have a different derivative at zero. The speed claim therefore rests on the local quadratic model and on the accuracy of the record. Within those conditions the file supports a clear statement: according to the model, the car left the tunnel above the limit. It leaves open why the car left its lane, whether a component failed and who is responsible. Accept any other carefully justified local approximation, with correct units and the same distinction between estimate and fact."));
    w.paragraph(t(`*Ampliación: el teorema del valor medio.* Si la posición es continua en $[-2,0]$ y derivable en su interior, hay algún $c\\in(-2,0)$ con $s'(c)=${fmt(D.avg[0])}$ m/s, la media medida. La conclusión es más débil, porque no identifica $s'(0)$, pero también lo son sus hipótesis.`,
      `*Extension: the mean value theorem.* If position is continuous on $[-2,0]$ and differentiable inside, there is some $c\\in(-2,0)$ with $s'(c)=${fmt(D.avg[0])}$ m/s, the measured average. The conclusion is weaker, since it does not identify $s'(0)$, but so are its hypotheses.`));
    w.heading(t("6. El informe esperado (hoja D)", "6. The expected report (Sheet D)"));
    w.callout(t(`Las medias van de $${fmt(Math.min(...D.avg))}$ a $${fmt(Math.max(...D.avg))}$ m/s según el intervalo. Con un modelo cuadrático a cada lado de la salida, el coche salió del túnel a unos $${D.v}$ m/s (${Math.round(D.kmh)} km/h), por encima del límite de ${LIMIT} km/h. *Hecho registrado:* en el segundo anterior a la salida recorrió $${fmt(D.avg[1])}$ m. *Depende del modelo:* la velocidad en el instante de salida. *Sin respuesta en el expediente:* por qué se salió de la carretera.`,
      `The averages range from $${fmt(Math.min(...D.avg))}$ to $${fmt(Math.max(...D.avg))}$ m/s depending on the interval. Under a quadratic model on each side of the exit, the car left the tunnel at about $${D.v}$ m/s (${Math.round(D.kmh)} km/h), above the ${LIMIT} km/h limit. *Recorded fact:* in the second before the exit it covered $${fmt(D.avg[1])}$ m. *Depends on the model:* the speed at the instant of exit. *Not answered by the file:* why it left the road.`), "blue");
    w.heading(t("7. Comprobación individual", "7. Individual check"));
    w.bullets(t([
      `$${fmt(D.avg[4])}$ m/s es la media medida en $[-1,1]$; $${D.v}$ m/s, la velocidad instantánea del modelo en $t=0$. Responden a preguntas distintas. Una respuesta que solo dice que una es «más precisa» se queda corta: la diferencia es de significado, no de precisión.`,
      "Una frase completa: «La derivada nos dice la velocidad en un instante, siempre que aceptemos un modelo del movimiento cerca de ese instante».",
      "Depósito: caudal medio en $[0,2]$, $\\frac{Q(2)-Q(0)}{2}=8$ L/min; instantáneo, $Q'(1)=6+2=8$ L/min. Con $Q(t)=100+t^3$: media $4$ L/min, $Q'(1)=3$ L/min. No es una regla general: en una cuadrática, la media en un intervalo coincide siempre con la derivada en su punto medio.",
    ], [
      `$${fmt(D.avg[4])}$ m/s is the measured average on $[-1,1]$; $${D.v}$ m/s is the model's instantaneous speed at $t=0$. They answer different questions. An answer that only says one is “more accurate” is incomplete: the difference is one of meaning, not of precision.`,
      "A complete sentence: “The derivative tells us the speed at an instant, provided that we accept a model of the motion near that instant.”",
      "Tank: average inflow on $[0,2]$, $\\frac{Q(2)-Q(0)}{2}=8$ L/min; instantaneous, $Q'(1)=6+2=8$ L/min. With $Q(t)=100+t^3$: average $4$ L/min, $Q'(1)=3$ L/min. It is not a general rule: for a quadratic, the average over an interval always equals the derivative at its midpoint.",
    ]));
  };

  // ------------------------------------------------------------------------------- slides
  function slides(X) {
    const { t, D, room } = X, kick = X.kicker;
    const teamRows = room.groups.map((g) => [g.label, String(g.size), g.size === 4 ? t("A, B, C y D", "A, B, C and D") : t("A, B y C; quien tiene la C guarda también la D", "A, B and C; whoever holds C also keeps D")]);
    return [
      { kicker: kick, banner: true, title: t("El túnel", "The Tunnel"), subtitle: t("Expediente T-17 · Velocidad media e instantánea", "File T-17 · Average and instantaneous speed") },
      { kicker: kick, title: t("Dos fotografías", "Two photographs"), image: X.scene,
        text: [t(`En la primera, un coche sale ${X.tunnel.replace(/^el /, "del ")}. En la segunda, está detenido contra la barrera, a unos ${D.rail} m de la salida.`, `In the first, a car is coming out of ${X.tunnel}. In the second, it is resting against the guardrail, about ${D.rail} m beyond the exit.`),
          t("La aseguradora ha escrito una palabra: **velocidad**. La familia del conductor, otra: **avería**.", "The insurer has written one word: **speed**. The driver's family has written another: **failure**.")] },
      { kicker: kick, title: t("La pregunta del consultor", "The consultant's question"),
        quote: t("«¿Qué podemos afirmar sobre el coche en el instante preciso en que salió?»", "“What can we say about the car at the very moment it came out?”"),
        bullets: t(["Una cifra que se pueda comprobar.", "Una razón para fiarse de ella.", "Una explicación honesta de todo lo que esa cifra no demuestra."], ["A number that can be checked.", "A reason to trust it.", "An honest account of everything that number does not prove."]),
        note: t("— Lo que pide el inspector jefe", "— What the Chief Inspector wants") },
      { kicker: kick, title: t("Antes de empezar: dos preguntas", "Before we start: two questions"),
        bullets: t(["Un coche recorre 40 m en 2 s. ¿Qué describe la cifra de 20 m/s?", "¿Determina esa cifra la velocidad en el instante final?"], ["A car covers 40 m in 2 s. What does 20 m/s describe?", "Does that number determine the speed at the final instant?"]),
        note: t("Cada uno por su cuenta, por escrito, en un minuto.", "Each on your own, in writing, in one minute.") },
      { kicker: kick, title: t("El equipo y sus roles", "The team and its roles"),
        table: { head: [t("Rol", "Role"), t("Hoja", "Sheet"), t("Aporta al equipo", "Brings to the team")], rows: t([
          ["A · Movimiento", "Registro del movimiento", "Las velocidades medias, con su intervalo"],
          ["B · Escena", "Registro de la escena", "El límite en m/s y lo que se sabe de la escena"],
          ["C · Entrevistas", "Declaraciones recogidas", "Qué afirmaciones se pueden contrastar"],
          ["D · Coordinación", "Informe pericial", "Reúne lo anterior y redacta el informe"],
        ], [
          ["A · Motion", "Motion record", "The average velocities, with their intervals"],
          ["B · Scene", "Scene record", "The limit in m/s and what is known of the scene"],
          ["C · Interviews", "Statements taken", "Which claims can be tested"],
          ["D · Coordination", "Expert report", "Gathers the rest and writes the report"],
        ]), widths: [40, 52, 88] },
        note: t("Los primeros minutos, nadie enseña su hoja. En equipos de tres, quien tiene la hoja C coordina también.", "For the first minutes, nobody shows their sheet. In teams of three, whoever holds Sheet C also coordinates.") },
      { kicker: kick, title: t("Los equipos de esta clase", "This class's teams"),
        table: { head: [t("Equipo", "Team"), t("Estudiantes", "Students"), t("Hojas", "Sheets")], rows: teamRows, widths: [30, 30, 120] },
        note: t(`${room.students} estudiantes, ${room.groups.length} equipos.`, `${room.students} students, ${room.groups.length} teams.`) },
      { kicker: kick, title: t("Para la clase de cierre", "For the closing class"),
        bullets: t([
          "**Vuestra hoja completa**, cada uno la suya.",
          "**Una primera estimación** de la velocidad de salida, con el intervalo del que sale y sus unidades.",
          "**Qué afirmaciones** de las declaraciones puede contrastar el expediente, y cuáles no.",
          "**La hoja D** con los apartados 1 y 3 redactados.",
        ], [
          "**Your completed sheet**, each of you your own.",
          "**A first estimate** of the exit speed, with the interval it comes from and its units.",
          "**Which claims** in the statements the file can test, and which it cannot.",
          "**Sheet D** with parts 1 and 3 drafted.",
        ]) },
      { kicker: kick, title: t("La clase de cierre", "The closing class"),
        table: { head: [t("Min.", "Min."), t("Qué hacemos", "What we do")], rows: closePlan(X), widths: [16, 164] } },
      { kicker: kick, title: t("Lo que firma esta oficina", "What this office signs"),
        bullets: t([
          "Una cifra **con su intervalo** o **con su modelo**.",
          "**Unidades** en cada número; la comparación, en las mismas.",
          "Una afirmación que **no vaya más allá** de las pruebas.",
          "Una pregunta que el expediente **no permite responder**.",
        ], [
          "A number **with its interval** or **with its model**.",
          "**Units** on every number; the comparison, in the same ones.",
          "A claim that goes **no further** than the evidence.",
          "A question the file **cannot answer**.",
        ]),
        quote: t("«Esta oficina no firma una media como si fuera un instante».", "“This office does not sign an average as if it were an instant.”") },
    ];
  }

  // ------------------------------------------------------------------------------- definition
  const VARIANT_LABEL = {
    book: ["Los del libro (recomendado)", "The book's (recommended)"],
    b: ["Variante 2", "Variant 2"],
    c: ["Variante 3", "Variant 3"],
  };

  G.define({
    id: "tunnel", script: "tunnel.js",
    studentsDefault: 24, minStudents: 6, maxStudents: 40,
    defaults: { variant: "book", insurer: "", brother: "", place: "" },
    /** Teams of three or four (ceil(n/4) teams): roles A, B and C, and D for the fourth member. */
    classroom(cfg, t) {
      const n = cfg.students, g = Math.ceil(n / 4);
      const groups = Array.from({ length: g }, (_, k) => {
        const size = Math.floor(n / g) + (k < n % g ? 1 : 0);
        return { label: `${t("Equipo", "Team")} ${k + 1}`, role: size >= 4 ? "A · B · C · D" : t("A · B · C (C guarda la D)", "A · B · C (C keeps D)"), size };
      });
      const four = groups.filter((x) => x.size >= 4).length;
      return { students: n, groups, four, three: g - four,
        note: t("Cada equipo recibe las hojas A, B, C y D.", "Each team receives Sheets A, B, C and D.") + (g - four ? " " + t(`En ${g - four === 1 ? "el equipo de tres" : `los ${g - four} equipos de tres`}, quien tiene la hoja C coordina y guarda la D.`, `In ${g - four === 1 ? "the team of three" : `the ${g - four} teams of three`}, whoever holds Sheet C coordinates and keeps Sheet D.`) : "") };
    },
    context(cfg, t) {
      const D = record(cfg.variant);
      const X = { D };
      X.insurer = String(cfg.insurer || "").trim() || "Marta Ibáñez";
      X.brother = String(cfg.brother || "").trim() || "Luis Cano";
      const place = String(cfg.place || "").trim();
      X.tunnel = place ? t(`el túnel de ${place}`, `the ${place} tunnel`) : t("el túnel de montaña", "the mountain tunnel");
      X.variantLabel = (cfg.lang === "en" ? VARIANT_LABEL[D.key][1] : VARIANT_LABEL[D.key][0]);
      const un = (v) => (typeof v === "string" ? v.replace(/(^|[\s(\[,={$])-(?=\d)/g, "$1−") : Array.isArray(v) ? v.map(un) : v);
      X.t = (es, en) => un(t(es, en)); X.D = D;
      try { X.scene = typeof document !== "undefined" ? scene(X) : null; } catch (e) { X.scene = null; }
      return X;
    },
    kicker: (X) => X.t("Calculus Cases · Caso 2 · El túnel", "Calculus Cases · Case 2 · The Tunnel"),
    docs(X) {
      const { t, room } = X, g = room.groups.length, n = room.students;
      const BW = t("Doble cara; blanco y negro", "Double-sided; black and white");
      const pr = (who, copies, how, when) => ({ who, copies, how, when });
      return [
        { id: "a", n: "11", count: g, title: t("Hoja A · Registro del movimiento", "Sheet A · Motion record"), render: R.sheetA,
          print: pr(t("Rol A (movimiento) de cada equipo", "Role A (motion) in each team"), t(`${g} (1 por equipo)`, `${g} (1 per team)`), BW, t("Lanzamiento", "Launch")) },
        { id: "b", n: "12", count: g, title: t("Hoja B · Registro de la escena", "Sheet B · Scene record"), render: R.sheetB,
          print: pr(t("Rol B (escena) de cada equipo", "Role B (scene) in each team"), t(`${g} (1 por equipo)`, `${g} (1 per team)`), BW, t("Lanzamiento", "Launch")) },
        { id: "c", n: "13", count: g, title: t("Hoja C · Declaraciones recogidas", "Sheet C · Statements taken"), render: R.sheetC,
          print: pr(t("Rol C (entrevistas) de cada equipo", "Role C (interviews) in each team"), t(`${g} (1 por equipo)`, `${g} (1 per team)`), BW, t("Lanzamiento", "Launch")) },
        { id: "d", n: "14", count: g, title: t("Hoja D · Informe pericial", "Sheet D · Expert report"), render: R.sheetD,
          print: pr(t("Rol D (coordinación); en equipos de tres, quien tiene la C", "Role D (coordination); in teams of three, whoever holds C"), t(`${g} (1 por equipo)`, `${g} (1 per team)`), BW, t("Lanzamiento; vuelve en la clase de cierre", "Launch; back in the closing class")) },
        { id: "model", n: "21", count: 2 * g, title: t("El modelo local", "The local model"), render: R.model,
          print: pr(t("Cada pareja de cada equipo", "Each pair in each team"), t(`${2 * g} (2 por equipo)`, `${2 * g} (2 per team)`), BW, t("Clase de cierre, después de la puesta en común", "Closing class, after the pooling")) },
        { id: "check", n: "22", count: n, title: t("Comprobación individual", "Individual check"), render: R.check,
          print: pr(t("Cada estudiante", "Every student"), t(`${n} (1 por estudiante)`, `${n} (1 per student)`), BW, t("Final de la clase de cierre; la parte 2, para la clase siguiente", "End of the closing class; part 2, for the next class")) },
        { id: "guide", n: "90", teacher: true, title: t("Guía docente", "Teacher guide"), render: R.guide, print: pr(t("Solo para ti", "For you only"), "1", BW, t("Antes del lanzamiento", "Before the launch")) },
        { id: "solution", n: "91", teacher: true, title: t("Solución", "Solution"), render: R.solution, print: pr(t("Solo para ti", "For you only"), "1", BW, t("Antes del lanzamiento; no circula", "Before the launch; it does not circulate")) },
      ];
    },
    bundles(X) {
      const { t, room } = X, g = room.groups.length, n = room.students;
      return [
        { id: "team", label: t("Juego de un equipo · hojas A–D", "One team's set · Sheets A–D"), docs: ["a", "b", "c", "d"], use: t(`${g} juegos, uno por equipo, en el lanzamiento; cada hoja, a su rol`, `${g} sets, one per team, at the launch; each sheet to its role`) },
        { id: "role-a", label: t("Rol A · movimiento", "Role A · motion"), docs: ["a"], use: t(`${g} copias, una por equipo`, `${g} copies, one per team`) },
        { id: "role-b", label: t("Rol B · escena", "Role B · scene"), docs: ["b"], use: t(`${g} copias, una por equipo`, `${g} copies, one per team`) },
        { id: "role-c", label: t("Rol C · entrevistas", "Role C · interviews"), docs: ["c"], use: t(`${g} copias, una por equipo`, `${g} copies, one per team`) },
        { id: "role-d", label: t("Rol D · coordinación", "Role D · coordination"), docs: ["d"], use: t(`${g} copias, una por equipo`, `${g} copies, one per team`) },
        { id: "close-team", label: t("Clase de cierre · el modelo local", "Closing class · the local model"), docs: ["model"], use: t(`${2 * g} copias, dos por equipo`, `${2 * g} copies, two per team`) },
        { id: "close-student", label: t("Clase de cierre · comprobación individual", "Closing class · individual check"), docs: ["check"], use: t(`${n} copias, una por estudiante`, `${n} copies, one per student`) },
        { id: "teacher", label: t("Paquete docente", "Teacher packet"), docs: ["guide", "solution"], use: t("1, para ti", "1, for you") },
      ];
    },
    slides,
    guide(X) {
      const { t, room } = X, g = room.groups.length;
      return {
        before: [t("Las hojas A–D de un mismo equipo son distintas entre sí, pero iguales de un equipo a otro: imprime un juego por equipo.", "Sheets A–D within a team differ from each other but are the same from one team to the next: print one set per team.")],
        steps: t([
          `**Antes del lanzamiento.** Separa ${g} juegos de hojas A–D, uno por equipo.`,
          `**Lanzamiento.** En la diapositiva de los equipos, entrega a cada equipo su juego: cada hoja, a su rol (A movimiento, B escena, C entrevistas, D coordinación).${room.three ? ` En ${room.three === 1 ? "el equipo de tres" : `los ${room.three} equipos de tres`}, quien tiene la C se queda también la D.` : ""}`,
          `**Clase de cierre, tras la puesta en común.** El modelo local: dos por equipo (${2 * g}), uno por pareja.`,
          "**Clase de cierre, al final.** La comprobación individual; la parte 2 puede ir a casa. Recoge las hojas D.",
        ], [
          `**Before the launch.** Set aside ${g} sets of Sheets A–D, one per team.`,
          `**Launch.** At the teams slide, give each team its set: each sheet to its role (A motion, B scene, C interviews, D coordination).${room.three ? ` In ${room.three === 1 ? "the team of three" : `the ${room.three} teams of three`}, whoever holds C also keeps D.` : ""}`,
          `**Closing class, after the pooling.** The local model: two per team (${2 * g}), one per pair.`,
          "**Closing class, at the end.** The individual check; part 2 can go home. Collect the D sheets.",
        ]),
        material: t(["Calculadora (opcional).", "En la pizarra, una recta horizontal con la salida del túnel marcada como $s=0$."], ["A calculator (optional).", "On the board, a horizontal line with the tunnel exit marked as $s=0$."]),
      };
    },
    summary(X) {
      const { t, room, D } = X;
      return [
        [t("Estudiantes", "Students"), String(room.students)],
        [t("Equipos", "Teams"), [room.four && `${room.four} × 4`, room.three && `${room.three} × 3`].filter(Boolean).join(", ").replace(/^/, `${room.groups.length}: `)],
        [t("Datos del registro", "Record data"), X.variantLabel],
        [t("Lanzamiento", "Launch"), "15–20 min"],
        [t("En casa", "At home"), t("45–60 min por equipo", "45–60 min per team")],
        [t("Clase de cierre", "Closing class"), "55 min"],
        [t("Copias para el alumnado", "Student copies"), t(`${4 * room.groups.length} hojas A–D, ${2 * room.groups.length} modelos, ${room.students} comprobaciones`, `${4 * room.groups.length} sheets A–D, ${2 * room.groups.length} models, ${room.students} checks`)],
      ];
    },
    checks(X) {
      const { t, D } = X;
      return D.key === "book" ? [] : [{ text: t("Estos datos no son los del libro: usa la solución que genera la web con ellos.", "These data are not the book's: use the solution the website generates with them.") }];
    },
    preview(X, el) {
      const { t, D } = X;
      el.innerHTML = (X.scene ? `<figure><img src="${X.scene.data}" alt="${t("Croquis de la escena", "Sketch of the scene")}"><figcaption>${t("Croquis de la hoja B", "Sketch on Sheet B")}</figcaption></figure>` : "")
        + `<table class="cc-groups"><thead><tr><th>t (s)</th>${TIMES.map((u) => `<th>${String(u).replace("-", "−")}</th>`).join("")}</tr></thead><tbody><tr><td>s (m)</td>${D.pos.map((s) => `<td>${fix1(s).replace("-", "−")}</td>`).join("")}</tr></tbody></table>`
        + `<p class="cc-help">${t("Registro del movimiento de la hoja A.", "Motion record on Sheet A.")}</p>`;
    },
  });

  root.Tunnel = { VARIANTS, record, fmt };
})(typeof window !== "undefined" ? window : globalThis);
