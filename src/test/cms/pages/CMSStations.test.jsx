import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSStations from '../../../cms/pages/CMSStations';
import Swal from 'sweetalert2';

describe('CMSStations', () => {
    const mockStation = {
        station_id: 1, city: 'Utuado', is_available: 1,
        depth: "25 cm, 50 cm, 75 cm, 100 cm",
        wc1: 10, wc2: 10, wc3: 10, wc4: 10,
        latitude: 18.2, longitude: -66.5, elevation: 100, susceptibility: 'High',
        station_installation_date: '2020-01-01', ftp_file_path: 'path.dat'
    };

    beforeEach(() => {
        global.fetch = vi.fn();
        localStorage.setItem('cmsAdmin', 'mock-token');
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => [mockStation]
        });
    });

    it('renders station list', async () => {
        render(<CMSStations />);
        await waitFor(() => screen.getByText('Utuado'));
        expect(screen.getByText('Activa')).toBeInTheDocument();
    });

    it('validates and submits form', async () => {
        const { container } = render(<CMSStations />);
        fireEvent.click(screen.getByText('Añadir Estación'));

        // Helpers to find inputs by name attribute
        const fill = (name, val) => {
            const input = container.querySelector(`[name="${name}"]`);
            if(input) fireEvent.change(input, { target: { value: val } });
        };

        fill('city', 'New City');
        fill('latitude', '18');
        fill('longitude', '-66');
        fill('elevation', '50');
        fill('susceptibility', 'Low');
        fill('station_installation_date', '2024-01-01');
        fill('ftp_file_path', 'file.dat');

        ['wc1', 'wc2', 'wc3', 'wc4'].forEach(n => fill(n, '20'));
        ['d1', 'd2', 'd3', 'd4'].forEach(n => fill(n, '10cm'));

        // Mock Create Response
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ station_id: 5 }) });

        fireEvent.click(screen.getByText('Crear Estación'));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith('Éxito', expect.anything(), 'success');
        });
    });
});