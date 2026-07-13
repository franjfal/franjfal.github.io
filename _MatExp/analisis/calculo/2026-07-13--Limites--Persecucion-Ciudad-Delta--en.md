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

A pursuit crosses Ciudad Delta. Traffic cameras have left a sequence of photographs, but some images are missing and others may show the wrong vehicle. Three police teams receive almost identical case files and must reconstruct the car's position without knowing that a few strategic pieces of evidence differ between dossiers.

The activity introduces one-sided limits, continuity, removable and jump discontinuities, oscillation, and infinite limits through one essential distinction: **what happens near an instant, what happens exactly at that instant, and what the available evidence allows us to claim**.

<figure>
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/header.jpg" alt="Placeholder for a pursuit through Ciudad Delta">
</figure>

## Case structure

The case uses **30 unique photographic files**. Teams A and B receive 26 photographs, while Team C receives 25 because the exact camera at \(t=2\) recorded no image. Twenty-two photographs are shared by everyone; the remaining eight are variants of four strategic slots.

<table class="casebook-comparison">
  <thead>
    <tr><th>Checkpoint</th><th>Team A</th><th>Team B</th><th>Team C</th></tr>
  </thead>
  <tbody>
    <tr><td>\(t=2\)</td><td>Correct image: \(f(2)=4\)</td><td>Wrong vehicle: \(f(2)=7\)</td><td>The camera records no image</td></tr>
    <tr><td>Tunnel \(4&lt;t&lt;7\)</td><td colspan="3">There are no cameras or information inside the tunnel</td></tr>
    <tr><td>\(t=8\)</td><td>Both road sections meet at 10</td><td>The right-hand section approaches 13</td><td>Both limits equal 10, but the exact image shows 14</td></tr>
    <tr><td>Oscillation</td><td colspan="3">The same alternating sequence for everyone</td></tr>
    <tr><td>Leaving the city</td><td colspan="3">The same unbounded sequence for everyone</td></tr>
  </tbody>
</table>

Students do not receive this comparison table. Each team sees only its own case file, the map, and an investigation worksheet.

## Five investigation points

1. **The camera at \(t=2\).** Nearby photographs approach position 4. Depending on the team, the exact image confirms that value, identifies another car at position 7, or is missing.
2. **The Straight-Line Tunnel.** The final camera before entry records \(f(4)=6\), and the first camera after exit records \(f(7)=9\). There is no image for \(4&lt;t&lt;7\). Even though the drawn road is straight, the evidence does not reveal what the car did inside, establish \(f(6)\), calculate its limit, or decide continuity.
3. **The junction at \(t=8\).** Team A sees a continuous connection. Team B receives two photographs from a displaced upper deck and obtains unequal one-sided limits. Team C sees equal limits but a different registration plate at the exact instant.
4. **Labyrinth Roundabout.** Every team receives the same alternating sequence of positions. The images are taken closer and closer to one instant, yet the car does not approach a single position.
5. **Leaving Ciudad Delta.** The final cameras show ever larger positions as \(t=12\) is approached from the left. This section opens the discussion of infinite limits.

<div class="casebook-callout">
The question is not only “Where was the car?” At several checkpoints, the mathematically correct answer is “The available evidence is not enough to decide.”
</div>

## Police coordination meeting

After team work, the whole-class discussion becomes a police coordination meeting. Each group must defend its reconstruction and explain which images support its conclusions. Discrepancies arise naturally: a camera may be wrong, an image may be missing, and two roads may fail to meet where expected.

This conflict prepares the formal statement that \(f\) is continuous at \(a\) when \(\lim_{t\to a}f(t)\) exists, \(f(a)\) exists, and the two values agree. It also makes clear that knowing both one-sided limits does not always suffice to decide continuity.

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
    </div>
    <div id="casebook-bundles" role="tabpanel"><div id="casebook-bundle-downloads" class="case-downloads"></div></div>
    <div id="casebook-separate" role="tabpanel" hidden><div id="casebook-separate-downloads" class="case-downloads"></div></div>
  </section>
</section>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/casebook-generator.js"></script>
