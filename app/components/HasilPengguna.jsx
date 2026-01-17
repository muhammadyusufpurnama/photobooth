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

    // Asset
    const templateImg = templateId === 1 ? '/images/templates/template1.png' : '/images/templates/template2.png';
    const SCALE_FACTOR = 720 / 320; 

    // --- 2. LOAD CONFIG ADMIN ---
    useEffect(() => {
        const loadConfig = () => {
            const savedLayouts = localStorage.getItem('PHOTOBOOTH_LAYOUTS');
            let finalConfig = {
                photoWidth: 140, photoHeight: 100,
                marginTop: 80, marginLeft: 20,
                gapX: 10, gapY: 10, borderRadius: 0
            };

            if (savedLayouts) {
                try {
                    const allConfigs = JSON.parse(savedLayouts);
                    // Handle key string/integer
                    const config = allConfigs[templateId] || allConfigs[String(templateId)];
                    if (config) finalConfig = config;
                } catch(e) { console.error(e); }
            }
            setLayoutConfig(finalConfig);
            
            // Mulai proses jika belum
            if (!hasStartedProcess.current && photos && photos.length > 0) {
                hasStartedProcess.current = true;
                processAndUpload(finalConfig);
            }
        };
        const timer = setTimeout(loadConfig, 500);
        return () => clearTimeout(timer);
    }, [templateId, photos]);

    // --- 3. LOGIC PREVIEW GIF (FIXED) ---
    const [gifIndex, setGifIndex] = useState(0);
    useEffect(() => {
        if (!photos || photos.length === 0) return;
        const interval = setInterval(() => {
            setGifIndex(prev => (prev + 1) % photos.length);
        }, 500); 
        return () => clearInterval(interval);
    }, [photos]);


    // ==========================================
    // BAGIAN GENERATOR (BACKEND PROCESS)
    // ==========================================

    // A. GENERATOR GIF FILE
    const generateGifFile = (currentPhotos) => {
        return new Promise((resolve) => {
            const images = currentPhotos.map(p => p.src);
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
                canvas.width = 720; canvas.height = 1080;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const bgImg = new Image(); bgImg.src = templateImg;
                await new Promise(r => bgImg.onload = r);

                const loadedPhotos = await Promise.all(currentPhotos.map(async (p) => {
                    const img = new Image(); img.src = p.src;
                    await new Promise(r => img.onload = r);
                    return img;
                }));

                loadedPhotos.forEach((img, i) => {
                    const col = i % 2; const row = Math.floor(i / 2);
                    const w = cfg.photoWidth * SCALE_FACTOR;
                    const h = cfg.photoHeight * SCALE_FACTOR;
                    const x = (cfg.marginLeft * SCALE_FACTOR) + (col * (w + (cfg.gapX * SCALE_FACTOR)));
                    const y = (cfg.marginTop * SCALE_FACTOR) + (row * (h + (cfg.gapY * SCALE_FACTOR)));
                    ctx.drawImage(img, x, y, w, h);
                });

                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            } catch (err) { resolve(null); }
        });
    };

    // C. GENERATOR LIVE VIDEO MP4 (FIXED SYNCHRONIZATION)
    const generateLiveVideoFile = async (currentPhotos, cfg) => {
        return new Promise(async (resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 720; canvas.height = 1080;
                const ctx = canvas.getContext('2d');

                const bgImg = new Image(); bgImg.src = templateImg;
                await new Promise(r => bgImg.onload = r);

                // 1. SIAPKAN VIDEO & BUFFERRING
                const videoElements = await Promise.all(currentPhotos.map(async (p) => {
                    const v = document.createElement('video');
                    v.src = p.video; 
                    v.muted = true; 
                    v.playsInline = true;
                    v.preload = "auto"; // Wajib preload
                    v.loop = true;

                    // TRIK JITU: Play sebentar lalu Pause & Reset ke 0
                    // Ini memaksa browser me-render frame pertama ke memori
                    await v.play().then(() => {
                        v.pause();
                        v.currentTime = 0;
                    });
                    
                    return v;
                }));

                const stream = canvas.captureStream(30);
                const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                const chunks = [];
                recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };

                let animationId;
                const draw = () => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    videoElements.forEach((v, i) => {
                        const col = i % 2; const row = Math.floor(i / 2);
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

                // 2. MULAI BERSAMAAN (SYNC)
                // Start recorder DULUAN
                recorder.start();
                
                // Baru Play videonya bareng-bareng
                videoElements.forEach(v => v.play());
                
                // Mulai menggambar ke canvas
                draw();

                // 3. STOP SETELAH 5.5 DETIK (Aman untuk video 5 detik)
                setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    recorder.stop();
                    videoElements.forEach(v => { v.pause(); v.src = ''; });
                }, 5500); 

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                };
            } catch (e) { resolve(null); }
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
                photos: photos.map(p => ({ src: p.src })),
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

    // --- VISUAL STYLES ---
    const pStyle = layoutConfig ? {
        width: `${layoutConfig.photoWidth}px`,
        height: `${layoutConfig.photoHeight}px`,
        borderRadius: `${layoutConfig.borderRadius}px`
    } : {};
    
    const gridStyle = layoutConfig ? {
        top: `${layoutConfig.marginTop}px`,
        left: `${layoutConfig.marginLeft}px`,
        columnGap: `${layoutConfig.gapX}px`,
        rowGap: `${layoutConfig.gapY}px`
    } : {};

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
                {/* HEADER */}
                <div className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-gray-500/50 pb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 drop-shadow-md">🎉 Hasil Photobooth Kamu</h1>
                    <button onClick={onHome} className="bg-gray-800/80 hover:bg-gray-700/80 text-white px-6 py-2 rounded-full font-bold shadow-lg">Ke Halaman Utama</button>
                </div>

                {/* INFO BOX & QR CODE */}
                <div className="w-full max-w-6xl bg-gray-900/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2 text-blue-200">✨ Download Softfile Lengkap</h2>
                        <p className="text-gray-200 mb-4 font-medium">{isUploading ? loadingText : (downloadLink ? "Scan QR Code di samping, untuk mendapatkan file-file berikut:" : "Menunggu...")}</p>
                        <div className='ml-5 mb-5'>
                            <li>Foto Frame High-Res</li>
                            <li>6 Foto Mentahan</li>
                            <li>Video Live Photo Frame</li>
                            <li>Foto Animasi GIF</li>
                        </div>
                        {!isUploading && downloadLink && (
                            <div className="bg-black/50 p-3 rounded-lg border border-white/20 flex items-center justify-between max-w-md shadow-inner">
                                <span className="font-mono text-sm text-blue-300 truncate mr-2">{downloadLink}</span>
                                <button onClick={() => {navigator.clipboard.writeText(downloadLink); alert("Link Copied!")}} className="text-xs bg-blue-600 px-3 py-1 rounded font-bold">Copy</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
                        {isUploading ? (
                            <div className="flex flex-col items-center text-center px-2">
                                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                                <span className="text-gray-500 text-xs font-bold leading-tight">{loadingText}</span>
                            </div>
                        ) : (
                            downloadLink ? (
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(downloadLink)}`} className="w-full h-full opacity-90" alt="QR" />
                            ) : (
                                <span className="text-red-500 text-xs font-bold text-center">Gagal memuat QR.</span>
                            )
                        )}
                    </div>
                </div>

                {/* PREVIEW GRID */}
                {layoutConfig && (
                    <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
                        {/* 1. FOTO FRAME */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative group w-full flex justify-center shadow-xl">
                                <span className="absolute top-0 left-0 bg-blue-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">1. Foto Frame</span>
                                <div className="relative overflow-hidden bg-white shadow-xl transform origin-top" style={{ width: '240px', height: '360px' }}>
                                    <div className="absolute top-0 left-0 w-[320px] h-[480px] origin-top-left transform scale-75">
                                        <div className="absolute grid grid-cols-2 grid-rows-3 z-0" style={gridStyle}>
                                            {photos.map((p, i) => (
                                                <div key={i} className="bg-gray-200 overflow-hidden" style={pStyle}>
                                                    <img src={p?.src} className="w-full h-full object-cover" style={filterStyle} alt="" />
                                                </div>
                                            ))}
                                        </div>
                                        <img src={templateImg} className="absolute inset-0 w-full h-full z-10 pointer-events-none" alt="Frame" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. FOTO MENTAHAN */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full h-full min-h-[400px] flex items-center justify-center shadow-xl">
                                <span className="absolute top-0 left-0 bg-gray-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">2. Foto Mentahan</span>
                                <div className="relative w-[200px] h-[140px]">
                                    {photos.slice(0,3).map((p, i) => (
                                        <img key={i} src={p?.src} className="absolute w-full h-full object-cover border-4 border-white shadow-2xl rounded" style={{ top: i*25, left: i*15, transform: `rotate(${i*8-8}deg)`, zIndex: i, ...filterStyle }} alt="Raw" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. LIVE FRAME */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full flex justify-center shadow-xl">
                                <span className="absolute top-0 left-0 bg-red-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 animate-pulse shadow-md">3. Live Frame</span>
                                <div className="relative overflow-hidden bg-black shadow-xl" style={{ width: '240px', height: '360px' }}>
                                    <div className="absolute top-0 left-0 w-[320px] h-[480px] origin-top-left transform scale-75">
                                        <div className="absolute grid grid-cols-2 grid-rows-3 z-0" style={gridStyle}>
                                            {photos.map((p, i) => (
                                                <div key={i} className="overflow-hidden bg-gray-900 relative" style={pStyle}>
                                                    {p?.video ? (
                                                        <video src={p.video} autoPlay loop muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" style={filterStyle} />
                                                    ) : <img src={p?.src} className="w-full h-full object-cover" style={filterStyle} />}
                                                </div>
                                            ))}
                                        </div>
                                        <img src={templateImg} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. GIF LOOP (FIXED) */}
                        <div className="flex flex-col items-center gap-4">
                             <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full flex items-center justify-center min-h-[400px] shadow-xl">
                                <span className="absolute top-0 left-0 bg-purple-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">4. GIF Loop</span>
                                <div className="relative w-[360px] h-[240px] bg-black flex items-center justify-center overflow-hidden rounded-lg shadow-2xl border-4 border-white">
                                    
                                    {/* FIX: Mencegah Blank dengan Check Photos */}
                                    {photos && photos.length > 0 && photos[gifIndex] ? (
                                        <img src={photos[gifIndex].src} className="w-full h-full object-cover" style={filterStyle} alt="GIF Preview" />
                                    ) : (
                                        <div className="text-white text-xs">Memuat GIF...</div>
                                    )}

                                    <div className="absolute bottom-2 right-2 bg-black/70 text-[10px] px-2 py-0.5 rounded text-white font-mono backdrop-blur-sm">GIF</div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default HasilPengguna;