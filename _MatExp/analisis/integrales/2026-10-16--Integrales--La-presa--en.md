---
title: "Calculus Cases: the dam"
lang: en
page_id: matexp-dam-case
date: '2026-10-16 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - calculus
  - integrals
taxonomy: experiment integrals accumulation volume analysis calculus Calculus-Cases
permalink: "/MatExp/analysis/integrals/the-dam/"
header:
  image: "/assets/MatExp/analisis/integrales/presa/header-brand.jpg"
excerpt: "A storm is moving toward an almost full reservoir. A committee of three specialists must choose how much water to release without flooding the town downstream: two integrals, one across space and one across time, decide."
feature: "/assets/MatExp/analisis/integrales/presa/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016a">

The **Valdemora** reservoir is close to its operating limit and a storm is moving toward the valley. For three hours the river will bring far more water than usual, and six kilometers downstream lies the town of Sotobarca, whose lower streets flood if the dam releases too much. The Chief Inspector, a role played by the teacher, forms one committee for every three students: it must choose a constant release that keeps the reservoir below its limit **during the whole storm** without harming the town.

Nobody on the committee holds all the information. The **topography** specialist has the survey of the reservoir's submerged sections and computes the water already there; the **hydrology** specialist has the inflow forecast and computes the water still to come; and the **town's representative** knows the town's limit and the report of an earlier storm in which the reservoir exceeded its limit even though the final value said otherwise. The decision needs two integrals in sequence, the first across space and the second across time, and an understanding of what each one measures.

The case follows the format of every Calculus Case:

1. **Launch, at the end of a class (18 min).** You project the presentation: the storm, what the unit needs, the units of the case's three quantities and the class's committees. Every student receives Sheet A, the common one, and the sheet of their specialty.
2. **At home (45–60 min).** Each specialist solves their sheet: the initial volume, the inflow and the formula for the volume, or the town's limit and the precedent.
3. **Closing class (55 min).** Each committee meets, decides and signs a recommendation; a public hearing with a last-minute warning, a formalization and an individual check follow.

$$
V_0=\int_0^{2000} A(x)\,dx \qquad\Big|\qquad V(t)=V_0+\int_0^{t}\bigl(q(u)-r\bigr)\,du \qquad\Big|\qquad V(t)\le 48 \ \text{ for every } t\in[0,3]
$$

## Materials generator

The configurator guides you in four steps. The only thing you must enter is the number of students: from it, the website forms the committees of three specialists and works out how many copies of each sheet to print. Everything else already has a recommended value, the same as in the book.

