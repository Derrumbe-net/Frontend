import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InteractiveMap from '../pages/InteractiveMap';

vi.mock('../assets/PRLHMO_LOGO.svg', () => ({ default: 'MockLogo' }));
vi.mock('../assets/green-location-pin.png', () => ({ default: 'MockPin' }));

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

        const yearSet = new Set(availableYears);
        yearSet.add(selectedYear);
        const displayYears = Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));

        return (
            <div data-testid="mock-map-menu">
                {/* Mock Toggles for completeness */}
                <button onClick={onToggleStations}>Toggle Stations</button>
                <button onClick={onTogglePrecip}>Toggle Precip</button>
                <button onClick={onToggleSusceptibility}>Toggle Susceptibility</button>

                {/* This is the crucial <select> the test looks for */}
                <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
                    <option value="all">All Years</option>
                    {displayYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        );
    }
}));

const MOCK_STATIONS = [
    { id: 1, city: 'Station High', is_available: 1, soil_saturation: 95.0, latitude: 18.1, longitude: -66.1, last_update: '2025-01-01T12:00:00Z', precipitation_12hr: 0.1 },
    { id: 2, city: 'Station Medium', is_available: 1, soil_saturation: 85.0, latitude: 18.2, longitude: -66.2, last_update: '2025-01-01T12:00:00Z', precipitation_12hr: 0.2 },
    { id: 3, city: 'Station Low', is_available: 1, soil_saturation: 75.0, latitude: 18.3, longitude: -66.3, last_update: '2025-01-01T12:00:00Z', precipitation_12hr: 0.3 },
    { id: 4, city: 'Station Unavailable', is_available: 0, soil_saturation: 90.0, latitude: 18.4, longitude: -66.4, last_update: '2025-01-01T12:00:00Z', precipitation_12hr: 0.4 },
    { id: 5, city: 'Station No Saturation', is_available: 1, soil_saturation: null, latitude: 18.5, longitude: -66.5, last_update: '2025-01-01T12:00:00Z', precipitation_12hr: 0.5 },
];

const MOCK_LANDSLIDES = [
    { landslide_id: 'LS-2024-A', landslide_date: '2024-04-15', latitude: 18.15, longitude: -66.15, trigger: 'Rain', size: 'Medium' },
    { landslide_id: 'LS-2024-B', landslide_date: '2024-03-20', latitude: 18.25, longitude: -66.25, trigger: 'Earthquake', size: 'Small' },
    { landslide_id: 'LS-2023-A', landslide_date: '2023-07-10', latitude: 18.35, longitude: -66.35, trigger: 'Unknown', size: 'Large' },
    { landslide_id: 'LS-NULL', landslide_date: null, latitude: 18.45, longitude: -66.45, trigger: 'Unknown', size: 'N/A' },
];

const mockFetch = async (url) => {
    if (url === 'https://derrumbe-test.derrumbe.net/api/stations') {
        return { ok: true, json: () => Promise.resolve(MOCK_STATIONS) };
    }
    if (url === 'https://derrumbe-test.derrumbe.net/api/landslides') {
        return { ok: true, json: () => Promise.resolve(MOCK_LANDSLIDES) };
    }
    return Promise.reject(new Error(`Unhandled API call: ${url}`));
};

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('leaflet', async (importOriginal) => {
    const actual = await importOriginal();
    class MockIcon {
        constructor(options) { this.options = options; }
        createIcon = vi.fn();
        createShadow = vi.fn();
    }
    const MockIconDefault = {
        mergeOptions: vi.fn(), options: {}, getIconUrl: vi.fn(),
        imagePath: 'mock-path', prototype: { options: {} },
    };
    const iconFn = vi.fn(options => new MockIcon(options));
    return {
        ...actual,
        Icon: { ...actual.Icon, Default: MockIconDefault },
        icon: iconFn,
        divIcon: vi.fn(options => ({ options })),
        default: { ...actual.default, Icon: { Default: MockIconDefault }, icon: iconFn, divIcon: vi.fn(options => ({ options })) }
    };
});

vi.mock('react-leaflet', async () => {
    const actual = await vi.importActual('react-leaflet');
    return {
        ...actual,
        MapContainer: vi.fn(({ children, ...props }) => <div data-testid="mock-map" {...props}>{children}</div>),
        TileLayer: vi.fn(() => <div data-testid="mock-tilelayer" />),
        ZoomControl: vi.fn(() => <div data-testid="mock-zoomcontrol" />),
        Marker: vi.fn(({ children, ...props }) => (<div data-testid="mock-marker" data-key={props.key}>{children}</div>)),
        Popup: vi.fn(({ children }) => <div data-testid="mock-popup">{children}</div>),
        useMap: vi.fn(() => ({ removeLayer: vi.fn(), addLayer: vi.fn() })),
    };
});

