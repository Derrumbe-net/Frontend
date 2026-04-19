import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandslideReadyPR_Individuos from '../../pages/LandslideReadyPR_Individuos.jsx';

describe('LandslideReadyPR_Individuos Component', () => {

    beforeEach(() => {
        render(<LandslideReadyPR_Individuos />);
    });

    it('renders the main heading and descriptive text', () => {
        expect(screen.getByRole('heading', { name: /LandslideReady para Individuos/i })).toBeInTheDocument();

        expect(screen.getByText(/El Ecoexploratorio Instituto de Resiliencia/i)).toBeInTheDocument();
        expect(screen.getByText(/LANDS101: LandslideReady/i)).toBeInTheDocument();
    });

    it('renders all external links correctly', () => {
        const ecoLogoImg = screen.getByAltText('Ecoexploratorio Logo');
        const ecoLink = ecoLogoImg.closest('a');

        expect(ecoLink).toBeInTheDocument();
        expect(ecoLink).toHaveAttribute('href', 'https://ecoexploratorio.org/eri/cursos/');
        expect(ecoLink).toHaveAttribute('target', '_blank');
        expect(ecoLink).toHaveAttribute('rel', 'noopener noreferrer');

        const cursoLink = screen.getByRole('link', { name: /Accede los Cursos/i });

        expect(cursoLink).toBeInTheDocument();
        expect(cursoLink).toHaveAttribute('href', 'https://ecoexploratorio.org/eri/cursos/#1742922273665-a07cced4-5bd4');
        expect(cursoLink).toHaveAttribute('target', '_blank');
        expect(cursoLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders the course preview section', () => {
        expect(screen.getByRole('heading', { name: /Una vez que accedas a los módulos/i })).toBeInTheDocument();

        expect(screen.getByAltText('Vista previa del curso LandslideReady')).toBeInTheDocument();
    });

});