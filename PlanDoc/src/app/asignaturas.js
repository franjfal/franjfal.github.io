import { escapeHtml, toPositiveNumber, uid } from "./utils.js";

const CUATRIMESTRES = [
    { value: "primer", label: "Primer cuatrimestre" },
    { value: "segundo", label: "Segundo cuatrimestre" },
    { value: "anual", label: "Anual" },
];

const IDIOMAS = [
    { value: "castellano", label: "Castellano" },
    { value: "valenciano", label: "Valenciano" },
    { value: "ingles", label: "Ingles" },
];

const TIPOS_SUBGRUPO = [
    { value: "teoria", label: "Teoria" },
    { value: "practicas", label: "Practicas" },
    { value: "seminario", label: "Seminario" },
    { value: "practicas-informaticas", label: "Practicas informaticas" },
    { value: "tutorias", label: "Tutorias" },
];

const UV_TARGET_CREATE = "__create__";
const UV_TARGET_SKIP = "__skip__";

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

function normalizeCuatrimestre(value) {
    return CUATRIMESTRES.some((c) => c.value === value) ? value : "primer";
}

function normalizeIdioma(value) {
    return IDIOMAS.some((i) => i.value === value) ? value : "castellano";
}

function normalizeTipoSubgrupo(value) {
    return TIPOS_SUBGRUPO.some((t) => t.value === value) ? value : "teoria";
}

function normalizeSesion(raw) {
    return {
        id: String(raw?.id || uid("ses")).trim(),
        franjaInicio: (raw?.franjaInicio || "").trim(),
        franjaFin: (raw?.franjaFin || "").trim(),
        dia: (raw?.dia || "").trim(),
        horaInicio: (raw?.horaInicio || "").trim(),
        horaFin: (raw?.horaFin || "").trim(),
        lugar: (raw?.lugar || "").trim(),
        fuente: (raw?.fuente || "uv").trim(),
        url: (raw?.url || "").trim(),
        visible: raw?.visible !== false,
        color: (raw?.color || "").trim(),
    };
}

function normalizeSubgrupo(raw, asignaturaCuatrimestre = "primer") {
    const subjectCuatrimestre = normalizeCuatrimestre(asignaturaCuatrimestre);
    return {
        id: String(raw?.id || uid("sub")).trim(),
        nombre: (raw?.nombre || "").trim(),
        codigoUv: (raw?.codigoUv || raw?.uvId || raw?.grupoUv || "").trim(),
        color: (raw?.color || "").trim(),
        tipo: normalizeTipoSubgrupo(raw?.tipo || "teoria"),
        idioma: normalizeIdioma(raw?.idioma || "castellano"),
        cuatrimestre: subjectCuatrimestre === "anual"
            ? normalizeCuatrimestre(raw?.cuatrimestre || "primer")
            : subjectCuatrimestre,
        creditos: toPositiveNumber(raw?.creditos, 0),
        sesiones: Array.isArray(raw?.sesiones) ? raw.sesiones.map(normalizeSesion) : [],
    };
}

export function normalizeAsignatura(raw) {
    const cuatrimestre = normalizeCuatrimestre(raw?.cuatrimestre || "primer");
    return {
        id: (raw?.id || "").trim(),
        nombre: (raw?.nombre || "").trim(),
        categoriaId: (raw?.categoriaId || "").trim(),
        codigoReferencia: (raw?.codigoReferencia || "").trim(),
        codigoTitulacion: (raw?.codigoTitulacion || "").trim(),
        color: (raw?.color || "").trim(),
        cuatrimestre,
        subgrupos: Array.isArray(raw?.subgrupos) ? raw.subgrupos.map((s) => normalizeSubgrupo(s, cuatrimestre)) : [],
    };
}

export function normalizeCategoriaAsignatura(raw) {
    return {
        id: (raw?.id || "").trim(),
        nombre: (raw?.nombre || "").trim(),
    };
}

export function hydrateAsignaturas(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    return list.map(normalizeAsignatura);
}

export function hydrateCategoriasAsignaturas(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    return list.map(normalizeCategoriaAsignatura);
}

function emptyAsignaturaDraft() {
    return {
        id: "",
        nombre: "",
        categoriaId: "",
        codigoReferencia: "",
        codigoTitulacion: "",
        color: "",
        cuatrimestre: "primer",
        subgrupos: [],
    };
}

function emptyCategoriaDraft() {
    return {
        id: "",
        nombre: "",
    };
}

function draftFromAsignatura(asignatura) {
    return {
        id: asignatura.id || "",
        nombre: asignatura.nombre || "",
        categoriaId: asignatura.categoriaId || "",
        codigoReferencia: asignatura.codigoReferencia || "",
        codigoTitulacion: asignatura.codigoTitulacion || "",
        color: asignatura.color || "",
        cuatrimestre: normalizeCuatrimestre(asignatura.cuatrimestre || "primer"),
        subgrupos: Array.isArray(asignatura.subgrupos)
            ? asignatura.subgrupos.map((s) => normalizeSubgrupo(s, asignatura.cuatrimestre || "primer"))
            : [],
    };
}

function draftFromCategoria(categoria) {
    return {
        id: categoria.id || "",
        nombre: categoria.nombre || "",
    };
}

function closeAsignaturaModal(state) {
    state.isAsignaturaModalOpen = false;
    state.asignaturaModalMode = "create";
    state.editingAsignaturaIndex = -1;
    state.editingSubgrupoIndex = -1;
    state.isUvImporting = false;
    state.uvImportStatus = "";
    state.uvImportSummary = [];
    state.uvImportAnyoFinCurso = "";
    state.asignaturaDraft = emptyAsignaturaDraft();
}

function closeCategoriaModal(state) {
    state.isCategoriaAsignaturaModalOpen = false;
    state.categoriaAsignaturaMode = "create";
    state.editingCategoriaAsignaturaIndex = -1;
    state.categoriaAsignaturaDraft = emptyCategoriaDraft();
}

function closeAsignaturaImportModal(state) {
    state.isAsignaturaImportModalOpen = false;
    state.showAsignaturaImportHelp = false;
    state.asignaturaImportText = "";
}

function closeAsignaturaDetailModal(state) {
    state.isAsignaturaDetailModalOpen = false;
    state.detailAsignaturaIndex = -1;
}

function updateAsignaturaDraftFromModal(state) {
    const previousSubgrupos = Array.isArray(state.asignaturaDraft?.subgrupos) ? state.asignaturaDraft.subgrupos : [];
    const cuatrimestre = normalizeCuatrimestre(document.getElementById("asig-modal-cuatrimestre")?.value || "primer");
    state.asignaturaDraft = {
        id: (document.getElementById("asig-modal-id")?.value || "").trim(),
        nombre: (document.getElementById("asig-modal-name")?.value || "").trim(),
        categoriaId: (document.getElementById("asig-modal-category")?.value || "").trim(),
        codigoReferencia: (document.getElementById("asig-modal-codigo-ref")?.value || "").trim(),
        codigoTitulacion: (document.getElementById("asig-modal-codigo-titulacion")?.value || "").trim(),
        color: state.asignaturaDraft?.color || "",
        cuatrimestre,
        subgrupos: previousSubgrupos.map((s) => normalizeSubgrupo(s, cuatrimestre)),
    };
}

function updateCategoriaDraftFromModal(state) {
    state.categoriaAsignaturaDraft = {
        id: (document.getElementById("cat-asig-id")?.value || "").trim(),
        nombre: (document.getElementById("cat-asig-name")?.value || "").trim(),
    };
}

function updateUvImportDraftFromModal(state) {
    state.uvAnyoFinCurso = guessAnyoFinCurso(state.selectedCourse);
}

function asignaturaInitial(asignatura) {
    return (asignatura.nombre || asignatura.id || "A").trim().charAt(0).toUpperCase() || "A";
}

function categoriaById(state, categoriaId) {
    return state.categoriasAsignaturas.find((c) => c.id === categoriaId) || null;
}

function countAsignaturasByCategoria(state, categoriaId) {
    return state.asignaturas.filter((a) => a.categoriaId === categoriaId).length;
}

function totalSubgrupos(state) {
    return state.asignaturas.reduce((sum, a) => sum + (Array.isArray(a.subgrupos) ? a.subgrupos.length : 0), 0);
}

function totalSesionesSubgrupos(subgrupos) {
    return (subgrupos || []).reduce((sum, s) => sum + (Array.isArray(s.sesiones) ? s.sesiones.length : 0), 0);
}

function totalSesionesAsignatura(asignatura) {
    return totalSesionesSubgrupos(asignatura.subgrupos || []);
}

function parseDateDMY(value) {
    const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        return null;
    }
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function formatDateDMY(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
}

function sessionDate(sesion) {
    const start = parseDateDMY(sesion.franjaInicio);
    const end = parseDateDMY(sesion.franjaFin) || start;
    const targetDay = DAY_INDEX[String(sesion.dia || "").trim().toLowerCase()];
    if (!start || targetDay === undefined) {
        return start;
    }
    const cursor = new Date(start);
    for (let i = 0; i <= 7; i += 1) {
        if (cursor.getDay() === targetDay && (!end || cursor <= end)) {
            return cursor;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return start;
}

function timeToMinutes(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return null;
    }
    return Number(match[1]) * 60 + Number(match[2]);
}

function sesionHoras(sesion) {
    const start = timeToMinutes(sesion.horaInicio);
    const end = timeToMinutes(sesion.horaFin);
    if (start === null || end === null || end <= start) {
        return 0;
    }
    return Number(((end - start) / 60).toFixed(2));
}

function totalHorasSesiones(sesiones) {
    return Number((sesiones || []).reduce((sum, sesion) => sum + sesionHoras(sesion), 0).toFixed(2));
}

function totalHorasSubgrupos(subgrupos) {
    return Number((subgrupos || []).reduce((sum, subgrupo) => sum + totalHorasSesiones(subgrupo.sesiones || []), 0).toFixed(2));
}

function totalCreditosAsignatura(asignatura) {
    return Number((asignatura.subgrupos || []).reduce((sum, s) => sum + toPositiveNumber(s.creditos, 0), 0).toFixed(2));
}

function totalCreditosAsignaturas(asignaturas) {
    return Number(asignaturas.reduce((sum, a) => sum + totalCreditosAsignatura(a), 0).toFixed(2));
}

function asignaturaWarnings(state, asignatura) {
    const warnings = [];
    const subgrupos = Array.isArray(asignatura.subgrupos) ? asignatura.subgrupos : [];
    if (!subgrupos.length) {
        warnings.push("No hay subgrupos definidos.");
    }
    if (subgrupos.length > 0 && totalCreditosAsignatura(asignatura) <= 0) {
        warnings.push("No hay horas de carga docente definidas.");
    }
    const subgruposConCargaSinCalendario = subgrupos.filter((subgrupo) => (
        toPositiveNumber(subgrupo.creditos, 0) > 0
        && (!Array.isArray(subgrupo.sesiones) || subgrupo.sesiones.length === 0)
    ));
    if (subgruposConCargaSinCalendario.length > 0) {
        warnings.push(`${subgruposConCargaSinCalendario.length} subgrupos tienen horas pero no calendario importado.`);
    }
    if (!categoriaById(state, asignatura.categoriaId)) {
        warnings.push("Falta asociar grado o facultad.");
    }
    const subgruposSinCodigoUv = subgrupos.filter((subgrupo) => toPositiveNumber(subgrupo.creditos, 0) > 0 && !subgrupo.codigoUv);
    if (subgruposSinCodigoUv.length > 0) {
        warnings.push(`${subgruposSinCodigoUv.length} subgrupos con horas no tienen codigo UV.`);
    }
    return warnings;
}

function cuatrimestreLabel(value) {
    return CUATRIMESTRES.find((c) => c.value === value)?.label || "Primer cuatrimestre";
}

function idiomaLabel(value) {
    return IDIOMAS.find((i) => i.value === value)?.label || "Castellano";
}

function tipoSubgrupoLabel(value) {
    return TIPOS_SUBGRUPO.find((t) => t.value === value)?.label || "Teoria";
}

function guessAnyoFinCurso(selectedCourse) {
    const match = String(selectedCourse || "").match(/(\d{4})\D+(\d{4})/);
    if (match) {
        return match[2];
    }
    const singleYear = String(selectedCourse || "").match(/(\d{4})/);
    if (singleYear) {
        return String(Number(singleYear[1]) + 1);
    }
    return "";
}

function buildUvAsignaturaUrl(asignatura, selectedCourse) {
    const codigoAsignatura = String(asignatura?.codigoReferencia || "").trim();
    const idTitulacion = String(asignatura?.codigoTitulacion || "").trim();
    const anyoFinCurso = guessAnyoFinCurso(selectedCourse);
    if (!codigoAsignatura || !idTitulacion || !anyoFinCurso) {
        return "";
    }
    const idT = `${idTitulacion};${anyoFinCurso}`;
    return `https://www.uv.es/fatwirepub/Satellite/universitat/es/asignaturas-1285846094474.html?idA=${encodeURIComponent(codigoAsignatura)}&idT=${encodeURIComponent(idT)}`;
}

function inferTipoSubgrupoFromUv(group) {
    const text = `${group.tipo || ""} ${group.id || ""}`.toLowerCase();
    const suffix = String(group.id || "").split("-").pop()?.charAt(0).toUpperCase() || "";
    if (text.includes("inform") || suffix === "I") return "practicas-informaticas";
    if (text.includes("tutor") || suffix === "U") return "tutorias";
    if (text.includes("semin") || suffix === "S") return "seminario";
    if (text.includes("pr") || suffix === "P") return "practicas";
    if (text.includes("teor") || suffix === "T" || suffix === "O") return "teoria";
    return "seminario";
}

function compactKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "");
}

