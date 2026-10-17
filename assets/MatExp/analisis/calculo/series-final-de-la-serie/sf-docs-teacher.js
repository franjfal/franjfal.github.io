/*
 * Calculus Cases · Case 7 · The Series Finale — confidential documents.
 *
 * The private role cards (21–25), the teacher guide (90), the worked solutions (91), the
 * resolution of the case (92) and the interview control sheet (93). Loaded only by the teacher
 * generator, together with data/sf-private.js.
 */
(function (root) {
  "use strict";
  const DOCS = (root.SFDocs = root.SFDocs || { renderers: {} });
  const R = DOCS.renderers;
  const kicker = (X) => DOCS.kicker(X);
  const nameOf = (X, id) => DOCS.nameOf(X, id);

  // ---------------------------------------------------------------------- 2x private cards
  R.card = function (w, X, id) {
    const { t, SF } = X, c = SF.cards[id], p = SF.people.suspects.find((s) => s.id === id);
    const S = 10.5;   // a one-page role card: the callout size of the house
    w.title(`${t("Ficha privada", "Private card")} · ${p.name}`, kicker(X), t(`SOLO PARA ${p.name.toUpperCase()}`, `FOR ${p.name.toUpperCase()} ONLY`), { noBanner: true });
    w.meta([[t("Papel", "Role"), X.L(p.role)], [t("Episodios", "Episodes"), p.episodes.length ? p.episodes.join(", ") : t("el tráiler", "the trailer")], [t("Biblias recibidas", "Bibles received"), SF.envelope.distribution.filter((d) => d.recipients.includes(id)).map((d) => d.id).join(", ")]]);
    w.heading(t("Quién eres", "Who you are"), { compact: true });
    w.paragraph(X.L(c.whoYouAre), { size: S, gap: 1.2 });
    w.paragraph(`**${t("Tu objetivo", "Your goal")}:** ${X.L(c.goal)}`, { size: S, gap: 1.5 });
    w.heading(t("Lo que sabes", "What you know"), { compact: true });
    w.bullets(X.L(c.knows), false, { size: S, gap: 1.2 });
    w.heading(X.L({ es: "Tu noche del {D0weekday}", en: "Your night of {D0weekday}" }), { compact: true });
    w.table([t("Hora", "Time"), t("Qué hiciste", "What you did")], c.night.map(([h, x]) => [X.L({ es: h, en: h }), X.L(x)]), [28, 152], { tight: true });
    w.heading(t("Tu secreto y cuándo contar la verdad", "Your secret and when to tell the truth"), { compact: true });
    w.callout(X.L(c.secret), "warn", { size: S });
    w.bullets(X.L(c.reveal), false, { size: S, gap: 1.2 });
    if (c.lies) {
      w.heading(t("Tus mentiras (las únicas permitidas)", "Your lies (the only ones allowed)"), { compact: true });
      w.bullets(X.L(c.lies), false, { size: S, gap: 1.2 });
    }
    if (c.documents && c.documents.length) {
      w.heading(t("Documentos que puedes enseñar", "Documents you may show"), { compact: true });
      c.documents.forEach((d) => w.callout(`**${X.L(d.title)}.** ${X.L(d.text)}`, "note", { sans: true, size: 9.5 }));
    }
    if (c.confession) {
      w.heading(t("Tu declaración final", "Your final statement"), { compact: true });
      w.callout(X.L(c.confession), "blue", { italic: true, size: S });
    }
    w.heading(t("Tus matemáticas", "Your mathematics"), { compact: true });
    w.bullets(X.L(c.math.explain), false, { size: 9.5, gap: 1 });
    w.paragraph(t("Normas: puedes improvisar tu forma de hablar, nunca hechos, horas, cifras ni documentos; no contradigas un documento que te enseñen; si tu ficha no dice algo, responde «no lo sé». No enseñes esta ficha.",
      "Rules: you may improvise your manner, never facts, times, figures or documents; do not contradict a document you are shown; if your card does not say something, answer “I don't know”. Do not show this card."), { size: 9.5, italic: true, gap: 0 });
  };

  // ---------------------------------------------------------------------- printing guide
  /** Printing and distribution guide (teacher): everything about paper, copies and hand-outs. */
  R.printGuide = function (w, X) {
    const { t, cfg } = X, P = X.plan, room = cfg.classroom, pages = (id) => String((X.pages || {})[id] || "");
    const paper = cfg.format === "letter" ? t("Carta", "Letter") : "A4";
    w.title(t("Guía de impresión y reparto", "Printing and distribution guide"), kicker(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.meta([
      [t("Papel", "Paper"), t(`${paper}, en vertical; la presentación (00), apaisada 16:9`, `${paper}, portrait; the presentation (00), landscape 16:9`)],
      [t("Clase", "Class"), t(`${room.students} estudiantes: ${room.groups.length} grupos (${room.groups.map((g) => g.size).join(", ")}) y ${room.pairs ? "cinco parejas" : "cinco"} de sospechosos`, `${room.students} students: ${room.groups.length} groups (${room.groups.map((g) => g.size).join(", ")}) and ${room.pairs ? "five pairs" : "five"} of suspects`)],
      [t("Ejercicios", "Exercises"), X.L(X.SF.levels[cfg.level])],
    ]);
    w.heading(t("1. Antes de imprimir", "1. Before printing"));
    w.bullets(t([
      "Imprime todo de la misma generación: dosieres, fichas, sobre y solucionario de una generación coinciden entre sí. Si cambias la configuración, vuelve a imprimirlo todo.",
      "La presentación (00) se proyecta: no hace falta imprimirla. Si no hay proyector, imprime una copia por grupo.",
      "Escala: al 100 % («tamaño real»), sin «ajustar a la página». A doble cara por el borde largo, salvo la comprobación individual (32), que es una hoja.",
      "Color: recomendable en los dosieres (fotogramas y pruebas forenses); el resto, en blanco y negro.",
    ], [
      "Print everything from the same generation: the dossiers, cards, envelope and solutions of one generation agree with each other. If you change the configuration, print everything again.",
      "The presentation (00) is projected: there is no need to print it. Without a projector, print one copy per group.",
      "Scale: 100% (\"actual size\"), without \"fit to page\". Double-sided along the long edge, except the individual check (32), which is a single sheet.",
      "Colour: advisable for the dossiers (stills and forensic exhibits); the rest, black and white.",
    ]));
    w.heading(t("2. Documento a documento", "2. Document by document"), { keep: 40 });
    const rows = [];
    P.docs.filter((d) => d.print).forEach((d) => rows.push([`${d.n} ${d.title}`, pages(d.id), d.print.who, d.print.copies, d.print.how, d.print.when]));
    w.table([t("Documento", "Document"), t("Págs.", "Pages"), t("Quién lo recibe", "Who receives it"), t("Copias", "Copies"), t("Cómo se imprime", "How to print"), t("Cuándo", "When")],
      rows, [33, 11, 30, 27, 42, 31], { zebra: true });
    const copies = P.docs.filter((d) => d.print && d.count).map((d) => d.count * Number(pages(d.id) || 0));
    w.paragraph(t(`En total, sin la presentación ni el material docente: unas ${Math.ceil(copies.reduce((a, b) => a + b, 0) / 2)} hojas a doble cara.`, `In total, without the presentation or the teacher's material: about ${Math.ceil(copies.reduce((a, b) => a + b, 0) / 2)} double-sided sheets.`), { size: 9.5, italic: true });
    w.heading(t("3. Los paquetes de la web", "3. The packets on the website"), { keep: 30 });
    w.paragraph(t("La pestaña «Paquetes por rol» reúne los documentos en un PDF por destinatario. Imprimir por paquetes da el mismo resultado que imprimir los documentos uno a uno; la comprobación individual (32) se imprime aparte.",
      "The \"Role packets\" tab gathers the documents into one PDF per recipient. Printing by packet gives the same result as printing the documents one by one; the individual check (32) is printed separately."));
    const byId = (id) => P.docs.find((d) => d.id === id);
    w.table([t("Paquete", "Packet"), t("Contiene", "Contains"), t("Págs.", "Pages"), t("Para quién", "For whom")],
      P.bundles.map((b) => [b.label, b.docs.map((id) => (id === "print" ? t("esta guía", "this guide") : byId(id).n)).join(", "), String(b.docs.reduce((n, id) => n + Number(pages(id) || 0), 0)), b.use]),
      [44, 32, 12, 92], { zebra: true });
    w.heading(t("4. Reparto paso a paso", "4. Hand-outs step by step"), { keep: 30 });
    w.bullets(t([
      "Antes del lanzamiento. Imprime los dosieres, las fichas, los sobres, los tableros y las comprobaciones individuales con las copias de la tabla, y el paquete docente. Mete cada ficha en un sobre cerrado con el nombre del personaje por fuera, y cierra los sobres del documento 30.",
      "Lanzamiento, al final de una clase. Proyecta la presentación (00). En la diapositiva «Los grupos», forma los grupos y reparte: a cada estudiante, el dosier de su grupo; a cada sospechoso, su sobre.",
      "En casa. Cada grupo trabaja su episodio; los sospechosos preparan su ficha.",
      "Clase de cierre. Después de la puesta en común en la sala de montaje, entrega a cada grupo un sobre (30) y un tablero (31). Ten a mano el control de interrogatorios (93). Al final, la comprobación individual (32), a cada estudiante.",
      "La guía docente, el solucionario, la resolución y el control no salen de tus manos.",
    ], [
      "Before the launch. Print the dossiers, cards, envelopes, boards and individual checks with the copies in the table, and the teacher packet. Put each card in a sealed envelope with the character's name outside, and seal the envelopes of document 30.",
      "Launch, at the end of a class. Project the presentation (00). On the slide \"The groups\", form the groups and hand out: to each student, their group's dossier; to each suspect, their envelope.",
      "At home. Each group works on its episode; the suspects prepare their card.",
      "Closing class. After the pooling in the editing room, give each group an envelope (30) and a board (31). Keep the interview control (93) at hand. At the end, the individual check (32), to every student.",
      "The teacher guide, the solutions, the resolution and the control stay with you.",
    ]), true);
    w.heading(t("5. Material adicional", "5. Additional material"), { keep: 24 });
    w.bullets(t([
      `Sobres: ${room.pairs ? 10 : 5} para las fichas y ${room.groups.length} para el documento 30.`,
      "Proyector y un ordenador con la sala de montaje web, para la presentación y la puesta en común. El tráiler oficial se puede descargar ya renderizado desde el configurador, por si falla algo.",
      "Cinco sillas al frente para los sospechosos.",
    ], [
      `Envelopes: ${room.pairs ? 10 : 5} for the cards and ${room.groups.length} for document 30.`,
      "A projector and a computer with the web editing room, for the presentation and the pooling. The official trailer can be downloaded already rendered from the configurator, in case something fails.",
      "Five chairs at the front for the suspects.",
    ]));
  };

  // ---------------------------------------------------------------------- 90 teacher guide
  R.guide = function (w, X) {
    const { t, cfg } = X;
    w.title(t("Guía docente", "Teacher guide"), kicker(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.paragraph(t(
      "El final de ZENO, una serie de televisión ficticia, se ha filtrado. La clase investiga quién lo filtró a partir de los efectos visuales de la serie, construidos con sucesiones y series: una razón geométrica identifica la copia, una suma aritmética fecha un render, una telescopía revela una sesión borrada y el exponente de una serie p delata la versión de un documento. Usted es el inspector jefe: reparte las pruebas, abre el sobre, dirige los interrogatorios y pide cuentas.",
      "The finale of ZENO, a fictional TV series, has leaked. The class investigates who leaked it through the show's visual effects, which are built with sequences and series: a geometric ratio identifies the copy, an arithmetic sum dates a render, a telescoping sum reveals a deleted session and the exponent of a p-series gives away the version of a document. You are the Chief Inspector: you hand out the evidence, open the envelope, run the interviews and ask for accounts."));
    w.heading(t("Esta generación", "This generation"));
    const room = cfg.classroom, ep = (k) => X.L(X.SF.show.episodes.find((e) => e.id === k).title);
    w.meta([
      [t("Estudiantes", "Students"), String(room.students)],
      [t("Grupos", "Groups"), room.groups.map((g, k) => t(`${k + 1}: episodio ${g.episode} (${g.size})`, `${k + 1}: episode ${g.episode} (${g.size})`)).join(" · ")],
      [t("Sospechosos", "Suspects"), room.pairs ? t("cinco parejas", "five pairs") : t("cinco estudiantes", "five students")],
      [t("Ejercicios", "Exercises"), X.L(X.SF.levels[cfg.level])],
      [t("Noche de los hechos", "Night of the events"), X.L({ es: "{D0date}", en: "{D0date}" })],
      [t("Render", "Render"), `${X.C.tokens.renderFrames} ${t("fotogramas", "frames")}, ${X.C.tokens.renderFirst} s + ${X.C.tokens.renderStep} s, ${t("fin", "end")} ${X.C.tokens.renderFinish} → ${t("inicio", "start")} ${X.C.tokens.renderStart}`],
    ]);
    const missing = [1, 2, 3, 4, 5, 6].filter((k) => !cfg.episodes.includes(k));
    if (missing.length) w.paragraph(t(`Los episodios ${missing.map((k) => `${k} (${ep(k)})`).join(", ")} no tienen grupo: el sobre trae su resultado como informe del laboratorio.`, `Episodes ${missing.map((k) => `${k} (${ep(k)})`).join(", ")} have no group: the envelope brings their result as a lab report.`), { size: 9.5, italic: true });
    w.heading(t("Desarrollo", "Running the case"));
    w.table([t("Momento", "When"), t("Minutos", "Minutes"), t("Qué ocurre", "What happens")], t([
      ["Lanzamiento, al final de una clase", "3", "Diagnóstico individual (dos preguntas)."],
      ["", "8", "Presentación proyectada (documento 00): la filtración, el encargo del inspector jefe, la serie y sus episodios."],
      ["", "4", "Los grupos y los sospechosos (diapositiva «Los grupos»). Cada grupo recibe su dosier; cada sospechoso, su ficha en sobre cerrado."],
      ["", "3", "Recordatorio: término, suma parcial y serie (diapositiva)."],
      ["En casa", "45–60", "Cada grupo trabaja su episodio: la prueba forense, los ejercicios, los valores de su plano del tráiler y dos preguntas. Los sospechosos preparan su ficha."],
      ["Clase de cierre", "12", "Puesta en común en la sala de montaje: cada grupo dice su hallazgo e introduce su plano; se ve el tráiler de la clase."],
      ["", "5", "Apertura del sobre (documento 30), uno por grupo, con el tablero y la acusación (31)."],
      ["", "15", "Interrogatorios: los sospechosos al frente; tres rondas, una pregunta por grupo y ronda."],
      ["", "10", "Tablero de evidencias y acusación."],
      ["", "10", "Lectura de las acusaciones; cuando una presenta la hora correcta del render con el exponente o la sesión borrada, el culpable lee su declaración. El final de ZENO."],
      ["", "5", "Comprobación individual (documento 32); puede quedar para casa."],
    ], [
      ["Launch, at the end of a class", "3", "Individual entry check (two questions)."],
      ["", "8", "Projected presentation (document 00): the leak, the Chief Inspector's request, the show and its episodes."],
      ["", "4", "The groups and the suspects (slide \"The groups\"). Each group gets its dossier; each suspect, their card in a sealed envelope."],
      ["", "3", "Reminder: term, partial sum and series (slide)."],
      ["At home", "45–60", "Each group works on its episode: the forensic exhibit, the exercises, the values of its trailer shot and two questions. The suspects prepare their card."],
      ["Closing class", "12", "Pooling in the editing room: each group states its finding and enters its shot; the class trailer is played."],
      ["", "5", "Opening of the envelope (document 30), one per group, with the board and the accusation (31)."],
      ["", "15", "Interviews: the suspects at the front; three rounds, one question per group and round."],
      ["", "10", "Evidence board and accusation."],
      ["", "10", "Reading of the accusations; when one presents the correct render time with the exponent or the deleted session, the culprit reads the final statement. The ZENO finale."],
      ["", "5", "Individual check (document 32); it can be left for home."],
    ]), [34, 16, 130], { tight: true });
    w.paragraph(t("Qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento: «Guía de impresión y reparto», que acompaña a esta generación.", "What to print, how, how many copies and when each document is handed out: the “Printing and distribution guide” that comes with this generation."), { italic: true, size: 9.5 });
    w.heading(t("Lo que puede oír", "What you may hear"));
    w.table([t("Lo que se oye", "What you hear"), t("Qué revela", "What it reveals"), t("Qué preguntar", "What to ask")], t([
      ["«El render tardó 48 minutos: empezó a las 00:24, cuando Hugo estaba en la planta 3».", "Se supone que todos los fotogramas cuestan lo mismo.", "¿Qué dice el manual del perfil ZENO-VOL-3? ¿Cuánto cuesta el último fotograma?"],
      ["«Los términos tienden a cero, así que la sonda se para».", "Se confunde el comportamiento de los términos con el de la suma.", "¿Tienden a cero los términos de la armónica? ¿Y su suma?"],
      ["«Con p = 1.5 converge, así que Irene está a salvo».", "Se confunde convergente con pequeña.", "¿Cuánto vale la suma parcial en el minuto 11?"],
      ["«La razón es 11.81/7.20 = 1.64».", "Se dividen posiciones en lugar de huecos.", "¿Qué se repite de un anillo al siguiente, la posición o el hueco?"],
      ["«La marca de agua es la copia de Álex: es ella».", "Se confunde la copia con la persona.", "¿Dónde estaba esa copia? ¿Quién podía usarla?"],
      ["«Hemos sumado mil términos y la baliza está en 8.317».", "Se presenta una simulación como demostración.", "¿Qué garantiza que el límite está entre dos posiciones consecutivas?"],
    ], [
      ["“The render took 48 minutes: it started at 00:24, when Hugo was on floor 3.”", "Every frame is assumed to cost the same.", "What does the ZENO-VOL-3 manual say? What does the last frame cost?"],
      ["“The terms tend to zero, so the probe stops.”", "The behaviour of the terms is confused with that of the sum.", "Do the harmonic terms tend to zero? And their sum?"],
      ["“With p = 1.5 it converges, so Irene is safe.”", "Convergent is confused with small.", "What is the partial sum at minute 11?"],
      ["“The ratio is 11.81/7.20 = 1.64.”", "Positions are divided instead of gaps.", "What repeats from one ring to the next, the position or the gap?"],
      ["“The watermark is Álex's copy: it's her.”", "The copy is confused with the person.", "Where was that copy? Who could use it?"],
      ["“We added a thousand terms and the beacon is at 8.317.”", "A simulation is presented as a proof.", "What guarantees that the limit lies between two consecutive positions?"],
    ]), [64, 52, 64]);
    w.heading(t("Evaluación", "Assessment"));
    w.table([t("Criterio", "Criterion"), t("Suficiente", "Satisfactory"), t("Sólido", "Strong")], t([
      ["Corrección matemática", "Cálculos correctos de sumas parciales y sumas.", "Distingue término, suma parcial y serie en todos los casos."],
      ["Convergencia", "Clasifica correctamente.", "Lo justifica con un argumento (comparación, agrupación, telescopía, Leibniz)."],
      ["Prueba forense", "Obtiene el dato (hora, razón, exponente…).", "Explica qué demuestra y qué no."],
      ["Desafío creativo", "Cumple las reglas.", "Justifica cada regla y explica el efecto visual de sus parámetros."],
      ["Acusación", "Señala al culpable.", "Con la cadena completa: hora, presencia, versión y descartes."],
    ], [
      ["Mathematical correctness", "Correct partial sums and sums.", "Distinguishes term, partial sum and series throughout."],
      ["Convergence", "Classifies correctly.", "Justifies it with an argument (comparison, grouping, telescoping, Leibniz)."],
      ["Forensic exhibit", "Obtains the figure (time, ratio, exponent…).", "Explains what it proves and what it does not."],
      ["Creative challenge", "Meets the rules.", "Justifies each rule and explains the visual effect of its parameters."],
      ["Accusation", "Names the culprit.", "With the whole chain: time, presence, version and eliminations."],
    ]), [40, 66, 74]);
  };

  // ---------------------------------------------------------------------- 91 solutions
  /** Worked solutions; numbers that depend on the configuration use tokens. */
  const SOL = {
    "1.1": { es: "$t_n = 60 - 60/(n+1)$: 30, 40, 45, 48, 50, 51.43. $t_{n+1} - t_n = 60/((n+1)(n+2)) > 0$, luego crece, y $t_n < 60$ para todo $n$: acotada.", en: "$t_n = 60 - 60/(n+1)$: 30, 40, 45, 48, 50, 51.43. $t_{n+1} - t_n = 60/((n+1)(n+2)) > 0$, so it increases, and $t_n < 60$ for every $n$: bounded." },
    "1.2": { es: "$t_n < 59 \\iff n < 59$: 58 pitidos. $t_n < 59.9 \\iff n < 599$: 598. Ningún pitido en 60, porque $t_n < 60$ siempre.", en: "$t_n < 59 \\iff n < 59$: 58 beeps. $t_n < 59.9 \\iff n < 599$: 598. No beep at 60, because $t_n < 60$ always." },
    "1.3": { es: "Verdad: hay infinitos pitidos. Falso: que la cuenta no termine. $\\lim t_n = 60$ y todos los pitidos suenan antes: infinitos sucesos caben en un tiempo finito.", en: "True: there are infinitely many beeps. False: that the countdown never ends. $\\lim t_n = 60$ and every beep sounds before it: infinitely many events fit in a finite time." },
    "1.4": { es: "$g_1 = 10$, $g_2 = 5$, $g_3 = 3$, $g_4 = 2$. $\\sum_{n \\le N} g_n = t_{N+1} - t_1 = 30 - 60/(N+2)$, que tiende a 30. Es una suma telescópica: el primer pitido es en 30 s y el límite es 60 s.", en: "$g_1 = 10$, $g_2 = 5$, $g_3 = 3$, $g_4 = 2$. $\\sum_{n \\le N} g_n = t_{N+1} - t_1 = 30 - 60/(N+2)$, which tends to 30. It is a telescoping sum: the first beep is at 30 s and the limit is 60 s." },
    "1.5": { es: "Anillo 10: $6 + 9 \\cdot 4 = 42$. Total: $10(6 + 42)/2 = 240$. Con $n$ anillos: $n(12 + 4(n-1))/2 = 240$, es decir, $n^2 + 2n - 120 = 0$, $n = 10$.", en: "Ring 10: $6 + 9 \\cdot 4 = 42$. Total: $10(6 + 42)/2 = 240$. With $n$ rings: $n(12 + 4(n-1))/2 = 240$, that is, $n^2 + 2n - 120 = 0$, $n = 10$." },
    "1.6": { es: "El último fotograma cuesta {renderLast} s. Duración: {renderFrames} · ({renderFirst} + {renderLast})/2 = {renderSeconds} s = {renderDuration}. Inicio: {renderFinish} − {renderDuration} = {renderStart}. Si todos costaran {renderFirst} s: {renderNaiveStart}. Si todos costaran {renderLast} s: {renderLastStart}.", en: "The last frame costs {renderLast} s. Duration: {renderFrames} · ({renderFirst} + {renderLast})/2 = {renderSeconds} s = {renderDuration}. Start: {renderFinish} − {renderDuration} = {renderStart}. If every frame took {renderFirst} s: {renderNaiveStart}. If every frame took {renderLast} s: {renderLastStart}." },
    "1.7": { es: "$t_n < T/2 \\iff n < c$, así que suenan $\\lceil c \\rceil - 1$ pitidos antes de la mitad. Entre 4 y 8: $c \\in (4, 9]$.", en: "$t_n < T/2 \\iff n < c$, so $\\lceil c \\rceil - 1$ beeps sound before the half. Between 4 and 8: $c \\in (4, 9]$." },
    "2.1": { es: "8, 12.8, 15.68, 17.41, 18.44. $x_n = 8(1 - 0.6^n)/0.4 = 20(1 - 0.6^n)$.", en: "8, 12.8, 15.68, 17.41, 18.44. $x_n = 8(1 - 0.6^n)/0.4 = 20(1 - 0.6^n)$." },
    "2.2": { es: "20 m: como $|0.6| < 1$, $0.6^n \\to 0$ y $x_n \\to 20$.", en: "20 m: since $|0.6| < 1$, $0.6^n \\to 0$ and $x_n \\to 20$." },
    "2.3": { es: "Tramos de 8, 4.8, 2.88… m, a 2 m/s: 4, 2.4, 1.44… s. Distancia $8/(1 - 0.6) = 20$ m; tiempo $4/(1 - 0.6) = 10$ s. Con la velocidad relativa: $8/(2 - 1.2) = 10$ s.", en: "Stretches of 8, 4.8, 2.88… m, at 2 m/s: 4, 2.4, 1.44… s. Distance $8/(1 - 0.6) = 20$ m; time $4/(1 - 0.6) = 10$ s. With the relative speed: $8/(2 - 1.2) = 10$ s." },
    "2.4": { es: "Para $0 \\le r < 1$. Con $r = 1$, $S_n = 8n$: diverge, el hueco no se reduce nunca.", en: "For $0 \\le r < 1$. With $r = 1$, $S_n = 8n$: it diverges, the gap never shrinks." },
    "2.5": { es: "$20 \\cdot 0.6^n < 0.1 \\iff 0.6^n < 0.005$; $0.6^{10} = 0.00605$ y $0.6^{11} = 0.00363$: el anillo 11.", en: "$20 \\cdot 0.6^n < 0.1 \\iff 0.6^n < 0.005$; $0.6^{10} = 0.00605$ and $0.6^{11} = 0.00363$: ring 11." },
    "2.6": { es: "Huecos {leakGaps} m; razones ≈ {leakR}; $a = {leakA}$ y $a/(1-r) = 20$ m. Coherente con la v3: el vídeo es auténtico. La tabla del sobre dice de qué copia sale.", en: "Gaps {leakGaps} m; ratios ≈ {leakR}; $a = {leakA}$ and $a/(1-r) = 20$ m. Consistent with v3: the video is genuine. The table in the envelope says which copy it comes from." },
    "3.1": { es: "En el minuto $k$ recorre 10 m de un pasillo de $100k$ m, y el estiramiento uniforme conserva la fracción. $F_n = H_n/10$: 0.1, 0.15, 0.183, 0.208.", en: "In minute $k$ it covers 10 m of a $100k$ m corridor, and uniform stretching keeps the fraction. $F_n = H_n/10$: 0.1, 0.15, 0.183, 0.208." },
    "3.2": { es: "Que los términos tiendan a 0 es necesario para que la serie converja, pero no suficiente: la armónica diverge.", en: "Terms tending to 0 is necessary for the series to converge, but not sufficient: the harmonic series diverges." },
    "3.3": { es: "$1/3 + 1/4 \\ge 1/2$, $1/5 + \\cdots + 1/8 \\ge 4/8$, etc.: cada bloque suma al menos 1/2, así que $H_{2^k} \\ge 1 + k/2$. Con $k = 18$, $H_{2^{18}} \\ge 10$: la sonda llega.", en: "$1/3 + 1/4 \\ge 1/2$, $1/5 + \\cdots + 1/8 \\ge 4/8$, etc.: each block adds at least 1/2, so $H_{2^k} \\ge 1 + k/2$. With $k = 18$, $H_{2^{18}} \\ge 10$: the probe arrives." },
    "3.4": { es: "Los bloques que empiezan en $2^j$ tienen $2^j$ términos de como mucho $1/2^j$: $H_{2^k - 1} \\le k$. Con $k = 10$, no llega antes del minuto 1024; por Oresme, llega como muy tarde en el 262 144. El minuto 12 367 está entre los dos: 8 días, 14 h y 7 min (8.59 días).", en: "The blocks starting at $2^j$ have $2^j$ terms of at most $1/2^j$: $H_{2^k - 1} \\le k$. With $k = 10$, it cannot arrive before minute 1024; by Oresme, it arrives by minute 262 144 at the latest. Minute 12 367 lies between them: 8 days, 14 h and 7 min (8.59 days)." },
    "3.5": { es: "Falsa: la serie armónica diverge y la biblia fija la llegada en el minuto 12 367. La sonda en la puerta es lo que se espera del final auténtico; la declaración no prueba que el vídeo sea falso. Vera mintió (descubrirán por qué en el interrogatorio).", en: "False: the harmonic series diverges and the bible fixes the arrival at minute 12 367. The probe at the door is what the genuine finale shows; the statement does not prove the video is fake. Vera lied (the interview will show why)." },
    "4.1": { es: "$1/k - 1/(k+1) = (k + 1 - k)/(k(k+1))$. Suma: $1 - 1/7 = 6/7 \\approx 0.8571$.", en: "$1/k - 1/(k+1) = (k + 1 - k)/(k(k+1))$. Sum: $1 - 1/7 = 6/7 \\approx 0.8571$." },
    "4.2": { es: "$S_N = 1 - 1/(N+1) \\to 1$: la coherencia se perdería del todo solo en el límite.", en: "$S_N = 1 - 1/(N+1) \\to 1$: coherence would be lost entirely only in the limit." },
    "4.3": { es: "$1/(N+1) = 0.004$, $N = 249$. Nueve observaciones más que cámaras: alguien observa desde dentro.", en: "$1/(N+1) = 0.004$, $N = 249$. Nine more observations than cameras: someone is watching from inside." },
    "4.4": { es: "$b_k = k$: $\\Delta_k = -1$ y $S_N = 1 - (N+1) = -N$. La serie telescópica converge si y solo si $b_k$ tiene límite.", en: "$b_k = k$: $\\Delta_k = -1$ and $S_N = 1 - (N+1) = -N$. The telescoping series converges if and only if $b_k$ has a limit." },
    "4.5": { es: "Las sesiones suman {journalListed}; $W_N - W_0 = $ {journalTotal}. Como la suma de las diferencias del contador es $W_N - W_0$, falta {journalMissing}. El último guardado ({journalClose}) es posterior a la última sesión listada: la sesión borrada es la última, abierta a las {journalOpen}.", en: "The sessions add up to {journalListed}; $W_N - W_0 = $ {journalTotal}. Since the sum of the counter's differences is $W_N - W_0$, {journalMissing} is missing. The last save ({journalClose}) comes after the last listed session: the deleted session is the last one, opened at {journalOpen}." },
    "5.1": { es: "Sara: 1, 1.5, 1.833, 2.083…: supera 2 en el minuto 4. Irene: 1, 1.25, 1.361, 1.424, 1.464, 1.491.", en: "Sara: 1, 1.5, 1.833, 2.083…: she exceeds 2 in minute 4. Irene: 1, 1.25, 1.361, 1.424, 1.464, 1.491." },
    "5.2": { es: "Su dosis es la serie armónica, que no está acotada (Oresme).", en: "Her dose is the harmonic series, which is unbounded (Oresme)." },
    "5.3": { es: "Para $n \\ge 2$, $1/n^2 < 1/(n(n-1)) = 1/(n-1) - 1/n$. Sumando, $S_n < 1 + 1 - 1/n = 2 - 1/n < 2$.", en: "For $n \\ge 2$, $1/n^2 < 1/(n(n-1)) = 1/(n-1) - 1/n$. Adding, $S_n < 1 + 1 - 1/n = 2 - 1/n < 2$." },
    "5.4": { es: "Si $p \\le 1$, $1/n^p \\ge 1/n$ y diverge. Si $p > 1$, el bloque de $2^j$ términos que empieza en $2^j$ suma como mucho $2^j/2^{jp} = (2^{1-p})^j$: la serie está acotada por $1/(1 - 2^{1-p})$, una geométrica.", en: "If $p \\le 1$, $1/n^p \\ge 1/n$ and it diverges. If $p > 1$, the block of $2^j$ terms starting at $2^j$ adds at most $2^j/2^{jp} = (2^{1-p})^j$: the series is bounded by $1/(1 - 2^{1-p})$, a geometric one." },
    "5.5": { es: "No: $S_{10} = 1.995$ y $S_{11} = 2.023$. Converge, pero su suma (≈ 2.61) pasa de 2. La cota de condensación, 3.41, no garantizaba nada.", en: "No: $S_{10} = 1.995$ and $S_{11} = 2.023$. It converges, but its sum (≈ 2.61) exceeds 2. The condensation bound, 3.41, guaranteed nothing." },
    "5.6": { es: "$1 + 1/2^p = 1.354$, $2^p \\approx 2.83 = 2\\sqrt{2}$, $p = 1.5$; las demás lecturas lo confirman. Las biblias v1 y v3 tienen $p = 2$ (se leería 1.25 en el minuto 2): el plano se rehízo con otra versión.", en: "$1 + 1/2^p = 1.354$, $2^p \\approx 2.83 = 2\\sqrt{2}$, $p = 1.5$; the other readings confirm it. Bibles v1 and v3 have $p = 2$ (minute 2 would read 1.25): the shot was remade from another version." },
    "6.1": { es: "12, 6, 10, 7, 9.4, 7.4, 9.11, 7.61.", en: "12, 6, 10, 7, 9.4, 7.4, 9.11, 7.61." },
    "6.2": { es: "$P_n = 12 H_n$; tras 10 oscilaciones, 35.15 m. No tiene límite: la armónica diverge.", en: "$P_n = 12 H_n$; after 10 swings, 35.15 m. It has no limit: the harmonic series diverges." },
    "6.3": { es: "$S_{2n+2} - S_{2n} = 12/(2n+1) - 12/(2n+2) > 0$: las pares crecen; las impares decrecen; $S_{2n+1} - S_{2n} = 12/(2n+1) \\to 0$. Las dos subsucesiones encierran un único límite, que queda entre dos posiciones consecutivas cualesquiera.", en: "$S_{2n+2} - S_{2n} = 12/(2n+1) - 12/(2n+2) > 0$: even positions increase; odd ones decrease; $S_{2n+1} - S_{2n} = 12/(2n+1) \\to 0$. Both subsequences trap a single limit, which lies between any two consecutive positions." },
    "6.4": { es: "Entre $S_{10} = 7.75$ y $S_{11} = 8.84$. Error $\\le 12/(n+1) \\le 0.5$ si $n \\ge 23$.", en: "Between $S_{10} = 7.75$ and $S_{11} = 8.84$. Error $\\le 12/(n+1) \\le 0.5$ when $n \\ge 23$." },
    "6.5": { es: "Con $12/k$, condicionalmente (el camino diverge). Con $12/k^2$, absolutamente.", en: "With $12/k$, conditionally (the path diverges). With $12/k^2$, absolutely." },
    "6.6": { es: "$L = 11.75/0.7833 = 9.25/0.6167 = \\cdots = 15$. Se asienta entre 9.68 y 11.18 m (valor conocido $15 \\ln 2 \\approx 10.4$), no en la hornacina de 8.3 m. Es el pasillo de 25 m de las versiones v1 y v2.", en: "$L = 11.75/0.7833 = 9.25/0.6167 = \\cdots = 15$. It settles between 9.68 and 11.18 m (known value $15 \\ln 2 \\approx 10.4$), not in the 8.3 m alcove. It is the 25 m corridor of versions v1 and v2." },
  };
  DOCS.SOL = SOL;

  R.solutions = function (w, X) {
    const { t, SF } = X;
    w.title(t("Solucionario matemático", "Mathematical solutions"), kicker(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.paragraph(t("Soluciones de todos los ejercicios, con los valores de esta generación. Los razonamientos de convergencia son los del capítulo: comparación, agrupación, telescopía y criterio de Leibniz. Ninguno necesita derivadas ni integrales.", "Solutions to every exercise, with this generation's values. Convergence arguments are the chapter's: comparison, grouping, telescoping and the alternating series test. None of them needs derivatives or integrals."), { italic: true });
    SF.dossiers.forEach((D) => {
      const ep = SF.show.episodes.find((e) => e.id === D.episode);
      w.heading(`${t("Episodio", "Episode")} ${D.episode} · ${X.L(ep.title)}`);
      D.exercises.forEach((ex) => {
        w.ensure(18);
        w.paragraph(`**${ex.id}** (${X.L(SF.levels[ex.level])}${ex.evidence ? t(", prueba forense", ", forensic") : ""})`, { gap: 0.5, sans: true, size: 9.5 });
        w.paragraph(X.L(SOL[ex.id]), { gap: 2.5 });
      });
      w.sub(t("Desafío creativo: criterios", "Creative challenge: criteria"));
      w.paragraph(X.L(CHALLENGE_KEYS[D.family]));
    });
  };
  const CHALLENGE_KEYS = {
    countdown: { es: "S0: forma R con $c \\in (4, 9]$ o forma G con $q \\in (0.841, 0.9]$. S1: 14 redes posibles, por ejemplo $(a, d, n) = (6, 4, 10), (9, 2, 12), (35, 2, 6), (9, 1, 15)$. Se valora que comprueben la suma con la fórmula y que relacionen los parámetros con el ritmo de los pitidos y el aspecto de los anillos.", en: "S0: form R with $c \\in (4, 9]$ or form G with $q \\in (0.841, 0.9]$. S1: 14 possible networks, for instance $(a, d, n) = (6, 4, 10), (9, 2, 12), (35, 2, 6), (9, 1, 15)$. Credit checking the sum with the formula and linking the parameters to the beep rhythm and the look of the rings." },
    geometric: { es: "$r \\in [0.55, 0.80]$ con $a = 20(1 - r)$. Con $r$ cerca de 0.55 los anillos se apiñan pronto; cerca de 0.8, tarde. Un equipo que proponga $r \\ge 1$ debe ver por qué la escena no termina.", en: "$r \\in [0.55, 0.80]$ with $a = 20(1 - r)$. With $r$ near 0.55 the rings crowd early; near 0.8, late. A team proposing $r \\ge 1$ should see why the scene never ends." },
    harmonic: { es: "$m = L/c \\in [6, 7.5]$. Cotas: no llega antes del minuto $2^{\\lfloor m \\rfloor}$ y llega como muy tarde en el $2^{\\lceil 2(m-1) \\rceil}$. Llegadas calculadas: 227 ($m = 6$), 616 ($m = 7$), 1015 ($m = 7.5$).", en: "$m = L/c \\in [6, 7.5]$. Bounds: it cannot arrive before minute $2^{\\lfloor m \\rfloor}$ and arrives by minute $2^{\\lceil 2(m-1) \\rceil}$ at the latest. Computed arrivals: 227 ($m = 6$), 616 ($m = 7$), 1015 ($m = 7.5$)." },
    telescoping: { es: "$b_k = A/(k+m)$ con $m \\le 1.25$ y $A/(1+m) \\in [0.5, 2]$, o $b_k = Aq^{k-1}$ con $q \\le 0.836$ y $A \\in [0.5, 2]$. La suma es $b_1$ porque $b_k \\to 0$.", en: "$b_k = A/(k+m)$ with $m \\le 1.25$ and $A/(1+m) \\in [0.5, 2]$, or $b_k = Aq^{k-1}$ with $q \\le 0.836$ and $A \\in [0.5, 2]$. The sum is $b_1$ because $b_k \\to 0$." },
    pseries: { es: "Sara: cualquier $p_S$ con cruce antes del minuto 10 (por ejemplo $p_S = 1$ con $D = 1$, o $p_S = 0.9$ con $D = 0.8$). Irene: hace falta demostrar la cota; valen $p_I \\ge 2$ con $D \\le 1$ (telescópica), la cota de condensación o una suma parcial más la cola. Si solo hay simulación, la propuesta no se acepta.", en: "Sara: any $p_S$ crossing by minute 10 (for instance $p_S = 1$ with $D = 1$, or $p_S = 0.9$ with $D = 0.8$). Irene: the bound must be proved; $p_I \\ge 2$ with $D \\le 1$ (telescoping), the condensation bound or a partial sum plus the tail all work. A simulation alone is not accepted." },
    alternating: { es: "$s \\le 1$ (camino infinito), $L \\le 14$ y dos posiciones consecutivas dentro de [6, 10]. Por ejemplo $L = 12$, $s = 1$ (entre 8.17 y 8.46 tras 40 oscilaciones) o $L = 13$, $s = 0.8$.", en: "$s \\le 1$ (infinite path), $L \\le 14$ and two consecutive positions inside [6, 10]. For instance $L = 12$, $s = 1$ (between 8.17 and 8.46 after 40 swings) or $L = 13$, $s = 0.8$." },
  };

  // ---------------------------------------------------------------------- 92 resolution
  R.resolution = function (w, X) {
    const { t, SF } = X, S = SF.solution;
    w.title(t("Resolución del caso", "Resolution of the case"), kicker(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.callout(t("Elías Brandt, el asesor matemático, filtró el final y manipuló el proyecto del tráiler para que la culpa cayera sobre Álex Soler.", "Elías Brandt, the mathematics adviser, leaked the finale and tampered with the trailer project so that the blame would fall on Álex Soler."), "warn", { sans: true });
    w.heading(t("Lo que ocurrió", "What happened"));
    w.table([t("Hora", "Time"), t("Hecho", "Event")], X.truthTimeline(), [26, 154], { zebra: true, tight: true });
    w.heading(t("Por qué y cómo", "Why and how"));
    w.paragraph(X.L(S.motive));
    w.paragraph(X.L(S.mistake));
    w.heading(t("La cadena de deducción", "The chain of deduction"));
    S.chain.forEach((c) => { w.ensure(18); w.paragraph(`**${c.step}. ${X.L(c.title)}**${c.team ? ` (${t("equipo", "team")} ${c.team})` : ""}. ${X.L(c.text)}`); });
    w.heading(t("Por qué se descarta a los demás", "Why the others are ruled out"));
    w.table([t("Sospechoso", "Suspect"), t("Descarte", "Ruled out because")], Object.keys(S.eliminations).map((id) => [nameOf(X, id), X.L(S.eliminations[id])]), [30, 150]);
    w.heading(t("Matriz de evidencias", "Evidence matrix"));
    const U = X.unique;
    w.table([t("Sospechoso", "Suspect"), t("En P3 a las {journalOpen} y {journalClose}", "On F3 at {journalOpen} and {journalClose}").replace("{journalOpen}", X.C.tokens.journalOpen).replace("{journalClose}", X.C.tokens.journalClose), t("Tenía la v2", "Had v2"), t("Conocía las marcas", "Knew the watermarks"), t("Resultado", "Result")],
      ["vera", "hugo", "nadia", "elias", "alex"].map((id) => [nameOf(X, id), U.opportunity.includes(id) ? "✓" : "—", U.version.includes(id) ? "✓" : "—", ["vera", "elias"].includes(id) ? "✓" : "—", U.culprits.includes(id) ? t("CULPABLE", "CULPRIT") : t("descartado", "ruled out")]), [34, 46, 26, 34, 40]);
    w.paragraph(t("La trampa didáctica: si se supone que todos los fotogramas cuestan lo mismo, el render empieza a las {renderNaiveStart}, cuando Hugo estaba en la planta 3. La prueba de versión (Hugo no tenía la v2) y el diario (sesión abierta a las {journalOpen}) obligan a revisar el cálculo.", "The didactic trap: assuming every frame costs the same puts the start of the render at {renderNaiveStart}, when Hugo was on floor 3. The version evidence (Hugo did not have v2) and the journal (session opened at {journalOpen}) force a revision of the calculation.").replace(/\{(\w+)\}/g, (m, k) => X.C.tokens[k] || m), { italic: true });
    w.heading(t("El final de ZENO (para cerrar el caso)", "The ZENO finale (to close the case)"));
    w.paragraph(X.L(SF.finale.synopsis));
    w.paragraph(X.L(SF.finale.whyFair), { italic: true });
  };

  // ---------------------------------------------------------------------- 93 interview control
  R.control = function (w, X) {
    const { t, SF } = X;
    w.title(t("Control de interrogatorios y entrega de pruebas", "Interview and evidence control"), kicker(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.paragraph(t("Una hoja para tener a mano durante la segunda jornada: qué debe revelar cada sospechoso y cuándo, y qué cálculo refuta cada mentira del culpable. Si un sospechoso se sale de su ficha, intervenga desde su papel: «Esta unidad no acepta horas que no estén en un documento».", "A sheet to keep at hand during the second session: what each suspect must reveal and when, and which calculation refutes each of the culprit's lies. If a suspect strays from the card, step in from your role: “This unit does not accept times that are not in a document.”"), { italic: true });
    ["vera", "hugo", "nadia", "alex", "elias"].forEach((id) => {
      const c = SF.cards[id];
      w.heading(nameOf(X, id));
      w.bullets(X.L(c.reveal));
      if (c.lies) {
        w.sub(t("Mentiras del culpable y su refutación", "The culprit's lies and their refutation"));
        w.table([t("Mentira", "Lie"), t("La refuta", "Refuted by")], [
          [t("«Me fui a las 22:05».", "“I left at 22:05.”"), t(`Render iniciado a las ${X.C.tokens.renderStart} (equipo 1) y sesión abierta a las ${X.C.tokens.journalOpen} (equipo 4); nadie más pudo estar en P3.`, `Render started at ${X.C.tokens.renderStart} (team 1) and session opened at ${X.C.tokens.journalOpen} (team 4); nobody else could be on F3.`)],
          [t("«El render dura unos 45 minutos».", "“The render takes about 45 minutes.”"), t(`Suma aritmética: ${X.C.render.duration.es}.`, `Arithmetic sum: ${X.C.render.duration.en}.`)],
          [t("«S5 y S6 usan los valores de la v3».", "“S5 and S6 use the v3 values.”"), t("Exponente 1.5 (equipo 5) y amplitud 15 (equipo 6): la v2.", "Exponent 1.5 (team 5) and amplitude 15 (team 6): v2.")],
          [t("«El programa fusiona sesiones».", "“The program merges sessions.”"), t("El manual del diario dice lo contrario (sobre).", "The journal manual says otherwise (envelope).")],
        ], [60, 120]);
      }
    });
    w.heading(t("La ronda de interrogatorios", "The round of interviews"));
    w.bullets(t([
      "Los cinco sospechosos se sientan al frente. Hay tres rondas de unos cinco minutos; en cada una, cada grupo hace una pregunta al sospechoso que elija, en voz alta para toda la clase.",
      "El sobre (30) se abre antes, al terminar la puesta en común: los grupos llegan a los interrogatorios con los registros de acceso y las versiones de la biblia.",
      "Los recibos y registros de las fichas solo los enseña cada sospechoso, cuando su ficha lo permite.",
      "Si la clase se atasca en la versión de la biblia, sugiera preguntar a Nadia por las versiones; si se atasca en la hora, a Álex por el render.",
    ], [
      "The five suspects sit at the front. There are three rounds of about five minutes; in each, every group asks one question of the suspect it chooses, aloud for the whole class.",
      "The envelope (30) is opened before, at the end of the pooling: the groups reach the interviews with the access records and the versions of the bible.",
      "The receipts and logs on the cards are shown only by each suspect, when the card allows it.",
      "If the class gets stuck on the version of the bible, suggest asking Nadia about the versions; if it gets stuck on the time, Álex about the render.",
    ]));
  };
})(typeof window !== "undefined" ? window : globalThis);
