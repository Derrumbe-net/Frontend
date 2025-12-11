import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import "../styles/InteractiveMunicipalityMap_module.css";

export default function InteractiveMunicipalityMap() {
  const [data, setData] = useState(null);

    useEffect(() => {
        fetch("/puerto-rico-municipalities.geojson")
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error("GeoJSON load error:", err));
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
      click: () => onSelectMunicipality(name),
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

// function MunicipalityModal({ municipality, onClose }) {
//   const name = municipality.name;
//   const image = municipalityPng[name];

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-container" onClick={(e) => e.stopPropagation()}>
//         <button className="modal-close" onClick={onClose}>×</button>

//         <h2>{name}</h2>

//         {image ? (
//           <img src={image} alt={name} className="modal-image" />
//         ) : (
//           <p>No preview available</p>
//         )}

//         <div className="modal-buttons">
//           {image && (
//             <a 
//               href={image}
//               download={`${name}.png`}
//               className="modal-button"
//             >
//               Descargar PNG
//             </a>
//           )}

//           {image && (
//             <a
//               href={image}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="modal-button secondary"
//             >
//               Ver en pantalla completa
//             </a>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

