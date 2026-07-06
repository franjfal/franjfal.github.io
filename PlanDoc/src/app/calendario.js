import { escapeHtml } from "./utils.js";

const CALENDAR_VIEWS = [
    { value: "timeGridDay", label: "Dia" },
    { value: "timeGridWeek", label: "Semana" },
    { value: "dayGridMonth", label: "Mes" },
    { value: "academicYear", label: "Año" },
];

const DAY_INDEX = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    dijous: 4,
    jueves: 4,
    divendres: 5,
    viernes: 5,
    dissabte: 6,
    sabado: 6,
    sábado: 6,
    dilluns: 1,
    dimarts: 2,
    dimecres: 3,
    diumenge: 0,
};

function hashText(text) {
    return [...String(text || "")].reduce((sum, char) => ((sum << 5) - sum + char.charCodeAt(0)) >>> 0, 0);
}

function hslToHex(hue, saturation, lightness) {
    const s = saturation / 100;
    const l = lightness / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - c / 2;
    const [r, g, b] = hue < 60 ? [c, x, 0]
        : hue < 120 ? [x, c, 0]
            : hue < 180 ? [0, c, x]
                : hue < 240 ? [0, x, c]
                    : hue < 300 ? [x, 0, c]
                        : [c, 0, x];
    return `#${[r, g, b].map((value) => Math.round((value + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function defaultColorFor(key) {
    return hslToHex(hashText(key) % 360, 64, 42);
}

function asignaturaColor(asignatura) {
    return asignatura.color || defaultColorFor(asignatura.id || asignatura.nombre);
}

function subgrupoColor(asignatura, subgrupo) {
    return subgrupo.color || asignaturaColor(asignatura);
}

function parseDateDMY(value) {
    const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        return null;
    }
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function academicCalendarRange(selectedCourse) {
    const courseText = String(selectedCourse || "");
    const years = [...courseText.matchAll(/(\d{4})/g)].map((match) => Number(match[1]));
    const today = new Date();
    const fallbackStartYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    const endYear = years.length >= 2 ? years[1] : (years[0] || fallbackStartYear + 1);
    const startYear = years.length >= 2 ? years[0] : endYear - 1;
    const start = new Date(startYear, 8, 1);
    const endInclusive = new Date(endYear, 5, 30);
    return {
        start,
        endInclusive,
        startIso: toIsoDate(start),
        endIso: toIsoDate(addDays(endInclusive, 1)),
        label: `Septiembre ${startYear} - junio ${endYear}`,
    };
}

function isIsoDateInRange(isoDate, range) {
    return Boolean(isoDate) && isoDate >= range.startIso && isoDate < range.endIso;
}

function normalizeDayName(value) {
    return String(value || "").trim().toLowerCase();
}

function sessionDate(sesion) {
    const start = parseDateDMY(sesion.franjaInicio);
    const end = parseDateDMY(sesion.franjaFin) || start;
    const target = DAY_INDEX[normalizeDayName(sesion.dia)];
    if (!start || target === undefined) {
        return null;
    }
    const cursor = new Date(start);
    for (let i = 0; i <= 7; i += 1) {
        if (cursor.getDay() === target && (!end || cursor <= end)) {
            return toIsoDate(cursor);
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return toIsoDate(start);
}

function calendarItems(state) {
    const range = academicCalendarRange(state.selectedCourse);
    const out = [];
    state.asignaturas.forEach((asignatura, asignaturaIndex) => {
        (asignatura.subgrupos || []).forEach((subgrupo, subgrupoIndex) => {
            subgrupoSessions(subgrupo).forEach((sesion, sesionIndex) => {
                const date = sessionDate(sesion);
                if (!date || !sesion.horaInicio || !sesion.horaFin) {
                    return;
                }
                if (!isIsoDateInRange(date, range)) {
                    return;
                }
                const key = `${asignaturaIndex}:${subgrupoIndex}:${sesionIndex}`;
                const color = subgrupoColor(asignatura, subgrupo);
                out.push({
                    key,
                    asignaturaIndex,
                    subgrupoIndex,
                    sesionIndex,
                    asignatura,
                    subgrupo,
                    sesion,
                    color,
                    visible: sesion.visible !== false,
                    event: {
                        id: key,
                        title: `${asignatura.nombre} · ${subgrupo.id}`,
                        start: `${date}T${sesion.horaInicio}`,
                        end: `${date}T${sesion.horaFin}`,
                        backgroundColor: color,
                        borderColor: color,
                        textColor: "#ffffff",
                        extendedProps: {
                            lugar: sesion.lugar,
                            subgrupo: subgrupo.id,
                        },
                    },
                });
            });
        });
    });
    return out;
}

function visibleEvents(state) {
    return calendarItems(state).filter((item) => item.visible).map((item) => item.event);
}

function timeToMinutes(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return null;
    }
    return Number(match[1]) * 60 + Number(match[2]);
}

function formatIsoDateEs(isoDate) {
    const [year, month, day] = String(isoDate || "").split("-").map(Number);
    if (!year || !month || !day) {
        return isoDate || "";
    }
    return new Intl.DateTimeFormat("es", { day: "numeric", month: "long" }).format(new Date(year, month - 1, day));
}

function eventLabel(item) {
    return `${item.asignatura.nombre || item.asignatura.id} ${item.subgrupo.nombre || item.subgrupo.id}`;
}

function overlapDiagnostics(state) {
    const visible = calendarItems(state)
        .filter((item) => item.visible)
        .map((item) => {
            const date = item.event.start.slice(0, 10);
            return {
                ...item,
                date,
                startMinutes: timeToMinutes(item.sesion.horaInicio),
                endMinutes: timeToMinutes(item.sesion.horaFin),
            };
        })
        .filter((item) => item.startMinutes !== null && item.endMinutes !== null && item.endMinutes > item.startMinutes)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

    const overlaps = [];
    const byVisibleDate = new Map();
    visible.forEach((item) => {
        const current = byVisibleDate.get(item.date) || [];
        current.push(item);
        byVisibleDate.set(item.date, current);
    });

    byVisibleDate.forEach((items, date) => {
        const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
        let cluster = [];
        let overlapStart = null;
        let overlapEnd = null;

        sorted.forEach((item) => {
            if (cluster.length === 0) {
                cluster = [item];
                overlapEnd = item.endMinutes;
                return;
            }
            if (item.startMinutes < overlapEnd) {
                overlapStart = overlapStart === null ? item.startMinutes : Math.min(overlapStart, item.startMinutes);
                overlapEnd = Math.max(overlapEnd, item.endMinutes);
                cluster.push(item);
                return;
            }
            if (overlapStart !== null && cluster.length > 1) {
                overlaps.push({
                    date,
                    start: overlapStart,
                    end: overlapEnd,
                    items: cluster,
                });
            }
            cluster = [item];
            overlapStart = null;
            overlapEnd = item.endMinutes;
        });

        if (overlapStart !== null && cluster.length > 1) {
            overlaps.push({
                date,
                start: overlapStart,
                end: overlapEnd,
                items: cluster,
            });
        }
    });

    const byDate = new Map();
    overlaps.forEach((overlap) => {
        const current = byDate.get(overlap.date) || [];
        current.push(overlap);
        byDate.set(overlap.date, current);
    });

    return {
        overlaps,
        overlapDates: new Set(overlaps.map((overlap) => overlap.date)),
        byDate,
    };
}

function minutesLabel(minutes) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${hours}:${mins}`;
}

