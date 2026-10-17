/*
 * Calculus Cases · Case 7 · The Series Finale — mathematics typesetting.
 *
 * The data write mathematics in a small TeX subset: $…$ inline, $$…$$ display. This file turns it
 * into (1) runs of text with italic variables, superscripts and subscripts, for the PDF writer,
 * which prints them with real Unicode fonts; (2) HTML for the student room; (3) canvas images for
 * display formulas, a descendant of DeltaCity.formulaImage with sums, roots and absolute values.
 */
(function (root) {
  "use strict";

  const SYM = {
    "\\infty": "∞", "\\to": "→", "\\le": "≤", "\\leq": "≤", "\\ge": "≥", "\\geq": "≥", "\\ne": "≠", "\\neq": "≠",
    "\\approx": "≈", "\\cdot": "·", "\\times": "×", "\\pm": "±", "\\in": "∈", "\\ldots": "…", "\\dots": "…", "\\cdots": "⋯",
    "\\sum": "Σ", "\\prod": "Π", "\\int": "∫", "\\pi": "π", "\\Delta": "Δ", "\\alpha": "α", "\\beta": "β", "\\gamma": "γ",
    "\\delta": "δ", "\\varepsilon": "ε", "\\epsilon": "ε", "\\lambda": "λ", "\\mu": "μ", "\\eta": "η", "\\zeta": "ζ", "\\rho": "ρ",
    "\\sigma": "σ", "\\Rightarrow": "⇒", "\\iff": "⇔", "\\lvert": "|", "\\rvert": "|", "\\vert": "|", "\\{": "{", "\\}": "}",
    "\\%": "%", "\\lceil": "⌈", "\\rceil": "⌉", "\\lfloor": "⌊", "\\rfloor": "⌋", "\\mid": "|", "\\ell": "ℓ",
  };
  const SPACES = { "\\,": " ", "\\;": " ", "\\:": " ", "\\ ": " ", "\\quad": " ", "\\qquad": "  ", "\\!": "" };
  const FUN = ["\\lim", "\\ln", "\\log", "\\sin", "\\cos", "\\exp", "\\max", "\\min"];
  const REL = new Set(["=", "<", ">", "≤", "≥", "≠", "≈", "→", "∈", "⇒", "⇔"]);
  const BIN = new Set(["+", "−", "±", "·", "×"]);

  // ------------------------------------------------------------------------------ parser
  /** Parse to a small tree: {t:"row", items}, {t:"txt", s, it}, {t:"frac"}, {t:"sup"|"sub"}, {t:"sqrt"}. */
  function parse(tex) {
    let i = 0;
    const readCmd = () => {
      let j = i + 1;
      if (j >= tex.length || /[^a-zA-Z]/.test(tex[j])) return tex.slice(i, j + 1);
      while (j < tex.length && /[a-zA-Z]/.test(tex[j])) j += 1;
      return tex.slice(i, j);
    };
    const group = () => {
      while (tex[i] === " ") i++;
      if (tex[i] === "{") { i += 1; const b = list("}"); i += 1; return b; }
      return { t: "row", items: [atom()].filter(Boolean) };
    };
    function atom() {
      const ch = tex[i];
      if (ch === "\\") {
        const cmd = readCmd(); i += cmd.length;
        if (cmd === "\\frac" || cmd === "\\dfrac" || cmd === "\\tfrac") { const n = group(); const d = group(); return { t: "frac", n, d }; }
        if (cmd === "\\sqrt") { const a = group(); return { t: "sqrt", a }; }
        if (cmd === "\\text" || cmd === "\\mathrm" || cmd === "\\textrm" || cmd === "\\operatorname") {
          const start = tex.indexOf("{", i), end = tex.indexOf("}", start);
          const s = tex.slice(start + 1, end); i = end + 1; return { t: "txt", s, it: false, word: true };
        }
        if (cmd === "\\left" || cmd === "\\right" || cmd === "\\big" || cmd === "\\Big") {
          let s = tex[i]; i += 1;
          if (s === "\\") { const c2 = readCmd(); i += c2.length - 1; s = SYM[c2] || ""; }
          return s === "." ? null : { t: "txt", s, it: false, delim: true };
        }
        if (cmd === "\\displaystyle" || cmd === "\\limits") return null;
        if (cmd in SPACES) return { t: "txt", s: SPACES[cmd], it: false, space: true };
        if (FUN.includes(cmd)) return { t: "txt", s: cmd.slice(1), it: false, fn: true, op: cmd === "\\lim" };
        const s = SYM[cmd];
        if (s) return { t: "txt", s, it: false, rel: REL.has(s), bin: BIN.has(s), big: s === "Σ" || s === "Π" || s === "∫", op: s === "Σ" || s === "Π" };
        return { t: "txt", s: cmd.slice(1), it: false };
      }
      i += 1;
      if (ch === " ") return null;
      if (/[a-zA-Z]/.test(ch)) return { t: "txt", s: ch, it: true };
      if (ch === "-") return { t: "txt", s: "−", it: false, bin: true };
      if ("+".includes(ch)) return { t: "txt", s: ch, it: false, bin: true };
      if ("=<>".includes(ch)) return { t: "txt", s: ch, it: false, rel: true };
      if (ch === "'") return { t: "txt", s: "′", it: false };
      return { t: "txt", s: ch, it: false };
    }
    function list(stop) {
      const items = [];
      while (i < tex.length && tex[i] !== stop) {
        let a = atom();
        if (!a) continue;
        for (;;) {
          while (tex[i] === " ") i++;
          if (tex[i] !== "^" && tex[i] !== "_") break;
          const kind = tex[i]; i += 1; const g = group();
          if (a.t === "subsup" || (a.t === (kind === "^" ? "sub" : "sup"))) a = { t: "subsup", base: a.base, sub: kind === "_" ? g : a.sub || a.s, sup: kind === "^" ? g : a.sup || a.s };
          else a = { t: kind === "^" ? "sup" : "sub", base: a, s: g };
        }
        items.push(a);
      }
      return { t: "row", items };
    }
    return list(null);
  }

  // -------------------------------------------------------------------- inline: text runs
  /**
   * Runs for the PDF writer and the HTML: [{text, it, path}], where path lists the script levels
   * ("sup", "sub") from the baseline outwards; `sup`/`sub` flag the outermost level.
   */
  function runs(tex) {
    const out = [];
    const key = (p) => p.join(".");
    const push = (text, it, path) => {
      if (!text) return;
      const last = out[out.length - 1];
      if (last && last.it === it && key(last.path) === key(path)) last.text += text; else out.push({ text, it, path: path.slice() });
    };
    const needsParens = (node) => node.t === "row" && node.items.filter((x) => !(x.t === "txt" && x.space)).length > 1 && node.items.some((x) => x.t === "txt" && (x.bin || x.rel));
    function walk(node, path) {
      if (!node) return;
      if (node.t === "row") {
        node.items.forEach((k, idx) => {
          walk(k, path);
          const next = node.items[idx + 1];
          if (k.t === "txt" && k.fn && next && !(next.t === "txt" && (next.s === "(" || next.delim))) push("\u2009", false, path);
        });
        return;
      }
      if (node.t === "txt") {
        const spaced = (node.rel || node.bin) && path.length === 0;
        push(spaced ? ` ${node.s} ` : node.s, node.it, path);
        return;
      }
      if (node.t === "frac") {
        const pn = needsParens(node.n);
        const pd = needsParens(node.d) || (node.d.t === "row" && node.d.items.length > 1);
        if (pn) push("(", false, path); walk(node.n, path); if (pn) push(")", false, path);
        push("/", false, path);
        if (pd) push("(", false, path); walk(node.d, path); if (pd) push(")", false, path);
        return;
      }
      if (node.t === "sqrt") {
        push("√", false, path);
        const p = node.a.t === "row" && node.a.items.length > 1;
        if (p) push("(", false, path); walk(node.a, path); if (p) push(")", false, path);
        return;
      }
      if (node.t === "sup") { walk(node.base, path); walk(node.s, path.concat("sup")); return; }
      if (node.t === "sub") { walk(node.base, path); walk(node.s, path.concat("sub")); return; }
      if (node.t === "subsup") { walk(node.base, path); walk(node.sub, path.concat("sub")); walk(node.sup, path.concat("sup")); }
    }
    walk(parse(tex), []);
    return out.map((r) => ({ text: r.text.replace(/ {2,}/g, " "), it: r.it, path: r.path, sup: r.path[0] === "sup", sub: r.path[0] === "sub" }));
  }

  const SUPMAP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "−": "⁻", "-": "⁻", "(": "⁽", ")": "⁾", "n": "ⁿ", "i": "ⁱ" };
  const SUBMAP = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "−": "₋", "-": "₋", "(": "₍", ")": "₎" };
  function scriptText(text, map, mark) {
    const chars = [...text.replace(/\s+/g, "")];
    return chars.every((c) => map[c]) ? chars.map((c) => map[c]).join("") : `${mark}${chars.length > 1 ? `(${chars.join("")})` : chars.join("")}`;
  }

  /** Split a data string into segments: plain text, inline maths ($…$), display maths ($$…$$). */
  function segments(str) {
    const out = [];
    const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) out.push({ type: "text", s: str.slice(last, m.index) });
      out.push(m[1] != null ? { type: "display", tex: m[1] } : { type: "math", tex: m[2] });
      last = re.lastIndex;
    }
    if (last < str.length) out.push({ type: "text", s: str.slice(last) });
    return out;
  }

  /** Plain Unicode text (no italics): for file names, titles, aria labels. */
  function plain(str) {
    return segments(String(str)).map((sg) => (sg.type === "text" ? sg.s : runs(sg.tex).map((r) =>
      r.path.length === 0 ? r.text : r.path[r.path.length - 1] === "sup" ? scriptText(r.text, SUPMAP, "^") : scriptText(r.text, SUBMAP, "_")).join(""))).join("");
  }

  const escHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  /** HTML with <var>, <sub>, <sup>; display formulas become placeholders filled with images. */
  function html(str) {
    return segments(String(str)).map((sg) => {
      if (sg.type === "text") return escHTML(sg.s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
      if (sg.type === "display") return `<span class="sf-display" data-tex="${escHTML(sg.tex)}"></span>`;
      return `<span class="sf-math">${runs(sg.tex).map((r) => {
        const t = escHTML(r.text);
        let inner = r.it ? `<var>${t}</var>` : t;
        for (let k = r.path.length - 1; k >= 0; k--) inner = `<${r.path[k]}>${inner}</${r.path[k]}>`;
        return inner;
      }).join("")}</span>`;
    }).join("");
  }

  // ---------------------------------------------------------------- display: canvas image
  const SERIF = '"STIX Two Math", "STIX Two Text", "Cambria Math", "Times New Roman", Times, serif';
  function image(tex, opts = {}) {
    const size = opts.size || 44, scale = opts.scale || 2.4;
    const mk = () => (typeof document !== "undefined" ? document.createElement("canvas") : opts.canvasFactory());
    const meas = mk().getContext("2d");
    const font = (sz, it) => `${it ? "italic " : ""}${sz}px ${SERIF}`;
    // every box has w (width), a (ascent) and d (descent)
    function layout(node, sz) {
      if (node.t === "txt") {
        const fsz = node.big ? sz * 1.55 : node.delim ? sz * 1.25 : sz;
        meas.font = font(fsz, node.it);
        const pad = node.rel ? sz * 0.28 : node.bin ? sz * 0.22 : node.fn ? sz * 0.06 : 0;
        return { t: "txt", node, sz, fsz, pad,
          w: meas.measureText(node.s).width + 2 * pad + (node.fn ? sz * 0.12 : 0) + (node.it ? sz * 0.03 : 0),
          a: node.big ? sz * 1.0 : node.delim ? sz * 0.88 : sz * 0.72,
          d: node.big ? sz * 0.32 : node.delim ? sz * 0.32 : sz * 0.24 };
      }
      if (node.t === "row") {
        const kids = node.items.map((k) => layout(k, sz));
        return { t: "row", kids, sz, w: kids.reduce((s, k) => s + k.w, 0), a: Math.max(sz * 0.72, ...kids.map((k) => k.a)), d: Math.max(sz * 0.24, ...kids.map((k) => k.d)) };
      }
      if (node.t === "frac") {
        const num = layout(node.n, sz * 0.82), den = layout(node.d, sz * 0.82);
        const w = Math.max(num.w, den.w) + sz * 0.3;
        return { t: "frac", num, den, sz, w, a: sz * 0.3 + sz * 0.12 + num.d + num.a, d: den.a + den.d + sz * 0.14 - sz * 0.3 };
      }
      if (node.t === "sqrt") {
        const rad = layout(node.a, sz);
        return { t: "sqrt", rad, sz, w: rad.w + sz * 0.62, a: rad.a + sz * 0.16, d: rad.d };
      }
      if (node.t === "sup" || node.t === "sub" || node.t === "subsup") {
        const base = layout(node.base, sz);
        const supN = node.t === "sup" ? node.s : node.t === "subsup" ? node.sup : null;
        const subN = node.t === "sub" ? node.s : node.t === "subsup" ? node.sub : null;
        const sup = supN ? layout(supN, sz * 0.62) : null, sub = subN ? layout(subN, sz * 0.62) : null;
        if (node.base.op) {   // limits above and below Σ, Π and lim
          return { t: "limits", base, sup, sub, sz, w: Math.max(base.w, sup ? sup.w : 0, sub ? sub.w : 0) + sz * 0.1,
            a: base.a + (sup ? sup.a + sup.d + sz * 0.08 : 0), d: base.d + (sub ? sub.a + sub.d + sz * 0.06 : 0) };
        }
        return { t: "script", base, sup, sub, sz, w: base.w + Math.max(sup ? sup.w : 0, sub ? sub.w : 0) + sz * 0.08,
          a: sup ? Math.max(base.a, sz * 0.42 + sup.a) : base.a, d: sub ? Math.max(base.d, sz * 0.24 + sub.d) : base.d };
      }
      return { t: "row", kids: [], sz, w: 0, a: 0, d: 0 };
    }
    function draw(ctx, b, x, y) {
      if (b.t === "txt") {
        ctx.font = font(b.fsz, b.node.it);
        const dy = b.node.big ? b.sz * 0.18 : b.node.delim ? b.sz * 0.08 : 0;
        ctx.fillText(b.node.s, x + b.pad, y + dy);
      } else if (b.t === "row") {
        let cx = x; b.kids.forEach((k) => { draw(ctx, k, cx, y); cx += k.w; });
      } else if (b.t === "frac") {
        const mid = y - b.sz * 0.3;
        ctx.fillRect(x + b.sz * 0.08, mid - b.sz * 0.025, b.w - b.sz * 0.16, Math.max(1.4, b.sz * 0.05));
        draw(ctx, b.num, x + (b.w - b.num.w) / 2, mid - b.sz * 0.12 - b.num.d);
        draw(ctx, b.den, x + (b.w - b.den.w) / 2, mid + b.sz * 0.14 + b.den.a);
      } else if (b.t === "sqrt") {
        const top = y - b.rad.a - b.sz * 0.08, bot = y + b.rad.d;
        ctx.save(); ctx.lineWidth = Math.max(1.4, b.sz * 0.05); ctx.strokeStyle = ctx.fillStyle; ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x + b.sz * 0.04, y - b.sz * 0.2); ctx.lineTo(x + b.sz * 0.16, y - b.sz * 0.28);
        ctx.lineTo(x + b.sz * 0.3, bot); ctx.lineTo(x + b.sz * 0.5, top); ctx.lineTo(x + b.w, top);
        ctx.stroke(); ctx.restore();
        draw(ctx, b.rad, x + b.sz * 0.56, y);
      } else if (b.t === "script") {
        draw(ctx, b.base, x, y);
        const sx = x + b.base.w + b.sz * 0.05;
        if (b.sup) draw(ctx, b.sup, sx, y - b.sz * 0.42);
        if (b.sub) draw(ctx, b.sub, sx, y + b.sz * 0.24);
      } else if (b.t === "limits") {
        draw(ctx, b.base, x + (b.w - b.base.w) / 2, y);
        if (b.sup) draw(ctx, b.sup, x + (b.w - b.sup.w) / 2, y - b.base.a - b.sz * 0.08 - b.sup.d);
        if (b.sub) draw(ctx, b.sub, x + (b.w - b.sub.w) / 2, y + b.base.d + b.sub.a + b.sz * 0.04);
      }
    }
    const box = layout(parse(tex), size);
    const padX = size * 0.2, padY = size * 0.25;
    const c = mk();
    c.width = Math.ceil((box.w + 2 * padX) * scale);
    c.height = Math.ceil((box.a + box.d + 2 * padY) * scale);
    const ctx = c.getContext("2d");
    ctx.scale(scale, scale);
    if (opts.background) { ctx.fillStyle = opts.background; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.fillStyle = opts.color || "#202a3d";
    ctx.textBaseline = "alphabetic";
    draw(ctx, box, padX, padY + box.a);
    return { canvas: c, width: c.width / scale, height: c.height / scale };
  }

  root.SFTex = { parse, runs, segments, plain, html, image };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFTex;
})(typeof window !== "undefined" ? window : globalThis);
