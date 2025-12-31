
import React from 'react';

export const GlobalActions: React.FC = () => {
    return (
        <div className="header-right">
            <button className="magic-mix-btn">Magic Mix</button>
            <button className="export-btn">Export</button>
            <button className="icon-btn" title="Mixer">
                <div className="mixer-icon">
                    <div className="mixer-bar"></div>
                    <div className="mixer-bar"></div>
                    <div className="mixer-bar"></div>
                    <div className="mixer-bar"></div>
                </div>
            </button>
            <button className="icon-btn" title="Project Meta">
                <div className="disc-icon"></div>
            </button>
        </div>
    );
};
