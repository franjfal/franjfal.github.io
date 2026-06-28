import { escapeHtml, toPositiveNumber, uid } from "./utils.js";

export const TRABAJO_TIPOS = [
    { value: "tfg", label: "TFG" },
    { value: "tfm", label: "TFM" },
    { value: "practicas", label: "Practicas de empresa" },
];

function tipoLabel(value) {
    return TRABAJO_TIPOS.find((t) => t.value === value)?.label || "TFG";
}

function normalizeTipo(value) {
    return TRABAJO_TIPOS.some((t) => t.value === value) ? value : "tfg";
}

function normalizeAsignaciones(raw) {
    const out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return out;
    }
    Object.entries(raw).forEach(([profesorId, value]) => {
        const count = toPositiveNumber(value, 0);
        if (count > 0) {
            out[profesorId] = count;
        }
    });
    return out;
}

export function normalizeTrabajo(raw) {
    return {
        id: (raw?.id || uid("trabajo")).trim(),
        tipo: normalizeTipo(raw?.tipo || "tfg"),
        titulo: (raw?.titulo || "").trim(),
        totalTrabajos: toPositiveNumber(raw?.totalTrabajos, 0),
        peso: toPositiveNumber(raw?.peso, 0),
        asignaciones: normalizeAsignaciones(raw?.asignaciones),
    };
}

export function hydrateTrabajos(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    return list.map(normalizeTrabajo);
}

function emptyTrabajoDraft(tipo = "tfg") {
    return {
        id: "",
        tipo,
        titulo: "",
        totalTrabajos: "",
        peso: "",
        asignaciones: {},
    };
}

function draftFromTrabajo(trabajo) {
    return {
        id: trabajo.id || "",
        tipo: normalizeTipo(trabajo.tipo || "tfg"),
        titulo: trabajo.titulo || "",
        totalTrabajos: String(toPositiveNumber(trabajo.totalTrabajos, 0)),
        peso: String(toPositiveNumber(trabajo.peso, 0)),
        asignaciones: normalizeAsignaciones(trabajo.asignaciones),
    };
}

function closeTrabajoModal(state) {
    state.isTrabajoModalOpen = false;
    state.trabajoModalMode = "create";
    state.editingTrabajoIndex = -1;
    state.trabajoDraft = emptyTrabajoDraft(state.trabajosTab);
}

function updateTrabajoDraftFromModal(state) {
    const previousAsignaciones = normalizeAsignaciones(state.trabajoDraft?.asignaciones);
    state.trabajoDraft = {
        id: (document.getElementById("trabajo-id")?.value || "").trim(),
        tipo: normalizeTipo(document.getElementById("trabajo-tipo")?.value || state.trabajosTab),
        titulo: (document.getElementById("trabajo-titulo")?.value || "").trim(),
        totalTrabajos: document.getElementById("trabajo-total")?.value || "",
        peso: document.getElementById("trabajo-peso")?.value || "",
        asignaciones: previousAsignaciones,
    };
}

function assignedCount(trabajo) {
    return Object.values(trabajo.asignaciones || {}).reduce((sum, value) => sum + toPositiveNumber(value, 0), 0);
}

function trabajoCarga(trabajo) {
    return Number((assignedCount(trabajo) * toPositiveNumber(trabajo.peso, 0)).toFixed(2));
}

function profesorName(profesores, profesorId) {
    return profesores.find((p) => p.id === profesorId)?.nombreCompleto || profesorId;
}

function profesoresAsignados(trabajo, profesores) {
    return Object.entries(trabajo.asignaciones || {})
        .filter(([, count]) => toPositiveNumber(count, 0) > 0)
        .map(([profesorId, count]) => ({
            profesorId,
            nombre: profesorName(profesores, profesorId),
            count: toPositiveNumber(count, 0),
        }));
}

function totalsForType(state, tipo) {
    const items = state.trabajos.filter((t) => t.tipo === tipo);
    return {
        items: items.length,
        totalTrabajos: items.reduce((sum, item) => sum + toPositiveNumber(item.totalTrabajos, 0), 0),
        carga: Number(items.reduce((sum, item) => sum + trabajoCarga(item), 0).toFixed(2)),
    };
}

