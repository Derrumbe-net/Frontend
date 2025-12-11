import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Guide from '../../pages/Guide.jsx';
vi.mock('react-pageflip', () => ({
    default: vi.fn(({ children }) => (
        <div data-testid="mock-flipbook">
            {children}
        </div>
    )),
}));

vi.mock('react-slick', () => ({
    default: vi.fn(({ children }) => (
        <div data-testid="mock-slider">
            {children}
        </div>
    )),
}));

vi.mock('slick-carousel/slick/slick.css', () => ({ default: '' }));
vi.mock('slick-carousel/slick/slick-theme.css', () => ({ default: '' }));

describe('Guide Component', () => {

    beforeEach(() => {
        render(<Guide />);
    });

    it('renders main static content and background image', () => {
        expect(screen.getByRole('heading', { name: /Guía sobre Deslizamientos de Tierra/i })).toBeInTheDocument();
        expect(screen.getByAltText('Landslide Cartoon')).toBeInTheDocument();
        expect(
            screen.getByText((content, element) => {
                const text = element.textContent.replace(/\s+/g, ' ');
                return text.startsWith('Esta guía incluye 16 páginas');
            })
        ).toBeInTheDocument();
        expect(screen.getByText(/Para solicitar una versión impresa/i)).toBeInTheDocument();
    });

    it('renders all external links correctly', () => {
        const spanishGuideLink = screen.getByRole('link', { name: 'guía' });
        expect(spanishGuideLink).toHaveAttribute('href', 'https://hazards.colorado.edu/uploads/documents/PuertoRico_GuiaDerrumbe_2020.pdf');

        const mailLink = screen.getByRole('link', { name: 'slidespr@uprm.edu' });
        expect(mailLink).toHaveAttribute('href', 'mailto:slidespr@uprm.edu');

        const projectLink = screen.getByRole('link', { name: 'hazards.colorado.edu/puertorico' });
        expect(projectLink).toHaveAttribute('href', 'https://hazards.colorado.edu/research-projects/puerto-rico-landslide-hazard-mitigation-project');

        const englishGuideLink = screen.getByRole('link', { name: 'here' });
        expect(englishGuideLink).toHaveAttribute('href', 'https://hazards.colorado.edu/uploads/documents/PuertoRico_LandslideGuide_2020.pdf');
    });

    it('renders the FlipBook with all 16 pages', () => {
        const flipbook = screen.getByTestId('mock-flipbook');
        expect(flipbook).toBeInTheDocument();

        const pages = within(flipbook).getAllByRole('img', { name: /Página \d+/i });
        expect(pages.length).toBe(16);

        expect(within(flipbook).getByAltText('Página 1')).toBeInTheDocument();
        expect(within(flipbook).getByAltText('Página 16')).toBeInTheDocument();
    });

    it('renders the Slider with all 3 info slides', () => {
        const slider = screen.getByTestId('mock-slider');
        expect(slider).toBeInTheDocument();

        expect(within(slider).getByRole('heading', { name: /Los Deslizamientos de Tierra y sus Mitigaciones/i })).toBeInTheDocument();
        expect(within(slider).getByRole('heading', { name: /Señales de la Naturaleza/i })).toBeInTheDocument();
        expect(within(slider).getByRole('heading', { name: /Deslizamientos Comunes en Puerto Rico/i })).toBeInTheDocument();

        expect(within(slider).getByText(/Evita hacer cortes de terreno/i)).toBeInTheDocument();
        expect(within(slider).getByText(/Árboles inclinados:/i)).toBeInTheDocument();
        expect(within(slider).getByText(/Caída de roca:/i)).toBeInTheDocument();
    });

    it('renders the animations (videos) section correctly', () => {
        expect(screen.getByRole('heading', { name: /Animaciones sobre Deslizamientos de Tierra/i })).toBeInTheDocument();

        const spanishLabel = screen.getByText('Versión en español');
        const spanishCard = spanishLabel.closest('.landslide__video-card');
        const spanishVideo = within(spanishCard).getByTitle('YouTube video player');

        expect(spanishVideo).toBeInTheDocument();
        expect(spanishVideo).toHaveAttribute('src', expect.stringContaining('2dS2Sisj4GQ'));

        const englishLabel = screen.getByText('English Version');
        const englishCard = englishLabel.closest('.landslide__video-card');
        const englishVideo = within(englishCard).getByTitle('YouTube video player');

        expect(englishVideo).toBeInTheDocument();
        expect(englishVideo).toHaveAttribute('src', expect.stringContaining('lbHGOz3WXgw'));
    });

});