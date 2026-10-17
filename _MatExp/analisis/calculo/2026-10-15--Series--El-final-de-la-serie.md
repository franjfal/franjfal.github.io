---
title: "Calculus Cases: el final de la serie"
lang: es
page_id: matexp-series-finale-case
date: '2026-10-15 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - series
taxonomy: experimento sucesiones series convergencia análisis cálculo Calculus-Cases
permalink: "/MatExp/analisis/calculo/series/final-de-la-serie/"
header:
  image: "/assets/MatExp/analisis/calculo/series-final-de-la-serie/header-brand.jpg"
excerpt: "Alguien ha filtrado el final de una serie de televisión. Las pruebas son efectos visuales construidos con sucesiones y series: solo quien entienda su convergencia sabrá quién lo hizo."
feature: "/assets/MatExp/analisis/calculo/series-final-de-la-serie/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016d">
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/series-finale.css">

Diez segundos del final de **ZENO**, la serie más vista del año, aparecen de madrugada en un foro de fans. La plataforma aplaza el estreno y la productora descubre que alguien manipuló esa noche el proyecto del tráiler oficial. El inspector jefe, papel que asume el docente, reúne a la unidad: los efectos visuales de la serie están construidos con sucesiones y series, y esas series han dejado huellas. Una razón geométrica identifica la copia del vídeo, una suma aritmética fecha el render, una suma telescópica revela una sesión borrada y el exponente de una serie *p* delata qué versión de la biblia de efectos usó quien rehízo los planos.

El caso sigue el formato de todos los Calculus Cases: se lanza al final de una clase, se trabaja en casa y se cierra en la clase siguiente.

1. **Lanzamiento, al final de una clase (15–20 min).** Proyectas la presentación: la filtración, la serie y sus episodios, y el equipo creativo. Cada grupo recibe el dosier de un episodio y cinco estudiantes reciben, en sobre cerrado, la ficha de un sospechoso: la creadora, el guionista principal, la guionista del final, el asesor matemático y la montadora del tráiler.
2. **En casa (45–60 min).** Cada grupo analiza la prueba forense de su episodio, resuelve los ejercicios y elige los valores de su plano del tráiler. Los sospechosos preparan su papel.
3. **Clase de cierre (60 min).** Puesta en común en la sala de montaje: cada grupo dice su hallazgo e introduce su plano, y la clase ve su tráiler. Después se abre el sobre con los registros del edificio, se interroga a los sospechosos en tres rondas y cada grupo presenta su acusación. La solución es única y no se alcanza sin las matemáticas.

$$
\text{término } a_k \qquad\Big|\qquad \text{suma parcial } S_n=\sum_{k=1}^{n} a_k \qquad\Big|\qquad \text{serie } \sum_{k=1}^{\infty} a_k=\lim_{n\to\infty} S_n
$$

<div class="cc-gallery" aria-label="Fotogramas de la serie ZENO">
  <figure><img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/img/gallery-corridor.jpg" alt="Pasillo en perspectiva con anillos de luz que convergen hacia una puerta"><figcaption>Episodio 2: los anillos de eco forman una serie geométrica.</figcaption></figure>
  <figure><img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/img/gallery-doses.jpg" alt="Dos barras de dosis frente a una línea roja de umbral"><figcaption>Episodio 5: dos series <em>p</em>, una diverge y otra no.</figcaption></figure>
  <figure><img src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/img/gallery-beacon.jpg" alt="Escáner con una baliza que oscila sobre un pasillo"><figcaption>Episodio 6: el camino diverge; la posición converge.</figcaption></figure>
</div>

## Generador de materiales

El configurador te guía en cuatro pasos. Lo único imprescindible es el número de estudiantes: con él, la web forma los grupos, decide qué episodios se trabajan y calcula cuántas copias hay que imprimir. Todo lo demás tiene ya un valor recomendado.

