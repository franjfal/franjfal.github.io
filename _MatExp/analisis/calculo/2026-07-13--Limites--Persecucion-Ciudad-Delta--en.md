---
title: "Limits and continuity: the Ciudad Delta pursuit"
lang: en
page_id: matexp-limits-city-delta-pursuit
date: '2026-07-13 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - calculus
  - limits
permalink: "/MatExp/analysis/calculus/limits/ciudad-delta-pursuit/"
header:
  image: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/header.jpg"
excerpt: "Case-file generator for investigating limits and continuity through photographs from a police pursuit."
feature: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/feature.svg"
---

A pursuit crosses Ciudad Delta. Traffic cameras have left a sequence of photographs, but some images are missing and others may show the wrong vehicle. Three police teams receive almost identical case files and must reconstruct the car's position from the evidence in their dossier.

The activity explores one-sided limits, continuity, several types of discontinuity, and infinite limits through a collaborative investigation. The generator lets you choose the PDF format, city name, and case date. It then produces all classroom materials, including a teacher guide containing the activity structure, investigation checkpoints, suggested sequence, and solutions.

<figure>
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/header.jpg" alt="Placeholder for a pursuit through Ciudad Delta">
</figure>

## Material generator

The generator produces the three team packets, a teacher guide with solutions, separate documents, and one complete PDF. The photographs and map currently included are **low-resolution placeholders**, ready to be replaced by the final images without changing the activity's structure.

<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/casebook-generator.css">

<section class="casebook-generator" data-lang="en" aria-label="Limits and continuity case-file generator">
  <section class="case-workspace">
    <form id="casebook-form" class="case-panel">
      <h2>Case details</h2>
      <div class="case-form-grid">
        <label class="case-full">City name
          <input id="casebook-city" type="text" value="Ciudad Delta" required>
        </label>
        <label>PDF format
          <select id="casebook-format">
            <option value="a4" selected>A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
        <label>Case date
          <input id="casebook-date" type="date" value="2026-07-13">
        </label>
      </div>
      <div class="case-actions">
        <button id="casebook-generate" type="submit">Generate documents</button>
        <button id="casebook-clear" class="case-secondary" type="button">Clear downloads</button>
      </div>
      <div id="casebook-status" class="case-status" role="status" aria-live="polite"></div>
    </form>

    <aside class="case-panel" aria-labelledby="casebook-summary-title">
      <h2 id="casebook-summary-title">Distribution summary</h2>
      <ul class="case-summary">
        <li><span>Unique files</span><strong>30</strong></li>
        <li><span>Shared photographs</span><strong>22</strong></li>
        <li><span>Dossier A</span><strong>26 photos</strong></li>
        <li><span>Dossier B</span><strong>26 photos</strong></li>
        <li><span>Dossier C</span><strong>25 photos</strong></li>
        <li><span>Target vehicle</span><strong>2718 LMT</strong></li>
      </ul>
    </aside>
  </section>

  <section id="casebook-download-panel" class="case-panel case-hidden" style="margin-top:22px" aria-labelledby="casebook-download-title">
    <h2 id="casebook-download-title">Downloads</h2>
    <p>The team packets are ready to distribute. Teacher documents contain the outcome comparison and must not be shared before the final meeting.</p>
    <div class="case-tabs" role="tablist" aria-label="Download type">
      <button class="case-tab" type="button" role="tab" aria-selected="true" data-case-tab="casebook-bundles">Complete packets</button>
      <button class="case-tab" type="button" role="tab" aria-selected="false" data-case-tab="casebook-separate">Separate documents</button>
      <a id="casebook-complete-pdf" class="case-tab case-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="casebook-bundles" role="tabpanel"><div id="casebook-bundle-downloads" class="case-downloads"></div></div>
    <div id="casebook-separate" role="tabpanel" hidden><div id="casebook-separate-downloads" class="case-downloads"></div></div>
  </section>
</section>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/casebook-generator.js"></script>
