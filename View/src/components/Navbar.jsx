import "../styles/index.css";
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/PRLHMO_LOGO.svg';
import landslideReadyLogo from '../assets/LANDSLIDEREADY_LOGO.png';

function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  return (
    <nav className="nav">
      <div className="nav__inner">

        <Link to="/" className="nav__brand" aria-label="Ir al inicio">
          <img src={logo} alt="PR Landslide Hazard Mitigation Office" className="nav__logo" />
        </Link>

        <button
          className="nav__hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          ref={buttonRef}
        >
          ☰
        </button>

        <ul className={`nav__list ${menuOpen ? 'active' : ''}`} ref={menuRef}>
          <li className="nav__item"><Link to="/" className="nav__link">Inicio</Link></li>
          <li className="nav__item"><Link to="/sobre-nosotros" className="nav__link">Sobre Nosotros</Link></li>

          <li className="nav__item nav__item--dropdown">
            <button
              className="nav__link nav__toggle"
              onClick={() => toggleDropdown('investigación')}
            >
              Investigación {openDropdown === 'investigación' ? '▴' : '▾'}
            </button>
            {openDropdown === 'investigación' && (
              <ul className="nav__menu">
                <li><Link to="/proyectos" className="nav__sublink">Proyectos</Link></li>
                <li><Link to="/publicaciones" className="nav__sublink">Publicaciones</Link></li>
              </ul>
            )}
          </li>

          <li className="nav__item nav__item--dropdown">
            <button
              className="nav__link nav__toggle"
              onClick={() => toggleDropdown('monitoreo')}
            >
              Monitoreo {openDropdown === 'monitoreo' ? '▴' : '▾'}
            </button>
            {openDropdown === 'monitoreo' && (
              <ul className="nav__menu">
                <li><Link to="/mapa-interactivo" className="nav__sublink">Mapa Interactivo</Link></li>
                {/* <li><Link to="/estaciones" className="nav__sublink">Estaciones</Link></li> */}
                <li><Link to="/pronostico-lluvia" className="nav__sublink">Pronóstico de lluvia</Link></li>
              </ul>
            )}
          </li>

          <li className="nav__item nav__item--dropdown">
            <button
              className="nav__link nav__toggle"
              onClick={() => toggleDropdown('recursos')}
            >
              Recursos {openDropdown === 'recursos' ? '▴' : '▾'}
            </button>
            {openDropdown === 'recursos' && (
              <ul className="nav__menu">
                <li><Link to="/guia-deslizamientos" className="nav__sublink">Guía sobre Deslizamientos</Link></li>
                  <li><Link to="/mapa-susceptibilidad" className="nav__sublink">Mapa Susceptibilidad</Link></li>
                <li><Link to="/mapa-susceptibilidad-municipios" className="nav__sublink">Mapas Municipales</Link></li>
              </ul>
            )}
          </li>

          <li className="nav__item"><Link to="/reportar" className="nav__link">Reportar</Link></li>

          <li className="nav__item nav__item--dropdown">
            <button
              className="nav__link nav__toggle"
              onClick={() => toggleDropdown('landslideready')}
            >
              <img
                src={landslideReadyLogo}
                alt="LandslideReady PR"
                className="nav__logo"
                style={{ height: '1.5rem', verticalAlign: 'middle' }}
              />{" "}
              {openDropdown === 'landslideready' ? '▴' : '▾'}
            </button>
            {openDropdown === 'landslideready' && (
              <ul className="nav__menu">
                <li><Link to="/landslideready-individuos" className="nav__sublink">LandslideReady para Individuos</Link></li>
                <li><Link to="/landslideready-municipios" className="nav__sublink">LandslideReady para Municipios</Link></li>
              </ul>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
