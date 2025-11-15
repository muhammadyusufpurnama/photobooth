// resources/js/components/AddOn.jsx
import React, { useState } from 'react';
import Layout from './Layout';

const AddOn = ({ onNext, onBack, selectedPackage }) => {
    const [extraPrints, setExtraPrints] = useState(0);
    const [extraTime, setExtraTime] = useState(0);

    const pricePerPrint = 20000;
    const pricePerMinute = 12000;

    const handlePrintsChange = (change) => {
        setExtraPrints(prev => Math.max(0, prev + change));
    };

    const handleTimeChange = (change) => {
        setExtraTime(prev => Math.max(0, prev + change));
    };

    const handleContinue = () => {
        // Kirim data add-on yang dipilih ke halaman berikutnya
        onNext({ extraPrints, extraTime });
    };

    return (
        <Layout showBackButton={true} onBack={onBack}>
            <h1 style={{ fontSize: '2.5em', marginBottom: '40px', color: '#333' }}>Add On</h1>
            <div style={{
                display: 'flex',
                gap: '30px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                {/* Opsi Cetak Foto Tambahan */}
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ccc',
                    borderRadius: '15px',
                    padding: '30px',
                    width: '350px',
                    textAlign: 'left',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.8em', marginBottom: '10px', color: '#007bff' }}>Mau Cetak Foto Tambahan?</h2>
                    <p style={{ fontSize: '1.1em', color: '#666', lineHeight: '1.5', marginBottom: '20px' }}>
                        Cetak foto tambahan dengan harga Rp {pricePerPrint.toLocaleString('id-ID')} per cetak. (opsional)
                    </p>
                    {/* Gambar placeholder untuk cetak foto */}
                    <img
                        src="/images/add-on-prints.png" // Ganti dengan path gambar Anda
                        alt="Cetak Foto Tambahan"
                        style={{ maxWidth: '150px', height: 'auto', display: 'block', margin: '0 auto 20px auto' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
                        <button onClick={() => handlePrintsChange(-1)} style={counterButtonStyle}>-</button>
                        <span style={counterValueStyle}>{extraPrints}</span>
                        <button onClick={() => handlePrintsChange(1)} style={counterButtonStyle}>+</button>
                    </div>
                    <p style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#333', marginTop: '15px' }}>
                        Rp {(extraPrints * pricePerPrint).toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Opsi Waktu Foto Tambahan */}
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ccc',
                    borderRadius: '15px',
                    padding: '30px',
                    width: '350px',
                    textAlign: 'left',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.8em', marginBottom: '10px', color: '#007bff' }}>Mau Waktu Foto Tambahan?</h2>
                    <p style={{ fontSize: '1.1em', color: '#666', lineHeight: '1.5', marginBottom: '20px' }}>
                        Tambahkan waktu tambahan dengan harga Rp {pricePerMinute.toLocaleString('id-ID')} per menit (opsional)
                    </p>
                    {/* Gambar placeholder untuk waktu tambahan */}
                    <img
                        src="/images/add-on-time.png" // Ganti dengan path gambar Anda
                        alt="Waktu Foto Tambahan"
                        style={{ maxWidth: '150px', height: 'auto', display: 'block', margin: '0 auto 20px auto' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
                        <button onClick={() => handleTimeChange(-1)} style={counterButtonStyle}>-</button>
                        <span style={counterValueStyle}>{extraTime}</span>
                        <button onClick={() => handleTimeChange(1)} style={counterButtonStyle}>+</button>
                    </div>
                    <p style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#333', marginTop: '15px' }}>
                        Rp {(extraTime * pricePerMinute).toLocaleString('id-ID')}
                    </p>
                </div>
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

const counterButtonStyle = {
    padding: '8px 15px',
    borderRadius: '50%',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '1.2em',
    cursor: 'pointer',
    margin: '0 10px'
};

const counterValueStyle = {
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '30px',
    textAlign: 'center'
};

export default AddOn;
