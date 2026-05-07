import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

export default function LandslideReadyMap({ completedMunicipalities = [] }) {
    const [data, setData] = useState(null);

    // Fetch the GeoJSON for municipality borders
    useEffect(() => {
        fetch("/puerto-rico-municipalities.geojson")
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error("GeoJSON load error:", err));
    }, []);

    const getStyle = (feature) => {
        const name = feature.properties.NOMBRE;
        const isCompleted = completedMunicipalities.includes(name);

        return {
            color: "#ffffff",
            weight: 1,
            fillColor: isCompleted ? "#cc0000" : "#888888",
            fillOpacity: isCompleted ? 0.85 : 0.3,
        };
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
            {data && <GeoJSON data={data} style={getStyle} />}
        </MapContainer>
    );
}