function filterSesionesByCuatrimestre(sesiones, cuatrimestre, anyoFinCurso) {
    const normalizedCuatrimestre = normalizeCuatrimestre(cuatrimestre);
    const year = Number(anyoFinCurso);
    if (normalizedCuatrimestre === "anual" || !Number.isFinite(year)) {
        return sesiones;
    }
    const targetYear = normalizedCuatrimestre === "primer" ? year - 1 : year;
    const naturalYearStart = new Date(targetYear, 0, 1);
    const naturalYearEnd = new Date(targetYear, 11, 31);
    return sesiones.map((sesion) => {
        const start = parseDateDMY(sesion.franjaInicio);
        const end = parseDateDMY(sesion.franjaFin) || start;
        if (!start || !end) {
            return sesion;
        }
        if (end < naturalYearStart || start > naturalYearEnd) {
            return null;
        }
        const nextStart = start < naturalYearStart ? naturalYearStart : start;
        const nextEnd = end > naturalYearEnd ? naturalYearEnd : end;
        return {
            ...sesion,
            franjaInicio: formatDateDMY(nextStart),
            franjaFin: formatDateDMY(nextEnd),
        };
    }).filter(Boolean);
}

function uvGroupKey(value) {
    return compactKey(value)
        .replace(/(?:[-_](?:1|2)|[-_]?(?:1c|2c|c1|c2|q1|q2|s1|s2|sem1|sem2)|[-_]?(?:primer|primero|segundo))$/i, "");
}

function matchingSubgrupoIndexes(subgrupos, groupId) {
    const normalizedGroupId = compactKey(groupId);
    const uvExact = subgrupos
        .map((subgrupo, index) => ({ subgrupo, index }))
        .filter(({ subgrupo }) => subgrupo.codigoUv && compactKey(subgrupo.codigoUv) === normalizedGroupId)
        .map(({ index }) => index);
    if (uvExact.length > 0) {
        return uvExact;
    }

    const exact = subgrupos
        .map((subgrupo, index) => ({ subgrupo, index }))
        .filter(({ subgrupo }) => compactKey(subgrupo.id) === normalizedGroupId)
        .map(({ index }) => index);
    if (exact.length > 0) {
        return exact;
    }

    const key = uvGroupKey(groupId);
    if (!key) {
        return [];
    }
    return subgrupos
        .map((subgrupo, index) => ({ subgrupo, index }))
        .filter(({ subgrupo }) => uvGroupKey(subgrupo.codigoUv) === key || uvGroupKey(subgrupo.id) === key || uvGroupKey(subgrupo.nombre) === key)
        .map(({ index }) => index);
}

function ordinalFromText(value) {
    const matches = uvGroupKey(value).match(/\d+/g);
    return matches ? matches[matches.length - 1] : "";
}

function subgrupoOrdinal(subgrupo) {
    return ordinalFromText(subgrupo.codigoUv) || ordinalFromText(subgrupo.id) || ordinalFromText(subgrupo.nombre);
}

function inferredSubgrupoIndexes(subgrupos, group, subjectCuatrimestre) {
    const groupType = inferTipoSubgrupoFromUv(group);
    const groupOrdinal = ordinalFromText(group.id || group.nombre);
    const targetCuatrimestres = subjectCuatrimestre === "anual" ? ["primer", "segundo"] : [subjectCuatrimestre];
    let candidates = subgrupos
        .map((subgrupo, index) => ({ subgrupo, index }))
        .filter(({ subgrupo }) => (
            normalizeTipoSubgrupo(subgrupo.tipo) === groupType
            && targetCuatrimestres.includes(normalizeCuatrimestre(subgrupo.cuatrimestre))
            && (!subgrupo.codigoUv || compactKey(subgrupo.codigoUv) === compactKey(group.id))
        ));

    const groupIdioma = normalizeIdioma(group.idioma || "castellano");
    const sameLanguage = candidates.filter(({ subgrupo }) => normalizeIdioma(subgrupo.idioma) === groupIdioma);
    if (sameLanguage.length > 0) {
        candidates = sameLanguage;
    }

    if (groupOrdinal) {
        const numbered = candidates.filter(({ subgrupo }) => subgrupoOrdinal(subgrupo) === groupOrdinal);
        if (numbered.length > 0) {
            candidates = numbered;
        }
    }

    const selected = [];
    targetCuatrimestres.forEach((cuatrimestre) => {
        const matches = candidates.filter(({ subgrupo }) => normalizeCuatrimestre(subgrupo.cuatrimestre) === cuatrimestre);
        if (matches.length === 1) {
            selected.push(matches[0].index);
        }
    });
    return selected;
}

function buildImportSummaryRow(groupId, target, cuatrimestre, importedSesiones, assignedSesiones, action) {
    return {
        source: groupId,
        target: target || groupId,
        cuatrimestre: normalizeCuatrimestre(cuatrimestre),
        imported: importedSesiones.length,
        sesiones: assignedSesiones.length,
        horas: totalHorasSesiones(assignedSesiones),
        action,
    };
}

function subgrupoTargetLabel(subgrupo) {
    const parts = [
        subgrupo.id,
        subgrupo.nombre,
        cuatrimestreLabel(subgrupo.cuatrimestre),
        subgrupo.codigoUv ? `UV ${subgrupo.codigoUv}` : "",
    ].filter(Boolean);
    return parts.join(" · ");
}

function suggestedUvTarget(subgrupos, group, subjectCuatrimestre, targetCuatrimestre) {
    const cuatrimestre = normalizeCuatrimestre(targetCuatrimestre);
    const fromMatch = matchingSubgrupoIndexes(subgrupos, group.id)
        .filter((index) => normalizeCuatrimestre(subgrupos[index]?.cuatrimestre) === cuatrimestre);
    if (fromMatch.length === 1) {
        return { index: fromMatch[0], action: "propuesto" };
    }

    const fromInference = inferredSubgrupoIndexes(subgrupos, group, subjectCuatrimestre)
        .filter((index) => normalizeCuatrimestre(subgrupos[index]?.cuatrimestre) === cuatrimestre);
    if (fromInference.length === 1) {
        return { index: fromInference[0], action: "inferido" };
    }

    return { index: -1, action: subgrupos.length > 0 ? "pendiente" : "crear" };
}

function buildUvImportPreview(state, groups, anyoFinCurso) {
    const subjectCuatrimestre = normalizeCuatrimestre(state.asignaturaDraft.cuatrimestre || "primer");
    const subgrupos = Array.isArray(state.asignaturaDraft.subgrupos) ? state.asignaturaDraft.subgrupos : [];
    const rows = [];

    groups.forEach((group) => {
        const groupId = String(group.id || "").trim();
        if (!groupId) {
            return;
        }
        const importedSesiones = Array.isArray(group.sesiones)
            ? group.sesiones.map((s) => normalizeSesion({ ...s, fuente: "uv", url: group.url || "" }))
            : [];
        const targetCuatrimestres = subjectCuatrimestre === "anual" && /^\d{4}$/.test(String(anyoFinCurso || ""))
            ? ["primer", "segundo"]
            : [subjectCuatrimestre];

        targetCuatrimestres.forEach((cuatrimestre) => {
            const filteredSesiones = filterSesionesByCuatrimestre(importedSesiones, cuatrimestre, anyoFinCurso);
            if (filteredSesiones.length === 0) {
                return;
            }
            const suggestion = suggestedUvTarget(subgrupos, group, subjectCuatrimestre, cuatrimestre);
            const targetIndex = suggestion.index >= 0
                ? String(suggestion.index)
                : (subgrupos.length === 0 ? UV_TARGET_CREATE : UV_TARGET_SKIP);
            rows.push({
                id: uid("uvmap"),
                source: groupId,
                group: {
                    ...group,
                    id: groupId,
                    sesiones: importedSesiones,
                    url: group.url || "",
                },
                targetIndex,
                target: suggestion.index >= 0 ? subgrupoTargetLabel(subgrupos[suggestion.index]) : (targetIndex === UV_TARGET_CREATE ? "Crear nuevo" : "Sin destino"),
                cuatrimestre,
                imported: importedSesiones.length,
                sesiones: filteredSesiones.length,
                horas: totalHorasSesiones(filteredSesiones),
                sesionesData: filteredSesiones,
                action: suggestion.action,
            });
        });
    });

    return rows;
}

function refreshUvPreviewRow(state, row) {
    const subgrupos = Array.isArray(state.asignaturaDraft.subgrupos) ? state.asignaturaDraft.subgrupos : [];
    const targetIndex = Number(row.targetIndex);
    const hasTarget = Number.isInteger(targetIndex) && targetIndex >= 0 && Boolean(subgrupos[targetIndex]);
    const cuatrimestre = hasTarget
        ? normalizeCuatrimestre(subgrupos[targetIndex].cuatrimestre)
        : normalizeCuatrimestre(row.cuatrimestre);
    const importedSesiones = Array.isArray(row.group?.sesiones) ? row.group.sesiones.map(normalizeSesion) : [];
    const filteredSesiones = filterSesionesByCuatrimestre(importedSesiones, cuatrimestre, state.uvImportAnyoFinCurso || state.uvAnyoFinCurso);

    return {
        ...row,
        target: hasTarget
            ? subgrupoTargetLabel(subgrupos[targetIndex])
            : (row.targetIndex === UV_TARGET_CREATE ? "Crear nuevo" : "Sin destino"),
        cuatrimestre,
        imported: importedSesiones.length,
        sesiones: filteredSesiones.length,
        horas: totalHorasSesiones(filteredSesiones),
        sesionesData: filteredSesiones,
        action: hasTarget ? "manual" : (row.targetIndex === UV_TARGET_CREATE ? "crear" : "pendiente"),
    };
}

