import { profesoresStats } from "./profesores.js";
import { escapeHtml } from "./utils.js";

export function renderHomeSection(state) {
    const profStats = profesoresStats(state.profesores);
    const publicUrl = state.selectedCourse
        ? `${window.location.origin}${window.location.pathname}?public=1&course=${encodeURIComponent(state.selectedCourse)}`
        : "";
    return `
        <div class="grid grid-2">
            <div class="card public-link-card">
                <div>
                    <h2>Vista publica</h2>
                    <p class="status">Ruta completa de solo lectura para compartir el reparto sin iniciar sesion.</p>
                </div>
                ${publicUrl ? `
                    <a class="button-link" href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener">Abrir vista publica</a>
                    <label class="public-url-field">
                        URL publica del curso
                        <span class="copy-url-row">
                            <input id="public-url-input" readonly value="${escapeHtml(publicUrl)}" />
                            <button id="copy-public-url-btn" class="secondary icon-button copy-url-btn" type="button" title="Copiar URL publica" aria-label="Copiar URL publica">
                                <span class="copy-icon" aria-hidden="true"></span>
                            </button>
                        </span>
                    </label>
                ` : `<p class="status">Selecciona o crea un curso para generar la URL publica.</p>`}
            </div>
            <div class="card stat-card">
                <div class="stat-label">Curso activo</div>
                <div class="stat-value">${escapeHtml(state.selectedCourse || "(sin curso)")}</div>
            </div>
            <div class="card stat-card">
                <div class="stat-label">Profesores</div>
                <div class="stat-value">${state.profesores.length}</div>
            </div>
            <div class="card stat-card">
                <div class="stat-label">Asignaturas</div>
                <div class="stat-value">${state.asignaturas.length}</div>
            </div>
            <div class="card stat-card">
                <div class="stat-label">Horas disponibles (profesores)</div>
                <div class="stat-value">${profStats.disponibles}</div>
            </div>
        </div>
    `;
}
