import React from 'react';

interface PlayheadProps {
    param?: number; // Position in pixels
}

export const Playhead: React.FC<PlayheadProps> = ({ param = 0 }) => {
    return (
        <div
            className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center group"
            style={{ left: `${param}px`, transform: 'translateX(-50%)' }}
        >
            {/* 1. Playhead Handle (Reference Style: Cyan Shield/Rounded) */}
            {/* Positioned slightly overlapping the ruler */}
            <div className="relative filter drop-shadow-md">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M0 4C0 1.79086 1.79086 0 4 0H11C13.2091 0 15 1.79086 15 4V9C15 11.2091 13.2091 13 11 13H7.5L4 13L0 9V4Z"
                        fill="#22d3ee" // Cyan-400
                    />
                    {/* Inner highlight line or detail if needed */}
                </svg>
            </div>

            {/* 2. Vertical Line (Thin Cyan Line) */}
            <div className="w-[1px] h-full bg-[#22d3ee] shadow-[0_0_2px_rgba(34,211,238,0.6)]" />
        </div>
    );
};