function renderOverlapSummary(diagnostics) {
    if (diagnostics.overlaps.length === 0) {
        return `<p class="calendar-overlap-empty">No se han encontrado solapamientos entre las asignaturas visibles.</p>`;
    }

    const rows = diagnostics.overlaps.slice(0, 12).map((overlap) => {
        const labels = [...new Set(overlap.items.map(eventLabel))];
        return `
            <li>
                <strong>${escapeHtml(formatIsoDateEs(overlap.date))}</strong>
                <span>${escapeHtml(minutesLabel(overlap.start))}-${escapeHtml(minutesLabel(overlap.end))}: ${escapeHtml(labels.join(", "))}</span>
            </li>
        `;
    }).join("");
    const remaining = diagnostics.overlaps.length > 12 ? `<li class="muted-line">Y ${diagnostics.overlaps.length - 12} solapamientos mas.</li>` : "";
    return `<ul class="calendar-overlap-list">${rows}${remaining}</ul>`;
}

function firstEventDate(events) {
    return events[0]?.start?.slice(0, 10) || new Date().toISOString().slice(0, 10);
}

function initialCalendarDate(state, events) {
    const range = academicCalendarRange(state.selectedCourse);
    if (isIsoDateInRange(state.calendarDate, range)) {
        return state.calendarDate;
    }
    const firstDate = firstEventDate(events);
    return isIsoDateInRange(firstDate, range) ? firstDate : range.startIso;
}

