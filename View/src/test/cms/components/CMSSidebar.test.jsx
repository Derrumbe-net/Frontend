import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '../../../cms/components/CMSSidebar'; // Adjust path if needed

// --- MOCKS ---

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Image
vi.mock('../../assets/PRLHMO_LOGO.svg', () => ({ default: 'logo.svg' }));

// Helper to mock token in localStorage
const setMockToken = (email) => {
    const payload = btoa(JSON.stringify({ email }));
    const token = `header.${payload}.signature`;
    localStorage.setItem('cmsAdmin', token);
};

describe('CMSSidebar Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Silence console.error for expected errors (like invalid token test)
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('renders the header and standard navigation links', () => {
        setMockToken('user@test.com');

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        // Header
        expect(screen.getByAltText('PRLHMO Logo')).toBeInTheDocument();
        expect(screen.getByText('PRLHMO CMS')).toBeInTheDocument();

        // Links
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Proyectos')).toBeInTheDocument();
        expect(screen.getByText('Publicaciones')).toBeInTheDocument();
        expect(screen.getByText('Reportes')).toBeInTheDocument();
        expect(screen.getByText('Estaciones')).toBeInTheDocument();
    });

    it('hides the "Usuarios" link for regular admins', () => {
        setMockToken('regular@admin.com');

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    });

    it('shows the "Usuarios" link for Super Admin', () => {
        setMockToken('slidespr@gmail.com'); // Must match the constant in your component

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    it('applies active class to the current route', () => {
        setMockToken('user@test.com');

        // Render at specific route
        render(
            <MemoryRouter initialEntries={['/cms/proyectos']}>
                <Routes>
                    <Route path="/cms/*" element={<Sidebar />} />
                </Routes>
            </MemoryRouter>
        );

        // "Proyectos" should be active
        // We find the link by its text, then check its parent or the link itself
        // NavLink applies class to the <a> tag.
        const projectsLink = screen.getByText('Proyectos').closest('a');
        expect(projectsLink).toHaveClass('cms-link--active');

        // "Dashboard" should NOT be active
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).not.toHaveClass('cms-link--active');
    });

    it('handles logout correctly', () => {
        setMockToken('user@test.com');

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        const logoutBtn = screen.getByText('Cerrar Sesión');
        fireEvent.click(logoutBtn);

        // 1. LocalStorage cleared
        expect(localStorage.getItem('cmsAdmin')).toBeNull();

        // 2. Navigation called
        expect(mockNavigate).toHaveBeenCalledWith('/cms/login/');
    });

    it('handles invalid token gracefully', () => {
        // Set invalid token that crashes JSON.parse or atob
        localStorage.setItem('cmsAdmin', 'invalid-token-string');

        // Should not throw error during render
        expect(() => {
            render(
                <MemoryRouter>
                    <Sidebar />
                </MemoryRouter>
            );
        }).not.toThrow();

        // Should log error to console (spy confirmed)
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error decoding token'),
            expect.anything()
        );

        // Should render basic nav, but definitely NO "Usuarios" since email didn't match
        expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    });
});