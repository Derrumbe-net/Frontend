import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSLogin from '../../../cms/pages/CMSLogin';

// Mock the react-router-dom navigation
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
        Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
    };
});

// Mock environment variables to ensure predictable routes in tests
const mockApiUrl = 'http://testapi.com';
vi.stubEnv('VITE_API_URL', mockApiUrl);

// Helper function to create a valid-looking JWT payload string for testing
// The 'sub' field will be the admin ID
const createMockToken = (payload) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadBase64 = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Remove padding
    const signature = 'mocked_signature';
    return `${header}.${payloadBase64}.${signature}`;
};

// Define mock data
const mockAdminId = 123;
const mockToken = createMockToken({ sub: mockAdminId });
const mockLoginRoute = `${mockApiUrl}/admins/login`;
const mockAdminRoute = `${mockApiUrl}/admins/${mockAdminId}`;
const mockEmail = 'test@example.com';
const mockPassword = 'password123';

describe('CMSLogin', () => {
    let alertSpy;

    beforeEach(() => {
        // Reset fetch and localStorage before each test
        global.fetch = vi.fn();
        localStorage.clear();
        // Spy on window.alert and mock its implementation to prevent UI disruption
        alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        // Reset mock function calls
        mockedNavigate.mockClear();
    });

    afterEach(() => {
        // Restore the original alert function after each test
        alertSpy.mockRestore();
        vi.restoreAllMocks();
    });

    const fillAndSubmitForm = () => {
        fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: mockEmail } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: mockPassword } });
        fireEvent.click(screen.getByText('Iniciar Sesión'));
    };

    // --- Existing Test Enhanced ---
    it('alerts on specific failed login message from API', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Credenciales inválidas' }),
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(mockLoginRoute, expect.any(Object));
            expect(alertSpy).toHaveBeenCalledWith('Credenciales inválidas');
        });
    });

    // --- New Coverage Tests ---

    it('alerts on generic failed login message if API response lacks an error field', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ someOtherField: 'data' }), // Missing 'error' field
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Inicio de sesión fallido: Por favor verifique sus credenciales.'
            );
        });
    });

    it('handles network/API error gracefully', async () => {
        // Mock fetch to throw a network error
        global.fetch.mockRejectedValue(new Error('Network failure'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
            expect(alertSpy).toHaveBeenCalledWith(
                'Ocurrió un error. Por favor intente más tarde.'
            );
        });

        consoleErrorSpy.mockRestore();
    });

    it('handles successful login and navigation when authorized (isAuthorized: 1)', async () => {
        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: mockToken }),
        });

        // Mock successful admin status check response (2)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ email: mockEmail, isAuthorized: 1 }), // isAuthorized as number 1
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            // Check first fetch call (login)
            expect(global.fetch).toHaveBeenCalledWith(mockLoginRoute, expect.any(Object));
            // Check second fetch call (admin status)
            expect(global.fetch).toHaveBeenCalledWith(mockAdminRoute, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockToken}`
                }
            });
            // Check side effects
            expect(localStorage.getItem('cmsAdmin')).toBe(mockToken);
            expect(mockedNavigate).toHaveBeenCalledWith('/cms');
            expect(alertSpy).not.toHaveBeenCalled();
        });
    });

    it('handles successful login and navigation when authorized (isAuthorized: true)', async () => {
        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: mockToken }),
        });

        // Mock successful admin status check response (2)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ email: mockEmail, isAuthorized: true }), // isAuthorized as boolean true
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            // Check side effects
            expect(localStorage.getItem('cmsAdmin')).toBe(mockToken);
            expect(mockedNavigate).toHaveBeenCalledWith('/cms');
        });
    });

    it('alerts and prevents navigation when authorized status is pending (isAuthorized: 0)', async () => {
        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: mockToken }),
        });

        // Mock successful admin status check response (2)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ email: mockEmail, isAuthorized: 0 }), // isAuthorized as number 0
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(localStorage.getItem('cmsAdmin')).toBeNull(); // Should NOT set localStorage
            expect(mockedNavigate).not.toHaveBeenCalled(); // Should NOT navigate
            expect(alertSpy).toHaveBeenCalledWith(
                'Inicio de sesión exitoso, pero su cuenta está pendiente de autorización. Por favor contacte a un administrador.'
            );
        });
    });

    it('alerts and prevents navigation when authorized status is pending (isAuthorized: false)', async () => {
        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: mockToken }),
        });

        // Mock successful admin status check response (2)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ email: mockEmail, isAuthorized: false }), // isAuthorized as boolean false
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            expect(localStorage.getItem('cmsAdmin')).toBeNull();
            expect(mockedNavigate).not.toHaveBeenCalled();
            expect(alertSpy).toHaveBeenCalledWith(
                'Inicio de sesión exitoso, pero su cuenta está pendiente de autorización. Por favor contacte a un administrador.'
            );
        });
    });

    it('alerts on invalid token received (missing adminId)', async () => {
        // Create a token with a payload missing the 'sub' field
        const invalidToken = createMockToken({ userId: 456 });

        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: invalidToken }),
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            // Only the first fetch (login) should be called
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem('cmsAdmin')).toBeNull();
            expect(mockedNavigate).not.toHaveBeenCalled();
            expect(alertSpy).toHaveBeenCalledWith('Error: Token inválido recibido.');
        });
    });

    it('alerts on failure to verify authorization status', async () => {
        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: mockToken }),
        });

        // Mock FAILED admin status check response (2)
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Error checking status' }),
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(localStorage.getItem('cmsAdmin')).toBeNull();
            expect(mockedNavigate).not.toHaveBeenCalled();
            expect(alertSpy).toHaveBeenCalledWith('Fallo al verificar el estado de autorización.');
        });
    });

    it('handles malformed token in getPayloadFromToken gracefully', () => {
        // We can't easily isolate the getPayloadFromToken directly as it's not exported,
        // but we can pass a clearly malformed token to the main handler.
        const malformedToken = 'header.invalid-base64-payload.signature';

        // Mock successful login response (1)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: malformedToken }),
        });

        render(<CMSLogin />);
        fillAndSubmitForm();

        // This should cause getPayloadFromToken to hit its catch block and return null,
        // leading to the 'Token inválido' alert.
        waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(alertSpy).toHaveBeenCalledWith('Error: Token inválido recibido.');
        });
    });

    it('should render the signup link correctly', () => {
        render(<CMSLogin />);

        // FIX: Use the exact string accessible name found in the debug output.
        const linkText = '¿No tienes una cuenta? Regístrate';
        const linkElement = screen.getByRole('link', { name: linkText });

        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('href', '/cms/signup');
    });
});