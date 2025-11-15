<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>{{ config('app.name', 'Minar Photobooth') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        {{-- Asumsi Anda menggunakan Vite untuk React. Tambahkan @viteReactRefresh --}}
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @viteReactRefresh
            {{-- Pastikan resources/js/app.jsx adalah entry point React Anda --}}
            @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @else
            {{-- Hapus style fallback yang sangat panjang untuk menjaga kebersihan. --}}
            {{-- Jika menggunakan Laravel Mix, ganti @vite dengan: --}}
            {{-- <script src="{{ mix('js/app.js') }}" defer></script> --}}

            {{-- Jika Anda tidak menggunakan Vite atau Mix (environment produksi tanpa asset),
                 Anda mungkin ingin membiarkan fallback style atau menampilkan pesan error.
                 Untuk setup lokal, pastikan Anda menjalankan npm run dev/build. --}}
            <style>
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background-color: #f0f8ff; /* Warna default yang ringan */
                    font-family: 'Instrument Sans', sans-serif;
                }
                #app {
                    width: 100%;
                    max-width: 100vw;
                    /* Kontainer React akan mengambil seluruh viewport */
                }
            </style>
        @endif
    </head>
    {{-- Hapus kelas Tailwind yang rumit di body agar tampilan dihandle penuh oleh React/CSS Anda --}}
    <body class="flex items-center justify-center min-h-screen">
        {{-- Hapus bagian Header/Navigasi Login Register bawaan Laravel jika tidak diperlukan --}}
        {{-- Jika Anda masih memerlukan navigasi/header di Blade, biarkan saja.
             Saya akan menghapusnya agar fokus ke aplikasi React --}}
        {{--
        <header class="w-full lg:max-w-4xl max-w-[335px] text-sm mb-6 not-has-[nav]:hidden">
            @if (Route::has('login'))
                <nav class="flex items-center justify-end gap-4">
                    @auth
                        ... (link dashboard)
                    @else
                        ... (link login/register)
                    @endauth
                </nav>
            @endif
        </header>
        --}}

        {{-- Ini adalah DIV tempat aplikasi React Anda akan di-mount --}}
        <div id="app" style="width: 100%; height: 100%;">
            {{-- Konten ini akan digantikan oleh aplikasi React Anda setelah di-render --}}
        </div>

    </body>
</html>