function normalizedCalendarView(state) {
    return state.calendarView === "multiMonthYear" ? "academicYear" : (state.calendarView || "timeGridWeek");
}

function setSessionValue(state, key, patch) {
    const [asignaturaIndex, subgrupoIndex, sesionIndex] = key.split(":").map(Number);
    const sesion = state.asignaturas[asignaturaIndex]?.subgrupos?.[subgrupoIndex]?.sesiones?.[sesionIndex];
    if (!sesion) {
        return;
    }
    Object.assign(sesion, patch);
}

function subgrupoSessions(subgrupo) {
    return Array.isArray(subgrupo?.sesiones) ? subgrupo.sesiones : [];
}

function sessionInRange(sesion, range) {
    const date = sessionDate(sesion);
    return Boolean(date && sesion.horaInicio && sesion.horaFin && isIsoDateInRange(date, range));
}

function subgrupoCalendarSessions(subgrupo, range) {
    return subgrupoSessions(subgrupo).filter((sesion) => sessionInRange(sesion, range));
}

function hasCalendarSubgrupo(subgrupo, range) {
    return subgrupoCalendarSessions(subgrupo, range).length > 0;
}

function hasCalendarAsignatura(asignatura, range) {
    return (asignatura.subgrupos || []).some((subgrupo) => hasCalendarSubgrupo(subgrupo, range));
}

function allSessionsVisible(sesiones) {
    return sesiones.length > 0 && sesiones.every((sesion) => sesion.visible !== false);
}

function someSessionsVisible(sesiones) {
    return sesiones.some((sesion) => sesion.visible !== false);
}

function asignaturaVisible(asignatura, range) {
    const sesiones = (asignatura.subgrupos || []).flatMap((subgrupo) => subgrupoCalendarSessions(subgrupo, range));
    return allSessionsVisible(sesiones);
}

function asignaturaIndeterminate(asignatura, range) {
    const sesiones = (asignatura.subgrupos || []).flatMap((subgrupo) => subgrupoCalendarSessions(subgrupo, range));
    return someSessionsVisible(sesiones) && !allSessionsVisible(sesiones);
}

function subgrupoVisible(subgrupo, range) {
    return allSessionsVisible(subgrupoCalendarSessions(subgrupo, range));
}

function subgrupoIndeterminate(subgrupo, range) {
    const sesiones = subgrupoCalendarSessions(subgrupo, range);
    return someSessionsVisible(sesiones) && !allSessionsVisible(sesiones);
}

function setAsignaturaVisibility(asignatura, visible) {
    (asignatura.subgrupos || []).forEach((subgrupo) => {
        subgrupoSessions(subgrupo).forEach((sesion) => {
            sesion.visible = visible;
        });
    });
}

function setSubgrupoVisibility(subgrupo, visible) {
    subgrupoSessions(subgrupo).forEach((sesion) => {
        sesion.visible = visible;
    });
}

