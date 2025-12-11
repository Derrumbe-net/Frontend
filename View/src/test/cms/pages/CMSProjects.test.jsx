import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSProjects from '../../../cms/pages/CMSProjects';
import Swal from 'sweetalert2';

describe('CMSProjects', () => {
    const mockProjects = [
        { project_id: 1, title: 'Project A', start_year: 2020, end_year: 2021, description: 'Description A', project_status: 'completed' }
    ];

    beforeEach(() => {
        global.fetch = vi.fn();
        localStorage.setItem('cmsAdmin', 'mock-token');
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockProjects
        });
    });

    it('submits new project form with validation', async () => {
        // FIX: Destructure container here
        const { container } = render(<CMSProjects />);

        await waitFor(() => screen.getByText('Project A'));

        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const titleInput = container.querySelector('input[name="title"]');
        const startYear = container.querySelector('input[name="start_year"]');
        const endYear = container.querySelector('input[name="end_year"]');
        const desc = container.querySelector('textarea[name="description"]');

        fireEvent.change(titleInput, { target: { value: 'New Project' } });
        fireEvent.change(startYear, { target: { value: '2022' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'Valid description text' } });

        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ project_id: 99 }) });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith('Éxito', expect.anything(), 'success');
        });
    });
});