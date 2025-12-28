import React, { useEffect, useRef } from 'react';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

interface CopilotChatProps {
    messages: Message[];
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 text-sm text-gray-200 rounded-2xl ${msg.role === 'ai'
                        ? 'bg-[#4DFFFF]/10 border border-[#4DFFFF]/20 rounded-tl-none shadow-[0_0_15px_rgba(77,255,255,0.05)]'
                        : 'bg-[#C0FF00]/10 border border-[#C0FF00]/20 rounded-tr-none text-right'
                        }`}>
                        <p>{msg.text}</p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};
