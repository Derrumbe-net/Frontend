import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandslidePopup from '../../components/LandslidePopup.jsx';

// 1. Mock Leaflet Popup
vi.mock('react-leaflet', () => ({
    Popup: ({ children }) => <div data-testid="mock-popup">{children}</div>,
}));

// 2. Mock Environment Variables
vi.stubEnv('VITE_API_URL', 'http://mock-api.com');

describe('LandslidePopup Component', () => {

    // Default mock data
    const mockLandslide = {
        landslide_id: '123',
        landslide_date: '2025-10-29T10:00:00Z'
    };

    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = vi.fn();
        // Reset window.open mock
        vi.spyOn(window, 'open').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- BASIC RENDERING ---

    it('renders null if no landslide prop is provided', () => {
        const { container } = render(<LandslidePopup landslide={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the initial loading state correctly', async () => {
        // Mock a fetch that never resolves immediately to test loading state
        global.fetch.mockImplementation(() => new Promise(() => {}));

        render(<LandslidePopup landslide={mockLandslide} />);

        expect(screen.getByRole('heading', { name: /Reported Landslide/i })).toBeInTheDocument();
        expect(screen.getByText('Fetching images...')).toBeInTheDocument();

        // Date formatting check
        expect(screen.getByText('Date:')).toBeInTheDocument();
        expect(screen.getByText(/October 29, 2025/i)).toBeInTheDocument();
    });

    it('renders "N/A" if date is missing', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ images: [] }) });

        render(<LandslidePopup landslide={{ ...mockLandslide, landslide_date: null }} />);

        expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    // --- API & IMAGE FETCHING ---

    it('renders "No images available" when API returns empty array', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ images: [] })
        });

        render(<LandslidePopup landslide={mockLandslide} />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Fetching images...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('No images available')).toBeInTheDocument();
        // Ensure no image tag is rendered
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders images and counter when API returns images', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ images: ['img1.jpg', 'img2.jpg'] })
        });

        render(<LandslidePopup landslide={mockLandslide} />);

        await waitFor(() => {
            expect(screen.getByRole('img')).toBeInTheDocument();
        });

        const img = screen.getByRole('img');
        // Check full constructed URL
        expect(img).toHaveAttribute('src', 'http://mock-api.com/landslides/123/images/img1.jpg');

        // Check counter "1 / 2"
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValueOnce(new Error('Network Error'));

        render(<LandslidePopup landslide={mockLandslide} />);

        await waitFor(() => {
            expect(screen.queryByText('Fetching images...')).not.toBeInTheDocument();
        });

        // Even on error, it stops loading. Since images is empty, it shows no images msg
        expect(screen.getByText('No images available')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith("Error connecting to API:", expect.any(Error));
    });

    // --- CAROUSEL NAVIGATION ---

    it('cycles through images using Next button', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ images: ['img1.jpg', 'img2.jpg'] })
        });

        const { container } = render(<LandslidePopup landslide={mockLandslide} />);
        await waitFor(() => screen.getByRole('img'));

        const nextBtn = container.querySelector('.carousel-btn.right');
        const img = screen.getByRole('img');

        // Start: Image 1
        expect(img.src).toContain('img1.jpg');
        expect(screen.getByText('1 / 2')).toBeInTheDocument();

        // Click Next -> Image 2
        fireEvent.click(nextBtn);
        expect(img.src).toContain('img2.jpg');
        expect(screen.getByText('2 / 2')).toBeInTheDocument();

        // Click Next -> Loop back to Image 1
        fireEvent.click(nextBtn);
        expect(img.src).toContain('img1.jpg');
    });

    it('cycles through images using Prev button', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ images: ['img1.jpg', 'img2.jpg', 'img3.jpg'] })
        });

        const { container } = render(<LandslidePopup landslide={mockLandslide} />);
        await waitFor(() => screen.getByRole('img'));

        const prevBtn = container.querySelector('.carousel-btn.left');
        const img = screen.getByRole('img');

        // Start: Image 1
        // Click Prev -> Loop to Image 3
        fireEvent.click(prevBtn);
        expect(img.src).toContain('img3.jpg');
        expect(screen.getByText('3 / 3')).toBeInTheDocument();

        // Click Prev -> Image 2
        fireEvent.click(prevBtn);
        expect(img.src).toContain('img2.jpg');
    });

    it('does not render arrows if only 1 image exists', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ images: ['single.jpg'] })
        });

        render(<LandslidePopup landslide={mockLandslide} />);
        await waitFor(() => screen.getByRole('img'));

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(0);
    });

    // --- INTERACTIONS & PROPAGATION ---

    it('opens image in new tab when clicked', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ images: ['img1.jpg'] })
        });

        render(<LandslidePopup landslide={mockLandslide} />);
        await waitFor(() => screen.getByRole('img'));

        const clickableContainer = screen.getByRole('img').closest('.carousel-image-container');
        fireEvent.click(clickableContainer);

        expect(window.open).toHaveBeenCalledWith(
            'http://mock-api.com/landslides/123/images/img1.jpg',
            '_blank',
            'noopener,noreferrer'
        );
    });

    it('does NOT open new tab when clicking empty state', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ images: [] })
        });

        render(<LandslidePopup landslide={mockLandslide} />);
        await waitFor(() => screen.getByText('No images available'));

        // The container is still there, let's try clicking it
        // We find the container by the text inside it
        const containerDiv = screen.getByText('No images available').closest('.carousel-image-container');
        fireEvent.click(containerDiv);

        expect(window.open).not.toHaveBeenCalled();
    });

    it('stops propagation when clicking navigation buttons', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ images: ['1.jpg', '2.jpg'] })
        });

        const parentClickSpy = vi.fn();

        const { container } = render(
            <div onClick={parentClickSpy}>
                <LandslidePopup landslide={mockLandslide} />
            </div>
        );

        await waitFor(() => screen.getByRole('img'));

        const nextBtn = container.querySelector('.carousel-btn.right');
        fireEvent.click(nextBtn);

        // Verify the parent click handler was NOT called
        expect(parentClickSpy).not.toHaveBeenCalled();
    });
});