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

  const DOCS = [
    { id: "case", title: t("Apertura del expediente", "Case file opening"), description: t("Contexto, pregunta central, reglas y reparto de la actividad.", "Context, central question, rules, and activity setup.") },
    { id: "advert", title: t("Campaña publicitaria de la empresa", "Company advertising campaign"), description: t("El anuncio que contiene la afirmación de capacidad máxima.", "The advertisement containing the maximum-capacity claim.") },
    { id: "complaint", title: t("Reclamación de la asociación de consumidores", "Consumer association complaint"), description: t("Registro de entrada que impugna las dimensiones registradas como óptimas.", "Entry-register filing challenging the dimensions registered as optimal.") },
    { id: "patent", title: t("Solicitud de patente ficticia", "Fictional patent application"), description: t("Registro docente de la solución óptima, con memoria, reivindicación y plano técnico.", "Teaching-office registration of the optimal solution, with abstract, claim, and technical plan.") },
    { id: "investigation", title: t("Dossier del equipo de empresa", "Company team dossier"), description: t("Tareas separadas para construir la caja óptima y justificarla mediante cálculo.", "Separate tasks for building the optimal box and proving it with calculus.") },
    { id: "measurement", title: t("Dossier de la Asociación de Consumidores", "Consumer Association dossier"), description: t("Construcción de prototipos, tabla de volúmenes y preparación de la prueba empírica.", "Prototype construction, volume table, and preparation of the empirical test.") },
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
      completePdf: document.getElementById("popcorn-complete-pdf"),
      tabButtons: Array.from(document.querySelectorAll("[data-pc-tab-target]")),
      tabPanels: Array.from(document.querySelectorAll(".pc-tab-panel")),
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
    els.tabButtons.forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.pcTabTarget)));
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
      await loadVisualAssets();

      const files = DOCS.map((spec) => spec.template ? buildTemplateFile(data) : buildDocumentFile(spec, data));
      const bundleFiles = [
        buildPacket("consumers", t("Asociación de consumidores", "Consumer Association"), ["case", "complaint", "measurement"], data),
        buildPacket("company", t("Equipo de la empresa", "Company team"), ["case", "advert", "patent", "investigation"], data),
        buildPacket("teacher", t("Paquete del profesorado", "Teacher packet"), ["case", "advert", "complaint", "patent", "investigation", "measurement", "teacher"], data)
      ];
      const complete = buildPacket("complete", t("Expediente completo", "Complete case file"), DOCS.filter((d) => !d.template).map((d) => d.id), data);
      const [separateZip, bundleZip] = await Promise.all([buildZip(files), buildZip(bundleFiles)]);
      const separateZipFile = { id: "separate-zip", label: t("Todos los documentos separados · ZIP", "All separate documents · ZIP"), fileName: `${stem(data.company)}_${t("documentos_separados", "separate_documents")}.zip`, blob: separateZip };
      const bundleZipFile = { id: "bundle-zip", label: t("Todos los paquetes por rol · ZIP", "All role packets · ZIP"), fileName: `${stem(data.company)}_${t("paquetes_por_rol", "role_packets")}.zip`, blob: bundleZip };
      showFiles(files, bundleFiles, complete, separateZipFile, bundleZipFile);
      setStatus(t(`Listo: ${files.length} documentos, 3 paquetes por rol y el expediente completo.`, `Done: ${files.length} documents, 3 role packets, and the complete case file.`));
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
    if (spec.id === "advert" && state.visuals.advertisement) {
      doc.addImage(state.visuals.advertisement, "PNG", 0, 0, 210, 297, undefined, "FAST");
      return;
    }
    if (spec.id === "patent") {
      renderPatentDocument(doc, spec, data);
      if (standalone) createWriter(doc).footerAll(spec.title);
      return;
    }
    if (spec.id === "complaint") {
      renderComplaintDocument(doc, spec, data);
      if (standalone) createWriter(doc).footerAll(spec.title);
      return;
    }
    renderStandardDocument(doc, spec, data);
    if (standalone) createWriter(doc).footerAll(spec.title);
  }

  function renderStandardDocument(doc, spec, data) {
    const writer = createWriter(doc);
    const brandedHeader = ["case", "patent", "complaint"].includes(spec.id) ? state.visuals.banner : null;
    writer.title(spec.title, t("Calculus Cases · Caso 3", "Calculus Cases · Case 3"), brandedHeader);
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
  }

  function renderPatentDocument(doc, spec, d) {
    const code = officeCode("PAT", d);
    officeHeader(doc, d, t("SOLICITUD DE PATENTE DOCENTE", "TEACHING PATENT APPLICATION"), code);
    officeNotice(doc, d, 58);
    officeField(doc, t("Solicitante", "Applicant"), d.company, 15, 73, 87);
    officeField(doc, t("Estado del registro", "Registration status"), t(`REGISTRADA · Oficina de Patentes del curso «${d.course}»`, `REGISTERED · Patent Office of the “${d.course}” course`), 108, 73, 87);
    officeField(doc, t("Título de la invención", "Title of invention"), t("Caja abierta de volumen máximo obtenida mediante cuatro recortes cuadrados congruentes", "Maximum-volume open box obtained using four congruent square cut-outs"), 15, 93, 180);

    doc.setTextColor(31, 48, 65).setFont("helvetica", "bold").setFontSize(10).text(t("RESUMEN TÉCNICO", "TECHNICAL ABSTRACT"), 15, 116);
    doc.setFont("helvetica", "normal").setFontSize(8.8).text(doc.splitTextToSize(t(`La solicitud protege, únicamente dentro de esta simulación educativa, una caja fabricada a partir de una lámina de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. El corte calculado maximiza el volumen en el modelo indicado.`, `For this educational simulation only, the application covers a box made from a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet. The calculated cut maximizes volume within the stated model.`), 180), 15, 123);

    drawPatentPlan(doc, d, 15, 141, 112, 70);
    officeField(doc, t("Lámina inicial", "Initial sheet"), `${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm`, 133, 141, 62);
    officeField(doc, t("Recorte óptimo", "Optimal cut"), `x* = ${fmt(d.x, 3)} mm`, 133, 158, 62);
    officeField(doc, t("Caja resultante", "Resulting box"), `${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} × ${fmt(d.x, 2)} mm`, 133, 175, 62);
    officeField(doc, t("Volumen máximo", "Maximum volume"), `${fmt(d.volume / 1000, 3)} mL`, 133, 195, 62);

    doc.setFillColor(245, 247, 249).setDrawColor(158, 169, 179).roundedRect(15, 218, 180, 44, 1.5, 1.5, "FD");
    doc.setTextColor(31, 48, 65).setFont("helvetica", "bold").setFontSize(9).text(t("FUNDAMENTO DE OPTIMIZACIÓN Y REIVINDICACIÓN", "OPTIMIZATION BASIS AND CLAIM"), 20, 228);
    doc.setFont("courier", "bold").setFontSize(8.8).text(`V(x)=x(${fmt(d.L, 1)}-2x)(${fmt(d.W, 1)}-2x)`, 20, 237);
    doc.text(`x*=[(L+W)-sqrt(L²-LW+W²)]/6=${fmt(d.x, 3)} mm`, 20, 245);
    doc.setFont("helvetica", "normal").setFontSize(8).text(doc.splitTextToSize(t("Se reivindica la configuración geométrica descrita, con cuatro recortes iguales y sin material añadido, para las dimensiones declaradas.", "The described geometric configuration, with four equal cut-outs and no added material, is claimed for the stated dimensions."), 166), 20, 254);
    educationalStamp(doc, d, 126, 264, 69, 19);
  }

  function renderComplaintDocument(doc, spec, d) {
    const altX = d.x * 0.82;
    const altVolume = altX * (d.L - 2 * altX) * (d.W - 2 * altX);
    const reportedAdvertised = d.volume * 0.94;
    const reportedAlternative = d.volume * 1.03;
    const reportedGain = (reportedAlternative / reportedAdvertised - 1) * 100;
    const code = officeCode("REG", d);
    officeHeader(doc, d, t("REGISTRO DE ENTRADA · RECLAMACIÓN", "ENTRY REGISTER · FORMAL CLAIM"), code);
    officeNotice(doc, d, 58);
    registrationStamp(doc, code, 130, 72, 65, 35);
    officeField(doc, t("Presenta", "Submitted by"), t("Asociación de Personas Consumidoras", "Consumer Association"), 15, 73, 108);
    officeField(doc, t("Contra", "Against"), d.company, 15, 93, 108);
    officeField(doc, t("Expediente impugnado", "Challenged file"), officeCode("PAT", d), 15, 113, 180);
    officeField(doc, t("Asunto", "Subject"), t("Impugnación de las dimensiones registradas como óptimas y denuncia de publicidad fraudulenta", "Challenge to the dimensions registered as optimal and allegation of fraudulent advertising"), 15, 133, 180);

    doc.setTextColor(31, 48, 65).setFont("helvetica", "bold").setFontSize(10).text(t("HECHOS DECLARADOS POR LA PARTE RECLAMANTE", "FACTS ASSERTED BY THE CLAIMANT"), 15, 158);
    const statement = t(`La asociación manifiesta haber construido varias cajas y sostiene que el diseño registrado, con x=${fmt(d.x, 2)} mm, no es óptimo. Aporta como contraste una caja con x=${fmt(altX, 2)} mm y afirma que esta ofrece mayor capacidad.`, `The association states that it built several boxes and claims that the registered design, with x=${fmt(d.x, 2)} mm, is not optimal. It submits a comparison box with x=${fmt(altX, 2)} mm and alleges that it has greater capacity.`);
    doc.setFont("helvetica", "normal").setFontSize(8.8).text(doc.splitTextToSize(statement, 180), 15, 166);

    officeMeasurementTable(doc, [
      [t("Diseño registrado", "Registered design"), fmt(d.x, 2), fmt(reportedAdvertised / 1000, 2), fmt(d.volume / 1000, 2)],
      [t("Diseño de contraste", "Comparison design"), fmt(altX, 2), fmt(reportedAlternative / 1000, 2), fmt(altVolume / 1000, 2)]
    ], 15, 187);

    doc.setFillColor(245, 247, 249).setDrawColor(158, 169, 179).roundedRect(15, 225, 180, 35, 1.5, 1.5, "FD");
    doc.setTextColor(31, 48, 65).setFont("helvetica", "bold").setFontSize(9).text(t("SOLICITUD", "REQUEST"), 20, 235);
    doc.setFont("helvetica", "normal").setFontSize(8.2).text(doc.splitTextToSize(t(`Que se revise la patente docente ${officeCode("PAT", d)}, se declare que la caja registrada no presenta dimensiones óptimas y se retire la campaña hasta verificar las mediciones. La diferencia declarada es del ${fmt(reportedGain, 1)} %.`, `That teaching patent ${officeCode("PAT", d)} be reviewed, that the registered box be declared non-optimal, and that the campaign be withdrawn pending verification of the measurements. The reported difference is ${fmt(reportedGain, 1)}%.`), 166), 20, 243);
    educationalStamp(doc, d, 126, 264, 69, 19);
  }

  function officeCode(prefix, d) {
    return `${prefix}-CC-${Math.round(d.L)}-${Math.round(d.W)}-${stem(d.course).slice(0, 6).toUpperCase()}`;
  }

  function officeHeader(doc, d, title, code) {
    doc.setFillColor(31, 48, 65).rect(0, 0, 210, 38, "F");
    doc.setDrawColor(255).setLineWidth(.6).circle(19, 19, 10);
    doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(11).text("CC", 19, 22, { align: "center" });
    doc.setFontSize(10).text(t("OFICINA DE PATENTES DEL CURSO", "COURSE PATENT OFFICE"), 35, 12);
    doc.setFont("helvetica", "normal").setFontSize(8.5).text(doc.splitTextToSize(d.course, 105), 35, 20);
    doc.setFont("helvetica", "bold").setFontSize(7.5).text(code, 195, 12, { align: "right" });
    doc.setFontSize(7).text(t("REGISTRO ACADÉMICO SIMULADO", "SIMULATED ACADEMIC REGISTER"), 195, 20, { align: "right" });
    doc.setTextColor(31, 48, 65).setFontSize(16).text(title, 15, 50);
  }

  function officeNotice(doc, d, y) {
    doc.setFillColor(255, 245, 204).setDrawColor(205, 161, 45).roundedRect(15, y, 180, 9, 1, 1, "FD");
    doc.setTextColor(107, 74, 0).setFont("helvetica", "bold").setFontSize(7.5).text(t(`MATERIAL DOCENTE · SIN VALIDEZ OFICIAL · Curso: ${d.course}`, `TEACHING MATERIAL · NOT AN OFFICIAL DOCUMENT · Course: ${d.course}`), 105, y + 5.8, { align: "center", maxWidth: 172 });
  }

  function officeField(doc, label, value, x, y, width) {
    doc.setDrawColor(175, 184, 192).setFillColor(250, 251, 252).roundedRect(x, y, width, 15, 1, 1, "FD");
    doc.setTextColor(95, 107, 118).setFont("helvetica", "bold").setFontSize(6.5).text(label.toUpperCase(), x + 3, y + 4.2);
    doc.setTextColor(31, 48, 65).setFont("helvetica", "normal").setFontSize(8).text(doc.splitTextToSize(value, width - 6), x + 3, y + 9.2);
  }

  function drawPatentPlan(doc, d, x, y, width, height) {
    doc.setDrawColor(130, 143, 154).setFillColor(252, 253, 254).roundedRect(x, y, width, height, 1.5, 1.5, "FD");
    doc.setTextColor(95, 107, 118).setFont("helvetica", "bold").setFontSize(6.5).text(t("FIGURA 1 · PLANO DE CORTE Y PLEGADO", "FIGURE 1 · CUT-AND-FOLD PLAN"), x + 4, y + 6);
    const maxW = width - 18;
    const maxH = height - 22;
    const scale = Math.min(maxW / d.L, maxH / d.W);
    const w = d.L * scale;
    const h = d.W * scale;
    const x0 = x + (width - w) / 2;
    const y0 = y + 12 + (maxH - h) / 2;
    const c = d.x * scale;
    doc.setFillColor(255).setDrawColor(31, 48, 65).setLineWidth(.4).rect(x0, y0, w, h, "FD");
    doc.setDrawColor(61, 112, 143).setLineDashPattern([2, 1.5], 0);
    doc.line(x0 + c, y0, x0 + c, y0 + h); doc.line(x0 + w - c, y0, x0 + w - c, y0 + h);
    doc.line(x0, y0 + c, x0 + w, y0 + c); doc.line(x0, y0 + h - c, x0 + w, y0 + h - c);
    doc.setLineDashPattern([], 0).setDrawColor(169, 67, 54);
    [[x0,y0],[x0+w-c,y0],[x0,y0+h-c],[x0+w-c,y0+h-c]].forEach(([cx,cy]) => { doc.line(cx,cy,cx+c,cy+c); doc.line(cx+c,cy,cx,cy+c); });
    doc.setTextColor(31, 48, 65).setFont("helvetica", "normal").setFontSize(6.5).text(`L=${fmt(d.L, 1)} mm`, x0 + w / 2, y0 + h + 6, { align: "center" });
    doc.text(`W=${fmt(d.W, 1)} mm`, x0 - 3, y0 + h / 2, { angle: 90, align: "center" });
    doc.text(`x=${fmt(d.x, 2)} mm`, x0 + c / 2, y0 + c / 2, { align: "center" });
  }

  function registrationStamp(doc, code, x, y, width, height) {
    doc.setDrawColor(165, 57, 48).setLineWidth(1).roundedRect(x, y, width, height, 1.5, 1.5, "S");
    doc.setTextColor(165, 57, 48).setFont("helvetica", "bold").setFontSize(9).text(t("REGISTRO DE ENTRADA", "ENTRY REGISTER"), x + width / 2, y + 9, { align: "center" });
    doc.setFontSize(7.5).text(code, x + width / 2, y + 17, { align: "center" });
    doc.setFontSize(7).text(t("RECIBIDO · SIMULACIÓN DOCENTE", "RECEIVED · TEACHING SIMULATION"), x + width / 2, y + 26, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(6.5).text(t("Sin efectos administrativos", "No administrative effect"), x + width / 2, y + 32, { align: "center" });
  }

  function officeMeasurementTable(doc, rows, x, y) {
    const widths = [72, 28, 40, 40];
    const headers = [t("Muestra", "Sample"), "x (mm)", t("V medido (mL)", "Measured V (mL)"), t("V teórico (mL)", "Theoretical V (mL)")];
    let cx = x;
    headers.forEach((header, index) => {
      doc.setFillColor(31, 48, 65).setDrawColor(255).rect(cx, y, widths[index], 9, "FD");
      doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(6.5).text(doc.splitTextToSize(header, widths[index] - 4), cx + 2, y + 4);
      cx += widths[index];
    });
    rows.forEach((row, rowIndex) => {
      cx = x;
      row.forEach((cell, index) => {
        doc.setFillColor(rowIndex % 2 ? 250 : 244, rowIndex % 2 ? 251 : 247, rowIndex % 2 ? 252 : 249).setDrawColor(190).rect(cx, y + 9 + rowIndex * 9, widths[index], 9, "FD");
        doc.setTextColor(31, 48, 65).setFont("helvetica", "normal").setFontSize(7).text(String(cell), cx + 2, y + 15 + rowIndex * 9);
        cx += widths[index];
      });
    });
  }

  function educationalStamp(doc, d, x, y, width, height) {
    doc.setDrawColor(165, 57, 48).setLineWidth(.8).roundedRect(x, y, width, height, 1.5, 1.5, "S");
    doc.setTextColor(165, 57, 48).setFont("helvetica", "bold").setFontSize(8).text(t("MATERIAL DOCENTE", "TEACHING MATERIAL"), x + width / 2, y + 6, { align: "center" });
    doc.setFontSize(7).text(t("SIN VALIDEZ OFICIAL", "NOT AN OFFICIAL DOCUMENT"), x + width / 2, y + 12, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(6).text(doc.splitTextToSize(d.course, width - 6), x + width / 2, y + 17, { align: "center" });
  }

  function contentFor(id, d) {
    const Vpoly = `V(x) = x(${fmt(d.L, 1)} - 2x)(${fmt(d.W, 1)} - 2x) = 4x³ - ${fmt(2 * (d.L + d.W), 1)}x² + ${fmt(d.L * d.W, 1)}x`;
    const deriv = `V'(x) = 12x² - ${fmt(4 * (d.L + d.W), 1)}x + ${fmt(d.L * d.W, 1)}`;
    const root = `x* = [${fmt(d.L + d.W, 1)} - sqrt(${fmt(d.L * d.L - d.L * d.W + d.W * d.W, 1)})] / 6 = ${fmt(d.x, 3)} mm`;
    const challengeX = d.x * 0.82;
    const challengeVolume = challengeX * (d.L - 2 * challengeX) * (d.W - 2 * challengeX);
    const reportedAdvertised = d.volume * 0.94;
    const reportedAlternative = d.volume * 1.03;
    const reportedGain = (reportedAlternative / reportedAdvertised - 1) * 100;
    const common = {
      case: [
        { heading: t("El encargo", "The brief"), paragraphs: [t(`${d.company} anuncia una nueva caja con el lema «La caja de mayor capacidad: más palomitas con el mismo cartón». Una asociación de consumidores ha presentado una reclamación por posible publicidad engañosa.`, `${d.company} is advertising a new box with the slogan “The greatest-capacity box: more popcorn from the same cardstock.” A consumer association has filed a complaint alleging potentially misleading advertising.`)] },
        { heading: t("Pregunta central", "Central question"), paragraphs: [t(`A partir de una hoja rectangular de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm, se recortan cuatro cuadrados iguales y se pliegan las paredes. ¿Qué lado deben tener los cuadrados para maximizar el volumen? ¿Respalda el cálculo la afirmación de la empresa?`, `Starting with a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm rectangular sheet, four equal squares are removed and the sides are folded. What side length maximizes volume? Does the calculation support the company claim?`)] },
        { heading: t("Organización de la clase", "Class organization"), bullets: [t("La mayoría de la clase representa a la Asociación de Consumidores y construye cajas de distintos tamaños.", "Most of the class represents the Consumer Association and builds boxes of different sizes."), t("Un grupo más pequeño representa a la empresa; la mitad construye varias cajas óptimas y la otra mitad obtiene la solución mediante cálculo.", "A smaller group represents the company; half builds several optimal boxes and half derives the solution using calculus."), t("La actividad tiene una primera fase de construcción y cálculo y una segunda fase de contraste empírico y presentación.", "The activity has a first phase for construction and calculation, followed by an empirical comparison and presentation phase.")] }
      ],
      advert: [
        { heading: t("Pieza publicitaria aportada como prueba A", "Advertisement submitted as Exhibit A"), paragraphs: [t(`${d.company} presenta su caja de ${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} × ${fmt(d.x, 1)} mm como resultado de un diseño matemático que aprovecha al máximo cada hoja de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm.`, `${d.company} presents its ${fmt(d.baseL, 1)} × ${fmt(d.baseW, 1)} × ${fmt(d.x, 1)} mm box as a mathematically designed product that makes maximum use of every ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet.`)] },
        { heading: t("Afirmaciones de campaña", "Campaign claims"), bullets: [t("«La caja de mayor capacidad posible con esta hoja».", "“The greatest possible capacity from this sheet.”"), t(`Capacidad anunciada: ${fmt(d.volume / 1000, 1)} mL.`, `Advertised capacity: ${fmt(d.volume / 1000, 1)} mL.`), t("Sin añadir material, solapas ni uniones que alteren el rectángulo inicial.", "No added material, tabs, or joints that alter the original rectangle.")] },
        { heading: t("Nota probatoria", "Evidence note"), paragraphs: [t("Documento ficticio creado exclusivamente para la actividad educativa. La afirmación debe ser verificada por el alumnado.", "Fictional document created solely for this educational activity. Students must verify the claim.")] }
      ],
      complaint: [
        { heading: t("Objeto de la denuncia", "Subject of the claim"), paragraphs: [t(`La asociación denuncia que ${d.company} anuncia como óptima una caja que, según sus comprobaciones, no alcanza la mayor capacidad posible. Considera que la campaña induce a error y califica el anuncio de fraudulento.`, `The association alleges that ${d.company} advertises as optimal a box that, according to its tests, does not achieve the greatest possible capacity. It considers the campaign misleading and calls the advertisement fraudulent.`)] },
        { heading: t("Comprobaciones declaradas", "Reported tests"), bullets: [t(`Caja anunciada: corte x=${fmt(d.x, 2)} mm; capacidad medida media de ${fmt(reportedAdvertised / 1000, 2)} mL.`, `Advertised box: cut x=${fmt(d.x, 2)} mm; reported mean measured capacity ${fmt(reportedAdvertised / 1000, 2)} mL.`), t(`Caja alternativa: corte x=${fmt(challengeX, 2)} mm; capacidad medida media de ${fmt(reportedAlternative / 1000, 2)} mL.`, `Alternative box: cut x=${fmt(challengeX, 2)} mm; reported mean measured capacity ${fmt(reportedAlternative / 1000, 2)} mL.`), t(`La asociación declara una mejora del ${fmt(reportedGain, 1)} %.`, `The association reports a ${fmt(reportedGain, 1)}% improvement.`), t(`Sin embargo, el volumen teórico de la alternativa es ${fmt(challengeVolume / 1000, 2)} mL: este dato debe contrastarse con las mediciones.`, `However, the alternative's theoretical volume is ${fmt(challengeVolume / 1000, 2)} mL; this figure must be checked against the measurements.`)] },
        { heading: t("Petición y cuestión probatoria", "Requested remedy and evidential issue"), paragraphs: [t("Se solicita retirar de inmediato la expresión «caja óptima» y abrir un expediente sancionador. La comisión deberá decidir si las mediciones aportadas bastan para invalidar el modelo matemático o si contienen sesgos, errores o datos incompatibles.", "The association requests immediate withdrawal of the phrase “optimal box” and the opening of enforcement proceedings. The panel must decide whether the submitted measurements invalidate the mathematical model or instead contain bias, error, or incompatible data.")] }
      ],
      patent: [
        { heading: t("Solicitud educativa de patente · No es un documento legal", "Educational patent application · Not a legal document"), paragraphs: [t(`Solicitante: ${d.company}. Título: Recipiente abierto optimizado a partir de una lámina rectangular mediante cuatro recortes cuadrados congruentes.`, `Applicant: ${d.company}. Title: Optimized open container formed from a rectangular sheet using four congruent square cut-outs.`)] },
        { heading: t("Descripción", "Description"), paragraphs: [t(`La invención propuesta parte de una lámina de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Se eliminan cuadrados de lado ${fmt(d.x, 2)} mm y se pliegan las cuatro bandas restantes para producir una base de ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `The proposed invention starts from a ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet. Squares with side ${fmt(d.x, 2)} mm are removed and the four remaining strips are folded to produce a ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base.`)] },
        { heading: t("Reivindicaciones", "Claims"), bullets: [t("Un recipiente abierto construido sin añadir material a la lámina inicial.", "An open container made without adding material to the initial sheet."), t("Cuatro recortes cuadrados congruentes, uno en cada esquina.", "Four congruent square cut-outs, one at each corner."), t(`Un volumen teórico máximo de ${fmt(d.volume / 1000, 2)} mL para las dimensiones indicadas.`, `A theoretical maximum volume of ${fmt(d.volume / 1000, 2)} mL for the stated dimensions.`)] },
        { template: true }
      ],
      investigation: [
        { heading: t("Tu rol: equipo de la empresa", "Your role: company team"), paragraphs: [t(`Representáis a ${d.company}. Durante la primera fase os dividiréis en dos subequipos de tamaño parecido. No compartáis la solución matemática con la Asociación de Consumidores antes de la segunda fase.`, `You represent ${d.company}. During phase one, split into two similarly sized subteams. Do not share the mathematical solution with the Consumer Association before phase two.`)] },
        { heading: t("Subequipo A · Fabricación de la caja óptima", "Subteam A · Build the optimal box"), bullets: [t(`Usad hojas de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm y marcad en cada esquina un cuadrado de lado x=${fmt(d.x, 2)} mm.`, `Use ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheets and mark a square with side x=${fmt(d.x, 2)} mm at every corner.`), t("Recortad los cuatro cuadrados, plegad por las cuatro líneas que delimitan la base y fijad las paredes con cinta si es necesario.", "Cut out the four squares, fold along the four lines bounding the base, and secure the walls with tape if needed."), t(`Comprobad que la base mide ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm y la altura ${fmt(d.x, 2)} mm.`, `Check that the base measures ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm and the height is ${fmt(d.x, 2)} mm.`), t("Construid varias copias iguales, etiquetadlas como «empresa» y reservadlas para la prueba empírica.", "Build several identical copies, label them “company,” and keep them for the empirical test.")] },
        { template: true },
        { pageBreak: true, heading: t("Subequipo B · Justificación mediante cálculo", "Subteam B · Calculus justification"), paragraphs: [t("Debéis obtener el tamaño óptimo por vuestra cuenta. Las preguntas siguientes guían el proceso, pero no sustituyen los cálculos ni la justificación.", "You must derive the optimal size yourselves. The following questions guide the process but do not replace the calculations or justification.")] },
        { heading: t("1. Modelado", "1. Modelling"), paragraphs: [t(`Llamad x al lado de cada cuadrado recortado. Determinad la altura y los dos lados de la base a partir de la hoja ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Escribid la función volumen V(x).`, `Let x be the side of each removed square. Determine the height and the two base dimensions from the ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheet. Write the volume function V(x).`)], lines: 5 },
        { heading: t("2. Dominio físico", "2. Physical domain"), paragraphs: [t("Determinad qué valores de x permiten construir una caja y explicad qué ocurre en los extremos.", "Determine which x-values produce a box and explain what happens at the endpoints.")], lines: 4 },
        { heading: t("3. Derivación y puntos críticos", "3. Derivative and critical points"), paragraphs: [t("Desarrollad V(x), calculad V'(x), igualad la derivada a cero y resolved la ecuación. Descartad cualquier raíz que quede fuera del dominio.", "Expand V(x), compute V'(x), set the derivative equal to zero, and solve the equation. Reject any root outside the domain.")], lines: 7 },
        { pageBreak: true, heading: t("4. Demostración y presentación", "4. Proof and presentation"), paragraphs: [t("Justificad que el punto factible produce el máximo global comparando con los extremos y usando V'' o el signo de V'. Calculad las dimensiones finales y el volumen. Preparad una explicación breve para toda la clase durante la segunda fase.", "Show that the feasible point gives the global maximum by comparing it with the endpoints and using V'' or the sign of V'. Calculate the final dimensions and volume. Prepare a short explanation for the whole class during phase two.")], lines: 7 },
        { heading: t("Resultado acordado por ambos subequipos", "Result agreed by both subteams"), paragraphs: [t("Antes de la presentación, comparad el resultado calculado con las medidas de las cajas construidas por el subequipo A y corregid posibles errores de fabricación o cálculo.", "Before presenting, compare the calculated result with the boxes built by subteam A and correct any construction or calculation errors.")], lines: 4 }
      ],
      measurement: [
        { heading: t("Tu rol: Asociación de Consumidores", "Your role: Consumer Association"), paragraphs: [t("Sois el grupo más numeroso. Vuestro objetivo es comprobar experimentalmente si la caja anunciada por la empresa tiene realmente mayor capacidad que otras cajas construidas con la misma hoja.", "You are the larger group. Your goal is to test experimentally whether the company's advertised box really has greater capacity than other boxes made from the same sheet.")] },
        { heading: t("Fase 1 · Construcción de prototipos diferentes", "Phase 1 · Build different prototypes"), bullets: [t(`Trabajad por parejas o pequeños grupos con hojas de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm. Coordinad el equipo para elegir distintos valores de x y evitar prototipos repetidos.`, `Work in pairs or small groups using ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheets. Coordinate the team so that you choose different x-values and avoid duplicate prototypes.`), t("En cada esquina, dibujad un cuadrado de lado x. Los cuatro cuadrados deben ser exactamente iguales.", "At each corner, draw a square with side x. All four squares must be exactly equal."), t("Recortad y retirad los cuatro cuadrados. Después plegad el papel por las cuatro líneas que delimitan la base y fijad las paredes si es necesario.", "Cut out and remove the four squares. Then fold the sheet along the four lines bounding the base and secure the walls if needed."), t("Etiquetad cada caja con su valor de x y medid la base y la altura reales.", "Label each box with its x-value and measure its actual base and height.")] },
        { template: true },
        { pageBreak: true, heading: t("Registro de prototipos", "Prototype record"), paragraphs: [t("Anotad todas las medidas en milímetros y calculad V=x(L-2x)(W-2x). Para pasar de mm³ a mL, dividid entre 1000. Conservad todas las cajas para la segunda fase.", "Record all lengths in millimetres and calculate V=x(L-2x)(W-2x). Divide mm³ by 1000 to obtain mL. Keep every box for phase two.")] },
        { table: { headers: ["x (mm)", t("Base real (mm)", "Actual base (mm)"), t("Altura (mm)", "Height (mm)"), t("V calculado (mL)", "Calculated V (mL)"), t("Resultado empírico", "Empirical result")], rows: Array.from({ length: 8 }, () => ["", "", "", "", ""]), widths: [24, 42, 30, 38, 46] } },
        { heading: t("Preparación de la prueba empírica", "Prepare the empirical test"), bullets: [t("En la segunda fase llenaréis cada prototipo con palomitas. Podéis colocarlas, apretarlas o romperlas para intentar introducir la máxima cantidad, pero debéis anotar la estrategia usada.", "In phase two you will fill each prototype with popcorn. You may arrange, compress, or break it to fit as much as possible, but you must record the strategy used."), t("No añadáis ni retiréis palomitas durante el trasvase: el contenido completo de cada prototipo se volcará en una caja óptima de la empresa.", "Do not add or remove popcorn during the transfer: the complete contents of each prototype will be poured into one of the company's optimal boxes."), t("Registrad si las palomitas llenan la caja óptima y cuánto espacio libre queda aproximadamente.", "Record whether the popcorn fills the optimal box and approximately how much free space remains.")] },
        { heading: t("Resultados de los trasvases", "Transfer results"), lines: 8 }
      ],
      teacher: [
        { heading: t("Modelo para el tamaño seleccionado", "Model for the selected size"), formula: Vpoly, paragraphs: [t(`El dominio físico es 0 <= x <= ${fmt(d.maxCut, 3)} mm. En los extremos el volumen vale 0.`, `The physical domain is 0 <= x <= ${fmt(d.maxCut, 3)} mm. Volume is 0 at both endpoints.`)] },
        { heading: t("Puntos críticos", "Critical points"), formula: deriv, paragraphs: [t(`Las raíces son ${fmt(d.x, 3)} mm y ${fmt(d.otherRoot, 3)} mm. La segunda queda fuera del dominio físico.`, `The roots are ${fmt(d.x, 3)} mm and ${fmt(d.otherRoot, 3)} mm. The second lies outside the physical domain.`)], bullets: [root] },
        { heading: t("Comprobación del máximo global", "Global maximum check"), paragraphs: [t(`V(0)=0; V(${fmt(d.x, 3)})=${fmt(d.volume, 1)} mm³=${fmt(d.volume / 1000, 3)} mL; V(${fmt(d.maxCut, 3)})=0. Además, V''(x*)=${fmt(24 * d.x - 4 * (d.L + d.W), 3)}<0. Por el método del intervalo cerrado, x* produce el máximo global.`, `V(0)=0; V(${fmt(d.x, 3)})=${fmt(d.volume, 1)} mm³=${fmt(d.volume / 1000, 3)} mL; V(${fmt(d.maxCut, 3)})=0. Also, V''(x*)=${fmt(24 * d.x - 4 * (d.L + d.W), 3)}<0. By the closed-interval method, x* gives the global maximum.`)] },
        { heading: t("Dimensiones finales y veredicto", "Final dimensions and verdict"), bullets: [t(`Recorte: ${fmt(d.x, 2)} mm.`, `Cut: ${fmt(d.x, 2)} mm.`), t(`Base: ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `Base: ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`), t(`Altura: ${fmt(d.x, 2)} mm.`, `Height: ${fmt(d.x, 2)} mm.`), t(`Volumen máximo: ${fmt(d.volume / 1000, 2)} mL.`, `Maximum volume: ${fmt(d.volume / 1000, 2)} mL.`), t("El claim es matemáticamente defendible dentro del modelo indicado: hoja rectangular fija, cuatro cuadrados iguales, caja abierta y sin material adicional.", "The claim is mathematically defensible within the stated model: fixed rectangular sheet, four equal squares, open box, and no additional material.")] },
        { pageBreak: true, heading: t("Organización docente de la actividad", "Teacher organization guide"), paragraphs: [t("La actividad se desarrolla en dos fases claramente separadas. No anuncies el paso a la segunda fase hasta que todos los prototipos y la justificación matemática de la empresa estén preparados.", "The activity has two clearly separated phases. Do not announce phase two until all prototypes and the company's mathematical justification are ready.")] },
        { heading: t("Preparación y materiales", "Preparation and materials"), bullets: [t(`Prepara una cantidad grande de hojas de ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm, todas del mismo tipo de papel. Conviene disponer de varias por estudiante.`, `Prepare a large supply of ${fmt(d.L, 1)} × ${fmt(d.W, 1)} mm sheets, all using the same paper stock. Several sheets per student are advisable.`), t("Cada grupo necesita reglas, lápices, tijeras y cinta adhesiva o pegamento para fijar las paredes.", "Each group needs rulers, pencils, scissors, and tape or glue to secure the walls."), t("Se necesita una cantidad abundante de palomitas. Pueden traerse ya hechas de casa o prepararse en el aula antes de la prueba.", "A generous amount of popcorn is required. It may be brought ready-made from home or prepared in class before the test."), t("Si las palomitas se van a comer, revisa alergias e higiene. Las manipuladas, apretadas o rotas durante la experiencia no deberían consumirse.", "If any popcorn will be eaten, check allergies and hygiene. Popcorn handled, compressed, or broken during the experiment should not be eaten."), t("Imprime un dossier de consumidores por pareja o pequeño grupo, un dossier de empresa para cada subequipo y conserva la solución solo para el profesorado.", "Print one consumer dossier per pair or small group, one company dossier for each subteam, and keep the solution teacher-only.")] },
        { heading: t("Reparto de la clase", "Divide the class"), bullets: [t("Asociación de Consumidores: el grupo más numeroso, idealmente entre dos tercios y tres cuartos de la clase.", "Consumer Association: the larger group, ideally between two thirds and three quarters of the class."), t("Empresa: el grupo más pequeño. Divídelo en dos mitades: fabricación de cajas óptimas y cálculo de la solución óptima.", "Company: the smaller group. Split it in half: optimal-box construction and optimal-solution calculation."), t("Explica únicamente el objetivo y entrega a cada grupo su paquete de rol; evita que intercambien documentos durante la primera fase.", "Explain only the goal and give each group its role packet; prevent them from exchanging documents during phase one.")] },
        { pageBreak: true, heading: t("Fase 1 · Construcción e investigación", "Phase 1 · Construction and investigation"), bullets: [t("La Asociación de Consumidores construye muchas cajas con valores diferentes de x, mide sus dimensiones y completa la tabla de volúmenes.", "The Consumer Association builds many boxes using different x-values, measures them, and completes the volume table."), t(`La mitad constructora de la empresa recibe x*=${fmt(d.x, 2)} mm y fabrica varias copias de la caja óptima. Debe comprobar la base ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm.`, `The company's construction half receives x*=${fmt(d.x, 2)} mm and builds several copies of the optimal box. It must check the ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base.`), t("La mitad matemática de la empresa modela V(x), determina el dominio, deriva, resuelve V'(x)=0 y justifica el máximo sin recibir la solución desarrollada.", "The company's mathematics half models V(x), determines the domain, differentiates, solves V'(x)=0, and proves the maximum without receiving the worked solution."), t("Circula entre los grupos para comprobar que todos los recortes de cada caja son iguales y que se usan hojas del mismo tamaño.", "Circulate among the groups to check that every cut-out in each box is equal and that all sheets have the same dimensions."), t("Duración orientativa: 45–60 minutos, ampliable si se fabrican muchos prototipos.", "Suggested duration: 45–60 minutes, longer if many prototypes are built.")] },
        { heading: t("Transición", "Transition"), paragraphs: [t("Cuando estén terminados los prototipos y el equipo matemático haya acordado su demostración, detén el trabajo y anuncia expresamente el comienzo de la segunda fase. Coloca las cajas óptimas de la empresa en una mesa visible y reparte las palomitas.", "When the prototypes are complete and the mathematics team has agreed on its proof, stop the work and explicitly announce phase two. Place the company's optimal boxes on a visible table and distribute the popcorn.")] },
        { heading: t("Fase 2 · Prueba empírica", "Phase 2 · Empirical test"), bullets: [t("La Asociación presenta cada prototipo, su valor de x y su volumen calculado.", "The Association presents each prototype, its x-value, and its calculated volume."), t("El alumnado llena el prototipo con tantas palomitas como pueda. Puede ordenarlas, apretarlas o romperlas, pero debe conservar exactamente ese contenido para el trasvase.", "Students fill the prototype with as much popcorn as possible. They may arrange, compress, or break it, but must preserve exactly that content for the transfer."), t("Se vuelca todo el contenido en una caja óptima de la empresa, sin añadir ni retirar palomitas. Se observa el espacio libre y se repite con todos los prototipos.", "All contents are poured into one of the company's optimal boxes without adding or removing popcorn. Observe the free space and repeat for every prototype."), t("El resultado esperado es que ninguna carga procedente de una caja de menor volumen llene por completo la caja óptima. Comenta posibles variaciones debidas al empaquetamiento, grosor del papel y fabricación.", "The expected result is that no load from a lower-volume box completely fills the optimal box. Discuss possible variation due to packing, paper thickness, and construction."), t("Duración orientativa: 20–30 minutos.", "Suggested duration: 20–30 minutes.")] },
        { pageBreak: true, heading: t("Cierre matemático", "Mathematical conclusion"), bullets: [t("Comparad los volúmenes calculados de todos los prototipos y comprobad que el valor de la empresa es el mayor.", "Compare the calculated volumes of all prototypes and verify that the company's value is the largest."), t("El subequipo matemático de la empresa presenta el modelo, la derivada, los puntos críticos, el dominio y la comprobación del máximo global.", "The company's mathematics subteam presents the model, derivative, critical points, domain, and global-maximum check."), t("La clase contrasta la denuncia, la evidencia empírica y la demostración. Subraya que el trasvase ilustra el resultado, mientras que el cálculo demuestra la optimalidad dentro del modelo.", "The class compares the complaint, empirical evidence, and proof. Emphasize that the transfer illustrates the result, while calculus proves optimality within the model."), t("Distinguid errores de medida, errores de fabricación y errores del modelo antes de emitir el veredicto final.", "Distinguish measurement, construction, and modelling errors before issuing the final verdict.")] },
        { heading: t("Resultado matemático reservado", "Teacher-only mathematical result"), formula: root, paragraphs: [t(`Para estas medidas, el volumen máximo es ${fmt(d.volume / 1000, 3)} mL y se obtiene con una caja de base ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm y altura ${fmt(d.x, 2)} mm.`, `For these dimensions, the maximum volume is ${fmt(d.volume / 1000, 3)} mL, obtained with a ${fmt(d.baseL, 2)} × ${fmt(d.baseW, 2)} mm base and height ${fmt(d.x, 2)} mm.`)] }
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
      title(title, kicker, banner) {
        if (banner) {
          doc.addImage(banner, "JPEG", 0, 0, 210, 38.15, undefined, "FAST");
          doc.setTextColor(11, 96, 127).setFont("helvetica", "bold").setFontSize(9).text(kicker.toUpperCase(), margin, 47);
          doc.setTextColor(32, 42, 61).setFontSize(20).text(lines(title, 170), margin, 57);
          y = 69;
          return;
        }
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

  function showFiles(files, bundles, complete, separateZip, bundleZip) {
    const all = [...files, ...bundles, complete, separateZip, bundleZip];
    all.forEach((file) => { file.url = URL.createObjectURL(file.blob); state.urls.push(file.url); });
    els.completePdf.href = complete.url;
    els.completePdf.download = complete.fileName;
    els.completePdf.classList.remove("pc-hidden");
    els.bundles.innerHTML = [bundleZip, ...bundles].map((file, index) => fileRow(file, index === 0)).join("");
    els.docList.innerHTML = fileRow(separateZip, true) + DOCS.map((spec) => {
      const file = files.find((item) => item.id === spec.id);
      const title = spec.teacher ? `${spec.title} · ${t("Profesorado", "Teacher only")}` : spec.title;
      return fileRow(file, false, title);
    }).join("");
    els.documents.classList.remove("pc-hidden");
    activateTab("popcorn-panel-bundles");
  }

  function fileRow(file, primary, titleOverride) {
    const title = titleOverride || file.label;
    const safeTitle = escapeHtml(title);
    return `<div class="pc-file-row${primary ? " pc-primary" : ""}"><span class="pc-file-title">${safeTitle}</span><span class="pc-file-actions"><a class="pc-file-icon" href="${file.url}" target="_blank" rel="noopener" title="${t("Ver", "View")} ${safeTitle}" aria-label="${t("Ver", "View")} ${safeTitle}">${iconEye()}</a><a class="pc-file-icon" href="${file.url}" download="${escapeHtml(file.fileName)}" title="${t("Descargar", "Download")} ${safeTitle}" aria-label="${t("Descargar", "Download")} ${safeTitle}">${iconDownload()}</a></span></div>`;
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
    if (els.completePdf) {
      els.completePdf.classList.add("pc-hidden");
      els.completePdf.removeAttribute("href");
      els.completePdf.removeAttribute("download");
    }
    if (els.documents) els.documents.classList.add("pc-hidden");
  }

  function activateTab(targetId) {
    els.tabButtons.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.pcTabTarget === targetId));
    });
    els.tabPanels.forEach((panel) => { panel.hidden = panel.id !== targetId; });
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
