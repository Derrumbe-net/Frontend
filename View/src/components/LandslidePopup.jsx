import React, { useState, useEffect } from 'react'; // Re-added useEffect
import { Popup } from 'react-leaflet';
import '../styles/StationPopup.css';

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

const LandslidePopup = ({ landslide }) => {
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true); // Start loading immediately
    const [hasLoaded, setHasLoaded] = useState(false);

    const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

    if (!landslide) return null;

    const { landslide_id, landslide_date } = landslide;

    // Trigger fetch immediately when component mounts (Popup opens)
    useEffect(() => {
        let isMounted = true; // Cleanup flag

        const fetchImages = async () => {
            setLoading(true);
            setImages([]);

            try {
                const response = await fetch(`${API_BASE_URL}/landslides/${landslide_id}/images`);
                if (response.ok) {
                    const data = await response.json();
                    if (isMounted && data.images && Array.isArray(data.images)) {
                        const formattedImages = data.images.map((imgName, index) => ({
                            src: `${API_BASE_URL}/landslides/${landslide_id}/images/${imgName}`,
                            label: `View ${index + 1}`
                        }));
                        setImages(formattedImages);
                    }
                }
            } catch (error) {
                console.error("Error connecting to API:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setHasLoaded(true);
                    setCurrentIndex(0);
                }
            }
        };

        fetchImages();

        return () => { isMounted = false; };
    }, [landslide_id, API_BASE_URL]);

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

    const openInNewTab = (e) => {
        if (images.length > 0) {
            window.open(images[currentIndex].src, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Popup maxWidth={350}>
            <div className="custom-popup-content">
                <div className="info roboto-condensed">

                    {/* Header */}
                    <h2 className="bebas-neue">
                        Reported Landslide
                    </h2>

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
                            {/* Loading State */}
                            {loading && (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    <div className="spinner" style={{marginBottom:'5px'}}></div>
                                    <span style={{color:'#666', fontSize:'14px'}}>Fetching images...</span>
                                </div>
                            )}

                            {/* Loaded State */}
                            {!loading && hasLoaded && (
                                images.length > 0 ? (
                                    <>
                                        <img
                                            src={images[currentIndex].src}
                                            alt="Landslide"
                                            className="carousel-img clickable"
                                            title="Click to open in new tab"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <div className="carousel-label">
                                            {currentIndex + 1} / {images.length}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{color: '#666', fontSize: '14px', fontStyle: 'italic'}}>
                                        No images available
                                    </div>
                                )
                            )}
                        </div>

                        {/* Controls (Only show if loaded and > 1 image) */}
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

                    {/* Data List */}
                    <ul>
                        <li>
                            <strong>Date:</strong>
                            <span>{formatDate(landslide_date)}</span>
                        </li>
                    </ul>

                </div>
            </div>
        </Popup>
    );
};

export default LandslidePopup;