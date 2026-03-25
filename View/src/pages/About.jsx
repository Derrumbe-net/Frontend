import { useEffect, useState } from "react";
import "../styles/About_module.css";
import officeMonitors from "../assets/office_monitors.webp";
import logo from "../assets/PRLHMO_LOGO.svg";
import linkedinLogo from "../assets/LINKEDIN_LOGO.svg";

const API_URL = import.meta.env.VITE_API_URL;

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 220'%3E%3Crect width='200' height='220' fill='%23e2e8f0'/%3E%3Ccircle cx='100' cy='75' r='40' fill='%23a0aec0'/%3E%3Cellipse cx='100' cy='185' rx='65' ry='50' fill='%23a0aec0'/%3E%3C/svg%3E";

export default function About() {
  const [faculty, setFaculty]             = useState([]);
  const [graduate, setGraduate]           = useState([]);
  const [undergraduate, setUndergraduate] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/team-members`).then((r) => r.json()),
      fetch(`${API_URL}/funding-sources`).then((r) => r.json()),
    ])
      .then(([members, funding]) => {
        setFaculty(members.filter((m) => m.member_type === "faculty"));
        setGraduate(members.filter((m) => m.member_type === "graduate"));
        setUndergraduate(members.filter((m) => m.member_type === "undergraduate"));
        setFundingSources(funding);
      })
      .catch((err) => console.error("Error fetching about data:", err))
      .finally(() => setLoading(false));
  }, []);

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
            La Oficina de Mitigación de Peligros de Deslizamientos de Tierra en Puerto Rico
            es parte del Departamento de Geología de la Universidad de Puerto Rico en Mayagüez.
            La oficina trabaja con diversas agencias, partes interesadas, organizaciones comunitarias
            y otros en los asuntos relacionados con los peligros de deslizamientos de tierra en Puerto Rico.
          </p>
          <p className="about__mission">
            <strong>Misión:</strong> Llevar a cabo investigaciones continuas y actividades de
            participación comunitaria relacionadas con los peligros de deslizamientos de tierra en
            Puerto Rico.
          </p>
          <p className="about__vision">
            <strong>Visión:</strong> Ciencia y preparación para los peligros de deslizamientos de
            tierra en Puerto Rico.
          </p>
        </div>
      </div>

      <div className="directory__title">Directorio de Oficina</div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#465a52", padding: "3rem" }}>
          Cargando directorio…
        </p>
      ) : (
        <>
          <h2 className="directory__subtitle">Facultad</h2>
          <div className="directory__profiles">
            {faculty.map((m) => (
              <MemberCard key={m.member_id} member={m} showContact />
            ))}
          </div>

          <h2 className="directory__subtitle">Estudiantes Graduados</h2>
          <div className="directory__profiles directory__profiles--students">
            {graduate.map((m) => (
              <MemberCard key={m.member_id} member={m} />
            ))}
          </div>

          <h2 className="directory__subtitle">Estudiantes Subgraduados</h2>
          <div className="directory__profiles directory__profiles--students">
            {undergraduate.map((m) => (
              <MemberCard key={m.member_id} member={m} />
            ))}
          </div>

          {fundingSources.length > 0 && (
            <div className="funding__section">
              <div className="directory__title funding__banner">Fuentes de Financiamiento</div>
              <div className="funding__grid">
                {fundingSources.map((f) => (
                  <FundingCard key={f.funding_id} source={f} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MemberCard({ member, showContact = false }) {
  const imgSrc = member.image_url
    ? `${API_URL}/team-members/${member.member_id}/image`
    : PLACEHOLDER;

  const hasLinkedIn = showContact && member.linkedin_url;

  return (
    <div className="directory__card">
      <img src={imgSrc} alt={member.name} className="profile" />

      <div className="directory__info">
        <div className="directory__linkedin">
          <div className="directory__linkedin-box">
            {hasLinkedIn ? (
              <a href={member.linkedin_url} target="_blank" rel="noreferrer">
                <img src={linkedinLogo} alt="LinkedIn" className="footer__icon" />
              </a>
            ) : (
              <span style={{ display: "block", width: 50, height: 50 }} />
            )}
          </div>
        </div>

        <div className="directory__person-info">
          <strong>{member.name}</strong>
          <p>{member.role}</p>

          {showContact && (member.email || member.phone) && (
            <p>
              {member.email     && <>{member.email}<br /></>}
              {member.phone     && <>{member.phone}<br /></>}
              {member.phone_ext && <>{member.phone_ext}</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FundingCard({ source }) {
  const imgSrc = source.image_url
    ? `${API_URL}/funding-sources/${source.funding_id}/image`
    : null;

  const inner = (
    <div className="funding__card">
      {imgSrc ? (
        <img src={imgSrc} alt={source.name} className="funding__logo" />
      ) : (
        <span className="funding__name-fallback">{source.name}</span>
      )}
      <p className="funding__label">{source.name}</p>
    </div>
  );

  return source.website_url ? (
    <a href={source.website_url} target="_blank" rel="noreferrer" className="funding__link">
      {inner}
    </a>
  ) : (
    inner
  );
}