import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../cms/styles/CMSProjects.css";
import Swal from "sweetalert2";

export default function CMSProjects() {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(projects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProjects = projects.slice(startIndex, startIndex + itemsPerPage);

    const API_URL = `${import.meta.env.VITE_API_URL}`;

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_URL}/projects`);
            const data = await response.json();
            setProjects(data);
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

            fetchProjects(); // Refresh list
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo conectar al servidor.", "error");
        }
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
                    <button className="cms-btn" onClick={() => handleOpenForm()}>
                        <FaPlus /> Añadir Proyecto
                    </button>
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
                                <th>Título</th>
                                <th>Periodo</th>
                                <th>Estado</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedProjects.map((p) => (
                                <tr key={p.project_id}>
                                    <td>
                                        {p.image_url ? (
                                            <a
                                                href={`${API_URL}/projects/${p.project_id}/image`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Ver imagen completa"
                                            >
                                                <img
                                                    src={`${API_URL}/projects/${p.project_id}/image`}
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
                                            onClick={() => handleDelete(p.project_id)}
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
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                        >
                            <FaChevronLeft />
                        </button>

                        <span className="cms-page-info">Página {currentPage} de {totalPages || 1}</span>

                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
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

    const [formData, setFormData] = useState({
        title: "",
        start_year: "",
        end_year: "",
        project_status: "active",
        description: "",
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
                imageFile: null,
            });

            if (project.image_url) {
                setPreviewUrl(`${apiUrl}/projects/${project.project_id}/image`);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setPreviewUrl(null);
        }
    }, [project, apiUrl]);

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
        const url = isEdit
            ? `${apiUrl}/projects/${project.project_id}`
            : `${apiUrl}/projects`;

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
                body: JSON.stringify({ ...formData, admin_id: 1 }),
            });

            if (!response.ok) {
                Swal.fire("Error", "Ocurrió un error al guardar.", "error");
                return;
            }

            const result = await response.json();
            const projId = isEdit ? project.project_id : result.project_id;

            if (formData.imageFile) {
                const imageForm = new FormData();
                imageForm.append("image", formData.imageFile);

                await fetch(`${apiUrl}/projects/${projId}/image`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: imageForm,
                });
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