import React from 'react';

interface TrackLaneProps {
    index: number;
    children?: React.ReactNode;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ index, children }) => {
    // Alternating background for visual rhythm (Zebra striping)
    const bgClass = index % 2 === 0 ? 'bg-[#121212]' : 'bg-[#151515]';

    return (
        <div
            className={`w-full h-16 border-b border-[#333333] relative ${bgClass} hover:bg-[#1f1f1f] transition-colors`}
            style={{ minWidth: '100%' }}
        >
            {/* Regions render here. 
                We add 'pointer-events-none' to the Lane itself if we want clicks to pass through to grid? 
                No, usually nice to click empty lane to deselect.
            */}
            {children}
        </div>
    );
};
