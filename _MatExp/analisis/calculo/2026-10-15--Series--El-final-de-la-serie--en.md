---
title: "Calculus Cases: the series finale"
lang: en
page_id: matexp-series-finale-case
date: '2026-10-15 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - calculus
  - series
taxonomy: experiment sequences series convergence analysis calculus Calculus-Cases
permalink: "/MatExp/analysis/calculus/series/series-finale/"
header:
  image: "/assets/MatExp/analisis/calculo/series-final-de-la-serie/header-brand.jpg"
excerpt: "Someone has leaked the ending of a TV series. The evidence is a set of visual effects built from sequences and series: only those who understand their convergence will find out who did it."
feature: "/assets/MatExp/analisis/calculo/series-final-de-la-serie/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016d">
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/series-finale.css">

Ten seconds of the ending of **ZENO**, the year's most watched show, appear on a fan forum before dawn. The platform postpones the premiere and the studio discovers that someone tampered with the official trailer project that night. The Chief Inspector, a role played by the teacher, gathers the unit: the show's visual effects are built from sequences and series, and those series have left traces. A geometric ratio identifies the copy of the video, an arithmetic sum dates the render, a telescoping sum reveals a deleted session and the exponent of a *p*-series gives away which version of the effects bible was used by whoever remade the shots.

The case follows the format of every Calculus Case: it is launched at the end of a class, worked on at home and closed in the next class.

1. **Launch, at the end of a class (15–20 min).** You project the presentation: the leak, the show and its episodes, and the creative team. Each group receives the dossier of one episode and five students receive, in a sealed envelope, the card of a suspect: the creator, the head writer, the writer of the finale, the mathematics adviser and the trailer editor.
2. **At home (45–60 min).** Each group analyses its episode's forensic exhibit, solves the exercises and chooses the values of its trailer shot. The suspects prepare their role.
3. **Closing class (60 min).** Pooling in the editing room: each group states its finding and enters its shot, and the class watches its trailer. Then the envelope with the building's records is opened, the suspects are questioned in three rounds and each group presents its accusation. The solution is unique and cannot be reached without the mathematics.

$$
\text{term } a_k \qquad\Big|\qquad \text{partial sum } S_n=\sum_{k=1}^{n} a_k \qquad\Big|\qquad \text{series } \sum_{k=1}^{\infty} a_k=\lim_{n\to\infty} S_n
$$

<div class="cc-gallery" aria-label="Stills from the ZENO series">
  <figure><img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/img/gallery-corridor.jpg" alt="Corridor in perspective with rings of light converging towards a door"><figcaption>Episode 2: the echo rings form a geometric series.</figcaption></figure>
  <figure><img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/img/gallery-doses.jpg" alt="Two dose bars in front of a red threshold line"><figcaption>Episode 5: two <em>p</em>-series, one diverges and one does not.</figcaption></figure>
  <figure><img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/img/gallery-beacon.jpg" alt="Scanner with a beacon swinging along a corridor"><figcaption>Episode 6: the path diverges; the position converges.</figcaption></figure>
</div>

## Materials generator

The configurator guides you in four steps. All it really needs is the number of students: from it, the website forms the groups, decides which episodes are worked on and counts how many copies to print. Everything else already has a recommended value.

