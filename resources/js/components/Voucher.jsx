// resources/js/components/Voucher.jsx
import React, { useState } from 'react';
import Layout from './Layout';

const Voucher = ({ onNext, onBack }) => {
    const [voucherCode, setVoucherCode] = useState('');

    const handleVoucherChange = (event) => {
        setVoucherCode(event.target.value);
    };

    const handleApplyVoucher = () => {
        // Di sini Anda akan mengirim voucherCode ke backend untuk validasi
        console.log('Menerapkan voucher:', voucherCode);
        alert(`Voucher "${voucherCode}" diterapkan (simulasi).`);
        // Setelah validasi, Anda mungkin akan menyimpan status voucher atau diskon
    };

    const handleContinue = () => {
        // Lanjutkan ke halaman pembayaran, mungkin kirim voucherCode juga
        onNext(voucherCode);
    };

    return (
        <Layout showBackButton={true} onBack={onBack}>
            <h1 style={{ fontSize: '2.5em', marginBottom: '40px', color: '#333' }}>Voucher</h1>
            <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ccc',
                borderRadius: '15px',
                padding: '40px',
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ fontSize: '1.8em', marginBottom: '20px', color: '#007bff' }}>Isi Voucher Jika Ada</h2>
                <p style={{ fontSize: '1.1em', color: '#666', marginBottom: '20px' }}>Kode voucher (opsional)</p>
                <input
                    type="text"
                    value={voucherCode}
                    onChange={handleVoucherChange}
                    placeholder="Masukkan kode voucher Anda"
                    style={{
                        width: 'calc(100% - 20px)',
                        padding: '12px 10px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1.1em'
                    }}
                />
                <button
                    onClick={handleApplyVoucher}
                    style={{
                        padding: '12px 25px',
                        borderRadius: '25px',
                        border: 'none',
                        backgroundColor: '#ffc107', // Warna kuning
                        color: 'white',
                        fontSize: '1.1em',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        marginBottom: '30px'
                    }}
                >
                    Gunakan kode voucher
                </button>
            </div>
            <button
                onClick={handleContinue}
                style={{
                    padding: '15px 40px',
                    borderRadius: '30px',
                    border: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '40px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
            >
                Lanjutkan
            </button>
        </Layout>
    );
};

export default Voucher;
