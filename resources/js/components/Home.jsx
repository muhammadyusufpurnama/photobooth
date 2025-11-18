// resources/js/components/Home.jsx
import React from 'react';
import Layout from './Layout';

const Home = ({ onNext }) => {
    const handleStartClick = () => {
        if (onNext) {
            onNext();
        }
    };

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
                
                {/* Greeting */}
                <h2 className="font-bestia text-white text-2xl md:text-3xl mb-6 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
                    Halo, Selamat Datang di
                </h2>

                {/* Logo */}
                <img
                    src="/images/image.png"
                    alt="Minarsih Photobooth Logo"
                    className="max-w-xs md:max-w-sm w-full mb-4 drop-shadow-lg"
                    onError={(e) => {
                        e.target.src = "/images/placeholder.png";
                    }}
                />

                {/* Description */}
                <p className="text-gray-100 text-lg md:text-xl text-center mb-10 max-w-2xl drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
                    Abadikan momen spesial Anda dengan teknologi fotografi terkini.
                    Pilih paket favorit dan nikmati pengalaman photobooth yang tak terlupakan!
                </p>

                {/* Start Button */}
                <button
                    onClick={handleStartClick}
                    className="
                        relative
                        mt-8 px-10 py-4
                        rounded-full
                        bg-gradient-to-r from-amber-500 to-orange-600
                        hover:from-amber-600 hover:to-orange-700
                        text-white font-bold text-xl
                        shadow-lg
                        border-2 border-amber-300
                        transition-all duration-300
                        transform hover:scale-105
                        active:scale-95
                        overflow-hidden
                    "
                    style={{
                        boxShadow: `
                            0 0 12px rgba(217, 119, 6, 0.5),
                            0 0 24px rgba(217, 119, 6, 0.25)
                        `,
                    }}
                >
                    {/* Button Glow Effect */}
                    <span className="
                        absolute inset-0 
                        bg-gradient-to-r from-transparent via-white/20 to-transparent
                        animate-pulse
                    "></span>
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Mulai Photo Booth
                        <span className="text-2xl">➔</span>
                    </span>
                </button>

            </div>
        </Layout>
    );
};

export default Home;
