---
title: "Calculus Cases: the tunnel"
lang: en
page_id: matexp-tunnel-case
date: '2026-10-16 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - derivatives
  - rates of change
taxonomy: experiment derivatives rates velocity analysis calculus Calculus-Cases
permalink: "/MatExp/analysis/derivatives/the-tunnel/"
header:
  image: "/assets/MatExp/analisis/derivadas/tunel/header-brand.jpg"
excerpt: "A car comes out of a tunnel and ends up against the guardrail. The insurer says speed; the family says failure. Only the derivative, and its assumptions, can say how fast it came out."
feature: "/assets/MatExp/analisis/derivadas/tunel/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016a">

A car comes out of a mountain tunnel and, a few meters later, comes to rest against the guardrail. The insurer has written one word in its report: *speed*. The driver's family has written another: *failure*. The unit's consultant wrote neither; beside a short table of times and positions he left only a question: what can we say about the car at the very moment it came out? The Chief Inspector, a role played by the teacher, splits the file among the members of each team: the motion record (Sheet A), the scene (Sheet B), the statements (Sheet C) and the expert report to be signed (Sheet D).

The case is built around a deliberate trap. The measurement closest to the exit gives 22.5 m/s, but it is an average over a whole second, and the second after the exit gives 20.5. The turn comes when the class fits a parabola on each side of the exit: the two curves slow down at different rates and yet their tangents at $$t=0$$ agree. Because that speed exists only inside a model, the second lesson of the case is that an estimate always travels with its assumptions.

The case follows the format of every Calculus Case:

1. **Launch, at the end of a class (15–20 min).** You project the presentation: the two photographs, the consultant's question, two diagnostic questions, the roles and your class's teams. Each team receives its Sheets A, B, C and D, and each student reads their own without showing it.
2. **At home (45–60 min per team).** Each student completes their sheet and the team exchanges what it needs: the averages, the limit in m/s and which claims can be tested. The coordinator starts the report.
3. **Closing class (55 min).** Pooling of the estimates, the local model on each side of the exit (the decisive part), report and cross-review between teams, debrief and an individual check.

$$
v_{\text{average}}=\frac{s(b)-s(a)}{b-a}
\qquad\Big|\qquad
s'(0)=\lim_{h\to0}\frac{s(h)-s(0)}{h}
\qquad\Big|\qquad
s(t)=at^2+bt+c \ \text{ on each side of } t=0
$$

## Materials generator

The configurator guides you in four steps. The only thing you must enter is the number of students: from it, the website forms teams of three or four and works out how many copies to print. Everything else already has a recommended value, the same as in the book.

