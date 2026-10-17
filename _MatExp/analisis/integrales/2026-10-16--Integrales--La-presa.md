---
title: "Calculus Cases: la presa"
lang: es
page_id: matexp-dam-case
date: '2026-10-16 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - integrales
taxonomy: experimento integrales acumulación volumen análisis cálculo Calculus-Cases
permalink: "/MatExp/analisis/integrales/presa/"
header:
  image: "/assets/MatExp/analisis/integrales/presa/header-brand.jpg"
excerpt: "Una tormenta avanza hacia un embalse casi lleno. Un comité de tres especialistas tiene que elegir cuánta agua soltar sin inundar el pueblo de aguas abajo: dos integrales, una en el espacio y otra en el tiempo, deciden."
feature: "/assets/MatExp/analisis/integrales/presa/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016a">

El embalse de **Valdemora** está casi en su límite de operación y una tormenta avanza hacia el valle. Durante tres horas, el río traerá mucha más agua de la habitual, y seis kilómetros aguas abajo está el pueblo de Sotobarca, cuyas calles bajas se inundan si la presa suelta demasiada. El inspector jefe, papel que asume el docente, reúne un comité por cada tres estudiantes: tiene que elegir un desembalse constante que mantenga el embalse por debajo de su límite **durante toda la tormenta** sin dañar al pueblo.

Nadie del comité tiene toda la información. Quien hace de **topografía** tiene el levantamiento de las secciones sumergidas del embalse y calcula el agua que ya hay; quien hace de **hidrología** tiene la previsión del caudal y calcula la que va a llegar, y quien **representa al municipio** conoce el límite del pueblo y el informe de una tormenta anterior en la que el embalse superó su límite aunque el valor final dijera lo contrario. La decisión necesita dos integrales sucesivas, la primera en el espacio y la segunda en el tiempo, y saber qué mide cada una.

El caso sigue el formato de todos los Calculus Cases:

1. **Lanzamiento, al final de una clase (18 min).** Proyectas la presentación: la tormenta, lo que pide la unidad, las unidades de las tres cantidades del caso y los comités de la clase. Cada estudiante recibe la hoja A, común, y la hoja de su especialidad.
2. **En casa (45–60 min).** Cada especialista resuelve su hoja: el volumen inicial, la entrada de agua y la fórmula del volumen, o el límite del pueblo y el precedente.
3. **Clase de cierre (55 min).** Reunión de cada comité, decisión y recomendación firmada, audiencia pública con un aviso de última hora, formalización y comprobación individual.

$$
V_0=\int_0^{2000} A(x)\,dx \qquad\Big|\qquad V(t)=V_0+\int_0^{t}\bigl(q(u)-r\bigr)\,du \qquad\Big|\qquad V(t)\le 48 \ \text{ para todo } t\in[0,3]
$$

## Generador de materiales

El configurador te guía en cuatro pasos. Lo único imprescindible es el número de estudiantes: con él, la web forma los comités de tres especialistas y calcula cuántas copias de cada hoja hay que imprimir. Todo lo demás tiene ya un valor recomendado, que coincide con el del libro.

