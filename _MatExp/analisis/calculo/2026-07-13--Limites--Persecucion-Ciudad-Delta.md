---
title: "Límites y continuidad: la persecución de Ciudad Delta"
lang: es
page_id: matexp-limits-city-delta-pursuit
date: '2026-07-13 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - límites
permalink: "/MatExp/analisis/calculo/limites/persecucion-ciudad-delta/"
header:
  image: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/header.jpg"
excerpt: "Generador de expedientes para investigar límites y continuidad mediante las fotografías de una persecución policial."
feature: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/feature.svg"
sidebar:
  nav:
    - calculus-casebook
---

Una persecución atraviesa Ciudad Delta. Las cámaras de tráfico han dejado una secuencia de fotografías, pero algunas imágenes faltan y otras podrían mostrar el vehículo equivocado. Tres equipos policiales reciben expedientes casi idénticos y deben reconstruir la posición del coche a partir de las pruebas de su dossier.

La actividad trabaja los límites laterales, la continuidad, distintos tipos de discontinuidad y los límites infinitos mediante una investigación colaborativa. El generador permite elegir el formato del PDF, el nombre de la ciudad y la fecha del caso. A partir de esos datos produce todos los materiales para el aula, incluida la guía docente con la estructura de la actividad, los puntos de investigación, la secuencia sugerida y las soluciones.

<figure>
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/header.jpg" alt="Placeholder de una persecución por Ciudad Delta">
</figure>

## Generador de materiales

El generador produce los tres paquetes de equipo, una guía docente con soluciones, los documentos separados y un PDF completo. Las fotografías y el mapa incluidos ahora son **placeholders de baja resolución** preparados para ser sustituidos por las imágenes definitivas sin cambiar la estructura de la actividad.

<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/casebook-generator.css">

<section class="casebook-generator" data-lang="es" aria-label="Generador de expedientes de límites y continuidad">
  <section class="case-workspace">
    <form id="casebook-form" class="case-panel">
      <h2>Datos del expediente</h2>
      <div class="case-form-grid">
        <label class="case-full">Nombre de la ciudad
          <input id="casebook-city" type="text" value="Ciudad Delta" required>
        </label>
        <label>Formato PDF
          <select id="casebook-format">
            <option value="a4" selected>A4</option>
            <option value="letter">Carta americana</option>
          </select>
        </label>
        <label>Fecha del caso
          <input id="casebook-date" type="date" value="2026-07-13">
        </label>
      </div>
      <div class="case-actions">
        <button id="casebook-generate" type="submit">Generar documentos</button>
        <button id="casebook-clear" class="case-secondary" type="button">Limpiar descargas</button>
      </div>
      <div id="casebook-status" class="case-status" role="status" aria-live="polite"></div>
    </form>

    <aside class="case-panel" aria-labelledby="casebook-summary-title">
      <h2 id="casebook-summary-title">Resumen del reparto</h2>
      <ul class="case-summary">
        <li><span>Archivos únicos</span><strong>30</strong></li>
        <li><span>Fotografías comunes</span><strong>22</strong></li>
        <li><span>Dossier A</span><strong>26 fotos</strong></li>
        <li><span>Dossier B</span><strong>26 fotos</strong></li>
        <li><span>Dossier C</span><strong>25 fotos</strong></li>
        <li><span>Vehículo investigado</span><strong>2718 LMT</strong></li>
      </ul>
    </aside>
  </section>

  <section id="casebook-download-panel" class="case-panel case-hidden" style="margin-top:22px" aria-labelledby="casebook-download-title">
    <h2 id="casebook-download-title">Descargas</h2>
    <p>Los paquetes de equipo están listos para repartir. Los documentos docentes contienen la comparación de resultados y no deben entregarse antes de la reunión final.</p>
    <div class="case-tabs" role="tablist" aria-label="Tipo de descarga">
      <button class="case-tab" type="button" role="tab" aria-selected="true" data-case-tab="casebook-bundles">Paquetes completos</button>
      <button class="case-tab" type="button" role="tab" aria-selected="false" data-case-tab="casebook-separate">Documentos separados</button>
      <a id="casebook-complete-pdf" class="case-tab case-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="casebook-bundles" role="tabpanel"><div id="casebook-bundle-downloads" class="case-downloads"></div></div>
    <div id="casebook-separate" role="tabpanel" hidden><div id="casebook-separate-downloads" class="case-downloads"></div></div>
  </section>
</section>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/casebook-generator.js"></script>
