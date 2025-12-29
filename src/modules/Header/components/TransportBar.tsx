import React, { useState } from 'react';
import { useAudioStore } from '../../../stores/audioStore';
import { useTimelineStore } from '../../../modules/Timeline/store/useTimelineStore';
import { Magnet } from 'lucide-react';

export const TransportBar: React.FC = () => {
    // Connect to Audio Store (Atomic Selectors to prevent re-renders)
    const isPlaying = useAudioStore((state: any) => state.isPlaying);
    const play = useAudioStore((state: any) => state.play);
    const stop = useAudioStore((state: any) => state.stop);
    const position = useAudioStore((state: any) => state.position);
    const bpm = useAudioStore((state: any) => state.bpm);

    // Local state for features not yet in AudioStore (Record)
    const [isRecording, setIsRecording] = useState(false);

    // Snap State (Global)
    const isSnapEnabled = useTimelineStore((state: any) => state.isSnapEnabled);
    const snapInterval = useTimelineStore((state: any) => state.snapInterval);
    const setSnapEnabled = useTimelineStore((state: any) => state.setSnapEnabled);
    const setSnapInterval = useTimelineStore((state: any) => state.setSnapInterval);

    const toggleRecord = () => {
        setIsRecording(!isRecording);
        console.log('[Transport] Record toggled:', !isRecording);
    };

    const handlePlay = () => {
        if (!isPlaying) {
            play();
        } else {
            // Standard behavior: Play starts.
            play();
        }
    };

    const handleStop = () => {
        stop();
    };

    return (
        <div className="w-full flex justify-center py-4 bg-[#121212] border-b border-gray-800">
            {/* Container mimicking the physical device */}
            <div
                className="relative flex items-center justify-center mx-auto z-20 select-none bg-[#1C1C1C] rounded-xl border border-gray-700 shadow-xl"
                style={{
                    width: '730px',
                    height: '90px'
                }}
            >
                {/* INVISIBLE BUTTON LAYERS (Click Zones) */}

                {/* Play Button Zone - Left most large button area */}
                <div
                    className={`absolute left-[40px] top-[20px] w-[60px] h-[60px] cursor-pointer rounded-lg transition-colors ${!isPlaying ? 'hover:bg-white/5 active:bg-white/10' : 'bg-transparent'}`}
                    onClick={handlePlay}
                    title="Play"
                >
                    {!isPlaying && (
                        <div className="absolute inset-0 bg-black/40 rounded-lg pointer-events-none" />
                    )}
                </div>

                {/* Stop Button Zone */}
                <div
                    className="absolute left-[110px] top-[20px] w-[60px] h-[60px] cursor-pointer rounded-lg hover:bg-white/5 active:bg-white/10"
                    onClick={handleStop}
                    title="Stop"
                />

                {/* Record Button Zone */}
                <div
                    className="absolute left-[180px] top-[20px] w-[60px] h-[60px] cursor-pointer rounded-lg transition-colors"
                    onClick={toggleRecord}
                    title="Record"
                >
                    {!isRecording && (
                        <div className="absolute inset-0 bg-black/40 rounded-lg pointer-events-none" />
                    )}
                </div>

                {/* SNAP CONTROLS (Center-Left) */}
                <div className="absolute left-[260px] top-[26px] flex items-center gap-3">
                    {/* 1. Snap Toggle (Magnet) */}
                    <button
                        onClick={() => setSnapEnabled(!isSnapEnabled)}
                        className={`
                            p-2 rounded-md transition-all active:scale-95
                            ${isSnapEnabled ? 'bg-cyan-950/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-gray-600 hover:text-gray-400'}
                        `}
                        title="Toggle Snap"
                    >
                        <Magnet size={18} strokeWidth={2.5} />
                    </button>

                    {/* 2. Snap Interval Dropdown */}
                    <div className="relative group">
                        <select
                            value={snapInterval}
                            onChange={(e) => setSnapInterval(e.target.value)}
                            className={`
                                appearance-none bg-[#0a0a0a] border border-gray-800 rounded px-2 py-1 text-xs font-bold tracking-wider outline-none cursor-pointer
                                ${isSnapEnabled ? 'text-cyan-400 border-cyan-900/50' : 'text-gray-600 border-gray-800'}
                            `}
                            disabled={!isSnapEnabled}
                        >
                            <option value="BAR">BAR</option>
                            <option value="BEAT">BEAT</option>
                            <option value="EVENT">EVENT</option>
                        </select>
                    </div>
                </div>

                {/* LCD SCREEN OVERLAY */}
                {/* 1. Black Patch to hide static text */}
                <div className="absolute right-[50px] top-[25px] w-[260px] h-[40px] bg-black flex items-center justify-center overflow-hidden">
                    {/* 2. Real Dynamic Text */}
                    <div className="text-cyan-400 font-mono text-lg tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                        {/* Format: BAR:BEAT:SIXTEENTH | BPM */}
                        {position || "0:0:0"} | {bpm} BPM
                    </div>
                </div>
            </div>
        </div>
    );
};
