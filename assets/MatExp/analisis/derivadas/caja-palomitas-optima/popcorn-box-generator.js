(function () {
  "use strict";

  const root = document.querySelector(".popcorn-case");
  if (!root) return;

  const isEnglish = (root.dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en");
  const t = (es, en) => isEnglish ? en : es;
  const LIMITS = { min: 50, max: 1000 };
  const state = { urls: [] };
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

  const DOCS = [
    { id: "case", title: t("Apertura del expediente", "Case file opening"), description: t("Contexto, pregunta central, reglas y reparto de la actividad.", "Context, central question, rules, and activity setup.") },
    { id: "advert", title: t("Campaña publicitaria de la empresa", "Company advertising campaign"), description: t("El anuncio que contiene la afirmación de capacidad máxima.", "The advertisement containing the maximum-capacity claim.") },
    { id: "complaint", title: t("Reclamación de la asociación de consumidores", "Consumer association complaint"), description: t("La reclamación formal por posible publicidad engañosa.", "The formal complaint alleging potentially misleading advertising.") },
    { id: "patent", title: t("Solicitud de patente ficticia", "Fictional patent application"), description: t("Memoria técnica, reivindicaciones y esquema del diseño de la empresa.", "Technical description, claims, and diagram of the company design.") },
    { id: "investigation", title: t("Dossier de investigación del alumnado", "Student investigation dossier"), description: t("Guion para modelar, derivar, justificar y emitir un veredicto.", "Guide for modelling, differentiating, justifying, and reaching a verdict.") },
    { id: "measurement", title: t("Acta de construcción y medición", "Construction and measurement record"), description: t("Tabla para prototipos, mediciones y comparación con la predicción.", "Table for prototypes, measurements, and comparison with the prediction.") },
    { id: "template", title: t("Plantilla óptima a tamaño real", "Full-size optimal template"), description: t("Página PDF del tamaño exacto del papel, preparada para imprimir al 100 %.", "A PDF page matching the exact sheet size, ready to print at 100%."), template: true },
    { id: "teacher", title: t("Solución y guía del profesorado", "Teacher solution and guide"), description: t("Cálculo completo para el tamaño seleccionado, verificación y sugerencias didácticas.", "Full calculation for the selected size, verification, and teaching notes."), teacher: true }
  ];

  function init() {
    Object.assign(els, {
      form: document.getElementById("popcorn-form"),
      paper: document.getElementById("paper-size"),
      length: document.getElementById("paper-length"),
      width: document.getElementById("paper-width"),
      company: document.getElementById("company-name"),
      course: document.getElementById("course-name"),
      status: document.getElementById("popcorn-status"),
      summary: document.getElementById("popcorn-summary"),
      preview: document.getElementById("popcorn-preview"),
      documents: document.getElementById("popcorn-documents"),
      docList: document.getElementById("popcorn-doc-list"),
      bundles: document.getElementById("popcorn-bundles"),
      generate: document.getElementById("popcorn-generate"),
      clear: document.getElementById("popcorn-clear")
    });

    els.paper.addEventListener("change", applyPreset);
    [els.length, els.width, els.company, els.course].forEach((el) => {
      el.addEventListener("input", updateLive);
      el.addEventListener("change", updateLive);
    });
    els.form.addEventListener("submit", generate);
    els.clear.addEventListener("click", clearFiles);
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
      drawPreview(data);
      setStatus("");
    } catch (error) {
      els.summary.innerHTML = "";
      els.preview.innerHTML = `<p class="pc-error">${escapeHtml(error.message)}</p>`;
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
    return { L, W, company, course, disc, x, otherRoot, baseL, baseW, volume, maxCut, paper: els.paper.options[els.paper.selectedIndex].text };
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
    els.summary.innerHTML = rows.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join("");
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

      const files = DOCS.map((spec) => spec.template ? buildTemplateFile(data) : buildDocumentFile(spec, data));
      const bundleFiles = [
        buildPacket("student", t("Dossier del alumnado", "Student packet"), ["case", "advert", "complaint", "investigation", "measurement"], data),
        buildPacket("company", t("Equipo de la empresa", "Company team"), ["case", "advert", "patent", "measurement"], data),
        buildPacket("consumers", t("Asociación de consumidores", "Consumer association"), ["case", "complaint", "investigation", "measurement"], data),
        buildPacket("teacher", t("Paquete del profesorado", "Teacher packet"), ["case", "advert", "complaint", "patent", "investigation", "measurement", "teacher"], data)
      ];
      const complete = buildPacket("complete", t("Expediente completo", "Complete case file"), DOCS.filter((d) => !d.template).map((d) => d.id), data);
      const zip = await buildZip(files);
      const zipFile = { id: "zip", label: t("ZIP de documentos separados", "ZIP of separate documents"), fileName: `${stem(data.company)}_${t("documentos", "documents")}.zip`, blob: zip };
      showFiles(files, bundleFiles, complete, zipFile);
      setStatus(t(`Listo: ${files.length} documentos, 4 paquetes y el expediente completo.`, `Done: ${files.length} documents, 4 packets, and the complete case file.`));
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
  }

  function buildDocumentFile(spec, data) {
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    renderDocument(doc, spec, data, true);
    return { id: spec.id, label: spec.title, description: spec.description, fileName: `${numberFor(spec.id)}_${stem(spec.title)}_${dimsStem(data)}.pdf`, blob: doc.output("blob") };
  }

  function buildPacket(id, label, ids, data) {
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    ids.forEach((docId, index) => {
      if (index) doc.addPage("a4", "portrait");
      renderDocument(doc, DOCS.find((item) => item.id === docId), data, false);
    });
    addFooters(doc, label);
    return { id, label, fileName: `${stem(label)}_${dimsStem(data)}.pdf`, blob: doc.output("blob") };
  }

  function buildTemplateFile(data) {
    const landscape = data.L >= data.W;
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: [data.L, data.W], orientation: landscape ? "landscape" : "portrait", compress: true });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const sheetL = data.L;
    const sheetW = data.W;
    const sx = pw / sheetL;
    const sy = ph / sheetW;
    const cx = data.x * sx;
    const cy = data.x * sy;
    doc.setDrawColor(32, 42, 61).setLineWidth(.45).rect(.5, .5, pw - 1, ph - 1);
    doc.setDrawColor(19, 133, 174).setLineDashPattern([3, 2], 0).setLineWidth(.35);
    doc.line(cx, 0, cx, ph); doc.line(pw - cx, 0, pw - cx, ph);
    doc.line(0, cy, pw, cy); doc.line(0, ph - cy, pw, ph - cy);
    doc.setLineDashPattern([], 0).setDrawColor(231, 121, 36).setLineWidth(.6);
    [[0, 0, cx, cy], [pw - cx, 0, pw, cy], [0, ph - cy, cx, ph], [pw - cx, ph - cy, pw, ph]].forEach(([x1, y1, x2, y2]) => {
      doc.line(x1, y1, x2, y2); doc.line(x2, y1, x1, y2);
    });
    doc.setTextColor(32, 42, 61).setFont("helvetica", "bold").setFontSize(Math.max(8, Math.min(16, ph / 16)));
    doc.text(t("PLANTILLA ÓPTIMA", "OPTIMAL TEMPLATE"), pw / 2, ph / 2 - 4, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(Math.max(6, Math.min(10, ph / 24)));
    doc.text(`${fmt(data.L, 1)} × ${fmt(data.W, 1)} mm · x = ${fmt(data.x, 2)} mm`, pw / 2, ph / 2 + 2, { align: "center" });
    doc.text(t("Naranja: recortar las esquinas · Azul discontinuo: plegar", "Orange: remove corners · Dashed blue: fold"), pw / 2, ph / 2 + 8, { align: "center" });
    doc.setFontSize(Math.max(5, Math.min(8, ph / 30)));
    doc.text(t("Imprimir al 100 %, sin ajustar a página. Verifica la medida indicada antes de cortar.", "Print at 100%, without fit-to-page. Verify the stated measurement before cutting."), pw / 2, ph - 4, { align: "center" });
    return { id: "template", label: DOCS.find((d) => d.id === "template").title, description: DOCS.find((d) => d.id === "template").description, fileName: `07_${t("plantilla_optima", "optimal_template")}_${dimsStem(data)}.pdf`, blob: doc.output("blob") };
  }

  function renderDocument(doc, spec, data, standalone) {
    const writer = createWriter(doc);
    writer.title(spec.title, t("Calculus Cases · Caso 3", "Calculus Cases · Case 3"));
    writer.meta([
      [t("Empresa", "Company"), data.company],
      [t("Papel", "Sheet"), `${fmt(data.L, 1)} × ${fmt(data.W, 1)} mm`],
      [t("Curso", "Course"), data.course]
    ]);
    const sections = contentFor(spec.id, data);
    sections.forEach((section) => {
      if (section.pageBreak) writer.pageBreak();
      if (section.heading) writer.heading(section.heading);
      (section.paragraphs || []).forEach((p) => writer.paragraph(p));
      if (section.bullets) writer.bullets(section.bullets);
      if (section.formula) writer.formula(section.formula);
      if (section.table) writer.table(section.table.headers, section.table.rows, section.table.widths);
      if (section.template) writer.templateDiagram(data);
      if (section.lines) writer.answerLines(section.lines);
    });
    if (standalone) writer.footerAll(spec.title);
  }

  function contentFor(id, d) {
    const Vpoly = `V(x) = x(${fmt(d.L, 1)} - 2x)(${fmt(d.W, 1)} - 2x) = 4x³ - ${fmt(2 * (d.L + d.W), 1)}x² + ${fmt(d.L * d.W, 1)}x`;
    const deriv = `V'(x) = 12x² - ${fmt(4 * (d.L + d.W), 1)}x + ${fmt(d.L * d.W, 1)}`;
    const root = `x* = [${fmt(d.L + d.W, 1)} - sqrt(${fmt(d.L * d.L - d.L * d.W + d.W * d.W, 1)})] / 6 = ${fmt(d.x, 3)} mm`;
    const common = {
      case: [
        { heading: t("El encargo", "The brief"), paragraphs: [t(`${d.company} anuncia una nueva caja con el lema «La caja de mayor capacidad: más palomitas con el mismo cartón». Una asociación de consumidores ha presentado una reclamación por posible publicidad engañosa.`, `${d.company} is advertising a new box with the slogan “The greatest-capacity box: more popcorn from the same cardstock.” A consumer association has filed a complaint alleging potentially misleading advertising.`)] },
        { heading: t("Pregunta central", "Central question"), paragraphs: [t(`A partir de una hoja rectangular de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm, se recortan cuatro cuadrados iguales y se pliegan las paredes. ¿Qué lado deben tener los cuadrados para maximizar el volumen? ¿Respalda el cálculo la afirmación de la empresa?`, `Starting with a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm rectangular sheet, four equal squares are removed and the sides are folded. What side length maximizes volume? Does the calculation support the company claim?`)] },
        { heading: t("Organización sugerida", "Suggested setup"), bullets: [t("Equipos de 2 a 4 estudiantes; duración aproximada: 75–100 minutos.", "Teams of 2–4 students; approximate duration: 75–100 minutes."), t("Separar los roles de empresa, asociación de consumidores y comisión evaluadora.", "Assign company, consumer association, and review-panel roles."), t("El veredicto debe incluir un modelo, una justificación matemática y datos de al menos un prototipo.", "The verdict must include a model, mathematical justification, and data from at least one prototype.")] }
      ],
      advert: [
        { heading: t("Pieza publicitaria aportada como prueba A", "Advertisement submitted as Exhibit A"), paragraphs: [t(`${d.company} presenta su caja de ${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} × ${fmt(d.x, 1)} mm como resultado de un diseño matemático que aprovecha al máximo cada hoja de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm.`, `${d.company} presents its ${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} × ${fmt(d.x, 1)} mm box as a mathematically designed product that makes maximum use of every ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet.`)] },
        { heading: t("Afirmaciones de campaña", "Campaign claims"), bullets: [t("«La caja de mayor capacidad posible con esta hoja».", "“The greatest possible capacity from this sheet.”"), t(`Capacidad anunciada: ${fmt(d.volume / 1000, 1)} mL.`, `Advertised capacity: ${fmt(d.volume / 1000, 1)} mL.`), t("Sin añadir material, solapas ni uniones que alteren el rectángulo inicial.", "No added material, tabs, or joints that alter the original rectangle.")] },
        { heading: t("Nota probatoria", "Evidence note"), paragraphs: [t("Documento ficticio creado exclusivamente para la actividad educativa. La afirmación debe ser verificada por el alumnado.", "Fictional document created solely for this educational activity. Students must verify the claim.")] }
      ],
      complaint: [
        { heading: t("Objeto de la reclamación", "Subject of the complaint"), paragraphs: [t(`La asociación solicita que ${d.company} demuestre que el corte elegido produce realmente el máximo global dentro de todos los cortes físicamente posibles. Una prueba basada solo en unos pocos prototipos no se considera suficiente.`, `The association asks ${d.company} to prove that its selected cut produces the global maximum among all physically possible cuts. Evidence based only on a few prototypes is not considered sufficient.`)] },
        { heading: t("Cuestiones que deben resolverse", "Questions to be resolved"), bullets: [t("¿Se ha definido correctamente el dominio físico?", "Has the physical domain been defined correctly?"), t("¿Se han considerado todos los puntos críticos y los extremos?", "Have all critical points and endpoints been considered?"), t("¿Coincide la capacidad anunciada con el volumen matemático y con las mediciones?", "Does the advertised capacity match both the mathematical volume and the measurements?"), t("¿Qué tolerancia de fabricación sería razonable?", "What manufacturing tolerance would be reasonable?")] },
        { heading: t("Petición", "Requested remedy"), paragraphs: [t("Si el claim no queda demostrado, se solicita retirar o matizar la expresión «mayor capacidad posible». La comisión evaluadora emitirá el veredicto.", "If the claim is not proven, the phrase “greatest possible capacity” should be withdrawn or qualified. The review panel will issue the verdict.")] }
      ],
      patent: [
        { heading: t("Solicitud educativa de patente · No es un documento legal", "Educational patent application · Not a legal document"), paragraphs: [t(`Solicitante: ${d.company}. Título: Recipiente abierto optimizado a partir de una lámina rectangular mediante cuatro recortes cuadrados congruentes.`, `Applicant: ${d.company}. Title: Optimized open container formed from a rectangular sheet using four congruent square cut-outs.`)] },
        { heading: t("Descripción", "Description"), paragraphs: [t(`La invención propuesta parte de una lámina de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Se eliminan cuadrados de lado ${fmt(d.x, 2)} mm y se pliegan las cuatro bandas restantes para producir una base de ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `The proposed invention starts from a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet. Squares with side ${fmt(d.x, 2)} mm are removed and the four remaining strips are folded to produce a ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base.`)] },
        { heading: t("Reivindicaciones", "Claims"), bullets: [t("Un recipiente abierto construido sin añadir material a la lámina inicial.", "An open container made without adding material to the initial sheet."), t("Cuatro recortes cuadrados congruentes, uno en cada esquina.", "Four congruent square cut-outs, one at each corner."), t(`Un volumen teórico máximo de ${fmt(d.volume / 1000, 2)} mL para las dimensiones indicadas.`, `A theoretical maximum volume of ${fmt(d.volume / 1000, 2)} mL for the stated dimensions.`)] },
        { template: true }
      ],
      investigation: [
        { heading: t("1. Construcción del modelo", "1. Build the model"), paragraphs: [t("Llama x al lado de cada cuadrado recortado. Escribe las dimensiones de la base y la altura después del plegado.", "Let x be the side length of each removed square. Write the base dimensions and height after folding.")], lines: 4 },
        { heading: t("2. Dominio y función objetivo", "2. Domain and objective function"), paragraphs: [t("Explica qué valores de x producen una caja físicamente posible y formula V(x).", "Explain which x-values produce a physically possible box and formulate V(x).")], lines: 5 },
        { heading: t("3. Optimización", "3. Optimization"), paragraphs: [t("Calcula V'(x), encuentra los puntos críticos, descarta los no factibles y compara con los extremos del intervalo.", "Compute V'(x), find critical points, reject infeasible ones, and compare with the interval endpoints.")], lines: 7 },
        { pageBreak: true, heading: t("4. Evidencia y veredicto", "4. Evidence and verdict"), paragraphs: [t("Construye al menos un prototipo, mide su capacidad y decide si el claim queda respaldado. Distingue error de medida y error del modelo.", "Build at least one prototype, measure its capacity, and decide whether the claim is supported. Distinguish measurement error from modelling error.")], lines: 6 }
      ],
      measurement: [
        { heading: t("Registro de prototipos", "Prototype record"), paragraphs: [t("Anota todas las medidas en milímetros y los volúmenes en mililitros. Para comparar con el modelo, recuerda que 1000 mm³ = 1 mL.", "Record all lengths in millimetres and volumes in millilitres. To compare with the model, remember that 1000 mm³ = 1 mL.")] },
        { table: { headers: ["x (mm)", t("Base (mm)", "Base (mm)"), t("V teórico (mL)", "Theoretical V (mL)"), t("V medido (mL)", "Measured V (mL)"), t("Error %", "Error %")], rows: Array.from({ length: 7 }, (_, i) => i === 0 ? [fmt(d.x, 2), `${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)}`, fmt(d.volume / 1000, 2), "", ""] : ["", "", "", "", ""]), widths: [25, 38, 40, 40, 27] } },
        { heading: t("Observaciones de fabricación", "Manufacturing observations"), lines: 7 }
      ],
      teacher: [
        { heading: t("Modelo para el tamaño seleccionado", "Model for the selected size"), formula: Vpoly, paragraphs: [t(`El dominio físico es 0 <= x <= ${fmt(d.maxCut, 3)} mm. En los extremos el volumen vale 0.`, `The physical domain is 0 <= x <= ${fmt(d.maxCut, 3)} mm. Volume is 0 at both endpoints.`)] },
        { heading: t("Puntos críticos", "Critical points"), formula: deriv, paragraphs: [t(`Las raíces son ${fmt(d.x, 3)} mm y ${fmt(d.otherRoot, 3)} mm. La segunda queda fuera del dominio físico.`, `The roots are ${fmt(d.x, 3)} mm and ${fmt(d.otherRoot, 3)} mm. The second lies outside the physical domain.`)], bullets: [root] },
        { heading: t("Comprobación del máximo global", "Global maximum check"), paragraphs: [t(`V(0)=0; V(${fmt(d.x, 3)})=${fmt(d.volume, 1)} mm³=${fmt(d.volume / 1000, 3)} mL; V(${fmt(d.maxCut, 3)})=0. Además, V''(x*)=${fmt(24 * d.x - 4 * (d.L + d.W), 3)}<0. Por el método del intervalo cerrado, x* produce el máximo global.`, `V(0)=0; V(${fmt(d.x, 3)})=${fmt(d.volume, 1)} mm³=${fmt(d.volume / 1000, 3)} mL; V(${fmt(d.maxCut, 3)})=0. Also, V''(x*)=${fmt(24 * d.x - 4 * (d.L + d.W), 3)}<0. By the closed-interval method, x* gives the global maximum.`)] },
        { heading: t("Dimensiones finales y veredicto", "Final dimensions and verdict"), bullets: [t(`Recorte: ${fmt(d.x, 2)} mm.`, `Cut: ${fmt(d.x, 2)} mm.`), t(`Base: ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `Base: ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`), t(`Altura: ${fmt(d.x, 2)} mm.`, `Height: ${fmt(d.x, 2)} mm.`), t(`Volumen máximo: ${fmt(d.volume / 1000, 2)} mL.`, `Maximum volume: ${fmt(d.volume / 1000, 2)} mL.`), t("El claim es matemáticamente defendible dentro del modelo indicado: hoja rectangular fija, cuatro cuadrados iguales, caja abierta y sin material adicional.", "The claim is mathematically defensible within the stated model: fixed rectangular sheet, four equal squares, open box, and no additional material.")] },
        { pageBreak: true, heading: t("Guía didáctica", "Teaching guide"), bullets: [t("Duración sugerida: 15 min de apertura, 35–45 min de investigación, 20 min de preparación y 15–20 min de audiencia.", "Suggested timing: 15 min launch, 35–45 min investigation, 20 min preparation, and 15–20 min hearing."), t("No entregar esta solución hasta que cada equipo haya fijado su modelo y su dominio.", "Do not distribute this solution until each team has fixed its model and domain."), t("Aceptar pequeñas diferencias experimentales causadas por grosor, pliegues, pérdida de material y lectura del volumen.", "Allow small experimental differences caused by thickness, folds, material loss, and volume readings."), t("Para ampliar: estudiar sensibilidad, coste superficial, cajas con tapa o recortes no cuadrados.", "Extensions: study sensitivity, surface cost, boxes with lids, or non-square cut-outs.")] },
        { template: true }
      ]
    };
    return common[id] || [];
  }

  function createWriter(doc) {
    const margin = 18;
    const bottom = 18;
    let y = 18;
    function ensure(h) { if (y + h > doc.internal.pageSize.getHeight() - bottom) { doc.addPage("a4", "portrait"); y = 18; } }
    function lines(text, width = 174) { return doc.splitTextToSize(String(text), width); }
    return {
      title(title, kicker) {
        doc.setFillColor(19, 133, 174).rect(0, 0, 210, 35, "F");
        doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(9).text(kicker.toUpperCase(), margin, 11);
        doc.setFontSize(20).text(lines(title, 170), margin, 21);
        y = 43; doc.setTextColor(32, 42, 61);
      },
      meta(rows) {
        doc.setFontSize(8.5);
        rows.forEach(([label, value]) => { doc.setFont("helvetica", "bold").text(`${label}:`, margin, y); doc.setFont("helvetica", "normal").text(lines(value, 135), margin + 31, y); y += 5; });
        y += 3;
      },
      heading(text) { ensure(12); doc.setTextColor(11, 96, 127).setFont("helvetica", "bold").setFontSize(13).text(lines(text), margin, y); y += 8; doc.setTextColor(32, 42, 61); },
      paragraph(text) { const ls = lines(text); ensure(ls.length * 5 + 4); doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(45, 49, 55).text(ls, margin, y); y += ls.length * 5 + 4; },
      bullets(items) { items.forEach((item) => { const ls = lines(item, 166); ensure(ls.length * 5 + 3); doc.setFillColor(231, 121, 36).circle(margin + 1.5, y - 1.2, 1.1, "F"); doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(45, 49, 55).text(ls, margin + 6, y); y += ls.length * 5 + 3; }); y += 2; },
      formula(text) { const ls = lines(text, 160); ensure(ls.length * 7 + 10); doc.setFillColor(247, 242, 229).roundedRect(margin, y - 4, 174, ls.length * 7 + 6, 2, 2, "F"); doc.setFont("courier", "bold").setFontSize(10.5).setTextColor(32, 42, 61).text(ls, 23, y + 2); y += ls.length * 7 + 8; },
      table(headers, rows, widths) { const rowH = 10; ensure((rows.length + 1) * rowH + 5); let x = margin; doc.setFontSize(7.5); headers.forEach((h, i) => { doc.setFillColor(19, 133, 174).setDrawColor(255).rect(x, y, widths[i], rowH, "FD"); doc.setTextColor(255).setFont("helvetica", "bold").text(lines(h, widths[i] - 3), x + 1.5, y + 4); x += widths[i]; }); y += rowH; rows.forEach((row) => { x = margin; row.forEach((cell, i) => { doc.setFillColor(255).setDrawColor(210).rect(x, y, widths[i], rowH, "FD"); doc.setTextColor(45).setFont("helvetica", "normal").text(lines(cell, widths[i] - 3), x + 1.5, y + 4); x += widths[i]; }); y += rowH; }); y += 5; },
      answerLines(count) { ensure(count * 7 + 4); doc.setDrawColor(190); for (let i = 0; i < count; i += 1) { doc.line(margin, y, 192, y); y += 7; } y += 3; },
      templateDiagram(d) { ensure(82); const maxW = 150, maxH = 72, scale = Math.min(maxW / d.L, maxH / d.W), w = d.L * scale, h = d.W * scale, x0 = (210 - w) / 2, c = d.x * scale; doc.setFillColor(255, 250, 240).setDrawColor(32, 42, 61).rect(x0, y, w, h, "FD"); doc.setDrawColor(19, 133, 174).setLineDashPattern([2, 1.5], 0); doc.line(x0 + c, y, x0 + c, y + h); doc.line(x0 + w - c, y, x0 + w - c, y + h); doc.line(x0, y + c, x0 + w, y + c); doc.line(x0, y + h - c, x0 + w, y + h - c); doc.setLineDashPattern([], 0).setDrawColor(231, 121, 36); [[x0,y],[x0+w-c,y],[x0,y+h-c],[x0+w-c,y+h-c]].forEach(([x1,y1]) => { doc.line(x1,y1,x1+c,y1+c); doc.line(x1+c,y1,x1,y1+c); }); y += h + 9; },
      pageBreak() { doc.addPage("a4", "portrait"); y = 18; },
      footerAll(label) { const pages = doc.getNumberOfPages(); for (let p = 1; p <= pages; p += 1) { doc.setPage(p); const h = doc.internal.pageSize.getHeight(); doc.setDrawColor(220).line(margin, h - 12, 192, h - 12); doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(100).text(`${label} · ${t("Material educativo ficticio", "Fictional educational material")}`, margin, h - 7); doc.text(`${p}/${pages}`, 192, h - 7, { align: "right" }); } }
    };
  }

  function addFooters(doc, label) {
    const margin = 18;
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      const h = doc.internal.pageSize.getHeight();
      doc.setDrawColor(220).line(margin, h - 12, 192, h - 12);
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(100)
        .text(`${label} · ${t("Material educativo ficticio", "Fictional educational material")}`, margin, h - 7);
      doc.text(`${p}/${pages}`, 192, h - 7, { align: "right" });
    }
  }

  async function buildZip(files) {
    const zip = new window.JSZip();
    files.forEach((file) => zip.file(file.fileName, file.blob));
    return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }

  function showFiles(files, bundles, complete, zip) {
    const all = [...files, ...bundles, complete, zip];
    all.forEach((file) => { file.url = URL.createObjectURL(file.blob); state.urls.push(file.url); });
    els.bundles.innerHTML = [...bundles, complete, zip].map((file, index) => downloadLink(file, index === bundles.length)).join("");
    els.docList.innerHTML = DOCS.map((spec) => {
      const file = files.find((item) => item.id === spec.id);
      const warning = spec.teacher ? `<p><strong>${t("Uso reservado al profesorado.", "For teacher use only.")}</strong></p>` : "";
      return `<details><summary>${escapeHtml(spec.title)}</summary><div class="pc-doc-body"><p>${escapeHtml(spec.description)}</p>${warning}<div class="pc-doc-actions"><a class="pc-download" href="${file.url}" target="_blank" rel="noopener">${t("Ver PDF", "View PDF")}</a><a class="pc-download" href="${file.url}" download="${escapeHtml(file.fileName)}">${t("Descargar", "Download")}</a></div></div></details>`;
    }).join("");
    els.documents.classList.remove("pc-hidden");
  }

  function downloadLink(file, primary) {
    return `<a class="pc-download${primary ? " pc-primary" : ""}" href="${file.url}" download="${escapeHtml(file.fileName)}">${escapeHtml(file.label)}</a>`;
  }

  function clearFiles() {
    state.urls.forEach((url) => URL.revokeObjectURL(url));
    state.urls = [];
    if (els.docList) els.docList.innerHTML = "";
    if (els.bundles) els.bundles.innerHTML = "";
    if (els.documents) els.documents.classList.add("pc-hidden");
  }

  function setBusy(busy) { els.generate.disabled = busy; els.generate.textContent = busy ? t("Generando…", "Generating…") : t("Generar actividad", "Generate activity"); }
  function setStatus(message, error) { els.status.textContent = message; els.status.classList.toggle("pc-error", Boolean(error)); }
  function fmt(value, decimals) { return new Intl.NumberFormat(isEnglish ? "en-US" : "es-ES", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value); }
  function clean(value) { return String(value || "").trim().replace(/\s+/g, " "); }
  function stem(value) { return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "document"; }
  function dimsStem(d) { return `${String(d.L).replace(".", "-")}x${String(d.W).replace(".", "-")}mm`; }
  function numberFor(id) { return String(DOCS.findIndex((d) => d.id === id) + 1).padStart(2, "0"); }
  function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]); }

  window.PopcornBoxCase = { calculate(L, W) { const disc = Math.sqrt(L * L - L * W + W * W); const x = (L + W - disc) / 6; return { x, baseL: L - 2 * x, baseW: W - 2 * x, volume: x * (L - 2 * x) * (W - 2 * x) }; }, limits: LIMITS };
  init();
})();
