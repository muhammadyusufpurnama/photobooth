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
        $this->clientId = config('doku.client_id');
        $this->secretKey = config('doku.secret_key');

        // PERBAIKAN 1: Pastikan Base URL bersih, tanpa '/api' di belakangnya
        // Jika di .env Anda ada '/api', kode ini akan membersihkannya
        $urlFromConfig = config('doku.base_url', 'https://api-sandbox.doku.com');
        $this->baseUrl = rtrim($urlFromConfig, '/api/');
        // Hasilnya akan selalu: https://api-sandbox.doku.com
    }

    private function generateDigest($bodyString)
    {
        // Hash langsung dari string JSON, bukan array
        $hash = hash('sha256', $bodyString, true);

        return base64_encode($hash);
    }

    private function generateSignature($clientId, $requestId, $requestTimestamp, $requestTarget, $digest, $secretKey)
    {
        $component = 'Client-Id:'.$clientId."\n";
        $component .= 'Request-Id:'.$requestId."\n";
        $component .= 'Request-Timestamp:'.$requestTimestamp."\n";
        $component .= 'Request-Target:'.$requestTarget;

        if ($digest) {
            $component .= "\n";
            $component .= 'Digest:'.$digest;
        }

        $signature = base64_encode(hash_hmac('sha256', $component, $secretKey, true));

        return 'HMACSHA256='.$signature;
    }

    public function generateQris(Request $request)
    {
        $requestId = (string) Str::uuid();
        $timestamp = gmdate("Y-m-d\TH:i:s\Z");

        // PERBAIKAN 2: Path yang BENAR untuk DOKU v2 (Tanpa /api di depan)
        $path = '/checkout/v1/payment';

        $amount = (int) $request->input('total_amount', 10000);

        $body = [
            'order' => [
                'amount' => $amount,
                'invoice_number' => $requestId,
                'currency' => 'IDR',
                'callback_url' => 'https://google.com/', // Ganti nanti
                'auto_redirect' => false, // Tambahan opsional
            ],
            'payment' => [
                'payment_due_date' => 60,
                'payment_method_types' => ['QRIS'],
            ],
            'customer' => [
                'id' => 'CUST-001',
                'name' => 'User Photobooth',
                'email' => 'guest@example.com', // Tambahkan email dummy
                'phone' => '6281200000000',
                'country' => 'ID',
            ],
        ];

        // PERBAIKAN 3: Encode JSON dengan UNESCAPED_SLASHES
        // Ini SANGAT PENTING agar Signature valid!
        $jsonBody = json_encode($body, JSON_UNESCAPED_SLASHES);

        // 1. Generate Digest dari String JSON
        $digest = $this->generateDigest($jsonBody);

        // 2. Generate Signature
        $signature = $this->generateSignature(
            $this->clientId,
            $requestId,
            $timestamp,
            $path,
            $digest,
            $this->secretKey
        );

        try {
            // Log Request untuk Debugging
            Log::info('DOKU Request:', [
                'url' => $this->baseUrl.$path,
                'headers' => [
                    'Client-Id' => $this->clientId,
                    'Signature' => $signature,
                ],
                'body' => $jsonBody,
            ]);

            $response = Http::withHeaders([
                'Client-Id' => $this->clientId,
                'Request-Id' => $requestId,
                'Request-Timestamp' => $timestamp,
                'Signature' => $signature,
                'Content-Type' => 'application/json',
            ])
            ->withBody($jsonBody, 'application/json') // Kirim Raw Body
            ->post($this->baseUrl.$path);

            $data = $response->json();

            // Log Response untuk Debugging
            Log::info('DOKU Response:', $data);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'invoice_number' => $requestId,
                    'qris_url' => $data['response']['payment']['url'],
                ]);
            } else {
                // Kirim pesan error asli dari DOKU ke frontend
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal Generate QRIS',
                    'debug' => $data,
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('DOKU Connection Error: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function checkStatus($invoice_number)
    {
        $requestId = (string) Str::uuid();
        $timestamp = gmdate("Y-m-d\TH:i:s\Z");

        // Path Check Status
        $path = '/orders/v1/status/'.$invoice_number;

        $signature = $this->generateSignature(
            $this->clientId,
            $requestId,
            $timestamp,
            $path,
            null,
            $this->secretKey
        );

        try {
            $response = Http::withHeaders([
                'Client-Id' => $this->clientId,
                'Request-Id' => $requestId,
                'Request-Timestamp' => $timestamp,
                'Signature' => $signature,
            ])->get($this->baseUrl.$path);

            $data = $response->json();

            if ($response->successful()) {
                $status = $data['transaction']['status'] ?? 'PENDING';

                return response()->json([
                    'success' => true,
                    'status' => $status,
                ]);
            } else {
                return response()->json(['success' => false, 'status' => 'NOT_FOUND'], 404);
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
