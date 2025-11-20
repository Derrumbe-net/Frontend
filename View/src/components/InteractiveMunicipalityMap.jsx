import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import "../styles/InteractiveMunicipalityMap_module.css";

import Adjuntas from "../assets/maps/Adjuntas.png";
import Aguada from "../assets/maps/aguada.png";
import Aguadilla from "../assets/maps/aguadilla.png";
import AguasBuenas from "../assets/maps/aguasbuenas.png";
import Aibonito from "../assets/maps/aibonito.png";
import Anasco from "../assets/maps/anasco.png";
import Arecibo from "../assets/maps/arecibo.png";
import Arroyo from "../assets/maps/arroyo.png";
import Barceloneta from "../assets/maps/barceloneta.png";
import Barranquitas from "../assets/maps/barranquitas.png";
import Bayamon from "../assets/maps/bayamon.png";
import CaboRojo from "../assets/maps/caborojo.png";
import Caguas from "../assets/maps/caguas.png";
import Camuy from "../assets/maps/camuy.png";
import Canovanas from "../assets/maps/canovanas.png";
import Carolina from "../assets/maps/carolina.png";
import Catano from "../assets/maps/catano.png";
import Cayey from "../assets/maps/cayey.jpg";
import Ceiba from "../assets/maps/ceiba.png";
import Ciales from "../assets/maps/ciales.png";
import Cidra from "../assets/maps/cidra.png";
import Coamo from "../assets/maps/coamo.png";
import Comerio from "../assets/maps/comerio.png";
import Corozal from "../assets/maps/corozal.png";
import Dorado from "../assets/maps/dorado.png";
import Fajardo from "../assets/maps/fajardo.png";
import Florida from "../assets/maps/florida.png";
import Guanica from "../assets/maps/guanica.png";
import Guayama from "../assets/maps/guayama.png";
import Guayanilla from "../assets/maps/guayanilla.png";
import Guaynabo from "../assets/maps/guaynabo.png";
import Gurabo from "../assets/maps/gurabo.png";
import Hatillo from "../assets/maps/hatillo.png";
import Hormigueros from "../assets/maps/hormigueros.png";
import Humacao from "../assets/maps/humacao.png";
import Isabela from "../assets/maps/isabela.png";
import Jayuya from "../assets/maps/jayuya.png";
import JuanaDiaz from "../assets/maps/juanadiaz.png";
import Juncos from "../assets/maps/juncos.png";
import Lajas from "../assets/maps/lajas.png";
import Lares from "../assets/maps/lares.png";
import LasMarias from "../assets/maps/lasmarias.png";
import LasPiedras from "../assets/maps/laspiedras.png";
import Loiza from "../assets/maps/loiza.png";
import Luquillo from "../assets/maps/luquillo.png";
import Manati from "../assets/maps/manati.png";
import Maricao from "../assets/maps/maricao.png";
import Maunabo from "../assets/maps/maunabo.png";
import Mayaguez from "../assets/maps/mayaguez.png";
import Moca from "../assets/maps/moca.png";
import Morovis from "../assets/maps/morovis.png";
import Naguabo from "../assets/maps/naguabo.png";
import Naranjito from "../assets/maps/naranjito.png";
import Orocovis from "../assets/maps/orocovis.png";
import Patillas from "../assets/maps/patillas.png";
import Penuelas from "../assets/maps/penuelas.png";
import Ponce from "../assets/maps/ponce.png";
import Quebradillas from "../assets/maps/quebradillas.png";
import Rincon from "../assets/maps/rincon.png";
import RioGrande from "../assets/maps/rio grande.png";
import SabanaGrande from "../assets/maps/sabanagrande.png";
import Salinas from "../assets/maps/salinas.png";
import SanGerman from "../assets/maps/sangerman.png";
import SanJuan from "../assets/maps/sanjuan.png";
import SanLorenzo from "../assets/maps/sanlorenzo.png";
import SanSebastian from "../assets/maps/sansebastian.png";
import SantaIsabel from "../assets/maps/santaisabel.png";
import ToaAlta from "../assets/maps/toaalta.png";
import ToaBaja from "../assets/maps/toabaja.png";
import TrujilloAlto from "../assets/maps/trujilloalto.png";
import Utuado from "../assets/maps/utuado.png";
import VegaAlta from "../assets/maps/vegaalta.png";
import VegaBaja from "../assets/maps/vegabaja.png";
import Villalba from "../assets/maps/villalba.png";
import Yabucoa from "../assets/maps/yabucoa.png";
import Yauco from "../assets/maps/yauco.png";

