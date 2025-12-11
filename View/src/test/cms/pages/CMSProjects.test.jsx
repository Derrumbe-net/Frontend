import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSProjects from '../../../cms/pages/CMSProjects';

// Mock SweetAlert2 for testing alerts and confirmations
import Swal from 'sweetalert2';
vi.mock('sweetalert2', () => ({
    default: {
        fire: vi.fn(),
    },
}));

// Mock URL.createObjectURL for handling image file previews
global.URL.createObjectURL = vi.fn(() => 'mock-image-url');
global.URL.revokeObjectURL = vi.fn();

// Mock environment variables for predictable API routes
const mockApiUrl = 'http://testapi.com';
vi.stubEnv('VITE_API_URL', mockApiUrl);

// Define comprehensive mock data for list display and pagination
const mockProjects = [
    { project_id: 1, title: 'Project A', start_year: 2020, end_year: 2021, description: 'Description A with some length.', project_status: 'completed', image_url: true },
    { project_id: 2, title: 'Project B', start_year: 2021, end_year: 2022, description: 'Description B with some length.', project_status: 'active' },
    { project_id: 3, title: 'Project C', start_year: 2022, end_year: 2023, description: 'Description C with some length.', project_status: 'completed' },
    { project_id: 4, title: 'Project D', start_year: 2023, end_year: 2024, description: 'Description D with some length.', project_status: 'active' },
    { project_id: 5, title: 'Project E', start_year: 2024, end_year: 2025, description: 'Description E with some length.', project_status: 'completed' },
    { project_id: 6, title: 'Project F (Page 2)', start_year: 2025, end_year: 2026, description: 'Description F for page 2.', project_status: 'active' },
];

