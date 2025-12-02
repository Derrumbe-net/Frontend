import { useState, useEffect } from "react";
import "../styles/Publications_module.css";

import searchIcon from "../assets/search-icon-png-9.png";

// Local images
import publication1 from "../assets/publications/publication1.webp";
import pub1 from "../assets/publications/pub1.webp";
import pub2 from "../assets/publications/pub2.webp";
import pub3 from "../assets/publications/pub3.webp";
import pub4 from "../assets/publications/pub4.webp";
import pub5 from "../assets/publications/pub5.webp";
import pub6 from "../assets/publications/pub6.webp";
import pub7 from "../assets/publications/pub7.webp";
import pub8 from "../assets/publications/pub8.webp";
import pub9 from "../assets/publications/pub9.webp";
import pub10 from "../assets/publications/pub10.webp";
import pub11 from "../assets/publications/pub11.webp";
import pub12 from "../assets/publications/pub12.webp";
import pub13 from "../assets/publications/pub13.webp";
import pub14 from "../assets/publications/pub14.webp";
import pub15 from "../assets/publications/pub15.webp";
import pub16 from "../assets/publications/pub16.webp";
import pub17 from "../assets/publications/pub17.webp";
import pub18 from "../assets/publications/pub18.webp";
import pub19 from "../assets/publications/pub19.webp";

// Map backend publication_id to local images
const imageMap = {
  1: pub1,
  2: pub2,
  3: pub3,
  4: pub4,
  5: pub5,
  6: pub6,
  7: pub7,
  8: pub8,
  9: pub9,
  10: pub10,
  11: pub11,
  12: pub12, 
  13: pub13, 
  14: pub14,
  15: pub15,
  16: pub16,
  17: pub17,
  18: pub18,
  19: pub19,
}

function Publications() {
  const [publications, setPublications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch from backend
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        // const response = await fetch("http://localhost:8080/api/publications");
        const response = await fetch("https://derrumbe-test.derrumbe.net/api/publications");
        
        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

        const data = await response.json();

        const formattedData = data.map((item) => ({
          id: item.publication_id,
          title: item.title || "Publicación sin título",
          description: item.description || "",
          // override URL for publication 3 to open the poster image, TODO: THIS NEEDS TO CHANGE
          url:
            item.publication_id === 1
              ? publication1
              : item.publication_url || "#",
          image: imageMap[item.publication_id] || publication1,
        }));

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
      <h1 className="projects-title">Publicaciones</h1>
      <p className="projects-intro">
        Explore nuestra colección de publicaciones, resultado del trabajo académico y
        técnico de la oficina, enfocadas en la investigación y el entendimiento de los
        deslizamientos en Puerto Rico.
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
              Leer más →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Publications;
