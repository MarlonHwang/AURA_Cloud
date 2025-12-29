import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { TrackLane } from './TrackLane';
import { RegionBlock } from '../Region/RegionBlock';

interface TimeGridProps {
    totalBars: number;
    pixelsPerBar: number;
}

export const TimeGrid: React.FC<TimeGridProps> = ({ totalBars, pixelsPerBar }) => {
    const { tracks } = useTimelineStore();
    const totalWidth = totalBars * pixelsPerBar;

    // High Visibility Grid Lines
    const gridBackgroundStyle = {
        backgroundImage: `
            linear-gradient(to right, #333 1px, transparent 1px),
            linear-gradient(to right, #222 1px, transparent 1px)
        `,
        backgroundSize: `${pixelsPerBar}px 100%, ${pixelsPerBar / 4}px 100%`
    };

    return (
        <div className="relative w-full h-full">

            {/* 1. Track Lanes (Background Layer) - Z-0 */}
            <div className="relative z-0">
                {tracks.map((track, index) => (
                    <TrackLane key={track.id} index={index}>
                        {/* 
                            Regions - Direct child of TrackLane (relative) 
                            RegionBlock handles its own absolute positioning and Z-index (z-30).
                            
                            ALIGNMENT LOGIC:
                            - Track 2 (Bass, index 1) -> Start Bar 2
                            - Track 3 (Chords, index 2) -> Start Bar 2
                            - Others -> index * 2
                         */}
                        <RegionBlock
                            name={track.name}
                            startBar={index === 1 || index === 2 ? 2 : index * 2}
                            lengthBars={4}
                            pixelsPerBar={pixelsPerBar}
                            baseColor={track.color === 'neon-red' ? 'red' :
                                track.color === 'neon-green' ? 'green' :
                                    track.color === 'neon-yellow' ? 'yellow' :
                                        track.color === 'neon-blue' ? 'blue' :
                                            'purple'}
                        />
                    </TrackLane>
                ))}

                {/* Filler Lanes */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <TrackLane key={`filler-${i}`} index={tracks.length + i}>
                        {/* Empty */}
                    </TrackLane>
                ))}
            </div>

            {/* 2. Vertical Grid Lines Overlay - Z-20 (Above Lanes, Below Regions if Regions are Z-30) 
                 Use pointer-events-none so clicks pass to Lanes.
            */}
            <div
                className="absolute top-0 left-0 h-full pointer-events-none z-20 opacity-40 mix-blend-screen"
                style={{ width: `${totalWidth}px`, ...gridBackgroundStyle }}
            />
        </div>
    );
};