<section class="cc-case sf-case" data-case="series-finale" data-lang="es" aria-label="Generador del caso El final de la serie">
  <section class="cc-workspace">
    <form id="sf-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <section class="cc-step" data-cc-step-title="Tu clase">
        <h3>1. Tu clase</h3>
        <p class="cc-step-help">¿Cuántos estudiantes tienes? Cinco harán de sospechosos (cinco parejas si son más de treinta) y el resto se reparte en grupos de dos a cinco, cada uno con un episodio. Con menos de seis grupos, los episodios que nadie trabaja llegan en el sobre como informe del laboratorio, y el caso se resuelve igual.</p>
        <label>Número de estudiantes
          <input id="sf-students" type="number" min="9" max="40" step="1" value="25">
        </label>
        <div id="sf-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Papel y ejercicios">
        <h3>2. Papel y ejercicios</h3>
        <p class="cc-step-help">El tamaño del papel y cuántos ejercicios lleva cada dosier. Con los esenciales (la prueba forense y los que la preparan), un grupo necesita unos 45–60 minutos en casa.</p>
        <div class="cc-form-grid">
          <label>Papel
            <select id="sf-format"><option value="a4" selected>A4</option><option value="letter">Carta / Letter</option></select>
          </label>
          <label>Ejercicios del dosier
            <select id="sf-level"><option value="B" selected>Esenciales (recomendado)</option><option value="E">Completos</option><option value="A">Con ampliación</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Personalizar (opcional)">
        <h3>3. Personalizar (opcional)</h3>
        <p class="cc-step-help">Puedes dejarlo todo como está. La fecha cambia el día de los hechos en todos los documentos. Los parámetros avanzados cambian las pruebas y todas las cifras que dependen de ellas; el generador comprueba que la evidencia siga señalando a un único culpable y, si no, lo explica y no deja generar.</p>
        <label>Noche de los hechos (martes)
          <input id="sf-night" type="date" value="2026-10-13">
        </label>
        <details class="sf-advanced">
          <summary>Parámetros de la investigación (avanzado)</summary>
          <div class="cc-form-grid">
            <label>Fotogramas del render <input id="sf-frames" type="number" min="24" max="2400" step="1" value="240"></label>
            <label>Coste del primer fotograma (s) <input id="sf-fcost" type="number" min="1" step="0.5" value="12"></label>
            <label>Incremento por fotograma (s) <input id="sf-fstep" type="number" min="0.01" step="0.01" value="0.25"></label>
            <label>Fin del render <input id="sf-finish" type="text" value="01:12:30" pattern="\d{2}:\d{2}:\d{2}"></label>
            <label class="cc-full">Razón de la copia de la sala de montaje
              <select id="sf-suite"><option>0.55</option><option>0.58</option><option>0.61</option><option selected>0.64</option><option>0.67</option><option>0.70</option></select>
            </label>
          </div>
        </details>
      </section>
      <section class="cc-step" data-cc-step-title="Generar">
        <h3>4. Generar</h3>
        <p class="cc-step-help">La web compone los documentos de esta clase. Empieza por la guía de impresión y reparto: dice qué imprimir, cuántas copias y cuándo se entrega cada cosa. La presentación se proyecta desde aquí mismo, y el tráiler oficial se puede descargar ya renderizado, por si en clase falla algo o falta tiempo.</p>
        <div class="cc-actions">
          <button id="sf-generate" type="submit">Generar documentos</button>
          <button id="sf-project" class="cc-secondary" type="button">Proyectar la presentación</button>
          <a id="sf-trailer" class="cc-tab-button cc-complete" href="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/video/zeno-trailer-oficial-es.mp4" download>Tráiler oficial (MP4)</a>
          <button id="sf-clear" class="cc-secondary" type="button">Limpiar descargas</button>
        </div>
        <div id="sf-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="sf-summary-title">
      <h2 id="sf-summary-title">Resumen del expediente</h2>
      <ul id="sf-summary" class="cc-summary"></ul>
      <div id="sf-checks" aria-live="polite"></div>
      <div id="sf-preview" class="cc-preview" aria-live="polite">Cargando la vista previa…</div>
    </aside>
  </section>

  <section id="sf-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="sf-documents-title">
    <h2 id="sf-documents-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Empieza por la <strong>guía de impresión y reparto</strong>: dice qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento. El paquete docente contiene la solución y no debe circular. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="sf-panel-bundles" data-cc-tab-target="sf-panel-bundles">Paquetes por rol</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="sf-panel-separate" data-cc-tab-target="sf-panel-separate">Documentos separados</button>
      <a id="sf-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Guía de impresión y reparto</a>
      <a id="sf-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="sf-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="sf-bundles" class="cc-file-list"></div></div>
    <div id="sf-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="sf-doclist" class="cc-file-list"></div></div>
  </section>

  <section class="cc-panel sf-packages" aria-labelledby="sf-packages-title">
    <h2 id="sf-packages-title">Paquetes de actividad</h2>
    <p>La configuración viaja en un archivo JSON que se puede guardar e importar más tarde. El <strong>paquete del alumnado</strong> no contiene nada confidencial y abre la sala de montaje con los grupos de esta clase. El <strong>sobre</strong> es el de la clase de cierre. El <strong>paquete docente</strong> contiene la solución y las fichas privadas.</p>
    <div class="cc-actions">
      <button id="sf-export-student" class="cc-secondary" type="button">Paquete del alumnado</button>
      <button id="sf-export-envelope" class="cc-secondary" type="button">Sobre (clase de cierre)</button>
      <button id="sf-export-teacher" class="cc-secondary" type="button">Paquete docente</button>
      <button id="sf-import" class="cc-secondary" type="button">Importar configuración…</button>
      <input id="sf-import-file" type="file" accept=".json,application/json" hidden>
    </div>
    <p id="sf-import-status" class="cc-help" role="status" aria-live="polite"></p>
    <p><a href="{{ site.baseurl }}/MatExp/analisis/calculo/series/final-de-la-serie/sala/">Abrir la sala de montaje (puesta en común) →</a></p>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para componer los fotogramas y crear los PDF.</p></noscript>
