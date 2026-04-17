import 'leaflet/dist/leaflet.css';
import '../styles/InteractiveMap.css';
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, Marker } from 'react-leaflet';
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

// $app->get('/stations', ...)
const BASE_STATIONS_URL = `${BASE_DOMAIN}/stations`;

// $app->get('/stations/files/data', ...)
const BASE_FILES_DATA_URL = `${BASE_DOMAIN}/stations/files/data`;

// $app->put('/stations/files/data/{id}/update', ...)
const BASE_UPDATE_PREFIX = `${BASE_DOMAIN}/stations/files/data`;

const BASE_LANDSLIDES_URL = `${BASE_DOMAIN}/landslides`;

const BASE_BATCH_UPDATE_URL = `${BASE_DOMAIN}/stations/batch-update`;


// --- CONSTANTS FOR RADAR ---
const STEP_SIZE = 5 * 60 * 1000; // 5 minutes
const FRAME_SPEED = 1500; // 1.5 seconds per frame
const HISTORY_DURATION = 60 * 60 * 1000 * 1; // 1 hour history

const Disclaimer = ({ onAgree }) => {
    return (
        <div className="disclaimer-overlay">
            <div className="disclaimer-box">
                <h2>Aviso | Disclaimer</h2>
                <p>
                    <strong>EN:</strong> The data presented on this platform is experimental. The Puerto Rico Landslide Hazard Mitigation Office is not responsible for the decisions taken after utilizing our data. By proceeding, you acknowledge and accept this disclaimer.
                </p>
                <p>
                    <strong>ES:</strong> Los datos presentados en esta plataforma son experimentales. La Oficina de Mitigación ante Deslizamientos de Puerto Rico no se hace responsable de las decisiones tomadas utilizando nuestra información. Al continuar, usted reconoce y acepta este aviso.
                </p>
                <button onClick={onAgree}>
                    Acepto | Agree
                </button>
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

                timeoutRef.current = setTimeout(() => {
                    setShowZoomHint(false);
                }, 2500);
            }
        };

        container.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
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
            if (e.touches.length === 2) {
                // Two fingers → disable map drag so page can scroll
                map.dragging.disable();
            } else {
                // One finger → map pans normally
                map.dragging.enable();
            }
        };

        const handleTouchEnd = () => {
            map.dragging.enable();
        };

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [map]);

    return null;
};

const TimeControlBar = ({
    startTime,
    endTime,
    currentTime,
    isPlaying,
    onTogglePlay,
    onSeek,
    setIsDragging,
    setIsPlaying
}) => {
    const map = useMap();
    const containerRef = useRef(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
        const stopAll = (e) => e.stopPropagation();
        el.addEventListener('pointerdown', stopAll);
        el.addEventListener('mousedown',   stopAll);
        el.addEventListener('touchstart',  stopAll, { passive: false });
        el.addEventListener('touchmove',   stopAll, { passive: false });
        return () => {
            el.removeEventListener('pointerdown', stopAll);
            el.removeEventListener('mousedown',   stopAll);
            el.removeEventListener('touchstart',  stopAll);
            el.removeEventListener('touchmove',   stopAll);
        };
    }, []);

    const formatTime = (ts) => {
        if (!ts) return "--:--";
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isDraggingRef = useRef(false);
    const wasPlayingRef = useRef(false); // ← remember pre-drag play state
    const dragValueRef = useRef(null);   // ← track drag value for touch
    const [dragValue, setDragValue] = useState(null);
    const displayTime = dragValue !== null ? dragValue : currentTime;

    const startDrag = (val) => {
        isDraggingRef.current = true;
        wasPlayingRef.current = isPlaying; // ← capture current play state
        if (setIsDragging) setIsDragging(true);
        if (setIsPlaying) setIsPlaying(false); // pause during drag
        const startVal = val ?? currentTime;
        dragValueRef.current = startVal;
        setDragValue(startVal);
        if (map) map.dragging.disable();
    };

    const commitDrag = (val) => {
        isDraggingRef.current = false;
        if (setIsDragging) setIsDragging(false);
        if (setIsPlaying) setIsPlaying(wasPlayingRef.current); // ← restore pre-drag state
        dragValueRef.current = null;
        setDragValue(null);
        if (map) map.dragging.enable();
        onSeek(val);
    };

    const handleMouseDown = () => startDrag(currentTime);

    const handleChange = (e) => {
        const val = Number(e.target.value);
        if (isDraggingRef.current) {
            dragValueRef.current = val;
            setDragValue(val);
        } else {
            dragValueRef.current = null;
            setDragValue(null);
            onSeek(val);
        }
    };

    const handleMouseUp = (e) => {
        if (isDraggingRef.current) commitDrag(Number(e.target.value));
    };

    const handleTouchStart = () => startDrag(currentTime);

    const handleTouchEnd = () => {
        if (isDraggingRef.current) {
            commitDrag(dragValueRef.current ?? currentTime); // ← use ref, not e.target.value
        }
    };

    return (
        <div className="time-control-bar" ref={containerRef}>
            <button
                className="play-pause-btn"
                onClick={onTogglePlay}
                title={isPlaying ? "Pause Animation" : "Play Animation"}
            >
                {isPlaying ? "❚❚" : "▶"}
            </button>

            <div className="time-slider-wrapper">
                <div className="time-labels">
                    <span>{formatTime(startTime)}</span>
                    <span className="current-time-label">{formatTime(displayTime)}</span>
                    <span>{formatTime(endTime)}</span>
                </div>
                <input
                    type="range"
                    className="time-slider-input"
                    min={startTime}
                    max={endTime}
                    step={STEP_SIZE}
                    value={displayTime}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                />
            </div>
        </div>
    );
};

