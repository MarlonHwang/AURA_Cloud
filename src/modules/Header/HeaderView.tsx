import React from 'react';
import { TransportBar } from './components/TransportBar';
import { HeaderLeft } from './components/HeaderLeft';
import { HeaderRight } from './components/HeaderRight';

export const HeaderView: React.FC = () => {
    return (
        <div className="w-full h-full flex items-center justify-between bg-black px-4">
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
