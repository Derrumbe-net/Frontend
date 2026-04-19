import { useState, useEffect } from "react";
import { FaSave, FaBuilding } from "react-icons/fa";
import "../../cms/styles/CMSOfficeInfo.css";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

export default function CMSOfficeInfo() {
  const [formData, setFormData] = useState({
    email:           "",
    phone:           "",
    phone_ext:       "",
    office_location: "",
    facebook_url:    "",
  });
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/office-info`)
      .then((r) => r.json())
      .then((data) => {
        setFormData({
          email:           data.email           ?? "",
          phone:           data.phone           ?? "",
          phone_ext:       data.phone_ext       ?? "",
          office_location: data.office_location ?? "",
          facebook_url:    data.facebook_url    ?? "",
        });
      })
      .catch((err) => console.error("Error fetching office info:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      Swal.fire("Error", "El correo electrónico es obligatorio.", "warning");
      return;
    }

    const confirmed = await Swal.fire({
      title: "Guardar cambios",
      text: "¿Desea actualizar la información de contacto de la oficina?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6fa174",
    });
    if (!confirmed.isConfirmed) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("cmsAdmin");
      if (!token) { Swal.fire("Error", "Sesión expirada.", "error"); return; }

      const res = await fetch(`${API_URL}/office-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) { Swal.fire("Error", "No se pudo guardar.", "error"); return; }

      Swal.fire("Éxito", "Información de contacto actualizada correctamente.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cms-officeinfo-wrapper">
        <p className="cms-officeinfo-loading">Cargando información…</p>
      </div>
    );
  }

  return (
    <div className="cms-officeinfo-wrapper">

      {/* ── Header ── */}
      <div className="cms-officeinfo-header">
        <div>
          <span className="cms-accent-line"></span>
          <h1 className="cms-page-title">Información de Contacto</h1>
          <p className="cms-page-subtitle">
            Edite los datos de contacto de la oficina que aparecen en la página de inicio
            y en la sección de directorio del sitio web.
          </p>
        </div>
        <div className="cms-officeinfo-preview-badge">
          <FaBuilding />
          <span>Datos globales de la oficina</span>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="cms-card">
        <form onSubmit={handleSubmit}>

          <div className="cms-form-grid">

            <div className="cms-form-section-title">Datos de Contacto</div>

            {/* Email */}
            <div className="cms-form-group span-2">
              <label>
                Correo Electrónico <span className="required-asterisk">*</span>
              </label>
              <input
                className="cms-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="slidespr@uprm.edu"
              />
            </div>

            {/* Phone */}
            <div className="cms-form-group">
              <label>Teléfono</label>
              <input
                className="cms-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="787-832-4040"
              />
            </div>

            {/* Extension */}
            <div className="cms-form-group">
              <label>Extensión</label>
              <input
                className="cms-input"
                name="phone_ext"
                value={formData.phone_ext}
                onChange={handleChange}
                placeholder="Ext. 6844"
              />
            </div>

            {/* Office location */}
            <div className="cms-form-group span-2">
              <label>Dirección / Ubicación de la Oficina</label>
              <textarea
                className="cms-textarea"
                name="office_location"
                value={formData.office_location}
                onChange={handleChange}
                placeholder={"Residencia 4B\nUniversidad de Puerto Rico, Recinto de Mayagüez"}
                rows={3}
              />
              <span className="cms-input-hint">
                Use saltos de línea para separar líneas de la dirección.
              </span>
            </div>

            <div className="cms-form-section-title">Redes Sociales</div>

            {/* Facebook */}
            <div className="cms-form-group span-2">
              <label>URL de Facebook</label>
              <input
                className="cms-input"
                name="facebook_url"
                value={formData.facebook_url}
                onChange={handleChange}
                placeholder="https://www.facebook.com/SlidesPR"
              />
            </div>

            {/* Preview panel */}
            <div className="cms-form-section-title">Vista Previa</div>
            <div className="cms-officeinfo-preview span-2">
              <h3>Contáctenos</h3>
              <hr />
              {formData.email && (
                <p><strong>Email:</strong><br />{formData.email}</p>
              )}
              {formData.phone && (
                <p>
                  <strong>Teléfono:</strong><br />
                  {formData.phone}{formData.phone_ext ? ` ${formData.phone_ext}` : ""}
                </p>
              )}
              {formData.office_location && (
                <p>
                  <strong>Oficina:</strong><br />
                  {formData.office_location.split("\n").map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </p>
              )}
              {formData.facebook_url && (
                <p>
                  <strong>Facebook:</strong><br />
                  <a href={formData.facebook_url} target="_blank" rel="noreferrer" className="cms-link">
                    {formData.facebook_url}
                  </a>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="cms-form-actions">
              <button type="submit" className="cms-btn" disabled={saving}>
                <FaSave />
                {saving ? "Guardando…" : "Guardar Cambios"}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
