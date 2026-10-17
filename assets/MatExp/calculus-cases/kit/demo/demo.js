// Smoke test of the kit (not published).
CCGenerator.define({
  id: "demo", script: "demo/demo.js",
  classroom(cfg, t) { const g = CCGenerator.rotate(cfg.students, ["A", "B", "C"]); return { students: cfg.students, groups: g.map((x) => ({ label: `${t("Equipo", "Team")} ${x.index + 1}`, role: x.role, size: x.size })) }; },
  kicker: (X) => "Calculus Cases · Demo",
  docs: (X) => [{ id: "a", n: "01", title: "Hoja A", count: X.cfg.students, render: (w) => { w.title("Hoja A", null); w.paragraph("Texto con $\\sum_{k=1}^{n} 1/k^2 < 2$ y $e^x \\approx 1 + x$."); w.lines("fill"); },
    print: { who: "Todos", copies: "1 por estudiante", how: "Doble cara", when: "Lanzamiento" } }],
  bundles: (X) => [{ id: "teacher", label: "Paquete docente", docs: ["a"], use: "1, para ti" }],
  slides: (X) => [{ title: "Demo", banner: true, subtitle: "Un caso" }, { title: "Grupos", table: { head: ["Grupo", "Papel"], rows: X.room.groups.map((g) => [g.label, g.role]), widths: [1, 1] } }],
  guide: (X) => ({ steps: ["Antes", "Lanzamiento", "Cierre"], material: ["Nada"] }),
  summary: (X) => [["Estudiantes", String(X.room.students)]],
});
