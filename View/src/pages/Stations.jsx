import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import * as EL from "esri-leaflet";
import L from "leaflet";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "leaflet/dist/leaflet.css";
import "../styles/Stations.css";

// --- CONSTANTS ---
const BASE_STATIONS_URL = "http://localhost:8080/api/stations";
// const BASE_STATIONS_URL = "https://derrumbe-test.derrumbe.net/api/stations";
const createSaturationIcon = (saturation) => {
    let className = "saturation-marker";
    if (saturation >= 90) className += " high";
    else if (saturation >= 80) className += " medium";
    else className += " low";

    return L.divIcon({
        html: `<div style="background-color: ${saturation > 80 ? 'blue' : 'green'}; color: white; padding: 2px; border-radius: 4px; text-align: center; border: 1px solid white;">${Math.round(saturation)}%</div>`,
        className: "",
        iconSize: [40, 25],
        iconAnchor: [20, 12],
    });
};

const getPrecipColor = (p) => {
    if (p > 8.0) return "#000066";
    if (p >= 0.01) return "#9FEAFF";
    return "#DADADA";
};

const createPrecipIcon = (precip) => {
    const color = getPrecipColor(precip);
    return L.divIcon({
        html: `<div style="background-color:${color}; color: black; font-weight:bold; padding: 2px; border:1px solid #333; text-align: center;">${Number(precip).toFixed(2)}"</div>`,
        className: "",
        iconSize: [55, 30],
        iconAnchor: [27, 15],
    });
};

const createStatusIcon = (color) => {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        background-color: ${color};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
    `,
        iconSize: [22, 22],   // Size of the div
        iconAnchor: [11, 11], // Center the circle (half of size)
        popupAnchor: [0, -12] // Popup appears slightly above
    });
};

const StationsMap = ({ selectedMetric, onStationSelect, selectedStationId }) => {
    const [stations, setStations] = useState([]);
    const center = [18.220833, -66.420149];

    useEffect(() => {
        fetch(BASE_STATIONS_URL)
            .then((res) => res.json())
            .then((data) => setStations(data))
            .catch((err) => console.error("Fetch error:", err));
    }, []);

    const getStatusColor = (station) => {
        if (selectedStationId === station.station_id) {
            return "#ff0000"; // Red
        }
        if (station.last_updated) {
            const dateString = station.last_updated.replace(" ", "T");
            const lastUpdate = new Date(dateString);
            const now = new Date();
            console.log("Last Updated", lastUpdate);
            console.log("Now", now);
            const diffMs = now - lastUpdate;
            const diffHours = diffMs / (1000 * 60 * 60);
            console.log("Difference", diffHours);
            if (diffHours >= 12) {
                return "#6c757d";
            }
            else if (diffHours >= 1) {
                return "#ffc107";
            }
        }

        if (station.soil_saturation !== null && station.soil_saturation !== undefined) {
            return "#28a745"; // Green
        }

        return "#6c757d";
    };

    return (
        <MapContainer
            center={center}
            zoom={9}
            style={{ height: "100%", width: "100%" }}

            // 1. Remove the +/- buttons
            zoomControl={false}

            // 2. Disable Mouse/Touch Zoom interactions
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}

            // 3. Disable Keyboard shortcuts (+/- keys)
            keyboard={false}

            // Optional: If you also want to prevent moving/panning the map, set this to false:
            dragging={true}
        >
            <TileLayer
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
            />

            {stations.map((station) => {
                if (station.is_available !== 1) return null;

                let icon;

                if (selectedMetric === 'status') {
                    const color = getStatusColor(station);
                    icon = createStatusIcon(color);
                }
                else if (selectedMetric === 'saturation' && station.soil_saturation != null) {
                    icon = createSaturationIcon(station.soil_saturation);
                }
                else if (selectedMetric === 'rainfall' && station.precipitation != null) {
                    icon = createPrecipIcon(station.precipitation);
                }
                else {
                    const color = getStatusColor(station);
                    icon = createStatusIcon(color);
                }

                return (
                    <Marker
                        key={station.station_id}
                        position={[station.latitude, station.longitude]}
                        icon={icon}
                        eventHandlers={{
                            click: () => {
                                onStationSelect(station);
                            },
                        }}
                    >
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

// --- SUB-COMPONENT: Chart Logic ---
const StationChart = ({ station, sensorIndex }) => {
    const [chartOptions, setChartOptions] = useState({});

    useEffect(() => {
        if (!station) return;

        // --- MOCK DATA GENERATION ---
        // TODO fetch(`${BASE_STATIONS_URL}/${station.id}/history?sensor=${sensorIndex}`)

        const generateData = () => {
            const data = [];
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1); // 1 year ago

            for (let i = 0; i < 365; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                // Random value between 10 and 40 (simulating VWC %)
                // Adding a sine wave to simulate seasonality
                const value = 20 + Math.sin(i / 30) * 10 + Math.random() * 5;
                data.push([date.getTime(), parseFloat(value.toFixed(2))]);
            }
            return data;
        };

        const seriesData = generateData();

        setChartOptions({
            title: {
                text: `Water Content - ${station.city}`
            },
            subtitle: {
                text: `Sensor #${sensorIndex} (Historical Data)`
            },
            xAxis: {
                type: 'datetime',
                title: { text: 'Time (Year)' }
            },
            yAxis: {
                title: { text: 'Water Content (%)' },
                min: 0,
                max: 60
            },
            series: [
                {
                    name: `Sensor ${sensorIndex}`,
                    data: seriesData,
                    color: '#007bff',
                    tooltip: {
                        valueSuffix: ' %'
                    }
                }
            ],
            chart: {
                type: 'spline',
                height: null,
            },
            credits: { enabled: false }
        });
    }, [station, sensorIndex]);

    if (!station) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p className="text-muted">Select a station from the map to view data.</p>
            </div>
        );
    }

    return <HighchartsReact highcharts={Highcharts} options={chartOptions} containerProps={{ style: { height: "100%" } }} />;
};

