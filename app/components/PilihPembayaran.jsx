'use client';

import React, { useState } from 'react';
import axios from 'axios';

const PilihPembayaran = ({ onNext, onBack, bookingData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Mengambil total harga dari data booking
    const totalAmount = bookingData?.grandTotal || 25000;

    const handlePayment = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/doku/token', {
                amount: totalAmount,
                orderId: `PHOTO-${Date.now()}`,
                email: "guest@photobooth.com"
            });

            const { payment_url, order_id } = response.data;

            if (payment_url) {
                // --- BAGIAN KRUSIAL ---
                // 1. Tandai bahwa kita sedang menunggu pembayaran
                localStorage.setItem('DOKU_IS_WAITING', 'true');
                localStorage.setItem('DOKU_ONGOING_ORDER', order_id);
                
                // 2. Simpan bookingData agar tidak hilang saat refresh
                localStorage.setItem('TEMP_BOOKING_DATA', JSON.stringify(bookingData));
                
                // 3. Redirect ke DOKU
                window.location.href = payment_url;
            } else {
                throw new Error("Gagal mendapatkan URL pembayaran.");
            }

        } catch (err) {
            console.error("DOKU Error:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Fitur untuk developer melewati pembayaran saat testing di localhost
    const handleDevBypass = () => {
        if (confirm("DEV MODE: Apakah Anda ingin melewati pembayaran dan langsung ke sesi foto?")) {
            onNext('LUNAS_DEV_BYPASS');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative p-4"
             style={{ backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")', backgroundSize: 'cover' }}>

            {/* Overlay Gelap */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>

            {/* Tombol Kembali */}
            <button 
                onClick={onBack} 
                className="absolute top-5 left-5 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md border border-white/30 transition z-20"
            >
                ← Kembali
            </button>

            {/* Tombol Rahasia Dev Bypass */}
            <button 
                onClick={handleDevBypass} 
                className="absolute bottom-5 right-5 text-[10px] text-white/20 hover:text-white transition z-20"
            >
                🛠 Bypass
            </button>

            {/* Kartu Pembayaran */}
            <div className="bg-white rounded-[2rem] max-w-md w-full text-center shadow-2xl overflow-hidden z-10 relative border border-white/20">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="https://cdn.doku.com/doku-com-assets/logo/doku_logo.png" 
                            alt="DOKU Payment" 
                            className="h-8 object-contain"
                        />
                    </div>

                    <h1 className="text-2xl font-black text-gray-800 mb-1">Konfirmasi Pembayaran</h1>
                    <p className="text-gray-500 text-sm mb-8">Pilih metode pembayaran favoritmu di halaman berikutnya</p>

                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                        <span className="text-slate-400 block text-xs uppercase tracking-[0.2em] mb-2 font-bold">Total Pembayaran</span>
                        <span className="text-4xl font-black text-slate-800">
                            Rp {totalAmount.toLocaleString('id-ID')}
                        </span>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className={`w-full py-4 font-black text-lg rounded-2xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3
                            ${loading 
                                ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Menyiapkan Halaman...</span>
                            </>
                        ) : (
                            'LANJUT KE PEMBAYARAN'
                        )}
                    </button>

                    <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Securely Processed by DOKU
                    </p>
                </div>
            </div>
        </div>
    );
};

// PENTING: Jangan hapus baris export default ini
export default PilihPembayaran;