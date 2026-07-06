function resolveApiBase() {
    const configured = (globalThis.PLANDOC_API_BASE || "").trim();
    if (configured) {
        return configured.replace(/\/+$/, "");
    }

    const { protocol, hostname } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    if (isLocalHost) {
        if (window.location.port === "3001") {
            return `${protocol}//${hostname}:8788`;
        }
        return `${protocol}//${hostname}:8787`;
    }

    // Production/default path: same-origin API.
    return "";
}

const API_BASE = resolveApiBase();

export async function api(path, options = {}) {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            credentials: "include",
            headers: { "content-type": "application/json", ...(options.headers || {}) },
            ...options,
        });
    } catch (cause) {
        const target = API_BASE || "la misma URL de la web";
        const err = new Error(`No se pudo conectar con la API (${target}). Revisa PLANDOC_API_BASE, que el Worker este desplegado y que ALLOWED_ORIGIN incluya esta web.`);
        err.cause = cause;
        throw err;
    }

    const text = await res.text();
    let body = {};
    try {
        body = text ? JSON.parse(text) : {};
    } catch {
        const err = new Error("La API no ha devuelto JSON. Revisa la URL del worker/API en PLANDOC_API_BASE.");
        err.responseText = text;
        throw err;
    }
    if (!res.ok) {
        const err = new Error(body.details || body.error || `HTTP ${res.status}`);
        err.body = body;
        throw err;
    }
    return body;
}

export async function login(password) {
    return api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ password }),
    });
}

export async function fetchCourses(options = {}) {
    const suffix = options.publicMode ? "?public=1" : "";
    return api(`/api/courses${suffix}`, { method: "GET" });
}

export async function fetchEntity(courseId, entity, options = {}) {
    const suffix = options.publicMode ? "?public=1" : "";
    return api(`/api/courses/${encodeURIComponent(courseId)}/file/${entity}${suffix}`, {
        method: "GET",
    });
}

export async function saveEntity(courseId, entity, data, baseVersion) {
    return api(`/api/courses/${encodeURIComponent(courseId)}/file/${entity}`, {
        method: "POST",
        body: JSON.stringify({ data, baseVersion }),
    });
}

export async function importUvSchedule({ codigoAsignatura, idTitulacion, anyoFinCurso }) {
    return api("/api/uv/asignatura-horarios", {
        method: "POST",
        body: JSON.stringify({ codigoAsignatura, idTitulacion, anyoFinCurso }),
    });
}

export async function createCourseMetadata(courseId, nombre, activo = false) {
    return saveEntity(courseId, "metadata", { id: courseId, nombre, activo }, "");
}
