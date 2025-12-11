import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Report from '../../pages/Report.jsx';

// Assets
vi.mock("../assets/PRLHMO_LOGO.svg", () => ({ default: "logo.svg" }));

// ArcGIS Mocks
const mockView = {
    on: vi.fn(),
    destroy: vi.fn(),
    goTo: vi.fn(() => Promise.resolve()),
    ui: { add: vi.fn() },
    graphics: { add: vi.fn(), remove: vi.fn(), removeAll: vi.fn() },
    when: vi.fn((cb) => cb && cb()),
};

vi.mock("@arcgis/core/Map", () => ({ default: vi.fn() }));
vi.mock("@arcgis/core/views/MapView", () => ({ default: vi.fn(() => mockView) }));
vi.mock("@arcgis/core/widgets/Locate", () => ({ default: vi.fn() }));
vi.mock("@arcgis/core/widgets/CoordinateConversion", () => ({ default: vi.fn() }));
vi.mock("@arcgis/core/Graphic", () => ({ default: vi.fn() }));
vi.mock("@arcgis/core/geometry/Point", () => ({ default: vi.fn() }));
vi.mock("@arcgis/core/assets/esri/themes/light/main.css", () => ({}));

// Geolocation
const mockGeolocation = {
    getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 18.2, longitude: -66.5 } }))
};
Object.defineProperty(navigator, 'geolocation', { value: mockGeolocation, writable: true });
Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [] })) },
    writable: true
});

describe('Report Component', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ report_id: 123 }) })));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<Report />);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('activates map when geolocation permission is checked', async () => {
        // Use a more specific selector for "Ubicación" since it appears in help text too
        // "Doy permiso..." is the label text
        const checkbox = screen.getByLabelText(/Doy permiso a acceder mi localización/i);
        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
            // This specific text appears above the map div
            expect(screen.getByText((content) => content.startsWith('Ubicación'))).toBeInTheDocument();
        });
    });
});