const EsriOverlays = ({ showPrecip, showSusceptibility, showForecast, currentTime}) => {
    const map = useMap();
    const radarLayerRef = useRef(null);

    useEffect(() => {
        const hillshade = EL.tiledMapLayer({
            url: 'https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Hillshade_Puerto_Rico/MapServer',
            opacity: 0.5,
            minZoom: 7,  // Prevents requesting tiles when zoomed too far out
            maxZoom: 16, // Prevents requesting tiles when zoomed too far in (Adjust if layer supports deeper zoom)
            errorTileUrl: '', // Optional: hides the broken image icon if a tile is missing
        }).addTo(map);

        // Use dynamicMapLayer instead of featureLayer to avoid per-pan feature queries.
        // featureLayer re-queries the FeatureServer on every map move/zoom.
        const municipalities = EL.dynamicMapLayer({
            url: 'https://services5.arcgis.com/TQ9qkk0dURXSP7LQ/arcgis/rest/services/LIMITES_LEGALES_MUNICIPIOS/MapServer',
            opacity: 1,
            f: 'image',
        }).addTo(map);

        return () => {
            map.removeLayer(hillshade);
            map.removeLayer(municipalities);
        };
    }, [map]);

    // Forecast Layer Creation
    useEffect(() => {
        if (showForecast) {
            const radarUrl = 'https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer';

            radarLayerRef.current = EL.imageMapLayer({
                url: radarUrl,
                opacity: 0.7,
                useCors: false
            }).addTo(map);

        } else {
            if (radarLayerRef.current) {
                map.removeLayer(radarLayerRef.current);
                radarLayerRef.current = null;
            }
        }

        return () => {
            if (radarLayerRef.current) {
                map.removeLayer(radarLayerRef.current);
                radarLayerRef.current = null;
            }
        };
    }, [map, showForecast]);

    // Debounce radar time updates: waits 500ms after last tick before sending
    // a request to the NOAA ImageServer — prevents one request per animation frame.
    useEffect(() => {
        if (!showForecast || !radarLayerRef.current || !currentTime) return;
        const timer = setTimeout(() => {
            if (radarLayerRef.current) {
                const end = currentTime;
                const start = end - STEP_SIZE;
                radarLayerRef.current.setTimeRange(new Date(start), new Date(end));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [currentTime, showForecast]);


    useEffect(() => {
        let precipLayer;
        if (showPrecip) {
            precipLayer = EL.imageMapLayer({
                url: 'https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer',
                opacity: 0.5,
                // renderingRule: { rasterFunction: 'rft_12hr' },
            }).addTo(map);
        }
        return () => {
            if (precipLayer) map.removeLayer(precipLayer);
        };
    }, [map, showPrecip]);

    useEffect(() => {
        let susceptibilityLayer;
        if (showSusceptibility) {
            susceptibilityLayer = EL.tiledMapLayer({
                url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
                opacity: 0.5,
                minZoom: 7, 
                maxZoom: 16
            }).addTo(map);
        }
        return () => {
            if (susceptibilityLayer) map.removeLayer(susceptibilityLayer);
        };
    }, [map, showSusceptibility]);

    return null;
};

const PopulateStations = ({ showSaturation, showPrecip12hr, showLandslideForecast }) => {
    const [stations, setStations] = useState([]);
    const initialSyncDone = useRef(false);
    // Keep a ref to stations so the heartbeat can read latest data
    // without needing stations in its dependency array
    const stationsRef = useRef([]);

    const fetchStations = () => {
        fetch(BASE_STATIONS_URL)
            .then((response) => {
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                return response.json();
            })
            .then((data) => {
                setStations(data);
                stationsRef.current = data;
            })
            .catch((err) => console.error("API Fetch Error:", err));
    };

    useEffect(() => {
        fetchStations();
    }, []);

    const calculateMetricsFromRawData = (rows, stationInfo) => {
        if (!rows || rows.length === 0) return null;

        const last12 = rows.slice(-12);
        const totalRain = last12.reduce((acc, row) => {
            const val = parseFloat(row['Rain_mm_Tot']);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);

        const lastRow = rows[rows.length - 1];
        const wcRatios = [];
        const limits = [stationInfo.wc1, stationInfo.wc2, stationInfo.wc3, stationInfo.wc4];

        limits.forEach((limit, index) => {
            const key = Object.keys(lastRow).find(k => k.toLowerCase().startsWith(`wc${index + 1}`));
            const val = key ? parseFloat(lastRow[key]) : null;
            const max = parseFloat(limit);
            if (!isNaN(val) && !isNaN(max) && max !== 0) {
                wcRatios.push(val / max);
            }
        });

        let avgSaturation = 0;
        if (wcRatios.length > 0) {
            const sumRatio = wcRatios.reduce((a, b) => a + b, 0);
            avgSaturation = (sumRatio / wcRatios.length) * 100;
        }

        return {
            calculatedPrecip: totalRain,
            calculatedSaturation: avgSaturation
        };
    };

    // --- HEARTBEAT LOGIC ---
    // Uses stationsRef so the interval is registered only ONCE and never
    // torn down / re-created on every stations state update.
    useEffect(() => {
        const checkDataConsistency = async () => {
            const currentStations = stationsRef.current;
            if (currentStations.length === 0) return;

            console.log("Heartbeat: Checking data consistency...");
            try {
                const response = await fetch(BASE_FILES_DATA_URL);
                if (!response.ok) return;

                const filesData = await response.json();
                const batchPayload = [];
                const localUpdates = {};

                filesData.forEach(fileRecord => {
                    const station = currentStations.find(s => s.station_id === fileRecord.station_id);
                    if (station && fileRecord.data) {
                        const metrics = calculateMetricsFromRawData(fileRecord.data, station);
                        if (metrics) {
                            batchPayload.push({
                                station_id: station.station_id,
                                precipitation: metrics.calculatedPrecip,
                                soil_saturation: metrics.calculatedSaturation
                            });
                            localUpdates[station.station_id] = {
                                precipitation: metrics.calculatedPrecip,
                                soil_saturation: metrics.calculatedSaturation
                            };
                        }
                    }
                });

                if (batchPayload.length > 0) {
                    await fetch(BASE_BATCH_UPDATE_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stations: batchPayload })
                    });
                    console.log(`Heartbeat: Updated ${batchPayload.length} stations.`);

                    setStations(prevStations => {
                        const updated = prevStations.map(s => {
                            if (localUpdates[s.station_id]) {
                                return { ...s, ...localUpdates[s.station_id], last_updated: new Date().toISOString() };
                            }
                            return s;
                        });
                        stationsRef.current = updated;
                        return updated;
                    });
                }
            } catch (error) {
                console.error("Error performing batch update:", error);
            }
        };

        // Delay initial sync slightly to ensure fetchStations has populated stationsRef
        const initTimer = setTimeout(() => {
            if (!initialSyncDone.current) {
                checkDataConsistency();
                initialSyncDone.current = true;
            }
        }, 2000);

        // Register interval once — never torn down by state changes
        const interval = setInterval(checkDataConsistency, 300000); // 5 mins

        return () => {
            clearTimeout(initTimer);
            clearInterval(interval);
        };
    }, []); // Empty deps: stable interval, reads fresh data via stationsRef

    /** SOIL SATURATION ICON **/
    const createSaturationIcon = (saturation, lastUpdated) => {
        const { isOffline, isStale, diffHours } = getStationStatus(lastUpdated);

        // OFF STATE
        if (isOffline) {
            return L.divIcon({
                html: `
                    <div class="saturation-marker offline"
                        title="No data for ${Math.floor(diffHours)}+ hours">
                        OFF
                    </div>
                `,
                className: "",
                iconSize: [55, 30],
                iconAnchor: [27, 15],
            });
        }

        let className = "saturation-marker";
        if (saturation >= 90) className += " high";
        else if (saturation >= 80) className += " medium";
        else className += " low";

        const rounded = Math.round(saturation);

        return L.divIcon({
            html: `
                <div class="${className}"
                    title="Last updated ${Math.floor(diffHours)} hour(s) ago">
                    ${rounded}%
                    ${isStale ? `
                        <span class="stale-clock">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                                <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/>
                                <line x1="12" y1="12" x2="12" y2="6" stroke="white" stroke-width="2"/>
                                <line x1="12" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"/>
                            </svg>
                        </span>
                    ` : ""}
                </div>
            `,
            className: "",
            iconSize: [55, 30],
            iconAnchor: [27, 15],
        });
    };

    /** PRECIP COLOR SCALE (MRMS QPE) **/
    const getPrecipColor = (p) => {
        if (p > 8.0) return "#000066";
        if (p >= 7.0) return "#0000CC";
        if (p >= 6.5) return "#3333FF";
        if (p >= 6.0) return "#330033";
        if (p >= 5.5) return "#660066";
        if (p >= 5.0) return "#990099";
        if (p >= 4.5) return "#CC00CC";
        if (p >= 4.0) return "#FF00FF";
        if (p >= 3.5) return "#FF3399";
        if (p >= 3.0) return "#CC0000";
        if (p >= 2.5) return "#FF3300";
        if (p >= 2.0) return "#FF6600";
        if (p >= 1.75) return "#FF9900";
        if (p >= 1.5) return "#FFB733";
        if (p >= 1.25) return "#FFD24D";
        if (p >= 1.0) return "#FFFF66";
        if (p >= 0.80) return "#007F00";
        if (p >= 0.60) return "#009900";
        if (p >= 0.40) return "#00B200";
        if (p >= 0.20) return "#00CC00";
        if (p >= 0.15) return "#0099FF";
        if (p >= 0.10) return "#5FC2FF";
        if (p >= 0.05) return "#7FD6FF";
        if (p >= 0.01) return "#9FEAFF";
        return "#DADADA"; // default/no data
    };

    /** PRECIPITATION ICON **/
    const createPrecipIcon = (precip) => {
        const color = getPrecipColor(precip);
        const rounded = Number(precip).toFixed(2);
        return L.divIcon({
            html: `<div class="precip-marker" style="background-color:${color}">${rounded}"</div>`,
            className: "",
            iconSize: [55, 30],
            iconAnchor: [27, 15],
        });
    };

    return (
        <>
            {stations.map(station => {
                if (station.is_available !== 1) return null;
                let icon = null;

                // Ensure strict types or non-null checks
                if (showLandslideForecast && station.landslide_forecast != null) {
                    icon = createForecastIcon(station.landslide_forecast);
                }
                else if (showSaturation && station.soil_saturation != null) {
                    icon = createSaturationIcon(station.soil_saturation);
                }
                else if (showPrecip12hr && station.precipitation != null) {
                    icon = createPrecipIcon(station.precipitation);
                }
                else {
                    // Fallback Priorities (default view)
                    if (station.soil_saturation != null) {
                        icon = createSaturationIcon(station.soil_saturation);
                    }
                    else if (station.precipitation != null) {
                        icon = createPrecipIcon(station.precipitation);
                    }
                    else {
                        return null;
                    }
                }

                return (
                    <Marker key={station.id} position={[station.latitude, station.longitude]} icon={icon}>
                        <StationPopup station={station} />
                    </Marker>
                );
            })}
        </>
    );
};

const createLandslideIcon = () => {
    return L.icon({
        iconUrl: GreenPinIcon,
        iconSize: [30, 40],        // Adjust size as needed
        iconAnchor: [15, 30],      // Bottom center of the icon
        popupAnchor: [0, -10]      // Popup appears above the pin
    });
};

const PopulateLandslides = ({ selectedYear, setAvailableYears }) => {
    const [allLandslides, setAllLandslides] = useState([]);
    const customIcon = createLandslideIcon();
    // Stable ref so the fetch effect runs exactly once regardless of parent re-renders
    const setAvailableYearsRef = useRef(setAvailableYears);
    useEffect(() => { setAvailableYearsRef.current = setAvailableYears; }, [setAvailableYears]);

    useEffect(() => {
        fetch(BASE_LANDSLIDES_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                setAllLandslides(data);

                const years = data.map(ls => {
                    if (!ls.landslide_date) return null;
                    return new Date(ls.landslide_date).getFullYear();
                });

                const uniqueYears = [...new Set(years)]
                    .filter(year => !isNaN(year) && year !== null)
                    .sort((a, b) => b - a);

                setAvailableYearsRef.current(uniqueYears);
            })
            .catch((err) => {
                console.error("API Fetch Error:", err);
            });
    }, []); // Run once on mount — setAvailableYears is accessed via ref

    const filteredLandslides = allLandslides.filter(landslide => {
        if (selectedYear === 'all') {
            return true;
        }
        if (!landslide.landslide_date) return false;

        const eventYear = new Date(landslide.landslide_date).getFullYear();
        return eventYear === parseInt(selectedYear);
    });

    return (
        <>
            {filteredLandslides.map(landslide => (
                <Marker key={landslide.landslide_id} position={[landslide.latitude, landslide.longitude]} icon={customIcon}>
                    <LandslidePopup landslide={landslide} />
                </Marker>
            ))}
        </>
    );
}

const getStationStatus = (lastUpdated) => {
    if (!lastUpdated) {
        return {
            isOffline: true,
            isStale: false,
            diffHours: null
        };
    }

    const last = new Date(lastUpdated);
    const now = new Date();
    const diffHours = (now - last) / (1000 * 60 * 60);

    return {
        isOffline: diffHours >= 12,
        isStale: diffHours >= 6 && diffHours < 12,
        diffHours
    };
};

const SoilSaturationLegend = () => (
    <div className="legend-container legend-soil-saturation">
        <div className="legend-title">Soil Saturation</div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#e0c853"}}></span>
            <p>0% - 79%</p>
        </div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#63b3ff"}}></span>
            <p>80% – 89%</p>
        </div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#001f57"}}></span>
            <p>90% - 100%</p>
        </div>
    </div>
);

const SusceptibilityLegend = () => (
    <div className="legend-container legend-landslide-susceptibility">
        <div className="legend-title">Landslide Susceptibility</div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#C0C0C0"}}></span>
            <p>Low</p>
        </div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#FFFF00"}}></span>
            <p>Moderate</p>
        </div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#FF9900"}}></span>
            <p>High</p>
        </div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#FF0000"}}></span>
            <p>Very High</p>
        </div>
        <div className="legend-item">
            <span className="legend-color-box" style={{background:"#0000FF"}}></span>
            <p>Exceptionally High</p>
        </div>
    </div>
);

const PrecipLegend = () => {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const stopProp = (e) => e.stopPropagation();

        el.addEventListener("touchstart", stopProp, { passive: false });
        el.addEventListener("touchmove", stopProp, { passive: false });
        el.addEventListener("wheel", stopProp, { passive: false });

        return () => {
            el.removeEventListener("touchstart", stopProp);
            el.removeEventListener("touchmove", stopProp);
            el.removeEventListener("wheel", stopProp);
        };
    }, []);

    return (
        <div ref={ref} className="legend-container legend-precipitation legend-scrollable">
            <div className="legend-title">Precipitation (inches)</div>
            {[
                ["#9FEAFF", "0.01 - 0.05"], ["#7FD6FF", "0.05 - 0.10"], ["#5FC2FF", "0.10 - 0.15"], ["#0099FF", "0.15 - 0.20"],
                ["#00CC00", "0.20 - 0.40"], ["#00B200", "0.40 - 0.60"], ["#009900", "0.60 - 0.80"], ["#007F00", "0.80 - 1.00"],
                ["#FFFF66", "1.00 - 1.25"], ["#FFD24D", "1.25 - 1.50"], ["#FFB733", "1.50 - 1.75"], ["#FF9900", "1.75 - 2.00"],
                ["#FF6600", "2.00 - 2.50"], ["#FF3300", "2.50 - 3.00"], ["#CC0000", "3.00 - 3.50"], ["#FF3399", "3.50 - 4.00"],
                ["#FF00FF", "4.00 - 4.50"], ["#CC00CC", "4.50 - 5.00"], ["#990099", "5.00 - 5.50"], ["#660066", "5.50 - 6.00"],
                ["#330033", "6.00 - 6.50"], ["#3333FF", "6.50 - 7.00"], ["#0000CC", "7.00 - 8.00"], ["#000066", "Above 8.00"],
            ].map(([color, label]) => (
                <div className="legend-item" key={label}>
                    <span className="legend-color-box" style={{background: color}}></span>
                    <p>{label}</p>
                </div>
            ))}
        </div>
    );
};

