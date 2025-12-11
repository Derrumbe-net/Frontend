import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StationPopup from '../../components/StationPopup.jsx';

// Mock Leaflet Popup
vi.mock('react-leaflet', () => ({
    Popup: ({ children }) => <div data-testid="mock-popup">{children}</div>,
}));

describe('StationPopup Component', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- BASIC RENDERING ---

    it('renders null if no station prop is provided', () => {
        const { container } = render(<StationPopup station={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders null if the station prop is undefined', () => {
        const { container } = render(<StationPopup />);
        expect(container.firstChild).toBeNull();
    });

    it('renders text details correctly', () => {
        const mockStation = {
            city: 'Mayagüez',
            last_updated: '2025-10-29 10:30:00',
            soil_saturation: 85.2,
            precipitation: 1.2
        };

        render(<StationPopup station={mockStation} />);

        expect(screen.getByRole('heading', { name: /Mayagüez/i })).toBeInTheDocument();
        expect(screen.getByText('Last Updated:')).toBeInTheDocument();
        expect(screen.getByText(`${mockStation.last_updated} AST`)).toBeInTheDocument();
        expect(screen.getByText(`${mockStation.soil_saturation}%`)).toBeInTheDocument();
        expect(screen.getByText(`${mockStation.precipitation} inches`)).toBeInTheDocument();
    });

    it('renders correctly when values are 0', () => {
        const mockStationZero = {
            city: 'San Juan',
            last_updated: '2025-10-29 11:00:00',
            soil_saturation: 0,
            precipitation: 0
        };
        render(<StationPopup station={mockStationZero} />);
        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('0 inches')).toBeInTheDocument();
    });

    // --- CAROUSEL & INTERACTION LOGIC ---

    it('renders a single image without navigation arrows when only one image URL exists', () => {
        const mockStation = {
            city: 'Ponce',
            station_id: '123',
            sensor_image_url: true,
            data_image_url: false
        };

        render(<StationPopup station={mockStation} />);

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', '/api/stations/123/image/sensor');
        expect(screen.getByText('Sensor View')).toBeInTheDocument();

        // Ensure navigation buttons are NOT present
        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(0);
    });

    it('renders navigation arrows when multiple images exist', () => {
        const mockStation = {
            city: 'Ponce',
            station_id: '123',
            sensor_image_url: true,
            data_image_url: true
        };

        render(<StationPopup station={mockStation} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    it('cycles through images when Next arrow is clicked', () => {
        const mockStation = {
            city: 'Test City',
            station_id: '999',
            sensor_image_url: true,
            data_image_url: true
        };

        const { container } = render(<StationPopup station={mockStation} />);
        const nextBtn = container.querySelector('.carousel-btn.right');
        const img = screen.getByRole('img');

        // Initial: Sensor
        expect(img).toHaveAttribute('src', '/api/stations/999/image/sensor');

        // Click Next -> Data
        fireEvent.click(nextBtn);
        expect(img).toHaveAttribute('src', '/api/stations/999/image/data');

        // Click Next -> Loop to Sensor
        fireEvent.click(nextBtn);
        expect(img).toHaveAttribute('src', '/api/stations/999/image/sensor');
    });

    it('cycles through images backwards when Prev arrow is clicked', () => {
        const mockStation = {
            city: 'Test City',
            station_id: '999',
            sensor_image_url: true,
            data_image_url: true
        };

        const { container } = render(<StationPopup station={mockStation} />);
        const prevBtn = container.querySelector('.carousel-btn.left');
        const img = screen.getByRole('img');

        // Initial: Sensor (Index 0)
        // Click Prev -> Last (Index 1: Data)
        fireEvent.click(prevBtn);
        expect(img).toHaveAttribute('src', '/api/stations/999/image/data');

        // Click Prev -> Sensor
        fireEvent.click(prevBtn);
        expect(img).toHaveAttribute('src', '/api/stations/999/image/sensor');
    });

    it('opens image in a new tab when clicked', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

        const mockStation = {
            city: 'Bayamon',
            station_id: '456',
            sensor_image_url: true
        };

        render(<StationPopup station={mockStation} />);

        // The image is inside a container that has the onClick handler
        const img = screen.getByRole('img');
        const clickableContainer = img.closest('.carousel-image-container');

        fireEvent.click(clickableContainer);

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(
            '/api/stations/456/image/sensor',
            '_blank',
            'noopener,noreferrer'
        );
    });

    // --- FIXED STOP PROPAGATION TEST ---
    it('stops propagation when clicking navigation buttons', () => {
        const mockStation = {
            city: 'Test',
            station_id: '1',
            sensor_image_url: true,
            data_image_url: true
        };

        // We wrap the component in a div with an onClick spy.
        // If stopPropagation works, this spy should NOT be called.
        const parentClickSpy = vi.fn();

        const { container } = render(
            <div onClick={parentClickSpy}>
                <StationPopup station={mockStation} />
            </div>
        );

        const nextBtn = container.querySelector('.carousel-btn.right');
        fireEvent.click(nextBtn);

        expect(parentClickSpy).not.toHaveBeenCalled();
    });
});