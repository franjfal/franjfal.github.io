---
title: "Exploring the PageRank Algorithm"

lang: en
page_id: matexp-pagerank
date: '2026-04-01 10:00:00 +0200'
categories:
  - experiment
  - graph-theory
  - linear-algebra
  - modelización
taxonomy: experimento grafos internet pagerank matrices autovalores
permalink: "/MatExp/discrete/graphs/pagerank/"

header:
  image: "/assets/MatExp/discreta/grafos/pagerank/header.png"
excerpt: "An interactive visualization for building a web graph, studying its associated matrix, and following the iterations of the PageRank algorithm step by step."

feature: "/assets/MatExp/discreta/grafos/pagerank/feature.png"
---
When a network of web pages is represented as a directed graph, each page becomes a node and each link becomes an oriented edge. The **PageRank** algorithm starts from this idea to answer a very natural question: **if a person kept jumping from link to link, which pages would they visit most often in the long run**.

The pedagogical key of the algorithm is that it combines three levels of description:

1. **la estructura del grafo**, que nos dice qué páginas enlazan a cuáles;
2. **la matriz de transición**, que reparte el peso de cada página entre sus enlaces salientes;
3. **la iteración de un vector de probabilidades**, que acaba estabilizándose y produce una ordenación de las páginas.

In the interactive on this page you can build and modify a small web, load predefined examples, and follow the method's iterations one by one.

## Interactive

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
  <button id="pagerankOpenModal" class="btn btn--small btn--info" style="color: white;" type="button">Open large view</button>
</div>

<iframe
  class="pagerank-embed"
  title="PageRank Algorithm Explorer"
  src="{{ site.baseurl }}/assets/MatExp/discreta/grafos/pagerank/index.html"
  loading="lazy"
></iframe>

<div id="pagerankModal" class="pagerank-modal" aria-hidden="true" role="dialog" aria-label="PageRank Algorithm Explorer">
  <div class="pagerank-modal__panel">
    <button id="pagerankCloseModal" class="pagerank-modal__close" type="button">Close</button>
    <iframe
      class="pagerank-modal__frame"
      title="PageRank Algorithm Explorer (large view)"
      src="{{ site.baseurl }}/assets/MatExp/discreta/grafos/pagerank/index.html"
      loading="lazy"
    ></iframe>
  </div>
</div>

### How to Use the Interactive

- **Cargar ejemplos**: en el desplegable superior puedes elegir tres webs prediseñadas.
  - una **miniweb** para seguir los cálculos con claridad;
  - una **web media** con una estructura más rica;
  - una red con **componentes desconexas y un nodo colgante**, para comprobar por qué hace falta la corrección de PageRank.
- **Mover páginas**: arrastra los nodos para reorganizar el grafo.
- **Crear o eliminar enlaces**: haz clic en una página y luego en otra. Si el enlace ya existía, se elimina; si no existía, se crea.
- **Editar páginas**: al seleccionar un nodo puedes cambiar su icono y su etiqueta.
- **Iterar paso a paso**: usa los botones inferiores para avanzar o retroceder por la tabla de iteraciones.
- **Ejecutar automáticamente**: el botón **Auto** recorre las iteraciones hasta que se satisface el criterio de parada o se alcanza el máximo fijado.

## How PageRank Works, in Four Steps

If you want a quick view before looking at matrices and formulas, the algorithm can be summarized like this:

1. **La web se modela como un grafo dirigido**: cada página es un nodo y cada enlace es una flecha.
2. **Ese grafo se transforma en una matriz de transición**: cada página reparte su peso entre sus enlaces salientes.
3. **Se añade la teletransportación**: así evitamos que el proceso quede atrapado en páginas sin salida o en componentes cerradas.
4. **Se repite la misma actualización muchas veces**: el vector de probabilidades se va estabilizando hasta producir un ranking final.

In other words, PageRank does not merely "count links": it redistributes importance across the whole network until the distribution practically stops changing.

## The Probabilistic Idea Behind the Algorithm

A very intuitive way to understand PageRank is to imagine a person browsing the web:

- si está en una página con varios enlaces salientes, escoge uno de ellos al azar;
- si llega a una página sin enlaces, no puede continuar siguiendo enlaces;
- además, de vez en cuando puede aburrirse y saltar a cualquier otra página.

This model defines a **Markov chain** on the set of pages. The PageRank value of each node measures the probability of finding the surfer on that page after the process has run for a long time.

