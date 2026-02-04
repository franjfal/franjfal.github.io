---
title: Curvas y superficies de Bézier
date: '2026-02-04 12:00:00 +0100'
categories:
  - experimento
  - análisis
  - geometría
  - interpolación
  - Bézier
permalink: "/MatExp/analisis/bezier/curvas-y-superficies"
header:
  image: "/assets/MatExp/analisis/bezier/header.jpg"
excerpt: "Explora curvas de Bézier en 2D y 3D, y una superficie de Bézier en 3D, moviendo los puntos de control y visualizando el algoritmo de De Casteljau."
feature: "/assets/MatExp/analisis/bezier/feature.jpg"
---

Las curvas de Bézier nacen en los años 60 en el contexto del diseño industrial (Renault, Pierre Bézier) y se apoyan en una idea geométrica simple y potente: una curva (o superficie) se obtiene como combinación convexa de puntos de control mediante polinomios de Bernstein.

En su forma más habitual, una curva de grado $n$ viene dada por

$$
B(t) = \sum_{i=0}^{n} \binom{n}{i}(1-t)^{n-i}t^i\,P_i,\qquad t\in[0,1].
$$

y puede evaluarse de manera numéricamente estable con el **algoritmo de De Casteljau**, que repite interpolaciones lineales entre puntos consecutivos.

Para superficies, se usa un producto tensorial con dos parámetros $(u,v)\in[0,1]^2$:

$$
S(u,v)=\sum_{i=0}^{n}\sum_{j=0}^{m} B_n^i(u)\,B_m^j(v)\,P_{i,j}.
$$

**Cómo usar el interactivo**
- Curva 2D: clic para añadir un punto, `Shift`+clic para borrar, arrastrar para mover.
- Curva 3D y superficie 3D: activa/desactiva **Modo cámara** para alternar entre orbitar y mover puntos.
- He aumentado la zona “agarrable” de los puntos (hit-area) para que sea más fácil seleccionarlos.

<div style="margin: 1rem 0;">
  <a class="btn btn--small btn--info" style="color: white;" target="_blank" href="{{ site.baseurl }}/assets/MatExp/analisis/bezier/index.html">Abrir interactivo en una pestaña nueva</a>
</div>

<iframe
  title="Curvas y superficies de Bézier"
  src="{{ site.baseurl }}/assets/MatExp/analisis/bezier/index.html"
  width="100%"
  height="980"
  style="border: 0; border-radius: 12px;"
  loading="lazy"
></iframe>
