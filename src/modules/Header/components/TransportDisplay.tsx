import React, { useState } from 'react';
import { useAudioStore } from '../../../stores/audioStore';
import { useTimelineStore } from '../../../modules/Timeline/store/useTimelineStore';
import { Magnet } from 'lucide-react';

export const TransportDisplay: React.FC = () => {
    // Connect to Audio Store
    const position = useAudioStore((state: any) => state.position); // "Bar:Beat:Sixteenth"
    const positionSeconds = useAudioStore((state: any) => state.positionSeconds); // Number (seconds)
    const bpm = useAudioStore((state: any) => state.bpm);
    const timeSignature = useAudioStore((state: any) => state.timeSignature);

    // Snap State (Global)
    const isSnapEnabled = useTimelineStore((state: any) => state.isSnapEnabled);
    const snapInterval = useTimelineStore((state: any) => state.snapInterval);
    const setSnapEnabled = useTimelineStore((state: any) => state.setSnapEnabled);
    const setSnapInterval = useTimelineStore((state: any) => state.setSnapInterval);

    // Local State
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
    const displayTimeSig = timeSignature ? `${timeSignature[0]}/${timeSignature[1]}` : "4/4";

    const snapOptions = ["BAR", "BEAT", "EVENT"];

    // Cycle through snap options: BAR -> BEAT -> EVENT -> BAR
    const cycleSnapInterval = () => {
        if (!isSnapEnabled) return;
        const currentIndex = snapOptions.indexOf(snapInterval);
        const nextIndex = (currentIndex + 1) % snapOptions.length;
        setSnapInterval(snapOptions[nextIndex]);
    };

    return (
        // OUTER CHASSIS: Brushed Metal feel with 3D Bevel (Fixed Width 580px)
        <div className="p-[3px] rounded-xl bg-gradient-to-b from-[#3a3a3a] via-[#1a1a1a] to-[#0d0d0d] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.8),0_0_2px_rgba(0,0,0,1)] flex flex-col w-[580px] min-w-[580px] shrink-0 h-full select-none relative box-border">

            {/* INNER CHASSIS BORDER (Dark Rim) */}
            <div className="w-full h-full bg-[#080808] rounded-[9px] p-[1px] relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_0_5px_rgba(0,0,0,1)]">

                {/* 
                    GLASS DISPLAY STRUCTURE 
                    - Visual Background (Clipped) 
                    - Content (Visible)
                */}

                {/* 1. VISUAL LAYER (Backgrounds, Gloss, clipped to rounded corners) */}
                <div className="absolute inset-0 rounded-[8px] overflow-hidden pointer-events-none">
                    {/* Base Background: Deep Black with cool radial tint */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0d1216_0%,_#000000_80%)] opacity-80"></div>
                    {/* Top Gloss */}
                    <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.04] to-transparent"></div>
                    {/* Edge Highlight (Fresnel) */}
                    <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/[0.08]"></div>
                </div>

                {/* 2. CONTENT LAYER (Interactive) */}
                <div className="relative w-full h-full z-10 flex flex-col justify-center">

                    {/* ROW 1: Musical Time / Status (Centered) */}
                    <div className="flex items-center justify-center gap-6 z-10 mt-1 pb-1 border-b border-white/[0.03]">
                        {/* Position */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group hover:text-cyan-200 transition-colors"
                            onClick={() => setIsTimeMode(!isTimeMode)}
                            title="Toggle Bars / Time"
                        >
                            <div className="w-[110px] text-right font-mono text-xl tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                                {displayValue}
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold w-[30px] pt-1">{displayLabel}</span>
                        </div>

                        {/* Separator */}
                        <div className="h-4 w-[1px] bg-[#222]"></div>

                        {/* Time Sig */}
                        <div className="flex items-center justify-center gap-2 w-[60px] opacity-90 group cursor-pointer hover:text-cyan-200 transition-colors">
                            <span className="font-mono text-lg text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{displayTimeSig}</span>
                            <span className="text-xs text-cyan-600/80 pb-1">♩</span>
                        </div>

                        {/* Separator */}
                        <div className="h-4 w-[1px] bg-[#222]"></div>

                        {/* BPM */}
                        <div className="flex items-center gap-2 w-[110px] justify-start group cursor-pointer hover:text-cyan-200 transition-colors px-2">
                            <span className="font-mono text-xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] text-right w-[70px]">
                                {Math.floor(bpm)}<span className="text-sm opacity-70">.{(bpm % 1).toFixed(3).substring(2)}</span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold pt-1">BPM</span>
                        </div>
                    </div>

                    {/* ROW 2: SNAP CONTROLS (Right Aligned with INVISIBLE SPACER) */}
                    {/* Using w-8 spacer div to force physical gap from right edge */}
                    <div className="flex items-center justify-end w-full pt-1">

                        {/* Content Group */}
                        <div className="flex items-center gap-1.5">

                            {/* SNAP Toggle */}
                            <button
                                onClick={() => setSnapEnabled(!isSnapEnabled)}
                                className={`flex items-center gap-1.5 transition-all active:scale-95 group ${isSnapEnabled
                                    ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]'
                                    : 'text-gray-600 hover:text-gray-400'
                                    }`}
                                title="Toggle Snap"
                            >
                                <span className="text-[12px] font-bold tracking-widest pt-[1px]">SNAP</span>
                                <Magnet size={12} strokeWidth={2.5} />
                            </button>

                            {/* Cycle Button */}
                            <button
                                onClick={cycleSnapInterval}
                                disabled={!isSnapEnabled}
                                className={`text-[12px] font-bold tracking-wider outline-none cursor-pointer uppercase font-mono transition-colors border-none text-left select-none pl-1 ${isSnapEnabled
                                        ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)] hover:text-cyan-200'
                                        : 'text-gray-600'
                                    }`}
                                title="Click to Cycle Snap Interval"
                            >
                                {snapInterval}
                            </button>
                        </div>

                        {/* INVISIBLE SPACER (32px) */}
                        <div className="w-8 h-1 shrink-0"></div>
                    </div>

                </div>
            </div>
        </div>
    );
};
