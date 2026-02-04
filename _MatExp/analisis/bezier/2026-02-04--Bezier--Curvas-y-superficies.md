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
- Curva 3D y superficie 3D: para **mover puntos** hay que **desactivar** primero **Modo cámara** (si está activado, el ratón controla la órbita/zoom).
- He aumentado la zona “agarrable” de los puntos (hit-area) para que sea más fácil seleccionarlos.

<style>
  .bezier-embed {
    width: 100%;
    height: 940px;
    max-height: 85vh;
    border: 0;
    border-radius: 12px;
    overflow: hidden;
    background: #f6f7f9;
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08);
  }

  @media (max-width: 700px) {
    .bezier-embed {
      height: 920px;
      max-height: none;
    }
  }

  .bezier-modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,.65);
    padding: 2vh 2vw;
  }

  .bezier-modal[aria-hidden="false"] { display: block; }

  .bezier-modal__panel {
    width: 95vw;
    height: 95vh;
    margin: 0 auto;
    background: #0000;
    position: relative;
  }

  .bezier-modal__close {
    position: absolute;
    right: 0;
    top: -44px;
    border: 0;
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
  }

  .bezier-modal__frame {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 12px;
    background: #f6f7f9;
  }
</style>

<div style="margin: 0.75rem 0 0.5rem;">
  <button id="bezierOpenModal" class="btn btn--small btn--info" style="color: white;" type="button">Ver en grande</button>
</div>

<iframe
  class="bezier-embed"
  title="Curvas y superficies de Bézier"
  src="{{ site.baseurl }}/assets/MatExp/analisis/bezier/index.html"
  loading="lazy"
></iframe>

<div id="bezierModal" class="bezier-modal" aria-hidden="true" role="dialog" aria-label="Curvas y superficies de Bézier">
  <div class="bezier-modal__panel">
    <button id="bezierCloseModal" class="bezier-modal__close" type="button">Cerrar</button>
    <iframe
      class="bezier-modal__frame"
      title="Curvas y superficies de Bézier (modo grande)"
      src="{{ site.baseurl }}/assets/MatExp/analisis/bezier/index.html"
      loading="lazy"
    ></iframe>
  </div>
</div>

<script>
  (function () {
    var openBtn = document.getElementById('bezierOpenModal');
    var closeBtn = document.getElementById('bezierCloseModal');
    var modal = document.getElementById('bezierModal');

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
