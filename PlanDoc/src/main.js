import { createCourseMetadata, fetchCourses, fetchEntity, importUvSchedule, login, saveEntity } from "./app/api.js";
import { renderAsignaturasSection, bindAsignaturasEvents, hydrateAsignaturas, hydrateCategoriasAsignaturas } from "./app/asignaturas.js";
import { bindCalendarioEvents, renderCalendarioSection } from "./app/calendario.js";
import { bindDocenciaEvents, cleanDocenciaForState, hydrateDocencia, renderDocenciaSection } from "./app/docencia.js";
import { renderHomeSection } from "./app/home.js";
import { bindProfesoresEvents, hydrateProfesores, renderProfesoresSection } from "./app/profesores.js";
import { bindPublicEvents, renderPublicView } from "./app/publico.js";
import { resetCourseSlices, state } from "./app/state.js";
import { bindTrabajosEvents, hydrateTrabajos, renderTrabajosSection } from "./app/trabajos.js";
import { escapeHtml } from "./app/utils.js";

const app = document.getElementById("app");
const urlParams = new URLSearchParams(window.location.search);
state.publicMode = urlParams.get("public") === "1";
state.selectedCourse = urlParams.get("course") || "";
if (state.publicMode) {
    document.title = "PlanDoc publico";
    state.isPreparingData = true;
    state.preparingMessage = "Preparando datos publicos...";
}
render();

if (state.publicMode) {
    state.status = "Cargando datos publicos...";
    render();
    loadCoreData()
        .then(() => {
            state.status = state.selectedCourse ? "Datos publicos cargados." : "No hay curso publico cargado.";
            state.isPreparingData = false;
            state.preparingMessage = "";
            render();
        })
        .catch((err) => {
            state.status = `Error cargando vista publica: ${err.message}`;
            state.isPreparingData = false;
            state.preparingMessage = "";
            render();
        });
}

function setStatus(text) {
    state.status = text;
    render();
}

function showPreparing(message) {
    state.isPreparingData = true;
    state.preparingMessage = message;
    render();
}

function hidePreparing() {
    state.isPreparingData = false;
    state.preparingMessage = "";
    render();
}

async function withPreparing(message, task) {
    showPreparing(message);
    try {
        return await task();
    } finally {
        hidePreparing();
    }
}

function getLatestCourse(courses) {
    return [...courses].sort((a, b) => String(b.id).localeCompare(String(a.id))).at(0);
}

function getSelectedCourse() {
    return state.courses.find((course) => course.id === state.selectedCourse);
}

async function loadCourses() {
    const data = await fetchCourses({ publicMode: state.publicMode });
    state.courses = data.courses || [];
    if (!state.selectedCourse && state.courses.length > 0) {
        state.selectedCourse = getLatestCourse(state.courses)?.id || "";
    }
}

async function loadSelectedCourseMetadata() {
    if (!state.selectedCourse) return;
    try {
        const data = await fetchEntity(state.selectedCourse, "metadata", { publicMode: true });
        const meta = data.data || {};
        state.courses = [{
            id: String(meta.id || state.selectedCourse),
            nombre: String(meta.nombre || `Curso ${state.selectedCourse}`),
            activo: Boolean(meta.activo || false),
        }];
    } catch (err) {
        console.warn("PlanDoc: no se ha podido cargar la metadata publica del curso", err);
        state.courses = [{ id: state.selectedCourse, nombre: `Curso ${state.selectedCourse}`, activo: false }];
    }
}

async function loadProfesores() {
    if (!state.selectedCourse) return;
    const data = await fetchEntity(state.selectedCourse, "profesores", { publicMode: state.publicMode });
    state.profesores = hydrateProfesores(data.data);
    state.profesoresVersion = data.version || "";
    if (state.selectedProfesorIndex >= state.profesores.length) {
        state.selectedProfesorIndex = state.profesores.length - 1;
    }
}

async function loadAsignaturas() {
    if (!state.selectedCourse) return;
    const [asignaturasData, categoriasData] = await Promise.all([
        fetchEntity(state.selectedCourse, "asignaturas", { publicMode: state.publicMode }),
        fetchEntity(state.selectedCourse, "categoriasAsignaturas", { publicMode: state.publicMode }),
    ]);
    state.asignaturas = hydrateAsignaturas(asignaturasData.data);
    state.asignaturasVersion = asignaturasData.version || "";
    state.categoriasAsignaturas = hydrateCategoriasAsignaturas(categoriasData.data);
    state.categoriasAsignaturasVersion = categoriasData.version || "";
    if (state.selectedAsignaturaIndex >= state.asignaturas.length) {
        state.selectedAsignaturaIndex = state.asignaturas.length - 1;
    }
}

