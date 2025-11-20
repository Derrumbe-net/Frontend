import "../styles/Home_module.css";
import { Link } from "react-router-dom";
import heroImage from '../assets/landing_page_background.webp';
import mapPreview from '../assets/interactive_map_preview.webp';
import landslidePhoto from '../assets/landslide_landing_page.webp';
import newsImage from '../assets/alturas_de_belgica.gif';
import officeImage from '../assets/office_door.webp';
import uprmLogo from "../assets/UPRM_LOGO.png";
import logo from '../assets/PRLHMO_LOGO.svg';
import CCFLHLogo from "../assets/CCFLH_LOGO.svg";


function Home() {
  return (
    <div className="landing">

      {/* HERO SECTION */}
      <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero__overlay">
          <div className="hero__logos">
            <img src={logo} alt="PRLHMO Logo" className="hero__logo hero__logo--left" />
            <h1 className="hero__title">
              Oficina de Mitigación ante <br />
              Deslizamientos de Tierra en Puerto Rico
            </h1>
            <img src={uprmLogo} alt="UPRM Logo" className="hero__logo hero__logo--right" />
          </div>

          <div className="hero__buttons">
            <a href="#contact" className="btn btn--contact">Contáctenos</a>
            <Link to="/solicitud" className="btn btn--outline">Solicitud de Charla</Link>
          </div>
        </div>
      </section>

      {/* SECTION: MAPA */}
      <section className="landing__map"> 

        <div className="landing__map-text">
          <h2>Explora nuestro Mapa Interactivo de Monitoreo de Deslizamientos</h2>
          <p>
            Herramienta interactiva que muestra, en tiempo real, datos de saturación del suelo, 
            susceptibilidad a deslizamientos y estimaciones de precipitación en Puerto Rico.
          </p>
          <a className="landing__map-link">
            ¡Haz clic en el mapa!
          </a>
        </div>

        <img
          className="landing__map-image"
          src={mapPreview}
          alt="Mapa interactivo"
          loading="lazy"
        />
      </section> 


      {/* SECTION: REPORTAR */}
      <section className="landing__report">
        <div className="landing__report-text">
          <h2>Reporta un Deslizamiento</h2>
          <p>
            Ayúdanos a mejorar el monitoreo reportando deslizamientos que observes
            en tu área. Tu apoyo puede brindar ayuda para la comunidad.
          </p>
          <a href="/reportar" className="btn--black">
            ¡Haz tu Reporte!
          </a>
        </div>
        <div className="landing__report-image-wrapper">
          <img
            src={landslidePhoto}
            alt="Ejemplo de deslizamiento"
            className="landing__report-image"
            loading="lazy"
          />
        </div>
      </section>


      {/* SECTION: NOTICIA */}
      <section className="landing__featured-news">
        <div className="landing__featured-news-image-wrapper">
          <img
            className="landing__featured-news-image"
            src={newsImage}
            alt="Deslizamiento en Alturas de Bélgica"
            loading="lazy"
          />
        </div>

        <div className="landing__featured-news-text">
          <h2>Noticia Destacada:</h2>
          <h3>Alturas de Bélgica, Guánica, PR</h3>
          <p className="landing__featured-news-date">Junio 2024 - Septiembre 2024</p>
          <p>
            Vea a continuación el lapso de tiempo más reciente del deslizamiento de tierra en Alturas de Bélgica, Guánica, PR.
          </p>
          <p>
            This project is an effort of the Puerto Rico Landslide Hazard Mitigation Office and the NSF Collaborative Center for Landslide Geohazards.
          </p>
          <img
            className="landing__featured-news-logo"
            src={CCFLHLogo}
            alt="Collaborative Center for Landslide Geohazards"
          />
        </div>
      </section>


      {/* SECTION: CONTACTO */}
      <section id="contact" className="landing__contact">
        <div className="landing__contact-text">
          <h2>Contáctenos</h2>
          <hr />
          <p>
            <strong>Email:</strong><br />
            slidespr@uprm.edu
          </p>
          <p>
            <strong>Teléfono:</strong><br />
            787-832-4040 Ext. 6844
          </p>
          <p>
            <strong>Oficina:</strong><br />
            Residencia 4B<br />
            Universidad de Puerto Rico, Recinto de Mayagüez
          </p>
        </div>
        <div className="landing__contact-image-wrapper">
          <img className="landing__contact-image" src={officeImage} alt="Rótulo de oficina" loading="lazy" />
        </div>
      </section>

    </div>
  );
}

export default Home;