// resources/js/components/Home.jsx
import React from 'react';
import Layout from './Layout'; // Import Layout

const Home = ({ onStartPhotoBooth }) => {
    return (
        <Layout>
            <h2 style={{ fontSize: '2em', marginBottom: '20px', color: '#333' }}>Halo, Selamat Datang di</h2>
            {/* Ganti dengan logo Anda yang sebenarnya */}
            <img
                src="/images/logo-minarplace.png" // Pastikan path ke logo Anda benar di folder public/images
                alt="Minar Place Logo"
                style={{ maxWidth: '250px', margin: '20px auto', display: 'block' }}
            />
            <button
                onClick={onStartPhotoBooth} // Fungsi ini akan berpindah ke halaman tutorial
                style={{
                    padding: '15px 30px',
                    borderRadius: '30px',
                    border: 'none',
                    backgroundColor: '#007bff', // Warna tombol biru
                    color: 'white',
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '30px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
            >
                Mulai Photo Booth
            </button>
        </Layout>
    );
};

export default Home;
