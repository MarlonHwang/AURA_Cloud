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
        <div className="copilot-input-container">
            <div className="input-wrapper">
                {/* Mic Button */}
                <button className="mic-btn">
                    <Mic size={18} />
                </button>

                {/* Text Input */}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command..."
                    className="chat-input-field"
                />

                {/* Send Button (Absolute) */}
                <button
                    onClick={handleSend}
                    className="send-btn-abs"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};
