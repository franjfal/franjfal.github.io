---
title: "Calculus Cases: el juicio del profesor"
lang: es
page_id: matexp-ode-professor-trial
date: '2026-07-03 20:30:00 +0200'
categories:
  - experimento
  - análisis
  - modelación
  - ODE
taxonomy: experimento análisis modelación ODE ecuaciones-diferenciales exponenciales logaritmos Calculus-Cases
permalink: "/MatExp/analisis/modelacion/ode/juicio-profesor-falco/"
header:
  image: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/header.jpg"
excerpt: "El profesor aparece muerto en su aula poco después de clase. Dos medidas de temperatura y la ley de enfriamiento de Newton fijan la hora de la muerte; el juicio decide quién estaba allí."
feature: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/feature.svg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016d">

El profesor de la asignatura aparece muerto en su aula poco después de terminar la clase, y el caso se resuelve en un juicio. El alumnado se reparte los papeles de juez, Fiscalía, médico forense, conserje, tres sospechosos y jurado popular, cada uno con su propio paquete de documentos y sin saber lo que saben los demás. La pieza central es matemática: dos medidas de temperatura y la ley de enfriamiento de Newton permiten estimar la hora de la muerte, y esa hora hay que contrastarla con el plano del aula, los registros del edificio y los testimonios hasta llegar a un veredicto.

El caso sigue el formato de todos los Calculus Cases: se lanza al final de una clase, se prepara en clase y en casa y el juicio se celebra en la clase siguiente.

1. **Lanzamiento, al final de una clase (15–20 min).** Proyectas la presentación: la historia, el hallazgo, la pregunta para el tribunal, los papeles y su reparto en tu clase. Cada estudiante recibe el paquete de su papel; los tres sospechosos, en sobre cerrado.
2. **Preparación, en clase y en casa (30–45 min).** Cada papel prepara su intervención solo con sus documentos: el médico forense y la Fiscalía, el cálculo de la hora de la muerte; la conserje, sus registros; cada sospechoso, su versión. La hora estimada de la muerte solo la conocen el médico forense, la Fiscalía y el juez; el jurado, la conserje y los sospechosos la descubren en el juicio.
3. **El juicio, en la clase siguiente (60 min).** Sin puesta en común previa: apertura, informe forense con una pausa en la que todo el tribunal comprueba el cálculo, declaraciones de la conserje y de los sospechosos, alegato final, veredicto escrito del jurado y cierre.

$$
\frac{dT}{dt}=-k\,\bigl(T-T_a\bigr)\qquad\Longrightarrow\qquad T(t)=T_a+A\,e^{-kt}
$$

<figure class="cc-figure">
  <img src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/assets/cover_scene.png" alt="Aula universitaria preparada como escena del caso">
</figure>

## Generador de materiales

El configurador te guía en cuatro pasos. Lo único imprescindible es el número de estudiantes: con él, la web reparte los papeles, decide si hace falta más de un tribunal y calcula cuántas copias exactas hay que imprimir. Todo lo demás tiene ya un valor recomendado.

