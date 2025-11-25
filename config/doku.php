<?php

return [
    // Pastikan ini mengambil dari .env
    'client_id' => env('DOKU_CLIENT_ID'),
    'secret_key' => env('DOKU_SECRET_KEY'),
    'base_url' => env('DOKU_BASE_URL'),
    // Endpoint yang akan kita panggil
    'qris_path' => 'v2/qr/generate',
];
