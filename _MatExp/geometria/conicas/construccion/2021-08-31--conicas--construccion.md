---
title: Secciones cónicas
date: '2021-10-30 14:54:31 +0200'
categories:
- experimento
- Geometría
taxonomy: experimento geometría cónicas
permalink: "/MatExp/geometria/conicas/construccion/"
header:
  image: "/assets/MatExp/geometria/poliedros/solidos-arquimedianos/header.jpg"
excerpt: Construcción de las secciones cónicas por diferentes métodos.
feature: "/assets/MatExp/geometria/conicas/construccion/feature.jpg"
---

Las secciones cónicas son las figuras geométricas que se obtienen al realizar un corte recto a un cono. Estas figuras se caracterizan por sus propiedades de simetría, además de poderse definir de un modo sencillo en términos de distancias entre puntos del plano. Aunque las cónicas han sido estudiadas durante más de dos milenios, el interés por estas figuras ha aumentado en los últimos siglos al descubrirse que las órbitas que describen el movimiento de los astros son, aproximadamente, curvas de este tipo.

Si tenemos un cono vertical de revolución, la *circunferencia* es la sección que se obtiene al realizar un corte con un plano horizontal. Si la inclinación del plano es menor que la de la recta generatriz obtenemos una *elipse*. Cuando la inclinación del plano coincide con la inclinación de la recta generatriz, aparece la *parábola*. Por último, si la inclinación es mayor que la de la recta generatriz obtenemos una *hipérbola*.

<center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/conicas.png" alt="Secciones cónicas" width="90%"/></center>


A continuación mostramos diferentes procesos para construir las cónicas. 

# Dibujando secciones cónicas con una cuerda

<style>
.conic-interactive {
  max-width: 860px;
  margin: 0 auto;
  padding: 1rem;
  border: 1px solid #e3e3e3;
  border-radius: 10px;
  background: #fafafa;
}
.conic-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: .6rem 1rem;
  margin-bottom: .8rem;
}
.conic-controls label {
  display: flex;
  flex-direction: column;
  font-size: .95rem;
}
.conic-controls input[type="range"] {
  width: 100%;
}
.conic-canvas {
  width: 100%;
  max-width: 820px;
  height: auto;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #ffffff;
  touch-action: none;
}
.conic-help {
  margin: .6rem 0 0 0;
  font-size: .95rem;
  color: #444;
}
.tab .tablinks {
   border: 1px solid #cfd8dc;
   background: #f6f8fa;
   border-radius: 6px;
   padding: .35rem .7rem;
   margin: .2rem;
   cursor: pointer;
}
.tab .tablinks.active {
   background: #e8f2ff;
   border-color: #7fb3ff;
}
.tab-hint {
   text-align: center;
   margin-top: .2rem;
   color: #555;
   font-size: .92rem;
}
</style>

<!-- Tab links -->
<div class="tab" style="margin: auto;  text-align:center;">
<button class="tablinks active" onclick="openConicTab(event, 'Circulo-cuerda', 'conic-tab-cuerda')">Círculo</button>
   <button class="tablinks" onclick="openConicTab(event, 'Elipse-cuerda', 'conic-tab-cuerda')">Elipse</button>
   <button class="tablinks" onclick="openConicTab(event, 'Parabola-cuerda', 'conic-tab-cuerda')">Parábola</button>
   <button class="tablinks" onclick="openConicTab(event, 'Hiperbola-cuerda', 'conic-tab-cuerda')">Hipérbola</button>
</div>
<p class="tab-hint">Estas pestañas son desplegables: pulsa cada una para ver su contenido.</p>

