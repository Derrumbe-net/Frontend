import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import "../styles/InteractiveMunicipalityMap_module.css";
// NOTE: municipalityPng is no longer needed here as the modal logic moved to the parent

// This component is purely for the map display and passing click events up.
// It accepts onMunicipalityClick prop.
export default function InteractiveMunicipalityMap({ onMunicipalityClick }) {
    const [data, setData] = useState(null);
    // Removed activeMunicipality state

    useEffect(() => {
        // Ensure the path is correct for your project structure
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
            // FIX: Use the prop to notify the parent component of the click
            click: () => {
                if (onMunicipalityClick) {
                    onMunicipalityClick({
                        name,
                        properties: feature.properties,
                    });
                }
            },
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle(highlightStyle);
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(baseStyle);
            },
        });
    };

    return (
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
        // FIX: Removed the rendering of MunicipalityModal here
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