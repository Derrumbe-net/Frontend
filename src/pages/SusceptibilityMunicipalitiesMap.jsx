import { useState } from "react";
import InteractiveMunicipalityMap from "../components/InteractiveMunicipalityMap";
import "../styles/SusceptibilityMunicipalitiesMap.css";

// Assuming this path is correct and it exports an object of municipality image paths
import municipalityPng from "../components/MunicipalityPNGs";

function SusceptibilityMunicipalitiesMap() {
    const [activeMunicipality, setActiveMunicipality] = useState(null);

    // Function to handle selection from dropdown or map click
    const handleMunicipalitySelect = (municipalityData) => {
        // If it comes from the dropdown, it might just be the name string.
        // If it comes from the map, it will be the full object.
        if (typeof municipalityData === 'string') {
            setActiveMunicipality({ name: municipalityData });
        } else {
            setActiveMunicipality(municipalityData);
        }
    };

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
                            // FIX: Use the unified handler
                            handleMunicipalitySelect(e.target.value);
                        }
                    }}
                    // Optional: Set the selected value based on activeMunicipality state for visual consistency
                    value={activeMunicipality ? activeMunicipality.name : ""}
                >
                    <option value="">-- Escoger Municipio --</option>

                    {/* Sort the names for better user experience */}
                    {Object.keys(municipalityPng).sort().map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="municipality-map-wrapper">
                {/* FIX: Pass the setter function as a prop to the map */}
                <InteractiveMunicipalityMap onMunicipalityClick={handleMunicipalitySelect} />
            </div>

            {/* FIX: Render the modal here, controlled by the activeMunicipality state */}
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


// FIX: The MunicipalityModal component must be defined here or imported.
// Since it was defined at the end of the original file, we keep it here.
function MunicipalityModal({ municipality, onClose }) {
    const name = municipality.name;
    // The key in municipalityPng is assumed to be the name (e.g., "Mayagüez")
    const image = municipalityPng[name];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h2>{name}</h2>

                {image ? (
                    <img src={image} alt={`Mapa de ${name}`} className="modal-image" />
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