async function loadTrabajos() {
    if (!state.selectedCourse) return;
    const data = await fetchEntity(state.selectedCourse, "trabajos", { publicMode: state.publicMode });
    state.trabajos = hydrateTrabajos(data.data);
    state.trabajosVersion = data.version || "";
}

async function loadDocencia() {
    if (!state.selectedCourse) return;
    const data = await fetchEntity(state.selectedCourse, "docencia", { publicMode: state.publicMode });
    state.docencia = hydrateDocencia(data.data);
    state.docenciaVersion = data.version || "";
    state.docencia = cleanDocenciaForState(state);
    if (state.selectedDocenciaAsignaturaId && !state.asignaturas.some((asignatura) => asignatura.id === state.selectedDocenciaAsignaturaId)) {
        state.selectedDocenciaAsignaturaId = "";
    }
}

async function loadCoreData() {
    if (state.publicMode && state.selectedCourse) {
        await loadSelectedCourseMetadata();
    } else {
        await loadCourses();
    }
    if (state.selectedCourse) {
        const coreResults = await Promise.allSettled([loadProfesores(), loadAsignaturas(), loadTrabajos()]);
        if (coreResults[0].status === "rejected") {
            throw coreResults[0].reason;
        }
        if (coreResults[1].status === "rejected") {
            throw coreResults[1].reason;
        }
        if (coreResults[2].status === "rejected") {
            console.warn("PlanDoc: no se han podido cargar los trabajos", coreResults[2].reason);
            state.trabajos = [];
            state.trabajosVersion = "";
        }
        try {
            await loadDocencia();
        } catch (err) {
            console.warn("PlanDoc: no se ha podido cargar el reparto", err);
            state.docencia = [];
            state.docenciaVersion = "";
        }
    } else {
        resetCourseSlices();
    }
}

async function createCourse() {
    const id = (document.getElementById("new-course-id")?.value || "").trim();
    if (!id) {
        setStatus("Indica un id de curso. Ejemplo: 2026-2027");
        return;
    }
    const nombre = (document.getElementById("new-course-name")?.value || `Curso ${id}`).trim();
    try {
        setStatus("Creando curso...");
        await createCourseMetadata(id, nombre, state.courses.length === 0);
        state.selectedCourse = id;
        state.isCourseModalOpen = false;
        await withPreparing("Preparando informacion del curso...", loadCoreData);
        setStatus(`Curso ${id} creado.`);
    } catch (err) {
        setStatus(`Error creando curso: ${err.message}`);
    }
    render();
}

async function saveProfesores() {
    if (!state.selectedCourse) {
        setStatus("Selecciona o crea un curso antes de guardar profesores.");
        return;
    }
    try {
        setStatus("Guardando profesores...");
        const res = await saveEntity(state.selectedCourse, "profesores", state.profesores, state.profesoresVersion);
        state.profesoresVersion = res.sha;
        setStatus("Profesores guardados.");
    } catch (err) {
        setStatus(`Error guardando profesores: ${err.message}`);
    }
    render();
}

async function saveAsignaturas() {
    if (!state.selectedCourse) {
        setStatus("Selecciona o crea un curso antes de guardar asignaturas.");
        return;
    }
    try {
        setStatus("Guardando asignaturas...");
        const res = await saveEntity(state.selectedCourse, "asignaturas", state.asignaturas, state.asignaturasVersion);
        state.asignaturasVersion = res.sha;
        setStatus("Asignaturas guardadas.");
    } catch (err) {
        setStatus(`Error guardando asignaturas: ${err.message}`);
    }
    render();
}

async function saveCategoriasAsignaturas() {
    if (!state.selectedCourse) {
        setStatus("Selecciona o crea un curso antes de guardar categorias.");
        return;
    }
    try {
        setStatus("Guardando categorias...");
        const res = await saveEntity(
            state.selectedCourse,
            "categoriasAsignaturas",
            state.categoriasAsignaturas,
            state.categoriasAsignaturasVersion,
        );
        state.categoriasAsignaturasVersion = res.sha;
        setStatus("Categorias guardadas.");
    } catch (err) {
        setStatus(`Error guardando categorias: ${err.message}`);
    }
    render();
}

async function saveTrabajos() {
    if (!state.selectedCourse) {
        setStatus("Selecciona o crea un curso antes de guardar trabajos.");
        return;
    }
    try {
        setStatus("Guardando trabajos...");
        const res = await saveEntity(state.selectedCourse, "trabajos", state.trabajos, state.trabajosVersion);
        state.trabajosVersion = res.sha;
        setStatus("Trabajos guardados.");
    } catch (err) {
        setStatus(`Error guardando trabajos: ${err.message}`);
    }
    render();
}

