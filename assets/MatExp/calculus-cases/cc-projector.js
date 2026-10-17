/*
 * Calculus Cases — slide projector, shared by every activity.
 *
 * CCProjector.open(slides, { lang, start }) shows full-screen slides over the page:
 * slides = [{ kicker, title, html, banner? (image URL) }]. Arrow keys, space, clicks on the
 * right or left half and the on-screen buttons move between slides; Esc closes. The content
 * comes from each case (in Case 7, sf-slides.js), so what is projected is what is printed.
 */
(function () {
  "use strict";
  let overlay = null;
  function open(slides, opts = {}) {
    if (!slides || !slides.length) return;
    close();
    const lang = (opts.lang || document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es";
    const t = (es, en) => (lang === "en" ? en : es);
    overlay = document.createElement("div");
    overlay.className = "ccp";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", t("Presentación", "Presentation"));
    overlay.innerHTML = `<div class="ccp-slide" aria-live="polite"></div>
      <div class="ccp-bar"><button type="button" data-ccp="prev" aria-label="${t("Anterior", "Previous")}">←</button>
      <span class="ccp-count"></span><button type="button" data-ccp="next" aria-label="${t("Siguiente", "Next")}">→</button>
      <button type="button" data-ccp="close" aria-label="${t("Cerrar", "Close")}">✕</button></div>`;
    document.body.append(overlay);
    const box = overlay.querySelector(".ccp-slide"), count = overlay.querySelector(".ccp-count");
    let k = Math.max(0, Math.min(slides.length - 1, opts.start || 0));
    function show() {
      const s = slides[k];
      box.innerHTML = (s.banner ? `<img class="ccp-banner" src="${s.banner}" alt="">` : "")
        + `<p class="ccp-kicker">${s.kicker || ""}</p><h2>${s.title || ""}</h2><div class="ccp-body">${s.html || ""}</div>`;
      count.textContent = `${k + 1} / ${slides.length}`;
    }
    const go = (d) => { k = Math.max(0, Math.min(slides.length - 1, k + d)); show(); };
    overlay.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ccp]");
      if (b) { e.stopPropagation(); if (b.dataset.ccp === "close") close(); else go(b.dataset.ccp === "next" ? 1 : -1); return; }
      go(e.clientX > window.innerWidth / 2 ? 1 : -1);
    });
    overlay._key = (e) => {
      if (e.key === "Escape") close();
      else if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(1); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(-1); }
    };
    document.addEventListener("keydown", overlay._key);
    if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
    show();
  }
  function close() {
    if (!overlay) return;
    document.removeEventListener("keydown", overlay._key);
    if (document.fullscreenElement === overlay && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    overlay.remove();
    overlay = null;
  }
  window.CCProjector = { open, close };
})();
