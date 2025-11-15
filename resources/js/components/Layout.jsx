// resources/js/components/Layout.jsx
import React from 'react';

const Layout = ({ children, showBackButton = false, onBack }) => {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#e0f2f7', // Warna biru muda
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)',
            backgroundSize: '20px 20px', // Ukuran dot pattern
            backgroundPosition: '0 0,10px 10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white', // Konten dalam box putih
                borderRadius: '15px',
                padding: '20px 40px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '600px',
                width: '100%',
                position: 'relative' // Untuk posisi tombol kembali
            }}>
                {showBackButton && (
                    <button
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: 'none',
                            backgroundColor: '#007bff', // Warna tombol biru
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        Kembali
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

export default Layout;
