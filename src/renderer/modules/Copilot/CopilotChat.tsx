import React, { useEffect, useRef } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

interface CopilotChatProps {
    messages: Message[];
    status?: 'offline' | 'online' | 'thinking';
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ messages, status }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, status]);

    return (
        <div className="copilot-messages h-full overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Sender Label */}
                    <span className={`sender-label text-xs font-bold mb-1 ${msg.role === 'ai' ? 'text-neon-cyan' : 'text-gray-400'}`}>
                        {msg.role === 'ai' ? 'AURA' : 'You'}
                    </span>

                    {/* Bubble */}
                    <div className={`message-bubble max-w-[85%] rounded-lg p-4 shadow-md ${msg.role === 'ai'
                        ? 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
                        : 'bg-neon-blue/20 text-white border border-neon-blue/30'
                        }`}>

                        {/* ReactMarkdown Implementation */}
                        <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Custom styling for code blocks
                                    code({ node, inline, className, children, ...props }: any) {
                                        return !inline ? (
                                            <div className="bg-gray-800 rounded-md p-2 my-2 overflow-x-auto border border-gray-700">
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </div>
                                        ) : (
                                            <code className="bg-gray-800 rounded px-1 py-0.5 text-neon-cyan" {...props}>
                                                {children}
                                            </code>
                                        )
                                    }
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>
                        </div>

                        {/* Timestamp */}
                        <div className="timestamp text-[10px] text-gray-500 mt-2 text-right opacity-50">
                            {new Date(Number(msg.id.split('.')[0]) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            ))}

            {/* Thinking Indicator */}
            {status === 'thinking' && (
                <div className="message-wrapper flex flex-col items-start">
                    <span className="sender-label text-xs font-bold mb-1 text-neon-cyan">AURA</span>
                    <div className="thinking-bubble bg-gray-800/80 rounded-lg p-3 flex gap-1">
                        <div className="thinking-dot w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="thinking-dot w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="thinking-dot w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};
