import '../styles/LandslideReadyPR_Individuos_module.css';
import ecoLogo from '../assets/ECOEXPLORATORIO_LOGO.svg';
import coursePreview from '../assets/landslideready_module.webp';
import { SITE_CONFIG } from "@config";

function LandslideReadyPR_Individuos() {
  return (
    <div className="landslideReadyIndividuos">
      <h2 className="landslideReadyIndividuos__header">{SITE_CONFIG.LANDSLIDE_READY.INDIVIDUOS_TITLE}</h2>

      <div className="landslideReadyIndividuos__content">
        <div className="landslideReadyIndividuos__text">
          <p>
            {SITE_CONFIG.LANDSLIDE_READY.INDIVIDUOS_DESC_1}
          </p>
          <p>
            {SITE_CONFIG.LANDSLIDE_READY.INDIVIDUOS_DESC_2}
          </p>
        </div>

        <div className="landslideReadyIndividuos__logo">
          <a href="https://ecoexploratorio.org/eri/cursos/" target="_blank" rel="noopener noreferrer">
            <img src={ecoLogo} alt="Ecoexploratorio Logo" />
          </a>
        </div>
      </div>

      <a
        className="landslideReadyIndividuos__button"
        href="https://ecoexploratorio.org/eri/cursos/#1742922273665-a07cced4-5bd4"
        target="_blank"
        rel="noopener noreferrer"
      >
        {SITE_CONFIG.LANDSLIDE_READY.INDIVIDUOS_BTN}
      </a>

      <h3 className="landslideReadyIndividuos__label">
        {SITE_CONFIG.LANDSLIDE_READY.INDIVIDUOS_LABEL}
      </h3>
      <img
        src={coursePreview}
        alt="Vista previa del curso LandslideReady"
        className="landslideReadyIndividuos__image"
      />
    </div>
  );
}

export default LandslideReadyPR_Individuos;
