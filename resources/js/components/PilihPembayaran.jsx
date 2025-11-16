// resources/js/components/PilihPembayaran.jsx

import React, { useState } from 'react';
import axios from 'axios';

const paymentMethods = [
    { id: 'qris_doku', name: 'QRIS (DOKU)', icon: '💳' },
    { id: 'transfer_bank', name: 'Transfer Bank (Manual)', icon: '🏦' },
];

const PilihPembayaran = ({ onNext, onBack, bookingData }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [qrisData, setQrisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateTotalAmount = () => {
        const packagePrice = 10000;
        const addOnPrice = 2000;
        return packagePrice + addOnPrice;
    };

    const totalAmount = calculateTotalAmount();

    const handlePayment = async () => {
        if (!selectedMethod) {
            setError('Mohon pilih metode pembayaran terlebih dahulu.');
            return;
        }

        setError(null);
        setLoading(true);

        const packageIdentifier = bookingData?.package || 'GUEST_PKG';
        const currentBookingId = packageIdentifier + '-' + Date.now();

        if (totalAmount <= 0) {
            setError('Total pembayaran tidak valid atau nol.');
            setLoading(false);
            return;
        }

        if (selectedMethod === 'qris_doku') {
            try {
                const response = await axios.post('/api/generate-qris', {
                    total_amount: totalAmount,
                    booking_id: currentBookingId,
                });

                if (response.data.success) {
                    setQrisData({
                        order_id: response.data.order_id,
                        qris_url: response.data.qris_url,
                        amount: totalAmount,
                    });
                } else {
                    setError(response.data.message || 'Gagal memproses pembayaran QRIS.');
                }
            } catch (err) {
                setError('Terjadi kesalahan koneksi server saat generate QRIS.');
                console.error("QRIS Generation Error:", err);
            }
        } else {
            onNext(selectedMethod);
        }

        setLoading(false);
    };

    // Tampilan Konfirmasi QRIS
    if (qrisData) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundImage: 'url("/images/bg.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}
            >
                <div style={{
                    backgroundColor: 'rgba(240, 248, 255, 0.95)',
                    border: '3px solid #0066cc',
                    borderRadius: '15px',
                    padding: '40px',
                    width: '100%',
                    maxWidth: '500px',
                    textAlign: 'center',
                    boxShadow: '0 8px 20px rgba(0,102,204,0.3)'
                }}>
                    <h2 style={{ 
                        fontSize: '1.8em', 
                        marginBottom: '20px', 
                        color: '#0066cc',
                        fontWeight: 'bold'
                    }}>
                        Proses Pembayaran QRIS
                    </h2>
                    <p style={{ 
                        fontSize: '0.95em', 
                        color: '#666', 
                        marginBottom: '25px',
                        lineHeight: '1.6'
                    }}>
                        Silakan pindai kode QR di bawah ini menggunakan aplikasi pembayaran Anda (Bank, E-Wallet, dll.)
                    </p>

                    <img
                        src={qrisData.qris_url}
                        alt="DOKU QRIS Code"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = "https://placehold.co/300x300/f0f0f0/333?text=QRIS+Gagal+Muat" 
                        }}
                        style={{
                            maxWidth: '300px',
                            width: '100%',
                            margin: '20px auto',
                            border: '4px solid #0066cc',
                            borderRadius: '10px',
                            padding: '10px',
                            backgroundColor: '#f0f8ff'
                        }}
                    />

                    <div style={{
                        backgroundColor: 'rgba(0,102,204,0.05)',
                        border: '2px solid #0066cc',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <p style={{ 
                            fontSize: '1.1em', 
                            color: '#333',
                            fontWeight: 'bold',
                            margin: '10px 0'
                        }}>
                            Jumlah: <span style={{ color: '#d32f2f', fontSize: '1.3em' }}>
                                Rp {qrisData.amount.toLocaleString('id-ID')}
                            </span>
                        </p>
                        <p style={{ 
                            fontSize: '0.9em', 
                            color: '#666',
                            margin: '10px 0'
                        }}>
                            No. Invoice: {qrisData.order_id}
                        </p>
                    </div>

                    <div style={{
                        backgroundColor: '#ffebee',
                        border: '2px solid #d32f2f',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '25px',
                        color: '#b71c1c',
                        fontSize: '0.9em',
                        fontWeight: '500'
                    }}>
                        ⚠️ Jangan tutup halaman ini sampai pembayaran terkonfirmasi.
                    </div>

                    <button
                        onClick={() => setQrisData(null)}
                        style={{
                            padding: '10px 25px',
                            borderRadius: '25px',
                            border: '2px solid #0066cc',
                            backgroundColor: 'transparent',
                            color: '#0066cc',
                            fontSize: '1em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#0066cc';
                            e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#0066cc';
                        }}
                    >
                        Pilih Metode Pembayaran Lain
                    </button>
                </div>
            </div>
        );
    }

    // Tampilan Pemilihan Metode Pembayaran
    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundImage: 'url("/images/bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
        >
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

            <h1 style={{ 
                fontSize: '2.5em', 
                marginBottom: '50px', 
                color: '#0066cc',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
                Pilih Metode Pembayaran
            </h1>

            <div style={{
                backgroundColor: 'rgba(240, 248, 255, 0.95)',
                border: '3px solid #0066cc',
                borderRadius: '15px',
                padding: '40px',
                width: '100%',
                maxWidth: '550px',
                boxShadow: '0 8px 20px rgba(0,102,204,0.3)'
            }}>
                {error && (
                    <div style={{
                        backgroundColor: '#ffebee',
                        border: '2px solid #d32f2f',
                        borderRadius: '10px',
                        padding: '12px 15px',
                        marginBottom: '25px',
                        color: '#b71c1c',
                        fontSize: '0.95em',
                        fontWeight: '500'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{ marginBottom: '30px' }}>
                    {paymentMethods.map(method => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '18px 20px',
                                marginBottom: '15px',
                                border: `3px solid ${selectedMethod === method.id ? '#0066cc' : '#87ceeb'}`,
                                borderRadius: '12px',
                                backgroundColor: selectedMethod === method.id ? 'rgba(0,102,204,0.1)' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                transform: selectedMethod === method.id ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onMouseOver={(e) => {
                                if (selectedMethod !== method.id) {
                                    e.currentTarget.style.borderColor = '#0066cc';
                                    e.currentTarget.style.backgroundColor = 'rgba(0,102,204,0.05)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (selectedMethod !== method.id) {
                                    e.currentTarget.style.borderColor = '#87ceeb';
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                }
                            }}
                        >
                            <span style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                fontSize: '1.1em',
                                color: '#333',
                                fontWeight: '600'
                            }}>
                                <span style={{ marginRight: '15px', fontSize: '1.5em' }}>
                                    {method.icon}
                                </span>
                                {method.name}
                            </span>
                            {selectedMethod === method.id && (
                                <span style={{
                                    fontSize: '1.5em',
                                    color: '#0066cc',
                                    fontWeight: 'bold'
                                }}>
                                    ✓
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{
                    backgroundColor: 'rgba(0,102,204,0.05)',
                    border: '2px dashed #0066cc',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '25px'
                }}>
                    <p style={{ 
                        fontSize: '1em', 
                        color: '#666',
                        margin: '0 0 10px 0',
                        fontWeight: '500'
                    }}>
                        Total Pembayaran:
                    </p>
                    <p style={{ 
                        fontSize: '2em', 
                        color: '#d32f2f',
                        fontWeight: 'bold',
                        margin: '0'
                    }}>
                        Rp {totalAmount.toLocaleString('id-ID')}
                    </p>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || loading}
                    style={{
                        width: '100%',
                        padding: '14px 25px',
                        borderRadius: '25px',
                        border: 'none',
                        backgroundColor: selectedMethod && !loading ? '#ffc107' : '#cccccc',
                        color: 'white',
                        fontSize: '1.1em',
                        fontWeight: 'bold',
                        cursor: selectedMethod && !loading ? 'pointer' : 'not-allowed',
                        boxShadow: selectedMethod && !loading ? '0 4px 12px rgba(255,193,7,0.3)' : 'none',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                    onMouseOver={(e) => {
                        if (selectedMethod && !loading) {
                            e.target.style.backgroundColor = '#ffb300';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (selectedMethod && !loading) {
                            e.target.style.backgroundColor = '#ffc107';
                        }
                    }}
                >
                    {loading ? (
                        <>
                            <span style={{
                                display: 'inline-block',
                                width: '18px',
                                height: '18px',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTop: '3px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            Memproses...
                        </>
                    ) : 'Lanjut Pembayaran'}
                </button>

                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default PilihPembayaran;
