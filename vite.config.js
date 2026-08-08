import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            // Ubah bagian input ini menjadi array yang memuat CSS & JS
            input: ['resources/css/app.css', 'resources/js/app.jsx'], 
            refresh: true,
            buildDirectory: 'build',
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        cssMinify: 'esbuild',
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        hmr: {
            host: '127.0.0.1',
        },
    },
});