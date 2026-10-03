---
title: "Calculus Cases: la batalla de genios"
lang: es
page_id: matexp-calculus-duel
date: '2026-07-11 12:00:00 +0200'
categories:
  - experimento
  - análisis
  - cálculo
  - derivadas
  - integrales
taxonomy: experimento análisis cálculo derivadas integrales juego Calculus-Cases
permalink: "/MatExp/analisis/calculo/duelo/"
header:
  image: "/assets/MatExp/analisis/calculo/duelo/header-brand.jpg"
excerpt: "Un duelo multijugador de derivadas e integrales en el que cada respuesta correcta devuelve la operación inversa al campo rival."
feature: "/assets/MatExp/analisis/calculo/duelo/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css">

**La batalla de genios** es un juego multijugador para practicar derivadas e integrales y reconocer que ambas operaciones son inversas. Cada participante dispone de un reloj: gana la última persona que conserva tiempo.

Cuando un jugador responde correctamente, recibe una bonificación y envía a un rival la operación inversa. Las preguntas recibidas añaden una penalización que acelera el reloj hasta que se resuelven.

## Cómo se juega

1. Una persona crea la partida y elige su duración, el número de jugadores y las familias de funciones.
2. Los demás participantes se unen desde sus dispositivos intercambiando los códigos QR que muestra la aplicación.
3. Cada jugador resuelve derivadas o antiderivadas y trata de mantener activo su reloj.
4. El último reloj en funcionamiento gana el duelo.

La conexión entre dispositivos es directa mediante WebRTC y no necesita un servidor de partida. Para escanear los códigos QR, el navegador solicitará permiso para utilizar la cámara.

## Jugar

<div class="cc-app-actions">
  <button id="calculusDuelFullscreen" class="btn btn--small btn--info" style="color: white;" type="button">Ver en pantalla completa</button>
</div>

{% include calculus-duel-app.html %}

## Versión de mesa

El botón **Crear tarjetas imprimibles** genera un PDF con ocho tarjetas por hoja de las familias elegidas en las opciones avanzadas: cada anverso propone una derivada y cada reverso, su integración inversa. Imprime a doble cara, volteando por el borde corto y al 100 %.


<script>
  (function () {
    var button = document.getElementById('calculusDuelFullscreen');
    var app = document.getElementById('calculusDuelApp');
    if (!button || !app) return;
    button.addEventListener('click', function () {
      if (app.requestFullscreen) app.requestFullscreen();
    });
  })();
</script>
