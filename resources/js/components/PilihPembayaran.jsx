// resources/js/components/PilihPembayaran.jsx

import React, { useState } from 'react';
import axios from 'axios';
// import Layout from './Layout'; <-- Dihapus karena tidak dapat di-resolve

// Hapus LARAVEL_BASE_URL. Cukup gunakan URL relatif untuk memanfaatkan proxy Vite.
// const LARAVEL_BASE_URL = window.location.origin;


const paymentMethods = [
    { id: 'qris_doku', name: 'QRIS (DOKU)', name_display: 'QRIS (DOKU)', icon: '💳' },
    { id: 'transfer_bank', name: 'Transfer Bank (Manual)', name_display: 'Transfer Bank (Manual)', icon: '🏦' },
    // Tambahkan metode lain jika diperlukan
];

// Dibuat sebagai komponen mandiri tanpa Layout eksternal
const PilihPembayaran = ({ onNext, onBack, bookingData }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [qrisData, setQrisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // TODO: Hitung total biaya yang sebenarnya dari bookingData
    const calculateTotalAmount = () => {
        // Logika sederhana: paket 10000 + addon 2000
        const packagePrice = 10000;
        const addOnPrice = 2000;
        return packagePrice + addOnPrice;
    };

    const totalAmount = calculateTotalAmount();

    // Fungsi untuk memanggil API Laravel
    const handlePayment = async () => {
        if (!selectedMethod) {
            setError('Mohon pilih metode pembayaran terlebih dahulu.');
            return;
        }

        setError(null);
        setLoading(true);

        // --- PERBAIKAN LOGIC: Fallback untuk bookingData jika undefined ---
        const packageIdentifier = bookingData?.package || 'GUEST_PKG';
        const currentBookingId = packageIdentifier + '-' + Date.now();

        // Cek jika totalAmount 0, beri error atau gunakan minimal
        if (totalAmount <= 0) {
            setError('Total pembayaran tidak valid atau nol.');
            setLoading(false);
            return;
        }
        // --- AKHIR PERBAIKAN LOGIC ---


        if (selectedMethod === 'qris_doku') {
            try {
                // Panggil endpoint Laravel untuk generate QRIS menggunakan URL RELATIF: /api/generate-qris
                // Ini akan di-proxy oleh Vite ke http://127.0.0.1:8000/api/generate-qris
                const response = await axios.post('/api/generate-qris', {
                    total_amount: totalAmount,
                    booking_id: currentBookingId, // Menggunakan ID yang sudah diperiksa
                    // Sertakan data booking lainnya jika diperlukan
                });

                if (response.data.success) {
                    setQrisData({
                        order_id: response.data.order_id,
                        qris_url: response.data.qris_url,
                        amount: totalAmount,
                        // Tambahkan data DOKU lainnya jika ada
                    });
                } else {
                    // Jika controller menerima request tapi DOKU API gagal
                    setError(response.data.message || 'Gagal memproses pembayaran QRIS.');
                }
            } catch (err) {
                // Menangkap ERR_NETWORK atau timeout (koneksi ke Laravel gagal)
                setError('Terjadi kesalahan koneksi server saat generate QRIS. (Coba cek konsol browser)');
                console.error("QRIS Generation Error:", err);
            }
        } else {
            // Untuk metode pembayaran non-QRIS (misal: Transfer Manual)
            onNext(selectedMethod);
        }

        setLoading(false);
    };

    // Tampilan Konfirmasi QRIS
    if (qrisData) {
        return (
            // Container utama dengan latar belakang dan centering
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="p-8 w-full max-w-md bg-white rounded-xl shadow-2xl text-center border-t-4 border-green-500">
                    <h2 className="text-2xl font-bold mb-4 text-green-700">Proses Pembayaran QRIS</h2>
                    <p className="mb-4 text-gray-600">Silakan pindai kode QR di bawah ini menggunakan aplikasi pembayaran Anda (Bank, E-Wallet, dll.).</p>

                    <img
                        src={qrisData.qris_url}
                        alt="DOKU QRIS Code"
                        // Placeholder image jika URL QRIS gagal
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x300/f0f0f0/333?text=QRIS+Gagal+Muat" }}
                        className="w-full max-w-xs mx-auto my-6 border-4 border-gray-100 p-2 rounded-lg shadow-inner"
                    />

                    <p className="font-semibold text-xl mb-1 text-gray-800">Jumlah: <span className="text-red-600">Rp {qrisData.amount.toLocaleString('id-ID')}</span></p>
                    <p className="text-sm text-gray-500 mb-6">No. Invoice: {qrisData.order_id}</p>
                    <p className="text-sm text-red-500 mt-4 p-2 bg-red-50 rounded-md">Jangan tutup halaman ini sampai pembayaran terkonfirmasi.</p>

                    <button
                        onClick={() => setQrisData(null)} // Kembali ke pemilihan
                        className="mt-6 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                        Pilih Metode Pembayaran Lain
                    </button>
                </div>
            </div>
        );
    }


    // Tampilan Pemilihan Metode Pembayaran
    return (
        // Container utama dengan latar belakang dan centering
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="p-8 w-full max-w-md bg-white rounded-xl shadow-2xl border-t-4 border-blue-500">
                <h1 className="text-2xl font-bold mb-6 text-[#1b1b18] border-b pb-2 text-center">Pilih Metode Pembayaran</h1>

                {onBack && (
                    <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4 transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Kembali
                    </button>
                )}

                {/* Tampilan error yang lebih menonjol */}
                {error && <div className="text-red-700 mb-4 border border-red-300 p-3 bg-red-100 rounded-lg font-medium text-sm animate-pulse">{error}</div>}

                <div className="space-y-4 mb-8">
                    {paymentMethods.map(method => (
                        <div
                            key={method.id}
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
                                selectedMethod === method.id
                                    ? 'border-blue-600 bg-blue-50 shadow-lg scale-[1.02]'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedMethod(method.id)}
                        >
                            <span className="text-lg font-medium text-gray-700 flex items-center">
                                <span className="mr-2 text-xl">{method.icon}</span>
                                {method.name_display}
                            </span>
                            {selectedMethod === method.id && (
                                <span className="text-blue-600 font-extrabold text-xl">✓</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center mb-6 p-4 bg-blue-50 rounded-lg border-dashed border-blue-300 border-2">
                    <p className="text-lg font-semibold text-[#1b1b18]">Total Pembayaran:</p>
                    <p className="text-4xl font-extrabold text-red-600">Rp {totalAmount.toLocaleString('id-ID')}</p>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium shadow-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                        </>
                    ) : 'Lanjut Pembayaran'}
                </button>
            </div>
        </div>
    );
};

export default PilihPembayaran;
