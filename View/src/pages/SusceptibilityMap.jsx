import "../styles/SusceptibilityMunicipalitiesMap.css";

const MAP_URL = "https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=8928a7fafc2c4a13864f505ed07c9e29&theme=light&center=-66.45005,18.2352&scale=1155581.108577"
const FULL_SCREEN_URL = "https://www.arcgis.com/home/webmap/viewer.html?webmap=8928a7fafc2c4a13864f505ed07c9e29&extent=-67.4642,17.7278,-65.4359,18.7426";

function SusceptibilityMap() {
    return (
        <div className="municipality-page">

            <h1 className="municipality-title">Susceptibilidad a deslizamientos de tierra en Puerto Rico</h1>

            <p className="municipality-intro">
                En el <a href="https://pubs.usgs.gov/publication/ofr20201022"
                         target="_blank"
                         rel="noopener noreferrer"
            >
                informe 2020-1022 del Servicio Geológico de los Estados Unidos
            </a>, se publicó un mapa moderno
                y de alta resolución para mostrar la susceptibilidad a deslizamientos de tierra provocados por
                lluvia intensa en la isla de Puerto Rico. A la izquierda puede ver los datos de susceptibilidad
                en la versión interactiva del mapa (
                <a
                    href={FULL_SCREEN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Presione aquí para ver en pantalla completa
                </a>
                ).
            </p>

            <iframe
                title="Embedded ArcGIS Map"
                src={MAP_URL}
                style={{
                    height: "600px",
                    width: "73%",
                    borderRadius: "10px",
                    border: "none",
                    display: "block",
                    margin: "0 auto"
                }}
                allowFullScreen
            />

        </div>
    );
}
export default SusceptibilityMap;