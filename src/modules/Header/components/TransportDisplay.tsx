import React, { useState } from 'react';
import { useAudioStore } from '../../../stores/audioStore';

export const TransportDisplay: React.FC = () => {
    // Connect to Audio Store
    const position = useAudioStore((state: any) => state.position); // "Bar:Beat:Sixteenth"
    const positionSeconds = useAudioStore((state: any) => state.positionSeconds); // Number (seconds)
    const bpm = useAudioStore((state: any) => state.bpm);
    const timeSignature = useAudioStore((state: any) => state.timeSignature);

    // Local State for Unit Toggling (false = Musical BARS, true = Real Time)
    const [isTimeMode, setIsTimeMode] = useState(false);

    // Helper: Format Seconds to Min:Sec:Ms
    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds * 100) % 100);
        return `${mins}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    };

    // Helper: Format Musical Position (Bar:Beat:Tick)
    const formatMusical = (posStr: string | null) => {
        if (!posStr) return "1:01:00";
        const parts = posStr.split(':');
        if (parts.length < 3) return posStr;
        return `${parts[0]}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    };

    const rawPos = (position === "0:0:0" || !position) ? "1:1:0" : position;

    const displayValue = isTimeMode
        ? formatTime(positionSeconds || 0)
        : formatMusical(rawPos);

    const displayLabel = isTimeMode ? "TIME" : "BARS";

    // Format Time Signature
    const displayTimeSig = timeSignature ? `${timeSignature[0]}/${timeSignature[1]}` : "4/4";

    return (
        // MAIN CONTAINER: Expanded Height, Flex Column
        <div className="flex flex-col w-[580px] h-full bg-black rounded-lg border border-gray-800 shadow-inner select-none transition-colors duration-200 overflow-hidden relative">

            {/* ROW 1: Musical Time / Status (Existing) - Top Half */}
            <div className="flex-1 flex items-center justify-center px-8 relative border-b border-gray-900">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xl tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]">

                    {/* 1. LEFT GROUP: Position & Label */}
                    <div
                        className="w-[180px] flex items-center justify-end gap-3 cursor-pointer group hover:text-cyan-200 px-2"
                        onClick={() => setIsTimeMode(!isTimeMode)}
                        title="Toggle Bars / Time"
                    >
                        <div className="text-right tabular-nums">
                            {displayValue}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold w-[30px] pt-1 text-left">
                            {displayLabel}
                        </span>
                    </div>

                    <span className="text-gray-700 mx-2">|</span>

                    {/* 2. CENTER GROUP: Time Signature & Quarter Note */}
                    <div className="flex items-center justify-center gap-2 w-[80px] text-center group cursor-pointer hover:text-cyan-200">
                        <span>{displayTimeSig}</span>
                        {/* Refined Quarter Note */}
                        <svg
                            width="12"
                            height="16" // Increased from 14 to 16
                            viewBox="0 0 24 24"
                            className="mb-[3px] drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <linearGradient id="note-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="100%" stopColor="#0891b2" />
                                </linearGradient>
                            </defs>
                            <path
                                fill="url(#note-gradient)"
                                // Elongated Stem: M19 0.5 (was 3), v15.5 (was 13)
                                d="M19 0.5v15.5c0 4.1-2.9 7-6.5 7S7 20.6 7 17.5c0-3.3 2.7-6 6.5-6 .6 0 1.2.1 1.8.2V0.5h3.7z"
                            />
                        </svg>
                    </div>

                    <span className="text-gray-700 mx-2">|</span>

                    {/* 3. RIGHT GROUP: BPM */}
                    <div className="w-[180px] flex items-center justify-start gap-3 group cursor-pointer hover:text-cyan-200 px-2">
                        <div className="flex items-baseline tabular-nums text-right">
                            <span>{Math.floor(bpm)}</span>
                            <span className="text-sm opacity-70">
                                .{(bpm % 1).toFixed(3).substring(2)}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold pt-1">BPM</span>
                    </div>

                </div>
            </div>

            {/* ROW 2: Empty Placeholder for Future Content - Bottom Half */}
            <div className="flex-1 flex items-center justify-center bg-gray-900/10">
                <span className="text-[10px] text-gray-600 font-mono tracking-widest opacity-30">
                    -- AVAILABLE SLOT --
                </span>
            </div>

        </div>
    );
};
