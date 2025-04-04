---
layout: post # Or use your specific Jekyll layout (e.g., default, page)
title: "Interactive Image Filtering with Discrete Fourier Transform (DFT)"
date: 2023-10-27 # Optional: Or let Jekyll assign the date
categories: [computer-science, image-processing, web-development]
tags: [dft, fourier-transform, html5, canvas, javascript, image-filtering]
description: "Descubre cómo se pueden filtrar imágenes usando la Transformada Discreta de Fourier (DFT) con esta demostración interactiva. Sube una imagen, observa su transformación al dominio de las frecuencias, aplica distintos filtros (paso bajo, paso alto o de banda) y compara el espectro y la imagen resultante. Una forma visual de entender cómo funciona el procesamiento de imágenes y su relación con la proyección ortogonal en un espacio de Hilber."
---

<!-- Embedded CSS -->
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

    h1 { /* Style for Markdown H1 */
        margin-bottom: 30px;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
        text-align: center; /* Ensure H1 is centered */
    }

    h2 { /* Style for Markdown H2 */
         margin-top: 30px;
         margin-bottom: 15px;
         text-align: center; /* Center section titles */
    }

    h3 { /* Style for Markdown H3 */
        margin-top: 25px;
        margin-bottom: 10px;
        text-align: center; /* Center sub-section titles */
    }
     /* Style for Markdown H4 inside specific divs */
    .filter-type-explanation h4,
    .mathematical-note h4,
    .spectrum-explanation h4,
    .matrix-display h4 {
        margin-top: 0;
        margin-bottom: 8px;
        text-align: left; /* Align these specific H4s left */
    }
     .filter-type-explanation h4 { color: #0056b3; }
     .mathematical-note h4 { color: #d35400; }
     .spectrum-explanation h4 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-bottom: 15px; }
     .matrix-display h4 { color: #555; font-size: 1em; margin-bottom: 5px;}


    section { /* Add spacing below sections, which are now implicit in Markdown */
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
    }
     section:last-child { /* Remove border from last implicit section */
         border-bottom: none;
         margin-bottom: 0;
         padding-bottom: 0;
     }


    input[type="file"] {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        display: block; /* Make it block level for centering */
        margin: 15px auto; /* Center the file input */
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
        margin: 10px; /* Add some margin */
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
         margin: 10px;
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

    /* Containers for images/canvases need to remain divs for layout */
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
        /* H3 inside image-container is handled by the general H3 style */
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

    /* Controls section needs to be a div */
    .filter-controls {
        margin: 25px auto; /* Center */
        padding: 20px;
        background: #f9f9f9; /* Lighter background */
        border: 1px solid #e0e0e0; /* Softer border */
        border-radius: 8px;
        max-width: 90%;
        text-align: center;
        /* H3 inside is handled by general H3 style */
    }

    .filter-params {
        margin: 15px 0;
        display: flex; /* Align label and slider nicely */
        justify-content: center;
        align-items: center;
        flex-wrap: wrap; /* Allow wrapping */
        gap: 15px; /* Space between items */
    }

    .filter-params label {
        display: block; /* Or inline-block if preferred */
        margin: 0; /* Reset margin */
        font-weight: bold;
    }

    /* Layout containers need to be divs */
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

    /* Explanation blocks need to be divs for styling */
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
         /* H3 inside these handled by general H3 */
    }

    /* Specific filter type explanations */
    .filter-type-explanation {
        margin: 20px 0;
        padding: 15px;
        border-left: 5px solid #0077cc;
        background: #ffffff;
        border-radius: 0 5px 5px 0;
         /* H4 handled above */
         /* Markdown lists/paragraphs inside will inherit body styles */
    }


    ul { /* Style for Markdown lists */
         padding-left: 40px; /* Indent lists */
         list-style: disc; /* Standard bullets */
         margin: 1em 0; /* Add vertical space around lists */
    }

    li { /* Style for Markdown list items */
        margin: 8px 0; /* Consistent spacing */
        line-height: 1.5;
    }

    p { /* Style for Markdown paragraphs */
       margin: 1em 0; /* Add vertical space */
       text-align: left; /* Justify text left within containers */
    }
     /* Center paragraphs directly under body/container if needed */
     .container > p {
         text-align: center;
     }


    /* Matrix display needs to be a div */
    .matrix-display {
        margin-top: 15px;
        text-align: left;
        max-height: 250px; /* Increased height */
        overflow: auto;
        background: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
        border: 1px solid #ddd;
         /* H4 handled above */
    }

    .matrix-values { /* Target the <pre> tag */
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px; /* Slightly smaller for density */
        white-space: pre; /* Keep formatting */
        overflow-x: auto;
        margin: 0;
        line-height: 1.3;
        color: #333;
    }

    /* Specific styled blocks need divs */
    .fourier-interpretation {
        background-color: #eaf6ff; /* Light blue background */
        padding: 12px 12px 12px 15px; /* Adjust padding */
        border-left: 4px solid #3498db;
        margin-top: 10px;
        font-size: 0.9em;
        border-radius: 0 4px 4px 0;
         /* Markdown inside */
    }
     .fourier-interpretation p, .fourier-interpretation ul { margin: 0.5em 0; } /* Reduce margin inside */

    .mathematical-note {
        background-color: #fff8e1; /* Light orange background */
        border-left: 4px solid #e67e22;
        margin-top: 20px;
        padding: 15px 15px 15px 20px;
        border-radius: 0 5px 5px 0;
         /* H4 handled above */
         /* Markdown inside */
    }
     .mathematical-note p, .mathematical-note ul { margin: 0.5em 0;} /* Reduce margin inside */


    #loadingOverlay { /* Raw HTML div */
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

    .loading-content { /* Inner div of overlay */
        background: white;
        padding: 30px 40px; /* More padding */
        border-radius: 8px;
        text-align: center;
        min-width: 320px; /* Slightly wider */
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    }

    .loading-message { /* Text inside overlay */
        margin-bottom: 20px; /* More space */
        font-size: 1.3em; /* Larger text */
        font-weight: bold;
    }

    .progress-container { /* Progress bar container */
        width: 100%;
        height: 25px; /* Taller bar */
        background: #e9ecef; /* Lighter grey background */
        border-radius: 13px; /* More rounded */
        overflow: hidden;
        border: 1px solid #ced4da;
    }

    .progress-bar { /* Progress bar itself */
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

    .spectrum-explanation strong { /* Style for strong tag inside */
        color: #2980b9;
        font-weight: bold;
    }

    /* Warning Message Box needs to be a div */
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
         /* Markdown H2 inside needs specific styling */
    }
     .warning-message h2 { /* Target H2 specifically inside this div */
        color: #856404; /* Match text color */
        margin-top: 0;
        font-size: 1.2em;
        display: flex;
        align-items: center;
        gap: 10px; /* Space between icon and text */
        text-align: left; /* Ensure left align */
        border-bottom: none; /* Override general H2 style */
        padding-bottom: 0;
    }
     /* Keep list inside warning as HTML for simplicity or style Markdown list */
     .warning-message ul { list-style: disc; padding-left: 25px; margin: 10px 0; }
     .warning-message li { margin: 8px 0; line-height: 1.5; }
     .warning-message strong { color: #665103; font-weight: bold; } /* Style strong tag */


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
          .image-container {
              min-width: 90%; /* Adjust min-width for small screens */
          }
    }
</style>

<!-- Main container div is needed for overall structure and styling -->
<div class="container">

<!-- Raw HTML for Warning Message Box -->
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

<!-- Markdown H1 -->
# Filtrado de Imágenes con Transformada Discreta de Fourier (DFT)

<!-- Section: Input -->
## Selección de Imagen
<!-- Raw HTML for file input -->
<input type="file" id="imageFile" accept="image/*">

<!-- Section: Image Display -->
<!-- Raw HTML for layout container -->
<div class="image-display">
    <!-- Raw HTML for image container -->
    <div class="image-container">
        <!-- Markdown H3 -->
        ### Imagen Original (Redimensionada y en Gris)
        <!-- Raw HTML for canvas and matrix -->
        <canvas id="originalCanvas"></canvas>
        <div class="matrix-display">
            <h4>Valores de la Matriz (Primeros 10x10)</h4>
            <pre id="imageMatrix" class="matrix-values"></pre>
        </div>
    </div>
</div>

<!-- Section: Filters -->
## Filtros y Coeficientes de Fourier

<!-- Raw HTML for styled explanation block -->
<div class="filter-explanation">
    <!-- Markdown H3 -->
    ### ¿Cómo funcionan los filtros en el dominio de la frecuencia?

    La Transformada de Fourier descompone una imagen en sus componentes de frecuencia. Cada punto en el espectro de Fourier representa una frecuencia específica (rapidez del cambio de intensidad) en una dirección particular:

    *   **Bajas frecuencias (cerca del centro del espectro):** Representan cambios suaves y graduales en la imagen (áreas uniformes, brillo general).
    *   **Altas frecuencias (lejos del centro del espectro):** Representan cambios bruscos y detalles finos (bordes, texturas, ruido).

    El filtrado en el dominio de la frecuencia consiste en **modificar (multiplicar) el espectro de Fourier** de la imagen con una **función de transferencia del filtro (máscara de filtro)** y luego aplicar la Transformada Inversa de Fourier (IDFT) para obtener la imagen filtrada.
</div>

<!-- Raw HTML for styled explanation block -->
<div class="filter-types">
    <!-- Markdown H3 -->
    ### Tipos de Filtros Ideales:

    (Estos son filtros ideales con cortes abruptos, usados aquí con fines demostrativos)

    <!-- Raw HTML for styled sub-block -->
    <div class="filter-type-explanation">
        <!-- Markdown H4 -->
        #### Filtro Paso Bajo (LPF)

        Conserva las frecuencias bajas y elimina (pone a cero) las altas frecuencias por encima de una frecuencia de corte (D₀).

        *   Suaviza la imagen (efecto de desenfoque).
        *   Reduce el ruido de alta frecuencia.
        *   Elimina detalles finos y texturas.

        <!-- Raw HTML for styled interpretation block -->
        <div class="fourier-interpretation">
           **Máscara de Filtro:** Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro ≤ D₀) se mantienen (multiplican por 1), y los de fuera se anulan (multiplican por 0).
        </div>
    </div>

    <!-- Raw HTML for styled sub-block -->
    <div class="filter-type-explanation">
        <!-- Markdown H4 -->
        #### Filtro Paso Alto (HPF)

        Conserva las frecuencias altas y elimina (pone a cero) las bajas frecuencias por debajo de una frecuencia de corte (D₀).

        *   Resalta los bordes y detalles finos.
        *   Atenúa las variaciones suaves (componente de baja frecuencia).
        *   Puede amplificar el ruido.

        <!-- Raw HTML for styled interpretation block -->
        <div class="fourier-interpretation">
            **Máscara de Filtro:** Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro < D₀) se anulan (multiplican por 0), y los de fuera se mantienen (multiplican por 1).
        </div>
    </div>

    <!-- Raw HTML for styled sub-block -->
    <div class="filter-type-explanation">
        <!-- Markdown H4 -->
        #### Filtro Paso Banda (BPF)

        Conserva un rango específico de frecuencias entre un límite inferior y superior (o centrado en D₀ con un cierto ancho).

        *   Permite aislar características o texturas de un tamaño específico.
        *   Elimina tanto las frecuencias muy bajas como las muy altas.

        <!-- Raw HTML for styled interpretation block -->
        <div class="fourier-interpretation">
            **Máscara de Filtro:** Se crea una máscara en forma de anillo en el espectro centrado. Los coeficientes dentro del anillo (distancia al centro entre D₁ y D₂) se mantienen (multiplican por 1), y los demás se anulan (multiplican por 0).
        </div>
    </div>

    <!-- Raw HTML for styled note block -->
    <div class="mathematical-note">
        <!-- Markdown H4 -->
        #### Nota sobre los Coeficientes DFT

        Cada punto (k, l) en el espectro DFT 2D, F(k, l), es un número complejo:

        *   **Magnitud |F(k, l)|:** Indica la "cantidad" o importancia de la componente de frecuencia (k, l) en la imagen. El brillo en la visualización del espectro representa la magnitud (generalmente en escala logarítmica).
        *   **Fase ∠F(k, l):** Indica el desplazamiento espacial de esa componente de frecuencia. Es crucial para la reconstrucción correcta de la imagen.
        *   **Distancia al centro:** En el espectro *centrado*, la distancia desde el punto (k, l) al centro es proporcional a la frecuencia espacial radial.
        *   **F(0, 0):** El coeficiente en el origen (antes de centrar) representa la componente DC (frecuencia cero), relacionada con el brillo promedio de la imagen. Es el punto más brillante en el centro del espectro *centrado*.
    </div>
