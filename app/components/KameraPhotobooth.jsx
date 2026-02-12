'use client';

import Swal from 'sweetalert2';
import React, { useRef, useEffect, useState, useCallback } from 'react';

const KameraPhotobooth = ({ onBack, onFinish }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    
    const mediaRecorderRef = useRef(null);
    const videoChunksRef = useRef([]);

    const [timeLeft, setTimeLeft] = useState(300); 

    // State Kamera
    const [facingMode, setFacingMode] = useState('environment');
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');

    // --- STATE GALERI & TEMPLATE ---
    const [templateGallery, setTemplateGallery] = useState([]);
    const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
    const [slots, setSlots] = useState([]); 
    const [bgImage, setBgImage] = useState('/images/templates/template1.png');

    // State Capture
    const [photos, setPhotos] = useState([]); 
    const [currentSlot, setCurrentSlot] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // --- 1. LOAD DATA DARI GALERI ADMIN ---
    useEffect(() => {
        const savedGallery = localStorage.getItem('PHOTOBOOTH_GALLERY');
        if (savedGallery) {
            try {
                const parsedGallery = JSON.parse(savedGallery);
                setTemplateGallery(parsedGallery);
                
                // Set template pertama secara default jika ada data
                if (parsedGallery.length > 0) {
                    applyTemplate(parsedGallery[0], 0);
                }
            } catch (e) {
                console.error("Gagal load galeri:", e);
                loadFallbackSettings();
            }
        } else {
            loadFallbackSettings();
        }
    }, []);

    const loadFallbackSettings = () => {
        const defaultSlots = [
            { id: 1, x: 20, y: 80, width: 135, height: 100 },
            { id: 2, x: 165, y: 80, width: 135, height: 100 }
        ];
        setSlots(defaultSlots);
        setPhotos(Array(2).fill(null));
    };

    // Fungsi untuk berganti template (Reset foto jika ganti di tengah jalan)
    const applyTemplate = (template, index) => {
        // Jika sudah ada minimal 1 foto yang diambil
        if (currentSlot > 0) {
            Swal.fire({
                title: 'Ganti Template?',
                text: "Foto yang sudah diambil akan terhapus (reset) jika Anda mengganti template.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Ganti',
                cancelButtonText: 'Batal',
                background: '#1f2937', // Warna dark mode agar sesuai UI
                color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eksekusi ganti template jika user setuju
                    executeApplyTemplate(template, index);
                }
            });
        } else {
            // Jika belum ada foto, langsung ganti tanpa peringatan
            executeApplyTemplate(template, index);
        }
    };

    // Fungsi pembantu untuk mengeksekusi perubahan template
    const executeApplyTemplate = (template, index) => {
        setBgImage(template.image);
        const sortedSlots = [...template.slots].sort((a, b) => a.id - b.id);
        setSlots(sortedSlots);
        setPhotos(Array(sortedSlots.length).fill(null));
        setCurrentSlot(0);
        setActiveTemplateIndex(index);
    };

    const [hasWarnedTime, setHasWarnedTime] = useState(false);

    // Timer Mundur
    useEffect(() => {
        if (timeLeft <= 0) { 
            onFinish(photos, 1); 
            return; 
        }

        // Cek jika waktu tepat 60 detik dan belum pernah memberi peringatan
        if (timeLeft === 60 && !hasWarnedTime) {
            setHasWarnedTime(true); // Set agar tidak muncul berulang kali
            
            Swal.fire({
                title: 'Waktu Hampir Habis!',
                text: 'Sisa waktu Anda tinggal 1 menit lagi.',
                icon: 'warning',
                timer: 4000, // Hilang otomatis dalam 4 detik
                timerProgressBar: true,
                showConfirmButton: false,
                toast: true, // Menggunakan mode toast agar tidak menghalangi layar utama
                position: 'top-end', // Muncul di pojok kanan atas
                background: '#1f2937',
                color: '#fff'
            });
        }

        const timerInterval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
        return () => clearInterval(timerInterval);
    }, [timeLeft, onFinish, photos, hasWarnedTime]);

    // --- KAMERA LOGIC ---
    const stopCamera = () => {
        if (streamRef.current) { 
            streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false; }); 
            streamRef.current = null; 
        }
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
            audio: false 
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
        } catch (err) { 
            console.error("Camera Error:", err);
            if (targetDeviceId) startCamera(null); 
        }
    }, [facingMode]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(d => setAvailableCameras(d.filter(x => x.kind === 'videoinput')));
        startCamera();
        return () => stopCamera();
    }, []);

    // --- CAPTURE LOGIC ---
    const addPhotoToSlot = (imgDataUrl, videoBlobUrl) => {
        if (currentSlot < photos.length) {
            const newPhotos = [...photos];
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
        
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
    }, []);

    const startLiveRecording = () => {
        if (!streamRef.current) return;
        videoChunksRef.current = [];
        try {
            const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
                ? { mimeType: 'video/webm;codecs=vp8' } : undefined;
            mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
            mediaRecorderRef.current.start();
        } catch (e) { console.error("Rec Error:", e); }
    };

    const stopLiveRecording = () => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                    resolve(URL.createObjectURL(blob));
                };
                mediaRecorderRef.current.stop();
            } else resolve(null);
        });
    };

    const handleCapture = async () => {
        if (isCapturing || currentSlot >= photos.length) return;
        setIsCapturing(true); 
        setCountdown(5); 
        startLiveRecording();

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    stopLiveRecording().then((videoUrl) => {
                        const photoUrl = captureFrame();
                        if (photoUrl) addPhotoToSlot(photoUrl, videoUrl);
                        else setIsCapturing(false);
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
            if (newPhotos[currentSlot - 1]?.video) URL.revokeObjectURL(newPhotos[currentSlot - 1].video);
            newPhotos[currentSlot - 1] = null; 
            setPhotos(newPhotos);
            setCurrentSlot(currentSlot - 1); 
            setIsCapturing(false); 
            setCountdown(0); 
        }
    };

    const handleExitConfirmation = () => {
        Swal.fire({
            title: 'Keluar dari Sesi Foto?',
            text: "Semua foto yang sudah diambil akan terhapus.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // Merah
            cancelButtonColor: '#6b7280',  // Abu-abu
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Tetap di Sini',
            background: '#1f2937',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                stopCamera(); // Pastikan kamera dimatikan sebelum keluar
                onBack();     // Panggil fungsi kembali ke halaman sebelumnya
            }
        });
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
                <button 
                    onClick={handleExitConfirmation} // Ubah dari onBack menjadi handleExitConfirmation
                    className="pointer-events-auto px-4 py-1 rounded-full bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition text-xs"
                >
                    Kembali
                </button>
                <div className={`pointer-events-auto px-4 py-1 rounded-full font-mono text-base font-bold shadow-md border-2 transition-colors duration-500 flex items-center gap-2 ${timeLeft <= 30 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-gray-900/90 border-blue-500 text-blue-100'}`}>
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
                </div>

                {/* 2. PANEL KANAN: LIVE PREVIEW & SELECTION */}
                <div className="flex-1 flex flex-col justify-between min-w-[320px] max-w-[380px]">
                    
                    {/* --- AREA SCROLL TEMPLATE --- */}
                    <div className="mb-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Pilih Template</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar scroll-smooth">
                            {templateGallery.map((temp, idx) => (
                                <button 
                                    key={temp.id}
                                    onClick={() => applyTemplate(temp, idx)}
                                    className={`flex-shrink-0 w-14 h-20 rounded-md border-2 transition-all duration-300 overflow-hidden shadow-lg ${activeTemplateIndex === idx ? 'border-blue-500 scale-105 ring-2 ring-blue-500/30' : 'border-gray-700 opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={temp.image} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-row gap-1 items-center justify-center bg-white/5 rounded-lg border border-white/10 p-1 overflow-hidden relative">
                        <div className="flex-1 h-full flex items-center justify-center">
                            <div className="relative bg-transparent shadow-xl ring-2 ring-gray-800 rounded-sm transform scale-[0.82] origin-center"
                                 style={{ width: '320px', height: '480px', flexShrink: 0 }}>
                                
                                {slots.map((slot, index) => {
                                    const photo = photos[index];
                                    return (
                                        <div 
                                            key={slot.id} 
                                            className="absolute overflow-hidden bg-gray-800 border border-gray-600/50"
                                            style={{
                                                left: `${slot.x}px`, top: `${slot.y}px`,
                                                width: `${slot.width}px`, height: `${slot.height}px`,
                                            }}
                                        >
                                            {photo ? (
                                                <img src={photo.src} alt={`Slot ${index}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-gray-500 bg-gray-900 text-[10px] font-mono ${index === currentSlot ? 'bg-gray-800 text-yellow-500 animate-pulse border-2 border-yellow-500' : ''}`}>
                                                    {index === currentSlot ? '...' : index + 1}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <img src={bgImage} alt="Template Overlay" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="mt-1 flex flex-col gap-1.5">
                        <button onClick={handleCapture} disabled={isCapturing || currentSlot >= photos.length} 
                            className={`w-full py-2 rounded-lg font-bold text-sm shadow-md transition transform active:scale-95 ${isCapturing || currentSlot >= photos.length ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                            {isCapturing ? 'Merekam Live (5s)...' : currentSlot >= photos.length ? 'Penuh' : `AMBIL FOTO (${currentSlot + 1}/${photos.length})`}
                        </button>
                        <div className="flex gap-1.5">
                            <button onClick={handleUndoLast} disabled={isCapturing || currentSlot === 0} 
                                className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${currentSlot === 0 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-700 text-gray-300 hover:bg-red-600/80 hover:text-white'}`}>
                                Ulang Foto
                            </button>
                            <button onClick={() => onFinish(photos, templateGallery[activeTemplateIndex].id)} 
                                disabled={currentSlot < photos.length} 
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