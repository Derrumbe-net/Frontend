import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Stations from '../../pages/Stations.jsx';

// 1. Stub Environment
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://test-api' } } });

// 2. Mock Assets
vi.mock("../assets/station_schematic.png", () => ({ default: "schematic.png" }));

// 3. Mock Leaflet (Fixing the Default Export issue)
vi.mock('leaflet', () => {
    const mockL = {
        divIcon: vi.fn(() => 'mock-div-icon'),
        icon: vi.fn(() => 'mock-icon'),
        // Add other L methods if your component calls them directly
    };
    return {
        __esModule: true,
        default: mockL,
        ...mockL
    };
});

// 4. Mock React-Leaflet
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children, eventHandlers }) => (
        <div data-testid="marker" onClick={eventHandlers?.click}>
            {children}
        </div>
    ),
    Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>
}));

// 5. Mock Highcharts
vi.mock('highcharts', () => ({ default: {} }));
vi.mock('highcharts-react-official', () => ({ default: () => <div data-testid="highcharts-chart">Chart Rendered</div> }));

// 6. Mock Cookies
vi.mock('js-cookie', () => ({ default: { get: vi.fn(), set: vi.fn() } }));

// --- Mock Data ---
const MOCK_STATIONS = [
    { station_id: 's1', city: 'San Juan', is_available: 1, latitude: 18.1, longitude: -66.1, soil_saturation: 50 },
    { station_id: 's2', city: 'Ponce', is_available: 1, latitude: 18.2, longitude: -66.2, soil_saturation: null }
];

// Data with history so the chart actually renders
const MOCK_HISTORY = {
    history: [
        { timestamp: "2025-10-10T10:00:00Z", wc1: 0.25, wc2: 0.30 }
    ]
};

const mockFetch = async (url) => {
    // Match History URL
    if (url.includes('/history')) {
        return { ok: true, json: () => Promise.resolve(MOCK_HISTORY) };
    }
    // Match Stations URL
    if (url.endsWith('/stations')) {
        return { ok: true, json: () => Promise.resolve(MOCK_STATIONS) };
    }
    // Fallback
    return { ok: true, json: () => Promise.resolve([]) };
};

describe('Stations Component', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(mockFetch));
        render(<Stations />);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders map and markers', async () => {
        expect(screen.getByRole('heading', { name: /Estaciones/i })).toBeInTheDocument();

        await waitFor(() => {
            const markers = screen.getAllByTestId('marker');
            expect(markers).toHaveLength(2);
        });
    });

    it('shows details and renders chart on marker click', async () => {
        // 1. Wait for markers to appear
        await waitFor(() => screen.getAllByTestId('marker'));
        const markers = screen.getAllByTestId('marker');

        // 2. Click the first marker (San Juan)
        fireEvent.click(markers[0]);

        // 3. Wait for the sidebar title to appear (confirming selection)
        expect(await screen.findByRole('heading', { name: 'San Juan' })).toBeInTheDocument();

        // 4. Wait for the chart to appear
        // (If MOCK_HISTORY was empty, this would fail because the component renders text instead of the chart)
        expect(await screen.findByTestId('highcharts-chart')).toBeInTheDocument();
    });
});