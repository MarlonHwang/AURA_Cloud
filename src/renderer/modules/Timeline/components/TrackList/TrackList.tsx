import React from 'react';
import { TrackHeader } from './TrackHeader';
import { useTimelineStore } from '../../store/useTimelineStore';

export const TrackList: React.FC = () => {
    const { tracks, toggleMute, toggleSolo } = useTimelineStore();

    return (
        <div className="w-full h-full flex flex-col bg-[#111] overflow-y-auto">
            {tracks.map(track => (
                <TrackHeader
                    key={track.id}
                    trackName={track.name}
                    type={track.type}
                    color={track.color}
                    isMuted={track.isMuted}
                    isSolo={track.isSolo}
                    onMute={() => toggleMute(track.id)}
                    onSolo={() => toggleSolo(track.id)}
                />
            ))}
            {/* Empty space filler pattern */}
            <div className="flex-1 w-full bg-[#16161C] opacity-50"
                style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px)', backgroundSize: '100% 64px' }}>
            </div>
        </div>
    );
};
