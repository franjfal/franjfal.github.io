/*
 * Proofline's layer over Verso's literate pages (see verso-overlay.css).
 *
 * Verso writes every page with <base href> pointing at the documentation's
 * root, and Proofline publishes that root as docs/ inside a version folder
 * whose formalization.json describes the verification. This script reads it
 * and adds what Verso does not know: the way back to the formalization, the
 * version being read, and each declaration's verification status and the
 * article statement it formalizes. It never changes Verso's own content.
 */
(function () {
  "use strict";

  // English, like the rest of the formalization pages.
  var LABELS = {
    verified: "Verified", partial: "Partial (sorry)", axioms: "Unjustified axioms", failed: "Failed", untrusted: "Not checked",
    back: "Back to the formalization", lean: "Lean formalizations", research: "Research",
    formalizes: "Formalizes", axiomsUsed: "Axioms", none: "none", old: "You are reading public version v{n}. ",
    latest: "See the latest version", preview: "Proofline preview: not published yet."
  };

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function link(href, className, text) {
    var node = element("a", className, text);
    node.href = href;
    return node;
  }

  /** A statement's optional title as plain words; one that is only a citation says nothing. */
  function plainTitle(title) {
    var text = String(title || "")
      .replace(/\\cite(?:\[[^\]]*\])?\{([^{}]*)\}/g, "[$1]")
      .replace(/\\[a-zA-Z]+\s*/g, "")
      .replace(/[{}]/g, "")
      .replace(/~/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return /^\[[^\]]*\]$/.test(text) ? "" : text;
  }

  function badge(status, t) {
    return element("span", "pl-status " + status, t[status] || status);
  }

  function apply(data) {
    var t = LABELS;
    var versionRoot = new URL("../", document.baseURI);
    var resolve = function (href) { return href ? new URL(href, versionRoot).href : null; };
    var site = data.site || {};

    var bar = element("div", "pl-sitebar");
    bar.setAttribute("role", "navigation");
    if (site.title) bar.appendChild(link(site.home || "/", "pl-site", site.title));
    var crumbs = element("div", "pl-crumbs");
    if (site.research) { crumbs.appendChild(link(site.research, "", site.research_label || t.research)); crumbs.appendChild(element("span", "pl-sep", "›")); }
    if (site.lean_index) { crumbs.appendChild(link(site.lean_index, "", t.lean)); crumbs.appendChild(element("span", "pl-sep", "›")); }
    crumbs.appendChild(element("strong", "", data.title + (data.version ? " · v" + data.version : "")));
    bar.appendChild(crumbs);
    bar.appendChild(element("span", "pl-spacer"));
    var actions = element("div", "pl-actions");
    var arxiv = (data.article || {}).arxiv;
    if (arxiv) {
      var source = link(arxiv.url, "pl-arxiv", arxiv.label);
      source.target = "_blank";
      source.rel = "noopener";
      actions.appendChild(source);
    }
    if (data.verification && data.verification.status) actions.appendChild(badge(data.verification.status, t));
    var back = link(resolve((data.links && data.links.overview_relative) || "./"), "pl-back", "← ");
    back.title = t.back;
    back.appendChild(element("span", "pl-back-text", t.back));
    actions.appendChild(back);
    bar.appendChild(actions);
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("pl-framed");
    // Verso's mobile menu is positioned against the window; it opens below the bar.
    var measure = function () { document.documentElement.style.setProperty("--pl-bar-height", bar.offsetHeight + "px"); };
    measure();
    window.addEventListener("resize", measure);

    var content = document.querySelector(".code-content");
    if (content && (data.preview || (data.latest_version && data.version && data.version !== data.latest_version))) {
      var banner = element("div", "pl-banner" + (data.preview ? "" : " old"));
      if (data.preview) banner.textContent = t.preview;
      else {
        banner.textContent = t.old.replace("{n}", data.version);
        if (data.links && data.links.latest_docs) banner.appendChild(link(data.links.latest_docs, "", t.latest + " (v" + data.latest_version + ")"));
      }
      content.insertBefore(banner, content.firstChild);
    }

    // Labels in the prose (lem:K, eq:partial) as the article calls them:
    // Lemma 2.3, (7). The label stays as the element's title.
    var names = {};
    (data.statements || []).forEach(function (statement) {
      if (statement.label && statement.number) names[statement.label] = statement.display + " " + statement.number;
    });
    Object.keys(data.references || {}).forEach(function (label) { names[label] = data.references[label]; });
    Array.prototype.forEach.call(document.querySelectorAll(".verso-text code:not(.math), .md-text code:not(.math)"), function (code) {
      var label = code.textContent.trim();
      var name = names[label];
      if (!name || code.closest(".hl.lean")) return;
      var before = "";
      for (var node = code.previousSibling; node; node = node.previousSibling) before = node.textContent + before;
      var shown = name;
      var word = /^(.*\S)\s+(\S+)$/.exec(name);
      var open = (before.match(/\(/g) || []).length > (before.match(/\)/g) || []).length;
      if (name.charAt(0) === "(" && open) shown = name.slice(1, -1);
      else if (word && name.charAt(0) !== "(" && new RegExp(word[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s~]*$").test(before)) shown = word[2];
      var reference = element("span", "pl-ref", shown);
      reference.title = label;
      code.parentNode.replaceChild(reference, code);
    });

    // Verso names each declaration's anchor with a slug of its full name.
    var byAnchor = {};
    (data.declarations || []).forEach(function (declaration) { byAnchor[declaration.anchor || declaration.name] = declaration; });
    var statements = {};
    (data.statements || []).forEach(function (statement) {
      (statement.lean || []).forEach(function (name) { (statements[name] = statements[name] || []).push(statement); });
    });
    // Each declaration's status and the article result it formalizes, next to
    // its name. The labels are drawn by CSS from data-label, so the code box's
    // copy button never copies them along with the Lean code.
    var anchors = document.querySelectorAll(".code-box .const.token[id]");
    Array.prototype.forEach.call(anchors, function (anchor) {
      var declaration = byAnchor[anchor.id];
      if (!declaration || (anchor.nextSibling && anchor.nextSibling.className === "pl-inline")) return;
      var inline = element("span", "pl-inline");
      var chip = element("span", "pl-status " + declaration.status);
      chip.setAttribute("data-label", t[declaration.status] || declaration.status);
      chip.setAttribute("role", "img");
      chip.setAttribute("aria-label", t[declaration.status] || declaration.status);
      inline.appendChild(chip);
      (statements[declaration.name] || []).forEach(function (statement) {
        var title = plainTitle(statement.title);
        var label = statement.display + (statement.number ? " " + statement.number : "") + (title ? " (" + title + ")" : "");
        var ref = link(resolve("./#statement-" + encodeURIComponent(statement.key)), "pl-paper-ref", "");
        ref.setAttribute("data-label", t.formalizes + " " + label);
        ref.setAttribute("aria-label", t.formalizes + " " + label);
        inline.appendChild(ref);
      });
      var extra = (declaration.axioms || []).filter(function (axiom) { return ["propext", "Classical.choice", "Quot.sound", "sorryAx"].indexOf(axiom) < 0; });
      if (extra.length) {
        var axioms = element("span", "pl-axioms");
        axioms.setAttribute("data-label", t.axiomsUsed + ": " + extra.join(", "));
        inline.appendChild(axioms);
      }
      anchor.parentNode.insertBefore(inline, anchor.nextSibling);
    });
  }

  function start() {
    var url = new URL("../formalization.json", document.baseURI);
    fetch(url.href, { credentials: "same-origin" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) { if (data) apply(data); })
      .catch(function () { /* the documentation stays readable without the overlay */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
