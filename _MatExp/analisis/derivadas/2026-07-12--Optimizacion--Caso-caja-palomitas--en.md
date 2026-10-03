---
title: "Calculus Cases: The Perfect Popcorn Box"
lang: en
page_id: matexp-optimal-popcorn-box-case
date: '2026-07-12 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - derivatives
  - optimization
taxonomy: experiment optimization analysis derivatives applications Calculus-Cases
permalink: "/MatExp/analysis/derivatives/optimal-popcorn-box/"
header:
  image: "/assets/MatExp/analisis/derivadas/caja-palomitas-optima/header-brand.jpg"
excerpt: "A possible large-scale fraud investigated through optimization: three teams build, test the evidence, and issue a mathematical opinion."
feature: "/assets/MatExp/analisis/derivadas/caja-palomitas-optima/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css">
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box.css">

A cinema chain is promoting its new container with a bold statement: **“The greatest-capacity box: more popcorn from the same cardstock.”** A consumer association alleges possible large-scale fraud affecting hundreds or thousands of customers. Police appoint a technical-forensic consultancy team to analyze the mathematical evidence independently and issue the final opinion.

The box is made from a rectangular sheet with sides \(L\) and \(W\). A square with side \(x\) is removed from each corner—always the same size—and the four sides are folded up. The height is \(x\), while the base measures \((L-2x)\times(W-2x)\), so

$$
V(x)=x(L-2x)(W-2x), \qquad 0<x<\frac{\min(L,W)}{2}.
$$

The generator calculates the optimal box for common paper formats or a custom sheet. It then creates a full-size template, the advertisement, the complaint, the fictional patent, independent dossiers for the Consumer Association, cinema, and police consultancy, and the teacher-only solution.

<section class="cc-case popcorn-case" data-lang="en" aria-label="Popcorn box case generator">
  <section class="cc-workspace">
    <form id="popcorn-form" class="cc-panel">
      <h2>Configure the case</h2>
      <div class="cc-form-grid">
        <label class="cc-full">Paper size
          <select id="paper-size" name="paperSize">
            <option value="a5">A5 — 210 × 148 mm</option>
            <option value="a4" selected>A4 — 297 × 210 mm</option>
            <option value="letter">US Letter — 279.4 × 215.9 mm</option>
            <option value="legal">US Legal — 355.6 × 215.9 mm</option>
            <option value="a3">A3 — 420 × 297 mm</option>
            <option value="tabloid">Tabloid — 431.8 × 279.4 mm</option>
            <option value="cardstock">12 × 18 in cardstock — 457.2 × 304.8 mm</option>
            <option value="custom">Custom dimensions</option>
          </select>
        </label>
        <label>Length (mm)
          <input id="paper-length" name="paperLength" type="number" min="50" max="1000" step="0.1" value="297" required>
        </label>
        <label>Width (mm)
          <input id="paper-width" name="paperWidth" type="number" min="50" max="1000" step="0.1" value="210" required>
        </label>
        <p class="cc-full cc-help">To prevent unwieldy templates, each side must measure between 50 and 1000 mm.</p>
        <label class="cc-full">Company name
          <input id="company-name" name="companyName" type="text" value="Horizon Cinemas" maxlength="80" required>
        </label>
        <label class="cc-full">Course or class
          <input id="course-name" name="courseName" type="text" value="Differential Calculus" maxlength="100" required>
        </label>
      </div>
      <div class="cc-actions">
        <button id="popcorn-generate" type="submit">Generate activity</button>
        <button id="popcorn-clear" class="cc-secondary" type="button">Clear downloads</button>
      </div>
      <div id="popcorn-status" class="cc-status" role="status" aria-live="polite"></div>
    </form>

    <aside class="cc-panel" aria-labelledby="popcorn-summary-title">
      <h2 id="popcorn-summary-title">Calculated optimal box</h2>
      <ul id="popcorn-summary" class="cc-summary"></ul>
      <div id="popcorn-preview" class="cc-preview"></div>
      <div class="cc-legend">
        <span><i class="cc-swatch cut"></i>Cut</span>
        <span><i class="cc-swatch fold"></i>Fold</span>
      </div>
    </aside>
  </section>

  <section id="popcorn-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="popcorn-documents-title">
    <h2 id="popcorn-documents-title">Activity documents</h2>
    <p class="cc-download-note">Use the role packets to distribute the activity. In each tab, the red ZIP downloads every file in that section; the icons let you view or download each file. The template uses a PDF page matching the exact sheet dimensions: print at 100%, without “fit to page.”</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="popcorn-panel-bundles" data-cc-tab-target="popcorn-panel-bundles">Role packets</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="popcorn-panel-separate" data-cc-tab-target="popcorn-panel-separate">Separate documents</button>
      <a id="popcorn-complete-pdf" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="popcorn-panel-bundles" class="cc-tab-panel" role="tabpanel">
      <div id="popcorn-bundles" class="cc-file-list"></div>
    </div>
    <div id="popcorn-panel-separate" class="cc-tab-panel" role="tabpanel" hidden>
      <div id="popcorn-doc-list" class="cc-file-list"></div>
    </div>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to calculate the box and create the PDFs.</p></noscript>
</section>

## Why the generated cut is optimal

Differentiating the volume function gives

$$
V'(x)=12x^2-4(L+W)x+LW.
$$

Its two roots are

$$
x=\frac{(L+W)\pm\sqrt{L^2-LW+W^2}}{6}.
$$

The root with the minus sign is the only one in the physical domain:

$$
x^*=\frac{(L+W)-\sqrt{L^2-LW+W^2}}{6}.
$$

The generator compares this critical point with the interval endpoints, where volume is zero, and also checks that \(V''(x^*)<0\). Therefore, \(x^*\) produces the global maximum within the model: a fixed rectangular sheet, four equal square cut-outs, an open box, and no added material.

The advertising, complaint, and patent documents are **fictional and for educational use only**. They are not real advertising, legal advice, or a patent filing.

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box-generator.js?v=20261003b"></script>
