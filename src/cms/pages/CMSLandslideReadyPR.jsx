import { useState } from "react";
import { FaEdit, FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/CMSProjects.css";

// ─── hardcoded seed data (replace with API fetch later) ───────────────────────
const SEED = [
    { id: 1, name: "Utuado",     stage: "Completado", start_year: 2023, renewal_year: 2024 },
    { id: 2, name: "Maricao",    stage: "Completado", start_year: 2023, renewal_year: 2024 },
    { id: 3, name: "Ponce",      stage: "Completado", start_year: 2023, renewal_year: 2024 },
    { id: 4, name: "Adjuntas",   stage: "Completado", start_year: 2023, renewal_year: 2024 },
    { id: 5, name: "Cabo Rojo",  stage: "Completado", start_year: 2023, renewal_year: 2024 },
    { id: 6, name: "San Germán", stage: "Completado", start_year: 2023, renewal_year: 2024 },
];

const STAGE_OPTIONS = ["Completado", "En Progreso", "Pendiente"];

export default function CMSLandslideReadyPR() {
    const [municipalities, setMunicipalities] = useState(SEED);
    const [showForm, setShowForm]             = useState(false);
    const [editItem, setEditItem]             = useState(null);
    const [currentPage, setCurrentPage]       = useState(1);
    const itemsPerPage = 8;

    const totalPages = Math.ceil(municipalities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated  = municipalities.slice(startIndex, startIndex + itemsPerPage);

    // ── TODO: replace with real fetch ──
    // const API_URL = `${import.meta.env.VITE_API_URL}`;
    // useEffect(() => {
    //   fetch(`${API_URL}/landslideready-municipalities`)
    //     .then(r => r.json()).then(setMunicipalities);
    // }, []);

    const handleOpenForm = (item = null) => {
        setEditItem(item);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCloseForm = () => { setShowForm(false); setEditItem(null); };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar municipio?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#e55353",
        });
        if (!confirm.isConfirmed) return;

        // TODO: await fetch(`${API_URL}/landslideready-municipalities/${id}`, { method: "DELETE", ... })
        setMunicipalities(prev => prev.filter(m => m.id !== id));
        Swal.fire("Eliminado", "El municipio fue eliminado correctamente.", "success");
    };

    const handleSave = (item) => {
        if (item.id) {
            setMunicipalities(prev => prev.map(m => m.id === item.id ? item : m));
        } else {
            const newId = Date.now();
            setMunicipalities(prev => [...prev, { ...item, id: newId }]);
        }
        handleCloseForm();
    };

    const stagePill = (stage) => {
        const map = {
            "Completado":  { bg: "#def7ec", color: "#03543f" },
            "En Progreso": { bg: "#fef3c7", color: "#92400e" },
            "Pendiente":   { bg: "#e1effe", color: "#1e429f" },
        };
        const s = map[stage] || { bg: "#f3f4f6", color: "#374151" };
        return (
            <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "50px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: s.bg,
                color: s.color,
            }}>
                {stage}
            </span>
        );
    };

    return (
        <div className="cms-projects-wrapper">

            {/* HEADER */}
            <div className="cms-page-header">
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Municipios LandslideReady</h1>
                    <p className="cms-page-subtitle">
                        Administre los municipios participantes del programa LandslideReady PR.
                    </p>
                </div>
                {!showForm && (
                    <button className="cms-btn" onClick={() => handleOpenForm()}>
                        <FaPlus /> Añadir Municipio
                    </button>
                )}
            </div>

            {/* MAIN CONTENT */}
            {!showForm ? (
                <div className="cms-card">
                    <div className="cms-table-container">
                        <table className="cms-table">
                            <thead>
                                <tr>
                                    <th>Municipio</th>
                                    <th>Estado</th>
                                    <th>Año Inicio</th>
                                    <th>Año Renovación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((m, idx) => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                                        <td>{stagePill(m.stage)}</td>
                                        <td>{m.start_year ?? "—"}</td>
                                        <td>{m.renewal_year ?? "—"}</td>
                                        <td>
                                            <button
                                                className="cms-icon-btn"
                                                onClick={() => handleOpenForm(m)}
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="cms-icon-btn cms-delete-btn"
                                                onClick={() => handleDelete(m.id)}
                                                title="Eliminar"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="cms-pagination">
                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            title="Página anterior"
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="cms-page-info">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            title="Siguiente página"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="cms-card">
                    <MunicipalityForm
                        item={editItem}
                        onClose={handleCloseForm}
                        onSave={handleSave}
                    />
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   FORM COMPONENT
────────────────────────────────────────────────────────────── */
function MunicipalityForm({ item, onClose, onSave }) {
    const isEdit = !!item;

    const [formData, setFormData] = useState({
        name:         item?.name         ?? "",
        stage:        item?.stage        ?? "Completado",
        start_year:   item?.start_year   ?? "",
        renewal_year: item?.renewal_year ?? "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.name.trim()) {
            Swal.fire("Error", "El nombre del municipio es obligatorio.", "warning");
            return false;
        }
        if (formData.start_year && formData.renewal_year) {
            if (Number(formData.renewal_year) < Number(formData.start_year)) {
                Swal.fire("Error", "El año de renovación no puede ser menor al año de iniciación.", "warning");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const confirm = await Swal.fire({
            title: isEdit ? "Guardar cambios" : "Crear Municipio",
            text: "¿Desea confirmar esta acción?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#6fa174",
        });
        if (!confirm.isConfirmed) return;

        // TODO: connect to API
        // const token = localStorage.getItem("cmsAdmin");
        // const method = isEdit ? "PUT" : "POST";
        // const url = isEdit
        //   ? `${API_URL}/landslideready-municipalities/${item.id}`
        //   : `${API_URL}/landslideready-municipalities`;
        // await fetch(url, { method, headers: { "Content-Type": "application/json",
        //   "Authorization": `Bearer ${token}` }, body: JSON.stringify(formData) });

        onSave({ ...item, ...formData });
        Swal.fire("Éxito", "Operación exitosa", "success");
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "#13241e" }}>
                {isEdit ? "Editar Municipio" : "Nuevo Municipio"}
            </h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>
                Ingrese los detalles del municipio participante en el programa LandslideReady.
            </p>

            <div className="cms-form-grid">

                <div className="cms-form-section-title">Información del Municipio</div>

                <div className="cms-form-group span-2">
                    <label>Nombre del Municipio <span className="required-asterisk">*</span></label>
                    <input
                        className="cms-input"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Utuado"
                    />
                </div>

                <div className="cms-form-group span-2">
                    <label>Estado</label>
                    <select
                        className="cms-select"
                        name="stage"
                        value={formData.stage}
                        onChange={handleChange}
                    >
                        {STAGE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                <div className="cms-form-group">
                    <label>Año de Iniciación</label>
                    <input
                        className="cms-input"
                        type="number"
                        name="start_year"
                        value={formData.start_year}
                        onChange={handleChange}
                        placeholder="Ej: 2023"
                    />
                </div>

                <div className="cms-form-group">
                    <label>Año de Renovación</label>
                    <input
                        className="cms-input"
                        type="number"
                        name="renewal_year"
                        value={formData.renewal_year}
                        onChange={handleChange}
                        placeholder="Ej: 2024"
                    />
                </div>

                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" className="cms-btn">
                        {isEdit ? "Guardar Cambios" : "Crear Municipio"}
                    </button>
                </div>

            </div>
        </form>
    );
}