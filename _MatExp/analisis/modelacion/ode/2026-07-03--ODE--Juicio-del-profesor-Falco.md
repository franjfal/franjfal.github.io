---
title: "ODE: el juicio del profesor Falcó"
date: '2026-07-03 20:30:00 +0200'
categories:
  - experimento
  - análisis
  - modelación
  - ODE
permalink: "/MatExp/analisis/modelacion/ode/juicio-profesor-falco/"
header:
  image: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/assets/cover_scene.png"
excerpt: "Generador de documentos para una actividad de juicio matemático basada en la ley de enfriamiento de Newton."
feature: "/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/feature.svg"
---

Esta actividad convierte la ley de enfriamiento de Newton en un juicio. El alumnado recibe papeles separados, interroga a testigos y sospechosos, y reconstruye la cronología hasta encontrar a la persona culpable.

El generador permite elegir la fecha del caso, la hora de finalización de la clase y el género de cada sospechoso. A partir de esos datos produce los documentos necesarios para repartir la actividad en el aula, tanto por piezas separadas como en paquetes completos por rol.

<style>
  .trial-generator-embed {
    width: 100%;
    height: 980px;
    max-height: 88vh;
    border: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #f7f5ef;
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08);
  }

  @media (max-width: 820px) {
    .trial-generator-embed {
      height: 1120px;
      max-height: none;
    }
  }
</style>

<iframe
  class="trial-generator-embed"
  title="Generador del juicio del profesor Falco"
  src="{{ site.baseurl }}/assets/MatExp/analisis/modelacion/ode/juicio-profesor-falco/index.html"
  loading="lazy"
></iframe>
