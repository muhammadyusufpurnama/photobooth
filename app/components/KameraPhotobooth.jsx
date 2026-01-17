'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
// Asumsi GifRecorder tetap ada, meski logika utamanya kita ganti ke Live Photo
// import GifRecorder from './GifRecorder.jsx'; 

// --- DATA TEMPLATE ---
const availableTemplates = [
    { id: 1, name: 'Template 1', image: '/images/templates/template1.png' },
    { id: 2, name: 'Template 2', image: '/images/templates/template2.png' },
];

const KameraPhotobooth = ({ onBack, onFinish }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    
    // Refs untuk Perekaman Video
    const mediaRecorderRef = useRef(null);
    const videoChunksRef = useRef([]);

    const [timeLeft, setTimeLeft] = useState(300); 

    // State Kamera
    const [facingMode, setFacingMode] = useState('environment');
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');

    // State Capture
    // PENTING: photos sekarang array of OBJECT: { src: dataUrl, video: blobUrl }
    const [photos, setPhotos] = useState(Array(6).fill(null));
    const [currentSlot, setCurrentSlot] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // --- STATE TEMPLATE ---
    const [selectedTemplate, setSelectedTemplate] = useState(1);
    
    // Config Layout
    const [layoutStyle, setLayoutStyle] = useState({
        width: '135px', height: '100px', top: '80px', left: '20px', 
        columnGap: '10px', rowGap: '10px', borderRadius: '0px'
    });

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (timeLeft <= 0) { onFinish(photos, selectedTemplate); return; }
        const timerInterval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
        return () => clearInterval(timerInterval);
    }, [timeLeft, onFinish, photos, selectedTemplate]);

    useEffect(() => {
        const loadLayout = () => {
            const savedLayouts = localStorage.getItem('PHOTOBOOTH_LAYOUTS');
            if (savedLayouts) {
                try {
                    const allConfigs = JSON.parse(savedLayouts);
                    const config = allConfigs[selectedTemplate] || allConfigs[1]; 
                    if (config) {
                        setLayoutStyle({
                            width: `${config.photoWidth}px`, height: `${config.photoHeight}px`,
                            top: `${config.marginTop}px`, left: `${config.marginLeft}px`,
                            columnGap: `${config.gapX}px`, rowGap: `${config.gapY}px`,
                            borderRadius: `${config.borderRadius}px`
                        });
                    }
                } catch (e) { console.error(e); }
            }
        };
        loadLayout();
    }, [selectedTemplate]);

    const stopCamera = () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false; }); streamRef.current = null; }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startCamera = useCallback(async (deviceId = null) => {
        stopCamera();
        let targetDeviceId = deviceId || localStorage.getItem('PHOTOBOOTH_CAMERA_ID');
        const constraints = {
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 }, 
                deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined, 
                facingMode: targetDeviceId ? undefined : facingMode 
            },
            audio: false // Kita matikan audio agar tidak feedback/bising
        };
        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                streamRef.current = newStream;
                videoRef.current.onloadedmetadata = async () => { try { await videoRef.current.play(); } catch (e) {} };
            }
            const tracks = newStream.getVideoTracks();
            if (tracks.length > 0) setSelectedCameraId(tracks[0].getSettings().deviceId);
        } catch (err) { if (targetDeviceId) startCamera(null); }
    }, [facingMode]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(d => setAvailableCameras(d.filter(x => x.kind === 'videoinput')));
        startCamera();
        return () => stopCamera();
    }, []);

    const handleCameraChange = (e) => { setSelectedCameraId(e.target.value); startCamera(e.target.value); };

    // Update function untuk menyimpan foto dan video
    const addPhotoToSlot = (imgDataUrl, videoBlobUrl) => {
        if (currentSlot < photos.length) {
            const newPhotos = [...photos];
            // Simpan sebagai object
            newPhotos[currentSlot] = { src: imgDataUrl, video: videoBlobUrl };
            setPhotos(newPhotos);
            setCurrentSlot(currentSlot + 1);
        }
        setIsCapturing(false);
    };

    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Mirror Image (Flip Horizontal)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
    }, []);

    // --- LOGIKA LIVE PHOTO RECORDING ---
    const startLiveRecording = () => {
        if (!streamRef.current) return;
        videoChunksRef.current = [];
        try {
            // Coba codec yang umum, fallback ke default
            const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
                ? { mimeType: 'video/webm;codecs=vp8' } 
                : undefined;
            
            mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    videoChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.start();
        } catch (e) {
            console.error("Gagal start recording:", e);
        }
    };

    const stopLiveRecording = () => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                    const videoUrl = URL.createObjectURL(blob);
                    resolve(videoUrl);
                };
                mediaRecorderRef.current.stop();
            } else {
                resolve(null);
            }
        });
    };

    const handleCapture = async () => {
        if (isCapturing || currentSlot >= photos.length) return;
        
        setIsCapturing(true); 
        setCountdown(5); // Timer 5 detik

        // 1. Mulai Rekam Video (Untuk Live Photo)
        startLiveRecording();

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    
                    // 2. Stop Rekam & Ambil Foto Statis
                    stopLiveRecording().then((videoUrl) => {
                        const photoUrl = captureFrame();
                        if (photoUrl) {
                            addPhotoToSlot(photoUrl, videoUrl);
                        } else {
                            setIsCapturing(false);
                        }
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleUndoLast = () => { 
        if (currentSlot > 0) {
            const newPhotos = [...photos];
            // Bersihkan URL object agar memory tidak bocor
            if (newPhotos[currentSlot - 1]?.video) {
                URL.revokeObjectURL(newPhotos[currentSlot - 1].video);
            }
            newPhotos[currentSlot - 1] = null; 
            setPhotos(newPhotos);
            setCurrentSlot(currentSlot - 1); 
            setIsCapturing(false); 
            setCountdown(0); 
        }
    };

    return (
        <div className="h-screen w-full bg-gray-900 overflow-hidden relative text-white" 
             style={{
                backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>
            
            {/* HEADER */}
            <div className="absolute top-0 left-0 w-full h-12 flex items-center justify-between px-3 z-20 pointer-events-none">
                <button onClick={onBack} className="pointer-events-auto px-4 py-1 rounded-full bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition text-xs">
                    Kembali
                </button>
                <div className={`
                    pointer-events-auto px-4 py-1 rounded-full font-mono text-base font-bold shadow-md border-2 transition-colors duration-500 flex items-center gap-2
                    ${timeLeft <= 30 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-gray-900/90 border-blue-500 text-blue-100'}
                `}>
                    <span>⏱</span><span>{formatTime(timeLeft)}</span>
                </div>
                <div className="w-[70px]"></div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="flex flex-row h-full w-full pt-14 pb-2 px-3 gap-2 items-stretch">
                
                {/* 1. PANEL KIRI: KAMERA */}
                <div className="flex-[2] bg-black rounded-lg shadow-xl relative border-2 border-gray-800 overflow-hidden group">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" style={{ transform: 'scaleX(-1)' }}></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {isCapturing && countdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                            <span className="text-8xl font-bold animate-ping text-white">{countdown}</span>
                            <span className="absolute bottom-10 text-white animate-pulse">Merekam Live Photo...</span>
                        </div>
                    )}

                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {availableCameras.length > 0 && <select value={selectedCameraId} onChange={handleCameraChange} className="bg-gray-800/90 text-white p-1 rounded border border-gray-500 text-xs max-w-[100px] truncate" disabled={isCapturing}>{availableCameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Kamera ${i+1}`}</option>)}</select>}
                    </div>
                </div>

                {/* 2. PANEL KANAN */}
                <div className="flex-1 flex flex-col justify-between min-w-[320px] max-w-[380px]">
                    
                    {/* PREVIEW + TEMPLATE */}
                    <div className="flex-1 flex flex-row gap-1 items-center justify-center bg-white/5 rounded-lg border border-white/10 p-1 overflow-hidden relative">
                        <div className="flex-1 h-full flex items-center justify-center">
                            <div className="relative bg-transparent shadow-xl ring-2 ring-gray-800 rounded-sm transform scale-[0.85] origin-center"
                                 style={{ width: '320px', height: '480px', flexShrink: 0 }}>
                                
                                <div className="absolute grid grid-cols-2 grid-rows-3 z-0"
                                     style={{ top: layoutStyle.top, left: layoutStyle.left, columnGap: layoutStyle.columnGap, rowGap: layoutStyle.rowGap }}>
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative bg-gray-800 overflow-hidden"
                                             style={{ width: layoutStyle.width, height: layoutStyle.height, borderRadius: layoutStyle.borderRadius }}>
                                            {photo ? (
                                                <img src={photo.src} alt={`Slot ${index}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-gray-600 bg-gray-900 text-[10px] font-mono border border-gray-700 ${index === currentSlot ? 'bg-gray-800 text-yellow-500 animate-pulse border-yellow-500' : ''}`}>
                                                    {index === currentSlot ? '...' : index + 1}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <img src={availableTemplates.find(t => t.id === selectedTemplate)?.image || availableTemplates[0].image} 
                                     alt="Active Frame" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                            </div>
                        </div>

                        {/* LIST TEMPLATE */}
                        <div className="w-[70px] h-full flex flex-col bg-black/40 backdrop-blur-md rounded-r-lg border-l border-white/10">
                            <p className="text-[8px] text-gray-400 py-1 text-center font-bold uppercase tracking-wider bg-black/20">Template</p>
                            <div className="flex-1 overflow-y-auto px-1 pb-2 custom-scrollbar flex flex-col gap-2 items-center pt-2">
                                {availableTemplates.map((tpl) => (
                                    <div key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)}
                                         className={`w-12 h-12 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 relative ${selectedTemplate === tpl.id ? 'border-blue-500 ring-1 ring-blue-500/50 scale-105 z-10' : 'border-gray-600 hover:border-gray-400 opacity-60 hover:opacity-100'}`}>
                                        <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                                        {selectedTemplate === tpl.id && <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"><span className="text-white text-xs font-bold shadow-sm">✓</span></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="mt-1 flex flex-col gap-1.5">
                        <button onClick={handleCapture} disabled={isCapturing || currentSlot >= photos.length} 
                            className={`w-full py-2 rounded-lg font-bold text-sm shadow-md transition transform active:scale-95 ${isCapturing || currentSlot >= photos.length ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                            {isCapturing ? 'Merekam Live (5s)...' : currentSlot >= photos.length ? 'Penuh' : `AMBIL FOTO (${currentSlot + 1}/6)`}
                        </button>
                        <div className="flex gap-1.5">
                            <button onClick={handleUndoLast} disabled={isCapturing || currentSlot === 0} 
                                className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${currentSlot === 0 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-700 text-gray-300 hover:bg-red-600/80 hover:text-white'}`}>
                                Ulang Foto
                            </button>
                            <button onClick={() => onFinish(photos, selectedTemplate)} disabled={currentSlot < photos.length} 
                                className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${currentSlot === photos.length ? 'bg-green-600 text-white hover:bg-green-500 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                                Selesai
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default KameraPhotobooth;