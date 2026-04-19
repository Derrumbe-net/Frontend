import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../../components/Footer.jsx';

describe('Footer Component', () => {

    beforeEach(() => {
        render(<Footer />);
    });

    it('renders the main logo and text', () => {
        expect(screen.getByAltText('PRLHMO Logo')).toBeInTheDocument();

        const footerText = screen.getByText(/Puerto Rico Landslide/i);
        expect(footerText).toBeInTheDocument();
        expect(footerText).toHaveTextContent('Puerto Rico LandslideHazard Mitigation Office');
    });

    it('renders the Facebook icon with the correct link', () => {
        const facebookIcon = screen.getByAltText('Facebook');
        expect(facebookIcon).toBeInTheDocument();

        // Encuentra el enlace '<a>' más cercano al icono
        const facebookLink = facebookIcon.closest('a');

        expect(facebookLink).toBeInTheDocument();

        expect(facebookLink).toHaveAttribute('href', 'https://www.facebook.com/SlidesPR');
        expect(facebookLink).toHaveAttribute('target', '_blank');
        expect(facebookLink).toHaveAttribute('rel', 'noreferrer');
    });

    it('renders the disclaimer text', () => {
        const disclaimer = screen.getByText((content) =>
            content.startsWith('La información que se ofrece en este sitio web')
        );

        expect(disclaimer).toBeInTheDocument();
        expect(disclaimer.tagName).toBe('P');
        expect(disclaimer).toHaveClass('footer__disclaimer');
    });

});