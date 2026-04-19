import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../cms/styles/CMSFundingSources.css";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

export default function CMSFundingSources() {
  const [sources, setSources]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editSource, setEditSource] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(sources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated  = sources.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { fetchSources(); }, []);

  const fetchSources = async () => {
    try {
      const res  = await fetch(`${API_URL}/funding-sources`);
      const data = await res.json();
      setSources(data);
    } catch (err) {
      console.error("Error fetching funding sources:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar fuente de financiamiento?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e55353",
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("cmsAdmin");
      const res = await fetch(`${API_URL}/funding-sources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { Swal.fire("Error", "No se pudo eliminar.", "error"); return; }
      Swal.fire("Eliminado", "La fuente fue eliminada.", "success");
      fetchSources();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo conectar al servidor.", "error");
    }
  };

  const handleOpenForm = (source = null) => {
    setEditSource(source);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditSource(null);
  };

  return (
    <div className="cms-funding-wrapper">
      <div className="cms-page-header">
        <div className="cms-header-content">
          <span className="cms-accent-line"></span>
          <h1 className="cms-page-title">Fuentes de Financiamiento</h1>
          <p className="cms-page-subtitle">
            Administre los organismos y agencias que financian la oficina. Los logos y nombres aparecerán
            al final de la página "Sobre Nosotros".
          </p>
        </div>
        {!showForm && (
          <button className="cms-btn" onClick={() => handleOpenForm()}>
            <FaPlus /> Añadir Fuente
          </button>
        )}
      </div>

      {!showForm ? (
        <div className="cms-card">
          <div className="cms-table-container">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nombre</th>
                  <th>Sitio Web</th>
                  <th>Orden</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#a0aec0", padding: "32px" }}>
                      No hay fuentes de financiamiento registradas.
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <tr key={s.funding_id}>
                      <td>
                        {s.image_url ? (
                          <img
                            src={`${API_URL}/funding-sources/${s.funding_id}/image`}
                            alt={s.name}
                            className="cms-thumb cms-thumb--logo"
                          />
                        ) : (
                          <span className="no-img">Sin logo</span>
                        )}
                      </td>
                      <td style={{ fontWeight: "600" }}>{s.name}</td>
                      <td>
                        {s.website_url ? (
                          <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="cms-link">
                            Visitar ↗
                          </a>
                        ) : (
                          <span style={{ color: "#a0aec0", fontSize: "0.82rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>{s.display_order}</td>
                      <td>
                        <button className="cms-icon-btn" onClick={() => handleOpenForm(s)} title="Editar">
                          <FaEdit />
                        </button>
                        <button
                          className="cms-icon-btn cms-delete-btn"
                          onClick={() => handleDelete(s.funding_id)}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
        <div className="cms-card">
          <FundingSourceForm
            source={editSource}
            onClose={handleCloseForm}
            refreshSources={fetchSources}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Form component
// ─────────────────────────────────────────────
function FundingSourceForm({ source, onClose, refreshSources }) {
  const isEdit = !!source;

  const [formData, setFormData] = useState({
    name:          source?.name          ?? "",
    website_url:   source?.website_url   ?? "",
    display_order: source?.display_order ?? 0,
    imageFile:     null,
  });

  const [previewUrl, setPreviewUrl] = useState(
    source?.image_url ? `${API_URL}/funding-sources/${source.funding_id}/image` : null
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imageFile: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    if (!formData.name.trim()) {
      Swal.fire("Error", "El nombre es obligatorio.", "warning");
      return false;
    }
    if (formData.website_url.trim()) {
      try { new URL(formData.website_url.trim()); }
      catch { Swal.fire("Error", "El formato del sitio web no es válido.", "warning"); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const confirmed = await Swal.fire({
      title: isEdit ? "Guardar cambios" : "Crear Fuente",
      text: "¿Desea confirmar esta acción?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6fa174",
    });
    if (!confirmed.isConfirmed) return;

    const method = isEdit ? "PUT" : "POST";
    const url    = isEdit
      ? `${API_URL}/funding-sources/${source.funding_id}`
      : `${API_URL}/funding-sources`;

    const { imageFile, ...bodyData } = formData;

    try {
      const token = localStorage.getItem("cmsAdmin");
      if (!token) { Swal.fire("Error", "Sesión expirada.", "error"); return; }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) { Swal.fire("Error", "No se pudo guardar.", "error"); return; }

      const result   = await res.json();
      const sourceId = isEdit ? source.funding_id : result.funding_id;

      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append("image", imageFile);
        await fetch(`${API_URL}/funding-sources/${sourceId}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: imgForm,
        });
      }

      Swal.fire("Éxito", "Operación realizada correctamente.", "success");
      refreshSources();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "#13241e" }}>
        {isEdit ? "Editar Fuente de Financiamiento" : "Nueva Fuente de Financiamiento"}
      </h2>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        El nombre y logo aparecerán en la sección de financiamiento de la página "Sobre Nosotros".
      </p>

      <div className="cms-form-grid">
        <div className="cms-form-section-title">Información</div>

        {/* Name */}
        <div className="cms-form-group span-2">
          <label>Nombre de la organización <span className="required-asterisk">*</span></label>
          <input
            className="cms-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej. National Science Foundation"
          />
        </div>

        {/* Website */}
        <div className="cms-form-group span-2">
          <label>Sitio web</label>
          <input
            className="cms-input"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            placeholder="https://www.nsf.gov"
          />
        </div>

        {/* Display order */}
        <div className="cms-form-group">
          <label>Orden de aparición</label>
          <input
            className="cms-input"
            type="number"
            name="display_order"
            value={formData.display_order}
            onChange={handleChange}
            min={0}
          />
        </div>

        <div className="cms-form-section-title">Logo</div>

        <div className="cms-form-group span-3">
          {previewUrl && (
            <div className="cms-image-preview-container">
              <p style={{ marginBottom: "10px", fontSize: "0.8rem", fontWeight: "600", color: "#718096" }}>
                Vista Previa:
              </p>
              <img src={previewUrl} alt="Vista previa" className="cms-form-preview cms-form-preview--logo" />
            </div>
          )}
          <label>Subir Logo</label>
          <input className="cms-input" type="file" accept="image/*" onChange={handleImageChange} />
          <p style={{ fontSize: "0.78rem", color: "#718096", marginTop: "4px" }}>
            Se recomienda PNG o SVG con fondo transparente. Tamaño ideal: 400 × 200 px.
          </p>
        </div>

        <div className="cms-form-actions">
          <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="cms-btn">
            {isEdit ? "Guardar Cambios" : "Crear Fuente"}
          </button>
        </div>
      </div>
    </form>
  );
}
