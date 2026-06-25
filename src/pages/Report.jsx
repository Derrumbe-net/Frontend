import { useEffect, useRef, useState } from "react";
import "../styles/Report_module.css";
import officeLogo from "../assets/PRLHMO_LOGO.svg";
import Swal from "sweetalert2";
import { SITE_CONFIG } from "@config";

// --- LEAFLET IMPORTS ---
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BASE_REPORT_URL = `${import.meta.env.VITE_API_URL}/reports`;

// --- MAP COMPONENTS ---

function MapClickHandler({ setCoords, onCoordChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setCoords({ lat, lng });
      if (onCoordChange) onCoordChange(lat, lng);
    },
  });
  return null;
}

function MapSearchControl({ setCoords, onCoordChange }) {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: "Buscar dirección o lugar...",
      keepResult: true,
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (e) => {
      const lat = e.location.y;
      const lng = e.location.x;
      setCoords({ lat, lng });
      if (onCoordChange) onCoordChange(lat, lng);
    });

    return () => map.removeControl(searchControl);
  }, [map, setCoords, onCoordChange]);

  return null;
}

function MapLocateControl({ setCoords, onCoordChange }) {
  const map = useMap();

  useEffect(() => {
    const onLocationFound = (e) => {
      const { lat, lng } = e.latlng;
      setCoords({ lat, lng });
      if (onCoordChange) onCoordChange(lat, lng);
      map.flyTo(e.latlng, 16);
    };

    const onLocationError = () => {
      alert("No se pudo acceder a tu ubicación.");
    };

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    const locateControl = L.control({ position: "topleft" });
    locateControl.onAdd = function () {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const a = L.DomUtil.create("a", "", div);
      a.href = "#";
      a.title = "Encontrar mi ubicación";
      a.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4" y1="12" x2="8" y2="12"></line><line x1="16" y1="12" x2="20" y2="12"></line></svg>`;
      L.DomEvent.disableClickPropagation(div);
      a.onclick = (e) => { e.preventDefault(); map.locate(); };
      return div;
    };
    locateControl.addTo(map);

    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
      map.removeControl(locateControl);
    };
  }, [map, setCoords, onCoordChange]);

  return null;
}

// --- MAIN FORM COMPONENT ---

