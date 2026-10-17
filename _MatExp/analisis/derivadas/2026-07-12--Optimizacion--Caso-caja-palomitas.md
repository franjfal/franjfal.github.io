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
  image: "/assets/MatExp/analisis/derivadas/caja-palomitas-optima/header-brand.jpg"
excerpt: "Un posible fraude a gran escala investigado mediante optimización: tres equipos construyen, contrastan la evidencia y emiten un dictamen matemático."
feature: "/assets/MatExp/analisis/derivadas/caja-palomitas-optima/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016d">
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box.css?v=20261016b">

Una cadena de cines anuncia su nuevo envase con una afirmación rotunda: **«La caja de mayor capacidad: más palomitas con el mismo cartón»**. Una asociación de consumidores asegura haber construido, con la misma hoja, una caja en la que caben más palomitas, y denuncia un posible fraude a gran escala. El inspector jefe, papel que asume el docente, reparte el caso entre tres equipos: la **Asociación de Consumidores** construye cajas con cortes distintos y sostiene la acusación; el **equipo del cine** fabrica la caja registrada en la patente; y la **consultoría técnico-forense de la policía** calcula por su cuenta, sin ver la patente, qué caja es la mayor, y emite el dictamen.

El caso sigue el formato de todos los Calculus Cases, con una diferencia: las cajas se construyen en clase, porque es barato y es la parte más divertida.

1. **Lanzamiento, al final de una clase (15–20 min).** Proyectas la presentación: el anuncio, la denuncia, la pregunta y los tres equipos de tu clase. Cada pareja o grupo recibe su paquete, y cada pareja de la Asociación elige su corte.
2. **En casa.** La consultoría modela, deriva y demuestra el máximo sin conocer la patente (45–60 min); la Asociación calcula el volumen que predice su corte y el cine prepara la fabricación (15–20 min).
3. **Clase de cierre (60 min).** Se construyen y se miden las cajas (fase 1, 25 min); la consultoría recibe la reclamación y la patente y, con las palomitas, se hace la prueba de trasvase (fase 2, 15 min); la consultoría emite su dictamen (12 min) y cada estudiante hace una comprobación individual (5 min).

La caja se construye a partir de una hoja rectangular de lados \(L\) y \(W\). Se recorta en cada esquina un cuadrado de lado \(x\), siempre del mismo tamaño, y se pliegan las cuatro paredes. La altura será \(x\) y la base medirá \((L-2x)\times(W-2x)\), de modo que

$$
V(x)=x(L-2x)(W-2x), \qquad 0<x<\frac{\min(L,W)}{2}.
$$

## Generador de materiales

El configurador te guía en cuatro pasos. Lo único imprescindible es el número de estudiantes: con él, la web forma los tres equipos, calcula cuántas copias hay que imprimir de cada documento y cuántas hojas y palomitas hacen falta. Todo lo demás tiene ya un valor recomendado.

