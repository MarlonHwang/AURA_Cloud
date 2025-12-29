import React, { useState } from 'react';
import transportBg from '../../../../../assets/images/transport_bg.png'; // 5 levels to root/assets
import { useAudioStore } from '../../../../../src/stores/audioStore'; // Wait, standard relative path from modules/Timeline/components/Header to src/stores
// Path: src/modules/Timeline/components/Header/TransportBar.tsx
// ../ -> components
// ../../ -> Timeline
// ../../../ -> modules
// ../../../../ -> src
// ../../../../stores/audioStore
// So: ../../../../stores/audioStore

export const TransportBar: React.FC = () => {
    // Connect to Audio Store (Atomic Selectors to prevent re-renders)
    const isPlaying = useAudioStore(state => state.isPlaying);
    const play = useAudioStore(state => state.play);
    const stop = useAudioStore(state => state.stop);
    const position = useAudioStore(state => state.position);
    const bpm = useAudioStore(state => state.bpm);

    // Local state for features not yet in AudioStore (Record)
    const [isRecording, setIsRecording] = useState(false);

    const toggleRecord = () => {
        setIsRecording(!isRecording);
        console.log('[Transport] Record toggled:', !isRecording);
    };

    const handlePlay = () => {
        if (!isPlaying) {
            play();
        } else {
            // Optional: Pause logic if user wants toggle behavior on Play button
            // But usually Play button just Plays. 
            // Let's assume standard behavior: Play starts.
            // If user wants toggle, they typically use Spacebar.
            // For now, let's make it toggle for convenience if needed, 
            // or just ensure it calls play().
            // User request: "Clicking the new 'Play' button actually starts the sequencer"
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
                className="relative flex items-center justify-center bg-no-repeat bg-contain mx-auto z-20 select-none"
                style={{
                    backgroundImage: `url(${transportBg})`,
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
                    {/* Visual Dimmer (Black Overlay when NOT playing? Or Glow when playing?) 
                         User said: "Use isPlaying to toggle the black overlay (Dimmer)" 
                         If !isPlaying, maybe we darken it? Or if isPlaying we light it up?
                         Usually buttons light up when active.
                         Let's assume the base image is "lit" or "neutral".
                         If user wants "Dimmer", maybe the button is dark when OFF.
                         Let's add a semi-transparent black overlay when !isPlaying to simulate "Lights Off"
                      */}
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
