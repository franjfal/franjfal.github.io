/*
 * Calculus Cases · Case 4 · The Vektor Calculator — data, documents and page (shared kit).
 *
 * A calculator stolen from Argen Labs approximated e^x with a Taylor polynomial; a device found at
 * Vektor Mechanical gives readings that match one more term. Teams of three specialists (archive A,
 * inspection B, validation C) each hold one sheet; they pool at home and close the case in class
 * with the term strips and the technical opinion (sheet D, one per team).
 *
 * Everything that depends on the configuration (the tested inputs, the two names) comes from
 * model(cfg): values, readings, errors, differences, the second rule and the bounds. The defaults
 * are the book's (inputs −1, 0.5 and 1; tolerance 0.012).
 */
(function (root) {
  "use strict";

  // ------------------------------------------------------------------------ the mathematics
  const TOL = 0.012;
  /** Pre-validated sets of tested inputs; "A" is the book's. */
  const INPUTS = { A: [-1, 0.5, 1], B: [-0.8, 0.5, 0.9], C: [-1, 0.25, 0.75] };
  const FACT = [1, 1, 2, 6, 24, 120];
  const TERMS = ["1", "x", "x^2/2", "x^3/6", "x^4/24"];
  const r6 = (v) => Math.round(v * 1e6) / 1e6;
  /** Number with d decimals, decimal point, true minus sign. */
  const fmt = (v, d = 6) => { const s = (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d); return s.replace("-", "−"); };
  /** An input as it is printed: −1, 0.5, 0.25… */
  const fx = (x) => String(x).replace("-", "−");
  /** An input in TeX: -1, 0.5… */
  const tx = (x) => String(x).replace("-", "−");
  /** The factor (x − a) in TeX: (x + 1), (x - 0.5)… */
  const factor = (a) => (a < 0 ? `(x + ${-a})` : `(x - ${a})`);

  function model(key) {
    const xs = (INPUTS[key] || INPUTS.A).slice().sort((a, b) => a - b);
    const rows = xs.map((x) => {
      const terms = FACT.slice(0, 5).map((f, k) => Math.pow(x, k) / f);
      const sums = terms.map((_, k) => terms.slice(0, k + 1).reduce((s, v) => s + v, 0));
      const ref = r6(Math.exp(x)), p3 = r6(sums[3]), q4 = sums[4];
      const reading = q4.toFixed(5), rd = Number(reading);
      const diff = r6(rd - p3);
      return {
        x, terms, sums, ref, p3, q4, reading, rd, diff,
        errA: r6(Math.abs(ref - p3)), errV: r6(Math.abs(ref - rd)), errQ: r6(Math.abs(Math.exp(x) - q4)),
        ratio: [3, 4, 5].map((k) => diff / Math.pow(x, k)),
        boundP3: Math.E * Math.pow(Math.abs(x), 4) / 24, boundQ4: Math.E * Math.pow(Math.abs(x), 5) / 120,
      };
    });
    rows.forEach((r) => { r.passA = r.errA <= TOL; r.passV = r.errV <= TOL; });
    const order = rows.slice().sort((a, b) => b.x - a.x);   // the strips: largest input first
    const prod = xs.reduce((p, a) => p * (0 - a), 1);
    return {
      key, xs, rows, order, tol: TOL,
      failA: rows.filter((r) => !r.passA), allV: rows.every((r) => r.passV),
      valid: rows.some((r) => !r.passA) && rows.every((r) => r.passV) && xs.every((x) => Math.abs(x) <= 1),
      factors: xs.map(factor).join(""), R0: 1 + prod,
      bound4: Math.E / 120, bound5: Math.E / 720,
    };
  }

  // ------------------------------------------------------------------------ the class
  const ROLES = ["A", "B", "C"];
  /** Teams of three specialists; a remainder of one or two makes teams of four (inspection doubled, then archive). */
  function teams(students) {
    const n = Math.max(6, students), T = Math.floor(n / 3), extra = n % 3;
    const list = Array.from({ length: T }, (_, k) => ({ index: k, A: 1, B: 1, C: 1 }));
    ["B", "A"].slice(0, extra).forEach((role, k) => { list[k][role] += 1; });
    list.forEach((g) => { g.size = g.A + g.B + g.C; });
    return list;
  }

  const clean = (v, d) => { const s = String(v == null ? "" : v).replace(/[<>$*_\\{}]/g, "").trim().slice(0, 40); return s || d; };

  // ------------------------------------------------------------------------ helpers
  const kick = (X, sheet) => X.t(`Expediente · La calculadora de Vektor${sheet ? ` · ${sheet}` : ""}`, `Case file · The Vektor Calculator${sheet ? ` · ${sheet}` : ""}`);
  const xsRow = (M) => M.xs.map((x) => `$x = ${tx(x)}$`);
  const roleName = (t, r) => ({ A: t("Archivo", "Archive"), B: t("Inspección", "Inspection"), C: t("Validación", "Validation") })[r];
  const roleList = (g, t) => ROLES.map((r) => (g[r] > 1 ? `${r} ×${g[r]}` : r)).join(" · ");
  /** Writing lines shared out among several prompts down to the foot of the page. */
  function prompts(w, items, opts = {}) {
    const gap = opts.gap || 8;
    items.forEach((p, k) => {
      const left = items.length - k;
      w.sub(p, 14);
      const room = w.room() - (left - 1) * 16;
      w.lines(Math.max(opts.min || 2, Math.floor(room / left / gap) - 1), gap);
    });
  }
  /** A labelled answer line: "label ________". */
  function answerLine(w, label, width) {
    const { doc, CC } = w, m = w.margin;
    w.ensure(12);
    const h = w.rich(label, { x: m, y: w.y + 5, width: width || 70, size: 11, lineH: 5.2 }).height;
    doc.setDrawColor(...CC.grid).setLineWidth(0.25).line(m + (width || 70) + 2, w.y + 6, w.pw() - m, w.y + 6);
    w.y += Math.max(h, 5) + 6;
  }

  // ------------------------------------------------------------------------ 10 · sheet A
  function sheetA(w, X) {
    const { t, M, N } = X;
    w.title(t("Hoja A · El archivo de Argen", "Sheet A · The Argen archive"), kick(X, t("Hoja A", "Sheet A")), t("RESERVADO", "RESTRICTED"));
    w.meta([[t("Especialista", "Specialist"), t("Archivo (A)", "Archive (A)")], [t("Nombre y equipo", "Name and team"), ""]]);
    w.paragraph(t(
      `Eres la persona del equipo que tiene la única copia de la nota de diseño que Argen Labs entregó a la policía después del robo. Tus compañeros no la tienen. No se la enseñes: cuando te pregunten qué dice, cuéntaselo de viva voz o por mensaje.`,
      `You are the member of the team who holds the only copy of the design note that Argen Labs gave the police after the break-in. Your teammates do not have it. Do not show it to them: when they ask what it says, tell them aloud or by message.`));
    w.callout(t(
      `**Argen Labs · Nota de diseño de la calculadora AE-3.** «La AE-3 estima $e^x$ para valores de $x$ próximos a 0. Su mecanismo suma un polinomio de grado tres cuyo valor y cuyas tres primeras derivadas en $x = 0$ coinciden con los de $e^x$. No lleva ninguna corrección de orden superior: la precisión de la máquina es la de ese polinomio.» Firmado: ${N.argen}, ingeniera jefa.`,
      `**Argen Labs · Design note of the AE-3 calculator.** “The AE-3 estimates $e^x$ for values of $x$ near 0. Its mechanism adds up a polynomial of degree three whose value and first three derivatives at $x = 0$ agree with those of $e^x$. It carries no higher-order correction: the machine is exactly as accurate as that polynomial.” Signed: ${N.argen}, chief engineer.`), "blue");
    w.heading(t("1. Reconstruye el polinomio de Argen", "1. Rebuild Argen's polynomial"));
    w.paragraph(t(
      "Escribe una cúbica general $p(x) = a_0 + a_1x + a_2x^2 + a_3x^3$. Calcula su valor y sus tres primeras derivadas en $x = 0$, calcula los de $e^x$ e iguálalos. Hazlo derivando, no de memoria.",
      "Write a general cubic $p(x) = a_0 + a_1x + a_2x^2 + a_3x^3$. Work out its value and first three derivatives at $x = 0$, work out those of $e^x$, and set them equal. Do it by differentiating, not from memory."));
    w.table([t("En $x = 0$", "At $x = 0$"), t("La cúbica $p$", "The cubic $p$"), "$e^x$", t("Por tanto", "Therefore")],
      [["$p(0)$", "", "", "$a_0 =$"], ["$p'(0)$", "", "", "$a_1 =$"], ["$p''(0)$", "", "", "$a_2 =$"], ["$p'''(0)$", "", "", "$a_3 =$"]], [22, 50, 38, 46], { minRow: 11, boldFirst: true });
    answerLine(w, t("El polinomio de la AE-3: $P_3(x) =$", "The AE-3 polynomial: $P_3(x) =$"), 62);
    w.heading(t("2. Las salidas de la AE-3", "2. The outputs of the AE-3"), { keep: 34 });
    w.paragraph(t("La policía va a probar las máquinas en tres entradas. Calcula lo que daría la AE-3, con seis decimales.", "The police will test the machines at three inputs. Work out what the AE-3 would give, to six decimals."));
    w.table(["$x$", ...M.xs.map((x) => `$${tx(x)}$`)], [[t("$P_3(x)$ (salida de Argen)", "$P_3(x)$ (Argen's output)"), "", "", ""]], [52, 36, 36, 36], { minRow: 13, boldFirst: true });
    w.heading(t("3. Antes de hablar con tu equipo", "3. Before you talk to your team"), { keep: 40 });
    prompts(w, [
      t("¿Qué tiene que decirte otro especialista para saber si la AE-3 es buena? ¿A quién se lo preguntarás?", "What must another specialist tell you to know whether the AE-3 is any good? Whom will you ask?"),
      t("¿Qué darás tú a cada uno de tus compañeros, y para qué lo necesitan?", "What will you give each of your teammates, and what do they need it for?"),
      t("Cuando el equipo haya juntado sus datos: ¿cumple la AE-3 lo que promete su nota de diseño?", "Once the team has pooled its data: does the AE-3 live up to its design note?"),
    ]);
  }

  // ------------------------------------------------------------------------ 11 · sheet B
  function sheetB(w, X) {
    const { t, M, N } = X;
    w.title(t("Hoja B · El aparato incautado", "Sheet B · The seized device"), kick(X, t("Hoja B", "Sheet B")), t("RESERVADO", "RESTRICTED"));
    w.meta([[t("Especialista", "Specialist"), t("Inspección (B)", "Inspection (B)")], [t("Nombre y equipo", "Name and team"), ""]]);
    w.paragraph(t(
      `Eres la persona del equipo que inspeccionó el aparato encontrado en Vektor Mecánica. Su director técnico, ${N.vektor}, asegura que es diseño propio. El laboratorio no tiene ningún plano autentificado de su mecanismo: solo sabes lo que muestra su pantalla. No enseñes esta hoja; cuenta lo que dice cuando te lo pregunten.`,
      `You are the member of the team who inspected the device found at Vektor Mechanical. Its technical director, ${N.vektor}, says it is Vektor's own design. The laboratory has no authenticated drawing of its mechanism: all you know is what its display shows. Do not show this sheet; say what it contains when you are asked.`));
    w.sub(t("Acta de prueba del aparato incautado", "Test record of the seized device"));
    w.table(["$x$", ...M.xs.map((x) => `$${tx(x)}$`)], [[t("Lectura (5 decimales)", "Reading (5 decimals)"), ...M.rows.map((r) => r.reading)]], [60, 36, 36, 36], { minRow: 9, boldFirst: true, fill: (row, i) => (i ? [255, 255, 255] : null) });
    w.heading(t("1. ¿Qué comparación te diría más?", "1. Which comparison would tell you most?"), { keep: 30 });
    w.paragraph(t("Unas lecturas solas no dicen nada: hay que compararlas con algo. Decide con qué, y a cuál de tus compañeros se lo pedirás.", "Readings on their own say nothing: they must be compared with something. Decide with what, and which teammate you will ask for it."), { gap: 1 });
    w.lines(3, 8);
    w.heading(t("2. Diferencias con la máquina de Argen", "2. Differences from Argen's machine"), { keep: 40 });
    w.paragraph(t("Cuando tengas las salidas de la AE-3, calcula $d(x) = \\text{lectura} - P_3(x)$ en cada entrada.", "Once you have the outputs of the AE-3, work out $d(x) = \\text{reading} - P_3(x)$ at each input."));
    w.table(["$x$", ...M.xs.map((x) => `$${tx(x)}$`)], [
      [t("Lectura del aparato", "Device reading"), ...M.rows.map((r) => r.reading)],
      [t("Salida de Argen $P_3(x)$", "Argen's output $P_3(x)$"), "", "", ""],
      [t("Diferencia $d(x)$", "Difference $d(x)$"), "", "", ""],
    ], [52, 36, 36, 36], { minRow: 11, boldFirst: true });
    w.heading(t("3. Una corrección compatible con las lecturas", "3. A correction that fits the readings"), { keep: 44 });
    w.paragraph(t(
      "Supón que el aparato suma lo mismo que la AE-3 y un término más, $cx^k$. Entonces $d(x) = cx^k$ y el cociente $d(x)/x^k$ vale lo mismo, $c$, en las tres entradas. Busca el exponente $k$ con el que eso ocurre.",
      "Suppose the device adds the same as the AE-3 plus one more term, $cx^k$. Then $d(x) = cx^k$, and the quotient $d(x)/x^k$ takes the same value, $c$, at all three inputs. Find the exponent $k$ for which that happens."));
    w.table([t("Cociente", "Quotient"), ...M.xs.map((x) => `$x = ${tx(x)}$`)], [["$d(x)/x^3$", "", "", ""], ["$d(x)/x^4$", "", "", ""], ["$d(x)/x^5$", "", "", ""]], [52, 36, 36, 36], { minRow: 10, boldFirst: true });
    answerLine(w, t("Corrección propuesta: $cx^k$ con", "Proposed correction: $cx^k$ with"), 64);
    w.paragraph(t("¿Reconoces el número $c$? Compáralo con los coeficientes que ha obtenido el archivo.", "Do you recognise the number $c$? Compare it with the coefficients the archive has found."), { size: 9.5, italic: true });
    w.heading(t("4. ¿Identifica eso el mecanismo?", "4. Does that identify the mechanism?"), { keep: 30 });
    w.paragraph(t("¿Podría una regla distinta dar exactamente las mismas tres lecturas? Justifica tu respuesta.", "Could a different rule give exactly the same three readings? Justify your answer."), { gap: 1 });
    w.lines("fill", 8);
  }

  // ------------------------------------------------------------------------ 12 · sheet C
  function sheetC(w, X) {
    const { t, M } = X;
    w.title(t("Hoja C · Validación", "Sheet C · Validation"), kick(X, t("Hoja C", "Sheet C")), t("RESERVADO", "RESTRICTED"));
    w.meta([[t("Especialista", "Specialist"), t("Validación (C)", "Validation (C)")], [t("Nombre y equipo", "Name and team"), ""]]);
    w.paragraph(t(
      "Eres la persona del equipo que habla en nombre del laboratorio de metrología. Tienes los valores de referencia y la regla con la que se acepta o se rechaza una máquina. Ninguno de tus compañeros los tiene. No enseñes esta hoja; pídeles sus datos antes de decidir.",
      "You are the member of the team who speaks for the metrology laboratory. You hold the reference values and the rule by which a machine is accepted or rejected. None of your teammates has them. Do not show this sheet; ask them for their data before you decide."));
    w.sub(t("Valores de referencia del laboratorio", "The laboratory's reference values"));
    w.table(["$x$", ...M.xs.map((x) => `$${tx(x)}$`)], [[t("$e^x$ (6 decimales)", "$e^x$ (6 decimals)"), ...M.rows.map((r) => fmt(r.ref))]], [52, 36, 36, 36], { minRow: 9, boldFirst: true });
    w.callout(t(
      `**Regla de aceptación.** En esta prueba, una máquina se acepta si su error absoluto, $|e^x - \\text{salida}|$, no supera $${M.tol}$ en ninguna de las tres entradas. La regla solo dice lo que pasa en esas tres entradas: no garantiza nada en las demás.`,
      `**Acceptance rule.** In this test, a machine is accepted if its absolute error, $|e^x - \\text{output}|$, is at most $${M.tol}$ at each of the three inputs. The rule only says what happens at those three inputs: it guarantees nothing at any other.`), "blue");
    w.heading(t("1. Errores absolutos", "1. Absolute errors"));
    w.paragraph(t("Pide al archivo las salidas de la AE-3 y a inspección las lecturas del aparato. Calcula los errores y aplica la regla a cada prueba.", "Ask the archive for the outputs of the AE-3 and inspection for the device's readings. Work out the errors and apply the rule to each test."));
    w.table(["", ...M.xs.map((x) => `$x = ${tx(x)}$`)], [
      [t("Salida de Argen $P_3(x)$", "Argen's output $P_3(x)$"), "", "", ""],
      [t("Error de Argen", "Argen's error"), "", "", ""],
      [t("¿Se acepta? (sí / no)", "Accepted? (yes / no)"), "", "", ""],
      [t("Lectura del aparato", "Device reading"), "", "", ""],
      [t("Error del aparato", "Device's error"), "", "", ""],
      [t("¿Se acepta? (sí / no)", "Accepted? (yes / no)"), "", "", ""],
    ], [52, 36, 36, 36], { fillRows: [10, 13], boldFirst: true, fill: (row, i) => (/Error|error/.test(row[0]) && i ? CCPdfTint() : null) });
    w.heading(t("2. El veredicto de las pruebas", "2. The verdict of the tests"), { keep: 34 });
    prompts(w, [
      t("¿Qué máquina supera la prueba? ¿Te sorprende el resultado?", "Which machine passes the test? Does the result surprise you?"),
      t("¿Qué alcance tiene tu certificación: las tres entradas ensayadas o todo el intervalo [−1, 1]? ¿Qué haría falta para certificar el intervalo entero?", "What does your certification cover: the three tested inputs or the whole interval [−1, 1]? What would it take to certify the whole interval?"),
    ]);
  }
  const CCPdfTint = () => [246, 249, 251];

  // ------------------------------------------------------------------------ 20 · sheet D
  function sheetD(w, X) {
    const { t, M } = X;
    const xo = M.order;   // largest input first
    w.title(t("Hoja D · Las tiras y el dictamen", "Sheet D · The strips and the opinion"), kick(X, t("Hoja D", "Sheet D")), t("RESERVADO", "RESTRICTED"));
    w.meta([[t("Equipo", "Team"), ""], [t("Especialistas", "Specialists"), ""]]);
    w.paragraph(t(
      "Las dos máquinas suman términos uno detrás de otro. Cada una de las cinco tiras de la página siguiente es un término: las cuatro primeras son la AE-3 de Argen; la quinta es la que vuestro equipo ha buscado en las lecturas del aparato de Vektor. Recortadlas por la línea discontinua y trabajad con ellas encima de la mesa.",
      "Both machines add up terms one after another. Each of the five strips on the next page is one term: the first four are Argen's AE-3; the fifth is the one your team has been looking for in the readings of the Vektor device. Cut them out along the dashed line and work with them on the table."));
    w.bullets([
      t(`En $x = ${tx(xo[0].x)}$, escribid en cada tira lo que aporta, con su signo. Colocad las tiras en orden; antes de añadir cada una, que cada uno de vosotros prediga la nueva suma, y anotad después la suma en la tabla.`, `At $x = ${tx(xo[0].x)}$, write on each strip what it contributes, with its sign. Lay the strips down in order; before each one is added, every one of you predicts the new sum, and then write the sum in the table.`),
      t("Con cuatro tiras tenéis la AE-3. Añadid la quinta y comparad la suma con la lectura del aparato.", "With four strips you have the AE-3. Add the fifth and compare the sum with the device's reading."),
      t(`Repetid en $x = ${tx(xo[1].x)}$ y en $x = ${tx(xo[2].x)}$. Con una entrada negativa, dad la vuelta a las tiras que restan: que el signo se vea.`, `Repeat at $x = ${tx(xo[1].x)}$ and at $x = ${tx(xo[2].x)}$. With a negative input, turn over the strips that subtract: let the sign show.`),
    ], true);
    w.paragraph(t("En la tabla, cada columna «En $x = …$» recoge lo que aporta cada tira, y la columna «Suma» lo que suman las tiras colocadas hasta ese momento.", "In the table, each column “At $x = …$” records what each strip adds, and the column “Sum” what the strips laid down so far add up to."), { size: 9.5, italic: true });
    const head = [t("Tiras", "Strips"), t("Término", "Term")];
    xo.forEach((r) => { head.push(t(`En $x = ${tx(r.x)}$`, `At $x = ${tx(r.x)}$`), t("Suma", "Sum")); });
    const body = TERMS.map((term, k) => [String(k + 1), `$${term}$`, ...(k === 0 ? ["1", "1", "1", "1", "1", "1"] : ["", "", "", "", "", ""])]);
    body.push([t("Ref.", "Ref."), "$e^x$", "", "", "", "", "", ""]);
    w.table(head, body, [11, 15, 25, 22, 25, 22, 25, 22], { fillRows: [9, 12], reserve: 34, boldFirst: true, hand: (row, i) => row[0] === "1" && i >= 2 });
    w.sub(t("¿Qué gana cada tira? ¿En qué entrada importa más la quinta, y por qué?", "What does each strip gain? At which input does the fifth matter most, and why?"), 10);
    w.lines("fill", 8);

    // ---- page 2: the strips, to be cut out
    w.page();
    const { doc, CC } = w, m = w.margin, W = w.W();
    w.sub(t("Las cinco tiras", "The five strips"), 10);
    const gap = 5, top = w.y, avail = w.ph() - 18 - top - 2, h = Math.min(46, (avail - 4 * gap) / 5);
    TERMS.forEach((term, k) => {
      const y = top + k * (h + gap);
      doc.setLineDashPattern([2.2, 1.6], 0).setDrawColor(...CC.muted).setLineWidth(0.3).rect(m, y, W, h);
      doc.setLineDashPattern([], 0);
      // the term
      doc.setFillColor(...(k === 4 ? [250, 245, 238] : [242, 246, 249])).rect(m + 0.6, y + 0.6, 44, h - 1.2, "F");
      doc.setFont("SFSans", "bold").setFontSize(8.5).setTextColor(...CC.muted).text(t(`TIRA ${k + 1} · GRADO ${k}`, `STRIP ${k + 1} · DEGREE ${k}`), m + 4, y + 6.5);
      w.rich(`$${term}$`, { x: m + 4, y: y + h / 2 + 5, width: 40, size: 24, family: "SFSerif", lineH: 9 });
      // three boxes for the contributions
      const bw = (W - 50 - 2 * 4) / 3;
      xo.forEach((r, j) => {
        const bx = m + 48 + j * (bw + 4), by = y + 4, bh = h - 8;
        doc.setDrawColor(...CC.grid).setLineWidth(0.25).rect(bx, by, bw, bh);
        w.rich(t(`aporta en $x = ${tx(r.x)}$`, `adds at $x = ${tx(r.x)}$`), { x: bx + 2, y: by + 4.6, width: bw - 4, size: 9.5, family: "SFSans", color: CC.muted, lineH: 4 });
        if (k === 0) w.rich("1", { x: bx + 4, y: by + bh / 2 + 5, width: bw - 8, size: 16, family: "SFSerif", style: "italic", color: CC.hand, lineH: 6 });
      });
    });
    w.y = top + 5 * h + 4 * gap + 4;

    // ---- page 3: a second machine and the opinion
    w.page();
    w.heading(t("Otra máquina con las mismas lecturas", "Another machine with the same readings"), { keep: 40 });
    w.paragraph(t(
      `Llamad $Q_4$ a la regla de cinco tiras y considerad $R(x) = Q_4(x) + c${M.factors}$. Comprobad que, para cualquier número $c$, $R$ da en las tres entradas lo mismo que $Q_4$. Con $c = 1$, ¿cuánto vale $R(0)$? ¿Qué os dice eso sobre lo que se puede saber de un mecanismo a partir de tres lecturas?`,
      `Call the five-strip rule $Q_4$ and consider $R(x) = Q_4(x) + c${M.factors}$. Check that, for any number $c$, $R$ gives the same as $Q_4$ at the three inputs. With $c = 1$, what is $R(0)$? What does that tell you about what can be learned about a mechanism from three readings?`), { gap: 1 });
    w.lines(5, 8);
    w.heading(t("El dictamen técnico del equipo", "The team's technical opinion"), { keep: 40 });
    w.paragraph(t("Tres frases, una por apartado. El inspector jefe no firma un robo con tres números: decid lo que las pruebas establecen y dónde terminan.", "Three sentences, one per part. The Chief Inspector does not sign off a theft on three numbers: say what the tests establish and where they stop."), { gap: 1 });
    prompts(w, [
      t("1. Lo que establecen las pruebas", "1. What the tests establish"),
      t("2. La regla que sugieren las lecturas", "2. The rule the readings suggest"),
      t("3. Lo que no pueden demostrar sobre el robo, y qué pruebas harían falta", "3. What they cannot prove about the break-in, and what evidence would be needed"),
    ], { gap: 7.5 });
  }

  // ------------------------------------------------------------------------ 30 · individual check
  function check(w, X) {
    const { t, M } = X;
    w.title(t("Comprobación individual", "Individual check"), kick(X));
    w.meta([[t("Nombre", "Name"), ""], [t("Equipo", "Team"), ""]]);
    w.paragraph(t("Responde por tu cuenta, con tus palabras.", "Answer on your own, in your own words."), { gap: 1 });
    prompts(w, [
      t("1. Si la AE-3 llevara también el término de grado 5, ¿cuál sería su coeficiente? Explica de dónde sale el factorial.", "1. If the AE-3 also carried the degree-5 term, what would its coefficient be? Explain where the factorial comes from."),
      t(`2. Una máquina pasa las tres pruebas con un error menor que $${M.tol}$. ¿Qué queda demostrado y qué no? ¿Qué añadiría una cota del resto válida en todo [−1, 1]?`, `2. A machine passes the three tests with an error below $${M.tol}$. What has been proved and what has not? What would a remainder bound valid on the whole of [−1, 1] add?`),
      t(`3. Dos máquinas dan las mismas lecturas en $x = ${M.xs.map(tx).join("$, $")}$. ¿Tienen que usar la misma regla? Da un ejemplo.`, `3. Two machines give the same readings at $x = ${M.xs.map(tx).join("$, $")}$. Must they use the same rule? Give an example.`),
    ]);
  }

  // ------------------------------------------------------------------------ 90 · teacher guide
  function guideDoc(w, X) {
    const { t, M, N, room, T } = X;
    w.title(t("Guía docente", "Teacher guide"), kick(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.paragraph(t(
      `Una calculadora experimental robada en Argen Labs, la AE-3, aproximaba $e^x$ con su polinomio de Taylor de grado tres; un aparato encontrado en Vektor Mecánica da lecturas que coinciden con un término más. La clase reconstruye el polinomio igualando derivadas, calcula errores, descubre la corrección $x^4/24$ en las diferencias y decide qué pueden establecer tres pruebas. El giro: la supuesta copia supera la tolerancia y el original no, y aun así ningún número dice quién fabricó la máquina. Tú eres el inspector jefe: repartes las hojas, marcas el ritmo y no aceptas un veredicto de robo apoyado solo en números.`,
      `An experimental calculator stolen from Argen Labs, the AE-3, approximated $e^x$ with its degree-three Taylor polynomial; a device found at Vektor Mechanical gives readings that match one more term. The class rebuilds the polynomial by matching derivatives, computes errors, finds the correction $x^4/24$ in the differences and decides what three tests can establish. The twist: the supposed copy meets the tolerance and the original does not, and still no number says who built the machine. You are the Chief Inspector: you hand out the sheets, set the pace and do not accept a verdict of theft that rests on numbers alone.`));
    w.heading(t("Esta generación", "This generation"));
    const fours = T.filter((g) => g.size > 3), threes = T.length - fours.length;
    const list = t(`${threes} de tres` + (fours.length ? `; ${fours.map((g) => `equipo ${g.index + 1}: ${roleList(g)}`).join("; ")}` : ""),
      `${threes} of three` + (fours.length ? `; ${fours.map((g) => `team ${g.index + 1}: ${roleList(g)}`).join("; ")}` : ""));
    w.meta([
      [t("Estudiantes", "Students"), String(room.students)],
      [t("Equipos", "Teams"), t(`${T.length} (${list})`, `${T.length} (${list})`)],
      [t("Hojas", "Sheets"), t(`A: ${X.copies.A} · B: ${X.copies.B} · C: ${X.copies.C} · D: ${T.length}`, `A: ${X.copies.A} · B: ${X.copies.B} · C: ${X.copies.C} · D: ${T.length}`)],
      [t("Entradas", "Inputs"), `$x = ${M.xs.map(tx).join("$, $")}$; ${t("tolerancia", "tolerance")} $${M.tol}$`],
      [t("Personajes", "Characters"), t(`${N.argen} (Argen Labs); ${N.vektor} (Vektor Mecánica)`, `${N.argen} (Argen Labs); ${N.vektor} (Vektor Mechanical)`)],
    ]);
    if (T.some((g) => g.size > 3)) w.paragraph(t("En los equipos de cuatro, dos estudiantes comparten un rol y una misma hoja: uno se ocupa de la primera mitad de las tareas y el otro de la segunda, y los dos responden por todas.", "In teams of four, two students share a role and the same sheet: one takes the first half of the tasks and the other the second half, and both answer for all of them."), { size: 9.5, italic: true });
    w.heading(t("Desarrollo", "Running the case"));
    w.table([t("Momento", "When"), t("Min", "Min"), t("Qué ocurre", "What happens")], t([
      ["Lanzamiento, al final de una clase", "3", "Dos preguntas de diagnóstico (diapositiva 4), por escrito y sin calculadora."],
      ["", "7", "Presentación proyectada (documento 00): el caso, el encargo del inspector jefe y los tres roles."],
      ["", "5", "Diapositiva de los equipos: cada estudiante recibe su hoja (A, B o C) y el equipo acuerda cómo se reunirá."],
      ["", "3", "Qué traer a la clase de cierre y la regla de no enseñar las hojas."],
      ["En casa", "45–60", "Cada especialista trabaja su hoja a solas (15–20 min); después el equipo se reúne, en persona o en línea, e intercambia los datos de viva voz (30–40 min)."],
      ["Clase de cierre", "10", "Puesta en común: $P_3$, la tabla de errores y la corrección que propone cada equipo, en la pizarra."],
      ["", "12", "Las tiras (hoja D, una por equipo): sumas en las tres entradas, con la predicción antes de cada tira."],
      ["", "12", "Audiencia: cada equipo dice lo que certifica, lo que conjetura y lo que falta; la segunda máquina con las mismas lecturas."],
      ["", "10", "Formalización: por qué los factoriales; ensayar frente a certificar (resto de Lagrange)."],
      ["", "6", "Dictamen del equipo en la hoja D, que se entrega."],
      ["", "5", "Comprobación individual (documento 30)."],
    ], [
      ["Launch, at the end of a class", "3", "Two entry questions (slide 4), in writing and without a calculator."],
      ["", "7", "Projected presentation (document 00): the case, the Chief Inspector's request and the three roles."],
      ["", "5", "Slide of the teams: each student receives their sheet (A, B or C) and the team agrees how it will meet."],
      ["", "3", "What to bring to the closing class and the rule of not showing the sheets."],
      ["At home", "45–60", "Each specialist works on their sheet alone (15–20 min); then the team meets, in person or online, and exchanges the data aloud (30–40 min)."],
      ["Closing class", "10", "Pooling: $P_3$, the table of errors and the correction each team proposes, on the board."],
      ["", "12", "The strips (sheet D, one per team): sums at the three inputs, with a prediction before each strip."],
      ["", "12", "Hearing: each team says what it certifies, what it conjectures and what is missing; the second machine with the same readings."],
      ["", "10", "Formalization: why the factorials; testing versus certifying (Lagrange remainder)."],
      ["", "6", "The team's opinion on sheet D, handed in."],
      ["", "5", "Individual check (document 30)."],
    ]), [34, 14, 132], { tight: true });
    w.paragraph(t("Qué imprimir, cuántas copias y cuándo se entrega cada documento: la «Guía de impresión y reparto» de esta generación.", "What to print, how many copies and when each document is handed out: this generation's “Printing and distribution guide”."), { italic: true, size: 9.5 });
    w.heading(t("Lo que puedes oír", "What you may hear"));
    w.table([t("Lo que se oye", "What you hear"), t("Qué revela", "What it reveals"), t("Qué preguntar", "What to ask")], t([
      ["«Todas las derivadas valen 1, así que todos los coeficientes valen 1».", "Se confunde el valor de la derivada con el coeficiente.", "Deriva dos veces $a_2x^2$: ¿qué queda en $x = 0$?"],
      ["«En $x = 0.5$ casi no hay error: la AE-3 es precisa».", "Se toma la precisión en un punto por una propiedad del polinomio.", "Compara con $x = 1$: mismo polinomio, ¿mismo error?"],
      ["«Las lecturas son $Q_4$: es la máquina robada con una mejora».", "Se deduce el mecanismo, y su historia, de tres salidas.", "Construye otra regla con las mismas tres lecturas."],
      ["«La cota de $Q_4$ es 0.0227, así que incumple la tolerancia».", "Se toma una cota por el error real.", "Si una longitud mide como mucho 20, ¿mide más de 12?"],
      ["«La gráfica del error queda por debajo de 0.012: demostrado».", "Se toma una gráfica muestreada por una prueba.", "¿Qué ocurre entre los puntos dibujados?"],
      ["«La copia funciona mejor que el original, así que no es una copia».", "Se deduce otra vez la historia a partir de los números.", "¿Qué pruebas sobre piezas, documentos o accesos lo decidirían?"],
    ], [
      ["“Every derivative is 1, so every coefficient is 1.”", "The value of the derivative is confused with the coefficient.", "Differentiate $a_2x^2$ twice: what is left at $x = 0$?"],
      ["“At $x = 0.5$ there is hardly any error: the AE-3 is accurate.”", "Accuracy at one point is taken for a property of the polynomial.", "Compare with $x = 1$: same polynomial, same error?"],
      ["“The readings are $Q_4$: it is the stolen machine, improved.”", "The mechanism, and its history, are inferred from three outputs.", "Build another rule with the same three readings."],
      ["“The bound for $Q_4$ is 0.0227, so it breaks the tolerance.”", "A bound is taken for the actual error.", "If a length is at most 20, is it more than 12?"],
      ["“The error graph stays below 0.012: proved.”", "A sampled graph is taken for a proof.", "What happens between the plotted points?"],
      ["“The copy works better than the original, so it is not a copy.”", "Once again the history is inferred from the numbers.", "What evidence about parts, documents or access would decide it?"],
    ]), [64, 52, 64]);
    w.heading(t("Evaluación", "Assessment"));
    w.table([t("Criterio", "Criterion"), t("Suficiente", "Satisfactory"), t("Sólido", "Strong")], t([
      ["Coeficientes", "Obtiene $P_3$.", "Lo obtiene igualando derivadas y explica el factorial."],
      ["Errores y tolerancia", "Calcula los errores y aplica la regla.", "Explica por qué el mismo polinomio acierta en una entrada y falla en otra."],
      ["La corrección", "Propone $x^4/24$.", "La justifica con las diferencias y la reconoce como el término siguiente de Taylor."],
      ["Alcance", "Dice que tres pruebas no son una garantía.", "Separa las entradas ensayadas, la cota en un intervalo y la acusación de copia."],
    ], [
      ["Coefficients", "Obtains $P_3$.", "Obtains it by matching derivatives and explains the factorial."],
      ["Errors and tolerance", "Computes the errors and applies the rule.", "Explains why the same polynomial is right at one input and wrong at another."],
      ["The correction", "Proposes $x^4/24$.", "Justifies it with the differences and recognises it as the next Taylor term."],
      ["Scope", "Says that three tests are not a guarantee.", "Separates the tested inputs, a bound on an interval and the accusation of copying."],
    ]), [36, 62, 82]);
  }

  // ------------------------------------------------------------------------ 91 · solution
  function solution(w, X) {
    const { t, M } = X;
    w.title(t("Solución", "Solution"), kick(X), t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.heading(t("1. El polinomio de Argen (hoja A)", "1. Argen's polynomial (sheet A)"));
    w.paragraph(t(
      "Para $p(x) = a_0 + a_1x + a_2x^2 + a_3x^3$: $p(0) = a_0$, $p'(0) = a_1$, $p''(0) = 2a_2$ y $p'''(0) = 6a_3$. Todas las derivadas de $e^x$ son $e^x$ y valen 1 en 0, así que $a_0 = 1$, $a_1 = 1$, $a_2 = 1/2$ y $a_3 = 1/6$: $P_3(x) = 1 + x + x^2/2 + x^3/6$. En general, la derivada $j$-ésima de $a_jx^j$ en 0 es $j!a_j$: de ahí sale el factorial.",
      "For $p(x) = a_0 + a_1x + a_2x^2 + a_3x^3$: $p(0) = a_0$, $p'(0) = a_1$, $p''(0) = 2a_2$ and $p'''(0) = 6a_3$. Every derivative of $e^x$ is $e^x$ and equals 1 at 0, so $a_0 = 1$, $a_1 = 1$, $a_2 = 1/2$ and $a_3 = 1/6$: $P_3(x) = 1 + x + x^2/2 + x^3/6$. In general, the $j$th derivative of $a_jx^j$ at 0 is $j!a_j$: that is where the factorial comes from."));
    w.heading(t("2. Valores, lecturas y errores (hojas A, B y C)", "2. Values, readings and errors (sheets A, B and C)"));
    const head = ["", ...M.xs.map((x) => `$x = ${tx(x)}$`)];
    w.table(head, [
      [t("$P_3(x)$, Argen", "$P_3(x)$, Argen"), ...M.rows.map((r) => fmt(r.p3))],
      [t("Lectura del aparato", "Device reading"), ...M.rows.map((r) => r.reading)],
      ["$e^x$", ...M.rows.map((r) => fmt(r.ref))],
      [t("Error de Argen", "Argen's error"), ...M.rows.map((r) => `${fmt(r.errA)} · ${r.passA ? t("pasa", "pass") : t("falla", "fail")}`)],
      [t("Error del aparato", "Device's error"), ...M.rows.map((r) => `${fmt(r.errV)} · ${r.passV ? t("pasa", "pass") : t("falla", "fail")}`)],
      [t("Diferencia $d(x)$", "Difference $d(x)$"), ...M.rows.map((r) => fmt(r.diff))],
      ["$d(x)/x^3$", ...M.rows.map((r) => fmt(r.ratio[0]))],
      ["$d(x)/x^4$", ...M.rows.map((r) => fmt(r.ratio[1]))],
      ["$d(x)/x^5$", ...M.rows.map((r) => fmt(r.ratio[2]))],
    ], [50, 43, 43, 43], { boldFirst: true, zebra: true });
    w.paragraph(t(
      `Los errores se calculan con los valores impresos (salidas de seis decimales, lecturas de cinco), como los calculan los estudiantes. Con la tolerancia $${M.tol}$, la AE-3 falla en $x = ${M.failA.map((r) => tx(r.x)).join("$ y en $x = ")}$, mientras que el aparato incautado supera las tres pruebas: la supuesta copia funciona mejor que el original. El cociente $d(x)/x^4$ es casi constante, $0.0417 \\approx 1/24$, y los otros no: las lecturas coinciden, con la precisión impresa, con $Q_4(x) = P_3(x) + x^4/24$, el polinomio de Taylor de grado cuatro.`,
      `The errors are computed from the printed values (outputs to six decimals, readings to five), as students compute them. With the tolerance $${M.tol}$, the AE-3 fails at $x = ${M.failA.map((r) => tx(r.x)).join("$ and at $x = ")}$, while the seized device passes all three tests: the supposed copy works better than the original. The quotient $d(x)/x^4$ is almost constant, $0.0417 \\approx 1/24$, and the others are not: the readings agree, to their printed precision, with $Q_4(x) = P_3(x) + x^4/24$, the degree-four Taylor polynomial.`));
    w.heading(t("3. Otra máquina con las mismas lecturas (hoja D)", "3. Another machine with the same readings (sheet D)"), { keep: 30 });
    w.paragraph(t(
      `$R(x) = Q_4(x) + c${M.factors}$ coincide con $Q_4$ en las tres entradas, porque el producto se anula en ellas, cualquiera que sea $c$. Con $c = 1$, $R(0) = ${fmt(M.R0, 4).replace(/0+$/, "").replace(/\.$/, "")}$, aunque $e^0 = 1$. Un número finito de lecturas es compatible con infinitas reglas: no identifica un mecanismo, y menos aún dice quién lo diseñó.`,
      `$R(x) = Q_4(x) + c${M.factors}$ agrees with $Q_4$ at the three inputs, because the product vanishes there, whatever $c$ is. With $c = 1$, $R(0) = ${fmt(M.R0, 4).replace(/0+$/, "").replace(/\.$/, "")}$, although $e^0 = 1$. Finitely many readings are compatible with infinitely many rules: they do not identify a mechanism, still less say who designed it.`));
    w.heading(t("4. Las tiras (hoja D)", "4. The strips (sheet D)"), { keep: 60 });
    const sh = [t("Tiras", "Strips")];
    M.order.forEach((r) => sh.push(t(`En $x = ${tx(r.x)}$`, `At $x = ${tx(r.x)}$`), t("Suma", "Sum")));
    w.table(sh, TERMS.map((term, k) => [`${k + 1} · $${term}$`, ...M.order.flatMap((r) => [fmt(r.terms[k]), fmt(r.sums[k])])]), [26, 26, 22, 26, 22, 26, 22], { boldFirst: true, zebra: true, size: 9.5 });
    w.paragraph(t(
      "Con una entrada negativa, las tiras de grado impar restan y la suma oscila alrededor del valor de referencia en lugar de subir hacia él. La quinta tira importa mucho en las entradas de valor absoluto 1 y casi nada en las próximas a 0, porque $x^4$ es allí diminuto: el mismo polinomio es excelente en una entrada y no en otra.",
      "With a negative input, the strips of odd degree subtract, and the sum oscillates around the reference value instead of climbing towards it. The fifth strip matters a great deal at inputs of absolute value 1 and hardly at all near 0, because $x^4$ is tiny there: the same polynomial is excellent at one input and not at another."));
    w.heading(t("5. Ensayar frente a certificar", "5. Testing versus certifying"), { keep: 30 });
    w.paragraph(t(
      `Si la regla interna es de verdad el polinomio de Taylor $P_n$, el resto de Lagrange da, para $|x| \\le 1$, $|e^x - P_n(x)| \\le e|x|^{n+1}/(n+1)! \\le e/(n+1)!$. En grado cuatro, $e/120 \\approx ${fmt(M.bound4, 5)}$: no basta para certificar la tolerancia en todo [−1, 1], aunque tampoco demuestra que se incumpla (en $x = 1$ el error real es $0.00995$). En grado cinco, $e/720 \\approx ${fmt(M.bound5, 5)}$, que sí la certifica. Tres pruebas superadas dicen algo de tres entradas; una cota uniforme dice algo de todas, pero solo de la regla a la que se refiere.`,
      `If the internal rule really is the Taylor polynomial $P_n$, the Lagrange remainder gives, for $|x| \\le 1$, $|e^x - P_n(x)| \\le e|x|^{n+1}/(n+1)! \\le e/(n+1)!$. At degree four, $e/120 \\approx ${fmt(M.bound4, 5)}$: not enough to certify the tolerance on the whole of [−1, 1], although it does not prove that the tolerance fails either (at $x = 1$ the actual error is $0.00995$). At degree five, $e/720 \\approx ${fmt(M.bound5, 5)}$, which does certify it. Three passed tests say something about three inputs; a uniform bound says something about all of them, but only about the rule it refers to.`));
    errorPlot(w, X);
    w.heading(t("6. Un dictamen sólido", "6. A sound opinion"), { keep: 30 });
    w.callout(t(
      `Las lecturas del aparato incautado superan la tolerancia de $${M.tol}$ en las tres entradas ensayadas, y la AE-3 documentada no. Las lecturas coinciden con la corrección de Taylor de cuarto grado, $x^4/24$, pero eso solo lo sugieren: otras reglas dan las mismas tres lecturas. No acreditan que el mecanismo se copiara de Argen; eso exigiría pruebas sobre piezas, documentos, accesos o fabricación.`,
      `The readings of the seized device meet the tolerance of $${M.tol}$ at the three tested inputs, and the documented AE-3 does not. The readings agree with the fourth-order Taylor correction, $x^4/24$, but they only suggest it: other rules give the same three readings. They do not establish that the mechanism was copied from Argen; that would require evidence about parts, documents, access or manufacture.`), "blue");
    w.heading(t("7. Comprobación individual", "7. Individual check"), { keep: 30 });
    w.bullets(t([
      "El coeficiente de grado 5 es $1/120 = 1/5!$: la derivada quinta de $a_5x^5$ en 0 es $5!a_5$ y tiene que valer $e^0 = 1$.",
      "Tres pruebas superadas establecen el error en esas tres entradas y nada más. Una cota del resto en [−1, 1] garantiza el error en todas las entradas del intervalo, pero solo para la regla de la que se ha deducido.",
      `No: $R(x) = Q_4(x) + c${M.factors}$ da las mismas lecturas para cualquier $c$ y es otra regla.`,
    ], [
      "The degree-5 coefficient is $1/120 = 1/5!$: the fifth derivative of $a_5x^5$ at 0 is $5!a_5$, and it must equal $e^0 = 1$.",
      "Three passed tests establish the error at those three inputs and nothing more. A remainder bound on [−1, 1] guarantees the error at every input of the interval, but only for the rule it was derived from.",
      `No: $R(x) = Q_4(x) + c${M.factors}$ gives the same readings for any $c$, and it is a different rule.`,
    ]), true);
  }

  /** The two error curves on [−1, 1], the tolerance and the tested inputs (vector drawing). */
  function errorPlot(w, X) {
    const { t, M } = X, { doc, CC } = w;
    w.ensure(78);
    const g = w.grid({ w: 110, h: 52, xmin: -1, xmax: 1, ymin: 0, ymax: 0.06, xstep: 0.5, ystep: 0.01, xLabel: "x", yLabel: t("Error absoluto", "Absolute error"), hlines: [M.tol], x: w.margin + 14 });
    const curve = (f, color, dash) => {
      doc.setDrawColor(...color).setLineWidth(0.5);
      if (dash) doc.setLineDashPattern([1.6, 1], 0);
      let prev = null;
      for (let k = 0; k <= 200; k++) {
        const x = -1 + k / 100, p = [g.X(x), g.Y(Math.min(0.06, f(x)))];
        if (prev) doc.line(prev[0], prev[1], p[0], p[1]);
        prev = p;
      }
      doc.setLineDashPattern([], 0);
    };
    const P3 = (x) => 1 + x + x * x / 2 + x * x * x / 6, Q4 = (x) => P3(x) + Math.pow(x, 4) / 24;
    curve((x) => Math.abs(Math.exp(x) - P3(x)), CC.orange, true);
    curve((x) => Math.abs(Math.exp(x) - Q4(x)), CC.blue, false);
    M.rows.forEach((r) => { doc.setFillColor(...CC.ink); doc.circle(g.X(r.x), g.Y(r.errA), 0.8, "F"); doc.circle(g.X(r.x), g.Y(r.errQ), 0.8, "F"); });
    const lx = g.gx + 116;
    [[CC.orange, "$|e^x - P_3(x)|$", true], [CC.blue, "$|e^x - Q_4(x)|$", false], [CC.stamp, t(`tolerancia $${M.tol}$`, `tolerance $${M.tol}$`), true]].forEach(([c, label, dash], k) => {
      const yy = g.gy + 6 + k * 7;
      doc.setDrawColor(...c).setLineWidth(0.5); if (dash) doc.setLineDashPattern([1.6, 1], 0);
      doc.line(lx, yy - 1.2, lx + 8, yy - 1.2); doc.setLineDashPattern([], 0);
      w.rich(label, { x: lx + 10, y: yy, width: 34, size: 9.5, family: "SFSans", lineH: 4 });
    });
    w.caption(t("Los puntos son las entradas ensayadas. Una gráfica muestreada sugiere el comportamiento; solo una cota del resto lo garantiza.", "The dots are the tested inputs. A sampled graph suggests the behaviour; only a remainder bound guarantees it."));
  }

  // ------------------------------------------------------------------------ slides (document 00)
  function slides(X) {
    const { t, M, N, T } = X, k = X.kicker;
    const teamRows = (() => {
      const row = (g) => [`${t("Equipo", "Team")} ${g.index + 1}`, roleList(g), String(g.size)];
      if (T.length <= 6) return { head: [t("Equipo", "Team"), t("Especialistas", "Specialists"), t("Estudiantes", "Students")], rows: T.map(row), widths: [40, 100, 40] };
      const cols = T.length <= 12 ? 2 : 3, per = Math.ceil(T.length / cols), rows = [];
      const short = (g) => [String(g.index + 1), roleList(g), String(g.size)];
      for (let i = 0; i < per; i++) rows.push([].concat(...Array.from({ length: cols }, (_, c) => (T[i + c * per] ? short(T[i + c * per]) : ["", "", ""]))));
      const head = [].concat(...Array.from({ length: cols }, () => [t("Equipo", "Team"), t("Roles", "Roles"), t("Est.", "Stud.")]));
      return { head, rows, widths: [].concat(...Array.from({ length: cols }, () => [18, 40, 12])) };
    })();
    const four = T.filter((g) => g.size > 3).length;
    return [
      { banner: true, kicker: k, title: t("La calculadora de Vektor", "The Vektor Calculator"), subtitle: t("Polinomios de Taylor: hasta dónde llega una aproximación", "Taylor polynomials: how far an approximation reaches") },
      { kicker: k, title: t("El caso", "The case"), text: [
        t(`Hace tres semanas entraron a robar en Argen Labs y se llevaron el prototipo de la AE-3, una calculadora experimental que estima $e^x$ sumando términos, sin un chip de cálculo convencional. Ayer apareció en Vektor Mecánica un aparato que hace lo mismo. Su director técnico, ${N.vektor}, dice que es diseño propio. Argen dice que es su máquina.`,
          `Three weeks ago Argen Labs was broken into, and the prototype of the AE-3 was taken: an experimental calculator that estimates $e^x$ by adding up terms, without a conventional calculating chip. Yesterday a device that does the same turned up at Vektor Mechanical. Its technical director, ${N.vektor}, says it is Vektor's own design. Argen says it is their machine.`),
        t("El consultor abrió este expediente antes de dejar de venir. En la carpeta quedaron dos sobres: la nota de diseño de Argen y las lecturas del aparato de Vektor.", "The consultant opened this file before he stopped coming. Two envelopes were left in the folder: Argen's design note and the readings of the Vektor device."),
      ] },
      { kicker: k, title: t("Lo que pide el inspector jefe", "What the Chief Inspector wants"),
        quote: t("«Antes de hablar de robo, quiero saber cuánto se parecen los dos métodos y dónde se separan. Podemos comparar matemáticas. La historia de una máquina no se deduce de unos cuantos números que coinciden».", "“Before anyone talks about theft, I want to know how alike the two methods are and where they part. We can compare mathematics. The history of a machine does not follow from a few numbers that agree.”"),
        bullets: t(["Reconstruir el método documentado de Argen.", "Comparar las salidas del aparato incautado con valores de referencia.", "Decidir qué pueden establecer esas pruebas y qué no."],
          ["Rebuild Argen's documented method.", "Compare the outputs of the seized device with reference values.", "Decide what those tests can establish and what they cannot."]) },
      { kicker: k, title: t("Dos preguntas antes de empezar", "Two questions before we start"),
        bullets: t(["Para $p(x) = a + bx + cx^2$, ¿cuánto valen $p(0)$, $p'(0)$ y $p''(0)$?", "¿Garantiza un error pequeño en $x = 0$ un error pequeño en $x = 1$?"],
          ["For $p(x) = a + bx + cx^2$, what are $p(0)$, $p'(0)$ and $p''(0)$?", "Does a small error at $x = 0$ guarantee a small error at $x = 1$?"]),
        note: t("Un minuto, por escrito, cada uno por su cuenta.", "One minute, in writing, each of you on your own.") },
      { kicker: k, title: t("Tres especialistas por equipo", "Three specialists per team"),
        table: { head: [t("Rol", "Role"), t("Tiene", "Holds"), t("Busca", "Looks for")], rows: t([
          ["A · Archivo", "La nota de diseño de Argen", "El polinomio de la AE-3 y sus salidas"],
          ["B · Inspección", "Las lecturas del aparato incautado", "En qué se diferencia de Argen, y por qué"],
          ["C · Validación", "Los valores de referencia y la tolerancia", "Qué máquina supera la prueba, y con qué alcance"],
        ], [
          ["A · Archive", "Argen's design note", "The AE-3 polynomial and its outputs"],
          ["B · Inspection", "The readings of the seized device", "How it differs from Argen's, and why"],
          ["C · Validation", "The reference values and the tolerance", "Which machine passes, and how far that goes"],
        ]), widths: [36, 70, 74] },
        note: t("Ninguna hoja basta sola. Los datos se intercambian de viva voz o por mensaje, sin enseñar la hoja.", "No sheet is enough on its own. The data are exchanged aloud or by message, without showing the sheet.") },
      { kicker: k, title: t("Los equipos de esta clase", "This class's teams"), table: teamRows,
        note: four ? t(`En ${four === 1 ? "un equipo de cuatro" : `${four} equipos de cuatro`}, dos estudiantes comparten un rol y una hoja.`, `In ${four === 1 ? "one team of four" : `${four} teams of four`}, two students share a role and a sheet.`) : t("Cada equipo: un archivo, una inspección y una validación.", "Each team: one archive, one inspection and one validation.") },
      { kicker: k, title: t("Para la clase de cierre", "For the closing class"), bullets: t([
        "**Cada especialista**, su hoja completa: la A con $P_3$ y sus salidas; la B con las diferencias y una corrección; la C con los errores y el veredicto.",
        "**Cada equipo**, una frase: qué pueden certificar las pruebas y qué no.",
        "**En casa**: primero cada uno con su hoja (15–20 min); después el equipo junto, en persona o en línea (30–40 min).",
        "No enseñéis vuestra hoja: decid lo que pone cuando os lo pregunten.",
      ], [
        "**Each specialist**, their completed sheet: A with $P_3$ and its outputs; B with the differences and a correction; C with the errors and the verdict.",
        "**Each team**, one sentence: what the tests can certify and what they cannot.",
        "**At home**: first each of you with your sheet (15–20 min); then the team together, in person or online (30–40 min).",
        "Do not show your sheet: say what it contains when you are asked.",
      ]) },
      { kicker: k, title: t("La clase de cierre", "The closing class"),
        table: { head: [t("Min", "Min"), t("Qué hacemos", "What we do")], rows: t([
          ["10", "Puesta en común: $P_3$, los errores y la corrección que propone cada equipo."],
          ["12", "Las tiras de términos (hoja D): las sumas en las tres entradas."],
          ["12", "Audiencia: lo que certificáis, lo que conjeturáis y lo que falta."],
          ["10", "Por qué estos coeficientes; ensayar no es certificar."],
          ["6", "El dictamen del equipo."],
          ["5", "Comprobación individual."],
        ], [
          ["10", "Pooling: $P_3$, the errors and the correction each team proposes."],
          ["12", "The term strips (sheet D): the sums at the three inputs."],
          ["12", "Hearing: what you certify, what you conjecture and what is missing."],
          ["10", "Why these coefficients; testing is not certifying."],
          ["6", "The team's opinion."],
          ["5", "Individual check."],
        ]), widths: [18, 162] } },
      { kicker: k, title: t("El dictamen", "The opinion"), bullets: t([
        "**Lo que establecen** las pruebas: qué máquina supera la tolerancia, y en qué entradas.",
        "**La regla que sugieren** las lecturas, y por qué solo la sugieren.",
        "**Lo que no pueden demostrar** sobre el robo, y qué pruebas harían falta.",
      ], [
        "**What the tests establish**: which machine meets the tolerance, and at which inputs.",
        "**The rule the readings suggest**, and why they only suggest it.",
        "**What they cannot prove** about the break-in, and what evidence would be needed.",
      ]), note: t("«Esta unidad no firma un robo con tres números».", "“This unit does not sign off a theft on three numbers.”") },
    ];
  }

  // ------------------------------------------------------------------------ preview (page)
  function preview(X, el) {
    const { t, M } = X, W = 560, H = 250, L = 48, R = 18, Tp = 14, B = 34;
    const sx = (x) => L + ((x + 1) / 2) * (W - L - R), sy = (y) => Tp + (1 - Math.min(y, 0.06) / 0.06) * (H - Tp - B);
    const P3 = (x) => 1 + x + x * x / 2 + x * x * x / 6, Q4 = (x) => P3(x) + Math.pow(x, 4) / 24;
    const path = (f) => Array.from({ length: 201 }, (_, k) => { const x = -1 + k / 100; return `${k ? "L" : "M"}${sx(x).toFixed(1)},${sy(Math.abs(Math.exp(x) - f(x))).toFixed(1)}`; }).join("");
    const ticksY = [0, 0.02, 0.04, 0.06].map((v) => `<line x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}" stroke="#e3e6ea"/><text x="${L - 6}" y="${sy(v) + 4}" text-anchor="end" font-size="11" fill="#5d6570">${v}</text>`).join("");
    const ticksX = [-1, -0.5, 0, 0.5, 1].map((v) => `<text x="${sx(v)}" y="${H - B + 16}" text-anchor="middle" font-size="11" fill="#5d6570">${fx(v)}</text>`).join("");
    const dots = M.rows.map((r) => `<circle cx="${sx(r.x)}" cy="${sy(r.errA)}" r="3.5" fill="#e77924"/><circle cx="${sx(r.x)}" cy="${sy(r.errQ)}" r="3.5" fill="#0b607f"/>`).join("");
    const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t("Errores de las dos máquinas", "Errors of the two machines")}" font-family="system-ui, sans-serif">${ticksY}${ticksX}
      <line x1="${L}" x2="${W - R}" y1="${sy(M.tol)}" y2="${sy(M.tol)}" stroke="#a43d35" stroke-dasharray="5 4"/>
      <path d="${path(P3)}" fill="none" stroke="#e77924" stroke-width="2.2" stroke-dasharray="6 4"/><path d="${path(Q4)}" fill="none" stroke="#0b607f" stroke-width="2.2"/>${dots}
      <text x="${L + 6}" y="${sy(M.tol) - 5}" font-size="11" fill="#a43d35">${t("tolerancia", "tolerance")} ${M.tol}</text></svg>`;
    el.innerHTML = `<figure>${svg}<figcaption>${t("Error de la AE-3 de Argen (naranja, $P_3$) y del aparato de Vektor (azul, $Q_4$) en [−1, 1]; los puntos son las entradas ensayadas.", "Error of Argen's AE-3 (orange, $P_3$) and of the Vektor device (blue, $Q_4$) on [−1, 1]; the dots are the tested inputs.").replace(/\$([^$]+)\$/g, (_, s) => root.CCTex ? root.CCTex.html(`$${s}$`) : s)}</figcaption></figure>`
      + `<table class="cc-groups"><thead><tr><th></th>${M.xs.map((x) => `<th>x = ${fx(x)}</th>`).join("")}</tr></thead><tbody>`
      + `<tr><td>${t("Argen", "Argen")}</td>${M.rows.map((r) => `<td>${fmt(r.errA)}</td>`).join("")}</tr><tr><td>Vektor</td>${M.rows.map((r) => `<td>${fmt(r.errV)}</td>`).join("")}</tr></tbody></table>`;
  }

  // ------------------------------------------------------------------------ the definition
  const def = {
    id: "vektor", minStudents: 6, maxStudents: 45, studentsDefault: 24,
    defaults: { inputs: "A", argen: "Marta Ibarra", vektor: "Óscar Valdés" },
    classroom(cfg, t) {
      const T = teams(cfg.students);
      return {
        students: T.reduce((s, g) => s + g.size, 0),
        groups: T.map((g) => ({ label: `${t("Equipo", "Team")} ${g.index + 1}`, role: roleList(g), size: g.size })),
        note: T.some((g) => g.size > 3) ? t("En los equipos de cuatro, dos estudiantes comparten un rol (primero inspección, después archivo) y una misma hoja.", "In teams of four, two students share a role (inspection first, then archive) and the same sheet.") : t("Cada equipo: archivo (A), inspección (B) y validación (C).", "Each team: archive (A), inspection (B) and validation (C)."),
      };
    },
    context(cfg, t) {
      const T = teams(cfg.students), M = model(cfg.inputs);
      const copies = { A: 0, B: 0, C: 0 }; T.forEach((g) => ROLES.forEach((r) => { copies[r] += g[r]; }));
      return { T, M, copies, N: { argen: clean(cfg.argen, "Marta Ibarra"), vektor: clean(cfg.vektor, "Óscar Valdés") } };
    },
    kicker: (X) => X.t("Calculus Cases · Caso 4 · La calculadora de Vektor", "Calculus Cases · Case 4 · The Vektor Calculator"),
    docs(X) {
      const { t, copies, T, room } = X, nT = T.length;
      const pr = (who, c, how, when) => ({ who, copies: c, how, when });
      const DS = t("Doble cara; blanco y negro", "Double-sided; black and white");
      const per = (n, role) => t(`${n} (1 por especialista ${role})`, `${n} (1 per ${role} specialist)`);
      return [
        { id: "sheetA", n: "10", title: t("Hoja A · El archivo de Argen", "Sheet A · The Argen archive"), count: copies.A, render: sheetA,
          print: pr(t("Especialistas de archivo (A)", "Archive specialists (A)"), per(copies.A, t("de archivo", "archive")), DS, t("Lanzamiento; vuelve a la clase de cierre", "Launch; back in the closing class")) },
        { id: "sheetB", n: "11", title: t("Hoja B · El aparato incautado", "Sheet B · The seized device"), count: copies.B, render: sheetB,
          print: pr(t("Especialistas de inspección (B)", "Inspection specialists (B)"), per(copies.B, t("de inspección", "inspection")), DS, t("Lanzamiento; vuelve a la clase de cierre", "Launch; back in the closing class")) },
        { id: "sheetC", n: "12", title: t("Hoja C · Validación", "Sheet C · Validation"), count: copies.C, render: sheetC,
          print: pr(t("Especialistas de validación (C)", "Validation specialists (C)"), per(copies.C, t("de validación", "validation")), DS, t("Lanzamiento; vuelve a la clase de cierre", "Launch; back in the closing class")) },
        { id: "sheetD", n: "20", title: t("Hoja D · Las tiras y el dictamen", "Sheet D · The strips and the opinion"), count: nT, render: sheetD,
          print: pr(t("Cada equipo", "Each team"), t(`${nT} (1 por equipo)`, `${nT} (1 per team)`), t("Una cara (la página 2 se recorta); blanco y negro", "Single-sided (page 2 is cut out); black and white"), t("Clase de cierre, después de la puesta en común", "Closing class, after the pooling")) },
        { id: "check", n: "30", title: t("Comprobación individual", "Individual check"), count: room.students, render: check,
          print: pr(t("Todos", "Everyone"), t(`${room.students} (1 por estudiante)`, `${room.students} (1 per student)`), t("Una cara; blanco y negro", "Single-sided; black and white"), t("Final de la clase de cierre", "End of the closing class")) },
        { id: "guide", n: "90", teacher: true, title: t("Guía docente", "Teacher guide"), render: guideDoc, print: pr(t("Solo para ti", "For you only"), "1", DS, t("Antes del lanzamiento", "Before the launch")) },
        { id: "solution", n: "91", teacher: true, title: t("Solución", "Solution"), render: solution, print: pr(t("Solo para ti", "For you only"), "1", DS, t("Antes del lanzamiento; no circula", "Before the launch; it does not circulate")) },
      ];
    },
    bundles(X) {
      const { t, copies, T, room } = X;
      return [
        { id: "archive", label: t("Archivo · hoja A", "Archive · sheet A"), docs: ["sheetA"], use: t(`${copies.A} copias, 1 por especialista de archivo, en el lanzamiento`, `${copies.A} copies, 1 per archive specialist, at the launch`) },
        { id: "inspection", label: t("Inspección · hoja B", "Inspection · sheet B"), docs: ["sheetB"], use: t(`${copies.B} copias, 1 por especialista de inspección, en el lanzamiento`, `${copies.B} copies, 1 per inspection specialist, at the launch`) },
        { id: "validation", label: t("Validación · hoja C", "Validation · sheet C"), docs: ["sheetC"], use: t(`${copies.C} copias, 1 por especialista de validación, en el lanzamiento`, `${copies.C} copies, 1 per validation specialist, at the launch`) },
        { id: "closing", label: t("Equipo · hoja D", "Team · sheet D"), docs: ["sheetD"], use: t(`${T.length} copias, 1 por equipo, en la clase de cierre`, `${T.length} copies, 1 per team, in the closing class`) },
        { id: "check", label: t("Comprobación individual", "Individual check"), docs: ["check"], use: t(`${room.students} copias, 1 por estudiante, al final de la clase de cierre`, `${room.students} copies, 1 per student, at the end of the closing class`) },
        { id: "teacher", label: t("Paquete docente", "Teacher packet"), docs: ["guide", "solution"], use: t("1, para ti", "1, for you") },
      ];
    },
    slides,
    guide(X) {
      const { t, copies, T, room } = X;
      return {
        before: [t("La hoja D se imprime a una cara: su página 2 son las tiras que se recortan.", "Sheet D is printed single-sided: its page 2 holds the strips that are cut out.")],
        steps: t([
          `Antes del lanzamiento: imprime las hojas A (${copies.A}), B (${copies.B}) y C (${copies.C}), las ${T.length} hojas D y las ${room.students} comprobaciones, y el paquete docente. Si quieres ganar tiempo en clase, recorta tú las tiras de la página 2 de cada hoja D y guárdalas con un clip.`,
          "Lanzamiento: proyecta la presentación. En la diapositiva de los equipos, entrega a cada estudiante la hoja de su rol (A, B o C). Las hojas D no se reparten todavía.",
          "En casa: cada especialista trabaja su hoja y el equipo se reúne para intercambiar los datos. No hay nada que repartir.",
          "Clase de cierre: después de la puesta en común (unos diez minutos), entrega una hoja D a cada equipo, con tijeras si las tiras no están recortadas. Al final, recoge las hojas D con el dictamen y reparte la comprobación individual.",
          "La guía docente y la solución se quedan contigo.",
        ], [
          `Before the launch: print sheets A (${copies.A}), B (${copies.B}) and C (${copies.C}), the ${T.length} sheets D and the ${room.students} individual checks, and the teacher packet. To save time in class, cut out the strips on page 2 of each sheet D yourself and keep them together with a clip.`,
          "Launch: project the presentation. On the slide of the teams, give each student the sheet of their role (A, B or C). The sheets D are not handed out yet.",
          "At home: each specialist works on their sheet and the team meets to exchange the data. There is nothing to hand out.",
          "Closing class: after the pooling (about ten minutes), give each team a sheet D, with scissors if the strips have not been cut. At the end, collect the sheets D with the opinion and hand out the individual check.",
          "The teacher guide and the solution stay with you.",
        ]),
        material: [t(`Tijeras (una por equipo) si no recortas tú las tiras; ${T.length} clips o sobres pequeños para guardarlas.`, `Scissors (one per team) if you do not cut the strips yourself; ${T.length} paper clips or small envelopes to keep them in.`),
          t("Proyector para el lanzamiento y la clase de cierre. Una calculadora por equipo es útil en casa.", "A projector for the launch and the closing class. One calculator per team is useful at home.")],
      };
    },
    summary(X) {
      const { t, M, T, copies, room } = X;
      return [[t("Estudiantes", "Students"), String(room.students)], [t("Equipos", "Teams"), String(T.length)],
        [t("Hojas A · B · C · D", "Sheets A · B · C · D"), `${copies.A} · ${copies.B} · ${copies.C} · ${T.length}`],
        [t("Entradas ensayadas", "Tested inputs"), M.xs.map(fx).join(", ")], [t("Tolerancia", "Tolerance"), String(M.tol)]];
    },
    checks(X) {
      const { t, M } = X;
      return [M.valid
        ? { text: t(`Comprobado: con estas entradas, la AE-3 falla en ${M.failA.map((r) => fx(r.x)).join(" y ")} y el aparato incautado supera las tres pruebas.`, `Checked: with these inputs, the AE-3 fails at ${M.failA.map((r) => fx(r.x)).join(" and ")} and the seized device passes all three tests.`) }
        : { warn: true, text: t("Con estas entradas el caso pierde su giro.", "With these inputs the case loses its twist.") }];
    },
    preview,
  };
  root.Vektor = { model, teams, INPUTS, TOL, fmt };
  if (root.CCGenerator) root.CCGenerator.define(def);
})(typeof window !== "undefined" ? window : globalThis);