// --- MAIN COMPONENT ---
function Stations() {
    const [mapMetric, setMapMetric] = useState("status");
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedSensor, setSelectedSensor] = useState(1);

    return (
        <div className="stations-container">
            <h1>Estaciones</h1>
            <p>Seleccione una estación en el mapa para ver su contenido de agua histórico.</p>

            <div className="stations-layout">

                {/* LEFT COLUMN */}
                <div className="map-column">
                    <div className="map-controls">
                        <label htmlFor="metric-select"><strong>Mostrar en mapa:</strong></label>
                        <select
                            id="metric-select"
                            value={mapMetric}
                            onChange={(e) => setMapMetric(e.target.value)}
                        >
                            <option value="status">Estado del Sensor (Status)</option>
                            <option value="saturation">Saturación del Suelo</option>
                            <option value="rainfall">Lluvia (Últimas 12hr)</option>
                        </select>
                    </div>

                    <div className="stations-map-wrapper">
                        <StationsMap
                            selectedMetric={mapMetric}
                            onStationSelect={setSelectedStation}
                            selectedStationId={selectedStation ? selectedStation.station_id : null}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: CHART */}
                <div className="chart-column">
                    <div className="chart-controls">
                        <label htmlFor="sensor-select"><strong>Seleccionar Sensor:</strong></label>
                        <select
                            id="sensor-select"
                            value={selectedSensor}
                            onChange={(e) => setSelectedSensor(parseInt(e.target.value))}
                            disabled={!selectedStation}
                        >
                            <option value={1}>Sensor de Humedad 1</option>
                            <option value={2}>Sensor de Humedad 2</option>
                            <option value={3}>Sensor de Humedad 3</option>
                            <option value={4}>Sensor de Humedad 4</option>
                        </select>
                        {selectedStation && (
                            <span style={{marginLeft: '15px', color: '#666'}}>
                Viendo: <strong>{selectedStation.city}</strong>
              </span>
                        )}
                    </div>

                    <StationChart
                        station={selectedStation}
                        sensorIndex={selectedSensor}
                    />
                </div>

            </div>
        </div>
    );
}

export default Stations;