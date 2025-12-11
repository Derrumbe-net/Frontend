import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSLogin from '../../../cms/pages/CMSLogin';
import CMSSignUp from '../../../cms/pages/CMSSignUp';

describe('CMSLogin', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        localStorage.clear();
    });

    it('alerts on failed login', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Credenciales inválidas' }),
        });

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<CMSLogin />);

        // Must fill inputs for HTML5 validation to pass (required attribute)
        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: '123' } });

        fireEvent.click(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Credenciales inválidas');
        });
    });
});