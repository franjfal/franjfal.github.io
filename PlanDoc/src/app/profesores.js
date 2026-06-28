import { escapeHtml, toPositiveNumber, uid } from "./utils.js";
import { calcularReajusteDocente, capacidadProfesor, totalReduccionesProfesor } from "./reajuste.js";

const REDUCCION_TIPOS = [
    { value: "Sexenios", label: "Sexenios" },
    { value: "Cargos", label: "Cargos" },
    { value: "Direccion de tesis", label: "Direcci&oacute;n de tesis" },
    { value: "Gestion", label: "Gesti&oacute;n" },
    { value: "Discapacidad", label: "Discapacidad" },
    { value: "Sustituciones de cursos anteriores", label: "Sustituciones de cursos anteriores" },
];

function normalizeReduccion(raw) {
    return {
        id: raw?.id || uid("red"),
        tipo: (raw?.tipo || "Cargo").trim() || "Cargo",
        creditos: toPositiveNumber(raw?.creditos, 0),
        descripcion: (raw?.descripcion || "").trim(),
    };
}

export function normalizeProfesor(raw) {
    const nombre = (raw?.nombre || "").trim();
    const apellidos = (raw?.apellidos || "").trim();
    const nombreCompleto = (raw?.nombreCompleto || [nombre, apellidos].filter(Boolean).join(" ")).trim();

    return {
        id: (raw?.id || "").trim(),
        nombre,
        apellidos,
        nombreCompleto,
        creditosObjetivo: toPositiveNumber(raw?.creditosObjetivo, 0),
        docenciaAjustable: raw?.docenciaAjustable !== false,
        reducciones: Array.isArray(raw?.reducciones) ? raw.reducciones.map(normalizeReduccion) : [],
    };
}

export function hydrateProfesores(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    return list.map(normalizeProfesor);
}

export function totalReducciones(profesor) {
    return totalReduccionesProfesor(profesor);
}

export function creditosDisponibles(profesor) {
    return capacidadProfesor(profesor);
}

export function profesoresStats(profesores) {
    const objetivo = profesores.reduce((sum, p) => sum + toPositiveNumber(p.creditosObjetivo, 0), 0);
    const reducciones = profesores.reduce((sum, p) => sum + totalReducciones(p), 0);
    const disponibles = objetivo - reducciones;
    return {
        objetivo: Number(objetivo.toFixed(2)),
        reducciones: Number(reducciones.toFixed(2)),
        disponibles: Number(disponibles.toFixed(2)),
    };
}

function emptyProfesorDraft() {
    return {
        id: "",
        nombre: "",
        apellidos: "",
        creditosObjetivo: "",
        docenciaAjustable: true,
        reducciones: [],
    };
}

function draftFromProfesor(profesor) {
    return {
        id: profesor.id || "",
        nombre: profesor.nombre || "",
        apellidos: profesor.apellidos || "",
        creditosObjetivo: String(toPositiveNumber(profesor.creditosObjetivo, 0)),
        docenciaAjustable: profesor.docenciaAjustable !== false,
        reducciones: Array.isArray(profesor.reducciones) ? profesor.reducciones.map(normalizeReduccion) : [],
    };
}

function closeProfesorModal(state) {
    state.isProfesorModalOpen = false;
    state.profesorModalMode = "create";
    state.editingProfesorIndex = -1;
    state.profesorDraft = emptyProfesorDraft();
}

function updateProfesorDraftFromModal(state) {
    state.profesorDraft = {
        id: (document.getElementById("prof-new-id")?.value || "").trim(),
        nombre: (document.getElementById("prof-new-name")?.value || "").trim(),
        apellidos: (document.getElementById("prof-new-surname")?.value || "").trim(),
        creditosObjetivo: document.getElementById("prof-new-creditos")?.value || "",
        docenciaAjustable: document.getElementById("prof-docencia-ajustable")?.checked !== false,
        reducciones: Array.isArray(state.profesorDraft?.reducciones) ? state.profesorDraft.reducciones : [],
    };
}

function renderReduccionTipoSelect(id) {
    return `
        <select id="${id}">
            ${REDUCCION_TIPOS.map((tipo) => `<option value="${escapeHtml(tipo.value)}">${tipo.label}</option>`).join("")}
            <option value="__manual__">Otra reducci&oacute;n</option>
        </select>
    `;
}

function readReduccionTipo(selectId, manualId) {
    const selected = document.getElementById(selectId)?.value || "";
    const manual = (document.getElementById(manualId)?.value || "").trim();

    if (selected === "__manual__") {
        return manual;
    }
    return selected || "Reduccion";
}

