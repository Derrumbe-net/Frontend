import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandslidePopup from '../components/LandslidePopup';

vi.mock('react-leaflet', () => ({
    Popup: ({ children }) => <div data-testid="mock-popup">{children}</div>,
}));

describe('LandslidePopup Component', () => {

    it('renders null (nothing) if no landslide data is provided', () => {
        const { container } = render(<LandslidePopup landslide={null} />);

        expect(container.firstChild).toBeNull();

        expect(screen.queryByTestId('mock-popup')).not.toBeInTheDocument();
    });

    it('renders null (nothing) if the landslide prop is undefined', () => {
        const { container } = render(<LandslidePopup />);

        expect(container.firstChild).toBeNull();
        expect(screen.queryByTestId('mock-popup')).not.toBeInTheDocument();
    });

    it('renders all landslide details when data is provided', () => {
        const mockLandslide = {
            landslide_id: 'LS-TEST-001',
            landslide_date: '2025-10-29',
            latitude: 18.12345,
            longitude: -67.54321,
        };

        render(<LandslidePopup landslide={mockLandslide} />);

        expect(screen.getByRole("heading", { name: /reported landslide/i })).toBeInTheDocument();

        // Label
        expect(screen.getByText(/Date:/i)).toBeInTheDocument();

        // Correct expected date
        const formattedDate = new Date(mockLandslide.landslide_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

});