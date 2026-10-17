---
title: "Calculus Cases: the professor's trial"
lang: en
page_id: matexp-ode-professor-trial
date: '2026-07-03 20:30:00 +0200'
categories:
  - experiment
  - analysis
  - modeling
  - ODE
taxonomy: experiment analysis modeling ODE differential-equations exponentials logarithms Calculus-Cases
permalink: "/MatExp/analysis/modeling/ode/professor-falco-trial/"
header:
  image: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/header.jpg"
excerpt: "The professor is found dead in his classroom shortly after class. Two temperature readings and Newton's law of cooling fix the time of death; the trial decides who was there."
feature: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/feature.svg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016d">

The professor of the course is found dead in his classroom shortly after the end of class, and the case is settled at a trial. The students share out the roles of judge, prosecution, forensic doctor, building custodian, three suspects and jury, each with its own packet of documents and without knowing what the others know. The centrepiece is mathematical: two temperature readings and Newton's law of cooling give an estimate of the time of death, and that time has to be set against the classroom plan, the building records and the testimony until the court reaches a verdict.

The case follows the format of every Calculus Case: it is launched at the end of a class, prepared in class and at home, and the trial is held in the next class.

1. **Launch, at the end of a class (15–20 min).** You project the presentation: the story, the discovery, the question for the court, the roles and their assignment in your class. Each student receives the packet of their role; the three suspects, in a sealed envelope.
2. **Preparation, in class and at home (30–45 min).** Each role prepares its contribution with its own documents only: the forensic doctor and the prosecution, the calculation of the time of death; the custodian, the records; each suspect, their account. Only the forensic doctor, the prosecution and the judge know the estimated time of death; the jury, the custodian and the suspects discover it at the trial.
3. **The trial, in the next class (60 min).** With no pooling beforehand: opening, the forensic report with a pause in which the whole court checks the calculation, the custodian's and the suspects' testimony, the closing statement, the jury's written verdict and the close.

$$
\frac{dT}{dt}=-k\,\bigl(T-T_a\bigr)\qquad\Longrightarrow\qquad T(t)=T_a+A\,e^{-kt}
$$

<figure class="cc-figure">
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/assets/cover_scene.png" alt="University classroom set up as the scene of the case">
</figure>

## Materials generator

The configurator guides you in four steps. The only essential input is the number of students: from it, the website assigns the roles, decides whether more than one court is needed and works out exactly how many copies to print. Everything else already has a recommended value.

