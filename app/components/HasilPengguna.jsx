'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gifshot from 'gifshot';
import Swal from 'sweetalert2';

const HasilPengguna = ({ onHome, photos, filterStyle, templateId }) => {
    // --- 1. STATE CONFIG & UI ---
    const [templateConfig, setTemplateConfig] = useState(null); 
    const [downloadLink, setDownloadLink] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingText, setLoadingText] = useState("Memuat konfigurasi...");
    const hasStartedProcess = useRef(false);

    const validPhotos = photos.filter(p => p !== null);

    // Asset Default
    const defaultTemplateImg = '/images/templates/template1.png';

    // --- SETTING KUALITAS (DITURUNKAN AGAR TIDAK ERROR 413 DI VERCEL) ---
    // Scale 1.5 = Resolusi output 480x720 (Cukup jelas di HP, File Ringan)
    // Jangan pakai 4.0 (terlalu besar untuk Vercel Free Tier)
    const SCALE_FACTOR = 1.5; 
    const VIDEO_FPS = 15; // 15 FPS Cukup untuk Live Photo
    const VIDEO_BITRATE = 600000; // 600 kbps (Sangat aman untuk upload)

    // --- 2. LOAD CONFIG DARI ADMIN (LOGIKA SMART FINDER) ---
    useEffect(() => {
        const loadConfig = () => {
            const savedGallery = localStorage.getItem('PHOTOBOOTH_GALLERY');
            let activeTemplate = null;

            if (savedGallery) {
                try {
                    const gallery = JSON.parse(savedGallery);
                    
                    // Cari template yang ID-nya benar-benar cocok (String vs String)
                    activeTemplate = gallery.find(t => String(t.id) === String(templateId));

                    // Fallback: Jika tidak ketemu by ID, coba cari by Index
                    if (!activeTemplate && gallery[templateId]) {
                        activeTemplate = gallery[templateId];
                    }
                    
                    // Fallback: Jika galeri ada isinya tapi ID tidak ketemu, ambil yang pertama
                    if (!activeTemplate && gallery.length > 0) {
                        activeTemplate = gallery[0];
                    }
                } catch(e) { 
                    console.error("Config Load Error:", e); 
                }
            }

            // Fallback terakhir jika galeri kosong
            if (!activeTemplate) {
                activeTemplate = {
                    id: 'default',
                    image: defaultTemplateImg,
                    slots: [] 
                };
            }

            setTemplateConfig(activeTemplate);

            if (!hasStartedProcess.current && validPhotos.length > 0) {
                hasStartedProcess.current = true;
                // Beri jeda sedikit agar state stabil
                setTimeout(() => processAndUpload(activeTemplate), 500);
            }
        };

        const timer = setTimeout(loadConfig, 500);
        return () => clearTimeout(timer);
    }, [templateId, photos]);

    // --- 3. GIF LOGIC ---
    const [gifIndex, setGifIndex] = useState(0);
    useEffect(() => {
        if (validPhotos.length === 0) return;
        const interval = setInterval(() => {
            setGifIndex(prev => (prev + 1) % validPhotos.length);
        }, 500); 
        return () => clearInterval(interval);
    }, [validPhotos]);


    // ==========================================
    // GENERATORS (DIOPTIMALKAN UNTUK SIZE KECIL)
    // ==========================================

    const generateGifFile = (currentPhotos) => {
        return new Promise((resolve) => {
            const images = currentPhotos.map(p => p.src);
            if (images.length === 0) return resolve(null);
            // GIF Kecil (300px)
            gifshot.createGIF({
                images: images, interval: 0.5, gifWidth: 300, gifHeight: 225, numFrames: 6
            }, (obj) => resolve(!obj.error ? obj.image : null));
        });
    };

    const generateFrameFile = async (currentPhotos, cfg) => {
        return new Promise(async (resolve) => {
            try {
                const canvas = document.createElement('canvas');
                // Base Admin Canvas = 320x480.
                canvas.width = 320 * SCALE_FACTOR; 
                canvas.height = 480 * SCALE_FACTOR;
                const ctx = canvas.getContext('2d');
                
                // Background Putih
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const bgImg = new Image();
                bgImg.src = cfg ? cfg.image : defaultTemplateImg;
                await new Promise(r => bgImg.onload = r);

                const loadedPhotos = await Promise.all(currentPhotos.map(async (p) => {
                    const img = new Image(); img.src = p.src;
                    await new Promise(r => img.onload = r);
                    return img;
                }));

                const slots = cfg ? cfg.slots : [];
                
                loadedPhotos.forEach((img, i) => {
                    let x, y, w, h;

                    if (slots[i]) {
                        // LOGIKA ADMIN (POSISI AKURAT)
                        x = slots[i].x * SCALE_FACTOR;
                        y = slots[i].y * SCALE_FACTOR;
                        w = slots[i].width * SCALE_FACTOR;
                        h = slots[i].height * SCALE_FACTOR;
                    } else {
                        // FALLBACK GRID
                        const col = i % 2; 
                        const row = Math.floor(i / 2);
                        w = 140 * SCALE_FACTOR;
                        h = 100 * SCALE_FACTOR;
                        x = (20 * SCALE_FACTOR) + (col * (w + (10 * SCALE_FACTOR)));
                        y = (80 * SCALE_FACTOR) + (row * (h + (10 * SCALE_FACTOR)));
                    }

                    ctx.drawImage(img, x, y, w, h);
                });

                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                
                // PENTING: Gunakan JPEG 0.85 (Ukuran file turun 80% dibanding PNG)
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            } catch (err) { console.error(err); resolve(null); }
        });
    };

    const generateLiveVideoFile = async (currentPhotos, cfg) => {
        return new Promise(async (resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 320 * SCALE_FACTOR; 
                canvas.height = 480 * SCALE_FACTOR;
                const ctx = canvas.getContext('2d');

                const bgImg = new Image(); 
                bgImg.src = cfg ? cfg.image : defaultTemplateImg;
                await new Promise(r => bgImg.onload = r);

                const slots = cfg ? cfg.slots : [];

                const videoElements = await Promise.all(currentPhotos.map(async (p, i) => {
                    if (!p || !p.video) return null;
                    const v = document.createElement('video');
                    v.src = p.video; 
                    v.muted = true; v.playsInline = true; v.preload = "auto"; v.loop = true;
                    await v.play().then(() => { v.pause(); v.currentTime = 0; });
                    return { v, index: i };
                }));

                const stream = canvas.captureStream(VIDEO_FPS);
                
                // Kompresi Bitrate agar file kecil
                const recorder = new MediaRecorder(stream, { 
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: VIDEO_BITRATE 
                });
                
                const chunks = [];
                recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };

                let animationId;
                const draw = () => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    videoElements.forEach((item) => {
                        if (!item) return;
                        const { v, index } = item;
                        
                        let x, y, w, h;
                        if (slots[index]) {
                            x = slots[index].x * SCALE_FACTOR;
                            y = slots[index].y * SCALE_FACTOR;
                            w = slots[index].width * SCALE_FACTOR;
                            h = slots[index].height * SCALE_FACTOR;
                        } else {
                            const col = index % 2; const row = Math.floor(index / 2);
                            w = 140 * SCALE_FACTOR; h = 100 * SCALE_FACTOR;
                            x = (20 * SCALE_FACTOR) + (col * (w + (10 * SCALE_FACTOR)));
                            y = (80 * SCALE_FACTOR) + (row * (h + (10 * SCALE_FACTOR)));
                        }

                        ctx.drawImage(v, x, y, w, h);
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
                }, 6000); 

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        console.log("Video Size:", (reader.result.length/1024/1024).toFixed(2) + " MB");
                        resolve(reader.result);
                    };
                    reader.readAsDataURL(blob);
                };
            } catch (e) { resolve(null); }
        });
    };

    // --- 4. ORKESTRATOR UPLOAD ---
    const processAndUpload = async (activeConfig) => {
        setIsUploading(true);
        setLoadingText("Merender (Mode Ringan)...");

        try {
            const [liveVideo, gif, frame] = await Promise.all([
                generateLiveVideoFile(photos, activeConfig),
                generateGifFile(photos),
                generateFrameFile(photos, activeConfig)
            ]);

            setLoadingText("Mengupload ke Google Drive...");
            
            const payload = {
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
            console.error("Upload Error:", error);
            if (error.response && error.response.status === 413) {
                setLoadingText("Gagal: File Terlalu Besar (413).");
            } else {
                setLoadingText("Gagal Upload.");
            }
        } finally {
            setIsUploading(false);
        }
    };

    // --- HELPER STYLE UNTUK PREVIEW HTML DI LAYAR ---
    const getSlotStyle = (index) => {
        // Cek templateConfig agar aman
        if (!templateConfig || !templateConfig.slots[index]) {
            const col = index % 2;
            const row = Math.floor(index / 2);
            return {
                position: 'absolute',
                width: '140px', height: '100px',
                left: `${20 + (col * 150)}px`,
                top: `${80 + (row * 110)}px`
            };
        }

        const slot = templateConfig.slots[index];
        return {
            position: 'absolute',
            left: `${slot.x}px`,
            top: `${slot.y}px`,
            width: `${slot.width}px`,
            height: `${slot.height}px`,
        };
    };

    const getBgImage = () => {
        return templateConfig ? templateConfig.image : defaultTemplateImg;
    }

    const handleBackToHome = () => {
        Swal.fire({
            title: 'Kembali ke Menu Utama?',
            text: "Pastikan Anda sudah menyimpan/mendownload foto atau menscan QR Code. Sesi ini akan berakhir dan data foto akan dihapus.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981', // Hijau
            cancelButtonColor: '#6b7280',  // Abu-abu
            confirmButtonText: 'Ya, Saya Sudah Simpan',
            cancelButtonText: 'Belum, Kembali',
            background: '#1f292d',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                onHome(); 
            }
        });
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
                {/* HEADER */}
                <div className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-gray-500/50 pb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 drop-shadow-md">🎉 Hasil Photobooth Kamu</h1>
                    <button
                        onClick={handleBackToHome}
                        className="bg-gray-800/80 hover:bg-gray-700/80 text-white px-6 py-2 rounded-full font-bold shadow-lg transition transform active:scale-95"
                    >
                        Kembali ke halaman utama
                    </button>
                </div>

                {/* INFO BOX & QR CODE */}
                <div className="w-full max-w-6xl bg-gray-900/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2 text-blue-200">✨ Download Softfile Lengkap</h2>
                        <p className="text-gray-200 mb-4 font-medium">{isUploading ? loadingText : (downloadLink ? "Scan QR Code di samping:" : "Menunggu...")}</p>
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
                {templateConfig && (
                    <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
                        {/* 1. FOTO FRAME */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative group w-full flex justify-center shadow-xl h-fit">
                                <span className="absolute top-0 left-0 bg-blue-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">1. Foto Frame</span>
                                <div className="relative bg-white shadow-xl overflow-hidden" style={{ width: '240px', height: '360px' }}>
                                    <div className="absolute top-0 left-0 w-[320px] h-[480px] origin-top-left transform scale-[0.75]">
                                        
                                        {/* Render Foto sesuai Koordinat Admin */}
                                        {photos.map((p, i) => (
                                            <div key={i} className="absolute overflow-hidden bg-gray-200" 
                                                 style={getSlotStyle(i)}>
                                                {p && <img src={p.src} className="w-full h-full object-cover" style={filterStyle} alt="" />}
                                            </div>
                                        ))}

                                        {/* Overlay Template */}
                                        <img src={getBgImage()} className="absolute inset-0 w-full h-full z-10 pointer-events-none" alt="Frame" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. FOTO MENTAHAN */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full h-[400px] flex items-center justify-center shadow-xl">
                                <span className="absolute top-0 left-0 bg-gray-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 shadow-md">2. Foto Mentahan</span>
                                <div className="relative w-[180px] h-[120px]">
                                    {validPhotos.slice(0, 3).map((p, i) => (
                                        <img key={i} src={p.src} className="absolute w-full h-full object-cover border-4 border-white shadow-2xl rounded" 
                                             style={{ top: i*20, left: i*15, transform: `rotate(${i*8-8}deg)`, zIndex: i, ...filterStyle }} alt="Raw" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. LIVE FRAME */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-500/50 relative w-full flex justify-center shadow-xl h-fit">
                                <span className="absolute top-0 left-0 bg-red-600 px-3 py-1 text-xs font-bold rounded-tl-xl rounded-br-xl text-white z-20 animate-pulse shadow-md">3. Live Frame</span>
                                <div className="relative bg-black shadow-xl overflow-hidden" style={{ width: '240px', height: '360px' }}>
                                    <div className="absolute top-0 left-0 w-[320px] h-[480px] origin-top-left transform scale-[0.75]">
                                        {photos.map((p, i) => (
                                            <div key={i} className="absolute overflow-hidden bg-gray-900" style={getSlotStyle(i)}>
                                                {p?.video ? (
                                                    <video src={p.video} autoPlay loop muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" style={filterStyle} />
                                                ) : p ? (
                                                    <img src={p.src} className="w-full h-full object-cover" style={filterStyle} alt="" />
                                                ) : null}
                                            </div>
                                        ))}
                                        <img src={getBgImage()} className="absolute inset-0 w-full h-full z-10 pointer-events-none" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. GIF LOOP */}
                        <div className="flex flex-col items-center gap-4">
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default HasilPengguna;