import { useEffect, useState } from "react";
import { FaEdit, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSReports.css";

export default function CMSReports() {
    const [reports, setReports] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editReport, setEditReport] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const API_URL = `${import.meta.env.VITE_API_URL}`;
    const itemsPerPage = 6;

    const totalPages = Math.ceil(reports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReports = reports.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${API_URL}/reports`);
            const data = await res.json();
            setReports(data);
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

    return (
        <div className="cms-reports-wrapper">

            <div className="cms-page-reports-header">
                <span className="cms-accent-line"></span>
                <h1 className="cms-page-title">Reportes Ciudadanos</h1>
                <p className="cms-page-subtitle">
                    Revise, ubique geográficamente y valide los reportes de deslizamientos enviados por la ciudadanía.
                </p>
            </div>

            {!showForm ? (
                <div className="cms-card">
                    <div className="cms-table-container">
                        <table className="cms-table">
                            <thead>
                            <tr>
                                <th>Evidencia</th>
                                <th>Fecha</th>
                                <th>Pueblo</th>
                                <th>Latitud</th>
                                <th>Longitud</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedReports.map((r) => (
                                <tr key={r.report_id}>
                                    <td>
                                        {r.image_ul ? (
                                            <a
                                                href={`${API_URL}/reports/${r.report_id}/images`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={`${API_URL}/reports/${r.report_id}/images`}
                                                    alt="Evidencia"
                                                    className="cms-thumb"
                                                />
                                            </a>
                                        ) : (
                                            <span className="no-img">N/A</span>
                                        )}
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
                        <span className="cms-page-info">
              Página {currentPage} de {totalPages || 1}
            </span>
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

function ReportForm({ report, onClose, refreshReports }) {
    const API_URL = `${import.meta.env.VITE_API_URL}`;

    const [formData, setFormData] = useState({
        reporter_name: "", reporter_phone: "", reporter_email: "",
        reported_at: "", description: "", city: "", physical_address: "",
        latitude: "", longitude: "", is_validated: 0, imageFile: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);

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
                imageFile: null
            });

            if (report.image_ul) {
                setPreviewUrl(`${API_URL}/reports/${report.report_id}/images`);
            } else {
                setPreviewUrl(null);
            }
        }
    }, [report, API_URL]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, imageFile: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const val = name === 'is_validated' ? parseInt(value) : value;
        setFormData({ ...formData, [name]: val });
    };

    const validate = () => {
        const missing = [];
        if (!formData.reported_at) missing.push("Fecha");
        if (!formData.city) missing.push("Pueblo");

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
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#6fa174",
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem("cmsAdmin");
            if(!token) { Swal.fire("Error", "Sesión expirada", "error"); return; }

            await fetch(`${API_URL}/reports/${report.report_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (formData.imageFile) {
                const uploadForm = new FormData();
                uploadForm.append("image_file", formData.imageFile);

                await fetch(`${API_URL}/reports/${report.report_id}/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: uploadForm
                });
            }

            Swal.fire("Éxito", "Reporte actualizado correctamente.", "success");
            refreshReports();
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo actualizar el reporte.", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#13241e' }}>
                Validar Reporte: {formData.city}
            </h2>
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
                    <select
                        className="cms-select"
                        name="is_validated"
                        value={formData.is_validated}
                        onChange={handleChange}
                        style={{ fontWeight: 'bold', color: formData.is_validated ? '#2e7d32' : '#c62828' }}
                    >
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
                    {previewUrl && (
                        <div className="cms-image-preview-container">
                            <p style={{marginBottom: '10px', fontSize:'0.8rem', fontWeight:'600', color:'#718096'}}>Vista Previa:</p>
                            <img src={previewUrl} alt="Reporte" className="cms-form-preview" />
                        </div>
                    )}

                    <label>Actualizar Imagen (Opcional)</label>
                    <input className="cms-input" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="cms-btn">Guardar Cambios</button>
                </div>

            </div>
        </form>
    );
}