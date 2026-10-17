(function () {
  "use strict";

  const root = document.querySelector(".popcorn-case");
  if (!root) return;

  const isEnglish = (root.dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en");
  const t = (es, en) => isEnglish ? en : es;
  const LIMITS = { min: 50, max: 1000 };
  const scriptUrl = document.currentScript && document.currentScript.src;
  const assetUrl = (name) => scriptUrl ? new URL(name, scriptUrl).href : "";
  const visualUrls = {
    banner: assetUrl("header-brand.jpg"),
    advertisement: assetUrl(isEnglish ? "advertisement-en.png" : "advertisement-es.png")
  };
  const state = { urls: [], visuals: {} };
  const els = {};

  const PAPERS = {
    a5: [210, 148],
    a4: [297, 210],
    letter: [279.4, 215.9],
    legal: [355.6, 215.9],
    a3: [420, 297],
    tabloid: [431.8, 279.4],
    cardstock: [457.2, 304.8]
  };


  // The documents print on A4, or on US Letter when the box sheet is a US size.
  const US_SHEETS = ["letter", "legal", "tabloid", "cardstock"];

  /*
   * The class from its number of students (the teacher guide's split): the Consumer Association is
   * the largest team, between a half and two thirds of the class, in pairs (a trio when the number is
   * odd) that each build a prototype with its own cut; the cinema team is one small group that
   * builds the registered box; the police consultancy is a small team, in one or two groups of
   * consultants (two to four each) that model and issue the opinion independently.
   */
  const STUDENTS = { min: 9, max: 40, def: 24 };
  function classroom(students) {
    const n = Math.max(STUDENTS.min, Math.min(STUDENTS.max, Math.round(Number(students) || STUDENTS.def)));
    const cinema = Math.max(2, Math.min(6, Math.round(n * 0.17)));
    const police = Math.max(2, Math.min(8, Math.round(n * 0.2)));
    const association = n - cinema - police;
    const pairs = Math.max(1, Math.floor(association / 2));
    const policeGroups = Math.ceil(police / 4);
    const pg = Array.from({ length: policeGroups }, (_, k) => Math.floor(police / policeGroups) + (k < police % policeGroups ? 1 : 0));
    return { students: n, association, pairs, trio: association % 2 === 1 && association > 2, cinema, police, policeGroups, policeSizes: pg };
  }
  /** Suggested cuts for the Association's pairs: the first is the complaint's own prototype, the rest spread over the domain. */
  function suggestedCuts(d) {
    const k = d.room.pairs, alt = Math.round(d.x * 82) / 100;
    const unit = d.maxCut / (k + 1) >= 8 ? 5 : 1;
    const out = [alt];
    for (let i = 1; i <= k; i += 1) {
      const v = Math.round(d.maxCut * i / (k + 1) / unit) * unit;
      if (out.length < k && v > 0 && v < d.maxCut && out.every((u) => Math.abs(u - v) >= unit)) out.push(v);
    }
    return out.sort((a, b) => a - b);
  }

  /*
   * What each document is for, as the printing and distribution guide prints it: who receives it,
   * how many copies (exact, from the class), how to print it and when it is handed out. The
   * documents themselves carry no printing instructions (ESTANDAR_WEB_ACTIVIDADES.md, section 5).
   * The case follows the common format: launch at the end of a class (the presentation, the teams
   * and their packets), work at home, and a closing class in which the boxes are built and tested
   * and the opinion is issued; the complaint and the patent reach the police only at the
   * transition to phase 2, and the solution stays with the teacher.
   */
  const sides = (pages) => pages > 1 ? t("Doble cara", "Double-sided") : t("Una cara", "One side");
  const AT_LAUNCH = t("Lanzamiento, en su paquete", "Launch, in their packet");
  const BW = t("blanco y negro", "black and white");
  const DOCS = [
    { id: "guide", n: "", guide: true, teacher: true, title: t("Guía de impresión y reparto", "Printing and distribution guide"), description: t("Qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento.", "What to print, how, how many copies and when each document is handed out.") },
    { id: "slides", n: "00", slides: true, title: t("Presentación del caso", "Case presentation"), description: t("Diapositivas 16:9 que se proyectan en el lanzamiento y en la clase de cierre.", "16:9 slides projected at the launch and in the closing class."),
      count: () => 0,
      print: () => ({ who: t("Se proyecta en el lanzamiento y en la clase de cierre", "Projected at the launch and in the closing class"), copies: t("Ninguna (sin proyector, 1 por equipo: 3)", "None (without a projector, 1 per team: 3)"), how: t("Apaisada 16:9, en color", "Landscape 16:9, in colour"), when: t("Lanzamiento y clase de cierre", "Launch and closing class") }) },
    { id: "advert", n: "01", title: t("Campaña publicitaria de la empresa", "Company advertising campaign"), description: t("El anuncio que contiene la afirmación de capacidad máxima.", "The advertisement containing the maximum-capacity claim."),
      count: (d) => 1 + d.room.policeGroups,
      print: (d, p) => ({ who: t("Equipo del cine y consultoría policial", "Cinema team and police consultancy"), copies: t(`${1 + d.room.policeGroups} (1 para el cine y 1 por grupo de consultores)`, `${1 + d.room.policeGroups} (1 for the cinema and 1 per consultancy group)`), how: `${sides(p)}; ${t("en color (es un cartel)", "in colour (it is a poster)")}`, when: AT_LAUNCH }) },
    { id: "complaint", n: "02", title: t("Reclamación registrada ante la Oficina de Consumo", "Complaint filed with the Consumer Affairs Office"), description: t("Expediente de entrada con hechos, petición, mediciones y anexo de pruebas.", "Registered case file with facts, request, measurements, and evidence annex."),
      count: (d) => d.room.pairs + d.room.policeGroups,
      print: (d, p) => ({ who: t("Asociación de Consumidores; consultoría policial en la fase 2", "Consumer Association; police consultancy in phase 2"), copies: t(`${d.room.pairs + d.room.policeGroups} (1 por pareja de la Asociación y ${d.room.policeGroups} aparte para la policía)`, `${d.room.pairs + d.room.policeGroups} (1 per Association pair and ${d.room.policeGroups} separately for the police)`), how: `${sides(p)}; ${t("color opcional (sellos)", "colour optional (stamps)")}`, when: t("Asociación: lanzamiento. Policía: transición a la fase 2, no antes", "Association: launch. Police: transition to phase 2, not before") }) },
    { id: "patent", n: "03", title: t("Expediente de patente ficticia", "Fictional patent file"), description: t("Informe docente de la solución óptima, con memoria, reivindicaciones y plano de corte y plegado.", "Teaching report on the optimal solution, with specification, claims, and cut-and-fold plan."),
      count: (d) => 1 + d.room.policeGroups,
      print: (d, p) => ({ who: t("Equipo del cine; consultoría policial en la fase 2", "Cinema team; police consultancy in phase 2"), copies: t(`${1 + d.room.policeGroups} (1 para el cine y ${d.room.policeGroups} aparte para la policía)`, `${1 + d.room.policeGroups} (1 for the cinema and ${d.room.policeGroups} separately for the police)`), how: `${sides(p)}; ${t("color opcional (sellos)", "colour optional (stamps)")}`, when: t("Cine: lanzamiento. Policía: transición a la fase 2, no antes", "Cinema: launch. Police: transition to phase 2, not before") }) },
    { id: "measurement", n: "10", title: t("Dossier de la Asociación de Consumidores", "Consumer Association dossier"), description: t("Construcción de prototipos, tabla de volúmenes y preparación de la prueba empírica.", "Prototype construction, volume table, and preparation of the empirical test."),
      count: (d) => d.room.pairs,
      print: (d, p) => ({ who: t("Asociación de Consumidores", "Consumer Association"), copies: t(`${d.room.pairs} (1 por pareja)`, `${d.room.pairs} (1 per pair)`), how: `${sides(p)}; ${BW}`, when: AT_LAUNCH }) },
    { id: "investigation", n: "11", title: t("Dossier del equipo del cine", "Cinema team dossier"), description: t("Instrucciones de fabricación y control de calidad de las cajas óptimas.", "Instructions for building and quality-checking the optimal boxes."),
      count: () => 1,
      print: (d, p) => ({ who: t("Equipo del cine", "Cinema team"), copies: t("1 para el equipo", "1 for the team"), how: `${sides(p)}; ${BW}`, when: AT_LAUNCH }) },
    { id: "police", n: "12", title: t("Dossier de consultoría técnico-forense de la policía", "Police technical-forensic consultancy dossier"), description: t("Investigación matemática independiente y emisión del dictamen final sobre el posible fraude.", "Independent mathematical investigation and final opinion on the alleged fraud."),
      count: (d) => d.room.policeGroups,
      print: (d, p) => ({ who: t("Consultoría técnico-forense de la policía", "Police technical-forensic consultancy"), copies: t(`${d.room.policeGroups} (1 por grupo de consultores)`, `${d.room.policeGroups} (1 per consultancy group)`), how: `${sides(p)}; ${BW}`, when: AT_LAUNCH }) },
    { id: "template", n: "13", template: true, title: t("Plantilla óptima a tamaño real", "Full-size optimal template"), description: t("Página PDF del tamaño exacto de la hoja, con los recortes y los pliegues de la caja óptima.", "A PDF page matching the exact sheet size, with the cuts and folds of the optimal box."),
      count: () => 0,
      print: (d) => ({ who: t("Equipo del cine: una caja en cada copia", "Cinema team: one box on each copy"), copies: t(`${d.room.cinema} (1 por caja del cine), en las hojas de la caja`, `${d.room.cinema} (1 per cinema box), on the box sheets`), how: t(`En hojas de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm, al 100 %, sin «ajustar a la página»; una cara; en color si es posible`, `On ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheets, at 100%, without “fit to page”; one side; in colour if possible`), when: t("Clase de cierre, al empezar la fase 1", "Closing class, at the start of phase 1") }) },
    { id: "check", n: "20", title: t("Comprobación individual", "Individual check"), description: t("Cuatro preguntas para cada estudiante al final de la clase de cierre.", "Four questions for each student at the end of the closing class."),
      count: (d) => d.room.students,
      print: (d, p) => ({ who: t("Cada estudiante", "Every student"), copies: t(`${d.room.students} (1 por estudiante)`, `${d.room.students} (1 per student)`), how: `${sides(p)}; ${BW}`, when: t("Final de la clase de cierre (o en casa)", "End of the closing class (or at home)") }) },
    { id: "teacher", n: "90", teacher: true, title: t("Solución y guía del profesorado", "Teacher solution and guide"), description: t("Cálculo completo para el tamaño seleccionado, verificación y sugerencias didácticas.", "Full calculation for the selected size, verification, and teaching notes."),
      count: () => 0,
      print: (d, p) => ({ who: t("Solo para ti", "For you only"), copies: "1", how: `${sides(p)}; ${BW}`, when: t("Antes del lanzamiento; no circula", "Before the launch; it does not circulate") }) }
  ];
  const BUNDLES = [
    { id: "consumers", label: t("Asociación de Consumidores", "Consumer Association"), docs: ["complaint", "measurement"],
      use: (d) => t(`${d.room.pairs} copias, 1 por pareja de la Asociación, en el lanzamiento`, `${d.room.pairs} copies, 1 per Association pair, at the launch`) },
    { id: "cinema", label: t("Equipo del cine", "Cinema team"), docs: ["advert", "patent", "investigation"],
      use: () => t("1 copia, para el equipo del cine, en el lanzamiento", "1 copy, for the cinema team, at the launch") },
    { id: "police", label: t("Consultoría técnico-forense de la policía", "Police technical-forensic consultancy"), docs: ["advert", "police"],
      use: (d) => t(`${d.room.policeGroups} ${d.room.policeGroups > 1 ? "copias" : "copia"}, 1 por grupo de consultores, en el lanzamiento; la reclamación (02) y la patente (03) de la fase 2 no van aquí`, `${d.room.policeGroups} ${d.room.policeGroups > 1 ? "copies" : "copy"}, 1 per consultancy group, at the launch; the complaint (02) and the patent (03) of phase 2 are not included`) },
    { id: "phase2", label: t("Policía · transición a la fase 2", "Police · transition to phase 2"), docs: ["complaint", "patent"],
      use: (d) => t(`${d.room.policeGroups} ${d.room.policeGroups > 1 ? "copias" : "copia"}, 1 por grupo de consultores, guardadas hasta la transición`, `${d.room.policeGroups} ${d.room.policeGroups > 1 ? "copies" : "copy"}, 1 per consultancy group, kept until the transition`) },
    { id: "teacher", label: t("Paquete del profesorado", "Teacher packet"), docs: ["guide", "advert", "complaint", "patent", "measurement", "investigation", "police", "check", "teacher"],
      use: () => t("1, para ti; no circula", "1, for you; it does not circulate") }
  ];

  function init() {
    Object.assign(els, {
      form: document.getElementById("popcorn-form"),
      paper: document.getElementById("paper-size"),
      length: document.getElementById("paper-length"),
      width: document.getElementById("paper-width"),
      company: document.getElementById("company-name"),
      course: document.getElementById("course-name"),
      students: document.getElementById("popcorn-students"),
      teams: document.getElementById("popcorn-teams"),
      project: document.getElementById("popcorn-project"),
      status: document.getElementById("popcorn-status"),
      summary: document.getElementById("popcorn-summary"),
      preview: document.getElementById("popcorn-preview"),
      documents: document.getElementById("popcorn-documents"),
      docList: document.getElementById("popcorn-doc-list"),
      bundles: document.getElementById("popcorn-bundles"),
      completePdf: document.getElementById("popcorn-complete-pdf"),
      printGuide: document.getElementById("popcorn-printguide"),
      tabButtons: Array.from(document.querySelectorAll("[data-cc-tab-target]")),
      tabPanels: Array.from(document.querySelectorAll(".cc-tab-panel")),
      generate: document.getElementById("popcorn-generate"),
      clear: document.getElementById("popcorn-clear")
    });

    els.paper.addEventListener("change", applyPreset);
    [els.length, els.width, els.company, els.course, els.students].filter(Boolean).forEach((el) => {
      el.addEventListener("input", updateLive);
      el.addEventListener("change", updateLive);
    });
    els.form.addEventListener("submit", generate);
    els.clear.addEventListener("click", clearFiles);
    if (els.project) els.project.addEventListener("click", project);
    if (window.CCWizard) window.CCWizard.init(els.form);
    els.tabButtons.forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.ccTabTarget)));
    applyPreset();
  }

  function applyPreset() {
    const custom = els.paper.value === "custom";
    els.length.disabled = !custom;
    els.width.disabled = !custom;
    if (!custom && PAPERS[els.paper.value]) {
      [els.length.value, els.width.value] = PAPERS[els.paper.value];
    }
    updateLive();
  }

  function updateLive() {
    try {
      const data = readData(false);
      showSummary(data);
      showTeams(data);
      drawPreview(data);
      setStatus("");
    } catch (error) {
      els.summary.innerHTML = "";
      els.preview.innerHTML = `<p class="cc-error">${escapeHtml(error.message)}</p>`;
      setStatus(error.message, true);
    }
  }

  function readData(strict) {
    const L = Number(els.length.value);
    const W = Number(els.width.value);
    const company = clean(els.company.value) || t("Cines Horizonte", "Horizon Cinemas");
    const course = clean(els.course.value) || t("Cálculo diferencial", "Differential Calculus");
    if (!Number.isFinite(L) || !Number.isFinite(W)) throw new Error(t("Introduce dos medidas válidas.", "Enter two valid dimensions."));
    if (L < LIMITS.min || W < LIMITS.min || L > LIMITS.max || W > LIMITS.max) {
      throw new Error(t(`Cada lado debe medir entre ${LIMITS.min} y ${LIMITS.max} mm.`, `Each side must measure between ${LIMITS.min} and ${LIMITS.max} mm.`));
    }
    if (strict && (!company || !course)) throw new Error(t("Completa los datos del caso.", "Complete the case details."));
    const disc = Math.sqrt(L * L - L * W + W * W);
    const x = (L + W - disc) / 6;
    const otherRoot = (L + W + disc) / 6;
    const baseL = L - 2 * x;
    const baseW = W - 2 * x;
    const volume = x * baseL * baseW;
    const maxCut = Math.min(L, W) / 2;
    const preset = els.paper.value;
    const room = classroom(els.students ? els.students.value : STUDENTS.def);
    const d = { L, W, company, course, disc, x, otherRoot, baseL, baseW, volume, maxCut, room, paper: els.paper.options[els.paper.selectedIndex].text, preset, format: US_SHEETS.includes(preset) ? "letter" : "a4" };
    d.cuts = suggestedCuts(d);
    return d;
  }

  /** The teams of this class, under the number of students (step 1 of the configurator). */
  function teamRows(d) {
    const r = d.room;
    const pairs = r.trio ? t(`${r.pairs} grupos: ${r.pairs - 1} parejas y un trío`, `${r.pairs} groups: ${r.pairs - 1} pairs and a trio`) : t(`${r.pairs} parejas`, `${r.pairs} pairs`);
    return [
      [t("Asociación de Consumidores", "Consumer Association"), r.association, pairs, t("Cada pareja construye un prototipo con su propio corte.", "Each pair builds a prototype with its own cut.")],
      [t("Equipo del cine", "Cinema team"), r.cinema, t("1 equipo", "1 team"), t(`Fabrica ${r.cinema} copias de la caja registrada.`, `Builds ${r.cinema} copies of the registered box.`)],
      [t("Consultoría técnico-forense", "Technical-forensic consultancy"), r.police, r.policeGroups > 1 ? t(`${r.policeGroups} grupos (${r.policeSizes.join(" y ")})`, `${r.policeGroups} groups (${r.policeSizes.join(" and ")})`) : t("1 grupo", "1 group"), r.policeGroups > 1 ? t("Dos dictámenes independientes.", "Two independent opinions.") : t("Modela, demuestra y dictamina.", "Models, proves and gives the opinion.")]
    ];
  }
  function showTeams(d) {
    if (!els.teams) return;
    els.teams.innerHTML = `<table class="cc-groups"><thead><tr><th>${t("Equipo", "Team")}</th><th>${t("Estudiantes", "Students")}</th><th>${t("Grupos", "Groups")}</th></tr></thead><tbody>`
      + teamRows(d).map(([team, n, groups, what]) => `<tr><td><strong>${escapeHtml(team)}</strong><span class="cc-help" style="display:block;margin:2px 0 0">${escapeHtml(what)}</span></td><td>${n}</td><td>${escapeHtml(groups)}</td></tr>`).join("")
      + `</tbody></table>`;
  }

  function showSummary(d) {
    const rows = [
      [t("Papel", "Sheet"), `${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm`],
      [t("Corte óptimo", "Optimal cut"), `${fmt(d.x, 2)} mm`],
      [t("Base de la caja", "Box base"), `${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm`],
      [t("Altura", "Height"), `${fmt(d.x, 2)} mm`],
      [t("Volumen máximo", "Maximum volume"), `${fmt(d.volume / 1000, 2)} mL`],
      [t("Dominio físico", "Physical domain"), `0 < x < ${fmt(d.maxCut, 2)} mm`]
    ];
    const r = d.room;
    const classRows = [
      [t("Estudiantes", "Students"), String(r.students)],
      [t("Equipos", "Teams"), t(`Asociación ${r.association} · cine ${r.cinema} · policía ${r.police}`, `Association ${r.association} · cinema ${r.cinema} · police ${r.police}`)]
    ];
    const li = ([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`;
    els.summary.innerHTML = classRows.map(li).join("") + `<li class="cc-help"><em>${t("Cifras de la solución · no proyectar", "Solution figures · do not project")}</em></li>` + rows.map(li).join("");
  }

  function drawPreview(d) {
    const vbW = 600;
    const vbH = Math.max(220, vbW * d.W / d.L);
    const pad = 28;
    const scale = Math.min((vbW - 2 * pad) / d.L, (vbH - 2 * pad) / d.W);
    const sw = d.L * scale;
    const sh = d.W * scale;
    const ox = (vbW - sw) / 2;
    const oy = (vbH - sh) / 2;
    const c = d.x * scale;
    const corners = [[ox, oy], [ox + sw - c, oy], [ox, oy + sh - c], [ox + sw - c, oy + sh - c]];
    const cornerRects = corners.map(([x, y]) => `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="#f7c66a" opacity=".55"/><path d="M${x + 5},${y + 5} L${x + c - 5},${y + c - 5} M${x + c - 5},${y + 5} L${x + 5},${y + c - 5}" stroke="#e77924" stroke-width="3"/>`).join("");
    els.preview.innerHTML = `<svg viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="${t("Plantilla de la caja óptima", "Optimal box template")}">
      <rect x="${ox}" y="${oy}" width="${sw}" height="${sh}" fill="#fffaf0" stroke="#202a3d" stroke-width="4"/>
      ${cornerRects}
      <path d="M${ox + c},${oy} V${oy + sh} M${ox + sw - c},${oy} V${oy + sh} M${ox},${oy + c} H${ox + sw} M${ox},${oy + sh - c} H${ox + sw}" fill="none" stroke="#1385ae" stroke-width="3" stroke-dasharray="10 7"/>
      <text x="${vbW / 2}" y="${oy + sh / 2}" text-anchor="middle" dominant-baseline="central" fill="#202a3d" font-size="18" font-family="system-ui">${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} mm</text>
      <text x="${ox + c / 2}" y="${oy + c / 2}" text-anchor="middle" dominant-baseline="central" fill="#9e4815" font-size="14" font-family="system-ui">x</text>
    </svg>`;
  }


  async function generate(event) {
    event.preventDefault();
    setBusy(true);
    clearFiles();
    try {
      assertLibraries();
      const data = readData(true);
      showSummary(data);
      drawPreview(data);
      setStatus(t("Generando documentos…", "Generating documents…"));
      await loadVisualAssets();

      const { files, bundles, complete, guide } = buildAll(data);
      // the printing and distribution guide and the presentation travel in both ZIPs
      const slides = files.find((file) => file.id === "slides");
      const [separateZip, bundleZip] = await Promise.all([buildZip(files), buildZip([guide, slides, ...bundles].filter(Boolean))]);
      const separateZipFile = { id: "separate-zip", label: t("Todos los documentos separados · ZIP", "All separate documents · ZIP"), fileName: `${stem(data.company)}_${t("documentos_separados", "separate_documents")}.zip`, blob: separateZip };
      const bundleZipFile = { id: "bundle-zip", label: t("Todos los paquetes por rol · ZIP", "All role packets · ZIP"), fileName: `${stem(data.company)}_${t("paquetes_por_rol", "role_packets")}.zip`, blob: bundleZip };
      showFiles(files, bundles, complete, guide, separateZipFile, bundleZipFile);
      setStatus(t(`Listo: ${files.length} documentos (con la guía de impresión y reparto y la presentación), los paquetes de los 3 equipos, el de la fase 2, el paquete docente y el expediente completo.`, `Done: ${files.length} documents (including the printing and distribution guide and the presentation), all 3 team packets, the phase 2 packet, the teacher packet, and the complete case file.`));
    } catch (error) {
      console.error(error);
      setStatus(error.message || t("No se han podido generar los documentos.", "The documents could not be generated."), true);
    } finally {
      setBusy(false);
    }
  }

  function assertLibraries() {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error(t("No se ha cargado jsPDF. Revisa la conexión.", "jsPDF did not load. Check the connection."));
    if (!window.JSZip) throw new Error(t("No se ha cargado JSZip. Revisa la conexión.", "JSZip did not load. Check the connection."));
    if (!window.CCSlides || !window.CCPdf) throw new Error(t("No se ha cargado el módulo de diapositivas. Revisa la conexión.", "The slides module did not load. Check the connection."));
  }

  /** "Proyectar la presentación": the same slides as document 00, in the shared projector. */
  async function project() {
    try {
      els.project.disabled = true;
      const data = readData(true);
      await loadVisualAssets();
      window.CCProjector.open(window.CCSlides.html(slidesFor(data), slideEnv(data)), { lang: isEnglish ? "en" : "es" });
    } catch (error) {
      console.error(error);
      setStatus(error.message || t("No se ha podido abrir la presentación.", "The presentation could not be opened."), true);
    } finally { els.project.disabled = false; }
  }

  async function loadVisualAssets() {
    if (Object.keys(state.visuals).length === Object.keys(visualUrls).length) return;
    const entries = await Promise.all(Object.entries(visualUrls).map(async ([key, url]) => {
      if (!url) throw new Error(t("Falta la ruta de un recurso visual.", "A visual asset path is missing."));
      const response = await fetch(url);
      if (!response.ok) throw new Error(t(`No se ha podido cargar el recurso visual «${key}».`, `The “${key}” visual asset could not be loaded.`));
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(t(`No se ha podido preparar el recurso visual «${key}».`, `The “${key}” visual asset could not be prepared.`)));
        reader.readAsDataURL(blob);
      });
      return [key, dataUrl];
    }));
    state.visuals = Object.fromEntries(entries);
  }

  // ------------------------------------------------------------------ building the files
  function newDoc(d) { return new window.jspdf.jsPDF({ unit: "mm", format: d.format, orientation: "portrait", compress: true }); }
  function specOf(id) { return DOCS.find((item) => item.id === id); }
  function fileNameFor(spec, d) {
    if (spec.guide) return t("LEEME_guia_de_impresion_y_reparto.pdf", "README_printing_and_distribution_guide.pdf");
    if (spec.template) return `${spec.n}_${t("plantilla_optima", "optimal_template")}_${dimsStem(d)}.pdf`;
    return `${spec.n}_${stem(spec.title)}_${dimsStem(d)}.pdf`;
  }

  /** Every PDF of one generation: the documents, the printing guide, the role packets and the complete file. */
  function buildAll(data) {
    const files = DOCS.filter((spec) => !spec.guide).map((spec) => spec.template ? buildTemplateFile(spec, data) : spec.slides ? buildSlidesFile(spec, data) : buildDocumentFile(spec, data));
    // the printing guide lists the pages of every document and packet, its own included
    const pages = Object.fromEntries(files.map((file) => [file.id, file.pages]));
    const guideSpec = specOf("guide");
    pages.guide = 2;
    let guide = buildDocumentFile(guideSpec, data, pages);
    for (let pass = 0; pass < 3 && guide.pages !== pages.guide; pass += 1) {
      pages.guide = guide.pages;
      guide = buildDocumentFile(guideSpec, data, pages);
    }
    const bundles = BUNDLES.map((bundle) => buildPacket(bundle, data, pages));
    const complete = buildPacket({ id: "complete", label: t("Expediente completo", "Complete case file"), docs: DOCS.filter((spec) => !spec.template && !spec.slides).map((spec) => spec.id) }, data, pages);
    return { files: [guide, ...files], bundles, complete, guide };
  }

  // ------------------------------------------------------------------ the presentation (document 00)
  /*
   * The slides the teacher projects at the launch (the advertisement, the complaint, the question,
   * the teams of this class and the plan) and in the closing class (the transfer test and the
   * opinion). Drawn by the shared kit (cc-slides.js) as 16:9 pages, and opened as HTML in the
   * shared projector, so what is projected is what is printed.
   */
  function slideEnv(d) {
    const env = { t, kicker: kicker(d), banner: state.visuals.banner ? { data: state.visuals.banner, ratio: BANNER_RATIO } : null };
    return env;
  }
  function slidesFor(d) {
    const r = d.room;
    const sheet = `${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm`;
    const advert = state.visuals.advertisement ? { data: state.visuals.advertisement, ratio: state.advertRatio || 1.5, png: true } : null;
    const rows = teamRows(d);
    return [
      { banner: true, title: t("La caja de palomitas", "The Popcorn Box"), subtitle: t("Un anuncio, una denuncia por fraude y una hoja de cartón", "An advertisement, a fraud complaint and one sheet of card") },
      { title: t("El anuncio", "The advertisement"), image: advert,
        quote: t("«La caja de mayor capacidad: más palomitas con el mismo cartón».", "“The greatest-capacity box: more popcorn from the same cardstock.”"),
        text: [t(`${d.company} lanza su nueva caja de palomitas. Cada caja se fabrica con una sola hoja de ${sheet}, sin añadir material.`, `${d.company} is launching its new popcorn box. Each box is made from a single ${sheet} sheet, with no added material.`),
          t("Según la campaña, ninguna otra caja hecha con esa hoja admite más palomitas.", "According to the campaign, no other box made from that sheet holds more popcorn.")] },
      { title: t("La denuncia", "The complaint"),
        text: [t("La Asociación de Personas Consumidoras sostiene que la caja anunciada **no** es la de mayor capacidad: dice haber construido, con la misma hoja, otra en la que caben más palomitas.", "The Consumer Association claims that the advertised box is **not** the one with the greatest capacity: it says it has built another box, from the same sheet, that holds more popcorn."),
          t("La campaña ha llegado a cientos o miles de clientes, así que denuncia un posible **fraude a gran escala**. La policía abre una investigación y encarga un dictamen técnico independiente.", "The campaign has reached hundreds or thousands of customers, so it alleges possible **large-scale fraud**. The police open an investigation and commission an independent technical opinion.")] },
      { title: t("La pregunta", "The question"), image: ruleImage(d),
        bullets: t([
          `**La regla:** una hoja de ${sheet}. En cada esquina se recorta un cuadrado de lado $x$, los cuatro iguales, y se pliegan las cuatro paredes: una caja abierta, sin añadir material.`,
          "¿Qué corte da la caja de **mayor volumen**? ¿Es la caja del cine?",
          "¿Permite la evidencia concluir que hubo **fraude**?"
        ], [
          `**The rule:** one ${sheet} sheet. A square of side $x$ is cut from each corner, all four equal, and the four walls are folded up: an open box, with no added material.`,
          "Which cut gives the box of **greatest volume**? Is it the cinema's box?",
          "Does the evidence establish that there was **fraud**?"
        ]) },
      { title: t("El encargo del inspector jefe", "The Chief Inspector's brief"),
        quote: t("El consultor había rodeado una palabra del anuncio: *mayor*. Al margen había escrito: «¿Entre qué diseños, y medida de qué manera?».", "The consultant had circled one word in the advertisement: *greatest*. In the margin he had written: “Among which designs, and measured how?”"),
        text: [t("«Construid las cajas. Calculad la respuesta por vuestra cuenta. Y después decidid qué parte de la reclamación resiste la comparación».", "“Build the boxes. Work out the answer on your own. Then decide which parts of the complaint survive the comparison.”"),
          t("El dictamen lo emite la consultoría, y tiene que convencer a quien no estuvo en la sala: con un modelo, con mediciones y con lo que cada cosa demuestra.", "The consultancy issues the opinion, and it has to convince someone who was not in the room: with a model, with measurements, and with what each of them proves.")] },
      { title: t(`Tres equipos · ${r.students} estudiantes`, `Three teams · ${r.students} students`),
        table: { head: [t("Equipo", "Team"), t("Qué hace", "What it does"), t("Estudiantes", "Students")], rows: [
          [rows[0][0], t("Construye prototipos con cortes distintos, los mide y sostiene la acusación.", "Builds prototypes with different cuts, measures them and makes the allegation."), `${r.association} · ${rows[0][2]}`],
          [rows[1][0], t("Fabrica varias copias de la caja registrada y controla sus medidas.", "Builds several copies of the registered box and checks their dimensions."), `${r.cinema} · ${rows[1][2]}`],
          [rows[2][0], t("Modela, deriva, demuestra el máximo y emite el dictamen.", "Models, differentiates, proves the maximum and issues the opinion."), `${r.police} · ${rows[2][2]}`]
        ], widths: [52, 96, 42] },
        note: t("Cada equipo trabaja solo con su dosier: no lo enseñéis a los otros. La consultoría no ve la patente ni la reclamación hasta la fase 2.", "Each team works only with its own dossier: do not show it to the others. The consultancy sees neither the patent nor the complaint until phase 2.") },
      { title: t("El plan", "The plan"),
        table: { head: [t("Cuándo", "When"), t("Qué se hace", "What happens")], rows: t([
          ["Hoy", "Los equipos y sus dosieres. Cada pareja de la Asociación elige su corte $x$."],
          ["En casa", "Consultoría: el modelo $V(x)$, su dominio y el máximo, sin ver la patente. Asociación: el volumen de su caja con su $x$. Cine: las instrucciones de fabricación."],
          ["Fase 1 · 25 min", "Clase de cierre: se construyen y se miden las cajas; la consultoría cierra su demostración."],
          ["Fase 2 · 18 min", "La consultoría recibe la reclamación y la patente; la prueba de las palomitas."],
          ["Cierre · 17 min", "La consultoría presenta su dictamen (12 min); después, una comprobación individual (5 min)."]
        ], [
          ["Today", "The teams and their dossiers. Each Association pair chooses its cut $x$."],
          ["At home", "Consultancy: the model $V(x)$, its domain and the maximum, without seeing the patent. Association: the volume of its box for its $x$. Cinema: the building instructions."],
          ["Phase 1 · 25 min", "Closing class: the boxes are built and measured; the consultancy completes its proof."],
          ["Phase 2 · 18 min", "The consultancy receives the complaint and the patent; the popcorn test."],
          ["Close · 17 min", "The consultancy presents its opinion (12 min); then, an individual check (5 min)."]
        ]), widths: [40, 150] } },
      { title: t("Para la clase de cierre", "For the closing class"),
        bullets: t([
          "**Asociación:** vuestro corte $x$ y el volumen que predice; regla, lápiz y tijeras.",
          "**Cine:** las medidas nominales de la caja registrada; regla, tijeras y cinta adhesiva.",
          "**Consultoría:** el modelo, la derivada y la demostración del máximo, por escrito y sin consultar la patente.",
          `Todas las cajas se hacen con hojas de ${sheet}, del mismo papel. Las palomitas las pone la unidad.`
        ], [
          "**Association:** your cut $x$ and the volume it predicts; ruler, pencil and scissors.",
          "**Cinema:** the nominal dimensions of the registered box; ruler, scissors and tape.",
          "**Consultancy:** the model, the derivative and the proof of the maximum, in writing and without looking at the patent.",
          `Every box is made from ${sheet} sheets of the same paper. The unit provides the popcorn.`
        ]) },
      { title: t("Fase 2 · La prueba de las palomitas", "Phase 2 · The popcorn test"),
        bullets: t([
          "La Asociación llena cada prototipo con tantas palomitas como pueda, y anota cómo lo ha hecho.",
          "Todo ese contenido se vuelca en una caja del cine, sin añadir ni quitar nada.",
          "¿Llena la caja del cine? ¿Sobra o falta? La consultoría lo registra todo, también lo que pueda falsear la prueba.",
          "La consultoría recibe ahora la reclamación y la patente, y las contrasta con lo que ve."
        ], [
          "The Association fills each prototype with as much popcorn as it can, and records how.",
          "All of it is poured into a cinema box, without adding or removing any.",
          "Does it fill the cinema box? Is there room left, or too much? The consultancy records everything, including whatever might distort the test.",
          "The consultancy now receives the complaint and the patent, and checks them against what it sees."
        ]) },
      { title: t("El dictamen", "The opinion"),
        bullets: t([
          "**Fraude acreditado**, **fraude no acreditado** o **evidencia insuficiente**: uno de los tres, y motivado.",
          "Separad la evidencia matemática (el modelo y su máximo), la empírica (las cajas y las palomitas) y los posibles errores de fabricación o de llenado.",
          "Decid si la afirmación del anuncio es verdadera dentro del modelo y qué valen las mediciones de la reclamación."
        ], [
          "**Fraud established**, **fraud not established** or **insufficient evidence**: one of the three, with reasons.",
          "Keep apart the mathematical evidence (the model and its maximum), the empirical evidence (the boxes and the popcorn) and possible errors of construction or filling.",
          "Say whether the advertisement's claim is true within the model, and what the complaint's measurements are worth."
        ]),
        note: t("Una acusación grave y muchos posibles afectados no sustituyen a la prueba.", "A serious allegation and many potential victims are no substitute for evidence.") }
    ];
  }
  /** The construction rule as a picture (a generic cut, not the optimum): the sheet, the four squares and the folds. */
  function ruleImage(d) {
    if (typeof document === "undefined") return null;
    const W0 = 900, pad = 70, s = (W0 - 2 * pad) / d.L, w = d.L * s, h = d.W * s, H0 = Math.round(h + 2 * pad);
    const cv = document.createElement("canvas");
    cv.width = W0; cv.height = H0;
    const g = cv.getContext("2d");
    if (!g) return null;
    const c = Math.min(d.L, d.W) * 0.17 * s, x0 = pad, y0 = pad;
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, W0, H0);
    g.fillStyle = "#fffaf0"; g.strokeStyle = "#202a3d"; g.lineWidth = 4; g.fillRect(x0, y0, w, h); g.strokeRect(x0, y0, w, h);
    [[x0, y0], [x0 + w - c, y0], [x0, y0 + h - c], [x0 + w - c, y0 + h - c]].forEach(([cx, cy]) => {
      g.fillStyle = "rgba(247, 198, 106, .55)"; g.fillRect(cx, cy, c, c);
      g.strokeStyle = "#c46018"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 8, cy + 8); g.lineTo(cx + c - 8, cy + c - 8); g.moveTo(cx + c - 8, cy + 8); g.lineTo(cx + 8, cy + c - 8); g.stroke();
    });
    g.strokeStyle = "#1385ae"; g.lineWidth = 3; g.setLineDash([16, 10]); g.beginPath();
    g.moveTo(x0 + c, y0); g.lineTo(x0 + c, y0 + h); g.moveTo(x0 + w - c, y0); g.lineTo(x0 + w - c, y0 + h);
    g.moveTo(x0, y0 + c); g.lineTo(x0 + w, y0 + c); g.moveTo(x0, y0 + h - c); g.lineTo(x0 + w, y0 + h - c); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#202a3d"; g.font = "italic 40px Georgia, 'Times New Roman', serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("x", x0 + c / 2, y0 - 26); g.fillText("x", x0 - 26, y0 + c / 2);
    g.font = "34px Helvetica, Arial, sans-serif";
    g.fillText(`${fmt(d.L, 1)} mm`, x0 + w / 2, y0 + h + 36);
    g.save(); g.translate(x0 + w + 36, y0 + h / 2); g.rotate(-Math.PI / 2); g.fillText(`${fmt(d.W, 1)} mm`, 0, 0); g.restore();
    g.font = "32px Helvetica, Arial, sans-serif"; g.fillStyle = "#5d6570";
    g.fillText(t("base", "base"), x0 + w / 2, y0 + h / 2);
    return { data: cv.toDataURL("image/png"), ratio: H0 / W0, png: true };
  }
  function buildSlidesFile(spec, d) {
    const doc = window.CCPdf.newDoc(window.CCSlides.SLIDE, "landscape");
    if (state.visuals.advertisement && !state.advertRatio) {
      const p = doc.getImageProperties(state.visuals.advertisement);
      state.advertRatio = p.height / p.width;
    }
    window.CCSlides.pdf(doc, slidesFor(d), slideEnv(d));
    return { id: spec.id, label: spec.title, description: spec.description, fileName: `${spec.n}_${stem(spec.title)}_${dimsStem(d)}.pdf`, pages: doc.getNumberOfPages(), blob: doc.output("blob") };
  }

  function buildDocumentFile(spec, data, pages) {
    const doc = newDoc(data);
    renderDocument(doc, spec, data, pages);
    footer(doc, spec.title);
    return { id: spec.id, label: spec.title, teacher: spec.teacher, description: spec.description, fileName: fileNameFor(spec, data), pages: doc.getNumberOfPages(), blob: doc.output("blob") };
  }

  function buildPacket(bundle, data, pages) {
    const doc = newDoc(data);
    bundle.docs.forEach((id, index) => {
      if (index) doc.addPage(data.format, "portrait");
      renderDocument(doc, specOf(id), data, pages);
    });
    footer(doc, bundle.label);
    return { id: bundle.id, label: bundle.label, fileName: `${stem(bundle.label)}_${dimsStem(data)}.pdf`, pages: doc.getNumberOfPages(), blob: doc.output("blob") };
  }

  /**
   * The full-size template: one page the exact size of the sheet, in portrait (the drawing is
   * symmetric), with the cuts, the folds, the measurements, the colour legend and a reference
   * segment. How to print it is in the printing and distribution guide.
   */
  function buildTemplateFile(spec, d) {
    const pw = Math.min(d.L, d.W);
    const ph = Math.max(d.L, d.W);
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: [pw, ph], orientation: "portrait", compress: true });
    const c = d.x;
    doc.setDrawColor(32, 42, 61).setLineWidth(.45).rect(.5, .5, pw - 1, ph - 1);
    doc.setDrawColor(19, 133, 174).setLineDashPattern([3, 2], 0).setLineWidth(.35);
    doc.line(c, 0, c, ph); doc.line(pw - c, 0, pw - c, ph);
    doc.line(0, c, pw, c); doc.line(0, ph - c, pw, ph - c);
    doc.setLineDashPattern([], 0).setDrawColor(231, 121, 36).setLineWidth(.6);
    [[0, 0], [pw - c, 0], [0, ph - c], [pw - c, ph - c]].forEach(([x, y]) => {
      doc.line(x, y, x + c, y + c); doc.line(x + c, y, x, y + c);
    });
    // in the base of the box: name, measurements, legend and a measured reference segment
    const room = pw - 2 * c - 8;
    let big = Math.min(24, Math.max(12, pw / 11));
    let small = Math.min(14, Math.max(9.5, pw / 19));
    const rows = [
      { size: () => big, bold: true, text: t("PLANTILLA ÓPTIMA", "OPTIMAL TEMPLATE"), color: [32, 42, 61] },
      { size: () => small, text: `${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm · x = ${fmt(d.x, 2)} mm`, color: [32, 42, 61] },
      { size: () => small, text: t("Naranja: recortar las esquinas", "Orange: remove the corners"), color: [196, 96, 24] },
      { size: () => small, text: t("Azul discontinuo: plegar", "Dashed blue: fold"), color: [19, 112, 150] }
    ];
    const widest = Math.max(...rows.map((r) => doc.setFont("helvetica", r.bold ? "bold" : "normal").setFontSize(r.size()).getTextWidth(r.text)));
    if (widest > room) { const k = room / widest; big *= k; small *= k; }   // only for very small sheets
    const ref = [100, 50, 20, 10].find((len) => len <= room * 0.85) || 0;
    const step = (size) => size * 0.3528 * 1.45;
    const blockH = rows.reduce((s, r) => s + step(r.size()), 0) + (ref ? 12 : 0);
    let y = ph / 2 - blockH / 2;
    rows.forEach((r) => {
      y += step(r.size());
      doc.setFont("helvetica", r.bold ? "bold" : "normal").setFontSize(r.size()).setTextColor(...r.color).text(r.text, pw / 2, y - 1, { align: "center" });
    });
    if (ref) {
      const x0 = pw / 2 - ref / 2, yb = y + 5;
      doc.setDrawColor(32, 42, 61).setLineWidth(.3).line(x0, yb, x0 + ref, yb);
      for (let k = 0; k <= ref; k += 10) doc.line(x0 + k, yb - (k % 50 === 0 || k === ref ? 2.2 : 1.2), x0 + k, yb);
      doc.setFont("helvetica", "normal").setFontSize(small).setTextColor(32, 42, 61).text(`${ref} mm`, pw / 2, yb + 1.2 + small * 0.3528 * 1.1, { align: "center" });
    }
    return { id: spec.id, label: spec.title, description: spec.description, fileName: fileNameFor(spec, d), pages: 1, blob: doc.output("blob") };
  }

  function renderDocument(doc, spec, data, pages) {
    if (spec.guide) renderPrintGuide(doc, data, pages || {});
    else if (spec.id === "advert" && state.visuals.advertisement) renderAdvert(doc);
    else if (spec.id === "patent") renderPatentDocument(doc, data);
    else if (spec.id === "complaint") renderComplaintDocument(doc, data);
    else renderStandardDocument(doc, spec, data);
  }

  /** The poster, as large as the page allows above the footer band. */
  function renderAdvert(doc) {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const img = doc.getImageProperties(state.visuals.advertisement);
    const ratio = img.height / img.width;
    let w = pw - 12;
    let h = w * ratio;
    if (h > ph - 20) { h = ph - 20; w = h / ratio; }
    doc.addImage(state.visuals.advertisement, "PNG", (pw - w) / 2, 6, w, h, "advert", "FAST");
  }

  /**
   * Two passes: a dry run on a scratch document finds the room that answer spaces leave at the foot
   * of a page when other content follows them on that page; the real pass gives them that room.
   */
  function renderStandardDocument(doc, spec, data) {
    const plan = layoutStandard(newDoc(data), spec, data, null);
    layoutStandard(doc, spec, data, plan);
  }

  function layoutStandard(doc, spec, data, plan) {
    const writer = createWriter(doc, data, plan);
    writer.title(spec.title, kicker(data), spec.teacher);
    if (spec.id === "check") writer.meta([[t("Nombre", "Name"), "_".repeat(58)]]);
    else writer.meta([
      [t("Empresa", "Company"), data.company],
      [t("Papel", "Sheet"), `${fmt(data.L, 1)} × ${fmt(data.W, 1)} mm`],
      [t("Curso", "Course"), data.course]
    ]);
    contentFor(spec.id, data).forEach((section) => writer.section(section, data));
    return writer.finish();
  }

  // ------------------------------------------------------------------ fictional office documents
  /*
   * The complaint and the patent imitate offices inside the story: their own navy header band,
   * fields and stamps, in the house palette and with the house sizes (ESTANDAR_WEB_ACTIVIDADES.md,
   * 4.1). They are laid out as a flow of rows whose heights come from their content, so they take
   * as many pages as they need, without overlaps.
   */
  const OF = { navy: [31, 48, 65], label: [95, 107, 118], line: [175, 184, 192], fill: [250, 251, 252], soft: [245, 247, 249], frame: [158, 169, 179], red: [165, 57, 48], noteFill: [255, 245, 204], noteLine: [205, 161, 45], note: [107, 74, 0] };

  /** Lines of text at a fixed baseline step (jsPDF's own spacing is 1.15 × the size). */
  function put(doc, ls, x, y, step, opts) { ls.forEach((line, k) => doc.text(line, x, y + k * step, opts)); }

  function officeCode(prefix, d) {
    return `${prefix}-CC-${Math.round(d.L)}-${Math.round(d.W)}-${stem(d.course).slice(0, 6).toUpperCase()}`;
  }

  function officeWriter(doc, d, office, code) {
    const M = 15, BAND = 30, GAP = 4, TEXT = 11, LEAD = 5.2;
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const W = pw - 2 * M;
    const limit = ph - 17;
    let y = 0;
    let started = false;
    const font = (size, style = "normal") => doc.setFont("helvetica", style).setFontSize(size);
    const split = (text, width, size, style) => { font(size, style); return doc.splitTextToSize(String(text), width); };

    function band() {
      doc.setFillColor(...OF.navy).rect(0, 0, pw, BAND, "F");
      doc.setDrawColor(255).setLineWidth(.6).circle(M + 9, BAND / 2, 9);
      doc.setTextColor(255);
      font(12, "bold").text("CC", M + 9, BAND / 2 + 1.6, { align: "center" });
      const register = t("REGISTRO ACADÉMICO SIMULADO", "SIMULATED ACADEMIC REGISTER");
      const cw = Math.max(font(9.5, "bold").getTextWidth(code), font(9, "bold").getTextWidth(register)) + 6;
      const free = pw - M - (M + 24) - cw;
      const name = split(office, free, 11.5, "bold").slice(0, 2);
      put(doc, name, M + 24, 11, 5);
      font(9.5).text(split(d.course, free, 9.5)[0], M + 24, 11 + name.length * 5 + 1.5);
      font(9.5, "bold").text(code, pw - M, 11, { align: "right" });
      font(9, "bold").text(register, pw - M, 17.5, { align: "right" });
      y = BAND + 8;
    }

    function head(title) {
      doc.setTextColor(...OF.navy);
      const ls = split(title, W, 20, "bold");
      put(doc, ls, M, y + 7, 8);
      y += 7 + (ls.length - 1) * 8 + 5;
      const note = split(t(`MATERIAL DOCENTE · SIN VALIDEZ OFICIAL · Curso: ${d.course}`, `TEACHING MATERIAL · NOT AN OFFICIAL DOCUMENT · Course: ${d.course}`), W - 8, 9.5, "bold");
      const h = note.length * 4.4 + 4.8;
      doc.setFillColor(...OF.noteFill).setDrawColor(...OF.noteLine).setLineWidth(.35).roundedRect(M, y, W, h, 1, 1, "FD");
      doc.setTextColor(...OF.note);
      put(doc, note, pw / 2, y + 5.7, 4.4, { align: "center" });
      y += h + 6;
    }

    const api = {
      W, GAP, LEAD,
      room() { return limit - y; },
      /** A new sheet of the file (band, title and notice); it goes on in the same page when a third of it is still free. */
      sheet(title) {
        if (started && limit - y > (limit - BAND) / 3) { y += 6; head(title); return; }
        if (started) doc.addPage(d.format, "portrait");
        started = true;
        band();
        head(title);
      },
      ensure(h) {
        if (y + h > limit) { doc.addPage(d.format, "portrait"); band(); }
      },
      section(title, keep = 18) {
        api.ensure(13 + keep);
        doc.setTextColor(...OF.navy);
        font(14, "bold").text(title, M, y + 5);
        doc.setDrawColor(...OF.frame).setLineWidth(.35).line(M, y + 7.6, pw - M, y + 7.6);
        y += 13;
      },
      paraHeight(text, w = W) { return split(text, w, TEXT).length * LEAD + 3; },
      paragraph(text) {
        const ls = split(text, W, TEXT);
        api.ensure(ls.length * LEAD);
        doc.setTextColor(...OF.navy);
        put(doc, ls, M, y + 3.9, LEAD);
        y += ls.length * LEAD + 3;
      },
      numbered(number, text) {
        const ls = split(text, W - 10, TEXT);
        api.ensure(ls.length * LEAD);
        doc.setFillColor(...OF.navy).circle(M + 3.4, y + 2.6, 3.4, "F");
        doc.setTextColor(255);
        font(9.5, "bold").text(number, M + 3.4, y + 3.9, { align: "center" });
        doc.setTextColor(...OF.navy);
        font(TEXT);
        put(doc, ls, M + 10, y + 3.9, LEAD);
        y += ls.length * LEAD + 3;
      },
      /** Boxes side by side; free widths share what is left; every box takes the height of the tallest. */
      row(cells, gap = GAP) {
        const fixed = cells.reduce((s, c) => s + (c.w || 0), 0);
        const free = cells.filter((c) => !c.w).length;
        const fw = free ? (W - fixed - gap * (cells.length - 1)) / free : 0;
        const ws = cells.map((c) => c.w || fw);
        const H = Math.max(...cells.map((c, i) => c.h(ws[i])));
        api.ensure(H);
        let x = M;
        cells.forEach((c, i) => { c.draw(x, y, ws[i], H); x += ws[i] + gap; });
        y += H + GAP;
      },
      field(label, value) {
        const lab = (w) => split(label.toUpperCase(), w - 6, 9.5, "bold");
        const val = (w) => split(value, w - 6, TEXT);
        return {
          h: (w) => 5.4 + (lab(w).length - 1) * 4.2 + 5.8 + (val(w).length - 1) * LEAD + 3.6,
          draw: (x, yy, w, h) => {
            doc.setDrawColor(...OF.line).setFillColor(...OF.fill).setLineWidth(.35).roundedRect(x, yy, w, h, 1, 1, "FD");
            const l = lab(w);
            doc.setTextColor(...OF.label);
            put(doc, l, x + 3, yy + 5.4, 4.2);
            const v = val(w);
            doc.setTextColor(...OF.navy);
            put(doc, v, x + 3, yy + 5.4 + (l.length - 1) * 4.2 + 5.8, LEAD);
          }
        };
      },
      stack(items, gap = 3.5) {
        const total = (w) => items.reduce((s, it) => s + it.h(w), 0) + gap * (items.length - 1);
        return {
          h: total,
          draw: (x, yy, w, h) => {
            const extra = (h - total(w)) / items.length;
            items.forEach((it) => { const ih = it.h(w) + extra; it.draw(x, yy, w, ih); yy += ih + gap; });
          }
        };
      },
      /** A red stamp: centred lines in a rounded frame. */
      stamp(lines, lw = .8) {
        const block = (w) => lines.map((l) => Object.assign({}, l, { ls: split(l.text, w - 6, l.size, l.bold ? "bold" : "normal") }));
        const inner = (w) => block(w).reduce((s, l) => s + l.ls.length * l.size * .52, 0);
        return {
          h: (w) => inner(w) + 7,
          draw: (x, yy, w, h) => {
            doc.setDrawColor(...OF.red).setLineWidth(lw).roundedRect(x + lw / 2, yy + lw / 2, w - lw, h - lw, 1.5, 1.5, "S");
            let cy = yy + (h - inner(w)) / 2;
            doc.setTextColor(...OF.red);
            block(w).forEach((l) => {
              font(l.size, l.bold ? "bold" : "normal");
              l.ls.forEach((s) => { cy += l.size * .52; doc.text(s, x + w / 2, cy - l.size * .17, { align: "center" }); });
            });
          }
        };
      },
      registration(small) {
        return api.stamp(small ? [
          { text: t("RECIBIDO · SIMULACIÓN", "RECEIVED · SIMULATION"), size: 10.5, bold: true },
          { text: code, size: 9.5, bold: true }
        ] : [
          { text: t("REGISTRO DE ENTRADA", "ENTRY REGISTER"), size: 12, bold: true },
          { text: code, size: 9.5, bold: true },
          { text: t("RECIBIDO · SIMULACIÓN DOCENTE", "RECEIVED · TEACHING SIMULATION"), size: 9.5, bold: true },
          { text: t("Sin efectos administrativos", "No administrative effect"), size: 9.5 }
        ], 1);
      },
      educational() {
        return api.stamp([
          { text: t("MATERIAL DOCENTE", "TEACHING MATERIAL"), size: 11, bold: true },
          { text: t("SIN VALIDEZ OFICIAL", "NOT AN OFFICIAL DOCUMENT"), size: 9.5, bold: true },
          { text: d.course, size: 9.5 }
        ]);
      },
      /** A box to sign: label, room to sign, a line and the name under it. */
      signature(label, value, minH = 27) {
        const lab = (w) => split(label.toUpperCase(), w - 6, 9.5, "bold");
        const val = (w) => split(value, w - 8, 9.5);
        return {
          h: (w) => Math.max(minH, 5.4 + (lab(w).length - 1) * 4.2 + 13 + val(w).length * 4.3 + 2.6),
          draw: (x, yy, w, h) => {
            doc.setDrawColor(...OF.line).setLineWidth(.35).roundedRect(x, yy, w, h, 1, 1, "S");
            const l = lab(w);
            doc.setTextColor(...OF.label);
            put(doc, l, x + 3, yy + 5.4, 4.2);
            const v = val(w);
            const ly = yy + h - 3.2 - v.length * 4.3;
            doc.setDrawColor(190).setLineWidth(.3).line(x + 4, ly, x + w - 4, ly);
            doc.setTextColor(...OF.navy);
            put(doc, v, x + 4, ly + 4.4, 4.3);
          }
        };
      },
      /** A shaded box with a title and a paragraph (the request). */
      request(title, text) {
        const ls = (w) => split(text, w - 10, TEXT);
        return {
          h: (w) => 13 + ls(w).length * LEAD,
          draw: (x, yy, w, h) => {
            doc.setFillColor(...OF.soft).setDrawColor(...OF.frame).setLineWidth(.35).roundedRect(x, yy, w, h, 1.5, 1.5, "FD");
            doc.setTextColor(...OF.navy);
            font(11.5, "bold").text(title, x + 5, yy + 7.6);
            const l = ls(w);
            put(doc, l, x + 5, yy + 13.8, LEAD);
          }
        };
      },
      plan(minH) { return { h: () => minH, draw: (x, yy, w, h) => drawPatentPlan(doc, d, x, yy, w, h) }; },
      /** The model and the optimum, set as mathematics in a shaded box. */
      mathBox(srcs) {
        return {
          h: () => srcs.length * 7.2 + 5.4,
          draw: (x, yy, w, h) => {
            doc.setFillColor(...OF.soft).setDrawColor(...OF.frame).setLineWidth(.35).roundedRect(x, yy, w, h, 1.5, 1.5, "FD");
            srcs.forEach((src, k) => mathDraw(doc, mathParse(src), x + 6, yy + 7.8 + k * 7.2, MATH, OF.navy));
          }
        };
      },
      table(headers, rows, widths) {
        const layout = (w) => gridLayout(doc, headers, widths, w, { vpad: 4.4 });
        const heights = (g) => [g.heightOf(g.linesOf(headers, true)), ...rows.map((r) => g.heightOf(g.linesOf(r, false)))];
        return {
          h: (w) => heights(layout(w)).reduce((s, h) => s + h, 0),
          draw: (x, yy, w) => {
            const g = layout(w);
            const hs = heights(g);
            gridRow(doc, g, x, yy, g.linesOf(headers, true), hs[0], true, { head: OF.navy, grid: [255, 255, 255], ink: OF.navy });
            yy += hs[0];
            rows.forEach((r, k) => { gridRow(doc, g, x, yy, g.linesOf(r, false), hs[k + 1], false, { fill: k % 2 ? OF.fill : [244, 247, 249], grid: [190, 190, 190], ink: OF.navy }); yy += hs[k + 1]; });
          }
        };
      }
    };
    return api;
  }

  function drawPatentPlan(doc, d, x, y, width, height) {
    doc.setDrawColor(130, 143, 154).setFillColor(252, 253, 254).setLineWidth(.35).roundedRect(x, y, width, height, 1.5, 1.5, "FD");
    doc.setTextColor(95, 107, 118).setFont("helvetica", "bold").setFontSize(9.5).text(t("FIGURA 1 · PLANO DE CORTE Y PLEGADO", "FIGURE 1 · CUT-AND-FOLD PLAN"), x + 4, y + 6.5);
    const maxW = width - 22;
    const maxH = height - 24;   // the caption above, the length label below
    const scale = Math.min(maxW / d.L, maxH / d.W);
    const w = d.L * scale;
    const h = d.W * scale;
    const x0 = x + 2 + (width - w) / 2;
    const y0 = y + 12 + (maxH - h) / 2;
    const c = d.x * scale;
    doc.setFillColor(255).setDrawColor(31, 48, 65).setLineWidth(.4).rect(x0, y0, w, h, "FD");
    doc.setDrawColor(61, 112, 143).setLineDashPattern([2, 1.5], 0);
    doc.line(x0 + c, y0, x0 + c, y0 + h); doc.line(x0 + w - c, y0, x0 + w - c, y0 + h);
    doc.line(x0, y0 + c, x0 + w, y0 + c); doc.line(x0, y0 + h - c, x0 + w, y0 + h - c);
    doc.setLineDashPattern([], 0).setDrawColor(169, 67, 54);
    [[x0, y0], [x0 + w - c, y0], [x0, y0 + h - c], [x0 + w - c, y0 + h - c]].forEach(([cx, cy]) => { doc.line(cx, cy, cx + c, cy + c); doc.line(cx + c, cy, cx, cy + c); });
    // labels in millimetres of paper: 9 pt, about 2.2 mm capitals
    doc.setTextColor(31, 48, 65).setFont("helvetica", "normal").setFontSize(9);
    doc.text(`L = ${fmt(d.L, 1)} mm`, x0 + w / 2, y0 + h + 6, { align: "center" });
    const wl = `W = ${fmt(d.W, 1)} mm`;
    doc.text(wl, x0 - 3, y0 + h / 2 + doc.getTextWidth(wl) / 2, { angle: 90 });
    doc.text(`x = ${fmt(d.x, 2)} mm`, x0 + c + 2, y0 + c / 2 + 1.2);
  }

  function renderPatentDocument(doc, d) {
    const ow = officeWriter(doc, d, t("OFICINA DE PATENTES DEL CURSO", "COURSE PATENT OFFICE"), officeCode("PAT", d));
    const side = 64;
    ow.sheet(t("EXPEDIENTE DE PATENTE DOCENTE", "TEACHING PATENT FILE"));
    ow.row([ow.field(t("Solicitante", "Applicant"), d.company), ow.field(t("Estado del expediente", "File status"), t("REGISTRADO · Examen docente completado", "REGISTERED · Teaching review completed"))]);
    ow.row([ow.field(t("Título de la invención", "Title of invention"), t("Caja abierta de volumen máximo obtenida mediante cuatro recortes cuadrados congruentes", "Maximum-volume open box obtained using four congruent square cut-outs"))]);
    ow.section(t("RESUMEN TÉCNICO", "TECHNICAL ABSTRACT"));
    ow.paragraph(t(`El expediente describe una caja abierta fabricada a partir de una única lámina rectangular de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Se recortan en sus cuatro esquinas cuadrados congruentes de lado x y se pliegan las cuatro caras. Para las dimensiones declaradas, el valor x* registrado maximiza el volumen del recipiente.`, `The file describes an open box made from a single ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm rectangular sheet. Congruent squares of side x are removed from its four corners and the four faces are folded. For the stated dimensions, the registered value x* maximizes the container volume.`));
    ow.row([ow.plan(66), Object.assign(ow.stack([
      ow.field(t("Lámina inicial", "Initial sheet"), `${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm`),
      ow.field(t("Recorte registrado", "Registered cut"), `x* = ${fmt(d.x, 3)} mm`),
      ow.field(t("Caja resultante", "Resulting box"), `${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} × ${fmt(d.x, 2)} mm`),
      ow.field(t("Capacidad calculada", "Calculated capacity"), `${fmt(d.volume / 1000, 3)} mL`)
    ], 2.5), { w: side })]);
    ow.row([ow.field(t("Clasificación docente", "Teaching classification"), t("OPT-CALC · Optimización de funciones", "OPT-CALC · Function optimization")), Object.assign(ow.educational(), { w: side })]);
    ow.row([ow.signature(t("Registro y revisión", "Registration and review"), t("Secretaría técnica del curso", "Course technical office")), ow.signature(t("Titular ficticio", "Fictional holder"), d.company)]);

    ow.sheet(t("MEMORIA TÉCNICA Y REIVINDICACIONES", "TECHNICAL SPECIFICATION AND CLAIMS"));
    ow.section(t("1. CONSTRUCCIÓN DESDE LA LÁMINA", "1. CONSTRUCTION FROM THE SHEET"));
    ow.paragraph(t("El procedimiento parte exclusivamente del rectángulo indicado. Se marcan cuatro cuadrados iguales de lado x, se eliminan las esquinas y se pliega por las líneas discontinuas. No se añade cartón ni se modifica el perímetro útil fuera de los cuatro recortes.", "The procedure starts solely from the stated rectangle. Four equal squares of side x are marked, the corners are removed, and the sheet is folded along the dashed lines. No cardstock is added and the usable perimeter is not modified beyond the four cut-outs."));
    const formulas = [
      `V(x) = x(${fmt(d.L, 1)} - 2x)(${fmt(d.W, 1)} - 2x)`,
      `V'(x) = 12x² - ${fmt(4 * (d.L + d.W), 1)}x + ${fmt(d.L * d.W, 1)}`,
      `x* = [(L + W) - √{L² - LW + W²}] / 6 = ${fmt(d.x, 3)} mm`
    ];
    const claims = [
      t(`Caja abierta obtenida de una lámina de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm mediante cuatro recortes cuadrados congruentes de lado ${fmt(d.x, 3)} mm.`, `Open box obtained from a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet by means of four congruent square cut-outs of side ${fmt(d.x, 3)} mm.`),
      t(`Configuración resultante de base ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm y altura ${fmt(d.x, 2)} mm, con volumen máximo calculado de ${fmt(d.volume / 1000, 3)} mL.`, `Resulting configuration with a ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base and height ${fmt(d.x, 2)} mm, with a calculated maximum volume of ${fmt(d.volume / 1000, 3)} mL.`)
    ];
    // the plan takes the room the two sections after it leave on the page
    const after = 2 * 13 + ow.mathBox(formulas).h() + ow.GAP + claims.reduce((s, c) => s + ow.paraHeight(c, ow.W - 10), 0);
    ow.row([ow.plan(Math.max(70, Math.min(125, ow.room() - ow.GAP - after - 1)))]);
    ow.section(t("2. MODELO Y EXAMEN DE OPTIMALIDAD", "2. MODEL AND OPTIMALITY REVIEW"), ow.mathBox(formulas).h());
    ow.row([ow.mathBox(formulas)]);
    ow.section(t("3. REIVINDICACIONES DOCENTES", "3. TEACHING CLAIMS"));
    claims.forEach((claim, k) => ow.numbered(String(k + 1), claim));
  }

  function renderComplaintDocument(doc, d) {
    const altX = d.x * 0.82;
    const altVolume = altX * (d.L - 2 * altX) * (d.W - 2 * altX);
    const reportedAdvertised = d.volume * 0.94;
    const reportedAlternative = d.volume * 1.03;
    const reportedGain = (reportedAlternative / reportedAdvertised - 1) * 100;
    const code = officeCode("CON", d);
    const ow = officeWriter(doc, d, t("OFICINA DE ATENCIÓN A LAS PERSONAS CONSUMIDORAS", "CONSUMER AFFAIRS OFFICE"), code);
    const side = 64;
    ow.sheet(t("RECLAMACIÓN FORMAL REGISTRADA", "REGISTERED FORMAL COMPLAINT"));
    ow.row([ow.stack([
      ow.field(t("Presenta", "Submitted by"), t("Asociación de Personas Consumidoras", "Consumer Association")),
      ow.field(t("Contra", "Against"), d.company)
    ]), Object.assign(ow.registration(false), { w: side })]);
    ow.row([ow.field(t("Referencia de la campaña", "Campaign reference"), t(`«Caja óptima» · Patente docente ${officeCode("PAT", d)}`, `“Optimal box” · Teaching patent ${officeCode("PAT", d)}`))]);
    ow.row([ow.field(t("Tipo de actuación solicitada", "Requested proceeding"), t("Investigación por posible fraude a gran escala y traslado a la unidad policial competente", "Investigation into possible large-scale fraud and referral to the competent police unit"))]);
    ow.section(t("HECHOS DECLARADOS POR LA PARTE RECLAMANTE", "FACTS ASSERTED BY THE CLAIMANT"));
    ow.paragraph(t(`La asociación sostiene que el diseño registrado, con x=${fmt(d.x, 2)} mm, no es óptimo. Afirma que la campaña se ha difundido a gran escala y puede haber afectado a cientos o miles de personas consumidoras. Aporta un prototipo de contraste con x=${fmt(altX, 2)} mm y solicita investigación policial independiente.`, `The association claims that the registered design, with x=${fmt(d.x, 2)} mm, is not optimal. It states that the campaign was distributed on a large scale and may have affected hundreds or thousands of consumers. It submits a comparison prototype with x=${fmt(altX, 2)} mm and requests an independent police investigation.`));
    ow.row([ow.request(t("SOLICITUD", "REQUEST"), t(`Que se abra un expediente de consumo, se preserve la campaña como prueba y se remita el caso a la consultoría técnico-forense de la policía para determinar si existe fraude. La parte reclamante declara una mejora del ${fmt(reportedGain, 1)} %.`, `That a consumer-affairs file be opened, the campaign be preserved as evidence, and the case be referred to the police technical-forensic consultancy to determine whether fraud occurred. The claimant reports an improvement of ${fmt(reportedGain, 1)}%.`))]);
    ow.row([ow.field(t("Documentación adjunta", "Attached evidence"), t("Anexo técnico de mediciones · Prototipos físicos · Campaña publicitaria", "Technical measurement annex · Physical prototypes · Advertising campaign")), Object.assign(ow.educational(), { w: side })]);
    ow.row([ow.signature(t("Firma de la parte reclamante", "Claimant signature"), t("Asociación de Personas Consumidoras", "Consumer Association")), ow.signature(t("Sello de recepción", "Receipt stamp"), t("Oficina de Consumo del curso", "Course Consumer Office"))]);

    ow.sheet(t("ANEXO TÉCNICO DE HECHOS Y PRUEBAS", "TECHNICAL ANNEX OF FACTS AND EVIDENCE"));
    ow.section(t("1. OBJETO DE LA COMPROBACIÓN", "1. PURPOSE OF THE REVIEW"));
    ow.paragraph(t(`Contrastar la capacidad de la caja anunciada por ${d.company} con la de un prototipo alternativo construido a partir de la misma lámina de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Por el alcance atribuido a la campaña, el expediente se remite a consultores técnico-forenses de la policía. Los valores medidos quedan sujetos a verificación independiente.`, `To compare the capacity of the box advertised by ${d.company} with an alternative prototype made from the same ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet. Because of the alleged scale of the campaign, the file is referred to police technical-forensic consultants. The measured values remain subject to independent verification.`));
    ow.row([ow.table([t("Muestra", "Sample"), "x (mm)", t("V medido (mL)", "Measured V (mL)"), t("V teórico (mL)", "Theoretical V (mL)")], [
      [t("Diseño registrado", "Registered design"), fmt(d.x, 2), fmt(reportedAdvertised / 1000, 2), fmt(d.volume / 1000, 2)],
      [t("Diseño de contraste", "Comparison design"), fmt(altX, 2), fmt(reportedAlternative / 1000, 2), fmt(altVolume / 1000, 2)]
    ], [72, 28, 40, 40])]);
    ow.section(t("2. JUSTIFICACIÓN APORTADA", "2. SUBMITTED RATIONALE"));
    ow.numbered("A", t("Se empleó el mismo tamaño de lámina y el mismo procedimiento de recorte y plegado para ambos prototipos.", "The same sheet size and the same cutting and folding procedure were used for both prototypes."));
    ow.numbered("B", t(`La asociación afirma que el prototipo de contraste admite un ${fmt(reportedGain, 1)} % más de palomitas según sus mediciones.`, `The association claims that the comparison prototype holds ${fmt(reportedGain, 1)}% more popcorn according to its measurements.`));
    ow.numbered("C", t("La discrepancia entre las mediciones declaradas y los volúmenes teóricos exige revisar el llenado, la compactación, el número de ensayos y los posibles errores de medida.", "The discrepancy between the reported measurements and the theoretical volumes requires review of filling, compaction, number of trials, and possible measurement errors."));
    ow.section(t("3. CALIFICACIÓN PROVISIONAL Y PETICIÓN", "3. PROVISIONAL CLASSIFICATION AND REQUEST"));
    ow.paragraph(t("La parte reclamante califica la campaña como fraudulenta y advierte de un posible perjuicio colectivo. Este anexo no acredita por sí mismo el fraude: formaliza la acusación. La consultoría policial deberá contrastarla mediante los prototipos, la coherencia de las mediciones y el cálculo diferencial, y emitir después un dictamen motivado.", "The claimant classifies the campaign as fraudulent and warns of possible collective harm. This annex does not itself prove fraud: it records the accusation. The police consultancy must test it using the prototypes, measurement consistency, and differential calculus, and then issue a reasoned opinion."));
    ow.row([ow.signature(t("Declaración responsable", "Statement of responsibility"), t("Datos aportados por la parte reclamante", "Data supplied by the claimant")), Object.assign(ow.educational(), { w: 54 }), Object.assign(ow.registration(true), { w: 54 })]);
  }

  // ------------------------------------------------------------------ printing and distribution guide
  /** Printing and distribution guide (teacher): paper, copies and hand-outs of every document. */
  function renderPrintGuide(doc, d, pages) {
    const w = createWriter(doc, d);
    const count = (id) => pages[id] || 0;
    const docs = DOCS.filter((spec) => spec.print);
    const r = d.room;
    const paper = d.format === "letter" ? t("Carta", "Letter") : "A4";
    const sheet = `${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm`;
    const sheetName = d.preset === "custom" ? t("medidas personalizadas", "custom size") : String(d.paper).split(" — ")[0];
    // larger than Legal or wider than Letter: most printers cannot take it
    const big = Math.min(d.L, d.W) > 216 || Math.max(d.L, d.W) > 356;
    // what to buy: two sheets per Association pair (a prototype and a spare or a second box), one per cinema box plus two, and 10 % more
    const boxSheets = 2 * r.pairs + r.cinema + 2;
    const sheets = boxSheets + Math.max(2, Math.ceil(boxSheets * 0.1));
    // popcorn: enough to fill half the prototypes at once (none holds more than the optimum), with a quarter more; it is reused
    const litres = Math.ceil((Math.ceil(r.pairs / 2) + 1) * d.volume / 1e6 * 1.25);
    const kernels = Math.ceil(litres * 30 / 50) * 50;
    const printed = docs.filter((spec) => spec.count && !spec.template).reduce((n, spec) => n + spec.count(d) * Math.ceil(count(spec.id) / 2), 0);
    w.title(specOf("guide").title, kicker(d), true);
    w.meta([
      [t("Papel", "Paper"), t(`${paper}, en vertical; la presentación (00), apaisada 16:9`, `${paper}, portrait; the presentation (00), landscape 16:9`)],
      [t("Hoja de la caja", "Box sheet"), `${sheet} (${sheetName})`],
      [t("Clase", "Class"), t(`${r.students} estudiantes: Asociación ${r.association} (${r.pairs} ${r.trio ? "grupos" : "parejas"}), cine ${r.cinema}, consultoría ${r.police} (${r.policeGroups} ${r.policeGroups > 1 ? "grupos" : "grupo"})`, `${r.students} students: Association ${r.association} (${r.pairs} ${r.trio ? "groups" : "pairs"}), cinema ${r.cinema}, consultancy ${r.police} (${r.policeGroups} ${r.policeGroups > 1 ? "groups" : "group"})`)],
      [t("Generación", "Generation"), `${d.company} · ${d.course}`]
    ]);

    w.heading(t("1. Antes de imprimir", "1. Before printing"));
    w.bullets(t([
      `Imprime todo de la misma generación: las medidas, el corte x = ${fmt(d.x, 2)} mm y la solución dependen de la hoja de ${sheet}, y las copias, de los ${r.students} estudiantes. Si cambias la hoja o la clase, vuelve a generarlo todo.`,
      "La presentación (00) se proyecta, desde la web («Proyectar la presentación») o desde su PDF: no hace falta imprimirla. Sin proyector, imprime una copia por equipo.",
      `Papel: los documentos van en ${paper}, en vertical. Sus esquemas no están a escala, así que la escala de impresión no importa en ellos.`,
      `La plantilla a tamaño real (13) es una página del tamaño exacto de la hoja, ${sheet}. Imprímela en esas mismas hojas, al 100 % («tamaño real»), nunca con «ajustar a la página», y comprueba con el segmento de referencia que mide lo que indica.`,
      big
        ? `Esta hoja es mayor que A4 y que Carta, y la mayoría de las impresoras no la admite: imprime la plantilla en una copistería, en ese mismo papel, o marca a mano en las hojas del cine un cuadrado de ${fmt(d.x, 2)} mm en cada esquina (la base queda de ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm). Nunca la imprimas reducida: daría otra caja.`
        : `Si tu impresora no admite ese papel, imprime la plantilla en una copistería, en ese mismo papel, o marca a mano en las hojas del cine un cuadrado de ${fmt(d.x, 2)} mm en cada esquina (la base queda de ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm). Nunca la imprimas reducida: daría otra caja.`,
      "Caras y color: a doble cara los documentos de más de una página; el anuncio (01), en color; la plantilla, en color si es posible (sus aspas y sus líneas discontinuas se distinguen también en blanco y negro); la reclamación y la patente, color opcional. El resto, en blanco y negro. Grapa cada documento o cada paquete; la plantilla no se grapa."
    ], [
      `Print everything from the same generation: the measurements, the cut x = ${fmt(d.x, 2)} mm and the solution depend on the ${sheet} sheet, and the copies on the ${r.students} students. If you change the sheet or the class, generate everything again.`,
      "The presentation (00) is projected, from the website (“Project the presentation”) or from its PDF: there is no need to print it. Without a projector, print one copy per team.",
      `Paper: the documents are ${paper}, portrait. Their diagrams are not to scale, so the print scale does not matter for them.`,
      `The full-size template (13) is one page the exact size of the sheet, ${sheet}. Print it on those same sheets, at 100% (“actual size”), never with “fit to page”, and check with the reference segment that it measures what it says.`,
      big
        ? `This sheet is larger than A4 and Letter, and most printers cannot take it: have the template printed at a copy shop, on that same paper, or mark by hand on the cinema's sheets a ${fmt(d.x, 2)} mm square at each corner (the base is then ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm). Never print it reduced: it would give a different box.`
        : `If your printer cannot take that paper, have the template printed at a copy shop, on that same paper, or mark by hand on the cinema's sheets a ${fmt(d.x, 2)} mm square at each corner (the base is then ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm). Never print it reduced: it would give a different box.`,
      "Sides and colour: double-sided for the documents with more than one page; the advertisement (01) in colour; the template in colour if possible (its crosses and dashed lines can also be told apart in black and white); the complaint and the patent, colour optional. The rest, black and white. Staple each document or each packet; the template is not stapled."
    ]));

    w.heading(t("2. Documento a documento", "2. Document by document"), 40);
    w.table([t("Documento", "Document"), t("Págs.", "Pages"), t("Quién lo recibe", "Who receives it"), t("Copias", "Copies"), t("Cómo se imprime", "How to print"), t("Cuándo", "When")],
      docs.map((spec) => { const p = spec.print(d, count(spec.id)); return [`${spec.n} ${spec.title}`, String(count(spec.id)), p.who, p.copies, p.how, p.when]; }),
      [31, 11, 28, 31, 38, 35], { zebra: true });
    w.paragraph(t(`En total, sin la presentación, la plantilla ni tu material: unas ${printed} hojas de ${paper}.`, `In total, without the presentation, the template or your own material: about ${printed} ${paper} sheets.`), { size: 9.5, italic: true });

    w.heading(t("3. Los paquetes de la web", "3. The packets on the website"), 30);
    w.paragraph(t("La pestaña «Paquetes por rol» reúne los documentos en un PDF por destinatario, ya ordenados. Imprimir por paquetes da el mismo resultado que imprimir los documentos uno a uno. La plantilla (13), la comprobación individual (20) y la presentación (00) se imprimen aparte; el PDF completo contiene lo mismo que el paquete del profesorado.",
      "The “Role packets” tab gathers the documents into one PDF per recipient, already in order. Printing by packet gives the same result as printing the documents one by one. The template (13), the individual check (20) and the presentation (00) are printed separately; the complete PDF contains the same as the teacher packet."));
    w.table([t("Paquete", "Packet"), t("Contiene", "Contains"), t("Págs.", "Pages"), t("Copias y para quién", "Copies and for whom")],
      BUNDLES.map((b) => [b.label, b.docs.map((id) => id === "guide" ? t("esta guía", "this guide") : specOf(id).n).join(", "), String(b.docs.reduce((n, id) => n + count(id), 0)), b.use(d)]),
      [40, 34, 12, 88], { zebra: true });

    w.heading(t("4. Reparto paso a paso", "4. Hand-outs step by step"), 30);
    w.bullets(t([
      `Antes del lanzamiento. Imprime las copias de la tabla. Guarda aparte las ${r.policeGroups} reclamaciones (02) y patentes (03) de la policía, en un sobre, hasta la fase 2. Compra las hojas y las palomitas de la sección 5.`,
      `Lanzamiento, los últimos 15–20 minutos de una clase. Proyecta la presentación (00). En la diapositiva «Tres equipos», forma los equipos (Asociación ${r.association}, cine ${r.cinema}, consultoría ${r.police}) y entrega a cada pareja o grupo su paquete. Cada pareja de la Asociación elige su corte; la guía del profesorado (90) propone uno para cada una.`,
      "En casa. La consultoría modela, deriva y demuestra el máximo sin la patente; la Asociación calcula el volumen de su caja; el cine prepara la fabricación.",
      `Clase de cierre, fase 1 (25 min). Reparte las hojas de ${sheet}: dos por pareja de la Asociación y, al cine, las ${r.cinema} plantillas (13) impresas en ellas. Se construyen y se miden las cajas.`,
      "Transición (3 min). Coloca las cajas del cine en una mesa visible, reparte las palomitas y entrega entonces a cada grupo de consultores su reclamación (02) y su patente (03).",
      "Fase 2 (15 min) y dictamen (12 min). No se reparte nada: la policía registra la evidencia en su dossier y emite el dictamen. Al final, la comprobación individual (20), a cada estudiante.",
      "La solución y guía del profesorado (90) no sale de tus manos."
    ], [
      `Before the launch. Print the copies in the table. Keep the police's ${r.policeGroups} complaints (02) and patents (03) apart, in an envelope, until phase 2. Buy the sheets and the popcorn in section 5.`,
      `Launch, the last 15–20 minutes of a class. Project the presentation (00). On the slide “Three teams”, form the teams (Association ${r.association}, cinema ${r.cinema}, consultancy ${r.police}) and give each pair or group its packet. Each Association pair chooses its cut; the teacher guide (90) suggests one for each.`,
      "At home. The consultancy models, differentiates and proves the maximum without the patent; the Association works out the volume of its box; the cinema prepares the construction.",
      `Closing class, phase 1 (25 min). Hand out the ${sheet} sheets: two per Association pair and, to the cinema, the ${r.cinema} templates (13) printed on them. The boxes are built and measured.`,
      "Transition (3 min). Place the cinema boxes on a visible table, distribute the popcorn, and only then give each consultancy group its complaint (02) and patent (03).",
      "Phase 2 (15 min) and opinion (12 min). Nothing is handed out: the police record the evidence in their dossier and issue the opinion. At the end, the individual check (20), to every student.",
      "The teacher solution and guide (90) stays with you."
    ]), true);

    w.heading(t("5. Material adicional", "5. Additional material"), 24);
    w.bullets(t([
      `Hojas de ${sheet}, todas del mismo papel o cartulina: ${sheets} (2 por pareja de la Asociación, ${r.cinema + 2} para el cine con 2 de reserva, y un 10 % más). Las ${r.cinema} del cine son las de la plantilla.`,
      `Palomitas: unos ${litres} litros ya hechas (unos ${kernels} g de maíz), para llenar a la vez la mitad de los prototipos; la misma carga se reutiliza de un trasvase al siguiente. Si se van a comer, revisa alergias e higiene: las que se manipulan, aprietan o rompen en la prueba no deberían consumirse.`,
      `Para cada pareja o grupo (${r.pairs + 1 + r.policeGroups}): regla, lápiz y tijeras; cinta adhesiva para el cine y la Asociación. Una mesa visible para la prueba y una grapadora.`
    ], [
      `${sheet} sheets, all of the same paper or cardstock: ${sheets} (2 per Association pair, ${r.cinema + 2} for the cinema including 2 spares, and 10% more). The cinema's ${r.cinema} are the template sheets.`,
      `Popcorn: about ${litres} litres ready-made (about ${kernels} g of kernels), to fill half the prototypes at once; the same load is reused from one transfer to the next. If any will be eaten, check allergies and hygiene: popcorn handled, compressed or broken in the test should not be eaten.`,
      `For each pair or group (${r.pairs + 1 + r.policeGroups}): ruler, pencil and scissors; tape for the cinema and the Association. A visible table for the test, and a stapler.`
    ]));
    w.finish();
  }

  function footer(doc, label) {
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p += 1) {
      doc.setPage(p);
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...CC.rule).setLineWidth(.2).line(18, ph - 12, pw - 18, ph - 12);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...CC.muted)
        .text(`${label} · Calculus Cases · ${t("Material educativo ficticio", "Fictional educational material")}`, 18, ph - 7);
      doc.text(`${p}/${n}`, pw - 18, ph - 7, { align: "right" });
    }
  }

  function contentFor(id, d) {
    const Vpoly = `V(x) = x(${fmt(d.L, 1)} - 2x)(${fmt(d.W, 1)} - 2x) = 4x³ - ${fmt(2 * (d.L + d.W), 1)}x² + ${fmt(d.L * d.W, 1)}x`;
    const deriv = `V'(x) = 12x² - ${fmt(4 * (d.L + d.W), 1)}x + ${fmt(d.L * d.W, 1)}`;
    const root = `x* = [${fmt(d.L + d.W, 1)} - √{${fmt(d.L * d.L - d.L * d.W + d.W * d.W, 1)}}] / 6 = ${fmt(d.x, 3)} mm`;
    const challengeX = d.x * 0.82;
    const challengeVolume = challengeX * (d.L - 2 * challengeX) * (d.W - 2 * challengeX);
    const reportedAdvertised = d.volume * 0.94;
    const reportedAlternative = d.volume * 1.03;
    const reportedGain = (reportedAlternative / reportedAdvertised - 1) * 100;
    const common = {
      advert: [
        { heading: t("Pieza publicitaria aportada como prueba A", "Advertisement submitted as Exhibit A"), paragraphs: [t(`${d.company} presenta su caja de ${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} × ${fmt(d.x, 1)} mm como resultado de un diseño matemático que aprovecha al máximo cada hoja de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm.`, `${d.company} presents its ${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} × ${fmt(d.x, 1)} mm box as a mathematically designed product that makes maximum use of every ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet.`)] },
        { heading: t("Afirmaciones de campaña", "Campaign claims"), bullets: [t("«La caja de mayor capacidad posible con esta hoja».", "“The greatest possible capacity from this sheet.”"), t(`Capacidad anunciada: ${fmt(d.volume / 1000, 1)} mL.`, `Advertised capacity: ${fmt(d.volume / 1000, 1)} mL.`), t("Sin añadir material, solapas ni uniones que alteren el rectángulo inicial.", "No added material, tabs, or joints that alter the original rectangle.")] },
        { heading: t("Nota probatoria", "Evidence note"), paragraphs: [t("Documento ficticio creado exclusivamente para la actividad educativa. La afirmación debe ser verificada por el alumnado.", "Fictional document created solely for this educational activity. Students must verify the claim.")] }
      ],
      complaint: [
        { heading: t("Objeto de la denuncia", "Subject of the claim"), paragraphs: [t(`La asociación denuncia que ${d.company} anuncia como óptima una caja que, según sus comprobaciones, no alcanza la mayor capacidad posible. Por la difusión de la campaña entre cientos o miles de clientes, solicita que la policía investigue un posible fraude a gran escala.`, `The association alleges that ${d.company} advertises as optimal a box that, according to its tests, does not achieve the greatest possible capacity. Because the campaign reached hundreds or thousands of customers, it asks police to investigate possible large-scale fraud.`)] },
        { heading: t("Comprobaciones declaradas", "Reported tests"), bullets: [t(`Caja anunciada: corte x=${fmt(d.x, 2)} mm; capacidad medida media de ${fmt(reportedAdvertised / 1000, 2)} mL.`, `Advertised box: cut x=${fmt(d.x, 2)} mm; reported mean measured capacity ${fmt(reportedAdvertised / 1000, 2)} mL.`), t(`Caja alternativa: corte x=${fmt(challengeX, 2)} mm; capacidad medida media de ${fmt(reportedAlternative / 1000, 2)} mL.`, `Alternative box: cut x=${fmt(challengeX, 2)} mm; reported mean measured capacity ${fmt(reportedAlternative / 1000, 2)} mL.`), t(`La asociación declara una mejora del ${fmt(reportedGain, 1)} %.`, `The association reports a ${fmt(reportedGain, 1)}% improvement.`), t(`Sin embargo, el volumen teórico de la alternativa es ${fmt(challengeVolume / 1000, 2)} mL: este dato debe contrastarse con las mediciones.`, `However, the alternative's theoretical volume is ${fmt(challengeVolume / 1000, 2)} mL; this figure must be checked against the measurements.`)] },
        { heading: t("Petición y cuestión probatoria", "Requested remedy and evidential issue"), paragraphs: [t("Se solicita preservar la campaña como prueba, retirar provisionalmente la expresión «caja óptima» y remitir el expediente a la consultoría técnico-forense de la policía. El equipo pericial deberá decidir si las mediciones invalidan el modelo o contienen sesgos, errores o datos incompatibles.", "The association requests preservation of the campaign as evidence, provisional withdrawal of the phrase “optimal box,” and referral of the file to the police technical-forensic consultancy. The forensic team must decide whether the measurements invalidate the model or contain bias, error, or incompatible data.")] }
      ],
      patent: [
        { heading: t("Solicitud educativa de patente · No es un documento legal", "Educational patent application · Not a legal document"), paragraphs: [t(`Solicitante: ${d.company}. Título: Recipiente abierto optimizado a partir de una lámina rectangular mediante cuatro recortes cuadrados congruentes.`, `Applicant: ${d.company}. Title: Optimized open container formed from a rectangular sheet using four congruent square cut-outs.`)] },
        { heading: t("Descripción", "Description"), paragraphs: [t(`La invención propuesta parte de una lámina de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Se eliminan cuadrados de lado ${fmt(d.x, 2)} mm y se pliegan las cuatro bandas restantes para producir una base de ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `The proposed invention starts from a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet. Squares with side ${fmt(d.x, 2)} mm are removed and the four remaining strips are folded to produce a ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base.`)] },
        { heading: t("Reivindicaciones", "Claims"), bullets: [t("Un recipiente abierto construido sin añadir material a la lámina inicial.", "An open container made without adding material to the initial sheet."), t("Cuatro recortes cuadrados congruentes, uno en cada esquina.", "Four congruent square cut-outs, one at each corner."), t(`Un volumen teórico máximo de ${fmt(d.volume / 1000, 2)} mL para las dimensiones indicadas.`, `A theoretical maximum volume of ${fmt(d.volume / 1000, 2)} mL for the stated dimensions.`)] },
        { template: true }
      ],
      investigation: [
        { heading: t("Tu rol: equipo del cine", "Your role: cinema team"), paragraphs: [t(`Representáis a ${d.company}. Vuestra responsabilidad es fabricar la caja que el cine tiene registrada como óptima y aportar prototipos consistentes para la prueba. No realizáis la investigación matemática ni decidís si hubo fraude: esas funciones corresponden a la consultoría policial.`, `You represent ${d.company}. Your responsibility is to build the box that the cinema registered as optimal and provide consistent prototypes for testing. You do not conduct the mathematical investigation or decide whether fraud occurred: those duties belong to the police consultancy.`)] },
        { heading: t("Fase 1 · Fabricación de la caja registrada", "Phase 1 · Build the registered box"), bullets: [t(`Usad hojas de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm y marcad en cada esquina un cuadrado de lado x=${fmt(d.x, 2)} mm.`, `Use ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheets and mark a square with side x=${fmt(d.x, 2)} mm at every corner.`), t("Recortad los cuatro cuadrados, plegad por las cuatro líneas que delimitan la base y fijad las paredes con cinta si es necesario.", "Cut out the four squares, fold along the four lines bounding the base, and secure the walls with tape if needed."), t(`Comprobad que la base mide ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm y la altura ${fmt(d.x, 2)} mm.`, `Check that the base measures ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm and the height is ${fmt(d.x, 2)} mm.`), t("Construid varias copias iguales, etiquetadlas como «cine» y reservadlas para la prueba empírica.", "Build several identical copies, label them “cinema,” and keep them for the empirical test.")] },
        { template: true },
        { heading: t("Control de calidad de los prototipos", "Prototype quality control"), keepAll: true, paragraphs: [t("Medid cada copia antes de la prueba. Las diferencias de fabricación deben anotarse para que la policía pueda distinguir un error manual de un problema en el diseño.", "Measure every copy before testing. Construction differences must be recorded so police can distinguish a manual error from a design problem.")],
          table: { headers: [t("Copia", "Copy"), t("Corte x", "Cut x"), t("Largo base", "Base length"), t("Ancho base", "Base width"), t("Altura", "Height"), t("Incidencias", "Issues")], rows: Array.from({ length: 6 }, (_, index) => [String(index + 1), "", "", "", "", ""]), widths: [18, 27, 32, 32, 27, 44], more: (k) => [String(k + 1), "", "", "", "", ""], maxRows: 10 } },
        { heading: t("Fase 2 · Presentación del cine", "Phase 2 · Cinema presentation"), bullets: [t("Presentad la campaña, la patente docente y las medidas nominales de la caja.", "Present the campaign, the teaching patent, and the box's nominal dimensions."), t("Entregad las cajas para los trasvases sin modificar su forma durante la prueba.", "Provide the boxes for the transfers without changing their shape during the test."), t("Responded a las preguntas sobre fabricación, pero dejad que la consultoría policial valore los cálculos y emita el dictamen.", "Answer questions about construction, but let the police consultancy assess the mathematics and issue the opinion.")] }
      ],
      police: [
        { heading: t("Tu rol: consultoría técnico-forense de la policía", "Your role: police technical-forensic consultancy"), paragraphs: [t("La acusación describe un posible fraude de alcance masivo, con cientos o miles de personas consumidoras afectadas. La policía os encarga un análisis independiente. No representáis ni a la Asociación ni al cine: debéis seguir la evidencia y justificar cada conclusión.", "The allegation describes possible large-scale fraud affecting hundreds or thousands of consumers. Police have commissioned an independent analysis. You represent neither the Association nor the cinema: you must follow the evidence and justify every conclusion.")] },
        { heading: t("Misión pericial", "Forensic mission"), bullets: [t("Determinar matemáticamente qué caja maximiza el volumen para la lámina indicada.", "Determine mathematically which box maximizes volume for the stated sheet."), t("Comprobar si las dimensiones registradas por el cine coinciden con la solución matemática.", "Check whether the cinema's registered dimensions match the mathematical solution."), t("Contrastar los datos de la denuncia con los prototipos y detectar errores, sesgos o mediciones incompatibles.", "Compare the complaint data with the prototypes and identify errors, bias, or incompatible measurements."), t("Emitir el dictamen final: fraude acreditado, fraude no acreditado o evidencia insuficiente.", "Issue the final opinion: fraud established, fraud not established, or insufficient evidence.")] },
        { heading: t("Fase 1 · Modelado independiente (en casa)", "Phase 1 · Independent modelling (at home)"), paragraphs: [t(`Las cajas se fabrican con una hoja rectangular de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm: en cada esquina se recorta un cuadrado de lado x, los cuatro iguales, y se pliegan las cuatro paredes, sin añadir material. Expresad la altura y los lados de la base en función de x, escribid V(x) y determinad su dominio físico. No consultéis la patente antes de cerrar vuestro cálculo.`, `The boxes are made from a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm rectangular sheet: a square of side x is cut from each corner, all four equal, and the four walls are folded up, with no added material. Express the height and base sides in terms of x, write V(x), and determine its physical domain. Do not inspect the patent before completing your calculation.`)], lines: 7 },
        { heading: t("Derivadas y puntos críticos", "Derivatives and critical points"), paragraphs: [t("Desarrollad V(x), calculad V'(x), resolved V'(x)=0 y descartad las soluciones fuera del dominio. Conservad todos los pasos para que el informe sea reproducible.", "Expand V(x), calculate V'(x), solve V'(x)=0, and reject solutions outside the domain. Preserve every step so the report is reproducible.")], lines: 8 },
        { heading: t("Demostración del máximo global", "Proof of the global maximum"), paragraphs: [t("No basta con encontrar un punto crítico. Comparad con los extremos del dominio y utilizad V'' o el cambio de signo de V' para demostrar que la solución es un máximo global. Calculad las dimensiones finales y el volumen. Traed la demostración escrita a la clase de cierre: allí la terminaréis mientras los otros equipos construyen.", "Finding a critical point is not enough. Compare it with the domain endpoints and use V'' or the sign change of V' to prove that the solution is a global maximum. Calculate the final dimensions and volume. Bring the written proof to the closing class: you will finish it there while the other teams build.")], lines: 9 },
        { heading: t("Fase 2 · Registro de la evidencia", "Phase 2 · Evidence record"), keepAll: true, table: { headers: [t("Prueba", "Evidence"), t("Qué se observa", "Observation"), t("Fiabilidad / posible error", "Reliability / possible error")], rows: [[t("Cajas de consumidores", "Consumer boxes"), "", ""], [t("Caja del cine", "Cinema box"), "", ""], [t("Trasvase de palomitas", "Popcorn transfer"), "", ""], [t("Datos de la denuncia", "Complaint data"), "", ""], [t("Cálculo matemático", "Mathematical calculation"), "", ""]], widths: [45, 65, 70], minRow: 12, maxRow: 40 } },
        { heading: t("Dictamen técnico-forense", "Technical-forensic opinion"), bullets: [t("Comparad vuestro valor óptimo con la patente y las dimensiones reales construidas por el cine.", "Compare your optimal value with the patent and the cinema's actual constructed dimensions."), t("Separad la evidencia matemática, la evidencia empírica y los posibles errores de fabricación o llenado.", "Separate mathematical evidence, empirical evidence, and possible construction or filling errors."), t("Indicad expresamente si la afirmación publicitaria es verdadera dentro del modelo y si la acusación de fraude queda acreditada.", "State explicitly whether the advertising claim is true within the model and whether the fraud allegation is established."), t("El dictamen debe ser motivado: una acusación grave y un gran número de posibles afectados no sustituyen la prueba.", "The opinion must be reasoned: a serious allegation and a large number of potentially affected people do not replace evidence.")] },
        { heading: t("Conclusión y justificación", "Conclusion and reasoning"), lines: 6 },
        { heading: t("Firma del equipo pericial", "Forensic team sign-off"), lines: 3, fixedLines: true }
      ],
      measurement: [
        { heading: t("Tu rol: Asociación de Consumidores", "Your role: Consumer Association"), paragraphs: [t("Sois el grupo más numeroso. Vuestro objetivo es comprobar experimentalmente si la caja anunciada por la empresa tiene realmente mayor capacidad que otras cajas construidas con la misma hoja.", "You are the larger group. Your goal is to test experimentally whether the company's advertised box really has greater capacity than other boxes made from the same sheet.")] },
        { heading: t("Fase 1 · Construcción de prototipos diferentes", "Phase 1 · Build different prototypes"), bullets: [t(`Trabajad por parejas o pequeños grupos con hojas de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Coordinad el equipo para elegir distintos valores de x y evitar prototipos repetidos; una pareja construye el prototipo de contraste de la reclamación.`, `Work in pairs or small groups using ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheets. Coordinate the team so that you choose different x-values and avoid duplicate prototypes; one pair builds the complaint's comparison prototype.`), t("En casa, antes de la clase de cierre: calculad el volumen que predice vuestro valor de x y anotadlo en el registro. En clase construiréis la caja y mediréis su base y su altura reales.", "At home, before the closing class: work out the volume your x-value predicts and write it in the record. In class you will build the box and measure its actual base and height."), t("En cada esquina, dibujad un cuadrado de lado x. Los cuatro cuadrados deben ser exactamente iguales.", "At each corner, draw a square with side x. All four squares must be exactly equal."), t("Recortad y retirad los cuatro cuadrados. Después plegad el papel por las cuatro líneas que delimitan la base y fijad las paredes si es necesario.", "Cut out and remove the four squares. Then fold the sheet along the four lines bounding the base and secure the walls if needed."), t("Etiquetad cada caja con su valor de x y medid la base y la altura reales.", "Label each box with its x-value and measure its actual base and height.")] },
        { template: true },
        { heading: t("Registro de prototipos", "Prototype record"), keepAll: true, paragraphs: [t("Anotad todas las medidas en milímetros y calculad V=x(L-2x)(W-2x). Para pasar de mm³ a mL, dividid entre 1000. Conservad todas las cajas para la segunda fase.", "Record all lengths in millimetres and calculate V=x(L-2x)(W-2x). Divide mm³ by 1000 to obtain mL. Keep every box for phase two.")],
          table: { headers: ["x (mm)", t("Base real (mm)", "Actual base (mm)"), t("Altura (mm)", "Height (mm)"), t("V calculado (mL)", "Calculated V (mL)"), t("Resultado empírico", "Empirical result")], rows: Array.from({ length: 8 }, () => ["", "", "", "", ""]), widths: [24, 42, 30, 38, 46], more: () => ["", "", "", "", ""] } },
        { heading: t("Preparación de la prueba empírica", "Prepare the empirical test"), bullets: [t("En la segunda fase llenaréis cada prototipo con palomitas. Podéis colocarlas, apretarlas o romperlas para intentar introducir la máxima cantidad, pero debéis anotar la estrategia usada.", "In phase two you will fill each prototype with popcorn. You may arrange, compress, or break it to fit as much as possible, but you must record the strategy used."), t("No añadáis ni retiréis palomitas durante el trasvase: el contenido completo de cada prototipo se volcará en una caja óptima de la empresa.", "Do not add or remove popcorn during the transfer: the complete contents of each prototype will be poured into one of the company's optimal boxes."), t("Registrad si las palomitas llenan la caja óptima y cuánto espacio libre queda aproximadamente.", "Record whether the popcorn fills the optimal box and approximately how much free space remains.")] },
        { heading: t("Resultados de los trasvases", "Transfer results"), lines: 8 }
      ],
      check: [
        { heading: t(`1. El dominio`, `1. The domain`), paragraphs: [t(`Para la hoja del caso, de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm, escribe el dominio físico de V(x). ¿Por qué un corte de x = ${fmt(Math.ceil(d.maxCut) + 5, 0)} mm no da ninguna caja?`, `For the case's ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet, write the physical domain of V(x). Why does a cut of x = ${fmt(Math.ceil(d.maxCut) + 5, 0)} mm give no box at all?`)], lines: 2 },
        { heading: t("2. Un argumento incompleto", "2. An unfinished argument"), paragraphs: [t("Un compañero escribe: «V'(x*) = 0, así que x* da la caja de mayor volumen». ¿Qué le falta a su argumento? Complétalo.", "A classmate writes: “V'(x*) = 0, so x* gives the box of greatest volume.” What is missing from the argument? Complete it.")], lines: 3 },
        { heading: t("3. Las palomitas y el cálculo", "3. The popcorn and the calculation"), paragraphs: [t("¿Qué demostró la prueba de las palomitas y qué el cálculo? ¿Por qué hacían falta los dos?", "What did the popcorn test show, and what did the calculation prove? Why did the opinion need both?")], lines: 3 },
        { heading: t("4. Otra hoja", "4. Another sheet"), paragraphs: [t("Con una hoja cuadrada de 24 cm de lado y la misma regla de corte, ¿qué corte da la caja de mayor volumen? Demuestra que es un máximo global y calcula ese volumen.", "With a square sheet of side 24 cm and the same cutting rule, which cut gives the box of greatest volume? Prove that it is a global maximum and find that volume.")], lines: 3 }
      ],
      teacher: [
        { heading: t("Modelo para el tamaño seleccionado", "Model for the selected size"), blocks: [["math", Vpoly], ["p", t(`El dominio físico es $0 ≤ x ≤ ${fmt(d.maxCut, 3)}$ mm. En los extremos el volumen vale 0.`, `The physical domain is $0 ≤ x ≤ ${fmt(d.maxCut, 3)}$ mm. Volume is 0 at both endpoints.`)]] },
        { heading: t("Puntos críticos", "Critical points"), blocks: [["math", deriv], ["p", t(`Las raíces son ${fmt(d.x, 3)} mm y ${fmt(d.otherRoot, 3)} mm. La segunda queda fuera del dominio físico.`, `The roots are ${fmt(d.x, 3)} mm and ${fmt(d.otherRoot, 3)} mm. The second lies outside the physical domain.`)], ["math", root]] },
        { heading: t("Comprobación del máximo global", "Global maximum check"), paragraphs: [t(`V(0)=0; V(${fmt(d.x, 3)})=${fmt(d.volume, 1)} mm³=${fmt(d.volume / 1000, 3)} mL; V(${fmt(d.maxCut, 3)})=0. Además, V''(x*)=${fmt(24 * d.x - 4 * (d.L + d.W), 3)}<0. Por el método del intervalo cerrado, x* produce el máximo global.`, `V(0)=0; V(${fmt(d.x, 3)})=${fmt(d.volume, 1)} mm³=${fmt(d.volume / 1000, 3)} mL; V(${fmt(d.maxCut, 3)})=0. Also, V''(x*)=${fmt(24 * d.x - 4 * (d.L + d.W), 3)}<0. By the closed-interval method, x* gives the global maximum.`)] },
        { heading: t("Dimensiones finales y resolución esperada", "Final dimensions and expected resolution"), bullets: [t(`Recorte: ${fmt(d.x, 2)} mm.`, `Cut: ${fmt(d.x, 2)} mm.`), t(`Base: ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `Base: ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`), t(`Altura: ${fmt(d.x, 2)} mm.`, `Height: ${fmt(d.x, 2)} mm.`), t(`Volumen máximo: ${fmt(d.volume / 1000, 2)} mL.`, `Maximum volume: ${fmt(d.volume / 1000, 2)} mL.`), t("La afirmación es matemáticamente defendible dentro del modelo. Si las dimensiones del cine coinciden con estas, el dictamen esperado es que el fraude no queda acreditado y que las mediciones de la denuncia son incompatibles con el modelo.", "The claim is mathematically defensible within the model. If the cinema's dimensions match these values, the expected opinion is that fraud is not established and that the complaint measurements are incompatible with the model.")] },
        { heading: t("Esta clase", "This class"), paragraphs: [t(`${d.room.students} estudiantes. Asociación de Consumidores: ${d.room.association} (${d.room.trio ? `${d.room.pairs - 1} parejas y un trío` : `${d.room.pairs} parejas`}). Equipo del cine: ${d.room.cinema}, que fabrican ${d.room.cinema} cajas. Consultoría técnico-forense: ${d.room.police}, en ${d.room.policeGroups > 1 ? `${d.room.policeGroups} grupos (${d.room.policeSizes.join(" y ")}) que dictaminan por separado` : "un grupo"}.`, `${d.room.students} students. Consumer Association: ${d.room.association} (${d.room.trio ? `${d.room.pairs - 1} pairs and a trio` : `${d.room.pairs} pairs`}). Cinema team: ${d.room.cinema}, who build ${d.room.cinema} boxes. Technical-forensic consultancy: ${d.room.police}, in ${d.room.policeGroups > 1 ? `${d.room.policeGroups} groups (${d.room.policeSizes.join(" and ")}) that give separate opinions` : "one group"}.`),
          t(`Cortes sugeridos para las parejas de la Asociación (mm): ${d.cuts.map((c) => fmt(c, Number.isInteger(c) ? 0 : 2)).join(" · ")}. El de ${fmt(d.cuts.find((c) => !Number.isInteger(c)) || d.cuts[0], 2)} mm es el del prototipo de contraste de la reclamación; los demás recorren el dominio, de modo que la clase obtiene la curva de volumen entera.`, `Suggested cuts for the Association pairs (mm): ${d.cuts.map((c) => fmt(c, Number.isInteger(c) ? 0 : 2)).join(" · ")}. The one of ${fmt(d.cuts.find((c) => !Number.isInteger(c)) || d.cuts[0], 2)} mm is the complaint's comparison prototype; the others span the domain, so the class obtains the whole volume curve.`)] },
        { heading: t("Calendario: lanzamiento, casa y clase de cierre", "Schedule: launch, home and closing class"), bullets: [
          t("Lanzamiento, los últimos 18 minutos de una clase: diagnóstico (3), presentación proyectada (7), equipos y paquetes (4), lectura de los dosieres y reparto de los cortes de la Asociación (4).", "Launch, the last 18 minutes of a class: entry check (3), projected presentation (7), teams and packets (4), reading the dossiers and sharing out the Association's cuts (4)."),
          t("En casa: la consultoría, 45–60 minutos (modelo, dominio, derivada, puntos críticos y máximo global, sin la patente); la Asociación, 15–20 (el volumen que predice su corte); el cine, 15 (las instrucciones y las medidas nominales).", "At home: the consultancy, 45–60 minutes (model, domain, derivative, critical points and global maximum, without the patent); the Association, 15–20 (the volume its cut predicts); the cinema, 15 (the instructions and the nominal dimensions)."),
          t("Clase de cierre, 60 minutos: fase 1, construcción y medida (25); transición (3); fase 2, prueba de las palomitas (15); dictamen (12); comprobación individual (5).", "Closing class, 60 minutes: phase 1, construction and measurement (25); transition (3); phase 2, popcorn test (15); opinion (12); individual check (5)."),
          t("Con más tiempo, la fase 1 puede durar una clase entera (45–60 minutos) y la fase 2 y el dictamen ocupar la primera media hora de la siguiente.", "With more time, phase 1 can take a whole class (45–60 minutes) and phase 2 and the opinion the first half hour of the next.")] },
        { heading: t("Marco narrativo y presencia policial", "Narrative frame and police involvement"), paragraphs: [t("Presenta la denuncia como una acusación de posible fraude a gran escala: la campaña se habría difundido entre cientos o miles de clientes. Esto justifica que la policía preserve la evidencia, encargue un análisis técnico independiente y sea quien decida al final si la acusación queda acreditada. Tú eres el inspector jefe: repartes las pruebas, marcas el ritmo y pides cuentas, pero no das el dictamen.", "Present the complaint as an allegation of possible large-scale fraud: the campaign may have reached hundreds or thousands of customers. This justifies police preservation of evidence, commissioning of an independent technical analysis, and responsibility for the final decision. You are the Chief Inspector: you hand out the evidence, set the pace and ask for accounts, but you do not give the opinion.")] },
        { heading: t("Fase 1 · Construcción e investigación", "Phase 1 · Construction and investigation"), bullets: [t("La Asociación de Consumidores construye sus cajas con valores diferentes de x, mide sus dimensiones y completa la tabla de volúmenes.", "The Consumer Association builds its boxes using different x-values, measures them, and completes the volume table."), t(`El equipo del cine recibe x*=${fmt(d.x, 2)} mm, fabrica sus copias de la caja registrada sobre la plantilla y controla que la base mida ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `The cinema team receives x*=${fmt(d.x, 2)} mm, builds its copies of the registered box on the template, and checks that the base measures ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`), t("La consultoría policial trae de casa el modelo, el dominio, la derivada y los puntos críticos, y termina en clase la demostración del máximo global sin recibir la solución desarrollada.", "The police consultancy brings the model, domain, derivative and critical points from home, and completes the proof of the global maximum in class without receiving the worked solution."), t("Circula entre los equipos para comprobar que todos los recortes de cada caja son iguales y que se usan hojas del mismo tamaño, sin resolver los cálculos policiales.", "Circulate among the teams to check that every cut-out in each box is equal and that all sheets have the same dimensions, without solving the police calculations.")] },
        { heading: t("Transición", "Transition"), paragraphs: [t("Cuando estén terminados los prototipos y la consultoría policial haya acordado su demostración preliminar, detén el trabajo y anuncia expresamente la segunda fase. Coloca las cajas del cine en una mesa visible, reparte las palomitas y entrega entonces a la policía la reclamación completa y la patente para su contraste final.", "When the prototypes are complete and the police consultancy has agreed on its preliminary proof, stop the work and explicitly announce phase two. Place the cinema boxes on a visible table, distribute the popcorn, and only then give police the complete complaint and patent for final comparison.")] },
        { heading: t("Fase 2 · Prueba empírica", "Phase 2 · Empirical test"), bullets: [t("La Asociación presenta cada prototipo, su valor de x, su volumen calculado y los fundamentos de su acusación.", "The Association presents each prototype, its x-value, calculated volume, and grounds for the allegation."), t("El alumnado llena el prototipo con tantas palomitas como pueda. Puede ordenarlas, apretarlas o romperlas, pero debe conservar exactamente ese contenido para el trasvase.", "Students fill the prototype with as much popcorn as possible. They may arrange, compress, or break it, but must preserve exactly that content for the transfer."), t("El cine aporta una de sus cajas. Se vuelca en ella todo el contenido del prototipo sin añadir ni retirar palomitas y se repite con todas las cajas.", "The cinema provides one of its boxes. All contents from the prototype are poured into it without adding or removing popcorn, and the process is repeated for every box."), t("La consultoría policial registra los resultados, las diferencias de fabricación, la estrategia de llenado y cualquier dato que afecte a la fiabilidad.", "The police consultancy records the results, construction differences, filling strategy, and any data affecting reliability."), t("El resultado esperado es que ninguna carga procedente de una caja de menor volumen llene por completo la caja óptima. Comenta posibles variaciones debidas al empaquetamiento, grosor del papel y fabricación.", "The expected result is that no load from a lower-volume box completely fills the optimal box. Discuss possible variation due to packing, paper thickness, and construction.")] },
        { heading: t("Dictamen", "Opinion"), bullets: [t("La consultoría policial presenta el modelo, la derivada, los puntos críticos, el dominio y la demostración del máximo global.", "The police consultancy presents the model, derivative, critical points, domain, and proof of the global maximum."), t("Después compara su solución con la patente, las cajas del cine, los prototipos de la Asociación y los datos empíricos.", "It then compares its solution with the patent, cinema boxes, Association prototypes, and empirical data."), t("Debe distinguir errores de medida, errores de fabricación y limitaciones del modelo antes de resolver.", "It must distinguish measurement errors, construction errors, and model limitations before deciding."), t("El equipo policial emite uno de tres dictámenes: fraude acreditado, fraude no acreditado o evidencia insuficiente, siempre acompañado de una justificación matemática.", "The police team issues one of three opinions: fraud established, fraud not established, or insufficient evidence, always accompanied by mathematical reasoning."), t("Subraya que el trasvase ilustra el resultado, mientras que el cálculo demuestra la optimalidad dentro del modelo.", "Emphasize that the transfer illustrates the result, while calculus proves optimality within the model.")] },
        { heading: t("Comprobación individual (20): respuestas", "Individual check (20): answers"), bullets: [
          t(`1. El dominio es 0 < x < ${fmt(d.maxCut, 1)} mm: x es una longitud positiva y el lado menor de la base, ${fmt(Math.min(d.L, d.W), 1)} - 2x, también debe serlo. Con x = ${fmt(Math.ceil(d.maxCut) + 5, 0)} mm ese lado sería negativo.`, `1. The domain is 0 < x < ${fmt(d.maxCut, 1)} mm: x is a positive length and so must be the shorter side of the base, ${fmt(Math.min(d.L, d.W), 1)} - 2x. With x = ${fmt(Math.ceil(d.maxCut) + 5, 0)} mm that side would be negative.`),
          t("2. Le falta el dominio y un argumento global: el volumen es nulo en los dos extremos y V' pasa de positiva a negativa en x*, o V'' es negativa allí y no hay otro punto crítico en el dominio.", "2. It lacks the domain and a global argument: the volume is zero at both endpoints and V' changes from positive to negative at x*, or V'' is negative there and there is no other critical point in the domain."),
          t("3. El trasvase muestra que esas cajas concretas no superan a la del cine; el cálculo demuestra que ninguna caja de la familia la supera. Lo primero depende de la fabricación y del llenado; lo segundo, solo del modelo.", "3. The transfer shows that those particular boxes do not beat the cinema's; the calculation proves that no box in the family does. The first depends on construction and filling; the second only on the model."),
          t("4. V(x) = x(240 - 2x)² en mm, con 0 < x < 120; V'(x) = (240 - 2x)(240 - 6x) se anula en 40 y en 120 (extremo). El máximo está en x = 40 mm, con V = 1 024 000 mm³ = 1024 mL; V es nulo en los extremos.", "4. V(x) = x(240 - 2x)² in mm, with 0 < x < 120; V'(x) = (240 - 2x)(240 - 6x) vanishes at 40 and at 120 (an endpoint). The maximum is at x = 40 mm, with V = 1,024,000 mm³ = 1024 mL; V is zero at the endpoints.")] },
        { heading: t("Resultado matemático reservado", "Teacher-only mathematical result"), formula: root, formulaFirst: true, paragraphs: [t(`Para estas medidas, el volumen máximo es ${fmt(d.volume / 1000, 3)} mL y se obtiene con una caja de base ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm y altura ${fmt(d.x, 2)} mm.`, `For these dimensions, the maximum volume is ${fmt(d.volume / 1000, 3)} mL, obtained with a ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base and height ${fmt(d.x, 2)} mm.`)] }
      ]
    };
    return common[id] || [];
  }

  // ------------------------------------------------------------------ PDF writer (house style)
  /*
   * Case-file house style shared with Ciudad Delta and with the student documents of the book
   * (casedocument / caseassignment / casetable in casebook-preamble.tex): CaseBlue headings, rules
   * and table headers, CaseOrange list markers, stamp red for restricted documents, sans for
   * headings, labels and tables, and a serif body. Sizes and use of the page:
   * ESTANDAR_WEB_ACTIVIDADES.md, 4.1 and 4.2.
   */
  const CC = { blue: [32, 80, 110], orange: [155, 80, 30], stamp: [150, 40, 40], ink: [28, 30, 34], muted: [112, 112, 112], rule: [155, 155, 155], zebra: [246, 247, 248], grid: [200, 203, 206], tint: [242, 246, 249] };
  const BODY = 11;
  const lead = (size) => size * 0.4726;   // 11 pt -> 5.2 mm
  const BANNER_RATIO = 218 / 1200;        // header-brand.jpg
  const MATH = 11.5;                      // displayed formulas: letters the size of the text, not a headline

  function kicker(d) { return t(`Calculus Cases · Caso 3 · ${d.company}`, `Calculus Cases · Case 3 · ${d.company}`); }

  // ------------------------------------------------------------------ formulas
  /*
   * jsPDF's core fonts have no minus sign, radical or "less than or equal", so the formulas are set
   * in Times (italic letters, roman numbers and units, an en dash for minus) and the radical and ≤
   * are drawn. Markup: √{...} is a square root.
   */
  const MATH_ROMAN = new Set(["mm", "mL"]);
  function mathParse(src) {
    const nodes = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === "√" && src[i + 1] === "{") {
        let depth = 0;
        let j = i + 1;
        for (; j < src.length; j += 1) {
          if (src[j] === "{") depth += 1;
          else if (src[j] === "}") { depth -= 1; if (!depth) break; }
        }
        nodes.push({ sqrt: mathParse(src.slice(i + 2, j)) });
        i = j + 1;
      } else if (c === "≤") {
        nodes.push({ le: true });
        i += 1;
      } else if (/[A-Za-z]/.test(c)) {
        let j = i;
        while (j < src.length && /[A-Za-z]/.test(src[j])) j += 1;
        const word = src.slice(i, j);
        nodes.push({ text: word, italic: !MATH_ROMAN.has(word) });
        i = j;
      } else {
        let j = i;
        while (j < src.length && !/[A-Za-z√≤]/.test(src[j])) j += 1;
        nodes.push({ text: src.slice(i, j).replace(/-/g, "–"), italic: false });
        i = j;
      }
    }
    return nodes;
  }
  function mathFont(doc, italic, size) { return doc.setFont("times", italic ? "italic" : "normal").setFontSize(size); }
  /** jsPDF over-measures the superscript figures; Times gives them 0.3 em. */
  function mathText(doc, s, size) { return doc.getTextWidth(s.replace(/[²³]/g, "")) + (s.match(/[²³]/g) || []).length * 0.3 * size * 0.3528; }
  function mathWidth(doc, nodes, size) {
    const em = size * 0.3528;
    return nodes.reduce((w, n) => {
      if (n.sqrt) return w + 0.62 * em + mathWidth(doc, n.sqrt, size) + 0.14 * em;
      if (n.le) return w + mathFont(doc, false, size).getTextWidth("<");
      return w + mathText(mathFont(doc, n.italic, size), n.text, size) + (n.italic ? 0.05 * em : 0);
    }, 0);
  }
  function mathDraw(doc, nodes, x, y, size, color) {
    const em = size * 0.3528;
    nodes.forEach((n) => {
      doc.setTextColor(...color).setDrawColor(...color);
      if (n.sqrt) {
        const iw = mathWidth(doc, n.sqrt, size);
        doc.setLineWidth(0.055 * em).setLineJoin("round").setLineCap("round");
        doc.lines([[0.12 * em, -0.06 * em], [0.2 * em, 0.5 * em], [0.24 * em, -0.94 * em], [0.06 * em + iw + 0.1 * em, 0]], x, y - 0.3 * em, [1, 1], "S", false);
        doc.setLineJoin("miter").setLineCap("butt");
        mathDraw(doc, n.sqrt, x + 0.62 * em, y, size, color);
        x += 0.62 * em + iw + 0.14 * em;
      } else if (n.le) {
        const w = mathFont(doc, false, size).getTextWidth("<");
        doc.text("<", x, y - 0.1 * em);
        doc.setLineWidth(0.045 * em).line(x + 0.08 * em, y + 0.08 * em, x + w - 0.08 * em, y + 0.08 * em);
        x += w;
      } else {
        mathFont(doc, n.italic, size).text(n.text, x, y);
        x += mathText(doc, n.text, size) + (n.italic ? 0.05 * em : 0);
      }
    });
    return x;
  }

  // ------------------------------------------------------------------ tables
  /** Column widths, cell lines and row heights; a header word is never split (its column widens at the expense of the widest one). */
  function gridLayout(doc, headers, widths, total, opts = {}) {
    const fs = opts.size || 9.5;
    const pad = 1.6;
    const vpad = opts.vpad || 3.2;
    const lineH = fs * 0.42;
    const sum = widths.reduce((s, w) => s + w, 0);
    const ws = widths.map((w) => w * total / sum);
    doc.setFont("helvetica", "bold").setFontSize(fs);
    headers.forEach((h, i) => {
      const need = Math.max(...String(h).split(/\s+/).map((word) => doc.getTextWidth(word))) + 2 * pad + 0.4;
      if (ws[i] < need) {
        const j = ws.indexOf(Math.max(...ws));
        if (j !== i) { ws[j] -= need - ws[i]; ws[i] = need; }
      }
    });
    const linesOf = (row, bold) => row.map((cell, i) => {
      doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(fs);
      return doc.splitTextToSize(String(cell), ws[i] - 2 * pad);
    });
    const heightOf = (ls, min = 0) => Math.max(min, Math.max(...ls.map((l) => l.length)) * lineH + vpad);
    return { fs, pad, vpad, lineH, ws, linesOf, heightOf };
  }
  /** One row; header cells are centred vertically, and so are body cells when every cell of the row has a single line. */
  function gridRow(doc, g, x0, y, ls, h, header, colors) {
    let x = x0;
    const single = ls.every((cell) => cell.length <= 1);
    ls.forEach((cell, i) => {
      if (header) doc.setFillColor(...colors.head).setDrawColor(...colors.grid);
      else doc.setFillColor(...colors.fill).setDrawColor(...colors.grid);
      doc.setLineWidth(.15).rect(x, y, g.ws[i], h, "FD");
      doc.setFont("helvetica", header ? "bold" : "normal").setFontSize(g.fs).setTextColor(...(header ? [255, 255, 255] : colors.ink));
      let top = y + g.vpad / 2;
      if (header) top = y + (h - cell.length * g.lineH) / 2;
      else if (single && h <= g.lineH + g.vpad + 4) top = y + (h - g.lineH) / 2;
      cell.forEach((line, k) => doc.text(line, x + g.pad, top + g.lineH * 0.74 + k * g.lineH));
      x += g.ws[i];
    });
  }

  // ------------------------------------------------------------------ the writer
  function createWriter(doc, d, plan) {
    const pw = () => doc.internal.pageSize.getWidth();
    const ph = () => doc.internal.pageSize.getHeight();
    const margin = 18;
    const bottom = 18;
    const top0 = 20;
    let y = top0;            // baseline of the next line of text
    let pending = null;      // the last answer space, blank table or diagram placed: it can still grow to the foot of the page
    const W = () => pw() - 2 * margin;
    const limit = () => ph() - bottom;
    const split = (text, width) => doc.splitTextToSize(String(text), width || W());
    const body = (size = BODY, style = "normal") => doc.setFont("times", style).setFontSize(size).setTextColor(...CC.ink);
    function settle(extra) { if (pending) { const draw = pending; pending = null; draw(Math.max(0, extra)); } }
    // growing blocks (answer spaces, blank tables, diagrams) are numbered; `plan` gives some of them extra room
    let growIndex = -1;
    let lastGrow = null;     // the last growing block placed on the current page
    const record = {};       // block -> room left at the foot of its page, when other content followed it there
    function growing(draw) {
      const index = (growIndex += 1);
      const planned = (plan && plan[index]) || 0;
      lastGrow = index;
      pending = (extra) => draw(extra + planned);
      return planned;
    }
    const plannedNext = () => (plan && plan[growIndex + 1]) || 0;
    function closePage() {
      const left = limit() - y;
      if (pending) settle(left);
      else if (lastGrow != null && left > 3) record[lastGrow] = left;
      lastGrow = null;
    }
    function newPage() { closePage(); doc.addPage(d.format, "portrait"); y = top0; }
    function ensure(h) { if (y + h > limit()) newPage(); else settle(0); }
    const stamp = (label, x, yy) => {
      doc.setFont("helvetica", "bold").setFontSize(8);
      const w = doc.getTextWidth(label) + 4;
      doc.setDrawColor(...CC.stamp).setLineWidth(.35).rect(x - w, yy - 3.4, w, 4.8);
      doc.setTextColor(...CC.stamp).text(label, x - w / 2, yy, { align: "center" });
      return w;
    };

    // rich text: $...$ is set as mathematics inside a paragraph
    function richTokens(text) {
      const tokens = [];
      String(text).split(/(\$[^$]*\$)/).forEach((part) => {
        if (!part) return;
        if (part.startsWith("$")) tokens.push({ math: mathParse(part.slice(1, -1)) });
        else part.split(/(\s+)/).forEach((p) => { if (p) tokens.push(/^\s+$/.test(p) ? { space: true } : { text: p }); });
      });
      return tokens;
    }
    function richLines(text, size, width) {
      const widthOf = (tk) => tk.math ? mathWidth(doc, tk.math, size) : body(size).getTextWidth(tk.space ? " " : tk.text);
      const out = [];
      let line = [];
      let lw = 0;
      richTokens(text).forEach((tk) => {
        const tw = widthOf(tk);
        if (tk.space) { if (line.length) { line.push(tk); lw += tw; } return; }
        if (lw + tw > width && line.length) {
          while (line.length && line[line.length - 1].space) line.pop();
          out.push(line); line = []; lw = 0;
        }
        line.push(tk); lw += tw;
      });
      if (line.length) out.push(line);
      return out.map((l) => ({ tokens: l, widthOf }));
    }
    function drawRich(lines, x, yy, size) {
      lines.forEach((l, k) => {
        let cx = x;
        l.tokens.forEach((tk) => {
          if (tk.math) cx = mathDraw(doc, tk.math, cx, yy + k * lead(size), size, CC.ink);
          else { body(size); if (!tk.space) doc.text(tk.text, cx, yy + k * lead(size)); cx += l.widthOf(tk); }
        });
      });
    }

    // formulas wider than the box break before an "=" sign
    function formulaRows(src, maxW) {
      if (mathWidth(doc, mathParse(src), MATH) <= maxW) return [src];
      const parts = src.split(" = ");
      const rows = [];
      let cur = parts[0];
      parts.slice(1).forEach((part) => {
        const cand = `${cur} = ${part}`;
        if (mathWidth(doc, mathParse(cand), MATH) <= maxW) cur = cand;
        else { rows.push(cur); cur = `= ${part}`; }
      });
      rows.push(cur);
      return rows;
    }

    const api = {
      get y() { return y; },
      margin, W, pw, ph, ensure,
      /** Space left on the current page, above the footer band. */
      room() { return limit() - y; },
      title(title, kickerText, confidential) {
        let top = 14;
        if (state.visuals.banner) {
          const h = pw() * BANNER_RATIO;
          doc.addImage(state.visuals.banner, "JPEG", 0, 0, pw(), h, "banner", "FAST");
          top = h + 8;
        }
        const sw = confidential ? stamp(t("SOLO PROFESORADO", "TEACHER ONLY"), pw() - margin, top) + 4 : 0;
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...CC.muted).text(split(kickerText.toUpperCase(), W() - sw)[0], margin, top);
        doc.setDrawColor(...CC.blue).setLineWidth(.35).line(margin, top + 2.2, pw() - margin, top + 2.2);
        doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(...CC.ink);
        const ls = split(title);
        put(doc, ls, margin, top + 11, 8);
        y = top + 11 + (ls.length - 1) * 8 + 8.5;
        doc.setLineWidth(.2);
      },
      meta(rows) {
        rows.forEach(([label, value]) => {
          doc.setFont("helvetica", "normal").setFontSize(9.5);
          const ls = split(value, W() - 36);
          doc.setFont("helvetica", "bold").setTextColor(...CC.muted).text(String(label), margin, y);
          doc.setFont("helvetica", "normal").setTextColor(...CC.ink);
          put(doc, ls, margin + 36, y, 4.6);
          y += 4.6 * (ls.length - 1) + 5.4;
        });
        y += 3.5;
      },
      heading(text, keep = 16) {
        ensure(8.5 + keep);   // a heading never stays alone at the foot of a page
        doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...CC.blue);
        const ls = split(text);
        put(doc, ls, margin, y, 6);
        y += 8.5 + (ls.length - 1) * 6;
      },
      paragraph(text, opts = {}) {
        const size = opts.size || BODY;
        if (String(text).includes("$")) {
          const ls = richLines(text, size, opts.width || W());
          ensure(ls.length * lead(size) + 3);
          drawRich(ls, opts.x || margin, y, size);
          y += ls.length * lead(size) + 3;
          return;
        }
        body(size, opts.italic ? "italic" : "normal");
        const ls = split(text, opts.width);
        ensure(ls.length * lead(size) + 3);
        body(size, opts.italic ? "italic" : "normal");
        put(doc, ls, opts.x || margin, y, lead(size));
        y += ls.length * lead(size) + (opts.gap == null ? 3 : opts.gap);
      },
      bullets(items, numbered) {
        items.forEach((item, k) => {
          body();
          const ls = split(item, W() - 6.5);
          ensure(ls.length * lead(BODY) + 2.4);
          if (numbered) doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...CC.orange).text(`${k + 1}.`, margin, y);
          else doc.setFillColor(...CC.orange).rect(margin + .6, y - 2.4, 1.9, 1.9, "F");
          body();
          put(doc, ls, margin + 6.5, y, lead(BODY));
          y += ls.length * lead(BODY) + 2.4;
        });
        y += 2;
      },
      /** A displayed formula in a tinted box, its letters at the size of the text. */
      formula(src) {
        const rows = formulaRows(src, W() - 14);
        const h = rows.length * 6.6 + 4.4;
        ensure(h + 2);
        doc.setFillColor(...CC.tint).rect(margin, y - 4.6, W(), h, "F");
        doc.setFillColor(...CC.blue).rect(margin, y - 4.6, 1.2, h, "F");
        rows.forEach((row, k) => mathDraw(doc, mathParse(row), margin + 6, y + 1.9 + k * 6.6, MATH, CC.ink));
        y += h + 2.6;
      },
      /** Reference table: it may continue on the next page, repeating its header. */
      table(headers, rows, widths, opts = {}) {
        const g = gridLayout(doc, headers, widths, W(), opts);
        const colors = (k) => ({ head: CC.blue, grid: k < 0 ? CC.blue : CC.grid, fill: opts.zebra && k % 2 === 1 ? CC.zebra : [255, 255, 255], ink: CC.ink });
        const head = g.linesOf(headers, true);
        const hh = g.heightOf(head);
        let top = y - 4;   // tables are placed from their top edge
        const fresh = () => { newPage(); top = y - 4; };
        const first = rows.length ? g.heightOf(g.linesOf(rows[0], false)) : 0;
        if (top + hh + first > limit()) fresh(); else settle(0);
        gridRow(doc, g, margin, top, head, hh, true, colors(-1));
        top += hh;
        rows.forEach((row, k) => {
          const ls = g.linesOf(row, false);
          const h = g.heightOf(ls);
          if (top + h > limit()) { fresh(); gridRow(doc, g, margin, top, head, hh, true, colors(-1)); top += hh; }
          gridRow(doc, g, margin, top, ls, h, false, colors(k));
          top += h;
        });
        y = top + 8;
      },
      /**
       * Table to fill in: kept whole on one page; when it is the last thing on the page it grows
       * to the foot, with more blank rows (opts.more) or taller rows (up to opts.maxRow).
       */
      answerTable(headers, rows, widths, opts = {}) {
        const g = gridLayout(doc, headers, widths, W(), opts);
        const minRow = opts.minRow || 10;
        const head = g.linesOf(headers, true);
        const hh = g.heightOf(head);
        const hs = rows.map((r) => g.heightOf(g.linesOf(r, false), minRow));
        const total = hh + hs.reduce((s, h) => s + h, 0);
        ensure(total + 4 + plannedNext());
        const x0 = margin;
        const y0 = y - 4;
        y = y0 + total + 8 + growing((extra) => {
          const all = rows.slice();
          const heights = hs.slice();
          if (opts.more) {
            while (extra >= minRow && (!opts.maxRows || all.length < opts.maxRows)) { all.push(opts.more(all.length)); heights.push(minRow); extra -= minRow; }
          }
          if (extra > .5) {   // what is left goes to the height of the rows
            const add = Math.min(extra / all.length, (opts.maxRow || Infinity) - Math.min(...heights));
            for (let k = 0; k < heights.length; k += 1) heights[k] += Math.max(0, add);
          }
          let top = y0;
          gridRow(doc, g, x0, top, head, hh, true, { head: CC.blue, grid: CC.blue });
          top += hh;
          all.forEach((row, k) => { gridRow(doc, g, x0, top, g.linesOf(row, false), heights[k], false, { fill: [255, 255, 255], grid: CC.grid, ink: CC.ink }); top += heights[k]; });
        });
      },
      /** Writing lines: at least `min`; the last answer space on a page reaches its foot. */
      lines(min = 3, gap = 8, fixed = false) {
        const h = min * gap + 3;
        const draw = (extra) => {
          // as many lines as fit; the remainder is shared out, so the last line closes the space
          const n = min + Math.floor(extra / gap);
          const step = (min * gap + extra) / n;
          doc.setDrawColor(...CC.grid).setLineWidth(.2);
          for (let k = 1; k <= n; k += 1) doc.line(margin, y0 + k * step, pw() - margin, y0 + k * step);
        };
        ensure(h + (fixed ? 0 : plannedNext()));
        const y0 = y - 4;
        if (fixed) { draw(0); y = y0 + h + 4; return; }   // a signature line does not grow
        y = y0 + h + 4 + growing(draw);
      },
      /** The template diagram (not to scale); it grows into the room left at the foot of the page. */
      diagram(dd) {
        const maxW = Math.min(W(), 150);
        const maxH = 105;
        const minH = 52;
        const cap = 7;
        const h0 = dd.W * Math.min(maxW / dd.L, minH / dd.W);
        ensure(h0 + cap + 2 + plannedNext());
        const y0 = y - 3;
        y = y0 + h0 + cap + 6 + growing((extra) => {
          const avail = h0 + extra;
          const s = Math.min(maxW / dd.L, Math.min(maxH, avail) / dd.W);
          const w = dd.L * s;
          const h = dd.W * s;
          const top = y0 + Math.max(0, (avail - h) / 2);
          drawTemplate(doc, dd, margin + (W() - w) / 2, top, w, h);
          doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...CC.muted)
            .text(t("Esquema sin escala · naranja: recortar · azul discontinuo: plegar", "Diagram not to scale · orange: cut out · dashed blue: fold"), pw() / 2, top + h + 5, { align: "center" });
        });
      },
      page() { newPage(); },
      /** A section of contentFor: heading, then its blocks; the heading keeps the start of its content (or all of it). */
      section(s, dd) {
        const blocks = s.blocks || legacyBlocks(s);
        if (s.pageBreak) newPage();
        if (s.heading) {
          const full = blocks.reduce((sum, b) => sum + api.measure(b, false), 0);
          const keep = s.keepAll || blocks.some(([kind]) => kind === "lines" || kind === "fixedLines") ? full : (blocks.length ? api.measure(blocks[0], true) : 0);
          api.heading(s.heading, Math.min(keep, limit() - top0 - 20));
        }
        blocks.forEach(([kind, value]) => {
          if (kind === "p") api.paragraph(value);
          else if (kind === "bullets") api.bullets(value);
          else if (kind === "math") api.formula(value);
          else if (kind === "table") api.answerTable(value.headers, value.rows, value.widths, value);
          else if (kind === "diagram") api.diagram(dd);
          else if (kind === "lines") api.lines(value);
          else if (kind === "fixedLines") api.lines(value, 8, true);
        });
      },
      /** Height of a block (or of its first lines, when `start`), for the keep-with-heading rule. */
      measure([kind, value], start) {
        if (kind === "p") {
          const n = String(value).includes("$") ? richLines(value, BODY, W()).length : (body(), split(value).length);
          return (start ? Math.min(n, 3) : n) * lead(BODY) + 3;
        }
        if (kind === "bullets") {
          body();
          const hs = value.map((item) => split(item, W() - 6.5).length * lead(BODY) + 2.4);
          return start ? hs[0] : hs.reduce((s, h) => s + h, 0) + 2;
        }
        if (kind === "math") return formulaRows(value, W() - 14).length * 6.6 + 9;
        if (kind === "table") {
          const g = gridLayout(doc, value.headers, value.widths, W(), value);
          return g.heightOf(g.linesOf(value.headers, true)) + value.rows.reduce((s, r) => s + g.heightOf(g.linesOf(r, false), value.minRow || 10), 0) + 4;
        }
        if (kind === "diagram") return 52 + 9;
        if (kind === "lines" || kind === "fixedLines") return value * 8 + 3;
        return 0;
      },
      /** End of the document: the last answer space fills the page. Returns the room found for the second pass. */
      finish() { closePage(); return record; }
    };

    function legacyBlocks(s) {
      const out = [];
      if (s.formula && s.formulaFirst) out.push(["math", s.formula]);
      (s.paragraphs || []).forEach((p) => out.push(["p", p]));
      if (s.bullets) out.push(["bullets", s.bullets]);
      if (s.formula && !s.formulaFirst) out.push(["math", s.formula]);
      if (s.table) out.push(["table", s.table]);
      if (s.template) out.push(["diagram", true]);
      if (s.lines) out.push([s.fixedLines ? "fixedLines" : "lines", s.lines]);
      return out;
    }
    return api;
  }

  /** Cut-and-fold diagram of the box (in the dossiers). */
  function drawTemplate(doc, d, x0, y0, w, h) {
    const c = d.x * w / d.L;
    doc.setFillColor(255, 250, 240).setDrawColor(32, 42, 61).setLineWidth(.3).rect(x0, y0, w, h, "FD");
    doc.setDrawColor(19, 133, 174).setLineDashPattern([2, 1.5], 0);
    doc.line(x0 + c, y0, x0 + c, y0 + h); doc.line(x0 + w - c, y0, x0 + w - c, y0 + h);
    doc.line(x0, y0 + c, x0 + w, y0 + c); doc.line(x0, y0 + h - c, x0 + w, y0 + h - c);
    doc.setLineDashPattern([], 0).setDrawColor(231, 121, 36).setLineWidth(.4);
    [[x0, y0], [x0 + w - c, y0], [x0, y0 + h - c], [x0 + w - c, y0 + h - c]].forEach(([x1, y1]) => { doc.line(x1, y1, x1 + c, y1 + c); doc.line(x1 + c, y1, x1, y1 + c); });
    doc.setLineWidth(.2);
  }

  async function buildZip(files) {
    const zip = new window.JSZip();
    files.forEach((file) => zip.file(file.fileName, file.blob));
    return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }

  function showFiles(files, bundles, complete, guide, separateZip, bundleZip) {
    const all = [...files, ...bundles, complete, separateZip, bundleZip];
    all.forEach((file) => { file.url = URL.createObjectURL(file.blob); state.urls.push(file.url); });
    els.completePdf.href = complete.url;
    els.completePdf.download = complete.fileName;
    els.completePdf.classList.remove("cc-hidden");
    if (els.printGuide) {
      els.printGuide.href = guide.url;
      els.printGuide.download = guide.fileName;
      els.printGuide.classList.remove("cc-hidden");
    }
    const slides = files.find((file) => file.id === "slides");
    els.bundles.innerHTML = [bundleZip, slides, ...bundles].filter(Boolean).map((file, index) => fileRow(file, index === 0)).join("");
    els.docList.innerHTML = fileRow(separateZip, true) + files.map((file) => fileRow(file, false, file.teacher ? `${file.label} · ${t("Profesorado", "Teacher only")}` : file.label)).join("");
    els.documents.classList.remove("cc-hidden");
    activateTab("popcorn-panel-bundles");
  }

  function fileRow(file, primary, titleOverride) {
    const title = titleOverride || file.label;
    const safeTitle = escapeHtml(title);
    return `<div class="cc-file-row${primary ? " cc-primary" : ""}"><span class="cc-file-title">${safeTitle}</span><span class="cc-file-actions"><a class="cc-file-icon" href="${file.url}" target="_blank" rel="noopener" title="${t("Ver", "View")} ${safeTitle}" aria-label="${t("Ver", "View")} ${safeTitle}">${iconEye()}</a><a class="cc-file-icon" href="${file.url}" download="${escapeHtml(file.fileName)}" title="${t("Descargar", "Download")} ${safeTitle}" aria-label="${t("Descargar", "Download")} ${safeTitle}">${iconDownload()}</a></span></div>`;
  }

  function iconEye() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
  }

  function iconDownload() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke-width="2" stroke-linecap="round"/><path d="m7 10 5 5 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function clearFiles() {
    state.urls.forEach((url) => URL.revokeObjectURL(url));
    state.urls = [];
    if (els.docList) els.docList.innerHTML = "";
    if (els.bundles) els.bundles.innerHTML = "";
    [els.completePdf, els.printGuide].forEach((link) => {
      if (!link) return;
      link.classList.add("cc-hidden");
      link.removeAttribute("href");
      link.removeAttribute("download");
    });
    if (els.documents) els.documents.classList.add("cc-hidden");
  }

  function activateTab(targetId) {
    els.tabButtons.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.ccTabTarget === targetId));
    });
    els.tabPanels.forEach((panel) => { panel.hidden = panel.id !== targetId; });
  }

  function setBusy(busy) { els.generate.disabled = busy; els.generate.textContent = busy ? t("Generando…", "Generating…") : t("Generar actividad", "Generate activity"); }
  function setStatus(message, error) { els.status.textContent = message; els.status.classList.toggle("cc-error", Boolean(error)); }
  /** Decimal point in both languages, as in the book (ESTANDAR_WEB_ACTIVIDADES.md, 4). */
  function fmt(value, decimals) { return Number(value).toFixed(decimals); }
  function clean(value) { return String(value || "").trim().replace(/\s+/g, " "); }
  function stem(value) { return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "document"; }
  function dimsStem(d) { return `${String(d.L).replace(".", "-")}x${String(d.W).replace(".", "-")}mm`; }
  function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]); }

  window.PopcornBoxCase = { calculate(L, W) { const disc = Math.sqrt(L * L - L * W + W * W); const x = (L + W - disc) / 6; return { x, baseL: L - 2 * x, baseW: W - 2 * x, volume: x * (L - 2 * x) * (W - 2 * x) }; }, limits: LIMITS };
  init();
})();
