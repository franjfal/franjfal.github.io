(function (global) {
  "use strict";

  const SIGNAL_PREFIX = "duel-v1";

  function createPeerConnection() {
    if (!global.RTCPeerConnection) {
      throw new Error("Este navegador no ofrece conexiones WebRTC.");
    }
    return new global.RTCPeerConnection({ iceServers: [], iceCandidatePoolSize: 0 });
  }

  function waitForIceGathering(peerConnection, timeoutMs) {
    if (peerConnection.iceGatheringState === "complete") {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        peerConnection.removeEventListener("icegatheringstatechange", checkState);
        global.clearTimeout(timeoutId);
        resolve();
      };
      const checkState = () => {
        if (peerConnection.iceGatheringState === "complete") {
          finish();
        }
      };
      const timeoutId = global.setTimeout(finish, timeoutMs || 7000);
      peerConnection.addEventListener("icegatheringstatechange", checkState);
    });
  }

  async function packSignal(payload) {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);

    if (global.CompressionStream) {
      const compressedStream = new Blob([bytes]).stream().pipeThrough(new global.CompressionStream("gzip"));
      const compressed = new Uint8Array(await new Response(compressedStream).arrayBuffer());
      return `${SIGNAL_PREFIX}.g.${toBase64Url(compressed)}`;
    }

    return `${SIGNAL_PREFIX}.j.${toBase64Url(bytes)}`;
  }

  async function unpackSignal(input) {
    const normalized = normalizeSignalInput(input);
    const parts = normalized.split(".");
    if (parts.length !== 3 || parts[0] !== SIGNAL_PREFIX) {
      throw new Error("El código no pertenece a La batalla de genios.");
    }

    const bytes = fromBase64Url(parts[2]);
    let decoded = bytes;

    if (parts[1] === "g") {
      if (!global.DecompressionStream) {
        throw new Error("Este navegador no puede descomprimir el código QR. Prueba con una versión más reciente.");
      }
      const decompressedStream = new Blob([bytes]).stream().pipeThrough(new global.DecompressionStream("gzip"));
      decoded = new Uint8Array(await new Response(decompressedStream).arrayBuffer());
    } else if (parts[1] !== "j") {
      throw new Error("El formato del código no es compatible.");
    }

    try {
      return JSON.parse(new TextDecoder().decode(decoded));
    } catch (error) {
      throw new Error("El código está incompleto o dañado.");
    }
  }

  function normalizeSignalInput(input) {
    const value = String(input || "").trim();
    if (!value) {
      throw new Error("No se ha recibido ningún código.");
    }

    if (value.startsWith(SIGNAL_PREFIX)) {
      return value;
    }

    try {
      const url = new URL(value, global.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = hashParams.get("join") || hashParams.get("answer");
      if (code) {
        // URLSearchParams already decodes percent escapes. Decoding a second
        // time can alter a valid payload received through a shared URL.
        return code;
      }
    } catch (error) {
      return value;
    }

    return value;
  }

  function createInviteUrl(code) {
    const base = global.location.href.split("#")[0];
    return `${base}#join=${encodeURIComponent(code)}`;
  }

  function renderQr(element, value) {
    element.replaceChildren();
    if (!global.QRCode) {
      const message = document.createElement("span");
      message.className = "qr-placeholder";
      message.textContent = "La biblioteca QR no se ha cargado. Usa el botón de copiar código.";
      element.appendChild(message);
      return false;
    }

    try {
      new global.QRCode(element, {
        text: value,
        width: 232,
        height: 232,
        colorDark: "#101a2b",
        colorLight: "#ffffff",
        correctLevel: global.QRCode.CorrectLevel.L
      });
      return true;
    } catch (error) {
      const message = document.createElement("span");
      message.className = "qr-placeholder";
      message.textContent = "El código es demasiado grande para este generador QR. Usa copiar y pegar.";
      element.appendChild(message);
      return false;
    }
  }

  function sendJson(channel, payload) {
    if (!channel || channel.readyState !== "open") {
      return false;
    }
    channel.send(JSON.stringify(payload));
    return true;
  }

  function parseMessage(event) {
    try {
      return JSON.parse(event.data);
    } catch (error) {
      return null;
    }
  }

  function randomId(prefix) {
    const values = global.crypto && global.crypto.getRandomValues
      ? global.crypto.getRandomValues(new Uint32Array(2))
      : [Math.floor(Math.random() * 0xffffffff), Date.now()];
    const fragment = Array.from(values, (value) => Number(value).toString(36)).join("").slice(0, 14);
    return `${prefix}-${fragment}`;
  }

  function toBase64Url(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return global.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fromBase64Url(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = global.atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  global.DuelPeer = {
    createPeerConnection,
    waitForIceGathering,
    packSignal,
    unpackSignal,
    normalizeSignalInput,
    createInviteUrl,
    renderQr,
    sendJson,
    parseMessage,
    randomId
  };
})(window);
