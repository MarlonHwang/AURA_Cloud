import React from 'react';
import { useAudioStore } from '../../../../stores/audioStore';

interface RulerProps {
    totalBars: number;
    pixelsPerBar: number;
    scrollLeft?: number;
}

export const Ruler: React.FC<RulerProps> = ({ totalBars, pixelsPerBar }) => {
    const timeSignature = useAudioStore((state: any) => state.timeSignature);

    // Dynamic Calculation Logic (Musical Time)
    // 1. Parse Beats Per Bar
    const beatsPerBar = (Array.isArray(timeSignature) && timeSignature[0]) ? timeSignature[0] : 4;

    // 2. Define Zoom / Scale (Fixed for now, matching TimelineView)
    const PIXELS_PER_BEAT = 30;

    // 3. Calculate Dynamic Bar Width
    // 4/4 -> 120px, 3/4 -> 90px
    const barWidth = PIXELS_PER_BEAT * beatsPerBar;

    // Generate tick marks
    const ticks = [];
    for (let i = 0; i < totalBars; i++) {
        ticks.push(
            <div
                key={i}
                className="absolute top-0 h-full flex flex-col justify-end border-l border-gray-600 pl-1 text-[10px] text-gray-400 select-none"
                style={{ left: `${i * barWidth}px`, width: `${barWidth}px` }}
            >
                {/* Bar Number */}
                <span className="absolute top-1 left-1 font-semibold text-gray-400">{i + 1}</span>

                {/* Beat Markers (Dynamic) */}
                <div className="flex h-1/3 w-full items-end">
                    {/* Render dividers for each beat (excluding the start which is the Bar line) */}
                    {Array.from({ length: beatsPerBar - 1 }).map((_, beatIdx) => (
                        <div
                            key={beatIdx}
                            className="h-1/2 border-r border-gray-700"
                            style={{ width: `${100 / beatsPerBar}%` }}
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-8 w-full bg-[#1C1C1C] border-b border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full" style={{ width: `${totalBars * barWidth}px` }}>
                {ticks}
                {/* Playhead is usually overlay over everything, but Ruler has its own playhead triangle sometimes. 
                    For now, Playhead is passed in TimelineView over the whole grid. 
                */}
            </div>
        </div>
    );
};
