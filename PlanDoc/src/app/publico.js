import { calcularReajusteDocente } from "./reajuste.js";
import { escapeHtml, toPositiveNumber } from "./utils.js";

const PUBLIC_TABS = [
    { id: "profesores", label: "Profesores" },
    { id: "asignaturas", label: "Asignaturas" },
    { id: "horarios", label: "Horarios" },
    { id: "reparto", label: "Reparto" },
];

const CALENDAR_VIEWS = [
    { value: "timeGridDay", label: "Dia" },
    { value: "timeGridWeek", label: "Semana" },
    { value: "dayGridMonth", label: "Mes" },
    { value: "academicYear", label: "Año" },
];

const CUATRIMESTRES = [
    { value: "primer", label: "Primer cuatrimestre" },
    { value: "segundo", label: "Segundo cuatrimestre" },
    { value: "anual", label: "Anual" },
];

const TIPOS_SUBGRUPO = [
    { value: "teoria", label: "Teoria" },
    { value: "practicas", label: "Practicas" },
    { value: "seminario", label: "Seminario" },
    { value: "practicas-informaticas", label: "Practicas informaticas" },
    { value: "tutorias", label: "Tutorias" },
];

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

function professorName(profesor) {
    return profesor.nombreCompleto || [profesor.nombre, profesor.apellidos].filter(Boolean).join(" ") || profesor.id;
}

function categoriaNombre(state, categoriaId) {
    return state.categoriasAsignaturas.find((categoria) => categoria.id === categoriaId)?.nombre || "Sin titulacion";
}

function cuatrimestreLabel(value) {
    return CUATRIMESTRES.find((item) => item.value === value)?.label || value || "";
}

function tipoSubgrupoLabel(value) {
    return TIPOS_SUBGRUPO.find((item) => item.value === value)?.label || value || "";
}

function calendarViewLabel(value) {
    return CALENDAR_VIEWS.find((view) => view.value === value)?.label || "Semana";
}

function totalHorasAsignatura(asignatura) {
    return Number((asignatura.subgrupos || []).reduce((sum, subgrupo) => sum + toPositiveNumber(subgrupo.creditos, 0), 0).toFixed(2));
}

function totalSesionesAsignatura(asignatura) {
    return (asignatura.subgrupos || []).reduce((sum, subgrupo) => sum + sesionesSubgrupo(subgrupo).length, 0);
}

function sesionesSubgrupo(subgrupo) {
    return Array.isArray(subgrupo?.sesiones) ? subgrupo.sesiones : [];
}

function assignedForSubgrupo(state, asignaturaId, subgrupoId) {
    return Number(state.docencia
        .filter((item) => item.asignaturaId === asignaturaId && item.subgrupoId === subgrupoId)
        .reduce((sum, item) => sum + toPositiveNumber(item.creditos, 0), 0)
        .toFixed(2));
}

function assignmentsForSubgrupo(state, asignaturaId, subgrupoId) {
    return state.docencia
        .filter((item) => item.asignaturaId === asignaturaId && item.subgrupoId === subgrupoId)
        .map((item) => ({
            item,
            profesor: state.profesores.find((profesor) => profesor.id === item.profesorId),
        }))
        .filter((entry) => entry.profesor);
}

function profesorAssignments(state, profesorId) {
    return state.docencia
        .filter((item) => item.profesorId === profesorId)
        .map((item) => {
            const asignatura = state.asignaturas.find((a) => a.id === item.asignaturaId);
            const subgrupo = asignatura?.subgrupos?.find((s) => s.id === item.subgrupoId);
            return { item, asignatura, subgrupo, simulated: false };
        })
        .filter((entry) => entry.asignatura && entry.subgrupo);
}

function profesorSpecialWorkCredits(state, profesorId) {
    return Number((state.trabajos || []).reduce((sum, trabajo) => {
        if (!trabajo || !["tfg", "tfm", "practicas"].includes(trabajo.tipo)) {
            return sum;
        }
        return sum + (toPositiveNumber(trabajo.asignaciones?.[profesorId], 0) * toPositiveNumber(trabajo.peso, 0));
    }, 0).toFixed(2));
}

function simulatedAssignments(state) {
    const selected = new Set(state.publicSimulatedSubgroups || []);
    return [...selected].map((key) => {
        const [asignaturaId, subgrupoId] = key.split("::");
        const asignatura = state.asignaturas.find((a) => a.id === asignaturaId);
        const subgrupo = asignatura?.subgrupos?.find((s) => s.id === subgrupoId);
        const total = toPositiveNumber(subgrupo?.creditos, 0);
        const assigned = asignatura && subgrupo ? assignedForSubgrupo(state, asignatura.id, subgrupo.id) : 0;
        const pending = Number(Math.max(0, total - assigned).toFixed(2));
        return {
            item: { asignaturaId, subgrupoId, creditos: pending || total },
            asignatura,
            subgrupo: subgrupo ? { ...subgrupo, sesiones: sesionesSubgrupo(subgrupo).map((sesion) => ({ ...sesion })) } : null,
            simulated: true,
        };
    }).filter((entry) => entry.asignatura && entry.subgrupo);
}

function parseDateDMY(value) {
    const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
}

function toIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function academicCalendarRange(selectedCourse) {
    const years = [...String(selectedCourse || "").matchAll(/(\d{4})/g)].map((match) => Number(match[1]));
    const today = new Date();
    const fallbackStartYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    const endYear = years.length >= 2 ? years[1] : (years[0] || fallbackStartYear + 1);
    const startYear = years.length >= 2 ? years[0] : endYear - 1;
    const start = new Date(startYear, 8, 1);
    const endInclusive = new Date(endYear, 5, 30);
    return { startIso: toIsoDate(start), endIso: toIsoDate(addDays(endInclusive, 1)) };
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

function profesorCalendarEntries(state) {
    const base = profesorAssignments(state, state.publicProfesorCalendarId);
    const sim = state.publicSimulationMode ? simulatedAssignments(state) : [];
    return [...base, ...sim];
}

function profesorCalendarItems(state) {
    const range = academicCalendarRange(state.selectedCourse);
    const out = [];
    profesorCalendarEntries(state).forEach((entry, entryIndex) => {
        sesionesSubgrupo(entry.subgrupo).forEach((sesion, sesionIndex) => {
            const date = sessionDate(sesion);
            if (!date || !sesion.horaInicio || !sesion.horaFin || date < range.startIso || date >= range.endIso) return;
            const color = entry.simulated ? "#7c3aed" : (entry.subgrupo.color || entry.asignatura.color || "#0f766e");
            out.push({
                ...entry,
                sesion,
                date,
                id: `${entry.simulated ? "sim" : "real"}:${entryIndex}:${sesionIndex}`,
                startMinutes: timeToMinutes(sesion.horaInicio),
                endMinutes: timeToMinutes(sesion.horaFin),
                event: {
                    id: `${entry.simulated ? "sim" : "real"}:${entryIndex}:${sesionIndex}`,
                    title: `${entry.simulated ? "[Sim] " : ""}${entry.asignatura.nombre} · ${entry.subgrupo.id}`,
                    start: `${date}T${sesion.horaInicio}`,
                    end: `${date}T${sesion.horaFin}`,
                    backgroundColor: color,
                    borderColor: color,
                    extendedProps: { lugar: sesion.lugar || "", simulated: entry.simulated },
                },
            });
        });
    });
    return out;
}

function missingCalendarEntries(state) {
    const visibleKeys = new Set(profesorCalendarItems(state).map((item) => `${item.item.asignaturaId}::${item.item.subgrupoId}::${item.simulated ? "sim" : "real"}`));
    return profesorCalendarEntries(state).filter((entry) => (
        !visibleKeys.has(`${entry.item.asignaturaId}::${entry.item.subgrupoId}::${entry.simulated ? "sim" : "real"}`)
    ));
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
    return year ? new Intl.DateTimeFormat("es", { day: "numeric", month: "long" }).format(new Date(year, month - 1, day)) : isoDate;
}

function professorOverlapDiagnostics(state) {
    const items = profesorCalendarItems(state)
        .filter((item) => item.startMinutes !== null && item.endMinutes !== null && item.endMinutes > item.startMinutes)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes);
    const overlaps = [];
    const byDate = new Map();
    items.forEach((item) => {
        const current = byDate.get(item.date) || [];
        current.push(item);
        byDate.set(item.date, current);
    });
    byDate.forEach((dayItems, date) => {
        const sorted = [...dayItems].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
        for (let i = 0; i < sorted.length; i += 1) {
            for (let j = i + 1; j < sorted.length; j += 1) {
                if (sorted[j].startMinutes < sorted[i].endMinutes) {
                    overlaps.push({
                        date,
                        start: Math.max(sorted[i].startMinutes, sorted[j].startMinutes),
                        end: Math.min(sorted[i].endMinutes, sorted[j].endMinutes),
                        items: [sorted[i], sorted[j]],
                    });
                }
            }
        }
    });
    return { overlaps, overlapDates: new Set(overlaps.map((item) => item.date)) };
}

function asignaturaStatus(state, asignatura) {
    const total = totalHorasAsignatura(asignatura);
    const assigned = Number((asignatura.subgrupos || []).reduce((sum, subgrupo) => (
        sum + Math.min(toPositiveNumber(subgrupo.creditos, 0), assignedForSubgrupo(state, asignatura.id, subgrupo.id))
    ), 0).toFixed(2));
    return {
        total,
        assigned,
        pending: Number(Math.max(0, total - assigned).toFixed(2)),
        complete: total > 0 && assigned >= total,
    };
}

