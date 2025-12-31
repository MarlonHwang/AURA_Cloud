import React, { useState } from 'react';
import { GeneratorView } from './Generator/GeneratorView';
import { BrowserView } from './Browser/BrowserView';

type activeTab = 'generator' | 'browser';

export const InspirationPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<activeTab>('generator');

    return (
        <div className="w-full h-full flex flex-col bg-[#111113] border-r border-[#2A2D33]">
            {/* Header / Tabs */}
            <div className="flex border-b border-[#2A2D33]">
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'generator'
                            ? 'text-[#4DFFFF] border-b-2 border-[#4DFFFF] bg-[#1e1e24]'
                            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1D]'
                        }`}
                    onClick={() => setActiveTab('generator')}
                >
                    Generator
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'browser'
                            ? 'text-[#4DFFFF] border-b-2 border-[#4DFFFF] bg-[#1e1e24]'
                            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1D]'
                        }`}
                    onClick={() => setActiveTab('browser')}
                >
                    Browser
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'generator' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <GeneratorView />
                </div>
                <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'browser' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <BrowserView />
                </div>
            </div>
        </div>
    );
};
