// resources/js/components/Voucher.jsx
import React, { useState } from "react";

const Voucher = ({ onNext, onBack, bookingData }) => {
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Dummy voucher codes dan diskon
    const voucherList = {
        "PROMO10": 10,  // 10% discount
        "PROMO20": 20,  // 20% discount
        "DISCOUNT5000": 5000  // Flat 5000 discount
    };

    const handleApplyVoucher = () => {
        if (!voucherCode.trim()) {
            alert("Silakan masukkan kode voucher");
            return;
        }

        if (voucherList[voucherCode.toUpperCase()]) {
            const discount = voucherList[voucherCode.toUpperCase()];
            setAppliedVoucher(voucherCode);
            
            // Hitung diskon (persentase atau flat)
            if (discount < 100) {
                // Persentase diskon
                const totalAmount = (bookingData?.packagePrice || 0) + (bookingData?.addOnPrice || 0);
                const finalDiscount = Math.round((totalAmount * discount) / 100);
                setDiscountAmount(finalDiscount);
            } else {
                // Flat discount
                setDiscountAmount(discount);
            }
            alert(`Voucher "${voucherCode}" berhasil diterapkan!`);
        } else {
            alert("Kode voucher tidak valid");
            setAppliedVoucher(null);
            setDiscountAmount(0);
        }
    };

    const handleContinue = () => {
        onNext({
            voucherCode: appliedVoucher || "",
            discountAmount
        });
    };

    return (
        <div className="
            min-h-screen bg-[url('/images/bg.jpg')] bg-cover bg-center 
            flex flex-col items-center justify-center p-5 relative
        ">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="
                    absolute top-5 left-5 px-5 py-2 rounded-full 
                    bg-red-600 text-white font-medium shadow 
                    hover:bg-red-700 transition
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
                        w-full p-3 rounded-xl border-2 border-amber-300 
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
                        <br />
                        Diskon: Rp {discountAmount.toLocaleString("id-ID")}
                    </div>
                )}

                {/* Apply Button */}
                <button
                    onClick={handleApplyVoucher}
                    className="
                        w-full mt-6 py-3 rounded-full bg-green-500 text-white 
                        font-bold text-lg shadow hover:bg-green-600 transition
                    "
                >
                    Gunakan Kode Voucher
                </button>

                {/* Info Voucher */}
                <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-600 rounded">
                    <p className="text-xs text-gray-600 font-semibold mb-2">Contoh kode voucher:</p>
                    <ul className="text-xs text-gray-600">
                        <li>• PROMO10 (diskon 10%)</li>
                        <li>• PROMO20 (diskon 20%)</li>
                        <li>• DISCOUNT5000 (diskon Rp 5.000)</li>
                    </ul>
                </div>
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
