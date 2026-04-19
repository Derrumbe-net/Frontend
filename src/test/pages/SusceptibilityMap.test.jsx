import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SusceptibilityMap from '../../pages/SusceptibilityMap.jsx';

describe('SusceptibilityMap Component', () => {

    beforeEach(() => {
        render(<SusceptibilityMap />);
    });

    it('renders the main heading', () => {
        const heading = screen.getByRole('heading', {
            name: /Susceptibilidad a deslizamientos de tierra en Puerto Rico/i
        });
        expect(heading).toBeInTheDocument();
    });

    it('renders the placeholder text with typos', () => {
        const paragraph = screen.getByText((content, element) => {
            const text = element.textContent;
            return (
                element.tagName.toLowerCase() === "p" &&
                text.includes("informe 2020-2022 del Servicio Geológico de los Estados Unidos") &&
                text.includes("susceptibilidad a deslizamientos de tierra") &&
                text.includes("Presione aquí para ver en pantalla completa")
            );
        });

        expect(paragraph).toBeInTheDocument();
        expect(paragraph.tagName).toBe('P');
    });


});