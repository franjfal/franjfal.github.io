import { escapeHtml, toPositiveNumber, uid } from "./utils.js";
import { calcularReajusteDocente } from "./reajuste.js";

function normalizeDocenciaItem(raw) {
    return {
        id: String(raw?.id || uid("doc")).trim(),
        asignaturaId: String(raw?.asignaturaId || "").trim(),
        subgrupoId: String(raw?.subgrupoId || "").trim(),
        profesorId: String(raw?.profesorId || "").trim(),
        creditos: toPositiveNumber(raw?.creditos, 0),
    };
}

export function hydrateDocencia(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    return list.map(normalizeDocenciaItem).filter((item) => item.asignaturaId && item.subgrupoId && item.profesorId);
}

export function cleanDocenciaForState(state) {
    const profesorIds = new Set(state.profesores.map((profesor) => profesor.id));
    const subgruposByAsignatura = new Map(state.asignaturas.map((asignatura) => [
        asignatura.id,
        new Set((asignatura.subgrupos || []).map((subgrupo) => subgrupo.id)),
    ]));

    return hydrateDocencia(state.docencia).filter((item) => (
        profesorIds.has(item.profesorId)
        && subgruposByAsignatura.has(item.asignaturaId)
        && subgruposByAsignatura.get(item.asignaturaId).has(item.subgrupoId)
    ));
}

function subjectTotalCredits(asignatura) {
    return Number((asignatura?.subgrupos || []).reduce((sum, subgrupo) => sum + toPositiveNumber(subgrupo.creditos, 0), 0).toFixed(2));
}

function assignmentCredits(items) {
    return Number((items || []).reduce((sum, item) => sum + toPositiveNumber(item.creditos, 0), 0).toFixed(2));
}

function assignmentsForSubgroup(state, asignaturaId, subgrupoId) {
    return state.docencia.filter((item) => item.asignaturaId === asignaturaId && item.subgrupoId === subgrupoId);
}

function assignedCreditsForSubgroup(state, asignaturaId, subgrupoId, exceptId = "") {
    return assignmentCredits(assignmentsForSubgroup(state, asignaturaId, subgrupoId).filter((item) => item.id !== exceptId));
}

function remainingCreditsForSubgroup(state, asignatura, subgrupo, exceptId = "") {
    const total = toPositiveNumber(subgrupo.creditos, 0);
    return Number(Math.max(0, total - assignedCreditsForSubgroup(state, asignatura.id, subgrupo.id, exceptId)).toFixed(2));
}

function subgrupoStatus(state, asignatura, subgrupo) {
    const total = toPositiveNumber(subgrupo.creditos, 0);
    const assigned = assignedCreditsForSubgroup(state, asignatura.id, subgrupo.id);
    const remaining = Number(Math.max(0, total - assigned).toFixed(2));
    return {
        total,
        assigned,
        remaining,
        complete: total > 0 && remaining <= 0,
    };
}

function asignaturaStatus(state, asignatura) {
    const total = subjectTotalCredits(asignatura);
    const assigned = Number((asignatura.subgrupos || []).reduce((sum, subgrupo) => {
        const subTotal = toPositiveNumber(subgrupo.creditos, 0);
        const subAssigned = assignedCreditsForSubgroup(state, asignatura.id, subgrupo.id);
        return sum + Math.min(subTotal, subAssigned);
    }, 0).toFixed(2));
    return {
        total,
        assigned,
        remaining: Number(Math.max(0, total - assigned).toFixed(2)),
        complete: total > 0 && assigned >= total,
    };
}

function categoriaById(state, categoriaId) {
    return state.categoriasAsignaturas.find((categoria) => categoria.id === categoriaId) || null;
}

function categoriaLabel(state, categoriaId) {
    return categoriaById(state, categoriaId)?.nombre || "Sin titulacion / grado / facultad";
}

function sortedCategoriasForDocencia(state) {
    const known = [...state.categoriasAsignaturas].sort((a, b) => String(a.nombre || a.id).localeCompare(String(b.nombre || b.id), "es", { sensitivity: "base" }));
    const hasUncategorized = state.asignaturas.some((asignatura) => !categoriaById(state, asignatura.categoriaId));
    return hasUncategorized ? [...known, { id: "__uncategorized__", nombre: "Sin titulacion / grado / facultad" }] : known;
}

