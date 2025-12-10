import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet"; // Added Tooltip here
import L from "leaflet";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "leaflet/dist/leaflet.css";
import "../styles/Stations.css";

const BASE_DOMAIN = `${import.meta.env.VITE_API_URL}`;
const BASE_STATIONS_URL = BASE_DOMAIN + "/stations";
const getHistoryUrl = (stationId) => `${BASE_STATIONS_URL}/history/${stationId}/wc`;
const getSensorImageUrl = (stationId) => `${BASE_STATIONS_URL}/${stationId}/image/sensor`;

/* --- MAP ICONS --- */
const createSaturationIcon = (saturation) => {
    let className = "map-marker saturation";
    if (saturation >= 90) className += " high";
    else if (saturation >= 80) className += " medium";
    else className += " low";

    return L.divIcon({
        html: `<div class="${className}">${Math.round(saturation)}%</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

const createPrecipIcon = (precip) => {
    let bgColor = "#DADADA";
    if (precip > 8.0) bgColor = "#000066";
    else if (precip >= 0.01) bgColor = "#9FEAFF";

    return L.divIcon({
        html: `<div class="map-marker precip" style="background-color:${bgColor};">${Number(precip).toFixed(2)}"</div>`,
        className: "",
        iconSize: [45, 25],
        iconAnchor: [22, 12],
    });
};

