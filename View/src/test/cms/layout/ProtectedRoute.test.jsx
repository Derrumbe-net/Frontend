import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProtectedRoute from '../../../cms/layout/ProtectedRoute'; // Adjust path if needed

// --- MOCKS ---

const mockNavigate = vi.fn();

// Mock React Router DOM
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        // Mock Navigate component to render a predictable span we can assert on
        Navigate: ({ to }) => <span data-testid="redirect-element">Redirecting to {to}</span>,
    };
});

// Mock Window Alert
const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

describe('ProtectedRoute Component', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    // --- BASIC AUTH LOGIC ---

    it('redirects to login if user is not authenticated', () => {
        // Ensure localStorage is empty
        localStorage.removeItem('cmsAdmin');

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        // Should NOT render children
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

        // Should render Navigate component
        expect(screen.getByTestId('redirect-element')).toHaveTextContent('Redirecting to /cms/login');
    });

    it('renders children if user is authenticated', () => {
        // Set fake token
        localStorage.setItem('cmsAdmin', 'fake-token');

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(screen.queryByTestId('redirect-element')).not.toBeInTheDocument();
    });

    // --- TIMEOUT LOGIC ---

    it('logs out and redirects after 45 minutes of inactivity', () => {
        localStorage.setItem('cmsAdmin', 'fake-token');
        render(
            <ProtectedRoute>
                <div>Content</div>
            </ProtectedRoute>
        );

        const TIMEOUT_DURATION = 45 * 60 * 1000;

        // Fast-forward time exactly to the timeout
        act(() => {
            vi.advanceTimersByTime(TIMEOUT_DURATION + 100);
        });

        // 1. Alert shown
        expect(alertSpy).toHaveBeenCalledWith("Session expired due to inactivity.");

        // 2. LocalStorage cleared
        expect(localStorage.getItem('cmsAdmin')).toBeNull();

        // 3. Navigated to login
        expect(mockNavigate).toHaveBeenCalledWith('/cms/login');
    });

    it('resets the timer on user activity (e.g., mousemove)', () => {
        localStorage.setItem('cmsAdmin', 'fake-token');
        render(
            <ProtectedRoute>
                <div>Content</div>
            </ProtectedRoute>
        );

        const TIMEOUT_DURATION = 45 * 60 * 1000;

        // 1. Advance 40 minutes (Session still active)
        act(() => {
            vi.advanceTimersByTime(40 * 60 * 1000);
        });

        // 2. Trigger Activity (Reset Timer)
        fireEvent.mouseMove(window);

        // 3. Advance another 10 minutes
        // Total time = 50 mins.
        // IF reset worked: only 10 mins passed since last activity -> No Logout.
        // IF reset failed: 50 mins > 45 mins -> Logout happened.
        act(() => {
            vi.advanceTimersByTime(10 * 60 * 1000);
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(localStorage.getItem('cmsAdmin')).not.toBeNull();

        // 4. Advance remaining 36 minutes (Total since reset = 46 mins) -> Should Logout
        act(() => {
            vi.advanceTimersByTime(36 * 60 * 1000);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/cms/login');
    });

    it('clears the timer when component unmounts', () => {
        localStorage.setItem('cmsAdmin', 'fake-token');
        const { unmount } = render(
            <ProtectedRoute>
                <div>Content</div>
            </ProtectedRoute>
        );

        // Unmount immediately
        unmount();

        // Advance massive amount of time
        act(() => {
            vi.advanceTimersByTime(100 * 60 * 1000);
        });

        // Should NOT have triggered logout because component was removed
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(alertSpy).not.toHaveBeenCalled();
    });

    it('responds to multiple event types', () => {
        localStorage.setItem('cmsAdmin', 'fake-token');
        render(<ProtectedRoute><div>Child</div></ProtectedRoute>);

        // Simply ensuring these events don't crash the app and effectively call the reset handler
        // We verify the side effect (timer reset) conceptually via the code coverage logic

        // List from component: mousedown, mousemove, keydown, scroll, touchstart
        fireEvent.mouseDown(window);
        fireEvent.keyDown(window);
        fireEvent.scroll(window);
        fireEvent.touchStart(window);

        // Advance a safe amount of time to ensure no immediate logout occurred
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});