function nextCreatedUvSubgroupId(subgrupos, source, cuatrimestre) {
    const suffix = normalizeCuatrimestre(cuatrimestre) === "primer"
        ? "1C"
        : normalizeCuatrimestre(cuatrimestre) === "segundo"
            ? "2C"
            : "";
    const base = [source, suffix].filter(Boolean).join("-");
    let candidate = base || source || uid("sub");
    let counter = 2;
    while (subgrupos.some((subgrupo) => compactKey(subgrupo.id) === compactKey(candidate))) {
        candidate = `${base || source}-${counter}`;
        counter += 1;
    }
    return candidate;
}

function applyUvImportPreview(state) {
    const subjectCuatrimestre = normalizeCuatrimestre(state.asignaturaDraft.cuatrimestre || "primer");
    const subgrupos = Array.isArray(state.asignaturaDraft.subgrupos) ? state.asignaturaDraft.subgrupos : [];
    const rows = Array.isArray(state.uvImportSummary) ? state.uvImportSummary : [];
    let sesiones = 0;
    let created = 0;
    let updated = 0;
    let pending = 0;

    rows.forEach((rawRow) => {
        const row = refreshUvPreviewRow(state, rawRow);
        const assignedSesiones = Array.isArray(row.sesionesData) ? row.sesionesData : [];
        if (row.targetIndex === UV_TARGET_SKIP || assignedSesiones.length === 0) {
            pending += 1;
            return;
        }

        if (row.targetIndex === UV_TARGET_CREATE) {
            const id = nextCreatedUvSubgroupId(subgrupos, row.source, row.cuatrimestre);
            subgrupos.push(normalizeSubgrupo({
                id,
                nombre: `${row.group?.nombre || row.source} ${cuatrimestreLabel(row.cuatrimestre)}`,
                codigoUv: row.source,
                tipo: inferTipoSubgrupoFromUv(row.group || { id: row.source }),
                idioma: row.group?.idioma || "castellano",
                cuatrimestre: row.cuatrimestre,
                creditos: 0,
                sesiones: assignedSesiones,
            }, subjectCuatrimestre));
            sesiones += assignedSesiones.length;
            created += 1;
            return;
        }

        const targetIndex = Number(row.targetIndex);
        const current = subgrupos[targetIndex];
        if (!current) {
            pending += 1;
            return;
        }
        subgrupos[targetIndex] = normalizeSubgrupo({
            ...current,
            codigoUv: current.codigoUv || row.source,
            sesiones: assignedSesiones,
        }, subjectCuatrimestre);
        sesiones += assignedSesiones.length;
        updated += 1;
    });

    state.asignaturaDraft.subgrupos = subgrupos;
    return { sesiones, created, updated, pending };
}

function mergeUvGroupsIntoDraft(state, groups, anyoFinCurso) {
    const subjectCuatrimestre = normalizeCuatrimestre(state.asignaturaDraft.cuatrimestre || "primer");
    const subgrupos = Array.isArray(state.asignaturaDraft.subgrupos) ? state.asignaturaDraft.subgrupos : [];
    let sesiones = 0;
    let created = 0;
    let updated = 0;
    let pending = 0;
    const summary = [];

    groups.forEach((group) => {
        const groupId = String(group.id || "").trim();
        if (!groupId) {
            return;
        }
        const importedSesiones = Array.isArray(group.sesiones)
            ? group.sesiones.map((s) => normalizeSesion({ ...s, fuente: "uv", url: group.url || "" }))
            : [];

        const key = uvGroupKey(groupId);
        const partitionIndexes = subjectCuatrimestre === "anual" && key
            ? subgrupos
                .map((subgrupo, index) => ({ subgrupo, index }))
                .filter(({ subgrupo }) => (
                    uvGroupKey(subgrupo.codigoUv) === key || uvGroupKey(subgrupo.id) === key || uvGroupKey(subgrupo.nombre) === key
                ) && normalizeCuatrimestre(subgrupo.cuatrimestre) !== "anual")
                .map(({ index }) => index)
            : [];
        let indexes = partitionIndexes.length > 0 ? partitionIndexes : matchingSubgrupoIndexes(subgrupos, groupId);
        let action = partitionIndexes.length > 0 ? "actualizado" : "actualizado";
        if (indexes.length === 0) {
            indexes = inferredSubgrupoIndexes(subgrupos, group, subjectCuatrimestre);
            action = indexes.length > 0 ? "inferido" : action;
        }
        if (indexes.length > 0) {
            if (
                subjectCuatrimestre === "anual"
                && indexes.length === 1
                && normalizeCuatrimestre(subgrupos[indexes[0]]?.cuatrimestre) === "anual"
                && /^\d{4}$/.test(String(anyoFinCurso || ""))
            ) {
                const current = subgrupos[indexes[0]];
                const replacements = [];
                ["primer", "segundo"].forEach((targetCuatrimestre, idx) => {
                    const filteredSesiones = filterSesionesByCuatrimestre(importedSesiones, targetCuatrimestre, anyoFinCurso);
                    if (filteredSesiones.length === 0) {
                        return;
                    }
                    const suffix = idx === 0 ? "1C" : "2C";
                    const targetId = `${groupId}-${suffix}`;
                    sesiones += filteredSesiones.length;
                    replacements.push(normalizeSubgrupo({
                        ...current,
                        id: targetId,
                        nombre: `${current.nombre || group.nombre || groupId} ${suffix}`,
                        codigoUv: current.codigoUv || groupId,
                        idioma: current.idioma || group.idioma || "castellano",
                        cuatrimestre: targetCuatrimestre,
                        sesiones: filteredSesiones,
                    }, subjectCuatrimestre));
                    updated += 1;
                    summary.push(buildImportSummaryRow(groupId, targetId, targetCuatrimestre, importedSesiones, filteredSesiones, "partido"));
                });
                if (replacements.length > 0) {
                    subgrupos.splice(indexes[0], 1, ...replacements);
                    return;
                }
            }
            indexes.forEach((existingIndex) => {
                const current = subgrupos[existingIndex];
                const targetCuatrimestre = normalizeCuatrimestre(current.cuatrimestre || subjectCuatrimestre);
                const filteredSesiones = filterSesionesByCuatrimestre(importedSesiones, targetCuatrimestre, anyoFinCurso);
                sesiones += filteredSesiones.length;
                subgrupos[existingIndex] = normalizeSubgrupo({
                    ...current,
                    codigoUv: current.codigoUv || groupId,
                    idioma: current.idioma || group.idioma || "castellano",
                    sesiones: filteredSesiones,
                }, subjectCuatrimestre);
                updated += 1;
                summary.push(buildImportSummaryRow(groupId, current.id || current.nombre, targetCuatrimestre, importedSesiones, filteredSesiones, action));
            });
        } else {
            if (subgrupos.length > 0) {
                summary.push(buildImportSummaryRow(groupId, "Sin destino", subjectCuatrimestre, importedSesiones, [], "pendiente"));
                pending += 1;
                return;
            }
            if (subjectCuatrimestre === "anual" && /^\d{4}$/.test(String(anyoFinCurso || ""))) {
                ["primer", "segundo"].forEach((targetCuatrimestre, idx) => {
                    const filteredSesiones = filterSesionesByCuatrimestre(importedSesiones, targetCuatrimestre, anyoFinCurso);
                    if (filteredSesiones.length === 0) {
                        return;
                    }
                    const suffix = idx === 0 ? "1C" : "2C";
                    const targetId = `${groupId}-${suffix}`;
                    sesiones += filteredSesiones.length;
                    subgrupos.push(normalizeSubgrupo({
                        id: targetId,
                        nombre: `${group.nombre || groupId} ${suffix}`,
                        codigoUv: groupId,
                        tipo: inferTipoSubgrupoFromUv(group),
                        idioma: group.idioma || "castellano",
                        cuatrimestre: targetCuatrimestre,
                        creditos: 0,
                        sesiones: filteredSesiones,
                    }, subjectCuatrimestre));
                    created += 1;
                    summary.push(buildImportSummaryRow(groupId, targetId, targetCuatrimestre, importedSesiones, filteredSesiones, "creado"));
                });
                return;
            }
            const targetCuatrimestre = subjectCuatrimestre === "anual" ? "anual" : subjectCuatrimestre;
            const filteredSesiones = filterSesionesByCuatrimestre(importedSesiones, targetCuatrimestre, anyoFinCurso);
            sesiones += filteredSesiones.length;
            subgrupos.push(normalizeSubgrupo({
                id: groupId,
                nombre: group.nombre || groupId,
                codigoUv: groupId,
                tipo: inferTipoSubgrupoFromUv(group),
                idioma: group.idioma || "castellano",
                cuatrimestre: targetCuatrimestre,
                creditos: 0,
                sesiones: filteredSesiones,
            }, subjectCuatrimestre));
            created += 1;
            summary.push(buildImportSummaryRow(groupId, groupId, targetCuatrimestre, importedSesiones, filteredSesiones, "creado"));
        }
    });

    state.asignaturaDraft.subgrupos = subgrupos;
    return { sesiones, created, updated, pending, summary };
}

function subgrupoSortValue(subgrupo, key) {
    if (key === "tipo") return tipoSubgrupoLabel(subgrupo.tipo);
    if (key === "idioma") return idiomaLabel(subgrupo.idioma);
    if (key === "cuatrimestre") return cuatrimestreLabel(subgrupo.cuatrimestre);
    if (key === "creditos") return toPositiveNumber(subgrupo.creditos, 0);
    return subgrupo.nombre || "";
}

function sortedSubgruposWithIndex(subgrupos, state) {
    const key = state.subgruposSortKey || "tipo";
    const dir = state.subgruposSortDir === "desc" ? -1 : 1;
    return subgrupos
        .map((subgrupo, originalIndex) => ({ subgrupo, originalIndex }))
        .sort((a, b) => {
            const valueA = subgrupoSortValue(a.subgrupo, key);
            const valueB = subgrupoSortValue(b.subgrupo, key);
            if (typeof valueA === "number" || typeof valueB === "number") {
                return (toPositiveNumber(valueA, 0) - toPositiveNumber(valueB, 0)) * dir;
            }
            return String(valueA).localeCompare(String(valueB), "es", { sensitivity: "base" }) * dir;
        });
}

function sortArrow(state, key) {
    if (state.subgruposSortKey !== key) {
        return "";
    }
    return state.subgruposSortDir === "desc" ? " v" : " ^";
}

function asignaturaSortArrow(state, key) {
    if (state.asignaturasSortKey !== key) {
        return "";
    }
    return state.asignaturasSortDir === "desc" ? " v" : " ^";
}

function asignaturaSortValue(state, asignatura, key) {
    if (key === "categoria") return categoriaById(state, asignatura.categoriaId)?.nombre || "";
    if (key === "cuatrimestre") return cuatrimestreLabel(asignatura.cuatrimestre);
    if (key === "subgrupos") return Array.isArray(asignatura.subgrupos) ? asignatura.subgrupos.length : 0;
    if (key === "creditos") return totalCreditosAsignatura(asignatura);
    if (key === "codigo") return asignatura.codigoReferencia || "";
    return asignatura.nombre || asignatura.id || "";
}

