import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
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
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditStation(null);
  };

  return (
    <div className="cms-stations">
      <h1>Estaciones</h1>
      
      <table className="cms-table">
        <thead>
          <tr>
            <th></th>
            <th>Ciudad</th>
            <th>Saturación</th>
            <th>Precip.</th>
            <th>WC1</th>
            <th>WC2</th>
            <th>WC3</th>
            <th>WC4</th>
            <th>Suscept.</th>
            <th>Elevación</th>
            <th>Disponible</th>
          </tr>
        </thead>

        <tbody>
          {paginatedStations.map((s) => (
            <tr key={s.station_id}>
              <td>
                <button className="edit-btn" onClick={() => handleOpenForm(s)}>
                  <FaEdit />
                </button>
              </td>
              <td>{s.city}</td>
              <td>{s.soil_saturation}%</td>
              <td>{s.precipitation}</td>
              <td>{s.wc1}</td>
              <td>{s.wc2}</td>
              <td>{s.wc3}</td>
              <td>{s.wc4}</td>
              <td>{s.susceptibility}</td>
              <td>{s.elevation}</td>
              <td>{s.is_available ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          ◀
        </button>

        <span>Página {currentPage} de {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          ▶
        </button>
      </div>

      <div className="add-btn-container">
        <button className="add-btn-text" onClick={() => handleOpenForm()}>
          Añadir Estación
        </button>
      </div>

      {showForm && (
        <div className="inline-form-container">
          <StationForm
            station={editStation}
            onClose={handleCloseForm}
            refreshStations={fetchStations}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FORM
============================================================ */

function StationForm({ station, onClose, refreshStations }) {
  const isEdit = !!station;

  const [formData, setFormData] = useState({
    city: "",
    soil_saturation: "",
    precipitation: "",
    wc1: "",
    wc2: "",
    wc3: "",
    wc4: "",
    susceptibility: "",
    elevation: "",
    latitude: "",
    longitude: "",
    depth: "",
    land_unit: "",
    geological_unit: "",
    slope: "",
    collaborator: "",
    ftp_file_path: "",
    is_available: 1,
    station_installation_date: "",
  });

  useEffect(() => {
    if (station) {
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
        depth: station.depth || "",
        land_unit: station.land_unit || "",
        geological_unit: station.geological_unit || "",
        slope: station.slope || "",
        collaborator: station.collaborator || "",
        ftp_file_path: station.ftp_file_path || "",
        is_available: station.is_available ?? 1,
        station_installation_date:
          station.station_installation_date?.slice(0, 10) || "",
      });
    } else {
      setFormData({
        city: "",
        soil_saturation: "",
        precipitation: "",
        wc1: "",
        wc2: "",
        wc3: "",
        wc4: "",
        susceptibility: "",
        elevation: "",
        latitude: "",
        longitude: "",
        depth: "",
        land_unit: "",
        geological_unit: "",
        slope: "",
        collaborator: "",
        ftp_file_path: "",
        is_available: 1,
        station_installation_date: "",
      });
    }
  }, [station]);


  const validate = () => {
    if (!formData.city.trim()) {
      Swal.fire("Campo requerido", "La ciudad es obligatoria.", "warning");
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      Swal.fire("Coordenadas faltantes", "Latitud y longitud son obligatorias.", "warning");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const confirm = await Swal.fire({
      title: isEdit ? "Guardar cambios" : "Añadir Estación",
      text: isEdit
        ? "¿Desea confirmar los cambios realizados?"
        : "¿Desea añadir esta nueva estación?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem("cmsAdmin"); // get JWT token

    if (!token) {
      Swal.fire("Error", "No se encontró token de autenticación. Por favor inicie sesión.", "error");
      return;
    }

    const API_URL = `${import.meta.env.VITE_API_URL}`;
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit
      ? `${API_URL}/stations/${station.station_id}`
      : `${API_URL}/stations`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // <-- Add JWT header
        },
        body: JSON.stringify({
          ...formData,
          admin_id: 1, // TODO: connect logged user later
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        Swal.fire("Error", msg || "Ocurrió un error al guardar.", "error");
        return;
      }

      Swal.fire(
        "Éxito",
        isEdit
          ? "Estación actualizada correctamente"
          : "Estación creada correctamente",
        "success"
      );

      refreshStations();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo conectar al servidor.", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  return (
    <form className="cms-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? "Editar Estación" : "Añadir Estación"}</h2>

      <label>Ciudad:</label>
      <input name="city" value={formData.city} onChange={handleChange} />

      <label>Saturación (%):</label>
      <input type="number" name="soil_saturation" value={formData.soil_saturation} onChange={handleChange} />

      <label>Precipitación:</label>
      <input type="number" name="precipitation" value={formData.precipitation} onChange={handleChange} />

      <label>WC1:</label>
      <input type="number" name="wc1" value={formData.wc1} onChange={handleChange} />

      <label>WC2:</label>
      <input type="number" name="wc2" value={formData.wc2} onChange={handleChange} />

      <label>WC3:</label>
      <input type="number" name="wc3" value={formData.wc3} onChange={handleChange} />

      <label>WC4:</label>
      <input type="number" name="wc4" value={formData.wc4} onChange={handleChange} />

      <label>Susceptibilidad:</label>
      <input name="susceptibility" value={formData.susceptibility} onChange={handleChange} />

      <label>Elevación (m):</label>
      <input type="number" name="elevation" value={formData.elevation} onChange={handleChange} />

      <label>Latitud:</label>
      <input type="number" name="latitude" value={formData.latitude} onChange={handleChange} />

      <label>Longitud:</label>
      <input type="number" name="longitude" value={formData.longitude} onChange={handleChange} />

      <label>Unidad de suelo:</label>
      <input name="land_unit" value={formData.land_unit} onChange={handleChange} />

      <label>Unidad geológica:</label>
      <input name="geological_unit" value={formData.geological_unit} onChange={handleChange} />

      <label>Inclinación:</label>
      <input type="number" name="slope" value={formData.slope} onChange={handleChange} />

      <label>Profundidad WC:</label>
      <input name="depth" value={formData.depth} onChange={handleChange} />

      <label>Colaborador:</label>
      <input name="collaborator" value={formData.collaborator} onChange={handleChange} />

      <label>Archivo FTP:</label>
      <input name="ftp_file_path" value={formData.ftp_file_path} onChange={handleChange} />

      <label>Fecha Instalación:</label>
      <input type="date" name="station_installation_date" value={formData.station_installation_date} onChange={handleChange} />

      <label>Disponible:</label>
      <select name="is_available" value={formData.is_available} onChange={handleChange}>
        <option value={1}>Sí</option>
        <option value={0}>No</option>
      </select>

      <div className="cms-form__actions">
        <button type="button" className="cancel-btn" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="submit-btn">
          {isEdit ? "Guardar Cambios" : "Añadir Estación"}
        </button>
      </div>
    </form>
  );
}
