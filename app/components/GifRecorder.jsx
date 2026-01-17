'use client';

import { useRef } from 'react';
// PERBAIKAN: Mengarah spesifik ke folder dist agar Vite bisa menemukannya
import GIF from 'gif.js/dist/gif';

const GifRecorder = ({ onGifReady }) => {
    const gifRef = useRef(null);

    const recordGif = (canvasFrames, delayMs = 100) => {
        if (canvasFrames.length === 0) return;

        // 1. AMBIL UKURAN DARI FRAME PERTAMA
        // Ini penting agar ukuran GIF menyesuaikan kamera (tidak ada kotak hitam)
        const width = canvasFrames[0].width;
        const height = canvasFrames[0].height;

        // 2. Inisialisasi GIF baru
        const gif = new GIF({
            workers: 2,
            quality: 10,
            // Pastikan file gif.worker.js sudah ada di folder public/ proyek Laravel Anda
            workerScript: '/gif.worker.js',
            width: width,
            height: height,
            transparent: null,
            background: '#000'
        });

        // 3. Tambahkan Semua Frame
        canvasFrames.forEach(canvas => {
            gif.addFrame(canvas, { delay: delayMs });
        });

        // 4. Event saat GIF selesai diproses
        gif.on('finished', (blob) => {
            console.log("GIF Selesai dibuat, ukuran:", blob.size);
            onGifReady(blob);
        });

        console.log(`Mulai render GIF (${width}x${height}) dengan ${canvasFrames.length} frames...`);

        // 5. Mulai proses rendering
        gif.render();

        gifRef.current = gif;
    };

    return { recordGif };
};

export default GifRecorder;
