import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/CMSProjects.css";

const STAGE_OPTIONS = ["Completado", "En Progreso", "Pendiente"];
const API_URL = import.meta.env.VITE_API_URL;

export default function CMSLandslideReadyPR() {
    const [municipalities, setMunicipalities] = useState([]);
    const [showForm, setShowForm]             = useState(false);
    const [editItem, setEditItem]             = useState(null);
    const [currentPage, setCurrentPage]       = useState(1);
    const itemsPerPage = 8;

    const totalPages = Math.ceil(municipalities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated  = municipalities.slice(startIndex, startIndex + itemsPerPage);

    // Fetch data from the real API on component mount
    useEffect(() => {
        fetch(`${API_URL}/municipalities`)
            .then(r => {
                if (!r.ok) throw new Error("Failed to fetch");
                return r.json();
            })
            .then(data => setMunicipalities(data || []))
            .catch(err => console.error("Error loading municipalities:", err));
    }, []);

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

        const token = localStorage.getItem("cmsAdmin"); // Adjust this key if your token name is different

        try {
            const res = await fetch(`${API_URL}/municipalities/${id}`, { 
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to delete");

            setMunicipalities(prev => prev.filter(m => m.id !== id));
            Swal.fire("Eliminado", "El municipio fue eliminado correctamente.", "success");
            
            // Adjust pagination if you delete the last item on a page
            if (paginated.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo eliminar el municipio.", "error");
        }
    };

    const handleSave = (savedItem) => {
        setMunicipalities(prev => {
            const exists = prev.find(m => m.id === savedItem.id);
            if (exists) {
                return prev.map(m => m.id === savedItem.id ? savedItem : m);
            } else {
                return [...prev, savedItem];
            }
        });
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
                                {paginated.length > 0 ? paginated.map((m) => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                                        <td>{stagePill(m.stage)}</td>
                                        <td>{m.start_year ?? "—"}</td>
                                        <td>{m.renovation_year ?? "—"}</td>
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
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                                            No hay municipios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
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
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                className="cms-icon-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                title="Siguiente página"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
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

    const PR_MUNICIPALITIES = [
        "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito",
        "Añasco", "Arecibo", "Arroyo", "Barceloneta", "Barranquitas",
        "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas",
        "Carolina", "Cataño", "Cayey", "Ceiba", "Ciales",
        "Cidra", "Coamo", "Comerío", "Corozal", "Culebra",
        "Dorado", "Fajardo", "Florida", "Guánica", "Guayama",
        "Guayanilla", "Guaynabo", "Gurabo", "Hatillo", "Hormigueros",
        "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos",
        "Lajas", "Lares", "Las Marías", "Las Piedras", "Loíza",
        "Luquillo", "Manatí", "Maricao", "Maunabo", "Mayagüez",
        "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis",
        "Patillas", "Peñuelas", "Ponce", "Quebradillas", "Rincón",
        "Río Grande", "Sabana Grande", "Salinas", "San Germán",
        "San Juan", "San Lorenzo", "San Sebastián", "Santa Isabel",
        "Toa Alta", "Toa Baja", "Trujillo Alto", "Utuado",
        "Vega Alta", "Vega Baja", "Vieques", "Villalba",
        "Yabucoa", "Yauco"
    ];

    const [formData, setFormData] = useState({
        name:            item?.name            ?? "",
        stage:           item?.stage           ?? "Completado",
        start_year:      item?.start_year      ?? "",
        renovation_year: item?.renovation_year ?? "",
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
        if (formData.start_year && formData.renovation_year) {
            if (Number(formData.renovation_year) < Number(formData.start_year)) {
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

        const token = localStorage.getItem("cmsAdmin"); // Adjust this key if your token name is different
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit
            ? `${API_URL}/municipalities/${item.id}`
            : `${API_URL}/municipalities`;

        // Format payload to properly send ints or nulls to the Go pointers (*int)
        const payload = {
            name: formData.name,
            stage: formData.stage,
            start_year: formData.start_year ? parseInt(formData.start_year, 10) : null,
            renovation_year: formData.renovation_year ? parseInt(formData.renovation_year, 10) : null,
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("API response was not OK");

            // The backend returns the completely saved object, including the generated ID!
            const savedData = await res.json();
            
            onSave(savedData);
            Swal.fire("Éxito", "Operación exitosa", "success");
        } catch (err) {
            console.error("Error saving municipality:", err);
            Swal.fire("Error", "Ocurrió un problema al guardar el municipio.", "error");
        }
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
                    <select
                        className="cms-select"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    >
                        <option value="">-- Seleccionar Municipio --</option>
                        {PR_MUNICIPALITIES.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
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
                        name="renovation_year"
                        value={formData.renovation_year}
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