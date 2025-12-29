import React from 'react';

interface RegionBlockProps {
    startBar: number;
    lengthBars: number;
    pixelsPerBar?: number;
    name: string;
    color?: string; // Tailwind color class or hex
}

export const RegionBlock: React.FC<RegionBlockProps> = ({
    startBar,
    lengthBars,
    pixelsPerBar = 200,
    name,
    color = "bg-lime-500" // Neon Olive default
}) => {
    const left = startBar * pixelsPerBar;
    const width = lengthBars * pixelsPerBar;

    return (
        <div
            className={`absolute top-1 bottom-1 ${color} rounded-md border border-white/20 shadow-lg cursor-pointer hover:brightness-110 active:cursor-grabbing flex items-center px-3 overflow-hidden select-none transition-all`}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                opacity: 0.8
            }}
        >
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-wide drop-shadow-md">
                    {name}
                </span>
                <span className="text-white/70 text-xs">
                    MIDI Clip
                </span>
            </div>

            {/* Draggable Handle Indicator (Visual Only) */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20 hover:bg-white/20 cursor-e-resize" />
        </div>
    );
};
