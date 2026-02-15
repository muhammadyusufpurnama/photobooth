'use client';

import { useRef } from 'react';
import GIF from 'gif.js/dist/gif';

const GifRecorder = ({ onGifReady }) => {
    const gifRef = useRef(null);

    const recordGif = (canvasFrames, delayMs = 100) => {
        if (!canvasFrames || canvasFrames.length === 0) return;

        // --- 1. TENTUKAN RESOLUSI TARGET (16:9 VERCEL SAFE) ---
        // PENTING: Jangan pakai 1920x1080 untuk GIF! Ukurannya akan 15MB++ (Gagal Upload).
        // Gunakan 480x270 (Rasio 16:9 murni). Cukup tajam untuk GIF HP & Size kecil (~300KB).
        const targetWidth = 960; 
        const targetHeight = 640; 

        // 2. Inisialisasi GIF
        const gif = new GIF({
            workers: 2,
            quality: 10, // Ubah ke 10 (Standard Web) agar file lebih ringan daripada 1 (Best)
            width: targetWidth,
            height: targetHeight,
            workerScript: '/gif.worker.js',
            background: '#000000', // Hitam sebagai dasar
        });

        // 3. Proses Frame dengan Center Cropping (Agar tidak gepeng)
        canvasFrames.forEach(canvas => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;
            const ctx = tempCanvas.getContext('2d');

            // --- LOGIKA "CENTER CROP" (ANTI-PENYET) ---
            // Menghitung skala agar gambar memenuhi seluruh kotak 16:9
            const scale = Math.max(targetWidth / canvas.width, targetHeight / canvas.height);
            const drawWidth = canvas.width * scale;
            const drawHeight = canvas.height * scale;
            
            // Posisi tengah
            const offsetX = (targetWidth - drawWidth) / 2;
            const offsetY = (targetHeight - drawHeight) / 2;

            // Aktifkan smoothing agar downscaling dari 1080p ke 270p tetap halus
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Gambar di tengah
            ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);

            // Tambahkan frame ke GIF
            gif.addFrame(tempCanvas, { delay: delayMs });
        });

        // 4. Event Selesai Render
        gif.on('finished', (blob) => {
            // Debugging ukuran file di console
            console.log("GIF 16:9 (Optimized) Selesai:", (blob.size / 1024).toFixed(2) + " KB");
            onGifReady(blob);
        });

        // 5. Eksekusi Render
        gif.render();
        gifRef.current = gif;
    };

    return { recordGif };
};

export default GifRecorder;