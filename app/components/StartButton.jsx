'use client';

// resources/js/components/StartButton.jsx
import React from "react";

const StartButton = ({ onStartPhotoBooth }) => {
    return (
        <button
            onClick={onStartPhotoBooth}
            className="
                px-8 py-4
                rounded-full
                bg-blue-600
                text-white
                text-xl
                font-bold
                mt-8
                shadow-md
                cursor-pointer
                transition
                duration-200
                ease-out
                hover:shadow-lg
                active:scale-95
            "
        >
            Mulai Photo Booth
        </button>
    );
};

export default StartButton;