function visibleAsignaturasWithIndex(state) {
    const text = (state.asignaturasFilterText || "").trim().toLowerCase();
    const categoria = state.asignaturasFilterCategoria || "";
    const cuatrimestre = state.asignaturasFilterCuatrimestre || "";
    const key = state.asignaturasSortKey || "nombre";
    const dir = state.asignaturasSortDir === "desc" ? -1 : 1;

    return state.asignaturas
        .map((asignatura, originalIndex) => ({ asignatura, originalIndex }))
        .filter(({ asignatura }) => {
            const categoriaObj = categoriaById(state, asignatura.categoriaId);
            const textHaystack = [
                asignatura.id,
                asignatura.codigoReferencia,
                asignatura.nombre,
                categoriaObj?.nombre,
                categoriaObj?.id,
                cuatrimestreLabel(asignatura.cuatrimestre),
            ].filter(Boolean).join(" ").toLowerCase();
            return (!text || textHaystack.includes(text))
                && (!categoria || asignatura.categoriaId === categoria)
                && (!cuatrimestre || asignatura.cuatrimestre === cuatrimestre);
        })
        .sort((a, b) => {
            const valueA = asignaturaSortValue(state, a.asignatura, key);
            const valueB = asignaturaSortValue(state, b.asignatura, key);
            if (typeof valueA === "number" || typeof valueB === "number") {
                return (toPositiveNumber(valueA, 0) - toPositiveNumber(valueB, 0)) * dir;
            }
            return String(valueA).localeCompare(String(valueB), "es", { numeric: true, sensitivity: "base" }) * dir;
        });
}

function renderCuatrimestreOptions(selectedId) {
    return CUATRIMESTRES.map((c) => `
        <option value="${escapeHtml(c.value)}" ${c.value === selectedId ? "selected" : ""}>${c.label}</option>
    `).join("");
}

function renderIdiomaOptions(selectedId) {
    return IDIOMAS.map((i) => `
        <option value="${escapeHtml(i.value)}" ${i.value === selectedId ? "selected" : ""}>${i.label}</option>
    `).join("");
}

function renderTipoSubgrupoOptions(selectedId) {
    return TIPOS_SUBGRUPO.map((t) => `
        <option value="${escapeHtml(t.value)}" ${t.value === selectedId ? "selected" : ""}>${t.label}</option>
    `).join("");
}

function renderCategoriaOptions(state, selectedId) {
    return `
        <option value="">Selecciona grado o facultad</option>
        ${state.categoriasAsignaturas.map((c) => `
            <option value="${escapeHtml(c.id)}" ${c.id === selectedId ? "selected" : ""}>
                ${escapeHtml(c.nombre)} (${escapeHtml(c.id)})
            </option>
        `).join("")}
    `;
}

function renderImportInstructions(state) {
    const categoryIds = state.categoriasAsignaturas.length > 0
        ? state.categoriasAsignaturas.map((c) => `${c.id} (${c.nombre})`).join(", ")
        : "No hay grados/facultades creados. Crea uno antes de importar.";

    return `Instrucciones para el LLM:
- Extrae la informacion de la asignatura desde la URL que aparecera al final del mensaje del usuario.
- Consulta esa URL y rellena la asignatura, su codigoReferencia y todos sus subgrupos con la informacion disponible.
- Devuelve solo JSON valido, sin texto alrededor.
- El campo categoriaId debe ser uno de estos valores: ${categoryIds}
- cuatrimestre puede ser: primer, segundo, anual.
- idioma puede ser: castellano, valenciano, ingles.
- tipo de subgrupo puede ser: teoria, practicas, seminario, practicas-informaticas, tutorias.
- codigoReferencia debe ser numerico.
- codigoTitulacion debe ser el codigo UV de titulacion, por ejemplo 1107.
- codigoUv en cada subgrupo es opcional pero recomendado: debe ser el codigo de grupo que aparece en la UV, por ejemplo C-O1, C-P2 o C-T.
- horas de subgrupo se guardan en el campo tecnico "creditos"; debe ser un numero igual o mayor que 0; 0 es valido si el grupo existe solo por organizacion.
- Si la asignatura es primer o segundo cuatrimestre, los subgrupos heredaran ese cuatrimestre.
- Si la asignatura es anual, cada subgrupo puede indicar primer, segundo o anual.

Ejemplo:
{
  "id": "MAT101",
  "nombre": "Algebra Lineal",
  "categoriaId": "grado-informatica",
  "codigoReferencia": "12345",
  "codigoTitulacion": "1107",
  "cuatrimestre": "primer",
  "subgrupos": [
    {
      "id": "T1",
      "nombre": "Teoria 1",
      "codigoUv": "C-T1",
      "tipo": "teoria",
      "idioma": "castellano",
      "cuatrimestre": "primer",
      "creditos": 6
    }
  ]
}`;
}

function validateImportedAsignatura(state, asignatura) {
    if (!asignatura.id || !asignatura.nombre || !asignatura.categoriaId || !asignatura.codigoReferencia || !asignatura.codigoTitulacion) {
        return "El JSON debe incluir id, nombre, categoriaId, codigoReferencia y codigoTitulacion.";
    }
    if (!/^\d+$/.test(asignatura.codigoReferencia)) {
        return "El codigoReferencia debe ser numerico.";
    }
    if (!/^\d+$/.test(asignatura.codigoTitulacion)) {
        return "El codigoTitulacion debe ser numerico.";
    }
    if (!categoriaById(state, asignatura.categoriaId)) {
        return "El categoriaId no coincide con ningun grado/facultad existente.";
    }
    if (!Array.isArray(asignatura.subgrupos) || asignatura.subgrupos.length === 0) {
        return "Incluye al menos un subgrupo en la asignatura importada.";
    }
    const invalidSubgrupo = asignatura.subgrupos.find((s) => !s.id || !s.nombre || !isNonNegativeNumber(s.creditos));
    if (invalidSubgrupo) {
        return "Cada subgrupo debe tener id, nombre y horas iguales o mayores que 0.";
    }
    const repeatedSubgrupo = asignatura.subgrupos.find((s, idx) => asignatura.subgrupos.some((other, otherIdx) => other.id === s.id && otherIdx !== idx));
    if (repeatedSubgrupo) {
        return "Los ids de subgrupo no pueden repetirse dentro de una asignatura.";
    }
    return "";
}

function isNonNegativeNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return false;
    }
    const num = Number.parseFloat(String(value).replace(",", "."));
    return Number.isFinite(num) && num >= 0;
}

