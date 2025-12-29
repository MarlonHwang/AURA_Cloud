import React from 'react';

interface TimeGridProps {
    totalBars?: number;
    pixelsPerBar?: number;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
    totalBars = 16,
    pixelsPerBar = 200
}) => {
    // Generate grid lines
    const gridLines = Array.from({ length: totalBars }).map((_, i) => (
        <div
            key={i}
            className="absolute top-0 bottom-0 border-r border-gray-800"
            style={{
                left: `${i * pixelsPerBar}px`,
                width: `${pixelsPerBar}px`
            }}
        >
            {/* Bar Label */}
            <span className="absolute top-2 left-2 text-xs text-gray-600 font-mono">
                {i + 1}
            </span>

            {/* Beat Lines (Subdivisions) */}
            <div className="absolute top-0 bottom-0 left-1/4 border-r border-gray-800/30" />
            <div className="absolute top-0 bottom-0 left-2/4 border-r border-gray-800/50" />
            <div className="absolute top-0 bottom-0 left-3/4 border-r border-gray-800/30" />
        </div>
    ));

    return (
        <div
            className="relative h-full bg-[#1A1A20] overflow-hidden"
            style={{ width: `${totalBars * pixelsPerBar}px` }}
        >
            {gridLines}
        </div>
    );
};