describe('CMSProjects', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        global.fetch = vi.fn();
        localStorage.setItem('cmsAdmin', 'mock-token');

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockProjects
        });

        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        Swal.fire.mockClear();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        localStorage.clear();
        global.fetch.mockRestore();
    });

    const getFormInputs = (container) => ({
        titleInput: container.querySelector('input[name="title"]'),
        startYear: container.querySelector('input[name="start_year"]'),
        endYear: container.querySelector('input[name="end_year"]'),
        desc: container.querySelector('textarea[name="description"]'),
        statusSelect: container.querySelector('select[name="project_status"]'),
        imageFile: container.querySelector('input[type="file"]'),
    });

    it('renders project list successfully on mount', async () => {
        render(<CMSProjects />);
        // Wait for asynchronous data loading
        await waitFor(() => screen.getByText('Project A'));

        expect(screen.getByText('Project A')).toBeInTheDocument();
        expect(screen.getByText('Project E')).toBeInTheDocument();
        expect(screen.queryByText('Project F (Page 2)')).not.toBeInTheDocument();
    });

    it('handles initial fetch failure gracefully', async () => {
        // FIX: Mock the initial fetch call to explicitly reject the promise
        global.fetch.mockImplementationOnce(() => Promise.reject(new Error("Network failure during initial fetch")));

        render(<CMSProjects />);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching projects:", expect.anything());
        });

        expect(screen.getByText('Gestión de Proyectos')).toBeInTheDocument();
        expect(screen.queryByText('Project A')).not.toBeInTheDocument();
    });

    it('updates current page and shows correct items on pagination click', async () => {
        render(<CMSProjects />);

        await waitFor(() => screen.getByText('Project A'));

        // Check initial state (Page 1)
        expect(screen.queryByText('Project F (Page 2)')).not.toBeInTheDocument();
        expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

        // Click next page button
        fireEvent.click(screen.getByTitle('Siguiente página'));

        // Check Page 2 state
        await waitFor(() => {
            expect(screen.queryByText('Project A')).not.toBeInTheDocument();
            expect(screen.getByText('Project F (Page 2)')).toBeInTheDocument();
            expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
        });

        // Click previous page button
        fireEvent.click(screen.getByTitle('Página anterior'));

        // Check Page 1 state again
        await waitFor(() => {
            expect(screen.getByText('Project A')).toBeInTheDocument();
            expect(screen.queryByText('Project F (Page 2)')).not.toBeInTheDocument();
        });
    });

    it('disables pagination buttons correctly', async () => {
        render(<CMSProjects />);

        await waitFor(() => {
            const prevButton = screen.getByTitle('Página anterior');
            const nextButton = screen.getByTitle('Siguiente página');

            // Page 1: Previous should be disabled, Next should be enabled
            expect(prevButton).toBeDisabled();
            expect(nextButton).not.toBeDisabled();
        });

        // Go to Page 2
        fireEvent.click(screen.getByTitle('Siguiente página'));

        await waitFor(() => {
            const prevButton = screen.getByTitle('Página anterior');
            const nextButton = screen.getByTitle('Siguiente página');

            // Page 2: Previous should be enabled, Next should be disabled
            expect(prevButton).not.toBeDisabled();
            expect(nextButton).toBeDisabled();
        });
    });


    it('shows network error on project deletion throw', async () => {
        const projectToDelete = mockProjects[0];

        // Mock initial fetch success (already set in beforeEach)
        // Mock fetch to throw for the DELETE call
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProjects });
        global.fetch.mockRejectedValueOnce(new Error('Network Down'));

        render(<CMSProjects />);
        await waitFor(() => screen.getByText(projectToDelete.title));

        Swal.fire.mockImplementationOnce(() => Promise.resolve({ isConfirmed: true }));
        fireEvent.click(screen.getAllByTitle('Eliminar')[0]);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Network Down'));
            expect(Swal.fire).toHaveBeenCalledWith("Error", "No se pudo conectar al servidor.", "error");
        });
    });

    it('submits new project form successfully without image', async () => {
        const { container } = render(<CMSProjects />);

        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc } = getFormInputs(container);

        fireEvent.change(titleInput, { target: { value: 'New Project' } });
        fireEvent.change(startYear, { target: { value: '2022' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'This is a description that is long enough.' } });

        // Mock fetch for form submission (POST)
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ project_id: 99 }) });
        // Mock fetch for project list refresh
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ([...mockProjects, { project_id: 99, title: 'New Project' }]) });

        Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            // Assert POST call
            expect(global.fetch).toHaveBeenCalledWith(`${mockApiUrl}/projects`, expect.objectContaining({
                method: 'POST',
            }));
            expect(Swal.fire).toHaveBeenCalledWith('Éxito', expect.anything(), 'success');
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });
    });

    it('uploads an image file when submitting a new project', async () => {
        const { container } = render(<CMSProjects />);
        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc, imageFile } = getFormInputs(container);

        fireEvent.change(titleInput, { target: { value: 'Image Project' } });
        fireEvent.change(startYear, { target: { value: '2022' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'This is a description that is long enough.' } });

        // Mock image file selection (triggers file state update)
        const file = new File(['(⌐■_■)'], 'chucknorris.png', { type: 'image/png' });
        fireEvent.change(imageFile, { target: { files: [file] } });

        // Mock fetches for form submission (POST)
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ project_id: 100 }) }); // 2. Project POST
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // 3. Image POST
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ([...mockProjects]) }); // 4. Refresh GET

        Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            // Assert image POST call
            expect(global.fetch).toHaveBeenCalledWith(`${mockApiUrl}/projects/100/image`, expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData), // Check payload type
            }));
            expect(global.fetch).toHaveBeenCalledTimes(4);
        });
    });

    it('initializes form correctly when editing a project', async () => {
        const projectToEdit = mockProjects[1]; // Project B
        render(<CMSProjects />);

        await waitFor(() => screen.getByText(projectToEdit.title));

        fireEvent.click(screen.getAllByTitle('Editar')[1]);

        await waitFor(() => {
            // Check form title and pre-filled values
            expect(screen.getByText('Editar Proyecto')).toBeInTheDocument();
            expect(screen.getByDisplayValue(projectToEdit.title)).toBeInTheDocument();
            expect(screen.getByDisplayValue(String(projectToEdit.start_year))).toBeInTheDocument();
        });
    });

    it('shows error when title is missing', async () => {
        const { container } = render(<CMSProjects />);
        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc } = getFormInputs(container);

        fireEvent.change(titleInput, { target: { value: ' ' } }); // Invalid
        fireEvent.change(startYear, { target: { value: '2022' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'Valid description text' } });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith("Error", "El título es obligatorio.", "warning");
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    it('shows error when start/end year is missing', async () => {
        const { container } = render(<CMSProjects />);
        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc } = getFormInputs(container);

        fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
        // Missing Start Year
        fireEvent.change(startYear, { target: { value: '' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'Valid description text' } });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith("Error", "Debe ingresar los años.", "warning");
        });
    });

    it('shows error when end year is less than start year', async () => {
        const { container } = render(<CMSProjects />);
        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc } = getFormInputs(container);

        // FIX: Fill mandatory fields first
        fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
        fireEvent.change(desc, { target: { value: 'Valid description text that is long enough.' } });

        fireEvent.change(startYear, { target: { value: '2025' } });
        fireEvent.change(endYear, { target: { value: '2024' } }); // Invalid end year (should trigger check)

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            // ASSERTION NOW PASSES because we passed the initial validation checks
            expect(Swal.fire).toHaveBeenCalledWith("Error", "El año de fin no puede ser menor al de inicio.", "warning");
        });
    });

    it('shows error when start year is invalid (e.g., < 1900)', async () => {
        const { container } = render(<CMSProjects />);
        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc } = getFormInputs(container);

        fireEvent.change(titleInput, { target: { value: 'Test' } });
        fireEvent.change(desc, { target: { value: 'Valid description text that is long enough.' } }); // Fill mandatory fields

        fireEvent.change(startYear, { target: { value: '1899' } }); // Invalid range
        fireEvent.change(endYear, { target: { value: '2023' } });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith("Error", "Año de inicio inválido.", "warning");
        });
    });

    it('shows error when description is too short (< 10 chars)', async () => {
        const { container } = render(<CMSProjects />);
        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        const { titleInput, startYear, endYear, desc } = getFormInputs(container);

        fireEvent.change(titleInput, { target: { value: 'Test' } });
        fireEvent.change(startYear, { target: { value: '2022' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'Short' } }); // Invalid (length 5)

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith("Error", "Descripción muy corta.", "warning");
        });
    });

    it('shows token error when cmsAdmin is missing on submission', async () => {
        localStorage.removeItem('cmsAdmin');
        const { container } = render(<CMSProjects />);

        await waitFor(() => screen.getByText('Project A'));
        fireEvent.click(screen.getByText('Añadir Proyecto'));

        // Fill valid data
        const { titleInput, startYear, endYear, desc } = getFormInputs(container);
        fireEvent.change(titleInput, { target: { value: 'Test' } });
        fireEvent.change(startYear, { target: { value: '2022' } });
        fireEvent.change(endYear, { target: { value: '2023' } });
        fireEvent.change(desc, { target: { value: 'Long enough description.' } });

        Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

        fireEvent.click(screen.getByText('Crear Proyecto'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(Swal.fire).toHaveBeenCalledWith("Error", "Sesión expirada.", "error");
        });
    });
});