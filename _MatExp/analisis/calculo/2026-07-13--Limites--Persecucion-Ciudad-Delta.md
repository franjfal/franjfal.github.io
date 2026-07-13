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

Una persecución atraviesa Ciudad Delta. Las cámaras de tráfico han dejado una secuencia de fotografías, pero algunas imágenes faltan y otras podrían mostrar el vehículo equivocado. Tres equipos policiales reciben expedientes casi idénticos y deben reconstruir la posición del coche sin saber que unas pocas pruebas estratégicas cambian de un dossier a otro.

La actividad introduce los límites laterales, la continuidad, las discontinuidades evitables y de salto, la oscilación y los límites infinitos a partir de una distinción esencial: **lo que ocurre cerca de un instante, lo que ocurre exactamente en ese instante y lo que permiten afirmar los datos disponibles**.

<figure>
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/header.jpg" alt="Placeholder de una persecución por Ciudad Delta">
</figure>

## La estructura del caso

El caso utiliza **30 archivos fotográficos únicos**. Los equipos A y B reciben 26 fotografías y el C recibe 25 porque la cámara exacta de \(t=2\) no registró imagen. Veintidós fotografías son comunes a todos; las ocho restantes son variantes de cuatro huecos estratégicos.

<table class="casebook-comparison">
  <thead>
    <tr><th>Punto</th><th>Grupo A</th><th>Grupo B</th><th>Grupo C</th></tr>
  </thead>
  <tbody>
    <tr><td>\(t=2\)</td><td>Imagen correcta: \(f(2)=4\)</td><td>Vehículo equivocado: \(f(2)=7\)</td><td>La cámara no registra imagen</td></tr>
    <tr><td>Túnel \(4&lt;t&lt;7\)</td><td colspan="3">No hay cámaras ni información dentro del túnel</td></tr>
    <tr><td>\(t=8\)</td><td>Los dos tramos se unen en 10</td><td>El tramo derecho se aproxima a 13</td><td>Los límites valen 10, pero la imagen exacta muestra 14</td></tr>
    <tr><td>Oscilación</td><td colspan="3">La misma secuencia alternante para todos</td></tr>
    <tr><td>Salida de la ciudad</td><td colspan="3">La misma secuencia no acotada para todos</td></tr>
  </tbody>
</table>

El alumnado no recibe esta tabla de comparación. Cada equipo solo ve su propio expediente, el mapa y una hoja de investigación.

## Cinco puntos de investigación

1. **La cámara de \(t=2\).** Las fotografías cercanas se aproximan a la posición 4. Según el equipo, la imagen exacta confirma ese valor, identifica otro coche en la posición 7 o no existe.
2. **El Túnel de la Recta.** La última cámara antes de entrar registra \(f(4)=6\) y la primera después de salir registra \(f(7)=9\). No existe ninguna imagen para \(4&lt;t&lt;7\). Aunque el tramo dibujado sea recto, los datos no permiten saber qué hizo el coche dentro, conocer \(f(6)\), calcular su límite ni decidir continuidad.
3. **El enlace de \(t=8\).** El grupo A observa una unión continua. El grupo B recibe dos fotografías del tablero superior desplazado y obtiene límites laterales distintos. El grupo C observa límites iguales, pero otra matrícula en el instante exacto.
4. **La rotonda del Laberinto.** Todos reciben la misma secuencia de posiciones alternantes. Las imágenes se toman cada vez más cerca del mismo instante, pero el coche no se aproxima a una única posición.
5. **La salida de Ciudad Delta.** Las últimas cámaras muestran posiciones cada vez mayores al acercarse a \(t=12\) por la izquierda. Este tramo abre la discusión sobre límites infinitos.

<div class="casebook-callout">
La incógnita no es únicamente «¿dónde estaba el coche?». En varios puntos, la respuesta matemáticamente correcta es «con estas pruebas no podemos decidirlo».
</div>

## Reunión de coordinación policial

Después del trabajo por equipos, la puesta en común se presenta como una reunión policial. Cada grupo debe defender su reconstrucción y explicar qué imágenes sostienen sus conclusiones. Las discrepancias aparecen de forma natural: una cámara puede estar equivocada, una imagen puede faltar y dos carreteras pueden no enlazar donde parecía.

Este conflicto permite formalizar después que \(f\) es continua en \(a\) cuando existe \(\lim_{t\to a}f(t)\), existe \(f(a)\) y ambos valores coinciden. También hace visible que conocer los dos límites laterales no siempre basta para decidir continuidad.

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
    </div>
    <div id="casebook-bundles" role="tabpanel"><div id="casebook-bundle-downloads" class="case-downloads"></div></div>
    <div id="casebook-separate" role="tabpanel" hidden><div id="casebook-separate-downloads" class="case-downloads"></div></div>
  </section>
</section>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/casebook-generator.js"></script>
