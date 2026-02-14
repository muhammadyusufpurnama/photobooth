// File: app/api/midtrans/token/route.js

import Midtrans from "midtrans-client";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { amount } = await request.json();

        // --- 1. LOGIKA PEMILIHAN ENVIRONMENT (OPSI B) ---
        
        // Cek apakah mode Production aktif? (Konversi string 'true' ke boolean)
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'false';

        // Pilih Server Key yang sesuai
        const currentServerKey = isProduction 
            ? process.env.MIDTRANS_SERVER_KEY_PROD 
            : process.env.MIDTRANS_SERVER_KEY_SANDBOX;

        // Validasi: Pastikan key yang dipilih benar-benar ada
        if (!currentServerKey) {
            return NextResponse.json({ 
                message: `Server Key untuk mode ${isProduction ? 'PRODUCTION' : 'SANDBOX'} belum diset di file .env` 
            }, { status: 500 });
        }

        // --- 2. INISIALISASI MIDTRANS SNAP ---
        let snap = new Midtrans.Snap({
            isProduction: isProduction, // Dinamis: true atau false
            serverKey: currentServerKey, // Dinamis: Kunci Prod atau Sandbox
        });

        // --- 3. BUAT ORDER ID UNIK ---
        // Format: 'PHOTO-TIMESTAMP-RANDOM'
        const orderId = 'PHOTO-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // --- 4. SIAPKAN PARAMETER TRANSAKSI ---
        let parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
            customer_details: {
                first_name: "Guest",
                last_name: "Photobooth",
                email: "guest@photobooth.com", // Bisa diganti input user jika ada
            },
            // Opsional: Pengaturan Durasi Expired Transaksi (misal 15 menit)
            expiry: {
                unit: "minutes",
                duration: 15
            }
        };

        // --- 5. MINTA TOKEN KE SERVER MIDTRANS ---
        const transaction = await snap.createTransaction(parameter);
        const token = transaction.token;

        // --- 6. KIRIM BALIK KE FRONTEND ---
        return NextResponse.json({ 
            token: token,
            order_id: orderId,
            mode: isProduction ? 'Production' : 'Sandbox' // Info tambahan untuk debug di console browser
        });

    } catch (error) {
        console.error("Midtrans Error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}