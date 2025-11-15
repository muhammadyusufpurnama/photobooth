<?php

// routes/api.php

use App\Http\Controllers\PaymentController;

// Route untuk membuat QRIS
Route::post('/generate-qris', [PaymentController::class, 'generateQris']);
// Route untuk menerima notifikasi pembayaran (Webhook) dari DOKU
// Penting: Gunakan route tanpa middleware CSRF
Route::post('/doku/notify', [PaymentController::class, 'handleNotification']);
