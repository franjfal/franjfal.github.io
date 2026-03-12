(function () {
    const PRECOMPUTED_MANIFEST_URL = "/assets/MatExp/analisis/hilbert/audio-conversion/precomputed/manifest.json";
    const DEFAULT_LIBRARY_RECONSTRUCTION = "1000";

    const progressOverlay = document.getElementById("dftProgressOverlay");
    const trimmingNotification = document.getElementById("trimmingNotification");

    let clearAudioBtn = null;
    let mediaRecorder = null;
    let recordedBuffer = null;
    let currentAudioData = null;
    let fullAudioValuesList = null;
    let fullDFTCoefficientsList = null;
    let currentTruncationState = null;
    let reconstructedAudioBuffer = null;
    let fullReconstructedAudioValuesList = null;
    let originalAudioBuffer = null;
    let audioContext = null;
    let currentAudioSource = null;
    let precomputedManifest = null;
    let currentLibraryMetadata = null;

    const precomputedArrayCache = new Map();
    const decodedAudioBufferCache = new Map();

    function showProgressOverlay(message = "Procesando...") {
        if (!progressOverlay) {
            return;
        }

        const messageElement = progressOverlay.querySelector(".dft-progress-content p:first-of-type");
        if (messageElement) {
            messageElement.textContent = message;
        }
        progressOverlay.style.display = "flex";
    }

    function hideProgressOverlay() {
        if (progressOverlay) {
            progressOverlay.style.display = "none";
        }
    }

    function Complex(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    Complex.prototype.magnitude = function () {
        return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
    };

    function getSelectedInputMethod() {
        const selected = document.querySelector('.dft-app-container input[name="inputMethod"]:checked');
        return selected ? selected.value : "file";
    }

    function getAudioContext() {
        if (!audioContext) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    throw new Error("Web Audio API no soportada por este navegador.");
                }
                audioContext = new AudioContextClass();
                audioContext.onstatechange = function () {
                    logProgress("Estado del AudioContext: " + audioContext.state);
                };
            } catch (error) {
                console.error("DFT Demo: Error creating AudioContext", error);
                alert("Error: No se pudo inicializar el contexto de audio. " + error.message);
                return null;
            }
        }

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(function (error) {
                console.error("DFT Demo: Error resuming AudioContext", error);
            });
        }

        return audioContext;
    }

    function logProgress(message) {
        const logDiv = document.getElementById("progressLog");
        if (!logDiv) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        logDiv.textContent += "[" + timestamp + "] " + message + "\n";
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    function updateModeVisibility() {
        const method = getSelectedInputMethod();
        const fileSection = document.getElementById("fileSection");
        const librarySection = document.getElementById("librarySection");
        const liveSection = document.getElementById("liveSection");
        const compressBtn = document.getElementById("compressBtn");
        const libraryHint = document.getElementById("libraryPrecomputedHint");
        const manualReconControls = document.getElementById("manualReconstructionControls");
        const libraryReconControls = document.getElementById("libraryReconstructionControls");
        const reconstructBtn = document.getElementById("reconstructBtn");

        if (fileSection) fileSection.style.display = method === "file" ? "block" : "none";
        if (librarySection) librarySection.style.display = method === "library" ? "block" : "none";
        if (liveSection) liveSection.style.display = method === "live" ? "block" : "none";
        if (compressBtn) compressBtn.style.display = method === "library" ? "none" : "inline-block";
        if (libraryHint) libraryHint.style.display = method === "library" ? "block" : "none";
        if (manualReconControls) manualReconControls.style.display = method === "library" ? "none" : "flex";
        if (libraryReconControls) libraryReconControls.style.display = method === "library" ? "flex" : "none";
        if (reconstructBtn) reconstructBtn.style.display = method === "library" ? "none" : "inline-block";
    }

    function resetWaveformCanvas() {
        const canvas = document.getElementById("audioCanvas");
        if (!canvas || !canvas.getContext || canvas.offsetWidth <= 0) {
            return;
        }

        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth;
        canvas.height = 150;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#6c757d";
        ctx.textAlign = "center";
        ctx.font = "14px Arial";
        ctx.fillText("[Forma de onda aparecerá aquí]", canvas.width / 2, canvas.height / 2);
    }

    function resetAppState(options) {
        const settings = Object.assign({
            preserveLibrarySelection: false,
            suppressLog: false,
        }, options || {});

        const librarySelect = document.getElementById("libraryAudioSelect");
        const precomputedSelect = document.getElementById("precomputedReconstructionSelect");
        const preservedLibrarySelection = settings.preserveLibrarySelection && librarySelect ? librarySelect.value : "";

        if (!settings.suppressLog) {
            logProgress("Estado reiniciado.");
        }

        currentAudioData = null;
        fullAudioValuesList = null;
        fullDFTCoefficientsList = null;
        currentTruncationState = null;
        reconstructedAudioBuffer = null;
        fullReconstructedAudioValuesList = null;
        originalAudioBuffer = null;
        recordedBuffer = null;
        currentLibraryMetadata = null;

        if (currentAudioSource) {
            try {
                currentAudioSource.stop();
            } catch (error) {
                console.warn("DFT Demo: Error stopping current audio source", error);
            }
            currentAudioSource = null;
        }

        const audioList = document.getElementById("audioValuesList");
        const reconList = document.getElementById("reconstructedAudioValuesList");
        const dftList = document.getElementById("dftCoefficientsList");
        const truncatedList = document.getElementById("truncatedDftCoefficientsList");

        if (audioList) audioList.innerText = "[Audio Original Procesado]";
        if (reconList) reconList.innerText = "[Audio Reconstruido]";
        if (dftList) dftList.innerText = "[Selecciona un audio y calcula/carga la DFT para ver los coeficientes]";
        if (truncatedList) truncatedList.innerText = "[Reconstruye el audio para ver los coeficientes tras el truncamiento]";

        resetWaveformCanvas();

        const compressBtn = document.getElementById("compressBtn");
        const reconstructBtn = document.getElementById("reconstructBtn");
        const playOrigBtn = document.getElementById("playOriginalBtn");
        const playReconBtn = document.getElementById("playReconstructedBtn");
        const startRecBtn = document.getElementById("startRec");
        const stopRecBtn = document.getElementById("stopRec");

        if (compressBtn) compressBtn.disabled = true;
        if (reconstructBtn) reconstructBtn.disabled = true;
        if (playOrigBtn) playOrigBtn.disabled = true;
        if (playReconBtn) playReconBtn.disabled = true;
        if (startRecBtn) startRecBtn.disabled = false;
        if (stopRecBtn) stopRecBtn.disabled = true;

        if (clearAudioBtn) clearAudioBtn.style.display = "none";

        const fileInput = document.getElementById("audioFile");
        const numValuesInput = document.getElementById("numValuesInput");
        const numCoeffsInput = document.getElementById("numCoefficientsInput");
        const numTruncInput = document.getElementById("numTruncateCoefficientsInput");

        if (fileInput) fileInput.value = "";
        if (numValuesInput) numValuesInput.value = "10";
        if (numCoeffsInput) numCoeffsInput.value = "10";
        if (numTruncInput) {
            numTruncInput.value = "10000";
            numTruncInput.max = "";
            numTruncInput.style.borderColor = "";
        }

        if (trimmingNotification) {
            trimmingNotification.style.display = "none";
            trimmingNotification.textContent = "";
        }

        if (librarySelect) {
            librarySelect.value = settings.preserveLibrarySelection ? preservedLibrarySelection : "";
        }

        if (precomputedSelect) {
            precomputedSelect.value = "";
            precomputedSelect.disabled = true;
        }

        hideProgressOverlay();
        updateModeVisibility();
    }

    function calculateDFT(samples) {
        console.log("calculateDFT: Iniciando cálculo DFT COMPLEJA con " + samples.length + " muestras.");
        const N = samples.length;
        const numCoefficients = Math.floor(N / 2);
        if (numCoefficients <= 0) {
            return [];
        }

        const spectrum = new Array(numCoefficients);
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
        return spectrum;
    }

    function truncateDFTCoefficients(spectrum, numToKeep) {
        const totalCoeffs = spectrum ? spectrum.length : 0;
        if (!spectrum) {
            return [];
        }

        let safeNumToKeep = Number.isFinite(numToKeep) ? numToKeep : 0;
        safeNumToKeep = Math.max(0, Math.min(safeNumToKeep, totalCoeffs));

        const truncated = new Array(totalCoeffs);
        for (let i = 0; i < totalCoeffs; i++) {
            if (i < safeNumToKeep) {
                truncated[i] = spectrum[i];
            } else {
                truncated[i] = new Complex(0, 0);
            }
        }
        return truncated;
    }

    function calculateIDFT(spectrum) {
        const K = spectrum ? spectrum.length : 0;
        if (K === 0 || !spectrum) {
            return new Float32Array(0);
        }

        const N = K * 2;
        const reconstructed = new Float32Array(N);
        const dcReal = spectrum[0] ? spectrum[0].real : 0;

        for (let n = 0; n < N; n++) {
            let sum = dcReal;
            for (let k = 1; k < K; k++) {
                const coeff = spectrum[k];
                if (coeff) {
                    const angle = (2 * Math.PI * k * n) / N;
                    sum += 2 * (coeff.real * Math.cos(angle) - coeff.imaginary * Math.sin(angle));
                }
            }
            reconstructed[n] = N > 0 ? sum / N : 0;
        }
        return reconstructed;
    }

    function updateSingleValueList(elementId, data, label) {
        const listElement = document.getElementById(elementId);
        const numValuesInput = document.getElementById("numValuesInput");
        let numToShow = 10;

        if (numValuesInput) {
            numToShow = parseInt(numValuesInput.value, 10);
            if (isNaN(numToShow) || numToShow < 1) {
                numToShow = 10;
            }
        }

        if (!listElement) {
            return;
        }
        if (!data || data.length === 0) {
            listElement.innerText = "[" + label + " no disponible]";
            return;
        }

        const safeNumToShow = Math.min(numToShow, data.length);
        const firstValues = Array.from(data.slice(0, safeNumToShow));
        listElement.textContent = "Primeros " + safeNumToShow + " de " + data.length + " valores (" + label + "):\n" +
            firstValues.map(function (value) { return value.toFixed(6); }).join(", ");
    }

    function updateDisplayedValues() {
        updateSingleValueList("audioValuesList", fullAudioValuesList, "Original Procesado");
    }

    function updateReconstructedDisplayedValues() {
        updateSingleValueList("reconstructedAudioValuesList", fullReconstructedAudioValuesList, "Reconstruido");
    }

    function formatCoefficientLine(coefficient, index, indexPadding) {
        const coeff = coefficient || new Complex(0, 0);
        const real = coeff.real.toFixed(4).padStart(10, " ");
        const imag = coeff.imaginary.toFixed(4).padStart(10, " ");
        const magnitude = coeff.magnitude().toFixed(4).padStart(10, " ");
        return "[" + index.toString().padStart(indexPadding, " ") + "]: R=" + real + ", I=" + imag + ", M=" + magnitude;
    }

    function displayCoefficientList(elementId, coefficients, titlePrefix) {
        const listElement = document.getElementById(elementId);
        const numCoeffsInput = document.getElementById("numCoefficientsInput");
        let numToShow = 10;

        if (numCoeffsInput) {
            numToShow = parseInt(numCoeffsInput.value, 10);
            if (isNaN(numToShow) || numToShow < 1) {
                numToShow = 10;
            }
        }

        if (!listElement) {
            return;
        }
        if (!coefficients || coefficients.length === 0) {
            listElement.innerText = "[No hay coeficientes disponibles]";
            return;
        }

        const safeNumToShow = Math.min(numToShow, coefficients.length);
        const indexPadding = Math.max(5, safeNumToShow.toString().length);
        const formatted = coefficients.slice(0, safeNumToShow).map(function (coefficient, index) {
            return formatCoefficientLine(coefficient, index, indexPadding);
        });
        listElement.textContent = "Primeros " + safeNumToShow + " de " + coefficients.length + " " + titlePrefix + ":\n" + formatted.join("\n");
    }

    function displayDFTCoefficients() {
        if (!fullDFTCoefficientsList || fullDFTCoefficientsList.length === 0) {
            const listElement = document.getElementById("dftCoefficientsList");
            if (listElement) {
                listElement.innerText = "[No se han calculado ni cargado coeficientes DFT]";
            }
            return;
        }
        displayCoefficientList("dftCoefficientsList", fullDFTCoefficientsList, "coeficientes DFT (Complejos)");
    }

    function displayTruncatedDFTCoefficients() {
        const listElement = document.getElementById("truncatedDftCoefficientsList");
        const numCoeffsInput = document.getElementById("numCoefficientsInput");
        let numToShow = 10;

        if (numCoeffsInput) {
            numToShow = parseInt(numCoeffsInput.value, 10);
            if (isNaN(numToShow) || numToShow < 1) {
                numToShow = 10;
            }
        }

        if (!listElement) {
            return;
        }
        if (!fullDFTCoefficientsList || !currentTruncationState) {
            listElement.innerText = "[Reconstruye el audio para ver los coeficientes tras el truncamiento]";
            return;
        }

        const safeNumToShow = Math.min(numToShow, fullDFTCoefficientsList.length);
        const indexPadding = Math.max(5, safeNumToShow.toString().length);
        const keepCount = currentTruncationState.keepCount;
        const formatted = [];

        for (let i = 0; i < safeNumToShow; i++) {
            const coefficient = i < keepCount ? fullDFTCoefficientsList[i] : new Complex(0, 0);
            formatted.push(formatCoefficientLine(coefficient, i, indexPadding));
        }

        listElement.textContent = "Primeros " + safeNumToShow + " de " + fullDFTCoefficientsList.length +
            " coeficientes DFT tras el truncamiento (" + keepCount + " preservados):\n" + formatted.join("\n");
    }

    function drawWaveform(samples) {
        const canvas = document.getElementById("audioCanvas");
        if (!canvas || !canvas.getContext || canvas.offsetWidth <= 0) {
            return;
        }

        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth;
        canvas.height = 150;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#3498db";
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
            if (i === 0) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        ctx.stroke();
    }

    function drawReconstructedWaveform(samples) {
        const canvas = document.getElementById("audioCanvas");
        if (!canvas || !canvas.getContext || canvas.offsetWidth <= 0) {
            return;
        }

        const ctx = canvas.getContext("2d");
        if (currentAudioData && currentAudioData.length > 0) {
            drawWaveform(currentAudioData);
        } else {
            canvas.width = canvas.offsetWidth;
            canvas.height = 150;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.strokeStyle = "#e67e22";
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const middleY = canvas.height / 2;
        const scale = middleY * 0.95;

        if (!samples || samples.length === 0) {
            ctx.fillStyle = "#e67e22";
            ctx.textAlign = "center";
            ctx.font = "12px Arial";
            ctx.fillText("[No hay datos reconstruidos]", canvas.width / 2, middleY + 15);
            return;
        }

        const step = Math.max(1, Math.floor(samples.length / canvas.width));
        for (let i = 0; i < canvas.width; i++) {
            const sampleIndex = Math.min(i * step, samples.length - 1);
            const value = samples[sampleIndex] || 0;
            const y = middleY - (value * scale);
            if (i === 0) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    function createMonoAudioBuffer(samples, sampleRate) {
        const localAudioContext = getAudioContext();
        if (!localAudioContext || !samples || samples.length === 0) {
            return null;
        }

        const audioSamples = samples instanceof Float32Array ? samples : new Float32Array(samples);
        const buffer = localAudioContext.createBuffer(1, audioSamples.length, sampleRate);
        buffer.getChannelData(0).set(audioSamples);
        return buffer;
    }

    function reconstructAudio(truncatedSpectrum, keepCount) {
        logProgress("Iniciando reconstrucción...");
        if (!truncatedSpectrum) {
            logProgress("Error: Espectro truncado inválido.");
            return;
        }

        const playReconBtn = document.getElementById("playReconstructedBtn");
        if (playReconBtn) {
            playReconBtn.disabled = true;
        }

        const startTime = performance.now();
        const reconstructedSamples = calculateIDFT(truncatedSpectrum);
        const endTime = performance.now();
        logProgress("IDFT calculada en " + (endTime - startTime).toFixed(1) + " ms.");

        currentTruncationState = { keepCount: keepCount };
        displayTruncatedDFTCoefficients();

        fullReconstructedAudioValuesList = Array.from(reconstructedSamples);
        updateReconstructedDisplayedValues();
        drawReconstructedWaveform(reconstructedSamples);

        try {
            if (!originalAudioBuffer) {
                throw new Error("Contexto/Buffer original no disponible.");
            }
            reconstructedAudioBuffer = createMonoAudioBuffer(reconstructedSamples, originalAudioBuffer.sampleRate);
            if (!reconstructedAudioBuffer) {
                throw new Error("No se pudo construir el AudioBuffer reconstruido.");
            }
            logProgress("Audio reconstruido listo para reproducir.");
            if (playReconBtn) {
                playReconBtn.disabled = false;
            }
        } catch (error) {
            logProgress("Error creando AudioBuffer reconstruido: " + error.message);
            console.error("DFT Demo: Error creating reconstructed audio buffer", error);
        }
    }

    function proceedWithPlayback(bufferToPlay, typeLabel, ctx) {
        if (currentAudioSource) {
            try {
                currentAudioSource.stop();
                currentAudioSource.onended = null;
            } catch (error) {
                console.warn("DFT Demo: Error stopping current playback", error);
            }
        }

        try {
            const source = ctx.createBufferSource();
            source.buffer = bufferToPlay;
            source.connect(ctx.destination);
            source.onended = function () {
                logProgress("Reproducción " + typeLabel + " finalizada.");
                if (currentAudioSource === source) {
                    currentAudioSource = null;
                }
            };
            source.start();
            currentAudioSource = source;
            logProgress("Reproduciendo " + typeLabel + "...");
        } catch (error) {
            logProgress("Error reproduciendo " + typeLabel + ": " + error.message);
            console.error("DFT Demo: Error playing audio", error);
            currentAudioSource = null;
        }
    }

    function playAudioBuffer(bufferToPlay, typeLabel) {
        const localAudioContext = getAudioContext();
        if (!localAudioContext) {
            return;
        }
        if (!bufferToPlay || bufferToPlay.length === 0) {
            alert("Audio " + typeLabel + " no disponible.");
            logProgress("Error: Audio " + typeLabel + " no disponible.");
            return;
        }

        if (localAudioContext.state === "suspended") {
            logProgress("Intentando reanudar AudioContext para reproducción...");
            localAudioContext.resume().then(function () {
                proceedWithPlayback(bufferToPlay, typeLabel, localAudioContext);
            }).catch(function (error) {
                logProgress("Error al reanudar AudioContext: " + error.message);
                alert("No se pudo iniciar el audio. Intenta interactuar con la página y reintentar.");
            });
            return;
        }

        proceedWithPlayback(bufferToPlay, typeLabel, localAudioContext);
    }

    function processLoadedAudioData() {
        drawWaveform(currentAudioData);
        updateDisplayedValues();
        displayDFTCoefficients();
        displayTruncatedDFTCoefficients();

        const playOrigBtn = document.getElementById("playOriginalBtn");
        if (playOrigBtn) playOrigBtn.disabled = !originalAudioBuffer;
        if (clearAudioBtn) clearAudioBtn.style.display = "inline-block";
    }

    function processAudioBuffer(arrayBuffer) {
        const localAudioContext = getAudioContext();
        if (!localAudioContext) {
            logProgress("Error crítico: AudioContext no disponible.");
            hideProgressOverlay();
            return;
        }

        if (trimmingNotification) trimmingNotification.style.display = "none";
        showProgressOverlay("Decodificando audio...");
        logProgress("Decodificando audio...");

        localAudioContext.decodeAudioData(arrayBuffer).then(function (buffer) {
            const originalDuration = buffer.duration;
            const targetDurationSeconds = 2;
            const sampleRate = buffer.sampleRate;
            const maxSamplesToKeep = Math.floor(sampleRate * targetDurationSeconds);
            const fullChannelData = buffer.getChannelData(0);
            const actualSamplesToUse = Math.min(fullChannelData.length, maxSamplesToKeep);

            currentLibraryMetadata = null;
            currentTruncationState = null;
            reconstructedAudioBuffer = null;
            fullReconstructedAudioValuesList = null;

            if (originalDuration > targetDurationSeconds && trimmingNotification) {
                trimmingNotification.textContent = "Nota: Audio original (" + originalDuration.toFixed(2) + "s) > " + targetDurationSeconds + "s. Será recortado para análisis. Se puede reproducir completo.";
                trimmingNotification.style.display = "block";
            }

            currentAudioData = actualSamplesToUse < fullChannelData.length
                ? fullChannelData.slice(0, actualSamplesToUse)
                : fullChannelData.slice(0);

            originalAudioBuffer = buffer;
            fullAudioValuesList = Array.from(currentAudioData);

            const maxCoeffs = Math.floor(currentAudioData.length / 2);
            const numTruncateInput = document.getElementById("numTruncateCoefficientsInput");
            const compressBtn = document.getElementById("compressBtn");
            const playOrigBtn = document.getElementById("playOriginalBtn");
            const playReconBtn = document.getElementById("playReconstructedBtn");
            const precomputedSelect = document.getElementById("precomputedReconstructionSelect");

            if (numTruncateInput) {
                numTruncateInput.max = maxCoeffs > 0 ? String(maxCoeffs) : "1";
                const currentTruncVal = parseInt(numTruncateInput.value, 10);
                if (isNaN(currentTruncVal) || currentTruncVal > maxCoeffs || currentTruncVal < 0) {
                    numTruncateInput.value = String(Math.min(10000, maxCoeffs > 0 ? maxCoeffs : 0));
                }
            }

            if (compressBtn) compressBtn.disabled = false;
            if (playOrigBtn) playOrigBtn.disabled = false;
            if (playReconBtn) playReconBtn.disabled = true;
            if (precomputedSelect) {
                precomputedSelect.value = "";
                precomputedSelect.disabled = true;
            }

            processLoadedAudioData();
            logProgress("Audio listo para análisis DFT.");
            hideProgressOverlay();
        }).catch(function (error) {
            logProgress("Error decodificando audio: " + error.message);
            console.error("DFT Demo: decodeAudioData error", error);
            alert("Error al decodificar archivo. ¿Formato compatible?\n" + error.message);
            resetAppState({ suppressLog: true });
        }).finally(function () {
            hideProgressOverlay();
        });
    }

    function handleAudioFileChange(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        logProgress("Archivo \"" + file.name + "\" seleccionado. Leyendo...");
        resetAppState({ suppressLog: true });

        const reader = new FileReader();
        reader.onload = function (loadEvent) {
            processAudioBuffer(loadEvent.target.result);
        };
        reader.onerror = function (error) {
            logProgress("Error leyendo el archivo: " + error);
            resetAppState({ suppressLog: true });
        };
        reader.readAsArrayBuffer(file);
    }

    async function fetchFloat32Array(url) {
        if (precomputedArrayCache.has(url)) {
            return precomputedArrayCache.get(url);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("No se pudo cargar " + url + ".");
        }

        const array = new Float32Array(await response.arrayBuffer());
        precomputedArrayCache.set(url, array);
        return array;
    }

    function createComplexListFromInterleaved(interleavedArray) {
        const coefficients = new Array(Math.floor(interleavedArray.length / 2));
        for (let index = 0, coeffIndex = 0; index < interleavedArray.length; index += 2, coeffIndex++) {
            coefficients[coeffIndex] = new Complex(interleavedArray[index], interleavedArray[index + 1]);
        }
        return coefficients;
    }

    async function loadDecodedAudioBufferFromUrl(url) {
        if (decodedAudioBufferCache.has(url)) {
            return decodedAudioBufferCache.get(url);
        }

        const localAudioContext = getAudioContext();
        if (!localAudioContext) {
            throw new Error("AudioContext no disponible.");
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("No se pudo descargar el audio original.");
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await localAudioContext.decodeAudioData(arrayBuffer.slice(0));
        decodedAudioBufferCache.set(url, audioBuffer);
        return audioBuffer;
    }

    function getManifestEntry(audioId) {
        if (!precomputedManifest || !Array.isArray(precomputedManifest.audios)) {
            return null;
        }
        return precomputedManifest.audios.find(function (audio) {
            return audio.id === audioId;
        }) || null;
    }

    function populateLibraryAudioSelect() {
        const librarySelect = document.getElementById("libraryAudioSelect");
        if (!librarySelect) {
            return;
        }

        librarySelect.innerHTML = '<option value="">Selecciona un audio precalculado</option>';
        if (!precomputedManifest || !Array.isArray(precomputedManifest.audios)) {
            librarySelect.disabled = true;
            return;
        }

        precomputedManifest.audios.forEach(function (audio) {
            const option = document.createElement("option");
            option.value = audio.id;
            option.textContent = audio.label + " (" + audio.sampleRate + " Hz)";
            librarySelect.appendChild(option);
        });
        librarySelect.disabled = false;
    }

    function populatePrecomputedReconstructionSelect() {
        const reconstructionSelect = document.getElementById("precomputedReconstructionSelect");
        if (!reconstructionSelect) {
            return;
        }

        const levels = precomputedManifest && Array.isArray(precomputedManifest.reconstructionLevels)
            ? precomputedManifest.reconstructionLevels
            : [500, 1000, 1500, 2000, 3000, 5000];

        reconstructionSelect.innerHTML = '<option value="">Selecciona una reconstrucción</option>';
        levels.forEach(function (level) {
            const option = document.createElement("option");
            option.value = String(level);
            option.textContent = String(level);
            reconstructionSelect.appendChild(option);
        });
        reconstructionSelect.disabled = true;
    }

    async function loadLibraryReconstruction(reconstructionKey, options) {
        const settings = Object.assign({ showOverlay: true }, options || {});
        if (!currentLibraryMetadata || !currentLibraryMetadata.files || !currentLibraryMetadata.files.reconstructions) {
            return;
        }

        const reconstructionUrl = currentLibraryMetadata.files.reconstructions[reconstructionKey];
        if (!reconstructionUrl) {
            throw new Error("Reconstrucción precalculada no disponible para " + reconstructionKey + " coeficientes.");
        }

        if (settings.showOverlay) {
            showProgressOverlay("Cargando reconstrucción precalculada (" + reconstructionKey + " coeficientes)...");
        }
        logProgress("Cargando reconstrucción precalculada con " + reconstructionKey + " coeficientes...");

        const reconstructedSamples = await fetchFloat32Array(reconstructionUrl);
        fullReconstructedAudioValuesList = Array.from(reconstructedSamples);
        reconstructedAudioBuffer = createMonoAudioBuffer(reconstructedSamples, currentLibraryMetadata.sampleRate);
        currentTruncationState = { keepCount: parseInt(reconstructionKey, 10) || 0 };

        updateReconstructedDisplayedValues();
        drawReconstructedWaveform(reconstructedSamples);
        displayTruncatedDFTCoefficients();

        const playReconBtn = document.getElementById("playReconstructedBtn");
        if (playReconBtn) {
            playReconBtn.disabled = !reconstructedAudioBuffer;
        }

        const numTruncInput = document.getElementById("numTruncateCoefficientsInput");
        if (numTruncInput) {
            numTruncInput.value = String(currentTruncationState.keepCount);
        }

        logProgress("Reconstrucción precalculada cargada correctamente.");
        if (settings.showOverlay) {
            hideProgressOverlay();
        }
    }

    async function loadLibraryAudio(audioId) {
        const manifestEntry = getManifestEntry(audioId);
        if (!manifestEntry) {
            throw new Error("No se encontró el audio seleccionado en la biblioteca.");
        }

        resetAppState({ preserveLibrarySelection: true, suppressLog: true });
        showProgressOverlay("Cargando audio precalculado...");
        logProgress("Cargando audio de biblioteca: " + manifestEntry.label + "...");

        try {
            const audioValuesPromise = fetchFloat32Array(manifestEntry.files.audioValues);
            const dftPromise = fetchFloat32Array(manifestEntry.files.dftCoefficients);
            const originalBufferPromise = loadDecodedAudioBufferFromUrl(manifestEntry.audioUrl);
            const results = await Promise.all([audioValuesPromise, dftPromise, originalBufferPromise]);

            currentLibraryMetadata = manifestEntry;
            currentAudioData = results[0];
            fullAudioValuesList = Array.from(currentAudioData);
            fullDFTCoefficientsList = createComplexListFromInterleaved(results[1]);
            originalAudioBuffer = results[2];
            fullReconstructedAudioValuesList = null;
            reconstructedAudioBuffer = null;
            currentTruncationState = null;

            if (trimmingNotification && manifestEntry.wasTrimmed) {
                trimmingNotification.textContent = "Nota: el audio de biblioteca original dura " + manifestEntry.originalDuration.toFixed(2) + "s y se ha recortado a los primeros " + manifestEntry.processedDuration.toFixed(2) + "s para el análisis precalculado. La reproducción original sigue siendo completa.";
                trimmingNotification.style.display = "block";
            }

            const playOrigBtn = document.getElementById("playOriginalBtn");
            const playReconBtn = document.getElementById("playReconstructedBtn");
            const precomputedSelect = document.getElementById("precomputedReconstructionSelect");
            const numTruncInput = document.getElementById("numTruncateCoefficientsInput");

            if (playOrigBtn) playOrigBtn.disabled = false;
            if (playReconBtn) playReconBtn.disabled = true;
            if (numTruncInput) {
                numTruncInput.max = String(fullDFTCoefficientsList.length);
            }
            if (precomputedSelect) {
                precomputedSelect.disabled = false;
            }

            processLoadedAudioData();
            logProgress("Vector ℓ² y DFT precalculados cargados sin recalcular.");

            const defaultReconstruction = manifestEntry.files.reconstructions[DEFAULT_LIBRARY_RECONSTRUCTION]
                ? DEFAULT_LIBRARY_RECONSTRUCTION
                : Object.keys(manifestEntry.files.reconstructions)[0];

            if (precomputedSelect) {
                precomputedSelect.value = defaultReconstruction;
            }

            await loadLibraryReconstruction(defaultReconstruction, { showOverlay: false });
        } finally {
            hideProgressOverlay();
        }
    }

    async function loadPrecomputedManifest() {
        const libraryRadio = document.querySelector('.dft-app-container input[name="inputMethod"][value="library"]');
        const librarySelect = document.getElementById("libraryAudioSelect");

        try {
            const response = await fetch(PRECOMPUTED_MANIFEST_URL);
            if (!response.ok) {
                throw new Error("No se pudo obtener el manifiesto precalculado.");
            }

            precomputedManifest = await response.json();
            populateLibraryAudioSelect();
            populatePrecomputedReconstructionSelect();
            logProgress("Biblioteca de audios precalculados disponible.");
        } catch (error) {
            console.error("DFT Demo: Error loading precomputed manifest", error);
            logProgress("No se pudo cargar la biblioteca de audios precalculados: " + error.message);
            if (libraryRadio) {
                libraryRadio.disabled = true;
            }
            if (librarySelect) {
                librarySelect.disabled = true;
            }
        }
    }

    function setupEventListeners() {
        clearAudioBtn = document.getElementById("clearAudioBtn");

        const audioFileInput = document.getElementById("audioFile");
        const libraryAudioSelect = document.getElementById("libraryAudioSelect");
        const precomputedReconstructionSelect = document.getElementById("precomputedReconstructionSelect");
        const compressBtn = document.getElementById("compressBtn");
        const reconstructBtn = document.getElementById("reconstructBtn");
        const playOrigBtn = document.getElementById("playOriginalBtn");
        const playReconBtn = document.getElementById("playReconstructedBtn");
        const numValuesInput = document.getElementById("numValuesInput");
        const numCoeffsInput = document.getElementById("numCoefficientsInput");
        const numTruncInput = document.getElementById("numTruncateCoefficientsInput");
        const startRecBtn = document.getElementById("startRec");
        const stopRecBtn = document.getElementById("stopRec");

        if (audioFileInput) {
            audioFileInput.addEventListener("change", handleAudioFileChange);
        }
        if (clearAudioBtn) {
            clearAudioBtn.addEventListener("click", function () {
                resetAppState();
            });
        }

        document.querySelectorAll('.dft-app-container input[name="inputMethod"]').forEach(function (radio) {
            radio.addEventListener("change", function () {
                resetAppState();
            });
        });

        if (libraryAudioSelect) {
            libraryAudioSelect.addEventListener("change", async function () {
                if (!this.value) {
                    resetAppState({ preserveLibrarySelection: true, suppressLog: true });
                    return;
                }

                try {
                    await loadLibraryAudio(this.value);
                } catch (error) {
                    logProgress("Error cargando audio de biblioteca: " + error.message);
                    console.error("DFT Demo: Error loading library audio", error);
                    alert("No se pudo cargar el audio de biblioteca. " + error.message);
                    resetAppState({ preserveLibrarySelection: true, suppressLog: true });
                }
            });
        }

        if (precomputedReconstructionSelect) {
            precomputedReconstructionSelect.addEventListener("change", async function () {
                if (getSelectedInputMethod() !== "library" || !this.value || !currentLibraryMetadata) {
                    return;
                }
                try {
                    await loadLibraryReconstruction(this.value);
                } catch (error) {
                    logProgress("Error cargando reconstrucción precalculada: " + error.message);
                    console.error("DFT Demo: Error loading precomputed reconstruction", error);
                    alert("No se pudo cargar la reconstrucción precalculada. " + error.message);
                } finally {
                    hideProgressOverlay();
                }
            });
        }

        if (compressBtn) {
            compressBtn.addEventListener("click", function () {
                if (!currentAudioData || currentAudioData.length === 0) {
                    alert("Carga o graba audio primero.");
                    logProgress("Error: DFT sin datos.");
                    return;
                }

                logProgress("Calculando DFT...");
                showProgressOverlay("Calculando DFT...");
                setTimeout(function () {
                    try {
                        const startTime = performance.now();
                        const spectrum = calculateDFT(currentAudioData);
                        const endTime = performance.now();

                        fullDFTCoefficientsList = spectrum.slice();
                        currentTruncationState = null;
                        reconstructedAudioBuffer = null;
                        fullReconstructedAudioValuesList = null;

                        displayDFTCoefficients();
                        displayTruncatedDFTCoefficients();
                        logProgress("DFT calculada (" + spectrum.length + " coeficientes) en " + (endTime - startTime).toFixed(1) + " ms.");

                        const maxDFTCoeffs = fullDFTCoefficientsList.length;
                        if (numTruncInput) {
                            numTruncInput.max = maxDFTCoeffs > 0 ? String(maxDFTCoeffs) : "0";
                            let currentTruncVal = parseInt(numTruncInput.value, 10);
                            if (isNaN(currentTruncVal) || currentTruncVal < 0 || currentTruncVal > maxDFTCoeffs) {
                                currentTruncVal = maxDFTCoeffs;
                            }
                            numTruncInput.value = String(currentTruncVal);
                        }

                        if (reconstructBtn) reconstructBtn.disabled = false;
                        if (playReconBtn) playReconBtn.disabled = true;
                    } catch (error) {
                        logProgress("Error cálculo DFT: " + error.message);
                        console.error("DFT Demo: Error in DFT calculation", error);
                        if (reconstructBtn) reconstructBtn.disabled = true;
                    } finally {
                        hideProgressOverlay();
                    }
                }, 10);
            });
        }

        if (reconstructBtn) {
            reconstructBtn.addEventListener("click", function () {
                if (!fullDFTCoefficientsList) {
                    alert("Calcula la DFT primero.");
                    logProgress("Error: Reconstrucción sin DFT.");
                    return;
                }

                let numToKeep = 0;
                const maxCoeffs = fullDFTCoefficientsList.length;
                if (numTruncInput) {
                    numToKeep = parseInt(numTruncInput.value, 10);
                    if (isNaN(numToKeep) || numToKeep < 0) {
                        numToKeep = 0;
                        numTruncInput.value = "0";
                    }
                    if (numToKeep > maxCoeffs) {
                        numToKeep = maxCoeffs;
                        numTruncInput.value = String(numToKeep);
                    }
                }

                showProgressOverlay("Reconstruyendo (" + numToKeep + " coeficientes)...");
                logProgress("Reconstruyendo con " + numToKeep + " coeficientes...");
                setTimeout(function () {
                    try {
                        const truncated = truncateDFTCoefficients(fullDFTCoefficientsList, numToKeep);
                        reconstructAudio(truncated, numToKeep);
                    } catch (error) {
                        logProgress("Error reconstrucción: " + error.message);
                        console.error("DFT Demo: Error during reconstruction", error);
                    } finally {
                        hideProgressOverlay();
                    }
                }, 10);
            });
        }

        if (playOrigBtn) {
            playOrigBtn.addEventListener("click", function () {
                playAudioBuffer(originalAudioBuffer, "Original");
            });
        }
        if (playReconBtn) {
            playReconBtn.addEventListener("click", function () {
                playAudioBuffer(reconstructedAudioBuffer, "Reconstruido");
            });
        }

        if (numValuesInput) {
            numValuesInput.addEventListener("input", function () {
                updateDisplayedValues();
                updateReconstructedDisplayedValues();
            });
        }
        if (numCoeffsInput) {
            numCoeffsInput.addEventListener("input", function () {
                displayDFTCoefficients();
                displayTruncatedDFTCoefficients();
            });
        }
        if (numTruncInput) {
            numTruncInput.addEventListener("input", function () {
                const val = parseInt(this.value, 10);
                const maxVal = this.max ? parseInt(this.max, 10) : null;
                if (isNaN(val) || val < 0) {
                    this.style.borderColor = "red";
                } else if (maxVal !== null && val > maxVal) {
                    this.style.borderColor = "orange";
                } else {
                    this.style.borderColor = "";
                }
            });
        }

        if (startRecBtn) {
            startRecBtn.addEventListener("click", function () {
                resetAppState({ suppressLog: true });
                navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
                    if (typeof MediaRecorder === "undefined") {
                        throw new Error("MediaRecorder no soportado.");
                    }

                    let options = { mimeType: "audio/webm" };
                    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/wav;codecs=pcm")) {
                        options = { mimeType: "audio/wav;codecs=pcm" };
                    } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
                        options = { mimeType: "audio/ogg;codecs=opus" };
                    }

                    mediaRecorder = new MediaRecorder(stream, options);
                    recordedBuffer = [];

                    mediaRecorder.ondataavailable = function (event) {
                        if (event.data.size > 0) {
                            recordedBuffer.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = function () {
                        stream.getTracks().forEach(function (track) { track.stop(); });
                        if (!recordedBuffer || recordedBuffer.length === 0) {
                            logProgress("Error: No se grabaron datos.");
                            resetAppState({ suppressLog: true });
                            return;
                        }

                        const blob = new Blob(recordedBuffer, { type: mediaRecorder.mimeType });
                        const reader = new FileReader();
                        reader.onload = function (loadEvent) {
                            processAudioBuffer(loadEvent.target.result);
                        };
                        reader.onerror = function (error) {
                            logProgress("Error leyendo Blob grabado: " + error);
                            resetAppState({ suppressLog: true });
                        };
                        reader.readAsArrayBuffer(blob);

                        if (startRecBtn) startRecBtn.disabled = false;
                        if (stopRecBtn) stopRecBtn.disabled = true;
                        logProgress("Grabación finalizada. Procesando...");
                    };

                    mediaRecorder.onerror = function (event) {
                        stream.getTracks().forEach(function (track) { track.stop(); });
                        logProgress("Error grabación: " + event.error.message);
                        resetAppState({ suppressLog: true });
                    };

                    mediaRecorder.start();
                    if (startRecBtn) startRecBtn.disabled = true;
                    if (stopRecBtn) stopRecBtn.disabled = false;
                    logProgress("Grabación iniciada...");
                }).catch(function (error) {
                    logProgress("Error acceso micrófono: " + error.name + " - " + error.message);
                    alert("Error acceso micrófono. " + error.message);
                    resetAppState({ suppressLog: true });
                });
            });
        }

        if (stopRecBtn) {
            stopRecBtn.addEventListener("click", function () {
                if (mediaRecorder && mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                    logProgress("Deteniendo grabación...");
                }
            });
        }

        window.addEventListener("resize", function () {
            if (currentAudioData && fullReconstructedAudioValuesList) {
                drawReconstructedWaveform(fullReconstructedAudioValuesList);
            } else if (currentAudioData) {
                drawWaveform(currentAudioData);
            } else {
                resetWaveformCanvas();
            }
        });

        logProgress("DFT Demo: Event listeners configurados.");
    }

    function init() {
        resetAppState({ suppressLog: true });
        setupEventListeners();
        getAudioContext();
        loadPrecomputedManifest();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
