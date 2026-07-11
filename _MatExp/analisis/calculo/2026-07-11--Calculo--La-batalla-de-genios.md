---
title: "La batalla de genios: el duelo del cálculo"
lang: es
page_id: matexp-calculus-duel
date: '2026-07-11 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - derivadas
  - integrales
taxonomy: experimento análisis cálculo derivadas integrales juego
permalink: "/MatExp/analisis/calculo/duelo/"
header:
  image: "/assets/MatExp/analisis/calculo/duelo/feature.svg"
excerpt: "Un duelo multijugador de derivadas e integrales en el que cada respuesta correcta devuelve la operación inversa al campo rival."
feature: "/assets/MatExp/analisis/calculo/duelo/feature.svg"
sidebar:
  nav: "calculus-casebook"
---
**La batalla de genios** es un juego multijugador para practicar derivadas e integrales y reconocer que ambas operaciones son inversas. Cada participante dispone de un reloj: gana la última persona que conserva tiempo.

Cuando un jugador responde correctamente, recibe una bonificación y envía a un rival la operación inversa. Las preguntas recibidas añaden una penalización que acelera el reloj hasta que se resuelven.

## Cómo jugar

1. Una persona crea la partida, elige su duración, el número de jugadores y las familias de funciones.
2. Los demás participantes se unen desde sus dispositivos intercambiando los códigos QR que muestra la aplicación.
3. Cada jugador resuelve derivadas o antiderivadas y trata de mantener activo su reloj.
4. El último reloj en funcionamiento gana el duelo.

La conexión entre dispositivos es directa mediante WebRTC y no necesita un servidor de partida. Para escanear los códigos QR, el navegador solicitará permiso para utilizar la cámara.

## El duelo del cálculo

<style>
  .calculus-duel-actions {
    margin: 0.75rem 0 0.5rem;
  }

  .calculus-duel-embed {
    width: 100%;
    height: 2050px;
    border: 0;
    border-radius: 14px;
    overflow: hidden;
    background: #101a2b;
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08);
  }

  @media (max-width: 700px) {
    .calculus-duel-embed {
      height: 2400px;
    }
  }
</style>

<div class="calculus-duel-actions">
  <button id="calculusDuelFullscreen" class="btn btn--small btn--info" style="color: white;" type="button">Ver en pantalla completa</button>
</div>

<iframe
  id="calculusDuelFrame"
  class="calculus-duel-embed"
  title="La batalla de genios: el duelo del cálculo"
  src="{{ site.baseurl }}/assets/MatExp/analisis/calculo/duelo/index.html"
  allow="camera"
  allowfullscreen
  loading="lazy"
></iframe>

<script>
  (function () {
    var button = document.getElementById('calculusDuelFullscreen');
    var frame = document.getElementById('calculusDuelFrame');

    if (!button || !frame) return;

    button.addEventListener('click', function () {
      if (frame.requestFullscreen) {
        frame.requestFullscreen();
      } else {
        window.open(frame.src, '_blank', 'noopener');
      }
    });
  })();
</script>
