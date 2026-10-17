/*
 * Calculus Cases · Case 7 · The Series Finale — CONFIDENTIAL case data (teacher only).
 *
 * The finale of the show, the private role cards, the documents of the second-session envelope
 * and the solution. Only the teacher generator loads this file; the student room never does.
 * On a static website nothing is truly secret: see the security note in the technical README.
 */
(function (root) {
  "use strict";
  const SF = (root.SFData = root.SFData || {});
  const T = (es, en) => ({ es, en });

  // --------------------------------------------------------------------------- the finale
  SF.finale = {
    id: 7, key: "pointZ", title: T("Punto Z", "Point Z"),
    synopsis: T(
      "La sonda llega al Punto Z en el minuto 12 367 y abre la puerta desde dentro. Irene recorre el pasillo entre los anillos de eco, que convergen hacia la puerta. En la hornacina, el Observador se da la vuelta: es Leo. Desde el accidente, Leo ha estado mirando la Zona desde dentro: mientras se la observa, nada en ella puede cambiar, y él la mantiene, y se mantiene a sí mismo, detenida en el instante anterior al colapso. Por eso había nueve observaciones sin cámara. Para liberarlo, todas las observaciones tienen que cesar a la vez: las 240 cámaras, las de Leo y la mirada de Irene. Irene apaga la red, cierra los ojos y camina hacia la salida sin volverse. Último plano: la luz de la mañana en la boca de la mina, y unos pasos detrás de ella. No se da la vuelta. Negro.",
      "The probe reaches Point Z in minute 12 367 and opens the door from the inside. Irene walks the corridor between the echo rings, which converge towards the door. In the alcove, the Observer turns around: it is Leo. Since the accident, Leo has been watching the Zone from inside: while it is observed, nothing in it can change, and he has been holding it, and himself, in the instant before the collapse. That is why there were nine observations without a camera. To free him, every observation must stop at once: the 240 cameras, Leo's own and Irene's gaze. Irene shuts down the network, closes her eyes and walks to the exit without turning round. Last shot: morning light at the mouth of the mine, and footsteps behind her. She does not turn round. Black."),
    leakedClip: T("Diez segundos: Irene en el pasillo, los anillos de eco convergiendo hacia la puerta; en la hornacina, el Observador se vuelve y se ve la cara de Leo. Rótulo añadido por quien lo publicó: «LEO ES EL OBSERVADOR».", "Ten seconds: Irene in the corridor, the echo rings converging towards the door; in the alcove the Observer turns and Leo's face is seen. Caption added by the poster: “LEO IS THE OBSERVER”."),
    whyFair: T("Todas las piezas estaban sembradas: el protocolo de observación constante (ep. 1), el Observador siempre en la hornacina (ep. 2 y 6), las nueve observaciones sin cámara (ep. 4) y la baliza de Leo que converge a la hornacina (ep. 6). La regla que resuelve el final, «lo que se observa no cambia», se enuncia en el primer minuto de la serie.", "Every piece was planted: the constant-observation protocol (ep. 1), the Observer always in the alcove (ep. 2 and 6), the nine observations without a camera (ep. 4) and Leo's beacon converging to the alcove (ep. 6). The rule that resolves the ending, “what is observed does not change”, is stated in the first minute of the show."),
  };

  // ---------------------------------------------------------------- facts in the envelope
  SF.envelope = {
    // Floor 3 (post-production) badge readers record entries only; exits are not logged.
    accessP3: [
      { day: 0, time: "18:52", who: "alex", note: T("Sube de la cafetería", "Comes up from the cafeteria") },
      { day: 0, time: "20:38", who: "alex" },
      { day: 0, time: "21:10", who: "nadia" },
      { day: 0, time: "21:58", who: "elias" },
      { day: 1, time: "00:15", who: "hugo" },
      { day: 1, time: "08:47", who: "alex" },
      { day: 1, time: "09:00", who: "marta" },
    ],
    rounds: [
      { day: 0, time: "20:45", text: T("Planta 3 revisada. Vacía salvo la sala de montaje: Á. Soler trabajando.", "Floor 3 checked. Empty except the editing suite: Á. Soler at work.") },
      { day: 0, time: "23:30", text: T("Planta 3. Sala de montaje con la puerta cerrada, luz encendida y ruido de render. No entro (protocolo: no interrumpir un render).", "Floor 3. Editing suite door closed, light on, render noise. I do not go in (protocol: do not interrupt a render).") },
      { day: 1, time: "02:30", text: T("Planta 3 a oscuras. Sala de montaje cerrada y en silencio.", "Floor 3 dark. Editing suite closed and silent.") },
    ],
    building: T("La puerta principal y las de cada planta registran las entradas con tarjeta; las salidas no se registran. La planta 3 solo tiene acceso por la escalera central y el ascensor, los dos con lector. La estación de la sala de montaje no tiene conexión a la red: los proyectos solo se pueden abrir sentado ante ella.", "The main door and each floor's door record badge entries; exits are not recorded. Floor 3 can only be reached by the central stairs and the lift, both with readers. The editing suite workstation has no network connection: projects can only be opened by sitting at it."),
    distribution: [
      { id: "v1", day: -225, date: T("2 de marzo", "2 March"), author: "elias", recipients: ["vera", "hugo", "nadia", "elias", "alex", "ferro"], note: T("Pre-producción. Pasillo de 25 m.", "Pre-production. 25 m corridor.") },
      { id: "v2", day: -126, date: T("9 de junio", "9 June"), author: "elias", recipients: ["vera", "nadia", "elias"], note: T("Revisión del asesor, «para aprobar». Retirada el 1 de septiembre: se pidió destruir las copias.", "Adviser's revision, “for approval”. Withdrawn on 1 September: copies were to be destroyed.") },
      { id: "v3", day: -42, date: T("1 de septiembre", "1 September"), author: "vera", coauthor: "elias", recipients: ["vera", "hugo", "nadia", "elias", "alex", "ferro"], note: T("Definitiva. Reescalada al decorado de 20 m.", "Final. Rescaled to the 20 m set.") },
    ],
    canary: {
      memo: T(
        "Tras la filtración de los títulos de los episodios en julio, la dirección de la serie pidió un sistema para identificar las copias de visionado del final. El asesor matemático lo diseñó y seguridad lo implantó: cada copia lleva el efecto de los anillos de eco (VFX 2.3) con una razón distinta, siempre con un pasillo de 20 m, de modo que nadie puede notar la diferencia a simple vista. Solo la creadora, el asesor matemático y la jefa de seguridad conocían el sistema.",
        "After the episode titles leaked in July, the showrunner asked for a system to identify the screening copies of the finale. The mathematics adviser designed it and security put it in place: every copy carries the echo-ring effect (VFX 2.3) with a different ratio, always with a 20 m corridor, so that nobody can tell the difference by eye. Only the creator, the mathematics adviser and the head of security knew about the system."),
      copies: [
        { holder: "vera", r: 0.55, where: T("Copia personal", "Personal copy") },
        { holder: "hugo", r: 0.58, where: T("Copia personal", "Personal copy") },
        { holder: "nadia", r: 0.61, where: T("Copia personal", "Personal copy") },
        { holder: "suite", r: "leak", where: T("Copia de Álex Soler, importada el 10 de octubre en el proyecto del tráiler (estación de la sala de montaje)", "Álex Soler's copy, imported on 10 October into the trailer project (editing suite workstation)") },
        { holder: "elias", r: 0.67, where: T("Copia personal", "Personal copy") },
        { holder: "ferro", r: 0.70, where: T("Casa de efectos Ferro VFX", "Ferro VFX house") },
      ],
      metadata: T("Metadatos técnicos del vídeo publicado: 240 fotogramas a 24 fotogramas por segundo, perfil de render ZENO-VOL-3, codificador de Montage Pro. Coinciden con el trabajo TRL_ALT_07 del servidor de render de la sala de montaje.", "Technical metadata of the posted video: 240 frames at 24 frames per second, render profile ZENO-VOL-3, Montage Pro encoder. They match job TRL_ALT_07 of the editing suite's render server."),
    },
    radio: T("Radio Onda Sur · «La noche en serie», en directo de 22:00 a 23:00. Invitada: Nadia Ferrán, guionista de ZENO. Entra en el estudio a las 21:45; programa disponible en el archivo de la emisora.", "Radio Onda Sur · “Series by Night”, live from 22:00 to 23:00. Guest: Nadia Ferrán, writer on ZENO. Enters the studio at 21:45; programme available in the station archive."),
  };

  // ------------------------------------------------------------------- private role cards
  // `reveal` rules say when a secret must come out; nobody may contradict a document.
  SF.cards = {
    common: {
      rules: T([
        "Puedes improvisar tu forma de hablar, tu carácter y tus sentimientos. Nunca puedes improvisar hechos, horas, cifras ni documentos.",
        "No puedes contradecir un documento que te enseñen: reconócelo y da solo la explicación que trae tu ficha.",
        "Responde la verdad sobre las matemáticas de tus episodios: eres profesional y estás orgulloso u orgullosa de tu trabajo.",
        "Si te preguntan algo que tu ficha no dice, responde «no lo sé» o «no lo recuerdo».",
        "No enseñes esta ficha a nadie.",
      ], [
        "You may improvise your manner, your character and your feelings. You may never improvise facts, times, figures or documents.",
        "You cannot contradict a document you are shown: acknowledge it and give only the explanation on your card.",
        "Tell the truth about the mathematics of your episodes: you are a professional and proud of your work.",
        "If you are asked something your card does not cover, answer “I don't know” or “I don't remember”.",
        "Do not show this card to anyone.",
      ]),
    },
    vera: {
      whoYouAre: T("Eres Vera Lindqvist, 52 años, creadora y showrunner de ZENO. Exigente, carismática con la prensa, protectora con tu serie hasta la obsesión. Contrataste a Elías Brandt hace tres años; hoy su perfeccionismo te agota. Respetas a Nadia, aprecias el trabajo de Álex y desconfías de Hugo desde que en julio alguien filtró los títulos de los episodios.", "You are Vera Lindqvist, 52, creator and showrunner of ZENO. Demanding, charming with the press, protective of your show to the point of obsession. You hired Elías Brandt three years ago; today his perfectionism exhausts you. You respect Nadia, you value Álex's work, and you have distrusted Hugo since someone leaked the episode titles in July."),
      knows: T([
        "Tras la filtración de julio pediste a Elías un sistema para marcar las copias de visionado del final. Él lo diseñó: cada copia lleva el eco del pasillo con una razón distinta. No recuerdas las cifras; la tabla la tiene Marta Quiroga, la jefa de seguridad.",
        "Recibiste la versión v2 de la biblia de efectos en junio. Elías proponía que la dosis de Irene en el episodio 5 siguiera $1/n^{1.5}$: «convergente, pero letal». Lo rechazaste: «una heroína que muere por una serie convergente es una lección de matemáticas, no un final». En la v3 Irene volvió a $1/n^2$.",
        "En la reunión del martes anunciaste que Elías no seguirá en la segunda temporada y que su crédito pasa a «consultoría adicional». Él se quedó callado y blanco. Álex dijo que sus efectos «parecen salvapantallas» y hubo risas.",
        "Sabes que el vídeo filtrado es auténtico. Dijiste a la prensa que era un montaje para frenar el daño.",
      ], [
        "After the July leak you asked Elías for a system to mark the screening copies of the finale. He designed it: every copy carries the corridor echo with a different ratio. You do not remember the figures; Marta Quiroga, the head of security, holds the table.",
        "You received version v2 of the effects bible in June. Elías proposed that Irene's dose in episode 5 should follow $1/n^{1.5}$: “convergent, but lethal”. You rejected it: “a heroine who dies of a convergent series is a mathematics lesson, not an ending”. In v3 Irene went back to $1/n^2$.",
        "At Tuesday's meeting you announced that Elías will not be part of season 2 and that his credit becomes “additional consultancy”. He went silent and pale. Álex said his effects “look like screensavers” and people laughed.",
        "You know the leaked video is genuine. You told the press it was a fake to limit the damage.",
      ]),
      night: [
        ["19:00–20:30", T("Reunión en la sala de proyección (planta 1).", "Meeting in the screening room (floor 1).")],
        ["21:30", T("Sales del edificio.", "You leave the building.")],
        ["21:45–00:30", T("Cena en el restaurante Casa Lumbre con Carmen Adler, directora de contenidos de Kairo, la plataforma rival. Negociáis llevar ZENO a Kairo si Nadir no renueva. Pagas tú: el recibo es de las 00:21.", "Dinner at the Casa Lumbre restaurant with Carmen Adler, head of content at Kairo, the rival platform. You discuss taking ZENO to Kairo if Nadir does not renew. You pay: the receipt is timed 00:21.")],
        ["00:50", T("Llegas a casa.", "You get home.")],
      ],
      secret: T("La cena con Kairo. Si se supiera, Nadir rompería la negociación de la segunda temporada.", "The dinner with Kairo. If it came out, Nadir would break off the season 2 negotiation."),
      reveal: T([
        "Mantén tu declaración a la prensa («la sonda nunca llega») hasta que alguien te demuestre que la serie armónica diverge o te enseñe la biblia del episodio 3. Entonces reconoce: «Lo dije para proteger la serie. El vídeo es auténtico».",
        "Si te preguntan dónde estabas el martes por la noche, di que en casa. Si te lo vuelven a preguntar después de haber reconocido la mentira a la prensa, cuenta la cena y enseña el recibo.",
        "Si te preguntan por las versiones de la biblia, cuenta lo de la v2 y la idea de Elías.",
        "Si te preguntan quién conocía el sistema de marcas de agua, di la verdad: tú, Elías y Marta Quiroga.",
      ], [
        "Keep to your press statement (“the probe never arrives”) until someone proves to you that the harmonic series diverges or shows you the episode 3 bible. Then admit: “I said it to protect the show. The video is genuine.”",
        "If asked where you were on Tuesday night, say at home. If asked again after you have admitted the press lie, tell them about the dinner and show the receipt.",
        "If asked about the versions of the bible, tell them about v2 and Elías's idea.",
        "If asked who knew about the watermark system, tell the truth: you, Elías and Marta Quiroga.",
      ]),
      documents: [{ title: T("Recibo de Casa Lumbre", "Casa Lumbre receipt"), text: T("Casa Lumbre · Mesa 12 · 2 cubiertos · Menú degustación, vino · Total 214.00 € · Tarjeta V. LINDQVIST · {D1date} 00:21", "Casa Lumbre · Table 12 · 2 covers · Tasting menu, wine · Total €214.00 · Card V. LINDQVIST · {D1date} 00:21") }],
      math: {
        episodes: [1],
        explain: T([
          "Episodio 1: el pitido $n$ suena en $t_n = 60n/(n+1)$. Hay infinitos pitidos, pero todos antes del segundo 60, porque $t_n = 60 - 60/(n+1) < 60$ y $t_n$ se acerca a 60. Caben 58 antes del segundo 59.",
          "Las 240 cámaras están en diez anillos: 6, 10, 14, …, 42. La suma de una progresión aritmética es n · (primero + último)/2 = 10 · 48/2 = 240.",
          "En el final, los anillos de eco convergen a la puerta, a 20 m: es una serie geométrica.",
        ], [
          "Episode 1: beep $n$ sounds at $t_n = 60n/(n+1)$. There are infinitely many beeps, but all before second 60, because $t_n = 60 - 60/(n+1) < 60$ and $t_n$ approaches 60. Fifty-eight fit before second 59.",
          "The 240 cameras sit in ten rings: 6, 10, 14, …, 42. The sum of an arithmetic progression is n · (first + last)/2 = 10 · 48/2 = 240.",
          "In the finale, the echo rings converge to the door, 20 m away: it is a geometric series.",
        ]),
      },
      qa: T([
        ["¿Es auténtico el vídeo?", "Al principio: «Es un montaje de fans». Después de la demostración: «Sí. Lo siento. Es nuestro final»."],
        ["¿Quién sabía lo de las copias marcadas?", "«Elías, Marta y yo. Nadie más»."],
        ["¿Por qué apartó a Elías?", "«Es brillante, pero quería convertir cada escena en un teorema. La segunda temporada necesita otra cosa»."],
        ["¿Hubo alguna versión con otro exponente para Irene?", "«La v2. Elías quería que Irene recibiera una dosis convergente pero letal, con exponente 1.5. La rechacé»."],
      ], [
        ["Is the video genuine?", "At first: “It's a fan fake.” After the proof: “Yes. I'm sorry. It is our ending.”"],
        ["Who knew about the marked copies?", "“Elías, Marta and me. Nobody else.”"],
        ["Why did you drop Elías?", "“He's brilliant, but he wanted to turn every scene into a theorem. Season 2 needs something else.”"],
        ["Was there a version with another exponent for Irene?", "“v2. Elías wanted Irene to receive a convergent but lethal dose, with exponent 1.5. I rejected it.”"],
      ]),
      goal: T("Proteger la serie y tu negociación. No eres culpable: si te acorralan con pruebas, colabora.", "Protect the show and your negotiation. You are not guilty: if cornered with evidence, cooperate."),
    },
    hugo: {
      whoYouAre: T("Eres Hugo Mercer, 39 años, guionista principal. Escribiste los episodios 2 y 6. Sarcástico, rápido, conoces a los fans mejor que nadie. Ibas a escribir el final, pero Vera se lo dio a Nadia, y eso todavía te escuece.", "You are Hugo Mercer, 39, head writer. You wrote episodes 2 and 6. Sarcastic, quick, you know the fans better than anyone. You were going to write the finale, but Vera gave it to Nadia, and it still stings."),
      knows: T([
        "Tú eres «Aquiles_77» en el foro Archivo Orba. En julio publicaste los títulos de los episodios, y en agosto la teoría «Leo es el Observador», como si fuera una conjetura de fan. Sabías que era verdad. Es una infracción grave de tu contrato.",
        "Recibiste las biblias v1 y v3. Nunca viste la v2.",
        "No sabías nada de copias marcadas.",
      ], [
        "You are “Aquiles_77” on the Orba Archive forum. In July you posted the episode titles, and in August the theory “Leo is the Observer”, as if it were a fan's guess. You knew it was true. It is a serious breach of your contract.",
        "You received bibles v1 and v3. You never saw v2.",
        "You knew nothing about marked copies.",
      ]),
      night: [
        ["19:00–20:30", T("Reunión en la sala de proyección.", "Meeting in the screening room.")],
        ["20:40–00:10", T("Escribes en la sala de guionistas (planta 2). Tu ordenador guarda cada pocos minutos; el último guardado es de las 00:10.", "You write in the writers' room (floor 2). Your computer saves every few minutes; the last save is at 00:10.")],
        ["00:15", T("Subes a la planta 3 a imprimir doce páginas en la impresora de montaje (la de la planta 2 está rota). Trabajo de impresión: 00:21.", "You go up to floor 3 to print twelve pages on the editing printer (the one on floor 2 is broken). Print job: 00:21.")],
        ["00:15–00:32", T("Mientras imprimes, oyes los ventiladores del render en la sala de montaje y ves luz bajo la puerta. No ves a nadie. Te vas hacia las 00:32.", "While printing, you hear the render fans in the editing suite and see light under the door. You see nobody. You leave around 00:32.")],
      ],
      secret: T("Eres Aquiles_77.", "You are Aquiles_77."),
      reveal: T([
        "Niega ser Aquiles_77 hasta que un investigador te señale que Aquiles_77 publicó los títulos en julio, cuando solo los conocía la sala de guionistas, y te lo pregunte directamente. Entonces admítelo, pero insiste en que no publicaste el vídeo: «Yo escribía teorías. Nunca he tenido el vídeo».",
        "Si te preguntan qué viste en la planta 3, cuenta lo del render y la luz bajo la puerta.",
        "Si te preguntan dónde estabas a las 22:30, di la verdad: en la sala de guionistas. Ofrece el registro de tu ordenador.",
      ], [
        "Deny being Aquiles_77 until an investigator points out that Aquiles_77 posted the titles in July, when only the writers' room knew them, and asks you directly. Then admit it, but insist you did not post the video: “I wrote theories. I never had the video.”",
        "If asked what you saw on floor 3, tell them about the render and the light under the door.",
        "If asked where you were at 22:30, tell the truth: in the writers' room. Offer your computer's log.",
      ]),
      documents: [{ title: T("Registro del ordenador de la sala de guionistas", "Writers' room computer log"), text: T("Usuario hmercer · documento «S2_E01_borrador» · guardados: 20:41, 20:52, 21:07, 21:19, 21:33, 21:46, 21:58, 22:11, 22:24, 22:37, 22:49, 23:02, 23:16, 23:29, 23:41, 23:55, 00:10", "User hmercer · document “S2_E01_draft” · saves: 20:41, 20:52, 21:07, 21:19, 21:33, 21:46, 21:58, 22:11, 22:24, 22:37, 22:49, 23:02, 23:16, 23:29, 23:41, 23:55, 00:10") }],
      math: {
        episodes: [2, 6],
        explain: T([
          "Episodio 2: los anillos están en $x_k = a(1 - r^k)/(1 - r)$. Con $a = 8$ y $r = 0.6$ convergen a 8/0.4 = 20 m, la puerta. Para que la suma exista hace falta $|r| < 1$; con $r = 1$ el hueco no se reduce y la persecución no acaba.",
          "La persecución: Irene recorre 8 + 4.8 + 2.88 + … = 20 m en 4 + 2.4 + 1.44 + … = 10 s. Con la velocidad relativa sale lo mismo: 8/(2 − 1.2) = 10 s.",
          "Episodio 6: la baliza avanza 12, retrocede 6, avanza 4… La posición queda siempre entre dos posiciones consecutivas, que se acercan: converge, a unos 8.3 m (la hornacina). El camino recorrido, 12(1 + 1/2 + 1/3 + …), crece sin límite: convergencia condicional.",
        ], [
          "Episode 2: the rings lie at $x_k = a(1 - r^k)/(1 - r)$. With $a = 8$ and $r = 0.6$ they converge to 8/0.4 = 20 m, the door. For the sum to exist you need $|r| < 1$; with $r = 1$ the gap does not shrink and the chase never ends.",
          "The chase: Irene covers 8 + 4.8 + 2.88 + … = 20 m in 4 + 2.4 + 1.44 + … = 10 s. The relative speed gives the same: 8/(2 − 1.2) = 10 s.",
          "Episode 6: the beacon moves forward 12, back 6, forward 4… The position always lies between two consecutive positions, which close in: it converges, to about 8.3 m (the alcove). The path walked, 12(1 + 1/2 + 1/3 + …), grows without bound: conditional convergence.",
        ]),
      },
      qa: T([
        ["¿Quién es Aquiles_77?", "Al principio: «Ni idea. Un fan con buen olfato». Cuando se cumpla la condición de tu ficha: «Soy yo. Pero nunca he tenido el vídeo»."],
        ["¿Qué hacía en la planta 3 a medianoche?", "«Imprimir. La impresora de la planta 2 lleva una semana rota»."],
        ["¿Vio a alguien?", "«No. La puerta de la sala de montaje estaba cerrada, con luz, y el render rugía»."],
        ["¿Conocía la v2 de la biblia?", "«No. A mí me llegaron la v1 y la v3»."],
      ], [
        ["Who is Aquiles_77?", "At first: “No idea. A fan with a good nose.” Once your card's condition is met: “It's me. But I never had the video.”"],
        ["What were you doing on floor 3 at midnight?", "“Printing. The printer on floor 2 has been broken for a week.”"],
        ["Did you see anyone?", "“No. The editing suite door was closed, with the light on, and the render was roaring.”"],
        ["Did you know v2 of the bible?", "“No. I got v1 and v3.”"],
      ]),
      goal: T("Que no se descubra que eres Aquiles_77, y que no te culpen de algo que no hiciste.", "Keep your Aquiles_77 identity hidden, and avoid being blamed for something you did not do."),
    },
    nadia: {
      whoYouAre: T("Eres Nadia Ferrán, 33 años, guionista del episodio 5 y del final. Idealista y perfeccionista. Te peleaste con Nadir por los cambios del final.", "You are Nadia Ferrán, 33, writer of episode 5 and of the finale. Idealistic and a perfectionist. You fought with Nadir over the changes to the ending."),
      knows: T([
        "Recibiste la v2 de la biblia en junio. En ella, Elías había puesto la dosis de Irene en $1/n^{1.5}$: converge, pero su suma pasa de 2, así que Irene cruzaba el umbral en el minuto 11. A ti te gustaba: hacía más trágico el final. Vera lo rechazó y en la v3 volvió a $1/n^2$. En la v2 el pasillo aún medía 25 m.",
        "Guardas en un USB el guion original del final, de la época de la v2. Estás escribiendo un libro sobre el rodaje de ZENO. Las dos cosas incumplen tu contrato.",
        "No sabías nada de copias marcadas.",
      ], [
        "You received v2 of the bible in June. In it, Elías had set Irene's dose to $1/n^{1.5}$: it converges, but its sum exceeds 2, so Irene crossed the threshold in minute 11. You liked it: it made the ending more tragic. Vera rejected it, and v3 went back to $1/n^2$. In v2 the corridor was still 25 m long.",
        "You keep the original script of the finale, from the v2 days, on a USB stick. You are writing a book about the making of ZENO. Both break your contract.",
        "You knew nothing about marked copies.",
      ]),
      night: [
        ["19:00–20:30", T("Reunión en la sala de proyección.", "Meeting in the screening room.")],
        ["21:10–21:20", T("Subes a la planta 3 a darle a Álex un USB con el clip promocional aprobado para la radio. Álex está sola en la sala de montaje, terminando el tráiler.", "You go up to floor 3 to give Álex a USB stick with the promotional clip approved for the radio. Álex is alone in the editing suite, finishing the trailer.")],
        ["21:45–23:00", T("Radio Onda Sur, «La noche en serie»: llegas a las 21:45 y estás en directo de 22:00 a 23:00. Después tomas algo con el equipo del programa hasta las 00:30.", "Radio Onda Sur, “Series by Night”: you arrive at 21:45 and are live from 22:00 to 23:00. Afterwards you have a drink with the programme team until 00:30.")],
      ],
      secret: T("El USB con el guion original y el libro.", "The USB stick with the original script, and the book."),
      reveal: T([
        "Si te preguntan por las versiones de la biblia o por el exponente de Irene, cuenta con detalle lo de la v2 (exponente 1.5, cruce en el minuto 11, pasillo de 25 m) y quién la recibió: Vera, Elías y tú.",
        "Si te preguntan si conservas documentos de la v2, admite lo del USB y el libro, y entrégalo: no contiene el vídeo, solo el guion.",
        "Si te preguntan por Álex, di que a las 21:10–21:20 estaba sola y trabajando.",
      ], [
        "If asked about the versions of the bible or Irene's exponent, explain v2 in detail (exponent 1.5, crossing in minute 11, 25 m corridor) and who received it: Vera, Elías and you.",
        "If asked whether you keep v2 documents, admit the USB stick and the book, and hand it over: it holds the script, not the video.",
        "If asked about Álex, say that at 21:10–21:20 she was alone and working.",
      ]),
      documents: [],
      math: {
        episodes: [5],
        explain: T([
          "Episodio 5: Sara recibe $1/n$ y su dosis acumulada es la serie armónica, que diverge: pasa de 2 en el minuto 4 (1 + 1/2 + 1/3 + 1/4 = 2.083).",
          "Irene recibe $1/n^2$. Como $1/n^2 < 1/(n - 1) - 1/n$ para $n \\ge 2$, su dosis queda por debajo de $1 + (1 - 1/n) < 2$: nunca llega a 2.",
          "Con exponente 1.5 (la v2) la serie también converge, pero su suma es mayor que 2: Irene cruza en el minuto 11. Que converja no significa que sea pequeña.",
        ], [
          "Episode 5: Sara receives $1/n$ and her accumulated dose is the harmonic series, which diverges: it passes 2 in minute 4 (1 + 1/2 + 1/3 + 1/4 = 2.083).",
          "Irene receives $1/n^2$. Since $1/n^2 < 1/(n - 1) - 1/n$ for $n \\ge 2$, her dose stays below $1 + (1 - 1/n) < 2$: it never reaches 2.",
          "With exponent 1.5 (v2) the series also converges, but its sum is greater than 2: Irene crosses in minute 11. Converging does not mean being small.",
        ]),
      },
      qa: T([
        ["¿Dónde estaba a las 22:30?", "«En antena, en Radio Onda Sur. Lo puede oír cualquiera en el archivo»."],
        ["¿Quién recibió la v2?", "«Vera, Elías y yo. Era para aprobar»."],
        ["¿Qué cambió entre la v2 y la v3?", "«El exponente de Irene, de 1.5 a 2, y el pasillo, de 25 a 20 metros, porque el decorado se construyó así»."],
      ], [
        ["Where were you at 22:30?", "“On air, at Radio Onda Sur. Anyone can listen to it in the archive.”"],
        ["Who received v2?", "“Vera, Elías and me. It was for approval.”"],
        ["What changed between v2 and v3?", "“Irene's exponent, from 1.5 to 2, and the corridor, from 25 to 20 metres, because that is how the set was built.”"],
      ]),
      goal: T("Defender tu final y que no descubran el libro. No eres culpable: colabora con las matemáticas.", "Defend your ending and keep the book hidden. You are not guilty: cooperate on the mathematics."),
    },
    elias: {
      guilty: true,
      whoYouAre: T("Eres Elías Brandt, 47 años, asesor matemático de ZENO. Antiguo profesor universitario: preciso, educado, orgulloso. Diseñaste las matemáticas de la serie y la biblia de efectos. ERES QUIEN FILTRÓ EL FINAL.", "You are Elías Brandt, 47, mathematics adviser on ZENO. A former university lecturer: precise, polite, proud. You designed the show's mathematics and the effects bible. YOU ARE THE ONE WHO LEAKED THE FINALE."),
      knows: T([
        "Lo que pasó de verdad: en la reunión del martes, Vera te apartó de la segunda temporada, rebajó tu crédito y llamó «irrodables» a tus ideas; Álex dijo que tus efectos parecían salvapantallas y todos se rieron. Decidiste que el mundo vería el final antes del estreno y que la culpa caería sobre Álex.",
        "Sabías que la copia de Álex estaba importada en el proyecto del tráiler, y que la marca de agua (la razón {leakR}, que diseñaste tú) la señalaría a ella.",
        "A las 21:58 subiste a la planta 3. A las {journalOpen} abriste el proyecto con la cuenta compartida «promo_edit»; a las {renderStart} lanzaste el render del plano del final; poco después guardaste la secuencia «TRL_ALT_AS», con las iniciales de Álex, para que pareciera que ella preparaba un tráiler que destripaba el final. Rehiciste los planos S5 y S6 con tu propio generador de efectos.",
        "El render terminó a la {renderFinish}. Cerraste el proyecto a la {journalClose}, borraste tu sesión del diario a la 01:16 y te fuiste hacia la 01:20. A las 07:40 publicaste el clip desde una cuenta nueva, «punto_z».",
        "Tu error, aunque no lo sabes: tu generador usa los valores de TU versión, la v2: el exponente 1.5 para Irene y el pasillo de 25 m (amplitud 15 en la baliza).",
      ], [
        "What really happened: at Tuesday's meeting Vera dropped you from season 2, cut your credit and called your ideas “unfilmable”; Álex said your effects looked like screensavers and everyone laughed. You decided the world would see the ending before the premiere and the blame would fall on Álex.",
        "You knew that Álex's copy was imported into the trailer project, and that the watermark (ratio {leakR}, which you designed) would point at her.",
        "At 21:58 you went up to floor 3. At {journalOpen} you opened the project with the shared account “promo_edit”; at {renderStart} you started the render of the finale shot; shortly afterwards you saved the sequence “TRL_ALT_AS”, with Álex's initials, so that it would look as if she were preparing a trailer that spoiled the ending. You remade shots S5 and S6 with your own effects generator.",
        "The render finished at {renderFinish}. You closed the project at {journalClose}, deleted your session from the journal at 01:16 and left around 01:20. At 07:40 you posted the clip from a new account, “punto_z”.",
        "Your mistake, though you do not know it: your generator uses the values of YOUR version, v2: exponent 1.5 for Irene and the 25 m corridor (amplitude 15 for the beacon).",
      ]),
      night: [
        ["19:00–20:30", T("Reunión en la sala de proyección.", "Meeting in the screening room.")],
        ["21:58", T("Entras en la planta 3 (queda registrado).", "You enter floor 3 (it is recorded).")],
        ["{journalOpen}–01:16", T("En la sala de montaje (lo que de verdad hiciste está arriba).", "In the editing suite (what you really did is above).")],
      ],
      secret: T("Eres el culpable.", "You are the culprit."),
      lies: T([
        "«Subí a la planta 3 a las 21:58 a recoger mi portátil del cuarto de efectos y me fui a las 22:05. A las 23:00 hablé por vídeo con mi hermana desde casa». (La llamada existe, pero se puede hacer desde cualquier sitio).",
        "Si te preguntan por el render: «Un plano de diez segundos se renderiza en unos 45 minutos; nunca tres horas».",
        "Si te preguntan por los planos S5 y S6 del montaje alternativo: «Usan los valores de la v3; cualquiera pudo copiarlos de la biblia».",
        "Si te preguntan por el diario: «El programa a veces fusiona sesiones; no me fiaría de esa suma».",
        "Puedes señalar, con aparente buena voluntad, que la marca de agua del vídeo es la de la copia de Álex.",
      ], [
        "“I went up to floor 3 at 21:58 to collect my laptop from the effects room and left at 22:05. At 23:00 I had a video call with my sister from home.” (The call exists, but it could be made from anywhere.)",
        "If asked about the render: “A ten-second shot renders in about 45 minutes; never three hours.”",
        "If asked about shots S5 and S6 of the alternative cut: “They use the v3 values; anyone could have copied them from the bible.”",
        "If asked about the journal: “The program sometimes merges sessions; I wouldn't trust that sum.”",
        "You may point out, with apparent goodwill, that the watermark of the video is that of Álex's copy.",
      ]),
      reveal: T([
        "Responde con verdad y con orgullo a las preguntas de matemáticas de los episodios 3 y 4 y a cómo funcionan las marcas de agua. No mientas sobre matemáticas generales: solo puedes mentir en lo que dice tu lista.",
        "Mantén tus mentiras mientras no te refuten con cálculos. Cuando un equipo te enseñe la duración correcta del render ({renderDuration}, inicio a las {renderStart}) Y, además, el exponente 1.5 del plano S5 o la sesión borrada de {journalOpen} a {journalClose} del diario, deja de negar y lee tu declaración final.",
        "No puedes negar los documentos: tu entrada de las 21:58 está registrada.",
      ], [
        "Answer truthfully and proudly the mathematics questions about episodes 3 and 4 and how the watermarks work. Do not lie about general mathematics: you may only lie about the items on your list.",
        "Keep your lies as long as they are not refuted with calculations. When a team shows you the correct render duration ({renderDuration}, start at {renderStart}) AND, in addition, the exponent 1.5 of shot S5 or the deleted {journalOpen}–{journalClose} session in the journal, stop denying and read your final statement.",
        "You cannot deny the documents: your 21:58 entry is on record.",
      ]),
      confession: T("«Vera llamó irrodables a mis matemáticas. Álex las llamó salvapantallas, y todos se rieron. Quise que el mundo viera el final antes que ellos, y que la marca de agua, mi marca de agua, señalara a quien se había reído. Elegí la copia de Álex porque sabía que su razón era {leakR}. Debí usar los valores de la versión definitiva. No pude: 1.5 era el exponente correcto».", "“Vera called my mathematics unfilmable. Álex called it a screensaver, and everyone laughed. I wanted the world to see the ending before they did, and I wanted the watermark, my watermark, to point at whoever had laughed. I chose Álex's copy because I knew its ratio was {leakR}. I should have used the values of the final version. I couldn't: 1.5 was the right exponent.”"),
      documents: [],
      math: {
        episodes: [3, 4],
        explain: T([
          "Episodio 3: en el minuto $k$ la sonda recorre 10 m de un pasillo de $100k$ m, es decir, $1/(10k)$ del pasillo. La fracción recorrida es $H_n/10$. Que los términos tiendan a 0 no basta para que la serie converja: agrupando 1/2, (1/3 + 1/4), (1/5 + … + 1/8)… cada bloque suma al menos 1/2, así que $H_n$ no está acotada. La sonda llega en el minuto 12 367 (cálculo); con cotas se demuestra que llega entre el minuto 1 024 y el 262 144.",
          "Episodio 4: $1/(k(k+1)) = 1/k - 1/(k+1)$; al sumar se cancela todo salvo $1 - 1/(N+1)$. Si la coherencia final es 0.004, $N + 1 = 250$, $N = 249$ observaciones: nueve más que cámaras.",
          "Marcas de agua: cada copia tiene su razón $r$ y un primer anillo $a = 20(1 - r)$, así que la suma $a/(1 - r)$ siempre es 20 m. Los huecos entre anillos delatan la razón.",
        ], [
          "Episode 3: in minute $k$ the probe covers 10 m of a $100k$ m corridor, that is, $1/(10k)$ of the corridor. The fraction covered is $H_n/10$. Terms tending to 0 is not enough for the series to converge: grouping 1/2, (1/3 + 1/4), (1/5 + … + 1/8)… each block adds at least 1/2, so $H_n$ is unbounded. The probe arrives in minute 12 367 (computed); bounds prove it arrives between minute 1 024 and minute 262 144.",
          "Episode 4: $1/(k(k+1)) = 1/k - 1/(k+1)$; adding them cancels everything except $1 - 1/(N+1)$. If the final coherence is 0.004, $N + 1 = 250$, $N = 249$ observations: nine more than cameras.",
          "Watermarks: each copy has its ratio $r$ and a first ring at $a = 20(1 - r)$, so the sum $a/(1 - r)$ is always 20 m. The gaps between rings give the ratio away.",
        ]),
      },
      qa: T([
        ["¿Dónde estaba a las 22:30?", "«En casa, o llegando. Me fui de la planta 3 a las 22:05»."],
        ["¿Cuánto tarda en renderizarse un plano de {renderFrames} fotogramas?", "«Unos 45 minutos»."],
        ["¿Cómo funcionan las marcas de agua?", "Explícalo bien: razón distinta por copia, a = 20(1 − r), la suma siempre 20 m."],
        ["¿Quién conocía el sistema?", "«Vera, Marta Quiroga y yo»."],
        ["¿Qué valores usan los planos S5 y S6 del montaje alternativo?", "«Los de la v3»."],
      ], [
        ["Where were you at 22:30?", "“At home, or nearly. I left floor 3 at 22:05.”"],
        ["How long does a {renderFrames}-frame shot take to render?", "“About 45 minutes.”"],
        ["How do the watermarks work?", "Explain it well: a different ratio per copy, a = 20(1 − r), the sum always 20 m."],
        ["Who knew about the system?", "“Vera, Marta Quiroga and me.”"],
        ["Which values do shots S5 and S6 of the alternative cut use?", "“Those of v3.”"],
      ]),
      goal: T("Que culpen a Álex. Defiende tus mentiras con calma y elegancia hasta que las matemáticas te acorralen.", "Get Álex blamed. Defend your lies calmly and elegantly until the mathematics corners you."),
    },
    alex: {
      whoYouAre: T("Eres Álex Soler, 29 años, montadora del tráiler oficial. Rápida, irónica, agotada: llevas semanas de horas extra. Vera confía en ti.", "You are Álex Soler, 29, editor of the official trailer. Fast, ironic, exhausted: you have been doing overtime for weeks. Vera trusts you."),
      knows: T([
        "El tráiler oficial (v6) tiene ocho planos, S0 a S7. Usa los valores de la v3: arranque con 10 s de cuenta atrás, 240 cámaras, eco con $a = 8$ y $r = 0.6$, sonda con $c = 10$ y $L = 100$, registro $1/(k(k+1))$, dosis $1/n$ y $1/n^2$, baliza $12/k$. El S7 solo enseña la puerta: nada del final.",
        "El 10 de octubre importaste tu copia de visionado del final en el proyecto, para cortar el S7. Desde entonces está en la estación de la sala de montaje.",
        "Los planos con anillos de eco no cuestan lo mismo en cada fotograma: con el perfil ZENO-VOL-3, el primero tarda {renderFirst} s y cada uno tarda {renderStep} s más que el anterior, porque se ve un anillo más. Un plano de {renderFrames} fotogramas tarda {renderDuration}.",
        "El fin de semana del 3 y 4 de octubre te llevaste a casa el disco con tu copia para adelantar trabajo. Está prohibido. Lo devolviste el lunes.",
      ], [
        "The official trailer (v6) has eight shots, S0 to S7. It uses the v3 values: a 10 s countdown in the cold open, 240 cameras, echo with $a = 8$ and $r = 0.6$, probe with $c = 10$ and $L = 100$, log $1/(k(k+1))$, doses $1/n$ and $1/n^2$, beacon $12/k$. S7 shows only the door: nothing of the ending.",
        "On 10 October you imported your screening copy of the finale into the project, to cut S7. Since then it has been on the editing suite workstation.",
        "Shots with echo rings do not cost the same for every frame: with the ZENO-VOL-3 profile the first frame takes {renderFirst} s and each one takes {renderStep} s longer than the previous, because one more ring is visible. A {renderFrames}-frame shot takes {renderDuration}.",
        "On the weekend of 3–4 October you took the disk with your copy home to get ahead with the work. It is forbidden. You brought it back on Monday.",
      ]),
      night: [
        ["19:00–20:30", T("Reunión en la sala de proyección. Dijiste que los efectos de Elías parecen salvapantallas. Te arrepientes un poco.", "Meeting in the screening room. You said Elías's effects look like screensavers. You regret it a little.")],
        ["20:38–21:40", T("En la sala de montaje, terminando el tráiler v6. Nadia pasa a las 21:10 a dejarte un USB con el clip de la radio y se va a las 21:20. Guardas y cierras el proyecto a las 21:35:10.", "In the editing suite, finishing trailer v6. Nadia drops by at 21:10 to leave you a USB stick with the radio clip and leaves at 21:20. You save and close the project at 21:35:10.")],
        ["21:52", T("Entras en el metro (tu tarjeta lo registra).", "You enter the metro (your card records it).")],
      ],
      secret: T("Te llevaste el disco a casa el fin de semana del 3 y 4 de octubre.", "You took the disk home on the weekend of 3–4 October."),
      reveal: T([
        "Si te preguntan cuánto tarda un render, explica el perfil ZENO-VOL-3 con detalle: es tu trabajo.",
        "Niega lo del disco la primera vez que te pregunten si sacaste la copia del edificio. Si te lo vuelven a preguntar, admítelo y añade: «Pero el vídeo se renderizó en la estación de la sala, no en mi casa: mirad los metadatos».",
        "Si te preguntan por la secuencia «TRL_ALT_AS», di la verdad: no la creaste tú, y nunca pondrías tus iniciales a algo así.",
      ], [
        "If asked how long a render takes, explain the ZENO-VOL-3 profile in detail: it is your job.",
        "Deny the disk the first time you are asked whether you took the copy out of the building. If asked again, admit it and add: “But the video was rendered on the suite workstation, not at my place: look at the metadata.”",
        "If asked about the sequence “TRL_ALT_AS”, tell the truth: you did not create it, and you would never put your initials on something like that.",
      ]),
      documents: [{ title: T("Historial de la tarjeta de transporte", "Transit card history"), text: T("Tarjeta metropolitana · Á. SOLER · {D0date} · 08:12 entrada Mercado · 21:52 entrada Plaza del Estudio · 22:18 salida Mercado", "Metro card · Á. SOLER · {D0date} · 08:12 in Market · 21:52 in Studio Square · 22:18 out Market") }],
      math: {
        episodes: [],
        explain: T([
          "El tráiler: ocho planos de S0 a S7 (112 s). Conoces los valores de la v3 de cada plano.",
          "El render: con el perfil ZENO-VOL-3 los costes de los fotogramas forman una progresión aritmética que empieza en {renderFirst} s y aumenta {renderStep} s por fotograma. La duración total es la suma de esa progresión.",
        ], [
          "The trailer: eight shots from S0 to S7 (112 s). You know the v3 values of every shot.",
          "The render: with the ZENO-VOL-3 profile the frame costs form an arithmetic progression starting at {renderFirst} s and rising by {renderStep} s per frame. The total duration is the sum of that progression.",
        ]),
      },
      qa: T([
        ["¿Creó la secuencia TRL_ALT_AS?", "«No. Y no pondría mis iniciales a un tráiler que destripa el final»."],
        ["¿Cuándo cerró el proyecto?", "«A las 21:35. Lo dice el diario»."],
        ["¿Se llevó alguna vez la copia a casa?", "Primera vez: «No». Segunda vez: «Sí, un fin de semana. Pero el vídeo no salió de mi casa»."],
        ["¿Cuánto tarda en renderizarse un plano de {renderFrames} fotogramas con anillos?", "«{renderDuration}: cada fotograma tarda {renderStep} s más que el anterior»."],
      ], [
        ["Did you create the sequence TRL_ALT_AS?", "“No. And I wouldn't put my initials on a trailer that spoils the ending.”"],
        ["When did you close the project?", "“At 21:35. The journal says so.”"],
        ["Did you ever take the copy home?", "First time: “No.” Second time: “Yes, one weekend. But the video didn't come from my place.”"],
        ["How long does a {renderFrames}-frame shot with rings take to render?", "“{renderDuration}: each frame takes {renderStep} s longer than the one before.”"],
      ]),
      goal: T("Limpiar tu nombre. Eres inocente, pero la marca de agua y las iniciales te señalan.", "Clear your name. You are innocent, but the watermark and the initials point at you."),
    },
  };

  // -------------------------------------------------------------------------- the solution
  SF.solution = {
    culprit: "elias",
    // Who could be on floor 3, and when (minutes after midnight of {D0}; the next day adds 1440).
    // `out: null` means that no document shows the person leaving.
    presence: {
      vera: [],
      hugo: [{ in: 1440 + 15, out: 1440 + 32, source: T("entrada 00:15; impresora 00:21; sale hacia 00:32", "entry 00:15; printer 00:21; leaves around 00:32") }],
      nadia: [{ in: 21 * 60 + 10, out: 21 * 60 + 20, source: T("entrada 21:10; Álex la ve salir a las 21:20; en antena a las 22:00", "entry 21:10; Álex sees her leave at 21:20; on air at 22:00") }],
      alex: [{ in: 20 * 60 + 38, out: 21 * 60 + 45, source: T("entrada 20:38; metro 21:52", "entry 20:38; metro 21:52") }],
      elias: [{ in: 21 * 60 + 58, out: null, source: T("entrada 21:58; nada demuestra que saliera", "entry 21:58; nothing shows him leaving") }],
    },
    v2: ["vera", "nadia", "elias"],
    chain: [
      { step: 1, evidence: "leak", team: 2, title: T("Origen del vídeo", "Origin of the video"), text: T("Los huecos entre anillos del fotograma filtrado dan r = {leakR}, y a/(1 − r) = 20 m: es una copia auténtica de la versión definitiva. Según la tabla de seguridad, la copia con r = {leakR} es la importada en el proyecto del tráiler, y los metadatos coinciden con el trabajo TRL_ALT_07: el vídeo salió de la estación de la sala de montaje, que no tiene red.", "The gaps between rings on the leaked frame give r = {leakR}, and a/(1 − r) = 20 m: it is a genuine copy of the final version. According to the security table, the copy with r = {leakR} is the one imported into the trailer project, and the metadata match job TRL_ALT_07: the video came from the editing suite workstation, which has no network.") },
      { step: 2, evidence: "render", team: 1, title: T("Hora", "Time"), text: T("El render terminó a la {renderFinish} y duró {renderFrames} · ({renderFirst} + {renderLast})/2 = {renderSeconds} s = {renderDuration}: empezó a las {renderStart}. Si se supone que todos los fotogramas cuestan {renderFirst} s, sale {renderNaiveStart}, y es falso.", "The render finished at {renderFinish} and took {renderFrames} · ({renderFirst} + {renderLast})/2 = {renderSeconds} s = {renderDuration}: it started at {renderStart}. Assuming every frame costs {renderFirst} s gives {renderNaiveStart}, which is false.") },
      { step: 3, evidence: "journal", team: 4, title: T("Sesión borrada", "Deleted session"), text: T("Las sesiones del diario suman {journalListed}, pero el contador total es {journalTotal}: falta una sesión de {journalMissing} que terminó en el último guardado ({journalClose}). Se abrió a las {journalOpen}. Lo confirma de forma independiente.", "The journal sessions add up to {journalListed}, but the total counter reads {journalTotal}: a {journalMissing} session is missing, ending at the last save ({journalClose}). It was opened at {journalOpen}. This confirms the time independently.") },
      { step: 4, evidence: "access", team: null, title: T("Presencia", "Presence"), text: T("A las 20:45 la planta 3 estaba vacía salvo Álex. Después solo entran Nadia (21:10, sale a las 21:20), Elías (21:58) y Hugo (00:15). Álex está en el metro a las 21:52 y Nadia en antena de 22:00 a 23:00. A las {journalOpen} solo puede estar Elías.", "At 20:45 floor 3 was empty except for Álex. After that only Nadia (21:10, leaves at 21:20), Elías (21:58) and Hugo (00:15) enter. Álex is in the metro at 21:52 and Nadia on air from 22:00 to 23:00. At {journalOpen} only Elías can be there.") },
      { step: 5, evidence: "altS5", team: 5, title: T("Versión", "Version"), text: T("En el plano S5 alternativo, $1 + 1/2^p = 1.354$ da $p = 1.5$, que no está ni en la v1 ni en la v3. Nadia y Vera cuentan que la v2 tenía p = 1.5. La recibieron Vera, Nadia y Elías.", "In the alternative S5 shot, $1 + 1/2^p = 1.354$ gives $p = 1.5$, which is in neither v1 nor v3. Nadia and Vera explain that v2 had p = 1.5. Vera, Nadia and Elías received it.") },
      { step: 6, evidence: "altS6", team: 6, title: T("Pasillo antiguo", "Old corridor"), text: T("En el plano S6 alternativo, $S_n = L \\cdot A_n$ da $L = 15$: la baliza se asienta entre 9.68 y 11.18 m, no en la hornacina de 8.3 m. Es el pasillo de 25 m de la v1 y la v2.", "In the alternative S6 shot, $S_n = L \\cdot A_n$ gives $L = 15$: the beacon settles between 9.68 and 11.18 m, not in the 8.3 m alcove. It is the 25 m corridor of v1 and v2.") },
      { step: 7, evidence: "press", team: 3, title: T("La mentira que no es el delito", "The lie that is not the crime"), text: T("La declaración de Vera es falsa: la serie armónica diverge y la sonda llega en el minuto 12 367, como dice la biblia. Vera mintió para frenar el daño, pero no estaba en la planta 3.", "Vera's statement is false: the harmonic series diverges and the probe arrives in minute 12 367, as the bible says. Vera lied to limit the damage, but she was not on floor 3.") },
    ],
    eliminations: {
      vera: T("No entra en la planta 3 después de la ronda de las 20:45; cena con Kairo (recibo de las 00:21). Su mentira a la prensa es de control de daños.", "She does not enter floor 3 after the 20:45 round; dinner with Kairo (receipt at 00:21). Her press lie is damage control."),
      hugo: T("Entra en la planta 3 a las 00:15, cuando el render ya llevaba tiempo en marcha; no tenía la v2. Solo la hora ingenua ({renderNaiveStart}) lo señala.", "He enters floor 3 at 00:15, when the render had long been running; he did not have v2. Only the naive time ({renderNaiveStart}) points to him."),
      nadia: T("Sale de la planta 3 a las 21:20 y está en antena de 22:00 a 23:00. Tenía la v2, pero no la oportunidad.", "She leaves floor 3 at 21:20 and is on air from 22:00 to 23:00. She had v2, but not the opportunity."),
      alex: T("Metro a las 21:52; no tenía la v2. La marca de agua señala la copia de la sala, que cualquiera con acceso podía usar, y la secuencia con sus iniciales es un montaje para culparla.", "Metro at 21:52; she did not have v2. The watermark points to the suite's copy, which anyone with access could use, and the sequence with her initials was staged to blame her."),
    },
    motive: T("Humillado en la reunión, apartado de la segunda temporada y con su crédito rebajado, Elías quiso hundir el estreno y que la culpa cayera sobre Álex, que se había reído de sus efectos.", "Humiliated at the meeting, dropped from season 2 and with his credit cut, Elías wanted to sink the premiere and see the blame fall on Álex, who had mocked his effects."),
    mistake: T("Al rehacer los planos S5 y S6 usó su propio generador, con los valores de su versión v2: el exponente 1.5 y el pasillo de 25 m. Su vanidad matemática lo delató.", "When he remade shots S5 and S6 he used his own generator, with the values of his v2: exponent 1.5 and the 25 m corridor. His mathematical vanity gave him away."),
  };
})(typeof window !== "undefined" ? window : globalThis);
