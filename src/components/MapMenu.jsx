import "../styles/MapMenu.css";
import { useState } from "react";
import layersIcon from "../assets/layers-icon.png";
import historyIcon from "../assets/history-icon.png";
import settingsIcon from "../assets/settings-icon.png";
import { SITE_CONFIG } from "@config";

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

                                    resetLayers,
                                    resetToDefault,
                                }) {
    const [activeMenu, setActiveMenu] = useState(null);

    const toggleLayers = () =>
        setActiveMenu(prev => (prev === "layers" ? null : "layers"));
    // const toggleSettings = () =>
    //     setActiveMenu(prev => (prev === "settings" ? null : "settings"));
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

                {/* <button
                    className={`icon-btn ${activeMenu === "settings" ? "active" : ""}`}
                    onClick={toggleSettings}
                    title="Monitoring Station Data"
                >
                    <img src={settingsIcon} alt="Settings" className="menu-icon" />
                </button> */}

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

                    {/* --- STATIONS SECTION --- */}
                    <div className="filter-title">{SITE_CONFIG.MAP_MENU.TITLE_STATIONS}</div>

                    <div className="nested-section">

                    <label>
                        <input
                        type="radio"
                        name="stationData"
                        checked={showSaturation}
                        onChange={onToggleSaturation}
                        />
                        {SITE_CONFIG.MAP_MENU.LABEL_SOIL_SATURATION_PCT}
                    </label>

                    <label>
                        <input
                        type="radio"
                        name="stationData"
                        checked={showPrecip12hr}
                        onChange={onTogglePrecip12hr}
                        />
                        {SITE_CONFIG.MAP_MENU.LABEL_PRECIPITATION_12HR}
                    </label>
                    </div>

                    {/* --- OTHER LAYERS --- */}
                    <div className="filter-title" style={{ marginTop: "15px" }}>
                        {SITE_CONFIG.MAP_MENU.TITLE_OTHER_LAYERS}
                    </div>

                    <label>
                    <input type="checkbox" checked={showPrecip} onChange={onTogglePrecip} />
                    {SITE_CONFIG.MAP_MENU.LABEL_PRECIP_ESTIMATES}
                    </label>

                    <label>
                    <input type="checkbox" checked={showForecast} onChange={onToggleForecast} />
                    {SITE_CONFIG.MAP_MENU.LABEL_WEATHER_RADAR}
                    </label>

                    <label>
                    <input
                        type="checkbox"
                        checked={showSusceptibility}
                        onChange={onToggleSusceptibility}
                    />
                    {SITE_CONFIG.MAP_MENU.LABEL_SUSCEPTIBILITY}
                    </label>

                    {/* --- LEGENDS --- */}
                    <div className="filter-title" style={{ marginTop: "15px" }}>
                        {SITE_CONFIG.MAP_MENU.TITLE_LEGENDS}
                    </div>

                    <label>
                    <input
                        type="checkbox"
                        checked={showSaturationLegend}
                        onChange={onToggleSaturationLegend}
                    />
                    {SITE_CONFIG.INTERACTIVE_MAP.LEGEND_SATURATION_TITLE}
                    </label>

                    <label>
                    <input
                        type="checkbox"
                        checked={showSusceptibilityLegend}
                        onChange={onToggleSusceptibilityLegend}
                    />
                    {SITE_CONFIG.INTERACTIVE_MAP.LEGEND_SUSCEPTIBILITY_TITLE}
                    </label>

                    <label>
                    <input
                        type="checkbox"
                        checked={showPrecipLegend}
                        onChange={onTogglePrecipLegend}
                    />
                    {SITE_CONFIG.INTERACTIVE_MAP.LEGEND_PRECIPITATION_TITLE}
                    </label>

                </div>
            )}

            {activeMenu === "history" && (
                <div className="filters">
                    <div className="filter-title">{SITE_CONFIG.MAP_MENU.TITLE_HISTORY}</div>

                    <label>
                        <input
                            type="checkbox"
                            checked={selectedYear === "all"}
                            onChange={() => {
                                if (selectedYear !== "all") {
                                    onYearChange("all");
                                } else {
                                    onYearChange("");
                                    resetToDefault();
                                }
                            }}
                        />
                        {SITE_CONFIG.MAP_MENU.LABEL_ALL_YEARS}
                    </label>

                    {availableYears.map((year) => (
                        <label key={year}>
                            <input
                                type="checkbox"
                                checked={selectedYear === String(year)}
                                onChange={() => {
                                    if (selectedYear !== String(year)) {
                                        onYearChange(String(year));
                                    } else {
                                        // Unchecking current year
                                        onYearChange("");
                                        resetToDefault();
                                    }
                                }}
                            />
                            {year}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
