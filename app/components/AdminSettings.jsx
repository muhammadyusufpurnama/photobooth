'use client';

import React, { useState, useEffect, useRef } from 'react';

const AdminSettings = ({ onBack }) => {
    // --- STATE KAMERA ---
    const [cameras, setCameras] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // --- STATE CONFIG MULTI-TEMPLATE ---
    const [selectedTemplate, setSelectedTemplate] = useState(1);

    // Default value awal (jika belum ada save)
    const defaultConfig = {
        photoWidth: 140,   // Lebar Foto
        photoHeight: 100,  // Tinggi Foto
        marginTop: 80,     // Posisi Y (Atas/Bawah)
        marginLeft: 20,    // Posisi X (Kiri/Kanan)
        gapX: 10,          // Jarak antar kolom
        gapY: 10,          // Jarak antar baris
        borderRadius: 0    // Kelengkungan
    };

    // Menyimpan config untuk SEMUA template (1 dan 2)
    const [allLayouts, setAllLayouts] = useState({
        1: { ...defaultConfig },
        2: { ...defaultConfig }
    });

    // Shortcut: Config untuk template yang sedang dipilih saat ini
    const currentConfig = allLayouts[selectedTemplate] || defaultConfig;

    // 1. Init: Scan Kamera & Load Config dari LocalStorage
    useEffect(() => {
        const init = async () => {
            try {
                // Minta izin kamera sebentar untuk dapat label
                await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInput = devices.filter(d => d.kind === 'videoinput');
                setCameras(videoInput);

                // Load Kamera Tersimpan
                const savedId = localStorage.getItem('PHOTOBOOTH_CAMERA_ID');
                if (savedId) setSelectedDeviceId(savedId);
                else if (videoInput.length > 0) setSelectedDeviceId(videoInput[0].deviceId);

                // Load Layout Config Tersimpan
                const savedLayouts = localStorage.getItem('PHOTOBOOTH_LAYOUTS');
                if (savedLayouts) {
                    // Merge dengan default agar jika ada key baru tidak error
                    const parsed = JSON.parse(savedLayouts);
                    setAllLayouts(prev => ({ ...prev, ...parsed }));
                }
            } catch (err) {
                console.error("Error init admin:", err);
            }
        };
        init();
    }, []);

    // 2. Preview Kamera Live (Hanya untuk slot 1 di simulator)
    useEffect(() => {
        const startPreview = async () => {
            if (!selectedDeviceId) return;
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedDeviceId }, width: 640, height: 480 }
                });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (e) { console.error("Preview error:", e); }
        };
        startPreview();
        return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
    }, [selectedDeviceId]);

    // 3. Fungsi Update Config (Spesifik untuk template aktif)
    const updateConfig = (key, value) => {
        setAllLayouts(prev => ({
            ...prev,
            [selectedTemplate]: {
                ...prev[selectedTemplate],
                [key]: parseInt(value) || 0
            }
        }));
    };

    // Helper untuk Tombol Panah (Nudge)
    const nudge = (key, amount) => {
        updateConfig(key, currentConfig[key] + amount);
    };

    // 4. Simpan Semua ke LocalStorage
    const handleSave = () => {
        localStorage.setItem('PHOTOBOOTH_CAMERA_ID', selectedDeviceId);
        localStorage.setItem('PHOTOBOOTH_LAYOUTS', JSON.stringify(allLayouts));
        alert(`✅ Pengaturan Tersimpan untuk Template ${selectedTemplate} (dan lainnya)!`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-7xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col lg:flex-row min-h-[650px]">

                {/* --- KOLOM KIRI: KONTROL & EDITOR --- */}
                <div className="flex-1 p-6 border-r border-gray-700 flex flex-col gap-6 overflow-y-auto max-h-[90vh]">

                    {/* Header Panel */}
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                        <h1 className="text-2xl font-bold text-blue-400">⚙️ Admin Panel</h1>
                        <button onClick={onBack} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm border border-gray-600">
                            Kembali
                        </button>
                    </div>

                    {/* 1. Pilih Kamera */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-600">
                        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2 block">Sumber Kamera:</label>
                        <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-500 p-2 rounded text-white focus:border-blue-500 outline-none"
                        >
                            {cameras.map((cam, i) => (
                                <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Kamera ${i + 1}`}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Editor Kalibrasi */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-600 flex-1 flex flex-col gap-5">
                        <div className="flex justify-between items-center bg-gray-800 p-2 rounded-lg">
                            <h3 className="text-yellow-400 font-bold text-sm">🎚️ Kalibrasi Posisi Foto</h3>
                            <div className="text-[10px] text-gray-400">
                                Template Aktif: <span className="text-white font-bold">#{selectedTemplate}</span>
                            </div>
                        </div>

                        {/* KONTROL D-PAD (Geser Grid) */}
                        <div className="flex flex-col items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <label className="text-[10px] text-gray-400 mb-2 font-bold uppercase">GESER POSISI GRID (ATAS/BAWAH/KIRI/KANAN)</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div></div>
                                <button onClick={() => nudge('marginTop', -5)} className="w-10 h-10 bg-blue-600 rounded hover:bg-blue-500 active:scale-95 flex items-center justify-center font-bold shadow-lg">⬆️</button>
                                <div></div>

                                <button onClick={() => nudge('marginLeft', -5)} className="w-10 h-10 bg-blue-600 rounded hover:bg-blue-500 active:scale-95 flex items-center justify-center font-bold shadow-lg">⬅️</button>
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded text-[10px] text-gray-400 cursor-default border border-gray-600">GESER</div>
                                <button onClick={() => nudge('marginLeft', 5)} className="w-10 h-10 bg-blue-600 rounded hover:bg-blue-500 active:scale-95 flex items-center justify-center font-bold shadow-lg">➡️</button>

                                <div></div>
                                <button onClick={() => nudge('marginTop', 5)} className="w-10 h-10 bg-blue-600 rounded hover:bg-blue-500 active:scale-95 flex items-center justify-center font-bold shadow-lg">⬇️</button>
                                <div></div>
                            </div>
                            <div className="flex justify-between w-full mt-2 px-4 text-[10px] text-gray-500 font-mono">
                                <span>X: {currentConfig.marginLeft}px</span>
                                <span>Y: {currentConfig.marginTop}px</span>
                            </div>
                        </div>

                        {/* SLIDERS (Ukuran & Jarak) */}
                        <div className="space-y-4">
                            {/* Lebar & Tinggi Foto */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Lebar Foto (Width)</label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => nudge('photoWidth', -1)} className="bg-gray-700 w-6 rounded">-</button>
                                        <span className="flex-1 text-center text-sm font-mono">{currentConfig.photoWidth}</span>
                                        <button onClick={() => nudge('photoWidth', 1)} className="bg-gray-700 w-6 rounded">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Tinggi Foto (Height)</label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => nudge('photoHeight', -1)} className="bg-gray-700 w-6 rounded">-</button>
                                        <span className="flex-1 text-center text-sm font-mono">{currentConfig.photoHeight}</span>
                                        <button onClick={() => nudge('photoHeight', 1)} className="bg-gray-700 w-6 rounded">+</button>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full border-t border-gray-700"></div>

                            {/* Jarak Antar Foto (Gap) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Jarak Antar Kolom (Gap X)</label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => nudge('gapX', -1)} className="bg-gray-700 w-6 rounded">-</button>
                                        <span className="flex-1 text-center text-sm font-mono">{currentConfig.gapX}</span>
                                        <button onClick={() => nudge('gapX', 1)} className="bg-gray-700 w-6 rounded">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Jarak Antar Baris (Gap Y)</label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => nudge('gapY', -1)} className="bg-gray-700 w-6 rounded">-</button>
                                        <span className="flex-1 text-center text-sm font-mono">{currentConfig.gapY}</span>
                                        <button onClick={() => nudge('gapY', 1)} className="bg-gray-700 w-6 rounded">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Radius */}
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Kelengkungan Sudut: {currentConfig.borderRadius}px</label>
                                <input type="range" min="0" max="50" value={currentConfig.borderRadius} onChange={(e) => updateConfig('borderRadius', e.target.value)} className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSave} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2">
                        💾 SIMPAN SEMUA
                    </button>
                </div>

                {/* --- KOLOM KANAN: LIVE SIMULATOR --- */}
                <div className="flex-[1.5] bg-black flex flex-col relative">
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 text-center">
                        <h3 className="text-white/50 text-xs uppercase tracking-[0.3em]">LIVE PREVIEW SIMULATOR</h3>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#1a1a1a] relative">
                        {/* AREA KERTAS FOTO (Statik 320x480 untuk simulasi layar) */}
                        <div className="relative bg-white shadow-2xl overflow-hidden ring-8 ring-gray-800"
                            style={{ width: '320px', height: '480px', transform: 'scale(1.0)' }} // Skala bisa diatur
                        >
                            {/* LAYER 1: GRID FOTO (FLOATING) */}
                            {/* Grid ini bisa digeser kemana saja (top/left) tanpa terpotong padding parent */}
                            <div
                                className="absolute grid grid-cols-2 grid-rows-3 z-0 transition-all duration-75 ease-linear"
                                style={{
                                    top: `${currentConfig.marginTop}px`,
                                    left: `${currentConfig.marginLeft}px`,
                                    columnGap: `${currentConfig.gapX}px`,
                                    rowGap: `${currentConfig.gapY}px`,
                                    // Grid size menyesuaikan konten (foto)
                                }}
                            >
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="relative bg-gray-700 overflow-hidden border border-blue-500/30 shadow-sm"
                                        style={{
                                            width: `${currentConfig.photoWidth}px`,
                                            height: `${currentConfig.photoHeight}px`,
                                            borderRadius: `${currentConfig.borderRadius}px`
                                        }}
                                    >
                                        {/* Tampilkan Video Live di Slot 1 */}
                                        {i === 0 ? (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    autoPlay playsInline muted
                                                    className="w-full h-full object-cover opacity-90"
                                                ></video>
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold bg-black/20">FOTO 1</div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-800">
                                                <span className="text-xs font-bold">FOTO {i+1}</span>
                                                <span className="text-[8px]">{currentConfig.photoWidth}x{currentConfig.photoHeight}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* LAYER 2: TEMPLATE OVERLAY (PNG Transparan) */}
                            {/* Pastikan ini file PNG yang bolong tengahnya */}
                            <img
                                src={selectedTemplate === 1 ? '/images/templates/template1.png' : '/images/templates/template2.png'}
                                alt="Template Overlay"
                                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none opacity-90"
                            />
                        </div>
                    </div>

                    {/* Footer Toggle Template */}
                    <div className="bg-gray-900 border-t border-gray-700 p-4 flex justify-center gap-4 z-20">
                        <button
                            onClick={() => setSelectedTemplate(1)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition ${selectedTemplate === 1 ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            Preview Templat 1
                        </button>
                        <button
                            onClick={() => setSelectedTemplate(2)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition ${selectedTemplate === 2 ? 'bg-pink-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            Preview Templat 2
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
