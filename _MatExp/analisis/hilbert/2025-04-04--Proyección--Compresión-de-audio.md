---
title: Demostración Interactiva - Compresión de Audio con DFT
date: '2024-01-15 10:30:00 +0100' # CHANGE THIS to your desired publication date/time/zone
categories:
  experimento optimización análisis hilbert audio proyección aplicaciones
tags: [Hilbert, proyección ortogonal, DFT, transformada fourier, compresión audio, procesamiento señal,]
permalink: "/MatExp/analisis/hilbert/compresion-audio"
header:
  image: "/assets/MatExp/analisis/hilbert/audio/header.jpg"
excerpt: "Explora cómo se comprime el sonido con una demostración interactiva basada en la Transformada Discreta de Fourier (DFT). Sube o graba tu propio audio, observa cómo se transforma en frecuencias, elimina los componentes menos importantes y escucha cómo cambia el resultado. Una forma visual y práctica de entender la proyección ortonormal en espacios de Hilbert."
feature: "/assets/MatExp/analisis/hilbert/audio-conversion/feature.jpg"
---

<!-- Embedded CSS -->
<style>
    /* --- START OF EMBEDDED CSS --- */

    /* Specific container styles */
    .dft-app-container {
        background: #fff; /* Keep specific background */
        padding: 20px;
        border-radius: 8px;
        width: 95%;
        max-width: 1200px; /* Keep max-width for app constraint */
        margin: 20px auto; /* Keep centering and spacing */
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Keep specific shadow */
        text-align: center; /* Keep centering for controls */
    }

    /* Specific log styles */
    .dft-app-container #progressLog {
        background: #222;
        color: #0f0;
        font-family: monospace; /* Keep monospace for log */
        font-size: 0.9em;
        text-align: left;
        padding: 10px;
        height: 120px;
        overflow-y: auto;
        border: 1px solid #444;
        margin: 10px auto;
        max-width: 95%;
        white-space: pre-wrap;
    }

    /* Specific canvas styles */
    .dft-app-container #audioCanvas {
        border: 1px solid #ccc;
        width: 100%;
        height: 150px; /* Keep explicit height */
        margin: 15px 0;
        display: block;
        background-color: #f9f9f9;
    }

    /* Specific list display styles */
    .dft-app-container #audioValuesList,
    .dft-app-container #reconstructedAudioValuesList,
    .dft-app-container #dftCoefficientsList {
        /* font-family: monospace; */ /* Removed, theme likely handles pre/code */
        font-size: 0.8em; /* Keep specific smaller size */
        text-align: left;
        padding: 10px;
        border: 1px solid #ccc;
        margin: 10px auto;
        max-width: 95%;
        overflow-x: auto;
        background-color: #f9f9f9;
        min-height: 40px;
        white-space: pre-wrap;
    }
    .dft-app-container #dftCoefficientsList {
        background-color: #f0f5fa; /* Keep distinct background */
    }

    /* Section basic structure handled by theme - removing generic section rules */

    /* Introduction & Context Specific Styles */
    .dft-app-container .intro-section,
    .dft-app-container .context-section {
        /* Keep specific backgrounds and borders */
        border: 1px solid #d1ecf1;
        background-color: #f0f8ff;
        padding: 20px; /* Add padding back as section styling was removed */
        margin-bottom: 25px; /* Add margin back */
        border-radius: 8px; /* Add radius back */
        text-align: left; /* Add text-align back */
    }
    .dft-app-container .context-section {
        border-color: #d4edda;
        background-color: #f8fff9;
    }
    /* Style headings within these specific sections if needed */
    .dft-app-container .intro-section h2 {
        color: #0c5460;
        border-bottom: 1px solid #bee5eb;
        text-align: center; /* Keep centering for these specific headings */
        /* Let theme handle font-size, margin, padding */
    }
     .dft-app-container .intro-section .intro-content { color: #0c5460; } /* Keep text color */

     .dft-app-container .context-section h3 {
        color: #155724;
        border-bottom: 1px dashed #c3e6cb;
        text-align: center; /* Keep centering */
        /* Let theme handle font-size, margin, padding */
    }
    .dft-app-container .context-section .context-content { color: #155724; } /* Keep text color */


    /* --- Styles for Notification Area --- */
    .dft-app-container .notification {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
        padding: 12px 20px;
        margin: 0 auto 20px auto;
        border-radius: 8px;
        font-size: 0.95em;
        text-align: center;
        max-width: 90%;
        animation: dftFadeIn 0.5s ease-in;
    }
    @keyframes dftFadeIn { from { opacity: 0; } to { opacity: 1; } }


    /* --- Waveform Legend Styles --- */
    .dft-app-container .waveform-legend {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 10px;
        font-size: 0.9em;
        text-align: center;
    }
    .dft-app-container .legend-item {
        display: flex;
        align-items: center;
        margin: 5px 15px;
    }
    .dft-app-container .color-box {
        display: inline-block;
        width: 25px;
        height: 12px;
        margin-right: 8px;
        border-radius: 3px;
        vertical-align: middle;
    }
    .dft-app-container .original-color { background-color: #3498db; }
    .dft-app-container .reconstructed-color { background-color: #e67e22; }


    /* --- Quick Navigation Styles --- */
    .dft-app-container .quick-nav {
    margin: 0 auto 20px;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
    border-top: 1px solid #eee;
}

.dft-app-container .quick-nav ul {
    display: flex;
    flex-direction: column; /* ← clave para lista vertical */
    align-items: center;     /* centra horizontalmente los items */
    list-style: none;
    padding: 0;
    margin: 0;
}

.dft-app-container .quick-nav li {
    margin: 8px 0; /* más margen vertical */
}

.dft-app-container .quick-nav a {
    padding: 5px 10px;
    border-radius: 5px;
    transition: all 0.3s ease;
    font-size: 0.9em;
    display: inline-block;
}

.dft-app-container .quick-nav a:hover {
    background-color: #f0f0f0;
    color: #2980b9;
}



    /* --- Consolidated Button Styles --- */
    /* Assume theme handles base button: font, padding, border, base margin */
    .dft-app-container button {
         margin: 6px; /* Keep margin for spacing in containers */
         transition: all 0.2s ease; /* Keep transition */
         border: none; /* Override theme border if necessary */
         border-radius: 6px; /* Keep specific radius */
         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15); /* Keep shadow */
         border-bottom-width: 3px; /* Keep border effect */
         border-bottom-style: solid; /* Keep border effect */
    }
    /* Keep specific button type colors/styles */
    .dft-app-container .primary-button { background-color: #2563eb; border-bottom-color: #1e40af; color: white; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2); }
    .dft-app-container .primary-button:hover:not(:disabled) { background-color: #1d4ed8; }
    .dft-app-container .secondary-button { background-color: #10b981; border-bottom-color: #059669; color: white; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2); }
    .dft-app-container .secondary-button:hover:not(:disabled) { background-color: #059669; }
    .dft-app-container .action-button { background-color: #f97316; border-bottom-color: #ea580c; color: white; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2); }
    .dft-app-container .action-button:hover:not(:disabled) { background-color: #ea580c; }
    .dft-app-container .reset-button { background-color: #dc3545; border-bottom-color: #a71d2a; color: white; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2); }
    .dft-app-container .reset-button:hover:not(:disabled) { background-color: #c82333; }
    /* Keep hover/active/disabled effects */
     .dft-app-container button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .dft-app-container button:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        border-bottom-width: 2px;
        margin-top: 7px; /* Adjust margin for active state */
    }
     .dft-app-container button:disabled {
        background-color: #b8b8b8;
        cursor: not-allowed;
        opacity: 0.7;
        transform: none;
        box-shadow: none;
        border-bottom-color: #999;
    }
    /* Keep layout container */
    .dft-app-container .button-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin: 15px 0;
        text-align: center;
    }


    /* --- Input and Control Styles --- */
    .dft-app-container .controls,
    .dft-app-container .inline-controls {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        margin: 15px 0;
        gap: 10px;
    }
     .dft-app-container .controls label,
     .dft-app-container .inline-controls label {
         display: inline-flex; /* Keep alignment */
         align-items: center; /* Keep alignment */
         margin: 0 5px; /* Keep spacing */
         /* font-size, color handled by theme */
     }
     .dft-app-container .controls input[type="radio"] {
        margin-right: 5px; /* Keep spacing */
    }
      .dft-app-container .inline-controls input[type="number"] {
          width: 80px; /* Keep specific width */
          text-align: right; /* Keep alignment */
          margin: 0 5px; /* Keep spacing */
          /* padding, border, radius, font-size handled by theme */
      }
      .dft-app-container input[type="file"] {
         display: block; /* Keep block */
         margin: 15px auto; /* Keep centering */
         max-width: 90%; /* Keep max width */
         /* padding, border, radius handled by theme */
     }
     /* Removed P styles for file/live sections */


    /* --- Side-by-side values comparison --- */
    .dft-app-container .values-comparison {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 15px;
    }
    .dft-app-container .values-column {
        flex: 1;
        min-width: 280px;
    }
    .dft-app-container .values-column h3 {
        margin-bottom: 10px;
        font-size: 1.1em; /* Keep specific size */
        color: #2c3e50; /* Keep specific color */
        padding-bottom: 5px;
        border-bottom: 1px dashed #ddd; /* Keep specific border */
        text-align: center;
    }

    /* --- Progress Overlay Styles --- */
    #dftProgressOverlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: none;
        justify-content: center; align-items: center;
        color: white; font-size: 1.5em; text-align: center;
        backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    }
    #dftProgressOverlay .dft-progress-content {
        padding: 30px;
        background-color: rgba(44, 62, 80, 0.95);
        border-radius: 15px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        max-width: 90%;
    }
     #dftProgressOverlay .dft-loader {
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 50px; height: 50px;
        animation: dftSpin 1.5s linear infinite;
        margin: 20px auto 10px;
    }
    @keyframes dftSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    #dftProgressOverlay .dft-calculation-warning {
        font-size: 0.7em; color: #ffcc80;
        margin-top: 10px; font-style: italic;
    }


    /* --- Responsive Media Queries --- */
    @media (max-width: 768px) {
         /* Removed redundant container/heading styles */
        .dft-app-container .button-container {
            flex-direction: column; align-items: stretch;
        }
        .dft-app-container .button-container button {
            width: 100%; max-width: none; margin: 5px 0;
        }
        .dft-app-container .inline-controls,
        .dft-app-container .controls {
            flex-direction: column; align-items: center; gap: 10px;
        }
        .dft-app-container .quick-nav ul { flex-direction: column; align-items: center; }
        .dft-app-container .quick-nav li { margin: 5px 0; }
        .dft-app-container .values-comparison { flex-direction: column; gap: 10px; }
        .dft-app-container .values-column { min-width: 100%; margin-bottom: 10px; }
        .dft-app-container .values-list,
        .dft-app-container .coefficients-list,
        .dft-app-container #progressLog { font-size: 0.75em; max-width: 100%; } /* Keep specific size */
        .dft-app-container #audioCanvas { height: 120px; } /* Keep specific height */
    }

     @media (max-width: 480px) {
         /* Removed redundant container/heading styles */
         .dft-app-container .values-list,
         .dft-app-container .coefficients-list,
         .dft-app-container #progressLog { font-size: 0.7em; padding: 8px; } /* Keep specific size/padding */
         .dft-app-container .quick-nav a { font-size: 0.85em; padding: 4px 8px;} /* Keep specific size/padding */
         .dft-app-container button { font-size: 0.9em; padding: 8px 12px; } /* Keep specific size/padding */
         .dft-app-container .controls label,
         .dft-app-container .inline-controls label { font-size: 0.9em; } /* Keep specific size */
         .dft-app-container .inline-controls input[type="number"] { width: 70px; font-size: 0.9em; } /* Keep specific size/width */
         .dft-app-container #audioCanvas { height: 100px; } /* Keep specific height */
     }

    /* --- END OF EMBEDDED CSS --- */
</style>

<!-- You can add introductory Markdown text here if needed -->

Este post incluye una demostración interactiva sobre la Transformada Discreta de Fourier (DFT) y su aplicación básica en la compresión de audio. Puedes cargar un archivo WAV o grabar audio, calcular la DFT, truncar los coeficientes y reconstruir la señal para ver y escuchar el efecto.

**Nota:** Esta es una herramienta educativa y no optimizada para compresión real.

---

<!-- HTML Content for the Application -->
<div class="dft-app-container"> <!-- Added specific wrapper -->
    <h1>Compresión de Audio con Transformada Discreta de Fourier (DFT)</h1>

    <!-- Introduction Section -->
    <section class="intro-section">
        <div class="intro-content">
            <h2>Acerca de esta aplicación</h2>
            <p>Esta aplicación web ha sido diseñada con fines exclusivamente educativos para ilustrar los principios
                matemáticos de la Transformada Discreta de Fourier (DFT) y su aplicación en el procesamiento de
                señales de audio.</p>
            <p>El objetivo principal es demostrar de manera práctica cómo funciona la proyección ortogonal en
                espacios de Hilbert, permitiendo representar una señal de audio mediante una serie de coeficientes
                espectrales y reconstruirla posteriormente con diferente grado de precisión según el número de
                coeficientes utilizados.</p>
            <p><strong>Importante:</strong> Esta herramienta no está optimizada para comprimir archivos de audio en
                un entorno profesional. Para la compresión de audio con fines prácticos, existen numerosos programas
                gratuitos especializados que implementan algoritmos mucho más eficientes (MP3, AAC, Opus, etc.).</p>
        </div>
    </section>

    <!-- Context Description -->
    <section class="context-section">
        <div class="context-content">
            <h3>¿Qué hace esta herramienta?</h3>
            <p>Esta aplicación te permite experimentar con la compresión de audio mediante el siguiente proceso:</p>
            <ol>
                <li><strong>Selección de audio:</strong> Carga un archivo WAV o graba audio con tu micrófono (máximo 2 segundos procesados).</li>
                <li><strong>Conversión de audio en vector ℓ²:</strong> La señal de audio (o un segmento inicial) se convierte en un vector numérico.</li>
                <li><strong>Análisis DFT:</strong> La señal se transforma al dominio de la frecuencia, calculando sus componentes espectrales (coeficientes DFT).</li>
                <li><strong>Truncamiento (Simulación de Compresión):</strong> Selecciona cuántos de los coeficientes DFT iniciales deseas mantener. Los demás se descartan (se ponen a cero).</li>
                <li><strong>Reconstrucción (IDFT):</strong> Se aplica la Transformada Inversa de Fourier (IDFT) a los coeficientes mantenidos para reconstruir una versión aproximada de la señal original.</li>
                <li><strong>Comparación:</strong> Visualiza las formas de onda, compara los valores numéricos y escucha las diferencias entre el audio procesado original y el reconstruido. Observa cómo el número de coeficientes afecta a la calidad y fidelidad de la reconstrucción.</li>
            </ol>
             <p>Al reducir el número de coeficientes, estás aplicando un principio fundamental del análisis
                funcional: aproximar una función (la señal de audio) mediante la proyección en un subespacio de dimensión finita (generado por los primeros coeficientes DFT) dentro del espacio de Hilbert L² donde vive la señal. La señal reconstruida es la mejor aproximación posible en el sentido de la norma ℓ² (error cuadrático mínimo) dentro de ese subespacio.</p>
        </div>
    </section>

    <!-- Trimming Notification Area -->
    <div id="trimmingNotification" class="notification" style="display: none;">
        <!-- Message will be set by JavaScript -->
    </div>

    <!-- Quick Navigation -->
    <nav class="quick-nav">
        <ul>
            <li><a href="#dftInputSection">1. Seleccionar Audio</a></li>
            <li><a href="#dftCalcSection">2. Calcular DFT</a></li>
            <li><a href="#dftCoeffSection">3. Coeficientes</a></li>
            <li><a href="#dftReconSection">4. Reconstrucción</a></li>
            <li><a href="#dftWaveformSection">5. Forma de Onda</a></li>
            <li><a href="#dftCompareSection">6. Comparación</a></li>
            <li><a href="#dftLogSection">7. Registro</a></li>
        </ul>
    </nav>

    <!-- Renamed IDs for sections to be more specific -->
    <section id="dftInputSection">
        <h2>1. Selección de Audio</h2>
        <div class="controls">
            <label><input type="radio" name="inputMethod" value="file" checked> Cargar archivo WAV</label>
            <label><input type="radio" name="inputMethod" value="live"> Grabar con micrófono</label>
        </div>
        <div id="fileSection">
            <input type="file" id="audioFile" accept="audio/wav,audio/wave,audio/x-wav,.wav">
            <p>Nota: Audios largos (> 2s) serán recortados para el análisis.</p>
        </div>
        <div id="liveSection" style="display:none;">
            <div class="button-container">
                <button id="startRec" class="action-button">Iniciar Grabación (máx ~10s)</button>
                <button id="stopRec" class="action-button" disabled>Detener Grabación</button>
            </div>
            <p>Nota: Grabaciones largas (> 2s) serán recortadas para el análisis.</p>
        </div>
    </section>

    <section id="dftCalcSection">
        <h2>2. Calcular DFT</h2>
         <p>Calcula la Transformada Discreta de Fourier de los primeros 2 segundos del audio seleccionado.</p>
        <div class="button-container">
            <button id="compressBtn" class="primary-button" disabled>Calcular DFT del Audio (máx 2s)</button>
        </div>
    </section>

    <section id="dftCoeffSection">
        <h2>3. Coeficientes DFT Resultantes (Complejos)</h2>
        <div class="inline-controls">
            <label for="numCoefficientsInput">Mostrar primeros</label>
            <input type="number" id="numCoefficientsInput" value="10" min="1">
            <label>coeficientes:</label>
        </div>
        <div id="dftCoefficientsList" class="coefficients-list">[Selecciona un audio y calcula la DFT para ver los coeficientes]</div>
    </section>

    <section id="dftReconSection">
        <h2>4. Reconstrucción (Truncamiento + IDFT)</h2>
         <p>Selecciona cuántos coeficientes DFT (del paso 3) usar para reconstruir el audio mediante la IDFT. Menos coeficientes simulan mayor compresión.</p>
        <div class="inline-controls">
            <label for="numTruncateCoefficientsInput">Mantener primeros</label>
            <input type="number" id="numTruncateCoefficientsInput" value="10000" min="0">
            <label>coeficientes DFT</label> <!-- Simplified label -->
        </div>
        <div class="button-container">
            <button id="reconstructBtn" class="primary-button" disabled>Reconstruir Audio</button>
            <button id="playOriginalBtn" class="secondary-button" disabled>Reproducir Original (Completo)</button>
            <button id="playReconstructedBtn" class="secondary-button" disabled>Reproducir Reconstruido</button>
            <button id="clearAudioBtn" class="reset-button" style="display: none;">Limpiar Audio y Reiniciar</button>
        </div>
    </section>

    <section id="dftWaveformSection">
        <h2>5. Forma de Onda Comparativa</h2>
         <p>Visualización de la señal de audio procesada (azul) y la señal reconstruida (naranja) superpuestas.</p>
        <canvas id="audioCanvas" height="150"></canvas>
        <div class="waveform-legend">
            <span class="legend-item"><span class="color-box original-color"></span> Audio Original Procesado (max 2s)</span>
            <span class="legend-item"><span class="color-box reconstructed-color"></span> Audio Reconstruido</span>
        </div>
    </section>

    <section id="dftCompareSection">
        <h2>6. Comparación de Valores Numéricos (Vectores ℓ²)</h2>
         <p>Compara los valores numéricos iniciales de la señal procesada y la reconstruida.</p>
        <div class="inline-controls">
            <label for="numValuesInput">Mostrar primeros</label>
            <input type="number" id="numValuesInput" value="10" min="1">
            <label>valores:</label>
        </div>
        <div class="values-comparison">
             <div class="values-column">
                 <h3>Audio Original Procesado</h3>
                 <div id="audioValuesList" class="values-list">[Valores del audio procesado...]</div>
             </div>
             <div class="values-column">
                 <h3>Audio Reconstruido</h3>
                 <div id="reconstructedAudioValuesList" class="values-list">[Valores del audio reconstruido...]</div>
             </div>
         </div>
         <!-- Note: Table version removed for simplicity in single file -->
    </section>

    <section id="dftLogSection">
        <h2>7. Registro de Progreso</h2>
        <div id="progressLog"> <!-- Removed class="log" as it's styled by ID -->
            [Registro de eventos y progreso del proceso...]
        </div>
    </section>

</div> <!-- End of .dft-app-container -->

<!-- Progress Overlay HTML (keep outside main container for full screen) -->
<!-- Using prefixed ID -->
<div id="dftProgressOverlay">
    <div class="dft-progress-content"> <!-- Prefixed class -->
        <p>Procesando...</p>
        <div class="dft-loader"></div> <!-- Prefixed class -->
        <p class="dft-calculation-warning">
  Estos cálculos no están optimizados y pueden tardar. Si el navegador indica que la página no responde, puedes ignorar el aviso.
</p>
<p class="dft-calculation-warning" style="font-size: 12pt; margin-top: 5px;">
  Los cálculos siguen ejecutándose en segundo plano.
</p>
 <!-- Prefixed class -->
    </div>
</div>

<!-- You can add concluding Markdown text here if needed -->

---

<!-- Embedded JavaScript -->
<script>
    // --- START OF EMBEDDED JAVASCRIPT ---
    (function() { // Optional IIFE to scope variables

        // --- START: Added Code for Progress Overlay ---
        // Use prefixed ID
        const progressOverlay = document.getElementById('dftProgressOverlay');
        const trimmingNotification = document.getElementById('trimmingNotification');
        let clearAudioBtn = null; // Assigned in 'load'/'DOMContentLoaded'

        function showProgressOverlay(message = "Procesando...") {
            if (progressOverlay) {
                // Use prefixed class
                const messageElement = progressOverlay.querySelector('.dft-progress-content p:first-of-type');
                if (messageElement) {
                     messageElement.textContent = message;
                }
                if (progressOverlay.style.display !== 'flex') {
                    progressOverlay.style.display = 'flex';
                    console.log("Showing DFT progress overlay:", message);
                } else {
                    console.log("Updating DFT progress overlay message:", message);
                }
            } else {
                console.error("DFT Progress overlay element not found!");
            }
        }

        function hideProgressOverlay() {
            if (progressOverlay) {
                if (progressOverlay.style.display !== 'none') {
                    progressOverlay.style.display = 'none';
                    console.log("Hiding DFT progress overlay");
                }
            } else {
                console.error("DFT Progress overlay element not found!");
            }
        }
        // --- END: Added Code for Progress Overlay ---


        // Objeto para representar números complejos
        function Complex(real, imaginary) {
            this.real = real;
            this.imaginary = imaginary;
        }
        Complex.prototype.magnitude = function () {
            return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
        };
        Complex.prototype.add = function (complex) {
            return new Complex(this.real + complex.real, this.imaginary + complex.imaginary);
        };
        Complex.prototype.subtract = function (complex) {
            return new Complex(this.real - complex.real, this.imaginary - complex.imaginary);
        };
        Complex.prototype.multiply = function (complex) {
            const realPart = (this.real * complex.real) - (this.imaginary * complex.imaginary);
            const imaginaryPart = (this.real * complex.imaginary) + (this.imaginary * complex.real);
            return new Complex(realPart, imaginaryPart);
        };


        // Función DFT
        function calculateDFT(samples) {
            console.log("calculateDFT: Iniciando cálculo DFT COMPLEJA con " + samples.length + " muestras.");
            const N = samples.length;
            const numCoefficients = Math.floor(N / 2);
            if (numCoefficients <= 0) {
                console.warn("calculateDFT: Número insuficiente de muestras (N/2 <= 0). Retornando espectro vacío.");
                return [];
            }
            const spectrum = new Array(numCoefficients).fill(null).map(() => new Complex(0, 0));
            // console.log("calculateDFT: Calculando " + numCoefficients + " coeficientes DFT complejos:"); // Verbose

            for (let k = 0; k < numCoefficients; k++) {
                let realSum = 0;
                let imagSum = 0;
                for (let n = 0; n < N; n++) {
                    const angle = (2 * Math.PI * k * n) / N;
                    realSum += samples[n] * Math.cos(angle);
                    imagSum -= samples[n] * Math.sin(angle);
                }
                spectrum[k] = new Complex(realSum, imagSum);
            }
            console.log("calculateDFT: Cálculo DFT COMPLEJA completado. Espectro de tamaño: " + spectrum.length);
            return spectrum;
        }


        // Variables globales específicas de esta instancia
        let mediaRecorder, recordedBuffer = null;
        let currentAudioData = null;
        let fullAudioValuesList = null;
        let fullDFTCoefficientsList = null;
        let reconstructedAudioBuffer = null;
        let fullReconstructedAudioValuesList = null;
        let originalAudioBuffer = null;
        let audioContext = null;
        let currentAudioSource = null; // For stopping playback


        // --- Initialize Audio Context ---
        function getAudioContext() {
            if (!audioContext) {
                try {
                    // Use || for broader browser compatibility check
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) {
                         throw new Error("Web Audio API no soportada por este navegador.");
                    }
                    audioContext = new AudioContextClass();
                    console.log(`DFT Demo: AudioContext inicializado. Sample Rate: ${audioContext.sampleRate}Hz`);
                     // Handle state changes (e.g., context suspended by browser)
                     audioContext.onstatechange = () => {
                         console.log(`DFT Demo: AudioContext state changed to: ${audioContext.state}`);
                         logProgress(`Estado del AudioContext: ${audioContext.state}`);
                         if (audioContext.state === 'suspended') {
                            logProgress("AudioContext suspendido. Interacción del usuario (click) podría ser necesaria para reanudar.");
                         }
                     };
                } catch (e) {
                    console.error("DFT Demo: Error creating AudioContext:", e);
                    alert("Error: No se pudo inicializar el contexto de audio. " + e.message);
                    return null;
                }
            }
             // Attempt to resume context if suspended (requires user interaction usually)
             if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log("DFT Demo: AudioContext resumed successfully.");
                }).catch(err => {
                     console.error("DFT Demo: Error resuming AudioContext:", err);
                });
            }
            return audioContext;
        }


        // Función para añadir mensajes al log
        function logProgress(message) {
            const logDiv = document.getElementById("progressLog");
            if (logDiv) {
                const timestamp = new Date().toLocaleTimeString();
                logDiv.textContent += `[${timestamp}] ${message}\n`;
                logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll
            } else {
                console.warn("DFT Demo: Log element 'progressLog' not found");
            }
        }

        // Reset application state
        function resetAppState() {
            logProgress("Estado reiniciado.");
            currentAudioData = null;
            fullAudioValuesList = null;
            fullDFTCoefficientsList = null;
            reconstructedAudioBuffer = null;
            fullReconstructedAudioValuesList = null;
            originalAudioBuffer = null;
            recordedBuffer = null;
             if (currentAudioSource) { // Stop any playback on reset
                 try { currentAudioSource.stop(); } catch(e){}
                 currentAudioSource = null;
             }

            // Clear displays
            const audioList = document.getElementById("audioValuesList");
            const reconList = document.getElementById("reconstructedAudioValuesList");
            const dftList = document.getElementById("dftCoefficientsList");
            if(audioList) audioList.innerText = "[Audio Original Procesado]";
            if(reconList) reconList.innerText = "[Audio Reconstruido]";
            if(dftList) dftList.innerText = "[Calcula la DFT para ver coeficientes]";

            const canvas = document.getElementById("audioCanvas");
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext("2d");
                // Check if canvas has dimensions before resizing/clearing
                if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
                    canvas.width = canvas.offsetWidth; // Resize before clearing
                    canvas.height = 150; // Set height explicitly
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#6c757d";
                    ctx.textAlign = "center";
                    ctx.font = "14px Arial";
                    ctx.fillText("[Forma de onda aparecerá aquí]", canvas.width / 2, canvas.height / 2);
                } else {
                     console.warn("DFT Demo: Canvas has zero dimensions, skipping clear/draw.");
                }
            }

            // Disable buttons carefully, checking existence first
            const compressBtn = document.getElementById("compressBtn");
            const reconstructBtn = document.getElementById("reconstructBtn");
            const playOrigBtn = document.getElementById("playOriginalBtn");
            const playReconBtn = document.getElementById("playReconstructedBtn");
            const startRecBtn = document.getElementById("startRec");
            const stopRecBtn = document.getElementById("stopRec");

            if(compressBtn) compressBtn.disabled = true;
            if(reconstructBtn) reconstructBtn.disabled = true;
            if(playOrigBtn) playOrigBtn.disabled = true;
            if(playReconBtn) playReconBtn.disabled = true;
            if(startRecBtn) startRecBtn.disabled = false; // Re-enable start rec
            if(stopRecBtn) stopRecBtn.disabled = true;

            // Hide Clear Button
            if (clearAudioBtn) clearAudioBtn.style.display = 'none';

            // Reset file input
            const fileInput = document.getElementById("audioFile");
            if (fileInput) fileInput.value = '';

            // Reset number inputs to defaults
            const numValuesInput = document.getElementById("numValuesInput");
            const numCoeffsInput = document.getElementById("numCoefficientsInput");
            const numTruncInput = document.getElementById("numTruncateCoefficientsInput");

            if (numValuesInput) numValuesInput.value = "10";
            if (numCoeffsInput) numCoeffsInput.value = "10";
            if (numTruncInput) { numTruncInput.value = "10000"; numTruncInput.max = ""; }

            // Hide trimming notification
            if (trimmingNotification) {
                trimmingNotification.style.display = 'none';
                trimmingNotification.textContent = '';
            }

            hideProgressOverlay(); // Hide overlay on reset
        }

        // File Input Change Handler Function
        function handleAudioFileChange(event) {
            console.log("DFT Demo: handleAudioFileChange triggered.");
            const file = event.target.files[0];
            if (file) {
                console.log("DFT Demo: File selected:", file.name, file.type, file.size);
                const acceptedWavTypes = ['audio/wav', 'audio/x-wav', 'audio/wave'];
                 if (!acceptedWavTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.wav')) {
                    logProgress(`Advertencia: Archivo (${file.name}, tipo: ${file.type || '?'}) no parece WAV. La decodificación podría fallar.`);
                }
                logProgress(`Archivo "${file.name}" (${(file.size / 1024).toFixed(1)} KB) seleccionado. Leyendo...`);
                const reader = new FileReader();
                reader.onload = e => processAudioBuffer(e.target.result);
                reader.onerror = err => {
                    logProgress("Error leyendo el archivo: " + err);
                    console.error("DFT Demo: FileReader error:", err);
                    resetAppState();
                };
                reader.readAsArrayBuffer(file);
            } else {
                console.log("DFT Demo: No file selected.");
            }
        }

        // Process Audio Buffer (Decode & Trim)
        function processAudioBuffer(arrayBuffer) {
            console.log("DFT Demo: processAudioBuffer called.");
            const localAudioContext = getAudioContext();
            if (!localAudioContext) {
                logProgress("Error crítico: AudioContext no disponible.");
                hideProgressOverlay(); // Ensure overlay hides if context fails early
                return;
            }

            if (trimmingNotification) trimmingNotification.style.display = 'none';
            showProgressOverlay("Decodificando audio...");
            logProgress("Decodificando audio...");

            localAudioContext.decodeAudioData(arrayBuffer).then(buffer => {
                const originalDuration = buffer.duration;
                logProgress(`Audio decodificado. Rate: ${buffer.sampleRate}Hz, Dur: ${originalDuration.toFixed(2)}s, Samples: ${buffer.length}`);

                const targetDurationSeconds = 2;
                if (originalDuration > targetDurationSeconds && trimmingNotification) {
                    trimmingNotification.textContent = `Nota: Audio original (${originalDuration.toFixed(2)}s) > ${targetDurationSeconds}s. Será recortado para análisis. Se puede reproducir completo.`;
                    trimmingNotification.style.display = 'block';
                }

                const sampleRate = buffer.sampleRate;
                const maxSamplesToKeep = Math.floor(sampleRate * targetDurationSeconds);
                const fullChannelData = buffer.getChannelData(0);
                const actualSamplesToUse = Math.min(fullChannelData.length, maxSamplesToKeep);

                if (actualSamplesToUse < fullChannelData.length) {
                    logProgress(`RECORTANDO audio a ${actualSamplesToUse} samples (${(actualSamplesToUse / sampleRate).toFixed(2)}s).`);
                    currentAudioData = fullChannelData.slice(0, actualSamplesToUse);
                } else {
                    logProgress(`Usando todas las ${actualSamplesToUse} samples.`);
                    currentAudioData = fullChannelData;
                }

                originalAudioBuffer = buffer; // Keep full original
                fullAudioValuesList = Array.from(currentAudioData);

                drawWaveform(currentAudioData);
                updateDisplayedValues();
                const compressBtn = document.getElementById("compressBtn");
                const playOrigBtn = document.getElementById("playOriginalBtn");
                if(compressBtn) compressBtn.disabled = false;
                if(playOrigBtn) playOrigBtn.disabled = false;

                if (clearAudioBtn) clearAudioBtn.style.display = 'inline-block';

                const maxCoeffs = Math.floor(currentAudioData.length / 2);
                const numTruncateInput = document.getElementById("numTruncateCoefficientsInput");
                if (numTruncateInput) {
                    numTruncateInput.max = maxCoeffs > 0 ? maxCoeffs : 1;
                    const currentTruncVal = parseInt(numTruncateInput.value, 10);
                    if (isNaN(currentTruncVal) || currentTruncVal > maxCoeffs || currentTruncVal < 0) {
                        const defaultTruncVal = Math.min(10000, maxCoeffs > 0 ? maxCoeffs : 0);
                        numTruncateInput.value = defaultTruncVal;
                        logProgress(`Ajustado truncamiento por defecto a ${defaultTruncVal}.`);
                    }
                }
                logProgress("Audio listo para análisis DFT.");
                hideProgressOverlay();

            }).catch(err => {
                logProgress("Error decodificando audio: " + err.message);
                console.error("DFT Demo: decodeAudioData error:", err);
                alert("Error al decodificar archivo. ¿Formato compatible (WAV)?\n" + err.message);
                if (trimmingNotification) trimmingNotification.style.display = 'none';
                hideProgressOverlay();
                resetAppState();
            });
        }

        // Draw Waveform
         function drawWaveform(samples) {
            const canvas = document.getElementById("audioCanvas");
            if (!canvas || !canvas.getContext) return;
            const ctx = canvas.getContext("2d");
            const canvasHeight = 150; // Keep consistent height
             // Check dimensions before drawing
            if (canvas.offsetWidth <= 0 || canvas.offsetHeight <= 0) {
                console.warn("DFT Demo: Canvas has zero dimensions, skipping drawWaveform.");
                return;
             }
            canvas.width = canvas.offsetWidth; // Responsive width
            canvas.height = canvasHeight; // Set height
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#3498db"; // Blue
            ctx.lineWidth = 1;
            ctx.beginPath();
            const middleY = canvas.height / 2;
            const scale = middleY * 0.95;

            if (!samples || samples.length === 0) {
                ctx.fillStyle = "#6c757d";
                ctx.textAlign = "center";
                ctx.font = "14px Arial";
                ctx.fillText("[No hay datos de audio procesado]", canvas.width / 2, middleY);
                return;
            }

            const step = Math.max(1, Math.floor(samples.length / canvas.width));
            for (let i = 0; i < canvas.width; i++) {
                const sampleIndex = Math.min(i * step, samples.length - 1);
                const value = samples[sampleIndex] || 0;
                const y = middleY - (value * scale);
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Draw Reconstructed Waveform (Superimposed)
        function drawReconstructedWaveform(samples) {
            const canvas = document.getElementById("audioCanvas");
             if (!canvas || !canvas.getContext) return;
             const ctx = canvas.getContext("2d");
             const canvasHeight = 150;

            // Check dimensions before drawing
             if (canvas.offsetWidth <= 0 || canvas.offsetHeight <= 0) {
                console.warn("DFT Demo: Canvas has zero dimensions, skipping drawReconstructedWaveform.");
                return;
             }

            // Redraw original first (drawWaveform clears canvas)
            if (currentAudioData && currentAudioData.length > 0) {
                drawWaveform(currentAudioData);
            } else {
                 canvas.width = canvas.offsetWidth;
                 canvas.height = canvasHeight;
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 console.warn("DFT Demo: drawReconstructedWaveform: Original data missing.");
            }

            // Draw reconstructed
            ctx.strokeStyle = "#e67e22"; // Orange
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const middleY = canvas.height / 2;
            const scale = middleY * 0.95;

            if (!samples || samples.length === 0) {
                 ctx.fillStyle = "#e67e22";
                 ctx.textAlign = "center";
                 ctx.font = "12px Arial";
                 ctx.fillText("[No hay datos reconstruidos]", canvas.width / 2, middleY + (currentAudioData ? 15 : 0));
                return;
            }

            const step = Math.max(1, Math.floor(samples.length / canvas.width));
            for (let i = 0; i < canvas.width; i++) {
                const sampleIndex = Math.min(i * step, samples.length - 1);
                const value = samples[sampleIndex] || 0;
                const y = middleY - (value * scale);
                 if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
            ctx.lineWidth = 1; // Reset line width
        }

        // Update Displayed Values (Lists)
        function updateSingleValueList(elementId, data, label) {
            const listElement = document.getElementById(elementId);
            const numValuesInput = document.getElementById("numValuesInput");
            let numToShow = 10;
            if (numValuesInput) {
                numToShow = parseInt(numValuesInput.value, 10);
                if (isNaN(numToShow) || numToShow < 1) numToShow = 10;
            }

            if (!listElement) return;
            if (!data || data.length === 0) {
                listElement.innerText = `[${label} no disponible]`;
                return;
            }
            numToShow = Math.min(numToShow, data.length);
            const firstValues = data.slice(0, numToShow);
            listElement.textContent = `Primeros ${numToShow} de ${data.length} valores (${label}): \n` +
                firstValues.map(v => v.toFixed(6)).join(", ");
        }

        function updateDisplayedValues() {
            updateSingleValueList("audioValuesList", fullAudioValuesList, "Original Procesado");
        }
        function updateReconstructedDisplayedValues() {
            updateSingleValueList("reconstructedAudioValuesList", fullReconstructedAudioValuesList, "Reconstruido");
        }


        // Display DFT Coefficients
        function displayDFTCoefficients() {
            const listElement = document.getElementById("dftCoefficientsList");
            const numCoeffsInput = document.getElementById("numCoefficientsInput");
            let numToShow = 10;
             if (numCoeffsInput) {
                 numToShow = parseInt(numCoeffsInput.value, 10);
                 if (isNaN(numToShow) || numToShow < 1) numToShow = 10;
            }

            if (!listElement) return;
            const data = fullDFTCoefficientsList;
            if (!data || data.length === 0) {
                listElement.innerText = "[No se han calculado coeficientes DFT]"; return;
            }
            numToShow = Math.min(numToShow, data.length);
             if (numToShow <= 0) { listElement.innerText = `[Mostrando 0 coeficientes DFT]`; return; }

            const firstCoefficients = data.slice(0, numToShow);
            const indexPadding = Math.max(5, numToShow.toString().length);
            const formatted = firstCoefficients.map((c, i) => {
                const real = c?.real?.toFixed(4).padStart(10, ' ') ?? 'N/A'.padStart(10, ' ');
                const imag = c?.imaginary?.toFixed(4).padStart(10, ' ') ?? 'N/A'.padStart(10, ' ');
                const mag = c?.magnitude()?.toFixed(4).padStart(10, ' ') ?? 'N/A'.padStart(10, ' ');
                return `[${i.toString().padStart(indexPadding, ' ')}]: R=${real}, I=${imag}, M=${mag}`;
            });
            listElement.textContent = `Primeros ${numToShow} de ${data.length} coeficientes DFT (Complejos):\n` + formatted.join("\n");
        }

        // Truncate DFT Coefficients
        function truncateDFTCoefficients(spectrum, numToKeep) {
            const totalCoeffs = spectrum ? spectrum.length : 0;
            console.log(`DFT Demo: Truncando ${totalCoeffs} coeficientes a ${numToKeep}.`);
            if (!spectrum) return [];
            if (numToKeep < 0) numToKeep = 0;
            numToKeep = Math.min(numToKeep, totalCoeffs);

            const truncated = new Array(totalCoeffs).fill(null).map(() => new Complex(0, 0));
            for (let i = 0; i < numToKeep; i++) {
                if (spectrum[i]) truncated[i] = spectrum[i];
            }
            return truncated;
        }

        // Inverse DFT
        function calculateIDFT(spectrum) {
            const K = spectrum ? spectrum.length : 0;
            if (K === 0 || !spectrum) {
                console.log(`DFT Demo: IDFT: Espectro vacío/inválido (K=${K}).`);
                return new Float32Array(0);
            }
            const N = K * 2;
            console.log(`DFT Demo: IDFT: K=${K}, N=${N}.`);
            const reconstructed = new Float32Array(N);
            const dcReal = spectrum[0]?.real ?? 0;

            for (let n = 0; n < N; n++) {
                let sum = dcReal;
                for (let k = 1; k < K; k++) {
                    const coeff = spectrum[k];
                    if (coeff) {
                        const angle = (2 * Math.PI * k * n) / N;
                        sum += 2 * (coeff.real * Math.cos(angle) - coeff.imaginary * Math.sin(angle));
                    }
                }
                reconstructed[n] = (N > 0) ? sum / N : 0;
            }
            console.log(`DFT Demo: IDFT completado. ${reconstructed.length} muestras.`);
            return reconstructed;
        }

        // Reconstruct Audio (main function)
        function reconstructAudio(truncatedSpectrum) {
            logProgress("Iniciando reconstrucción...");
             if (!truncatedSpectrum) {
                 logProgress("Error: Espectro truncado inválido.");
                 console.error("DFT Demo: reconstructAudio: Truncated spectrum is invalid.");
                 hideProgressOverlay(); return;
             }

            const playReconBtn = document.getElementById("playReconstructedBtn");
            if(playReconBtn) playReconBtn.disabled = true; // Disable playback initially

            console.log("DFT Demo: reconstructAudio: Llamando a IDFT...");
            const startTime = performance.now();
            const reconstructedSamples = calculateIDFT(truncatedSpectrum);
            const endTime = performance.now();
            console.log(`DFT Demo: IDFT tomó ${(endTime - startTime).toFixed(1)} ms.`);

            fullReconstructedAudioValuesList = Array.from(reconstructedSamples);
            updateReconstructedDisplayedValues();
            logProgress("Valores reconstruidos mostrados.");

            drawReconstructedWaveform(reconstructedSamples);
            logProgress("Forma de onda reconstruida mostrada.");

            reconstructedAudioBuffer = null; // Reset buffer
            try {
                const localAudioContext = getAudioContext();
                if (!originalAudioBuffer || !localAudioContext) throw new Error("Contexto/Buffer original no disponible.");
                if (reconstructedSamples.length === 0) {
                    logProgress("Audio reconstruido vacío (0 muestras). No se puede reproducir.");
                    return; // Nothing to buffer/play
                }

                const buffer = localAudioContext.createBuffer(1, reconstructedSamples.length, originalAudioBuffer.sampleRate);
                buffer.getChannelData(0).set(reconstructedSamples);
                reconstructedAudioBuffer = buffer;

                logProgress("Audio reconstruido listo para reproducir.");
                if(playReconBtn) playReconBtn.disabled = false; // Enable playback

            } catch (err) {
                logProgress("Error creando AudioBuffer reconstruido: " + err.message);
                console.error("DFT Demo: Error creating reconstructed AudioBuffer:", err);
                if(playReconBtn) playReconBtn.disabled = true;
            }
        }

        // Play Audio Buffer
        function playAudioBuffer(bufferToPlay, typeLabel) {
            const localAudioContext = getAudioContext();
             if (!localAudioContext) { logProgress("Error: AudioContext no disponible."); return; }
             if (!bufferToPlay) { alert(`Audio ${typeLabel} no disponible.`); logProgress(`Error: Audio ${typeLabel} no disponible.`); return; }
             if (bufferToPlay.length === 0) { alert(`Audio ${typeLabel} vacío.`); logProgress(`Advertencia: Audio ${typeLabel} vacío.`); return; }

            // Resume context if needed (important before playing)
            if (localAudioContext.state === 'suspended') {
                 logProgress("Intentando reanudar AudioContext para reproducción...");
                localAudioContext.resume().then(() => {
                    console.log("DFT Demo: Context resumed for playback.");
                    proceedWithPlayback(bufferToPlay, typeLabel, localAudioContext);
                }).catch(err => {
                    logProgress("Error al reanudar AudioContext: " + err.message);
                    alert("No se pudo iniciar el audio. Intenta interactuar con la página (click) y reintentar.");
                });
            } else {
                proceedWithPlayback(bufferToPlay, typeLabel, localAudioContext);
            }
        }

        function proceedWithPlayback(bufferToPlay, typeLabel, ctx) {
             // Stop previous playback
             if (currentAudioSource) {
                 try { currentAudioSource.stop(); currentAudioSource.onended = null; } catch(e){}
             }

            console.log(`DFT Demo: Reproduciendo audio ${typeLabel}.`);
            try {
                const source = ctx.createBufferSource();
                source.buffer = bufferToPlay;
                source.connect(ctx.destination);
                source.onended = () => {
                    logProgress(`Reproducción ${typeLabel} finalizada.`);
                    if (currentAudioSource === source) currentAudioSource = null;
                };
                source.start();
                currentAudioSource = source;
                logProgress(`Reproduciendo ${typeLabel}...`);
            } catch (err) {
                logProgress(`Error reproduciendo ${typeLabel}: ${err.message}`);
                console.error(`DFT Demo: Error playing ${typeLabel}:`, err);
                currentAudioSource = null;
                 if (err.name === 'InvalidStateError') alert(`Error de estado inválido. Intenta recargar audio.`);
            }
        }

        // --- Event Listener Setup ---
        function setupEventListeners() {
            console.log("DFT Demo: Setting up event listeners.");

            // Assign clear button reference
            clearAudioBtn = document.getElementById('clearAudioBtn');

            // File Input
            const audioFileInput = document.getElementById("audioFile");
            if (audioFileInput) audioFileInput.addEventListener("change", handleAudioFileChange);
            else console.error("DFT Demo: #audioFile not found!");

            // Clear Button
            if (clearAudioBtn) clearAudioBtn.addEventListener('click', resetAppState);
            else console.error("DFT Demo: #clearAudioBtn not found!");

            // Input Method Radios
            document.querySelectorAll('.dft-app-container input[name="inputMethod"]').forEach(radio => {
                 radio.addEventListener("change", function () {
                    const fileSection = document.getElementById("fileSection");
                    const liveSection = document.getElementById("liveSection");
                    if(fileSection && liveSection) {
                         fileSection.style.display = (this.value === "file") ? "block" : "none";
                         liveSection.style.display = (this.value === "live") ? "block" : "none";
                    }
                    resetAppState(); // Reset when changing method
                });
            });

            // Calculate DFT Button
            const compressBtn = document.getElementById("compressBtn");
            if (compressBtn) {
                compressBtn.addEventListener("click", () => {
                    if (!currentAudioData || currentAudioData.length === 0) {
                        alert("Carga/Graba audio primero."); logProgress("Error: DFT sin datos."); return;
                    }
                    logProgress("Calculando DFT..."); showProgressOverlay("Calculando DFT...");
                    setTimeout(() => { // Allow UI update
                        try {
                            const startTime = performance.now();
                            const spectrum = calculateDFT(currentAudioData);
                             const endTime = performance.now();
                            if (!spectrum || !Array.isArray(spectrum)) throw new Error("calculateDFT no retornó un array válido.");

                            logProgress(`DFT calculada (${spectrum.length} coeffs) en ${(endTime - startTime).toFixed(1)} ms.`);
                            fullDFTCoefficientsList = [...spectrum];
                            displayDFTCoefficients();
                            logProgress("Coeficientes DFT mostrados.");

                            const reconstructBtn = document.getElementById("reconstructBtn");
                            const playReconBtn = document.getElementById("playReconstructedBtn");
                            if(reconstructBtn) reconstructBtn.disabled = false;
                            if(playReconBtn) playReconBtn.disabled = true; // Disable reconstructed playback

                            // Adjust truncation input max and value
                            const maxDFTCoeffs = fullDFTCoefficientsList.length;
                            const truncInput = document.getElementById("numTruncateCoefficientsInput");
                            if (truncInput) {
                                truncInput.max = maxDFTCoeffs > 0 ? maxDFTCoeffs : 0;
                                let currentTruncVal = parseInt(truncInput.value, 10);
                                if (isNaN(currentTruncVal) || currentTruncVal < 0 || currentTruncVal > maxDFTCoeffs) {
                                    currentTruncVal = maxDFTCoeffs; // Default to max if invalid
                                     logProgress(`Ajustado número de coeficientes a ${maxDFTCoeffs}.`);
                                }
                                truncInput.value = currentTruncVal;
                             }

                        } catch (err) {
                            logProgress("Error cálculo DFT: " + err.message);
                            console.error("DFT Demo: Error in DFT calculation:", err);
                            const reconstructBtn = document.getElementById("reconstructBtn");
                            if(reconstructBtn) reconstructBtn.disabled = true;
                        } finally {
                            hideProgressOverlay();
                        }
                    }, 10);
                });
            } else console.error("DFT Demo: #compressBtn not found!");

            // Reconstruct Button
            const reconstructBtn = document.getElementById("reconstructBtn");
            if (reconstructBtn) {
                reconstructBtn.addEventListener("click", () => {
                     if (fullDFTCoefficientsList === null) {
                         alert("Calcula la DFT primero."); logProgress("Error: Reconstrucción sin DFT."); return;
                    }
                    const numTruncInput = document.getElementById("numTruncateCoefficientsInput");
                    let numToKeep = 0;
                    const maxCoeffs = fullDFTCoefficientsList.length;

                    if (numTruncInput) {
                         numToKeep = parseInt(numTruncInput.value, 10);
                         if (isNaN(numToKeep) || numToKeep < 0) {
                             alert("Número de coeficientes inválido (>= 0). Usando 0.");
                             numToKeep = 0; numTruncInput.value = 0;
                         }
                         if (numToKeep > maxCoeffs) {
                             logProgress(`Advertencia: ${numToKeep} > ${maxCoeffs} coeficientes. Usando ${maxCoeffs}.`);
                             numToKeep = maxCoeffs; numTruncInput.value = numToKeep;
                         }
                    } else {
                         logProgress("Advertencia: Input de truncamiento no encontrado. Usando 0.");
                         numToKeep = 0;
                    }

                    showProgressOverlay(`Reconstruyendo (${numToKeep} coeficientes)...`);
                    logProgress(`Reconstruyendo con ${numToKeep} coeficientes...`);
                    setTimeout(() => { // Allow UI update
                        try {
                            const truncated = truncateDFTCoefficients(fullDFTCoefficientsList, numToKeep);
                            reconstructAudio(truncated);
                        } catch (err) {
                            logProgress("Error reconstrucción: " + err.message);
                            console.error("DFT Demo: Error during reconstruction:", err);
                             const playReconBtn = document.getElementById("playReconstructedBtn");
                             if(playReconBtn) playReconBtn.disabled = true;
                        } finally {
                            hideProgressOverlay();
                        }
                    }, 10);
                });
            } else console.error("DFT Demo: #reconstructBtn not found!");

            // Playback Buttons
            const playOrigBtn = document.getElementById("playOriginalBtn");
            const playReconBtn = document.getElementById("playReconstructedBtn");
            if(playOrigBtn) playOrigBtn.addEventListener("click", () => playAudioBuffer(originalAudioBuffer, "Original (Completo)"));
            else console.error("DFT Demo: #playOriginalBtn not found!");
            if(playReconBtn) playReconBtn.addEventListener("click", () => playAudioBuffer(reconstructedAudioBuffer, "Reconstruido"));
             else console.error("DFT Demo: #playReconstructedBtn not found!");

            // Number Input Listeners
            const numValuesInput = document.getElementById("numValuesInput");
            const numCoeffsInput = document.getElementById("numCoefficientsInput");
            const numTruncInput = document.getElementById("numTruncateCoefficientsInput");

            if(numValuesInput) numValuesInput.addEventListener("input", () => { updateDisplayedValues(); updateReconstructedDisplayedValues(); });
            else console.error("DFT Demo: #numValuesInput not found!");

            if(numCoeffsInput) numCoeffsInput.addEventListener("input", displayDFTCoefficients);
            else console.error("DFT Demo: #numCoefficientsInput not found!");

             if(numTruncInput) {
                numTruncInput.addEventListener("input", function() { // Basic validation feedback
                     const val = parseInt(this.value, 10);
                     const maxVal = this.max ? parseInt(this.max, 10) : null;
                     if (isNaN(val) || val < 0) this.style.borderColor = 'red';
                     else if (maxVal !== null && val > maxVal) this.style.borderColor = 'orange';
                     else this.style.borderColor = '';
                 });
             } else console.error("DFT Demo: #numTruncateCoefficientsInput not found!");


            // Live Recording Buttons
            const startRecBtn = document.getElementById("startRec");
            const stopRecBtn = document.getElementById("stopRec");

            if (startRecBtn) {
                startRecBtn.addEventListener("click", () => {
                    resetAppState();
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(stream => {
                            if (typeof MediaRecorder === 'undefined') {
                                alert("MediaRecorder no soportado."); logProgress("Error: MediaRecorder no soportado."); resetAppState(); return;
                            }
                            try {
                                let options = { mimeType: 'audio/webm' }; // Default
                                // Check for preferred types
                                if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/wav;codecs=pcm')) options = { mimeType: 'audio/wav;codecs=pcm' };
                                else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) options = { mimeType: 'audio/ogg;codecs=opus' };
                                // Add more checks if needed (e.g., 'audio/mp4')

                                mediaRecorder = new MediaRecorder(stream, options);
                                console.log(`DFT Demo: MediaRecorder iniciado con: ${mediaRecorder.mimeType}`);
                                logProgress(`Grabando en formato: ${mediaRecorder.mimeType}`);
                            } catch(e) {
                                alert("Error iniciando grabadora: " + e.message); logProgress("Error MediaRecorder: " + e.message); resetAppState(); return;
                            }

                            recordedBuffer = [];
                            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedBuffer.push(e.data); };
                            mediaRecorder.onstop = () => {
                                logProgress("Grabación finalizada. Procesando...");
                                stream.getTracks().forEach(track => track.stop()); // Release mic indicator
                                if (recordedBuffer && recordedBuffer.length > 0) {
                                    const blob = new Blob(recordedBuffer, { type: mediaRecorder.mimeType });
                                    console.log(`DFT Demo: Blob created: Type=${blob.type}, Size=${blob.size}`);
                                    const reader = new FileReader();
                                    reader.onload = e => processAudioBuffer(e.target.result);
                                    reader.onerror = err => { logProgress("Error leyendo Blob: " + err); resetAppState(); };
                                    reader.readAsArrayBuffer(blob);
                                } else {
                                     logProgress("Error: No se grabaron datos."); resetAppState();
                                }
                                // Ensure buttons are reset correctly after processing attempt
                                if (startRecBtn) startRecBtn.disabled = false;
                                if (stopRecBtn) stopRecBtn.disabled = true;
                            };
                             mediaRecorder.onerror = (event) => {
                                logProgress(`Error grabación: ${event.error.name} - ${event.error.message}`);
                                console.error(`DFT Demo: MediaRecorder error: ${event.error}`);
                                alert(`Error durante la grabación: ${event.error.message}`);
                                stream.getTracks().forEach(track => track.stop());
                                resetAppState(); // Resets button states
                             };

                            mediaRecorder.start();
                            if(startRecBtn) startRecBtn.disabled = true;
                            if(stopRecBtn) stopRecBtn.disabled = false;
                            logProgress("Grabación iniciada...");
                        })
                        .catch(err => {
                            logProgress("Error acceso micrófono: " + err.name + " - " + err.message);
                            console.error("DFT Demo: getUserMedia error:", err);
                             let userMsg = "Error acceso micrófono.";
                             if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') userMsg += " Permiso denegado.";
                             else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') userMsg += " No se encontró micrófono.";
                             else if (err.name === 'NotReadableError') userMsg += " Hardware/OS impidió acceso al micrófono.";
                             else if (err.name === 'AbortError') userMsg += " Acceso al micrófono abortado.";
                             else userMsg += ` (${err.message})`;
                            alert(userMsg);
                            resetAppState();
                        });
                });
            } else console.error("DFT Demo: #startRec not found!");

            if (stopRecBtn) {
                stopRecBtn.addEventListener("click", () => {
                    if (mediaRecorder && mediaRecorder.state === "recording") {
                        try {
                            mediaRecorder.stop(); // onstop handler processes audio
                            logProgress("Deteniendo grabación...");
                            if(stopRecBtn) stopRecBtn.disabled = true; // Disable immediately
                             // Start button re-enabled in onstop/onerror/reset
                        } catch (e) {
                            logProgress("Error deteniendo grabadora: " + e.message);
                            console.error("DFT Demo: Error stopping MediaRecorder:", e);
                            resetAppState();
                        }
                    } else {
                         console.warn("DFT Demo: stopRec clicked when not recording.");
                         if (stopRecBtn) stopRecBtn.disabled = true;
                         if (startRecBtn) startRecBtn.disabled = false; // Ensure start is enabled
                    }
                });
            } else console.error("DFT Demo: #stopRec not found!");

             logProgress("DFT Demo: Event listeners configurados.");
        }

        // --- Initial Setup ---
        // Use DOMContentLoaded which fires when the initial HTML document has been
        // completely loaded and parsed, without waiting for stylesheets, images,
        // and subframes to finish loading. This is usually sufficient for JS setup.
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                 console.log("DFT Demo: DOMContentLoaded fired.");
                 resetAppState();
                 setupEventListeners();
                 getAudioContext(); // Attempt early AudioContext init
            });
        } else {
             // DOM already loaded (e.g., script loaded async/defer or placed at end of body)
             console.log("DFT Demo: DOM already loaded on script execution.");
             resetAppState();
             setupEventListeners();
             getAudioContext(); // Attempt early AudioContext init
        }

    })(); // End of IIFE
    // --- END OF EMBEDDED JAVASCRIPT ---
</script>