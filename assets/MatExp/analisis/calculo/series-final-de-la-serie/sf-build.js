/*
 * Calculus Cases · Case 7 · The Series Finale — document builder (no UI).
 *
 * Turns a configuration into the case's PDFs (documents, packets per role, complete file) and
 * into the JSON activity packages. Used by the teacher generator page and by the headless
 * pipeline that produces the book's photocopiable pages (tools/render_pdfs.py).
 */
(function (root) {
  "use strict";
  const SF = () => root.SFData, M = root.SFMath, E = root.SFEvidence, TEX = root.SFTex, PDF = root.SFPdf, DOCS = root.SFDocs, TR = root.SFTrailer;
  const BASE = (function () {
    const s = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : "";
    return s ? s.slice(0, s.lastIndexOf("/") + 1) : "";
  })();
  const url = (p) => BASE + p;

  // ------------------------------------------------------------------------ configuration
  const DEFAULT = {
    lang: "es", format: "a4", night: "2026-10-13", students: 25, level: "B", video: true,
    investigation: { render: { frames: 240, first: 12, step: 0.25, finish: "01:12:30" }, suiteRatio: 0.64 },
    constraints: {},
  };
  /** Episodes in the order groups take them: 1 and 5 are essential, then 4, 2, 6 and 3. */
  const EPISODE_PRIORITY = [1, 5, 4, 2, 6, 3];
  /**
   * The class from its number of students: five suspects (in pairs from 31 students on) and
   * between two and six investigation groups of two to five, one episode each. Episodes that no
   * group takes reach the class as the lab's results in the second-session envelope.
   */
  function classroom(students) {
    const n = Math.max(9, Math.min(40, Math.round(Number(students) || DEFAULT.students)));
    const pairs = n >= 31, suspects = pairs ? 10 : 5, inv = n - suspects;
    let g = Math.max(2, Math.min(6, Math.round(inv / 3.5)));
    while (g < 6 && inv / g > 4.5) g++;
    while (g > 2 && inv / g < 2) g--;
    const episodes = EPISODE_PRIORITY.slice(0, g).sort((a, b) => a - b);
    const groups = episodes.map((episode, k) => ({ episode, size: Math.floor(inv / g) + (k < inv % g ? 1 : 0) }));
    return { students: n, pairs, suspects, investigators: inv, groups };
  }
  /** Exercises of a dossier for a level: B the essential ones, E all but the extension, A all. */
  function exercisesFor(D, level) {
    const core = new Set(D.core || []), ext = new Set(D.ext || []);
    return D.exercises.filter((e) => e.evidence || core.has(e.id) || (level !== "B" && ext.has(e.id)) || level === "A");
  }
  function normalize(cfg) {
    const c = JSON.parse(JSON.stringify(Object.assign({}, DEFAULT, cfg || {})));
    c.investigation = Object.assign({}, DEFAULT.investigation, (cfg && cfg.investigation) || {});
    c.investigation.render = Object.assign({}, DEFAULT.investigation.render, ((cfg && cfg.investigation) || {}).render || {});
    c.classroom = classroom(c.students);
    c.students = c.classroom.students;
    c.episodes = c.classroom.groups.map((g) => g.episode);
    c.teams = c.classroom.groups.length;
    delete c.sessions;
    if (!["B", "E", "A"].includes(c.level)) c.level = "B";
    if (c.format !== "letter") c.format = "a4";
    c.lang = c.lang === "en" ? "en" : "es";
    return c;
  }
  /** The watermark table with the suite's ratio set by the teacher; the other copies keep the rest. */
  function canaryCopies(cfg) {
    const all = [0.55, 0.58, 0.61, 0.64, 0.67, 0.70];
    const suite = cfg.investigation.suiteRatio;
    const rest = all.filter((r) => Math.abs(r - suite) > 1e-9);
    const base = SF().envelope ? SF().envelope.canary.copies : [];
    let k = 0;
    return base.map((c) => Object.assign({}, c, { r: c.holder === "suite" ? suite : rest[k++] }));
  }
  function overrides(cfg) {
    return { render: cfg.investigation.render, leakR: cfg.investigation.suiteRatio, canary: SF().envelope ? canaryCopies(cfg) : null };
  }
  function check(cfgIn) {
    const cfg = normalize(cfgIn);
    const res = SF().solution ? E.checkConfig(SF(), overrides(cfg)) : { ok: true, errors: [], warnings: [], context: E.context(SF(), overrides(cfg)) };
    if (!cfg.episodes.includes(1) || !cfg.episodes.includes(5)) res.errors.push(M.L("Los episodios 1 y 5 son imprescindibles: sin ellos no se puede deducir el culpable.", "Episodes 1 and 5 are essential: without them the culprit cannot be deduced."));
    res.ok = res.errors.length === 0;
    return Object.assign(res, { cfg });
  }

  // ------------------------------------------------------------------------ the context X
  function context(cfgIn, assets) {
    const cfg = normalize(cfgIn), lang = cfg.lang;
    const C = E.context(SF(), overrides(cfg));
    const t = (es, en) => (lang === "en" ? en : es);
    const night = new Date(`${cfg.night}T12:00:00`);
    const dayDate = (off) => { const d = new Date(night); d.setDate(d.getDate() + off); return d; };
    const fmtDate = (d) => new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", { day: "numeric", month: "long", year: "numeric" }).format(d);
    const weekday = (d) => new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", { weekday: "long" }).format(d);
    const dateLabel = (off, short) => { const d = dayDate(off); return short ? new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", { weekday: "short", day: "numeric", month: "short" }).format(d) : `${weekday(d)} ${fmtDate(d)}`; };
    const tokens = Object.assign({}, C.tokens, {
      D0weekday: weekday(dayDate(0)), D1weekday: weekday(dayDate(1)), D0date: fmtDate(dayDate(0)), D1date: fmtDate(dayDate(1)),
      forum: SF().investigation.leak.forum[lang], leakTime: SF().investigation.leak.postedAt,
      leakGaps: C.leak.gaps.map((g) => M.fmt(g, 2)).join(", "), leakA: M.fmt(C.leak.a, 2),
    });
    const fill = (s) => E.fill(s, tokens, lang);
    const deep = (v) => (Array.isArray(v) ? v.map(deep) : typeof v === "string" ? fill(v) : v);
    const L = (o) => (o == null ? "" : typeof o === "string" ? fill(o) : Array.isArray(o) ? deep(o) : deep(o[lang] != null ? o[lang] : o.es));
    const X = { cfg, lang, t, L, C, SF: SF(), M, A: assets || {}, tokens, dateLabel };
    X.canaryCopies = () => canaryCopies(cfg);
    if (SF().solution) X.unique = E.uniqueCulprit(SF(), overrides(cfg));
    X.truthTimeline = () => truthTimeline(X);
    return X;
  }
  function truthTimeline(X) {
    const { t } = X, k = X.C.tokens;
    return [
      ["19:00–20:30", t("Reunión. Vera aparta a Elías de la segunda temporada; Álex se burla de sus efectos.", "Meeting. Vera drops Elías from season 2; Álex mocks his effects.")],
      ["20:38", t("Álex vuelve a la sala de montaje.", "Álex returns to the editing suite.")], ["20:45", t("Ronda: P3 vacía salvo Álex.", "Round: F3 empty except for Álex.")],
      ["21:10–21:20", t("Nadia deja un USB a Álex.", "Nadia drops off a USB stick for Álex.")], ["21:30", t("Vera sale hacia su cena con Kairo.", "Vera leaves for her dinner with Kairo.")],
      ["21:35:10", t("Álex guarda el tráiler v6 y cierra el proyecto.", "Álex saves trailer v6 and closes the project.")], ["21:52", t("Álex entra en el metro.", "Álex enters the metro.")],
      ["21:58", t("Elías entra en P3.", "Elías enters F3.")], [k.journalOpen, t("Elías abre el proyecto.", "Elías opens the project.")],
      [k.renderStart, t("Lanza el render TRL_ALT_07.", "He starts render TRL_ALT_07.")], ["22:31", t("Guarda la secuencia TRL_ALT_AS con S5 y S6 rehechos (valores v2).", "He saves sequence TRL_ALT_AS with S5 and S6 remade (v2 values).")],
      ["22:00–23:00", t("Nadia, en antena.", "Nadia, on air.")], ["23:30", t("Ronda: luz y ruido de render en la sala.", "Round: light and render noise in the suite.")],
      ["00:15–00:32", t("Hugo imprime en P3; oye el render.", "Hugo prints on F3; hears the render.")], [k.renderFinish, t("Termina el render.", "The render ends.")],
      [k.journalClose, t("Elías cierra el proyecto.", "Elías closes the project.")], ["01:16", t("Borra su sesión del diario.", "He deletes his session from the journal.")],
      ["07:40", t("Publica el clip como «punto_z».", "He posts the clip as “punto_z”.")],
    ];
  }

  // ------------------------------------------------------------------------ assets
  const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  function canvasData(c, q = 0.86) { return c.toDataURL("image/jpeg", q); }
  async function prepareAssets(cfgIn, onStatus = () => {}) {
    const cfg = normalize(cfgIn), X = context(cfg);
    const A = { stills: {}, evidence: {}, notes: {} };
    try {
      const img = await loadImage(url("header-brand.jpg"));
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0); A.banner = { data: c.toDataURL("image/jpeg", 0.88), ratio: c.height / c.width };
    } catch (e) { A.banner = null; }
    onStatus(X.t("Componiendo los fotogramas de la serie…", "Composing the show's stills…"));
    const env = { SF: SF(), lang: cfg.lang };
    const cfgTR = TR.defaultConfig(SF());
    cfgTR.art = Object.assign({}, cfgTR.art, { letterbox: "none", camera: "static", cards: false, grain: 0.35 });
    const STILL = { 1: ["S1", 9], 2: ["S2", 6.5], 3: ["S3", 9], 4: ["S4", 8.5], 5: ["S5", 8], 6: ["S6", 9] };
    for (const k of Object.keys(STILL)) {
      const [id, tt] = STILL[k];
      A.stills[k] = canvasData(TR.evidenceFrame(env, "shot", 1280, 720, { id, t: tt, cfg: cfgTR, opts: { art: { hud: false } } }));
    }
    onStatus(X.t("Componiendo los fotogramas de las pruebas…", "Composing the exhibit frames…"));
    A.evidence.leak = canvasData(TR.evidenceFrame(env, "leak", 1280, 720, { r: cfg.investigation.suiteRatio, user: "punto_z", forum: SF().investigation.leak.forum[cfg.lang], time: SF().investigation.leak.postedAt, frameLabel: "31/240" }));
    A.evidence.altS5 = [2, 8, 11].map((m) => canvasData(TR.evidenceFrame(env, "altS5", 960, 540, { p: SF().investigation.altCut.s5.p, minute: m })));
    A.evidence.altS6 = [6, 10].map((k) => canvasData(TR.evidenceFrame(env, "altS6", 960, 540, { L: SF().investigation.altCut.s6.L, swing: k, alcove: 12 * Math.LN2 })));
    onStatus(X.t("Cargando las notas del consultor…", "Loading the consultant's notes…"));
    for (let k = 1; k <= 6; k++) {
      try {
        const img = await loadImage(url(`notes/consultant-notes-${cfg.lang}-${k}.jpg`));
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0); A.notes[k] = { data: c.toDataURL("image/jpeg", 0.88), ratio: c.height / c.width };
      } catch (e) { /* optional */ }
    }
    return A;
  }

  // ------------------------------------------------------------------------ documents
  function plan(cfgIn) {
    const cfg = normalize(cfgIn), t = (es, en) => (cfg.lang === "en" ? en : es);
    const R = DOCS.renderers, priv = !!SF().cards, room = cfg.classroom;
    // what each document is for, as the printing and distribution guide prints it (ESTANDAR, 5);
    // count = copies, so that the guide can add up the sheets
    const pr = (who, copies, how, when) => ({ who, copies, how, when });
    const BW = t("Doble cara; blanco y negro", "Double-sided; black and white"), ME = t("Solo para ti", "For you only");
    const nG = room.groups.length, perCard = room.pairs ? 2 : 1;
    const docs = [];
    if (priv) docs.push({ id: "print", n: "", teacher: true, title: t("Guía de impresión y reparto", "Printing and distribution guide"), file: t("LEEME_guia_de_impresion_y_reparto.pdf", "README_printing_and_distribution_guide.pdf"), render: R.printGuide });
    if (priv) docs.push({ id: "presentation", n: "00", slides: true, title: t("Presentación del caso", "Case presentation"), render: null,
      print: pr(t("Para proyectar en el lanzamiento y en la clase de cierre", "To project at the launch and in the closing class"), t("Ninguna (1 por grupo si no hay proyector)", "None (1 per group without a projector)"), t("Apaisada 16:9, en color", "Landscape 16:9, in colour"), t("Lanzamiento y clase de cierre", "Launch and closing class")) });
    room.groups.forEach((g, gi) => {
      const k = g.episode;
      docs.push({ id: `dossier-${k}`, n: `1${k}`, episode: k, count: g.size, title: `${t("Dosier del episodio", "Episode dossier")} ${k} · ${SF().show.episodes[k - 1].title[cfg.lang]}`, render: (w, X) => R.dossier(w, X, k),
        print: pr(t(`Grupo ${gi + 1}`, `Group ${gi + 1}`), t(`${g.size} (1 por estudiante)`, `${g.size} (1 per student)`), t("Doble cara; en color (fotogramas y pruebas)", "Double-sided; in colour (stills and exhibits)"), t("Lanzamiento; vuelve en la clase de cierre", "Launch; back in the closing class")) });
    });
    if (priv) {
      ["vera", "hugo", "nadia", "elias", "alex"].forEach((id, k) => docs.push({ id: `card-${id}`, n: `2${k + 1}`, suspect: id, confidential: true, count: perCard, title: `${t("Ficha privada", "Private card")} · ${SF().people.suspects.find((s) => s.id === id).name}`, render: (w, X) => R.card(w, X, id),
        print: pr(SF().people.suspects.find((s) => s.id === id).name, t(`${perCard}, en un sobre cerrado con el nombre por fuera`, `${perCard}, in a sealed envelope with the name outside`), BW, t("Lanzamiento", "Launch")) }));
      docs.push({ id: "envelope", n: "30", count: nG, title: t("Sobre de la clase de cierre", "Closing-class envelope"), render: R.envelope,
        print: pr(t("Cada grupo", "Each group"), t(`${nG} (1 por grupo), en un sobre cerrado`, `${nG} (1 per group), in a sealed envelope`), BW, t("Clase de cierre, después de la puesta en común", "Closing class, after the pooling")) });
    }
    docs.push({ id: "board", n: "31", count: nG, title: t("Tablero de evidencias y acusación", "Evidence board and accusation"), render: R.board,
      print: pr(t("Cada grupo", "Each group"), t(`${nG} (1 por grupo)`, `${nG} (1 per group)`), BW, t("Clase de cierre, con el sobre", "Closing class, with the envelope")) });
    docs.push({ id: "check", n: "32", count: room.students, title: t("Comprobación individual", "Individual check"), render: R.check,
      print: pr(t("Todos", "Everyone"), t(`${room.students} (1 por estudiante)`, `${room.students} (1 per student)`), t("Una cara; blanco y negro", "One side; black and white"), t("Al final de la clase de cierre (o en casa)", "At the end of the closing class (or at home)")) });
    if (priv) {
      docs.push({ id: "guide", n: "90", teacher: true, title: t("Guía docente", "Teacher guide"), render: R.guide, print: pr(ME, "1", BW, t("Antes del lanzamiento", "Before the launch")) });
      docs.push({ id: "solutions", n: "91", teacher: true, title: t("Solucionario", "Solutions"), render: R.solutions, print: pr(ME, "1", BW, t("Antes del lanzamiento; no circula", "Before the launch; it does not circulate")) });
      docs.push({ id: "resolution", n: "92", teacher: true, title: t("Resolución del caso", "Case resolution"), render: R.resolution, print: pr(ME, "1", BW, t("Antes del lanzamiento; no circula", "Before the launch; it does not circulate")) });
      docs.push({ id: "control", n: "93", teacher: true, title: t("Control de interrogatorios", "Interview control"), render: R.control, print: pr(ME, "1", BW, t("A mano durante la clase de cierre", "At hand during the closing class")) });
    }
    const bundles = room.groups.map((g, gi) => ({ id: `group-${gi + 1}`, label: `${t("Grupo", "Group")} ${gi + 1} · ${t("episodio", "episode")} ${g.episode}`, docs: [`dossier-${g.episode}`],
      use: t(`${g.size} copias, 1 por estudiante del grupo, en el lanzamiento`, `${g.size} copies, 1 per student in the group, at the launch`) }));
    if (priv) {
      ["vera", "hugo", "nadia", "elias", "alex"].forEach((id) => { const name = SF().people.suspects.find((s) => s.id === id).name; bundles.push({ id: `suspect-${id}`, label: `${t("Sospechoso", "Suspect")} · ${name}`, docs: [`card-${id}`], use: t(`${perCard} para quien interprete a ${name}, en sobre cerrado, en el lanzamiento`, `${perCard} for whoever plays ${name}, in a sealed envelope, at the launch`) }); });
      bundles.push({ id: "envelope", label: t("Sobre y tablero · clase de cierre", "Envelope and board · closing class"), docs: ["envelope", "board"], use: t(`${nG} copias, 1 por grupo; el 30, en sobre cerrado hasta la puesta en común`, `${nG} copies, 1 per group; document 30 sealed until the pooling`) });
      bundles.push({ id: "teacher", label: t("Paquete docente", "Teacher packet"), docs: ["print", "guide", "resolution", "control", "solutions", "envelope"], use: t("1, para ti", "1, for you") });
    }
    return { cfg, docs, bundles };
  }

  function buildDoc(spec, X) {
    if (spec.slides) {
      const doc = PDF.newDoc(root.SFSlides.SLIDE, "landscape");
      root.SFSlides.pdf(doc, root.SFSlides.build(X), X);
      return { id: spec.id, n: spec.n, label: spec.title, fileName: `${spec.n}_${stem(spec.title)}.pdf`, pages: doc.getNumberOfPages(), doc, blob: doc.output("blob") };
    }
    const doc = PDF.newDoc(X.cfg.format);
    const w = PDF.writer(doc, { format: X.cfg.format, banner: X.A.banner, kicker: DOCS.kicker(X), t: X.t });
    spec.render(w, X);
    PDF.footer(doc, spec.title, { t: X.t });
    const fileName = spec.file || `${spec.n}_${stem(spec.title)}.pdf`;
    return { id: spec.id, n: spec.n, label: spec.title, teacher: spec.teacher, confidential: spec.confidential, fileName, pages: doc.getNumberOfPages(), doc, blob: doc.output("blob") };
  }
  function buildBundle(bundle, specs, X) {
    const doc = PDF.newDoc(X.cfg.format);
    bundle.docs.forEach((id, k) => {
      const spec = specs.find((d) => d.id === id);
      if (spec.slides) { if (k) doc.addPage(root.SFSlides.SLIDE, "landscape"); root.SFSlides.pdf(doc, root.SFSlides.build(X), X); return; }
      if (k) doc.addPage(X.cfg.format, "portrait");
      const w = PDF.writer(doc, { format: X.cfg.format, banner: X.A.banner, kicker: DOCS.kicker(X), t: X.t });
      spec.render(w, X);
    });
    PDF.footer(doc, bundle.label, { t: X.t });
    return { id: bundle.id, label: bundle.label, fileName: `zeno_${stem(bundle.label)}.pdf`, blob: doc.output("blob") };
  }
  /** Everything: separate documents, packets per role and the complete file. */
  async function build(cfgIn, onStatus = () => {}) {
    const P = plan(cfgIn), assets = await prepareAssets(P.cfg, onStatus), X = context(P.cfg, assets);
    const files = [];
    for (const spec of P.docs.filter((d) => d.id !== "print")) { onStatus(`${X.t("Componiendo", "Composing")} ${spec.n} · ${spec.title}…`); files.push(buildDoc(spec, X)); await pause(); }
    // the printing guide lists the pages of every document and packet, its own included
    X.plan = P;
    X.pages = Object.fromEntries(files.map((f) => [f.id, f.pages]));
    const guideSpec = P.docs.find((d) => d.id === "print");
    let guide = null;
    if (guideSpec) {
      X.pages.print = 2;
      guide = buildDoc(guideSpec, X);
      if (guide.pages !== X.pages.print) { X.pages.print = guide.pages; guide = buildDoc(guideSpec, X); }
      files.unshift(guide);
    }
    const bundles = [];
    for (const b of P.bundles) { onStatus(`${X.t("Componiendo", "Composing")} ${b.label}…`); bundles.push(buildBundle(b, P.docs, X)); await pause(); }
    const complete = buildBundle({ id: "complete", label: X.t("Expediente completo", "Complete case file"), docs: P.docs.map((d) => d.id) }, P.docs, X);
    return { cfg: P.cfg, files: files.map(({ doc, ...f }) => f), bundles, complete, guide: guide && (({ doc, ...f }) => f)(guide), X };
  }
  const pause = () => new Promise((r) => setTimeout(r, 0));

  // ------------------------------------------------------------------------ packages
  const FORMAT = "calculus-cases/series-finale-package";
  /**
   * kind = "student": configuration and nothing confidential (the room has the public data);
   * kind = "envelope": the documents of the second session; kind = "teacher": everything.
   */
  function exportPackage(cfgIn, kind) {
    const cfg = normalize(cfgIn), D = SF();
    const pkg = { format: FORMAT, version: 1, caseId: D.meta.id, dataVersion: D.meta.dataVersion, kind, created: new Date().toISOString(), lang: cfg.lang,
      config: { night: cfg.night, students: cfg.students, level: cfg.level, episodes: cfg.episodes, video: cfg.video, constraints: cfg.constraints, investigation: { render: cfg.investigation.render, suiteRatio: cfg.investigation.suiteRatio } } };
    if (kind === "envelope" || kind === "teacher") {
      if (!D.envelope) throw new Error("private data not loaded");
      pkg.envelope = { accessP3: D.envelope.accessP3, rounds: D.envelope.rounds, building: D.envelope.building, distribution: D.envelope.distribution, canary: { memo: D.envelope.canary.memo, copies: canaryCopies(cfg), metadata: D.envelope.canary.metadata }, radio: D.envelope.radio };
    }
    if (kind === "teacher") {
      pkg.teacher = { solution: { culprit: D.solution.culprit, chain: D.solution.chain, eliminations: D.solution.eliminations }, cards: D.cards, finale: D.finale, check: E.checkConfig(D, overrides(cfg)).ok };
    }
    pkg.audience = { student: kind === "student", confidential: kind !== "student" };
    return pkg;
  }
  /** Validate an imported package: format, version, case and consistency of its configuration. */
  function importPackage(json) {
    let pkg;
    try { pkg = typeof json === "string" ? JSON.parse(json) : json; } catch (e) { return { ok: false, error: M.L("El archivo no es JSON válido.", "The file is not valid JSON.") }; }
    if (!pkg || pkg.format !== FORMAT) return { ok: false, error: M.L("No es un paquete de El final de la serie.", "This is not a Series Finale package.") };
    if (pkg.version !== 1) return { ok: false, error: M.L("Versión de paquete no compatible.", "Unsupported package version.") };
    const warnings = [];
    if (pkg.dataVersion !== SF().meta.dataVersion) warnings.push(M.L(`El paquete se creó con los datos ${pkg.dataVersion}; esta página usa ${SF().meta.dataVersion}.`, `The package was created with data ${pkg.dataVersion}; this page uses ${SF().meta.dataVersion}.`));
    const cfg = normalize(Object.assign({}, pkg.config, { lang: pkg.lang }));
    const C = E.context(SF(), { render: cfg.investigation.render, leakR: cfg.investigation.suiteRatio });
    return { ok: true, pkg, cfg, context: C, warnings };
  }

  function stem(v) { return String(v || "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "documento"; }

  root.SFBuild = { DEFAULT, normalize, classroom, exercisesFor, EPISODE_PRIORITY, check, context, prepareAssets, plan, buildDoc, buildBundle, build, exportPackage, importPackage, canaryCopies, stem, url };
})(typeof window !== "undefined" ? window : globalThis);
