import { useState, useEffect } from "react";
import "../styles/Publications_module.css";

import searchIcon from "../assets/search-icon-png-9.png";

// Local images
import publication1 from "../assets/publications/publication1.webp";
import placeholder from "../assets/placeholder.png";
import { SITE_CONFIG } from "@config";

function Publications() {
  const [publications, setPublications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch from backend
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const API_URL = `${import.meta.env.VITE_API_URL}`;
        // This matches your Go router: mux.HandleFunc("GET /publications", ...)
        const response = await fetch(`${API_URL}/publications`);
        
        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

        const data = await response.json();

        const formattedData = data.map((item) => {
          // Normalize ID just in case your Go API returns 'id' instead of 'publication_id'
          const id = item.id || item.publication_id;

          return {
            id: id,
            title: item.title || "Publicación sin título",
            description: item.description || "",
            // override URL for publication 1 to open the poster image, TODO: THIS NEEDS TO CHANGE
            url:
              id === 1
                ? publication1
                : item.publication_url || "#",
            // Updated to match the new route: /publications/item/{id}/image
            image: item.image_path
              ? `${API_URL}/publications/${id}/image`
              : placeholder,
          };
        });

        setPublications(formattedData);
      } catch (err) {
        console.error("Error fetching publications:", err);
      }
    };

    fetchPublications();
  }, []);

  const filteredPublications = publications.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="projects-page">
      <h1 className="projects-title">{SITE_CONFIG.PUBLICATIONS.TITLE}</h1>
      <p className="projects-intro">
        {SITE_CONFIG.PUBLICATIONS.INTRO}
      </p>

      <div className="projects-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder={SITE_CONFIG.PUBLICATIONS.SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <img src={searchIcon} alt="Search" className="search-icon" />
        </div>
      </div>

      <div className="publications-container">
        {filteredPublications.map((pub) => (
          <div key={pub.id} className="publication-card">
            <img src={pub.image} alt={pub.title} className="publication-image" />
            <h3 className="publication-title">{pub.title}</h3>
            <p className="publication-description">{pub.description}</p>
            <a
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="publication-button"
            >
              {SITE_CONFIG.PUBLICATIONS.READ_MORE_BTN}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Publications;
