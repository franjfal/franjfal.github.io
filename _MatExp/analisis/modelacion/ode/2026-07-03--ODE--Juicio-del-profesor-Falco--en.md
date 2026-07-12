---
title: "ODE: The Professor's Trial"

lang: en
page_id: matexp-ode-professor-trial
date: '2026-07-03 20:30:00 +0200'
categories:
  - experiment
  - analysis
  - modeling
  - ODE
permalink: "/MatExp/analysis/modeling/ode/professor-falco-trial/"

header:
  image: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/header.jpg"
excerpt: "Document generator for a mathematical trial activity based on Newton's law of cooling."

feature: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/feature.svg"
---
This activity turns Newton's law of cooling into a trial. Students receive separate roles, question witnesses and suspects, and reconstruct the timeline until they identify the culprit.

The generator lets you choose the PDF format, the professor's name, the class, the case date, the class start and end times, and each suspect's name and gender. From those data it produces the documents needed to run the classroom activity as separate pieces, complete role packets, or one full PDF.

<figure>
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/assets/cover_scene.png" alt="Classroom prepared as the case scene">
</figure>

<style>
  .trial-generator {
    color-scheme: light;
    --trial-ink: #202a33;
    --trial-muted: #5a6570;
    --trial-line: #d8dee4;
    --trial-paper: #f7f5ef;
    --trial-panel: #ffffff;
    --trial-accent: #c85648;
    --trial-accent-dark: #993f35;
    --trial-blue: #2f5f77;
    --trial-green: #607f61;
    margin: 1.5rem 0 2rem;
    padding: 24px;
    border: 1px solid var(--trial-line);
    border-radius: 8px;
    background: var(--trial-paper);
    color: var(--trial-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.5;
  }

  .trial-generator * {
    box-sizing: border-box;
  }

  .trial-generator h2 {
    margin: 0 0 14px;
    font-size: 1.35rem;
    letter-spacing: 0;
  }

  .trial-generator p {
    margin: 0 0 12px;
    color: var(--trial-muted);
  }

  .trial-generator .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: 22px;
    align-items: start;
  }

  .trial-generator .panel {
    background: var(--trial-panel);
    border: 1px solid var(--trial-line);
    border-radius: 8px;
    padding: 20px;
  }

  .trial-generator .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .trial-generator .full {
    grid-column: 1 / -1;
  }

  .trial-generator label {
    display: grid;
    gap: 7px;
    font-weight: 700;
    color: var(--trial-ink);
  }

  .trial-generator input,
  .trial-generator select {
    width: 100%;
    min-height: 42px;
    border: 1px solid #b9c2ca;
    border-radius: 6px;
    padding: 8px 10px;
    font: inherit;
    color: var(--trial-ink);
    background: #fff;
  }

  .trial-generator .switch-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-width: 0;
    max-width: 100%;
    border: 1px solid var(--trial-line);
    border-radius: 6px;
    padding: 12px 14px;
    background: #fff;
  }

  .trial-generator .switch-field span {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 700;
  }

  .trial-generator .switch-field input {
    width: 46px;
    height: 24px;
    min-height: 24px;
    flex: none;
    appearance: none;
    border-radius: 999px;
    padding: 0;
    background: #c9d1d8;
    cursor: pointer;
    position: relative;
    transition: background 0.2s ease;
  }

  .trial-generator .switch-field input::before {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    top: 2px;
    left: 3px;
    transition: transform 0.2s ease;
  }

  .trial-generator .switch-field input:checked {
    background: var(--trial-blue);
  }

  .trial-generator .switch-field input:checked::before {
    transform: translateX(20px);
  }

  .trial-generator .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .trial-generator button,
  .trial-generator .download-link {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 10px 14px;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
  }

  .trial-generator button[type="submit"],
  .trial-generator .primary-link {
    background: var(--trial-accent);
    color: #fff;
  }

  .trial-generator button[type="submit"]:hover,
  .trial-generator .primary-link:hover {
    background: var(--trial-accent-dark);
  }

  .trial-generator button.secondary {
    background: #fff;
    border-color: #b9c2ca;
    color: var(--trial-ink);
  }

  .trial-generator button.secondary:hover {
    border-color: var(--trial-blue);
    color: var(--trial-blue);
  }

  .trial-generator button:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  .trial-generator .status {
    min-height: 24px;
    margin-top: 12px;
    color: var(--trial-blue);
    font-weight: 700;
  }

  .trial-generator .summary-list {
    display: grid;
    gap: 9px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .trial-generator .summary-list li {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    border-bottom: 1px solid var(--trial-line);
    padding-bottom: 9px;
  }

  .trial-generator .summary-list strong {
    color: var(--trial-ink);
  }

  .trial-generator .downloads {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .trial-generator .download-note {
    margin-bottom: 14px;
  }

  .trial-generator .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px solid var(--trial-line);
    margin: 16px 0 14px;
    padding-bottom: 8px;
  }

  .trial-generator .tab-button {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 10px 14px;
    border: 1px solid #b9c2ca;
    border-radius: 6px;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    background: #fff;
    color: var(--trial-ink);
  }

  .trial-generator .tab-button[aria-selected="true"] {
    background: var(--trial-blue);
    border-color: var(--trial-blue);
    color: #fff;
  }

  .trial-generator .tab-panel[hidden] {
    display: none;
  }

  .trial-generator .download-link {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    border-color: #c9d1d8;
    background: #fff;
    color: var(--trial-ink);
  }

  .trial-generator .download-title {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .trial-generator .download-actions {
    display: flex;
    flex: none;
    gap: 8px;
  }

  .trial-generator .download-icon {
    display: inline-flex;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    border: 1px solid currentColor;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.85);
    color: inherit;
    text-decoration: none;
  }

  .trial-generator .download-icon svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
  }

  .trial-generator .download-icon:hover,
  .trial-generator .download-icon:focus {
    background: #fff;
    color: var(--trial-blue);
  }

  .trial-generator .download-link:hover {
    border-color: var(--trial-green);
    color: var(--trial-green);
  }

  .trial-generator .download-link.primary-link,
  .trial-generator .download-link.primary-link:visited,
  .trial-generator .download-link.primary-link:focus {
    border-color: var(--trial-accent);
    background: var(--trial-accent);
    color: #fff;
  }

  .trial-generator .download-link.primary-link .download-icon {
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  .trial-generator .download-link.primary-link .download-icon:hover,
  .trial-generator .download-link.primary-link .download-icon:focus {
    background: #fff;
    color: var(--trial-accent-dark);
  }

  .trial-generator .download-link.primary-link:hover,
  .trial-generator .download-link.primary-link:active {
    border-color: var(--trial-accent-dark);
    background: var(--trial-accent-dark);
    color: #fff;
  }

  .trial-generator .hidden {
    display: none;
  }

  @media (max-width: 820px) {
    .trial-generator {
      padding: 16px;
    }

    .trial-generator .workspace,
    .trial-generator .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<section class="trial-generator" data-lang="en" aria-label="Professor trial generator">
  <section class="workspace">
    <form id="case-form" class="panel">
      <h2>Case details</h2>
      <div class="form-grid">
        <label class="full">
          Professor's name
          <input id="teacher-name" name="teacherName" type="text" value="Javier Falcó" required>
        </label>
        <label class="full">
          Course taught
          <input id="class-name" name="className" type="text" value="differential equations and Laplace transforms" required>
        </label>
        <label>
          PDF format
          <select id="page-format" name="pageFormat">
            <option value="a4" selected>A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
        <label class="full switch-field">
          <span>Mathematical report for differential equations</span>
          <input id="math-mode" name="mathMode" type="checkbox" aria-label="Use the mathematical report for a differential equations course">
        </label>
        <label>
          Case date
          <input id="case-date" name="caseDate" type="date" value="2026-07-02">
        </label>
        <label>
          Class starts
          <input id="class-start-time" name="classStartTime" type="time" value="10:30" required>
        </label>
        <label>
          Class ends
          <input id="class-end-time" name="classEndTime" type="time" value="12:30" required>
        </label>
        <label>
          Suspect 1 name
          <input id="suspect-1-name" name="suspect1Name" type="text" placeholder="Suspect 1">
        </label>
        <label>
          Suspect 1 gender
          <select id="suspect-1-gender" name="suspect1Gender">
            <option value="f" selected>Woman</option>
            <option value="m">Man</option>
          </select>
        </label>
        <label>
          Suspect 2 name
          <input id="suspect-2-name" name="suspect2Name" type="text" placeholder="Suspect 2">
        </label>
        <label>
          Suspect 2 gender
          <select id="suspect-2-gender" name="suspect2Gender">
            <option value="m" selected>Man</option>
            <option value="f">Woman</option>
          </select>
        </label>
        <label>
          Suspect 3 name
          <input id="suspect-3-name" name="suspect3Name" type="text" placeholder="Suspect 3">
        </label>
        <label>
          Suspect 3 gender
          <select id="suspect-3-gender" name="suspect3Gender">
            <option value="m" selected>Man</option>
            <option value="f">Woman</option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button id="generate-button" type="submit">Generate documents</button>
        <button id="clear-button" class="secondary" type="button">Clear downloads</button>
      </div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
    </form>

    <aside class="panel" aria-labelledby="case-summary-title">
      <h2 id="case-summary-title">Calculated summary</h2>
      <ul id="case-summary" class="summary-list"></ul>
    </aside>
  </section>

  <section id="downloads-panel" class="panel hidden" aria-labelledby="downloads-title" style="margin-top: 22px;">
    <h2 id="downloads-title">Downloads</h2>
    <p class="download-note">
      Use the role packets tab when distributing the activity: each role download
      includes the common context, the shared case file, and its specific documents.
      Use the separate documents tab to review or print each item individually.
    </p>
    <div class="tabs" role="tablist" aria-label="Download type">
      <button id="tab-bundles" class="tab-button" type="button" role="tab" aria-selected="true" aria-controls="panel-bundles" data-tab-target="panel-bundles">
        Role packets
      </button>
      <button id="tab-separate" class="tab-button" type="button" role="tab" aria-selected="false" aria-controls="panel-separate" data-tab-target="panel-separate">
        Separate documents
      </button>
      <a id="complete-pdf-link" class="tab-button hidden" href="#" download>
        Complete PDF
      </a>
    </div>
    <div id="panel-bundles" class="tab-panel" role="tabpanel" aria-labelledby="tab-bundles">
      <div id="bundle-downloads" class="downloads"></div>
    </div>
    <div id="panel-separate" class="tab-panel" role="tabpanel" aria-labelledby="tab-separate" hidden>
      <div id="separate-downloads" class="downloads"></div>
    </div>
  </section>
</section>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/murder-generator.js"></script>
