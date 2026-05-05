import { useEffect, useState } from "react";
import { 
    FaEdit, 
    FaChevronLeft, 
    FaChevronRight, 
    FaTrash,
    FaDownload,
    FaSort,
    FaSortUp,
    FaSortDown
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSReports.css";

export default function CMSReports() {
    const [reports, setReports] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editReport, setEditReport] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado para la configuración de ordenamiento (por defecto, los más recientes primero)
    const [sortConfig, setSortConfig] = useState({ key: "reported_at", direction: "desc" });

    const API_URL = `${import.meta.env.VITE_API_URL}`;
    const itemsPerPage = 6;

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${API_URL}/reports`);
            const data = await res.json();
            setReports(data || []);
        } catch (err) {
            console.error("Error loading reports:", err);
        }
    };

    const handleOpenForm = (r) => {
        setEditReport(r);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditReport(null);
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

    const sortedReports = [...reports].sort((a, b) => {
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
    const totalPages = Math.ceil(sortedReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReports = sortedReports.slice(startIndex, startIndex + itemsPerPage);

    // 3. Exportación a CSV
    const exportToCSV = () => {
        // Incluimos campos extra que están en el form para hacer el reporte más útil
        const headers = [
            "ID", "Fecha del Evento", "Pueblo", "Dirección Física", 
            "Latitud", "Longitud", "Estado", "Reportado Por", 
            "Teléfono", "Email", "Descripción"
        ];
        
        const rows = sortedReports.map(r => {
            const id = r.id || r.report_id || "";
            const date = r.reported_at ? r.reported_at.slice(0, 10) : "";
            // Escapar comillas dobles
            const city = r.city ? r.city.replace(/"/g, '""') : "";
            const address = r.physical_address ? r.physical_address.replace(/"/g, '""') : "";
            const status = r.is_validated ? "Validado" : "Pendiente";
            const name = r.reporter_name ? r.reporter_name.replace(/"/g, '""') : "";
            const phone = r.reporter_phone ? r.reporter_phone.replace(/"/g, '""') : "";
            const email = r.reporter_email ? r.reporter_email.replace(/"/g, '""') : "";
            const desc = r.description ? r.description.replace(/"/g, '""') : "";

            return [
                id,
                `"${date}"`,
                `"${city}"`,
                `"${address}"`,
                r.latitude || "",
                r.longitude || "",
                status,
                `"${name}"`,
                `"${phone}"`,
                `"${email}"`,
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
        link.setAttribute("download", "reportes_ciudadanos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="cms-reports-wrapper">

            <div className="cms-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Reportes Ciudadanos</h1>
                    <p className="cms-page-subtitle">
                        Revise, ubique geográficamente y valide los reportes de deslizamientos enviados por la ciudadanía.
                    </p>
                </div>
                {!showForm && (
                    <button className="cms-btn cms-btn-secondary" onClick={exportToCSV} title="Exportar vista actual">
                        <FaDownload /> Exportar CSV
                    </button>
                )}
            </div>

            {!showForm ? (
                <div className="cms-card">
                    <div className="cms-table-container">
                        <table className="cms-table">
                            <thead>
                            <tr>
                                <th>Evidencia</th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("reported_at")}
                                >
                                    Fecha {getSortIcon("reported_at")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("city")}
                                >
                                    Pueblo {getSortIcon("city")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("latitude")}
                                >
                                    Latitud {getSortIcon("latitude")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("longitude")}
                                >
                                    Longitud {getSortIcon("longitude")}
                                </th>
                                <th 
                                    style={{ cursor: "pointer", userSelect: "none" }} 
                                    onClick={() => handleSort("is_validated")}
                                >
                                    Estado {getSortIcon("is_validated")}
                                </th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedReports.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", color: "#a0aec0", padding: "32px" }}>
                                        No hay reportes disponibles.
                                    </td>
                                </tr>
                            ) : (
                                paginatedReports.map((r) => {
                                    const id = r.id || r.report_id;
                                    
                                    return (
                                        <tr key={id}>
                                            <td>
                                                <ReportThumbnail reportId={id} hasFolder={!!r.image_url} />
                                            </td>
                                            <td>{r.reported_at?.slice(0, 10)}</td>
                                            <td style={{ fontWeight: '600' }}>{r.city}</td>

                                            <td>{r.latitude}</td>
                                            <td>{r.longitude}</td>

                                            <td>
                                              <span className={`status-pill ${r.is_validated ? "status-valid" : "status-pending"}`}>
                                                {r.is_validated ? "Validado" : "Pendiente"}
                                              </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="cms-icon-btn"
                                                    onClick={() => handleOpenForm(r)}
                                                    title="Validar / Editar"
                                                >
                                                    <FaEdit />
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
                        <span className="cms-page-info">
                            Página {currentPage} de {totalPages || 1}
                        </span>
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
                    <ReportForm
                        report={editReport}
                        onClose={handleCloseForm}
                        refreshReports={fetchReports}
                    />
                </div>
            )}
        </div>
    );
}

// --- HELPER COMPONENT FOR TABLE THUMBNAIL ---
function ReportThumbnail({ reportId, hasFolder }) {
    const API_URL = `${import.meta.env.VITE_API_URL}`;
    const [firstImage, setFirstImage] = useState(null);

    useEffect(() => {
        if (!hasFolder) return;

        fetch(`${API_URL}/reports/item/${reportId}/images`)
            .then(res => res.json())
            .then(data => {
                if (data.images && data.images.length > 0) {
                    setFirstImage(data.images[0]);
                }
            })
            .catch(err => console.error("Thumb load error", err));
    }, [reportId, hasFolder, API_URL]);

    if (!hasFolder || !firstImage) {
        return <span className="no-img" style={{fontSize:'0.8rem', color:'#999'}}>Sin imagen</span>;
    }

    const imageUrl = `${API_URL}/reports/item/${reportId}/images/${firstImage}`;

    return (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" title="Ver imagen completa">
            <img
                src={imageUrl}
                alt="Evidencia"
                className="cms-thumb"
                style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer'
                }}
            />
        </a>
    );
}

// --- FORM COMPONENT ---
function ReportForm({ report, onClose, refreshReports }) {
    const API_URL = `${import.meta.env.VITE_API_URL}`;
    const reportId = report?.id || report?.report_id;

    const [formData, setFormData] = useState({
        reporter_name: "", reporter_phone: "", reporter_email: "",
        reported_at: "", description: "", city: "", physical_address: "",
        latitude: "", longitude: "", is_validated: 0
    });

    const [existingImages, setExistingImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);

    useEffect(() => {
        if (report) {
            setFormData({
                reporter_name: report.reporter_name || "",
                reporter_phone: report.reporter_phone || "",
                reporter_email: report.reporter_email || "",
                reported_at: report.reported_at?.slice(0, 10) || "",
                description: report.description || "",
                city: report.city || "",
                physical_address: report.physical_address || "",
                latitude: report.latitude || "",
                longitude: report.longitude || "",
                is_validated: report.is_validated || 0,
                landslide_id: report.landslide_id || report.id || null
            });
            fetchServerImages();
        }
        // eslint-disable-next-line
    }, [report]);

    useEffect(() => {
        return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
    }, [newPreviews]);

    const fetchServerImages = async () => {
        try {
            const res = await fetch(`${API_URL}/reports/item/${reportId}/images`);
            if (res.ok) {
                const data = await res.json();
                if (data.images && Array.isArray(data.images)) {
                    setExistingImages(data.images);
                } else {
                    setExistingImages([]);
                }
            }
        } catch (error) {
            console.error("Error fetching images", error);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setNewFiles(prev => [...prev, ...filesArray]);
            const newUrls = filesArray.map(file => URL.createObjectURL(file));
            setNewPreviews(prev => [...prev, ...newUrls]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const val = name === 'is_validated' ? parseInt(value) : value;
        setFormData({ ...formData, [name]: val });
    };

    const handleDeleteServerImage = async (filename) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar imagen?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem("cmsAdmin");
            const res = await fetch(`${API_URL}/reports/item/${reportId}/images/${filename}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                Swal.fire("Eliminado", "La imagen ha sido eliminada.", "success");
                setExistingImages(prev => prev.filter(img => img !== filename));
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo eliminar la imagen.", "error");
        }
    };

    const validate = () => {
        const missing = [];
        if (!formData.reported_at) missing.push("Fecha");
        if (!formData.city) missing.push("Pueblo");

        if (formData.is_validated === 1) {
            if (!formData.latitude) missing.push("Latitud");
            if (!formData.longitude) missing.push("Longitud");
        }

        if (missing.length > 0) {
            Swal.fire("Campos faltantes", `Complete: ${missing.join(", ")}`, "warning");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const confirm = await Swal.fire({
            title: "Guardar Cambios",
            text: "¿Desea actualizar la información de este reporte?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            confirmButtonColor: "#6fa174",
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem("cmsAdmin");
            if (!token) { Swal.fire("Error", "Sesión expirada", "error"); return; }

            let adminId = 1; 
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                adminId = payload.data?.id || payload.id || payload.sub || 1;
            } catch (err) {
                console.warn("Could not parse Admin ID from token, defaulting to 1");
            }

            let sharedFolder = report.image_url;
            if (!sharedFolder && formData.reported_at) {
                const datePart = formData.reported_at.slice(0, 10);
                sharedFolder = `${datePart}_${reportId}`;
            }

            let finalLandslideId = report.landslide_id || report.id; 
            const isValidating = report.is_validated === 0 && formData.is_validated === 1;

            if (isValidating) {
                const landslidePayload = {
                    admin_id: adminId,
                    landslide_date: formData.reported_at,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    image_url: sharedFolder // Explicitly send folder name
                };

                const lsRes = await fetch(`${API_URL}/landslides`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(landslidePayload)
                });

                if (!lsRes.ok) {
                    const errData = await lsRes.json();
                    throw new Error("Error creando deslizamiento: " + (errData.error || "Datos inválidos (Fecha/Lat/Long)"));
                }

                const lsData = await lsRes.json();
                finalLandslideId = lsData.id || lsData.landslide_id; 
            }

            const reportPayload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                landslide_id: finalLandslideId,
                image_url: sharedFolder 
            };

            const res = await fetch(`${API_URL}/reports/item/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(reportPayload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al actualizar datos del reporte");
            }
            if (newFiles.length > 0) {
                Swal.fire({
                    title: 'Subiendo imágenes...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading() }
                });

                for (const file of newFiles) {
                    const uploadForm = new FormData();
                    uploadForm.append("image_file", file);

                    const imgRes = await fetch(`${API_URL}/reports/item/${reportId}/upload`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: uploadForm
                    });

                    if (!imgRes.ok) {
                        const imgError = await imgRes.json();
                        throw new Error(`Error subiendo imagen (${file.name}): ${imgError.error || imgRes.statusText}`);
                    }
                }
            }

            Swal.fire("Éxito", "Reporte actualizado e imágenes subidas.", "success");
            refreshReports();
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire("Error", error.message, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#13241e', margin:0 }}>
                    Validar Reporte: {formData.city}
                </h2>
                <button type="button" onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button>
            </div>

            <p style={{ color: '#666', marginBottom: '24px' }}>
                Revise los datos del reporte ciudadano y cambie el estado a "Validado" para publicarlo.
            </p>

            <div className="cms-form-grid">
                <div className="cms-form-section-title">Información del Ciudadano</div>

                <div className="cms-form-group">
                    <label>Nombre Completo</label>
                    <input className="cms-input" name="reporter_name" value={formData.reporter_name} onChange={handleChange} />
                </div>
                <div className="cms-form-group">
                    <label>Teléfono</label>
                    <input className="cms-input" name="reporter_phone" value={formData.reporter_phone} onChange={handleChange} />
                </div>
                <div className="cms-form-group span-2">
                    <label>Correo Electrónico</label>
                    <input className="cms-input" name="reporter_email" value={formData.reporter_email} onChange={handleChange} />
                </div>

                <div className="cms-form-section-title">Detalles del Incidente</div>
                <div className="cms-form-group">
                    <label>Fecha del Evento <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="date" name="reported_at" value={formData.reported_at} onChange={handleChange} />
                </div>
                <div className="cms-form-group">
                    <label>Estado de Validación</label>
                    <select className="cms-select" name="is_validated" value={formData.is_validated} onChange={handleChange} style={{ fontWeight: 'bold', color: formData.is_validated ? '#2e7d32' : '#c62828' }}>
                        <option value={0}>⚠ Pendiente (No Publicado)</option>
                        <option value={1}>✓ Validado (Público)</option>
                    </select>
                </div>
                <div className="cms-form-group span-2">
                    <label>Descripción</label>
                    <textarea className="cms-textarea" name="description" value={formData.description} onChange={handleChange} />
                </div>

                <div className="cms-form-section-title">Ubicación</div>
                <div className="cms-form-group">
                    <label>Pueblo <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="cms-form-group">
                    <label>Carretera / Dirección</label>
                    <input className="cms-input" name="physical_address" value={formData.physical_address} onChange={handleChange} />
                </div>
                <div className="cms-form-group">
                    <label>Latitud </label>
                    <input className="cms-input" name="latitude" value={formData.latitude} onChange={handleChange} />
                </div>
                <div className="cms-form-group">
                    <label>Longitud </label>
                    <input className="cms-input" name="longitude" value={formData.longitude} onChange={handleChange} />
                </div>

                <div className="cms-form-section-title">Evidencia Fotográfica</div>
                <div className="cms-form-group span-2">
                    <label style={{marginBottom:'10px', display:'block'}}>Imágenes Existentes:</label>
                    {existingImages.length > 0 ? (
                        <div className="cms-image-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {existingImages.map((filename, idx) => {
                                const imgUrl = `${API_URL}/reports/item/${reportId}/images/${filename}`;
                                return (
                                    <div key={idx} className="cms-image-card" style={{ position: 'relative', width: '150px', height: '150px', border:'1px solid #ddd', borderRadius:'8px', overflow:'hidden' }}>
                                        <a href={imgUrl} target="_blank" rel="noopener noreferrer" title="Click para ver imagen completa">
                                            <img
                                                src={imgUrl}
                                                alt="Evidencia"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor:'pointer' }}
                                            />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleDeleteServerImage(filename); }}
                                            style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #c62828', color: '#c62828', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                            title="Eliminar imagen"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{fontStyle:'italic', color:'#888'}}>No hay imágenes guardadas.</p>
                    )}
                </div>

                <div className="cms-form-group span-2">
                    <label>Agregar Nuevas Imágenes</label>
                    <input className="cms-input" type="file" accept="image/*" multiple onChange={handleFileChange} />
                    {newPreviews.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom:'5px' }}>
                            {newPreviews.map((src, i) => (
                                <a key={i} href={src} target="_blank" rel="noopener noreferrer" title="Click para previsualizar">
                                    <img src={src} alt="New" style={{ height: '80px', borderRadius: '4px', border: '1px solid #ccc', cursor:'pointer' }} />
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="cms-btn">Guardar Cambios</button>
                </div>
            </div>
        </form>
    );
}
