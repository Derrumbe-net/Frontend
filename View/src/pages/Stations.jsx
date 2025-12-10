import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "leaflet/dist/leaflet.css";
import "../styles/Stations.css";
import stationSchematic from "../assets/station_schematic.png";

import Cookies from 'js-cookie'; 
const BASE_DOMAIN = `${import.meta.env.VITE_API_URL}`;
const BASE_STATIONS_URL = BASE_DOMAIN + "/stations";
const getHistoryUrl = (stationId) => `${BASE_STATIONS_URL}/history/${stationId}/wc`;
const getSensorImageUrl = (stationId) => `${BASE_STATIONS_URL}/${stationId}/image/sensor`;

const getDataImageUrl = (stationId) => `${BASE_STATIONS_URL}/${stationId}/image/data`;

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
    // --- COOKIE CONFIGURATION ---
    const COOKIE_NAME = 'stations_dashboard_settings';

    // Helper: Safely get cookie
    const getSavedSettings = () => {
        try {
            const saved = Cookies.get(COOKIE_NAME);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn("Error parsing station cookies", e);
            return {};
        }
    };

    const savedSettings = getSavedSettings();

    // --- STATE MANAGEMENT ---
    const [stations, setStations] = useState([]);
    const [activeTab, setActiveTab] = useState("data");

    // Load these from cookie or use default
    const [mapMetric, setMapMetric] = useState(savedSettings.mapMetric ?? "status");
    const [selectedStation, setSelectedStation] = useState(savedSettings.selectedStation ?? null);
    const [selectedSensor, setSelectedSensor] = useState(savedSettings.selectedSensor ?? 1);

    // --- EFFECT: SAVE TO COOKIES ON CHANGE ---
    useEffect(() => {
        const settingsToSave = {
            mapMetric,
            selectedStation,
            selectedSensor
        };
        // Save to cookie (Expires in 30 days)
        Cookies.set(COOKIE_NAME, JSON.stringify(settingsToSave), { expires: 30 });
    }, [mapMetric, selectedStation, selectedSensor]);

    useEffect(() => {
        fetch(BASE_STATIONS_URL)
            .then((res) => res.json())
            .then((data) => setStations(data))
            .catch((err) => console.error(err));
    }, []);

    const handleStationSelect = (station) => {
        setSelectedStation(station);
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
                            zoom={10}
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
                                <button
                                    className={`tab-btn ${activeTab === 'graphic' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('graphic')}
                                >
                                    Gráfico
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
                                {activeTab === 'graphic' && (
                                    <div className="info-view">
                                        <div className="station-grafico-img-container">
                                            {selectedStation.data_image_url ? (
                                                <img
                                                    src={getDataImageUrl(selectedStation.station_id)}
                                                    alt={`Gráfico de datos de ${selectedStation.city}`}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            ) : (
                                                <div className="no-img">Gráfico no disponible</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- FOOTER: 2 COLUMNS --- */}
            <div className="stations-footer">
                <div className="footer-layout-wrapper">

                    {/* LEFT COL: All Text Information */}
                    <div className="footer-text-column">
                        <h2>Sensores y equipos de la estación</h2>
                        <p>
                            Cada estación de la Red de Pronóstico de Deslizamientos de Tierra de Puerto Rico incluye estaciones de monitoreo equipadas con sensores subterráneos que miden el contenido volumétrico de agua, la presión de succión del suelo, la temperatura del suelo y la presión del agua subterránea. Los sensores se instalan en un hoyo excavado a mano hasta la base del suelo, donde se encuentra material de lecho rocoso meteorizado.
                        </p>
                        <p>
                            El conjunto de sensores se instala a intervalos de 0.25d, 0.50d, 0.75d y 1.00d, donde "d" es la profundidad total del perfil del suelo. La distribución de los sensores se muestra en el diagrama adjunto.
                        </p>
                        <p>
                            Los sensores sobre el suelo miden la temperatura del aire, la presión barométrica y la lluvia. Cada estación está controlada por un registrador de datos que recopila datos cada 5 minutos y transmite datos cada hora a través de un módem celular a nuestro servidor local entre las 7:00 y las 20:00 AST. Debido a que las estaciones funcionan con energía solar y batería, los datos generalmente no se transmiten durante la noche para ahorrar energía.
                        </p>

                        <h2 className="secondary-footer-header">Datos de la estación</h2>
                        <p>
                            Los datos medidos incluyen el contenido volumétrico de agua, la succión del suelo, el nivel de agua subterránea, la temperatura del suelo, la temperatura del aire, la presión barométrica y la lluvia.
                        </p>

                        <ul className="glossary-list">
                            <li>
                                <strong>El contenido volumétrico de agua (VWC)</strong> es la relación entre el volumen de agua y el volumen total del suelo. Los valores normalmente no superan los 0,5 cm³/cm³. El contenido volumétrico de agua se puede utilizar para calcular la saturación del suelo.
                            </li>
                            <li>
                                <strong>La succión del suelo</strong> es la presión negativa de los poros dentro del suelo. Cuando la presión de los poros del suelo es positiva, no hay succión. Nuestros sensores solo miden presiones negativas de hasta 0 kPa. Cuando los sensores leen ~0 kPa, la presión de los poros del suelo podría ser positiva.
                            </li>
                            <li>
                                <strong>El nivel de agua subterránea del suelo</strong> se mide con un piezómetro de cuerda vibrante. El piezómetro mide la presión del agua subterránea por encima de su posición. Las unidades informadas están en centímetros de agua. Las lecturas del piezómetro se corrigen según las variaciones de presión atmosférica del barómetro sobre el suelo.
                            </li>
                            <li>
                                <strong>La temperatura del suelo</strong> también se mide con nuestro instrumento piezómetro. Las unidades informadas son grados Celsius.
                            </li>
                            <li>
                                <strong>La temperatura del aire</strong> se mide con un termómetro situado sobre la superficie. Las unidades que se indican son grados Celsius. Los valores de temperatura del aire que se indican pueden ser excesivamente altos si el sensor está expuesto directamente al sol.
                            </li>
                            <li>
                                <strong>La presión atmosférica</strong> se mide con un barómetro situado sobre la superficie.
                            </li>
                            <li>
                                <strong>La cantidad y la tasa de lluvia</strong> se miden con un pluviómetro de cubeta basculante. Las unidades que se indican son milímetros.
                            </li>
                        </ul>
                    </div>

                    {/* RIGHT COL: Image Only */}
                    <div className="footer-image-column">
                        <img src={stationSchematic} alt="Esquema de sensores de la estación" className="schematic-img" />
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Stations;