import React, { useState } from 'react'; // Removed useEffect
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
const CameraIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginBottom: '5px'}}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const LandslidePopup = ({ landslide }) => {
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false); // New state to track if we tried fetching

    const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

    if (!landslide) return null;

    const { landslide_id, landslide_date } = landslide;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleLoadPhotos = async (e) => {
        if (e) e.stopPropagation(); // Prevent map click through

        setLoading(true);
        setImages([]);

        try {
            const response = await fetch(`${API_BASE_URL}/landslides/${landslide_id}/images`);
            if (response.ok) {
                const data = await response.json();
                if (data.images && Array.isArray(data.images)) {
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
            setLoading(false);
            setHasLoaded(true); // Mark as loaded so we don't show the button again
            setCurrentIndex(0);
        }
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
                            {!hasLoaded && !loading && (
                                <button
                                    onClick={handleLoadPhotos}
                                    style={{
                                        border: 'none',
                                        background: '#333',
                                        color: 'white',
                                        padding: '10px 15px',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        fontSize: '14px'
                                    }}
                                >
                                    <CameraIcon />
                                    Load Photos
                                </button>
                            )}

                            {loading && (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    <div className="spinner" style={{marginBottom:'5px'}}></div> {/* CSS Spinner recommended */}
                                    <span style={{color:'#666', fontSize:'14px'}}>Fetching images...</span>
                                </div>
                            )}

                            {hasLoaded && !loading && (
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
                                        No images found
                                    </div>
                                )
                            )}
                        </div>

                        {hasLoaded && images.length > 1 && (
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
