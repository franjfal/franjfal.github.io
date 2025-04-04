---
title: "Filtración de imágenes interactivas con la tranformada de Fourier discreta (DFT)"
date: '2024-01-15 10:30:00 +0100' # CHANGE THIS to your desired publication date/time/zone
categories:   experimento optimización análisis hilbert imagen proyección aplicaciones
tags: [Hilbert, proyección ortogonal, DFT, transformada fourier, filtro, imagen, procesamiento señal,]
permalink: "/MatExp/analisis/hilbert/filtro-imagen"
header:
  image: "/assets/MatExp/analisis/hilbert/image/header.jpg"
excerpt: "Descubre cómo se pueden filtrar imágenes usando la Transformada Discreta de Fourier (DFT) con esta demostración interactiva. Sube una imagen, observa su transformación al dominio de las frecuencias, aplica distintos filtros (paso bajo, paso alto o de banda) y compara el espectro y la imagen resultante. Una forma visual de entender cómo funciona el procesamiento de imágenes y su relación con la proyección ortogonal en un espacio de Hilber."
feature: "/assets/MatExp/analisis/hilbert/audio/feature.jpg"
---

<!-- Embedded CSS -->
<style>
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

    /* Section wrapper styles */
     .content-section {
        text-align: left;
        margin: 25px auto; /* Center sections */
        padding: 20px;
        background: #f8f8f8;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid #e7e7e7;
        max-width: 95%; /* Limit width */
        margin-bottom: 30px;
        padding-bottom: 20px; /* Ensure padding consistency */
    }
     .log-section { /* Remove bottom margin from last section */
         margin-bottom: 0;
     }

    /* Ensure headings inside sections are centered if desired */
     .content-section > h2,
     .content-section > h3 {
         text-align: center;
         margin-top: 0; /* Remove default top margin */
         margin-bottom: 1em; /* Add space below heading */
         padding-bottom: 0.5em; /* Add space below bottom border */
         border-bottom: 1px solid #eee; /* Optional: Add a border */
     }

    input[type="file"] {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        display: block; /* Make it block level for centering */
        margin: 15px auto; /* Center the file input */
    }

    /* Button styles handled by theme */
    /* button { ... } */
    /* button:hover { ... } */
    /* button:disabled { ... } */

    select, input[type="number"] { /* Style number input similar to select */
         padding: 8px 12px;
         border: 1px solid #ccc;
         border-radius: 4px;
         min-width: 80px; /* Adjust width for number input */
         margin: 10px;
         vertical-align: middle; /* Align with labels/buttons */
    }
    input[type="number"] {
         text-align: right;
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
         margin-bottom: 30px; /* Add consistent bottom margin */
         padding-bottom: 20px; /* Ensure padding consistency */
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
    .mathematical-note, /* Apply general section style */
    .spectrum-explanation
    {
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
         /* Content inside */
    }

    /* ul, li, p handled by theme */

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
     /* Add spacing below matrix size control */
     .matrix-size-control {
         text-align: right;
         margin: 5px 0 10px 0;
         font-size: 0.9em;
     }
     .matrix-size-control label {
         margin-right: 5px;
         font-weight: bold;
         color: #555;
     }
     .matrix-size-control input[type="number"] {
         width: 60px; /* Smaller width for size input */
         padding: 4px 6px;
         margin: 0; /* Reset margin */
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
         /* Content inside */
    }
     .fourier-interpretation p, .fourier-interpretation ul { margin: 0.5em 0; } /* Reduce margin inside */

    .mathematical-note {
        background-color: #fff8e1; /* Light orange background */
        border-left: 4px solid #e67e22;
        margin-top: 20px;
        padding: 15px 15px 15px 20px;
        border-radius: 0 5px 5px 0;
         /* H4 handled above */
         /* Content inside */
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
         /* H2 inside already handled */
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
     /* List inside warning */
     .warning-message ul { list-style: disc; padding-left: 25px; margin: 10px 0; }
     .warning-message li { margin: 8px 0; line-height: 1.5; }
     .warning-message strong { color: #665103; font-weight: bold; } /* Style strong tag */


    /* Responsive Adjustments */
    @media (max-width: 768px) {
        /* .container padding handled by theme */
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
            width: 80%; /* Keep specific responsive width */
        }
        /* h1 handled by theme */
    }

    @media (max-width: 480px) {
         /* body padding handled by theme */
         /* .container padding handled by theme */
          /* h1 handled by theme */
          /* button, select, input[type="file"] handled by theme */
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

<!-- HTML H1 -->
<h1>Filtrado de Imágenes con Transformada Discreta de Fourier (DFT)</h1>

<!-- Section: Input -->
<div class="content-section input-section">
    <h2>Selección de Imagen</h2>
    <!-- Raw HTML for file input -->
    <input type="file" id="imageFile" accept="image/*">
</div>

<!-- Section: Image Display -->
<!-- Raw HTML for layout container -->
<div class="image-display">
    <!-- Raw HTML for image container -->
    <div class="image-container">
        <!-- HTML H3 -->
        <h3>Imagen Original (Redimensionada y en Gris)</h3>
        <!-- Raw HTML for canvas and matrix -->
        <canvas id="originalCanvas"></canvas>
        <div class="matrix-display">
            <div class="matrix-size-control">
                 <label for="numImageMatrixSizeInput">Mostrar (NxN):</label>
                 <input type="number" id="numImageMatrixSizeInput" value="10" min="1" max="50">
            </div>
            <h4 id="imageMatrixInitialHeader">Valores de la Matriz (Primeros 10x10)</h4>
            <pre id="imageMatrixInitialPre" class="matrix-values"></pre>
        </div>
    </div>
</div>

<!-- Section: Filters -->
<div class="content-section fourier-coefficients">
    <h2>Filtros y Coeficientes de Fourier</h2>

    <!-- Raw HTML for styled explanation block -->
    <div class="filter-explanation">
        <!-- HTML H3 -->
        <h3>¿Cómo funcionan los filtros en el dominio de la frecuencia?</h3>

        <p>La Transformada de Fourier descompone una imagen en sus componentes de frecuencia. Cada punto en el espectro de Fourier representa una frecuencia específica (rapidez del cambio de intensidad) en una dirección particular:</p>
        <ul>
            <li><strong>Bajas frecuencias (cerca del centro del espectro):</strong> Representan cambios suaves y graduales en la imagen (áreas uniformes, brillo general).</li>
            <li><strong>Altas frecuencias (lejos del centro del espectro):</strong> Representan cambios bruscos y detalles finos (bordes, texturas, ruido).</li>
        </ul>
        <p>El filtrado en el dominio de la frecuencia consiste en <strong>modificar (multiplicar) el espectro de Fourier</strong> de la imagen con una <strong>función de transferencia del filtro (máscara de filtro)</strong> y luego aplicar la Transformada Inversa de Fourier (IDFT) para obtener la imagen filtrada.</p>
    </div>

    <!-- Raw HTML for styled explanation block -->
    <div class="filter-types">
        <!-- HTML H3 -->
        <h3>Tipos de Filtros Ideales:</h3>

        <p>(Estos son filtros ideales con cortes abruptos, usados aquí con fines demostrativos)</p>

        <!-- Raw HTML for styled sub-block -->
        <div class="filter-type-explanation">
            <!-- HTML H4 -->
            <h4>Filtro Paso Bajo (LPF)</h4>

            <p>Conserva las frecuencias bajas y elimina (pone a cero) las altas frecuencias por encima de una frecuencia de corte (D₀).</p>
            <ul>
                <li>Suaviza la imagen (efecto de desenfoque).</li>
                <li>Reduce el ruido de alta frecuencia.</li>
                <li>Elimina detalles finos y texturas.</li>
            </ul>
            <!-- Raw HTML for styled interpretation block -->
            <div class="fourier-interpretation">
               <p><strong>Máscara de Filtro:</strong> Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro ≤ D₀) se mantienen (multiplican por 1), y los de fuera se anulan (multiplican por 0).</p>
            </div>
        </div>

        <!-- Raw HTML for styled sub-block -->
        <div class="filter-type-explanation">
            <!-- HTML H4 -->
            <h4>Filtro Paso Alto (HPF)</h4>

            <p>Conserva las frecuencias altas y elimina (pone a cero) las bajas frecuencias por debajo de una frecuencia de corte (D₀).</p>
            <ul>
                <li>Resalta los bordes y detalles finos.</li>
                <li>Atenúa las variaciones suaves (componente de baja frecuencia).</li>
                <li>Puede amplificar el ruido.</li>
            </ul>
            <!-- Raw HTML for styled interpretation block -->
            <div class="fourier-interpretation">
                <p><strong>Máscara de Filtro:</strong> Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro < D₀) se anulan (multiplican por 0), y los de fuera se mantienen (multiplican por 1).</p>
            </div>
        </div>

        <!-- Raw HTML for styled sub-block -->
        <div class="filter-type-explanation">
            <!-- HTML H4 -->
            <h4>Filtro Paso Banda (BPF)</h4>

            <p>Conserva un rango específico de frecuencias entre un límite inferior y superior (o centrado en D₀ con un cierto ancho).</p>
            <ul>
                <li>Permite aislar características o texturas de un tamaño específico.</li>
                <li>Elimina tanto las frecuencias muy bajas como las muy altas.</li>
            </ul>
            <!-- Raw HTML for styled interpretation block -->
            <div class="fourier-interpretation">
                <p><strong>Máscara de Filtro:</strong> Se crea una máscara en forma de anillo en el espectro centrado. Los coeficientes dentro del anillo (distancia al centro entre D₁ y D₂) se mantienen (multiplican por 1), y los demás se anulan (multiplican por 0).</p>
            </div>
        </div>

        <!-- Raw HTML for styled note block -->
        <div class="mathematical-note">
            <!-- HTML H4 -->
            <h4>Nota sobre los Coeficientes DFT</h4>

            <p>Cada punto (k, l) en el espectro DFT 2D, F(k, l), es un número complejo:</p>
            <ul>
                <li><strong>Magnitud |F(k, l)|:</strong> Indica la "cantidad" o importancia de la componente de frecuencia (k, l) en la imagen. El brillo en la visualización del espectro representa la magnitud (generalmente en escala logarítmica).</li>
                <li><strong>Fase ∠F(k, l):</strong> Indica el desplazamiento espacial de esa componente de frecuencia. Es crucial para la reconstrucción correcta de la imagen.</li>
                <li><strong>Distancia al centro:</strong> En el espectro <em>centrado</em>, la distancia desde el punto (k, l) al centro es proporcional a la frecuencia espacial radial.</li>
                <li><strong>F(0, 0):</strong> El coeficiente en el origen (antes de centrar) representa la componente DC (frecuencia cero), relacionada con el brillo promedio de la imagen. Es el punto más brillante en el centro del espectro <em>centrado</em>.</li>
            </ul>
        </div>
    </div>
</div>


<!-- Raw HTML for filter controls container -->
<div class="filter-controls">
    <!-- HTML H3 -->
    <h3>Controles del Filtro</h3>
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
<div class="content-section spectrum-section">
    <h2>Espectro de Frecuencia (Magnitud DFT)</h2>

    <!-- Raw HTML for comparison container -->
    <div class="comparison-container">
        <!-- Raw HTML for image containers -->
        <div class="image-container">
            <!-- HTML H3 -->
            <h3>Espectro Original (Centrado, Log)</h3>
            <canvas id="originalSpectrumCanvas"></canvas>
        </div>
        <div class="image-container">
            <!-- HTML H3 -->
            <h3>Espectro Filtrado (Centrado, Log)</h3>
            <canvas id="filteredSpectrumCanvas"></canvas>
        </div>
    </div>

    <!-- Raw HTML for styled explanation block -->
    <div class="spectrum-explanation">
        <!-- HTML H4 -->
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

    <!-- Raw HTML for matrix display -->
    <div class="matrix-display">
         <div class="matrix-size-control">
             <label for="numDftMatrixSizeInput">Mostrar (NxN):</label>
             <input type="number" id="numDftMatrixSizeInput" value="10" min="1" max="50">
        </div>
        <!-- HTML H4 -->
        <h4 id="fourierMatrixHeader">Coeficientes DFT (Magnitud, Primeros 10x10, No Centrado)</h4>
        <pre id="fourierMatrixPre" class="matrix-values"></pre>
    </div>
</div>


<!-- Section: Results -->
<div class="content-section results-section">
    <h2>Resultados del Filtrado</h2>

    <!-- Raw HTML for comparison container -->
    <div class="comparison-container">
        <!-- Raw HTML for image containers -->
        <div class="image-container">
            <!-- HTML H3 -->
            <h3>Imagen Original (Gris)</h3>
            <canvas id="resultOriginalCanvas"></canvas>
            <div class="matrix-display">
                <!-- Size control reused from initial image -->
                <div class="matrix-size-control">
                    <label>Mostrar (NxN):</label>
                    <!-- Linked via JS, not separate input -->
                    <span id="resultImageMatrixSizeDisplay">10</span>
                </div>
                <h4 id="resultOriginalMatrixHeader">Valores de la Matriz (Primeros 10x10)</h4>
                <pre id="resultOriginalMatrixPre" class="matrix-values"></pre>
            </div>
        </div>
        <div class="image-container">
            <!-- HTML H3 -->
            <h3>Imagen Filtrada (IDFT)</h3>
            <canvas id="filteredCanvas"></canvas>
            <!-- Raw HTML for matrix display -->
            <div class="matrix-display">
                <div class="matrix-size-control">
                     <label for="numFilteredMatrixSizeInput">Mostrar (NxN):</label>
                     <input type="number" id="numFilteredMatrixSizeInput" value="10" min="1" max="50">
                </div>
                <h4 id="filteredMatrixHeader">Valores de la Matriz Filtrada (Primeros 10x10)</h4>
                <pre id="filteredMatrixPre" class="matrix-values"></pre>
            </div>
        </div>
    </div>
</div>


<!-- Section: Log -->
<div class="content-section log-section">
    <h2>Registro de Progreso</h2>

    <!-- Raw HTML for log display -->
    <div id="progressLog" class="log"></div>
</div>


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
            return Math.sqrt(this.real * this.real + this.imag * this.imag);
        }
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
         multiplyScalar(scalar) {
             return new Complex(this.real * scalar, this.imag * scalar);
         }
    }

    // --- Global State ---
    window.currentSpectrum = null;
    window.currentImageData = null;
    window.currentFilteredPixelData = null; // Store filtered pixel data globally

    // --- DOM Element References ---
    const imageFileInput = document.getElementById('imageFile');
    const applyFilterButton = document.getElementById('applyFilter');
    const originalCanvas = document.getElementById('originalCanvas');
    const resultOriginalCanvas = document.getElementById('resultOriginalCanvas');
    const filteredCanvas = document.getElementById('filteredCanvas');
    const originalSpectrumCanvas = document.getElementById('originalSpectrumCanvas');
    const filteredSpectrumCanvas = document.getElementById('filteredSpectrumCanvas');

    // Matrix Display Elements
    const imageMatrixInitialPre = document.getElementById('imageMatrixInitialPre');
    const fourierMatrixPre = document.getElementById('fourierMatrixPre');
    const resultOriginalMatrixPre = document.getElementById('resultOriginalMatrixPre');
    const filteredMatrixPre = document.getElementById('filteredMatrixPre');
    const imageMatrixInitialHeader = document.getElementById('imageMatrixInitialHeader');
    const fourierMatrixHeader = document.getElementById('fourierMatrixHeader');
    const resultOriginalMatrixHeader = document.getElementById('resultOriginalMatrixHeader');
    const filteredMatrixHeader = document.getElementById('filteredMatrixHeader');

    // Matrix Size Controls
    const numImageMatrixSizeInput = document.getElementById('numImageMatrixSizeInput');
    const numDftMatrixSizeInput = document.getElementById('numDftMatrixSizeInput');
    const numFilteredMatrixSizeInput = document.getElementById('numFilteredMatrixSizeInput');
    const resultImageMatrixSizeDisplay = document.getElementById('resultImageMatrixSizeDisplay'); // Span to show linked size

    const progressLogDiv = document.getElementById('progressLog');
    const filterTypeSelect = document.getElementById('filterType');
    const cutoffFreqSlider = document.getElementById('cutoffFreq');
    const cutoffValueSpan = document.getElementById('cutoffValue');

    // --- Utility Functions ---

    function logProgress(message) {
        if (progressLogDiv) {
            const timestamp = new Date().toLocaleTimeString();
            progressLogDiv.innerHTML += `[${timestamp}] ${message}\n`;
            progressLogDiv.scrollTop = progressLogDiv.scrollHeight;
        } else {
            console.log(`[Log] ${message}`);
        }
    }

    function createLoadingOverlay() {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
             logProgress("Creating loading overlay dynamically.");
             overlay = document.createElement('div');
             overlay.id = 'loadingOverlay';
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
    const loadingOverlay = createLoadingOverlay();

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

    async function processInChunks(total, chunkSize, taskFunction) {
        const numChunks = Math.ceil(total / chunkSize);
        logProgress(`Starting task in ${numChunks} chunks (size: ${chunkSize})...`);
        for (let i = 0; i < numChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, total);
            taskFunction(start, end);
            const progress = ((i + 1) / numChunks) * 100;
            updateProgress(progress);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
         logProgress(`Task finished.`);
    }

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

    function ifftShift(shiftedSpectrum) {
        const height = shiftedSpectrum.length;
         if (height === 0) return [];
        const width = shiftedSpectrum[0].length;
        const spectrum = Array(height).fill(null).map(() => Array(width));
        const cy = Math.floor(height / 2);
        const cx = Math.floor(width / 2);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const oy = (y - cy + height) % height;
                const ox = (x - cx + width) % width;
                spectrum[oy][ox] = shiftedSpectrum[y][x];
            }
        }
        return spectrum;
    }

    // --- Core DFT/IDFT Functions --- (Keep as is)
    async function calculate2DDFT(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        logProgress(`Starting DFT for ${width}x${height} image... This may take a while.`);
        showLoadingOverlay(`Calculando DFT (${width}x${height})...`);
        const spectrum = Array(height).fill(null).map(() =>
            Array(width).fill(null).map(() => new Complex(0, 0))
        );
        const chunkSize = Math.max(1, Math.floor(height / 20));
        await processInChunks(height, chunkSize, (startK, endK) => {
            for (let k = startK; k < endK; k++) {
                for (let l = 0; l < width; l++) {
                    let realSum = 0; let imagSum = 0;
                    for (let m = 0; m < height; m++) {
                        for (let n = 0; n < width; n++) {
                            const pixelIndex = (m * width + n) * 4;
                            const pixelValue = imageData.data[pixelIndex];
                            const angle = 2 * Math.PI * ((k * m / height) + (l * n / width));
                            const cosAngle = Math.cos(angle);
                            const sinAngle = Math.sin(angle);
                            realSum += pixelValue * cosAngle;
                            imagSum -= pixelValue * sinAngle;
                        }
                    }
                    spectrum[k][l] = new Complex(realSum, imagSum);
                }
             }
        });
        logProgress("DFT calculation finished.");
        return spectrum;
    }

    async function calculate2DIDFT(spectrum) {
         const height = spectrum.length;
         if (height === 0) return new Uint8ClampedArray(0);
         const width = spectrum[0].length;
         logProgress(`Starting IDFT for ${width}x${height} spectrum...`);
         showLoadingOverlay(`Calculando IDFT (${width}x${height})...`);
         const resultData = new Uint8ClampedArray(width * height * 4);
         const spatialDomainValues = Array(height).fill(null).map(() => Array(width).fill(0));
         const N = width * height;
         let minVal = Infinity; let maxVal = -Infinity;
         const chunkSize = Math.max(1, Math.floor(height / 15));
         await processInChunks(height, chunkSize, (startX, endX) => {
             for (let x = startX; x < endX; x++) {
                 for (let y = 0; y < width; y++) {
                     let sumReal = 0;
                     for (let k = 0; k < height; k++) {
                         for (let l = 0; l < width; l++) {
                             const angle = 2 * Math.PI * ((k * x / height) + (l * y / width));
                             const cosAngle = Math.cos(angle);
                             const sinAngle = Math.sin(angle);
                             const specVal = spectrum[k][l];
                             sumReal += (specVal.real * cosAngle - specVal.imag * sinAngle);
                         }
                     }
                     const realValue = sumReal / N;
                     spatialDomainValues[x][y] = realValue;
                     if (realValue < minVal) minVal = realValue;
                     if (realValue > maxVal) maxVal = realValue;
                 }
             }
         });
         logProgress(`IDFT calculation finished. Normalizing values (Min: ${minVal.toFixed(2)}, Max: ${maxVal.toFixed(2)})...`);
         updateProgress(95);
         const range = maxVal - minVal;
         const hasRange = range > 1e-6;
         for (let x = 0; x < height; x++) {
             for (let y = 0; y < width; y++) {
                 const value = spatialDomainValues[x][y];
                 let normalizedValue = hasRange ? Math.round(255 * (value - minVal) / range) : Math.round(minVal);
                 const clampedValue = Math.max(0, Math.min(255, normalizedValue));
                 const pixelIndex = (x * width + y) * 4;
                 resultData[pixelIndex] = clampedValue;
                 resultData[pixelIndex + 1] = clampedValue;
                 resultData[pixelIndex + 2] = clampedValue;
                 resultData[pixelIndex + 3] = 255;
             }
         }
         updateProgress(100);
         logProgress("Normalization and pixel assignment finished.");
         hideLoadingOverlay();
         return resultData;
    }

    // --- Filtering Logic --- (Keep as is)
    function applyFilter(spectrum, type, cutoffRatio) {
         const height = spectrum.length;
         if (height === 0) return [];
         const width = spectrum[0].length;
         logProgress(`Applying ${type} filter with cutoff ${cutoffRatio.toFixed(2)}...`);
         const shiftedSpectrum = fftShift(spectrum);
         const filteredShiftedSpectrum = Array(height).fill(null).map(() => Array(width));
         const centerY = Math.floor(height / 2);
         const centerX = Math.floor(width / 2);
         const maxDist = Math.sqrt(centerY * centerY + centerX * centerX);
         const cutoffDist = cutoffRatio * maxDist;
         for (let y = 0; y < height; y++) {
             for (let x = 0; x < width; x++) {
                 const distance = Math.sqrt(Math.pow(y - centerY, 2) + Math.pow(x - centerX, 2));
                 let filterMaskValue = 0;
                 switch (type) {
                     case 'lowpass': filterMaskValue = (distance <= cutoffDist) ? 1 : 0; break;
                     case 'highpass': filterMaskValue = (distance >= cutoffDist) ? 1 : 0; break;
                     case 'bandpass':
                         const bandWidth = (0.15 * maxDist);
                         const lowerBound = cutoffDist - bandWidth / 2;
                         const upperBound = cutoffDist + bandWidth / 2;
                         filterMaskValue = (distance >= lowerBound && distance <= upperBound) ? 1 : 0;
                         break;
                     default: filterMaskValue = 1;
                 }
                 filteredShiftedSpectrum[y][x] = filterMaskValue === 1 ? shiftedSpectrum[y][x] : new Complex(0, 0);
             }
         }
         const filteredSpectrum = ifftShift(filteredShiftedSpectrum);
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
        imageData.data.set(pixelData);
        ctx.putImageData(imageData, 0, 0);
    }

    // --- Updated displayMatrixValues Function ---
    function displayMatrixValues(preElementId, headerElementId, data, width, height, baseLabel, isComplex = false, maxSize = 10) {
        const preElement = document.getElementById(preElementId);
        const headerElement = document.getElementById(headerElementId);

        if (!preElement || !headerElement) {
            console.error("Matrix display element or header not found for:", baseLabel, preElementId);
            return;
        }

        const displaySize = Math.max(1, Math.min(maxSize, width, height)); // Ensure valid size
        headerElement.textContent = `${baseLabel} (Primeros ${displaySize}x${displaySize})`; // Update header text

        if (!data || height === 0 || width === 0) {
            preElement.textContent = `No hay datos para mostrar.`;
            return;
        }

        let matrixText = '';
        const colWidth = isComplex ? 10 : 5;

        for (let y = 0; y < displaySize; y++) {
            let rowText = '';
            for (let x = 0; x < displaySize; x++) {
                let valueStr = '';
                if (isComplex) {
                    const complexVal = (data[y] && data[y][x] instanceof Complex) ? data[y][x] : new Complex(0, 0);
                    valueStr = complexVal.magnitude().toFixed(2).padStart(colWidth - 1);
                } else {
                    const pixelIndex = (y * width + x) * 4;
                    const value = (data.length > pixelIndex) ? data[pixelIndex] : 0;
                    valueStr = String(value).padStart(colWidth - 1);
                }
                rowText += valueStr + ' ';
            }
            matrixText += rowText.trim() + '\n';
        }
        preElement.textContent = matrixText.trim();
    }


    function displaySpectrum(canvasElement, spectrum) {
         if (!canvasElement || !spectrum || spectrum.length === 0 || !spectrum[0] || spectrum[0].length === 0) {
             logProgress("Cannot display spectrum: Invalid canvas or spectrum data.");
              if(canvasElement) {
                   const ctx = canvasElement.getContext('2d');
                    if(ctx) { ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); }
                   canvasElement.width = 1; canvasElement.height = 1;
              }
             return;
         }
         const height = spectrum.length;
         const width = spectrum[0].length;
         canvasElement.width = width;
         canvasElement.height = height;
         const ctx = canvasElement.getContext('2d');
          if (!ctx) { logProgress(`Failed to get 2D context for canvas ${canvasElement.id}`); return; }
         const imageData = ctx.createImageData(width, height);
         const shiftedSpectrum = fftShift(spectrum);
         let maxLogMag = 0;
         for (let y = 0; y < height; y++) {
             for (let x = 0; x < width; x++) {
                 const magVal = (shiftedSpectrum[y] && shiftedSpectrum[y][x] instanceof Complex) ? shiftedSpectrum[y][x].magnitude() : 0;
                 const logMag = Math.log(1 + magVal);
                 if (logMag > maxLogMag) maxLogMag = logMag;
             }
         }
         const normalizationFactor = maxLogMag > 1e-6 ? 255 / maxLogMag : 255;
         for (let y = 0; y < height; y++) {
             for (let x = 0; x < width; x++) {
                 const magVal = (shiftedSpectrum[y] && shiftedSpectrum[y][x] instanceof Complex) ? shiftedSpectrum[y][x].magnitude() : 0;
                 const logMag = Math.log(1 + magVal);
                 const pixelValue = Math.min(255, Math.round(logMag * normalizationFactor));
                 const idx = (y * width + x) * 4;
                 imageData.data[idx] = pixelValue;
                 imageData.data[idx + 1] = pixelValue;
                 imageData.data[idx + 2] = pixelValue;
                 imageData.data[idx + 3] = 255;
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
            case 'lowpass': explanation += "Acción: Atenúa/elimina frecuencias ALTAS (bordes del espectro centrado).\nEfecto Esperado: Espectro más oscuro hacia los bordes.\n"; break;
            case 'highpass': explanation += "Acción: Atenúa/elimina frecuencias BAJAS (centro del espectro centrado).\nEfecto Esperado: Espectro más oscuro en el centro (excepto quizás DC si no se bloquea).\n"; break;
            case 'bandpass': const bandWidthPercent = (0.15 * 100).toFixed(1); explanation += `Acción: Conserva un anillo de frecuencias (ancho ~${bandWidthPercent}%).\nEfecto Esperado: Solo un anillo brillante visible en el espectro.\n`; break;
            default: explanation += "Acción: Desconocida.\n"; break;
        }
        explanation += "-------------------------------------\n";
        logProgress(explanation);
    }

    function clearOutputAreas() {
         logProgress("Clearing previous output areas...");
        [resultOriginalCanvas, filteredCanvas, originalSpectrumCanvas, filteredSpectrumCanvas].forEach(canvas => {
            if(canvas) {
                const ctx = canvas.getContext('2d');
                 if(ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
                canvas.width = 1; canvas.height = 1;
            }
         });
         // Clear matrix displays
        if(imageMatrixInitialPre) displayMatrixValues('imageMatrixInitialPre', 'imageMatrixInitialHeader', null, 0, 0, 'Valores de la Matriz', false, 10);
        if(fourierMatrixPre) displayMatrixValues('fourierMatrixPre', 'fourierMatrixHeader', null, 0, 0, 'Coeficientes DFT', true, 10);
        if(resultOriginalMatrixPre) displayMatrixValues('resultOriginalMatrixPre', 'resultOriginalMatrixHeader', null, 0, 0, 'Valores de la Matriz', false, 10);
        if(filteredMatrixPre) displayMatrixValues('filteredMatrixPre', 'filteredMatrixHeader', null, 0, 0, 'Valores de la Matriz Filtrada', false, 10);

         // Reset size inputs
         if (numImageMatrixSizeInput) numImageMatrixSizeInput.value = 10;
         if (numDftMatrixSizeInput) numDftMatrixSizeInput.value = 10;
         if (numFilteredMatrixSizeInput) numFilteredMatrixSizeInput.value = 10;
         if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = 10;


         logProgress("Output areas cleared.");
    }

    // --- Event Handlers ---

    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) { logProgress("No file selected."); return; }
         if (!file.type.startsWith('image/')) {
              logProgress(`Error: Selected file (${file.name}) is not an image.`);
              alert("Por favor, seleccione un archivo de imagen válido.");
              imageFileInput.value = ''; return;
         }

        logProgress(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        showLoadingOverlay("Cargando y procesando imagen...");
        clearOutputAreas();
        window.currentSpectrum = null;
        window.currentImageData = null;
        window.currentFilteredPixelData = null; // Clear filtered data too
        applyFilterButton.disabled = true;

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = async function () {
                logProgress("Image loaded into memory. Resizing and converting...");
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                 if(!tempCtx) { logProgress("Failed to create temporary canvas context."); hideLoadingOverlay(); return; }

                const originalWidth = img.width; const originalHeight = img.height; const maxSize = 250;
                let newWidth = originalWidth; let newHeight = originalHeight;
                if (originalWidth > maxSize || originalHeight > maxSize) {
                     logProgress(`Resizing from ${originalWidth}x${originalHeight} to max ${maxSize}px.`);
                    if (originalWidth > originalHeight) { newWidth = maxSize; newHeight = Math.round((originalHeight * maxSize) / originalWidth); }
                    else { newHeight = maxSize; newWidth = Math.round((originalWidth * maxSize) / originalHeight); }
                    logProgress(`New dimensions: ${newWidth}x${newHeight}.`);
                } else { logProgress(`Dimensions ${originalWidth}x${originalHeight} within limit.`); }

                tempCanvas.width = newWidth; tempCanvas.height = newHeight;
                tempCtx.drawImage(img, 0, 0, newWidth, newHeight);

                 let imageData;
                 try { imageData = tempCtx.getImageData(0, 0, newWidth, newHeight); }
                 catch (error) { logProgress(`Error getting image data: ${error}. Tainted canvas?`); alert("Error processing image."); hideLoadingOverlay(); return; }

                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                     const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
                }
                logProgress("Image resized and converted to grayscale.");

                displayImageOnCanvas(originalCanvas, imageData);
                window.currentImageData = imageData;

                // Display initial image matrix
                const imageMatrixSize = parseInt(numImageMatrixSizeInput.value, 10) || 10;
                displayMatrixValues('imageMatrixInitialPre', 'imageMatrixInitialHeader', imageData.data, newWidth, newHeight, 'Valores de la Matriz', false, imageMatrixSize);
                if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = imageMatrixSize;


                try {
                     const spectrum = await calculate2DDFT(imageData);
                     window.currentSpectrum = spectrum;

                     displaySpectrum(originalSpectrumCanvas, spectrum);
                     const dftMatrixSize = parseInt(numDftMatrixSizeInput.value, 10) || 10;
                     displayMatrixValues('fourierMatrixPre', 'fourierMatrixHeader', spectrum, newWidth, newHeight, 'Coeficientes DFT', true, dftMatrixSize);

                     applyFilterButton.disabled = false;
                     logProgress("DFT calculado. Listo para aplicar filtros.");

                } catch (error) {
                    logProgress("Error during DFT calculation: " + error); console.error("DFT Error:", error);
                    alert("Ocurrió un error calculando la DFT. Ver la consola para detalles.");
                } finally {
                     hideLoadingOverlay();
                }
            };
            img.onerror = function () { logProgress("Error loading image data."); alert("No se pudo cargar la imagen."); hideLoadingOverlay(); imageFileInput.value = ''; applyFilterButton.disabled = true; };
            img.src = e.target.result;
        };
        reader.onerror = function () { logProgress("Error reading file."); alert("No se pudo leer el archivo."); hideLoadingOverlay(); imageFileInput.value = ''; applyFilterButton.disabled = true; };
        reader.readAsDataURL(file);
    }


    async function handleFilter() {
         if (!window.currentSpectrum || !window.currentImageData) { logProgress("Error: Datos no disponibles."); alert("Cargue una imagen primero."); return; }

         logProgress("--- Iniciando Proceso de Filtrado ---");
         showLoadingOverlay("Aplicando filtro y calculando IDFT...");
         applyFilterButton.disabled = true;

         const spectrum = window.currentSpectrum;
         const originalImageData = window.currentImageData;
         const width = originalImageData.width;
         const height = originalImageData.height;

         try {
             const filterType = filterTypeSelect.value;
             const cutoffRatio = cutoffFreqSlider.value / 100;

             const filteredSpectrum = applyFilter(spectrum, filterType, cutoffRatio);
             displaySpectrum(filteredSpectrumCanvas, filteredSpectrum);
             explainSpectrumChanges(filterType, cutoffRatio);

             const filteredPixelData = await calculate2DIDFT(filteredSpectrum);
             window.currentFilteredPixelData = filteredPixelData; // Store filtered data

               if (!filteredPixelData || filteredPixelData.length !== width * height * 4) { throw new Error("IDFT did not return valid pixel data."); }

             // Display original image in results section
             displayImageOnCanvas(resultOriginalCanvas, originalImageData);
             // Display original image matrix in results section
             const imageMatrixSize = parseInt(numImageMatrixSizeInput.value, 10) || 10;
             displayMatrixValues('resultOriginalMatrixPre', 'resultOriginalMatrixHeader', originalImageData.data, width, height, 'Valores de la Matriz', false, imageMatrixSize);

             // Display filtered image
             displayGrayscaleImageOnCanvas(filteredCanvas, width, height, filteredPixelData);
             // Display filtered image matrix
             const filteredMatrixSize = parseInt(numFilteredMatrixSizeInput.value, 10) || 10;
             displayMatrixValues('filteredMatrixPre', 'filteredMatrixHeader', filteredPixelData, width, height, 'Valores de la Matriz Filtrada', false, filteredMatrixSize);

             logProgress("Filtro aplicado e IDFT calculada con éxito.");

         } catch (error) {
             logProgress("Error durante el filtrado o IDFT: " + error.message); console.error("Filter/IDFT Error:", error);
             alert("Ocurrió un error durante el proceso de filtrado.");
              displayGrayscaleImageOnCanvas(filteredCanvas, 1, 1, new Uint8ClampedArray(4)); // Clear canvas
              if(filteredMatrixPre) displayMatrixValues('filteredMatrixPre', 'filteredMatrixHeader', null, 0, 0, 'Valores de la Matriz Filtrada', false, 10);
         } finally {
             hideLoadingOverlay();
             applyFilterButton.disabled = false;
              logProgress("--- Proceso de Filtrado Terminado ---");
         }
    }


    // --- Initial Setup ---
    function initializeApp() {
        if(cutoffFreqSlider && cutoffValueSpan) {
            cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`;
            cutoffFreqSlider.addEventListener('input', () => {
                cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`;
            });
        } else { console.error("Slider or value span not found."); }

        if (imageFileInput) { imageFileInput.addEventListener('change', handleImageUpload); }
        else { console.error("Image file input not found."); }

         if (applyFilterButton) {
            applyFilterButton.addEventListener('click', handleFilter);
            applyFilterButton.disabled = true;
        } else { console.error("Apply filter button not found."); }

        // --- Add listeners for matrix size inputs ---
        if (numImageMatrixSizeInput) {
            numImageMatrixSizeInput.addEventListener('input', () => {
                const size = parseInt(numImageMatrixSizeInput.value, 10) || 10;
                if (window.currentImageData) {
                     displayMatrixValues('imageMatrixInitialPre', 'imageMatrixInitialHeader', window.currentImageData.data, window.currentImageData.width, window.currentImageData.height, 'Valores de la Matriz', false, size);
                     // Also update the one in the results section if data exists
                     displayMatrixValues('resultOriginalMatrixPre', 'resultOriginalMatrixHeader', window.currentImageData.data, window.currentImageData.width, window.currentImageData.height, 'Valores de la Matriz', false, size);
                }
                if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = size; // Update the span display
                 logProgress(`Tamaño de visualización de matriz de imagen cambiado a ${size}x${size}.`);
            });
        } else { console.error("Image matrix size input not found."); }

        if (numDftMatrixSizeInput) {
            numDftMatrixSizeInput.addEventListener('input', () => {
                const size = parseInt(numDftMatrixSizeInput.value, 10) || 10;
                 if (window.currentSpectrum && window.currentImageData) {
                    displayMatrixValues('fourierMatrixPre', 'fourierMatrixHeader', window.currentSpectrum, window.currentImageData.width, window.currentImageData.height, 'Coeficientes DFT', true, size);
                 }
                 logProgress(`Tamaño de visualización de matriz DFT cambiado a ${size}x${size}.`);
            });
        } else { console.error("DFT matrix size input not found."); }

        if (numFilteredMatrixSizeInput) {
            numFilteredMatrixSizeInput.addEventListener('input', () => {
                 const size = parseInt(numFilteredMatrixSizeInput.value, 10) || 10;
                 if (window.currentFilteredPixelData && window.currentImageData) {
                     displayMatrixValues('filteredMatrixPre', 'filteredMatrixHeader', window.currentFilteredPixelData, window.currentImageData.width, window.currentImageData.height, 'Valores de la Matriz Filtrada', false, size);
                 }
                 logProgress(`Tamaño de visualización de matriz filtrada cambiado a ${size}x${size}.`);
            });
        } else { console.error("Filtered matrix size input not found."); }


        logProgress("Aplicación inicializada. Esperando carga de imagen.");
        logProgress("Nota: La imagen se redimensionará a máx 250px y se convertirá a escala de grises.");
        clearOutputAreas();
    }

     document.addEventListener('DOMContentLoaded', initializeApp);

</script>