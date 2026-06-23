import { useEffect, useState } from "react";
import "../styles/About_module.css";
import officeMonitors from "../assets/office_monitors.webp";
import logo from "../assets/PRLHMO_LOGO.svg";
import linkedinLogo from "../assets/LINKEDIN_LOGO.svg";
import { SITE_CONFIG } from "@config";

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
      fetch(`${API_URL}/faculty-members`).then((r) => r.json()),
      fetch(`${API_URL}/student-members`).then((r) => r.json()),
      fetch(`${API_URL}/funding-sources`).then((r) => r.json()),
    ])
      .then(([facultyData, studentData, fundingData]) => {
        const facultyMembers = facultyData || [];
        const studentMembers = studentData || [];
        const funding = fundingData || [];

        setFaculty(facultyMembers);
        
        // Fixed: Use student_type instead of member_type based on your Go JSON
        setGraduate(studentMembers.filter((m) => (m.student_type) === "graduate"));
        setUndergraduate(studentMembers.filter((m) => (m.student_type) === "undergraduate"));
        
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
          <h1 className="about__title">{SITE_CONFIG.ABOUT.TITLE}</h1>
          <p className="about__description">
            {SITE_CONFIG.ABOUT.DESCRIPTION}
          </p>
          <p className="about__mission">
            <strong>{SITE_CONFIG.ABOUT.MISSION_LABEL}</strong> {SITE_CONFIG.ABOUT.MISSION}
          </p>
          <p className="about__vision">
            <strong>{SITE_CONFIG.ABOUT.VISION_LABEL}</strong> {SITE_CONFIG.ABOUT.VISION}
          </p>
        </div>
      </div>

      <div className="directory__title">{SITE_CONFIG.ABOUT.DIRECTORY_TITLE}</div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#465a52", padding: "3rem" }}>
          {SITE_CONFIG.ABOUT.LOADING_TEXT}
        </p>
      ) : (
        <>
          <h2 className="directory__subtitle">{SITE_CONFIG.ABOUT.SECTION_FACULTY}</h2> 
          <div className="directory__profiles">
            {faculty.map((m) => (
              <MemberCard key={m.id || m.member_id} member={m} memberType="faculty" showContact />
            ))}
          </div>

          <h2 className="directory__subtitle">{SITE_CONFIG.ABOUT.SECTION_GRADUATE}</h2>
          <div className="directory__profiles directory__profiles--students">
            {graduate.map((m) => (
              <MemberCard key={m.id || m.student_member_id || m.member_id} member={m} memberType="student" />
            ))}
          </div>

          <h2 className="directory__subtitle">{SITE_CONFIG.ABOUT.SECTION_UNDERGRADUATE}</h2>
          <div className="directory__profiles directory__profiles--students">
            {undergraduate.map((m) => (
              <MemberCard key={m.id || m.student_member_id || m.member_id} member={m} memberType="student" />
            ))}
          </div>

          {fundingSources.length > 0 && (
            <div className="funding__section">
              <div className="directory__title funding__banner">{SITE_CONFIG.ABOUT.SECTION_FUNDING}</div>
              <div className="funding__grid">
                {fundingSources.map((f) => (
                  <FundingCard key={f.id || f.funding_id} source={f} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
function MemberCard({ member, memberType, showContact = false }) {
  // 1. Identify the ID (Check for both specific and generic names)
  const id = member.student_member_id || member.faculty_member_id || member.member_id || member.id; 
  
  // 2. Identify the Role/Description
  const role = member.faculty_role || member.student_type || member.role || "Miembro";

  // 3. Build the Image URL (Handle potential casing issues from Go)
  const path = member.image_path || member.ImagePath;
  const imgSrc = path 
    ? `${API_URL}/${memberType}-members/item/${id}/image` 
    : PLACEHOLDER;

  const hasLinkedIn = showContact && member.linkedin_url;

  return (
    <div className="directory__card">
      <img 
        src={imgSrc} 
        alt={member.name} 
        className="profile" 
        onError={(e) => { e.target.src = PLACEHOLDER; }} 
      />

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
          <p className="directory__role">{role}</p>

          {showContact && (member.email || member.phone) && (
            <p className="directory__contact">
              {member.email     && <>{member.email}<br /></>}
              {member.phone     && <>{member.phone}<br /></>}
              {/* Use 'extension' to match your Go DTO */}
              {member.extension && <>Ext. {member.extension}</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FundingCard({ source }) {
  const id = source.id || source.funding_id;
  
  const imgSrc = source.image_path
    ? `${API_URL}/funding-sources/item/${id}/image`
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
