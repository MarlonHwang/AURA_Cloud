import React from 'react';

interface PlayheadProps {
    param?: number; // Position in pixels (placeholder)
}

export const Playhead: React.FC<PlayheadProps> = ({ param = 0 }) => {
    return (
        <div
            className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center"
            style={{ left: `${param}px` }}
        >
            {/* Handle Triangle */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 transform -translate-y-[1px]" />

            {/* Vertical Line */}
            <div className="w-px h-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
        </div>
    );
};