function categoriaNombre(state, categoriaId) {
    return state.categoriasAsignaturas.find((categoria) => categoria.id === categoriaId)?.nombre || "Sin categoria";
}

function calendarTree(state) {
    const range = academicCalendarRange(state.selectedCourse);
    const categories = new Map();
    state.asignaturas.forEach((asignatura, asignaturaIndex) => {
        if (!hasCalendarAsignatura(asignatura, range)) {
            return;
        }
        const categoriaId = asignatura.categoriaId || "__sin_categoria__";
        if (!categories.has(categoriaId)) {
            categories.set(categoriaId, {
                id: categoriaId,
                nombre: categoriaNombre(state, asignatura.categoriaId),
                asignaturas: [],
            });
        }
        categories.get(categoriaId).asignaturas.push({ asignatura, asignaturaIndex });
    });

    return [...categories.values()]
        .map((categoria) => ({
            ...categoria,
            asignaturas: categoria.asignaturas.sort((a, b) => String(a.asignatura.nombre || "").localeCompare(String(b.asignatura.nombre || ""), "es", { sensitivity: "base" })),
        }))
        .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" }));
}

function renderCalendarTree(state) {
    const tree = calendarTree(state);
    if (tree.length === 0) {
        return `<p class="empty-cell">No hay sesiones importadas todavia.</p>`;
    }

    return tree.map((categoria) => `
        <section class="calendar-category">
            <h3>${escapeHtml(categoria.nombre)}</h3>
            <div class="calendar-subject-list">
                ${categoria.asignaturas.map(({ asignatura, asignaturaIndex }) => renderCalendarSubject(state, asignatura, asignaturaIndex)).join("")}
            </div>
        </section>
    `).join("");
}

function renderCalendarSubject(state, asignatura, asignaturaIndex) {
    const range = academicCalendarRange(state.selectedCourse);
    const expanded = state.calendarExpandedAsignaturas?.[asignatura.id || asignaturaIndex] === true;
    const subgrupos = (asignatura.subgrupos || []).map((subgrupo, subgrupoIndex) => ({ subgrupo, subgrupoIndex })).filter(({ subgrupo }) => hasCalendarSubgrupo(subgrupo, range));
    return `
        <div class="calendar-subject">
            <div class="calendar-subject-row">
                <button class="calendar-expand" data-calendar-expand-asignatura="${asignaturaIndex}" type="button" aria-label="${expanded ? "Contraer" : "Expandir"} asignatura">${expanded ? "⌄" : "›"}</button>
                <input data-calendar-asignatura-visible="${asignaturaIndex}" type="checkbox" ${asignaturaVisible(asignatura, range) ? "checked" : ""} />
                <input data-calendar-asignatura-color="${asignaturaIndex}" type="color" value="${escapeHtml(asignaturaColor(asignatura))}" />
                <span>
                    <strong>${escapeHtml(asignatura.nombre || asignatura.id || "Asignatura")}</strong>
                    <small>${subgrupos.length} subgrupos · ${subgrupos.reduce((sum, item) => sum + subgrupoCalendarSessions(item.subgrupo, range).length, 0)} sesiones</small>
                </span>
            </div>
            ${expanded ? `
                <div class="calendar-subgroup-list">
                    ${subgrupos.map(({ subgrupo, subgrupoIndex }) => `
                        <label class="calendar-subgroup-row">
                            <input data-calendar-subgrupo-visible="${asignaturaIndex}:${subgrupoIndex}" type="checkbox" ${subgrupoVisible(subgrupo, range) ? "checked" : ""} />
                            <input data-calendar-subgrupo-color="${asignaturaIndex}:${subgrupoIndex}" type="color" value="${escapeHtml(subgrupoColor(asignatura, subgrupo))}" />
                            <span>
                                <strong>${escapeHtml(subgrupo.nombre || subgrupo.id || "Subgrupo")}</strong>
                                <small>${escapeHtml(subgrupo.id || "")} · ${subgrupoCalendarSessions(subgrupo, range).length} sesiones</small>
                            </span>
                        </label>
                    `).join("")}
                </div>
            ` : ""}
        </div>
    `;
}

