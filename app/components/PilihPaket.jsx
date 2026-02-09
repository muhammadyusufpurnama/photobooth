'use client';

// resources/js/components/PilihPaket.jsx
import React, { useState } from "react";

const PilihPaket = ({ onNext, onBack }) => {
    // State untuk paket yang dipilih
    const [selectedPackage, setSelectedPackage] = useState(null);

    // Data Paket: Hanya disisakan 1 paket
    const packages = [
        {
            id: "vintage", // ID paket
            name: "Paket Photobooth", // Nama disesuaikan karena cuma satu
            description:
                "unlimited retake, dengan hasil print dan soft file 4-6 foto, terdiri dari photo live, gif, foto frame dan foto mentahan dimana waktu take adalah 5 menit. Hasil print sebanyak 2 lembar.",
            price: 1000, // Harga contoh (bisa Anda sesuaikan)
        },
    ];

    const handleContinue = () => {
        const pkg = packages.find(p => p.id === selectedPackage);
        if (pkg) return onNext(pkg);
        alert("Silakan klik paket untuk memilihnya terlebih dahulu.");
    };

    return (
        <div
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
            }}
            className="relative"
        >
            {/* Tombol Kembali */}
            <button
                onClick={onBack}
                className="
                    absolute top-5 left-5
                    px-5 py-2
                    rounded-full
                    bg-red-500 text-white
                    shadow-md
                    transition-all duration-200
                    hover:bg-red-700
                    cursor-pointer
                    z-10
                "
            >
                Kembali
            </button>

            {/* Container Paket - Diubah dari Grid ke Flex Center agar di tengah */}
            <div className="flex justify-center w-full mb-12">
                {packages.map((pkg) => {
                    const active = selectedPackage === pkg.id;
                    return (
                        <div
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            // max-w-md agar kartu tidak terlalu lebar saat sendirian
                            className={`
                                cursor-pointer
                                p-8 rounded-xl shadow-lg
                                flex flex-col justify-between
                                w-full max-w-md
                                min-h-[280px]
                                transition-all duration-300

                                ${
                                    active
                                        ? "bg-amber-50/95 border-4 border-amber-600 scale-105 shadow-amber-300"
                                        : "bg-amber-50/80 border-4 border-amber-400 hover:scale-105 hover:shadow-xl"
                                }
                            `}
                        >
                            <div>
                                <h2 className="text-3xl font-bold text-amber-700 mb-4 text-center">
                                    {pkg.name}
                                </h2>

                                <p className="text-gray-800 text-lg leading-relaxed mb-6 text-center">
                                    {pkg.description}
                                </p>
                            </div>

                            <div
                                className="
                                    flex justify-between items-center
                                    border-t border-amber-300/50
                                    pt-6
                                "
                            >
                                <p className="text-3xl font-bold text-black">
                                    Rp {pkg.price.toLocaleString("id-ID")}
                                </p>

                                <span className={`text-4xl font-bold transition-colors duration-300 ${active ? 'text-green-600' : 'text-gray-400'}`}>
                                    {active ? '✓' : '➔'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tombol Lanjut */}
            <button
                onClick={handleContinue}
                className="
                    px-12 py-3
                    rounded-full
                    border-2 border-white
                    text-white
                    bg-white/20
                    backdrop-blur-sm
                    text-xl font-bold
                    shadow-md
                    transition-all duration-200
                    hover:bg-white/30
                    cursor-pointer
                "
            >
                Lanjut ➔
            </button>
        </div>
    );
};

export default PilihPaket;
