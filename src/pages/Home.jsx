import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Home_module.css";
import heroImage from '../assets/landing_page_background.webp';
import InteractiveMap from "./InteractiveMap";
import landslidePhoto from '../assets/landslide_landing_page.webp';
import newsImage from '../assets/alturas_de_belgica.gif';
import officeImage from '../assets/office_door.webp';
import uprmLogo from "../assets/UPRM_LOGO.png";
import logo from '../assets/PRLHMO_LOGO.svg';
import CCFLHLogo from "../assets/CCFLH_LOGO.svg";

const API_URL = import.meta.env.VITE_API_URL;

function Home() {
  const [officeInfo, setOfficeInfo] = useState(null);

  useEffect(() => {
    // This perfectly matches the GET /office-info route in your Go backend
    fetch(`${API_URL}/office-info`)
      .then((r) => r.json())
      .then(setOfficeInfo)
      .catch((err) => console.error("Error fetching office info:", err));
  }, []);

  // Render multi-line office location (newlines stored as \n in the DB)
  const renderLocation = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => (
      <span key={i}>{line}{i < text.split("\n").length - 1 && <br />}</span>
    ));
  };

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
              <Link to="/reportar" className="btn btn--report">Haz tu Reporte</Link>
              <Link to="/solicitud" className="btn btn--outline">Solicita una Charla</Link>
          </div>
        </div>
      </section>

      {/* SECTION: MAPA */}
      <section className="landing__map">
        <div className="landing__map-text">
          <h2>Explora Nuestro Mapa Interactivo de Monitoreo de Deslizamientos</h2>
          <p>
            Herramienta interactiva que muestra, en tiempo real, datos de saturación del suelo,
            susceptibilidad a deslizamientos y estimaciones de precipitación en Puerto Rico.
          </p>
          <Link to="/mapa-interactivo" className="landing__map-link">¡Haz clic en el mapa!</Link>
        </div>

        <div className="landing__map-preview-container">
          <Link to="/mapa-interactivo" className="landing__map-preview-link">
            <div className="landing__map-preview-wrapper">
              <InteractiveMap isPreview={true} />
              <div className="landing__map-overlay"></div>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION: REPORTAR */}
      <section className="landing__report">
        <div className="landing__report-text">
          <h2>Reporta un Deslizamiento</h2>
          <p>
            Ayúdanos a mejorar el monitoreo reportando deslizamientos que observes
            en tu área. Tu apoyo puede brindar ayuda para la comunidad.
          </p>
          <Link to="/reportar" className="btn--black">¡Haz tu Reporte!</Link>
        </div>
        <div className="landing__report-image-wrapper">
          <img src={landslidePhoto} alt="Ejemplo de deslizamiento" className="landing__report-image" loading="lazy" />
        </div>
      </section>

      {/* SECTION: NOTICIA */}
      <section className="landing__featured-news">
        <div className="landing__featured-news-image-wrapper">
          <img className="landing__featured-news-image" src={newsImage} alt="Deslizamiento en Alturas de Bélgica" loading="lazy" />
        </div>
        <div className="landing__featured-news-text">
          <h2>Noticia Destacada:</h2>
          <h3>Alturas de Bélgica, Guánica, PR</h3>
          <p className="landing__featured-news-date">Junio 2024 - Septiembre 2024</p>
          <p>Vea a continuación el lapso de tiempo más reciente del deslizamiento de tierra en Alturas de Bélgica, Guánica, PR.</p>
          <p>This project is an effort of the Puerto Rico Landslide Hazard Mitigation Office and the NSF Collaborative Center for Landslide Geohazards.</p>
          <img className="landing__featured-news-logo" src={CCFLHLogo} alt="Collaborative Center for Landslide Geohazards" />
        </div>
      </section>

      {/* SECTION: CONTACTO — driven by office_info table */}
      <section id="contact" className="landing__contact">
        <div className="landing__contact-text">
          <h2>Contáctenos</h2>
          <hr />
          {officeInfo ? (
            <>
              {officeInfo.email && (
                <p>
                  <strong>Email:</strong><br />
                  <a href={`mailto:${officeInfo.email}`} style={{ color: "inherit" }}>
                    {officeInfo.email}
                  </a>
                </p>
              )}
              {officeInfo.phone && (
                <p>
                  <strong>Teléfono:</strong><br />
                  {officeInfo.phone}{officeInfo.phone_ext ? ` ${officeInfo.phone_ext}` : ""}
                </p>
              )}
              {officeInfo.office_location && (
                <p>
                  <strong>Oficina:</strong><br />
                  {renderLocation(officeInfo.office_location)}
                </p>
              )}
            </>
          ) : (
            <>
              <p><strong>Email:</strong><br />slidespr@uprm.edu</p>
              <p><strong>Teléfono:</strong><br />787-832-4040 Ext. 6844</p>
              <p><strong>Oficina:</strong><br />Residencia 4B<br />Universidad de Puerto Rico, Recinto de Mayagüez</p>
            </>
          )}
        </div>
        <div className="landing__contact-image-wrapper">
          <img className="landing__contact-image" src={officeImage} alt="Rótulo de oficina" loading="lazy" />
        </div>
      </section>

    </div>
  );
}

export default Home;
