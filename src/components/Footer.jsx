import "../styles/index.css";
import logo from '../assets/PRLHMO_LOGO.svg';
import facebook from '../assets/FACEBOOK_LOGO.svg';
import { SITE_CONFIG } from "@config";

function Footer() {
  const renderMultiLine = (text) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>{line}{i < text.split("\n").length - 1 && <br />}</span>
    ));
  };

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__left">
            <img src={logo} alt="PRLHMO Logo" className="footer__logo" />
            <div className="footer__text">
              {renderMultiLine(SITE_CONFIG.FOOTER.OFFICE_NAME)}
            </div>
          </div>
          <div className="footer__right">
            <a href="https://www.facebook.com/SlidesPR" target="_blank" rel="noreferrer">
              <img src={facebook} alt="Facebook" className="footer__icon" />
            </a>
          </div>
        </div>
        <p className="footer__disclaimer">
          {SITE_CONFIG.FOOTER.DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
