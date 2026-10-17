---
title: "Calculus Cases: el túnel"
lang: es
page_id: matexp-tunnel-case
date: '2026-10-16 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - derivadas
  - tasas de cambio
taxonomy: experimento derivadas tasas velocidad análisis cálculo Calculus-Cases
permalink: "/MatExp/analisis/derivadas/tunel/"
header:
  image: "/assets/MatExp/analisis/derivadas/tunel/header-brand.jpg"
excerpt: "Un coche sale de un túnel y acaba contra la barrera. La aseguradora dice velocidad; la familia, avería. Solo la derivada, y sus supuestos, permiten decir a qué velocidad salió."
feature: "/assets/MatExp/analisis/derivadas/tunel/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css?v=20261016a">

Un coche sale de un túnel de montaña y, unos metros después, queda detenido contra la barrera. La aseguradora ha escrito una palabra en su informe: *velocidad*. La familia del conductor ha escrito otra: *avería*. El consultor de la unidad no escribió ninguna; junto a una tabla breve de tiempos y posiciones dejó solo una pregunta: ¿qué podemos afirmar sobre el coche en el instante preciso en que salió? El inspector jefe, papel que asume el docente, reparte el expediente entre los miembros de cada equipo: el registro del movimiento (hoja A), la escena (hoja B), las declaraciones (hoja C) y el informe pericial que hay que firmar (hoja D).

El caso está construido alrededor de una trampa deliberada. La medida más cercana a la salida da 22.5 m/s, pero es una media a lo largo de un segundo entero, y el segundo posterior da 20.5. El giro llega cuando la clase ajusta una parábola a cada lado de la salida: las dos curvas pierden velocidad a ritmos distintos y, sin embargo, sus tangentes en $$t=0$$ coinciden. Como esa velocidad solo existe dentro de un modelo, la segunda lección del caso es que una estimación viaja siempre con sus supuestos.

El caso sigue el formato de todos los Calculus Cases:

1. **Lanzamiento, al final de una clase (15–20 min).** Proyectas la presentación: las dos fotografías, la pregunta del consultor, dos preguntas de diagnóstico, los roles y los equipos de tu clase. Cada equipo recibe sus hojas A, B, C y D, y cada estudiante lee la suya sin enseñarla.
2. **En casa (45–60 min por equipo).** Cada estudiante completa su hoja y el equipo intercambia lo que necesita: las medias, el límite en m/s y qué afirmaciones se pueden contrastar. Quien coordina empieza el informe.
3. **Clase de cierre (55 min).** Puesta en común de las estimaciones, el modelo local a cada lado de la salida (la parte decisiva), informe y revisión cruzada entre equipos, cierre y una comprobación individual.

$$
v_{\text{media}}=\frac{s(b)-s(a)}{b-a}
\qquad\Big|\qquad
s'(0)=\lim_{h\to0}\frac{s(h)-s(0)}{h}
\qquad\Big|\qquad
s(t)=at^2+bt+c \ \text{ a cada lado de } t=0
$$

## Generador de materiales

El configurador te guía en cuatro pasos. Lo único imprescindible es el número de estudiantes: con él, la web forma los equipos de tres o cuatro y calcula cuántas copias hay que imprimir. Todo lo demás tiene ya un valor recomendado, que coincide con el libro.

