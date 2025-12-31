import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const WindowControls: React.FC = () => {
    const handleAction = (action: string) => {
        try {
            // Use window.require for Electron IPC in nodeIntegration mode
            const { ipcRenderer } = (window as any).require('electron');
            ipcRenderer.send(action);
        } catch (error) {
            console.error("Electron IPC not available:", error);
        }
    };

    return (
        <div className="flex items-center gap-2 h-8 pl-4 ml-4 self-start" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
                onClick={() => handleAction('minimize-window')}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors focus:outline-none"
                title="Minimize"
            >
                <Minus size={16} />
            </button>
            <button
                onClick={() => handleAction('maximize-window')}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors focus:outline-none"
                title="Maximize"
            >
                <Square size={14} />
            </button>
            <button
                onClick={() => handleAction('close-window')}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-red-900/50 hover:text-red-200 rounded transition-colors focus:outline-none"
                title="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
};
