import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import InteractiveMunicipalityMap from '../../components/InteractiveMunicipalityMap.jsx'; // Adjust path as needed

// --- MOCKS ---

// 1. Mock CSS
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('../styles/InteractiveMunicipalityMap_module.css', () => ({}));

// 2. Mock Leaflet components and hooks
const mockMap = {
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
};

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    // We mock GeoJSON to capture the onEachFeature prop for testing interactions
    GeoJSON: ({ data, onEachFeature }) => {
        return (
            <div data-testid="geojson-layer">
                {data.features.map((feature, index) => (
                    <div
                        key={index}
                        data-testid={`feature-${feature.properties.NOMBRE}`}
                        // We attach a simplified version of logic to test onEachFeature
                        onClick={() => {
                            const mockLayer = {
                                setStyle: vi.fn(),
                                on: (handlers) => {
                                    // Store handlers to be accessible for testing
                                    feature._handlers = handlers;
                                }
                            };
                            onEachFeature(feature, mockLayer);
                            // Expose the mock layer to the test via the DOM element
                            // (This is a hack specific to testing internal Leaflet logic in JSDOM)
                            feature._mockLayer = mockLayer;
                        }}
                    >
                        {feature.properties.NOMBRE}
                    </div>
                ))}
            </div>
        );
    },
    useMap: () => mockMap,
}));

// 3. Mock Data
const MOCK_GEOJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { NOMBRE: "San Juan" },
            geometry: { type: "Point", coordinates: [0, 0] }
        },
        {
            type: "Feature",
            properties: { NOMBRE: "Ponce" },
            geometry: { type: "Point", coordinates: [1, 1] }
        }
    ]
};

describe('InteractiveMunicipalityMap', () => {
    beforeEach(() => {
        global.fetch = vi.fn(() => Promise.resolve({
            json: () => Promise.resolve(MOCK_GEOJSON)
        }));
        mockMap.zoomIn.mockClear();
        mockMap.zoomOut.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders map container and tile layer', async () => {
        render(<InteractiveMunicipalityMap />);

        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });

    it('fetches GeoJSON data on mount and renders features', async () => {
        render(<InteractiveMunicipalityMap />);

        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledWith("/View/src/assets/puerto-rico-municipalities.geojson");

        // Wait for data to load and GeoJSON component to render
        await waitFor(() => {
            expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
        });

        expect(screen.getByText('San Juan')).toBeInTheDocument();
        expect(screen.getByText('Ponce')).toBeInTheDocument();
    });

    it('handles zoom controls correctly', async () => {
        render(<InteractiveMunicipalityMap />);

        const zoomInBtn = screen.getByText('+');
        const zoomOutBtn = screen.getByText('−'); // Note: The code uses the minus symbol, not hyphen

        fireEvent.click(zoomInBtn);
        expect(mockMap.zoomIn).toHaveBeenCalledTimes(1);

        fireEvent.click(zoomOutBtn);
        expect(mockMap.zoomOut).toHaveBeenCalledTimes(1);
    });

    it('applies styles on mouseover and mouseout', async () => {
        render(<InteractiveMunicipalityMap />);
        await waitFor(() => screen.getByTestId('geojson-layer'));

        const featureEl = screen.getByTestId('feature-San Juan');

        // 1. "Initialize" the feature by clicking it (based on our Mock GeoJSON implementation above)
        // This runs `onEachFeature`, creating the mockLayer and attaching handlers
        fireEvent.click(featureEl);

        // Access the mock layer stored in the mock implementation
        // Note: In a real browser, this is internal Leaflet state.
        // Here we are testing the logic inside `onEachFeature` using the closure we captured.
        // We have to rely on the fact that our mock GeoJSON maps the internal data logic.
        const featureObj = MOCK_GEOJSON.features[0];
        const mockLayer = featureObj._mockLayer;
        const handlers = featureObj._handlers;

        expect(mockLayer).toBeDefined();
        expect(handlers).toBeDefined();

        // 2. Test Initial Style
        expect(mockLayer.setStyle).toHaveBeenCalledWith(expect.objectContaining({
            fillOpacity: 0.3 // baseStyle
        }));

        // 3. Test Mouseover (Highlight)
        handlers.mouseover();
        expect(mockLayer.setStyle).toHaveBeenCalledWith(expect.objectContaining({
            fillColor: "#009100ff", // highlightStyle
            fillOpacity: 0.8
        }));

        // 4. Test Mouseout (Reset)
        handlers.mouseout();
        expect(mockLayer.setStyle).toHaveBeenCalledWith(expect.objectContaining({
            fillOpacity: 0.3 // baseStyle
        }));
    });
});