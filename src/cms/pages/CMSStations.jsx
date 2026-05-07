import { useState, useEffect } from "react";
import { 
    FaEdit, 
    FaPlus, 
    FaChevronLeft, 
    FaChevronRight, 
    FaDownload, 
    FaSort, 
    FaSortUp, 
    FaSortDown,
    FaTrash,
    FaSearch,
    FaSpinner,
    FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSStations.css";

export default function CMSStations() {
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editStation, setEditStation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const itemsPerPage = 5;
    const API_URL = `${import.meta.env.VITE_API_URL}`;

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/stations`);
            const data = await response.json();
            setStations(data || []);
        } catch (error) {
            console.error("Error fetching stations:", error);
            Swal.fire("Error", "No se pudieron cargar las estaciones.", "error");
        } finally {
            setIsLoading(false);
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

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: '¿Eliminar estación?',
            text: `Estás a punto de eliminar "${name}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("cmsAdmin");
                const response = await fetch(`${API_URL}/stations/${id}`, {
                    method: 'DELETE',
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Delete failed");
                
                Swal.fire('¡Eliminada!', 'La estación ha sido eliminada.', 'success');
                fetchStations();
            } catch (error) {
                Swal.fire('Error', 'Hubo un problema al eliminar la estación.', 'error');
            }
        }
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort style={{ opacity: 0.3, marginLeft: '5px' }} />;
        return sortConfig.direction === "asc" ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />;
    };

    // 1. Filter by Search Term
    const filteredStations = stations.filter(s => 
        (s.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort the filtered results
    const sortedStations = [...filteredStations].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (aValue == null) aValue = "";
        if (bValue == null) bValue = "";
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    // 3. Paginate
    const totalPages = Math.ceil(sortedStations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStations = sortedStations.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const exportToCSV = () => {
        const headers = ["ID", "Nombre de Estación", "Estado", "Latitud", "Longitud", "WC1_Max", "WC2_Max", "WC3_Max", "WC4_Max"];
        const rows = sortedStations.map(s => [
            s.id || s.station_id || "",
            `"${s.name || ""}"`,
            s.is_available ? "Activa" : "Oculta",
            s.latitude || "",
            s.longitude || "",
            s.wc1_max || "",
            s.wc2_max || "",
            s.wc3_max || "",
            s.wc4_max || ""
        ]);

        const csvContent = ["\uFEFF" + headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "estaciones_prlhmo.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="cms-stations-wrapper">
            <div className="cms-page-header">
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Administración de Estaciones</h1>
                </div>

                {!showForm && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="cms-search-bar" style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar estación..." 
                                className="cms-input"
                                style={{ paddingLeft: '35px', margin: 0, width: '250px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="cms-btn cms-btn-secondary" onClick={exportToCSV}>
                            <FaDownload /> Exportar CSV
                        </button>
                        <button className="cms-btn" onClick={() => handleOpenForm()}>
                            <FaPlus /> Añadir Estación
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
                                    <th onClick={() => handleSort("name")} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        Estación {getSortIcon("name")}
                                    </th>
                                    <th onClick={() => handleSort("is_available")} style={{ cursor: 'pointer' }}>
                                        Estado {getSortIcon("is_available")}
                                    </th>
                                    <th>WC1 Max</th>
                                    <th>WC2 Max</th>
                                    <th>WC3 Max</th>
                                    <th>WC4 Max</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                            <FaSpinner className="fa-spin" style={{ fontSize: '24px', color: '#3B7D23' }} />
                                            <p style={{ marginTop: '10px' }}>Cargando estaciones...</p>
                                        </td>
                                    </tr>
                                ) : paginatedStations.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                            No se encontraron estaciones.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedStations.map((s) => {
                                        const id = s.id || s.station_id;
                                        // CHECK FOR ALL POSSIBLE IMAGE PATH PROPERTIES HERE
                                        const hasImage = s.image_url || s.sensor_image_url || s.image_path || s.sensor_image_path;

                                        return (
                                            <tr key={id}>
                                                <td>
                                                    {hasImage ? (
                                                        <a
                                                            href={`${API_URL}/stations/item/${id}/images/sensor`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Ver imagen completa"
                                                        >
                                                            <img 
                                                                src={`${API_URL}/stations/item/${id}/images/sensor?t=${new Date().getTime()}`} 
                                                                alt={s.name} 
                                                                className="cms-thumb" 
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                                                            />
                                                        </a>
                                                    ) : (
                                                        <span className="no-img" style={{ fontSize: '12px', color: '#aaa' }}>Sin img</span>
                                                    )}
                                                </td>
                                                <td style={{ fontWeight: "600" }}>{s.name}</td>
                                                <td>
                                                    <span className={`status-pill ${s.is_available ? 'status-active' : 'status-inactive'}`}>
                                                        {s.is_available ? "Activa" : "Oculta"}
                                                    </span>
                                                </td>
                                                <td>{s.wc1_max ?? s.wc1Max ?? '-'}</td>
                                                <td>{s.wc2_max ?? s.wc2Max ?? '-'}</td>
                                                <td>{s.wc3_max ?? s.wc3Max ?? '-'}</td>
                                                <td>{s.wc4_max ?? s.wc4Max ?? '-'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="cms-icon-btn" onClick={() => handleOpenForm(s)} title="Editar">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="cms-icon-btn delete-btn" onClick={() => handleDelete(id, s.name)} title="Eliminar" style={{ color: '#d33', marginLeft: '5px' }}>
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

                    {!isLoading && sortedStations.length > 0 && (
                        <div className="cms-pagination">
                            <button
                                className="cms-icon-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                <FaChevronLeft />
                            </button>
                            <span className="cms-page-info">
                                Página {currentPage} de {totalPages || 1}
                            </span>
                            <button
                                className="cms-icon-btn"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
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
    const stationId = station?.id || station?.station_id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [depthFields, setDepthFields] = useState({ d1: "", d2: "", d3: "", d4: "" });
    const [formData, setFormData] = useState({
        name: "", 
        is_available: 1,
        latitude: "", 
        longitude: "",
        elevation: "", 
        slope: "",
        susceptibility: "", 
        land_unit: "", 
        geological_unit: "", 
        wc1_max: "", 
        wc2_max: "", 
        wc3_max: "", 
        wc4_max: "",
        soil_saturation: "",
        precipitation: "",
        collaborator: "", 
        station_installation_date: "", 
        imageFile: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (station) {
            const depths = station.depth ? station.depth.split(',').map(s => s.trim()) : ["", "", "", ""];
            setDepthFields({ d1: depths[0] || "", d2: depths[1] || "", d3: depths[2] || "", d4: depths[3] || "" });
            setFormData({
                name: station.name || "",
                is_available: station.is_available ? 1 : 0,
                latitude: station.latitude || "",
                longitude: station.longitude || "",
                elevation: station.elevation || "",
                slope: station.slope || "",
                susceptibility: station.susceptibility || "",
                land_unit: station.land_unit || "",
                geological_unit: station.geological_unit || "",
                wc1_max: station.wc1_max ?? station.wc1Max ?? "",
                wc2_max: station.wc2_max ?? station.wc2Max ?? "",
                wc3_max: station.wc3_max ?? station.wc3Max ?? "",
                wc4_max: station.wc4_max ?? station.wc4Max ?? "",
                soil_saturation: station.soil_saturation || "",
                precipitation: station.precipitation || "",
                collaborator: station.collaborator || "",
                station_installation_date: station.station_installation_date?.slice(0, 10) || "",
                imageFile: null
            });

            // FIXED: Checking for _path variants as well!
            const hasImage = station.image_url || station.sensor_image_url || station.image_path || station.sensor_image_path;
            
            if (hasImage) {
                setPreviewUrl(`${apiUrl}/stations/item/${stationId}/images/sensor?t=${new Date().getTime()}`);
            } else {
                setPreviewUrl(null);
            }
        }
    }, [station, apiUrl, stationId]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === "number" ? Number(value) : value });
    };

    const handleDepthChange = (e) => setDepthFields({ ...depthFields, [e.target.name]: e.target.value });

    const validate = () => {
        if (!formData.name.trim()) { Swal.fire("Error", "El nombre de la estación es obligatorio.", "warning"); return false; }
        if (!formData.latitude || !formData.longitude) { Swal.fire("Error", "Latitud y Longitud son obligatorias.", "warning"); return false; }
        if (!formData.elevation) { Swal.fire("Error", "La elevación es obligatoria.", "warning"); return false; }
        if (!formData.susceptibility) { Swal.fire("Error", "La susceptibilidad es obligatoria.", "warning"); return false; }
        if (!formData.station_installation_date) { Swal.fire("Error", "La fecha de instalación es obligatoria.", "warning"); return false; }

        if (formData.wc1_max === "" || formData.wc2_max === "" || formData.wc3_max === "" || formData.wc4_max === "") {
            Swal.fire("Error", "Todos los campos de WC Max son obligatorios.", "warning");
            return false;
        }
        return true;
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, imageFile: e.target.files[0] });
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const clearImage = () => {
        setFormData({ ...formData, imageFile: null });
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        setIsSubmitting(true);
        const token = localStorage.getItem("cmsAdmin");
        
        const joinedDepth = [depthFields.d1, depthFields.d2, depthFields.d3, depthFields.d4]
            .filter(d => d !== "")
            .join(", ");

        const url = isEdit ? `${apiUrl}/stations/${stationId}` : `${apiUrl}/stations`;

        try {
            const response = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ...formData, depth: joinedDepth, admin_id: 1 }),
            });
            
            if (!response.ok) throw new Error("Error saving station details");
            const result = await response.json();
            const finalId = isEdit ? stationId : (result.id || result.station_id);

            if (formData.imageFile) {
                const imgData = new FormData();
                imgData.append("image", formData.imageFile);
                const imgResponse = await fetch(`${apiUrl}/stations/${finalId}/image/sensor`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: imgData,
                });
                if (!imgResponse.ok) throw new Error("Error uploading image");
            }

            Swal.fire("Éxito", `Estación ${isEdit ? 'actualizada' : 'creada'} correctamente`, "success");
            refreshStations();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message || "No se pudo guardar la estación", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#13241e', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                {isEdit ? `Editar Estación: ${formData.name}` : "Nueva Estación"}
            </h2>

            <div className="cms-form-grid">
                {/* --- SECCIÓN: IDENTIFICACIÓN --- */}
                <div className="cms-form-section-title span-2">Identificación</div>
                <div className="cms-form-group">
                    <label>Nombre de la Estación <span className="required-asterisk">*</span></label>
                    <input className="cms-input" required name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Utuado - Universidad" disabled={isSubmitting} />
                </div>
                <div className="cms-form-group">
                    <label>Estado</label>
                    <select className="cms-input" name="is_available" value={formData.is_available} onChange={handleChange} disabled={isSubmitting}>
                        <option value={1}>Activa (Pública)</option>
                        <option value={0}>Inactiva / Oculta</option>
                    </select>
                </div>

                {/* --- SECCIÓN: UBICACIÓN Y GEOLOGÍA --- */}
                <div className="cms-form-section-title span-2">Ubicación y Geología</div>
                <div className="cms-form-group">
                    <label>Latitud <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>Longitud <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>Elevación (m) <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="elevation" value={formData.elevation} onChange={handleChange} disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>Pendiente (Grados)</label>
                    <input className="cms-input" type="number" step="any" name="slope" value={formData.slope} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div className="cms-form-group">
                    <label>Susceptibilidad <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="susceptibility" value={formData.susceptibility} onChange={handleChange} placeholder="Ej. Muy alta" disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>Unidad de Suelo</label>
                    <input className="cms-input" name="land_unit" value={formData.land_unit} onChange={handleChange} placeholder="Ej. Arcilla mucara" disabled={isSubmitting} />
                </div>
                <div className="cms-form-group span-2">
                    <label>Unidad Geológica</label>
                    <input className="cms-input" name="geological_unit" value={formData.geological_unit} onChange={handleChange} placeholder="Ej. Formación Maricao" disabled={isSubmitting} />
                </div>

                {/* --- SECCIÓN: LÍMITES WC MAX --- */}
                <div className="cms-form-section-title span-2">Límites Volumétricos de Agua (WC Max)</div>
                <div className="cms-form-group">
                    <label>WC1 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="wc1_max" value={formData.wc1_max} onChange={handleChange} disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>WC2 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="wc2_max" value={formData.wc2_max} onChange={handleChange} disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>WC3 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="wc3_max" value={formData.wc3_max} onChange={handleChange} disabled={isSubmitting} required />
                </div>
                <div className="cms-form-group">
                    <label>WC4 Max <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="number" step="any" name="wc4_max" value={formData.wc4_max} onChange={handleChange} disabled={isSubmitting} required />
                </div>

                {/* --- SECCIÓN: PROFUNDIDADES --- */}
                <div className="cms-form-section-title span-2">Profundidad de Sensores</div>
                <div className="cms-form-group">
                    <label>Profundidad Sensor 1</label>
                    <input className="cms-input" name="d1" value={depthFields.d1} onChange={handleDepthChange} placeholder="Ej. 20 cm" disabled={isSubmitting} />
                </div>
                <div className="cms-form-group">
                    <label>Profundidad Sensor 2</label>
                    <input className="cms-input" name="d2" value={depthFields.d2} onChange={handleDepthChange} placeholder="Ej. 40 cm" disabled={isSubmitting} />
                </div>
                <div className="cms-form-group">
                    <label>Profundidad Sensor 3</label>
                    <input className="cms-input" name="d3" value={depthFields.d3} onChange={handleDepthChange} placeholder="Ej. 60 cm" disabled={isSubmitting} />
                </div>
                <div className="cms-form-group">
                    <label>Profundidad Sensor 4</label>
                    <input className="cms-input" name="d4" value={depthFields.d4} onChange={handleDepthChange} placeholder="Ej. 80 cm" disabled={isSubmitting} />
                </div>

                {/* --- SECCIÓN: DATOS ADICIONALES --- */}
                <div className="cms-form-section-title span-2">Datos Adicionales</div>
                <div className="cms-form-group">
                    <label>Colaborador</label>
                    <input className="cms-input" name="collaborator" value={formData.collaborator} onChange={handleChange} placeholder="Ej. UPR Mayagüez" disabled={isSubmitting} />
                </div>
                <div className="cms-form-group span-2">
                    <label>Fecha de Instalación <span className="required-asterisk">*</span></label>
                    <input className="cms-input" type="date" name="station_installation_date" value={formData.station_installation_date} onChange={handleChange} disabled={isSubmitting} required />
                </div>

                {/* --- SECCIÓN: IMAGEN --- */}
                <div className="cms-form-section-title span-2">Imagen de la Estación</div>
                <div className="cms-form-group span-2">
                    <label>Subir Fotografía</label>
                    <input className="cms-input" type="file" accept="image/*" onChange={handleImageChange} disabled={isSubmitting} />
                    {previewUrl && (
                        <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                            <img src={previewUrl} alt="Vista previa" style={{ maxWidth: "200px", borderRadius: "8px", border: "1px solid #ccc" }} />
                            <button 
                                type="button" 
                                onClick={clearImage}
                                style={{
                                    position: 'absolute', top: '-10px', right: '-10px', 
                                    background: '#d33', color: 'white', border: 'none', 
                                    borderRadius: '50%', width: '25px', height: '25px', 
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Eliminar imagen"
                                disabled={isSubmitting}
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>

                {/* --- ACCIONES --- */}
                <div className="cms-form-actions span-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
                    <button type="submit" className="cms-btn" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSubmitting ? <><FaSpinner className="fa-spin" /> Guardando...</> : "Guardar Estación"}
                    </button>
                </div>
            </div>
        </form>
    );
}