
import React from 'react';

export const ProjectMenu: React.FC = () => {
    return (
        <div className="header-left">
            <span className="project-name">Rain-Fi</span>
            <div className="undo-redo-group">
                <button className="undo-redo-btn" title="Undo">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 9h10c3.5 0 6 2.5 6 6s-2.5 6-6 6H8" />
                        <polyline points="7 5 3 9 7 13" />
                    </svg>
                </button>
                <button className="undo-redo-btn" title="Redo">
                    <svg viewBox="0 0 24 24">
                        <path d="M21 9H11c-3.5 0-6 2.5-6 6s2.5 6 6 6h5" />
                        <polyline points="17 5 21 9 17 13" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
