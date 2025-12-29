import React from 'react';
import { Playhead } from './Playhead';

interface RulerProps {
    totalBars: number;
    pixelsPerBar: number;
    scrollLeft?: number;
}

export const Ruler: React.FC<RulerProps> = ({ totalBars, pixelsPerBar }) => {
    // Generate tick marks
    const ticks = [];
    for (let i = 0; i < totalBars; i++) {
        ticks.push(
            <div
                key={i}
                className="absolute top-0 h-full flex flex-col justify-end border-l border-gray-600 pl-1 text-[10px] text-gray-400 select-none"
                style={{ left: `${i * pixelsPerBar}px`, width: `${pixelsPerBar}px` }}
            >
                {/* Bar Number */}
                <span className="absolute top-1 left-1 font-semibold text-gray-400">{i + 1}</span>

                {/* Beat Markers (Small ticks) */}
                <div className="flex h-1/3 w-full items-end">
                    <div className="w-1/4 h-1/2 border-r border-gray-700"></div>
                    <div className="w-1/4 h-1/2 border-r border-gray-700"></div>
                    <div className="w-1/4 h-1/2 border-r border-gray-700"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-8 w-full bg-[#1C1C1C] border-b border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full" style={{ width: `${totalBars * pixelsPerBar}px` }}>
                {ticks}
                {/* Playhead is usually overlay over everything, but Ruler has its own playhead triangle sometimes. 
                    For now, Playhead is passed in TimelineView over the whole grid. 
                    But the Reference UI shows a ruler with markers.
                */}
            </div>
        </div>
    );
};
