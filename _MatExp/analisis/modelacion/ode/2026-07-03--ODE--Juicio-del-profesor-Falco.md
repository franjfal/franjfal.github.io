---
title: "ODE: el juicio del profesor"
lang: es
page_id: matexp-ode-professor-trial
date: '2026-07-03 20:30:00 +0200'
categories:
  - experimento
  - análisis
  - modelación
  - ODE
permalink: "/MatExp/analisis/modelacion/ode/juicio-profesor-falco/"
header:
  image: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/header.jpg"
excerpt: "Generador de documentos para una actividad de juicio matemático basada en la ley de enfriamiento de Newton."
feature: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/feature.svg"
sidebar:
  nav: "calculus-casebook"
---
Esta actividad convierte la ley de enfriamiento de Newton en un juicio. El alumnado recibe papeles separados, interroga a testigos y sospechosos, y reconstruye la cronología hasta encontrar a la persona culpable.

El generador permite elegir el formato del PDF, el nombre del profesor, la clase impartida, la fecha del caso, las horas de inicio y fin de la clase, y el nombre y género de cada sospechoso. A partir de esos datos produce los documentos necesarios para repartir la actividad en el aula, tanto por piezas separadas como en paquetes completos por rol o en un único PDF completo.

<figure>
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/assets/cover_scene.png" alt="Aula preparada como escena del caso">
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
    border: 1px solid var(--trial-line);
    border-radius: 6px;
    padding: 12px 14px;
    background: #fff;
  }

  .trial-generator .switch-field span {
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

<section class="trial-generator" aria-label="Generador del juicio del profesor">
  <section class="workspace">
    <form id="case-form" class="panel">
      <h2>Datos del caso</h2>
      <div class="form-grid">
        <label class="full">
          Nombre del profesor
          <input id="teacher-name" name="teacherName" type="text" value="Javier Falcó" required>
        </label>
        <label class="full">
          Clase impartida
          <input id="class-name" name="className" type="text" value="ecuaciones diferenciales y transformadas de Laplace" required>
        </label>
        <label>
          Formato PDF
          <select id="page-format" name="pageFormat">
            <option value="a4" selected>A4</option>
            <option value="letter">Carta americana</option>
          </select>
        </label>
        <label class="full switch-field">
          <span>Informe matemático para ecuaciones diferenciales</span>
          <input id="math-mode" name="mathMode" type="checkbox" aria-label="Usar informe matemático para curso de ecuaciones diferenciales">
        </label>
        <label>
          Fecha del caso
          <input id="case-date" name="caseDate" type="date" value="2026-07-02">
        </label>
        <label>
          Inicio de la clase
          <input id="class-start-time" name="classStartTime" type="time" value="10:30" required>
        </label>
        <label>
          Fin de la clase
          <input id="class-end-time" name="classEndTime" type="time" value="12:30" required>
        </label>
        <label>
          Nombre sospechoso 1
          <input id="suspect-1-name" name="suspect1Name" type="text" placeholder="Sospechosa 1">
        </label>
        <label>
          Género sospechoso 1
          <select id="suspect-1-gender" name="suspect1Gender">
            <option value="f" selected>Mujer</option>
            <option value="m">Hombre</option>
          </select>
        </label>
        <label>
          Nombre sospechoso 2
          <input id="suspect-2-name" name="suspect2Name" type="text" placeholder="Sospechoso 2">
        </label>
        <label>
          Género sospechoso 2
          <select id="suspect-2-gender" name="suspect2Gender">
            <option value="m" selected>Hombre</option>
            <option value="f">Mujer</option>
          </select>
        </label>
        <label>
          Nombre sospechoso 3
          <input id="suspect-3-name" name="suspect3Name" type="text" placeholder="Sospechoso 3">
        </label>
        <label>
          Género sospechoso 3
          <select id="suspect-3-gender" name="suspect3Gender">
            <option value="m" selected>Hombre</option>
            <option value="f">Mujer</option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button id="generate-button" type="submit">Generar documentos</button>
        <button id="clear-button" class="secondary" type="button">Limpiar descargas</button>
      </div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
    </form>

    <aside class="panel" aria-labelledby="case-summary-title">
      <h2 id="case-summary-title">Resumen calculado</h2>
      <ul id="case-summary" class="summary-list"></ul>
    </aside>
  </section>

  <section id="downloads-panel" class="panel hidden" aria-labelledby="downloads-title" style="margin-top: 22px;">
    <h2 id="downloads-title">Descargas</h2>
    <p class="download-note">
      Usa la pestaña de documentos conjuntos si vas a repartir la actividad:
      cada descarga por rol incluye el contexto común, el dossier compartido y
      los documentos específicos que le corresponden. Usa la pestaña de
      documentos separados si quieres comprobar o imprimir cada pieza por separado.
    </p>
    <div class="tabs" role="tablist" aria-label="Tipo de descarga">
      <button id="tab-bundles" class="tab-button" type="button" role="tab" aria-selected="true" aria-controls="panel-bundles" data-tab-target="panel-bundles">
        Documentos conjuntos
      </button>
      <button id="tab-separate" class="tab-button" type="button" role="tab" aria-selected="false" aria-controls="panel-separate" data-tab-target="panel-separate">
        Documentos separados
      </button>
      <a id="complete-pdf-link" class="tab-button hidden" href="#" download>
        PDF completo
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