export function renderAsignaturasSection(state) {
    const visibleAsignaturas = visibleAsignaturasWithIndex(state);

    return `
        <div class="card subject-panel">
            <div class="section-header subject-header">
                <div>
                    <h2>Asignaturas</h2>
                    <p class="status">Gestiona el catalogo de asignaturas del curso academico cargado.</p>
                </div>
                <div class="header-actions">
                    <button id="open-cat-asig-modal-btn" class="secondary" type="button">Grados / facultades</button>
                    <button id="save-asignaturas-btn" class="secondary" type="button">Guardar cambios</button>
                </div>
            </div>

            <div class="teacher-summary subject-summary">
                <div class="metric-box"><span>Total asignaturas</span><strong>${state.asignaturas.length}</strong></div>
                <div class="metric-box"><span>Visibles</span><strong>${visibleAsignaturas.length}</strong></div>
                <div class="metric-box"><span>Grados / facultades</span><strong>${state.categoriasAsignaturas.length}</strong></div>
                <div class="metric-box"><span>Horas visibles</span><strong>${totalCreditosAsignaturas(visibleAsignaturas.map((item) => item.asignatura))}</strong></div>
            </div>

            <div class="filter-bar subject-filters">
                <label>
                    Buscar
                    <input id="asig-filter-text" placeholder="Nombre, identificador, grado..." value="${escapeHtml(state.asignaturasFilterText || "")}" />
                </label>
                <label>
                    Grado / facultad
                    <select id="asig-filter-category">
                        <option value="">Todos</option>
                        ${state.categoriasAsignaturas.map((c) => `
                            <option value="${escapeHtml(c.id)}" ${state.asignaturasFilterCategoria === c.id ? "selected" : ""}>${escapeHtml(c.nombre)}</option>
                        `).join("")}
                    </select>
                </label>
                <label>
                    Cuatrimestre
                    <select id="asig-filter-cuatrimestre">
                        <option value="">Todos</option>
                        ${CUATRIMESTRES.map((c) => `
                            <option value="${escapeHtml(c.value)}" ${state.asignaturasFilterCuatrimestre === c.value ? "selected" : ""}>${c.label}</option>
                        `).join("")}
                    </select>
                </label>
                <button id="clear-asig-filters-btn" class="secondary" type="button">Limpiar filtros</button>
            </div>

            <div class="table-shell">
                <table class="table teacher-table">
                    <thead>
                        <tr>
                            <th><button class="table-sort" data-sort-asignaturas="nombre" type="button">Asignatura${asignaturaSortArrow(state, "nombre")}</button></th>
                            <th><button class="table-sort" data-sort-asignaturas="codigo" type="button">Codigo referencia${asignaturaSortArrow(state, "codigo")}</button></th>
                            <th><button class="table-sort" data-sort-asignaturas="categoria" type="button">Grado / facultad${asignaturaSortArrow(state, "categoria")}</button></th>
                            <th><button class="table-sort" data-sort-asignaturas="cuatrimestre" type="button">Cuatrimestre${asignaturaSortArrow(state, "cuatrimestre")}</button></th>
                            <th><button class="table-sort" data-sort-asignaturas="subgrupos" type="button">Subgrupos${asignaturaSortArrow(state, "subgrupos")}</button></th>
                            <th><button class="table-sort" data-sort-asignaturas="creditos" type="button">Horas${asignaturaSortArrow(state, "creditos")}</button></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.asignaturas.length === 0 ? `
                            <tr>
                                <td colspan="7" class="empty-cell">
                                    No hay asignaturas en este curso. Usa el boton + para crear la primera.
                                </td>
                            </tr>
                        ` : visibleAsignaturas.length === 0 ? `
                            <tr>
                                <td colspan="7" class="empty-cell">No hay asignaturas que coincidan con los filtros.</td>
                            </tr>
                        ` : visibleAsignaturas.map(({ asignatura: a, originalIndex }) => {
        const categoria = categoriaById(state, a.categoriaId);
        const warnings = asignaturaWarnings(state, a);
        const uvUrl = buildUvAsignaturaUrl(a, state.selectedCourse);
        return `
                                <tr class="${originalIndex === state.selectedAsignaturaIndex ? "row-active" : ""} ${warnings.length ? "row-warning" : ""}">
                                    <td>
                                        <div class="teacher-cell">
                                            <span class="avatar">${escapeHtml(asignaturaInitial(a))}</span>
                                            <span>
                                                <span class="subject-title-line">
                                                    <button class="link-button subject-name-button" data-open-asig-detail="${originalIndex}" type="button">${escapeHtml(a.nombre || "")}</button>
                                                    ${warnings.length ? `
                                                        <span class="warning-icon" title="${escapeHtml(warnings.join(" "))}" aria-label="Asignatura con informacion incompleta">!</span>
                                                        <span class="warning-label" title="${escapeHtml(warnings.join(" "))}">Incompleta</span>
                                                    ` : ""}
                                                </span>
                                                ${warnings.length ? `<small class="muted-line warning-summary">${escapeHtml(warnings[0])}</small>` : ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td><span class="subject-code">${escapeHtml(a.codigoReferencia || "Sin codigo")}</span></td>
                                    <td>
                                        ${categoria
                ? `<span class="badge">${escapeHtml(categoria.nombre)}</span>`
                : `<span class="badge danger-badge">Sin asociacion</span>`}
                                    </td>
                                    <td><span class="subject-code">${cuatrimestreLabel(a.cuatrimestre)}</span></td>
                                    <td><span class="num-pill muted-pill">${Array.isArray(a.subgrupos) ? a.subgrupos.length : 0}</span></td>
                                    <td><span class="num-pill">${totalCreditosAsignatura(a)}</span></td>
                                    <td class="table-actions">
                                        ${uvUrl ? `
                                            <a class="secondary mini icon-button web-link-button" href="${escapeHtml(uvUrl)}" target="_blank" rel="noopener noreferrer" title="Abrir informacion web de ${escapeHtml(a.nombre || a.id || "la asignatura")}" aria-label="Abrir informacion web de ${escapeHtml(a.nombre || a.id || "la asignatura")}">
                                                <span class="web-mini-icon" aria-hidden="true"></span>
                                            </a>
                                        ` : `
                                            <span class="mini icon-button web-link-button disabled" title="Completa codigo de referencia, titulacion y curso para abrir la web" aria-label="Web de asignatura no disponible">
                                                <span class="web-mini-icon" aria-hidden="true"></span>
                                            </span>
                                        `}
                                        <button class="secondary mini" data-edit-asig="${originalIndex}" type="button">Editar</button>
                                        <button class="warn mini" data-remove-asig="${originalIndex}" type="button">Eliminar</button>
                                    </td>
                                </tr>
                            `;
    }).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <button id="open-asig-modal-btn" class="fab" type="button" aria-label="Anadir asignatura" title="Anadir asignatura">+</button>
        ${state.isAsignaturaModalOpen ? renderAsignaturaModal(state) : ""}
        ${state.isCategoriaAsignaturaModalOpen ? renderCategoriasModal(state) : ""}
        ${state.isAsignaturaImportModalOpen ? renderAsignaturaImportModal(state) : ""}
        ${state.isAsignaturaDetailModalOpen ? renderAsignaturaDetailModal(state) : ""}
    `;
}

function renderAsignaturaModal(state) {
    const draft = state.asignaturaDraft || emptyAsignaturaDraft();
    const isEdit = state.asignaturaModalMode === "edit";
    const title = isEdit ? "Editar asignatura" : "Anadir asignatura";
    const actionLabel = isEdit ? "Guardar asignatura" : "Anadir asignatura";
    const draftCuatrimestre = normalizeCuatrimestre(draft.cuatrimestre || "primer");
    const subgrupos = Array.isArray(draft.subgrupos) ? draft.subgrupos : [];
    const editingSubgrupo = subgrupos[state.editingSubgrupoIndex] || null;
    const subgroupCanChooseCuatrimestre = draftCuatrimestre === "anual";
    const subgrupoFormCuatrimestre = editingSubgrupo?.cuatrimestre || (subgroupCanChooseCuatrimestre ? "primer" : draftCuatrimestre);
    const subgrupoActionLabel = editingSubgrupo ? "Guardar subgrupo" : "Anadir";
    return `
        <div class="modal-backdrop" id="asig-modal-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="asig-modal-title">
                <div class="modal-header">
                    <h2 id="asig-modal-title">${title}</h2>
                    <button class="secondary mini" id="close-asig-modal-btn" type="button">Cerrar</button>
                </div>
                <div class="grid">
                    <section class="form-section">
                        <div class="form-section-title">
                            <div>
                                <span class="section-kicker">Datos de la asignatura</span>
                                <h3>Identificacion</h3>
                            </div>
                            ${isEdit ? "" : `<button id="open-asig-import-modal-btn" class="secondary mini" type="button">Importar asignatura</button>`}
                        </div>
                        <div class="grid grid-2">
                            <label>
                                id
                                <input id="asig-modal-id" placeholder="ej. MAT101" value="${escapeHtml(draft.id || "")}" />
                            </label>
                            <label>
                                Nombre
                                <input id="asig-modal-name" placeholder="Nombre de la asignatura" value="${escapeHtml(draft.nombre || "")}" />
                            </label>
                            <label>
                                Grado / facultad
                                <select id="asig-modal-category">
                                    ${renderCategoriaOptions(state, draft.categoriaId || "")}
                                </select>
                            </label>
                            <label>
                                Cuatrimestre
                                <select id="asig-modal-cuatrimestre">
                                    ${renderCuatrimestreOptions(draftCuatrimestre)}
                                </select>
                            </label>
                            <label>
                                Codigo de referencia
                                <input id="asig-modal-codigo-ref" inputmode="numeric" placeholder="ej. 12345" value="${escapeHtml(draft.codigoReferencia || "")}" />
                            </label>
                            <label>
                                Codigo titulacion UV
                                <input id="asig-modal-codigo-titulacion" inputmode="numeric" placeholder="ej. 1107" value="${escapeHtml(draft.codigoTitulacion || "")}" />
                            </label>
                        </div>
                    </section>

                    <section class="form-section">
                        <div class="form-section-title">
                            <div>
                                <span class="section-kicker">Subgrupos</span>
                                <h3>Grupos docentes dentro de la asignatura</h3>
                            </div>
                        </div>
                        <div class="inline-form-subgroup">
                            <input id="subgrupo-id" placeholder="id (ej. T1)" value="${escapeHtml(editingSubgrupo?.id || "")}" />
                            <input id="subgrupo-name" placeholder="Nombre visible" value="${escapeHtml(editingSubgrupo?.nombre || "")}" />
                            <input id="subgrupo-codigo-uv" placeholder="Codigo UV (ej. C-O1)" value="${escapeHtml(editingSubgrupo?.codigoUv || "")}" />
                            <select id="subgrupo-tipo">
                                ${renderTipoSubgrupoOptions(editingSubgrupo?.tipo || "teoria")}
                            </select>
                            <select id="subgrupo-idioma">
                                ${renderIdiomaOptions(editingSubgrupo?.idioma || "castellano")}
                            </select>
                            <select id="subgrupo-cuatrimestre" ${subgroupCanChooseCuatrimestre ? "" : "disabled"}>
                                ${renderCuatrimestreOptions(subgrupoFormCuatrimestre)}
                            </select>
                            <input id="subgrupo-creditos" type="number" min="0" step="any" placeholder="Horas" value="${editingSubgrupo ? escapeHtml(String(toPositiveNumber(editingSubgrupo.creditos, 0))) : ""}" />
                            <button id="add-subgrupo-btn" class="secondary" type="button">${subgrupoActionLabel}</button>
                            ${editingSubgrupo ? `<button id="cancel-subgrupo-edit-btn" class="secondary" type="button">Cancelar</button>` : ""}
                        </div>

                        <div class="table-shell compact-table">
                            <table class="table teacher-table">
                                <thead>
                                    <tr>
                                        <th><button class="table-sort" data-sort-subgrupos="nombre" type="button">Subgrupo${sortArrow(state, "nombre")}</button></th>
                                        <th><button class="table-sort" data-sort-subgrupos="tipo" type="button">Tipo${sortArrow(state, "tipo")}</button></th>
                                        <th><button class="table-sort" data-sort-subgrupos="idioma" type="button">Idioma${sortArrow(state, "idioma")}</button></th>
                                        <th><button class="table-sort" data-sort-subgrupos="cuatrimestre" type="button">Cuatrimestre${sortArrow(state, "cuatrimestre")}</button></th>
                                        <th><button class="table-sort" data-sort-subgrupos="creditos" type="button">Horas carga${sortArrow(state, "creditos")}</button></th>
                                        <th>Sesiones</th>
                                        <th>Horas calendario</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subgrupos.length === 0 ? `
                                        <tr><td colspan="8" class="empty-cell">No hay subgrupos definidos para esta asignatura.</td></tr>
                                    ` : sortedSubgruposWithIndex(subgrupos, state).map(({ subgrupo: s, originalIndex }) => `
                                        <tr class="${originalIndex === state.editingSubgrupoIndex ? "row-active" : ""}">
                                            <td>
                                                <strong>${escapeHtml(s.nombre || "")}</strong>
                                                <small class="muted-line">${escapeHtml(s.id || "")}</small>
                                                ${s.codigoUv ? `<small class="muted-line">UV ${escapeHtml(s.codigoUv)}</small>` : ""}
                                            </td>
                                            <td><span class="badge">${tipoSubgrupoLabel(s.tipo)}</span></td>
                                            <td><span class="badge">${idiomaLabel(s.idioma)}</span></td>
                                            <td><span class="subject-code">${cuatrimestreLabel(s.cuatrimestre)}</span></td>
                                            <td><span class="num-pill muted-pill">${toPositiveNumber(s.creditos, 0)}</span></td>
                                            <td><span class="num-pill muted-pill">${Array.isArray(s.sesiones) ? s.sesiones.length : 0}</span></td>
                                            <td><span class="num-pill">${totalHorasSesiones(s.sesiones || [])}</span></td>
                                            <td class="table-actions">
                                                <button class="secondary mini" data-edit-subgrupo="${originalIndex}" type="button">Editar</button>
                                                <button class="secondary mini" data-clear-subgrupo-calendar="${originalIndex}" type="button" ${Array.isArray(s.sesiones) && s.sesiones.length > 0 ? "" : "disabled"}>Limpiar calendario</button>
                                                <button class="warn mini" data-remove-subgrupo="${originalIndex}" type="button">Eliminar</button>
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section class="form-section">
                        <div class="form-section-title">
                            <div>
                                <span class="section-kicker">Sesiones UV</span>
                                <h3>Importar eventos de calendario</h3>
                            </div>
                        </div>
                        <div class="inline-form-uv">
                            <button id="import-uv-sessions-btn" class="secondary" type="button" ${state.isUvImporting ? "disabled" : ""}>
                                ${state.isUvImporting ? "Importando..." : "Preparar importacion UV"}
                            </button>
                            <button id="clear-all-subgrupo-calendars-btn" class="warn" type="button" ${totalSesionesSubgrupos(subgrupos) > 0 ? "" : "disabled"}>Borrar todos los calendarios</button>
                        </div>
                        ${state.uvImportStatus ? `<p class="status uv-import-status">${escapeHtml(state.uvImportStatus)}</p>` : ""}
                        ${renderUvImportSummary(state)}
                    </section>

                    <div class="grid grid-4 compact-stats">
                        <div class="metric-box"><span>Cuatrimestre</span><strong>${cuatrimestreLabel(draftCuatrimestre)}</strong></div>
                        <div class="metric-box"><span>Subgrupos</span><strong>${subgrupos.length}</strong></div>
                        <div class="metric-box"><span>Horas subgrupos</span><strong>${subgrupos.reduce((sum, s) => sum + toPositiveNumber(s.creditos, 0), 0)}</strong></div>
                        <div class="metric-box"><span>Horas importadas</span><strong>${totalHorasSubgrupos(subgrupos)}</strong></div>
                    </div>

                    <button id="apply-asig-modal-btn" type="button">${actionLabel}</button>
                </div>
            </section>
        </div>
    `;
}

function renderUvTargetOptions(state, row) {
    const subgrupos = Array.isArray(state.asignaturaDraft?.subgrupos) ? state.asignaturaDraft.subgrupos : [];
    const selected = String(row.targetIndex ?? UV_TARGET_SKIP);
    const options = [
        `<option value="${UV_TARGET_SKIP}" ${selected === UV_TARGET_SKIP ? "selected" : ""}>No importar por ahora</option>`,
        `<option value="${UV_TARGET_CREATE}" ${selected === UV_TARGET_CREATE ? "selected" : ""}>Crear nuevo subgrupo</option>`,
        ...subgrupos.map((subgrupo, index) => `
            <option value="${index}" ${selected === String(index) ? "selected" : ""}>
                ${escapeHtml(subgrupoTargetLabel(subgrupo))}
            </option>
        `),
    ];
    return options.join("");
}

function renderUvImportSummary(state) {
    const rows = Array.isArray(state.uvImportSummary) ? state.uvImportSummary : [];
    if (rows.length === 0) {
        return "";
    }
    return `
        <div class="table-shell compact-table uv-import-preview">
            <table class="table teacher-table">
                <thead>
                    <tr>
                        <th>Origen UV</th>
                        <th>Subgrupo destino</th>
                        <th>Cuatrimestre</th>
                        <th>Sesiones</th>
                        <th>Horas</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row, index) => `
                        <tr>
                            <td><span class="subject-code">${escapeHtml(row.source || "")}</span></td>
                            <td>
                                <select class="compact-select" data-uv-target="${escapeHtml(row.id || String(index))}">
                                    ${renderUvTargetOptions(state, row)}
                                </select>
                                <small class="muted-line">${escapeHtml(row.target || "")}</small>
                            </td>
                            <td><span class="badge">${cuatrimestreLabel(row.cuatrimestre)}</span></td>
                            <td>
                                <span class="num-pill">${toPositiveNumber(row.sesiones, 0)}</span>
                                <small class="muted-line">de ${toPositiveNumber(row.imported, 0)}</small>
                            </td>
                            <td><span class="num-pill muted-pill">${toPositiveNumber(row.horas, 0)}</span></td>
                            <td><span class="badge">${escapeHtml(row.action || "")}</span></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="form-actions">
                <button id="apply-uv-import-preview-btn" class="secondary" type="button">Aplicar importacion revisada</button>
            </div>
        </div>
    `;
}

