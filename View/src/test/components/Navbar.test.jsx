import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';

const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(ui, { wrapper: MemoryRouter });
};

beforeEach(() => {
    renderWithRouter(<Navbar />);
});

describe('Navbar Component', () => {

    it('renders all main navigation items', () => {
        expect(screen.getByRole('link', { name: /^Inicio$/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Sobre Nosotros/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Investigación/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Monitoreo/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Recursos/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Reportar/i })).toBeInTheDocument();
        expect(screen.getByAltText(/LandslideReady PR/i)).toBeInTheDocument();
    });

    it('toggles "Investigación" dropdown on click', async () => {
        const investigacionBtn = screen.getByRole('button', { name: /Investigación/i });
        fireEvent.click(investigacionBtn);

        expect(await screen.findByRole('link', { name: 'Publicaciones' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Proyectos' })).toBeInTheDocument();

        fireEvent.click(investigacionBtn);
        await waitFor(() => {
            expect(screen.queryByRole('link', { name: 'Publicaciones' })).not.toBeInTheDocument();
        });
    });

    it('toggles "Monitoreo" dropdown on click', async () => {
        const monitoreoBtn = screen.getByRole('button', { name: /Monitoreo/i });
        fireEvent.click(monitoreoBtn);

        expect(await screen.findByRole('link', { name: 'Mapa Interactivo' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Pronóstico de lluvia' })).toBeInTheDocument();
    });

    it('toggles "Recursos" dropdown on click', async () => {
        const recursosBtn = screen.getByRole('button', { name: /Recursos/i });
        fireEvent.click(recursosBtn);

        expect(await screen.findByRole('link', { name: 'Guía sobre Deslizamientos' })).toBeInTheDocument();

        fireEvent.click(recursosBtn);
        await waitFor(() => {
            expect(screen.queryByRole('link', { name: 'Guía sobre Deslizamientos' })).not.toBeInTheDocument();
        });
    });

    it('toggles "LandslideReady" dropdown on click', async () => {
        const landslideReadyBtn = screen.getByRole('button', { name: /LandslideReady PR/i });
        fireEvent.click(landslideReadyBtn);

        expect(await screen.findByRole('link', { name: /Individuos/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Municipios/i })).toBeInTheDocument();

        fireEvent.click(landslideReadyBtn);
        await waitFor(() => {
            expect(screen.queryByRole('link', { name: /Individuos/i })).not.toBeInTheDocument();
        });
    });

    it('closes one dropdown when another is opened', async () => {
        const investigacionBtn = screen.getByRole('button', { name: /Investigación/i });
        const monitoreoBtn = screen.getByRole('button', { name: /Monitoreo/i });

        fireEvent.click(investigacionBtn);
        expect(await screen.findByRole('link', { name: 'Publicaciones' })).toBeInTheDocument();

        fireEvent.click(monitoreoBtn);
        expect(await screen.findByRole('link', { name: 'Mapa Interactivo' })).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole('link', { name: 'Publicaciones' })).not.toBeInTheDocument();
        });
    });

    it('toggles mobile hamburger menu', () => {
        const hamburger = screen.getByRole('button', { name: /Toggle menu/i });
        const navList = hamburger.nextElementSibling;
        expect(navList).toBeInTheDocument();

        expect(navList).not.toHaveClass('active');

        fireEvent.click(hamburger);
        expect(navList).toHaveClass('active');

        fireEvent.click(hamburger);
        expect(navList).not.toHaveClass('active');
    });
});