function matchesEstadoFiltro(status, filtro) {
    if (filtro === "assigned") {
        return status.assigned > 0;
    }
    if (filtro === "pending") {
        return status.pending > 0;
    }
    return true;
}

function subgrupoStatus(state, asignatura, subgrupo) {
    const total = toPositiveNumber(subgrupo.creditos, 0);
    const assigned = assignedForSubgrupo(state, asignatura.id, subgrupo.id);
    return {
        total,
        assigned,
        pending: Number(Math.max(0, total - assigned).toFixed(2)),
    };
}

function filteredSubgruposForPublicModal(state, asignatura) {
    const text = (state.publicSubgrupoFilter || "").trim().toLowerCase();
    return (asignatura.subgrupos || [])
        .filter((subgrupo) => {
            const haystack = [
                subgrupo.nombre,
                subgrupo.id,
                subgrupo.codigoUv,
                tipoSubgrupoLabel(subgrupo.tipo),
                cuatrimestreLabel(subgrupo.cuatrimestre),
            ].filter(Boolean).join(" ").toLowerCase();
            return !text || haystack.includes(text);
        })
        .filter((subgrupo) => !state.publicSubgrupoTipo || subgrupo.tipo === state.publicSubgrupoTipo)
        .filter((subgrupo) => !state.publicSubgrupoCuatrimestre || subgrupo.cuatrimestre === state.publicSubgrupoCuatrimestre)
        .filter((subgrupo) => matchesEstadoFiltro(subgrupoStatus(state, asignatura, subgrupo), state.publicSubgrupoEstado || "all"));
}

function filteredProfesores(state) {
    const text = (state.publicProfesorFilter || "").trim().toLowerCase();
    const sort = state.publicProfesorSort || "nombre";
    const reajuste = calcularReajusteDocente(state);
    return reajuste.profesoresDetalle
        .filter((item) => {
            const haystack = [professorName(item.profesor), item.profesor.id].join(" ").toLowerCase();
            return !text || haystack.includes(text);
        })
        .sort((a, b) => {
            if (sort === "inicial") return toPositiveNumber(a.profesor.creditosObjetivo, 0) - toPositiveNumber(b.profesor.creditosObjetivo, 0);
            if (sort === "reducciones") return (toPositiveNumber(a.profesor.creditosObjetivo, 0) - a.capacidadBase) - (toPositiveNumber(b.profesor.creditosObjetivo, 0) - b.capacidadBase);
            if (sort === "reales") return a.objetivoReal - b.objetivoReal;
            return professorName(a.profesor).localeCompare(professorName(b.profesor), "es", { sensitivity: "base" });
        });
}

function filteredAsignaturas(state) {
    const text = (state.publicAsignaturaFilter || "").trim().toLowerCase();
    const sort = state.publicAsignaturaSort || "nombre";
    return [...state.asignaturas]
        .filter((asignatura) => {
            const haystack = [
                asignatura.nombre,
                asignatura.codigoReferencia,
                asignatura.id,
                categoriaNombre(state, asignatura.categoriaId),
            ].filter(Boolean).join(" ").toLowerCase();
            return !text || haystack.includes(text);
        })
        .filter((asignatura) => (
            !state.publicAsignaturaCategoria
            || asignatura.categoriaId === state.publicAsignaturaCategoria
        ))
        .filter((asignatura) => (
            !state.publicAsignaturaCuatrimestre
            || asignatura.cuatrimestre === state.publicAsignaturaCuatrimestre
        ))
        .filter((asignatura) => {
            const status = asignaturaStatus(state, asignatura);
            return matchesEstadoFiltro(status, state.publicAsignaturaEstado || "all");
        })
        .sort((a, b) => {
            if (sort === "categoria") return categoriaNombre(state, a.categoriaId).localeCompare(categoriaNombre(state, b.categoriaId), "es", { sensitivity: "base" });
            if (sort === "horas") return totalHorasAsignatura(a) - totalHorasAsignatura(b);
            if (sort === "pendientes") return asignaturaStatus(state, b).pending - asignaturaStatus(state, a).pending;
            return String(a.nombre || a.id).localeCompare(String(b.nombre || b.id), "es", { numeric: true, sensitivity: "base" });
        });
}

