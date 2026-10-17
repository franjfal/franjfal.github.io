/*
 * Calculus Cases — generic generator for the cases built on the shared kit.
 *
 * A case registers itself with CCGenerator.define(def) and its page carries the standard block
 * (ESTANDAR_WEB_ACTIVIDADES.md §3) with a guided form (cc-wizard.js):
 *   <section class="cc-case" data-case="<id>" data-lang="es|en"> … <form id="<id>-form">
 *   fields: <id>-students (number), <id>-format (a4|letter) and any case field with
 *   data-cc-field="<name>"; buttons <id>-generate, <id>-project, <id>-clear; outputs <id>-status,
 *   <id>-summary, <id>-groups, <id>-preview, <id>-documents, <id>-bundles, <id>-doclist,
 *   <id>-complete, <id>-printguide.
 *
 * def = {
 *   id, banner: "header-brand.jpg" (relative to the case's asset folder, given by def.base),
 *   defaults: {field: value},                         case fields with their default values
 *   classroom(cfg) -> {students, groups: [{label, role, size}], note?},
 *   context(cfg, t) -> X (anything the renderers need; t, cfg, lang are added),
 *   kicker(X), docs(X) -> [{id, n, title, teacher?, render(w, X), print: {who, copies, how, when}, count?}],
 *   bundles(X) -> [{id, label, docs: [ids], use}],
 *   slides(X) -> [slide] (cc-slides.js), guide(X) -> {before: [..], steps: [..], material: [..]},
 *   summary(X) -> [[label, value]], preview?(X, el),
 *   presentationPrint?(X) -> {who?, when?, ...} overrides the presentation's line in the printing guide
 * }
 * The kit adds the printing and distribution guide (first document, teacher packet and ZIPs),
 * the presentation (document 00, 16:9, also projected) and the complete file.
 * CCGenerator.build(id, cfg) is also exposed for headless rendering (kit/tools/render_case.py).
 */