<section class="cc-case popcorn-case" data-lang="es" aria-label="Generador del caso de la caja de palomitas">
  <section class="cc-workspace">
    <form id="popcorn-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <section class="cc-step" data-cc-step-title="Tu clase">
        <h3>1. Tu clase</h3>
        <p class="cc-step-help">¿Cuántos estudiantes tienes? La Asociación de Consumidores es el equipo más numeroso, entre la mitad y dos tercios de la clase, y trabaja por parejas, cada una con su propio corte. El equipo del cine y la consultoría policial son dos equipos pequeños; con cinco consultores o más, la consultoría se divide en dos grupos que dictaminan por separado.</p>
        <label>Número de estudiantes
          <input id="popcorn-students" type="number" min="9" max="40" step="1" value="24">
        </label>
        <div id="popcorn-teams" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="La hoja">
        <h3>2. La hoja</h3>
        <p class="cc-step-help">El tamaño de la hoja con la que se construyen todas las cajas. A4 es lo recomendado: barato y fácil de recortar. Todas las cifras del caso, la plantilla a tamaño real y la solución dependen de esta hoja. Los documentos se imprimen en A4, o en Carta si la hoja es un formato estadounidense.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Tamaño del papel
            <select id="paper-size" name="paperSize">
              <option value="a5">A5 — 210 × 148 mm</option>
              <option value="a4" selected>A4 — 297 × 210 mm (recomendado)</option>
              <option value="letter">Carta / Letter — 279.4 × 215.9 mm</option>
              <option value="legal">Legal — 355.6 × 215.9 mm</option>
              <option value="a3">A3 — 420 × 297 mm</option>
              <option value="tabloid">Tabloide — 431.8 × 279.4 mm</option>
              <option value="cardstock">Cartulina 12 × 18 in — 457.2 × 304.8 mm</option>
              <option value="custom">Medidas personalizadas</option>
            </select>
          </label>
          <label>Largo (mm)
            <input id="paper-length" name="paperLength" type="number" min="50" max="1000" step="0.1" value="297" required>
          </label>
          <label>Ancho (mm)
            <input id="paper-width" name="paperWidth" type="number" min="50" max="1000" step="0.1" value="210" required>
          </label>
          <p class="cc-full cc-help">Para evitar plantillas inmanejables, cada lado debe medir entre 50 y 1000 mm.</p>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Personalizar (opcional)">
        <h3>3. Personalizar (opcional)</h3>
        <p class="cc-step-help">Puedes dejarlo como está. El nombre de la empresa aparece en el anuncio, la reclamación, la patente y los dosieres; el curso, en la ficha de cada documento. Ninguno de los dos cambia las matemáticas.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Nombre de la empresa
            <input id="company-name" name="companyName" type="text" value="Cines Horizonte" maxlength="80" required>
          </label>
          <label class="cc-full">Curso o grupo
            <input id="course-name" name="courseName" type="text" value="Cálculo diferencial" maxlength="100" required>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generar">
        <h3>4. Generar</h3>
        <p class="cc-step-help">La web compone los documentos de esta clase. Empieza por la guía de impresión y reparto: dice qué imprimir, cuántas copias y cuándo se entrega cada cosa. La presentación se proyecta desde aquí mismo en el lanzamiento y en la clase de cierre.</p>
        <div class="cc-actions">
          <button id="popcorn-generate" type="submit">Generar documentos</button>
          <button id="popcorn-project" class="cc-secondary" type="button">Proyectar la presentación</button>
          <button id="popcorn-clear" class="cc-secondary" type="button">Limpiar descargas</button>
        </div>
        <div id="popcorn-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="popcorn-summary-title">
      <h2 id="popcorn-summary-title">Resumen del expediente</h2>
      <ul id="popcorn-summary" class="cc-summary"></ul>
      <div>
        <div id="popcorn-preview" class="cc-preview"></div>
        <div class="cc-legend">
          <span><i class="cc-swatch cut"></i>Recortar</span>
          <span><i class="cc-swatch fold"></i>Plegar</span>
        </div>
      </div>
    </aside>
  </section>

  <section id="popcorn-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="popcorn-documents-title">
    <h2 id="popcorn-documents-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Empieza por la <strong>guía de impresión y reparto</strong>: dice qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento. El paquete del profesorado contiene la solución y no debe circular. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="popcorn-panel-bundles" data-cc-tab-target="popcorn-panel-bundles">Paquetes por rol</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="popcorn-panel-separate" data-cc-tab-target="popcorn-panel-separate">Documentos separados</button>
      <a id="popcorn-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Guía de impresión y reparto</a>
      <a id="popcorn-complete-pdf" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="popcorn-panel-bundles" class="cc-tab-panel" role="tabpanel">
      <div id="popcorn-bundles" class="cc-file-list"></div>
    </div>
    <div id="popcorn-panel-separate" class="cc-tab-panel" role="tabpanel" hidden>
      <div id="popcorn-doc-list" class="cc-file-list"></div>
    </div>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para calcular la caja y crear los PDF.</p></noscript>
</section>

## Por qué el corte generado es óptimo

Al derivar la función volumen obtenemos

$$
V'(x)=12x^2-4(L+W)x+LW.
$$

Sus dos raíces son

$$
x=\frac{(L+W)\pm\sqrt{L^2-LW+W^2}}{6}.
$$

La raíz con el signo menos es la única que pertenece al dominio físico:

$$
x^*=\frac{(L+W)-\sqrt{L^2-LW+W^2}}{6}.
$$

El generador compara este punto crítico con los extremos del intervalo, donde el volumen es cero, y comprueba además que \(V''(x^*)<0\). Por tanto, \(x^*\) produce el máximo global dentro del modelo: una hoja rectangular fija, cuatro recortes cuadrados iguales, una caja abierta y ningún material adicional. Cerca del óptimo la curva de volumen es casi plana, y por eso las palomitas apenas distinguen una caja buena de la mejor: lo que decide el caso es la derivada.

<p class="cc-disclaimer">Los documentos de publicidad, reclamación y patente son ficticios y exclusivamente educativos. No constituyen publicidad real, asesoramiento jurídico ni una solicitud de patente.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016c"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/caja-palomitas-optima/popcorn-box-generator.js?v=20261016c"></script>
