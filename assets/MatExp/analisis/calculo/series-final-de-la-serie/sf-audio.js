/*
 * Calculus Cases · Case 7 · The Series Finale — trailer score.
 *
 * A synthesised score (WebAudio, no samples) whose events come from the same series as the
 * pictures: the cold-open beeps sound at the instants t_n of the team's countdown, the echo pings
 * at the rings Irene crosses with volume r^k, the probe ticks slow down like 1/n, the log types its
 * lines, the dosimeters click faster with the dose and the alarm sounds at the crossing minute,
 * and the beacon's tones swing left and right with the sign of each term. events() is pure and is
 * tested in Node; start() plays them from a given time and can feed a MediaStream for export.
 */
(function (root) {
  "use strict";
  const TR = root.SFTrailer || (typeof require === "function" ? require("./sf-trailer.js") : null);
  const M = root.SFMath || (typeof require === "function" ? require("./sf-math.js") : null);

  /** The score as a list of timed events (seconds from the start of the trailer). */
  function events(SF, cfg) {
    const tl = TR.timeline(SF, cfg), ev = [];
    const seg = (id) => tl.find((s) => s.id === id);
    const add = (t, type, o = {}) => ev.push(Object.assign({ t, type }, o));
    const mood = (cfg.art && cfg.art.mood) || "drone";
    // bed: a drone per act, braams at the act changes
    tl.forEach((s, k) => { add(s.t0, "bed", { dur: s.dur, act: k, mood }); if (k && s.id !== "S7") add(s.t0, "braam", { gain: 0.5 + 0.05 * k }); });
    // S0: the countdown, beep by beep until they are closer than a frame
    const s0 = seg("S0");
    TR.LISTS.S0(cfg.math.S0, s0.dur, s0.dur).beeps.forEach((b, n) => add(s0.t0 + b, "beep", { gain: 0.35 + 0.4 * (n / 30) }));
    add(s0.t0 + cfg.math.S0.T, "hit", { gain: 1 });
    // S2: an echo ping for each ring Irene crosses
    const s2 = seg("S2"), p2 = cfg.math.S2;
    if (M.geometric.converges(p2.r) && p2.r > 0) {
      const S = M.geometric.sum(p2.a, p2.r);
      M.geometric.positions(p2.a, p2.r, 14).forEach((x, k) => {
        const u = x / S; // Irene runs with an eased motion over the shot; invert approximately
        const t = s2.t0 + 1 + Math.acos(1 - 2 * Math.min(1, u)) / Math.PI * (s2.dur - 3);
        if (t < s2.t1 - 1.8) add(t, "ping", { gain: 0.5 * Math.pow(p2.r, k), pan: 0 });
      });
    }
    // S3: the probe ticks once per displayed minute; their spacing grows like 1/n (log clock)
    const s3 = seg("S3");
    let last = -1;
    for (let k = 0; k < 60; k++) {
      const u = k / 60, n = Math.max(1, Math.round(Math.pow(360, u)));
      if (n !== last) { add(s3.t0 + 0.5 + u * (s3.dur - 3), "tick", { gain: 0.25 / Math.sqrt(n) + 0.05 }); last = n; }
    }
    // S4: one keystroke burst per log line
    const s4 = seg("S4");
    for (let k = 0; k < 9; k++) add(s4.t0 + 0.8 + (k / 9) * (s4.dur - 4), "type", { gain: 0.25 });
    // S5: Geiger clicks whose rate follows the dose of the minute; alarm at Sara's crossing
    const s5 = seg("S5"), p5 = cfg.math.S5;
    for (let n = 1; n <= 12; n++) {
      const t0 = s5.t0 + 0.6 + ((n - 1) / 12) * (s5.dur - 3), rate = 6 + 30 * (p5.D / Math.pow(n, p5.pS));
      for (let j = 0; j < Math.round(rate * (s5.dur - 3) / 12 / 4); j++) add(t0 + j * 4 / rate, "click", { gain: 0.15 });
      if (M.pseries.crossing(p5.D, p5.pS, 2, 100) === n) add(t0, "alarm", { dur: Math.min(3, s5.t1 - t0 - 1.8) });
    }
    // S6: the beacon, a tone per swing panned by the sign of the term, quieter as it settles
    const s6 = seg("S6"), p6 = cfg.math.S6;
    for (let k = 1; k <= 14; k++) add(s6.t0 + 0.5 + ((k - 1) / 14) * (s6.dur - 2.5), "tone", { gain: 0.4 * Math.min(1, M.alternating.b(p6, k) / M.alternating.b(p6, 1)) + 0.05, pan: k % 2 ? 0.8 : -0.8 });
    // S7: the montage on the countdown, then silence and a last beep under the title
    const s7 = seg("S7");
    M.countdown.times(cfg.math.S0, { until: cfg.math.S0.T, minGap: 1 / 30, max: 40 }).forEach((b) => add(s7.t0 + (b / cfg.math.S0.T) * s7.dur * 0.45, "beep", { gain: 0.5 }));
    add(s7.t0 + s7.dur * 0.75, "hit", { gain: 1 });
    add(s7.t1 - 1.2, "beep", { gain: 0.6 });
    return ev.sort((a, b) => a.t - b.t);
  }

  // ------------------------------------------------------------------------ playback
  let CTX = null, MASTER = null, DEST = null;
  function context() {
    if (!CTX) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      CTX = new AC();
      MASTER = CTX.createGain(); MASTER.gain.value = 0.8;
      const comp = CTX.createDynamicsCompressor();
      MASTER.connect(comp); comp.connect(CTX.destination);
      MASTER._comp = comp;
    }
    return CTX;
  }
  function streamDestination() {
    const ctx = context();
    if (!ctx || !ctx.createMediaStreamDestination) return null;
    if (!DEST) { DEST = ctx.createMediaStreamDestination(); MASTER._comp.connect(DEST); }
    return DEST;
  }
  function voice(ctx, e, when, out) {
    const g = ctx.createGain(); g.connect(out);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = e.pan || 0; pan.connect(g); }
    const target = pan || g;
    const env = (a, d, peak) => { g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + a); g.gain.exponentialRampToValueAtTime(0.0001, when + a + d); };
    const osc = (type, f, dur, fEnd) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, when); if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, when + dur); o.connect(target); o.start(when); o.stop(when + dur + 0.05); return o; };
    const noise = (dur, filterF) => {
      const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = b;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = filterF; f.Q.value = 1.2;
      s.connect(f); f.connect(target); s.start(when); return s;
    };
    switch (e.type) {
      case "beep": env(0.005, 0.09, e.gain); osc("sine", 1320, 0.1); break;
      case "ping": env(0.01, 1.2, e.gain); osc("sine", 880, 1.2, 760); osc("triangle", 1760, 0.6); break;
      case "tick": env(0.002, 0.05, e.gain); osc("square", 2400, 0.05); break;
      case "type": env(0.002, 0.25, e.gain); noise(0.25, 3200); break;
      case "click": env(0.001, 0.02, e.gain); noise(0.02, 5000); break;
      case "alarm": env(0.02, e.dur || 2, 0.35); { const o = osc("sawtooth", 620, e.dur || 2); const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 6; lg.gain.value = 120; lfo.connect(lg); lg.connect(o.frequency); lfo.start(when); lfo.stop(when + (e.dur || 2)); } break;
      case "tone": env(0.03, 0.8, e.gain); osc("sine", 440, 0.8); osc("sine", 660, 0.6); break;
      case "hit": env(0.005, 2.6, e.gain); osc("sine", 55, 2.6, 30); noise(0.8, 180); break;
      case "braam": env(0.08, 2.2, 0.4 * e.gain); osc("sawtooth", 49, 2.2, 46); osc("sawtooth", 49.6, 2.2, 46.4); break;
      case "bed": {
        const dur = e.dur, base = [55, 58.3, 61.7, 55, 65.4, 49, 58.3, 41.2][e.act % 8];
        g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.12, when + Math.min(1.5, dur / 3)); g.gain.setValueAtTime(0.12, when + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = e.mood === "pulse" ? 900 : 500; f.connect(target);
        [base, base * 1.5, base * 2.01].forEach((fr) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.connect(f); o.start(when); o.stop(when + dur + 0.1); });
        if (e.mood === "pulse") { const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 2; lg.gain.value = 0.06; lfo.connect(lg); lg.connect(g.gain); lfo.start(when); lfo.stop(when + dur); }
        break;
      }
      default: break;
    }
  }
  /** Play the score from time t0 (seconds). Returns {stop()}. */
  function start(SF, cfg, t0 = 0) {
    const ctx = context();
    if (!ctx) return { stop() {} };
    if (ctx.state === "suspended") ctx.resume();
    const bus = ctx.createGain(); bus.connect(MASTER);
    const now = ctx.currentTime + 0.05;
    events(SF, cfg).forEach((e) => {
      if (e.type === "bed") {
        if (e.t + e.dur <= t0) return;
        const off = Math.max(0, t0 - e.t);
        voice(ctx, Object.assign({}, e, { dur: e.dur - off }), now + Math.max(0, e.t - t0), bus);
      } else if (e.t >= t0) voice(ctx, e, now + (e.t - t0), bus);
    });
    return { stop() { try { bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime); bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08); setTimeout(() => bus.disconnect(), 150); } catch (e) { /* closed */ } } };
  }

  /**
   * The whole score rendered offline (no speakers, no real time), for the pre-rendered trailer
   * the teacher can download: an OfflineAudioContext plays every event and returns the buffer.
   */
  async function renderOffline(SF, cfg, seconds, rate = 48000) {
    const OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!OAC) throw new Error("OfflineAudioContext");
    const ctx = new OAC(2, Math.ceil(seconds * rate), rate);
    const master = ctx.createGain(); master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    events(SF, cfg).forEach((e) => { if (e.t < seconds) voice(ctx, e, e.t, master); });
    return ctx.startRendering();
  }
  /** 16-bit PCM WAV of an AudioBuffer. */
  function wav(buffer) {
    const ch = buffer.numberOfChannels, n = buffer.length, rate = buffer.sampleRate;
    const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); out.setUint32(4, 36 + n * ch * 2, true); str(8, "WAVE"); str(12, "fmt ");
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, rate, true);
    out.setUint32(28, rate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); str(36, "data"); out.setUint32(40, n * ch * 2, true);
    const data = Array.from({ length: ch }, (_, c) => buffer.getChannelData(c));
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([out.buffer], { type: "audio/wav" });
  }

  root.SFAudio = { events, start, streamDestination, renderOffline, wav };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SFAudio;
})(typeof window !== "undefined" ? window : globalThis);
