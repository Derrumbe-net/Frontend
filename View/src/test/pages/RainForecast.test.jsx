import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import RainForecast from '../../pages/RainForecast.jsx';

describe('RainForecast Component', () => {

    beforeEach(() => {
        render(<RainForecast />);
    });

    it('renders the main heading and all descriptive text', () => {
        expect(screen.getByRole('heading', { name: /Pronóstico de Lluvia/i })).toBeInTheDocument();

        expect(screen.getByText(/Si las imágenes no se han actualizado/i)).toBeInTheDocument();

        expect(screen.getByText(/El pronóstico de lluvia provee información/i)).toBeInTheDocument();
        expect(screen.getByText(/La lluvia es uno de los factores principales/i)).toBeInTheDocument();
    });

    it('renders the main radar map with the correct link', () => {
        const radarImage = screen.getByAltText(/Radar en vivo del Servicio Nacional de Meteorología/i);
        expect(radarImage).toBeInTheDocument();

        const radarLink = radarImage.closest('a');

        expect(radarLink).toBeInTheDocument();
        expect(radarLink).toHaveAttribute('href', expect.stringContaining('radar.weather.gov'));
        expect(radarLink).toHaveAttribute('target', '_blank');
        expect(radarLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders the "Pronóstico del Día" card correctly', () => {
        const heading = screen.getByRole('heading', { name: /Pronóstico del Día/i });
        expect(heading).toBeInTheDocument();

        const card = heading.closest('.rain-forecast__card');

        const image = within(card).getByAltText('Pronóstico del día');
        expect(image).toBeInTheDocument();

        const link = within(card).getByRole('link');
        expect(link).toHaveAttribute('href', 'https://www.weather.gov/images/sju/marine/wrf/nbm24hr_prec.png');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders the "Pronóstico de Mañana" card correctly', () => {
        const heading = screen.getByRole('heading', { name: /Pronóstico de Mañana/i });
        expect(heading).toBeInTheDocument();

        const card = heading.closest('.rain-forecast__card');

        const image = within(card).getByAltText('Pronóstico de mañana');
        expect(image).toBeInTheDocument();

        const link = within(card).getByRole('link');
        expect(link).toHaveAttribute('href', 'https://www.weather.gov/images/sju/marine/wrf/nbm48hr_prec.png');
        expect(link).toHaveAttribute('target', '_blank');
    });

});