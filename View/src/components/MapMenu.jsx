import "../styles/MapMenu.css";
import { useState } from "react";
import layersIcon from "../assets/layers-icon.png";
import historyIcon from "../assets/history-icon.png";
import settingsIcon from "../assets/settings-icon.png";

export default function MapMenu({
                                    showStations,
                                    onToggleStations,
                                    showPrecip,
                                    onTogglePrecip,
                                    showSusceptibility,
                                    onToggleSusceptibility,
                                    showForecast,
                                    onToggleForecast,
                                    showSaturation,
                                    onToggleSaturation,
                                    showPrecip12hr,
                                    onTogglePrecip12hr,

                                    showSaturationLegend,
                                    onToggleSaturationLegend,
                                    showSusceptibilityLegend,
                                    onToggleSusceptibilityLegend,
                                    showPrecipLegend,
                                    onTogglePrecipLegend,

                                    availableYears,
                                    selectedYear,
                                    onYearChange,
                                }) {
    const [activeMenu, setActiveMenu] = useState(null);

    const toggleLayers = () =>
        setActiveMenu(prev => (prev === "layers" ? null : "layers"));
    const toggleSettings = () =>
        setActiveMenu(prev => (prev === "settings" ? null : "settings"));
    const toggleHistory = () =>
        setActiveMenu(prev => (prev === "history" ? null : "history"));

    return (
        <div className={`map-menu ${activeMenu ? "expanded" : ""}`}>
            <div className="menu-row">

                <button
                    className={`icon-btn ${activeMenu === "layers" ? "active" : ""}`}
                    onClick={toggleLayers}
                    title="Layers"
                >
                    <img src={layersIcon} alt="Layers" className="menu-icon" />
                </button>

                <button
                    className={`icon-btn ${activeMenu === "settings" ? "active" : ""}`}
                    onClick={toggleSettings}
                    title="Monitoring Station Data"
                >
                    <img src={settingsIcon} alt="Settings" className="menu-icon" />
                </button>

                <button
                    className={`icon-btn ${activeMenu === "history" ? "active" : ""}`}
                    onClick={toggleHistory}
                    title="History"
                >
                    <img src={historyIcon} alt="History" className="menu-icon" />
                </button>
            </div>

            {activeMenu === "layers" && (
                <div className="filters">
                    <label>
                        <input type="checkbox" checked={showStations} onChange={onToggleStations} />
                        Stations
                    </label>

                    <label>
                        <input type="checkbox" checked={showPrecip} onChange={onTogglePrecip} />
                        Precipitation Layer
                    </label>

                    {}
                    <label>
                        <input type="checkbox" checked={showForecast} onChange={onToggleForecast} />
                        Weather Forecast
                    </label>
                    {}

                    <label>
                        <input type="checkbox" checked={showSusceptibility} onChange={onToggleSusceptibility} />
                        Susceptibility Layer
                    </label>
                </div>
            )}

            {activeMenu === "settings" && (
                <div className="filters">
                    <div className="filter-title">Monitoring Station Data</div>

                    <label>
                        <input
                            type="checkbox"
                            checked={showSaturation}
                            onChange={onToggleSaturation}
                        />
                        Soil Saturation (%)
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={showPrecip12hr}
                            onChange={onTogglePrecip12hr}
                        />
                        Precipitation (Last 12hr)
                    </label>

                    <div className="filter-title" style={{ marginTop: "15px" }}>
                        Legends
                    </div>

                    <label>
                        <input
                            type="checkbox"
                            checked={showSaturationLegend}
                            onChange={onToggleSaturationLegend}
                        />
                        Soil Saturation
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={showSusceptibilityLegend}
                            onChange={onToggleSusceptibilityLegend}
                        />
                        Susceptibility
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={showPrecipLegend}
                            onChange={onTogglePrecipLegend}
                        />
                        Precipitation Estimates
                    </label>

                </div>
            )}

            {activeMenu === "history" && (
                <div className="filters">
                    <div className="filter-title">Filter Landslides by Year</div>

                    <label>
                        <input
                            type="checkbox"
                            checked={selectedYear === "all"}
                            onChange={() => onYearChange(selectedYear === "all" ? "" : "all")}
                        />
                        All Years
                    </label>

                    {availableYears.map((year) => (
                        <label key={year}>
                            <input
                                type="checkbox"
                                checked={selectedYear === String(year)}
                                onChange={() =>
                                    onYearChange(
                                        selectedYear === String(year) ? "all" : String(year)
                                    )
                                }
                            />
                            {year}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}