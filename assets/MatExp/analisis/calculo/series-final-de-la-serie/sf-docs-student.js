/*
 * Calculus Cases · Case 7 · The Series Finale — student documents.
 *
 * Renderers for the documents students receive: the opening (00), the show (01), the creative
 * team (02), Meridian's security report (03), the trailer montage sheet (04), the six episode
 * dossiers (11–16), the envelope of the second session (30) and the templates (31). Each renderer
 * receives the house writer (sf-pdf.js) and a context `X` built by sf-generator.js:
 *   X.t(es, en)      choose the language,     X.L(obj)   {es, en} -> filled string,
 *   X.cfg            configuration,            X.C        evidence context (sf-evidence.js),
 *   X.A              prepared images,          X.SF       case data,  X.M  sf-math.js.
 */
(function (root) {
  "use strict";
  const DOCS = (root.SFDocs = root.SFDocs || { renderers: {} });
  const R = DOCS.renderers;

  const kicker = (X) => X.t("Calculus Cases · Caso 7 · ZENO", "Calculus Cases · Case 7 · ZENO");
  DOCS.kicker = kicker;
  const nameOf = (X, id) => {
    if (id === "suite") return X.t("Sala de montaje (copia de Álex Soler)", "Editing suite (Álex Soler's copy)");
    if (id === "ferro") return "Ferro VFX";
    if (id === "marta") return "Marta Quiroga";
    const p = X.SF.people.suspects.find((s) => s.id === id);
    return p ? p.name : id;
  };
  DOCS.nameOf = nameOf;
  const fmt = (X, x, d = 3) => X.M.fmt(x, d);

  // ---------------------------------------------------------------------- the case page
  /**
   * The first part of every dossier: what happened, who the suspects are and the known timeline.
   * The opening, the show and the creative team are projected at the launch (sf-slides.js); this
   * page is what the group needs of them at home.
   */
  DOCS.caseSheet = function (w, X) {
    const { t, SF } = X;
    w.heading(t("El caso", "The case"));
    w.paragraph(X.L({
      es: "Un vídeo de diez segundos con la escena final de ZENO, la serie más vista del año, apareció a las {leakTime} del {D1weekday} en el foro de fans {forum}, publicado por «punto_z». La noche anterior, el {D0weekday}, alguien manipuló en Estudios Meridiano el proyecto del tráiler oficial: rehízo dos planos y añadió, como cierre, la escena filtrada. Cinco personas del equipo creativo pudieron hacerlo.",
      en: "A ten-second video with the final scene of ZENO, the year's most watched show, appeared at {leakTime} on {D1weekday} on the fan forum {forum}, posted by “punto_z”. The night before, on {D0weekday}, someone tampered with the official trailer project at Meridian Studios: they remade two shots and added the leaked scene as the closing one. Five people from the creative team could have done it.",
    }));
    w.table([t("Sospechoso", "Suspect"), t("Papel", "Role"), t("Episodios", "Episodes")],
      SF.people.suspects.map((p) => [p.name, X.L(p.role), p.episodes.length ? p.episodes.join(", ") : t("el tráiler", "the trailer")]), [44, 96, 40], { tight: true, boldFirst: true });
    w.sub(t("Cronología conocida", "Known timeline"));
    w.table([t("Cuándo", "When"), t("Qué", "What")], DOCS.publicTimeline(X), [36, 144], { zebra: true, tight: true });
  };
  DOCS.publicTimeline = (X) => {
    const t = X.t;
    return [
      [X.L({ es: "{D0weekday} 19:00–20:30", en: "{D0weekday} 19:00–20:30" }), t("Reunión de revisión final del equipo creativo en la sala de proyección (planta 1). Asisten los cinco miembros del equipo.", "Final review meeting of the creative team in the screening room (floor 1). All five members attend.")],
      [X.L({ es: "{D0weekday}, noche", en: "{D0weekday}, night" }), t("Alguien abre el proyecto del tráiler y lanza el render TRL_ALT_07.", "Someone opens the trailer project and starts render TRL_ALT_07.")],
      [X.L({ es: "{D1weekday} {leakTime}", en: "{D1weekday} {leakTime}" }), t("«punto_z» publica el vídeo en el foro.", "“punto_z” posts the video on the forum.")],
      [X.L({ es: "{D1weekday} 09:00", en: "{D1weekday} 09:00" }), t("Seguridad descubre la manipulación del proyecto.", "Security discovers that the project has been tampered with.")],
      [X.L({ es: "{D1weekday} 12:00", en: "{D1weekday} 12:00" }), t("Vera Lindqvist declara a la prensa que el vídeo es un montaje.", "Vera Lindqvist tells the press that the video is a fake.")],
      [X.L({ es: "{D1weekday} 13:00", en: "{D1weekday} 13:00" }), t("Nadir aplaza el estreno del final.", "Nadir postpones the premiere of the finale.")],
    ];
  };

  // ---------------------------------------------------------------------- 1k dossiers
  R.dossier = function (w, X, k) {
    const { t, SF } = X;
    const D = SF.dossiers.find((d) => d.episode === k), ep = SF.show.episodes.find((e) => e.id === k);
    const gi = X.cfg.classroom.groups.findIndex((g) => g.episode === k), group = X.cfg.classroom.groups[gi];
    w.title(`${t("Dosier del episodio", "Episode dossier")} ${k} · ${X.L(ep.title)}`, kicker(X), t("RESERVADO", "RESTRICTED"));
    // the episode's still beside the header
    const still = X.A.stills && X.A.stills[k], sw = 58, sh = sw * 9 / 16, sy = w.y - 3.5;
    if (still) {
      w.doc.addImage(still, "JPEG", w.margin + w.W() - sw, sy, sw, sh, `still-${k}`, "FAST");
      w.rich(X.L(ep.still), { x: w.margin + w.W() - sw, y: sy + sh + 3.6, width: sw, size: 9, family: "SFSans", color: w.CC.muted, lineH: 3.8 });
    }
    w.meta([
      [t("Grupo", "Group"), group ? t(`${gi + 1} · ${group.size} estudiantes`, `${gi + 1} · ${group.size} students`) : "—"],
      [t("Episodio", "Episode"), `${k} · ${X.L(ep.title)}`], [t("Matemáticas", "Mathematics"), X.L(ep.topic)],
      [t("Guion", "Written by"), D.writers.map((id) => nameOf(X, id)).join(", ")], [t("Ejercicios", "Exercises"), X.L(SF.levels[X.cfg.level])],
    ], { width: w.W() - sw - 6 });
    w.y = Math.max(w.y, sy + sh + 4 + (still ? w.rich(X.L(ep.still), { x: 0, y: 0, width: sw, size: 9, family: "SFSans", lineH: 3.8, measureOnly: true }).height : 0) + 6);
    w.callout(`${t("La pregunta del grupo", "The group's question")}: ${X.L(D.question)}`, "blue", { sans: true });
    w.heading(t("Lo que traéis a la clase de cierre", "What you bring to the closing class"));
    w.bullets(t([
      "**El hallazgo** de vuestra prueba forense, en una frase y con su cálculo.",
      "**Los valores de vuestro plano** del tráiler, comprobados con sus reglas: los introduciréis en la sala de montaje.",
      "**Dos preguntas** para los sospechosos.",
    ], [
      "**The finding** of your forensic exhibit, in one sentence and with its calculation.",
      "**The values of your shot** of the trailer, checked against its rules: you will enter them in the editing room.",
      "**Two questions** for the suspects.",
    ]), true);
    DOCS.caseSheet(w, X);
    // shooting script and effects bible
    w.heading(t("Guion técnico", "Shooting script"));
    w.sub(X.L(D.script.heading));
    D.script.lines.forEach(([who, line]) => {
      if (who) w.paragraph(`**${who}.** ${X.L(line)}`, { x: w.margin + 8, width: w.W() - 16, size: 10.5, gap: 1.4 });
      else w.paragraph(X.L(line), { size: 10.5, italic: true, gap: 1.4 });
    });
    w.heading(`${t("Biblia de efectos matemáticos", "Mathematical effects bible")} (${D.bible.version})`);
    w.table([t("Referencia", "Reference"), t("Instrucción", "Instruction")], D.bible.items.map(([a, b]) => [X.L(a), X.L(b)]), [28, 152]);
    if (D.bible.v1) {
      w.sub(t("Extracto de la versión v1 (marzo), conservado en el archivo", "Extract of version v1 (March), kept in the archive"));
      w.table([t("Referencia", "Reference"), t("Instrucción", "Instruction")], D.bible.v1.map(([a, b]) => [X.L(a), X.L(b)]), [28, 152]);
    }
    // the consultant's notes and the forensic exhibit
    const notes = X.A.notes && X.A.notes[k];
    if (notes) {   // 70 % of the width, or down to 50 % if that keeps them on this page
      let nw = w.W() * 0.7, nh = nw * notes.ratio;
      const room = w.room() - 18;
      if (nh > room && room >= w.W() * 0.5 * notes.ratio) { nh = room; nw = nh / notes.ratio; }
      w.ensure(nh + 16);
      w.heading(t("Notas del consultor", "The consultant's notes"));
      w.image(notes.data, nw, nh, { alias: `notes-${k}`, gap: 2 });
    }
    w.ensure(60);
    w.heading(`${t("Prueba forense", "Forensic exhibit")} · ${X.L(D.evidence.title)}`);
    w.paragraph(X.L(D.evidence.intro), { italic: true });
    EVIDENCE[D.evidence.id](w, X, D);
    // exercises of the chosen level; the forensic one (★) is always there
    w.heading(t("Ejercicios", "Exercises"), { keep: 45 });
    w.paragraph(t("Los marcados con ★ usan la prueba forense. Escribid los resultados en los recuadros y el razonamiento en las líneas.", "Those marked ★ use the forensic exhibit. Write the results in the boxes and the reasoning on the lines."), { size: 9.5 });
    root.SFBuild.exercisesFor(D, X.cfg.level).forEach((ex) => {
      w.ensure(30);
      w.paragraph(`**${ex.id}${ex.evidence ? " ★" : ""}** ${X.L(ex.text)}`, { gap: 1.5 });
      const boxes = ex.answers.filter((a) => a.type !== "justification").map((a) => (typeof a.label === "string" ? `$${a.label}$` : X.L(a.label)));
      if (boxes.length) w.answers(boxes, { cols: Math.min(4, boxes.length), h: 12 });
      w.lines(ex.answers.some((a) => a.type === "justification") ? 3 : 1, 7.5);
    });
    // the calculation sheet and its graph, for the full levels
    if (X.cfg.level !== "B") {
      if (w.room() < 80 && w.room() > 16) w.lines("fill", 7.5);
      TABLES[D.family](w, X, D);
    }
    // the group's shot of the trailer (its rules may continue on the next page)
    w.ensure(45);
    w.heading(`${t("Vuestro plano del tráiler", "Your shot of the trailer")} · ${X.L(D.challenge.title)}`);
    w.paragraph(X.L(D.challenge.story));
    w.sub(t("Reglas de la escena", "Rules of the scene"));
    w.bullets(D.challenge.rules.map((r) => X.L(r)));
    w.paragraph(`${X.L(D.challenge.deliver)} ${t("En la clase de cierre los introduciréis en la sala de montaje, y el plano aparecerá en el tráiler de la clase.", "In the closing class you will enter them in the editing room, and the shot will appear in the class trailer.")}`);
    w.answers([t("Vuestros parámetros", "Your parameters"), t("¿Qué cambia en la imagen respecto al tráiler oficial?", "What changes in the picture compared with the official trailer?")], { cols: 2, h: 18 });
    w.answers([t("¿Se cumple cada regla? ¿Por qué?", "Does each rule hold? Why?")], { cols: 1, h: 24 });
    // questions for the suspects, with the rest of the page to write on
    w.ensure(60);
    w.heading(t("Preguntas para los sospechosos", "Questions for the suspects"));
    w.bullets(D.prepare.map((q) => X.L(q)));
    w.paragraph(t("Añadid vuestras dos preguntas. Una buena pregunta pide un dato que se pueda contrastar con un documento o con un cálculo.", "Add your two questions. A good question asks for something that can be checked against a document or a calculation."), { size: 9.5, italic: true });
    w.lines(w.room() > 30 ? "fill" : 4, 7.5);
  };

  // ---------------------------------------------------------------------- forensic exhibits
  const EVIDENCE = {
    render(w, X, D) {
      const { t } = X, C = X.C.render;
      w.table([t("Trabajo", "Job"), t("Fotogramas", "Frames"), t("Perfil", "Profile"), t("Estado", "Status"), t("Terminado", "Finished"), t("Estación", "Workstation")],
        [["TRL_ALT_07", String(C.frames), "ZENO-VOL-3", t("completado", "completed"), X.L({ es: `{D1weekday} ${X.C.tokens.renderFinish}`, en: `{D1weekday} ${X.C.tokens.renderFinish}` }), t("Sala de montaje (P3)", "Editing suite (F3)")]], [28, 20, 24, 24, 42, 42]);
      w.callout(X.L(D.evidence.manual), "note", { sans: true, size: 9 });
      w.paragraph(t("El servidor no guarda la hora de inicio. Ningún trabajo de esa noche quedó en cola: los renders empiezan en el momento en que se lanzan desde la estación.", "The server does not keep the start time. No job that night was queued: renders start the moment they are launched from the workstation."));
    },
    leak(w, X, D) {
      const { t } = X, LK = X.C.leak;
      if (X.A.evidence && X.A.evidence.leak) { w.image(X.A.evidence.leak, w.W() * 0.72, w.W() * 0.72 * 9 / 16, { alias: "ev-leak", gap: 2 }); w.caption(t("Fotograma 31 del vídeo publicado. Los anillos de eco convergen hacia la puerta del fondo.", "Frame 31 of the posted video. The echo rings converge towards the far door.")); }
      w.sub(t("Medidas del laboratorio técnico de Nadir", "Measurements by Nadir's technical lab"));
      w.table([t("Anillo", "Ring"), "1", "2", "3", "4", "5"], [[t("Distancia desde la entrada (m)", "Distance from the entrance (m)"), ...LK.printed.map((x) => X.M.fmt(x, 2))]], [52, 25, 25, 25, 25, 25]);
      // schematic: the corridor axis with the rings
      w.ensure(26);
      const x0 = w.margin + 4, x1 = w.margin + w.W() - 4, yy = w.y + 8, doc = w.doc;
      const X0 = (m) => x0 + (m / 20) * (x1 - x0);
      doc.setDrawColor(...w.CC.ink).setLineWidth(0.3).line(x0, yy, x1, yy);
      for (let m = 0; m <= 20; m++) { doc.line(X0(m), yy, X0(m), yy + (m % 5 ? 1.2 : 2.2)); if (m % 5 === 0) { doc.setFont("SFSans", "normal").setFontSize(8.5).setTextColor(...w.CC.ink).text(`${m}`, X0(m), yy + 5.5, { align: "center" }); } }
      doc.setDrawColor(...w.CC.blue).setLineWidth(0.5);
      LK.printed.forEach((x) => { doc.line(X0(x), yy - 5, X0(x), yy); });
      doc.setFont("SFSans", "bold").setFontSize(9).setTextColor(...w.CC.blue).text(t("puerta (20 m)", "door (20 m)"), X0(20), yy - 6, { align: "right" });
      doc.setFont("SFSans", "normal").text(t("entrada", "entrance"), X0(0), yy - 6);
      w.y = yy + 12;
    },
    press(w, X, D) {
      const { t } = X;
      w.callout(X.L(D.evidence.quote), "warn", { italic: true, size: 11 });
      w.paragraph(t("El extracto de la biblia de efectos de la página anterior describe el mismo pasillo y la misma sonda.", "The effects bible extract on the previous page describes the same corridor and the same probe."), { size: 9.5 });
    },
    journal(w, X, D) {
      const { t } = X, J = X.C.journal;
      w.meta([[t("Archivo", "File"), "ZENO_TRAILER.mtg"], [t("Contador al crear", "Counter at creation"), "0:00:00"], [t("Contador total", "Total counter"), X.C.tokens.journalTotal], [t("Último guardado", "Last save"), X.L({ es: `{D1weekday} ${X.C.tokens.journalClose}`, en: `{D1weekday} ${X.C.tokens.journalClose}` })]]);
      const day = (off) => X.dateLabel(off, true);
      w.table([t("Sesión", "Session"), t("Fecha", "Date"), t("Guardado y cierre", "Saved and closed"), t("Tiempo abierto", "Time open"), t("Cuenta", "Account")],
        J.sessions.map((s, k) => [String(k + 1), day(s.day), s.save, s.open, "promo_edit"]), [16, 46, 38, 38, 42], { zebra: true, tight: true });
      w.callout(X.L(D.evidence.manual), "note", { sans: true, size: 9 });
    },
    altS5(w, X, D) {
      const { t } = X, S5 = X.C.altS5;
      const cols = w.columns(3, 4);
      const imgs = (X.A.evidence && X.A.evidence.altS5) || [];
      imgs.slice(0, 3).forEach((im, k) => { w.doc.addImage(im, "JPEG", cols[k].x, w.y, cols[k].w, cols[k].w * 9 / 16, `alt5-${k}`, "FAST"); });
      if (imgs.length) w.y += cols[0].w * 9 / 16 + 5;
      w.table([t("Minuto", "Minute"), ...S5.readings.map((r) => String(r.minute))], [[t("Dosis acumulada de Irene", "Irene's accumulated dose"), ...S5.readings.map((r) => X.M.fmt(r.value, 3))]], [52, 25, 25, 25, 25, 25]);
      w.paragraph(t("En el minuto 11 el plano muestra la alarma del dosímetro de Irene.", "At minute 11 the shot shows the alarm of Irene's dosimeter."), { size: 9.5 });
    },
    altS6(w, X, D) {
      const { t } = X, S6 = X.C.altS6;
      const cols = w.columns(2, 4);
      const imgs = (X.A.evidence && X.A.evidence.altS6) || [];
      imgs.slice(0, 2).forEach((im, k) => { w.doc.addImage(im, "JPEG", cols[k].x, w.y, cols[k].w, cols[k].w * 9 / 16, `alt6-${k}`, "FAST"); });
      if (imgs.length) w.y += cols[0].w * 9 / 16 + 5;
      w.table([t("Oscilación", "Swing"), ...S6.positions.map((p) => String(p.n))], [[t("Posición de la baliza (m)", "Beacon position (m)"), ...S6.positions.map((p) => X.M.fmt(p.x, 2))]], [52, 32, 32, 32, 32]);
      w.paragraph(t("Valores útiles: $A_n = 1 - 1/2 + 1/3 - \\cdots \\pm 1/n$ vale 0.7833 para $n = 5$, 0.6167 para $n = 6$, 0.7456 para $n = 9$ y 0.6456 para $n = 10$.", "Useful values: $A_n = 1 - 1/2 + 1/3 - \\cdots \\pm 1/n$ equals 0.7833 for $n = 5$, 0.6167 for $n = 6$, 0.7456 for $n = 9$ and 0.6456 for $n = 10$."), { size: 9.5 });
    },
  };

  // ---------------------------------------------------------------------- calculation sheets
  // The consultant filled in the first rows (handwriting, as in Delta City); the rest is blank.
  const hand = (row, i) => row.__hand && i > 0;
  function sheet(w, X, title, headers, rows, widths) {
    w.ensure(78);
    w.heading(title);
    const y0 = w.y;
    w.table(headers, rows, widths, { tight: true, minRow: 6.5, hand, width: w.W() * 0.56 });
    sheet.bottom = w.y; sheet.height = w.y - y0; w.y = y0 - 5;   // the graph goes on the right, level with the table
  }
  /** Graph next to the calculation table; the writer continues below whichever is longer. */
  function sideGrid(w, spec) {
    const r = w.grid(Object.assign({ x: w.margin + w.W() * 0.56 + 12, w: w.W() * 0.44 - 14, h: Math.max(46, sheet.height - 16) }, spec));
    w.y = Math.max(w.y, sheet.bottom);
    return r;
  }
  const H = (row) => { row.__hand = true; return row; };
  const TABLES = {
    countdown(w, X) {
      const { t } = X, M = X.M, p = { form: "R", T: 60, c: 1 };
      const rows = Array.from({ length: 8 }, (_, k) => { const n = k + 1; return n <= 3 ? H([String(n), M.fmt(M.countdown.t(p, n), 2), M.fmt(M.countdown.gap(p, n), 2), M.fmt(60 - M.countdown.t(p, n), 2)]) : [String(n), "", "", ""]; });
      sheet(w, X, t("Hoja de cálculo · la cuenta atrás", "Calculation sheet · the countdown"), ["$n$", "$t_n$ (s)", "$g_n = t_{n+1} - t_n$", "$60 - t_n$"], rows, [20, 50, 55, 55]);
      sideGrid(w, { xmin: 0, xmax: 12, ymin: 0, ymax: 60, xstep: 2, ystep: 10, xLabel: "n", yLabel: t("Instantes $t_n$ de los pitidos", "Beep instants $t_n$"), hlines: [60] });
    },
    geometric(w, X) {
      const { t } = X, M = X.M;
      const rows = Array.from({ length: 8 }, (_, k) => { const n = k + 1; return n <= 2 ? H([String(n), M.fmt(M.geometric.term(8, 0.6, n), 3), M.fmt(M.geometric.partial(8, 0.6, n), 3), M.fmt(20 - M.geometric.partial(8, 0.6, n), 3)]) : [String(n), "", "", ""]; });
      sheet(w, X, t("Hoja de cálculo · los anillos de eco (v3)", "Calculation sheet · the echo rings (v3)"), [t("Anillo $k$", "Ring $k$"), t("Hueco $8 \\cdot 0.6^{k-1}$", "Gap $8 \\cdot 0.6^{k-1}$"), t("Posición $x_k$", "Position $x_k$"), t("Falta hasta la puerta", "Left to the door")], rows, [26, 52, 51, 51]);
      sideGrid(w, { xmin: 0, xmax: 10, ymin: 0, ymax: 22, xstep: 1, ystep: 4, xLabel: "k", yLabel: t("Posiciones $x_k$ (m)", "Positions $x_k$ (m)"), hlines: [20] });
    },
    harmonic(w, X) {
      const { t } = X, M = X.M;
      const rows = Array.from({ length: 8 }, (_, k) => { const n = [1, 2, 3, 4, 8, 16, 32, 64][k]; return n <= 2 ? H([String(n), M.fmt(1 / n, 4), M.fmt(M.harmonic.H(n), 4), M.fmt(M.harmonic.H(n) / 10, 4)]) : [String(n), "", "", ""]; });
      sheet(w, X, t("Hoja de cálculo · la sonda", "Calculation sheet · the probe"), ["$n$", "$1/n$", "$H_n$", "$F_n = H_n/10$"], rows, [24, 50, 53, 53]);
      sideGrid(w, { xmin: 0, xmax: 64, ymin: 0, ymax: 6, xstep: 8, ystep: 1, xLabel: "n", yLabel: t("Sumas parciales $H_n$: ¿se frenan o se detienen?", "Partial sums $H_n$: do they slow down or stop?") });
    },
    telescoping(w, X) {
      const { t } = X, M = X.M, p = { form: "H", A: 1, m: 0 };
      const rows = Array.from({ length: 8 }, (_, k) => { const n = k + 1; return n <= 2 ? H([String(n), `1/${n * (n + 1)}`, `1/${n} − 1/${n + 1}`, M.fmt(M.telescoping.partial(p, n), 4)]) : [String(n), "", "", ""]; });
      sheet(w, X, t("Hoja de cálculo · el registro", "Calculation sheet · the log"), [t("Línea $k$", "Line $k$"), "$\\Delta_k$", t("Como diferencia", "As a difference"), "$S_k$"], rows, [24, 40, 60, 56]);
      sideGrid(w, { xmin: 0, xmax: 10, ymin: 0, ymax: 1.2, xstep: 1, ystep: 0.2, xLabel: "N", yLabel: t("Sumas parciales $S_N$", "Partial sums $S_N$"), hlines: [1] });
    },
    pseries(w, X) {
      const { t } = X, M = X.M;
      const rows = Array.from({ length: 8 }, (_, k) => { const n = k + 1; return n <= 2 ? H([String(n), M.fmt(M.pseries.partial(1, 1, n), 3), M.fmt(M.pseries.partial(1, 2, n), 3), M.fmt(M.pseries.partial(1, 1.5, n), 3)]) : [String(n), "", "", ""]; });
      sheet(w, X, t("Hoja de cálculo · las dosis", "Calculation sheet · the doses"), [t("Minuto $n$", "Minute $n$"), t("Sara: $\\sum 1/k$", "Sara: $\\sum 1/k$"), t("Irene: $\\sum 1/k^2$", "Irene: $\\sum 1/k^2$"), t("Con $p = 1.5$", "With $p = 1.5$")], rows, [28, 50, 51, 51]);
      sideGrid(w, { xmin: 0, xmax: 12, ymin: 0, ymax: 3.2, xstep: 1, ystep: 0.5, xLabel: "n", yLabel: t("Dosis acumuladas (umbral 2)", "Accumulated doses (threshold 2)"), hlines: [2] });
    },
    alternating(w, X) {
      const { t } = X, M = X.M, p = { form: "P", L: 12, s: 1 };
      const rows = Array.from({ length: 10 }, (_, k) => { const n = k + 1; return n <= 2 ? H([String(n), `${n % 2 ? "+" : "−"}${M.fmt(12 / n, 3)}`, M.fmt(M.alternating.position(p, n), 3), M.fmt(M.alternating.path(p, n), 3)]) : [String(n), "", "", ""]; });
      sheet(w, X, t("Hoja de cálculo · la baliza", "Calculation sheet · the beacon"), [t("Oscilación $n$", "Swing $n$"), t("Desplazamiento", "Move"), t("Posición $S_n$", "Position $S_n$"), t("Camino $P_n$", "Path $P_n$")], rows, [28, 50, 51, 51]);
      sideGrid(w, { xmin: 0, xmax: 12, ymin: 0, ymax: 14, xstep: 1, ystep: 2, xLabel: "n", yLabel: t("Posiciones $S_n$ (m)", "Positions $S_n$ (m)"), hlines: [8.3] });
    },
  };


  // ---------------------------------------------------------------------- 30 envelope
  R.envelope = function (w, X) {
    const { t, SF } = X, E = SF.envelope;
    w.title(t("El sobre de la segunda jornada", "The second-session envelope"), kicker(X), t("RESERVADO", "RESTRICTED"));
    w.callout(t(
      "Contenido del sobre: los documentos que seguridad ha entregado a la unidad con la orden judicial.",
      "Contents of the envelope: the documents security handed to the unit under the warrant."), "blue");
    w.heading(t("1. Control de accesos de la planta 3 (posproducción)", "1. Floor 3 access control (post-production)"));
    w.paragraph(X.L(E.building));
    w.table([t("Fecha", "Date"), t("Hora", "Time"), t("Tarjeta", "Badge"), t("Lector", "Reader")], E.accessP3.map((a) => [X.dateLabel(a.day, true), a.time, nameOf(X, a.who), t("Escalera / ascensor P3", "Stairs / lift F3")]), [42, 22, 66, 50], { zebra: true, tight: true });
    w.sub(t("Partes de ronda del vigilante (Rubén Lago)", "Security guard's rounds (Rubén Lago)"));
    w.table([t("Fecha", "Date"), t("Hora", "Time"), t("Anotación", "Entry")], E.rounds.map((r) => [X.dateLabel(r.day, true), r.time, X.L(r.text)]), [42, 18, 120]);
    w.heading(t("2. Lista de distribución de la biblia de efectos matemáticos", "2. Distribution list of the mathematical effects bible"));
    w.table([t("Versión", "Version"), t("Fecha", "Date"), t("Autoría", "Author"), t("Recibida por", "Received by"), t("Nota", "Note")],
      E.distribution.map((d) => [d.id, X.L(d.date), [d.author, d.coauthor].filter(Boolean).map((id) => nameOf(X, id)).join(", "), d.recipients.map((id) => nameOf(X, id)).join(", "), X.L(d.note)]), [14, 24, 32, 62, 48]);
    w.heading(t("3. Memorando de seguridad: las copias marcadas del final", "3. Security memo: the marked copies of the finale"));
    w.paragraph(X.L(E.canary.memo));
    const copies = X.canaryCopies();
    w.table([t("Copia", "Copy"), t("Razón $r$ de los anillos", "Ring ratio $r$"), t("Primer anillo $a = 20(1-r)$", "First ring $a = 20(1-r)$"), t("Dónde estaba", "Where it was")],
      copies.map((c) => [nameOf(X, c.holder), X.M.fmt(c.r, 2), `${X.M.fmt(20 * (1 - c.r), 2)} m`, X.L(c.where)]), [44, 30, 40, 66]);
    w.paragraph(X.L(E.canary.metadata));
    w.heading(t("4. Programación de radio", "4. Radio schedule"));
    w.paragraph(X.L(E.radio));
    // exhibits of episodes that were not assigned to any team: the lab's result, stated
    const missing = [2, 3, 4, 6].filter((k) => !X.cfg.episodes.includes(k));
    if (missing.length) {
      w.heading(t("5. Resultados del laboratorio técnico", "5. Technical lab results"));
      w.paragraph(t("Estas pruebas no se han repartido a ningún equipo; el laboratorio las ha analizado y entrega sus conclusiones.", "These exhibits were not assigned to any team; the lab has analysed them and reports its conclusions."), { size: 9.5, italic: true });
      const res = {
        2: X.L({ es: `Fotograma filtrado: huecos ${X.C.leak.gaps.map((g) => X.M.fmt(g, 2)).join(", ")} m; razón {leakR}; suma 20 m. Copia auténtica de la versión v3.`, en: `Leaked frame: gaps ${X.C.leak.gaps.map((g) => X.M.fmt(g, 2)).join(", ")} m; ratio {leakR}; sum 20 m. A genuine copy of version v3.` }),
        3: t("Declaración de Vera Lindqvist: matemáticamente falsa. La serie armónica diverge y la biblia sitúa la llegada de la sonda en el minuto 12 367.", "Vera Lindqvist's statement: mathematically false. The harmonic series diverges and the bible places the probe's arrival in minute 12 367."),
        6: t("Plano S6 alternativo: amplitud 15 (pasillo de 25 m); la baliza se asienta entre 9.68 y 11.18 m, fuera de la hornacina de 8.3 m.", "Alternative S6 shot: amplitude 15 (25 m corridor); the beacon settles between 9.68 and 11.18 m, outside the 8.3 m alcove."),
        4: X.L({ es: "Diario del proyecto: las sesiones listadas suman {journalListed} y el contador total marca {journalTotal}. Falta una sesión de {journalMissing}: la última, abierta a las {journalOpen} y cerrada a las {journalClose}.", en: "Project journal: the listed sessions add up to {journalListed} and the total counter reads {journalTotal}. A session of {journalMissing} is missing: the last one, opened at {journalOpen} and closed at {journalClose}." }),
      };
      w.bullets(missing.map((k) => res[k]));
    }
  };

  // ---------------------------------------------------------------------- 31 board and accusation
  R.board = function (w, X) {
    const { t, SF } = X;
    w.title(t("Tablero de evidencias y acusación", "Evidence board and accusation"), kicker(X));
    w.heading(t("1. Tablero de evidencias", "1. Evidence board"));
    w.paragraph(t("Para cada sospechoso: ¿pudo estar ante la estación cuando se abrió la sesión borrada y cuando se cerró?, ¿tuvo la versión de la biblia que usa el montaje alternativo?, ¿sabía lo de las copias marcadas?, ¿qué coartada tiene y qué la confirma?", "For each suspect: could they be at the workstation when the deleted session opened and when it closed? Did they have the version of the bible the alternative cut uses? Did they know about the marked copies? What alibi do they have and what confirms it?"));
    w.table([t("Sospechoso", "Suspect"), t("En P3 al abrir la sesión", "On F3 when the session opened"), t("En P3 al cerrarla", "On F3 when it closed"), t("Versión de la biblia", "Bible version"), t("Marcas de agua", "Watermarks"), t("Coartada y prueba", "Alibi and proof"), t("Contradicciones", "Contradictions")],
      SF.people.suspects.map((p) => [p.name, "", "", "", "", "", ""]), [26, 24, 22, 24, 22, 32, 30], { minRow: 15, keep: true });
    w.heading(t("2. Acusación", "2. Accusation"));
    w.answers([t("Grupo e integrantes", "Group and members"), t("Acusamos a", "We accuse")], { cols: 2, h: 13 });
    w.answers([t("¿Cuándo actuó? (hora de inicio y cálculo que la demuestra)", "When did they act? (start time and the calculation that proves it)")], { cols: 1, h: 18 });
    w.answers([t("¿Cómo obtuvo el vídeo y lo publicó?", "How did they obtain and post the video?"), t("¿Por qué manipuló el tráiler y qué pretendía ocultar?", "Why did they tamper with the trailer and what were they trying to hide?")], { cols: 2, h: 24 });
    const rest = Math.max(30, (w.room() - 8) / 1);
    w.answers([t("Pruebas matemáticas (al menos dos, con su cálculo)", "Mathematical evidence (at least two, with their calculation)"), t("Por qué descartamos a cada uno de los demás", "Why we rule out each of the others")], { cols: 2, h: Math.min(rest, 90) });
  };

  // ---------------------------------------------------------------------- 32 individual check
  /** One sheet per student at the close of the second session (the templates go one set per team). */
  R.check = function (w, X) {
    const { t } = X;
    w.title(t("Comprobación individual", "Individual check"), kicker(X));
    w.meta([[t("Nombre", "Name"), ""], [t("Equipo", "Team"), ""]]);
    w.paragraph(t(
      "Responde por tu cuenta. (a) Pon un ejemplo de este caso en el que los términos tiendan a 0 y la serie diverja, y otro en el que la serie converja pero su suma sea mayor de lo que conviene. (b) ¿Por qué una tabla con muchas sumas parciales no demuestra que una serie converja?",
      "Answer on your own. (a) Give an example from this case where the terms tend to 0 and the series diverges, and another where the series converges but its sum is larger than it should be. (b) Why does a table with many partial sums not prove that a series converges?"));
    w.sub(t("(a) Los dos ejemplos", "(a) The two examples"));
    w.lines(Math.max(6, Math.floor((w.room() - 24) / 2 / 8)), 8);
    w.sub(t("(b) Por qué una tabla no basta", "(b) Why a table is not enough"));
    w.lines("fill", 8);
  };
})(typeof window !== "undefined" ? window : globalThis);
