import React, { useState } from 'react';
import { Mic, Send } from 'lucide-react';

interface CopilotInputProps {
    onSend?: (message: string) => void;
}

export const CopilotInput: React.FC<CopilotInputProps> = ({ onSend }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSend = () => {
        if (inputValue.trim()) {
            onSend?.(inputValue);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="p-4 border-t border-white/5 bg-[#1C1C1C]">
            <div className="relative flex items-center gap-2">
                {/* Mic Button */}
                <button className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group">
                    <Mic size={18} className="text-gray-400 group-hover:text-[#4DFFFF] transition-colors" />
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command..."
                        className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-4 pr-10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#4DFFFF]/50 focus:ring-1 focus:ring-[#4DFFFF]/20 transition-all shadow-inner"
                    />
                    {/* Send Button (Inside Input) */}
                    <button
                        onClick={handleSend}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#4DFFFF]/20 transition-all"
                    >
                        <Send size={16} className="text-[#4DFFFF]" />
                    </button>
                </div>
            </div>
        </div>
    );
};
