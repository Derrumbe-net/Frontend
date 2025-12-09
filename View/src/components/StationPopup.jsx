import { useState } from 'react';
import { Popup } from 'react-leaflet';
import '../styles/StationPopup.css';

// Simple SVG Icons for arrows
const ChevronLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);
const ChevronRight = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const StationPopup = ({ station }) => {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    if (!station) {
        return null;
    }

    const soilSaturation = station.soil_saturation;
    const lastUpdated = station.last_updated;
    const city = station.city;
    const precip = station.precipitation;

    // Construct image list
    const images = [];
    if (station.sensor_image_url) {
        images.push({
            src: `/api/stations/${station.station_id}/image/sensor`,
            label: 'Sensor View' // Added label for clarity
        });
    }
    if (station.data_image_url) {
        images.push({
            src: `/api/stations/${station.station_id}/image/data`,
            label: 'Data View' // Added label for clarity
        });
    }

    const nextImage = (e) => {
        if(e) e.stopPropagation();
        setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevImage = (e) => {
        if(e) e.stopPropagation();
        setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const openInNewTab = (e) => {
        if (images.length > 0) {
            window.open(images[currentImgIndex].src, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Popup maxWidth={350}>
            <div className="custom-popup-content">
                <div className="info roboto-condensed">
                    <h2 className="bebas-neue">
                        {city}
                    </h2>

                    {/* CAROUSEL SECTION */}
                    {images.length > 0 && (
                        <div className="popup-carousel">
                            <div
                                className="carousel-image-container"
                                onClick={openInNewTab}
                                style={{ cursor: 'pointer' }}
                            >
                                <img
                                    src={images[currentImgIndex].src}
                                    alt={images[currentImgIndex].label || "Station Image"}
                                    className="carousel-img clickable"
                                    title="Click to open in new tab"
                                />
                                <div className="carousel-label">
                                    {images[currentImgIndex].label}
                                </div>
                            </div>

                            {images.length > 1 && (
                                <div className="carousel-controls">
                                    <button onClick={prevImage} className="carousel-btn left">
                                        <ChevronLeft />
                                    </button>
                                    <button onClick={nextImage} className="carousel-btn right">
                                        <ChevronRight />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {/* END CAROUSEL SECTION */}

                    <ul>
                        <li>
                            <strong>Last Updated:</strong> <span>{lastUpdated} AST</span>
                        </li>
                        <li>
                            <strong>Soil Saturation:</strong> <span>{soilSaturation}%</span>
                        </li>
                        <li>
                            <strong>12 HRS Precipitation:</strong> <span>{precip} inches</span>
                        </li>
                    </ul>

                </div>
            </div>
        </Popup>
    );
};

export default StationPopup;