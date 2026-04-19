import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
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

/* ─────────────────────────────────────────────────────────────────
   ECONET-STYLE SOIL MOISTURE PERCENTILE CHART
   ───────────────────────────────────────────────────────────────── */

/* Month colours matching ECONET rainbow palette 
const MONTH_COLORS = [
    '#3182bd', // Jan  – steel blue
    '#6baed6', // Feb  – light blue
    '#9ecae1', // Mar  – pale blue
    '#31a354', // Apr  – green
    '#74c476', // May  – light green
    '#bae4b3', // Jun  – pale green
    '#fdcc8a', // Jul  – pale orange
    '#fc8d59', // Aug  – orange
    '#e34a33', // Sep  – red-orange
    '#b30000', // Oct  – dark red
    '#7b3294', // Nov  – purple
    '#1c9099', // Dec  – teal
];
*/

/* Percentile band definitions — U.S. Drought Monitor categories (bottom → top) */
const PERCENTILE_BANDS = [
    { label: 'D4 – Exceptionally Dry',  lo: 0,     hi: 2,     fill: '#4a0000' }, // 0.00–2.00
    { label: 'D3 – Extremely Dry',      lo: 2,     hi: 5,     fill: '#cc0000' }, // 2.01–5.00
    { label: 'D2 – Severely Dry',       lo: 5,     hi: 10,    fill: '#f77f00' }, // 5.01–10.00
    { label: 'D1 – Moderately Dry',     lo: 10,    hi: 20,    fill: '#f5c97a' }, // 10.01–20.00
    { label: 'D0 – Abnormally Dry',     lo: 20,    hi: 30,    fill: '#ffff00' }, // 20.01–30.00
    { label: 'Normal',                  lo: 30,    hi: 70,    fill: '#ffffff' }, // 30.01–70.00
    { label: 'Abnormally Wet',          lo: 70,    hi: 80,    fill: '#b3f0ff' }, // 70.01–80.00
    { label: 'Moderately Wet',          lo: 80,    hi: 90,    fill: '#66ccff' }, // 80.01–90.00
    { label: 'Severely Wet',            lo: 90,    hi: 95,    fill: '#0099ff' }, // 90.01–95.00
    { label: 'Extremely Wet',           lo: 95,    hi: 98,    fill: '#0044ff' }, // 95.01–98.00
    { label: 'Exceptionally Wet',       lo: 98,    hi: 100,   fill: '#1a00cc' }, // 98.01–100.00
];

/* ─── Static Percentile Data Provided by User ─── */
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

/* ─── Seed-based pseudo-random so dummy data is stable per station+sensor ─── */
const seededRandom = (seed) => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

/* Generate daily VWC observations for a given year (actual line fallback) */
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

/*
  Convert monthly percentiles into daily arearange series points for a given year.
*/
const buildPercentileSeries = (percentiles, year) => {
    // Ahora las bandas de los extremos usan p0 y p100 en lugar de null
    const bandKeys = [
        ['p0',  'p2' ],  // p0  – p2  (Exceptionally Dry)
        ['p2',  'p5' ],  // p2  – p5
        ['p5',  'p10'],  // p5  – p10
        ['p10', 'p20'],  // p10 – p20
        ['p20', 'p30'],  // p20 – p30
        ['p30', 'p70'],  // p30 – p70  (Normal)
        ['p70', 'p80'],  // p70 – p80
        ['p80', 'p90'],  // p80 – p90
        ['p90', 'p95'],  // p90 – p95
        ['p95', 'p98'],  // p95 – p98
        ['p98', 'p100'], // p98 – p100 (Exceptionally Wet)
    ];

    const bandSeries = PERCENTILE_BANDS.map(() => []);
    const median = [];

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const p = percentiles[month];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const ts = new Date(year, month, d).getTime();
            bandKeys.forEach(([loKey, hiKey], idx) => {
                // Tomamos directamente los valores de tu objeto estático
                // Si p0 o p100 no existen por error, hacemos un fallback seguro a 0 o 0.62
                const lo = p[loKey] !== undefined ? p[loKey] : 0;
                const hi = p[hiKey] !== undefined ? p[hiKey] : 0.62;
                bandSeries[idx].push([ts, lo, hi]);
            });
            median.push([ts, p.p50]);
        }
    }
    return { bandSeries, median };
};

