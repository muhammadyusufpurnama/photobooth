'use client';

import React from 'react';

    const Tutorial = ({ onNext, onBack }) => {
        const steps = [
            { id: 1, title: 'Klik "Lanjut"', image: '/images/tutor 1.jpeg' },
            { id: 2, title: 'Pembayaran', image: '/images/tutor 2.jpeg' },
            { id: 3, title: 'Pilih Frame', image: '/images/tutor 3.jpeg' },
            { id: 4, title: 'Foto & Filter', image: '/images/tutor 4.jpeg' },
            { id: 5, title: 'Cetak', image: '/images/tutor 5.jpeg' },
        ];

        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                }}
            >
            <button
        onClick={onBack}
        className="
            absolute top-5 left-5
            px-5 py-2
            rounded-full
            bg-red-500
            text-white text-base font-medium
            shadow-md
            cursor-pointer
            transition-all duration-300
            hover:bg-red-700
        "
    >
        Kembali
    </button>

            <h1 className="font-serif text-white font-extrabold text-3xl md:text-4xl mb-12 text-shadow">
        Tata Cara Berfoto</h1>

                <div
    className="
        grid 
        grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5
        gap-6 
        mb-12 
        max-w-4xl 
        w-full
    "
>
    {steps.map((step) => (
        <div
            key={step.id}
            onClick={() => console.log(`Klik step ${step.id}`)}
            className="
                relative
                bg-amber-50/80
                border-4 border-amber-600
                rounded-2xl
                p-6
                flex flex-col items-center justify-center
                shadow-lg
                min-h-[220px]
                cursor-pointer
                transition-all duration-300
                hover:shadow-2xl hover:scale-105
                active:scale-95 active:shadow-md
            "
        >
            {/* Step Number – pojok kiri atas */}
            <span
                className="
                    absolute top-3 left-3
                    w-9 h-9
                    flex items-center justify-center
                    rounded-full
                    bg-white/60 text-black
                    font-bold text-base
                    shadow-md
                "
            >
                {step.id}
            </span>

            {/* Image — jauh lebih besar & lebih menarik */}
            <img
                src={step.image}
                alt={step.title}
                className="
                    w-38 h-38 sm:w-42 sm:h-42
                    object-contain
                    mb-4
                "
            />

            {/* Title */}
            <p
                className="
                    font-semibold 
                    text-black  
                    text-center 
                    text-sm sm:text-base
                "
            >
                {step.title}
            </p>
        </div>
    ))}
</div>

                
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={onNext}
                        style={{
                            padding: '12px 40px',
                            borderRadius: '25px',
                            border: '2px solid white',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    >
                        Lanjut ➔
                    </button>
                </div>
            </div>
        );
    };

    export default Tutorial;