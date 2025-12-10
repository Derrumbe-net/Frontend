import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/PRLHMO_LOGO.svg";
import {
    FaThLarge,
    FaProjectDiagram,
    FaNewspaper,
    FaClipboardList,
    FaBroadcastTower,
    FaUsers,
    FaSignOutAlt
} from "react-icons/fa";

import "../styles/CMSSidebar.css";

export default function Sidebar() {
    const navigate = useNavigate();
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const SUPER_ADMIN_EMAIL = "slidespr@gmail.com";

    // Check user email on mount
    useEffect(() => {
        const token = localStorage.getItem("cmsAdmin");
        if (token) {
            try {
                // Simple JWT decode to get email
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserEmail(payload.email);
            } catch (e) {
                console.error("Error decoding token in sidebar", e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("cmsAdmin");
        navigate("/cms/login/");
    };

    return (
        <aside className="cms-sidebar">
            {/* ===== Header with Logo ===== */}
            <div className="cms-sidebar__header">
                <img
                    src={logo}
                    alt="PRLHMO Logo"
                    className="cms-sidebar__logo"
                />
                <h3 className="cms-sidebar__title">
                    PRLHMO CMS
                </h3>
            </div>

            <nav className="cms-sidebar__nav">

                <NavLink
                    to="/cms"
                    end
                    className={({ isActive }) => `cms-link ${isActive ? "cms-link--active" : ""}`}
                >
                    <span className="cms-link-icon"><FaThLarge /></span>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/cms/proyectos"
                    className={({ isActive }) => `cms-link ${isActive ? "cms-link--active" : ""}`}
                >
                    <span className="cms-link-icon"><FaProjectDiagram /></span>
                    <span>Proyectos</span>
                </NavLink>

                <NavLink
                    to="/cms/publicaciones"
                    className={({ isActive }) => `cms-link ${isActive ? "cms-link--active" : ""}`}
                >
                    <span className="cms-link-icon"><FaNewspaper /></span>
                    <span>Publicaciones</span>
                </NavLink>

                <NavLink
                    to="/cms/reportes"
                    className={({ isActive }) => `cms-link ${isActive ? "cms-link--active" : ""}`}
                >
                    <span className="cms-link-icon"><FaClipboardList /></span>
                    <span>Reportes</span>
                </NavLink>

                <NavLink
                    to="/cms/estaciones"
                    className={({ isActive }) => `cms-link ${isActive ? "cms-link--active" : ""}`}
                >
                    <span className="cms-link-icon"><FaBroadcastTower /></span>
                    <span>Estaciones</span>
                </NavLink>

                {currentUserEmail === SUPER_ADMIN_EMAIL && (
                    <NavLink
                        to="/cms/usuarios"
                        className={({ isActive }) => `cms-link ${isActive ? "cms-link--active" : ""}`}
                    >
                        <span className="cms-link-icon"><FaUsers /></span>
                        <span>Usuarios</span>
                    </NavLink>
                )}

            </nav>

            <div className="cms-sidebar__footer">
                <button onClick={handleLogout} className="cms-logout">
                    <FaSignOutAlt className="cms-logout__icon" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}