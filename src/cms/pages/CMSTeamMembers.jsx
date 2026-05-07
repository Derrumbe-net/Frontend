import { useState, useEffect } from "react";
import { 
  FaEdit, 
  FaPlus, 
  FaTrash, 
  FaChevronLeft, 
  FaChevronRight, 
  FaDownload, 
  FaSort, 
  FaSortUp, 
  FaSortDown 
} from "react-icons/fa";
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
  
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const itemsPerPage = 8;

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const [facRes, stuRes] = await Promise.all([
        fetch(`${API_URL}/faculty-members`),
        fetch(`${API_URL}/student-members`)
      ]);
      
      const facData = await facRes.json();
      const stuData = await stuRes.json();

      const normalizedFac = (facData || []).map(f => ({
        ...f,
        member_type: 'faculty',
        faculty_role: f.faculty_role,
        id: f.faculty_member_id || f.id
      }));

      const normalizedStu = (stuData || []).map(s => ({
        ...s,
        member_type: s.student_type,
        id: s.student_member_id || s.id
      }));

      const combined = [...normalizedFac, ...normalizedStu];
      setMembers(combined);
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  const handleDelete = async (member) => {
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
      const id = member.id || member.member_id;
      
      const isFaculty = member.member_type === "faculty";
      const endpoint = isFaculty ? `faculty-members/${id}` : `student-members/item/${id}`;

      const res = await fetch(`${API_URL}/${endpoint}`, {
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

  const sorted = [...filtered].sort((a, b) => {
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

  const totalPages  = Math.ceil(sorted.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const paginated   = sorted.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
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

  const exportToCSV = () => {
    const headers = ["ID", "Nombre", "Tipo", "Rol", "Email", "Teléfono", "Extensión", "LinkedIn"];
    
    const rows = sorted.map(m => {
      return [
        m.id || m.faculty_member_id || m.student_member_id || "",
        `"${m.name || ""}"`,
        TYPE_LABELS[m.member_type] || m.member_type || "",
        `"${m.faculty_role || ""}"`,
        `"${m.email || ""}"`,
        `"${m.phone || ""}"`,
        `"${m.extension || m.phone_ext || ""}"`,
        `"${m.linkedin_url || ""}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `equipo_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="cms-btn cms-btn-secondary" onClick={exportToCSV} title="Exportar vista actual">
              <FaDownload /> Exportar CSV
            </button>
            <button className="cms-btn" onClick={() => handleOpenForm()}>
              <FaPlus /> Añadir Miembro
            </button>
          </div>
        )}
      </div>

      {!showForm ? (
        <div className="cms-card">
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
                  <th 
                    style={{ cursor: "pointer", userSelect: "none" }} 
                    onClick={() => handleSort("name")}
                  >
                    Nombre {getSortIcon("name")}
                  </th>
                  <th 
                    style={{ cursor: "pointer", userSelect: "none" }} 
                    onClick={() => handleSort("member_type")}
                  >
                    Rol / Tipo {getSortIcon("member_type")}
                  </th>
                  <th>Contacto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#a0aec0", padding: "32px" }}>
                      No hay miembros en esta categoría.
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => {
                    const id = m.id;
                    const endpoint = m.member_type === "faculty" ? "faculty-members" : "student-members";

                    return (
                      <tr key={`${m.member_type}-${id}`}>
                        <td>
                          {m.image_url || m.image_path ? (
                            <img
                              src={`${API_URL}/${endpoint}/item/${id}/image?t=${new Date().getTime()}`}
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
                            {TYPE_LABELS[m.member_type] || m.member_type}
                          </span>
                          <br />
                          <span style={{ fontSize: "0.8rem", color: "#718096" }}>{m.faculty_role}</span>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "#4b4b4b" }}>
                          {m.email   && <div>{m.email}</div>}
                          {m.phone   && <div>{m.phone} {m.extension || m.phone_ext}</div>}
                          {m.linkedin_url && (
                            <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="cms-link">
                              LinkedIn ↗
                            </a>
                          )}
                        </td>
                        <td>
                          <button className="cms-icon-btn" onClick={() => handleOpenForm(m)} title="Editar">
                            <FaEdit />
                          </button>
                          <button
                            className="cms-icon-btn cms-delete-btn"
                            onClick={() => handleDelete(m)}
                            title="Eliminar"
                          >
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
  const memberId = member?.id || member?.member_id;

  const [formData, setFormData] = useState({
    name:          member?.name          ?? "",
    faculty_role:  member?.faculty_role  ?? "",
    email:         member?.email         ?? "",
    phone:         member?.phone         ?? "",
    phone_ext:     member?.phone_ext     ?? member?.extension ?? "",
    linkedin_url:  member?.linkedin_url  ?? "",
    member_type:   member?.member_type   ?? "faculty",
    imageFile:     null,
  });

  const endpointForPreview = member?.member_type === "faculty" ? "faculty-members" : "student-members";

  const [previewUrl, setPreviewUrl] = useState(
    (member?.image_url || member?.image_path) ? `${API_URL}/${endpointForPreview}/item/${memberId}/image?t=${new Date().getTime()}` : null
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
    if (formData.member_type === 'faculty' && !formData.faculty_role.trim()) {
      Swal.fire("Error", "El rol es obligatorio para la facultad.", "warning"); return false;
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

    const isFaculty = formData.member_type === "faculty";
    const endpoint = isFaculty ? "faculty-members" : "student-members";
    const method = isEdit ? "PUT" : "POST";
    
    let url = "";
    if (isEdit) {
      url = isFaculty ? `${API_URL}/${endpoint}/${memberId}` : `${API_URL}/${endpoint}/item/${memberId}`;
    } else {
      url = `${API_URL}/${endpoint}`; 
    }

    // ====================================================
    // FIX: Perfect Data Mapping for Go Backend DTOs
    // ====================================================
    let bodyData = {};
    if (isFaculty) {
        bodyData = {
            name: formData.name,
            faculty_role: formData.faculty_role,
            email: formData.email,
            phone: formData.phone,
            extension: formData.phone_ext, // Maps phone_ext to Go's 'extension'
            linkedin_url: formData.linkedin_url,
            image_path: member?.image_path || "" // Protects existing image path from wiping!
        };
    } else {
        bodyData = {
            name: formData.name,
            student_type: formData.member_type, // Maps member_type to Go's 'student_type'
            image_path: member?.image_path || "" // Protects existing image path from wiping!
        };
    }

    try {
      const token = localStorage.getItem("cmsAdmin");
      if (!token) { Swal.fire("Error", "Sesión expirada.", "error"); return; }

      // 1. Submit JSON Details
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) { 
        const errData = await res.json();
        Swal.fire("Error", `No se pudo guardar: ${errData.error || res.statusText}`, "error"); 
        return; 
      }

      const result  = await res.json();
      const finalMemberId = isEdit ? memberId : (result.id || result.member_id || result.faculty_member_id || result.student_member_id);

      // 2. Upload Image if exists
      if (formData.imageFile && finalMemberId) {
        const imgForm = new FormData();
        imgForm.append("image", formData.imageFile);
        
        const imgUploadUrl = isFaculty
          ? `${API_URL}/${endpoint}/${finalMemberId}/image`
          : `${API_URL}/${endpoint}/item/${finalMemberId}/image`;

        const imgRes = await fetch(imgUploadUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: imgForm,
        });

        if (!imgRes.ok) {
            Swal.fire("Aviso", "Los datos se guardaron, pero hubo un error subiendo la imagen.", "warning");
        }
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

        <div className="cms-form-group span-2">
          <label>Tipo de Miembro <span className="required-asterisk">*</span></label>
          <select
            className="cms-input"
            name="member_type"
            value={formData.member_type}
            onChange={handleChange}
            disabled={isEdit}
          >
            <option value="faculty">Facultad</option>
            <option value="graduate">Estudiante Graduado/a</option>
            <option value="undergraduate">Estudiante Subgraduado/a</option>
          </select>
          {isEdit && <span className="cms-input-hint">El tipo de miembro no puede ser cambiado una vez creado.</span>}
        </div>

        <div className="cms-form-group span-2">
          <label>Rol / Posición {formData.member_type === 'faculty' && <span className="required-asterisk">*</span>}</label>
          <input
            className="cms-input"
            name="faculty_role"
            value={formData.faculty_role}
            onChange={handleChange}
            placeholder="Ej. Coordinator and PI"
            disabled={formData.member_type !== 'faculty'}
          />
        </div>

        <div className="cms-form-section-title">Contacto (opcional para no-Facultad)</div>

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