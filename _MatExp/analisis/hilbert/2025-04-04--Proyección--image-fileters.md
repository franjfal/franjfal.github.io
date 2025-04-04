---
layout: post # Or use your specific Jekyll layout (e.g., default, page)
title: "Interactive Image Filtering with Discrete Fourier Transform (DFT)"
date: 2023-10-27 # Optional: Or let Jekyll assign the date
categories: [computer-science, image-processing, web-development]
tags: [dft, fourier-transform, html5, canvas, javascript, image-filtering]
description: "Descubre cómo se pueden filtrar imágenes usando la Transformada Discreta de Fourier (DFT) con esta demostración interactiva. Sube una imagen, observa su transformación al dominio de las frecuencias, aplica distintos filtros (paso bajo, paso alto o de banda) y compara el espectro y la imagen resultante. Una forma visual de entender cómo funciona el procesamiento de imágenes y su relación con la proyección ortogonal en un espacio de Hilber."
---

<!-- 
  This Jekyll post contains the HTML structure, CSS styles, and JavaScript logic
  for an interactive DFT image filtering application.
  Original files: seminario 2.html, styles.css, script.js (modified)
-->

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Filtrado de Imágenes con DFT</title>
    <!-- <link rel="stylesheet" href="styles.css"> --><!-- Replaced by embedded styles -->
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            text-align: center;
            padding: 20px;
            margin: 0; /* Ensure no default body margin */
            line-height: 1.6; /* Improve readability */
        }

        .container {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            max-width: 1200px;
            margin: 20px auto; /* Add top/bottom margin */
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
        }

        h1, h2, h3, h4 {
             color: #333;
        }

        h1 {
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }

        h2 {
             margin-top: 30px;
             margin-bottom: 15px;
        }

        h3 {
            margin-top: 25px;
            margin-bottom: 10px;
        }

        section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
         section:last-child {
             border-bottom: none;
             margin-bottom: 0;
             padding-bottom: 0;
         }


        input[type="file"] {
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
        }

        button {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.2s ease;
        }

        button:hover {
             background-color: #0056b3;
        }

        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        select {
             padding: 8px 12px;
             border: 1px solid #ccc;
             border-radius: 4px;
             min-width: 150px;
        }

        input[type="range"] {
            width: 200px; /* Adjust as needed */
            vertical-align: middle;
        }


        #progressLog {
            background: #282c34; /* Darker background */
            color: #abb2bf; /* Softer text color */
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
            text-align: left;
            padding: 15px;
            height: 200px; /* Increased height */
            overflow-y: auto;
            border: 1px solid #444;
            border-radius: 5px; /* Rounded corners */
            margin: 20px auto; /* Center with margin */
            max-width: 95%;
            white-space: pre-wrap; /* Allow wrapping */
            word-wrap: break-word; /* Break long words */
        }

        .image-container {
            margin: 15px;
            display: inline-block;
            vertical-align: top;
            background: #fff; /* Ensure background for consistency */
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            text-align: center; /* Center canvas and title */
            min-width: 300px; /* Ensure some minimum width */
            max-width: 48%; /* Allow wrapping on smaller screens */
        }

        .image-container canvas {
            max-width: 100%;
            height: auto; /* Maintain aspect ratio */
            border: 1px solid #ccc;
            margin: 10px 0 15px 0; /* Add bottom margin */
            display: block; /* Prevent extra space below canvas */
            margin-left: auto;
            margin-right: auto;
        }

        .filter-controls {
            margin: 25px 0;
            padding: 20px;
            background: #f9f9f9; /* Lighter background */
            border: 1px solid #e0e0e0; /* Softer border */
            border-radius: 8px;
        }

        .filter-params {
            margin: 15px 0;
            display: flex; /* Align label and slider nicely */
            justify-content: center;
            align-items: center;
            gap: 15px; /* Space between label and slider */
        }

        .filter-params label {
            display: block; /* Or inline-block if preferred */
            margin: 0; /* Reset margin */
            font-weight: bold;
        }

        #filterType {
            padding: 8px;
            margin: 10px 10px 10px 0; /* Adjust margin */
        }

        /* Use flexbox for better alignment of image displays */
        .image-display, .comparison-container {
            display: flex;
            justify-content: center; /* Center items */
            align-items: flex-start; /* Align tops */
            flex-wrap: wrap;
            gap: 20px;
            margin: 20px auto;
        }

        /* Specific styles for comparison container items */
        .comparison-container .image-container {
            flex: 1 1 45%; /* Allow shrinking but prefer ~45% width */
            min-width: 280px; /* Slightly smaller min-width for flexibility */
            max-width: 550px;
            margin: 0; /* Remove margin inherited from .image-container */
        }


        .filter-explanation,
        .filter-types,
        .fourier-coefficients,
        .spectrum-explanation {
            text-align: left;
            margin: 25px auto; /* Center sections */
            padding: 20px;
            background: #f8f8f8;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid #e7e7e7;
            max-width: 95%; /* Limit width */
        }

        .filter-type-explanation {
            margin: 20px 0;
            padding: 15px;
            border-left: 5px solid #0077cc;
            background: #ffffff;
            border-radius: 0 5px 5px 0;
        }

        .filter-type-explanation h4 {
            color: #0056b3; /* Darker blue */
            margin-top: 0;
            margin-bottom: 8px;
        }

        ul {
             padding-left: 20px;
             list-style: disc; /* Standard bullets */
        }

        li {
            margin: 8px 0; /* Consistent spacing */
            line-height: 1.5;
        }

        .filter-section h3 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 8px;
            margin-top: 20px;
            margin-bottom: 15px;
        }

        .matrix-display {
            margin-top: 15px;
            text-align: left;
            max-height: 250px; /* Increased height */
            overflow: auto;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }

        .matrix-values {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px; /* Slightly smaller for density */
            white-space: pre; /* Keep formatting */
            overflow-x: auto;
            margin: 0;
            line-height: 1.3;
            color: #333;
        }

        .fourier-interpretation {
            background-color: #eaf6ff; /* Light blue background */
            padding: 12px;
            border-left: 4px solid #3498db;
            margin-top: 10px;
            font-size: 0.9em;
            border-radius: 0 4px 4px 0;
        }

        .mathematical-note {
            background-color: #fff8e1; /* Light orange background */
            border-left: 4px solid #e67e22;
            margin-top: 20px;
            padding: 15px;
            border-radius: 0 5px 5px 0;
        }

        .mathematical-note h4 {
            color: #d35400; /* Darker orange */
            margin-top: 0;
        }

        #loadingOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75); /* Slightly darker overlay */
            display: none; /* Initially hidden */
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: #333; /* Text color for inside the box */
        }

        .loading-content {
            background: white;
            padding: 30px 40px; /* More padding */
            border-radius: 8px;
            text-align: center;
            min-width: 320px; /* Slightly wider */
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }

        .loading-message {
            margin-bottom: 20px; /* More space */
            font-size: 1.3em; /* Larger text */
            font-weight: bold;
        }

        .progress-container {
            width: 100%;
            height: 25px; /* Taller bar */
            background: #e9ecef; /* Lighter grey background */
            border-radius: 13px; /* More rounded */
            overflow: hidden;
            border: 1px solid #ced4da;
        }

        .progress-bar {
            width: 0%;
            height: 100%;
            background-color: #28a745; /* Green color */
            background-image: linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
            background-size: 1rem 1rem;
            transition: width 0.4s ease-in-out; /* Smoother transition */
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 13px; /* Slightly smaller font inside bar */
            font-weight: bold;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
        }

        .spectrum-explanation h4 {
            color: #2c3e50;
            margin-top: 0;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }

        .spectrum-explanation strong {
            color: #2980b9;
            font-weight: bold;
        }

        /* Warning Message Box */
        .warning-message {
            background-color: #fff3cd;
            border: 1px solid #ffeeba; /* Use 1px border */
            color: #856404; /* Text color */
            border-left: 5px solid #ffc107; /* Accent border */
            border-radius: 4px; /* Standard radius */
            padding: 15px 20px; /* Adjust padding */
            margin: 20px auto 30px;
            text-align: left;
            max-width: 95%; /* Limit width */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .warning-message h2 {
            color: #856404; /* Match text color */
            margin-top: 0;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 10px; /* Space between icon and text */
        }

        .warning-message ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .warning-message li {
            margin: 8px 0;
            line-height: 1.5;
        }

        .warning-message strong {
            color: #665103; /* Slightly darker for emphasis */
            font-weight: bold;
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            .comparison-container, .image-display {
                flex-direction: column; /* Stack items vertically */
                align-items: center; /* Center items when stacked */
            }
            .comparison-container .image-container,
            .image-display .image-container {
                 width: 95%; /* Take more width */
                 max-width: none; /* Remove max-width constraint */
                 margin-bottom: 20px; /* Add space between stacked items */
            }
             .filter-params {
                 flex-direction: column; /* Stack label and slider */
                 align-items: center;
                 gap: 5px;
             }
            input[type="range"] {
                width: 80%;
            }
            h1 {
                font-size: 1.8em;
            }
        }

        @media (max-width: 480px) {
             body {
                 padding: 10px;
             }
             .container {
                 padding: 10px;
             }
              h1 {
                 font-size: 1.5em;
              }
              button, select, input[type="file"] {
                  font-size: 0.9em;
                  padding: 8px 10px;
              }
              .loading-content {
                  min-width: 90%;
                  padding: 20px;
              }
        }

    </style>
</head>

<body>
    <div class="container">
        <div class="warning-message">
            <h2>⚠️ Aviso Importante</h2>
            <p>Esta aplicación está diseñada con fines educativos para mostrar las implicaciones teóricas de la
                Transformada Discreta de Fourier (TDF) en el procesamiento de imágenes.</p>
            <ul>
                <li><strong>Tamaño de imagen:</strong> La imagen cargada se redimensionará automáticamente a un máximo de <strong>250x250</strong> píxeles para mejorar el rendimiento.</li>
                <li><strong>Tiempo de procesamiento:</strong> Los cálculos de DFT/IDFT pueden ser intensivos y llevar varios segundos.</li>
                <li><strong>Mensaje del navegador:</strong> Si aparece el mensaje "La página no responde", espere, los cálculos continúan en segundo plano. Puede ver el progreso en el registro.</li>
                <li><strong>Resultados:</strong> Los resultados dependen de la imagen y los parámetros del filtro. Experimente para comprender mejor. Intente usar valores de corte variados.</li>
            </ul>
        </div>

        <h1>Filtrado de Imágenes con Transformada Discreta de Fourier (DFT)</h1>

        <section class="input-section">
            <h2>Selección de Imagen</h2>
            <input type="file" id="imageFile" accept="image/*">
        </section>

        <section class="image-display">
            <div class="image-container">
                <h3>Imagen Original (Redimensionada y en Gris)</h3>
                <canvas id="originalCanvas"></canvas>
                <div class="matrix-display">
                    <h4>Valores de la Matriz (Primeros 10x10)</h4>
                    <pre id="imageMatrix" class="matrix-values"></pre>
                </div>
            </div>
        </section>

        <section class="filter-section">
            <h2>Filtros y Coeficientes de Fourier</h2>

            <div class="filter-explanation">
                <h3>¿Cómo funcionan los filtros en el dominio de la frecuencia?</h3>
                <p>La Transformada de Fourier descompone una imagen en sus componentes de frecuencia. Cada punto en el espectro de Fourier representa una frecuencia específica (rapidez del cambio de intensidad) en una dirección particular:</p>
                <ul>
                    <li><strong>Bajas frecuencias (cerca del centro del espectro):</strong> Representan cambios suaves y graduales en la imagen (áreas uniformes, brillo general).</li>
                    <li><strong>Altas frecuencias (lejos del centro del espectro):</strong> Representan cambios bruscos y detalles finos (bordes, texturas, ruido).</li>
                </ul>
                <p>El filtrado en el dominio de la frecuencia consiste en <strong>modificar (multiplicar) el espectro de Fourier</strong> de la imagen con una <strong>función de transferencia del filtro (máscara de filtro)</strong> y luego aplicar la Transformada Inversa de Fourier (IDFT) para obtener la imagen filtrada.</p>
            </div>

            <div class="filter-types">
                <h3>Tipos de Filtros Ideales:</h3>
                <p>(Estos son filtros ideales con cortes abruptos, usados aquí con fines demostrativos)</p>

                <div class="filter-type-explanation">
                    <h4>Filtro Paso Bajo (LPF)</h4>
                    <p>Conserva las frecuencias bajas y elimina (pone a cero) las altas frecuencias por encima de una frecuencia de corte (D₀).</p>
                    <ul>
                        <li>Suaviza la imagen (efecto de desenfoque).</li>
                        <li>Reduce el ruido de alta frecuencia.</li>
                        <li>Elimina detalles finos y texturas.</li>
                    </ul>
                    <p class="fourier-interpretation">
                        <strong>Máscara de Filtro:</strong> Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro ≤ D₀) se mantienen (multiplican por 1), y los de fuera se anulan (multiplican por 0).
                    </p>
                </div>

                <div class="filter-type-explanation">
                    <h4>Filtro Paso Alto (HPF)</h4>
                     <p>Conserva las frecuencias altas y elimina (pone a cero) las bajas frecuencias por debajo de una frecuencia de corte (D₀).</p>
                    <ul>
                        <li>Resalta los bordes y detalles finos.</li>
                        <li>Atenúa las variaciones suaves (componente de baja frecuencia).</li>
                        <li>Puede amplificar el ruido.</li>
                    </ul>
                     <p class="fourier-interpretation">
                        <strong>Máscara de Filtro:</strong> Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro < D₀) se anulan (multiplican por 0), y los de fuera se mantienen (multiplican por 1).
                    </p>
                </div>

                <div class="filter-type-explanation">
                    <h4>Filtro Paso Banda (BPF)</h4>
                     <p>Conserva un rango específico de frecuencias entre un límite inferior y superior (o centrado en D₀ con un cierto ancho).</p>
                    <ul>
                        <li>Permite aislar características o texturas de un tamaño específico.</li>
                        <li>Elimina tanto las frecuencias muy bajas como las muy altas.</li>
                    </ul>
                     <p class="fourier-interpretation">
                        <strong>Máscara de Filtro:</strong> Se crea una máscara en forma de anillo en el espectro centrado. Los coeficientes dentro del anillo (distancia al centro entre D₁ y D₂) se mantienen (multiplican por 1), y los demás se anulan (multiplican por 0).
                    </p>
                </div>

                <div class="filter-type-explanation mathematical-note">
                    <h4>Nota sobre los Coeficientes DFT</h4>
                    <p>Cada punto (k, l) en el espectro DFT 2D, F(k, l), es un número complejo:</p>
                    <ul>
                        <li><strong>Magnitud |F(k, l)|:</strong> Indica la "cantidad" o importancia de la componente de frecuencia (k, l) en la imagen. El brillo en la visualización del espectro representa la magnitud (generalmente en escala logarítmica).</li>
                        <li><strong>Fase ∠F(k, l):</strong> Indica el desplazamiento espacial de esa componente de frecuencia. Es crucial para la reconstrucción correcta de la imagen.</li>
                        <li><strong>Distancia al centro:</strong> En el espectro *centrado*, la distancia desde el punto (k, l) al centro es proporcional a la frecuencia espacial radial.</li>
                        <li><strong>F(0, 0):</strong> El coeficiente en el origen (antes de centrar) representa la componente DC (frecuencia cero), relacionada con el brillo promedio de la imagen. Es el punto más brillante en el centro del espectro *centrado*.</li>
                    </ul>
                </div>
            </div>


            <div class="filter-controls">
                <h3>Controles del Filtro</h3>
                <select id="filterType">
                    <option value="lowpass">Paso Bajo</option>
                    <option value="highpass">Paso Alto</option>
                    <option value="bandpass">Paso Banda</option>
                </select>
                <div class="filter-params">
                    <label for="cutoffFreq">Frecuencia de Corte Relativa (%):</label>
                    <input type="range" id="cutoffFreq" name="cutoffFreq" min="1" max="99" value="50">
                    <span id="cutoffValue">50%</span> <!-- To display the value -->
                </div>
                <button id="applyFilter">Aplicar Filtro y Calcular IDFT</button>
            </div>
        </section>

         <section class="spectrum-section">
             <h2>Espectro de Frecuencia (Magnitud DFT)</h2>
             <div class="comparison-container">
                 <div class="image-container">
                     <h3>Espectro Original (Centrado, Log)</h3>
                     <canvas id="originalSpectrumCanvas"></canvas>
                 </div>
                 <div class="image-container">
                     <h3>Espectro Filtrado (Centrado, Log)</h3>
                     <canvas id="filteredSpectrumCanvas"></canvas>
                 </div>
             </div>
             <div class="spectrum-explanation">
                 <h4>Interpretación del Espectro de Frecuencia (Visualización Centrada)</h4>
                 <p>El espectro mostrado es una representación visual de la <strong>magnitud</strong> de los coeficientes de la DFT, con la frecuencia cero (DC) desplazada al centro y usando una escala logarítmica para mejorar la visibilidad:</p>
                 <ul>
                     <li><strong>Centro del espectro (punto más brillante):</strong>
                         <ul>
                             <li>Representa la componente DC (frecuencia cero), relacionada con el brillo promedio de la imagen.</li>
                             <li>Las frecuencias <strong>más bajas</strong> (cambios lentos) están más cerca del centro.</li>
                         </ul>
                     </li>
                     <li><strong>Bordes del espectro:</strong>
                         <ul>
                             <li>Representan las frecuencias <strong>más altas</strong> (cambios rápidos, detalles finos, bordes).</li>
                         </ul>
                     </li>
                     <li><strong>Dirección desde el centro:</strong>
                         <ul>
                             <li>Indica la orientación de los patrones en la imagen.</li>
                             <li>Puntos brillantes a lo largo del eje vertical indican patrones predominantemente horizontales en la imagen.</li>
                             <li>Puntos brillantes a lo largo del eje horizontal indican patrones predominantemente verticales en la imagen.</li>
                             <li>Puntos brillantes en diagonal indican patrones diagonales.</li>
                         </ul>
                     </li>
                     <li><strong>Brillo en el espectro:</strong>
                          <ul>
                              <li>Mayor brillo = Mayor magnitud = Mayor presencia de esa frecuencia/orientación específica en la imagen.</li>
                              <li>La <strong>escala logarítmica</strong> (log(1 + magnitud)) comprime los valores altos y realza los bajos, haciendo visibles más detalles del espectro.</li>
                              <li>El espectro de magnitud es <strong>simétrico</strong> respecto al centro para imágenes reales.</li>
                          </ul>
                     </li>
                 </ul>
             </div>
              <div class="matrix-display">
                 <h4>Coeficientes DFT (Magnitud, Primeros 10x10, No Centrado)</h4>
                 <pre id="fourierMatrix" class="matrix-values"></pre>
             </div>
         </section>

        <section class="result-section">
             <h2>Resultados del Filtrado</h2>
            <div class="comparison-container">
                <div class="image-container">
                    <h3>Imagen Original (Gris)</h3>
                    <canvas id="resultOriginalCanvas"></canvas>
                </div>
                <div class="image-container">
                    <h3>Imagen Filtrada (IDFT)</h3>
                    <canvas id="filteredCanvas"></canvas>
                    <div class="matrix-display">
                        <h4>Valores de la Matriz Filtrada (Primeros 10x10)</h4>
                        <pre id="filteredMatrix" class="matrix-values"></pre>
                    </div>
                </div>
            </div>
        </section>


        <section class="log-section">
            <h2>Registro de Progreso</h2>
            <div id="progressLog" class="log"></div>
        </section>
    </div>

    <!-- Loading Overlay Structure (initially hidden) -->
    <div id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-message">Procesando...</div>
            <div class="progress-container">
                <div class="progress-bar">0%</div>
            </div>
        </div>
    </div>

    <!-- Embedded JavaScript -->
    <!-- <script src="script.js"></script> --><!-- Replaced by embedded script -->
    <script>
        // Complex number handling
        class Complex {
            constructor(real, imag) {
                this.real = real;
                this.imag = imag;
            }

            magnitude() {
                // Avoid potential overflow for large numbers? Maybe not needed here.
                return Math.sqrt(this.real * this.real + this.imag * this.imag);
            }
            // magnitudeSquared() { // Sometimes useful, avoids sqrt
            //     return this.real * this.real + this.imag * this.imag;
            // }

            add(complex) {
                return new Complex(this.real + complex.real, this.imag + complex.imag);
            }

            subtract(complex) {
                return new Complex(this.real - complex.real, this.imag - complex.imag);
            }

            multiply(complex) {
                const realPart = (this.real * complex.real) - (this.imag * complex.imag);
                const imaginaryPart = (this.real * complex.imag) + (this.imag * complex.real);
                return new Complex(realPart, imaginaryPart);
            }
             // For DFT calculation
             multiplyScalar(scalar) {
                 return new Complex(this.real * scalar, this.imag * scalar);
             }
        }

        // --- Global State ---
        window.currentSpectrum = null;
        window.currentImageData = null; // Store the grayscale, resized image data

        // --- DOM Element References ---
        const imageFileInput = document.getElementById('imageFile');
        const applyFilterButton = document.getElementById('applyFilter');
        const originalCanvas = document.getElementById('originalCanvas');
        const resultOriginalCanvas = document.getElementById('resultOriginalCanvas');
        const filteredCanvas = document.getElementById('filteredCanvas');
        const originalSpectrumCanvas = document.getElementById('originalSpectrumCanvas');
        const filteredSpectrumCanvas = document.getElementById('filteredSpectrumCanvas');
        const imageMatrixDiv = document.getElementById('imageMatrix');
        const fourierMatrixDiv = document.getElementById('fourierMatrix');
        const filteredMatrixDiv = document.getElementById('filteredMatrix');
        const progressLogDiv = document.getElementById('progressLog');
        const filterTypeSelect = document.getElementById('filterType');
        const cutoffFreqSlider = document.getElementById('cutoffFreq');
        const cutoffValueSpan = document.getElementById('cutoffValue');

        // --- Utility Functions ---

        function logProgress(message) {
            if (progressLogDiv) {
                const timestamp = new Date().toLocaleTimeString();
                progressLogDiv.innerHTML += `[${timestamp}] ${message}\n`; // Use innerHTML for newline
                progressLogDiv.scrollTop = progressLogDiv.scrollHeight; // Auto-scroll
            } else {
                console.log(`[Log] ${message}`); // Fallback
            }
        }

        // Create loading overlay dynamically if it doesn't exist (though it's in HTML now)
        function createLoadingOverlay() {
            let overlay = document.getElementById('loadingOverlay');
            if (!overlay) {
                 logProgress("Creating loading overlay dynamically.");
                 overlay = document.createElement('div');
                 overlay.id = 'loadingOverlay';
                 overlay.style.position = 'fixed';
                 overlay.style.top = '0';
                 overlay.style.left = '0';
                 overlay.style.width = '100%';
                 overlay.style.height = '100%';
                 overlay.style.background = 'rgba(0, 0, 0, 0.75)';
                 overlay.style.display = 'none'; // Initially hidden
                 overlay.style.justifyContent = 'center';
                 overlay.style.alignItems = 'center';
                 overlay.style.zIndex = '1000';
                 overlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-message">Procesando...</div>
                        <div class="progress-container">
                            <div class="progress-bar">0%</div>
                        </div>
                    </div>
                `;
                 document.body.appendChild(overlay);
            }
            return overlay;
        }
        const loadingOverlay = createLoadingOverlay(); // Ensure it exists

        function showLoadingOverlay(message = "Procesando...") {
             const msgElement = loadingOverlay.querySelector('.loading-message');
             const progressBar = loadingOverlay.querySelector('.progress-bar');
             if(msgElement) msgElement.textContent = message;
             if(progressBar) {
                progressBar.style.width = '0%';
                progressBar.textContent = '0%';
             }
             loadingOverlay.style.display = 'flex';
        }

        function hideLoadingOverlay() {
             loadingOverlay.style.display = 'none';
        }

        function updateProgress(percentage) {
            const progressBar = loadingOverlay.querySelector('.progress-bar');
            if (progressBar) {
                const roundedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
                progressBar.style.width = `${roundedPercentage}%`;
                progressBar.textContent = `${roundedPercentage}%`;
            }
        }

        // Helper function for chunked processing to prevent UI freezing
        async function processInChunks(total, chunkSize, taskFunction) {
            const numChunks = Math.ceil(total / chunkSize);
            logProgress(`Starting task in ${numChunks} chunks (size: ${chunkSize})...`);
            for (let i = 0; i < numChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, total);
                // Execute the task for the current chunk
                taskFunction(start, end);
                // Update progress
                const progress = ((i + 1) / numChunks) * 100;
                updateProgress(progress);
                // Yield control to the event loop briefly
                await new Promise(resolve => setTimeout(resolve, 0));
            }
             logProgress(`Task finished.`);
        }

        // Center the spectrum (DC component at the center)
        function fftShift(spectrum) {
            const height = spectrum.length;
            if (height === 0) return [];
            const width = spectrum[0].length;
            const shiftedSpectrum = Array(height).fill(null).map(() => Array(width));

            const cy = Math.floor(height / 2);
            const cx = Math.floor(width / 2);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const ny = (y + cy) % height;
                    const nx = (x + cx) % width;
                    shiftedSpectrum[ny][nx] = spectrum[y][x];
                }
            }
            return shiftedSpectrum;
        }

        // Undo the centering
        function ifftShift(shiftedSpectrum) {
            const height = shiftedSpectrum.length;
             if (height === 0) return [];
            const width = shiftedSpectrum[0].length;
            const spectrum = Array(height).fill(null).map(() => Array(width));

            const cy = Math.floor(height / 2);
            const cx = Math.floor(width / 2);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // Calculate original coordinates *before* shift
                    const oy = (y - cy + height) % height;
                    const ox = (x - cx + width) % width;
                    spectrum[oy][ox] = shiftedSpectrum[y][x];
                }
            }
            return spectrum;
        }


        // --- Core DFT/IDFT Functions ---

        async function calculate2DDFT(imageData) {
            const width = imageData.width;
            const height = imageData.height;
            logProgress(`Starting DFT for ${width}x${height} image... This may take a while.`);
            showLoadingOverlay(`Calculando DFT (${width}x${height})...`);

            // Initialize spectrum with Complex zeros
            const spectrum = Array(height).fill(null).map(() =>
                Array(width).fill(null).map(() => new Complex(0, 0))
            );

            const chunkSize = Math.max(1, Math.floor(height / 20)); // Smaller chunks for DFT

            await processInChunks(height, chunkSize, (startK, endK) => {
                // Outer loops: iterate over frequency domain coordinates (k, l) or (v, u)
                for (let k = startK; k < endK; k++) { // Frequency row (v)
                    for (let l = 0; l < width; l++) { // Frequency column (u)
                        let realSum = 0;
                        let imagSum = 0;
                        // Inner loops: iterate over spatial domain coordinates (m, n) or (y, x)
                        for (let m = 0; m < height; m++) { // Image row (y)
                            for (let n = 0; n < width; n++) { // Image column (x)
                                const pixelIndex = (m * width + n) * 4;
                                const pixelValue = imageData.data[pixelIndex]; // Use Red channel (grayscale)
                                const angle = 2 * Math.PI * ((k * m / height) + (l * n / width));
                                const cosAngle = Math.cos(angle);
                                const sinAngle = Math.sin(angle);

                                realSum += pixelValue * cosAngle;
                                imagSum -= pixelValue * sinAngle; // Standard DFT definition
                            }
                        }
                        spectrum[k][l] = new Complex(realSum, imagSum);
                    }
                 }
                 // Log progress within the chunk processing if needed
                 // logProgress(`DFT: Processed frequency rows ${startK} to ${endK-1}`);
            });

            logProgress("DFT calculation finished.");
            // hideLoadingOverlay(); // Keep overlay for potential subsequent steps
            return spectrum;
        }

        async function calculate2DIDFT(spectrum) {
             const height = spectrum.length;
             if (height === 0) return new Uint8ClampedArray(0);
             const width = spectrum[0].length;
             logProgress(`Starting IDFT for ${width}x${height} spectrum...`);
             showLoadingOverlay(`Calculando IDFT (${width}x${height})...`);

             const resultData = new Uint8ClampedArray(width * height * 4);
             const spatialDomainValues = Array(height).fill(null).map(() => Array(width).fill(0)); // Store real part temporarily
             const N = width * height; // Normalization factor

             let minVal = Infinity;
             let maxVal = -Infinity;

             const chunkSize = Math.max(1, Math.floor(height / 15)); // Adjust chunk size as needed

             await processInChunks(height, chunkSize, (startX, endX) => {
                 // Outer loops: iterate over spatial domain coordinates (x, y)
                 for (let x = startX; x < endX; x++) { // Image row (y in math)
                     for (let y = 0; y < width; y++) { // Image column (x in math)
                         let sumReal = 0;
                         let sumImag = 0; // We only need the real part for intensity

                         // Inner loops: iterate over frequency domain coordinates (k, l)
                         for (let k = 0; k < height; k++) { // Frequency row (v)
                             for (let l = 0; l < width; l++) { // Frequency column (u)
                                 const angle = 2 * Math.PI * ((k * x / height) + (l * y / width));
                                 const cosAngle = Math.cos(angle);
                                 const sinAngle = Math.sin(angle);
                                 const specVal = spectrum[k][l];

                                 // Complex multiplication: (spec.real + i*spec.imag) * (cos + i*sin)
                                 sumReal += (specVal.real * cosAngle - specVal.imag * sinAngle);
                                 // sumImag += (specVal.real * sinAngle + specVal.imag * cosAngle); // Imaginary part not usually needed for display
                             }
                         }
                         const realValue = sumReal / N; // Normalize
                         spatialDomainValues[x][y] = realValue;

                         // Track min/max for normalization later
                         if (realValue < minVal) minVal = realValue;
                         if (realValue > maxVal) maxVal = realValue;
                     }
                 }
                // logProgress(`IDFT: Processed spatial rows ${startX} to ${endX-1}`);
             });

             logProgress(`IDFT calculation finished. Normalizing values (Min: ${minVal.toFixed(2)}, Max: ${maxVal.toFixed(2)})...`);
             updateProgress(95); // Indicate near completion before normalization loop

             // --- Normalization and Pixel Assignment ---
             const range = maxVal - minVal;
             const hasRange = range > 1e-6; // Check if range is significant to avoid division by zero

             for (let x = 0; x < height; x++) {
                 for (let y = 0; y < width; y++) {
                     const value = spatialDomainValues[x][y];
                     let normalizedValue = 0;

                     if (hasRange) {
                         normalizedValue = Math.round(255 * (value - minVal) / range);
                     } else {
                         // Handle case of uniform image (range is near zero)
                         normalizedValue = Math.round(minVal); // Or maxVal, should be the same
                     }

                     // Clamp to [0, 255]
                     const clampedValue = Math.max(0, Math.min(255, normalizedValue));

                     const pixelIndex = (x * width + y) * 4;
                     resultData[pixelIndex] = clampedValue;     // R
                     resultData[pixelIndex + 1] = clampedValue; // G (grayscale)
                     resultData[pixelIndex + 2] = clampedValue; // B (grayscale)
                     resultData[pixelIndex + 3] = 255;           // Alpha (fully opaque)
                 }
             }
             updateProgress(100);
             logProgress("Normalization and pixel assignment finished.");
             hideLoadingOverlay(); // Hide after IDFT and normalization
             return resultData;
        }


        // --- Filtering Logic ---

        function applyFilter(spectrum, type, cutoffRatio) {
             const height = spectrum.length;
             if (height === 0) return [];
             const width = spectrum[0].length;
             logProgress(`Applying ${type} filter with cutoff ${cutoffRatio.toFixed(2)}...`);

             const shiftedSpectrum = fftShift(spectrum); // Work with centered spectrum
             const filteredShiftedSpectrum = Array(height).fill(null).map(() => Array(width));

             const centerY = Math.floor(height / 2);
             const centerX = Math.floor(width / 2);
             // Use the distance to the furthest corner as max distance for normalization
             const maxDist = Math.sqrt(centerY * centerY + centerX * centerX);
             const cutoffDist = cutoffRatio * maxDist; // Absolute distance cutoff

             for (let y = 0; y < height; y++) {
                 for (let x = 0; x < width; x++) {
                     const distance = Math.sqrt(Math.pow(y - centerY, 2) + Math.pow(x - centerX, 2));
                     let filterMaskValue = 0; // 0 = block, 1 = pass

                     switch (type) {
                         case 'lowpass':
                             filterMaskValue = (distance <= cutoffDist) ? 1 : 0;
                             break;
                         case 'highpass':
                             filterMaskValue = (distance >= cutoffDist) ? 1 : 0;
                              // Optional: Ensure DC is always blocked in HPF? Sometimes done.
                              // if (y === centerY && x === centerX) filterMaskValue = 0;
                             break;
                         case 'bandpass':
                             const bandWidthRatio = 0.15; // Relative width (e.g., 15% of maxDist)
                             const bandWidth = bandWidthRatio * maxDist;
                             const lowerBound = cutoffDist - bandWidth / 2;
                             const upperBound = cutoffDist + bandWidth / 2;
                             filterMaskValue = (distance >= lowerBound && distance <= upperBound) ? 1 : 0;
                             break;
                         default:
                             filterMaskValue = 1; // Pass all if unknown filter
                     }

                     // Apply the mask (multiply by 0 or 1)
                     if (filterMaskValue === 1) {
                         filteredShiftedSpectrum[y][x] = shiftedSpectrum[y][x]; // Keep original value
                     } else {
                         filteredShiftedSpectrum[y][x] = new Complex(0, 0); // Zero out
                     }
                 }
             }

             const filteredSpectrum = ifftShift(filteredShiftedSpectrum); // Shift back to original format
             logProgress("Filter mask applied to spectrum.");
             return filteredSpectrum;
        }

        // --- Display Functions ---

        function displayImageOnCanvas(canvasElement, imageData) {
             if (!canvasElement || !imageData) return;
             canvasElement.width = imageData.width;
             canvasElement.height = imageData.height;
             const ctx = canvasElement.getContext('2d');
             ctx.putImageData(imageData, 0, 0);
        }

        function displayGrayscaleImageOnCanvas(canvasElement, width, height, pixelData) {
            if (!canvasElement || !pixelData) return;
            canvasElement.width = width;
            canvasElement.height = height;
            const ctx = canvasElement.getContext('2d');
            const imageData = ctx.createImageData(width, height);
            imageData.data.set(pixelData); // Assumes pixelData is Uint8ClampedArray RGBA
            ctx.putImageData(imageData, 0, 0);
        }


        function displayMatrixValues(element, data, width, height, label, isComplex = false) {
            if (!element) {
                console.error("Matrix display element not found for:", label);
                return;
            }
            const displayRows = Math.min(10, height);
            const displayCols = Math.min(10, width);
            if(displayRows <= 0 || displayCols <= 0) {
                element.textContent = `${label}: No data to display.`;
                return;
            }

            let matrixText = `${label} (${displayRows}x${displayCols}):\n`;
            const colWidth = isComplex ? 10 : 5; // Adjust padding width
            matrixText += '-'.repeat(displayCols * colWidth) + '\n';

            for (let y = 0; y < displayRows; y++) {
                let rowText = '';
                for (let x = 0; x < displayCols; x++) {
                    let valueStr = '';
                    if (isComplex) {
                        const complexVal = data[y][x];
                        const magnitude = complexVal.magnitude();
                        valueStr = magnitude.toFixed(2).padStart(colWidth -1); // Display magnitude
                    } else {
                        const pixelIndex = (y * width + x) * 4;
                        const value = data[pixelIndex]; // Grayscale value from R channel
                        valueStr = String(value).padStart(colWidth - 1);
                    }
                    rowText += valueStr + ' ';
                }
                matrixText += rowText.trim() + '\n';
            }
            matrixText += '-'.repeat(displayCols * colWidth);
            element.textContent = matrixText;
        }

        function displaySpectrum(canvasElement, spectrum) {
             if (!canvasElement || !spectrum || spectrum.length === 0 || spectrum[0].length === 0) {
                 logProgress("Cannot display spectrum: Invalid canvas or spectrum data.");
                 // Optionally clear the canvas
                  if(canvasElement) {
                       const ctx = canvasElement.getContext('2d');
                       ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                       canvasElement.width = 0;
                       canvasElement.height = 0;
                  }
                 return;
             }

             const height = spectrum.length;
             const width = spectrum[0].length;
             canvasElement.width = width;
             canvasElement.height = height;
             const ctx = canvasElement.getContext('2d');
             const imageData = ctx.createImageData(width, height);

             const shiftedSpectrum = fftShift(spectrum); // Center for visualization

             // Find max log magnitude for normalization
             let maxLogMag = 0;
             for (let y = 0; y < height; y++) {
                 for (let x = 0; x < width; x++) {
                     const logMag = Math.log(1 + shiftedSpectrum[y][x].magnitude());
                     if (logMag > maxLogMag) maxLogMag = logMag;
                 }
             }
             const normalizationFactor = maxLogMag > 1e-6 ? 255 / maxLogMag : 255; // Avoid div by zero

             // Draw pixels
             for (let y = 0; y < height; y++) {
                 for (let x = 0; x < width; x++) {
                     const logMag = Math.log(1 + shiftedSpectrum[y][x].magnitude());
                     const pixelValue = Math.min(255, Math.round(logMag * normalizationFactor));
                     const idx = (y * width + x) * 4;
                     imageData.data[idx] = pixelValue;     // R
                     imageData.data[idx + 1] = pixelValue; // G
                     imageData.data[idx + 2] = pixelValue; // B
                     imageData.data[idx + 3] = 255;        // Alpha
                 }
             }
             ctx.putImageData(imageData, 0, 0);
             logProgress(`Displayed spectrum on canvas: ${canvasElement.id}`);
        }

        function explainSpectrumChanges(filterType, cutoffRatio) {
            let explanation = "--- Cambios Aplicados al Espectro ---\n";
            const cutoffPercent = (cutoffRatio * 100).toFixed(1);
            explanation += `Tipo: ${filterType}, Corte: ${cutoffPercent}% de frec. máx.\n`;
            switch (filterType) {
                case 'lowpass':
                    explanation += "Acción: Atenúa/elimina frecuencias ALTAS (bordes del espectro centrado).\n";
                    explanation += "Efecto Esperado: Espectro más oscuro hacia los bordes.\n";
                    break;
                case 'highpass':
                     explanation += "Acción: Atenúa/elimina frecuencias BAJAS (centro del espectro centrado).\n";
                     explanation += "Efecto Esperado: Espectro más oscuro en el centro (excepto quizás DC si no se bloquea).\n";
                    break;
                case 'bandpass':
                     const bandWidthPercent = (0.15 * 100).toFixed(1); // Match applyFilter width
                     explanation += `Acción: Conserva un anillo de frecuencias (ancho ~${bandWidthPercent}%).\n`;
                     explanation += "Efecto Esperado: Solo un anillo brillante visible en el espectro.\n";
                    break;
                default:
                     explanation += "Acción: Desconocida.\n"; break;
            }
            explanation += "-------------------------------------\n";
            logProgress(explanation);
        }

        function clearOutputAreas() {
             logProgress("Clearing previous output areas...");
            [resultOriginalCanvas, filteredCanvas, originalSpectrumCanvas, filteredSpectrumCanvas].forEach(canvas => {
                if(canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Resetting dimensions can visually confirm clearing
                    canvas.width = 1; canvas.height = 1; // Minimal size
                }
             });
             if(filteredMatrixDiv) filteredMatrixDiv.textContent = 'N/A';
             // Keep original spectrum matrix? Maybe clear it too.
             // if(fourierMatrixDiv) fourierMatrixDiv.textContent = 'N/A';
              logProgress("Output areas cleared.");
        }

        // --- Event Handlers ---

        async function handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) {
                logProgress("No file selected.");
                return;
            }
             if (!file.type.startsWith('image/')) {
                  logProgress(`Error: Selected file (${file.name}) is not an image.`);
                  alert("Por favor, seleccione un archivo de imagen válido.");
                  imageFileInput.value = ''; // Reset file input
                  return;
             }

            logProgress(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
            showLoadingOverlay("Cargando y procesando imagen...");
            clearOutputAreas(); // Clear previous results on new upload
            window.currentSpectrum = null; // Reset spectrum state
            window.currentImageData = null;

            const reader = new FileReader();

            reader.onload = function (e) {
                const img = new Image();
                img.onload = async function () { // Needs to be async for DFT
                    logProgress("Image loaded into memory. Resizing and converting...");

                    const tempCanvas = document.createElement('canvas'); // Use temporary canvas for processing
                    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

                    // --- Image Resizing ---
                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    const maxSize = 250;
                    let newWidth = originalWidth;
                    let newHeight = originalHeight;

                    if (originalWidth > maxSize || originalHeight > maxSize) {
                         logProgress(`Resizing from ${originalWidth}x${originalHeight} to max ${maxSize}px.`);
                        if (originalWidth > originalHeight) {
                            newWidth = maxSize;
                            newHeight = Math.round((originalHeight * maxSize) / originalWidth);
                        } else {
                            newHeight = maxSize;
                            newWidth = Math.round((originalWidth * maxSize) / originalHeight);
                        }
                        logProgress(`New dimensions: ${newWidth}x${newHeight}.`);
                    } else {
                        logProgress(`Dimensions ${originalWidth}x${originalHeight} within limit.`);
                    }

                    // Set temporary canvas size and draw scaled image
                    tempCanvas.width = newWidth;
                    tempCanvas.height = newHeight;
                    tempCtx.drawImage(img, 0, 0, newWidth, newHeight);

                    // --- Grayscale Conversion ---
                    const imageData = tempCtx.getImageData(0, 0, newWidth, newHeight);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        // Using luminance-preserving coefficients (more accurate than simple average)
                         const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        // const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // Simple average
                        data[i] = avg;     // Red
                        data[i + 1] = avg; // Green
                        data[i + 2] = avg; // Blue
                        // Alpha (data[i + 3]) remains unchanged (usually 255)
                    }
                    logProgress("Image resized and converted to grayscale.");

                    // Display the processed image on the main original canvas
                    displayImageOnCanvas(originalCanvas, imageData);
                    window.currentImageData = imageData; // Store for later use

                    // Display matrix for the processed image
                    displayMatrixValues(imageMatrixDiv, imageData.data, newWidth, newHeight, 'Imagen Original (Gris)');

                    try {
                         // --- Calculate DFT ---
                         const spectrum = await calculate2DDFT(imageData);
                         window.currentSpectrum = spectrum; // Store globally

                         // Display original spectrum and its matrix
                         displaySpectrum(originalSpectrumCanvas, spectrum);
                         displayMatrixValues(fourierMatrixDiv, spectrum, newWidth, newHeight, 'Magnitud DFT', true);

                         applyFilterButton.disabled = false; // Enable filter button
                         logProgress("DFT calculado. Listo para aplicar filtros.");

                    } catch (error) {
                        logProgress("Error during DFT calculation: " + error);
                        console.error("DFT Error:", error);
                        alert("Ocurrió un error calculando la DFT. Ver la consola para detalles.");
                        applyFilterButton.disabled = true;
                    } finally {
                         hideLoadingOverlay(); // Hide after initial processing & DFT
                    }
                }; // img.onload end

                img.onerror = function () {
                    logProgress("Error loading image data from source.");
                    alert("No se pudo cargar la imagen. Intente con otro archivo.");
                    hideLoadingOverlay();
                    imageFileInput.value = ''; // Reset file input
                     applyFilterButton.disabled = true;
                };

                img.src = e.target.result; // Trigger img.onload
            }; // reader.onload end

            reader.onerror = function () {
                logProgress("Error reading file.");
                alert("No se pudo leer el archivo seleccionado.");
                hideLoadingOverlay();
                imageFileInput.value = ''; // Reset file input
                 applyFilterButton.disabled = true;
            };

            reader.readAsDataURL(file); // Start reading the file
        }


        async function handleFilter() {
             if (!window.currentSpectrum || !window.currentImageData) {
                 logProgress("Error: Datos de imagen o espectro no disponibles. Cargue una imagen primero.");
                 alert("Por favor, cargue una imagen antes de aplicar un filtro.");
                 return;
             }

             logProgress("--- Iniciando Proceso de Filtrado ---");
             showLoadingOverlay("Aplicando filtro y calculando IDFT...");
             applyFilterButton.disabled = true; // Disable during processing

             const spectrum = window.currentSpectrum;
             const originalImageData = window.currentImageData;
             const width = originalImageData.width;
             const height = originalImageData.height;

             try {
                 const filterType = filterTypeSelect.value;
                 const cutoffRatio = cutoffFreqSlider.value / 100; // Normalize 0-100 to 0-1

                 // --- Apply Filter ---
                 const filteredSpectrum = applyFilter(spectrum, filterType, cutoffRatio);

                 // Display filtered spectrum
                 displaySpectrum(filteredSpectrumCanvas, filteredSpectrum);
                 explainSpectrumChanges(filterType, cutoffRatio); // Log explanation

                 // --- Calculate Inverse DFT ---
                 const filteredPixelData = await calculate2DIDFT(filteredSpectrum);

                 // --- Display Results ---
                 // Original (grayscale, resized) image for comparison
                 displayImageOnCanvas(resultOriginalCanvas, originalImageData);

                 // Filtered image
                 displayGrayscaleImageOnCanvas(filteredCanvas, width, height, filteredPixelData);

                 // Filtered matrix values
                 displayMatrixValues(filteredMatrixDiv, filteredPixelData, width, height, 'Imagen Filtrada');

                 logProgress("Filtro aplicado e IDFT calculada con éxito.");

             } catch (error) {
                 logProgress("Error durante el filtrado o IDFT: " + error.message);
                 console.error("Filter/IDFT Error:", error);
                 alert("Ocurrió un error durante el proceso de filtrado. Verifique el registro.");
             } finally {
                 hideLoadingOverlay(); // Hide overlay when done
                 applyFilterButton.disabled = false; // Re-enable button
                  logProgress("--- Proceso de Filtrado Terminado ---");
             }
        }


        // --- Initial Setup ---

        // Slider value display
        cutoffFreqSlider.addEventListener('input', () => {
            cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`;
        });

        // Main event listeners
        imageFileInput.addEventListener('change', handleImageUpload);
        applyFilterButton.addEventListener('click', handleFilter);

        // Initial state
        applyFilterButton.disabled = true; // Disabled until image is loaded
        logProgress("Aplicación inicializada. Esperando carga de imagen.");
        logProgress("Nota: La imagen se redimensionará a máx 250px y se convertirá a escala de grises.");
        clearOutputAreas(); // Ensure clean state on load


    </script>
</body>

</html>