import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CMSDashboard from '../../../cms/pages/CMSDashboard';

describe('CMSDashboard Component', () => {
    it('renders the dashboard hero section correctly', () => {
        render(<CMSDashboard />);
        expect(screen.getByText('Sistema de Administración de Contenido (CMS)')).toBeInTheDocument();

        // Fix: Handle duplicate text in Hero and Footer
        const officeTexts = screen.getAllByText(/Puerto Rico Landslide Hazard Mitigation Office/i);
        expect(officeTexts.length).toBeGreaterThan(0);
    });

    it('renders the info box', () => {
        render(<CMSDashboard />);
        expect(screen.getByText('¿Qué es este CMS?')).toBeInTheDocument();
    });

    it('renders all module cards with correct links', () => {
        render(<CMSDashboard />);

        expect(screen.getByText('Proyectos')).toBeInTheDocument();
        expect(screen.getByText('Publicaciones')).toBeInTheDocument();

        const projectLink = screen.getByText('Ir a Proyectos');
        expect(projectLink).toHaveAttribute('href', '/cms/proyectos');
    });
});