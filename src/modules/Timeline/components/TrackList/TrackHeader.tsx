import React, { useState } from 'react';

interface TrackHeaderProps {
    trackName: string;
    type: 'midi' | 'audio';
    color: string;
    isMuted: boolean;
    isSolo: boolean;
    onMute: () => void;
    onSolo: () => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
    trackName,
    type,
    color,
    isMuted,
    isSolo,
    onMute,
    onSolo
}) => {
    // Local state for Record visual (placeholder for now)
    const [isRecordArmed, setIsRecordArmed] = useState(false);

    // Map color name to Tailwind class (border)
    const borderColorClass =
        color === 'neon-red' ? 'border-red-500' :
            color === 'neon-yellow' ? 'border-yellow-500' :
                color === 'neon-blue' ? 'border-blue-500' :
                    color === 'neon-purple' ? 'border-purple-500' : 'border-gray-500';

    return (
        <div className={`
            w-full h-16 flex flex-col 
            bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]
            border-b border-gray-800
            border-l-4 ${borderColorClass}
            relative overflow-hidden group select-none
        `}>
            {/* TOP ROW: Name & Icon */}
            <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Icon Placeholder */}
                    <div className="text-gray-400 opacity-70">
                        {type === 'midi' ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" /></svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" /></svg>
                        )}
                    </div>
                    {/* Track Name */}
                    <span className="text-xs font-bold text-gray-200 truncate tracking-wide">
                        {trackName}
                    </span>
                </div>
            </div>

            {/* BOTTOM ROW: Controls */}
            <div className="flex items-center justify-between px-2 py-1 mt-auto">
                <div className="flex gap-1">
                    {/* MUTE Button */}
                    <button
                        className={`
                            w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border border-gray-700 transition-colors
                            ${isMuted ? 'bg-red-900/80 text-red-100 border-red-800 shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}
                        `}
                        onClick={onMute}
                        title="Mute"
                    >
                        M
                    </button>

                    {/* SOLO Button */}
                    <button
                        className={`
                            w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border border-gray-700 transition-colors
                            ${isSolo ? 'bg-yellow-600/80 text-yellow-100 border-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}
                        `}
                        onClick={onSolo}
                        title="Solo"
                    >
                        S
                    </button>

                    {/* RECORD Button */}
                    <button
                        className={`
                            w-5 h-5 rounded flex items-center justify-center border border-gray-700 transition-colors
                            ${isRecordArmed ? 'bg-[#333] border-red-800' : 'bg-[#333] hover:bg-[#444]'}
                        `}
                        onClick={() => setIsRecordArmed(!isRecordArmed)}
                        title="Arm for Record"
                    >
                        <div className={`rounded-full transition-all ${isRecordArmed ? 'w-3 h-3 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'w-2 h-2 bg-gray-500'}`}></div>
                    </button>
                </div>

                {/* VOLUME KNOB (Visual Only Mock) */}
                <div className="relative w-6 h-6 rounded-full bg-[#111] border border-gray-600 shadow-inner flex items-center justify-center rotate-45 cursor-pointer hover:border-gray-400">
                    <div className="w-[2px] h-2 bg-white rounded-full absolute top-[2px]"></div>
                </div>
            </div>
        </div>
    );
};
