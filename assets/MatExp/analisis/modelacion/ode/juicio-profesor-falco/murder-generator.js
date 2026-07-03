(function () {
  "use strict";

  const TEMPS = {
    ambient: 22,
    bodyAtDeath: 36.5,
    firstMeasurement: 24.56,
    hoursFromDeathToFirst: 2.5,
    hoursBetweenMeasurements: 1
  };

  const SOURCE_CREDIT = "Material procedente de franjfal.github.io";

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
    pageBreak: () => ({ type: "pageBreak" }),
    spacer: (height = 10) => ({ type: "spacer", height })
  };

  function init() {
    els.form = document.getElementById("case-form");
    els.teacherName = document.getElementById("teacher-name");
    els.date = document.getElementById("case-date");
    els.time = document.getElementById("class-end-time");
    els.g1 = document.getElementById("suspect-1-gender");
    els.g2 = document.getElementById("suspect-2-gender");
    els.g3 = document.getElementById("suspect-3-gender");
    els.status = document.getElementById("status");
    els.summary = document.getElementById("case-summary");
    els.downloadsPanel = document.getElementById("downloads-panel");
    els.separateDownloads = document.getElementById("separate-downloads");
    els.bundleDownloads = document.getElementById("bundle-downloads");
    els.generateButton = document.getElementById("generate-button");
    els.clearButton = document.getElementById("clear-button");
    els.tabButtons = Array.from(document.querySelectorAll("[data-tab-target]"));
    els.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

    els.form.addEventListener("submit", handleGenerate);
    els.clearButton.addEventListener("click", clearDownloads);
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
    });

    [els.teacherName, els.date, els.time, els.g1, els.g2, els.g3].forEach((input) => {
      input.addEventListener("input", updateSummary);
      input.addEventListener("change", updateSummary);
    });

    updateSummary();
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("Preparando datos del caso...");
    clearDownloads();

    try {
      assertLibraries();
      const caseData = readCaseData();

      setStatus("Cargando imágenes...");
      const images = await loadImages(IMAGE_SOURCES);

      setStatus("Generando PDFs separados...");
      const individualSpecs = buildDocumentSpecs(caseData);
      const individualFiles = individualSpecs.map((spec) => buildPdfFile(spec, images));

      setStatus("Generando PDFs conjuntos por rol...");
      const bundleSpecs = buildBundleSpecs(caseData, individualSpecs);
      const bundleFiles = bundleSpecs.map((spec) => buildPdfFile(spec, images));

      setStatus("Preparando archivos ZIP...");
      const stamp = `${caseData.dateValue}_${caseData.timeValue.replace(":", "-")}`;
      const separateZip = {
        fileName: `juicio_${caseData.teacherFileStem}_documentos_separados_${stamp}.zip`,
        label: "ZIP documentos separados",
        blob: await buildZip(individualFiles)
      };
      const bundleZip = {
        fileName: `juicio_${caseData.teacherFileStem}_documentos_por_rol_${stamp}.zip`,
        label: "ZIP documentos conjuntos",
        blob: await buildZip(bundleFiles)
      };

      showDownloads(individualFiles, bundleFiles, separateZip, bundleZip);
      updateSummary(caseData);
      setStatus(
        `Listo: ${individualFiles.length} documentos separados y ${bundleFiles.length} paquetes por rol generados.`
      );
    } catch (error) {
      console.error(error);
      setStatus(error.message || "No se han podido generar los documentos.");
    } finally {
      setBusy(false);
    }
  }

  function assertLibraries() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("No se ha cargado jsPDF. Revisa la conexión o el enlace CDN.");
    }
    if (!window.JSZip) {
      throw new Error("No se ha cargado JSZip. Revisa la conexión o el enlace CDN.");
    }
  }

  function readCaseData() {
    const teacherFullName = normalizeName(els.teacherName.value);
    const dateValue = els.date.value;
    const timeValue = els.time.value;
    if (!teacherFullName) {
      throw new Error("Escribe el nombre del profesor.");
    }
    if (!dateValue || !timeValue) {
      throw new Error("Selecciona una fecha y una hora de fin de clase.");
    }

    const classEnd = parseLocalDateTime(dateValue, timeValue);
    const timeline = buildTimeline(classEnd);
    const temps = calculateTemperatures();
    const suspects = [
      buildSuspect(1, els.g1.value),
      buildSuspect(2, els.g2.value),
      buildSuspect(3, els.g3.value)
    ];

    return {
      teacherFullName,
      teacherShortName: shortName(teacherFullName),
      teacherFileStem: fileStem(teacherFullName),
      dateValue,
      timeValue,
      classEnd,
      timeline,
      temps,
      suspects
    };
  }

  function buildTimeline(classEnd) {
    const death = addMinutes(classEnd, 10);
    const discovery = addMinutes(death, 135);
    const firstMeasurement = addMinutes(death, 150);

    return {
      normalTemp: addMinutes(classEnd, -130),
      classEnd,
      death,
      suspect2Return: addMinutes(classEnd, 20),
      suspect2Leave: addMinutes(classEnd, 25),
      discovery,
      forensicCall: addMinutes(death, 140),
      firstMeasurement,
      secondMeasurement: addMinutes(firstMeasurement, 60),
      afternoonClass: addMinutes(discovery, 5)
    };
  }

  function calculateTemperatures() {
    const firstDelta = TEMPS.firstMeasurement - TEMPS.ambient;
    const bodyDelta = TEMPS.bodyAtDeath - TEMPS.ambient;
    const k = -Math.log(firstDelta / bodyDelta) / TEMPS.hoursFromDeathToFirst;
    const secondMeasurement =
      TEMPS.ambient + firstDelta * Math.exp(-k * TEMPS.hoursBetweenMeasurements);
    const estimatedHoursBeforeFirst = -Math.log(firstDelta / bodyDelta) / k;

    return {
      ambient: TEMPS.ambient,
      bodyAtDeath: TEMPS.bodyAtDeath,
      firstMeasurement: TEMPS.firstMeasurement,
      secondMeasurement,
      k,
      estimatedHoursBeforeFirst
    };
  }

  function buildSuspect(number, gender) {
    const feminine = gender === "f";
    const forms = feminine
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

    return {
      number,
      gender,
      ...forms,
      label: `${forms.roleCap} ${number}`,
      lowerLabel: `${forms.role} ${number}`,
      withArticle: `${forms.article} ${forms.role} ${number}`,
      withArticleCap: `${forms.articleCap} ${forms.role} ${number}`,
      fileStem: `${forms.roleCap}_${number}`
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
        fileName: "ROL_Juez_paquete_completo.pdf",
        label: "El juez",
        title: "El juez",
        ids: ["context", "visualDossier", "trialGuide", "evidenceBoard", "judge"]
      },
      {
        id: "bundle_prosecution",
        fileName: "ROL_Fiscalia_paquete_completo.pdf",
        label: "La Fiscalía",
        title: "La Fiscalía",
        ids: ["context", "visualDossier", "trialGuide", "evidenceBoard", "prosecution", "forensicMath"]
      },
      {
        id: "bundle_forensic",
        fileName: "ROL_Medico_forense_paquete_completo.pdf",
        label: "El médico forense",
        title: "El médico forense",
        ids: ["context", "visualDossier", "trialGuide", "forensicReport", "forensicMath"]
      },
      {
        id: "bundle_janitor",
        fileName: "ROL_Conserje_paquete_completo.pdf",
        label: "La conserje",
        title: "La conserje",
        ids: ["context", "visualDossier", "trialGuide", "evidenceBoard", "janitor"]
      },
      {
        id: "bundle_jury",
        fileName: "ROL_Jurado_popular_paquete_completo.pdf",
        label: "El jurado popular",
        title: "El jurado popular",
        ids: ["context", "visualDossier", "jury"]
      },
      {
        id: "bundle_suspect1",
        fileName: `ROL_${s1.fileStem}_paquete_completo.pdf`,
        label: s1.withArticleCap,
        title: s1.withArticleCap,
        ids: ["context", "visualDossier", "suspect1"]
      },
      {
        id: "bundle_suspect2",
        fileName: `ROL_${s2.fileStem}_paquete_completo.pdf`,
        label: s2.withArticleCap,
        title: s2.withArticleCap,
        ids: ["context", "visualDossier", "suspect2"]
      },
      {
        id: "bundle_suspect3",
        fileName: `ROL_${s3.fileStem}_paquete_completo.pdf`,
        label: s3.withArticleCap,
        title: s3.withArticleCap,
        ids: ["context", "visualDossier", "suspect3"]
      },
      {
        id: "bundle_teacher",
        fileName: "ROL_Docente_paquete_completo_con_solucion.pdf",
        label: "El docente",
        title: "El docente",
        ids: individualSpecs.map((spec) => spec.id)
      }
    ];

    return bundles.map((bundle) => {
      const docs = bundle.ids.map((id) => byId[id]).filter(Boolean);
      return makeBundleSpec(bundle.id, bundle.fileName, bundle.label, bundle.title, docs);
    });
  }

  function commonContextDoc(data) {
    const { timeline, teacherFullName } = data;
    const labels = data.suspects.map((suspect) => suspect.label).join(", ");

    return makeSpec(
      "context",
      "00_Contexto_comun.pdf",
      "La historia del caso",
      "",
      [
        block.image("cover", "Aula de la actividad y escena del caso.", { maxHeight: 190 }),
        block.heading("Historia de fondo"),
        block.paragraph(
          `El ${formatDate(timeline.classEnd)}, el profesor ${teacherFullName} impartió una clase especialmente tensa de ecuaciones diferenciales y transformadas de Laplace. La clase terminó a las ${formatTime(timeline.classEnd)}, después de un examen sorpresa que dejó al grupo inquieto.`
        ),
        block.paragraph(
          `Más tarde, a las ${formatEventTime(timeline.discovery, timeline.classEnd)}, el cuerpo del profesor fue encontrado en el aula. La policía acordonó la zona y comenzó una investigación que ha llevado a juicio a tres personas sospechosas.`
        ),
        block.heading("Información común"),
        block.bullets([
          "Cada participante debe leer este documento y su paquete de rol.",
          "Nadie debe conocer la solución antes de que se desarrollen los interrogatorios.",
          "Los motivos, coartadas y movimientos concretos deben aparecer durante el juicio.",
          "La hora de la muerte se estimará con datos forenses y la ley de enfriamiento de Newton."
        ]),
        block.heading("Roles del juicio"),
        block.bullets([
          "Juez: preside la sesión, mantiene el orden y guía la deliberación.",
          "Fiscalía: construye la acusación mediante pruebas, preguntas y razonamiento.",
          "Médico forense: presenta la causa de muerte, las mediciones y el cálculo científico.",
          "Conserje: aporta registros del edificio, condiciones del aula y movimientos observados.",
          "Jurado popular: escucha, toma notas y decide un veredicto justificado.",
          `Personas sospechosas: ${labels}.`
        ]),
        block.heading("Objetivo de la actividad"),
        block.paragraph(
          "Reconstruir la cronología del caso a partir de testimonios, datos de temperatura y razonamiento matemático. El juicio debe permitir que la verdad se descubra en clase, no antes."
        )
      ]
    );
  }

  function commonVisualDossierDoc() {
    return makeSpec(
      "visualDossier",
      "01_Dossier_visual_comun.pdf",
      "El plano del aula",
      "",
      [
        block.heading("Plano del aula"),
        block.paragraph(
          "Este plano puede usarse durante el juicio para situar la mesa del profesor, la zona donde se encontró el cuerpo, la entrada del aula y la chaqueta olvidada."
        ),
        block.image("classroomPlan", "Plano del aula y localización de los elementos principales.", {
          maxHeight: 330
        }),
        block.heading("Uso del dossier"),
        block.bullets([
          "El plano no identifica a la persona culpable.",
          "Las preguntas deben centrarse en quién estuvo en cada zona, cuándo y con qué explicación.",
          "Si una persona usa el plano como prueba, debe relacionarlo con un testimonio o con un dato forense."
        ])
      ]
    );
  }

  function trialGuideDoc() {
    return makeSpec(
      "trialGuide",
      "02_Guia_desarrollo_juicio.pdf",
      "Guía de desarrollo del juicio",
      "Documento para juez, Fiscalía, médico forense y conserje",
      [
        block.heading("Estructura de la sesión"),
        block.image("trialFlow", "Flujo recomendado del juicio.", { maxHeight: 235 }),
        block.numbered([
          "El juez abre la sesión, recuerda las normas y presenta el caso.",
          "La Fiscalía expone un alegato inicial breve, sin adelantar conclusiones no probadas.",
          "El médico forense presenta la causa de muerte, las temperaturas y la estimación científica de la hora de muerte.",
          "La conserje declara sobre el edificio, el aula, la temperatura de la sala y los movimientos observados.",
          "Cada sospechoso declara y responde a preguntas.",
          "La Fiscalía ordena los hechos en un alegato final.",
          "El jurado delibera y el juez recoge el veredicto."
        ]),
        block.heading("Normas para que el juicio sea autónomo"),
        block.bullets([
          "Cada participante solo debe usar la información que aparece en sus documentos.",
          "El juez puede cortar intervenciones repetidas o pedir que se distinga entre hecho y suposición.",
          "La Fiscalía debe obtener la información mediante preguntas, no leyendo la solución.",
          "El forense y la conserje deben responder solo sobre sus áreas de conocimiento.",
          "Los sospechosos deben defender su versión, aunque no sepan lo que saben los demás."
        ])
      ]
    );
  }

  function evidenceBoardDoc(data) {
    const { timeline, temps } = data;

    return makeSpec(
      "evidenceBoard",
      "03_Tablero_de_pruebas.pdf",
      "Tablero de pruebas",
      "Apoyo para los roles que presentan o moderan las pruebas",
      [
        block.heading("Tarjetas de pruebas"),
        block.evidenceCards([
          ["Registro de temperatura", `${formatNumber(temps.bodyAtDeath)} C a las ${formatEventTime(timeline.normalTemp, timeline.classEnd)}`],
          ["Mediciones de enfriamiento", `${formatNumber(temps.firstMeasurement)} C y ${formatNumber(temps.secondMeasurement)} C`],
          ["Registro de entradas", "Tres cronologías que deben compararse"],
          ["Chaqueta olvidada", "Un regreso breve al aula"],
          ["Resultado de autopsia", "Inyección, muerte instantánea"],
          ["Sistema del aula", `Aula constante a ${formatNumber(temps.ambient)} C`]
        ]),
        block.heading("Cómo usar estas tarjetas"),
        block.bullets([
          "El tablero no sustituye a los testimonios: cada tarjeta debe conectarse con una declaración.",
          "Las tarjetas ayudan a separar datos objetivos, interpretaciones y contradicciones.",
          "No deben entregarse como solución al jurado antes de que los datos se presenten en el juicio."
        ])
      ]
    );
  }

  function judgeDoc() {
    return makeSpec(
      "judge",
      "04_Papel_Juez.pdf",
      "El juez",
      "Responsabilidades, preguntas y normas de moderación",
      [
        block.heading("Objetivo"),
        block.paragraph(
          "Presidir el juicio con imparcialidad, garantizar que todas las partes puedan hablar y ayudar al jurado a llegar a un veredicto razonado."
        ),
        block.heading("Responsabilidades"),
        block.bullets([
          "Presentar brevemente el caso al jurado y recordar que nadie debe salirse de su papel.",
          "Mantener el orden y el respeto durante las declaraciones.",
          "Gestionar los tiempos para que todos los testigos y sospechosos puedan intervenir.",
          "Pedir aclaraciones cuando una afirmación no esté apoyada en pruebas.",
          "Cerrar la fase de pruebas y abrir la deliberación del jurado."
        ]),
        block.heading("Preguntas útiles"),
        block.bullets([
          "Al forense: qué datos midió, qué modelo usó y qué margen de interpretación tiene.",
          "A la conserje: quién entró o salió, a qué hora y qué datos del aula conoce.",
          "A cada sospechoso: dónde estaba al terminar la clase, qué hizo después y si tenía algún conflicto con el profesor.",
          "A la Fiscalía: qué pruebas son hechos y qué partes son interpretaciones."
        ]),
        block.heading("Cierre"),
        block.paragraph(
          "Antes de la deliberación, resume solo los hechos que se hayan presentado en voz alta. No sugieras un culpable: tu papel es ordenar el proceso."
        )
      ]
    );
  }

  function prosecutionDoc() {
    return makeSpec(
      "prosecution",
      "05_Papel_Fiscalia.pdf",
      "La Fiscalía",
      "Guía para construir la acusación mediante interrogatorios",
      [
        block.heading("Objetivo"),
        block.paragraph(
          "Demostrar, si las pruebas lo permiten, quién tuvo motivo, oportunidad y presencia compatible con la hora de la muerte. Debes obtener la cronología completa durante el juicio."
        ),
        block.heading("Estrategia"),
        block.numbered([
          "Abrir con una explicación breve: el caso se resolverá combinando testimonios y la ley de enfriamiento de Newton.",
          "Pedir al forense que explique las mediciones y calcule la hora aproximada de la muerte.",
          "Pedir a la conserje que aporte registros de temperatura, funcionamiento del aula y entradas o salidas.",
          "Interrogar a cada sospechoso por separado y comparar su versión con los datos ya presentados.",
          "Cerrar separando hechos demostrados, contradicciones y conclusión."
        ]),
        block.heading("Preguntas para preparar"),
        block.bullets([
          "Forense: cuándo llegó, qué temperaturas midió, qué ecuación usó y qué significa que la muerte fuera instantánea.",
          "Conserje: qué personas permanecieron o volvieron al edificio, dónde estaban y quién encontró el cuerpo.",
          "Sospechosos: cuándo salieron, si volvieron, qué relación tenían con el profesor y qué explicación dan de sus movimientos.",
          "Jurado: qué hechos son compatibles con la hora de muerte y cuáles dejan dudas."
        ]),
        block.heading("Cuidado con la información"),
        block.bullets([
          "No afirmes la culpabilidad antes de que las pruebas aparezcan públicamente.",
          "No inventes datos que no estén en testimonios o documentos presentados.",
          "Tu fuerza está en hacer preguntas claras y ordenar las respuestas."
        ])
      ]
    );
  }

  function forensicReportDoc(data) {
    const { timeline, temps } = data;
    const second = formatNumber(temps.secondMeasurement);

    return makeSpec(
      "forensicReport",
      "06_Informe_forense.pdf",
      "El informe forense",
      "Causa de muerte, observaciones y conclusiones iniciales",
      [
        block.heading("Resumen"),
        block.bullets([
          `Recibiste la llamada de la conserje a las ${formatEventTime(timeline.forensicCall, timeline.classEnd)}.`,
          `Llegaste a la universidad a las ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} y examinaste el cuerpo.`,
          `La primera temperatura corporal registrada fue ${formatNumber(temps.firstMeasurement)} C.`,
          `Una hora después, a las ${formatEventTime(timeline.secondMeasurement, timeline.classEnd)}, la temperatura fue ${second} C.`,
          "El examen preliminar indicó signos de muerte no natural.",
          "La autopsia reveló una inyección que provocó la muerte instantánea."
        ]),
        block.heading("Observaciones"),
        block.bullets([
          "No se encontraron señales de entrada forzada.",
          "No se encontró ningún arma homicida evidente en la escena.",
          "La sala se mantuvo a temperatura constante según los registros del edificio.",
          "La causa de muerte es compatible con un homicidio premeditado."
        ]),
        block.heading("Conclusión forense"),
        block.paragraph(
          `Usando las mediciones de temperatura y la ley de enfriamiento de Newton, la hora estimada de muerte es aproximadamente las ${formatEventTime(timeline.death, timeline.classEnd)}. El informe no identifica a la persona culpable.`
        )
      ]
    );
  }

  function forensicMathDoc(data) {
    const { timeline, temps } = data;
    const firstDelta = temps.firstMeasurement - temps.ambient;
    const second = formatNumber(temps.secondMeasurement);
    const k = temps.k.toFixed(4);

    return makeSpec(
      "forensicMath",
      "07_Informe_forense_matematico.pdf",
      "La estimación matemática",
      "Ley de enfriamiento de Newton aplicada al caso",
      [
        block.heading("Modelo visual generado"),
        block.coolingCurve(timeline, temps),
        block.heading("Ley de enfriamiento de Newton"),
        block.paragraph(
          "La ley de enfriamiento de Newton establece que la tasa de pérdida de calor es proporcional a la diferencia entre la temperatura del cuerpo y la temperatura ambiente."
        ),
        block.paragraph("dT/dt = -k(T - Ta)"),
        block.bullets([
          `Temperatura ambiente: Ta = ${formatNumber(temps.ambient)} C.`,
          `Temperatura normal del profesor en el momento de la muerte: ${formatNumber(temps.bodyAtDeath)} C.`,
          `Primera medición: ${formatNumber(temps.firstMeasurement)} C a las ${formatEventTime(timeline.firstMeasurement, timeline.classEnd)}.`,
          `Segunda medición: ${second} C a las ${formatEventTime(timeline.secondMeasurement, timeline.classEnd)}.`
        ]),
        block.heading("Cálculo"),
        block.paragraph(
          `Tomando t = 0 en la primera medición, T(0) = ${formatNumber(temps.firstMeasurement)} C. Por tanto, T(t) = 22 + ${formatNumber(firstDelta)} e^(-kt).`
        ),
        block.paragraph(
          `Con la segunda medición: ${second} = 22 + ${formatNumber(firstDelta)} e^(-k), de donde k = ${k} h^-1.`
        ),
        block.paragraph(
          `Al imponer T = ${formatNumber(temps.bodyAtDeath)} C, se obtiene t = -${temps.estimatedHoursBeforeFirst.toFixed(2)} h. La muerte ocurrió unas 2 h 30 min antes de la primera medición.`
        ),
        block.heading("Resultado"),
        block.paragraph(
          `Hora estimada de la muerte: ${formatEventTime(timeline.death, timeline.classEnd)}.`
        )
      ]
    );
  }

  function janitorDoc(data) {
    const { timeline, temps } = data;
    const { teacherShortName } = data;
    const [s1, s2, s3] = data.suspects;

    return makeSpec(
      "janitor",
      "08_Registro_Conserje.pdf",
      "La conserje",
      "Registros del edificio y observaciones",
      [
        block.image("classroomPlan", "Plano del aula usado para situar las observaciones.", {
          maxHeight: 260
        }),
        block.heading("Objetivo"),
        block.paragraph(
          "Aportar información fiable sobre el aula, los registros de temperatura y los movimientos que observaste en el edificio. No debes especular sobre la culpabilidad."
        ),
        block.heading("Datos del aula"),
        block.bullets([
          `A las ${formatEventTime(timeline.normalTemp, timeline.classEnd)}, el profesor ${teacherShortName} tenía una temperatura normal de ${formatNumber(temps.bodyAtDeath)} C.`,
          `El sistema de climatización del aula funcionaba correctamente y mantenía la sala a ${formatNumber(temps.ambient)} C.`,
          `${s3.withArticleCap} encontró el cuerpo a las ${formatEventTime(timeline.discovery, timeline.classEnd)} y te avisó inmediatamente.`,
          `Llamaste a las autoridades y al médico forense, que recibió el aviso a las ${formatEventTime(timeline.forensicCall, timeline.classEnd)}.`
        ]),
        block.heading("Registro de movimientos"),
        block.bullets([
          `${s1.withArticleCap} se quedó después de clase y salió del edificio aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`,
          `${s2.withArticleCap} salió con la mayoría de la clase a las ${formatTime(timeline.classEnd)}. Volvió a entrar sobre las ${formatEventTime(timeline.suspect2Return, timeline.classEnd)} para recoger una chaqueta olvidada cerca de la entrada del aula y salió unos minutos después, hacia las ${formatEventTime(timeline.suspect2Leave, timeline.classEnd)}.`,
          `${s3.withArticleCap} salió con el resto de la clase a las ${formatTime(timeline.classEnd)}. Regresó para una clase de la tarde, prevista a las ${formatEventTime(timeline.afternoonClass, timeline.classEnd)}, y encontró el cuerpo al llegar unos minutos antes.`
        ]),
        block.heading("Durante el juicio"),
        block.bullets([
          "Responde con calma y separa lo que viste de lo que deduces.",
          "Si te preguntan por el culpable, explica que tus registros solo establecen movimientos.",
          "Insiste en que la información de temperatura de sala procede del sistema de climatización."
        ])
      ]
    );
  }

  function juryDoc() {
    return makeSpec(
      "jury",
      "09_Papel_Jurado_popular.pdf",
      "El jurado popular",
      "Instrucciones para escuchar y deliberar",
      [
        block.heading("Objetivo"),
        block.paragraph(
          "Escuchar el juicio con atención, tomar notas y decidir si las pruebas muestran la culpabilidad de alguna persona sospechosa más allá de una duda razonable."
        ),
        block.heading("Durante el juicio"),
        block.bullets([
          "No intervengas durante los interrogatorios salvo que el juez lo permita.",
          "Anota hechos, horas, contradicciones y dudas.",
          "Distingue entre pruebas presentadas y suposiciones.",
          "Recuerda que la carga de la prueba recae en la Fiscalía."
        ]),
        block.heading("Pistas que debes observar"),
        block.bullets([
          "Qué hora de muerte estima el forense y cómo llega a ella.",
          "Qué registros aporta la conserje sobre entradas, salidas y condiciones del aula.",
          "Qué explica cada sospechoso sobre su presencia, su relación con el profesor y su coartada.",
          "Qué versiones encajan con la prueba científica y cuáles dejan huecos."
        ]),
        block.heading("Deliberación"),
        block.paragraph(
          "Cuando el juez abra la deliberación, comparad las notas, acordad qué hechos están probados y votad el veredicto. El veredicto debe poder explicarse con pruebas presentadas durante el juicio."
        )
      ]
    );
  }

  function suspectOneDoc(data) {
    const { timeline } = data;
    const { teacherFullName } = data;
    const s1 = data.suspects[0];

    return makeSpec(
      "suspect1",
      `10_${s1.fileStem}.pdf`,
      `${s1.label} - Culpable de asesinato`,
      "Papel privado de la primera persona sospechosa",
      [
        block.heading("Hechos privados"),
        block.bullets([
          `Eres ${s1.un} estudiante ${s1.applied} de la clase del profesor ${teacherFullName}.`,
          `Te enfadaste por el examen sorpresa y te quedaste ${s1.alone} con el profesor cuando la clase terminó a las ${formatTime(timeline.classEnd)}.`,
          `Durante una discusión acalorada, mataste al profesor con una inyección oculta. La muerte fue instantánea, aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`,
          `Saliste del edificio justo después, a las ${formatEventTime(timeline.death, timeline.classEnd)}.`,
          "Después fuiste a casa a comer con tu familia."
        ]),
        block.heading("Versión pública"),
        block.bullets([
          "Reconoce que hubo un desacuerdo por el examen, pero afirma que terminó sin más conflicto.",
          "Di que cuando saliste del aula el profesor seguía vivo y parecía encontrarse bien.",
          "Insiste en que disfrutabas la asignatura y que una discusión académica no es motivo para matar a nadie.",
          "Si te presionan, cuestiona la precisión de los cálculos de temperatura y sugiere que el sistema del aula podría no haber sido constante."
        ]),
        block.heading("Objetivo"),
        block.paragraph(
          "Defiende tu inocencia con convicción. No reveles que eres culpable salvo que el desarrollo del juicio te acorrale de forma inevitable."
        )
      ]
    );
  }

  function suspectTwoDoc(data) {
    const { timeline } = data;
    const { teacherShortName } = data;
    const s2 = data.suspects[1];

    return makeSpec(
      "suspect2",
      `11_${s2.fileStem}.pdf`,
      `${s2.label} - Inocente`,
      "Papel privado de la segunda persona sospechosa",
      [
        block.heading("Hechos"),
        block.bullets([
          `Eres ${s2.un} estudiante ${s2.attentive} y puntual de la clase del profesor ${teacherShortName}.`,
          `Saliste del aula con la mayoría de la clase a las ${formatTime(timeline.classEnd)}.`,
          "Al llegar a la estación de metro, te diste cuenta de que habías olvidado una chaqueta y volviste al edificio.",
          `Entraste de nuevo sobre las ${formatEventTime(timeline.suspect2Return, timeline.classEnd)}, recogiste la chaqueta cerca de la entrada del aula y saliste unos minutos después, hacia las ${formatEventTime(timeline.suspect2Leave, timeline.classEnd)}.`,
          "No viste al profesor porque no te acercaste a la mesa delantera ni a la zona donde quedó oculto el cuerpo.",
          "Después fuiste a casa a comer con tu familia."
        ]),
        block.heading("Defensa"),
        block.bullets([
          "Subraya que saliste inicialmente con el resto del grupo.",
          "Explica con claridad que volviste solo por la chaqueta.",
          "Aclara que permaneciste cerca de la entrada y que desde allí no se veía la zona del cuerpo.",
          "Insiste en que no tenías motivo para hacer daño al profesor y que no sabías nada de su muerte."
        ]),
        block.heading("Objetivo"),
        block.paragraph(
          "Convencer al juez y al jurado de que tu regreso fue breve, explicable y no compatible con haber cometido el crimen."
        )
      ]
    );
  }

  function suspectThreeDoc(data) {
    const { timeline } = data;
    const s3 = data.suspects[2];

    return makeSpec(
      "suspect3",
      `12_${s3.fileStem}.pdf`,
      `${s3.label} - Inocente`,
      "Papel privado de la tercera persona sospechosa",
      [
        block.heading("Hechos"),
        block.bullets([
          `Eres ${s3.un} estudiante ${s3.responsible} que asiste regularmente a las clases de la mañana y de la tarde.`,
          `Saliste con el resto del grupo cuando la clase terminó a las ${formatTime(timeline.classEnd)}.`,
          "Fuiste a casa y comiste con tu familia.",
          `Regresaste para una clase de la tarde prevista a las ${formatEventTime(timeline.afternoonClass, timeline.classEnd)}.`,
          `Llegaste unos minutos antes, a las ${formatEventTime(timeline.discovery, timeline.classEnd)}, y encontraste el cuerpo del profesor en el aula.`,
          "Avisaste inmediatamente a la conserje, que contactó con las autoridades."
        ]),
        block.heading("Defensa"),
        block.bullets([
          "Subraya que actuaste de forma responsable al avisar de inmediato.",
          "Explica que el cuerpo ya estaba frío cuando llegaste.",
          "Insiste en que no tenías motivo para hacer daño al profesor.",
          "Tu cronología debe mostrar que no estabas en el aula en el intervalo crítico."
        ]),
        block.heading("Objetivo"),
        block.paragraph("Mostrar que fuiste la persona que descubrió el cuerpo, no quien provocó la muerte.")
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
      "99_Solucion_docente.pdf",
      "Solución docente - no entregar al alumnado",
      "Cronología completa, culpable y reparto de información",
      [
        block.heading("Resultado"),
        block.paragraph(
          `${s1.withArticleCap} es la persona culpable. Se quedó ${s1.alone} con el profesor tras la clase y la muerte instantánea se produjo aproximadamente a las ${formatEventTime(timeline.death, timeline.classEnd)}.`
        ),
        block.heading("Cronología visual"),
        block.timeline("Cronología completa", buildFullTimelineEvents(data)),
        block.heading("Tabla de sospechosos"),
        block.suspectTable([
          [s1.label, "Molestia por el examen sorpresa", `A solas hasta ${formatEventTime(timeline.death, timeline.classEnd)}`, "Afirma que el profesor seguía vivo"],
          [s2.label, "Sin motivo fuerte", `Volvió por la chaqueta a las ${formatEventTime(timeline.suspect2Return, timeline.classEnd)}`, "Se quedó en la entrada"],
          [s3.label, "Sin motivo claro", `Regresó a las ${formatEventTime(timeline.discovery, timeline.classEnd)}`, "Encontró el cuerpo"]
        ]),
        block.heading("Solución matemática"),
        block.coolingCurve(timeline, temps),
        block.paragraph(
          `Con temperatura ambiente Ta = ${formatNumber(temps.ambient)} C, T(0) = ${formatNumber(temps.firstMeasurement)} C y T(1) = ${second} C, se obtiene k = ${k} h^-1.`
        ),
        block.paragraph(
          `La ecuación con t = 0 en la primera medición es T(t) = 22 + ${formatNumber(temps.firstMeasurement - temps.ambient)} e^(-${k}t). Al imponer T = ${formatNumber(temps.bodyAtDeath)} C, resulta t = -${temps.estimatedHoursBeforeFirst.toFixed(2)} h.`
        ),
        block.paragraph(
          `Por tanto, la muerte ocurre unas 2 h 30 min antes de la primera medición, es decir, a las ${formatEventTime(timeline.death, timeline.classEnd)}.`
        ),
        block.heading("Reparto de información"),
        block.bullets([
          "La historia del caso y el plano del aula: se incluyen en todos los paquetes por rol.",
          "Guía de desarrollo del juicio: juez, Fiscalía, médico forense y conserje.",
          "Tablero de pruebas: juez, Fiscalía, conserje y docente.",
          "Informe forense e informe matemático: médico forense; el informe matemático también ayuda a la Fiscalía.",
          `${s1.label}: conoce su culpabilidad y su versión pública.`,
          `${s2.label} y ${s3.label}: conocen solo sus propias coartadas.`
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

  function buildPdfFile(spec, images) {
    const pdf = renderPdf(spec, images);
    return {
      fileName: spec.fileName,
      label: spec.downloadLabel,
      blob: pdf.output("blob")
    };
  }

  function renderPdf(spec, images) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
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

    if (item.type === "spacer") {
      cursor.y += item.height;
    }
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
    const minX = -2.5;
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
      { t: -2.5, temp: temps.bodyAtDeath, label: `${formatNumber(temps.bodyAtDeath)} C\n${formatEventTime(timeline.death, timeline.classEnd)}` },
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
    doc.text("Temperatura (C)", graph.x, graph.y + graph.height + 22);
    doc.text("Tiempo respecto a la primera medición", graph.x + graph.width, graph.y + graph.height + 22, {
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
    ensureSpace(doc, page, cursor, 112);
    const headers = ["Sospechoso", "Motivo", "Oportunidad", "Coartada"];
    const widths = [92, 135, 145, 145];
    const rowHeight = 44;
    let x = page.marginX;

    doc.setFillColor(32, 42, 51);
    doc.rect(page.marginX, cursor.y, widths.reduce((a, b) => a + b, 0), 24, "F");
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
      doc.rect(page.marginX, cursor.y, widths.reduce((a, b) => a + b, 0), rowHeight, "F");
      row.forEach((cell, index) => {
        doc.setFont("helvetica", index === 0 ? "bold" : "normal");
        doc.setFontSize(8.4);
        doc.setTextColor(32, 42, 51);
        const lines = doc.splitTextToSize(cell, widths[index] - 10);
        lines.slice(0, 3).forEach((line, lineIndex) => {
          doc.text(line, x + 5, cursor.y + 14 + lineIndex * 10);
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
      doc.text(`Misterio de asesinato - ${label} - ${current}/${count}`, page.marginX, page.height - 30);
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
        throw new Error(`No se pudo cargar ${src}`);
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

  function showDownloads(individualFiles, bundleFiles, separateZip, bundleZip) {
    els.separateDownloads.innerHTML = "";
    els.bundleDownloads.innerHTML = "";
    els.downloadsPanel.classList.remove("hidden");
    activateTab("panel-bundles");

    appendDownloadGroup(els.separateDownloads, separateZip, individualFiles);
    appendDownloadGroup(els.bundleDownloads, bundleZip, bundleFiles);
  }

  function appendDownloadGroup(container, zipFile, files) {
    const zipUrl = rememberUrl(URL.createObjectURL(zipFile.blob));
    container.appendChild(makeDownloadLink(zipUrl, zipFile.fileName, zipFile.label, "Todos en un ZIP", true));

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
    viewLink.title = `Ver ${title} en el navegador`;
    viewLink.setAttribute("aria-label", `Ver ${title} en el navegador`);
    viewLink.innerHTML = iconEye();

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.className = "download-icon";
    downloadLink.title = `Descargar ${title}`;
    downloadLink.setAttribute("aria-label", `Descargar ${title}`);
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
      item.innerHTML = "<strong>Resumen</strong><span>Completa fecha y hora</span>";
      els.summary.appendChild(item);
      return;
    }

    const { timeline } = data;
    const rows = [
      ["Profesor", data.teacherFullName],
      ["Fecha", formatDate(timeline.classEnd)],
      ["Fin de clase", formatTime(timeline.classEnd)],
      ["Muerte estimada", formatEventTime(timeline.death, timeline.classEnd)],
      ["Descubrimiento", formatEventTime(timeline.discovery, timeline.classEnd)],
      ["1a medición", `${formatEventTime(timeline.firstMeasurement, timeline.classEnd)} (${formatNumber(data.temps.firstMeasurement)} C)`],
      ["2a medición", `${formatEventTime(timeline.secondMeasurement, timeline.classEnd)} (${formatNumber(data.temps.secondMeasurement)} C)`]
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
        time: formatEventTime(timeline.normalTemp, timeline.classEnd),
        label: `Temperatura normal ${formatNumber(temps.bodyAtDeath)} C`,
        color: [96, 127, 97]
      },
      {
        time: formatTime(timeline.classEnd),
        label: "Termina la clase",
        color: [47, 95, 119]
      },
      {
        time: formatEventTime(timeline.death, timeline.classEnd),
        label: "Muerte estimada",
        color: [200, 86, 72]
      },
      {
        time: formatEventTime(timeline.discovery, timeline.classEnd),
        label: "Descubrimiento",
        color: [200, 86, 72]
      },
      {
        time: formatEventTime(timeline.firstMeasurement, timeline.classEnd),
        label: `1a medición ${formatNumber(temps.firstMeasurement)} C`,
        color: [47, 95, 119]
      },
      {
        time: formatEventTime(timeline.secondMeasurement, timeline.classEnd),
        label: `2a medición ${formatNumber(temps.secondMeasurement)} C`,
        color: [47, 95, 119]
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

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  function sameCalendarDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatEventTime(date, baseDate) {
    if (sameCalendarDay(date, baseDate)) {
      return formatTime(date);
    }
    return `${formatTime(date)} del ${formatDate(date)}`;
  }

  function formatNumber(value) {
    return Number(value).toFixed(2);
  }

  function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function shortName(fullName) {
    const parts = normalizeName(fullName).split(" ").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "docente";
  }

  function fileStem(fullName) {
    const normalized = normalizeName(fullName)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized || "docente";
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
