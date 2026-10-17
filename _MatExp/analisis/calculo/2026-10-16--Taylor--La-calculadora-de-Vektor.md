---
title: "Calculus Cases: la calculadora de Vektor"
lang: es
page_id: matexp-vektor-case
date: '2026-10-16 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - taylor
taxonomy: experimento polinomios Taylor aproximación error análisis cálculo Calculus-Cases
permalink: "/MatExp/analisis/calculo/taylor/calculadora-vektor/"
header:
  image: "/assets/MatExp/analisis/calculo/calculadora-vektor/header-brand.jpg"
excerpt: "Una calculadora robada aproximaba la exponencial con un polinomio de Taylor; otra, encontrada en un taller rival, da lecturas casi iguales. ¿Es una copia? Las matemáticas dicen hasta dónde se parecen, y también dónde termina lo que pueden demostrar."
feature: "/assets/MatExp/analisis/calculo/calculadora-vektor/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016a">

Hace tres semanas entraron a robar en **Argen Labs** y se llevaron el prototipo de la AE-3, una calculadora experimental que estima $$e^x$$ sumando términos. Ayer apareció en **Vektor Mecánica** un aparato que hace lo mismo, y su director técnico asegura que es diseño propio. El inspector jefe, papel que asume el docente, no quiere oír hablar de robo antes de saber cuánto se parecen los dos métodos y dónde se separan. Cada equipo reúne a tres especialistas: el **archivo** tiene la nota de diseño de Argen y reconstruye su polinomio; la **inspección** tiene las lecturas del aparato incautado, pero ningún plano; la **validación** tiene los valores de referencia y la tolerancia. Ninguna hoja basta sola.

El giro del caso es que la supuesta copia supera las pruebas y el original no: las lecturas de Vektor llevan un término de Taylor más. Y, aun así, tres lecturas no identifican un mecanismo, ni mucho menos dicen quién lo fabricó.

El caso sigue el formato de todos los Calculus Cases:

1. **Lanzamiento, al final de una clase (18 min).** Dos preguntas de diagnóstico y la presentación proyectada: el caso, el encargo del inspector jefe, los tres roles y los equipos de la clase. Cada estudiante recibe la hoja de su rol (A, B o C).
2. **En casa (45–60 min por equipo).** Cada especialista trabaja su hoja a solas y después el equipo se reúne, en persona o en línea, e intercambia los datos de viva voz: el polinomio $$P_3$$ y sus salidas, las diferencias con las lecturas y una corrección compatible, los errores y el veredicto de la tolerancia.
3. **Clase de cierre (55 min).** Puesta en común; las **tiras de términos** (hoja D, una por equipo), que convierten cada término en algo que se coloca sobre la mesa y se suma con su signo; una audiencia en la que cada equipo dice lo que certifica, lo que conjetura y lo que falta; la formalización, el dictamen del equipo y una comprobación individual.

$$
P_3(x)=1+x+\frac{x^2}{2}+\frac{x^3}{6}\qquad\Big|\qquad Q_4(x)=P_3(x)+\frac{x^4}{24}
$$

$$
|e^x-P_n(x)|\le\frac{e\,|x|^{n+1}}{(n+1)!}\quad (|x|\le 1)
$$

## Generador de materiales

El configurador te guía en cuatro pasos. Lo único imprescindible es el número de estudiantes: con él, la web forma los equipos de tres especialistas (con alguno de cuatro si sobran estudiantes) y calcula cuántas copias de cada hoja hay que imprimir. Todo lo demás tiene ya un valor recomendado, que es el del libro.

