// resources/js/app.jsx
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Import semua komponen halaman Anda
import Home from './components/Home';
import Tutorial from './components/Tutorial';
import PilihPaket from './components/PilihPaket';
import AddOn from './components/AddOn';
import Voucher from './components/Voucher';
import PilihPembayaran from './components/PilihPembayaran';

const App = () => {
    const [currentPage, setCurrentPage] = useState('home'); // State untuk melacak halaman saat ini
    const [bookingData, setBookingData] = useState({}); // State untuk menyimpan data booking

    const navigateTo = (page) => {
        setCurrentPage(page);
    };

    const handleBack = () => {
        // Logika untuk kembali ke halaman sebelumnya
        if (currentPage === 'tutorial') navigateTo('home');
        else if (currentPage === 'pilih-paket') navigateTo('tutorial');
        else if (currentPage === 'add-on') navigateTo('pilih-paket');
        else if (currentPage === 'voucher') navigateTo('add-on');
        else if (currentPage === 'pilih-pembayaran') navigateTo('voucher');
    };

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
        // Ini adalah akhir alur, Anda bisa mengirim bookingData ke backend
        console.log('Booking Final Data:', bookingData);
        alert('Booking selesai! Data akan dikirim ke backend.');
        // Mungkin arahkan ke halaman konfirmasi sukses
    };


    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home onStartPhotoBooth={handleStartPhotoBooth} />;
            case 'tutorial':
                return <Tutorial onNext={handleTutorialNext} onBack={handleBack} />;
            case 'pilih-paket':
                return <PilihPaket onNext={handlePilihPaketNext} onBack={handleBack} />;
            case 'add-on':
                return <AddOn onNext={handleAddOnNext} onBack={handleBack} selectedPackage={bookingData.package} />;
            case 'voucher':
                return <Voucher onNext={handleVoucherNext} onBack={handleBack} />;
            case 'pilih-pembayaran':
                return <PilihPembayaran onNext={handlePilihPembayaranNext} onBack={handleBack} />;
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

const appContainer = document.getElementById('app');

if (appContainer) {
    const root = createRoot(appContainer);
    root.render(<App />);
}
