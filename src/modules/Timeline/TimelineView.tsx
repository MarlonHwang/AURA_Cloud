import React, { useState } from 'react';
import { TrackHeader } from './components/Header/TrackHeader';
import { TimeGrid } from './components/Grid/TimeGrid';
import { RegionBlock } from './components/Region/RegionBlock';
import { Playhead } from './components/Ruler/Playhead';

/**
 * Timeline View (Main Orchestrator)
 */
export const TimelineView: React.FC = () => {
    // Dummy State for Mockup
    const [tracks] = useState([
        { id: 1, name: 'Lead Synth (Serum)', color: 'bg-lime-500' },
        { id: 2, name: 'Bass (Diva)', color: 'bg-fuchsia-500' },
        { id: 3, name: 'Drums (Rack)', color: 'bg-cyan-500' },
        { id: 4, name: 'Vocals (Audio)', color: 'bg-yellow-500' },
    ]);

    const PIXELS_per_BAR = 120;

    return (
        <div className="w-full h-full flex flex-col bg-[#121214] text-white overflow-hidden relative">

            {/* 1. Top Ruler Area (Placeholder) */}
            <div className="h-8 bg-[#1A1A20] border-b border-[#2A2D33] pl-64 relative">
                {/* Simple numeric ruler can go here later */}
                <span className="text-xs text-gray-500 p-2">Timeline Ruler</span>
                <Playhead param={340} />
            </div>

            {/* 2. Main Workspace (Tracks + Grid) */}
            <div className="flex flex-1 overflow-auto relative">

                {/* Left: Track Headers (Fixed Width) */}
                <div className="w-64 flex-shrink-0 bg-[#16161C] border-r border-[#2A2D33] z-20 shadow-xl">
                    {tracks.map(track => (
                        <div key={track.id} className="h-24 border-b border-[#2A2D33]">
                            <TrackHeader
                                trackName={track.name}
                                isMuted={false}
                                isSolo={false}
                                onMute={() => { }}
                                onSolo={() => { }}
                            />
                        </div>
                    ))}
                </div>

                {/* Right: Timeline Grid (Scrollable) */}
                <div className="flex-1 overflow-x-auto relative bg-[#0D0D10]">
                    <div className="relative h-full" style={{ minWidth: '2000px' }}>
                        {/* Background Grid */}
                        <TimeGrid totalBars={32} pixelsPerBar={PIXELS_per_BAR} />

                        {/* Regions Overlay */}
                        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                            {/* Track 1 Regions */}
                            <div className="absolute top-0 h-24 w-full">
                                <RegionBlock startBar={0} lengthBars={4} pixelsPerBar={PIXELS_per_BAR} name="Intro Melody" color="bg-lime-500" />
                                <RegionBlock startBar={8} lengthBars={8} pixelsPerBar={PIXELS_per_BAR} name="Main Theme A" color="bg-lime-500" />
                            </div>

                            {/* Track 2 Regions */}
                            <div className="absolute top-24 h-24 w-full">
                                <RegionBlock startBar={0} lengthBars={2} pixelsPerBar={PIXELS_per_BAR} name="Sub Bass" color="bg-fuchsia-500" />
                                <RegionBlock startBar={4} lengthBars={4} pixelsPerBar={PIXELS_per_BAR} name="Groove Bass" color="bg-fuchsia-500" />
                            </div>

                            {/* Track 3 Regions */}
                            <div className="absolute top-48 h-24 w-full">
                                <RegionBlock startBar={0} lengthBars={16} pixelsPerBar={PIXELS_per_BAR} name="Beat Loop" color="bg-cyan-500" />
                            </div>
                        </div>

                        {/* Playhead Overlay (on Grid) */}
                        <Playhead param={340} />
                    </div>
                </div>
            </div>
        </div>
    );
};
