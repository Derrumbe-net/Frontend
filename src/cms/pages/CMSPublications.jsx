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
import "../../cms/styles/CMSPublications.css";
import Swal from "sweetalert2";

export default function CMSPublicaciones() {
    const [publications, setPublications] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editPublication, setEditPublication] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estado para la configuración de ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });

    const itemsPerPage = 5;
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
            fetchPublications();
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
            setPublications(data || []);
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

    const sortedPublications = [...publications].sort((a, b) => {
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
    const totalPages = Math.ceil(sortedPublications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = sortedPublications.slice(startIndex, startIndex + itemsPerPage);

    // 3. Exportación a CSV
    const exportToCSV = () => {
        const headers = ["ID", "Título", "Enlace", "Fecha de Publicación", "Descripción"];
        
        const rows = sortedPublications.map(pub => {
            const id = pub.id || pub.publication_id || "";
            // Escapar comillas dobles
            const title = pub.title ? pub.title.replace(/"/g, '""') : "";
            const url = pub.publication_url ? pub.publication_url.replace(/"/g, '""') : "";
            const desc = pub.description ? pub.description.replace(/"/g, '""') : "";
            const date = pub.published_date || "";

            return [
                id,
                `"${title}"`,
                `"${url}"`,
                `"${date}"`,
                `"${desc}"`
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const urlObj = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlObj;
        link.setAttribute("download", "publicaciones.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="cms-btn cms-btn-secondary" onClick={exportToCSV} title="Exportar vista actual">
                            <FaDownload /> Exportar CSV
                        </button>
                        <button className="cms-btn" onClick={() => handleOpenForm()}>
                            <FaPlus /> Añadir Publicación
                        </button>
                    </div>
                )}
            </div>

            {!showForm ? (
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
                                    onClick={() => handleSort("publication_url")}
                                >
                                    Enlace {getSortIcon("publication_url")}
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
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "#a0aec0", padding: "32px" }}>
                                        No hay publicaciones disponibles.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((pub) => {
                                    const id = pub.id || pub.publication_id;

                                    return (
                                        <tr key={id}>
                                            <td>
                                                {pub.image_url || pub.image_path ? (
                                                    <a
                                                        href={`${API_URL}/publications/${id}/image`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver imagen completa"
                                                    >
                                                        <img
                                                            src={`${API_URL}/publications/${id}/image`}
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
                            onClick={() => setCurrentPage((p) => p - 1)}
                            title="Página anterior"
                        >
                            <FaChevronLeft />
                        </button>

                        <span className="cms-page-info">Página {currentPage} de {totalPages || 1}</span>

                        <button
                            className="cms-icon-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            title="Siguiente página"
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
    const pubId = publication?.id || publication?.publication_id;
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
            if (publication.image_url || publication.image_path) {
                setPreviewUrl(`${apiUrl}/publications/${pubId}/image`);
            }
        }
    }, [publication, apiUrl, pubId]);

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

        const finalUrl = normalizeUrl(formData.publication_url);
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
            ? `${apiUrl}/publications/${pubId}`
            : `${apiUrl}/publications`;

        const bodyData = {
            ...formData,
            publication_url: finalUrl,
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
            const finalPubId = isEdit ? pubId : (result.id || result.publication_id);

            if (formData.imageFile && finalPubId) {
                const imageForm = new FormData();
                imageForm.append("image", formData.imageFile);

                await fetch(`${apiUrl}/publications/${finalPubId}/image`, {
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