const mockEsriLayer = { addTo: vi.fn(() => mockEsriLayer), removeLayer: vi.fn() };
vi.mock('esri-leaflet', () => ({
    tiledMapLayer: vi.fn(() => mockEsriLayer),
    featureLayer: vi.fn(() => mockEsriLayer),
    imageMapLayer: vi.fn(() => mockEsriLayer),
}));

let consoleErrorSpy;

beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal('fetch', vi.fn(mockFetch));
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.clearAllMocks();
    if (consoleErrorSpy) { consoleErrorSpy.mockRestore(); }
});

describe('InteractiveMap Component', () => {

    describe('Disclaimer Logic', () => {
        it('shows disclaimer by default and hides on agree', async () => {
            render(<InteractiveMap />);
            expect(screen.getByRole('heading', { name: /Aviso | Disclaimer/i })).toBeInTheDocument();
            expect(localStorage.getItem).toHaveBeenCalledWith('disclaimerAccepted');

            const agreeButton = screen.getByRole('button', { name: /Acepto | Agree/i });
            fireEvent.click(agreeButton);

            expect(localStorage.setItem).toHaveBeenCalledWith('disclaimerAccepted', 'true');
            await waitFor(() => {
                expect(screen.queryByRole('heading', { name: /Aviso | Disclaimer/i })).not.toBeInTheDocument();
            });
        });

        it('does not show disclaimer if already accepted', () => {
            localStorage.setItem('disclaimerAccepted', 'true');
            render(<InteractiveMap />);
            expect(screen.queryByRole('heading', { name: /Aviso | Disclaimer/i })).not.toBeInTheDocument();
        });
    });

    describe('Map Content Rendering', () => {
        beforeEach(() => {
            localStorage.setItem('disclaimerAccepted', 'true');
            render(<InteractiveMap />);
        });

        it('renders static map elements (legend, logo, labels)', () => {
            expect(screen.getByTestId('mock-map')).toBeInTheDocument();
            expect(screen.getByTestId('mock-tilelayer')).toBeInTheDocument();
            expect(screen.getByText('SOIL SATURATION PERCENTAGE')).toBeInTheDocument();
            expect(screen.getByAltText('Landslide Hazard Mitigation Logo')).toBeInTheDocument();
        });

        it('fetches and renders stations, filtering correctly', async () => {
            expect(await screen.findByText('Station High')).toBeInTheDocument();
            expect(screen.getByText('Station Medium')).toBeInTheDocument();
            expect(screen.getByText('Station Low')).toBeInTheDocument();
            expect(screen.queryByText('Station Unavailable')).not.toBeInTheDocument();
            expect(screen.queryByText('Station No Saturation')).not.toBeInTheDocument();
        });

        it('fetches and renders landslides and the year filter', async () => {
            const select = await screen.findByRole('combobox');
            expect(select).toBeInTheDocument();

            expect(await screen.findByRole('option', { name: '2025' })).toBeInTheDocument();
            expect(select.value).toBe('2025');
            expect(screen.getByRole('option', { name: 'All Years' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: '2024' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: '2023' })).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('LS-2024-A')).not.toBeInTheDocument();
                expect(screen.queryByText('LS-2023-A')).not.toBeInTheDocument();
            });
        });
    });

    describe('Landslide Filtering Logic', () => {
        it('filters landslides when a year is selected', async () => {
            localStorage.setItem('disclaimerAccepted', 'true');
            render(<InteractiveMap />);

            const select = await screen.findByRole('combobox');

            await waitFor(() => {
                expect(screen.queryByText('LS-2024-A')).not.toBeInTheDocument();
                expect(screen.queryByText('LS-2023-A')).not.toBeInTheDocument();
            });

            fireEvent.change(select, { target: { value: '2024' } });
            expect(await screen.findByText('LS-2024-A')).toBeInTheDocument();
            expect(screen.getByText('LS-2024-B')).toBeInTheDocument();
            expect(screen.queryByText('LS-2023-A')).not.toBeInTheDocument();
            expect(screen.queryByText('LS-NULL')).not.toBeInTheDocument();

            fireEvent.change(select, { target: { value: '2023' } });
            expect(await screen.findByText('LS-2023-A')).toBeInTheDocument();
            expect(screen.queryByText('LS-2024-A')).not.toBeInTheDocument();
            expect(screen.queryByText('LS-2024-B')).not.toBeInTheDocument();
            expect(screen.queryByText('LS-NULL')).not.toBeInTheDocument();

            fireEvent.change(select, { target: { value: 'all' } });
            expect(await screen.findByText('LS-2024-A')).toBeInTheDocument();
            expect(screen.getByText('LS-2024-B')).toBeInTheDocument();
            expect(screen.getByText('LS-2023-A')).toBeInTheDocument();
            expect(screen.getByText('LS-NULL')).toBeInTheDocument();
        });
    });
});