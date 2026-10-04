---
title: "Calculus Cases: the Delta City pursuit"
lang: en
page_id: matexp-limits-city-delta-pursuit
date: '2026-07-13 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - calculus
  - limits
taxonomy: experiment limits continuity analysis calculus Calculus-Cases
permalink: "/MatExp/analysis/calculus/limits/delta-city-pursuit/"
header:
  image: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/header-brand.jpg"
excerpt: "A pursuit reconstructed from traffic-camera photographs: first the evidence, then the model and, only then, limits and continuity."
feature: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css">

A burgundy hatchback drives through the checkpoint at the **Delta City** harbour exit without stopping and crosses the city until it disappears along the north motorway. The patrol cannot keep up with it: all that remains of its route is the record of the plate-reading traffic cameras. The Chief Inspector, a role the teacher takes on, wants to know where the car went and what can be stated with certainty along each stretch. Three teams receive almost identical extracts of that record. Another car of the same model, in a similar red and with a similar plate, drives around the city, and a hurried reading can lead to the wrong conclusion.

The activity has two phases that are never mixed:

1. **Evidence, at home.** Each photograph is a single data point: a camera, a time and a plate. The consultant who was working on the case left his investigation worksheet half done, with the first exhibits already written up; the teams pick it up, check every plate, discard identification errors and propose *candidates* for what happens near each delicate point. Only a photo of the wanted car gives a value \(f(t)\), and finitely many photographs prove no limit.
2. **Coordination and model, in class.** The teams compare their reports exhibit by exhibit, and then an envelope is opened with an explicit function \(f\) that models the trajectory; its first two pieces are the ones students will have proposed at home. On it, values, one-sided limits and limits are computed, and continuity, removable discontinuity, jump, oscillation and infinite limit are classified. Before the formula, the continuity hypothesis alone lets students apply the intermediate value theorem in the tunnel.

The map carries a grid of columns, from west to east, and northings (the north coordinate), from south to north, and it is drawn from that function. The consultant noted a regularity: in every photograph of the wanted car, the camera's column equals the minute \(t\). The model assumes that it holds at every instant and, under that hypothesis, the car's route on the map **is** the graph of \(f\).

The activity takes two classes. At the end of the first, the teacher, as Chief Inspector, presents the case and hands out the packets; the mechanical part is done at home, and the second class is given to the coordination meeting, the model and each team's presentation.

$$
f(t)=\begin{cases}
t^{2} & \text{if } 0\le t\le 2,\\
t+2 & \text{if } 2<t<8,\\
11+\sin\!\left(\dfrac{\pi}{10-t}\right) & \text{if } 8\le t<10,\\
10+\dfrac{4}{12-t} & \text{if } 10\le t<12.
\end{cases}
$$

<div class="cc-gallery" aria-label="Some camera photographs">
  <figure><img data-delta-camera="LO-2" src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/photos/lo-2.jpg" alt="Camera on the island of the Fish Market Roundabout"><figcaption>Fish Market Roundabout, near \(t=2\).</figcaption></figure>
  <figure><img data-delta-camera="TU-S" src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/photos/tu-s.jpg" alt="South portal of the River Tunnel"><figcaption>River Tunnel: no cameras between \(t=3\) and \(t=5\).</figcaption></figure>
  <figure><img data-delta-camera="LB-5" src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/photos/lb-5.jpg" alt="Alley mouth of The Labyrinth on the North Ring Road"><figcaption>The Labyrinth: northings alternating near \(t=10\).</figcaption></figure>
</div>

## Material generator

Choose the city, the date, the start time and the plate of the pursued vehicle. The generator suggests a second, **look-alike** plate with the same format and two or three characters changed, which you can edit. It belongs to the other car: the same model, in a copper red close to the wanted car's burgundy, but different on careful inspection. The plates are placed in perspective on every photograph, in the preview and in the PDFs alike.

