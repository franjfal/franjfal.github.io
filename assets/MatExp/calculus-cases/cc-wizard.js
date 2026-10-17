/*
 * Calculus Cases — guided configurator, shared by every activity generator.
 *
 * Turns a generator form into steps: each <section class="cc-step" data-cc-step-title="…">
 * becomes one step, with a numbered progress bar, Back / Next buttons and, on the first step,
 * a button that skips straight to the last one with the recommended settings. The form's own
 * fields, ids and submit button are untouched, so the generator keeps reading them as before.
 * Without JavaScript every step stays visible.
 *
 *   CCWizard.init(form, { onStep(index) {} })  ->  { go(index), get step() }
 */
(function () {
  "use strict";
  function init(form, opts = {}) {
    const steps = Array.from(form.querySelectorAll(".cc-step"));
    if (!steps.length) return null;
    const lang = ((form.closest("[data-lang]") || document.documentElement).dataset.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es";
    const t = (es, en) => (lang === "en" ? en : es);
    const last = steps.length - 1;
    form.classList.add("cc-wizard");

    const bar = document.createElement("ol");
    bar.className = "cc-steps";
    const items = steps.map((s, k) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.title = s.dataset.ccStepTitle || "";
      b.innerHTML = `<span class="cc-step-number">${k + 1}</span><span class="cc-step-title">${s.dataset.ccStepTitle || ""}</span>`;
      b.addEventListener("click", () => go(k));
      li.append(b);
      bar.append(li);
      return b;
    });
    steps[0].before(bar);

    const nav = document.createElement("div");
    nav.className = "cc-step-nav";
    const back = button(t("← Atrás", "← Back"), "cc-secondary", () => go(cur - 1));
    const next = button(t("Siguiente →", "Next →"), "cc-primary-button", () => go(cur + 1));
    const quick = button(t("Usar la configuración recomendada", "Use the recommended settings"), "cc-secondary cc-step-quick", () => go(last));
    nav.append(back, quick, next);
    steps[last].after(nav);

    let cur = 0;
    function go(k) {
      cur = Math.max(0, Math.min(last, k));
      steps.forEach((s, i) => { s.hidden = i !== cur; });
      items.forEach((b, i) => {
        b.setAttribute("aria-current", i === cur ? "step" : "false");
        b.classList.toggle("cc-done", i < cur);
      });
      back.hidden = cur === 0;
      next.hidden = cur === last;
      quick.hidden = cur !== 0;
      if (opts.onStep) opts.onStep(cur);
      const focus = steps[cur].querySelector("input, select, textarea, button");
      if (focus && k !== 0) focus.focus({ preventScroll: true });
    }
    function button(label, cls, fn) {
      const b = document.createElement("button");
      b.type = "button"; b.className = cls; b.textContent = label;
      b.addEventListener("click", fn);
      return b;
    }
    go(0);
    return { go, get step() { return cur; } };
  }
  window.CCWizard = { init };
})();
