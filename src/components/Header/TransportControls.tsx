
import React from 'react';
import { useAudioStore } from '../../stores/audioStore';

export const TransportControls: React.FC = () => {
    const isPlaying = useAudioStore(state => state.isPlaying);
    const bpm = useAudioStore(state => state.bpm);
    const play = useAudioStore(state => state.play);
    const stop = useAudioStore(state => state.stop);
    const setBpm = useAudioStore(state => state.setBpm);

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
        </div>
    );
};
