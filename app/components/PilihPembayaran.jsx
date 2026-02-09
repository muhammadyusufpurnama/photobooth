'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PilihPembayaran = ({ onNext, onBack, bookingData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snapReady, setSnapReady] = useState(false);

    // Ambil totalAmount
    const totalAmount = bookingData?.grandTotal || 25000;

    // 1. Load Script Midtrans Snap
    useEffect(() => {
        const loader = () => {
            if (window.snap) {
                setSnapReady(true);
            } else {
                const script = document.createElement('script');
                script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
                
                // MODIFIKASI 1: Gunakan Env Variable agar aman & sinkron dengan .env
                const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY; 
                
                script.setAttribute('data-client-key', clientKey);
                script.async = true;
                script.onload = () => setSnapReady(true);
                document.head.appendChild(script);
            }
        };
        loader();
    }, []);


    const handlePayment = async () => {
        if (!snapReady) {
            alert("Sistem pembayaran sedang disiapkan, mohon tunggu sebentar...");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/midtrans/token', {
                amount: totalAmount
            });

            const snapToken = response.data.token || response.data.snap_token;

            if (snapToken && window.snap) {
                window.snap.pay(snapToken, {
                    // 1. JIKA SUKSES BENERAN (Pakai Trik BCA tadi)
                    onSuccess: (result) => {
                        console.log("Payment Success", result);
                        onNext('LUNAS');
                    },
                    
                    // 2. JIKA PENDING (Dianggap Sukses juga buat dev)
                    onPending: (result) => {
                        console.log("Payment Pending", result);
                        // UBAH DISINI: Langsung bypass aja kalau pending (biar ga nunggu)
                        if (confirm("DEV MODE: Transaksi Pending. Anggap Lunas?")) {
                             onNext('LUNAS_VIA_PENDING');
                        }
                    },

                    // 3. JIKA ERROR
                    onError: (result) => {
                        console.error("Payment Error", result);
                        // Jangan langsung alert, cek dulu statusnya
                        setLoading(false);
                    },

                    // 4. JIKA DI-CLOSE (Klik tanda Silang X)
                    onClose: () => {
                        console.log("Popup closed via X button");
                        
                        // Fitur BYPASS Paksa
                        // Gunakan confirm agar user sadar ini mode dev
                        const isBypass = confirm("DEV MODE: Pembayaran belum selesai. Apakah Anda ingin LEWATI pembayaran dan lanjut foto?");
                        
                        if (isBypass) {
                            onNext('DEV_BYPASS');
                        } else {
                            setLoading(false);
                        }
                    }
                });
            } else {
                throw new Error("Gagal mendapatkan token.");
            }

        } catch (err) {
            console.error("Payment Error:", err);
            const errMsg = err.response?.data?.message || err.message || "Gagal menghubungi server.";
            setError(errMsg);
            setLoading(false);
        }
    };

    const handleDevBypass = () => {
        if (confirm("DEV MODE: Lewati pembayaran dan lanjut ke foto?")) {
            onNext('DEV_BYPASS');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative"
             style={{ backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")', backgroundSize: 'cover' }}>

            <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

            <button onClick={onBack} className="absolute top-5 left-5 px-5 py-2 rounded-full bg-red-500 text-white font-bold shadow-lg z-10">
                Kembali
            </button>

            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border-2 border-amber-500 z-10 relative">
                <h1 className="text-3xl font-extrabold text-amber-700 mb-2">Konfirmasi</h1>
                <p className="text-gray-500 mb-6">Selesaikan pembayaran untuk mulai berfoto</p>

                <div className="bg-amber-100 p-6 rounded-2xl mb-8 border-2 border-amber-200">
                    <span className="text-gray-600 block text-sm uppercase tracking-widest mb-1">Total Tagihan</span>
                    <span className="text-4xl font-black text-amber-800">
                        Rp {totalAmount.toLocaleString('id-ID')}
                    </span>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={loading || !snapReady}
                    className={`w-full py-4 font-bold text-xl rounded-2xl transition-all transform active:scale-95 shadow-xl 
                        ${(loading || !snapReady) 
                            ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                >
                    {loading ? 'Memproses...' : (!snapReady ? 'Memuat Sistem...' : 'BAYAR SEKARANG')}
                </button>

                <p className="mt-4 text-xs text-gray-400">Powered by Midtrans Sandbox</p>
            </div>
        </div>
    );
};

export default PilihPembayaran;