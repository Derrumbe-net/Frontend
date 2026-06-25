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
import { PERCENTILE_BANDS, STATIC_PERCENTILES, SITE_CONFIG } from "@config";

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
const getHistoryUrl = (stationId, startDate, endDate) => `${BASE_STATIONS_URL}/historical/${stationId}?start_date=${startDate}&end_date=${endDate}`;

const getSensorImageUrl = (stationId) => `${BASE_STATIONS_URL}/item/${stationId}/images/sensor`;
const getDataImageUrl = (stationId) => `${BASE_STATIONS_URL}/item/${stationId}/images/plot`;

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
            let lastUpdate = new Date(station.last_updated.replace(" ", "T").replace('Z', ''));
            lastUpdate += '-04:00';
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

const buildPercentileSeries = (percentiles, startDate, endDate) => {
    const bandKeys = [
        ['p0',  'p2' ], ['p2',  'p5' ], ['p5',  'p10'], ['p10', 'p20'],
        ['p20', 'p30'], ['p30', 'p70'], ['p70', 'p80'], ['p80', 'p90'],
        ['p90', 'p95'], ['p95', 'p98'], ['p98', 'p100'],
    ];

    const bandSeries = PERCENTILE_BANDS.map(() => []);
    const median = [];

    let current = new Date(startDate.getTime());
    current.setDate(1);

    while (current <= endDate) {
        const month = current.getMonth();
        const year = current.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const p = percentiles[month];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            if (date < startDate || date > endDate) continue;
            
            const ts = date.getTime();
            bandKeys.forEach(([loKey, hiKey], idx) => {
                const lo = p[loKey] !== undefined ? p[loKey] : 0;
                const hi = p[hiKey] !== undefined ? p[hiKey] : 0.62;
                bandSeries[idx].push([ts, lo, hi]);
            });
            median.push([ts, p.p50]);
        }
        current.setMonth(current.getMonth() + 1);
    }
    return { bandSeries, median };
};

const buildMonthBands = (startDate, endDate) => {
    const bands = [];
    let current = new Date(startDate.getTime());
    current.setDate(1);

    while (current <= endDate) {
        const from = new Date(current.getFullYear(), current.getMonth(), 1).getTime();
        const to   = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59).getTime();
        bands.push({ from, to });
        current.setMonth(current.getMonth() + 1);
    }
    return bands;
};

const computeObsMedian = (obsSeries, startDate, endDate) => {
    const byMonth = {};
    obsSeries.forEach(([ts, val]) => {
        const d = new Date(ts);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!byMonth[key]) byMonth[key] = [];
        byMonth[key].push(val);
    });
    const result = [];
    let current = new Date(startDate.getTime());
    current.setDate(1);

    while (current <= endDate) {
        const month = current.getMonth();
        const year = current.getFullYear();
        const key = `${year}-${month}`;
        const vals = byMonth[key];
        if (vals && vals.length > 0) {
            vals.sort((a, b) => a - b);
            const mid = vals[Math.floor(vals.length / 2)];
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month, d);
                if (date >= startDate && date <= endDate) {
                    result.push([date.getTime(), mid]);
                }
            }
        }
        current.setMonth(current.getMonth() + 1);
    }
    return result;
};