(function (root) {
  "use strict";
  const DEFS = {};
  const PDF = () => root.CCPdf, SL = () => root.CCSlides;

  function stem(v) { return String(v || "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "documento"; }
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  async function assets(def) {
    if (def._assets) return def._assets;
    const A = {};
    try {
      const img = await loadImage(def.base + (def.banner || "header-brand.jpg"));
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      A.banner = { data: c.toDataURL("image/jpeg", 0.88), ratio: c.height / c.width };
    } catch (e) { A.banner = null; }
    if (def.assets) Object.assign(A, await def.assets());
    def._assets = A;
    return A;
  }

  function normalize(def, cfg) {
    const c = Object.assign({ lang: "es", format: "a4", students: def.studentsDefault || 24 }, def.defaults || {}, cfg || {});
    c.lang = c.lang === "en" ? "en" : "es";
    c.format = c.format === "letter" ? "letter" : "a4";
    c.students = Math.max(def.minStudents || 6, Math.min(def.maxStudents || 40, Math.round(Number(c.students) || 24)));
    return c;
  }

  function context(def, cfgIn, A) {
    const cfg = normalize(def, cfgIn), t = (es, en) => (cfg.lang === "en" ? en : es);
    const X = { cfg, lang: cfg.lang, t, A: A || {}, caseId: def.id };
    X.room = def.classroom(cfg, t);
    Object.assign(X, def.context ? def.context(cfg, t, X) || {} : {});
    X.kicker = def.kicker(X);
    return X;
  }

  // ------------------------------------------------------------------ documents
  function plan(def, X) {
    const t = X.t;
    const docs = [
      { id: "print", n: "", teacher: true, title: t("Guía de impresión y reparto", "Printing and distribution guide"), file: t("LEEME_guia_de_impresion_y_reparto.pdf", "README_printing_and_distribution_guide.pdf"), render: printGuide },
      { id: "presentation", n: "00", slides: true, title: t("Presentación del caso", "Case presentation"),
        print: Object.assign({ who: t("Para proyectar en el lanzamiento", "To project at the launch"), copies: t("Ninguna (1 por grupo si no hay proyector)", "None (1 per group without a projector)"), how: t("Apaisada 16:9, en color", "Landscape 16:9, in colour"), when: t("Lanzamiento", "Launch") }, def.presentationPrint ? def.presentationPrint(X) || {} : {}) },
      ...def.docs(X),
    ];
    const bundles = def.bundles(X);
    const teacher = bundles.find((b) => b.id === "teacher");
    if (teacher && !teacher.docs.includes("print")) teacher.docs.unshift("print");
    return { docs, bundles };
  }

  function writerFor(doc, X) { return PDF().writer(doc, { format: X.cfg.format, banner: X.A.banner, kicker: X.kicker, t: X.t }); }
  function buildDoc(def, spec, X) {
    let doc;
    if (spec.slides) {
      doc = PDF().newDoc(SL().SLIDE, "landscape");
      SL().pdf(doc, def.slides(X), { banner: X.A.banner, kicker: X.kicker, t: X.t });
    } else {
      doc = PDF().newDoc(X.cfg.format);
      spec.render(writerFor(doc, X), X, spec);
      PDF().footer(doc, spec.title, { t: X.t });
    }
    return { id: spec.id, label: spec.title, teacher: spec.teacher, fileName: spec.file || `${spec.n}_${stem(spec.title)}.pdf`, pages: doc.getNumberOfPages(), blob: doc.output("blob") };
  }
  function buildBundle(def, bundle, docs, X) {
    const doc = PDF().newDoc(X.cfg.format);
    bundle.docs.forEach((id, k) => {
      const spec = docs.find((d) => d.id === id);
      if (spec.slides) { if (k) doc.addPage(SL().SLIDE, "landscape"); SL().pdf(doc, def.slides(X), { banner: X.A.banner, kicker: X.kicker, t: X.t }); return; }
      if (k) doc.addPage(X.cfg.format, "portrait");
      spec.render(writerFor(doc, X), X, spec);
    });
    PDF().footer(doc, bundle.label, { t: X.t });
    return { id: bundle.id, label: bundle.label, fileName: `${def.id}_${stem(bundle.label)}.pdf`, blob: doc.output("blob") };
  }
  async function build(id, cfgIn, onStatus = () => {}) {
    const def = DEFS[id], A = await assets(def), X = context(def, cfgIn, A), t = X.t;
    const P = plan(def, X);
    X.plan = P;
    const files = [];
    for (const spec of P.docs.filter((d) => d.id !== "print")) { onStatus(`${t("Componiendo", "Composing")} ${spec.n} ${spec.title}…`); files.push(buildDoc(def, spec, X)); await new Promise((r) => setTimeout(r, 0)); }
    X.pages = Object.fromEntries(files.map((f) => [f.id, f.pages]));
    X.pages.print = 2;
    let guide = buildDoc(def, P.docs[0], X);
    if (guide.pages !== X.pages.print) { X.pages.print = guide.pages; guide = buildDoc(def, P.docs[0], X); }
    files.unshift(guide);
    const bundles = P.bundles.map((b) => buildBundle(def, b, P.docs, X));
    const complete = buildBundle(def, { id: "complete", label: t("Expediente completo", "Complete case file"), docs: P.docs.map((d) => d.id) }, P.docs, X);
    return { cfg: X.cfg, files, bundles, complete, guide, X };
  }

  /** The printing and distribution guide, the same five sections in every case. */
  function printGuide(w, X) {
    const { t } = X, P = X.plan, def = DEFS[X.caseId], G = def.guide(X), pages = (id) => String((X.pages || {})[id] || "");
    const paper = X.cfg.format === "letter" ? t("Carta", "Letter") : "A4";
    w.title(t("Guía de impresión y reparto", "Printing and distribution guide"), X.kicker, t("SOLO PROFESORADO", "TEACHER ONLY"));
    w.meta([[t("Papel", "Paper"), t(`${paper}, en vertical; la presentación (00), apaisada 16:9`, `${paper}, portrait; the presentation (00), landscape 16:9`)],
      [t("Clase", "Class"), t(`${X.room.students} estudiantes: ${X.room.groups.length} ${X.room.groups.length === 1 ? "grupo" : "grupos"} (${X.room.groups.map((g) => g.size).join(", ")})`, `${X.room.students} students: ${X.room.groups.length} ${X.room.groups.length === 1 ? "group" : "groups"} (${X.room.groups.map((g) => g.size).join(", ")})`)]]);
    w.heading(t("1. Antes de imprimir", "1. Before printing"));
    w.bullets([t("Imprime todo de la misma generación: los documentos de una generación coinciden entre sí. Si cambias la configuración, vuelve a imprimirlo todo.", "Print everything from the same generation: the documents of one generation agree with each other. If you change the configuration, print everything again."),
      t("La presentación (00) se proyecta: no hace falta imprimirla. Sin proyector, imprime una copia por grupo.", "The presentation (00) is projected: there is no need to print it. Without a projector, print one copy per group."),
      t("Escala al 100 % («tamaño real»), sin «ajustar a la página»; a doble cara por el borde largo.", "Scale 100% (\"actual size\"), without \"fit to page\"; double-sided along the long edge."), ...(G.before || [])]);
    w.heading(t("2. Documento a documento", "2. Document by document"), { keep: 40 });
    w.table([t("Documento", "Document"), t("Págs.", "Pages"), t("Quién lo recibe", "Who receives it"), t("Copias", "Copies"), t("Cómo se imprime", "How to print"), t("Cuándo", "When")],
      P.docs.filter((d) => d.print).map((d) => [`${d.n} ${d.title}`, pages(d.id), d.print.who, d.print.copies, d.print.how, d.print.when]), [33, 11, 30, 27, 42, 31], { zebra: true });
    const sheets = P.docs.filter((d) => d.count).reduce((s, d) => s + d.count * Number(pages(d.id) || 0), 0);
    if (sheets) w.paragraph(t(`En total, sin la presentación ni el material docente: unas ${Math.ceil(sheets / 2)} hojas a doble cara.`, `In total, without the presentation or the teacher's material: about ${Math.ceil(sheets / 2)} double-sided sheets.`), { size: 9.5, italic: true });
    w.heading(t("3. Los paquetes de la web", "3. The packets on the website"), { keep: 30 });
    w.paragraph(t("La pestaña «Paquetes por rol» reúne los documentos en un PDF por destinatario. Imprimir por paquetes da el mismo resultado que imprimir los documentos uno a uno.", "The \"Role packets\" tab gathers the documents into one PDF per recipient. Printing by packet gives the same result as printing the documents one by one."));
    const byId = (id) => P.docs.find((d) => d.id === id);
    w.table([t("Paquete", "Packet"), t("Contiene", "Contains"), t("Págs.", "Pages"), t("Para quién", "For whom")],
      P.bundles.map((b) => [b.label, b.docs.map((id) => (id === "print" ? t("esta guía", "this guide") : byId(id).n)).join(", "), String(b.docs.reduce((n, id) => n + Number(pages(id) || 0), 0)), b.use]), [44, 32, 12, 92], { zebra: true });
    w.heading(t("4. Reparto paso a paso", "4. Hand-outs step by step"), { keep: 30 });
    w.bullets(G.steps, true);
    if (G.material && G.material.length) { w.heading(t("5. Material adicional", "5. Additional material"), { keep: 24 }); w.bullets(G.material); }
  }

  // ------------------------------------------------------------------ the page
  function define(def) {
    DEFS[def.id] = def;
    const rootEl = document.querySelector(`.cc-case[data-case="${def.id}"]`);
    if (!rootEl) return;
    const scripts = document.querySelectorAll("script[src]");
    const me = Array.from(scripts).find((s) => s.src.includes(def.script || `${def.id}.js`));
    def.base = def.base || (me ? me.src.replace(/[^/]*$/, "") : "");
    const LANG = (rootEl.dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es";
    const t = (es, en) => (LANG === "en" ? en : es);
    const $ = (k) => document.getElementById(`${def.id}-${k}`);
    const els = {}; ["form", "students", "format", "generate", "project", "clear", "status", "summary", "groups", "preview", "checks", "documents", "bundles", "doclist", "complete", "printguide"].forEach((k) => { els[k] = $(k); });
    const urls = [];
    const readConfig = () => {
      const cfg = { lang: LANG, format: els.format ? els.format.value : "a4", students: els.students ? Number(els.students.value) : undefined };
      rootEl.querySelectorAll("[data-cc-field]").forEach((el) => { cfg[el.dataset.ccField] = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) : el.value; });
      return normalize(def, cfg);
    };
    const setStatus = (m, err) => { if (els.status) { els.status.textContent = m || ""; els.status.classList.toggle("cc-error", !!err); } };
    function update() {
      const X = context(def, readConfig(), def._assets);
      if (els.groups) els.groups.innerHTML = `<table class="cc-groups"><thead><tr><th>${t("Grupo", "Group")}</th><th>${t("Rol", "Role")}</th><th>${t("Estudiantes", "Students")}</th></tr></thead><tbody>`
        + X.room.groups.map((g) => `<tr><td>${esc(g.label)}</td><td>${esc(g.role)}</td><td>${g.size}</td></tr>`).join("") + "</tbody></table>"
        + (X.room.note ? `<p class="cc-help">${esc(X.room.note)}</p>` : "");
      if (els.summary) els.summary.innerHTML = def.summary(X).map(([a, b]) => `<li><span>${esc(a)}</span><strong>${esc(b)}</strong></li>`).join("");
      if (els.checks && def.checks) els.checks.innerHTML = def.checks(X).map((m) => `<p class="cc-note${m.warn ? " cc-warn" : ""}">${esc(m.text)}</p>`).join("");
      if (els.preview && def.preview) def.preview(X, els.preview);
    }
    function fileRow(f, primary, title) {
      const label = esc(title || f.label);
      return `<div class="cc-file-row${primary ? " cc-primary" : ""}"><span class="cc-file-title">${label}</span><span class="cc-file-actions"><a class="cc-file-icon" href="${f.url}" target="_blank" rel="noopener" title="${t("Ver", "View")} ${label}">${EYE}</a><a class="cc-file-icon" href="${f.url}" download="${esc(f.fileName)}" title="${t("Descargar", "Download")} ${label}">${DOWN}</a></span></div>`;
    }
    function clear() {
      urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
      if (els.bundles) els.bundles.innerHTML = ""; if (els.doclist) els.doclist.innerHTML = "";
      [els.complete, els.printguide].forEach((a) => { if (a) { a.classList.add("cc-hidden"); a.removeAttribute("href"); } });
      if (els.documents) els.documents.classList.add("cc-hidden");
      setStatus("");
    }
    async function zip(files) { const z = new root.JSZip(); files.forEach((f) => z.file(f.fileName, f.blob)); return z.generateAsync({ type: "blob", compression: "DEFLATE" }); }
    async function generate(ev) {
      ev.preventDefault(); clear();
      if (els.generate) els.generate.disabled = true;
      try {
        if (!root.jspdf || !root.JSZip) throw new Error(t("No se han cargado jsPDF o JSZip. Revisa la conexión.", "jsPDF or JSZip did not load. Check the connection."));
        const out = await build(def.id, readConfig(), setStatus);
        const sep = { label: t("Todos los documentos separados · ZIP", "All separate documents · ZIP"), fileName: `${def.id}_${t("documentos_separados", "separate_documents")}.zip`, blob: await zip(out.files) };
        const bun = { label: t("Todos los paquetes · ZIP", "All packets · ZIP"), fileName: `${def.id}_${t("paquetes", "packets")}.zip`, blob: await zip([out.guide, ...out.bundles]) };
        [...out.files, ...out.bundles, out.complete, sep, bun].forEach((f) => { f.url = URL.createObjectURL(f.blob); urls.push(f.url); });
        const set = (a, f) => { if (a) { a.href = f.url; a.download = f.fileName; a.classList.remove("cc-hidden"); } };
        set(els.complete, out.complete); set(els.printguide, out.guide);
        els.bundles.innerHTML = [bun, ...out.bundles].map((f, k) => fileRow(f, k === 0)).join("");
        els.doclist.innerHTML = fileRow(sep, true) + out.files.map((f) => fileRow(f, false, f.teacher ? `${f.label} · ${t("Profesorado", "Teacher only")}` : f.label)).join("");
        els.documents.classList.remove("cc-hidden");
        setStatus(t(`Listo: ${out.files.length} documentos, ${out.bundles.length} paquetes y el expediente completo.`, `Done: ${out.files.length} documents, ${out.bundles.length} packets and the complete case file.`));
      } catch (e) { console.error(e); setStatus(e.message || t("No se han podido generar los documentos.", "The documents could not be generated."), true); }
      finally { if (els.generate) els.generate.disabled = false; }
    }
    async function project() {
      const A = await assets(def), X = context(def, readConfig(), A);
      root.CCProjector.open(SL().html(def.slides(X), { banner: A.banner, kicker: X.kicker, t: X.t }), { lang: LANG });
    }
    if (els.form) {
      els.form.addEventListener("submit", generate);
      els.form.addEventListener("input", update); els.form.addEventListener("change", update);
      if (root.CCWizard) root.CCWizard.init(els.form);
    }
    if (els.project) els.project.addEventListener("click", project);
    if (els.clear) els.clear.addEventListener("click", clear);
    rootEl.querySelectorAll("[data-cc-tab-target]").forEach((b) => b.addEventListener("click", () => {
      rootEl.querySelectorAll("[data-cc-tab-target]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      rootEl.querySelectorAll(".cc-tab-panel").forEach((p) => { p.hidden = p.id !== b.dataset.ccTabTarget; });
    }));
    assets(def).then(update);
    update();
    def.readConfig = readConfig;
  }
  const EYE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
  const DOWN = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke-width="2"/><path d="m7 10 5 5 5-5" stroke-width="2"/><path d="M5 21h14" stroke-width="2"/></svg>';

  root.CCGenerator = {
    define, build, stem, defs: DEFS,
    context: (id, cfg) => context(DEFS[id], cfg, DEFS[id]._assets),
    /** Groups of about `size` students for roles repeated in order (A, B, C, A, B, C…). */
    rotate(students, roles, size = 4) {
      const n = Math.max(roles.length * 2, students), g = Math.max(roles.length, Math.round(n / size));
      return Array.from({ length: g }, (_, k) => ({ index: k, role: roles[k % roles.length], size: Math.floor(n / g) + (k < n % g ? 1 : 0) }));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
