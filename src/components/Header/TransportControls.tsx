import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { useTimelineStore } from '../../modules/Timeline/store/useTimelineStore'; // Ensure correct path
import { Magnet } from 'lucide-react';

export const TransportControls: React.FC = () => {
    const isPlaying = useAudioStore(state => state.isPlaying);
    const bpm = useAudioStore(state => state.bpm);
    const play = useAudioStore(state => state.play);
    const stop = useAudioStore(state => state.stop);
    const setBpm = useAudioStore(state => state.setBpm);

    // Snap State (Global)
    const isSnapEnabled = useTimelineStore(state => state.isSnapEnabled);
    const snapInterval = useTimelineStore(state => state.snapInterval);
    const setSnapEnabled = useTimelineStore(state => state.setSnapEnabled);
    const setSnapInterval = useTimelineStore(state => state.setSnapInterval);

    const togglePlay = () => {
        if (isPlaying) {
            stop(); // Or pause if preferred, but user said toggle -> stop usually means full stop or pause? User said "Stop button: stop()". Play button: togglePlay().
            // Let's implement toggle logic: if playing, stop (or pause?). Standard DAW: Spacebar toggles Play/Stop. 
            // Button specifically says "Play". Usually Play button when playing restarts or pauses.
            // But here, I'll follow typical behaviour: if playing, stop.
            stop();
        } else {
            play();
        }
    };

    const handleStop = () => {
        stop();
    };

    return (
        <div className="header-center">
            <div className="transport-group">
                <button
                    className={`transport-btn play-btn ${isPlaying ? 'playing' : ''}`}
                    id="play-btn"
                    title="Play"
                    onClick={togglePlay}
                >
                    <div className="play-icon"></div>
                </button>
                <button
                    className="transport-btn stop-btn"
                    onClick={handleStop}
                >
                    <div className="stop-icon"></div>
                </button>
                <button className="rec-btn">
                    <div className="circle"></div>
                </button>
                <div className="transport-divider"></div>
                <div className="tempo-box">
                    <div className="bpm-control">
                        <span className="bpm-value" id="bpmValue">{bpm.toFixed(3)}</span>
                        <div className="bpm-arrows">
                            <button className="bpm-arrow" id="bpmUp" onClick={() => setBpm(bpm + 1)}>
                                <svg viewBox="0 0 10 6" fill="currentColor">
                                    <path d="M5 0L10 6H0L5 0Z" />
                                </svg>
                            </button>
                            <button className="bpm-arrow" id="bpmDown" onClick={() => setBpm(bpm - 1)}>
                                <svg viewBox="0 0 10 6" fill="currentColor">
                                    <path d="M5 6L0 0H10L5 6Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <span className="key-display">Key: C Major</span>
                </div>
            </div>
            {/* Metronome Button */}
            <button className="metronome-btn" id="metronomeBtn" title="Metronome (M)">
                <div className="metronome-icon">
                    <svg viewBox="0 0 24 24">
                        <path className="metro-body"
                            d="M8 21 L6.5 21 C6 21 5.7 20.7 5.8 20.2 L9.5 4.5 C9.7 3.8 10.3 3.5 11 3.5 L13 3.5 C13.7 3.5 14.3 3.8 14.5 4.5 L18.2 20.2 C18.3 20.7 18 21 17.5 21 L16 21"
                            strokeLinejoin="round" />
                        <rect className="metro-tick" x="11" y="8" width="2" height="1" rx="0.5" />
                        <rect className="metro-tick" x="11" y="11" width="2" height="1" rx="0.5" />
                        <rect className="metro-tick" x="11" y="14" width="2" height="1" rx="0.5" />
                        <g className="metro-pendulum-group">
                            <line className="metro-pendulum" x1="12" y1="6" x2="12" y2="18" />
                            <circle className="metro-weight" cx="12" cy="8" r="2" />
                        </g>
                    </svg>
                </div>
            </button>

            {/* SNAP CONTROLS (Positioned next to Metronome) */}
            <div className="snap-controls" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px', gap: '8px' }}>
                {/* 1. Snap Toggle (Magnet) */}
                <button
                    onClick={() => setSnapEnabled(!isSnapEnabled)}
                    className={`transport-btn snap-btn ${isSnapEnabled ? 'active' : ''}`}
                    style={{
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSnapEnabled ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                        border: isSnapEnabled ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: isSnapEnabled ? '#22d3ee' : '#6b7280'
                    }}
                    title="Toggle Snap"
                >
                    <Magnet size={18} />
                </button>

                {/* 2. Snap Interval Dropdown */}
                <div className="relative group">
                    <select
                        value={snapInterval}
                        onChange={(e) => setSnapInterval(e.target.value)}
                        style={{
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: isSnapEnabled ? '#22d3ee' : '#666',
                            fontSize: '11px',
                            padding: '2px 6px',
                            height: '24px',
                            outline: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                        disabled={!isSnapEnabled}
                    >
                        <option value="BAR">BAR</option>
                        <option value="BEAT">BEAT</option>
                        <option value="EVENT">EVENT</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
