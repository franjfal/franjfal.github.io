---
title: "Calculus Cases: the Vektor calculator"
lang: en
page_id: matexp-vektor-case
date: '2026-10-16 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - calculus
  - taylor
taxonomy: experiment polynomials Taylor approximation error analysis calculus Calculus-Cases
permalink: "/MatExp/analysis/calculus/taylor/vektor-calculator/"
header:
  image: "/assets/MatExp/analisis/calculo/calculadora-vektor/header-brand.jpg"
excerpt: "A stolen calculator approximated the exponential with a Taylor polynomial; another one, found at a rival workshop, gives almost the same readings. Is it a copy? The mathematics says how alike they are, and also where what it can prove comes to an end."
feature: "/assets/MatExp/analisis/calculo/calculadora-vektor/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016a">

Three weeks ago **Argen Labs** was broken into, and the prototype of the AE-3 was taken: an experimental calculator that estimates $$e^x$$ by adding up terms. Yesterday a device that does the same turned up at **Vektor Mechanical**, and its technical director says it is Vektor's own design. The Chief Inspector, a role played by the teacher, will not hear of theft before knowing how alike the two methods are and where they part. Each team brings together three specialists: the **archive** holds Argen's design note and rebuilds its polynomial; **inspection** holds the readings of the seized device, but no drawing; **validation** holds the reference values and the tolerance. No sheet is enough on its own.

The twist of the case is that the supposed copy passes the tests and the original does not: the Vektor readings carry one more Taylor term. And still, three readings do not identify a mechanism, let alone say who built it.

The case follows the format of every Calculus Case:

1. **Launch, at the end of a class (18 min).** Two entry questions and the projected presentation: the case, the Chief Inspector's request, the three roles and the class's teams. Each student receives the sheet of their role (A, B or C).
2. **At home (45–60 min per team).** Each specialist works on their sheet alone, and then the team meets, in person or online, and exchanges the data aloud: the polynomial $$P_3$$ and its outputs, the differences from the readings and a correction that fits them, the errors and the verdict of the tolerance.
3. **Closing class (55 min).** Pooling; the **term strips** (sheet D, one per team), which turn each term into something laid on the table and added with its sign; a hearing in which each team says what it certifies, what it conjectures and what is missing; the formalization, the team's opinion and an individual check.

$$
P_3(x)=1+x+\frac{x^2}{2}+\frac{x^3}{6}\qquad\Big|\qquad Q_4(x)=P_3(x)+\frac{x^4}{24}
$$

$$
|e^x-P_n(x)|\le\frac{e\,|x|^{n+1}}{(n+1)!}\quad (|x|\le 1)
$$

## Materials generator

The configurator guides you through four steps. The only essential setting is the number of students: from it, the website forms the teams of three specialists (with one or two of four if students are left over) and works out how many copies of each sheet to print. Everything else already has a recommended value, which is the book's.

