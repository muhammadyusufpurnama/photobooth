'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gifshot from 'gifshot';

const HasilPengguna = ({ photos, templateId, filterStyle, onHome }) => {
    // --- 1. STATE CONFIG & UI ---
    const [layoutConfig, setLayoutConfig] = useState(null); 
    const [downloadLink, setDownloadLink] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingText, setLoadingText] = useState("Memuat konfigurasi...");
    const hasStartedProcess = useRef(false);

    // Filter foto yang tidak null untuk keperluan internal (GIF Preview & Generator)
    const validPhotos = photos.filter(p => p !== null);

    // Asset
    const templateImg = templateId === 1 ? '/images/templates/template1.png' : '/images/templates/template2.png';
    const SCALE_FACTOR = 720 / 320; 

    // --- 2. LOAD CONFIG ADMIN ---
    useEffect(() => {
        const loadConfig = () => {
            // 1. Ambil galeri utama
            const savedGallery = localStorage.getItem('PHOTOBOOTH_GALLERY');
            
            // 2. Default fallback jika data tidak ditemukan
            let finalConfig = {
                photoWidth: 140, photoHeight: 100,
                marginTop: 80, marginLeft: 20,
                gapX: 10, gapY: 10, borderRadius: 0
            };

            if (savedGallery) {
                try {
                    const gallery = JSON.parse(savedGallery);
                    // Cari template yang sedang digunakan berdasarkan templateId (index)
                    const currentTemplate = gallery[templateId]; 
                    
                    if (currentTemplate && currentTemplate.slots.length > 0) {
                        // Ambil slot pertama sebagai referensi ukuran (karena layoutConfig lama berbentuk objek tunggal)
                        const referenceSlot = currentTemplate.slots[0];
                        
                        // Jika Anda ingin menggunakan sistem koordinat dinamis per slot, 
                        // kita harus memodifikasi fungsi generateFrameFile (Lihat langkah 2)
                        finalConfig = {
                            ...finalConfig,
                            photoWidth: referenceSlot.width,
                            photoHeight: referenceSlot.height,
                        };
                    }
                } catch(e) { console.error("Gagal sinkronisasi layout:", e); }
            }
            
            setLayoutConfig(finalConfig);
            
            // Mulai proses jika belum dan ada minimal 1 foto
            if (!hasStartedProcess.current && validPhotos.length > 0) {
                hasStartedProcess.current = true;
                processAndUpload(finalConfig);
            }
        };
        const timer = setTimeout(loadConfig, 500);
        return () => clearTimeout(timer);
    }, [templateId, photos]);

    // --- 3. LOGIC PREVIEW GIF ---
    const [gifIndex, setGifIndex] = useState(0);
    useEffect(() => {
        if (validPhotos.length === 0) return;

        const interval = setInterval(() => {
            setGifIndex(prev => (prev + 1) % validPhotos.length);
        }, 500); 
        return () => clearInterval(interval);
    }, [validPhotos]);


    // ==========================================
    // BAGIAN GENERATOR (BACKEND PROCESS)
    // ==========================================

    // A. GENERATOR GIF FILE
    const generateGifFile = (currentPhotos) => {
        return new Promise((resolve) => {
            const images = currentPhotos.filter(p => p !== null).map(p => p.src);
            if (images.length === 0) return resolve(null);

            gifshot.createGIF({
                images: images, interval: 0.5, gifWidth: 400, gifHeight: 300, numFrames: 6
            }, (obj) => resolve(!obj.error ? obj.image : null));
        });
    };

    // B. GENERATOR FRAME PNG
    const generateFrameFile = async (currentPhotos, cfg) => {
        return new Promise(async (resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 720; 
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');

                // Background putih dasar
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 1. Ambil data template yang tepat dari Galeri
                const savedGallery = JSON.parse(localStorage.getItem('PHOTOBOOTH_GALLERY') || '[]');
                
                // Gunakan .find jika templateId adalah ID unik, atau index jika templateId adalah urutan
                const currentTemplate = savedGallery.find((t, index) => index === templateId || t.id === templateId);
                const slotsConfig = currentTemplate ? currentTemplate.slots : [];

                // 2. Load Template Image (Overlay)
                const bgImg = new Image();
                bgImg.src = currentTemplate ? currentTemplate.image : templateImg; 
                await new Promise(r => bgImg.onload = r);

                // 3. Gambar setiap foto berdasarkan slotnya
                for (let i = 0; i < currentPhotos.length; i++) {
                    const photoData = currentPhotos[i];
                    const slot = slotsConfig[i]; 

                    if (photoData && slot) {
                        const img = new Image();
                        img.src = photoData.src;
                        await new Promise(r => img.onload = r);

                        const x = slot.x * SCALE_FACTOR;
                        const y = slot.y * SCALE_FACTOR;
                        const w = slot.width * SCALE_FACTOR;
                        const h = slot.height * SCALE_FACTOR;

                        ctx.save();
                        
                        // --- TAMBAHKAN FILTER DISINI JIKA ADA ---
                        // Contoh: if(filterStyle.filter.includes('grayscale')) ctx.filter = 'grayscale(100%)';
                        
                        // Gambar foto di bawah template
                        ctx.drawImage(img, x, y, w, h);
                        ctx.restore();
                    }
                }

                // 4. Gambar Template Overlay di atas semua foto
                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                
                resolve(canvas.toDataURL('image/png', 1.0)); // 1.0 untuk kualitas maksimal
            } catch (err) { 
                console.error("Gagal generate frame:", err);
                resolve(null); 
            }
        });
    };

    // C. GENERATOR LIVE VIDEO MP4
    const generateLiveVideoFile = async (currentPhotos, cfg) => {
        return new Promise(async (resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 720; canvas.height = 1080;
                const ctx = canvas.getContext('2d');

                const bgImg = new Image(); bgImg.src = templateImg;
                await new Promise(r => bgImg.onload = r);

                const videoElements = await Promise.all(currentPhotos.map(async (p, i) => {
                    if (!p || !p.video) return null;
                    const v = document.createElement('video');
                    v.src = p.video; 
                    v.muted = true; 
                    v.playsInline = true;
                    v.preload = "auto";
                    v.loop = true;

                    await v.play().then(() => {
                        v.pause();
                        v.currentTime = 0;
                    });
                    return { v, index: i };
                }));

                const stream = canvas.captureStream(30);
                const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                const chunks = [];
                recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };

                let animationId;
                const draw = () => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    videoElements.forEach((item) => {
                        if (!item) return;
                        const { v, index } = item;
                        const col = index % 2; const row = Math.floor(index / 2);
                        const w = cfg.photoWidth * SCALE_FACTOR;
                        const h = cfg.photoHeight * SCALE_FACTOR;
                        const x = (cfg.marginLeft * SCALE_FACTOR) + (col * (w + (cfg.gapX * SCALE_FACTOR)));
                        const y = (cfg.marginTop * SCALE_FACTOR) + (row * (h + (cfg.gapY * SCALE_FACTOR)));

                        ctx.save();
                        ctx.translate(x + w, y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(v, 0, 0, w, h);
                        ctx.restore();
                    });

                    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    animationId = requestAnimationFrame(draw);
                };

                recorder.start();
                videoElements.forEach(item => item?.v.play());
                draw();

                setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    recorder.stop();
                    videoElements.forEach(item => { if(item) { item.v.pause(); item.v.src = ''; } });
                }, 5500); 

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                };
            } catch (e) { console.error(e); resolve(null); }
        });
    };

    // --- 4. ORKESTRATOR UPLOAD ---
    const processAndUpload = async (activeConfig) => {
        setIsUploading(true);
        setLoadingText("Merender Video & Frame...");

        try {
            const [liveVideo, gif, frame] = await Promise.all([
                generateLiveVideoFile(photos, activeConfig),
                generateGifFile(photos),
                generateFrameFile(photos, activeConfig)
            ]);

            setLoadingText("Mengupload ke Google Drive...");
            
            const payload = {
                // Hanya kirim data yang tidak null ke drive
                photos: validPhotos.map(p => ({ src: p.src })),
                generated_gif: gif,
                generated_frame: frame,
                generated_live_video: liveVideo
            };

            const response = await axios.post('/api/upload-drive', payload);

            if (response.data.success) {
                setDownloadLink(response.data.folder_link);
                setLoadingText("Selesai!");
            }
        } catch (error) {
            console.error(error);
            setLoadingText("Gagal Upload.");
        } finally {
            setIsUploading(false);
        }
    };

    // --- RENDER UI ---
    return (
        <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col items-center p-6 font-sans overflow-y-auto relative"
             style={{
                backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")',
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
             }}
        >
            <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>
            
            <div className="w-full flex flex-col items-center z-10 relative">
                <div className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-gray-500/50 pb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 drop-shadow-md">🎉 Hasil Photobooth Kamu</h1>
                    <button onClick={onHome} className="bg-gray-800/80 hover:bg-gray-700/80 text-white px-6 py-2 rounded-full font-bold shadow-lg transition transform active:scale-95">Ke Halaman Utama</button>
                </div>

                {/* INFO BOX & QR CODE */}
                <div className="w-full max-w-6xl bg-gray-900/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2 text-blue-200">✨ Download Softfile Lengkap</h2>
                        <p className="text-gray-200 mb-4 font-medium">{isUploading ? loadingText : (downloadLink ? "Scan QR Code di samping, untuk mendapatkan file-file berikut:" : "Menunggu...")}</p>
                        <ul className='ml-5 mb-5 list-disc text-gray-300'>
                            <li>Foto Frame High-Res</li>
                            <li>Foto Mentahan ({validPhotos.length} file)</li>
                            <li>Video Live Photo Frame</li>
                            <li>Foto Animasi GIF</li>
                        </ul>
                        {!isUploading && downloadLink && (
                            <div className="bg-black/50 p-3 rounded-lg border border-white/20 flex items-center justify-between max-w-md shadow-inner">
                                <span className="font-mono text-sm text-blue-300 truncate mr-2">{downloadLink}</span>
                                <button onClick={() => {navigator.clipboard.writeText(downloadLink); alert("Link Copied!")}} className="text-xs bg-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-500 transition">Copy</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
                        {isUploading ? (
                            <div className="flex flex-col items-center text-center px-2">
                                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                                <span className="text-gray-500 text-xs font-bold leading-tight">{loadingText}</span>
                            </div>
                        ) : downloadLink ? (
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(downloadLink)}`} className="w-full h-full opacity-90" alt="QR" />
                        ) : (
                            <span className="text-red-500 text-xs font-bold text-center">Gagal memuat QR.</span>
                        )}
                    </div>
                </div>

                {/* PREVIEW GRID */}
                {layoutConfig && (
                    <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
                        {/* 1. FOTO FRAME */}
                        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative group w-full flex justify-center shadow-xl h-fit">
                            <span className="absolute top-0 left-0 bg-blue-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">1. Foto Frame</span>
                            <div className="relative overflow-hidden bg-white shadow-xl" style={{ width: '240px', height: '360px' }}>
                                <div className="absolute top-0 left-0 w-[320px] h-[480px] origin-top-left transform scale-[0.75]">
                                    <div className="absolute grid grid-cols-2 grid-rows-3 z-0" 
                                         style={{ 
                                            top: `${layoutConfig.marginTop}px`, 
                                            left: `${layoutConfig.marginLeft}px`, 
                                            columnGap: `${layoutConfig.gapX}px`, 
                                            rowGap: `${layoutConfig.gapY}px` 
                                         }}>
                                        {photos.map((p, i) => (
                                            <div key={i} className="bg-gray-200 overflow-hidden" 
                                                 style={{ 
                                                    width: `${layoutConfig.photoWidth}px`, 
                                                    height: `${layoutConfig.photoHeight}px`, 
                                                    borderRadius: `${layoutConfig.borderRadius}px` 
                                                 }}>
                                                {p && <img src={p.src} className="w-full h-full object-cover" style={filterStyle} alt="" />}
                                            </div>
                                        ))}
                                    </div>
                                    <img src={templateImg} className="absolute inset-0 w-full h-full z-10 pointer-events-none" alt="Frame" />
                                </div>
                            </div>
                        </div>

                        {/* 2. FOTO MENTAHAN */}
                        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full h-[400px] flex items-center justify-center shadow-xl">
                            <span className="absolute top-0 left-0 bg-gray-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">2. Foto Mentahan</span>
                            <div className="relative w-[180px] h-[120px]">
                                {validPhotos.slice(0, 3).map((p, i) => (
                                    <img key={i} src={p.src} className="absolute w-full h-full object-cover border-4 border-white shadow-2xl rounded" 
                                         style={{ top: i*20, left: i*15, transform: `rotate(${i*8-8}deg)`, zIndex: i, ...filterStyle }} alt="Raw" />
                                ))}
                            </div>
                        </div>

                        {/* 3. LIVE FRAME */}
                        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full flex justify-center shadow-xl h-fit">
                            <span className="absolute top-0 left-0 bg-red-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 animate-pulse shadow-md">3. Live Frame</span>
                            <div className="relative overflow-hidden bg-black shadow-xl" style={{ width: '240px', height: '360px' }}>
                                <div className="absolute top-0 left-0 w-[320px] h-[480px] origin-top-left transform scale-[0.75]">
                                    <div className="absolute grid grid-cols-2 grid-rows-3 z-0" 
                                         style={{ 
                                            top: `${layoutConfig.marginTop}px`, 
                                            left: `${layoutConfig.marginLeft}px`, 
                                            columnGap: `${layoutConfig.gapX}px`, 
                                            rowGap: `${layoutConfig.gapY}px` 
                                         }}>
                                        {photos.map((p, i) => (
                                            <div key={i} className="overflow-hidden bg-gray-900 relative" 
                                                 style={{ 
                                                    width: `${layoutConfig.photoWidth}px`, 
                                                    height: `${layoutConfig.photoHeight}px`, 
                                                    borderRadius: `${layoutConfig.borderRadius}px` 
                                                 }}>
                                                {p?.video ? (
                                                    <video src={p.video} autoPlay loop muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" style={filterStyle} />
                                                ) : p ? (
                                                    <img src={p.src} className="w-full h-full object-cover" style={filterStyle} alt="" />
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                    <img src={templateImg} className="absolute inset-0 w-full h-full z-10 pointer-events-none" alt="" />
                                </div>
                            </div>
                        </div>

                        {/* 4. GIF LOOP */}
                        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full flex items-center justify-center h-[400px] shadow-xl">
                            <span className="absolute top-0 left-0 bg-purple-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">4. GIF Loop</span>
                            <div className="relative w-[300px] aspect-[4/3] bg-black flex items-center justify-center overflow-hidden rounded-lg shadow-2xl border-4 border-white">
                                {validPhotos.length > 0 ? (
                                    <img src={validPhotos[gifIndex].src} className="w-full h-full object-cover" style={filterStyle} alt="GIF Preview" />
                                ) : (
                                    <div className="text-white text-xs">Memuat GIF...</div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-[10px] px-2 py-0.5 rounded text-white font-mono backdrop-blur-sm">GIF</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HasilPengguna;