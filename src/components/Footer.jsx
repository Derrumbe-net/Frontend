import "../styles/index.css";
import logo from '../assets/PRLHMO_LOGO.svg';
import facebook from '../assets/FACEBOOK_LOGO.svg';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__left">
            <img src={logo} alt="PRLHMO Logo" className="footer__logo" />
            <div className="footer__text">
              Puerto Rico Landslide<br />
              Hazard Mitigation Office
            </div>
          </div>
          <div className="footer__right">
            <a href="https://www.facebook.com/SlidesPR" target="_blank" rel="noreferrer">
              <img src={facebook} alt="Facebook" className="footer__icon" />
            </a>
          </div>
        </div>
        <p className="footer__disclaimer">
          La información que se ofrece en este sitio web se proporciona “tal cual”, debe considerarse provisional y está sujeta a cambios. 
          La información no ha sido revisada ni avalada por ninguna agencia u organización. Los autores y editores de esta información 
          rechazan cualquier pérdida o responsabilidad, ya sea directa o indirectamente, como consecuencia de la aplicación de la información 
          proporcionada en este documento, o en relación con el uso y la aplicación de dicha información. No se ofrece garantía alguna, ya sea 
          expresa o implícita, con respecto a la exactitud o aceptabilidad de la información.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
