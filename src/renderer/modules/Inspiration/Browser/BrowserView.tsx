import React from 'react';

export const BrowserView: React.FC = () => {
    return (
        <div className="w-full h-full bg-[#1e1e24] border-r border-[#2A2D33] flex flex-col p-4">
            <h2 className="text-white text-lg font-semibold mb-4">File Browser</h2>
            <div className="flex-1 overflow-y-auto">
                <div className="text-gray-400 text-sm">
                    File system and VST browsing will go here.
                </div>
            </div>
        </div>
    );
};