function matchesDocenciaCategoria(state, asignatura) {
    const selected = state.docenciaFilterCategoria || "";
    if (!selected) {
        return true;
    }
    if (selected === "__uncategorized__") {
        return !categoriaById(state, asignatura.categoriaId);
    }
    return asignatura.categoriaId === selected;
}

function visibleAsignaturasForDocencia(state) {
    return state.asignaturas
        .filter((asignatura) => matchesDocenciaCategoria(state, asignatura))
        .filter((asignatura) => !state.docenciaShowPendingOnly || asignaturaStatus(state, asignatura).remaining > 0)
        .sort((a, b) => {
            const categoryCompare = categoriaLabel(state, a.categoriaId).localeCompare(categoriaLabel(state, b.categoriaId), "es", { sensitivity: "base" });
            if (categoryCompare !== 0) {
                return categoryCompare;
            }
            return String(a.nombre || a.id).localeCompare(String(b.nombre || b.id), "es", { numeric: true, sensitivity: "base" });
        });
}

function selectedAsignatura(state, candidates = state.asignaturas) {
    if (state.selectedDocenciaAsignaturaId) {
        const found = candidates.find((asignatura) => asignatura.id === state.selectedDocenciaAsignaturaId);
        if (found) {
            return found;
        }
    }
    return candidates[0] || null;
}

function profesorName(state, profesorId) {
    return state.profesores.find((profesor) => profesor.id === profesorId)?.nombreCompleto || profesorId;
}

const DAY_INDEX = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
    dilluns: 1,
    dimarts: 2,
    dimecres: 3,
    dijous: 4,
    divendres: 5,
    dissabte: 6,
    diumenge: 0,
};

function parseDateDMY(value) {
    const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
}

function toIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sessionDate(sesion) {
    const start = parseDateDMY(sesion.franjaInicio);
    const end = parseDateDMY(sesion.franjaFin) || start;
    const target = DAY_INDEX[String(sesion.dia || "").trim().toLowerCase()];
    if (!start || target === undefined) return null;
    const cursor = new Date(start);
    for (let i = 0; i <= 7; i += 1) {
        if (cursor.getDay() === target && (!end || cursor <= end)) return toIsoDate(cursor);
        cursor.setDate(cursor.getDate() + 1);
    }
    return toIsoDate(start);
}

function timeToMinutes(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function minutesLabel(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatIsoDateEs(isoDate) {
    const [year, month, day] = String(isoDate || "").split("-").map(Number);
    return year ? new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day)) : isoDate;
}

function assignmentCalendarItems(state, assignment) {
    const asignatura = state.asignaturas.find((item) => item.id === assignment.asignaturaId);
    const subgrupo = asignatura?.subgrupos?.find((item) => item.id === assignment.subgrupoId);
    if (!asignatura || !subgrupo) return [];
    const sesiones = Array.isArray(subgrupo.sesiones) ? subgrupo.sesiones : [];
    return sesiones.map((sesion, index) => {
        const date = sessionDate(sesion);
        const startMinutes = timeToMinutes(sesion.horaInicio);
        const endMinutes = timeToMinutes(sesion.horaFin);
        if (!date || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
            return null;
        }
        return {
            assignment,
            asignatura,
            subgrupo,
            sesion,
            index,
            date,
            startMinutes,
            endMinutes,
            label: `${asignatura.nombre || asignatura.id} · ${subgrupo.nombre || subgrupo.id}`,
        };
    }).filter(Boolean);
}

function findDocenciaOverlaps(state, nextAssignment, exceptId = "") {
    const nextItems = assignmentCalendarItems(state, nextAssignment);
    if (nextItems.length === 0) return [];
    const existingAssignments = state.docencia.filter((item) => (
        item.profesorId === nextAssignment.profesorId
        && item.id !== exceptId
    ));
    const existingItems = existingAssignments.flatMap((item) => assignmentCalendarItems(state, item));
    const overlaps = [];
    nextItems.forEach((nextItem) => {
        existingItems.forEach((existingItem) => {
            if (nextItem.date !== existingItem.date) return;
            if (nextItem.startMinutes < existingItem.endMinutes && existingItem.startMinutes < nextItem.endMinutes) {
                overlaps.push({
                    date: nextItem.date,
                    start: Math.max(nextItem.startMinutes, existingItem.startMinutes),
                    end: Math.min(nextItem.endMinutes, existingItem.endMinutes),
                    next: nextItem,
                    existing: existingItem,
                });
            }
        });
    });
    return overlaps;
}