/* Build x-axis plotBands for month shading for a given year */
const buildMonthBands = (year) => {
    const bands = [];
    for (let month = 0; month < 12; month++) {
        const from = new Date(year, month, 1).getTime();
        const to   = new Date(year, month + 1, 0, 23, 59, 59).getTime();
        bands.push({
            from,
            to,
            //color: MONTH_COLORS[month] + '22'
            // Hemos eliminado la propiedad "label" de aquí
        });
    }
    return bands;
};

/* Compute a monthly median series from observed daily data.
   Returns array of [timestamp (per day of month), median_value] */
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
        // Span the median across every day of the month for a step-line look
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

        const wcMax = station[`wc${sensorIndex}`];
        const stationId = station.station_id;

        const percentiles = STATIC_PERCENTILES;

        fetch(getHistoryUrl(stationId))
            .then(res => res.json())
            .then(data => {
                const wcKey = `wc${sensorIndex}`;
                const historyData = data.history || [];

                // Determine the last year present in the data; fall back to previous calendar year
                const defaultYear = new Date().getFullYear() - 1;
                const allTimestamps = historyData
                    .map(item => new Date(item.timestamp).getFullYear())
                    .filter(y => !isNaN(y));
                const dataYear = allTimestamps.length > 0
                    ? Math.max(...allTimestamps)
                    : defaultYear;

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
                    obsSeries = generateDummyObservations(sensorIndex, wcMax, stationId, dataYear);
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
                const obsSeries = generateDummyObservations(sensorIndex, wcMax, stationId, defaultYear);
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
            {/* Percentile legend — 11 U.S. Drought Monitor bands */}
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

/* Build the full Highcharts options object */
function buildChartOptions(pSeries, obsSeries, medianSeries, monthBands, wcMax, sensorIndex) {
    const allObs = obsSeries.map(d => d[1]);
    const obsMin = Math.min(...allObs);
    const obsMax = Math.max(...allObs);
    const pad = (obsMax - obsMin) * 0.12 || 0.04;
    const yMin = 0;
    const yMax = 0.6;

    // Build one arearange series per band
    const bandSeriesConfig = PERCENTILE_BANDS.map((band, idx) => ({
        name: band.label,
        type: 'arearange',
        data: pSeries.bandSeries[idx],
        color: band.fill,
        fillColor: band.fill + 'cc',
        zIndex: idx + 1,
        showInLegend: false,
        lineWidth: 0,
        marker: { 
            enabled: false,
            states: {
                hover: { enabled: false } // Esto apaga los círculos al hacer hover
            }
        },
        states: { 
            hover: { halo: null } // Esto apaga la sombra/anillo alrededor del punto
        }, 
        enableMouseTracking: true, 
    }));

    return {
        chart: {
            backgroundColor: '#ffffff',
            height: 310,
            margin: [28, 16, 28, 56],
            style: { fontFamily: "'Inter', sans-serif" },
            animation: { duration: 400 },
        },
        title: { text: '' },
        credits: { enabled: false },
        legend: { enabled: false },

      xAxis: {
            type: 'datetime',
            lineColor: '#ddd',
            tickColor: '#ddd',
            gridLineWidth: 0,
            
            // 1. Forzamos los límites exactos del año actual
            min: monthBands[0].from,
            max: monthBands[11].to,
            
            // 2. Extraemos el inicio de cada mes para poner un "tick" exacto ahí.
            // Añadimos el final del año (+1 ms) para cerrar la línea del eje X correctamente.
            tickPositions: [ ...monthBands.map(b => b.from), monthBands[11].to + 1 ],

            labels: { 
                step: 1, // Fuerza a que se muestren TODOS los meses sin saltarse ninguno
                style: { 
                    fontSize: '10px', 
                    color: '#555', 
                    fontWeight: '600',
                    textOverflow: 'none', // Evita que se recorten los nombres con "..."
                    whiteSpace: 'nowrap'
                },
                formatter: function() {
                    // Si el tick es el que cierra el año (el de enero del año siguiente), lo ocultamos
                    if (this.value > monthBands[11].from) return '';

                    // Formatea el valor a mes abreviado y capitaliza la primera letra
                    let monthStr = Highcharts.dateFormat('%b', this.value);
                    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
                }
            },
            plotBands: monthBands,
        }, 

        yAxis: {
            title: {
                text: 'VWC (m³/m³)',
                style: { fontSize: '10px', color: '#555' },
                margin: 6,
            },
            min: yMin,
            max: yMax,
            gridLineColor: '#eeeeee',
            gridLineDashStyle: 'Dot',
            labels: {
                style: { fontSize: '10px', color: '#666' },
                formatter() { return this.value.toFixed(2); },
            },
        },

       tooltip: {
            shared: false,
            useHTML: true,
            formatter() {
                const dateStr = Highcharts.dateFormat('%b %d, %Y', this.x);
                let tooltipContent = `<div style="font-size:11px; padding: 2px;">`;
                tooltipContent += `<div style="margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px;"><b>${dateStr}</b></div>`;

                const getObsValue = (chart, hoveredX) => {
                    const obsSeriesObj = chart.series.find(s => s.name === 'Observado');
                    if (!obsSeriesObj || !obsSeriesObj.data) return null;

                    const hoveredDate = new Date(hoveredX);
                    const y = hoveredDate.getFullYear();
                    const m = hoveredDate.getMonth();
                    const d = hoveredDate.getDate();

                    // Encuentra el primer dato de la línea negra que haya ocurrido en ese mismo día
                    const pt = obsSeriesObj.data.find(p => {
                        const obsDate = new Date(p.x);
                        return obsDate.getFullYear() === y && 
                               obsDate.getMonth() === m && 
                               obsDate.getDate() === d;
                    });

                    return pt ? pt.y : null;
                };

                const obsVal = getObsValue(this.series.chart, this.x);
                const obsStr = obsVal !== null ? `<b>${obsVal.toFixed(4)} m³/m³</b>` : '<i style="color:#888">N/A</i>';

                if (this.series.type === 'arearange') {
                    // Si el usuario hace hover sobre una banda de color
                    const low = this.point.low.toFixed(4);
                    const high = this.point.high.toFixed(4); 

                    tooltipContent += `<div style="display:flex; align-items:center; gap:6px; margin-bottom: 4px;">`;
                    tooltipContent += `<span style="display:inline-block; width:10px; height:10px; background-color:${this.series.color}; border:1px solid #999;"></span>`;
                    tooltipContent += `<b>${this.series.name}</b></div>`;
                    tooltipContent += `<div style="margin-bottom: 4px; color:#555;">Rango del mes: <b>${low} - ${high}</b> m³/m³</div>`;
                    tooltipContent += `<div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #eee;">Observación: ${obsStr}</div>`;
                } else if (this.series.name === 'Observado') {
                    // Si el usuario hace hover exactamente sobre la línea negra
                    tooltipContent += `<div>Observación: ${obsStr}</div>`;
                } else {
                    return false;
                }

                tooltipContent += `</div>`;
                return tooltipContent;
            },
            style: { fontSize: '11px' },
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: '#ccc',
            borderRadius: 6,
            shadow: true,
            padding: 8
        }, 

        plotOptions: {
            arearange: {
                lineWidth: 0,
                marker: { enabled: false },
                // CAMBIO: Permitimos la interacción del ratón
                states: { hover: { enabled: true, halo: { size: 0 } } },
                enableMouseTracking: true, 
            },
            spline: {
                marker: { enabled: false, states: { hover: { enabled: true, radius: 3 } } },
            },
        },

        series: [
            ...bandSeriesConfig,
            {
                name: 'Mediana (p50)',
                type: 'spline',
                data: medianSeries,
                color: 'transparent',
                lineWidth: 0,
                zIndex: 13,
                showInLegend: false,
                enableMouseTracking: false,
                marker: { enabled: false },
            },
            {
                name: 'Observado',
                type: 'spline',
                data: obsSeries,
                color: '#111111',
                lineWidth: 2,
                zIndex: 14,
                showInLegend: false,
                marker: { enabled: false, states: { hover: { enabled: true, radius: 4, fillColor: '#111' } } },
            },
        ],
    };
}

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

