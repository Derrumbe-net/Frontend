import HTMLFlipBook from "react-pageflip";
import Slider from "react-slick";
import {useState} from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import "../styles/Guide_module.css";

import page1 from "../assets/guide_pages/page1.webp";
import page2 from "../assets/guide_pages/page2.webp";
import page3 from "../assets/guide_pages/page3.webp";
import page4 from "../assets/guide_pages/page4.webp";
import page5 from "../assets/guide_pages/page5.webp";
import page6 from "../assets/guide_pages/page6.webp";
import page7 from "../assets/guide_pages/page7.webp";
import page8 from "../assets/guide_pages/page8.webp";
import page9 from "../assets/guide_pages/page9.webp";
import page10 from "../assets/guide_pages/page10.webp";
import page11 from "../assets/guide_pages/page11.webp";
import page12 from "../assets/guide_pages/page12.webp";
import page13 from "../assets/guide_pages/page13.webp";
import page14 from "../assets/guide_pages/page14.webp";
import page15 from "../assets/guide_pages/page15.webp";
import page16 from "../assets/guide_pages/page16.webp";

import landslide from "../assets/landslide.png";
import { SITE_CONFIG } from "@config";

function Guide() {
  const pages = [page1, page2, page3, page4, page5, page6, page7, page8, page9, page10, page11, page12, page13, page14, page15, page16];
  const [showHint, setShowHint] = useState(true);
  const [hideHint, setHideHint] = useState(false);

  const dismissHint = () => {
    if (!showHint) return;
    setHideHint(true);
    setTimeout(() => setShowHint(false), 600); // match animation duration
  };


  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 7000,
    pauseOnHover: true,
  };

  return (
    <section className="guide">
      <img src={landslide} alt="Landslide Cartoon" className="guide__landslide-bg" />
      <h1>{SITE_CONFIG.GUIDE.TITLE}</h1>
      <p dangerouslySetInnerHTML={{ __html: SITE_CONFIG.GUIDE.DESCRIPTION_HTML }} />
      <p dangerouslySetInnerHTML={{ __html: SITE_CONFIG.GUIDE.REQUEST_PRINT_HTML }} />
      <p dangerouslySetInnerHTML={{ __html: SITE_CONFIG.GUIDE.MORE_INFO_HTML }} />
      <p dangerouslySetInnerHTML={{ __html: SITE_CONFIG.GUIDE.ENGLISH_VERSION_HTML }} />
      <p>
        {SITE_CONFIG.GUIDE.INTERACTION_HINT}
      </p>
      
      <div
        className="guide__flipbook-container"
        onClick={dismissHint}
        onPointerDown={dismissHint}
      >
        {showHint && (
          <div className={`flipbook-hint ${hideHint ? "hide" : ""}`}>
            {SITE_CONFIG.GUIDE.FLIPBOOK_HINT}
          </div>
        )}

        <HTMLFlipBook
          width={500}
          height={700}
          size="stretch"
          minWidth={315}
          maxWidth={600}
          maxHeight={900}
          showCover={true}
          className="guide__flipbook"
          onFlip={dismissHint}
          onPointerDown={dismissHint}
        >
          {pages.map((img, i) => (
            <div key={i} className="guide__page">
              <img src={img} alt={`Página ${i + 1}`} />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      <div className="landslide__extra-info">
        <h2>{SITE_CONFIG.GUIDE.EXTRA_INFO_TITLE}</h2>

        <Slider {...carouselSettings} className="landslide__carousel">
          {SITE_CONFIG.GUIDE.CAROUSEL.map((card, idx) => (
            <div key={idx} className="landslide__card">
              <h3>{card.TITLE}</h3>
              {card.SUBTITLE && <em>{card.SUBTITLE}</em>}
              <ul>
                {card.ITEMS.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
            </div>
          ))}
        </Slider>
      </div>

      <div className="landslide__videos">
        <h2>{SITE_CONFIG.GUIDE.ANIMATIONS_TITLE}</h2>
        
        <div className="landslide__video-grid">

          <div className="landslide__video-card">
            <div className="landslide__video-container">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/2dS2Sisj4GQ?si=Wiu9Rr6NXIPaayEt" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </div>
            <p>{SITE_CONFIG.GUIDE.VIDEO_SPANISH}</p>
          </div>
            <div className="landslide__video-card">
                <div className="landslide__video-container">
                    <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/lbHGOz3WXgw?si=me9p18wwXhpuatWI"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                </div>
                <p>{SITE_CONFIG.GUIDE.VIDEO_ENGLISH}</p>
            </div>
        </div>
      </div>

    </section>
  );
}

export default Guide;