import '../styles/LandslideReadyPR_Individuos_module.css';
import ecoLogo from '../assets/ECOEXPLORATORIO_LOGO.svg';
import coursePreview from '../assets/landslideready_module.webp';

function LandslideReadyPR_Individuos() {
  return (
    <div className="landslideReadyIndividuos">
      <h2 className="landslideReadyIndividuos__header">LandslideReady para Individuos</h2>

      <div className="landslideReadyIndividuos__content">
        <div className="landslideReadyIndividuos__text">
          <p>
            El Ecoexploratorio Instituto de Resiliencia cuenta con unos módulos gratuitos con los cuales podrán aprender sobre deslizamientos de tierra. Estos módulos incluyen enseñanzas tales como qué son deslizamientos de tierra y cómo se pueden mitigar.
          </p>
          <p>
            Este módulo está bajo el nombre de LANDS101: LandslideReady/Deslizamientos de tierra en P.R. Estos módulos cuentan como 4 horas de contacto verde y el curso tiene una duración promedio de 5 horas en total.
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
        Accede los Cursos
      </a>

      <h3 className="landslideReadyIndividuos__label">
        Una vez que accedas a los módulos, la página se verá de esta manera:
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
