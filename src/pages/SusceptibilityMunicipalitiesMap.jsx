import { useState } from "react";
import InteractiveMunicipalityMap from "../components/InteractiveMunicipalityMap";
import "../styles/SusceptibilityMunicipalitiesMap.css";
import municipalityPng from "../components/MunicipalityPNGs";
import municipalityPdf from "../components/MunicipalityPDFs"; 
import { SITE_CONFIG } from "@config";

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
            <h1 className="municipality-title">{SITE_CONFIG.SUSCEPTIBILITY.MUNICIPAL_TITLE}</h1>

            <p className="municipality-intro">
                {SITE_CONFIG.SUSCEPTIBILITY.MUNICIPAL_INTRO_1}
            </p>

            <p className="municipality-intro">
                {SITE_CONFIG.SUSCEPTIBILITY.MUNICIPAL_INTRO_2}
            </p>

            <div className="municipality-list-wrapper">
                <h2 className="municipality-list-title">{SITE_CONFIG.SUSCEPTIBILITY.SELECT_MUNICIPALITY}</h2>

                <select
                    className="municipality-dropdown"
                    onChange={(e) => {
                        if (e.target.value !== "") {
                            handleMunicipalitySelect(e.target.value);
                        }
                    }}
                    value={activeMunicipality ? activeMunicipality.name : ""}
                >
                    <option value="">{SITE_CONFIG.SUSCEPTIBILITY.DROPDOWN_DEFAULT}</option>
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
                    <div className="no-preview">{SITE_CONFIG.SUSCEPTIBILITY.MODAL_NO_PREVIEW}</div>
                )}

                <div className="modal-buttons">
                    {pdfFile ? (
                        <>
                            <a
                                href={pdfFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="modal-button"
                            >
                                {SITE_CONFIG.SUSCEPTIBILITY.MODAL_BTN_PDF}
                            </a>
                        </>
                    ) : (
                        <span className="error-text">{SITE_CONFIG.SUSCEPTIBILITY.MODAL_PDF_ERROR}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SusceptibilityMunicipalitiesMap;
