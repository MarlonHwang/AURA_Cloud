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
        // OUTER CHASSIS: Brushed Metal feel with 3D Bevel
        // - Enhanced Gradient: top-light to bottom-dark for metallic cylinder feel
        // - Multi-layer Shadows: Drop shadow + Inset lighting
        <div className="p-[3px] rounded-xl bg-gradient-to-b from-[#3a3a3a] via-[#1a1a1a] to-[#0d0d0d] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.8),0_0_2px_rgba(0,0,0,1)] flex flex-col w-[580px] h-full select-none relative group box-border">

            {/* INNER CHASSIS BORDER (Dark Rim) */}
            <div className="w-full h-full bg-[#080808] rounded-[9px] p-[1px] relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_0_5px_rgba(0,0,0,1)]">

                {/* GLASS DISPLAY CONTAINER */}
                <div className="w-full h-full bg-[#020202] rounded-[8px] relative overflow-hidden flex flex-col shadow-[inset_0_2px_12px_rgba(0,0,0,1)]">

                    {/* 1. GLASS BACKGROUND: Deep Black with subtle cool-tint radial center */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0d1216_0%,_#000000_80%)] opacity-80"></div>

                    {/* 2. TOP GLOSS REFLECTION (The "Wet" look) */}
                    <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none z-10"></div>

                    {/* 3. EDGE HIGHLIGHT (Fresnel Lens Effect) */}
                    <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/[0.08] pointer-events-none z-20"></div>

                    {/* CONTENT LAYER (on top of backgrounds, below gloss) */}
                    <div className="relative w-full h-full z-10 flex flex-col">

                        {/* ROW 1: Musical Time / Status */}
                        <div className="flex-1 flex items-center justify-center px-8 relative border-b border-white/[0.03]">
                            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xl tracking-widest drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">

                                {/* 1. LEFT GROUP: Position & Label */}
                                <div
                                    // CHANGED: items-center -> items-baseline (Fixes vertical alignment)
                                    className="w-[180px] flex items-baseline justify-end gap-3 cursor-pointer group hover:text-cyan-200 px-2 transition-colors duration-200"
                                    onClick={() => setIsTimeMode(!isTimeMode)}
                                    title="Toggle Bars / Time"
                                >
                                    <div className="text-right tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                                        {displayValue}
                                    </div>
                                    {/* Removed 'pt-1' as baseline alignment handles it better naturally */}
                                    <span className="text-[10px] text-gray-500 font-bold w-[30px] text-left group-hover:text-gray-400 transition-colors">
                                        {displayLabel}
                                    </span>
                                </div>

                                {/* Vertical Separator: Embossed look */}
                                <div className="h-6 w-[2px] bg-black shadow-[1px_0_0_rgba(255,255,255,0.05)] rounded-full mx-2"></div>

                                {/* 2. CENTER GROUP: Time Signature & Quarter Note */}
                                <div className="flex items-center justify-center gap-2 w-[80px] text-center group cursor-pointer hover:text-cyan-200 transition-colors duration-200">
                                    <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{displayTimeSig}</span>
                                    {/* Refined Quarter Note */}
                                    <svg
                                        width="12"
                                        height="16"
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
                                            d="M19 0.5v15.5c0 4.1-2.9 7-6.5 7S7 20.6 7 17.5c0-3.3 2.7-6 6.5-6 .6 0 1.2.1 1.8.2V0.5h3.7z"
                                        />
                                    </svg>
                                </div>

                                {/* Vertical Separator */}
                                <div className="h-6 w-[2px] bg-black shadow-[1px_0_0_rgba(255,255,255,0.05)] rounded-full mx-2"></div>

                                {/* 3. RIGHT GROUP: BPM */}
                                <div
                                    // CHANGED: items-center -> items-baseline (Fixes vertical alignment)
                                    className="w-[180px] flex items-baseline justify-start gap-3 group cursor-pointer hover:text-cyan-200 px-2 transition-colors duration-200"
                                >
                                    <div className="flex items-baseline tabular-nums text-right drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                                        <span>{Math.floor(bpm)}</span>
                                        <span className="text-sm opacity-70">
                                            .{(bpm % 1).toFixed(3).substring(2)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold group-hover:text-gray-400 transition-colors">BPM</span>
                                </div>

                            </div>
                        </div>

                        {/* ROW 2: Empty Placeholder for Future Content - Bottom Half */}
                        <div className="flex-1 flex items-center justify-center">
                            {/* Content cleared as requested */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