function renderProfesorTab(state) {
    const rows = filteredProfesores(state);
    return `
        <section class="card public-section">
            <div class="filter-bar">
                <label>
                    Filtrar profesores
                    <input id="public-prof-filter" value="${escapeHtml(state.publicProfesorFilter || "")}" placeholder="Nombre o identificador" />
                </label>
                <label>
                    Ordenar por
                    <select id="public-prof-sort">
                        <option value="nombre" ${state.publicProfesorSort === "nombre" ? "selected" : ""}>Nombre</option>
                        <option value="inicial" ${state.publicProfesorSort === "inicial" ? "selected" : ""}>Carga inicial</option>
                        <option value="reducciones" ${state.publicProfesorSort === "reducciones" ? "selected" : ""}>Reducciones</option>
                        <option value="reales" ${state.publicProfesorSort === "reales" ? "selected" : ""}>Horas reales</option>
                    </select>
                </label>
            </div>
            <div class="table-shell">
                <table class="table teacher-table">
                    <thead>
                        <tr><th>Profesor</th><th>Carga inicial</th><th>Reducciones</th><th>TFM previos</th><th>Capacidad reajuste</th><th>Horas reales</th><th>Asignadas</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? `<tr><td colspan="8" class="empty-cell">No hay profesores visibles.</td></tr>` : rows.map((item) => {
        const inicial = toPositiveNumber(item.profesor.creditosObjetivo, 0);
        const reducciones = Number((inicial - item.capacidadBase).toFixed(2));
        return `
                            <tr>
                                <td><strong>${escapeHtml(professorName(item.profesor))}</strong><small class="muted-line">${escapeHtml(item.profesor.id)}</small></td>
                                <td><span class="num-pill">${inicial}</span></td>
                                <td><span class="num-pill muted-pill">${reducciones}</span></td>
                                <td><span class="num-pill ${item.cargaTfm > 0 ? "danger-pill" : "muted-pill"}">${item.cargaTfm}</span></td>
                                <td><span class="num-pill muted-pill">${item.capacidad}</span></td>
                                <td><span class="num-pill">${item.objetivoReal}</span></td>
                                <td><span class="num-pill ${item.asignado < item.objetivoReal ? "danger-pill" : "muted-pill"}">${item.asignado}</span></td>
                                <td>
                                    <button class="secondary icon-button calendar-row-btn" data-public-prof-calendar="${escapeHtml(item.profesor.id)}" type="button" title="Ver calendario" aria-label="Ver calendario de ${escapeHtml(professorName(item.profesor))}">
                                        <span class="calendar-mini-icon" aria-hidden="true"></span>
                                    </button>
                                </td>
                            </tr>
                        `;
    }).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function availableSimulationSubgroups(state) {
    const fixedProfessorKeys = new Set(profesorAssignments(state, state.publicProfesorCalendarId).map((entry) => `${entry.item.asignaturaId}::${entry.item.subgrupoId}`));
    return state.asignaturas.flatMap((asignatura) => (asignatura.subgrupos || [])
        .map((subgrupo) => {
            const total = toPositiveNumber(subgrupo.creditos, 0);
            const assigned = assignedForSubgrupo(state, asignatura.id, subgrupo.id);
            return {
                asignatura,
                subgrupo,
                key: `${asignatura.id}::${subgrupo.id}`,
                pending: Number(Math.max(0, total - assigned).toFixed(2)),
            };
        })
        .filter(({ key, pending }) => pending > 0 && !fixedProfessorKeys.has(key)));
}

function availableSimulationTree(state) {
    const byCategory = new Map();
    availableSimulationSubgroups(state).forEach((entry) => {
        const categoriaId = entry.asignatura.categoriaId || "sin-categoria";
        if (!byCategory.has(categoriaId)) {
            byCategory.set(categoriaId, {
                id: categoriaId,
                nombre: categoriaNombre(state, categoriaId),
                asignaturas: new Map(),
            });
        }
        const category = byCategory.get(categoriaId);
        const asignaturaKey = entry.asignatura.id;
        if (!category.asignaturas.has(asignaturaKey)) {
            category.asignaturas.set(asignaturaKey, {
                asignatura: entry.asignatura,
                subgrupos: [],
            });
        }
        category.asignaturas.get(asignaturaKey).subgrupos.push(entry);
    });

    return [...byCategory.values()]
        .map((category) => ({
            ...category,
            asignaturas: [...category.asignaturas.values()]
                .map((item) => ({
                    ...item,
                    subgrupos: item.subgrupos.sort((a, b) => String(a.subgrupo.nombre || a.subgrupo.id).localeCompare(String(b.subgrupo.nombre || b.subgrupo.id), "es", { numeric: true, sensitivity: "base" })),
                }))
                .sort((a, b) => String(a.asignatura.nombre || "").localeCompare(String(b.asignatura.nombre || ""), "es", { sensitivity: "base" })),
        }))
        .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" }));
}

function renderSimulationTree(state) {
    const tree = availableSimulationTree(state);
    const selected = new Set(state.publicSimulatedSubgroups || []);
    if (tree.length === 0) {
        return `<p class="empty-cell">No hay grupos pendientes para simular.</p>`;
    }

    return tree.map((category) => `
        <section class="calendar-category">
            <h3>${escapeHtml(category.nombre)}</h3>
            <div class="calendar-subject-list">
                ${category.asignaturas.map(({ asignatura, subgrupos }) => {
        const expanded = state.publicSimulationExpandedAsignaturas?.[asignatura.id] === true;
        const selectedCount = subgrupos.filter(({ key }) => selected.has(key)).length;
        const allSelected = selectedCount === subgrupos.length;
        return `
                    <div class="calendar-subject">
                        <div class="calendar-subject-row simulation-subject-row">
                            <button class="calendar-expand" data-public-sim-expand="${escapeHtml(asignatura.id)}" type="button" aria-label="${expanded ? "Contraer" : "Expandir"} asignatura">${expanded ? "⌄" : "›"}</button>
                            <input data-public-sim-asignatura="${escapeHtml(asignatura.id)}" type="checkbox" ${allSelected ? "checked" : ""} />
                            <span>
                                <strong>${escapeHtml(asignatura.nombre || asignatura.id || "Asignatura")}</strong>
                                <small>${subgrupos.length} subgrupos pendientes · ${subgrupos.reduce((sum, item) => sum + item.pending, 0).toFixed(2)} horas</small>
                            </span>
                        </div>
                        ${expanded ? `
                            <div class="calendar-subgroup-list">
                                ${subgrupos.map(({ subgrupo, key, pending }) => `
                                    <label class="calendar-subgroup-row simulation-subgroup-row">
                                        <input data-public-sim-subgroup="${escapeHtml(key)}" type="checkbox" ${selected.has(key) ? "checked" : ""} />
                                        <span>
                                            <strong>${escapeHtml(subgrupo.nombre || subgrupo.id || "Subgrupo")}</strong>
                                            <small>${escapeHtml(subgrupo.id || "")} · ${pending} horas pendientes · ${sesionesSubgrupo(subgrupo).length} eventos</small>
                                        </span>
                                    </label>
                                `).join("")}
                            </div>
                        ` : ""}
                    </div>
                `;
    }).join("")}
            </div>
        </section>
    `).join("");
}

function renderProfessorCalendarModal(state) {
    const profesor = state.profesores.find((item) => item.id === state.publicProfesorCalendarId);
    if (!profesor) return "";
    const items = profesorCalendarItems(state);
    const missing = missingCalendarEntries(state);
    const diagnostics = professorOverlapDiagnostics(state);
    const fixedHours = Number(profesorAssignments(state, profesor.id).reduce((sum, entry) => sum + toPositiveNumber(entry.item.creditos, 0), 0).toFixed(2));
    const simulatedHours = Number((state.publicSimulationMode ? simulatedAssignments(state) : []).reduce((sum, entry) => sum + toPositiveNumber(entry.item.creditos, 0), 0).toFixed(2));
    const viewLabel = calendarViewLabel(state.publicProfesorCalendarView || "timeGridWeek").toLowerCase();
    return `
        <div class="modal-backdrop" id="public-prof-calendar-backdrop">
            <section class="card modal professor-modal public-prof-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="public-prof-calendar-title">
                <div class="modal-header">
                    <div>
                        <h2 id="public-prof-calendar-title">${escapeHtml(professorName(profesor))}</h2>
                        <p class="status">${items.length} eventos visibles en calendario · ${fixedHours + simulatedHours} horas (${fixedHours} fijas${state.publicSimulationMode ? ` + ${simulatedHours} simuladas` : ""}).</p>
                    </div>
                    <button class="secondary mini" id="close-public-prof-calendar-btn" type="button">Cerrar</button>
                </div>

                ${missing.length > 0 ? `
                    <div class="calculation-note">
                        No se refleja toda la docencia en el calendario: ${missing.map((entry) => `${entry.asignatura.nombre} · ${entry.subgrupo.nombre || entry.subgrupo.id}`).join(", ")} no tiene eventos importados.
                    </div>
                ` : ""}

                <section class="calendar-overlap-panel">
                    <strong>${diagnostics.overlaps.length} solapamientos encontrados</strong>
                    ${diagnostics.overlaps.length === 0 ? `<p class="calendar-overlap-empty">No hay solapamientos en los eventos visibles.</p>` : `
                        <ul class="calendar-overlap-list">
                            ${diagnostics.overlaps.slice(0, 12).map((overlap) => `
                                <li>
                                    <strong>${escapeHtml(formatIsoDateEs(overlap.date))}</strong>
                                    <span>${escapeHtml(minutesLabel(overlap.start))}-${escapeHtml(minutesLabel(overlap.end))}: ${escapeHtml(overlap.items.map((item) => `${item.asignatura.nombre} ${item.subgrupo.id}`).join(", "))}</span>
                                </li>
                            `).join("")}
                        </ul>
                    `}
                </section>

                <div class="public-calendar-actions">
                    <div class="nav-tabs embedded-tabs">
                        ${CALENDAR_VIEWS.map((view) => `<button class="tab ${state.publicProfesorCalendarView === view.value ? "active" : ""}" data-public-prof-calendar-view="${view.value}" type="button">${view.label}</button>`).join("")}
                    </div>
                    <div class="public-calendar-action-buttons">
                        <button class="secondary" id="public-prof-sim-toggle" type="button">${state.publicSimulationMode ? "Cerrar simulacion" : "Simular docencia"}</button>
                        <button class="secondary" id="download-prof-calendar-pdf" type="button">Descargar PDF (${escapeHtml(viewLabel)})</button>
                        <button class="secondary" id="download-prof-calendar-ics" type="button">Descargar ICS</button>
                    </div>
                </div>

                <div class="public-calendar-workspace ${state.publicSimulationMode ? "with-sidebar" : ""}">
                    ${state.publicSimulationMode ? `
                        <aside class="form-section public-simulation-panel">
                            <div class="form-section-title">
                                <span class="section-kicker">Simulacion</span>
                                <h3>Grupos disponibles</h3>
                            </div>
                            <div class="calendar-event-list">
                                ${renderSimulationTree(state)}
                            </div>
                        </aside>
                    ` : ""}

                    <div class="calendar-shell printable-calendar">
                        <div id="public-prof-calendar"></div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function renderAsignaturasTab(state) {
    const rows = filteredAsignaturas(state);
    return `
        <section class="card public-section">
            <div class="filter-bar">
                <label>
                    Nombre
                    <input id="public-asig-filter" value="${escapeHtml(state.publicAsignaturaFilter || "")}" placeholder="Parte del nombre" />
                </label>
                <label>
                    Titulacion / grado / facultad
                    <select id="public-asig-category">
                        <option value="">Todas</option>
                        ${state.categoriasAsignaturas.map((categoria) => `
                            <option value="${escapeHtml(categoria.id)}" ${state.publicAsignaturaCategoria === categoria.id ? "selected" : ""}>${escapeHtml(categoria.nombre)}</option>
                        `).join("")}
                    </select>
                </label>
                <label>
                    Cuatrimestre
                    <select id="public-asig-cuatrimestre">
                        <option value="">Todos</option>
                        ${CUATRIMESTRES.map((cuatrimestre) => `
                            <option value="${escapeHtml(cuatrimestre.value)}" ${state.publicAsignaturaCuatrimestre === cuatrimestre.value ? "selected" : ""}>${cuatrimestre.label}</option>
                        `).join("")}
                    </select>
                </label>
                <label>
                    Ordenar por
                    <select id="public-asig-sort">
                        <option value="nombre" ${state.publicAsignaturaSort === "nombre" ? "selected" : ""}>Nombre</option>
                        <option value="categoria" ${state.publicAsignaturaSort === "categoria" ? "selected" : ""}>Titulacion</option>
                        <option value="horas" ${state.publicAsignaturaSort === "horas" ? "selected" : ""}>Horas</option>
                        <option value="pendientes" ${state.publicAsignaturaSort === "pendientes" ? "selected" : ""}>Horas pendientes</option>
                    </select>
                </label>
            </div>
            <div class="segmented-control public-state-filter" role="group" aria-label="Estado del reparto de asignaturas">
                <button class="${(state.publicAsignaturaEstado || "all") === "all" ? "active" : ""}" data-public-asig-state="all" type="button">Mostrar todo</button>
                <button class="${state.publicAsignaturaEstado === "assigned" ? "active" : ""}" data-public-asig-state="assigned" type="button">Solo repartidas</button>
                <button class="${state.publicAsignaturaEstado === "pending" ? "active" : ""}" data-public-asig-state="pending" type="button">No repartidas</button>
            </div>
            <div class="table-shell">
                <table class="table teacher-table">
                    <thead>
                        <tr><th>Asignatura</th><th>Codigo</th><th>Titulacion</th><th>Horas</th><th>Repartidas</th><th>Numero de sesiones</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? `<tr><td colspan="7" class="empty-cell">No hay asignaturas visibles.</td></tr>` : rows.map((asignatura) => {
        const status = asignaturaStatus(state, asignatura);
        return `
                            <tr>
                                <td>
                                    <button class="link-button subject-name-button" data-public-asig-detail="${escapeHtml(asignatura.id)}" type="button">
                                        ${escapeHtml(asignatura.nombre || asignatura.id)}
                                    </button>
                                </td>
                                <td><span class="subject-code">${escapeHtml(asignatura.codigoReferencia || "")}</span></td>
                                <td><span class="badge">${escapeHtml(categoriaNombre(state, asignatura.categoriaId))}</span></td>
                                <td><span class="num-pill">${status.total}</span></td>
                                <td><span class="num-pill muted-pill">${status.assigned}</span></td>
                                <td><span class="num-pill muted-pill">${totalSesionesAsignatura(asignatura)}</span></td>
                                <td><span class="badge ${status.complete ? "" : "danger-badge"}">${status.complete ? "Completa" : `${status.pending} horas pendientes de repartir`}</span></td>
                            </tr>
                        `;
    }).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function renderPublicAsignaturaDetailModal(state) {
    const asignatura = state.asignaturas.find((item) => item.id === state.publicDetailAsignaturaId);
    if (!asignatura) {
        return "";
    }
    const status = asignaturaStatus(state, asignatura);
    const subgrupos = filteredSubgruposForPublicModal(state, asignatura);
    return `
        <div class="modal-backdrop" id="public-asig-detail-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="public-asig-detail-title">
                <div class="modal-header">
                    <div>
                        <h2 id="public-asig-detail-title">${escapeHtml(asignatura.nombre || "Asignatura")}</h2>
                        <p class="status">
                            ${escapeHtml(categoriaNombre(state, asignatura.categoriaId))}
                            ${asignatura.codigoReferencia ? ` &middot; Codigo ${escapeHtml(asignatura.codigoReferencia)}` : ""}
                        </p>
                    </div>
                    <button class="secondary mini" id="close-public-asig-detail-btn" type="button">Cerrar</button>
                </div>

                <div class="grid grid-3 compact-stats">
                    <div class="metric-box"><span>Horas</span><strong>${status.total}</strong></div>
                    <div class="metric-box"><span>Repartidas</span><strong>${status.assigned}</strong></div>
                    <div class="metric-box"><span>Pendientes</span><strong>${status.pending}</strong></div>
                </div>

                <div class="filter-bar public-modal-filters">
                    <label>
                        Buscar subgrupo
                        <input id="public-subgrupo-filter" value="${escapeHtml(state.publicSubgrupoFilter || "")}" placeholder="Nombre, id o codigo" />
                    </label>
                    <label>
                        Cuatrimestre
                        <select id="public-subgrupo-cuatrimestre">
                            <option value="">Todos</option>
                            ${CUATRIMESTRES.map((cuatrimestre) => `
                                <option value="${escapeHtml(cuatrimestre.value)}" ${state.publicSubgrupoCuatrimestre === cuatrimestre.value ? "selected" : ""}>${cuatrimestre.label}</option>
                            `).join("")}
                        </select>
                    </label>
                    <label>
                        Tipo
                        <select id="public-subgrupo-tipo">
                            <option value="">Todos</option>
                            ${TIPOS_SUBGRUPO.map((tipo) => `
                                <option value="${escapeHtml(tipo.value)}" ${state.publicSubgrupoTipo === tipo.value ? "selected" : ""}>${tipo.label}</option>
                            `).join("")}
                        </select>
                    </label>
                </div>
                <div class="segmented-control public-state-filter" role="group" aria-label="Estado del reparto de subgrupos">
                    <button class="${(state.publicSubgrupoEstado || "all") === "all" ? "active" : ""}" data-public-subgrupo-state="all" type="button">Todos</button>
                    <button class="${state.publicSubgrupoEstado === "assigned" ? "active" : ""}" data-public-subgrupo-state="assigned" type="button">Escogidos</button>
                    <button class="${state.publicSubgrupoEstado === "pending" ? "active" : ""}" data-public-subgrupo-state="pending" type="button">Por escoger</button>
                </div>

                <div class="table-shell compact-table">
                    <table class="table teacher-table">
                        <thead>
                            <tr>
                                <th>Subgrupo</th>
                                <th>Horas</th>
                                <th>Asignadas</th>
                                <th>Profesores</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(asignatura.subgrupos || []).length === 0 ? `
                                <tr><td colspan="4" class="empty-cell">Esta asignatura no tiene subgrupos.</td></tr>
                            ` : subgrupos.length === 0 ? `
                                <tr><td colspan="4" class="empty-cell">No hay subgrupos que coincidan con los filtros.</td></tr>
                            ` : subgrupos.map((subgrupo) => {
        const total = toPositiveNumber(subgrupo.creditos, 0);
        const assigned = assignedForSubgrupo(state, asignatura.id, subgrupo.id);
        const assignments = assignmentsForSubgrupo(state, asignatura.id, subgrupo.id);
        return `
                                <tr>
                                    <td>
                                        <strong>${escapeHtml(subgrupo.nombre || subgrupo.id)}</strong>
                                        <small class="muted-line">${escapeHtml(subgrupo.id || "")}${subgrupo.tipo ? ` &middot; ${escapeHtml(subgrupo.tipo)}` : ""}</small>
                                    </td>
                                    <td><span class="num-pill">${total}</span></td>
                                    <td><span class="num-pill ${assigned < total ? "danger-pill" : "muted-pill"}">${assigned}</span></td>
                                    <td>
                                        ${assignments.length === 0 ? `<span class="empty-cell">Sin profesores asignados</span>` : assignments.map(({ item, profesor }) => `
                                            <span class="badge">${escapeHtml(professorName(profesor))}: ${toPositiveNumber(item.creditos, 0)}</span>
                                        `).join(" ")}
                                    </td>
                                </tr>
                            `;
    }).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

function assignmentsByProfessor(state) {
    const reajuste = calcularReajusteDocente(state);
    const objetivosByProfesor = new Map(reajuste.profesoresDetalle.map((item) => [item.profesor.id, item.objetivoReal]));
    return state.profesores.map((profesor) => {
        const items = state.docencia
            .filter((item) => item.profesorId === profesor.id)
            .map((item) => {
                const asignatura = state.asignaturas.find((a) => a.id === item.asignaturaId);
                const subgrupo = asignatura?.subgrupos?.find((s) => s.id === item.subgrupoId);
                return { item, asignatura, subgrupo };
            })
            .filter((entry) => entry.asignatura && entry.subgrupo);
        const specialCredits = profesorSpecialWorkCredits(state, profesor.id);
        const targetCredits = Number(toPositiveNumber(objetivosByProfesor.get(profesor.id), 0).toFixed(2));
        return { profesor, items, specialCredits, targetCredits };
    });
}

function assignmentsBySubject(state) {
    return state.asignaturas.map((asignatura) => {
        const items = state.docencia
            .filter((item) => item.asignaturaId === asignatura.id)
            .map((item) => ({
                item,
                profesor: state.profesores.find((profesor) => profesor.id === item.profesorId),
                subgrupo: asignatura.subgrupos?.find((s) => s.id === item.subgrupoId),
            }))
            .filter((entry) => entry.profesor && entry.subgrupo);
        return { asignatura, items };
    });
}

function renderRepartoTab(state) {
    const text = (state.publicRepartoFilter || "").trim().toLowerCase();
    const byProfessor = state.publicRepartoMode !== "asignatura";
    const rows = byProfessor
        ? assignmentsByProfessor(state).filter(({ profesor, items, specialCredits, targetCredits }) => {
            const specialLabel = toPositiveNumber(specialCredits, 0) > 0 ? "TFG TFM practicas de empresa" : "";
            const haystack = [professorName(profesor), profesor.id, specialLabel, String(targetCredits), ...items.map(({ asignatura }) => asignatura.nombre)].join(" ").toLowerCase();
            return !text || haystack.includes(text);
        }).sort((a, b) => professorName(a.profesor).localeCompare(professorName(b.profesor), "es", { sensitivity: "base" }))
        : assignmentsBySubject(state).filter(({ asignatura, items }) => {
            const haystack = [asignatura.nombre, asignatura.codigoReferencia, ...items.map(({ profesor }) => professorName(profesor))].join(" ").toLowerCase();
            return !text || haystack.includes(text);
        }).sort((a, b) => String(a.asignatura.nombre || "").localeCompare(String(b.asignatura.nombre || ""), "es", { sensitivity: "base" }));

    return `
        <section class="card public-section">
            <div class="filter-bar">
                <label>
                    Vista
                    <select id="public-reparto-mode">
                        <option value="profesor" ${byProfessor ? "selected" : ""}>Por profesor</option>
                        <option value="asignatura" ${!byProfessor ? "selected" : ""}>Por asignatura</option>
                    </select>
                </label>
                <label>
                    Filtrar reparto
                    <input id="public-reparto-filter" value="${escapeHtml(state.publicRepartoFilter || "")}" placeholder="Profesor, asignatura o codigo" />
                </label>
            </div>
            <div class="public-reparto-list">
                ${rows.length === 0 ? `<div class="empty-state-block">No hay reparto visible.</div>` : rows.map((row) => byProfessor ? renderProfessorAssignmentCard(row) : renderSubjectAssignmentCard(row)).join("")}
            </div>
        </section>
    `;
}

function renderProfessorAssignmentCard({ profesor, items, specialCredits, targetCredits }) {
    const teachingCredits = Number(items.reduce((sum, { item }) => sum + toPositiveNumber(item.creditos, 0), 0).toFixed(2));
    const total = Number((teachingCredits + toPositiveNumber(specialCredits, 0)).toFixed(2));
    return `
        <article class="public-assignment-card">
            <header><strong>${escapeHtml(professorName(profesor))}</strong><span>${total} horas / ${targetCredits} horas</span></header>
            ${items.length === 0 && toPositiveNumber(specialCredits, 0) <= 0 ? `<p class="status">Sin docencia asignada.</p>` : `
                <ul>
                    ${items.map(({ item, asignatura, subgrupo }) => `
                        <li><span>${escapeHtml(asignatura.nombre)} · ${escapeHtml(subgrupo.nombre || subgrupo.id)}</span><strong>${toPositiveNumber(item.creditos, 0)}</strong></li>
                    `).join("")}
                    ${toPositiveNumber(specialCredits, 0) > 0 ? `
                        <li><span>TFG, TFM y practicas de empresa</span><strong>${toPositiveNumber(specialCredits, 0)}</strong></li>
                    ` : ""}
                </ul>
            `}
        </article>
    `;
}

function renderSubjectAssignmentCard({ asignatura, items }) {
    const total = Number(items.reduce((sum, { item }) => sum + toPositiveNumber(item.creditos, 0), 0).toFixed(2));
    return `
        <article class="public-assignment-card">
            <header><strong>${escapeHtml(asignatura.nombre || asignatura.id)}</strong><span>${total} horas</span></header>
            ${items.length === 0 ? `<p class="status">Sin profesores asignados.</p>` : `
                <ul>
                    ${items.map(({ item, profesor, subgrupo }) => `
                        <li><span>${escapeHtml(subgrupo.nombre || subgrupo.id)} · ${escapeHtml(professorName(profesor))}</span><strong>${toPositiveNumber(item.creditos, 0)}</strong></li>
                    `).join("")}
                </ul>
            `}
        </article>
    `;
}

function publicHorarioAsignaturasConSesiones(state) {
    return (state.asignaturas || []).filter((asignatura) => totalSesionesAsignatura(asignatura) > 0);
}

function publicHorarioSelectionMap(state) {
    return state.publicHorarioSelectedAsignaturas && typeof state.publicHorarioSelectedAsignaturas === "object"
        ? state.publicHorarioSelectedAsignaturas
        : null;
}

function ensurePublicHorarioSelection(state) {
    if (!publicHorarioSelectionMap(state)) {
        state.publicHorarioSelectedAsignaturas = Object.fromEntries(
            publicHorarioAsignaturasConSesiones(state).map((asignatura) => [asignatura.id, true]),
        );
    }
    return state.publicHorarioSelectedAsignaturas;
}

function publicHorarioAsignaturaVisible(state, asignatura) {
    const selection = publicHorarioSelectionMap(state);
    return selection ? selection[asignatura.id] === true : true;
}

function publicHorarioTree(state) {
    const byCategory = new Map();
    publicHorarioAsignaturasConSesiones(state).forEach((asignatura) => {
        const categoriaId = asignatura.categoriaId || "__sin_categoria__";
        if (!byCategory.has(categoriaId)) {
            byCategory.set(categoriaId, {
                id: categoriaId,
                nombre: categoriaNombre(state, asignatura.categoriaId),
                asignaturas: [],
            });
        }
        byCategory.get(categoriaId).asignaturas.push(asignatura);
    });

    return [...byCategory.values()]
        .map((category) => ({
            ...category,
            asignaturas: category.asignaturas.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" })),
        }))
        .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" }));
}

function renderPublicHorarioTree(state) {
    const tree = publicHorarioTree(state);
    if (tree.length === 0) {
        return `<p class="empty-cell">No hay asignaturas con sesiones importadas.</p>`;
    }

    return tree.map((category) => {
        const expanded = state.publicHorarioExpandedCategorias?.[category.id] !== false;
        const selectedCount = category.asignaturas.filter((asignatura) => publicHorarioAsignaturaVisible(state, asignatura)).length;
        return `
            <section class="calendar-category">
                <div class="public-horario-category-row">
                    <button class="calendar-expand" data-public-horario-category="${escapeHtml(category.id)}" type="button" aria-label="${expanded ? "Contraer" : "Expandir"} grado">${expanded ? "⌄" : "›"}</button>
                    <span>
                        <strong>${escapeHtml(category.nombre)}</strong>
                        <small>${selectedCount} / ${category.asignaturas.length} asignaturas visibles</small>
                    </span>
                </div>
                ${expanded ? `
                    <div class="calendar-subject-list">
                        ${category.asignaturas.map((asignatura) => `
                            <label class="public-horario-subject-row">
                                <input data-public-horario-asignatura="${escapeHtml(asignatura.id)}" type="checkbox" ${publicHorarioAsignaturaVisible(state, asignatura) ? "checked" : ""} />
                                <span>
                                    <strong>${escapeHtml(asignatura.nombre || asignatura.id || "Asignatura")}</strong>
                                    <small>${totalSesionesAsignatura(asignatura)} sesiones</small>
                                </span>
                            </label>
                        `).join("")}
                    </div>
                ` : ""}
            </section>
        `;
    }).join("");
}

function publicCalendarEvents(state) {
    const events = [];
    state.asignaturas.forEach((asignatura) => {
        if (!publicHorarioAsignaturaVisible(state, asignatura)) {
            return;
        }
        (asignatura.subgrupos || []).forEach((subgrupo) => {
            sesionesSubgrupo(subgrupo).forEach((sesion, index) => {
                const date = sessionDate(sesion);
                if (!date || !sesion.horaInicio || !sesion.horaFin) return;
                const color = subgrupo.color || asignatura.color || "#0f766e";
                events.push({
                    id: `${asignatura.id}:${subgrupo.id}:${index}`,
                    title: `${asignatura.nombre} · ${subgrupo.id}`,
                    start: `${date}T${sesion.horaInicio}`,
                    end: `${date}T${sesion.horaFin}`,
                    backgroundColor: color,
                    borderColor: color,
                });
            });
        });
    });
    return events;
}

function isIsoDateInRange(isoDate, range) {
    return Boolean(isoDate) && isoDate >= range.startIso && isoDate < range.endIso;
}

function initialPublicCalendarDate(state, events) {
    const range = academicCalendarRange(state.selectedCourse);
    const firstDate = events[0]?.start?.slice(0, 10);
    if (isIsoDateInRange(firstDate, range)) return firstDate;
    return range.startIso;
}

function parseIsoDate(isoDate) {
    const [year, month, day] = String(isoDate || "").split("-").map(Number);
    return year ? new Date(year, month - 1, day) : null;
}

function dateLabelLong(isoDate) {
    const date = parseIsoDate(isoDate);
    return date ? new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date) : isoDate;
}

function monthLabel(date) {
    return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(date);
}

function sameMonth(date, other) {
    return date.getFullYear() === other.getFullYear() && date.getMonth() === other.getMonth();
}

function rangeMonths(range) {
    const start = parseIsoDate(range.startIso);
    const end = parseIsoDate(range.endIso);
    const months = [];
    if (!start || !end) return months;
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor < end) {
        months.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
}

function startOfWeek(date) {
    const next = new Date(date);
    const offset = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - offset);
    return next;
}

