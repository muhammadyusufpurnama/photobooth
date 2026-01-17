'use client'; // <--- WAJIB: Baris Pertama

import React, { useState, useEffect } from 'react';

// Import semua komponen halaman (Pastikan file-file ini ada di folder app/components/)
import Home from './components/Home';
import Tutorial from './components/Tutorial';
import PilihPaket from './components/PilihPaket';
import AddOn from './components/AddOn';
import Voucher from './components/Voucher';
import PilihPembayaran from './components/PilihPembayaran';
import KameraPhotobooth from './components/KameraPhotobooth'; // Pastikan komponen ini ada
import AdminSettings from './components/AdminSettings'; // Pastikan komponen ini ada
import HasilPengguna from './components/HasilPengguna'; 

// --- DATA FILTER ---
const filterOptions = [
    { name: 'Normal', style: {} },
    { name: 'B & W', style: { filter: 'grayscale(100%) contrast(1.1)' } },
    { name: 'Sepia', style: { filter: 'sepia(100%) contrast(1.2)' } },
    { name: 'Vintage', style: { filter: 'sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)' } },
    { name: 'Glow', style: { filter: 'brightness(1.2) contrast(1.1) saturate(1.1) blur(0.2px)' } },
    { name: 'Vivid', style: { filter: 'saturate(1.6) contrast(1.1)' } },
    { name: 'Soft', style: { filter: 'brightness(1.1) contrast(0.9) saturate(0.9)' } },
    { name: 'Noir', style: { filter: 'grayscale(100%) contrast(1.5) brightness(0.9)' } },
    { name: 'Cool', style: { filter: 'hue-rotate(180deg) sepia(0.2) opacity(0.9)' } },
    { name: 'Dramatic', style: { filter: 'contrast(1.4) brightness(0.9)' } },
    { name: 'Fade', style: { filter: 'opacity(0.8) sepia(0.3)' } },
];

