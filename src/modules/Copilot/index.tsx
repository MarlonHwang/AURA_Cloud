import React, { useState, useEffect, useCallback } from 'react';
import { CopilotChat } from './CopilotChat';
import { CopilotInput } from './CopilotInput';

// Define Global Types for Socket
declare global {
    interface Window {
        AURABackend: {
            socket: any;
            emit: (event: string, data: any) => void;
        };
    }
}

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
}

/**
 * AI Copilot Interface (Right Panel)
 * Style: Neon Noir
 */
export const Copilot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'ai', text: 'AURA System Online. Ready for DeepSeek-R1 commands.', timestamp: Date.now() }
    ]);
    const [status, setStatus] = useState<'offline' | 'online' | 'thinking'>('offline');

    // Socket Connection & Events
    useEffect(() => {
        const checkConnection = () => {
            if (window.AURABackend && window.AURABackend.socket && window.AURABackend.socket.connected) {
                setStatus('online');
            }
        };

        // Poll for connection (simple solution)
        const interval = setInterval(checkConnection, 1000);
        checkConnection();

        if (window.AURABackend?.socket) {
            const socket = window.AURABackend.socket;

            socket.on('chat_response', (data: any) => {
                setStatus('online');
                if (data.status === 'success') {
                    addMessage('ai', data.message);
                } else {
                    addMessage('ai', `Error: ${data.message}`);
                }
            });

            socket.on('connect', () => setStatus('online'));
            socket.on('disconnect', () => setStatus('offline'));
        }

        return () => {
            clearInterval(interval);
            if (window.AURABackend?.socket) {
                window.AURABackend.socket.off('chat_response');
            }
        };
    }, []);

    const addMessage = useCallback((role: 'user' | 'ai', text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            role,
            text,
            timestamp: Date.now()
        }]);
    }, []);

    const handleSend = (text: string) => {
        addMessage('user', text);
        setStatus('thinking');

        if (window.AURABackend) {
            window.AURABackend.emit('chat_message', { message: text });
        } else {
            addMessage('ai', 'Error: Backend not connected.');
            setStatus('offline');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1C1C1C] font-sans text-white overflow-hidden">
            {/* 1. Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[#4DFFFF] font-bold tracking-[0.2em] text-sm drop-shadow-[0_0_8px_rgba(77,255,255,0.5)]">
                        AI COPILOT
                    </span>
                </div>
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider ${status === 'online' ? 'text-[#4DFFFF]' : status === 'thinking' ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {status}
                    </span>
                    <div className={`w-2 h-2 rounded-full shadow-inner ${status === 'online' ? 'bg-[#4DFFFF] shadow-[0_0_5px_#4DFFFF]' : status === 'thinking' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                </div>
            </div>

            {/* 2. Message Feed */}
            <CopilotChat messages={messages} />

            {/* 3. Input Area */}
            <CopilotInput onSend={handleSend} />
        </div>
    );
};
