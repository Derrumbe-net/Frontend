import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import * as EL from "esri-leaflet";
import L from "leaflet";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "leaflet/dist/leaflet.css";
import "../styles/Stations.css";

// const BASE_STATIONS_URL = "http://localhost:8080/api/stations";
const BASE_STATIONS_URL = "https://derrumbe-test.derrumbe.net/api/stations";

const getHistoryUrl = (stationId) => `${BASE_STATIONS_URL}/history/${stationId}/wc`;

const createSaturationIcon = (saturation) => {
    let className = "saturation-marker";
    if (saturation >= 90) className += " high";
    else if (saturation >= 80) className += " medium";
    else className += " low";

    const rounded = Math.round(saturation);

    return L.divIcon({
        // The HTML structure is changed to match the .saturation-marker CSS from InteractiveMap.css
        html: `<div class="${className}">${rounded}%</div>`,
        className: "", // Clear the default L.divIcon class name
        iconSize: [55, 30], // Increased size to match the new style
        iconAnchor: [27, 15], // Adjusted anchor to center the new size
    });
};

const getPrecipColor = (p) => {
    if (p > 8.0) return "#000066";
    if (p >= 0.01) return "#9FEAFF";
    return "#DADADA";
};

const createPrecipIcon = (precip) => {
    const color = getPrecipColor(precip);
    const rounded = Number(precip).toFixed(2); // Keep the two decimal places

    return L.divIcon({
        html: `
            <div class="precip-marker" style="background-color:${color}; color: white; font-weight: bold;">
                ${rounded}"
            </div>
        `,
        className: "", // Clear the default L.divIcon class name
        iconSize: [55, 30], // Increased size to match the new style
        iconAnchor: [27, 15], // Adjusted anchor to center the new size
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
            return "#ff0000";
        }
        if (station.last_updated) {
            const dateString = station.last_updated.replace(" ", "T");
            const lastUpdate = new Date(dateString);
            const now = new Date();
            const diffMs = now - lastUpdate;
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours >= 12) {
                return "#6c757d";
            }
            else if (diffHours >= 1) {
                return "#ffc107";
            }
        }

        if (station.soil_saturation !== null && station.soil_saturation !== undefined) {
            return "#28a745";
        }

        return "#6c757d";
    };

    return (
        <MapContainer
            center={center}
            zoom={9}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            dragging={true}
        >
            <TileLayer
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
            />

            {stations.map((station) => {
                if (station.is_available !== 1 || !station.latitude || !station.longitude) return null;

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

const StationChart = ({ station, sensorIndex }) => {
    const [chartOptions, setChartOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!station) return;

        const wcKey = `wc${sensorIndex}`;
        const apiUrl = getHistoryUrl(station.station_id);

        setLoading(true);
        setError(null);

        fetch(apiUrl)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                const historyData = data.history || [];

                const seriesData = historyData.map(item => {
                    const date = new Date(item.timestamp);
                    // Ensure the value exists and is a number
                    const value = item[wcKey] !== undefined ? parseFloat(item[wcKey]) : null;
                    return [date.getTime(), value];
                }).filter(item => item[1] !== null);

                // --- MODIFICATIONS START HERE ---
                let dataMin = 0;
                let dataMax = 1;

                if (seriesData.length > 0) {
                    // Extract all Y-values (water content percentages)
                    const yValues = seriesData.map(item => item[1]);

                    // Calculate the minimum and maximum data points
                    const min = Math.min(...yValues);
                    const max = Math.max(...yValues);

                    // Determine chart min/max with padding (e.g., 5% buffer)
                    const range = max - min;
                    const padding = range * 0.05; // 5% buffer on each side

                    // If the range is zero (all values are the same), use a fixed buffer
                    if (range === 0) {
                        dataMin = Math.max(0, min - 0.05); // Min is 0 or value - 0.05
                        dataMax = Math.min(1, max + 0.05); // Max is 1 or value + 0.05
                    } else {
                        dataMin = Math.max(0, min - padding); // Ensure min is not below 0
                        dataMax = Math.min(1, max + padding); // Ensure max is not above 1
                    }
                }
                // --- MODIFICATIONS END HERE ---

                setChartOptions({
                    title: {
                        text: `Contenido de Agua - ${station.city}`
                    },
                    subtitle: {
                        text: `Sensor #${sensorIndex} (Historical Data)`
                    },
                    xAxis: {
                        type: 'datetime',
                        title: { text: 'Tiempo (Día)' }
                    },
                    yAxis: {
                        title: { text: 'Contenido de Agua (%)' },
                        // Use calculated min/max values
                        min: dataMin,
                        max: dataMax
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
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fetch error for station history:", err);
                setError(`Error fetching data: ${err.message}`);
                setLoading(false);
            });
    }, [station, sensorIndex]);

    if (!station) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p className="text-muted">Seleccione una estación del mapa para ver datos históricos.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p>Cargando datos históricos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>
                <p>{error}</p>
            </div>
        );
    }

    if (!chartOptions.series || chartOptions.series[0].data.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p className="text-muted">No hay datos históricos disponibles para este sensor.</p>
            </div>
        );
    }

    return <HighchartsReact highcharts={Highcharts} options={chartOptions} containerProps={{ style: { height: "100%" } }} />;
};

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