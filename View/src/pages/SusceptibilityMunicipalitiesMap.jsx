import InteractiveMunicipalityMap from "../components/InteractiveMunicipalityMap";
import "../styles/SusceptibilityMunicipalitiesMap.css";

function SusceptibilityMunicipalitiesMap() {
  return (
    <div className="municipality-page">
      
      <h1 className="municipality-title">Mapas Municipales</h1>

      <p className="municipality-intro">
        Hemos preparado un mapa interactivo de susceptibilidad a deslizamientos de tierra por municipios. 
        Para explorar la información, seleccione un municipio directamente en el mapa. 
        Al hacer “clic” sobre él, se abrirá una ventana con una vista previa del mapa municipal 
        y las opciones de descargar la imagen o verla en pantalla completa.
      </p>

      <p className="municipality-intro">
        Los archivos pueden tardar en cargar debido a su tamaño. 
        Si alguna imagen no aparece o algún enlace no funciona correctamente, 
        favor de comunicarse con nosotros: <strong>slidespr@uprm.edu</strong>.
      </p>

      <div className="municipality-map-wrapper">
        <InteractiveMunicipalityMap />
      </div>

    </div>
  );
}

export default SusceptibilityMunicipalitiesMap;