function Report() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    pueblo: "",
    carretera: "",
  });

  // const [message, setMessage] = useState(null);
  const [files, setFiles] = useState([]);
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState(null);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const dropRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const tileLayers = {
    satelite: {
      label: 'Satélite',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles © Esri',
    },
    mapa: {
      label: 'Mapa',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
    },
    topografico: {
      label: 'Topográfico',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap contributors',
    },
  };

  const [activeLayer, setActiveLayer] = useState('satelite');

  const fieldStyle = {
    backgroundColor: "#ffffff",
    opacity: 1,
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
  };

  // Load GeoJSON for municipality detection
  useEffect(() => {
    fetch("/puerto-rico-municipalities.geojson")
      .then(res => res.json())
      .then(data => setMunicipalities(data))
      .catch(err => console.error("GeoJSON load error:", err));
  }, []);

  // Auto-detect municipality from coordinates using ray casting
  const detectMunicipality = (lat, lng) => {
    if (!municipalities) return;

    const pointInPolygon = (point, polygon) => {
      const [px, py] = point;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        const intersect = ((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const checkGeometry = (geometry, point) => {
      if (geometry.type === "Polygon") {
        return pointInPolygon(point, geometry.coordinates[0]);
      } else if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.some(poly => pointInPolygon(point, poly[0]));
      }
      return false;
    };

    for (const feature of municipalities.features) {
      if (checkGeometry(feature.geometry, [lng, lat])) {
        setForm(prev => ({ ...prev, pueblo: feature.properties.NOMBRE }));
        break;
      }
    }
  };

  const handleCoordChange = (lat, lng) => {
    detectMunicipality(lat, lng);
  };

  // Log coordinates silently when they update
  useEffect(() => {
    if (coords) {
      console.log("Coordenadas seleccionadas:", coords);
    }
  }, [coords]);

  // Camera logic
  useEffect(() => {
    if (showCamera) {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Camera Error:", err);
          alert("No se pudo acceder a la cámara.");
          setShowCamera(false);
        }
      })();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [showCamera]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const file = new File([blob], `cam_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
          setFiles(prev => [...prev, file]);
          setShowCamera(false);
        },
        "image/jpeg",
        0.8
      );
    }
  };

  // Drag and drop logic
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => { prevent(e); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files || [])]); };
    ["dragenter", "dragover", "dragleave", "drop"].forEach(ev => el.addEventListener(ev, prevent));
    el.addEventListener("drop", onDrop);
    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach(ev => el.removeEventListener(ev, prevent));
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  const onFilePick = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const errors = [];
    if (!form.pueblo) errors.push(SITE_CONFIG.REPORT.LABEL_PUEBLO);
    if (!form.date) errors.push(SITE_CONFIG.REPORT.LABEL_DATE.replace(":", ""));
    if (!coords) errors.push(SITE_CONFIG.REPORT.LABEL_LOCATION);
    if (files.length === 0) errors.push(SITE_CONFIG.REPORT.LABEL_PHOTO);

    // Validation error
    if (errors.length > 0) {
      Swal.fire({
        title: SITE_CONFIG.REPORT.VALIDATION_ERROR_TITLE,
        html: `${SITE_CONFIG.REPORT.VALIDATION_ERROR_HTML}${errors.join(", ")}</strong>`,
        icon: "warning",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#3B7D23",
      });
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);

    const dbPayload = {
      city: form.pueblo,
      latitude: coords.lat,
      longitude: coords.lng,
      reported_at: form.date,
      physical_address: form.carretera || "",
      reporter_name: form.name || "Anonymous",
      reporter_phone: form.phone || "",
      reporter_email: form.email || "",
      image_url: "",
      description: form.description,
    };

    try {
      const response = await fetch(BASE_REPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);

      const reportId = data.report_id;

      if (files.length > 0 && reportId) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("image_file", file);
          try {
            await fetch(`${BASE_REPORT_URL}/${reportId}/upload`, { method: "POST", body: formData });
          } catch (uploadErr) {
            console.error(`Error uploading ${file.name}`, uploadErr);
          }
        }
      }

      // Success
      Swal.fire({
        title: SITE_CONFIG.REPORT.SUCCESS_TITLE,
        text: SITE_CONFIG.REPORT.SUCCESS_TEXT,
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#3B7D23",
      });
      setForm({ name: "", phone: "", email: "", date: "", description: "", pueblo: "", carretera: "" });
      setFiles([]);
      setCoords(null);
    } catch (error) {
      console.error("Error submitting:", error);
      // Error
      Swal.fire({
        title: SITE_CONFIG.REPORT.ERROR_TITLE,
        text: SITE_CONFIG.REPORT.ERROR_TEXT,
        icon: "error",
        confirmButtonText: "Intentar de nuevo",
        confirmButtonColor: "#3B7D23",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page">
      {showCamera && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <video ref={videoRef} autoPlay playsInline
            style={{ width: "100%", maxWidth: "600px", borderRadius: "10px", backgroundColor: "#000" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
            <button type="button" onClick={takePhoto}
              style={{ backgroundColor: "white", border: "5px solid #ccc", borderRadius: "50%", width: "70px", height: "70px", cursor: "pointer" }}
              aria-label="Tomar foto" />
            <button type="button" onClick={() => setShowCamera(false)}
              style={{ backgroundColor: "transparent", color: "white", border: "none", fontSize: "18px", cursor: "pointer" }}>
              {SITE_CONFIG.REPORT.CAMERA_CANCEL}
            </button>
          </div>
        </div>
      )}

      <div className="report-hero">
        <img src={officeLogo} alt="PRLHMO" className="report-hero__logo" />
        <div className="report-hero__text">
          <h1 className="report-title">{SITE_CONFIG.REPORT.TITLE}</h1>
          <p className="report-subtitle"><strong>{SITE_CONFIG.REPORT.HERO_LABEL}</strong> {SITE_CONFIG.REPORT.SUBTITLE}</p>
        </div>
      </div>

      <hr className="report-divider" />

      <form className="report-form" onSubmit={onSubmit}>

        {/* 1. FECHA */}
        <div className="form-row">
          <label htmlFor="date">{SITE_CONFIG.REPORT.LABEL_DATE} <small style={{color: '#d9534f'}}>*</small></label>
          <input id="date" name="date" type="date" value={form.date} onChange={onChange} style={fieldStyle} max={today} />
        </div>

        {/* 2. FOTO/VIDEO */}
        <div className="form-row">
          <label> {SITE_CONFIG.REPORT.LABEL_PHOTO} <small style={{color: '#d9534f'}}>*</small>:</label>
          <div className="dropzone" ref={dropRef}>
            <div className="dropzone__hint">
              <span className="drop-cloud">☁️</span>
              <p>{SITE_CONFIG.REPORT.DROPZONE_HINT}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                <label className="pick-files-btn">
                  {SITE_CONFIG.REPORT.DROPZONE_PICK}
                  <input type="file" multiple onChange={onFilePick} style={{ display: 'none', cursor: 'pointer' }} />
                </label>
                <button type="button" className="camera-btn" onClick={() => setShowCamera(true)}
                  style={{ backgroundColor: 'none', color: 'black', border: 1, padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  {SITE_CONFIG.REPORT.DROPZONE_CAMERA}
                </button>
              </div>
            </div>
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    <span>{f.name}</span>
                    <button type="button" className="remove-file" onClick={() => removeFile(i)}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 3. PUEBLO */}
        <div className="form-row">
          <label htmlFor="pueblo">{SITE_CONFIG.REPORT.LABEL_PUEBLO} <small style={{color: '#d9534f'}}>*</small></label>
          <select id="pueblo" name="pueblo" value={form.pueblo} onChange={onChange} style={fieldStyle}>
            <option value="">{SITE_CONFIG.REPORT.PUEBLO_PLACEHOLDER}</option>
            {SITE_CONFIG.REPORT.PUEBLOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* 4. UBICACIÓN */}
        <div className="form-row">
          <label>
            {SITE_CONFIG.REPORT.LABEL_LOCATION} <small style={{ color: "#d9534f" }}>{SITE_CONFIG.REPORT.LOCATION_HINT}</small>
          </label>
          <style>{`
            .leaflet-top { top: 15px !important; }
            .leaflet-bottom { bottom: 15px !important; }
            .leaflet-left { left: 15px !important; }
            .leaflet-right { right: 15px !important; }
            .leaflet-bar a {
              background-color: #ffffff !important; color: #333 !important;
              display: flex !important; align-items: center !important;
              justify-content: center !important; width: 30px !important;
              height: 30px !important; text-decoration: none !important;
            }
            .leaflet-bar a:hover { background-color: #f4f4f4 !important; }
            .leaflet-control-geosearch form {
              background: #ffffff !important; border: 1px solid #ccc !important;
              border-radius: 4px !important; padding: 0 !important;
              box-shadow: 0 1px 5px rgba(0,0,0,0.65) !important;
            }
            .leaflet-control-geosearch form input {
              outline: none !important; border: none !important;
              border-radius: 4px !important; background: transparent !important; padding-left: 10px !important;
            }
            .leaflet-control-geosearch a.reset { color: #333 !important; background: transparent !important; }
            .leaflet-control-geosearch .results {
              background: #ffffff !important; border: 1px solid #ccc !important; border-top: none !important;
            }
            .leaflet-control-geosearch .results > * { border-bottom: 1px solid #eee !important; }
            .leaflet-control-geosearch .results > *:hover { background: #f4f4f4 !important; border-color: #f4f4f4 !important; }
          `}</style>
          <div style={{ position: 'relative', height: "400px", width: "100%", borderRadius: "10px", overflow: "hidden", border: "2px solid #a6b09f", marginTop: "10px", zIndex: 0 }}>
            {/* Toggle buttons */}
            <div style={{
              position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000,
              display: 'flex', gap: '4px', background: 'white',
              borderRadius: '4px', overflow: 'hidden',
              boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
            }}>
              {Object.entries(tileLayers).map(([key, layer]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveLayer(key)}
                  style={{
                    padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    border: 'none', background: activeLayer === key ? '#3B7D23' : 'white',
                    color: activeLayer === key ? 'white' : '#333',
                  }}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            <MapContainer center={[18.2, -66.5]} zoom={9} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url={tileLayers[activeLayer].url}
                attribution={tileLayers[activeLayer].attribution}
              />
              <MapClickHandler setCoords={setCoords} onCoordChange={handleCoordChange} />
              <MapSearchControl setCoords={setCoords} onCoordChange={handleCoordChange} />
              <MapLocateControl setCoords={setCoords} onCoordChange={handleCoordChange} />
              {coords && <Marker position={[coords.lat, coords.lng]} />}
            </MapContainer>
          </div>
        </div>

        {/* 5. CARRETERA */}
        <div className="form-row">
          <label htmlFor="carretera">{SITE_CONFIG.REPORT.LABEL_ROAD}</label>
          <input id="carretera" name="carretera" type="text" value={form.carretera} onChange={onChange} style={fieldStyle}
            placeholder={SITE_CONFIG.REPORT.ROAD_PLACEHOLDER} />
        </div>

        {/* 6. DESCRIPCIÓN */}
        <div className="form-row">
          <label htmlFor="description">{SITE_CONFIG.REPORT.LABEL_DESCRIPTION}</label>
          <textarea id="description" name="description" rows={4} value={form.description} onChange={onChange} style={fieldStyle}
            placeholder={SITE_CONFIG.REPORT.DESCRIPTION_PLACEHOLDER} />
        </div>

        {/* SECCIÓN OPCIONAL */}
        <div style={{
          margin: '2rem 0 1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid #a6b09f',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#3B7D23' }}>
            {SITE_CONFIG.REPORT.OPTIONAL_SECTION_TITLE}
          </h3>
        </div>

        {/* 7. NOMBRE */}
        <div className="form-row">
          <label htmlFor="name">{SITE_CONFIG.REPORT.LABEL_NAME}</label>
          <input id="name" name="name" type="text" value={form.name} onChange={onChange} style={fieldStyle} placeholder={SITE_CONFIG.REPORT.NAME_PLACEHOLDER} />
        </div>

        {/* 8. TELÉFONO */}
        <div className="form-row">
          <label htmlFor="phone">{SITE_CONFIG.REPORT.LABEL_PHONE}</label>
          <input id="phone" name="phone" type="tel" value={form.phone} onChange={onChange} style={fieldStyle} placeholder={SITE_CONFIG.REPORT.PHONE_PLACEHOLDER} />
        </div>

        {/* 9. EMAIL */}
        <div className="form-row">
          <label htmlFor="email">{SITE_CONFIG.REPORT.LABEL_EMAIL}</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} style={fieldStyle} placeholder={SITE_CONFIG.REPORT.EMAIL_PLACEHOLDER} />
        </div>

        <div className="form-actions">
          <button className="submit-btn" disabled={submitting}>
            {submitting ? SITE_CONFIG.REPORT.SUBMITTING_BTN : SITE_CONFIG.REPORT.SUBMIT_BTN}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Report;
