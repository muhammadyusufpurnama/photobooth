// resources/js/components/AddOn.jsx
import React, { useState, useMemo } from "react";

const AddOn = ({ onNext, onBack, bookingData }) => {
    const [extraPrints, setExtraPrints] = useState(0);
    const [extraTime, setExtraTime] = useState(0);

    const pricePerPrint = 20000;
    const pricePerMinute = 12000;

    const handleChange = (setter, value) => {
        setter(prev => Math.max(0, prev + value));
    };

    const totalPrintCost = useMemo(
        () => extraPrints * pricePerPrint,
        [extraPrints]
    );

    const totalTimeCost = useMemo(
        () => extraTime * pricePerMinute,
        [extraTime]
    );

    const grandTotal = useMemo(
        () => totalPrintCost + totalTimeCost,
        [totalPrintCost, totalTimeCost]
    );

    const handleContinue = () => {
        onNext({
            extraPrints,
            extraTime,
            totalPrintCost,
            totalTimeCost,
            addOnPrice: grandTotal
        });
    };

    return (
        <div className="min-h-screen bg-[url('/images/bg.jpg')] bg-cover bg-center p-5 flex flex-col items-center justify-center relative">
            
            {/* Back */}
            <button
                onClick={onBack}
                className="absolute top-5 left-5 px-5 py-2 rounded-full bg-red-600 text-white font-medium shadow hover:bg-red-700 transition"
            >
                Kembali
            </button>

            <h1 className="text-4xl text-white font-extrabold drop-shadow mb-10">
                Add On
            </h1>

            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mb-10">

                {/* Card – Cetak Foto Tambahan */}
                <div className="bg-white/80 border-2 border-amber-600 rounded-2xl p-6 w-80 shadow-xl flex flex-col text-center">
                    <h2 className="text-xl font-bold text-amber-600 mb-2">
                        Cetak Foto Tambahan
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Rp {pricePerPrint.toLocaleString("id-ID")} per cetak
                    </p>

                    <img
                        src="/images/add-on-prints.png"
                        className="w-32 mx-auto rounded-xl mb-5"
                        alt="Cetak Foto Tambahan"
                    />

                    <div className="flex items-center justify-center gap-4 mb-5">
                        <button
                            onClick={() => handleChange(setExtraPrints, -1)}
                            className="w-10 h-10 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center hover:bg-amber-700 transition"
                        >
                            −
                        </button>

                        <span className="text-3xl font-bold text-black w-12 text-center">
                            {extraPrints}
                        </span>

                        <button
                            onClick={() => handleChange(setExtraPrints, 1)}
                            className="w-10 h-10 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center hover:bg-amber-700 transition"
                        >
                            +
                        </button>
                    </div>

                    <p className="text-2xl font-bold text-black">
                        Rp {totalPrintCost.toLocaleString("id-ID")}
                    </p>
                </div>

                {/* Card – Waktu Foto Tambahan */}
                <div className="bg-white/80 border-2 border-amber-600 rounded-2xl p-6 w-80 shadow-xl flex flex-col text-center">
                    <h2 className="text-xl font-bold text-amber-600 mb-2">
                        Waktu Foto Tambahan
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Rp {pricePerMinute.toLocaleString("id-ID")} per menit
                    </p>

                    <img
                        src="/images/add-on-time.png"
                        className="w-32 mx-auto rounded-xl mb-5"
                        alt="Waktu Foto Tambahan"
                    />

                    <div className="flex items-center justify-center gap-4 mb-5">
                        <button
                            onClick={() => handleChange(setExtraTime, -1)}
                            className="w-10 h-10 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center hover:bg-amber-700 transition"
                        >
                            −
                        </button>

                        <span className="text-3xl font-bold text-black w-12 text-center">
                            {extraTime}
                        </span>

                        <button
                            onClick={() => handleChange(setExtraTime, 1)}
                            className="w-10 h-10 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center hover:bg-amber-700 transition"
                        >
                            +
                        </button>
                    </div>

                    <p className="text-2xl font-bold text-black">
                        Rp {totalTimeCost.toLocaleString("id-ID")}
                    </p>
                </div>
            </div>

            {/* Summary / Ringkasan Total */}
            <div className="bg-white/20 backdrop-blur-md border border-white text-white px-8 py-4 rounded-2xl shadow mb-8 text-center">
                <h3 className="text-xl font-semibold mb-1">Total Add On</h3>
                <p className="text-3xl font-extrabold">
                    Rp {grandTotal.toLocaleString("id-ID")}
                </p>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                className="
                    px-10 py-3 rounded-full text-white font-bold text-lg
                    bg-white/20 border border-white shadow
                    hover:bg-white/30 transition
                "
            >
                Lanjut ➔
            </button>
        </div>
    );
};

export default AddOn;
