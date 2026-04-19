import { vi } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

// 1. Mock Environment Variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');

// 2. Mock SweetAlert2
vi.mock('sweetalert2', () => ({
    default: {
        fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
        showLoading: vi.fn(),
        close: vi.fn(),
    },
}));

// 3. Mock React Router DOM
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
        Link: ({ to, children, className }) =>
            React.createElement('a', { href: to, className: className }, children),
    };
});

// 4. Mock Assets
const mockImage = 'mock-image-path.png';
vi.mock('../../assets/prlhmo_cms_landing.png', () => ({ default: mockImage }));
vi.mock('../../assets/cms_project_icon.png', () => ({ default: mockImage }));
vi.mock('../../assets/cms_publication_icon.png', () => ({ default: mockImage }));
vi.mock('../../assets/cms_report_icon.png', () => ({ default: mockImage }));
vi.mock('../../assets/cms_station_icon.png', () => ({ default: mockImage }));
vi.mock('../../assets/cms_users_icon.png', () => ({ default: mockImage }));
vi.mock('../../assets/Landslide_Hazard_Mitigation_Logo.avif', () => ({ default: mockImage }));

// 5. Mock React Leaflet (CRITICAL FIX: Added Popup)
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
    TileLayer: () => React.createElement('div', { 'data-testid': 'tile-layer' }),
    GeoJSON: () => React.createElement('div', { 'data-testid': 'geojson-layer' }),
    useMap: () => ({ zoomIn: vi.fn(), zoomOut: vi.fn() }),
    Popup: ({ children }) => React.createElement('div', { 'data-testid': 'mock-popup' }, children),
    Marker: ({ children }) => React.createElement('div', { 'data-testid': 'mock-marker' }, children),
}));

// 6. Global Mocks
// Initialize fetch to return a Promise to prevent "cannot read .then of undefined" errors
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
}));

window.scrollTo = vi.fn();

if (typeof window.URL.createObjectURL === 'undefined') {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
    window.URL.revokeObjectURL = vi.fn();
}