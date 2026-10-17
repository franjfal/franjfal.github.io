/*
 * Calculus Cases · Case 7 · The Series Finale — the slides the teacher projects.
 *
 * The opening of the case (launch, 15–20 minutes) and the plan of the closing class, as data
 * built from the case: SFSlides.build(X) returns the slides; SFSlides.pdf(doc, slides, X) draws
 * them on 16:9 pages (document 00, also reproduced in the book) and SFSlides.html(slides, X)
 * turns them into the slides of the shared projector (CCProjector). Texts take the rich markup
 * of the documents ($maths$, **bold**).
 */
(function (root) {
  "use strict";
  const TEX = root.SFTex;
  const PDF = root.SFPdf;
  const SLIDE = [254, 142.875];   // mm, 16:9

  /** Every slide: {part, kicker, title, text?, bullets?, table?, cards?, images?, quote?}. */
  function build(X) {
    const { t, SF, cfg } = X, room = cfg.classroom;
    const kick = t("Calculus Cases · Caso 7 · ZENO", "Calculus Cases · Case 7 · ZENO");
    const ep = (k) => SF.show.episodes.find((e) => e.id === k);
    const groupRows = room.groups.map((g, k) => [`${t("Grupo", "Group")} ${k + 1}`, `${g.episode} · ${X.L(ep(g.episode).title)}`, X.L(ep(g.episode).topic), String(g.size)]);
    const missing = [1, 2, 3, 4, 5, 6].filter((k) => !cfg.episodes.includes(k));
    const slides = [
      { part: "launch", kicker: kick, title: t("El final de ZENO", "The ZENO finale"), subtitle: X.L(SF.show.tagline), banner: true },
      { part: "launch", kicker: X.L({ es: "El diario de la pantalla · {D1date}", en: "The Screen Daily · {D1date}" }), title: t("Filtrado el final de ZENO", "The ZENO finale leaks"),
        text: [X.L({
          es: "Un vídeo de diez segundos con la escena final de la serie más vista del año apareció a las {leakTime} del {D1weekday} en el foro de fans {forum}, publicado por una cuenta recién creada, «punto_z». La plataforma Nadir ha aplazado el estreno del último episodio.",
          en: "A ten-second video with the final scene of the year's most watched show appeared at {leakTime} on {D1weekday} on the fan forum {forum}, posted by a brand-new account, “punto_z”. The platform Nadir has postponed the premiere of the last episode.",
        }), X.L({
          es: "Estudios Meridiano, la productora, ha confirmado que la noche del {D0weekday} alguien manipuló en su sede el proyecto del tráiler oficial. La creadora de la serie dice que el vídeo «es un montaje de fans».",
          en: "Meridian Studios, the production company, has confirmed that on {D0weekday} night someone tampered with the official trailer project at its headquarters. The show's creator says the video “is a fan fake”.",
        })] },
      { part: "launch", kicker: kick, title: t("Lo que pide el inspector jefe", "What the Chief Inspector wants"),
        quote: t("«Para saber qué cambió quien tocó el tráiler, primero hay que saber cómo era. Y para saber cómo era, hay que entender las series». — Nota del consultor", "“To know what whoever touched the trailer changed, we first need to know what it was like. And to know what it was like, we need to understand the series.” — The consultant's note"),
        bullets: t([
          "Cada grupo investiga un episodio: su prueba forense y las matemáticas de su efecto visual.",
          "Cinco compañeros interpretan al equipo creativo: los interrogaréis en la clase de cierre.",
          "En la clase de cierre, el tráiler de la clase se monta con los valores de todos los grupos.",
          "Al final, una acusación con pruebas: quién filtró el final, cuándo, cómo y por qué.",
        ], [
          "Each group investigates one episode: its forensic exhibit and the mathematics of its visual effect.",
          "Five classmates play the creative team: you will question them in the closing class.",
          "In the closing class, the class trailer is built from every group's values.",
          "At the end, an accusation with evidence: who leaked the finale, when, how and why.",
        ]) },
      { part: "launch", kicker: kick, title: t("ZENO: la serie", "ZENO: the show"), text: [X.L(SF.show.logline), X.L(SF.show.premise)] },
      { part: "launch", kicker: kick, title: t("Los seis episodios y sus series", "The six episodes and their series"),
        images: SF.show.episodes.map((e) => ({ still: e.id, caption: `${e.id} · ${X.L(e.title)}`, note: X.L(e.topic) })) },
      { part: "launch", kicker: kick, title: t("Término, suma parcial y serie", "Term, partial sum and series"),
        table: { head: [t("Objeto", "Object"), t("Qué es", "What it is"), t("Pregunta típica", "Typical question")], rows: t([
          ["$a_k$", "El término: lo que se añade en el paso $k$.", "¿Tiende a 0?"],
          ["$S_n$", "La suma parcial: lo acumulado tras $n$ pasos.", "¿Cuánto vale para un $n$ concreto?"],
          ["$\\sum a_k$", "La serie: el límite de $S_n$, si existe.", "¿Converge? ¿Cuánto suma? ¿Cómo se demuestra?"],
        ], [
          ["$a_k$", "The term: what is added at step $k$.", "Does it tend to 0?"],
          ["$S_n$", "The partial sum: what has accumulated after $n$ steps.", "What is it for a given $n$?"],
          ["$\\sum a_k$", "The series: the limit of $S_n$, if it exists.", "Does it converge? What is the sum? How is it proved?"],
        ]), widths: [18, 100, 62] },
        note: t("Cien sumas parciales ayudan a sospechar, pero no demuestran que una serie converja.", "A hundred partial sums help you suspect, but they do not prove that a series converges.") },
      { part: "launch", kicker: kick, title: t("El equipo creativo: los sospechosos", "The creative team: the suspects"),
        cards: SF.people.suspects.map((p) => ({ initials: p.initials, id: p.id, name: p.name, line: `${X.L(p.role)} · ${p.age} ${t("años", "years")}${p.episodes.length ? ` · ${t("episodios", "episodes")} ${p.episodes.join(t(" y ", " and "))}` : ""}` })) },
      { part: "launch", kicker: kick, title: t("Los grupos de esta clase", "This class's groups"),
        table: { head: [t("Grupo", "Group"), t("Episodio", "Episode"), t("Matemáticas", "Mathematics"), t("Estudiantes", "Students")], rows: groupRows, widths: [24, 60, 72, 24] },
        note: (room.pairs ? t(`Sospechosos: cinco parejas (${room.suspects} estudiantes).`, `Suspects: five pairs (${room.suspects} students).`) : t("Sospechosos: cinco estudiantes.", "Suspects: five students."))
          + (missing.length ? " " + t(`Los episodios ${missing.join(", ")} los ha analizado el laboratorio: su resultado llega en el sobre.`, `Episodes ${missing.join(", ")} were analysed by the lab: their result arrives in the envelope.`) : "") },
      { part: "launch", kicker: kick, title: t("Para la clase de cierre", "For the closing class"),
        bullets: t([
          "**El hallazgo** de vuestra prueba forense, en una frase y con su cálculo.",
          "**Los valores de vuestro plano** del tráiler, comprobados con sus reglas.",
          "**Dos preguntas** para los sospechosos que se puedan contrastar con un documento o un cálculo.",
          "El dosier es reservado: no lo enseñéis a otros grupos. Los sospechosos no enseñan su ficha.",
        ], [
          "**The finding** of your forensic exhibit, in one sentence and with its calculation.",
          "**The values of your shot** of the trailer, checked against its rules.",
          "**Two questions** for the suspects that can be checked against a document or a calculation.",
          "The dossier is confidential: do not show it to other groups. The suspects do not show their card.",
        ]) },
      { part: "close", kicker: kick, title: t("La clase de cierre", "The closing class"),
        table: { head: [t("Minutos", "Minutes"), t("Qué hacemos", "What we do")], rows: t([
          ["12", "Puesta en común: cada grupo dice su hallazgo e introduce su plano en la sala de montaje. Vemos el tráiler de la clase."],
          ["5", "Se abre el sobre: registros de acceso, rondas, versiones de la biblia, copias marcadas."],
          ["15", "Interrogatorios: tres rondas, una pregunta por grupo y ronda."],
          ["10", "Tablero de evidencias y acusación de cada grupo."],
          ["10", "Lectura de las acusaciones, declaración final y el final de ZENO."],
          ["5", "Comprobación individual."],
        ], [
          ["12", "Pooling: each group states its finding and enters its shot in the editing room. We watch the class trailer."],
          ["5", "The envelope is opened: access records, rounds, bible versions, marked copies."],
          ["15", "Interviews: three rounds, one question per group and round."],
          ["10", "Evidence board and each group's accusation."],
          ["10", "Reading of the accusations, final statement and the ZENO finale."],
          ["5", "Individual check."],
        ]), widths: [22, 158] } },
      { part: "close", kicker: kick, title: t("Normas de los interrogatorios", "Interview rules"), bullets: X.L(SF.cards.common.rules) },
      { part: "close", kicker: kick, title: t("La acusación", "The accusation"),
        bullets: t([
          "**Quién** filtró el final y **cuándo** actuó: la hora de inicio y el cálculo que la demuestra.",
          "**Cómo** obtuvo el vídeo y lo publicó, y **por qué** manipuló el tráiler.",
          "**Al menos dos pruebas matemáticas**, cada una con su cálculo.",
          "**Por qué se descarta** a cada uno de los demás.",
        ], [
          "**Who** leaked the finale and **when** they acted: the start time and the calculation that proves it.",
          "**How** they obtained and posted the video, and **why** they tampered with the trailer.",
          "**At least two mathematical exhibits**, each with its calculation.",
          "**Why each of the others is ruled out**.",
        ]) },
    ];
    return slides;
  }

  // ------------------------------------------------------------------------ PDF (document 00)
  function pdf(doc, slides, X) {
    const CC = PDF.CC, R = (text, o) => PDF.rich(doc, text, o), W = SLIDE[0], H = SLIDE[1], m = 14;
    slides.forEach((s, k) => {
      if (k) doc.addPage(SLIDE, "landscape");
      doc.setFillColor(255, 255, 255).rect(0, 0, W, H, "F");
      let y = 12;
      if (s.banner && X.A.banner) {
        const bh = W * X.A.banner.ratio;
        doc.addImage(X.A.banner.data, "JPEG", 0, 0, W, bh, "banner", "FAST");
        y = bh + 12;
      }
      doc.setFont("SFSans", "normal").setFontSize(10).setTextColor(...CC.muted).text(TEX.plain(s.kicker).toUpperCase(), m, y);
      doc.setDrawColor(...CC.blue).setLineWidth(0.35).line(m, y + 2.6, W - m, y + 2.6);
      y += 14;
      y += R(s.title, { x: m, y, width: W - 2 * m, size: 28, family: "SFSans", style: "bold", lineH: 11 }).height + 3;
      if (s.subtitle) { y += R(s.subtitle, { x: m, y, width: W - 2 * m, size: 20, family: "SFSerif", style: "italic", color: CC.muted, lineH: 8.5 }).height + 2; }
      if (s.quote) { y += R(s.quote, { x: m + 4, y, width: W - 2 * m - 8, size: 15, family: "SFSerif", style: "italic", color: CC.hand, lineH: 6.8 }).height + 4; }
      (s.text || []).forEach((p) => { y += R(p, { x: m, y, width: W - 2 * m, size: 17, lineH: 7.8 }).height + 3.5; });
      (s.bullets || []).forEach((b) => {
        doc.setFillColor(...CC.orange).rect(m + 0.6, y - 3.4, 2.6, 2.6, "F");
        y += R(b, { x: m + 8, y, width: W - 2 * m - 8, size: 17, lineH: 7.8 }).height + 3;
      });
      if (s.table) {
        const tw = W - 2 * m, total = s.table.widths.reduce((a, b) => a + b, 0), ws = s.table.widths.map((v) => v * tw / total);
        const rowH = (row, head) => Math.max(...row.map((c, i) => R(String(c), { x: 0, y: 0, width: ws[i] - 4, size: head ? 13 : 14, family: "SFSans", style: head ? "bold" : "normal", lineH: 6, measureOnly: true }).height)) + 4.4;
        [s.table.head, ...s.table.rows].forEach((row, r) => {
          const head = r === 0, h = rowH(row, head);
          let x = m;
          row.forEach((c, i) => {
            if (head) doc.setFillColor(...CC.blue).setDrawColor(...CC.blue); else doc.setFillColor(...(r % 2 ? [255, 255, 255] : CC.zebra)).setDrawColor(...CC.grid);
            doc.setLineWidth(0.2).rect(x, y, ws[i], h, "FD");
            R(String(c), { x: x + 2, y: y + 6.6, width: ws[i] - 4, size: head ? 13 : 14, family: "SFSans", style: head ? "bold" : "normal", lineH: 6, color: head ? [255, 255, 255] : CC.ink });
            x += ws[i];
          });
          y += h;
        });
        y += 5;
      }
      if (s.note) R(s.note, { x: m, y: Math.min(y + 2, H - 14), width: W - 2 * m, size: 14, family: "SFSerif", style: "italic", color: CC.muted, lineH: 6.4 });
      if (s.images) {
        const cols = 3, gap = 5, iw = (W - 2 * m - gap * (cols - 1)) / cols, rowH = (H - y - 8) / 2, ih = Math.min(iw * 9 / 16, rowH - 16);
        s.images.forEach((im, i) => {
          const x = m + (i % cols) * (iw + gap), yy = y + Math.floor(i / cols) * rowH, cw = ih * 16 / 9;
          const data = X.A.stills && X.A.stills[im.still];
          if (data) doc.addImage(data, "JPEG", x + (iw - cw) / 2, yy, cw, ih, `slide-still-${im.still}`, "FAST");
          R(`**${im.caption}**`, { x, y: yy + ih + 5, width: iw, size: 12, family: "SFSans", lineH: 5 });
          R(im.note, { x, y: yy + ih + 10, width: iw, size: 10.5, family: "SFSerif", style: "italic", color: CC.hand, lineH: 4.4 });
        });
      }
      if (s.cards) {
        const colors = { vera: [92, 58, 120], hugo: [32, 80, 110], nadia: [155, 80, 30], elias: [70, 92, 70], alex: [150, 40, 40] };
        const rh = Math.min(19, (H - y - 10) / s.cards.length);
        s.cards.forEach((c, i) => {
          const yy = y + i * rh;
          doc.setFillColor(...(colors[c.id] || CC.blue)).roundedRect(m, yy, rh - 3, rh - 3, 1.2, 1.2, "F");
          doc.setFont("SFSans", "bold").setFontSize(13).setTextColor(255, 255, 255).text(c.initials, m + (rh - 3) / 2, yy + (rh - 3) / 2 + 1.8, { align: "center" });
          doc.setFont("SFSans", "bold").setFontSize(16).setTextColor(...CC.ink).text(c.name, m + rh + 2, yy + 6);
          doc.setFont("SFSans", "normal").setFontSize(13).setTextColor(...CC.muted).text(c.line, m + rh + 2, yy + 12.5);
        });
      }
      doc.setFont("SFSans", "normal").setFontSize(8).setTextColor(...CC.muted).text(`${k + 1}/${slides.length}`, W - m, H - 6, { align: "right" });
      doc.text(X.t("Calculus Cases · Material educativo ficticio", "Calculus Cases · Fictional educational material"), m, H - 6);
    });
  }

  // ------------------------------------------------------------------------ HTML (projector)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function html(slides, X) {
    const rich = (s) => TEX.html(String(s));
    return slides.map((s) => {
      let body = "";
      if (s.subtitle) body += `<p class="ccp-subtitle">${rich(s.subtitle)}</p>`;
      if (s.quote) body += `<blockquote>${rich(s.quote)}</blockquote>`;
      (s.text || []).forEach((p) => { body += `<p>${rich(p)}</p>`; });
      if (s.bullets) body += `<ul>${s.bullets.map((b) => `<li>${rich(b)}</li>`).join("")}</ul>`;
      if (s.table) body += `<table><thead><tr>${s.table.head.map((c) => `<th>${rich(c)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      if (s.images) body += `<div class="ccp-grid">${s.images.map((im) => `<figure>${X.A.stills && X.A.stills[im.still] ? `<img src="${X.A.stills[im.still]}" alt="">` : ""}<figcaption><strong>${esc(im.caption)}</strong><br><em>${rich(im.note)}</em></figcaption></figure>`).join("")}</div>`;
      if (s.cards) body += `<div class="ccp-people">${s.cards.map((c) => `<div><span class="ccp-badge ccp-${c.id}">${esc(c.initials)}</span><strong>${esc(c.name)}</strong><br><span>${esc(c.line)}</span></div>`).join("")}</div>`;
      if (s.note) body += `<p class="ccp-note">${rich(s.note)}</p>`;
      return { kicker: TEX.plain(s.kicker), title: TEX.plain(s.title), banner: s.banner && X.A.banner ? X.A.banner.data : null, html: body, part: s.part };
    });
  }

  root.SFSlides = { SLIDE, build, pdf, html };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFSlides;
})(typeof window !== "undefined" ? window : globalThis);