<section class="cc-case sf-case" data-case="series-finale" data-lang="en" aria-label="Series Finale case generator">
  <section class="cc-workspace">
    <form id="sf-form" class="cc-panel" novalidate>
      <h2>Set up the case</h2>
      <section class="cc-step" data-cc-step-title="Your class">
        <h3>1. Your class</h3>
        <p class="cc-step-help">How many students do you have? Five will play the suspects (five pairs above thirty) and the rest form groups of two to five, each with one episode. With fewer than six groups, the episodes nobody works on arrive in the envelope as a lab report, and the case is solved just the same.</p>
        <label>Number of students
          <input id="sf-students" type="number" min="9" max="40" step="1" value="25">
        </label>
        <div id="sf-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Paper and exercises">
        <h3>2. Paper and exercises</h3>
        <p class="cc-step-help">The paper size and how many exercises each dossier carries. With the essential ones (the forensic exercise and those that prepare it), a group needs about 45–60 minutes at home.</p>
        <div class="cc-form-grid">
          <label>Paper
            <select id="sf-format"><option value="a4" selected>A4</option><option value="letter">Letter</option></select>
          </label>
          <label>Dossier exercises
            <select id="sf-level"><option value="B" selected>Essential (recommended)</option><option value="E">Full</option><option value="A">With extension</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Customise (optional)">
        <h3>3. Customise (optional)</h3>
        <p class="cc-step-help">You can leave everything as it is. The date changes the day of the events in every document. The advanced parameters change the evidence and every figure that depends on it; the generator checks that the evidence still points to a single culprit and, if not, explains why and does not generate.</p>
        <label>Night of the events (Tuesday)
          <input id="sf-night" type="date" value="2026-10-13">
        </label>
        <details class="sf-advanced">
          <summary>Investigation parameters (advanced)</summary>
          <div class="cc-form-grid">
            <label>Render frames <input id="sf-frames" type="number" min="24" max="2400" step="1" value="240"></label>
            <label>Cost of the first frame (s) <input id="sf-fcost" type="number" min="1" step="0.5" value="12"></label>
            <label>Increase per frame (s) <input id="sf-fstep" type="number" min="0.01" step="0.01" value="0.25"></label>
            <label>Render end <input id="sf-finish" type="text" value="01:12:30" pattern="\d{2}:\d{2}:\d{2}"></label>
            <label class="cc-full">Ratio of the editing-suite copy
              <select id="sf-suite"><option>0.55</option><option>0.58</option><option>0.61</option><option selected>0.64</option><option>0.67</option><option>0.70</option></select>
            </label>
          </div>
        </details>
      </section>
      <section class="cc-step" data-cc-step-title="Generate">
        <h3>4. Generate</h3>
        <p class="cc-step-help">The website composes this class's documents. Start with the printing and distribution guide: it says what to print, how many copies and when each item is handed out. The presentation is projected from here, and the official trailer can be downloaded already rendered, in case something fails in class or time runs short.</p>
        <div class="cc-actions">
          <button id="sf-generate" type="submit">Generate documents</button>
          <button id="sf-project" class="cc-secondary" type="button">Project the presentation</button>
          <a id="sf-trailer" class="cc-tab-button cc-complete" href="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/video/zeno-official-trailer-en.mp4" download>Official trailer (MP4)</a>
          <button id="sf-clear" class="cc-secondary" type="button">Clear downloads</button>
        </div>
        <div id="sf-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="sf-summary-title">
      <h2 id="sf-summary-title">Case summary</h2>
      <ul id="sf-summary" class="cc-summary"></ul>
      <div id="sf-checks" aria-live="polite"></div>
      <div id="sf-preview" class="cc-preview" aria-live="polite">Loading the preview…</div>
    </aside>
  </section>

  <section id="sf-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="sf-documents-title">
    <h2 id="sf-documents-title">Activity documents</h2>
    <p class="cc-download-note">Start with the <strong>printing and distribution guide</strong>: it says what to print, how, how many copies and when each document is handed out. The teacher packet holds the solution and must not circulate. In each tab, the red row downloads a ZIP with all its content; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="sf-panel-bundles" data-cc-tab-target="sf-panel-bundles">Packets by role</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="sf-panel-separate" data-cc-tab-target="sf-panel-separate">Separate documents</button>
      <a id="sf-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Printing and distribution guide</a>
      <a id="sf-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="sf-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="sf-bundles" class="cc-file-list"></div></div>
    <div id="sf-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="sf-doclist" class="cc-file-list"></div></div>
  </section>

  <section class="cc-panel sf-packages" aria-labelledby="sf-packages-title">
    <h2 id="sf-packages-title">Activity packages</h2>
    <p>The configuration travels in a JSON file that can be saved and imported later. The <strong>student package</strong> contains nothing confidential and opens the editing room with this class's groups. The <strong>envelope</strong> is the closing class's. The <strong>teacher package</strong> contains the solution and the private cards.</p>
    <div class="cc-actions">
      <button id="sf-export-student" class="cc-secondary" type="button">Student package</button>
      <button id="sf-export-envelope" class="cc-secondary" type="button">Envelope (closing class)</button>
      <button id="sf-export-teacher" class="cc-secondary" type="button">Teacher package</button>
      <button id="sf-import" class="cc-secondary" type="button">Import configuration…</button>
      <input id="sf-import-file" type="file" accept=".json,application/json" hidden>
    </div>
    <p id="sf-import-status" class="cc-help" role="status" aria-live="polite"></p>
    <p><a href="{{ site.baseurl }}/en/MatExp/analysis/calculus/series/series-finale/room/">Open the editing room (pooling) →</a></p>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to compose the stills and create the PDFs.</p></noscript>
</section>

## What each episode studies

| Episode | Mathematics | Forensic exhibit | What it proves |
|---|---|---|---|
| 1 · Countdown | A sequence with a limit; an arithmetic progression and its sum | Render log: only the finish time is known | The start time, if the progression of costs is added up (assuming equal costs points to an innocent person) |
| 2 · Achilles | Geometric series, \(\sum ar^{k-1} = a/(1-r)\) when \(\lvert r\rvert<1\) | Leaked frame with the echo rings | The ratio identifies the copy and confirms the video is genuine |
| 3 · The Rope | Harmonic series: terms tending to 0 and an unbounded sum | The creator's statement to the press | That she lied: the probe does arrive |
| 4 · The Erased Log | Telescoping series | The project's session journal | That a session is missing, how long it lasted and when it started |
| 5 · Dose | \(p\)-series: convergence, bounds without integrals, convergent is not small | Dosimeter readings in the alternative cut | The exponent reveals which version of the bible the tamperer had |
| 6 · Pendulum | Alternating series; absolute and conditional convergence | Beacon positions in the alternative cut | That the shot uses the old corridor, not the one that was built |

A table of partial sums suggests, but does not prove: a hundred terms of the harmonic series do not say that it diverges, and a hundred terms of \(\sum 1/n^2\) do not say that its sum stays below 2. That is why each dossier asks for an argument (comparison, grouping, telescoping or the alternating series test), and the editing room's lab always distinguishes exact values, proved bounds and numerical computations.

<p class="cc-disclaimer">The series ZENO, its studio, its platform, the people and the records are fictional and purely educational. The stills and the banner are programmatically generated previews, not images from a real production.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016c"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/fonts/sf-fonts.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/data/sf-public.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/data/sf-episodes.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/data/sf-private.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-math.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-evidence.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-validate.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-tex.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-trailer.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-pdf.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-slides.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-docs-student.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-docs-teacher.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-build.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-generator.js?v=20261016b"></script>
