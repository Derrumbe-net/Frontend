import 'leaflet/dist/leaflet.css';
import '../styles/InteractiveMap.css';
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, ImageOverlay } from 'react-leaflet';
import * as EL from 'esri-leaflet';
import LandslideLogo from '../assets/PRLHMO_LOGO.svg';
import StationPopup from '../components/StationPopup';
import LandslidePopup from '../components/LandslidePopup';
import GreenPinIcon from '../assets/green-location-pin.png';
import L from 'leaflet';
import MapMenu from "../components/MapMenu.jsx";
import Cookies from 'js-cookie';

const COOKIE_NAME = 'landslide_map_filters';
const BASE_DOMAIN = `${import.meta.env.VITE_API_URL}`;
const BASE_STATIONS_URL = `${BASE_DOMAIN}/stations`;
const BASE_FILES_DATA_URL = `${BASE_DOMAIN}/stations/latest`;
const BASE_LANDSLIDES_URL = `${BASE_DOMAIN}/landslides`;
const BASE_BATCH_UPDATE_URL = `${BASE_DOMAIN}/stations/batch-update`; // From Upstream

const FRAME_SPEED = 1500; 

/* --- COMPONENTS --- */

const Disclaimer = ({ onAgree }) => {
    return (
        <div className="disclaimer-overlay">
            <div className="disclaimer-box">
                <h2>Aviso | Disclaimer</h2>
                <p><strong>EN:</strong> The data presented on this platform is experimental. The Puerto Rico Landslide Hazard Mitigation Office is not responsible for the decisions taken after utilizing our data.</p>
                <p><strong>ES:</strong> Los datos presentados en esta plataforma son experimentales. La Oficina de Mitigación ante Deslizamientos de Puerto Rico no se hace responsable de las decisiones tomadas utilizando nuestra información.</p>
                <button onClick={onAgree}>Acepto | Agree</button>
            </div>
        </div>
    );
};

const CtrlZoomHandler = ({ setShowZoomHint }) => {
    const map = useMap();
    const timeoutRef = useRef(null);
    const lastShownRef = useRef(0);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) return;
        const container = map.getContainer();
        const handleWheel = (e) => {
            const now = Date.now();
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -1 : 1;
                map.setZoom(map.getZoom() + delta);
                return;
            }
            if (now - lastShownRef.current > 30000) {
                lastShownRef.current = now;
                setShowZoomHint(true);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => setShowZoomHint(false), 2500);
            }
        };
        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [map, setShowZoomHint]);
    return null;
};

const MobileTouchHandler = () => {
    const map = useMap();
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return;
        const container = map.getContainer();
        const handleTouchStart = (e) => {
            if (e.touches.length === 2) map.dragging.disable();
            else map.dragging.enable();
        };
        const handleTouchEnd = () => map.dragging.enable();
        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });
        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [map]);
    return null;
};