<section class="cc-case vektor-case" data-case="vektor" data-lang="es" aria-label="Generador del caso La calculadora de Vektor">
  <section class="cc-workspace">
    <form id="vektor-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <section class="cc-step" data-cc-step-title="Tu clase">
        <h3>1. Tu clase</h3>
        <p class="cc-step-help">¿Cuántos estudiantes tienes? La web forma equipos de tres especialistas: archivo (A), inspección (B) y validación (C). Si el número no es múltiplo de tres, uno o dos equipos son de cuatro y en ellos dos estudiantes comparten un rol y una hoja (primero inspección, después archivo).</p>
        <label>Número de estudiantes
          <input id="vektor-students" type="number" min="6" max="45" step="1" value="24">
        </label>
        <div id="vektor-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Papel">
        <h3>2. Papel</h3>
        <p class="cc-step-help">El tamaño del papel de todos los documentos, que se imprimen en vertical. La presentación es apaisada y se proyecta.</p>
        <div class="cc-form-grid">
          <label>Papel
            <select id="vektor-format"><option value="a4" selected>A4</option><option value="letter">Carta / Letter</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Personalizar (opcional)">
        <h3>3. Personalizar (opcional)</h3>
        <p class="cc-step-help">Puedes dejarlo todo como está. Los nombres cambian los dos personajes de las hojas. Las entradas ensayadas cambian todas las cifras del caso; las tres series disponibles están comprobadas: con todas, la AE-3 de Argen falla alguna prueba y el aparato de Vektor las supera todas.</p>
        <div class="cc-form-grid">
          <label>Ingeniera jefa de Argen Labs
            <input data-cc-field="argen" type="text" maxlength="40" value="Marta Ibarra">
          </label>
          <label>Director técnico de Vektor Mecánica
            <input data-cc-field="vektor" type="text" maxlength="40" value="Óscar Valdés">
          </label>
          <label class="cc-full">Entradas ensayadas
            <select data-cc-field="inputs"><option value="A" selected>x = −1, 0.5 y 1 (las del libro)</option><option value="B">x = −0.8, 0.5 y 0.9</option><option value="C">x = −1, 0.25 y 0.75</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generar">
        <h3>4. Generar</h3>
        <p class="cc-step-help">La web compone los documentos de esta clase. Empieza por la guía de impresión y reparto: dice qué imprimir, cuántas copias y cuándo se entrega cada cosa. La presentación se proyecta desde aquí mismo.</p>
        <div class="cc-actions">
          <button id="vektor-generate" type="submit">Generar documentos</button>
          <button id="vektor-project" class="cc-secondary" type="button">Proyectar la presentación</button>
          <button id="vektor-clear" class="cc-secondary" type="button">Limpiar descargas</button>
        </div>
        <div id="vektor-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="vektor-summary-title">
      <h2 id="vektor-summary-title">Resumen del expediente</h2>
      <ul id="vektor-summary" class="cc-summary"></ul>
      <div id="vektor-checks" aria-live="polite"></div>
      <div id="vektor-preview" class="cc-preview" aria-live="polite">Cargando la vista previa…</div>
    </aside>
  </section>

  <section id="vektor-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="vektor-documents-title">
    <h2 id="vektor-documents-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Empieza por la <strong>guía de impresión y reparto</strong>: dice qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento. El paquete docente contiene la solución y no debe circular. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="vektor-panel-bundles" data-cc-tab-target="vektor-panel-bundles">Paquetes por rol</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="vektor-panel-separate" data-cc-tab-target="vektor-panel-separate">Documentos separados</button>
      <a id="vektor-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Guía de impresión y reparto</a>
      <a id="vektor-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="vektor-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="vektor-bundles" class="cc-file-list"></div></div>
    <div id="vektor-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="vektor-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para crear los PDF.</p></noscript>
</section>

## Qué se estudia y por qué el resultado es correcto

| Hoja | Rol | Matemáticas | Lo que aporta al equipo |
|---|---|---|---|
| A · El archivo de Argen | Archivo | Igualar valor y derivadas en 0: $$a_j = f^{(j)}(0)/j!$$ | El polinomio $$P_3$$ y sus salidas en las tres entradas |
| B · El aparato incautado | Inspección | Diferencias $$d(x)$$ y el cociente $$d(x)/x^k$$ | La corrección $$x^4/24$$, compatible con las lecturas |
| C · Validación | Validación | Error absoluto y tolerancia | Qué máquina supera las pruebas, y con qué alcance |
| D · Las tiras y el dictamen | Equipo | Sumas parciales con signo; una regla distinta con las mismas lecturas | El dictamen: lo que se establece, lo que se sugiere y lo que no se puede demostrar |

Como todas las derivadas de $$e^x$$ valen 1 en cero, el polinomio de Argen es $$P_3$$. Con la tolerancia de 0.012, la AE-3 falla en $$x=-1$$ y en $$x=1$$, mientras que las lecturas del aparato incautado, que coinciden con $$Q_4=P_3+x^4/24$$, superan las tres pruebas. Pero tres pruebas superadas son una afirmación sobre tres entradas: la regla $$Q_4(x)+c\,(x+1)(x-0.5)(x-1)$$ da las mismas lecturas para cualquier $$c$$, y solo una cota del resto, como la de Lagrange, dice algo de todo el intervalo. Ningún número, por ajustado que sea, dice quién diseñó la máquina.

<p class="cc-disclaimer">Argen Labs, Vektor Mecánica, la calculadora AE-3, las personas y los registros son ficticios y exclusivamente educativos. Las imágenes de cabecera están dibujadas por programa.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-generator.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/calculadora-vektor/vektor.js?v=20261016a"></script>
