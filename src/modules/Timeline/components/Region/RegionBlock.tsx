import React from 'react';

interface RegionBlockProps {
    startBar: number;
    lengthBars: number;
    pixelsPerBar?: number;
    name: string;
    baseColor?: string; // e.g., "red", "yellow", "blue"
}

export const RegionBlock: React.FC<RegionBlockProps> = ({
    startBar,
    lengthBars,
    pixelsPerBar = 200,
    name,
    baseColor = "green" // Default Fallback
}) => {
    const left = startBar * pixelsPerBar;
    const width = lengthBars * pixelsPerBar;

    // Final Color Calibration: Dark Tinted Glass (900/80)
    // Goal: Deep, professional, semi-transparent glass. Not solid, not toy-like.
    // Final "Milky Pastel" Palette (300/400 Series) - The "Marshmallow" Look
    // Goal: Soft, Bright, Creamy + Dark Text for Contrast
    const colorMap: Record<string, { border: string, header: string, body: string }> = {
        'red': { border: 'border-rose-300', header: 'bg-rose-400 text-rose-950', body: 'bg-rose-300/50' }, // Strawberry
        'yellow': { border: 'border-amber-200', header: 'bg-amber-300 text-amber-950', body: 'bg-amber-200/50' }, // Banana
        'blue': { border: 'border-sky-300', header: 'bg-sky-400 text-sky-950', body: 'bg-sky-300/50' },   // Soda
        'purple': { border: 'border-violet-300', header: 'bg-violet-400 text-violet-950', body: 'bg-violet-300/50' }, // Lavender
        'green': { border: 'border-emerald-300', header: 'bg-emerald-400 text-emerald-950', body: 'bg-emerald-300/50' }, // Melon
        'sky': { border: 'border-sky-300', header: 'bg-sky-400 text-sky-950', body: 'bg-sky-300/50' },     // Alias
        'default': { border: 'border-slate-300', header: 'bg-slate-400 text-slate-950', body: 'bg-slate-300/50' },    // Earl Grey
    };


    const styles = colorMap[baseColor] || colorMap['green'];

    return (
        <div
            className={`absolute top-[1px] bottom-[1px] flex flex-col rounded-sm overflow-hidden border ${styles.border} shadow-sm select-none group z-30`}
            style={{
                left: `${left}px`,
                width: `${width}px`,
            }}
        >
            {/* 1. SOLID HEADER (Drag Handle) */}
            <div
                className={`
                    w-full h-5 flex-none flex items-center pr-2
                    ${styles.header}
                    cursor-grab active:cursor-grabbing hover:brightness-110 z-20
                `}
                style={{ paddingLeft: '10px' }}
            >
                <span className="text-[11px] font-bold tracking-wide truncate drop-shadow-sm">
                    {name}
                </span>
            </div>

            {/* 2. TRANSLUCENT BODY (Content Area) */}
            <div
                className={`
                    flex-1 w-full relative
                    ${styles.body}
                    cursor-default
                `}
            >
                {/* Optional: Waveform Preview */}
            </div>

            {/* 3. RESIZE HANDLE (Right Edge) */}
            <div
                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize hover:bg-white/20 z-30"
                title="Resize"
            />
        </div>
    );
};
