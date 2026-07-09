export function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function toPositiveNumber(value, fallback = 0) {
    const num = Number.parseFloat(String(value).replace(",", "."));
    if (!Number.isFinite(num) || num < 0) {
        return fallback;
    }
    return Number(num.toFixed(2));
}

export function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function noteText(value) {
    return String(value || "").trim();
}

export function renderNoteButton(note, label = "Ver nota") {
    const text = noteText(note);
    if (!text) {
        return "";
    }
    const escapedText = escapeHtml(text).replace(/\n/g, "&#10;");
    return `
        <button class="note-warning-button" data-note-text="${escapedText}" type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">!</button>
    `;
}

export function bindNoteButtons(root = document) {
    root.querySelectorAll("[data-note-text]").forEach((btn) => {
        btn.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const note = noteText(btn.dataset.noteText || "");
            if (note) {
                window.alert(note);
            }
        };
    });
}
