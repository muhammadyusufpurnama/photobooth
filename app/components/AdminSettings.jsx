'use client';

import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd'; 
import Swal from 'sweetalert2';

const AdminSettings = ({ onBack }) => {
    const [isMounted, setIsMounted] = useState(false);

    // --- 1. STATE PERANGKAT & KONFIGURASI ---
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [printerName, setPrinterName] = useState('System Default');
    const [autoPrint, setAutoPrint] = useState(false); // Default false agar tidak nyala terus

    // --- 2. STATE TEMPLATE & EDITOR ---
    const [templatePreview, setTemplatePreview] = useState('/images/templates/template1.png');
    const [photoSlots, setPhotoSlots] = useState([]);
    const [activeSlotId, setActiveSlotId] = useState(null);
    const [templateGallery, setTemplateGallery] = useState([]);

    // --- INIT: LOAD DATA ---
    useEffect(() => {
        setIsMounted(true);

        const getDevices = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                setCameras(devices.filter(d => d.kind === 'videoinput'));
            } catch (e) { 
                console.error("Gagal akses kamera:", e); 
            }
        };
        getDevices();

        // LOAD DATA PENGATURAN (Sesuai dengan yang disimpan di HasilPengguna)
        const savedSettings = localStorage.getItem('ADMIN_SETTINGS');
        if (savedSettings) {
            try {
                const config = JSON.parse(savedSettings);
                setSelectedCamera(config.selectedCamera || '');
                setPrinterName(config.printerName || 'System Default');
                // Pastikan autoPrint mengambil nilai boolean murni dari storage
                setAutoPrint(config.autoPrint === true); 
            } catch (e) { console.error("Error parsing settings:", e); }
        }

        const savedGallery = localStorage.getItem('PHOTOBOOTH_GALLERY');
        if (savedGallery) {
            try {
                const parsed = JSON.parse(savedGallery);
                setTemplateGallery(parsed);
                if (parsed.length > 0) {
                    const last = parsed[parsed.length - 1];
                    setTemplatePreview(last.image);
                    setPhotoSlots(last.slots);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    // --- HANDLERS ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplatePreview(reader.result);
                setPhotoSlots([]); 
            };
            reader.readAsDataURL(file);
        }
    };

    const addPhotoSlot = () => {
        const newId = photoSlots.length + 1;
        setPhotoSlots([...photoSlots, {
            id: newId,
            x: 50, y: 50,
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
        const filtered = photoSlots.filter(s => s.id !== activeSlotId);
        setPhotoSlots(filtered.map((s, index) => ({ ...s, id: index + 1 })));
        setActiveSlotId(null);
    };

    // --- LOGIC: SAVE SEMUA KONFIGURASI ---
    const handleSaveAll = () => {
        if (!selectedCamera) {
            return Swal.fire({
                title: 'Pilih Kamera!',
                text: 'Silakan pilih kamera input sebelum menyimpan.',
                icon: 'warning',
                confirmButtonColor: '#3b82f6',
            });
        }

        Swal.fire({
            title: 'Simpan Konfigurasi?',
            text: "Pengaturan printer, kamera, dan status cetak otomatis akan diperbarui.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Simpan!',
            background: '#1f292d',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                // 1. Simpan Objek Settings Global (Digunakan HasilPengguna & Kamera)
                const settingsToSave = {
                    selectedCamera,
                    printerName,
                    autoPrint: autoPrint // Menyimpan status boolean yang sedang aktif
                };
                localStorage.setItem('ADMIN_SETTINGS', JSON.stringify(settingsToSave));
                localStorage.setItem('PHOTOBOOTH_CAMERA_ID', selectedCamera);

                // 2. Simpan Template ke Galeri
                const newEntry = {
                    id: Date.now(),
                    image: templatePreview,
                    slots: photoSlots
                };

                let updatedGallery = [...templateGallery];
                const exists = updatedGallery.find(t => t.image === templatePreview);
                if (!exists && photoSlots.length > 0) {
                    updatedGallery.push(newEntry);
                    if (updatedGallery.length > 5) updatedGallery = updatedGallery.slice(1);
                    localStorage.setItem('PHOTOBOOTH_GALLERY', JSON.stringify(updatedGallery));
                    setTemplateGallery(updatedGallery);
                }

                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Konfigurasi telah disinkronkan.',
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
        const updated = templateGallery.filter(t => t.id !== id);
        localStorage.setItem('PHOTOBOOTH_GALLERY', JSON.stringify(updated));
        setTemplateGallery(updated);
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
            
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-blue-400">⚙️ Admin Control Center</h1>
                    <p className="text-gray-400 text-sm">Konfigurasi Perangkat & Template</p>
                </div>
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-full font-bold transition">
                    Kembali
                </button>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg space-y-6">
                        <h2 className="text-xl font-bold text-yellow-400 border-b border-gray-700 pb-2">🔌 Koneksi Perangkat</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kamera Input</label>
                                <select 
                                    value={selectedCamera} 
                                    onChange={(e) => setSelectedCamera(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white"
                                >
                                    <option value="">-- Pilih Kamera --</option>
                                    {cameras.map(cam => (
                                        <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cam.deviceId.slice(0,5)}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Target Printer (Nama Label)</label>
                                <input 
                                    type="text" 
                                    value={printerName} 
                                    onChange={(e) => setPrinterName(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white" 
                                    placeholder="Contoh: Epson L3110"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">*Pastikan printer sudah diset sebagai "Default" di Windows.</p>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-700">
                                <div>
                                    <p className="text-sm font-bold text-white">Cetak Otomatis</p>
                                    <p className="text-[10px] text-gray-500 italic">{autoPrint ? "Status: Aktif" : "Status: Nonaktif"}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={autoPrint} 
                                        onChange={(e) => setAutoPrint(e.target.checked)} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-pink-400 pt-4 border-t border-gray-700 pb-2">🎨 Editor Template</h2>
                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-700 transition text-center">
                                <span className="text-xs text-gray-400 font-semibold">Upload Template (PNG)</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                            <button onClick={addPhotoSlot} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition">➕ Tambah Slot (16:9)</button>
                            {activeSlotId && <button onClick={deleteActiveSlot} className="w-full py-2 bg-red-600/20 text-red-400 border border-red-600 rounded-lg text-sm">Hapus Slot #{activeSlotId}</button>}
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveAll} 
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold text-xl rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                    >
                        💾 SIMPAN KONFIGURASI
                    </button>

                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                        <h3 className="text-xs font-bold text-blue-300 uppercase mb-3">🖼️ Galeri Template</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {templateGallery.map((temp) => (
                                <div key={temp.id} className="relative group aspect-[2/3] bg-black rounded border border-gray-600 overflow-hidden">
                                    <img 
                                        src={temp.image} 
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-50 transition" 
                                        onClick={() => { setTemplatePreview(temp.image); setPhotoSlots(temp.slots); }} 
                                    />
                                    <button onClick={() => deleteTemplate(temp.id)} className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col items-center justify-start bg-black/50 rounded-3xl border-2 border-dashed border-gray-700 p-8 min-h-[600px] relative overflow-hidden">
                    <div 
                        className="relative bg-white shadow-2xl overflow-hidden"
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
                                
                                // --- UBAH BAGIAN INI ---
                                // Ganti "parent" menjadi false agar bisa ditarik keluar garis
                                bounds={false} 
                                
                                lockAspectRatio={true} 
                                onDragStop={(e, d) => { updateSlot(slot.id, { x: d.x, y: d.y }); setActiveSlotId(slot.id); }}
                                onResizeStop={(e, dir, ref, delta, pos) => {
                                    updateSlot(slot.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos });
                                    setActiveSlotId(slot.id);
                                }}
                                onMouseDown={() => setActiveSlotId(slot.id)}
                                className={`border-2 flex items-center justify-center cursor-move transition-colors ${activeSlotId === slot.id ? 'border-blue-500 bg-blue-500/20 z-50' : 'border-gray-800/50 bg-gray-800/30'}`}
                            >
                                <span className="text-[10px] font-bold text-white drop-shadow-md pointer-events-none">Foto {slot.id}</span>
                            </Rnd>
                        ))}
                    </div>
                    <p className="mt-6 text-gray-500 text-[10px] uppercase font-bold tracking-widest">Canvas Preview 320x480</p>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;