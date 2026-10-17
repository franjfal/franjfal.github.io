/*
 * Calculus Cases · Case 7 · The Series Finale — episode dossiers (public).
 *
 * For each episode of ZENO: the extract of the mathematical effects bible (v3, and v1 where the
 * investigation needs it), a scene of the shooting script, the forensic exhibit that the team
 * analyses, the exercises with their answer specifications, the creative challenge and the
 * questions to prepare for the interviews. Answers are never stored here: each answer names a
 * reference (`ref`) that sf-validate.js computes from the case parameters with sf-math.js.
 */
(function (root) {
  "use strict";
  const SF = (root.SFData = root.SFData || {});
  const T = (es, en) => ({ es, en });

  // Levels of a dossier: B the essential exercises (with the forensic one), E all but the
  // extension, A everything. Each dossier lists its essential (core) and further (ext) exercises.
  SF.levels = { B: T("esencial", "essential"), E: T("completo", "full"), A: T("con ampliación", "with extension") };

  SF.dossiers = [
    // ------------------------------------------------------------------------------ episode 1
    {
      episode: 1, family: "countdown", core: ["1.1", "1.5"], ext: ["1.2", "1.3", "1.4"], writers: ["vera"],
      question: T("¿Cuándo empezó a trabajar quien manipuló el proyecto?", "When did the person who tampered with the project start working?"),
      bible: {
        version: "v3",
        items: [
          [T("Escena 1.12", "Scene 1.12"), T("Alarma de sellado. El pitido $n$ suena en el instante $t_n = 60n/(n+1)$ segundos desde que se activa la alarma. Los pitidos se oyen cada vez más juntos; en el segundo 60 la puerta se sella.", "Sealing alarm. Beep $n$ sounds at time $t_n = 60n/(n+1)$ seconds after the alarm starts. The beeps sound closer and closer together; at second 60 the door seals.")],
          [T("Efecto 1.12a", "Effect 1.12a"), T("Destello rojo con cada pitido. Cuando dos pitidos quedan a menos de un fotograma (1/24 s), se funden en un tono continuo hasta el corte.", "A red flash with each beep. When two beeps fall less than one frame apart (1/24 s), they merge into a continuous tone until the cut.")],
          [T("Escena 1.20", "Scene 1.20"), T("La red de observación: diez anillos de cámaras alrededor de la Zona. El primero tiene 6 cámaras y cada anillo tiene 4 más que el anterior.", "The observation network: ten rings of cameras around the Zone. The first holds 6 cameras and each ring holds 4 more than the one before.")],
          [T("Render", "Render"), T("Los planos con anillos de eco volumétricos usan el perfil ZENO-VOL-3. El coste de cada fotograma depende del número de anillos que se ven en él.", "Shots with volumetric echo rings use the ZENO-VOL-3 profile. The cost of each frame depends on the number of rings it shows.")],
        ],
      },
      script: {
        heading: T("12. INT. SALA DE CONTROL — NOCHE", "12. INT. CONTROL ROOM — NIGHT"),
        lines: [
          ["", T("La alarma pita. Cada pitido llega antes que el anterior. En la pantalla, una cuenta atrás que no baja de forma regular.", "The alarm beeps. Each beep comes sooner than the last. On the screen, a countdown that does not fall at a steady pace.")],
          ["HALDEN", T("No termina nunca. Siempre queda un pitido más. Es Zenón, Irene: la cuenta atrás perfecta.", "It never ends. There is always one more beep. It's Zeno, Irene: the perfect countdown.")],
          ["IRENE", T("(sin apartar la vista del reloj) Cuenta cuántos caben antes del segundo 59.", "(eyes on the clock) Count how many fit before second 59.")],
          ["TOM", T("Cincuenta y ocho.", "Fifty-eight.")],
          ["IRENE", T("¿Y antes del 59.9?", "And before 59.9?")],
          ["TOM", T("Quinientos noventa y ocho…", "Five hundred and ninety-eight…")],
          ["IRENE", T("Infinitos pitidos, Viktor. Y todos antes del segundo 60. (Se oye un golpe seco: la puerta.) Ya está.", "Infinitely many beeps, Viktor. And all of them before second 60. (A dull thud: the door.) That's it.")],
        ],
      },
      evidence: {
        id: "render", title: T("Registro del servidor de render", "Render server log"),
        intro: T("El servidor de render de la sala de montaje (planta 3) conserva una línea por trabajo terminado. Esta es la única línea de la noche del {D0weekday} al {D1weekday}. La línea de inicio se guardaba en el diario de la estación, que alguien ha manipulado.", "The render server of the editing suite (floor 3) keeps one line per finished job. This is the only line for the night of {D0weekday} to {D1weekday}. The start line was kept in the workstation journal, which someone has tampered with."),
        manual: T("Perfil ZENO-VOL-3 (manual de Ferro VFX): el primer fotograma de un plano con anillos de eco tarda {renderFirst} s; cada fotograma siguiente tarda {renderStep} s más que el anterior, porque se ve un anillo más.", "ZENO-VOL-3 profile (Ferro VFX manual): the first frame of a shot with echo rings takes {renderFirst} s; each following frame takes {renderStep} s longer than the previous one, because one more ring is visible."),
      },
      exercises: [
        { id: "1.1", level: "B", text: T("Calcula los seis primeros instantes $t_n = 60n/(n+1)$. ¿La sucesión es creciente? ¿Está acotada? Justifícalo con la diferencia $t_{n+1} - t_n$.", "Compute the first six instants $t_n = 60n/(n+1)$. Is the sequence increasing? Is it bounded? Justify it with the difference $t_{n+1} - t_n$."),
          answers: [
            { key: "t1", label: "t_1", type: "number", ref: "e1.t", arg: 1 }, { key: "t2", label: "t_2", type: "number", ref: "e1.t", arg: 2 },
            { key: "t3", label: "t_3", type: "number", ref: "e1.t", arg: 3 }, { key: "t6", label: "t_6", type: "number", ref: "e1.t", arg: 6, decimals: 2 },
            { key: "diff", label: T("Expresión de $t_{n+1} - t_n$", "Expression for $t_{n+1} - t_n$"), type: "expression", ref: "e1.gapExpr" },
            { key: "why", label: T("Justificación", "Justification"), type: "justification", criteria: ["sign-of-difference", "upper-bound"] },
          ] },
        { id: "1.2", level: "B", text: T("¿Cuántos pitidos suenan antes del segundo 59? ¿Y antes del 59.9? ¿Suena algún pitido en el segundo 60?", "How many beeps sound before second 59? And before 59.9? Does any beep sound at second 60?"),
          answers: [
            { key: "b59", label: T("Antes de 59 s", "Before 59 s"), type: "integer", ref: "e1.beepsBefore", arg: 59 },
            { key: "b599", label: T("Antes de 59.9 s", "Before 59.9 s"), type: "integer", ref: "e1.beepsBefore", arg: 59.9 },
            { key: "at60", label: T("¿Pitido en 60 s?", "A beep at 60 s?"), type: "choice", options: ["yes", "no"], ref: "e1.beepAt60" },
          ] },
        { id: "1.3", level: "E", text: T("Halden dice: «la cuenta atrás nunca terminará». Separa lo que es verdad de lo que es falso, distinguiendo el número de pitidos del tiempo que tardan en sonar.", "Halden says: “the countdown will never end.” Separate what is true from what is false, distinguishing the number of beeps from the time they take to sound."),
          answers: [
            { key: "limit", label: T("$\\lim t_n$", "$\\lim t_n$"), type: "number", ref: "e1.limit" },
            { key: "count", label: T("Número de pitidos", "Number of beeps"), type: "choice", options: ["finite", "infinite"], ref: "e1.infinitelyMany" },
            { key: "why", label: T("Explicación", "Explanation"), type: "justification", criteria: ["infinitely-many-events", "finite-time"] },
          ] },
        { id: "1.4", level: "E", text: T("Los huecos entre pitidos son $g_n = t_{n+1} - t_n$. Calcula $g_1, \\ldots, g_4$ y la suma de los $N$ primeros. ¿Cuánto suman todos? ¿Por qué no es sorprendente?", "The gaps between beeps are $g_n = t_{n+1} - t_n$. Compute $g_1, \\ldots, g_4$ and the sum of the first $N$. What do they all add up to? Why is that not surprising?"),
          answers: [
            { key: "g1", label: "g_1", type: "number", ref: "e1.gap", arg: 1 }, { key: "g4", label: "g_4", type: "number", ref: "e1.gap", arg: 4 },
            { key: "SN", label: T("Suma de los $N$ primeros (en función de $N$)", "Sum of the first $N$ (in terms of $N$)"), type: "expression", variable: "N", ref: "e1.gapSumExpr" },
            { key: "all", label: T("Suma de todos los huecos", "Sum of all gaps"), type: "number", ref: "e1.gapTotal" },
          ] },
        { id: "1.5", level: "B", text: T("El primer anillo de cámaras tiene 6 y cada anillo tiene 4 más que el anterior. ¿Cuántas cámaras tiene el anillo 10? ¿Cuántas hay en total en diez anillos? ¿Cuántos anillos harían falta para tener exactamente 240 cámaras si no supieras que son diez?", "The first ring holds 6 cameras and each ring holds 4 more than the one before. How many cameras does ring 10 hold? How many are there in all ten rings? How many rings would be needed for exactly 240 cameras if you did not know there were ten?"),
          answers: [
            { key: "r10", label: T("Anillo 10", "Ring 10"), type: "integer", ref: "e1.ringTerm", arg: 10 },
            { key: "tot", label: T("Total", "Total"), type: "integer", ref: "e1.ringSum", arg: 10 },
            { key: "n", label: T("Anillos para 240", "Rings for 240"), type: "integer", ref: "e1.ringsFor240" },
          ] },
        { id: "1.6", level: "E", evidence: true, text: T("Prueba forense. El trabajo TRL_ALT_07 tenía {renderFrames} fotogramas y terminó a la {renderFinish}. Con el perfil ZENO-VOL-3, ¿cuánto duró y a qué hora empezó? ¿Qué hora saldría si todos los fotogramas costaran {renderFirst} s? ¿Y si todos costaran lo que el último?", "Forensic exhibit. Job TRL_ALT_07 had {renderFrames} frames and finished at {renderFinish}. With the ZENO-VOL-3 profile, how long did it take and when did it start? What time would you get if every frame took {renderFirst} s? And if every frame took as long as the last one?"),
          answers: [
            { key: "last", label: T("Coste del último fotograma (s)", "Cost of the last frame (s)"), type: "number", ref: "render.last" },
            { key: "dur", label: T("Duración (h:min:s)", "Duration (h:min:s)"), type: "duration", ref: "render.duration" },
            { key: "start", label: T("Hora de inicio", "Start time"), type: "clock", ref: "render.start" },
            { key: "naive", label: T("Inicio si todos costaran {renderFirst} s", "Start if all took {renderFirst} s"), type: "clock", ref: "render.naiveStart" },
            { key: "lastAll", label: T("Inicio si todos costaran lo que el último", "Start if all took as long as the last"), type: "clock", ref: "render.lastStart" },
          ] },
        { id: "1.7", level: "A", text: T("Una cuenta atrás de la forma $t_n = Tn/(n+c)$ dura $T$ segundos. ¿Para qué valores de $c$ suenan exactamente $k$ pitidos en la primera mitad? Aplícalo al arranque del tráiler: $T = 10$ y entre 4 y 8 pitidos antes de 5 s.", "A countdown of the form $t_n = Tn/(n+c)$ lasts $T$ seconds. For which values of $c$ do exactly $k$ beeps sound in the first half? Apply it to the cold open of the trailer: $T = 10$ and between 4 and 8 beeps before 5 s."),
          answers: [{ key: "lo", label: T("$c$ mayor que", "$c$ greater than"), type: "number", ref: "e1.cLow" }, { key: "hi", label: T("$c$ como mucho", "$c$ at most"), type: "number", ref: "e1.cHigh" }] },
      ],
      challenge: {
        segments: ["S0", "S1"],
        title: T("Diseñad la cuenta atrás y la red de cámaras del tráiler", "Design the trailer's countdown and camera network"),
        story: T("Ferro VFX necesita una versión limpia del arranque del tráiler. La biblia no fija la cuenta atrás del arranque ni el reparto de las cámaras, solo sus reglas: elegid vosotros los parámetros, comprobad las reglas y justificad la elección.", "Ferro VFX needs a clean version of the trailer's cold open. The bible does not fix the cold-open countdown or the layout of the cameras, only their rules: choose the parameters yourselves, check the rules and justify your choice."),
        rules: [
          T("S0: una sucesión creciente de instantes con límite 10 s, la duración del plano ($t_n = 10n/(n+c)$ o $t_n = 10(1 - q^n)$).", "S0: an increasing sequence of instants with limit 10 s, the length of the shot ($t_n = 10n/(n+c)$ or $t_n = 10(1 - q^n)$)."),
          T("S0: entre 4 y 8 pitidos en los primeros 5 s, y el primero a partir de 1 s.", "S0: between 4 and 8 beeps in the first 5 s, and the first at 1 s or later."),
          T("S1: exactamente 240 cámaras en anillos que forman una progresión aritmética: al menos 6 anillos, al menos 4 cámaras en el primero y cada anillo con más cámaras que el anterior.", "S1: exactly 240 cameras in rings that form an arithmetic progression: at least 6 rings, at least 4 cameras in the first one and each ring with more cameras than the one before."),
        ],
        deliver: T("Vuestros parámetros de los dos planos y la comprobación de cada regla.", "Your parameters for both shots and the check of every rule."),
      },
      prepare: [
        T("Para la creadora del episodio: ¿por qué la alarma termina aunque tenga infinitos pitidos?", "For the creator of the episode: why does the alarm end although it has infinitely many beeps?"),
        T("Para quien conozca el render: ¿cuesta lo mismo cada fotograma de un plano con anillos de eco?", "For whoever knows the render: does every frame of a shot with echo rings cost the same?"),
        T("Para todos: ¿quién estaba en la planta 3 a la hora a la que empezó el render?", "For everyone: who was on floor 3 at the time the render started?"),
      ],
    },

    // ------------------------------------------------------------------------------ episode 2
    {
      episode: 2, family: "geometric", core: ["2.1", "2.2"], ext: ["2.3", "2.4"], writers: ["hugo"],
      question: T("¿De qué copia del final sale el vídeo filtrado, y es auténtico?", "Which copy of the finale does the leaked video come from, and is it genuine?"),
      bible: {
        version: "v3",
        items: [
          [T("Decorado", "Set"), T("El pasillo de acceso a la Zona mide 20 m, de la entrada a la puerta del Punto Z.", "The access corridor to the Zone is 20 m long, from the entrance to the door of Point Z.")],
          [T("Efecto 2.3", "Effect 2.3"), T("Anillos de eco. El primer anillo está a $a$ metros de la entrada y cada hueco entre anillos es $r$ veces el anterior: el anillo $k$ está en $x_k = a(1 - r^k)/(1 - r)$. Valores del episodio: $a = 8$ m, $r = 0.6$.", "Echo rings. The first ring lies $a$ metres from the entrance and each gap between rings is $r$ times the previous one: ring $k$ lies at $x_k = a(1 - r^k)/(1 - r)$. Episode values: $a = 8$ m, $r = 0.6$.")],
          [T("Regla", "Rule"), T("Los anillos deben converger exactamente a la puerta (20 m). En las copias de visionado se puede variar $r$ entre 0.55 y 0.70 siempre que se cumpla la regla.", "The rings must converge exactly to the door (20 m). On the screening copies $r$ may vary between 0.55 and 0.70 as long as the rule holds.")],
          [T("Escena 2.14", "Scene 2.14"), T("Persecución: Irene corre a 2 m/s y el Observador a 1.2 m/s, con 8 m de ventaja.", "Chase: Irene runs at 2 m/s and the Observer at 1.2 m/s, with an 8 m head start.")],
        ],
      },
      script: {
        heading: T("14. INT. PASILLO DE ACCESO A LA ZONA — CONTINUO", "14. INT. ACCESS CORRIDOR TO THE ZONE — CONTINUOUS"),
        lines: [
          ["", T("La linterna de Irene corta la niebla. A ocho metros, de espaldas, la silueta del Observador. Irene corre; cada vez que llega adonde estaba la figura, la figura está más lejos.", "Irene's torch cuts through the fog. Eight metres ahead, back turned, the Observer's silhouette. Irene runs; each time she reaches the place where the figure was, the figure is further away.")],
          ["HALDEN (O.S.)", T("Zenón ya lo demostró, Irene. Tienes que llegar adonde estaba, y después adonde ha ido, y así siempre. Nunca lo alcanzarás.", "Zeno proved it long ago, Irene. You have to reach where he was, and then where he has gone, and so on forever. You will never catch him.")],
          ["IRENE", T("Zenón demostró que hacen falta infinitos pasos. No infinitos metros.", "Zeno proved that it takes infinitely many steps. Not infinitely many metres.")],
          ["", T("VFX 2.3: anillos de eco con $a = 8$ m y $r = 0.6$. Irene llega a la puerta en el mismo instante que la figura. La figura ya no está.", "VFX 2.3: echo rings with $a = 8$ m and $r = 0.6$. Irene reaches the door at the same instant as the figure. The figure is gone.")],
        ],
      },
      evidence: {
        id: "leak", title: T("Fotograma del vídeo filtrado", "Frame of the leaked video"),
        intro: T("Fotograma 31 del vídeo publicado en {forum} a las {leakTime} del {D1weekday}. El laboratorio técnico de Nadir ha medido la distancia desde la entrada del pasillo a los cinco anillos de eco visibles, con un error de ±0.01 m.", "Frame 31 of the video posted on {forum} at {leakTime} on {D1weekday}. Nadir's technical lab has measured the distance from the corridor entrance to the five visible echo rings, with an error of ±0.01 m."),
      },
      exercises: [
        { id: "2.1", level: "B", text: T("Con $a = 8$ m y $r = 0.6$, calcula las posiciones de los cinco primeros anillos y una fórmula para $x_n$.", "With $a = 8$ m and $r = 0.6$, compute the positions of the first five rings and a formula for $x_n$."),
          answers: [
            { key: "x1", label: "x_1", type: "number", ref: "e2.x", arg: 1 }, { key: "x2", label: "x_2", type: "number", ref: "e2.x", arg: 2 },
            { key: "x3", label: "x_3", type: "number", ref: "e2.x", arg: 3, decimals: 2 }, { key: "x5", label: "x_5", type: "number", ref: "e2.x", arg: 5, decimals: 2 },
            { key: "xn", label: T("Fórmula de $x_n$", "Formula for $x_n$"), type: "expression", ref: "e2.xExpr" },
          ] },
        { id: "2.2", level: "B", text: T("¿Hacia qué distancia convergen las posiciones? Justifica por qué la fórmula $a/(1-r)$ se puede usar aquí.", "Towards which distance do the positions converge? Justify why the formula $a/(1-r)$ can be used here."),
          answers: [{ key: "S", label: T("Límite (m)", "Limit (m)"), type: "number", ref: "e2.sum" }, { key: "why", label: T("Justificación", "Justification"), type: "justification", criteria: ["abs-r-less-1"] }] },
        { id: "2.3", level: "E", text: T("Irene corre a 2 m/s y el Observador a 1.2 m/s, con 8 m de ventaja. Calcula, sumando la serie de los tramos, dónde y cuándo lo alcanza. Compruébalo con la velocidad relativa.", "Irene runs at 2 m/s and the Observer at 1.2 m/s, with an 8 m head start. By adding the series of stretches, work out where and when she catches him. Check it with the relative speed."),
          answers: [{ key: "where", label: T("Distancia recorrida por Irene (m)", "Distance run by Irene (m)"), type: "number", ref: "e2.chaseDistance" }, { key: "when", label: T("Tiempo (s)", "Time (s)"), type: "number", ref: "e2.chaseTime" }] },
        { id: "2.4", level: "E", text: T("¿Para qué valores de $r$ termina la persecución? ¿Qué ocurre con $r = 1$? Escribe $S_n$ en ese caso.", "For which values of $r$ does the chase end? What happens with $r = 1$? Write $S_n$ in that case."),
          answers: [{ key: "Sn1", label: T("$S_n$ con $r = 1$", "$S_n$ with $r = 1$"), type: "expression", ref: "e2.r1Expr" }, { key: "conv", label: T("¿Converge con $r = 1$?", "Does it converge with $r = 1$?"), type: "choice", options: ["converges", "diverges"], ref: "e2.r1Class" }] },
        { id: "2.5", level: "A", text: T("¿Cuál es el primer anillo situado a menos de 10 cm de la puerta?", "Which is the first ring less than 10 cm from the door?"),
          answers: [{ key: "n", label: T("Anillo", "Ring"), type: "integer", ref: "e2.within10cm" }] },
        { id: "2.6", level: "E", evidence: true, text: T("Prueba forense. Con las distancias medidas en el fotograma filtrado, calcula los huecos entre anillos, la razón $r$ y la suma de la serie. ¿Es coherente con el pasillo de 20 m de la biblia v3? ¿Qué dice eso del vídeo?", "Forensic exhibit. Using the distances measured on the leaked frame, compute the gaps between rings, the ratio $r$ and the sum of the series. Is it consistent with the 20 m corridor of bible v3? What does that say about the video?"),
          answers: [
            { key: "g2", label: T("Segundo hueco (m)", "Second gap (m)"), type: "number", ref: "leak.gap", arg: 2, tol: 0.011 },
            { key: "r", label: "r", type: "number", ref: "leak.r", tol: 0.006 },
            { key: "S", label: T("Suma $a/(1-r)$ (m)", "Sum $a/(1-r)$ (m)"), type: "number", ref: "leak.sum", tol: 0.15 },
            { key: "why", label: T("Conclusión", "Conclusion"), type: "justification", criteria: ["genuine-v3"] },
          ] },
      ],
      challenge: {
        segments: ["S2"],
        title: T("Elegid el eco de vuestra persecución", "Choose the echo of your chase"),
        story: T("En vuestro tráiler, el plano de la persecución puede tener otra razón de eco, como las copias de visionado. Elegidla vosotros.", "In your trailer, the chase shot may use another echo ratio, like the screening copies. Choose it yourselves."),
        rules: [
          T("Los anillos convergen exactamente a la puerta: $a/(1-r) = 20$ m.", "The rings converge exactly to the door: $a/(1-r) = 20$ m."),
          T("Al menos 5 anillos antes de los 19 m, para que se vean apiñarse.", "At least 5 rings before 19 m, so that they can be seen crowding together."),
          T("El primer anillo, a 4 m o más de la entrada.", "The first ring 4 m or more from the entrance."),
        ],
        deliver: T("Vuestros $a$ y $r$, la comprobación de las reglas, y las posiciones de los seis primeros anillos.", "Your $a$ and $r$, the check of the rules and the positions of the first six rings."),
      },
      prepare: [
        T("Para el guionista del episodio: ¿por qué la persecución tenía que acabar exactamente en la puerta?", "For the writer of the episode: why did the chase have to end exactly at the door?"),
        T("Para quien diseñara las copias de visionado: ¿qué cambia de una copia a otra, y por qué el espectador no lo nota?", "For whoever designed the screening copies: what changes from one copy to another, and why does the viewer not notice?"),
        T("Para la montadora: ¿qué copia del final había en el proyecto del tráiler?", "For the editor: which copy of the finale was in the trailer project?"),
      ],
    },

    // ------------------------------------------------------------------------------ episode 3
    {
      episode: 3, family: "harmonic", core: ["3.1", "3.2", "3.3"], ext: [], writers: ["elias"],
      question: T("¿Es auténtico el vídeo filtrado? ¿Dijo la verdad la creadora a la prensa?", "Is the leaked video genuine? Did the creator tell the press the truth?"),
      bible: {
        version: "v3",
        items: [
          [T("Escena 3.8", "Scene 3.8"), T("Más allá de la puerta, el pasillo mide 100 m durante el primer minuto, 200 m durante el segundo, y así sucesivamente: durante el minuto $k$ mide $100k$ m. El estiramiento es uniforme: la fracción del pasillo ya recorrida no cambia al estirarse.", "Beyond the door, the corridor is 100 m long during the first minute, 200 m during the second, and so on: during minute $k$ it is $100k$ m long. The stretching is uniform: the fraction of the corridor already covered does not change when it stretches.")],
          [T("Escena 3.8", "Scene 3.8"), T("La sonda avanza 10 m por minuto respecto al suelo del pasillo.", "The probe crawls 10 m per minute relative to the corridor floor.")],
          [T("Efecto 3.8b", "Effect 3.8b"), T("Contador en pantalla con el minuto y la fracción recorrida. En el final, la sonda llega a la puerta en el minuto 12 367 (cálculo de Tom).", "On-screen counter with the minute and the fraction covered. In the finale, the probe reaches the door in minute 12 367 (Tom's calculation).")],
        ],
      },
      script: {
        heading: T("8. INT. MÁS ALLÁ DE LA PUERTA — CONTINUO", "8. INT. BEYOND THE DOOR — CONTINUOUS"),
        lines: [
          ["", T("Tom deja la sonda en el suelo. Una luz roja diminuta empieza a avanzar por un pasillo que se alarga hacia el horizonte.", "Tom sets the probe on the floor. A tiny red light starts crawling along a corridor that stretches towards the horizon.")],
          ["HALDEN", T("No llegará nunca. Cada minuto recorre una parte más pequeña del pasillo, y esa parte tiende a cero.", "It will never get there. Every minute it covers a smaller part of the corridor, and that part tends to zero.")],
          ["IRENE", T("Más pequeña, pero nunca nada. Tom, ¿cuándo?", "Smaller, but never nothing. Tom, when?")],
          ["TOM", T("(teclea) Minuto doce mil trescientos sesenta y siete. Ocho días y medio.", "(typing) Minute twelve thousand three hundred and sixty-seven. Eight and a half days.")],
          ["", T("En la pantalla arranca un temporizador.", "On the screen, a timer starts.")],
        ],
      },
      evidence: {
        id: "press", title: T("Declaración de Vera Lindqvist a la prensa", "Vera Lindqvist's statement to the press"),
        intro: T("Agencia de noticias, {D1weekday}, 12:00. Cita literal.", "News agency, {D1weekday}, 12:00. Verbatim quote."),
        quote: T("«Ese vídeo es un montaje de fans. En el final de ZENO, la sonda nunca alcanza el Punto Z: es matemáticamente imposible, porque el pasillo crece diez veces más deprisa de lo que avanza la sonda. Lo que se ve en el vídeo, la sonda en la puerta, no puede pasar en nuestra serie».", "“That video is a fan fake. In the ZENO finale the probe never reaches Point Z: it is mathematically impossible, because the corridor grows ten times faster than the probe moves. What the video shows, the probe at the door, cannot happen in our show.”"),
      },
      exercises: [
        { id: "3.1", level: "B", text: T("Explica por qué, en el minuto $k$, la sonda recorre $1/(10k)$ del pasillo. Escribe la fracción $F_n$ recorrida al cabo de $n$ minutos y calcula $F_1, \\ldots, F_4$.", "Explain why, in minute $k$, the probe covers $1/(10k)$ of the corridor. Write the fraction $F_n$ covered after $n$ minutes and compute $F_1, \\ldots, F_4$."),
          answers: [
            { key: "F1", label: "F_1", type: "number", ref: "e3.F", arg: 1 }, { key: "F2", label: "F_2", type: "number", ref: "e3.F", arg: 2 },
            { key: "F4", label: "F_4", type: "number", ref: "e3.F", arg: 4, decimals: 3 },
          ] },
        { id: "3.2", level: "E", text: T("Halden dice que, como lo que avanza cada minuto tiende a cero, la sonda no llegará nunca. ¿Dónde está el error?", "Halden says that since what the probe covers each minute tends to zero, it will never arrive. Where is the mistake?"),
          answers: [{ key: "terms", label: T("Los términos $1/(10k)$…", "The terms $1/(10k)$…"), type: "choice", options: ["tend-to-0", "do-not-tend-to-0"], ref: "e3.termsToZero" }, { key: "series", label: T("La serie $\\sum 1/k$…", "The series $\\sum 1/k$…"), type: "choice", options: ["converges", "diverges"], ref: "e3.harmonicClass" }, { key: "why", label: T("Explicación", "Explanation"), type: "justification", criteria: ["necessary-not-sufficient"] }] },
        { id: "3.3", level: "E", text: T("Agrupa los términos de $H_n = 1 + 1/2 + 1/3 + \\cdots$ en bloques que terminan en 2, 4, 8, 16… para demostrar que $H_{2^k} \\ge 1 + k/2$. Deduce que la sonda llega.", "Group the terms of $H_n = 1 + 1/2 + 1/3 + \\cdots$ into blocks ending at 2, 4, 8, 16… to prove that $H_{2^k} \\ge 1 + k/2$. Deduce that the probe arrives."),
          answers: [{ key: "block", label: T("Cada bloque suma al menos", "Each block adds at least"), type: "number", ref: "e3.blockMin" }, { key: "k", label: T("$k$ que garantiza $H_{2^k} \\ge 10$", "$k$ that guarantees $H_{2^k} \\ge 10$"), type: "integer", ref: "e3.kFor10" }] },
        { id: "3.4", level: "A", text: T("Demuestra que $H_{2^k - 1} \\le k$. Deduce que la sonda no puede llegar antes del minuto 1024 y que llega como muy tarde en el minuto $2^{18}$. ¿Es creíble el minuto 12 367 que calcula Tom? ¿Cuántos días, horas y minutos son?", "Prove that $H_{2^k - 1} \\le k$. Deduce that the probe cannot arrive before minute 1024 and that it arrives by minute $2^{18}$ at the latest. Is Tom's minute 12 367 believable? How many days, hours and minutes is it?"),
          answers: [{ key: "lo", label: T("No antes del minuto", "Not before minute"), type: "integer", ref: "e3.earliest" }, { key: "hi", label: T("Como muy tarde, el minuto", "At the latest, minute"), type: "integer", ref: "e3.latest" }, { key: "days", label: T("12 367 min en días (con decimales)", "12 367 min in days (decimal)"), type: "number", ref: "e3.days", tol: 0.005 }] },
        { id: "3.5", level: "E", evidence: true, text: T("Prueba forense. Analiza la declaración de Vera Lindqvist. ¿Es verdad que la sonda no puede llegar? ¿Qué dice la biblia de efectos? ¿Prueba la declaración que el vídeo es falso?", "Forensic exhibit. Analyse Vera Lindqvist's statement. Is it true that the probe cannot arrive? What does the effects bible say? Does the statement prove that the video is fake?"),
          answers: [{ key: "true", label: T("¿Es cierta la afirmación matemática?", "Is the mathematical claim true?"), type: "choice", options: ["true", "false"], ref: "e3.claimTrue" }, { key: "why", label: T("Conclusión", "Conclusion"), type: "justification", criteria: ["harmonic-diverges", "consistent-with-bible"] }] },
      ],
      challenge: {
        segments: ["S3"],
        title: T("Diseñad la cuerda de vuestro tráiler", "Design the rope of your trailer"),
        story: T("En el tráiler, el plano de la sonda dura unos segundos, pero su contador anuncia cuándo llegará. Elegid la velocidad $c$ de la sonda y el crecimiento $L$ del pasillo.", "In the trailer, the probe shot lasts a few seconds, but its counter announces when it will arrive. Choose the probe's speed $c$ and the corridor's growth $L$."),
        rules: [
          T("El pasillo crece más deprisa de lo que avanza la sonda ($L > c$), y aun así la sonda llega: demostradlo.", "The corridor grows faster than the probe moves ($L > c$), and still the probe arrives: prove it."),
          T("Con las cotas por agrupación, demostrad que llega antes del día 9 (minuto 12 960) y que no llega en la primera hora.", "Using the grouping bounds, prove that it arrives before day 9 (minute 12 960) and that it does not arrive within the first hour."),
        ],
        deliver: T("Vuestros $c$ y $L$, las dos cotas demostradas, y el minuto de llegada calculado (indicando que es un cálculo).", "Your $c$ and $L$, the two proved bounds and the computed arrival minute (saying that it is a computation)."),
      },
      prepare: [
        T("Para el asesor matemático: ¿por qué llega la sonda si el pasillo crece más deprisa?", "For the mathematics adviser: why does the probe arrive if the corridor grows faster?"),
        T("Para la creadora: ¿por qué dijo a la prensa que la sonda no llega nunca?", "For the creator: why did she tell the press that the probe never arrives?"),
      ],
    },

    // ------------------------------------------------------------------------------ episode 4
    {
      episode: 4, family: "telescoping", core: ["4.1", "4.2"], ext: ["4.3"], writers: ["elias", "vera"],
      question: T("¿Falta algo en el diario del proyecto del tráiler? ¿Cuándo?", "Is anything missing from the trailer project journal? When?"),
      bible: {
        version: "v3",
        items: [
          [T("Escena 4.6", "Scene 4.6"), T("Registro de la Observación 7. La línea $k$ anota la coherencia perdida en la observación $k$: $\\Delta_k = c_k - c_{k+1}$, con $c_k = 1/k$. Es decir, $\\Delta_k = 1/(k(k+1))$.", "Log of Observation 7. Line $k$ records the coherence lost at observation $k$: $\\Delta_k = c_k - c_{k+1}$, with $c_k = 1/k$. That is, $\\Delta_k = 1/(k(k+1))$.")],
          [T("Escena 4.6", "Scene 4.6"), T("Se conservan las seis primeras líneas y el pie: «coherencia final del ciclo: 0.004».", "The first six lines and the footer survive: “final coherence of the cycle: 0.004”.")],
          [T("Efecto 4.6a", "Effect 4.6a"), T("Las líneas se tachan por parejas: el $-1/(k+1)$ de una línea con el $+1/(k+1)$ de la siguiente. Quedan la primera y la última lectura.", "The lines strike each other out in pairs: the $-1/(k+1)$ of one line against the $+1/(k+1)$ of the next. The first and the last readings remain.")],
        ],
      },
      script: {
        heading: T("6. INT. ARCHIVO DEL LABORATORIO — NOCHE", "6. INT. LABORATORY ARCHIVE — NIGHT"),
        lines: [
          ["TOM", T("Lo ha borrado casi todo. Quedan seis líneas y el pie.", "He has deleted almost everything. Six lines and the footer are left.")],
          ["IRENE", T("Con eso basta. Mira: cada línea se come la mitad de la siguiente.", "That's enough. Look: each line eats half of the next one.")],
          ["", T("Las líneas se tachan en la pantalla hasta que solo quedan dos números.", "The lines strike each other out on the screen until only two numbers remain.")],
          ["IRENE", T("Doscientas cuarenta y nueve observaciones por ciclo. Y tenemos doscientas cuarenta cámaras.", "Two hundred and forty-nine observations per cycle. And we have two hundred and forty cameras.")],
          ["TOM", T("Entonces hay nueve que no son nuestras.", "Then there are nine that aren't ours.")],
        ],
      },
      evidence: {
        id: "journal", title: T("Diario del proyecto del tráiler", "Trailer project journal"),
        intro: T("Archivo ZENO_TRAILER.mtg, cuenta compartida «promo_edit». El programa de montaje lleva un contador acumulado del tiempo que el proyecto ha estado abierto. Cada vez que se guarda y se cierra, el diario anota la fecha, la hora y el tiempo de esa sesión. La cabecera conserva el contador total en el último guardado.", "File ZENO_TRAILER.mtg, shared account “promo_edit”. The editing program keeps a running counter of the time the project has been open. Each time the project is saved and closed, the journal records the date, the time and the length of that session. The header keeps the total counter at the last save."),
        manual: T("Manual del programa: el diario nunca fusiona sesiones; cada apertura del proyecto genera una línea.", "Program manual: the journal never merges sessions; each opening of the project generates one line."),
      },
      exercises: [
        { id: "4.1", level: "B", text: T("Comprueba que $1/(k(k+1)) = 1/k - 1/(k+1)$ y suma las seis primeras líneas del registro.", "Check that $1/(k(k+1)) = 1/k - 1/(k+1)$ and add the first six lines of the log."),
          answers: [{ key: "S6", label: T("Suma de seis líneas (fracción o decimal)", "Sum of six lines (fraction or decimal)"), type: "number", ref: "e4.S", arg: 6, decimals: 4 }] },
        { id: "4.2", level: "B", text: T("Escribe la suma $S_N$ de las $N$ primeras líneas y calcula la suma de la serie. ¿Qué significa en la historia?", "Write the sum $S_N$ of the first $N$ lines and compute the sum of the series. What does it mean in the story?"),
          answers: [{ key: "SN", label: T("$S_N$ en función de $N$", "$S_N$ in terms of $N$"), type: "expression", variable: "N", ref: "e4.SExpr" }, { key: "S", label: T("Suma de la serie", "Sum of the series"), type: "number", ref: "e4.total" }] },
        { id: "4.3", level: "E", text: T("La coherencia final del ciclo fue 0.004. ¿Cuántas observaciones hubo en el ciclo? Compáralo con las 240 cámaras.", "The final coherence of the cycle was 0.004. How many observations were there in the cycle? Compare it with the 240 cameras."),
          answers: [{ key: "N", label: T("Observaciones", "Observations"), type: "integer", ref: "e4.N" }, { key: "extra", label: T("Observaciones sin cámara", "Observations without a camera"), type: "integer", ref: "e4.extra" }] },
        { id: "4.4", level: "A", text: T("Da un ejemplo en el que $\\sum_{k=1}^{N} (b_k - b_{k+1}) = b_1 - b_{N+1}$ para todo $N$ y, sin embargo, la serie diverja. ¿Qué condición hace falta para que la serie telescópica converja?", "Give an example where $\\sum_{k=1}^{N} (b_k - b_{k+1}) = b_1 - b_{N+1}$ for every $N$ and yet the series diverges. What condition is needed for the telescoping series to converge?"),
          answers: [{ key: "why", label: T("Ejemplo y condición", "Example and condition"), type: "justification", criteria: ["bk-must-converge"] }] },
        { id: "4.5", level: "E", evidence: true, text: T("Prueba forense. Suma las sesiones del diario y compáralo con el contador total de la cabecera. ¿Falta alguna sesión? ¿Cuánto duró, cuándo empezó y cuándo terminó? ¿Por qué se puede afirmar sin ver la sesión borrada?", "Forensic exhibit. Add up the sessions in the journal and compare the result with the total counter in the header. Is a session missing? How long did it last, when did it start and when did it end? Why can you state this without seeing the deleted session?"),
          answers: [
            { key: "sum", label: T("Suma de las sesiones listadas", "Sum of the listed sessions"), type: "duration", ref: "journal.listed" },
            { key: "miss", label: T("Tiempo que falta", "Missing time"), type: "duration", ref: "journal.missing" },
            { key: "open", label: T("Apertura de la sesión borrada", "Opening of the deleted session"), type: "clock", ref: "journal.opened" },
            { key: "why", label: T("Razonamiento", "Reasoning"), type: "justification", criteria: ["telescoping-counter"] },
          ] },
      ],
      challenge: {
        segments: ["S4"],
        title: T("Diseñad el registro que se borra solo", "Design the log that erases itself"),
        story: T("En el tráiler, las líneas del registro se tachan por parejas y queda un único número: la coherencia total. Elegid vuestro registro telescópico.", "In the trailer, the lines of the log strike each other out in pairs and a single number remains: the total coherence. Choose your own telescoping log."),
        rules: [
          T("Las líneas son $b_k - b_{k+1}$, con $b_k = A/(k+m)$ o con $b_k = Aq^{k-1}$, y $b_k$ tiende a 0.", "The lines are $b_k - b_{k+1}$, with $b_k = A/(k+m)$ or with $b_k = Aq^{k-1}$, and $b_k$ tends to 0."),
          T("La coherencia total, la suma de la serie, está entre 0.5 y 2.", "The total coherence, the sum of the series, lies between 0.5 and 2."),
          T("Tras 9 líneas se ha revelado al menos el 80 % del total.", "After 9 lines at least 80% of the total has been revealed."),
        ],
        deliver: T("Vuestra elección, la suma de la serie con el razonamiento telescópico y la comprobación del 80 %.", "Your choice, the sum of the series with the telescoping argument and the 80% check."),
      },
      prepare: [
        T("Para el asesor matemático: ¿puede el programa de montaje fusionar dos sesiones en una?", "For the mathematics adviser: can the editing program merge two sessions into one?"),
        T("Para la montadora: ¿cuándo cerró el proyecto por última vez el {D0weekday}?", "For the editor: when did she last close the project on {D0weekday}?"),
      ],
    },

    // ------------------------------------------------------------------------------ episode 5
    {
      episode: 5, family: "pseries", core: ["5.1", "5.3"], ext: ["5.2"], writers: ["nadia"],
      question: T("¿De qué versión de la biblia salen los planos del montaje alternativo?", "Which version of the bible do the alternative cut's shots come from?"),
      bible: {
        version: "v3",
        items: [
          [T("Escena 5.21", "Scene 5.21"), T("Dosímetros. En el minuto $n$, Sara recibe $1/n$ unidades de dosis e Irene $1/n^2$. Umbral letal: 2 unidades acumuladas.", "Dosimeters. In minute $n$, Sara receives $1/n$ dose units and Irene $1/n^2$. Lethal threshold: 2 accumulated units.")],
          [T("Regla", "Rule"), T("La dosis de Sara debe superar 2 en pocos minutos (tiene que volver). La de Irene no debe llegar nunca a 2 (sigue sola hasta el final).", "Sara's dose must exceed 2 within a few minutes (she has to turn back). Irene's must never reach 2 (she goes on alone to the end).")],
          [T("Efecto 5.21a", "Effect 5.21a"), T("Dos barras verticales con la dosis acumulada minuto a minuto y una línea roja en 2. Alarma cuando una barra la cruza.", "Two vertical bars with the dose accumulated minute by minute and a red line at 2. An alarm when a bar crosses it.")],
        ],
        v1: [[T("Escena 5.21 (v1)", "Scene 5.21 (v1)"), T("Sara, $1/n$; Irene, $1/n^2$. Umbral 2.", "Sara, $1/n$; Irene, $1/n^2$. Threshold 2.")]],
      },
      script: {
        heading: T("21. INT. BORDE DE LA ZONA — DÍA", "21. INT. EDGE OF THE ZONE — DAY"),
        lines: [
          ["HALDEN (O.S.)", T("Vuestras dosis bajan cada minuto. Estáis a salvo, las dos.", "Your doses drop every minute. You are both safe.")],
          ["IRENE", T("Bajar no basta. (mira el dosímetro de Sara) Sara, tienes que volver.", "Dropping is not enough. (looks at Sara's dosimeter) Sara, you have to go back.")],
          ["SARA", T("¿Y tú?", "And you?")],
          ["IRENE", T("La mía no llegará nunca a dos. La tuya ya ha llegado.", "Mine will never reach two. Yours already has.")],
          ["", T("La alarma de Sara suena en el cuarto minuto.", "Sara's alarm goes off in the fourth minute.")],
        ],
      },
      evidence: {
        id: "altS5", title: T("Montaje alternativo «TRL_ALT_AS» · plano S5", "Alternative cut “TRL_ALT_AS” · shot S5"),
        intro: T("Fotogramas exportados por seguridad de Meridiano del plano S5 de la secuencia alternativa. Lecturas del dosímetro de Irene en los minutos que muestra el plano.", "Frames exported by Meridian security from shot S5 of the alternative sequence. Readings of Irene's dosimeter at the minutes the shot shows."),
      },
      exercises: [
        { id: "5.1", level: "B", text: T("Calcula las dosis acumuladas de Sara ($1/n$) y de Irene ($1/n^2$) hasta el minuto 6. ¿En qué minuto supera Sara el umbral 2?", "Compute Sara's ($1/n$) and Irene's ($1/n^2$) accumulated doses up to minute 6. In which minute does Sara exceed the threshold 2?"),
          answers: [
            { key: "s4", label: T("Sara, minuto 4", "Sara, minute 4"), type: "number", ref: "e5.S", arg: [1, 4], decimals: 3 },
            { key: "i4", label: T("Irene, minuto 4", "Irene, minute 4"), type: "number", ref: "e5.S", arg: [2, 4], decimals: 3 },
            { key: "cross", label: T("Minuto en que Sara supera 2", "Minute when Sara exceeds 2"), type: "integer", ref: "e5.cross", arg: 1 },
          ] },
        { id: "5.2", level: "E", text: T("Demuestra que la dosis de Sara acaba superando cualquier umbral.", "Prove that Sara's dose eventually exceeds any threshold."),
          answers: [{ key: "why", label: T("Demostración", "Proof"), type: "justification", criteria: ["harmonic-diverges"] }] },
        { id: "5.3", level: "E", text: T("Demuestra que la dosis de Irene no llega nunca a 2. Pista: para $n \\ge 2$, compara $1/n^2$ con $1/(n(n-1))$.", "Prove that Irene's dose never reaches 2. Hint: for $n \\ge 2$, compare $1/n^2$ with $1/(n(n-1))$."),
          answers: [{ key: "bound", label: T("Cota de $S_n$ en función de $n$", "Bound for $S_n$ in terms of $n$"), type: "expression", ref: "e5.boundExpr" }, { key: "why", label: T("Demostración", "Proof"), type: "justification", criteria: ["telescoping-comparison"] }] },
        { id: "5.4", level: "A", text: T("¿Para qué valores de $p$ converge $\\sum 1/n^p$? Demuéstralo agrupando los términos en bloques de $2^j$.", "For which values of $p$ does $\\sum 1/n^p$ converge? Prove it by grouping the terms in blocks of $2^j$."),
          answers: [{ key: "p", label: T("Converge si y solo si $p >$", "Converges if and only if $p >$"), type: "number", ref: "e5.pCrit" }, { key: "why", label: T("Demostración", "Proof"), type: "justification", criteria: ["condensation"] }] },
        { id: "5.5", level: "A", text: T("Con $p = 1.5$, la serie converge. ¿Está Irene a salvo? Calcula las sumas parciales hasta que lo sepas.", "With $p = 1.5$ the series converges. Is Irene safe? Compute partial sums until you know."),
          answers: [{ key: "cross", label: T("Minuto en que superaría 2", "Minute when it would exceed 2"), type: "integer", ref: "e5.cross", arg: 1.5 }] },
        { id: "5.6", level: "E", evidence: true, text: T("Prueba forense. Con las lecturas del dosímetro de Irene en el montaje alternativo, averigua el exponente $p$ que se usó. ¿Coincide con las biblias v1 y v3? ¿Qué se puede concluir sobre quien rehízo el plano?", "Forensic exhibit. From the readings of Irene's dosimeter in the alternative cut, find the exponent $p$ that was used. Does it match bibles v1 and v3? What can be concluded about whoever remade the shot?"),
          answers: [
            { key: "p", label: "p", type: "number", ref: "alt.p", tol: 0.02 },
            { key: "match", label: T("¿Coincide con v1 o v3?", "Does it match v1 or v3?"), type: "choice", options: ["yes", "no"], ref: "alt.pMatches" },
            { key: "why", label: T("Conclusión", "Conclusion"), type: "justification", criteria: ["other-version"] },
          ] },
      ],
      challenge: {
        segments: ["S5"],
        title: T("Elegid las dosis", "Choose the doses"),
        story: T("En vuestro tráiler, los dosímetros pueden seguir otras series. Elegid la dosis $D$ del primer minuto (la misma para las dos) y los exponentes de Sara y de Irene.", "In your trailer, the dosimeters may follow other series. Choose the first-minute dose $D$ (the same for both) and Sara's and Irene's exponents."),
        rules: [
          T("$D$ entre 0.5 y 1.5.", "$D$ between 0.5 and 1.5."),
          T("La dosis de Sara supera 2 antes del minuto 10.", "Sara's dose exceeds 2 by minute 10."),
          T("La dosis de Irene no llega nunca a 2, y lo demostráis (comparación telescópica, agrupación en bloques o suma parcial más cota de la cola). Una simulación no basta.", "Irene's dose never reaches 2, and you prove it (telescoping comparison, grouping in blocks, or a partial sum plus a bound for the tail). A simulation is not enough."),
        ],
        deliver: T("Vuestros $D$, $p_S$ y $p_I$, el minuto de la alarma de Sara y la demostración para Irene.", "Your $D$, $p_S$ and $p_I$, the minute of Sara's alarm and the proof for Irene."),
      },
      prepare: [
        T("Para la guionista del episodio: ¿por qué Sara tiene que volver e Irene puede seguir, si las dos dosis bajan cada minuto?", "For the writer of the episode: why does Sara have to turn back while Irene can go on, if both doses drop every minute?"),
        T("Para quien conozca las versiones de la biblia: ¿hubo alguna versión en la que Irene tuviera otro exponente? ¿Quién la recibió?", "For whoever knows the versions of the bible: was there a version in which Irene had another exponent? Who received it?"),
      ],
    },

    // ------------------------------------------------------------------------------ episode 6
    {
      episode: 6, family: "alternating", core: ["6.1", "6.3"], ext: ["6.2", "6.4"], writers: ["hugo"],
      question: T("¿El plano S6 del montaje alternativo es compatible con el pasillo construido?", "Is shot S6 of the alternative cut compatible with the corridor that was built?"),
      bible: {
        version: "v3",
        items: [
          [T("Escena 6.30", "Scene 6.30"), T("Baliza de Leo. En la oscilación $k$ se desplaza $12/k$ m, alternando avance y retroceso: $+12, -6, +4, -3, \\ldots$ La posición tras $n$ oscilaciones es $S_n = 12\\,(1 - 1/2 + 1/3 - \\cdots \\pm 1/n)$.", "Leo's beacon. In swing $k$ it moves $12/k$ m, alternating forward and back: $+12, -6, +4, -3, \\ldots$ The position after $n$ swings is $S_n = 12\\,(1 - 1/2 + 1/3 - \\cdots \\pm 1/n)$.")],
          [T("Decorado", "Set"), T("La hornacina está a 8.3 m de la entrada del pasillo de 20 m. La baliza debe asentarse en ella.", "The alcove lies 8.3 m from the entrance of the 20 m corridor. The beacon must settle in it.")],
          [T("Efecto 6.30b", "Effect 6.30b"), T("Estela del camino recorrido, que no deja de crecer.", "A trail of the path walked, which keeps growing.")],
        ],
        v1: [[T("Escena 6.30 (v1)", "Scene 6.30 (v1)"), T("Pasillo de 25 m. Desplazamientos $15/k$ alternados.", "25 m corridor. Alternating moves of $15/k$.")]],
      },
      script: {
        heading: T("30. INT. SALA DE ESCÁNERES — NOCHE", "30. INT. SCANNER ROOM — NIGHT"),
        lines: [
          ["HALDEN", T("Está perdido. Ha andado más que todos nosotros y andará siempre.", "He is lost. He has walked further than any of us and he will walk forever.")],
          ["IRENE", T("Andará siempre. Pero va a alguna parte.", "He will walk forever. But he is going somewhere.")],
          ["", T("Irene marca en el plano del pasillo dos posiciones consecutivas de la baliza. Entre ellas, la hornacina.", "Irene marks two consecutive positions of the beacon on the plan of the corridor. Between them, the alcove.")],
          ["IRENE", T("Ahí. Donde siempre está el Observador.", "There. Where the Observer always stands.")],
        ],
      },
      evidence: {
        id: "altS6", title: T("Montaje alternativo «TRL_ALT_AS» · plano S6", "Alternative cut “TRL_ALT_AS” · shot S6"),
        intro: T("Fotogramas exportados por seguridad de Meridiano del plano S6 de la secuencia alternativa. Posición de la baliza, en metros desde la entrada, en las oscilaciones que muestra el plano.", "Frames exported by Meridian security from shot S6 of the alternative sequence. Position of the beacon, in metres from the entrance, at the swings the shot shows."),
      },
      exercises: [
        { id: "6.1", level: "B", text: T("Calcula las ocho primeras posiciones de la baliza.", "Compute the first eight positions of the beacon."),
          answers: [{ key: "S2", label: "S_2", type: "number", ref: "e6.S", arg: 2 }, { key: "S5", label: "S_5", type: "number", ref: "e6.S", arg: 5 }, { key: "S8", label: "S_8", type: "number", ref: "e6.S", arg: 8, decimals: 2 }] },
        { id: "6.2", level: "B", text: T("¿Cuánto ha caminado Leo tras $n$ oscilaciones? ¿Tiene límite?", "How far has Leo walked after $n$ swings? Does it have a limit?"),
          answers: [{ key: "P10", label: T("Camino tras 10 oscilaciones (m)", "Path after 10 swings (m)"), type: "number", ref: "e6.path", arg: 10, decimals: 2 }, { key: "conv", label: T("El camino total…", "The total path…"), type: "choice", options: ["converges", "diverges"], ref: "e6.pathClass" }] },
        { id: "6.3", level: "E", text: T("Demuestra que la posición converge y que el límite queda entre dos posiciones consecutivas cualesquiera.", "Prove that the position converges and that the limit lies between any two consecutive positions."),
          answers: [{ key: "why", label: T("Demostración", "Proof"), type: "justification", criteria: ["leibniz"] }] },
        { id: "6.4", level: "E", text: T("¿Entre qué valores está la posición final, según las oscilaciones 10 y 11? ¿Cuántas oscilaciones hacen falta para conocerla con un error menor que 0.5 m?", "Between which values does the final position lie, according to swings 10 and 11? How many swings are needed to know it with an error below 0.5 m?"),
          answers: [{ key: "int", label: T("Intervalo", "Interval"), type: "interval", ref: "e6.bracket", arg: 10, tol: 0.01 }, { key: "n", label: T("Oscilaciones", "Swings"), type: "integer", ref: "e6.swingsFor", arg: 0.5 }] },
        { id: "6.5", level: "A", text: T("¿Converge la serie absolutamente? ¿Y si los desplazamientos fueran $12/k^2$?", "Does the series converge absolutely? And if the moves were $12/k^2$?"),
          answers: [{ key: "a", label: T("Con $12/k$", "With $12/k$"), type: "choice", options: ["absolute", "conditional"], ref: "e6.class1" }, { key: "b", label: T("Con $12/k^2$", "With $12/k^2$"), type: "choice", options: ["absolute", "conditional"], ref: "e6.class2" }] },
        { id: "6.6", level: "E", evidence: true, text: T("Prueba forense. Con las posiciones de la baliza en el montaje alternativo, calcula la amplitud $L$ que se usó ($S_n = L\\,A_n$, con $A_n = 1 - 1/2 + \\cdots \\pm 1/n$). ¿Dónde se asentaría la baliza? ¿Es compatible con la hornacina del pasillo construido? ¿Con qué versión de la biblia encaja?", "Forensic exhibit. From the beacon positions in the alternative cut, compute the amplitude $L$ that was used ($S_n = L\\,A_n$, with $A_n = 1 - 1/2 + \\cdots \\pm 1/n$). Where would the beacon settle? Is it compatible with the alcove of the corridor that was built? Which version of the bible does it fit?"),
          answers: [
            { key: "L", label: "L", type: "number", ref: "alt.L", tol: 0.05 },
            { key: "int", label: T("Intervalo de la posición final", "Interval for the final position"), type: "interval", ref: "alt.bracket", tol: 0.02 },
            { key: "why", label: T("Conclusión", "Conclusion"), type: "justification", criteria: ["old-corridor"] },
          ] },
      ],
      challenge: {
        segments: ["S6"],
        title: T("Diseñad el péndulo de la baliza", "Design the beacon's pendulum"),
        story: T("Elegid cómo oscila la baliza en vuestro tráiler: desplazamientos alternados $(-1)^{k+1} L/k^s$.", "Choose how the beacon swings in your trailer: alternating moves $(-1)^{k+1} L/k^s$."),
        rules: [
          T("El primer avance, $L$, no pasa de 14 m.", "The first move, $L$, is at most 14 m."),
          T("La posición final queda dentro de la hornacina, entre 6 y 10 m, certificada por dos posiciones consecutivas.", "The final position lies inside the alcove, between 6 and 10 m, certified by two consecutive positions."),
          T("El camino recorrido es infinito («andará siempre»).", "The path walked is infinite (“he will walk forever”)."),
        ],
        deliver: T("Vuestros $L$ y $s$, las dos posiciones que certifican la hornacina, y la razón por la que el camino es infinito.", "Your $L$ and $s$, the two positions that certify the alcove and the reason why the path is infinite."),
      },
      prepare: [
        T("Para el guionista del episodio: ¿cómo puede alguien andar siempre y no ir a ninguna parte… o ir a alguna?", "For the writer of the episode: how can someone walk forever and go nowhere… or somewhere?"),
        T("Para quien conozca las versiones de la biblia: ¿cuánto medía el pasillo antes de construir el decorado?", "For whoever knows the versions of the bible: how long was the corridor before the set was built?"),
      ],
    },
  ];
})(typeof window !== "undefined" ? window : globalThis);