</div>

<!-- Raw HTML for filter controls container -->
<div class="filter-controls">
    <!-- Markdown H3 -->
    ### Controles del Filtro
    <!-- Raw HTML for select, range slider, span, and button -->
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


<!-- Section: Spectrum -->
## Espectro de Frecuencia (Magnitud DFT)

<!-- Raw HTML for comparison container -->
<div class="comparison-container">
    <!-- Raw HTML for image containers -->
    <div class="image-container">
        <!-- Markdown H3 -->
        ### Espectro Original (Centrado, Log)
        <canvas id="originalSpectrumCanvas"></canvas>
    </div>
    <div class="image-container">
        <!-- Markdown H3 -->
        ### Espectro Filtrado (Centrado, Log)
        <canvas id="filteredSpectrumCanvas"></canvas>
    </div>
</div>

<!-- Raw HTML for styled explanation block -->
<div class="spectrum-explanation">
    <!-- Markdown H4 -->
    #### Interpretación del Espectro de Frecuencia (Visualización Centrada)

    El espectro mostrado es una representación visual de la **magnitud** de los coeficientes de la DFT, con la frecuencia cero (DC) desplazada al centro y usando una escala logarítmica para mejorar la visibilidad:

    *   **Centro del espectro (punto más brillante):**
        *   Representa la componente DC (frecuencia cero), relacionada con el brillo promedio de la imagen.
        *   Las frecuencias **más bajas** (cambios lentos) están más cerca del centro.
    *   **Bordes del espectro:**
        *   Representan las frecuencias **más altas** (cambios rápidos, detalles finos, bordes).
    *   **Dirección desde el centro:**
        *   Indica la orientación de los patrones en la imagen.
        *   Puntos brillantes a lo largo del eje vertical indican patrones predominantemente horizontales en la imagen.
        *   Puntos brillantes a lo largo del eje horizontal indican patrones predominantemente verticales en la imagen.
        *   Puntos brillantes en diagonal indican patrones diagonales.
    *   **Brillo en el espectro:**
         *   Mayor brillo = Mayor magnitud = Mayor presencia de esa frecuencia/orientación específica en la imagen.
         *   La **escala logarítmica** (log(1 + magnitud)) comprime los valores altos y realza los bajos, haciendo visibles más detalles del espectro.
         *   El espectro de magnitud es **simétrico** respecto al centro para imágenes reales.