<section class="cc-case trial-generator" data-lang="es" aria-label="Generador del juicio del profesor">
  <section class="cc-workspace">
    <form id="case-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <section class="cc-step" data-cc-step-title="Tu clase">
        <h3>1. Tu clase</h3>
        <p class="cc-step-help">¿Cuántos estudiantes tienes? Cada estudiante tiene un papel: juez, Fiscalía, médico forense, conserje, uno de los tres sospechosos o miembro del jurado popular. Hasta 20 estudiantes se celebra un solo juicio; con más, la web forma varios tribunales de 10 a 16 que juzgan el mismo caso a la vez.</p>
        <label>Número de estudiantes
          <input id="trial-students" name="students" type="number" min="9" max="72" step="1" value="24">
        </label>
        <div id="trial-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Datos del caso">
        <h3>2. Datos del caso</h3>
        <p class="cc-step-help">Los nombres, la fecha y el horario aparecen en todos los documentos. Todas las horas del caso se calculan a partir del final de la clase; las temperaturas medidas son siempre las mismas. Puedes dejarlo todo como está.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Nombre del profesor
            <input id="teacher-name" name="teacherName" type="text" value="Javier Falcó" required>
          </label>
          <label class="cc-full">Asignatura
            <input id="class-name" name="className" type="text" value="ecuaciones diferenciales y transformadas de Laplace" required>
          </label>
          <label class="cc-full">Fecha del caso
            <input id="case-date" name="caseDate" type="date" value="2026-07-02">
          </label>
          <label>Inicio de la clase
            <input id="class-start-time" name="classStartTime" type="time" value="10:30" required>
          </label>
          <label>Fin de la clase
            <input id="class-end-time" name="classEndTime" type="time" value="12:30" required>
          </label>
          <label>Nombre del sospechoso 1
            <input id="suspect-1-name" name="suspect1Name" type="text" placeholder="Sospechosa 1">
          </label>
          <label>Género del sospechoso 1
            <select id="suspect-1-gender" name="suspect1Gender">
              <option value="f" selected>Mujer</option>
              <option value="m">Hombre</option>
            </select>
          </label>
          <label>Nombre del sospechoso 2
            <input id="suspect-2-name" name="suspect2Name" type="text" placeholder="Sospechoso 2">
          </label>
          <label>Género del sospechoso 2
            <select id="suspect-2-gender" name="suspect2Gender">
              <option value="m" selected>Hombre</option>
              <option value="f">Mujer</option>
            </select>
          </label>
          <label>Nombre del sospechoso 3
            <input id="suspect-3-name" name="suspect3Name" type="text" placeholder="Sospechoso 3">
          </label>
          <label>Género del sospechoso 3
            <select id="suspect-3-gender" name="suspect3Gender">
              <option value="m" selected>Hombre</option>
              <option value="f">Mujer</option>
            </select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Informe y papel">
        <h3>3. Informe y papel</h3>
        <p class="cc-step-help">El informe matemático del caso (documento 09), que reciben el médico forense y la Fiscalía, tiene dos versiones con los mismos datos. La de cálculo construye el modelo con una función exponencial, lo comprueba con derivadas y despeja la hora con logaritmos; la de ecuaciones diferenciales lo deduce resolviendo la ecuación de Newton por separación de variables. El resto del material es el mismo.</p>
        <div class="cc-form-grid">
          <label>Informe matemático
            <select id="math-mode" name="mathMode">
              <option value="calculus" selected>Cálculo (recomendado)</option>
              <option value="ode">Ecuaciones diferenciales</option>
            </select>
          </label>
          <label>Papel
            <select id="page-format" name="pageFormat">
              <option value="a4" selected>A4</option>
              <option value="letter">Carta / Letter</option>
            </select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generar">
        <h3>4. Generar</h3>
        <p class="cc-step-help">La web compone los documentos de esta clase. Empieza por la guía de impresión y reparto: dice qué imprimir, cuántas copias exactas y cuándo se entrega cada cosa. La presentación del lanzamiento se proyecta desde aquí mismo y está también en PDF (documento 00).</p>
        <div class="cc-actions">
          <button id="generate-button" type="submit">Generar documentos</button>
          <button id="project-button" class="cc-secondary" type="button">Proyectar la presentación</button>
          <button id="clear-button" class="cc-secondary" type="button">Limpiar descargas</button>
        </div>
        <div id="status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="case-summary-title">
      <h2 id="case-summary-title">Resumen del caso</h2>
      <ul id="case-summary" class="cc-summary"></ul>
    </aside>
  </section>

  <section id="downloads-panel" class="cc-panel cc-documents cc-hidden" aria-labelledby="downloads-title">
    <h2 id="downloads-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Empieza por la <strong>guía de impresión y reparto</strong>: dice qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento. La pestaña de paquetes tiene un PDF por papel; la de documentos separados, cada pieza por separado, empezando por la presentación (00). La solución docente, el paquete docente y el PDF completo no deben circular. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button id="tab-bundles" class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="panel-bundles" data-cc-tab-target="panel-bundles">Paquetes por rol</button>
      <button id="tab-separate" class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="panel-separate" data-cc-tab-target="panel-separate">Documentos separados</button>
      <a id="print-guide-link" class="cc-tab-button cc-complete cc-hidden" href="#" download>Guía de impresión y reparto</a>
      <a id="complete-pdf-link" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="panel-bundles" class="cc-tab-panel" role="tabpanel" aria-labelledby="tab-bundles"><div id="bundle-downloads" class="cc-file-list"></div></div>
    <div id="panel-separate" class="cc-tab-panel" role="tabpanel" aria-labelledby="tab-separate" hidden><div id="separate-downloads" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para crear los PDF.</p></noscript>
</section>

## Qué se estudia

El médico forense midió la temperatura del cuerpo dos veces, con una hora de diferencia, en un aula que el sistema de climatización mantenía a temperatura constante. Lo que decae de forma exponencial no es la temperatura, sino su exceso sobre la del aula, \(T-T_a\): en cada hora se multiplica por el mismo factor. Ese factor se obtiene del cociente de los dos excesos medidos, y la hora de la muerte resulta de seguir el modelo hacia atrás hasta la temperatura corporal normal, con un logaritmo.

| Informe | Herramientas | Cómo llega al modelo |
|---|---|---|
| Cálculo | Exponenciales, logaritmos y la derivada de \(b^t\) | Propone \(T(t)=T_a+A\,b^t\), calcula \(A\) y \(b\) con las dos medidas y comprueba con la derivada que el modelo cumple la ley de Newton |
| Ecuaciones diferenciales | Separación de variables e integración | Resuelve \(T'=-k(T-T_a)\) y calcula \(A\) y \(k\) con las dos medidas |

La estimación depende de supuestos que conviene decir en voz alta: la temperatura del aula fue constante, el coeficiente de enfriamiento no cambió y la temperatura en el momento de la muerte era la normal. Y lo que aporta es una ventana de tiempo, no un nombre: la hora solo señala a alguien cuando se cruza con los movimientos y los testimonios que se oyen en la sala.

<p class="cc-disclaimer">El caso, sus personas, sus documentos y sus datos son ficticios y exclusivamente educativos.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016c"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016b"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/murder-generator.js?v=20261017a"></script>
