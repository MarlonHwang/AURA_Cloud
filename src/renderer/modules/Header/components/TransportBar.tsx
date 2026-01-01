import React, { useState } from 'react';
import { useAudioStore } from '../../../stores/audioStore';
import { useTimelineStore } from '../../../modules/Timeline/store/useTimelineStore';
import { TransportDisplay } from './TransportDisplay';
import { bridge } from '../../../services/BridgeService';

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

    const toggleRecord = () => {
        setIsRecording(!isRecording);
        console.log('[Transport] Record toggled:', !isRecording);
    };

    const handlePlay = () => {
        // [Bridge] Send Play Command with Mode
        console.log(`[UI] Play Clicked (${playbackMode} Mode)`);
        bridge.sendCommand('/transport/play', {
            bpm: bpm || 120,
            mode: playbackMode
        });

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
        console.log('[UI] Stop Clicked');
        bridge.sendCommand('/transport/stop', {}); // Send Stop Command

        stop(); // Stop Audio Engine
        setIsPlaying(false); // Stop Local Timeline
        console.log('[Transport] Stopped (All Modes)');
    };

    return (
        <>
            <div className="flex items-center justify-between rounded-xl border border-gray-600 shadow-2xl gap-10"
                style={{
                    WebkitAppRegion: 'no-drag', // Ensure controls are clickable
                    padding: '0 40px', // Removed vertical padding to let flex items-center handle alignment
                    height: '90px', // Reduced height as requested
                    boxSizing: 'border-box',
                    // Metallic Gradient (Gunmetal/Dark Grey Faceplate)
                    background: 'linear-gradient(180deg, #464649 0%, #2d2d2f 8%, #1e1e20 40%, #1a1a1c 60%, #202022 92%, #353538 100%)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(0,0,0,0.5)'
                } as any}>

                {/* LEFT: Mode & Transport (Occupies Left 1/3) */}
                <div className="flex-1 flex items-center justify-start">
                    <div className="flex items-center gap-6">
                        {/* 1. Neon Mode Toggle */}
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
                </div>

                {/* CENTER: LCD Display (Fixed Width, Centered) */}
                <div className="flex-none flex justify-center items-center">
                    <TransportDisplay />
                </div>

                {/* RIGHT: Balancer Spacer (Occupies Right 1/3) */}
                <div className="flex-1"></div>

            </div>
        </>
    );
};
