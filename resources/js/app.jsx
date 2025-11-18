// resources/js/app.jsx
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './components/Home';
import Tutorial from './components/Tutorial';
import PilihPaket from './components/PilihPaket';
import AddOn from './components/AddOn';
import Voucher from './components/Voucher';
import PilihPembayaran from './components/PilihPembayaran';

const App = () => {
    const [currentStep, setCurrentStep] = useState('home');
    const [bookingData, setBookingData] = useState({
        package: null,
        packageName: '',
        packagePrice: 0,
        extraPrints: 0,
        totalPrintCost: 0,
        extraTime: 0,
        totalTimeCost: 0,
        addOnPrice: 0,
        voucherCode: '',
        discountAmount: 0
    });

    const handleHomeNext = () => {
        setCurrentStep('tutorial');
    };

    const handleTutorialNext = () => {
        setCurrentStep('pilihPaket');
    };

    const handlePilihPaketNext = (selectedPkg) => {
        setBookingData(prev => ({
            ...prev,
            package: selectedPkg.id,
            packageName: selectedPkg.name,
            packagePrice: selectedPkg.price
        }));
        setCurrentStep('addOn');
    };

    const handleAddOnNext = (addOnData) => {
        setBookingData(prev => ({
            ...prev,
            extraPrints: addOnData.extraPrints,
            totalPrintCost: addOnData.totalPrintCost,
            extraTime: addOnData.extraTime,
            totalTimeCost: addOnData.totalTimeCost,
            addOnPrice: addOnData.addOnPrice
        }));
        setCurrentStep('voucher');
    };

    const handleVoucherNext = (voucherData) => {
        setBookingData(prev => ({
            ...prev,
            voucherCode: voucherData.voucherCode,
            discountAmount: voucherData.discountAmount
        }));
        setCurrentStep('pilihPembayaran');
    };

    const handlePembayaranNext = (paymentData) => {
        console.log('Final Booking Data:', { ...bookingData, ...paymentData });
        setCurrentStep('confirmation');
    };

    const handleBack = () => {
        const stepMap = {
            'home': 'home',
            'tutorial': 'home',
            'pilihPaket': 'tutorial',
            'addOn': 'pilihPaket',
            'voucher': 'addOn',
            'pilihPembayaran': 'voucher'
        };
        setCurrentStep(stepMap[currentStep] || 'home');
    };

    return (
        <div>
            {currentStep === 'home' && (
                <Home onNext={handleHomeNext} />
            )}
            {currentStep === 'tutorial' && (
                <Tutorial onNext={handleTutorialNext} onBack={handleBack} />
            )}
            {currentStep === 'pilihPaket' && (
                <PilihPaket onNext={handlePilihPaketNext} onBack={handleBack} />
            )}
            {currentStep === 'addOn' && (
                <AddOn onNext={handleAddOnNext} onBack={handleBack} bookingData={bookingData} />
            )}
            {currentStep === 'voucher' && (
                <Voucher onNext={handleVoucherNext} onBack={handleBack} bookingData={bookingData} />
            )}
            {currentStep === 'pilihPembayaran' && (
                <PilihPembayaran onNext={handlePembayaranNext} onBack={handleBack} bookingData={bookingData} />
            )}
        </div>
    );
};

const appContainer = document.getElementById('app');

if (appContainer) {
    const root = createRoot(appContainer);
    root.render(<App />);
}

export default App;
