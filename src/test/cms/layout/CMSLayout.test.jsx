import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CMSLayout from '../../../cms/layout/CMSLayout'; // Adjust path based on your structure

// --- MOCKS ---

// 1. Mock CSS
vi.mock('../../../cms/styles/CMSLayout.css', () => ({}));

// 2. Mock Sidebar
// We mock this because we only want to ensure the Layout *includes* it,
// not test the internal logic of the Sidebar itself.
vi.mock('../../../cms/components/CMSSidebar', () => ({
    default: () => <div data-testid="mock-sidebar">Sidebar Content</div>
}));

describe('CMSLayout Component', () => {

    it('renders the layout structure with sidebar and main area', () => {
        // We wrap in MemoryRouter because CMSLayout uses Outlet (which needs routing context)
        render(
            <MemoryRouter>
                <CMSLayout />
            </MemoryRouter>
        );

        // Check for Sidebar
        expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
        expect(screen.getByText('Sidebar Content')).toBeInTheDocument();

        // Check for Main Wrapper
        // We can find the main element by role
        const mainElement = screen.getByRole('main');
        expect(mainElement).toHaveClass('cms-content');
    });

    it('renders nested child routes via Outlet', () => {
        // To test Outlet, we need to set up a routing context with a nested route
        const TestChild = () => <div data-testid="child-page">I am a nested page</div>;

        render(
            <MemoryRouter initialEntries={['/admin/dashboard']}>
                <Routes>
                    <Route path="/admin" element={<CMSLayout />}>
                        <Route path="dashboard" element={<TestChild />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // 1. Sidebar should still be visible
        expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();

        // 2. The child component passed to the route should be rendered inside the layout
        expect(screen.getByTestId('child-page')).toBeInTheDocument();
        expect(screen.getByText('I am a nested page')).toBeInTheDocument();
    });
});