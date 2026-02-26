import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
    try {
        const body = await request.json();
        const { amount, orderId, email } = body;

        // 1. Validasi Environment Variables
        const isProduction = process.env.DOKU_IS_PRODUCTION === 'true';
        const clientId = isProduction 
            ? process.env.DOKU_CLIENT_ID_PROD 
            : process.env.DOKU_CLIENT_ID_SANDBOX;
        const secretKey = isProduction 
            ? process.env.DOKU_SECRET_KEY_PROD 
            : process.env.DOKU_SECRET_KEY_SANDBOX;

        if (!clientId || !secretKey) {
            console.error("DOKU Configuration Missing");
            return NextResponse.json({ message: "Konfigurasi API DOKU (Client ID/Secret Key) tidak ditemukan di .env" }, { status: 500 });
        }

        // 2. Setup URL & Header Dasar
        const baseUrl = isProduction ? "https://api.doku.com" : "https://api-sandbox.doku.com";
        const targetPath = "/checkout/v1/payment";
        const url = `${baseUrl}${targetPath}`;
        
        // ID Permintaan (Request-Id) dan Nomor Invoice harus konsisten
        const invoiceNumber = orderId || `INV-${Date.now()}`;
        const requestTimestamp = new Date().toISOString().slice(0, 19) + "Z"; // Format: YYYY-MM-DDTHH:mm:ssZ

        // 3. Susun Request Body (Pastikan Amount adalah Number)
        const reqBody = {
            order: {
                amount: Number(amount), // Pastikan bertipe Number
                invoice_number: invoiceNumber,
                currency: "IDR",
                callback_url: "http://localhost:3000", // Ganti ke domain asli saat deploy
                auto_redirect: true
            },
            payment: {
                payment_due_date: 60 // 1 jam
            },
            customer: {
                id: `CUST-${Date.now()}`,
                name: "Guest User",
                email: email || "guest@photobooth.com"
            }
        };

        const bodyString = JSON.stringify(reqBody);

        // 4. GENERATE SIGNATURE (Sesuai Standar DOKU V1)
        // A. Digest: SHA256 dari Body, kemudian di-Base64
        const digest = crypto.createHash('sha256').update(bodyString).digest('base64');

        // B. String to Sign: Harus persis urutannya dan menggunakan \n
        const rawSignature = 
            `Client-Id:${clientId}\n` +
            `Request-Id:${invoiceNumber}\n` +
            `Request-Timestamp:${requestTimestamp}\n` +
            `Request-Target:${targetPath}\n` +
            `Digest:${digest}`;

        // C. HMAC-SHA256 dengan Secret Key
        const hmac = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('base64');
        
        const finalSignature = `HMACSHA256=${hmac}`;

        // 5. Eksekusi Request ke DOKU
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Client-Id": clientId,
                "Request-Id": invoiceNumber,
                "Request-Timestamp": requestTimestamp,
                "Signature": finalSignature
            },
            body: bodyString
        });

        const data = await response.json();

        // 6. Tangani Response
        if (!response.ok) {
            console.error("DOKU API Rejection:", data);
            return NextResponse.json({ 
                message: data.error?.message || "DOKU menolak permintaan pembayaran",
                details: data 
            }, { status: response.status });
        }

        return NextResponse.json({
            status: "success",
            payment_url: data.response.payment.url,
            order_id: invoiceNumber
        });

    } catch (error) {
        console.error("Fatal Route Error:", error);
        return NextResponse.json({ message: "Internal Server Error: " + error.message }, { status: 500 });
    }
}