<!-- Tab content -->
<div id="Circulo-cuerda" class="tabcontent conic-tab-cuerda" >
   <div class="experiment">
      <h1> Instrucciones:</h1>
      <ul>
         <li> Fija el bolígrafo, lápiz o tiza a uno de los extremos de la cuerda. Fija el otro extremo en el punto que será el centro de la circunferencia y, manteniendo la cuerda tensa en todo momento, dibuja la figura utilizándola como si fuera un compás.</li>
      </ul>
      <div class="conic-interactive" data-conic="circle">
         <div class="conic-controls">
            <label>Progreso del trazado
               <input type="range" data-role="progress" min="0" max="100" value="35" step="0.1">
            </label>
            <label>Longitud de la cuerda (radio)
               <input type="range" data-role="radius" min="40" max="180" value="110">
            </label>
         </div>
         <canvas class="conic-canvas" width="820" height="430"></canvas>
         <p class="conic-help">Arrastra el centro <strong>C</strong> para mover la circunferencia. El lápiz recorre la curva al mover el deslizador.</p>
      </div>

   </div>
</div>

<div id="Elipse-cuerda" class="tabcontent conic-tab-cuerda" style="display:none;">
   <div class="experiment">
      <h1> Instrucciones:</h1>
      <ul>
         <li> Fija los dos extremos de la cuerda en los puntos donde estarán los focos de la elipse.</li>
         <li> Sujeta el bolígrafo, el lápiz o la tiza de modo que la cuerda quede tensa y marca el primer punto de la elipse.</li>
         <li> Para dibujar la figura desplaza el bolígrafo, el lápiz o la tiza de modo que la cuerda quede tensa.</li>
      </ul>
      <div class="conic-interactive" data-conic="ellipse">
         <div class="conic-controls">
            <label>Progreso del trazado
               <input type="range" data-role="progress" min="0" max="100" value="30" step="0.1">
            </label>
            <label>Longitud de la cuerda (|PF1| + |PF2|)
               <input type="range" data-role="rope" min="180" max="620" value="360">
            </label>
         </div>
         <canvas class="conic-canvas" width="820" height="430"></canvas>
         <p class="conic-help">Arrastra los focos <strong>F1</strong> y <strong>F2</strong>. La suma de distancias al lápiz permanece constante.</p>
      </div>

   </div>
</div>

<div id="Parabola-cuerda" class="tabcontent conic-tab-cuerda" style="display:none;">
   <div class="experiment">
      <h1> Instrucciones:</h1>
      <ul>
         <li> Dibuja sobre un cartón dos segmentos de la misma longitud que se tocan en uno de los extremos.</li>
         <li> Divide los dos segmentos en el mismo número de partes y enumera estas partes en sentido opuesto desde el punto donde se tocan los extremos.</li>
         <li> Coloca una chincheta en cada uno de estos puntos.</li>
         <li> Ata una cuerda que una las chinchetas con el mismo número.</li>
      </ul>
      <div class="conic-interactive" data-conic="parabola">
         <div class="conic-controls">
            <label>Progreso del trazado
               <input type="range" data-role="progress" min="0" max="100" value="42" step="0.1">
            </label>
            <label>Distancia foco-directriz
               <input type="range" data-role="p" min="25" max="120" value="55">
            </label>
         </div>
         <canvas class="conic-canvas" width="820" height="430"></canvas>
         <p class="conic-help">Arrastra el foco <strong>F</strong>. El punto del lápiz mantiene la misma distancia al foco y a la directriz.</p>
      </div>

   </div>
</div>

<div id="Hiperbola-cuerda" class="tabcontent conic-tab-cuerda" style="display:none;">
   <div class="experiment">
      <h1> Instrucciones:</h1>
      <ul>
         <li> Fija los dos extremos de la cuerda en dos puntos que actuarán como focos, dejando una separación amplia entre ellos.</li>
         <li> Ajusta la cuerda para que la diferencia de distancias del lápiz a ambos focos sea constante y desplaza el lápiz manteniendo esa condición.</li>
         <li> Repite el proceso a ambos lados para dibujar las dos ramas de la hipérbola.</li>
      </ul>
      <div class="conic-interactive" data-conic="hyperbola">
         <div class="conic-controls">
            <label>Progreso del trazado
               <input type="range" data-role="progress" min="0" max="100" value="55" step="0.1">
            </label>
            <label>Diferencia fija (||PF2| - |PF1||)
               <input type="range" data-role="delta" min="30" max="300" value="140">
            </label>
         </div>
         <canvas class="conic-canvas" width="820" height="430"></canvas>
         <p class="conic-help">Arrastra los focos <strong>F1</strong> y <strong>F2</strong>. El lápiz dibuja las dos ramas manteniendo una diferencia de distancias constante.</p>
      </div>

   </div>
