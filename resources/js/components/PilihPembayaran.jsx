// resources/js/components/PilihPembayaran.jsx

import React, { useState, useMemo } from 'react';
import axios from 'axios';

const paymentMethods = [
    { id: 'qris_doku', name: 'QRIS (DOKU)', icon: '💳' },
    { id: 'transfer_bank', name: 'Transfer Bank (Manual)', icon: '🏦' },
];

const PilihPembayaran = ({ onNext, onBack, bookingData }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [qrisData, setQrisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hitung total dari bookingData dengan benar
    const priceDetails = useMemo(() => {
        const packagePrice = bookingData?.packagePrice || 0;
        const packageName = bookingData?.packageName || 'Paket';
        const addOnPrice = bookingData?.addOnPrice || 0;
        const discountAmount = bookingData?.discountAmount || 0;
        const totalBeforeDiscount = packagePrice + addOnPrice;
        const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount);

        return {
            packageName,
            packagePrice,
            addOnPrice,
            extraPrints: bookingData?.extraPrints || 0,
            totalPrintCost: bookingData?.totalPrintCost || 0,
            extraTime: bookingData?.extraTime || 0,
            totalTimeCost: bookingData?.totalTimeCost || 0,
            discountAmount,
            totalBeforeDiscount,
            totalAfterDiscount
        };
    }, [bookingData]);

    const handlePayment = async () => {
        if (!selectedMethod) {
            setError('Mohon pilih metode pembayaran terlebih dahulu.');
            return;
        }

        setError(null);
        setLoading(true);

        const packageIdentifier = bookingData?.package || 'GUEST_PKG';
        const currentBookingId = packageIdentifier + '-' + Date.now();

        if (priceDetails.totalAfterDiscount <= 0) {
            setError('Total pembayaran tidak valid atau nol.');
            setLoading(false);
            return;
        }

        if (selectedMethod === 'qris_doku') {
            try {
                const response = await axios.post('/api/generate-qris', {
                    total_amount: priceDetails.totalAfterDiscount,
                    booking_id: currentBookingId,
                });

                if (response.data.success) {
                    setQrisData({
                        order_id: response.data.order_id,
                        qris_url: response.data.qris_url,
                        amount: priceDetails.totalAfterDiscount,
                    });
                } else {
                    setError(response.data.message || 'Gagal memproses pembayaran QRIS.');
                }
            } catch (err) {
                setError('Terjadi kesalahan koneksi server saat generate QRIS.');
                console.error("QRIS Generation Error:", err);
            }
        } else {
            onNext({
                paymentMethod: selectedMethod,
                ...priceDetails
            });
        }

        setLoading(false);
    };

    // Tampilan Konfirmasi QRIS
    if (qrisData) {
        return (
            <div className="min-h-screen bg-[url('/images/bg.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-5">
                <div className="bg-white/95 border-3 border-amber-600 rounded-2xl p-8 w-full max-w-lg shadow-2xl text-center">
                    <h2 className="text-3xl font-bold text-amber-600 mb-4">
                        Proses Pembayaran QRIS
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        Silakan pindai kode QR di bawah ini menggunakan aplikasi pembayaran Anda (Bank, E-Wallet, dll.)
                    </p>

                    <img
                        src={qrisData.qris_url}
                        alt="DOKU QRIS Code"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = "https://placehold.co/300x300/f0f0f0/333?text=QRIS+Gagal+Muat" 
                        }}
                        className="max-w-xs w-full mx-auto border-4 border-amber-600 rounded-xl p-2 bg-amber-50 mb-6"
                    />

                    <div className="bg-amber-50 border-2 border-amber-600 rounded-xl p-5 mb-6">
                        <p className="text-gray-700 font-semibold text-sm mb-2">
                            Jumlah Pembayaran:
                        </p>
                        <p className="text-3xl font-extrabold text-red-600">
                            Rp {qrisData.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-gray-600 text-sm mt-3">
                            No. Invoice: {qrisData.order_id}
                        </p>
                    </div>

                    <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 mb-6">
                        <p className="text-red-700 font-semibold text-sm">
                            ⚠️ Jangan tutup halaman ini sampai pembayaran terkonfirmasi.
                        </p>
                    </div>

                    <button
                        onClick={() => setQrisData(null)}
                        className="w-full py-2 rounded-full border-2 border-amber-600 bg-transparent text-amber-600 font-bold hover:bg-amber-600 hover:text-white transition"
                    >
                        Pilih Metode Pembayaran Lain
                    </button>
                </div>
            </div>
        );
    }

    // Tampilan Pemilihan Metode Pembayaran
    return (
        <div className="min-h-screen bg-[url('/images/bg.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-4 relative">
            <button
                onClick={onBack}
                className="absolute top-5 left-5 px-5 py-2 rounded-full bg-red-600 text-white font-medium shadow hover:bg-red-700 transition"
            >
                Kembali
            </button>

            <h1 className="text-4xl font-extrabold text-white drop-shadow mt-4 mb-4">
                Pilih Metode Pembayaran
            </h1>

            <div className="bg-white/95 border-3 border-amber-600 rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
                
                {error && (
                    <div className="bg-red-100 border-2 border-red-600 text-red-700 rounded-xl p-4 mb-6 font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {/* Metode Pembayaran */}
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pilih Metode Pembayaran:</h3>
                <div className="mb-6">
                    {paymentMethods.map(method => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`
                                flex items-center justify-between p-5 mb-4 rounded-xl border-3 cursor-pointer transition
                                ${selectedMethod === method.id 
                                    ? 'border-amber-600 bg-amber-50 scale-102' 
                                    : 'border-orange-300 bg-white hover:border-amber-600 hover:bg-amber-50'}
                            `}
                        >
                            <span className="flex items-center text-lg font-semibold text-gray-800">
                                <span className="text-2xl mr-4">{method.icon}</span>
                                {method.name}
                            </span>
                            {selectedMethod === method.id && (
                                <span className="text-2xl text-amber-600 font-bold">✓</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Rincian Harga */}
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Rincian Harga:</h3>
                    
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-gray-700">
                            <span className="font-semibold">{priceDetails.packageName}:</span>
                            <span className="font-semibold">
                                Rp {priceDetails.packagePrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                        
                        {/* Detail Add On */}
                        {priceDetails.addOnPrice > 0 && (
                            <>
                                <div className="bg-white rounded p-3 mb-2">
                                    <p className="font-semibold text-gray-800 mb-2">Add On:</p>
                                    {priceDetails.extraPrints > 0 && (
                                        <div className="flex justify-between text-sm text-gray-700 ml-2">
                                            <span>Cetak Foto Tambahan ({priceDetails.extraPrints} x):</span>
                                            <span>Rp {priceDetails.totalPrintCost.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    {priceDetails.extraTime > 0 && (
                                        <div className="flex justify-between text-sm text-gray-700 ml-2">
                                            <span>Waktu Foto Tambahan ({priceDetails.extraTime} menit):</span>
                                            <span>Rp {priceDetails.totalTimeCost.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between text-gray-700 font-semibold">
                                    <span>Total Add On:</span>
                                    <span>
                                        Rp {priceDetails.addOnPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-gray-800">
                            <span className="font-semibold">Sub Total:</span>
                            <span className="font-bold text-lg">
                                Rp {priceDetails.totalBeforeDiscount.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {priceDetails.discountAmount > 0 && (
                            <div className="flex justify-between text-green-700 font-semibold bg-green-50 p-2 rounded">
                                <span>Diskon Voucher:</span>
                                <span>
                                    - Rp {priceDetails.discountAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="border-t-2 border-amber-600 pt-4 flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-800">Total Pembayaran:</span>
                        <span className="text-3xl font-extrabold text-red-600">
                            Rp {priceDetails.totalAfterDiscount.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {/* Pay Button */}
                <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || loading}
                    className={`
                        w-full py-4 rounded-full text-white font-bold text-lg transition flex items-center justify-center gap-2
                        ${selectedMethod && !loading 
                            ? 'bg-amber-500 hover:bg-amber-600 shadow-lg cursor-pointer' 
                            : 'bg-gray-400 cursor-not-allowed'}
                    `}
                >
                    {loading ? (
                        <>
                            <span className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Memproses...
                        </>
                    ) : 'Lanjut Pembayaran'}
                </button>
            </div>
        </div>
    );
};

export default PilihPembayaran;
