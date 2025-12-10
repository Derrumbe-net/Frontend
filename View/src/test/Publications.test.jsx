import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Publications from '../pages/Publications';

vi.mock("../assets/search-icon-png-9.png", () => ({ default: "search-icon" }));
vi.mock("../assets/publications/publication1.webp", () => ({ default: "pub1.webp" }));
vi.mock("../assets/placeholder.png", () => ({ default: "placeholder.png" }));

const MOCK_PUBS = [
    { publication_id: 1, title: 'Special Pub', description: 'Desc 1', publication_url: 'http://orig', image_url: 'img1' },
    { publication_id: 2, title: 'Standard Pub', description: 'Desc 2', publication_url: 'http://google.com', image_url: null },
];

const mockFetch = async (url) => {
    if (url.includes('/publications')) {
        return { ok: true, json: () => Promise.resolve(MOCK_PUBS) };
    }
    return Promise.reject(new Error(`Unhandled: ${url}`));
};

describe('Publications Component', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(mockFetch));
        render(<Publications />);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and displays publications', async () => {
        expect(await screen.findByText('Special Pub')).toBeInTheDocument();
        expect(screen.getByText('Standard Pub')).toBeInTheDocument();
    });
});