</section>

## Qué se estudia en cada episodio

| Episodio | Matemáticas | Prueba forense | Lo que demuestra |
|---|---|---|---|
| 1 · Cuenta atrás | Sucesión con límite; progresión aritmética y su suma | Registro del render: solo se conoce la hora de fin | La hora de inicio, si se suma la progresión de costes (suponer costes iguales señala a un inocente) |
| 2 · Aquiles | Serie geométrica, \(\sum ar^{k-1} = a/(1-r)\) si \(\lvert r\rvert<1\) | Fotograma filtrado con los anillos de eco | La razón identifica la copia y confirma que el vídeo es auténtico |
| 3 · La cuerda | Serie armónica: términos que tienden a 0 y suma no acotada | Declaración de la creadora a la prensa | Que mintió: la sonda sí llega |
| 4 · El registro borrado | Series telescópicas | Diario de sesiones del proyecto | Que falta una sesión, cuánto duró y cuándo empezó |
| 5 · Dosis | Series \(p\): convergencia, cotas sin integrales, convergente no es pequeña | Lecturas del dosímetro en el montaje alternativo | El exponente revela la versión de la biblia que tenía el manipulador |
| 6 · Péndulo | Series alternadas; convergencia absoluta y condicional | Posiciones de la baliza en el montaje alternativo | Que el plano usa el pasillo antiguo, no el construido |

Una tabla de sumas parciales sugiere, pero no demuestra: cien términos de la serie armónica no dicen que diverja, y cien términos de \(\sum 1/n^2\) no dicen que su suma quede por debajo de 2. Por eso cada dosier pide un argumento (comparación, agrupación, telescopía o el criterio de Leibniz) y el laboratorio de la sala de montaje distingue siempre entre valores exactos, cotas demostradas y cálculos numéricos.

<p class="cc-disclaimer">La serie ZENO, su productora, su plataforma, las personas y los registros son ficticios y exclusivamente educativos. Los fotogramas y la cabecera son previsualizaciones generadas por programa, no imágenes de una producción real.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016c"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/fonts/sf-fonts.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/data/sf-public.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/data/sf-episodes.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/data/sf-private.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-math.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-evidence.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-validate.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-tex.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-trailer.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-pdf.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-slides.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-docs-student.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-docs-teacher.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-build.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/series-final-de-la-serie/sf-generator.js?v=20261016b"></script>
