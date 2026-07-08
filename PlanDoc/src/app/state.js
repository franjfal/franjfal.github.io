export const state = {
    isLoggedIn: false,
    status: "Listo",
    isPreparingData: false,
    preparingMessage: "",
    tab: "home",
    publicMode: false,
    publicTab: "profesores",
    publicProfesorFilter: "",
    publicProfesorSort: "nombre",
    publicProfesorCalendarId: "",
    publicProfesorCalendarView: "timeGridWeek",
    publicSimulationMode: false,
    publicSimulationSelectorOpen: false,
    publicSimulatedSubgroups: [],
    publicSimulationExpandedAsignaturas: {},
    publicAsignaturaFilter: "",
    publicAsignaturaSort: "nombre",
    publicAsignaturaCategoria: "",
    publicAsignaturaCuatrimestre: "",
    publicAsignaturaEstado: "all",
    publicDetailAsignaturaId: "",
    publicSubgrupoFilter: "",
    publicSubgrupoTipo: "",
    publicSubgrupoCuatrimestre: "",
    publicSubgrupoEstado: "all",
    publicRepartoMode: "profesor",
    publicRepartoFilter: "",
    publicCalendarView: "timeGridWeek",
    publicHorarioSelectedAsignaturas: null,
    publicHorarioSelectedSubgrupos: null,
    publicHorarioExpandedCategorias: {},
    publicHorarioExpandedAsignaturas: {},
    courses: [],
    selectedCourse: "",
    isCourseModalOpen: false,
    profesores: [],
    profesoresVersion: "",
    profesoresFilterText: "",
    profesoresFilterReducciones: "",
    profesoresFilterAjustable: "",
    profesoresSortKey: "nombre",
    profesoresSortDir: "asc",
    isProfesorModalOpen: false,
    profesorModalMode: "create",
    editingProfesorIndex: -1,
    profesorDraft: {
        id: "",
        nombre: "",
        apellidos: "",
        creditosObjetivo: "",
        docenciaAjustable: true,
        reducciones: [],
    },
    isProfesorImportModalOpen: false,
    showProfesorImportHelp: false,
    profesorImportText: "",
    asignaturas: [],
    asignaturasVersion: "",
    isAsignaturaModalOpen: false,
    asignaturaModalMode: "create",
    editingAsignaturaIndex: -1,
    asignaturaDraft: {
        id: "",
        nombre: "",
        categoriaId: "",
        codigoReferencia: "",
        codigoTitulacion: "",
        color: "",
        cuatrimestre: "primer",
        subgrupos: [],
    },
    categoriasAsignaturas: [],
    categoriasAsignaturasVersion: "",
    isCategoriaAsignaturaModalOpen: false,
    categoriaAsignaturaMode: "create",
    editingCategoriaAsignaturaIndex: -1,
    categoriaAsignaturaDraft: {
        id: "",
        nombre: "",
    },
    trabajos: [],
    trabajosVersion: "",
    trabajosTab: "tfg",
    isTrabajoModalOpen: false,
    trabajoModalMode: "create",
    editingTrabajoIndex: -1,
    trabajoDraft: {
        id: "",
        tipo: "tfg",
        titulo: "",
        totalTrabajos: "",
        peso: "",
        asignaciones: {},
    },
    docencia: [],
    docenciaVersion: "",
    docenciaTab: "reparto",
    docenciaFilterCategoria: "",
    docenciaShowPendingOnly: false,
    selectedDocenciaAsignaturaId: "",
    editingDocenciaId: "",
    docenciaOverlapWarning: null,
    isAsignaturaImportModalOpen: false,
    showAsignaturaImportHelp: false,
    asignaturaImportText: "",
    isAsignaturaDetailModalOpen: false,
    detailAsignaturaIndex: -1,
    uvImportStatus: "",
    uvImportSummary: [],
    uvImportAnyoFinCurso: "",
    isUvImporting: false,
    uvAnyoFinCurso: "",
    editingSubgrupoIndex: -1,
    subgruposSortKey: "tipo",
    subgruposSortDir: "asc",
    asignaturasFilterText: "",
    asignaturasFilterCategoria: "",
    asignaturasFilterCuatrimestre: "",
    asignaturasSortKey: "nombre",
    asignaturasSortDir: "asc",
    calendarView: "timeGridWeek",
    calendarDate: "",
    calendarExpandedAsignaturas: {},
    calendarCheckOverlaps: false,
    selectedProfesorIndex: -1,
    selectedAsignaturaIndex: -1,
};