<section class="cc-case dam-case" data-case="dam" data-lang="en" aria-label="Generator for the case The Dam">
  <section class="cc-workspace">
    <form id="dam-form" class="cc-panel" novalidate>
      <h2>Set up the case</h2>
      <section class="cc-step" data-cc-step-title="Your class">
        <h3>1. Your class</h3>
        <p class="cc-step-help">How many students do you have? Each committee has three specialists: topography, hydrology and the town. One or two students left over join the last committees as a second topography or hydrology specialist, who solve the same sheet separately and compare.</p>
        <label>Number of students
          <input id="dam-students" type="number" min="3" max="45" step="1" value="24">
        </label>
        <div id="dam-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Paper">
        <h3>2. Paper</h3>
        <p class="cc-step-help">The paper size of the sheets. The presentation is projected and is always landscape (16:9).</p>
        <div class="cc-form-grid">
          <label>Paper
            <select id="dam-format"><option value="a4" selected>A4</option><option value="letter">Letter</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Customize (optional)">
        <h3>3. Customize (optional)</h3>
        <p class="cc-step-help">You can leave everything as it is. The names change the reservoir and the town in every document. The second-storm data let you run the case again with another group: the sections, the forecast and the limits change, but the integrals stay exact and the decision still has exactly one admissible option.</p>
        <div class="cc-form-grid">
          <label>Name of the reservoir <input id="dam-reservoir" type="text" maxlength="40" value="Valdemora" data-cc-field="reservoir"></label>
          <label>Name of the town <input id="dam-town" type="text" maxlength="40" value="Sotobarca" data-cc-field="town"></label>
          <label class="cc-full">Case data
            <select id="dam-scenario" data-cc-field="scenario"><option value="book" selected>Those in the book (recommended)</option><option value="second">Second storm (other data)</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generate">
        <h3>4. Generate</h3>
        <p class="cc-step-help">The website composes this class's documents. Start with the printing and distribution guide: it says what to print, how many copies and when each item is handed out. The presentation is projected from here.</p>
        <div class="cc-actions">
          <button id="dam-generate" type="submit">Generate documents</button>
          <button id="dam-project" class="cc-secondary" type="button">Project the presentation</button>
          <button id="dam-clear" class="cc-secondary" type="button">Clear downloads</button>
        </div>
        <div id="dam-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="dam-summary-title">
      <h2 id="dam-summary-title">Case file summary</h2>
      <ul id="dam-summary" class="cc-summary"></ul>
      <div id="dam-preview" class="cc-preview" aria-live="polite">Loading the preview…</div>
    </aside>
  </section>

  <section id="dam-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="dam-documents-title">
    <h2 id="dam-documents-title">Activity documents</h2>
    <p class="cc-download-note">Start with the <strong>printing and distribution guide</strong>: it says what to print, how, how many copies and when each document is handed out. The teacher packet contains the solution and must not circulate. In each tab, the red row downloads a ZIP with all its content; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="dam-panel-bundles" data-cc-tab-target="dam-panel-bundles">Role packets</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="dam-panel-separate" data-cc-tab-target="dam-panel-separate">Separate documents</button>
      <a id="dam-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Printing and distribution guide</a>
      <a id="dam-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="dam-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="dam-bundles" class="cc-file-list"></div></div>
    <div id="dam-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="dam-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to create the PDFs.</p></noscript>
</section>

## Two integrals and one idea of accumulation

| Specialist | Mathematics | What they bring to the committee |
|---|---|---|
| Topography (Sheet B) | Volume by sections: sums of slices \\(A(x_i)\,\Delta x\\) and the integral \\(\int_0^{2000} A(x)\,dx\\) | The water already in the reservoir, \\(V_0\\) |
| Hydrology (Sheet C) | Accumulation in time: \\(\int_0^3 q(t)\,dt\\) and the balance \\(V(t)=V_0+\int_0^t (q-r)\\) | The water still to come and the volume at each moment |
| Town (Sheet D) | The maximum of a function on an interval; the sign of \\(V'\\) | Which releases the town accepts and why a final value is not enough |

The two integrals of the case share one structure: a density or a rate multiplied by the right increment and added up. The first rebuilds across space a quantity that is already there, the stored water; the second accumulates across time a quantity that has not arrived yet. The committee can only decide once it joins them in the balance \\(V(t)=V_0+\int_0^t (q(u)-r)\,du\\), with the release subtracted.

The decision is correct for two reasons worth keeping apart. The first is a check over the whole interval, not only at its end: since \\(V'(t)=q(t)-r\\) is positive with any release the gate allows, the volume keeps rising and its maximum is at \\(t=3\\). The precedent on Sheet D shows what happens when that fails: a final volume below the limit that hides a maximum above it. The second reason is that the option that lowers the reservoir most is exactly the one the town does not accept, so only one is left. If the committee could choose any release, there would be a whole range of valid options; the uniqueness comes from the list, not from the mathematics. The hearing ends by measuring the margin: how wrong the forecast could be before no option would do.

<p class="cc-disclaimer">The reservoir, the town, the people, the reports and the data are fictional and purely educational. The case's decision says nothing about the safety of a real dam. The header and card illustrations are drawn by program.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-generator.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/integrales/presa/dam.js?v=20261017a"></script>