const TimeControlBar = ({ frames, currentIndex, isPlaying, onTogglePlay, onSeek, setIsDragging, setIsPlaying }) => {
    const map = useMap();
    const containerRef = useRef(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        L.DomEvent.disableClickPropagation(el);
        const stopAll = (e) => e.stopPropagation();
        el.addEventListener('mousedown', stopAll);
        el.addEventListener('touchstart', stopAll, { passive: false });
        return () => {
            el.removeEventListener('mousedown', stopAll);
            el.removeEventListener('touchstart', stopAll);
        };
    }, []);

    const formatTime = (idx) => {
        if (!frames?.[idx]) return "--:--";
        return new Date(frames[idx].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isDraggingRef = useRef(false);
    const [dragValue, setDragValue] = useState(null);
    const displayIndex = dragValue !== null ? dragValue : currentIndex;
    const maxIndex = frames.length > 0 ? frames.length - 1 : 0;

    const startDrag = (val) => {
        isDraggingRef.current = true;
        setIsDragging(true);
        setIsPlaying(false);
        setDragValue(val);
        map.dragging.disable();
    };

    const commitDrag = (val) => {
        isDraggingRef.current = false;
        setIsDragging(false);
        setIsPlaying(true);
        setDragValue(null);
        map.dragging.enable();
        onSeek(val);
    };

    if (!frames.length) return null;

    return (
        <div className="time-control-bar" ref={containerRef}>
            <button className="play-pause-btn" onClick={onTogglePlay}>
                {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="time-slider-wrapper">
                <div className="time-labels">
                    <span>{formatTime(0)}</span>
                    <span className="current-time-label">{formatTime(displayIndex)}</span>
                    <span>{formatTime(maxIndex)}</span>
                </div>
                <input
                    type="range"
                    className="time-slider-input"
                    min={0} max={maxIndex} step={1}
                    value={displayIndex}
                    onChange={(e) => isDraggingRef.current ? setDragValue(Number(e.target.value)) : onSeek(Number(e.target.value))}
                    onMouseDown={() => startDrag(currentIndex)}
                    onMouseUp={(e) => commitDrag(Number(e.target.value))}
                    onTouchStart={() => startDrag(currentIndex)}
                    onTouchEnd={(e) => commitDrag(Number(e.target.value))}
                />
            </div>
        </div>
    );
};

/* --- MAP LAYERS --- */

const EsriOverlays = ({ showPrecip, showSusceptibility, showForecast, currentTime }) => {
    const map = useMap();

    useEffect(() => {
        const hillshade = EL.tiledMapLayer({
            url: 'https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Hillshade_Puerto_Rico/MapServer',
            opacity: 0.5, minZoom: 7, maxZoom: 16
        }).addTo(map);

        const municipalities = EL.dynamicMapLayer({
            url: 'https://services5.arcgis.com/TQ9qkk0dURXSP7LQ/arcgis/rest/services/LIMITES_LEGALES_MUNICIPIOS/MapServer',
            f: 'image'
        }).addTo(map);

        return () => {
            map.removeLayer(hillshade);
            map.removeLayer(municipalities);
        };
    }, [map]);

    useEffect(() => {
        let precipLayer;
        if (showPrecip) {
            precipLayer = EL.imageMapLayer({
                url: 'https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer',
                opacity: 0.5,
            }).addTo(map);
        }
        return () => { if (precipLayer) map.removeLayer(precipLayer); };
    }, [map, showPrecip]);

    useEffect(() => {
        let suscLayer;
        if (showSusceptibility) {
            suscLayer = EL.tiledMapLayer({
                url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
                opacity: 0.5, minZoom: 7, maxZoom: 16
            }).addTo(map);
        }
        return () => { if (suscLayer) map.removeLayer(suscLayer); };
    }, [map, showSusceptibility]);

    return null;
};

const PopulateStations = ({ showSaturation, showPrecip12hr, showLandslideForecast, onDataUpdate }) => {
    const [stations, setStations] = useState([]);

    const calculateMetricsFromRawData = (reading, stationInfo) => {
        if (!reading) return null;
        const totalRainInches = parseFloat(reading.precipitation) / 25.4;
        const wcRatios = [];
        const limits = [stationInfo.wc1_max, stationInfo.wc2_max, stationInfo.wc3_max, stationInfo.wc4_max];
        const keys = ['wc1', 'wc2', 'wc3', 'wc4'];

        limits.forEach((limit, i) => {
            const val = parseFloat(reading[keys[i]]);
            const max = parseFloat(limit);
            if (!isNaN(val) && max > 0) wcRatios.push(val / max);
        });

        const avgSaturation = wcRatios.length > 0 ? (wcRatios.reduce((a, b) => a + b, 0) / wcRatios.length) * 100 : 0;

        return {
            calculatedPrecip: totalRainInches,
            calculatedSaturation: Math.min(avgSaturation, 100),
            lastUpdated: reading.recorded_at
        };
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const stationRes = await fetch(BASE_STATIONS_URL);
                const baseStations = await stationRes.json();
                const dataRes = await fetch(BASE_FILES_DATA_URL);
                const latestReadings = await dataRes.json();

                const localUpdates = {};
                const batchPayload = [];

                latestReadings.forEach(record => {
                    const station = baseStations.find(s => s.station_id === record.station_id);
                    if (station && record.data) {
                        const metrics = calculateMetricsFromRawData(record.data, station);
                        if (metrics) {
                            localUpdates[record.station_id] = {
                                precipitation: metrics.calculatedPrecip,
                                soil_saturation: metrics.calculatedSaturation,
                                last_updated: metrics.lastUpdated
                            };
                            batchPayload.push({
                                station_id: station.station_id,
                                precipitation: metrics.calculatedPrecip,
                                soil_saturation: metrics.calculatedSaturation
                            });
                        }
                    }
                });

                if (batchPayload.length > 0) {
                    await fetch(BASE_BATCH_UPDATE_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stations: batchPayload })
                    });
                }

                const updated = baseStations.map(s => localUpdates[s.station_id] ? { ...s, ...localUpdates[s.station_id] } : s);
                setStations(updated);
                onDataUpdate(updated);
            } catch (err) { console.error(err); }
        };
        loadInitialData();
    }, []);

    const createSaturationIcon = (saturation, lastUpdated) => {
        const { isOutdated, timeString } = getStationStatus(lastUpdated);
        const capped = Math.min(saturation, 100);
        let colorClass = capped >= 90 ? "high" : capped >= 80 ? "medium" : "low";
        
        const clockHtml = isOutdated ? `<span class="stale-clock" title="${timeString}" style="margin-left: 5px;"><svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><line x1="12" y1="12" x2="12" y2="6" stroke="white" stroke-width="2"/><line x1="12" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"/></svg></span>` : "";

        return L.divIcon({
            html: `<div class="saturation-marker ${colorClass}"><span>${Math.round(capped)}%</span>${clockHtml}</div>`,
            iconSize: [65, 30], iconAnchor: [32, 15], className: ""
        });
    };

    const createPrecipIcon = (precip, lastUpdated) => {
        const { isOutdated, timeString } = getStationStatus(lastUpdated);
        const clockHtml = isOutdated ? `<span class="stale-clock" title="${timeString}" style="margin-left: 5px;"><svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><line x1="12" y1="12" x2="12" y2="6" stroke="white" stroke-width="2"/><line x1="12" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"/></svg></span>` : "";

        return L.divIcon({
            html: `<div class="precip-marker" style="background-color:${getPrecipColor(precip)};"><span>${Number(precip).toFixed(2)}"</span>${clockHtml}</div>`,
            iconSize: [65, 30], iconAnchor: [32, 15], className: ""
        });
    };

    return (
        <>
            {stations.map(s => {
                if (!s.latitude || (s.is_available !== 1 && s.is_available !== true)) return null;
                let icon = showPrecip12hr ? createPrecipIcon(s.precipitation, s.last_updated) : createSaturationIcon(s.soil_saturation, s.last_updated);
                return <Marker key={s.station_id} position={[s.latitude, s.longitude]} icon={icon}><StationPopup station={s} /></Marker>;
            })}
        </>
    );
};