</div>

<script>
function openConicTab(evt, tabId, groupClass) {
   var i, sections, links;
   sections = document.getElementsByClassName(groupClass);
   for (i = 0; i < sections.length; i++) {
      sections[i].style.display = "none";
   }
   links = evt.currentTarget.parentElement.getElementsByClassName("tablinks");
   for (i = 0; i < links.length; i++) {
      links[i].className = links[i].className.replace(" active", "");
   }
   document.getElementById(tabId).style.display = "block";
   evt.currentTarget.className += " active";
}
</script>
<script src="{{ site.baseurl }}/assets/js/conicas-cuerda.js"></script>
<script src="{{ site.baseurl }}/assets/js/conicas-plegados.js"></script>


# Método del círculo director
<!-- Tab links -->
<div class="tab" style="margin: auto;  text-align:center;">
   <button class="tablinks active" onclick="openConicTab(event, 'Elipse-circulo-director', 'conic-tab-director')">Elipse</button>
   <button class="tablinks" onclick="openConicTab(event, 'Parabola-circulo-director', 'conic-tab-director')">Parábola</button>
   <button class="tablinks" onclick="openConicTab(event, 'Hiperbola-circulo-director', 'conic-tab-director')">Hipérbola</button>
</div>
<p class="tab-hint">Estas pestañas son desplegables: pulsa cada una para ver su contenido.</p>

<!-- Tab content -->
<div id="Elipse-circulo-director" class="tabcontent conic-tab-director" style="display:block;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Dibuja una circunferencia lo más grande posible sobre un papel. El radio de la circunferencia será el semieje mayor de la elipse.</li>
      <li> Marca un segmento que atraviese la circunferencia y pase por el centro.</li>
      <li> Marca dos puntos F1 y F2 del segmento que estén dentro del círculo y a la misma distancia del centro. Estos serán los focos de la elipse.</li>
      <li> Coloca una escuadra dentro del círculo de modo que uno de los lados pase por el punto F1 y el vértice de su ángulo recto se apoye sobre la circunferencia.</li>
      <li> Marca el segmento interior de la circunferencia definido por el lado de la escuadra que no pasa por F1.</li>
      <li> Repite el paso anterior cambiando la posición de la escuadra hasta recorrer toda la circunferencia. Aunque en cada paso se puede utilizar cualquiera de los focos, es más fácil usar el que se encuentra a mayor distancia del punto escogido de la circunferencia.</li>
   </ul>
         <div class="conic-interactive" data-conic="ellipse-director">
            <div class="conic-controls">
               <label>Progreso del trazado
                  <input type="range" data-role="progress" min="0" max="100" value="35" step="0.1">
               </label>
               <label>Radio del círculo director
                  <input type="range" data-role="radius" min="120" max="300" value="230">
               </label>
            </div>
            <canvas class="conic-canvas" width="820" height="430"></canvas>
            <p class="conic-help">Haz clic en <strong>F1</strong> o <strong>F2</strong> (el foco activo tiene un anillo naranja) para elegir con qué foco trabajas. El deslizador recorre el semicírculo de ese foco. Cambia al otro foco para completar la elipse.</p>
         </div>

   </div>
</div>

<div id="Parabola-circulo-director" class="tabcontent conic-tab-director" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Marca un segmento en el papel.</li>
      <li> Dibuja la recta perpendicular al segmento que pasa por el centro y marca sobre ella un punto P, que no sea el punto de intersección de la recta con el segmento.</li>
      <li> Coloca una escuadra sobre el papel de modo que uno de los lados pase por el punto P y el vértice de su ángulo recto se apoye sobre el segmento original.</li>
      <li> Marca la recta definida por el otro lado del ángulo recto.</li>
      <li> Repite el paso anterior escogiendo nuevos puntos sobre el segmento hasta recorrerlo todo.</li>
   </ul>
         <div class="conic-interactive" data-conic="parabola-director">
            <div class="conic-controls">
               <label>Progreso del trazado
                  <input type="range" data-role="progress" min="0" max="100" value="50" step="0.1">
               </label>
               <label>Distancia foco-segmento
                  <input type="range" data-role="p" min="40" max="190" value="95">
               </label>
            </div>
            <canvas class="conic-canvas" width="820" height="430"></canvas>
            <p class="conic-help">Arrastra el punto <strong>P</strong> (foco). La escuadra se apoya en el segmento y su otro lado envuelve la parábola.</p>
         </div>

   </div>
