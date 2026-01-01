import React, { useEffect, useRef } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

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

    // Custom components for Markdown rendering
    const markdownComponents: Components = {
        // Paragraphs: Add spacing and relaxed line height, and FORCE preserve whitespace
        p: ({ node, ...props }) => (
            <p {...props} className="mb-1.5 leading-relaxed whitespace-pre-wrap last:mb-0" />
        ),
        // Lists: proper indentation and styling
        ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-outside ml-5 mb-3 space-y-1" />
        ),
        ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-outside ml-5 mb-3 space-y-1" />
        ),
        // List items
        li: ({ node, ...props }) => (
            <li {...props} className="pl-1" />
        ),
        // Links: cyan color, hover underline, open in new tab
        a: ({ node, ...props }) => (
            <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:underline hover:text-cyan-300 transition-colors"
            />
        ),
        // Inline code
        code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className; // Simple heuristic for inline code

            if (isInline) {
                return (
                    <code {...props} className="bg-gray-800/50 px-1.5 py-0.5 rounded text-neon-cyan font-mono text-xs">
                        {children}
                    </code>
                );
            }
            return <code {...props} className={className}>{children}</code>;
        },
        // Blockquotes
        blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-4 border-gray-600 pl-4 py-1 my-3 bg-gray-800/30 italic text-gray-300 rounded-r" />
        )
    };

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
                        <div className="prose prose-invert prose-sm max-w-none break-words">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={markdownComponents}
                            >
                                {/* Force double line breaks for Markdown parsers to recognize paragraphs */}
                                {msg.text}
                            </ReactMarkdown>
                        </div>

                        {/* Timestamp (Hover only - handled by CSS usually, but structure kept) */}
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
