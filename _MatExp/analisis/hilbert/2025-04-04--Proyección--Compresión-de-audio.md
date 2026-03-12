---
title: Demostración Interactiva - Compresión de Audio con DFT
date: '2024-01-15 10:30:00 +0100' # CHANGE THIS to your desired publication date/time/zone
categories:
  experimento optimización análisis hilbert audio proyección aplicaciones
tags: [Hilbert, proyección ortogonal, DFT, transformada fourier, compresión audio, procesamiento señal,]
permalink: "/MatExp/analisis/hilbert/compresion-audio"
header:
  image: "/assets/MatExp/analisis/hilbert/audio-conversion/header.jpg"
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
        margin: 0 auto 30px;
        padding: 15px 12px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f8f9fa 0%, #eef1f5 100%);
        border: 1px solid #dee2e6;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .dft-app-container .quick-nav ul {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        list-style: none;
        padding: 0;
        margin: 0;
        gap: 8px;
    }
    .dft-app-container .quick-nav li {
        margin: 0;
    }
    .dft-app-container .quick-nav a {
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
    .dft-app-container .quick-nav .step-num {
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
        transition: all 0.2s ease;
    }
    .dft-app-container .quick-nav a:hover {
        background: #2563eb;
        border-color: #1d4ed8;
        color: #ffffff;
        transform: translateY(-2px);
        box-shadow: 0 5px 14px rgba(37,99,235,0.28);
        text-decoration: none;
    }
    .dft-app-container .quick-nav a:hover .step-num {
        background: rgba(255,255,255,0.22);
        color: #ffffff;
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
      .dft-app-container .inline-controls select,
      .dft-app-container .controls select {
          min-width: 220px;
          margin: 0 5px;
      }
      .dft-app-container input[type="file"] {
         display: block; /* Keep block */
         margin: 15px auto; /* Keep centering */
         max-width: 90%; /* Keep max width */
         /* padding, border, radius handled by theme */
     }
     .dft-app-container .helper-text {
         font-size: 0.9em;
         color: #555;
         margin-top: 8px;
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
        .dft-app-container .quick-nav ul { flex-direction: row; flex-wrap: wrap; }
        .dft-app-container .quick-nav li { margin: 3px 0; }
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
         .dft-app-container .quick-nav a { font-size: 0.8em; padding: 6px 11px 6px 7px; }
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
    <nav class="quick-nav" aria-label="Navegación de secciones">
        <ul>
            <li><a href="#dftInputSection"><span class="step-num">1</span>Seleccionar Audio</a></li>
            <li><a href="#dftCalcSection"><span class="step-num">2</span>Calcular DFT</a></li>
            <li><a href="#dftCoeffSection"><span class="step-num">3</span>Coeficientes</a></li>
            <li><a href="#dftReconSection"><span class="step-num">4</span>Reconstrucción</a></li>
            <li><a href="#dftWaveformSection"><span class="step-num">5</span>Forma de Onda</a></li>
            <li><a href="#dftCompareSection"><span class="step-num">6</span>Comparación</a></li>
            <li><a href="#dftLogSection"><span class="step-num">7</span>Registro</a></li>
        </ul>
    </nav>

    <!-- Renamed IDs for sections to be more specific -->
    <section id="dftInputSection">
        <h2>1. Selección de Audio</h2>
        <div class="controls">
            <label><input type="radio" name="inputMethod" value="file" checked> Cargar archivo WAV</label>
            <label><input type="radio" name="inputMethod" value="library"> Seleccionar audio de biblioteca</label>
            <label><input type="radio" name="inputMethod" value="live"> Grabar con micrófono</label>
        </div>
        <div id="fileSection">
            <input type="file" id="audioFile" accept="audio/wav,audio/wave,audio/x-wav,.wav">
            <p>Nota: Audios largos (> 2s) serán recortados para el análisis.</p>
        </div>
        <div id="librarySection" style="display:none;">
            <div class="inline-controls">
                <label for="libraryAudioSelect">Audio precalculado</label>
                <select id="libraryAudioSelect" disabled>
                    <option value="">Cargando biblioteca...</option>
                </select>
            </div>
            <p class="helper-text">Estos audios usan la biblioteca de <strong>assets/wav-samples</strong> y ya tienen precalculados el vector ℓ², la DFT y las reconstrucciones para 500, 1000, 1500, 2000, 3000, 5000, 10000 y 20000 coeficientes.</p>
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
         <p id="libraryPrecomputedHint" class="helper-text" style="display:none;">Para los audios de biblioteca, la DFT se carga directamente desde los datos precalculados, sin volver a ejecutar el cálculo en el navegador.</p>
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
        <div class="values-comparison">
             <div class="values-column">
                 <h3>Coeficientes DFT originales</h3>
                 <div id="dftCoefficientsList" class="coefficients-list">[Selecciona un audio y calcula/carga la DFT para ver los coeficientes]</div>
             </div>
             <div class="values-column">
                 <h3>Coeficientes tras truncamiento</h3>
                 <div id="truncatedDftCoefficientsList" class="coefficients-list">[Reconstruye el audio para ver los coeficientes tras el truncamiento]</div>
             </div>
        </div>
    </section>

    <section id="dftReconSection">
        <h2>4. Reconstrucción (Truncamiento + IDFT)</h2>
         <p>Selecciona cuántos coeficientes DFT (del paso 3) usar para reconstruir el audio mediante la IDFT. Menos coeficientes simulan mayor compresión.</p>
        <div id="manualReconstructionControls" class="inline-controls">
            <label for="numTruncateCoefficientsInput">Mantener primeros</label>
            <input type="number" id="numTruncateCoefficientsInput" value="10000" min="0" list="manualReconstructionPresets">
            <label>coeficientes DFT</label> <!-- Simplified label -->
        </div>
        <datalist id="manualReconstructionPresets">
            <option value="500"></option>
            <option value="1000"></option>
            <option value="1500"></option>
            <option value="2000"></option>
            <option value="3000"></option>
            <option value="5000"></option>
            <option value="10000"></option>
            <option value="20000"></option>
        </datalist>
        <div id="libraryReconstructionControls" class="inline-controls" style="display:none;">
            <label for="precomputedReconstructionSelect">Reconstrucción precalculada</label>
            <select id="precomputedReconstructionSelect" disabled>
                <option value="">Selecciona una reconstrucción</option>
            </select>
            <label>coeficientes DFT</label>
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

<!-- External JavaScript -->
<script src="/assets/js/audio-dft-demo.js"></script>