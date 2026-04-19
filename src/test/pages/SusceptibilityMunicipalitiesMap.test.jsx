import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SusceptibilityMunicipalitiesMap from '../../pages/SusceptibilityMunicipalitiesMap.jsx';

// --- MOCKS ---
// Correct paths relative to src/test/pages/
vi.mock('../../styles/SusceptibilityMunicipalitiesMap.css', () => ({}));

vi.mock('../../components/InteractiveMunicipalityMap', () => ({
    default: () => <div data-testid="interactive-map">Mock Map</div>
}));

vi.mock('../../components/MunicipalityPNGs', () => ({
    default: {
        'San Juan': 'sanjuan.png',
        'Mayaguez': 'mayaguez.png',
        'UnknownCity': null
    }
}));

describe('SusceptibilityMunicipalitiesMap', () => {

    const selectCity = (cityName) => {
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: cityName } });
    };

    it('renders the initial page layout correctly', () => {
        render(<SusceptibilityMunicipalitiesMap />);

        expect(screen.getByText('Mapas Municipales')).toBeInTheDocument();
        expect(screen.getByText('Seleccione un Municipio')).toBeInTheDocument();

        // This will now pass because the Mock is correctly loaded
        expect(screen.getByTestId('interactive-map')).toBeInTheDocument();

        // Ensure Modal is NOT open
        expect(screen.queryByRole('heading', { name: 'San Juan' })).not.toBeInTheDocument();
    });

    it('opens the modal when a municipality is selected from dropdown', () => {
        render(<SusceptibilityMunicipalitiesMap />);

        selectCity('San Juan');

        // Check for specific Heading inside Modal
        expect(screen.getByRole('heading', { name: 'San Juan', level: 2 })).toBeInTheDocument();

        const img = screen.getByRole('img', { name: 'Mapa de San Juan' });
        expect(img).toHaveAttribute('src', 'sanjuan.png');

        expect(screen.getByText('Descargar PNG')).toHaveAttribute('href', 'sanjuan.png');
    });

    it('does not open modal if default option is selected', () => {
        render(<SusceptibilityMunicipalitiesMap />);

        // 1. Open it first
        selectCity('San Juan');
        expect(screen.getByRole('heading', { name: 'San Juan' })).toBeInTheDocument();

        // 2. Close it
        fireEvent.click(screen.getByText('×'));
        expect(screen.queryByRole('heading', { name: 'San Juan' })).not.toBeInTheDocument();

        // 3. Select default empty value
        selectCity('');

        // 4. Ensure it remains closed
        expect(screen.queryByRole('heading', { name: 'San Juan' })).not.toBeInTheDocument();
    });

    it('handles closing the modal via the "X" button', () => {
        render(<SusceptibilityMunicipalitiesMap />);
        selectCity('San Juan');

        expect(screen.getByRole('heading', { name: 'San Juan' })).toBeInTheDocument();

        const closeBtn = screen.getByText('×');
        fireEvent.click(closeBtn);

        expect(screen.queryByRole('heading', { name: 'San Juan' })).not.toBeInTheDocument();
    });

    it('handles closing the modal by clicking the overlay', () => {
        render(<SusceptibilityMunicipalitiesMap />);
        selectCity('San Juan');

        const closeBtn = screen.getByText('×');
        const modalContainer = closeBtn.parentElement;
        const overlay = modalContainer.parentElement;

        fireEvent.click(overlay);

        expect(screen.queryByRole('heading', { name: 'San Juan' })).not.toBeInTheDocument();
    });

    it('renders fallback text when municipality has no image', () => {
        render(<SusceptibilityMunicipalitiesMap />);

        selectCity('UnknownCity');

        expect(screen.getByRole('heading', { name: 'UnknownCity' })).toBeInTheDocument();
        expect(screen.getByText('No preview available')).toBeInTheDocument();

        expect(screen.queryByText('Descargar PNG')).not.toBeInTheDocument();
    });
});