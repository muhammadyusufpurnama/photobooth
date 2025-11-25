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
            price: 12000,
        },
        {
            id: "retro",
            name: "Paket Retro",
            description:
                "Paket photobooth Retro, unlimited retake, dengan 12 hasil print foto dan waktu 15 menit.",
            price: 19000,
        },
    ];

    const handleContinue = () => {
        if (selectedPackage) return onNext(selectedPackage);
        alert("Silakan pilih paket terlebih dahulu.");
    };

    return (
        <div
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
                                p-7 rounded-xl shadow-lg
                                flex flex-col justify-between
                                min-h-[260px]
                                transition-all duration-300

                                ${
                                    active
                                        ? "bg-amber-50/95 border-4 border-amber-600 scale-105 shadow-amber-300"
                                        : "bg-amber-50/80 border-4 border-amber-400 hover:scale-105 hover:shadow-xl"
                                }
                            `}
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-amber-700 mb-3">
                                    {pkg.name}
                                </h2>

                                <p className="text-gray-700 leading-relaxed mb-5">
                                    {pkg.description}
                                </p>
                            </div>

                            <div
                                className="
                                    flex justify-between items-center
                                    border-t border-amber-300/50
                                    pt-4
                                "
                            >
                                <p className="text-2xl font-bold text-black">
                                    Rp {pkg.price.toLocaleString("id-ID")}
                                </p>

                                <span className="text-3xl font-bold text-red-600">
                                    ➔
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
        </div>
    );
};

export default PilihPaket;
