import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '../../../../stores/audioStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import { PPQ } from '../../../../utils/constants';

interface PlayheadProps {
    pxPerTick: number; // Required for calculation
}

export const Playhead: React.FC<PlayheadProps> = ({ pxPerTick }) => {
    const playheadRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // Connect to Audio Store
    // const isPlaying = useAudioStore((state) => state.isPlaying); // [FIX] Use TimelineStore for UI source of truth
    const bpm = useAudioStore((state) => state.bpm);

    const positionSeconds = useAudioStore((state) => state.positionSeconds); // Anchor point

    // Connect to Timeline Store
    const playbackMode = useTimelineStore((state) => state.playbackMode);
    const isPlaying = useTimelineStore((state) => state.isPlaying); // [FIX] Direct listen to Timeline Store

    // Refs for Animation Logic
    const lastFrameTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);

    // Animation Loop
    const animate = (time: number) => {
        if (!useTimelineStore.getState().isPlaying) return; // [FIX] Check Timeline Store state

        // Initialize lastFrameTime if needed
        if (lastFrameTimeRef.current === 0) {
            lastFrameTimeRef.current = time;
        }

        const deltaTime = (time - lastFrameTimeRef.current) / 1000; // seconds
        lastFrameTimeRef.current = time;

        // Accumulate time since last sync/start
        accumulatedTimeRef.current += deltaTime;

        // Calculate current position based on anchor + accumulator
        const currentSeconds = useAudioStore.getState().positionSeconds + accumulatedTimeRef.current;

        // Calculate tick and pixel position
        const currentTick = currentSeconds * (bpm / 60) * PPQ;
        const xPosition = currentTick * pxPerTick;

        if (playheadRef.current) {
            playheadRef.current.style.transform = `translateX(${xPosition}px)`;
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (isPlaying && playbackMode === 'SONG') {
            // Start or Resume Playback
            accumulatedTimeRef.current = 0;
            lastFrameTimeRef.current = 0;

            // Cancel any existing loop to be safe
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(animate);
        } else {
            // Stop/Pause or Pattern Mode
            if (requestRef.current) cancelAnimationFrame(requestRef.current);

            // Snap to static position from store if visibly stopped in Song Mode
            if (playbackMode === 'SONG' && playheadRef.current) {
                const currentTick = positionSeconds * (bpm / 60) * PPQ;
                const xPosition = currentTick * pxPerTick;
                playheadRef.current.style.transform = `translateX(${xPosition}px)`;
            }
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, bpm, pxPerTick, positionSeconds, playbackMode]);

    // Render Logic
    if (playbackMode === 'PATTERN') return null; // Hide completely in Pattern Mode

    return (
        <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center group will-change-transform"
            style={{ left: 0 }} // Start at 0, transform moves it
        >
            {/* 1. Playhead Handle (Reference Style: Cyan Shield/Rounded) */}
            <div className="relative filter drop-shadow-md -translate-x-[6.5px]"> {/* Centering adjustment */}
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M0 4C0 1.79086 1.79086 0 4 0H11C13.2091 0 15 1.79086 15 4V9C15 11.2091 13.2091 13 11 13H7.5L4 13L0 9V4Z"
                        fill="#22d3ee" // Cyan-400
                    />
                </svg>
            </div>

            {/* 2. Vertical Line (Thin Cyan Line) */}
            <div className="w-[1px] h-full bg-[#22d3ee] shadow-[0_0_2px_rgba(34,211,238,0.6)]" />
        </div>
    );
};
