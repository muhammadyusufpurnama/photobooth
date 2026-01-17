'use client';

// resources/js/components/Home.jsx
import React from 'react';

const Home = ({ onStartPhotoBooth }) => {
    return (
        // Container utama:
        // 1. h-screen: Tinggi memenuhi layar
        // 2. w-full: Lebar penuh
        // 3. flex & flex-col: Menggunakan flexbox kolom
        // 4. justify-end: Mendorong konten (tombol) ke BAWAH
        // 5. items-center: Menengahkan tombol secara horizontal
        // 6. pb-20: Memberi jarak (padding) dari sisi bawah agar tidak terlalu mepet
        <div 
            className="h-screen w-full flex flex-col justify-end items-center pb-24 bg-cover bg-center"
            // Ganti url(...) di bawah ini dengan path background yang Anda inginkan
            // Atau jika background ada di class CSS, tambahkan class tersebut di atas
            style={{ backgroundImage: "url('/images/4 (1).jpg')" }} 
        >
            
            <button
                onClick={onStartPhotoBooth}
                // Perubahan warna ada di sini:
                // bg-red-600: Warna latar belakang tombol merah
                // hover:bg-red-700: Warna merah lebih gelap saat di-hover
                className="
                    px-12 py-4
                    rounded-full
                    bg-red-600 text-white font-bold text-2xl
                    shadow-lg
                    hover:bg-red-700
                    transition-colors duration-200
                    cursor-pointer
                "
            >
                Mulai
            </button>
        </div>
    );
}; 

export default Home;