'use client';

import { useRouter } from 'next/navigation';
import AdminSettings from '../components/AdminSettings'; // Sesuaikan path import

export default function AdminPage() {
    const router = useRouter();

    // Fungsi kembali ke Home
    const handleBack = () => {
        router.push('/'); 
    };

    return (
        <AdminSettings onBack={handleBack} />
    );
}