<section class="cc-case" data-case="delta-city" data-lang="en" aria-label="Delta City case generator">
  <section class="cc-workspace">
    <form id="delta-form" class="cc-panel" novalidate>
      <h2>Set up the case</h2>
      <div class="cc-form-grid">
        <label class="cc-full">City name
          <input id="delta-city" type="text" value="Delta City" maxlength="40" required>
        </label>
        <label>Case date
          <input id="delta-date" type="date" value="2026-10-02">
        </label>
        <label>Start time (t = 0)
          <input id="delta-start" type="time" value="18:00" step="60">
        </label>
        <fieldset>
          <legend>Licence plates</legend>
          <div class="cc-form-grid">
            <label>Pursued vehicle
              <input id="delta-plate" class="cc-mono" type="text" value="4871 MCV" maxlength="12" autocomplete="off" spellcheck="false" required>
            </label>
            <label>Look-alike vehicle
              <span class="cc-inline">
                <input id="delta-alt" class="cc-mono" type="text" value="" maxlength="12" autocomplete="off" spellcheck="false" required>
                <button id="delta-suggest" class="cc-secondary" type="button" title="Suggest another look-alike plate">Another</button>
              </span>
            </label>
          </div>
          <p id="delta-check" class="cc-note" role="status" aria-live="polite"></p>
        </fieldset>
        <label class="cc-full">PDF format
          <select id="delta-format">
            <option value="a4" selected>A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
      </div>
      <div class="cc-actions">
        <button id="delta-generate" type="submit">Generate documents</button>
        <button id="delta-clear" class="cc-secondary" type="button">Clear downloads</button>
      </div>
      <div id="delta-status" class="cc-status" role="status" aria-live="polite"></div>
    </form>

    <aside class="cc-panel" aria-labelledby="delta-summary-title">
      <h2 id="delta-summary-title">Case summary</h2>
      <ul id="delta-summary" class="cc-summary"></ul>
      <div id="delta-preview" class="cc-preview" aria-live="polite">Loading the preview…</div>
    </aside>
  </section>

  <section id="delta-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="delta-documents-title">
    <h2 id="delta-documents-title">Activity documents</h2>
    <p class="cc-download-note">At the end of the first class, hand out the phase 1 packets: one copy per student, different for each team. The phase 2 packet is handed out in the second class, after the coordination meeting. The teacher packet contains the team comparison and must not circulate before then. In each tab, the red row downloads a ZIP with all its content; the icons let you view or download each file.</p>
    <div class="cc-tabs" role="tablist" aria-label="Document types">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="delta-panel-bundles" data-cc-tab-target="delta-panel-bundles">Packets by role</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="delta-panel-separate" data-cc-tab-target="delta-panel-separate">Separate documents</button>
      <a id="delta-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>Complete PDF</a>
    </div>
    <div id="delta-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="delta-bundles" class="cc-file-list"></div></div>
    <div id="delta-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="delta-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">This generator needs JavaScript to compose the photographs and create the PDFs.</p></noscript>
</section>

## What is studied at each point

| Place on the map | Evidence (phase 1) | With the model (phase 2) |
|---|---|---|
| Fish Market Roundabout, \(t=2\) | Photos on both sides and at the exact instant | Continuous: \(f(2)=4\) |
| River Tunnel, \(3<t<5\) | Only the two portals | Under the continuity hypothesis, the IVT guarantees an instant under the river (northing 6) |
| Diagonal Avenue, \(t=6\) | Depending on the team: the wanted car, the look-alike or a detection without an image | \(f\) is continuous; the automatic record \(g\) has a removable discontinuity |
| Link Hill, \(t=8\) | Northings towards 10 from the left and towards 12 from the right | Finite jump |
| The Labyrinth, \(t\to10^-\) | Northings alternating between 10 and 12 | The left limit does not exist (oscillation) |
| North Motorway, \(t\to12^-\) | Northings 14, 18, 30, 50… | Infinite limit; asymptote \(t=12\) (the railway) |

A photograph of the look-alike plate is **not** a value of \(f\): it is classified as an identification error, and at that instant the wanted car's position remains unknown to that team. Nor does a detection without an image mean that the car had no position: it was somewhere, but nobody can check the plate.

The map is stylised so that the route coincides with the graph: that is why it carries no scale in metres and the activity never asks for distances or speeds. The jump, the oscillation and the infinite limit are idealisations of the model, not facts that a camera could record; the teacher guide explains how to handle it if the class notices.

<p class="cc-disclaimer">The city, plates, vehicles and record are fictional and purely educational. The photographs were generated with artificial intelligence and do not depict real places or people.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/delta-city-core.js?v=20261004a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/delta-city-generator.js?v=20261004a"></script>
