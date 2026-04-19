import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSPublicaciones from '../../../cms/pages/CMSPublications';
import Swal from 'sweetalert2';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
    default: {
        fire: vi.fn(),
    },
}));

// Mock URL.createObjectURL for image file preview
global.URL.createObjectURL = vi.fn(() => 'mock-image-url');
global.URL.revokeObjectURL = vi.fn();

// Mock environment variables
const mockApiUrl = 'http://testapi.com';
vi.stubEnv('VITE_API_URL', mockApiUrl);

describe('CMSPublicaciones', () => {
    // Comprehensive list for pagination and test data
    const mockPublications = [
        { publication_id: 1, title: 'Title A', publication_url: 'http://a.com', description: 'Description A with some length.', image_url: true },
        { publication_id: 2, title: 'Title B', publication_url: 'http://b.com', description: 'Description B with some length.', image_url: false },
        { publication_id: 3, title: 'Title C', publication_url: 'http://c.com', description: 'Description C with some length.', image_url: false },
        { publication_id: 4, title: 'Title D', publication_url: 'http://d.com', description: 'Description D with some length.', image_url: false },
        { publication_id: 5, title: 'Title E', publication_url: 'http://e.com', description: 'Description E with some length.', image_url: false },
        { publication_id: 6, title: 'Title F (Page 2)', publication_url: 'http://f.com', description: 'Description F for page 2.', image_url: false },
    ];

    let consoleErrorSpy;
    let consoleWarnSpy;

    // Helper to control Swal confirmation flow
    const mockSwalConfirmation = (title, isConfirmed) => {
        Swal.fire.mockImplementation((options) => {
            if (options.title === title) {
                return Promise.resolve({ isConfirmed: isConfirmed });
            }
            return Promise.resolve({});
        });
    };

    // Helper to control URL reachability check AND API endpoints
    const mockUrlReachability = (httpCode) => {
        global.fetch.mockImplementation((url, options) => {
            const urlString = url.toString();

            // 1. URL Validation API (External)
            if (urlString.includes('api.allorigins.win')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ status: { http_code: httpCode } })
                });
            }

            // 2. Main Publications List Endpoint (GET)
            if (urlString.endsWith('/publications') && (!options || options.method === 'GET')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPublications
                });
            }

            // 3. Create/Update Endpoint (POST/PUT/DELETE/Image)
            if (urlString.includes('/publications/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ publication_id: 99, success: true })
                });
            }

            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    }

    beforeEach(() => {
        localStorage.setItem('cmsAdmin', 'mock-token');
        mockUrlReachability(200); // Set initial mock for successful validation and list load

        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        Swal.fire.mockClear();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        localStorage.clear();
        global.fetch.mockRestore();
    });

    // Helper to find form inputs within the form view
    const getFormInputs = (container) => ({
        titleInput: container.querySelector('input[name="title"]'),
        urlInput: container.querySelector('input[name="publication_url"]'),
        desc: container.querySelector('textarea[name="description"]'),
        imageFile: container.querySelector('input[type="file"]'),
        // Ensure you query by text that only appears once or use *AllBy*
        submitButton: screen.queryByText('Crear Publicación'),
        saveButton: screen.queryByText('Guardar Cambios'),
    });

    // Helper to fill form with valid data
    const fillValidForm = (container, urlValue = 'test.com') => {
        const { titleInput, urlInput, desc } = getFormInputs(container);
        fireEvent.change(titleInput, { target: { value: 'New Valid Title' } });
        fireEvent.change(urlInput, { target: { value: urlValue } });
        fireEvent.change(desc, { target: { value: 'This is a description that is long enough.' } });
    };

    // --- Tests ---

    it('renders publications list successfully', async () => {
        render(<CMSPublicaciones />);
        await waitFor(() => screen.getByText('Title A'));

        // FIX: Use getAllByText to avoid the "multiple elements" error
        expect(screen.getAllByText('Visitar Enlace ↗').length).toBeGreaterThan(0);
    });

    // 1. Successful Creation (URL Reachable)
    it('submits new publication successfully when URL is reachable (HTTP 200)', async () => {
        // We set the initial mock in beforeEach, so fetch(publications) -> mockPublications

        const { container } = render(<CMSPublicaciones />);
        await waitFor(() => screen.getByText('Title A'));
        fireEvent.click(screen.getByText('Añadir Publicación'));

        fillValidForm(container, 'success-url.com');

        mockSwalConfirmation('Crear Publicación', true); // Mock final confirmation

        fireEvent.click(screen.getByText('Crear Publicación'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(`${mockApiUrl}/publications`,
                expect.objectContaining({ method: 'POST' })
            );
            expect(global.fetch).toHaveBeenCalledTimes(4); // Initial GET, Validation GET, POST, Refresh GET
            expect(Swal.fire).toHaveBeenCalledWith('Éxito', expect.anything(), 'success');
        });
    });

    // 2. Submission with Unreachable URL - User Confirms Save
    it('submits new publication after user confirms "Enlace sospechoso" warning', async () => {
        // Use separate mocks for this test
        global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => mockPublications })); // Initial GET
        global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => ({ status: { http_code: 404 } }) })); // Validation 404
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ publication_id: 99, success: true }) }); // POST success
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockPublications }); // Refresh GET

        const { container } = render(<CMSPublicaciones />);
        await waitFor(() => screen.getByText('Title A'));
        fireEvent.click(screen.getByText('Añadir Publicación'));

        fillValidForm(container, 'unreachable-url.com');

        // Mock warning confirmation (Yes, save anyway)
        Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
        // Mock final confirmation
        Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

        fireEvent.click(screen.getByText('Crear Publicación'));

        await waitFor(() => {
            // Check the "Enlace sospechoso" warning was shown
            expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Enlace sospechoso'
            }));
            // Check POST API call (after both confirmations)
            expect(global.fetch).toHaveBeenCalledWith(`${mockApiUrl}/publications`, expect.objectContaining({
                method: 'POST',
            }));
            expect(global.fetch).toHaveBeenCalledTimes(4);
        });
    });

    // 3. Submission with Unreachable URL - User Cancels
    it('stops submission when user cancels "Enlace sospechoso" warning', async () => {
        // Use separate mocks for this test
        global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => mockPublications })); // Initial GET
        global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => ({ status: { http_code: 404 } }) })); // Validation 404

        const { container } = render(<CMSPublicaciones />);
        await waitFor(() => screen.getByText('Title A'));
        fireEvent.click(screen.getByText('Añadir Publicación'));

        fillValidForm(container, 'unreachable-url.com');

        // Mock warning cancellation (Revisar)
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });

        fireEvent.click(screen.getByText('Crear Publicación'));

        await waitFor(() => {
            // Check the "Enlace sospechoso" warning was shown
            expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Enlace sospechoso'
            }));
            // Check that fetch was NOT called for POST
            expect(global.fetch).toHaveBeenCalledTimes(2); // Initial GET and Validation GET
            expect(screen.getByText('Nueva Publicación')).toBeInTheDocument();
        });
    });

    // 4. Initial Fetch Failure (New Test for fetchPublications error)
    it('handles initial fetch failure gracefully', async () => {
        // Mock initial fetch to explicitly reject the promise
        global.fetch.mockImplementationOnce(() => Promise.reject(new Error("Network failure during initial fetch")));

        render(<CMSPublicaciones />);

        await waitFor(() => {
            // Check that console.error was called due to the fetch failure
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching publications:", expect.anything());
        });
        // Component should still render without crashing
        expect(screen.getByText('Gestión de Publicaciones')).toBeInTheDocument();
        expect(screen.queryByText('Title A')).not.toBeInTheDocument();
    });
});