import React from 'react';
import { TrackList } from './components/TrackList/TrackList';
import { TimeGrid } from './components/Grid/TimeGrid';
import { Ruler } from './components/Ruler/Ruler';
import { Playhead } from './components/Ruler/Playhead';
import { useTimelineStore } from './store/useTimelineStore';

export const TimelineView: React.FC = () => {
    const { tracks } = useTimelineStore();
    const PIXELS_per_BAR = 120;
    const TOTAL_BARS = 32;

    // Calculate grid height to ensure it matches or exceeds track list
    const gridHeight = Math.max(800, tracks.length * 64);

    return (
        // 1. MAIN CONTAINER (Fills the middle zone)
        <div className="flex h-full w-full bg-[#121212] overflow-hidden">

            {/* 2. LEFT SIDEBAR (Track Headers) - FIXED WIDTH */}
            <div className="w-64 flex-none border-r border-gray-800 bg-[#1C1C1C] flex flex-col z-20 shadow-xl">
                {/* Header Title */}
                <div className="h-8 flex-none border-b border-gray-700 px-3 flex items-center justify-between text-[11px] font-bold text-gray-400 bg-[#252525]">
                    <span>TRACKS</span>
                    <span className="opacity-50">+</span>
                </div>

                {/* MODULAR TRACK LIST */}
                <div className="flex-1 overflow-hidden relative">
                    <TrackList />
                </div>
            </div>

            {/* 3. RIGHT CONTENT (Ruler & Grid) - FLEXIBLE WIDTH */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#121212]">
                {/* 
                   Move RULER inside the scrollable area so it scrolls horizontally with the grid.
                   Also allows Playhead (which lives here) to overlay both Ruler and Grid without clipping issues.
                */}
                <div className="flex-1 overflow-auto relative">
                    {/* Sizing Container: Includes Ruler Height (32px) + Grid Height */}
                    <div className="relative min-h-full" style={{ width: `${TOTAL_BARS * PIXELS_per_BAR}px`, height: gridHeight + 32 }}>

                        {/* TOP RULER (Absolute at top) */}
                        <div className="absolute top-0 left-0 right-0 h-8 z-40 sticky-ruler-placeholder">
                            <Ruler totalBars={TOTAL_BARS} pixelsPerBar={PIXELS_per_BAR} />
                        </div>

                        {/* MAIN GRID CANVAS (Offset by 32px for Ruler) */}
                        <div className="absolute top-8 left-0 right-0 bottom-0">
                            <TimeGrid totalBars={TOTAL_BARS} pixelsPerBar={PIXELS_per_BAR} />
                        </div>

                        {/* Playhead Overlay (Spans entire height, on top of everything) */}
                        <div className="absolute top-0 bottom-0 pointer-events-none z-50">
                            <Playhead param={340} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
