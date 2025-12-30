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

    // Playback State (Timeline Store)
    const playbackMode = useTimelineStore((state: any) => state.playbackMode);
    const setPlaybackMode = useTimelineStore((state: any) => state.setPlaybackMode);
    // const togglePlaybackMode = useTimelineStore((state: any) => state.togglePlaybackMode); // Unused
    const setIsPlaying = useTimelineStore((state: any) => state.setIsPlaying);
    const isTimelinePlaying = useTimelineStore((state: any) => state.isPlaying);

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
        if (playbackMode === 'PATTERN') {
            // Pattern Mode: Local Playback Only
            if (!isTimelinePlaying) {
                setIsPlaying(true);
                console.log('[Transport] Pattern Mode Started');
            } else {
                // Restart or nothing? Standard implies nothing or pause? 
                // Assuming Play is idempotent or toggles? Usually Play starts. Stop stops.
                // If already playing, maybe restart?
                // For now just ensure it's true.
                setIsPlaying(true);
            }
        } else {
            // Song Mode: Global Transport
            if (!isPlaying) {
                play();
                setIsPlaying(true); // Sync local state
            } else {
                play(); // Re-trigger or continue
            }
        }
    };

    const handleStop = () => {
        stop(); // Stop Audio Engine
        setIsPlaying(false); // Stop Local Timeline
        console.log('[Transport] Stopped (All Modes)');
    };



    return (
        <>
            {/* Main Flex Container - Forcing Size with Inline Styles to avoid Tailwind issues */}
            <div className="flex items-center justify-between bg-black rounded-xl border border-gray-700 shadow-xl gap-10"
                style={{ padding: '16px 40px', height: '80px', boxSizing: 'border-box' }}>

                {/* LEFT: Mode & Transport */}
                <div className="flex items-center gap-6">
                    {/* 1. Mode Toggle */}
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                        <button
                            onClick={() => setPlaybackMode('PATTERN')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${playbackMode === 'PATTERN' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            PAT
                        </button>
                        <button
                            onClick={() => setPlaybackMode('SONG')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${playbackMode === 'SONG' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            SONG
                        </button>
                    </div>

                    {/* 2. Transport Controls (Original Premium Styling) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePlay}
                            className={`transport-btn play-btn ${(isPlaying || isTimelinePlaying) ? 'playing' : ''}`}
                            id="play-btn"
                            title="Play"
                        >
                            <div className="play-icon"></div>
                        </button>

                        <button
                            onClick={handleStop}
                            className="transport-btn stop-btn"
                            title="Stop"
                        >
                            <div className="stop-icon"></div>
                        </button>

                        <button
                            onClick={toggleRecord}
                            className={`rec-btn ${isRecording ? 'recording' : ''}`}
                            title="Record"
                        >
                            <div className="circle"></div>
                        </button>
                    </div>
                </div>

                {/* CENTER: LCD Display */}
                <div className="px-6 py-2 bg-black rounded-lg border border-gray-800 flex items-center justify-center min-w-[200px]">
                    <div className="text-cyan-400 font-mono text-xl tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]">
                        {position || "0:0:0"} <span className="text-gray-600 mx-2">|</span> {bpm} <span className="text-xs text-gray-500">BPM</span>
                    </div>
                </div>

                {/* RIGHT: Snap Controls */}
                <div className="flex items-center gap-3">
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

                    <div className="relative group">
                        <select
                            value={snapInterval}
                            onChange={(e) => setSnapInterval(e.target.value)}
                            className={`
                                appearance-none bg-[#0a0a0a] border border-gray-800 rounded px-3 py-1 text-xs font-bold tracking-wider outline-none cursor-pointer
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

            </div>
        </>
    );
};

