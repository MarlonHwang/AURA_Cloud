import React from 'react';
import { Settings, User, Bell, HelpCircle } from 'lucide-react';
import { WindowControls } from './WindowControls';

export const HeaderRight: React.FC = () => {
    return (
        <div className="flex items-center gap-4 h-full">
            {/* Removed pr-32 as controls are now inline flex items */}

            <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                    <HelpCircle size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                    <Bell size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                    <Settings size={18} />
                </button>
            </div>

            <div className="w-[1px] h-6 bg-gray-800 mx-2"></div>

            <button className="flex items-center gap-2 group cursor-pointer hover:bg-gray-900 px-3 py-1.5 rounded-full transition-colors" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg transform group-hover:scale-105 transition-transform">
                    US
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-gray-200 text-xs font-bold group-hover:text-white">User</span>
                    <span className="text-[10px] text-gray-500 group-hover:text-cyan-400">Pro Plan</span>
                </div>
            </button >

            <WindowControls />
        </div >
    );
};
