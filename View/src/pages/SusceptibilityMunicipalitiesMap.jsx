import { useState } from "react";
import InteractiveMunicipalityMap from "../components/InteractiveMunicipalityMap";
import "../styles/SusceptibilityMunicipalitiesMap.css";
import municipalityPng from "../components/MunicipalityPNGs";
import municipalityPdf from "../components/MunicipalityPDFs"; 

function SusceptibilityMunicipalitiesMap() {
    const [activeMunicipality, setActiveMunicipality] = useState(null);

    const handleMunicipalitySelect = (municipalityData) => {
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
                y las opciones de **descargar el archivo PDF** o verlo en pantalla completa.
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
                            handleMunicipalitySelect(e.target.value);
                        }
                    }}
                    value={activeMunicipality ? activeMunicipality.name : ""}
                >
                    <option value="">-- Escoger Municipio --</option>
                    {Object.keys(municipalityPdf).sort().map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="municipality-map-wrapper">
                <InteractiveMunicipalityMap onMunicipalityClick={handleMunicipalitySelect} />
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

function MunicipalityModal({ municipality, onClose }) {
    const name = municipality.name;
    
    const imagePreview = municipalityPng[name];
    const pdfFile = municipalityPdf[name];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h2>{name}</h2>

                {imagePreview ? (
                    <img src={imagePreview} alt={`Vista previa de ${name}`} className="modal-image" />
                ) : (
                    <div className="no-preview">Vista previa no disponible</div>
                )}

                <div className="modal-buttons">
                    {pdfFile ? (
                        <a
                            href={pdfFile}
                            download={`${name}_UPRM_SLIDES.pdf`}
                            className="modal-button"
                        >
                            Descargar PDF
                        </a>
                    ) : (
                        <span className="error-text">PDF no disponible</span>
                    )}

                    {pdfFile && (
                        <a
                            href={pdfFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-button secondary"
                        >
                            Ver PDF en pantalla completa
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
export default SusceptibilityMunicipalitiesMap;