export default function InteractiveMap() {
    const center = [18.220833, -66.420149];

    // --- COOKIE / STATE INITIALIZATION LOGIC ---
    // const COOKIE_NAME = 'landslide_map_filters';

    // Helper: Safely retrieve and parse the cookie
    // const getSavedSettings = () => {
    //     try {
    //         const saved = Cookies.get(COOKIE_NAME);
    //         return saved ? JSON.parse(saved) : {};
    //     } catch (e) {
    //         console.warn("Failed to parse map settings cookie", e);
    //         return {};
    //     }
    // };

    // const savedSettings = getSavedSettings();

    // UI State: Initialize with cookie value if it exists, otherwise default
    // const [showStations, setShowStations] = useState(savedSettings.showStations ?? true);
    // const [selectedYear, setSelectedYear] = useState(savedSettings.selectedYear ?? "");
    // const [availableYears, setAvailableYears] = useState([]); // Derived from API, not saved
    // const [showPrecip, setShowPrecip] = useState(savedSettings.showPrecip ?? false);
    // const [showSusceptibility, setShowSusceptibility] = useState(savedSettings.showSusceptibility ?? false);

    // Toggle State for Station Visualization Layers
    // const [showSaturation, setShowSaturation] = useState(savedSettings.showSaturation ?? false);
    // const [showPrecip12hr, setShowPrecip12hr] = useState(savedSettings.showPrecip12hr ?? false);

    // Legend State
    // const [showSaturationLegend, setShowSaturationLegend] = useState(savedSettings.showSaturationLegend ?? false);
    // const [showSusceptibilityLegend, setShowSusceptibilityLegend] = useState(savedSettings.showSusceptibilityLegend ?? false);
    // const [showPrecipLegend, setShowPrecipLegend] = useState(savedSettings.showPrecipLegend ?? false);

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
    const hasShownZoomHint = useRef(false);

    // --- RADAR / TIME LOGIC ---
    const [showForecast, setShowForecast] = useState(true);
    // Disclaimer State
    const [showDisclaimer, setShowDisclaimer] = useState(
        localStorage.getItem('disclaimerAccepted') !== 'true'
    );

    // Load cookie AFTER first render to avoid breaking initial logic
    useEffect(() => {
        try {
            const saved = Cookies.get(COOKIE_NAME);
            if (!saved) return;

            const settings = JSON.parse(saved);

            // Apply only the settings that make sense
            if (typeof settings.showStations === 'boolean') setShowStations(settings.showStations);
            if (typeof settings.selectedYear === 'string') setSelectedYear(settings.selectedYear);

            if (typeof settings.showPrecip === 'boolean') setShowPrecip(settings.showPrecip);
            if (typeof settings.showSusceptibility === 'boolean') setShowSusceptibility(settings.showSusceptibility);

            if (typeof settings.showSaturation === 'boolean') setShowSaturation(settings.showSaturation);
            if (typeof settings.showPrecip12hr === 'boolean') setShowPrecip12hr(settings.showPrecip12hr);

            if (typeof settings.showSaturationLegend === 'boolean') setShowSaturationLegend(settings.showSaturationLegend);
            if (typeof settings.showSusceptibilityLegend === 'boolean') setShowSusceptibilityLegend(settings.showSusceptibilityLegend);
            if (typeof settings.showPrecipLegend === 'boolean') setShowPrecipLegend(settings.showPrecipLegend);

        } catch (e) {
            console.warn("Failed to load settings cookie", e);
        }
    }, []);

    
    // --- EFFECT: PERSIST SETTINGS TO COOKIE ---
    useEffect(() => {
        const settingsToSave = {
            showStations,
            selectedYear,
            showPrecip,
            showSusceptibility,
            showSaturation,
            showPrecip12hr,
            showSaturationLegend,
            showSusceptibilityLegend,
            showPrecipLegend,
        };

        // Save cookie with 30-day expiration
        Cookies.set(COOKIE_NAME, JSON.stringify(settingsToSave), { expires: 30 });
    }, [
        showStations,
        selectedYear,
        showPrecip,
        showSusceptibility,
        showSaturation,
        showPrecip12hr,
        showSaturationLegend,
        showSusceptibilityLegend,
        showPrecipLegend
    ]);

    // --- RADAR TIME VARIABLES ---
    const now = new Date();
    const coeff = 1000 * 60 * 5;
    const roundedEnd = new Date(Math.floor(now.getTime() / coeff) * coeff).getTime();
    const roundedStart = roundedEnd - (typeof HISTORY_DURATION !== 'undefined' ? HISTORY_DURATION : 7200000);

    const [radarTimeRange] = useState({ start: roundedStart, end: roundedEnd });
    const [currentTime, setCurrentTime] = useState(roundedStart);
  
    const [isPlaying, setIsPlaying] = useState(false); // Start paused — user initiates playback
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        let interval;

        if (showForecast && isPlaying && !isDragging) {
            interval = setInterval(() => {
            setCurrentTime(prevTime => {
                const nextTime = prevTime + STEP_SIZE;
                if (nextTime > radarTimeRange.end) {
                return radarTimeRange.start;
                }
                return nextTime;
            });
            }, FRAME_SPEED);
        }

        return () => clearInterval(interval);
    }, [isPlaying, showForecast, radarTimeRange, isDragging]);

    const handleSeek = (time) => {
        const step = typeof STEP_SIZE !== 'undefined' ? STEP_SIZE : 300000;
        const snapped = Math.round((time - radarTimeRange.start) / step) * step + radarTimeRange.start;
        setCurrentTime(snapped);
    };

    const handleAgree = () => {
        localStorage.setItem('disclaimerAccepted', 'true');
        setShowDisclaimer(false);
    };

    const toggleStations = () => {
        const newValue = !showStations;
        setShowStations(newValue);

        if (newValue) {
            // Stations turned ON → clear any selected year
            setSelectedYear("");

            // Default station display
            setShowSaturation(true);
            setShowPrecip12hr(false);

            // Legends
            setShowSaturationLegend(true);
            setShowPrecipLegend(false);
            setShowSusceptibilityLegend(false);
        }
    };

    const togglePrecip = () => setShowPrecip(v => !v);
    const toggleSusceptibility = () => setShowSusceptibility(v => !v);

    // Mutually Exclusive Toggles for Station Data (radio behavior)
    const toggleSaturation = () => {
        setSelectedYear("");
        setShowStations(true);
        setShowSaturation(true);
        setShowPrecip12hr(false);
    };
    const togglePrecip12hr = () => {
        setSelectedYear("");
        setShowStations(true);
        setShowPrecip12hr(true);
        setShowSaturation(false);
    };

    const toggleSaturationLegend = () => setShowSaturationLegend(v => !v);
    const toggleSusceptibilityLegend = () => setShowSusceptibilityLegend(v => !v);
    const togglePrecipLegend = () => setShowPrecipLegend(v => !v);
    const toggleForecast = () => setShowForecast(v => !v);

    const handleYearChange = (year) => {
        setSelectedYear(year);

        if (year) {
            setShowStations(false);
            setShowSaturation(false);
            setShowPrecip12hr(false);
            setShowSaturationLegend(false);
            setShowPrecipLegend(false);
        } else {
            setShowStations(true);
            setShowSaturation(true);
            setShowPrecip12hr(false);

            setShowSaturationLegend(true);
            setShowSusceptibilityLegend(false);
            setShowPrecipLegend(false);
        }
    };

    const resetLayers = () => {
        setShowStations(false);
        setShowPrecip(false);
        setShowSusceptibility(false);
        setShowForecast(false);
        setShowSaturation(false);
        setShowPrecip12hr(false);

        setShowSaturationLegend(false);
        setShowSusceptibilityLegend(false);
        setShowPrecipLegend(false);
    };

    const resetToDefault = () => {
        setShowStations(true);
        setShowSaturation(true);
        setShowPrecip12hr(false);
        setShowPrecip(false);
        setShowSusceptibility(false);
        setShowForecast(false);

        setShowSaturationLegend(true);
        setShowSusceptibilityLegend(false);
        setShowPrecipLegend(false);
    };

    // --- MOBILE & LABEL LOGIC (From 'demo2' branch) ---
    const isMobile = window.innerWidth < 768;

    let mapLabelText = "";

    if (selectedYear) {
        mapLabelText = "HISTORICAL LANDSLIDE DATA";
    } else if (showSaturation) {
        mapLabelText = "SOIL SATURATION PERCENTAGE";
    } else if (showPrecip12hr) {
        mapLabelText = "PAST 12 HOUR PRECIPITATION (INCHES)";
    } else {
        mapLabelText = "SOIL SATURATION PERCENTAGE"; // fallback if needed
    }

    return (
        <main>
            {showDisclaimer && <Disclaimer onAgree={handleAgree} />}

            <MapContainer
                id="map"
                center={center}
                zoom={isMobile ? 8 : 10}
                minZoom={7}
                maxZoom={18}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: '100vh', width: '100%' }}
            >
                {mapLabelText && <div className="map-label">{mapLabelText}</div>}

                <TileLayer
                    url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles © Esri"
                />

               {showZoomHint && (
                <div className="zoom-hint">
                    Press Ctrl + scroll to zoom
                </div>
                )} 

                <CtrlZoomHandler setShowZoomHint={setShowZoomHint} hasShownZoomHint={hasShownZoomHint} />
                <MobileTouchHandler />

                <MapMenu
                    showStations={showStations} onToggleStations={toggleStations}
                    showPrecip={showPrecip} onTogglePrecip={togglePrecip}
                    showSusceptibility={showSusceptibility} onToggleSusceptibility={toggleSusceptibility}

                    showSaturation={showSaturation} onToggleSaturation={toggleSaturation}
                    showPrecip12hr={showPrecip12hr} onTogglePrecip12hr={togglePrecip12hr}
        
                    showSaturationLegend={showSaturationLegend} onToggleSaturationLegend={toggleSaturationLegend}
                    showSusceptibilityLegend={showSusceptibilityLegend} onToggleSusceptibilityLegend={toggleSusceptibilityLegend}
                    showPrecipLegend={showPrecipLegend} onTogglePrecipLegend={togglePrecipLegend}

                    availableYears={availableYears} selectedYear={selectedYear} onYearChange={handleYearChange}
                    showForecast={showForecast} onToggleForecast={toggleForecast}

                    resetLayers={resetLayers}
                    resetToDefault={resetToDefault}
                />

                <EsriOverlays
                    showPrecip={showPrecip}
                    showSusceptibility={showSusceptibility}
                    showForecast={showForecast}
                    currentTime={currentTime}
                />

                {!isMobile && <ZoomControl position="topright" />}

                {showStations && (
                    <PopulateStations
                        showSaturation={showSaturation}
                        showPrecip12hr={showPrecip12hr}
                    />
                )}

                <PopulateLandslides selectedYear={selectedYear} setAvailableYears={setAvailableYears} />

                {showSaturationLegend && <SoilSaturationLegend />}
                {showSusceptibilityLegend && <SusceptibilityLegend />}
                {showPrecipLegend && <PrecipLegend />}

                {showForecast && (
                    <TimeControlBar
                        startTime={radarTimeRange.start}
                        endTime={radarTimeRange.end} 
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        onTogglePlay={() => setIsPlaying(p => !p)}
                        onSeek={handleSeek}
                        setIsDragging={setIsDragging}
                        setIsPlaying={setIsPlaying}
                    />
                )}

                <div className="logo-container">
                    <img src={LandslideLogo} alt="Landslide Hazard Mitigation Logo" className="landslide-logo" />
                </div>
            </MapContainer>
        </main>
    );
}
