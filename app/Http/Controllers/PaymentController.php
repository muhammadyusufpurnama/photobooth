<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    private $clientId;
    private $secretKey;
    private $baseUrl;

    public function __construct()
    {
        // Ambil konfigurasi dari .env
        $this->clientId = env('DOKU_CLIENT_ID');
        $this->secretKey = env('DOKU_SECRET_KEY');
        // Pastikan DOKU_BASE_URL mengarah ke Sandbox/Production yang benar
        $this->baseUrl = env('DOKU_BASE_URL', 'https://sandbox.doku.com/api/');
    }

    /**
     * Menghitung DOKU Signature untuk Request API.
     */
    private function generateSignature($requestId, $timestamp, $targetPath, $body)
    {
        $bodyJson = json_encode($body);

        // true: output raw binary data, diperlukan sebelum base64_encode
        $digest = base64_encode(hash('sha256', $bodyJson, true));

        $component =
            "Client-Id:{$this->clientId}\n".
            "Request-Id:{$requestId}\n".
            "Request-Timestamp:{$timestamp}\n".
            "Request-Target:{$targetPath}\n".
            "Signature-Auth:true\n".
            "Digest:{$digest}";

        // false: output hex, sesuai format DOKU
        $signature = hash_hmac('sha256', $component, $this->secretKey, false);

        // Tambahkan Log untuk Signature Component (Debugging)
        Log::debug('DOKU Signature Component String:', ['component' => $component]);

        return "HMACSHA256={$signature}";
    }

    /**
     * Dipanggil dari React untuk memulai transaksi QRIS.
     */
    public function generateQris(Request $request)
    {
        // Pastikan $this->clientId dan $this->secretKey terisi
        if (!$this->clientId || !$this->secretKey) {
            Log::error('DOKU Credentials Missing', ['client_id' => $this->clientId, 'secret_key_present' => !empty($this->secretKey)]);

            return response()->json(['success' => false, 'message' => 'Konfigurasi DOKU (Client ID/Secret Key) hilang.'], 500);
        }

        $orderId = (string) Str::uuid(); // Gunakan ID transaksi unik
        $targetPath = '/api/v1/qr-payment/generate';
        // Pastikan format ISO 8601 dengan 'Z' (UTC/Zulu time)
        $timestamp = now()->toIso8601String().'Z';
        $amount = $request->input('total_amount');

        // Pastikan amount valid
        if (!$amount || $amount < 1000) {
            return response()->json(['success' => false, 'message' => 'Jumlah pembayaran tidak valid (min. Rp 1.000).'], 400);
        }

        $body = [
            'order' => [
                'invoice_number' => $orderId,
                'amount' => (int) $amount,
            ],
            'payment' => [
                'payment_due_date' => 60, // QR valid 60 menit
            ],
            'customer' => [
                // 'name' => 'John Doe', // Opsional: data pelanggan
            ],
        ];

        $signature = $this->generateSignature($orderId, $timestamp, $targetPath, $body);

        try {
            // Log data yang akan dikirim sebelum request
            Log::info('DOKU QRIS Request Payload:', ['url' => $this->baseUrl.ltrim($targetPath, '/'), 'headers' => [
                'Client-Id' => $this->clientId,
                'Request-Id' => $orderId,
                'Request-Timestamp' => $timestamp,
                'Request-Target' => $targetPath,
                'Signature' => $signature,
            ], 'body' => $body]);

            $response = Http::withHeaders([
                'Client-Id' => $this->clientId,
                'Request-Id' => $orderId,
                'Request-Timestamp' => $timestamp,
                'Request-Target' => $targetPath,
                'Signature' => $signature,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl.ltrim($targetPath, '/'), $body);

            // Dapatkan data JSON dan log status DOKU
            $data = $response->json();
            Log::info('DOKU QRIS Raw Response:', ['status' => $response->status(), 'data' => $data]);

            if ($response->successful() && isset($data['response']['payment']['url'])) {
                Log::info('DOKU QRIS Generation SUCCESS', ['orderId' => $orderId]);

                return response()->json([
                    'success' => true,
                    'order_id' => $orderId,
                    'qris_url' => $data['response']['payment']['url'],
                    'message' => 'QRIS berhasil dibuat.',
                ]);
            } else {
                // Jika DOKU merespons non-200 atau struktur JSON salah
                Log::error("DOKU QRIS API Failure: Status {$response->status()}", ['dokuResponse' => $data]);

                $errorMessage = $data['error']['message']['en'] ?? 'Terjadi kesalahan dari API DOKU (Non-Signature Error).';

                return response()->json(['success' => false, 'message' => $errorMessage, 'details' => $data], $response->status());
            }
        } catch (\Exception $e) {
            // Log koneksi error (misalnya: Host not found, cURL error)
            Log::critical('DOKU Connection Exception:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['success' => false, 'message' => 'Kesalahan Koneksi Jaringan Server (cURL Error).'], 500);
        }
    }

    /**
     * Dipanggil otomatis oleh DOKU (WEBHOOK) saat status transaksi berubah.
     */
    public function handleNotification(Request $request)
    {
        $data = $request->all();
        // Path harus dimulai dengan slash
        $targetPath = '/'.$request->path();

        Log::info('DOKU Webhook Received', ['data' => $data, 'headers' => $request->headers->all()]);

        // 1. Verifikasi Keamanan Webhook
        try {
            $requestId = $request->header('Request-Id');
            $timestamp = $request->header('Request-Timestamp');
            $signatureHeader = $request->header('Signature'); // Signature yang dikirim DOKU

            // Hitung signature lokal untuk validasi
            $calculatedSignature = $this->generateSignature($requestId, $timestamp, $targetPath, $data);

            if ($calculatedSignature !== $signatureHeader) {
                Log::warning('DOKU Webhook Invalid Signature', ['received' => $signatureHeader, 'calculated' => $calculatedSignature]);

                return response('Invalid Signature', 400); // Tolak jika signature tidak cocok
            }

            // 2. Proses Status Transaksi
            $transactionStatus = $data['transaction']['status'] ?? null;
            $orderId = $data['order']['invoice_number'] ?? null;

            if ($transactionStatus === 'SUCCESS' && $orderId) {
                // TODO: Logika Update Status Transaksi di Database
                Log::info("Transaction {$orderId} marked as PAID.");

                return response('SUCCESS', 200);
            }

            Log::info("DOKU Webhook Status: {$transactionStatus} for {$orderId}");

            return response('SUCCESS', 200);
        } catch (\Exception $e) {
            Log::error('DOKU Webhook Error Processing', ['error' => $e->getMessage()]);

            return response('INTERNAL SERVER ERROR', 500); // Beri tahu DOKU ada masalah
        }
    }
}
