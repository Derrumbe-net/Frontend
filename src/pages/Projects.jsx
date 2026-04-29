import { useState, useEffect } from "react";
import "../styles/Projects_module.css";

import searchIcon from "../assets/search-icon-png-9.png";

// Local images
import placeholder from "../assets/placeholder.png";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const API_URL = `${import.meta.env.VITE_API_URL}`;
        // This matches your Go router: mux.HandleFunc("GET /projects", ...)
        const response = await fetch(`${API_URL}/projects`);

        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

        const data = await response.json();

        // Backend data + local images
        const formattedData = data.map((item) => {
          // Normalize ID just in case your Go API returns 'id' instead of 'project_id'
          const id = item.id || item.project_id; 

          return {
            id: id,
            title: item.title,
            start_year: item.start_year,
            end_year: item.end_year,
            status:
              item.project_status === "active"
                ? "present"
                : "past",
            description: item.description,
            // Updated to match the new route: /projects/item/{id}/image
            image: item.image_path
                        ? `${API_URL}/projects/${id}/image`
                        : placeholder,
          };
        });

        setProjects(formattedData);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ? true : p.status === filterStatus;
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="projects-page">
      <h1 className="projects-title">Proyectos</h1>
      <p className="projects-intro">
        Explore los proyectos de investigación y cooperación desarrollados por la Oficina
        de Mitigación ante Deslizamientos de Tierra de Puerto Rico. Estas iniciativas, en
        colaboración con agencias federales, universidades y comunidades, abarcan desde el
        análisis de riesgos y procesos geológicos hasta programas de participación
        ciudadana y adaptación climática.
      </p>
      <p className="projects-subintro">
        Su propósito es generar conocimiento científico, fortalecer la mitigación de
        deslizamientos y apoyar la resiliencia de Puerto Rico ante eventos extremos.
      </p>

      <div className="projects-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <img src={searchIcon} alt="Search" className="search-icon" />
        </div>

        <div className="filter-container">
          <select
            className="filter-dropdown"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los Proyectos</option>
            <option value="present">Proyectos Actuales</option>
            <option value="past">Proyectos Pasados</option>
          </select>
        </div>
      </div>

      <div className="projects-container">
        {filteredProjects.map((project) => (
          <div key={project.id} className="project-card">
            <img
              src={project.image}
              alt={project.title}
              className="project-image"
            />
            <h2 className="project-title">{project.title}</h2>
            <h3 className="project-years">
              {project.start_year}–{project.end_year}
            </h3>
            <p className="project-description">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
