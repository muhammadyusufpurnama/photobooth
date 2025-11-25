import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Import semua komponen halaman
import Home from './components/Home.jsx';
import Tutorial from './components/Tutorial.jsx';
import PilihPaket from './components/PilihPaket.jsx';
import AddOn from './components/AddOn.jsx';
import Voucher from './components/Voucher.jsx';
import PilihPembayaran from './components/PilihPembayaran.jsx';
import KameraPhotobooth from './components/KameraPhotobooth.jsx';
import AdminSettings from './components/AdminSettings.jsx';

const App = () => {
    // 1. Inisialisasi Halaman Berdasarkan URL
    const [currentPage, setCurrentPage] = useState(() => {
        return window.location.pathname === '/admin' ? 'admin' : 'home';
    });

    const [bookingData, setBookingData] = useState({});
    const [finalPhotos, setFinalPhotos] = useState([]);
    const [finalTemplateId, setFinalTemplateId] = useState(1); // Default Template 1

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

        // Khusus Admin: Kembali ke Home & Bersihkan URL
        else if (currentPage === 'admin') {
            window.history.pushState(null, '', '/');
            navigateTo('home');
        }
    };

    // Navigasi Flow
    const handleStartPhotoBooth = () => navigateTo('tutorial');
    const handleTutorialNext = () => navigateTo('pilih-paket');

    const handlePilihPaketNext = (selectedPackageId) => {
        setBookingData(prev => ({ ...prev, package: selectedPackageId }));
        navigateTo('add-on');
    };

    const handleAddOnNext = (addOns) => {
        setBookingData(prev => ({ ...prev, addOns }));
        navigateTo('voucher');
    };

    const handleVoucherNext = (voucherCode) => {
        setBookingData(prev => ({ ...prev, voucher: voucherCode }));
        navigateTo('pilih-pembayaran');
    };

    const handlePilihPembayaranNext = (paymentMethod) => {
        setBookingData(prev => ({ ...prev, paymentMethod }));
        console.log('Pembayaran sukses, lanjut ke kamera...');
        navigateTo('kamera');
    };

    // Handler Selesai Foto (Menerima Foto & Template ID)
    const handleCameraFinish = (photos, templateId) => {
        console.log("Selesai Foto. Template:", templateId);
        setFinalPhotos(photos);
        setFinalTemplateId(templateId); // Simpan ID template yang dipilih user
        navigateTo('cetak');
    };

    const handleFinishPrinting = () => {
        alert("Terima kasih! Foto sedang dicetak.");
        setBookingData({});
        setFinalPhotos([]);
        navigateTo('home');
    };

    // Helper: Render Preview Hasil Akhir (Sesuai Layout Admin)
    const renderResultPreview = () => {
        // Default style fallback
        let style = {
            width: 135, height: 100,
            top: 80, left: 20,
            gapX: 10, gapY: 10,
            borderRadius: 0
        };

        // Ambil config layout dari LocalStorage berdasarkan template ID
        const savedLayouts = localStorage.getItem('PHOTOBOOTH_LAYOUTS');
        if (savedLayouts) {
            try {
                const allConfigs = JSON.parse(savedLayouts);
                const config = allConfigs[finalTemplateId];
                if (config) {
                    style = {
                        width: config.photoWidth,
                        height: config.photoHeight,
                        top: config.marginTop,
                        left: config.marginLeft,
                        gapX: config.gapX,
                        gapY: config.gapY,
                        borderRadius: config.borderRadius
                    };
                }
            } catch(e) {
                console.error("Error parsing layout config", e);
            }
        }

        return (
            // KANVAS HASIL (Ukuran sama seperti di Admin/Kamera: 320x480)
            // Kita perbesar sedikit dengan scale agar terlihat jelas di layar
            <div className="relative bg-white shadow-2xl overflow-hidden ring-8 ring-gray-800 rounded-lg transform scale-125 my-10"
                 style={{ width: '320px', height: '480px', flexShrink: 0 }}
            >
                {/* LAYER 1: GRID FOTO (Floating) */}
                <div
                    className="absolute grid grid-cols-2 grid-rows-3 z-0"
                    style={{
                        top: `${style.top}px`,
                        left: `${style.left}px`,
                        columnGap: `${style.gapX}px`,
                        rowGap: `${style.gapY}px`,
                    }}
                >
                    {finalPhotos.map((photo, index) => (
                        <div
                            key={index}
                            className="relative bg-gray-200 overflow-hidden"
                            style={{
                                width: `${style.width}px`,
                                height: `${style.height}px`,
                                borderRadius: `${style.borderRadius}px`
                            }}
                        >
                            {photo && <img src={photo.src} alt={`Result ${index}`} className="w-full h-full object-cover" />}
                        </div>
                    ))}
                </div>

                {/* LAYER 2: TEMPLATE OVERLAY */}
                <img
                    src={finalTemplateId === 1 ? '/images/templates/template1.png' : '/images/templates/template2.png'}
                    alt="Final Template Frame"
                    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                />
            </div>
        );
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home
                    onStartPhotoBooth={handleStartPhotoBooth}
                    onOpenAdmin={() => navigateTo('admin')}
                />;
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

            case 'kamera':
                return <KameraPhotobooth onBack={handleBack} onFinish={handleCameraFinish} />;

            case 'cetak':
                return (
                    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-5 overflow-y-auto">
                        <h1 className="text-4xl font-bold mb-4 text-blue-400 drop-shadow-md">Hasil Foto Anda!</h1>
                        <p className="text-gray-400 mb-4">Silakan cek hasil di bawah sebelum mencetak.</p>

                        {/* Panggil Helper Render Hasil */}
                        {renderResultPreview()}

                        <div className="flex gap-6 mt-16 z-50">
                            <button
                                onClick={() => navigateTo('kamera')}
                                className="px-8 py-3 bg-yellow-600 text-white font-bold rounded-full hover:bg-yellow-500 transition shadow-lg transform hover:scale-105"
                            >
                                ↺ Foto Ulang
                            </button>
                            <button
                                onClick={handleFinishPrinting}
                                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition shadow-lg animate-bounce"
                            >
                                🖨️ Cetak & Selesai
                            </button>
                        </div>
                    </div>
                );

            case 'admin':
                return <AdminSettings onBack={handleBack} />;

            default:
                return <Home onStartPhotoBooth={handleStartPhotoBooth} />;
        }
    };

    return (
        <React.StrictMode>
            {renderPage()}
        </React.StrictMode>
    );
};

// --- MOUNTING ---
const appContainer = document.getElementById('app');

if (appContainer) {
    const root = createRoot(appContainer);
    root.render(<App />);
} else {
    console.error("Container <div id='app'> tidak ditemukan.");
}
