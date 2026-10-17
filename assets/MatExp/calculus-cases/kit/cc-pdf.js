/*
 * Calculus Cases — shared PDF writer in the house style.
 *
 * The case-file style of every Calculus Cases document (ESTANDAR_WEB_ACTIVIDADES.md §4), as in the
 * Delta City writer: navy CaseBlue headings, rules and table headers, CaseOrange markers, stamp
 * red for restricted documents, sans for headings, labels and tables, serif body, the activity
 * banner on the first page of each document, and the footer "… · Calculus Cases · …  n/N".
 * The only change: GNU FreeSans/FreeSerif (Helvetica/Times metric clones) replace jsPDF's core
 * fonts, so that mathematics prints as text, with italic variables, superscripts and subscripts.
 */
(function (root) {
  "use strict";
  const TEX = root.CCTex;

  const CC = {
    blue: [32, 80, 110], orange: [155, 80, 30], stamp: [150, 40, 40], ink: [28, 30, 34],
    muted: [112, 112, 112], rule: [155, 155, 155], zebra: [246, 247, 248], grid: [200, 203, 206], hand: [24, 52, 128],
    tint: { blue: [242, 246, 249], warn: [249, 241, 240], note: [250, 245, 238] },
  };
  const PAPER = { a4: [210, 297], letter: [215.9, 279.4] };
  const PT = 0.3528;   // mm per point

  /** A new portrait document with the case fonts registered. */
  function newDoc(format, orientation = "portrait") {
    const doc = new root.jspdf.jsPDF({ unit: "mm", format, orientation, compress: true });
    const F = root.CCFonts || {};
    Object.keys(F).forEach((k) => {
      const f = F[k];
      doc.addFileToVFS(f.file, f.data);
      doc.addFont(f.file, f.family, f.style);
    });
    return doc;
  }

  // ------------------------------------------------------------------ inline rich text
  /** Text with $maths$, **bold** and *italic* -> tokens of pieces {text, family, style, scale, dy}. */
  function tokenize(text, base) {
    const tokens = [];
    let cur = [];
    const flush = () => { if (cur.length) { tokens.push({ pieces: cur }); cur = []; } };
    const space = () => { flush(); tokens.push({ space: true }); };
    const addText = (s, style) => {
      s.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { if (part.includes("\n")) { flush(); tokens.push({ br: true }); } else space(); return; }
        cur.push({ text: part, family: base.family, style, scale: 1, dy: 0 });
      });
    };
    TEX.segments(String(text)).forEach((sg) => {
      if (sg.type === "text") {
        // **bold** and *italic* spans
        const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
        let last = 0, m;
        while ((m = re.exec(sg.s))) {
          if (m.index > last) addText(sg.s.slice(last, m.index), base.style);
          addText(m[1] != null ? m[1] : m[2], m[1] != null ? (base.style === "italic" ? "bolditalic" : "bold") : (base.style === "bold" ? "bolditalic" : "italic"));
          last = re.lastIndex;
        }
        if (last < sg.s.length) addText(sg.s.slice(last), base.style);
      } else {
        const display = sg.type === "display";
        TEX.runs(sg.tex).forEach((r) => {
          const depth = r.path.length;
          const scale = depth ? Math.pow(0.7, Math.min(depth, 2)) : 1;
          let dy = 0;
          r.path.forEach((p, k) => { dy += (p === "sup" ? -0.36 : 0.2) * Math.pow(0.7, k); });
          const style = r.it ? (base.style === "bold" ? "bolditalic" : "italic") : base.style === "italic" ? "normal" : base.style;
          const family = r.it ? "SFSerif" : base.family;
          // spaces inside formulas are break points only around relations at the outer level
          r.text.split(/( )/).forEach((part) => {
            if (part === " ") { if (depth === 0) space(); return; }
            if (part) cur.push({ text: part, family, style: family === "SFSans" && style === "bolditalic" ? "bold" : style, scale, dy });
          });
        });
        if (display) flush();
      }
    });
    flush();
    return tokens;
  }

  function measure(doc, size, piece) {
    doc.setFont(piece.family, piece.style).setFontSize(size * piece.scale);
    return doc.getTextWidth(piece.text);
  }

  /** Lay out tokens in lines of at most `width` mm. */
  function layout(doc, tokens, size, width, base) {
    doc.setFont(base.family, base.style).setFontSize(size);
    const spaceW = doc.getTextWidth(" ");
    const lines = [];
    let line = [], w = 0, pendingSpace = false;
    tokens.forEach((tk) => {
      if (tk.br) { lines.push(line); line = []; w = 0; pendingSpace = false; return; }
      if (tk.space) { pendingSpace = line.length > 0; return; }
      const tw = tk.pieces.reduce((s, p) => s + measure(doc, size, p), 0);
      const add = (pendingSpace ? spaceW : 0) + tw;
      if (line.length && w + add > width) { lines.push(line); line = []; w = 0; pendingSpace = false; }
      line.push({ space: pendingSpace && line.length > 0 ? spaceW : 0, pieces: tk.pieces, w: tw });
      w += (pendingSpace && line.length > 1 ? spaceW : 0) + tw;
      pendingSpace = false;
    });
    if (line.length) lines.push(line);
    return lines;
  }

  function drawLines(doc, lines, size, x, y, lineH, color, align = "left", width = 0) {
    lines.forEach((line, k) => {
      const total = line.reduce((s, tk) => s + tk.space + tk.w, 0);
      let cx = align === "center" ? x + (width - total) / 2 : align === "right" ? x + width - total : x;
      line.forEach((tk) => {
        cx += tk.space;
        tk.pieces.forEach((p) => {
          doc.setFont(p.family, p.style).setFontSize(size * p.scale).setTextColor(...color);
          doc.text(p.text, cx, y + k * lineH + p.dy * size * PT);
          cx += doc.getTextWidth(p.text);
        });
      });
    });
  }

  /** Measure and draw rich text; returns the height used. */
  function rich(doc, text, opts) {
    const base = { family: opts.family || "SFSerif", style: opts.style || "normal" };
    const size = opts.size || 10.5, lineH = opts.lineH || size * PT * 1.32;
    const lines = layout(doc, tokenize(text, base), size, opts.width, base);
    if (!opts.measureOnly) drawLines(doc, lines, size, opts.x, opts.y, lineH, opts.color || CC.ink, opts.align, opts.width);
    return { lines: lines.length, height: lines.length * lineH };
  }

  // --------------------------------------------------------------------- the writer
  /**
   * env: {lang, format, banner: {data, ratio}, kicker, t(es, en)}. The API follows the Delta City
   * writer (title, meta, heading, sub, paragraph, bullets, callout, formula, image, table, lines,
   * page) with rich text everywhere, plus a few drawing helpers for graph templates.
   */
  function writer(doc, env) {
    const t = env.t;
    const pw = () => doc.internal.pageSize.getWidth();
    const ph = () => doc.internal.pageSize.getHeight();
    const margin = 18, bottom = 18;
    let y = 18;
    const W = () => pw() - 2 * margin;
    const ensure = (h) => { if (y + h > ph() - bottom) { doc.addPage(env.format, "portrait"); y = 18; return true; } return false; };
    // house sizes (ESTANDAR_WEB_ACTIVIDADES.md, 4.1): body 11 pt, 5.2 mm leading; nothing to be
    // read goes below 9.5 pt (notes), tables 9.5 pt (8.5 pt only for dense reference tables)
    const BODY = 11, lead = (size) => size * PT * 1.34, atLeast = (v, min) => Math.max(v || 0, min);
    const stamp = (label, x, yy) => {
      doc.setFont("SFSans", "bold").setFontSize(8);
      const w = doc.getTextWidth(label) + 4;
      doc.setDrawColor(...CC.stamp).setLineWidth(0.35).rect(x - w, yy - 3.4, w, 4.8);
      doc.setTextColor(...CC.stamp).text(label, x - w / 2, yy, { align: "center" });
    };
    const R = (text, o) => rich(doc, text, o);
    const api = {
      doc, t, CC, get y() { return y; }, set y(v) { y = v; }, margin, W, pw, ph, ensure, rich: R, BODY, lead,
      /** Space left on the current page, above the footer band. */
      room() { return ph() - bottom - y; },
      /** Height a paragraph would take (same options as paragraph()). */
      measure(text, opts = {}) {
        const size = opts.size ? atLeast(opts.size, 9.5) : BODY, x = opts.x || margin, width = opts.width || W() - (x - margin);
        return R(text, { x, y: 0, width, size, family: opts.sans ? "SFSans" : "SFSerif", style: opts.bold ? "bold" : opts.italic ? "italic" : "normal", lineH: lead(size), measureOnly: true }).height + (opts.gap == null ? 3 : opts.gap);
      },
      /** Title block of a document: banner, kicker, stamp, blue rule, title. */
      title(title, kicker, stampLabel, opts = {}) {
        let top = 14;
        if (env.banner && env.banner.data && !opts.noBanner) {
          const h = pw() * env.banner.ratio;
          doc.addImage(env.banner.data, "JPEG", 0, 0, pw(), h, "banner", "FAST");
          top = h + 8;
        }
        doc.setFont("SFSans", "normal").setFontSize(8).setTextColor(...CC.muted).text(String(kicker || env.kicker).toUpperCase(), margin, top);
        if (stampLabel) stamp(stampLabel, pw() - margin, top);
        doc.setDrawColor(...CC.blue).setLineWidth(0.35).line(margin, top + 2.2, pw() - margin, top + 2.2);
        const h = R(title, { x: margin, y: top + 11, width: W(), size: 20, family: "SFSans", style: "bold", lineH: 8 }).height;
        y = top + 11 + h - 8 + 8.5;
        doc.setLineWidth(0.2);
      },
      meta(rows, opts = {}) {
        rows.forEach(([label, value]) => {
          doc.setFont("SFSans", "bold").setFontSize(9.5).setTextColor(...CC.muted).text(String(label), margin, y);
          const h = R(value, { x: margin + 40, y, width: (opts.width || W()) - 42, size: 9.5, family: "SFSans", lineH: 4.4 }).height;
          y += Math.max(5.4, h + 1);
        });
        y += 3;
      },
      heading(text, opts = {}) {
        const size = opts.compact ? 12.5 : 14;
        if (y > 24) y += opts.compact ? 1.5 : 3.5;
        ensure(opts.keep == null ? 20 : 8 + opts.keep);   // never alone at the foot of a page
        const h = R(text, { x: margin, y, width: W(), size, family: "SFSans", style: "bold", color: CC.blue, lineH: size * 0.45 }).height;
        y += h + (opts.compact ? 1.2 : 2.4);
      },
      sub(text, keep = 12) { if (y > 24) y += 1.5; ensure(6 + keep); const h = R(text, { x: margin, y, width: W(), size: 11.5, family: "SFSans", style: "bold", lineH: 5.2 }).height; y += h + 1.8; },
      paragraph(text, opts = {}) {
        const size = opts.size ? atLeast(opts.size, 9.5) : BODY, x = opts.x || margin, width = opts.width || W() - (x - margin);
        const base = { size, family: opts.sans ? "SFSans" : "SFSerif", style: opts.bold ? "bold" : opts.italic ? "italic" : "normal", lineH: lead(size) };
        const h = R(text, Object.assign({ x, y, width, measureOnly: true }, base)).height;
        if (y + h > ph() - bottom) {   // long paragraph: break across pages, at least two lines on each side
          let lines = layout(doc, tokenize(text, base), size, width, base);
          for (;;) {
            const fit = Math.floor((ph() - bottom - y + base.lineH - 3.5) / base.lineH);
            if (fit >= lines.length) break;
            if (fit >= 2 && lines.length - fit >= 2) { drawLines(doc, lines.slice(0, fit), size, x, y, base.lineH, opts.color || CC.ink); lines = lines.slice(fit); }
            doc.addPage(env.format, "portrait"); y = 18;
          }
          drawLines(doc, lines, size, x, y, base.lineH, opts.color || CC.ink); y += lines.length * base.lineH;
        } else { R(text, Object.assign({ x, y, width, color: opts.color }, base)); y += h; }
        y += opts.gap == null ? 3 : opts.gap;
      },
      bullets(items, numbered, opts = {}) {
        items.forEach((item, k) => {
          const size = opts.size ? atLeast(opts.size, 9.5) : BODY;
          const h = R(item, { x: margin + 6.5, y, width: W() - 7, size, lineH: lead(size), measureOnly: true }).height;
          ensure(h + 2.5);
          if (numbered) doc.setFont("SFSans", "bold").setFontSize(10.5).setTextColor(...CC.orange).text(`${opts.start ? opts.start + k : k + 1}.`, margin, y);
          else doc.setFillColor(...CC.orange).rect(margin + 0.6, y - 2.4, 1.9, 1.9, "F");
          R(item, { x: margin + 6.5, y, width: W() - 7, size, lineH: lead(size) });
          y += h + (opts.gap == null ? 2.4 : opts.gap);
        });
        y += 2;
      },
      callout(text, tone, opts = {}) {
        const size = opts.size ? atLeast(opts.size, 9.5) : 10.5, lh = lead(size);
        const h = R(text, { x: margin + 5, y, width: W() - 10, size, lineH: lh, measureOnly: true, family: opts.sans ? "SFSans" : "SFSerif", style: opts.italic ? "italic" : "normal" }).height;
        const box = h - lh + 9.5;   // 3 mm of tint above and below the text
        ensure(box + 3);
        const key = tone === "warn" ? "warn" : tone === "blue" ? "blue" : "note";
        const bar = key === "warn" ? CC.stamp : key === "blue" ? CC.blue : CC.orange;
        doc.setFillColor(...CC.tint[key]).rect(margin, y - 4, W(), box, "F");
        doc.setFillColor(...bar).rect(margin, y - 4, 1.2, box, "F");
        R(text, { x: margin + 5, y: y + 1.6, width: W() - 10, size, lineH: lh, family: opts.sans ? "SFSans" : "SFSerif", style: opts.italic ? "italic" : "normal" });
        y += box + 3;
      },
      /** Display formula as an image (SFTex.image). */
      formula(tex, opts = {}) {
        const img = TEX.image(tex, { size: opts.size || 40, scale: 2.6 });
        const k = opts.scale || 0.24;
        let w = img.width * k, h = img.height * k;
        const maxW = opts.maxW || 160;
        if (w > maxW) { h *= maxW / w; w = maxW; }
        ensure(h + 4);
        doc.addImage(img.canvas.toDataURL("image/png"), "PNG", opts.x != null ? opts.x : margin + (W() - w) / 2, y - 3, w, h, undefined, "FAST");
        y += h + 1.5;
      },
      image(data, w, h, opts = {}) {
        ensure(h + 3);
        const x = opts.x == null ? margin + (W() - w) / 2 : opts.x;
        doc.addImage(data, opts.png ? "PNG" : "JPEG", x, y, w, h, opts.alias, "FAST");
        if (opts.frame) { doc.setDrawColor(...CC.grid).setLineWidth(0.2).rect(x, y, w, h); }
        y += h + (opts.gap == null ? 4 : opts.gap);
      },
      caption(text) { const h = R(text, { x: margin, y: y + 1.6, width: W(), size: 9.5, family: "SFSans", color: CC.muted, lineH: 4.3 }).height; y += h + 4; },
      /** House table: blue header, thin grey grid, sans body; cells take rich text. */
      table(headers, rows, widths, opts = {}) {
        const fs = atLeast(opts.size || 9.5, opts.dense ? 8.5 : 9.5), pad = 1.6, lineH = fs * PT * 1.25, vpad = opts.tight ? 2.4 : 3.2;
        const total = widths.reduce((s, w) => s + w, 0), scale = (opts.width || W()) / total, ws = widths.map((w) => w * scale);
        const x0 = opts.x || margin;
        if (headers) {   // a header word is never split: widen its column at the expense of the widest one
          doc.setFont("SFSans", "bold").setFontSize(fs);
          headers.forEach((hd, i) => {
            const need = Math.max(...TEX.plain(String(hd)).split(/\s+/).map((wd) => doc.getTextWidth(wd))) + 2 * pad + 0.4;
            if (ws[i] < need) { const j = ws.indexOf(Math.max(...ws)); if (j !== i) { ws[j] -= need - ws[i]; ws[i] = need; } }
          });
        }
        const cellH = (row, header) => Math.max(header ? 0 : opts.minRow || 6.5, ...row.map((cell, i) => {
          const hand = !header && opts.hand && opts.hand(row, i);
          return R(String(cell == null ? "" : cell), { x: 0, y: 0, width: ws[i] - 2 * pad, size: hand ? fs + 1 : fs, family: hand ? "SFSerif" : "SFSans", style: header ? "bold" : hand ? "italic" : opts.boldFirst && i === 0 ? "bold" : "normal", lineH, measureOnly: true }).height + vpad;
        }));
        const drawRow = (row, header, shade) => {
          const h = cellH(row, header);
          if (y + h > ph() - bottom) { doc.addPage(env.format, "portrait"); y = 18; if (!header && headers && opts.repeatHeader !== false) drawRow(headers, true); }
          let x = x0;
          row.forEach((cell, i) => {
            if (header) doc.setFillColor(...CC.blue).setDrawColor(...CC.blue);
            else doc.setFillColor(...(opts.fill && opts.fill(row, i) ? opts.fill(row, i) : shade ? CC.zebra : [255, 255, 255])).setDrawColor(...CC.grid);
            doc.setLineWidth(0.15).rect(x, y, ws[i], h, "FD");
            const hand = !header && opts.hand && opts.hand(row, i);
            R(String(cell == null ? "" : cell), { x: x + pad, y: y + vpad / 2 + lineH * 0.78, width: ws[i] - 2 * pad, size: hand ? fs + 1 : fs, family: hand ? "SFSerif" : "SFSans", style: header ? "bold" : hand ? "italic" : opts.boldFirst && i === 0 ? "bold" : "normal", lineH, color: header ? [255, 255, 255] : hand ? CC.hand : CC.ink });
            x += ws[i];
          });
          y += h;
        };
        if (opts.fillRows) {   // [min, max]: the rows share the rest of the page
          const hh = headers ? cellH(headers, true) : 0, fit = () => (ph() - bottom - y - hh - 4 - (opts.reserve || 0)) / rows.length;
          if (fit() < opts.fillRows[0]) { doc.addPage(env.format, "portrait"); y = 18; }
          opts = Object.assign({}, opts, { minRow: Math.min(opts.fillRows[1], fit()), keep: false });
        }
        if (opts.keep) {
          const all = [headers, ...rows].filter(Boolean).reduce((sum, row, k) => sum + cellH(row, headers && k === 0), 0);
          ensure(Math.min(all + 4, ph() - bottom - 18));
        } else ensure(Math.min(30, (headers ? cellH(headers, true) : 0) + (rows[0] ? cellH(rows[0]) : 0) + 2));
        if (headers) drawRow(headers, true);
        rows.forEach((row, k) => drawRow(row, false, opts.zebra && k % 2 === 1));
        y += 4;
      },
      /** Writing lines; count "fill" draws them down to the foot of the page. */
      lines(count, gap = 7.5) {
        if (count === "fill") count = Math.max(2, Math.floor((ph() - bottom - y - 2) / gap));
        ensure(Math.min(count * gap + 2, 120)); doc.setDrawColor(...CC.grid).setLineWidth(0.2); for (let k = 0; k < count; k += 1) { if (y + gap > ph() - bottom) { doc.addPage(env.format, "portrait"); y = 18; } y += gap; doc.line(margin, y, pw() - margin, y); } y += 4; },
      page() { doc.addPage(env.format, "portrait"); y = 18; },
      /** Answer boxes: a labelled row of boxes to fill in by hand. */
      answers(items, opts = {}) {
        const cols = opts.cols || 3, gap = 4, w = (W() - gap * (cols - 1)) / cols, h = opts.h || 11;
        items.forEach((label, k) => {
          const col = k % cols;
          if (col === 0) ensure(h + 3);
          const x = margin + col * (w + gap);
          doc.setDrawColor(...CC.grid).setLineWidth(0.25).rect(x, y, w, h);
          R(label, { x: x + 1.5, y: y + 3.8, width: w - 3, size: 9, family: "SFSans", color: CC.muted, lineH: 3.8 });
          if (col === cols - 1 || k === items.length - 1) y += h + 3;
        });
        y += 1;
      },
      /** Blank graph grid in mm, with axes and labels (vector, for drawing partial sums). */
      grid(spec) {
        const { w, h, xmin, xmax, ymin, ymax, xstep, ystep } = spec;
        const xl = spec.xLabel || "n", yl = spec.yLabel || "";
        ensure(h + 14);
        const gx = (spec.x != null ? spec.x : margin + 8), gy = y + 5;
        const X = (v) => gx + ((v - xmin) / (xmax - xmin)) * w, Y = (v) => gy + h - ((v - ymin) / (ymax - ymin)) * h;
        doc.setDrawColor(...CC.grid).setLineWidth(0.12);
        for (let v = xmin; v <= xmax + 1e-9; v += xstep / (spec.xMinor || 2)) doc.line(X(v), gy, X(v), gy + h);
        for (let v = ymin; v <= ymax + 1e-9; v += ystep / (spec.yMinor || 2)) doc.line(gx, Y(v), gx + w, Y(v));
        doc.setDrawColor(...CC.ink).setLineWidth(0.3).rect(gx, gy, w, h);
        doc.setFont("SFSans", "normal").setFontSize(8.5).setTextColor(...CC.ink);
        for (let v = xmin; v <= xmax + 1e-9; v += xstep) doc.text(fmtTick(v), X(v), gy + h + 4, { align: "center" });
        for (let v = ymin; v <= ymax + 1e-9; v += ystep) doc.text(fmtTick(v), gx - 1.5, Y(v) + 1.2, { align: "right" });
        R(`$${xl}$`, { x: gx + w + 1.5, y: gy + h + 1.2, width: 10, size: 9.5 });
        if (yl) R(yl, { x: gx, y: gy - 2.2, width: w, size: 9.5, family: "SFSans", style: "bold", color: CC.blue });
        (spec.marks || []).forEach((m) => { doc.setFillColor(...CC.hand); doc.circle(X(m[0]), Y(m[1]), 0.7, "F"); });
        (spec.hlines || []).forEach((v) => { doc.setDrawColor(...CC.stamp).setLineWidth(0.3); doc.setLineDashPattern([1.2, 1], 0); doc.line(gx, Y(v), gx + w, Y(v)); doc.setLineDashPattern([], 0); });
        y = gy + h + 9;
        return { X, Y, gx, gy };
      },
      /** Two cells side by side (e.g. two storyboard frames). */
      columns(n, gap = 6) { const w = (W() - gap * (n - 1)) / n; return Array.from({ length: n }, (_, k) => ({ x: margin + k * (w + gap), w })); },
    };
    return api;
  }
  const fmtTick = (v) => String(Math.round(v * 1000) / 1000);

  function footer(doc, label, env) {
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p += 1) {
      doc.setPage(p);
      const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
      if (w > h) continue;   // projected slides carry their own footer
      doc.setDrawColor(...CC.rule).setLineWidth(0.2).line(18, h - 12, w - 18, h - 12);
      doc.setFont("SFSans", "normal").setFontSize(8).setTextColor(...CC.muted)
        .text(`${TEX.plain(label)} · ${env.t("Calculus Cases · Material educativo ficticio", "Calculus Cases · Fictional educational material")}`, 18, h - 7);
      doc.text(`${p}/${n}`, w - 18, h - 7, { align: "right" });
    }
  }

  root.CCPdf = { CC, PAPER, PT, newDoc, writer, footer, rich, tokenize };
})(typeof window !== "undefined" ? window : globalThis);
