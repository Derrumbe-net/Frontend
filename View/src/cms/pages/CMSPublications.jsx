import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../cms/styles/CMSPublications.css";
import Swal from "sweetalert2";

export default function CMSPublicaciones() {
    const [publications, setPublications] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editPublication, setEditPublication] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(publications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = publications.slice(startIndex, startIndex + itemsPerPage);

    const API_URL = `${import.meta.env.VITE_API_URL}`;

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar Publicación?",
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

            const response = await fetch(`${API_URL}/publications/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                Swal.fire("Error", "No se pudo eliminar la publicación.", "error");
                return;
            }

            Swal.fire("Eliminado", "La publicación fue eliminada correctamente.", "success");

            fetchPublications(); // Refresh table

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo conectar al servidor.", "error");
        }
    };

    useEffect(() => {
        fetchPublications();
    }, []);

    const fetchPublications = async () => {
        try {
            const response = await fetch(`${API_URL}/publications`);
            const data = await response.json();
            setPublications(data);
        } catch (error) {
            console.error("Error fetching publications:", error);
        }
    };

    const handleOpenForm = (pub = null) => {
        setEditPublication(pub);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditPublication(null);
    };

    return (
        <div className="cms-publications-wrapper">

            <div className="cms-page-header">
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Gestión de Publicaciones</h1>
                    <p className="cms-page-subtitle">
                        Administre los artículos, noticias y documentos oficiales visibles en el portal.
                    </p>
                </div>

                {!showForm && (
                    <button className="cms-btn" onClick={() => handleOpenForm()}>
                        <FaPlus /> Añadir Publicación
                    </button>
                )}
            </div>

            {!showForm ? (
                <div className="cms-card">
                    <div className="cms-table-container">
                        <table className="cms-table">
                            <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Título</th>
                                <th>Enlace</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {paginated.map((pub) => (
                                <tr key={pub.publication_id}>
                                    <td>
                                        {pub.image_url ? (
                                            <a
                                                href={`${API_URL}/publications/${pub.publication_id}/image`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Ver imagen completa"
                                            >
                                                <img
                                                    src={`${API_URL}/publications/${pub.publication_id}/image`}
                                                    alt="Publication"
                                                    className="cms-thumb"
                                                />
                                            </a>
                                        ) : (
                                            <span className="no-img">N/A</span>
                                        )}
                                    </td>

                                    <td style={{ fontWeight: '600' }}>{pub.title}</td>

                                    <td>
                                        <a href={pub.publication_url} target="_blank" rel="noopener noreferrer" className="cms-link">
                                            Visitar Enlace ↗
                                        </a>
                                    </td>

                                    <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                                        {pub.description?.length > 80
                                            ? pub.description.slice(0, 80) + "..."
                                            : pub.description}
                                    </td>

                                    <td>
                                        <button className="cms-icon-btn" onClick={() => handleOpenForm(pub)} title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="cms-icon-btn cms-delete-btn"
                                            onClick={() => handleDelete(pub.publication_id)}
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
                            onClick={() => setCurrentPage((p) => p - 1)}
                        >
                            <FaChevronLeft />
                        </button>

                        <span className="cms-page-info">Página {currentPage} de {totalPages || 1}</span>

                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            ) : (
                // FORM VIEW
                <div className="cms-card">
                    <PublicationForm
                        publication={editPublication}
                        onClose={handleCloseForm}
                        refreshPublications={fetchPublications}
                        apiUrl={API_URL}
                    />
                </div>
            )}
        </div>
    );
}
function PublicationForm({ publication, onClose, refreshPublications, apiUrl }) {
    const isEdit = !!publication;
    const [isValidating, setIsValidating] = useState(false);

    const [formData, setFormData] = useState({
        title: "", publication_url: "", description: "", imageFile: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (publication) {
            setFormData({
                title: publication.title,
                publication_url: publication.publication_url,
                description: publication.description,
                imageFile: null,
            });
            if (publication.image_url) {
                setPreviewUrl(`${apiUrl}/publications/${publication.publication_id}/image`);
            }
        }
    }, [publication, apiUrl]);

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

    const normalizeUrl = (url) => {
        const trimmed = url.trim();
        if (!trimmed) return "";
        // Check if it starts with http:// or https://
        if (!/^https?:\/\//i.test(trimmed)) {
            return `https://${trimmed}`;
        }
        return trimmed;
    };

    const validateSyntax = (urlToCheck) => {
        if (!formData.title.trim()) {
            Swal.fire("Error", "El título es obligatorio.", "warning");
            return false;
        }
        if (!urlToCheck) {
            Swal.fire("Error", "El enlace (URL) es obligatorio.", "warning");
            return false;
        }
        
        try {
            new URL(urlToCheck);
        } catch {
            Swal.fire("Error", "El formato del enlace no es válido.", "warning");
            return false;
        }

        if (formData.description.trim().length < 10) {
            Swal.fire("Error", "La descripción debe tener al menos 10 caracteres.", "warning");
            return false;
        }
        return true;
    };

    const validateUrlReachability = async (url) => {
        try {
            // Check the normalized URL
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            if (data.status.http_code && data.status.http_code >= 400) {
                return false;
            }
            return true;
        } catch (error) {
            console.warn("Validation skipped due to network error:", error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Normalize the URL first
        const finalUrl = normalizeUrl(formData.publication_url);

        // Validate using the normalized URL
        if (!validateSyntax(finalUrl)) return;

        setIsValidating(true);
        const isReachable = await validateUrlReachability(finalUrl);
        setIsValidating(false);

        if (!isReachable) {
            const warningResult = await Swal.fire({
                title: "Enlace sospechoso",
                text: `No pudimos verificar "${finalUrl}". ¿Desea guardarlo de todas formas?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, guardar",
                cancelButtonText: "Revisar",
                confirmButtonColor: "#d33",
            });
            if (!warningResult.isConfirmed) return;
        }

        // Confirm Save
        const confirm = await Swal.fire({
            title: isEdit ? "Guardar cambios" : "Crear Publicación",
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
            ? `${apiUrl}/publications/${publication.publication_id}`
            : `${apiUrl}/publications`;

        // Send the FINAL (normalized) URL to the backend
        const bodyData = {
            ...formData,
            publication_url: finalUrl, // IMPORTANT: Sending the fixed URL
            admin_id: 1,
        };

        try {
            const token = localStorage.getItem("cmsAdmin");
            
            if (!token) { Swal.fire("Error", "Sesión expirada.", "error"); return; }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            if (!response.ok) {
                Swal.fire("Error", "No se pudo guardar la publicación.", "error");
                return;
            }

            const result = await response.json();
            const pubId = isEdit ? publication.publication_id : result.publication_id;

            if (formData.imageFile) {
                const imageForm = new FormData();
                imageForm.append("image", formData.imageFile);

                await fetch(`${apiUrl}/publications/${pubId}/image`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: imageForm,
                });
            }

            Swal.fire("Éxito", "Operación realizada correctamente", "success");
            refreshPublications();
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Error de conexión con el servidor.", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#13241e' }}>
                {isEdit ? "Editar Publicación" : "Nueva Publicación"}
            </h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
                Complete los detalles para publicar contenido en el sitio web.
            </p>

            <div className="cms-form-grid">
                <div className="cms-form-section-title">Detalles del Contenido</div>

                <div className="cms-form-group span-2">
                    <label>Título de la Publicación <span className="required-asterisk">*</span></label>
                    <input
                        className="cms-input"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ej. Nuevo reporte anual"
                    />
                </div>

                <div className="cms-form-group span-2">
                    <label>Enlace Externo (URL) <span className="required-asterisk">*</span></label>
                    <input
                        className="cms-input"
                        name="publication_url"
                        value={formData.publication_url}
                        onChange={handleChange}
                        placeholder="Ej. google.com"
                    />
                </div>

                <div className="cms-form-group span-2">
                    <label>Descripción <span className="required-asterisk">*</span></label>
                    <textarea
                        className="cms-textarea"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Resumen breve..."
                    />
                </div>

                <div className="cms-form-section-title">Imagen de Portada</div>

                <div className="cms-form-group span-3">
                    {previewUrl && (
                        <div className="cms-image-preview-container">
                            <p style={{marginBottom: '10px', fontSize:'0.8rem', fontWeight:'600', color:'#718096'}}>Vista Previa:</p>
                            <img src={previewUrl} alt="Vista previa" className="cms-form-preview" />
                        </div>
                    )}
                    <label>Subir Imagen</label>
                    <input className="cms-input" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose} disabled={isValidating}>
                        Cancelar
                    </button>
                    <button type="submit" className="cms-btn" disabled={isValidating}>
                        {isValidating ? "Validando Enlace..." : (isEdit ? "Guardar Cambios" : "Crear Publicación")}
                    </button>
                </div>
            </div>
        </form>
    );
}