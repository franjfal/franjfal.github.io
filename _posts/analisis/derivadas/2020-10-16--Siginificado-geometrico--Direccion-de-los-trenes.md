---
title: La dirección del tren
date: '2020-10-16 14:54:31 +0200'
categories:
- experimento
- Análisis-una-variable
taxonomy: experimento análisis derivadas aplicaciones
permalink: "/MatExp/analisis/derivadas/trenes/"
header:
  image: "/assets/MatExp/analisis/derivadas/trenes/header.jpg"
excerpt: Experimento que muestra la derivada como un fenómeno natural que establece
  la dirección de los trenes en cada instante.
image: "/assets/MatExp/analisis/derivadas/trenes/feature.jpg"
---

<div class="materials">
<h2> Materiales:</h2>
<ul>
<li> Papel cuadriculado.</li>
<li> Juego de trenes con vías de madera.</li>
</ul>
</div>

<div class="experiment">

<h1> Instrucciones:</h1>
<ul>
<li> <a target="_blank" href="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/trenes/Sistema-de-coordenadas.pdf">Descarga</a> y monta el siguiente sistema de coordenadas.</li>

<li> Coloca las vías de madera sobre el papel cuadriculado siguiendo las indicaciones que se dan en la gráfica:
<center><img src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/trenes/vias-1.jpg" alt="vias del tren" width="70%"/></center>
La parte superior del recorrido marcado por las vías sigue la ecuación $$f(t)=\sqrt{121-t^2}.$$</li>
<li>  Desplaza el tren por las vías en sentido antihorario.</li>
<center><img src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/trenes/vias-1-direccion.jpg" alt="vias del tren" width="70%"/></center>

<li> El principio de la vía marcada con rojo corresponde a los valores $$\textstyle\left(t,f(t)\right)=\left(\frac{11}{\sqrt{2}},\frac{11}{\sqrt{2}}\right).$$ Calcula la derivada de la función $$\textstyle f$$ en este punto.</li>
<li> Elimina la via marcada de color rojo y empujar el tren con suficiente fuerza para que siga su transcurso natural al pasar el punto marcado de color rojo.

	<center>	El video se añadirá en breve.</center>
</li>
<li> Calcula el desplazamiento horizontal realizado por el tren desde el punto marcado hasta el punto en el que este se ha detenido. Nota que horizontalmente el tren se desplazará hacia la derecha produciendo un desplazamiento positivo, mientras que verticalmente el tren se desplazará hacia abajo produciendo un desplazamiento negativo.

<center><img src="{{ site.baseurl }}/assets/MatExp/analisis/derivadas/trenes/vias-1-tren.jpg" alt="vias del tren" width="70%"/></center>

El cociente dado por

$$\frac{\text{desplazamiento vertical}}{\text{desplazamiento horizontal}}$$

ha de coincidir con el valor de la derivada en el punto  $$\textstyle t=\frac{11}{\sqrt{2}}.$$</li>
</ul>
</div>



## Cálculo de la derivada.
La función que representa la parte superior de la vía es
$$
	f(t)=\sqrt{121-t^2}
$$

Por tanto su derivada es:

$$
	f'(t)=\frac{-t}{\sqrt{121-t^2}}.
$$

Sutituyendo en el punto $$\textstyle t=\frac{11}{\sqrt{2}}$$ obtenemos

$$
f'(t)=\frac{-\frac{11}{\sqrt{2}}}{\sqrt{121-\left(\frac{11}{\sqrt{2}}\right)^2}}=\frac{-\frac{11}{\sqrt{2}}}{\sqrt{121-\frac{121}{2}}}=\frac{-\frac{11}{\sqrt{2}}}{-\frac{11}{\sqrt{2}}}=-1.
$$

Esto coincide con el desplazamiento que hemos visto en el video que es de 6 unidades hacia la izquierda y 6 unidades hacia arriba; $$\frac{8}{-8}=-1.$$
