import React from 'react';
import { TrackHeader } from './components/Header/TrackHeader';
import { TimeGrid } from './components/Grid/TimeGrid';
import { RegionBlock } from './components/Region/RegionBlock';
import { Playhead } from './components/Ruler/Playhead';
import { useTimelineStore } from './store/useTimelineStore';

export const TimelineView: React.FC = () => {
    const { tracks, toggleMute, toggleSolo } = useTimelineStore();
    const PIXELS_per_BAR = 120;
    const TOTAL_BARS = 32;

    return (
        // 1. MAIN CONTAINER (Fills the middle zone)
        <div className="flex h-full w-full bg-[#121212] overflow-hidden">

            {/* 2. LEFT SIDEBAR (Track Headers) - FIXED WIDTH */}
            <div className="w-64 flex-none border-r border-gray-800 bg-[#1C1C1C] flex flex-col z-10">
                {/* Header Title */}
                <div className="h-8 flex-none border-b border-gray-700 px-2 flex items-center text-xs font-bold text-gray-400 bg-[#252525]">
                    TRACKS
                </div>
                {/* Scrollable Track List */}
                <div className="flex-1 overflow-y-auto">
                    {tracks.map(track => (
                        <TrackHeader
                            key={track.id}
                            trackName={track.name}
                            isMuted={track.isMuted}
                            isSolo={track.isSolo}
                            onMute={() => toggleMute(track.id)}
                            onSolo={() => toggleSolo(track.id)}
                        />
                    ))}
                    {/* Filler for empty space */}
                    <div className="flex-1 bg-[#16161C]"></div>
                </div>
            </div>

            {/* 3. RIGHT CONTENT (Ruler & Grid) - FLEXIBLE WIDTH */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Ruler - FIXED HEIGHT */}
                <div className="h-8 flex-none bg-[#1C1C1C] border-b border-gray-800 z-10 relative">
                    <span className="text-[10px] text-gray-600 p-2 block absolute">Ruler</span>
                    <Playhead param={340} />
                </div>

                {/* Main Grid Canvas - SCROLLABLE */}
                <div className="flex-1 overflow-auto relative bg-[#121212]">
                    <div className="relative min-h-full" style={{ width: `${TOTAL_BARS * PIXELS_per_BAR}px`, height: Math.max(800, tracks.length * 64) }}>
                        {/* 1. The Grid Background */}
                        <TimeGrid totalBars={TOTAL_BARS} pixelsPerBar={PIXELS_per_BAR} />

                        {/* 2. Regions Layer */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {tracks.map((track, index) => (
                                <div key={track.id} className="absolute w-full h-[64px]" style={{ top: index * 64 }}>
                                    <div className="pointer-events-auto relative h-full">
                                        <RegionBlock
                                            name={`${track.name} Pattern`}
                                            startBar={index * 2}
                                            lengthBars={4}
                                            pixelsPerBar={PIXELS_per_BAR}
                                            color={track.color === 'neon-red' ? 'bg-red-500' :
                                                track.color === 'neon-yellow' ? 'bg-yellow-500' :
                                                    track.color === 'neon-blue' ? 'bg-blue-500' :
                                                        'bg-purple-500'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 3. Playhead Overlay */}
                        <Playhead param={340} />
                    </div>
                </div>
            </div>

        </div>
    );
};
