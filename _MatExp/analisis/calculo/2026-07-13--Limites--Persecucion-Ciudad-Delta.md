---
title: "Calculus Cases: la persecución de Ciudad Delta"
lang: es
page_id: matexp-limits-city-delta-pursuit
date: '2026-07-13 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - límites
taxonomy: experimento límites continuidad análisis cálculo Calculus-Cases
permalink: "/MatExp/analisis/calculo/limites/persecucion-ciudad-delta/"
header:
  image: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/header-brand.jpg"
excerpt: "Una persecución reconstruida con las fotografías de las cámaras de tráfico: primero la evidencia, después el modelo y, solo entonces, los límites y la continuidad."
feature: "/assets/MatExp/analisis/calculo/limites-ciudad-delta/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css">

Un turismo burdeos se salta el control de salida del puerto de **Ciudad Delta** y atraviesa la ciudad hasta perderse por la autovía del norte. La patrulla no consigue seguirlo: de su recorrido solo queda el registro de las cámaras de tráfico con lectura de matrículas. El inspector jefe, papel que asume el docente, quiere saber por dónde pasó el coche y qué puede afirmarse con seguridad en cada tramo. Tres equipos reciben extractos casi idénticos de ese registro. Por la ciudad circula otro coche del mismo modelo, de un rojo parecido y con una matrícula parecida, y una lectura apresurada puede llevar a la conclusión equivocada.

La actividad tiene dos fases que no se mezclan:

1. **Evidencia, en casa.** Cada fotografía es un dato puntual: una cámara, una hora y una matrícula. El consultor que llevaba el caso dejó su hoja de investigación a medias, con las primeras pruebas ya pasadas a limpio; los equipos la retoman, comprueban todas las matrículas, descartan los errores de identificación y proponen *candidatos* para lo que ocurre cerca de cada punto delicado. Solo una foto del coche buscado da un valor \(f(t)\), y un número finito de fotografías no demuestra ningún límite.
2. **Coordinación y modelo, en clase.** Los equipos comparan sus informes prueba a prueba y después se abre un sobre con una función explícita \(f\) que modeliza la trayectoria; sus dos primeros tramos son los que el alumnado habrá propuesto en casa. Sobre ella sí se calculan valores, límites laterales y límites, y se clasifican la continuidad, la discontinuidad evitable, el salto, la oscilación y el límite infinito. Antes de la fórmula, la sola hipótesis de continuidad permite usar el teorema del valor intermedio en el túnel.

El plano lleva una cuadrícula de columnas, de oeste a este, y de cotas, de sur a norte, y está dibujado a partir de esa función. El consultor dejó anotada una regularidad: en todas las fotografías del coche buscado, la columna de la cámara coincide con el minuto \(t\). El modelo supone que se cumple en todo instante y, con esa hipótesis, la ruta del coche sobre el plano **es** la gráfica de \(f\).

La actividad ocupa dos clases. Al final de la primera, el docente, en el papel de inspector jefe, presenta el caso y entrega los paquetes; la parte mecánica se hace en casa, y la segunda clase se dedica a la reunión de coordinación, el modelo y la exposición de cada equipo.

$$
f(t)=\begin{cases}
t^{2} & \text{si } 0\le t\le 2,\\
t+2 & \text{si } 2<t<8,\\
11+\sin\!\left(\dfrac{\pi}{10-t}\right) & \text{si } 8\le t<10,\\
10+\dfrac{4}{12-t} & \text{si } 10\le t<12.
\end{cases}
$$

<div class="cc-gallery" aria-label="Algunas fotografías de las cámaras">
  <figure><img data-delta-camera="LO-2" src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/photos/lo-2.jpg" alt="Cámara en la isleta de la Glorieta de la Lonja"><figcaption>Glorieta de la Lonja, cerca de \(t=2\).</figcaption></figure>
  <figure><img data-delta-camera="TU-S" src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/photos/tu-s.jpg" alt="Portal sur del Túnel del Río"><figcaption>Túnel del Río: sin cámaras entre \(t=3\) y \(t=5\).</figcaption></figure>
  <figure><img data-delta-camera="LB-5" src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/photos/lb-5.jpg" alt="Boca de un callejón de El Laberinto sobre la Ronda Norte"><figcaption>El Laberinto: cotas que alternan cerca de \(t=10\).</figcaption></figure>
</div>

## Generador de materiales

Elige la ciudad, la fecha, la hora de inicio y la matrícula del vehículo perseguido. El generador propone una segunda matrícula **confundible**, del mismo formato y con dos o tres caracteres cambiados, que puedes editar. Esa es la matrícula del otro coche: el mismo modelo, en un rojo cobrizo parecido al burdeos del coche buscado, pero distinto si se mira con atención. Las matrículas se colocan en perspectiva sobre cada fotografía, igual en la vista previa que en los PDF.

