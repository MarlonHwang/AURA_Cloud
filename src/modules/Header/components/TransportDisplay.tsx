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

    // Logic: Remove spaces for BARS mode match TIME mode's tight look
    const displayValue = isTimeMode
        ? formatTime(positionSeconds || 0)
        : formatMusical(rawPos).replace(/\s/g, '');

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
        /* OUTER CHASSIS: Fixed Height 80px (묵직한 정답) */
        <div className="px-[2px] py-[2px] bg-[#1a1a1a] rounded-lg border-t border-gray-700 border-b border-black shadow-xl select-none flex items-center h-[80px] min-w-[580px] shrink-0 box-border">

            {/* INNER SMOKED GLASS */}
            <div className="flex flex-col w-full h-full bg-[#050505] rounded-md shadow-[inset_0_2px_8px_rgba(0,0,0,1)] border-b border-white/5 relative overflow-hidden justify-center py-2">

                {/* Gloss Reflection */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10 opacity-50"></div>

                {/* ================= ROW 1: MAIN INFO ================= */}
                {/* Centered Group with Gap-10 */}
                <div className="flex items-center justify-center gap-10 w-full z-10">

                    {/* ZONE 1 (Left): Position */}
                    {/* Fixed: Use Flex instead of Absolute to keep label visible next to number */}
                    <div onClick={() => setIsTimeMode(!isTimeMode)} className="flex items-baseline justify-end gap-2 cursor-pointer group w-36">
                        <div className="text-right font-mono text-xl tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] group-hover:text-cyan-200 transition-colors">
                            {displayValue}
                        </div>
                        {/* Label is now part of the flow, won't disappear */}
                        <div className="text-[9px] font-bold text-gray-500 w-8">{displayLabel}</div>
                    </div>

                    {/* ZONE 2 (Center): Sig & Dividers */}
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-4 w-[1px] bg-[#222]"></div>
                        <div className="flex items-baseline justify-center w-20 gap-2 opacity-90 group cursor-pointer hover:text-cyan-200 transition-colors">
                            <span className="font-mono text-xl text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{displayTimeSig}</span>
                            <span className="text-xl text-cyan-600/80">♩</span>
                        </div>
                        <div className="h-4 w-[1px] bg-[#222]"></div>
                    </div>

                    {/* ZONE 3 (Right): BPM - Fixed Width & Left Align */}
                    <div className="flex items-baseline justify-start gap-2 w-28 pl-4 group cursor-pointer hover:text-cyan-200 transition-colors">
                        <span className="font-mono text-xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                            {Math.floor(bpm)}
                            <span className="text-sm opacity-70">.{(bpm % 1).toFixed(3).substring(2)}</span>
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold">BPM</span>
                    </div>
                </div>

                {/* ================= ROW 2: CONTROLS ================= */}
                {/* Must mimic Row 1 structure for vertical alignment */}
                <div className="flex items-center justify-center gap-10 w-full mt-1">

                    {/* ZONE 1 Spacer (Matches Position Group w-36) */}
                    <div className="w-36"></div>

                    {/* ZONE 2 Spacer (Matches Center Group approx 114px) */}
                    {/* 1px + 16px(gap) + 80px(w-20) + 16px(gap) + 1px = 114px */}
                    <div className="w-[114px]"></div>

                    {/* ZONE 3 (Right): SNAP - Fixed Width & Left Align */}
                    <div className="flex items-center justify-start gap-2 w-28 pl-4">

                        {/* SNAP Toggle Group */}
                        <button
                            onClick={() => setSnapEnabled(!isSnapEnabled)}
                            className={`flex items-center gap-2 transition-all active:scale-95 group ${isSnapEnabled
                                ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]'
                                : 'text-gray-500 hover:text-gray-400'
                                }`}
                            title="Toggle Snap"
                        >
                            <span className="text-sm font-bold tracking-widest pt-[1px] font-sans">SNAP</span>
                            <Magnet size={16} className={isSnapEnabled ? "text-cyan-400" : "text-gray-500"} strokeWidth={2.5} />
                        </button>

                        {/* Cycle Button (Expands Right) */}
                        <button
                            onClick={cycleSnapInterval}
                            disabled={!isSnapEnabled}
                            className={`text-sm font-mono px-1 whitespace-nowrap cursor-pointer hover:text-cyan-200 transition-colors ${isSnapEnabled
                                ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]'
                                : 'text-gray-500 bg-transparent'
                                }`}
                            title="Click to Cycle Snap Interval"
                        >
                            {snapInterval}
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};