<section class="cc-case tunnel-case" data-case="tunnel" data-lang="es" aria-label="Generador del caso El túnel">
  <section class="cc-workspace">
    <form id="tunnel-form" class="cc-panel" novalidate>
      <h2>Configura el caso</h2>
      <section class="cc-step" data-cc-step-title="Tu clase">
        <h3>1. Tu clase</h3>
        <p class="cc-step-help">¿Cuántos estudiantes tienes? La web forma equipos de tres o cuatro. En cada equipo, tres estudiantes reciben las hojas A, B y C; el cuarto coordina el informe con la hoja D. En los equipos de tres, quien tiene la hoja C coordina también.</p>
        <label>Número de estudiantes
          <input id="tunnel-students" type="number" min="6" max="40" step="1" value="24">
        </label>
        <div id="tunnel-groups" aria-live="polite"></div>
      </section>
      <section class="cc-step" data-cc-step-title="Papel">
        <h3>2. Papel</h3>
        <p class="cc-step-help">El tamaño del papel de las hojas. La presentación es apaisada y se proyecta; no hace falta imprimirla.</p>
        <div class="cc-form-grid">
          <label>Papel
            <select id="tunnel-format"><option value="a4" selected>A4</option><option value="letter">Carta / Letter</option></select>
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Personalizar (opcional)">
        <h3>3. Personalizar (opcional)</h3>
        <p class="cc-step-help">Puedes dejarlo todo como está. Los nombres cambian las declaraciones de la hoja C; el lugar, el nombre del túnel en todos los documentos. Las variantes de los datos cambian las cinco posiciones y todas las cifras que dependen de ellas, incluida la solución; están elegidas para que el caso funcione igual: los dos modelos laterales comparten tangente, el coche pierde velocidad a ambos lados y sale por encima del límite.</p>
        <div class="cc-form-grid">
          <label class="cc-full">Datos del registro
            <select data-cc-field="variant"><option value="book" selected>Los del libro (recomendado)</option><option value="b">Variante 2</option><option value="c">Variante 3</option></select>
          </label>
          <label>Perito de la aseguradora
            <input data-cc-field="insurer" type="text" placeholder="Marta Ibáñez" maxlength="40">
          </label>
          <label>Hermano del conductor
            <input data-cc-field="brother" type="text" placeholder="Luis Cano" maxlength="40">
          </label>
          <label class="cc-full">Nombre del túnel (opcional)
            <input data-cc-field="place" type="text" placeholder="sin nombre: «el túnel de montaña»" maxlength="40">
          </label>
        </div>
      </section>
      <section class="cc-step" data-cc-step-title="Generar">
        <h3>4. Generar</h3>
        <p class="cc-step-help">La web compone los documentos de esta clase. Empieza por la guía de impresión y reparto: dice qué imprimir, cuántas copias y cuándo se entrega cada cosa. La presentación se proyecta desde aquí mismo.</p>
        <div class="cc-actions">
          <button id="tunnel-generate" type="submit">Generar documentos</button>
          <button id="tunnel-project" class="cc-secondary" type="button">Proyectar la presentación</button>
          <button id="tunnel-clear" class="cc-secondary" type="button">Limpiar descargas</button>
        </div>
        <div id="tunnel-status" class="cc-status" role="status" aria-live="polite"></div>
      </section>
    </form>

    <aside class="cc-panel" aria-labelledby="tunnel-summary-title">
      <h2 id="tunnel-summary-title">Resumen del expediente</h2>
      <ul id="tunnel-summary" class="cc-summary"></ul>
      <div id="tunnel-checks" aria-live="polite"></div>
      <div id="tunnel-preview" class="cc-preview" aria-live="polite">Cargando la vista previa…</div>
    </aside>
  </section>

  <section id="tunnel-documents" class="cc-panel cc-documents cc-hidden" aria-labelledby="tunnel-documents-title">
    <h2 id="tunnel-documents-title">Documentos de la actividad</h2>
    <p class="cc-download-note">Empieza por la <strong>guía de impresión y reparto</strong>: dice qué imprimir, cómo, cuántas copias y cuándo se entrega cada documento. El paquete docente contiene la solución y no debe circular. En cada pestaña, la fila roja descarga un ZIP con todo su contenido; los iconos permiten ver o descargar cada archivo.</p>
    <div class="cc-tabs" role="tablist" aria-label="Tipos de documentos">
      <button class="cc-tab-button" type="button" role="tab" aria-selected="true" aria-controls="tunnel-panel-bundles" data-cc-tab-target="tunnel-panel-bundles">Paquetes por rol</button>
      <button class="cc-tab-button" type="button" role="tab" aria-selected="false" aria-controls="tunnel-panel-separate" data-cc-tab-target="tunnel-panel-separate">Documentos separados</button>
      <a id="tunnel-printguide" class="cc-tab-button cc-complete cc-hidden" href="#" download>Guía de impresión y reparto</a>
      <a id="tunnel-complete" class="cc-tab-button cc-complete cc-hidden" href="#" download>PDF completo</a>
    </div>
    <div id="tunnel-panel-bundles" class="cc-tab-panel" role="tabpanel"><div id="tunnel-bundles" class="cc-file-list"></div></div>
    <div id="tunnel-panel-separate" class="cc-tab-panel" role="tabpanel" hidden><div id="tunnel-doclist" class="cc-file-list"></div></div>
  </section>
  <noscript><p class="cc-noscript">Este generador necesita JavaScript para componer los documentos y crear los PDF.</p></noscript>
</section>

## Qué se estudia y por qué funciona

| Documento | Matemáticas | Lo que aporta |
|---|---|---|
| Hoja A · Registro del movimiento | Velocidades medias en cinco intervalos; secantes | Que cada cifra es una media y depende de su intervalo |
| Hoja B · Registro de la escena | Conversión de unidades, $$1\ \text{m/s} = 3.6\ \text{km/h}$$ | Que la comparación con el límite se haga en las mismas unidades |
| Hoja C · Declaraciones recogidas | Separar afirmaciones contrastables | Qué puede decir el expediente sobre la velocidad y qué no puede decir sobre la causa |
| El modelo local (clase de cierre) | Una parábola a cada lado de $$t=0$$; derivadas laterales | Que dos modelos con puntos distintos dan la misma velocidad de salida |
| Hoja D · Informe pericial | Estimación con sus unidades y sus supuestos | Una conclusión que sigue alguien que no ha estudiado cálculo |

Las cinco medias del registro del libro son 23, 22.5, 20.5, 19 y 21.5 m/s, y ninguna es la velocidad en el instante de salida: cada intervalo tiene una anchura positiva. Para hablar de un instante hace falta un modelo del movimiento entre los puntos registrados. Con $$s(t)=at^2+bt+c$$ a cada lado y $$s(0)=0$$, los tres puntos de cada lado fijan una parábola distinta, pero las dos tienen la misma pendiente en la salida, la de su coeficiente $$b$$. Esa coincidencia no la impone nadie, y por eso convence. Aun así, otra curva regular podría pasar por los cinco puntos con otra tangente: la cifra que firma el informe es una estimación condicionada al modelo y a la precisión del registro, y el expediente sigue sin decir por qué el coche se salió de la carretera.

<p class="cc-disclaimer">El accidente, las personas, la aseguradora y los registros son ficticios y exclusivamente educativos. Las ilustraciones y el croquis se generan por programa.</p>

<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-wizard.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/cc-projector.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-fonts.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-tex.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-pdf.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-slides.js?v=20261016a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/calculus-cases/kit/cc-generator.js?v=20261017a"></script>
<script src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/tunel/tunnel.js?v=20261017a"></script>
