'use client';

// resources/js/components/Layout.jsx
import React from 'react';

const Layout = ({ children, showBackButton = false, onBack }) => {
    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundImage: 'url("/images/4 (1).jpg")', // ⬅️ Gambar background
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
        >
               <div
                style={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    borderRadius: '15px',
                    padding: '20px 40px',
                    boxShadow: 'none',
                    textAlign: 'center',
                    maxWidth: '600px',
                    width: '100%',
                    position: 'relative'
                }}
            >
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
                            backgroundColor: '#007bff',
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