<section class="cc-case trial-generator" data-lang="en" aria-label="The professor's trial generator">
  <section class="cc-workspace">
    <form id="case-form" class="cc-panel" novalidate>
      <h2>Set up the case</h2>
      <section class="cc-step" data-cc-step-title="Your class">
        <h3>1. Your class</h3>
        <p class="cc-step-help">How many students do you have? Every student has a role: judge, prosecution, forensic doctor, custodian, one of the three suspects or a member of the jury. Up to 20 students there is a single trial; with more, the website forms several courts of 10 to 16 that try the same case at the same time.</p>
        <label>Number of students
          <input id="trial-students" name="students" type="number" min="9" max="72" step="1" value="24">
        </label>
        <div id="trial-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Case details">
        <h3>2. Case details</h3>
        <p class="cc-step-help">The names, the date and the timetable appear in every document. Every time in the case is worked out from the end of class; the measured temperatures are always the same. You can leave everything as it is.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Professor's name
            <input id="teacher-name" name="teacherName" type="text" value="Javier Falcó" required>
          </label>
          <label class="cc-full">Course taught
            <input id="class-name" name="className" type="text" value="differential equations and Laplace transforms" required>
          </label>
          <label class="cc-full">Case date
            <input id="case-date" name="caseDate" type="date" value="2026-07-02">
          </label>
          <label>Class starts
            <input id="class-start-time" name="classStartTime" type="time" value="10:30" required>
          </label>
          <label>Class ends
            <input id="class-end-time" name="classEndTime" type="time" value="12:30" required>
          </label>
          <label>Suspect 1 name
            <input id="suspect-1-name" name="suspect1Name" type="text" placeholder="Suspect 1">
          </label>
          <label>Suspect 1 gender
            <select id="suspect-1-gender" name="suspect1Gender">
              <option value="f" selected>Woman</option>
              <option value="m">Man</option>
            </select>
          </label>
          <label>Suspect 2 name
            <input id="suspect-2-name" name="suspect2Name" type="text" placeholder="Suspect 2">
          </label>
          <label>Suspect 2 gender
            <select id="suspect-2-gender" name="suspect2Gender">
              <option value="m" selected>Man</option>
              <option value="f">Woman</option>
            </select>
          </label>
          <label>Suspect 3 name
            <input id="suspect-3-name" name="suspect3Name" type="text" placeholder="Suspect 3">
          </label>
          <label>Suspect 3 gender
            <select id="suspect-3-gender" name="suspect3Gender">
              <option value="m" selected>Man</option>
              <option value="f">Woman</option>
            </select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Report and paper">
        <h3>3. Report and paper</h3>
        <p class="cc-step-help">The mathematical case report (document 09), which the forensic doctor and the prosecution receive, has two versions with the same data. The calculus version builds the model with an exponential function, checks it with derivatives and solves for the time with logarithms; the differential equations version derives it by solving Newton's equation by separation of variables. The rest of the material is the same.</p>
        <div class="cc-form-grid">
          <label>Mathematical report
            <select id="math-mode" name="mathMode">
              <option value="calculus" selected>Calculus (recommended)</option>
              <option value="ode">Differential equations</option>
            </select>
          </label>
          <label>Paper
            <select id="page-format" name="pageFormat">
              <option value="a4" selected>A4</option>
              <option value="letter">Letter</option>
            </select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generate">
        <h3>4. Generate</h3>
        <p class="cc-step-help">The website composes the documents for this class. Start with the printing and distribution guide: it says what to print, exactly how many copies and when each item is handed out. The launch presentation is projected from here and is also available as a PDF (document 00).</p>
        <div class="cc-actions">
          <button id="generate-button" type="submit">Generate documents</button>
          <button id="project-button" class="cc-secondary" type="button">Project the presentation</button>
          <button id="clear-button" class="cc-secondary" type="button">Clear downloads</button>
        </div>
        <div id="status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="case-summary-title">
      <h2 id="case-summary-title">Case summary</h2>
      <ul id="case-summary" class="cc-summary"></ul>
    </aside>
  </section>

  <section id="downloads-panel" class="cc-panel cc-documents cc-hidden" aria-labelledby="downloads-title">
    <h2 id="downloads-title">Activity documents</h2>
    <p class="cc-download-note">Start with the <strong>printing and distribution guide</strong>: it says what to print, how, how many copies and when each document is handed out. The packets tab has one PDF per role; the separate documents tab, each item on its own, beginning with the presentation (00). The teacher solution, the teacher packet and the complete PDF must not circulate. In each tab, the red row downloads a ZIP with all its contents; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button id="tab-bundles" class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="panel-bundles" data-cc-tab-target="panel-bundles">Role packets</button>
      <button id="tab-separate" class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="panel-separate" data-cc-tab-target="panel-separate">Separate documents</button>
      <a id="print-guide-link" class="cc-tab-button cc-complete cc-hidden" href="#" download>Printing and distribution guide</a>
      <a id="complete-pdf-link" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="panel-bundles" class="cc-tab-panel" role="tabpanel" aria-labelledby="tab-bundles"><div id="bundle-downloads" class="cc-file-list"></div></div>
    <div id="panel-separate" class="cc-tab-panel" role="tabpanel" aria-labelledby="tab-separate" hidden><div id="separate-downloads" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to create the PDFs.</p></noscript>
</section>

## What is studied

The forensic doctor measured the body temperature twice, one hour apart, in a classroom that the climate-control system held at a constant temperature. What decays exponentially is not the temperature but its excess over the room, \(T-T_a\): every hour it is multiplied by the same factor. That factor comes from the ratio of the two measured excesses, and the time of death follows from running the model backwards to the normal body temperature, with a logarithm.

| Report | Tools | How it reaches the model |
|---|---|---|
| Calculus | Exponentials, logarithms and the derivative of \(b^t\) | Proposes \(T(t)=T_a+A\,b^t\), finds \(A\) and \(b\) from the two readings and checks with the derivative that the model obeys Newton's law |
| Differential equations | Separation of variables and integration | Solves \(T'=-k(T-T_a)\) and finds \(A\) and \(k\) from the two readings |

The estimate rests on assumptions worth saying aloud: the room temperature was constant, the cooling coefficient did not change and the temperature at the moment of death was the normal one. And what it provides is a time window, not a name: the time points at someone only when it meets the movements and the testimony heard in court.

<p class="cc-disclaimer">The case, its people, its documents and its data are fictional and purely educational.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016c"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/murder-generator.js?v=20261017a"></script>