export function renderCalendarioSection(state) {
    const items = calendarItems(state);
    const visibleCount = items.filter((item) => item.visible).length;
    const range = academicCalendarRange(state.selectedCourse);
    const currentView = normalizedCalendarView(state);
    const diagnostics = overlapDiagnostics(state);

    return `
        <div class="card calendar-panel">
            <div class="section-header">
                <div>
                    <h2>Calendario</h2>
                    <p class="status">Vista de eventos importados desde las paginas de la universidad dentro del curso academico.</p>
                </div>
                <button id="save-calendar-btn" class="secondary" type="button">Guardar cambios</button>
            </div>

            <div class="teacher-summary subject-summary">
                <div class="metric-box"><span>Eventos importados</span><strong>${items.length}</strong></div>
                <div class="metric-box"><span>Eventos visibles</span><strong>${visibleCount}</strong></div>
                <div class="metric-box"><span>Asignaturas con calendario</span><strong>${new Set(items.map((item) => item.asignatura.id)).size}</strong></div>
                <div class="metric-box"><span>Periodo</span><strong>${escapeHtml(range.label)}</strong></div>
            </div>

            <section class="calendar-overlap-panel">
                <div class="calendar-overlap-actions">
                    <label class="switch-row">
                        <span>
                            <strong>Comprobar solapamientos</strong>
                            <small>${state.calendarCheckOverlaps ? `${diagnostics.overlaps.length} solapamientos encontrados` : "Analiza las asignaturas y subgrupos visibles"}</small>
                        </span>
                        <input id="calendar-overlap-toggle" type="checkbox" ${state.calendarCheckOverlaps ? "checked" : ""} />
                    </label>
                    <button id="calendar-clear-selection-btn" class="secondary" type="button">Deseleccionar todo</button>
                </div>
                ${state.calendarCheckOverlaps ? renderOverlapSummary(diagnostics) : ""}
            </section>

            <div class="calendar-layout">
                <aside class="calendar-sidebar">
                    <div class="nav-tabs embedded-tabs">
                        ${CALENDAR_VIEWS.map((view) => `
                            <button class="tab ${currentView === view.value ? "active" : ""}" data-calendar-view="${view.value}" type="button">${view.label}</button>
                        `).join("")}
                    </div>
                    <div class="calendar-event-list">
                        ${renderCalendarTree(state)}
                    </div>
                </aside>
                <div class="calendar-shell">
                    <div id="plandoc-calendar"></div>
                    <p id="calendar-fallback" class="status"></p>
                </div>
            </div>
        </div>
    `;
}

