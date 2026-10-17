/*
 * Calculus Cases · Case 7 · The Series Finale — trailer engine.
 *
 * The trailer of ZENO is composed in four layers (see the technical README):
 *   A. cinematic plates: final-art stills, one per shot, listed in SF.trailer.plates and stored in
 *      media/plates/; otherwise a procedural plate drawn here and marked "previsualisation";
 *   B. mathematical effects, driven by the series of each shot (sf-math.js);
 *   C. artistic parameters (palette, grain, bloom, rhythm, transitions, framing, titles);
 *   D. composition: timeline, title cards, transitions and the score (sf-audio.js).
 * Every mathematical effect is computed first as a display list (plain numbers: positions,
 * readings, instants), which the tests check, and only then painted. The same functions draw
 * the stills of the printed dossiers, so paper and video always agree.
 */
(function (root) {
  "use strict";
  const M = root.SFMath || (typeof require === "function" ? require("./sf-math.js") : null);
  const TEX = root.SFTex || (typeof require === "function" ? require("./sf-tex.js") : null);

  // ---------------------------------------------------------------------- configuration
  const PALETTES = {
    zeno: { name: { es: "ZENO (cian y ámbar)", en: "ZENO (cyan and amber)" }, bg: "#04080c", fog: "#0d2230", light: "#8fe6ff", warm: "#ffb547", alarm: "#ff3b30", text: "#f2f6f8", dim: "#6c8796" },
    noir: { name: { es: "Negro y rojo", en: "Noir and red" }, bg: "#050505", fog: "#1d1d1d", light: "#e8e8e8", warm: "#ffffff", alarm: "#e0102a", text: "#f4f4f4", dim: "#7a7a7a" },
    aurora: { name: { es: "Aurora (verde y magenta)", en: "Aurora (green and magenta)" }, bg: "#05060d", fog: "#151236", light: "#62ffc8", warm: "#ff5fd2", alarm: "#ff3b6b", text: "#f3f1ff", dim: "#7d78a8" },
    sodium: { name: { es: "Sodio (naranja)", en: "Sodium (orange)" }, bg: "#0a0603", fog: "#2b1608", light: "#ffcf8a", warm: "#ff8a1f", alarm: "#ff2a12", text: "#fff3e6", dim: "#9a7a5e" },
  };
  const ART_DEFAULT = { palette: "zeno", grain: 0.45, bloom: 0.7, rhythm: 1, transition: "cut", letterbox: "2.39", camera: "drift", hud: true, titles: "condensed", mood: "drone", cards: true };
  const MATH_DEFAULT = {
    S0: { form: "R", T: 10, c: 6 }, S1: { a: 6, d: 4, n: 10 }, S2: { a: 8, r: 0.6 }, S3: { c: 10, L: 100 },
    S4: { form: "H", A: 1, m: 0 }, S5: { D: 1, pS: 1, pI: 2 }, S6: { form: "P", L: 12, s: 1 },
  };
  function defaultConfig(SF) {
    return { version: 1, team: { name: "", members: "" }, math: JSON.parse(JSON.stringify(MATH_DEFAULT)), art: Object.assign({}, ART_DEFAULT), notes: {} };
  }
  /** Mathematical check of each shot against the scene constraints (sf-math). */
  function checkShot(id, p, cons = {}) {
    switch (id) {
      case "S0": return M.countdown.check(p, cons.S0);
      case "S1": return M.arithmetic.check(p, cons.S1);
      case "S2": return M.geometric.check(p, cons.S2);
      case "S3": return M.harmonic.check(p, cons.S3);
      case "S4": return M.telescoping.check(p, cons.S4);
      case "S5": return M.pseries.check(p, cons.S5);
      case "S6": return M.alternating.check(p, cons.S6);
      default: return { ok: true, items: [] };
    }
  }

  // ---------------------------------------------------------------------- timeline
  function timeline(SF, cfg) {
    const k = Math.min(1.25, Math.max(0.8, (cfg.art && cfg.art.rhythm) || 1));
    let t = 0;
    return SF.trailer.segments.map((s) => {
      let dur = s.end - s.start;
      if (s.id === "S0") dur = (cfg.math.S0.T || 10) + 2;           // the countdown fixes the cold open
      else dur = dur / k;
      const seg = { id: s.id, seg: s, t0: t, t1: t + dur, dur };
      t += dur;
      return seg;
    });
  }
  const totalDuration = (SF, cfg) => { const tl = timeline(SF, cfg); return tl[tl.length - 1].t1; };

  // ---------------------------------------------------------------- display lists (pure)
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

  const LISTS = {
    /** S0: beeps up to the frame resolution; later beeps merge (there are infinitely many). */
    S0(p, t, dur, fps = 30) {
      const beeps = M.countdown.times(p, { until: p.T, minGap: 1 / fps, max: 500 });
      const shown = beeps.filter((b) => b <= t);
      return { T: p.T, beeps, shown, merged: t >= beeps[beeps.length - 1], remaining: Math.max(0, p.T - t), afterLimit: t >= p.T };
    },
    /** S1: rings lit one after another, with the running arithmetic sum. */
    S1(p, t, dur) {
      const n = Math.max(1, Math.min(40, Math.round(p.n)));
      const rings = Array.from({ length: n }, (_, k) => Math.max(0, Math.round(M.arithmetic.term(p.a, p.d, k + 1))));
      const lit = Math.min(n, Math.floor(clamp((t - 2) / Math.max(1, dur - 6)) * n + 1e-9) + (t > 2 ? 1 : 0));
      const sum = rings.slice(0, lit).reduce((s, v) => s + v, 0);
      return { rings, lit, sum, total: M.arithmetic.sum(p.a, p.d, n) };
    },
    /** S2: echo rings at the partial sums x_k; Irene's position runs through them. */
    S2(p, t, dur, length = 20) {
      const conv = M.geometric.converges(p.r) && p.r > 0;
      const n = conv ? Math.min(40, Math.max(6, (M.geometric.firstWithin(p.a, p.r, 0.02) || 30))) : 12;
      const rings = M.geometric.positions(p.a, p.r, n).map((x, k) => ({ k: k + 1, x, glow: Math.pow(Math.abs(p.r), k) }));
      const run = ease(clamp((t - 1) / Math.max(1, dur - 3)));
      const irene = conv ? M.geometric.sum(p.a, p.r) * run : p.a * run * n;
      return { rings, irene, limit: conv ? M.geometric.sum(p.a, p.r) : null, length, lit: rings.filter((r) => r.x <= irene + 1e-9).length };
    },
    /** S3: an accelerating minute clock; fraction F_n = (c/L) H_n; computed arrival. */
    S3(p, t, dur) {
      const m = p.L / p.c, u = clamp((t - 0.5) / Math.max(1, dur - 3));
      const nMax = 360;
      const n = Math.max(1, Math.round(Math.pow(nMax, u)));
      return { m, n, F: Math.min(1, M.harmonic.fraction(p.c, p.L, n)), arrival: M.harmonic.arrival(m), earliest: M.harmonic.earliestProved(m), latest: M.harmonic.latestProved(m), nMax };
    },
    /** S4: log lines and their cancellations; the total b_1 − b_{N+1}. */
    S4(p, t, dur) {
      const N = 9, shown = Math.min(N, Math.floor(clamp((t - 0.8) / Math.max(1, dur - 4)) * N + 1e-9) + (t > 0.8 ? 1 : 0));
      const lines = Array.from({ length: N }, (_, k) => ({ k: k + 1, plus: M.telescoping.b(p, k + 1), minus: M.telescoping.b(p, k + 2), value: M.telescoping.entry(p, k + 1) }));
      return { lines, shown, partial: shown ? M.telescoping.partial(p, shown) : 0, total: M.telescoping.total(p) };
    },
    /** S5: two dosimeters, minute by minute. */
    S5(p, t, dur, thr = 2) {
      const minutes = 12, u = clamp((t - 0.6) / Math.max(1, dur - 3));
      const n = Math.max(1, Math.min(minutes, Math.floor(u * minutes) + 1));
      const frac = clamp(u * minutes - (n - 1));
      const sara = M.pseries.partial(p.D, p.pS, n), irene = M.pseries.partial(p.D, p.pI, n);
      const prevS = n > 1 ? M.pseries.partial(p.D, p.pS, n - 1) : 0, prevI = n > 1 ? M.pseries.partial(p.D, p.pI, n - 1) : 0;
      return { n, thr, sara: prevS + (sara - prevS) * ease(frac), irene: prevI + (irene - prevI) * ease(frac), saraCross: M.pseries.crossing(p.D, p.pS, thr, 1000), ireneCross: M.pseries.crossing(p.D, p.pI, thr, 1000) };
    },
    /** S6: the beacon's positions, its bracket and the length of its path. */
    S6(p, t, dur) {
      const N = 14, u = clamp((t - 0.5) / Math.max(1, dur - 2.5));
      const k = Math.min(N, Math.max(1, Math.floor(u * N) + 1));
      const frac = clamp(u * N - (k - 1));
      const S = M.alternating.positions(p, N + 1);
      const prev = k > 1 ? S[k - 2] : 0;
      return { k, x: prev + (S[k - 1] - prev) * ease(frac), positions: S.slice(0, k), bracket: M.alternating.bracket(p, k), path: M.alternating.path(p, k), known: M.alternating.knownSum(p), exact: M.alternating.exactSum(p) };
    },
  };

  // ---------------------------------------------------------------------- canvas helpers
  const FONT_COND = '"Avenir Next Condensed", "Roboto Condensed", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
  const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const FONT_MONO = '"SF Mono", Menlo, Consolas, "Courier New", monospace';
  const FONT_SERIF = '"Baskerville", "Times New Roman", serif';
  const titleFont = (art) => (art.titles === "serif" ? FONT_SERIF : art.titles === "mono" ? FONT_MONO : FONT_COND);
  function rgba(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
  }
  function spaced(ctx, text, x, y, spacing, align = "center") {
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((s, w) => s + w, 0) + spacing * (chars.length - 1);
    let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    const keep = ctx.textAlign; ctx.textAlign = "left";
    chars.forEach((c, k) => { ctx.fillText(c, cx, y); cx += widths[k] + spacing; });
    ctx.textAlign = keep;
    return total;
  }
  function glow(ctx, color, blur, fn) {
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore();
  }
  // seeded random, so that stills and video frames are reproducible
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  let NOISE = null;
  function noiseTile(make) {
    if (NOISE) return NOISE;
    const c = make(256, 256), g = c.getContext("2d"), img = g.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.floor(r() * 255); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    NOISE = c;
    return c;
  }

  // ---------------------------------------------------------------------- the painter
  function painter(env) {
    const make = env.makeCanvas || ((w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; });
    const L = (o) => (o && typeof o === "object" ? o[env.lang] || o.es : o);
    const fmt = M.fmt;

    /** Frame geometry: the picture area inside the letterbox. */
    function frame(W, H, art) {
      const ratio = art.letterbox === "2.39" ? 2.39 : art.letterbox === "1.85" ? 1.85 : W / H;
      const h = Math.min(H, W / ratio), y0 = (H - h) / 2;
      return { x0: 0, y0, w: W, h, cx: W / 2, cy: H / 2, u: h / 100 };
    }

    // --------------------------------------------------------------- procedural plates (A)
    function fog(ctx, F, P, seed, strength = 1) {
      const r = rng(seed);
      for (let k = 0; k < 5; k++) {
        const gx = F.x0 + r() * F.w, gy = F.y0 + F.h * (0.35 + r() * 0.5), rad = F.h * (0.5 + r() * 0.7);
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
        g.addColorStop(0, rgba(P.fog, 0.32 * strength)); g.addColorStop(1, rgba(P.fog, 0));
        ctx.fillStyle = g; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      }
    }
    function mountain(ctx, F, P, t) {
      const sky = ctx.createLinearGradient(0, F.y0, 0, F.y0 + F.h);
      sky.addColorStop(0, "#02040a"); sky.addColorStop(0.7, P.fog); sky.addColorStop(1, P.bg);
      ctx.fillStyle = sky; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      const r = rng(11);
      ctx.fillStyle = rgba(P.text, 0.8);
      for (let k = 0; k < 160; k++) { const x = F.x0 + r() * F.w, y = F.y0 + r() * F.h * 0.55, s = r() * 1.6 * F.u / 8; ctx.globalAlpha = 0.25 + 0.5 * r(); ctx.fillRect(x, y, s + 0.5, s + 0.5); }
      ctx.globalAlpha = 1;
      const layers = [[0.62, "#071019", 0.11], [0.7, "#050b11", 0.07], [0.8, "#03070b", 0.05]];
      layers.forEach(([base, col, amp], li) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(F.x0, F.y0 + F.h);
        for (let x = 0; x <= 1.001; x += 0.01) {
          const peak = Math.exp(-Math.pow((x - 0.52) / 0.18, 2)) * (li === 0 ? 0.28 : 0.12);
          const y = base - peak - amp * (0.5 + 0.5 * Math.sin(x * 17 + li * 3) * Math.sin(x * 5.3 + li));
          ctx.lineTo(F.x0 + x * F.w, F.y0 + y * F.h);
        }
        ctx.lineTo(F.x0 + F.w, F.y0 + F.h); ctx.fill();
      });
      // the laboratory's lights at the foot of the mountain
      const lr = rng(5);
      for (let k = 0; k < 26; k++) {
        const x = F.cx + (lr() - 0.5) * F.w * 0.18, y = F.y0 + F.h * (0.74 + lr() * 0.05);
        glow(ctx, P.warm, 8 * F.u / 8, () => { ctx.fillStyle = rgba(P.warm, 0.6 + 0.4 * Math.sin(t * 3 + k)); ctx.fillRect(x, y, F.u * 0.35, F.u * 0.35); });
      }
      fog(ctx, F, P, 3, 0.8);
    }
    /** One-point perspective corridor of `length` metres; camera at z = cam. */
    function corridor(ctx, F, P, cam, length, opts = {}) {
      const vx = F.cx + (opts.vxShift || 0) * F.w, vy = F.y0 + F.h * 0.47;
      const halfW = F.w * 0.62, halfH = F.h * 0.62, focal = 2.4;
      const proj = (z) => { const d = Math.max(0.05, z - cam + focal); const s = focal / d; return { s, x0: vx - halfW * s, x1: vx + halfW * s, y0: vy - halfH * s, y1: vy + halfH * s * 0.92 }; };
      ctx.fillStyle = P.bg; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      const far = proj(length);
      // walls as gradients towards the far end
      const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, F.w * 0.7);
      g.addColorStop(0, rgba(P.light, opts.endGlow == null ? 0.18 : opts.endGlow)); g.addColorStop(0.25, rgba(P.fog, 0.55)); g.addColorStop(1, rgba(P.bg, 1));
      ctx.fillStyle = g; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      ctx.strokeStyle = rgba(P.dim, 0.5); ctx.lineWidth = Math.max(1, F.u * 0.12);
      // the four edges
      [[F.x0 - F.w * 0.2, F.y0 - F.h * 0.2, far.x0, far.y0], [F.x0 + F.w * 1.2, F.y0 - F.h * 0.2, far.x1, far.y0], [F.x0 - F.w * 0.2, F.y0 + F.h * 1.15, far.x0, far.y1], [F.x0 + F.w * 1.2, F.y0 + F.h * 1.15, far.x1, far.y1]]
        .forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
      // panel seams every metre
      for (let z = Math.ceil(cam - 1); z <= length; z += 1) {
        if (z < cam - focal + 0.2) continue;
        const q = proj(z), a = clamp(0.45 * q.s);
        ctx.strokeStyle = rgba(P.dim, a); ctx.lineWidth = Math.max(0.5, F.u * 0.08 * q.s * 3);
        ctx.strokeRect(q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0);
        if (opts.emergency && z % 3 === 0) {
          glow(ctx, P.warm, 12 * q.s * F.u / 4, () => { ctx.fillStyle = rgba(P.warm, 0.8 * clamp(q.s * 2)); ctx.fillRect(q.x0 + 2, (q.y0 + q.y1) / 2, Math.max(2, 4 * q.s * F.u), Math.max(2, 2 * q.s * F.u)); });
        }
      }
      // the door of Point Z
      if (opts.door !== false) {
        const d = proj(length);
        ctx.fillStyle = rgba("#000000", 0.85); ctx.fillRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
        ctx.strokeStyle = rgba(P.light, 0.55); ctx.lineWidth = Math.max(1, F.u * 0.1);
        ctx.strokeRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
        const dw = (d.x1 - d.x0) * 0.42, dx = (d.x0 + d.x1) / 2 - dw / 2;
        glow(ctx, P.light, 20, () => { ctx.strokeStyle = rgba(P.light, 0.8); ctx.strokeRect(dx, d.y0 + (d.y1 - d.y0) * 0.12, dw, (d.y1 - d.y0) * 0.86); });
        ctx.fillStyle = rgba(P.light, 0.65); ctx.font = `bold ${Math.max(6, (d.y1 - d.y0) * 0.22)}px ${FONT_COND}`; ctx.textAlign = "center";
        ctx.fillText("Z", (d.x0 + d.x1) / 2, d.y0 + (d.y1 - d.y0) * 0.55);
      }
      return { proj, vx, vy };
    }
    function figure(ctx, x, yFeet, h, color, turned = 0) {
      ctx.save(); ctx.fillStyle = color;
      const w = h * 0.26;
      ctx.beginPath(); ctx.ellipse(x, yFeet - h * 0.89, h * 0.075, h * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, yFeet - h * 0.78); ctx.quadraticCurveTo(x, yFeet - h * 0.83, x + w * 0.5, yFeet - h * 0.78);
      ctx.lineTo(x + w * 0.42, yFeet - h * 0.4); ctx.lineTo(x + w * 0.3, yFeet); ctx.lineTo(x + w * 0.06, yFeet);
      ctx.lineTo(x, yFeet - h * 0.42); ctx.lineTo(x - w * 0.06, yFeet); ctx.lineTo(x - w * 0.3, yFeet); ctx.lineTo(x - w * 0.42, yFeet - h * 0.4);
      ctx.closePath(); ctx.fill();
      if (turned > 0) { ctx.fillStyle = rgba("#ffffff", 0.12 * turned); ctx.beginPath(); ctx.ellipse(x + h * 0.02 * turned, yFeet - h * 0.89, h * 0.05, h * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    function screen(ctx, F, P) {
      ctx.fillStyle = P.bg; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      const g = ctx.createRadialGradient(F.cx, F.cy, 0, F.cx, F.cy, F.w * 0.6);
      g.addColorStop(0, rgba(P.fog, 0.9)); g.addColorStop(1, rgba(P.bg, 1));
      ctx.fillStyle = g; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      ctx.strokeStyle = rgba(P.light, 0.05); ctx.lineWidth = 1;
      for (let y = F.y0; y < F.y0 + F.h; y += Math.max(2, F.u * 0.5)) { ctx.beginPath(); ctx.moveTo(F.x0, y); ctx.lineTo(F.x0 + F.w, y); ctx.stroke(); }
    }
    function hudText(ctx, F, P, text, x, y, size = 2.4, align = "left", color) {
      ctx.font = `${size * 1.35 * F.u}px ${FONT_MONO}`; ctx.textAlign = align; ctx.fillStyle = color || rgba(P.light, 0.85);
      ctx.fillText(text, x, y);
    }
    function hudFormula(ctx, F, P, tex, x, y, size = 2.6, align = "left") {
      const parts = TEX.runs(tex);
      ctx.save(); ctx.textAlign = "left"; ctx.fillStyle = rgba(P.light, 0.9);
      const base = size * 1.35 * F.u;
      const widths = parts.map((r) => { ctx.font = `${r.it ? "italic " : ""}${r.path.length ? base * 0.7 : base}px ${FONT_SERIF}`; return ctx.measureText(r.text).width; });
      let cx = align === "center" ? x - widths.reduce((s, w) => s + w, 0) / 2 : align === "right" ? x - widths.reduce((s, w) => s + w, 0) : x;
      parts.forEach((r, k) => {
        ctx.font = `${r.it ? "italic " : ""}${r.path.length ? base * 0.7 : base}px ${FONT_SERIF}`;
        const dy = r.path[0] === "sup" ? -base * 0.38 : r.path[0] === "sub" ? base * 0.22 : 0;
        ctx.fillText(r.text, cx, y + dy); cx += widths[k];
      });
      ctx.restore();
    }

    // ------------------------------------------------------------------- the scenes (B)
    const SCENES = {
      S0(ctx, F, P, A, t, dur, p) {
        const D = LISTS.S0(p, t, dur, env.fps || 30);
        ctx.fillStyle = "#000"; ctx.fillRect(F.x0, F.y0, F.w, F.h);
        if (!D.afterLimit) {
          const lastBeep = D.shown.length ? D.shown[D.shown.length - 1] : -10;
          const flash = Math.exp(-(t - lastBeep) * 9) * (D.merged ? 0.6 + 0.4 * Math.sin(t * 90) : 1);
          const R = F.u * (3 + 6 * flash);
          glow(ctx, P.alarm, 40 * flash + 8, () => { ctx.fillStyle = rgba(P.alarm, 0.25 + 0.75 * flash); ctx.beginPath(); ctx.arc(F.cx, F.cy - F.u * 8, R, 0, Math.PI * 2); ctx.fill(); });
          // the clock: time left to the limit
          ctx.font = `${F.u * 9}px ${FONT_MONO}`; ctx.textAlign = "center"; ctx.fillStyle = rgba(P.text, 0.9);
          ctx.fillText(D.remaining.toFixed(2).padStart(5, "0"), F.cx, F.cy + F.u * 12);
          // the beeps on a timeline that converges to T
          const x0 = F.x0 + F.w * 0.15, x1 = F.x0 + F.w * 0.85, y = F.y0 + F.h * 0.82;
          ctx.strokeStyle = rgba(P.dim, 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
          D.shown.forEach((b) => { const x = x0 + (b / p.T) * (x1 - x0); ctx.fillStyle = rgba(P.alarm, 0.85); ctx.fillRect(x - 0.5, y - F.u * 2, Math.max(1, F.u * 0.15), F.u * 4); });
          ctx.fillStyle = rgba(P.text, 0.9); ctx.fillRect(x1 - 1, y - F.u * 3, 2, F.u * 6);
          if (A.cards && t > p.T * 0.35 && t < p.T * 0.9) {
            const a = ease(clamp((t - p.T * 0.35) / 0.8)) * (1 - ease(clamp((t - p.T * 0.9 + 0.6) / 0.6)));
            ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(P.text, 0.9); ctx.textAlign = "center";
            ctx.font = `600 ${F.u * 3.6}px ${titleFont(A)}`; spaced(ctx, L(env.SF.trailer.segments[0].card), F.cx, F.cy + F.u * 26, F.u * 0.7); ctx.restore();
          }
          if (A.hud) {
            hudFormula(ctx, F, P, p.form === "G" ? `t_n = ${fmt(p.T)}(1 - ${fmt(p.q)}^n)` : `t_n = ${fmt(p.T)}n/(n + ${fmt(p.c)})`, x0, y - F.u * 5, 2.4);
            hudText(ctx, F, P, `n = ${D.shown.length}${D.merged ? "  …  ∞" : ""}`, x1, y - F.u * 5, 2.2, "right");
            if (D.merged) hudText(ctx, F, P, L({ es: "los pitidos ya están a menos de un fotograma: hay infinitos antes del límite", en: "the beeps are now less than a frame apart: infinitely many come before the limit" }), F.cx, y + F.u * 6, 1.8, "center", rgba(P.dim, 1));
          }
        } else {
          const u = clamp((t - p.T) / 1.6);
          ctx.globalAlpha = ease(Math.min(1, u * 2.5)) * (1 - ease(clamp((u - 0.8) * 5)));
          ctx.fillStyle = P.text; ctx.font = `600 ${F.u * 24}px ${titleFont(A)}`; ctx.textBaseline = "middle";
          glow(ctx, P.light, 30, () => spaced(ctx, "ZENO", F.cx, F.cy, F.u * 6));
          ctx.textBaseline = "alphabetic"; ctx.globalAlpha = 1;
        }
      },
      S1(ctx, F, P, A, t, dur, p) {
        const D = LISTS.S1(p, t, dur);
        const split = Math.min(3, dur * 0.25);
        if (t < split) { mountain(ctx, F, P, t); return; }
        screen(ctx, F, P);
        const R0 = F.h * 0.06, R1 = F.h * 0.44, n = D.rings.length;
        D.rings.forEach((count, k) => {
          const rad = R0 + (R1 - R0) * (n > 1 ? k / (n - 1) : 0), on = k < D.lit;
          ctx.strokeStyle = rgba(P.dim, on ? 0.35 : 0.12); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(F.cx, F.cy, rad, 0, Math.PI * 2); ctx.stroke();
          for (let j = 0; j < count; j++) {
            const ang = (j / count) * Math.PI * 2 + k * 0.37;
            const x = F.cx + rad * Math.cos(ang), y = F.cy + rad * Math.sin(ang) * 0.92;
            if (on) glow(ctx, P.light, 10, () => { ctx.fillStyle = rgba(P.light, 0.9); ctx.fillRect(x - F.u * 0.35, y - F.u * 0.35, F.u * 0.7, F.u * 0.7); });
            else { ctx.fillStyle = rgba(P.dim, 0.35); ctx.fillRect(x - F.u * 0.2, y - F.u * 0.2, F.u * 0.4, F.u * 0.4); }
          }
        });
        glow(ctx, P.warm, 30, () => { ctx.fillStyle = rgba(P.warm, 0.9); ctx.beginPath(); ctx.arc(F.cx, F.cy, F.u * 1.4, 0, Math.PI * 2); ctx.fill(); });
        if (A.hud) {
          hudText(ctx, F, P, `${L({ es: "ANILLO", en: "RING" })} ${Math.max(1, D.lit)}/${n}   ${L({ es: "CÁMARAS", en: "CAMERAS" })} ${D.sum}`, F.x0 + F.w * 0.04, F.y0 + F.h * 0.1, 2.4);
          hudFormula(ctx, F, P, `S_n = n(2 \\cdot ${fmt(p.a)} + (n - 1) \\cdot ${fmt(p.d)})/2`, F.x0 + F.w * 0.04, F.y0 + F.h * 0.9, 2.4);
          hudText(ctx, F, P, `= ${D.total}`, F.x0 + F.w * 0.96, F.y0 + F.h * 0.9, 2.6, "right");
        }
      },
      S2(ctx, F, P, A, t, dur, p, opts = {}) {
        const D = LISTS.S2(p, t, dur);
        const cam = opts.cam != null ? opts.cam : Math.max(-2, D.irene - 4);
        const C = corridor(ctx, F, P, cam, D.length, { emergency: true });
        // the Observer, far away, before the rings so that they glow over him
        if (opts.observer !== false) { const q = C.proj(D.length - 0.6); figure(ctx, C.vx, q.y1, (q.y1 - q.y0) * 0.78, rgba("#000000", 0.92), opts.turn || 0); }
        // echo rings: every ring ahead is visible; the one Irene has just crossed flares
        const front = D.rings.filter((r) => r.x <= D.irene + 1e-9).length;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        D.rings.slice().reverse().forEach((ring) => {
          if (ring.x > D.length + 1e-6 || ring.x < cam - 1.2) return;
          const q = C.proj(ring.x), lit = opts.allLit || ring.k <= front;
          const flare = !opts.allLit && ring.k === front ? 1 : 0;
          const a = (lit ? 0.55 : 0.28) + 0.4 * Math.pow(ring.glow, 0.25) * (lit ? 1 : 0.4) + 0.3 * flare;
          glow(ctx, P.light, (lit ? 22 : 8) * Math.max(0.4, q.s) * (0.4 + A.bloom) + 2, () => {
            ctx.strokeStyle = rgba(P.light, Math.min(1, a)); ctx.lineWidth = Math.max(1.2, F.u * (0.35 + 0.4 * flare) * Math.max(0.5, q.s * 1.6));
            const rw = q.x1 - q.x0, rh = q.y1 - q.y0, inset = 0.04;
            ctx.beginPath(); ctx.ellipse((q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2, rw * (0.5 - inset), rh * (0.5 - inset), 0, 0, Math.PI * 2); ctx.stroke();
          });
        });
        ctx.restore();
        if (opts.labels) {
          D.rings.forEach((ring) => {
            if (ring.x > D.length + 1e-6 || ring.x < cam - 1.2 || ring.k > 6) return;
            const q = C.proj(ring.x);
            ctx.fillStyle = rgba(P.text, 0.95); ctx.font = `bold ${Math.max(10, F.u * 2.6)}px ${FONT_SANS}`; ctx.textAlign = "center";
            ctx.fillText(`${ring.k}`, (q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2 + (q.y1 - q.y0) * 0.5 - F.u * 1.2);
          });
        }
        // Irene's point of view: the cone of her torch, swinging as she runs
        if (opts.irene !== false) {
          const sway = Math.sin(t * 6) * F.w * 0.015, tx = F.cx + sway, ty = F.y0 + F.h * 0.48;
          const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, F.h * 0.55);
          g.addColorStop(0, rgba(P.warm, 0.22)); g.addColorStop(0.5, rgba(P.warm, 0.08)); g.addColorStop(1, rgba(P.warm, 0));
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(F.x0, F.y0, F.w, F.h); ctx.restore();
        }
        if (A.hud && !opts.noHud) {
          hudText(ctx, F, P, `x = ${fmt(D.irene, 2)} m`, F.x0 + F.w * 0.04, F.y0 + F.h * 0.1, 2.4);
          hudFormula(ctx, F, P, D.limit != null ? `x_k = ${fmt(p.a)}(1 - ${fmt(p.r)}^k)/(1 - ${fmt(p.r)}) \\to ${fmt(D.limit, 2)}` : `r = ${fmt(p.r)}: |r| \\ge 1`, F.x0 + F.w * 0.96, F.y0 + F.h * 0.1, 2.4, "right");
        }
      },
      S3(ctx, F, P, A, t, dur, p) {
        const D = LISTS.S3(p, t, dur);
        const stretch = 1 + Math.log(D.n) * 0.8;
        const C = corridor(ctx, F, P, 0, 12 * stretch, { door: false, endGlow: 0.08 });
        // the probe: a red light at the covered fraction of the (stretched) corridor
        const q = C.proj(12 * stretch * D.F);
        glow(ctx, P.alarm, 24, () => { ctx.fillStyle = P.alarm; ctx.beginPath(); ctx.arc((q.x0 + q.x1) / 2, q.y1 - (q.y1 - q.y0) * 0.02, Math.max(2, F.u * 1.2 * q.s * 2), 0, Math.PI * 2); ctx.fill(); });
        // schematic: the corridor as a bar that keeps growing
        const bx = F.x0 + F.w * 0.1, bw = F.w * 0.8, by = F.y0 + F.h * 0.86;
        ctx.strokeStyle = rgba(P.light, 0.7); ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, F.u * 1.4);
        ctx.fillStyle = rgba(P.alarm, 0.85); ctx.fillRect(bx, by, bw * D.F, F.u * 1.4);
        if (A.hud) {
          hudText(ctx, F, P, `${L({ es: "MINUTO", en: "MINUTE" })} ${D.n}   ${L({ es: "PASILLO", en: "CORRIDOR" })} ${fmt(p.L * D.n, 0)} m`, bx, by - F.u * 2, 2.2);
          hudFormula(ctx, F, P, `F_n = H_n/${fmt(D.m)} = ${fmt(D.F, 4)}`, bx + bw, by - F.u * 2, 2.4, "right");
          hudText(ctx, F, P, L({ es: `llegada: minuto ${D.arrival} (calculado) · demostrado: entre ${D.earliest} y ${D.latest}`, en: `arrival: minute ${D.arrival} (computed) · proved: between ${D.earliest} and ${D.latest}` }), F.cx, by + F.u * 5, 1.9, "center", rgba(P.dim, 1));
        }
      },
      S4(ctx, F, P, A, t, dur, p) {
        const D = LISTS.S4(p, t, dur);
        ctx.fillStyle = "#020805"; ctx.fillRect(F.x0, F.y0, F.w, F.h);
        const green = A.palette === "noir" ? "#d9d9d9" : "#5dff9d";
        const lh = F.h * 0.075, x0 = F.x0 + F.w * 0.12, y0 = F.y0 + F.h * 0.14;
        ctx.font = `${lh * 0.55}px ${FONT_MONO}`; ctx.textAlign = "left";
        const fadeFor = (k) => clamp((D.shown - k) * 0.8);   // pairs cancel once the next line appears
        for (let k = 0; k < D.shown; k++) {
          const line = D.lines[k], y = y0 + k * lh;
          const plus = `+${fmt(line.plus, 4)}`, minus = `−${fmt(line.minus, 4)}`;
          ctx.fillStyle = rgba(green, 0.85); ctx.fillText(`OBS ${String(line.k).padStart(3, "0")}`, x0, y);
          const xp = x0 + F.w * 0.18, xm = x0 + F.w * 0.36;
          const cancelPlus = k > 0 ? fadeFor(k) : 0, cancelMinus = fadeFor(k + 1);
          [[plus, xp, cancelPlus], [minus, xm, cancelMinus]].forEach(([s, x, c]) => {
            ctx.fillStyle = rgba(green, 0.95 - 0.75 * c); ctx.fillText(s, x, y);
            if (c > 0) { const w = ctx.measureText(s).width; ctx.strokeStyle = rgba(P.alarm, 0.9 * c); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - lh * 0.18); ctx.lineTo(x + w * c, y - lh * 0.18); ctx.stroke(); }
          });
          ctx.fillStyle = rgba(green, 0.5); ctx.fillText(`= ${fmt(line.value, 4)}`, x0 + F.w * 0.56, y);
        }
        if (A.hud) {
          glow(ctx, green, 18, () => { ctx.fillStyle = green; ctx.font = `bold ${lh * 0.75}px ${FONT_MONO}`; ctx.textAlign = "right"; ctx.fillText(`Σ = ${fmt(D.partial, 4)}`, F.x0 + F.w * 0.9, F.y0 + F.h * 0.86); });
          hudFormula(ctx, F, P, `\\sum (b_k - b_{k+1}) = b_1 - b_{N+1} \\to ${fmt(D.total, 4)}`, F.x0 + F.w * 0.12, F.y0 + F.h * 0.86, 2.3);
        }
      },
      S5(ctx, F, P, A, t, dur, p) {
        const D = LISTS.S5(p, t, dur);
        screen(ctx, F, P);
        const top = F.y0 + F.h * 0.16, bottom = F.y0 + F.h * 0.84, maxV = Math.max(3, D.thr * 1.4);
        const Y = (v) => bottom - (v / maxV) * (bottom - top);
        const bars = [[L({ es: "SARA", en: "SARA" }), D.sara, p.pS, D.saraCross, F.cx - F.w * 0.16], [L({ es: "IRENE", en: "IRENE" }), D.irene, p.pI, D.ireneCross, F.cx + F.w * 0.16]];
        ctx.strokeStyle = rgba(P.alarm, 0.85); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x0 + F.w * 0.2, Y(D.thr)); ctx.lineTo(F.x0 + F.w * 0.8, Y(D.thr)); ctx.stroke(); ctx.setLineDash([]);
        hudText(ctx, F, P, `${L({ es: "UMBRAL", en: "THRESHOLD" })} ${fmt(D.thr)}`, F.x0 + F.w * 0.8, Y(D.thr) - F.u, 2, "right", rgba(P.alarm, 0.95));
        bars.forEach(([name, v, pe, cross, x]) => {
          const over = v > D.thr, bw = F.w * 0.09;
          ctx.strokeStyle = rgba(P.light, 0.6); ctx.strokeRect(x - bw / 2, top, bw, bottom - top);
          const col = over ? P.alarm : P.light;
          glow(ctx, col, over ? 40 * (0.6 + 0.4 * Math.sin(t * 18)) : 16, () => { ctx.fillStyle = rgba(col, 0.85); ctx.fillRect(x - bw / 2 + 2, Y(Math.min(v, maxV)), bw - 4, bottom - Y(Math.min(v, maxV))); });
          ctx.fillStyle = rgba(P.text, 0.95); ctx.font = `600 ${F.u * 3}px ${FONT_COND}`; ctx.textAlign = "center"; ctx.fillText(name, x, bottom + F.u * 4.5);
          if (A.hud) { hudFormula(ctx, F, P, `\\sum ${fmt(p.D)}/n^{${fmt(pe)}} = ${fmt(v, 3)}`, x, top - F.u * 2, 2.2, "center"); }
        });
        if (A.hud) hudText(ctx, F, P, `${L({ es: "MINUTO", en: "MINUTE" })} ${D.n}`, F.x0 + F.w * 0.04, F.y0 + F.h * 0.1, 2.4);
      },
      S6(ctx, F, P, A, t, dur, p, opts = {}) {
        const D = LISTS.S6(p, t, dur);
        screen(ctx, F, P);
        const len = opts.length || 20, x0 = F.x0 + F.w * 0.08, x1 = F.x0 + F.w * 0.92, yc = F.y0 + F.h * 0.4;
        const X = (m) => x0 + (m / len) * (x1 - x0);
        ctx.strokeStyle = rgba(P.light, 0.5); ctx.lineWidth = 1.5; ctx.strokeRect(x0, yc - F.h * 0.08, x1 - x0, F.h * 0.16);
        for (let m = 0; m <= len; m += 1) { ctx.fillStyle = rgba(P.dim, 0.8); ctx.fillRect(X(m), yc + F.h * 0.08, 1, F.u * (m % 5 ? 0.8 : 1.6)); if (m % 5 === 0) hudText(ctx, F, P, `${m}`, X(m), yc + F.h * 0.08 + F.u * 4, 1.8, "center", rgba(P.dim, 1)); }
        // alcove at the (known or exact) limit; the bracket from two consecutive positions
        const alcove = opts.alcove != null ? opts.alcove : D.exact != null ? D.exact : D.known != null ? D.known : (D.bracket[0] + D.bracket[1]) / 2;
        ctx.fillStyle = rgba(P.warm, 0.18); ctx.fillRect(X(alcove) - F.u * 1.2, yc - F.h * 0.08, F.u * 2.4, F.h * 0.16);
        ctx.fillStyle = rgba(P.warm, 0.25); ctx.fillRect(X(D.bracket[0]), yc - F.h * 0.11, Math.max(1, X(D.bracket[1]) - X(D.bracket[0])), F.h * 0.22);
        // the zigzag trail of the path walked
        ctx.strokeStyle = rgba(P.light, 0.55); ctx.lineWidth = 1.2; ctx.beginPath();
        let prev = 0; const ty0 = yc + F.h * 0.22, step = (F.h * 0.5) / 16;
        ctx.moveTo(X(0), ty0);
        D.positions.forEach((s, k) => { ctx.lineTo(X(s), ty0 + (k + 1) * step); prev = s; });
        ctx.stroke();
        glow(ctx, P.warm, 26, () => { ctx.fillStyle = P.warm; ctx.beginPath(); ctx.arc(X(D.x), yc, F.u * 1.4, 0, Math.PI * 2); ctx.fill(); });
        if (opts.labels) D.positions.forEach((s, k) => hudText(ctx, F, P, fmt(s, 2), X(s), ty0 + (k + 1) * step - 3, 1.7, "center", rgba(P.text, 0.9)));
        if (A.hud && !opts.noHud) {
          hudText(ctx, F, P, `${L({ es: "OSCILACIÓN", en: "SWING" })} ${D.k}   ${L({ es: "CAMINO", en: "PATH" })} ${fmt(D.path, 2)} m`, F.x0 + F.w * 0.04, F.y0 + F.h * 0.1, 2.3);
          hudText(ctx, F, P, `[${fmt(D.bracket[0], 2)}, ${fmt(D.bracket[1], 2)}]`, F.x0 + F.w * 0.96, F.y0 + F.h * 0.1, 2.3, "right");
        }
      },
      S7(ctx, F, P, A, t, dur, p, cfg) {
        // accelerating montage on the countdown of S0, then the door, then the end card
        const beeps = M.countdown.times(cfg.math.S0, { until: cfg.math.S0.T, minGap: 1 / 30, max: 40 }).map((b) => (b / cfg.math.S0.T) * dur * 0.45);
        const tMont = dur * 0.45, tDoor = dur * 0.75;
        if (t < tMont) {
          const k = beeps.filter((b) => b <= t).length;
          const order = ["S2", "S5", "S6", "S3", "S1", "S4"];
          const id = order[k % order.length];
          SCENES[id](ctx, F, P, Object.assign({}, A, { hud: false }), 3 + (k % 5), 8, cfg.math[id] || {}, { noHud: true });
          const flash = Math.exp(-(t - (beeps[k - 1] || -1)) * 12);
          ctx.fillStyle = rgba("#ffffff", 0.35 * flash); ctx.fillRect(F.x0, F.y0, F.w, F.h);
        } else if (t < tDoor) {
          const u = (t - tMont) / (tDoor - tMont);
          corridor(ctx, F, P, 14 + 5.4 * ease(u), 20, { emergency: true, endGlow: 0.35 + 0.4 * u });
          ctx.fillStyle = rgba("#000000", 0.92); const hx = F.cx + F.w * 0.02, hy = F.y0 + F.h * (0.62 - 0.08 * ease(u));
          ctx.beginPath(); ctx.ellipse(hx, hy, F.w * 0.035, F.h * 0.06, -0.3, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = "#000"; ctx.fillRect(F.x0, F.y0, F.w, F.h);
          const u = clamp((t - tDoor - 0.6) / 1.2);
          ctx.globalAlpha = ease(u);
          ctx.fillStyle = P.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = `600 ${F.u * 18}px ${titleFont(A)}`;
          glow(ctx, P.light, 26, () => spaced(ctx, "ZENO", F.cx, F.cy - F.u * 8, F.u * 4.5));
          ctx.font = `${F.u * 4}px ${titleFont(A)}`; spaced(ctx, L({ es: "EL FINAL", en: "THE FINALE" }), F.cx, F.cy + F.u * 9, F.u * 1.6);
          ctx.font = `${F.u * 2.6}px ${FONT_SANS}`; ctx.fillStyle = rgba(P.text, 0.75);
          ctx.fillText(L(env.SF.show.tagline), F.cx, F.cy + F.u * 18);
          ctx.globalAlpha = 1; ctx.textBaseline = "alphabetic";
        }
      },
    };

    // --------------------------------------------------------------- composition (C + D)
    /** Trailer-style interstitial: the last seconds of a shot cut to black with its title card. */
    const CARD_LEN = 1.7;
    function cardActive(id, t, dur, A) { return A.cards && id !== "S0" && id !== "S7" && t > dur - CARD_LEN; }
    function card(ctx, F, P, A, text, t, dur) {
      const u = (t - (dur - CARD_LEN)) / CARD_LEN;
      ctx.save();
      ctx.fillStyle = "#000"; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      ctx.globalAlpha = ease(clamp(u * 4)) * (1 - ease(clamp((u - 0.85) * 6.6)));
      ctx.fillStyle = P.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `600 ${F.u * 6.4}px ${titleFont(A)}`;
      const s = 1 + 0.04 * u;
      ctx.translate(F.cx, F.cy); ctx.scale(s, s);
      glow(ctx, P.light, 18 * A.bloom, () => spaced(ctx, text, 0, 0, F.u * 0.9));
      ctx.restore();
    }
    function finish(ctx, W, H, F, P, A, seed, provisional) {
      // vignette
      const v = ctx.createRadialGradient(F.cx, F.cy, F.h * 0.3, F.cx, F.cy, F.w * 0.75);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = v; ctx.fillRect(F.x0, F.y0, F.w, F.h);
      // grain
      if (A.grain > 0) {
        const tile = noiseTile(make), r = rng(seed);
        ctx.save(); ctx.globalAlpha = 0.06 + 0.14 * A.grain; ctx.globalCompositeOperation = "overlay";
        const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
        for (let x = -ox; x < W; x += 256) for (let y = F.y0 - oy; y < F.y0 + F.h; y += 256) ctx.drawImage(tile, x, y);
        ctx.restore();
      }
      // letterbox
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, F.y0); ctx.fillRect(0, F.y0 + F.h, W, H - F.y0 - F.h);
      if (provisional) {
        ctx.font = `${Math.max(9, F.u * 1.6)}px ${FONT_SANS}`; ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText(L({ es: "PREVISUALIZACIÓN · planos provisionales", en: "PREVIS · provisional plates" }), W - F.u * 2, F.y0 + F.h - F.u * 1.5);
      }
    }

    /** One shot at local time t (seconds), for stills and for the player. */
    function drawShot(ctx, W, H, id, t, cfg, opts = {}) {
      const A = Object.assign({}, ART_DEFAULT, cfg.art || {}, opts.art || {});
      const P = PALETTES[A.palette] || PALETTES.zeno;
      const F = frame(W, H, A);
      const seg = env.SF.trailer.segments.find((s) => s.id === id);
      const dur = opts.dur || (id === "S0" ? cfg.math.S0.T + 2 : seg.end - seg.start);
      // camera motion
      ctx.save();
      if (A.camera !== "static" && !opts.still) {
        const amp = A.camera === "handheld" ? 0.006 : 0.003, s = 1 + amp * 3;
        ctx.translate(W / 2, H / 2); ctx.scale(s, s);
        ctx.translate(-W / 2 + Math.sin(t * (A.camera === "handheld" ? 7 : 0.6)) * W * amp, -H / 2 + Math.cos(t * (A.camera === "handheld" ? 5.3 : 0.45)) * H * amp);
      }
      const plate = env.plates && env.plates[id];
      if (plate && !opts.noPlate) { ctx.drawImage(plate, F.x0, F.y0, F.w, F.h); ctx.globalAlpha = 0.92; }
      const showCard = !opts.noCard && cardActive(id, t, dur, A);
      if (!showCard) SCENES[id](ctx, F, P, A, t, dur, id === "S7" ? null : cfg.math[id], id === "S7" ? cfg : opts.scene || {});
      ctx.globalAlpha = 1;
      ctx.restore();
      if (showCard) card(ctx, F, P, A, L(seg.card), t, dur);
      finish(ctx, W, H, F, P, A, Math.floor((opts.seed || 0) + t * 30), !plate && opts.provisional !== false && !opts.still);
    }

    /** The whole trailer at global time T. */
    function drawFrame(ctx, W, H, T, cfg) {
      const tl = timeline(env.SF, cfg);
      const seg = tl.find((s) => T >= s.t0 && T < s.t1) || tl[tl.length - 1];
      const t = T - seg.t0;
      drawShot(ctx, W, H, seg.id, t, cfg, { dur: seg.dur, seed: Math.floor(T * 30) });
      // transitions at the head of each shot
      const A = Object.assign({}, ART_DEFAULT, cfg.art || {});
      const tr = 0.35;
      if (seg !== tl[0] && t < tr) {
        const u = 1 - t / tr;
        if (A.transition === "fade") { ctx.fillStyle = `rgba(0,0,0,${u})`; ctx.fillRect(0, 0, W, H); }
        else if (A.transition === "flash") { ctx.fillStyle = `rgba(255,255,255,${0.8 * u})`; ctx.fillRect(0, 0, W, H); }
        else if (A.transition === "glitch") {
          const r = rng(Math.floor(T * 60));
          for (let k = 0; k < 8; k++) { const y = r() * H, h = r() * H * 0.06; ctx.drawImage(ctx.canvas, 0, y, W, h, (r() - 0.5) * W * 0.08 * u, y, W, h); }
          ctx.fillStyle = `rgba(255,0,60,${0.12 * u})`; ctx.fillRect(0, 0, W, H);
        }
      }
      return seg;
    }

    return { drawShot, drawFrame, frame, SCENES };
  }

  // ------------------------------------------------------------------ evidence frames
  /** Stills for the printed exhibits, drawn with the investigation's (not the team's) values. */
  function evidenceFrame(env, which, W, H, data) {
    const P = painter(env), c = (env.makeCanvas || ((w, h) => { const k = document.createElement("canvas"); k.width = w; k.height = h; return k; }))(W, H);
    const ctx = c.getContext("2d");
    const cfg = { math: Object.assign({}, MATH_DEFAULT), art: Object.assign({}, ART_DEFAULT, { letterbox: "none", camera: "static", cards: false }) };
    if (which === "leak") {
      cfg.math.S2 = { a: 20 * (1 - data.r), r: data.r };
      P.drawShot(ctx, W, H, "S2", 99, cfg, { still: true, noCard: true, art: { grain: 1, hud: false }, scene: { cam: -1.4, allLit: true, irene: false, turn: 0.3, labels: true } });
      // compression blocks and the poster's overlay
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `${Math.round(H * 0.035)}px ${FONT_MONO}`; ctx.textAlign = "left";
      ctx.fillText(`${data.user} · ${data.forum} · ${data.time}`, W * 0.02, H * 0.06);
      ctx.textAlign = "right"; ctx.fillText(`${data.frameLabel}`, W * 0.98, H * 0.06);
    } else if (which === "altS5") {
      cfg.math.S5 = { D: 1, pS: 1, pI: data.p };
      const dur = 14, minutes = 12;
      const tFor = (m) => 0.6 + ((m - 1 + 0.999) / minutes) * (dur - 3);
      P.drawShot(ctx, W, H, "S5", tFor(data.minute), cfg, { still: true, noCard: true, art: { grain: 0.6 } });
    } else if (which === "altS6") {
      cfg.math.S6 = { form: "P", L: data.L, s: 1 };
      const dur = 14, N = 14;
      const tFor = (k) => 0.5 + ((k - 1 + 0.999) / N) * (dur - 2.5);
      P.drawShot(ctx, W, H, "S6", tFor(data.swing), cfg, { still: true, noCard: true, art: { grain: 0.6 }, scene: { length: 20, alcove: data.alcove } });
    } else if (which === "shot") {
      P.drawShot(ctx, W, H, data.id, data.t, data.cfg || cfg, Object.assign({ still: true, noCard: !data.card }, data.opts || {}));
    }
    return c;
  }

  // ------------------------------------------------------------------ the player
  class Player {
    constructor(canvas, env, cfg) {
      this.canvas = canvas; this.env = env; this.cfg = cfg; this.paint = painter(env);
      this.t = 0; this.playing = false; this.raf = null; this.onTime = null; this.audio = null;
    }
    get duration() { return totalDuration(this.env.SF, this.cfg); }
    draw() { const c = this.canvas; this.paint.drawFrame(c.getContext("2d"), c.width, c.height, this.t, this.cfg); if (this.onTime) this.onTime(this.t, this.duration); }
    seek(t) { this.t = clamp(t, 0, this.duration - 1e-3); this.draw(); if (this.playing && this.audio) this.audio.seek(this.t); }
    play() {
      if (this.playing) return;
      this.playing = true;
      const start = performance.now() - this.t * 1000;
      if (this.env.audio) { this.audio = this.env.audio.start(this.cfg, this.t); }
      const tick = () => {
        if (!this.playing) return;
        this.t = (performance.now() - start) / 1000;
        if (this.t >= this.duration) { this.t = this.duration - 1e-3; this.draw(); this.pause(); if (this.onEnd) this.onEnd(); return; }
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    pause() { this.playing = false; if (this.raf) cancelAnimationFrame(this.raf); if (this.audio) { this.audio.stop(); this.audio = null; } }
    /** Real-time capture with MediaRecorder (WebM where supported). Resolves with a Blob. */
    async record(onProgress) {
      if (typeof MediaRecorder === "undefined" || !this.canvas.captureStream) throw new Error("MediaRecorder");
      const stream = this.canvas.captureStream(30);
      let audioTrack = null;
      if (this.env.audio && this.env.audio.streamDestination) {
        const dest = this.env.audio.streamDestination();
        if (dest) { audioTrack = dest.stream.getAudioTracks()[0]; if (audioTrack) stream.addTrack(audioTrack); }
      }
      const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: mime || "video/webm" })); });
      this.pause(); this.t = 0;
      rec.start(500);
      const prevTime = this.onTime;
      this.onTime = (t, d) => { if (prevTime) prevTime(t, d); if (onProgress) onProgress(t / d); };
      await new Promise((res) => { this.onEnd = res; this.play(); });
      this.onTime = prevTime; this.onEnd = null;
      rec.stop();
      return { blob: await done, mime: mime || "video/webm" };
    }
  }

  root.SFTrailer = { PALETTES, ART_DEFAULT, MATH_DEFAULT, defaultConfig, checkShot, timeline, totalDuration, LISTS, painter, evidenceFrame, Player };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFTrailer;
})(typeof window !== "undefined" ? window : globalThis);
