/*
 * Calculus Cases — slides of a case, as PDF (16:9 pages) and as HTML for the projector.
 *
 * A slide is data: {kicker, title, subtitle?, quote?, text?: [..], bullets?: [..],
 * table?: {head, rows, widths}, note?, image?: {data, ratio}, banner?: true}. Texts take the rich
 * markup of the documents ($maths$, **bold**, *italic*). CCSlides.pdf(doc, slides, env) draws them;
 * CCSlides.html(slides, env) prepares them for CCProjector.open().
 */
(function (root) {
  "use strict";
  const TEX = root.CCTex, PDF = root.CCPdf;
  const SLIDE = [254, 142.875];   // mm, 16:9

  function pdf(doc, slides, env) {
    const CC = PDF.CC, R = (text, o) => PDF.rich(doc, text, o), W = SLIDE[0], H = SLIDE[1], m = 14;
    slides.forEach((s, k) => {
      if (k) doc.addPage(SLIDE, "landscape");
      let y = 12;
      if (s.banner && env.banner && env.banner.data) {
        const bh = W * env.banner.ratio;
        doc.addImage(env.banner.data, "JPEG", 0, 0, W, bh, "banner", "FAST");
        y = bh + 12;
      }
      doc.setFont("SFSans", "normal").setFontSize(10).setTextColor(...CC.muted).text(TEX.plain(s.kicker || env.kicker || "").toUpperCase(), m, y);
      doc.setDrawColor(...CC.blue).setLineWidth(0.35).line(m, y + 2.6, W - m, y + 2.6);
      y += 14;
      y += R(s.title, { x: m, y, width: W - 2 * m, size: 28, family: "SFSans", style: "bold", lineH: 11 }).height + 3;
      if (s.subtitle) y += R(s.subtitle, { x: m, y, width: W - 2 * m, size: 20, family: "SFSerif", style: "italic", color: CC.muted, lineH: 8.5 }).height + 2;
      if (s.quote) y += R(s.quote, { x: m + 4, y, width: W - 2 * m - 8, size: 15, family: "SFSerif", style: "italic", color: CC.hand, lineH: 6.8 }).height + 4;
      let textW = W - 2 * m;
      if (s.image && s.image.data) {   // image on the right half
        const iw = (W - 2 * m) * 0.45, ih = Math.min(iw * s.image.ratio, H - y - 12);
        doc.addImage(s.image.data, s.image.png ? "PNG" : "JPEG", W - m - ih / s.image.ratio, y - 4, ih / s.image.ratio, ih, undefined, "FAST");
        textW = W - 2 * m - iw - 6;
      }
      (s.text || []).forEach((p) => { y += R(p, { x: m, y, width: textW, size: 17, lineH: 7.8 }).height + 3.5; });
      (s.bullets || []).forEach((b) => {
        doc.setFillColor(...CC.orange).rect(m + 0.6, y - 3.4, 2.6, 2.6, "F");
        y += R(b, { x: m + 8, y, width: textW - 8, size: 17, lineH: 7.8 }).height + 3;
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
      doc.setFont("SFSans", "normal").setFontSize(8).setTextColor(...CC.muted).text(`${k + 1}/${slides.length}`, W - m, H - 6, { align: "right" });
      doc.text(env.t("Calculus Cases · Material educativo ficticio", "Calculus Cases · Fictional educational material"), m, H - 6);
    });
  }

  function html(slides, env) {
    const rich = (s) => TEX.html(String(s));
    return slides.map((s) => {
      let body = "";
      if (s.subtitle) body += `<p class="ccp-subtitle">${rich(s.subtitle)}</p>`;
      if (s.quote) body += `<blockquote>${rich(s.quote)}</blockquote>`;
      if (s.image && s.image.data) body += `<img src="${s.image.data}" alt="" style="float:right;width:42%;margin:0 0 1em 1.5em;border-radius:6px">`;
      (s.text || []).forEach((p) => { body += `<p>${rich(p)}</p>`; });
      if (s.bullets) body += `<ul>${s.bullets.map((b) => `<li>${rich(b)}</li>`).join("")}</ul>`;
      if (s.table) body += `<table><thead><tr>${s.table.head.map((c) => `<th>${rich(c)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      if (s.note) body += `<p class="ccp-note">${rich(s.note)}</p>`;
      return { kicker: TEX.plain(s.kicker || env.kicker || ""), title: TEX.plain(s.title), banner: s.banner && env.banner ? env.banner.data : null, html: body };
    });
  }

  root.CCSlides = { SLIDE, pdf, html };
})(typeof window !== "undefined" ? window : globalThis);