function renderProfesorOptions(state, selectedId = "") {
    return `
        <option value="">Selecciona profesor</option>
        ${state.profesores.map((profesor) => `
            <option value="${escapeHtml(profesor.id)}" ${profesor.id === selectedId ? "selected" : ""}>
                ${escapeHtml(profesor.nombreCompleto || profesor.id)}
            </option>
        `).join("")}
    `;
}

function renderDocenciaCategoryOptions(state) {
    return `
        <option value="">Todas las titulaciones / grados / facultades</option>
        ${sortedCategoriasForDocencia(state).map((categoria) => {
        const value = categoria.id;
        const count = state.asignaturas.filter((asignatura) => (
            value === "__uncategorized__"
                ? !categoriaById(state, asignatura.categoriaId)
                : asignatura.categoriaId === value
        )).length;
        return `
            <option value="${escapeHtml(value)}" ${state.docenciaFilterCategoria === value ? "selected" : ""}>
                ${escapeHtml(categoria.nombre)} (${count})
            </option>
        `;
    }).join("")}
    `;
}

function renderDocenciaNavigator(state, asignaturas, selectedId) {
    const categories = sortedCategoriasForDocencia(state)
        .map((categoria) => {
            const subjects = asignaturas.filter((asignatura) => (
                categoria.id === "__uncategorized__"
                    ? !categoriaById(state, asignatura.categoriaId)
                    : asignatura.categoriaId === categoria.id
            ));
            return { categoria, subjects };
        })
        .filter((group) => group.subjects.length > 0);

    if (categories.length === 0) {
        return `<div class="empty-state-block">No hay asignaturas que coincidan con este filtro.</div>`;
    }

    return `
        <div class="allocation-navigator">
            ${categories.map(({ categoria, subjects }) => {
        const categoryStatus = subjects.reduce((acc, asignatura) => {
            const status = asignaturaStatus(state, asignatura);
            return {
                total: Number((acc.total + status.total).toFixed(2)),
                remaining: Number((acc.remaining + status.remaining).toFixed(2)),
            };
        }, { total: 0, remaining: 0 });
        return `
                <section class="allocation-category-group">
                    <div class="allocation-category-title">
                        <strong>${escapeHtml(categoria.nombre)}</strong>
                        <span>${categoryStatus.remaining} pendientes</span>
                    </div>
                    <div class="allocation-subject-list">
                        ${subjects.map((asignatura) => {
            const status = asignaturaStatus(state, asignatura);
            const active = asignatura.id === selectedId;
            return `
                            <button class="allocation-subject-card ${active ? "active" : ""} ${status.complete ? "complete" : ""}" data-docencia-select-asignatura="${escapeHtml(asignatura.id)}" type="button">
                                <span>
                                    <strong>${escapeHtml(asignatura.nombre || asignatura.id)}</strong>
                                    <small>${escapeHtml(asignatura.codigoReferencia || asignatura.id || "")}</small>
                                </span>
                                <span class="allocation-subject-progress">
                                    <b>${status.assigned} / ${status.total}</b>
                                    <small>${status.remaining > 0 ? `${status.remaining} pendientes` : "Completa"}</small>
                                </span>
                            </button>
                        `;
        }).join("")}
                    </div>
                </section>
            `;
    }).join("")}
        </div>
    `;
}

function renderAssignmentForm(state, asignatura, subgrupo, editingItem = null) {
    const maxCredits = remainingCreditsForSubgroup(state, asignatura, subgrupo, editingItem?.id || "");
    const defaultCredits = editingItem ? toPositiveNumber(editingItem.creditos, 0) : remainingCreditsForSubgroup(state, asignatura, subgrupo);
    const actionLabel = editingItem ? "Guardar" : "Asignar";

    return `
        <div class="allocation-form" data-docencia-form="${escapeHtml(subgrupo.id)}">
            <select data-docencia-profesor="${escapeHtml(subgrupo.id)}">
                ${renderProfesorOptions(state, editingItem?.profesorId || "")}
            </select>
            <input data-docencia-creditos="${escapeHtml(subgrupo.id)}" type="number" min="0" max="${maxCredits}" step="any" value="${defaultCredits || ""}" placeholder="Horas" />
            <button class="secondary" data-apply-docencia="${escapeHtml(subgrupo.id)}" type="button">${actionLabel}</button>
            ${editingItem ? `<button class="secondary" data-cancel-docencia-edit type="button">Cancelar</button>` : ""}
        </div>
    `;
}