</div>

<div id="Hiperbola-circulo-director" class="tabcontent conic-tab-director" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Dibuja un círculo pequeño en el centro de un papel marcando su centro como O.</li>
      <li> Marca un segmento que atraviese la circunferencia y pase por el centro.</li>
      <li> Marca dos puntos F1 y F2 del segmento que estén fuera del círculo y a la misma distancia del centro. Estos serán los focos de la hipérbola.</li>
      <li> Coloca una escuadra de modo que uno de los lados pase por el punto F1 y el vértice de su ángulo recto se apoye sobre la circunferencia.</li>
      <li> Marca el segmento definido por el lado de la escuadra que no pasa por el punto F1.</li>
      <li> Repite el paso anterior escogiendo nuevos puntos hasta que se aprecie una de la ramas de la hipérbola. Es más fácil trabajar con los puntos de la circunferencia que estén alejados del foco F1.</li>
      <li> Repite los pasos anteriores con el foco F2 para dibujar la segunda parte de la hipérbola.</li>
   </ul>
         <div class="conic-interactive" data-conic="hyperbola-director">
            <div class="conic-controls">
               <label>Progreso del trazado
                  <input type="range" data-role="progress" min="0" max="100" value="48" step="0.1">
               </label>
               <label>Radio del círculo director
                  <input type="range" data-role="radius" min="40" max="150" value="78">
               </label>
               <label>Diferencia fija de distancias
                  <input type="range" data-role="delta" min="40" max="280" value="120">
               </label>
            </div>
            <canvas class="conic-canvas" width="820" height="430"></canvas>
            <p class="conic-help">Haz clic en <strong>F1</strong> o <strong>F2</strong> (el foco activo tiene un anillo naranja) para elegir con qué foco trazas una rama. El deslizador recorre el semicírculo de ese foco. Cambia al otro foco para dibujar la segunda rama.</p>
         </div>

   </div>
</div>
# Creando cónicas con plegados de papel
<!-- Tab links -->
<div class="tab" style="margin: auto;  text-align:center;">
   <button class="tablinks active" onclick="openConicTab(event, 'Elipse-plegados-papel', 'conic-tab-plegados')">Elipse</button>
   <button class="tablinks" onclick="openConicTab(event, 'Parabola-plegados-papel', 'conic-tab-plegados')">Parábola</button>
   <button class="tablinks" onclick="openConicTab(event, 'Hiperbola-plegados-papel', 'conic-tab-plegados')">Hipérbola</button>
</div>
<p class="tab-hint">Estas pestañas son desplegables: pulsa cada una para ver su contenido.</p>