<section class="cc-case dam-case" data-case="dam" data-lang="es" aria-label="Generador del caso La presa">
  <section class="cc-workspace">
    <form id="dam-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <section class="cc-step" data-cc-step-title="Tu clase">
        <h3>1. Tu clase</h3>
        <p class="cc-step-help">¿Cuántos estudiantes tienes? Cada comité tiene tres especialistas: topografía, hidrología y municipio. Si sobran uno o dos estudiantes, se suman a los últimos comités como segundo especialista de topografía o de hidrología, que resuelven la misma hoja por separado y comparan.</p>
        <label>Número de estudiantes
          <input id="dam-students" type="number" min="3" max="45" step="1" value="24">
        </label>
        <div id="dam-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Papel">
        <h3>2. Papel</h3>
        <p class="cc-step-help">El tamaño del papel de las hojas. La presentación se proyecta y es siempre apaisada (16:9).</p>
        <div class="cc-form-grid">
          <label>Papel
            <select id="dam-format"><option value="a4" selected>A4</option><option value="letter">Carta / Letter</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Personalizar (opcional)">
        <h3>3. Personalizar (opcional)</h3>
        <p class="cc-step-help">Puedes dejarlo todo como está. Los nombres cambian el embalse y el pueblo en todos los documentos. Los datos de la segunda tormenta sirven para repetir el caso con otro grupo: cambian las secciones, la previsión y los límites, pero las integrales siguen siendo exactas y la decisión sigue teniendo una sola opción admisible.</p>
        <div class="cc-form-grid">
          <label>Nombre del embalse <input id="dam-reservoir" type="text" maxlength="40" value="Valdemora" data-cc-field="reservoir"></label>
          <label>Nombre del pueblo <input id="dam-town" type="text" maxlength="40" value="Sotobarca" data-cc-field="town"></label>
          <label class="cc-full">Datos del caso
            <select id="dam-scenario" data-cc-field="scenario"><option value="book" selected>Los del libro (recomendado)</option><option value="second">Segunda tormenta (otros datos)</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generar">
        <h3>4. Generar</h3>
        <p class="cc-step-help">La web compone los documentos de esta clase. Empieza por la guía de impresión y reparto: dice qué imprimir, cuántas copias y cuándo se entrega cada cosa. La presentación se proyecta desde aquí mismo.</p>
        <div class="cc-actions">
          <button id="dam-generate" type="submit">Generar documentos</button>
          <button id="dam-project" class="cc-secondary" type="button">Proyectar la presentación</button>
          <button id="dam-clear" class="cc-secondary" type="button">Limpiar descargas</button>
        </div>
        <div id="dam-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="dam-summary-title">
      <h2 id="dam-summary-title">Resumen del expediente</h2>
      <ul id="dam-summary" class="cc-summary"></ul>
      <div id="dam-preview" class="cc-preview" aria-live="polite">Cargando la vista previa…</div>
    </aside>
  </section>

  <section id="dam-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="dam-documents-title">
    <h2 id="dam-documents-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Empieza por la <strong>guía de impresión y reparto</strong>: dice qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento. El paquete docente contiene la solución y no debe circular. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="dam-panel-bundles" data-cc-tab-target="dam-panel-bundles">Paquetes por rol</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="dam-panel-separate" data-cc-tab-target="dam-panel-separate">Documentos separados</button>
      <a id="dam-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Guía de impresión y reparto</a>
      <a id="dam-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="dam-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="dam-bundles" class="cc-file-list"></div></div>
    <div id="dam-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="dam-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para crear los PDF.</p></noscript>
</section>

## Dos integrales y una idea de acumulación

| Especialista | Matemáticas | Lo que aporta al comité |
|---|---|---|
| Topografía (hoja B) | Volumen por secciones: sumas de láminas \\(A(x_i)\,\Delta x\\) y la integral \\(\int_0^{2000} A(x)\,dx\\) | El agua que ya está en el embalse, \\(V_0\\) |
| Hidrología (hoja C) | Acumulación en el tiempo: \\(\int_0^3 q(t)\,dt\\) y el balance \\(V(t)=V_0+\int_0^t (q-r)\\) | El agua que va a llegar y el volumen en cada instante |
| Municipio (hoja D) | El máximo de una función en un intervalo; el signo de \\(V'\\) | Qué caudales admite el pueblo y por qué un valor final no basta |

Las dos integrales del caso tienen la misma estructura: una densidad o un ritmo multiplicado por el incremento adecuado y sumado. La primera reconstruye en el espacio una cantidad que ya está ahí, el agua almacenada; la segunda acumula en el tiempo una cantidad que todavía no ha llegado. El comité solo puede decidir cuando las junta en el balance \\(V(t)=V_0+\int_0^t (q(u)-r)\,du\\), con el desembalse restando.

La decisión es correcta por dos razones que conviene separar. La primera es una comprobación en todo el intervalo, no solo al final: como \\(V'(t)=q(t)-r\\) es positiva con cualquier caudal de la compuerta, el volumen no deja de crecer y su máximo está en \\(t=3\\). El precedente de la hoja D muestra lo que ocurre cuando eso falla: un volumen final por debajo del límite que esconde un máximo por encima. La segunda razón es que la opción que más baja el embalse es justo la que el pueblo no admite, así que solo queda una. Si el comité pudiera elegir cualquier caudal, habría un intervalo de opciones válidas; la unicidad viene de la lista, no de las matemáticas. La audiencia termina midiendo el margen: cuánto podría equivocarse la previsión antes de que ninguna opción sirviera.

<p class="cc-disclaimer">El embalse, el pueblo, las personas, los informes y los datos son ficticios y exclusivamente educativos. La decisión del caso no dice nada sobre la seguridad de una presa real. Las ilustraciones de la cabecera y de la tarjeta están dibujadas por programa.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-generator.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/integrales/presa/dam.js?v=20261017a"></script>
