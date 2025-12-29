import React, { useEffect, useRef } from 'react';

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
        <div className="copilot-messages">
            {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper ${msg.role === 'user' ? 'wrapper-user' : 'wrapper-ai'}`}>
                    {/* Sender Label */}
                    <span className={`sender-label ${msg.role === 'ai' ? 'label-ai' : 'label-user'}`}>
                        {msg.role === 'ai' ? 'AURA' : 'You'}
                    </span>

                    {/* Bubble */}
                    <div className={`message-bubble ${msg.role === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>
                        <p>{msg.text}</p>

                        {/* Timestamp (Hover only) */}
                        <div className="timestamp">
                            {new Date(Number(msg.id.split('.')[0]) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            ))}

            {/* Thinking Indicator */}
            {status === 'thinking' && (
                <div className="message-wrapper wrapper-ai">
                    <span className="sender-label label-ai">AURA</span>
                    <div className="thinking-bubble">
                        <div className="thinking-dot" />
                        <div className="thinking-dot" />
                        <div className="thinking-dot" />
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};
