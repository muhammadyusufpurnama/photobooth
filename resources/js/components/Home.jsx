// resources/js/components/Home.jsx
import React from 'react';
import Layout from './Layout'; // Import
import StartButton from "../components/StartButton";

const Home = ({ onStartPhotoBooth, onOpenAdmin }) => {
    return (
        <Layout >
            <h2 className="font-bestie text-white text-2xl" >Halo, Selamat Datang di</h2>
            {/* Ganti dengan logo Anda yang sebenarnya */}
            <img
                src="/images/image.png" // Pastikan path ke logo Anda benar di folder public/images
                alt="Minar Place Logo"
                style={{ maxWidth: '250px', margin: '20px auto', display: 'block' }}
            />
            <button
                onClick={onStartPhotoBooth}
                className="
                    mt-8 px-8 py-3
                    rounded-full
                    bg-amber-600 text-white font-bold text-xl
                    shadow-md
                    hover:bg-amber-700
                    transition-colors duration-200
                    cursor-pointer
                "
            >
                Mulai Photo Booth
            </button>
        </Layout>
    );
};

export default Home;