Si numeramos las páginas como $1,2,\dots,n$, la información de enlaces puede escribirse en una matriz $S=(s_{ij})$ en la que la entrada $s_{ij}$ representa la probabilidad de pasar de la página $j$ a la página $i$.

Cuando la página $j$ tiene $d_j$ enlaces salientes y uno de ellos apunta a la página $i$, tomamos

$$
s_{ij}=\frac{1}{d_j}.
$$

Si no hay enlace de $j$ a $i$, entonces $s_{ij}=0$.

Observa que, con esta convención, **cada columna suma 1** siempre que la página correspondiente tenga al menos un enlace saliente.

## The Problem of Dangling Nodes and Disconnected Components

Two important difficulties appear in real webs.

### 1. Pages with No Outgoing Links

Si una página no enlaza a ninguna otra, la columna correspondiente no puede normalizarse de la forma anterior. Estas páginas se llaman a veces **nodos colgantes** (*dangling nodes*). En el interactivo se corrige ese problema repartiendo su peso uniformemente entre todas las páginas:

$$
s_{ij}=\frac{1}{n}\qquad\text{si la página } j \text{ no tiene enlaces salientes.}
$$

### 2. Closed Subnetworks or Disconnected Components

Aunque corrijamos los nodos colgantes, todavía pueden existir partes de la web donde el navegante quede atrapado o situaciones en las que la estructura del grafo impida mezclar bien la información. Para evitarlo se introduce la **teletransportación** y se define la llamada **matriz de Google**:

$$
G = \alpha S + (1-\alpha)\frac{1}{n}\mathbf{1}\mathbf{1}^T,
$$

donde $0<\alpha<1$ es el **factor de amortiguación**. El valor típico es $\alpha=0.85$.

This means that:

- con probabilidad $\alpha$ seguimos un enlace de la web;
- con probabilidad $1-\alpha$ saltamos a una página cualquiera de forma uniforme.

This small correction has a decisive mathematical effect: it makes the system much more stable and gives a well-defined ranking vector even when the original network is not especially well behaved.

## The PageRank Iteration

We start from an initial weight vector, for instance the uniform distribution

$$
p^{(0)} = \frac{1}{n}\mathbf{1}.
$$

Then we repeatedly apply the rule

$$
p^{(k+1)} = Gp^{(k)}.
$$

Each iteration redistributes page weight according to the links and the teleportation correction. If the process converges, we obtain a vector $p$ such that

$$
p = Gp.
$$

That is, the final PageRank is an **eigenvector** associated with the eigenvalue $1$ of the Google matrix, normalized so that the sum of its entries is $1$.

The interactive uses the condition that the difference between two consecutive iterations is small in the $L^1$ norm:

$$
\lVert p^{(k+1)}-p^{(k)}\rVert_1 < \varepsilon.
$$

## What to Observe in the Examples

### Miniweb

La miniweb está pensada para comprobar tres hechos sencillos:

- una página puede recibir mucho peso aunque no tenga muchos enlaces salientes;
- lo importante no es solo cuántos enlaces llegan, sino **desde qué páginas llegan**;
- el ranking se entiende mejor si se sigue a la vez el grafo y la matriz de transición.

### Medium Web

En una red más grande aparecen fenómenos más realistas:

- páginas con papel de **hub**, que reparten peso hacia muchas otras;
- páginas de **autoridad**, que reciben enlaces desde sitios importantes;
- iteraciones en las que la ordenación provisional cambia antes de estabilizarse.

### Disconnected Components and a Dangling Node

Este ejemplo muestra precisamente por qué PageRank no se queda en la simple matriz de enlaces. Sin la corrección de nodos colgantes y sin la teletransportación, una parte del peso podría quedarse atrapada o el sistema podría no reflejar bien el conjunto de la red. La matriz de Google redistribuye la información y reintroduce comunicación entre todas las páginas.

## An Important Formal Comment

Although many popular explanations describe the algorithm as if it simply counted incoming links, that view is incomplete. PageRank is really a problem in **linear probability** and **matrix algebra**. El peso de una página depende de:

- qué páginas apuntan a ella;
- cuántos enlaces salientes tiene cada una de esas páginas;
- el valor de $\alpha$;
- la estructura global de la red.

That is why two pages with the same number of incoming links can end up with very different PageRank values.

## Further Reading

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
