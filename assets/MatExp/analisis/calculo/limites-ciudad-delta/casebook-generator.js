(function () {
  "use strict";

  const root = document.querySelector(".casebook-generator");
  if (!root) return;

  const IS_ENGLISH = (root.dataset.lang || document.documentElement.lang || "es")
    .toLowerCase().startsWith("en");
  const T = (es, en) => IS_ENGLISH ? en : es;
  const TARGET_PLATE = "2718 LMT";
  const WRONG_PLATE = "9042 KVR";
  const COMMON_COUNT = 22;
  const SCRIPT_URL = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : window.location.href;
  const ASSET_BASE = SCRIPT_URL.slice(0, SCRIPT_URL.lastIndexOf("/") + 1);

  const ROADS = {
    river: ["Avenida del Río", "River Avenue"],
    tunnel: ["Túnel de la Recta (Avenida del Río)", "Straight-Line Tunnel (River Avenue)"],
    south: ["Acceso Sur al Mirador", "South Approach to the Overlook"],
    junction: ["Enlace del Mirador", "Overlook Junction"],
    viaduct: ["Viaducto del Mirador", "Overlook Viaduct"],
    north: ["Ronda Norte", "North Ring Road"],
    labyrinth: ["Rotonda del Laberinto", "Labyrinth Roundabout"],
    motorway: ["Autovía de la Sierra", "Sierra Motorway"]
  };

  const road = (key) => T(ROADS[key][0], ROADS[key][1]);
  const timeTag = (value) => String(value).replace(/\./g, "p");
  const common = (slot, time, position, roadKey, descriptionEs, descriptionEn) => ({
    slot,
    id: `common-t${timeTag(time)}`,
    time: String(time),
    position: String(position),
    roadKey,
    plate: TARGET_PLATE,
    path: `photos/common/t${timeTag(time)}.jpg`,
    descriptionEs,
    descriptionEn,
    common: true
  });
  const variant = (slot, id, time, position, roadKey, plate, file, descriptionEs, descriptionEn, teams) => ({
    slot, id, time: String(time), position: String(position), roadKey, plate,
    path: `photos/variants/${file}.jpg`, descriptionEs, descriptionEn, teams,
    common: false
  });

  const COMMON_PHOTOS = [
    common(1, 1, 3, "river", "Pasa bajo la cámara del mercado.", "It passes beneath the market camera."),
    common(2, 1.8, 3.8, "river", "Se aproxima a la cámara crítica de t=2.", "It approaches the critical camera at t=2."),
    common(3, 1.99, 3.99, "river", "Última imagen antes de t=2.", "Last image before t=2."),
    common(5, 2.01, 4.01, "river", "Primera imagen después de t=2.", "First image after t=2."),
    common(6, 2.2, 4.2, "river", "La trayectoria continúa tras la cámara.", "The route continues beyond the camera."),
    common(7, 4, 6, "tunnel", "Última cámara antes de entrar en el túnel.", "Last camera before entering the tunnel."),
    common(8, 7, 9, "tunnel", "Primera cámara después de salir del túnel.", "First camera after leaving the tunnel."),
    common(9, 7.8, 9.8, "south", "La carretera inferior se acerca a la cota 10.", "The lower road approaches level 10."),
    common(10, 7.99, 9.99, "south", "Última cámara antes del enlace.", "Last camera before the junction."),
    common(14, 8.5, 10.5, "viaduct", "Los recorridos vuelven a reunirse tras una zona sin cámaras.", "The routes meet again after an area without cameras."),
    common(15, 9, 11, "north", "El vehículo toma la Ronda Norte.", "The vehicle takes the North Ring Road."),
    common(16, 9.8, 10, "labyrinth", "La cámara localiza el coche en la salida baja.", "The camera locates the car at the lower exit."),
    common(17, 9.9, 12, "labyrinth", "La siguiente cámara lo sitúa en la salida alta.", "The next camera places it at the upper exit."),
    common(18, 9.98, 12, "labyrinth", "Nuevo fotograma en la salida alta.", "Another frame at the upper exit."),
    common(19, 9.99, 10, "labyrinth", "Fotograma inmediatamente anterior a t=10.", "Frame immediately before t=10."),
    common(20, 10.01, 12, "labyrinth", "Fotograma inmediatamente posterior a t=10.", "Frame immediately after t=10."),
    common(21, 10.02, 10, "labyrinth", "La posición vuelve a alternar.", "The position alternates again."),
    common(22, 10.1, 10, "labyrinth", "Otra imagen en la salida baja.", "Another image at the lower exit."),
    common(23, 10.2, 12, "labyrinth", "Otra imagen en la salida alta.", "Another image at the upper exit."),
    common(24, 11, 14, "motorway", "El coche toma la autovía de salida.", "The car takes the outbound motorway."),
    common(25, 11.5, 18, "motorway", "La posición crece al acercarse a t=12.", "The position grows as t=12 approaches."),
    common(26, 11.9, 50, "motorway", "Última cámara urbana; el vehículo se aleja sin cota visible.", "Last urban camera; the vehicle recedes with no visible bound.")
  ];

  const VARIANTS = {
    t2Correct: variant(4, "t2-correct", 2, 4, "river", TARGET_PLATE, "t2-correct",
      "La cámara identifica el vehículo investigado en la posición 4.",
      "The camera identifies the target vehicle at position 4.", ["A"]),
    t2Wrong: variant(4, "t2-wrong", 2, 7, "river", WRONG_PLATE, "t2-wrong",
      "El lector selecciona otro vehículo situado en la posición 7.",
      "The reader selects a different vehicle at position 7.", ["B"]),
    t8Correct: variant(11, "t8-correct", 8, 10, "junction", TARGET_PLATE, "t8-correct",
      "El vehículo alcanza el punto donde termina el tramo inferior.",
      "The vehicle reaches the point where the lower section ends.", ["A", "B"]),
    t8Wrong: variant(11, "t8-wrong", 8, 14, "junction", WRONG_PLATE, "t8-wrong",
      "La cámara exacta identifica otro vehículo en la cota 14.",
      "The exact camera identifies another vehicle at level 14.", ["C"]),
    t801Standard: variant(12, "t8p01-standard", 8.01, 10.01, "viaduct", TARGET_PLATE, "t8p01-standard",
      "El tablero superior comienza junto al final del tramo inferior.",
      "The upper deck begins beside the end of the lower section.", ["A", "C"]),
    t801Shifted: variant(12, "t8p01-shifted", 8.01, 13.01, "viaduct", TARGET_PLATE, "t8p01-shifted",
      "El tablero superior aparece desplazado tres unidades.",
      "The upper deck appears displaced by three units.", ["B"]),
    t81Standard: variant(13, "t8p1-standard", 8.1, 10.1, "viaduct", TARGET_PLATE, "t8p1-standard",
      "Segunda imagen del tablero alineado.",
      "Second image of the aligned upper deck.", ["A", "C"]),
    t81Shifted: variant(13, "t8p1-shifted", 8.1, 13.1, "viaduct", TARGET_PLATE, "t8p1-shifted",
      "Segunda imagen que confirma el desplazamiento.",
      "Second image confirming the displacement.", ["B"])
  };

  const SLOT_ORDER = Array.from({ length: 26 }, (_, index) => index + 1);
  const COMMON_BY_SLOT = Object.fromEntries(COMMON_PHOTOS.map((photo) => [photo.slot, photo]));
  const CRITICAL_BY_TEAM = {
    A: { 4: VARIANTS.t2Correct, 11: VARIANTS.t8Correct, 12: VARIANTS.t801Standard, 13: VARIANTS.t81Standard },
    B: { 4: VARIANTS.t2Wrong, 11: VARIANTS.t8Correct, 12: VARIANTS.t801Shifted, 13: VARIANTS.t81Shifted },
    C: { 11: VARIANTS.t8Wrong, 12: VARIANTS.t801Standard, 13: VARIANTS.t81Standard }
  };

  function photosForTeam(team) {
    return SLOT_ORDER.map((slot) => COMMON_BY_SLOT[slot] || CRITICAL_BY_TEAM[team][slot]).filter(Boolean);
  }

  function description(photo) {
    return IS_ENGLISH ? photo.descriptionEn : photo.descriptionEs;
  }

  const els = {
    form: document.getElementById("casebook-form"),
    city: document.getElementById("casebook-city"),
    format: document.getElementById("casebook-format"),
    date: document.getElementById("casebook-date"),
    generate: document.getElementById("casebook-generate"),
    clear: document.getElementById("casebook-clear"),
    status: document.getElementById("casebook-status"),
    panel: document.getElementById("casebook-download-panel"),
    bundles: document.getElementById("casebook-bundle-downloads"),
    separate: document.getElementById("casebook-separate-downloads"),
    complete: document.getElementById("casebook-complete-pdf")
  };
  const objectUrls = [];

  els.form.addEventListener("submit", generateDocuments);
  els.clear.addEventListener("click", clearDownloads);
  root.querySelectorAll("[data-case-tab]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.caseTab));
  });

  function activateTab(id) {
    root.querySelectorAll("[data-case-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.caseTab === id));
    });
    ["casebook-bundles", "casebook-separate"].forEach((panelId) => {
      document.getElementById(panelId).hidden = panelId !== id;
    });
  }

  function setStatus(message) { els.status.textContent = message; }
  function setBusy(busy) { els.generate.disabled = busy; els.clear.disabled = busy; }

  function clearDownloads() {
    objectUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    els.bundles.innerHTML = "";
    els.separate.innerHTML = "";
    if (els.complete) {
      els.complete.href = "#";
      els.complete.removeAttribute("download");
      els.complete.classList.add("case-hidden");
    }
    els.panel.classList.add("case-hidden");
    setStatus("");
  }

  function assertLibraries() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error(T("No se ha cargado jsPDF.", "jsPDF has not loaded."));
    }
    if (!window.JSZip) {
      throw new Error(T("No se ha cargado JSZip.", "JSZip has not loaded."));
    }
  }

  async function generateDocuments(event) {
    event.preventDefault();
    clearDownloads();
    setBusy(true);
    try {
      assertLibraries();
      const city = els.city.value.trim();
      if (!city) throw new Error(T("Escribe el nombre de la ciudad.", "Enter the city name."));
      const data = {
        city,
        format: els.format.value === "letter" ? "letter" : "a4",
        date: els.date.value,
        dateLabel: formatDate(els.date.value)
      };

      setStatus(T("Cargando el mapa y 30 placeholders...", "Loading the map and 30 placeholders..."));
      const images = await loadAllImages();
      setStatus(T("Generando documentos separados...", "Generating separate documents..."));
      const separate = buildSeparateFiles(data, images);
      setStatus(T("Generando paquetes por equipo...", "Generating team packets..."));
      const bundles = buildBundleFiles(data, images);
      const complete = buildCompleteFile(data, images);
      setStatus(T("Preparando archivos ZIP...", "Preparing ZIP archives..."));
      const separateZip = await zipFiles(separate, T("documentos_separados.zip", "separate_documents.zip"), T("ZIP de documentos separados", "ZIP of separate documents"));
      const bundleZip = await zipFiles(bundles, T("paquetes_por_equipo.zip", "team_packets.zip"), T("ZIP de paquetes completos", "ZIP of complete packets"));

      showDownloadGroup(els.separate, separateZip, separate);
      showDownloadGroup(els.bundles, bundleZip, bundles);
      updateCompletePdfLink(complete);
      els.panel.classList.remove("case-hidden");
      activateTab("casebook-bundles");
      setStatus(T(
        `Listo: ${separate.length} documentos separados y ${bundles.length} paquetes completos.`,
        `Done: ${separate.length} separate documents and ${bundles.length} complete packets.`
      ));
    } catch (error) {
      console.error(error);
      setStatus(error.message || T("No se han podido generar los documentos.", "The documents could not be generated."));
    } finally {
      setBusy(false);
    }
  }

  function formatDate(value) {
    if (!value) return T("sin fecha", "undated");
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat(IS_ENGLISH ? "en-GB" : "es-ES", {
      day: "numeric", month: "long", year: "numeric"
    }).format(date);
  }

  async function loadAllImages() {
    const allPhotos = [...COMMON_PHOTOS, ...Object.values(VARIANTS)];
    const entries = await Promise.all(allPhotos.map(async (photo) => [photo.id, await loadImage(photo)]));
    const mapImage = await loadImage({ id: "city-map", path: "assets/city-map.svg", time: "", position: "", roadKey: "junction", plate: "" });
    return { photos: Object.fromEntries(entries), map: mapImage };
  }

  function loadImage(photo) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(imageToDataUrl(image));
      image.onerror = () => resolve(fallbackImage(photo));
      image.src = new URL(photo.path, ASSET_BASE).href;
    });
  }

  function imageToDataUrl(image) {
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  }

  function fallbackImage(photo) {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e8e1d3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#285b73";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.fillStyle = "#1f2933";
    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(T("PLACEHOLDER", "PLACEHOLDER"), 240, 80);
    ctx.font = "22px sans-serif";
    if (photo.time) ctx.fillText(`t = ${photo.time}   f(t) = ${photo.position}`, 240, 135);
    if (photo.plate) ctx.fillText(photo.plate, 240, 180);
    ctx.font = "17px sans-serif";
    ctx.fillText(T("Sustituir por fotografía real", "Replace with final photograph"), 240, 225);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  class PdfWriter {
    constructor(format) {
      const { jsPDF } = window.jspdf;
      this.doc = new jsPDF({ unit: "pt", format: format === "letter" ? "letter" : "a4" });
      this.width = this.doc.internal.pageSize.getWidth();
      this.height = this.doc.internal.pageSize.getHeight();
      this.margin = 42;
      this.first = true;
      this.y = this.margin;
    }

    newPage(label) {
      if (this.first) this.first = false;
      else this.doc.addPage();
      this.y = this.margin;
      if (label) {
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(9);
        this.doc.setTextColor(40, 91, 115);
        this.doc.text(label.toUpperCase(), this.margin, 24);
        this.doc.setDrawColor(210, 218, 224);
        this.doc.line(this.margin, 31, this.width - this.margin, 31);
      }
      this.doc.setTextColor(31, 41, 51);
    }

    chapter(title, subtitle, confidential) {
      this.newPage("Calculus Casebook");
      this.doc.setFillColor(22, 36, 45);
      this.doc.rect(0, 0, this.width, 188, "F");
      this.doc.setTextColor(244, 241, 233);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(27);
      const lines = this.doc.splitTextToSize(title, this.width - 2 * this.margin);
      this.doc.text(lines, this.margin, 76);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(12);
      this.doc.setTextColor(158, 211, 223);
      this.doc.text(this.doc.splitTextToSize(subtitle || "", this.width - 2 * this.margin), this.margin, 145);
      if (confidential) {
        this.doc.setFillColor(183, 72, 63);
        this.doc.roundedRect(this.width - 165, 25, 123, 25, 4, 4, "F");
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(9);
        this.doc.text(T("CONFIDENCIAL", "CONFIDENTIAL"), this.width - 103.5, 42, { align: "center" });
      }
      this.doc.setTextColor(31, 41, 51);
      this.y = 220;
    }

    ensure(height) {
      if (this.y + height > this.height - 55) this.newPage("Calculus Casebook");
    }

    heading(text) {
      this.ensure(42);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(15);
      this.doc.setTextColor(40, 91, 115);
      this.doc.text(text, this.margin, this.y);
      this.y += 24;
      this.doc.setTextColor(31, 41, 51);
    }

    paragraph(text, options = {}) {
      this.doc.setFont("helvetica", options.bold ? "bold" : "normal");
      this.doc.setFontSize(options.size || 10.5);
      const lines = this.doc.splitTextToSize(text, this.width - 2 * this.margin);
      const height = lines.length * 14 + 9;
      this.ensure(height);
      this.doc.text(lines, this.margin, this.y);
      this.y += height;
    }

    bullets(items) {
      items.forEach((item) => {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(10.5);
        const lines = this.doc.splitTextToSize(item, this.width - 2 * this.margin - 18);
        const height = lines.length * 14 + 7;
        this.ensure(height);
        this.doc.setFillColor(183, 72, 63);
        this.doc.circle(this.margin + 3, this.y - 3, 2.5, "F");
        this.doc.text(lines, this.margin + 15, this.y);
        this.y += height;
      });
    }

    table(headers, rows, widths) {
      const total = this.width - 2 * this.margin;
      const cols = widths || headers.map(() => total / headers.length);
      const drawRow = (cells, header) => {
        const lineSets = cells.map((cell, index) => this.doc.splitTextToSize(String(cell), cols[index] - 10));
        const rowHeight = Math.max(...lineSets.map((lines) => lines.length * 12 + 10), 24);
        this.ensure(rowHeight + (header ? 0 : 2));
        let x = this.margin;
        cells.forEach((cell, index) => {
          this.doc.setFillColor(header ? 40 : 250, header ? 91 : 249, header ? 115 : 246);
          this.doc.setDrawColor(210, 218, 224);
          this.doc.rect(x, this.y, cols[index], rowHeight, "FD");
          this.doc.setTextColor(header ? 255 : 31, header ? 255 : 41, header ? 255 : 51);
          this.doc.setFont("helvetica", header ? "bold" : "normal");
          this.doc.setFontSize(header ? 9.5 : 9);
          this.doc.text(lineSets[index], x + 5, this.y + 15);
          x += cols[index];
        });
        this.y += rowHeight;
      };
      drawRow(headers, true);
      rows.forEach((rowData) => drawRow(rowData, false));
      this.y += 12;
    }

    addPageNumbers() {
      const pages = this.doc.getNumberOfPages();
      for (let page = 1; page <= pages; page += 1) {
        this.doc.setPage(page);
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8);
        this.doc.setTextColor(100, 110, 118);
        this.doc.text(`${page} / ${pages}`, this.width - this.margin, this.height - 20, { align: "right" });
        this.doc.text(T("Material procedente de franjfal.github.io", "Material from franjfal.github.io"), this.margin, this.height - 20);
      }
    }
  }

  function renderBriefing(writer, data) {
    writer.chapter(T("OPERACIÓN: TRAYECTORIA DELTA", "OPERATION: DELTA TRAJECTORY"),
      T(`Expediente común · ${data.city} · ${data.dateLabel}`, `Shared case file · ${data.city} · ${data.dateLabel}`), false);
    writer.heading(T("Situación", "Situation"));
    writer.paragraph(T(
      `Un vehículo con matrícula ${TARGET_PLATE} ha atravesado ${data.city} durante una persecución. La central ha reunido fotografías de cámaras de tráfico. Cada instante t indica los minutos transcurridos desde el inicio del seguimiento y f(t) representa la posición del vehículo en el sistema de coordenadas del mapa.`,
      `A vehicle with registration ${TARGET_PLATE} crossed ${data.city} during a pursuit. Control has collected traffic-camera photographs. Each time t is the number of minutes since tracking began, and f(t) is the vehicle's position in the map coordinate system.`
    ));
    writer.heading(T("Misión del equipo", "Team mission"));
    writer.bullets(T([
      "Ordena las fotografías por tiempo y contrástalas con el mapa.",
      "En t=2 y t=8 distingue el comportamiento cercano de la imagen exacta.",
      "Entre t=4 y t=7 el coche atraviesa un túnel sin cámaras: identifica qué conclusiones no pueden justificarse.",
      "Estudia por separado lo que ocurre al aproximarte desde tiempos menores y mayores.",
      "Decide si los datos permiten afirmar continuidad; si no, explica qué información falta.",
      "Analiza también la rotonda del Laberinto y la salida de la ciudad.",
      "No compartas fotografías con otros equipos hasta la reunión de coordinación."
    ], [
      "Order the photographs by time and compare them with the map.",
      "At t=2 and t=8, distinguish nearby behaviour from the exact image.",
      "Between t=4 and t=7 the car crosses a tunnel with no cameras: identify which conclusions cannot be justified.",
      "Study separately what happens when approaching from earlier and later times.",
      "Decide whether the evidence establishes continuity; if not, explain what is missing.",
      "Also analyse Labyrinth Roundabout and the exit from the city.",
      "Do not share photographs with other teams before the coordination meeting."
    ]));
    writer.heading(T("Advertencia sobre matrículas", "Registration warning"));
    writer.paragraph(T(
      `La matrícula investigada es ${TARGET_PLATE}. Una fotografía con otra matrícula puede ser un error de identificación y no debe atribuirse automáticamente a la trayectoria perseguida.`,
      `The target registration is ${TARGET_PLATE}. A photograph showing another registration may be an identification error and must not automatically be assigned to the pursued route.`
    ), { bold: true });
  }

  function renderMap(writer, data, images) {
    writer.chapter(T("MAPA DE LA CIUDAD", "CITY MAP"),
      T(`${data.city} · sistema de coordenadas de la investigación`, `${data.city} · investigation coordinate system`), false);
    writer.paragraph(T(
      "Este mapa es provisional. Usa las carreteras, los nombres de cámara y la escala vertical para interpretar la posición indicada por cada fotografía.",
      "This map is provisional. Use the roads, camera names, and vertical scale to interpret the position indicated by each photograph."
    ));
    const maxWidth = writer.width - 2 * writer.margin;
    const maxHeight = writer.height - writer.y - 80;
    const ratio = 640 / 420;
    const imageWidth = Math.min(maxWidth, maxHeight * ratio);
    const imageHeight = imageWidth / ratio;
    writer.doc.addImage(images.map, "JPEG", (writer.width - imageWidth) / 2, writer.y + 10, imageWidth, imageHeight);
    writer.y += imageHeight + 28;
    writer.paragraph(T(
      "Carreteras principales: Avenida del Río, Túnel de la Recta, Acceso Sur al Mirador, Enlace y Viaducto del Mirador, Ronda Norte, Rotonda del Laberinto y Autovía de la Sierra.",
      "Main roads: River Avenue, Straight-Line Tunnel, South Approach to the Overlook, Overlook Junction and Viaduct, North Ring Road, Labyrinth Roundabout, and Sierra Motorway."
    ));
  }

  function renderPhotoDossier(writer, team, images) {
    const photos = photosForTeam(team);
    writer.chapter(T(`DOSSIER FOTOGRÁFICO · EQUIPO ${team}`, `PHOTOGRAPHIC DOSSIER · TEAM ${team}`),
      T(`${photos.length} fotografías · ${COMMON_COUNT} compartidas con todos los equipos`, `${photos.length} photographs · ${COMMON_COUNT} shared by every team`), true);
    writer.paragraph(T(
      "Los números E-01 a E-26 identifican huecos de cámara, no una numeración consecutiva del material recibido. Si falta un número, la ausencia forma parte de la prueba.",
      "Numbers E-01 to E-26 identify camera slots, not a consecutive numbering of the material received. If a number is missing, that absence is evidence."
    ));
    if (team === "C") {
      writer.paragraph(T(
        "INCIDENCIA: la cámara E-04 (t=2) consta como averiada y no produjo fotografía.",
        "INCIDENT: camera E-04 (t=2) is recorded as faulty and produced no photograph."
      ), { bold: true });
    }

    const perPage = 15;
    for (let offset = 0; offset < photos.length; offset += perPage) {
      writer.newPage(T(`Equipo ${team} · pruebas fotográficas`, `Team ${team} · photographic evidence`));
      const batch = photos.slice(offset, offset + perPage);
      const gap = 8;
      const cardWidth = (writer.width - 2 * writer.margin - 2 * gap) / 3;
      const imageHeight = cardWidth * 9 / 16;
      const rowHeight = imageHeight + 39;
      batch.forEach((photo, index) => {
        const col = index % 3;
        const rowIndex = Math.floor(index / 3);
        const x = writer.margin + col * (cardWidth + gap);
        const y = 48 + rowIndex * rowHeight;
        writer.doc.setDrawColor(195, 205, 212);
        writer.doc.rect(x, y, cardWidth, rowHeight - 6);
        writer.doc.addImage(images.photos[photo.id], "JPEG", x + 2, y + 2, cardWidth - 4, imageHeight - 2);
        writer.doc.setFont("helvetica", "bold");
        writer.doc.setFontSize(8.5);
        writer.doc.setTextColor(31, 41, 51);
        writer.doc.text(`E-${String(photo.slot).padStart(2, "0")}  ·  t=${photo.time}`, x + 5, y + imageHeight + 11);
        writer.doc.setFont("helvetica", "normal");
        writer.doc.setFontSize(7.3);
        const roadLines = writer.doc.splitTextToSize(road(photo.roadKey), cardWidth - 10).slice(0, 2);
        writer.doc.text(roadLines, x + 5, y + imageHeight + 22);
      });
    }
  }

  function renderWorksheet(writer, team) {
    writer.chapter(T(`HOJA DE INVESTIGACIÓN · EQUIPO ${team}`, `INVESTIGATION WORKSHEET · TEAM ${team}`),
      T("Completa antes de la reunión de coordinación", "Complete before the coordination meeting"), true);
    writer.heading(T("Puntos t=2 y t=8", "Checkpoints t=2 and t=8"));
    writer.table(
      T(["Punto", "Límite izq.", "Límite der.", "f(t)", "¿Continua? / tipo", "Pruebas"], ["Point", "Left limit", "Right limit", "f(t)", "Continuous? / type", "Evidence"]),
      [["t=2", "", "", "", "", ""], ["t=8", "", "", "", "", ""]],
      [45, 67, 67, 52, 105, writer.width - 2 * writer.margin - 336]
    );
    writer.heading(T("Túnel de la Recta: intervalo 4<t<7", "Straight-Line Tunnel: interval 4<t<7"));
    writer.paragraph(T(
      "Solo hay una fotografía en la entrada, t=4, y otra en la salida, t=7. No existen cámaras dentro del túnel. Explica qué puedes afirmar sobre el recorrido y qué no puedes decidir sobre f(6), el límite en t=6 o la continuidad en puntos interiores.",
      "There is one photograph at the entrance, t=4, and one at the exit, t=7. There are no cameras inside the tunnel. Explain what can be claimed about the route and what cannot be decided about f(6), the limit at t=6, or continuity at interior points."
    ));
    writer.table(T(["Datos disponibles", "Conclusiones justificadas", "Información que falta"], ["Available evidence", "Justified conclusions", "Missing information"]), [["", "", ""]]);
    writer.heading(T("Rotonda del Laberinto", "Labyrinth Roundabout"));
    writer.paragraph(T(
      "Elige dos sucesiones de fotografías cuyos tiempos se acerquen a t=10. ¿A qué posiciones se aproximan? ¿Puede existir un único límite?",
      "Choose two sequences of photographs whose times approach t=10. Which positions do they approach? Can there be a single limit?"
    ));
    writer.table(T(["Sucesión", "Tiempos elegidos", "Posiciones observadas", "Conclusión"], ["Sequence", "Chosen times", "Observed positions", "Conclusion"]),
      [["1", "", "", ""], ["2", "", "", ""]]);
    writer.heading(T("Salida de la ciudad", "Leaving the city"));
    writer.paragraph(T(
      "Describe qué ocurre con f(t) cuando t se aproxima a 12 por la izquierda. Escribe una afirmación verbal y otra con notación de límite.",
      "Describe what happens to f(t) as t approaches 12 from the left. Write one verbal statement and one statement in limit notation."
    ));
    writer.table(T(["Descripción verbal", "Notación matemática"], ["Verbal description", "Mathematical notation"]), [["", ""]]);
    writer.heading(T("Conclusión policial", "Police conclusion"));
    writer.bullets(T([
      "¿En qué puntos puedes afirmar continuidad?",
      "¿En qué puntos puedes afirmar discontinuidad y de qué tipo?",
      "¿En qué puntos los datos son insuficientes? ¿Qué fotografía necesitarías?",
      "Prepara dos argumentos para defender tu reconstrucción ante los otros equipos."
    ], [
      "At which points can you establish continuity?",
      "At which points can you establish discontinuity, and of what type?",
      "At which points is the evidence insufficient? Which photograph would you need?",
      "Prepare two arguments to defend your reconstruction before the other teams."
    ]));
  }

  function renderTeacherGuide(writer, data) {
    writer.chapter(T("GUÍA DOCENTE", "TEACHER GUIDE"),
      T(`${data.city} · límites y continuidad`, `${data.city} · limits and continuity`), true);
    writer.heading(T("Objetivos", "Objectives"));
    writer.bullets(T([
      "Distinguir límite, valor de la función e información disponible.",
      "Calcular e interpretar límites laterales a partir de datos discretos.",
      "Reconocer continuidad, discontinuidad evitable, salto y oscilación.",
      "Interpretar un límite infinito en contexto.",
      "Argumentar cuándo los datos son insuficientes para concluir."
    ], [
      "Distinguish the limit, the function value, and the information available.",
      "Calculate and interpret one-sided limits from discrete evidence.",
      "Recognise continuity, removable discontinuity, jump, and oscillation.",
      "Interpret an infinite limit in context.",
      "Argue when the evidence is insufficient for a conclusion."
    ]));
    writer.heading(T("Estructura del caso", "Case structure"));
    writer.paragraph(T(
      "El caso utiliza 30 archivos fotográficos únicos. Los equipos A y B reciben 26 fotografías y el C recibe 25 porque la cámara exacta de t=2 no registró imagen. Veintidós fotografías son comunes a todos; las ocho restantes son variantes de cuatro huecos estratégicos.",
      "The case uses 30 unique photographic files. Teams A and B receive 26 photographs, while Team C receives 25 because the exact camera at t=2 recorded no image. Twenty-two photographs are shared by all teams; the other eight are variants for four strategic slots."
    ));
    writer.table(
      T(["Punto", "Equipo A", "Equipo B", "Equipo C"], ["Checkpoint", "Team A", "Team B", "Team C"]),
      T([
        ["t=2", "Imagen correcta: f(2)=4", "Otro vehículo: f(2)=7", "No hay imagen"],
        ["Túnel 4<t<7", "Sin cámaras", "Sin cámaras", "Sin cámaras"],
        ["t=8", "Unión en 10", "Límites 10 y 13", "Límite 10; f(8)=14"],
        ["t=10 y t=12", "Oscilación e infinito", "Oscilación e infinito", "Oscilación e infinito"]
      ], [
        ["t=2", "Correct image: f(2)=4", "Other vehicle: f(2)=7", "No image"],
        ["Tunnel 4<t<7", "No cameras", "No cameras", "No cameras"],
        ["t=8", "Connection at 10", "Limits 10 and 13", "Limit 10; f(8)=14"],
        ["t=10 and t=12", "Oscillation and infinity", "Oscillation and infinity", "Oscillation and infinity"]
      ]),
      [65, (writer.width - 2 * writer.margin - 65) / 3, (writer.width - 2 * writer.margin - 65) / 3, (writer.width - 2 * writer.margin - 65) / 3]
    );
    writer.heading(T("Cinco puntos de investigación", "Five investigation checkpoints"));
    writer.bullets(T([
      "t=2: separar el comportamiento de las fotografías cercanas del valor mostrado por la imagen exacta o de su ausencia.",
      "Túnel 4<t<7: reconocer que la entrada y la salida no determinan f(6), su límite ni la continuidad interior.",
      "t=8: comparar una unión continua, un salto y un valor exacto que no coincide con el límite.",
      "t=10: usar dos sucesiones de posiciones alternantes para justificar que el límite no existe por oscilación.",
      "t=12 por la izquierda: interpretar el crecimiento sin cota como un límite infinito en el contexto de la salida de la ciudad."
    ], [
      "t=2: separate the behaviour of nearby photographs from the value in the exact image or from its absence.",
      "Tunnel 4<t<7: recognise that entry and exit do not determine f(6), its limit, or continuity inside the tunnel.",
      "t=8: compare a continuous connection, a jump, and an exact value that differs from the limit.",
      "t=10: use two alternating position sequences to justify that the limit does not exist because of oscillation.",
      "t=12 from the left: interpret unbounded growth as an infinite limit in the context of leaving the city."
    ]));
    writer.heading(T("Preparación", "Preparation"));
    writer.bullets(T([
      "Imprime un paquete distinto para los equipos A, B y C. Si hay más de tres equipos, repite el ciclo sin revelar las letras equivalentes.",
      "Recorta las tarjetas solo si quieres que el alumnado ordene físicamente la secuencia; también pueden trabajar sobre las hojas completas.",
      "No entregues la solución docente ni el inventario de variantes.",
      "Aclara que t mide minutos y f(t) es la posición vertical leída sobre el mapa."
    ], [
      "Print a different packet for teams A, B, and C. With more than three teams, repeat the cycle without revealing equivalent letters.",
      "Cut out the cards only if students will physically order the sequence; they may also work from complete sheets.",
      "Do not distribute the teacher solution or variant inventory.",
      "Clarify that t is measured in minutes and f(t) is the vertical position read from the map."
    ]));
    writer.heading(T("Secuencia sugerida (55-70 min)", "Suggested sequence (55-70 min)"));
    writer.table(T(["Fase", "Tiempo", "Acción"], ["Phase", "Time", "Action"]), T([
      ["Apertura", "5 min", "Presentar la persecución y la matrícula objetivo."],
      ["Reconstrucción", "20-25 min", "Ordenar pruebas y completar límites laterales."],
      ["Informe", "10 min", "Preparar argumentos y reconocer incertidumbres."],
      ["Coordinación", "15-20 min", "Comparar conclusiones sin intercambiar aún los dossiers."],
      ["Formalización", "10 min", "Introducir definiciones y clasificar los cinco puntos."]
    ], [
      ["Opening", "5 min", "Introduce the pursuit and target registration."],
      ["Reconstruction", "20-25 min", "Order evidence and complete one-sided limits."],
      ["Report", "10 min", "Prepare arguments and identify uncertainty."],
      ["Coordination", "15-20 min", "Compare conclusions before exchanging dossiers."],
      ["Formalisation", "10 min", "Introduce definitions and classify the five checkpoints."]
    ]));
    writer.heading(T("Preguntas para la reunión", "Questions for the meeting"));
    writer.bullets(T([
      "¿Qué matrícula muestra vuestra imagen exacta?",
      "¿Por qué una fotografía aislada no cambia el comportamiento de las cámaras cercanas?",
      "¿Podéis afirmar continuidad si no existe fotografía en el instante exacto?",
      "¿Qué recorridos distintos podrían ser compatibles con la entrada y la salida del túnel?",
      "¿Qué dos sucesiones de imágenes prueban la oscilación?",
      "¿Qué significa que la posición tienda a infinito en una ciudad finita?"
    ], [
      "Which registration appears in your exact image?",
      "Why does one isolated photograph not change the nearby-camera behaviour?",
      "Can continuity be established without a photograph at the exact instant?",
      "Which different routes could be compatible with the tunnel entrance and exit?",
      "Which two image sequences demonstrate oscillation?",
      "What does position tending to infinity mean in a finite city?"
    ]));
  }

  function renderTeacherSolution(writer) {
    writer.chapter(T("SOLUCIÓN Y COMPARACIÓN", "SOLUTION AND COMPARISON"),
      T("Documento reservado para el profesorado", "Teacher-only document"), true);
    writer.heading(T("Resultados por equipo", "Results by team"));
    writer.table(
      T(["Punto", "Equipo A", "Equipo B", "Equipo C"], ["Point", "Team A", "Team B", "Team C"]),
      T([
        ["t=2", "lim=4 y f(2)=4. Continua.", "lim=4 y f(2)=7. Evitable.", "lim=4; f(2) desconocido. No se puede decidir."],
        ["t=8", "Límites laterales=10 y f(8)=10. Continua.", "Límite izq.=10, der.=13. Salto.", "Límites=10 y f(8)=14. Evitable."]
      ], [
        ["t=2", "lim=4 and f(2)=4. Continuous.", "lim=4 and f(2)=7. Removable.", "lim=4; f(2) unknown. Cannot decide."],
        ["t=8", "One-sided limits=10 and f(8)=10. Continuous.", "Left limit=10, right limit=13. Jump.", "Limits=10 and f(8)=14. Removable."]
      ]),
      [45, (writer.width - 2 * writer.margin - 45) / 3, (writer.width - 2 * writer.margin - 45) / 3, (writer.width - 2 * writer.margin - 45) / 3]
    );
    writer.heading(T("Túnel entre t=4 y t=7", "Tunnel between t=4 and t=7"));
    writer.paragraph(T(
      "Todos los grupos conocen f(4)=6 y f(7)=9, pero no reciben datos para 4<t<7. Esos dos valores no determinan el movimiento interior: no se puede conocer f(6), calcular su límite ni decidir continuidad en t=6 usando solo las cámaras. Un avance uniforme, una parada o un retroceso parcial dentro del túnel son compatibles con las pruebas.",
      "Every team knows f(4)=6 and f(7)=9, but receives no evidence for 4<t<7. Those two values do not determine the motion inside: f(6), its limit, and continuity at t=6 cannot be established from the cameras alone. Uniform motion, a stop, or a partial reversal inside the tunnel are all compatible with the evidence."
    ));
    writer.heading(T("Oscilación en t=10", "Oscillation at t=10"));
    writer.paragraph(T(
      "Todos los equipos observan tiempos que se acercan a 10 con posiciones alternantes 10 y 12. Existen sucesiones de imágenes que se aproximan al mismo instante y producen valores límite distintos. Por tanto, el límite en t=10 no existe por oscilación.",
      "Every team sees times approaching 10 with positions alternating between 10 and 12. There are image sequences approaching the same instant with different limiting values. Therefore, the limit at t=10 does not exist because of oscillation."
    ));
    writer.heading(T("Límite infinito en t=12", "Infinite limit at t=12"));
    writer.paragraph(T(
      "Las posiciones 14, 18 y 50 crecen al acercarse a 12 por la izquierda. La lectura pretendida es lim(t->12-) f(t)=+infinito: el vehículo abandona la escala urbana y cualquier cota fija termina siendo superada.",
      "Positions 14, 18, and 50 grow as 12 is approached from the left. The intended reading is lim(t->12-) f(t)=+infinity: the vehicle leaves the urban scale and eventually exceeds every fixed bound."
    ));
    writer.heading(T("Idea formal de cierre", "Formal closing idea"));
    writer.paragraph(T(
      "Para afirmar continuidad en a hacen falta tres piezas: que exista f(a), que exista lim(t->a)f(t) y que ambos coincidan. Los grupos C muestran que conocer el límite sin conocer el valor exacto no permite completar esta comprobación.",
      "To establish continuity at a, three pieces are needed: f(a) must exist, lim(t->a)f(t) must exist, and the two must agree. Team C shows that knowing the limit without knowing the exact value is not enough to complete this check."
    ), { bold: true });
  }

  function renderInventory(writer) {
    writer.chapter(T("INVENTARIO DE FOTOGRAFÍAS", "PHOTOGRAPH INVENTORY"),
      T("30 archivos únicos · guía para sustituir los placeholders", "30 unique files · placeholder replacement guide"), true);
    writer.paragraph(T(
      "Las 22 fotografías comunes se entregan a A, B y C. Ocho variantes ocupan cuatro huecos estratégicos. El hueco E-04 no tiene fotografía en el dossier C. Entre E-07 y E-08 se encuentra el túnel sin cámaras.",
      "The 22 shared photographs go to A, B, and C. Eight variants occupy four strategic slots. Slot E-04 has no photograph in dossier C. The camera-free tunnel lies between E-07 and E-08."
    ));
    const all = [...COMMON_PHOTOS, ...Object.values(VARIANTS)];
    const rows = all.map((photo) => [
      `E-${String(photo.slot).padStart(2, "0")}`,
      `t=${photo.time}`,
      road(photo.roadKey),
      `f=${photo.position}`,
      photo.plate,
      photo.common ? "A/B/C" : photo.teams.join("/"),
      photo.path
    ]);
    writer.table(T(
      ["Hueco", "Tiempo", "Carretera", "Pos.", "Matrícula", "Equipos", "Archivo"],
      ["Slot", "Time", "Road", "Pos.", "Plate", "Teams", "File"]
    ), rows, [38, 38, 96, 34, 55, 43, writer.width - 2 * writer.margin - 304]);
  }

  function createFile(data, label, fileName, renderers) {
    const writer = new PdfWriter(data.format);
    renderers.forEach((render) => render(writer));
    writer.addPageNumbers();
    return { label, fileName, blob: writer.doc.output("blob") };
  }

  function buildSeparateFiles(data, images) {
    return [
      createFile(data, T("Contexto común", "Shared briefing"), T("00_Contexto_comun.pdf", "00_Shared_briefing.pdf"), [(w) => renderBriefing(w, data)]),
      createFile(data, T("Mapa de la ciudad", "City map"), T("01_Mapa_ciudad.pdf", "01_City_map.pdf"), [(w) => renderMap(w, data, images)]),
      createFile(data, T("Dossier fotográfico A", "Team A photo dossier"), T("10_Fotografias_Equipo_A.pdf", "10_Team_A_photos.pdf"), [(w) => renderPhotoDossier(w, "A", images)]),
      createFile(data, T("Dossier fotográfico B", "Team B photo dossier"), T("11_Fotografias_Equipo_B.pdf", "11_Team_B_photos.pdf"), [(w) => renderPhotoDossier(w, "B", images)]),
      createFile(data, T("Dossier fotográfico C", "Team C photo dossier"), T("12_Fotografias_Equipo_C.pdf", "12_Team_C_photos.pdf"), [(w) => renderPhotoDossier(w, "C", images)]),
      createFile(data, T("Hoja de investigación A", "Team A worksheet"), T("20_Hoja_Equipo_A.pdf", "20_Team_A_worksheet.pdf"), [(w) => renderWorksheet(w, "A")]),
      createFile(data, T("Hoja de investigación B", "Team B worksheet"), T("21_Hoja_Equipo_B.pdf", "21_Team_B_worksheet.pdf"), [(w) => renderWorksheet(w, "B")]),
      createFile(data, T("Hoja de investigación C", "Team C worksheet"), T("22_Hoja_Equipo_C.pdf", "22_Team_C_worksheet.pdf"), [(w) => renderWorksheet(w, "C")]),
      createFile(data, T("Guía docente", "Teacher guide"), T("90_Guia_docente.pdf", "90_Teacher_guide.pdf"), [(w) => renderTeacherGuide(w, data)]),
      createFile(data, T("Solución docente", "Teacher solution"), T("91_Solucion_docente.pdf", "91_Teacher_solution.pdf"), [(w) => renderTeacherSolution(w)]),
      createFile(data, T("Inventario de fotografías", "Photograph inventory"), T("92_Inventario_fotografias.pdf", "92_Photograph_inventory.pdf"), [(w) => renderInventory(w)])
    ];
  }

  function teamPacket(data, images, team) {
    return createFile(data,
      T(`Paquete completo · Equipo ${team}`, `Complete packet · Team ${team}`),
      T(`EQUIPO_${team}_paquete_completo.pdf`, `TEAM_${team}_complete_packet.pdf`),
      [(w) => renderBriefing(w, data), (w) => renderMap(w, data, images), (w) => renderPhotoDossier(w, team, images), (w) => renderWorksheet(w, team)]
    );
  }

  function buildBundleFiles(data, images) {
    const a = teamPacket(data, images, "A");
    const b = teamPacket(data, images, "B");
    const c = teamPacket(data, images, "C");
    const teacher = createFile(data, T("Paquete docente", "Teacher packet"), T("DOCENTE_paquete_completo.pdf", "TEACHER_complete_packet.pdf"), [
      (w) => renderTeacherGuide(w, data), (w) => renderTeacherSolution(w), (w) => renderInventory(w)
    ]);
    return [a, b, c, teacher];
  }

  function buildCompleteFile(data, images) {
    return createFile(data, T("PDF completo", "Complete PDF"), T("Expediente_completo.pdf", "Complete_case_file.pdf"), [
      (w) => renderBriefing(w, data), (w) => renderMap(w, data, images),
      (w) => renderPhotoDossier(w, "A", images), (w) => renderWorksheet(w, "A"),
      (w) => renderPhotoDossier(w, "B", images), (w) => renderWorksheet(w, "B"),
      (w) => renderPhotoDossier(w, "C", images), (w) => renderWorksheet(w, "C"),
      (w) => renderTeacherGuide(w, data), (w) => renderTeacherSolution(w), (w) => renderInventory(w)
    ]);
  }

  async function zipFiles(files, fileName, label) {
    const zip = new window.JSZip();
    files.forEach((file) => zip.file(file.fileName, file.blob));
    return { fileName, label, blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }) };
  }

  function showDownloadGroup(container, zipFile, files) {
    showFile(container, zipFile, true);
    files.forEach((file) => showFile(container, file, false));
  }

  function showFile(container, file, primary) {
    const url = URL.createObjectURL(file.blob);
    objectUrls.push(url);
    const row = document.createElement("div");
    row.className = primary ? "case-download case-download-primary" : "case-download";
    const title = document.createElement("span");
    title.className = "case-download-title";
    title.textContent = file.label;
    const actions = document.createElement("span");
    actions.className = "case-download-actions";

    const view = document.createElement("a");
    view.className = "case-download-icon";
    view.href = url;
    view.target = "_blank";
    view.rel = "noopener";
    view.title = T(`Ver ${file.label} en el navegador`, `View ${file.label} in the browser`);
    view.setAttribute("aria-label", view.title);
    view.innerHTML = eyeIcon();

    const download = document.createElement("a");
    download.className = "case-download-icon";
    download.href = url;
    download.download = file.fileName;
    download.title = T(`Descargar ${file.label}`, `Download ${file.label}`);
    download.setAttribute("aria-label", download.title);
    download.innerHTML = downloadIcon();

    actions.append(view, download);
    row.append(title, actions);
    container.appendChild(row);
  }

  function updateCompletePdfLink(file) {
    if (!els.complete) return;
    const url = URL.createObjectURL(file.blob);
    objectUrls.push(url);
    els.complete.href = url;
    els.complete.download = file.fileName;
    els.complete.classList.remove("case-hidden");
    els.complete.setAttribute("aria-label", T("Descargar PDF completo", "Download complete PDF"));
  }

  function eyeIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
  }

  function downloadIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke-width="2" stroke-linecap="round"/><path d="m7 10 5 5 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke-width="2" stroke-linecap="round"/></svg>';
  }

})();
