import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSSignUp from '../../../cms/pages/CMSSignUp'; // Adjust path if necessary

// --- MOCKS ---

// 1. Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
    };
});

// 2. Mock Assets
vi.mock('../../assets/Landslide_Hazard_Mitigation_Logo.avif', () => ({ default: 'mock-logo.png' }));
vi.mock('../../cms/styles/CMSSignUp.css', () => ({}));

// 3. Mock Environment
vi.stubEnv('VITE_API_URL', 'http://api.test');

describe('CMSSignUp Component', () => {

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        global.fetch = vi.fn();

        // Mock window.alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the signup form correctly', () => {
        render(<CMSSignUp />);

        expect(screen.getByRole('heading', { name: 'Regístrate' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Correo Electrónico')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirmar Contraseña')).toBeInTheDocument();
        expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
        render(<CMSSignUp />);

        const passwordInput = screen.getByPlaceholderText('Contraseña');
        const confirmInput = screen.getByPlaceholderText('Confirmar Contraseña');

        // Find toggle buttons (buttons with title "Mostrar" or "Ocultar")
        // Initially type is password
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Find the first eye icon button (for password)
        const toggleBtns = screen.getAllByRole('button', { name: /Mostrar/i });
        fireEvent.click(toggleBtns[0]); // Toggle Password

        expect(passwordInput).toHaveAttribute('type', 'text');

        // Toggle back
        fireEvent.click(toggleBtns[0]); // Now acts as "Ocultar"
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Toggle Confirm Password
        fireEvent.click(toggleBtns[1]);
        expect(confirmInput).toHaveAttribute('type', 'text');
    });

    it('updates password strength criteria dynamically', () => {
        render(<CMSSignUp />);
        const passInput = screen.getByPlaceholderText('Contraseña');

        // 1. Type short password -> Length check fails
        fireEvent.change(passInput, { target: { value: 'short' } });
        expect(screen.getByText(/Mínimo 8 caracteres/)).toHaveClass('invalid');

        // 2. Type "Password123!" -> All checks pass
        fireEvent.change(passInput, { target: { value: 'Password123!' } });

        expect(screen.getByText(/Mínimo 8 caracteres/)).toHaveClass('valid');
        expect(screen.getByText(/Una mayúscula/)).toHaveClass('valid');
        expect(screen.getByText(/Una minúscula/)).toHaveClass('valid');
        expect(screen.getByText(/Un número/)).toHaveClass('valid');
        expect(screen.getByText(/Un símbolo/)).toHaveClass('valid');
    });

    it('alerts on password mismatch', () => {
        render(<CMSSignUp />);

        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongP@ss1' } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Contraseña'), { target: { value: 'Mismatch' } });

        fireEvent.click(screen.getByText('Crear Cuenta'));

        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('no coinciden'));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('alerts on weak password', () => {
        render(<CMSSignUp />);

        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'test@test.com' } });
        // Weak password (matches length, but missing special char/number logic based on component requirements)
        // Based on your component: score < 4 triggers alert
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'weakpassword' } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Contraseña'), { target: { value: 'weakpassword' } });

        fireEvent.click(screen.getByText('Crear Cuenta'));

        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('no es lo suficientemente segura'));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles successful registration', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' })
        });

        render(<CMSSignUp />);

        const email = 'newuser@example.com';
        const strongPass = 'StrongP@ss1'; // Meets all 5 criteria

        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: email } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: strongPass } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Contraseña'), { target: { value: strongPass } });

        const submitBtn = screen.getByText('Crear Cuenta');
        fireEvent.click(submitBtn);

        // Check if loading state was applied (optional, harder to catch in sync tests but good practice)
        // We wait for success view
        await waitFor(() => {
            expect(screen.getByText('¡Cuenta creada exitosamente!')).toBeInTheDocument();
        });

        // Verify API call details
        expect(global.fetch).toHaveBeenCalledWith(
            'http://api.test/admins/signup',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ email, password: strongPass })
            })
        );

        // Test navigation from success screen
        const loginBtn = screen.getByText('Ir al Iniciar Sesión');
        fireEvent.click(loginBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/cms/login');
    });

    it('handles API server errors (e.g., email already exists)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'El correo ya está en uso' })
        });

        render(<CMSSignUp />);

        const strongPass = 'StrongP@ss1';
        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'existing@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: strongPass } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Contraseña'), { target: { value: strongPass } });

        fireEvent.click(screen.getByText('Crear Cuenta'));

        await waitFor(() => {
            expect(screen.getByText('El correo ya está en uso')).toBeInTheDocument();
        });

        // Ensure we are still on the form (Success view not shown)
        expect(screen.queryByText('¡Cuenta creada exitosamente!')).not.toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValueOnce(new Error('Network Error'));

        render(<CMSSignUp />);

        const strongPass = 'StrongP@ss1';
        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'error@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: strongPass } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Contraseña'), { target: { value: strongPass } });

        fireEvent.click(screen.getByText('Crear Cuenta'));

        await waitFor(() => {
            expect(screen.getByText('Ocurrió un error. Por favor intente más tarde.')).toBeInTheDocument();
        });

        expect(consoleSpy).toHaveBeenCalled();
    });
});