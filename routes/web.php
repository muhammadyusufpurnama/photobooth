<?php

use Illuminate\Support\Facades\Route;

// Rute utama
Route::get('/', function () {
    return view('welcome');
});

// --- TAMBAHAN: Rute khusus Admin ---
// Mengarahkan /admin ke view yang sama agar React bisa menanganinya
Route::get('/admin', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
