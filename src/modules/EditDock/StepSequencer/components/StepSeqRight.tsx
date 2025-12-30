
import React from 'react';

// Right Panel: Global Controls ONLY
export const StepSeqRight: React.FC = () => {
    return (
        <div className="w-[220px] flex-shrink-0 border-l border-gray-800 p-4 flex flex-col bg-[#0b0c0e]">
            {/* Global Controls Group */}
            <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-700/50 flex-1">
                <h4 className="text-cyan-400 text-xs font-bold mb-4 border-b border-gray-700 pb-2">GLOBAL</h4>

                {/* Swing Slider */}
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-400 font-bold tracking-wide">SWING</label>
                        <span id="swing-value" className="text-[10px] text-green-400 font-mono">50%</span>
                    </div>
                    <input type="range" id="swing-slider" min="0" max="100" defaultValue="50" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400" />
                </div>

                {/* Humanize Slider */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-400 font-bold tracking-wide">HUMANIZE</label>
                        <span id="humanize-value" className="text-[10px] text-blue-400 font-mono">0%</span>
                    </div>
                    <input type="range" id="humanize-slider" min="0" max="100" defaultValue="0" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" />
                </div>
            </div>
        </div>
    );
};