function renderCategoriasModal(state) {
    const draft = state.categoriaAsignaturaDraft || emptyCategoriaDraft();
    const isEdit = state.categoriaAsignaturaMode === "edit";
    const title = isEdit ? "Editar grado / facultad" : "Gestionar grados / facultades";
    const actionLabel = isEdit ? "Guardar grado / facultad" : "Anadir grado / facultad";

    return `
        <div class="modal-backdrop" id="cat-asig-modal-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="cat-asig-modal-title">
                <div class="modal-header">
                    <h2 id="cat-asig-modal-title">${title}</h2>
                    <button class="secondary mini" id="close-cat-asig-modal-btn" type="button">Cerrar</button>
                </div>
                <div class="grid">
                    <section class="form-section">
                        <div class="form-section-title">
                            <span class="section-kicker">Grado / facultad</span>
                            <h3>Identificador persistente y nombre visible</h3>
                        </div>
                        <div class="grid grid-2">
                            <label>
                                id
                                <input id="cat-asig-id" placeholder="ej. grado-informatica" value="${escapeHtml(draft.id || "")}" ${isEdit ? "disabled" : ""} />
                            </label>
                            <label>
                                Nombre visible
                                <input id="cat-asig-name" placeholder="Nombre del grado o facultad" value="${escapeHtml(draft.nombre || "")}" />
                            </label>
                        </div>
                        <div class="form-actions">
                            <button id="apply-cat-asig-btn" type="button">${actionLabel}</button>
                            ${isEdit ? `<button id="cancel-cat-asig-edit-btn" class="secondary" type="button">Cancelar edicion</button>` : ""}
                        </div>
                    </section>

                    <div class="table-shell compact-table">
                        <table class="table teacher-table">
                            <thead>
                                <tr><th>Grado / facultad</th><th>Uso</th><th></th></tr>
                            </thead>
                            <tbody>
                                ${state.categoriasAsignaturas.length === 0 ? `
                                    <tr><td colspan="3" class="empty-cell">No hay grados o facultades todavia.</td></tr>
                                ` : state.categoriasAsignaturas.map((c, idx) => `
                                    <tr>
                                        <td>
                                            <strong>${escapeHtml(c.nombre)}</strong>
                                            <small class="muted-line">${escapeHtml(c.id)}</small>
                                        </td>
                                        <td><span class="num-pill muted-pill">${countAsignaturasByCategoria(state, c.id)}</span></td>
                                        <td class="table-actions">
                                            <button class="secondary mini" data-edit-cat-asig="${idx}" type="button">Editar</button>
                                            <button class="warn mini" data-remove-cat-asig="${idx}" type="button">Eliminar</button>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function renderAsignaturaImportModal(state) {
    return `
        <div class="modal-backdrop" id="asig-import-modal-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="asig-import-modal-title">
                <div class="modal-header">
                    <div>
                        <h2 id="asig-import-modal-title">Importar asignatura</h2>
                        <p class="status">Pega un JSON con la asignatura, su codigo y sus subgrupos.</p>
                    </div>
                    <button class="secondary mini" id="close-asig-import-modal-btn" type="button">Cerrar</button>
                </div>
                <div class="grid">
                    <section class="form-section">
                        <div class="form-section-title import-title-row">
                            <div>
                                <span class="section-kicker">Importacion</span>
                                <h3>Datos generados por LLM</h3>
                            </div>
                            <button id="toggle-asig-import-help-btn" class="secondary mini icon-button" type="button" title="Instrucciones para LLM" aria-label="Instrucciones para LLM">?</button>
                        </div>
                        ${state.showAsignaturaImportHelp ? `<pre class="help-panel">${escapeHtml(renderImportInstructions(state))}</pre>` : ""}
                        <label>
                            JSON de la asignatura
                            <textarea id="asig-import-text" class="import-textarea" placeholder='{"id":"MAT101","nombre":"Algebra Lineal",...}'>${escapeHtml(state.asignaturaImportText || "")}</textarea>
                        </label>
                    </section>
                    <button id="apply-asig-import-btn" type="button">Importar asignatura</button>
                </div>
            </section>
        </div>
    `;
}

function renderAsignaturaDetailModal(state) {
    const asignatura = state.asignaturas[state.detailAsignaturaIndex] || null;
    if (!asignatura) {
        return "";
    }
    const categoria = categoriaById(state, asignatura.categoriaId);
    const subgrupos = Array.isArray(asignatura.subgrupos) ? asignatura.subgrupos : [];
    const sesiones = subgrupos.flatMap((subgrupo) => (subgrupo.sesiones || []).map((sesion) => ({ subgrupo, sesion })));

    return `
        <div class="modal-backdrop" id="asig-detail-modal-backdrop">
            <section class="card modal professor-modal" role="dialog" aria-modal="true" aria-labelledby="asig-detail-modal-title">
                <div class="modal-header">
                    <div>
                        <h2 id="asig-detail-modal-title">${escapeHtml(asignatura.nombre || "Asignatura")}</h2>
                        <p class="status">${escapeHtml(asignatura.id || "")}${asignatura.codigoReferencia ? ` &middot; Codigo ${escapeHtml(asignatura.codigoReferencia)}` : ""}</p>
                    </div>
                    <button class="secondary mini" id="close-asig-detail-modal-btn" type="button">Cerrar</button>
                </div>

                <div class="grid grid-3 compact-stats">
                    <div class="metric-box"><span>Grado / facultad</span><strong>${escapeHtml(categoria?.nombre || "Sin asociacion")}</strong></div>
                    <div class="metric-box"><span>Cuatrimestre</span><strong>${cuatrimestreLabel(asignatura.cuatrimestre)}</strong></div>
                    <div class="metric-box"><span>Horas</span><strong>${totalCreditosAsignatura(asignatura)}</strong></div>
                </div>

                <div class="table-shell compact-table">
                    <table class="table teacher-table">
                        <thead>
                            <tr><th>Subgrupo</th><th>Tipo</th><th>Idioma</th><th>Cuatrimestre</th><th>Horas carga</th><th>Sesiones</th><th>Horas calendario</th></tr>
                        </thead>
                        <tbody>
                            ${subgrupos.length === 0 ? `
                                <tr><td colspan="7" class="empty-cell">No hay subgrupos definidos para esta asignatura.</td></tr>
                            ` : sortedSubgruposWithIndex(subgrupos, state).map(({ subgrupo }) => `
                                <tr>
                                    <td>
                                        <strong>${escapeHtml(subgrupo.nombre || "")}</strong>
                                        <small class="muted-line">${escapeHtml(subgrupo.id || "")}</small>
                                        ${subgrupo.codigoUv ? `<small class="muted-line">UV ${escapeHtml(subgrupo.codigoUv)}</small>` : ""}
                                    </td>
                                    <td><span class="badge">${tipoSubgrupoLabel(subgrupo.tipo)}</span></td>
                                    <td><span class="badge">${idiomaLabel(subgrupo.idioma)}</span></td>
                                    <td><span class="subject-code">${cuatrimestreLabel(subgrupo.cuatrimestre)}</span></td>
                                    <td><span class="num-pill">${toPositiveNumber(subgrupo.creditos, 0)}</span></td>
                                    <td><span class="num-pill muted-pill">${Array.isArray(subgrupo.sesiones) ? subgrupo.sesiones.length : 0}</span></td>
                                    <td><span class="num-pill">${totalHorasSesiones(subgrupo.sesiones || [])}</span></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="table-shell compact-table">
                    <table class="table teacher-table">
                        <thead>
                            <tr><th>Subgrupo</th><th>Franja</th><th>Dia</th><th>Horario</th><th>Horas</th><th>Lugar</th></tr>
                        </thead>
                        <tbody>
                            ${sesiones.length === 0 ? `
                                <tr><td colspan="6" class="empty-cell">No hay sesiones importadas para esta asignatura.</td></tr>
                            ` : sesiones.map(({ subgrupo, sesion }) => `
                                <tr>
                                    <td><span class="badge">${escapeHtml(subgrupo.id || "")}</span></td>
                                    <td>${escapeHtml([sesion.franjaInicio, sesion.franjaFin].filter(Boolean).join(" - "))}</td>
                                    <td>${escapeHtml(sesion.dia || "")}</td>
                                    <td>${escapeHtml([sesion.horaInicio, sesion.horaFin].filter(Boolean).join(" - "))}</td>
                                    <td><span class="num-pill muted-pill">${sesionHoras(sesion)}</span></td>
                                    <td>${escapeHtml(sesion.lugar || "")}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

export function bindAsignaturasEvents({ app, state, setStatus, render, saveAsignaturas, saveCategoriasAsignaturas, importUvSchedule }) {
    const filterText = document.getElementById("asig-filter-text");
    if (filterText) {
        const applyTextFilter = () => {
            state.asignaturasFilterText = filterText.value || "";
            render();
        };
        filterText.onchange = applyTextFilter;
        filterText.onkeydown = (e) => {
            if (e.key === "Enter") {
                applyTextFilter();
            }
        };
    }

    const filterCategory = document.getElementById("asig-filter-category");
    if (filterCategory) {
        filterCategory.onchange = () => {
            state.asignaturasFilterCategoria = filterCategory.value || "";
            render();
        };
    }

    const filterCuatrimestre = document.getElementById("asig-filter-cuatrimestre");
    if (filterCuatrimestre) {
        filterCuatrimestre.onchange = () => {
            state.asignaturasFilterCuatrimestre = filterCuatrimestre.value || "";
            render();
        };
    }

    const clearFiltersBtn = document.getElementById("clear-asig-filters-btn");
    if (clearFiltersBtn) {
        clearFiltersBtn.onclick = () => {
            state.asignaturasFilterText = "";
            state.asignaturasFilterCategoria = "";
            state.asignaturasFilterCuatrimestre = "";
            render();
        };
    }

    app.querySelectorAll("[data-sort-asignaturas]").forEach((btn) => {
        btn.onclick = () => {
            const key = btn.dataset.sortAsignaturas;
            if (state.asignaturasSortKey === key) {
                state.asignaturasSortDir = state.asignaturasSortDir === "asc" ? "desc" : "asc";
            } else {
                state.asignaturasSortKey = key;
                state.asignaturasSortDir = key === "creditos" || key === "subgrupos" ? "desc" : "asc";
            }
            render();
        };
    });

    app.querySelectorAll("[data-open-asig-detail]").forEach((btn) => {
        btn.onclick = () => {
            state.detailAsignaturaIndex = Number(btn.dataset.openAsigDetail);
            state.isAsignaturaDetailModalOpen = true;
            state.selectedAsignaturaIndex = state.detailAsignaturaIndex;
            render();
        };
    });

    const openModalBtn = document.getElementById("open-asig-modal-btn");
    if (openModalBtn) {
        openModalBtn.onclick = () => {
            state.asignaturaModalMode = "create";
            state.editingAsignaturaIndex = -1;
            state.editingSubgrupoIndex = -1;
            state.isUvImporting = false;
            state.uvImportStatus = "";
            state.uvImportSummary = [];
            state.uvImportAnyoFinCurso = "";
            state.asignaturaDraft = emptyAsignaturaDraft();
            state.isAsignaturaModalOpen = true;
            render();
        };
    }

    const openCategoriasBtn = document.getElementById("open-cat-asig-modal-btn");
    if (openCategoriasBtn) {
        openCategoriasBtn.onclick = () => {
            state.categoriaAsignaturaMode = "create";
            state.editingCategoriaAsignaturaIndex = -1;
            state.categoriaAsignaturaDraft = emptyCategoriaDraft();
            state.isCategoriaAsignaturaModalOpen = true;
            render();
        };
    }

    const openImportBtn = document.getElementById("open-asig-import-modal-btn");
    if (openImportBtn) {
        openImportBtn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            state.isAsignaturaImportModalOpen = true;
            state.showAsignaturaImportHelp = false;
            state.asignaturaImportText = "";
            render();
        };
    }

    const closeModalBtn = document.getElementById("close-asig-modal-btn");
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            closeAsignaturaModal(state);
            render();
        };
    }

    const closeCategoriasBtn = document.getElementById("close-cat-asig-modal-btn");
    if (closeCategoriasBtn) {
        closeCategoriasBtn.onclick = () => {
            closeCategoriaModal(state);
            render();
        };
    }

    const closeImportBtn = document.getElementById("close-asig-import-modal-btn");
    if (closeImportBtn) {
        closeImportBtn.onclick = () => {
            closeAsignaturaImportModal(state);
            render();
        };
    }

    const closeDetailBtn = document.getElementById("close-asig-detail-modal-btn");
    if (closeDetailBtn) {
        closeDetailBtn.onclick = () => {
            closeAsignaturaDetailModal(state);
            render();
        };
    }

    const modalBackdrop = document.getElementById("asig-modal-backdrop");
    if (modalBackdrop) {
        modalBackdrop.onclick = (e) => {
            if (e.target === modalBackdrop) {
                closeAsignaturaModal(state);
                render();
            }
        };
    }

    const categoriasBackdrop = document.getElementById("cat-asig-modal-backdrop");
    if (categoriasBackdrop) {
        categoriasBackdrop.onclick = (e) => {
            if (e.target === categoriasBackdrop) {
                closeCategoriaModal(state);
                render();
            }
        };
    }

    const importBackdrop = document.getElementById("asig-import-modal-backdrop");
    if (importBackdrop) {
        importBackdrop.onclick = (e) => {
            if (e.target === importBackdrop) {
                closeAsignaturaImportModal(state);
                render();
            }
        };
    }

    const detailBackdrop = document.getElementById("asig-detail-modal-backdrop");
    if (detailBackdrop) {
        detailBackdrop.onclick = (e) => {
            if (e.target === detailBackdrop) {
                closeAsignaturaDetailModal(state);
                render();
            }
        };
    }

    const toggleImportHelpBtn = document.getElementById("toggle-asig-import-help-btn");
    if (toggleImportHelpBtn) {
        toggleImportHelpBtn.onclick = () => {
            state.asignaturaImportText = document.getElementById("asig-import-text")?.value || "";
            state.showAsignaturaImportHelp = !state.showAsignaturaImportHelp;
            render();
        };
    }

    const applyImportBtn = document.getElementById("apply-asig-import-btn");
    if (applyImportBtn) {
        applyImportBtn.onclick = async () => {
            const rawText = (document.getElementById("asig-import-text")?.value || "").trim();
            if (!rawText) {
                setStatus("Pega el JSON de la asignatura antes de importar.");
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch (err) {
                setStatus(`JSON no valido: ${err.message}`);
                return;
            }
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                setStatus("El importador espera un unico objeto JSON de asignatura.");
                return;
            }

            const validationError = validateImportedAsignatura(state, parsed);
            if (validationError) {
                setStatus(validationError);
                return;
            }

            const nextAsignatura = normalizeAsignatura(parsed);
            state.asignaturaModalMode = "create";
            state.editingAsignaturaIndex = -1;
            state.editingSubgrupoIndex = -1;
            state.asignaturaDraft = draftFromAsignatura(nextAsignatura);
            state.isAsignaturaModalOpen = true;
            closeAsignaturaImportModal(state);
            setStatus("Informacion importada en el formulario. Revisa los datos y pulsa Anadir asignatura para crearla.");
        };
    }

    const applyModalBtn = document.getElementById("apply-asig-modal-btn");
    if (applyModalBtn) {
        applyModalBtn.onclick = async () => {
            updateAsignaturaDraftFromModal(state);
            const id = state.asignaturaDraft.id;
            const nombre = state.asignaturaDraft.nombre;
            const categoriaId = state.asignaturaDraft.categoriaId;
            const codigoReferencia = state.asignaturaDraft.codigoReferencia;
            const codigoTitulacion = state.asignaturaDraft.codigoTitulacion;
            const color = state.asignaturaDraft.color || "";
            const cuatrimestre = state.asignaturaDraft.cuatrimestre;
            const subgrupos = state.asignaturaDraft.subgrupos || [];
            const isEdit = state.asignaturaModalMode === "edit";
            const editIndex = state.editingAsignaturaIndex;

            if (!id || !nombre || !categoriaId || !codigoReferencia || !codigoTitulacion) {
                setStatus("Completa id, nombre, grado/facultad, codigo de referencia y codigo titulacion UV.");
                return;
            }
            if (!/^\d+$/.test(codigoReferencia)) {
                setStatus("El codigo de referencia debe ser numerico.");
                return;
            }
            if (!/^\d+$/.test(codigoTitulacion)) {
                setStatus("El codigo titulacion UV debe ser numerico.");
                return;
            }
            if (!categoriaById(state, categoriaId)) {
                setStatus("Selecciona un grado o facultad valido.");
                return;
            }
            if (state.asignaturas.some((a, i) => a.id === id && (!isEdit || i !== editIndex))) {
                setStatus("Ese id de asignatura ya existe.");
                return;
            }

            const nextAsignatura = normalizeAsignatura({
                id,
                nombre,
                categoriaId,
                codigoReferencia,
                codigoTitulacion,
                color,
                cuatrimestre,
                subgrupos,
            });
            if (isEdit && state.asignaturas[editIndex]) {
                state.asignaturas[editIndex] = nextAsignatura;
                state.selectedAsignaturaIndex = editIndex;
            } else {
                state.asignaturas.push(nextAsignatura);
                state.selectedAsignaturaIndex = state.asignaturas.length - 1;
            }

            closeAsignaturaModal(state);
            await saveAsignaturas();
        };
    }

    const cuatrimestreSelect = document.getElementById("asig-modal-cuatrimestre");
    if (cuatrimestreSelect) {
        cuatrimestreSelect.onchange = () => {
            updateAsignaturaDraftFromModal(state);
            render();
        };
    }

    app.querySelectorAll("[data-sort-subgrupos]").forEach((btn) => {
        btn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            const key = btn.dataset.sortSubgrupos;
            if (state.subgruposSortKey === key) {
                state.subgruposSortDir = state.subgruposSortDir === "asc" ? "desc" : "asc";
            } else {
                state.subgruposSortKey = key;
                state.subgruposSortDir = key === "creditos" ? "desc" : "asc";
            }
            render();
        };
    });

    const addSubgrupoBtn = document.getElementById("add-subgrupo-btn");
    if (addSubgrupoBtn) {
        addSubgrupoBtn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            const editIndex = state.editingSubgrupoIndex;
            const isEditingSubgrupo = editIndex >= 0 && Boolean(state.asignaturaDraft.subgrupos?.[editIndex]);
            const subjectCuatrimestre = normalizeCuatrimestre(state.asignaturaDraft.cuatrimestre || "primer");
            const id = (document.getElementById("subgrupo-id")?.value || "").trim();
            const nombre = (document.getElementById("subgrupo-name")?.value || "").trim();
            const codigoUv = (document.getElementById("subgrupo-codigo-uv")?.value || "").trim();
            const tipo = document.getElementById("subgrupo-tipo")?.value || "teoria";
            const idioma = document.getElementById("subgrupo-idioma")?.value || "castellano";
            const cuatrimestre = subjectCuatrimestre === "anual"
                ? document.getElementById("subgrupo-cuatrimestre")?.value || "primer"
                : subjectCuatrimestre;
            const creditos = toPositiveNumber(document.getElementById("subgrupo-creditos")?.value || "0", 0);

            if (!id || !nombre) {
                setStatus("Completa id y nombre del subgrupo.");
                return;
            }
            const rawCreditos = document.getElementById("subgrupo-creditos")?.value || "";
            if (!isNonNegativeNumber(rawCreditos)) {
                setStatus("Las horas del subgrupo deben ser iguales o mayores que 0.");
                return;
            }
            if ((state.asignaturaDraft.subgrupos || []).some((s, idx) => s.id === id && (!isEditingSubgrupo || idx !== editIndex))) {
                setStatus("Ese id de subgrupo ya existe en esta asignatura.");
                return;
            }

            const nextSubgrupo = normalizeSubgrupo({
                id,
                nombre,
                codigoUv,
                color: isEditingSubgrupo ? state.asignaturaDraft.subgrupos[editIndex].color || "" : "",
                tipo,
                idioma,
                cuatrimestre,
                creditos,
                sesiones: isEditingSubgrupo ? state.asignaturaDraft.subgrupos[editIndex].sesiones || [] : [],
            }, subjectCuatrimestre);
            if (isEditingSubgrupo) {
                state.asignaturaDraft.subgrupos[editIndex] = nextSubgrupo;
                state.editingSubgrupoIndex = -1;
                setStatus("Subgrupo actualizado.");
            } else {
                state.asignaturaDraft.subgrupos.push(nextSubgrupo);
                setStatus("Subgrupo anadido a la asignatura.");
            }
            render();
        };
    }

    const importUvSessionsBtn = document.getElementById("import-uv-sessions-btn");
    if (importUvSessionsBtn) {
        importUvSessionsBtn.onclick = async () => {
            updateAsignaturaDraftFromModal(state);
            updateUvImportDraftFromModal(state);
            const codigoAsignatura = state.asignaturaDraft.codigoReferencia;
            const idTitulacion = state.asignaturaDraft.codigoTitulacion;
            const anyoFinCurso = state.uvAnyoFinCurso;

            if (!codigoAsignatura || !/^\d+$/.test(codigoAsignatura)) {
                state.uvImportStatus = "Indica un codigo de referencia numerico para importar sesiones UV.";
                render();
                return;
            }
            if (!idTitulacion || !/^\d+$/.test(idTitulacion)) {
                state.uvImportStatus = "Completa el codigo titulacion UV de la asignatura. Ejemplo: 1107.";
                render();
                return;
            }
            if (!anyoFinCurso || !/^\d{4}$/.test(anyoFinCurso)) {
                state.uvImportStatus = "No se ha podido deducir el anio final del curso cargado. Usa un curso tipo 2026-2027.";
                render();
                return;
            }
            if (typeof importUvSchedule !== "function") {
                state.uvImportStatus = "No se ha configurado la importacion UV en el cliente.";
                render();
                return;
            }

            try {
                state.isUvImporting = true;
                state.uvImportStatus = "Importando sesiones desde la pagina de la UV...";
                state.uvImportSummary = [];
                state.uvImportAnyoFinCurso = anyoFinCurso;
                render();
                const data = await importUvSchedule({ codigoAsignatura, idTitulacion, anyoFinCurso });
                const groups = (data.grupos || []).map((group) => ({ ...group, url: data.url || "" }));
                state.uvImportSummary = buildUvImportPreview(state, groups, anyoFinCurso);
                const pending = state.uvImportSummary.filter((row) => row.targetIndex === UV_TARGET_SKIP).length;
                const pendingText = pending ? ` ${pending} filas quedan pendientes de asociar.` : "";
                state.uvImportStatus = `Propuesta preparada con ${state.uvImportSummary.length} filas de importacion.${pendingText} Revisa los destinos y aplica la importacion.`;
                setStatus(state.uvImportStatus);
            } catch (err) {
                const message = err?.message === "Failed to fetch"
                    ? "No se pudo conectar con el worker/API. En local debe estar levantado en http://127.0.0.1:8787."
                    : err.message;
                state.uvImportStatus = `Error importando sesiones UV: ${message}`;
                setStatus(state.uvImportStatus);
            } finally {
                state.isUvImporting = false;
                render();
            }
        };
    }

    app.querySelectorAll("[data-uv-target]").forEach((select) => {
        select.onchange = () => {
            updateAsignaturaDraftFromModal(state);
            const rowId = select.dataset.uvTarget;
            const rowIndex = state.uvImportSummary.findIndex((row, idx) => (row.id || String(idx)) === rowId);
            if (rowIndex < 0) {
                return;
            }
            state.uvImportSummary[rowIndex] = refreshUvPreviewRow(state, {
                ...state.uvImportSummary[rowIndex],
                targetIndex: select.value,
            });
            render();
        };
    });

    const applyUvImportPreviewBtn = document.getElementById("apply-uv-import-preview-btn");
    if (applyUvImportPreviewBtn) {
        applyUvImportPreviewBtn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            state.uvImportSummary = state.uvImportSummary.map((row) => refreshUvPreviewRow(state, row));
            const result = applyUvImportPreview(state);
            const pendingText = result.pending ? ` ${result.pending} filas no se han aplicado.` : "";
            state.uvImportStatus = `Aplicadas ${result.sesiones} sesiones UV en ${result.updated + result.created} subgrupos.${pendingText} Revisa y guarda la asignatura.`;
            state.uvImportSummary = [];
            setStatus(state.uvImportStatus);
            render();
        };
    }

    const cancelSubgrupoEditBtn = document.getElementById("cancel-subgrupo-edit-btn");
    if (cancelSubgrupoEditBtn) {
        cancelSubgrupoEditBtn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            state.editingSubgrupoIndex = -1;
            render();
        };
    }

    app.querySelectorAll("[data-edit-subgrupo]").forEach((btn) => {
        btn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            state.editingSubgrupoIndex = Number(btn.dataset.editSubgrupo);
            render();
        };
    });

    app.querySelectorAll("[data-remove-subgrupo]").forEach((btn) => {
        btn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            const idx = Number(btn.dataset.removeSubgrupo);
            state.asignaturaDraft.subgrupos.splice(idx, 1);
            if (state.editingSubgrupoIndex === idx) {
                state.editingSubgrupoIndex = -1;
            } else if (state.editingSubgrupoIndex > idx) {
                state.editingSubgrupoIndex -= 1;
            }
            setStatus("Subgrupo eliminado de la asignatura.");
            render();
        };
    });

    app.querySelectorAll("[data-clear-subgrupo-calendar]").forEach((btn) => {
        btn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            const idx = Number(btn.dataset.clearSubgrupoCalendar);
            const subgrupo = state.asignaturaDraft.subgrupos?.[idx];
            if (!subgrupo) {
                return;
            }
            const removed = Array.isArray(subgrupo.sesiones) ? subgrupo.sesiones.length : 0;
            state.asignaturaDraft.subgrupos[idx] = normalizeSubgrupo({
                ...subgrupo,
                sesiones: [],
            }, state.asignaturaDraft.cuatrimestre || "primer");
            state.uvImportSummary = [];
            state.uvImportStatus = removed
                ? `Calendario borrado del subgrupo ${subgrupo.id || subgrupo.nombre}: ${removed} sesiones eliminadas.`
                : `El subgrupo ${subgrupo.id || subgrupo.nombre} no tenia sesiones importadas.`;
            setStatus(state.uvImportStatus);
            render();
        };
    });

    const clearAllSubgrupoCalendarsBtn = document.getElementById("clear-all-subgrupo-calendars-btn");
    if (clearAllSubgrupoCalendarsBtn) {
        clearAllSubgrupoCalendarsBtn.onclick = () => {
            updateAsignaturaDraftFromModal(state);
            const removed = totalSesionesSubgrupos(state.asignaturaDraft.subgrupos || []);
            state.asignaturaDraft.subgrupos = (state.asignaturaDraft.subgrupos || []).map((subgrupo) => normalizeSubgrupo({
                ...subgrupo,
                sesiones: [],
            }, state.asignaturaDraft.cuatrimestre || "primer"));
            state.uvImportSummary = [];
            state.uvImportStatus = removed
                ? `Calendarios borrados de todos los subgrupos: ${removed} sesiones eliminadas.`
                : "No habia sesiones importadas para borrar.";
            setStatus(state.uvImportStatus);
            render();
        };
    }

    const applyCategoriaBtn = document.getElementById("apply-cat-asig-btn");
    if (applyCategoriaBtn) {
        applyCategoriaBtn.onclick = async () => {
            updateCategoriaDraftFromModal(state);
            const id = state.categoriaAsignaturaDraft.id;
            const nombre = state.categoriaAsignaturaDraft.nombre;
            const isEdit = state.categoriaAsignaturaMode === "edit";
            const editIndex = state.editingCategoriaAsignaturaIndex;

            if (!id || !nombre) {
                setStatus("Completa id y nombre del grado o facultad.");
                return;
            }
            if (state.categoriasAsignaturas.some((c, i) => c.id === id && (!isEdit || i !== editIndex))) {
                setStatus("Ese id de grado/facultad ya existe.");
                return;
            }

            const nextCategoria = normalizeCategoriaAsignatura({ id, nombre });
            if (isEdit && state.categoriasAsignaturas[editIndex]) {
                state.categoriasAsignaturas[editIndex] = nextCategoria;
            } else {
                state.categoriasAsignaturas.push(nextCategoria);
            }

            state.categoriaAsignaturaMode = "create";
            state.editingCategoriaAsignaturaIndex = -1;
            state.categoriaAsignaturaDraft = emptyCategoriaDraft();
            await saveCategoriasAsignaturas();
        };
    }

    const cancelCategoriaEditBtn = document.getElementById("cancel-cat-asig-edit-btn");
    if (cancelCategoriaEditBtn) {
        cancelCategoriaEditBtn.onclick = () => {
            state.categoriaAsignaturaMode = "create";
            state.editingCategoriaAsignaturaIndex = -1;
            state.categoriaAsignaturaDraft = emptyCategoriaDraft();
            render();
        };
    }

    app.querySelectorAll("[data-edit-asig]").forEach((btn) => {
        btn.onclick = () => {
            const idx = Number(btn.dataset.editAsig);
            const asignatura = state.asignaturas[idx];
            if (!asignatura) {
                return;
            }

            state.selectedAsignaturaIndex = idx;
            state.asignaturaModalMode = "edit";
            state.editingAsignaturaIndex = idx;
            state.editingSubgrupoIndex = -1;
            state.isUvImporting = false;
            state.uvImportStatus = "";
            state.uvImportSummary = [];
            state.uvImportAnyoFinCurso = "";
            state.asignaturaDraft = draftFromAsignatura(asignatura);
            state.isAsignaturaModalOpen = true;
            render();
        };
    });

    app.querySelectorAll("[data-remove-asig]").forEach((btn) => {
        btn.onclick = async () => {
            const idx = Number(btn.dataset.removeAsig);
            state.asignaturas.splice(idx, 1);
            if (state.selectedAsignaturaIndex >= state.asignaturas.length) {
                state.selectedAsignaturaIndex = state.asignaturas.length - 1;
            }
            if (state.detailAsignaturaIndex === idx) {
                closeAsignaturaDetailModal(state);
            } else if (state.detailAsignaturaIndex > idx) {
                state.detailAsignaturaIndex -= 1;
            }
            closeAsignaturaModal(state);
            await saveAsignaturas();
        };
    });

    app.querySelectorAll("[data-edit-cat-asig]").forEach((btn) => {
        btn.onclick = () => {
            const idx = Number(btn.dataset.editCatAsig);
            const categoria = state.categoriasAsignaturas[idx];
            if (!categoria) {
                return;
            }
            state.categoriaAsignaturaMode = "edit";
            state.editingCategoriaAsignaturaIndex = idx;
            state.categoriaAsignaturaDraft = draftFromCategoria(categoria);
            render();
        };
    });

    app.querySelectorAll("[data-remove-cat-asig]").forEach((btn) => {
        btn.onclick = async () => {
            const idx = Number(btn.dataset.removeCatAsig);
            const categoria = state.categoriasAsignaturas[idx];
            if (!categoria) {
                return;
            }
            if (countAsignaturasByCategoria(state, categoria.id) > 0) {
                setStatus("No se puede eliminar un grado/facultad con asignaturas asociadas.");
                return;
            }
            state.categoriasAsignaturas.splice(idx, 1);
            state.categoriaAsignaturaMode = "create";
            state.editingCategoriaAsignaturaIndex = -1;
            state.categoriaAsignaturaDraft = emptyCategoriaDraft();
            await saveCategoriasAsignaturas();
        };
    });

    const saveAsignaturasBtn = document.getElementById("save-asignaturas-btn");
    if (saveAsignaturasBtn) {
        saveAsignaturasBtn.onclick = async () => {
            await saveAsignaturas();
            await saveCategoriasAsignaturas();
        };
    }
}
