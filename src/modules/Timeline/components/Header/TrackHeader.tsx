import React from 'react';

interface TrackHeaderProps {
    trackName: string;
    isMuted: boolean;
    isSolo: boolean;
    onMute: () => void;
    onSolo: () => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
    trackName,
    isMuted,
    isSolo,
    onMute,
    onSolo
}) => {
    return (
        <div className="flex items-center h-16 w-full bg-gray-900 border-b border-gray-800 px-4 select-none">
            {/* Icon */}
            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center mr-3 text-cyan-400">
                <span className="text-xl">🎵</span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0 mr-4">
                <span className="text-gray-100 font-bold tracking-wide truncate block">
                    {trackName}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onMute}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${isMuted
                            ? 'bg-red-500/20 text-red-500 border border-red-500'
                            : 'bg-gray-800 text-gray-500 hover:text-red-400'
                        }`}
                >
                    M
                </button>
                <button
                    onClick={onSolo}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${isSolo
                            ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500'
                            : 'bg-gray-800 text-gray-500 hover:text-yellow-400'
                        }`}
                >
                    S
                </button>
            </div>
        </div>
    );
};
