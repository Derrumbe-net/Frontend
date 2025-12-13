import "../styles/CMSDashboard.css";
import { Link } from "react-router-dom";
import HeroImage from "../../assets/prlhmo_cms_landing.png";
import ProjectIcon from "../../assets/cms_project_icon.png";
import PublicationIcon from "../../assets/cms_publication_icon.png";
import ReportIcon from "../../assets/cms_report_icon.png";
import StationIcon from "../../assets/cms_station_icon.png";
import UsersIcon from "../../assets/cms_users_icon.png";


function CMSDashboard() {
  return (
    <div className="cms-wrapper">
      <section className="cms-hero">
        <div className="cms-hero-left">
          <span className="cms-accent"></span>

          <h1 className="cms-hero-title">
            Sistema de Administración de Contenido (CMS)
          </h1>

          <p className="cms-hero-subtitle">
            Este panel interno permite al equipo de la 
            Puerto Rico Landslide Hazard Mitigation Office
            gestionar la información presentada en Derrumbe.net. 
          </p>
        </div>

        <div className="cms-hero-right">
          <img src={HeroImage} alt="CMS Illustration" className="cms-hero-img" />
        </div>
      </section>

      <section className="cms-info-box">
        <h2>¿Qué es este CMS?</h2>
        <p>
          Un <em>Content Management System (CMS)</em> es una herramienta que permite 
          crear, editar y organizar información digital sin necesidad de 
          editar código. Este CMS fue diseñado específicamente para Derrumbe.net 
          para que el PRLHMO mantenga los datos actualizados de forma rápida y segura. Desde aquí pueden
          administrar proyectos, publicaciones, reportes,
          estaciones y los usuarios de este sistema.
        </p>
      </section>

      <section className="cms-modules">

        <h2>Módulos del Sistema</h2>
        <p className="cms-modules-description">
          Seleccione un módulo para comenzar a gestionar contenido.
        </p>

        <div className="cms-modules-grid">
          <div className="cms-module-card">
            <img src={ProjectIcon} className="cms-module-icon" alt="Proyectos Icon" />
            <h3>Proyectos</h3>
            <p>
              Administre la lista oficial de proyectos del PRLHMO.
            </p>
            <ul>
              <li>Crear y editar proyectos</li>
              <li>Actualizar descripciones y estados</li>
            </ul>
            <Link to="/cms/proyectos" className="cms-module-btn">Ir a Proyectos</Link>
          </div>
          <div className="cms-module-card">
            <img src={PublicationIcon} className="cms-module-icon" alt="Publicaciones Icon" />
            <h3>Publicaciones</h3>
            <p>
              Gestione las publicaciones hechas por la oficina.
            </p>
            <ul>
              <li>Registrar nuevas publicaciones</li>
              <li>Actualizar título, referencias y enlaces</li>
            </ul>
            <Link to="/cms/publicaciones" className="cms-module-btn">Ir a Publicaciones</Link>
          </div>
          <div className="cms-module-card">
            <img src={ReportIcon} className="cms-module-icon" alt="Reportes Icon" />
            <h3>Reportes de Deslizamientos</h3>
            <p>
              Revise y valide reportes enviados por la ciudadanía.
            </p>
            <ul>
              <li>Visualizar reportes recientes</li>
              <li>Validar o actualizar información</li>
              <li>Cambiar estado del reporte</li>
            </ul>
            <Link to="/cms/reportes" className="cms-module-btn">Ir a Reportes</Link>
          </div>
          <div className="cms-module-card">
            <img src={StationIcon} className="cms-module-icon" alt="Estaciones Icon" />
            <h3>Estaciones</h3>
            <p>
              Gestione información de las estaciones de monitoreo.
            </p>
            <ul>
              <li>Actualizar ubicación y metadatos</li>
              <li>Marcar estaciones activas/inactivas</li>
            </ul>
            <Link to="/cms/estaciones" className="cms-module-btn">Ir a Estaciones</Link>
          </div>
          <div className="cms-module-card">
            <img src={UsersIcon} className="cms-module-icon" alt="Usuarios Icon" />
            <h3>Usuarios</h3>
            <p>
              Administre las cuentas con acceso al CMS.
            </p>
            <ul>
              <li>Autorizar o revocar acceso</li>
              <li>Ver estado de cada usuario (Autorizado / Pendiente)</li>
              <li>Desactivar cuentas</li>
            </ul>
            <Link to="/cms/usuarios" className="cms-module-btn">Ir a Usuarios</Link>
          </div>

        </div>
      </section>

      <footer className="cms-footer">
        Puerto Rico Landslide Hazard Mitigation Office · Derrumbe.net CMS · 2025
      </footer>

    </div>
  );
}

export default CMSDashboard;
