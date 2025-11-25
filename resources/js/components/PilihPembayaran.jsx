import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const paymentMethods = [
    { id: 'qris_doku', name: 'QRIS (DOKU)', icon: '💳' },
    { id: 'transfer_bank', name: 'Transfer Bank (Manual)', icon: '🏦' },
];

const PilihPembayaran = ({ onNext, onBack, bookingData }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [qrisData, setQrisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('PENDING');

    const totalAmount = 25000;

    // --- LOGIKA POLLING (Tetap biarkan berjalan, siapa tahu tiba-tiba sukses) ---
    useEffect(() => {
        let intervalId;
        if (qrisData && qrisData.invoice_number && paymentStatus === 'PENDING') {
            intervalId = setInterval(async () => {
                try {
                    const response = await axios.get(`/api/check-status/${qrisData.invoice_number}`);
                    if (response.data.status === 'SUCCESS') {
                        handleSuccess(); // Panggil fungsi sukses yang sama
                    }
                } catch (err) {
                    // Silent error
                }
            }, 3000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [qrisData, paymentStatus]);

    // --- FUNGSI SUKSES TERPUSAT ---
    const handleSuccess = () => {
        setPaymentStatus('SUCCESS');
        alert("Pembayaran Berhasil! Lanjut ke sesi foto...");
        onNext('LUNAS');
    };

    const handlePayment = async () => {
        if (!selectedMethod) return setError('Pilih metode pembayaran dulu.');
        setLoading(true);
        setError(null);

        if (selectedMethod === 'qris_doku') {
            try {
                const response = await axios.post('/api/generate-qris', {
                    total_amount: totalAmount
                });
                if (response.data.success) {
                    setQrisData({
                        qris_url: response.data.qris_url,
                        invoice_number: response.data.invoice_number,
                        amount: totalAmount
                    });
                } else {
                    setError('Gagal membuat QRIS.');
                }
            } catch (err) {
                setError('Terjadi kesalahan server.');
            }
        } else {
            onNext(selectedMethod);
        }
        setLoading(false);
    };

    // --- TAMPILAN QRIS ---
    if (qrisData) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-5 text-white">
                <div className="bg-white p-8 rounded-xl text-center max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-blue-600 mb-4">Scan QRIS</h2>

                    <div className="bg-white p-2 inline-block border-4 border-blue-500 rounded-lg mb-4">
                        <QRCodeSVG
                            value={qrisData.qris_url}
                            size={256}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>

                    <p className="text-gray-700 font-bold text-xl mb-2">
                        Rp {qrisData.amount.toLocaleString('id-ID')}
                    </p>

                    <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm mb-4 animate-pulse">
                        ⏳ Menunggu pembayaran otomatis...
                    </div>

                    <p className="text-xs text-gray-400 mb-4">Invoice: {qrisData.invoice_number}</p>

                    {/* --- TOMBOL BACKDOOR / DEVELOPER MODE --- */}
                    <div className="border-t border-gray-200 pt-4 mb-4">
                        <p className="text-xs text-red-500 font-bold mb-2">⚠️ DEVELOPER ONLY ⚠️</p>
                        <button
                            onClick={handleSuccess}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full shadow"
                        >
                            [BYPASS] Simulasi Sukses
                        </button>
                        <p className="text-[10px] text-gray-400 mt-1">
                            *Klik ini karena DOKU Simulator sedang tidak tersedia
                        </p>
                    </div>
                    {/* ---------------------------------------- */}

                    <button
                        onClick={() => setQrisData(null)}
                        className="mt-2 text-blue-500 underline text-sm hover:text-blue-700"
                    >
                        Batalkan / Kembali
                    </button>
                </div>
            </div>
        );
    }

    // ... (Bagian render "Pilih Metode" di bawah biarkan sama, tidak perlu diubah)
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/images/bg.jpg')] bg-cover"
            style={{
                    minHeight: '100vh',
                    backgroundImage: 'url("/images/bg.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                }}
                >
             {/* ... Kode UI Pilih Metode Pembayaran Lama Anda ... */}
             {/* Copy dari file sebelumnya untuk bagian ini, karena tidak berubah */}
             <button onClick={onBack} className="absolute top-5 left-5 px-5 py-2 rounded-full bg-red-500 text-white">
                Kembali
             </button>

             <div className="bg-white/90 p-8 rounded-2xl max-w-lg w-full text-center">
                <h1 className="text-2xl font-bold text-blue-600 mb-6">Metode Pembayaran</h1>

                {error && <div className="bg-red-100 text-red-600 p-2 mb-4 rounded">{error}</div>}

                {paymentMethods.map(method => (
                    <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 mb-3 border-2 rounded-xl cursor-pointer flex items-center justify-between
                            ${selectedMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
                        `}
                    >
                        <span className="text-xl font-bold">{method.icon} {method.name}</span>
                        {selectedMethod === method.id && <span className="text-blue-600 font-bold">✓</span>}
                    </div>
                ))}

                <div className="mt-6 p-4 border-dashed border-2 border-blue-300 bg-blue-50 rounded-xl">
                    <p className="text-gray-600">Total Tagihan</p>
                    <p className="text-3xl font-bold text-blue-700">Rp {totalAmount.toLocaleString()}</p>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                    {loading ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
             </div>
        </div>
    );
};

export default PilihPembayaran;
