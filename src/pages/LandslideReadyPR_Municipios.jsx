import '../styles/LandslideReadyPR_Municipios_module.css';
import map from '../assets/municipality_map.webp';
import cycle from '../assets/landslideready_cycle.webp';
import groupPics from '../assets/landslideready_pictures.webp';

function LandslideReadyPR_Municipios() {
  return (
    <section className="landslideReady">
      <div className="landslideReady__municipios-section">
        <div className="landslideReady__municipios-left">
          <h2>LandslideReady para Municipios</h2>
          <p>
            LandslideReady es un programa de reconocimiento municipal organizado por la Oficina de Mitigación de Riesgos de Deslizamientos de Tierra de Puerto Rico.
          </p>
          <p>
            Trabajando con colaboradores de oficinas de emergencias municipales, nuestro objetivo es aumentar las actividades de preparación, mitigación y recuperación relacionadas con los peligros de deslizamientos de tierra.
          </p>

          <h3 className="landslideReady__subheader">
            Mapa de Municipios LandslideReady<br />
            <strong>(Actualizado en Marzo 4, 2025)</strong>
          </h3>
          <img src={map} alt="Mapa de municipios LandslideReady" className="landslideReady__map" />
          <p className="landslideReady__map-note">
            Si eres manejador de emergencia del municipio, estás interesado en el proyecto y quieres saber más, comunícate con nosotros.
          </p>

          <h3 className="landslideReady__subheader">Ciclo de LandslideReady</h3>
          <img src={cycle} alt="Ciclo LandslideReady" className="landslideReady__cycle" />
        </div>

        <div className="landslideReady__municipios-right">
          <img src={groupPics} alt="Talleres comunitarios" className="landslideReady__group-pics" />
        </div>
      </div>
    </section>
  );
}

export default LandslideReadyPR_Municipios;
