import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/',
    resolve: {
        alias: {
            '@config': path.resolve(__dirname, './siteConfig.js')
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.js',
        include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    },
});
