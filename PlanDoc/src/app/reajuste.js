import { toPositiveNumber } from "./utils.js";

export function totalReduccionesProfesor(profesor) {
    return (profesor.reducciones || []).reduce((sum, reduccion) => sum + toPositiveNumber(reduccion.creditos, 0), 0);
}

export function capacidadProfesor(profesor) {
    return Number(Math.max(0, toPositiveNumber(profesor.creditosObjetivo, 0) - totalReduccionesProfesor(profesor)).toFixed(2));
}

export function cargaTfmPorProfesor(trabajos) {
    const byProfesor = new Map();
    (trabajos || [])
        .filter((trabajo) => trabajo?.tipo === "tfm")
        .forEach((trabajo) => {
            const peso = toPositiveNumber(trabajo.peso, 0);
            Object.entries(trabajo.asignaciones || {}).forEach(([profesorId, count]) => {
                if (!profesorId) {
                    return;
                }
                const carga = toPositiveNumber(count, 0) * peso;
                byProfesor.set(profesorId, Number(((byProfesor.get(profesorId) || 0) + carga).toFixed(2)));
            });
        });
    return byProfesor;
}

function trabajosRepartibles(trabajos) {
    return (trabajos || []).filter((trabajo) => ["tfg", "practicas"].includes(trabajo?.tipo));
}

function totalTrabajosAsignados(trabajo) {
    return Object.values(trabajo?.asignaciones || {}).reduce((sum, count) => sum + toPositiveNumber(count, 0), 0);
}

export function totalHorasTrabajosRepartibles(trabajos) {
    return Number(trabajosRepartibles(trabajos).reduce((sum, trabajo) => {
        const totalTrabajos = toPositiveNumber(trabajo.totalTrabajos, 0) || totalTrabajosAsignados(trabajo);
        return sum + (totalTrabajos * toPositiveNumber(trabajo.peso, 0));
    }, 0).toFixed(2));
}

export function totalHorasAsignaturas(asignaturas) {
    return Number((asignaturas || []).reduce((sum, asignatura) => (
        sum + (asignatura.subgrupos || []).reduce((subSum, subgrupo) => subSum + toPositiveNumber(subgrupo.creditos, 0), 0)
    ), 0).toFixed(2));
}

export function horasAsignadasPorProfesor(docencia) {
    const byProfesor = new Map();
    (docencia || []).forEach((item) => {
        if (!item.profesorId) {
            return;
        }
        byProfesor.set(item.profesorId, Number(((byProfesor.get(item.profesorId) || 0) + toPositiveNumber(item.creditos, 0)).toFixed(2)));
    });
    return byProfesor;
}

export function horasTrabajosRepartiblesPorProfesor(trabajos) {
    const byProfesor = new Map();
    trabajosRepartibles(trabajos).forEach((trabajo) => {
        const peso = toPositiveNumber(trabajo.peso, 0);
        Object.entries(trabajo.asignaciones || {}).forEach(([profesorId, count]) => {
            if (!profesorId) {
                return;
            }
            const carga = toPositiveNumber(count, 0) * peso;
            byProfesor.set(profesorId, Number(((byProfesor.get(profesorId) || 0) + carga).toFixed(2)));
        });
    });
    return byProfesor;
}

export function calcularReajusteDocente(state) {
    const totalCargaAsignaturas = totalHorasAsignaturas(state.asignaturas);
    const totalCargaTrabajosRepartibles = totalHorasTrabajosRepartibles(state.trabajos);
    const totalCarga = Number((totalCargaAsignaturas + totalCargaTrabajosRepartibles).toFixed(2));
    const profesores = state.profesores || [];
    const tfmAsignados = cargaTfmPorProfesor(state.trabajos);
    const profesoresConCapacidad = profesores.map((profesor) => {
        const capacidadBase = capacidadProfesor(profesor);
        const cargaTfm = tfmAsignados.get(profesor.id) || 0;
        return {
            profesor,
            capacidadBase,
            cargaTfm,
            capacidad: Number(Math.max(0, capacidadBase - cargaTfm).toFixed(2)),
            esAjustable: profesor.docenciaAjustable !== false,
        };
    });
    const fijos = profesoresConCapacidad.filter((item) => !item.esAjustable);
    const ajustables = profesoresConCapacidad.filter((item) => item.esAjustable);
    const totalTfm = Number(profesoresConCapacidad.reduce((sum, item) => sum + item.cargaTfm, 0).toFixed(2));
    const capacidadFija = Number(fijos.reduce((sum, item) => sum + item.capacidad, 0).toFixed(2));
    const cargaReajustable = Number(Math.max(0, totalCarga - capacidadFija).toFixed(2));
    const capacidadAjustable = Number(ajustables.reduce((sum, item) => sum + item.capacidad, 0).toFixed(2));
    const capacidadTotal = Number((capacidadFija + capacidadAjustable).toFixed(2));
    const diferenciaGlobal = Number((totalCarga - capacidadTotal).toFixed(2));
    const profesorIds = new Set(profesores.map((profesor) => profesor.id));
    const docenciaValida = (state.docencia || []).filter((item) => profesorIds.has(item.profesorId));
    const asignadas = horasAsignadasPorProfesor(docenciaValida);
    const trabajosAsignados = horasTrabajosRepartiblesPorProfesor(state.trabajos);

    const profesoresDetalle = profesoresConCapacidad.map(({ profesor, capacidadBase, cargaTfm, capacidad, esAjustable }) => {
        const proporcion = esAjustable && capacidadAjustable > 0
            ? capacidad / capacidadAjustable
            : 0;
        const objetivoReal = esAjustable && capacidadAjustable > 0
            ? Number((proporcion * cargaReajustable).toFixed(2))
            : capacidad;
        const asignado = Number(((asignadas.get(profesor.id) || 0) + (trabajosAsignados.get(profesor.id) || 0)).toFixed(2));
        return {
            profesor,
            esAjustable,
            capacidadBase,
            cargaTfm,
            capacidad,
            proporcion,
            proporcionPct: Number((proporcion * 100).toFixed(2)),
            objetivoReal,
            reajuste: Number((objetivoReal - capacidad).toFixed(2)),
            asignado,
            diferencia: Number((asignado - objetivoReal).toFixed(2)),
        };
    });

    const totalAsignado = Number(profesoresDetalle.reduce((sum, item) => sum + item.asignado, 0).toFixed(2));
    return {
        totalCarga,
        totalCargaAsignaturas,
        totalCargaTrabajosRepartibles,
        totalAsignado,
        pendiente: Number(Math.max(0, totalCarga - totalAsignado).toFixed(2)),
        capacidadFija,
        cargaReajustable,
        capacidadAjustable,
        capacidadTotal,
        diferenciaGlobal,
        totalTfm,
        profesoresFijos: fijos.length,
        profesoresAjustables: ajustables.length,
        profesoresDetalle,
    };
}
