import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';

describe('Home Component', () => {

    beforeEach(() => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
    });

    it('renders the hero section with logos, title, and buttons', () => {
        const heroSection = screen.getByRole('heading', { name: /Oficina de Mitigación ante/i }).closest('section');
        expect(heroSection).toBeInTheDocument();

        expect(within(heroSection).getByAltText('PRLHMO Logo')).toBeInTheDocument();
        expect(within(heroSection).getByAltText('UPRM Logo')).toBeInTheDocument();

        const contactBtn = within(heroSection).getByRole('link', { name: /Contáctenos/i });
        expect(contactBtn).toHaveAttribute('href', '#contact');

        const requestBtn = within(heroSection).getByRole('link', { name: /Solicita una Charla/i });
        expect(requestBtn).toHaveAttribute('href', '/solicitud');
    });

    it('renders the interactive map section', () => {
        const mapSection = screen.getByRole('heading', { name: /Explora nuestro Mapa Interactivo/i }).closest('section');
        expect(mapSection).toBeInTheDocument();

        expect(within(mapSection).getByAltText('Mapa interactivo')).toBeInTheDocument();
        expect(within(mapSection).getByText('¡Haz clic en el mapa!')).toBeInTheDocument();
        expect(within(mapSection).getByText(/Herramienta interactiva que muestra/i)).toBeInTheDocument();
    });

    it('renders the report landslide section with correct link', () => {
        const reportSection = screen.getByRole('heading', { name: /Reporta un Deslizamiento/i }).closest('section');
        expect(reportSection).toBeInTheDocument();

        expect(within(reportSection).getByAltText('Ejemplo de deslizamiento')).toBeInTheDocument();

        const reportBtn = within(reportSection).getByRole('link', { name: /¡Haz tu Reporte!/i });
        expect(reportBtn).toHaveAttribute('href', '/reportar');
    });

    it('renders the featured news section', () => {
        const newsSection = screen.getByRole('heading', { name: /Noticia Destacada/i }).closest('section');
        expect(newsSection).toBeInTheDocument();

        expect(within(newsSection).getByAltText('Deslizamiento en Alturas de Bélgica')).toBeInTheDocument();
        expect(within(newsSection).getByText('Junio 2024 - Septiembre 2024')).toBeInTheDocument();
        expect(within(newsSection).getByText(/NSF Collaborative Center for Landslide Geohazards/i)).toBeInTheDocument();
        expect(within(newsSection).getByAltText('Collaborative Center for Landslide Geohazards')).toBeInTheDocument();
    });

    it('renders the contact section with correct id and info', () => {
        const contactSection = screen.getByRole('heading', { name: /Contáctenos/i }).closest('section');
        expect(contactSection).toBeInTheDocument();

        expect(contactSection).toHaveAttribute('id', 'contact');

        expect(within(contactSection).getByAltText('Rótulo de oficina')).toBeInTheDocument();
        expect(within(contactSection).getByText('slidespr@uprm.edu')).toBeInTheDocument();
        expect(within(contactSection).getByText(/787-832-4040 Ext. 6844/i)).toBeInTheDocument();
        expect(within(contactSection).getByText(/Residencia 4B/i)).toBeInTheDocument();
    });

});