const municipalityPng = {
  Adjuntas: Adjuntas,
  Aguada: Aguada,
  Aguadilla: Aguadilla,
  "Aguas Buenas": AguasBuenas,
  Aibonito: Aibonito,
  Añasco: Anasco,
  Arecibo: Arecibo,
  Arroyo: Arroyo,
  Barceloneta: Barceloneta,
  Barranquitas: Barranquitas,
  Bayamón: Bayamon,
  "Cabo Rojo": CaboRojo,
  Caguas: Caguas,
  Camuy: Camuy,
  Canóvanas: Canovanas,
  Carolina: Carolina,
  Cataño: Catano,
  Cayey: Cayey,
  Ceiba: Ceiba,
  Ciales: Ciales,
  Cidra: Cidra,
  Coamo: Coamo,
  Comerío: Comerio,
  Corozal: Corozal,
  Dorado: Dorado,
  Fajardo: Fajardo,
  Florida: Florida,
  Guánica: Guanica,
  Guayama: Guayama,
  Guayanilla: Guayanilla,
  Guaynabo: Guaynabo,
  Gurabo: Gurabo,
  Hatillo: Hatillo,
  Hormigueros: Hormigueros,
  Humacao: Humacao,
  Isabela: Isabela,
  Jayuya: Jayuya,
  "Juana Díaz": JuanaDiaz,
  Juncos: Juncos,
  Lajas: Lajas,
  Lares: Lares,
  "Las Marías": LasMarias,
  "Las Piedras": LasPiedras,
  Loíza: Loiza,
  Luquillo: Luquillo,
  Manatí: Manati,
  Maricao: Maricao,
  Maunabo: Maunabo,
  Mayagüez: Mayaguez,
  Moca: Moca,
  Morovis: Morovis,
  Naguabo: Naguabo,
  Naranjito: Naranjito,
  Orocovis: Orocovis,
  Patillas: Patillas,
  Peñuelas: Penuelas,
  Ponce: Ponce,
  Quebradillas: Quebradillas,
  Rincón: Rincon,
  "Río Grande": RioGrande,
  "Sabana Grande": SabanaGrande,
  Salinas: Salinas,
  "San Germán": SanGerman,
  "San Juan": SanJuan,
  "San Lorenzo": SanLorenzo,
  "San Sebastián": SanSebastian,
  "Santa Isabel": SantaIsabel,
  "Toa Alta": ToaAlta,
  "Toa Baja": ToaBaja,
  "Trujillo Alto": TrujilloAlto,
  Utuado: Utuado,
  "Vega Alta": VegaAlta,
  "Vega Baja": VegaBaja,
  Villalba: Villalba,
  Yabucoa: Yabucoa,
  Yauco: Yauco,
};

export default function InteractiveMunicipalityMap() {
  const [data, setData] = useState(null);
  const [activeMunicipality, setActiveMunicipality] = useState(null);

  useEffect(() => {
    fetch("./public/puerto-rico-municipalities.geojson")
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  const baseStyle = {
    color: "#ffffffff",
    weight: 1,
    fillColor: "#000000ff",
    fillOpacity: 0.3,
  };

  const highlightStyle = {
    ...baseStyle,
    fillColor: "#009100ff",
    fillOpacity: 0.8,
    weight: 2,
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.NOMBRE;

    layer.setStyle(baseStyle);

    layer.on({
      click: () => {
        setActiveMunicipality({
          name,
          properties: feature.properties,
        });
      },
      mouseover: () => layer.setStyle(highlightStyle),
      mouseout: () => layer.setStyle(baseStyle),
    });
  };

  return (
    <>
      <MapContainer
        center={[18.2, -66.4]}
        zoom={window.innerWidth < 600 ? 8 : 9}
        minZoom={7}
        maxZoom={14}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        style={{ height: "600px", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
        />
        {data && <GeoJSON data={data} onEachFeature={onEachFeature} />}

        <CustomZoomButtons />
      </MapContainer>

      {activeMunicipality && (
        <MunicipalityModal
          municipality={activeMunicipality}
          onClose={() => setActiveMunicipality(null)}
        />
      )}
    </>
  );
}

function CustomZoomButtons() {
  const map = useMap();

  return (
    <div className="municipality-zoom-controls">
      <button onClick={() => map.zoomIn()} className="zoom-btn">+</button>
      <button onClick={() => map.zoomOut()} className="zoom-btn">−</button>
    </div>
  );
}

function MunicipalityModal({ municipality, onClose }) {
  const name = municipality.name;
  const image = municipalityPng[name];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>{name}</h2>

        {image ? (
          <img src={image} alt={name} className="modal-image" />
        ) : (
          <p>No preview available</p>
        )}

        <div className="modal-buttons">
          {image && (
            <a 
              href={image}
              download={`${name}.png`}
              className="modal-button"
            >
              Descargar PNG
            </a>
          )}

          {image && (
            <a
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-button secondary"
            >
              Ver en pantalla completa
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

