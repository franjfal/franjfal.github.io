---
title: Simulación del Modelo Depredador-Presa de Lotka-Volterra
name: Lotka-Volterra
date: '2021-02-22 11:00:31 +0200'
categories: experimento modelización-matemática
taxonomy: experimento modelización ecuaciones-diferenciales simulación geogebra
permalink: "/MatExp/aplicada/modelizacion/Lotka-Volterra/"
excerpt: Simulación del modelo Depredador-Presa de Lotka-Volterra.
image: /assets/MatExp/aplicada/modelizacion/Lotka-Volterra/feature.png"
---

El modelo Depredador-Presa utiliza las ecuaciones de Lotka-Volterra propuestas de forma independiente por Alfred J. Lotka (1880 -- 1949) en 1925 y Vito Volterra (1860 -- 1940) en 1926 para describir la dinámica de sistemas biológicos en los que dos especies interactúan. Este modelo estudia la evolución de dos sociedades que conviven en un entorno, una como presa y otra como depredador. Por ejemplo una población formada por lobos y conejos. 

<center><img src="{{ site.baseurl }}/assets/MatExp/aplicada/modelizacion/Lotka-Volterra/Lotka-Volterra-equilibrio.png" alt="Lobos vs conejos" width="70%"/></center>

En este caso tenemos dos poblaciones cuya evolución depende del tiempo y de las interacciones entre las mismas. La modelización de esta situación requiere de dos ecuaciones diferenciales con dos incógnitas.

Denotando por $$\textstyle L(t)$$ el número de lobos y por $$\textstyle C(t)$$ el número de conejos, las ecuaciones propuestas por Lotka y Volterra que representan el modelo matemáticamente son:

$$
\begin{cases}
\frac{dC}{dt}&=\alpha C -\beta L\cdot C,\\
\frac{dL}{dt}&=\delta L\cdot C -\gamma L.
\end{cases}
$$



Los parámetros $$\textstyle \alpha, \beta, \delta$$ y $$\textstyle \gamma$$ son números positivos que representan las interacciones de las dos especies. La primera de las ecuaciones nos indica que la cantidad de conejos aumenta de modo proporcional a su número, pero disminuye de forma proporcional a la cantidad de encuentros entre las dos especies porque los lobos se comen a los conejos. La segunda de las ecuaciones establece que la cantidad de lobos aumenta de modo proporcional a las interacciones entre las dos especies, pero disminuye de modo proporcional a la cantidad de lobos. Esta disminución aparece porque al haber más lobos conviviendo juntos hay más competencia y dificultad para conseguir presas. A diferencia de los lobos, suponemos que los conejos no tienen dificultad para encontrar comida independientemente de cuántos haya.

El siguiente applet interactivo nos representa las soluciones de la funciones $$\textstyle L(t)$$ y $$\textstyle C(t)$$ dependiendo de los parámetros $$\textstyle \alpha, \beta, \delta$$ y $$\textstyle \gamma$$.

<style type="text/css">
    .frame-container {
        position: relative;
        padding-bottom: 56.25%;
        padding-top: 35px;
        height: 0;
        overflow: hidden;
    }
    .frame-container iframe {
        position: absolute;
        top:0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    </style>

<div class="frame-container">
<iframe scrolling="no" title="Modelo Depredador-Presa de Lotka-Volterra" src="https://www.geogebra.org/material/iframe/id/mnxpn28v/width/980/height/520/border//sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/false/rc/false/ld/false/sdz/false/ctl/false" width="980px" height="520px" style="border:0px;"> </iframe>
</div>