export function bindCalendarioEvents({ state, setStatus, render, saveAsignaturas }) {
    const range = academicCalendarRange(state.selectedCourse);
    const overlapToggle = document.getElementById("calendar-overlap-toggle");
    if (overlapToggle) {
        overlapToggle.onchange = () => {
            state.calendarCheckOverlaps = overlapToggle.checked;
            render();
        };
    }

    const clearSelectionBtn = document.getElementById("calendar-clear-selection-btn");
    if (clearSelectionBtn) {
        clearSelectionBtn.onclick = () => {
            state.asignaturas.forEach((asignatura) => setAsignaturaVisibility(asignatura, false));
            setStatus("Todas las asignaturas del calendario quedan deseleccionadas.");
            render();
        };
    }

    document.querySelectorAll("[data-calendar-view]").forEach((btn) => {
        btn.onclick = () => {
            state.calendarView = btn.dataset.calendarView || "timeGridWeek";
            render();
        };
    });

    document.querySelectorAll("[data-calendar-expand-asignatura]").forEach((btn) => {
        btn.onclick = () => {
            const asignaturaIndex = Number(btn.dataset.calendarExpandAsignatura);
            const asignatura = state.asignaturas[asignaturaIndex];
            if (!asignatura) {
                return;
            }
            const key = asignatura.id || String(asignaturaIndex);
            state.calendarExpandedAsignaturas = {
                ...(state.calendarExpandedAsignaturas || {}),
                [key]: state.calendarExpandedAsignaturas?.[key] !== true,
            };
            render();
        };
    });

    document.querySelectorAll("[data-calendar-asignatura-visible]").forEach((input) => {
        const asignatura = state.asignaturas[Number(input.dataset.calendarAsignaturaVisible)];
        if (asignatura) {
            input.indeterminate = asignaturaIndeterminate(asignatura, range);
        }
        input.onchange = () => {
            const target = state.asignaturas[Number(input.dataset.calendarAsignaturaVisible)];
            if (!target) {
                return;
            }
            setAsignaturaVisibility(target, input.checked);
            render();
        };
    });

    document.querySelectorAll("[data-calendar-asignatura-color]").forEach((input) => {
        input.onchange = () => {
            const asignatura = state.asignaturas[Number(input.dataset.calendarAsignaturaColor)];
            if (!asignatura) {
                return;
            }
            asignatura.color = input.value;
            render();
        };
    });

    document.querySelectorAll("[data-calendar-subgrupo-visible]").forEach((input) => {
        const [initialAsignaturaIndex, initialSubgrupoIndex] = input.dataset.calendarSubgrupoVisible.split(":").map(Number);
        const initialSubgrupo = state.asignaturas[initialAsignaturaIndex]?.subgrupos?.[initialSubgrupoIndex];
        if (initialSubgrupo) {
            input.indeterminate = subgrupoIndeterminate(initialSubgrupo, range);
        }
        input.onchange = () => {
            const [asignaturaIndex, subgrupoIndex] = input.dataset.calendarSubgrupoVisible.split(":").map(Number);
            const subgrupo = state.asignaturas[asignaturaIndex]?.subgrupos?.[subgrupoIndex];
            if (!subgrupo) {
                return;
            }
            setSubgrupoVisibility(subgrupo, input.checked);
            render();
        };
    });

    document.querySelectorAll("[data-calendar-subgrupo-color]").forEach((input) => {
        input.onchange = () => {
            const [asignaturaIndex, subgrupoIndex] = input.dataset.calendarSubgrupoColor.split(":").map(Number);
            const subgrupo = state.asignaturas[asignaturaIndex]?.subgrupos?.[subgrupoIndex];
            if (!subgrupo) {
                return;
            }
            subgrupo.color = input.value;
            render();
        };
    });

    const saveBtn = document.getElementById("save-calendar-btn");
    if (saveBtn) {
        saveBtn.onclick = saveAsignaturas;
    }

    renderFullCalendar(state, setStatus);
}

function renderFullCalendar(state, setStatus) {
    const target = document.getElementById("plandoc-calendar");
    const fallback = document.getElementById("calendar-fallback");
    if (!target) {
        return;
    }
    if (!globalThis.FullCalendar?.Calendar) {
        if (fallback) {
            fallback.textContent = "No se ha podido cargar FullCalendar. Revisa la conexion al CDN.";
        }
        return;
    }
    const events = visibleEvents(state);
    const range = academicCalendarRange(state.selectedCourse);
    const view = normalizedCalendarView(state);
    const diagnostics = state.calendarCheckOverlaps ? overlapDiagnostics(state) : { overlapDates: new Set() };
    const calendar = new globalThis.FullCalendar.Calendar(target, {
        locale: "es",
        initialView: view,
        initialDate: view === "academicYear" ? range.startIso : initialCalendarDate(state, events),
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
        datesSet(info) {
            state.calendarDate = info.startStr.slice(0, 10);
        },
        eventClick(info) {
            const lugar = info.event.extendedProps.lugar ? ` · ${info.event.extendedProps.lugar}` : "";
            setStatus(`${info.event.title}${lugar}`);
        },
    });
    calendar.render();
}
