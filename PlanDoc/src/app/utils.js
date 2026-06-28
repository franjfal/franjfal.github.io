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
