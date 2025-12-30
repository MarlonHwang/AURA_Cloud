import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useAudioStore } from '../../../../stores/audioStore';
import { TrackLane } from './TrackLane';
import { RegionBlock } from '../Region/RegionBlock';

interface TimeGridProps {
    totalBars: number;
    pixelsPerBar: number;
}

export const TimeGrid: React.FC<TimeGridProps> = ({ totalBars, pixelsPerBar }) => {
    const { tracks } = useTimelineStore();

    // 1. Selector
    // We access useAudioStore, casting to any to avoid strict type mismatch during this debug phase
    const rawSig = useAudioStore((state: any) => state.timeSignature);

    // Zoom is currently fixed in TimelineView at 30, so we replicate it here
    const zoom = 30;

    // 2. Parse Logic
    // Handle Array [4,4] (Store Default) OR String "4/4" (User Expectation)
    let beatsPerBar = 4;

    if (Array.isArray(rawSig)) {
        beatsPerBar = rawSig[0];
    } else if (typeof rawSig === 'string') {
        const [num] = rawSig.split('/').map(Number);
        beatsPerBar = num || 4;
    } else if (typeof rawSig === 'number') {
        beatsPerBar = 4;
    }

    // Render configuration
    const totalBeats = totalBars * beatsPerBar;
    const totalWidth = totalBeats * zoom;

    // Render Loop
    const lines = [];
    for (let i = 0; i < totalBeats; i++) {
        // Bar Start Logic
        const isBarStart = (i % beatsPerBar) === 0;

        // Visuals (Subtle Production Style)
        const lineColor = isBarStart ? '#374151' : '#1f2937'; // gray-700 vs gray-800
        const lineOpacity = isBarStart ? 0.5 : 0.3;
        const lineZ = isBarStart ? 10 : 1;

        lines.push(
            <div
                key={i}
                style={{
                    position: 'absolute',
                    left: `${i * zoom}px`, // Absolute positioning from 0
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: lineColor,
                    opacity: lineOpacity,
                    zIndex: lineZ,
                    pointerEvents: 'none'
                }}
            />
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* 1. Track Lanes (Background) */}
            <div className="relative z-0">
                {tracks.map((track, index) => (
                    <TrackLane key={track.id} index={index}>
                        <RegionBlock
                            name={track.name}
                            startBar={index === 1 || index === 2 ? 2 : index * 2}
                            lengthBars={4}
                            pixelsPerBar={pixelsPerBar} // Keep using prop for Regions if they rely on it
                            baseColor={track.color === 'neon-red' ? 'red' :
                                track.color === 'neon-green' ? 'green' :
                                    track.color === 'neon-yellow' ? 'yellow' :
                                        track.color === 'neon-blue' ? 'blue' :
                                            'purple'}
                        />
                    </TrackLane>
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                    <TrackLane key={`filler-${i}`} index={tracks.length + i}></TrackLane>
                ))}
            </div>

            {/* 2. Grid Overlay */}
            <div className="absolute top-0 left-0 h-full w-full pointer-events-none z-20 mix-blend-screen" style={{ width: `${totalWidth}px` }}>
                {lines}
            </div>
        </div>
    );
};
