
import React from 'react';
const { ipcRenderer } = window.require('electron');

export const WindowControls: React.FC = () => {
    const handleMinimize = () => {
        ipcRenderer.send('minimize-window');
    };

    const handleMaximize = () => {
        ipcRenderer.send('maximize-window');
    };

    const handleClose = () => {
        ipcRenderer.send('close-window');
    };

    return (
        <div className="window-controls">
            <button className="win-btn minimize" onClick={handleMinimize} title="Minimize">
                <svg width="10" height="1" viewBox="0 0 10 1">
                    <path d="M0 0.5H10" stroke="currentColor" strokeWidth="1" />
                </svg>
            </button>
            <button className="win-btn maximize" onClick={handleMaximize} title="Maximize">
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" fill="none" strokeWidth="1" />
                </svg>
            </button>
            <button className="win-btn close" onClick={handleClose} title="Close">
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};