<section class="cc-case" data-case="delta-city" data-lang="es" aria-label="Generador del caso de Ciudad Delta">
  <section class="cc-workspace">
    <form id="delta-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <div class="cc-form-grid">
        <label class="cc-full">Nombre de la ciudad
          <input id="delta-city" type="text" value="Ciudad Delta" maxlength="40" required>
        </label>
        <label>Fecha del caso
          <input id="delta-date" type="date" value="2026-10-02">
        </label>
        <label>Hora de inicio (t = 0)
          <input id="delta-start" type="time" value="18:00" step="60">
        </label>
        <fieldset>
          <legend>Matrículas</legend>
          <div class="cc-form-grid">
            <label>Vehículo perseguido
              <input id="delta-plate" class="cc-mono" type="text" value="4871 MCV" maxlength="12" autocomplete="off" spellcheck="false" required>
            </label>
            <label>Vehículo confundible
              <span class="cc-inline">
                <input id="delta-alt" class="cc-mono" type="text" value="" maxlength="12" autocomplete="off" spellcheck="false" required>
                <button id="delta-suggest" class="cc-secondary" type="button" title="Proponer otra matrícula confundible">Otra</button>
              </span>
            </label>
          </div>
          <p id="delta-check" class="cc-note" role="status" aria-live="polite"></p>
        </fieldset>
        <label class="cc-full">Formato PDF
          <select id="delta-format">
            <option value="a4" selected>A4</option>
            <option value="letter">Carta / Letter</option>
          </select>
        </label>
      </div>
      <div class="cc-actions">
        <button id="delta-generate" type="submit">Generar documentos</button>
        <button id="delta-clear" class="cc-secondary" type="button">Limpiar descargas</button>
      </div>
      <div id="delta-status" class="cc-status" role="status" aria-live="polite"></div>
    </form>

    <aside class="cc-panel" aria-labelledby="delta-summary-title">
      <h2 id="delta-summary-title">Resumen del expediente</h2>
      <ul id="delta-summary" class="cc-summary"></ul>
      <div id="delta-preview" class="cc-preview" aria-live="polite">Cargando la vista previa…</div>
    </aside>
  </section>

  <section id="delta-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="delta-documents-title">
    <h2 id="delta-documents-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Al final de la primera clase, reparte los paquetes de la fase 1: un ejemplar por estudiante, distinto para cada equipo. El paquete de la fase 2 se entrega en la segunda clase, después de la reunión de coordinación. El paquete docente contiene la comparación de equipos y no debe circular antes. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="delta-panel-bundles" data-cc-tab-target="delta-panel-bundles">Paquetes por rol</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="delta-panel-separate" data-cc-tab-target="delta-panel-separate">Documentos separados</button>
      <a id="delta-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="delta-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="delta-bundles" class="cc-file-list"></div></div>
    <div id="delta-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="delta-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para componer las fotografías y crear los PDF.</p></noscript>
</section>

## Qué se estudia en cada punto

| Lugar del plano | Evidencia (fase 1) | Con el modelo (fase 2) |
|---|---|---|
| Glorieta de la Lonja, \(t=2\) | Fotos a ambos lados y en el instante exacto | Continua: \(f(2)=4\) |
| Túnel del Río, \(3<t<5\) | Solo los dos portales | Con la hipótesis de continuidad, el TVI asegura un instante bajo el río (cota 6) |
| Avenida Diagonal, \(t=6\) | Según el equipo: el coche buscado, el confundible o una detección sin imagen | \(f\) es continua; el registro automático \(g\) tiene una discontinuidad evitable |
| Cuesta del Enlace, \(t=8\) | Cotas hacia 10 por la izquierda y hacia 12 por la derecha | Salto finito |
| El Laberinto, \(t\to10^-\) | Cotas que alternan entre 10 y 12 | No existe el límite por la izquierda (oscilación) |
| Autovía del Norte, \(t\to12^-\) | Cotas 14, 18, 30, 50… | Límite infinito; asíntota \(t=12\) (el ferrocarril) |

Una fotografía de la matrícula confundible **no** es un valor de \(f\): se clasifica como error de identificación y, en ese instante, la posición del coche buscado queda desconocida para ese equipo. Tampoco una detección sin imagen significa que el coche no tuviera posición: estaba en algún sitio, pero nadie puede comprobar la matrícula.

El plano está estilizado para que la ruta coincida con la gráfica: por eso no lleva escala en metros y la actividad no pide calcular distancias ni velocidades. El salto, la oscilación y el límite infinito son idealizaciones del modelo, no hechos que una cámara pueda registrar; la guía docente explica cómo tratarlo si la clase lo advierte.

<p class="cc-disclaimer">La ciudad, las matrículas, los vehículos y el registro son ficticios y exclusivamente educativos. Las fotografías se han generado con inteligencia artificial y no representan lugares ni personas reales.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/delta-city-core.js?v=20261004a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/limites-ciudad-delta/delta-city-generator.js?v=20261004a"></script>
