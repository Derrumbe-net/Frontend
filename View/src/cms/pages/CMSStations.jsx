import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSStations.css";

export default function CMSStations() {
    const [stations, setStations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editStation, setEditStation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;
    const totalPages = Math.ceil(stations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStations = stations.slice(startIndex, startIndex + itemsPerPage);

    const API_URL = `${import.meta.env.VITE_API_URL}`;

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        try {
            const response = await fetch(`${API_URL}/stations`);
            const data = await response.json();
            setStations(data);
        } catch (error) {
            console.error("Error fetching stations:", error);
        }
    };

    const handleOpenForm = (station = null) => {
        setEditStation(station);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditStation(null);
    };

    return (
        <div className="cms-stations-wrapper">

            <div className="cms-page-header">
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Administración de Estaciones</h1>
                    <p className="cms-page-subtitle">
                        Gestione la red de sensores, actualice metadatos y controle la disponibilidad pública de las estaciones.
                    </p>
                </div>

                {!showForm && (
                    <button className="cms-btn" onClick={() => handleOpenForm()}>
                        <FaPlus /> Añadir Estación
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
                                <th>Ciudad</th>
                                <th>Estado</th>
                                <th>Sat. (%)</th>
                                <th>Prec.</th>
                                <th>WC1 Max</th>
                                <th>WC2 Max</th>
                                <th>WC3 Max</th>
                                <th>WC4 Max</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedStations.map((s) => (
                                <tr key={s.station_id}>
                                    <td>
                                        {s.sensor_image_url ? (
                                            <a
                                                href={`${API_URL}/stations/${s.station_id}/image/sensor`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Ver imagen completa"
                                            >
                                                <img
                                                    src={`${API_URL}/stations/${s.station_id}/image/sensor`}
                                                    alt={`Estación ${s.city}`}
                                                    className="cms-thumb"
                                                />
                                            </a>
                                        ) : (
                                            <span className="no-img">Sin Imagen</span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: "600" }}>{s.city}</td>
                                    <td>
                                      <span className={`status-pill ${s.is_available ? 'status-active' : 'status-inactive'}`}>
                                        {s.is_available ? "Activa" : "Oculta"}
                                      </span>
                                    </td>
                                    <td>{s.soil_saturation}%</td>
                                    <td>{s.precipitation}</td>

                                    <td>{s.wc1}</td>
                                    <td>{s.wc2}</td>
                                    <td>{s.wc3}</td>
                                    <td>{s.wc4}</td>

                                    <td>
                                        <button className="cms-icon-btn" onClick={() => handleOpenForm(s)} title="Editar">
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
                    <StationForm
                        station={editStation}
                        onClose={handleCloseForm}
                        refreshStations={fetchStations}
                        apiUrl={API_URL}
                    />
                </div>
            )}
        </div>
    );
}

function StationForm({ station, onClose, refreshStations, apiUrl }) {
    const isEdit = !!station;

    // 1. Separate state for Depths to handle splitting/joining
    const [depthFields, setDepthFields] = useState({
        d1: "", d2: "", d3: "", d4: ""
    });

    const [formData, setFormData] = useState({
        city: "",
        soil_saturation: "",
        precipitation: "",
        wc1: "", wc2: "", wc3: "", wc4: "",
        susceptibility: "", elevation: "", latitude: "", longitude: "",
        land_unit: "", geological_unit: "", slope: "",
        collaborator: "", ftp_file_path: "", is_available: 1,
        station_installation_date: "", imageFile: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (station) {
            // Split the depth string (e.g., "25 cm, 50 cm, 75 cm, 100 cm") into array
            const depths = station.depth ? station.depth.split(',').map(s => s.trim()) : ["", "", "", ""];

            setDepthFields({
                d1: depths[0] || "",
                d2: depths[1] || "",
                d3: depths[2] || "",
                d4: depths[3] || ""
            });

            setFormData({
                city: station.city || "",
                soil_saturation: station.soil_saturation || "",
                precipitation: station.precipitation || "",
                wc1: station.wc1 || "",
                wc2: station.wc2 || "",
                wc3: station.wc3 || "",
                wc4: station.wc4 || "",
                susceptibility: station.susceptibility || "",
                elevation: station.elevation || "",
                latitude: station.latitude || "",
                longitude: station.longitude || "",
                land_unit: station.land_unit || "",
                geological_unit: station.geological_unit || "",
                slope: station.slope || "",
                collaborator: station.collaborator || "",
                ftp_file_path: station.ftp_file_path || "",
                imageFile: null,
                is_available: station.is_available ?? 1,
                station_installation_date: station.station_installation_date?.slice(0, 10) || "",
            });

            if (station.sensor_image_url) {
                setPreviewUrl(`${apiUrl}/stations/${station.station_id}/image/sensor`);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setPreviewUrl(null);
            setDepthFields({ d1: "", d2: "", d3: "", d4: "" });
        }
    }, [station, apiUrl]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, imageFile: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        if (!formData.city.trim()) { Swal.fire("Error", "El nombre de la ciudad es obligatorio.", "warning"); return false; }
        if (!formData.latitude || !formData.longitude) { Swal.fire("Error", "Latitud y Longitud son obligatorias.", "warning"); return false; }
        if (!formData.elevation) { Swal.fire("Error", "La elevación es obligatoria.", "warning"); return false; }
        if (!formData.susceptibility) { Swal.fire("Error", "La susceptibilidad es obligatoria.", "warning"); return false; }
        if (!formData.station_installation_date) { Swal.fire("Error", "La fecha de instalación es obligatoria.", "warning"); return false; }
        if (!formData.ftp_file_path) { Swal.fire("Error", "La ruta del archivo (.dat) es obligatoria.", "warning"); return false; }

        if (formData.wc1 === "" || formData.wc2 === "" || formData.wc3 === "" || formData.wc4 === "") {
            Swal.fire("Error", "Todos los campos de WC Max son obligatorios.", "warning");
            return false;
        }

        // Validate depths
        if (!depthFields.d1 || !depthFields.d2 || !depthFields.d3 || !depthFields.d4) {
            Swal.fire("Error", "Debe ingresar las 4 profundidades de los sensores.", "warning");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const confirm = await Swal.fire({
            title: isEdit ? "Guardar cambios" : "Crear Estación",
            text: "¿Está seguro de realizar esta acción?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#6fa174",
        });

        if (!confirm.isConfirmed) return;

        const token = localStorage.getItem("cmsAdmin");
        if (!token) {
            Swal.fire("Error", "Sesión expirada", "error");
            return;
        }

        // --- CONCATENATE DEPTHS ---
        const joinedDepth = `${depthFields.d1}, ${depthFields.d2}, ${depthFields.d3}, ${depthFields.d4}`;

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${apiUrl}/stations/${station.station_id}` : `${apiUrl}/stations`;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    depth: joinedDepth, // <--- Send concatenated string
                    admin_id: 1
                }),
            });

            if (!response.ok) throw new Error("Error en servidor");
            const result = await response.json();

            const stationId = isEdit ? station.station_id : result.station_id;

            if (formData.imageFile) {
                const imageForm = new FormData();
                imageForm.append("image", formData.imageFile);
                await fetch(`${apiUrl}/stations/${stationId}/image`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: imageForm,
                });
            }

            Swal.fire("Éxito", "Estación guardada correctamente", "success");
            refreshStations();
            onClose();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo conectar al servidor", "error");
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === "number" ? Number(value) : value });
    };

    const handleDepthChange = (e) => {
        setDepthFields({ ...depthFields, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#13241e' }}>
                {isEdit ? `Editar: ${station.city}` : "Nueva Estación"}
            </h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
                Complete la información técnica y geográfica.
            </p>

            <div className="cms-form-grid">

                <div className="cms-form-section-title">Información General</div>

                <div className="cms-form-group span-2">
                    <label>Nombre de la Ciudad <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="city" value={formData.city} onChange={handleChange} placeholder="Ej. Utuado" />
                </div>

                <div className="cms-form-group">
                    <label>Disponibilidad</label>
                    <select className="cms-select" name="is_available" value={formData.is_available} onChange={handleChange}>
                        <option value={1}>Activa (Visible)</option>
                        <option value={0}>Inactiva (Oculta)</option>
                    </select>
                </div>

                <div className="cms-form-group">
                    <label>Fecha de Instalación <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="date" name="station_installation_date" value={formData.station_installation_date} onChange={handleChange} />
                </div>

                <div className="cms-form-group span-2">
                    <label>Colaborador</label>
                    <input className="cms-input" name="collaborator" value={formData.collaborator} onChange={handleChange} placeholder="Nombre del colaborador o entidad" />
                </div>

                <div className="cms-form-section-title">Ubicación y Geología</div>

                <div className="cms-form-group">
                    <label>Latitud <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="latitude" value={formData.latitude} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Longitud <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="longitude" value={formData.longitude} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Elevación (m) <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="elevation" value={formData.elevation} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Pendiente</label>
                    <input className="cms-input" type="number" name="slope" value={formData.slope} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Unidad Geológica</label>
                    <input className="cms-input" name="geological_unit" value={formData.geological_unit} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>Unidad de Suelo</label>
                    <input className="cms-input" name="land_unit" value={formData.land_unit} onChange={handleChange} />
                </div>

                <div className="cms-form-group span-2">
                    <label>Susceptibilidad <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="susceptibility" value={formData.susceptibility} onChange={handleChange} />
                </div>


                <div className="cms-form-section-title">Configuración de Sensores (WC Max)</div>

                <div className="cms-form-group">
                    <label>WC1 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="wc1" value={formData.wc1} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>WC2 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="wc2" value={formData.wc2} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>WC3 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="wc3" value={formData.wc3} onChange={handleChange} />
                </div>

                <div className="cms-form-group">
                    <label>WC4 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" name="wc4" value={formData.wc4} onChange={handleChange} />
                </div>

                <div className="cms-form-section-title">Profundidad de Sensores (Incluir unidades)</div>

                <div className="cms-form-group">
                    <label>Profundidad 1 <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="d1" value={depthFields.d1} onChange={handleDepthChange} placeholder="Ej. 25 cm" />
                </div>

                <div className="cms-form-group">
                    <label>Profundidad 2 <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="d2" value={depthFields.d2} onChange={handleDepthChange} placeholder="Ej. 50 cm" />
                </div>

                <div className="cms-form-group">
                    <label>Profundidad 3 <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="d3" value={depthFields.d3} onChange={handleDepthChange} placeholder="Ej. 75 cm" />
                </div>

                <div className="cms-form-group">
                    <label>Profundidad 4 <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="d4" value={depthFields.d4} onChange={handleDepthChange} placeholder="Ej. 100 cm" />
                </div>


                <div className="cms-form-section-title">Datos y Archivos</div>

                <div className="cms-form-group span-2">
                    <label>Ruta del Archivo de Data (.dat) <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="ftp_file_path" value={formData.ftp_file_path} onChange={handleChange} placeholder="network/data/latest/(nombre)_t60min.dat" />
                </div>

                <div className="cms-form-group span-2">
                    <label>Imagen de la Estación</label>

                    {previewUrl && (
                        <div className="cms-image-preview-container">
                            <span className="cms-preview-label">Vista Previa:</span>
                            <img src={previewUrl} alt="Vista previa" className="cms-form-preview" />
                        </div>
                    )}

                    <input
                        className="cms-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </div>

                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" className="cms-btn">
                        {isEdit ? "Guardar Cambios" : "Crear Estación"}
                    </button>
                </div>

            </div>
        </form>
    );
}