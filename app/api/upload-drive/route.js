import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// --- HELPER: KONVERSI BASE64 KE STREAM ---
const base64ToStream = (base64String) => {
    if (!base64String) return null;
    
    // 1. Split header data:image/...;base64,
    const parts = base64String.split(',');
    // Ambil bagian data (index 1), jika tidak ada koma anggap string itu datanya langsung
    const cleanBase64 = parts.length > 1 ? parts[1] : base64String;

    // 2. Ganti spasi (fix untuk beberapa case encoding)
    const formattedBase64 = cleanBase64.replace(/ /g, '+');

    // 3. Buat Buffer
    const buffer = Buffer.from(formattedBase64, 'base64');
    
    // 4. Stream
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

// --- FUNGSI UPLOAD ---
async function uploadFile(drive, folderId, fileName, mimeType, base64Data) {
    try {
        const stream = base64ToStream(base64Data);
        if (!stream) throw new Error("Data Kosong/Invalid");

        const media = {
            mimeType: mimeType, // Kita paksa MIME type di sini
            body: stream,
        };
        
        await drive.files.create({
            requestBody: {
                name: fileName, // Kita paksa Nama File di sini
                parents: [folderId],
            },
            media: media,
            fields: 'id',
        });
        console.log(`✅ Upload Sukses: ${fileName}`);
    } catch (e) {
        console.error(`❌ Gagal Upload ${fileName}: ${e.message}`);
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        // 1. Auth
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth });

        // 2. Folder
        const date = new Date();
        const dateStr = date.toLocaleDateString('id-ID').replace(/\//g, '-');
        const timeStr = `${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`;
        const folderName = `Sesi ${dateStr} ${timeStr}`;
        const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

        const folder = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentFolderId ? [parentFolderId] : [],
            },
            fields: 'id, webViewLink',
        });
        const folderId = folder.data.id;

        // Permission
        try {
            await drive.permissions.create({
                fileId: folderId,
                requestBody: { role: 'reader', type: 'anyone' },
            });
        } catch (e) { console.warn("Permission:", e.message); }

        // 3. Upload Files
        const uploadPromises = [];

        // A. VIDEO: Paksa nama .mp4 dan mime video/mp4
        // Meskipun data aslinya WebM, Google Drive akan menyimpannya sebagai MP4
        // Sebagian besar player (HP/PC) akan otomatis mendeteksi codecnya.
        if (body.generated_live_video) {
            uploadPromises.push(
                uploadFile(drive, folderId, 'Photobooth-LiveFrame.mp4', 'video/mp4', body.generated_live_video)
            );
        }

        // B. FRAME PNG
        if (body.generated_frame) {
            uploadPromises.push(
                uploadFile(drive, folderId, 'Photobooth-Frame.png', 'image/png', body.generated_frame)
            );
        }

        // C. GIF
        if (body.generated_gif) {
            uploadPromises.push(
                uploadFile(drive, folderId, 'Photobooth-Animation.gif', 'image/gif', body.generated_gif)
            );
        }

        // D. Raw Photos
        if (body.photos && Array.isArray(body.photos)) {
            body.photos.forEach((photo, index) => {
                if (photo.src) {
                    uploadPromises.push(
                        uploadFile(drive, folderId, `Raw-${index + 1}.jpg`, 'image/jpeg', photo.src)
                    );
                }
            });
        }

        await Promise.all(uploadPromises);

        return NextResponse.json({
            success: true,
            folder_link: folder.data.webViewLink,
            folder_name: folderName
        });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}