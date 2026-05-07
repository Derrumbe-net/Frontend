import { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import '../styles/StationPopup.css';

const isMobile = window.matchMedia("(max-width: 768px)").matches;

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

const API_URL = import.meta.env.VITE_API_URL;

const StationPopup = ({ station }) => {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [images, setImages] = useState([]);

    useEffect(() => {
        if (!station) return;

        const id = station.id || station.station_id;
        const imgs = [];

        // We no longer need to fetch! We check the paths directly from the optimized station object
        if (station.sensor_image_path) {
            imgs.push({
                src: `${API_URL}/stations/item/${id}/images/sensor`,
                label: 'Sensor View'
            });
        }
        if (station.plot_image_path) {
            imgs.push({
                src: `${API_URL}/stations/item/${id}/images/plot`,
                label: 'Data Plot'
            });
        }

        setImages(imgs);
        setCurrentImgIndex(0);
    }, [station]);

    if (!station) return null;

    // Fixed: Ensure we pull 'name' first since that matches the new DB schema!
    const stationName = station.name || station.city || "Estación Desconocida";
    const soilSaturation = station.soil_saturation;
    const lastUpdated = station.last_updated;
    const precip = station.precipitation;

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const openInNewTab = () => {
        if (images.length > 0) {
            window.open(images[currentImgIndex].src, '_blank', 'noopener,noreferrer');
        }
    };

    let normalizedDate = lastUpdated;
    if (normalizedDate && typeof normalizedDate === 'string') {
        normalizedDate = normalizedDate.replace(' ', 'T').replace('Z', '');
        if (!normalizedDate.includes('-04:00')) {
            normalizedDate += '-04:00';
        }
    }

    const formattedLastUpdated =
        normalizedDate
            ? new Date(normalizedDate).toLocaleString('en-US', {
                timeZone: 'America/Puerto_Rico',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
            : 'N/A';

    const formattedSoilSaturation =
        soilSaturation !== null && soilSaturation !== undefined
            ? Math.ceil(Number(soilSaturation))
            : 'N/A';

    const formattedPrecip = precip != null
        ? Number(precip).toFixed(2)
        : '0.00';

    return (
        <Popup maxWidth={isMobile ? 200 : 350}>
            <div className="custom-popup-content">
                <div className="info roboto-condensed">
                    <h2 className="bebas-neue">{stationName}</h2>

                    {/* Instant Carousel - No more Loading State! */}
                    {images.length > 0 && (
                        <div className="popup-carousel">
                            <div
                                className="carousel-image-container"
                                onClick={openInNewTab}
                                style={{ cursor: 'pointer' }}
                            >
                                <img
                                    src={images[currentImgIndex].src}
                                    alt={images[currentImgIndex].label}
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
                                    <span className="carousel-counter">
                                        {currentImgIndex + 1} / {images.length}
                                    </span>
                                    <button onClick={nextImage} className="carousel-btn right">
                                        <ChevronRight />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <ul>
                        <li><strong>Last Updated:</strong> <span>{formattedLastUpdated} AST</span></li>
                        <li><strong>Soil Saturation:</strong> <span>{formattedSoilSaturation}%</span></li>
                        <li><strong>12 HRS Precipitation:</strong> <span>{formattedPrecip} inches</span></li>
                    </ul>
                </div>
            </div>
        </Popup>
    );
};

export default StationPopup;