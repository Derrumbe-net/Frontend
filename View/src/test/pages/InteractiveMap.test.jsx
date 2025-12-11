import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import InteractiveMap from '../../pages/InteractiveMap.jsx';
import Cookies from 'js-cookie';
import * as EL from 'esri-leaflet';

// --- MOCKS ---

// Mock Styles & Assets
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('../../styles/InteractiveMap.css', () => ({}));
vi.mock('../../assets/PRLHMO_LOGO.svg', () => ({ default: 'MockLogo' }));
vi.mock('../../assets/green-location-pin.png', () => ({ default: 'MockPin' }));

// Mock Child Components
vi.mock('../../components/StationPopup', () => ({
    default: ({ station }) => <div data-testid="station-popup">{station.city}</div>
}));

vi.mock('../../components/LandslidePopup', () => ({
    default: ({ landslide }) => <div data-testid="landslide-popup">{landslide.landslide_id}</div>
}));

// Mock MapMenu
vi.mock("../../components/MapMenu.jsx", () => ({
    default: (props) => {
        return (
            <div data-testid="mock-map-menu">
                <button onClick={props.onToggleStations}>Toggle Stations</button>
                <button onClick={props.onTogglePrecip}>Toggle Precip</button>
                <button onClick={props.onTogglePrecip12hr}>Toggle Precip 12hr</button>
                <button onClick={props.resetLayers}>Reset Layers</button>

                {/* Year Selector Mock */}
                <select
                    aria-label="year-selector"
                    value={props.selectedYear}
                    onChange={(e) => props.onYearChange(e.target.value)}
                >
                    <option value="">Select Year</option>
                    <option value="all">All Years</option>
                    {props.availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        );
    }
}));

// Mock Data
const MOCK_STATIONS = [
    { id: 1, station_id: 's1', city: 'Station High', is_available: 1, soil_saturation: 95.0, latitude: 18.1, longitude: -66.1, precipitation: 0.1, wc1: 50, wc2: 50, wc3: 50, wc4: 50 },
];

const MOCK_LANDSLIDES = [
    { landslide_id: 'LS-2025-A', landslide_date: '2025-01-15', latitude: 18.15, longitude: -66.15 },
];

const MOCK_FILES_DATA = [
    { station_id: 's1', data: [{ Rain_mm_Tot: '1.0', wc1: '25', wc2: '25', wc3: '25', wc4: '25' }] }
];

// Robust Mock Fetch
const mockFetch = async (url) => {
    const path = url.includes('://') ? new URL(url).pathname : url;

    if (path.endsWith('/stations')) return { ok: true, json: () => Promise.resolve(MOCK_STATIONS) };
    if (path.endsWith('/landslides')) return { ok: true, json: () => Promise.resolve(MOCK_LANDSLIDES) };
    if (path.includes('/stations/files/data')) return { ok: true, json: () => Promise.resolve(MOCK_FILES_DATA) };
    if (path.includes('/stations/batch-update')) return { ok: true, json: () => Promise.resolve({ success: true }) };

    return { ok: true, json: () => Promise.resolve([]) };
};

// Storage Mocks
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
    }
});

vi.mock('js-cookie', () => ({
    default: { get: vi.fn(), set: vi.fn() }
}));

// Leaflet Mock
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

// Esri Mock
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


// --- 2. TESTS ---

describe('InteractiveMap Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn(mockFetch);
        window.localStorage.getItem.mockReturnValue('true'); // Auto-accept disclaimer
        Cookies.get.mockReturnValue(undefined);
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('handles mutually exclusive station toggles (Saturation vs Precip12hr)', async () => {
        render(<InteractiveMap />);

        // 1. Initial State
        expect(screen.getByText('SOIL SATURATION PERCENTAGE')).toBeInTheDocument();

        // 2. Click the toggle
        const toggleBtn = await screen.findByText('Toggle Precip 12hr');
        fireEvent.click(toggleBtn);

        // 3. Check for NEW label
        await screen.findByText(/PAST 12 HOUR PRECIPITATION/i);

        // 4. Ensure OLD label is gone
        await waitFor(() => {
            expect(screen.queryByText('SOIL SATURATION PERCENTAGE')).not.toBeInTheDocument();
        });
    });

    it('switches to Landslide mode when year is selected', async () => {
        render(<InteractiveMap />);

        // 1. CRITICAL: Wait for the option "2025" to appear.
        // This confirms the fetch for landslides has finished and populated the menu.
        await screen.findByRole('option', { name: '2025' });

        // 2. Select the year
        const select = screen.getByRole('combobox', { name: 'year-selector' });
        fireEvent.change(select, { target: { value: '2025' } });

        // 3. Assertions
        await waitFor(() => {
            expect(screen.getByText('HISTORICAL LANDSLIDE DATA')).toBeInTheDocument();
        });

        expect(screen.getByText('LS-2025-A')).toBeInTheDocument();
    });
});