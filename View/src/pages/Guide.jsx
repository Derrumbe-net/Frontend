import HTMLFlipBook from "react-pageflip";
import Slider from "react-slick";
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

function Guide() {
  const pages = [page1, page2, page3, page4, page5, page6, page7, page8, page9, page10, page11, page12, page13, page14, page15, page16];

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
      <h1>Guía sobre Deslizamientos de Tierra</h1>
      <p>
        Esta {" "}
        <a href="https://hazards.colorado.edu/uploads/documents/PuertoRico_GuiaDerrumbe_2020.pdf" target="_blank" rel="noopener noreferrer" >guía</a> incluye 16 páginas de 
        información útil para ciudadanos de la isla que viven en zonas propensas a derrumbes.
      </p>
      <p>
        Para solicitar una versión impresa de la guía, favor de comunicar con nosotros por correo electrónico {" "}
        <a href="mailto:slidespr@uprm.edu">slidespr@uprm.edu</a> o llamar el Departamento de Geología de la UPRM: 787-265-3845.
      </p>
      <p>
        Para más information sobre la guía, puede visitar: {" "}
        <a href="https://hazards.colorado.edu/research-projects/puerto-rico-landslide-hazard-mitigation-project" target="_blank" rel="noopener noreferrer" >hazards.colorado.edu/puertorico</a>
      </p>
      <p>
        English version {" "}
        <a href="https://hazards.colorado.edu/uploads/documents/PuertoRico_LandslideGuide_2020.pdf" target="_blank" rel="noopener noreferrer" >here</a>.
      </p>
      <p>
        Para avanzar o retroceder, haga clic o arrastre desde las esquinas del libro.
        Puede detenerse en cualquier página para leer con calma o ampliar el contenido usando el zoom del navegador.
      </p>
      
      <div className="guide__flipbook-container">
        <HTMLFlipBook
          width={500}
          height={700}
          size="stretch"
          minWidth={315}
          maxWidth={600}
          maxHeight={900}
          showCover={true}
          className="guide__flipbook"
        >
          {pages.map((img, i) => (
            <div key={i} className="guide__page">
              <img src={img} alt={`Página ${i + 1}`} />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      <div className="landslide__extra-info">
        <h2>Datos sobre Deslizamientos de Tierra</h2>

        <Slider {...carouselSettings} className="landslide__carousel">

          <div className="landslide__card">
            <h3>Los Deslizamientos de Tierra y sus Mitigaciones</h3>
            <em>
              Para prevenir derrumbes causados naturalmente o por intervención humana:
            </em>
            <ul>
              <li>1. Evita hacer cortes de terreno con pendientes escarpadas.</li>
              <li>2. Redirige el agua hacia desagües y alcantarillas para no sobresaturar el terreno.</li>
              <li>3. Incrementa la siembra de árboles en pendientes y evita la deforestación.</li>
              <li>4. Consulta siempre a un profesional antes de realizar construcciones.</li>
            </ul>
          </div>

          <div className="landslide__card">
            <h3>Señales de la Naturaleza ante un Posible Deslizamiento</h3>
            <ul>
              <li><strong>Árboles inclinados:</strong> Ocurre cuando la tierra se mueve lentamente.</li>
              <li><strong>Brotes de agua o desaparición:</strong> Aparición de agua en lugares nuevos o desaparición por obstrucción de derrumbe.</li>
              <li><strong>Grietas:</strong> Indican movimiento y facilitan el paso de agua en el terreno.</li>
            </ul>
          </div>

          <div className="landslide__card">
            <h3>Deslizamientos Comunes en Puerto Rico</h3>
            <ul>
              <li><strong>Caída de roca:</strong> Movimientos descendentes de roca o tierra desprendidos de elevaciones empinadas.</li>
              <li><strong>Flujo:</strong> Desplazamiento rápido provocado por gran cantidad de agua acumulada y mezclada con la tierra.</li>
              <li><strong>Derrumbe:</strong> Desprendimiento de roca o tierra que ocurre a lo largo de una superficie.</li>
            </ul>
          </div>
        </Slider>
      </div>

      <div className="landslide__videos">
        <h2>Animaciones sobre Deslizamientos de Tierra</h2>
        
        <div className="landslide__video-grid">

          <div className="landslide__video-card">
            <div className="landslide__video-container">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/2dS2Sisj4GQ?si=Wiu9Rr6NXIPaayEt" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </div>
            <p>Versión en español</p>
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
                <p>English Version</p>
            </div>
        </div>
      </div>

    </section>
  );
}

export default Guide;