<section class="cc-case vektor-case" data-case="vektor" data-lang="en" aria-label="Generator for the case The Vektor Calculator">
  <section class="cc-workspace">
    <form id="vektor-form" class="cc-panel" novalidate>
      <h2>Configure the case</h2>
      <section class="cc-step" data-cc-step-title="Your class">
        <h3>1. Your class</h3>
        <p class="cc-step-help">How many students do you have? The website forms teams of three specialists: archive (A), inspection (B) and validation (C). If the number is not a multiple of three, one or two teams have four members, and in them two students share a role and a sheet (inspection first, then archive).</p>
        <label>Number of students
          <input id="vektor-students" type="number" min="6" max="45" step="1" value="24">
        </label>
        <div id="vektor-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Paper">
        <h3>2. Paper</h3>
        <p class="cc-step-help">The paper size of every document; they are all printed in portrait. The presentation is landscape and is projected.</p>
        <div class="cc-form-grid">
          <label>Paper
            <select id="vektor-format"><option value="a4" selected>A4</option><option value="letter">Letter</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Customise (optional)">
        <h3>3. Customise (optional)</h3>
        <p class="cc-step-help">You can leave everything as it is. The names change the two characters on the sheets. The tested inputs change every figure of the case; the three sets available have been checked: with all of them, Argen's AE-3 fails some test and the Vektor device passes them all.</p>
        <div class="cc-form-grid">
          <label>Chief engineer of Argen Labs
            <input data-cc-field="argen" type="text" maxlength="40" value="Marta Ibarra">
          </label>
          <label>Technical director of Vektor Mechanical
            <input data-cc-field="vektor" type="text" maxlength="40" value="Óscar Valdés">
          </label>
          <label class="cc-full">Tested inputs
            <select data-cc-field="inputs"><option value="A" selected>x = −1, 0.5 and 1 (the book's)</option><option value="B">x = −0.8, 0.5 and 0.9</option><option value="C">x = −1, 0.25 and 0.75</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generate">
        <h3>4. Generate</h3>
        <p class="cc-step-help">The website composes this class's documents. Start with the printing and distribution guide: it says what to print, how many copies and when each item is handed out. The presentation is projected from here.</p>
        <div class="cc-actions">
          <button id="vektor-generate" type="submit">Generate documents</button>
          <button id="vektor-project" class="cc-secondary" type="button">Project the presentation</button>
          <button id="vektor-clear" class="cc-secondary" type="button">Clear downloads</button>
        </div>
        <div id="vektor-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="vektor-summary-title">
      <h2 id="vektor-summary-title">Case file summary</h2>
      <ul id="vektor-summary" class="cc-summary"></ul>
      <div id="vektor-checks" aria-live="polite"></div>
      <div id="vektor-preview" class="cc-preview" aria-live="polite">Loading the preview…</div>
    </aside>
  </section>

  <section id="vektor-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="vektor-documents-title">
    <h2 id="vektor-documents-title">Activity documents</h2>
    <p class="cc-download-note">Start with the <strong>printing and distribution guide</strong>: it says what to print, how, how many copies and when each document is handed out. The teacher packet contains the solution and must not circulate. In each tab, the red row downloads a ZIP with everything in it; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="vektor-panel-bundles" data-cc-tab-target="vektor-panel-bundles">Role packets</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="vektor-panel-separate" data-cc-tab-target="vektor-panel-separate">Separate documents</button>
      <a id="vektor-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Printing and distribution guide</a>
      <a id="vektor-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="vektor-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="vektor-bundles" class="cc-file-list"></div></div>
    <div id="vektor-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="vektor-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to create the PDFs.</p></noscript>
</section>

## What is studied and why the result is right

| Sheet | Role | Mathematics | What it brings to the team |
|---|---|---|---|
| A · The Argen archive | Archive | Matching value and derivatives at 0: $$a_j = f^{(j)}(0)/j!$$ | The polynomial $$P_3$$ and its outputs at the three inputs |
| B · The seized device | Inspection | Differences $$d(x)$$ and the quotient $$d(x)/x^k$$ | The correction $$x^4/24$$, which fits the readings |
| C · Validation | Validation | Absolute error and tolerance | Which machine passes the tests, and how far that goes |
| D · The strips and the opinion | Team | Signed partial sums; a different rule with the same readings | The opinion: what is established, what is suggested and what cannot be proved |

Since every derivative of $$e^x$$ equals 1 at zero, Argen's polynomial is $$P_3$$. With the tolerance of 0.012, the AE-3 fails at $$x=-1$$ and at $$x=1$$, while the readings of the seized device, which agree with $$Q_4=P_3+x^4/24$$, pass all three tests. But three passed tests are a statement about three inputs: the rule $$Q_4(x)+c\,(x+1)(x-0.5)(x-1)$$ gives the same readings for any $$c$$, and only a remainder bound, such as Lagrange's, says something about the whole interval. No number, however sharp, says who designed the machine.

<p class="cc-disclaimer">Argen Labs, Vektor Mechanical, the AE-3 calculator, the people and the records are fictional and purely educational. The header images are drawn by a program.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-generator.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/calculadora-vektor/vektor.js?v=20261016a"></script>
