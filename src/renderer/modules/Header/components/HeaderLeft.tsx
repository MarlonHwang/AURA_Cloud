import React from 'react';
import { Undo2, Redo2, BarChart2, Disc, Settings } from 'lucide-react';

export const HeaderLeft: React.FC = () => {
    return (
        <div className="flex items-center gap-4 h-full pl-6">
            {/* Project Name */}
            <div className="text-gray-300 font-bold text-lg tracking-wide mr-2">
                Rain-Fi
            </div>

            {/* Undo / Redo Group */}
            <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                    <Undo2 size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                    <Redo2 size={18} />
                </button>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-gray-800 mx-2"></div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {/* Magic Mix Button */}
                <button className="px-4 py-1.5 border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-bold 
                    shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:bg-cyan-950/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all">
                    Magic Mix
                </button>

                {/* Export Button */}
                <button className="px-4 py-1.5 border border-purple-500/50 text-purple-400 rounded-lg text-xs font-bold 
                    shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:bg-purple-950/30 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                    Export
                </button>
            </div>

            {/* Secondary Icons */}
            <div className="flex items-center gap-1 ml-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-gray-800" title="Statistics">
                    <BarChart2 size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-gray-800" title="Target">
                    <Disc size={18} />
                </button>
            </div>
        </div>
    );
};
