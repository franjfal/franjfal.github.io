---
title: Explorando el algoritmo PageRank
date: '2026-04-01 10:00:00 +0200'
categories:
  - experimento
  - teoría-de-grafos
  - álgebra-lineal
  - modelización
taxonomy: experimento grafos internet pagerank matrices autovalores
permalink: "/MatExp/discreta/grafos/pagerank/"
header:
  image: "/assets/MatExp/discreta/grafos/pagerank/header.png"
excerpt: "Una visualización interactiva para construir una web, estudiar su matriz asociada y seguir paso a paso las iteraciones del algoritmo PageRank."
feature: "/assets/MatExp/discreta/grafos/pagerank/feature.png"
---

Cuando una red de páginas web se representa mediante un grafo dirigido, cada página se convierte en un nodo y cada enlace en una arista orientada. El algoritmo **PageRank** parte de esa idea para responder a una pregunta muy natural: **si una persona fuese saltando de enlace en enlace, qué páginas visitaría con mayor frecuencia a largo plazo**.

La clave pedagógica del algoritmo es que combina tres niveles de descripción:

1. **la estructura del grafo**, que nos dice qué páginas enlazan a cuáles;
2. **la matriz de transición**, que reparte el peso de cada página entre sus enlaces salientes;
3. **la iteración de un vector de probabilidades**, que acaba estabilizándose y produce una ordenación de las páginas.

En el interactivo de esta página puedes construir y modificar una web pequeña, cargar ejemplos prediseñados y seguir las iteraciones del método una a una.

## Interactivo

<style>
  .pagerank-embed {
    width: 100%;
    height: 1880px;
    max-height: none;
    border: 0;
    border-radius: 14px;
    overflow: hidden;
    background: #f6f7f9;
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08);
  }

  .pagerank-modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,.68);
    padding: 2vh 2vw;
  }

  .pagerank-modal[aria-hidden="false"] {
    display: block;
  }

  .pagerank-modal__panel {
    width: 96vw;
    height: 95vh;
    margin: 0 auto;
    position: relative;
  }

  .pagerank-modal__close {
    position: absolute;
    right: 0;
    top: -44px;
    border: 0;
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
  }

  .pagerank-modal__frame {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 12px;
    background: #f6f7f9;
  }

  @media (max-width: 900px) {
    .pagerank-embed {
      height: 2100px;
    }
  }
</style>

<div style="margin: 0.75rem 0 0.5rem;">
  <button id="pagerankOpenModal" class="btn btn--small btn--info" style="color: white;" type="button">Ver en grande</button>
</div>

<iframe
  class="pagerank-embed"
  title="Explorador del algoritmo PageRank"
  src="{{ site.baseurl }}/assets/MatExp/discreta/grafos/pagerank/index.html"
  loading="lazy"
></iframe>

<div id="pagerankModal" class="pagerank-modal" aria-hidden="true" role="dialog" aria-label="Explorador del algoritmo PageRank">
  <div class="pagerank-modal__panel">
    <button id="pagerankCloseModal" class="pagerank-modal__close" type="button">Cerrar</button>
    <iframe
      class="pagerank-modal__frame"
      title="Explorador del algoritmo PageRank (modo grande)"
      src="{{ site.baseurl }}/assets/MatExp/discreta/grafos/pagerank/index.html"
      loading="lazy"
    ></iframe>
  </div>
</div>

### Cómo usar el interactivo

- **Cargar ejemplos**: en el desplegable superior puedes elegir tres webs prediseñadas.
  - una **miniweb** para seguir los cálculos con claridad;
  - una **web media** con una estructura más rica;
  - una red con **componentes desconexas y un nodo colgante**, para comprobar por qué hace falta la corrección de PageRank.
- **Mover páginas**: arrastra los nodos para reorganizar el grafo.
- **Crear o eliminar enlaces**: haz clic en una página y luego en otra. Si el enlace ya existía, se elimina; si no existía, se crea.
- **Editar páginas**: al seleccionar un nodo puedes cambiar su icono y su etiqueta.
- **Iterar paso a paso**: usa los botones inferiores para avanzar o retroceder por la tabla de iteraciones.
- **Ejecutar automáticamente**: el botón **Auto** recorre las iteraciones hasta que se satisface el criterio de parada o se alcanza el máximo fijado.

## Cómo funciona PageRank, en cuatro pasos

Si quieres una visión rápida antes de mirar matrices y fórmulas, el algoritmo puede resumirse así:

1. **La web se modela como un grafo dirigido**: cada página es un nodo y cada enlace es una flecha.
2. **Ese grafo se transforma en una matriz de transición**: cada página reparte su peso entre sus enlaces salientes.
3. **Se añade la teletransportación**: así evitamos que el proceso quede atrapado en páginas sin salida o en componentes cerradas.
4. **Se repite la misma actualización muchas veces**: el vector de probabilidades se va estabilizando hasta producir un ranking final.

En otras palabras, PageRank no "cuenta enlaces" sin más: va redistribuyendo importancia por toda la red hasta que el reparto deja prácticamente de cambiar.

## Idea probabilística del algoritmo

Una forma muy intuitiva de entender PageRank es imaginar a una persona navegando por la web:

- si está en una página con varios enlaces salientes, escoge uno de ellos al azar;
- si llega a una página sin enlaces, no puede continuar siguiendo enlaces;
- además, de vez en cuando puede aburrirse y saltar a cualquier otra página.

Ese modelo define una **cadena de Markov** sobre el conjunto de páginas. El valor de PageRank de cada nodo mide la probabilidad de encontrar al navegante en esa página cuando el proceso ha pasado ya mucho tiempo.