async function saveDocencia() {
    if (!state.selectedCourse) {
        setStatus("Selecciona o crea un curso antes de guardar el reparto.");
        return;
    }
    try {
        setStatus("Guardando reparto...");
        state.docencia = cleanDocenciaForState(state);
        const res = await saveEntity(state.selectedCourse, "docencia", state.docencia, state.docenciaVersion);
        state.docenciaVersion = res.sha;
        setStatus("Reparto guardado.");
    } catch (err) {
        setStatus(`Error guardando reparto: ${err.message}`);
    }
    render();
}

function renderLogin() {
    return `
        <div class="card">
            <h2>Login admin</h2>
            <div class="grid">
                <input type="password" id="password" placeholder="Contrasena" />
                <button id="login-btn">Entrar</button>
            </div>
        </div>
    `;
}

function renderWorkspace() {
    const selectedCourse = getSelectedCourse();
    const selectedCourseLabel = selectedCourse
        ? `${selectedCourse.nombre} (${selectedCourse.id})`
        : "Ningun curso cargado";
    const publicUrl = state.selectedCourse
        ? `${window.location.origin}${window.location.pathname}?public=1&course=${encodeURIComponent(state.selectedCourse)}`
        : "";

    return `
        <div class="card app-header">
            <div>
                <h1>PlanDoc Admin</h1>
                <p class="course-loaded">Curso cargado: <strong>${escapeHtml(selectedCourseLabel)}</strong></p>
                <p class="status">${escapeHtml(state.status)}</p>
            </div>
            <div class="header-actions">
                ${publicUrl ? `<a class="button-link secondary mini-link" href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener">Vista publica</a>` : ""}
                <button class="secondary mini" id="open-course-modal-btn" type="button">Gestionar curso</button>
            </div>
        </div>

        ${state.isCourseModalOpen ? renderCourseModal() : ""}

        <div class="card nav-tabs">
            <button class="tab ${state.tab === "home" ? "active" : ""}" data-tab="home">Home</button>
            <button class="tab ${state.tab === "profesores" ? "active" : ""}" data-tab="profesores">Profesores</button>
            <button class="tab ${state.tab === "asignaturas" ? "active" : ""}" data-tab="asignaturas">Asignaturas</button>
            <button class="tab ${state.tab === "docencia" ? "active" : ""}" data-tab="docencia">Reparto</button>
            <button class="tab ${state.tab === "calendario" ? "active" : ""}" data-tab="calendario">Calendario</button>
            <button class="tab ${state.tab === "trabajos" ? "active" : ""}" data-tab="trabajos">TFG / TFM / Practicas</button>
        </div>

        ${state.tab === "home" ? renderHomeSection(state) : ""}
        ${state.tab === "profesores" ? renderProfesoresSection(state) : ""}
        ${state.tab === "asignaturas" ? renderAsignaturasSection(state) : ""}
        ${state.tab === "docencia" ? renderDocenciaSection(state) : ""}
        ${state.tab === "calendario" ? renderCalendarioSection(state) : ""}
        ${state.tab === "trabajos" ? renderTrabajosSection(state) : ""}
    `;
}

function renderCourseModal() {
    return `
        <div class="modal-backdrop" id="course-modal-backdrop">
            <section class="card modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
                <div class="modal-header">
                    <h2 id="course-modal-title">Gestionar curso</h2>
                    <button class="secondary mini" id="close-course-modal-btn" type="button">Cerrar</button>
                </div>
                <div class="grid">
                    <label>
                        Curso
                        <select id="course-select">
                            <option value="">Selecciona curso</option>
                            ${state.courses.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === state.selectedCourse ? "selected" : ""}>${escapeHtml(c.nombre)} (${escapeHtml(c.id)})</option>`).join("")}
                        </select>
                    </label>
                    <button class="secondary" id="reload-course-btn" type="button">Recargar curso</button>
                    <div class="grid grid-2">
                        <label>
                            Nuevo curso
                            <input id="new-course-id" placeholder="Ej. 2026-2027" />
                        </label>
                        <label>
                            Nombre
                            <input id="new-course-name" placeholder="Opcional" />
                        </label>
                    </div>
                    <button id="create-course-btn" type="button">Crear curso</button>
                </div>
            </section>
        </div>
    `;
}

function renderPreparingModal() {
    if (!state.isPreparingData) return "";
    const message = state.preparingMessage || "Preparando informacion...";
    return `
        <div class="loading-modal-backdrop" role="presentation">
            <section class="card loading-modal" role="status" aria-live="polite" aria-label="Preparando informacion">
                <div class="loading-spinner" aria-hidden="true"></div>
                <div>
                    <h2>Preparando informacion</h2>
                    <p>${escapeHtml(message)}</p>
                </div>
            </section>
        </div>
    `;
}

