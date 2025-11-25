<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Endpoint Generate QRIS
Route::post('/generate-qris', [PaymentController::class, 'generateQris']);

// Endpoint Cek Status (Translate dari cek_payment.js)
Route::get('/check-status/{invoice_number}', [PaymentController::class, 'checkStatus']); // <-- TAMBAHKAN INI

// Endpoint Webhook (Opsional, biarkan saja)
Route::post('/doku-notification', [PaymentController::class, 'handleNotification']);