</div>

<!-- Raw HTML for matrix display -->
<div class="matrix-display">
    <!-- Markdown H4 -->
    #### Coeficientes DFT (Magnitud, Primeros 10x10, No Centrado)
    <pre id="fourierMatrix" class="matrix-values"></pre>
</div>


<!-- Section: Results -->
## Resultados del Filtrado

<!-- Raw HTML for comparison container -->
<div class="comparison-container">
    <!-- Raw HTML for image containers -->
    <div class="image-container">
        <!-- Markdown H3 -->
        ### Imagen Original (Gris)
        <canvas id="resultOriginalCanvas"></canvas>
    </div>
    <div class="image-container">
        <!-- Markdown H3 -->
        ### Imagen Filtrada (IDFT)
        <canvas id="filteredCanvas"></canvas>
        <!-- Raw HTML for matrix display -->
        <div class="matrix-display">
            <h4>Valores de la Matriz Filtrada (Primeros 10x10)</h4>
            <pre id="filteredMatrix" class="matrix-values"></pre>
        </div>
    </div>
</div>


<!-- Section: Log -->
## Registro de Progreso

<!-- Raw HTML for log display -->
<div id="progressLog" class="log"></div>


</div><!-- End of .container div -->

<!-- Raw HTML for Loading Overlay Structure (initially hidden) -->
<div id="loadingOverlay">
    <div class="loading-content">
        <div class="loading-message">Procesando...</div>
        <div class="progress-container">
            <div class="progress-bar">0%</div>
        </div>
    </div>