<section class="cc-case tunnel-case" data-case="tunnel" data-lang="en" aria-label="Generator for the case The Tunnel">
  <section class="cc-workspace">
    <form id="tunnel-form" class="cc-panel" novalidate>
      <h2>Set up the case</h2>
      <section class="cc-step" data-cc-step-title="Your class">
        <h3>1. Your class</h3>
        <p class="cc-step-help">How many students do you have? The website forms teams of three or four. In each team, three students receive Sheets A, B and C; the fourth coordinates the report with Sheet D. In teams of three, whoever holds Sheet C also coordinates.</p>
        <label>Number of students
          <input id="tunnel-students" type="number" min="6" max="40" step="1" value="24">
        </label>
        <div id="tunnel-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Paper">
        <h3>2. Paper</h3>
        <p class="cc-step-help">The paper size of the sheets. The presentation is landscape and projected; there is no need to print it.</p>
        <div class="cc-form-grid">
          <label>Paper
            <select id="tunnel-format"><option value="a4" selected>A4</option><option value="letter">Letter</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Customise (optional)">
        <h3>3. Customise (optional)</h3>
        <p class="cc-step-help">You can leave everything as it is. The names change the statements on Sheet C; the place, the name of the tunnel in every document. The data variants change the five positions and every figure that depends on them, the solution included; they are chosen so that the case works the same way: the two one-sided models share their tangent, the car slows down on both sides and leaves above the limit.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Record data
            <select data-cc-field="variant"><option value="book" selected>The book's (recommended)</option><option value="b">Variant 2</option><option value="c">Variant 3</option></select>
          </label>
          <label>Insurer's investigator
            <input data-cc-field="insurer" type="text" placeholder="Marta Ibáñez" maxlength="40">
          </label>
          <label>Driver's brother
            <input data-cc-field="brother" type="text" placeholder="Luis Cano" maxlength="40">
          </label>
          <label class="cc-full">Name of the tunnel (optional)
            <input data-cc-field="place" type="text" placeholder="no name: “the mountain tunnel”" maxlength="40">
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generate">
        <h3>4. Generate</h3>
        <p class="cc-step-help">The website composes the documents for this class. Start with the printing and distribution guide: it says what to print, how many copies and when each item is handed out. The presentation is projected from right here.</p>
        <div class="cc-actions">
          <button id="tunnel-generate" type="submit">Generate documents</button>
          <button id="tunnel-project" class="cc-secondary" type="button">Project the presentation</button>
          <button id="tunnel-clear" class="cc-secondary" type="button">Clear downloads</button>
        </div>
        <div id="tunnel-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="tunnel-summary-title">
      <h2 id="tunnel-summary-title">Case file summary</h2>
      <ul id="tunnel-summary" class="cc-summary"></ul>
      <div id="tunnel-checks" aria-live="polite"></div>
      <div id="tunnel-preview" class="cc-preview" aria-live="polite">Loading the preview…</div>
    </aside>
  </section>

  <section id="tunnel-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="tunnel-documents-title">
    <h2 id="tunnel-documents-title">Activity documents</h2>
    <p class="cc-download-note">Start with the <strong>printing and distribution guide</strong>: it says what to print, how, how many copies and when each document is handed out. The teacher packet contains the solution and must not circulate. In each tab, the red row downloads a ZIP with everything in it; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="tunnel-panel-bundles" data-cc-tab-target="tunnel-panel-bundles">Role packets</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="tunnel-panel-separate" data-cc-tab-target="tunnel-panel-separate">Separate documents</button>
      <a id="tunnel-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Printing and distribution guide</a>
      <a id="tunnel-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="tunnel-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="tunnel-bundles" class="cc-file-list"></div></div>
    <div id="tunnel-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="tunnel-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to compose the documents and create the PDFs.</p></noscript>
</section>

## What is studied and why it works

| Document | Mathematics | What it contributes |
|---|---|---|
| Sheet A · Motion record | Average velocities on five intervals; secants | That every number is an average and depends on its interval |
| Sheet B · Scene record | Unit conversion, $$1\ \text{m/s} = 3.6\ \text{km/h}$$ | That the comparison with the limit is made in the same units |
| Sheet C · Statements taken | Separating testable claims | What the file can say about speed and what it cannot say about the cause |
| The local model (closing class) | A parabola on each side of $$t=0$$; one-sided derivatives | That two models built from different points give the same exit speed |
| Sheet D · Expert report | An estimate with its units and its assumptions | A conclusion that someone who has never studied calculus can follow |

The five averages of the book's record are 23, 22.5, 20.5, 19 and 21.5 m/s, and none of them is the speed at the instant of exit: every interval has positive width. Speaking of an instant requires a model of the motion between the recorded points. With $$s(t)=at^2+bt+c$$ on each side and $$s(0)=0$$, the three points on each side fix a different parabola, but both have the same slope at the exit, that of their coefficient $$b$$. Nobody imposes that agreement, and that is why it convinces. Even so, another smooth curve could pass through the five points with a different tangent: the number the report signs is an estimate conditional on the model and on the accuracy of the record, and the file still does not say why the car left the road.

<p class="cc-disclaimer">The accident, the people, the insurer and the records are fictional and purely educational. The illustrations and the sketch are generated by code.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-generator.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/tunel/tunnel.js?v=20261017a"></script>
