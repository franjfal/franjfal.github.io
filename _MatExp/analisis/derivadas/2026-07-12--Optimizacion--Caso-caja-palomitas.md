---
title: "Calculus Cases: la caja de palomitas perfecta"
lang: es
page_id: matexp-optimal-popcorn-box-case
date: '2026-07-12 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - derivadas
  - optimización
taxonomy: experimento optimización análisis derivadas aplicaciones Calculus-Cases
permalink: "/MatExp/analisis/derivadas/caja-palomitas-optima/"
header:
  image: "/assets/MatExp/analisis/derivadas/caja-palomitas-optima/header.jpg"
excerpt: "Un caso de publicidad, reclamaciones y optimización: demuestra cuál es la caja de mayor capacidad y genera todos los documentos de la actividad."
feature: "/assets/MatExp/analisis/derivadas/caja-palomitas-optima/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box.css">

Una cadena de cines anuncia su nuevo envase con una afirmación rotunda: **«La caja de mayor capacidad: más palomitas con el mismo cartón»**. Una asociación de consumidores presenta una reclamación por posible publicidad engañosa. La empresa deberá demostrar su *claim* y el alumnado tendrá que decidir si las matemáticas lo respaldan.

La caja se construye a partir de una hoja rectangular de lados \(L\) y \(W\). Se recorta en cada esquina un cuadrado de lado \(x\), siempre del mismo tamaño, y se pliegan las cuatro paredes. La altura será \(x\) y la base medirá \((L-2x)\times(W-2x)\), de modo que

\[
V(x)=x(L-2x)(W-2x), \qquad 0<x<\frac{\min(L,W)}{2}.
\]

El generador calcula la caja óptima para formatos habituales o para una hoja personalizada. Después crea la plantilla a escala real, el anuncio, la reclamación, la patente ficticia, los dossieres de investigación y la solución reservada al profesorado.

<section class="popcorn-case" data-lang="es" aria-label="Generador del caso de la caja de palomitas">
  <section class="pc-workspace">
    <form id="popcorn-form" class="pc-panel">
      <h2>Configura el caso</h2>
      <div class="pc-form-grid">
        <label class="pc-full">Tamaño del papel
          <select id="paper-size" name="paperSize">
            <option value="a5">A5 — 210 × 148 mm</option>
            <option value="a4" selected>A4 — 297 × 210 mm</option>
            <option value="letter">Carta / Letter — 279,4 × 215,9 mm</option>
            <option value="legal">Legal — 355,6 × 215,9 mm</option>
            <option value="a3">A3 — 420 × 297 mm</option>
            <option value="tabloid">Tabloide — 431,8 × 279,4 mm</option>
            <option value="cardstock">Cartulina 12 × 18 in — 457,2 × 304,8 mm</option>
            <option value="custom">Medidas personalizadas</option>
          </select>
        </label>
        <label>Largo (mm)
          <input id="paper-length" name="paperLength" type="number" min="50" max="1000" step="0.1" value="297" required>
        </label>
        <label>Ancho (mm)
          <input id="paper-width" name="paperWidth" type="number" min="50" max="1000" step="0.1" value="210" required>
        </label>
        <p class="pc-full pc-help">Para evitar plantillas inmanejables, cada lado debe medir entre 50 y 1000 mm.</p>
        <label class="pc-full">Nombre de la empresa
          <input id="company-name" name="companyName" type="text" value="Cines Horizonte" maxlength="80" required>
        </label>
        <label class="pc-full">Curso o grupo
          <input id="course-name" name="courseName" type="text" value="Cálculo diferencial" maxlength="100" required>
        </label>
      </div>
      <div class="pc-actions">
        <button id="popcorn-generate" type="submit">Generar actividad</button>
        <button id="popcorn-clear" class="pc-secondary" type="button">Limpiar descargas</button>
      </div>
      <div id="popcorn-status" class="pc-status" role="status" aria-live="polite"></div>
    </form>

    <aside class="pc-panel" aria-labelledby="popcorn-summary-title">
      <h2 id="popcorn-summary-title">Caja óptima calculada</h2>
      <ul id="popcorn-summary" class="pc-summary"></ul>
      <div id="popcorn-preview" class="pc-preview"></div>
      <div class="pc-legend">
        <span><i class="pc-swatch cut"></i>Recortar</span>
        <span><i class="pc-swatch fold"></i>Plegar</span>
      </div>
    </aside>
  </section>

  <section id="popcorn-documents" class="pc-panel pc-documents pc-hidden" aria-labelledby="popcorn-documents-title">
    <h2 id="popcorn-documents-title">Documentos de la actividad</h2>
    <p class="pc-download-note">Los paquetes reúnen los documentos que recibe cada rol. Debajo puedes desplegar, ver o descargar cada pieza por separado. La plantilla usa una página PDF del tamaño exacto de la hoja: imprímela al 100 %, sin «ajustar a página».</p>
    <div id="popcorn-bundles" class="pc-bundles"></div>
    <div id="popcorn-doc-list" class="pc-doc-list"></div>
  </section>
  <noscript><p class="pc-noscript">Este generador necesita JavaScript para calcular la caja y crear los PDF.</p></noscript>
</section>

## Por qué el corte generado es óptimo

Al derivar la función volumen obtenemos

\[
V'(x)=12x^2-4(L+W)x+LW.
\]

Sus dos raíces son

\[
x=\frac{(L+W)\pm\sqrt{L^2-LW+W^2}}{6}.
\]

La raíz con el signo menos es la única que pertenece al dominio físico:

\[
x^*=\frac{(L+W)-\sqrt{L^2-LW+W^2}}{6}.
\]

El generador compara este punto crítico con los extremos del intervalo, donde el volumen es cero, y comprueba además que \(V''(x^*)<0\). Por tanto, \(x^*\) produce el máximo global dentro del modelo: una hoja rectangular fija, cuatro recortes cuadrados iguales, una caja abierta y ningún material adicional.

Los documentos de publicidad, reclamación y patente son **ficticios y exclusivamente educativos**. No constituyen publicidad real, asesoramiento jurídico ni una solicitud de patente.

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box-generator.js"></script>
