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
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016d">
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box.css?v=20261016b">

A cinema chain is promoting its new container with a bold statement: **“The greatest-capacity box: more popcorn from the same cardstock.”** A consumer association says it has built, from the same sheet, a box that holds more popcorn, and alleges possible large-scale fraud. The Chief Inspector, a role the teacher takes on, divides the case among three teams: the **Consumer Association** builds boxes with different cuts and makes the allegation; the **cinema team** builds the box registered in the patent; and the **police technical-forensic consultancy** works out on its own, without seeing the patent, which box is the largest, and issues the opinion.

The case follows the format of every Calculus Case, with one difference: the boxes are built in class, because it is cheap and it is the most enjoyable part.

1. **Launch, at the end of a class (15–20 min).** You project the presentation: the advertisement, the complaint, the question and the three teams of your class. Each pair or group receives its packet, and each Association pair chooses its cut.
2. **At home.** The consultancy models, differentiates and proves the maximum without knowing the patent (45–60 min); the Association works out the volume its cut predicts and the cinema prepares the construction (15–20 min).
3. **Closing class (60 min).** The boxes are built and measured (phase 1, 25 min); the consultancy receives the complaint and the patent and, with the popcorn, the transfer test is run (phase 2, 15 min); the consultancy issues its opinion (12 min) and every student does an individual check (5 min).

The box is made from a rectangular sheet with sides \(L\) and \(W\). A square with side \(x\) is removed from each corner—always the same size—and the four sides are folded up. The height is \(x\), while the base measures \((L-2x)\times(W-2x)\), so

$$
V(x)=x(L-2x)(W-2x), \qquad 0<x<\frac{\min(L,W)}{2}.
$$

## Materials generator

The configurator guides you in four steps. The only essential setting is the number of students: from it, the website forms the three teams and works out how many copies of each document to print and how many sheets and how much popcorn you need. Everything else already has a recommended value.

<section class="cc-case popcorn-case" data-lang="en" aria-label="Popcorn box case generator">
  <section class="cc-workspace">
    <form id="popcorn-form" class="cc-panel" novalidate>
      <h2>Configure the case</h2>
      <section class="cc-step" data-cc-step-title="Your class">
        <h3>1. Your class</h3>
        <p class="cc-step-help">How many students do you have? The Consumer Association is the largest team, between half and two thirds of the class, and works in pairs, each with its own cut. The cinema team and the police consultancy are two small teams; with five consultants or more, the consultancy splits into two groups that give separate opinions.</p>
        <label>Number of students
          <input id="popcorn-students" type="number" min="9" max="40" step="1" value="24">
        </label>
        <div id="popcorn-teams" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="The sheet">
        <h3>2. The sheet</h3>
        <p class="cc-step-help">The size of the sheet every box is built from. A4 is recommended: cheap and easy to cut. Every figure in the case, the full-size template and the solution depend on this sheet. The documents print on A4, or on Letter when the sheet is a US format.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Paper size
            <select id="paper-size" name="paperSize">
              <option value="a5">A5 — 210 × 148 mm</option>
              <option value="a4" selected>A4 — 297 × 210 mm (recommended)</option>
              <option value="letter">US Letter — 279.4 × 215.9 mm</option>
              <option value="legal">US Legal — 355.6 × 215.9 mm</option>
              <option value="a3">A3 — 420 × 297 mm</option>
              <option value="tabloid">Tabloid — 431.8 × 279.4 mm</option>
              <option value="cardstock">Cardstock 12 × 18 in — 457.2 × 304.8 mm</option>
              <option value="custom">Custom dimensions</option>
            </select>
          </label>
          <label>Length (mm)
            <input id="paper-length" name="paperLength" type="number" min="50" max="1000" step="0.1" value="297" required>
          </label>
          <label>Width (mm)
            <input id="paper-width" name="paperWidth" type="number" min="50" max="1000" step="0.1" value="210" required>
          </label>
          <p class="cc-full cc-help">To avoid unwieldy templates, each side must measure between 50 and 1000 mm.</p>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Customise (optional)">
        <h3>3. Customise (optional)</h3>
        <p class="cc-step-help">You can leave everything as it is. The company name appears on the advertisement, the complaint, the patent and the dossiers; the course, on the header of each document. Neither changes the mathematics.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Company name
            <input id="company-name" name="companyName" type="text" value="Horizon Cinemas" maxlength="80" required>
          </label>
          <label class="cc-full">Course or class
            <input id="course-name" name="courseName" type="text" value="Differential Calculus" maxlength="100" required>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generate">
        <h3>4. Generate</h3>
        <p class="cc-step-help">The website builds the documents for this class. Start with the printing and distribution guide: it says what to print, how many copies and when each item is handed out. The presentation is projected from here, at the launch and in the closing class.</p>
        <div class="cc-actions">
          <button id="popcorn-generate" type="submit">Generate documents</button>
          <button id="popcorn-project" class="cc-secondary" type="button">Project the presentation</button>
          <button id="popcorn-clear" class="cc-secondary" type="button">Clear downloads</button>
        </div>
        <div id="popcorn-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="popcorn-summary-title">
      <h2 id="popcorn-summary-title">Case file summary</h2>
      <ul id="popcorn-summary" class="cc-summary"></ul>
      <div>
        <div id="popcorn-preview" class="cc-preview"></div>
        <div class="cc-legend">
          <span><i class="cc-swatch cut"></i>Cut</span>
          <span><i class="cc-swatch fold"></i>Fold</span>
        </div>
      </div>
    </aside>
  </section>

  <section id="popcorn-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="popcorn-documents-title">
    <h2 id="popcorn-documents-title">Activity documents</h2>
    <p class="cc-download-note">Start with the <strong>printing and distribution guide</strong>: it says what to print, how, how many copies and when each document is handed out. The teacher packet contains the solution and must not circulate. In each tab, the red row downloads a ZIP with all its content; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="popcorn-panel-bundles" data-cc-tab-target="popcorn-panel-bundles">Role packets</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="popcorn-panel-separate" data-cc-tab-target="popcorn-panel-separate">Separate documents</button>
      <a id="popcorn-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Printing and distribution guide</a>
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

The generator compares this critical point with the interval endpoints, where volume is zero, and also checks that \(V''(x^*)<0\). Therefore, \(x^*\) produces the global maximum within the model: a fixed rectangular sheet, four equal square cut-outs, an open box, and no added material. Near the optimum the volume curve is almost flat, which is why popcorn can hardly tell a good box from the best one: what settles the case is the derivative.

<p class="cc-disclaimer">The advertising, complaint, and patent documents are fictional and for educational use only. They are not real advertising, legal advice, or a patent filing.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016c"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box-generator.js?v=20261016c"></script>
