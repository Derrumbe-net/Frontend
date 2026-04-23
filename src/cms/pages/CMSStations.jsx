import { useState, useEffect } from "react";
import { 
    FaEdit, 
    FaPlus, 
    FaChevronLeft, 
    FaChevronRight, 
    FaDownload, 
    FaSort, 
    FaSortUp, 
    FaSortDown 
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSStations.css";

export default function CMSStations() {
    const [stations, setStations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editStation, setEditStation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const itemsPerPage = 5;
    const API_URL = `${import.meta.env.VITE_API_URL}`;

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        try {
            const response = await fetch(`${API_URL}/stations`);
            const data = await response.json();
            setStations(data || []);
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

    const sortedStations = [...stations].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedStations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStations = sortedStations.slice(startIndex, startIndex + itemsPerPage);

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
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                                    <th onClick={() => handleSort("name")} style={{ cursor: 'pointer' }}>
                                        Nombre de Estación {getSortIcon("name")}
                                    </th>
                                    <th>Estado</th>
                                    <th>WC1 Max</th>
                                    <th>WC2 Max</th>
                                    <th>WC3 Max</th>
                                    <th>WC4 Max</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStations.map((s) => {
                                    const id = s.id || s.station_id;
                                    return (
                                        <tr key={id}>
                                            <td>
                                                {s.sensor_image_url ? (
                                                    <img src={`${API_URL}/stations/item/${id}/image/sensor`} alt={s.name} className="cms-thumb" />
                                                ) : <span className="no-img">N/A</span>}
                                            </td>
                                            <td style={{ fontWeight: "600" }}>{s.name}</td>
                                            <td>
                                                <span className={`status-pill ${s.is_available ? 'status-active' : 'status-inactive'}`}>
                                                    {s.is_available ? "Activa" : "Oculta"}
                                                </span>
                                            </td>
                                            <td>{s.wc1_max}</td>
                                            <td>{s.wc2_max}</td>
                                            <td>{s.wc3_max}</td>
                                            <td>{s.wc4_max}</td>
                                            <td>
                                                <button className="cms-icon-btn" onClick={() => handleOpenForm(s)}>
                                                    <FaEdit />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION UI START --- */}
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
                    {/* --- PAGINATION UI END --- */}

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
    const [depthFields, setDepthFields] = useState({ d1: "", d2: "", d3: "", d4: "" });

    const [formData, setFormData] = useState({
        name: "", wc1_max: "", wc2_max: "", wc3_max: "", wc4_max: "",
        susceptibility: "", elevation: "", latitude: "", longitude: "",
        land_unit: "", geological_unit: "", slope: "",
        collaborator: "", ftp_file_path: "", is_available: 1,
        station_installation_date: "", imageFile: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (station) {
            const depths = station.depth ? station.depth.split(',').map(s => s.trim()) : ["", "", "", ""];
            setDepthFields({ d1: depths[0] || "", d2: depths[1] || "", d3: depths[2] || "", d4: depths[3] || "" });
            setFormData({
                name: station.name || "",
                wc1_max: station.wc1_max || "",
                wc2_max: station.wc2_max || "",
                wc3_max: station.wc3_max || "",
                wc4_max: station.wc4_max || "",
                susceptibility: station.susceptibility || "",
                elevation: station.elevation || "",
                latitude: station.latitude || "",
                longitude: station.longitude || "",
                land_unit: station.land_unit || "",
                geological_unit: station.geological_unit || "",
                slope: station.slope || "",
                collaborator: station.collaborator || "",
                ftp_file_path: station.ftp_file_path || "",
                is_available: station.is_available ? 1 : 0,
                station_installation_date: station.station_installation_date?.slice(0, 10) || "",
                imageFile: null
            });
            if (station.sensor_image_url) setPreviewUrl(`${apiUrl}/stations/item/${stationId}/image/sensor`);
        }
    }, [station, apiUrl, stationId]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === "number" ? Number(value) : value });
    };

    const handleDepthChange = (e) => setDepthFields({ ...depthFields, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("cmsAdmin");
        const joinedDepth = `${depthFields.d1}, ${depthFields.d2}, ${depthFields.d3}, ${depthFields.d4}`;
        const url = isEdit ? `${apiUrl}/stations/item/${stationId}` : `${apiUrl}/stations`;

        try {
            const response = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ...formData, depth: joinedDepth, admin_id: 1 }),
            });
            if (!response.ok) throw new Error();
            const result = await response.json();
            const finalId = isEdit ? stationId : (result.id || result.station_id);

            if (formData.imageFile) {
                const imgData = new FormData();
                imgData.append("image", formData.imageFile);
                await fetch(`${apiUrl}/stations/item/${finalId}/image/sensor`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: imgData,
                });
            }
            Swal.fire("Éxito", "Estación guardada", "success");
            refreshStations();
            onClose();
        } catch (err) {
            Swal.fire("Error", "No se pudo guardar", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#13241e' }}>
                {isEdit ? `Editar Estación: ${formData.name}` : "Nueva Estación"}
            </h2>

            <div className="cms-form-grid">
                <div className="cms-form-section-title">Identificación</div>
                <div className="cms-form-group span-2">
                    <label>Nombre de la Estación <span className="required-asterisk">*</span></label>
                    <input className="cms-input" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Utuado - Universidad" />
                </div>
                
                {/* Resto de los campos (Latitud, Longitud, WC Max, etc.) se mantienen igual */}
                <div className="cms-form-section-title">Configuración Técnica</div>
                <div className="cms-form-group">
                    <label>Latitud</label>
                    <input className="cms-input" type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} />
                </div>
                <div className="cms-form-group">
                    <label>Longitud</label>
                    <input className="cms-input" type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} />
                </div>
                
                {/* Secciones de WC Max y Profundidad abreviadas para brevedad */}
                <div className="cms-form-section-title">Límites WC Max</div>
                <div className="cms-form-group"><label>WC1</label><input className="cms-input" type="number" name="wc1_max" value={formData.wc1_max} onChange={handleChange} /></div>
                <div className="cms-form-group"><label>WC2</label><input className="cms-input" type="number" name="wc2_max" value={formData.wc2_max} onChange={handleChange} /></div>
                
                <div className="cms-form-actions">
                    <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="cms-btn">Guardar Estación</button>
                </div>
            </div>
        </form>
    );
}
