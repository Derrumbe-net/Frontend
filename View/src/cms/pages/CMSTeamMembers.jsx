import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../cms/styles/CMSTeamMembers.css";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  faculty:       "Facultad",
  graduate:      "Estudiante Graduado/a",
  undergraduate: "Estudiante Subgraduado/a",
};

export default function CMSTeamMembers() {
  const [members, setMembers]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res  = await fetch(`${API_URL}/team-members`);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar miembro?",
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
      const res = await fetch(`${API_URL}/team-members/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { Swal.fire("Error", "No se pudo eliminar.", "error"); return; }
      Swal.fire("Eliminado", "El miembro fue eliminado.", "success");
      fetchMembers();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo conectar al servidor.", "error");
    }
  };

  const handleOpenForm = (member = null) => {
    setEditMember(member);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditMember(null);
  };

  const filtered = filterType === "all"
    ? members
    : members.filter((m) => m.member_type === filterType);

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const paginated   = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filter changes
  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  return (
    <div className="cms-team-wrapper">
      <div className="cms-page-header">
        <div className="cms-header-content">
          <span className="cms-accent-line"></span>
          <h1 className="cms-page-title">Gestión del Equipo</h1>
          <p className="cms-page-subtitle">
            Administre los miembros de la facultad y los estudiantes que aparecen en la página "Sobre Nosotros".
          </p>
        </div>
        {!showForm && (
          <button className="cms-btn" onClick={() => handleOpenForm()}>
            <FaPlus /> Añadir Miembro
          </button>
        )}
      </div>

      {!showForm ? (
        <div className="cms-card">
          {/* Filter tabs */}
          <div className="cms-filter-tabs">
            {["all", "faculty", "graduate", "undergraduate"].map((type) => (
              <button
                key={type}
                className={`cms-filter-tab ${filterType === type ? "active" : ""}`}
                onClick={() => handleFilterChange(type)}
              >
                {type === "all" ? "Todos" : TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <div className="cms-table-container">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Rol / Tipo</th>
                  <th>Contacto</th>
                  <th>Orden</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#a0aec0", padding: "32px" }}>
                      No hay miembros en esta categoría.
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => (
                    <tr key={m.member_id}>
                      <td>
                        {m.image_url ? (
                          <img
                            src={`${API_URL}/team-members/${m.member_id}/image`}
                            alt={m.name}
                            className="cms-thumb cms-thumb--circle"
                          />
                        ) : (
                          <span className="no-img">Sin foto</span>
                        )}
                      </td>
                      <td style={{ fontWeight: "600" }}>{m.name}</td>
                      <td>
                        <span className={`cms-badge cms-badge--${m.member_type}`}>
                          {TYPE_LABELS[m.member_type]}
                        </span>
                        <br />
                        <span style={{ fontSize: "0.8rem", color: "#718096" }}>{m.role}</span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#4b4b4b" }}>
                        {m.email   && <div>{m.email}</div>}
                        {m.phone   && <div>{m.phone} {m.phone_ext}</div>}
                        {m.linkedin_url && (
                          <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="cms-link">
                            LinkedIn ↗
                          </a>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>{m.display_order}</td>
                      <td>
                        <button className="cms-icon-btn" onClick={() => handleOpenForm(m)} title="Editar">
                          <FaEdit />
                        </button>
                        <button
                          className="cms-icon-btn cms-delete-btn"
                          onClick={() => handleDelete(m.member_id)}
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
          <MemberForm
            member={editMember}
            onClose={handleCloseForm}
            refreshMembers={fetchMembers}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Form component
// ─────────────────────────────────────────────
function MemberForm({ member, onClose, refreshMembers }) {
  const isEdit = !!member;

  const [formData, setFormData] = useState({
    name:          member?.name          ?? "",
    role:          member?.role          ?? "",
    email:         member?.email         ?? "",
    phone:         member?.phone         ?? "",
    phone_ext:     member?.phone_ext     ?? "",
    linkedin_url:  member?.linkedin_url  ?? "",
    member_type:   member?.member_type   ?? "faculty",
    display_order: member?.display_order ?? 0,
    imageFile:     null,
  });

  const [previewUrl, setPreviewUrl] = useState(
    member?.image_url ? `${API_URL}/team-members/${member.member_id}/image` : null
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
      Swal.fire("Error", "El nombre es obligatorio.", "warning"); return false;
    }
    if (!formData.role.trim()) {
      Swal.fire("Error", "El rol es obligatorio.", "warning"); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const confirmed = await Swal.fire({
      title: isEdit ? "Guardar cambios" : "Crear Miembro",
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
      ? `${API_URL}/team-members/${member.member_id}`
      : `${API_URL}/team-members`;

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

      if (!res.ok) { Swal.fire("Error", "No se pudo guardar el miembro.", "error"); return; }

      const result  = await res.json();
      const memberId = isEdit ? member.member_id : result.member_id;

      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append("image", imageFile);
        await fetch(`${API_URL}/team-members/${memberId}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: imgForm,
        });
      }

      Swal.fire("Éxito", "Operación realizada correctamente.", "success");
      refreshMembers();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "#13241e" }}>
        {isEdit ? "Editar Miembro" : "Nuevo Miembro"}
      </h2>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Complete los datos del miembro del equipo que aparecerá en la página "Sobre Nosotros".
      </p>

      <div className="cms-form-grid">
        <div className="cms-form-section-title">Información Personal</div>

        {/* Name */}
        <div className="cms-form-group span-2">
          <label>Nombre completo <span className="required-asterisk">*</span></label>
          <input
            className="cms-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej. Stephen Hughes"
          />
        </div>

        {/* Role */}
        <div className="cms-form-group span-2">
          <label>Rol / Posición <span className="required-asterisk">*</span></label>
          <input
            className="cms-input"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Ej. Coordinator and PI"
          />
        </div>

        {/* Type */}
        <div className="cms-form-group span-2">
          <label>Tipo de Miembro <span className="required-asterisk">*</span></label>
          <select
            className="cms-input"
            name="member_type"
            value={formData.member_type}
            onChange={handleChange}
          >
            <option value="faculty">Facultad</option>
            <option value="graduate">Estudiante Graduado/a</option>
            <option value="undergraduate">Estudiante Subgraduado/a</option>
          </select>
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

        <div className="cms-form-section-title">Contacto (opcional para no-Facultad)</div>

        {/* Email */}
        <div className="cms-form-group span-2">
          <label>Correo electrónico</label>
          <input
            className="cms-input"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ej. nombre@upr.edu"
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
            placeholder="Ej. (787) 832-4040"
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
            placeholder="Ej. Ext. 6844"
          />
        </div>

        {/* LinkedIn */}
        <div className="cms-form-group span-2">
          <label>Perfil de LinkedIn</label>
          <input
            className="cms-input"
            name="linkedin_url"
            value={formData.linkedin_url}
            onChange={handleChange}
            placeholder="https://www.linkedin.com/in/..."
          />
        </div>

        <div className="cms-form-section-title">Foto de Perfil</div>

        <div className="cms-form-group span-3">
          {previewUrl && (
            <div className="cms-image-preview-container">
              <p style={{ marginBottom: "10px", fontSize: "0.8rem", fontWeight: "600", color: "#718096" }}>
                Vista Previa:
              </p>
              <img
                src={previewUrl}
                alt="Vista previa"
                className="cms-form-preview cms-form-preview--circle"
              />
            </div>
          )}
          <label>Subir Foto</label>
          <input className="cms-input" type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div className="cms-form-actions">
          <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="cms-btn">
            {isEdit ? "Guardar Cambios" : "Crear Miembro"}
          </button>
        </div>
      </div>
    </form>
  );
}
