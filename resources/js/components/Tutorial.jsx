// resources/js/components/Tutorial.jsx
import React from 'react';
import Layout from './Layout'; // Import Layout

const Tutorial = ({ onNext, onBack }) => {
    const steps = [
        { id: 1, title: 'Pilih Paket', image: '/images/tutorial-paket.png' }, // Ganti dengan path gambar Anda
        { id: 2, title: 'Pembayaran', image: '/images/tutorial-pembayaran.png' },
        { id: 3, title: 'Pilih Frame', image: '/images/tutorial-frame.png' },
        { id: 4, title: 'Foto & Filter', image: '/images/tutorial-foto.png' },
        { id: 5, title: 'Cetak & Kirim File', image: '/images/tutorial-cetak.png' },
    ];

    return (
        <Layout showBackButton={true} onBack={onBack}>
            <h1 style={{ fontSize: '2.5em', marginBottom: '40px', color: '#333' }}>Langkah Berfoto Di Minarsih Photobooth</h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {steps.map(step => (
                    <div key={step.id} style={{
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '180px'
                    }}>
                        <span style={{
                            display: 'block',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            color: 'white',
                            fontWeight: 'bold',
                            lineHeight: '30px',
                            marginBottom: '10px'
                        }}>{step.id}</span>
                        <img
                            src={step.image}
                            alt={step.title}
                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', marginBottom: '10px' }}
                        />
                        <p style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#555' }}>{step.title}</p>
                    </div>
                ))}
            </div>
            <button
                onClick={onNext} // Fungsi ini akan berpindah ke halaman Pilih Paket
                style={{
                    padding: '15px 40px',
                    borderRadius: '30px',
                    border: 'none',
                    backgroundColor: '#28a745', // Warna tombol hijau
                    color: 'white',
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
            >
                Lanjut ➔
            </button>
        </Layout>
    );
};

export default Tutorial;
