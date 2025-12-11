import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandslideReadyPR_Municipios from '../../pages/LandslideReadyPR_Municipios.jsx';

describe('LandslideReadyPR_Municipios Component', () => {

    beforeEach(() => {
        render(<LandslideReadyPR_Municipios />);
    });

    it('renders all headings and text content', () => {
        expect(screen.getByRole('heading', { name: /LandslideReady para Municipios/i })).toBeInTheDocument();

        expect(screen.getByRole('heading', { name: /Mapa de Municipios LandslideReady/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Ciclo de LandslideReady/i })).toBeInTheDocument();

        expect(screen.getByText(/programa de reconocimiento municipal/i)).toBeInTheDocument();
        expect(screen.getByText(/Trabajando con colaboradores de oficinas de emergencias/i)).toBeInTheDocument();
        expect(screen.getByText(/Si eres manejador de emergencia del municipio/i)).toBeInTheDocument();
    });

    it('renders the map update date', () => {
        const dateText = screen.getByText(/Actualizado en Marzo 4, 2025/i);
        expect(dateText).toBeInTheDocument();
        expect(dateText.tagName).toBe('STRONG');
    });

    it('renders all images with correct alt text', () => {
        expect(screen.getByAltText('Mapa de municipios LandslideReady')).toBeInTheDocument();

        expect(screen.getByAltText('Ciclo LandslideReady')).toBeInTheDocument();

        expect(screen.getByAltText('Talleres comunitarios')).toBeInTheDocument();
    });

});