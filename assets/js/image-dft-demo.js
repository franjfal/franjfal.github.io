(function () {
    class Complex {
        constructor(real, imag) {
            this.real = real;
            this.imag = imag;
        }

        magnitude() {
            return Math.sqrt(this.real * this.real + this.imag * this.imag);
        }
    }

    const PRECOMPUTED_MANIFEST_URL = "/assets/MatExp/analisis/hilbert/image-filter/precomputed/manifest.json";

    let precomputedManifest = null;
    let currentLibraryImageMetadata = null;
    let currentLibraryMagnitudeData = null;
    const precomputedBinaryCache = new Map();
    const precomputedImageCache = new Map();

    window.currentSpectrum = null;
    window.currentImageData = null;
    window.currentFilteredPixelData = null;

    const imageFileInput = document.getElementById("imageFile");
    const libraryImageSelect = document.getElementById("libraryImageSelect");
    const libraryCutoffSelect = document.getElementById("precomputedCutoffSelect");
    const applyFilterButton = document.getElementById("applyFilter");
    const originalCanvas = document.getElementById("originalCanvas");
    const resultOriginalCanvas = document.getElementById("resultOriginalCanvas");
    const filteredCanvas = document.getElementById("filteredCanvas");
    const originalSpectrumCanvas = document.getElementById("originalSpectrumCanvas");
    const filteredSpectrumCanvas = document.getElementById("filteredSpectrumCanvas");
    const imageMatrixInitialPre = document.getElementById("imageMatrixInitialPre");
    const fourierMatrixPre = document.getElementById("fourierMatrixPre");
    const resultOriginalMatrixPre = document.getElementById("resultOriginalMatrixPre");
    const filteredMatrixPre = document.getElementById("filteredMatrixPre");
    const numImageMatrixSizeInput = document.getElementById("numImageMatrixSizeInput");
    const numDftMatrixSizeInput = document.getElementById("numDftMatrixSizeInput");
    const numFilteredMatrixSizeInput = document.getElementById("numFilteredMatrixSizeInput");
    const resultImageMatrixSizeDisplay = document.getElementById("resultImageMatrixSizeDisplay");
    const progressLogDiv = document.getElementById("progressLog");
    const filterTypeSelect = document.getElementById("filterType");
    const cutoffFreqSlider = document.getElementById("cutoffFreq");
    const cutoffValueSpan = document.getElementById("cutoffValue");

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
        let overlay = document.getElementById("loadingOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "loadingOverlay";
            overlay.innerHTML = '<div class="loading-content"><div class="loading-message">Procesando...</div><div class="progress-container"><div class="progress-bar">0%</div></div></div>';
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    const loadingOverlay = createLoadingOverlay();

    function showLoadingOverlay(message) {
        const msgElement = loadingOverlay.querySelector(".loading-message");
        const progressBar = loadingOverlay.querySelector(".progress-bar");
        if (msgElement) msgElement.textContent = message || "Procesando...";
        if (progressBar) {
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";
        }
        loadingOverlay.style.display = "flex";
    }

    function hideLoadingOverlay() {
        loadingOverlay.style.display = "none";
    }

    function updateProgress(percentage) {
        const progressBar = loadingOverlay.querySelector(".progress-bar");
        if (progressBar) {
            const roundedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
            progressBar.style.width = `${roundedPercentage}%`;
            progressBar.textContent = `${roundedPercentage}%`;
        }
    }

    function getSelectedInputMethod() {
        const selected = document.querySelector('.container input[name="inputMethod"]:checked');
        return selected ? selected.value : "file";
    }

    function updateModeVisibility() {
        const method = getSelectedInputMethod();
        const fileSection = document.getElementById("fileSection");
        const librarySection = document.getElementById("librarySection");
        const manualFilterControls = document.getElementById("manualFilterControls");
        const libraryFilterControls = document.getElementById("libraryFilterControls");
        const libraryHint = document.getElementById("libraryPrecomputedHint");

        if (fileSection) fileSection.style.display = method === "file" ? "block" : "none";
        if (librarySection) librarySection.style.display = method === "library" ? "block" : "none";
        if (manualFilterControls) manualFilterControls.style.display = method === "library" ? "none" : "flex";
        if (libraryFilterControls) libraryFilterControls.style.display = method === "library" ? "flex" : "none";
        if (libraryHint) libraryHint.style.display = method === "library" ? "block" : "none";
        if (applyFilterButton) {
            applyFilterButton.textContent = method === "library" ? "Cargar Filtro Precalculado" : "Aplicar Filtro y Calcular IDFT";
        }
    }

    function clearCanvas(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 1;
        canvas.height = 1;
    }

    function setDefaultTextContent() {
        if (imageMatrixInitialPre) imageMatrixInitialPre.textContent = "No hay datos para mostrar.";
        if (fourierMatrixPre) fourierMatrixPre.textContent = "No hay datos para mostrar.";
        if (resultOriginalMatrixPre) resultOriginalMatrixPre.textContent = "No hay datos para mostrar.";
        if (filteredMatrixPre) filteredMatrixPre.textContent = "No hay datos para mostrar.";

        const imageHeader = document.getElementById("imageMatrixInitialHeader");
        const fourierHeader = document.getElementById("fourierMatrixHeader");
        const resultHeader = document.getElementById("resultOriginalMatrixHeader");
        const filteredHeader = document.getElementById("filteredMatrixHeader");
        if (imageHeader) imageHeader.textContent = "Valores de la Matriz (Primeros 10x10)";
        if (fourierHeader) fourierHeader.textContent = "Coeficientes DFT (Magnitud, Primeros 10x10, No Centrado)";
        if (resultHeader) resultHeader.textContent = "Valores de la Matriz (Primeros 10x10)";
        if (filteredHeader) filteredHeader.textContent = "Valores de la Matriz Filtrada (Primeros 10x10)";
    }

    function clearOutputAreas(options) {
        const settings = Object.assign({ suppressLog: false }, options || {});
        if (!settings.suppressLog) {
            logProgress("Limpiando resultados previos...");
        }
        [resultOriginalCanvas, filteredCanvas, originalSpectrumCanvas, filteredSpectrumCanvas, originalCanvas].forEach(clearCanvas);
        setDefaultTextContent();
        if (numImageMatrixSizeInput) numImageMatrixSizeInput.value = 10;
        if (numDftMatrixSizeInput) numDftMatrixSizeInput.value = 10;
        if (numFilteredMatrixSizeInput) numFilteredMatrixSizeInput.value = 10;
        if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = "10";
    }

    function resetAppState(options) {
        const settings = Object.assign({ preserveLibrarySelection: false, suppressLog: false }, options || {});
        const preservedLibrarySelection = settings.preserveLibrarySelection && libraryImageSelect ? libraryImageSelect.value : "";
        const preservedCutoffSelection = settings.preserveLibrarySelection && libraryCutoffSelect ? libraryCutoffSelect.value : "";

        window.currentSpectrum = null;
        window.currentImageData = null;
        window.currentFilteredPixelData = null;
        currentLibraryImageMetadata = null;
        currentLibraryMagnitudeData = null;

        clearOutputAreas({ suppressLog: true });

        if (!settings.suppressLog) {
            logProgress("Estado reiniciado.");
        }

        if (imageFileInput && !settings.preserveLibrarySelection) {
            imageFileInput.value = "";
        }
        if (libraryImageSelect) {
            libraryImageSelect.value = preservedLibrarySelection;
        }
        if (libraryCutoffSelect) {
            libraryCutoffSelect.value = preservedCutoffSelection || (precomputedManifest && precomputedManifest.cutoffPresets && precomputedManifest.cutoffPresets.includes(50) ? "50" : "");
        }
        updateApplyButtonState();
        updateModeVisibility();
    }

    async function processInChunks(total, chunkSize, taskFunction) {
        const numChunks = Math.ceil(total / chunkSize);
        logProgress(`Iniciando tarea por bloques (${numChunks} bloques)...`);
        for (let i = 0; i < numChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, total);
            taskFunction(start, end);
            updateProgress(((i + 1) / numChunks) * 100);
            await new Promise(function (resolve) { setTimeout(resolve, 0); });
        }
        logProgress("Tarea completada.");
    }

    function fftShift(spectrum) {
        const height = spectrum.length;
        if (height === 0) return [];
        const width = spectrum[0].length;
        const shiftedSpectrum = Array(height).fill(null).map(function () { return Array(width); });
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
        const spectrum = Array(height).fill(null).map(function () { return Array(width); });
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

    async function calculate2DDFT(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        logProgress(`Calculando DFT de ${width}x${height}. Esto puede tardar...`);
        showLoadingOverlay(`Calculando DFT (${width}x${height})...`);
        const spectrum = Array(height).fill(null).map(function () {
            return Array(width).fill(null).map(function () { return new Complex(0, 0); });
        });
        const chunkSize = Math.max(1, Math.floor(height / 20));
        await processInChunks(height, chunkSize, function (startK, endK) {
            for (let k = startK; k < endK; k++) {
                for (let l = 0; l < width; l++) {
                    let realSum = 0;
                    let imagSum = 0;
                    for (let m = 0; m < height; m++) {
                        for (let n = 0; n < width; n++) {
                            const pixelIndex = (m * width + n) * 4;
                            const pixelValue = imageData.data[pixelIndex];
                            const angle = 2 * Math.PI * ((k * m / height) + (l * n / width));
                            realSum += pixelValue * Math.cos(angle);
                            imagSum -= pixelValue * Math.sin(angle);
                        }
                    }
                    spectrum[k][l] = new Complex(realSum, imagSum);
                }
            }
        });
        logProgress("DFT calculada.");
        return spectrum;
    }

    async function calculate2DIDFT(spectrum) {
        const height = spectrum.length;
        if (height === 0) return new Uint8ClampedArray(0);
        const width = spectrum[0].length;
        logProgress(`Calculando IDFT de ${width}x${height}...`);
        showLoadingOverlay(`Calculando IDFT (${width}x${height})...`);
        const resultData = new Uint8ClampedArray(width * height * 4);
        const spatialDomainValues = Array(height).fill(null).map(function () { return Array(width).fill(0); });
        const total = width * height;
        let minVal = Infinity;
        let maxVal = -Infinity;
        const chunkSize = Math.max(1, Math.floor(height / 15));
        await processInChunks(height, chunkSize, function (startX, endX) {
            for (let x = startX; x < endX; x++) {
                for (let y = 0; y < width; y++) {
                    let sumReal = 0;
                    for (let k = 0; k < height; k++) {
                        for (let l = 0; l < width; l++) {
                            const angle = 2 * Math.PI * ((k * x / height) + (l * y / width));
                            const specVal = spectrum[k][l];
                            sumReal += (specVal.real * Math.cos(angle) - specVal.imag * Math.sin(angle));
                        }
                    }
                    const realValue = sumReal / total;
                    spatialDomainValues[x][y] = realValue;
                    if (realValue < minVal) minVal = realValue;
                    if (realValue > maxVal) maxVal = realValue;
                }
            }
        });
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
        logProgress("IDFT calculada y normalizada.");
        hideLoadingOverlay();
        return resultData;
    }

    function applyFilter(spectrum, type, cutoffRatio) {
        const height = spectrum.length;
        if (height === 0) return [];
        const width = spectrum[0].length;
        logProgress(`Aplicando filtro ${type} con corte ${Math.round(cutoffRatio * 100)}%.`);
        const shiftedSpectrum = fftShift(spectrum);
        const filteredShiftedSpectrum = Array(height).fill(null).map(function () { return Array(width); });
        const centerY = Math.floor(height / 2);
        const centerX = Math.floor(width / 2);
        const maxDist = Math.sqrt(centerY * centerY + centerX * centerX);
        const cutoffDist = cutoffRatio * maxDist;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const distance = Math.sqrt(Math.pow(y - centerY, 2) + Math.pow(x - centerX, 2));
                let filterMaskValue = 0;
                switch (type) {
                    case "lowpass":
                        filterMaskValue = distance <= cutoffDist ? 1 : 0;
                        break;
                    case "highpass":
                        filterMaskValue = distance >= cutoffDist ? 1 : 0;
                        break;
                    case "bandpass": {
                        const bandWidth = 0.15 * maxDist;
                        const lowerBound = cutoffDist - bandWidth / 2;
                        const upperBound = cutoffDist + bandWidth / 2;
                        filterMaskValue = distance >= lowerBound && distance <= upperBound ? 1 : 0;
                        break;
                    }
                    default:
                        filterMaskValue = 1;
                }
                filteredShiftedSpectrum[y][x] = filterMaskValue === 1 ? shiftedSpectrum[y][x] : new Complex(0, 0);
            }
        }
        return ifftShift(filteredShiftedSpectrum);
    }

    function displayImageOnCanvas(canvasElement, imageData) {
        if (!canvasElement || !imageData) return;
        canvasElement.width = imageData.width;
        canvasElement.height = imageData.height;
        const ctx = canvasElement.getContext("2d");
        if (ctx) {
            ctx.putImageData(imageData, 0, 0);
        }
    }

    function grayscaleValuesToRgba(values) {
        const rgba = new Uint8ClampedArray(values.length * 4);
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const idx = i * 4;
            rgba[idx] = value;
            rgba[idx + 1] = value;
            rgba[idx + 2] = value;
            rgba[idx + 3] = 255;
        }
        return rgba;
    }

    function displayGrayscaleValuesOnCanvas(canvasElement, width, height, grayscaleValues) {
        if (!canvasElement || !grayscaleValues) return;
        canvasElement.width = width;
        canvasElement.height = height;
        const ctx = canvasElement.getContext("2d");
        if (!ctx) return;
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(grayscaleValuesToRgba(grayscaleValues));
        ctx.putImageData(imageData, 0, 0);
    }

    async function displaySpectrumFromUrl(canvasElement, url) {
        if (!canvasElement || !url) return;
        const image = await loadCachedImage(url);
        canvasElement.width = image.naturalWidth || image.width;
        canvasElement.height = image.naturalHeight || image.height;
        const ctx = canvasElement.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.drawImage(image, 0, 0);
    }

    function displayMatrixValues(preElementId, headerElementId, data, width, height, baseLabel, maxSize) {
        const preElement = document.getElementById(preElementId);
        const headerElement = document.getElementById(headerElementId);
        if (!preElement || !headerElement) return;
        const displaySize = Math.max(1, Math.min(maxSize || 10, width || 0, height || 0));
        headerElement.textContent = displaySize ? `${baseLabel} (Primeros ${displaySize}x${displaySize})` : baseLabel;
        if (!data || width === 0 || height === 0) {
            preElement.textContent = "No hay datos para mostrar.";
            return;
        }
        let matrixText = "";
        for (let y = 0; y < displaySize; y++) {
            let rowText = "";
            for (let x = 0; x < displaySize; x++) {
                const pixelIndex = (y * width + x) * 4;
                rowText += String(data[pixelIndex] || 0).padStart(4) + " ";
            }
            matrixText += rowText.trim() + "\n";
        }
        preElement.textContent = matrixText.trim();
    }

    function displayMagnitudeMatrixValues(preElementId, headerElementId, magnitudes, width, height, baseLabel, maxSize) {
        const preElement = document.getElementById(preElementId);
        const headerElement = document.getElementById(headerElementId);
        if (!preElement || !headerElement) return;
        const displaySize = Math.max(1, Math.min(maxSize || 10, width || 0, height || 0));
        headerElement.textContent = displaySize ? `${baseLabel} (Primeros ${displaySize}x${displaySize}, No Centrado)` : baseLabel;
        if (!magnitudes || width === 0 || height === 0) {
            preElement.textContent = "No hay datos para mostrar.";
            return;
        }
        let matrixText = "";
        for (let y = 0; y < displaySize; y++) {
            let rowText = "";
            for (let x = 0; x < displaySize; x++) {
                rowText += Number(magnitudes[y * width + x] || 0).toFixed(2).padStart(9) + " ";
            }
            matrixText += rowText.trim() + "\n";
        }
        preElement.textContent = matrixText.trim();
    }

    function displaySpectrum(canvasElement, spectrum) {
        if (!canvasElement || !spectrum || spectrum.length === 0 || !spectrum[0] || spectrum[0].length === 0) {
            clearCanvas(canvasElement);
            return;
        }
        const height = spectrum.length;
        const width = spectrum[0].length;
        canvasElement.width = width;
        canvasElement.height = height;
        const ctx = canvasElement.getContext("2d");
        if (!ctx) return;
        const imageData = ctx.createImageData(width, height);
        const shiftedSpectrum = fftShift(spectrum);
        let maxLogMag = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const magVal = shiftedSpectrum[y][x] instanceof Complex ? shiftedSpectrum[y][x].magnitude() : 0;
                maxLogMag = Math.max(maxLogMag, Math.log(1 + magVal));
            }
        }
        const normalizationFactor = maxLogMag > 1e-6 ? 255 / maxLogMag : 255;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const magVal = shiftedSpectrum[y][x] instanceof Complex ? shiftedSpectrum[y][x].magnitude() : 0;
                const pixelValue = Math.min(255, Math.round(Math.log(1 + magVal) * normalizationFactor));
                const idx = (y * width + x) * 4;
                imageData.data[idx] = pixelValue;
                imageData.data[idx + 1] = pixelValue;
                imageData.data[idx + 2] = pixelValue;
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function explainSpectrumChanges(filterType, cutoffRatio) {
        const cutoffPercent = (cutoffRatio * 100).toFixed(1);
        let explanation = `Filtro: ${filterType}, corte: ${cutoffPercent}%`;
        if (filterType === "lowpass") explanation += " -> se conservan bajas frecuencias.";
        if (filterType === "highpass") explanation += " -> se conservan altas frecuencias.";
        if (filterType === "bandpass") explanation += " -> se conserva un anillo de frecuencias.";
        logProgress(explanation);
    }

    async function fetchTypedArray(url, ArrayType) {
        const cacheKey = `${ArrayType.name}:${url}`;
        if (precomputedBinaryCache.has(cacheKey)) {
            return precomputedBinaryCache.get(cacheKey);
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`No se pudo cargar ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const typedArray = new ArrayType(arrayBuffer);
        precomputedBinaryCache.set(cacheKey, typedArray);
        return typedArray;
    }

    function fetchUint8Array(url) {
        return fetchTypedArray(url, Uint8Array);
    }

    function fetchFloat32Array(url) {
        return fetchTypedArray(url, Float32Array);
    }

    async function loadCachedImage(url) {
        if (precomputedImageCache.has(url)) {
            return precomputedImageCache.get(url);
        }
        const imagePromise = new Promise(function (resolve, reject) {
            const img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { reject(new Error(`No se pudo cargar la imagen ${url}`)); };
            img.src = url;
        });
        precomputedImageCache.set(url, imagePromise);
        return imagePromise;
    }

    function updateApplyButtonState() {
        if (!applyFilterButton) return;
        if (getSelectedInputMethod() === "library") {
            applyFilterButton.disabled = !currentLibraryImageMetadata || !libraryCutoffSelect || !libraryCutoffSelect.value;
        } else {
            applyFilterButton.disabled = !window.currentSpectrum || !window.currentImageData;
        }
    }

    function getDefaultLibraryCutoff() {
        if (!precomputedManifest || !Array.isArray(precomputedManifest.cutoffPresets)) {
            return "50";
        }
        if (precomputedManifest.cutoffPresets.indexOf(50) >= 0) {
            return "50";
        }
        return String(precomputedManifest.cutoffPresets[0] || "");
    }

    function populateLibraryImageSelect() {
        if (!libraryImageSelect) return;
        libraryImageSelect.innerHTML = '<option value="">Selecciona una imagen</option>';
        (precomputedManifest.images || []).forEach(function (imageMeta) {
            const option = document.createElement("option");
            option.value = imageMeta.id;
            option.textContent = imageMeta.label;
            libraryImageSelect.appendChild(option);
        });
        libraryImageSelect.disabled = false;
    }

    function populateLibraryCutoffSelect() {
        if (!libraryCutoffSelect) return;
        libraryCutoffSelect.innerHTML = '<option value="">Selecciona un corte</option>';
        const cutoffs = precomputedManifest && Array.isArray(precomputedManifest.cutoffPresets)
            ? precomputedManifest.cutoffPresets
            : [10, 20, 30, 40, 50, 60, 70, 80, 90];
        cutoffs.forEach(function (cutoff) {
            const option = document.createElement("option");
            option.value = String(cutoff);
            option.textContent = `${cutoff}%`;
            libraryCutoffSelect.appendChild(option);
        });
        libraryCutoffSelect.value = getDefaultLibraryCutoff();
        libraryCutoffSelect.disabled = false;
    }

    async function loadPrecomputedManifest() {
        const libraryRadio = document.querySelector('.container input[name="inputMethod"][value="library"]');
        try {
            const response = await fetch(PRECOMPUTED_MANIFEST_URL);
            if (!response.ok) {
                throw new Error("No se pudo obtener la biblioteca precalculada.");
            }
            precomputedManifest = await response.json();
            populateLibraryImageSelect();
            populateLibraryCutoffSelect();
            logProgress("Biblioteca de imágenes precalculadas disponible.");
        } catch (error) {
            logProgress("No se pudo cargar la biblioteca precalculada: " + error.message);
            if (libraryRadio) libraryRadio.disabled = true;
            if (libraryImageSelect) libraryImageSelect.disabled = true;
            if (libraryCutoffSelect) libraryCutoffSelect.disabled = true;
        }
    }

    async function loadLibraryImage(imageId) {
        const imageMeta = precomputedManifest && Array.isArray(precomputedManifest.images)
            ? precomputedManifest.images.find(function (item) { return item.id === imageId; })
            : null;
        if (!imageMeta) {
            throw new Error("Imagen precalculada no encontrada.");
        }

        showLoadingOverlay("Cargando imagen precalculada...");
        logProgress(`Cargando imagen de biblioteca: ${imageMeta.label}...`);
        try {
            currentLibraryImageMetadata = imageMeta;
            window.currentSpectrum = null;
            currentLibraryMagnitudeData = null;
            window.currentFilteredPixelData = null;

            const grayscaleValues = await fetchUint8Array(imageMeta.files.grayscalePixels);
            const dftMagnitude = await fetchFloat32Array(imageMeta.files.dftMagnitude);
            const expectedLength = imageMeta.processedWidth * imageMeta.processedHeight;
            if (grayscaleValues.length !== expectedLength || dftMagnitude.length !== expectedLength) {
                throw new Error("Los datos precalculados tienen dimensiones inválidas.");
            }

            const rgba = grayscaleValuesToRgba(grayscaleValues);
            const imageData = new ImageData(rgba, imageMeta.processedWidth, imageMeta.processedHeight);
            window.currentImageData = imageData;
            currentLibraryMagnitudeData = dftMagnitude;

            displayImageOnCanvas(originalCanvas, imageData);
            displayImageOnCanvas(resultOriginalCanvas, imageData);
            await displaySpectrumFromUrl(originalSpectrumCanvas, imageMeta.files.originalSpectrum);
            clearCanvas(filteredSpectrumCanvas);
            clearCanvas(filteredCanvas);

            const imageMatrixSize = parseInt(numImageMatrixSizeInput && numImageMatrixSizeInput.value, 10) || 10;
            displayMatrixValues("imageMatrixInitialPre", "imageMatrixInitialHeader", imageData.data, imageMeta.processedWidth, imageMeta.processedHeight, "Valores de la Matriz", imageMatrixSize);
            displayMatrixValues("resultOriginalMatrixPre", "resultOriginalMatrixHeader", imageData.data, imageMeta.processedWidth, imageMeta.processedHeight, "Valores de la Matriz", imageMatrixSize);
            if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = String(imageMatrixSize);

            const dftSize = parseInt(numDftMatrixSizeInput && numDftMatrixSizeInput.value, 10) || 10;
            displayMagnitudeMatrixValues("fourierMatrixPre", "fourierMatrixHeader", dftMagnitude, imageMeta.processedWidth, imageMeta.processedHeight, "Coeficientes DFT (Magnitud)", dftSize);

            if (imageMeta.wasResized) {
                logProgress(`La imagen se ha redimensionado a ${imageMeta.processedWidth}x${imageMeta.processedHeight} para la versión precalculada.`);
            }

            updateApplyButtonState();
            const defaultCutoff = libraryCutoffSelect && libraryCutoffSelect.value ? libraryCutoffSelect.value : getDefaultLibraryCutoff();
            if (libraryCutoffSelect) {
                libraryCutoffSelect.value = defaultCutoff;
            }
            await loadLibraryFilteredResult(filterTypeSelect ? filterTypeSelect.value : "lowpass", defaultCutoff, { showOverlay: false });
        } finally {
            hideLoadingOverlay();
        }
    }

    async function loadLibraryFilteredResult(filterType, cutoffValue, options) {
        const settings = Object.assign({ showOverlay: true }, options || {});
        if (!currentLibraryImageMetadata) {
            return;
        }
        const filterGroup = currentLibraryImageMetadata.files && currentLibraryImageMetadata.files.filtered
            ? currentLibraryImageMetadata.files.filtered[filterType]
            : null;
        const filterEntry = filterGroup ? filterGroup[String(cutoffValue)] : null;
        if (!filterEntry) {
            throw new Error("No existe una versión precalculada para esa combinación de filtro y corte.");
        }

        if (settings.showOverlay) {
            showLoadingOverlay(`Cargando ${filterType} ${cutoffValue}%...`);
        }
        logProgress(`Cargando filtro precalculado: ${filterType}, corte ${cutoffValue}%.`);

        try {
            const pixels = await fetchUint8Array(filterEntry.pixels);
            const expectedLength = currentLibraryImageMetadata.processedWidth * currentLibraryImageMetadata.processedHeight;
            if (pixels.length !== expectedLength) {
                throw new Error("Los píxeles precalculados no tienen el tamaño esperado.");
            }
            await displaySpectrumFromUrl(filteredSpectrumCanvas, filterEntry.spectrum);
            displayGrayscaleValuesOnCanvas(filteredCanvas, currentLibraryImageMetadata.processedWidth, currentLibraryImageMetadata.processedHeight, pixels);
            window.currentFilteredPixelData = grayscaleValuesToRgba(pixels);

            const filteredSize = parseInt(numFilteredMatrixSizeInput && numFilteredMatrixSizeInput.value, 10) || 10;
            displayMatrixValues("filteredMatrixPre", "filteredMatrixHeader", window.currentFilteredPixelData, currentLibraryImageMetadata.processedWidth, currentLibraryImageMetadata.processedHeight, "Valores de la Matriz Filtrada", filteredSize);
        } finally {
            if (settings.showOverlay) {
                hideLoadingOverlay();
            }
        }
    }

    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            logProgress("No se ha seleccionado ninguna imagen.");
            return;
        }
        if (!file.type.startsWith("image/")) {
            logProgress(`El archivo ${file.name} no es una imagen válida.`);
            alert("Por favor, selecciona un archivo de imagen válido.");
            imageFileInput.value = "";
            return;
        }

        logProgress(`Imagen seleccionada: ${file.name}.`);
        resetAppState({ preserveLibrarySelection: false, suppressLog: true });
        showLoadingOverlay("Cargando y procesando imagen...");
        currentLibraryImageMetadata = null;
        currentLibraryMagnitudeData = null;

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = async function () {
                const tempCanvas = document.createElement("canvas");
                const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
                if (!tempCtx) {
                    hideLoadingOverlay();
                    return;
                }

                const originalWidth = img.width;
                const originalHeight = img.height;
                const maxSize = 250;
                let newWidth = originalWidth;
                let newHeight = originalHeight;
                if (originalWidth > maxSize || originalHeight > maxSize) {
                    if (originalWidth > originalHeight) {
                        newWidth = maxSize;
                        newHeight = Math.round((originalHeight * maxSize) / originalWidth);
                    } else {
                        newHeight = maxSize;
                        newWidth = Math.round((originalWidth * maxSize) / originalHeight);
                    }
                    logProgress(`Redimensionada a ${newWidth}x${newHeight}.`);
                }

                tempCanvas.width = newWidth;
                tempCanvas.height = newHeight;
                tempCtx.drawImage(img, 0, 0, newWidth, newHeight);

                let imageData;
                try {
                    imageData = tempCtx.getImageData(0, 0, newWidth, newHeight);
                } catch (error) {
                    alert("Error procesando la imagen.");
                    hideLoadingOverlay();
                    return;
                }

                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                }

                window.currentImageData = imageData;
                displayImageOnCanvas(originalCanvas, imageData);

                const imageMatrixSize = parseInt(numImageMatrixSizeInput && numImageMatrixSizeInput.value, 10) || 10;
                displayMatrixValues("imageMatrixInitialPre", "imageMatrixInitialHeader", imageData.data, newWidth, newHeight, "Valores de la Matriz", imageMatrixSize);
                if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = String(imageMatrixSize);

                try {
                    const spectrum = await calculate2DDFT(imageData);
                    window.currentSpectrum = spectrum;
                    displaySpectrum(originalSpectrumCanvas, spectrum);
                    const dftSize = parseInt(numDftMatrixSizeInput && numDftMatrixSizeInput.value, 10) || 10;
                    displayMagnitudeMatrixValues(
                        "fourierMatrixPre",
                        "fourierMatrixHeader",
                        flattenSpectrumMagnitude(spectrum, newWidth, newHeight),
                        newWidth,
                        newHeight,
                        "Coeficientes DFT (Magnitud)",
                        dftSize
                    );
                    logProgress("DFT calculada. Puedes aplicar filtros.");
                } catch (error) {
                    console.error(error);
                    alert("Ocurrió un error calculando la DFT.");
                } finally {
                    hideLoadingOverlay();
                    updateApplyButtonState();
                }
            };
            img.onerror = function () {
                alert("No se pudo cargar la imagen.");
                hideLoadingOverlay();
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            alert("No se pudo leer el archivo.");
            hideLoadingOverlay();
        };
        reader.readAsDataURL(file);
    }

    function flattenSpectrumMagnitude(spectrum, width, height) {
        const flattened = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                flattened[y * width + x] = spectrum[y][x] instanceof Complex ? spectrum[y][x].magnitude() : 0;
            }
        }
        return flattened;
    }

    async function handleFilter() {
        const method = getSelectedInputMethod();
        if (method === "library") {
            if (!currentLibraryImageMetadata || !libraryCutoffSelect || !libraryCutoffSelect.value) {
                alert("Selecciona primero una imagen y un corte precalculado.");
                return;
            }
            try {
                await loadLibraryFilteredResult(filterTypeSelect ? filterTypeSelect.value : "lowpass", libraryCutoffSelect.value);
            } catch (error) {
                console.error(error);
                alert("No se pudo cargar el filtro precalculado.");
                hideLoadingOverlay();
            }
            return;
        }

        if (!window.currentSpectrum || !window.currentImageData) {
            alert("Carga una imagen primero.");
            return;
        }

        logProgress("--- Iniciando filtrado manual ---");
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
            window.currentFilteredPixelData = filteredPixelData;

            displayImageOnCanvas(resultOriginalCanvas, originalImageData);
            const imageMatrixSize = parseInt(numImageMatrixSizeInput && numImageMatrixSizeInput.value, 10) || 10;
            displayMatrixValues("resultOriginalMatrixPre", "resultOriginalMatrixHeader", originalImageData.data, width, height, "Valores de la Matriz", imageMatrixSize);
            if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = String(imageMatrixSize);

            displayImageOnCanvas(filteredCanvas, new ImageData(filteredPixelData, width, height));
            const filteredSize = parseInt(numFilteredMatrixSizeInput && numFilteredMatrixSizeInput.value, 10) || 10;
            displayMatrixValues("filteredMatrixPre", "filteredMatrixHeader", filteredPixelData, width, height, "Valores de la Matriz Filtrada", filteredSize);
            logProgress("Filtro aplicado con éxito.");
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error durante el filtrado.");
        } finally {
            hideLoadingOverlay();
            updateApplyButtonState();
            logProgress("--- Filtrado manual finalizado ---");
        }
    }

    function refreshImageMatrices() {
        if (!window.currentImageData) return;
        const size = parseInt(numImageMatrixSizeInput && numImageMatrixSizeInput.value, 10) || 10;
        displayMatrixValues("imageMatrixInitialPre", "imageMatrixInitialHeader", window.currentImageData.data, window.currentImageData.width, window.currentImageData.height, "Valores de la Matriz", size);
        displayMatrixValues("resultOriginalMatrixPre", "resultOriginalMatrixHeader", window.currentImageData.data, window.currentImageData.width, window.currentImageData.height, "Valores de la Matriz", size);
        if (resultImageMatrixSizeDisplay) resultImageMatrixSizeDisplay.textContent = String(size);
    }

    function refreshDftMatrix() {
        const size = parseInt(numDftMatrixSizeInput && numDftMatrixSizeInput.value, 10) || 10;
        if (currentLibraryMagnitudeData && currentLibraryImageMetadata) {
            displayMagnitudeMatrixValues("fourierMatrixPre", "fourierMatrixHeader", currentLibraryMagnitudeData, currentLibraryImageMetadata.processedWidth, currentLibraryImageMetadata.processedHeight, "Coeficientes DFT (Magnitud)", size);
        } else if (window.currentSpectrum && window.currentImageData) {
            displayMagnitudeMatrixValues("fourierMatrixPre", "fourierMatrixHeader", flattenSpectrumMagnitude(window.currentSpectrum, window.currentImageData.width, window.currentImageData.height), window.currentImageData.width, window.currentImageData.height, "Coeficientes DFT (Magnitud)", size);
        }
    }

    function refreshFilteredMatrix() {
        if (!window.currentFilteredPixelData || !window.currentImageData) return;
        const size = parseInt(numFilteredMatrixSizeInput && numFilteredMatrixSizeInput.value, 10) || 10;
        displayMatrixValues("filteredMatrixPre", "filteredMatrixHeader", window.currentFilteredPixelData, window.currentImageData.width, window.currentImageData.height, "Valores de la Matriz Filtrada", size);
    }

    function setupEventListeners() {
        document.querySelectorAll('.container input[name="inputMethod"]').forEach(function (radio) {
            radio.addEventListener("change", async function () {
                resetAppState({ preserveLibrarySelection: true, suppressLog: true });
                if (this.value === "library" && libraryImageSelect && libraryImageSelect.value) {
                    try {
                        await loadLibraryImage(libraryImageSelect.value);
                    } catch (error) {
                        console.error(error);
                        hideLoadingOverlay();
                    }
                }
            });
        });

        if (imageFileInput) {
            imageFileInput.addEventListener("change", handleImageUpload);
        }
        if (libraryImageSelect) {
            libraryImageSelect.addEventListener("change", async function () {
                if (!this.value) {
                    resetAppState({ preserveLibrarySelection: true, suppressLog: true });
                    return;
                }
                try {
                    await loadLibraryImage(this.value);
                } catch (error) {
                    console.error(error);
                    alert("No se pudo cargar la imagen precalculada.");
                    hideLoadingOverlay();
                }
            });
        }
        if (filterTypeSelect) {
            filterTypeSelect.addEventListener("change", async function () {
                if (getSelectedInputMethod() === "library" && currentLibraryImageMetadata && libraryCutoffSelect && libraryCutoffSelect.value) {
                    try {
                        await loadLibraryFilteredResult(this.value, libraryCutoffSelect.value, { showOverlay: false });
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        }
        if (libraryCutoffSelect) {
            libraryCutoffSelect.addEventListener("change", async function () {
                updateApplyButtonState();
                if (getSelectedInputMethod() === "library" && currentLibraryImageMetadata && this.value) {
                    try {
                        await loadLibraryFilteredResult(filterTypeSelect ? filterTypeSelect.value : "lowpass", this.value, { showOverlay: false });
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        }
        if (applyFilterButton) {
            applyFilterButton.addEventListener("click", handleFilter);
        }
        if (cutoffFreqSlider && cutoffValueSpan) {
            cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`;
            cutoffFreqSlider.addEventListener("input", function () {
                cutoffValueSpan.textContent = `${cutoffFreqSlider.value}%`;
            });
        }
        if (numImageMatrixSizeInput) {
            numImageMatrixSizeInput.addEventListener("input", refreshImageMatrices);
        }
        if (numDftMatrixSizeInput) {
            numDftMatrixSizeInput.addEventListener("input", refreshDftMatrix);
        }
        if (numFilteredMatrixSizeInput) {
            numFilteredMatrixSizeInput.addEventListener("input", refreshFilteredMatrix);
        }
    }

    function initializeApp() {
        logProgress("Aplicación inicializada. Puedes subir una imagen o usar la biblioteca precalculada.");
        clearOutputAreas({ suppressLog: true });
        updateModeVisibility();
        updateApplyButtonState();
        setupEventListeners();
        loadPrecomputedManifest();
    }

    document.addEventListener("DOMContentLoaded", initializeApp);
})();
