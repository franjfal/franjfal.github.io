/*
 * Calculus Cases · Case 7 · The Series Finale — teacher generator (page UI).
 * Depends on jsPDF, JSZip and the case scripts (data, engines, docs, sf-build.js).
 */
(function () {
  "use strict";
  const root = document.querySelector('.cc-case[data-case="series-finale"]');
  if (!root || !window.SFBuild) return;
  const B = window.SFBuild, M = window.SFMath, TR = window.SFTrailer;
  const LANG = (root.dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es";
  const t = (es, en) => (LANG === "en" ? en : es);
  const L = (o) => (o && typeof o === "object" ? o[LANG] : o);
  const els = {};
  const state = { urls: [], timer: null };

  function init() {
    ["form", "format", "night", "students", "groups", "level", "frames", "fcost", "fstep", "finish", "suite", "project", "trailer",
      "generate", "clear", "status", "summary", "checks", "preview", "documents", "bundles", "doclist", "complete", "printguide",
      "export-teacher", "export-student", "export-envelope", "import", "import-file", "import-status"].forEach((k) => { els[k] = document.getElementById(`sf-${k}`); });
    els.tabButtons = Array.from(root.querySelectorAll("[data-cc-tab-target]"));
    els.tabPanels = Array.from(root.querySelectorAll(".cc-tab-panel"));
    els.tabButtons.forEach((b) => b.addEventListener("click", () => activateTab(b.dataset.ccTabTarget)));
    els.form.addEventListener("submit", generate);
    els.clear.addEventListener("click", clearFiles);
    els.form.addEventListener("input", schedule);
    els.form.addEventListener("change", schedule);
    ["teacher", "student", "envelope"].forEach((k) => els[`export-${k}`] && els[`export-${k}`].addEventListener("click", () => exportPkg(k)));
    if (els.import) els.import.addEventListener("click", () => els["import-file"].click());
    if (els["import-file"]) els["import-file"].addEventListener("change", importPkg);
    if (els.project) els.project.addEventListener("click", project);
    if (window.CCWizard) window.CCWizard.init(els.form);
    update();
  }

  /** The launch and closing-class slides, full screen (the same slides as document 00). */
  async function project() {
    try {
      els.project.disabled = true;
      setStatus(t("Preparando la presentación…", "Preparing the presentation…"));
      const cfg = readConfig();
      state.assets = state.assets || await B.prepareAssets(cfg, () => {});
      const X = B.context(cfg, state.assets);
      window.CCProjector.open(window.SFSlides.html(window.SFSlides.build(X), X), { lang: LANG });
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus(t("No se ha podido preparar la presentación.", "The presentation could not be prepared."), true);
    } finally { els.project.disabled = false; }
  }

  function readConfig() {
    const num = (el, d) => { const v = Number(String(el && el.value).replace(",", ".")); return isFinite(v) && el.value !== "" ? v : d; };
    return B.normalize({
      lang: LANG, format: els.format.value, night: els.night.value || "2026-10-13", students: Math.round(num(els.students, 25)), level: els.level.value,
      investigation: { render: { frames: Math.round(num(els.frames, 240)), first: num(els.fcost, 12), step: num(els.fstep, 0.25), finish: /^\d{2}:\d{2}:\d{2}$/.test(els.finish.value) ? els.finish.value : "01:12:30" }, suiteRatio: num(els.suite, 0.64) },
    });
  }
  function writeConfig(cfg) {
    els.format.value = cfg.format; els.night.value = cfg.night; els.students.value = cfg.students; els.level.value = cfg.level;
    const r = cfg.investigation.render;
    els.frames.value = r.frames; els.fcost.value = r.first; els.fstep.value = r.step; els.finish.value = r.finish; els.suite.value = String(cfg.investigation.suiteRatio);
  }

  function schedule() { clearTimeout(state.timer); state.timer = setTimeout(update, 220); }
  function update() {
    const res = B.check(readConfig()), C = res.context, k = C.tokens;
    const row = ([a, b]) => `<li><span>${esc(a)}</span><strong>${esc(b)}</strong></li>`;
    const room = res.cfg.classroom, title = (k) => L(window.SFData.show.episodes.find((e) => e.id === k).title);
    const missing = [1, 2, 3, 4, 5, 6].filter((k) => !res.cfg.episodes.includes(k));
    if (els.groups) els.groups.innerHTML = `<table class="cc-groups"><thead><tr><th>${esc(t("Grupo", "Group"))}</th><th>${esc(t("Episodio", "Episode"))}</th><th>${esc(t("Estudiantes", "Students"))}</th></tr></thead><tbody>`
      + room.groups.map((g, k) => `<tr><td>${k + 1}</td><td>${g.episode} · ${esc(title(g.episode))}</td><td>${g.size}</td></tr>`).join("")
      + `<tr><td>${esc(t("Sospechosos", "Suspects"))}</td><td>${esc(room.pairs ? t("cinco parejas", "five pairs") : t("cinco estudiantes", "five students"))}</td><td>${room.suspects}</td></tr></tbody></table>`
      + (missing.length ? `<p class="cc-help">${esc(t(`Los episodios ${missing.join(", ")} llegan en el sobre como informe del laboratorio.`, `Episodes ${missing.join(", ")} arrive in the envelope as a lab report.`))}</p>` : "");
    els.summary.innerHTML = [
      [t("Estudiantes", "Students"), String(room.students)],
      [t("Grupos de investigación", "Investigation groups"), `${room.groups.length} (${room.groups.map((g) => g.size).join(", ")})`],
      [t("Sospechosos", "Suspects"), room.pairs ? t("5 parejas", "5 pairs") : "5"],
      [t("Formato", "Format"), t("lanzamiento + casa + 1 clase", "launch + home + 1 class")],
    ].map(row).join("") + `<li class="sf-solution-note">${esc(t("Cifras de la solución · no proyectar", "Solution figures · do not project"))}</li>` + [
      [t("Render: inicio real", "Render: real start"), k.renderStart],
      [t("Render: inicio ingenuo", "Render: naive start"), k.renderNaiveStart],
      [t("Sesión borrada", "Deleted session"), `${k.journalOpen}–${k.journalClose}`],
      [t("Copia filtrada", "Leaked copy"), `r = ${k.leakR}`],
    ].map(row).join("");
    const lines = [];
    if (res.ok) lines.push(`<p class="cc-note">${esc(t("Coherencia comprobada: con esta configuración la evidencia señala a un único culpable y todas las cifras de los documentos se recalculan.", "Consistency checked: with this configuration the evidence points to a single culprit and every figure in the documents is recomputed."))}</p>`);
    res.errors.forEach((e) => lines.push(`<p class="cc-note cc-warn">${esc(L(e))}</p>`));
    res.warnings.forEach((e) => lines.push(`<p class="cc-note">${esc(L(e))}</p>`));
    els.checks.innerHTML = lines.join("");
    els.generate.disabled = !res.ok;
    preview(res.cfg);
  }

  function preview(cfg) {
    const env = { SF: window.SFData, lang: LANG };
    const c = TR.evidenceFrame(env, "leak", 760, 428, { r: cfg.investigation.suiteRatio, user: "punto_z", forum: window.SFData.investigation.leak.forum[LANG], time: "07:40", frameLabel: "31/240" });
    c.style.width = "100%"; c.setAttribute("role", "img"); c.setAttribute("aria-label", t("Fotograma filtrado", "Leaked frame"));
    els.preview.innerHTML = "";
    const fig = document.createElement("figure"); fig.append(c);
    const cap = document.createElement("figcaption"); cap.textContent = t("Fotograma filtrado con la razón de la copia elegida", "Leaked frame with the chosen copy's ratio"); fig.append(cap);
    els.preview.append(fig);
  }

  async function generate(ev) {
    ev.preventDefault();
    clearFiles();
    const cfg = readConfig(), res = B.check(cfg);
    if (!res.ok) { setStatus(L(res.errors[0]), true); return; }
    setBusy(true);
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) throw new Error(t("No se ha cargado jsPDF. Revisa la conexión.", "jsPDF did not load. Check the connection."));
      if (!window.JSZip) throw new Error(t("No se ha cargado JSZip. Revisa la conexión.", "JSZip did not load. Check the connection."));
      const out = await B.build(cfg, (s) => setStatus(s));
      // the printing guide travels in both ZIPs
      const [sepZip, bunZip] = await Promise.all([zip(out.files), zip(out.guide ? [out.guide, ...out.bundles] : out.bundles)]);
      showFiles(out.files, out.bundles, out.complete,
        { label: t("Todos los documentos separados · ZIP", "All separate documents · ZIP"), fileName: `zeno_${t("documentos_separados", "separate_documents")}.zip`, blob: sepZip },
        { label: t("Todos los paquetes · ZIP", "All packets · ZIP"), fileName: `zeno_${t("paquetes", "packets")}.zip`, blob: bunZip });
      setStatus(t(`Listo: ${out.files.length} documentos, ${out.bundles.length} paquetes y el expediente completo.`, `Done: ${out.files.length} documents, ${out.bundles.length} packets and the complete case file.`));
    } catch (e) {
      console.error(e);
      setStatus(e.message || t("No se han podido generar los documentos.", "The documents could not be generated."), true);
    } finally { setBusy(false); }
  }

  // ---------------------------------------------------------------- packages
  function exportPkg(kind) {
    const pkg = B.exportPackage(readConfig(), kind);
    const blob = new Blob([JSON.stringify(pkg, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `zeno_${kind}.zeno.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function importPkg() {
    const f = els["import-file"].files[0];
    if (!f) return;
    const res = B.importPackage(await f.text());
    if (!res.ok) { els["import-status"].textContent = L(res.error); els["import-status"].className = "cc-note cc-warn"; return; }
    writeConfig(Object.assign({}, res.cfg, { lang: LANG }));
    els["import-status"].textContent = [t("Configuración importada.", "Configuration imported."), ...res.warnings.map(L)].join(" ");
    els["import-status"].className = "cc-note";
    update();
  }

  // ---------------------------------------------------------------- downloads (house standard)
  async function zip(files) {
    const z = new window.JSZip();
    files.forEach((f) => z.file(f.fileName, f.blob));
    return z.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }
  function showFiles(files, bundles, complete, sepZip, bunZip) {
    [...files, ...bundles, complete, sepZip, bunZip].forEach((f) => { f.url = URL.createObjectURL(f.blob); state.urls.push(f.url); });
    els.complete.href = complete.url; els.complete.download = complete.fileName; els.complete.classList.remove("cc-hidden");
    const guide = files.find((f) => f.id === "print");
    if (guide && els.printguide) { els.printguide.href = guide.url; els.printguide.download = guide.fileName; els.printguide.classList.remove("cc-hidden"); }
    els.bundles.innerHTML = [bunZip, ...bundles].map((f, k) => fileRow(f, k === 0)).join("");
    els.doclist.innerHTML = fileRow(sepZip, true) + files.map((f) => fileRow(f, false, f.teacher ? `${f.label} · ${t("Profesorado", "Teacher only")}` : f.confidential ? `${f.label} · ${t("Confidencial", "Confidential")}` : f.label)).join("");
    els.documents.classList.remove("cc-hidden");
    activateTab("sf-panel-bundles");
  }
  function fileRow(file, primary, title) {
    const label = esc(title || file.label);
    return `<div class="cc-file-row${primary ? " cc-primary" : ""}"><span class="cc-file-title">${label}</span><span class="cc-file-actions"><a class="cc-file-icon" href="${file.url}" target="_blank" rel="noopener" title="${t("Ver", "View")} ${label}" aria-label="${t("Ver", "View")} ${label}">${ICON_EYE}</a><a class="cc-file-icon" href="${file.url}" download="${esc(file.fileName)}" title="${t("Descargar", "Download")} ${label}" aria-label="${t("Descargar", "Download")} ${label}">${ICON_DOWN}</a></span></div>`;
  }
  const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
  const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke-width="2" stroke-linecap="round"/><path d="m7 10 5 5 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke-width="2" stroke-linecap="round"/></svg>';
  function clearFiles() {
    state.urls.forEach((u) => URL.revokeObjectURL(u)); state.urls = [];
    els.bundles.innerHTML = ""; els.doclist.innerHTML = "";
    els.complete.classList.add("cc-hidden"); els.complete.removeAttribute("href"); els.complete.removeAttribute("download");
    if (els.printguide) { els.printguide.classList.add("cc-hidden"); els.printguide.removeAttribute("href"); els.printguide.removeAttribute("download"); }
    els.documents.classList.add("cc-hidden");
    setStatus("");
  }
  function activateTab(id) {
    els.tabButtons.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.ccTabTarget === id)));
    els.tabPanels.forEach((p) => { p.hidden = p.id !== id; });
  }
  function setBusy(busy) { els.generate.disabled = busy; els.clear.disabled = busy; els.generate.textContent = busy ? t("Generando…", "Generating…") : t("Generar documentos", "Generate documents"); }
  function setStatus(msg, error) { els.status.textContent = msg; els.status.classList.toggle("cc-error", Boolean(error)); }
  function esc(v) { return String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }

  window.SFGenerator = { readConfig, writeConfig, update };
  init();
})();
