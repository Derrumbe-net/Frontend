import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import "../../cms/styles/CMSProjects.css";

import Swal from "sweetalert2";

export default function CMSProjects() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, startIndex + itemsPerPage);

  const API_URL = `${import.meta.env.VITE_API_URL}`;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleOpenForm = (project = null) => {
    setEditProject(project);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditProject(null);
  };

  return (
    <div className="cms-projects">
      <h1>Proyectos</h1>
      <table className="cms-table">
        <thead>
          <tr>
            <th>Editar</th>
            <th>Título</th>
            <th>Año de Inicio</th>
            <th>Año de Fin</th>
            <th>Estatus</th>
            <th>Descripción</th>
            <th>Imagen</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProjects.map((p) => (
            <tr key={p.project_id}>
              <td>
                <button className="edit-btn" onClick={() => handleOpenForm(p)}>
                  <FaEdit />
                </button>
              </td>
              <td>{p.title}</td>
              <td>{p.start_year}</td>
              <td>{p.end_year}</td>
              <td>{p.project_status}</td>
              <td>{p.description?.slice(0, 40)}...</td>
              <td>
                {p.image_url ? (
                  <img
                    src={`${API_URL}/projects/${p.project_id}/image`}
                    alt="Project"
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
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ◀
        </button>

        <span>Página {currentPage} de {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          ▶
        </button>
      </div>

      <div className="add-btn-container">
        <button className="add-btn-text" onClick={() => handleOpenForm()}>
          Añadir Proyecto
        </button>
      </div>

      {showForm && (
        <div className="inline-form-container">
          <ProjectForm
            project={editProject}
            onClose={handleCloseForm}
            refreshProjects={fetchProjects}
          />
        </div>
      )}
    </div>
  );
}

function ProjectForm({ project, onClose, refreshProjects }) {
  const [formData, setFormData] = useState({
    title: project?.title || "",
    start_year: project?.start_year || "",
    end_year: project?.end_year || "",
    project_status: project?.project_status || "active",
    description: project?.description || "",
    imageFile: null,
  });

  const API_URL = `${import.meta.env.VITE_API_URL}`;

  const isEdit = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        start_year: project.start_year,
        end_year: project.end_year,
        project_status: project.project_status,
        description: project.description,
        imageFile: null,
      });
    } else {
      setFormData({
        title: "",
        start_year: "",
        end_year: "",
        project_status: "active",
        description: "",
      });
    }
  }, [project]);

  const validate = () => {
    if (!formData.title.trim()) {
      Swal.fire("Campo requerido", "El título es obligatorio.", "warning");
      return false;
    }
    if (!formData.start_year || !formData.end_year) {
      Swal.fire("Datos incompletos", "Debe ingresar los años.", "warning");
      return false;
    }
    if (formData.start_year < 1900 || formData.start_year > 2100) {
      Swal.fire("Año inválido", "El año de inicio no es válido.", "warning");
      return false;
    }
    if (formData.end_year < formData.start_year) {
      Swal.fire(
        "Rango inválido",
        "El año de fin no puede ser menor al de inicio.",
        "warning"
      );
      return false;
    }
    if (formData.description.trim().length < 10) {
      Swal.fire(
        "Descripción muy corta",
        "Debe incluir al menos 10 caracteres.",
        "warning"
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const confirm = await Swal.fire({
      title: isEdit ? "Guardar cambios" : "Añadir Proyecto",
      text: isEdit
        ? "¿Desea confirmar los cambios realizados?"
        : "¿Desea añadir este nuevo proyecto?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return; 

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit
      ? `${API_URL}/projects/${project.project_id}`  // CHANGE
      : `${API_URL}/projects`;                       // CHANGE

    try {
      const token = localStorage.getItem("cmsAdmin");

      if (!token) {
        Swal.fire("Error", "No se encontró token. Inicie sesión nuevamente.", "error");
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          admin_id: 1, // TODO: replace with real admin id
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        Swal.fire("Error", msg || "Ocurrió un error al guardar.", "error");
        return;
      }

      const result = await response.json();
      const projId = isEdit ? project.project_id : result.project_id;
      
      if (formData.imageFile) {
        const token = localStorage.getItem("cmsAdmin");

        const imageForm = new FormData();
        imageForm.append("image", formData.imageFile);

        await fetch(`${API_URL}/projects/${projId}/image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: imageForm,
        });
      }

      refreshProjects();
      onClose();

      Swal.fire(
        "Éxito",
        isEdit ? "Proyecto actualizado correctamente" : "Proyecto creado correctamente",
        "success"
      );

      refreshProjects();
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire("Error", "No se pudo conectar al servidor.", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <form className="cms-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? "Editar Proyecto" : "Añadir Proyecto"}</h2>

      {isEdit && (
        <div className="current-image">
          <p>Imagen actual:</p>

          {project?.image_url ? (
            <img
              src={`${API_URL}/projects/${project.project_id}/image`}
              alt="Current Project"
              className="image-preview"
            />
          ) : (
            <p className="no-img">No hay imagen disponible</p>
          )}
        </div>
      )}

      <label>Título:</label>
      <input name="title" value={formData.title} onChange={handleChange} required />

      <label>Año de Inicio:</label>
      <input
        type="number"
        name="start_year"
        value={formData.start_year}
        onChange={handleChange}
        required
      />

      <label>Año de Fin:</label>
      <input
        type="number"
        name="end_year"
        value={formData.end_year}
        onChange={handleChange}
        required
      />

      <label>Estatus:</label>
      <select
        name="project_status"
        value={formData.project_status}
        onChange={handleChange}
      >
        <option value="completed">Proyecto Pasado</option>
        <option value="active">Proyecto Actual</option>
      </select>

      <label>Descripción:</label>
      <textarea
        name="description"
        rows="4"
        value={formData.description}
        onChange={handleChange}
      />

      <label>Subir Imagen (opcional):</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFormData({ ...formData, imageFile: e.target.files[0] })
        }
      />

      <div className="cms-form__actions">
        <button type="button" className="cancel-btn" onClick={onClose}>
          Cancelar
        </button>

        <button type="submit" className="submit-btn">
          {isEdit ? "Guardar Cambios" : "Añadir Proyecto"}
        </button>
      </div>
    </form>
  );
}