// Ganti nama komponen jadi Home (Standar Next.js) atau tetap App juga boleh
export default function Page() { 
    // 1. Inisialisasi Halaman Berdasarkan URL
    const [currentPage, setCurrentPage] = useState('home');

    // useEffect untuk cek URL hanya dijalankan di client
    useEffect(() => {
        if (window.location.pathname === '/admin') {
            setCurrentPage('admin');
        }
    }, []);

    const [bookingData, setBookingData] = useState({});
    const [finalPhotos, setFinalPhotos] = useState([]); // Array of Object {src, video}
    const [finalTemplateId, setFinalTemplateId] = useState(1);

    // STATE BARU: Untuk menyimpan filter yang dipilih
    const [selectedFilter, setSelectedFilter] = useState(filterOptions[0]);

    const navigateTo = (page) => {
        setCurrentPage(page);
    };

    // Logika tombol "Kembali"
    const handleBack = () => {
        if (currentPage === 'tutorial') navigateTo('home');
        else if (currentPage === 'pilih-paket') navigateTo('tutorial');
        else if (currentPage === 'add-on') navigateTo('pilih-paket');
        else if (currentPage === 'voucher') navigateTo('add-on');
        else if (currentPage === 'pilih-pembayaran') navigateTo('voucher');
        else if (currentPage === 'kamera') navigateTo('pilih-pembayaran');
        else if (currentPage === 'cetak') navigateTo('kamera');
        else if (currentPage === 'hasil-pengguna') navigateTo('home'); // Opsional

        // Khusus Admin
        else if (currentPage === 'admin') {
            window.history.pushState(null, '', '/');
            navigateTo('home');
        }
    };

    const handleStartPhotoBooth = () => navigateTo('tutorial');
    const handleTutorialNext = () => navigateTo('pilih-paket');

    const handlePilihPaketNext = (selectedPackageId) => {
        setBookingData(prev => ({ ...prev, package: selectedPackageId }));
        navigateTo('add-on');
    };

    const handleAddOnNext = (addOnsData) => {
        setBookingData(prev => ({
            ...prev,
            ...addOnsData
        }));
        navigateTo('voucher');
    };

    const handleVoucherNext = (voucherCode) => {
        setBookingData(prev => ({ ...prev, voucher: voucherCode }));
        navigateTo('pilih-pembayaran');
    };

    const handlePilihPembayaranNext = (paymentStatus) => {
        // paymentStatus bisa 'LUNAS' atau 'DEV_BYPASS'
        setBookingData(prev => ({ ...prev, paymentStatus }));
        console.log('Pembayaran sukses/bypass, lanjut ke kamera...');
        navigateTo('kamera');
    };

    const handleCameraFinish = (photos, templateId) => {
        console.log("Selesai Foto. Total:", photos.length);
        setFinalPhotos(photos); // Simpan objek lengkap {src, video}
        setFinalTemplateId(templateId);
        setSelectedFilter(filterOptions[0]);
        navigateTo('cetak');
    };

    const handleFinishPrinting = () => {
        // Pindah ke Halaman Hasil Pengguna (Output 4 Poin)
        navigateTo('hasil-pengguna');
    };

    const handleHomeReset = () => {
        setBookingData({});
        setFinalPhotos([]);
        navigateTo('home');
    };

    // Helper: Render Preview Hasil Akhir (Untuk halaman CETAK)
    const renderResultPreview = () => {
        let style = {
            width: 135, height: 100, top: 80, left: 20,
            gapX: 10, gapY: 10, borderRadius: 0
        };

        // Cek localStorage hanya di client side agar tidak error hydration
        if (typeof window !== 'undefined') {
            const savedLayouts = localStorage.getItem('PHOTOBOOTH_LAYOUTS');
            if (savedLayouts) {
                try {
                    const allConfigs = JSON.parse(savedLayouts);
                    const config = allConfigs[finalTemplateId];
                    if (config) {
                        style = {
                            width: config.photoWidth, height: config.photoHeight,
                            top: config.marginTop, marginLeft: config.marginLeft, left: config.marginLeft,
                            gapX: config.gapX, gapY: config.gapY, borderRadius: config.borderRadius
                        };
                    }
                } catch(e) {}
            }
        }

        return (
            <div className="relative bg-white shadow-2xl overflow-hidden ring-4 ring-gray-800 rounded-lg transition-transform duration-300"
                 style={{ width: '320px', height: '480px', flexShrink: 0, transform: 'scale(1.1)', transformOrigin: 'center' }}
            >
                {/* LAYER 1: GRID FOTO */}
                <div className="absolute grid grid-cols-2 grid-rows-3 z-0"
                     style={{ top: `${style.top}px`, left: `${style.left}px`, columnGap: `${style.gapX}px`, rowGap: `${style.gapY}px` }}
                >
                    {finalPhotos.map((photo, index) => (
                        <div key={index} className="relative bg-gray-200 overflow-hidden"
                             style={{ width: `${style.width}px`, height: `${style.height}px`, borderRadius: `${style.borderRadius}px` }}
                        >
                            {photo && (
                                <img src={photo.src} alt={`Result ${index}`}
                                     className="w-full h-full object-cover transition-all duration-500"
                                     style={selectedFilter.style}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* LAYER 2: TEMPLATE OVERLAY */}
                {/* Pastikan gambar template ada di folder public/images/templates/ */}
                <img src={finalTemplateId === 1 ? '/images/templates/template1.png' : '/images/templates/template2.png'}
                     alt="Final Template Frame" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                />
            </div>
        );
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home onStartPhotoBooth={handleStartPhotoBooth} onOpenAdmin={() => navigateTo('admin')} />;
            case 'tutorial':
                return <Tutorial onNext={handleTutorialNext} onBack={handleBack} />;
            case 'pilih-paket':
                return <PilihPaket onNext={handlePilihPaketNext} onBack={handleBack} />;
            case 'add-on':
                return <AddOn onNext={handleAddOnNext} onBack={handleBack} selectedPackage={bookingData.package} />;
            case 'voucher':
                return <Voucher onNext={handleVoucherNext} onBack={handleBack} />;
            case 'pilih-pembayaran':
                return <PilihPembayaran onNext={handlePilihPembayaranNext} onBack={handleBack} bookingData={bookingData} />;
            
            // PASTIKAN ANDA PUNYA KOMPONEN INI DI FOLDER components/
            // case 'kamera':
            //     return <KameraPhotobooth onBack={handleBack} onFinish={handleCameraFinish} />;

            case 'kamera':
                return (
                    <KameraPhotobooth 
                        onBack={handleBack} 
                        onFinish={handleCameraFinish} 
                    />
                );

            case 'cetak':
                return (
                    <div className="h-screen w-full bg-gray-900 flex flex-col items-center overflow-hidden relative"
                         style={{ backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>

                        <div className="flex flex-row items-center justify-center w-full h-full max-w-7xl px-8 gap-12">
                            {/* KIRI: PREVIEW */}
                            <div className="flex-1 flex flex-col justify-center items-center h-full pt-6">
                                {renderResultPreview()}
                            </div>

                            {/* KANAN: FILTER */}
                            <div className="flex-1 flex flex-col items-center justify-center h-full max-w-md">
                                <div className="mb-4 text-center">
                                    <h2 className="text-2xl font-bold text-white drop-shadow-md">Pilih Filter Aesthetic</h2>
                                    <p className="text-gray-300 text-sm">Klik untuk menerapkan efek</p>
                                </div>
                                <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-5">
                                    <div className="grid grid-cols-4 gap-3 mb-6">
                                        {filterOptions.map((filter) => (
                                            <button key={filter.name} onClick={() => setSelectedFilter(filter)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 aspect-square ${selectedFilter.name === filter.name ? 'bg-blue-600 shadow-lg scale-105 border border-blue-300' : 'bg-white/10 hover:bg-white/20 hover:scale-105 border border-transparent'}`}>
                                                <div className="w-12 h-12 rounded-full mb-1 bg-gray-300 bg-cover bg-center shadow-inner"
                                                     style={{ backgroundImage: finalPhotos[0] ? `url(${finalPhotos[0].src})` : 'none', ...filter.style }}></div>
                                                <span className="text-white text-[10px] font-medium truncate w-full text-center">{filter.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 w-full border-t border-white/10 pt-4">
                                        <button onClick={handleFinishPrinting} className="flex-[2] py-3 px-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition shadow animate-pulse">
                                            🖨️ Cetak & Lihat Hasil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'hasil-pengguna':
                return <HasilPengguna
                            photos={finalPhotos}
                            templateId={finalTemplateId}
                            filterStyle={selectedFilter.style}
                            onHome={handleHomeReset}
                        />;

            // PASTIKAN ANDA PUNYA KOMPONEN INI
            // case 'admin':
            //    return <AdminSettings onBack={handleBack} />;
            
            case 'admin':
                return <div className="h-screen bg-white flex justify-center items-center"><h1>Halaman Admin Placeholder</h1><button onClick={handleBack} className="bg-red-500 p-2 text-white ml-4">Kembali</button></div>;

            default:
                return <Home onStartPhotoBooth={handleStartPhotoBooth} />;
        }
    };

    return (
        <main>
            {renderPage()}
        </main>
    );
};