(function () {
  "use strict";

  const LANGUAGE = ((document.querySelector(".trial-generator") || {}).dataset || {}).lang ||
    document.documentElement.lang || "es";
  const IS_ENGLISH = LANGUAGE.toLowerCase().startsWith("en");
  const text = (spanish, english) => IS_ENGLISH ? english : spanish;

  const TEMPS = {
    ambient: 22,
    bodyAtDeath: 36.5,
    referenceFirstMeasurement: 24.56,
    referenceHoursFromDeathToFirst: 2.5,
    hoursBetweenMeasurements: 1
  };

  const TIMING = {
    suspect2ReturnAfterClass: 20,
    suspect2LeaveAfterClass: 25,
    discoveryAfterClass: 55,
    forensicCallAfterDiscovery: 5,
    firstMeasurementAfterDiscovery: 15,
    afternoonClassAfterClass: 60
  };

  const SOURCE_CREDIT = text(
    "Material procedente de franjfal.github.io",
    "Material from franjfal.github.io"
  );

  const SCRIPT_URL =
    document.currentScript && document.currentScript.src
      ? document.currentScript.src
      : window.location.href;

  // The classroom plan and the trial sequence are drawn as vectors (classroomPlan and
  // trialFlow blocks), so their labels follow the language and the house sizes; the PNG
  // versions in assets/ are no longer printed.
  const IMAGE_SOURCES = {
    cover: assetUrl("cover_scene.png")
  };

  const state = {
    urls: []
  };

  const els = {};

  const block = {
    chapter: (title, subtitle) => ({ type: "chapter", title, subtitle }),
    heading: (text) => ({ type: "heading", text }),
    paragraph: (text) => ({ type: "paragraph", text }),
    bullets: (items) => ({ type: "bullets", items }),
    numbered: (items) => ({ type: "numbered", items }),
    image: (key, caption, options = {}) => ({ type: "image", key, caption, options }),
    timeline: (title, events) => ({ type: "timeline", title, events }),
    coolingCurve: (timeline, temps) => ({ type: "coolingCurve", timeline, temps }),
    evidenceCards: (cards) => ({ type: "evidenceCards", cards }),
    suspectTable: (rows) => ({ type: "suspectTable", rows }),
    caseFile: (meta, sections) => ({ type: "caseFile", meta, sections }),
    scaledTimeline: (title, lanes) => ({ type: "scaledTimeline", title, lanes }),
    classroomPlan: (caption, options = {}) => ({ type: "classroomPlan", caption, options }),
    trialFlow: (caption) => ({ type: "trialFlow", caption }),
    table: (headers, rows, widths, options = {}) => ({ type: "table", headers, rows, widths, options }),
    meta: (rows) => ({ type: "meta", rows }),
    note: (text) => ({ type: "note", text }),
    pageBreak: () => ({ type: "pageBreak" }),
    spacer: (height = 10) => ({ type: "spacer", height })
  };

  function init() {
    els.root = document.querySelector(".trial-generator") || document;
    els.form = document.getElementById("case-form");
    els.students = document.getElementById("trial-students");
    els.groups = document.getElementById("trial-groups");
    els.teacherName = document.getElementById("teacher-name");
    els.className = document.getElementById("class-name");
    els.pageFormat = document.getElementById("page-format");
    els.mathMode = document.getElementById("math-mode");
    els.date = document.getElementById("case-date");
    els.startTime = document.getElementById("class-start-time");
    els.endTime = document.getElementById("class-end-time");
    els.suspect1Name = document.getElementById("suspect-1-name");
    els.suspect2Name = document.getElementById("suspect-2-name");
    els.suspect3Name = document.getElementById("suspect-3-name");
    els.g1 = document.getElementById("suspect-1-gender");
    els.g2 = document.getElementById("suspect-2-gender");
    els.g3 = document.getElementById("suspect-3-gender");
    els.status = document.getElementById("status");
    els.summary = document.getElementById("case-summary");
    els.downloadsPanel = document.getElementById("downloads-panel");
    els.separateDownloads = document.getElementById("separate-downloads");
    els.bundleDownloads = document.getElementById("bundle-downloads");
    els.completePdfLink = document.getElementById("complete-pdf-link");
    els.printGuideLink = document.getElementById("print-guide-link");
    els.generateButton = document.getElementById("generate-button");
    els.projectButton = document.getElementById("project-button");
    els.clearButton = document.getElementById("clear-button");
    els.tabButtons = Array.from(els.root.querySelectorAll("[data-cc-tab-target]"));
    els.tabPanels = Array.from(els.root.querySelectorAll(".cc-tab-panel"));

    els.form.addEventListener("submit", handleGenerate);
    els.clearButton.addEventListener("click", clearDownloads);
    if (els.projectButton) {
      els.projectButton.addEventListener("click", handleProject);
    }
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.ccTabTarget));
    });

    [
      els.students,
      els.teacherName,
      els.className,
      els.pageFormat,
      els.mathMode,
      els.date,
      els.startTime,
      els.endTime,
      els.suspect1Name,
      els.suspect2Name,
      els.suspect3Name,
      els.g1,
      els.g2,
      els.g3
    ].filter(Boolean).forEach((input) => {
      input.addEventListener("input", handleInputChange);
      input.addEventListener("change", handleInputChange);
    });

    // the guided configurator (cc-wizard.js): one step of the form at a time
    if (window.CCWizard) {
      window.CCWizard.init(els.form);
    }
    syncTimeConstraints();
    updateSummary();
  }

  function handleInputChange() {
    syncTimeConstraints();
    updateSummary();
  }

  function syncTimeConstraints() {
    if (!els.startTime || !els.endTime) {
      return;
    }
    els.startTime.max = els.endTime.value ? shiftTimeValue(els.endTime.value, -30) : "";
    els.endTime.min = els.startTime.value ? shiftTimeValue(els.startTime.value, 30) : "";
  }

  /** The launch presentation, full screen (the same slides as document 00). */
  function handleProject() {
    try {
      const data = readCaseData();
      if (!window.CCProjector) {
        throw new Error(text("No se ha cargado el proyector de diapositivas.", "The slide projector has not loaded."));
      }
      window.CCProjector.open(slidesHtml(buildSlides(data)), { lang: IS_ENGLISH ? "en" : "es" });
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus(error.message || text("No se ha podido preparar la presentación.", "The presentation could not be prepared."));
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(text("Preparando datos del caso...", "Preparing case data..."));
    clearDownloads();

    try {
      assertLibraries();
      const caseData = readCaseData();

      setStatus(text("Cargando imágenes...", "Loading images..."));
      const images = await loadImages(IMAGE_SOURCES);

      setStatus(text("Generando PDFs separados...", "Generating separate PDFs..."));
      const { individualFiles, bundleFiles, completeFile, guideFile } = buildAllFiles(caseData, images);

      setStatus(text("Preparando archivos ZIP...", "Preparing ZIP files..."));
      const stamp = `${caseData.dateStamp}_${caseData.endTimeValue.replace(":", "-")}`;
      const separateZip = {
        fileName: text(
          `juicio_${caseData.teacherFileStem}_documentos_separados_${stamp}.zip`,
          `trial_${caseData.teacherFileStem}_separate_documents_${stamp}.zip`
        ),
        label: text("Todos los documentos separados · ZIP", "All separate documents · ZIP"),
        blob: await buildZip(individualFiles)
      };
      // the printing guide travels in both ZIPs
      const bundleZip = {
        fileName: text(
          `juicio_${caseData.teacherFileStem}_documentos_por_rol_${stamp}.zip`,
          `trial_${caseData.teacherFileStem}_role_packets_${stamp}.zip`
        ),
        label: text("Todos los paquetes · ZIP", "All packets · ZIP"),
        blob: await buildZip([guideFile, ...bundleFiles])
      };

      completeFile.fileName = text(
        `juicio_${caseData.teacherFileStem}_documento_completo_${stamp}.pdf`,
        `trial_${caseData.teacherFileStem}_complete_document_${stamp}.pdf`
      );
      completeFile.label = text("PDF completo", "Complete PDF");

      showDownloads(individualFiles, bundleFiles, separateZip, bundleZip, completeFile, guideFile);
      updateSummary(caseData);
      setStatus(text(
        `Listo: ${individualFiles.length} documentos separados (con la guía de impresión y reparto), ${bundleFiles.length} paquetes por rol y un PDF completo generados.`,
        `Done: ${individualFiles.length} separate documents (including the printing and distribution guide), ${bundleFiles.length} role packets, and one complete PDF generated.`
      ));
    } catch (error) {
      console.error(error);
      setStatus(error.message || text("No se han podido generar los documentos.", "The documents could not be generated."));
    } finally {
      setBusy(false);
    }
  }

  function assertLibraries() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error(text("No se ha cargado jsPDF. Revisa la conexión o el enlace CDN.", "jsPDF has not loaded. Check your connection or the CDN link."));
    }
    if (!window.JSZip) {
      throw new Error(text("No se ha cargado JSZip. Revisa la conexión o el enlace CDN.", "JSZip has not loaded. Check your connection or the CDN link."));
    }
  }

  function readCaseData() {
    const teacherFullName = normalizeName(els.teacherName.value);
    const className = normalizeName(els.className.value);
    const pageFormat = els.pageFormat && els.pageFormat.value === "letter" ? "letter" : "a4";
    const mathMode = els.mathMode && (els.mathMode.type === "checkbox" ? els.mathMode.checked : els.mathMode.value === "ode") ? "ode" : "calculus";
    const classroom = buildClassroom(els.students ? els.students.value : DEFAULT_STUDENTS);
    const dateValue = els.date.value;
    const startTimeValue = els.startTime.value;
    const endTimeValue = els.endTime.value;
    const hasCaseDate = Boolean(dateValue);
    const calculationDateValue = hasCaseDate ? dateValue : "2026-07-02";
    if (!teacherFullName) {
      throw new Error(text("Escribe el nombre del profesor.", "Enter the professor's name."));
    }
    if (!className) {
      throw new Error(text("Escribe el nombre de la clase impartida.", "Enter the name of the course taught."));
    }
    if (!startTimeValue || !endTimeValue) {
      throw new Error(text("Selecciona la hora de inicio y la hora de fin de clase.", "Select the class start and end times."));
    }

    const classStart = parseLocalDateTime(calculationDateValue, startTimeValue);
    const classEnd = parseLocalDateTime(calculationDateValue, endTimeValue);
    if (classEnd.getTime() - classStart.getTime() < 30 * 60 * 1000) {
      throw new Error(text("La hora de inicio debe ser al menos 30 minutos anterior al fin de la clase.", "The start time must be at least 30 minutes before the class ends."));
    }

    const timeline = buildTimeline(classStart, classEnd);
    const temps = calculateTemperatures(timeline);
    const suspects = [
      buildSuspect(1, els.g1.value, els.suspect1Name ? els.suspect1Name.value : ""),
      buildSuspect(2, els.g2.value, els.suspect2Name ? els.suspect2Name.value : ""),
      buildSuspect(3, els.g3.value, els.suspect3Name ? els.suspect3Name.value : "")
    ];

    return {
      classroom,
      teacherFullName,
      teacherShortName: shortName(teacherFullName),
      teacherFileStem: fileStem(teacherFullName),
      className,
      pageFormat,
      mathMode,
      dateValue,
      hasCaseDate,
      calculationDateValue,
      dateStamp: hasCaseDate ? dateValue : text("sin_fecha", "undated"),
      startTimeValue,
      endTimeValue,
      classStart,
      classEnd,
      timeline,
      temps,
      suspects
    };
  }

  /*
   * The class from its number of students. Every student has a role. Up to 20 students there is
   * one court; with more, parallel courts of 10 to 16 that try the same case at the same time (the
   * book recommends courts of about twelve: a judge, two prosecutors, two forensic doctors, a
   * custodian, three suspects and three jurors). In a court of n students: one judge, one
   * custodian, one student per suspect, prosecution and forensic teams of 1 to 3, and the rest is
   * the jury. The keys are those of ROLE_OF_BUNDLE.
   */
  const DEFAULT_STUDENTS = 24;
  const STUDENT_RANGE = [9, 72];
  function courtRoles(size) {
    const prosecution = size >= 18 ? 3 : size >= 12 ? 2 : 1;
    const forensic = size >= 12 ? 2 : 1;
    const roles = { judge: 1, prosecution, forensic, janitor: 1, suspect1: 1, suspect2: 1, suspect3: 1 };
    roles.jury = size - Object.values(roles).reduce((a, b) => a + b, 0);
    return roles;
  }
  function buildClassroom(value) {
    const raw = Math.round(Number(String(value || "").replace(",", ".")));
    const students = Math.max(STUDENT_RANGE[0], Math.min(STUDENT_RANGE[1], Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_STUDENTS));
    const count = students <= 20 ? 1 : Math.ceil(students / 16);
    const courts = Array.from({ length: count }, (_, k) => {
      const size = Math.floor(students / count) + (k < students % count ? 1 : 0);
      return { size, roles: courtRoles(size) };
    });
    const totals = {};
    courts.forEach((court) => Object.entries(court.roles).forEach(([key, n]) => { totals[key] = (totals[key] || 0) + n; }));
    return { students, requested: raw, courts, totals };
  }
  /** Students of a role in one court, as "2" or, when the courts differ, "2–3". */
  function perCourt(classroom, key) {
    const values = classroom.courts.map((court) => court.roles[key]);
    const lo = Math.min(...values), hi = Math.max(...values);
    return lo === hi ? String(lo) : `${lo}–${hi}`;
  }
  function courtSizes(classroom) {
    const sizes = classroom.courts.map((court) => court.size);
    const lo = Math.min(...sizes), hi = Math.max(...sizes);
    return lo === hi ? String(lo) : `${lo}–${hi}`;
  }
  /** "1 juicio" or "2 tribunales de 12", for the summaries. */
  function courtsLabel(classroom) {
    const c = classroom.courts.length;
    return c === 1
      ? text(`un solo tribunal de ${classroom.students}`, `one court of ${classroom.students}`)
      : text(`${c} tribunales en paralelo, de ${courtSizes(classroom)} estudiantes`, `${c} parallel courts of ${courtSizes(classroom)} students`);
  }

  function buildTimeline(classStart, classEnd) {
    const death = addMinutes(classEnd, 10);
    const discovery = addMinutes(classEnd, TIMING.discoveryAfterClass);
    const firstMeasurement = addMinutes(discovery, TIMING.firstMeasurementAfterDiscovery);

    return {
      classStart,
      normalTemp: classStart,
      classEnd,
      death,
      suspect2Return: addMinutes(classEnd, TIMING.suspect2ReturnAfterClass),
      suspect2Leave: addMinutes(classEnd, TIMING.suspect2LeaveAfterClass),
      discovery,
      forensicCall: addMinutes(discovery, TIMING.forensicCallAfterDiscovery),
      firstMeasurement,
      secondMeasurement: addMinutes(firstMeasurement, 60),
      afternoonClass: addMinutes(classEnd, TIMING.afternoonClassAfterClass)
    };
  }

  function calculateTemperatures(timeline) {
    const bodyDelta = TEMPS.bodyAtDeath - TEMPS.ambient;
    const referenceDelta = TEMPS.referenceFirstMeasurement - TEMPS.ambient;
    const k = -Math.log(referenceDelta / bodyDelta) / TEMPS.referenceHoursFromDeathToFirst;
    const hoursFromDeathToFirst = hoursBetween(timeline.death, timeline.firstMeasurement);
    const firstMeasurement = TEMPS.ambient + bodyDelta * Math.exp(-k * hoursFromDeathToFirst);
    const firstDelta = firstMeasurement - TEMPS.ambient;
    const secondMeasurement =
      TEMPS.ambient + firstDelta * Math.exp(-k * TEMPS.hoursBetweenMeasurements);
    const estimatedHoursBeforeFirst = -Math.log(firstDelta / bodyDelta) / k;

    return {
      ambient: TEMPS.ambient,
      bodyAtDeath: TEMPS.bodyAtDeath,
      firstMeasurement,
      secondMeasurement,
      k,
      hoursFromDeathToFirst,
      estimatedHoursBeforeFirst
    };
  }

  function buildSuspect(number, gender, name) {
    const feminine = gender === "f";
    const forms = IS_ENGLISH
      ? {
          role: "suspect",
          roleCap: "Suspect",
          article: "the",
          articleCap: "The",
          un: "a",
          del: "of the",
          al: "to the",
          applied: "hard-working",
          upset: "upset",
          known: "well-known",
          reserved: "reserved",
          attentive: "attentive",
          alone: "alone",
          responsible: "responsible",
          pronoun: feminine ? "she" : "he",
          possessive: feminine ? "her" : "his"
        }
      : feminine
      ? {
          role: "sospechosa",
          roleCap: "Sospechosa",
          article: "la",
          articleCap: "La",
          un: "una",
          del: "de la",
          al: "a la",
          applied: "aplicada",
          upset: "molesta",
          known: "conocida",
          reserved: "reservada",
          attentive: "atenta",
          alone: "sola",
          responsible: "responsable"
        }
      : {
          role: "sospechoso",
          roleCap: "Sospechoso",
          article: "el",
          articleCap: "El",
          un: "un",
          del: "del",
          al: "al",
          applied: "aplicado",
          upset: "molesto",
          known: "conocido",
          reserved: "reservado",
          attentive: "atento",
          alone: "solo",
          responsible: "responsable"
        };

    const fallbackLabel = `${forms.roleCap} ${number}`;
    const displayName = normalizeName(name) || fallbackLabel;
    const usesCustomName = displayName !== fallbackLabel;

    return {
      number,
      gender,
      name: displayName,
      ...forms,
      label: displayName,
      lowerLabel: usesCustomName ? displayName : `${forms.role} ${number}`,
      withArticle: usesCustomName ? displayName : `${forms.article} ${forms.role} ${number}`,
      withArticleCap: usesCustomName ? displayName : `${forms.articleCap} ${forms.role} ${number}`,
      fileStem: usesCustomName ? fileStem(displayName) : `${forms.roleCap}_${number}`
    };
  }

  function buildDocumentSpecs(data) {
    return [
      presentationDoc(data),
      commonContextDoc(data),
      commonVisualDossierDoc(data),
      trialGuideDoc(data),
      evidenceBoardDoc(data),
      judgeDoc(data),
      prosecutionDoc(data),
      forensicRoleDoc(data),
      forensicReportDoc(data),
      forensicMathDoc(data),
      janitorDoc(data),
      juryDoc(data),
      suspectOneDoc(data),
      suspectTwoDoc(data),
      suspectThreeDoc(data),
      teacherSolutionDoc(data)
    ];
  }

  /**
   * The packets of the "role packets" tab: who receives each one (role, used by the printing
   * guide to say who receives each document), the classroom role it belongs to (key) and the
   * documents it gathers, in order.
   */
  function bundleDefinitions(data) {
    const [s1, s2, s3] = data.suspects;
    const room = data.classroom;
    const c = room.courts.length;
    const copies = (key, privately) => {
      const n = room.totals[key];
      const base = c > 1
        ? text(`${n} (${perCourt(room, key)} por tribunal)`, `${n} (${perCourt(room, key)} per court)`)
        : text(`${n} (1 por estudiante)`, `${n} (1 per student)`);
      return privately ? text(`${base}, en sobre cerrado`, `${base}, in a sealed envelope`) : base;
    };
    const def = (id, es, en, label, role, key, ids, privately) => ({
      id, fileName: text(es, en), label, role, key, count: room.totals[key], use: copies(key, privately), ids
    });
    return [
      def("bundle_judge", "ROL_Juez_paquete_completo.pdf", "ROLE_Judge_complete_packet.pdf", text("El juez", "The judge"), text("juez", "judge"), "judge",
        ["context", "trialGuide", "visualDossier", "evidenceBoard", "forensicReport", "forensicMath", "judge"]),
      def("bundle_prosecution", "ROL_Fiscalia_paquete_completo.pdf", "ROLE_Prosecution_complete_packet.pdf", text("La Fiscalía", "The prosecution"), text("Fiscalía", "prosecution"), "prosecution",
        ["context", "trialGuide", "visualDossier", "evidenceBoard", "forensicReport", "forensicMath", "prosecution"]),
      def("bundle_forensic", "ROL_Medico_forense_paquete_completo.pdf", "ROLE_Forensic_doctor_complete_packet.pdf", text("El médico forense", "The forensic doctor"), text("médico forense", "forensic doctor"), "forensic",
        ["context", "trialGuide", "visualDossier", "forensicRole", "forensicReport", "forensicMath"]),
      def("bundle_janitor", "ROL_Conserje_paquete_completo.pdf", "ROLE_Custodian_complete_packet.pdf", text("La conserje", "The building custodian"), text("conserje", "custodian"), "janitor",
        ["context", "trialGuide", "visualDossier", "janitor"]),
      def("bundle_jury", "ROL_Jurado_popular_paquete_completo.pdf", "ROLE_Jury_complete_packet.pdf", text("El jurado popular", "The jury"), text("jurado", "jury"), "jury",
        ["context", "jury"]),
      ...[s1, s2, s3].map((s, k) => def(`bundle_suspect${k + 1}`, `ROL_${s.fileStem}_paquete_completo.pdf`, `ROLE_${s.fileStem}_complete_packet.pdf`,
        s.withArticleCap, s.label, `suspect${k + 1}`, ["context", `suspect${k + 1}`], true))
    ];
  }

  const TEACHER_BUNDLE = () => ({
    id: "bundle_teacher",
    fileName: text("ROL_Docente_paquete_completo_con_solucion.pdf", "ROLE_Teacher_complete_packet_with_solution.pdf"),
    label: text("El docente", "The teacher"),
    use: text("1, para ti; no circula", "1, for you; it does not circulate")
  });

  /*
   * How each document is printed and handed out, as the printing and distribution guide
   * prints it: copies (exact, from the number of students and the packets that contain the
   * document), ink and when it is handed out. Who receives it is read from the packets and the
   * sides (one or two) from the page count of this generation. The documents themselves carry
   * no printing instructions (ESTANDAR_WEB_ACTIVIDADES.md, 5).
   */
  function printSpecs(data, defs) {
    const room = data.classroom;
    const copiesOf = (id) => defs.filter((def) => def.ids.includes(id)).reduce((sum, def) => sum + def.count, 0);
    // the number of copies; who receives them is in the next column of the guide
    const label = (id) => {
      const n = copiesOf(id);
      const holders = defs.filter((def) => def.ids.includes(id));
      if (holders.length === 1 && /^suspect/.test(holders[0].key)) {
        return room.courts.length > 1 ? text(`${n} (1 por tribunal)`, `${n} (1 per court)`) : "1";
      }
      return String(n);
    };
    const launch = text("Lanzamiento", "Launch");
    const privately = text("Lanzamiento, en sobre cerrado", "Launch, in a sealed envelope");
    const bw = text("blanco y negro", "black and white");
    const colour = (what) => text(`en color si es posible (${what})`, `in colour if possible (${what})`);
    const spec = (id, ink, when) => ({ copies: label(id), count: copiesOf(id), ink, when });
    return {
      presentation: {
        copies: text("Ninguna", "None"), count: 0,
        how: text("Apaisada 16:9, en color; sin proyector, 1 por tribunal", "Landscape 16:9, in colour; without a projector, 1 per court"),
        when: text("Lanzamiento (se proyecta)", "Launch (projected)")
      },
      context: spec("context", colour(text("fotografía", "photograph")), launch),
      visualDossier: spec("visualDossier", colour(text("plano", "plan")), launch),
      trialGuide: spec("trialGuide", bw, launch),
      evidenceBoard: spec("evidenceBoard", bw, launch),
      judge: spec("judge", bw, launch),
      prosecution: spec("prosecution", bw, launch),
      forensicRole: spec("forensicRole", bw, launch),
      forensicReport: spec("forensicReport", bw, launch),
      forensicMath: spec("forensicMath", bw, launch),
      janitor: spec("janitor", colour(text("plano", "plan")), launch),
      jury: spec("jury", bw, launch),
      suspect1: spec("suspect1", bw, privately),
      suspect2: spec("suspect2", bw, privately),
      suspect3: spec("suspect3", bw, privately),
      teacherSolution: { copies: text("1, para ti", "1, for you"), count: 1, ink: colour(text("cronología", "timeline")), when: text("No circula", "It does not circulate") }
    };
  }

  /**
   * Every PDF of one generation. The printing guide lists the pages of every document and
   * packet, the teacher packet included, which contains the guide itself: it is composed
   * again until its own page count and the teacher packet's stop changing.
   */
  function buildAllFiles(data, images) {
    const format = data.pageFormat;
    const specs = buildDocumentSpecs(data);
    const files = specs.map((spec) => buildPdfFile(spec, images, format));
    const byId = Object.fromEntries(specs.map((spec) => [spec.id, spec]));
    const defs = bundleDefinitions(data);
    const roleBundles = defs.map((def) => {
      const spec = makeBundleSpec(def.id, def.fileName, def.label, def.label, def.ids.map((id) => byId[id]));
      return buildPdfFile(spec, images, format);
    });
    const pages = Object.fromEntries([...files, ...roleBundles].map((file) => [file.id, file.pages]));
    const teacherDef = TEACHER_BUNDLE();
    pages.printGuide = 2;
    pages[teacherDef.id] = 0;
    let guideSpec, guideFile, teacherFile;
    for (let pass = 0; pass < 4; pass += 1) {
      guideSpec = printGuideDoc(data, specs, defs, teacherDef, pages);
      guideFile = buildPdfFile(guideSpec, images, format);
      teacherFile = buildPdfFile(makeBundleSpec(teacherDef.id, teacherDef.fileName, teacherDef.label, teacherDef.label, [guideSpec, ...specs]), images, format);
      if (guideFile.pages === pages.printGuide && teacherFile.pages === pages[teacherDef.id]) break;
      pages.printGuide = guideFile.pages;
      pages[teacherDef.id] = teacherFile.pages;
    }
    const completeFile = buildPdfFile(buildCompleteSpec([guideSpec, ...specs]), images, format);
    return { individualFiles: [guideFile, ...files], bundleFiles: [...roleBundles, teacherFile], completeFile, guideFile };
  }

  function buildCompleteSpec(individualSpecs) {
    return makeBundleSpec(
      "complete",
      text("documento_completo.pdf", "complete_document.pdf"),
      text("PDF completo", "Complete PDF"),
      text("Todos los documentos", "All documents"),
      individualSpecs
    );
  }

  /** Number of a document as its file name gives it (00 to 14, 99). */
  const docNumber = (spec) => (String(spec.fileName).match(/^(\d+)_/) || [])[1] || "";

  function joinList(items) {
    if (items.length < 2) return items.join("");
    return `${items.slice(0, -1).join(", ")}${text(" y ", " and ")}${items[items.length - 1]}`;
  }

  /** The minutes of the trial class, as the printing guide, the presentation and the book give them. */
  function trialPlan() {
    return [
      ["0–5", text("Apertura: el juez abre la sesión, recuerda las normas y presenta el caso; la Fiscalía expone un alegato inicial breve.", "Opening: the judge opens the session, reviews the rules and introduces the case; the prosecution gives a brief opening statement.")],
      ["5–17", text("Informe forense: causa de la muerte, temperaturas y estimación de la hora. Pausa: todo el tribunal comprueba el cálculo antes del siguiente testigo.", "Forensic report: cause of death, temperatures and the estimated time. Pause: the whole court checks the calculation before the next witness.")],
      ["17–22", text("La conserje declara sobre el edificio, el aula, la temperatura de la sala y los movimientos observados.", "The custodian testifies about the building, the classroom, the room temperature and the movements observed.")],
      ["22–37", text("Cada sospechoso declara y responde a las preguntas.", "Each suspect testifies and answers questions.")],
      ["37–40", text("La Fiscalía ordena los hechos en un alegato final.", "The prosecution arranges the facts in a closing statement.")],
      ["40–50", text("El jurado delibera y entrega su veredicto por escrito; el juez lo anuncia.", "The jury deliberates and hands in a written verdict; the judge announces it.")],
      ["50–60", text("Cierre del caso, fuera de la ficción, y comprobación individual.", "Closing the case, outside the fiction, and the individual check.")]
    ];
  }

  /** Printing and distribution guide (ESTANDAR_WEB_ACTIVIDADES.md, section 5), for the teacher only. */
  function printGuideDoc(data, specs, defs, teacherDef, pages) {
    const room = data.classroom;
    const c = room.courts.length;
    const paper = data.pageFormat === "letter" ? text("Carta", "Letter") : "A4";
    const mathVersion = data.mathMode === "ode"
      ? text("ecuaciones diferenciales", "differential equations")
      : text("cálculo", "calculus");
    const specsPrint = printSpecs(data, defs);
    const byId = Object.fromEntries(specs.map((spec) => [spec.id, spec]));
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const whoReceives = (spec) => {
      if (spec.teacher) return text("Solo tú", "You only");
      if (spec.slides) return text("Toda la clase, proyectada", "The whole class, projected");
      const roles = defs.filter((def) => def.ids.includes(spec.id)).map((def) => def.role);
      return roles.length === defs.length ? text("Todos los papeles", "Every role") : cap(joinList(roles));
    };
    const sides = (id) => (pages[id] > 1 ? text("doble cara", "double-sided") : text("una cara", "one side"));
    const docRows = specs.map((spec) => {
      const pr = specsPrint[spec.id];
      const how = pr.how || cap(`${sides(spec.id)}; ${pr.ink}`);
      return [`${docNumber(spec)} ${spec.title}`, String(pages[spec.id] || ""), whoReceives(spec), pr.copies, how, pr.when];
    });
    // pages printed in all (documents for the students and the teacher's own copy of the solution)
    const printed = specs.reduce((sum, spec) => sum + (specsPrint[spec.id].count || 0) * (pages[spec.id] || 0), 0);
    const sheets = specs.reduce((sum, spec) => sum + (specsPrint[spec.id].count || 0) * Math.ceil((pages[spec.id] || 0) / 2), 0);
    const contents = (ids) => ids.map((id) => (id === "printGuide" ? text("esta guía", "this guide") : docNumber(byId[id]))).join(", ");
    const bundleRows = [
      ...defs.map((def) => [def.label, contents(def.ids), String(pages[def.id] || ""), def.use]),
      [teacherDef.label, text(`esta guía y los documentos ${docNumber(specs[0])} a ${docNumber(specs[specs.length - 1])}`, `this guide and documents ${docNumber(specs[0])} to ${docNumber(specs[specs.length - 1])}`), String(pages[teacherDef.id] || ""), teacherDef.use]
    ];
    const mathDoc = docNumber(byId.forensicMath);
    const solutionDoc = docNumber(byId.teacherSolution);
    const roleRows = [
      [text("Juez", "Judge"), "judge"], [text("Fiscalía", "Prosecution"), "prosecution"], [text("Médico forense", "Forensic doctor"), "forensic"],
      [text("Conserje", "Custodian"), "janitor"], [data.suspects[0].label, "suspect1"], [data.suspects[1].label, "suspect2"], [data.suspects[2].label, "suspect3"],
      [text("Jurado popular", "Jury"), "jury"]
    ].map(([name, key]) => (c > 1 ? [name, perCourt(room, key), String(room.totals[key])] : [name, String(room.totals[key])]));
    const several = c > 1;

    return makeSpec(
      "printGuide",
      text("LEEME_guia_de_impresion_y_reparto.pdf", "README_printing_and_distribution_guide.pdf"),
      text("Guía de impresión y reparto", "Printing and distribution guide"),
      text("Qué se imprime, cuántas copias y cuándo se entrega cada documento", "What to print, how many copies and when each document is handed out"),
      [
        block.meta([
          [text("Clase", "Class"), text(`${room.students} estudiantes: ${courtsLabel(room)}`, `${room.students} students: ${courtsLabel(room)}`)],
          [text("Formato", "Format"), text("lanzamiento al final de una clase (15–20 min), preparación en clase y en casa, y el juicio en la clase siguiente (60 min)", "launch at the end of a class (15–20 min), preparation in class and at home, and the trial in the next class (60 min)")],
          [text("Papel", "Paper"), text(`${paper}, todas las páginas en vertical (la presentación, apaisada)`, `${paper}, every page portrait (the presentation, landscape)`)],
          [text("Generación", "Generation"), `${data.teacherFullName} · ${data.className} · ${formatCaseDateValue(data, data.timeline.classEnd)}, ${formatTime(data.timeline.classStart)}–${formatTime(data.timeline.classEnd)}`],
          [text("Informe matemático", "Mathematical report"), text(`versión para curso de ${mathVersion} (documento ${mathDoc})`, `${mathVersion} course version (document ${mathDoc})`)],
          [text("Documentos", "Documents"), text(`${specs.length} documentos, esta guía y ${defs.length + 1} paquetes`, `${specs.length} documents, this guide and ${defs.length + 1} packets`)]
        ]),
        block.heading(text("1. Antes de imprimir", "1. Before printing")),
        block.bullets(text([
          "Imprime todo de la misma generación: los nombres, las horas y las temperaturas coinciden entre todos los documentos y la solución. Si cambias la configuración, vuelve a imprimirlo todo.",
          `Papel: ${paper}, todas las páginas en vertical. La presentación (documento ${docNumber(byId.presentation)}) se proyecta; si no hay proyector, imprímela apaisada.`,
          "Escala: 100 % («tamaño real»). Ningún documento tiene medidas que deban conservarse, así que «ajustar a la página» tampoco estropea nada.",
          "Caras: a doble cara por el borde largo los documentos y paquetes de más de una página; los de una sola página, por una cara.",
          `Color: recomendable en la historia del caso (fotografía), en el plano del aula (documentos ${docNumber(byId.visualDossier)} y ${docNumber(byId.janitor)}) y en la solución docente (la cronología usa colores). El resto se lee bien en blanco y negro.`,
          "Grapa cada paquete por separado, o cada documento si imprimes por documentos (sección 2)."
        ], [
          "Print everything from the same generation: names, times and temperatures agree across all the documents and the solution. If you change the configuration, print everything again.",
          `Paper: ${paper}, every page portrait. The presentation (document ${docNumber(byId.presentation)}) is projected; without a projector, print it landscape.`,
          "Scale: 100% (\"actual size\"). No document has measurements that must be preserved, so \"fit to page\" does no harm either.",
          "Sides: double-sided along the long edge for documents and packets of more than one page; single-page documents on one side.",
          `Colour: advisable for the case story (photograph), the classroom plan (documents ${docNumber(byId.visualDossier)} and ${docNumber(byId.janitor)}) and the teacher solution (the timeline uses colours). The rest reads well in black and white.`,
          "Staple each packet separately, or each document if you print by document (section 2)."
        ])),
        block.heading(text("2. Los papeles de esta clase", "2. The roles in this class")),
        block.paragraph(text(
          several
            ? `Con ${room.students} estudiantes se celebran ${c} juicios a la vez, uno por tribunal, con el mismo caso y los mismos documentos. Cada estudiante tiene un papel; las copias de las secciones 3 y 4 son exactas para este reparto.`
            : `Con ${room.students} estudiantes se celebra un solo juicio. Cada estudiante tiene un papel; las copias de las secciones 3 y 4 son exactas para este reparto.`,
          several
            ? `With ${room.students} students, ${c} trials run at the same time, one per court, with the same case and the same documents. Every student has a role; the copies in sections 3 and 4 are exact for this assignment.`
            : `With ${room.students} students there is a single trial. Every student has a role; the copies in sections 3 and 4 are exact for this assignment.`
        )),
        block.table(
          several ? [text("Papel", "Role"), text("Por tribunal", "Per court"), text("Total", "Total")] : [text("Papel", "Role"), text("Estudiantes", "Students")],
          roleRows,
          several ? [40, 30, 30] : [60, 40],
          { boldFirst: true, padY: 4.5, split: true }
        ),
        block.heading(text("3. Documento a documento", "3. Document by document")),
        block.table(
          [text("Documento", "Document"), text("Págs.", "Pages"), text("Quién lo recibe", "Who receives it"), text("Copias", "Copies"), text("Cómo se imprime", "How to print"), text("Cuándo se entrega", "When")],
          docRows,
          [28, 7, 22, 9, 19, 15],
          { boldFirst: true, padY: 4.5 }
        ),
        block.note(text(
          `Copias: una por estudiante de los papeles que reciben el documento, también en los equipos. Imprimiendo por documentos, son ${printed} páginas en total (${sheets} hojas a doble cara). Los papeles de los tres sospechosos se entregan por separado, en sobre cerrado: ninguno debe ver el de los otros.`,
          `Copies: one per student in the roles that receive the document, team members included. Printing by document, that is ${printed} pages in all (${sheets} sheets double-sided). The three suspects' roles are handed out separately, in sealed envelopes: none should see the others'.`
        )),
        block.heading(text("4. Los paquetes de la web", "4. The packets on the website")),
        block.paragraph(text(
          "La pestaña «Paquetes por rol» reúne los documentos de cada papel en un solo PDF, ya ordenados. Imprimir por paquetes da el mismo material que imprimir los documentos uno a uno.",
          "The \"Role packets\" tab gathers each role's documents into one PDF, already in order. Printing by packet gives the same material as printing the documents one by one."
        )),
        block.table(
          [text("Paquete", "Packet"), text("Contiene", "Contains"), text("Págs.", "Pages"), text("Copias", "Copies")],
          bundleRows,
          [24, 30, 8, 38],
          { boldFirst: true, padY: 4.5 }
        ),
        block.heading(text("5. Reparto paso a paso", "5. Hand-outs step by step")),
        block.bullets(text([
          `Antes del lanzamiento. Imprime las copias de la sección 3, o los paquetes de la sección 4, y el paquete docente para ti. Mete el paquete de cada sospechoso en un sobre cerrado con el nombre del papel por fuera. Decide quién hace cada papel${several ? " en cada tribunal" : ""}: la tabla de la sección 2 da cuántos estudiantes lleva cada uno.`,
          `Lanzamiento, al final de una clase (15–20 min). Proyecta la presentación (documento ${docNumber(byId.presentation)}): la historia, el hallazgo, la pregunta para el tribunal, los papeles y su reparto. Nombra los papeles${several ? " y los tribunales" : ""} y entrega a cada estudiante el paquete del suyo; los sospechosos reciben su sobre sin que nadie vea lo que contiene. Termina con las normas del juicio.`,
          "Preparación, en clase si queda tiempo y en casa (30–45 min). Cada papel prepara su intervención solo con su paquete: el médico forense y la Fiscalía, el cálculo de la hora de la muerte; la conserje, sus registros y el plano; cada sospechoso, su versión; el juez, el orden de la sesión y el informe forense; el jurado, la historia y sus instrucciones. La hora estimada de la muerte solo la conocen el médico forense, la Fiscalía y el juez: el resto la descubre en el juicio. No hay puesta en común antes del juicio."
        ], [
          `Before the launch. Print the copies in section 3, or the packets in section 4, and the teacher packet for you. Put each suspect's packet in a sealed envelope with the role's name outside. Decide who plays each role${several ? " in each court" : ""}: the table in section 2 gives how many students each one takes.`,
          `Launch, at the end of a class (15–20 min). Project the presentation (document ${docNumber(byId.presentation)}): the story, the discovery, the question for the court, the roles and their assignment. Name the roles${several ? " and the courts" : ""} and give each student the packet of their own; the suspects receive their envelope without anyone seeing what it contains. Finish with the rules of the trial.`,
          "Preparation, in class if there is time and at home (30–45 min). Each role prepares its contribution with its own packet only: the forensic doctor and the prosecution, the calculation of the time of death; the custodian, the records and the plan; each suspect, their account; the judge, the order of the session and the forensic report; the jury, the story and its instructions. Only the forensic doctor, the prosecution and the judge know the estimated time of death: everyone else discovers it at the trial. There is no pooling before the trial."
        ])),
        block.paragraph(text(
          `El juicio, en la clase siguiente (60 min), sigue este orden.${several ? " Los tribunales se celebran a la vez y tú marcas la pausa forense en todos." : ""}`,
          `The trial, in the next class (60 min), follows this order.${several ? " The courts sit at the same time and you call the forensic pause in all of them." : ""}`
        )),
        block.table([text("Minutos", "Minutes"), text("Qué ocurre", "What happens")], trialPlan(), [14, 86], { boldFirst: true, padY: 4, split: true }),
        block.bullets(text([
          `Siempre. La solución docente (documento ${solutionDoc}), el paquete docente y el PDF completo no salen de tus manos: contienen los hechos privados de la persona culpable.`
        ], [
          `Always. The teacher solution (document ${solutionDoc}), the teacher packet and the complete PDF stay with you: they contain the guilty suspect's private facts.`
        ])),
        block.heading(text("6. Material adicional", "6. Additional material")),
        block.bullets(text([
          `Un proyector para la presentación del lanzamiento; sin proyector, una copia impresa por tribunal.`,
          `${3 * c} sobres, uno por sospechoso${several ? " y tribunal" : ""}.`,
          `Una pizarra o un papel grande${several ? " por tribunal" : ""} para la cronología común: cada dato queda en blanco hasta que se presenta en la sala.`,
          "Calculadoras para la pausa forense.",
          "Papel para las notas y el veredicto escrito del jurado.",
          "Grapadora."
        ], [
          "A projector for the launch presentation; without one, a printed copy per court.",
          `${3 * c} envelopes, one per suspect${several ? " and court" : ""}.`,
          `A board or a large sheet of paper${several ? " per court" : ""} for the common timeline: each fact stays blank until it has been presented in court.`,
          "Calculators for the forensic pause.",
          "Paper for the jury's notes and written verdict.",
          "Stapler."
        ]))
      ],
      { teacher: true }
    );
  }

  /*
   * Document 00, the presentation projected at the launch (and printed only without a
   * projector). Its slides take their facts from the common context (document 01, which the
   * whole class receives), the role documents and the trial guide; the estimated time of death
   * is left out, because the forensic doctor presents it at the trial.
   */
  function presentationDoc(data) {
    const spec = makeSpec(
      "presentation",
      text("00_Presentacion_del_caso.pdf", "00_Case_presentation.pdf"),
      text("Presentación del caso", "Case presentation"),
      text("Se proyecta en el lanzamiento", "Projected at the launch"),
      []
    );
    spec.slides = buildSlides(data);
    return spec;
  }

  function buildSlides(data) {
    const { timeline, temps, teacherFullName, teacherShortName, className } = data;
    const [s1, s2, s3] = data.suspects;
    const room = data.classroom;
    const several = room.courts.length > 1;
    const kicker = text(`Misterio de asesinato · El juicio del profesor ${teacherShortName}`, `Murder mystery · Professor ${teacherShortName}'s trial`);
    const roleNames = [
      [text("Juez", "Judge"), "judge"], [text("Fiscalía", "Prosecution"), "prosecution"], [text("Médico forense", "Forensic doctor"), "forensic"],
      [text("Conserje", "Custodian"), "janitor"], [s1.label, "suspect1"], [s2.label, "suspect2"], [s3.label, "suspect3"],
      [text("Jurado popular", "Jury"), "jury"]
    ];
    return [
      {
        kicker,
        title: text("La historia del caso", "The case story"),
        image: "cover",
        text: [
          text(`El profesor ${teacherFullName} era conocido en la Universidad de Valencia por sus temidos exámenes sorpresa en "${className}".`,
            `Professor ${teacherFullName} was known at the University of Valencia for the dreaded surprise exams in "${className}".`),
          text(`${formatCaseDate(data)}, durante una clase especialmente tensa, el profesor ${teacherShortName} anunció otro examen sorpresa.`,
            `${formatCaseDate(data)}, during an especially tense class, Professor ${teacherShortName} announced another surprise exam.`),
          text("Más tarde, la noticia se extendió rápidamente por el campus: había ocurrido un incidente estremecedor.",
            "Later, news spread quickly across campus: a shocking incident had occurred.")
        ]
      },
      {
        kicker,
        title: text("El hallazgo", "The discovery"),
        bullets: [
          text(`La clase terminó a las ${formatTime(timeline.classEnd)}.`, `The class ended at ${formatTime(timeline.classEnd)}.`),
          text(`Hacia las ${formatTime(timeline.discovery)}, ${s3.withArticle} encontró el cuerpo del profesor ${teacherShortName} en el aula y avisó inmediatamente a la conserje.`,
            `At about ${formatTime(timeline.discovery)}, ${s3.withArticle} found Professor ${teacherShortName}'s body in the classroom and immediately alerted the building custodian.`),
          text(`El médico forense llegó a las ${formatTime(timeline.firstMeasurement)} y examinó el cuerpo; sus conclusiones se conocerán en el juicio.`,
            `The forensic doctor arrived at ${formatTime(timeline.firstMeasurement)} and examined the body; the conclusions will be heard at the trial.`)
        ],
        note: text("Estos datos están en la historia del caso (documento 01), que recibe toda la clase.", "These facts are in the case story (document 01), which the whole class receives.")
      },
      {
        kicker,
        title: text("La pregunta para el tribunal", "The question for the court"),
        quote: text(`¿Quién mató al profesor ${teacherShortName}?`, `Who killed Professor ${teacherShortName}?`),
        text: [text(
          "En el juicio, el médico forense presentará sus mediciones y su estimación de la hora de la muerte, y todo el tribunal comprobará el cálculo. La evidencia forense, combinada con los testimonios, ayudará a establecer la culpabilidad o inocencia de cada persona sospechosa.",
          "At the trial, the forensic doctor will present the measurements and the estimate of the time of death, and the whole court will check the calculation. The forensic evidence, together with the testimony, will help establish each suspect's guilt or innocence."
        )],
        bullets: [
          text(`${s1.withArticleCap} se quedó con el profesor después de la clase.`, `${s1.withArticleCap} stayed behind with the professor after class.`),
          text(`${s2.withArticleCap} regresó más tarde para recoger una chaqueta olvidada cerca de la entrada del aula.`, `${s2.withArticleCap} returned later to collect a forgotten jacket near the classroom entrance.`),
          text(`${s3.withArticleCap} volvió para la clase de la tarde y encontró el cuerpo.`, `${s3.withArticleCap} returned for the afternoon class and found the body.`)
        ]
      },
      {
        kicker,
        title: text("Los papeles del juicio", "The roles of the trial"),
        table: {
          head: [text("Papel", "Role"), text("Qué hace", "What it does")],
          widths: [24, 76],
          rows: [
            [text("Juez", "Judge"), text("Preside el juicio con imparcialidad, da la palabra a todas las partes y recoge el veredicto.", "Presides impartially, gives every party the floor and receives the verdict.")],
            [text("Fiscalía", "Prosecution"), text("Construye la acusación mediante preguntas, con las pruebas forenses y la cronología.", "Builds the case through questions, with the forensic evidence and the timeline.")],
            [text("Médico forense", "Forensic doctor"), text("Presenta la causa de la muerte, las temperaturas y la estimación científica de la hora de la muerte.", "Presents the cause of death, the temperatures and the scientific estimate of the time of death.")],
            [text("Conserje", "Custodian"), text("Aporta los registros del edificio, el estado del aula y los movimientos que observó.", "Provides the building records, the state of the classroom and the movements observed.")],
            [text("Tres sospechosos", "Three suspects"), text("Cada uno defiende su versión, sin saber lo que saben los demás.", "Each defends their own account without knowing what the others know.")],
            [text("Jurado popular", "Jury"), text("Escucha, toma notas, delibera y emite un veredicto justificado.", "Listens, takes notes, deliberates and reaches a justified verdict.")]
          ]
        }
      },
      {
        kicker,
        title: text("El reparto en esta clase", "The assignment in this class"),
        text: [text(`${room.students} estudiantes: ${courtsLabel(room)}. Cada estudiante tiene un papel.`, `${room.students} students: ${courtsLabel(room)}. Every student has a role.`)],
        table: several
          ? { head: [text("Papel", "Role"), text("Por tribunal", "Per court"), text("Total", "Total")], widths: [50, 25, 25], rows: roleNames.map(([name, key]) => [name, perCourt(room, key), String(room.totals[key])]) }
          : { head: [text("Papel", "Role"), text("Estudiantes", "Students")], widths: [60, 40], rows: roleNames.map(([name, key]) => [name, String(room.totals[key])]) },
        note: several
          ? text("Todos los tribunales juzgan el mismo caso, a la vez y con los mismos documentos.", "Every court tries the same case, at the same time and with the same documents.")
          : ""
      },
      {
        kicker,
        title: text("Hasta el juicio", "Until the trial"),
        text: [text("Cada papel prepara su intervención, en clase y en casa, solo con la información de sus documentos.", "Each role prepares its contribution, in class and at home, using only the information in its own documents.")],
        bullets: [
          text("El médico forense y la Fiscalía: el cálculo de la hora de la muerte, que el resto del tribunal conocerá en el juicio.", "The forensic doctor and the prosecution: the calculation of the time of death, which the rest of the court will hear at the trial."),
          text("La conserje: sus registros, el aula y el plano.", "The custodian: the records, the classroom and the plan."),
          text("Cada sospechoso: su versión y su defensa, en privado.", "Each suspect: their account and defence, in private."),
          text("El juez: el orden de la sesión, las preguntas y el informe forense, para moderar la pausa de comprobación.", "The judge: the order of the session, the questions and the forensic report, to moderate the checking pause."),
          text("El jurado: la historia del caso y sus instrucciones.", "The jury: the case story and its instructions.")
        ],
        note: text("Traed calculadora: en el juicio, todo el tribunal comprobará el cálculo forense.", "Bring a calculator: at the trial, the whole court will check the forensic calculation.")
      },
      {
        kicker,
        title: text("El juicio: una clase de 60 minutos", "The trial: one class of 60 minutes"),
        table: {
          head: [text("Minutos", "Minutes"), text("Qué ocurre", "What happens")],
          widths: [16, 84],
          rows: [
            ["0–5", text("Apertura: el juez presenta el caso; alegato inicial de la Fiscalía.", "Opening: the judge introduces the case; the prosecution's opening statement.")],
            ["5–17", text("Informe forense y pausa: todo el tribunal comprueba el cálculo.", "Forensic report and pause: the whole court checks the calculation.")],
            ["17–22", text("Declara la conserje.", "The custodian testifies.")],
            ["22–37", text("Declaran los sospechosos y responden a las preguntas.", "The suspects testify and answer questions.")],
            ["37–40", text("Alegato final de la Fiscalía.", "The prosecution's closing statement.")],
            ["40–50", text("Deliberación y veredicto escrito del jurado.", "The jury deliberates and writes its verdict.")],
            ["50–60", text("Cierre del caso.", "Closing the case.")]
          ]
        }
      },
      {
        kicker,
        title: text("Las normas del juicio", "The rules of the trial"),
        bullets: text([
          "Cada participante solo debe usar la información que aparece en sus documentos.",
          "El juez puede cortar intervenciones repetidas o pedir que se distinga entre hecho y suposición.",
          "La Fiscalía debe obtener la información mediante preguntas, no leyendo la solución.",
          "El forense y la conserje deben responder solo sobre sus áreas de conocimiento.",
          "Los sospechosos deben defender su versión, aunque no sepan lo que saben los demás.",
          "Nadie enseña sus documentos a otros papeles."
        ], [
          "Each participant may use only the information in their documents.",
          "The judge may stop repetitive contributions or ask speakers to distinguish fact from assumption.",
          "The prosecution must obtain information through questions, not by reading the solution.",
          "The forensic doctor and custodian must answer only within their areas of knowledge.",
          "The suspects must defend their own account without knowing what the others know.",
          "Nobody shows their documents to other roles."
        ])
      }
    ];
  }

  /** The slides for the shared projector (cc-projector.js): the same content as document 00. */
  function slidesHtml(slides) {
    return slides.map((slide) => {
      let html = "";
      if (slide.image === "cover") {
        html += `<img src="${escapeHtml(IMAGE_SOURCES.cover)}" alt="" style="float:right;width:42%;margin:0 0 1em 1.5em;border-radius:6px">`;
      }
      if (slide.quote) html += `<blockquote>${escapeHtml(slide.quote)}</blockquote>`;
      (slide.text || []).forEach((p) => { html += `<p>${escapeHtml(p)}</p>`; });
      if (slide.bullets) html += `<ul>${slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
      if (slide.table) {
        html += `<table><thead><tr>${slide.table.head.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>`
          + slide.table.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
      }
      if (slide.note) html += `<p class="ccp-note">${escapeHtml(slide.note)}</p>`;
      return { kicker: slide.kicker, title: slide.title, html };
    });
  }

  function commonContextDoc(data) {
    const { timeline, temps, teacherFullName, teacherShortName, className } = data;
    const caseDate = formatCaseDate(data);

    return makeSpec(
      "context",
      text("01_Contexto_comun.pdf", "01_Common_context.pdf"),
      text("La historia del caso", "The case story"),
      "",
      [
        block.image("cover", "", { maxHeight: 190, minHeight: 120 }),
        block.heading(text("Historia base", "Background story")),
        block.paragraph(text(
          `El profesor ${teacherFullName} era conocido en la Universidad de Valencia por sus temidos exámenes sorpresa en "${className}".`,
          `Professor ${teacherFullName} was known at the University of Valencia for the dreaded surprise exams in "${className}".`
        )),
        block.paragraph(text(
          `${caseDate}, durante una clase especialmente tensa, el profesor ${teacherShortName} anunció otro examen sorpresa. Los murmullos llenaron el aula mientras el alumnado intercambiaba miradas de preocupación. La tensión era palpable cuando se repartieron los enunciados y comenzó la prueba cronometrada.`,
          `${caseDate}, during an especially tense class, Professor ${teacherShortName} announced another surprise exam. Murmurs filled the room as students exchanged worried looks. The tension was palpable when the papers were handed out and the timed test began.`
        )),
        block.paragraph(text(
          "A medida que pasaban los minutos, la ansiedad aumentaba. Cada estudiante intentaba recordar las soluciones de las ecuaciones diferenciales y los pasos de las transformadas de Laplace, escribiendo respuestas a toda prisa con la esperanza de acertar.",
          "As the minutes passed, anxiety grew. Each student tried to remember the solutions to the differential equations and the steps in the Laplace transforms, writing answers as quickly as possible and hoping to get them right."
        )),
        block.paragraph(text(
          "Finalmente, el examen terminó con una mezcla de alivio y temor. El alumnado salió del aula; algunos comentaban respuestas, otros caminaban en silencio pensando en su rendimiento. Más tarde, aquella tarde, la noticia se extendió rápidamente por el campus: había ocurrido un incidente estremecedor.",
          "At last, the exam ended with a mixture of relief and dread. Students filed out; some discussed answers while others walked in silence, thinking about their performance. Later that afternoon, news spread quickly across campus: a shocking incident had occurred."
        )),
        block.paragraph(text(
          "La policía llegó y acordonó la zona para iniciar la investigación. Desde el primer momento, los agentes no pudieron ignorar los rumores y susurros que circulaban entre los estudiantes.",
          "The police arrived and cordoned off the area to begin their investigation. From the outset, the officers could not ignore the rumours and whispers circulating among the students."
        )),
        block.paragraph(text(
          "La investigación del incidente que sacudió a la Universidad de Valencia condujo al juicio de tres personas sospechosas principales.",
          "The investigation into the incident that shook the University of Valencia led to the trial of three main suspects."
        )),
        block.heading(text("Resumen policial", "Police summary")),
        block.paragraph(text(
          `La mañana del caso, el profesor ${teacherShortName} impartía su clase habitual. La clase terminó a las ${formatTime(timeline.classEnd)}, pero varios estudiantes permanecieron en el edificio o cerca de él durante distintos intervalos de tiempo. Hacia las ${formatTime(timeline.discovery)}, ${data.suspects[2].withArticle} encontró el cuerpo del profesor ${teacherShortName} en el aula y avisó inmediatamente a la conserje.`,
          `On the morning of the case, Professor ${teacherShortName} taught the usual class. The class ended at ${formatTime(timeline.classEnd)}, but several students remained in or near the building for different periods. At about ${formatTime(timeline.discovery)}, ${data.suspects[2].withArticle} found Professor ${teacherShortName}'s body in the classroom and immediately alerted the building custodian.`
        )),
        block.paragraph(text(
          `El médico forense llegó a las ${formatTime(timeline.firstMeasurement)} y examinó el cuerpo en el aula. Sus mediciones, la causa de la muerte y su estimación de la hora en que se produjo se presentarán ante el tribunal durante el juicio.`,
          `The forensic doctor arrived at ${formatTime(timeline.firstMeasurement)} and examined the body in the classroom. The measurements, the cause of death and the estimate of when it occurred will be presented to the court during the trial.`
        )),
        block.paragraph(text(
          `Las personas sospechosas son estudiantes que interactuaron con el profesor ${teacherShortName} o estuvieron en el edificio entre el final de la clase y el hallazgo. ${data.suspects[0].withArticleCap} se quedó con el profesor después de la clase. ${data.suspects[1].withArticleCap} regresó más tarde para recoger una chaqueta olvidada cerca de la entrada del aula, pero no avanzó hasta la parte delantera, donde el cuerpo quedó parcialmente oculto detrás de la mesa del profesor. ${data.suspects[2].withArticleCap} volvió solo para la clase de la tarde y encontró el cuerpo. La evidencia forense, combinada con los testimonios, ayudará a establecer la culpabilidad o inocencia de cada persona sospechosa.`,
          `The suspects are students who interacted with Professor ${teacherShortName} or were in the building between the end of class and the discovery. ${data.suspects[0].withArticleCap} stayed behind with the professor after class. ${data.suspects[1].withArticleCap} returned later to collect a forgotten jacket near the classroom entrance, but did not go to the front, where the body was partly hidden behind the professor's desk. ${data.suspects[2].withArticleCap} returned only for the afternoon class and found the body. The forensic evidence, together with the testimony, will help establish each suspect's guilt or innocence.`
        ))
      ]
    );
  }

  function commonVisualDossierDoc() {
    return makeSpec(
      "visualDossier",
      text("02_Dossier_visual_comun.pdf", "02_Shared_visual_case_file.pdf"),
      text("El plano del aula", "The classroom plan"),
      "",
      [
        block.heading(text("Plano del aula", "Classroom plan")),
        block.paragraph(text(
          "Este plano puede usarse durante el juicio para situar la mesa del profesor, la zona donde se encontró el cuerpo, la entrada del aula y la chaqueta olvidada.",
          "Use this plan during the trial to locate the professor's desk, the area where the body was found, the classroom entrance, and the forgotten jacket."
        )),
        block.classroomPlan(text("Plano del aula y localización de los elementos principales.", "Classroom plan showing the main items."), { fill: true }),
        block.heading(text("Uso del dossier", "Using the case file")),
        block.bullets(text([
          "El plano no identifica a la persona culpable.",
          "Las preguntas deben centrarse en quién estuvo en cada zona, cuándo y con qué explicación.",
          "Si una persona usa el plano como prueba, debe relacionarlo con un testimonio o con un dato forense."
        ], [
          "The plan does not identify the culprit.",
          "Questions should focus on who was in each area, when, and what explanation they gave.",
          "Anyone using the plan as evidence must connect it to testimony or forensic information."
        ]))
      ]
    );
  }

  function trialGuideDoc() {
    return makeSpec(
      "trialGuide",
      text("03_Guia_desarrollo_juicio.pdf", "03_Trial_guide.pdf"),
      text("Guía de desarrollo del juicio", "Trial guide"),
      // the former subtitle named the roles that receive this document: that is now in the printing guide
      "",
      [
        block.heading(text("Estructura de la sesión", "Session structure")),
        block.trialFlow(text("Flujo recomendado del juicio.", "Recommended trial sequence.")),
        block.numbered(text([
          "El juez abre la sesión, recuerda las normas y presenta el caso.",
          "La Fiscalía expone un alegato inicial breve, sin adelantar conclusiones no probadas.",
          "El médico forense presenta la causa de muerte, las temperaturas y la estimación científica de la hora de muerte.",
          "La conserje declara sobre el edificio, el aula, la temperatura de la sala y los movimientos observados.",
          "Cada sospechoso declara y responde a preguntas.",
          "La Fiscalía ordena los hechos en un alegato final.",
          "El jurado delibera y el juez recoge el veredicto."
        ], [
          "The judge opens the session, reviews the rules, and introduces the case.",
          "The prosecution gives a brief opening statement without anticipating unproven conclusions.",
          "The forensic doctor presents the cause of death, the temperatures, and the scientific estimate of the time of death.",
          "The building custodian testifies about the building, classroom, room temperature, and observed movements.",
          "Each suspect testifies and answers questions.",
          "The prosecution arranges the facts in a closing statement.",
          "The jury deliberates and the judge receives the verdict."
        ])),
        block.heading(text("Normas para que el juicio sea autónomo", "Rules for an independent trial")),
        block.bullets(text([
          "Cada participante solo debe usar la información que aparece en sus documentos.",
          "El juez puede cortar intervenciones repetidas o pedir que se distinga entre hecho y suposición.",
          "La Fiscalía debe obtener la información mediante preguntas, no leyendo la solución.",
          "El forense y la conserje deben responder solo sobre sus áreas de conocimiento.",
          "Los sospechosos deben defender su versión, aunque no sepan lo que saben los demás."
        ], [
          "Each participant may use only the information in their documents.",
          "The judge may stop repetitive contributions or ask speakers to distinguish fact from assumption.",
          "The prosecution must obtain information through questions, not by reading the solution.",
          "The forensic doctor and custodian must answer only within their areas of knowledge.",
          "The suspects must defend their own account without knowing what the others know."
        ]))
      ]
    );
  }

  function evidenceBoardDoc(data) {
    const { timeline, temps } = data;

    return makeSpec(
      "evidenceBoard",
      text("04_Tablero_de_pruebas.pdf", "04_Evidence_board.pdf"),
      text("Tablero de pruebas", "Evidence board"),
      text("Apoyo para los roles que presentan o moderan las pruebas", "Support for the roles presenting or moderating evidence"),
      [
        block.heading(text("Tarjetas de pruebas", "Evidence cards")),
        block.evidenceCards([
          [text("Registro de temperatura", "Temperature record"), text(`${formatNumber(temps.bodyAtDeath)} C a las ${formatEventTime(timeline.normalTemp, timeline.classEnd)}`, `${formatNumber(temps.bodyAtDeath)} C at ${formatEventTime(timeline.normalTemp, timeline.classEnd)}`)],
          [text("Mediciones de enfriamiento", "Cooling measurements"), text(`${formatNumber(temps.firstMeasurement)} C y ${formatNumber(temps.secondMeasurement)} C`, `${formatNumber(temps.firstMeasurement)} C and ${formatNumber(temps.secondMeasurement)} C`)],
          [text("Registro de entradas", "Entry log"), text("Tres cronologías que deben compararse", "Three timelines to compare")],
          [text("Chaqueta olvidada", "Forgotten jacket"), text("Un regreso breve al aula", "A brief return to the classroom")],
          [text("Resultado de autopsia", "Autopsy finding"), text("Inyección, muerte instantánea", "Injection, instantaneous death")],
          [text("Sistema del aula", "Classroom system"), text(`Aula constante a ${formatNumber(temps.ambient)} C`, `Classroom held at ${formatNumber(temps.ambient)} C`)]
        ]),
        block.heading(text("Cómo usar estas tarjetas", "How to use these cards")),
        block.bullets(text([
          "El tablero no sustituye a los testimonios: cada tarjeta debe conectarse con una declaración.",
          "Las tarjetas ayudan a separar datos objetivos, interpretaciones y contradicciones.",
          "No deben entregarse como solución al jurado antes de que los datos se presenten en el juicio."
        ], [
          "The board does not replace testimony: each card must be connected to a statement.",
          "The cards help separate objective data, interpretations, and contradictions.",
          "They must not be given to the jury as a solution before the evidence is presented at trial."
        ]))
      ]
    );
  }

  function judgeDoc() {
    return makeSpec(
      "judge",
      text("05_Papel_Juez.pdf", "05_Judge_role.pdf"),
      text("El juez", "The judge"),
      text("Responsabilidades, preguntas y normas de moderación", "Responsibilities, questions, and moderation rules"),
      [
        block.heading(text("Objetivo del juez", "Judge's objective")),
        block.paragraph(text(
          "Presidir el juicio con imparcialidad, garantizar que todas las partes puedan hablar y ayudar al jurado a llegar a un veredicto razonado.",
          "Preside the trial impartially, ensure that every party can speak, and help the jury reach a reasoned verdict."
        )),
        block.heading(text("Dirigir el desarrollo del juicio", "Conducting the trial")),
        block.bullets(text([
          "Presentar brevemente el caso al jurado, que representa al conjunto de la clase.",
          "Mantener el orden y el respeto durante las declaraciones.",
          "Gestionar el tiempo de intervención de cada participante.",
          "Moderar las discusiones y asegurar que se escuchen todos los puntos de vista.",
          "Pedir aclaraciones cuando una afirmación no esté apoyada en pruebas."
        ], [
          "Briefly introduce the case to the jury, which represents the whole class.",
          "Maintain order and respect during testimony.",
          "Manage each participant's speaking time.",
          "Moderate discussion and ensure that every point of view is heard.",
          "Ask for clarification when a claim is not supported by evidence."
        ])),
        block.heading(text("Supervisar la presentación de pruebas", "Overseeing the presentation of evidence")),
        block.bullets(text([
          "Llamar al médico forense para que presente sus conclusiones sobre la causa y la hora estimada de muerte.",
          "Tu paquete incluye el informe forense y el cálculo de la hora de la muerte para que puedas moderar la pausa de comprobación. El jurado, la conserje y los sospechosos no la conocen: no la menciones antes de que declare el forense.",
          "Preguntar a la conserje por sus observaciones, registros y conocimiento de la escena.",
          "Interrogar a cada sospechoso sobre su coartada, sus movimientos y sus posibles motivos.",
          "Permitir que la Fiscalía presente sus argumentos y conecte pruebas con cronología.",
          "Dar oportunidad a las personas sospechosas de responder o refutar las acusaciones."
        ], [
          "Call the forensic doctor to present conclusions about the cause and estimated time of death.",
          "Your packet includes the forensic report and the calculation of the time of death so that you can moderate the checking pause. The jury, the custodian and the suspects do not know it: do not mention it before the forensic doctor testifies.",
          "Ask the building custodian about observations, records, and knowledge of the scene.",
          "Question each suspect about their alibi, movements, and possible motives.",
          "Allow the prosecution to present its arguments and connect evidence to the timeline.",
          "Give the suspects an opportunity to answer or rebut the allegations."
        ])),
        block.heading(text("Facilitar la deliberación del jurado", "Supporting jury deliberation")),
        block.bullets(text([
          "Resumir los puntos clave del caso y las pruebas presentadas, sin sugerir una persona culpable.",
          "Recordar al jurado que debe decidir a partir de hechos, testimonios y razonamiento científico.",
          "Asegurar que el jurado tenga tiempo para discutir y deliberar.",
          "Recoger los votos del jurado y anunciar el veredicto final."
        ], [
          "Summarise the key points and evidence without suggesting who is guilty.",
          "Remind the jury to decide from facts, testimony, and scientific reasoning.",
          "Ensure the jury has time to discuss and deliberate.",
          "Collect the jury's votes and announce the final verdict."
        ])),
        block.heading(text("Consejos de moderación", "Moderation tips")),
        block.bullets(text([
          "Mantente neutral e imparcial durante todo el juicio.",
          "Trata con respeto a todas las personas participantes, incluidas las sospechosas.",
          "Asegúrate de que se sigan las normas del procedimiento.",
          "Favorece un diálogo abierto, ordenado y constructivo."
        ], [
          "Remain neutral and impartial throughout the trial.",
          "Treat every participant, including the suspects, with respect.",
          "Make sure the rules of procedure are followed.",
          "Encourage open, orderly, and constructive dialogue."
        ]))
      ]
    );
  }

  function prosecutionDoc(data) {
    const { timeline, temps } = data;
    const [s1, s2, s3] = data.suspects;
    const second = formatNumber(temps.secondMeasurement);

    return makeSpec(
      "prosecution",
      text("06_Papel_Fiscalia.pdf", "06_Prosecution_role.pdf"),
      text("La Fiscalía", "The prosecution"),
      text("Guía para construir la acusación mediante interrogatorios", "Guide to building the case through questioning"),
      [
        block.heading(text("Alegato inicial", "Opening statement")),
        block.paragraph(text(
          "Comienza presentando el caso contra las personas sospechosas. Explica que la acusación usará pruebas forenses, razonamiento lógico y testimonios para establecer la hora de la muerte y situar a cada sospechoso en relación con esa cronología.",
          "Begin by presenting the case against the suspects. Explain that the prosecution will use forensic evidence, logical reasoning, and testimony to establish the time of death and place each suspect in relation to that timeline."
        )),
        block.heading(text("Presentación de la prueba forense", "Presenting the forensic evidence")),
        block.bullets([
          text("Explica la ley de enfriamiento de Newton y por qué permite estimar la hora de la muerte.", "Explain Newton's law of cooling and why it can estimate the time of death."),
          text(`Presenta las mediciones del forense: ${formatNumber(temps.firstMeasurement)} C a las ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} y ${second} C a las ${formatEventTime(timeline.secondMeasurement, timeline.classEnd)}.`, `Present the forensic measurements: ${formatNumber(temps.firstMeasurement)} C at ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} and ${second} C at ${formatEventTime(timeline.secondMeasurement, timeline.classEnd)}.`),
          text(`Muestra que esos datos llevan a una hora de muerte aproximada de ${formatEventTime(timeline.death, timeline.classEnd)}.`, `Show that these data give an estimated time of death of ${formatEventTime(timeline.death, timeline.classEnd)}.`),
          text("Deja claro que la prueba científica fija una ventana temporal, pero no identifica por sí sola a la persona culpable.", "Make clear that the scientific evidence fixes a time window but does not identify the culprit by itself.")
        ]),
        block.heading(text("Contexto recopilado antes del juicio", "Background gathered before the trial")),
        block.bullets([
          text("Esta información procede de conversaciones con otros compañeros de la clase y sirve solo para orientar las preguntas iniciales.", "This information comes from conversations with classmates and should only guide the opening questions."),
          text(`${s1.withArticleCap} estaba ${s1.upset} por los exámenes sorpresa. Varios no le habían salido bien y este último podía hacer que suspendiera la asignatura.`, `${s1.withArticleCap} was upset about the surprise exams. Several had gone badly, and this latest result could cause the suspect to fail the course.`),
          text(`${s2.withArticleCap} estaba pendiente de una beca importante para continuar sus estudios el año siguiente. Un mal resultado en este examen podía bajar drásticamente su nota y poner en riesgo la beca.`, `${s2.withArticleCap} was waiting for an important scholarship to continue studying the following year. A poor result could sharply lower the suspect's grade and put the scholarship at risk.`),
          text(`Sobre ${s3.withArticle} no aparece un motivo claro, pero algunos compañeros comentan que salió del edificio bastante enfadado y que, al volver por la tarde, parecía más calmado aunque triste.`, `There is no clear motive for ${s3.withArticle}, but classmates say the suspect left the building quite angry and seemed calmer, though sad, on returning that afternoon.`)
        ]),
        block.heading(text("Interrogatorio de cronologías", "Questioning the timelines")),
        block.bullets(text([
          "No presentes como conocidos los movimientos exactos de las personas sospechosas. Debes obtenerlos mediante preguntas durante el juicio.",
          "Pregunta dónde estaba cada persona al terminar la clase, cuándo abandonó el aula, si volvió al edificio y si tuvo oportunidad de acercarse al profesor.",
          "Contrasta las respuestas con la hora de muerte estimada, pero separa siempre lo que ya ha sido declarado de lo que estás intentando demostrar."
        ], [
          "Do not present the suspects' exact movements as known facts. Elicit them through questions during the trial.",
          "Ask where each person was when class ended, when they left, whether they returned, and whether they could approach the professor.",
          "Compare the answers with the estimated time of death, always separating established testimony from what you are trying to prove."
        ])),
        block.heading(text("Conexión entre pruebas y sospechosos", "Connecting evidence and suspects")),
        block.paragraph(text(
          "Usa la hora de muerte estimada y los movimientos declarados para argumentar qué presencia era compatible con el momento crítico. Señala comportamientos sospechosos, contradicciones o motivos, pero separa siempre los hechos comprobados de las hipótesis.",
          "Use the estimated time of death and the stated movements to argue whose presence was compatible with the critical period. Point out suspicious behaviour, contradictions, or motives, but always separate established facts from hypotheses."
        )),
        block.heading(text("Alegato final", "Closing statement")),
        block.bullets(text([
          "Resume la hora de muerte calculada mediante el método científico.",
          "Recuerda qué sospechosos estaban cerca del aula o del edificio en el intervalo crítico.",
          "Destaca los motivos, contradicciones o comportamientos sospechosos que hayan aparecido durante el juicio.",
          "Concluye pidiendo al juez y al jurado que valoren conjuntamente la evidencia lógica y científica antes de emitir veredicto."
        ], [
          "Summarise the scientifically calculated time of death.",
          "Recall which suspects were near the classroom or building during the critical period.",
          "Highlight any motives, contradictions, or suspicious behaviour that emerged during the trial.",
          "Conclude by asking the judge and jury to weigh the logical and scientific evidence together before reaching a verdict."
        ]))
      ]
    );
  }

  function forensicRoleDoc(data) {
    const { timeline, temps } = data;

    return makeSpec(
      "forensicRole",
      text("07_Papel_Medico_forense.pdf", "07_Forensic_doctor_role.pdf"),
      text("El médico forense", "The forensic doctor"),
      text("Objetivo, hallazgos y responsabilidades durante el juicio", "Objective, findings, and responsibilities during the trial"),
      [
        block.heading(text("Objetivo", "Objective")),
        block.paragraph(text(
          "Presentar la evidencia forense y determinar la hora y causa de la muerte mediante análisis científico.",
          "Present the forensic evidence and determine the time and cause of death through scientific analysis."
        )),
        block.heading(text("Resumen de hallazgos", "Summary of findings")),
        block.numbered([
          text(`Llamada inicial: recibiste el aviso a las ${formatEventTime(timeline.forensicCall, timeline.classEnd)} y llegaste a la universidad a las ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)}.`, `Initial call: you were notified at ${formatEventTime(timeline.forensicCall, timeline.classEnd)} and arrived at the university at ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)}.`),
          text(`Observaciones: el examen preliminar indicó muerte no natural; la temperatura corporal se midió a las ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} (${formatCelsius(temps.firstMeasurement)}) y a las ${formatEventTime(timeline.secondMeasurement, timeline.classEnd)} (${formatCelsius(temps.secondMeasurement)}).`, `Observations: the preliminary examination indicated an unnatural death; body temperature was measured at ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} (${formatCelsius(temps.firstMeasurement)}) and ${formatEventTime(timeline.secondMeasurement, timeline.classEnd)} (${formatCelsius(temps.secondMeasurement)}).`),
          text("Conclusión: la autopsia reveló homicidio premeditado mediante una inyección que provocó muerte instantánea.", "Conclusion: the autopsy revealed premeditated homicide by an injection that caused instantaneous death."),
          text("Recomendaciones: investigar a fondo, analizar la inyección utilizada y construir una cronología detallada de las actividades del profesor.", "Recommendations: investigate thoroughly, analyse the injection, and construct a detailed timeline of the professor's activities."),
          text("Notas adicionales: no se encontraron señales de entrada forzada ni un arma homicida evidente en la escena.", "Additional notes: there were no signs of forced entry and no obvious murder weapon at the scene.")
        ]),
        block.heading(text("Responsabilidades del rol", "Role responsibilities")),
        block.bullets(text([
          "Presentar las temperaturas registradas y explicar qué información aportan.",
          "Discutir la causa de muerte y las implicaciones de que se trate de un homicidio premeditado.",
          "Usar los datos de temperatura para estimar la hora de muerte.",
          "Relacionar la estimación temporal con las acciones declaradas por las personas sospechosas.",
          "Responder preguntas sobre los métodos forenses utilizados y los hallazgos de la autopsia."
        ], [
          "Present the recorded temperatures and explain what they reveal.",
          "Discuss the cause of death and the implications of premeditated homicide.",
          "Use the temperature data to estimate the time of death.",
          "Relate the time estimate to the suspects' stated actions.",
          "Answer questions about the forensic methods and autopsy findings."
        ])),
        block.heading(text("Meta durante el juicio", "Goal during the trial")),
        block.paragraph(text(
          "Ofrecer una explicación clara y científica de la hora y causa de muerte, ayudando a identificar qué testimonios son compatibles con la evidencia forense.",
          "Give a clear, scientific explanation of the time and cause of death, helping identify which accounts are compatible with the forensic evidence."
        ))
      ]
    );
  }

  function forensicReportDoc(data) {
    const { timeline, temps, teacherFullName, teacherShortName } = data;

    return makeSpec(
      "forensicReport",
      text("08_Informe_forense.pdf", "08_Forensic_report.pdf"),
      text("Informe forense", "Forensic report"),
      text(`Caso del profesor ${teacherShortName}`, `Professor ${teacherShortName}'s case`),
      [
        block.caseFile(
          [
            [text("Caso", "Case"), text(`Asesinato del profesor ${teacherShortName}`, `Murder of Professor ${teacherShortName}`)],
            [text("Víctima", "Victim"), text(`Profesor ${teacherFullName}`, `Professor ${teacherFullName}`)],
            [text("Fecha", "Date"), formatCaseDateValue(data, timeline.classEnd)],
            [text("Preparado por", "Prepared by"), text("Médico forense", "Forensic doctor")],
            [text("Estado", "Status"), text("Hallazgos forenses iniciales", "Initial forensic findings")]
          ],
          [
            {
              title: text("Resumen", "Summary"),
              body: text(`${formatCaseDate(data)}, a las ${formatTime(timeline.forensicCall)}, recibí una llamada de la conserje del edificio informándome de que el cuerpo del profesor ${teacherShortName} había sido encontrado en una de las aulas. Llegué a la universidad a las ${formatTime(timeline.firstMeasurement)} y procedí a examinar el cuerpo.`, `${formatCaseDate(data)}, at ${formatTime(timeline.forensicCall)}, I received a call from the building custodian saying that Professor ${teacherShortName}'s body had been found in a classroom. I arrived at the university at ${formatTime(timeline.firstMeasurement)} and examined the body.`)
            },
            {
              title: text("Observaciones", "Observations"),
              bullets: [
                text("El examen preliminar indicó signos de muerte no natural, probablemente causada por un agente externo.", "The preliminary examination indicated an unnatural death, probably caused by an external agent."),
                text(`En el examen inicial, la temperatura corporal del profesor ${teacherShortName} fue de ${formatCelsius(temps.firstMeasurement)}. Esto sugiere que había transcurrido un tiempo desde la muerte hasta el descubrimiento del cuerpo.`, `At the initial examination, Professor ${teacherShortName}'s body temperature was ${formatCelsius(temps.firstMeasurement)}, suggesting that some time had elapsed between death and discovery.`),
                text(`A las ${formatTime(timeline.secondMeasurement)}, la temperatura corporal del profesor ${teacherShortName} se midió de nuevo y fue de ${formatCelsius(temps.secondMeasurement)}.`, `At ${formatTime(timeline.secondMeasurement)}, Professor ${teacherShortName}'s body temperature was measured again at ${formatCelsius(temps.secondMeasurement)}.`),
                text("La autopsia detallada reveló que la causa de muerte fue un homicidio premeditado.", "The detailed autopsy found that the cause of death was premeditated homicide."),
                text("La muerte del profesor se produjo por una inyección que causó muerte instantánea.", "The professor died from an injection that caused instantaneous death.")
              ]
            },
            {
              title: text("Conclusión", "Conclusion"),
              body: text(`A partir de la evidencia forense, se concluye que el profesor ${teacherShortName} fue víctima de un homicidio. La causa de muerte fue una inyección que provocó muerte instantánea. Usando la ley de enfriamiento de Newton y las dos mediciones de temperatura, la hora de muerte se estima aproximadamente a las ${formatTime(timeline.death)} ${formatCaseDateSuffix(data, timeline.death)}.`, `The forensic evidence shows that Professor ${teacherShortName} was the victim of homicide. The cause of death was an injection that caused instantaneous death. Using Newton's law of cooling and the two temperature measurements, the time of death is estimated at approximately ${formatTime(timeline.death)} ${formatCaseDateSuffix(data, timeline.death)}.`)
            },
            {
              title: text("Recomendaciones", "Recommendations"),
              bullets: [
                text("Debe realizarse una investigación exhaustiva para identificar a la persona o personas responsables del crimen.", "A thorough investigation should identify the person or people responsible for the crime."),
                text(`La inyección utilizada para matar al profesor ${teacherShortName} debe analizarse para determinar su origen y posibles responsables.`, `The injection used to kill Professor ${teacherShortName} should be analysed to determine its origin and possible perpetrators.`),
                text(`Debe construirse una cronología detallada de las actividades del profesor ${teacherShortName} antes de su muerte para identificar posibles motivos o sospechosos.`, `A detailed timeline of Professor ${teacherShortName}'s activities before death should be constructed to identify possible motives or suspects.`)
              ]
            },
            {
              title: text("Notas adicionales", "Additional notes"),
              bullets: text([
                "No se encontraron señales de entrada forzada, lo que indica que la víctima pudo conocer a la persona agresora.",
                "La inspección de la escena no reveló ningún arma homicida evidente, lo que sugiere que la inyección se administró con un dispositivo pequeño y oculto.",
                "Este informe resume los hallazgos forenses iniciales. La investigación posterior puede revelar detalles y conclusiones adicionales."
              ], [
                "No signs of forced entry were found, suggesting that the victim may have known the attacker.",
                "No obvious murder weapon was found at the scene, suggesting that the injection was administered with a small concealed device.",
                "This report summarises the initial forensic findings. Further investigation may reveal additional details and conclusions."
              ])
            }
          ]
        )
      ]
    );
  }

  function forensicMathDoc(data) {
    return data.mathMode === "ode" ? forensicMathOdeDoc(data) : forensicMathCalculusDoc(data);
  }

  function forensicMathCalculusDoc(data) {
    const { timeline, temps } = data;
    const firstDelta = temps.firstMeasurement - temps.ambient;
    const secondDelta = temps.secondMeasurement - temps.ambient;
    const second = formatNumber(temps.secondMeasurement);
    const coolingRatio = secondDelta / firstDelta;
    const deathRatio = (temps.bodyAtDeath - temps.ambient) / firstDelta;
    const lnRatio = Math.log(coolingRatio).toFixed(4);
    const deathOffsetSigned = (Math.log(deathRatio) / Math.log(coolingRatio)).toFixed(2);
    const deathOffset = temps.estimatedHoursBeforeFirst.toFixed(2);

    return makeSpec(
      "forensicMath",
      text("09_Informe_forense_matematico.pdf", "09_Mathematical_forensic_report.pdf"),
      text("Informe matemático del caso", "Mathematical case report"),
      text("Versión para curso de cálculo", "Calculus course version"),
      [
        block.heading(text("Qué se quiere modelizar", "What the model should describe")),
        block.paragraph(text(
          "El objetivo no es adivinar una hora, sino construir un modelo matemático que conecte tres ideas: la temperatura del cuerpo, la temperatura constante del aula y el paso del tiempo.",
          "The aim is not to guess a time, but to build a mathematical model connecting three ideas: body temperature, the classroom's constant temperature, and the passage of time."
        )),
        block.paragraph(text(
          "La temperatura ambiente del aula era constante. Por eso no importa tanto la temperatura absoluta del cuerpo, sino cuántos grados está por encima del ambiente. A esa diferencia la llamamos exceso térmico: E(t) = T(t) - Ta.",
          "The classroom temperature was constant. The important quantity is therefore not the absolute body temperature, but how many degrees it is above the surroundings. We call this difference the thermal excess: E(t) = T(t) - Ta."
        )),
        block.paragraph(text(
          "La ley de enfriamiento de Newton dice que cuanto mayor es ese exceso térmico, más rápido pierde calor el cuerpo. Si el cuerpo está muy por encima de la temperatura ambiente, se enfría deprisa; si ya está cerca del ambiente, se enfría lentamente.",
          "Newton's law of cooling says that the larger this thermal excess is, the faster the body loses heat. A body far above room temperature cools quickly; as it approaches room temperature, it cools more slowly."
        )),
        block.bullets(text([
          "t se mide en horas desde la primera medición forense.",
          "T(t) es la temperatura corporal en el instante t.",
          `Ta es la temperatura ambiente del aula: ${formatCelsius(temps.ambient)}.`,
          "E(t) = T(t) - Ta mide cuánto le falta al cuerpo para alcanzar la temperatura del aula."
        ], [
          "t is measured in hours from the first forensic measurement.",
          "T(t) is the body temperature at time t.",
          `Ta is the classroom temperature: ${formatCelsius(temps.ambient)}.`,
          "E(t) = T(t) - Ta measures how far the body is from reaching room temperature."
        ])),
        block.heading(text("Información disponible", "Available information")),
        block.numbered(text([
          `Temperatura corporal normal: se toma como temperatura en el momento de la muerte ${formatCelsius(temps.bodyAtDeath)}.`,
          `Temperatura ambiente constante del aula: ${formatCelsius(temps.ambient)}.`,
          `Primera medición forense: a las ${formatTime(timeline.firstMeasurement)}, T(0) = ${formatCelsius(temps.firstMeasurement)}.`,
          `Segunda medición forense: una hora después, a las ${formatTime(timeline.secondMeasurement)}, T(1) = ${formatCelsius(temps.secondMeasurement)}.`
        ], [
          `Normal body temperature, taken as the temperature at death: ${formatCelsius(temps.bodyAtDeath)}.`,
          `Constant classroom temperature: ${formatCelsius(temps.ambient)}.`,
          `First forensic measurement: at ${formatTime(timeline.firstMeasurement)}, T(0) = ${formatCelsius(temps.firstMeasurement)}.`,
          `Second forensic measurement: one hour later, at ${formatTime(timeline.secondMeasurement)}, T(1) = ${formatCelsius(temps.secondMeasurement)}.`
        ])),
        block.heading(text("Modelo visual", "Visual model")),
        block.paragraph(text(
          "La curva de enfriamiento muestra que las mediciones no se reparten en línea recta: el descenso es más rápido cuando el cuerpo está más caliente que el aula y se va suavizando al acercarse a la temperatura ambiente.",
          "The cooling curve shows that the measurements do not lie on a straight line: the drop is faster while the body is much warmer than the room and gradually slows as it approaches room temperature."
        )),
        block.coolingCurve(timeline, temps),
        block.heading(text("Construcción del modelo con herramientas de cálculo", "Building the model with calculus")),
        block.paragraph(text(
          "Como el enfriamiento depende del exceso térmico, buscamos un modelo en el que el exceso se multiplique por el mismo factor en intervalos de tiempo iguales. Ese tipo de comportamiento se describe con una función exponencial.",
          "Because cooling depends on the thermal excess, we seek a model in which that excess is multiplied by the same factor over equal time intervals. This behaviour is described by an exponential function."
        )),
        block.paragraph(text(
          `Usaremos T(t) = ${formatNumber(temps.ambient)} + A b^t, donde A es el exceso térmico en la primera medición y b es el factor de enfriamiento por hora.`,
          `We use T(t) = ${formatNumber(temps.ambient)} + A b^t, where A is the thermal excess at the first measurement and b is the hourly cooling factor.`
        )),
        block.numbered(text([
          `En la primera medición, t = 0. Entonces ${formatNumber(temps.firstMeasurement)} = ${formatNumber(temps.ambient)} + A b^0.`,
          `Como b^0 = 1, resulta A = ${formatNumber(temps.firstMeasurement)} - ${formatNumber(temps.ambient)} = ${formatNumber(firstDelta)}.`,
          `Una hora después: ${second} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} b.`,
          `Restando la temperatura ambiente: ${formatNumber(secondDelta)} = ${formatNumber(firstDelta)} b.`,
          `Por tanto, b = ${formatNumber(secondDelta)} / ${formatNumber(firstDelta)} = ${formatNumber(coolingRatio)}.`
        ], [
          `At the first measurement, t = 0. Thus ${formatNumber(temps.firstMeasurement)} = ${formatNumber(temps.ambient)} + A b^0.`,
          `Since b^0 = 1, A = ${formatNumber(temps.firstMeasurement)} - ${formatNumber(temps.ambient)} = ${formatNumber(firstDelta)}.`,
          `One hour later: ${second} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} b.`,
          `Subtracting room temperature: ${formatNumber(secondDelta)} = ${formatNumber(firstDelta)} b.`,
          `Therefore, b = ${formatNumber(secondDelta)} / ${formatNumber(firstDelta)} = ${formatNumber(coolingRatio)}.`
        ])),
        block.paragraph(text(
          `El modelo queda T(t) = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} * ${formatNumber(coolingRatio)}^t.`,
          `The model is T(t) = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} * ${formatNumber(coolingRatio)}^t.`
        )),
        block.heading(text("Comprobación con derivadas", "Checking with derivatives")),
        block.paragraph(text(
          "Este modelo sí expresa la idea de Newton. Usando la regla de derivación de una exponencial, la derivada de b^t es ln(b) b^t.",
          "This model expresses Newton's idea. By the exponential differentiation rule, the derivative of b^t is ln(b) b^t."
        )),
        block.paragraph(text(`Por tanto, T'(t) = ${formatNumber(firstDelta)} ln(${formatNumber(coolingRatio)}) ${formatNumber(coolingRatio)}^t.`, `Therefore, T'(t) = ${formatNumber(firstDelta)} ln(${formatNumber(coolingRatio)}) ${formatNumber(coolingRatio)}^t.`)),
        block.paragraph(text(
          `Como T(t) - ${formatNumber(temps.ambient)} = ${formatNumber(firstDelta)} ${formatNumber(coolingRatio)}^t, podemos escribir T'(t) = ln(${formatNumber(coolingRatio)}) (T(t) - ${formatNumber(temps.ambient)}).`,
          `Since T(t) - ${formatNumber(temps.ambient)} = ${formatNumber(firstDelta)} ${formatNumber(coolingRatio)}^t, we can write T'(t) = ln(${formatNumber(coolingRatio)}) (T(t) - ${formatNumber(temps.ambient)}).`
        )),
        block.paragraph(text(
          `El número ln(${formatNumber(coolingRatio)}) = ${lnRatio} es negativo, así que la derivada es negativa: la temperatura baja. Además, cuanto mayor es T(t) - Ta, mayor es la rapidez de descenso. Esa es exactamente la ley de enfriamiento.`,
          `The number ln(${formatNumber(coolingRatio)}) = ${lnRatio} is negative, so the derivative is negative and the temperature falls. Moreover, the larger T(t) - Ta is, the faster the decrease. This is precisely the law of cooling.`
        )),
        block.heading(text("Determinación de la hora de muerte", "Determining the time of death")),
        block.paragraph(text(
          `En el momento de la muerte suponemos T(t) = ${formatCelsius(temps.bodyAtDeath)}. Sustituimos ese valor en el modelo para encontrar cuántas horas antes de la primera medición ocurrió.`,
          `At death we assume T(t) = ${formatCelsius(temps.bodyAtDeath)}. Substitute this value into the model to find how many hours before the first measurement death occurred.`
        )),
        block.paragraph(
          `${formatNumber(temps.bodyAtDeath)} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} * ${formatNumber(coolingRatio)}^t.`
        ),
        block.paragraph(
          `${formatNumber(temps.bodyAtDeath - temps.ambient)} = ${formatNumber(firstDelta)} * ${formatNumber(coolingRatio)}^t.`
        ),
        block.paragraph(
          `${formatNumber(deathRatio)} = ${formatNumber(coolingRatio)}^t.`
        ),
        block.paragraph(text(`Tomando logaritmos: t = ln(${formatNumber(deathRatio)}) / ln(${formatNumber(coolingRatio)}) = ${deathOffsetSigned} horas.`, `Taking logarithms: t = ln(${formatNumber(deathRatio)}) / ln(${formatNumber(coolingRatio)}) = ${deathOffsetSigned} hours.`)),
        block.paragraph(text(`El signo negativo indica que la muerte ocurrió antes de la primera medición. En valor absoluto, la diferencia es de ${deathOffset} horas.`, `The negative sign means that death occurred before the first measurement. The absolute time difference is ${deathOffset} hours.`)),
        block.paragraph(text(`${formatTime(timeline.firstMeasurement)} - ${deathOffset} horas = aproximadamente ${formatTime(timeline.death)}.`, `${formatTime(timeline.firstMeasurement)} - ${deathOffset} hours = approximately ${formatTime(timeline.death)}.`)),
        block.heading(text("Resumen", "Summary")),
        block.paragraph(text(`Hora de muerte: aproximadamente las ${formatTime(timeline.death)} ${formatCaseDateSuffix(data, timeline.death)}.`, `Time of death: approximately ${formatTime(timeline.death)} ${formatCaseDateSuffix(data, timeline.death)}.`))
      ]
    );
  }

  function forensicMathOdeDoc(data) {
    const { timeline, temps } = data;
    const firstDelta = temps.firstMeasurement - temps.ambient;
    const secondDelta = temps.secondMeasurement - temps.ambient;
    const second = formatNumber(temps.secondMeasurement);
    const coolingRatio = secondDelta / firstDelta;
    const deathRatio = (temps.bodyAtDeath - temps.ambient) / firstDelta;
    const k = temps.k.toFixed(4);
    const deathOffset = temps.estimatedHoursBeforeFirst.toFixed(2);
    const deathOffsetSigned = (-temps.estimatedHoursBeforeFirst).toFixed(2);

    return makeSpec(
      "forensicMath",
      text("09_Informe_forense_matematico.pdf", "09_Mathematical_forensic_report.pdf"),
      text("Informe matemático del caso", "Mathematical case report"),
      text("Versión para curso de ecuaciones diferenciales", "Differential equations course version"),
      [
        block.heading(text("Modelización del enfriamiento", "Modelling the cooling process")),
        block.paragraph(text(
          "La ley de enfriamiento de Newton afirma que la rapidez con que cambia la temperatura de un cuerpo es proporcional a la diferencia entre la temperatura del cuerpo y la temperatura ambiente.",
          "Newton's law of cooling states that the rate at which a body's temperature changes is proportional to the difference between the body's temperature and the ambient temperature."
        )),
        block.paragraph(text(
          "Si T(t) es la temperatura corporal y Ta la temperatura ambiente, la diferencia T(t) - Ta mide cuánto más caliente está el cuerpo que el aula. Cuando esa diferencia es grande, el cuerpo pierde calor más deprisa; cuando es pequeña, pierde calor más lentamente.",
          "If T(t) is body temperature and Ta is ambient temperature, T(t) - Ta measures how much warmer the body is than the room. When this difference is large, the body loses heat faster; when it is small, it loses heat more slowly."
        )),
        block.paragraph(text("En forma diferencial: dT(t)/dt = -k(T(t) - Ta).", "In differential form: dT(t)/dt = -k(T(t) - Ta).")),
        block.bullets(text([
          "t se mide en horas desde la primera medición forense.",
          "T(t) es la temperatura corporal en el instante t.",
          `Ta = ${formatCelsius(temps.ambient)} es la temperatura ambiente constante del aula.`,
          "k > 0 es una constante que depende de las condiciones de enfriamiento.",
          "El signo negativo indica que, si T(t) está por encima de Ta, la temperatura disminuye."
        ], [
          "t is measured in hours from the first forensic measurement.",
          "T(t) is the body temperature at time t.",
          `Ta = ${formatCelsius(temps.ambient)} is the constant classroom temperature.`,
          "k > 0 is a constant that depends on the cooling conditions.",
          "The negative sign means that when T(t) is above Ta, the temperature decreases."
        ])),
        block.heading(text("Información disponible", "Available information")),
        block.numbered(text([
          `Temperatura corporal normal en el momento de la muerte: ${formatCelsius(temps.bodyAtDeath)}.`,
          `Temperatura ambiente de la sala: ${formatCelsius(temps.ambient)}.`,
          `Mediciones forenses: a las ${formatTime(timeline.firstMeasurement)}, T(0) = ${formatCelsius(temps.firstMeasurement)}; una hora después, a las ${formatTime(timeline.secondMeasurement)}, T(1) = ${formatCelsius(temps.secondMeasurement)}.`
        ], [
          `Normal body temperature at death: ${formatCelsius(temps.bodyAtDeath)}.`,
          `Room temperature: ${formatCelsius(temps.ambient)}.`,
          `Forensic measurements: at ${formatTime(timeline.firstMeasurement)}, T(0) = ${formatCelsius(temps.firstMeasurement)}; one hour later, at ${formatTime(timeline.secondMeasurement)}, T(1) = ${formatCelsius(temps.secondMeasurement)}.`
        ])),
        block.heading(text("Modelo visual", "Visual model")),
        block.paragraph(text("La curva de enfriamiento conecta las dos mediciones forenses con la hora estimada de muerte.", "The cooling curve connects the two forensic measurements to the estimated time of death.")),
        block.coolingCurve(timeline, temps),
        block.heading(text("Resolución de la ecuación diferencial", "Solving the differential equation")),
        block.numbered(text([
          "Ecuación de enfriamiento de Newton: dT(t)/dt = -k(T(t) - Ta).",
          `Reescribiendo con Ta = ${formatNumber(temps.ambient)}: dT(t)/(T(t) - ${formatNumber(temps.ambient)}) = -k dt.`,
          `Integramos ambos lados: integral dT(t)/(T(t) - ${formatNumber(temps.ambient)}) = integral -k dt.`,
          `Por tanto, ln(T(t) - ${formatNumber(temps.ambient)}) = -kt + C.`,
          `Pasando a forma exponencial: T(t) - ${formatNumber(temps.ambient)} = A e^(-kt).`,
          `Forma final del modelo: T(t) = ${formatNumber(temps.ambient)} + A e^(-kt).`
        ], [
          "Newton's cooling equation: dT(t)/dt = -k(T(t) - Ta).",
          `Rearranging with Ta = ${formatNumber(temps.ambient)}: dT(t)/(T(t) - ${formatNumber(temps.ambient)}) = -k dt.`,
          `Integrating both sides: integral dT(t)/(T(t) - ${formatNumber(temps.ambient)}) = integral -k dt.`,
          `Therefore, ln(T(t) - ${formatNumber(temps.ambient)}) = -kt + C.`,
          `In exponential form: T(t) - ${formatNumber(temps.ambient)} = A e^(-kt).`,
          `Final model: T(t) = ${formatNumber(temps.ambient)} + A e^(-kt).`
        ])),
        block.heading(text("Cálculo de A y k", "Calculating A and k")),
        block.paragraph(text(`Tomamos t = 0 en la primera medición forense, realizada a las ${formatTime(timeline.firstMeasurement)}. En ese instante T(0) = ${formatCelsius(temps.firstMeasurement)}.`, `Set t = 0 at the first forensic measurement, taken at ${formatTime(timeline.firstMeasurement)}. At that time T(0) = ${formatCelsius(temps.firstMeasurement)}.`)),
        block.paragraph(text(`${formatNumber(temps.firstMeasurement)} = ${formatNumber(temps.ambient)} + A, así que A = ${formatNumber(firstDelta)}.`, `${formatNumber(temps.firstMeasurement)} = ${formatNumber(temps.ambient)} + A, so A = ${formatNumber(firstDelta)}.`)),
        block.paragraph(text(`El modelo queda T(t) = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} e^(-kt).`, `The model is T(t) = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} e^(-kt).`)),
        block.paragraph(text(`Una hora después se mide T(1) = ${formatCelsius(temps.secondMeasurement)}. Sustituyendo: ${second} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} e^(-k).`, `One hour later T(1) = ${formatCelsius(temps.secondMeasurement)}. Substitution gives ${second} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} e^(-k).`)),
        block.paragraph(text(`Entonces e^(-k) = (${second} - ${formatNumber(temps.ambient)}) / ${formatNumber(firstDelta)} = ${formatNumber(coolingRatio)}.`, `Thus e^(-k) = (${second} - ${formatNumber(temps.ambient)}) / ${formatNumber(firstDelta)} = ${formatNumber(coolingRatio)}.`)),
        block.paragraph(text(`Tomando logaritmos: k = -ln(${formatNumber(coolingRatio)}) = ${k} h^-1.`, `Taking logarithms: k = -ln(${formatNumber(coolingRatio)}) = ${k} h^-1.`)),
        block.heading(text("Determinación de la hora de muerte", "Determining the time of death")),
        block.paragraph(text(`Buscamos t_a tal que T(t_a) = ${formatCelsius(temps.bodyAtDeath)}: ${formatNumber(temps.bodyAtDeath)} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} e^(-${k}t_a).`, `Find t_a such that T(t_a) = ${formatCelsius(temps.bodyAtDeath)}: ${formatNumber(temps.bodyAtDeath)} = ${formatNumber(temps.ambient)} + ${formatNumber(firstDelta)} e^(-${k}t_a).`)),
        block.paragraph(text(`De aquí, ${formatNumber(deathRatio)} = e^(-${k}t_a).`, `Hence ${formatNumber(deathRatio)} = e^(-${k}t_a).`)),
        block.paragraph(text(`Tomando logaritmos: t_a = ln(${formatNumber(deathRatio)}) / (-${k}) = ${deathOffsetSigned} horas.`, `Taking logarithms: t_a = ln(${formatNumber(deathRatio)}) / (-${k}) = ${deathOffsetSigned} hours.`)),
        block.paragraph(text(`El signo negativo indica que la muerte ocurrió antes de la primera medición. En valor absoluto, la diferencia es de ${deathOffset} horas.`, `The negative sign means death occurred before the first measurement. The absolute time difference is ${deathOffset} hours.`)),
        block.paragraph(text(`${formatTime(timeline.firstMeasurement)} - ${deathOffset} horas = aproximadamente ${formatTime(timeline.death)}.`, `${formatTime(timeline.firstMeasurement)} - ${deathOffset} hours = approximately ${formatTime(timeline.death)}.`)),
        block.heading(text("Resumen", "Summary")),
        block.paragraph(text(`Hora de muerte: aproximadamente las ${formatTime(timeline.death)} ${formatCaseDateSuffix(data, timeline.death)}.`, `Time of death: approximately ${formatTime(timeline.death)} ${formatCaseDateSuffix(data, timeline.death)}.`))
      ]
    );
  }

  function janitorDoc(data) {
    const { timeline, temps } = data;
    const { teacherShortName } = data;
    const [s1, s2, s3] = data.suspects;

    return makeSpec(
      "janitor",
      text("10_Registro_Conserje.pdf", "10_Custodian_record.pdf"),
      text("La conserje", "The building custodian"),
      text("Registros del edificio y observaciones", "Building records and observations"),
      [
        block.classroomPlan(text("Plano del aula usado para situar las observaciones.", "Classroom plan used to locate the observations.")),
        block.heading(text("Objetivo", "Objective")),
        block.paragraph(text("Aportar información fiable sobre el aula, los registros del edificio, la incidencia sanitaria previa a la clase y los movimientos que observaste. No debes especular sobre la culpabilidad.", "Provide reliable information about the classroom, building records, the minor health incident before class, and the movements you observed. Do not speculate about guilt.")),
        block.heading(text("Guardiana del edificio", "Keeper of the building")),
        block.paragraph(text("Llevas años trabajando en la facultad y conoces los pasillos, aulas, accesos y rutinas del edificio. Parte de tu trabajo consiste en abrir y cerrar aulas, controlar incidencias, custodiar objetos perdidos y registrar entradas fuera del horario habitual.", "You have worked at the faculty for years and know its corridors, classrooms, entrances, and routines. Your duties include opening and closing rooms, handling incidents, keeping lost property, and logging entry outside normal hours.")),
        block.heading(text("Una rutina interrumpida", "A disrupted routine")),
        block.paragraph(text(
          `${formatCaseDate(data)}, ${s3.withArticle} regresó para una clase de la tarde y encontró el cuerpo del profesor ${teacherShortName} parcialmente oculto detrás de la mesa del profesor a las ${formatEventTime(timeline.discovery, timeline.classEnd)}. Te avisó inmediatamente y llamaste a las autoridades. El médico forense recibió el aviso a las ${formatEventTime(timeline.forensicCall, timeline.classEnd)} y llegó a la facultad a las ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)}.`,
          `${formatCaseDate(data)}, ${s3.withArticle} returned for an afternoon class and found Professor ${teacherShortName}'s body partly hidden behind the professor's desk at ${formatEventTime(timeline.discovery, timeline.classEnd)}. The suspect alerted you immediately and you called the authorities. The forensic doctor was notified at ${formatEventTime(timeline.forensicCall, timeline.classEnd)} and arrived at the faculty at ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)}.`
        )),
        block.heading(text("Por qué existe una temperatura previa", "Why an earlier temperature was recorded")),
        block.paragraph(text(
          `Antes de comenzar la clase, el profesor ${teacherShortName} pasó por conserjería para recoger unas llaves y comentar que se sentía acalorado después de subir material al aula. Siguiendo el protocolo básico de incidencias del edificio, le ofreciste agua y comprobaste con el termómetro de primeros auxilios que no tenía fiebre. Registraste una temperatura normal de ${formatCelsius(temps.bodyAtDeath)} a las ${formatEventTime(timeline.normalTemp, timeline.classEnd)}.`,
          `Before class, Professor ${teacherShortName} stopped at the front desk to collect keys and said he felt hot after carrying materials upstairs. Following the building's basic incident procedure, you offered water and used the first-aid thermometer to check for fever. You recorded a normal temperature of ${formatCelsius(temps.bodyAtDeath)} at ${formatEventTime(timeline.normalTemp, timeline.classEnd)}.`
        )),
        block.heading(text("Temperaturas y aula", "Temperatures and classroom")),
        block.bullets([
          text(`La medición previa indica que el profesor ${teacherShortName} no tenía fiebre antes de la clase.`, `The earlier measurement shows that Professor ${teacherShortName} did not have a fever before class.`),
          text(`El sistema de climatización del aula funcionaba correctamente y mantenía la sala a ${formatCelsius(temps.ambient)}.`, `The classroom climate-control system was working correctly and held the room at ${formatCelsius(temps.ambient)}.`),
          text("No viste señales de manipulación del termostato ni avisos de avería esa mañana.", "You saw no sign that the thermostat had been tampered with and received no fault reports that morning."),
          text("Este dato ayuda a interpretar el enfriamiento del cuerpo sin atribuirlo a una fiebre previa o a una temperatura anómala del aula.", "This information allows the body's cooling to be interpreted without attributing it to a prior fever or abnormal room temperature.")
        ]),
        block.heading(text("Registro de movimientos", "Movement log")),
        block.bullets([
          text(`${s1.withArticleCap} se quedó después de clase y salió del edificio aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`, `${s1.withArticleCap} stayed after class and left the building at about ${formatEventTime(timeline.death, timeline.classEnd)}.`),
          text(`${s2.withArticleCap} salió con la mayoría de la clase a las ${formatTime(timeline.classEnd)}. Volvió a entrar sobre las ${formatEventTime(timeline.suspect2Return, timeline.classEnd)} para recoger una chaqueta olvidada cerca de la entrada del aula y salió unos minutos después, hacia las ${formatEventTime(timeline.suspect2Leave, timeline.classEnd)}.`, `${s2.withArticleCap} left with most of the class at ${formatTime(timeline.classEnd)}. The suspect re-entered at about ${formatEventTime(timeline.suspect2Return, timeline.classEnd)} to collect a jacket left near the classroom entrance and departed a few minutes later, at around ${formatEventTime(timeline.suspect2Leave, timeline.classEnd)}.`),
          text(`${s3.withArticleCap} salió con el resto de la clase a las ${formatTime(timeline.classEnd)}. Al salir parecía bastante ${s3.upset}; cuando regresó para la clase de la tarde, prevista a las ${formatEventTime(timeline.afternoonClass, timeline.classEnd)}, estaba más calmado aunque parecía triste. Encontró el cuerpo al llegar unos minutos antes.`, `${s3.withArticleCap} left with the rest of the class at ${formatTime(timeline.classEnd)}. The suspect seemed quite upset on leaving; when returning for the afternoon class scheduled at ${formatEventTime(timeline.afternoonClass, timeline.classEnd)}, the suspect was calmer but appeared sad. The body was found a few minutes before class.`)
        ]),
        block.heading(text("Durante el juicio", "During the trial")),
        block.bullets(text([
          "Responde con calma y separa lo que viste de lo que deduces.",
          "Si te preguntan por el culpable, explica que tus registros solo establecen movimientos.",
          "Insiste en que la temperatura corporal previa procede de una incidencia menor registrada antes de clase, y que la temperatura de sala procede del sistema de climatización."
        ], [
          "Answer calmly and distinguish what you saw from what you infer.",
          "If asked who is guilty, explain that your records establish only people's movements.",
          "Stress that the earlier body temperature came from a minor incident logged before class and that room temperature comes from the climate-control system."
        ]))
      ]
    );
  }

  function juryDoc() {
    return makeSpec(
      "jury",
      text("11_Papel_Jurado_popular.pdf", "11_Jury_role.pdf"),
      text("El jurado popular", "The jury"),
      text("Instrucciones para escuchar y deliberar", "Instructions for listening and deliberating"),
      [
        block.paragraph(text("Este documento resume tus responsabilidades y recursos como miembro del jurado popular en el juicio por el asesinato del profesor.", "This document summarises your responsibilities and resources as a juror in the trial concerning the professor's murder.")),
        block.heading(text("Objetivo", "Objective")),
        block.paragraph(text("Escuchar con atención los argumentos y pruebas presentados durante el juicio y trabajar con el resto del jurado para alcanzar un veredicto justo y justificado.", "Listen carefully to the arguments and evidence presented at trial and work with the other jurors to reach a fair, justified verdict.")),
        block.heading(text("Responsabilidades", "Responsibilities")),
        block.numbered(text([
          "Escucha atentamente todos los testimonios: médico forense, conserje, sospechosos y Fiscalía.",
          "Toma notas sobre hechos importantes, contradicciones y pruebas que puedan influir en tu decisión.",
          "Permanece en silencio e imparcial durante el juicio: no interrumpas ni muestres favoritismo.",
          "Evalúa la credibilidad de cada testigo y la solidez de las pruebas presentadas.",
          "Compara coartadas, motivos, cronologías, evidencias físicas y contradicciones.",
          "Participa en la deliberación con respeto, compartiendo tu interpretación y escuchando la de los demás.",
          "Vota honestamente según tu comprensión del caso y las instrucciones del juez."
        ], [
          "Listen carefully to all testimony from the forensic doctor, custodian, suspects, and prosecution.",
          "Take notes on important facts, contradictions, and evidence that may affect your decision.",
          "Remain silent and impartial during the trial: do not interrupt or show favouritism.",
          "Assess each witness's credibility and the strength of the evidence.",
          "Compare alibis, motives, timelines, physical evidence, and contradictions.",
          "Participate respectfully in deliberation, sharing your interpretation and listening to others.",
          "Vote honestly according to your understanding of the case and the judge's instructions."
        ])),
        block.heading(text("Recursos", "Resources")),
        block.bullets(text([
          "Todo testimonio presentado durante el juicio.",
          "Las pruebas forenses explicadas por el médico forense.",
          "Los registros y observaciones de la conserje.",
          "Las preguntas y argumentos de la Fiscalía.",
          "Las respuestas, coartadas y posibles contradicciones de las personas sospechosas."
        ], [
          "All testimony presented during the trial.",
          "The forensic evidence explained by the forensic doctor.",
          "The custodian's records and observations.",
          "The prosecution's questions and arguments.",
          "The suspects' answers, alibis, and possible contradictions."
        ])),
        block.heading(text("Consejos", "Advice")),
        block.bullets(text([
          "Mantente imparcial: no dejes que opiniones personales influyan en tu juicio.",
          "Céntrate en hechos, no en emociones ni suposiciones.",
          "Sé respetuoso durante la deliberación, incluso si otras personas no están de acuerdo contigo.",
          "Pregúntate qué explicación tiene más sentido a partir de la evidencia.",
          "Recuerda que la carga de la prueba recae en la Fiscalía."
        ], [
          "Remain impartial: do not let personal opinions influence your judgement.",
          "Focus on facts, not emotions or assumptions.",
          "Be respectful during deliberation even when others disagree.",
          "Ask which explanation best fits the evidence.",
          "Remember that the burden of proof rests with the prosecution."
        ])),
        block.heading(text("Importante", "Important")),
        block.paragraph(text("Tu papel es esencial para que se haga justicia. Tómate la responsabilidad en serio, piensa de forma crítica y contribuye cuidadosamente a la decisión del grupo.", "Your role is essential to justice. Take the responsibility seriously, think critically, and contribute carefully to the group's decision."))
      ]
    );
  }

  function suspectOneDoc(data) {
    const { timeline } = data;
    const { teacherFullName, className } = data;
    const s1 = data.suspects[0];

    return makeSpec(
      "suspect1",
      `12_${s1.fileStem}.pdf`,
      text(`${s1.label} - Culpable de asesinato`, `${s1.label} - Guilty of murder`),
      text("Papel privado de la primera persona sospechosa", "Private role for the first suspect"),
      [
        block.heading(text("Antecedentes", "Background")),
        block.bullets([
          text(`Eres ${s1.un} estudiante ${s1.applied} de la clase de ${className} del profesor ${teacherFullName}.`, `You are ${s1.un} ${s1.applied} student in Professor ${teacherFullName}'s ${className} class.`),
          text("Siempre has sido una persona diligente y con buen rendimiento académico.", "You have always been diligent and academically successful."),
          text("Ya habías tenido varios exámenes sorpresa en esta asignatura y no te habían salido bien.", "You had already taken several surprise exams in this course, and they had not gone well."),
          text("Te molestó profundamente que el profesor anunciara otro examen sorpresa porque este último resultado podía hacer que suspendieras la asignatura.", "You were deeply upset when the professor announced another surprise exam because this result could cause you to fail the course.")
        ]),
        block.heading(text("Hechos privados", "Private facts")),
        block.bullets([
          text(`La clase terminó a las ${formatTime(timeline.classEnd)} y te quedaste ${s1.alone} con el profesor durante unos diez minutos.`, `Class ended at ${formatTime(timeline.classEnd)}, and you remained ${s1.alone} with the professor for about ten minutes.`),
          text(`Durante una discusión acalorada sobre el examen sorpresa, mataste al profesor con una inyección oculta. La muerte fue instantánea, aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`, `During a heated argument about the surprise exam, you killed the professor with a concealed injection. Death was instantaneous, at approximately ${formatEventTime(timeline.death, timeline.classEnd)}.`),
          text(`Saliste del edificio justo después, aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`, `You left the building immediately afterwards, at about ${formatEventTime(timeline.death, timeline.classEnd)}.`),
          text("Después fuiste a casa a comer con tu familia.", "You then went home to eat with your family.")
        ]),
        block.heading(text("Versión pública", "Public account")),
        block.bullets(text([
          "Reconoce que hubo un desacuerdo por el examen, pero afirma que aceptaste la decisión a regañadientes y sin más conflicto.",
          "Di que cuando saliste del aula el profesor seguía vivo y parecía encontrarse bien.",
          "Admite que estabas preocupado por suspender, pero insiste en que suspender una asignatura no es motivo suficiente para asesinar a nadie.",
          `Insiste en que una discusión académica, incluso seria, no convierte a una persona en asesina.`
        ], [
          "Acknowledge the disagreement over the exam, but say you reluctantly accepted the decision without further conflict.",
          "Say that the professor was still alive and appeared well when you left.",
          "Admit that you feared failing, but insist that failing a course is not sufficient motive to murder anyone.",
          "Insist that even a serious academic dispute does not make someone a murderer."
        ])),
        block.heading(text("Argumentos de defensa", "Defence arguments")),
        block.numbered(text([
          "Presencia en el aula: admite que te quedaste después de clase, pero sostiene que el profesor seguía vivo cuando te marchaste.",
          "Ausencia de motivo suficiente: reconoce la preocupación por la nota, pero presenta el desacuerdo como una discusión académica, no como una razón para cometer un asesinato.",
          "Dudas sobre el cálculo forense: cuestiona la precisión de la estimación de la hora de muerte y su dependencia de una temperatura ambiente constante.",
          "Sistema del aula: sugiere que la climatización pudo cambiar después de clase o que cualquier variación afectaría a los cálculos de enfriamiento."
        ], [
          "Presence in the classroom: admit staying after class, but maintain that the professor was alive when you left.",
          "No sufficient motive: acknowledge concern about the grade, but frame the disagreement as an academic argument rather than a reason for murder.",
          "Doubts about the forensic calculation: question the precision of the time-of-death estimate and its dependence on constant room temperature.",
          "Classroom system: suggest that the climate control may have changed after class or that any variation would affect the cooling calculations."
        ])),
        block.heading(text("Conclusión", "Conclusion")),
        block.bullets(text([
          "Afirma tu inocencia y desafía las conclusiones de la Fiscalía.",
          "Repite que los cálculos de temperatura no bastan por sí solos para acusarte.",
          "No reveles tu culpabilidad salvo que el desarrollo del juicio te acorrale de forma inevitable."
        ], [
          "Maintain your innocence and challenge the prosecution's conclusions.",
          "Repeat that temperature calculations alone are not enough to accuse you.",
          "Do not reveal your guilt unless the trial leaves you with no possible escape."
        ])),
        block.heading(text("Objetivo", "Objective")),
        block.paragraph(text("Convencer al juez y al jurado de que eres inocente y de que los cálculos de temperatura son insuficientes para atribuirte el crimen.", "Convince the judge and jury that you are innocent and that the temperature calculations are insufficient to attribute the crime to you."))
      ]
    );
  }

  function suspectTwoDoc(data) {
    const { timeline } = data;
    const { teacherShortName, className } = data;
    const s2 = data.suspects[1];

    return makeSpec(
      "suspect2",
      `13_${s2.fileStem}.pdf`,
      text(`${s2.label} - Inocente`, `${s2.label} - Innocent`),
      text("Papel privado de la segunda persona sospechosa", "Private role for the second suspect"),
      [
        block.heading(text("Antecedentes", "Background")),
        block.bullets([
          text(`Eres ${s2.un} estudiante ${s2.attentive} y puntual de la clase de ${className} del profesor ${teacherShortName}.`, `You are ${s2.un} ${s2.attentive}, punctual student in Professor ${teacherShortName}'s ${className} class.`),
          text("Normalmente tienes buena relación con tus compañeros y con el profesor.", "You normally have a good relationship with your classmates and the professor."),
          text("Estás pendiente de una beca muy importante para continuar tus estudios el próximo curso en otra universidad.", "You are awaiting the outcome of an important scholarship to continue your studies at another university next year."),
          text("Creías que tenías muchas posibilidades de conseguirla, pero el examen sorpresa te salió mal porque no lo habías preparado.", "You thought you had a strong chance, but the surprise exam went badly because you had not prepared for it."),
          text("Temes que esa nota baje drásticamente tu media y pueda hacer que pierdas la beca.", "You fear the result will sharply lower your average and cost you the scholarship.")
        ]),
        block.heading(text("Hechos", "Facts")),
        block.bullets([
          text(`Cuando la clase terminó a las ${formatTime(timeline.classEnd)}, saliste del aula con la mayoría del grupo.`, `When class ended at ${formatTime(timeline.classEnd)}, you left with most of the group.`),
          text("Al llegar a la estación de metro, te diste cuenta de que habías olvidado una chaqueta y volviste al edificio.", "At the metro station, you realised you had forgotten a jacket and returned to the building."),
          text(`Entraste de nuevo sobre las ${formatEventTime(timeline.suspect2Return, timeline.classEnd)}, fuiste solo hasta la entrada del aula para recoger la chaqueta y saliste unos minutos después, hacia las ${formatEventTime(timeline.suspect2Leave, timeline.classEnd)}.`, `You re-entered at about ${formatEventTime(timeline.suspect2Return, timeline.classEnd)}, went only as far as the classroom entrance to collect the jacket, and left a few minutes later at around ${formatEventTime(timeline.suspect2Leave, timeline.classEnd)}.`),
          text("No viste al profesor porque permaneciste cerca de la entrada; desde allí no se veía la parte delantera del aula ni la zona detrás de la mesa.", "You did not see the professor because you stayed near the entrance, from which neither the front of the room nor the area behind the desk was visible."),
          text("Después fuiste a casa a comer con tu familia.", "You then went home to eat with your family.")
        ]),
        block.heading(text("Argumentos de defensa", "Defence arguments")),
        block.numbered(text([
          "Salida con el grupo: subraya que abandonaste el aula con el resto de estudiantes al terminar la clase.",
          "Regreso breve y limitado: explica que volviste solo por la chaqueta y no avanzaste hacia la mesa del profesor.",
          "Desconocimiento de la muerte: recalca que no sabías nada de lo ocurrido hasta que se informó más tarde.",
          "Motivo insuficiente: reconoce que la beca te preocupaba, pero insiste en que una mala nota no justifica hacer daño a nadie.",
          `Falta de oportunidad: subraya que en el momento estimado de la muerte no estabas directamente en el aula.`
        ], [
          "Leaving with the group: stress that you left the classroom with the other students when class ended.",
          "Brief, limited return: explain that you returned only for the jacket and did not approach the professor's desk.",
          "No knowledge of the death: emphasise that you knew nothing about it until the news was reported later.",
          "Insufficient motive: acknowledge concern about the scholarship but insist that a poor grade does not justify harming anyone.",
          "No opportunity: stress that you were not in the classroom at the estimated time of death."
        ])),
        block.heading(text("Conclusión", "Conclusion")),
        block.bullets(text([
          "Afirma tu inocencia.",
          "Enfatiza que tu comportamiento encaja con alguien que olvidó un objeto y volvió brevemente a recogerlo.",
          "Señala que, aunque estabas preocupado por la beca, no tenías oportunidad real para cometer el crimen."
        ], [
          "Maintain your innocence.",
          "Emphasise that your behaviour fits someone who forgot an item and briefly returned to collect it.",
          "Point out that although the scholarship worried you, you had no real opportunity to commit the crime."
        ])),
        block.heading(text("Objetivo", "Objective")),
        block.paragraph(text("Convencer al juez y al jurado de que tu regreso fue breve, explicable y no compatible con haber cometido el crimen.", "Convince the judge and jury that your return was brief, explainable, and incompatible with committing the crime."))
      ]
    );
  }

  function suspectThreeDoc(data) {
    const { timeline } = data;
    const { className } = data;
    const s3 = data.suspects[2];

    return makeSpec(
      "suspect3",
      `14_${s3.fileStem}.pdf`,
      text(`${s3.label} - Inocente`, `${s3.label} - Innocent`),
      text("Papel privado de la tercera persona sospechosa", "Private role for the third suspect"),
      [
        block.heading(text("Antecedentes", "Background")),
        block.bullets([
          text(`Eres ${s3.un} estudiante ${s3.responsible} que asiste regularmente a las clases de ${className} de la mañana y de la tarde.`, `You are ${s3.un} ${s3.responsible} student who regularly attends the morning and afternoon ${className} classes.`),
          text("Tienes buena relación con el profesor y con el resto del grupo.", "You have a good relationship with the professor and the rest of the group."),
          text("Saliste del edificio enfadado tras el examen sorpresa, pero fue una reacción de frustración y no un conflicto personal con el profesor.", "You left the building angry after the surprise exam, but it was frustration rather than a personal conflict with the professor."),
          text("Cuando volviste por la tarde estabas más calmado, aunque triste por cómo había ido la mañana.", "When you returned that afternoon, you were calmer, though sad about how the morning had gone.")
        ]),
        block.heading(text("Hechos", "Facts")),
        block.bullets([
          text(`Cuando la clase terminó a las ${formatTime(timeline.classEnd)}, saliste del aula con el resto de estudiantes.`, `When class ended at ${formatTime(timeline.classEnd)}, you left with the other students.`),
          text("Fuiste a casa y comiste con tu familia.", "You went home and ate with your family."),
          text(`Regresaste a la facultad para una clase de la tarde prevista a las ${formatEventTime(timeline.afternoonClass, timeline.classEnd)}.`, `You returned to the faculty for an afternoon class scheduled at ${formatEventTime(timeline.afternoonClass, timeline.classEnd)}.`),
          text(`Llegaste unos minutos antes, a las ${formatEventTime(timeline.discovery, timeline.classEnd)}, y encontraste el cuerpo del profesor en el aula.`, `You arrived a few minutes early, at ${formatEventTime(timeline.discovery, timeline.classEnd)}, and found the professor's body in the classroom.`),
          text("Avisaste inmediatamente a la conserje, que contactó con las autoridades.", "You immediately alerted the building custodian, who contacted the authorities.")
        ]),
        block.heading(text("Argumentos de defensa", "Defence arguments")),
        block.numbered(text([
          "Salida con el grupo: recalca que saliste con el resto de estudiantes cuando acabó la clase.",
          "Descubrimiento del cuerpo: explica que al llegar para la clase de la tarde el profesor ya estaba muerto.",
          "Acción inmediata: destaca que actuaste de forma responsable avisando a la conserje en cuanto encontraste el cuerpo.",
          "Falta de oportunidad: insiste en que en el momento estimado de la muerte no estabas directamente en el aula.",
          `Falta de motivo claro: explica que tu enfado era por el examen, no contra el profesor como persona.`
        ], [
          "Leaving with the group: stress that you left with the other students when class ended.",
          "Discovering the body: explain that the professor was already dead when you arrived for the afternoon class.",
          "Immediate action: emphasise that you acted responsibly by alerting the custodian as soon as you found the body.",
          "No opportunity: insist that you were not in the classroom at the estimated time of death.",
          "No clear motive: explain that your anger concerned the exam, not the professor personally."
        ])),
        block.heading(text("Conclusión", "Conclusion")),
        block.bullets(text([
          "Afirma tu inocencia.",
          "Subraya que tu cronología indica que no estabas presente en el momento de la muerte.",
          "Destaca tu comportamiento responsable al informar inmediatamente del hallazgo."
        ], [
          "Maintain your innocence.",
          "Stress that your timeline places you away from the scene at the time of death.",
          "Highlight your responsible behaviour in immediately reporting the discovery."
        ])),
        block.heading(text("Objetivo", "Objective")),
        block.paragraph(text("Convencer al juez y al jurado de tu inocencia presentando con claridad tus acciones, tu cronología y tu falta de motivo.", "Convince the judge and jury of your innocence by clearly presenting your actions, timeline, and lack of motive."))
      ]
    );
  }

  function teacherSolutionDoc(data) {
    const { timeline, temps } = data;
    const [s1, s2, s3] = data.suspects;
    const second = formatNumber(temps.secondMeasurement);
    const k = temps.k.toFixed(4);

    return makeSpec(
      "teacherSolution",
      text("99_Solucion_docente.pdf", "99_Teacher_solution.pdf"),
      text("Solución docente", "Teacher solution"),
      text("Cronología completa, culpable y reparto de información", "Complete timeline, culprit, and distribution of information"),
      [
        block.heading(text("Resultado", "Result")),
        block.paragraph(text(
          `${s1.withArticleCap} es la persona culpable. Se quedó ${s1.alone} con el profesor tras la clase y la muerte instantánea se produjo aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`,
          `${s1.withArticleCap} is the culprit. The suspect remained ${s1.alone} with the professor after class, and instantaneous death occurred at approximately ${formatEventTime(timeline.death, timeline.classEnd)}.`
        )),
        block.heading(text("Cronología visual", "Visual timeline")),
        block.scaledTimeline(text("Cronología completa con escala proporcional", "Complete timeline to scale"), buildScaledTimelineLanes(data)),
        block.heading(text("Tabla de sospechosos", "Suspect table")),
        block.suspectTable([
          [s1.label, text("Varios exámenes sorpresa le salieron mal; este último podía hacer que suspendiera.", "Several surprise exams went badly; this one could cause the suspect to fail."), text(`Tuvo contacto directo tras la clase y estuvo a solas hasta ${formatEventTime(timeline.death, timeline.classEnd)}.`, `Had direct contact after class and was alone with the professor until ${formatEventTime(timeline.death, timeline.classEnd)}.`), text("Afirma que el profesor seguía vivo", "Claims the professor was still alive")],
          [s2.label, text("Beca importante en riesgo si el examen baja mucho su nota.", "Important scholarship at risk if the exam sharply lowers the grade."), text("Sin oportunidad directa: en el momento del asesinato no estaba en el aula; volvió después por la chaqueta.", "No direct opportunity: was outside the classroom at the time of the murder and returned later for the jacket."), text("Se quedó en la entrada", "Stayed near the entrance")],
          [s3.label, text("Sin motivo claro; salió enfadado y volvió más calmado, aunque triste.", "No clear motive; left angry and returned calmer, though sad."), text("Sin oportunidad directa: en el momento del asesinato no estaba en el aula; regresó para la clase de la tarde.", "No direct opportunity: was outside the classroom at the time of the murder and returned for the afternoon class."), text("Encontró el cuerpo", "Found the body")]
        ]),
        block.heading(text("Solución matemática", "Mathematical solution")),
        block.coolingCurve(timeline, temps),
        block.paragraph(text(`Con temperatura ambiente Ta = ${formatNumber(temps.ambient)} C, T(0) = ${formatNumber(temps.firstMeasurement)} C y T(1) = ${second} C, se obtiene k = ${k} h^-1.`, `With ambient temperature Ta = ${formatNumber(temps.ambient)} C, T(0) = ${formatNumber(temps.firstMeasurement)} C, and T(1) = ${second} C, we obtain k = ${k} h^-1.`)),
        block.paragraph(text(`La ecuación con t = 0 en la primera medición es T(t) = 22 + ${formatNumber(temps.firstMeasurement - temps.ambient)} e^(-${k}t). Al imponer T = ${formatNumber(temps.bodyAtDeath)} C, resulta t = -${temps.estimatedHoursBeforeFirst.toFixed(2)} h.`, `With t = 0 at the first measurement, the equation is T(t) = 22 + ${formatNumber(temps.firstMeasurement - temps.ambient)} e^(-${k}t). Setting T = ${formatNumber(temps.bodyAtDeath)} C gives t = -${temps.estimatedHoursBeforeFirst.toFixed(2)} h.`)),
        block.paragraph(text(`Por tanto, la muerte ocurre unas ${temps.estimatedHoursBeforeFirst.toFixed(2)} horas antes de la primera medición, es decir, a las ${formatEventTime(timeline.death, timeline.classEnd)}.`, `Therefore, death occurred about ${temps.estimatedHoursBeforeFirst.toFixed(2)} hours before the first measurement, at ${formatEventTime(timeline.death, timeline.classEnd)}.`)),
        block.heading(text("Reparto de información", "Distribution of information")),
        block.bullets([
          text("La historia del caso: se incluye en todos los paquetes por rol.", "Case story: included in every role packet."),
          text("Guía de desarrollo del juicio: juez, Fiscalía, médico forense y conserje.", "Trial guide: judge, prosecution, forensic doctor, and building custodian."),
          text("Plano: juez, Fiscalía, médico forense y conserje.", "Classroom plan: judge, prosecution, forensic doctor, and building custodian."),
          text("Tablero de pruebas: juez, Fiscalía y docente.", "Evidence board: judge, prosecution, and teacher."),
          text("Informe forense e informe matemático: médico forense, Fiscalía y juez. La hora estimada de la muerte no figura en la historia del caso: el resto del tribunal la descubre cuando declara el forense.", "Forensic and mathematical reports: forensic doctor, prosecution, and judge. The estimated time of death is not in the case story: the rest of the court discovers it when the forensic doctor testifies."),
          text(`${s1.withArticleCap}: conoce su culpabilidad y su versión pública.`, `${s1.withArticleCap}: knows about the guilt and public account.`),
          text(`${s2.withArticleCap} y ${s3.withArticle}: conocen solo sus propias coartadas.`, `${s2.withArticleCap} and ${s3.withArticle}: know only their own alibis.`)
        ]),
        block.note(text(
          "Qué se imprime, cuántas copias y cuándo se entrega cada documento: véase la «Guía de impresión y reparto» (LEEME_guia_de_impresion_y_reparto.pdf).",
          "What to print, how many copies and when each document is handed out: see the \"Printing and distribution guide\" (README_printing_and_distribution_guide.pdf)."
        ))
      ],
      { teacher: true }
    );
  }

  function makeSpec(id, fileName, title, subtitle, blocks, options = {}) {
    return { id, fileName, downloadLabel: title, title, subtitle, blocks, teacher: Boolean(options.teacher) };
  }

  function makeBundleSpec(id, fileName, downloadLabel, title, docs) {
    const blocks = [];
    docs.forEach((docSpec, index) => {
      if (index > 0) {
        blocks.push(block.pageBreak());
      }
      if (docSpec.slides) {
        // the presentation keeps its 16:9 pages inside the packet
        blocks.push({ type: "slides", slides: docSpec.slides });
        return;
      }
      blocks.push(Object.assign(block.chapter(docSpec.downloadLabel, docSpec.subtitle), { teacher: docSpec.teacher }));
      blocks.push(...docSpec.blocks);
    });

    return {
      id,
      fileName,
      downloadLabel,
      title,
      subtitle: "",
      blocks,
      chapters: true,
      teacher: docs.some((docSpec) => docSpec.teacher)
    };
  }

  function buildPdfFile(spec, images, pageFormat) {
    if (spec.slides) {
      return buildSlidesFile(spec, images);
    }
    let pdf = renderPdf(spec, images, pageFormat);
    // a few lines alone on the last page: try again with tighter gaps between blocks (the
    // 5.2 mm leading stays) and keep that spacing when it saves the page
    if (!spec.chapters && pdf.getNumberOfPages() > 1 && pdf.lastPageUse < 0.3) {
      const compact = renderPdf(spec, images, pageFormat, true);
      if (compact.getNumberOfPages() < pdf.getNumberOfPages()) {
        pdf = compact;
      }
    }
    // in a packet, the same test chapter by chapter (each document starts on a new page)
    if (spec.chapters) {
      const withCompact = (indices) => Object.assign({}, spec, {
        blocks: spec.blocks.map((item, index) => (indices.includes(index) ? Object.assign({}, item, { compact: true }) : item))
      });
      const candidates = pdf.chapters.filter((c) => c.pages > 1 && c.lastUse < 0.3).map((c) => c.index);
      if (candidates.length) {
        const trial = renderPdf(withCompact(candidates), images, pageFormat);
        const pagesOf = (doc, index) => doc.chapters.find((c) => c.index === index).pages;
        const useful = candidates.filter((index) => pagesOf(trial, index) < pagesOf(pdf, index));
        if (useful.length === candidates.length) {
          pdf = trial;
        } else if (useful.length) {
          pdf = renderPdf(withCompact(useful), images, pageFormat);
        }
      }
    }
    return {
      id: spec.id,
      fileName: spec.fileName,
      label: spec.downloadLabel,
      teacher: spec.teacher,
      pages: pdf.getNumberOfPages(),
      blob: pdf.output("blob")
    };
  }

  /*
   * Sizes in points (ESTANDAR_WEB_ACTIVIDADES.md, 4.1): body 11 pt with 5.2 mm leading, boxes
   * 10.5, notes and captions 9.5, tables 9.5, labels inside drawings at least 8.5 (here 9-9.5),
   * footer 8, headings 14, subheadings 11.5, document title 20. The generator keeps its own
   * look: Helvetica throughout, slate headings, the paper-coloured boxes and its accents.
   */
  const FONT = {
    title: 20, titleLead: 24, subtitle: 11, subtitleLead: 15,
    chapter: 15, chapterLead: 18,
    heading: 14, headingLead: 18, sub: 11.5, subLead: 15,
    body: 11, lead: 14.75,
    box: 10.5, boxLead: 14,
    note: 9.5, noteLead: 12.5,
    table: 9.5, meta: 9.5, small: 8,
    label: 9, labelStrong: 9.5
  };
  const COLOR = {
    ink: [32, 42, 51], muted: [90, 101, 112], line: [216, 222, 228], grid: [201, 209, 216],
    paper: [247, 245, 239], zebra: [239, 243, 246], accent: [200, 86, 72], accentDark: [153, 63, 53],
    blue: [47, 95, 119], green: [96, 127, 97]
  };

  function newPdf(pageFormat) {
    const { jsPDF } = window.jspdf;
    return new jsPDF({ unit: "pt", format: pageFormat === "letter" ? "letter" : "a4" });
  }

  /** A measuring page has no bottom: blocks flow without page breaks and flexible blocks take their smallest size. */
  /** Vertical gaps; the compact set is used when the normal one leaves a few lines alone on a last page. */
  const GAPS = {
    normal: { headingBefore: 4, headingAfter: 6, paragraph: 7, item: 2.5, listEnd: 4 },
    compact: { headingBefore: 1, headingAfter: 4, paragraph: 4, item: 1, listEnd: 2 }
  };

  function makePage(doc, pageFormat, measuring, compact) {
    return {
      gaps: compact ? GAPS.compact : GAPS.normal,
      compact: Boolean(compact),
      width: doc.internal.pageSize.getWidth(),
      height: measuring ? 1e7 : doc.internal.pageSize.getHeight(),
      marginX: 46,
      marginTop: 50,
      marginBottom: 52,
      format: pageFormat,
      measuring: Boolean(measuring)
    };
  }

  const contentWidth = (page) => page.width - page.marginX * 2;
  /** Space left on the current page, above the footer band. */
  const room = (page, cursor) => page.height - page.marginBottom - cursor.y;

  function renderPdf(spec, images, pageFormat, compact) {
    const doc = newPdf(pageFormat);
    const page = makePage(doc, pageFormat, false, compact);
    const cursor = { y: page.marginTop };

    addDocumentTitle(doc, page, cursor, spec.title, spec.subtitle, spec.teacher);
    const use = () => (cursor.y - page.marginTop) / (page.height - page.marginTop - page.marginBottom);
    // in a packet, the pages and the use of the last page of every chapter (document)
    const chapters = [];
    const close = () => {
      const open = chapters[chapters.length - 1];
      if (open && open.pages == null) {
        open.pages = doc.getNumberOfPages() - open.start + 1;
        open.lastUse = use();
      }
    };
    spec.blocks.forEach((item, index) => {
      if (item.type === "pageBreak") close();
      if (item.type === "chapter") chapters.push({ index, start: doc.getNumberOfPages() });
      renderBlock(doc, page, cursor, item, images, restOf(spec.blocks, index));
    });
    close();
    addFooters(doc, page, spec.downloadLabel);
    doc.lastPageUse = use();
    doc.chapters = chapters;
    return doc;
  }

  function renderBlocks(doc, page, cursor, blocks, images) {
    blocks.forEach((item, index) => renderBlock(doc, page, cursor, item, images, restOf(blocks, index)));
  }

  /** The blocks after `index` up to the end of the current document (next page break or chapter). */
  function restOf(blocks, index) {
    const rest = [];
    for (let k = index + 1; k < blocks.length && blocks[k].type !== "pageBreak" && blocks[k].type !== "chapter"; k += 1) {
      rest.push(blocks[k]);
    }
    return rest;
  }

  /** Height of the blocks as one continuous flow, flexible blocks at their smallest size. */
  function measureBlocks(blocks, images, pageFormat, compact) {
    if (!blocks || !blocks.length) {
      return 0;
    }
    const doc = newPdf(pageFormat);
    const page = makePage(doc, pageFormat, true, compact);
    const cursor = { y: 0 };
    renderBlocks(doc, page, cursor, blocks, images);
    return cursor.y;
  }

  /**
   * Height for a flexible block (a drawing, a chart, the evidence cards): it fills the page
   * when the rest of the document fits below it, keeps its preferred size when it does not,
   * and shrinks down to `min` rather than leave a gap at the foot of the page.
   */
  function fitHeight(doc, page, cursor, rest, images, { pref, min, max, extra }) {
    if (page.measuring) {
      return min;
    }
    const restHeight = measureBlocks(rest, images, page.format, page.compact) + 10;
    let available = room(page, cursor) - extra;
    if (available < min) {
      newPage(doc, page, cursor);
      available = room(page, cursor) - extra;
    }
    if (available - restHeight >= pref) {
      return Math.min(max, available - restHeight);
    }
    if (available - restHeight >= min) {
      return available - restHeight;   // smaller than preferred, so that the document ends on this page
    }
    return Math.max(min, Math.min(pref, available));
  }

  function newPage(doc, page, cursor) {
    if (page.measuring) {
      return;
    }
    doc.addPage(page.format === "letter" ? "letter" : "a4", "portrait");
    cursor.y = page.marginTop;
  }

  function ensureSpace(doc, page, cursor, needed) {
    if (cursor.y + needed > page.height - page.marginBottom) {
      newPage(doc, page, cursor);
    }
  }

  const atPageTop = (page, cursor) => cursor.y <= page.marginTop + 0.5;

  function stampWidth(doc) {
    doc.setFont("helvetica", "bold").setFontSize(FONT.small);
    return doc.getTextWidth(text("SOLO PROFESORADO", "TEACHER ONLY")) + 10;
  }

  /** "Teacher only" stamp, right-aligned at `right`, centred on the line of baseline `baseline`. */
  function drawStamp(doc, right, baseline) {
    const label = text("SOLO PROFESORADO", "TEACHER ONLY");
    const width = stampWidth(doc);
    doc.setDrawColor(...COLOR.accentDark).setLineWidth(0.8);
    doc.rect(right - width, baseline - 12, width, 15);
    doc.setFont("helvetica", "bold").setFontSize(FONT.small).setTextColor(...COLOR.accentDark);
    doc.text(label, right - width / 2, baseline - 1.8, { align: "center" });
    doc.setLineWidth(0.2);
  }

  function addDocumentTitle(doc, page, cursor, title, subtitle, teacher) {
    const top = cursor.y;
    const stampSpace = teacher ? stampWidth(doc) + 12 : 0;
    const width = contentWidth(page) - 18;
    doc.setFont("helvetica", "bold").setFontSize(FONT.title);
    const titleLines = doc.splitTextToSize(String(title), width - stampSpace);
    doc.setFont("helvetica", "normal").setFontSize(FONT.subtitle);
    const subLines = subtitle ? doc.splitTextToSize(String(subtitle), width) : [];
    const lastBaseline = subLines.length
      ? top + titleLines.length * FONT.titleLead + 6 + (subLines.length - 1) * FONT.subtitleLead
      : top + (titleLines.length - 1) * FONT.titleLead;
    doc.setFillColor(...COLOR.ink);
    doc.rect(page.marginX, top - 8, 6, lastBaseline + (subLines.length ? 12 : 10) - (top - 8), "F");
    if (teacher) {
      drawStamp(doc, page.width - page.marginX, top);
    }
    doc.setFont("helvetica", "bold").setFontSize(FONT.title).setTextColor(...COLOR.ink);
    titleLines.forEach((line, k) => doc.text(line, page.marginX + 18, top + k * FONT.titleLead));
    cursor.y = top + titleLines.length * FONT.titleLead + 6;
    if (subLines.length) {
      doc.setFont("helvetica", "normal").setFontSize(FONT.subtitle).setTextColor(...COLOR.muted);
      subLines.forEach((line) => {
        doc.text(line, page.marginX + 18, cursor.y);
        cursor.y += FONT.subtitleLead;
      });
      cursor.y += 12;
    }
    doc.setDrawColor(...COLOR.line).setLineWidth(0.6);
    doc.line(page.marginX, cursor.y, page.width - page.marginX, cursor.y);
    cursor.y += 22;
  }

  /** Height that the start of `next` needs on the page of a heading: three lines of text, or the whole figure. */
  function keepHeight(doc, page, cursor, next, images) {
    if (!next || page.measuring) {
      return 0;
    }
    const width = contentWidth(page);
    if (next.type === "paragraph" || next.type === "note") {
      doc.setFont("helvetica", "normal").setFontSize(next.type === "note" ? FONT.note : FONT.body);
      const lead = next.type === "note" ? FONT.noteLead : FONT.lead;
      return Math.min(3, doc.splitTextToSize(String(next.text), width).length) * lead;
    }
    if (next.type === "bullets" || next.type === "numbered") {
      doc.setFont("helvetica", "normal").setFontSize(FONT.body);
      let lines = 0;
      let gaps = 0;
      for (const item of next.items) {
        lines += doc.splitTextToSize(String(item), width - 18).length;
        if (lines >= 3) break;
        gaps += 2.5;
      }
      return Math.min(3, lines) * FONT.lead + gaps;
    }
    if (next.type === "heading" || next.type === "pageBreak" || next.type === "chapter") {
      return 0;
    }
    if (next.type === "table" || next.type === "suspectTable") {
      const whole = measureBlocks([next], images, page.format, page.compact) - 16;
      const probe = { y: cursor.y + FONT.headingLead + page.gaps.headingAfter };
      return tableMovesWhole(page, probe, whole)
        ? whole + 4
        : measureBlocks([Object.assign({}, next, { rows: next.rows.slice(0, 1) })], images, page.format, page.compact);
    }
    return Math.min(measureBlocks([next], images, page.format, page.compact), (page.height - page.marginTop - page.marginBottom) * 0.6);
  }

  function renderBlock(doc, page, cursor, item, images, rest = []) {
    if (item.type === "pageBreak") {
      newPage(doc, page, cursor);
      return;
    }

    if (item.type === "slides") {
      if (page.measuring) {
        return;
      }
      // it follows a page break: the empty portrait page gives way to the 16:9 slides
      if (atPageTop(page, cursor) && doc.getNumberOfPages() > 1) {
        doc.deletePage(doc.getNumberOfPages());
      }
      drawSlides(doc, item.slides, images, true);
      cursor.y = page.marginTop;
      return;
    }

    if (item.type === "chapter") {
      page.gaps = item.compact ? GAPS.compact : GAPS.normal;
      page.compact = Boolean(item.compact);
      addChapterBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "heading") {
      if (!atPageTop(page, cursor)) {
        cursor.y += page.gaps.headingBefore;
      }
      // a heading never stays alone at the foot of a page: it goes with three lines of its content
      ensureSpace(doc, page, cursor, FONT.headingLead + page.gaps.headingAfter + keepHeight(doc, page, cursor, rest[0], images));
      addWrappedText(doc, page, cursor, item.text, {
        size: FONT.heading,
        style: "bold",
        lineHeight: FONT.headingLead,
        gapAfter: page.gaps.headingAfter
      });
      return;
    }

    if (item.type === "paragraph") {
      addParagraph(doc, page, cursor, item.text, { size: FONT.body, lineHeight: FONT.lead, gapAfter: page.gaps.paragraph });
      return;
    }

    if (item.type === "note") {
      addParagraph(doc, page, cursor, item.text, { size: FONT.note, lineHeight: FONT.noteLead, gapAfter: 8, color: COLOR.muted });
      return;
    }

    if (item.type === "bullets") {
      item.items.forEach((entry) => addListItem(doc, page, cursor, "-", entry, FONT.body));
      cursor.y += page.gaps.listEnd;
      return;
    }

    if (item.type === "numbered") {
      item.items.forEach((entry, index) => addListItem(doc, page, cursor, `${index + 1}.`, entry, FONT.body));
      cursor.y += page.gaps.listEnd;
      return;
    }

    if (item.type === "image") {
      addImageBlock(doc, page, cursor, item, images);
      return;
    }

    if (item.type === "classroomPlan") {
      addClassroomPlanBlock(doc, page, cursor, item, images, rest);
      return;
    }

    if (item.type === "trialFlow") {
      addTrialFlowBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "timeline") {
      addTimelineBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "scaledTimeline") {
      addScaledTimelineBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "coolingCurve") {
      addCoolingCurveBlock(doc, page, cursor, item, images, rest);
      return;
    }

    if (item.type === "evidenceCards") {
      addEvidenceCardsBlock(doc, page, cursor, item.cards, images, rest);
      return;
    }

    if (item.type === "suspectTable") {
      addTableBlock(doc, page, cursor, {
        headers: text(["Sospechoso", "Motivo", "Oportunidad", "Coartada"], ["Suspect", "Motive", "Opportunity", "Alibi"]),
        rows: item.rows,
        widths: [18, 30, 32, 20],
        options: { boldFirst: true }
      });
      return;
    }

    if (item.type === "table") {
      addTableBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "caseFile") {
      addCaseFileBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "meta") {
      addMetaBlock(doc, page, cursor, item.rows);
      return;
    }

    if (item.type === "spacer") {
      cursor.y += item.height;
    }
  }

  function addChapterBlock(doc, page, cursor, item) {
    const width = contentWidth(page);
    const stampSpace = item.teacher ? stampWidth(doc) + 12 : 0;
    doc.setFont("helvetica", "bold").setFontSize(FONT.chapter);
    const titleLines = doc.splitTextToSize(String(item.title), width - 24 - stampSpace);
    doc.setFont("helvetica", "normal").setFontSize(FONT.note);
    const subLines = item.subtitle ? doc.splitTextToSize(String(item.subtitle), width - 24) : [];
    const titleEnd = (titleLines.length - 1) * FONT.chapterLead;
    const lastBaseline = subLines.length ? titleEnd + 16 + (subLines.length - 1) * 12 : titleEnd;
    const boxHeight = 14 + lastBaseline + 12;
    ensureSpace(doc, page, cursor, boxHeight + 80);
    const top = cursor.y - 14;
    doc.setFillColor(...COLOR.paper);
    doc.roundedRect(page.marginX, top, width, boxHeight, 5, 5, "F");
    if (item.teacher) {
      drawStamp(doc, page.width - page.marginX - 10, cursor.y);
    }
    doc.setFont("helvetica", "bold").setFontSize(FONT.chapter).setTextColor(...COLOR.ink);
    titleLines.forEach((line, k) => doc.text(line, page.marginX + 12, cursor.y + k * FONT.chapterLead));
    if (subLines.length) {
      doc.setFont("helvetica", "normal").setFontSize(FONT.note).setTextColor(...COLOR.muted);
      subLines.forEach((line, k) => doc.text(line, page.marginX + 12, cursor.y + titleEnd + 16 + k * 12));
    }
    cursor.y = top + boxHeight + 22;
  }

  function addParagraph(doc, page, cursor, value, options) {
    doc.setFont("helvetica", "normal").setFontSize(options.size);
    const lines = doc.splitTextToSize(String(value), contentWidth(page));
    if (lines.length > 1) {
      ensureSpace(doc, page, cursor, 2 * options.lineHeight);   // no lone first line at the foot of a page
    }
    addWrappedText(doc, page, cursor, value, options);
  }

  function addWrappedText(doc, page, cursor, value, options = {}) {
    const size = options.size || FONT.body;
    const style = options.style || "normal";
    const lineHeight = options.lineHeight || size * 1.35;
    const gapAfter = options.gapAfter || 0;
    const color = options.color || COLOR.ink;
    const indent = options.indent || 0;
    const maxWidth = contentWidth(page) - indent;

    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(String(value), maxWidth);
    lines.forEach((line) => {
      ensureSpace(doc, page, cursor, lineHeight * 0.75);
      doc.setFont("helvetica", style).setFontSize(size).setTextColor(color[0], color[1], color[2]);
      doc.text(line, page.marginX + indent, cursor.y);
      cursor.y += lineHeight;
    });
    cursor.y += gapAfter;
  }

  function addListItem(doc, page, cursor, marker, value, size) {
    const markerWidth = 18;
    const lineHeight = FONT.lead;
    const maxWidth = contentWidth(page) - markerWidth;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...COLOR.ink);

    const lines = doc.splitTextToSize(String(value), maxWidth);
    ensureSpace(doc, page, cursor, Math.min(2, lines.length) * lineHeight * 0.9);
    lines.forEach((line, index) => {
      ensureSpace(doc, page, cursor, lineHeight * 0.75);
      doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...COLOR.ink);
      if (index === 0) {
        doc.text(marker, page.marginX, cursor.y);
      }
      doc.text(line, page.marginX + markerWidth, cursor.y);
      cursor.y += lineHeight;
    });
    cursor.y += page.gaps.item;
  }

  /** Caption lines of a figure, at the size of notes. */
  function captionLines(doc, caption, width) {
    if (!caption) {
      return [];
    }
    doc.setFont("helvetica", "normal").setFontSize(FONT.note);
    return doc.splitTextToSize(String(caption), width);
  }

  const captionHeight = (lines) => (lines.length ? lines.length * FONT.noteLead + 8 : 8);

  function drawCaption(doc, page, cursor, lines, centreX) {
    if (lines.length) {
      doc.setFont("helvetica", "normal").setFontSize(FONT.note).setTextColor(...COLOR.muted);
      lines.forEach((line) => {
        doc.text(line, centreX, cursor.y + FONT.note * 0.8, { align: "center" });
        cursor.y += FONT.noteLead;
      });
    }
    cursor.y += 8;
  }

  function addImageBlock(doc, page, cursor, item, images) {
    const image = images[item.key];
    if (!image) {
      addWrappedText(doc, page, cursor, `[Imagen no disponible: ${item.key}]`, {
        size: FONT.note,
        color: COLOR.accentDark,
        gapAfter: 8
      });
      return;
    }

    const maxWidth = contentWidth(page);
    const ratio = image.height / image.width;
    let width = maxWidth;
    let height = width * ratio;
    // in compact spacing a photograph may shrink to its minimum to keep the document on fewer pages
    const maxHeight = (page.compact && item.options.minHeight) || item.options.maxHeight || 300;
    if (height > maxHeight) {
      height = maxHeight;
      width = height / ratio;
    }

    const lines = captionLines(doc, item.caption, width);
    ensureSpace(doc, page, cursor, height + 6 + captionHeight(lines));
    const x = page.marginX + (maxWidth - width) / 2;
    if (!page.measuring) {
      try {
        doc.addImage(image.dataUrl || image.element, "PNG", x, cursor.y, width, height, item.key, "FAST");
      } catch (error) {
        addWrappedText(doc, page, cursor, `[No se pudo incrustar la imagen: ${item.key}]`, {
          size: FONT.note,
          color: COLOR.accentDark,
          gapAfter: 8
        });
        return;
      }
    }
    cursor.y += height + 6;
    drawCaption(doc, page, cursor, lines, x + width / 2);
  }

  /*
   * Classroom plan, drawn as vectors on the layout of the former classroom_plan.png
   * (1800 x 1000 px). Horizontal positions scale with the width; when the block is taller
   * than that proportion, the extra height opens the gaps between the rows of desks.
   */
  function addClassroomPlanBlock(doc, page, cursor, item, images, rest) {
    const width = contentWidth(page);
    const lines = captionLines(doc, item.caption, width);
    const extra = 6 + captionHeight(lines);
    const pref = width * 0.556;
    let height = pref;
    if (item.options.fill) {
      height = fitHeight(doc, page, cursor, rest, images, { pref, min: width * 0.5, max: width * 0.86, extra });
    } else {
      ensureSpace(doc, page, cursor, pref + extra);
    }
    if (!page.measuring) {
      drawClassroomPlan(doc, page.marginX, cursor.y, width, height);
    }
    cursor.y += height + 6;
    drawCaption(doc, page, cursor, lines, page.marginX + width / 2);
  }

  function drawClassroomPlan(doc, x0, y0, w, h) {
    const sx = w / 1800;
    const extra = Math.max(0, h - 1000 * sx);
    const X = (px) => x0 + px * sx;
    const Y = (py, f) => y0 + py * sx + extra * f;
    const desk = [216, 196, 163];
    const wood = [125, 105, 83];
    const red = COLOR.accent;

    doc.setFillColor(...COLOR.paper);
    doc.rect(x0, y0, w, h, "F");
    doc.setFont("helvetica", "bold").setFontSize(FONT.heading).setTextColor(...COLOR.ink);
    doc.text(text("Plano del aula", "Classroom plan"), X(90), y0 + 26);

    const roomTop = Y(152, 0);
    const roomBottom = Y(915, 1);
    doc.setFillColor(255, 255, 255).setDrawColor(36, 53, 64).setLineWidth(1.4);
    doc.roundedRect(X(173), roomTop, 1455 * sx, roomBottom - roomTop, 12 * sx, 12 * sx, "FD");

    doc.setFillColor(31, 65, 55).setDrawColor(151, 130, 88).setLineWidth(1.6);
    doc.rect(X(262), Y(212, 0), 1276 * sx, 116 * sx, "FD");
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(255, 255, 255);
    doc.text(text("PIZARRA", "BLACKBOARD"), X(900), Y(212, 0) + 58 * sx + 3.7, { align: "center" });

    const box = (px, py, pw, ph, f, fill) => {
      doc.setFillColor(...fill).setDrawColor(...wood).setLineWidth(0.8);
      doc.rect(X(px), Y(py, f), pw * sx, ph * sx, "FD");
    };
    [281, 551, 1091, 1361].forEach((px) => box(px, 396, 139, 69, 0.3, desk));
    box(821, 431, 139, 59, 0.3, desk);
    [281, 551, 821, 1091, 1361].forEach((px) => box(px, 536, 139, 69, 0.55, desk));
    [281, 551, 821, 1091, 1361].forEach((px) => box(px, 676, 139, 69, 0.8, desk));

    box(712, 367, 376, 53, 0.12, [174, 132, 101]);
    doc.setFont("helvetica", "bold").setFontSize(FONT.label).setTextColor(255, 255, 255);
    doc.text(text("Mesa del profesor", "Professor's desk"), X(900), Y(367, 0.12) + 26.5 * sx + 3.2, { align: "center" });

    const doorTop = roomBottom - 138 * sx;
    doc.setFillColor(235, 218, 184).setDrawColor(...wood).setLineWidth(0.8);
    doc.rect(X(171), doorTop, 78 * sx, 138 * sx, "FD");

    const marker = (letter, cx, cy, label) => {
      doc.setFillColor(...red);
      doc.circle(cx, cy, 28 * sx, "F");
      doc.setFont("helvetica", "bold").setFontSize(FONT.label).setTextColor(255, 255, 255);
      doc.text(letter, cx, cy + 3.2, { align: "center" });
      doc.setFont("helvetica", "normal").setFontSize(FONT.labelStrong);
      const lx = cx + 55 * sx;
      const tw = doc.getTextWidth(label);
      doc.setFillColor(255, 255, 255);
      doc.rect(lx - 2, cy - 4.6, tw + 4, 10.2, "F");   // just the height of the text: it never covers the blackboard
      doc.setTextColor(...COLOR.ink);
      doc.text(label, lx, cy + 3.3);
    };
    marker("A", X(900), Y(348, 0.12), text("Ubicación del cuerpo", "Location of the body"));
    marker("B", X(1275), Y(572, 0.55), text("Chaqueta olvidada", "Forgotten jacket"));
    marker("C", X(260), roomBottom - 95 * sx, text("Entrada/salida", "Entrance/exit"));

    doc.setFont("helvetica", "normal").setFontSize(FONT.labelStrong).setTextColor(...COLOR.ink);
    doc.text(text("Puerta", "Door"), X(171), roomBottom + 12);
    doc.setLineWidth(0.2);
  }

  /** The five stages of the hearing, drawn as vectors on the layout of the former trial_flow.png. */
  function addTrialFlowBlock(doc, page, cursor, item) {
    const width = contentWidth(page);
    const lines = captionLines(doc, item.caption, width);
    const height = 140;
    ensureSpace(doc, page, cursor, height + 6 + captionHeight(lines));
    if (!page.measuring) {
      drawTrialFlow(doc, page.marginX, cursor.y, width, height);
    }
    cursor.y += height + 6;
    drawCaption(doc, page, cursor, lines, page.marginX + width / 2);
  }

  function drawTrialFlow(doc, x0, y0, w, h) {
    const sx = w / 1800;
    const steps = text(
      ["Alegato inicial", "Prueba forense", "Testigos y sospechosos", "Alegato final", "Veredicto del jurado"],
      ["Opening statement", "Forensic evidence", "Witnesses and suspects", "Closing statement", "Jury verdict"]
    );
    const steel = [79, 124, 146];
    doc.setFillColor(247, 244, 236);
    doc.rect(x0, y0, w, h, "F");
    doc.setFont("helvetica", "bold").setFontSize(FONT.heading).setTextColor(...COLOR.ink);
    doc.text(text("Desarrollo del juicio", "Course of the trial"), x0 + 90 * sx, y0 + 26);
    const circleY = y0 + 52;
    const boxTop = circleY + 8.5;
    const boxHeight = h - (boxTop - y0) - 14;
    const boxWidth = 277 * sx;
    steps.forEach((label, k) => {
      const bx = x0 + (72 + 340 * k) * sx;
      doc.setFillColor(255, 255, 255).setDrawColor(...steel).setLineWidth(1.2);
      doc.roundedRect(bx, boxTop, boxWidth, boxHeight, 6, 6, "FD");
      if (k < steps.length - 1) {
        const ay = boxTop + boxHeight / 2;
        const ax0 = bx + boxWidth + 2;
        const ax1 = x0 + (72 + 340 * (k + 1)) * sx - 2;
        doc.setDrawColor(38, 55, 68).setFillColor(38, 55, 68).setLineWidth(1.4);
        doc.line(ax0, ay, ax1 - 5, ay);
        doc.triangle(ax1 - 6, ay - 4, ax1, ay, ax1 - 6, ay + 4, "F");
      }
      const cx = bx + boxWidth / 2;
      doc.setFillColor(...steel).setDrawColor(255, 255, 255).setLineWidth(1.5);
      doc.circle(cx, circleY, 10.5, "FD");
      doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(255, 255, 255);
      doc.text(String(k + 1), cx, circleY + 3.8, { align: "center" });
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...COLOR.ink);
      const labelLines = doc.splitTextToSize(label, boxWidth - 10);
      const firstBaseline = boxTop + 10 + (boxHeight - 10 - labelLines.length * 12.5) / 2 + 9;
      labelLines.forEach((line, i) => doc.text(line, cx, firstBaseline + i * 12.5, { align: "center" }));
    });
    doc.setLineWidth(0.2);
  }

  function addCaseFileBlock(doc, page, cursor, item) {
    const width = contentWidth(page);
    const valueSize = 10;
    const valueLead = 13;

    doc.setFont("helvetica", "bold").setFontSize(FONT.meta);
    const labelWidth = Math.max(...item.meta.map(([label]) => doc.getTextWidth(String(label).toUpperCase()))) + 10;
    const colWidth = (width - 24) / 2;
    const valueWidth = colWidth - labelWidth - 10;
    doc.setFont("helvetica", "normal").setFontSize(valueSize);
    const metaRows = [];
    for (let i = 0; i < item.meta.length; i += 2) {
      const pair = item.meta.slice(i, i + 2).map(([label, value]) => ({ label, lines: doc.splitTextToSize(String(value), valueWidth) }));
      metaRows.push({ pair, height: Math.max(...pair.map((cell) => cell.lines.length)) * valueLead + 7 });
    }
    const metaHeight = metaRows.reduce((sum, row) => sum + row.height, 0);
    const boxHeight = 26 + 16 + metaHeight;
    ensureSpace(doc, page, cursor, boxHeight + 12);

    doc.setFillColor(...COLOR.paper);
    doc.setDrawColor(...COLOR.ink);
    doc.setLineWidth(0.6);
    doc.roundedRect(page.marginX, cursor.y, width, boxHeight, 4, 4, "FD");
    doc.setFillColor(...COLOR.ink);
    doc.rect(page.marginX, cursor.y, width, 26, "F");
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
    doc.text(text("EXPEDIENTE FORENSE", "FORENSIC CASE FILE"), page.marginX + 12, cursor.y + 17.5);

    let y = cursor.y + 26 + 16;
    metaRows.forEach((row) => {
      row.pair.forEach((cell, k) => {
        const x = page.marginX + 12 + k * colWidth;
        doc.setFont("helvetica", "bold").setFontSize(FONT.meta).setTextColor(...COLOR.muted);
        doc.text(String(cell.label).toUpperCase(), x, y);
        doc.setFont("helvetica", "normal").setFontSize(valueSize).setTextColor(...COLOR.ink);
        cell.lines.forEach((line, j) => doc.text(line, x + labelWidth, y + j * valueLead));
      });
      y += row.height;
    });
    cursor.y += boxHeight + 12;

    item.sections.forEach((section) => {
      doc.setFont("helvetica", "normal").setFontSize(FONT.box);
      const bodyLines = section.body ? doc.splitTextToSize(String(section.body), width - 28) : [];
      const bullets = (section.bullets || []).map((bullet) => doc.splitTextToSize(String(bullet), width - 40));
      const textLines = bodyLines.length + bullets.reduce((sum, ls) => sum + ls.length, 0);
      const sectionGap = page.compact ? 6 : 10;
      const head = page.compact ? 33 : 38;
      const lead = page.compact ? 13.5 : FONT.boxLead;
      const sectionHeight = head + textLines * lead + bullets.length * 2 + (page.compact ? 3 : 6);
      ensureSpace(doc, page, cursor, sectionHeight + sectionGap);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...COLOR.line);
      doc.roundedRect(page.marginX, cursor.y, width, sectionHeight, 4, 4, "FD");
      doc.setFont("helvetica", "bold").setFontSize(FONT.sub).setTextColor(...COLOR.ink);
      doc.text(String(section.title), page.marginX + 12, cursor.y + head / 2);
      let yy = cursor.y + head;
      doc.setFont("helvetica", "normal").setFontSize(FONT.box).setTextColor(...COLOR.ink);
      bodyLines.forEach((line) => {
        doc.text(line, page.marginX + 14, yy);
        yy += lead;
      });
      bullets.forEach((ls) => {
        doc.text("-", page.marginX + 16, yy);
        ls.forEach((line) => {
          doc.text(line, page.marginX + 26, yy);
          yy += lead;
        });
        yy += 2;
      });
      cursor.y += sectionHeight + sectionGap;
    });
  }

  /** Label and value rows (meta data of a document), labels in small capitals. */
  function addMetaBlock(doc, page, cursor, rows) {
    const width = contentWidth(page);
    doc.setFont("helvetica", "bold").setFontSize(FONT.meta);
    const labelWidth = Math.max(...rows.map(([label]) => doc.getTextWidth(String(label).toUpperCase()))) + 14;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal").setFontSize(10);
      const lines = doc.splitTextToSize(String(value), width - labelWidth);
      ensureSpace(doc, page, cursor, lines.length * 13);
      doc.setFont("helvetica", "bold").setFontSize(FONT.meta).setTextColor(...COLOR.muted);
      doc.text(String(label).toUpperCase(), page.marginX, cursor.y);
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...COLOR.ink);
      lines.forEach((line, k) => doc.text(line, page.marginX + labelWidth, cursor.y + k * 13));
      cursor.y += lines.length * 13 + 4;
    });
    cursor.y += 10;
  }

  /**
   * Table in the generator's style (slate header, zebra rows), 9.5 pt. Rows grow with their
   * text; a header word is never split (its column widens at the expense of the widest);
   * a short table is not split; a long one repeats its header on each page.
   */
  function addTableBlock(doc, page, cursor, item) {
    const { headers, rows, widths } = item;
    const options = item.options || {};
    const size = options.size || FONT.table;
    const lead = size * 1.28;
    const padX = 5;
    const padY = options.padY || 6;
    const tableWidth = contentWidth(page);
    const total = widths.reduce((sum, w) => sum + w, 0);
    const ws = widths.map((w) => (w * tableWidth) / total);

    doc.setFont("helvetica", "bold").setFontSize(size);
    headers.forEach((header, i) => {
      const need = Math.max(...String(header).split(/\s+/).map((word) => doc.getTextWidth(word))) + 2 * padX + 0.5;
      if (ws[i] < need) {
        const j = ws.indexOf(Math.max(...ws));
        if (j !== i) {
          ws[j] -= need - ws[i];
          ws[i] = need;
        }
      }
    });

    const cellLines = (row, header) => row.map((cell, i) => {
      doc.setFont("helvetica", header || (options.boldFirst && i === 0) ? "bold" : "normal").setFontSize(size);
      return doc.splitTextToSize(String(cell), ws[i] - 2 * padX);
    });
    const heightOf = (ls) => 2 * padY + size + (Math.max(...ls.map((l) => l.length)) - 1) * lead;
    const headerLines = cellLines(headers, true);
    const headerHeight = heightOf(headerLines);
    const bodyLines = rows.map((row) => cellLines(row, false));
    const totalHeight = headerHeight + bodyLines.reduce((sum, ls) => sum + heightOf(ls), 0);

    const drawRow = (ls, header, shade) => {
      const height = heightOf(ls);
      let x = page.marginX;
      doc.setFillColor(...(header ? COLOR.ink : shade ? COLOR.zebra : [255, 255, 255]));
      doc.rect(page.marginX, cursor.y, tableWidth, height, "F");
      ls.forEach((lines, i) => {
        doc.setFont("helvetica", header || (options.boldFirst && i === 0) ? "bold" : "normal").setFontSize(size);
        doc.setTextColor(...(header ? [255, 255, 255] : COLOR.ink));
        lines.forEach((line, j) => doc.text(line, x + padX, cursor.y + padY + size * 0.8 + j * lead));
        x += ws[i];
      });
      cursor.y += height;
    };

    const firstRow = headerHeight + heightOf(bodyLines[0] || headerLines);
    // options.split: a table that may break rather than leave a gap (the minutes of the trial)
    if (!options.split && tableMovesWhole(page, cursor, totalHeight)) {
      ensureSpace(doc, page, cursor, totalHeight + 4);
    } else {
      ensureSpace(doc, page, cursor, firstRow);
    }
    drawRow(headerLines, true, false);
    bodyLines.forEach((ls, k) => {
      if (cursor.y + heightOf(ls) > page.height - page.marginBottom) {
        newPage(doc, page, cursor);
        drawRow(headerLines, true, false);
      }
      drawRow(ls, false, k % 2 === 1);
    });
    cursor.y += 16;
  }

  /**
   * A short table (up to half a page) is not split: it moves whole to the next page, unless
   * that would leave more than a quarter of this page empty; then it is split and its header repeated.
   */
  function tableMovesWhole(page, cursor, totalHeight) {
    const usable = page.height - page.marginTop - page.marginBottom;
    return totalHeight <= usable * 0.5 && (cursor.y + totalHeight + 4 <= page.height - page.marginBottom || room(page, cursor) < usable * 0.25);
  }

  function addTimelineBlock(doc, page, cursor, item) {
    ensureSpace(doc, page, cursor, 150);
    addWrappedText(doc, page, cursor, item.title, {
      size: FONT.sub,
      style: "bold",
      lineHeight: FONT.subLead,
      gapAfter: 5
    });

    const left = page.marginX + 18;
    const right = page.width - page.marginX - 18;
    const y = cursor.y + 34;
    const events = item.events;
    const span = Math.max(events.length - 1, 1);

    doc.setDrawColor(...COLOR.blue);
    doc.setLineWidth(2);
    doc.line(left, y, right, y);

    events.forEach((event, index) => {
      const x = left + ((right - left) * index) / span;
      doc.setFillColor(event.color[0], event.color[1], event.color[2]);
      doc.circle(x, y, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONT.labelStrong);
      doc.setTextColor(...COLOR.ink);
      doc.text(event.time, x, y - 16, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.label);
      const lines = doc.splitTextToSize(event.label, 72);
      lines.slice(0, 3).forEach((line, lineIndex) => {
        doc.text(line, x, y + 21 + lineIndex * 11, { align: "center" });
      });
    });

    cursor.y += 130;
    doc.setLineWidth(0.2);
  }

  function addScaledTimelineBlock(doc, page, cursor, item) {
    const lanes = item.lanes;
    const segmentLead = 10.5;

    doc.setFont("helvetica", "bold").setFontSize(FONT.labelStrong);
    const labelColumn = Math.min(120, Math.max(72, ...lanes.map((lane) => doc.getTextWidth(lane.label) + 12)));
    const axisLeft = page.marginX + labelColumn;
    const axisRight = page.width - page.marginX - 14;
    const axisWidth = axisRight - axisLeft;
    const times = lanes.flatMap((lane) => [
      ...lane.segments.map((segment) => segment.start.getTime()),
      ...lane.segments.map((segment) => segment.end.getTime()),
      ...lane.events.map((event) => event.time.getTime())
    ]);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const span = Math.max(maxTime - minTime, 1);
    const xFor = (date) => axisLeft + ((date.getTime() - minTime) / span) * axisWidth;

    // first pass: label tiers of every lane, so that close events and short segments never overlap
    const layouts = lanes.map((lane) => {
      doc.setFont("helvetica", "normal").setFontSize(FONT.label);
      const segments = lane.segments.map((segment) => {
        const startX = xFor(segment.start);
        const endX = xFor(segment.end);
        const lines = doc.splitTextToSize(segment.label, Math.max(46, Math.abs(endX - startX) + 18)).slice(0, 2);
        const labelWidth = Math.max(...lines.map((line) => doc.getTextWidth(line)), 0) + 6;
        return { segment, startX, endX, labelX: (startX + endX) / 2, lines, labelWidth };
      });
      const segmentTiers = [];
      segments.slice().sort((a, b) => a.labelX - b.labelX).forEach((entry) => {
        let tier = segmentTiers.findIndex((rightEdge) => entry.labelX - entry.labelWidth / 2 > rightEdge);
        if (tier === -1) tier = segmentTiers.length;
        segmentTiers[tier] = entry.labelX + entry.labelWidth / 2;
        entry.tier = tier;
      });
      doc.setFont("helvetica", "bold").setFontSize(FONT.label);
      const events = lane.events.map((event) => ({ event, x: xFor(event.time), labelWidth: doc.getTextWidth(event.label) + 6 }));
      const eventTiers = [];
      events.slice().sort((a, b) => a.x - b.x).forEach((entry) => {
        let tier = eventTiers.findIndex((rightEdge) => entry.x - entry.labelWidth / 2 > rightEdge);
        if (tier === -1) tier = eventTiers.length;
        eventTiers[tier] = entry.x + entry.labelWidth / 2;
        entry.tier = tier;
      });
      const segmentRows = segmentTiers.length;
      const lastTierLines = Math.max(1, ...segments.filter((s) => s.tier === segmentRows - 1).map((s) => s.lines.length));
      return {
        segments,
        events,
        above: events.length ? 10 + eventTiers.length * 12 : 8,
        below: segmentRows ? 14 + (segmentRows - 1) * (2 * segmentLead + 3) + (lastTierLines - 1) * segmentLead + 4 : 8
      };
    });

    const titleHeight = FONT.subLead + 6;
    const tickRow = titleHeight + 6;
    const laneY = [];
    let y = tickRow + 6;
    layouts.forEach((layout, k) => {
      y += layout.above;
      laneY.push(y);
      y += layout.below + (k < layouts.length - 1 ? 6 : 0);
    });
    const height = y + 14;
    ensureSpace(doc, page, cursor, height);

    const top = cursor.y;
    addWrappedText(doc, page, cursor, item.title, {
      size: FONT.sub,
      style: "bold",
      lineHeight: FONT.subLead,
      gapAfter: 6
    });
    if (page.measuring) {
      cursor.y = top + height;
      return;
    }

    const tickCount = 5;
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.6);
    for (let i = 0; i <= tickCount; i += 1) {
      const ratio = i / tickCount;
      const x = axisLeft + axisWidth * ratio;
      doc.line(x, top + tickRow + 5, x, top + y);
      doc.setFont("helvetica", "normal").setFontSize(FONT.label).setTextColor(...COLOR.muted);
      doc.text(formatTime(new Date(minTime + span * ratio)), x, top + tickRow, { align: "center" });
    }

    lanes.forEach((lane, laneIndex) => {
      const ly = top + laneY[laneIndex];
      const layout = layouts[laneIndex];
      doc.setFont("helvetica", "bold").setFontSize(FONT.labelStrong).setTextColor(...COLOR.ink);
      doc.splitTextToSize(lane.label, labelColumn - 8).slice(0, 2).forEach((line, k) => doc.text(line, page.marginX, ly + 3.5 + k * 11));
      doc.setDrawColor(...COLOR.grid);
      doc.setLineWidth(0.7);
      doc.line(axisLeft, ly, axisRight, ly);

      layout.segments.forEach(({ segment, startX, endX }) => {
        doc.setDrawColor(segment.color[0], segment.color[1], segment.color[2]);
        doc.setLineWidth(7);
        doc.line(startX, ly, endX, ly);
      });
      doc.setFont("helvetica", "normal").setFontSize(FONT.label).setTextColor(...COLOR.ink);
      layout.segments.forEach(({ labelX, lines, tier }) => {
        lines.forEach((line, lineIndex) => {
          doc.text(line, labelX, ly + 14 + tier * (2 * segmentLead + 3) + lineIndex * segmentLead, { align: "center" });
        });
      });
      layout.events.forEach(({ event, x, tier }) => {
        doc.setFillColor(event.color[0], event.color[1], event.color[2]);
        doc.circle(x, ly, 4.2, "F");
        doc.setFont("helvetica", "bold").setFontSize(FONT.label).setTextColor(...COLOR.ink);
        doc.text(event.label, x, ly - 9 - tier * 12, { align: "center" });
      });
    });

    doc.setLineWidth(0.2);
    cursor.y = top + height;
  }

  function addCoolingCurveBlock(doc, page, cursor, item, images, rest) {
    const extra = 15 + 40;
    const graphHeight = fitHeight(doc, page, cursor, rest, images, { pref: 200, min: 150, max: 270, extra });
    if (page.measuring) {
      cursor.y += graphHeight + extra;
      return;
    }
    const { timeline, temps } = item;
    const graph = {
      x: page.marginX + 28,
      y: cursor.y + 15,
      width: contentWidth(page) - 56,
      height: graphHeight
    };
    const minT = 22;
    const maxT = 38.5;   // headroom above 37 so the label of the first point stays inside the frame
    const minX = -Math.max(temps.estimatedHoursBeforeFirst, 0.5);
    const maxX = 1;
    const xFor = (t) => graph.x + ((t - minX) / (maxX - minX)) * graph.width;
    const yFor = (temp) => graph.y + ((maxT - temp) / (maxT - minT)) * graph.height;
    const tempAt = (t) => temps.ambient + (temps.firstMeasurement - temps.ambient) * Math.exp(-temps.k * t);

    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.7);
    [22, 27, 32, 37].forEach((temp) => {
      const y = yFor(temp);
      doc.line(graph.x, y, graph.x + graph.width, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.label);
      doc.setTextColor(...COLOR.muted);
      doc.text(String(temp), graph.x - 8, y + 3.2, { align: "right" });
    });

    doc.setDrawColor(...COLOR.ink);
    doc.setLineWidth(1.1);
    doc.rect(graph.x, graph.y, graph.width, graph.height);

    doc.setDrawColor(...COLOR.accent);
    doc.setLineWidth(1.8);
    let previous = null;
    for (let i = 0; i <= 80; i += 1) {
      const t = minX + ((maxX - minX) * i) / 80;
      const point = [xFor(t), yFor(tempAt(t))];
      if (previous) {
        doc.line(previous[0], previous[1], point[0], point[1]);
      }
      previous = point;
    }

    const points = [
      { t: -temps.estimatedHoursBeforeFirst, temp: temps.bodyAtDeath, label: `${formatNumber(temps.bodyAtDeath)} C\n${formatEventTime(timeline.death, timeline.classEnd)}` },
      { t: 0, temp: temps.firstMeasurement, label: `${formatNumber(temps.firstMeasurement)} C\n${formatEventTime(timeline.firstMeasurement, timeline.classEnd)}` },
      { t: 1, temp: temps.secondMeasurement, label: `${formatNumber(temps.secondMeasurement)} C\n${formatEventTime(timeline.secondMeasurement, timeline.classEnd)}`, left: true }
    ];

    points.forEach((point) => {
      const x = xFor(point.t);
      const y = yFor(point.temp);
      doc.setFillColor(...COLOR.ink);
      doc.circle(x, y, 4.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.labelStrong);
      doc.setTextColor(...COLOR.ink);
      // the curve falls to the right: a label on one line above it never touches it; the last
      // reading sits on the right edge, so its label goes to the left, under the curve
      if (point.left) {
        point.label.split("\n").forEach((line, index) => doc.text(line, x - 9, y + 13 + index * 11.5, { align: "right" }));
      } else {
        doc.text(point.label.replace("\n", " · "), x + 9, y - 7);
      }
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.labelStrong);
    doc.setTextColor(...COLOR.ink);
    doc.text(text("Temperatura (C)", "Temperature (C)"), graph.x, graph.y + graph.height + 22);
    doc.text(text("Tiempo respecto a la primera medición", "Time relative to first measurement"), graph.x + graph.width, graph.y + graph.height + 22, {
      align: "right"
    });
    doc.setLineWidth(0.2);
    cursor.y += graphHeight + extra;
  }

  function addEvidenceCardsBlock(doc, page, cursor, cards, images, rest) {
    const gap = 16;
    const rowGap = 12;
    const head = 22;
    const bodySize = 12;
    const bodyLead = 15;
    const cardWidth = (contentWidth(page) - gap) / 2;
    const rows = Math.ceil(cards.length / 2);

    doc.setFont("helvetica", "normal").setFontSize(bodySize);
    const bodyLines = cards.map((card) => doc.splitTextToSize(String(card[1]), cardWidth - 20));
    const maxLines = Math.max(1, ...bodyLines.map((lines) => lines.length));
    const minCard = head + 14 + maxLines * bodyLead + 10;
    const prefCard = Math.max(minCard, 80);
    // the board is the whole document: its cards share the page with the notes below them
    const total = fitHeight(doc, page, cursor, rest, images, {
      pref: rows * (prefCard + rowGap),
      min: rows * (minCard + rowGap),
      max: rows * (140 + rowGap),
      extra: 4
    });
    const cardHeight = total / rows - rowGap;
    if (page.measuring) {
      cursor.y += total + 4;
      return;
    }

    cards.forEach((card, index) => {
      const col = index % 2;
      const x = page.marginX + col * (cardWidth + gap);
      const y = cursor.y;
      doc.setDrawColor(...COLOR.grid);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, "FD");
      doc.setFillColor(...COLOR.ink);
      doc.rect(x, y, cardWidth, head, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(String(card[0]), x + 10, y + 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      doc.setTextColor(...COLOR.ink);
      const lines = bodyLines[index];
      const firstBaseline = y + head + (cardHeight - head - lines.length * bodyLead) / 2 + bodySize * 0.8;
      lines.forEach((line, lineIndex) => {
        doc.text(line, x + 10, firstBaseline + lineIndex * bodyLead);
      });
      if (col === 1 || index === cards.length - 1) {
        cursor.y += cardHeight + rowGap;
      }
    });
    cursor.y += 4;
    doc.setLineWidth(0.2);
  }

  function addFooters(doc, page, label) {
    const count = doc.getNumberOfPages();
    const slidePages = doc.slidePages || new Set();
    for (let current = 1; current <= count; current += 1) {
      doc.setPage(current);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90, 101, 112);
      const footer = text(
        `Misterio de asesinato - ${label} - ${current}/${count}`,
        `Murder mystery - ${label} - ${current}/${count}`
      );
      if (slidePages.has(current)) {
        doc.text(footer, SLIDE.margin, SLIDE.height - 16);
        doc.text(SOURCE_CREDIT, SLIDE.width - SLIDE.margin, SLIDE.height - 16, { align: "right" });
        continue;
      }
      doc.text(footer, page.marginX, page.height - 30);
      doc.text(SOURCE_CREDIT, page.width - page.marginX, page.height - 18, { align: "right" });
    }
  }

  /*
   * The presentation: 16:9 pages of 720 x 405 pt (254 x 142.9 mm, the size of the kit's slides),
   * in the generator's own look. A slide is {kicker, title, quote?, text?: [..], bullets?: [..],
   * table?: {head, rows, widths}, note?, image?: key}; its content shrinks (down to 70 %) when it
   * does not fit, so that no slide overflows whatever names the configuration uses.
   */
  const SLIDE = { width: 720, height: 405, margin: 40, bottom: 34 };

  function buildSlidesFile(spec, images) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: [SLIDE.width, SLIDE.height], orientation: "landscape" });
    drawSlides(doc, spec.slides, images, false);
    addFooters(doc, null, spec.downloadLabel);
    return {
      id: spec.id,
      fileName: spec.fileName,
      label: spec.downloadLabel,
      teacher: false,
      pages: doc.getNumberOfPages(),
      blob: doc.output("blob")
    };
  }

  function drawSlides(doc, slides, images, appended) {
    doc.slidePages = doc.slidePages || new Set();
    slides.forEach((slide, k) => {
      if (appended || k > 0) {
        doc.addPage([SLIDE.width, SLIDE.height], "landscape");
      }
      doc.slidePages.add(doc.getNumberOfPages());
      // a short slide grows up to 115 %, a long one shrinks down to 70 %
      let scale = 1.15;
      while (scale > 0.7 && layoutSlide(doc, slide, images, scale, false) > SLIDE.height - SLIDE.bottom) {
        scale -= 0.04;
      }
      layoutSlide(doc, slide, images, scale, true);
    });
  }

  /** Lays out one slide at `scale`; draws it when `draw`. Returns the bottom of its content. */
  function layoutSlide(doc, slide, images, scale, draw) {
    const W = SLIDE.width, m = SLIDE.margin;
    let y = 34;
    if (draw) {
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...COLOR.muted);
      doc.text(String(slide.kicker || "").toUpperCase(), m, y);
    }
    y += 34;
    const titleSize = 26 * Math.min(1, Math.max(scale, 0.85));
    doc.setFont("helvetica", "bold").setFontSize(titleSize);
    const titleLines = doc.splitTextToSize(String(slide.title || ""), W - 2 * m - 18);
    if (draw) {
      doc.setFillColor(...COLOR.ink);
      doc.rect(m, y - titleSize * 0.85, 6, titleSize * 1.05 + (titleLines.length - 1) * titleSize * 1.15, "F");
      doc.setTextColor(...COLOR.ink);
      titleLines.forEach((line, k) => doc.text(line, m + 18, y + k * titleSize * 1.15));
    }
    y += (titleLines.length - 1) * titleSize * 1.15 + 14;
    if (draw) {
      doc.setDrawColor(...COLOR.line).setLineWidth(0.6);
      doc.line(m, y, W - m, y);
    }
    y += 26 * scale;

    // an image on the right half of the slide; the text runs on the left
    let textWidth = W - 2 * m;
    const image = slide.image && images ? images[slide.image] : null;
    let imageBottom = y;
    if (image) {
      const iw = (W - 2 * m) * 0.44;
      const ih = Math.min(iw * (image.height / image.width), SLIDE.height - SLIDE.bottom - (y - 12));
      const width = ih / (image.height / image.width);
      if (draw) {
        try {
          doc.addImage(image.dataUrl || image.element, "PNG", W - m - width, y - 12, width, ih, slide.image, "FAST");
        } catch (error) { /* the slide still reads without its picture */ }
      }
      textWidth = W - 2 * m - iw - 18;
      imageBottom = y - 12 + ih;
    }

    const body = 16 * scale, lead = body * 1.32;
    const paragraph = (value, options = {}) => {
      const size = options.size || body;
      const lineLead = options.lead || size * 1.32;
      doc.setFont("helvetica", options.style || "normal").setFontSize(size);
      const lines = doc.splitTextToSize(String(value), (options.width || textWidth) - (options.indent || 0));
      if (draw) {
        doc.setTextColor(...(options.color || COLOR.ink));
        lines.forEach((line, k) => doc.text(line, m + (options.indent || 0), y + k * lineLead));
      }
      y += lines.length * lineLead;
    };

    if (slide.quote) {
      y += 6 * scale;
      paragraph(slide.quote, { size: 22 * scale, style: "bold", color: COLOR.accentDark });
      y += 8 * scale;
    }
    (slide.text || []).forEach((value) => {
      paragraph(value);
      y += 9 * scale;
    });
    (slide.bullets || []).forEach((value) => {
      if (draw) {
        doc.setFillColor(...COLOR.accent);
        doc.rect(m + 1, y - body * 0.62, body * 0.42, body * 0.42, "F");
      }
      paragraph(value, { indent: 20 });
      y += 6 * scale;
    });
    if (slide.table) {
      y = Math.max(y, 0) + 2;
      const size = 13.5 * scale, tlead = size * 1.25, padX = 7, padY = 6 * scale;
      const tw = textWidth, total = slide.table.widths.reduce((a, b) => a + b, 0);
      const ws = slide.table.widths.map((w) => (w * tw) / total);
      const cells = (row, head) => row.map((cell, i) => {
        doc.setFont("helvetica", head || i === 0 ? "bold" : "normal").setFontSize(size);
        return doc.splitTextToSize(String(cell), ws[i] - 2 * padX);
      });
      [slide.table.head, ...slide.table.rows].forEach((row, r) => {
        const head = r === 0, ls = cells(row, head);
        const h = 2 * padY + size * 0.8 + (Math.max(...ls.map((l) => l.length)) - 1) * tlead + size * 0.25;
        if (draw) {
          doc.setFillColor(...(head ? COLOR.ink : r % 2 === 0 ? COLOR.zebra : [255, 255, 255]));
          doc.rect(m, y, tw, h, "F");
          let x = m;
          ls.forEach((lines, i) => {
            doc.setFont("helvetica", head || i === 0 ? "bold" : "normal").setFontSize(size);
            doc.setTextColor(...(head ? [255, 255, 255] : COLOR.ink));
            lines.forEach((line, j) => doc.text(line, x + padX, y + padY + size * 0.8 + j * tlead));
            x += ws[i];
          });
        }
        y += h;
      });
      y += 12 * scale;
    }
    if (slide.note) {
      y += 2;
      paragraph(slide.note, { size: 12.5 * scale, style: "italic", color: COLOR.muted, width: textWidth });
    }
    return Math.max(y - lead * 0.7, imageBottom);
  }

  async function loadImages(sources) {
    const entries = await Promise.all(
      Object.entries(sources).map(([key, src]) =>
        loadImage(src)
          .then((image) => [key, image])
          .catch(() => [key, null])
      )
    );
    return Object.fromEntries(entries);
  }

  async function loadImage(src) {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(text(`No se pudo cargar ${src}`, `Could not load ${src}`));
      }
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      const dimensions = await getImageDimensions(dataUrl);
      return {
        dataUrl,
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (error) {
      return loadImageElement(src);
    }
  }

  function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const fallback = {
          element: image,
          width: image.naturalWidth,
          height: image.naturalHeight
        };
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            width: image.naturalWidth,
            height: image.naturalHeight
          });
        } catch (error) {
          resolve(fallback);
        }
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function getImageDimensions(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight
        });
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  async function buildZip(files) {
    const zip = new window.JSZip();
    files.forEach((file) => {
      zip.file(file.fileName, file.blob);
    });
    return zip.generateAsync({ type: "blob" });
  }

  function showDownloads(individualFiles, bundleFiles, separateZip, bundleZip, completeFile, guideFile) {
    els.separateDownloads.innerHTML = "";
    els.bundleDownloads.innerHTML = "";
    els.downloadsPanel.classList.remove("cc-hidden");
    activateTab("panel-bundles");

    updateTabLink(els.printGuideLink, guideFile, text("Descargar la guía de impresión y reparto", "Download the printing and distribution guide"));
    updateTabLink(els.completePdfLink, completeFile, text("Descargar PDF completo", "Download complete PDF"));
    appendDownloadGroup(els.separateDownloads, separateZip, individualFiles);
    appendDownloadGroup(els.bundleDownloads, bundleZip, bundleFiles);
  }

  /** The links in the tab bar: the printing guide and the complete PDF. */
  function updateTabLink(link, file, ariaLabel) {
    if (!link || !file) {
      return;
    }
    const url = rememberUrl(URL.createObjectURL(file.blob));
    link.href = url;
    link.download = file.fileName;
    link.classList.remove("cc-hidden");
    link.setAttribute("aria-label", ariaLabel);
  }

  function appendDownloadGroup(container, zipFile, files) {
    const zipUrl = rememberUrl(URL.createObjectURL(zipFile.blob));
    container.appendChild(makeDownloadLink(zipUrl, zipFile.fileName, zipFile.label, text("Todos en un ZIP", "All files in one ZIP"), true));

    files.forEach((file) => {
      const url = rememberUrl(URL.createObjectURL(file.blob));
      const title = file.teacher ? `${file.label} · ${text("Profesorado", "Teacher only")}` : file.label;
      if (file.id === "presentation" && container === els.bundleDownloads) return;
      container.appendChild(makeDownloadLink(url, file.fileName, title, file.fileName, false));
    });
  }

  function makeDownloadLink(url, fileName, title, detail, primary) {
    const row = document.createElement("div");
    row.className = primary ? "cc-file-row cc-primary" : "cc-file-row";

    const label = document.createElement("span");
    label.className = "cc-file-title";
    label.textContent = title;
    if (detail && detail !== title) {
      const small = document.createElement("small");
      small.textContent = detail;
      label.appendChild(small);
    }

    const actions = document.createElement("span");
    actions.className = "cc-file-actions";

    const viewLink = document.createElement("a");
    viewLink.href = url;
    viewLink.target = "_blank";
    viewLink.rel = "noopener";
    viewLink.className = "cc-file-icon";
    viewLink.title = text(`Ver ${title} en el navegador`, `View ${title} in the browser`);
    viewLink.setAttribute("aria-label", text(`Ver ${title} en el navegador`, `View ${title} in the browser`));
    viewLink.innerHTML = iconEye();

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.className = "cc-file-icon";
    downloadLink.title = text(`Descargar ${title}`, `Download ${title}`);
    downloadLink.setAttribute("aria-label", text(`Descargar ${title}`, `Download ${title}`));
    downloadLink.innerHTML = iconDownload();

    actions.appendChild(viewLink);
    actions.appendChild(downloadLink);
    row.appendChild(label);
    row.appendChild(actions);
    return row;
  }

  function iconEye() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
  }

  function iconDownload() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke-width="2" stroke-linecap="round"/><path d="m7 10 5 5 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function clearDownloads() {
    state.urls.forEach((url) => URL.revokeObjectURL(url));
    state.urls = [];
    if (els.separateDownloads) {
      els.separateDownloads.innerHTML = "";
    }
    if (els.bundleDownloads) {
      els.bundleDownloads.innerHTML = "";
    }
    if (els.downloadsPanel) {
      els.downloadsPanel.classList.add("cc-hidden");
    }
    [els.printGuideLink, els.completePdfLink].filter(Boolean).forEach((link) => {
      link.classList.add("cc-hidden");
      link.removeAttribute("href");
      link.removeAttribute("download");
    });
  }

  function rememberUrl(url) {
    state.urls.push(url);
    return url;
  }

  function activateTab(targetId) {
    els.tabButtons.forEach((button) => {
      const active = button.dataset.ccTabTarget === targetId;
      button.setAttribute("aria-selected", String(active));
    });
    els.tabPanels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });
  }

  function updateSummary(existingData) {
    let data;
    try {
      data = existingData || readCaseData();
    } catch (error) {
      els.summary.innerHTML = "";
      const item = document.createElement("li");
      item.innerHTML = text(
        "<span>Resumen</span><strong>Completa los datos del caso</strong>",
        "<span>Summary</span><strong>Complete the case details</strong>"
      );
      els.summary.appendChild(item);
      return;
    }

    const { timeline, classroom } = data;
    showGroups(classroom);
    const rows = [
      [text("Estudiantes", "Students"), String(classroom.students)],
      [text("Tribunales", "Courts"), classroom.courts.length === 1 ? text("1", "1") : `${classroom.courts.length} (${classroom.courts.map((c) => c.size).join(", ")})`],
      [text("Formato", "Format"), text("lanzamiento + preparación + juicio de 60 min", "launch + preparation + 60-min trial")],
      [text("Profesor", "Professor"), data.teacherFullName],
      [text("Clase", "Course"), data.className],
      [text("Papel", "Paper"), data.pageFormat === "letter" ? text("Carta", "Letter") : "A4"],
      [text("Informe matemático", "Mathematical report"), data.mathMode === "ode" ? text("Ecuaciones diferenciales", "Differential equations") : text("Cálculo", "Calculus")],
      [text("Fecha", "Date"), formatCaseDateValue(data, timeline.classEnd)],
      [text("Clase de", "Class from"), `${formatTime(timeline.classStart)} ${text("a", "to")} ${formatTime(timeline.classEnd)}`],
      [text("Descubrimiento", "Discovery"), formatEventTime(timeline.discovery, timeline.classEnd)],
      [text("1a medición", "1st measurement"), `${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} (${formatNumber(data.temps.firstMeasurement)} C)`],
      [text("2a medición", "2nd measurement"), `${formatEventTime(timeline.secondMeasurement, timeline.classEnd)} (${formatNumber(data.temps.secondMeasurement)} C)`],
      [text("Sospechosos", "Suspects"), data.suspects.map((suspect) => suspect.label).join(", ")],
      [text("Muerte (solución · no proyectar)", "Death (solution · do not project)"), formatEventTime(timeline.death, timeline.classEnd)]
    ];

    els.summary.innerHTML = "";
    rows.forEach(([label, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
      els.summary.appendChild(item);
    });
  }

  /** Step 1 of the configurator: the roles that the number of students gives. */
  function showGroups(classroom) {
    if (!els.groups) {
      return;
    }
    const several = classroom.courts.length > 1;
    const names = [
      [text("Juez", "Judge"), "judge"], [text("Fiscalía", "Prosecution"), "prosecution"], [text("Médico forense", "Forensic doctor"), "forensic"],
      [text("Conserje", "Custodian"), "janitor"], [text("Sospechoso 1", "Suspect 1"), "suspect1"], [text("Sospechoso 2", "Suspect 2"), "suspect2"],
      [text("Sospechoso 3", "Suspect 3"), "suspect3"], [text("Jurado popular", "Jury"), "jury"]
    ];
    const head = several
      ? `<tr><th>${escapeHtml(text("Papel", "Role"))}</th><th>${escapeHtml(text("Por tribunal", "Per court"))}</th><th>${escapeHtml(text("Total", "Total"))}</th></tr>`
      : `<tr><th>${escapeHtml(text("Papel", "Role"))}</th><th>${escapeHtml(text("Estudiantes", "Students"))}</th></tr>`;
    const body = names.map(([name, key]) => several
      ? `<tr><td>${escapeHtml(name)}</td><td>${perCourt(classroom, key)}</td><td>${classroom.totals[key]}</td></tr>`
      : `<tr><td>${escapeHtml(name)}</td><td>${classroom.totals[key]}</td></tr>`).join("");
    const clamped = Number.isFinite(classroom.requested) && classroom.requested !== classroom.students
      ? `<p class="cc-note cc-warn">${escapeHtml(text(`El generador trabaja con ${STUDENT_RANGE[0]} a ${STUDENT_RANGE[1]} estudiantes; se usan ${classroom.students}.`, `The generator works with ${STUDENT_RANGE[0]} to ${STUDENT_RANGE[1]} students; ${classroom.students} are used.`))}</p>`
      : "";
    els.groups.innerHTML = `<p class="cc-help">${escapeHtml(text(`${classroom.students} estudiantes: ${courtsLabel(classroom)}.`, `${classroom.students} students: ${courtsLabel(classroom)}.`))}</p>`
      + `<table class="cc-groups"><thead>${head}</thead><tbody>${body}</tbody></table>${clamped}`
      + `<p class="cc-help">${escapeHtml(text("El papel del sospechoso 1 es el más exigente: dáselo a alguien que disfrute con público.", "The role of suspect 1 is the most demanding: give it to someone who enjoys an audience."))}</p>`;
  }

  function buildFullTimelineEvents(data) {
    const { timeline, temps } = data;
    return [
      {
        time: formatTime(timeline.classStart),
        label: text(`Inicio de clase; temperatura normal ${formatNumber(temps.bodyAtDeath)} C`, `Class starts; normal temperature ${formatNumber(temps.bodyAtDeath)} C`),
        color: [96, 127, 97]
      },
      {
        time: formatTime(timeline.classEnd),
        label: text("Termina la clase", "Class ends"),
        color: [47, 95, 119]
      },
      {
        time: formatEventTime(timeline.death, timeline.classEnd),
        label: text("Muerte estimada", "Estimated death"),
        color: [200, 86, 72]
      },
      {
        time: formatEventTime(timeline.discovery, timeline.classEnd),
        label: text("Descubrimiento", "Discovery"),
        color: [200, 86, 72]
      },
      {
        time: formatEventTime(timeline.firstMeasurement, timeline.classEnd),
        label: text(`1a medición ${formatNumber(temps.firstMeasurement)} C`, `1st measurement ${formatNumber(temps.firstMeasurement)} C`),
        color: [47, 95, 119]
      },
      {
        time: formatEventTime(timeline.secondMeasurement, timeline.classEnd),
        label: text(`2a medición ${formatNumber(temps.secondMeasurement)} C`, `2nd measurement ${formatNumber(temps.secondMeasurement)} C`),
        color: [47, 95, 119]
      }
    ];
  }

  function buildScaledTimelineLanes(data) {
    const { timeline, temps } = data;
    const [s1, s2, s3] = data.suspects;
    const outsideColor = [201, 209, 216];
    const classroomColor = [47, 95, 119];
    const contactColor = [200, 86, 72];
    const limitedColor = [96, 127, 97];

    return [
      {
        label: text("Caso", "Case"),
        segments: [
          {
            start: timeline.classStart,
            end: timeline.classEnd,
            label: text("Clase", "Class"),
            color: classroomColor
          },
          {
            start: timeline.classEnd,
            end: timeline.death,
            label: text("Intervalo crítico", "Critical interval"),
            color: contactColor
          },
          {
            start: timeline.death,
            end: timeline.discovery,
            label: text("Cuerpo oculto", "Body concealed"),
            color: outsideColor
          },
          {
            start: timeline.discovery,
            end: timeline.firstMeasurement,
            label: text("Aviso y llegada", "Call and arrival"),
            color: limitedColor
          },
          {
            start: timeline.firstMeasurement,
            end: timeline.secondMeasurement,
            label: text("Mediciones", "Measurements"),
            color: classroomColor
          }
        ],
        events: [
          { time: timeline.death, label: text("muerte", "death"), color: contactColor },
          { time: timeline.discovery, label: text("hallazgo", "discovery"), color: contactColor },
          { time: timeline.firstMeasurement, label: `${formatNumber(temps.firstMeasurement)} C`, color: classroomColor }
        ]
      },
      {
        label: s1.label,
        segments: [
          {
            start: timeline.classStart,
            end: timeline.classEnd,
            label: text("En aula", "In classroom"),
            color: classroomColor
          },
          {
            start: timeline.classEnd,
            end: timeline.death,
            label: text("Contacto directo", "Direct contact"),
            color: contactColor
          },
          {
            start: timeline.death,
            end: timeline.secondMeasurement,
            label: text("Fuera", "Away"),
            color: outsideColor
          }
        ],
        events: [{ time: timeline.death, label: text("sale", "leaves"), color: contactColor }]
      },
      {
        label: s2.label,
        segments: [
          {
            start: timeline.classStart,
            end: timeline.classEnd,
            label: text("En aula", "In classroom"),
            color: classroomColor
          },
          {
            start: timeline.classEnd,
            end: timeline.suspect2Return,
            label: text("Fuera", "Away"),
            color: outsideColor
          },
          {
            start: timeline.suspect2Return,
            end: timeline.suspect2Leave,
            label: text("Entrada / chaqueta", "Entrance / jacket"),
            color: limitedColor
          },
          {
            start: timeline.suspect2Leave,
            end: timeline.secondMeasurement,
            label: text("Fuera", "Away"),
            color: outsideColor
          }
        ],
        events: [{ time: timeline.suspect2Return, label: text("vuelve", "returns"), color: limitedColor }]
      },
      {
        label: s3.label,
        segments: [
          {
            start: timeline.classStart,
            end: timeline.classEnd,
            label: text("En aula", "In classroom"),
            color: classroomColor
          },
          {
            start: timeline.classEnd,
            end: timeline.discovery,
            label: text("Fuera", "Away"),
            color: outsideColor
          },
          {
            start: timeline.discovery,
            end: timeline.afternoonClass,
            label: text("Aula / hallazgo", "Classroom / discovery"),
            color: limitedColor
          },
          {
            start: timeline.afternoonClass,
            end: timeline.secondMeasurement,
            label: text("Edificio", "Building"),
            color: outsideColor
          }
        ],
        events: [{ time: timeline.discovery, label: text("encuentra", "finds body"), color: contactColor }]
      }
    ];
  }

  function setBusy(isBusy) {
    if (els.generateButton) {
      els.generateButton.disabled = isBusy;
    }
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function parseLocalDateTime(dateValue, timeValue) {
    const [year, month, day] = dateValue.split("-").map(Number);
    const [hour, minute] = timeValue.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  function shiftTimeValue(timeValue, minutes) {
    const [hour, minute] = timeValue.split(":").map(Number);
    const total = Math.max(0, Math.min(23 * 60 + 59, hour * 60 + minute + minutes));
    const shiftedHour = String(Math.floor(total / 60)).padStart(2, "0");
    const shiftedMinute = String(total % 60).padStart(2, "0");
    return `${shiftedHour}:${shiftedMinute}`;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  function hoursBetween(start, end) {
    return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
  }

  function sameCalendarDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(IS_ENGLISH ? "en-GB" : "es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatCaseDate(data) {
    return data.hasCaseDate
      ? text(`El ${formatDate(data.timeline.classEnd)}`, `On ${formatDate(data.timeline.classEnd)}`)
      : text("El día del caso", "On the day of the case");
  }

  function formatCaseDateValue(data, date) {
    return data.hasCaseDate ? formatDate(date) : text("Sin fecha", "Undated");
  }

  function formatCaseDateSuffix(data, date) {
    return data.hasCaseDate
      ? text(`del ${formatDate(date)}`, `on ${formatDate(date)}`)
      : text("del día del caso", "on the day of the case");
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat(IS_ENGLISH ? "en-GB" : "es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatEventTime(date, baseDate) {
    if (sameCalendarDay(date, baseDate)) {
      return formatTime(date);
    }
    return text(
      `${formatTime(date)} del ${formatDate(date)}`,
      `${formatTime(date)} on ${formatDate(date)}`
    );
  }

  function formatNumber(value) {
    return Number(value).toFixed(2);
  }

  function formatCelsius(value) {
    return `${formatNumber(value)}°C`;
  }

  function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function shortName(fullName) {
    const parts = normalizeName(fullName).split(" ").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : text("docente", "professor");
  }

  function fileStem(fullName) {
    const normalized = normalizeName(fullName)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized || text("docente", "professor");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function assetUrl(fileName) {
    return new URL(`assets/${fileName}`, SCRIPT_URL).href;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