Si numeramos las páginas como $1,2,\dots,n$, la información de enlaces puede escribirse en una matriz $S=(s_{ij})$ en la que la entrada $s_{ij}$ representa la probabilidad de pasar de la página $j$ a la página $i$.

Cuando la página $j$ tiene $d_j$ enlaces salientes y uno de ellos apunta a la página $i$, tomamos

$$
s_{ij}=\frac{1}{d_j}.
$$

Si no hay enlace de $j$ a $i$, entonces $s_{ij}=0$.

Observa que, con esta convención, **cada columna suma 1** siempre que la página correspondiente tenga al menos un enlace saliente.

## El problema de los nodos colgantes y de las componentes desconexas

En webs reales aparecen dos dificultades importantes.

### 1. Páginas sin enlaces salientes

Si una página no enlaza a ninguna otra, la columna correspondiente no puede normalizarse de la forma anterior. Estas páginas se llaman a veces **nodos colgantes** (*dangling nodes*). En el interactivo se corrige ese problema repartiendo su peso uniformemente entre todas las páginas:

$$
s_{ij}=\frac{1}{n}\qquad\text{si la página } j \text{ no tiene enlaces salientes.}
$$

### 2. Subredes cerradas o componentes desconexas

Aunque corrijamos los nodos colgantes, todavía pueden existir partes de la web donde el navegante quede atrapado o situaciones en las que la estructura del grafo impida mezclar bien la información. Para evitarlo se introduce la **teletransportación** y se define la llamada **matriz de Google**:

$$
G = \alpha S + (1-\alpha)\frac{1}{n}\mathbf{1}\mathbf{1}^T,
$$

donde $0<\alpha<1$ es el **factor de amortiguación**. El valor típico es $\alpha=0.85$.

Esto significa que:

- con probabilidad $\alpha$ seguimos un enlace de la web;
- con probabilidad $1-\alpha$ saltamos a una página cualquiera de forma uniforme.

Esa pequeña corrección tiene un efecto matemático decisivo: hace que el sistema sea mucho más estable y que exista un vector de ranking bien definido incluso cuando la red original es poco amable.

## La iteración del PageRank

Partimos de un vector inicial de pesos, por ejemplo el reparto uniforme

$$
p^{(0)} = \frac{1}{n}\mathbf{1}.
$$

A continuación aplicamos repetidamente la regla

$$
p^{(k+1)} = Gp^{(k)}.
$$

Cada iteración redistribuye el peso de las páginas según los enlaces y la corrección de teletransportación. Si el proceso converge, obtenemos un vector $p$ tal que

$$
p = Gp.
$$

Es decir, el PageRank final es un **autovector** asociado al autovalor $1$ de la matriz de Google, normalizado para que la suma de sus entradas sea $1$.

En el interactivo se usa como condición de parada que la diferencia entre dos iteraciones consecutivas sea pequeña en norma $L^1$:

$$
\lVert p^{(k+1)}-p^{(k)}\rVert_1 < \varepsilon.
$$

## Qué conviene observar en los ejemplos

### Miniweb

La miniweb está pensada para comprobar tres hechos sencillos:

- una página puede recibir mucho peso aunque no tenga muchos enlaces salientes;
- lo importante no es solo cuántos enlaces llegan, sino **desde qué páginas llegan**;
- el ranking se entiende mejor si se sigue a la vez el grafo y la matriz de transición.

### Web media

En una red más grande aparecen fenómenos más realistas:

- páginas con papel de **hub**, que reparten peso hacia muchas otras;
- páginas de **autoridad**, que reciben enlaces desde sitios importantes;
- iteraciones en las que la ordenación provisional cambia antes de estabilizarse.

### Componentes desconexas y nodo colgante

Este ejemplo muestra precisamente por qué PageRank no se queda en la simple matriz de enlaces. Sin la corrección de nodos colgantes y sin la teletransportación, una parte del peso podría quedarse atrapada o el sistema podría no reflejar bien el conjunto de la red. La matriz de Google redistribuye la información y reintroduce comunicación entre todas las páginas.

## Un comentario formal importante

Aunque muchas explicaciones divulgativas hablan del algoritmo como si contara simplemente enlaces entrantes, esa visión es incompleta. PageRank es realmente un problema de **probabilidad lineal** y de **álgebra matricial**. El peso de una página depende de:

- qué páginas apuntan a ella;
- cuántos enlaces salientes tiene cada una de esas páginas;
- el valor de $\alpha$;
- la estructura global de la red.

Por eso dos páginas con el mismo número de enlaces entrantes pueden terminar con PageRank muy distinto.

## Para seguir profundizando

- **Larry Page, Sergey Brin, Rajeev Motwani y Terry Winograd**, *The PageRank Citation Ranking: Bringing Order to the Web* (Stanford InfoLab Technical Report, 1999): <https://ilpubs.stanford.edu:8090/422/>
- **Sergey Brin y Lawrence Page**, *The Anatomy of a Large-Scale Hypertextual Web Search Engine* (1998): <https://snap.stanford.edu/class/cs224w-readings/Brin98Anatomy.pdf>
- **Amy N. Langville y Carl D. Meyer**, *Deeper Inside PageRank*, Internet Mathematics 1(3), 2004: <https://doi.org/10.1080/15427951.2004.10129091>
- **Amy N. Langville y Carl D. Meyer**, *Google's PageRank and Beyond: The Science of Search Engine Rankings* (Princeton University Press, 2006).

<script>
  (function () {
    var openBtn = document.getElementById('pagerankOpenModal');
    var closeBtn = document.getElementById('pagerankCloseModal');
    var modal = document.getElementById('pagerankModal');

    if (!openBtn || !closeBtn || !modal) return;

    function openModal() {
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
    });
  })();
</script>
