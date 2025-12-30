
import React from 'react';

// Left Panel: Kit Select, Samples, Groove Extractor
export const StepSeqLeft: React.FC = () => {
    return (
        <div className="w-[260px] flex-shrink-0 border-r border-gray-800 p-4 flex flex-col gap-4 bg-[#121212]">

            {/* 1. Kit Select & Samples Row */}
            <div className="inspiration-header-row" style={{ display: 'flex', gap: '8px' }}>
                {/* Kit Selector */}
                <div className="mini-box kit-select-box" style={{ flex: 1 }}>
                    <div className="mini-box-label">Kit Select</div>
                    <div className="kit-dropdown-wrapper">
                        <select id="kit-select" className="kit-select-compact" defaultValue="synth">
                            <optgroup label="Synth Kits">
                                <option value="synth">Synth</option>
                            </optgroup>
                            <optgroup label="Sample Kits">
                                <option value="tr808">TR-808</option>
                                <option value="tr909">TR-909</option>
                                <option value="acoustic">Acoustic</option>
                                <option value="electronic">Electronic</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                {/* Samples Box */}
                <div className="mini-box samples-box" style={{ flex: 1 }}>
                    <div className="mini-box-label">Samples</div>
                    <div className="samples-trigger-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <span>Browse</span>
                    </div>
                </div>
            </div>

            {/* Sample Browser Overlay (Hidden by default, used by main.ts logic) */}
            <div id="sample-browser-overlay">
                <div className="browser-header">
                    <span>BROWSER</span>
                    <div style={{ flex: 1 }}></div>
                    <div className="browser-import-btn" title="Import Folder" style={{ cursor: 'pointer', marginRight: '10px', opacity: 0.7 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <div className="browser-close" style={{ cursor: 'pointer' }}>×</div>
                </div>
                <div className="browser-tree" id="browser-tree-content">
                    <div className="tree-item folder-item" data-path="packs">
                        <svg className="tree-icon" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                        Packs
                    </div>
                </div>
            </div>

            {/* 2. Groove Extractor Box */}
            <div className="inspiration-box groove-extractor-box flex-1 flex flex-col">
                <div className="box-header">
                    <div className="box-title">Groove Extractor</div>
                </div>
                <div className="box-content flex-1" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }}>
                    <div className="groove-split-controls">
                        <div className="groove-drop-mini" id="groove-drop-zone">
                            <svg className="groove-drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '24px', height: '24px', marginBottom: '5px', opacity: 0.7 }}>
                                <path d="M12 15V3m0 0L7 8m5-5l5 5" />
                                <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
                            </svg>
                            <div className="groove-drop-text" style={{ fontSize: '11px', textAlign: 'center', lineHeight: 1.2 }}>
                                <strong>Drop Audio</strong><br />
                                <span style={{ fontSize: '10px', opacity: 0.6 }}>or Browse</span>
                            </div>
                        </div>
                        <div className="groove-analyze-box">
                            <button className="groove-analyze-btn-large" id="groove-analyze-btn" disabled>
                                Analyze<br />Groove
                            </button>
                        </div>
                    </div>

                    <div className="groove-waveform" style={{ display: 'none' }}>
                        <canvas id="groove-waveform-canvas"></canvas>
                        <div className="groove-waveform-placeholder">NO AUDIO LOADED</div>
                    </div>

                    <div className="groove-controls-bottom" style={{ marginTop: 'auto' }}>
                        <div className="groove-slider-group">
                            <div className="groove-slider-label">
                                <span>Groove Amount</span>
                                <span id="groove-amount-value">0%</span>
                            </div>
                            <input type="range" className="groove-slider-input" id="groove-amount-slider" min="0" max="100" defaultValue="0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
