import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import About from '../../pages/About.jsx';

describe('About Component', () => {

    beforeEach(() => {
        render(<About />);
    });

    it('renders the main "About Us" section content', () => {
        expect(screen.getByRole('heading', { name: /¿Quiénes somos?/i })).toBeInTheDocument();

        expect(screen.getByAltText('Monitores de la oficina')).toBeInTheDocument();
        expect(screen.getByAltText('Logo PRLHMO')).toBeInTheDocument();

        expect(screen.getByText(/La Oficina de Mitigación de Peligros de Deslizamientos/i)).toBeInTheDocument();
        expect(screen.getByText((content) => content.startsWith('Misión:'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.startsWith('Visión:'))).toBeInTheDocument();
    });

    it('renders the directory titles', () => {
        expect(screen.getByText('Directorio de Oficina')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Facultad/i })).toBeInTheDocument();
    });

    const checkProfileCard = (name, title, email, linkedInUrl, imgAlt) => {
        const nameEl = screen.getByText(name);

        const card = nameEl.closest('.directory__card');

        expect(card).toBeInTheDocument();

        const link = within(card).getByRole('link', { name: /LinkedIn/i });
        expect(link).toHaveAttribute('href', linkedInUrl);

        expect(within(card).getByAltText(imgAlt)).toBeInTheDocument();
        expect(within(card).getByText(title)).toBeInTheDocument();
        expect(within(card).getByText(new RegExp(email, 'i'))).toBeInTheDocument();
    };

    it('renders the "Stephen Hughes" profile card correctly', () => {
        checkProfileCard(
            'Stephen Hughes',
            'Coordinator and PI',
            'kenneth.hughes@upr.edu',
            'https://www.linkedin.com/in/stephen-hughes-1a35a091/',
            'Stephen Hughes'
        );
    });

    it('renders the "Pedro Matos" profile card correctly', () => {
        checkProfileCard(
            'Pedro Matos',
            'Assistant Researcher',
            'pedro.matos4@upr.edu',
            'https://www.linkedin.com/in/matosllavonap',
            'Pedro Matos'
        );
    });

    it('renders the "Isabella Cámara" profile card correctly', () => {
        checkProfileCard(
            'Isabella Cámara',
            'Assistant Researcher',
            'isabella.camara@upr.edu',
            'https://www.linkedin.com/in/isabella-camara-torres-',
            'Isabella Cámara'
        );
    });

    it('renders the "Estudiantes Graduados" list', () => {
        const heading = screen.getByRole('heading', { name: /Estudiantes Graduados/i });
        const group = heading.closest('.directory__group');

        expect(within(group).getByText('Anishka Ruiz')).toBeInTheDocument();
        expect(within(group).getByText('César Rodríguez')).toBeInTheDocument();
        expect(within(group).getByText('Karla Torres')).toBeInTheDocument();
    });

    it('renders the "Estudiantes Subgraduados" list', () => {
        const heading = screen.getByRole('heading', { name: /Estudiantes Subgraduados/i });
        const group = heading.closest('.directory__group');

        expect(within(group).getByText('Gabriel A. Colón')).toBeInTheDocument();
        expect(within(group).getByText('Mía V. Aponte')).toBeInTheDocument();
        expect(within(group).getByText('Kyleshaquill Fred')).toBeInTheDocument();
    });
});