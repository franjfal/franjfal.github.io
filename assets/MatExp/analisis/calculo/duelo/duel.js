(function () {
  "use strict";

  const duelScriptUrl = document.currentScript && document.currentScript.src;
  const questionBankUrl = duelScriptUrl
    ? new URL("questions.json", duelScriptUrl).href
    : "questions.json";

  const app = {
    questionBank: null,
    questionIndex: new Map(),
    familyIndex: new Map(),
    role: null,
    playerId: null,
    roomId: null,
    config: null,
    engine: null,
    connections: new Map(),
    pendingInvites: new Map(),
    currentPendingId: null,
    guestConnection: null,
    latestSnapshot: null,
    snapshotReceivedAt: 0,
    renderedQuestionInstance: null,
    answerLocked: false,
    hostLoop: null,
    scanner: null,
    scannerProcessing: false,
    toastTimer: null,
    lobbyState: null
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    buildSetupEnhancements();
    cacheElements();
    bindEvents();
    handleJoinHash();
    loadQuestionBank();
    requestAnimationFrame(updateLiveClock);
  }

  function cacheElements() {
    [
      "setup-screen",
      "lobby-screen",
      "game-screen",
      "end-screen",
      "create-tab",
      "join-tab",
      "create-panel",
      "join-panel",
      "create-form",
      "join-form",
      "host-name",
      "initial-minutes",
      "player-count",
      "bonus-seconds",
      "penalty-epsilon",
      "penalty-cap",
      "advanced-options-button",
      "advanced-options-dialog",
      "close-advanced-options",
      "print-cards-button",
      "print-cards-dialog",
      "close-print-cards",
      "paper-size",
      "generate-print-cards",
      "fullscreen-exit-button",
      "family-groups",
      "toggle-families",
      "create-room-button",
      "setup-message",
      "join-name",
      "offer-code",
      "scan-offer-button",
      "prepare-answer-button",
      "lobby-role",
      "lobby-title",
      "room-code",
      "players-progress",
      "lobby-status-chip",
      "lobby-players",
      "lobby-config-summary",
      "host-lobby-panel",
      "guest-lobby-panel",
      "host-connection-steps",
      "invite-empty",
      "invite-content",
      "generate-invite-button",
      "offer-qr",
      "host-offer-code",
      "copy-offer-button",
      "cancel-invite-button",
      "answer-code",
      "scan-answer-button",
      "accept-answer-button",
      "start-game-button",
      "guest-connection-steps",
      "answer-qr",
      "guest-answer-code",
      "copy-answer-button",
      "guest-waiting-title",
      "guest-waiting-text",
      "game-avatar",
      "game-player-name",
      "game-room-label",
      "game-level",
      "game-queue",
      "game-correct",
      "timer-card",
      "timer-value",
      "timer-rate",
      "countdown-cover",
      "countdown-value",
      "eliminated-cover",
      "question-tags",
      "question-counter",
      "question-prompt",
      "game-question-title",
      "answers-grid",
      "alive-count",
      "opponents-list",
      "penalty-total",
      "penalties-list",
      "winner-title",
      "winner-subtitle",
      "results-list",
      "new-game-button",
      "scan-dialog",
      "close-scanner-button",
      "qr-reader",
      "toast"
    ].forEach((id) => {
      elements[toCamelCase(id)] = document.getElementById(id);
    });
  }

  function bindEvents() {
    elements.createTab.addEventListener("click", () => selectSetupTab("create"));
    elements.joinTab.addEventListener("click", () => selectSetupTab("join"));
    elements.createForm.addEventListener("submit", handleCreateRoom);
    elements.joinForm.addEventListener("submit", handleJoinRoom);
    elements.toggleFamilies.addEventListener("click", toggleAllFamilies);
    elements.familyGroups.addEventListener("change", updateFamilySelectionState);
    elements.generateInviteButton.addEventListener("click", generateInvite);
    elements.copyOfferButton.addEventListener("click", () => copyText(elements.hostOfferCode.value, "Invitación copiada."));
    elements.cancelInviteButton.addEventListener("click", () => {
      resetPendingInvite();
      showToast("Invitación descartada. Ya puedes generar otra.");
    });
    elements.copyAnswerButton.addEventListener("click", () => copyText(elements.guestAnswerCode.value, "Respuesta copiada."));
    elements.acceptAnswerButton.addEventListener("click", acceptAnswer);
    elements.startGameButton.addEventListener("click", startGame);
    elements.scanOfferButton.addEventListener("click", () => openScanner(
      elements.offerCode,
      () => elements.joinForm.requestSubmit()
    ));
    elements.scanAnswerButton.addEventListener("click", () => openScanner(
      elements.answerCode,
      acceptAnswer
    ));
    elements.closeScannerButton.addEventListener("click", closeScanner);
    elements.scanDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeScanner();
    });
    elements.newGameButton.addEventListener("click", () => window.location.assign(window.location.href.split("#")[0]));
    elements.advancedOptionsButton.addEventListener("click", () => elements.advancedOptionsDialog.showModal());
    elements.closeAdvancedOptions.addEventListener("click", () => elements.advancedOptionsDialog.close());
    elements.printCardsButton.addEventListener("click", openPrintDialog);
    elements.closePrintCards.addEventListener("click", () => elements.printCardsDialog.close());
    elements.generatePrintCards.addEventListener("click", printCards);
    elements.fullscreenExitButton.addEventListener("click", () => document.exitFullscreen && document.exitFullscreen());
    document.addEventListener("fullscreenchange", updateFullscreenExitButton);
  }

  function buildSetupEnhancements() {
    const createForm = elements.createForm;
    const familyFieldset = elements.familyGroups.closest("fieldset");
    const epsilonField = elements.penaltyEpsilon.closest("label");
    const capField = elements.penaltyCap.closest("label");
    const actions = createForm.querySelector(".actions");

    const advancedButton = document.createElement("button");
    advancedButton.id = "advanced-options-button";
    advancedButton.className = "button button-ghost button-block";
    advancedButton.type = "button";
    advancedButton.textContent = "Opciones avanzadas";

    const advancedDialog = document.createElement("dialog");
    advancedDialog.id = "advanced-options-dialog";
    advancedDialog.className = "settings-dialog";
    advancedDialog.innerHTML = '<div class="dialog-header"><div><span class="eyebrow">Configuración</span><h2>Opciones avanzadas</h2></div><button id="close-advanced-options" class="icon-button" type="button" aria-label="Cerrar opciones avanzadas">×</button></div><div class="dialog-body"><p class="section-intro">Ajusta las penalizaciones y limita las familias que aparecerán tanto en el duelo como en las tarjetas imprimibles.</p><div class="form-grid advanced-fields"></div><div class="advanced-families"></div></div>';
    advancedDialog.querySelector(".advanced-fields").append(epsilonField, capField);
    advancedDialog.querySelector(".advanced-families").append(familyFieldset);

    const printButton = document.createElement("button");
    printButton.id = "print-cards-button";
    printButton.className = "button button-secondary setup-action";
    printButton.type = "button";
    printButton.textContent = "Crear tarjetas imprimibles";

    const printDialog = document.createElement("dialog");
    printDialog.id = "print-cards-dialog";
    printDialog.className = "settings-dialog print-dialog";
    printDialog.innerHTML = '<div class="dialog-header"><div><span class="eyebrow">Versión de mesa</span><h2>Tarjetas imprimibles</h2></div><button id="close-print-cards" class="icon-button" type="button" aria-label="Cerrar tarjetas imprimibles">×</button></div><div class="dialog-body"><p>Se crearán 8 tarjetas por hoja con las familias elegidas en Opciones avanzadas. Cada anverso propone una derivada y cada reverso su integración inversa.</p><label class="field"><span>Formato del papel</span><select id="paper-size"><option value="a4">A4 (Europa)</option><option value="letter">Letter (EE. UU.)</option></select></label><div class="print-instructions"><strong>Al imprimir o guardar como PDF</strong><ol><li>Elige orientación <b>horizontal</b>.</li><li>Activa <b>doble cara</b> y <b>voltear por el borde corto</b>.</li><li>Usa escala 100 % o “tamaño real”; desactiva encabezados y pies.</li></ol><p>Las páginas impares son anversos y las pares, sus reversos ya espejados. No reordenes las páginas.</p></div><button id="generate-print-cards" class="button button-primary button-block" type="button">Abrir PDF para imprimir</button></div>';

    createForm.insertBefore(advancedButton, actions);
    elements.createRoomButton.classList.remove("button-block");
    elements.createRoomButton.classList.add("setup-action");
    actions.insertBefore(printButton, actions.firstChild);
    document.body.append(advancedDialog, printDialog);

    const exitButton = document.createElement("button");
    exitButton.id = "fullscreen-exit-button";
    exitButton.className = "fullscreen-exit-button";
    exitButton.type = "button";
    exitButton.setAttribute("aria-label", "Salir de pantalla completa");
    exitButton.title = "Salir de pantalla completa";
    exitButton.textContent = "×";
    exitButton.hidden = true;
    const duelApp = document.getElementById("calculusDuelApp");
    (duelApp || document.body).appendChild(exitButton);
  }

  function updateFullscreenExitButton() {
    const duelApp = document.getElementById("calculusDuelApp");
    elements.fullscreenExitButton.hidden = !duelApp || document.fullscreenElement !== duelApp;
  }

  function openPrintDialog() {
    if (!app.questionBank) {
      showToast("Espera a que termine de cargar el banco de preguntas.", "error");
      return;
    }
    elements.printCardsDialog.showModal();
  }

  function printCards() {
    const selectedFamilies = new Set(Array.from(elements.familyGroups.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value));
    if (!selectedFamilies.size) {
      showToast("Selecciona al menos una familia en Opciones avanzadas.", "error");
      return;
    }
    const pairs = [];
    app.questionBank.levels.forEach((level) => level.questions.forEach((question) => {
      if (question.operation === "derive" && selectedFamilies.has(question.family)) {
        const inverse = app.questionIndex.get(question.inverseQuestionId);
        if (inverse) pairs.push([question, inverse]);
      }
    }));
    if (!pairs.length) return;

    const printRoot = document.createElement("div");
    printRoot.id = "duel-print-root";
    for (let offset = 0; offset < pairs.length; offset += 8) {
      const batch = pairs.slice(offset, offset + 8);
      printRoot.append(createPrintPage(batch, offset, false), createPrintPage(batch, offset, true));
    }
    document.getElementById("duel-print-root")?.remove();
    document.body.appendChild(printRoot);
    if (window.CalculusDuelI18n) window.CalculusDuelI18n.translateElement(printRoot);
    document.documentElement.dataset.duelPaper = elements.paperSize.value;
    elements.printCardsDialog.close();
    requestAnimationFrame(() => {
      window.print();
      setTimeout(() => printRoot.remove(), 1000);
    });
  }

  function createPrintPage(batch, offset, reverse) {
    const page = document.createElement("section");
    page.className = `duel-print-page ${reverse ? "is-back" : "is-front"}`;
    const slots = Array.from({ length: 8 }, (_, index) => batch[index] ? { pair: batch[index], number: offset + index + 1 } : null);
    const ordered = reverse ? mirrorColumns(slots) : slots;
    ordered.forEach((entry) => {
      if (!entry) {
        const blank = document.createElement("article");
        blank.className = "duel-print-card is-blank";
        page.appendChild(blank);
        return;
      }
      const { pair, number } = entry;
      const question = pair[reverse ? 1 : 0];
      const card = document.createElement("article");
      card.className = "duel-print-card";
      const family = app.familyIndex.get(question.family);
      const answers = shuffle([question.correctAnswer, ...question.incorrectAnswers.slice(0, 2)]);
      card.innerHTML = `<div class="print-card-meta"><span>${reverse ? "REVERSO · INTEGRA" : "ANVERSO · DERIVA"}</span><span class="print-family"></span></div><div class="print-card-number">${number}</div><div class="print-expression"></div><div class="print-answers"></div>`;
      card.querySelector(".print-family").textContent = family ? family.label : "Cálculo";
      renderMath(card.querySelector(".print-expression"), question.expression, true);
      answers.forEach((answer, answerIndex) => {
        const option = document.createElement("div");
        option.className = "print-answer";
        option.innerHTML = `<span>${String.fromCharCode(65 + answerIndex)}</span><div></div>`;
        renderMath(option.lastElementChild, answer, false);
        card.querySelector(".print-answers").appendChild(option);
      });
      page.appendChild(card);
    });
    return page;
  }

  function mirrorColumns(items) {
    const result = [];
    for (let row = 0; row < 2; row += 1) {
      const slice = items.slice(row * 4, row * 4 + 4);
      result.push(...slice.reverse());
    }
    return result;
  }

  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  async function loadQuestionBank() {
    setSetupMessage("Cargando el banco de preguntas…");
    try {
      const response = await fetch(questionBankUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`No se pudo abrir questions.json (${response.status}).`);
      }
      const questionBank = await response.json();
      expandGeneratedPairs(questionBank);
      validateQuestionBank(questionBank);
      app.questionBank = questionBank;
      app.familyIndex = new Map(questionBank.families.map((family) => [family.id, family]));
      app.questionIndex = new Map();
      questionBank.levels.forEach((level) => {
        level.questions.forEach((question) => app.questionIndex.set(question.id, question));
      });
      renderFamilyOptions();
      elements.createRoomButton.disabled = false;
      elements.prepareAnswerButton.disabled = false;
      setSetupMessage(`${app.questionIndex.size} preguntas listas en ${questionBank.levels.length} niveles.`);
    } catch (error) {
      console.error(error);
      elements.createRoomButton.disabled = true;
      elements.prepareAnswerButton.disabled = true;
      const localHint = window.location.protocol === "file:"
        ? " Abre la carpeta mediante un servidor web local para poder leer el JSON."
        : "";
      setSetupMessage(`${error.message}${localHint}`, true);
    }
  }

  function expandGeneratedPairs(questionBank) {
    if (!Array.isArray(questionBank.generatedPairs)) return;
    const levels = new Map(questionBank.levels.map((level) => [level.level, level]));
    questionBank.generatedPairs.forEach((pair) => {
      const level = levels.get(pair.level);
      const base = { level: pair.level, family: pair.family, baseFunction: pair.base, weight: pair.weight };
      level.questions.push(
        { ...base, id: `${pair.id}-d`, operation: "derive", prompt: pair.derivePrompt || "Deriva la función", expression: `\\frac{d}{dx}\\left(${pair.base}\\right)`, correctAnswer: pair.derivative, incorrectAnswers: pair.deriveWrong, inverseQuestionId: `${pair.id}-i` },
        { ...base, id: `${pair.id}-i`, operation: "integrate", prompt: "Calcula la familia de antiderivadas", expression: `\\int ${pair.derivative}\\,dx`, correctAnswer: `${pair.base}+C`, incorrectAnswers: pair.integrateWrong, inverseQuestionId: `${pair.id}-d` }
      );
    });
  }

  function validateQuestionBank(questionBank) {
    if (!questionBank || !Array.isArray(questionBank.families) || !Array.isArray(questionBank.levels)) {
      throw new Error("El banco de preguntas no tiene la estructura esperada.");
    }

    const familyIds = new Set(questionBank.families.map((family) => family.id));
    const questions = [];
    const questionIds = new Set();

    questionBank.levels.forEach((level) => {
      if (!Number.isInteger(level.level) || !Array.isArray(level.questions)) {
        throw new Error("Cada nivel debe incluir un número y una lista de preguntas.");
      }
      level.questions.forEach((question) => {
        const required = [
          "id",
          "level",
          "family",
          "baseFunction",
          "operation",
          "expression",
          "correctAnswer",
          "incorrectAnswers",
          "weight",
          "inverseQuestionId"
        ];
        if (required.some((key) => question[key] === undefined || question[key] === null)) {
          throw new Error(`La pregunta ${question.id || "sin identificador"} está incompleta.`);
        }
        if (questionIds.has(question.id)) {
          throw new Error(`El identificador ${question.id} está duplicado.`);
        }
        if (!familyIds.has(question.family)) {
          throw new Error(`La pregunta ${question.id} usa una familia inexistente.`);
        }
        if (question.level !== level.level) {
          throw new Error(`La pregunta ${question.id} no coincide con su nivel.`);
        }
        if (!["derive", "integrate"].includes(question.operation)) {
          throw new Error(`La operación de ${question.id} no es válida.`);
        }
        if (!Array.isArray(question.incorrectAnswers) || question.incorrectAnswers.length < 2) {
          throw new Error(`La pregunta ${question.id} necesita al menos dos distractores.`);
        }
        if (!Number.isFinite(question.weight) || question.weight <= 0) {
          throw new Error(`El peso de ${question.id} debe ser positivo.`);
        }
        questionIds.add(question.id);
        questions.push(question);
      });
    });

    const byId = new Map(questions.map((question) => [question.id, question]));
    questions.forEach((question) => {
      const inverse = byId.get(question.inverseQuestionId);
      if (!inverse) {
        throw new Error(`No existe la pregunta inversa de ${question.id}.`);
      }
      if (inverse.inverseQuestionId !== question.id) {
        throw new Error(`La pareja inversa de ${question.id} no es recíproca.`);
      }
      if (inverse.operation === question.operation) {
        throw new Error(`La pareja de ${question.id} debe usar la operación opuesta.`);
      }
      const options = [question.correctAnswer, ...question.incorrectAnswers];
      if (new Set(options).size !== options.length) {
        throw new Error(`La pregunta ${question.id} contiene respuestas repetidas.`);
      }
    });
  }

  function renderFamilyOptions() {
    elements.familyGroups.replaceChildren();
    const groups = new Map();
    app.questionBank.families.forEach((family) => {
      if (!groups.has(family.group)) groups.set(family.group, []);
      groups.get(family.group).push(family);
    });

    groups.forEach((families, groupName) => {
      const group = document.createElement("div");
      group.className = "family-group";
      const title = document.createElement("div");
      title.className = "family-group-title";
      title.textContent = groupName;
      const options = document.createElement("div");
      options.className = "family-options";

      families.forEach((family) => {
        const label = document.createElement("label");
        label.className = "family-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "families";
        checkbox.value = family.id;
        checkbox.checked = family.defaultEnabled !== false;
        const copy = document.createElement("span");
        const strong = document.createElement("strong");
        strong.textContent = family.label;
        const small = document.createElement("small");
        small.textContent = family.description;
        copy.append(strong, small);
        label.append(checkbox, copy);
        options.appendChild(label);
      });

      group.append(title, options);
      elements.familyGroups.appendChild(group);
    });
    updateFamilySelectionState();
  }

  function updateFamilySelectionState() {
    const checkboxes = Array.from(elements.familyGroups.querySelectorAll('input[type="checkbox"]'));
    const selected = checkboxes.filter((checkbox) => checkbox.checked).length;
    elements.toggleFamilies.textContent = selected === checkboxes.length ? "Quitar todas" : "Seleccionar todas";
  }

  function toggleAllFamilies() {
    const checkboxes = Array.from(elements.familyGroups.querySelectorAll('input[type="checkbox"]'));
    const shouldSelect = checkboxes.some((checkbox) => !checkbox.checked);
    checkboxes.forEach((checkbox) => {
      checkbox.checked = shouldSelect;
    });
    updateFamilySelectionState();
  }

  function handleCreateRoom(event) {
    event.preventDefault();
    if (!app.questionBank || !elements.createForm.reportValidity()) {
      return;
    }

    const families = Array.from(elements.familyGroups.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => checkbox.value);
    if (!families.length) {
      setSetupMessage("Selecciona al menos una familia de funciones.", true);
      return;
    }

    const config = {
      initialTimeSeconds: Math.round(readNumber(elements.initialMinutes, 0.5, 30) * 60),
      bonusSeconds: readNumber(elements.bonusSeconds, 0, 120),
      penaltyEpsilon: readNumber(elements.penaltyEpsilon, 0, 1),
      penaltyCap: readNumber(elements.penaltyCap, 0, 4),
      playerCount: Math.round(readNumber(elements.playerCount, 2, 8)),
      families,
      questionBankVersion: app.questionBank.version
    };

    const hostName = cleanName(elements.hostName.value, "Anfitrión");
    app.role = "host";
    app.playerId = DuelPeer.randomId("host");
    app.roomId = createRoomCode();
    app.config = config;
    app.engine = new DuelGameEngine({
      config,
      roomId: app.roomId,
      questionBank: app.questionBank
    });
    app.engine.addPlayer({ id: app.playerId, name: hostName, seat: 1, connected: true });
    app.lobbyState = app.engine.getLobbyState();
    showScreen("lobby");
    configureLobbyForRole();
    renderLobbyState(app.lobbyState);
  }

  async function handleJoinRoom(event) {
    event.preventDefault();
    if (!elements.joinForm.reportValidity()) {
      return;
    }

    const button = elements.prepareAnswerButton;
    setButtonBusy(button, true, "Preparando…");

    try {
      const offer = await DuelPeer.unpackSignal(elements.offerCode.value);
      validateOffer(offer);
      const playerName = cleanName(elements.joinName.value, "Jugador");
      const peerConnection = DuelPeer.createPeerConnection();
      const connection = {
        peerId: offer.peerId,
        playerId: offer.peerId,
        playerName,
        pc: peerConnection,
        channel: null,
        roomId: offer.roomId,
        closed: false
      };

      app.role = "guest";
      app.playerId = offer.peerId;
      app.roomId = offer.roomId;
      app.config = offer.config;
      app.guestConnection = connection;
      app.lobbyState = offer.lobby || {
        roomId: offer.roomId,
        config: offer.config,
        expectedPlayers: offer.config.playerCount,
        players: [{ id: offer.peerId, name: playerName, seat: 2, connected: false }]
      };

      peerConnection.addEventListener("datachannel", (dataEvent) => {
        connection.channel = dataEvent.channel;
        setupGuestChannel(connection);
      });

      await peerConnection.setRemoteDescription(offer.sdp);
      const answerDescription = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answerDescription);
      await DuelPeer.waitForIceGathering(peerConnection, 7000);

      const answer = {
        protocol: 1,
        type: "answer",
        roomId: offer.roomId,
        peerId: offer.peerId,
        playerName,
        sdp: serializeDescription(peerConnection.localDescription)
      };
      const answerCode = await DuelPeer.packSignal(answer);

      elements.guestAnswerCode.value = answerCode;
      DuelPeer.renderQr(elements.answerQr, answerCode);
      history.replaceState(null, "", window.location.href.split("#")[0]);
      showScreen("lobby");
      configureLobbyForRole();
      renderLobbyState(app.lobbyState);
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se ha podido preparar la conexión.", "error");
      if (app.guestConnection && app.guestConnection.pc) {
        app.guestConnection.pc.close();
      }
      app.guestConnection = null;
      app.role = null;
    } finally {
      setButtonBusy(button, false, "Preparar conexión");
    }
  }

  function validateOffer(offer) {
    if (!offer || offer.protocol !== 1 || offer.type !== "offer") {
      throw new Error("El código no contiene una invitación válida.");
    }
    if (!offer.roomId || !offer.peerId || !offer.sdp || !offer.config) {
      throw new Error("La invitación está incompleta.");
    }
    if (offer.config.questionBankVersion !== app.questionBank.version) {
      throw new Error("El anfitrión usa otra versión del banco de preguntas.");
    }
  }

  function configureLobbyForRole() {
    const isHost = app.role === "host";
    elements.hostLobbyPanel.hidden = !isHost;
    elements.guestLobbyPanel.hidden = isHost;
    elements.lobbyRole.textContent = isHost ? "Sala del anfitrión" : "Dispositivo del jugador";
    elements.lobbyTitle.textContent = isHost ? "Preparando el duelo" : "Conectando con la sala";
    elements.roomCode.textContent = app.roomId || "------";
  }

  async function generateInvite() {
    if (app.role !== "host" || !app.engine || app.engine.status !== "lobby") {
      return;
    }
    if (app.currentPendingId) {
      showToast("Termina primero la invitación que está abierta.", "error");
      return;
    }
    if (app.engine.players.size >= app.config.playerCount) {
      showToast("La sala ya tiene todas sus plazas.");
      return;
    }

    setButtonBusy(elements.generateInviteButton, true, "Generando…");
    try {
      const peerId = DuelPeer.randomId("player");
      const peerConnection = DuelPeer.createPeerConnection();
      const channel = peerConnection.createDataChannel("calculus-duel", { ordered: true });
      const pending = {
        peerId,
        playerId: peerId,
        playerName: null,
        pc: peerConnection,
        channel,
        accepted: false,
        opened: false,
        closed: false,
        connectionTimeout: null
      };
      app.pendingInvites.set(peerId, pending);
      app.currentPendingId = peerId;
      setupHostChannel(pending);

      const offerDescription = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerDescription);
      await DuelPeer.waitForIceGathering(peerConnection, 7000);

      const offer = {
        protocol: 1,
        type: "offer",
        roomId: app.roomId,
        peerId,
        config: app.config,
        lobby: app.engine.getLobbyState(),
        sdp: serializeDescription(peerConnection.localDescription)
      };
      const code = await DuelPeer.packSignal(offer);
      const shareValue = shouldUseInviteUrl() ? DuelPeer.createInviteUrl(code) : code;
      elements.hostOfferCode.value = shareValue;
      DuelPeer.renderQr(elements.offerQr, shareValue);
      elements.inviteEmpty.hidden = true;
      elements.inviteContent.hidden = false;
      setHostConnectionStep("answer");
    } catch (error) {
      console.error(error);
      resetPendingInvite();
      showToast(error.message || "No se ha podido generar la invitación.", "error");
    } finally {
      setButtonBusy(elements.generateInviteButton, false, "Generar invitación");
    }
  }

  async function acceptAnswer() {
    if (app.role !== "host" || !app.currentPendingId) {
      showToast("Genera primero una invitación.", "error");
      return;
    }

    const pending = app.pendingInvites.get(app.currentPendingId);
    if (!pending) {
      resetPendingInvite();
      return;
    }

    setButtonBusy(elements.acceptAnswerButton, true, "Conectando…");
    try {
      const answer = await DuelPeer.unpackSignal(elements.answerCode.value);
      if (!answer || answer.protocol !== 1 || answer.type !== "answer") {
        throw new Error("El código no contiene una respuesta válida.");
      }
      if (answer.roomId !== app.roomId || answer.peerId !== pending.peerId) {
        throw new Error("Esta respuesta pertenece a otra invitación.");
      }

      pending.playerName = cleanName(answer.playerName, `Jugador ${app.engine.players.size + 1}`);
      pending.accepted = true;
      app.engine.addPlayer({
        id: pending.playerId,
        name: pending.playerName,
        seat: app.engine.players.size + 1,
        connected: false
      });
      renderHostLobby();
      setHostConnectionStep("ready");
      await pending.pc.setRemoteDescription(answer.sdp);
      pending.connectionTimeout = window.setTimeout(() => {
        if (!pending.opened) {
          showToast("La conexión tarda demasiado. Comprueba que ambos dispositivos siguen en la misma red.", "error");
        }
      }, 12000);
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se ha podido completar la conexión.", "error");
    } finally {
      setButtonBusy(elements.acceptAnswerButton, false, "Completar conexión");
    }
  }

  function setupHostChannel(connection) {
    connection.channel.addEventListener("open", () => handleHostChannelOpen(connection));
    connection.channel.addEventListener("message", (event) => handleHostMessage(connection, event));
    connection.channel.addEventListener("close", () => handleHostChannelClose(connection));
    connection.channel.addEventListener("error", () => {
      showToast(`Se ha producido un error en el enlace con ${connection.playerName || "el jugador"}.`, "error");
    });
  }

  function handleHostChannelOpen(connection) {
    if (connection.opened) return;
    connection.opened = true;
    window.clearTimeout(connection.connectionTimeout);
    app.engine.addPlayer({
      id: connection.playerId,
      name: connection.playerName || `Jugador ${app.engine.players.size + 1}`,
      seat: app.engine.players.size + 1,
      connected: true
    });
    app.engine.setPlayerConnection(connection.playerId, true);
    app.connections.set(connection.playerId, connection);
    app.pendingInvites.delete(connection.peerId);
    if (app.currentPendingId === connection.peerId) {
      app.currentPendingId = null;
    }
    DuelPeer.sendJson(connection.channel, {
      type: "welcome",
      playerId: connection.playerId,
      roomId: app.roomId,
      config: app.config
    });
    elements.answerCode.value = "";
    elements.hostOfferCode.value = "";
    elements.inviteContent.hidden = true;
    elements.inviteEmpty.hidden = false;
    setHostConnectionStep("offer");
    showToast(`${connection.playerName} se ha conectado.`, "success");
    broadcastLobby();
  }

  function handleHostMessage(connection, event) {
    const message = DuelPeer.parseMessage(event);
    if (!message || !message.type) return;

    if (message.type === "hello") {
      const player = app.engine.players.get(connection.playerId);
      if (player) {
        player.name = cleanName(message.playerName, player.name);
      }
      broadcastLobby();
      return;
    }

    if (message.type === "answer") {
      processPlayerAnswer(connection.playerId, message);
    }
  }

  function handleHostChannelClose(connection) {
    if (connection.closed) return;
    connection.closed = true;
    window.clearTimeout(connection.connectionTimeout);
    app.connections.delete(connection.playerId);

    if (!app.engine) return;
    if (app.engine.status === "lobby") {
      app.engine.removePlayer(connection.playerId);
      showToast(`${connection.playerName || "Un jugador"} ha salido de la sala.`, "error");
      broadcastLobby();
    } else {
      app.engine.setPlayerConnection(connection.playerId, false);
      showToast(`${connection.playerName || "Un jugador"} ha perdido la conexión. Su reloj continúa.`, "error");
      broadcastGameState();
    }
  }

  function setupGuestChannel(connection) {
    connection.channel.addEventListener("open", () => {
      DuelPeer.sendJson(connection.channel, {
        type: "hello",
        playerId: app.playerId,
        playerName: connection.playerName
      });
      setGuestConnectedState();
      showToast("Canal directo conectado.", "success");
    });
    connection.channel.addEventListener("message", handleGuestMessage);
    connection.channel.addEventListener("close", () => {
      if (connection.closed) return;
      connection.closed = true;
      showToast("Se ha cerrado la conexión con el anfitrión.", "error");
      elements.guestWaitingTitle.textContent = "Conexión cerrada";
      elements.guestWaitingText.textContent = "Pide una nueva invitación al anfitrión para volver a entrar.";
    });
    connection.channel.addEventListener("error", () => {
      showToast("Error en el canal directo con el anfitrión.", "error");
    });
  }

  function handleGuestMessage(event) {
    const message = DuelPeer.parseMessage(event);
    if (!message || !message.type) return;

    if (message.type === "welcome") {
      app.playerId = message.playerId;
      app.roomId = message.roomId;
      app.config = message.config;
      return;
    }

    if (message.type === "lobby-state") {
      app.lobbyState = message.state;
      renderLobbyState(message.state);
      return;
    }

    if (message.type === "game-state") {
      applyGameSnapshot(message);
      return;
    }

    if (message.type === "question-result") {
      if (!message.accepted) {
        app.answerLocked = false;
        enableAnswerButtons();
        showToast(message.reason || "La respuesta no se ha podido registrar.", "error");
      } else if (message.correct) {
        const attackText = message.attack ? ` Contraataque enviado a ${message.attack.targetName}.` : "";
        showToast(`¡Correcto! +${message.bonusSeconds} s.${attackText}`, "success");
      } else {
        showToast("Respuesta incorrecta. La cola continúa.", "error");
      }
      return;
    }

    if (message.type === "penalty-added") {
      showToast(`${message.sourceName} te envía una inversa: velocidad +${formatDecimal(message.penaltyAmount)}.`, "error");
    }
  }

  function setGuestConnectedState() {
    const steps = Array.from(elements.guestConnectionSteps.querySelectorAll(".connection-step"));
    steps.forEach((step) => {
      step.classList.remove("active");
      step.classList.add("done");
    });
    elements.guestWaitingTitle.textContent = "Conexión directa lista";
    elements.guestWaitingText.textContent = "Espera a que entren los demás jugadores y el anfitrión inicie el duelo.";
  }

  function renderHostLobby() {
    if (!app.engine) return;
    app.lobbyState = app.engine.getLobbyState();
    renderLobbyState(app.lobbyState);
  }

  function broadcastLobby() {
    if (app.role !== "host" || !app.engine) return;
    const state = app.engine.getLobbyState();
    app.lobbyState = state;
    app.connections.forEach((connection) => {
      DuelPeer.sendJson(connection.channel, { type: "lobby-state", state });
    });
    renderLobbyState(state);
  }

  function renderLobbyState(state) {
    if (!state) return;
    elements.roomCode.textContent = state.roomId || app.roomId || "------";
    const connectedCount = state.players.filter((player) => player.connected).length;
    const expected = state.expectedPlayers || state.config.playerCount;
    const allConnected = state.players.length === expected && connectedCount === expected;
    elements.playersProgress.textContent = `${connectedCount} de ${expected} conectados`;
    elements.lobbyStatusChip.textContent = allConnected ? "Todos listos" : "Esperando";
    elements.lobbyStatusChip.classList.toggle("ready", allConnected);

    elements.lobbyPlayers.replaceChildren();
    state.players
      .slice()
      .sort((first, second) => first.seat - second.seat)
      .forEach((player) => elements.lobbyPlayers.appendChild(createLobbyPlayerRow(player)));
    for (let seat = state.players.length + 1; seat <= expected; seat += 1) {
      elements.lobbyPlayers.appendChild(createEmptyPlayerRow(seat));
    }

    renderConfigSummary(state.config);

    if (app.role === "host") {
      elements.startGameButton.disabled = !allConnected;
      elements.startGameButton.textContent = allConnected
        ? "Iniciar duelo en 3 segundos"
        : "Esperando a todos los jugadores";
      const roomFull = state.players.length >= expected;
      elements.generateInviteButton.disabled = roomFull;
      elements.generateInviteButton.textContent = roomFull ? "Sala completa" : "Generar invitación";
    }
  }

  function createLobbyPlayerRow(player) {
    const row = document.createElement("div");
    row.className = "player-row";
    const avatar = document.createElement("div");
    avatar.className = "player-avatar";
    avatar.textContent = initialFor(player.name);
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = player.name;
    const details = document.createElement("small");
    const own = player.id === app.playerId ? " · tú" : "";
    details.textContent = `Puesto ${player.seat}${own}`;
    copy.append(name, details);
    const dot = document.createElement("span");
    dot.className = `connection-dot${player.connected ? " connected" : ""}`;
    dot.setAttribute("aria-label", player.connected ? "Conectado" : "Conectando");
    row.append(avatar, copy, dot);
    return row;
  }

  function createEmptyPlayerRow(seat) {
    const row = document.createElement("div");
    row.className = "player-row empty-slot";
    const avatar = document.createElement("div");
    avatar.className = "player-avatar";
    avatar.textContent = "+";
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = "Plaza disponible";
    const details = document.createElement("small");
    details.textContent = `Puesto ${seat}`;
    copy.append(name, details);
    row.append(avatar, copy);
    return row;
  }

  function renderConfigSummary(config) {
    elements.lobbyConfigSummary.replaceChildren();
    const familyLabels = config.families
      .map((familyId) => app.familyIndex.get(familyId))
      .filter(Boolean)
      .map((family) => family.label);
    const summaries = [
      ["Tiempo", formatDuration(config.initialTimeSeconds)],
      ["Bonificación", `+${config.bonusSeconds} s`],
      ["Penalización", `ε = ${formatDecimal(config.penaltyEpsilon)}`],
      ["Velocidad máxima", `×${formatDecimal(1 + config.penaltyCap)}`],
      ["Familias", familyLabels.join(", ") || `${config.families.length} seleccionadas`]
    ];
    summaries.forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "config-item";
      const key = document.createElement("span");
      key.textContent = label;
      const content = document.createElement("strong");
      content.textContent = value;
      item.append(key, content);
      elements.lobbyConfigSummary.appendChild(item);
    });
  }

  function setHostConnectionStep(activeStep) {
    const order = ["offer", "answer", "ready"];
    const activeIndex = order.indexOf(activeStep);
    Array.from(elements.hostConnectionSteps.querySelectorAll(".connection-step")).forEach((step) => {
      const index = order.indexOf(step.dataset.step);
      step.classList.toggle("done", index < activeIndex);
      step.classList.toggle("active", index === activeIndex);
    });
  }

  function resetPendingInvite() {
    if (app.currentPendingId) {
      const pending = app.pendingInvites.get(app.currentPendingId);
      if (pending && pending.pc) {
        pending.closed = true;
        pending.pc.close();
      }
      if (pending && pending.accepted && app.engine && app.engine.status === "lobby") {
        app.engine.removePlayer(pending.playerId);
      }
      app.pendingInvites.delete(app.currentPendingId);
    }
    app.currentPendingId = null;
    elements.inviteContent.hidden = true;
    elements.inviteEmpty.hidden = false;
    elements.hostOfferCode.value = "";
    elements.answerCode.value = "";
    setHostConnectionStep("offer");
    renderHostLobby();
  }

  function startGame() {
    if (app.role !== "host" || !app.engine || !app.engine.canStart()) {
      showToast("Todos los jugadores deben estar conectados.", "error");
      return;
    }

    const startAt = Date.now() + 3500;
    if (!app.engine.start(startAt)) {
      showToast("No se ha podido iniciar la partida.", "error");
      return;
    }

    broadcastGameState();
    if (app.hostLoop) window.clearInterval(app.hostLoop);
    app.hostLoop = window.setInterval(hostGameStep, 200);
  }

  function hostGameStep() {
    if (!app.engine) return;
    app.engine.tick(Date.now());
    broadcastGameState();
    if (app.engine.status === "finished") {
      window.clearInterval(app.hostLoop);
      app.hostLoop = null;
    }
  }

  function broadcastGameState() {
    if (app.role !== "host" || !app.engine) return;
    const now = Date.now();
    app.connections.forEach((connection, playerId) => {
      const snapshot = app.engine.snapshotFor(playerId, now);
      DuelPeer.sendJson(connection.channel, snapshot);
    });
    applyGameSnapshot(app.engine.snapshotFor(app.playerId, now));
  }

  function processPlayerAnswer(playerId, message) {
    if (!app.engine) return;
    const result = app.engine.processAnswer(playerId, message.instanceId, message.optionId, Date.now());
    notifyPlayer(playerId, { type: "question-result", ...result });

    if (result.accepted && result.correct && result.attack) {
      notifyPlayer(result.attack.targetPlayerId, {
        type: "penalty-added",
        sourceName: result.attack.sourceName,
        penaltyAmount: result.attack.penaltyAmount
      });
    }
    broadcastGameState();
  }

  function notifyPlayer(playerId, payload) {
    if (playerId === app.playerId) {
      if (payload.type === "question-result") {
        if (!payload.accepted) {
          app.answerLocked = false;
          enableAnswerButtons();
          showToast(payload.reason || "No se ha podido registrar la respuesta.", "error");
        } else if (payload.correct) {
          const attackText = payload.attack ? ` Contraataque enviado a ${payload.attack.targetName}.` : "";
          showToast(`¡Correcto! +${payload.bonusSeconds} s.${attackText}`, "success");
        } else {
          showToast("Respuesta incorrecta. La cola continúa.", "error");
        }
      } else if (payload.type === "penalty-added") {
        showToast(`${payload.sourceName} te envía una inversa: velocidad +${formatDecimal(payload.penaltyAmount)}.`, "error");
      }
      return;
    }

    const connection = app.connections.get(playerId);
    if (connection) {
      DuelPeer.sendJson(connection.channel, payload);
    }
  }

  function submitAnswer(instanceId, optionId) {
    if (app.answerLocked || !app.latestSnapshot || app.latestSnapshot.status !== "playing") {
      return;
    }
    app.answerLocked = true;
    disableAnswerButtons();

    if (app.role === "host") {
      processPlayerAnswer(app.playerId, { instanceId, optionId });
    } else if (app.guestConnection && app.guestConnection.channel) {
      const sent = DuelPeer.sendJson(app.guestConnection.channel, {
        type: "answer",
        instanceId,
        optionId
      });
      if (!sent) {
        app.answerLocked = false;
        enableAnswerButtons();
        showToast("El canal con el anfitrión no está disponible.", "error");
      }
    }
  }

  function applyGameSnapshot(snapshot) {
    if (!snapshot || !snapshot.me) return;
    app.latestSnapshot = snapshot;
    app.snapshotReceivedAt = performance.now();

    if (snapshot.status === "finished") {
      renderEndScreen(snapshot);
      return;
    }

    showScreen("game");
    renderGameHeader(snapshot);
    renderQuestion(snapshot);
    renderOpponents(snapshot);
    renderPenalties(snapshot);
    elements.eliminatedCover.hidden = snapshot.me.alive;
  }

  function renderGameHeader(snapshot) {
    const me = snapshot.me;
    elements.gameAvatar.textContent = initialFor(me.name);
    elements.gamePlayerName.textContent = me.name;
    elements.gameRoomLabel.textContent = `Sala ${snapshot.roomId}`;
    elements.gameLevel.textContent = me.level;
    elements.gameQueue.textContent = me.queueLength;
    elements.gameCorrect.textContent = me.stats.correct;
  }

  function renderQuestion(snapshot) {
    const me = snapshot.me;
    const current = me.current;
    elements.questionCounter.textContent = `${me.queueLength} en cola`;

    if (!current || !me.alive) {
      elements.questionPrompt.textContent = me.alive ? "Preparando la siguiente operación…" : "Has quedado fuera del duelo";
      elements.gameQuestionTitle.textContent = me.alive ? "…" : "Reloj agotado";
      elements.questionTags.replaceChildren();
      elements.answersGrid.replaceChildren();
      app.renderedQuestionInstance = null;
      return;
    }

    elements.questionPrompt.textContent = current.prompt;
    renderQuestionTags(current);

    if (app.renderedQuestionInstance === current.instanceId) {
      if (snapshot.status === "playing" && !app.answerLocked) {
        enableAnswerButtons();
      } else {
        disableAnswerButtons();
      }
      return;
    }

    app.renderedQuestionInstance = current.instanceId;
    app.answerLocked = false;
    renderMath(elements.gameQuestionTitle, current.expression, true);
    elements.answersGrid.replaceChildren();
    current.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";
      button.disabled = snapshot.status !== "playing";
      button.addEventListener("click", () => submitAnswer(current.instanceId, option.id));
      renderMath(button, option.latex, false);
      elements.answersGrid.appendChild(button);
    });
  }

  function renderQuestionTags(current) {
    elements.questionTags.replaceChildren();
    const operation = document.createElement("span");
    operation.className = "mini-badge";
    operation.textContent = current.operation === "derive" ? "Derivar" : "Integrar";
    const family = document.createElement("span");
    family.className = "mini-badge";
    family.textContent = current.familyLabel;
    elements.questionTags.append(operation, family);
    if (current.penaltyId) {
      const attack = document.createElement("span");
      attack.className = "mini-badge attack";
      attack.textContent = `Inversa de ${current.sourceName || "otro jugador"} · +${formatDecimal(current.penaltyAmount)}`;
      elements.questionTags.appendChild(attack);
    }
  }

  function renderOpponents(snapshot) {
    elements.opponentsList.replaceChildren();
    const alive = snapshot.players.filter((player) => player.alive).length;
    elements.aliveCount.textContent = `${alive} ${alive === 1 ? "activo" : "activos"}`;
    const opponents = snapshot.players.filter((player) => player.id !== snapshot.me.id);
    if (!opponents.length) {
      elements.opponentsList.appendChild(createEmptyState("No hay rivales en la sala."));
      return;
    }

    opponents.forEach((player) => {
      const row = document.createElement("div");
      row.className = `opponent-row${player.alive ? "" : " eliminated"}`;
      const top = document.createElement("div");
      top.className = "opponent-top";
      const name = document.createElement("strong");
      name.textContent = player.name;
      const time = document.createElement("span");
      time.className = "opponent-time";
      time.textContent = player.alive ? formatClock(player.timeMs, false) : "Eliminado";
      top.append(name, time);
      const track = document.createElement("div");
      track.className = "time-track";
      const fill = document.createElement("span");
      const initialMs = snapshot.config.initialTimeSeconds * 1000;
      fill.style.width = `${Math.max(0, Math.min(100, (player.timeMs / initialMs) * 100))}%`;
      track.appendChild(fill);
      const meta = document.createElement("div");
      meta.className = "opponent-meta";
      const level = document.createElement("span");
      level.textContent = `Nivel ${player.level}`;
      const pressure = document.createElement("span");
      pressure.textContent = player.penaltyRate > 0 ? `×${formatDecimal(1 + player.penaltyRate)}` : "Sin presión";
      meta.append(level, pressure);
      row.append(top, track, meta);
      elements.opponentsList.appendChild(row);
    });
  }

  function renderPenalties(snapshot) {
    const penalties = snapshot.me.penalties || [];
    const rawTotal = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
    const capped = Math.min(snapshot.config.penaltyCap, rawTotal);
    elements.penaltyTotal.textContent = `+${formatDecimal(capped)}`;
    elements.penaltiesList.replaceChildren();

    if (!penalties.length) {
      elements.penaltiesList.appendChild(createEmptyState("Tu reloj corre a velocidad normal."));
      return;
    }

    penalties.forEach((penalty) => {
      const row = document.createElement("div");
      row.className = "penalty-row";
      const top = document.createElement("div");
      top.className = "penalty-top";
      const source = document.createElement("strong");
      source.textContent = `Inversa de ${penalty.sourceName}`;
      const value = document.createElement("strong");
      value.textContent = `+${formatDecimal(penalty.amount)}`;
      top.append(source, value);
      const track = document.createElement("div");
      track.className = "penalty-track";
      const fill = document.createElement("span");
      fill.style.width = `${Math.min(100, (penalty.amount / Math.max(0.01, snapshot.config.penaltyCap)) * 100)}%`;
      track.appendChild(fill);
      const meta = document.createElement("div");
      meta.className = "penalty-meta";
      const family = app.familyIndex.get(penalty.family);
      meta.textContent = `${family ? family.label : "Pregunta pendiente"} · se elimina al acertarla`;
      row.append(top, track, meta);
      elements.penaltiesList.appendChild(row);
    });
  }

  function renderEndScreen(snapshot) {
    showScreen("end");
    const winner = snapshot.players.find((player) => player.id === snapshot.winnerId);
    elements.winnerTitle.textContent = winner ? `${winner.name} gana el duelo` : "Duelo finalizado";
    elements.winnerSubtitle.textContent = winner
      ? `Nivel ${winner.level} · ${winner.stats.correct} aciertos · último reloj activo.`
      : "Todos los relojes se agotaron.";
    elements.resultsList.replaceChildren();

    snapshot.results.forEach((result) => {
      const row = document.createElement("div");
      row.className = "result-row";
      const position = document.createElement("div");
      position.className = "result-position";
      position.textContent = `${result.position}.`;
      const player = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = result.name;
      const level = document.createElement("small");
      level.textContent = `Nivel ${result.level}`;
      player.append(name, level);
      const score = document.createElement("small");
      score.textContent = `${result.stats.correct} ✓ · ${result.stats.wrong} ✕`;
      const attacks = document.createElement("small");
      attacks.className = "result-attacks";
      attacks.textContent = `${result.stats.attacksSent} inversas`;
      row.append(position, player, score, attacks);
      elements.resultsList.appendChild(row);
    });
  }

  function updateLiveClock() {
    if (app.latestSnapshot && !elements.gameScreen.hidden) {
      const snapshot = app.latestSnapshot;
      const elapsed = Math.max(0, performance.now() - app.snapshotReceivedAt);
      const projectedServerNow = snapshot.serverNow + elapsed;

      if (snapshot.status === "countdown") {
        const remaining = Math.max(0, snapshot.startAt - projectedServerNow);
        elements.countdownCover.hidden = false;
        elements.countdownValue.textContent = String(Math.max(1, Math.ceil(remaining / 1000)));
      } else {
        elements.countdownCover.hidden = true;
      }

      let timeMs = snapshot.me.timeMs;
      if (snapshot.status === "playing" && snapshot.me.alive) {
        timeMs = Math.max(0, timeMs - elapsed * (1 + snapshot.me.penaltyRate));
      }
      elements.timerValue.textContent = formatClock(timeMs, true);
      elements.timerRate.textContent = `Velocidad ×${formatDecimal(1 + snapshot.me.penaltyRate)}`;
      elements.timerCard.classList.toggle("warning", timeMs <= 15000 && snapshot.me.alive);
    }
    requestAnimationFrame(updateLiveClock);
  }

  function renderMath(element, latex, displayMode) {
    element.textContent = latex;
    if (!window.katex) return;
    try {
      window.katex.render(latex, element, {
        throwOnError: false,
        displayMode,
        strict: "ignore"
      });
    } catch (error) {
      element.textContent = latex;
    }
  }

  function disableAnswerButtons() {
    Array.from(elements.answersGrid.querySelectorAll("button")).forEach((button) => {
      button.disabled = true;
    });
  }

  function enableAnswerButtons() {
    Array.from(elements.answersGrid.querySelectorAll("button")).forEach((button) => {
      button.disabled = false;
    });
  }

  async function openScanner(targetTextarea, afterScan) {
    if (!window.Html5Qrcode) {
      showToast("El lector QR no se ha cargado. Pega el código manualmente.", "error");
      targetTextarea.focus();
      return;
    }

    app.scannerProcessing = false;
    elements.scanDialog.showModal();
    app.scanner = new window.Html5Qrcode("qr-reader");
    try {
      await app.scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 },
        async (decodedText) => {
          if (app.scannerProcessing) return;
          app.scannerProcessing = true;
          targetTextarea.value = decodedText;
          await closeScanner();
          targetTextarea.dispatchEvent(new Event("input", { bubbles: true }));
          showToast("Código QR leído. Completando el enlace…", "success");
          if (typeof afterScan === "function") {
            await afterScan();
          }
        },
        () => {}
      );
    } catch (error) {
      console.error(error);
      await closeScanner();
      showToast("No se puede usar la cámara. Comprueba el permiso o pega el código.", "error");
      targetTextarea.focus();
    }
  }

  async function closeScanner() {
    if (app.scanner) {
      try {
        if (app.scanner.isScanning) {
          await app.scanner.stop();
        }
        await app.scanner.clear();
      } catch (error) {
        console.warn(error);
      }
      app.scanner = null;
    }
    app.scannerProcessing = false;
    if (elements.scanDialog.open) {
      elements.scanDialog.close();
    }
  }

  function handleJoinHash() {
    if (!window.location.hash.startsWith("#")) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const joinCode = params.get("join");
    if (!joinCode) return;
    selectSetupTab("join");
    elements.offerCode.value = decodeURIComponent(joinCode);
    window.setTimeout(() => elements.joinName.focus(), 50);
  }

  function selectSetupTab(tab) {
    const createSelected = tab === "create";
    elements.createTab.setAttribute("aria-selected", String(createSelected));
    elements.joinTab.setAttribute("aria-selected", String(!createSelected));
    elements.createPanel.hidden = !createSelected;
    elements.joinPanel.hidden = createSelected;
  }

  function showScreen(screenName) {
    const screens = {
      setup: elements.setupScreen,
      lobby: elements.lobbyScreen,
      game: elements.gameScreen,
      end: elements.endScreen
    };
    const alreadyVisible = !screens[screenName].hidden;
    Object.entries(screens).forEach(([name, screen]) => {
      screen.hidden = name !== screenName;
    });
    if (!alreadyVisible) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function copyText(value, successMessage) {
    if (!value) {
      showToast("Todavía no hay un código para copiar.", "error");
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = value;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        document.execCommand("copy");
        temporary.remove();
      }
      showToast(successMessage, "success");
    } catch (error) {
      showToast("No se ha podido copiar. Selecciona el código manualmente.", "error");
    }
  }

  function showToast(message, type) {
    window.clearTimeout(app.toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast${type ? ` ${type}` : ""}`;
    elements.toast.hidden = false;
    app.toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 4300);
  }

  function setSetupMessage(message, error) {
    elements.setupMessage.textContent = message;
    elements.setupMessage.classList.toggle("error", Boolean(error));
  }

  function setButtonBusy(button, busy, label) {
    button.disabled = busy;
    button.textContent = label;
  }

  function createEmptyState(message) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = message;
    return empty;
  }

  function readNumber(input, minimum, maximum) {
    const value = Number(input.value);
    return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
  }

  function cleanName(value, fallback) {
    const normalized = String(value || "").replace(/\s+/g, " ").trim().slice(0, 24);
    return normalized || fallback;
  }

  function createRoomCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = window.crypto && window.crypto.getRandomValues
      ? window.crypto.getRandomValues(new Uint8Array(6))
      : Array.from({ length: 6 }, () => Math.floor(Math.random() * 255));
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  }

  function shouldUseInviteUrl() {
    return window.location.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  function serializeDescription(description) {
    return { type: description.type, sdp: description.sdp };
  }

  function formatClock(milliseconds, tenths) {
    const safe = Math.max(0, milliseconds);
    const totalSeconds = safe / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const tenth = Math.floor((safe % 1000) / 100);
    return tenths
      ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenth}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatDuration(seconds) {
    if (seconds % 60 === 0) {
      const minutes = seconds / 60;
      return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    }
    return `${formatDecimal(seconds / 60)} min`;
  }

  function formatDecimal(value) {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function initialFor(name) {
    return String(name || "?").trim().charAt(0).toUpperCase() || "?";
  }

  function toCamelCase(value) {
    return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
})();
