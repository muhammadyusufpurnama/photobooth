'use client';

import { useRef } from 'react';
import GIF from 'gif.js/dist/gif';

const GifRecorder = ({ onGifReady }) => {
    const gifRef = useRef(null);

    const recordGif = (canvasFrames, delayMs = 100) => {
        if (!canvasFrames || canvasFrames.length === 0) return;

        // 1. Tentukan Resolusi Target (Full HD 16:9)
        // Menggunakan 1280x720 untuk keseimbangan performa & kualitas, 
        // atau 1920x1080 untuk kualitas tertinggi.
        const targetWidth = 1920;
        const targetHeight = 1080;

        // 2. Inisialisasi GIF
        const gif = new GIF({
            workers: 2,
            quality: 1, // Kualitas terbaik (1-10, semakin rendah semakin bagus)
            width: targetWidth,
            height: targetHeight,
            workerScript: '/gif.worker.js',
        });

        // 3. Proses Frame dengan Center Cropping
        canvasFrames.forEach(canvas => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;
            const ctx = tempCanvas.getContext('2d');

            // --- LOGIKA ANTI-PENYET (Center Crop) ---
            // Kita menghitung rasio skala agar gambar memenuhi targetWidth & targetHeight
            const scale = Math.max(targetWidth / canvas.width, targetHeight / canvas.height);
            const drawWidth = canvas.width * scale;
            const drawHeight = canvas.height * scale;
            
            // Menempatkan gambar di tengah (memotong bagian yang berlebih)
            const offsetX = (targetWidth - drawWidth) / 2;
            const offsetY = (targetHeight - drawHeight) / 2;

            // Menggambar dengan fitur smoothing agar tidak pecah
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);

            gif.addFrame(tempCanvas, { delay: delayMs });
        });

        // 4. Event Selesai Render
        gif.on('finished', (blob) => {
            console.log("GIF HD 16:9 Selesai:", blob.size);
            onGifReady(blob);
        });

        // 5. Eksekusi Render
        gif.render();
        gifRef.current = gif;
    };

    return { recordGif };
};

export default GifRecorder;