function rangeWeeks(range) {
    const startDate = parseIsoDate(range.startIso);
    const end = parseIsoDate(range.endIso);
    const weeks = [];
    if (!startDate || !end) return weeks;
    const start = startOfWeek(startDate);
    const cursor = new Date(start);
    while (cursor < end) {
        const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
        weeks.push(days);
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

function eventsByDate(items) {
    const grouped = new Map();
    items.forEach((item) => {
        const current = grouped.get(item.date) || [];
        current.push(item);
        grouped.set(item.date, current);
    });
    grouped.forEach((itemsForDate) => {
        itemsForDate.sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
    });
    return grouped;
}

function printEventHtml(item) {
    const lugar = item.sesion.lugar ? ` · ${escapeHtml(item.sesion.lugar)}` : "";
    return `
        <div class="pdf-event" style="border-left-color:${escapeHtml(item.event.backgroundColor || "#0f766e")}">
            <strong>${escapeHtml(minutesLabel(item.startMinutes))}-${escapeHtml(minutesLabel(item.endMinutes))}</strong>
            <span>${escapeHtml(item.event.title)}${lugar}</span>
        </div>
    `;
}

function renderPrintableMonth(monthDate, byDate, range) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
    return `
        <section class="pdf-page">
            <h1>${escapeHtml(monthLabel(monthDate))}</h1>
            <div class="pdf-month-grid">
                ${["lun", "mar", "mie", "jue", "vie", "sab", "dom"].map((day) => `<div class="pdf-weekday">${day}</div>`).join("")}
                ${days.map((day) => {
        const iso = toIsoDate(day);
        const events = byDate.get(iso) || [];
        const muted = !sameMonth(day, monthDate) || !isIsoDateInRange(iso, range);
        return `
                    <div class="pdf-month-day ${muted ? "muted" : ""}">
                        <strong>${day.getDate()}</strong>
                        ${events.map(printEventHtml).join("")}
                    </div>
                `;
    }).join("")}
            </div>
        </section>
    `;
}

function renderPrintableMiniMonth(monthDate, byDate, range) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
    return `
        <article class="pdf-mini-month">
            <h2>${escapeHtml(monthLabel(monthDate))}</h2>
            <div class="pdf-mini-month-grid">
                ${["L", "M", "X", "J", "V", "S", "D"].map((day) => `<div class="pdf-mini-weekday">${day}</div>`).join("")}
                ${days.map((day) => {
        const iso = toIsoDate(day);
        const events = byDate.get(iso) || [];
        const muted = !sameMonth(day, monthDate) || !isIsoDateInRange(iso, range);
        return `
                    <div class="pdf-mini-day ${muted ? "muted" : ""} ${events.length > 0 ? "has-events" : ""}">
                        <strong>${day.getDate()}</strong>
                        ${events.length > 0 ? `<span>${events.length}</span>` : ""}
                    </div>
                `;
    }).join("")}
            </div>
        </article>
    `;
}