export function renderTrabajosSection(state) {
    const activeType = normalizeTipo(state.trabajosTab || "tfg");
    const activeItems = state.trabajos.filter((t) => t.tipo === activeType);
    const totals = totalsForType(state, activeType);

    return `
        <div class="card subject-panel">
            <div class="section-header subject-header">
                <div>
                    <h2>TFG, TFM y practicas</h2>
                    <p class="status">Gestiona trabajos especiales y su carga docente por profesor.</p>
                </div>
                <button id="save-trabajos-btn" class="secondary" type="button">Guardar cambios</button>
            </div>

            <div class="nav-tabs embedded-tabs">
                ${TRABAJO_TIPOS.map((tipo) => `
                    <button class="tab ${activeType === tipo.value ? "active" : ""}" data-trabajo-tab="${tipo.value}" type="button">${tipo.label}</button>
                `).join("")}
            </div>

            <div class="teacher-summary">
                <div class="metric-box"><span>Elementos</span><strong>${totals.items}</strong></div>
                <div class="metric-box"><span>Trabajos previstos</span><strong>${totals.totalTrabajos}</strong></div>
                <div class="metric-box"><span>Carga asignada</span><strong>${totals.carga}</strong></div>
            </div>

            <div class="table-shell">
                <table class="table teacher-table">
                    <thead>
                        <tr><th>Elemento</th><th>Trabajos</th><th>Peso</th><th>Carga</th><th>Profesores asignados</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${activeItems.length === 0 ? `
                            <tr><td colspan="6" class="empty-cell">No hay elementos en ${tipoLabel(activeType)}.</td></tr>
                        ` : activeItems.map((item) => {
                            const idx = state.trabajos.indexOf(item);
                            const assigned = profesoresAsignados(item, state.profesores);
                            return `
                                <tr>
                                    <td>
                                        <strong>${escapeHtml(item.titulo)}</strong>
                                        <small class="muted-line">${escapeHtml(item.id)}</small>
                                    </td>
                                    <td><span class="num-pill muted-pill">${assignedCount(item)} / ${toPositiveNumber(item.totalTrabajos, 0)}</span></td>
                                    <td><span class="subject-code">${toPositiveNumber(item.peso, 0)}</span></td>
                                    <td><span class="num-pill">${trabajoCarga(item)}</span></td>
                                    <td>
                                        ${assigned.length === 0
                                            ? `<span class="empty-cell">Sin profesores asignados</span>`
                                            : assigned.map((a) => `<span class="badge">${escapeHtml(a.nombre)}: ${a.count}</span>`).join(" ")}
                                    </td>
                                    <td class="table-actions">
                                        <button class="secondary mini" data-edit-trabajo="${idx}" type="button">Editar</button>
                                        <button class="warn mini" data-remove-trabajo="${idx}" type="button">Eliminar</button>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <button id="open-trabajo-modal-btn" class="fab" type="button" aria-label="Anadir elemento" title="Anadir elemento">+</button>
        ${state.isTrabajoModalOpen ? renderTrabajoModal(state) : ""}
    `;
}

function renderTrabajoModal(state) {
    const draft = state.trabajoDraft || emptyTrabajoDraft(state.trabajosTab);
    const isEdit = state.trabajoModalMode === "edit";
    const title = isEdit ? `Editar ${tipoLabel(draft.tipo)}` : `Anadir ${tipoLabel(state.trabajosTab)}`;
    const actionLabel = isEdit ? "Guardar elemento" : "Anadir elemento";
    const asignaciones = normalizeAsignaciones(draft.asignaciones);
    const totalAsignado = Object.values(asignaciones).reduce((sum, value) => sum + toPositiveNumber(value, 0), 0);
    const peso = toPositiveNumber(draft.peso, 0);

    return `
        <div class="modal-backdrop" id="trabajo-modal-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="trabajo-modal-title">
                <div class="modal-header">
                    <h2 id="trabajo-modal-title">${title}</h2>
                    <button class="secondary mini" id="close-trabajo-modal-btn" type="button">Cerrar</button>
                </div>
                <div class="grid">
                    <section class="form-section">
                        <div class="form-section-title">
                            <span class="section-kicker">Elemento</span>
                            <h3>Datos generales</h3>
                        </div>
                        <div class="grid grid-2">
                            <label>
                                Tipo
                                <select id="trabajo-tipo">
                                    ${TRABAJO_TIPOS.map((tipo) => `<option value="${tipo.value}" ${tipo.value === draft.tipo ? "selected" : ""}>${tipo.label}</option>`).join("")}
                                </select>
                            </label>
                            <label>
                                id
                                <input id="trabajo-id" placeholder="ej. tfg-ade-2026" value="${escapeHtml(draft.id || "")}" />
                            </label>
                            <label>
                                Titulo
                                <input id="trabajo-titulo" placeholder="Titulo del bloque" value="${escapeHtml(draft.titulo || "")}" />
                            </label>
                            <label>
                                Cantidad de trabajos
                                <input id="trabajo-total" type="number" min="0" step="1" value="${escapeHtml(draft.totalTrabajos || "")}" />
                            </label>
                            <label>
                                Peso por trabajo
                                <input id="trabajo-peso" type="number" min="0" step="any" value="${escapeHtml(draft.peso || "")}" />
                            </label>
                        </div>
                    </section>

                    <section class="form-section">
                        <div class="form-section-title">
                            <span class="section-kicker">Asignacion</span>
                            <h3>Trabajos por profesor</h3>
                        </div>
                        <div class="table-shell compact-table">
                            <table class="table teacher-table">
                                <thead>
                                    <tr><th>Profesor</th><th>Trabajos</th><th>Carga</th></tr>
                                </thead>
                                <tbody>
                                    ${state.profesores.length === 0 ? `
                                        <tr><td colspan="3" class="empty-cell">No hay profesores cargados en este curso.</td></tr>
                                    ` : state.profesores.map((profesor) => {
                                        const count = toPositiveNumber(asignaciones[profesor.id], 0);
                                        return `
                                            <tr>
                                                <td>
                                                    <strong>${escapeHtml(profesor.nombreCompleto)}</strong>
                                                    <small class="muted-line">${escapeHtml(profesor.id)}</small>
                                                </td>
                                                <td><input class="assignment-input" data-prof-trabajos="${escapeHtml(profesor.id)}" type="number" min="0" step="1" value="${count || ""}" /></td>
                                                <td><span class="num-pill muted-pill">${Number((count * peso).toFixed(2))}</span></td>
                                            </tr>
                                        `;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div class="grid grid-3 compact-stats">
                        <div class="metric-box"><span>Asignados</span><strong>${totalAsignado}</strong></div>
                        <div class="metric-box"><span>Disponibles</span><strong>${Math.max(0, toPositiveNumber(draft.totalTrabajos, 0) - totalAsignado)}</strong></div>
                        <div class="metric-box"><span>Carga</span><strong>${Number((totalAsignado * peso).toFixed(2))}</strong></div>
                    </div>

                    <button id="apply-trabajo-btn" type="button">${actionLabel}</button>
                </div>
            </section>
        </div>
    `;
}

function readAsignacionesFromModal() {
    const out = {};
    document.querySelectorAll("[data-prof-trabajos]").forEach((input) => {
        const count = toPositiveNumber(input.value || "0", 0);
        if (count > 0) {
            out[input.dataset.profTrabajos] = count;
        }
    });
    return out;
}

function updateTrabajoDraftFromInputs(state) {
    state.trabajoDraft = {
        id: (document.getElementById("trabajo-id")?.value || "").trim(),
        tipo: normalizeTipo(document.getElementById("trabajo-tipo")?.value || state.trabajosTab),
        titulo: (document.getElementById("trabajo-titulo")?.value || "").trim(),
        totalTrabajos: document.getElementById("trabajo-total")?.value || "",
        peso: document.getElementById("trabajo-peso")?.value || "",
        asignaciones: readAsignacionesFromModal(),
    };
}

export function bindTrabajosEvents({ app, state, setStatus, render, saveTrabajos }) {
    app.querySelectorAll("[data-trabajo-tab]").forEach((btn) => {
        btn.onclick = () => {
            state.trabajosTab = normalizeTipo(btn.dataset.trabajoTab);
            render();
        };
    });

    const openBtn = document.getElementById("open-trabajo-modal-btn");
    if (openBtn) {
        openBtn.onclick = () => {
            state.trabajoModalMode = "create";
            state.editingTrabajoIndex = -1;
            state.trabajoDraft = emptyTrabajoDraft(state.trabajosTab);
            state.isTrabajoModalOpen = true;
            render();
        };
    }

    const closeBtn = document.getElementById("close-trabajo-modal-btn");
    if (closeBtn) {
        closeBtn.onclick = () => {
            closeTrabajoModal(state);
            render();
        };
    }

    const backdrop = document.getElementById("trabajo-modal-backdrop");
    if (backdrop) {
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                closeTrabajoModal(state);
                render();
            }
        };
    }

    document.querySelectorAll(".assignment-input, #trabajo-peso, #trabajo-total").forEach((input) => {
        input.onchange = () => {
            updateTrabajoDraftFromInputs(state);
            render();
        };
    });

    const tipoSelect = document.getElementById("trabajo-tipo");
    if (tipoSelect) {
        tipoSelect.onchange = () => {
            updateTrabajoDraftFromInputs(state);
            render();
        };
    }

    const applyBtn = document.getElementById("apply-trabajo-btn");
    if (applyBtn) {
        applyBtn.onclick = async () => {
            updateTrabajoDraftFromInputs(state);
            const draft = state.trabajoDraft;
            const totalTrabajos = toPositiveNumber(draft.totalTrabajos, 0);
            const peso = toPositiveNumber(draft.peso, 0);
            const totalAsignado = Object.values(draft.asignaciones || {}).reduce((sum, value) => sum + toPositiveNumber(value, 0), 0);
            const isEdit = state.trabajoModalMode === "edit";
            const editIndex = state.editingTrabajoIndex;

            if (!draft.id || !draft.titulo || totalTrabajos <= 0 || peso <= 0) {
                setStatus("Completa id, titulo, cantidad de trabajos y peso.");
                return;
            }
            if (totalAsignado > totalTrabajos) {
                setStatus("La asignacion supera la cantidad de trabajos del elemento.");
                return;
            }
            if (state.trabajos.some((item, i) => item.id === draft.id && (!isEdit || i !== editIndex))) {
                setStatus("Ese id de elemento ya existe.");
                return;
            }

            const next = normalizeTrabajo({
                id: draft.id,
                tipo: draft.tipo,
                titulo: draft.titulo,
                totalTrabajos,
                peso,
                asignaciones: draft.asignaciones,
            });

            if (isEdit && state.trabajos[editIndex]) {
                state.trabajos[editIndex] = next;
            } else {
                state.trabajos.push(next);
            }
            state.trabajosTab = next.tipo;
            closeTrabajoModal(state);
            await saveTrabajos();
        };
    }

    app.querySelectorAll("[data-edit-trabajo]").forEach((btn) => {
        btn.onclick = () => {
            const idx = Number(btn.dataset.editTrabajo);
            const trabajo = state.trabajos[idx];
            if (!trabajo) {
                return;
            }
            state.trabajoModalMode = "edit";
            state.editingTrabajoIndex = idx;
            state.trabajoDraft = draftFromTrabajo(trabajo);
            state.isTrabajoModalOpen = true;
            render();
        };
    });

    app.querySelectorAll("[data-remove-trabajo]").forEach((btn) => {
        btn.onclick = async () => {
            const idx = Number(btn.dataset.removeTrabajo);
            state.trabajos.splice(idx, 1);
            closeTrabajoModal(state);
            await saveTrabajos();
        };
    });

    const saveBtn = document.getElementById("save-trabajos-btn");
    if (saveBtn) {
        saveBtn.onclick = saveTrabajos;
    }
}