function renderSubgrupoAllocation(state, asignatura, subgrupo) {
    const items = assignmentsForSubgroup(state, asignatura.id, subgrupo.id);
    const assigned = assignmentCredits(items);
    const total = toPositiveNumber(subgrupo.creditos, 0);
    const remaining = Number(Math.max(0, total - assigned).toFixed(2));
    const isComplete = total > 0 && remaining <= 0;
    const editingItem = items.find((item) => item.id === state.editingDocenciaId) || null;
    const canAdd = state.profesores.length > 0 && total > 0 && (remaining > 0 || editingItem);

    return `
        <section class="allocation-subgroup ${isComplete ? "allocation-complete" : ""}">
            <div class="allocation-subgroup-header">
                <div>
                    <h3>${escapeHtml(subgrupo.nombre || subgrupo.id)}</h3>
                    <p class="status">${escapeHtml(subgrupo.id)} &middot; ${escapeHtml(subgrupo.tipo || "subgrupo")}</p>
                </div>
                <div class="allocation-progress">
                    <strong>${assigned} / ${total}</strong>
                    <span>${remaining > 0 ? `${remaining} pendientes` : "Completo"}</span>
                </div>
            </div>

            <div class="allocation-meter" aria-hidden="true">
                <span style="width:${total > 0 ? Math.min(100, (assigned / total) * 100) : 0}%"></span>
            </div>

            <div class="table-shell compact-table">
                <table class="table teacher-table">
                    <thead>
                        <tr><th>Profesor</th><th>Horas</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${items.length === 0 ? `
                            <tr><td colspan="3" class="empty-cell">Sin profesores asignados.</td></tr>
                        ` : items.map((item) => `
                            <tr class="${item.id === state.editingDocenciaId ? "row-active" : ""}">
                                <td>
                                    <strong>${escapeHtml(profesorName(state, item.profesorId))}</strong>
                                    <small class="muted-line">${escapeHtml(item.profesorId)}</small>
                                </td>
                                <td><span class="num-pill">${toPositiveNumber(item.creditos, 0)}</span></td>
                                <td class="table-actions">
                                    <button class="secondary mini" data-edit-docencia="${escapeHtml(item.id)}" type="button">Editar</button>
                                    <button class="warn mini" data-remove-docencia="${escapeHtml(item.id)}" type="button">Eliminar</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            ${canAdd ? renderAssignmentForm(state, asignatura, subgrupo, editingItem) : `
                <p class="allocation-locked">${state.profesores.length === 0
                    ? "Crea profesores antes de repartir horas."
                    : total <= 0
                        ? "Este subgrupo no tiene horas para repartir."
                        : "Subgrupo completamente repartido. Edita o elimina una asignacion para cambiarlo."}</p>
            `}
        </section>
    `;
}

function renderProfesorLoad(state) {
    const reajuste = calcularReajusteDocente(state);
    const byProfesor = new Map(reajuste.profesoresDetalle.map((item) => [item.profesor.id, item]));

    return `
        <div class="table-shell allocation-load-table">
            <table class="table teacher-table">
                <thead>
                    <tr><th>Profesor</th><th>Asignadas</th><th>Objetivo real</th><th>Diferencia</th></tr>
                </thead>
                <tbody>
                    ${state.profesores.length === 0 ? `
                        <tr><td colspan="4" class="empty-cell">No hay profesores cargados.</td></tr>
                    ` : state.profesores.map((profesor) => {
                        const calc = byProfesor.get(profesor.id) || { asignado: 0, objetivoReal: 0, diferencia: 0 };
                        return `
                        <tr>
                            <td>
                                <strong>${escapeHtml(profesor.nombreCompleto)}</strong>
                                <small class="muted-line">${escapeHtml(profesor.id)}</small>
                            </td>
                            <td><span class="num-pill muted-pill">${calc.asignado}</span></td>
                            <td><span class="num-pill">${calc.objetivoReal}</span></td>
                            <td><span class="num-pill ${calc.diferencia < 0 ? "danger-pill" : "muted-pill"}">${calc.diferencia}</span></td>
                        </tr>
                    `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function renderDocenciaProgress(total, assigned) {
    const pct = total > 0 ? Math.min(100, (assigned / total) * 100) : 0;
    return `
        <div class="allocation-global-progress" aria-label="Horas repartidas ${assigned} de ${total}">
            <span style="width:${pct}%"></span>
            <strong>${assigned} / ${total}</strong>
        </div>
    `;
}

function renderReajusteResumen(state) {
    const reajuste = calcularReajusteDocente(state);
    const formulaAjustable = reajuste.capacidadAjustable > 0
        ? "Objetivo real = capacidad individual / capacidad ajustable total x horas reajustables"
        : "No hay profesores reajustables con capacidad disponible.";
    const diferenciaLabel = reajuste.diferenciaGlobal === 0
        ? "La capacidad total coincide con las horas a repartir."
        : reajuste.diferenciaGlobal > 0
            ? `Hay ${reajuste.diferenciaGlobal} horas mas de carga que capacidad disponible.`
            : `Hay ${Math.abs(reajuste.diferenciaGlobal)} horas mas de capacidad que carga a repartir.`;
    return `
        <section class="form-section allocation-summary-panel">
            <div class="form-section-title">
                <div>
                    <span class="section-kicker">Resumen</span>
                    <h3>Calculo del reajuste docente</h3>
                </div>
            </div>
            <div class="grid grid-4 compact-stats">
                <div class="metric-box"><span>Total a repartir</span><strong>${reajuste.totalCarga}</strong></div>
                <div class="metric-box"><span>Capacidad fija</span><strong>${reajuste.capacidadFija}</strong></div>
                <div class="metric-box"><span>A repartir ajustable</span><strong>${reajuste.cargaReajustable}</strong></div>
                <div class="metric-box"><span>Capacidad ajustable</span><strong>${reajuste.capacidadAjustable}</strong></div>
            </div>
            <div class="calculation-note calculation-breakdown">
                <h4>Como se calcula</h4>
                <ol>
                    <li><strong>Total a repartir:</strong> suma de las horas de todos los subgrupos = <strong>${reajuste.totalCarga}</strong>.</li>
                    <li><strong>TFM previos:</strong> los TFM ya asignados se descuentan antes del reajuste = <strong>${reajuste.totalTfm}</strong> horas.</li>
                    <li><strong>Profesores fijos:</strong> ${reajuste.profesoresFijos} profesores no reajustables conservan su capacidad restante tras TFM = <strong>${reajuste.capacidadFija}</strong>.</li>
                    <li><strong>Horas reajustables:</strong> ${reajuste.totalCarga} - ${reajuste.capacidadFija} = <strong>${reajuste.cargaReajustable}</strong>.</li>
                    <li><strong>Base proporcional:</strong> suma de capacidades restantes de ${reajuste.profesoresAjustables} profesores reajustables = <strong>${reajuste.capacidadAjustable}</strong>.</li>
                    <li><strong>Formula:</strong> ${formulaAjustable}.</li>
                    <li><strong>Control global:</strong> capacidad total ${reajuste.capacidadTotal}. ${diferenciaLabel}</li>
                </ol>
            </div>
            <div class="table-shell compact-table">
                <table class="table teacher-table">
                    <thead>
                        <tr>
                            <th>Profesor</th>
                            <th>Modo</th>
                            <th>Capacidad inicial</th>
                            <th>TFM previos</th>
                            <th>Capacidad</th>
                            <th>% reparto</th>
                            <th>Formula</th>
                            <th>Objetivo real</th>
                            <th>Reajuste</th>
                            <th>Asignadas</th>
                            <th>Diferencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reajuste.profesoresDetalle.length === 0 ? `
                            <tr><td colspan="11" class="empty-cell">No hay profesores cargados.</td></tr>
                        ` : reajuste.profesoresDetalle.map((item) => `
                            <tr>
                                <td>
                                    <strong>${escapeHtml(item.profesor.nombreCompleto || item.profesor.id)}</strong>
                                    <small class="muted-line">${escapeHtml(item.profesor.id)}</small>
                                </td>
                                <td><span class="badge ${item.esAjustable ? "" : "muted-badge"}">${item.esAjustable ? "Reajustable" : "Fijo"}</span></td>
                                <td><span class="num-pill muted-pill">${item.capacidadBase}</span></td>
                                <td><span class="num-pill ${item.cargaTfm > 0 ? "danger-pill" : "muted-pill"}">${item.cargaTfm}</span></td>
                                <td><span class="num-pill muted-pill">${item.capacidad}</span></td>
                                <td><span class="num-pill muted-pill">${item.esAjustable ? `${item.proporcionPct}%` : "-"}</span></td>
                                <td>
                                    <small class="muted-line">${item.esAjustable && reajuste.capacidadAjustable > 0
        ? `${item.capacidad} / ${reajuste.capacidadAjustable} x ${reajuste.cargaReajustable}`
        : "Capacidad fija"}</small>
                                </td>
                                <td><span class="num-pill">${item.objetivoReal}</span></td>
                                <td><span class="num-pill ${item.reajuste < 0 ? "danger-pill" : "muted-pill"}">${item.reajuste}</span></td>
                                <td><span class="num-pill muted-pill">${item.asignado}</span></td>
                                <td><span class="num-pill ${item.diferencia < 0 ? "danger-pill" : "muted-pill"}">${item.diferencia}</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function renderDocenciaOverlapModal(state) {
    const warning = state.docenciaOverlapWarning;
    if (!warning?.overlaps?.length) return "";
    const rows = warning.overlaps.slice(0, 8).map((overlap) => `
        <li>
            <strong>${escapeHtml(formatIsoDateEs(overlap.date))}, ${escapeHtml(minutesLabel(overlap.start))}-${escapeHtml(minutesLabel(overlap.end))}</strong>
            <span>${escapeHtml(overlap.next.label)} se solapa con ${escapeHtml(overlap.existing.label)}</span>
        </li>
    `).join("");
    const rest = warning.overlaps.length > 8 ? `<li class="muted-line">Y ${warning.overlaps.length - 8} solapamientos mas.</li>` : "";
    return `
        <div class="modal-backdrop" id="docencia-overlap-backdrop">
            <section class="card modal compact-modal" role="dialog" aria-modal="true" aria-labelledby="docencia-overlap-title">
                <div class="modal-header">
                    <div>
                        <h2 id="docencia-overlap-title">Estas asignaturas se bloquean</h2>
                        <p class="status">La asignacion se ha guardado, pero coincide en horario con otra docencia del mismo profesor.</p>
                    </div>
                </div>
                <ul class="calendar-overlap-list docencia-overlap-list">
                    ${rows}${rest}
                </ul>
                <div class="form-actions">
                    <button id="accept-docencia-overlap-btn" type="button">Aceptar</button>
                </div>
            </section>
        </div>
    `;
}

export function renderDocenciaSection(state) {
    const visibleAsignaturas = visibleAsignaturasForDocencia(state);
    const asignatura = selectedAsignatura(state, visibleAsignaturas);
    if (asignatura && state.selectedDocenciaAsignaturaId !== asignatura.id) {
        state.selectedDocenciaAsignaturaId = asignatura.id;
    }

    const statuses = state.asignaturas.map((item) => asignaturaStatus(state, item));
    const totalCredits = Number(statuses.reduce((sum, status) => sum + status.total, 0).toFixed(2));
    const assignedCredits = Number(statuses.reduce((sum, status) => sum + status.assigned, 0).toFixed(2));
    const remainingCredits = Number(Math.max(0, totalCredits - assignedCredits).toFixed(2));
    const completeSubjects = statuses.filter((status) => status.complete).length;
    const selectedStatus = asignatura ? asignaturaStatus(state, asignatura) : { total: 0, assigned: 0, remaining: 0 };
    const activeTab = state.docenciaTab || "reparto";
    const visibleSubgrupos = asignatura
        ? (asignatura.subgrupos || []).filter((subgrupo) => !state.docenciaShowPendingOnly || !subgrupoStatus(state, asignatura, subgrupo).complete)
        : [];

    return `
        <div class="card subject-panel allocation-panel">
            <div class="section-header subject-header">
                <div>
                    <h2>Reparto de asignaturas</h2>
                    <p class="status">Asigna las horas de cada subgrupo entre uno o varios profesores.</p>
                </div>
                <button id="save-docencia-btn" class="secondary" type="button">Guardar cambios</button>
            </div>

            ${renderDocenciaProgress(totalCredits, assignedCredits)}

            <div class="nav-tabs embedded-tabs allocation-tabs">
                <button class="tab ${activeTab === "reparto" ? "active" : ""}" data-docencia-tab="reparto" type="button">Reparto de clases</button>
                <button class="tab ${activeTab === "carga" ? "active" : ""}" data-docencia-tab="carga" type="button">Resumen por profesor</button>
                <button class="tab ${activeTab === "resumen" ? "active" : ""}" data-docencia-tab="resumen" type="button">Resumen</button>
            </div>

            ${activeTab === "reparto" ? `
                <div class="allocation-toolbar">
                    <label>
                        Titulacion / grado / facultad
                        <select id="docencia-category-filter">
                            ${renderDocenciaCategoryOptions(state)}
                        </select>
                    </label>
                    <label class="switch-row compact-switch">
                        <span>
                            <strong>Solo pendientes</strong>
                            <small>Oculta subgrupos, asignaturas y grados ya repartidos.</small>
                        </span>
                        <input id="docencia-pending-switch" type="checkbox" ${state.docenciaShowPendingOnly ? "checked" : ""} />
                    </label>
                </div>
            ` : ""}

            <div class="teacher-summary subject-summary">
                <div class="metric-box"><span>Horas totales</span><strong>${totalCredits}</strong></div>
                <div class="metric-box"><span>Horas repartidas</span><strong>${assignedCredits}</strong></div>
                <div class="metric-box"><span>Pendientes</span><strong>${remainingCredits}</strong></div>
                <div class="metric-box"><span>Asignaturas completas</span><strong>${completeSubjects} / ${state.asignaturas.length}</strong></div>
            </div>

            ${state.asignaturas.length === 0 ? `
                <div class="empty-state-block">No hay asignaturas cargadas en este curso.</div>
            ` : activeTab === "carga" ? `
                <section class="form-section allocation-summary-panel">
                    <div class="form-section-title">
                        <div>
                            <span class="section-kicker">Carga</span>
                            <h3>Resumen por profesor</h3>
                        </div>
                    </div>
                    ${renderProfesorLoad(state)}
                </section>
            ` : activeTab === "resumen" ? renderReajusteResumen(state) : `
                <div class="allocation-layout">
                    <aside class="form-section allocation-picker">
                        <div class="form-section-title">
                            <div>
                                <span class="section-kicker">Navegacion</span>
                                <h3>Asignaturas</h3>
                            </div>
                        </div>
                        ${renderDocenciaNavigator(state, visibleAsignaturas, asignatura?.id || "")}
                    </aside>

                    <section class="form-section allocation-main">
                        <div class="form-section-title">
                            <div>
                                <span class="section-kicker">${asignatura ? escapeHtml(categoriaLabel(state, asignatura.categoriaId)) : "Asignatura"}</span>
                                <h3>${asignatura ? escapeHtml(asignatura.nombre || asignatura.id) : "Sin asignatura seleccionada"}</h3>
                            </div>
                        </div>

                        <div class="grid grid-3 compact-stats">
                            <div class="metric-box"><span>Total asignatura</span><strong>${selectedStatus.total}</strong></div>
                            <div class="metric-box"><span>Repartidos</span><strong>${selectedStatus.assigned}</strong></div>
                            <div class="metric-box"><span>Pendientes</span><strong>${selectedStatus.remaining}</strong></div>
                        </div>

                        <div class="allocation-subgroups">
                            ${!asignatura ? `
                                <div class="empty-state-block">No hay asignaturas que coincidan con este filtro.</div>
                            ` : (asignatura.subgrupos || []).length === 0 ? `
                                <div class="empty-state-block">Esta asignatura no tiene subgrupos definidos.</div>
                            ` : visibleSubgrupos.length === 0 ? `
                                <div class="empty-state-block">Todos los subgrupos de esta asignatura estan repartidos.</div>
                            ` : visibleSubgrupos.map((subgrupo) => renderSubgrupoAllocation(state, asignatura, subgrupo)).join("")}
                        </div>
                    </section>
                </div>
            `}
        </div>
        ${renderDocenciaOverlapModal(state)}
    `;
}

function findAssignment(state, id) {
    return state.docencia.find((item) => item.id === id) || null;
}

function readAssignmentForm(subgrupoId) {
    return {
        profesorId: (document.querySelector(`[data-docencia-profesor="${CSS.escape(subgrupoId)}"]`)?.value || "").trim(),
        creditos: toPositiveNumber(document.querySelector(`[data-docencia-creditos="${CSS.escape(subgrupoId)}"]`)?.value || "0", 0),
    };
}

export function bindDocenciaEvents({ app, state, setStatus, render, saveDocencia }) {
    app.querySelectorAll("[data-docencia-tab]").forEach((btn) => {
        btn.onclick = () => {
            state.docenciaTab = btn.dataset.docenciaTab || "reparto";
            render();
        };
    });

    const categoryFilter = document.getElementById("docencia-category-filter");
    if (categoryFilter) {
        categoryFilter.onchange = () => {
            state.docenciaFilterCategoria = categoryFilter.value || "";
            state.editingDocenciaId = "";
            render();
        };
    }

    const pendingSwitch = document.getElementById("docencia-pending-switch");
    if (pendingSwitch) {
        pendingSwitch.onchange = () => {
            state.docenciaShowPendingOnly = pendingSwitch.checked;
            state.editingDocenciaId = "";
            render();
        };
    }

    app.querySelectorAll("[data-docencia-select-asignatura]").forEach((btn) => {
        btn.onclick = () => {
            state.selectedDocenciaAsignaturaId = btn.dataset.docenciaSelectAsignatura || "";
            state.editingDocenciaId = "";
            render();
        };
    });

    app.querySelectorAll("[data-edit-docencia]").forEach((btn) => {
        btn.onclick = () => {
            state.editingDocenciaId = btn.dataset.editDocencia || "";
            render();
        };
    });

    app.querySelectorAll("[data-cancel-docencia-edit]").forEach((btn) => {
        btn.onclick = () => {
            state.editingDocenciaId = "";
            render();
        };
    });

    app.querySelectorAll("[data-remove-docencia]").forEach((btn) => {
        btn.onclick = async () => {
            const id = btn.dataset.removeDocencia || "";
            state.docencia = state.docencia.filter((item) => item.id !== id);
            if (state.editingDocenciaId === id) {
                state.editingDocenciaId = "";
            }
            await saveDocencia();
        };
    });

    app.querySelectorAll("[data-apply-docencia]").forEach((btn) => {
        btn.onclick = async () => {
            const subgrupoId = btn.dataset.applyDocencia || "";
            const asignatura = selectedAsignatura(state);
            const subgrupo = asignatura?.subgrupos?.find((item) => item.id === subgrupoId);
            const editingItem = state.editingDocenciaId ? findAssignment(state, state.editingDocenciaId) : null;
            if (!asignatura || !subgrupo) {
                setStatus("Selecciona una asignatura y un subgrupo validos.");
                return;
            }

            const form = readAssignmentForm(subgrupoId);
            const maxCredits = remainingCreditsForSubgroup(state, asignatura, subgrupo, editingItem?.id || "");
            if (!form.profesorId) {
                setStatus("Selecciona un profesor para el reparto.");
                return;
            }
            if (form.creditos <= 0) {
                setStatus("Indica horas mayores que 0.");
                return;
            }
            if (form.creditos > maxCredits) {
                setStatus(`No puedes asignar mas de ${maxCredits} horas en este subgrupo.`);
                return;
            }
            const alreadyAssigned = assignmentsForSubgroup(state, asignatura.id, subgrupo.id)
                .some((item) => item.profesorId === form.profesorId && item.id !== editingItem?.id);
            if (alreadyAssigned) {
                setStatus("Ese profesor ya esta asignado a este subgrupo. Edita su fila para cambiar las horas.");
                return;
            }

            const next = normalizeDocenciaItem({
                id: editingItem?.id || uid("doc"),
                asignaturaId: asignatura.id,
                subgrupoId: subgrupo.id,
                profesorId: form.profesorId,
                creditos: form.creditos,
            });
            const overlaps = findDocenciaOverlaps(state, next, editingItem?.id || "");

            if (editingItem) {
                state.docencia = state.docencia.map((item) => item.id === editingItem.id ? next : item);
                state.editingDocenciaId = "";
            } else {
                state.docencia.push(next);
            }
            state.docenciaOverlapWarning = overlaps.length > 0 ? { overlaps } : null;
            await saveDocencia();
        };
    });

    const acceptOverlapBtn = document.getElementById("accept-docencia-overlap-btn");
    if (acceptOverlapBtn) {
        acceptOverlapBtn.onclick = () => {
            state.docenciaOverlapWarning = null;
            render();
        };
    }
    const overlapBackdrop = document.getElementById("docencia-overlap-backdrop");
    if (overlapBackdrop) {
        overlapBackdrop.onclick = (e) => {
            if (e.target === overlapBackdrop) {
                state.docenciaOverlapWarning = null;
                render();
            }
        };
    }

    const saveBtn = document.getElementById("save-docencia-btn");
    if (saveBtn) {
        saveBtn.onclick = saveDocencia;
    }
}
