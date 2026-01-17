// app/api/upload-drive/route.js
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// --- HELPER: KONVERSI BASE64 KE STREAM ---
// Di PHP Anda pakai base64_decode, di Node.js kita pakai Buffer
const base64ToStream = (base64String) => {
    // 1. Hapus header "data:image/png;base64," jika ada
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let cleanBase64 = base64String;

    if (matches && matches.length === 3) {
        cleanBase64 = matches[2];
    }

    // 2. Ganti spasi dengan + (Sama seperti logika PHP Anda)
    cleanBase64 = cleanBase64.replace(/ /g, '+');

    // 3. Buat Buffer dan Stream
    const buffer = Buffer.from(cleanBase64, 'base64');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

// --- FUNGSI UPLOAD ---
async function uploadFile(drive, folderId, fileName, mimeType, base64Data) {
    const media = {
        mimeType: mimeType,
        body: base64ToStream(base64Data),
    };
    
    await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [folderId],
        },
        media: media,
        fields: 'id',
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        // 1. Setup Google Auth
        // Pastikan variabel env sudah diset di .env.local atau Vercel
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        
        const drive = google.drive({ version: 'v3', auth });

        // 2. Buat Nama Folder Unik (Sesi DD-Mon-YYYY HH.MM - Random)
        const date = new Date();
        const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
        const timeStr = date.getHours() + '.' + date.getMinutes();
        const randomStr = Math.random().toString(36).substring(2, 6); // Mirip Str::random(4)
        
        const folderName = `Sesi ${dateStr} ${timeStr} - ${randomStr}`;
        const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

        // 3. Create Folder di Drive
        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentFolderId ? [parentFolderId] : [],
        };

        const folder = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id, webViewLink',
        });
        
        const folderId = folder.data.id;

        // 4. Set Permission (Public Reader)
        try {
            await drive.permissions.create({
                fileId: folderId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
        } catch (permError) {
            console.error("Gagal set permission:", permError);
        }

        // ==========================================
        // PROSES UPLOAD (Paralel agar lebih cepat)
        // ==========================================
        const uploadPromises = [];

        // A. Upload VIDEO GABUNGAN (Live Frame)
        if (body.generated_live_video) {
            uploadPromises.push(
                uploadFile(drive, folderId, 'Photobooth-LiveFrame.mp4', 'video/mp4', body.generated_live_video)
            );
        }

        // B. Upload FOTO FRAME
        if (body.generated_frame) {
            uploadPromises.push(
                uploadFile(drive, folderId, 'Photobooth-Frame.png', 'image/png', body.generated_frame)
            );
        }

        // C. Upload GIF
        if (body.generated_gif) {
            uploadPromises.push(
                uploadFile(drive, folderId, 'Photobooth-Animation.gif', 'image/gif', body.generated_gif)
            );
        }

        // D. Upload Foto Mentah (Looping)
        if (body.photos && Array.isArray(body.photos)) {
            body.photos.forEach((photo, index) => {
                if (photo.src) {
                    uploadPromises.push(
                        uploadFile(drive, folderId, `Raw-${index + 1}.png`, 'image/png', photo.src)
                    );
                }
            });
        }

        // Tunggu semua upload selesai
        await Promise.all(uploadPromises);

        return NextResponse.json({
            success: true,
            folder_link: folder.data.webViewLink,
            folder_name: folderName
        });

    } catch (error) {
        console.error("Drive Upload Error:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}