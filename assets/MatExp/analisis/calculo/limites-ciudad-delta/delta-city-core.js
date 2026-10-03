/*
 * Delta City / Ciudad Delta — core library.
 * Everything visual that depends on the configuration is built here from
 * delta-city-data.json: licence plates, the perspective composition of each
 * plate on its photograph, the camera OSD, the tracking map with its camera
 * pins and the graph of the model, and small formula images for the PDFs.
 * The same functions are used by the live web preview and by the PDFs.
 */
(function () {
  "use strict";

  const SCRIPT = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
  const BASE = SCRIPT.slice(0, SCRIPT.lastIndexOf("/") + 1);
  const url = (path) => new URL(path, BASE).href;

  // ------------------------------------------------------------------ data
  let dataPromise = null;
  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(url("delta-city-data.json"), { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error("delta-city-data.json");
        return r.json();
      }).then(indexData);
    }
    return dataPromise;
  }

  function indexData(data) {
    data.camera = Object.fromEntries(data.cameras.map((c) => [c.id, c]));
    data.slotByCode = Object.fromEntries(data.slots.map((s) => [s.code, s]));
    return data;
  }

  const imageCache = new Map();
  function loadImage(path) {
    if (!imageCache.has(path)) {
      imageCache.set(path, new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(path));
        img.src = url(path);
      }));
    }
    return imageCache.get(path);
  }

  // ------------------------------------------------------------------ the model
  function pieceValue(p, t) {
    switch (p.kind) {
      case "quadratic": return p.a * t * t;
      case "linear": return p.m * t + p.b;
      case "osc": return p.c + p.A * Math.sin(Math.PI / (p.p - t));
      case "pole": return p.c + p.k / (p.p - t);
      default: throw new Error(p.kind);
    }
  }
  function modelValue(data, t) {
    for (const p of data.model.pieces) {
      const lo = t > p.from || (p.closedFrom && t === p.from);
      const hi = t < p.to || (p.closedTo && t === p.to);
      if (lo && hi) return pieceValue(p, t);
    }
    return NaN;
  }
  function recordValue(data, t) {
    const o = data.model.recordOverrides.find((r) => Math.abs(r.t - t) < 1e-9);
    return o ? o.value : modelValue(data, t);
  }

  // ------------------------------------------------------------------ plates
  const DIGIT_LOOK = { 0: "86", 1: "7", 2: "7", 3: "8", 4: "1", 5: "6", 6: "58", 7: "1", 8: "30", 9: "8" };
  const LETTER_LOOK = {
    A: "R", B: "RPD", C: "G", D: "BO", E: "F", F: "PE", G: "C", H: "NM", I: "L", J: "L", K: "X", L: "J",
    M: "NH", N: "MH", O: "DQ", P: "RF", Q: "O", R: "BP", S: "Z", T: "Y", U: "V", V: "Y", W: "V", X: "K", Y: "VT", Z: "S"
  };
  const SPANISH_LETTERS = "BCDFGHJKLMNPRSTVWXYZ";

  function normalizePlate(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9 -]/g, "").replace(/\s+/g, " ").trim();
  }
  function plateShape(p) {
    return p.replace(/[0-9]/g, "9").replace(/[A-Z]/g, "A");
  }
  function hashString(s) {
    let h = 2166136261;
    for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngFrom(seed) {
    let a = seed || 1;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /** Suggest a plausible look-alike: same format, two or three characters changed. */
  function confusablePlate(target, attempt = 0) {
    const p = normalizePlate(target);
    const chars = p.split("");
    const rnd = rngFrom(hashString(p) + attempt * 7919);
    const digits = chars.map((c, i) => /[0-9]/.test(c) ? i : -1).filter((i) => i >= 0);
    const letters = chars.map((c, i) => /[A-Z]/.test(c) ? i : -1).filter((i) => i >= 0);
    const spanishStyle = letters.every((i) => SPANISH_LETTERS.includes(chars[i]));
    const out = chars.slice();
    const touched = new Set();
    const swaps = digits.filter((i) => digits.includes(i + 1) && chars[i] !== chars[i + 1]);
    if (swaps.length) {
      const i = swaps[Math.floor(rnd() * swaps.length)];
      out[i] = chars[i + 1]; out[i + 1] = chars[i];
      touched.add(i); touched.add(i + 1);
    } else if (digits.length) {
      const i = digits[Math.floor(rnd() * digits.length)];
      const opts = DIGIT_LOOK[chars[i]];
      out[i] = opts[Math.floor(rnd() * opts.length)];
      touched.add(i);
    }
    const pool = letters.length ? letters : digits.filter((i) => !touched.has(i));
    if (pool.length) {
      const order = pool.slice().sort(() => rnd() - 0.5);
      for (const i of order) {
        const map = /[0-9]/.test(chars[i]) ? DIGIT_LOOK : LETTER_LOOK;
        let opts = (map[chars[i]] || "").split("");
        if (spanishStyle && map === LETTER_LOOK) opts = opts.filter((c) => SPANISH_LETTERS.includes(c));
        if (opts.length) { out[i] = opts[Math.floor(rnd() * opts.length)]; touched.add(i); break; }
      }
    }
    const result = out.join("");
    return result === p ? confusablePlate(target, attempt + 1) : result;
  }

  function plateDistance(a, b) {
    a = normalizePlate(a); b = normalizePlate(b);
    if (a.length === b.length) return [...a].filter((c, i) => c !== b[i]).length;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  }

  /** Classify a pair of plates: ok / near-identical / too-different / invalid. */
  function checkPlates(target, alt) {
    const a = normalizePlate(target), b = normalizePlate(alt);
    const valid = (p) => /^[A-Z0-9][A-Z0-9 -]{2,10}[A-Z0-9]$/.test(p);
    if (!valid(a)) return { level: "error", code: "target-invalid" };
    if (!valid(b)) return { level: "error", code: "alt-invalid" };
    if (a === b) return { level: "error", code: "identical" };
    const d = plateDistance(a, b);
    const sameShape = plateShape(a) === plateShape(b);
    if (d === 1) return { level: "warn", code: "too-similar", distance: d, sameShape };
    if (d >= 5 || d > Math.ceil(a.replace(/[ -]/g, "").length * 0.6)) return { level: "warn", code: "too-different", distance: d, sameShape };
    if (!sameShape) return { level: "warn", code: "format", distance: d, sameShape };
    return { level: "ok", code: "ok", distance: d, sameShape };
  }

  const PLATE_W = 1040, PLATE_H = 220;   // 520 x 110 mm at 2 px/mm
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /** Flat EU-style plate texture (blue band, embossed black characters). */
  function renderPlate(text) {
    const c = document.createElement("canvas");
    c.width = PLATE_W; c.height = PLATE_H;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, PLATE_H);
    g.addColorStop(0, "#fbfbf8"); g.addColorStop(0.55, "#f1f2ee"); g.addColorStop(1, "#e3e4df");
    roundRect(ctx, 2, 2, PLATE_W - 4, PLATE_H - 4, 18);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = "#1d1d1f"; ctx.stroke();
    const band = 92;
    ctx.save();
    roundRect(ctx, 8, 8, band, PLATE_H - 16, 10); ctx.clip();
    ctx.fillStyle = "#123f9c"; ctx.fillRect(8, 8, band, PLATE_H - 16);
    ctx.restore();
    ctx.fillStyle = "#f6cf2c";
    for (let k = 0; k < 12; k += 1) {
      const a = (k / 12) * Math.PI * 2;
      const x = 8 + band / 2 + Math.cos(a) * 26, y = 62 + Math.sin(a) * 26;
      ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("E", 8 + band / 2, PLATE_H - 26);
    const plate = normalizePlate(text);
    const left = 8 + band + 26, right = PLATE_W - 34, avail = right - left;
    const size = 206;
    ctx.font = `600 ${size}px "DIN Condensed", "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif`;
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    // spaces become gaps; hyphens are kept as characters (e.g. B-1234-XY)
    const groups = plate.split(" ");
    const gap = groups.length > 1 ? 46 : 0;
    const natural = groups.reduce((s, grp) => s + ctx.measureText(grp).width, 0) + gap * (groups.length - 1);
    const sx = Math.min(0.95, (avail * 0.97) / natural);
    const totalW = natural * sx;
    ctx.save();
    ctx.translate(left + (avail - totalW) / 2, PLATE_H / 2 + 6);
    ctx.scale(sx, 1);
    let x = 0;
    groups.forEach((grp) => {
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText(grp, x + 3, 3);   // emboss highlight
      ctx.fillStyle = "rgba(0,0,0,0.30)"; ctx.fillText(grp, x - 2, -2);
      ctx.fillStyle = "#111214"; ctx.fillText(grp, x, 0);
      x += ctx.measureText(grp).width + gap / sx;
    });
    ctx.restore();
    return c;
  }

  // ------------------------------------------------------------------ perspective composition
  function solve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col += 1) {
      let piv = col;
      for (let r = col + 1; r < n; r += 1) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      [M[col], M[piv]] = [M[piv], M[col]];
      for (let r = 0; r < n; r += 1) {
        if (r === col) continue;
        const k = M[r][col] / M[col][col];
        for (let c = col; c <= n; c += 1) M[r][c] -= k * M[col][c];
      }
    }
    return M.map((row, i) => row[n] / row[i]);
  }
  /** Homography mapping src[i] -> dst[i] (4 points). Returns 3x3 row-major. */
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i += 1) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const h = solve(A, b);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }

  /**
   * Paint `plateCanvas` onto `canvas` inside `quad` (TL, TR, BR, BL), inheriting the
   * light of the blank plate in the photograph: low-frequency shading and colour
   * cast are transferred per channel, edges are antialiased and a little grain added.
   */
  function compositePlate(canvas, quad, plateCanvas, opts = {}) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 2), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 2);
    const x1 = Math.min(canvas.width, Math.ceil(Math.max(...xs)) + 2), y1 = Math.min(canvas.height, Math.ceil(Math.max(...ys)) + 2);
    const w = x1 - x0, h = y1 - y0;
    if (w < 4 || h < 3) return;
    const plateW = Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]);
    const plateH = Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]);
    // prefiltered texture about twice the destination resolution
    const texW = Math.max(48, Math.min(plateCanvas.width, Math.round(plateW * 2.2)));
    const texH = Math.max(10, Math.round(texW * plateCanvas.height / plateCanvas.width));
    const tex = document.createElement("canvas");
    tex.width = texW; tex.height = texH;
    const tctx = tex.getContext("2d");
    tctx.imageSmoothingEnabled = true; tctx.imageSmoothingQuality = "high";
    tctx.drawImage(plateCanvas, 0, 0, texW, texH);
    const td = tctx.getImageData(0, 0, texW, texH).data;
    const H = homography(quad, [[0, 0], [texW, 0], [texW, texH], [0, texH]]);
    const map = (x, y) => {
      const d = H[6] * x + H[7] * y + 1;
      return [(H[0] * x + H[1] * y + H[2]) / d, (H[3] * x + H[4] * y + H[5]) / d];
    };
    const img = ctx.getImageData(x0, y0, w, h);
    const d = img.data;
    // inside mask and smoothed base colour (shading carrier)
    const inside = new Uint8Array(w * h);
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
      const [u, v] = map(x0 + i + 0.5, y0 + j + 0.5);
      inside[j * w + i] = u >= 0 && v >= 0 && u < texW && v < texH ? 1 : 0;
    }
    const r = Math.max(2, Math.round(plateH / 3.5));
    const sum = [new Float64Array((w + 1) * (h + 1)), new Float64Array((w + 1) * (h + 1)), new Float64Array((w + 1) * (h + 1)), new Float64Array((w + 1) * (h + 1))];
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
      const k = j * w + i, m = inside[k];
      const idx = (j + 1) * (w + 1) + (i + 1);
      for (let c = 0; c < 4; c += 1) {
        const val = c < 3 ? d[k * 4 + c] * m : m;
        sum[c][idx] = val + sum[c][idx - 1] + sum[c][idx - (w + 1)] - sum[c][idx - (w + 1) - 1];
      }
    }
    const box = (c, i, j) => {
      const a0 = Math.max(0, i - r), b0 = Math.max(0, j - r), a1 = Math.min(w, i + r + 1), b1 = Math.min(h, j + r + 1);
      const S = sum[c];
      return S[b1 * (w + 1) + a1] - S[b0 * (w + 1) + a1] - S[b1 * (w + 1) + a0] + S[b0 * (w + 1) + a0];
    };
    const smooth = new Float32Array(w * h * 3);
    const lum = [];
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
      const k = j * w + i;
      const n = box(3, i, j);
      if (n < 1) continue;
      for (let c = 0; c < 3; c += 1) smooth[k * 3 + c] = box(c, i, j) / n;
      if (inside[k]) lum.push(0.3 * smooth[k * 3] + 0.59 * smooth[k * 3 + 1] + 0.11 * smooth[k * 3 + 2]);
    }
    lum.sort((a, b) => a - b);
    const refL = lum.length ? lum[Math.floor(lum.length * 0.9)] : 220;
    const strength = opts.shadeStrength == null ? 1 : opts.shadeStrength;
    const grain = opts.grain == null ? 5 : opts.grain;
    const rnd = rngFrom(hashString(String(quad)));
    const SS = 4;
    const sample = (u, v, c) => {
      const uu = Math.min(texW - 1.001, Math.max(0, u - 0.5)), vv = Math.min(texH - 1.001, Math.max(0, v - 0.5));
      const iu = Math.floor(uu), iv = Math.floor(vv), fu = uu - iu, fv = vv - iv;
      const p = (iv * texW + iu) * 4 + c;
      return (td[p] * (1 - fu) + td[p + 4] * fu) * (1 - fv) + (td[p + texW * 4] * (1 - fu) + td[p + texW * 4 + 4] * fu) * fv;
    };
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
      let hits = 0; const acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy += 1) for (let sx = 0; sx < SS; sx += 1) {
        const [u, v] = map(x0 + i + (sx + 0.5) / SS, y0 + j + (sy + 0.5) / SS);
        if (u < 0 || v < 0 || u >= texW || v >= texH) continue;
        hits += 1;
        for (let c = 0; c < 3; c += 1) acc[c] += sample(u, v, c);
      }
      if (!hits) continue;
      const k = j * w + i;
      const a = hits / (SS * SS);
      let L = 0.3 * smooth[k * 3] + 0.59 * smooth[k * 3 + 1] + 0.11 * smooth[k * 3 + 2];
      if (!L) L = refL;
      const noise = (rnd() - 0.5) * grain;
      for (let c = 0; c < 3; c += 1) {
        const tint = smooth[k * 3 + c] ? smooth[k * 3 + c] / Math.max(1, L) : 1;    // colour cast of the scene
        const shade = Math.min(1.08, Math.max(0.28, L / refL));
        const lit = (acc[c] / hits) * (1 - strength + strength * shade * Math.min(1.12, Math.max(0.85, tint)));
        const val = Math.min(255, Math.max(0, lit + noise));
        d[k * 4 + c] = d[k * 4 + c] * (1 - a) + val * a;
      }
    }
    ctx.putImageData(img, x0, y0);
  }

  /**
   * Sun reflection over a plate: the plate is still visible as a plate, but its
   * characters are washed out and blurred beyond reading (team A's doubtful frame).
   */
  function glarePlate(canvas, quad) {
    const ctx = canvas.getContext("2d");
    const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const cx = xs.reduce((a, b) => a + b) / 4, cy = ys.reduce((a, b) => a + b) / 4;
    const copy = document.createElement("canvas");
    copy.width = canvas.width; copy.height = canvas.height;
    copy.getContext("2d").drawImage(canvas, 0, 0);
    ctx.save();
    ctx.beginPath();
    quad.forEach(([x, y], i) => {
      const ex = cx + (x - cx) * 1.25, ey = cy + (y - cy) * 1.6;
      if (i) ctx.lineTo(ex, ey); else ctx.moveTo(ex, ey);
    });
    ctx.closePath(); ctx.clip();
    ctx.filter = `blur(${Math.max(1.5, h * 0.22)}px)`;
    ctx.drawImage(copy, 0, 0);
    ctx.filter = "none";
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(cx + w * 0.08, cy - h * 0.1, 0, cx, cy, w * 0.75);
    g.addColorStop(0, "rgba(255,252,236,0.95)"); g.addColorStop(0.35, "rgba(255,248,225,0.8)");
    g.addColorStop(0.7, "rgba(255,244,215,0.25)"); g.addColorStop(1, "rgba(255,244,215,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w, cy - w, 2 * w, 2 * w);
    ctx.restore();
  }

  // ------------------------------------------------------------------ photographs
  function pad(n, w = 2) { return String(n).padStart(w, "0"); }
  /** Camera clock with hundredths of a second: t read back from it matches the camera column to 0.001. */
  function clockAt(startHHMM, t) {
    const [hh, mm] = (startHHMM || "18:00").split(":").map(Number);
    const total = Math.round(((hh * 60 + mm) * 60 + t * 60) * 100) / 100;
    const s = total % 60, m = Math.floor(total / 60) % 60, h = Math.floor(total / 3600) % 24;
    return `${pad(h)}:${pad(m)}:${s.toFixed(2).padStart(5, "0")}`;
  }

  /**
   * Compose one camera photograph: base image + plate in perspective + OSD.
   * options: {plate, city, dateISO, start, t, width, osd:true}
   */
  async function composePhoto(data, cameraId, options) {
    const cam = data.camera[cameraId];
    let img;
    try { img = await loadImage(cam.image); } catch (e) { img = missingImage(cam); }
    const width = options.width || img.naturalWidth;
    const scale = width / img.naturalWidth;
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (cam.plate && options.plate) {
      const k = c.width / cam.plate.size[0];
      const q = cam.plate.quad.map(([x, y]) => [x * k, y * k]);
      compositePlate(c, q, renderPlate(options.plate));
      if (options.glare) glarePlate(c, q);
    }
    if (options.osd !== false) drawOSD(ctx, c.width, cam, options);
    return c;
  }

  /** Neutral stand-in used only if a photograph cannot be loaded. */
  function missingImage(cam) {
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#3a3f45"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#c9ced3"; ctx.font = "600 54px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`CAM ${cam.id}`, 768, 500);
    c.naturalWidth = c.width; c.naturalHeight = c.height;
    return c;
  }

  /**
   * Camera overlay (city, camera, date and time). Sized to stay legible on a printed
   * dossier card about 7 cm wide; long city names shrink the font instead of the box
   * growing over the scene. Plates always sit in the lower half of the frame.
   */
  function drawOSD(ctx, W, cam, o) {
    const s = W / 1536;
    const city = (o.city || "").toUpperCase();
    const line1 = `${city}  ·  CAM ${cam.id}`;
    const line2 = `${o.dateISO || ""}  ${clockAt(o.start, o.t)}`;
    const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    ctx.save();
    let fs = 40 * s;
    ctx.font = `700 ${Math.round(fs)}px ${mono}`;
    const widest = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
    if (widest > W * 0.6) { fs *= (W * 0.6) / widest; ctx.font = `700 ${Math.round(fs)}px ${mono}`; }
    const wBox = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 1.1 * fs;
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(14 * s, 14 * s, wBox, 2.75 * fs);
    ctx.fillStyle = "#f6f6f2";
    ctx.textBaseline = "top";
    ctx.fillText(line1, 14 * s + 0.55 * fs, 14 * s + 0.32 * fs);
    ctx.fillText(line2, 14 * s + 0.55 * fs, 14 * s + 1.47 * fs);
    const tag = "LPR";
    ctx.font = `700 ${Math.round(32 * s)}px ${mono}`;
    const tw = ctx.measureText(tag).width + 30 * s;
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(W - tw - 14 * s, 14 * s, tw, 52 * s);
    ctx.fillStyle = "#ffd34d";
    ctx.fillText(tag, W - tw + 1 * s, 25 * s);
    ctx.restore();
  }

  /**
   * Frame for a detection that was logged without a photograph: the camera's own
   * OSD over a dark, noisy frame and a storage-error banner, so it reads as evidence
   * (an unknown value), not as a printing fault.
   */
  function noImageFrame(data, cameraId, o) {
    const cam = data.camera[cameraId];
    const W = o.width || 1100, H = Math.round(W * 2 / 3);
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, "#2a2d31"); g.addColorStop(1, "#111315");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H), d = img.data, rnd = rngFrom(hashString(cameraId + "noise"));
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    drawOSD(ctx, W, cam, o);
    const s = W / 1536;
    const bw = 820 * s, bh = 150 * s, bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.fillStyle = "rgba(150,40,40,0.88)"; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(52 * s)}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.fillText(o.title || "NO IMAGE", W / 2, by + bh * 0.38);
    ctx.font = `500 ${Math.round(26 * s)}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.fillText(o.subtitle || "", W / 2, by + bh * 0.74);
    return c;
  }

  /** High-resolution plate crop (as produced by the camera's plate channel). */
  async function plateCrop(data, cameraId, plate, outW = 520, opts = {}) {
    const cam = data.camera[cameraId];
    if (!cam.plate) return null;
    let img;
    try { img = await loadImage(cam.image); } catch (e) { return null; }
    const k0 = img.naturalWidth / cam.plate.size[0];
    const q = cam.plate.quad.map(([x, y]) => [x * k0, y * k0]);
    const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
    const pw = Math.max(...xs) - Math.min(...xs), ph = Math.max(...ys) - Math.min(...ys);
    const mx = pw * 0.22, my = Math.max(ph * 0.9, pw * 0.11);
    const sx0 = Math.max(0, Math.min(...xs) - mx), sy0 = Math.max(0, Math.min(...ys) - my);
    const sw = Math.min(img.naturalWidth - sx0, pw + 2 * mx), sh = Math.min(img.naturalHeight - sy0, ph + 2 * my);
    const k = outW / sw;
    const c = document.createElement("canvas");
    c.width = outW; c.height = Math.round(sh * k);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.filter = "contrast(1.08) saturate(0.85)";
    ctx.drawImage(img, sx0, sy0, sw, sh, 0, 0, c.width, c.height);
    ctx.filter = "none";
    const qc = q.map(([x, y]) => [(x - sx0) * k, (y - sy0) * k]);
    compositePlate(c, qc, renderPlate(plate), { grain: 7 });
    if (opts.glare) glarePlate(c, qc);
    return c;
  }

  // ------------------------------------------------------------------ map
  const MAP_COLORS = { pin: "#a43d35", pinAlt: "#5d6570", grid: "rgba(11,96,127,0.20)", gridStrong: "rgba(11,96,127,0.42)", graph: "#1263a8", record: "#e77924" };

  /**
   * Draw the tracking map. opts: {lang, inset, width, grid, cameras:'all'|ids, labels,
   * graph:false|true, record:false|true, axes:true, base:true}.
   * Print mode, for the map details: {pxPerMM, fit: {w, h} in mm}. The canvas is then sized to
   * fit that box on paper, and text, pins and label offsets (given in mm) keep the same
   * printed size whatever the scale of the detail.
   */
  async function drawMap(data, opts) {
    const lang = opts.lang || "es";
    const frameAll = data.map.frame;
    const inset = opts.inset ? data.map.insets[opts.inset] : null;
    const fr = inset ? inset.frame : frameAll;
    const baseImg = opts.base === false ? null : await loadImage(inset ? inset.image[lang] : data.map.image[lang]);
    const k = opts.pxPerMM || 0;
    let W = opts.width || 3000;
    const af = k ? Math.round((opts.axisMM || 2.3) * k) : Math.round(26 * (W / 3000) * (inset ? 1.25 : 1));   // axis font, about 6.5 pt in print
    const margin = opts.axes === false ? { l: 0, r: 0, t: 0, b: 0, af } : { l: Math.round(4.6 * af), r: Math.round(0.9 * af), t: Math.round(0.9 * af), b: Math.round(3.1 * af), af };
    if (k && opts.fit) {
      const aspect = (fr.y1 - fr.y0) / (4 * (fr.x1 - fr.x0));
      W = Math.floor(Math.min(opts.fit.w * k, (opts.fit.h * k - margin.t - margin.b) / aspect + margin.l + margin.r));
    }
    const innerW = W - margin.l - margin.r;
    const sx = innerW / (fr.x1 - fr.x0), sy = sx / 4;
    const innerH = Math.round((fr.y1 - fr.y0) * sy);
    const c = document.createElement("canvas");
    c.width = W; c.height = innerH + margin.t + margin.b;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    const X = (x) => margin.l + (x - fr.x0) * sx;
    const Y = (y) => margin.t + (fr.y1 - y) * sy;
    ctx.save();
    ctx.beginPath(); ctx.rect(margin.l, margin.t, innerW, innerH); ctx.clip();
    if (baseImg) ctx.drawImage(baseImg, margin.l, margin.t, innerW, innerH);
    const u = k ? k * 0.0903 : W / 3000 * (inset ? 1.25 : 1);   // 0.0903 mm per px: the full map in print
    if (opts.grid !== false) {
      ctx.lineWidth = 1.2 * u;
      for (let x = Math.ceil(fr.x0 * 4) / 4; x <= fr.x1; x += 0.25) {
        const major = Math.abs(x - Math.round(x)) < 1e-9;
        if (!major && !inset) continue;
        ctx.strokeStyle = major ? MAP_COLORS.gridStrong : MAP_COLORS.grid;
        ctx.beginPath(); ctx.moveTo(X(x), margin.t); ctx.lineTo(X(x), margin.t + innerH); ctx.stroke();
      }
      const stepY = inset ? 0.5 : 2;
      for (let y = Math.ceil(fr.y0 / stepY) * stepY; y <= fr.y1; y += stepY) {
        const major = Math.abs(y / (inset ? 1 : 2) - Math.round(y / (inset ? 1 : 2))) < 1e-9;
        ctx.strokeStyle = major ? MAP_COLORS.gridStrong : MAP_COLORS.grid;
        ctx.beginPath(); ctx.moveTo(margin.l, Y(y)); ctx.lineTo(margin.l + innerW, Y(y)); ctx.stroke();
      }
    }
    if (opts.graph) drawGraph(ctx, data, X, Y, fr, u, opts);
    if (opts.cameras) drawCameras(ctx, data, X, Y, fr, u, opts);
    ctx.restore();
    if (opts.axes !== false) drawAxes(ctx, X, Y, fr, margin, innerW, innerH, lang, inset, Boolean(opts.graph), opts.axisNames !== false);
    return c;
  }

  /**
   * Frame, ticks and axis names. The plain map is geography: columns (west to east) and
   * cotas / northings (south to north). Once the graph of f is drawn, the phase 2 model
   * reads column t as the instant t, and the names say so.
   */
  function drawAxes(ctx, X, Y, fr, margin, innerW, innerH, lang, inset, graph, withNames) {
    const af = margin.af;
    const en = lang === "en";
    const names = graph
      ? [en ? "column = t (minutes)" : "columna = t (minutos)", en ? "northing = f(t)" : "cota = f(t)"]
      : [en ? "column" : "columna", en ? "northing" : "cota"];
    ctx.strokeStyle = "#202a3d"; ctx.lineWidth = Math.max(2, af / 12);
    ctx.strokeRect(margin.l, margin.t, innerW, innerH);
    ctx.fillStyle = "#202a3d";
    ctx.font = `600 ${af}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    const tick = Math.round(af * 0.32);
    const stepX = inset ? 0.25 : 1;
    for (let x = Math.ceil(fr.x0 / stepX - 1e-9) * stepX; x <= fr.x1 + 1e-9; x += stepX) {
      ctx.beginPath(); ctx.moveTo(X(x), margin.t + innerH); ctx.lineTo(X(x), margin.t + innerH + tick); ctx.stroke();
      const lbl = Number.isInteger(Math.round(x * 100) / 100) ? String(Math.round(x)) : fmtNum(x, 2);
      ctx.fillText(lbl, X(x), margin.t + innerH + tick + af * 0.15);
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    const stepY = inset ? 0.5 : 2;
    for (let y = Math.ceil(fr.y0 / stepY - 1e-9) * stepY; y <= fr.y1 + 1e-9; y += stepY) {
      ctx.beginPath(); ctx.moveTo(margin.l - tick, Y(y)); ctx.lineTo(margin.l, Y(y)); ctx.stroke();
      ctx.fillText(inset ? fmtNum(y, 1) : String(y), margin.l - tick - af * 0.2, Y(y));
    }
    if (!withNames) return;   // the transparency: its names would print over the map's
    ctx.font = `italic 600 ${af}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
    ctx.fillText(names[0], margin.l + innerW, margin.t + innerH + af * 2.75);
    ctx.save();
    ctx.translate(af * 0.62, margin.t + innerH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(names[1], 0, 0);
    ctx.restore();
  }

  function drawCameras(ctx, data, X, Y, fr, u, opts) {
    const ids = opts.cameras === "all" ? data.cameras.map((c) => c.id) : opts.cameras;
    const labels = opts.labels || {};
    const k = opts.pxPerMM || 0;                                   // print mode: offsets and sizes in mm
    const unit = k || u * (opts.labelScale || 1);
    const fontPx = k ? (opts.labelMM || 2.9) * k : 17 * u * (opts.labelScale || 1);
    ids.forEach((id) => {
      const cam = data.camera[id];
      if (cam.x < fr.x0 || cam.x > fr.x1 || cam.y < fr.y0 || cam.y > fr.y1) return;
      const x = X(cam.x), y = Y(cam.y);
      const r = k ? (opts.pinMM || 1.05) * k : 9 * u * (opts.pinScale || 1);
      ctx.beginPath(); ctx.arc(x, y, r + 2.5 * u, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = MAP_COLORS.pin; ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - r * 0.45, y - r * 0.28, r * 0.62, r * 0.56);
      ctx.beginPath(); ctx.moveTo(x + r * 0.17, y); ctx.lineTo(x + r * 0.55, y - r * 0.28); ctx.lineTo(x + r * 0.55, y + r * 0.28); ctx.fill();
      const lab = labels[id];
      if (lab === false) return;
      const [dx, dy] = lab || (k ? [2.2, -2.2] : [14, -14]);
      ctx.font = `700 ${Math.round(fontPx)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = dx >= 0 ? "left" : "right"; ctx.textBaseline = "middle";
      const tx = x + dx * unit, ty = y + dy * unit;
      if (k ? Math.abs(dx) > 3 || Math.abs(dy) > 3 : Math.abs(dx) > 20 || Math.abs(dy) > 20) {   // leader line
        ctx.strokeStyle = "rgba(32,42,61,0.7)"; ctx.lineWidth = 1.2 * u;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx - Math.sign(dx) * 3 * u, ty); ctx.stroke();
      }
      ctx.lineWidth = 5 * u; ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineJoin = "round";
      ctx.strokeText(id, tx, ty);
      ctx.fillStyle = "#202a3d"; ctx.fillText(id, tx, ty);
    });
  }

  function drawGraph(ctx, data, X, Y, fr, u, opts) {
    const lw = 4.2 * u;
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const stroke = (pts, colour, width, dash) => {
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = width + 4 * u; ctx.setLineDash([]);
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke();
      ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke();
      ctx.setLineDash([]);
    };
    const pxPerMin = X(1) - X(0);
    data.model.pieces.forEach((p) => {
      const pts = [];
      const a = p.from, b = p.kind === "osc" ? p.to - 0.0004 : p.kind === "pole" ? Math.min(p.to - 0.0005, fr.x1) : p.to;
      let t = a;
      while (t <= b) {
        const v = pieceValue(p, t);
        if (v > fr.y1 + 5) break;
        pts.push([t, v]);
        const step = p.kind === "osc" ? Math.max(0.15 / pxPerMin, Math.pow(p.p - t, 2) / 120) : p.kind === "pole" ? Math.max(0.3 / pxPerMin, Math.pow(p.p - t, 2) / 60) : (b - a) / 200;
        t += step;
      }
      pts.push([b, pieceValue(p, b)]);
      stroke(pts, MAP_COLORS.graph, lw);
    });
    // asymptote and accumulation band
    stroke([[12, fr.y0], [12, fr.y1]], MAP_COLORS.graph, 1.8 * u, [10 * u, 8 * u]);
    ctx.fillStyle = "rgba(18,99,168,0.55)";
    ctx.fillRect(X(9.996), Y(12), Math.max(1.5 * u, X(10) - X(9.996)), Y(10) - Y(12));
    const dot = (x, y, filled, colour) => {
      ctx.beginPath(); ctx.arc(X(x), Y(y), 7.5 * u, 0, Math.PI * 2);
      ctx.fillStyle = filled ? (colour || MAP_COLORS.graph) : "#ffffff"; ctx.fill();
      ctx.lineWidth = 3 * u; ctx.strokeStyle = colour || MAP_COLORS.graph; ctx.stroke();
    };
    dot(8, 10, false); dot(8, 12, true); dot(10, 12, true); dot(0, 0, true);
    if (opts.record) {
      data.model.recordOverrides.forEach((o) => {
        const fv = modelValue(data, o.t);
        if (Math.abs(fv - o.value) > 1e-9 && o.t !== 8) dot(o.t, fv, false);
        dot(o.t, o.value, true, MAP_COLORS.record);
      });
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ formula images
  /*
   * Tiny TeX-like layout for the PDFs (jsPDF's built-in fonts cannot print
   * symbols such as π, ∞, → or ≤). Supported: \frac{}{}, ^{} , _{} , \lim_{},
   * \pi \infty \to \le \ge \ne \cdot \sin \, \quad, \text{}, \left( \right),
   * \cases{expr & cond \\ expr & cond}.
   */
  function formulaImage(tex, opts = {}) {
    const size = opts.size || 44;
    const scale = opts.scale || 2;
    const serif = '"STIX Two Math", "STIX Two Text", "Cambria Math", "Times New Roman", Times, serif';
    const meas = document.createElement("canvas").getContext("2d");
    const SYM = { "\\pi": "π", "\\infty": "∞", "\\to": "→", "\\le": "≤", "\\ge": "≥", "\\ne": "≠", "\\cdot": "·", "\\in": "∈", "\\,": " ", "\\quad": "   ", "\\pm": "±", "\\neq": "≠", "\\lt": "<", "\\gt": ">", "\\infin": "∞" };
    const FUN = ["\\sin", "\\cos", "\\lim"];
    let i = 0;
    function group() {
      if (tex[i] === "{") {
        i += 1; const box = list("}"); i += 1; return box;
      }
      return atom();
    }
    function readCmd() {
      let j = i + 1;
      if (/[^a-zA-Z]/.test(tex[j])) return tex.slice(i, j + 1);
      while (j < tex.length && /[a-zA-Z]/.test(tex[j])) j += 1;
      return tex.slice(i, j);
    }
    function atom() {
      const ch = tex[i];
      if (ch === "\\") {
        const cmd = readCmd(); i += cmd.length;
        if (cmd === "\\frac") { const n = group(); const den = group(); return { t: "frac", n, den }; }
        if (cmd === "\\text") { const s = tex.slice(i + 1, tex.indexOf("}", i)); i = tex.indexOf("}", i) + 1; return { t: "txt", s, it: false }; }
        if (cmd === "\\left" || cmd === "\\right") { const s = tex[i]; i += 1; return { t: "txt", s, it: false, big: true }; }
        if (cmd === "\\cases") {
          i += 1; const rows = [];
          let row = [list("&|\\\\|}")];
          while (tex[i] !== "}") {
            if (tex[i] === "&") { i += 1; row.push(list("&|\\\\|}")); } else if (tex.slice(i, i + 2) === "\\\\") { i += 2; rows.push(row); row = [list("&|\\\\|}")]; }
          }
          rows.push(row); i += 1;
          return { t: "cases", rows };
        }
        if (FUN.includes(cmd)) return { t: "txt", s: cmd.slice(1), it: false, op: cmd === "\\lim", fn: true };
        const rel = ["\\le", "\\ge", "\\ne", "\\neq", "\\to", "\\in", "\\lt", "\\gt"].includes(cmd);
        return { t: "txt", s: SYM[cmd] || cmd.slice(1), it: false, sym: true, rel };
      }
      i += 1;
      if (/[a-zA-Z]/.test(ch)) return { t: "txt", s: ch, it: true };
      if ("+-=<>".includes(ch)) return { t: "txt", s: ch === "-" ? "−" : ch, it: false, rel: true };
      if (ch === " ") return null;
      return { t: "txt", s: ch, it: false };
    }
    function list(stop) {
      const stops = stop ? stop.split("|") : [];
      const items = [];
      while (i < tex.length && !stops.some((s) => tex.startsWith(s, i))) {
        let a = atom();
        if (!a) continue;
        while (tex[i] === "^" || tex[i] === "_") {
          const kind = tex[i]; i += 1; const g = group();
          a = { t: kind === "^" ? "sup" : "sub", base: a, s: g };
        }
        items.push(a);
      }
      return { t: "row", items };
    }
    const tree = list();
    function layout(node, sz) {
      if (node.t === "txt") {
        const fsz = node.big ? sz * 1.5 : sz;
        meas.font = `${node.it ? "italic " : ""}${fsz}px ${serif}`;
        const pad = node.rel ? sz * 0.28 : 0;
        const w = meas.measureText(node.s).width + 2 * pad + (node.fn ? sz * 0.18 : 0);
        return { ...node, w, a: sz * (node.big ? 0.95 : 0.72), d: sz * (node.big ? 0.45 : 0.24), sz, fsz, pad };
      }
      if (node.t === "row") {
        const kids = node.items.map((k) => layout(k, sz));
        return { t: "row", kids, w: kids.reduce((s, k) => s + k.w, 0), a: Math.max(sz * 0.72, ...kids.map((k) => k.a)), d: Math.max(sz * 0.24, ...kids.map((k) => k.d)), sz };
      }
      if (node.t === "frac") {
        const n = layout(node.n, sz * 0.8), den = layout(node.den, sz * 0.8);
        const w = Math.max(n.w, den.w) + sz * 0.3;
        return { t: "frac", n, den, w, a: n.a + n.d + sz * 0.42, d: den.a + den.d - sz * 0.12, sz };
      }
      if (node.t === "sup" || node.t === "sub") {
        const base = layout(node.base, sz), s = layout(node.s, sz * 0.62);
        if (node.t === "sub" && node.base.op) {
          return { t: "under", base, s, w: Math.max(base.w, s.w), a: base.a, d: base.d + s.a + s.d + sz * 0.05, sz };
        }
        return { t: node.t, base, s, w: base.w + s.w + sz * 0.1, a: node.t === "sup" ? Math.max(base.a, sz * 0.45 + s.a) : base.a, d: node.t === "sub" ? Math.max(base.d, sz * 0.2 + s.d) : base.d, sz };
      }
      if (node.t === "cases") {
        const rows = node.rows.map((r) => r.map((cell) => layout(cell, sz)));
        const colW = [0, 1].map((k) => Math.max(...rows.map((r) => (r[k] ? r[k].w : 0))));
        const heights = rows.map((r) => Math.max(sz * 1.25, ...r.map((cell) => cell.a + cell.d + sz * 0.35)));
        const h = heights.reduce((s, v) => s + v, 0);
        return { t: "cases", rows, colW, heights, w: sz * 0.7 + colW[0] + sz * 1.2 + colW[1], a: h / 2 + sz * 0.25, d: h / 2 - sz * 0.25, sz };
      }
      return { w: 0, a: 0, d: 0 };
    }
    function draw(ctx, b, x, y) {
      if (b.t === "txt") {
        ctx.font = `${b.it ? "italic " : ""}${b.fsz || b.sz}px ${serif}`;
        ctx.fillText(b.s, x + b.pad, y + (b.big ? b.sz * 0.12 : 0));
      } else if (b.t === "row") {
        let cx = x; b.kids.forEach((k) => { draw(ctx, k, cx, y); cx += k.w; });
      } else if (b.t === "frac") {
        const mid = y - b.sz * 0.3;
        ctx.fillRect(x + b.sz * 0.08, mid - b.sz * 0.03, b.w - b.sz * 0.16, Math.max(1.5, b.sz * 0.05));
        draw(ctx, b.n, x + (b.w - b.n.w) / 2, mid - b.sz * 0.12 - b.n.d);
        draw(ctx, b.den, x + (b.w - b.den.w) / 2, mid + b.sz * 0.12 + b.den.a);
      } else if (b.t === "sup") {
        draw(ctx, b.base, x, y); draw(ctx, b.s, x + b.base.w + b.sz * 0.08, y - b.sz * 0.42);
      } else if (b.t === "sub") {
        draw(ctx, b.base, x, y); draw(ctx, b.s, x + b.base.w + b.sz * 0.03, y + b.sz * 0.22);
      } else if (b.t === "under") {
        draw(ctx, b.base, x + (b.w - b.base.w) / 2, y); draw(ctx, b.s, x + (b.w - b.s.w) / 2, y + b.base.d + b.s.a + b.sz * 0.02);
      } else if (b.t === "cases") {
        const top = y - b.a + b.sz * 0.1, h = b.a + b.d - b.sz * 0.1;
        ctx.save(); ctx.lineWidth = Math.max(1.6, b.sz * 0.06); ctx.strokeStyle = ctx.fillStyle;
        const bx = x + b.sz * 0.42, q = b.sz * 0.22;
        ctx.beginPath();
        ctx.moveTo(bx + q, top); ctx.quadraticCurveTo(bx, top, bx, top + q);
        ctx.lineTo(bx, top + h / 2 - q); ctx.quadraticCurveTo(bx, top + h / 2, bx - q, top + h / 2);
        ctx.quadraticCurveTo(bx, top + h / 2, bx, top + h / 2 + q);
        ctx.lineTo(bx, top + h - q); ctx.quadraticCurveTo(bx, top + h, bx + q, top + h);
        ctx.stroke(); ctx.restore();
        let acc = top;
        b.rows.forEach((r, k) => {
          const rowA = Math.max(...r.map((cell) => cell.a)), rowD = Math.max(...r.map((cell) => cell.d));
          const ry = acc + (b.heights[k] - rowA - rowD) / 2 + rowA;
          acc += b.heights[k];
          if (r[0]) draw(ctx, r[0], x + b.sz * 0.7, ry);
          if (r[1]) draw(ctx, r[1], x + b.sz * 0.7 + b.colW[0] + b.sz * 1.2, ry);
        });
      }
    }
    const box = layout(tree, size);
    const padX = size * 0.2, padY = size * 0.25;
    const c = document.createElement("canvas");
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

  /** Decimal point in both languages, as in the book; values are small, so no grouping. */
  function fmtNum(x, d) {
    const clean = Math.round(x * 1e9) / 1e9;   // 1.95 * 1.95 must print like the register's 3.8025
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0, useGrouping: false }).format(clean);
  }

  window.DeltaCity = {
    loadData, loadImage, url, modelValue, recordValue, pieceValue,
    normalizePlate, confusablePlate, plateDistance, checkPlates, renderPlate,
    homography, compositePlate, composePhoto, plateCrop, noImageFrame, clockAt, drawMap, formulaImage, fmtNum
  };
})();
