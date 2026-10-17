// Loads the case data and engines into a fresh global, as the browser would.
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function load({ privateData = true } = {}) {
  for (const k of ["SFData", "SFMath", "SFEvidence", "SFValidate"]) delete globalThis[k];
  const files = ["data/sf-public.js", "data/sf-episodes.js"].concat(privateData ? ["data/sf-private.js"] : []).concat(["sf-math.js", "sf-evidence.js", "sf-validate.js"]);
  for (const f of files) {
    const p = path.join(ROOT, f);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return { SF: globalThis.SFData, M: globalThis.SFMath, E: globalThis.SFEvidence, V: globalThis.SFValidate };
}

/** Every {es, en} pair in an object tree, with its path. */
function pairs(obj, at = "$", out = []) {
  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 2 && keys.includes("es") && keys.includes("en")) out.push({ at, v: obj });
    else if (Array.isArray(obj)) obj.forEach((x, k) => pairs(x, `${at}[${k}]`, out));
    else keys.forEach((k) => pairs(obj[k], `${at}.${k}`, out));
  }
  return out;
}

module.exports = { load, pairs, ROOT };
