import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MapMenu from '../../components/MapMenu.jsx';

// Mock Assets
vi.mock('../assets/layers-icon.png', () => ({ default: 'layers.png' }));
vi.mock('../assets/history-icon.png', () => ({ default: 'history.png' }));
vi.mock('../assets/settings-icon.png', () => ({ default: 'settings.png' }));
vi.mock('../styles/MapMenu.css', () => ({}));

describe('MapMenu Component', () => {

    // Explicit cleanup to ensure DOM is fresh for every test
    afterEach(() => {
        cleanup();
    });

    const defaultProps = {
        showStations: false,
        onToggleStations: vi.fn(),
        showPrecip: false,
        onTogglePrecip: vi.fn(),
        showSusceptibility: false,
        onToggleSusceptibility: vi.fn(),
        showForecast: false,
        onToggleForecast: vi.fn(),

        // Settings props
        showSaturation: false,
        onToggleSaturation: vi.fn(),
        showPrecip12hr: false,
        onTogglePrecip12hr: vi.fn(),
        showSaturationLegend: false,
        onToggleSaturationLegend: vi.fn(),
        showSusceptibilityLegend: false,
        onToggleSusceptibilityLegend: vi.fn(),
        showPrecipLegend: false,
        onTogglePrecipLegend: vi.fn(),

        // History props
        availableYears: [2024, 2025],
        selectedYear: "",
        onYearChange: vi.fn(),
        resetLayers: vi.fn(),
        resetToDefault: vi.fn(),
    };

    it('renders the menu buttons initially collapsed', () => {
        render(<MapMenu {...defaultProps} />);

        expect(screen.getByTitle('Layers')).toBeInTheDocument();
        expect(screen.getByTitle('Monitoring Station Data')).toBeInTheDocument();
        expect(screen.getByTitle('History')).toBeInTheDocument();

        expect(screen.queryByText('12hr Precipitation Estimates')).not.toBeInTheDocument();
        expect(screen.queryByText('Filter Landslides by Year')).not.toBeInTheDocument();
    });

    it('toggles the Layers menu and triggers checkboxes', () => {
        render(<MapMenu {...defaultProps} />);

        const layersBtn = screen.getByTitle('Layers');
        fireEvent.click(layersBtn);

        expect(screen.getByText('12hr Precipitation Estimates')).toBeInTheDocument();
        expect(layersBtn).toHaveClass('active');

        const stationCheckbox = screen.getByLabelText(/Stations/i);
        fireEvent.click(stationCheckbox);
        expect(defaultProps.onToggleStations).toHaveBeenCalled();

        // Close menu
        fireEvent.click(layersBtn);
        expect(screen.queryByText('12hr Precipitation Estimates')).not.toBeInTheDocument();
    });

    it('toggles the Settings menu and triggers checkboxes', () => {
        render(<MapMenu {...defaultProps} />);

        const settingsBtn = screen.getByTitle('Monitoring Station Data');
        fireEvent.click(settingsBtn);

        expect(screen.getByText('Monitoring Station Data')).toBeInTheDocument(); // Title inside div
        expect(settingsBtn).toHaveClass('active');

        const satCheckbox = screen.getByLabelText('Soil Saturation (%)');
        fireEvent.click(satCheckbox);
        expect(defaultProps.onToggleSaturation).toHaveBeenCalled();
    });

    it('toggles between menus (Layers -> History)', () => {
        render(<MapMenu {...defaultProps} />);

        // Open Layers
        fireEvent.click(screen.getByTitle('Layers'));
        expect(screen.getByText(/Weather Radar/i)).toBeInTheDocument();

        // Click History (should close Layers and open History)
        fireEvent.click(screen.getByTitle('History'));
        expect(screen.queryByText(/Weather Radar/i)).not.toBeInTheDocument();
        expect(screen.getByText('Filter Landslides by Year')).toBeInTheDocument();
    });

    describe('History Menu Logic', () => {
        it('handles "All Years" selection correctly', () => {
            // Get rerender function to update props in place
            const { rerender } = render(<MapMenu {...defaultProps} />);

            // Open History menu
            fireEvent.click(screen.getByTitle('History'));

            // Case 1: Selecting "All Years" (currently empty)
            const allYearsCheckbox = screen.getByLabelText('All Years');
            fireEvent.click(allYearsCheckbox);
            expect(defaultProps.resetLayers).toHaveBeenCalled();
            expect(defaultProps.onYearChange).toHaveBeenCalledWith("all");

            // Case 2: Deselecting "All Years" (update props to simulate state change)
            // use rerender() instead of render()
            rerender(<MapMenu {...defaultProps} selectedYear="all" />);

            // Re-open menu (since rerender might reset local state depending on implementation,
            // but in this component, local state persists unless unmounted.
            // However, to be safe, we check visibility or click again if needed.)
            // Note: If component unmounts on prop change, we'd need to reopen.
            // Standard React behavior: props change doesn't reset state.
            // Menu should still be open.

            // Check if open, if not click to open
            if (!screen.queryByText('Filter Landslides by Year')) {
                fireEvent.click(screen.getByTitle('History'));
            }

            // Re-query the element
            const checkedAll = screen.getByLabelText('All Years');
            fireEvent.click(checkedAll);

            expect(defaultProps.onYearChange).toHaveBeenCalledWith("");
            expect(defaultProps.resetToDefault).toHaveBeenCalled();
        });

        it('handles specific year selection correctly', () => {
            const { rerender } = render(<MapMenu {...defaultProps} />);
            fireEvent.click(screen.getByTitle('History'));

            // Case 1: Select 2024
            const yearCheckbox = screen.getByLabelText('2024');
            fireEvent.click(yearCheckbox);
            expect(defaultProps.resetLayers).toHaveBeenCalled();
            expect(defaultProps.onYearChange).toHaveBeenCalledWith("2024");

            // Case 2: Deselect 2024
            rerender(<MapMenu {...defaultProps} selectedYear="2024" />);

            // Ensure menu is open/visible
            if (!screen.queryByText('Filter Landslides by Year')) {
                fireEvent.click(screen.getByTitle('History'));
            }

            const checkedYear = screen.getByLabelText('2024');
            fireEvent.click(checkedYear);

            expect(defaultProps.onYearChange).toHaveBeenCalledWith("");
            expect(defaultProps.resetToDefault).toHaveBeenCalled();
        });
    });
});