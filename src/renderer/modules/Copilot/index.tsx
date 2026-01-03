import React, { useState, useEffect, useCallback } from 'react';
import { CopilotChat } from './CopilotChat';
import { CopilotInput } from './CopilotInput';
import { commands } from './commands'; // [Neural Link] Import Command Registry

// Define Global Types for Socket is now handled in BridgeService.ts
// declare global {
//     interface Window {
//         AURABackend: {
//             socket: any;
//             emit: (event: string, data: any) => void;
//         };
//     }
// }

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

        // Synonyms Definitions (유의어 사전) - [Updated]
        const INTENTS = {
            PLAY: ['play', 'start', 'resume', '재생', '시작', '틀어', '켜', 'go', 'ray', 'lay', 'salt', 'that'], // Common Whisper mishearings
            STOP: ['stop', 'pause', 'silence', 'shut up', 'kill', '정지', '멈춰', '중지', '그만', '꺼', '조용'],
        };

        const hasIntent = (keywords: string[]) => keywords.some(k => cmd.includes(k));

        // 1. STOP Check (Priority High - 긴급 정지)
        if (hasIntent(INTENTS.STOP)) {
            const response = await commands.transport.stop();
            addMessage('cloud', 'ai', response); // [Fix] Changed to Cloud
            return true;
        }

        // 2. PLAY Check
        if (hasIntent(INTENTS.PLAY)) {
            const response = await commands.transport.play();
            addMessage('cloud', 'ai', response); // [Fix] Changed to Cloud
            return true;
        }
        return true;
    }

    return false; // 명령어가 아님 -> LLM으로 전달
};

// [New] Voice Engine Integration
const [showCalibration, setShowCalibration] = useState(false);
const [voiceActive, setVoiceActive] = useState(false);
const [voiceStatus, setVoiceStatus] = useState<string>('');
const [audioLevel, setAudioLevel] = useState<number>(0);
const [activeMicLabel, setActiveMicLabel] = useState<string>('Default'); // [UI Fix] Show Active Mic

// [CTO FIX] Initialize Global Listener ONCE
useEffect(() => {
    import('../../services/VoiceEngine').then(({ voiceEngine }) => {
        voiceEngine.onStateChange = (isActive) => {
            console.log(`[Copilot] Received State Change: ${isActive}`);
            setVoiceActive(isActive);
        };
    });
}, []);

// [UNICORN] Voice Interaction Logic
useEffect(() => {
    let levelInterval: NodeJS.Timeout;

    // [UNICORN] Voice Interaction Logic
    if (voiceActive) {
        import('../../services/VoiceEngine').then(({ voiceEngine }) => {
            // 1. Monitor Status (Simple)
            voiceEngine.setCallbacks(
                (status) => setVoiceStatus(status),
                () => {
                    // [Fix] Visual Feedback for Wake Word
                    setVoiceStatus('🦄 Listening... (Speak Now)');
                }
            );

            // 2. Start Always-On Listening
            voiceEngine.startListening().catch(err => {
                console.log("Voice Engine Start Failed (Non-Fatal)", err); // [Fix] Don't show calibration on start fail
                // setShowCalibration(true); 
            });

            // (onStateChange handler moved to mount effect)

            // 3. Status Polling Loop
            levelInterval = setInterval(() => {
                setAudioLevel(voiceEngine.getAudioLevel());
                // Check if Voice ID is ready
                if (!voiceEngine.isLoaded && !voiceEngine.checkPersistence()) {
                    setVoiceStatus('⚠️ AURA Missing (Train Required)');
                } else if (voiceEngine.isLoaded) {
                    // Keep current status unless idle?
                    // actually voiceEngine updates status itself.
                }
            }, 60);

            // [UI Fix] Get Initial Mic Label
            setActiveMicLabel(voiceEngine.getActiveDeviceLabel());
        });

        // 4. [UNICORN] Chat Injection Listener
        const onVoiceCommand = (e: CustomEvent<{ text: string }>) => {
            const text = e.detail?.text;
            if (text) {
                console.log(`[Copilot] 📩 Received Voice Command: "${text}"`);
                // [Neural Link Updated] Voice -> Cloud Brain (DeepSeek)
                // 1. Check if it's a Functional Command ("Play", "Stop")
                checkCommand(text).then(isCommand => {
                    if (isCommand) {
                        // Command Executed Locally -> Log to CLOUD Window
                        addMessage('cloud', 'user', text); // [Fix] Changed to Cloud
                        setStatusCloud('online');         // [Fix] Changed to Cloud Status
                    } else {
                        // 2. Not a command? Ask DeepSeek (Cloud)
                        // "How do I make a trap beat?" -> Cloud Brain
                        handleSendCloud(text);
                    }
                });
            }
        };

        window.addEventListener('aura-voice-command' as any, onVoiceCommand);

        return () => {
            window.removeEventListener('aura-voice-command' as any, onVoiceCommand);
            clearInterval(levelInterval);
        };

    } else {
        // Cleanup
        import('../../services/VoiceEngine').then(({ voiceEngine }) => voiceEngine.stopListening());
        setVoiceStatus('');
        setAudioLevel(0);
    }
}, [voiceActive]); // Stable dependency

