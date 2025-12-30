import React, { useState } from 'react';
import { useAudioStore } from '../../../stores/audioStore';
import { useTimelineStore } from '../../../modules/Timeline/store/useTimelineStore';
import { Magnet } from 'lucide-react';
import { TransportDisplay } from './TransportDisplay';

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
            <div className="flex items-center justify-between rounded-xl border border-gray-600 shadow-2xl gap-10"
                style={{
                    padding: '8px 40px', // Reduced padding to fit 2-tier in 90px
                    height: '90px', // Reduced height as requested
                    boxSizing: 'border-box',
                    // Metallic Gradient (Gunmetal/Dark Grey Faceplate)
                    background: 'linear-gradient(180deg, #464649 0%, #2d2d2f 8%, #1e1e20 40%, #1a1a1c 60%, #202022 92%, #353538 100%)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(0,0,0,0.5)'
                }}>

                {/* LEFT: Mode & Transport */}
                <div className="flex items-center gap-6">
                    {/* 1. Neon Mode Toggle (Fixed: Radius 8px, Width 120px, Light Pink Song Mode) */}
                    <div className="relative flex items-center rounded-[8px] border h-[38px] w-[120px] box-border select-none overflow-hidden transition-all duration-300"
                        style={{
                            // Background & Border - Matching .play-btn.playing / .rec-btn.recording opacities
                            backgroundColor: playbackMode === 'PATTERN'
                                ? 'rgba(34, 211, 238, 0.1)'   // Cyan background
                                : 'rgba(249, 168, 212, 0.1)',  // Light Pink background (pink-300)

                            borderColor: playbackMode === 'PATTERN'
                                ? 'rgba(34, 211, 238, 0.8)'   // Cyan border
                                : 'rgba(249, 168, 212, 0.8)',  // Light Pink border

                            // Box Shadow - Exact replica of .play-btn.playing but with Cyan/Light Pink
                            boxShadow: playbackMode === 'PATTERN'
                                ? '0 0 15px rgba(34, 211, 238, 0.4), 0 0 30px rgba(34, 211, 238, 0.2), 0 0 50px rgba(34, 211, 238, 0.1), inset 0 0 15px rgba(34, 211, 238, 0.15)'
                                : '0 0 15px rgba(249, 168, 212, 0.4), 0 0 30px rgba(249, 168, 212, 0.2), 0 0 50px rgba(249, 168, 212, 0.1), inset 0 0 15px rgba(249, 168, 212, 0.15)'
                        }}
                    >

                        {/* Pattern Side - Full Left Half */}
                        <button
                            onClick={() => setPlaybackMode('PATTERN')}
                            className={`flex-1 h-full flex justify-center items-center text-[12px] font-bold tracking-[0.15em] transition-all duration-300 outline-none pr-3 ${playbackMode === 'PATTERN'
                                ? 'text-[#e0f7fa]'
                                : 'text-[#666] hover:text-[#888]'
                                }`}
                            style={{
                                fontFamily: '"Segoe UI", monospace',
                                textShadow: playbackMode === 'PATTERN'
                                    ? '0 0 5px #22d3ee, 0 0 10px #22d3ee'
                                    : 'none'
                            }}
                        >
                            PAT
                        </button>

                        {/* Song Side - Full Right Half */}
                        <button
                            onClick={() => setPlaybackMode('SONG')}
                            className={`flex-1 h-full flex justify-center items-center text-[12px] font-bold tracking-[0.15em] transition-all duration-300 outline-none pl-3 ${playbackMode === 'SONG'
                                ? 'text-[#fdf2f8]' // Very light pink text 
                                : 'text-[#666] hover:text-[#888]'
                                }`}
                            style={{
                                fontFamily: '"Segoe UI", monospace',
                                textShadow: playbackMode === 'SONG'
                                    ? '0 0 5px #fbcfe8, 0 0 10px #f9a8d4' // Pastel pink glow
                                    : 'none'
                            }}
                        >
                            SONG
                        </button>

                        {/* Centered Overlay Divider (Pointer Events None) - Height Reduced to 50% */}
                        <div
                            className="absolute left-1/2 top-1/2 h-1/2 w-[1px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-300"
                            style={{
                                backgroundColor: playbackMode === 'PATTERN' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(249, 168, 212, 0.5)',
                                boxShadow: playbackMode === 'PATTERN'
                                    ? '0 0 6px rgba(34, 211, 238, 0.6)'
                                    : '0 0 6px rgba(249, 168, 212, 0.6)'
                            }}
                        ></div>

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

                {/* CENTER: LCD Display (Upgraded to Component) */}
                <TransportDisplay />

                {/* RIGHT: Snap Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSnapEnabled(!isSnapEnabled)}
                        className={`p-2 rounded-md transition-all active:scale-95 ${isSnapEnabled ? 'bg-cyan-950/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-gray-600 hover:text-gray-400'
                            }`}
                        title="Toggle Snap"
                    >
                        <Magnet size={18} strokeWidth={2.5} />
                    </button>

                    <div className="relative group">
                        <select
                            value={snapInterval}
                            onChange={(e) => setSnapInterval(e.target.value)}
                            className={`appearance-none bg-[#0a0a0a] border border-gray-800 rounded px-3 py-1 text-xs font-bold tracking-wider outline-none cursor-pointer ${isSnapEnabled ? 'text-cyan-400 border-cyan-900/50' : 'text-gray-600 border-gray-800'
                                }`}
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
