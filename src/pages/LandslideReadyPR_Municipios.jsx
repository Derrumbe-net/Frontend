import '../styles/LandslideReadyPR_Municipios_module.css';
import map from '../assets/municipality_map.webp';
import cycle from '../assets/landslideready_cycle.webp';
import groupPics from '../assets/landslideready_pictures.webp';
import LandslideReadyMap from '../components/LandslideReadyMap';
import { useState, useEffect } from 'react';
import { SITE_CONFIG } from "@config";

function LandslideReadyPR_Municipios() {

  const [completedMunicipalities, setCompletedMunicipalities] = useState([]);

   useEffect(() => {
     const API_URL = `${import.meta.env.VITE_API_URL}`;

     fetch(`${API_URL}/municipalities`)
       .then(r => r.json())
       .then(data => {
         const names = data
           .filter(m => m.stage === "Completado")
           .map(m => m.name);
         setCompletedMunicipalities(names);
       })
       .catch(err => console.error("Error fetching municipalities:", err));
   }, []);

  return (
    <section className="landslideReady">
      <div className="landslideReady__municipios-section">
        <div className="landslideReady__municipios-left">
          <h2>{SITE_CONFIG.LANDSLIDE_READY.MUNICIPIOS_TITLE}</h2>
          <p>
            {SITE_CONFIG.LANDSLIDE_READY.MUNICIPIOS_DESC_1}
          </p>
          <p>
            {SITE_CONFIG.LANDSLIDE_READY.MUNICIPIOS_DESC_2}
          </p>

          <h3 className="landslideReady__subheader">
            {SITE_CONFIG.LANDSLIDE_READY.MAP_SUBHEADER}<br />
          </h3>
          <div className="landslideReady__map-wrapper">
            <LandslideReadyMap completedMunicipalities={completedMunicipalities} />
          </div>
          <p className="landslideReady__map-note">
            {SITE_CONFIG.LANDSLIDE_READY.MAP_NOTE}
          </p>

          <h3 className="landslideReady__subheader">{SITE_CONFIG.LANDSLIDE_READY.CYCLE_SUBHEADER}</h3>
          <img src={cycle} alt="Ciclo LandslideReady" className="landslideReady__cycle" />
        </div>

        <div className="landslideReady__municipios-right">
          <img src={groupPics} alt="Talleres comunitarios" className="landslideReady__group-pics" />
        </div>
      </div>
    </section>
  );
}

export default LandslideReadyPR_Municipios;