const toggleVoiceMode = () => {
    // [Brute Force Sync] Delegate logic to VoiceEngine
    import('../../services/VoiceEngine').then(({ voiceEngine }) => {
        voiceEngine.toggleListening();
    });
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

// Assuming `isMinimised` is defined elsewhere or should be added as a prop/state if needed.
// For now, I'll define it as false to avoid errors.
const isMinimised = false;

return (
    <div className={`copilot-container ${isMinimised ? 'hidden' : 'flex'} flex-col bg-[#111] border-l border-[#333] h-full relative`}>
        {/* Calibration Overlay */}
        {showCalibration && (
            <React.Suspense fallback={
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-cyan-400">
                    Loading Dojo...
                </div>
            }>
                {React.createElement(
                    React.lazy(() => import('./VoiceCalibration')),
                    {
                        onClose: () => setShowCalibration(false),
                        onComplete: () => {
                            console.log('[Copilot] Calibration Success -> Activating Voice Mode');
                            setVoiceActive(true);
                        }
                    }
                )}
            </React.Suspense>
        )}

        {/* Header Area Hook */}
        <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
            <div className="flex flex-col" style={{ paddingLeft: '24px' }}> {/* [UI Fix] Forced padding */}
                <h2 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${voiceActive ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}`}></span>
                    AURA Link
                </h2>
                {/* Voice Status Bar */}
                {voiceActive && (
                    <div className="flex flex-col gap-1 mt-1">
                        <span className="text-xs font-mono text-cyan-200/70 animate-pulse">
                            {voiceStatus || "Listening..."}
                        </span>
                        {/* Mini Mic Meter */}
                        <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-75"
                                style={{ width: `${Math.min(audioLevel * 400, 100)}%` }} // Boost visual gain
                            ></div>
                        </div>
                        <span className={`text-[10px] ${audioLevel === -1 ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                            {audioLevel === -1 ? "MIC ERROR (SUSPENDED)" : `Mic Check: ${(audioLevel * 100).toFixed(0)}%`}
                        </span>

                        {/* Device Switcher */}
                        <div className="flex flex-col mt-2 pt-2 border-t border-gray-800">
                            <span className="text-[9px] text-gray-500 mb-1">Active Input:</span>
                            <button
                                onClick={() => {
                                    import('../../services/VoiceEngine').then(async ({ voiceEngine }) => {
                                        const devices = await voiceEngine.getAvailableDevices();
                                        const current = voiceEngine.getActiveDeviceLabel();
                                        const currentIndex = devices.findIndex(d => d.label === current);
                                        const nextIndex = (currentIndex + 1) % devices.length;
                                        const nextDevice = devices[nextIndex];

                                        if (nextDevice) {
                                            console.log(`Switching to: ${nextDevice.label}`);
                                            await voiceEngine.setDeviceId(nextDevice.deviceId);
                                            setActiveMicLabel(nextDevice.label); // [UI Fix] Update Label
                                        }
                                    });
                                }}
                                className="text-[10px] text-cyan-500 hover:text-cyan-300 truncate text-left max-w-full"
                                title="Click to Switch Microphone"
                            >
                                {activeMicLabel} ↻
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                {/* Voice Toggle Button */}
                <button
                    onClick={toggleVoiceMode}
                    className={`p-1 rounded transition-colors ${voiceActive ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}
                    title="Voice Control (Hands-Free)"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                </button>
                {/* Calibrate Button */}
                <button
                    onClick={() => setShowCalibration(true)}
                    className="text-gray-500 hover:text-cyan-400"
                    title="Calibrate Voice ID"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
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