/* --- CHART COMPONENT --- */
const StationChart = ({ station, sensorIndex }) => {
    const [chartOptions, setChartOptions] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!station) return;
        setLoading(true);

        const stId = station.id || station.station_id;
        const wcMax = station[`wc${sensorIndex}_max`];
        const percentiles = STATIC_PERCENTILES[stId] || STATIC_PERCENTILES[0] || STATIC_PERCENTILES;

        const now = new Date();
        const endDateStr = now.toISOString().split('T')[0];
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        const startDateStr = lastYear.toISOString().split('T')[0];

        const rangeStart = lastYear.getTime();
        const rangeEnd = now.getTime();

        fetch(getHistoryUrl(stId, startDateStr, endDateStr))
            .then(res => res.json())
            .then(data => {
                const historyData = Array.isArray(data) ? data : [];
                let obsSeries = [];

                if (sensorIndex === 'sat') {
                    obsSeries = historyData
                        .map(item => {
                            const ts = new Date(item.recorded_at).getTime();
                            if (!(ts >= rangeStart && ts <= rangeEnd)) return null;

                            const wcRatios = [];
                            const limits = [station.wc1_max, station.wc2_max, station.wc3_max, station.wc4_max];
                            const keys = ['wc1', 'wc2', 'wc3', 'wc4'];

                            limits.forEach((limit, idx) => {
                                const val = parseFloat(item[keys[idx]]);
                                const max = parseFloat(limit);
                                if (!isNaN(val) && !isNaN(max) && max > 0) wcRatios.push(val / max);
                            });

                            if (wcRatios.length === 0) return null;
                            const avgSaturation = (wcRatios.reduce((a, b) => a + b, 0) / wcRatios.length) * 100;
                            return [ts, parseFloat(Math.min(avgSaturation, 100).toFixed(2))];
                        })
                        .filter(Boolean);
                } else {
                    const wcKey = `wc${sensorIndex}`;
                    obsSeries = historyData
                        .map(item => {
                            const val = item[wcKey];
                            const ts  = new Date(item.recorded_at).getTime();
                            return (val !== undefined && ts >= rangeStart && ts <= rangeEnd)
                                ? [ts, parseFloat(val)]
                                : null;
                        })
                        .filter(Boolean);
                }

                if (obsSeries.length === 0) {
                    setChartOptions(null);
                    setLoading(false);
                    return;
                }

                if (sensorIndex === 'sat') {
                    const actualMin = obsSeries[0][0];
                    const actualMax = obsSeries[obsSeries.length - 1][0];
                    setChartOptions(buildChartOptions(null, obsSeries, null, buildMonthBands(lastYear, now), null, sensorIndex, actualMin, actualMax));
                } else {
                    // Check if statically provided percentiles exist as an array for buildPercentileSeries logic, otherwise fallback structure
                    const parsedPercentiles = Array.isArray(percentiles) ? percentiles : Object.values(STATIC_PERCENTILES);
                    const pSeries = buildPercentileSeries(parsedPercentiles, lastYear, now);
                    const medianSeries = computeObsMedian(obsSeries, lastYear, now);
                    const actualMin = obsSeries[0][0];
                    const actualMax = obsSeries[obsSeries.length - 1][0];
                    setChartOptions(buildChartOptions(pSeries, obsSeries, medianSeries, buildMonthBands(lastYear, now), wcMax, sensorIndex, actualMin, actualMax));
                }
                setLoading(false);
            })
            .catch(() => {
                setChartOptions(null);
                setLoading(false);
            });
    }, [station, sensorIndex]);

    if (loading) return <div className="panel-msg">Cargando datos...</div>;
    if (!chartOptions) return <div className="panel-msg">No hay datos históricos disponibles para este sensor.</div>;

    return (
        <div>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', margin: '4px 0 8px', padding: '6px 8px', background: '#f8f9fa', borderRadius: 6, border: '1px solid #e9ecef' }}>
                {sensorIndex !== 'sat' && [...PERCENTILE_BANDS].reverse().map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', fontWeight: '600', color: '#333' }}>
                        <span style={{ display: 'inline-block', width: 13, height: 10, background: b.fill, borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                        {b.label.replace(/ – .+/, '')}
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', fontWeight: '600', color: '#333' }}>
                    <span style={{ display: 'inline-block', width: 13, height: 2, background: '#111', borderRadius: 1 }} />
                    {sensorIndex === 'sat' ? SITE_CONFIG.STATIONS.SATURATION_LABEL : SITE_CONFIG.STATIONS.OBSERVATION_LABEL}
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
                                        {tab === 'data' ? SITE_CONFIG.STATIONS.TAB_DATA : tab === 'info' ? SITE_CONFIG.STATIONS.TAB_INFO : SITE_CONFIG.STATIONS.TAB_GRAPHIC}
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
                                                    {SITE_CONFIG.STATIONS.SENSOR_LABEL} {num}
                                                </button>
                                            ))}
                                            <button
                                                className={`sensor-btn ${selectedSensor === 'sat' ? 'active' : ''}`}
                                                onClick={() => setSelectedSensor('sat')}
                                            >
                                                {SITE_CONFIG.STATIONS.SATURATION_LABEL}
                                            </button>
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
                                            <li>
                                                <strong>{SITE_CONFIG.STATIONS.META_INSTALL_DATE}</strong> {selectedStation.station_installation_date ? new Date(selectedStation.station_installation_date).toLocaleDateString() : "N/A"}
                                            </li>
                                            <li><strong>{SITE_CONFIG.STATIONS.META_GEOLOGIC_UNIT}</strong> {selectedStation.geological_unit || "N/A"}</li>
                                            <li><strong>{SITE_CONFIG.STATIONS.META_LAND_UNIT}</strong> {selectedStation.land_unit || "N/A"}</li>
                                            <li><strong>{SITE_CONFIG.STATIONS.META_SUSCEPTIBILITY}</strong> {selectedStation.susceptibility || "N/A"}</li>
                                            <li>
                                                <strong>{SITE_CONFIG.STATIONS.META_DEPTH}</strong> {selectedStation.depth ? (
                                                    <div style={{ marginLeft: '10px', marginTop: '4px' }}>
                                                        {selectedStation.depth.split(',').map((d, index) => (
                                                            <div key={index}>{SITE_CONFIG.STATIONS.SENSOR_LABEL} {index + 1}: {d.trim()}</div>
                                                        ))}
                                                    </div>
                                                ) : "N/A"}
                                            </li>
                                            <li><strong>{SITE_CONFIG.STATIONS.META_ELEVATION}</strong> {selectedStation.elevation != null ? `${selectedStation.elevation} m` : "N/A"}</li>
                                            <li><strong>{SITE_CONFIG.STATIONS.META_SLOPE}</strong> {selectedStation.slope != null ? `${selectedStation.slope}°` : "N/A"}</li>
                                            <li><strong>{SITE_CONFIG.STATIONS.META_COLLABORATOR}</strong> {selectedStation.collaborator || "N/A"}</li>
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
                        <h2>{SITE_CONFIG.STATIONS.FOOTER_TITLE_EQUIPMENT}</h2>
                        <p>{SITE_CONFIG.STATIONS.FOOTER_DESC_EQUIPMENT_1}</p>
                        <p>{SITE_CONFIG.STATIONS.FOOTER_DESC_EQUIPMENT_2}</p>
                        <p>{SITE_CONFIG.STATIONS.FOOTER_DESC_EQUIPMENT_3}</p>
                    </div>
                    <div className="footer-image-column">
                        <img src={stationSchematic} alt="Esquema de sensores" className="schematic-img" />
                    </div>
                </div>
                <div className="footer-full-width">
                    <h2 className="secondary-footer-header">{SITE_CONFIG.STATIONS.FOOTER_TITLE_DATA}</h2>
                    <p>{SITE_CONFIG.STATIONS.FOOTER_DESC_DATA}</p>

                    <ul className="glossary-list">
                        {SITE_CONFIG.STATIONS.GLOSSARY.map((item, i) => (
                            <li key={i}>
                                <strong>{item.TERM}</strong> {item.DESC}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Chart Options Helper
function buildChartOptions(pSeries, obsSeries, medianSeries, monthBands, wcMax, sensorIndex, chartMin, chartMax) {
    const bandSeriesConfig = pSeries ? PERCENTILE_BANDS.map((band, idx) => ({
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
    })) : [];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

    return {
        chart: { 
            backgroundColor: '#ffffff', 
            height: 310, 
            style: { fontFamily: "'Inter', sans-serif" }
        },
        title: { text: '' },
        xAxis: {
            type: 'datetime',
            min: chartMin,
            max: chartMax,
            tickPositions: [...monthBands.map(b => b.from), monthBands[monthBands.length - 1].to + 1]
                .filter(pos => pos >= chartMin && pos <= chartMax),
            labels: {
                rotation: -45,
                align: 'right',
                padding: 2,
                style: { fontSize: '9px' },
                formatter: function() {
                    const date = new Date(this.value);
                    return `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
                }
            },
            plotBands: monthBands,
        },
        yAxis: {
            title: { text: sensorIndex === 'sat' ? SITE_CONFIG.STATIONS.SATURATION_LABEL + ' (%)' : 'VWC (m³/m³)' },
            min: 0, 
            max: sensorIndex === 'sat' ? 100 : 0.6,
            labels: { 
                formatter() { 
                    return sensorIndex === 'sat' ? this.value.toFixed(0) : this.value.toFixed(2); 
                } 
            }
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
                    const val = sensorIndex === 'sat' ? this.y.toFixed(2) + '%' : this.y.toFixed(4);
                    content += `${sensorIndex === 'sat' ? `<b>${SITE_CONFIG.STATIONS.SATURATION_LABEL}</b>` : `<b>${SITE_CONFIG.STATIONS.OBSERVATION_LABEL}</b>`}: ${val}`;

                    if (sensorIndex !== 'sat' && wcMax) {
                        const percentileSat = (this.y / wcMax) * 100;
                        content += `<br/><b>${SITE_CONFIG.STATIONS.PERCENTILE_SAT_LABEL || 'Percentile Saturation'}</b>: ${percentileSat.toFixed(2)}%`;
                    }
                }
                return content + `</div>`;
            }
        },
        series: [
            ...bandSeriesConfig,
            { 
                name: sensorIndex === 'sat' ? SITE_CONFIG.STATIONS.SATURATION_LABEL : SITE_CONFIG.STATIONS.OBSERVATION_LABEL, 
                type: 'spline', 
                data: obsSeries, 
                color: '#111', 
                lineWidth: 2, 
                zIndex: 14 
            }
        ]
    };
}

export default Stations;