/* --- LEGENDS & MAIN PAGE --- */

const getPrecipColor = (p) => {
    if (p > 8.0) return "#000066"; if (p >= 7.0) return "#0000CC"; if (p >= 0.01) return "#9FEAFF";
    return "#DADADA";
};

const getStationStatus = (lastUpdated) => {
    if (!lastUpdated) return { isOutdated: true, timeString: "Desconocido" };
    const last = new Date(lastUpdated.replace(' ', 'T') + (lastUpdated.includes('Z') ? '' : '-04:00'));
    const diffMins = Math.floor((new Date() - last) / (1000 * 60));
    let timeString = diffMins > 1440 ? `Hace ${Math.floor(diffMins/1440)} día(s)` : diffMins > 60 ? `Hace ${Math.floor(diffMins/60)} hora(s)` : `Hace ${diffMins} min`;
    return { isOutdated: diffMins > 65, timeString };
};

const PrecipLegend = () => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const stop = (e) => e.stopPropagation();
        el.addEventListener("wheel", stop, { passive: false });
        el.addEventListener("touchstart", stop, { passive: false });
    }, []);

    return (
        <div ref={ref} className="legend-container legend-precipitation legend-scrollable">
            <div className="legend-title">Precipitation (inches)</div>
            {[["#9FEAFF", "0.01 - 0.05"], ["#000066", "Above 8.00"]].map(([c, l]) => (
                <div className="legend-item" key={l}><span className="legend-color-box" style={{background: c}}></span><p>{l}</p></div>
            ))}
        </div>
    );
};

