/*
 * Calculus Cases · Case 7 · The Series Finale — the students' investigation and editing room.
 *
 * Mounts into <div id="sf-room" data-lang="es|en">. Loads only public data (the finale, the cards
 * and the solution are never present); the second-session envelope arrives as a package that the
 * teacher hands out. Tabs: case file (package, team, documents), exercises (validated answers),
 * series lab, editing room (trailer parameters and player, video export), festival (compare
 * versions) and accusation. Work is kept in this browser and can be exported as a JSON file.
 */
(function () {
  "use strict";
  const host = document.getElementById("sf-room");
  if (!host) return;
  const SF = window.SFData, M = window.SFMath, E = window.SFEvidence, V = window.SFValidate, TEX = window.SFTex, TR = window.SFTrailer, A = window.SFAudio, B = window.SFBuild;
  const LANG = (host.dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es";
  const t = (es, en) => (LANG === "en" ? en : es);
  const L = (o) => (o == null ? "" : typeof o === "object" && !Array.isArray(o) ? (o[LANG] != null ? o[LANG] : o.es) : o);
  const KEY = "sf-room-v1";
  const WORK = "calculus-cases/series-finale-work";

  // ------------------------------------------------------------------------ state
  const state = {
    cfg: B.normalize({ lang: LANG }), pkgName: null, envelope: null,
    team: { name: "", members: "", episodes: [] },
    answers: {}, results: {},
    trailer: TR.defaultConfig(SF),
    accusation: {}, pins: [],
    festival: [],
    pool: { values: {}, findings: {} },   // the closing class: each group's shot and finding
  };
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ cfg: state.cfg, pkgName: state.pkgName, team: state.team, answers: state.answers, results: state.results, trailer: state.trailer, accusation: state.accusation, pool: state.pool })); } catch (e) { /* storage unavailable */ } }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s) Object.assign(state, s, { cfg: B.normalize(Object.assign({}, s.cfg, { lang: LANG })), trailer: Object.assign(TR.defaultConfig(SF), s.trailer || {}), pool: s.pool || { values: {}, findings: {} } });
    } catch (e) { /* ignore */ }
  }
  const ctx = () => E.context(SF, { render: state.cfg.investigation.render, leakR: state.cfg.investigation.suiteRatio });

  // ------------------------------------------------------------------------ DOM helpers
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") el.className = v; else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? "" : v);
    });
    kids.flat().forEach((c) => { if (c == null || c === false) return; el.append(c instanceof Node ? c : document.createTextNode(String(c))); });
    return el;
  }
  const rich = (s) => { const span = h("span", { class: "sf-rich", html: TEX.html(L(s)) }); fillDisplays(span); return span; };
  function fillDisplays(root) {
    root.querySelectorAll(".sf-display").forEach((el) => {
      const img = TEX.image(el.dataset.tex, { size: 34, scale: 2 });
      img.canvas.style.width = `${img.width * 0.6}px`; img.canvas.style.display = "block"; img.canvas.style.margin = "6px auto";
      el.replaceWith(img.canvas);
    });
  }
  function formula(tex, size = 30) { const r = TEX.image(tex, { size, scale: 2 }); r.canvas.style.width = `${r.width * 0.62}px`; r.canvas.className = "sf-formula"; return r.canvas; }
  function download(name, blob) { const a = h("a", { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
  const badge = (kind) => h("span", { class: `sf-badge sf-${kind}` }, { exact: t("exacto", "exact"), proved: t("demostrado", "proved"), computed: t("calculado", "computed"), known: t("valor conocido", "known value"), visual: t("solo dibujo", "drawing only"), approx: t("aproximado", "approximate"), review: t("revisión docente", "teacher review") }[kind] || kind);

  // ------------------------------------------------------------------------ layout
  const TABS = [
    ["pool", t("Puesta en común", "Pooling")], ["file", t("Expediente", "Case file")], ["exercises", t("Ejercicios", "Exercises")], ["lab", t("Laboratorio de series", "Series lab")],
    ["edit", t("Sala de montaje", "Editing room")], ["festival", t("Festival", "Festival")], ["accuse", t("Acusación", "Accusation")],
  ];
  let current = "pool";
  const bar = h("div", { class: "sf-tabbar", role: "tablist" });
  const panel = h("div", { class: "sf-panel" });
  const status = h("div", { class: "sf-status", role: "status", "aria-live": "polite" });
  host.append(h("header", { class: "sf-head" }, h("h2", {}, t("Sala de investigación y montaje · ZENO", "Investigation and editing room · ZENO")), status), bar, panel);
  function setStatus(msg) { status.textContent = msg || ""; }
  function render() {
    bar.innerHTML = "";
    TABS.forEach(([id, label]) => bar.append(h("button", { type: "button", role: "tab", "aria-selected": String(id === current), class: "sf-tab", onclick: () => { current = id; render(); } }, label)));
    panel.innerHTML = "";
    stopPlayers();
    VIEWS[current](panel);
  }
  const players = [];
  function stopPlayers() { players.splice(0).forEach((p) => p.pause()); }

  // ------------------------------------------------------------------------ views
  const VIEWS = {};

  // ------------------------------------------------------------------------ pooling (closing class)
  /**
   * The closing class starts here, on one projected computer: each group states its finding and
   * dictates the values of its shot; the room checks them against the scene's rules and builds
   * the class trailer. Shots of episodes no group worked on keep the official values.
   */
  VIEWS.pool = function (root) {
    const room = state.cfg.classroom, P = state.pool;
    const official = TR.defaultConfig(SF);
    let dirty = false;   // a value changed since the class trailer was built
    const classTrailer = () => {
      const c = TR.defaultConfig(SF);
      Object.keys(FAMILIES).forEach((id) => { const v = P.values[id]; if (v && TR.checkShot(id, v, state.cfg.constraints).ok) c.math[id] = Object.assign({}, v); });
      return c;
    };
    root.append(h("section", { class: "sf-card" },
      h("h3", {}, t("La puesta en común", "The pooling")),
      h("p", {}, t("Cada grupo dice su hallazgo y dicta los valores de su plano. La sala los comprueba con las reglas de la escena y monta el tráiler de la clase; los planos que no se completan conservan los valores oficiales.", "Each group states its finding and dictates the values of its shot. The room checks them against the scene's rules and builds the class trailer; shots left incomplete keep the official values.")),
      h("div", { class: "sf-grid2" },
        h("label", {}, t("Estudiantes de la clase", "Students in the class"), h("input", { type: "number", min: 9, max: 40, value: state.cfg.students, onchange: (e) => { state.cfg = B.normalize(Object.assign({}, state.cfg, { students: Number(e.target.value) })); save(); render(); } })),
        h("div", {}, fileButton(t("Cargar el paquete de la clase", "Load the class package"), (text) => {
          const res = B.importPackage(text);
          if (!res.ok) return setStatus(L(res.error));
          state.cfg = B.normalize(Object.assign({}, res.cfg, { lang: LANG })); state.pkgName = res.pkg.created.slice(0, 16).replace("T", " ");
          setStatus([t("Paquete cargado.", "Package loaded."), ...res.warnings.map(L)].join(" ")); save(); render();
        }), h("p", { class: "sf-help" }, state.pkgName ? t(`Paquete: ${state.pkgName}.`, `Package: ${state.pkgName}.`) : t("Sin paquete: los grupos salen del número de estudiantes.", "No package: the groups come from the number of students."))))));
    room.groups.forEach((g, gi) => {
      const D = SF.dossiers.find((d) => d.episode === g.episode), ep = SF.show.episodes.find((e) => e.id === g.episode);
      const card = h("section", { class: "sf-card sf-pool-group" }, h("h3", {}, `${t("Grupo", "Group")} ${gi + 1} · ${t("episodio", "episode")} ${g.episode} · ${L(ep.title)}`),
        h("label", { class: "sf-field" }, t("Hallazgo de la prueba forense (una frase)", "Finding of the forensic exhibit (one sentence)"),
          h("textarea", { rows: 2, oninput: (e) => { P.findings[g.episode] = e.target.value; save(); } }, P.findings[g.episode] || "")));
      D.challenge.segments.forEach((sid) => {
        const F = FAMILIES[sid];
        const p = P.values[sid] = Object.assign({}, official.math[sid], P.values[sid] || {});
        const rules = h("ul", { class: "sf-rules" }), expr = h("div", { class: "sf-expr" });
        const check = () => {
          const chk = TR.checkShot(sid, p, state.cfg.constraints);
          rules.innerHTML = "";
          chk.items.forEach((it) => rules.append(h("li", { class: it.ok ? "sf-ok" : "sf-ko" }, it.ok ? "✓ " : "✗ ", L(it.label))));
          rules.append(h("li", { class: chk.ok ? "sf-ok" : "sf-ko" }, h("strong", {}, chk.ok ? t("Entra en el tráiler de la clase", "Goes into the class trailer") : t("No cumple las reglas: el tráiler usa los valores oficiales", "Breaks the rules: the trailer uses the official values"))));
          expr.innerHTML = ""; expr.append(formula(F.tex(p), 26));
          dirty = true;
        };
        const fields = h("div", { class: "sf-grid2" });
        if (F.forms) fields.append(h("label", {}, t("Forma", "Form"), h("select", { onchange: (e) => { p.form = e.target.value; Object.assign(p, defaultsFor(sid, p.form)); save(); render(); } }, F.forms.map((f) => h("option", { value: f, selected: p.form === f }, f)))));
        F.params(p).forEach(([k, lo, hi, step]) => fields.append(h("label", {}, rich(`$${k === "pS" ? "p_S" : k === "pI" ? "p_I" : k}$`),
          h("input", { type: "number", value: p[k], min: lo, max: hi, step, oninput: (e) => { const x = Number(String(e.target.value).replace(",", ".")); if (isFinite(x)) { p[k] = x; save(); check(); } } }))));
        card.append(h("div", { class: "sf-shot" }, h("h4", {}, `${sid} · ${F.name}`), fields, expr, rules));
        check();
      });
      root.append(card);
    });
    // the class trailer, the official one as a fallback, and the findings to project
    const canvas = h("canvas", { width: 1280, height: 720, class: "sf-player" });
    const env = { SF, lang: LANG, plates: PLATES, audio: { start: (c, t0) => A.start(SF, c, t0), streamDestination: A.streamDestination } };
    let which = "class", player = new TR.Player(canvas, env, classTrailer()); players.push(player);
    const clock = h("span", { class: "sf-clock" }), seek = h("input", { type: "range", min: 0, max: 1000, value: 0, class: "sf-seek" });
    const bind = () => { player.onTime = (tt, d) => { seek.value = Math.round((tt / d) * 1000); clock.textContent = `${tt.toFixed(1)} / ${d.toFixed(1)} s`; }; player.seek(0); };
    seek.addEventListener("input", () => player.seek((seek.value / 1000) * player.duration));
    const swap = (kind) => { player.pause(); which = kind; player = new TR.Player(canvas, env, kind === "class" ? classTrailer() : official); players.push(player); bind(); label.textContent = kind === "class" ? t("Tráiler de la clase", "Class trailer") : t("Tráiler oficial", "Official trailer"); };
    const label = h("strong", {}, t("Tráiler de la clase", "Class trailer"));
    const prog = h("span", { class: "sf-help" });
    root.append(h("section", { class: "sf-card" }, h("h3", {}, t("El tráiler de la clase", "The class trailer")), label, canvas,
      h("div", { class: "sf-controls" },
        h("button", { type: "button", class: "sf-btn", onclick: () => { if (player.playing) return player.pause(); if (which === "class" && dirty) { swap("class"); dirty = false; } player.play(); } }, t("▶ Reproducir / pausa", "▶ Play / pause")), seek, clock,
        h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => canvas.requestFullscreen && canvas.requestFullscreen() }, t("Pantalla completa", "Full screen")),
        h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => swap(which === "class" ? "official" : "class") }, t("Tráiler oficial / de la clase", "Official / class trailer")),
        h("button", { type: "button", class: "sf-btn sf-secondary", onclick: async (e) => {
          const b = e.currentTarget;
          try { b.disabled = true; const r = await player.record((u) => { prog.textContent = `${t("Grabando", "Recording")} ${Math.round(u * 100)} %`; }); download(`zeno_${which === "class" ? t("trailer_de_la_clase", "class_trailer") : t("trailer_oficial", "official_trailer")}.${r.mime.includes("mp4") ? "mp4" : "webm"}`, r.blob); prog.textContent = t("Vídeo exportado.", "Video exported."); }
          catch (err) { prog.textContent = t("Este navegador no puede grabar vídeo: reproducidlo a pantalla completa.", "This browser cannot record video: play it full screen."); }
          finally { b.disabled = false; } } }, t("Exportar vídeo", "Export video")),
        window.CCProjector ? h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => window.CCProjector.open([{
          kicker: t("Calculus Cases · Caso 7 · ZENO", "Calculus Cases · Case 7 · ZENO"), title: t("Los hallazgos de los grupos", "The groups' findings"),
          html: `<table><thead><tr><th>${t("Grupo", "Group")}</th><th>${t("Episodio", "Episode")}</th><th>${t("Hallazgo", "Finding")}</th></tr></thead><tbody>${room.groups.map((g, gi) => `<tr><td>${gi + 1}</td><td>${g.episode} · ${L(SF.show.episodes.find((e) => e.id === g.episode).title)}</td><td>${(P.findings[g.episode] || "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</td></tr>`).join("")}</tbody></table>`,
        }], { lang: LANG }) }, t("Proyectar los hallazgos", "Project the findings")) : null, prog),
      h("p", { class: "sf-help" }, t("Si en clase falla algo o falta tiempo, el tráiler oficial está también ya renderizado en la página del docente.", "If something fails in class or time runs short, the official trailer is also available already rendered on the teacher's page."))));
    bind();
    dirty = false;
  };

  VIEWS.file = function (root) {
    const C = ctx();
    root.append(h("section", { class: "sf-card" },
      h("h3", {}, t("1. El paquete del caso", "1. The case package")),
      h("p", {}, state.pkgName ? t(`Paquete cargado: ${state.pkgName}.`, `Package loaded: ${state.pkgName}.`) : t("Sin paquete: se usa la configuración por defecto del caso. Si el profesor os ha dado un paquete del alumnado (.json), importadlo para que las cifras coincidan con vuestros documentos.", "No package: the case's default configuration is used. If your teacher gave you a student package (.json), import it so that the figures match your documents.")),
      fileButton(t("Importar paquete del alumnado", "Import student package"), async (text) => {
        const res = B.importPackage(text);
        if (!res.ok) return setStatus(L(res.error));
        if (res.pkg.kind !== "student") return setStatus(t("Ese paquete no es para el alumnado.", "That package is not for students."));
        state.cfg = B.normalize(Object.assign({}, res.cfg, { lang: LANG })); state.pkgName = res.pkg.created.slice(0, 16).replace("T", " ");
        setStatus([t("Paquete importado.", "Package imported."), ...res.warnings.map(L)].join(" ")); save(); render();
      })));
    const eps = SF.show.episodes.filter((e) => state.cfg.episodes.includes(e.id));
    root.append(h("section", { class: "sf-card" },
      h("h3", {}, t("2. Vuestro equipo", "2. Your team")),
      h("div", { class: "sf-grid2" },
        h("label", {}, t("Nombre del equipo", "Team name"), h("input", { type: "text", value: state.team.name, oninput: (e) => { state.team.name = e.target.value; save(); } })),
        h("label", {}, t("Integrantes", "Members"), h("input", { type: "text", value: state.team.members, oninput: (e) => { state.team.members = e.target.value; save(); } }))),
      h("p", {}, t("Episodio del grupo:", "The group's episode:")),
      h("div", { class: "sf-checks" }, eps.map((ep) => h("label", {}, h("input", { type: "radio", name: "sf-team-episode", checked: state.team.episodes.includes(ep.id), onchange: () => { state.team.episodes = [ep.id]; save(); render(); } }), ` ${ep.id} · ${L(ep.title)}`)))));
    const docs = h("section", { class: "sf-card" }, h("h3", {}, t("3. Documentos", "3. Documents")),
      h("p", {}, t("Los documentos se componen en este navegador con la configuración del paquete. Son los mismos que imprime el profesorado.", "The documents are composed in this browser with the package's configuration. They are the same ones the teacher prints.")));
    const viewer = h("div", { class: "sf-viewer" });
    const list = B.plan(state.cfg).docs.filter((d) => !d.teacher && !d.suspect && (!d.episode || state.team.episodes.includes(d.episode)) && (d.id !== "envelope" || state.envelope));
    list.forEach((d) => docs.append(h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => showDoc(d, viewer) }, `${d.n} · ${d.title}`)));
    docs.append(fileButton(t("Importar el sobre (segunda jornada)", "Import the envelope (second session)"), (text) => {
      const res = B.importPackage(text);
      if (!res.ok || !res.pkg.envelope) return setStatus(t("Ese archivo no es el sobre.", "That file is not the envelope."));
      state.envelope = res.pkg.envelope; SF.envelope = res.pkg.envelope; setStatus(t("Sobre abierto: ya podéis ver el documento 30.", "Envelope opened: document 30 is now available.")); render();
    }));
    docs.append(viewer);
    root.append(docs);
    root.append(h("section", { class: "sf-card" }, h("h3", {}, t("4. Guardar el trabajo", "4. Save your work")),
      h("p", {}, t("El trabajo se guarda en este navegador. Para entregarlo o seguir en otro ordenador, exportadlo.", "Work is kept in this browser. To hand it in or continue on another computer, export it.")),
      h("button", { type: "button", class: "sf-btn", onclick: () => download(`zeno_${B.stem(state.team.name || "equipo")}.work.json`, new Blob([JSON.stringify({ format: WORK, version: 1, created: new Date().toISOString(), team: state.team, cfg: state.cfg, answers: state.answers, results: state.results, trailer: state.trailer, accusation: state.accusation }, null, 1)], { type: "application/json" })) }, t("Exportar trabajo del equipo", "Export team work")),
      fileButton(t("Importar trabajo", "Import work"), (text) => {
        try { const w = JSON.parse(text); if (w.format !== WORK) throw new Error(); Object.assign(state, { team: w.team, answers: w.answers || {}, results: w.results || {}, trailer: Object.assign(TR.defaultConfig(SF), w.trailer || {}), accusation: w.accusation || {}, cfg: B.normalize(Object.assign({}, w.cfg, { lang: LANG })) }); save(); render(); setStatus(t("Trabajo importado.", "Work imported.")); }
        catch (e) { setStatus(t("No es un archivo de trabajo de este caso.", "Not a work file for this case.")); }
      })));
    root.append(h("p", { class: "sf-help" }, t(`Configuración: ${state.cfg.teams} equipos · nivel ${L(SF.levels[state.cfg.level])} · noche ${state.cfg.night} · versión de datos ${SF.meta.dataVersion}.`, `Configuration: ${state.cfg.teams} teams · level ${L(SF.levels[state.cfg.level])} · night ${state.cfg.night} · data version ${SF.meta.dataVersion}.`)));
    void C;
  };
  let assetsCache = null;
  async function showDoc(spec, viewer) {
    if (!window.jspdf) { setStatus(t("No se ha cargado jsPDF: revisad la conexión.", "jsPDF did not load: check the connection.")); return; }
    setStatus(t("Componiendo el documento…", "Composing the document…"));
    if (!assetsCache) assetsCache = await B.prepareAssets(state.cfg, setStatus);
    const X = B.context(state.cfg, assetsCache);
    const f = B.buildDoc(spec, X);
    viewer.innerHTML = "";
    const url = URL.createObjectURL(f.blob);
    viewer.append(h("div", { class: "sf-actions" }, h("a", { class: "sf-btn sf-secondary", href: url, download: f.fileName }, t("Descargar PDF", "Download PDF"))), h("iframe", { src: url, title: f.label, class: "sf-pdf" }));
    setStatus("");
  }
  function fileButton(label, onText) {
    const input = h("input", { type: "file", accept: ".json,application/json", hidden: true, onchange: async () => { const f = input.files[0]; if (f) onText(await f.text()); input.value = ""; } });
    return h("span", {}, h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => input.click() }, label), input);
  }

  // ------------------------------------------------------------------------ exercises
  VIEWS.exercises = function (root) {
    if (!state.team.episodes.length) { root.append(h("p", { class: "sf-card" }, t("Elegid primero vuestro episodio en la pestaña Expediente.", "First choose your episode in the Case file tab."))); return; }
    const C = ctx();
    state.team.episodes.forEach((k) => {
      const D = SF.dossiers.find((d) => d.episode === k), ep = SF.show.episodes[k - 1];
      const sec = h("section", { class: "sf-card" }, h("h3", {}, `${t("Episodio", "Episode")} ${k} · ${L(ep.title)}`), h("p", { class: "sf-q" }, rich(D.question)));
      B.exercisesFor(D, state.cfg.level).forEach((ex) => {
        const box = h("div", { class: "sf-ex" }, h("p", {}, h("strong", {}, `${ex.id}${ex.evidence ? " ★" : ""} `), `(${L(SF.levels[ex.level])}) `, rich(E.fill(L(ex.text), Object.assign({}, C.tokens), LANG))));
        ex.answers.forEach((a) => box.append(answerField(ex, a, C)));
        sec.append(box);
      });
      root.append(sec);
    });
    root.append(h("p", { class: "sf-help" }, t("La sala comprueba números, horas, intervalos y expresiones (como identidades, no como texto). Los argumentos escritos los revisa el profesorado: la sala nunca da por buena una demostración por las palabras que contiene.", "The room checks numbers, times, intervals and expressions (as identities, not as text). Written arguments are reviewed by your teacher: the room never accepts a proof for the words it contains.")));
  };
  function answerField(ex, a, C) {
    const id = `${ex.id}/${a.key}`, prev = state.answers[id];
    const label = typeof a.label === "string" ? rich(`$${a.label}$`) : rich(a.label);
    const out = h("div", { class: "sf-feedback" });
    const show = (r) => {
      out.innerHTML = "";
      if (!r) return;
      const icon = { correct: "✓", incorrect: "✗", review: "⧗", invalid: "!" }[r.status];
      out.className = `sf-feedback sf-${r.status}`;
      out.append(h("span", { class: "sf-icon" }, icon), " ", r.status === "correct" ? t("Correcto", "Correct") : r.status === "review" ? t("Pendiente de revisión", "Awaiting review") : r.status === "invalid" ? t("Formato no válido", "Invalid format") : t("No es correcto", "Not correct"));
      if (r.kind === "approx") out.append(" ", badge("approx"));
      if (r.message) out.append(h("div", {}, rich(r.message)));
    };
    const check = (value) => { const r = V.check(SF, a, value, C); state.answers[id] = value; state.results[id] = r.status; save(); show(r); };
    let control;
    if (a.type === "choice") {
      const names = { yes: t("sí", "yes"), no: "no", finite: t("finito", "finite"), infinite: t("infinito", "infinite"), converges: t("converge", "converges"), diverges: t("diverge", "diverges"), absolute: t("absoluta", "absolute"), conditional: t("condicional", "conditional"), "tend-to-0": t("tienden a 0", "tend to 0"), "do-not-tend-to-0": t("no tienden a 0", "do not tend to 0"), true: t("verdadera", "true"), false: t("falsa", "false") };
      control = h("select", { onchange: (e) => check(e.target.value) }, h("option", { value: "" }, "—"), a.options.map((o) => h("option", { value: o, selected: prev === o }, names[o] || o)));
    } else if (a.type === "justification") {
      const chosen = new Set((prev && prev.criteria) || []);
      const text = h("textarea", { rows: 3, placeholder: t("Escribid el argumento con vuestras palabras…", "Write the argument in your own words…") }, (prev && prev.text) || "");
      const opts = V.optionsFor(a).map((o) => h("label", { class: "sf-opt" }, h("input", { type: "checkbox", checked: chosen.has(o.id), onchange: (e) => { if (e.target.checked) chosen.add(o.id); else chosen.delete(o.id); } }), " ", rich(o.label)));
      control = h("div", { class: "sf-just" }, h("p", { class: "sf-help" }, t("Marcad los argumentos que usáis (y solo esos):", "Tick the arguments you use (and only those):")), opts, text,
        h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => check({ criteria: [...chosen], text: text.value }) }, t("Comprobar la estructura", "Check the structure")));
    } else {
      const input = h("input", { type: "text", value: prev || "", placeholder: { number: "0.64", integer: "249", clock: "22:25:00", duration: "2:47:30", interval: "7.75, 8.84", expression: a.variable === "N" ? "1 - 1/(N+1)" : "20(1-0.6^n)" }[a.type] || "" });
      control = h("span", { class: "sf-inline" }, input, h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => check(input.value) }, t("Comprobar", "Check")));
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(input.value); });
    }
    const row = h("div", { class: "sf-answer" }, h("div", { class: "sf-label" }, label), control, out);
    if (prev != null) show(V.check(SF, a, prev, C));
    return row;
  }

  // ------------------------------------------------------------------------ the lab
  const FAMILIES = {
    S0: { name: t("Cuenta atrás (sucesión con límite)", "Countdown (sequence with a limit)"), shot: "S0", forms: ["R", "G"],
      params: (p) => (p.form === "G" ? [["T", 2, 30, 0.5], ["q", 0.05, 0.99, 0.01]] : [["T", 2, 30, 0.5], ["c", 0.2, 20, 0.1]]),
      tex: (p) => (p.form === "G" ? `t_n = ${M.fmt(p.T)}(1 - ${M.fmt(p.q)}^n)` : `t_n = \\frac{${M.fmt(p.T)}n}{n + ${M.fmt(p.c)}}`),
      seq: (p, n) => M.countdown.t(p, n), sum: null,
      facts: (p) => [[t(`lím t_n = ${M.fmt(p.T)}`, `lim t_n = ${M.fmt(p.T)}`), "exact"], [t(`Pitidos antes de ${M.fmt(p.T / 2)} s: ${M.countdown.countBefore(p, p.T / 2)}`, `Beeps before ${M.fmt(p.T / 2)} s: ${M.countdown.countBefore(p, p.T / 2)}`), "exact"], [t("Infinitos pitidos antes del límite", "Infinitely many beeps before the limit"), "proved"]] },
    S1: { name: t("Progresión aritmética (suma finita)", "Arithmetic progression (finite sum)"), shot: "S1",
      params: () => [["a", 1, 60, 1], ["d", 0, 20, 1], ["n", 1, 40, 1]], tex: (p) => `S_n = \\frac{n(2 \\cdot ${p.a} + (n - 1) \\cdot ${p.d})}{2}`,
      seq: (p, k) => M.arithmetic.term(p.a, p.d, k), partial: (p, n) => M.arithmetic.sum(p.a, p.d, n), finite: (p) => p.n,
      facts: (p) => [[t(`Suma de ${p.n} anillos: ${M.fmt(M.arithmetic.sum(p.a, p.d, p.n))}`, `Sum of ${p.n} rings: ${M.fmt(M.arithmetic.sum(p.a, p.d, p.n))}`), "exact"], [t("Es una suma finita: no hay serie infinita", "It is a finite sum: there is no infinite series"), "exact"]] },
    S2: { name: t("Serie geométrica", "Geometric series"), shot: "S2",
      params: () => [["a", 0.5, 20, 0.1], ["r", -1.2, 1.2, 0.01]], tex: (p) => `\\sum_{k=1}^{\\infty} ${M.fmt(p.a)} \\cdot ${M.fmt(p.r)}^{k-1}`,
      seq: (p, k) => M.geometric.term(p.a, p.r, k), partial: (p, n) => M.geometric.partial(p.a, p.r, n),
      facts: (p) => (M.geometric.converges(p.r) ? [[t(`Converge porque |r| = ${M.fmt(Math.abs(p.r))} < 1`, `Converges because |r| = ${M.fmt(Math.abs(p.r))} < 1`), "proved"], [t(`Suma a/(1 − r) = ${M.fmt(M.geometric.sum(p.a, p.r), 4)}`, `Sum a/(1 − r) = ${M.fmt(M.geometric.sum(p.a, p.r), 4)}`), "exact"]]
        : [[t(`|r| = ${M.fmt(Math.abs(p.r))} ≥ 1: la serie diverge y la fórmula a/(1 − r) no se puede aplicar`, `|r| = ${M.fmt(Math.abs(p.r))} ≥ 1: the series diverges and the formula a/(1 − r) does not apply`), "proved"]]),
      limit: (p) => M.geometric.sum(p.a, p.r) },
    S3: { name: t("Serie armónica (la cuerda)", "Harmonic series (the rope)"), shot: "S3",
      params: () => [["c", 1, 40, 1], ["L", 2, 400, 1]], tex: (p) => `F_n = \\frac{${M.fmt(p.c)}}{${M.fmt(p.L)}} \\sum_{k=1}^{n} \\frac{1}{k}`,
      seq: (p, k) => p.c / (p.L * k), partial: (p, n) => M.harmonic.fraction(p.c, p.L, n),
      facts: (p) => { const m = p.L / p.c; return [[t("Los términos tienden a 0 y aun así la suma no está acotada (Oresme)", "The terms tend to 0 and still the sum is unbounded (Oresme)"), "proved"], [t(`No llega antes del minuto ${M.harmonic.earliestProved(m)}`, `It cannot arrive before minute ${M.harmonic.earliestProved(m)}`), "proved"], [t(`Llega como muy tarde en el minuto ${M.harmonic.latestProved(m)}`, `It arrives by minute ${M.harmonic.latestProved(m)} at the latest`), "proved"], [t(`Llegada: minuto ${M.harmonic.arrival(m) || "—"}`, `Arrival: minute ${M.harmonic.arrival(m) || "—"}`), "computed"]]; },
      limit: () => 1 },
    S4: { name: t("Serie telescópica", "Telescoping series"), shot: "S4", forms: ["H", "G"],
      params: (p) => (p.form === "G" ? [["A", 0.1, 3, 0.05], ["q", 0.05, 0.99, 0.01]] : [["A", 0.1, 3, 0.05], ["m", 0, 6, 0.05]]),
      tex: (p) => (p.form === "G" ? `\\sum_{k=1}^{\\infty} (b_k - b_{k+1}),\\; b_k = ${M.fmt(p.A)} \\cdot ${M.fmt(p.q)}^{k-1}` : `\\sum_{k=1}^{\\infty} (b_k - b_{k+1}),\\; b_k = \\frac{${M.fmt(p.A)}}{k + ${M.fmt(p.m)}}`),
      seq: (p, k) => M.telescoping.entry(p, k), partial: (p, n) => M.telescoping.partial(p, n),
      facts: (p) => [[t(`S_N = b_1 − b_{N+1}`, `S_N = b_1 − b_{N+1}`), "exact"], [t(`Suma = b_1 = ${M.fmt(M.telescoping.total(p), 4)} porque b_k → 0`, `Sum = b_1 = ${M.fmt(M.telescoping.total(p), 4)} because b_k → 0`), "exact"]],
      limit: (p) => M.telescoping.total(p) },
    S5: { name: t("Series p (dosis)", "p-series (doses)"), shot: "S5",
      params: () => [["D", 0.2, 2, 0.05], ["pS", 0.3, 3, 0.05], ["pI", 0.3, 3, 0.05]], tex: (p) => `\\sum_{n=1}^{\\infty} \\frac{${M.fmt(p.D)}}{n^{${M.fmt(p.pI)}}}`,
      seq: (p, k) => M.pseries.term(p.D, p.pI, k), partial: (p, n) => M.pseries.partial(p.D, p.pI, n), second: (p, n) => M.pseries.partial(p.D, p.pS, n),
      facts: (p) => {
        const pr = M.pseries.proveBelow(p.D, p.pI, 2), f = [];
        f.push([p.pI > 1 ? t("Irene: converge (p > 1, agrupación en bloques)", "Irene: converges (p > 1, grouping in blocks)") : t("Irene: diverge (p ≤ 1, comparación con la armónica)", "Irene: diverges (p ≤ 1, comparison with the harmonic)"), "proved"]);
        if (pr.proved) f.push([t(`Irene queda por debajo de 2: cota ${M.fmt(pr.bound, 3)}`, `Irene stays below 2: bound ${M.fmt(pr.bound, 3)}`), "proved"]);
        else if (pr.reason === "true-unproved") f.push([t(`Irene ≈ ${M.fmt(pr.estimate, 3)} < 2, pero ninguna cota del caso lo demuestra`, `Irene ≈ ${M.fmt(pr.estimate, 3)} < 2, but no bound of the case proves it`), "computed"]);
        else if (pr.reason === "false") f.push([t(`Irene cruza 2 en el minuto ${M.pseries.crossing(p.D, p.pI, 2)}: convergente no es pequeña`, `Irene crosses 2 in minute ${M.pseries.crossing(p.D, p.pI, 2)}: convergent is not small`), "computed"]);
        const cs = M.pseries.crossing(p.D, p.pS, 2, 100000);
        f.push([t(`Sara cruza 2 en el minuto ${cs || "—"}`, `Sara crosses 2 in minute ${cs || "—"}`), "computed"]);
        return f;
      }, limit: () => 2, limitLabel: t("umbral", "threshold") },
    S6: { name: t("Serie alternada (la baliza)", "Alternating series (the beacon)"), shot: "S6", forms: ["P", "G"],
      params: (p) => (p.form === "G" ? [["L", 1, 20, 0.5], ["r", 0.05, 0.99, 0.01]] : [["L", 1, 20, 0.5], ["s", 0.2, 3, 0.05]]),
      tex: (p) => (p.form === "G" ? `\\sum_{k=1}^{\\infty} (-1)^{k+1} ${M.fmt(p.L)} \\cdot ${M.fmt(p.r)}^{k-1}` : `\\sum_{k=1}^{\\infty} (-1)^{k+1} \\frac{${M.fmt(p.L)}}{k^{${M.fmt(p.s)}}}`),
      seq: (p, k) => (k % 2 ? 1 : -1) * M.alternating.b(p, k), partial: (p, n) => M.alternating.position(p, n),
      facts: (p) => {
        const f = [[t("Converge (Leibniz): queda entre dos sumas parciales consecutivas", "Converges (Leibniz): it lies between two consecutive partial sums"), "proved"]];
        const br = M.alternating.bracket(p, 40); f.push([t(`Tras 40 términos: entre ${M.fmt(br[0], 3)} y ${M.fmt(br[1], 3)}`, `After 40 terms: between ${M.fmt(br[0], 3)} and ${M.fmt(br[1], 3)}`), "proved"]);
        f.push([M.alternating.pathDiverges(p) ? t("Camino recorrido infinito: convergencia condicional", "Infinite path walked: conditional convergence") : t("Camino recorrido finito: convergencia absoluta", "Finite path walked: absolute convergence"), "proved"]);
        if (M.alternating.exactSum(p) != null) f.push([t(`Suma L/(1 + r) = ${M.fmt(M.alternating.exactSum(p), 4)}`, `Sum L/(1 + r) = ${M.fmt(M.alternating.exactSum(p), 4)}`), "exact"]);
        if (M.alternating.knownSum(p) != null) f.push([t(`Valor conocido L ln 2 ≈ ${M.fmt(M.alternating.knownSum(p), 4)} (no se demuestra aquí)`, `Known value L ln 2 ≈ ${M.fmt(M.alternating.knownSum(p), 4)} (not proved here)`), "known"]);
        return f;
      }, limit: (p) => M.alternating.exactSum(p) ?? M.alternating.knownSum(p) },
  };
  let labFamily = "S2";
  VIEWS.lab = function (root) {
    const F = FAMILIES[labFamily], p = state.trailer.math[labFamily];
    const sel = h("select", { onchange: (e) => { labFamily = e.target.value; render(); } }, Object.entries(FAMILIES).map(([id, f]) => h("option", { value: id, selected: id === labFamily }, f.name)));
    const left = h("div", { class: "sf-card" }, h("label", {}, t("Familia", "Family"), sel));
    if (F.forms) left.append(h("label", {}, t("Forma", "Form"), h("select", { onchange: (e) => { p.form = e.target.value; Object.assign(p, defaultsFor(labFamily, p.form)); save(); render(); } }, F.forms.map((f) => h("option", { value: f, selected: p.form === f }, f)))));
    F.params(p).forEach(([k, lo, hi, step]) => {
      const num = h("input", { type: "number", value: p[k], step, min: lo, max: hi });
      const rng = h("input", { type: "range", value: p[k], step, min: lo, max: hi });
      const set = (v) => { const x = Number(String(v).replace(",", ".")); if (!isFinite(x)) return; p[k] = x; num.value = x; rng.value = x; save(); update(); };
      num.addEventListener("input", (e) => set(e.target.value)); rng.addEventListener("input", (e) => set(e.target.value));
      left.append(h("label", { class: "sf-param" }, h("span", {}, rich(`$${k === "pS" ? "p_S" : k === "pI" ? "p_I" : k}$`)), rng, num));
    });
    const expr = h("div", { class: "sf-expr" }), facts = h("ul", { class: "sf-facts" }), rules = h("ul", { class: "sf-rules" }), table = h("div", { class: "sf-table-wrap" });
    const graph = h("canvas", { width: 760, height: 320, class: "sf-graph" }), preview = h("canvas", { width: 640, height: 360, class: "sf-preview" });
    left.append(h("div", { class: "sf-actions" },
      h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => { state.pins.push({ fam: labFamily, p: JSON.parse(JSON.stringify(p)) }); state.pins = state.pins.filter((x) => x.fam === labFamily).slice(-3); update(); } }, t("Fijar para comparar", "Pin to compare")),
      h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => { state.pins = []; update(); } }, t("Quitar comparaciones", "Clear comparisons"))));
    root.append(h("div", { class: "sf-lab" }, left, h("div", { class: "sf-card" }, expr, h("h4", {}, t("Comportamiento", "Behaviour")), facts, h("h4", {}, t("Reglas de la escena", "Rules of the scene")), rules)),
      h("div", { class: "sf-card" }, h("h4", {}, t("Términos y sumas parciales", "Terms and partial sums")), graph, h("p", { class: "sf-help" }, t("La gráfica muestra un número finito de términos: sugiere, no demuestra. Lo demostrado está marcado arriba.", "The graph shows finitely many terms: it suggests, it does not prove. What is proved is marked above.")), table),
      h("div", { class: "sf-card" }, h("h4", {}, t("Previsualización del plano", "Shot preview")), preview));
    function update() {
      expr.innerHTML = ""; expr.append(formula(F.tex(p), 32));
      facts.innerHTML = ""; F.facts(p).forEach(([txt, kind]) => facts.append(h("li", {}, badge(kind), " ", txt)));
      rules.innerHTML = "";
      const chk = TR.checkShot(F.shot, p, state.cfg.constraints);
      chk.items.forEach((it) => rules.append(h("li", { class: it.ok ? "sf-ok" : "sf-ko" }, it.ok ? "✓ " : "✗ ", L(it.label), it.detail ? h("div", { class: "sf-help" }, L(it.detail)) : null)));
      rules.append(h("li", { class: chk.ok ? "sf-ok" : "sf-ko" }, h("strong", {}, chk.ok ? t("Compatible con la escena", "Compatible with the scene") : t("Incompatible con la escena: mirad la regla marcada", "Incompatible with the scene: see the rule marked"))));
      if (!chk.ok && isOfficial(F.shot, p)) rules.append(h("li", { class: "sf-help" }, OFFICIAL_NOTE()));
      drawGraph(graph, F, p);
      table.innerHTML = "";
      const N = F.finite ? Math.min(F.finite(p), 12) : 12;
      table.append(h("table", { class: "sf-table" }, h("tr", {}, h("th", {}, "n"), h("th", {}, F.partial ? t("término", "term") : "t_n"), F.partial ? h("th", {}, t("suma parcial", "partial sum")) : null),
        Array.from({ length: N }, (_, k) => h("tr", {}, h("td", {}, k + 1), h("td", {}, M.fmt(F.seq(p, k + 1), 5)), F.partial ? h("td", {}, M.fmt(F.partial(p, k + 1), 5)) : null))));
    }
    update();
    // animated preview of the shot with the current parameters
    const env = { SF, lang: LANG }, paint = TR.painter(env);
    let t0 = performance.now(), raf;
    const seg = SF.trailer.segments.find((s) => s.id === F.shot), dur = F.shot === "S0" ? p.T + 2 : seg.end - seg.start;
    const loop = () => { if (!preview.isConnected) return cancelAnimationFrame(raf); const tt = ((performance.now() - t0) / 1000) % dur; paint.drawShot(preview.getContext("2d"), preview.width, preview.height, F.shot, tt, state.trailer, { dur, noCard: true }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  };
  function defaultsFor(fam, form) {
    const D = { S0: { R: { T: 10, c: 6 }, G: { T: 10, q: 0.85 } }, S4: { H: { A: 1, m: 0 }, G: { A: 1, q: 0.6 } }, S6: { P: { L: 12, s: 1 }, G: { L: 12, r: 0.5 } } };
    return (D[fam] && D[fam][form]) || {};
  }
  function drawGraph(cv, F, p) {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height, pad = 40, N = F.finite ? Math.min(F.finite(p), 40) : 40;
    const series = [{ p, color: "#0b607f" }].concat(state.pins.filter((x) => x.fam === labFamily).map((x, k) => ({ p: x.p, color: ["#e77924", "#a43d35", "#6a4c93"][k] })));
    const vals = [];
    series.forEach((s) => { for (let n = 1; n <= N; n++) { vals.push(F.seq(s.p, n)); if (F.partial) vals.push(F.partial(s.p, n)); if (F.second) vals.push(F.second(s.p, n)); } });
    const lim = F.limit ? F.limit(p) : null; if (lim != null && isFinite(lim)) vals.push(lim);
    let lo = Math.min(0, ...vals.filter(isFinite)), hi = Math.max(...vals.filter(isFinite)); if (hi - lo < 1e-9) hi = lo + 1;
    hi = Math.min(hi, lo + 1e6);
    const X = (n) => pad + ((n - 0.5) / N) * (W - 2 * pad), Y = (v) => H - pad - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (H - 2 * pad);
    g.clearRect(0, 0, W, H); g.fillStyle = "#fffdf8"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#c8cbce"; g.lineWidth = 1; g.beginPath(); g.moveTo(pad, Y(0)); g.lineTo(W - pad, Y(0)); g.moveTo(pad, pad / 2); g.lineTo(pad, H - pad); g.stroke();
    g.fillStyle = "#5d6570"; g.font = "11px sans-serif"; g.textAlign = "right"; [lo, (lo + hi) / 2, hi].forEach((v) => g.fillText(M.fmt(v, 3), pad - 4, Y(v) + 4));
    g.textAlign = "center"; [1, Math.ceil(N / 2), N].forEach((n) => g.fillText(String(n), X(n), H - pad + 14));
    if (lim != null && isFinite(lim)) { g.setLineDash([6, 4]); g.strokeStyle = "#a43d35"; g.beginPath(); g.moveTo(pad, Y(lim)); g.lineTo(W - pad, Y(lim)); g.stroke(); g.setLineDash([]); g.fillStyle = "#a43d35"; g.textAlign = "left"; g.fillText(F.limitLabel || t("límite", "limit"), W - pad + 2, Y(lim) + 4); }
    series.forEach((s, si) => {
      const bw = (W - 2 * pad) / N * 0.6 / series.length;
      for (let n = 1; n <= N; n++) { const v = F.seq(s.p, n); g.fillStyle = s.color + "55"; g.fillRect(X(n) - bw * series.length / 2 + si * bw, Math.min(Y(0), Y(v)), bw, Math.abs(Y(v) - Y(0))); }
      const line = (fn, dash) => { g.strokeStyle = s.color; g.lineWidth = 2; g.setLineDash(dash || []); g.beginPath(); for (let n = 1; n <= N; n++) { const v = fn(s.p, n); if (n === 1) g.moveTo(X(n), Y(v)); else g.lineTo(X(n), Y(v)); } g.stroke(); g.setLineDash([]); };
      if (F.partial) line(F.partial); if (F.second) line(F.second, [3, 3]);
      if (!F.partial) line(F.seq);
    });
  }

  // Final-art plates listed in SF.trailer.plates, loaded once; until they arrive the painter uses
  // the procedural previews, so a missing file only costs the preview mark.
  const PLATES = {};
  Object.entries(SF.trailer.plates || {}).forEach(([id, file]) => {
    const img = new Image();
    img.onload = () => { PLATES[id] = img; };
    img.src = B.url(`media/plates/${file}`);
  });

  // The official trailer uses the canon of bible v3; the creative rules apply to the team's version,
  // so an official value may break them (S3: m = 10 cannot be proved to arrive before day 9).
  const isOfficial = (id, p) => JSON.stringify(p) === JSON.stringify(TR.MATH_DEFAULT[id]);
  const OFFICIAL_NOTE = () => t("Son los valores del tráiler oficial (biblia v3). Las reglas son para vuestra versión: cambiadlos hasta que la escena sea compatible.", "These are the values of the official trailer (bible v3). The rules are for your version: change them until the scene is compatible.");

  // ------------------------------------------------------------------------ editing room
  VIEWS.edit = function (root) {
    const cfg = state.trailer, C = ctx();
    const shots = h("div", { class: "sf-card" }, h("h3", {}, t("Parámetros matemáticos de cada plano", "Mathematical parameters of each shot")),
      h("p", { class: "sf-help" }, t("Cada plano tiene reglas (las de la biblia). Cambiad los valores en el laboratorio o aquí; una configuración que no cumpla las reglas se marca y se explica.", "Each shot has rules (those of the bible). Change the values in the lab or here; a configuration that breaks the rules is marked and explained.")));
    Object.keys(FAMILIES).forEach((id) => {
      const chk = TR.checkShot(id, cfg.math[id], state.cfg.constraints);
      shots.append(h("details", { class: `sf-shot ${chk.ok ? "sf-ok" : "sf-ko"}` }, h("summary", {}, `${chk.ok ? "✓" : "✗"} ${id} · ${FAMILIES[id].name}`),
        h("div", {}, formula(FAMILIES[id].tex(cfg.math[id]), 26)), h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => { labFamily = id; current = "lab"; render(); } }, t("Abrir en el laboratorio", "Open in the lab")),
        h("ul", {}, chk.items.filter((i) => !i.ok).map((i) => h("li", {}, L(i.label), i.detail ? h("div", { class: "sf-help" }, L(i.detail)) : null))),
        !chk.ok && isOfficial(id, cfg.math[id]) ? h("p", { class: "sf-help" }, OFFICIAL_NOTE()) : null));
    });
    const art = cfg.art;
    const sel = (key, opts) => h("select", { onchange: (e) => { art[key] = e.target.value; save(); } }, opts.map(([v, lab]) => h("option", { value: v, selected: String(art[key]) === String(v) }, lab)));
    const rng = (key, lo, hi, step) => h("input", { type: "range", min: lo, max: hi, step, value: art[key], oninput: (e) => { art[key] = Number(e.target.value); save(); } });
    const arts = h("div", { class: "sf-card" }, h("h3", {}, t("Parámetros artísticos", "Artistic parameters")), h("p", { class: "sf-help" }, t("No cambian las matemáticas ni la solución: solo el aspecto.", "They change neither the mathematics nor the solution: only the look.")),
      h("div", { class: "sf-grid2" },
        h("label", {}, t("Paleta", "Palette"), sel("palette", Object.entries(TR.PALETTES).map(([k, v]) => [k, L(v.name)]))),
        h("label", {}, t("Formato", "Framing"), sel("letterbox", [["2.39", "2.39:1"], ["1.85", "1.85:1"], ["none", "16:9"]])),
        h("label", {}, t("Transición", "Transition"), sel("transition", [["cut", t("corte", "cut")], ["fade", t("fundido", "fade")], ["flash", t("destello", "flash")], ["glitch", "glitch"]])),
        h("label", {}, t("Cámara", "Camera"), sel("camera", [["static", t("fija", "static")], ["drift", t("deriva", "drift")], ["handheld", t("en mano", "handheld")]])),
        h("label", {}, t("Rótulos", "Titles"), sel("titles", [["condensed", t("condensada", "condensed")], ["serif", t("con serifa", "serif")], ["mono", t("monoespaciada", "monospace")]])),
        h("label", {}, t("Música", "Music"), sel("mood", [["drone", t("dron", "drone")], ["pulse", t("pulso", "pulse")]])),
        h("label", {}, t("Grano", "Grain"), rng("grain", 0, 1, 0.05)), h("label", {}, t("Brillo de los efectos", "Effects glow"), rng("bloom", 0, 1.5, 0.05)),
        h("label", {}, t("Ritmo", "Rhythm"), rng("rhythm", 0.8, 1.25, 0.05)),
        h("label", {}, t("Fórmulas en pantalla", "Formulas on screen"), h("input", { type: "checkbox", checked: art.hud, onchange: (e) => { art.hud = e.target.checked; save(); } }))));
    const canvas = h("canvas", { width: 1280, height: 720, class: "sf-player" });
    const time = h("input", { type: "range", min: 0, max: 1000, value: 0, class: "sf-seek" }), clock = h("span", { class: "sf-clock" });
    const env = { SF, lang: LANG, plates: PLATES, audio: { start: (c, t0) => A.start(SF, c, t0), streamDestination: A.streamDestination } };
    const player = new TR.Player(canvas, env, cfg); players.push(player);
    let shownAt = 0;
    player.onTime = (tt, d) => { shownAt = tt; time.value = Math.round((tt / d) * 1000); clock.textContent = `${tt.toFixed(1)} / ${d.toFixed(1)} s`; };
    time.addEventListener("input", () => player.seek((time.value / 1000) * player.duration));
    const prog = h("span", { class: "sf-help" });
    const playBtn = h("button", { type: "button", class: "sf-btn", onclick: () => { if (player.playing) player.pause(); else player.play(); } }, t("▶ Reproducir / pausa", "▶ Play / pause"));
    const exportBtn = h("button", { type: "button", class: "sf-btn sf-secondary", onclick: async () => {
      try { exportBtn.disabled = true; const r = await player.record((u) => { prog.textContent = `${t("Grabando", "Recording")} ${Math.round(u * 100)} %`; }); download(`zeno_${B.stem(state.team.name || t("equipo", "team"))}.${r.mime.includes("mp4") ? "mp4" : "webm"}`, r.blob); prog.textContent = t("Vídeo exportado.", "Video exported."); }
      catch (e) { prog.textContent = t("Este navegador no puede grabar vídeo: reproducidlo a pantalla completa o usad Chrome o Firefox.", "This browser cannot record video: play it full screen or use Chrome or Firefox."); }
      finally { exportBtn.disabled = false; } } }, t("Exportar vídeo (tiempo real)", "Export video (real time)"));
    const full = h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => canvas.requestFullscreen && canvas.requestFullscreen() }, t("Pantalla completa", "Full screen"));
    // a still for the paper storyboard: the frame on screen, as PNG
    const still = h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => canvas.toBlob((b) => b && download(`zeno_${B.stem(state.team.name || t("equipo", "team"))}_${shownAt.toFixed(1)}s.png`, b), "image/png") }, t("Guardar fotograma (PNG)", "Save frame (PNG)"));
    root.append(h("div", { class: "sf-card" }, h("h3", {}, t("El tráiler de vuestro equipo", "Your team's trailer")), canvas, h("div", { class: "sf-controls" }, playBtn, time, clock, full, still, exportBtn, prog),
      h("p", { class: "sf-help" }, t("Las placas de cada plano son previsualizaciones generadas por programa; los efectos matemáticos se calculan con vuestros parámetros. El vídeo no contiene ninguna prueba que no esté en papel.", "Each shot's plates are programmatically generated previews; the mathematical effects are computed from your parameters. The video contains no evidence that is not on paper."))),
      shots, arts,
      h("div", { class: "sf-card" }, h("h3", {}, t("Compartir la versión", "Share the version")),
        h("button", { type: "button", class: "sf-btn sf-secondary", onclick: () => download(`zeno_trailer_${B.stem(state.team.name || "equipo")}.trailer.json`, new Blob([JSON.stringify({ format: "calculus-cases/series-finale-trailer", version: 1, team: state.team, trailer: cfg, why: state.accusation.why || "" }, null, 1)], { type: "application/json" })) }, t("Exportar configuración del tráiler", "Export trailer configuration")),
        fileButton(t("Cargar configuración", "Load configuration"), (text) => { try { const j = JSON.parse(text); if (j.format !== "calculus-cases/series-finale-trailer") throw new Error(); state.trailer = Object.assign(TR.defaultConfig(SF), j.trailer); save(); render(); } catch (e) { setStatus(t("No es una configuración de tráiler.", "Not a trailer configuration.")); } })));
    player.seek(0);
    void C;
  };

  // ------------------------------------------------------------------------ festival
  VIEWS.festival = function (root) {
    root.append(h("div", { class: "sf-card" }, h("h3", {}, t("Festival de tráileres", "Trailer festival")),
      h("p", {}, t("Cargad las configuraciones de otros equipos para ver los tráileres lado a lado, con sus parámetros. La pregunta no es cuál es más bonito, sino qué decisión matemática produce cada diferencia.", "Load other teams' configurations to watch the trailers side by side, with their parameters. The question is not which is prettier, but which mathematical decision produces each difference.")),
      fileButton(t("Añadir una versión", "Add a version"), (text) => { try { const j = JSON.parse(text); if (j.format !== "calculus-cases/series-finale-trailer") throw new Error(); state.festival.push(j); state.festival = state.festival.slice(-2); render(); } catch (e) { setStatus(t("No es una configuración de tráiler.", "Not a trailer configuration.")); } })));
    const versions = [{ team: state.team, trailer: state.trailer }].concat(state.festival);
    const grid = h("div", { class: "sf-festival" });
    const env = { SF, lang: LANG };
    const ps = versions.map((v) => { const c = h("canvas", { width: 640, height: 360, class: "sf-player" }); grid.append(h("figure", {}, c, h("figcaption", {}, v.team && v.team.name ? v.team.name : t("Nuestro equipo", "Our team")))); const p = new TR.Player(c, env, Object.assign(TR.defaultConfig(SF), v.trailer)); players.push(p); p.seek(0); return p; });
    const seek = h("input", { type: "range", min: 0, max: 1000, value: 0, class: "sf-seek", oninput: (e) => ps.forEach((p) => p.seek((e.target.value / 1000) * p.duration)) });
    root.append(h("div", { class: "sf-card" }, grid, h("div", { class: "sf-controls" }, h("button", { type: "button", class: "sf-btn", onclick: () => ps.forEach((p) => (p.playing ? p.pause() : p.play())) }, t("▶ Reproducir todas (sin sonido)", "▶ Play all (muted)")), seek)));
    // parameter comparison
    const rows = Object.keys(FAMILIES).map((id) => h("tr", {}, h("td", {}, id), versions.map((v) => h("td", {}, formula(FAMILIES[id].tex(Object.assign({}, TR.MATH_DEFAULT[id], (v.trailer.math || {})[id])), 20)))));
    root.append(h("div", { class: "sf-card" }, h("h4", {}, t("Expresiones de cada versión", "Expressions of each version")), h("table", { class: "sf-table" }, rows)));
  };

  // ------------------------------------------------------------------------ accusation
  VIEWS.accuse = function (root) {
    const a = state.accusation;
    const field = (key, label, rows = 3) => h("label", { class: "sf-field" }, label, h("textarea", { rows, oninput: (e) => { a[key] = e.target.value; save(); } }, a[key] || ""));
    const suspects = SF.people.suspects;
    root.append(h("div", { class: "sf-card" }, h("h3", {}, t("Notas de los interrogatorios", "Interview notes")),
      suspects.map((s) => field(`notes-${s.id}`, `${s.name} · ${L(s.role)}`, 3))));
    root.append(h("div", { class: "sf-card" }, h("h3", {}, t("Formulario de acusación", "Accusation form")),
      h("label", { class: "sf-field" }, t("Acusamos a", "We accuse"), h("select", { onchange: (e) => { a.who = e.target.value; save(); } }, h("option", { value: "" }, "—"), suspects.map((s) => h("option", { value: s.id, selected: a.who === s.id }, s.name)))),
      field("when", t("¿Cuándo actuó? Hora de inicio y cálculo que la demuestra", "When did they act? Start time and the calculation that proves it")),
      field("how", t("¿Cómo obtuvo el vídeo y lo publicó?", "How did they obtain and post the video?")),
      field("why", t("¿Por qué manipuló el tráiler y qué pretendía ocultar?", "Why did they tamper with the trailer and what were they trying to hide?")),
      field("math", t("Pruebas matemáticas (al menos dos, con su cálculo)", "Mathematical evidence (at least two, with their calculation)"), 5),
      field("others", t("Por qué descartamos a cada uno de los demás", "Why we rule out each of the others"), 5),
      h("p", { class: "sf-help" }, t("La sala no sabe quién es el culpable: la acusación la valora el inspector jefe.", "The room does not know who the culprit is: the accusation is assessed by the Chief Inspector.")),
      h("button", { type: "button", class: "sf-btn", onclick: exportAccusation }, t("Descargar la acusación (PDF)", "Download the accusation (PDF)"))));
  };
  function exportAccusation() {
    if (!window.jspdf) return setStatus(t("No se ha cargado jsPDF.", "jsPDF did not load."));
    const X = B.context(state.cfg, {}), doc = window.SFPdf.newDoc(state.cfg.format);
    const w = window.SFPdf.writer(doc, { format: state.cfg.format, banner: null, kicker: window.SFDocs.kicker(X), t });
    const a = state.accusation, who = SF.people.suspects.find((s) => s.id === a.who);
    w.title(t("Acusación del equipo", "Team accusation"), null);
    w.meta([[t("Equipo", "Team"), state.team.name || "—"], [t("Integrantes", "Members"), state.team.members || "—"], [t("Acusamos a", "We accuse"), who ? who.name : "—"]]);
    [["when", t("Cuándo", "When")], ["how", t("Cómo", "How")], ["why", t("Por qué", "Why")], ["math", t("Pruebas matemáticas", "Mathematical evidence")], ["others", t("Descartes", "Eliminations")]].forEach(([k, lab]) => { w.heading(lab); w.paragraph(a[k] || "—"); });
    window.SFPdf.footer(doc, t("Acusación", "Accusation"), { t });
    download(`zeno_acusacion_${B.stem(state.team.name || "equipo")}.pdf`, doc.output("blob"));
  }

  restore();
  render();
  window.SFRoom = { state, render, FAMILIES };
})();
