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

<!-- Tab links -->
<div class="tab" style="margin: auto;  text-align:center;">
<button class="tablinks" onclick="openCity(event, 'Circulo-cuerda')">Círculo</button>
  <button class="tablinks" onclick="openCity(event, 'Elipse-cuerda')">Elipse</button>
  <button class="tablinks" onclick="openCity(event, 'Parabola-cuerda')">Parábola</button>
</div>

<!-- Tab content -->
<div id="Circulo-cuerda" class="tabcontent" >
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Fija el bolígrafo, lápiz o tiza a uno de los extremos de la cuerda. Fija el otro extremo en el punto que será el centro de la circunferencia y, manteniendo la cuerda tensa en todo momento, dibuja la figura utilizándola como si fuera un compás.</li>
   </ul>
		 		 		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Circulo-cuerda.png" alt="Dibujando un círculo con una cuerda" width="40%"/></center>

   </div>
</div>

<div id="Elipse-cuerda" class="tabcontent" style="display:none;" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Fija los dos extremos de la cuerda en los puntos donde estarán los focos de la elipse.</li>
      <li> Sujeta el bolígrafo, el lápiz o la tiza de modo que la cuerda quede tensa y marca el primer punto de la elipse.</li>
      <li> Para dibujar la figura desplaza el bolígrafo, el lápiz o la tiza de modo que la cuerda quede tensa.</li>
   </ul>
		 		 		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Elipse-cuerda.png" alt="Dibujando una elipse con una cuerda" width="60%"/></center>

   </div>
</div>

<div id="Parabola-cuerda" class="tabcontent" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Dibuja sobre un cartón dos segmentos de la misma longitud que se tocan en uno de los extremos.</li>
      <li> Divide los dos segmentos en el mismo número de partes y enumera estas partes en sentido opuesto desde el punto donde se tocan los extremos.</li>
      <li> Coloca una chincheta en cada uno de estos puntos.</li>
      <li> Ata una cuerda que una las chinchetas con el mismo número.</li>
   </ul>
		 		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Parabola-cuerda.png" alt="Dibujando una parábola con una cuerda" width="70%"/></center>

   </div>
</div>


# Método del círculo director
<!-- Tab links -->
<div class="tab" style="margin: auto;  text-align:center;">
  <button class="tablinks" onclick="openCity(event, 'Elipse-circulo-director')">Elipse</button>
  <button class="tablinks" onclick="openCity(event, 'Parabola-circulo-director')">Parábola</button>
  <button class="tablinks" onclick="openCity(event, 'Hiperbola-circulo-director')">Hipérbola</button>
</div>

<!-- Tab content -->
<div id="Elipse-circulo-director" class="tabcontent" style="display:none;">
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
		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Elipse-circulo-director.png" alt="Dibujando una elipse con el método del círculo director" width="60%"/></center>

   </div>
</div>

<div id="Parabola-circulo-director" class="tabcontent" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Marca un segmento en el papel.</li>
      <li> Dibuja la recta perpendicular al segmento que pasa por el centro y marca sobre ella un punto P, que no sea el punto de intersección de la recta con el segmento.</li>
      <li> Coloca una escuadra sobre el papel de modo que uno de los lados pase por el punto P y el vértice de su ángulo recto se apoye sobre el segmento original.</li>
      <li> Marca la recta definida por el otro lado del ángulo recto.</li>
      <li> Repite el paso anterior escogiendo nuevos puntos sobre el segmento hasta recorrerlo todo.</li>
   </ul>
		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Parabola-circulo-director.png" alt="Dibujando una parábola con el método del círculo director" width="60%"/></center>

   </div>
</div>

<div id="Hiperbola-circulo-director" class="tabcontent" style="display:none;">
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
		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Hiperbola-circulo-director.png" alt="Dibujando una hipérbola con el método del círculo director" width="70%"/></center>

   </div>
</div>
# Creando cónicas con plegados de papel
<!-- Tab links -->
<div class="tab" style="margin: auto;  text-align:center;">
  <button class="tablinks" onclick="openCity(event, 'Elipse-plegados-papel')">Elipse</button>
  <button class="tablinks" onclick="openCity(event, 'Parabola-plegados-papel')">Parábola</button>
  <button class="tablinks" onclick="openCity(event, 'Hiperbola-plegados-papel')">Hipérbola</button>
</div>

<!-- Tab content -->
<div id="Elipse-plegados-papel" class="tabcontent" style="display:none;">
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
		 		 		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Elipse-plegados-papel.png" alt="Dibujando una elipse con plegamientos sobre un papel" width="55%"/></center>

   </div>
</div>

<div id="Parabola-plegados-papel" class="tabcontent" style="display:none;">
   <div class="experiment">
   <h1> Instrucciones:</h1>
   <ul>
      <li> Escoge uno de los lados del papel y marca un punto F cercano a ese lado. Este punto será el foco y el lado escogido será la directriz de la parábola.</li>
      <li> Marca diferentes puntos en el lado escogido.</li>
      <li> Dobla el papel de modo que el primero de los puntos marcados esté encima del punto F y marca este pliegue.</li>
      <li> Abre el papel y repite el proceso con los otros puntos marcados.</li>
      <li> Al finalizar debería de apreciarse una parábola. Si este no es el caso, continúa haciendo más pliegues hasta que se note bienla figura</li>
   </ul>
		 		 		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Parabola-plegados-papel.png" alt="Dibujando una parábola con plegamientos sobre un papel" width="70%"/></center>

   </div>
</div>

<div id="Hiperbola-plegados-papel" class="tabcontent" style="display:none;">
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
		 		 <center><img src="{{ site.baseurl }}/assets/MatExp/geometria/conicas/construccion/Hiperbola-plegados-papel.png" alt="Dibujando una hipérbola con plegamientos sobre un papel" width="70%"/></center>

   </div>
</div>
