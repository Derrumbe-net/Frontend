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

  const [files, setFiles] = useState([]);
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const dropRef = useRef(null);
  const mapRef = useRef(null);
  const viewRef = useRef(null);

  const pueblos = [
    "Adjuntas","Aguada","Aguadilla","Aguas Buenas","Aibonito","Añasco","Arecibo","Arroyo","Barceloneta",
    "Barranquitas","Bayamón","Cabo Rojo","Caguas","Camuy","Canóvanas","Carolina","Cataño","Cayey","Ceiba",
    "Ciales","Cidra","Coamo","Comerío","Corozal","Culebra","Dorado","Fajardo","Florida","Guánica","Guayama",
    "Guayanilla","Guaynabo","Gurabo","Hatillo","Hormigueros","Humacao","Isabela","Jayuya","Juana Díaz",
    "Juncos","Lajas","Lares","Las Marías","Las Piedras","Loíza","Luquillo","Manatí","Maricao","Maunabo",
    "Mayagüez","Moca","Morovis","Naguabo","Naranjito","Orocovis","Patillas","Peñuelas","Ponce","Quebradillas",
    "Rincón","Río Grande","Sabana Grande","Salinas","San Germán","San Juan","San Lorenzo","San Sebastián",
    "Santa Isabel","Toa Alta","Toa Baja","Trujillo Alto","Utuado","Vega Alta","Vega Baja","Vieques","Villalba",
    "Yabucoa","Yauco"
  ];

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

  useEffect(() => {
    if (!showMap) return;

    const map = new EsriMap({ basemap: "satellite" });

    const view = new MapView({
      container: mapRef.current,
      map,
      center: [-66.5, 18.2], // Default: Puerto Rico
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
    });

    return () => view && view.destroy();
  }, [showMap]);

  // Handle geolocation permission
  useEffect(() => {
    const requestLocation = async () => {
      if (!form.allowLocation || !viewRef.current) return;

      if (navigator.permissions && navigator.permissions.revoke) {
        try {
          await navigator.permissions.revoke({ name: "geolocation" });
        } catch {
          console.warn("Browser does not fully support revoke() for geolocation.");
        }
      }
      if (!("geolocation" in navigator)) {
        alert("La geolocalización no está disponible en este navegador.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const view = viewRef.current;

          view.goTo({ center: [longitude, latitude], zoom: 17 });

          const marker = new Graphic({
            geometry: new Point({ latitude, longitude }),
            symbol: {
              type: "simple-marker",
              color: "#ff4f00",
              size: 12,
              outline: { color: "#fff", width: 1.5 },
            },
          });

          view.graphics.add(marker);
          setCoords({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Error al obtener ubicación:", err);
          alert("No se pudo obtener tu ubicación. Asegúrate de permitir el acceso.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    requestLocation();
  }, [form.allowLocation]);


  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Build payload (ready for backend)
    const payload = {
      ...form,
      coordinates: coords,
      files: files.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
      submittedAt: new Date().toISOString(),
    };

    // TODO: replace with real POST

    console.log("Report payload (preview):", payload);
    alert("¡Reporte preparado! (Actualmente en modo demo)");
    setSubmitting(false);
  };

  return (
    <div className="report-page">
      <div className="report-hero">
        <img src={officeLogo} alt="PRLHMO" className="report-hero__logo" />
        <div className="report-hero__text">
          <h1 className="report-title">Reporte de Deslizamiento</h1>
          <p className="report-subtitle">
            <strong>¿Viste un deslizamiento?</strong> Ayúdanos a mejorar el monitoreo
            reportando cualquier evento en tu área.
          </p>
          <p className="report-description">
            Tu información nos permite responder más rápido, validar riesgos y fortalecer
            la seguridad de las comunidades en Puerto Rico.
          </p>
        </div>
      </div>

      <hr className="report-divider" />

      <form className="report-form" onSubmit={onSubmit}>
        <div className="form-row">
          <label htmlFor="name">Nombre Completo:</label>
          <input id="name" name="name" type="text" placeholder="Opcional" value={form.name} onChange={onChange} />
        </div>

        <div className="form-row">
          <label htmlFor="phone">Número de Teléfono:</label>
          <input id="phone" name="phone" type="phone" placeholder="Opcional" value={form.phone} onChange={onChange} />
        </div>

        <div className="form-row">
          <label htmlFor="email">Correo Electrónico:</label>
          <input id="email" name="email" type="email" placeholder="Opcional" value={form.email} onChange={onChange} />
        </div>

        <div className="form-row">
          <label htmlFor="date">Fecha:</label>
          <input id="date" name="date" type="date" value={form.date} onChange={onChange} />
        </div>

        <div className="form-row">
          <label htmlFor="description">Descripción Breve:</label>
          <textarea id="description" name="description" rows={4} value={form.description} onChange={onChange} />
        </div>

        <div className="form-row">
          <label> Añadir Foto/Video:</label>
          <div className="dropzone" ref={dropRef}>
            <div className="dropzone__hint">
              <span className="drop-cloud">☁️</span>
              <p>Drag and drop files here to upload</p>
              <label className="pick-files">
                or <input type="file" multiple onChange={onFilePick} /> Select Files to Upload
              </label>
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
            {pueblos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="carretera">Carretera:</label>
          <input id="carretera" name="carretera" type="text" value={form.carretera} onChange={onChange} />
        </div>

        <div className="form-row form-row--inline">
          <input id="allowLocation" name="allowLocation" type="checkbox" checked={form.allowLocation} onChange={onChange} />
          <label htmlFor="allowLocation" className="inline-label">
            Doy permiso a acceder mi localización.
          </label>
        </div>

        {showMap && (
          <div className="form-row">
            <label>Ubicación en el mapa:</label>
            <div
              ref={mapRef}
              style={{
                height: "400px",
                width: "100%",
                borderRadius: "10px",
                overflow: "hidden",
                border: "2px solid #a6b09f",
              }}
            ></div>
          </div>
        )}

        <div className="form-actions">
          <button className="submit-btn" disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar Reporte"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Report;
