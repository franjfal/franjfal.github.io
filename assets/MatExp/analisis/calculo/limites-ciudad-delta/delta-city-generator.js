/*
 * Delta City / Ciudad Delta — web generator (UI + PDF documents).
 * Depends on delta-city-core.js, jsPDF and JSZip.
 */
(function () {
  "use strict";

  const root = document.querySelector('.cc-case[data-case="delta-city"]');
  if (!root || !window.DeltaCity) return;
  const DC = window.DeltaCity;
  const LANG = (root.dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es";
  const t = (es, en) => (LANG === "en" ? en : es);
  const num = (x, d = 2) => DC.fmtNum(x, d, LANG);
  const TEAMS = ["A", "B", "C"];

  const els = {};
  const state = { data: null, urls: [], previewTimer: null, altEdited: false, attempt: 0 };

  // ---------------------------------------------------------------- init
  async function init() {
    ["form", "city", "format", "date", "start", "plate", "alt", "suggest", "generate", "clear", "status",
      "summary", "preview", "check", "documents", "bundles", "doclist", "complete"].forEach((k) => {
      els[k] = document.getElementById(`delta-${k}`);
    });
    els.tabButtons = Array.from(root.querySelectorAll("[data-cc-tab-target]"));
    els.tabPanels = Array.from(root.querySelectorAll(".cc-tab-panel"));
    els.tabButtons.forEach((b) => b.addEventListener("click", () => activateTab(b.dataset.ccTabTarget)));
    els.form.addEventListener("submit", generate);
    els.clear.addEventListener("click", clearFiles);
    els.suggest.addEventListener("click", () => { state.attempt += 1; state.altEdited = false; suggestAlt(); schedulePreview(); });
    els.plate.addEventListener("input", () => { if (!state.altEdited) suggestAlt(); schedulePreview(); });
    els.alt.addEventListener("input", () => { state.altEdited = true; schedulePreview(); });
    [els.city, els.date, els.start].forEach((e) => e.addEventListener("input", schedulePreview));
    try {
      state.data = await DC.loadData();
      suggestAlt();
      await updatePreview();
    } catch (error) {
      console.error(error);
      setStatus(t("No se han podido cargar los datos de la actividad.", "The activity data could not be loaded."), true);
    }
  }

  function suggestAlt() {
    const target = DC.normalizePlate(els.plate.value);
    if (target.length < 4) return;
    let next = DC.confusablePlate(target, state.attempt);
    for (let k = 0; k < 12 && next === els.alt.value; k += 1) { state.attempt += 1; next = DC.confusablePlate(target, state.attempt); }
    els.alt.value = next;
  }

  function readConfig() {
    const city = clean(els.city.value) || (LANG === "en" ? "Delta City" : "Ciudad Delta");
    const date = els.date.value || "2026-10-02";
    const start = /^\d{2}:\d{2}$/.test(els.start.value) ? els.start.value : "18:00";
    return {
      city, date, start,
      dateLabel: formatDate(date),
      format: els.format.value === "letter" ? "letter" : "a4",
      plate: DC.normalizePlate(els.plate.value),
      alt: DC.normalizePlate(els.alt.value)
    };
  }

  function plateMessage(check, cfg) {
    const M = {
      "target-invalid": t("Escribe una matrícula objetivo válida (letras, números, espacio o guion).", "Enter a valid target plate (letters, digits, space or hyphen)."),
      "alt-invalid": t("Escribe una matrícula alternativa válida.", "Enter a valid alternative plate."),
      identical: t("Las dos matrículas no pueden ser iguales.", "The two plates cannot be identical."),
      "too-similar": t("Solo cambia un carácter: será muy difícil distinguirlas. Se recomienda cambiar 2 o 3.", "Only one character differs: they will be very hard to tell apart. Changing 2 or 3 is recommended."),
      "too-different": t("Son demasiado distintas: nadie las confundiría a primera vista.", "They are too different: nobody would confuse them at first sight."),
      format: t("La alternativa no conserva el formato de la matrícula objetivo.", "The alternative does not keep the target plate's format."),
      ok: t(`Difieren en ${check.distance} caracteres: confundibles de un vistazo, distinguibles con atención.`, `They differ in ${check.distance} characters: confusable at a glance, distinguishable on inspection.`)
    };
    return M[check.code];
  }

  function schedulePreview() {
    clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(updatePreview, 280);
  }

  async function updatePreview() {
    if (!state.data) return;
    const cfg = readConfig();
    const check = DC.checkPlates(cfg.plate, cfg.alt);
    els.check.textContent = plateMessage(check, cfg);
    els.check.className = `cc-note${check.level === "ok" ? "" : " cc-warn"}`;
    els.plate.setAttribute("aria-invalid", String(check.code === "target-invalid"));
    els.alt.setAttribute("aria-invalid", String(check.code === "alt-invalid" || check.code === "identical"));
    els.summary.innerHTML = summaryRows(cfg).map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`).join("");
    if (check.level === "error") return;
    const d = state.data;
    updateGallery(d, cfg);
    const slotT = (cam) => d.slots.find((s) => TEAMS.some((tm) => s.teams[tm].camera === cam)).t;
    try {
      const [a, b] = await Promise.all([
        DC.composePhoto(d, "AV-4", { plate: cfg.plate, city: cfg.city, dateISO: cfg.date, start: cfg.start, t: slotT("AV-4"), width: 760 }),
        DC.composePhoto(d, "RN-1", { plate: cfg.alt, city: cfg.city, dateISO: cfg.date, start: cfg.start, t: slotT("RN-1"), width: 760 })
      ]);
      const [ca, cb] = await Promise.all([DC.plateCrop(d, "AV-4", cfg.plate, 300), DC.plateCrop(d, "RN-1", cfg.alt, 300)]);
      els.preview.innerHTML = "";
      [[a, ca, t(`Vehículo objetivo · ${cfg.plate}`, `Target vehicle · ${cfg.plate}`)], [b, cb, t(`Vehículo confundible · ${cfg.alt}`, `Look-alike vehicle · ${cfg.alt}`)]].forEach(([img, crop, cap]) => {
        const fig = document.createElement("figure");
        img.setAttribute("role", "img"); img.setAttribute("aria-label", cap);
        fig.append(img);
        if (crop) { crop.style.width = "52%"; crop.style.marginTop = "6px"; crop.style.border = "1px solid #d9d5c8"; fig.append(crop); }
        const fc = document.createElement("figcaption"); fc.textContent = cap; fig.append(fc);
        els.preview.append(fig);
      });
    } catch (error) {
      console.warn(error);
      els.preview.textContent = t("La vista previa estará disponible cuando se carguen las fotografías.", "The preview will appear once the photographs load.");
    }
  }

  /** Photos shown in the post body carry the configured plate as well. */
  async function updateGallery(d, cfg) {
    for (const img of document.querySelectorAll("img[data-delta-camera]")) {
      const id = img.dataset.deltaCamera;
      if (!d.camera[id]) continue;
      const slot = d.slots.find((s) => TEAMS.some((tm) => s.teams[tm].camera === id));
      try {
        const c = await DC.composePhoto(d, id, { plate: cfg.plate, city: cfg.city, dateISO: cfg.date, start: cfg.start, t: slot ? slot.t : d.camera[id].x, width: 900 });
        img.src = c.toDataURL("image/jpeg", 0.86);
      } catch (e) { /* keep the base photograph */ }
    }
  }

  function summaryRows(cfg) {
    const d = state.data;
    const count = (tm) => d.slots.filter((s) => s.teams[tm].car !== "none").length;
    return [
      [t("Instantes registrados", "Recorded instants"), String(d.slots.length)],
      [t("Cámaras en el plano", "Cameras on the map"), String(d.cameras.length)],
      [t("Dossier A / B / C", "Dossier A / B / C"), `${count("A")} / ${count("B")} / ${count("C")} ${t("fotos", "photos")}`],
      [t("Matrícula objetivo", "Target plate"), cfg.plate || "—"],
      [t("Matrícula confundible", "Look-alike plate"), cfg.alt || "—"],
      [t("Inicio de la persecución", "Pursuit starts"), `${cfg.start} · ${cfg.dateLabel}`]
    ];
  }

  // ---------------------------------------------------------------- generation
  async function generate(event) {
    event.preventDefault();
    clearFiles();
    const cfg = readConfig();
    const check = DC.checkPlates(cfg.plate, cfg.alt);
    if (check.level === "error") { setStatus(plateMessage(check, cfg), true); return; }
    setBusy(true);
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) throw new Error(t("No se ha cargado jsPDF. Revisa la conexión.", "jsPDF did not load. Check the connection."));
      if (!window.JSZip) throw new Error(t("No se ha cargado JSZip. Revisa la conexión.", "JSZip did not load. Check the connection."));
      const assets = await prepareAssets(cfg);
      setStatus(t("Componiendo los documentos…", "Composing the documents…"));
      await pause();
      const files = DOCS.map((spec) => buildDoc(spec, cfg, assets));
      const bundles = BUNDLES.map((b) => buildBundle(b, cfg, assets));
      const complete = buildBundle({ id: "complete", label: t("Expediente completo", "Complete case file"), docs: DOCS.map((d) => d.id) }, cfg, assets);
      const stemName = stem(cfg.city);
      const [sepZip, bunZip] = await Promise.all([zip(files), zip(bundles)]);
      showFiles(files, bundles, complete,
        { label: t("Todos los documentos separados · ZIP", "All separate documents · ZIP"), fileName: `${stemName}_${t("documentos_separados", "separate_documents")}.zip`, blob: sepZip },
        { label: t("Todos los paquetes · ZIP", "All packets · ZIP"), fileName: `${stemName}_${t("paquetes", "packets")}.zip`, blob: bunZip });
      setStatus(t(`Listo: ${files.length} documentos, ${bundles.length} paquetes y el expediente completo.`, `Done: ${files.length} documents, ${bundles.length} packets and the complete case file.`));
    } catch (error) {
      console.error(error);
      setStatus(error.message || t("No se han podido generar los documentos.", "The documents could not be generated."), true);
    } finally {
      setBusy(false);
    }
  }

  const pause = () => new Promise((r) => setTimeout(r, 30));

  /** Render every image once per generation: photos with plates, crops, maps, formulas. */
  async function prepareAssets(cfg) {
    const d = state.data;
    const A = { photos: {}, crops: {}, maps: {}, formulas: {}, banner: null };
    const needed = new Map();
    d.slots.forEach((s) => TEAMS.forEach((tm) => {
      const e = s.teams[tm];
      if (e.car !== "none") needed.set(`${e.camera}|${e.car}`, { cam: e.camera, car: e.car, t: s.t });
    }));
    d.slots.forEach((s) => TEAMS.forEach((tm) => {
      const e = s.teams[tm];
      if (e.car === "none") {
        const c = DC.noImageFrame(d, e.camera, { city: cfg.city, dateISO: cfg.date, start: cfg.start, t: s.t, width: 1100,
          title: t("SIN IMAGEN", "NO IMAGE"), subtitle: t("DETECCIÓN REGISTRADA · IMAGEN NO RECUPERADA", "DETECTION LOGGED · IMAGE NOT RETRIEVED") });
        A.photos[`${e.camera}|none`] = c.toDataURL("image/jpeg", 0.84);
      }
    }));
    let done = 0;
    for (const [key, n] of needed) {
      setStatus(t(`Componiendo fotografías con matrícula (${done + 1}/${needed.size})…`, `Composing photographs with plates (${done + 1}/${needed.size})…`));
      const plate = n.car === "alt" ? cfg.alt : cfg.plate;
      const glare = n.car === "glare";   // team A's frame washed out by a reflection
      const photo = await DC.composePhoto(d, n.cam, { plate, glare, city: cfg.city, dateISO: cfg.date, start: cfg.start, t: n.t, width: 1100 });
      A.photos[key] = photo.toDataURL("image/jpeg", 0.84);
      const crop = await DC.plateCrop(d, n.cam, plate, 420, { glare });
      A.crops[key] = crop ? crop.toDataURL("image/jpeg", 0.9) : null;
      A.cropRatios = A.cropRatios || {};
      if (crop) A.cropRatios[key] = crop.height / crop.width;
      done += 1;
      if (done % 4 === 0) await pause();
    }
    setStatus(t("Dibujando el plano de seguimiento…", "Drawing the tracking map…"));
    await pause();
    const labels = mapLabelOffsets();
    // The full map, its details and the transparency are landscape artwork printed on
    // portrait pages: they are stored already turned 90° anticlockwise (A.turned).
    A.turned = {};
    const mapPlain = await DC.drawMap(d, { lang: LANG, width: 3000, cameras: "all", labels: labels.main, labelScale: 1.35, pinScale: 1.15 });
    A.turned.plain = jpeg(turnCCW(mapPlain));
    A.maps.plainRatio = mapPlain.height / mapPlain.width;
    // The three details are drawn at their printed size (PX_MM px per mm), so that labels,
    // pins and axis numbers read the same in all of them: avenue first (its height sets the
    // top row), the tunnel takes the rest of that row and the labyrinth fills the bottom.
    const area = turnedArea(cfg.format), gap = 6, full = area.u1 - area.u0, top1 = area.v0 + 5;
    const detail = (name, box) => DC.drawMap(d, { lang: LANG, inset: name, pxPerMM: PX_MM, fit: box, cameras: "all", labels: labels[name] || {} });
    const av = await detail("avenue", { w: (full - gap) / 2, h: 84 });
    const tu = await detail("tunnel", { w: full - gap - av.width / PX_MM, h: 84 });
    const top2 = top1 + Math.max(av.height, tu.height) / PX_MM + 11;
    const lab = await detail("labyrinth", { w: full, h: area.v1 - top2 });
    const size = (c) => ({ w: c.width / PX_MM, h: c.height / PX_MM });
    A.details = [
      { name: "tunnel", data: jpeg(turnCCW(tu)), u: area.u0, v: top1, ...size(tu) },
      { name: "avenue", data: jpeg(turnCCW(av)), u: area.u0 + size(tu).w + gap, v: top1, ...size(av) },
      { name: "labyrinth", data: jpeg(turnCCW(lab)), u: area.u0 + (full - size(lab).w) / 2, v: top2, ...size(lab) }
    ];
    const withGraph = await DC.drawMap(d, { lang: LANG, width: 3000, cameras: false, graph: true });
    A.maps.graph = jpeg(withGraph);
    const withRecord = await DC.drawMap(d, { lang: LANG, width: 3000, cameras: false, graph: true, record: true });
    A.maps.record = jpeg(withRecord);
    const overlay = await DC.drawMap(d, { lang: LANG, width: 3000, cameras: false, graph: true, base: false, axisNames: false });
    A.turned.overlay = turnCCW(overlay).toDataURL("image/png");
    const labGraph = await DC.drawMap(d, { lang: LANG, inset: "labyrinth", width: 2400, cameras: false, graph: true });
    A.maps.labyrinthGraph = jpeg(labGraph);
    A.maps.labyrinthRatio = labGraph.height / labGraph.width;
    setStatus(t("Preparando fórmulas…", "Preparing formulas…"));
    await pause();
    A.formulas = buildFormulas();
    try {
      const img = await DC.loadImage("header-brand.jpg");
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0); A.banner = c.toDataURL("image/jpeg", 0.88); A.bannerRatio = c.height / c.width;
    } catch (e) { A.banner = null; }
    A.views = {};
    for (const v of d.views || []) {
      try {
        const img = await DC.loadImage(v.image);
        const c = document.createElement("canvas"); c.width = 900; c.height = Math.round(900 * img.naturalHeight / img.naturalWidth);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); A.views[v.id] = jpeg(c, 0.82);
      } catch (e) { /* optional */ }
    }
    return A;
  }

  function jpeg(canvas, q = 0.86) { return canvas.toDataURL("image/jpeg", q); }

  /** Landscape artwork turned 90° anticlockwise: its top edge ends up on the left of a portrait page. */
  function turnCCW(canvas) {
    const c = document.createElement("canvas");
    c.width = canvas.height; c.height = canvas.width;
    const ctx = c.getContext("2d");
    ctx.translate(0, canvas.width); ctx.rotate(-Math.PI / 2);
    ctx.drawImage(canvas, 0, 0);
    return c;
  }

  /**
   * Camera label offsets chosen so that clustered labels do not collide: on the full map in
   * px at 3000 px width (clustered cameras are labelled only in the details); on the details
   * in mm of the printed page (x to the right, y downwards).
   */
  function mapLabelOffsets() {
    const main = {};
    ["PU-4", "LO-1", "LO-2", "LO-3", "AV-1", "AV-3", "AV-4", "AV-5", "AV-8", "EN-S", "EN-N",
      "LB-1", "LB-2", "LB-3", "LB-4", "LB-5", "LB-6", "LB-7", "LB-8", "LB-9", "LB-10", "PL-1", "AU-1"].forEach((id) => { main[id] = false; });
    Object.assign(main, { "PU-1": [12, -16], "PU-2": [14, -12], "PU-3": [-14, -14], "TU-S": [-14, -16], "TU-N": [-14, -16],
      "AV-2": [-14, -16], "AV-6": [14, 16], "AV-7": [-14, -16], "RN-1": [0, -20], "AU-2": [16, 14], "AU-3": [16, 0], "AU-4": [16, 0], "AU-5": [-16, 0] });
    const tunnel = { "PU-4": [-5, 0], "LO-1": [-5, -5], "LO-2": [4, 5.5], "LO-3": [-2, -7], "AV-1": [3, -6], "TU-S": [-3, -6], "TU-N": [-4, -4.5] };
    const avenue = { "AV-2": [-3, -5], "AV-3": [-4, -6], "AV-4": [1, 7], "AV-5": [3, -6], "AV-6": [3, 5], "RN-1": [2, -5] };
    const labyrinth = {
      "AV-8": [-5, -5], "EN-S": [3, 7], "EN-N": [-5, -6], "LB-1": [3, -6], "LB-2": [0, -8], "LB-3": [3, 4],
      "LB-4": [0, 7], "LB-5": [-3, -7], "LB-6": [-3, 7], "LB-7": [-3, -7], "LB-8": [-1, 9], "LB-9": [3, -7], "LB-10": [3, 9],
      "PL-1": [3, -7], "AU-1": [4, -3]
    };
    return { main, labyrinth, tunnel, avenue };
  }

  const PAPER = { a4: [210, 297], letter: [215.9, 279.4] };   // portrait, mm (as jsPDF)
  const PX_MM = 9;                                             // map details: about 230 dpi in print
  /** Usable box of a turned page, on the virtual landscape page (see writer.turned). */
  function turnedArea(format) {
    const [PW, PH] = PAPER[format] || PAPER.a4;
    return { u0: 16, u1: PH - 10, v0: 10, v1: PW - 10 };
  }

  function buildFormulas() {
    const F = (tex, size = 40) => {
      const r = DC.formulaImage(tex, { size, scale: 2.4 });
      return { data: r.canvas.toDataURL("image/png"), w: r.width, h: r.height };
    };
    const si = `\\text{${t("si", "if")}}`;
    return {
      model: F(`f(t)=\\cases{t^{2} & ${si}\\, 0\\le t\\le 2 \\\\ t+2 & ${si}\\, 2<t<8 \\\\ 11+\\sin\\left(\\frac{\\pi}{10-t}\\right) & ${si}\\, 8\\le t<10 \\\\ 10+\\frac{4}{12-t} & ${si}\\, 10\\le t<12}`, 38),
      record: F(`g(t)=\\cases{12 & ${si}\\, t=6 \\\\ 10 & ${si}\\, t=8 \\\\ f(t) & \\text{${t("en otro caso", "otherwise")}}}`, 36),
      cont: F("\\lim_{t\\to a}f(t)=f(a)", 36),
      osc1: F("t_{n}=10-\\frac{1}{n}\\quad\\to\\quad f(t_{n})=11+\\sin(n\\pi)=11", 32),
      osc2: F("s_{n}=10-\\frac{2}{4n+1}\\quad\\to\\quad f(s_{n})=11+\\sin\\left(\\frac{(4n+1)\\pi}{2}\\right)=12", 32),
      inf: F("\\lim_{t\\to 12^{-}}\\left(10+\\frac{4}{12-t}\\right)=+\\infty", 34),
      ivt: F(`f(3)=5<6<7=f(5)\\quad\\to\\quad \\text{${t("existe", "there is")}}\\, c\\in(3,5)\\, \\text{${t("con", "with")}}\\, f(c)=6`, 32),
      jump: F("\\lim_{t\\to 8^{-}}f(t)=10\\ne 12=\\lim_{t\\to 8^{+}}f(t)", 34),
      rem: F("\\lim_{t\\to 6}g(t)=8\\ne 12=g(6)", 34)
    };
  }

  // ---------------------------------------------------------------- PDF writer (house style)
  function newDoc(cfg) {
    return new window.jspdf.jsPDF({ unit: "mm", format: cfg.format, orientation: "portrait", compress: true });
  }

  /*
   * Case-file house style, shared with the student documents printed in the book
   * (casedocument / caseassignment / casetable in casebook-preamble.tex): book navy
   * CaseBlue for headings, rules and table headers, CaseOrange for list markers,
   * stamp red for restricted documents, sans for headings, labels and tables, and a
   * serif body (Times here, Latin Modern in the book).
   */
  const CC = {
    blue: [32, 80, 110], orange: [155, 80, 30], stamp: [150, 40, 40], ink: [28, 30, 34],
    muted: [112, 112, 112], rule: [155, 155, 155], zebra: [246, 247, 248], grid: [200, 203, 206], hand: [24, 52, 128],
    tint: { blue: [242, 246, 249], warn: [249, 241, 240], note: [250, 245, 238] }
  };

  function writer(doc, cfg, A) {
    const pw = () => doc.internal.pageSize.getWidth();
    const ph = () => doc.internal.pageSize.getHeight();
    const margin = 18, bottom = 18;
    let y = 18;
    const W = () => pw() - 2 * margin;
    const lines = (text, width) => doc.splitTextToSize(safe(text), width || W());
    const ensure = (h) => { if (y + h > ph() - bottom) { doc.addPage(cfg.format, "portrait"); y = 18; } };
    const body = (size = 10.5, style = "normal") => doc.setFont("times", style).setFontSize(size).setTextColor(...CC.ink);
    const stamp = (label, x, yy) => {
      doc.setFont("helvetica", "bold").setFontSize(7);
      const w = doc.getTextWidth(label) + 4;
      doc.setDrawColor(...CC.stamp).setLineWidth(0.35).rect(x - w, yy - 3.4, w, 4.8);
      doc.setTextColor(...CC.stamp).text(label, x - w / 2, yy, { align: "center" });
    };
    const api = {
      get y() { return y; }, set y(v) { y = v; }, margin, W, pw, ph, ensure,
      title(title, kicker, confidential) {
        let top = 14;
        if (A.banner) {
          const h = pw() * A.bannerRatio;
          doc.addImage(A.banner, "JPEG", 0, 0, pw(), h, "banner", "FAST");
          top = h + 8;
        }
        doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...CC.muted).text(safe(kicker).toUpperCase(), margin, top);
        if (confidential) stamp(t("SOLO PROFESORADO", "TEACHER ONLY"), pw() - margin, top);
        doc.setDrawColor(...CC.blue).setLineWidth(0.35).line(margin, top + 2.2, pw() - margin, top + 2.2);
        doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...CC.ink);
        const ls = lines(title, W());
        doc.text(ls, margin, top + 10.5);
        y = top + 10.5 + (ls.length - 1) * 7.2 + 8;
        doc.setLineWidth(0.2);
      },
      meta(rows) {
        rows.forEach(([label, value]) => {
          doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...CC.muted).text(`${safe(label)}`, margin, y);
          doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...CC.ink).text(lines(value, W() - 36), margin + 34, y);
          y += 5;
        });
        y += 3;
      },
      heading(text) {
        ensure(14);
        doc.setFont("helvetica", "bold").setFontSize(12.5).setTextColor(...CC.blue).text(lines(text), margin, y);
        y += 7.5;
      },
      sub(text) { ensure(10); doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...CC.ink).text(lines(text), margin, y); y += 6; },
      paragraph(text, opts = {}) {
        body(opts.size ? opts.size + 0.5 : 10.5, opts.bold ? "bold" : opts.italic ? "italic" : "normal");
        const ls = lines(text, opts.width);
        ensure(ls.length * 4.9 + 3);
        doc.text(ls, opts.x || margin, y);
        y += ls.length * 4.9 + (opts.gap == null ? 3 : opts.gap);
      },
      bullets(items, numbered) {
        items.forEach((item, k) => {
          body();
          const ls = lines(item, W() - 7);
          ensure(ls.length * 4.9 + 2.5);
          if (numbered) doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...CC.orange).text(`${k + 1}.`, margin, y);
          else doc.setFillColor(...CC.orange).rect(margin + 0.6, y - 2.2, 1.8, 1.8, "F");
          body();
          doc.text(ls, margin + 6.5, y);
          y += ls.length * 4.9 + 2.2;
        });
        y += 2;
      },
      callout(text, tone) {
        body(10);
        const ls = lines(text, W() - 10);
        const h = ls.length * 4.7 + 6;
        ensure(h + 3);
        const key = tone === "warn" ? "warn" : tone === "blue" ? "blue" : "note";
        const bar = key === "warn" ? CC.stamp : key === "blue" ? CC.blue : CC.orange;
        doc.setFillColor(...CC.tint[key]).rect(margin, y - 4, W(), h, "F");
        doc.setFillColor(...bar).rect(margin, y - 4, 1.2, h, "F");
        body(10);
        doc.text(ls, margin + 5, y + 0.6);
        y += h + 3;
      },
      formula(f, maxW = 150, scale = 0.27) {
        let w = f.w * scale, h = f.h * scale;
        if (w > maxW) { h *= maxW / w; w = maxW; }
        ensure(h + 4);
        doc.addImage(f.data, "PNG", margin + (W() - w) / 2, y - 3, w, h, undefined, "FAST");
        y += h + 2;
      },
      image(data, w, h, opts = {}) {
        ensure(h + 3);
        const x = opts.x == null ? margin + (W() - w) / 2 : opts.x;
        doc.addImage(data, opts.png ? "PNG" : "JPEG", x, y, w, h, opts.alias, "FAST");
        y += h + (opts.gap == null ? 4 : opts.gap);
      },
      table(headers, rows, widths, opts = {}) {
        const fs = opts.size || 8;
        const pad = 1.6;
        const total = widths.reduce((s, w) => s + w, 0);
        const scale = W() / total;
        const ws = widths.map((w) => w * scale);
        const rowLines = (row, bold) => {
          doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(fs);
          return row.map((cell, i) => doc.splitTextToSize(safe(cell), ws[i] - 2 * pad));
        };
        const heightOf = (ls) => Math.max(opts.minRow || 6.5, Math.max(...ls.map((l) => l.length)) * fs * 0.42 + 3.2);
        const drawRow = (row, header, shade) => {
          const ls = rowLines(row, header);
          const h = heightOf(ls);
          if (y + h > ph() - bottom) { doc.addPage(cfg.format, "portrait"); y = 18; if (!header) drawRow(headers, true); }
          let x = margin;
          row.forEach((cell, i) => {
            if (header) doc.setFillColor(...CC.blue).setDrawColor(...CC.blue);
            else doc.setFillColor(...(shade ? CC.zebra : [255, 255, 255])).setDrawColor(...CC.grid);
            doc.setLineWidth(0.15).rect(x, y, ws[i], h, "FD");
            const hand = !header && opts.hand && opts.hand(row, i);   // the consultant's handwriting
            if (hand) doc.setFont("times", "italic").setFontSize(fs + 1.2).setTextColor(...CC.hand);
            else doc.setFont("helvetica", header ? "bold" : "normal").setFontSize(fs).setTextColor(...(header ? [255, 255, 255] : CC.ink));
            doc.text(ls[i], x + pad, y + fs * 0.42 + 1.2);
            x += ws[i];
          });
          y += h;
        };
        if (opts.keep) {
          const total = [headers, ...rows].reduce((sum, row, k) => sum + heightOf(rowLines(row, k === 0)), 0);
          ensure(Math.min(total + 4, ph() - bottom - 18));
        } else ensure(30);
        drawRow(headers, true);
        rows.forEach((row, k) => drawRow(row, false, opts.zebra && k % 2 === 1));
        y += 4;
      },
      lines(count, gap = 7) { ensure(count * gap + 2); doc.setDrawColor(...CC.grid).setLineWidth(0.2); for (let k = 0; k < count; k += 1) { y += gap; doc.line(margin, y, pw() - margin, y); } y += 4; },
      page() { doc.addPage(cfg.format, "portrait"); y = 18; },
      /**
       * New portrait page that carries landscape content turned 90° anticlockwise, so the
       * whole file prints in portrait; the reader turns the sheet clockwise. Positions are
       * given on a virtual landscape page (u to the right, v downwards); the band u < 16
       * is the portrait footer.
       */
      turned() {
        doc.addPage(cfg.format, "portrait"); y = 18;
        const PH = ph();
        return {
          ...turnedArea(cfg.format),
          image(data, fmt, u, v, wd, ht, alias) { doc.addImage(data, fmt, v, PH - u - wd, ht, wd, alias, "FAST"); },
          text(str, u, v) { doc.text(safe(str), v, PH - u, { angle: 90 }); }
        };
      }
    };
    return api;
  }

  /** jsPDF's core fonts only cover WinAnsi; map the few symbols we use in prose. */
  function safe(text) {
    return String(text).replace(/→/g, "->").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=").replace(/∞/g, "inf.")
      .replace(/π/g, "pi").replace(/−/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  }

  function footer(doc, label) {
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p += 1) {
      doc.setPage(p);
      const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...CC.rule).setLineWidth(0.2).line(18, h - 12, w - 18, h - 12);
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...CC.muted)
        .text(safe(`${label} · ${t("Calculus Cases · Material educativo ficticio", "Calculus Cases · Fictional educational material")}`), 18, h - 7);
      doc.text(`${p}/${n}`, w - 18, h - 7, { align: "right" });
    }
  }

  // ---------------------------------------------------------------- shared texts
  function teamSlots(team) {
    return state.data.slots.map((s) => ({ slot: s, entry: s.teams[team], cam: state.data.camera[s.teams[team].camera] }));
  }
  const roadName = (key) => state.data.roads[key][LANG === "en" ? 1 : 0];

  // ---------------------------------------------------------------- documents
  const DOCS = [
    { id: "briefing", n: "00", title: () => t("Apertura del expediente", "Case file opening"), render: renderBriefing },
    { id: "map", n: "01", title: () => t("Plano de seguimiento y registro de cámaras", "Tracking map and camera register"), render: renderMap },
    ...TEAMS.map((tm, k) => ({ id: `dossier-${tm}`, n: `1${k}`, team: tm, title: () => t(`Dossier fotográfico · Equipo ${tm}`, `Photographic dossier · Team ${tm}`), render: (w, d, c, A) => renderDossier(w, d, c, A, tm) })),
    ...TEAMS.map((tm, k) => ({ id: `sheet1-${tm}`, n: `2${k}`, team: tm, title: () => t(`Hoja de investigación (fase 1) · Equipo ${tm}`, `Investigation worksheet (phase 1) · Team ${tm}`), render: (w, d, c, A) => renderSheet1(w, d, c, A, tm) })),
    { id: "phase2", n: "30", title: () => t("Fase 2 · El modelo de la trayectoria", "Phase 2 · The trajectory model"), render: renderPhase2 },
    { id: "overlay", n: "31", title: () => t("Transparencia de la gráfica de f", "Transparency of the graph of f"), render: renderOverlay },
    { id: "guide", n: "90", teacher: true, title: () => t("Guía docente", "Teacher guide"), render: renderGuide },
    { id: "solution", n: "91", teacher: true, title: () => t("Solución y comparación de equipos", "Solution and team comparison"), render: renderSolution },
    { id: "inventory", n: "92", teacher: true, title: () => t("Inventario de fotografías y variantes", "Photograph and variant inventory"), render: renderInventory }
  ];
  const BUNDLES = [
    ...TEAMS.map((tm) => ({ id: `team-${tm}`, label: t(`Equipo ${tm} · fase 1`, `Team ${tm} · phase 1`), docs: ["briefing", "map", `dossier-${tm}`, `sheet1-${tm}`] })),
    { id: "phase2", label: t("Fase 2 · para todos los equipos", "Phase 2 · for every team"), docs: ["phase2", "overlay"] },
    { id: "teacher", label: t("Paquete docente", "Teacher packet"), docs: ["guide", "solution", "inventory", "phase2", "overlay"] }
  ];

  function buildDoc(spec, cfg, A) {
    const doc = newDoc(cfg);
    spec.render(writer(doc, cfg, A), doc, cfg, A, spec);
    footer(doc, spec.title());
    return { id: spec.id, label: spec.title(), teacher: spec.teacher, fileName: `${spec.n}_${stem(spec.title())}.pdf`, blob: doc.output("blob") };
  }

  function buildBundle(bundle, cfg, A) {
    const doc = newDoc(cfg);
    bundle.docs.forEach((id, k) => {
      if (k) doc.addPage(cfg.format, "portrait");
      const spec = DOCS.find((d) => d.id === id);
      spec.render(writer(doc, cfg, A), doc, cfg, A, spec);
    });
    footer(doc, bundle.label);
    return { id: bundle.id, label: bundle.label, fileName: `${stem(cfg.city)}_${stem(bundle.label)}.pdf`, blob: doc.output("blob") };
  }

  function kicker(cfg) { return t(`Calculus Cases · Caso 1 · ${cfg.city}`, `Calculus Cases · Case 1 · ${cfg.city}`); }

  /** Slot recorded at an exact instant (the two disputed exhibits are at t = 6 and t = 8). */
  function slotAt(time) { return state.data.slots.find((s) => Math.abs(s.t - time) < 1e-9); }
  /** Cotas of the wanted car photographed by every team for a <= t <= b, as the register prints them. */
  function cotasIn(a, b) {
    return state.data.slots.filter((s) => s.t >= a - 1e-9 && s.t <= b + 1e-9 && TEAMS.every((tm) => s.teams[tm].car === "target"))
      .map((s) => num(state.data.camera[s.teams.A.camera].y, 3)).join(", ");
  }
  /** Exhibits the consultant had already written up before leaving the case (codes F-01 to F-20). */
  const CONSULTANT_LAST = 20;
  const byConsultant = (code) => Number(code.slice(2)) <= CONSULTANT_LAST;
  /** The slot where team A's frame is washed out by a reflection. */
  function glareSlot() { return state.data.slots.find((s) => TEAMS.some((tm) => s.teams[tm].car === "glare")); }
  /** The two disputed exhibits: codes, the camera each team holds and its cota. */
  function disputed() {
    const d = state.data, s6 = slotAt(6), s8 = slotAt(8);
    const cam = (s, tm) => d.camera[s.teams[tm].camera];
    const sg = glareSlot();
    return { s6, s8, a6: cam(s6, "A"), b6: cam(s6, "B"), c6: cam(s6, "C"), a8: cam(s8, "A"), c8: cam(s8, "C"), sg, g: sg ? cam(sg, "A") : null };
  }

  function renderBriefing(w, doc, cfg, A) {
    w.title(t("Apertura del expediente: la persecución", "Case file opening: the pursuit"), kicker(cfg));
    w.meta([[t("Ciudad", "City"), cfg.city], [t("Fecha", "Date"), cfg.dateLabel], [t("Inicio (t = 0)", "Start (t = 0)"), `${cfg.start}:00`], [t("Matrícula buscada", "Wanted plate"), cfg.plate]]);
    w.paragraph(t(
      `A las ${cfg.start} del ${cfg.dateLabel}, un turismo burdeos de cinco puertas con matrícula ${cfg.plate} se salta el control de salida del puerto de ${cfg.city}. La patrulla del control no consigue seguirlo, y el coche atraviesa la ciudad hasta perderse por la autovía del norte. De su recorrido solo queda el registro de la red de cámaras de tráfico con lectura de matrículas.`,
      `At ${cfg.start} on ${cfg.dateLabel}, a five-door burgundy hatchback with plate ${cfg.plate} drives through the checkpoint at the ${cfg.city} harbour exit without stopping. The checkpoint patrol cannot keep up with it, and the car crosses the city until it disappears along the north motorway. All that remains of its route is the record of the plate-reading traffic camera network.`));
    w.paragraph(t(
      "El inspector jefe necesita un informe que diga, tramo a tramo, por dónde pasó el coche y qué puede afirmarse de su recorrido: qué está probado, qué es solo probable y qué no se sabe. Cada equipo recibe un dossier con las detecciones que el sistema asoció a la matrícula buscada, una por instante. Cada dossier lo ha preparado un operador distinto de la central, y no son exactamente iguales.",
      "The Chief Inspector needs a report that says, stretch by stretch, where the car went and what can be stated about its route: what is proved, what is only likely and what is unknown. Each team receives a dossier with the detections that the system linked to the wanted plate, one per instant. Each dossier was prepared by a different operator at control, and they are not exactly the same."));
    w.paragraph(t(
      `No empezáis de cero. El consultor que llevaba el caso empezó a analizar el registro y lo dejó a medias: su hoja de investigación, con las pruebas F-01 a F-${String(CONSULTANT_LAST).padStart(2, "0")} ya pasadas a limpio, está en vuestro paquete. Vuestro trabajo es retomarla.`,
      `You do not start from scratch. The consultant who was working on the case began analysing the record and left it half done: his investigation worksheet, with exhibits F-01 to F-${String(CONSULTANT_LAST).padStart(2, "0")} already written up, is in your packet. Your job is to pick it up.`));
    w.paragraph(t(
      "El trabajo tiene dos fases. La primera la hacéis en casa, en equipo y solo con las fotografías: datos puntuales, cada uno con su cámara y su hora. En la clase siguiente, los equipos se reúnen para comparar sus informes y después se abre el sobre de la fase 2, que contiene un modelo matemático de la trayectoria: con él podréis demostrar lo que ahora solo podéis sospechar.",
      "The work has two phases. You do the first at home, as a team and with the photographs alone: point data, each with its camera and its time. In the next class the teams meet to compare their reports, and then the phase 2 envelope is opened; it contains a mathematical model of the trajectory, with which you will be able to prove what for now you can only suspect."));
    w.callout(t(
      "Vuestro dossier es reservado: no lo enseñéis a otros equipos antes de la reunión de coordinación. Comparar los dossieres es precisamente lo que se hará en ella.",
      "Your dossier is confidential: do not show it to other teams before the coordination meeting. Comparing dossiers is exactly what that meeting is for."), "blue");
    w.heading(t("Cómo leer una fotografía", "How to read a photograph"));
    const c65 = DC.clockAt(cfg.start, 6.5), c97 = DC.clockAt(cfg.start, 10 - 2 / 7);
    w.bullets(t([
      "La banda superior de cada imagen indica la ciudad, la cámara (CAM …), la fecha y la hora del disparo, con centésimas de segundo. El pie de cada tarjeta del dossier repite la cámara y la hora.",
      `El instante t se mide en minutos desde las ${cfg.start}:00. Una foto de las ${c65} corresponde a t = 6.5; una de las ${c97}, a t = 9 + ${c97.slice(-5)}/60, es decir, 9.714 redondeando a milésimas. El consultor ya hizo este cálculo para las primeras pruebas.`,
      "El registro de cámaras (documento 01) da la columna y la cota de cada cámara en el plano.",
      "El recuadro de la esquina superior derecha amplía la matrícula captada por la cámara. Comprobadla siempre, carácter a carácter."
    ], [
      "The band at the top of each image gives the city, the camera (CAM …), the date and the time of the shot, to the hundredth of a second. The caption of each dossier card repeats the camera and the time.",
      `The instant t is measured in minutes from ${cfg.start}:00. A photo taken at ${c65} corresponds to t = 6.5; one taken at ${c97}, to t = 9 + ${c97.slice(-5)}/60, that is, 9.714 to the nearest thousandth. The consultant already did this for the first exhibits.`,
      "The camera register (document 01) gives each camera's column and northing on the map.",
      "The inset in the top-right corner enlarges the plate captured by the camera. Always check it, character by character."
    ]));
    w.heading(t("El plano de seguimiento", "The tracking map"));
    w.paragraph(t(
      "La central trabaja con un plano cuadriculado de la ciudad. Las líneas verticales son las columnas, numeradas de oeste a este del 0 al 12; las horizontales marcan las cotas, numeradas de sur a norte. Cada cámara tiene así una columna y una cota. Del coche nos interesa su cota: llamamos f(t) a la cota del coche buscado en el instante t.",
      "Control works with a gridded map of the city. The vertical lines are the columns, numbered from west to east from 0 to 12; the horizontal lines mark the northing, the north coordinate, numbered from south to north. Every camera therefore has a column and a northing. What matters about the car is its northing: we write f(t) for the northing of the wanted car at instant t."));
    w.paragraph(t(
      "El consultor dejó anotada una regularidad que la central ha confirmado en todas las detecciones del coche buscado: la columna de la cámara coincide con el minuto t de la fotografía. Por eso, sobre este plano, cada fotografía válida es directamente un punto (t, f(t)): la columna es el instante y la cota es la posición. Ojo: la regularidad solo está comprobada en las fotografías; lo que ocurre entre una y otra es otra cuestión.",
      "The consultant noted a regularity that control has confirmed in every detection of the wanted car: the camera's column equals the minute t of the photograph. So, on this map, each valid photograph is directly a point (t, f(t)): the column is the instant and the northing is the position. Careful: the regularity has only been checked at the photographs; what happens between one and the next is another matter."));
    w.callout(t(
      `Atención a la identificación. En ${cfg.city} circula al menos otro turismo del mismo modelo y color, con una matrícula parecida. El sistema compara las matrículas con cierta tolerancia, porque sus lecturas no siempre son perfectas, así que un dossier puede contener fotografías de otro coche. Una fotografía cuya matrícula no sea ${cfg.plate} no dice nada sobre la posición del coche buscado: anotadla como posible error de identificación y dejad ese valor como desconocido.`,
      `Watch the identification. At least one other hatchback of the same model and colour, with a similar plate, drives around ${cfg.city}. The system matches plates with some tolerance, because its readings are not always perfect, so a dossier may contain photographs of another car. A photograph whose plate is not ${cfg.plate} says nothing about the position of the wanted car: record it as a possible identification error and leave that value unknown.`), "warn");
    w.heading(t("Tres capas que no hay que mezclar", "Three layers not to be mixed"));
    w.table([t("Capa", "Layer"), t("Qué es", "What it is"), t("Qué permite", "What it allows")], t([
      ["1. Evidencia", "Fotografías: un número finito de puntos (t, cota).", "Ordenar, localizar, descartar errores, proponer candidatos."],
      ["2. Modelo", "Una función f definida en todo instante (fase 2).", "Calcular valores, límites laterales y límites."],
      ["3. Conclusión", "Lo que se demuestra sobre f.", "Afirmar continuidad o el tipo de discontinuidad, siempre bajo el modelo."]
    ], [
      ["1. Evidence", "Photographs: finitely many points (t, northing).", "Order, locate, discard errors, propose candidates."],
      ["2. Model", "A function f defined at every instant (phase 2).", "Compute values, one-sided limits and limits."],
      ["3. Conclusion", "What is proved about f.", "Assert continuity or the type of discontinuity, always under the model."]
    ]), [30, 75, 75]);
    w.paragraph(t(
      "Un candidato es lo que sugieren las fotografías cercanas a un punto: un valor o un comportamiento. Se anota como conjetura y se comprueba en la fase 2, porque unas pocas fotografías nunca demuestran por sí solas un límite, una continuidad, una oscilación o un límite infinito.",
      "A candidate is what the photographs near a point suggest: a value or a behaviour. It is recorded as a conjecture and checked in phase 2, because a few photographs never prove a limit, continuity, an oscillation or an infinite limit on their own."), { italic: true });
    w.heading(t("Lo que entrega cada equipo", "What each team hands in"));
    w.bullets(t([
      "Al empezar la clase siguiente: la hoja de investigación del consultor, completada, con las pruebas ordenadas, la tabla de zonas y las respuestas a las preguntas, y dos afirmaciones que podáis defender más un punto que no podáis decidir.",
      "En clase, después de la reunión: la hoja de trabajo del sobre, con la clasificación de cada punto, y la exposición del punto que os asigne el inspector jefe."
    ], [
      "At the start of the next class: the consultant's investigation worksheet, completed, with the exhibits in order, the zone table and the answers to the questions, plus two statements you can defend and one point you cannot decide.",
      "In class, after the meeting: the worksheet in the envelope, with the classification of each point, and the presentation of the point the Chief Inspector assigns you."
    ]));
    if (Object.keys(A.views).length) {
      w.ensure(90);
      w.y += 4;
      w.heading(t(`Guía visual de ${cfg.city}`, `Visual guide to ${cfg.city}`));
      const views = state.data.views.filter((v) => A.views[v.id]);
      const colW = (w.W() - 6) / 2, imgH = colW * 2 / 3;
      views.forEach((v, k) => {
        if (k % 2 === 0) w.ensure(imgH + 12);
        const x = w.margin + (k % 2) * (colW + 6);
        const y0 = w.y;
        doc.addImage(A.views[v.id], "JPEG", x, y0, colW, imgH, `view-${v.id}`, "FAST");
        doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...CC.ink).text(safe(v.title[LANG]), x, y0 + imgH + 4.5);
        if (k % 2 === 1 || k === views.length - 1) w.y = y0 + imgH + 10;
      });
    }
  }

  /** Where the turned map sits on its page. The transparency uses exactly the same box. */
  function mapBox(R, A) {
    const top = R.v0 + 6, availW = R.u1 - R.u0, availH = R.v1 - top - 6;
    let wd = availW, ht = wd * A.maps.plainRatio;
    if (ht > availH) { wd *= availH / ht; ht = availH; }
    return { u: R.u0 + (availW - wd) / 2, v: top, wd, ht };
  }

  function renderMap(w, doc, cfg, A) {
    w.title(t("Plano de seguimiento", "Tracking map"), kicker(cfg));
    w.paragraph(t(
      "Cuadrícula de la central: columnas del 0 al 12, de oeste a este, y cotas de sur a norte. Los marcadores rojos son las cámaras de la red. El plano y sus detalles ocupan las dos páginas siguientes, girados para aprovechar el papel: para leerlos, girad la hoja un cuarto de vuelta en el sentido de las agujas del reloj. Los detalles muestran con más precisión las zonas con cámaras muy próximas.",
      "Control's grid: columns 0 to 12, from west to east, and northings from south to north. Red markers are the network cameras. The map and its details fill the next two pages, turned to make the most of the paper: to read them, turn the sheet a quarter turn clockwise. The details show the zones with closely spaced cameras more precisely."));
    w.paragraph(t("Imprimid el plano al 100 %, sin ajustar a la página: en la fase 2 se le superpondrá una transparencia.", "Print the map at 100%, without fit-to-page: in phase 2 a transparency will be laid over it."), { italic: true, size: 9 });
    w.heading(t("Registro de cámaras de la red", "Network camera register"));
    w.paragraph(t("Posición de cada cámara en la cuadrícula del plano.", "Position of every camera on the map grid."));
    const rows = state.data.cameras.map((c) => [c.id, roadName(c.road), num(c.x, 3), num(c.y, 3)]);
    w.table([t("Cámara", "Camera"), t("Vía", "Road"), t("Columna", "Column"), t("Cota", "Northing")], rows, [20, 70, 30, 30], { zebra: true, size: 8, minRow: 5.4 });
    w.paragraph(t("AU-6 es el pórtico del límite municipal en la autovía: queda fuera del plano, por encima de su borde superior.", "AU-6 is the city-limit gantry on the motorway: it lies outside the map, above its top edge."), { italic: true, size: 9 });
    const R = w.turned();
    const box = mapBox(R, A);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...CC.blue);
    R.text(t(`${cfg.city} · Plano de seguimiento · cámaras de la red`, `${cfg.city} · Tracking map · network cameras`), box.u, box.v - 2.2);
    R.image(A.turned.plain, "JPEG", box.u, box.v, box.wd, box.ht, "map-plain");
    const R2 = w.turned();
    const captions = {
      tunnel: t("Detalle 1 · Glorieta de la Lonja y Túnel del Río", "Detail 1 · Fish Market Roundabout and River Tunnel"),
      avenue: t("Detalle 2 · Avenida Diagonal y Ronda Norte", "Detail 2 · Diagonal Avenue and North Ring Road"),
      labyrinth: t("Detalle 3 · Cuesta del Enlace, El Laberinto y salida a la autovía", "Detail 3 · Link Hill, The Labyrinth and motorway exit")
    };
    A.details.forEach((dt) => {
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...CC.blue);
      R2.text(captions[dt.name], dt.u, dt.v - 2);
      R2.image(dt.data, "JPEG", dt.u, dt.v, dt.w, dt.h, `inset-${dt.name}`);
    });
  }

  function renderDossier(w, doc, cfg, A, team) {
    const items = teamSlots(team).slice().sort((a, b) => a.slot.code.localeCompare(b.slot.code));
    const photos = items.filter((it) => it.entry.car !== "none").length;
    w.title(t(`Dossier fotográfico · Equipo ${team}`, `Photographic dossier · Team ${team}`), kicker(cfg));
    w.meta([[t("Equipo", "Team"), team], [t("Pruebas", "Exhibits"), t(`${items.length} registros, ${photos} con fotografía`, `${items.length} records, ${photos} with a photograph`)], [t("Matrícula buscada", "Wanted plate"), cfg.plate]]);
    w.paragraph(t(
      `Las pruebas están numeradas de F-01 a F-${items.length} en el orden en que llegaron a la central, no en orden cronológico. El pie de cada tarjeta indica la cámara y la hora del disparo; el recuadro amplía la matrícula. Los otros equipos tienen pruebas con los mismos códigos: si en la reunión de coordinación dos equipos discrepan, comparad el código y buscad qué imagen exacta es distinta.`,
      `Exhibits are numbered F-01 to F-${items.length} in the order they reached control, not in time order. The caption of each card gives the camera and the time of the shot; the inset enlarges the plate. The other teams hold exhibits with the same codes: if two teams disagree at the coordination meeting, compare the code and look for the exact image that differs.`));
    w.paragraph(t("Podéis recortar las tarjetas para ordenarlas sobre la mesa.", "You may cut out the cards to order them on the table."), { italic: true });
    const cols = 2, gap = 5;
    // Card size chosen per paper format: fewest pages, never a lonely last row,
    // cards between 78 % and 100 % of the full column width.
    const geom = (s) => {
      const cardW = ((w.W() - gap) / cols) * s, imgH = cardW * 2 / 3, cropW = cardW * 0.33;
      return { cardW, imgH, cropW, cardH: imgH + 9 };
    };
    const firstTop = w.y + 2, top = 18, limit = w.ph() - 18;
    const layout = (s) => {
      const g = geom(s), perRow = (h) => Math.max(0, Math.floor((h + gap) / (g.cardH + gap)));
      let rows = Math.ceil(items.length / cols);
      const pages = [], first = perRow(limit - firstTop);
      if (first > 0) { pages.push(Math.min(first, rows)); rows -= pages[0]; }
      const full = perRow(limit - top);
      while (rows > 0) { pages.push(Math.min(full, rows)); rows -= full; }
      return { s, pages, last: pages[pages.length - 1], full };
    };
    let best = null;
    for (let s = 1; s >= 0.78 - 1e-9; s -= 0.01) {
      const L = layout(s);
      const ok = L.pages.length === 1 || L.last >= Math.min(2, L.full);
      if (!ok) continue;
      if (!best || L.pages.length < best.pages.length) best = L;
    }
    const { cardW, imgH, cropW, cardH } = geom(best ? best.s : 1);
    const x0 = w.margin + (w.W() - (cols * cardW + gap)) / 2;
    let k = 0;
    w.y = firstTop;
    items.forEach((it) => {
      if (k % cols === 0 && w.y + cardH > w.ph() - 18) { w.page(); }
      const col = k % cols;
      const x = x0 + col * (cardW + gap), y = w.y;
      doc.setDrawColor(190).setLineWidth(0.25).rect(x, y, cardW, cardH);
      const key = `${it.entry.camera}|${it.entry.car}`;
      doc.addImage(A.photos[key], "JPEG", x + 1, y + 1, cardW - 2, imgH - 1, `ph-${key}`, "FAST");
      if (it.entry.car !== "none" && A.crops[key]) {   // plate channel inset, top right, as on real ANPR captures
        const ch = cropW * (A.cropRatios[key] || 0.4);
        const cx = x + cardW - 2.2 - cropW, cy = y + 1 + imgH * 0.085;
        doc.setFillColor(255, 255, 255).rect(cx - 0.6, cy - 0.6, cropW + 1.2, ch + 1.2, "F");
        doc.addImage(A.crops[key], "JPEG", cx, cy, cropW, ch, `cr-${key}`, "FAST");
      }
      doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...CC.stamp).text(it.slot.code, x + 2, y + imgH + 7);
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...CC.ink)
        .text(safe(`CAM ${it.cam.id} · ${DC.clockAt(cfg.start, it.slot.t)}`), x + cardW - 2, y + imgH + 6.6, { align: "right" });
      k += 1;
      if (col === cols - 1) w.y = y + cardH + gap;
    });
    if (k % cols) w.y += cardH + gap;
  }

  function renderSheet1(w, doc, cfg, A, team) {
    w.title(t(`Hoja de investigación · Fase 1 · Equipo ${team}`, `Investigation worksheet · Phase 1 · Team ${team}`), kicker(cfg));
    const last = `F-${String(CONSULTANT_LAST).padStart(2, "0")}`;
    w.callout(t(
      `Trabajo en casa, en equipo. Esta hoja la empezó el consultor que llevaba el caso: pasó a limpio las pruebas F-01 a ${last} (en cursiva) y ahí se detuvo. No llegó a comprobar ninguna matrícula. Retomad su trabajo; solo hacen falta vuestras fotografías, el plano y el registro de cámaras. Traed la hoja completa a la clase siguiente.`,
      `Homework, as a team. The consultant who was working on the case started this worksheet: he wrote up exhibits F-01 to ${last} (in italics) and stopped there. He never got round to checking a single plate. Pick up his work; you only need your photographs, the map and the camera register. Bring the completed worksheet to the next class.`), "blue");
    w.heading(t("1. Completar el registro", "1. Complete the record"));
    w.paragraph(t(`Completad las filas que faltan (hora, instante t, cámara, columna y cota) y comprobad la matrícula de todas las pruebas, también las del consultor: sí, no, ilegible o sin imagen. Después escribid los códigos en orden cronológico.`,
      `Fill in the missing rows (time, instant t, camera, column and northing) and check the plate of every exhibit, the consultant's included: yes, no, unreadable or no image. Then write the codes in time order.`));
    const rows = teamSlots(team).slice().sort((a, b) => a.slot.code.localeCompare(b.slot.code)).map((it) => byConsultant(it.slot.code)
      ? [it.slot.code, DC.clockAt(cfg.start, it.slot.t), num(it.slot.t, 3), it.cam.id, num(it.cam.x, 3), num(it.cam.y, 3), "", ""]
      : [it.slot.code, "", "", "", "", "", "", ""]);
    w.table([t("Prueba", "Exhibit"), t("Hora", "Time"), "t (min)", t("Cámara", "Camera"), t("Columna", "Column"), t("Cota", "Northing"), t("¿Matrícula?", "Plate?"), t("Observaciones", "Notes")],
      rows, [14, 23, 15, 15, 16, 15, 23, 59], { minRow: 5.8, size: 8, hand: (row, i) => i >= 1 && i <= 5 && row[1] !== "" });
    w.sub(t("Orden cronológico de los códigos:", "Codes in time order:"));
    w.lines(3, 8);
    w.ensure(140);   // heading, explanation and the whole zone table on one page
    w.heading(t("2. Lo que los datos permiten afirmar", "2. What the data allow you to state"));
    w.paragraph(t("Para cada zona, describid primero los datos: qué muestran las fotografías, qué podéis afirmar con seguridad y qué sigue sin saberse. Solo en la última columna anotad el comportamiento que parecen sugerir, como conjetura y sin convertir una tendencia en una conclusión. Una buena redacción tiene esta forma: «Las cotas registradas … Esto sugiere …, pero las fotografías no establecen …».",
      "For each zone, first describe the data: what the photographs show, what you can state with certainty and what remains unknown. Only in the last column write the behaviour they seem to suggest, as a conjecture, without turning a trend into a conclusion. A good answer has this shape: \"The recorded northings … This suggests …, but the photographs do not establish …\""));
    const zones = t([
      ["Glorieta de la Lonja (t cerca de 2)", "", "", ""],
      ["Túnel del Río (entre t = 3 y t = 5)", "", "", ""],
      ["Avenida Diagonal (t cerca de 6)", "", "", ""],
      ["Cuesta del Enlace (t cerca de 8)", "", "", ""],
      ["El Laberinto (t acercándose a 10)", "", "", ""],
      ["Autovía del Norte (t acercándose a 12)", "", "", ""]
    ], [
      ["Fish Market Roundabout (t near 2)", "", "", ""],
      ["River Tunnel (between t = 3 and t = 5)", "", "", ""],
      ["Diagonal Avenue (t near 6)", "", "", ""],
      ["Link Hill (t near 8)", "", "", ""],
      ["The Labyrinth (t approaching 10)", "", "", ""],
      ["North Motorway (t approaching 12)", "", "", ""]
    ]);
    w.table([t("Zona", "Zone"), t("¿Qué muestran realmente las fotografías?", "What do the photographs actually show?"), t("¿Qué podemos afirmar con seguridad?", "What can we state with certainty?"), t("¿Qué sigue siendo desconocido?", "What remains unknown?"), t("¿Qué comportamiento parece sugerir?", "What behaviour does it seem to suggest?")],
      zones.map((z) => [z[0], "", "", "", ""]), [30, 38, 37, 37, 38], { minRow: 18, keep: true });
    w.heading(t("3. Preguntas de la fase 1", "3. Phase 1 questions"));
    w.bullets(t([
      "Identificación. ¿Hay pruebas con una matrícula distinta de la buscada, ilegible o sin imagen? Para cada una, ¿qué podéis afirmar de la posición del coche buscado en ese instante? ¿Es lo mismo «no sabemos dónde estaba» que «no tenía posición»?",
      "Túnel. En la cuadrícula de abajo, dibujad dos recorridos distintos sin saltos (continuos) que encajen con las fotografías de los dos portales. Después dibujad un tercero con un salto que encaje con los mismos dos valores. ¿Qué conclusiones se mantienen en los dos primeros dibujos pero pueden fallar en el tercero? ¿Podéis saber si la regularidad columna = t se cumple dentro del túnel?",
      "Primeros tramos. Mirad las cotas de las fotografías entre t = 0 y t = 2, y entre t = 2 y t = 8. Proponed una fórmula sencilla para la cota en cada tramo y comprobadla con dos pruebas.",
      "Cerca de t = 8 y cerca de t = 10, ¿a qué valores parecen acercarse las cotas por cada lado? ¿Por qué no basta con estas fotografías para afirmarlo?",
      "Cerca de t = 12, ¿qué ocurre con las cotas? ¿Demuestra eso que crecen indefinidamente?",
      "Para la reunión de coordinación: dos afirmaciones que podáis defender y un punto que no podáis decidir."
    ], [
      "Identification. Are there exhibits with a plate other than the wanted one, an unreadable plate or no image? For each, what can you state about the wanted car's position at that instant? Is \"we do not know where it was\" the same as \"it had no position\"?",
      "Tunnel. On the grid below, draw two different continuous routes (without jumps) compatible with the photographs of the two portals. Then draw a third route with a jump that fits the same two values. Which conclusions survive in the first two drawings but not in the third? Can you tell whether the regularity column = t holds inside the tunnel?",
      "First stretches. Look at the northings of the photographs between t = 0 and t = 2, and between t = 2 and t = 8. Propose a simple formula for the northing on each stretch and check it with two exhibits.",
      "Near t = 8 and near t = 10, which values do the northings seem to approach from each side? Why are these photographs not enough to state it?",
      "Near t = 12, what happens to the northings? Does that prove that they grow without bound?",
      "For the coordination meeting: two statements you can defend and one point you cannot decide."
    ]), true);
    // grid for question 2: the two portals and the river's axis are for the students to place
    w.ensure(60);
    const gx = w.margin + 12, gy = w.y + 3, gw = 72, gh = 44;
    const X = (v) => gx + ((v - 2.5) / 3) * gw, Y = (v) => gy + gh - ((v - 4) / 4) * gh;
    doc.setDrawColor(...CC.grid).setLineWidth(0.15);
    for (let v = 2.5; v <= 5.5 + 1e-9; v += 0.5) doc.line(X(v), gy, X(v), gy + gh);
    for (let v = 4; v <= 8 + 1e-9; v += 0.5) doc.line(gx, Y(v), gx + gw, Y(v));
    doc.setDrawColor(...CC.ink).setLineWidth(0.3).rect(gx, gy, gw, gh);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...CC.ink);
    [3, 4, 5].forEach((v) => doc.text(String(v), X(v), gy + gh + 3.6, { align: "center" }));
    [4, 5, 6, 7, 8].forEach((v) => doc.text(String(v), gx - 1.6, Y(v) + 1, { align: "right" }));
    doc.setFont("helvetica", "italic").setFontSize(8).text("t", gx + gw + 2, gy + gh + 1);
    doc.text(t("cota", "northing"), gx, gy - 1.8);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...CC.blue).text(safe(t("Pregunta 2 · túnel", "Question 2 · tunnel")), gx + gw + 12, gy + 4);
    doc.setDrawColor(...CC.grid).setLineWidth(0.2);
    for (let k = 1; k <= 5; k += 1) doc.line(gx + gw + 12, gy + 4 + k * 7.5, w.pw() - w.margin, gy + 4 + k * 7.5);
    w.y = gy + gh + 10;
    w.lines(7, 7.5);
  }

  function renderPhase2(w, doc, cfg, A) {
    const D = disputed();
    w.title(t("Fase 2 · El modelo de la trayectoria", "Phase 2 · The trajectory model"), kicker(cfg));
    w.callout(t(
      "Contenido del sobre. Se abre en la segunda clase, después de la reunión de coordinación, cuando los equipos ya han acordado qué fotografías son válidas. A partir de aquí las fotografías no se discuten: se razona sobre funciones.",
      "Contents of the envelope. It is opened in the second class, after the coordination meeting, once the teams have agreed which photographs are valid. From here on the photographs are not debated: we reason about functions."), "blue");
    w.heading(t("Paso 1 · Una sola hipótesis: continuidad en el túnel", "Step 1 · A single hypothesis: continuity in the tunnel"));
    w.paragraph(t(
      "En casa dibujasteis dos recorridos sin saltos y uno con un salto entre los portales del túnel. En los dos primeros, el coche pasa siempre por la cota 6, la del eje del Río Delta; en el tercero puede saltársela. Antes de ver ninguna fórmula, hagamos explícita esa diferencia como única hipótesis: la cota del coche es una función continua en el intervalo [3, 5]. Las fotografías de los portales dan f(3) = 5 y f(5) = 7, y el eje del río está en la cota 6.",
      "At home you drew two routes without jumps and one with a jump between the tunnel portals. In the first two the car always passes through northing 6, the axis of the Delta River; in the third it may skip it. Before seeing any formula, let us make that difference explicit as our only hypothesis: the car's northing is a continuous function on the interval [3, 5]. The portal photographs give f(3) = 5 and f(5) = 7, and the river's axis lies at northing 6."));
    w.formula(A.formulas.ivt, 160);
    w.paragraph(t(
      "Es el teorema del valor intermedio: sin saber qué hizo el coche dentro del túnel, podemos demostrar que en algún instante entre 3 y 5 estuvo exactamente bajo el eje del río. El teorema no dice cuándo, ni cuál era f(4), ni si el coche se detuvo en el aparcamiento subterráneo.",
      "This is the intermediate value theorem: without knowing what the car did inside the tunnel, we can prove that at some instant between 3 and 5 it was exactly under the river's axis. The theorem does not say when, nor what f(4) was, nor whether the car stopped in the underground car park."));
    w.heading(t("Paso 2 · El modelo M", "Step 2 · The model M"));
    w.paragraph(t(
      "La regularidad que anotó el consultor (la columna de la cámara coincide con el instante t) solo estaba comprobada en las fotografías. El modelo la da por buena en todo instante, también entre dos fotografías: en el instante t, el coche está en la columna t y en la cota f(t). Con esa hipótesis, la ruta del coche sobre el plano es la gráfica de f.",
      "The regularity the consultant noted (the camera's column equals the instant t) had only been checked at the photographs. The model accepts it at every instant, also between two photographs: at instant t, the car is at column t and at northing f(t). Under that hypothesis, the car's route on the map is the graph of f."));
    w.paragraph(t("Este es el modelo M de la cota del coche buscado. Concuerda con todas las fotografías válidas, es decir, con todas las de la matrícula buscada. Sus dos primeros tramos, t² y t + 2, son probablemente los que propusisteis en casa. Los otros dos son nuevos: las fotografías pueden sugerir esos comportamientos, pero ninguna colección finita de fotografías podría determinar estas fórmulas ni establecer su comportamiento límite:",
      "This is the model M of the wanted car's northing. It agrees with every valid photograph, that is, every photograph of the wanted plate. Its first two pieces, t² and t + 2, are probably the ones you proposed at home. The other two are new: the photographs may suggest these behaviours, but no finite collection of photographs could determine these formulas or establish their limiting behaviour:"));
    w.formula(A.formulas.model, 150, 0.25);
    w.table([t("Tramo", "Piece"), t("Vía del plano", "Road on the map")], t([
      ["0 <= t <= 2", "Carretera del Puerto (curva)"], ["2 < t < 8", "Avenida Diagonal (incluye el túnel, 3 < t < 5)"],
      ["8 <= t < 10", "Calle del Laberinto, entre la Ronda Sur (cota 10) y la Ronda Norte (cota 12)"], ["10 <= t < 12", "Autovía del Norte, que se pega a la línea del ferrocarril (columna 12)"]
    ], [
      ["0 <= t <= 2", "Harbour Road (curve)"], ["2 < t < 8", "Diagonal Avenue (includes the tunnel, 3 < t < 5)"],
      ["8 <= t < 10", "Labyrinth Street, between the South Ring Road (northing 10) and the North Ring Road (northing 12)"], ["10 <= t < 12", "North Motorway, hugging the railway line (column 12)"]
    ]), [40, 140]);
    w.callout(t(
      "Un modelo es una idealización. Dentro del túnel, M supone la recta t + 2, y ninguna cámara lo confirma. En la Cuesta del Enlace el cambio de cota se trata como instantáneo, en El Laberinto las curvas se repiten infinitas veces y en la autovía la cota acaba superando cualquier valor. Ningún coche real hace exactamente eso, y precisamente por eso el modelo permite estudiar estos fenómenos con rigor.",
      "A model is an idealisation. Inside the tunnel, M assumes the line t + 2, and no camera confirms it. On Link Hill the change of northing is treated as instantaneous, in The Labyrinth the bends repeat infinitely often and on the motorway the northing eventually exceeds every value. No real car does exactly that, and that is precisely why the model lets us study these phenomena rigorously."), "blue");
    const iw = w.W(), ih = iw * A.maps.plainRatio;
    w.ensure(ih + 14);
    w.heading(t("La gráfica de f sobre el plano", "The graph of f on the map"));
    w.image(A.maps.graph, iw, ih, { alias: "map-graph" });
    w.paragraph(t("Círculo relleno: valor de la función. Círculo vacío: punto que no pertenece a la gráfica. Línea discontinua: asíntota vertical t = 12 (el ferrocarril).",
      "Filled circle: value of the function. Empty circle: point not on the graph. Dashed line: vertical asymptote t = 12 (the railway)."), { size: 9 });
    if (A.maps.labyrinthGraph) {
      const lw = w.W(), lh = lw * A.maps.labyrinthRatio;
      w.ensure(lh + 10);
      w.sub(t("Detalle: El Laberinto", "Detail: The Labyrinth"));
      w.image(A.maps.labyrinthGraph, lw, lh, { alias: "lab-graph" });
    }
    w.ensure(60);
    w.heading(t("Paso 3 · El registro automático g", "Step 3 · The automatic record g"));
    w.paragraph(t(
      `El sistema de lectura compara las matrículas con cierta tolerancia y solo admite una posición por instante. En t = 6 y en t = 8, dos cámaras leyeron en el mismo instante matrículas compatibles con la buscada, y en los dos casos el sistema se quedó con la del coche ${cfg.alt}: la ${roadName(D.b6.road)} en t = 6 (cota ${num(D.b6.y, 2)}) y el pie de la ${roadName(D.c8.road)} en t = 8 (cota ${num(D.c8.y, 2)}). Su registro automático define otra función, g, que no describe el coche buscado:`,
      `The reading system matches plates with some tolerance and allows only one position per instant. At t = 6 and at t = 8, two cameras read plates compatible with the wanted one at the same instant, and in both cases the system kept the reading of the car ${cfg.alt}: the ${roadName(D.b6.road)} at t = 6 (northing ${num(D.b6.y, 2)}) and the foot of ${roadName(D.c8.road)} at t = 8 (northing ${num(D.c8.y, 2)}). Its automatic record defines another function, g, which does not describe the wanted car:`));
    w.formula(A.formulas.record, 120, 0.25);
    w.image(A.maps.record, w.W() * 0.62, w.W() * 0.62 * A.maps.plainRatio, { alias: "map-record" });
    w.ensure(130);   // heading, definition and the whole table together
    w.y += 4;
    w.heading(t("Hoja de trabajo · Fase 2", "Worksheet · Phase 2"));
    w.paragraph(t("Recordad la definición: f es continua en a si existe f(a), existe el límite cuando t tiende a a y ambos coinciden.",
      "Recall the definition: f is continuous at a if f(a) exists, the limit as t tends to a exists and the two agree."));
    w.formula(A.formulas.cont, 70);
    w.paragraph(t("La última columna compara evidencia y modelo: qué sugerían las fotografías y qué podéis establecer ahora. Por ejemplo, en t = 10 las fotografías solo sugerían una alternancia; con el modelo se puede demostrar que el límite por la izquierda no existe. En t = 12 mostraban valores cada vez mayores; con el modelo se puede demostrar que el límite es +infinito.",
      "The last column compares evidence and model: what the photographs suggested and what you can establish now. For instance, at t = 10 the photographs only suggested an alternation; with the model one can prove that the left-hand limit does not exist. At t = 12 they showed ever larger values; with the model one can prove that the limit is +infinity."));
    w.table([t("Punto", "Point"), t("Límite por la izquierda", "Left-hand limit"), t("Límite por la derecha", "Right-hand limit"), t("Valor", "Value"), t("Continuidad / comportamiento", "Continuity / behaviour"), t("¿Qué podemos establecer ahora que las fotografías solas no permitían?", "What can we establish now that the photographs alone could not?")],
      [["f, t = 2", "", "", "", "", ""], ["f, t = 6", "", "", "", "", ""], ["g, t = 6", "", "", "", "", ""], ["f, t = 8", "", "", "", "", ""], ["g, t = 8", "", "", "", "", ""], ["f, t -> 10", "", "", "", "", ""], ["f, t -> 12-", "", "", "", "", ""]],
      [18, 22, 22, 15, 38, 65], { minRow: 12, keep: true });
    w.bullets(t([
      "Oscilación en t = 10. Mirad la gráfica de f cerca de 10 por la izquierda: ¿se acercan los valores a un único número? Ampliación: calculad f en t_n = 10 - 1/n y en s_n = 10 - 2/(4n+1) y explicad por qué esas dos sucesiones demuestran que no existe el límite por la izquierda.",
      "Comparad t = 6 y t = 8 (pregunta común para todos los equipos). ¿En cuál de los dos casos podría un único valor registrado distinto hacer continua la función? ¿Por qué? Razonad con lo que ocurre a cada lado del punto y con el valor en el punto, no solo con el nombre de la discontinuidad. ¿Qué significa esa corrección en la investigación?",
      "Límite infinito. Calculad el límite de f cuando t tiende a 12 por la izquierda e interpretad la asíntota en el plano.",
      "Túnel. Con el modelo M, ¿en qué instante exacto pasa el coche bajo el eje del río? ¿Es una conclusión de las cámaras o del modelo?"
    ], [
      "Oscillation at t = 10. Look at the graph of f near 10 from the left: do the values approach a single number? Extension: compute f at t_n = 10 - 1/n and at s_n = 10 - 2/(4n+1) and explain why these two sequences prove that the left limit does not exist.",
      "Compare t = 6 and t = 8 (a question for every team). In which of the two cases could changing a single recorded value make the function continuous? Why? Argue from what happens on each side of the point and from the value at the point, not just from the name of the discontinuity. What does that correction mean for the investigation?",
      "Infinite limit. Compute the limit of f as t tends to 12 from the left and interpret the asymptote on the map.",
      "Tunnel. Under the model M, at what exact instant does the car pass under the river's axis? Is that a conclusion of the cameras or of the model?"
    ]), true);
    w.lines(6, 7.5);
  }

  function renderOverlay(w, doc, cfg, A) {
    const D = disputed();
    w.title(t("Transparencia de la gráfica de f", "Transparency of the graph of f"), kicker(cfg));
    w.paragraph(t(
      "Imprimid la página siguiente en acetato, al 100 % y sin ajustar a la página, en el mismo formato de papel que el plano de seguimiento. Colocadla sobre la página del plano haciendo coincidir los marcos: la gráfica de f recorre las calles por las que pasó el coche, y todas las cámaras de sus fotografías quedan sobre la curva.",
      "Print the next page on acetate, at 100% and without fit-to-page, on the same paper format as the tracking map. Lay it over the map page with the frames matching: the graph of f runs along the streets the car followed, and every camera of its photographs sits on the curve."));
    w.paragraph(t(
      `Fijaos en las dos cámaras del coche confundible. ${D.b6.id} queda lejos de la curva. ${D.c8.id} queda bajo el círculo vacío de t = 8: es el límite por la izquierda de f en 8, un punto que no pertenece a la gráfica.`,
      `Look at the two cameras of the look-alike car. ${D.b6.id} lies far from the curve. ${D.c8.id} lies under the empty circle at t = 8: it is the left limit of f at 8, a point that is not on the graph.`));
    const R = w.turned();
    const box = mapBox(R, A);
    R.image(A.turned.overlay, "PNG", box.u, box.v, box.wd, box.ht, "map-overlay");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...CC.blue);
    R.text(t(`${cfg.city} · Transparencia · gráfica de f (columna = t, cota = f(t))`, `${cfg.city} · Transparency · graph of f (column = t, northing = f(t))`), box.u, box.v + box.ht + 4.5);
  }

  function renderGuide(w, doc, cfg, A) {
    const D = disputed();
    w.title(t("Guía docente", "Teacher guide"), kicker(cfg), true);
    w.meta([[t("Matrícula buscada", "Wanted plate"), cfg.plate], [t("Matrícula confundible", "Look-alike plate"), cfg.alt], [t("Inicio", "Start"), `${cfg.start} · ${cfg.dateLabel}`]]);
    w.heading(t("Objetivo de la actividad", "Aim of the activity"));
    w.paragraph(t(
      "La clase reconstruye el recorrido de un coche a partir de un registro finito de fotografías y decide, punto a punto, qué está probado, qué es solo un candidato y qué queda desconocido. Primero trabaja solo con la evidencia; después recibe un modelo explícito y demuestra sobre él valores, límites laterales, límites, continuidad y tipos de discontinuidad.",
      "The class reconstructs a car's route from a finite record of photographs and decides, point by point, what is proved, what is only a candidate and what remains unknown. It first works with the evidence alone; then it receives an explicit model and proves on it values, one-sided limits, limits, continuity and types of discontinuity."));
    w.bullets(t([
      "Separar evidencia, modelo y conclusión: un conjunto finito de observaciones sugiere, una función permite demostrar.",
      "Distinguir el valor de una función, sus límites laterales y su límite; distinguir «desconocido» de «no definido».",
      "Reconocer continuidad, discontinuidad evitable, salto, oscilación sin límite y límite infinito sobre una función explícita.",
      "Usar el teorema del valor intermedio para concluir algo cierto sin conocer toda la trayectoria.",
      "Tratar un error de identificación como tal y no como un dato de la función."
    ], [
      "Separate evidence, model and conclusion: a finite set of observations suggests, a function lets you prove.",
      "Distinguish the value of a function, its one-sided limits and its limit; distinguish \"unknown\" from \"undefined\".",
      "Recognise continuity, removable discontinuity, jump, oscillation without a limit and infinite limit on an explicit function.",
      "Use the intermediate value theorem to conclude something true without knowing the whole trajectory.",
      "Treat an identification error as such and not as a value of the function."
    ]));
    w.heading(t("El papel del inspector jefe", "The Chief Inspector's role"));
    w.paragraph(t(
      "El docente hace de inspector jefe. Reparte los paquetes, plantea la pregunta del caso, guarda el sobre de la fase 2 y dirige la reunión de coordinación. No convierte los candidatos en conclusiones: cuando un equipo afirma algo, le devuelve la pregunta. ¿Qué imagen exacta lo muestra? ¿Lo demuestra o lo sugiere?",
      "The teacher plays the Chief Inspector. They hand out the packets, set the question of the case, keep the phase 2 envelope and chair the coordination meeting. They do not turn candidates into conclusions: when a team states something, they hand the question back. Which exact image shows it? Does it prove it or suggest it?"));
    w.heading(t("Dos rutas de uso", "Two routes through the case"));
    w.bullets(t([
      "Ruta introductoria, para un primer encuentro con las ideas de límite y continuidad: t = 2, el túnel, t = 6 y t = 8. Las zonas de t = 10 y t = 12 se describen en la fase 1 como observación, pero no se exige su clasificación en la fase 2; en la exposición, el equipo A presenta el túnel.",
      "Ruta completa, de consolidación, para una clase que ya ha trabajado con límites: añade t = 10 y t = 12, con la oscilación y el límite infinito. La demostración rigurosa de la oscilación con sucesiones queda como ampliación."
    ], [
      "Introductory route, for a first encounter with the ideas of limit and continuity: t = 2, the tunnel, t = 6 and t = 8. The zones at t = 10 and t = 12 are described in phase 1 as observations, but their classification in phase 2 is not required; in the presentations, team A presents the tunnel.",
      "Full route, for consolidation, with a class that has already worked with limits: it adds t = 10 and t = 12, with the oscillation and the infinite limit. The rigorous proof of the oscillation with sequences stays as an extension."
    ]));
    w.paragraph(t("Ninguna ruta elimina contenido: solo decide qué es núcleo y qué es ampliación según el nivel del grupo.",
      "Neither route removes content: it only decides what is core and what is extension, depending on the group."), { italic: true, size: 9 });
    w.heading(t("Pregunta de diagnóstico: dos versiones", "Diagnostic question: two versions"));
    w.bullets(t([
      "Versión conceptual, sin terminología previa de límites: «Para t distinto de 6, el valor sigue la regla t + 2, y en t = 6 el valor registrado es 12. ¿Cuál es el valor exactamente en 6? ¿A qué número se acercan los valores cercanos?». Después se dice que esa segunda cantidad es lo que llamaremos límite. Respuestas: 12 y 8.",
      "Versión formal, si la clase ya conoce el concepto: «Si g(t) = t + 2 para t distinto de 6 y g(6) = 12, ¿cuánto valen g(6) y el límite en 6?». Respuestas: 12 y 8.",
      "En ambas: «Si una cámara registró una detección en t = 6 pero no conservó la fotografía, ¿significa eso que el coche no tenía posición en ese instante?». Respuesta: no."
    ], [
      "Conceptual version, with no prior limit terminology: \"For t other than 6, the value follows the rule t + 2, while at t = 6 the recorded value is 12. What is the value at exactly 6? What number are the nearby values approaching?\" Then say that the second quantity is what we shall call the limit. Answers: 12 and 8.",
      "Formal version, if the class already knows the concept: \"If g(t) = t + 2 for t other than 6 and g(6) = 12, what are g(6) and the limit at 6?\" Answers: 12 and 8.",
      "In both: \"If a camera logged a detection at t = 6 but kept no photograph, does that mean the car had no position at that instant?\" Answer: no."
    ]));
    w.heading(t("Material de esta generación", "Material in this generation"));
    w.bullets(t([
      `Fase 1 (un paquete por estudiante, distinto para cada equipo; se trabaja en casa): apertura, plano con detalles y registro de cámaras, dossier fotográfico (${state.data.slots.length} registros) y hoja de investigación del consultor, a medio completar.`,
      "Fase 2 (igual para todos, en un sobre que se abre en la segunda clase, después de la coordinación): hipótesis de continuidad, modelo M, registro automático g, gráfica sobre el plano y hoja de trabajo; transparencia para superponer.",
      "Profesorado: esta guía, la solución y el inventario.",
      "Imprime el plano y la transparencia al 100 %, sin ajustar a la página, para que coincidan al superponerlos. Las páginas del plano están giradas dentro de una hoja vertical, así que todo el material se imprime en vertical."
    ], [
      `Phase 1 (one packet per student, different for each team; worked at home): opening, map with details and camera register, photographic dossier (${state.data.slots.length} records) and the consultant's half-completed investigation worksheet.`,
      "Phase 2 (the same for everyone, in an envelope opened in the second class, after the coordination meeting): continuity hypothesis, model M, automatic record g, graph on the map and worksheet; transparency to overlay.",
      "Teacher: this guide, the solution and the inventory.",
      "Print the map and the transparency at 100%, without fit-to-page, so that they match when overlaid. The map pages are turned inside a portrait sheet, so all the material prints in portrait."
    ]));
    w.heading(t("Qué cambia entre equipos", "What differs between teams"));
    w.table([t("Prueba", "Exhibit"), t("Equipo A", "Team A"), t("Equipo B", "Team B"), t("Equipo C", "Team C")], variantRows(cfg), [22, 52, 52, 52]);
    w.paragraph(t("El resto de las pruebas es idéntico en los tres dossieres. Con más de tres equipos, repite los roles sin decir quién comparte expediente.",
      "All other exhibits are identical in the three dossiers. With more than three teams, repeat the roles without saying who shares a file."));
    w.heading(t("Organización en dos clases", "Two-class organisation"));
    w.paragraph(t(
      "La parte mecánica (calcular instantes, localizar cámaras, comprobar matrículas) se hace en casa; la clase se reserva para discutir. La hoja del consultor llega con las pruebas F-01 a F-20 ya pasadas a limpio, de modo que en casa queda poco cálculo y mucha interpretación.",
      "The mechanical part (computing instants, locating cameras, checking plates) is done at home; class time is kept for discussion. The consultant's worksheet arrives with exhibits F-01 to F-20 already written up, so little calculation and much interpretation is left for home."));
    w.table([t("Momento", "When"), t("Tiempo", "Time"), t("Acción", "Action")], t([
      ["Clase 1 · final", "15–20 min", "Pregunta de diagnóstico. Lectura de la apertura en voz alta: la persecución, la pregunta del caso, la matrícula buscada, la cuadrícula del plano y la regularidad que anotó el consultor. Formar los equipos y entregar un paquete de la fase 1 a cada estudiante. Normas: el dossier no se enseña a otros equipos y la hoja se trae completa."],
      ["En casa", "45–60 min por equipo", "Completar el registro del consultor, comprobar todas las matrículas, ordenar las pruebas, rellenar la tabla de zonas, proponer fórmulas para los dos primeros tramos y preparar dos afirmaciones defendibles y un punto indecidible. Conviene repartirse las pruebas dentro del equipo."],
      ["Clase 2 · coordinación", "15 min", "Comparar equipos por código de prueba. Descubrir la matrícula confundible, la detección sin imagen y la matrícula ilegible del equipo A; acordar qué valores son válidos, cuáles desconocidos y qué candidatos quedan."],
      ["Clase 2 · sobre", "20 min", "Abrir el sobre: hipótesis de continuidad y TVI en el túnel; después, el modelo M (cuyos dos primeros tramos ya habrán propuesto) y el registro g. Los equipos rellenan la hoja de trabajo repartiéndose las filas."],
      ["Clase 2 · exposición", "10 min", "Cada equipo explica a la clase el punto donde falló su propio dossier: B, t = 6 (evitable en g); C, t = 8 (salto); A, t -> 10 (oscilación), o el túnel en la ruta introductoria. El docente cierra con lo que quede: el túnel y la asíntota."],
      ["Clase 2 · cierre", "5 min", "Pregunta individual sobre un fotograma que falta (ver solución). Ampliación para casa: la prueba de la oscilación con sucesiones."]
    ], [
      ["Class 1 · end", "15–20 min", "Diagnostic question. Read the opening aloud: the pursuit, the question of the case, the wanted plate, the map grid and the regularity the consultant noted. Form the teams and give a phase 1 packet to every student. Rules: the dossier is not shown to other teams and the worksheet comes back completed."],
      ["At home", "45–60 min per team", "Complete the consultant's record, check every plate, order the exhibits, fill the zone table, propose formulas for the first two stretches and prepare two defensible statements and one undecidable point. Teams should share out the exhibits."],
      ["Class 2 · coordination", "15 min", "Compare teams by exhibit code. Discover the look-alike plate, the detection without an image and team A's unreadable plate; agree which values are valid, which are unknown and which candidates remain."],
      ["Class 2 · envelope", "20 min", "Open the envelope: continuity hypothesis and IVT in the tunnel; then the model M (whose first two pieces they will already have proposed) and the record g. Teams fill in the worksheet, sharing out the rows."],
      ["Class 2 · presentation", "10 min", "Each team explains to the class the point where its own dossier failed: B, t = 6 (removable in g); C, t = 8 (jump); A, t -> 10 (oscillation), or the tunnel in the introductory route. The teacher closes with what is left: the tunnel and the asymptote."],
      ["Class 2 · close", "5 min", "Individual question about a missing frame (see solution). Extension for home: the proof of the oscillation with sequences."]
    ]), [30, 22, 128]);
    w.heading(t("La reunión de coordinación", "The coordination meeting"));
    w.bullets(t([
      "Cada equipo lee sus códigos en orden cronológico y, prueba a prueba, se comparan la cámara, la hora y la cota. Ante una discrepancia, la pregunta es siempre la misma: ¿qué imagen exacta es distinta?",
      `En ${D.s6.code}, A y B tienen la misma hora en dos cámaras distintas: ${D.a6.id}, en la cota ${num(D.a6.y, 2)}, y ${D.b6.id}, en la cota ${num(D.b6.y, 2)}. Un coche no puede estar en dos sitios a la vez, así que al menos una de las dos fotografías no es del coche buscado; la matrícula decide cuál. C aporta una detección de la misma cámara que A, pero sin imagen.`,
      `En ${D.s8.code}, A y B ven ${cfg.plate} en lo alto de la ${roadName(D.a8.road)} y C ve ${cfg.alt} al pie, a la misma hora. El mismo razonamiento descarta la prueba de C.`,
      `En ${glareSlot().code}, la matrícula del equipo A es ilegible por un reflejo; B y C tienen un fotograma legible del mismo instante (cada detección guarda varios fotogramas, y cada operador eligió uno). Con su ayuda, A puede dar por válida la cota ${num(D.g.y, 2)}: es el único caso en que otro equipo resuelve la duda del A.`,
      `Al terminar, la clase acuerda qué valores son válidos (f(6) = ${num(D.a6.y, 2)} y f(8) = ${num(D.a8.y, 2)}, con las fotografías de A), cuáles quedan desconocidos o sin verificar para cada equipo y qué candidatos se mantienen. Solo entonces se abre el sobre.`
    ], [
      "Each team reads its codes in time order and, exhibit by exhibit, the camera, the time and the northing are compared. When there is a discrepancy, the question is always the same: which exact image is different?",
      `In ${D.s6.code}, A and B have the same time at two different cameras: ${D.a6.id}, at northing ${num(D.a6.y, 2)}, and ${D.b6.id}, at northing ${num(D.b6.y, 2)}. A car cannot be in two places at once, so at least one of the two photographs is not of the wanted car; the plate decides which. C brings a detection from the same camera as A, but without an image.`,
      `In ${D.s8.code}, A and B see ${cfg.plate} at the top of ${roadName(D.a8.road)} and C sees ${cfg.alt} at its foot, at the same time. The same reasoning discards C's exhibit.`,
      `In ${glareSlot().code}, team A's plate is unreadable because of a reflection; B and C hold a readable frame of the same instant (each detection keeps several frames, and each operator chose one). With their help, A can accept northing ${num(D.g.y, 2)} as valid: it is the one case where another team settles A's doubt.`,
      `At the end, the class agrees which values are valid (f(6) = ${num(D.a6.y, 2)} and f(8) = ${num(D.a8.y, 2)}, from A's photographs), which remain unknown or unverified for each team and which candidates stand. Only then is the envelope opened.`
    ]), true);
    w.sub(t("Preguntas para dirigir la reunión", "Questions to steer the meeting"));
    w.bullets(t([
      `¿Qué matrícula aparece en vuestra prueba ${D.s6.code}? ¿Y en la ${D.s8.code}?`,
      "Si una foto muestra otro coche, ¿qué sabemos del coche buscado en ese instante?",
      "¿Es lo mismo una detección sin imagen que un instante en que el coche no tiene posición?",
      "¿Qué sabéis de la posición del coche cuando la matrícula es ilegible? ¿Y dentro del túnel, donde ni siquiera la regularidad columna = t puede comprobarse?",
      "¿Qué dos evoluciones distintas de la cota encajan con los portales del túnel?",
      "¿Cuántas fotos alternantes harían falta para demostrar que no hay límite en 10?"
    ], [
      `Which plate appears in your exhibit ${D.s6.code}? And in ${D.s8.code}?`,
      "If a photo shows another car, what do we know about the wanted car at that instant?",
      "Is a detection without an image the same as an instant at which the car has no position?",
      "What do you know about the car's position when the plate is unreadable? And inside the tunnel, where not even the regularity column = t can be checked?",
      "Which two different evolutions of the northing fit the tunnel portals?",
      "How many alternating photos would be needed to prove there is no limit at 10?"
    ]));
    w.heading(t("Puntos de investigación", "Investigation checkpoints"));
    w.bullets(t([
      `t = 2 (glorieta): fotos a ambos lados y en el instante exacto, todas con la matrícula buscada (cotas ${cotasIn(1.85, 2.25)}). Sugieren una ruta sin corte. Con el modelo: f(2) = 4 = límite; continua, aunque la ruta forme un ángulo.`,
      "Túnel (3 < t < 5): solo los portales. Ningún valor interior se conoce, y la regularidad columna = t tampoco puede comprobarse dentro. Con la hipótesis de continuidad, el TVI garantiza un instante c en (3, 5) con f(c) = 6. Solo el modelo fija c = 4.",
      `t = 6 (avenida): A ve el coche buscado en la cota ${num(D.a6.y, 2)}. B ve ${cfg.alt} en la ${roadName(D.b6.road)} (cota ${num(D.b6.y, 2)}): error de identificación, f(6) desconocido. C tiene una detección de ${D.c6.id} sin imagen: sugiere la cota ${num(D.c6.y, 2)}, que encaja con las vecinas, pero sin imagen la matrícula no puede comprobarse y el valor queda sin verificar. Para B y C, f(6) es desconocido, que no es lo mismo que indefinido; nadie debe escribir f(6) = ${num(D.b6.y, 2)}. En el registro automático g aparece una discontinuidad evitable.`,
      `t = 8 (${roadName(D.a8.road)}): por la izquierda las cotas se acercan a 10 y por la derecha a 12. A y B ven el coche buscado arriba (cota ${num(D.a8.y, 2)}); C ve ${cfg.alt} abajo (cota ${num(D.c8.y, 2)}). El salto no depende de qué valor tenga la función en 8.`,
      `t -> 10 (El Laberinto): cuatro fotos que alternan las cotas 10 y 12 en instantes cada vez más próximos a 10; en la ${glareSlot().code} del equipo A la matrícula es ilegible. Solo motivan la sospecha. Con el modelo, la gráfica muestra que los valores no se acercan a un único número; la prueba rigurosa con dos sucesiones queda como ampliación.`,
      `t -> 12 (autovía): cotas ${cotasIn(10.4, 12)}. La sospecha de límite infinito solo se demuestra con 10 + 4/(12 - t).`
    ], [
      `t = 2 (roundabout): photos on both sides and at the exact instant, all with the wanted plate (northings ${cotasIn(1.85, 2.25)}). They suggest a route without a break. With the model: f(2) = 4 = limit; continuous, even though the route turns a corner.`,
      "Tunnel (3 < t < 5): only the portals. No interior value is known, and the regularity column = t cannot be checked inside either. Under the continuity hypothesis, the IVT guarantees an instant c in (3, 5) with f(c) = 6. Only the model fixes c = 4.",
      `t = 6 (avenue): A sees the wanted car at northing ${num(D.a6.y, 2)}. B sees ${cfg.alt} on the ${roadName(D.b6.road)} (northing ${num(D.b6.y, 2)}): identification error, f(6) unknown. C has a detection from ${D.c6.id} without an image: it suggests northing ${num(D.c6.y, 2)}, which fits the neighbours, but without an image the plate cannot be checked and the value stays unverified. For B and C, f(6) is unknown, which is not the same as undefined; nobody should write f(6) = ${num(D.b6.y, 2)}. The automatic record g shows a removable discontinuity.`,
      `t = 8 (${roadName(D.a8.road)}): from the left the northings approach 10 and from the right 12. A and B see the wanted car at the top (northing ${num(D.a8.y, 2)}); C sees ${cfg.alt} at the bottom (northing ${num(D.c8.y, 2)}). The jump does not depend on the function's value at 8.`,
      `t -> 10 (The Labyrinth): four photos alternating northings 10 and 12 at instants ever closer to 10; in team A's ${glareSlot().code} the plate is unreadable. They only motivate the suspicion. With the model, the graph shows that the values do not approach a single number; the rigorous proof with two sequences is left as an extension.`,
      `t -> 12 (motorway): northings ${cotasIn(10.4, 12)}. The suspected infinite limit is proved only with 10 + 4/(12 - t).`
    ]));
    w.heading(t("Un plano estilizado", "A stylised map"));
    w.paragraph(t(
      "Para que la ruta coincida con la gráfica de f, el plano se ha dibujado de modo que la columna del coche coincide con el minuto t. En la avenida eso es verosímil, pero cerca de t = 8, t = 10 y t = 12 las fotografías, leídas sobre un plano a escala real, exigirían recorridos imposibles en pocos segundos. Por eso el plano no lleva escala en metros y la actividad no pide calcular distancias ni velocidades. Si alguien lo advierte, es una observación excelente: confirma que el salto, la oscilación y el límite infinito son idealizaciones del modelo y no hechos que una cámara pueda registrar.",
      "For the route to coincide with the graph of f, the map has been drawn so that the car's column equals the minute t. On the avenue that is plausible, but near t = 8, t = 10 and t = 12 the photographs, read on a map at real scale, would require impossible journeys in a few seconds. That is why the map carries no scale in metres and the activity never asks for distances or speeds. If someone notices, it is an excellent observation: it confirms that the jump, the oscillation and the infinite limit are idealisations of the model, not facts that a camera could record."));
  }

  function variantRows(cfg) {
    const d = state.data;
    return d.slots.filter((s) => TEAMS.some((tm) => s.teams[tm].car !== "target")).map((s) => [
      `${s.code} (t = ${num(s.t, 2)})`,
      ...TEAMS.map((tm) => {
        const e = s.teams[tm], cam = d.camera[e.camera];
        if (e.car === "none") return t(`${cam.id} (cota ${num(cam.y, 2)}): detección sin imagen, matrícula sin verificar`, `${cam.id} (northing ${num(cam.y, 2)}): detection without an image, plate unverified`);
        if (e.car === "glare") return t(`${cam.id}, cota ${num(cam.y, 2)}, matrícula ilegible por un reflejo`, `${cam.id}, northing ${num(cam.y, 2)}, plate unreadable because of a reflection`);
        const plate = e.car === "alt" ? cfg.alt : cfg.plate;
        return t(`${cam.id}, cota ${num(cam.y, 2)}, matrícula ${plate}${e.car === "alt" ? " (confundible)" : ""}`, `${cam.id}, northing ${num(cam.y, 2)}, plate ${plate}${e.car === "alt" ? " (look-alike)" : ""}`);
      })
    ]);
  }

  function renderSolution(w, doc, cfg, A) {
    const D = disputed();
    w.title(t("Solución y comparación de equipos", "Solution and team comparison"), kicker(cfg), true);
    w.heading(t("Fase 1 · lo que cada equipo puede afirmar", "Phase 1 · what each team can state"));
    const n6 = cotasIn(5.9, 5.99) + t(" y ", " and ") + cotasIn(6.01, 6.1);
    w.table([t("Punto", "Point"), t("Equipo A", "Team A"), t("Equipo B", "Team B"), t("Equipo C", "Team C")], t([
      ["t = 2", `Cotas ${cotasIn(1.85, 2.25)}, a ambos lados de 2 y 4 en t = 2. Sugieren una ruta sin corte que pasa por 4; las fotos no dicen qué ocurre entre una y otra.`, "Igual que A.", "Igual que A."],
      ["3 < t < 5", "Seguro: f(3) = 5 y f(5) = 7. Desconocido: todo el interior. Los dibujos sin salto cruzan la cota 6; el dibujo con salto puede no hacerlo.", "Igual que A.", "Igual que A."],
      ["t = 6", `Seguro: el coche buscado está en la cota ${num(D.a6.y, 2)}; vecinas ${n6}. Sugieren una ruta sin corte.`, `${D.s6.code} muestra ${cfg.alt} en la ${roadName(D.b6.road)} (cota ${num(D.b6.y, 2)}): error de identificación. f(6) desconocido; las vecinas sugieren un valor próximo a 8.`, `${D.s6.code}: detección de ${D.c6.id} sin imagen. Sugiere la cota ${num(D.c6.y, 2)}, pero la matrícula no se puede comprobar: f(6) sin verificar (desconocido, no indefinido).`],
      ["t = 8", `Por la izquierda, cotas que se acercan a 10 (${cotasIn(7.4, 7.99)}); en t = 8, ${num(D.a8.y, 2)}; por la derecha, cerca de 12 (${cotasIn(8.01, 8.6)}). Sugieren un cambio brusco de 10 a 12; los datos no dicen qué ocurre justo antes de 8.`, "Igual que A.", `${D.s8.code} muestra ${cfg.alt} al pie de la cuesta (cota ${num(D.c8.y, 2)}): error de identificación. f(8) desconocido; el cambio brusco de 10 a 12 sigue sugerido.`],
      ["t -> 10", `Las cotas registradas alternan entre 10 y 12 en instantes cada vez más próximos a 10 (${D.sg.code} con la matrícula ilegible: cota ${num(D.g.y, 2)} sin verificar hasta la reunión). Sugiere una oscilación, pero el registro finito no establece qué ocurre arbitrariamente cerca de 10.`, `Igual que A, con ${D.sg.code} legible.`, `Igual que A, con ${D.sg.code} legible.`],
      ["t -> 12", `Cotas ${cotasIn(10.4, 12)}: cada vez mayores. Sugieren un crecimiento sin tope, pero un número finito de datos no prueba un límite infinito.`, "Igual que A.", "Igual que A."]
    ], [
      ["t = 2", `Northings ${cotasIn(1.85, 2.25)}, on both sides of 2 and 4 at t = 2. They suggest a route without a break through 4; the photos say nothing about what happens between them.`, "Same as A.", "Same as A."],
      ["3 < t < 5", "Certain: f(3) = 5 and f(5) = 7. Unknown: the whole interior. The drawings without a jump cross northing 6; the drawing with a jump need not.", "Same as A.", "Same as A."],
      ["t = 6", `Certain: the wanted car is at northing ${num(D.a6.y, 2)}; neighbours ${n6}. They suggest a route without a break.`, `${D.s6.code} shows ${cfg.alt} on the ${roadName(D.b6.road)} (northing ${num(D.b6.y, 2)}): identification error. f(6) unknown; the neighbours suggest a value close to 8.`, `${D.s6.code}: detection from ${D.c6.id} without an image. It suggests northing ${num(D.c6.y, 2)}, but the plate cannot be checked: f(6) unverified (unknown, not undefined).`],
      ["t = 8", `From the left, northings approaching 10 (${cotasIn(7.4, 7.99)}); at t = 8, ${num(D.a8.y, 2)}; from the right, close to 12 (${cotasIn(8.01, 8.6)}). They suggest a sudden change from 10 to 12; the data say nothing about what happens just before 8.`, "Same as A.", `${D.s8.code} shows ${cfg.alt} at the foot of the hill (northing ${num(D.c8.y, 2)}): identification error. f(8) unknown; the sudden change from 10 to 12 is still suggested.`],
      ["t -> 10", `The recorded northings alternate between 10 and 12 at times increasingly close to 10 (${D.sg.code} with an unreadable plate: northing ${num(D.g.y, 2)} unverified until the meeting). This suggests oscillation, but the finite record does not establish what happens arbitrarily close to 10.`, `Same as A, with ${D.sg.code} readable.`, `Same as A, with ${D.sg.code} readable.`],
      ["t -> 12", `Northings ${cotasIn(10.4, 12)}: ever larger. They suggest growth without bound, but finitely many data do not prove an infinite limit.`, "Same as A.", "Same as A."]
    ]), [18, 54, 54, 54], { size: 7.6 });
    w.paragraph(t(
      `Primeros tramos (pregunta 3): entre t = 0 y t = 2 las cotas son los cuadrados de t (${cotasIn(0, 2)}), luego t²; entre t = 2 y t = 8, cada cota supera en 2 al instante (${cotasIn(2.1, 7.99)}), luego t + 2. Basta comprobar cada fórmula con un par de pruebas. Túnel (pregunta 2): la regularidad columna = t no puede comprobarse dentro, porque no hay cámaras; es la hipótesis que el modelo adopta en la fase 2.`,
      `First stretches (question 3): between t = 0 and t = 2 the northings are the squares of t (${cotasIn(0, 2)}), hence t²; between t = 2 and t = 8 each northing exceeds the instant by 2 (${cotasIn(2.1, 7.99)}), hence t + 2. Checking each formula with a couple of exhibits is enough. Tunnel (question 2): the regularity column = t cannot be checked inside, because there are no cameras; it is the hypothesis the model adopts in phase 2.`));
    w.callout(t(
      `Ninguna fotografía de la matrícula ${cfg.alt} se usa como valor de f. Las pruebas ${D.s6.code} del equipo B y ${D.s8.code} del equipo C se clasifican como errores de identificación; la ${D.s6.code} del equipo C es una detección sin verificar, y la ${D.sg.code} del equipo A, una fotografía con la matrícula ilegible. En esos instantes, el valor del coche buscado queda desconocido para ese equipo hasta la reunión de coordinación, donde las fotografías de los otros equipos lo fijan: f(6) = ${num(D.a6.y, 2)}, f(8) = ${num(D.a8.y, 2)} y la cota ${num(D.g.y, 2)} de la ${D.sg.code}.`,
      `No photograph of plate ${cfg.alt} is used as a value of f. Exhibits ${D.s6.code} of team B and ${D.s8.code} of team C are classified as identification errors; exhibit ${D.s6.code} of team C is an unverified detection, and exhibit ${D.sg.code} of team A a photograph with an unreadable plate. At those instants the wanted car's value remains unknown to that team until the coordination meeting, where the other teams' photographs fix it: f(6) = ${num(D.a6.y, 2)}, f(8) = ${num(D.a8.y, 2)} and the northing ${num(D.g.y, 2)} of ${D.sg.code}.`), "warn");
    w.heading(t("Fase 2 · resultados con el modelo M", "Phase 2 · results under the model M"));
    w.table([t("Punto", "Point"), t("Lím. izq.", "Left lim."), t("Lím. der.", "Right lim."), t("Valor", "Value"), t("Continuidad / comportamiento", "Continuity / behaviour"), t("Lo que el modelo establece y las fotos no", "What the model establishes that the photos could not")], t([
      ["f, 2", "4", "4", "4", "Continua (la ruta tiene un ángulo, no un corte)", "Que el límite es exactamente 4 y coincide con el valor; las fotos solo mostraban cotas próximas a 4."],
      ["f, 6", "8", "8", "8", "Continua", "Que el límite y el valor son 8; antes de la reunión, B y C no podían saberlo."],
      ["g, 6", "8", "8", "12", "Discontinuidad evitable: el límite existe y solo falla el valor", "Que el error está en un único valor: redefinir g(6) = 8 lo corrige."],
      ["f, 8", "10", "12", "12", "Salto finito; continua por la derecha", "Que los límites laterales son exactamente 10 y 12, luego no hay límite; las fotos solo se acercaban."],
      ["g, 8", "10", "12", "10", "Salto finito; continua por la izquierda", "Que cambiar el valor en 8 no elimina el salto."],
      ["f, 10", "No existe", "12", "12", "Discontinuidad esencial por oscilación; continua por la derecha", "Antes: las fotos sugerían una alternancia. Ahora: se demuestra que el límite por la izquierda no existe."],
      ["f, 12-", "+inf.", "—", "No definida", "Límite infinito; asíntota vertical t = 12", "Antes: valores cada vez mayores. Ahora: se demuestra que el límite es +infinito."]
    ], [
      ["f, 2", "4", "4", "4", "Continuous (the route has a corner, not a break)", "That the limit is exactly 4 and equals the value; the photos only showed northings close to 4."],
      ["f, 6", "8", "8", "8", "Continuous", "That the limit and the value are 8; before the meeting, B and C could not know it."],
      ["g, 6", "8", "8", "12", "Removable discontinuity: the limit exists and only the value fails", "That the error lies in a single value: redefining g(6) = 8 corrects it."],
      ["f, 8", "10", "12", "12", "Finite jump; right-continuous", "That the one-sided limits are exactly 10 and 12, so there is no limit; the photos only approached them."],
      ["g, 8", "10", "12", "10", "Finite jump; left-continuous", "That changing the value at 8 does not remove the jump."],
      ["f, 10", "Does not exist", "12", "12", "Essential (oscillating) discontinuity; right-continuous", "Before: the photos suggested an alternation. Now: the left-hand limit is proved not to exist."],
      ["f, 12-", "+inf.", "—", "Undefined", "Infinite limit; vertical asymptote t = 12", "Before: ever larger values. Now: the limit is proved to be +infinity."]
    ]), [13, 15, 15, 15, 50, 72], { size: 7.4 });
    w.sub(t("Comparación de t = 6 y t = 8 (pregunta común)", "Comparing t = 6 and t = 8 (common question)"));
    w.paragraph(t(
      "En t = 6, en el registro g, los valores cercanos se acercan a 8 por los dos lados: el límite existe y solo falla el valor registrado, 12. Cambiar ese único valor por 8 hace continua a g, y eso es exactamente corregir el error de identificación. En t = 8 los valores se acercan a 10 por la izquierda y a 12 por la derecha: los límites laterales son distintos, así que no hay límite, y ningún valor en el punto (ni el 12 de f ni el 10 de g) puede eliminar el salto. Una respuesta completa razona con los dos lados y con el valor en el punto, no solo con los nombres «evitable» y «salto».",
      "At t = 6, in the record g, the nearby values approach 8 from both sides: the limit exists and only the recorded value, 12, fails. Changing that single value to 8 makes g continuous, and that is exactly what correcting the identification error means. At t = 8 the values approach 10 from the left and 12 from the right: the one-sided limits differ, so there is no limit, and no value at the point (neither f's 12 nor g's 10) can remove the jump. A complete answer argues from both sides and from the value at the point, not just from the names \"removable\" and \"jump\"."));
    w.sub(t("Oscilación en 10 (ampliación)", "Oscillation at 10 (extension)"));
    w.formula(A.formulas.osc1, 150, 0.24);
    w.formula(A.formulas.osc2, 160, 0.24);
    w.paragraph(t("Dos sucesiones que tienden a 10 por la izquierda dan valores con límites distintos (11 y 12), así que el límite por la izquierda no existe. Las fotos de la fase 1 están en los instantes s_n (cota 12) y 10 - 2/(4n+3) (cota 10): eran puntos de estas sucesiones, pero un número finito de ellos no lo demostraba.",
      "Two sequences tending to 10 from the left give values with different limits (11 and 12), so the left limit does not exist. The phase 1 photos are at the instants s_n (northing 12) and 10 - 2/(4n+3) (northing 10): they were points of these sequences, but finitely many of them did not prove it."));
    w.sub(t("Salto en 8 y discontinuidad evitable en 6", "Jump at 8 and removable discontinuity at 6"));
    w.formula(A.formulas.jump, 150, 0.24);
    w.formula(A.formulas.rem, 120, 0.24);
    w.sub(t("Límite infinito y túnel", "Infinite limit and tunnel"));
    w.formula(A.formulas.inf, 130, 0.24);
    w.paragraph(t("Túnel: con la sola hipótesis de continuidad, el TVI asegura un c en (3, 5) con f(c) = 6. Con el modelo, c = 4. Lo primero es una consecuencia de una hipótesis; lo segundo depende de suponer que dentro del túnel la cota sigue la recta t + 2.",
      "Tunnel: with only the continuity hypothesis, the IVT guarantees some c in (3, 5) with f(c) = 6. With the model, c = 4. The first is a consequence of a hypothesis; the second depends on assuming that inside the tunnel the northing follows the line t + 2."));
    w.heading(t("Pregunta individual de cierre", "Individual closing question"));
    w.paragraph(t(
      "«Falta el fotograma de un instante a. ¿Puedes concluir que f(a) no está definido, que no existe el límite en a o que f es discontinua en a?» Una respuesta suficiente rechaza las tres conclusiones si se apoyan solo en la ausencia. Una respuesta sólida distingue un valor físico desconocido de una función definida deliberadamente sin ese punto.",
      "\"The frame for an instant a is missing. Can you conclude that f(a) is undefined, that the limit at a does not exist, or that f is discontinuous at a?\" A satisfactory answer rejects all three conclusions when they rest only on the absence. A strong answer distinguishes an unknown physical value from a function deliberately defined without that point."));
  }

  function renderInventory(w, doc, cfg, A) {
    w.title(t("Inventario de fotografías y variantes", "Photograph and variant inventory"), kicker(cfg), true);
    const d = state.data;
    const shots = new Set(), blanks = new Set();
    d.slots.forEach((s) => TEAMS.forEach((tm) => { const e = s.teams[tm]; (e.car === "none" ? blanks : shots).add(`${e.camera}|${e.car}`); }));
    w.paragraph(t(
      `${d.slots.length} instantes, ${d.cameras.length} cámaras, ${shots.size} fotografías distintas y ${blanks.size} detección sin imagen. La columna «Coche» indica a quién pertenece la matrícula de la imagen: objetivo (${cfg.plate}), objetivo con la matrícula ilegible por un reflejo, confundible (${cfg.alt}) o sin imagen.`,
      `${d.slots.length} instants, ${d.cameras.length} cameras, ${shots.size} distinct photographs and ${blanks.size} detection without an image. The "Car" column says whose plate appears in the image: target (${cfg.plate}), target with the plate washed out by a reflection, look-alike (${cfg.alt}) or no image.`));
    const rows = [];
    d.slots.slice().sort((a, b) => a.t - b.t).forEach((s) => {
      const groups = {};
      TEAMS.forEach((tm) => { const e = s.teams[tm]; const k = `${e.camera}|${e.car}`; (groups[k] = groups[k] || { e, teams: [] }).teams.push(tm); });
      Object.values(groups).forEach(({ e, teams }) => {
        const cam = d.camera[e.camera];
        const car = e.car === "target" ? t("objetivo", "target") : e.car === "glare" ? t("objetivo, ilegible", "target, unreadable") : e.car === "alt" ? t("confundible", "look-alike") : t("sin imagen", "no image");
        rows.push([s.code, num(s.t, 4), DC.clockAt(cfg.start, s.t), cam.id, roadName(cam.road), num(cam.y, 3), car, teams.join("/"), e.car === "target" || e.car === "glare" ? num(DC.modelValue(d, s.t), 3) : "—"]);
      });
    });
    w.table([t("Prueba", "Exhibit"), "t", t("Hora", "Time"), t("Cámara", "Camera"), t("Vía", "Road"), t("Cota", "Northing"), t("Coche", "Car"), t("Equipos", "Teams"), "f(t)"], rows,
      [14, 14, 22, 14, 38, 15, 20, 15, 14], { size: 7, minRow: 5, zebra: true });
    w.paragraph(t("La columna f(t) solo se rellena cuando la fotografía muestra el coche buscado: coincide con la cota de la cámara y con el modelo M.",
      "The f(t) column is filled only when the photograph shows the wanted car: it matches the camera's northing and the model M."), { italic: true, size: 9 });
    w.paragraph(t(`Las pruebas F-01 a F-${String(CONSULTANT_LAST).padStart(2, "0")} llegan a los equipos ya pasadas a limpio en la hoja del consultor (hora, t, cámara, columna y cota); ninguna de ellas es una de las pruebas discutidas.`,
      `Exhibits F-01 to F-${String(CONSULTANT_LAST).padStart(2, "0")} reach the teams already written up on the consultant's worksheet (time, t, camera, column and northing); none of them is a disputed exhibit.`), { italic: true, size: 9 });
  }

  // ---------------------------------------------------------------- downloads (house standard)
  async function zip(files) {
    const z = new window.JSZip();
    files.forEach((f) => z.file(f.fileName, f.blob));
    return z.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }

  function showFiles(files, bundles, complete, sepZip, bunZip) {
    [...files, ...bundles, complete, sepZip, bunZip].forEach((f) => { f.url = URL.createObjectURL(f.blob); state.urls.push(f.url); });
    els.complete.href = complete.url;
    els.complete.download = complete.fileName;
    els.complete.classList.remove("cc-hidden");
    els.bundles.innerHTML = [bunZip, ...bundles].map((f, k) => fileRow(f, k === 0)).join("");
    els.doclist.innerHTML = fileRow(sepZip, true) + files.map((f) => fileRow(f, false, f.teacher ? `${f.label} · ${t("Profesorado", "Teacher only")}` : f.label)).join("");
    els.documents.classList.remove("cc-hidden");
    activateTab("delta-panel-bundles");
  }

  function fileRow(file, primary, title) {
    const label = esc(title || file.label);
    return `<div class="cc-file-row${primary ? " cc-primary" : ""}"><span class="cc-file-title">${label}</span><span class="cc-file-actions"><a class="cc-file-icon" href="${file.url}" target="_blank" rel="noopener" title="${t("Ver", "View")} ${label}" aria-label="${t("Ver", "View")} ${label}">${ICON_EYE}</a><a class="cc-file-icon" href="${file.url}" download="${esc(file.fileName)}" title="${t("Descargar", "Download")} ${label}" aria-label="${t("Descargar", "Download")} ${label}">${ICON_DOWN}</a></span></div>`;
  }
  const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
  const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke-width="2" stroke-linecap="round"/><path d="m7 10 5 5 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke-width="2" stroke-linecap="round"/></svg>';

  function clearFiles() {
    state.urls.forEach((u) => URL.revokeObjectURL(u));
    state.urls = [];
    els.bundles.innerHTML = ""; els.doclist.innerHTML = "";
    els.complete.classList.add("cc-hidden"); els.complete.removeAttribute("href"); els.complete.removeAttribute("download");
    els.documents.classList.add("cc-hidden");
    setStatus("");
  }

  function activateTab(id) {
    els.tabButtons.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.ccTabTarget === id)));
    els.tabPanels.forEach((p) => { p.hidden = p.id !== id; });
  }

  function setBusy(busy) { els.generate.disabled = busy; els.clear.disabled = busy; els.generate.textContent = busy ? t("Generando…", "Generating…") : t("Generar documentos", "Generate documents"); }
  function setStatus(msg, error) { els.status.textContent = msg; els.status.classList.toggle("cc-error", Boolean(error)); }
  function clean(v) { return String(v || "").trim().replace(/\s+/g, " "); }
  function stem(v) { return clean(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "documento"; }
  function esc(v) { return String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
  function formatDate(v) {
    const d = new Date(`${v}T12:00:00`);
    return new Intl.DateTimeFormat(LANG === "en" ? "en-GB" : "es-ES", { day: "numeric", month: "long", year: "numeric" }).format(d);
  }

  window.DeltaCityGenerator = { readConfig, prepareAssets: (cfg) => prepareAssets(cfg || readConfig()), DOCS, BUNDLES };
  init();
})();