function renderPrintableSemester(title, months, byDate, range) {
    const eventsByMonth = months.map((month) => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        const rows = [];
        const cursor = new Date(monthStart);
        while (cursor < nextMonth) {
            const iso = toIsoDate(cursor);
            const events = byDate.get(iso) || [];
            events.forEach((event) => rows.push(event));
            cursor.setDate(cursor.getDate() + 1);
        }
        return { month, events: rows };
    });
    const totalEvents = eventsByMonth.reduce((sum, item) => sum + item.events.length, 0);
    const flatEvents = eventsByMonth.flatMap(({ month, events }) => events.map((event) => ({ month, event })));
    const eventPages = [];
    for (let i = 0; i < flatEvents.length; i += 44) {
        eventPages.push(flatEvents.slice(i, i + 44));
    }
    const summaryPage = `
        <section class="pdf-page pdf-semester-page">
            <h1>${escapeHtml(title)}</h1>
            <div class="pdf-semester-layout">
                <div class="pdf-semester-grid">
                    ${months.map((month) => renderPrintableMiniMonth(month, byDate, range)).join("")}
                </div>
                <div class="pdf-semester-overview">
                    <h2>Resumen</h2>
                    <p>${totalEvents === 0 ? "Sin eventos en este cuatrimestre." : `${totalEvents} eventos en este cuatrimestre.`}</p>
                    ${eventsByMonth.map(({ month, events }) => `
                        <div class="pdf-semester-count">
                            <strong>${escapeHtml(monthLabel(month))}</strong>
                            <span>${events.length} eventos</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        </section>
    `;
    if (eventPages.length === 0) {
        return summaryPage;
    }
    const detailPages = eventPages.map((pageEvents, index) => `
        <section class="pdf-page pdf-semester-detail-page">
            <h1>${escapeHtml(title)} · eventos ${index + 1}/${eventPages.length}</h1>
            <div class="pdf-semester-events">
                ${pageEvents.map(({ month, event }) => `
                    <div class="pdf-semester-event">
                        <strong>${escapeHtml(monthLabel(month))} · ${escapeHtml(formatIsoDateEs(event.date))} · ${escapeHtml(minutesLabel(event.startMinutes))}-${escapeHtml(minutesLabel(event.endMinutes))}</strong>
                        <span>${escapeHtml(event.event.title)}${event.sesion.lugar ? ` · ${escapeHtml(event.sesion.lugar)}` : ""}</span>
                    </div>
                `).join("")}
            </div>
        </section>
    `).join("");
    return `${summaryPage}${detailPages}`;
}

function renderPrintableWeekBlock(days, byDate, range) {
    const visibleDays = days.filter((day) => isIsoDateInRange(toIsoDate(day), range));
    const title = visibleDays.length > 0
        ? `${dateLabelLong(toIsoDate(visibleDays[0]))} - ${dateLabelLong(toIsoDate(visibleDays[visibleDays.length - 1]))}`
        : `${dateLabelLong(toIsoDate(days[0]))} - ${dateLabelLong(toIsoDate(days[6]))}`;
    return `
        <div class="pdf-week-block">
            <h1>Semana: ${escapeHtml(title)}</h1>
            <div class="pdf-week-grid">
                ${days.map((day) => {
        const iso = toIsoDate(day);
        const events = byDate.get(iso) || [];
        return `
                    <div class="pdf-week-day ${isIsoDateInRange(iso, range) ? "" : "muted"}">
                        <h2>${escapeHtml(dateLabelLong(iso))}</h2>
                        ${events.length === 0 ? `<p>Sin eventos</p>` : events.map(printEventHtml).join("")}
                    </div>
                `;
    }).join("")}
            </div>
        </div>
    `;
}

function renderPrintableWeekPage(weeks, byDate, range) {
    return `
        <section class="pdf-page pdf-week-page">
            ${weeks.map((week) => renderPrintableWeekBlock(week, byDate, range)).join("")}
        </section>
    `;
}

function renderPrintableDayListPage(entries, pageIndex, totalPages) {
    return `
        <section class="pdf-page pdf-day-page">
            <h1>Listado diario ${pageIndex + 1}/${totalPages}</h1>
            <div class="pdf-day-list">
                ${entries.map(({ date, event, showDate }) => `
                    <div class="pdf-day-list-row">
                        ${showDate ? `<h2>${escapeHtml(dateLabelLong(date))}</h2>` : ""}
                        ${printEventHtml(event)}
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

function renderPrintableDayList(dates, byDate) {
    const entries = dates.flatMap((date) => {
        const events = byDate.get(date) || [];
        return events.map((event, index) => ({ date, event, showDate: index === 0 }));
    });
    if (entries.length === 0) {
        return `<section class="pdf-page"><h1>Listado diario</h1><p>No hay eventos visibles.</p></section>`;
    }
    const pages = [];
    for (let i = 0; i < entries.length; i += 54) {
        pages.push(entries.slice(i, i + 54));
    }
    return pages.map((pageEntries, index) => renderPrintableDayListPage(pageEntries, index, pages.length)).join("");
}

function printableCalendarHtml(state) {
    const profesor = state.profesores.find((item) => item.id === state.publicProfesorCalendarId);
    const range = academicCalendarRange(state.selectedCourse);
    const items = profesorCalendarItems(state);
    const byDate = eventsByDate(items);
    const view = state.publicProfesorCalendarView || "timeGridWeek";
    const title = `Calendario de ${profesor ? professorName(profesor) : "profesor"} · ${state.selectedCourse || ""}`;
    let pages = "";
    if (view === "timeGridWeek") {
        const weeks = rangeWeeks(range);
        const weekPages = [];
        for (let i = 0; i < weeks.length; i += 2) {
            weekPages.push(weeks.slice(i, i + 2));
        }
        pages = weekPages.map((pageWeeks) => renderPrintableWeekPage(pageWeeks, byDate, range)).join("");
    } else if (view === "timeGridDay") {
        const dates = [...byDate.keys()].sort();
        pages = dates.length === 0
            ? `<section class="pdf-page"><h1>${escapeHtml(title)}</h1><p>No hay eventos visibles.</p></section>`
            : renderPrintableDayList(dates, byDate);
    } else if (view === "academicYear") {
        const months = rangeMonths(range);
        pages = [
            renderPrintableSemester("Primer cuatrimestre", months.slice(0, 5), byDate, range),
            renderPrintableSemester("Segundo cuatrimestre", months.slice(5, 10), byDate, range),
        ].join("");
    } else {
        pages = rangeMonths(range).map((month) => renderPrintableMonth(month, byDate, range)).join("");
    }
    return `
        <!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8" />
            <title>${escapeHtml(title)}</title>
            <style>
                * { box-sizing: border-box; }
                html, body { width: 100%; margin: 0; padding: 0; color: #17242b; font-family: Arial, sans-serif; }
                .pdf-page { width: 100%; height: 198mm; padding: 0; break-after: page; page-break-after: always; overflow: hidden; }
                .pdf-page:last-child { break-after: auto; page-break-after: auto; }
                h1 { margin: 0 0 5mm; font-size: 18px; line-height: 1.15; }
                h2 { margin: 0 0 5px; font-size: 12px; text-transform: capitalize; }
                .pdf-month-grid { display: grid; width: 100%; height: 184mm; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: 8mm repeat(6, minmax(0, 1fr)); border: 1px solid #cbd5e1; }
                .pdf-weekday { padding: 6px; background: #e2e8f0; border-right: 1px solid #cbd5e1; font-weight: 700; text-align: center; text-transform: uppercase; font-size: 11px; }
                .pdf-month-day { min-height: 0; padding: 4px; border-top: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; overflow: hidden; }
                .pdf-month-day > strong { display: block; margin-bottom: 4px; font-size: 12px; }
                .muted { background: #f8fafc; color: #94a3b8; }
                .pdf-event { margin: 2px 0; padding: 2px 4px; border-left: 4px solid #0f766e; background: #f8fafc; font-size: 9px; line-height: 1.2; break-inside: avoid; page-break-inside: avoid; }
                .pdf-event strong { display: block; color: #0f172a; }
                .pdf-event span { display: block; }
                .pdf-week-page { display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 5mm; }
                .pdf-week-block { min-height: 0; overflow: hidden; }
                .pdf-week-block h1 { margin-bottom: 2mm; font-size: 13px; }
                .pdf-week-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2mm; height: calc(100% - 8mm); align-items: stretch; }
                .pdf-week-day { min-width: 0; border: 1px solid #cbd5e1; border-radius: 8px; padding: 5px; min-height: 0; overflow: hidden; }
                .pdf-week-day h2 { font-size: 8px; line-height: 1.12; margin-bottom: 3px; }
                .pdf-week-day .pdf-event { font-size: 7px; line-height: 1.12; margin: 1px 0; padding: 1px 3px; border-left-width: 3px; }
                .pdf-week-day p { margin: 0; color: #64748b; font-size: 9px; }
                .pdf-day-list { height: 184mm; columns: 2; column-gap: 8mm; overflow: hidden; }
                .pdf-day-list-row { break-inside: avoid; page-break-inside: avoid; margin: 0 0 3px; }
                .pdf-day-list-row h2 { margin: 0 0 2px; padding: 2px 4px; background: #e2e8f0; border-radius: 5px; font-size: 9px; color: #0f172a; }
                .pdf-day-list .pdf-event { font-size: 8.4px; margin-bottom: 2px; }
                .pdf-semester-page h1 { margin-bottom: 4mm; }
                .pdf-semester-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.95fr); gap: 6mm; height: 184mm; min-height: 0; }
                .pdf-semester-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3mm; align-content: start; min-height: 0; }
                .pdf-mini-month { min-width: 0; }
                .pdf-mini-month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid #cbd5e1; }
                .pdf-mini-weekday { padding: 2px; background: #e2e8f0; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; text-align: center; font-size: 8px; font-weight: 700; }
                .pdf-mini-day { min-height: 8mm; padding: 2px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; font-size: 8px; position: relative; }
                .pdf-mini-day.has-events { background: #ecfdf5; color: #064e3b; }
                .pdf-mini-day span { position: absolute; right: 2px; bottom: 2px; min-width: 12px; border-radius: 999px; background: #0f766e; color: #fff; text-align: center; font-size: 7px; padding: 1px 3px; }
                .pdf-semester-overview { min-height: 0; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 8px; padding: 5mm; background: #f8fafc; }
                .pdf-semester-overview h2 { font-size: 13px; margin-bottom: 4mm; }
                .pdf-semester-overview p { margin: 0 0 4mm; color: #475569; font-size: 11px; }
                .pdf-semester-count { display: flex; justify-content: space-between; gap: 6mm; padding: 3mm 0; border-top: 1px solid #e2e8f0; font-size: 10px; }
                .pdf-semester-count strong { text-transform: capitalize; }
                .pdf-semester-events { height: 184mm; min-height: 0; overflow: hidden; columns: 2; column-gap: 7mm; }
                .pdf-semester-month-events { break-inside: avoid; page-break-inside: avoid; margin: 0 0 4px; }
                .pdf-semester-month-events h2 { font-size: 9px; margin: 0 0 2px; color: #0f172a; }
                .pdf-semester-month-events p { margin: 0 0 3px; color: #64748b; font-size: 8px; }
                .pdf-semester-event { break-inside: avoid; page-break-inside: avoid; margin: 0 0 3px; padding: 3px 4px; border-left: 3px solid #0f766e; background: #f8fafc; font-size: 8.4px; line-height: 1.18; }
                .pdf-semester-event strong,
                .pdf-semester-event span { display: block; }
                .pdf-more-events { margin: 0; font-size: 9px; color: #64748b; }
                @page { size: A4 landscape; margin: 6mm; }
            </style>
        </head>
        <body>${pages}</body>
        </html>
    `;
}

function downloadProfessorCalendarPdf(state) {
    const popup = window.open("", "_blank");
    if (!popup) {
        window.print();
        return;
    }
    popup.document.open();
    popup.document.write(printableCalendarHtml(state));
    popup.document.close();
    popup.focus();
    popup.setTimeout(() => popup.print(), 250);
}

function renderPublicProfessorCalendar(state) {
    const target = document.getElementById("public-prof-calendar");
    if (!target || !globalThis.FullCalendar?.Calendar) return;
    const events = profesorCalendarItems(state).map((item) => item.event);
    const range = academicCalendarRange(state.selectedCourse);
    const view = state.publicProfesorCalendarView || "timeGridWeek";
    const diagnostics = professorOverlapDiagnostics(state);
    const calendar = new globalThis.FullCalendar.Calendar(target, {
        locale: "es",
        initialView: view,
        initialDate: view === "academicYear" ? range.startIso : initialPublicCalendarDate(state, events),
        validRange: {
            start: range.startIso,
            end: range.endIso,
        },
        views: {
            academicYear: {
                type: "multiMonth",
                duration: { months: 10 },
                multiMonthMaxColumns: 3,
            },
        },
        height: "auto",
        headerToolbar: {
            left: "prev,next",
            center: "title",
            right: "today",
        },
        buttonText: {
            today: "Hoy",
        },
        nowIndicator: true,
        eventDisplay: "block",
        events,
        dayCellClassNames(info) {
            return diagnostics.overlapDates.has(toIsoDate(info.date)) ? ["calendar-overlap-day"] : [];
        },
        dayHeaderClassNames(info) {
            return diagnostics.overlapDates.has(toIsoDate(info.date)) ? ["calendar-overlap-header"] : [];
        },
        eventClick(info) {
            const lugar = info.event.extendedProps.lugar ? ` · ${info.event.extendedProps.lugar}` : "";
            const marker = info.event.extendedProps.simulated ? "Simulado · " : "";
            state.status = `${marker}${info.event.title}${lugar}`;
        },
    });
    calendar.render();
}

function escapeIcsText(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function icsDateTime(value) {
    return String(value || "").replace(/[-:]/g, "").replace("T", "T").slice(0, 15) + "00";
}

function downloadTextFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function downloadProfessorCalendarIcs(state) {
    const profesor = state.profesores.find((item) => item.id === state.publicProfesorCalendarId);
    if (!profesor) return;
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//PlanDoc//Calendario publico//ES",
        "CALSCALE:GREGORIAN",
    ];
    profesorCalendarItems(state).forEach((item) => {
        lines.push(
            "BEGIN:VEVENT",
            `UID:${escapeIcsText(`${item.id}-${state.selectedCourse || "curso"}@plandoc`)}`,
            `DTSTART:${icsDateTime(item.event.start)}`,
            `DTEND:${icsDateTime(item.event.end)}`,
            `SUMMARY:${escapeIcsText(item.event.title)}`,
            item.sesion.lugar ? `LOCATION:${escapeIcsText(item.sesion.lugar)}` : "",
            `DESCRIPTION:${escapeIcsText(`${item.simulated ? "Docencia simulada" : "Docencia asignada"} · ${professorName(profesor)}`)}`,
            "END:VEVENT",
        );
    });
    lines.push("END:VCALENDAR");
    const slug = professorName(profesor).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "profesor";
    downloadTextFile(`calendario-${slug}.ics`, lines.filter(Boolean).join("\r\n"), "text/calendar;charset=utf-8");
}

function renderHorariosTab(state) {
    const events = publicCalendarEvents(state);
    const totalSubjects = publicHorarioAsignaturasConSesiones(state).length;
    return `
        <section class="card public-section">
            <div class="section-header">
                <div>
                    <h2>Horarios</h2>
                    <p class="status">${events.length} eventos visibles · ${totalSubjects} asignaturas con sesiones importadas.</p>
                </div>
                <div class="nav-tabs embedded-tabs public-calendar-tabs">
                    ${CALENDAR_VIEWS.map((view) => `<button class="tab ${state.publicCalendarView === view.value ? "active" : ""}" data-public-calendar-view="${view.value}" type="button">${view.label}</button>`).join("")}
                </div>
            </div>
            <div class="public-calendar-workspace with-sidebar">
                <aside class="form-section public-horario-panel">
                    <div class="form-section-title">
                        <span class="section-kicker">Asignaturas</span>
                        <h3>Filtrar horarios</h3>
                    </div>
                    <button id="public-horario-clear-selection-btn" class="secondary" type="button">Limpiar seleccion</button>
                    <div class="calendar-event-list">
                        ${renderPublicHorarioTree(state)}
                    </div>
                </aside>
                <div class="calendar-shell">
                    <div id="public-calendar"></div>
                    ${events.length === 0 ? `<p class="empty-cell">No hay eventos visibles.</p>` : ""}
                </div>
            </div>
        </section>
    `;
}

function renderActivePublicTab(state) {
    if (state.publicTab === "asignaturas") return renderAsignaturasTab(state);
    if (state.publicTab === "horarios") return renderHorariosTab(state);
    if (state.publicTab === "reparto") return renderRepartoTab(state);
    return renderProfesorTab(state);
}

export function renderPublicView(state) {
    const selectedCourse = state.courses.find((course) => course.id === state.selectedCourse);
    const reajuste = calcularReajusteDocente(state);
    return `
        <div class="container grid public-container">
            <header class="card app-header">
                <div>
                    <h1>PlanDoc publico</h1>
                    <p class="course-loaded">Curso: <strong>${escapeHtml(selectedCourse?.nombre || state.selectedCourse || "Sin curso")}</strong></p>
                    <p class="public-refresh-notice">Para ver datos actualizados, recarga esta pagina. La vista publica no se actualiza automaticamente.</p>
                    <p class="status">${escapeHtml(state.status)}</p>
                </div>
            </header>

            <div class="teacher-summary subject-summary">
                <div class="metric-box"><span>Profesores</span><strong>${state.profesores.length}</strong></div>
                <div class="metric-box"><span>Asignaturas</span><strong>${state.asignaturas.length}</strong></div>
                <div class="metric-box"><span>Horas a repartir</span><strong>${reajuste.totalCarga}</strong></div>
                <div class="metric-box"><span>Horas asignadas</span><strong>${reajuste.totalAsignado}</strong></div>
            </div>

            <nav class="card nav-tabs">
                ${PUBLIC_TABS.map((tab) => `<button class="tab ${state.publicTab === tab.id ? "active" : ""}" data-public-tab="${tab.id}" type="button">${tab.label}</button>`).join("")}
            </nav>

            ${renderActivePublicTab(state)}
            ${renderPublicAsignaturaDetailModal(state)}
            ${renderProfessorCalendarModal(state)}
        </div>
    `;
}

export function bindPublicEvents({ state, render }) {
    document.querySelectorAll("[data-public-tab]").forEach((btn) => {
        btn.onclick = () => {
            state.publicTab = btn.dataset.publicTab || "profesores";
            render();
        };
    });

    const bindFilter = (id, apply) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.onchange = () => {
            apply(input.value);
            render();
        };
        input.onkeydown = (e) => {
            if (e.key === "Enter") {
                apply(input.value);
                render();
            }
        };
    };

    bindFilter("public-prof-filter", (value) => { state.publicProfesorFilter = value; });
    const profSort = document.getElementById("public-prof-sort");
    if (profSort) profSort.onchange = () => { state.publicProfesorSort = profSort.value; render(); };
    document.querySelectorAll("[data-public-prof-calendar]").forEach((btn) => {
        btn.onclick = () => {
            state.publicProfesorCalendarId = btn.dataset.publicProfCalendar || "";
            state.publicProfesorCalendarView = "timeGridWeek";
            state.publicSimulationMode = false;
            state.publicSimulatedSubgroups = [];
            state.publicSimulationExpandedAsignaturas = {};
            render();
        };
    });
    const closePublicProfCalendarBtn = document.getElementById("close-public-prof-calendar-btn");
    if (closePublicProfCalendarBtn) {
        closePublicProfCalendarBtn.onclick = () => {
            state.publicProfesorCalendarId = "";
            state.publicSimulationMode = false;
            state.publicSimulatedSubgroups = [];
            state.publicSimulationExpandedAsignaturas = {};
            render();
        };
    }
    const publicProfCalendarBackdrop = document.getElementById("public-prof-calendar-backdrop");
    if (publicProfCalendarBackdrop) {
        publicProfCalendarBackdrop.onclick = (e) => {
            if (e.target === publicProfCalendarBackdrop) {
                state.publicProfesorCalendarId = "";
                state.publicSimulationMode = false;
                state.publicSimulatedSubgroups = [];
                state.publicSimulationExpandedAsignaturas = {};
                render();
            }
        };
    }
    document.querySelectorAll("[data-public-prof-calendar-view]").forEach((btn) => {
        btn.onclick = () => {
            state.publicProfesorCalendarView = btn.dataset.publicProfCalendarView || "timeGridWeek";
            render();
        };
    });
    const simToggle = document.getElementById("public-prof-sim-toggle");
    if (simToggle) {
        simToggle.onclick = () => {
            state.publicSimulationMode = !state.publicSimulationMode;
            if (!state.publicSimulationMode) {
                state.publicSimulatedSubgroups = [];
                state.publicSimulationExpandedAsignaturas = {};
            }
            render();
        };
    }
    document.querySelectorAll("[data-public-sim-subgroup]").forEach((input) => {
        input.onchange = () => {
            const key = input.dataset.publicSimSubgroup;
            const selected = new Set(state.publicSimulatedSubgroups || []);
            if (input.checked) {
                selected.add(key);
            } else {
                selected.delete(key);
            }
            state.publicSimulatedSubgroups = [...selected];
            render();
        };
    });
    document.querySelectorAll("[data-public-sim-expand]").forEach((btn) => {
        btn.onclick = () => {
            const id = btn.dataset.publicSimExpand;
            state.publicSimulationExpandedAsignaturas = {
                ...(state.publicSimulationExpandedAsignaturas || {}),
                [id]: state.publicSimulationExpandedAsignaturas?.[id] !== true,
            };
            render();
        };
    });
    document.querySelectorAll("[data-public-sim-asignatura]").forEach((input) => {
        const asignaturaId = input.dataset.publicSimAsignatura;
        const keys = availableSimulationSubgroups(state)
            .filter(({ asignatura }) => asignatura.id === asignaturaId)
            .map(({ key }) => key);
        const selected = new Set(state.publicSimulatedSubgroups || []);
        const selectedCount = keys.filter((key) => selected.has(key)).length;
        input.indeterminate = selectedCount > 0 && selectedCount < keys.length;
        input.onchange = () => {
            const next = new Set(state.publicSimulatedSubgroups || []);
            keys.forEach((key) => {
                if (input.checked) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
            });
            state.publicSimulatedSubgroups = [...next];
            render();
        };
    });
    const pdfBtn = document.getElementById("download-prof-calendar-pdf");
    if (pdfBtn) {
        pdfBtn.onclick = () => downloadProfessorCalendarPdf(state);
    }
    const icsBtn = document.getElementById("download-prof-calendar-ics");
    if (icsBtn) {
        icsBtn.onclick = () => downloadProfessorCalendarIcs(state);
    }
    bindFilter("public-asig-filter", (value) => { state.publicAsignaturaFilter = value; });
    const asigSort = document.getElementById("public-asig-sort");
    if (asigSort) asigSort.onchange = () => { state.publicAsignaturaSort = asigSort.value; render(); };
    const asigCategory = document.getElementById("public-asig-category");
    if (asigCategory) asigCategory.onchange = () => { state.publicAsignaturaCategoria = asigCategory.value; render(); };
    const asigCuatrimestre = document.getElementById("public-asig-cuatrimestre");
    if (asigCuatrimestre) asigCuatrimestre.onchange = () => { state.publicAsignaturaCuatrimestre = asigCuatrimestre.value; render(); };
    document.querySelectorAll("[data-public-asig-state]").forEach((btn) => {
        btn.onclick = () => {
            state.publicAsignaturaEstado = btn.dataset.publicAsigState || "all";
            render();
        };
    });
    document.querySelectorAll("[data-public-asig-detail]").forEach((btn) => {
        btn.onclick = () => {
            state.publicDetailAsignaturaId = btn.dataset.publicAsigDetail || "";
            state.publicSubgrupoFilter = "";
            state.publicSubgrupoTipo = "";
            state.publicSubgrupoCuatrimestre = "";
            state.publicSubgrupoEstado = "all";
            render();
        };
    });
    const closePublicAsigDetailBtn = document.getElementById("close-public-asig-detail-btn");
    if (closePublicAsigDetailBtn) {
        closePublicAsigDetailBtn.onclick = () => {
            state.publicDetailAsignaturaId = "";
            render();
        };
    }
    const publicAsigDetailBackdrop = document.getElementById("public-asig-detail-backdrop");
    if (publicAsigDetailBackdrop) {
        publicAsigDetailBackdrop.onclick = (e) => {
            if (e.target === publicAsigDetailBackdrop) {
                state.publicDetailAsignaturaId = "";
                render();
            }
        };
    }
    bindFilter("public-subgrupo-filter", (value) => { state.publicSubgrupoFilter = value; });
    const subgrupoTipo = document.getElementById("public-subgrupo-tipo");
    if (subgrupoTipo) subgrupoTipo.onchange = () => { state.publicSubgrupoTipo = subgrupoTipo.value; render(); };
    const subgrupoCuatrimestre = document.getElementById("public-subgrupo-cuatrimestre");
    if (subgrupoCuatrimestre) subgrupoCuatrimestre.onchange = () => { state.publicSubgrupoCuatrimestre = subgrupoCuatrimestre.value; render(); };
    document.querySelectorAll("[data-public-subgrupo-state]").forEach((btn) => {
        btn.onclick = () => {
            state.publicSubgrupoEstado = btn.dataset.publicSubgrupoState || "all";
            render();
        };
    });
    const repartoMode = document.getElementById("public-reparto-mode");
    if (repartoMode) repartoMode.onchange = () => { state.publicRepartoMode = repartoMode.value; render(); };
    bindFilter("public-reparto-filter", (value) => { state.publicRepartoFilter = value; });

    const clearHorarioSelectionBtn = document.getElementById("public-horario-clear-selection-btn");
    if (clearHorarioSelectionBtn) {
        clearHorarioSelectionBtn.onclick = () => {
            state.publicHorarioSelectedAsignaturas = {};
            render();
        };
    }

    document.querySelectorAll("[data-public-horario-category]").forEach((btn) => {
        btn.onclick = () => {
            const id = btn.dataset.publicHorarioCategory;
            state.publicHorarioExpandedCategorias = {
                ...(state.publicHorarioExpandedCategorias || {}),
                [id]: state.publicHorarioExpandedCategorias?.[id] === false,
            };
            render();
        };
    });

    document.querySelectorAll("[data-public-horario-asignatura]").forEach((input) => {
        input.onchange = () => {
            const selection = ensurePublicHorarioSelection(state);
            selection[input.dataset.publicHorarioAsignatura] = input.checked;
            render();
        };
    });

    document.querySelectorAll("[data-public-calendar-view]").forEach((btn) => {
        btn.onclick = () => {
            state.publicCalendarView = btn.dataset.publicCalendarView || "timeGridWeek";
            render();
        };
    });

    if (state.publicTab === "horarios" && window.FullCalendar && document.getElementById("public-calendar")) {
        const range = academicCalendarRange(state.selectedCourse);
        const calendar = new window.FullCalendar.Calendar(document.getElementById("public-calendar"), {
            initialView: state.publicCalendarView || "timeGridWeek",
            initialDate: (state.publicCalendarView || "timeGridWeek") === "academicYear" ? range.startIso : initialPublicCalendarDate(state, publicCalendarEvents(state)),
            validRange: {
                start: range.startIso,
                end: range.endIso,
            },
            views: {
                academicYear: {
                    type: "multiMonth",
                    duration: { months: 10 },
                    multiMonthMaxColumns: 3,
                },
            },
            locale: "es",
            height: "auto",
            events: publicCalendarEvents(state),
            headerToolbar: { left: "prev,next", center: "title", right: "today" },
            buttonText: { today: "Hoy" },
        });
        calendar.render();
    }

    if (state.publicProfesorCalendarId) {
        renderPublicProfessorCalendar(state);
    }
}
