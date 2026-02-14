'use client';

import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd'; // Library Drag & Resize
import Swal from 'sweetalert2';

const AdminSettings = ({ onBack }) => {
    const [isMounted, setIsMounted] = useState(false);

    // --- 1. STATE DEVICES ---
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [printerName, setPrinterName] = useState('System Default');

    // --- 2. STATE TEMPLATE & EDITOR ---
    const [templatePreview, setTemplatePreview] = useState('/images/templates/template1.png');
    const [photoSlots, setPhotoSlots] = useState([]);
    const [activeSlotId, setActiveSlotId] = useState(null);

    // --- 3. STATE GALERI ---
    const [templateGallery, setTemplateGallery] = useState([]);

    // --- INIT: LOAD DATA ---
    useEffect(() => {
        setIsMounted(true);

        const getDevices = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                setCameras(devices.filter(d => d.kind === 'videoinput'));
            } catch (e) { console.error(e); }
        };
        getDevices();

        // Load Global Settings
        const savedCam = localStorage.getItem('PHOTOBOOTH_CAMERA_ID');
        if (savedCam) setSelectedCamera(savedCam);

        const savedPrinter = localStorage.getItem('PHOTOBOOTH_PRINTER');
        if (savedPrinter) setPrinterName(savedPrinter);

        // Load Galeri
        const savedGallery = localStorage.getItem('PHOTOBOOTH_GALLERY');
        if (savedGallery) {
            try {
                const parsed = JSON.parse(savedGallery);
                setTemplateGallery(parsed);
                if (parsed.length > 0) {
                    // Load template terakhir agar admin tidak kosong saat dibuka
                    const last = parsed[parsed.length - 1];
                    setTemplatePreview(last.image);
                    setPhotoSlots(last.slots);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    // --- LOGIC: DEVICE & EDITOR ---
    const handleCameraChange = (e) => setSelectedCamera(e.target.value);
    const handlePrinterChange = (e) => setPrinterName(e.target.value);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplatePreview(reader.result);
                setPhotoSlots([]); // Reset slot jika ganti template
            };
            reader.readAsDataURL(file);
        }
    };

    // --- PERBAIKAN DISINI: UBAH KE RASIO 16:9 ---
    const addPhotoSlot = () => {
        const newId = photoSlots.length + 1;
        setPhotoSlots([...photoSlots, {
            id: newId,
            x: 50, y: 50,
            // 160 x 90 adalah rasio murni 16:9
            // 150 x 100 adalah rasio murni 3:2
            // 120 x 120 adalah rasio murni 1:1
            // Karena lockAspectRatio aktif, rasio ini akan terkunci selamanya saat resize
            width: 160, 
            height: 90, 
        }]);
    };

    const updateSlot = (id, data) => {
        setPhotoSlots(prev => prev.map(slot => 
            slot.id === id ? { ...slot, ...data } : slot
        ));
    };

    const deleteActiveSlot = () => {
        if (!activeSlotId) return;
        const filtered = photoSlots.filter(s => s.id !== activeSlotId);
        // Re-index ID agar urut kembali (1, 2, 3...)
        const reindexed = filtered.map((s, index) => ({ ...s, id: index + 1 }));
        setPhotoSlots(reindexed);
        setActiveSlotId(null);
    };

    // --- LOGIC: SAVE KE GALERI ---
    const handleSave = () => {
        if (!templatePreview) {
            return Swal.fire({
                title: 'Template Kosong!',
                text: 'Silakan pilih atau upload template terlebih dahulu.',
                icon: 'error',
                confirmButtonColor: '#3b82f6',
            });
        }

        Swal.fire({
            title: 'Simpan Konfigurasi?',
            text: "Tata letak slot foto ini akan ditambahkan ke galeri.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Simpan!',
            background: '#1f292d',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem('PHOTOBOOTH_CAMERA_ID', selectedCamera);
                localStorage.setItem('PHOTOBOOTH_PRINTER', printerName);

                const savedGallery = JSON.parse(localStorage.getItem('PHOTOBOOTH_GALLERY') || '[]');
                
                const newEntry = {
                    id: Date.now(), // ID Unik Timestamp
                    image: templatePreview,
                    slots: photoSlots
                };

                // Tambah ke galeri (Limit 5)
                let updatedGallery = [...savedGallery, newEntry];
                if (updatedGallery.length > 5) {
                    updatedGallery = updatedGallery.slice(1);
                }

                localStorage.setItem('PHOTOBOOTH_GALLERY', JSON.stringify(updatedGallery));
                setTemplateGallery(updatedGallery);

                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Template disimpan dengan rasio 16:9.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1f292d',
                    color: '#ffffff'
                });
            }
        });
    };

    const deleteTemplate = (id) => {
        Swal.fire({
            title: 'Hapus Template?',
            text: "Template ini akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Hapus',
            background: '#1f292d',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = templateGallery.filter(t => t.id !== id);
                localStorage.setItem('PHOTOBOOTH_GALLERY', JSON.stringify(updated));
                setTemplateGallery(updated);
                
                Swal.fire({
                    title: 'Terhapus!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1f292d',
                    color: '#ffffff'
                });
            }
        });
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">

            {/* HEADER */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-blue-400">⚙️ Admin Control Center</h1>
                    <p className="text-gray-400 text-sm">Atur perangkat dan tata letak template</p>
                </div>
                <button 
                    onClick={onBack} 
                    className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-full font-bold transition"
                    suppressHydrationWarning={true}
                >
                    Kembali
                </button>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- KOLOM KIRI: SETTINGS --- */}
                <div className="lg:col-span-4 space-y-8 h-fit">
                    
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg space-y-6">
                        <h2 className="text-xl font-bold text-yellow-400">🔌 Koneksi Perangkat</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kamera Input</label>
                                <select value={selectedCamera} onChange={handleCameraChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white" suppressHydrationWarning>
                                    <option value="">-- Pilih Kamera --</option>
                                    {cameras.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label || cam.deviceId}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Printer Target</label>
                                <input type="text" value={printerName} onChange={handlePrinterChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white" suppressHydrationWarning/>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-pink-400 pt-4 border-t border-gray-700">🎨 Editor Template</h2>
                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-700 transition">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 font-semibold">Klik untuk upload template</p>
                                    <p className="text-xs text-gray-500">PNG Transparent</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                            
                            <button onClick={addPhotoSlot} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition transform active:scale-95">
                                ➕ Tambah Slot Foto (16:9)
                            </button>
                            
                            {activeSlotId && (
                                <button onClick={deleteActiveSlot} className="w-full py-2 bg-red-600/20 text-red-400 border border-red-600 rounded-lg text-sm transition">
                                    Hapus Slot #{activeSlotId}
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={handleSave} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-2xl shadow-xl transition transform hover:scale-105" suppressHydrationWarning>
                        💾 SIMPAN KE GALERI
                    </button>

                    <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
                        <h3 className="text-sm font-bold text-blue-300 uppercase mb-4 tracking-wider">🖼️ Galeri Template ({templateGallery.length}/5)</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {templateGallery.map((temp) => (
                                <div key={temp.id} className="relative group aspect-[2/3] bg-black rounded border border-gray-600 overflow-hidden">
                                    <img 
                                        src={temp.image} 
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-70 transition" 
                                        onClick={() => {
                                            setTemplatePreview(temp.image);
                                            setPhotoSlots(temp.slots);
                                        }}
                                        title="Klik untuk edit kembali"
                                    />
                                    <button 
                                        onClick={() => deleteTemplate(temp.id)}
                                        className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        {templateGallery.length === 0 && <p className="text-gray-500 text-[10px] text-center italic">Belum ada template tersimpan</p>}
                    </div>
                </div>

                {/* --- KOLOM KANAN: WORKSPACE --- */}
                <div className="lg:col-span-8 flex flex-col items-center justify-start bg-black/50 rounded-3xl border-2 border-dashed border-gray-700 p-8 min-h-[600px] relative overflow-hidden">
                    <p className="absolute top-4 text-gray-500 text-xs uppercase tracking-widest font-bold z-20 pointer-events-none">
                        Canvas Preview (320px x 480px)
                    </p>

                    <div 
                        // Overflow Hidden agar elemen "Over Border" terpotong rapi secara visual
                        className="relative bg-white shadow-2xl mt-8 overflow-hidden"
                        style={{ 
                            width: '320px', 
                            height: '480px',
                            backgroundImage: `url(${templatePreview})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {photoSlots.map((slot) => (
                            <Rnd
                                key={slot.id}
                                size={{ width: slot.width, height: slot.height }}
                                position={{ x: slot.x, y: slot.y }}
                                
                                // Hapus bounds agar bisa ditarik keluar garis (Bleeding)
                                bounds={false} 
                                // Kunci rasio agar tetap 16:9 saat dibesarkan/dikecilkan
                                lockAspectRatio={true} 
                                
                                onDragStop={(e, d) => {
                                    updateSlot(slot.id, { x: d.x, y: d.y });
                                    setActiveSlotId(slot.id);
                                }}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                    updateSlot(slot.id, {
                                        width: parseInt(ref.style.width),
                                        height: parseInt(ref.style.height),
                                        ...position,
                                    });
                                    setActiveSlotId(slot.id);
                                }}
                                onMouseDown={() => setActiveSlotId(slot.id)}
                                className={`border-2 flex items-center justify-center cursor-move group
                                    ${activeSlotId === slot.id ? 'border-blue-500 z-50 bg-blue-500/20' : 'border-gray-800/50 bg-gray-800/30 hover:border-blue-300'}
                                `}
                                resizeHandleStyles={{
                                    topLeft: handleStyle,
                                    topRight: handleStyle,
                                    bottomLeft: handleStyle,
                                    bottomRight: handleStyle
                                }}
                                enableResizing={{
                                    top: false, right: false, bottom: false, left: false,
                                    topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
                                }}
                            >
                                <span className="text-[10px] font-bold text-white drop-shadow-lg pointer-events-none">
                                    Foto {slot.id}
                                </span>
                            </Rnd>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const handleStyle = {
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    border: '1px solid white'
};

export default AdminSettings;