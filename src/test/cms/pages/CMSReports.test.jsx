import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSReports from '../../../cms/pages/CMSReports';
import Swal from 'sweetalert2';

describe('CMSReports', () => {
    const mockReport = {
        report_id: 1,
        city: 'San Juan',
        reported_at: '2025-01-01',
        is_validated: 0,
        // CRITICAL FIX: Add Lat/Long so validation passes when we approve it
        latitude: '18.4655',
        longitude: '-66.1057'
    };

    beforeEach(() => {
        global.fetch = vi.fn();
        localStorage.setItem('cmsAdmin', 'mock-token');

        // Default fetch behavior
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => [mockReport]
        });
    });

    it('lists reports and opens form', async () => {
        render(<CMSReports />);
        await waitFor(() => screen.getByText('San Juan'));
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('validates report successfully', async () => {
        // 1. Render and wait for list
        // Mock image folder check which happens inside the row
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockReport] });

        const { container } = render(<CMSReports />);
        await waitFor(() => screen.getByText('San Juan'));

        // 2. Open Form
        // Mock image fetch inside form
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ images: [] }) });

        fireEvent.click(screen.getByTitle('Validar / Editar'));

        // 3. Change Status to Validated
        const select = container.querySelector('select[name="is_validated"]');
        fireEvent.change(select, { target: { value: "1" } });

        // 4. Mock Save calls (Create Landslide -> Update Report)
        global.fetch
            .mockResolvedValueOnce({ ok: true, json: async () => ({ landslide_id: 100 }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        // 5. Assert Success
        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(
                expect.stringMatching(/Éxito|Exito/),
                expect.anything(),
                'success'
            );
        });
    });
});