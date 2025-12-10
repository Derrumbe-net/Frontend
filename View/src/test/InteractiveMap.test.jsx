import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InteractiveMap from '../pages/InteractiveMap';

// 1. Mock Styles and Assets
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('../styles/InteractiveMap.css', () => ({}));
vi.mock('../assets/PRLHMO_LOGO.svg', () => ({ default: 'MockLogo' }));
vi.mock('../assets/green-location-pin.png', () => ({ default: 'MockPin' }));

// 2. Mock Child Components
vi.mock('../components/StationPopup', () => ({
    default: ({ station }) => <div data-testid="station-popup">{station.city}</div>
}));

vi.mock('../components/LandslidePopup', () => ({
    default: ({ landslide }) => <div data-testid="landslide-popup">{landslide.landslide_id}</div>
}));

vi.mock("../components/MapMenu.jsx", () => ({
    default: ({
                  availableYears,
                  selectedYear,
                  onYearChange,
                  onToggleStations,
                  onTogglePrecip,
                  onToggleSusceptibility
              }) => {
        return (
            <div data-testid="mock-map-menu">
                <button onClick={onToggleStations}>Toggle Stations</button>
                <button onClick={onTogglePrecip}>Toggle Precip</button>

                <select
                    aria-label="year-selector"
                    value={selectedYear}
                    onChange={(e) => onYearChange(e.target.value)}
                >
                    <option value="">Select Year</option>
                    <option value="all">All Years</option>
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        );
    }
}));

// 3. Mock Data
const MOCK_STATIONS = [
    { id: 1, station_id: 's1', city: 'Station High', is_available: 1, soil_saturation: 95.0, latitude: 18.1, longitude: -66.1, precipitation: 0.1 },
    { id: 2, station_id: 's2', city: 'Station Medium', is_available: 1, soil_saturation: 85.0, latitude: 18.2, longitude: -66.2, precipitation: 0.2 },
];

const MOCK_LANDSLIDES = [
    { landslide_id: 'LS-2025-A', landslide_date: '2025-01-15', latitude: 18.15, longitude: -66.15 },
    { landslide_id: 'LS-2024-A', landslide_date: '2024-04-15', latitude: 18.15, longitude: -66.15 },
];

// 4. Robust Mock Fetch
const mockFetch = async (url) => {
    // Use .includes or .endsWith to handle dynamic BASE_URL
    if (url.endsWith('/stations')) {
        return { ok: true, json: () => Promise.resolve(MOCK_STATIONS) };
    }
    if (url.endsWith('/landslides')) {
        return { ok: true, json: () => Promise.resolve(MOCK_LANDSLIDES) };
    }
    // Handle heartbeats/other calls gracefully
    return { ok: true, json: () => Promise.resolve([]) };
};

// 5. Mock Storage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('js-cookie', () => ({
    default: { get: vi.fn(), set: vi.fn() }
}));

// 6. Mock Leaflet
vi.mock('leaflet', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        icon: vi.fn(() => ({})),
        divIcon: vi.fn(() => ({})),
        map: vi.fn(),
        tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    };
});

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="mock-map">{children}</div>,
    TileLayer: () => <div data-testid="mock-tilelayer" />,
    ZoomControl: () => <div data-testid="mock-zoomcontrol" />,
    Marker: ({ children }) => <div data-testid="mock-marker">{children}</div>,
    useMap: () => ({ removeLayer: vi.fn(), addLayer: vi.fn(), on: vi.fn(), off: vi.fn() }),
}));

// Mock Esri
const mockEsriLayer = {
    addTo: vi.fn(() => mockEsriLayer),
    removeLayer: vi.fn(),
    setTimeRange: vi.fn()
};
vi.mock('esri-leaflet', () => ({
    tiledMapLayer: vi.fn(() => mockEsriLayer),
    featureLayer: vi.fn(() => mockEsriLayer),
    imageMapLayer: vi.fn(() => mockEsriLayer),
}));

describe('InteractiveMap Component', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.stubGlobal('fetch', vi.fn(mockFetch));
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Map Content Rendering', () => {
        beforeEach(() => {
            localStorage.setItem('disclaimerAccepted', 'true');
            render(<InteractiveMap />);
        });

        it('fetches and renders stations', async () => {
            // Wait for fetch to complete and Marker to appear
            expect(await screen.findByText('Station High')).toBeInTheDocument();
            expect(screen.getByText('Station Medium')).toBeInTheDocument();
        });

        it('populates the year dropdown', async () => {
            const select = await screen.findByRole('combobox', { name: 'year-selector' });
            expect(await screen.findByRole('option', { name: '2025' })).toBeInTheDocument();
        });
    });

    describe('Landslide Filtering Logic', () => {
        beforeEach(() => {
            localStorage.setItem('disclaimerAccepted', 'true');
            render(<InteractiveMap />);
        });

        it('toggles from Stations to Landslides when a year is selected', async () => {
            // Wait for initial load
            expect(await screen.findByText('Station High')).toBeInTheDocument();

            const select = screen.getByRole('combobox', { name: 'year-selector' });

            // Select 2025
            fireEvent.change(select, { target: { value: '2025' } });

            // Stations GONE, Landslide 2025 HERE
            await waitFor(() => {
                expect(screen.queryByText('Station High')).not.toBeInTheDocument();
            });
            expect(screen.getByText('LS-2025-A')).toBeInTheDocument();
            expect(screen.queryByText('LS-2024-A')).not.toBeInTheDocument();
        });
    });
});