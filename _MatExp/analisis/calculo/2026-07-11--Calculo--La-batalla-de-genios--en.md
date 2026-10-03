---
title: "Calculus Cases: the battle of geniuses"
lang: en
page_id: matexp-calculus-duel
date: '2026-07-11 12:00:00 +0200'
categories:
  - experiment
  - analysis
  - calculus
  - derivatives
  - integrals
taxonomy: experiment analysis calculus derivatives integrals game Calculus-Cases
permalink: "/MatExp/analysis/calculus/duel/"
header:
  image: "/assets/MatExp/analisis/calculo/duelo/header-brand.jpg"
excerpt: "A multiplayer derivatives-and-integrals duel in which every correct answer sends the inverse operation to an opponent."
feature: "/assets/MatExp/analisis/calculo/duelo/feature.jpg"
sidebar:
  nav:
    - calculus-casebook
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/MatExp/calculus-cases/calculus-cases.css">

**The battle of geniuses** is a multiplayer game for practising derivatives and integrals and recognising that the two operations are inverses. Every participant has a clock; the last person with time remaining wins.

When a player answers correctly, they receive a time bonus and send an opponent the inverse operation. Incoming questions add a penalty that speeds up the clock until they are solved.

## How to play

1. One person creates the game and chooses its duration, number of players and function families.
2. The other players join from their devices by exchanging the QR codes shown by the application.
3. Each player solves derivatives or antiderivatives and tries to keep their clock running.
4. The last clock still running wins the duel.

Devices connect directly through WebRTC; no game server is required. The browser will request camera permission to scan QR codes.

## Play

<div class="cc-app-actions">
  <button id="calculusDuelFullscreen" class="btn btn--small btn--info" style="color: white;" type="button">View full screen</button>
</div>

{% include calculus-duel-app.html %}

## Tabletop version

The **printable cards** button creates a PDF with eight cards per sheet from the families chosen in the advanced options: each front asks for a derivative and each back for the inverse integration. Print double-sided, flipping on the short edge, at 100%.


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
