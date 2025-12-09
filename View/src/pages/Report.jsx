import { useEffect, useRef, useState } from "react";
import "../styles/Report_module.css";

import officeLogo from "../assets/PRLHMO_LOGO.svg";

import "@arcgis/core/assets/esri/themes/light/main.css";
import EsriMap from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Locate from "@arcgis/core/widgets/Locate";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import CoordinateConversion from "@arcgis/core/widgets/CoordinateConversion";

const BASE_REPORT_URL = `${import.meta.env.VITE_API_URL}/reports`;

function Report() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    description: "",
    pueblo: "",
    carretera: "",
    allowLocation: false,
  });

  const [message, setMessage] = useState(null);
  const [files, setFiles] = useState([]);
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const dropRef = useRef(null);
  const mapRef = useRef(null);
  const viewRef = useRef(null);

  const pueblos = [
    "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo", "Arroyo", "Barceloneta",
    "Barranquitas", "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas", "Carolina", "Cataño", "Cayey", "Ceiba",
    "Ciales", "Cidra", "Coamo", "Comerío", "Corozal", "Culebra", "Dorado", "Fajardo", "Florida", "Guánica", "Guayama",
    "Guayanilla", "Guaynabo", "Gurabo", "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz",
    "Juncos", "Lajas", "Lares", "Las Marías", "Las Piedras", "Loíza", "Luquillo", "Manatí", "Maricao", "Maunabo",
    "Mayagüez", "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis", "Patillas", "Peñuelas", "Ponce", "Quebradillas",
    "Rincón", "Río Grande", "Sabana Grande", "Salinas", "San Germán", "San Juan", "San Lorenzo", "San Sebastián",
    "Santa Isabel", "Toa Alta", "Toa Baja", "Trujillo Alto", "Utuado", "Vega Alta", "Vega Baja", "Vieques", "Villalba",
    "Yabucoa", "Yauco"
  ];


  useEffect(() => {
    if (showCamera) {

      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera Error:", err);
          alert("No se pudo acceder a la cámara. Asegúrese de permitir el acceso o de estar usando HTTPS/Localhost.");
          setShowCamera(false);
        }
      })();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [showCamera]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      // Set canvas size to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert Canvas to File object
      canvas.toBlob((blob) => {
        if (!blob) return;
        const fileName = `cam_capture_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });
        
        // Add to existing files
        setFiles((prev) => [...prev, file]);
        
        // Close Camera
        setShowCamera(false);
      }, 'image/jpeg', 0.8);
    }
  };

  // --- Drag and Drop Logic ---
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => {
      prevent(e);
      const list = Array.from(e.dataTransfer.files || []);
      setFiles((prev) => [...prev, ...list]);
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) =>
      el.addEventListener(ev, prevent)
    );
    el.addEventListener("drop", onDrop);

    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) =>
        el.removeEventListener(ev, prevent)
      );
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  const onFilePick = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...list]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "allowLocation") setShowMap(checked);
  };

  // --- Map Initialization ---
  useEffect(() => {
    if (!showMap) return;

    const map = new EsriMap({ basemap: "satellite" });

    const view = new MapView({
      container: mapRef.current,
      map,
      center: [-66.5, 18.2],
      zoom: 9,
    });
    viewRef.current = view;

    const locate = new Locate({
      view,
      useHeadingEnabled: false,
      goToOverride: (view, options) => {
        options.target.scale = 5000;
        return view.goTo(options.target);
      },
    });
    view.ui.add(locate, "top-left");

    const coordWidget = new CoordinateConversion({
      view,
      multipleConversions: false,
    });
    view.ui.add(coordWidget, "bottom-left");

    const markerSymbol = {
      type: "simple-marker",
      color: "#ff4f00",
      size: 12,
      outline: { color: "#fff", width: 1.5 },
    };

    let marker;

    view.on("click", (event) => {
      const { latitude, longitude } = event.mapPoint;
      if (marker) view.graphics.remove(marker);

      marker = new Graphic({
        geometry: new Point({ latitude, longitude }),
        symbol: markerSymbol,
      });
      view.graphics.add(marker);
      setCoords({ lat: latitude, lng: longitude });

      view.goTo({ target: event.mapPoint, zoom: 15 }, { duration: 1000, easing: "ease-in-out" });
    });

    return () => view && view.destroy();
  }, [showMap]);

  // --- Geolocation ---
  useEffect(() => {
    const requestLocation = async () => {
      if (!form.allowLocation || !viewRef.current) return;
      if (!("geolocation" in navigator)) {
        alert("La geolocalización no está disponible.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const view = viewRef.current;
          view.when(() => {
            view.goTo({ center: [longitude, latitude], zoom: 17 }, { duration: 2500, easing: "out-expo" });
            view.graphics.removeAll();
            const marker = new Graphic({
              geometry: new Point({ latitude, longitude }),
              symbol: { type: "simple-marker", color: "#ff4f00", size: 12, outline: { color: "#fff", width: 1.5 } },
            });
            view.graphics.add(marker);
            setCoords({ lat: latitude, lng: longitude });
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    requestLocation();
  }, [form.allowLocation]);


  // --- SUBMIT LOGIC ---
  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const errors = [];
    if (!form.pueblo) errors.push("Pueblo");
    if (!form.date) errors.push("Fecha");
    if (!form.description) errors.push("Descripción Breve");
    if (!coords) errors.push("Ubicación (Coordenadas)");

    if (errors.length > 0) {
      setMessage({ type: 'error', text: `Faltan campos requeridos: ${errors.join(", ")}` });
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);

    const dbPayload = {
      city: form.pueblo,
      latitude: String(coords.lat),
      longitude: String(coords.lng),
      reported_at: form.date,
      description: form.description,
      physical_address: form.carretera || "",
      reporter_name: form.name || "Anonymous",
      reporter_phone: form.phone || "",
      reporter_email: form.email || "",
      image_url: ""
    };

    try {
      const response = await fetch(BASE_REPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);

      const reportId = data.report_id;

      if (files.length > 0 && reportId) {
        let uploadedCount = 0;
        for (const file of files) {
          const formData = new FormData();
          formData.append("image_file", file);
          try {
            const uploadRes = await fetch(`${BASE_REPORT_URL}/${reportId}/upload`, {
              method: "POST",
              body: formData,
            });
            if (uploadRes.ok) uploadedCount++;
          } catch (uploadErr) {
            console.error(`Error uploading ${file.name}`, uploadErr);
          }
        }
      }

      setMessage({ type: 'success', text: "¡Reporte e imágenes enviados exitosamente!" });
      setForm({ name: "", phone: "", email: "", date: "", description: "", pueblo: "", carretera: "", allowLocation: false });
      setFiles([]);
      setCoords(null);
      setShowMap(false);

    } catch (error) {
      console.error("Error submitting:", error);
      setMessage({ type: 'error', text: `Error al enviar: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page">
      {/* --- CAMERA OVERLAY MODAL --- */}
      {showCamera && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Video Preview */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', maxWidth: '600px', borderRadius: '10px', backgroundColor: '#000' }}
          />
          {/* Hidden Canvas for Capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Controls */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
            <button 
              type="button" 
              onClick={takePhoto}
              style={{
                backgroundColor: 'white', border: '5px solid #ccc', borderRadius: '50%',
                width: '70px', height: '70px', cursor: 'pointer'
              }}
              aria-label="Tomar foto"
            />
            <button 
              type="button" 
              onClick={() => setShowCamera(false)}
              style={{
                backgroundColor: 'transparent', color: 'white', border: 'none',
                fontSize: '18px', cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="report-hero">
        <img src={officeLogo} alt="PRLHMO" className="report-hero__logo" />
        <div className="report-hero__text">
          <h1 className="report-title">Reporte de Deslizamiento</h1>
          <p className="report-subtitle"><strong>¿Viste un deslizamiento?</strong> Ayúdanos reportándolo.</p>
        </div>
      </div>

      <hr className="report-divider" />

      <form className="report-form" onSubmit={onSubmit}>
        {message && (
          <div style={{
            padding: "1rem", marginBottom: "1rem", borderRadius: "5px",
            backgroundColor: message.type === 'error' ? "#f8d7da" : "#d4edda",
            color: message.type === 'error' ? "#721c24" : "#155724",
            border: `1px solid ${message.type === 'error' ? "#f5c6cb" : "#c3e6cb"}`
          }}>
            {message.text}
          </div>
        )}
        
        <div className="form-row"><label htmlFor="name">Nombre:</label><input id="name" name="name" type="text" value={form.name} onChange={onChange} /></div>
        <div className="form-row"><label htmlFor="phone">Teléfono:</label><input id="phone" name="phone" type="phone" value={form.phone} onChange={onChange} /></div>
        <div className="form-row"><label htmlFor="email">Email:</label><input id="email" name="email" type="email" value={form.email} onChange={onChange} /></div>
        <div className="form-row"><label htmlFor="date">Fecha:</label><input id="date" name="date" type="date" value={form.date} onChange={onChange} /></div>
        <div className="form-row"><label htmlFor="description">Descripción:</label><textarea id="description" name="description" rows={4} value={form.description} onChange={onChange} /></div>

        <div className="form-row">
          <label> Añadir Foto/Video:</label>
          <div className="dropzone" ref={dropRef}>
            <div className="dropzone__hint">
              <span className="drop-cloud">☁️</span>
              <p>Arrastra fotos aquí</p>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                <label className="pick-files-btn">
                  📁 Seleccionar
                  <input type="file" multiple onChange={onFilePick} style={{ display: 'none' }} />
                </label>
                <button 
                  type="button" 
                  className="camera-btn"
                  onClick={() => setShowCamera(true)}
                  style={{
                    backgroundColor: '#ff4f00', color: 'white', border: 'none', 
                    padding: '8px 15px', borderRadius: '5px', cursor: 'pointer'
                  }}
                >
                  📷 Tomar Foto
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

        <div className="form-row">
          <label htmlFor="pueblo">Pueblo:</label>
          <select id="pueblo" name="pueblo" value={form.pueblo} onChange={onChange}>
            <option value="">Seleccione…</option>
            {pueblos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-row"><label htmlFor="carretera">Carretera:</label><input id="carretera" name="carretera" type="text" value={form.carretera} onChange={onChange} /></div>
        
        <div className="form-row form-row--inline">
          <input id="allowLocation" name="allowLocation" type="checkbox" checked={form.allowLocation} onChange={onChange} />
          <label htmlFor="allowLocation" className="inline-label">Doy permiso a acceder mi localización.</label>
        </div>

        {showMap && (
          <div className="form-row">
            <label>Ubicación:</label>
            <div ref={mapRef} style={{ height: "400px", width: "100%", borderRadius: "10px", overflow: "hidden", border: "2px solid #a6b09f" }}></div>
          </div>
        )}

        <div className="form-actions">
          <button className="submit-btn" disabled={submitting}>{submitting ? "Enviando..." : "Enviar Reporte"}</button>
        </div>
      </form>
    </div>
  );
}

export default Report;