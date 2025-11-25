import React, { useRef, useEffect, useState, useCallback } from 'react';
import PhotoPreview from './PhotoPreview.jsx';
import GifRecorder from './GifRecorder.jsx';

const KameraPhotobooth = ({ onBack, onFinish }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // State Kamera
    const [facingMode, setFacingMode] = useState('environment');
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');

    // State Capture
    const [captureMode, setCaptureMode] = useState('photo');
    const [photos, setPhotos] = useState(Array(6).fill(null));
    const [currentSlot, setCurrentSlot] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isRecordingGif, setIsRecordingGif] = useState(false);

    // --- STATE TEMPLATE & LAYOUT ---
    const [selectedTemplate, setSelectedTemplate] = useState(1);

    const [layoutStyle, setLayoutStyle] = useState({
        width: '135px',
        height: '100px',
        top: '80px',
        left: '20px',
        columnGap: '10px',
        rowGap: '10px',
        borderRadius: '0px'
    });

    // LOAD CONFIG DARI ADMIN
    useEffect(() => {
        const loadLayout = () => {
            const savedLayouts = localStorage.getItem('PHOTOBOOTH_LAYOUTS');
            if (savedLayouts) {
                try {
                    const allConfigs = JSON.parse(savedLayouts);
                    const config = allConfigs[selectedTemplate];

                    if (config) {
                        setLayoutStyle({
                            width: `${config.photoWidth}px`,
                            height: `${config.photoHeight}px`,
                            top: `${config.marginTop}px`,
                            left: `${config.marginLeft}px`,
                            columnGap: `${config.gapX}px`,
                            rowGap: `${config.gapY}px`,
                            borderRadius: `${config.borderRadius}px`
                        });
                    }
                } catch (e) { console.error(e); }
            }
        };
        loadLayout();
    }, [selectedTemplate]);

    const gifFramesRef = useRef([]);
    const { recordGif } = GifRecorder({
        onGifReady: (gifBlob) => {
            const gifUrl = URL.createObjectURL(gifBlob);
            addPhotoToSlot(gifUrl, 'gif');
            setIsCapturing(false);
            setIsRecordingGif(false);
            gifFramesRef.current = [];
        }
    });

    // --- KAMERA CONTROLLER ---
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
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined, facingMode: targetDeviceId ? undefined : facingMode },
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
        } catch (err) { if (targetDeviceId) startCamera(null); }
    }, [facingMode]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(d => setAvailableCameras(d.filter(x => x.kind === 'videoinput')));
        startCamera();
        return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCameraChange = (e) => { setSelectedCameraId(e.target.value); startCamera(e.target.value); };

    const addPhotoToSlot = (dataUrl, type) => {
        if (currentSlot < photos.length) {
            const newPhotos = [...photos];
            newPhotos[currentSlot] = { src: dataUrl, type: type };
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
        // ctx.translate(canvas.width, 0); ctx.scale(-1, 1); // Mirror jika perlu
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
    }, []);

    const handleCapture = async () => {
        if (isCapturing || currentSlot >= photos.length) return;
        setIsCapturing(true); setCountdown(3);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    if (captureMode === 'photo') {
                        const photoUrl = captureFrame();
                        if (photoUrl) addPhotoToSlot(photoUrl, 'photo'); else setIsCapturing(false);
                        return 0;
                    } else if (captureMode === 'gif') {
                        setIsRecordingGif(true); let frameCount = 0; gifFramesRef.current = [];
                        const interval = setInterval(() => {
                            if (!videoRef.current) return;
                            const c = document.createElement('canvas');
                            c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
                            const ctx = c.getContext('2d');
                            // ctx.translate(c.width, 0); ctx.scale(-1, 1); // Mirror GIF
                            ctx.drawImage(videoRef.current, 0, 0, c.width, c.height);
                            gifFramesRef.current.push(c); frameCount++;
                            if (frameCount >= 30) { clearInterval(interval); setIsRecordingGif(false); recordGif(gifFramesRef.current, 100); }
                        }, 100);
                        return 0;
                    }
                } return prev - 1;
            });
        }, 1000);
    };

    const handleRetake = () => { setPhotos(Array(6).fill(null)); setCurrentSlot(0); setIsCapturing(false); setCountdown(0); };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-5 text-white relative">
            <button onClick={onBack} className="absolute top-5 left-5 px-5 py-2 rounded-full bg-red-500 text-white z-10 font-bold shadow-lg hover:bg-red-600 transition">
                Kembali
            </button>

            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl h-[85vh]">
                {/* PANEL KIRI: KAMERA */}
                <div className="flex-[2] bg-black p-2 rounded-xl shadow-2xl relative flex flex-col items-center justify-center border-4 border-gray-800 overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain rounded-lg" style={{ transform: 'scaleX(1)' }}></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {isCapturing && countdown > 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"><span className="text-9xl font-bold animate-ping">{countdown}</span></div>}
                    {isCapturing && isRecordingGif && <div className="absolute inset-0 flex items-center justify-center z-20 border-[10px] border-red-600/50 animate-pulse rounded-lg"><span className="bg-red-600 px-4 py-2 rounded text-xl font-bold">🔴 MEREKAM...</span></div>}

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 z-30">
                        <select value={captureMode} onChange={(e) => { setCaptureMode(e.target.value); handleRetake(); }} className="bg-gray-800/90 text-white p-2 rounded-lg border border-gray-500 backdrop-blur-md font-bold" disabled={isCapturing}>
                            <option value="photo">📷 Mode Foto</option> <option value="gif">🎞️ Mode GIF</option>
                        </select>
                        {availableCameras.length > 0 && <select value={selectedCameraId} onChange={handleCameraChange} className="bg-gray-800/90 text-white p-2 rounded-lg border border-gray-500 backdrop-blur-md max-w-[200px] truncate font-medium" disabled={isCapturing}>{availableCameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Kamera ${i+1}`}</option>)}</select>}
                    </div>
                </div>

                {/* PANEL KANAN: TEMPLATE & PREVIEW */}
                {/* PERBAIKAN DI SINI: Menghapus bg-gray-800 dan membuatnya lebih bersih */}
                <div className="flex-1 flex flex-col justify-center items-center min-w-[350px] p-4">

                    <div className="flex justify-center gap-2 mb-6">
                        <button onClick={() => setSelectedTemplate(1)} className={`px-4 py-2 text-xs rounded-full font-bold transition ${selectedTemplate === 1 ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400'}`}>Template 1</button>
                        <button onClick={() => setSelectedTemplate(2)} className={`px-4 py-2 text-xs rounded-full font-bold transition ${selectedTemplate === 2 ? 'bg-pink-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400'}`}>Template 2</button>
                    </div>

                    {/* CONTAINER TEMPLATE (Transparan, tanpa border putih) */}
                    <div className="relative bg-transparent overflow-hidden shadow-2xl ring-4 ring-gray-800 rounded-lg"
                         style={{ width: '320px', height: '480px', flexShrink: 0 }}
                    >
                        {/* GRID FOTO */}
                        <div
                            className="absolute grid grid-cols-2 grid-rows-3 z-0"
                            style={{
                                top: layoutStyle.top,
                                left: layoutStyle.left,
                                columnGap: layoutStyle.columnGap,
                                rowGap: layoutStyle.rowGap,
                            }}
                        >
                            {photos.map((photo, index) => (
                                <div
                                    key={index}
                                    className="relative bg-gray-800 overflow-hidden"
                                    style={{
                                        width: layoutStyle.width,
                                        height: layoutStyle.height,
                                        borderRadius: layoutStyle.borderRadius
                                    }}
                                >
                                    {photo ? (
                                        <img src={photo.src} alt={`Slot ${index}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-gray-600 bg-gray-900 text-xs font-mono border border-gray-700 ${index === currentSlot ? 'bg-gray-800 text-yellow-500 animate-pulse border-yellow-500' : ''}`}>
                                            {index === currentSlot ? 'FOTO...' : index + 1}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* TEMPLATE OVERLAY */}
                        <img
                            src={selectedTemplate === 1 ? '/images/templates/template1.png' : '/images/templates/template2.png'}
                            alt="Template Frame"
                            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                        />
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="mt-8 w-full max-w-[320px] flex flex-col gap-3">
                        <button onClick={handleCapture} disabled={isCapturing || currentSlot >= photos.length} className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition transform active:scale-95 ${isCapturing || currentSlot >= photos.length ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'}`}>
                            {isCapturing ? 'Memproses...' : currentSlot >= photos.length ? 'Slot Penuh' : `AMBIL FOTO (${currentSlot + 1}/6)`}
                        </button>
                        <div className="flex gap-3">
                            <button onClick={handleRetake} disabled={isCapturing} className="flex-1 py-3 rounded-xl font-bold bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-600 hover:text-white transition">Reset</button>
                            <button
                                // PERBAIKAN: Kirim photos DAN selectedTemplate
                                onClick={() => onFinish(photos, selectedTemplate)}
                                disabled={currentSlot < photos.length}
                                className={`flex-1 py-3 rounded-xl font-bold transition ${currentSlot === photos.length ? 'bg-green-600 text-white hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                            >
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
