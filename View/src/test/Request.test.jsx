import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EducationalTalkRequest from "../pages/Request"; // Adjust path

// Mock image
vi.mock("../assets/educational_talk.webp", () => ({ default: "talk.webp" }));

const windowOpenSpy = vi.spyOn(window, 'open');

describe('EducationalTalkRequest Component', () => {
    beforeEach(() => {
        windowOpenSpy.mockImplementation(() => {});
        render(<EducationalTalkRequest />);
    });

    afterEach(() => {
        windowOpenSpy.mockClear();
    });

    it('renders static content', () => {
        expect(screen.getByRole('heading', { name: /Solicitud de Charla/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Reglamento para Conferencias/i })).toBeInTheDocument();
    });

    it('button is hidden initially', () => {
        expect(screen.queryByText(/Acceder Formulario/i)).not.toBeInTheDocument();
    });

    it('shows button when checkbox is checked and opens link', () => {
        const checkbox = screen.getByLabelText(/He leído las reglas y las acepto/i);
        fireEvent.click(checkbox);

        const button = screen.getByText(/Acceder Formulario/i);
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(windowOpenSpy).toHaveBeenCalledWith(
            expect.stringContaining("forms.office.com"),
            "_blank"
        );
    });
});