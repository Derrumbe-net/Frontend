import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/PRLHMO_LOGO.svg";
import logoutIcon from "../../assets/logout-icon.jpg";
import "../styles/CMSSidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("cmsAdmin");
    navigate("/");
  };

  return (
    <aside className="cms-sidebar">
      {/* ===== Header with Logo ===== */}
      <div className="cms-sidebar__header">
        <img
          src={logo}
          alt="Puerto Rico Landslide Hazard Mitigation Office"
          className="cms-sidebar__logo"
        />
        <h3 className="cms-sidebar__title">
          Puerto Rico Landslide Hazard Mitigation Office
        </h3>
      </div>

      {/* ===== Navigation Links ===== */}
      <nav className="cms-sidebar__nav">
        <NavLink
          to="/cms"
          end
          className={({ isActive }) =>
            `cms-link ${isActive ? "cms-link--active" : ""}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/cms/proyectos"
          className={({ isActive }) =>
            `cms-link ${isActive ? "cms-link--active" : ""}`
          }
        >
          Proyectos
        </NavLink>
        <NavLink
          to="/cms/publicaciones"
          className={({ isActive }) =>
            `cms-link ${isActive ? "cms-link--active" : ""}`
          }
        >
          Publicaciones
        </NavLink>
        <NavLink
          to="/cms/reportes"
          className={({ isActive }) =>
            `cms-link ${isActive ? "cms-link--active" : ""}`
          }
        >
          Reportes
        </NavLink>
        <NavLink
          to="/cms/estaciones"
          className={({ isActive }) =>
            `cms-link ${isActive ? "cms-link--active" : ""}`
          }
        >
          Estaciones
        </NavLink>
      </nav>

      {/* ===== Logout Button ===== */}
      <div className="cms-sidebar__footer">
        <button onClick={handleLogout} className="cms-logout">
          <img
            src={logoutIcon}
            alt="Logout Icon"
            className="cms-logout__icon"
          />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}