function bindManualReduccionToggle(selectId, manualId) {
    const select = document.getElementById(selectId);
    const manual = document.getElementById(manualId);
    if (!select || !manual) {
        return;
    }

    const sync = () => {
        const showManual = select.value === "__manual__";
        manual.classList.toggle("is-hidden", !showManual);
        manual.disabled = !showManual;
        if (!showManual) {
            manual.value = "";
        }
    };

    select.onchange = sync;
    sync();
}

function profesorInitials(profesor) {
    const first = (profesor.nombre || profesor.nombreCompleto || "").trim().charAt(0);
    const second = (profesor.apellidos || "").trim().charAt(0);
    return `${first}${second}`.toUpperCase() || "P";
}

export function renderProfesoresSection(state) {
    const stats = profesoresStats(state.profesores);
    const reajuste = calcularReajusteDocente(state);
    const reajusteByProfesor = new Map(reajuste.profesoresDetalle.map((item) => [item.profesor.id, item]));

    return `
        <div class="card teacher-panel">
            <div class="section-header teacher-header">
                <div>
                    <h2>Profesores</h2>
                    <p class="status">Define horas objetivo anuales por profesor y descuenta reducciones (cargos, coordinacion, gestion, etc.).</p>
                </div>
                <button id="save-profesores-btn" class="secondary" type="button">Guardar cambios</button>
            </div>

            <div class="teacher-summary">
                <div class="metric-box"><span>Total objetivo</span><strong>${stats.objetivo}</strong></div>
                <div class="metric-box"><span>Total reducciones</span><strong>${stats.reducciones}</strong></div>
                <div class="metric-box"><span>Total disponible</span><strong>${stats.disponibles}</strong></div>
            </div>

            <div class="table-shell">
                <table class="table teacher-table">
                    <thead>
                        <tr>
                            <th>Profesor</th>
                            <th>Objetivo</th>
                            <th>Reducciones</th>
                            <th>TFM</th>
                            <th>Capacidad reajuste</th>
                            <th>Horas reales</th>
                            <th>Reajuste</th>
                            <th>Ajustable</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.profesores.length === 0 ? `
                            <tr>
                                <td colspan="9" class="empty-cell">
                                    No hay profesores en este curso. Usa el bot&oacute;n + para crear el primero.
                                </td>
                            </tr>
                        ` : state.profesores.map((p, i) => {
                            const calc = reajusteByProfesor.get(p.id) || { objetivoReal: creditosDisponibles(p), reajuste: 0, esAjustable: p.docenciaAjustable !== false, cargaTfm: 0, capacidad: creditosDisponibles(p) };
                            return `
                            <tr class="${i === state.selectedProfesorIndex ? "row-active" : ""}">
                                <td>
                                    <div class="teacher-cell">
                                        <span class="avatar">${escapeHtml(profesorInitials(p))}</span>
                                        <span>
                                            <strong>${escapeHtml(p.nombreCompleto)}</strong>
                                            <small>${escapeHtml(p.id)}</small>
                                        </span>
                                    </div>
                                </td>
                                <td><span class="num-pill">${toPositiveNumber(p.creditosObjetivo, 0)}</span></td>
                                <td><span class="num-pill muted-pill">${totalReducciones(p)}</span></td>
                                <td><span class="num-pill ${calc.cargaTfm > 0 ? "danger-pill" : "muted-pill"}">${calc.cargaTfm}</span></td>
                                <td><span class="num-pill">${calc.capacidad}</span></td>
                                <td><span class="num-pill">${calc.objetivoReal}</span></td>
                                <td><span class="num-pill ${calc.reajuste < 0 ? "danger-pill" : "muted-pill"}">${calc.reajuste}</span></td>
                                <td><span class="badge ${calc.esAjustable ? "" : "muted-badge"}">${calc.esAjustable ? "Si" : "No"}</span></td>
                                <td class="table-actions">
                                    <button class="secondary mini" data-edit-prof="${i}">Editar</button>
                                    <button class="warn mini" data-remove-prof="${i}">Eliminar</button>
                                </td>
                            </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <button id="open-prof-modal-btn" class="fab" type="button" aria-label="Anadir profesor" title="Anadir profesor">+</button>
        ${state.isProfesorModalOpen ? renderProfesorModal(state) : ""}
    `;
}

function renderProfesorModal(state) {
    const draft = state.profesorDraft || emptyProfesorDraft();
    const reducciones = Array.isArray(draft.reducciones) ? draft.reducciones : [];
    const reduccionesTotal = totalReducciones({ reducciones });
    const disponibles = Number((toPositiveNumber(draft.creditosObjetivo, 0) - reduccionesTotal).toFixed(2));
    const isEdit = state.profesorModalMode === "edit";
    const title = isEdit ? "Editar profesor" : "Anadir profesor";
    const actionLabel = isEdit ? "Guardar profesor" : "Anadir profesor";

    return `
        <div class="modal-backdrop" id="prof-modal-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="prof-modal-title">
                <div class="modal-header">
                    <h2 id="prof-modal-title">${title}</h2>
                    <button class="secondary mini" id="close-prof-modal-btn" type="button">Cerrar</button>
                </div>
                <div class="grid">
                    <section class="form-section">
                        <div class="form-section-title">
                            <span class="section-kicker">Datos personales</span>
                            <h3>Identificaci&oacute;n del profesor</h3>
                        </div>
                        <div class="grid grid-2">
                        <label>
                            id
                            <input id="prof-new-id" placeholder="ej. jperez" value="${escapeHtml(draft.id || "")}" />
                        </label>
                        <label>
                            Nombre
                            <input id="prof-new-name" placeholder="Nombre" value="${escapeHtml(draft.nombre || "")}" />
                        </label>
                        <label>
                            Apellidos
                            <input id="prof-new-surname" placeholder="Apellidos" value="${escapeHtml(draft.apellidos || "")}" />
                        </label>
                        <label>
                            Horas objetivo anuales
                            <input id="prof-new-creditos" type="number" min="0" step="any" placeholder="0" value="${escapeHtml(draft.creditosObjetivo || "")}" />
                        </label>
                        <label class="checkbox-field">
                            <input id="prof-docencia-ajustable" type="checkbox" ${draft.docenciaAjustable !== false ? "checked" : ""} />
                            Reajustar docencia proporcionalmente
                        </label>
                        </div>
                    </section>

                    <section class="form-section">
                        <div class="form-section-title">
                            <span class="section-kicker">Ajustes de carga</span>
                            <h3>Reducciones acumulables</h3>
                        </div>
                        <div class="inline-form-red">
                            ${renderReduccionTipoSelect("new-red-tipo")}
                            <input id="new-red-tipo-manual" class="is-hidden" placeholder="Motivo manual" />
                            <input id="new-red-creditos" type="number" min="0" step="any" placeholder="Horas" />
                            <input id="new-red-desc" placeholder="Descripcion" />
                            <button id="add-new-reduccion-btn" class="secondary" type="button">Anadir</button>
                        </div>

                        <table class="table" style="margin-top:12px">
                            <thead>
                                <tr><th>Tipo</th><th>Horas</th><th>Descripcion</th><th></th></tr>
                            </thead>
                            <tbody>
                                ${reducciones.length === 0 ? `
                                    <tr><td colspan="4" class="empty-cell">Sin reducciones para este profesor.</td></tr>
                                ` : reducciones.map((r, idx) => `
                                    <tr>
                                        <td>${escapeHtml(r.tipo || "")}</td>
                                        <td>${toPositiveNumber(r.creditos, 0)}</td>
                                        <td>${escapeHtml(r.descripcion || "")}</td>
                                        <td><button class="warn mini" data-remove-new-red="${idx}" type="button">Eliminar</button></td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </section>

                    <button id="add-prof-btn" type="button">${actionLabel}</button>

                    ${isEdit ? `
                        <div class="grid grid-3 compact-stats">
                            <div class="metric-box"><span>Reducciones</span><strong>${reduccionesTotal}</strong></div>
                            <div class="metric-box"><span>Disponible</span><strong>${disponibles}</strong></div>
                            <div class="metric-box"><span>Conceptos</span><strong>${reducciones.length}</strong></div>
                        </div>
                    ` : ""}
                </div>
            </section>
        </div>
    `;
}

export function bindProfesoresEvents({ app, state, setStatus, render, saveProfesores }) {
    bindManualReduccionToggle("new-red-tipo", "new-red-tipo-manual");

    const openProfModalBtn = document.getElementById("open-prof-modal-btn");
    if (openProfModalBtn) {
        openProfModalBtn.onclick = () => {
            state.profesorModalMode = "create";
            state.editingProfesorIndex = -1;
            state.profesorDraft = emptyProfesorDraft();
            state.isProfesorModalOpen = true;
            render();
        };
    }

    const closeProfModalBtn = document.getElementById("close-prof-modal-btn");
    if (closeProfModalBtn) {
        closeProfModalBtn.onclick = () => {
            closeProfesorModal(state);
            render();
        };
    }

    const profModalBackdrop = document.getElementById("prof-modal-backdrop");
    if (profModalBackdrop) {
        profModalBackdrop.onclick = (e) => {
            if (e.target === profModalBackdrop) {
                closeProfesorModal(state);
                render();
            }
        };
    }

    const addNewRedBtn = document.getElementById("add-new-reduccion-btn");
    if (addNewRedBtn) {
        addNewRedBtn.onclick = () => {
            updateProfesorDraftFromModal(state);
            const tipo = readReduccionTipo("new-red-tipo", "new-red-tipo-manual");
            const creditos = toPositiveNumber(document.getElementById("new-red-creditos")?.value || "0", 0);
            const descripcion = (document.getElementById("new-red-desc")?.value || "").trim();

            if (!tipo) {
                setStatus("Selecciona un motivo o escribe una reduccion manual.");
                return;
            }
            if (creditos <= 0) {
                setStatus("La reduccion debe tener horas mayores que 0.");
                return;
            }

            state.profesorDraft.reducciones.push(normalizeReduccion({ tipo, creditos, descripcion }));
            setStatus("Reduccion anadida al nuevo profesor.");
            render();
        };
    }

    app.querySelectorAll("[data-remove-new-red]").forEach((btn) => {
        btn.onclick = () => {
            updateProfesorDraftFromModal(state);
            const idx = Number(btn.dataset.removeNewRed);
            state.profesorDraft.reducciones.splice(idx, 1);
            setStatus("Reduccion eliminada del nuevo profesor.");
            render();
        };
    });

    const addProfBtn = document.getElementById("add-prof-btn");
    if (addProfBtn) {
        addProfBtn.onclick = async () => {
            updateProfesorDraftFromModal(state);
            const id = state.profesorDraft.id;
            const nombre = state.profesorDraft.nombre;
            const apellidos = state.profesorDraft.apellidos;
            const nombreCompleto = [nombre, apellidos].filter(Boolean).join(" ");
            const creditosObjetivo = toPositiveNumber(state.profesorDraft.creditosObjetivo || "0", 0);
            const reducciones = state.profesorDraft.reducciones || [];
            const docenciaAjustable = state.profesorDraft.docenciaAjustable !== false;
            const isEdit = state.profesorModalMode === "edit";
            const editIndex = state.editingProfesorIndex;

            if (!id || !nombre || !apellidos) {
                setStatus("Completa id, nombre y apellidos del profesor.");
                return;
            }
            if (state.profesores.some((p, i) => p.id === id && (!isEdit || i !== editIndex))) {
                setStatus("Ese id de profesor ya existe.");
                return;
            }

            const nextProfesor = normalizeProfesor({ id, nombre, apellidos, nombreCompleto, creditosObjetivo, docenciaAjustable, reducciones });
            if (isEdit && state.profesores[editIndex]) {
                state.profesores[editIndex] = nextProfesor;
                state.selectedProfesorIndex = editIndex;
            } else {
                state.profesores.push(nextProfesor);
                state.selectedProfesorIndex = state.profesores.length - 1;
            }

            closeProfesorModal(state);
            await saveProfesores();
        };
    }

    app.querySelectorAll("[data-edit-prof]").forEach((btn) => {
        btn.onclick = () => {
            const idx = Number(btn.dataset.editProf);
            const profesor = state.profesores[idx];
            if (!profesor) {
                return;
            }
            state.selectedProfesorIndex = idx;
            state.profesorModalMode = "edit";
            state.editingProfesorIndex = idx;
            state.profesorDraft = draftFromProfesor(profesor);
            state.isProfesorModalOpen = true;
            render();
        };
    });

    app.querySelectorAll("[data-remove-prof]").forEach((btn) => {
        btn.onclick = async () => {
            const idx = Number(btn.dataset.removeProf);
            state.profesores.splice(idx, 1);
            if (state.selectedProfesorIndex >= state.profesores.length) {
                state.selectedProfesorIndex = state.profesores.length - 1;
            }
            closeProfesorModal(state);
            await saveProfesores();
        };
    });

    const saveBtn = document.getElementById("save-profesores-btn");
    if (saveBtn) {
        saveBtn.onclick = saveProfesores;
    }
}
