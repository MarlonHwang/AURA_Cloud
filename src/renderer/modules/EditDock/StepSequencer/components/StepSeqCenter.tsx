
import React, { useState, useEffect, useRef } from 'react';
import { useTimelineStore } from '../../../../modules/Timeline/store/useTimelineStore';
import { useAudioStore } from '../../../../stores/audioStore';

// Center Panel: Track Headers, Grid, Knobs, AND Action Buttons
// Critical Style Requirement: border-cyan-400 rounded-xl
export const StepSeqCenter: React.FC = () => {
    // Playback Logic
    const playbackMode = useTimelineStore((state: any) => state.playbackMode);
    const isPlaying = useTimelineStore((state: any) => state.isPlaying);
    const bpm = useAudioStore((state: any) => state.bpm) || 120;

    const [currentStep, setCurrentStep] = useState(-1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isPlaying && playbackMode === 'PATTERN') {
            // Start Visual Loop
            let step = 0;
            setCurrentStep(0);

            const msPerStep = (60 / bpm) * 1000 / 4; // 16th notes

            intervalRef.current = setInterval(() => {
                step = (step + 1) % 16;
                setCurrentStep(step);
            }, msPerStep);
        } else {
            // Stop Visual Loop
            if (intervalRef.current) clearInterval(intervalRef.current);
            setCurrentStep(-1);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, playbackMode, bpm]);

    return (
        <div className="flex-1 p-4 overflow-y-auto flex flex-col relative bg-[#181818] border border-cyan-400 rounded-xl">
            <div className="step-seq-container w-full h-full flex" style={{ padding: 0, margin: 0 }}>

                {/* 1. Track Headers (Left of Grid) */}
                <div className="step-seq-tracks-area w-[240px] flex-shrink-0 border-r border-[#333]">
                    <div className="step-seq-add-track" title="Add Track">
                        <div className="add-track-btn">
                            <svg className="add-track-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="step-seq-tracks">
                        {/* Kick */}
                        <div className="step-seq-track-header" data-track="kick">
                            <div className="smart-rand-btn" title="Smart Randomize">
                                <svg viewBox="0 0 24 24" className="dice-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                                </svg>
                                <span className="smart-rand-label">Smart Rand</span>
                            </div>
                            <span className="step-seq-track-name drum-pad-trigger" data-drum="kick" style={{ color: '#FF6B6B', cursor: 'pointer' }} title="Click to trigger Kick">Kick</span>
                        </div>
                        {/* Snare */}
                        <div className="step-seq-track-header" data-track="snare">
                            <div className="smart-rand-btn" title="Smart Randomize">
                                <svg viewBox="0 0 24 24" className="dice-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                                </svg>
                                <span className="smart-rand-label">Smart Rand</span>
                            </div>
                            <span className="step-seq-track-name" style={{ color: '#4DFFFF' }}>Snare</span>
                        </div>
                        {/* HiHat */}
                        <div className="step-seq-track-header" data-track="hihat">
                            <div className="smart-rand-btn" title="Smart Randomize">
                                <svg viewBox="0 0 24 24" className="dice-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                                </svg>
                                <span className="smart-rand-label">Smart Rand</span>
                            </div>
                            <span className="step-seq-track-name" style={{ color: '#4FD272' }}>Hi-Hat Closed</span>
                        </div>
                        {/* Perc */}
                        <div className="step-seq-track-header" data-track="perc">
                            <div className="smart-rand-btn" title="Smart Randomize">
                                <svg viewBox="0 0 24 24" className="dice-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                                </svg>
                                <span className="smart-rand-label">Smart Rand</span>
                            </div>
                            <span className="step-seq-track-name" style={{ color: '#D45FFF' }}>Perc</span>
                        </div>
                    </div>
                </div>

                {/* 2. Grid & Knobs (Flex-1) */}
                <div className="step-seq-grid-area flex-1 relative overflow-hidden">
                    <div className="pattern-drag-handle" title="Drag to Timeline -> 16 Steps=4Bars region create" draggable={true}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span className="drag-handle-label">DRAG PTN</span>
                    </div>

                    <div className="step-seq-ruler">
                        {[1, 2, 3, 4].map(beat => (
                            <div className="step-seq-ruler-beat" key={beat}>
                                <div className="ruler-tick"><span className="beat-label">{beat}</span></div>
                                <div className="ruler-tick"></div>
                                <div className="ruler-tick"></div>
                                <div className="ruler-tick"></div>
                            </div>
                        ))}
                        <div className="fx-labels-header">
                            <div className="fx-label-item">VOL</div>
                            <div className="fx-label-item">REV</div>
                            <div className="fx-label-item">DLY</div>
                            <div className="fx-label-item">CMP</div>
                        </div>
                    </div>

                    <div className="step-seq-grid-scroll">
                        <div className="wave-visualizer" id="waveVisualizer">
                            <svg id="wave-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="wave-neon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#4DFFFF', stopOpacity: 0 }} />
                                        <stop offset="50%" style={{ stopColor: '#4DFFFF', stopOpacity: 0.3 }} />
                                        <stop offset="100%" style={{ stopColor: '#4DFFFF', stopOpacity: 0 }} />
                                    </linearGradient>
                                    <filter id="wave-glow">
                                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <path id="wave-path" d="M0 50 L100 50" fill="none" stroke="url(#wave-neon-gradient)" strokeWidth="1.2" filter="url(#wave-glow)" style={{ opacity: 0.6, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
                            </svg>
                        </div>
                        <div className="step-seq-grid">
                            {/* Rows */}
                            <div className="step-seq-row" data-track="kick" data-color="#FF6B6B">
                                {[0, 4, 8, 12].map(start => (
                                    <div className="step-beat-group" key={start}>
                                        {[0, 1, 2, 3].map(offset => (
                                            <div key={start + offset}
                                                className={`step-cell ${[0, 4, 8, 12].includes(start + offset) ? 'active' : ''} ${currentStep === (start + offset) ? '!bg-white/30 !border-white' : ''}`}
                                                data-step={start + offset}>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div className="row-divider"></div>
                                <div className="fx-controls-group">
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Volume"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Reverb"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Delay"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Compressor"></div>
                                </div>
                            </div>

                            <div className="step-seq-row" data-track="snare" data-color="#4DFFFF">
                                {[0, 4, 8, 12].map(start => (
                                    <div className="step-beat-group" key={start}>
                                        {[0, 1, 2, 3].map(offset => (
                                            <div key={start + offset}
                                                className={`step-cell ${[4, 12].includes(start + offset) ? 'active' : ''} ${currentStep === (start + offset) ? '!bg-white/30 !border-white' : ''}`}
                                                data-step={start + offset}>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div className="row-divider"></div>
                                <div className="fx-controls-group">
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Volume"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Reverb"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Delay"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Compressor"></div>
                                </div>
                            </div>

                            <div className="step-seq-row" data-track="hihat" data-color="#4FD272">
                                {[0, 4, 8, 12].map(start => (
                                    <div className="step-beat-group" key={start}>
                                        {[0, 1, 2, 3].map(offset => (
                                            <div key={start + offset}
                                                className={`step-cell ${((start + offset) % 2 === 0) ? 'active' : ''} ${currentStep === (start + offset) ? '!bg-white/30 !border-white' : ''}`}
                                                data-step={start + offset}>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div className="row-divider"></div>
                                <div className="fx-controls-group">
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Volume"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Reverb"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Delay"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Compressor"></div>
                                </div>
                            </div>

                            <div className="step-seq-row" data-track="perc" data-color="#D45FFF">
                                {[0, 4, 8, 12].map(start => (
                                    <div className="step-beat-group" key={start}>
                                        {[0, 1, 2, 3].map(offset => (
                                            <div key={start + offset}
                                                className={`step-cell ${[14].includes(start + offset) ? 'active' : ''} ${currentStep === (start + offset) ? '!bg-white/30 !border-white' : ''}`}
                                                data-step={start + offset}>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div className="row-divider"></div>
                                <div className="fx-controls-group">
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Volume"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Reverb"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Delay"></div>
                                    <div className="fx-knob mini" style={{ '--val': '0%' } as any} title="Compressor"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Action Buttons (Drop/Steps) - INSIDE CYAN BOX, Far Right */}
                <div className="w-[120px] flex-shrink-0 border-l border-gray-700/50 p-2 flex flex-col gap-2 justify-center bg-gray-900/30">
                    <div className="flex justify-center gap-2 items-center flex-col">
                        {/* Drop Button */}
                        <div className="drop-btn-container led-highlight-btn cursor-grab active:cursor-grabbing" draggable={true} title="Drag to Track" style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/assets/images/drop_to_trk.png" className="w-8 h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex flex-col gap-1 w-full items-center">
                            {/* Drop Option */}
                            <div className="oled-display-container led-highlight-purple cursor-pointer h-6 w-24 bg-black border border-purple-500/30 rounded flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-shadow" onClick={() => {
                                const menu = document.getElementById('custom-drop-menu');
                                if (menu) menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
                            }}>
                                <span className="text-[9px] text-purple-400 font-mono" id="oled-text-display">Midi Merge</span>
                            </div>
                            <div id="custom-drop-menu" className="hidden absolute bg-black border border-purple-500/30 rounded-lg shadow-2xl p-1 z-50 flex-col gap-1 w-32 right-10 top-10">
                                <div className="px-2 py-1 text-[10px] text-purple-300 hover:bg-purple-900/30 cursor-pointer rounded">Midi Merge</div>
                                <div className="px-2 py-1 text-[10px] text-purple-300 hover:bg-purple-900/30 cursor-pointer rounded">Midi Split</div>
                                <div className="px-2 py-1 text-[10px] text-purple-300 hover:bg-purple-900/30 cursor-pointer rounded">Audio Mix</div>
                            </div>

                            {/* Step Count Toggle */}
                            <div className="step-toggle-btn step-count-toggle led-highlight-btn w-24 h-8 relative cursor-pointer group rounded overflow-hidden border border-gray-700/50" title="Toggle 16/32 Steps">
                                <img src="/assets/images/btn_16_steps.png" className="step-img-16 w-full h-full object-cover absolute top-0 left-0 transition-opacity group-[.expanded]:opacity-0" />
                                <img src="/assets/images/btn_32_steps.png" className="step-img-32 w-full h-full object-cover absolute top-0 left-0 opacity-0 transition-opacity group-[.expanded]:opacity-100" />
                                <span className="step-count-value hidden">16</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
