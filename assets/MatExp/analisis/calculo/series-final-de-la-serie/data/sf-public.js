/*
 * Calculus Cases · Case 7 · The Series Finale (El final de la serie) — public case data.
 *
 * Single source for the printable documents, the student room, the series lab and the trailer.
 * This file holds only what students may see from the first session on. The finale of the show,
 * the private role cards, the envelope of the second session and the solution live in
 * sf-private.js, which the student room never loads.
 *
 * Text conventions: every string is {es, en}. Inline mathematics goes between $…$ in a small TeX
 * subset (see sf-tex.js); display formulas use $$…$$. Times are 24 h. Dates are written as tokens
 * ({D0} = the night of the leak, a Tuesday) and filled in from the generator's configuration.
 */
(function (root) {
  "use strict";
  const SF = (root.SFData = root.SFData || {});

  SF.meta = {
    id: "calculus-cases/series-finale",
    caseNumber: 7,
    dataVersion: "1.0.0",
    schema: 1,
    title: { es: "El final de la serie", en: "The Series Finale" },
    topic: { es: "Sucesiones y series", en: "Sequences and Series" },
    show: "ZENO",
    fileCode: "ZENO",
    office: { es: "Oficina de Investigación · Unidad de Propiedad Intelectual", en: "Investigation Office · Intellectual Property Unit" },
    defaultNight: "2026-10-13",
    footer: { es: "Calculus Cases · Material educativo ficticio", en: "Calculus Cases · Fictional educational material" },
  };

  /* Dates relative to the night of the leak (offset in days; 0 = Tuesday night). */
  SF.dateTokens = { D0: 0, D1: 1, D3: 3, Dm8: -8, Dm7: -7, Dm6: -6, Dm5: -5, Dm4: -4, Dm1: -1, Dm3: -3, Dm10: -10 };

  // ----------------------------------------------------------------------------------- the show
  SF.show = {
    title: "ZENO",
    platform: "Nadir",
    studio: { es: "Estudios Meridiano", en: "Meridian Studios" },
    tagline: { es: "Infinitos pasos. Un solo final.", en: "Infinite steps. One ending." },
    logline: {
      es: "Cuando su hermano desaparece dentro de un laboratorio en el que el tiempo puede partirse en mitades, una física expulsada de él tiene nueve días para llegar a una puerta que cada paso acerca y que, según todos, ningún paso alcanza.",
      en: "When her brother vanishes inside a laboratory where time can be cut in halves, a physicist who was thrown out of it has nine days to reach a door that every step brings closer and that, everyone says, no step can reach.",
    },
    premise: {
      es: "Bajo el monte Orba, el Laboratorio Zeno estudiaba el efecto Zenón cuántico: un sistema al que se observa sin descanso no puede cambiar. Durante el experimento «Observación 7» algo salió mal. Una región del laboratorio, la Zona, quedó atrapada en un instante que nunca termina de pasar, y Leo Kass, el técnico que estaba dentro, desapareció. Su hermana Irene, a la que expulsaron del laboratorio hace dos años, vuelve para buscarlo. El director, Viktor Halden, repite que no hay nada que hacer: dentro de la Zona todo se divide en infinitos pasos, y ningún camino termina. Irene sabe que infinitos pasos pueden sumar una distancia finita.",
      en: "Beneath Mount Orba, the Zeno Laboratory studied the quantum Zeno effect: a system that is watched without pause cannot change. During the experiment known as Observation 7, something went wrong. A region of the laboratory, the Zone, was caught in an instant that never quite passes, and Leo Kass, the technician inside, vanished. His sister Irene, who was thrown out of the laboratory two years earlier, comes back to look for him. The director, Viktor Halden, keeps saying there is nothing to be done: inside the Zone everything splits into infinitely many steps, and no path ever ends. Irene knows that infinitely many steps can add up to a finite distance.",
    },
    world: [
      { es: "El Laboratorio Zeno: siete niveles excavados en una antigua mina de sal bajo el monte Orba.", en: "The Zeno Laboratory: seven levels dug into an old salt mine beneath Mount Orba." },
      { es: "La red de observación: 240 cámaras en diez anillos alrededor de la Zona. El protocolo exige que la Zona no quede nunca sin observar.", en: "The observation network: 240 cameras in ten rings around the Zone. The protocol says the Zone must never go unobserved." },
      { es: "La Zona: un pasillo de servicio de 20 metros que termina en una puerta estanca, el Punto Z. Dentro, el espacio se estira y los ecos vuelven antes de tiempo.", en: "The Zone: a 20-metre service corridor ending in a sealed door, Point Z. Inside, space stretches and echoes come back too soon." },
      { es: "La hornacina: un nicho en la pared del pasillo, a 8.3 metros de la entrada. Es donde aparece el Observador.", en: "The alcove: a recess in the corridor wall, 8.3 metres from the entrance. It is where the Observer appears." },
    ],
    characters: [
      { id: "irene", name: "Irene Kass", age: 34, role: { es: "Física experimental, protagonista", en: "Experimental physicist, lead" }, text: { es: "Brillante y tozuda. La expulsaron del laboratorio por denunciar los riesgos de la Observación 7. Lleva siempre un cuaderno de tapas rojas.", en: "Brilliant and stubborn. She was thrown out of the laboratory for warning about the risks of Observation 7. She always carries a red notebook." } },
      { id: "leo", name: "Leo Kass", age: 24, role: { es: "Técnico de cámaras, desaparecido", en: "Camera technician, missing" }, text: { es: "El hermano pequeño de Irene. Estaba dentro de la Zona cuando todo falló. Solo aparece en grabaciones.", en: "Irene's younger brother. He was inside the Zone when everything failed. He appears only in recordings." } },
      { id: "halden", name: "Viktor Halden", age: 58, role: { es: "Director del laboratorio", en: "Laboratory director" }, text: { es: "Carismático y culto, cita a Zenón de memoria. Selló la Zona y está convencido de que nadie puede cruzarla.", en: "Charismatic and well read, he quotes Zeno from memory. He sealed the Zone and is convinced that nobody can cross it." } },
      { id: "sara", name: "Sara Ndiaye", age: 41, role: { es: "Jefa de seguridad", en: "Head of security" }, text: { es: "Exmilitar. Primero se interpone en el camino de Irene; después la acompaña hasta donde puede.", en: "Former soldier. At first she stands in Irene's way; then she goes with her as far as she can." } },
      { id: "tom", name: "Tom Rey", age: 27, role: { es: "Archivero de datos", en: "Data archivist" }, text: { es: "Ingenioso y nervioso. Recupera lo que otros borran.", en: "Quick and nervous. He recovers what others delete." } },
      { id: "observer", name: { es: "El Observador", en: "The Observer" }, role: { es: "Una figura en las cámaras", en: "A figure on the cameras" }, text: { es: "Aparece en las pantallas, siempre de espaldas, siempre en el mismo sitio. Nadie sabe quién es.", en: "It appears on the screens, always with its back turned, always in the same place. Nobody knows who it is." } },
    ],
    // Episodes 1–6 are public. The finale lives in sf-private.js.
    episodes: [
      {
        id: 1, key: "countdown", title: { es: "Cuenta atrás", en: "Countdown" },
        topic: { es: "Sucesiones y límites · progresiones aritméticas · sumas finitas", en: "Sequences and limits · arithmetic progressions · finite sums" },
        synopsis: {
          es: "Sara despierta a Irene de madrugada: Leo ha desaparecido. En el laboratorio, la alarma de la Zona cuenta hacia el sellado, pero sus pitidos se acercan unos a otros: el pitido $n$ suena en el segundo $60n/(n+1)$. Halden asegura que la cuenta no puede terminar, porque siempre falta un pitido. Irene cuenta los que caben antes del segundo 59, y antes del 59.9. Caben infinitos, y todos antes del segundo 60. El segundo 60 llega, y la puerta se sella con Irene, Sara y Tom dentro del pasillo de acceso. En una de las 240 pantallas, de espaldas, hay una figura.",
          en: "Sara wakes Irene before dawn: Leo has vanished. At the laboratory, the Zone's alarm is counting down to the seal, but its beeps keep crowding together: beep $n$ sounds at second $60n/(n+1)$. Halden insists the count cannot end, because there is always one more beep. Irene counts how many fit before second 59, and before 59.9. Infinitely many fit, and all of them before second 60. Second 60 arrives, and the door seals with Irene, Sara and Tom inside the access corridor. On one of the 240 screens, with its back turned, there is a figure.",
        },
        still: { es: "La sala de control: diez anillos de pantallas alrededor de un plano de la Zona; una cuenta atrás roja.", en: "The control room: ten rings of screens around a plan of the Zone; a red countdown." },
      },
      {
        id: 2, key: "achilles", title: { es: "Aquiles", en: "Achilles" },
        topic: { es: "Series geométricas", en: "Geometric series" },
        synopsis: {
          es: "En el pasillo, cada pulso del sónar vuelve desde el 60 % de la distancia anterior. Irene persigue al Observador: cuando llega adonde él estaba, él ya ha avanzado el 60 % del hueco. Halden, por radio: «Zenón ya lo demostró: nunca lo alcanzarás». Irene: «Zenón demostró que hacen falta infinitos pasos, no infinitos metros». La persecución termina exactamente en la puerta del fondo, donde el Observador atraviesa una puerta que no debería abrirse.",
          en: "In the corridor, every sonar pulse comes back from 60% of the previous distance. Irene chases the Observer: whenever she reaches the place where he was, he has already moved on 60% of the gap. Halden, over the radio: “Zeno proved it long ago: you will never catch him.” Irene: “Zeno proved that it takes infinitely many steps, not infinitely many metres.” The chase ends exactly at the far door, where the Observer slips through a door that should not open.",
        },
        still: { es: "El pasillo en perspectiva, anillos de luz que se encienden y se apiñan hacia la puerta.", en: "The corridor in perspective, rings of light flaring up and crowding towards the door." },
      },
      {
        id: 3, key: "rope", title: { es: "La cuerda", en: "The Rope" },
        topic: { es: "Serie armónica", en: "The harmonic series" },
        synopsis: {
          es: "Más allá de la puerta, el pasillo crece 100 metros cada minuto. Tom lanza una sonda, la Hormiga, que avanza 10 metros por minuto. Halden: «Nunca llegará: cada minuto recorre una parte más pequeña del pasillo». Irene: «Más pequeña, pero nunca nada». La sonda llegará, y el ordenador de Tom calcula cuándo. Arranca un temporizador de nueve días.",
          en: "Beyond the door, the corridor grows 100 metres every minute. Tom sends a probe, the Ant, which crawls 10 metres a minute. Halden: “It will never arrive: every minute it covers a smaller part of the corridor.” Irene: “Smaller, but never nothing.” The probe will arrive, and Tom's computer works out when. A nine-day timer starts.",
        },
        still: { es: "Un pasillo infinito que se estira; una luz diminuta que avanza; un contador de minutos.", en: "An endless corridor stretching away; a tiny light creeping forward; a minute counter." },
      },
      {
        id: 4, key: "log", title: { es: "El registro borrado", en: "The Erased Log" },
        topic: { es: "Series telescópicas", en: "Telescoping series" },
        synopsis: {
          es: "Tom recupera el registro de la Observación 7. Cada línea anota la coherencia perdida en una observación, y el final del registro está borrado. Irene descubre que, al sumar las líneas, casi todo se cancela: solo importan la primera y la última lectura. El pie del registro, que Halden olvidó borrar, da la coherencia final. De ahí sale el número de observaciones de cada ciclo, y no coincide con el número de cámaras. Alguien mira desde dentro de la Zona.",
          en: "Tom recovers the log of Observation 7. Each line records the coherence lost at one observation, and the end of the log has been erased. Irene realises that when the lines are added almost everything cancels: only the first and the last readings matter. The footer of the log, which Halden forgot to erase, gives the final coherence. From it follows the number of observations in each cycle, and it does not match the number of cameras. Someone is watching from inside the Zone.",
        },
        still: { es: "Una pantalla verde de registros en la que las líneas se tachan por parejas.", en: "A green log screen where the lines strike each other out in pairs." },
      },
      {
        id: 5, key: "dose", title: { es: "Dosis", en: "Dose" },
        topic: { es: "Series p · comparación", en: "p-series · comparison" },
        synopsis: {
          es: "Irene y Sara entran en el borde de la Zona. En el minuto $n$, Sara recibe $1/n$ unidades de dosis e Irene $1/n^2$. Las dos empiezan con una unidad; el umbral letal es 2. Halden: «Vuestras dosis bajan cada minuto; estáis a salvo». Irene: «Bajar no basta». Sara tiene que volver atrás. Irene sigue sola.",
          en: "Irene and Sara cross into the edge of the Zone. In minute $n$, Sara receives $1/n$ dose units and Irene $1/n^2$. Both start with one unit; the lethal threshold is 2. Halden: “Your doses drop every minute; you are both safe.” Irene: “Dropping is not enough.” Sara has to turn back. Irene goes on alone.",
        },
        still: { es: "Dos dosímetros en las muñecas de Irene y Sara; una línea roja.", en: "Two dosimeters on Irene's and Sara's wrists; a red line." },
      },
      {
        id: 6, key: "pendulum", title: { es: "Péndulo", en: "Pendulum" },
        topic: { es: "Series alternadas · convergencia absoluta y condicional", en: "Alternating series · absolute and conditional convergence" },
        synopsis: {
          es: "La baliza de Leo aparece en el escáner: avanza 12 metros, retrocede 6, avanza 4, retrocede 3… Halden: «Está perdido. Ha andado más que todos nosotros y andará siempre». Irene: «Andará siempre, pero va a alguna parte». Irene acota dónde terminará la baliza: en la hornacina, el lugar del Observador. Último plano: el Observador empieza a darse la vuelta.",
          en: "Leo's beacon shows up on the scanner: it moves forward 12 metres, back 6, forward 4, back 3… Halden: “He is lost. He has walked further than any of us and he will walk forever.” Irene: “He will walk forever, but he is going somewhere.” Irene pins down where the beacon will settle: in the alcove, the Observer's place. Last shot: the Observer starts to turn around.",
        },
        still: { es: "Un escáner con un punto que oscila y una estela cada vez más larga.", en: "A scanner with a dot swinging back and forth and an ever-longer trail." },
      },
    ],
  };

  // ------------------------------------------------------------------------ the creative team
  // Public profiles only. Private cards are in sf-private.js.
  SF.people = {
    suspects: [
      {
        id: "vera", name: "Vera Lindqvist", initials: "VL", age: 52,
        role: { es: "Creadora y showrunner", en: "Creator and showrunner" },
        episodes: [1, 7],
        public: {
          es: "Creó ZENO y dirige la sala de guionistas. Escribió el episodio 1 y, con Nadia Ferrán, el final. Negocia con Nadir una segunda temporada. En la reunión del martes anunció cambios en el equipo. El miércoles declaró a la prensa que el vídeo filtrado es un montaje de fans.",
          en: "She created ZENO and runs the writers' room. She wrote episode 1 and, with Nadia Ferrán, the finale. She is negotiating a second season with Nadir. At Tuesday's meeting she announced changes in the team. On Wednesday she told the press that the leaked video is a fan fake.",
        },
        look: { es: "Pelo gris muy corto, gafas de pasta negras, chaqueta oscura.", en: "Very short grey hair, black-rimmed glasses, dark jacket." },
      },
      {
        id: "hugo", name: "Hugo Mercer", initials: "HM", age: 39,
        role: { es: "Guionista principal", en: "Head writer" },
        episodes: [2, 6],
        public: {
          es: "Escribió los episodios 2 y 6. Conoce como nadie a los fans de la serie y su foro, Archivo Orba. Iba a escribir el final, pero Vera se lo encargó a Nadia. La noche del martes trabajó hasta tarde en la sala de guionistas (planta 2).",
          en: "He wrote episodes 2 and 6. Nobody knows the show's fans, and their forum, Orba Archive, better than he does. He was going to write the finale, but Vera gave it to Nadia. On Tuesday night he worked late in the writers' room (floor 2).",
        },
        look: { es: "Barba, sudadera con capucha, auriculares al cuello.", en: "Beard, hoodie, headphones round his neck." },
      },
      {
        id: "nadia", name: "Nadia Ferrán", initials: "NF", age: 33,
        role: { es: "Guionista del episodio final", en: "Writer of the finale" },
        episodes: [5, 7],
        public: {
          es: "Escribió el episodio 5 y el final, con Vera. Discutió con la plataforma por los cambios del final. El martes por la noche participó en directo en un programa de radio sobre series.",
          en: "She wrote episode 5 and, with Vera, the finale. She argued with the platform over the changes to the ending. On Tuesday night she took part live in a radio programme about TV series.",
        },
        look: { es: "Pelo rizado recogido, cuaderno lleno de pósits.", en: "Curly hair tied up, a notebook full of sticky notes." },
      },
      {
        id: "elias", name: "Elías Brandt", initials: "EB", age: 47,
        role: { es: "Asesor matemático", en: "Mathematics adviser" },
        episodes: [3, 4],
        public: {
          es: "Antiguo profesor universitario. Diseñó las matemáticas de la serie y escribió la biblia de efectos matemáticos que usan guionistas, montaje y efectos visuales. Firmó con Vera las escenas de los episodios 3 y 4. Colabora con la investigación desde el primer día.",
          en: "A former university lecturer. He designed the show's mathematics and wrote the mathematical effects bible used by the writers, the editors and the visual effects house. With Vera, he signed the scenes of episodes 3 and 4. He has been helping the investigation since the first day.",
        },
        look: { es: "Traje gris, corbata fina, reloj de bolsillo.", en: "Grey suit, thin tie, pocket watch." },
      },
      {
        id: "alex", name: "Álex Soler", initials: "AS", age: 29,
        role: { es: "Montadora del tráiler", en: "Trailer editor" },
        episodes: [],
        public: {
          es: "Monta el tráiler oficial de la temporada en la sala de montaje de la planta 3. Su copia de visionado del final está importada en el proyecto del tráiler, para cortar el plano del cierre. El martes trabajó en el tráiler hasta la noche.",
          en: "She is cutting the official season trailer in the editing suite on floor 3. Her screening copy of the finale is imported into the trailer project, to cut the closing shot. On Tuesday she worked on the trailer into the evening.",
        },
        look: { es: "Cazadora vaquera, pelo teñido de azul, gafas de pantalla.", en: "Denim jacket, hair dyed blue, screen glasses." },
      },
    ],
    others: [
      { id: "marta", name: "Marta Quiroga", role: { es: "Jefa de seguridad de Estudios Meridiano", en: "Head of security, Meridian Studios" } },
      { id: "ruben", name: "Rubén Lago", role: { es: "Vigilante nocturno", en: "Night security guard" } },
    ],
  };

  // ------------------------------------------------------------------- investigation parameters
  // Fixed facts of the case file (what really happened). The engine (sf-evidence.js) derives every
  // number printed in the evidence from these values, and checks that the solution stays unique.
  SF.investigation = {
    corridor: { built: 20, early: 25 },
    officialTrailer: { s0: { form: "R", T: 10, c: 6 }, s1: { a: 6, d: 4, n: 10 }, s2: { a: 8, r: 0.6 }, s3: { c: 10, L: 100 }, s4: { form: "H", A: 1, m: 0 }, s5: { D: 1, pS: 1, pI: 2 }, s6: { form: "P", L: 12, s: 1 } },
    episodeModels: {
      countdown: { T: 60, c: 1 },
      rings: { a: 6, d: 4, total: 240 },
      echo: { a: 8, r: 0.6 },
      rope: { c: 10, L: 100 },
      log: { finalCoherence: 0.004 },
      dose: { D: 1, threshold: 2, pSara: 1, pIrene: 2 },
      beacon: { L: 12 },
    },
    leak: { postedAt: "07:40", dayOffset: 1, forum: { es: "Archivo Orba", en: "Orba Archive" }, user: "punto_z", seconds: 10, frames: 240, ringsShown: 5, r: 0.64 },
    render: { job: "TRL_ALT_07", frames: 240, first: 12, step: 0.25, finish: "01:12:30", profile: "ZENO-VOL-3" },
    journal: {
      file: "ZENO_TRAILER.mtg",
      total: "38:50:35",
      lastSave: { day: 1, time: "01:14:00" },
      sessions: [
        { day: -8, save: "13:42:10", open: "4:10:00" },
        { day: -8, save: "19:05:40", open: "3:02:30" },
        { day: -7, save: "14:20:00", open: "5:15:00" },
        { day: -6, save: "12:58:15", open: "2:47:45" },
        { day: -5, save: "18:31:00", open: "4:05:00" },
        { day: -4, save: "16:12:30", open: "3:40:15" },
        { day: -1, save: "13:10:00", open: "2:58:30" },
        { day: -1, save: "20:44:20", open: "4:21:00" },
        { day: 0, save: "18:50:45", open: "4:45:25" },
        { day: 0, save: "21:35:10", open: "0:55:10" },
      ],
    },
    altCut: { s5: { p: 1.5, minutes: [1, 2, 4, 8, 11] }, s6: { L: 15, swings: [5, 6, 9, 10] } },
    // The table of watermarked copies (who holds which ratio) is in the envelope: sf-private.js.
  };

  // --------------------------------------------------------------------- the official trailer
  // Script of the official trailer (version 6, cut by Álex Soler). The mathematical layer of each
  // segment is driven by a family of sf-math.js; the parameters are those of the effects bible v3.
  SF.trailer = {
    title: { es: "ZENO · Tráiler oficial del final (v6)", en: "ZENO · Official finale trailer (v6)" },
    duration: 112,
    // Final-art plates, by shot, in media/plates/ (1920 × 1080, no text; brief in tools/shotlist.json),
    // e.g. { S2: "S2-corridor.jpg" }. Shots without a plate use the procedural preview.
    plates: {},
    segments: [
      { id: "S0", episode: 1, family: "countdown", start: 0, end: 12, title: { es: "Arranque: la cuenta atrás", en: "Cold open: the countdown" },
        desc: { es: "Negro. Pitidos cada vez más juntos y un destello rojo con cada uno; el reloj del límite. En el límite, corte seco al título ZENO.", en: "Black. Beeps closer and closer together, a red flash with each one; the clock of the limit. At the limit, a hard cut to the ZENO title." },
        card: { es: "ALGUNAS CUENTAS ATRÁS NUNCA LLEGAN A CERO", en: "SOME COUNTDOWNS NEVER REACH ZERO" } },
      { id: "S1", episode: 1, family: "rings", start: 12, end: 26, title: { es: "El laboratorio y sus 240 cámaras", en: "The laboratory and its 240 cameras" },
        desc: { es: "Exterior nocturno del monte Orba. Vista cenital de la Zona: los anillos de cámaras se encienden uno a uno, del centro hacia fuera.", en: "Night exterior of Mount Orba. Overhead view of the Zone: the camera rings light up one by one, from the centre outwards." },
        card: { es: "UN LUGAR QUE NUNCA DEJA DE SER OBSERVADO", en: "A PLACE THAT IS NEVER UNOBSERVED" } },
      { id: "S2", episode: 2, family: "geometric", start: 26, end: 40, title: { es: "Aquiles: la persecución", en: "Achilles: the chase" },
        desc: { es: "El pasillo en perspectiva. Irene corre hacia la figura; con cada paso se enciende un anillo de eco. Los anillos se apiñan hacia la puerta.", en: "The corridor in perspective. Irene runs towards the figure; a ring of echo flares up with each step. The rings crowd towards the door." },
        card: { es: "CADA PASO TE ACERCA", en: "EVERY STEP BRINGS YOU CLOSER" } },
      { id: "S3", episode: 3, family: "rope", start: 40, end: 54, title: { es: "La cuerda: la sonda", en: "The Rope: the probe" },
        desc: { es: "El pasillo se estira hacia el horizonte. La luz de la sonda avanza cada vez menos. Contador de minutos y fracción recorrida.", en: "The corridor stretches to the horizon. The probe's light advances less and less. A minute counter and the fraction covered." },
        card: { es: "«NUNCA LLEGARÁ»", en: "“IT WILL NEVER ARRIVE”" } },
      { id: "S4", episode: 4, family: "telescoping", start: 54, end: 66, title: { es: "El registro borrado", en: "The erased log" },
        desc: { es: "Pantalla de registro: las líneas aparecen y se tachan por parejas; solo quedan la primera y la última. Rótulo con el número de observaciones.", en: "Log screen: lines appear and strike each other out in pairs; only the first and the last remain. A caption with the number of observations." },
        card: { es: "ALGUIEN MIRA DESDE DENTRO", en: "SOMEONE IS WATCHING FROM INSIDE" } },
      { id: "S5", episode: 5, family: "pseries", start: 66, end: 80, title: { es: "Dosis", en: "Dose" },
        desc: { es: "Dos dosímetros suben minuto a minuto. El de Sara cruza la línea roja y suena la alarma; el de Irene se frena antes.", en: "Two dosimeters climb minute by minute. Sara's crosses the red line and the alarm sounds; Irene's slows down before it." },
        card: { es: "BAJAR NO BASTA", en: "DROPPING IS NOT ENOUGH" } },
      { id: "S6", episode: 6, family: "alternating", start: 80, end: 94, title: { es: "Péndulo", en: "Pendulum" },
        desc: { es: "El escáner: la baliza oscila con amplitudes cada vez menores y se asienta en la hornacina. La estela del camino no deja de crecer.", en: "The scanner: the beacon swings with ever smaller amplitudes and settles in the alcove. The trail of its path keeps growing." },
        card: { es: "ANDARÁ SIEMPRE. PERO VA A ALGUNA PARTE", en: "HE WILL WALK FOREVER. BUT HE IS GOING SOMEWHERE" } },
      { id: "S7", episode: 7, family: "finale", start: 94, end: 112, title: { es: "Cierre: la puerta", en: "Closing: the door" },
        desc: { es: "Montaje acelerado con los pitidos de la cuenta atrás. La puerta del Punto Z; la mano de Irene sobre ella. Negro. Rótulo final con el lema y la fecha.", en: "An accelerating montage on the countdown beeps. The door of Point Z; Irene's hand on it. Black. End card with the tagline and the date." },
        card: { es: "INFINITOS PASOS. UN SOLO FINAL.", en: "INFINITE STEPS. ONE ENDING." } },
    ],
  };
})(typeof window !== "undefined" ? window : globalThis);
