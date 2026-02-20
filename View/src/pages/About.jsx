import "../styles/About_module.css";
import officeMonitors from "../assets/office_monitors.webp";
import logo from "../assets/PRLHMO_LOGO.svg";
import coordinatorImage from "../assets/coordinator_professor.webp";
import assistantResearcher1 from "../assets/assistant_researcher_1.webp";
import assistantResearcher2 from "../assets/assistant_researcher_2.webp";
import linkedinLogo from "../assets/LINKEDIN_LOGO.svg";

import directoryData from "../about_us.json";

const imageMap = {
  coordinator: coordinatorImage,
  researcher1: assistantResearcher1,
  researcher2: assistantResearcher2,
};
function About() {
  return (
    <section className="about">
      <div className="about__content">
        <div className="about__image-wrapper">
          <img
            src={officeMonitors}
            alt="Monitores de la oficina"
            className="about__image"
            loading="lazy"
          />
        </div>
        <div className="about__text-block">
          <img src={logo} alt="Logo PRLHMO" className="about__logo-bg" />
          <h1 className="about__title">¿Quiénes somos?</h1>
          <p className="about__description">
            La Oficina de Mitigación de Peligros de Deslizamientos de Tierra en
            Puerto Rico es parte del Departamento de Geología de la Universidad
            de Puerto Rico en Mayagüez. La oficina trabaja con diversas
            agencias, partes interesadas, organizaciones comunitarias y otros en
            los asuntos relacionados con los peligros de deslizamientos de
            tierra en Puerto Rico.
          </p>
          <p className="about__mission">
            <strong>Misión:</strong> Llevar a cabo investigaciones continuas y
            actividades de participación comunitaria relacionadas con los
            peligros de deslizamientos de tierra en Puerto Rico.
          </p>
          <p className="about__vision">
            <strong>Visión:</strong> Ciencia y preparación para los peligros de
            deslizamientos de tierra en Puerto Rico.
          </p>
        </div>
      </div>

      <div className="directory__title">Directorio de Oficina</div>
      <h2 className="directory__subtitle">Facultad</h2>

      <div className="directory__profiles">
        {directoryData.facultad.map((member) => (
          <div className="directory__card" key={member.id}>
            <img
              src={imageMap[member.imageKey]}
              alt={member.name}
              className="profile"
            />
            <div className="directory__info">
              <div className="directory__linkedin">
                <div className="directory__linkedin-box">
                  <a href={member.linkedin} target="_blank" rel="noreferrer">
                    <img
                      src={linkedinLogo}
                      alt="LinkedIn"
                      className="footer__icon"
                    />
                  </a>
                </div>
              </div>
              <div className="directory__person-info">
                <strong>{member.name}</strong>
                <p>{member.role}</p>
                <p>
                  {member.email} <br />
                  {member.phone} <br />
                  Ext. {member.ext}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="directory__groups">
        <div className="directory__group">
          <h3>Estudiantes Graduados</h3>
          <ul>
            {directoryData.graduados.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
        <div className="directory__group">
          <h3>Estudiantes Subgraduados</h3>
          <ul>
            {directoryData.subgraduados.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default About;
