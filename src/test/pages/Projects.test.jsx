import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Projects from '../../pages/Projects.jsx';

vi.mock("../assets/search-icon-png-9.png", () => ({ default: "search-icon" }));
vi.mock("../assets/placeholder.png", () => ({ default: "placeholder.png" }));

const MOCK_PROJECTS = [
    { project_id: 'p1', title: 'Active Project A', project_status: 'active', start_year: 2024, end_year: 2025, description: 'Desc A', image_url: 'img_a' },
    { project_id: 'p2', title: 'Past Project X', project_status: 'inactive', start_year: 2020, end_year: 2021, description: 'Desc X', image_url: 'img_x' },
];

const mockFetch = async (url) => {
    // Generic check to ignore base domain differences
    if (url.includes('/projects')) {
        return { ok: true, json: () => Promise.resolve(MOCK_PROJECTS) };
    }
    return Promise.reject(new Error(`Unhandled API call: ${url}`));
};

describe('Projects Component', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(mockFetch));
        render(<Projects />);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders and filters projects', async () => {
        // Wait for fetch
        expect(await screen.findByText('Active Project A')).toBeInTheDocument();

        const select = screen.getByRole('combobox');

        // Filter: Past
        fireEvent.change(select, { target: { value: 'past' } });
        expect(screen.getByText('Past Project X')).toBeInTheDocument();
        expect(screen.queryByText('Active Project A')).not.toBeInTheDocument();
    });
});