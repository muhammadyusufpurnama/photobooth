// resources/js/components/AddOn.jsx
'use client';

import React, { useState, useMemo } from "react";

const AddOn = ({ onNext, onBack, selectedPackage }) => {
    const [extraPrints, setExtraPrints] = useState(0);

    const hargapaket = selectedPackage?.price || 25000;
    const pricePerPrint = 10000;

    const totalPrintCost = useMemo(
        () => (extraPrints * pricePerPrint) + hargapaket,
        [extraPrints, hargapaket]
    );

    const handleContinue = () => {
        onNext({
            extraPrints,
            totalPrintCost,
            grandTotal: totalPrintCost
        });
    };

    const handleIncrease = () => setExtraPrints(prev => prev + 1);
    const handleDecrease = () => setExtraPrints(prev => Math.max(0, prev - 1));

    return (
        <div
            className="h-screen w-full overflow-hidden relative flex flex-col items-center justify-center"
            style={{
                backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Tombol Kembali */}
            <button
                onClick={onBack}
                className="absolute top-5 left-5 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium shadow hover:bg-red-700 transition cursor-pointer z-10"
            >
                Kembali
            </button>

            {/* Judul Halaman */}
            <h1 className="text-3xl text-white font-extrabold drop-shadow mb-6">
                Add On
            </h1>

            {/* COMPACT CARD: Semua kontrol ada di sini */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-500 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">

                {/* Judul Item */}
                <h2 className="text-xl font-bold text-amber-700 mb-1">
                    Cetak Foto Tambahan
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                    Rp {pricePerPrint.toLocaleString("id-ID")} / lembar
                </p>

                {/* Counter Control */}
                <div className="flex items-center justify-center gap-6 mb-8 w-full">
                    <button onClick={handleDecrease} className="w-10 h-10 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center hover:bg-amber-700 transition cursor-pointer shadow-md"> - </button>

                    <div className="w-16 text-center">
                        <span className="text-4xl font-bold text-gray-800">
                            {extraPrints}
                        </span>
                    </div>

                    <button onClick={handleIncrease} className="w-10 h-10 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center hover:bg-amber-700 transition cursor-pointer shadow-md"> + </button>
                </div>

                {/* Total & Divider */}
                <div className="w-full border-t border-dashed border-gray-300 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 font-medium">Total Biaya</span>
                        <span className="text-2xl font-bold text-amber-700">
                            Rp {totalPrintCost.toLocaleString("id-ID")}
                        </span>
                    </div>
                </div>

                {/* Tombol Lanjut (Full Width di dalam card) */}
                <button
                    onClick={handleContinue}
                    className="
                        w-full py-3 rounded-xl
                        bg-amber-600 text-white font-bold text-lg
                        shadow-lg hover:bg-amber-700 hover:shadow-xl
                        transition-all duration-200 transform active:scale-95
                        cursor-pointer flex justify-center items-center gap-2
                    "
                >
                    Lanjut ➔
                </button>
            </div>
        </div>
    );
};

export default AddOn;
