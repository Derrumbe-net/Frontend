import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSManageUsers from '../../../cms/pages/CMSManageUsers';
import Swal from 'sweetalert2';

describe('CMSManageUsers', () => {
    const mockUsers = [
        { admin_id: 1, email: 'slidespr@gmail.com', isAuthorized: 1 },
        { admin_id: 2, email: 'user@test.com', isAuthorized: 0 }
    ];

    beforeEach(() => {
        global.fetch = vi.fn();
        const mockToken = `header.${btoa(JSON.stringify({ email: 'slidespr@gmail.com' }))}.signature`;
        localStorage.setItem('cmsAdmin', mockToken);

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockUsers
        });
    });

    it('lists users', async () => {
        render(<CMSManageUsers />);
        await waitFor(() => screen.getByText('user@test.com'));
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('authorizes a user', async () => {
        render(<CMSManageUsers />);
        await waitFor(() => screen.getByText('user@test.com'));

        const authBtn = screen.getByTitle('Autorizar Acceso');

        global.fetch.mockResolvedValueOnce({ ok: true });

        fireEvent.click(authBtn);

        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Autorizar Usuario' }));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith('Éxito', expect.anything(), 'success');
        });
    });
});