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

  const IMAGE_SOURCES = {
    cover: assetUrl("cover_scene.png"),
    classroomPlan: assetUrl("classroom_plan.png"),
    trialFlow: assetUrl("trial_flow.png")
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
    pageBreak: () => ({ type: "pageBreak" }),
    spacer: (height = 10) => ({ type: "spacer", height })
  };

  function init() {
    els.form = document.getElementById("case-form");
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
    els.generateButton = document.getElementById("generate-button");
    els.clearButton = document.getElementById("clear-button");
    els.tabButtons = Array.from(document.querySelectorAll("[data-tab-target]"));
    els.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

    els.form.addEventListener("submit", handleGenerate);
    els.clearButton.addEventListener("click", clearDownloads);
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
    });

    [
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
      const individualSpecs = buildDocumentSpecs(caseData);
      const individualFiles = individualSpecs.map((spec) => buildPdfFile(spec, images, caseData.pageFormat));

      setStatus(text("Generando PDFs conjuntos por rol...", "Generating role packets..."));
      const bundleSpecs = buildBundleSpecs(caseData, individualSpecs);
      const bundleFiles = bundleSpecs.map((spec) => buildPdfFile(spec, images, caseData.pageFormat));

      const completeSpec = buildCompleteSpec(individualSpecs);
      const completeFile = buildPdfFile(completeSpec, images, caseData.pageFormat);

      setStatus(text("Preparando archivos ZIP...", "Preparing ZIP files..."));
      const stamp = `${caseData.dateStamp}_${caseData.endTimeValue.replace(":", "-")}`;
      const separateZip = {
        fileName: text(
          `juicio_${caseData.teacherFileStem}_documentos_separados_${stamp}.zip`,
          `trial_${caseData.teacherFileStem}_separate_documents_${stamp}.zip`
        ),
        label: text("ZIP documentos separados", "ZIP of separate documents"),
        blob: await buildZip(individualFiles)
      };
      const bundleZip = {
        fileName: text(
          `juicio_${caseData.teacherFileStem}_documentos_por_rol_${stamp}.zip`,
          `trial_${caseData.teacherFileStem}_role_packets_${stamp}.zip`
        ),
        label: text("ZIP documentos conjuntos", "ZIP of role packets"),
        blob: await buildZip(bundleFiles)
      };

      completeFile.fileName = text(
        `juicio_${caseData.teacherFileStem}_documento_completo_${stamp}.pdf`,
        `trial_${caseData.teacherFileStem}_complete_document_${stamp}.pdf`
      );
      completeFile.label = text("PDF completo", "Complete PDF");

      showDownloads(individualFiles, bundleFiles, separateZip, bundleZip, completeFile);
      updateSummary(caseData);
      setStatus(text(
        `Listo: ${individualFiles.length} documentos separados, ${bundleFiles.length} paquetes por rol y un PDF completo generados.`,
        `Done: ${individualFiles.length} separate documents, ${bundleFiles.length} role packets, and one complete PDF generated.`
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
    const mathMode = els.mathMode && els.mathMode.checked ? "ode" : "calculus";
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

  function buildBundleSpecs(data, individualSpecs) {
    const byId = Object.fromEntries(individualSpecs.map((spec) => [spec.id, spec]));
    const [s1, s2, s3] = data.suspects;

    const bundles = [
      {
        id: "bundle_judge",
        fileName: text("ROL_Juez_paquete_completo.pdf", "ROLE_Judge_complete_packet.pdf"),
        label: text("El juez", "The judge"),
        title: text("El juez", "The judge"),
        ids: ["context", "trialGuide", "visualDossier", "evidenceBoard", "judge"]
      },
      {
        id: "bundle_prosecution",
        fileName: text("ROL_Fiscalia_paquete_completo.pdf", "ROLE_Prosecution_complete_packet.pdf"),
        label: text("La Fiscalía", "The prosecution"),
        title: text("La Fiscalía", "The prosecution"),
        ids: ["context", "trialGuide", "visualDossier", "evidenceBoard", "forensicReport", "forensicMath", "prosecution"]
      },
      {
        id: "bundle_forensic",
        fileName: text("ROL_Medico_forense_paquete_completo.pdf", "ROLE_Forensic_doctor_complete_packet.pdf"),
        label: text("El médico forense", "The forensic doctor"),
        title: text("El médico forense", "The forensic doctor"),
        ids: ["context", "trialGuide", "visualDossier", "forensicRole", "forensicReport", "forensicMath"]
      },
      {
        id: "bundle_janitor",
        fileName: text("ROL_Conserje_paquete_completo.pdf", "ROLE_Custodian_complete_packet.pdf"),
        label: text("La conserje", "The building custodian"),
        title: text("La conserje", "The building custodian"),
        ids: ["context", "trialGuide", "visualDossier", "evidenceBoard", "janitor"]
      },
      {
        id: "bundle_jury",
        fileName: text("ROL_Jurado_popular_paquete_completo.pdf", "ROLE_Jury_complete_packet.pdf"),
        label: text("El jurado popular", "The jury"),
        title: text("El jurado popular", "The jury"),
        ids: ["context", "jury"]
      },
      {
        id: "bundle_suspect1",
        fileName: text(`ROL_${s1.fileStem}_paquete_completo.pdf`, `ROLE_${s1.fileStem}_complete_packet.pdf`),
        label: s1.withArticleCap,
        title: s1.withArticleCap,
        ids: ["context", "suspect1"]
      },
      {
        id: "bundle_suspect2",
        fileName: text(`ROL_${s2.fileStem}_paquete_completo.pdf`, `ROLE_${s2.fileStem}_complete_packet.pdf`),
        label: s2.withArticleCap,
        title: s2.withArticleCap,
        ids: ["context", "suspect2"]
      },
      {
        id: "bundle_suspect3",
        fileName: text(`ROL_${s3.fileStem}_paquete_completo.pdf`, `ROLE_${s3.fileStem}_complete_packet.pdf`),
        label: s3.withArticleCap,
        title: s3.withArticleCap,
        ids: ["context", "suspect3"]
      },
      {
        id: "bundle_teacher",
        fileName: text("ROL_Docente_paquete_completo_con_solucion.pdf", "ROLE_Teacher_complete_packet_with_solution.pdf"),
        label: text("El docente", "The teacher"),
        title: text("El docente", "The teacher"),
        ids: individualSpecs.map((spec) => spec.id)
      }
    ];

    return bundles.map((bundle) => {
      const docs = bundle.ids.map((id) => byId[id]).filter(Boolean);
      return makeBundleSpec(bundle.id, bundle.fileName, bundle.label, bundle.title, docs);
    });
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

  function commonContextDoc(data) {
    const { timeline, temps, teacherFullName, teacherShortName, className } = data;
    const caseDate = formatCaseDate(data);

    return makeSpec(
      "context",
      text("00_Contexto_comun.pdf", "00_Common_context.pdf"),
      text("La historia del caso", "The case story"),
      "",
      [
        block.image("cover", "", { maxHeight: 190 }),
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
          `Al llegar a las ${formatTime(timeline.firstMeasurement)}, el médico forense registró una temperatura corporal de ${formatCelsius(temps.firstMeasurement)}. Una hora después, la temperatura se midió de nuevo y fue de ${formatCelsius(temps.secondMeasurement)}. Usando la ley de enfriamiento de Newton, estas mediciones permiten estimar que la muerte se produjo aproximadamente a las ${formatTime(timeline.death)}.`,
          `On arriving at ${formatTime(timeline.firstMeasurement)}, the forensic doctor recorded a body temperature of ${formatCelsius(temps.firstMeasurement)}. One hour later, it was measured again at ${formatCelsius(temps.secondMeasurement)}. Using Newton's law of cooling, these measurements place the death at approximately ${formatTime(timeline.death)}.`
        )),
        block.paragraph(text(
          `Las personas sospechosas son estudiantes que interactuaron con el profesor ${teacherShortName} o estuvieron en el edificio alrededor de la hora estimada de muerte. ${data.suspects[0].withArticleCap} se quedó con el profesor y salió aproximadamente a las ${formatTime(timeline.death)}. ${data.suspects[1].withArticleCap} regresó más tarde para recoger una chaqueta olvidada cerca de la entrada del aula, pero no avanzó hasta la parte delantera, donde el cuerpo quedó parcialmente oculto detrás de la mesa del profesor. ${data.suspects[2].withArticleCap} volvió solo para la clase de la tarde y encontró el cuerpo. La evidencia forense, combinada con los testimonios, ayudará a establecer la culpabilidad o inocencia de cada persona sospechosa.`,
          `The suspects are students who interacted with Professor ${teacherShortName} or were in the building around the estimated time of death. ${data.suspects[0].withArticleCap} stayed behind with the professor and left at about ${formatTime(timeline.death)}. ${data.suspects[1].withArticleCap} returned later to collect a forgotten jacket near the classroom entrance, but did not go to the front, where the body was partly hidden behind the professor's desk. ${data.suspects[2].withArticleCap} returned only for the afternoon class and found the body. The forensic evidence, together with the testimony, will help establish each suspect's guilt or innocence.`
        ))
      ]
    );
  }

  function commonVisualDossierDoc() {
    return makeSpec(
      "visualDossier",
      text("01_Dossier_visual_comun.pdf", "01_Shared_visual_case_file.pdf"),
      text("El plano del aula", "The classroom plan"),
      "",
      [
        block.heading(text("Plano del aula", "Classroom plan")),
        block.paragraph(text(
          "Este plano puede usarse durante el juicio para situar la mesa del profesor, la zona donde se encontró el cuerpo, la entrada del aula y la chaqueta olvidada.",
          "Use this plan during the trial to locate the professor's desk, the area where the body was found, the classroom entrance, and the forgotten jacket."
        )),
        block.image("classroomPlan", text("Plano del aula y localización de los elementos principales.", "Classroom plan showing the main items."), {
          maxHeight: 330
        }),
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
      text("02_Guia_desarrollo_juicio.pdf", "02_Trial_guide.pdf"),
      text("Guía de desarrollo del juicio", "Trial guide"),
      text("Documento para juez, Fiscalía, médico forense y conserje", "For the judge, prosecution, forensic doctor, and building custodian"),
      [
        block.heading(text("Estructura de la sesión", "Session structure")),
        block.image("trialFlow", text("Flujo recomendado del juicio.", "Recommended trial sequence."), { maxHeight: 235 }),
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
      text("03_Tablero_de_pruebas.pdf", "03_Evidence_board.pdf"),
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
      text("04_Papel_Juez.pdf", "04_Judge_role.pdf"),
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
          "Preguntar a la conserje por sus observaciones, registros y conocimiento de la escena.",
          "Interrogar a cada sospechoso sobre su coartada, sus movimientos y sus posibles motivos.",
          "Permitir que la Fiscalía presente sus argumentos y conecte pruebas con cronología.",
          "Dar oportunidad a las personas sospechosas de responder o refutar las acusaciones."
        ], [
          "Call the forensic doctor to present conclusions about the cause and estimated time of death.",
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
      text("05_Papel_Fiscalia.pdf", "05_Prosecution_role.pdf"),
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
      text("06_Papel_Medico_forense.pdf", "06_Forensic_doctor_role.pdf"),
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
      text("07_Informe_forense.pdf", "07_Forensic_report.pdf"),
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
      text("08_Informe_forense_matematico.pdf", "08_Mathematical_forensic_report.pdf"),
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
        block.pageBreak(),
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
      text("08_Informe_forense_matematico.pdf", "08_Mathematical_forensic_report.pdf"),
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
        block.pageBreak(),
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
      text("09_Registro_Conserje.pdf", "09_Custodian_record.pdf"),
      text("La conserje", "The building custodian"),
      text("Registros del edificio y observaciones", "Building records and observations"),
      [
        block.image("classroomPlan", text("Plano del aula usado para situar las observaciones.", "Classroom plan used to locate the observations."), {
          maxHeight: 260
        }),
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
      text("10_Papel_Jurado_popular.pdf", "10_Jury_role.pdf"),
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
      `11_${s1.fileStem}.pdf`,
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
      `12_${s2.fileStem}.pdf`,
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
      `13_${s3.fileStem}.pdf`,
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
      text("Solución docente - no entregar al alumnado", "Teacher solution - do not give to students"),
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
          text("Tablero de pruebas: juez, Fiscalía, conserje y docente.", "Evidence board: judge, prosecution, building custodian, and teacher."),
          text("Informe forense e informe matemático: médico forense y Fiscalía.", "Forensic and mathematical reports: forensic doctor and prosecution."),
          text(`${s1.withArticleCap}: conoce su culpabilidad y su versión pública.`, `${s1.withArticleCap}: knows about the guilt and public account.`),
          text(`${s2.withArticleCap} y ${s3.withArticle}: conocen solo sus propias coartadas.`, `${s2.withArticleCap} and ${s3.withArticle}: know only their own alibis.`)
        ])
      ]
    );
  }

  function makeSpec(id, fileName, title, subtitle, blocks) {
    return { id, fileName, downloadLabel: title, title, subtitle, blocks };
  }

  function makeBundleSpec(id, fileName, downloadLabel, title, docs) {
    const blocks = [];
    docs.forEach((docSpec, index) => {
      if (index > 0) {
        blocks.push(block.pageBreak());
      }
      blocks.push(block.chapter(docSpec.downloadLabel, docSpec.subtitle));
      blocks.push(...docSpec.blocks);
    });

    return {
      id,
      fileName,
      downloadLabel,
      title,
      subtitle: "",
      blocks
    };
  }

  function buildPdfFile(spec, images, pageFormat) {
    const pdf = renderPdf(spec, images, pageFormat);
    return {
      fileName: spec.fileName,
      label: spec.downloadLabel,
      blob: pdf.output("blob")
    };
  }

  function renderPdf(spec, images, pageFormat) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: pageFormat === "letter" ? "letter" : "a4" });
    const page = {
      width: doc.internal.pageSize.getWidth(),
      height: doc.internal.pageSize.getHeight(),
      marginX: 46,
      marginTop: 50,
      marginBottom: 52
    };
    const cursor = { y: page.marginTop };

    addDocumentTitle(doc, page, cursor, spec.title, spec.subtitle);
    spec.blocks.forEach((item) => renderBlock(doc, page, cursor, item, images));
    addFooters(doc, page, spec.downloadLabel);
    return doc;
  }

  function addDocumentTitle(doc, page, cursor, title, subtitle) {
    doc.setFillColor(32, 42, 51);
    doc.rect(page.marginX, cursor.y - 8, 6, 50, "F");
    addWrappedText(doc, page, cursor, title, {
      size: 20,
      style: "bold",
      lineHeight: 24,
      gapAfter: 6,
      indent: 18
    });
    if (subtitle) {
      addWrappedText(doc, page, cursor, subtitle, {
        size: 11,
        style: "normal",
        color: [90, 101, 112],
        lineHeight: 15,
        gapAfter: 12,
        indent: 18
      });
    }
    doc.setDrawColor(216, 222, 228);
    doc.line(page.marginX, cursor.y, page.width - page.marginX, cursor.y);
    cursor.y += 18;
  }

  function renderBlock(doc, page, cursor, item, images) {
    if (item.type === "pageBreak") {
      doc.addPage();
      cursor.y = page.marginTop;
      return;
    }

    if (item.type === "chapter") {
      ensureSpace(doc, page, cursor, 56);
      doc.setFillColor(247, 245, 239);
      doc.roundedRect(page.marginX, cursor.y - 14, page.width - page.marginX * 2, 48, 5, 5, "F");
      addWrappedText(doc, page, cursor, item.title, {
        size: 15,
        style: "bold",
        lineHeight: 18,
        gapAfter: 2,
        indent: 12
      });
      if (item.subtitle) {
        addWrappedText(doc, page, cursor, item.subtitle, {
          size: 9.5,
          style: "normal",
          color: [90, 101, 112],
          lineHeight: 12,
          gapAfter: 14,
          indent: 12
        });
      }
      cursor.y += 8;
      return;
    }

    if (item.type === "heading") {
      ensureSpace(doc, page, cursor, 30);
      addWrappedText(doc, page, cursor, item.text, {
        size: 14,
        style: "bold",
        lineHeight: 18,
        gapAfter: 7
      });
      return;
    }

    if (item.type === "paragraph") {
      addWrappedText(doc, page, cursor, item.text, {
        size: 10.5,
        style: "normal",
        lineHeight: 15,
        gapAfter: 8
      });
      return;
    }

    if (item.type === "bullets") {
      item.items.forEach((text) => addListItem(doc, page, cursor, "-", text, 10.5));
      cursor.y += 4;
      return;
    }

    if (item.type === "numbered") {
      item.items.forEach((text, index) => addListItem(doc, page, cursor, `${index + 1}.`, text, 10.5));
      cursor.y += 4;
      return;
    }

    if (item.type === "image") {
      addImageBlock(doc, page, cursor, item, images);
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
      addCoolingCurveBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "evidenceCards") {
      addEvidenceCardsBlock(doc, page, cursor, item.cards);
      return;
    }

    if (item.type === "suspectTable") {
      addSuspectTableBlock(doc, page, cursor, item.rows);
      return;
    }

    if (item.type === "caseFile") {
      addCaseFileBlock(doc, page, cursor, item);
      return;
    }

    if (item.type === "spacer") {
      cursor.y += item.height;
    }
  }

  function addCaseFileBlock(doc, page, cursor, item) {
    const width = page.width - page.marginX * 2;
    ensureSpace(doc, page, cursor, 94);
    doc.setFillColor(247, 245, 239);
    doc.setDrawColor(32, 42, 51);
    doc.roundedRect(page.marginX, cursor.y, width, 82, 4, 4, "FD");
    doc.setFillColor(32, 42, 51);
    doc.rect(page.marginX, cursor.y, width, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(text("EXPEDIENTE FORENSE", "FORENSIC CASE FILE"), page.marginX + 12, cursor.y + 16);
    cursor.y += 38;

    const colWidth = width / 2;
    item.meta.forEach(([label, value], index) => {
      const x = page.marginX + (index % 2) * colWidth + 12;
      const y = cursor.y + Math.floor(index / 2) * 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(90, 101, 112);
      doc.text(String(label).toUpperCase(), x, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(32, 42, 51);
      doc.text(String(value), x + 70, y);
    });
    cursor.y += 58;

    item.sections.forEach((section) => {
      const bodyLines = section.body ? doc.splitTextToSize(section.body, width - 28) : [];
      const bulletLines = [];
      (section.bullets || []).forEach((bullet) => {
        bulletLines.push(...doc.splitTextToSize(`- ${bullet}`, width - 34));
      });
      const sectionHeight = 34 + bodyLines.length * 13 + bulletLines.length * 13 + 12;
      ensureSpace(doc, page, cursor, sectionHeight);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(216, 222, 228);
      doc.roundedRect(page.marginX, cursor.y, width, sectionHeight - 8, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(32, 42, 51);
      doc.text(section.title, page.marginX + 12, cursor.y + 18);
      let y = cursor.y + 38;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(32, 42, 51);
      bodyLines.forEach((line) => {
        doc.text(line, page.marginX + 14, y);
        y += 13;
      });
      bulletLines.forEach((line) => {
        doc.text(line, page.marginX + 18, y);
        y += 13;
      });
      cursor.y += sectionHeight;
    });
  }

  function addWrappedText(doc, page, cursor, text, options = {}) {
    const size = options.size || 10.5;
    const style = options.style || "normal";
    const lineHeight = options.lineHeight || size * 1.35;
    const gapAfter = options.gapAfter || 0;
    const color = options.color || [32, 42, 51];
    const indent = options.indent || 0;
    const maxWidth = page.width - page.marginX * 2 - indent;

    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(String(text), maxWidth);
    lines.forEach((line) => {
      ensureSpace(doc, page, cursor, lineHeight);
      doc.text(line, page.marginX + indent, cursor.y);
      cursor.y += lineHeight;
    });
    cursor.y += gapAfter;
  }

  function addListItem(doc, page, cursor, marker, text, size) {
    const markerWidth = 18;
    const lineHeight = 14.5;
    const maxWidth = page.width - page.marginX * 2 - markerWidth;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(32, 42, 51);

    const lines = doc.splitTextToSize(String(text), maxWidth);
    lines.forEach((line, index) => {
      ensureSpace(doc, page, cursor, lineHeight);
      if (index === 0) {
        doc.text(marker, page.marginX, cursor.y);
      }
      doc.text(line, page.marginX + markerWidth, cursor.y);
      cursor.y += lineHeight;
    });
    cursor.y += 2;
  }

  function addImageBlock(doc, page, cursor, item, images) {
    const image = images[item.key];
    if (!image) {
      addWrappedText(doc, page, cursor, `[Imagen no disponible: ${item.key}]`, {
        size: 9.5,
        color: [153, 63, 53],
        gapAfter: 8
      });
      return;
    }

    const maxWidth = page.width - page.marginX * 2;
    const ratio = image.height / image.width;
    let width = maxWidth;
    let height = width * ratio;
    const maxHeight = item.options.maxHeight || 300;
    if (height > maxHeight) {
      height = maxHeight;
      width = height / ratio;
    }

    const caption = item.caption ? String(item.caption) : "";
    const captionSize = 8.5;
    const captionLineHeight = 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(captionSize);
    const captionLines = caption ? doc.splitTextToSize(caption, width) : [];
    const captionHeight = captionLines.length ? captionLines.length * captionLineHeight + 8 : 8;

    ensureSpace(doc, page, cursor, height + 6 + captionHeight);
    const x = page.marginX + (maxWidth - width) / 2;
    try {
      doc.addImage(image.dataUrl || image.element, "PNG", x, cursor.y, width, height);
    } catch (error) {
      addWrappedText(doc, page, cursor, `[No se pudo incrustar la imagen: ${item.key}]`, {
        size: 9.5,
        color: [153, 63, 53],
        gapAfter: 8
      });
      return;
    }
    cursor.y += height + 6;

    if (captionLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(captionSize);
      doc.setTextColor(90, 101, 112);
      captionLines.forEach((line) => {
        ensureSpace(doc, page, cursor, captionLineHeight);
        doc.text(line, x + width / 2, cursor.y, { align: "center" });
        cursor.y += captionLineHeight;
      });
      cursor.y += 8;
    } else {
      cursor.y += 8;
    }
  }

  function addTimelineBlock(doc, page, cursor, item) {
    ensureSpace(doc, page, cursor, 145);
    addWrappedText(doc, page, cursor, item.title, {
      size: 12,
      style: "bold",
      lineHeight: 15,
      gapAfter: 5
    });

    const left = page.marginX + 18;
    const right = page.width - page.marginX - 18;
    const y = cursor.y + 34;
    const events = item.events;
    const span = Math.max(events.length - 1, 1);

    doc.setDrawColor(47, 95, 119);
    doc.setLineWidth(2);
    doc.line(left, y, right, y);

    events.forEach((event, index) => {
      const x = left + ((right - left) * index) / span;
      doc.setFillColor(event.color[0], event.color[1], event.color[2]);
      doc.circle(x, y, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(32, 42, 51);
      doc.text(event.time, x, y - 16, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      const lines = doc.splitTextToSize(event.label, 70);
      lines.slice(0, 3).forEach((line, lineIndex) => {
        doc.text(line, x, y + 20 + lineIndex * 10, { align: "center" });
      });
    });

    cursor.y += 125;
  }

  function addScaledTimelineBlock(doc, page, cursor, item) {
    const lanes = item.lanes;
    const height = 110 + lanes.length * 48;
    ensureSpace(doc, page, cursor, height);
    addWrappedText(doc, page, cursor, item.title, {
      size: 12,
      style: "bold",
      lineHeight: 15,
      gapAfter: 7
    });

    const axisLeft = page.marginX + 86;
    const axisRight = page.width - page.marginX - 12;
    const axisWidth = axisRight - axisLeft;
    const minTime = Math.min(
      ...lanes.flatMap((lane) => [
        ...lane.segments.map((segment) => segment.start.getTime()),
        ...lane.segments.map((segment) => segment.end.getTime()),
        ...lane.events.map((event) => event.time.getTime())
      ])
    );
    const maxTime = Math.max(
      ...lanes.flatMap((lane) => [
        ...lane.segments.map((segment) => segment.start.getTime()),
        ...lane.segments.map((segment) => segment.end.getTime()),
        ...lane.events.map((event) => event.time.getTime())
      ])
    );
    const span = Math.max(maxTime - minTime, 1);
    const xFor = (date) => axisLeft + ((date.getTime() - minTime) / span) * axisWidth;
    // Leave separate vertical bands for axis ticks and event labels. Events that
    // are close in time are staggered so their captions cannot overlap.
    const topY = cursor.y + 48;

    const tickCount = 5;
    doc.setDrawColor(216, 222, 228);
    doc.setLineWidth(0.6);
    for (let i = 0; i <= tickCount; i += 1) {
      const ratio = i / tickCount;
      const x = axisLeft + axisWidth * ratio;
      const tickDate = new Date(minTime + span * ratio);
      doc.line(x, topY - 8, x, topY + lanes.length * 48 - 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 101, 112);
      doc.text(formatTime(tickDate), x, topY - 40, { align: "center" });
    }

    lanes.forEach((lane, laneIndex) => {
      const y = topY + laneIndex * 48;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.4);
      doc.setTextColor(32, 42, 51);
      doc.text(lane.label, page.marginX, y + 3);
      doc.setDrawColor(201, 209, 216);
      doc.setLineWidth(0.7);
      doc.line(axisLeft, y, axisRight, y);

      const segmentLabels = [];
      lane.segments.forEach((segment) => {
        const startX = xFor(segment.start);
        const endX = xFor(segment.end);
        doc.setDrawColor(segment.color[0], segment.color[1], segment.color[2]);
        doc.setLineWidth(7);
        doc.line(startX, y, endX, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(32, 42, 51);
        const labelX = startX + (endX - startX) / 2;
        const labelLines = doc.splitTextToSize(segment.label, Math.max(42, Math.abs(endX - startX) + 18));
        segmentLabels.push({ labelX, labelLines: labelLines.slice(0, 2) });
      });

      const segmentTiers = [];
      segmentLabels
        .sort((a, b) => a.labelX - b.labelX)
        .forEach(({ labelX, labelLines }) => {
        const labelWidth = Math.max(...labelLines.map((line) => doc.getTextWidth(line)), 0) + 6;
        const labelLeft = labelX - labelWidth / 2;
        const labelRight = labelX + labelWidth / 2;
        let tier = segmentTiers.findIndex((rightEdge) => labelLeft > rightEdge);
        if (tier === -1) tier = segmentTiers.length;
        segmentTiers[tier] = labelRight;
        labelLines.slice(0, 2).forEach((line, lineIndex) => {
          doc.text(line, labelX, y + 13 + tier * 16 + lineIndex * 8, { align: "center" });
        });
      });

      const eventTiers = [];
      lane.events
        .map((event) => ({ event, x: xFor(event.time) }))
        .sort((a, b) => a.x - b.x)
        .forEach(({ event, x }) => {
        doc.setFillColor(event.color[0], event.color[1], event.color[2]);
        doc.circle(x, y, 4.2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.4);
        doc.setTextColor(32, 42, 51);
        const labelWidth = doc.getTextWidth(event.label) + 6;
        const labelLeft = x - labelWidth / 2;
        const labelRight = x + labelWidth / 2;
        let tier = eventTiers.findIndex((rightEdge) => labelLeft > rightEdge);
        if (tier === -1) tier = eventTiers.length;
        eventTiers[tier] = labelRight;
        doc.text(event.label, x, y - 10 - tier * 11, { align: "center" });
      });
    });

    cursor.y += height - 8;
  }

  function addCoolingCurveBlock(doc, page, cursor, item) {
    ensureSpace(doc, page, cursor, 240);
    const { timeline, temps } = item;
    const graph = {
      x: page.marginX + 28,
      y: cursor.y + 15,
      width: page.width - page.marginX * 2 - 56,
      height: 160
    };
    const minT = 22;
    const maxT = 37;
    const minX = -Math.max(temps.estimatedHoursBeforeFirst, 0.5);
    const maxX = 1;
    const xFor = (t) => graph.x + ((t - minX) / (maxX - minX)) * graph.width;
    const yFor = (temp) => graph.y + ((maxT - temp) / (maxT - minT)) * graph.height;
    const tempAt = (t) => temps.ambient + (temps.firstMeasurement - temps.ambient) * Math.exp(-temps.k * t);

    doc.setDrawColor(216, 222, 228);
    doc.setLineWidth(0.7);
    [22, 27, 32, 37].forEach((temp) => {
      const y = yFor(temp);
      doc.line(graph.x, y, graph.x + graph.width, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90, 101, 112);
      doc.text(String(temp), graph.x - 20, y + 3);
    });

    doc.setDrawColor(32, 42, 51);
    doc.setLineWidth(1.1);
    doc.rect(graph.x, graph.y, graph.width, graph.height);

    doc.setDrawColor(200, 86, 72);
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
      { t: 1, temp: temps.secondMeasurement, label: `${formatNumber(temps.secondMeasurement)} C\n${formatEventTime(timeline.secondMeasurement, timeline.classEnd)}` }
    ];

    points.forEach((point) => {
      const x = xFor(point.t);
      const y = yFor(point.temp);
      doc.setFillColor(32, 42, 51);
      doc.circle(x, y, 4.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.4);
      doc.setTextColor(32, 42, 51);
      point.label.split("\n").forEach((line, index) => {
        doc.text(line, x + 8, y - 7 + index * 10);
      });
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(32, 42, 51);
    doc.text(text("Temperatura (C)", "Temperature (C)"), graph.x, graph.y + graph.height + 22);
    doc.text(text("Tiempo respecto a la primera medición", "Time relative to first measurement"), graph.x + graph.width, graph.y + graph.height + 22, {
      align: "right"
    });
    cursor.y += 220;
  }

  function addEvidenceCardsBlock(doc, page, cursor, cards) {
    const cardWidth = (page.width - page.marginX * 2 - 18) / 2;
    const cardHeight = 68;
    const gap = 18;

    cards.forEach((card, index) => {
      if (index % 2 === 0) {
        ensureSpace(doc, page, cursor, cardHeight + 12);
      }
      const col = index % 2;
      const x = page.marginX + col * (cardWidth + gap);
      const y = cursor.y;
      doc.setDrawColor(201, 209, 216);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, "FD");
      doc.setFillColor(32, 42, 51);
      doc.rect(x, y, cardWidth, 20, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.3);
      doc.setTextColor(255, 255, 255);
      doc.text(card[0], x + 10, y + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(32, 42, 51);
      const lines = doc.splitTextToSize(card[1], cardWidth - 20);
      lines.slice(0, 3).forEach((line, lineIndex) => {
        doc.text(line, x + 10, y + 39 + lineIndex * 12);
      });
      if (col === 1 || index === cards.length - 1) {
        cursor.y += cardHeight + 12;
      }
    });
    cursor.y += 4;
  }

  function addSuspectTableBlock(doc, page, cursor, rows) {
    ensureSpace(doc, page, cursor, 232);
    const headers = text(
      ["Sospechoso", "Motivo", "Oportunidad", "Coartada"],
      ["Suspect", "Motive", "Opportunity", "Alibi"]
    );
    const tableWidth = page.width - page.marginX * 2;
    const widths = [0.18, 0.3, 0.32, 0.2].map((ratio) => tableWidth * ratio);
    const rowHeight = 66;
    let x = page.marginX;

    doc.setFillColor(32, 42, 51);
    doc.rect(page.marginX, cursor.y, tableWidth, 24, "F");
    headers.forEach((header, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(header, x + 6, cursor.y + 16);
      x += widths[index];
    });
    cursor.y += 24;

    rows.forEach((row, rowIndex) => {
      ensureSpace(doc, page, cursor, rowHeight + 4);
      x = page.marginX;
      doc.setFillColor(rowIndex % 2 === 0 ? 255 : 239, rowIndex % 2 === 0 ? 255 : 243, rowIndex % 2 === 0 ? 255 : 246);
      doc.rect(page.marginX, cursor.y, tableWidth, rowHeight, "F");
      row.forEach((cell, index) => {
        doc.setFont("helvetica", index === 0 ? "bold" : "normal");
        doc.setFontSize(7.9);
        doc.setTextColor(32, 42, 51);
        const lines = doc.splitTextToSize(cell, widths[index] - 10);
        lines.slice(0, 5).forEach((line, lineIndex) => {
          doc.text(line, x + 5, cursor.y + 13 + lineIndex * 9.5);
        });
        x += widths[index];
      });
      cursor.y += rowHeight;
    });
    cursor.y += 12;
  }

  function ensureSpace(doc, page, cursor, needed) {
    if (cursor.y + needed > page.height - page.marginBottom) {
      doc.addPage();
      cursor.y = page.marginTop;
    }
  }

  function addFooters(doc, page, label) {
    const count = doc.getNumberOfPages();
    for (let current = 1; current <= count; current += 1) {
      doc.setPage(current);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90, 101, 112);
      doc.text(text(
        `Misterio de asesinato - ${label} - ${current}/${count}`,
        `Murder mystery - ${label} - ${current}/${count}`
      ), page.marginX, page.height - 30);
      doc.text(SOURCE_CREDIT, page.width - page.marginX, page.height - 18, { align: "right" });
    }
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

  function showDownloads(individualFiles, bundleFiles, separateZip, bundleZip, completeFile) {
    els.separateDownloads.innerHTML = "";
    els.bundleDownloads.innerHTML = "";
    els.downloadsPanel.classList.remove("hidden");
    activateTab("panel-bundles");

    updateCompletePdfLink(completeFile);
    appendDownloadGroup(els.separateDownloads, separateZip, individualFiles);
    appendDownloadGroup(els.bundleDownloads, bundleZip, bundleFiles);
  }

  function updateCompletePdfLink(file) {
    if (!els.completePdfLink || !file) {
      return;
    }
    const url = rememberUrl(URL.createObjectURL(file.blob));
    els.completePdfLink.href = url;
    els.completePdfLink.download = file.fileName;
    els.completePdfLink.classList.remove("hidden");
    els.completePdfLink.setAttribute("aria-label", text("Descargar PDF completo", "Download complete PDF"));
  }

  function appendDownloadGroup(container, zipFile, files) {
    const zipUrl = rememberUrl(URL.createObjectURL(zipFile.blob));
    container.appendChild(makeDownloadLink(zipUrl, zipFile.fileName, zipFile.label, text("Todos en un ZIP", "All files in one ZIP"), true));

    files.forEach((file) => {
      const url = rememberUrl(URL.createObjectURL(file.blob));
      container.appendChild(makeDownloadLink(url, file.fileName, file.label, file.fileName, false));
    });
  }

  function makeDownloadLink(url, fileName, title, detail, primary) {
    const row = document.createElement("div");
    row.className = primary ? "download-link primary-link" : "download-link";

    const label = document.createElement("span");
    label.className = "download-title";
    label.textContent = title;

    const actions = document.createElement("span");
    actions.className = "download-actions";

    const viewLink = document.createElement("a");
    viewLink.href = url;
    viewLink.target = "_blank";
    viewLink.rel = "noopener";
    viewLink.className = "download-icon";
    viewLink.title = text(`Ver ${title} en el navegador`, `View ${title} in the browser`);
    viewLink.setAttribute("aria-label", text(`Ver ${title} en el navegador`, `View ${title} in the browser`));
    viewLink.innerHTML = iconEye();

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.className = "download-icon";
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
      els.downloadsPanel.classList.add("hidden");
    }
    if (els.completePdfLink) {
      els.completePdfLink.classList.add("hidden");
      els.completePdfLink.removeAttribute("href");
      els.completePdfLink.removeAttribute("download");
    }
  }

  function rememberUrl(url) {
    state.urls.push(url);
    return url;
  }

  function activateTab(targetId) {
    els.tabButtons.forEach((button) => {
      const active = button.dataset.tabTarget === targetId;
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
        "<strong>Resumen</strong><span>Completa los datos del caso</span>",
        "<strong>Summary</strong><span>Complete the case details</span>"
      );
      els.summary.appendChild(item);
      return;
    }

    const { timeline } = data;
    const rows = [
      [text("Profesor", "Professor"), data.teacherFullName],
      [text("Clase", "Course"), data.className],
      [text("Formato PDF", "PDF format"), data.pageFormat === "letter" ? text("Carta", "Letter") : "A4"],
      [text("Informe matemático", "Mathematical report"), data.mathMode === "ode" ? text("Ecuaciones diferenciales", "Differential equations") : text("Cálculo", "Calculus")],
      [text("Fecha", "Date"), formatCaseDateValue(data, timeline.classEnd)],
      [text("Inicio de clase", "Class starts"), formatTime(timeline.classStart)],
      [text("Fin de clase", "Class ends"), formatTime(timeline.classEnd)],
      [text("Muerte estimada", "Estimated death"), formatEventTime(timeline.death, timeline.classEnd)],
      [text("Descubrimiento", "Discovery"), formatEventTime(timeline.discovery, timeline.classEnd)],
      [text("1a medición", "1st measurement"), `${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} (${formatNumber(data.temps.firstMeasurement)} C)`],
      [text("2a medición", "2nd measurement"), `${formatEventTime(timeline.secondMeasurement, timeline.classEnd)} (${formatNumber(data.temps.secondMeasurement)} C)`],
      [text("Sospechosos", "Suspects"), data.suspects.map((suspect) => suspect.label).join(", ")]
    ];

    els.summary.innerHTML = "";
    rows.forEach(([label, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span>`;
      els.summary.appendChild(item);
    });
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
