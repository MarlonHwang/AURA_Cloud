import React, { useEffect } from 'react';
import { TransportBar } from './components/TransportBar';
import { HeaderLeft } from './components/HeaderLeft';
import { HeaderRight } from './components/HeaderRight';
import { togglePlayback } from '../../main';

export const HeaderView: React.FC = () => {

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                togglePlayback().catch(err => console.error('[AURA] Shortcut Error:', err));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-between bg-black px-4" style={{ WebkitAppRegion: 'drag' } as any}>
            {/* Left Section */}
            <div className="flex-1 flex justify-start items-center h-full">
                <HeaderLeft />
            </div>

            {/* Center Section - Transport Bar */}
            <div className="flex-initial flex justify-center items-center">
                <TransportBar />
            </div>

            {/* Right Section */}
            <div className="flex-1 flex justify-end items-center h-full">
                <HeaderRight />
            </div>
        </div>
    );
};
