import "../styles/SusceptibilityMap.css";
import { SITE_CONFIG } from "@config";

const MAP_URL = "https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=8928a7fafc2c4a13864f505ed07c9e29&theme=light&center=-66.45005,18.2352&scale=1155581.108577"

function SusceptibilityMap() {
    return (
        <div className="municipality-page">

            <h1 className="municipality-title">{SITE_CONFIG.SUSCEPTIBILITY.TITLE}</h1>

            <p className="municipality-intro" dangerouslySetInnerHTML={{ __html: SITE_CONFIG.SUSCEPTIBILITY.INTRO_HTML }} />

            <div className="municipality-map-wrapper">
                <iframe
                    title="Embedded ArcGIS Map"
                    src={MAP_URL}
                    className="municipality-map"
                    allowFullScreen
                />
            </div>
        </div>
    );
}
export default SusceptibilityMap;