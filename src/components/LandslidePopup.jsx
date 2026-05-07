import React, { useState, useCallback } from 'react';
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

// Module-level cache: landslide_id → image array (persists across popup open/close)
const imageCache = {};

const LandslidePopup = ({ landslide }) => {
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

    if (!landslide) return null;

    const lsId = landslide.id || landslide.landslide_id;
    const dateStr = landslide.landslide_date || landslide.date;

    // Fetch only when the popup is actually opened by the user.
    // Also uses a cache so re-opening the same popup never re-fetches.
    const handleOpen = useCallback(async () => {
        if (!lsId) return;
        // Already fetched for this landslide — use cache
        if (imageCache[lsId] !== undefined) {
            setImages(imageCache[lsId]);
            setHasLoaded(true);
            return;
        }

        setLoading(true);
        setImages([]);
        setHasLoaded(false);

        try {
            const response = await fetch(`${API_BASE_URL}/landslides/${lsId}/images`);
            if (response.ok) {
                const data = await response.json();
                
                const imgArray = Array.isArray(data) ? data : (data.images || []);
                
                // Construct the URLs to hit your working GET /landslides/{id}/images/{filename} route
                const formatted = imgArray.map((imgItem, index) => {
                    const imgName = typeof imgItem === 'string' ? imgItem : (imgItem.filename || imgItem.name);
                    return {
                        src: `${API_BASE_URL}/landslides/${lsId}/images/${imgName}`,
                        label: `View ${index + 1}`
                    };
                });
                
                imageCache[lsId] = formatted; // store in cache
                setImages(formatted);
            } else {
                imageCache[lsId] = []; // cache the empty result too
            }
        } catch (error) {
            console.error("Error fetching landslide images:", error);
            imageCache[lsId] = [];
        } finally {
            setLoading(false);
            setHasLoaded(true);
            setCurrentIndex(0);
        }
    }, [lsId, API_BASE_URL]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const openInNewTab = () => {
        if (images.length > 0) {
            window.open(images[currentIndex].src, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Popup maxWidth={isMobile ? 200 : 350} eventHandlers={{ add: handleOpen }}>
            <div className="custom-popup-content">
                <div className="info roboto-condensed">

                    <h2 className="bebas-neue">Reported Landslide</h2>

                    {/* --- CAROUSEL SECTION --- */}
                    <div className="popup-carousel">
                        <div
                            className="carousel-image-container"
                            onClick={hasLoaded && images.length > 0 ? openInNewTab : null}
                            style={{
                                height: '200px',
                                overflow: 'hidden',
                                cursor: (hasLoaded && images.length > 0) ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f0f0f0'
                            }}
                        >
                            {loading && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="spinner" style={{ marginBottom: '5px' }}></div>
                                    <span style={{ color: '#666', fontSize: '14px' }}>Fetching images...</span>
                                </div>
                            )}

                            {!loading && hasLoaded && (
                                images.length > 0 ? (
                                    <>
                                        <img
                                            src={images[currentIndex].src}
                                            alt="Landslide"
                                            className="carousel-img clickable"
                                            title="Click to open in new tab"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div className="carousel-label">
                                            {currentIndex + 1} / {images.length}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                                        No images available
                                    </div>
                                )
                            )}

                            {/* Before popup is opened for first time, show a neutral placeholder */}
                            {!loading && !hasLoaded && (
                                <div style={{ color: '#aaa', fontSize: '14px', fontStyle: 'italic' }}>
                                    Click marker to load images
                                </div>
                            )}
                        </div>

                        {!loading && hasLoaded && images.length > 1 && (
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
                    {/* --- END CAROUSEL --- */}

                    <ul>
                        <li>
                            <strong>Date:</strong>
                            <span>{formatDate(dateStr)}</span>
                        </li>
                    </ul>

                </div>
            </div>
        </Popup>
    );
};

export default LandslidePopup;