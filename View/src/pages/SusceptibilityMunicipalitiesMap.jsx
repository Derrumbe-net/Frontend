import { useState } from "react";
import InteractiveMunicipalityMap from "../components/InteractiveMunicipalityMap";
import "../styles/SusceptibilityMunicipalitiesMap.css";

import municipalityPng from "../components/MunicipalityPNGs";

function SusceptibilityMunicipalitiesMap() {
  const [activeMunicipality, setActiveMunicipality] = useState(null);

  return (
    <div className="municipality-page">
      
      <h1 className="municipality-title">Mapas Municipales</h1>

      <p className="municipality-intro">
        Hemos preparado un mapa interactivo de susceptibilidad a deslizamientos de tierra por municipios. 
        Para explorar la información, puede seleccionar un municipio directamente en el mapa o buscarlo en el menú desplegable (dropdown).
        Al hacer “clic” sobre municipio, se abrirá una ventana con una vista previa del mapa municipal 
        y las opciones de descargar la imagen o verla en pantalla completa.
      </p>

      <p className="municipality-intro">
        Los archivos pueden tardar en cargar debido a su tamaño. 
        Si alguna imagen no aparece o algún enlace no funciona correctamente, 
        favor de comunicarse con nosotros: <strong>slidespr@uprm.edu</strong>.
      </p>

      <div className="municipality-list-wrapper">
        <h2 className="municipality-list-title">Seleccione un Municipio</h2>

        <select
          className="municipality-dropdown"
          onChange={(e) => {
            if (e.target.value !== "") {
              setActiveMunicipality({ name: e.target.value });
            }
          }}
        >
          <option value="">-- Escoger Municipio --</option>

          {Object.keys(municipalityPng).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="municipality-map-wrapper">
        <InteractiveMunicipalityMap />
      </div>
      
      {activeMunicipality && (
        <MunicipalityModal
          municipality={activeMunicipality}
          onClose={() => setActiveMunicipality(null)}
        />
      )}

    </div>
  );
}

export default SusceptibilityMunicipalitiesMap;


function MunicipalityModal({ municipality, onClose }) {
  const name = municipality.name;
  const image = municipalityPng[name];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>{name}</h2>

        {image ? (
          <img src={image} alt={name} className="modal-image" />
        ) : (
          <p>No preview available</p>
        )}

        <div className="modal-buttons">
          {image && (
            <a 
              href={image}
              download={`${name}.png`}
              className="modal-button"
            >
              Descargar PNG
            </a>
          )}

          {image && (
            <a
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-button secondary"
            >
              Ver en pantalla completa
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
