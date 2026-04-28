import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import Highcharts from "highcharts";
import * as HighchartsMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import "leaflet/dist/leaflet.css";
import "../styles/Stations.css";
import stationSchematic from "../assets/station_schematic.png";
import Cookies from 'js-cookie';

// Initialize highcharts-more (enables arearange series type)
try {
    const init = HighchartsMore.default ?? HighchartsMore;
    if (typeof init === 'function') init(Highcharts);
} catch (e) {
    // already initialized or not needed
}

const BASE_DOMAIN = `${import.meta.env.VITE_API_URL}`;
const BASE_STATIONS_URL = BASE_DOMAIN + "/stations";
const BASE_LATEST_DATA_URL = BASE_DOMAIN + "/stations/latest";
// TODO Update with new sensor_readings route
const getHistoryUrl = (stationId) => `${BASE_STATIONS_URL}/history/${stationId}/wc`;
const getSensorImageUrl = (stationId) => `${BASE_STATIONS_URL}/item/${stationId}/image/sensor`;
const getDataImageUrl = (stationId) => `${BASE_STATIONS_URL}/item/${stationId}/image/data`;

const isMobile = window.innerWidth < 768;

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

    const validStations = Array.isArray(stations) ? stations : [];

    return (
        <>
            <TileLayer
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
            />
            {validStations.map((station) => {
                if ((station.is_available !== 1 && station.is_available !== true) || !station.latitude) return null;

                let icon;
                if (selectedMetric === 'saturation' && station.soil_saturation != null) {
                    icon = createSaturationIcon(station.soil_saturation);
                } else if (selectedMetric === 'rainfall' && station.precipitation != null) {
                    icon = createPrecipIcon(station.precipitation);
                } else {
                    icon = createStatusIcon(getStatusColor(station));
                }

                const stId = station.id || station.station_id;
                const isSelected = selectedStationId === stId;

                return (
                    <Marker
                        key={stId}
                        position={[station.latitude, station.longitude]}
                        icon={icon}
                        zIndexOffset={isSelected ? 1000 : 0}
                        eventHandlers={{
                            click: () => onStationSelect(station),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{station.name}</span>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
};

/* --- PERCENTILE BANDS & DATA --- */
const PERCENTILE_BANDS = [
    { label: 'D4 – Exceptionally Dry',  lo: 0,     hi: 2,     fill: '#4a0000' },
    { label: 'D3 – Extremely Dry',      lo: 2,     hi: 5,     fill: '#cc0000' },
    { label: 'D2 – Severely Dry',       lo: 5,     hi: 10,    fill: '#f77f00' },
    { label: 'D1 – Moderately Dry',     lo: 10,    hi: 20,    fill: '#f5c97a' },
    { label: 'D0 – Abnormally Dry',     lo: 20,    hi: 30,    fill: '#ffff00' },
    { label: 'Normal',                  lo: 30,    hi: 70,    fill: '#ffffff' },
    { label: 'Abnormally Wet',          lo: 70,    hi: 80,    fill: '#b3f0ff' },
    { label: 'Moderately Wet',          lo: 80,    hi: 90,    fill: '#66ccff' },
    { label: 'Severely Wet',            lo: 90,    hi: 95,    fill: '#0099ff' },
    { label: 'Extremely Wet',           lo: 95,    hi: 98,    fill: '#0044ff' },
    { label: 'Exceptionally Wet',       lo: 98,    hi: 100,   fill: '#1a00cc' },
];

const STATIC_PERCENTILES = {
    0:  { p0: 0.0500, p2: 0.0802, p5: 0.1072, p10: 0.1341, p20: 0.1665, p30: 0.1934, p50: 0.2419, p70: 0.2905, p80: 0.3174, p90: 0.3498, p95: 0.3767, p98: 0.4037, p100: 0.4300 },
    1:  { p0: 0.0200, p2: 0.0563, p5: 0.0929, p10: 0.1295, p20: 0.1734, p30: 0.2099, p50: 0.2758, p70: 0.3416, p80: 0.3782, p90: 0.4221, p95: 0.4586, p98: 0.4620, p100: 0.4800 },
    2:  { p0: 0.1200, p2: 0.1556, p5: 0.1833, p10: 0.2110, p20: 0.2443, p30: 0.2720, p50: 0.3220, p70: 0.3719, p80: 0.3996, p90: 0.4329, p95: 0.4606, p98: 0.4620, p100: 0.4800 },
    3:  { p0: 0.0700, p2: 0.1016, p5: 0.1460, p10: 0.1904, p20: 0.2437, p30: 0.2882, p50: 0.3682, p70: 0.4481, p80: 0.4620, p90: 0.4620, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    4:  { p0: 0.2000, p2: 0.2489, p5: 0.2744, p10: 0.2999, p20: 0.3305, p30: 0.3560, p50: 0.4020, p70: 0.4479, p80: 0.4620, p90: 0.4620, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    5:  { p0: 0.1200, p2: 0.1600, p5: 0.2024, p10: 0.2448, p20: 0.2956, p30: 0.3380, p50: 0.4144, p70: 0.4620, p80: 0.4620, p90: 0.4620, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    6:  { p0: 0.1800, p2: 0.2208, p5: 0.2510, p10: 0.2812, p20: 0.3174, p30: 0.3476, p50: 0.4020, p70: 0.4563, p80: 0.4620, p90: 0.4620, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    7:  { p0: 0.1400, p2: 0.1750, p5: 0.2072, p10: 0.2394, p20: 0.2780, p30: 0.3102, p50: 0.3682, p70: 0.4261, p80: 0.4583, p90: 0.4620, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    8:  { p0: 0.0500, p2: 0.0965, p5: 0.1341, p10: 0.1716, p20: 0.2167, p30: 0.2543, p50: 0.3220, p70: 0.3896, p80: 0.4272, p90: 0.4620, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    9:  { p0: 0.0400, p2: 0.0802, p5: 0.1128, p10: 0.1454, p20: 0.1845, p30: 0.2171, p50: 0.2758, p70: 0.3344, p80: 0.3670, p90: 0.4061, p95: 0.4387, p98: 0.4620, p100: 0.4800 },
    10: { p0: 0.0000, p2: 0.0100, p5: 0.0200, p10: 0.0622, p20: 0.1161, p30: 0.1611, p50: 0.2419, p70: 0.3228, p80: 0.3678, p90: 0.4217, p95: 0.4620, p98: 0.4620, p100: 0.4800 },
    11: { p0: 0.0000, p2: 0.0100, p5: 0.0216, p10: 0.0632, p20: 0.1131, p30: 0.1547, p50: 0.2296, p70: 0.3044, p80: 0.3460, p90: 0.3960, p95: 0.4376, p98: 0.4620, p100: 0.4800 }
};

/* --- HELPERS & CHART LOGIC --- */
const seededRandom = (seed) => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

const generateDummyObservations = (sensorIndex, wcMax, stationId, year) => {
    const data = [];
    const rng = seededRandom((stationId || 1) * 100 + sensorIndex * 17);
    const base = wcMax ? parseFloat(wcMax) * 0.58 : 0.30;
    const amp  = wcMax ? parseFloat(wcMax) * 0.20 : 0.09;

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const seasonal = Math.sin((month / 12) * 2 * Math.PI - Math.PI / 3);
            const noise = (rng() - 0.5) * 0.035;
            const sensorOffset = (sensorIndex - 1) * 0.018;
            const val = Math.min(wcMax || 0.55, Math.max(0.04,
                base + amp * seasonal + noise + sensorOffset
            ));
            data.push([date.getTime(), parseFloat(val.toFixed(4))]);
        }
    }
    return data;
};

const buildPercentileSeries = (percentiles, year) => {
    const bandKeys = [
        ['p0',  'p2' ], ['p2',  'p5' ], ['p5',  'p10'], ['p10', 'p20'],
        ['p20', 'p30'], ['p30', 'p70'], ['p70', 'p80'], ['p80', 'p90'],
        ['p90', 'p95'], ['p95', 'p98'], ['p98', 'p100'],
    ];

    const bandSeries = PERCENTILE_BANDS.map(() => []);
    const median = [];

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const p = percentiles[month];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const ts = new Date(year, month, d).getTime();
            bandKeys.forEach(([loKey, hiKey], idx) => {
                const lo = p[loKey] !== undefined ? p[loKey] : 0;
                const hi = p[hiKey] !== undefined ? p[hiKey] : 0.62;
                bandSeries[idx].push([ts, lo, hi]);
            });
            median.push([ts, p.p50]);
        }
    }
    return { bandSeries, median };
};

const buildMonthBands = (year) => {
    const bands = [];
    for (let month = 0; month < 12; month++) {
        const from = new Date(year, month, 1).getTime();
        const to   = new Date(year, month + 1, 0, 23, 59, 59).getTime();
        bands.push({ from, to });
    }
    return bands;
};

const computeObsMedian = (obsSeries, year) => {
    const byMonth = {};
    obsSeries.forEach(([ts, val]) => {
        const d = new Date(ts);
        const key = d.getMonth();
        if (!byMonth[key]) byMonth[key] = [];
        byMonth[key].push(val);
    });
    const result = [];
    for (let m = 0; m < 12; m++) {
        const vals = byMonth[m];
        if (!vals || vals.length === 0) continue;
        vals.sort((a, b) => a - b);
        const mid = vals[Math.floor(vals.length / 2)];
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            result.push([new Date(year, m, d).getTime(), mid]);
        }
    }
    return result;
};

/* --- CHART COMPONENT --- */
const StationChart = ({ station, sensorIndex }) => {
    const [chartOptions, setChartOptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [usingDummy, setUsingDummy] = useState(false);

    useEffect(() => {
        if (!station) return;
        setLoading(true);
        setUsingDummy(false);

        const stId = station.id || station.station_id;
        const wcMax = station[`wc${sensorIndex}`];
        const percentiles = STATIC_PERCENTILES;

        fetch(getHistoryUrl(stId))
            .then(res => res.json())
            .then(data => {
                const wcKey = `wc${sensorIndex}`;
                const historyData = data.history || [];
                const defaultYear = new Date().getFullYear() - 1;
                const allTimestamps = historyData
                    .map(item => new Date(item.timestamp).getFullYear())
                    .filter(y => !isNaN(y));
                
                const dataYear = allTimestamps.length > 0 ? Math.max(...allTimestamps) : defaultYear;
                const rangeStart = new Date(dataYear, 0, 1).getTime();
                const rangeEnd   = new Date(dataYear, 11, 31, 23, 59, 59).getTime();

                let obsSeries = historyData
                    .map(item => {
                        const val = item[wcKey];
                        const ts  = new Date(item.timestamp).getTime();
                        return (val !== undefined && ts >= rangeStart && ts <= rangeEnd)
                            ? [ts, parseFloat(val)]
                            : null;
                    })
                    .filter(Boolean);

                if (obsSeries.length === 0) {
                    obsSeries = generateDummyObservations(sensorIndex, wcMax, stId, dataYear);
                    setUsingDummy(true);
                }

                const pSeries = buildPercentileSeries(percentiles, dataYear);
                const monthBands = buildMonthBands(dataYear);
                const medianSeries = computeObsMedian(obsSeries, dataYear);

                setChartOptions(buildChartOptions(pSeries, obsSeries, medianSeries, monthBands, wcMax, sensorIndex));
                setLoading(false);
            })
            .catch(() => {
                const defaultYear = new Date().getFullYear() - 1;
                const obsSeries = generateDummyObservations(sensorIndex, wcMax, stId, defaultYear);
                setUsingDummy(true);
                const pSeries = buildPercentileSeries(percentiles, defaultYear);
                const monthBands = buildMonthBands(defaultYear);
                const medianSeries = computeObsMedian(obsSeries, defaultYear);
                setChartOptions(buildChartOptions(pSeries, obsSeries, medianSeries, monthBands, wcMax, sensorIndex));
                setLoading(false);
            });
    }, [station, sensorIndex]);

    if (loading) return <div className="panel-msg">Cargando datos...</div>;
    if (!chartOptions) return <div className="panel-msg">No hay datos recientes para este sensor.</div>;

    return (
        <div>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            {usingDummy && (
                <p style={{ fontSize: '10px', color: '#999', textAlign: 'center', margin: '2px 0 4px', fontStyle: 'italic' }}>
                    * Percentiles de ejemplo — sin historial real disponible para esta estación
                </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', margin: '4px 0 8px', padding: '6px 8px', background: '#f8f9fa', borderRadius: 6, border: '1px solid #e9ecef' }}>
                {[...PERCENTILE_BANDS].reverse().map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', fontWeight: '600', color: '#333' }}>
                        <span style={{ display: 'inline-block', width: 13, height: 10, background: b.fill, borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                        {b.label.replace(/ – .+/, '')}
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', fontWeight: '600', color: '#333' }}>
                    <span style={{ display: 'inline-block', width: 13, height: 2, background: '#111', borderRadius: 1 }} />
                    Observado
                </div>
            </div>
        </div>
    );
};

/* --- MAIN PAGE COMPONENT --- */
function Stations() {
    const COOKIE_NAME = 'stations_dashboard_settings';
    const getSavedSettings = () => {
        try {
            const saved = Cookies.get(COOKIE_NAME);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    };

    const savedSettings = getSavedSettings();
    const [stations, setStations] = useState([]);
    const [activeTab, setActiveTab] = useState("data");
    const stationsRef = useRef([]);

    const [mapMetric, setMapMetric] = useState(savedSettings.mapMetric ?? "status");
    const [selectedStation, setSelectedStation] = useState(savedSettings.selectedStation ?? null);
    const [selectedSensor, setSelectedSensor] = useState(savedSettings.selectedSensor ?? 1);

    useEffect(() => {
        const settingsToSave = { mapMetric, selectedStation, selectedSensor };
        Cookies.set(COOKIE_NAME, JSON.stringify(settingsToSave), { expires: 30 });
    }, [mapMetric, selectedStation, selectedSensor]);

    const calculateMetricsFromRawData = (reading, stationInfo) => {
        if (!reading) return null;
        const precipValue = parseFloat(reading.precipitation);
        const totalRainInches = (isNaN(precipValue) ? 0 : precipValue) / 25.4; 

        const wcRatios = [];
        const limits = [stationInfo.wc1_max, stationInfo.wc2_max, stationInfo.wc3_max, stationInfo.wc4_max];
        const keys = ['wc1', 'wc2', 'wc3', 'wc4'];

        limits.forEach((limit, index) => {
            const val = parseFloat(reading[keys[index]]);
            const max = parseFloat(limit);
            if (!isNaN(val) && !isNaN(max) && max > 0) wcRatios.push(val / max);
        });

        let avgSaturation = wcRatios.length > 0 ? (wcRatios.reduce((a, b) => a + b, 0) / wcRatios.length) * 100 : 0;
        return {
            precipitation: totalRainInches,
            soil_saturation: Math.min(avgSaturation, 100),
            last_updated: reading.recorded_at
        };
    };

    const fetchLatestReadings = async (baseStations) => {
        const currentStations = baseStations || stationsRef.current;
        if (!currentStations.length) return;

        try {
            const response = await fetch(BASE_LATEST_DATA_URL);
            if (!response.ok) return;
            const latestReadings = await response.json();
            if (!Array.isArray(latestReadings)) return;

            const localUpdates = {};
            latestReadings.forEach(fileRecord => {
                const station = currentStations.find(s => (s.id || s.station_id) === fileRecord.station_id);
                if (station && fileRecord.data) {
                    const metrics = calculateMetricsFromRawData(fileRecord.data, station);
                    if (metrics) localUpdates[fileRecord.station_id] = metrics;
                }
            });

            const mergedStations = currentStations.map(s => {
                const stId = s.id || s.station_id;
                return localUpdates[stId] ? { ...s, ...localUpdates[stId] } : s;
            });

            setStations(mergedStations);
            stationsRef.current = mergedStations;
        } catch (error) {
            setStations(currentStations);
        }
    };

    useEffect(() => {
        fetch(BASE_STATIONS_URL)
            .then((res) => res.json())
            .then((data) => {
                const dataArray = Array.isArray(data) ? data : [];
                stationsRef.current = dataArray;
                if (dataArray.length > 0) fetchLatestReadings(dataArray);
                else setStations([]);
            })
            .catch(() => setStations([]));

        const interval = setInterval(() => fetchLatestReadings(), 300000);
        return () => clearInterval(interval);
    }, []);

    const handleStationSelect = (station) => setSelectedStation(station);

    return (
        <div className="stations-page">
            <h1 className="page-title">Estaciones</h1>
            <p className="page-intro">
                Seleccione una estación en el mapa para ver su contenido de agua histórico y detalles técnicos.
            </p>

            <div className="dashboard-container">
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
                            zoom={isMobile ? 8.3 : 9.3}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                        >
                            <StationsMap
                                stations={stations}
                                selectedMetric={mapMetric}
                                onStationSelect={handleStationSelect}
                                selectedStationId={selectedStation?.id || selectedStation?.station_id}
                            />
                        </MapContainer>
                    </div>
                </div>

                <div className="details-panel">
                    {!selectedStation ? (
                        <div className="empty-state">
                            <h3>Selecciona una estación</h3>
                            <p>Haz clic en un marcador para ver datos.</p>
                        </div>
                    ) : (
                        <>
                            <div className="details-header">
                                <h2>{selectedStation.name}</h2>
                            </div>
                            <div className="details-tabs">
                                {['data', 'info', 'graphic'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === 'data' ? 'Datos' : tab === 'info' ? 'Información' : 'Gráfico'}
                                    </button>
                                ))}
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
                                            <img
                                                src={getSensorImageUrl(selectedStation.id || selectedStation.station_id)}
                                                alt={selectedStation.name}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
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
                                            <img
                                                src={getDataImageUrl(selectedStation.id || selectedStation.station_id)}
                                                alt={`Gráfico de ${selectedStation.name}`}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="stations-footer">
                <div className="footer-layout-wrapper">
                    <div className="footer-text-column">
                        <h2>Sensores y equipos de la estación</h2>
                        <p>Cada estación de la Red de Pronóstico de Deslizamientos de Tierra de Puerto Rico incluye sensores subterráneos que miden el contenido volumétrico de agua...</p>
                        <p>El conjunto de sensores se instala a intervalos de 0.25d, 0.50d, 0.75d y 1.00d...</p>
                    </div>
                    <div className="footer-image-column">
                        <img src={stationSchematic} alt="Esquema de sensores" className="schematic-img" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Chart Options Helper
function buildChartOptions(pSeries, obsSeries, medianSeries, monthBands, wcMax, sensorIndex) {
    const bandSeriesConfig = PERCENTILE_BANDS.map((band, idx) => ({
        name: band.label,
        type: 'arearange',
        data: pSeries.bandSeries[idx],
        color: band.fill,
        fillColor: band.fill + 'cc',
        zIndex: idx + 1,
        showInLegend: false,
        lineWidth: 0,
        marker: { enabled: false },
        enableMouseTracking: true,
    }));

    return {
        chart: { backgroundColor: '#ffffff', height: 310, style: { fontFamily: "'Inter', sans-serif" } },
        title: { text: '' },
        xAxis: {
            type: 'datetime',
            min: monthBands[0].from,
            max: monthBands[11].to,
            tickPositions: [...monthBands.map(b => b.from), monthBands[11].to + 1],
            labels: {
                formatter: function() {
                    if (this.value > monthBands[11].from) return '';
                    let m = Highcharts.dateFormat('%b', this.value);
                    return m.charAt(0).toUpperCase() + m.slice(1);
                }
            },
            plotBands: monthBands,
        },
        yAxis: {
            title: { text: 'VWC (m³/m³)' },
            min: 0, max: 0.6,
            labels: { formatter() { return this.value.toFixed(2); } }
        },
        tooltip: {
            shared: false,
            useHTML: true,
            formatter() {
                const dateStr = Highcharts.dateFormat('%b %d, %Y', this.x);
                let content = `<div style="font-size:11px; padding: 2px;"><b>${dateStr}</b><br/>`;
                if (this.series.type === 'arearange') {
                    content += `<b>${this.series.name}</b>: ${this.point.low.toFixed(4)} - ${this.point.high.toFixed(4)}`;
                } else {
                    content += `Observación: ${this.y.toFixed(4)}`;
                }
                return content + `</div>`;
            }
        },
        series: [
            ...bandSeriesConfig,
            { name: 'Observado', type: 'spline', data: obsSeries, color: '#111', lineWidth: 2, zIndex: 14 }
        ]
    };
}

export default Stations;
