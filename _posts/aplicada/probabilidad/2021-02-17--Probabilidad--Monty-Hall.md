---
title:  "Simulación Monty Hall"
date:   2020-10-16 14:54:31 +0200
categories: experimento probabilidad
taxonomy: experimento probabilidad Monty-Hall intuición
permalink: /MatExp/aplicada/probabilidad/Monty-Hall/
excerpt: "Simulación del problema de Monty Hall."
---

   <style type="text/css">
      canvas { /* Just to get rid of selected text when click */
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        outline: none;
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0); /* mobile webkit */
      }
    </style>
    
<table align="center">
    <tbody>
      <tr>
        <th>
          <canvas id="myCanvas" width="600" height="400"></canvas>
        </th>
        <th>
          <p>Ganadas: <span id="win" style="color:green;"></span></p>
          <p>Perdidas: <span id="loss" style="color:red;"></span></p>
          <p>Porcentaje de ganadas: <br>
            <span id="ratio" style="font-size: 36px;"></span> 
          </p>
        </th>
      </tr>
      </tbody>
    </table>

<p align="center"><span id="status"></span></p>


El codigo empleado en este post ha sido obtenido de la simulación realizada por [Allan Inocêncio](https://github.com/allanino/monty-hall-simulation){:target="_blank"}.

   <script>
      // Variables to keep track of score
      var numWin = 0;
      var numLoss = 0;
      var ratioValue = 0;

      // Html element to write messages to player
      var stats = document.getElementById('status');
      stats.innerHTML = 'Elige una puerta';

      // Html documents to write the scores
      var win = document.getElementById('win');
      win.innerHTML = numWin;

      var loss = document.getElementById('loss');
      loss.innerHTML = numLoss;

      var ratio = document.getElementById('ratio');
      ratio.innerHTML = (ratioValue*100).toFixed(1);

      var canvas = document.getElementById('myCanvas');
      var context = canvas.getContext('2d');

      var imageOpenDoor = new Image();
      var imageCloseDoor = new Image();
      var imageCheck = new Image();
      var imageGoat = new Image();
      var imageCar = new Image();

      imageOpenDoor.src = '{{ site.baseurl }}/assets/MatExp/aplicada/probabilidad/Monty-Hall/open_door.png'
      imageCloseDoor.src = '{{ site.baseurl }}/assets/MatExp/aplicada/probabilidad/Monty-Hall/closed_door.png' 
      imageCheck.src = '{{ site.baseurl }}/assets/MatExp/aplicada/probabilidad/Monty-Hall/check.png'
      imageGoat.src = '{{ site.baseurl }}/assets/MatExp/aplicada/probabilidad/Monty-Hall/goat.png' 
      imageCar.src = '{{ site.baseurl }}/assets/MatExp/aplicada/probabilidad/Monty-Hall/car.png'

      // Random choose doors for car and goats
      var carDoor = Math.floor(Math.random() * 3); // Door with car
      var goatDoors = []; // Doors with goats
      i = -1
      while(++i < 3) {
        if (i != carDoor) {goatDoors.push(i)};
      }

      imageCloseDoor.onload = function() {
        context.drawImage(imageCloseDoor, 0,0,200, 350);
        context.drawImage(imageCloseDoor, 200,0,200, 350);
        context.drawImage(imageCloseDoor, 400,0,200, 350);
      };

    // Initialize loop variables (the loop is a click event listener)
    var doors = [false,false,false]; // Open doors
    var turn = 0; // Game state (details below)
    var check = 0; // First door choosen
    var openDoor = 0; // Door choosen after stay or switch

    canvas.addEventListener('click', function(event) {
      var rect = canvas.getBoundingClientRect();
      var x = event.pageX - rect.left;
      var y = event.pageY - rect.top;

      /* Game states (turn):
        -1: Game is finished
         0: Player chose a door
         1: Player chose to stay or switch
      */
      if(turn == -1){ // Reset game
          doors = [false,false,false];
          check = 0;
          openDoor = 0;
          carDoor = Math.floor(Math.random() * 3);
          goatDoors = [];
          i = -1
          while(++i < 3) {
            if (i != carDoor) {goatDoors.push(i)};
          }
          context.clearRect(0,0,canvas.width,canvas.height)
          context.drawImage(imageCar, carDoor*200+50,200,120, 80);
          goatDoors.forEach(function(d){
            context.drawImage(imageGoat, d*200 + 75,180,101, 100);
          });
          context.drawImage(imageCloseDoor, 0,0,200, 350);
          context.drawImage(imageCloseDoor, 200,0,200, 350);
          context.drawImage(imageCloseDoor, 400,0,200, 350);
          stats.innerHTML = '¿Otra vez? Escoge una puerta.';
          ++turn;
      } else {
        if (turn == 0){ // Check clicked door
          check = 0;
          if (x < 200 && x > 0) {check = 0;}
          if (x < 400 && x > 200) {check = 1;}
          if (x < 600 && x > 400) {check = 2;}

          openDoor = Math.floor(Math.random() * 3);
          while(openDoor == check || openDoor == carDoor){
            openDoor = Math.floor(Math.random() * 3);
          }
          doors[openDoor] = true;
          context.clearRect(0,0,canvas.width,canvas.height);
          context.drawImage(imageCar, carDoor*200+50,200,120, 80);
          goatDoors.forEach(function(d){
            context.drawImage(imageGoat, d*200 + 75,180,101, 100);
          });
          i = -1;
          while(++i < 3){
            if(!doors[i]){
              context.drawImage(imageCloseDoor, i*200,0,200, 350);
            }
            else{
              context.drawImage(imageOpenDoor, i*200-2,0,212, 370);
            }
          }
          context.drawImage(imageCheck, check*200+50,50,50,50);
          stats.innerHTML = 'Mantienes la puerta o la cambias?'
          ++turn;
        }
        else{
          if (turn > 0){ // Open final door
            open = 0;
            if (x < 200 && x > 0) {open = 0;}
            if (x < 400 && x > 200) {open = 1;}
            if (x < 600 && x > 400) {open = 2;}

            if(open == openDoor){
              return;
            }
            doors[open] = true;
            context.clearRect(0,0,canvas.width,canvas.height)
            context.drawImage(imageCar, carDoor*200+50,200,120, 80);
            goatDoors.forEach(function(d){
              context.drawImage(imageGoat, d*200 + 75,180,101, 100);
            });
            i = -1;
            while(++i < 3){
              if(!doors[i]){
                 context.drawImage(imageCloseDoor, i*200,0,200, 350);
              }
              else{
                 context.drawImage(imageOpenDoor, i*200-2,0,212, 370);
              }
            }
            context.drawImage(imageCheck, check*200+50,50,50,50);

            if(open == carDoor){
              ++numWin;
              stats.innerHTML = 'Enhorabuera!';
            }
            else {
              ++numLoss;
              stats.innerHTML = 'Has perdido...';
            }
            ratioValue = 1.0*numWin/(numWin+numLoss);

            // Update results
            win.innerHTML = numWin;
            loss.innerHTML = numLoss;
            ratio.innerHTML = (ratioValue*100).toFixed(1);

            turn = -1;
          };
        }
      }
    }, false);
    </script>