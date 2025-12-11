import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSPublicaciones from '../../../cms/pages/CMSPublications'; // Verify this path matches your file structure
import Swal from 'sweetalert2';

describe('CMSPublicaciones', () => {
    const mockPub = {
        publication_id: 1,
        title: 'Test Pub',
        publication_url: 'http://test.com',
        description: 'Desc'
    };

    beforeEach(() => {
        global.fetch = vi.fn();
        localStorage.setItem('cmsAdmin', 'mock-token');

        // SMART MOCK IMPLEMENTATION
        // This prevents the "slice is not a function" error by ensuring
        // the list endpoint ALWAYS returns an array.
        global.fetch.mockImplementation((url, options) => {
            const urlString = url.toString();

            // 1. URL Validation API (External)
            if (urlString.includes('api.allorigins.win')) {
                // Simulate "Not Found" / Unreachable to trigger the warning
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ status: { http_code: 404 } })
                });
            }

            // 2. Main Publications List Endpoint (GET)
            if (urlString.endsWith('/publications') && (!options || options.method === 'GET')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [mockPub] // Always return an ARRAY here
                });
            }

            // 3. Create/Update Endpoint (POST/PUT)
            if ((urlString.endsWith('/publications') && options?.method === 'POST') ||
                urlString.includes('/publications/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ publication_id: 99, success: true }) // Return object for save
                });
            }

            // Default fallback
            return Promise.resolve({ ok: true, json: async () => [] });
        });
    });

    it('renders publications list successfully', async () => {
        render(<CMSPublicaciones />);
        await waitFor(() => screen.getByText('Test Pub'));
        expect(screen.getByText('Visitar Enlace ↗')).toBeInTheDocument();
    });

    it('warns about suspicious URL on submit', async () => {
        const { container } = render(<CMSPublicaciones />);

        // Wait for initial load to complete
        await waitFor(() => screen.getByText('Test Pub'));

        // Open Form
        fireEvent.click(screen.getByText('Añadir Publicación'));

        const title = container.querySelector('input[name="title"]');
        const url = container.querySelector('input[name="publication_url"]');
        const desc = container.querySelector('textarea[name="description"]');

        fireEvent.change(title, { target: { value: 'New Pub' } });
        fireEvent.change(url, { target: { value: 'invalid-url' } });
        fireEvent.change(desc, { target: { value: 'Valid description text' } });

        // Submit
        fireEvent.click(screen.getByText('Crear Publicación'));

        // Expect the "Enlace sospechoso" warning from Swal
        // This works because our smart mock returns http_code 404 for the validation call
        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Enlace sospechoso'
            }));
        });
    });
});