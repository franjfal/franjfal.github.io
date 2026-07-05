---
title: "Bezier Curves and Surfaces"

lang: en
page_id: matexp-bezier-curves-surfaces
date: '2026-02-04 12:00:00 +0100'
categories:
  - experiment
  - analysis
  - geometry
  - interpolation
  - Bézier
permalink: "/MatExp/analysis/bezier/curves-and-surfaces/"

header:
  image: "/assets/MatExp/analisis/bezier/header.jpg"
excerpt: "Explore 2D and 3D Bezier curves, and a 3D Bezier surface, by moving control points and visualizing De Casteljau's algorithm."

feature: "/assets/MatExp/analisis/bezier/feature.jpg"
---
Bezier curves emerged in the 1960s in the context of industrial design (Renault, Pierre Bezier). They rely on a simple and powerful geometric idea: a curve or surface is obtained as a convex combination of control points through Bernstein polynomials.

In its most common form, a curve of degree $n$ is given by

$$
B(t) = \sum_{i=0}^{n} \binom{n}{i}(1-t)^{n-i}t^i\,P_i,\qquad t\in[0,1].
$$

and can be evaluated in a numerically stable way with **De Casteljau's algorithm**, which repeatedly performs linear interpolations between consecutive points.

For surfaces, a tensor product with two parameters $(u,v)\in[0,1]^2$ is used:

$$
S(u,v)=\sum_{i=0}^{n}\sum_{j=0}^{m} B_n^i(u)\,B_m^j(v)\,P_{i,j}.
$$

**How to Use the Interactive**
- 2D curve: click to add a point, `Shift`+click to delete, drag to move.
- 3D curve and 3D surface: to **move points**, first **turn off** **Camera mode** (when it is active, the mouse controls orbit and zoom).

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
  <button id="bezierOpenModal" class="btn btn--small btn--info" style="color: white;" type="button">Open large view</button>
</div>

<iframe
  class="bezier-embed"
  title="Bezier Curves and Surfaces"
  src="{{ site.baseurl }}/assets/MatExp/analisis/bezier/index.html"
  loading="lazy"
></iframe>

<div id="bezierModal" class="bezier-modal" aria-hidden="true" role="dialog" aria-label="Bezier Curves and Surfaces">
  <div class="bezier-modal__panel">
    <button id="bezierCloseModal" class="bezier-modal__close" type="button">Close</button>
    <iframe
      class="bezier-modal__frame"
      title="Bezier Curves and Surfaces (large view)"
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
