import React, { useState, useEffect, useCallback } from 'react';
import { CopilotChat } from './CopilotChat';
import { CopilotInput } from './CopilotInput';
import { commands } from './commands'; // [Neural Link] Import Command Registry

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

import './styles.css';

/**
 * AI Copilot Interface (Right Panel)
 * Style: Neon Noir
 */
export const Copilot: React.FC = () => {
    // 1. Local Brain State (Qwen 2.5)
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'ai', text: 'Local Brain Ready (Qwen 2.5)', timestamp: Date.now() }
    ]);
    const [statusLocal, setStatusLocal] = useState<'offline' | 'online' | 'thinking'>('offline');

    // 2. Cloud Brain State (DeepSeek V3)
    const [cloudMessages, setCloudMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'ai', text: 'Cloud Brain Ready (DeepSeek V3)', timestamp: Date.now() }
    ]);
    const [statusCloud, setStatusCloud] = useState<'offline' | 'online' | 'thinking'>('offline');

    // Socket Connection & Events
    useEffect(() => {
        const checkConnection = () => {
            if (window.AURABackend && window.AURABackend.socket && window.AURABackend.socket.connected) {
                if (statusLocal === 'offline') setStatusLocal('online');
                if (statusCloud === 'offline') setStatusCloud('online');
            }
        };

        const interval = setInterval(checkConnection, 1000);
        checkConnection();

        if (window.AURABackend?.socket) {
            const socket = window.AURABackend.socket;

            socket.on('chat_response', (data: any) => {
                const source = data.source || 'local'; // Default to local if missing
                const msgText = data.status === 'success' ? data.message : `Error: ${data.message}`;

                if (source === 'local') {
                    setStatusLocal('online');
                    addMessage('local', 'ai', msgText);
                } else if (source === 'cloud') {
                    setStatusCloud('online');
                    addMessage('cloud', 'ai', msgText);
                }
            });

            socket.on('connect', () => {
                setStatusLocal('online');
                setStatusCloud('online');
            });

            socket.on('disconnect', () => {
                setStatusLocal('offline');
                setStatusCloud('offline');
            });
        }

        return () => {
            clearInterval(interval);
            if (window.AURABackend?.socket) {
                window.AURABackend.socket.off('chat_response');
            }
        };
    }, []);

    const addMessage = useCallback((target: 'local' | 'cloud', role: 'user' | 'ai', text: string) => {
        const newMsg = {
            id: Date.now().toString() + Math.random(),
            role,
            text,
            timestamp: Date.now()
        };

        if (target === 'local') {
            setLocalMessages(prev => [...prev, newMsg]);
        } else {
            setCloudMessages(prev => [...prev, newMsg]);
        }
    }, []);

    // 4. Send Handlers (Independent)


    // [Neural Link] Command Router
    // 자연어 명령을 가로채서 즉시 실행하는 로직 (Keyword Spotting)
    const checkCommand = async (text: string): Promise<boolean> => {
        const cmd = text.toLowerCase(); // 공백 유지 (문맥 파악용)

        // Synonyms Definitions (유의어 사전)
        const INTENTS = {
            PLAY: ['play', 'start', 'resume', '재생', '시작', '틀어', '켜', 'go'],
            STOP: ['stop', 'pause', 'silence', 'shut up', 'kill', '정지', '멈춰', '중지', '그만', '꺼', '조용'],
        };

        const hasIntent = (keywords: string[]) => keywords.some(k => cmd.includes(k));

        // 1. STOP Check (Priority High - 긴급 정지)
        if (hasIntent(INTENTS.STOP)) {
            const response = await commands.transport.stop();
            addMessage('local', 'ai', response);
            return true;
        }

        // 2. PLAY Check
        if (hasIntent(INTENTS.PLAY)) {
            const response = await commands.transport.play();
            addMessage('local', 'ai', response);
            return true;
        }

        return false; // 명령어가 아님 -> LLM으로 전달
    };

    // 4. Send Handlers (Independent)
    const handleSendLocal = async (text: string) => {
        addMessage('local', 'user', text);

        // [Neural Link] 1. Check for Commands first
        if (await checkCommand(text)) {
            setStatusLocal('online'); // 명령 실행 후 대기 상태로 복귀
            return;
        }

        // 2. If not a command, send to LLM
        setStatusLocal('thinking');
        if (window.AURABackend) {
            window.AURABackend.emit('chat_local', { message: text });
        } else {
            addMessage('local', 'ai', 'Error: Backend Disconnected');
            setStatusLocal('offline');
        }
    };

    const handleSendCloud = (text: string) => {
        addMessage('cloud', 'user', text);
        setStatusCloud('thinking');
        if (window.AURABackend) {
            window.AURABackend.emit('chat_cloud', { message: text });
        } else {
            addMessage('cloud', 'ai', 'Error: Backend Disconnected');
            setStatusCloud('offline');
        }
    };

    return (
        <div className="copilot-container">
            {/* 1. Global Header */}
            <div className="copilot-header">
                <div className="flex items-center gap-2">
                    <span className="copilot-title">DUAL-BRAIN ARCHITECTURE</span>
                </div>
            </div>

            {/* 2. Split View Container */}
            <div className="dual-brain-container">
                {/* Left: Local Brain */}
                <div className="brain-panel">
                    <div className="brain-header header-local">
                        <span>🏠 Local (Qwen 2.5)</span>
                        <div className="flex items-center gap-1">
                            <span className="status-text">{statusLocal}</span>
                            <div className={`status-dot ${statusLocal === 'online' ? 'dot-online' : statusLocal === 'thinking' ? 'dot-thinking' : ''}`} />
                        </div>
                    </div>
                    <CopilotChat messages={localMessages} status={statusLocal} />
                    <CopilotInput onSend={handleSendLocal} />
                </div>

                {/* Right: Cloud Brain */}
                <div className="brain-panel">
                    <div className="brain-header header-cloud">
                        <span>☁️ Cloud (DeepSeek V3)</span>
                        <div className="flex items-center gap-1">
                            <span className="status-text">{statusCloud}</span>
                            <div className={`status-dot ${statusCloud === 'online' ? 'dot-online' : statusCloud === 'thinking' ? 'dot-thinking' : ''}`} />
                        </div>
                    </div>
                    <CopilotChat messages={cloudMessages} status={statusCloud} />
                    <CopilotInput onSend={handleSendCloud} />
                </div>
            </div>
        </div>
    );
};
