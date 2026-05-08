import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

export default function LandslideReadyMap({ completedMunicipalities = [] }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch("/puerto-rico-municipalities.geojson")
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error("GeoJSON load error:", err));
    }, []);

    const getStyle = (feature) => {
        const name = feature.properties.NOMBRE;
        const isCompleted = completedMunicipalities.some(m => m.name === name);

        return {
            color: "#ffffff",
            weight: 1,
            fillColor: isCompleted ? "#cc0000" : "#888888",
            fillOpacity: isCompleted ? 0.85 : 0.3,
        };
    };

    const onEachFeature = (feature, layer) => {
        const name = feature.properties.NOMBRE;
        const municipalityData = completedMunicipalities.find(m => m.name === name);

        const baseStyle = () => getStyle(feature);

        const highlightStyle = {
            color: "#ffffff",
            weight: 2,
            fillColor: municipalityData ? "#ff4444" : "#aaaaaa",
            fillOpacity: municipalityData ? 1 : 0.5,
        };

        // Show tooltip for municipalities with completed status
        if (municipalityData) {
            const tooltipContent = `
                <div style="font-family: Inter, sans-serif; padding: 4px 2px;">
                    <strong style="font-size: 0.95rem;">${name}</strong><br/>
                    <span style="font-size: 0.8rem; color: #555;">
                        Año de Inicio: ${municipalityData.start_year ?? "—"}
                    </span>
                </div>
            `;
            layer.bindTooltip(tooltipContent, {
                direction: "top",
                opacity: 0.95,
                className: "municipality-tooltip"
            });
        }

        layer.on({
            mouseover: (e) => {
                e.target.setStyle(highlightStyle);
                if (municipalityData) e.target.openTooltip();
                e.target.bringToFront();
            },
            mouseout: (e) => {
                e.target.setStyle(baseStyle());
                e.target.closeTooltip();
            },
        });
    };

    return (
        <MapContainer
            center={[18.2, -66.4]}
            zoom={window.innerWidth < 600 ? 8 : 9}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={true}
            zoomControl={false}
            touchZoom={false}
            keyboard={false}
            style={{ height: "300px", width: "100%", borderRadius: "8px", cursor: "default" }}
        >
            <TileLayer
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
            />
            {data && <GeoJSON data={data} style={getStyle} onEachFeature={onEachFeature} />}
        </MapContainer>
    );
}