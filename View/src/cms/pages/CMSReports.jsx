import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSReports.css";

export default function CMSReports() {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = `${import.meta.env.VITE_API_URL}`;
  const itemsPerPage = 5;

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
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditReport(null);
  };

  return (
    <div className="cms-reports">
      <h1>Reportes</h1>

      <table className="cms-table">
        <thead>
          <tr>
            <th>Editar</th>
            <th>Pueblo</th>
            <th>Fecha</th>
            <th>Validado</th>
            <th>Imagen</th>
          </tr>
        </thead>

        <tbody>
          {paginatedReports.map((r) => (
            <tr
              key={r.report_id}
              className={r.is_validated}
            >
              <td>
                <button 
                  className="edit-btn" 
                  onClick={() => {
                    handleOpenForm(r);
                    setEditingRowId(r.report_id);
                  }}
                >
                  <FaEdit />
                </button>
              </td>
              <td>{r.city}</td>
              <td>{r.reported_at?.slice(0, 10)}</td>
              <td>{r.is_validated ? "Sí" : "No"}</td>
              <td>
                {r.image_url ? (
                  <img
                    src={`${API_URL}/reports/${r.report_id}/image`}
                    alt="Reporte"
                    className="cms-thumb"
                  />
                ) : (
                  <span className="no-img">Sin imagen</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}>◀</button>

        <span>Página {currentPage} de {totalPages}</span>

        <button disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}>▶</button>
      </div>

      {showForm && (
        <div className="inline-form-container">
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
    reporter_name: report?.reporter_name || "",
    reporter_phone: report?.reporter_phone || "",
    reporter_email: report?.reporter_email || "",
    reported_at: report?.reported_at?.slice(0, 10) || "",
    description: report?.description || "",
    city: report?.city || "",
    physical_address: report?.physical_address || "",
    latitude: report?.latitude || "",
    longitude: report?.longitude || "",
    is_validated: report?.is_validated || 0,
    imageFile: null
  });

  const requiredMissing = () => {
    const missing = [];
    if (!formData.reported_at) missing.push("Fecha");
    if (!formData.city) missing.push("Pueblo");
    if (!formData.latitude) missing.push("Latitud");
    if (!formData.longitude) missing.push("Longitud");
    return missing;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = requiredMissing();
    if (missing.length > 0) {
      Swal.fire(
        "Campos requeridos faltantes",
        `Debe completar: ${missing.join(", ")}`,
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Guardar Cambios",
      text: "¿Confirmar validación del reporte?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("cmsAdmin");

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
    <form className="cms-form" onSubmit={handleSubmit}>
      <h2>Validar Reporte</h2>

      {report.image_url && (
        <div className="current-image">
          <p>Imagen actual:</p>
          <img
            src={`${API_URL}/reports/${report.report_id}/image`}
            alt="Reporte"
            className="image-preview"
          />
        </div>
      )}

      <label>Nombre Completo:</label>
      <input name="reporter_name" value={formData.reporter_name} onChange={handleChange} />

      <label>Número de Teléfono:</label>
      <input name="reporter_phone" value={formData.reporter_phone} onChange={handleChange} />

      <label>Correo Electrónico:</label>
      <input name="reporter_email" value={formData.reporter_email} onChange={handleChange} />

      <label>Fecha: <span className="required">*</span></label>
      <input type="date" name="reported_at" value={formData.reported_at} onChange={handleChange} />

      <label>Descripción Breve:</label>
      <textarea name="description" rows="4" value={formData.description} onChange={handleChange} />

      <label>Pueblo: <span className="required">*</span></label>
      <input name="city" value={formData.city} onChange={handleChange} />

      <label>Carretera:</label>
      <input name="physical_address" value={formData.physical_address} onChange={handleChange} />

      <label>Latitud: <span className="required">*</span></label>
      <input name="latitude" value={formData.latitude} onChange={handleChange} />

      <label>Longitud: <span className="required">*</span></label>
      <input name="longitude" value={formData.longitude} onChange={handleChange} />

      <label>Subir Nueva Imagen (opcional):</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFormData({ ...formData, imageFile: e.target.files[0] })
        }
      />

      <label className="validation-label">Validar Reporte:</label>

      <div className="validation-toggle">
        <label className="checkbox-container">
          <input
            type="checkbox"
            name="is_validated"
            checked={formData.is_validated == 1}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
        </label>

        <span className={formData.is_validated ? "status valid" : "status pending"}>
          {formData.is_validated ? "Validado" : "Pendiente"}
        </span>
      </div>

      <div className="cms-form__actions">
        <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="submit-btn">Guardar Cambios</button>
      </div>
    </form>
  );
}
