import { useState, useEffect } from "react";
import { 
    FaEdit, 
    FaPlus, 
    FaTrash, 
    FaChevronLeft, 
    FaChevronRight,
    FaDownload,
    FaSort,
    FaSortUp,
    FaSortDown
} from "react-icons/fa";
import "../../cms/styles/CMSProjects.css";
import Swal from "sweetalert2";

export default function CMSProjects() {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estado para la configuración de ordenamiento (por defecto ordenamos por año de inicio descendente)
    const [sortConfig, setSortConfig] = useState({ key: "start_year", direction: "desc" });

    const itemsPerPage = 5;
    const API_URL = `${import.meta.env.VITE_API_URL}`;

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_URL}/projects`);
            const data = await response.json();
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const handleOpenForm = (project = null) => {
        setEditProject(project);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditProject(null);
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar Proyecto?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#e55353"
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem("cmsAdmin");

            const response = await fetch(`${API_URL}/projects/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                Swal.fire("Error", "No se pudo eliminar el proyecto.", "error");
                return;
            }

            Swal.fire("Eliminado", "El proyecto fue eliminado correctamente.", "success");
            fetchProjects();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo conectar al servidor.", "error");
        }
    };

    // 1. Lógica de ordenamiento
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort style={{ opacity: 0.3 }} />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    const sortedProjects = [...projects].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue === undefined || aValue === null) aValue = "";
        if (bValue === undefined || bValue === null) bValue = "";

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    // 2. Paginación basada en los datos ordenados
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage);

    // 3. Exportación a CSV
    const exportToCSV = () => {
        const headers = ["ID", "Título", "Año de Inicio", "Año de Fin", "Estado", "Descripción", "Imagen"];
        
        const rows = sortedProjects.map(p => {
            const id = p.id || p.project_id || "";
            // Reemplazamos comillas dobles por dobles comillas dobles (formato CSV) para evitar que se rompa el archivo
            const title = p.title ? p.title.replace(/"/g, '""') : "";
            const desc = p.description ? p.description.replace(/"/g, '""') : "";
            const status = p.project_status === 'active' ? 'Actual' : 'Completado';
            const imgPath = p.image_path || "";

            return [
                id,
                `"${title}"`,
                p.start_year || "",
                p.end_year || "",
                status,
                `"${desc}"`,
                `"${imgPath}"`
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "proyectos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="cms-projects-wrapper">

            {/* HEADER SECTION */}
            <div className="cms-page-header">
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Gestión de Proyectos</h1>
                    <p className="cms-page-subtitle">
                        Administre los proyectos de mitigación pasados y actuales del PRLHMO.
                    </p>
                </div>

                {!showForm && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="cms-btn cms-btn-secondary" onClick={exportToCSV} title="Exportar vista actual">
                            <FaDownload /> Exportar CSV
                        </button>
                        <button className="cms-btn" onClick={() => handleOpenForm()}>
                            <FaPlus /> Añadir Proyecto
                        </button>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            {!showForm ? (
                // TABLE VIEW
                <div className="cms-card">
                    <div className="cms-table-container">
                        <table className="cms-table">
                            <thead>
                            <tr>
                                <th>Imagen</th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("title")}
                                >
                                    Título {getSortIcon("title")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("start_year")}
                                >
                                    Periodo {getSortIcon("start_year")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("project_status")}
                                >
                                    Estado {getSortIcon("project_status")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("description")}
                                >
                                    Descripción {getSortIcon("description")}
                                </th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", color: "#a0aec0", padding: "32px" }}>
                                        No hay proyectos disponibles.
                                    </td>
                                </tr>
                            ) : (
                                paginatedProjects.map((p) => {
                                    const id = p.id || p.project_id;
                                    
                                    return (
                                        <tr key={id}>
                                            <td>
                                                {p.image_url || p.image_path ? (
                                                    <a
                                                        href={`${API_URL}/projects/${id}/image`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver imagen completa"
                                                    >
                                                        <img
                                                            src={`${API_URL}/projects/${id}/image`}
                                                            alt="Project"
                                                            className="cms-thumb"
                                                        />
                                                    </a>
                                                ) : (
                                                    <span className="no-img">N/A</span>
                                                )}
                                            </td>

                                            <td style={{ fontWeight: "600" }}>{p.title}</td>

                                            <td>{p.start_year} - {p.end_year}</td>

                                            <td>
                                              <span className={`status-pill ${p.project_status === 'active' ? 'status-active' : 'status-completed'}`}>
                                                {p.project_status === 'active' ? 'Actual' : 'Completado'}
                                              </span>
                                            </td>

                                            <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                                                {p.description?.length > 50
                                                    ? p.description.slice(0, 50) + "..."
                                                    : p.description}
                                            </td>

                                            <td>
                                                <button className="cms-icon-btn" onClick={() => handleOpenForm(p)} title="Editar">
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="cms-icon-btn cms-delete-btn"
                                                    onClick={() => handleDelete(id)}
                                                    title="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="cms-pagination">
                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            title="Página anterior"
                        >
                            <FaChevronLeft />
                        </button>

                        <span className="cms-page-info">Página {currentPage} de {totalPages || 1}</span>

                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            title="Siguiente página"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            ) : (
                // FORM VIEW
                <div className="cms-card">
                    <ProjectForm
                        project={editProject}
                        onClose={handleCloseForm}
                        refreshProjects={fetchProjects}
                        apiUrl={API_URL}
                    />
                </div>
            )}
        </div>
    );
}

/* ============================================================
   FORM COMPONENT
============================================================ */

function ProjectForm({ project, onClose, refreshProjects, apiUrl }) {
    const isEdit = !!project;
    const projectId = project?.id || project?.project_id;

    const [formData, setFormData] = useState({
        title: "",
        start_year: "",
        end_year: "",
        project_status: "active",
        description: "",
        image_path: "", 
        imageFile: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title,
                start_year: project.start_year,
                end_year: project.end_year,
                project_status: project.project_status,
                description: project.description,
                image_path: project.image_path || "", 
                imageFile: null,
            });

            if (project.image_url || project.image_path) {
                setPreviewUrl(`${apiUrl}/projects/${projectId}/image`);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setPreviewUrl(null);
        }
    }, [project, apiUrl, projectId]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, imageFile: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validate = () => {
        if (!formData.title.trim()) { Swal.fire("Error", "El título es obligatorio.", "warning"); return false; }
        if (!formData.start_year || !formData.end_year) { Swal.fire("Error", "Debe ingresar los años.", "warning"); return false; }
        if (formData.start_year < 1900 || formData.start_year > 2100) { Swal.fire("Error", "Año de inicio inválido.", "warning"); return false; }
        if (Number(formData.end_year) < Number(formData.start_year)) { Swal.fire("Error", "El año de fin no puede ser menor al de inicio.", "warning"); return false; }
        if (formData.description.trim().length < 10) { Swal.fire("Error", "Descripción muy corta.", "warning"); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const confirm = await Swal.fire({
            title: isEdit ? "Guardar cambios" : "Crear Proyecto",
            text: "¿Desea confirmar esta acción?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#6fa174",
        });

        if (!confirm.isConfirmed) return;

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${apiUrl}/projects/${projectId}` : `${apiUrl}/projects`;

        const uploadedFileName = formData.imageFile ? formData.imageFile.name : formData.image_path;

        const bodyData = {
            title: formData.title,
            start_year: Number(formData.start_year),
            end_year: Number(formData.end_year),
            project_status: formData.project_status,
            description: formData.description,
            image_path: uploadedFileName || "",
            admin_id: 1, 
        };

        try {
            const token = localStorage.getItem("cmsAdmin");
            if (!token) {
                Swal.fire("Error", "Sesión expirada.", "error");
                return;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            if (!response.ok) {
                Swal.fire("Error", "Ocurrió un error al guardar.", "error");
                return;
            }

            const result = await response.json();
            const finalProjId = isEdit ? projectId : (result.id || result.project_id);

            // Upload Image if new file selected
            if (formData.imageFile && finalProjId) {
                const imageForm = new FormData();
                imageForm.append("image", formData.imageFile);

                const imageResponse = await fetch(`${apiUrl}/projects/${finalProjId}/image`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: imageForm,
                });
                
                if (!imageResponse.ok) {
                    const errData = await imageResponse.json();
                    console.error("Image upload failed:", errData);
                    Swal.fire("Aviso", `El proyecto se guardó, pero la imagen falló: ${errData.error || "Error desconocido"}`, "warning");
                    refreshProjects();
                    onClose();
                    return;
                }
            }

            Swal.fire("Éxito", "Operación exitosa", "success");
            refreshProjects();
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo conectar al servidor.", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#13241e' }}>
                {isEdit ? "Editar Proyecto" : "Nuevo Proyecto"}
            </h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
                Ingrese los detalles del proyecto de investigación o mitigación.
            </p>

            <div className="cms-form-grid">

                {/* SECTION 1: DETAILS */}
                <div className="cms-form-section-title">Detalles Generales</div>

                <div className="cms-form-group span-2">
                    <label>Título del Proyecto <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="title" value={formData.title} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Año de Inicio <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="start_year" value={formData.start_year} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Año de Fin <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="end_year" value={formData.end_year} onChange={handleChange} />
                </div>

                <div className="cms-form-group span-2">
                    <label>Estatus</label>
                    <select className="cms-select" name="project_status" value={formData.project_status} onChange={handleChange}>
                        <option value="active">Proyecto Actual (Activo)</option>
                        <option value="completed">Proyecto Pasado (Completado)</option>
                    </select>
                </div>

                <div className="cms-form-group span-2">
                    <label>Descripción <span className="required-asterisk">*</span></label>
                    <textarea className="cms-textarea" name="description" value={formData.description} onChange={handleChange} />
                </div>

                {/* SECTION 2: IMAGE */}
                <div className="cms-form-section-title">Imagen Promocional</div>

                <div className="cms-form-group span-2">
                    {previewUrl && (
                        <div className="cms-image-preview-container">
                            <p style={{marginBottom: '10px', fontSize:'0.8rem', fontWeight:'600', color:'#718096'}}>Vista Previa:</p>
                            <img src={previewUrl} alt="Vista previa" className="cms-form-preview" />
                        </div>
                    )}

                    <label>Subir Imagen</label>
                    <input className="cms-input" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                {/* ACTIONS */}
                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" className="cms-btn">
                        {isEdit ? "Guardar Cambios" : "Crear Proyecto"}
                    </button>
                </div>

            </div>
        </form>
    );
}
