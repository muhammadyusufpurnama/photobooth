// resources/js/components/PilihPaket.jsx
import React, { useState } from "react";

const PilihPaket = ({ onNext, onBack }) => {
    const [selectedPackage, setSelectedPackage] = useState(null);

    const packages = [
        {
            id: "vintage",
            name: "Paket Vintage",
            description:
                "Paket photobooth Vintage, unlimited retake, dengan 12 hasil print foto dan waktu 12 menit.",
            price: 120000,
        },
        {
            id: "retro",
            name: "Paket Retro",
            description:
                "Paket photobooth Retro, unlimited retake, dengan 12 hasil print foto dan waktu 15 menit.",
            price: 190000,
        },
    ];

    const handleContinue = () => {
        if (selectedPackage) {
            const selected = packages.find((pkg) => pkg.id === selectedPackage);
            return onNext({
                id: selected.id,
                name: selected.name,
                price: selected.price,
            });
        }
        alert("Silakan pilih paket terlebih dahulu.");
    };

    return (
        <div
            className="
                min-h-screen 
                bg-[url('/images/bg.jpg')] bg-cover bg-center bg-no-repeat
                flex flex-col items-center justify-center 
                px-5 py-10 
                relative
            "
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
                "
            >
                Kembali
            </button>

            {/* Title */}
            <h1
                className="
                    font-bestian 
                    text-white font-bold text-3xl md:text-4xl
                    mb-12 
                    drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)]
                    text-center
                "
            >
                Pilih Paket Photobooth
            </h1>

            {/* Grid Paket */}
            <div
                className="
                    grid 
                    grid-cols-1 md:grid-cols-2
                    gap-8 
                    max-w-4xl w-full
                    mb-12
                "
            >
                {packages.map((pkg) => {
                    const active = selectedPackage === pkg.id;
                    return (
                        <div
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            className={`
                                cursor-pointer 
                                p-7 rounded-xl 
                                flex flex-col justify-between
                                min-h-[260px]
                                transition-all duration-300
                                relative

                                ${
                                    active
                                        ? "bg-white/95 border-4 border-amber-600 scale-105"
                                        : "bg-white/85 border-4 border-orange-400 hover:scale-105"
                                }
                            `}
                            style={
                                active
                                    ? {
                                        boxShadow: `
                                            0 0 30px rgba(217, 119, 6, 0.8),
                                            0 0 60px rgba(217, 119, 6, 0.5),
                                            0 0 90px rgba(217, 119, 6, 0.3),
                                            0 10px 40px rgba(0, 0, 0, 0.3)
                                        `,
                                      }
                                    : {
                                        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.15)`,
                                      }
                            }
                        >
                            {/* Efek Glow Background */}
                            {active && (
                                <div
                                    className="
                                        absolute inset-0 rounded-xl
                                        opacity-0 animate-pulse
                                    "
                                    style={{
                                        background: `radial-gradient(circle, rgba(217, 119, 6, 0.3) 0%, transparent 70%)`,
                                        animation: "glow 2s ease-in-out infinite",
                                    }}
                                />
                            )}

                            {/* Content */}
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-amber-600 mb-3">
                                    {pkg.name}
                                </h2>

                                <p className="text-gray-700 leading-relaxed mb-5 text-sm">
                                    {pkg.description}
                                </p>
                            </div>

                            <div
                                className="
                                    flex justify-between items-center 
                                    border-t border-gray-300 
                                    pt-4
                                    relative z-10
                                "
                            >
                                <p className="text-2xl font-bold text-red-600">
                                    Rp {pkg.price.toLocaleString("id-ID")}
                                </p>

                                {active && (
                                    <span className="text-2xl text-amber-600 font-bold animate-bounce">
                                        ✓
                                    </span>
                                )}
                                {!active && (
                                    <span className="text-3xl font-bold text-gray-400">
                                        ➔
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tombol Lanjut */}
            <button
                onClick={handleContinue}
                className="
                    px-10 py-3 
                    rounded-full 
                    border-2 border-white 
                    text-white 
                    bg-white/20 
                    backdrop-blur-sm
                    text-lg font-bold
                    shadow-md
                    transition-all duration-200
                    hover:bg-white/30
                "
            >
                Lanjut ➔
            </button>

            {/* CSS Keyframes untuk Glow Effect */}
            <style>{`
                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(217, 119, 6, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(217, 119, 6, 0.8);
                    }
                }
            `}</style>
        </div>
    );
};

export default PilihPaket;