<!-- Tab content -->
<div id="Elipse-plegados-papel" class="tabcontent conic-tab-plegados" style="display:block;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Dibuja un círculo lo más grande posible en un papel y marca su centro F1. Este será el primer foco de la elipse. Aunque puede utilizarse cualquier papel, el de papiroflexia funciona muy bien porque es resistente y los plegados quedan marcados con claridad, lo que facilita su visualización.</li>
      <li> Marca un punto como F2 dentro del círculo que no sea su centro, pero que esté alejado del borde. Este será el segundo foco de la elipse. Es recomendable que los focos estén separados para que la elipse se aprecie mejor.</li>
      <li> Dobla el papel de modo que el punto F2 se coloque encima de cualquier punto de la circunferencia y aprieta el pliegue para marcarlo en el papel.</li>
      <li> Abre el papel y coloca el punto F2 sobre otro punto de la circunferencia cercano al primero. Marca de nuevo el pliegue en el papel.</li>
      <li> Repite el paso anterior escogiendo nuevos puntos hasta recorrer toda la circunferencia completa.</li>
      <li> Al finalizar debería de apreciarse una elipse. Si este no es el caso, continúa realizando más pliegues hasta que se note bien la figura.</li>
   </ul>
         <div class="conic-interactive fold-interactive" data-fold="ellipse-fold">
            <div class="conic-controls">
               <label>Progreso del plegado
                  <input type="range" data-role="progress" min="0" max="100" value="35" step="0.1">
               </label>
               <label>Número de puntos equidistantes
                  <input type="range" data-role="steps" min="8" max="60" value="36">
               </label>
            </div>
            <canvas class="conic-canvas fold-canvas" width="820" height="430"></canvas>
            <p class="conic-help">Se eligen puntos equiespaciados sobre la circunferencia y, en cada paso, el papel se pliega para hacer coincidir <strong>F2</strong> con el punto seleccionado.</p>
         </div>

   </div>
</div>

<div id="Parabola-plegados-papel" class="tabcontent conic-tab-plegados" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Escoge uno de los lados del papel y marca un punto F cercano a ese lado. Este punto será el foco y el lado escogido será la directriz de la parábola.</li>
      <li> Marca diferentes puntos en el lado escogido.</li>
      <li> Dobla el papel de modo que el primero de los puntos marcados esté encima del punto F y marca este pliegue.</li>
      <li> Abre el papel y repite el proceso con los otros puntos marcados.</li>
      <li> Al finalizar debería de apreciarse una parábola. Si este no es el caso, continúa haciendo más pliegues hasta que se note bienla figura</li>
   </ul>
         <div class="conic-interactive fold-interactive" data-fold="parabola-fold">
            <div class="conic-controls">
               <label>Progreso del plegado
                  <input type="range" data-role="progress" min="0" max="100" value="40" step="0.1">
               </label>
               <label>Número de puntos sobre la directriz
                  <input type="range" data-role="steps" min="8" max="60" value="32">
               </label>
            </div>
            <canvas class="conic-canvas fold-canvas" width="820" height="430"></canvas>
            <p class="conic-help">Se toman puntos equidistantes de la directriz y cada pliegue hace coincidir el foco <strong>F</strong> con uno de esos puntos.</p>
         </div>

   </div>
</div>

<div id="Hiperbola-plegados-papel" class="tabcontent conic-tab-plegados" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Dibuja un círculo pequeño sobre un papel marcando su centro como F1. Este será el primer foco de la hipérbola. Aunque puede utilizarse cualquier papel, al igual que en los casos anteriores es recomendable utilizar papel de papiroflexia.</li>
      <li> Marca un punto F2 fuera del círculo. Este será el segundo de los focos de la hipérbola.</li>
      <li> Dobla el papel de modo que el punto F2 caiga encima de cualquier punto de la circunferencia. Marca el pliegue en el papel.</li>
      <li> Abre el papel y coloca el punto F2 sobre otro punto de la circunferencia cercano al primero. Marca el nuevo pliegue en el papel.</li>
      <li> Repite el paso anterior escogiendo nuevos puntos. Hay que tomar puntos en los dos lados de la circunferencia para obtener las dos partes de la hipérbola.</li>
      <li> Al finalizar se apreciará una hipérbola. Si no, continúa haciendo más pliegues hasta poder apreciar la figura.</li>
   </ul>
         <div class="conic-interactive fold-interactive" data-fold="hyperbola-fold">
            <div class="conic-controls">
               <label>Progreso del plegado
                  <input type="range" data-role="progress" min="0" max="100" value="45" step="0.1">
               </label>
               <label>Número de puntos equidistantes
                  <input type="range" data-role="steps" min="8" max="60" value="36">
               </label>
            </div>
            <canvas class="conic-canvas fold-canvas" width="820" height="430"></canvas>
            <p class="conic-help">Se recorre homogéneamente la circunferencia pequeña y cada pliegue superpone <strong>F2</strong> con un punto de esa circunferencia.</p>
         </div>

   </div>
</div>