export default function InteractiveMap() {
    const center = [18.220833, -66.420149];
    const [showStations, setShowStations] = useState(true);
    const [selectedYear, setSelectedYear] = useState("");
    const [availableYears, setAvailableYears] = useState([]);
    const [showPrecip, setShowPrecip] = useState(false);
    const [showSusceptibility, setShowSusceptibility] = useState(false);
    const [showSaturation, setShowSaturation] = useState(true);
    const [showPrecip12hr, setShowPrecip12hr] = useState(false);
    const [showSaturationLegend, setShowSaturationLegend] = useState(true);
    const [showSusceptibilityLegend, setShowSusceptibilityLegend] = useState(false);
    const [showPrecipLegend, setShowPrecipLegend] = useState(false);
    const [showZoomHint, setShowZoomHint] = useState(false);
    const [stationsData, setStationsData] = useState([]);
    const [landslidesData, setLandslidesData] = useState([]);
    const [showForecast, setShowForecast] = useState(false);
    const [radarFrames, setRadarFrames] = useState([]);
    const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(localStorage.getItem('disclaimerAccepted') !== 'true');

    useEffect(() => {
        if (!showForecast) return;
        fetch(`${BASE_DOMAIN}/radar/frames`)
            .then(res => res.json())
            .then(data => {
                if (data?.length) { setRadarFrames(data); setCurrentFrameIdx(data.length - 1); }
            });
    }, [showForecast]);

    useEffect(() => {
        let interval;
        if (showForecast && isPlaying && !isDragging && radarFrames.length) {
            interval = setInterval(() => {
                setCurrentFrameIdx(p => (p + 1) >= radarFrames.length ? 0 : p + 1);
            }, FRAME_SPEED);
        }
        return () => clearInterval(interval);
    }, [isPlaying, showForecast, isDragging, radarFrames]);

    const handleExportKML = () => {
        let kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Derrumbe_Data</name>`;
        stationsData.forEach(s => {
            kml += `<Placemark><name>${s.name}</name><Point><coordinates>${s.longitude},${s.latitude},0</coordinates></Point></Placemark>`;
        });
        kml += `</Document></kml>`;
        const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Derrumbe_Data.kml`;
        link.click();
    };

    return (
        <main>
            {showDisclaimer && <Disclaimer onAgree={() => { localStorage.setItem('disclaimerAccepted', 'true'); setShowDisclaimer(false); }} />}
            <MapContainer id="map" center={center} zoom={window.innerWidth < 768 ? 8 : 10} zoomControl={false} style={{ height: '100vh', width: '100%' }}>
                <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                
                <div style={{ position: 'absolute', top: '120px', right: '15px', zIndex: 1000 }}>
                    <button className="export-btn" onClick={handleExportKML}>📥 Exportar KML</button>
                </div>

                <CtrlZoomHandler setShowZoomHint={setShowZoomHint} />
                <MobileTouchHandler />
                <MapMenu 
                    showStations={showStations} onToggleStations={() => setShowStations(!showStations)}
                    showPrecip={showPrecip} onTogglePrecip={() => setShowPrecip(!showPrecip)}
                    showSusceptibility={showSusceptibility} onToggleSusceptibility={() => setShowSusceptibility(!showSusceptibility)}
                    showSaturation={showSaturation} onToggleSaturation={() => { setShowSaturation(true); setShowPrecip12hr(false); }}
                    showPrecip12hr={showPrecip12hr} onTogglePrecip12hr={() => { setShowPrecip12hr(true); setShowSaturation(false); }}
                    availableYears={availableYears} selectedYear={selectedYear} onYearChange={setSelectedYear}
                    showForecast={showForecast} onToggleForecast={() => setShowForecast(!showForecast)}
                />
                <EsriOverlays showPrecip={showPrecip} showSusceptibility={showSusceptibility} />
                
                {showStations && <PopulateStations showSaturation={showSaturation} showPrecip12hr={showPrecip12hr} onDataUpdate={setStationsData} />}
                
                {showForecast && radarFrames[currentFrameIdx] && (
                    <ImageOverlay url={`${BASE_DOMAIN}${radarFrames[currentFrameIdx].url}`} bounds={[[17.5, -68.0], [19.0, -65.0]]} opacity={0.6} />
                )}
                {showForecast && (
                    <TimeControlBar frames={radarFrames} currentIndex={currentFrameIdx} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} onSeek={setCurrentFrameIdx} setIsDragging={setIsDragging} setIsPlaying={setIsPlaying} />
                )}

                {showSaturationLegend && <div className="legend-container">Soil Saturation...</div>}
                {showPrecipLegend && <PrecipLegend />}
                <ZoomControl position="topright" />
                <div className="logo-container"><img src={LandslideLogo} alt="Logo" className="landslide-logo" /></div>
            </MapContainer>
        </main>
    );
}
