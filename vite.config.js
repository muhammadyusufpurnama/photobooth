import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Tambahkan impor Laravel Plugin
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    fontfamily: 'Bestie, cursive',
    plugins: [
        tailwindcss(),
        // [Wajib] Plugin Laravel
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx' // Pastikan entry point Anda benar
            ],
            refresh: true,
        }),
        react(),
    ],

    server: {
        // Biarkan host: '0.0.0.0' jika Anda perlu diakses dari luar, TAPI...
        host: '0.0.0.0',
        port: 5173,

        // ...Gunakan konfigurasi HMR berikut untuk memaksa browser menggunakan 'localhost'
        // untuk URL aset, yang dapat dirutekan.
        hmr: {
             // Browser akan mencoba memuat aset dari http://localhost:5173
             host: 'localhost',
             protocol: 'ws',
        },

        // PROXY KE LARAVEL (Port 8000) - Tetap sama
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8001',
                changeOrigin: true,
                secure: false,
            },
            '/images': {
                target: 'http://127.0.0.1:8001',
                changeOrigin: true,
                secure: false,
            },
        },
    },

    build: {
        // ...
    }
});
