'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const AdminSettingsNoSSR = dynamic(
  () => import('./components/AdminSettings'),
  { ssr: false }
);

import Home from './components/Home';
import Tutorial from './components/Tutorial';
import PilihPaket from './components/PilihPaket';
import AddOn from './components/AddOn';
import PilihPembayaran from './components/PilihPembayaran';
import KameraPhotobooth from './components/KameraPhotobooth';
import HasilPengguna from './components/HasilPengguna';

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

export default function Page() { 
    const [currentPage, setCurrentPage] = useState('home');
    const [bookingData, setBookingData] = useState({});
    const [finalPhotos, setFinalPhotos] = useState([]); 
    const [finalTemplateId, setFinalTemplateId] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState(filterOptions[0]);

    useEffect(() => {
        if (window.location.pathname === '/admin') {
            setCurrentPage('admin');
        }

        const isWaiting = localStorage.getItem('DOKU_IS_WAITING');
        const savedBooking = localStorage.getItem('TEMP_BOOKING_DATA');

        if (isWaiting === 'true') {
            localStorage.removeItem('DOKU_IS_WAITING');
            localStorage.removeItem('DOKU_ONGOING_ORDER');
            
            if (savedBooking) {
                setBookingData(JSON.parse(savedBooking));
                localStorage.removeItem('TEMP_BOOKING_DATA');
            }

            console.log("Welcome back! Resuming to Camera...");
            setCurrentPage('kamera'); 
        }
    }, []);

    const navigateTo = (page) => setCurrentPage(page);

    const handleBack = () => {
        if (currentPage === 'tutorial') navigateTo('home');
        else if (currentPage === 'pilih-paket') navigateTo('tutorial');
        else if (currentPage === 'add-on') navigateTo('pilih-paket');
        else if (currentPage === 'pilih-pembayaran') navigateTo('add-on'); 
        else if (currentPage === 'kamera') navigateTo('pilih-pembayaran');
        else if (currentPage === 'cetak') navigateTo('kamera');
        else if (currentPage === 'hasil-pengguna') handleHomeReset();
        else if (currentPage === 'admin') {
            window.history.pushState(null, '', '/');
            navigateTo('home');
        }
    };

    const handleAddOnNext = (addOnsData) => {
        setBookingData(prev => ({ ...prev, ...addOnsData }));
        navigateTo('pilih-pembayaran');
    };

    const handlePilihPembayaranNext = (status) => {
        setBookingData(prev => ({ ...prev, paymentStatus: status }));
        navigateTo('kamera');
    };

    const handleCameraFinish = (photos, templateId) => {
        setFinalPhotos(photos);
        setFinalTemplateId(templateId);
        setSelectedFilter(filterOptions[0]);
        navigateTo('cetak');
    };

    const handleHomeReset = () => {
        setBookingData({});
        setFinalPhotos([]);
        setFinalTemplateId(null);
        localStorage.clear(); 
        navigateTo('home');
    };

    const renderResultPreview = () => {
        let selectedTemplateData = null;
        if (typeof window !== 'undefined') {
            const savedGallery = localStorage.getItem('PHOTOBOOTH_GALLERY');
            if (savedGallery) {
                try {
                    const gallery = JSON.parse(savedGallery);
                    selectedTemplateData = gallery.find(t => String(t.id) === String(finalTemplateId));
                } catch (e) { console.error(e); }
            }
        }

        const bgImage = selectedTemplateData ? selectedTemplateData.image : '/images/templates/template1.png';
        const slots = selectedTemplateData ? selectedTemplateData.slots : [];

        return (
            <div className="relative bg-white shadow-2xl overflow-hidden"
                style={{ width: '320px', height: '480px', flexShrink: 0 }}>
                {slots.map((slot, index) => (
                    <div key={index} className="absolute overflow-hidden bg-gray-200"
                        style={{ 
                            width: `${slot.width}px`, height: `${slot.height}px`, 
                            left: `${slot.x}px`, top: `${slot.y}px` 
                        }}>
                        {finalPhotos[index] && (
                            <img src={finalPhotos[index].src} 
                                style={selectedFilter.style} 
                                className="w-full h-full object-cover" 
                                alt="" />
                        )}
                    </div>
                ))}
                <img src={bgImage} className="absolute inset-0 w-full h-full z-10 pointer-events-none" alt="frame" />
            </div>
        );
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home onStartPhotoBooth={() => navigateTo('tutorial')} onOpenAdmin={() => navigateTo('admin')} />;
            case 'tutorial':
                return <Tutorial onNext={() => navigateTo('pilih-paket')} onBack={handleBack} />;
            case 'pilih-paket':
                return <PilihPaket onNext={(id) => { setBookingData(p => ({...p, package: id})); navigateTo('add-on'); }} onBack={handleBack} />;
            case 'add-on':
                return <AddOn onNext={handleAddOnNext} onBack={handleBack} selectedPackage={bookingData.package} />;
            case 'pilih-pembayaran':
                return <PilihPembayaran onNext={handlePilihPembayaranNext} onBack={handleBack} bookingData={bookingData} />;
            case 'kamera':
                return <KameraPhotobooth onBack={handleBack} onFinish={handleCameraFinish} />;
            case 'cetak':
                return (
                    <div className="h-screen w-full bg-gray-900 flex flex-col items-center overflow-hidden relative"
                         style={{ backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")', backgroundSize: 'cover' }}>
                        <div className="flex flex-row items-center justify-center w-full h-full max-w-7xl px-8 gap-12">
                            <div className="flex-1 flex flex-col justify-center items-center h-full pt-6">
                                {renderResultPreview()}
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center h-full max-w-md">
                                <h2 className="text-2xl font-bold text-white mb-4">Pilih Filter Aesthetic</h2>
                                <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                                    <div className="grid grid-cols-4 gap-3 mb-6">
                                        {filterOptions.map((filter) => (
                                            <button key={filter.name} onClick={() => setSelectedFilter(filter)}
                                                className={`flex flex-col items-center p-2 rounded-lg transition ${selectedFilter.name === filter.name ? 'bg-blue-600 scale-105' : 'bg-white/10'}`}>
                                                <div className="w-10 h-10 rounded-full bg-cover" 
                                                     style={{ backgroundImage: finalPhotos[0] ? `url(${finalPhotos[0].src})` : 'none', ...filter.style }}></div>
                                                <span className="text-white text-[10px] mt-1">{filter.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => navigateTo('hasil-pengguna')} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg animate-pulse">
                                        🖨️ Cetak & Lihat Hasil
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'hasil-pengguna':
                // --- PERBAIKAN: Tambahkan bookingData={bookingData} ---
                return (
                    <HasilPengguna 
                        photos={finalPhotos} 
                        templateId={finalTemplateId} 
                        filterStyle={selectedFilter.style} 
                        onHome={handleHomeReset} 
                        bookingData={bookingData} 
                    />
                );
            case 'admin':
                return <AdminSettingsNoSSR onBack={handleBack} />;
            default:
                return <Home onStartPhotoBooth={() => navigateTo('tutorial')} />;
        }
    };

    return <main>{renderPage()}</main>;
}