const createStatusIcon = (color) => {
    return L.divIcon({
        className: "",
        html: `<div class="map-marker status" style="background-color: ${color};"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
};

/* --- MAP COMPONENT --- */
const StationsMap = ({ stations, selectedMetric, onStationSelect, selectedStationId }) => {

    // REMOVED: The useEffect hook that used map.flyTo() is gone.
    // The map will no longer move when selectedStationId changes.

    const getStatusColor = (station) => {
        if (station.last_updated) {
            const lastUpdate = new Date(station.last_updated.replace(" ", "T"));
            const diffHours = (new Date() - lastUpdate) / (1000 * 60 * 60);
            if (diffHours >= 12) return "#6c757d"; // Offline
            if (diffHours >= 1) return "#ffc107"; // Warning
        }
        if (station.soil_saturation != null) return "#28a745"; // Online
        return "#6c757d";
    };

    return (
        <>
            <TileLayer
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
            />
            {stations.map((station) => {
                if (station.is_available !== 1 || !station.latitude) return null;

                let icon;
                if (selectedMetric === 'saturation' && station.soil_saturation != null) {
                    icon = createSaturationIcon(station.soil_saturation);
                } else if (selectedMetric === 'rainfall' && station.precipitation != null) {
                    icon = createPrecipIcon(station.precipitation);
                } else {
                    icon = createStatusIcon(getStatusColor(station));
                }

                const isSelected = selectedStationId === station.station_id;

                return (
                    <Marker
                        key={station.station_id}
                        position={[station.latitude, station.longitude]}
                        icon={icon}
                        zIndexOffset={isSelected ? 1000 : 0}
                        eventHandlers={{
                            click: () => onStationSelect(station),
                        }}
                    >
                        {/* ADDED: Tooltip for Hover Name */}
                        <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{station.city}</span>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
};

/* --- CHART COMPONENT --- */
const StationChart = ({ station, sensorIndex }) => {
    const [chartOptions, setChartOptions] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!station) return;
        setLoading(true);

        fetch(getHistoryUrl(station.station_id))
            .then(res => res.json())
            .then(data => {
                const wcKey = `wc${sensorIndex}`;
                const historyData = data.history || [];

                const seriesData = historyData
                    .map(item => {
                        const val = item[wcKey];
                        return val !== undefined ? [new Date(item.timestamp).getTime(), parseFloat(val)] : null;
                    })
                    .filter(item => item !== null);

                if (seriesData.length === 0) {
                    setChartOptions(null);
                } else {
                    const vals = seriesData.map(i => i[1]);
                    const min = Math.min(...vals);
                    const max = Math.max(...vals);
                    const padding = (max - min) * 0.1 || 0.05;

                    setChartOptions({
                        title: { text: '' },
                        chart: { type: 'spline', backgroundColor: 'transparent', height: 300 },
                        xAxis: { type: 'datetime', lineColor: '#000', tickColor: '#000' },
                        yAxis: {
                            title: { text: 'VWC (m³/m³)' },
                            min: Math.max(0, min - padding),
                            max: Math.min(1, max + padding),
                            gridLineColor: '#e0e0e0'
                        },
                        series: [{
                            name: `Sensor ${sensorIndex}`,
                            data: seriesData,
                            color: '#3B7D23',
                            lineWidth: 2,
                            marker: { enabled: false, states: { hover: { enabled: true } } }
                        }],
                        legend: { enabled: false },
                        credits: { enabled: false }
                    });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [station, sensorIndex]);

    if (loading) return <div className="panel-msg">Cargando datos...</div>;
    if (!chartOptions) return <div className="panel-msg">No hay datos recientes para este sensor.</div>;

    return <HighchartsReact highcharts={Highcharts} options={chartOptions} />;
};

/* --- MAIN PAGE --- */
function Stations() {
    const [stations, setStations] = useState([]);
    const [mapMetric, setMapMetric] = useState("status");
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedSensor, setSelectedSensor] = useState(1);
    const [activeTab, setActiveTab] = useState("data");

    useEffect(() => {
        fetch(BASE_STATIONS_URL)
            .then((res) => res.json())
            .then((data) => setStations(data))
            .catch((err) => console.error(err));
    }, []);

    const handleStationSelect = (station) => {
        setSelectedStation(station);
        // Map stays still, panel updates
    };

    return (
        <div className="stations-page">
            <h1 className="page-title">Estaciones</h1>
            <p className="page-intro">
                Seleccione una estación en el mapa para ver su contenido de agua histórico y detalles técnicos.
            </p>

            <div className="dashboard-container">

                {/* LEFT: MAP */}
                <div className="map-panel">
                    <div className="panel-controls">
                        <label>Mostrar:</label>
                        <select
                            value={mapMetric}
                            onChange={(e) => setMapMetric(e.target.value)}
                            className="clean-select"
                        >
                            <option value="status">Estado del Sensor</option>
                            <option value="saturation">Saturación del Suelo</option>
                            <option value="rainfall">Lluvia (12hr)</option>
                        </select>
                    </div>
                    <div className="map-wrapper">
                        <MapContainer
                            center={[18.220833, -66.420149]}
                            zoom={10} /* Keeps your Zoom In preference */
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                            scrollWheelZoom={false}
                            doubleClickZoom={false}
                            touchZoom={false}
                            boxZoom={false}
                            keyboard={false}
                            dragging={true}
                        >
                            <StationsMap
                                stations={stations}
                                selectedMetric={mapMetric}
                                onStationSelect={handleStationSelect}
                                selectedStationId={selectedStation?.station_id}
                            />
                        </MapContainer>
                    </div>
                </div>

                {/* RIGHT: DETAILS SIDEBAR */}
                <div className="details-panel">
                    {!selectedStation ? (
                        <div className="empty-state">
                            <h3>Selecciona una estación</h3>
                            <p>Haz clic en un marcador para ver datos.</p>
                        </div>
                    ) : (
                        <>
                            <div className="details-header">
                                <h2>{selectedStation.city}</h2>
                            </div>

                            <div className="details-tabs">
                                <button
                                    className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('data')}
                                >
                                    Datos
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('info')}
                                >
                                    Información
                                </button>
                            </div>

                            <div className="details-content">
                                {activeTab === 'data' && (
                                    <div className="data-view">
                                        <div className="sensor-toggles">
                                            {[1, 2, 3, 4].map(num => (
                                                <button
                                                    key={num}
                                                    className={`sensor-btn ${selectedSensor === num ? 'active' : ''}`}
                                                    onClick={() => setSelectedSensor(num)}
                                                >
                                                    Sensor {num}
                                                </button>
                                            ))}
                                        </div>
                                        <StationChart station={selectedStation} sensorIndex={selectedSensor} />
                                    </div>
                                )}

                                {activeTab === 'info' && (
                                    <div className="info-view">
                                        <div className="station-img-container">
                                            {selectedStation.sensor_image_url ? (
                                                <img
                                                    src={getSensorImageUrl(selectedStation.station_id)}
                                                    alt={selectedStation.city}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            ) : (
                                                <div className="no-img">Imagen no disponible</div>
                                            )}
                                        </div>
                                        <ul className="meta-list">
                                            <li><strong>Unidad Geológica:</strong> {selectedStation.geological_unit || "N/A"}</li>
                                            <li><strong>Unidad de Suelo:</strong> {selectedStation.land_unit || "N/A"}</li>
                                            <li><strong>Elevación:</strong> {selectedStation.elevation || "N/A"}</li>
                                            <li><strong>Pendiente:</strong> {selectedStation.slope || "N/A"}</li>
                                            <li><strong>Colaborador:</strong> {selectedStation.collaborator || "N/A"}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* STATIC INFO (Footer) */}
            <div className="stations-footer">
                <div className="footer-col">
                    <h3>Sobre los Sensores</h3>
                    <p>Cada estación mide contenido volumétrico de agua (VWC), presión, temperatura y lluvia. Los datos se transmiten cada hora entre las 7:00 y las 20:00 AST.</p>
                </div>
                <div className="footer-col">
                    <h3>Glosario de Datos</h3>
                    <ul>
                        <li><strong>VWC:</strong> Relación entre volumen de agua y suelo.</li>
                        <li><strong>Succión:</strong> Presión negativa de los poros.</li>
                        <li><strong>Piezómetro:</strong> Nivel de agua subterránea.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Stations;