function render() {
    if (state.publicMode) {
        app.innerHTML = `${renderPublicView(state)}${renderPreparingModal()}`;
        bindEvents();
        return;
    }

    app.innerHTML = `
        <div class="container grid">
            ${state.isLoggedIn ? "" : `<div class="card">
                <h1>PlanDoc Admin</h1>
                <p class="status">${escapeHtml(state.status)}</p>
            </div>`}
            ${state.isLoggedIn ? renderWorkspace() : renderLogin()}
        </div>
        ${renderPreparingModal()}
    `;
    bindEvents();
}

function bindEvents() {
    if (state.publicMode) {
        bindPublicEvents({ state, render });
        return;
    }

    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.onclick = async () => {
            try {
                const pass = document.getElementById("password").value;
                setStatus("Autenticando...");
                await login(pass);
                state.isLoggedIn = true;
                await withPreparing("Preparando informacion del curso...", loadCoreData);
                state.tab = "home";
                setStatus("Sesion iniciada.");
            } catch (err) {
                setStatus(`Error login: ${err.message}`);
            }
            render();
        };
    }

    const courseSelect = document.getElementById("course-select");
    if (courseSelect) {
        courseSelect.onchange = async (e) => {
            state.selectedCourse = e.target.value;
            try {
                await withPreparing("Preparando informacion del curso...", async () => {
                    if (state.selectedCourse) {
                        await Promise.all([loadProfesores(), loadAsignaturas(), loadTrabajos()]);
                        await loadDocencia();
                    } else {
                        resetCourseSlices();
                    }
                    state.isCourseModalOpen = false;
                    setStatus(`Curso cargado: ${state.selectedCourse || "(ninguno)"}`);
                });
            } catch (err) {
                setStatus(`Error cargando curso: ${err.message}`);
            }
        };
    }

    const openCourseModalBtn = document.getElementById("open-course-modal-btn");
    if (openCourseModalBtn) {
        openCourseModalBtn.onclick = () => {
            state.isCourseModalOpen = true;
            render();
        };
    }

    const closeCourseModalBtn = document.getElementById("close-course-modal-btn");
    if (closeCourseModalBtn) {
        closeCourseModalBtn.onclick = () => {
            state.isCourseModalOpen = false;
            render();
        };
    }

    const courseModalBackdrop = document.getElementById("course-modal-backdrop");
    if (courseModalBackdrop) {
        courseModalBackdrop.onclick = (e) => {
            if (e.target === courseModalBackdrop) {
                state.isCourseModalOpen = false;
                render();
            }
        };
    }

    const reloadCourseBtn = document.getElementById("reload-course-btn");
    if (reloadCourseBtn) {
        reloadCourseBtn.onclick = async () => {
            try {
                await withPreparing("Actualizando informacion del curso...", async () => {
                    await loadCoreData();
                    state.isCourseModalOpen = false;
                    setStatus("Curso recargado.");
                });
            } catch (err) {
                setStatus(`Error recargando curso: ${err.message}`);
            }
        };
    }

    const createCourseBtn = document.getElementById("create-course-btn");
    if (createCourseBtn) {
        createCourseBtn.onclick = createCourse;
    }

    const copyPublicUrlBtn = document.getElementById("copy-public-url-btn");
    if (copyPublicUrlBtn) {
        copyPublicUrlBtn.onclick = async () => {
            const input = document.getElementById("public-url-input");
            const value = input?.value || "";
            if (!value) {
                setStatus("No hay URL publica para copiar.");
                return;
            }
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(value);
                } else {
                    input.select();
                    document.execCommand("copy");
                }
                setStatus("URL publica copiada al portapapeles.");
            } catch (err) {
                input?.select();
                setStatus("No se pudo copiar automaticamente. La URL queda seleccionada.");
            }
        };
    }

    app.querySelectorAll(".tab").forEach((tabBtn) => {
        tabBtn.onclick = () => {
            state.tab = tabBtn.dataset.tab;
            render();
        };
    });

    if (state.tab === "profesores") {
        bindProfesoresEvents({ app, state, setStatus, render, saveProfesores });
    }
    if (state.tab === "asignaturas") {
        bindAsignaturasEvents({ app, state, setStatus, render, saveAsignaturas, saveCategoriasAsignaturas, importUvSchedule });
    }
    if (state.tab === "docencia") {
        bindDocenciaEvents({ app, state, setStatus, render, saveDocencia });
    }
    if (state.tab === "calendario") {
        bindCalendarioEvents({ state, setStatus, render, saveAsignaturas });
    }
    if (state.tab === "trabajos") {
        bindTrabajosEvents({ app, state, setStatus, render, saveTrabajos });
    }
}
