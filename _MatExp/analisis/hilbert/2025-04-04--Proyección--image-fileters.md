---
title: "Filtración de imágenes interactivas con la tranformada de Fourier discreta (DFT)"
date: '2024-01-15 10:30:00 +0100' # CHANGE THIS to your desired publication date/time/zone
categories:   experimento optimización análisis hilbert imagen proyección aplicaciones
tags: [Hilbert, proyección ortogonal, DFT, transformada fourier, filtro, imagen, procesamiento señal,]
permalink: "/MatExp/analisis/hilbert/filtro-imagen"
header:
  image: "/assets/MatExp/analisis/hilbert/image-filter/header.jpg"
excerpt: "Descubre cómo se pueden filtrar imágenes usando la Transformada Discreta de Fourier (DFT) con esta demostración interactiva. Sube una imagen, observa su transformación al dominio de las frecuencias, aplica distintos filtros (paso bajo, paso alto o de banda) y compara el espectro y la imagen resultante. Una forma visual de entender cómo funciona el procesamiento de imágenes y su relación con la proyección ortogonal en un espacio de Hilber."
feature: "/assets/MatExp/analisis/hilbert/image-filter/feature.jpg"
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

    .quick-nav {
        margin: 0 auto 30px;
        padding: 15px 12px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f8f9fa 0%, #eef1f5 100%);
        border: 1px solid #dee2e6;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .quick-nav ul {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        list-style: none;
        padding: 0;
        margin: 0;
        gap: 8px;
    }

    .quick-nav li {
        margin: 0;
    }

    .quick-nav a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 15px 7px 8px;
        border-radius: 22px;
        background: #ffffff;
        border: 1px solid #d0d7de;
        text-decoration: none;
        font-size: 0.82em;
        font-weight: 500;
        color: #3d4f61;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        white-space: nowrap;
        line-height: 1;
    }

    .quick-nav .step-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 21px;
        height: 21px;
        border-radius: 50%;
        background: #e4eaf2;
        color: #2563eb;
        font-size: 0.82em;
        font-weight: 700;
        flex-shrink: 0;
    }

    .quick-nav a:hover {
        background: #2563eb;
        border-color: #1d4ed8;
        color: #ffffff;
        transform: translateY(-2px);
        box-shadow: 0 5px 14px rgba(37,99,235,0.28);
        text-decoration: none;
    }

    .quick-nav a:hover .step-num {
        background: rgba(255,255,255,0.22);
        color: #ffffff;
    }

    .input-methods,
    .inline-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin: 12px 0;
    }

    .input-methods label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
    }

    #fileSection,
    #librarySection {
        margin-top: 12px;
    }

    .helper-text {
        margin: 10px auto 0;
        max-width: 90%;
        color: #5f6b77;
        font-size: 0.95em;
        text-align: center;
    }


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
        .quick-nav ul,
        .input-methods,
        .inline-controls {
            flex-direction: column;
            align-items: center;
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

    /* Modal styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.6);
        z-index: 1200;
        padding: 20px;
    }
    .modal.active { display: flex; }
    .modal-dialog {
        background: #fff;
        max-width: 980px;
        width: 100%;
        max-height: 85vh;
        overflow: auto;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:12px;
    }
    .modal-close {
        background:transparent;
        border:0;
        font-size:1.1rem;
        cursor:pointer;
    }
    .open-modal {
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:6px 10px;
        border-radius:6px;
        border:1px solid #d0d7de;
        background:#fff;
        cursor:pointer;
    }
    .open-modal:focus { outline:2px solid #2563eb; }
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


    <!-- Modales con las explicaciones técnicas (ocultas por defecto) -->
    <div id="modal-filter-explanation" class="modal" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-header">
                <h3>¿Cómo funcionan los filtros en el dominio de la frecuencia?</h3>
                <button class="modal-close" aria-label="Cerrar">✕</button>
            </div>
            <div class="modal-body">
                <p>La Transformada de Fourier descompone una imagen en sus componentes de frecuencia. Cada punto en el espectro de Fourier representa una frecuencia específica (rapidez del cambio de intensidad) en una dirección particular:</p>
                <ul>
                    <li><strong>Bajas frecuencias (cerca del centro del espectro):</strong> Representan cambios suaves y graduales en la imagen (áreas uniformes, brillo general).</li>
                    <li><strong>Altas frecuencias (lejos del centro del espectro):</strong> Representan cambios bruscos y detalles finos (bordes, texturas, ruido).</li>
                </ul>
                <p>El filtrado en el dominio de la frecuencia consiste en <strong>modificar (multiplicar) el espectro de Fourier</strong> de la imagen con una <strong>función de transferencia del filtro (máscara de filtro)</strong> y luego aplicar la Transformada Inversa de Fourier (IDFT) para obtener la imagen filtrada.</p>
            </div>
        </div>
    </div>

    <div id="modal-filter-types" class="modal" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-header">
                <h3>Tipos de filtros y nota sobre coeficientes DFT</h3>
                <button class="modal-close" aria-label="Cerrar">✕</button>
            </div>
            <div class="modal-body">
                <h4>Filtro Paso Bajo (LPF)</h4>
                <p>Conserva las frecuencias bajas y elimina (pone a cero) las altas frecuencias por encima de una frecuencia de corte (D₀).</p>
                <ul>
                    <li>Suaviza la imagen (efecto de desenfoque).</li>
                    <li>Reduce el ruido de alta frecuencia.</li>
                    <li>Elimina detalles finos y texturas.</li>
                </ul>
                <div class="fourier-interpretation">
                    <p><strong>Máscara de Filtro:</strong> Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro ≤ D₀) se mantienen (multiplican por 1), y los de fuera se anulan (multiplican por 0).</p>
                </div>

                <h4>Filtro Paso Alto (HPF)</h4>
                <p>Conserva las frecuencias altas y elimina (pone a cero) las bajas frecuencias por debajo de una frecuencia de corte (D₀).</p>
                <ul>
                    <li>Resalta los bordes y detalles finos.</li>
                    <li>Atenúa las variaciones suaves (componente de baja frecuencia).</li>
                    <li>Puede amplificar el ruido.</li>
                </ul>
                <div class="fourier-interpretation">
                    <p><strong>Máscara de Filtro:</strong> Se crea una máscara circular en el espectro centrado. Los coeficientes dentro del círculo (distancia al centro &lt; D₀) se anulan (multiplican por 0), y los de fuera se mantienen (multiplican por 1).</p>
                </div>

                <h4>Filtro Paso Banda (BPF)</h4>
                <p>Conserva un rango específico de frecuencias entre un límite inferior y superior (o centrado en D₀ con un cierto ancho).</p>
                <ul>
                    <li>Permite aislar características o texturas de un tamaño específico.</li>
                    <li>Elimina tanto las frecuencias muy bajas como las muy altas.</li>
                </ul>
                <div class="fourier-interpretation">
                    <p><strong>Máscara de Filtro:</strong> Se crea una máscara en forma de anillo en el espectro centrado. Los coeficientes dentro del anillo (distancia al centro entre D₁ y D₂) se mantienen (multiplican por 1), y los demás se anulan (multiplican por 0).</p>
                </div>

                <div class="mathematical-note">
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
    </div>

    <div id="modal-spectrum-explanation" class="modal" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-header">
                <h3>Interpretación del Espectro de Frecuencia</h3>
                <button class="modal-close" aria-label="Cerrar">✕</button>
            </div>
            <div class="modal-body">
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
        </div>
    </div>

    <script>
    // Modal open/close handlers
    document.querySelectorAll('.open-modal').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            const id = btn.getAttribute('data-modal');
            const m = document.getElementById(id);
            if(m) m.classList.add('active');
        });
    });
    document.addEventListener('click', e=>{
        if(e.target.classList && e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    document.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click', ()=>{
        b.closest('.modal').classList.remove('active');
    }));
    document.addEventListener('keydown', e=>{
        if(e.key==='Escape') document.querySelectorAll('.modal.active').forEach(m=>m.classList.remove('active'));
    });
    </script>

    <script src="/assets/js/image-dft-demo.js"></script>
    <script src="/assets/js/image-dft-demo.js"></script>

    <nav class="quick-nav" aria-label="Navegación rápida">
        <ul>
            <li><a href="#imageInputSection"><span class="step-num">1</span> Seleccionar Imagen</a></li>
            <li><a href="#imageDisplaySection"><span class="step-num">2</span> Imagen Base</a></li>
            <li><a href="#filterTheorySection"><span class="step-num">3</span> Filtros</a></li>
            <li><a href="#filterControlsSection"><span class="step-num">4</span> Controles</a></li>
            <li><a href="#spectrumSection"><span class="step-num">5</span> Espectro</a></li>
            <li><a href="#resultsSection"><span class="step-num">6</span> Resultados</a></li>
            <li><a href="#logSection"><span class="step-num">7</span> Registro</a></li>
        </ul>
    </nav>

<!-- Section: Input -->
<div class="content-section input-section" id="imageInputSection">
    <h2>1. Selección de Imagen</h2>
    <div class="input-methods">
        <label><input type="radio" name="inputMethod" value="file" checked> Subir imagen propia</label>
        <label><input type="radio" name="inputMethod" value="library"> Usar imagen de biblioteca</label>
    </div>
    <div id="fileSection">
        <input type="file" id="imageFile" accept="image/*">
        <p class="helper-text">Puedes seguir usando cualquier imagen propia. Se redimensionará automáticamente a un máximo de 250x250 píxeles.</p>
    </div>
    <div id="librarySection" style="display:none;">
        <div class="inline-controls">
            <label for="libraryImageSelect">Imagen precalculada</label>
            <select id="libraryImageSelect" disabled>
                <option value="">Cargando biblioteca...</option>
            </select>
        </div>
        <p class="helper-text">Estas imágenes de <strong>assets/image-samples</strong> ya incluyen su versión en gris, la DFT y filtros precalculados para corte 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80% y 90%.</p>
    </div>
</div>

<!-- Section: Image Display -->
<!-- Raw HTML for layout container -->
<div class="image-display" id="imageDisplaySection">
    <!-- Raw HTML for image container -->
    <div class="image-container">
        <!-- HTML H3 -->
        <h3>2. Imagen Original (Redimensionada y en Gris)</h3>
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
<div class="content-section fourier-coefficients" id="filterTheorySection">
    <h2>3. Filtros y Coeficientes de Fourier</h2>

    <!-- Raw HTML for styled explanation block -->
    <div class="filter-explanation">
        <h3>¿Cómo funcionan los filtros en el dominio de la frecuencia?</h3>
        <p>Resumen: La DFT descompone la imagen en sus componentes de frecuencia; use el botón para ver la explicación técnica completa.</p>
        <button class="open-modal" data-modal="modal-filter-explanation">Ver explicación técnica</button>
    </div>

    <!-- Raw HTML for styled explanation block -->
    <div class="filter-types">
        <h3>Tipos de Filtros Ideales:</h3>
        <p>(Estos son filtros ideales con cortes abruptos, usados aquí con fines demostrativos)</p>
        <p>Resumen: Hay filtros Paso Bajo, Paso Alto y Paso Banda; pulse para ver las definiciones y la nota matemática.</p>
        <button class="open-modal" data-modal="modal-filter-types">Ver tipos y nota matemática</button>
    </div>
</div>


<!-- Raw HTML for filter controls container -->
<div class="filter-controls" id="filterControlsSection">
    <!-- HTML H3 -->
    <h3>4. Controles del Filtro</h3>
    <!-- Raw HTML for select, range slider, span, and button -->
    <select id="filterType">
        <option value="lowpass">Paso Bajo</option>
        <option value="highpass">Paso Alto</option>
        <option value="bandpass">Paso Banda</option>
    </select>
    <div id="manualFilterControls" class="filter-params">
        <label for="cutoffFreq">Frecuencia de Corte Relativa (%):</label>
        <input type="range" id="cutoffFreq" name="cutoffFreq" min="1" max="99" value="50">
        <span id="cutoffValue">50%</span> <!-- To display the value -->
    </div>
    <div id="libraryFilterControls" class="inline-controls" style="display:none;">
        <label for="precomputedCutoffSelect">Corte precalculado</label>
        <select id="precomputedCutoffSelect" disabled>
            <option value="">Selecciona un corte</option>
        </select>
    </div>
    <p id="libraryPrecomputedHint" class="helper-text" style="display:none;">En modo biblioteca se cargan resultados precalculados para cada combinación de filtro y corte, sin recalcular la DFT/IDFT en el navegador.</p>
    <button id="applyFilter">Aplicar Filtro y Calcular IDFT</button>
</div>


<!-- Section: Spectrum -->
<div class="content-section spectrum-section" id="spectrumSection">
    <h2>5. Espectro de Frecuencia (Magnitud DFT)</h2>

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
        <h4>Interpretación del Espectro de Frecuencia (Visualización Centrada)</h4>
        <p>Resumen: el espectro muestra la magnitud de los coeficientes con DC céntrico; abra la explicación técnica para más detalles.</p>
        <button class="open-modal" data-modal="modal-spectrum-explanation">Ver explicación técnica</button>
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
<div class="content-section results-section" id="resultsSection">
    <h2>6. Resultados del Filtrado</h2>

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
<div class="content-section log-section" id="logSection">
    <h2>7. Registro de Progreso</h2>

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

<script src="/assets/js/image-dft-demo.js"></script>