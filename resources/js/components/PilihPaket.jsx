// resources/js/components/PilihPaket.jsx
import React, { useState } from 'react';
import Layout from './Layout';

const PilihPaket = ({ onNext, onBack }) => {
    const [selectedPackage, setSelectedPackage] = useState(null);

    const packages = [
        {
            id: 'vintage',
            name: 'Paket Vintage',
            description: 'Paket photobooth Vintage, unlimited retake, dengan 12 hasil print foto dan waktu 12 menit.',
            price: 12000
        },
        {
            id: 'retro',
            name: 'Paket Retro',
            description: 'Paket photobooth Retro, unlimited retake, dengan 12 hasil print foto dan waktu 15 menit.',
            price: 19000
        }
    ];

    const handleSelectPackage = (packageId) => {
        setSelectedPackage(packageId);
    };

    const handleContinue = () => {
        if (selectedPackage) {
            // Lanjutkan ke halaman Add On, kirim data paket yang dipilih
            onNext(selectedPackage);
        } else {
            alert('Silakan pilih paket terlebih dahulu.');
        }
    };

    return (
        <Layout showBackButton={true} onBack={onBack}>
            <h1 style={{ fontSize: '2.5em', marginBottom: '40px', color: '#333' }}>Pilih Paket Photobooth</h1>
            <div style={{
                display: 'flex',
                gap: '30px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                {packages.map(pkg => (
                    <div
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg.id)}
                        style={{
                            backgroundColor: selectedPackage === pkg.id ? '#e6f7ff' : '#f8f9fa', // Latar belakang berubah saat dipilih
                            border: `2px solid ${selectedPackage === pkg.id ? '#007bff' : '#ccc'}`,
                            borderRadius: '15px',
                            padding: '30px',
                            width: '300px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div>
                            <h2 style={{ fontSize: '1.8em', marginBottom: '10px', color: '#007bff' }}>{pkg.name}</h2>
                            <p style={{ fontSize: '1.1em', color: '#666', lineHeight: '1.5' }}>{pkg.description}</p>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>Rp. {pkg.price.toLocaleString('id-ID')}</p>
                            <span style={{ fontSize: '1.5em', color: '#007bff' }}>➔</span>
                        </div>
                    </div>
                ))}
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

export default PilihPaket;
