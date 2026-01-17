// File: app/api/midtrans/token/route.js

import Midtrans from "midtrans-client";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { amount } = await request.json();

        // 1. Validasi Server Key (Pastikan ada di .env.local)
        if (!process.env.MIDTRANS_SERVER_KEY) {
            return NextResponse.json({ message: "Server Key belum diset" }, { status: 500 });
        }

        // 2. Inisialisasi Midtrans Snap
        let snap = new Midtrans.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
        });

        // 3. Buat Order ID Unik
        // Mirip dengan 'PHOTO-' . uniqid() di PHP
        const orderId = 'PHOTO-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // 4. Siapkan Parameter JSON Midtrans
        let parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
            customer_details: {
                first_name: "Guest",
                last_name: "Photobooth",
                email: "guest@photobooth.com",
            },
            // credit_card: { secure: true }, // Aktifkan jika butuh CC
        };

        // 5. Minta Token ke Server Midtrans
        const transaction = await snap.createTransaction(parameter);
        const token = transaction.token;

        // 6. Kirim Balik Token ke Frontend
        return NextResponse.json({ 
            token: token,
            order_id: orderId 
        });

    } catch (error) {
        console.error("Midtrans Error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}