</div>

<!-- Embedded JavaScript -->
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
             // Styles are applied via CSS now
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

        let matrixText = ''; // Start with empty, header is now H4
        const colWidth = isComplex ? 10 : 5; // Adjust padding width
        // matrixText += '-'.repeat(displayCols * colWidth) + '\n'; // Header is H4 now

        for (let y = 0; y < displayRows; y++) {
            let rowText = '';
            for (let x = 0; x < displayCols; x++) {
                let valueStr = '';
                if (isComplex) {
                    // Ensure data[y] exists and data[y][x] is a Complex object
                    const complexVal = (data && data[y] && data[y][x] instanceof Complex) ? data[y][x] : new Complex(0,0);
                    const magnitude = complexVal.magnitude();
                    valueStr = magnitude.toFixed(2).padStart(colWidth -1); // Display magnitude
                } else {
                     // Ensure data exists and index is valid
                    const pixelIndex = (y * width + x) * 4;
                    const value = (data && data.length > pixelIndex) ? data[pixelIndex] : 0; // Grayscale value from R channel
                    valueStr = String(value).padStart(colWidth - 1);
                }
                rowText += valueStr + ' ';
            }
            matrixText += rowText.trim() + '\n';
        }
        // matrixText += '-'.repeat(displayCols * colWidth); // Remove footer line
        element.textContent = matrixText.trim(); // Set text content of the <pre> tag
    }

    function displaySpectrum(canvasElement, spectrum) {
         if (!canvasElement || !spectrum || spectrum.length === 0 || !spectrum[0] || spectrum[0].length === 0) {
             logProgress("Cannot display spectrum: Invalid canvas or spectrum data.");
             // Optionally clear the canvas
              if(canvasElement) {
                   const ctx = canvasElement.getContext('2d');
                    if(ctx) {
                        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    }
                   canvasElement.width = 1; // Reset size to indicate cleared state
                   canvasElement.height = 1;
              }
             return;
         }

         const height = spectrum.length;
         const width = spectrum[0].length;
         canvasElement.width = width;
         canvasElement.height = height;
         const ctx = canvasElement.getContext('2d');
          if (!ctx) {
             logProgress(`Failed to get 2D context for canvas ${canvasElement.id}`);
             return;
         }
         const imageData = ctx.createImageData(width, height);

         const shiftedSpectrum = fftShift(spectrum); // Center for visualization

         // Find max log magnitude for normalization
         let maxLogMag = 0;
         for (let y = 0; y < height; y++) {
             for (let x = 0; x < width; x++) {
                  // Ensure shiftedSpectrum[y][x] is a Complex object before calling magnitude
                 const magVal = (shiftedSpectrum[y] && shiftedSpectrum[y][x] instanceof Complex) ? shiftedSpectrum[y][x].magnitude() : 0;
                 const logMag = Math.log(1 + magVal);
                 if (logMag > maxLogMag) maxLogMag = logMag;
             }
         }
         const normalizationFactor = maxLogMag > 1e-6 ? 255 / maxLogMag : 255; // Avoid div by zero

         // Draw pixels
         for (let y = 0; y < height; y++) {
             for (let x = 0; x < width; x++) {
                 const magVal = (shiftedSpectrum[y] && shiftedSpectrum[y][x] instanceof Complex) ? shiftedSpectrum[y][x].magnitude() : 0;
                 const logMag = Math.log(1 + magVal);
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
                 if(ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                 }
                // Resetting dimensions can visually confirm clearing
                canvas.width = 1; canvas.height = 1; // Minimal size
            }
         });
         if(filteredMatrixDiv) filteredMatrixDiv.textContent = 'N/A';
         // Keep original spectrum matrix? Maybe clear it too.
         if(fourierMatrixDiv) fourierMatrixDiv.textContent = 'N/A';
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
        applyFilterButton.disabled = true; // Disable button during load

        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.onload = async function () { // Needs to be async for DFT
                logProgress("Image loaded into memory. Resizing and converting...");

                // Use temporary canvas for processing to avoid altering display canvas prematurely
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                 if(!tempCtx) {
                     logProgress("Failed to create temporary canvas context.");
                     hideLoadingOverlay();
                     return;
                 }

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
                 let imageData;
                 try {
                    imageData = tempCtx.getImageData(0, 0, newWidth, newHeight);
                 } catch (error) {
                     logProgress(`Error getting image data: ${error}. Tainted canvas?`);
                     alert("Error processing image. It might be from a different origin or corrupted.");
                     hideLoadingOverlay();
                     return;
                 }

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
                    // applyFilterButton is already disabled or stays disabled
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
              // Verify filteredPixelData is valid before proceeding
               if (!filteredPixelData || filteredPixelData.length !== width * height * 4) {
                   throw new Error("IDFT did not return valid pixel data.");
               }

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
              // Optionally clear filter results if error occurred
              displayGrayscaleImageOnCanvas(filteredCanvas, 1, 1, new Uint8ClampedArray(4)); // Clear canvas
              if(filteredMatrixDiv) filteredMatrixDiv.textContent = 'Error';
         } finally {
             hideLoadingOverlay(); // Hide overlay when done
             applyFilterButton.disabled = false; // Re-enable button
              logProgress("--- Proceso de Filtrado Terminado ---");
         }
    }


    // --- Initial Setup ---
    function initializeApp() {
        // Slider value display update
        if(cutoffFreqSlider && cutoffValueSpan) {
            cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`; // Initial display
            cutoffFreqSlider.addEventListener('input', () => {
                cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`;
            });
        } else {
             console.error("Slider or value span not found.");
        }

        // Main event listeners
        if (imageFileInput) {
             imageFileInput.addEventListener('change', handleImageUpload);
        } else {
            console.error("Image file input not found.");
        }

         if (applyFilterButton) {
            applyFilterButton.addEventListener('click', handleFilter);
            applyFilterButton.disabled = true; // Disabled until image is loaded
        } else {
            console.error("Apply filter button not found.");
        }

        logProgress("Aplicación inicializada. Esperando carga de imagen.");
        logProgress("Nota: La imagen se redimensionará a máx 250px y se convertirá a escala de grises.");
        clearOutputAreas(); // Ensure clean state on load
    }

     // Wait for the DOM to be fully loaded before initializing
     document.addEventListener('DOMContentLoaded', initializeApp);

</script>