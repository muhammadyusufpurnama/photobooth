'use client';

import React from 'react';

const PhotoPreview = ({ src, type, className }) => {
    if (!src) {
        return <div className={`flex items-center justify-center bg-gray-700 text-gray-400 text-sm ${className}`}>
            Slot Kosong
        </div>;
    }

    if (type === 'gif') {
        return (
            <div className={`relative ${className}`}>
                <img
                    src={src}
                    alt="GIF Preview"
                    className="w-full h-full object-cover"
                />
                <span className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded">GIF</span>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} style={{
                    minHeight: '100vh',
                    backgroundImage: 'url("/images/Navy Black and White Grunge Cat Desktop Wallpaper (2) (1).jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                }}>
            <img
                src={src}
                alt="Photo Preview"
                className="w-full h-full object-cover"
            />
            <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">PHOTO</span>
        </div>
    );
};

export default PhotoPreview;