export function resetCourseSlices() {
    state.profesores = [];
    state.profesoresVersion = "";
    state.profesoresFilterText = "";
    state.profesoresFilterReducciones = "";
    state.profesoresFilterAjustable = "";
    state.profesoresSortKey = "nombre";
    state.profesoresSortDir = "asc";
    state.isProfesorModalOpen = false;
    state.profesorModalMode = "create";
    state.editingProfesorIndex = -1;
    state.profesorDraft = {
        id: "",
        nombre: "",
        apellidos: "",
        creditosObjetivo: "",
        docenciaAjustable: true,
        reducciones: [],
    };
    state.isProfesorImportModalOpen = false;
    state.showProfesorImportHelp = false;
    state.profesorImportText = "";
    state.asignaturas = [];
    state.asignaturasVersion = "";
    state.isAsignaturaModalOpen = false;
    state.asignaturaModalMode = "create";
    state.editingAsignaturaIndex = -1;
    state.asignaturaDraft = {
        id: "",
        nombre: "",
        categoriaId: "",
        codigoReferencia: "",
        codigoTitulacion: "",
        color: "",
        cuatrimestre: "primer",
        subgrupos: [],
    };
    state.categoriasAsignaturas = [];
    state.categoriasAsignaturasVersion = "";
    state.isCategoriaAsignaturaModalOpen = false;
    state.categoriaAsignaturaMode = "create";
    state.editingCategoriaAsignaturaIndex = -1;
    state.categoriaAsignaturaDraft = {
        id: "",
        nombre: "",
    };
    state.trabajos = [];
    state.trabajosVersion = "";
    state.trabajosTab = "tfg";
    state.isTrabajoModalOpen = false;
    state.trabajoModalMode = "create";
    state.editingTrabajoIndex = -1;
    state.trabajoDraft = {
        id: "",
        tipo: "tfg",
        titulo: "",
        totalTrabajos: "",
        peso: "",
        asignaciones: {},
    };
    state.docencia = [];
    state.docenciaVersion = "";
    state.docenciaTab = "reparto";
    state.docenciaFilterCategoria = "";
    state.docenciaShowPendingOnly = false;
    state.selectedDocenciaAsignaturaId = "";
    state.editingDocenciaId = "";
    state.docenciaOverlapWarning = null;
    state.isAsignaturaImportModalOpen = false;
    state.showAsignaturaImportHelp = false;
    state.asignaturaImportText = "";
    state.isAsignaturaDetailModalOpen = false;
    state.detailAsignaturaIndex = -1;
    state.uvImportStatus = "";
    state.uvImportSummary = [];
    state.uvImportAnyoFinCurso = "";
    state.isUvImporting = false;
    state.uvAnyoFinCurso = "";
    state.editingSubgrupoIndex = -1;
    state.subgruposSortKey = "tipo";
    state.subgruposSortDir = "asc";
    state.asignaturasFilterText = "";
    state.asignaturasFilterCategoria = "";
    state.asignaturasFilterCuatrimestre = "";
    state.asignaturasSortKey = "nombre";
    state.asignaturasSortDir = "asc";
    state.calendarView = "timeGridWeek";
    state.calendarDate = "";
    state.calendarExpandedAsignaturas = {};
    state.calendarCheckOverlaps = false;
    state.publicHorarioSelectedAsignaturas = null;
    state.publicHorarioSelectedSubgrupos = null;
    state.publicHorarioExpandedCategorias = {};
    state.publicHorarioExpandedAsignaturas = {};
    state.publicSimulationSelectorOpen = false;
    state.selectedProfesorIndex = -1;
    state.selectedAsignaturaIndex = -1;
}
