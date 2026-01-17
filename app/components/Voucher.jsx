'use client';

// resources/js/components/Voucher.jsx
import React, { useState } from "react";

const Voucher = ({ onNext, onBack }) => {
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);

    const handleApplyVoucher = () => {
        if (!voucherCode.trim()) {
            alert("Silakan masukkan kode voucher");
            return;
        }
        setAppliedVoucher(voucherCode);
        alert(`Voucher "${voucherCode}" berhasil diterapkan!`);
    };

    const handleContinue = () => {
        onNext(voucherCode);
    };

    return (
        <div className="
            min-h-screen bg-[url('/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg')] bg-cover bg-center
            flex flex-col items-center justify-center p-5 relative
        "
            style={{
                    minHeight: '100vh',
                    backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                }}>
            {/* Back Button */}
            <button
                onClick={onBack}
                className="
                    absolute top-5 left-5 px-5 py-2 rounded-full
                    bg-amber-600 text-white font-medium shadow
                    hover:bg-amber-700 transition
                "
            >
                Kembali
            </button>

            {/* Title */}
            <h1 className="text-4xl font-extrabold text-white drop-shadow mb-10">
                Voucher
            </h1>

            {/* Voucher Card */}
            <div className="
                bg-white/90 border-2 border-amber-600 rounded-2xl shadow-xl
                p-8 w-full max-w-lg
            ">
                <h2 className="text-xl font-bold text-amber-600 mb-2">
                    Isi Voucher Jika Ada
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                    Kode voucher (opsional)
                </p>

                {/* Input */}
                <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Masukkan kode voucher Anda"
                    className="
                        w-full p-3 rounded-xl border-2 border-green-300
                        focus:border-amber-600 outline-none transition
                        text-gray-700
                    "
                />

                {/* Applied Voucher Notification */}
                {appliedVoucher && (
                    <div className="
                        bg-green-100 border-2 border-green-500 text-green-700
                        rounded-xl p-3 mt-4 font-semibold text-sm
                    ">
                        ✓ Voucher "{appliedVoucher}" berhasil diterapkan
                    </div>
                )}

                {/* Apply Button */}
                <button
                    onClick={handleApplyVoucher}
                    className="
                        w-full mt-6 py-3 rounded-full bg-green-400 text-white
                        font-bold text-lg shadow hover:bg-green-500 transition
                    "
                >
                    Gunakan Kode Voucher
                </button>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                className="
                    mt-10 px-10 py-3 rounded-full text-white font-bold text-lg
                    bg-white/20 border border-white shadow
                    hover:bg-white/30 transition
                "
            >
                Lanjut ➔
            </button>
        </div>
    );
};

export default Voucher;
